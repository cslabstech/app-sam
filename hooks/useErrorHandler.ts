import { log } from '@/utils/logger';
import { useCallback, useState } from 'react';

/**
 * Custom hook untuk error handling yang konsisten di seluruh aplikasi
 * Mengikuti best practice: centralized error handling, logging, UI-agnostic
 */
export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Handle error dengan logging dan formatting yang konsisten
   */
  const handleError = useCallback((err: any, context: string = 'Unknown') => {
    let errorMessage: string;

    if (err?.response?.data?.message) {
      // Error dari API response
      errorMessage = err.response.data.message;
    } else if (err?.response?.data?.meta?.message) {
      // Error dari API meta
      errorMessage = err.response.data.meta.message;
    } else if (err?.message) {
      // Error dengan message property
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      // Error berupa string
      errorMessage = err;
    } else {
      // Default error message
      errorMessage = 'Terjadi kesalahan yang tidak terduga';
    }

    // Log error untuk debugging
    log(`[ERROR - ${context}]`, {
      error: err,
      message: errorMessage,
      stack: err?.stack,
      timestamp: new Date().toISOString(),
    });

    setError(errorMessage);
    return errorMessage;
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Wrapper untuk async operations dengan error handling
   */
  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string = 'Operation'
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    setLoading(true);
    clearError();

    try {
      const result = await operation();
      log(`[SUCCESS - ${context}]`, result);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = handleError(err, context);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  /**
   * Format error untuk display di UI
   */
  const formatErrorForUI = useCallback((err: any): string => {
    if (err?.response?.status === 401) {
      return 'Sesi Anda telah berakhir. Silakan login kembali.';
    }
    if (err?.response?.status === 403) {
      return 'Anda tidak memiliki akses untuk melakukan tindakan ini.';
    }
    if (err?.response?.status === 404) {
      return 'Data yang dicari tidak ditemukan.';
    }
    if (err?.response?.status === 500) {
      return 'Terjadi kesalahan server. Silakan coba lagi nanti.';
    }
    if (err?.code === 'NETWORK_ERROR' || err?.message?.includes('Network')) {
      return 'Periksa koneksi internet Anda dan coba lagi.';
    }
    
    return handleError(err, 'UI Display');
  }, [handleError]);

  return {
    error,
    loading,
    handleError,
    clearError,
    withErrorHandling,
    formatErrorForUI,
  };
} 