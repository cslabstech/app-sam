import { log } from '@/utils/logger';
import { createApiError, getErrorMessage, logError } from '@/utils/error-handler';
import type { ApiResponse, ApiError } from '@/types/common';

// Auto logout callback - will be set by AuthProvider
let autoLogoutCallback: (() => void) | null = null;

// Function to set auto logout callback
export const setAutoLogoutCallback = (callback: () => void) => {
    autoLogoutCallback = callback;
};

// Legacy BaseResponse interface for backward compatibility
// @deprecated Use ApiResponse from types/common.ts instead
export interface BaseResponse<T = any> {
    meta: {
        code: number;
        status: 'success' | 'error';
        message: string;
        // For paginated response
        current_page?: number;
        last_page?: number;
        total?: number;
        per_page?: number;
    };
    data: T;
    errors?: any; // For error response
}

// API configuration constants
const API_CONFIG = {
    timeout: 10000, // 10 seconds timeout
    uploadTimeout: 30000, // 30 seconds for file uploads
} as const;

/**
 * Request configuration interface
 */
interface ApiRequestConfig {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    logLabel: string;
    token?: string | null;
    timeout?: number;
    headers?: Record<string, string>;
}

/**
 * Helper function for timeout wrapper
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
    ]);
}

/**
 * Handle API errors with standardized error processing
 */
function handleApiError(response: Response, data: any, logLabel: string, url: string): never {
    const isLogoutEndpoint = url.includes('/logout') || logLabel === 'LOGOUT';
    
    let errorMessage = data?.meta?.message || 'Request failed';
    
    // Handle specific HTTP status codes
    if (response.status === 401) {
        errorMessage = 'Token is invalid or expired. Please login again.';
        
        // Auto logout for 401 errors - EXCEPT for logout endpoint
        if (autoLogoutCallback && !isLogoutEndpoint) {
            log('[API] Auto logout triggered due to 401 error');
            setTimeout(() => autoLogoutCallback!(), 100);
        }
    } else if (response.status === 403) {
        errorMessage = 'You do not have permission to access this resource.';
        
        // Auto logout for 403 errors - EXCEPT for logout endpoint
        if (autoLogoutCallback && !isLogoutEndpoint) {
            log('[API] Auto logout triggered due to 403 error');
            setTimeout(() => autoLogoutCallback!(), 100);
        }
    } else if (data?.meta?.code === 422 && data?.errors) {
        // Handle validation errors
        const errorDetails = Object.values(data.errors).flat().join(', ');
        errorMessage += `: ${errorDetails}`;
    } else if (data?.errors) {
        // Handle other errors
        const errorDetails = Object.values(data.errors).flat().join(', ');
        errorMessage += `: ${errorDetails}`;
    }
    
    // Create standardized error object
    const apiError = createApiError(
        data?.meta?.code || response.status,
        errorMessage
    );
    
    // Add additional metadata
    (apiError as any).status = data?.meta?.status || 'error';
    (apiError as any).errors = data?.errors;
    (apiError as any).data = data?.data;
    (apiError as any).httpStatus = response.status;
    
    logError(apiError, logLabel);
    
    const error = new Error(errorMessage);
    Object.assign(error, apiError);
    throw error;
}

/**
 * Main API client function with standardized error handling and timeout
 * Follows KISS principles with clean separation of concerns
 */
export async function apiRequest(config: ApiRequestConfig): Promise<any> {
    const {
        url,
        method = 'POST',
        body,
        logLabel,
        token,
        timeout = API_CONFIG.timeout,
        headers: customHeaders
    } = config;

    log(`[${logLabel}] Request:`, { 
        url, 
        method, 
        bodyType: body instanceof FormData ? 'FormData' : typeof body 
    });
    
    // Determine if body is FormData
    const isFormData = body instanceof FormData;
    
    // Build headers
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(customHeaders || {}),
    };
    
    // Set Content-Type only for JSON (let browser handle FormData)
    if (!isFormData && !customHeaders?.['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    
    // Build fetch configuration
    const fetchConfig: RequestInit = {
        method,
        headers,
    };
    
    // Handle request body based on type
    if (body) {
        if (isFormData) {
            fetchConfig.body = body;
            log(`[${logLabel}] Using FormData (multipart/form-data)`);
        } else {
            fetchConfig.body = JSON.stringify(body);
            log(`[${logLabel}] Using JSON (application/json)`);
        }
    }
    
    try {
        // Execute request with timeout
        const response = await withTimeout(fetch(url, fetchConfig), timeout);
        log(`[${logLabel}] Response status:`, response.status);
        
        const data = await response.json();
        log(`[${logLabel}] Response body:`, data);
        
        // Validate response according to ResponseFormatter
        if (!response.ok || data?.meta?.status !== 'success' || data?.meta?.code !== 200) {
            handleApiError(response, data, logLabel, url);
        }
        
        return data;
    } catch (error) {
        // Re-throw API errors, handle unexpected errors
        if (error instanceof Error && (error as any).code) {
            throw error;
        }
        
        const standardError = createApiError(
            500,
            getErrorMessage(error)
        );
        
        logError(error, logLabel);
        throw standardError;
    }
}

/**
 * Helper function specifically for FormData/file upload
 * Uses longer timeout for file uploads
 */
export async function uploadFile(config: {
    url: string;
    method?: 'POST' | 'PUT' | 'PATCH';
    formData: FormData;
    logLabel: string;
    token?: string | null;
    timeout?: number;
}): Promise<any> {
    const {
        url,
        method = 'POST',
        formData,
        logLabel,
        token,
        timeout = API_CONFIG.uploadTimeout
    } = config;

    return apiRequest({
        url,
        method,
        body: formData,
        logLabel,
        token,
        timeout
    });
} 