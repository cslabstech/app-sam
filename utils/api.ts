import { log } from '@/utils/logger';

// Base response interface sesuai ResponseFormatter Laravel - GLOBAL UTILS
export interface BaseResponse<T = any> {
    meta: {
        code: number;
        status: 'success' | 'error';
        message: string;
        // Untuk paginated response
        current_page?: number;
        last_page?: number;
        total?: number;
        per_page?: number;
    };
    data: T;
    errors?: any; // Untuk error response
}

// Production-ready configuration
const API_CONFIG = {
    timeout: 30000, // 30 seconds timeout
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    retryStatusCodes: [408, 429, 500, 502, 503, 504], // Retry on these status codes
};

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

// Helper function untuk create cache key
function createCacheKey(url: string, method: string, body: any): string {
    const bodyKey = body instanceof FormData ? 'FormData' : JSON.stringify(body);
    return `${method}:${url}:${bodyKey}`;
}

// Helper function untuk timeout wrapper
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
    ]);
}

// Helper function untuk retry logic
async function withRetry<T>(
    operation: () => Promise<T>,
    attempts: number = API_CONFIG.retryAttempts,
    delay: number = API_CONFIG.retryDelay
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (attempts <= 1) {
            throw error;
        }

        // Check if error is retryable
        const isRetryable = 
            error?.httpStatus && API_CONFIG.retryStatusCodes.includes(error.httpStatus) ||
            error?.message?.includes('Network') ||
            error?.message?.includes('timeout') ||
            error?.message?.includes('fetch');

        if (!isRetryable) {
            throw error;
        }

        log(`[RETRY] Attempt ${API_CONFIG.retryAttempts - attempts + 1}/${API_CONFIG.retryAttempts}:`, error.message);
        
        // Exponential backoff
        const backoffDelay = delay * Math.pow(2, API_CONFIG.retryAttempts - attempts);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        
        return withRetry(operation, attempts - 1, delay);
    }
}

// Main API client function - PRODUCTION READY with timeout, retry, deduplication
export async function apiRequest({ 
    url, 
    method = 'POST', 
    body, 
    logLabel,
    token,
    skipCache = false,
    timeout = API_CONFIG.timeout,
    retry = true
}: { 
    url: string, 
    method?: string, 
    body?: any, 
    logLabel: string,
    token?: string | null,
    skipCache?: boolean, // Skip request deduplication
    timeout?: number,    // Custom timeout
    retry?: boolean      // Enable/disable retry
}): Promise<any> {
    // Request deduplication untuk GET requests (kecuali di-skip)
    const cacheKey = createCacheKey(url, method, body);
    if (!skipCache && method === 'GET' && requestCache.has(cacheKey)) {
        log(`[${logLabel}] Using cached request:`, cacheKey);
        return requestCache.get(cacheKey)!;
    }

    const executeRequest = async (): Promise<any> => {
        log(`[${logLabel}] Request:`, { url, method, bodyType: body instanceof FormData ? 'FormData' : typeof body });
        
        // Auto-detect content type berdasarkan body type
        const isFormData = body instanceof FormData;
        
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };
        
        // Hanya set Content-Type untuk JSON, biarkan browser handle FormData
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        const fetchConfig: RequestInit = {
            method,
            headers,
        };
        
        // Handle body berdasarkan type
        if (body) {
            if (isFormData) {
                // FormData - biarkan browser set Content-Type dengan boundary
                fetchConfig.body = body;
                log(`[${logLabel}] Using FormData (multipart/form-data)`);
            } else {
                // JSON - stringify dan set Content-Type
                fetchConfig.body = JSON.stringify(body);
                log(`[${logLabel}] Using JSON (application/json)`);
            }
        }
        
        // Add timeout to fetch request
        const res = await withTimeout(fetch(url, fetchConfig), timeout);
        log(`[${logLabel}] Response status:`, res.status);
        
        const data = await res.json();
        log(`[${logLabel}] Response body:`, data);
        
        // Validasi response sesuai ResponseFormatter
        if (!res.ok || data?.meta?.status !== 'success' || data?.meta?.code !== 200) {
            log(`[${logLabel}] Failed:`, {
                httpStatus: res.status,
                metaCode: data?.meta?.code,
                metaStatus: data?.meta?.status,
                message: data?.meta?.message,
                errors: data?.errors
            });
            
            // Buat error message yang informatif
            let errorMessage = data?.meta?.message || 'Request gagal';
            
            // Tambahkan detail errors jika ada (untuk validation errors)
            if (data?.errors) {
                const errorDetails = Object.values(data.errors).flat().join(', ');
                errorMessage += `: ${errorDetails}`;
            }
            
            const error = new Error(errorMessage);
            // Tambahkan metadata error untuk handling yang lebih spesifik
            (error as any).code = data?.meta?.code || res.status;
            (error as any).status = data?.meta?.status || 'error';
            (error as any).errors = data?.errors;
            (error as any).httpStatus = res.status;
            
            throw error;
        }
        return data;
    };

    // Execute with retry if enabled
    const requestPromise = retry ? withRetry(executeRequest) : executeRequest();

    // Cache GET requests
    if (!skipCache && method === 'GET') {
        requestCache.set(cacheKey, requestPromise);
        
        // Clean up cache after request completes (success or failure)
        requestPromise.finally(() => {
            setTimeout(() => requestCache.delete(cacheKey), 60000); // Cache cleanup after 1 minute
        });
    }

    return requestPromise;
}

// Helper function khusus untuk FormData/file upload
export async function uploadFile({ 
    url, 
    method = 'POST', 
    formData, 
    logLabel,
    token,
    timeout = 60000 // Longer timeout for file uploads
}: { 
    url: string, 
    method?: string, 
    formData: FormData, 
    logLabel: string,
    token?: string | null,
    timeout?: number
}): Promise<any> {
    return apiRequest({
        url,
        method,
        body: formData,
        logLabel,
        token,
        skipCache: true, // Never cache file uploads
        timeout,
        retry: false     // Don't retry file uploads
    });
} 