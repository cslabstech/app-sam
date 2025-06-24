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
    timeout: 10000, // 10 seconds timeout
};

// Helper function untuk timeout wrapper
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
    ]);
}

// Main API client function - PRODUCTION READY with timeout (no retry)
export async function apiRequest({ 
    url, 
    method = 'POST', 
    body, 
    logLabel,
    token,
    timeout = API_CONFIG.timeout
}: { 
    url: string, 
    method?: string, 
    body?: any, 
    logLabel: string,
    token?: string | null,
    timeout?: number     // Custom timeout
}): Promise<any> {
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
                // Field errors are in errors property for validation errors (422)
                validationErrors: data?.meta?.code === 422 ? data?.errors : null,
                // For other errors, check errors property
                errors: data?.errors
            });
            
            // Buat error message yang informatif
            let errorMessage = data?.meta?.message || 'Request gagal';
            
            // Handle validation errors (422) - field errors are in errors property
            if (data?.meta?.code === 422 && data?.errors) {
                const errorDetails = Object.values(data.errors).flat().join(', ');
                errorMessage += `: ${errorDetails}`;
            }
            // Handle other errors - errors might be in errors property
            else if (data?.errors) {
                const errorDetails = Object.values(data.errors).flat().join(', ');
                errorMessage += `: ${errorDetails}`;
            }
            
            const error = new Error(errorMessage);
            // Tambahkan metadata error untuk handling yang lebih spesifik
            (error as any).code = data?.meta?.code || res.status;
            (error as any).status = data?.meta?.status || 'error';
            // Field errors are always in errors property
            (error as any).errors = data?.errors;
            (error as any).data = data?.data; // Also preserve original data
            (error as any).httpStatus = res.status;
            
            throw error;
        }
        return data;
    };

    // Execute request directly (no retry)
    return executeRequest();
}

// Helper function khusus untuk FormData/file upload
export async function uploadFile({ 
    url, 
    method = 'POST', 
    formData, 
    logLabel,
    token,
    timeout = 30000 // Longer timeout for file uploads
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
        timeout
    });
} 