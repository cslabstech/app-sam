import { log } from '@/utils/logger';
import { useCallback, useState } from 'react';

// Interface untuk standard response format sesuai foundation.md
interface StandardErrorResponse {
  meta: {
    code: number;
    status: 'error';
    message: string;
  };
  data: null;
  errors?: Record<string, string[]>; // Field validation errors
}

// Interface untuk error result dengan field errors
interface ErrorResult {
  message: string;
  code?: number;
  status?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Custom hook untuk error handling yang konsisten di seluruh aplikasi
 * HANYA menggunakan format StandardResponse sesuai foundation.md
 * Tidak mendukung format response lama - semua error harus mengikuti format baru
 */
export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Parse error response sesuai format StandardResponse dari foundation.md
   */
  const parseErrorResponse = useCallback((err: any): ErrorResult => {
    // Check if this is a standard API response error (from axios response)
    if (err?.response?.data?.meta) {
      const response: StandardErrorResponse = err.response.data;
      return {
        message: response.meta.message || 'Terjadi kesalahan pada server',
        code: response.meta.code,
        status: response.meta.status,
        fieldErrors: response.errors || undefined
      };
    }

    // Check for direct meta object (from apiRequest atau error yang sudah di-parse)
    if (err?.meta) {
      return {
        message: err.meta.message || 'Terjadi kesalahan pada server',
        code: err.meta.code,
        status: err.meta.status,
        fieldErrors: err.errors || undefined
      };
    }

    // Handle network errors explicitly
    if (err?.code === 'NETWORK_ERROR' || 
        err?.message?.includes('Network') || 
        err?.message?.includes('fetch') ||
        err?.name === 'TypeError') {
      return {
        message: 'Periksa koneksi internet Anda dan coba lagi.',
        code: 0, // Network error code
        status: 'network_error'
      };
    }

    // Jika tidak mengikuti format standard, kembalikan error default
    log('[ERROR] Non-standard error format detected:', err);
    return { 
      message: 'Terjadi kesalahan yang tidak terduga. Format error tidak dikenali.',
      code: 500,
      status: 'unknown_error'
    };
  }, []);

  /**
   * Handle error dengan parsing dan formatting yang konsisten
   */
  const handleError = useCallback((err: any, context: string = 'Unknown') => {
    const parsedError = parseErrorResponse(err);

    // Log error untuk debugging
    log(`[ERROR - ${context}]`, {
      error: err,
      parsedMessage: parsedError.message,
      code: parsedError.code,
      status: parsedError.status,
      fieldErrors: parsedError.fieldErrors,
      originalError: err?.response?.data || err,
      stack: err?.stack,
      timestamp: new Date().toISOString(),
    });

    setError(parsedError.message);
    setFieldErrors(parsedError.fieldErrors || null);
    
    return {
      message: parsedError.message,
      fieldErrors: parsedError.fieldErrors
    };
  }, [parseErrorResponse]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setFieldErrors(null);
  }, []);

  /**
   * Wrapper untuk async operations dengan error handling yang enhanced
   */
  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string = 'Operation'
  ): Promise<{ 
    success: boolean; 
    data?: T; 
    error?: string; 
    fieldErrors?: Record<string, string[]> 
  }> => {
    setLoading(true);
    clearError();

    try {
      const result = await operation();
      log(`[SUCCESS - ${context}]`, result);
      return { success: true, data: result };
    } catch (err) {
      const errorResult = handleError(err, context);
      return { 
        success: false, 
        error: errorResult.message,
        fieldErrors: errorResult.fieldErrors
      };
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  /**
   * Format error untuk display di UI berdasarkan meta.code dan meta.status
   */
  const formatErrorForUI = useCallback((err: any): string => {
    const parsedError = parseErrorResponse(err);
    
    // Handle berdasarkan HTTP status code dari meta.code
    switch (parsedError.code) {
      case 0:
        // Network errors (sudah di-handle di parseErrorResponse)
        return parsedError.message;
      case 401:
        return 'Sesi Anda telah berakhir. Silakan login kembali.';
      case 403:
        return 'Anda tidak memiliki akses untuk melakukan tindakan ini.';
      case 404:
        return 'Data yang dicari tidak ditemukan.';
      case 422:
        // Validation errors - return main message, field errors handled separately
        return parsedError.message || 'Data yang Anda masukkan tidak valid.';
      case 429:
        return 'Terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Terjadi kesalahan server. Silakan coba lagi nanti.';
      default:
        // Return parsed message untuk semua cases lainnya
        return parsedError.message;
    }
  }, [parseErrorResponse]);

  /**
   * Get field error message untuk specific field (untuk validation errors)
   */
  const getFieldError = useCallback((fieldName: string): string | null => {
    if (!fieldErrors || !fieldErrors[fieldName]) {
      return null;
    }
    
    // Return first error message for the field
    return fieldErrors[fieldName][0] || null;
  }, [fieldErrors]);

  /**
   * Check if current error is validation error (422)
   */
  const isValidationError = useCallback((err?: any): boolean => {
    if (err) {
      const parsed = parseErrorResponse(err);
      return parsed.code === 422 && !!parsed.fieldErrors;
    }
    return !!fieldErrors;
  }, [parseErrorResponse, fieldErrors]);

  return {
    error,
    fieldErrors,
    loading,
    handleError,
    clearError,
    withErrorHandling,
    formatErrorForUI,
    getFieldError,
    isValidationError,
    parseErrorResponse,
  };
} 