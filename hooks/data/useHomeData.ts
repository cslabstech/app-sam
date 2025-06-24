import { log } from '@/utils/logger';
import { useCallback, useEffect, useState } from 'react';
import { useVisit } from './useVisit';

/**
 * Custom hook untuk menangani data dan logic di Home Screen
 * Mengikuti best practice: UI-agnostic, reusable, handle loading/error/success state
 */
export function useHomeData() {
  const { fetchVisits } = useVisit();
  const [todayVisits, setTodayVisits] = useState<any[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Format tanggal hari ini ke format yyyy-mm-dd
   */
  const getTodayDateString = useCallback(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  /**
   * Fetch visits untuk hari ini
   */
  const fetchTodayVisits = useCallback(async () => {
    setLoadingVisits(true);
    setError(null);
    
    try {
      const todayStr = getTodayDateString();
      log('[useHomeData] Fetching visits for today:', todayStr);
      
      const result = await fetchVisits({ 'filters[date]': todayStr });
      
      if (result.success) {
        setTodayVisits(result.data || []);
        log('[useHomeData] Successfully fetched today visits:', result.data?.length || 0);
      } else {
        setError(result.error || 'Failed to fetch today visits');
        log('[useHomeData] Failed to fetch today visits:', result.error);
      }
    } catch (err: any) {
      // Parse error sesuai StandardResponse format
      let errorMessage = 'Unexpected error occurred';
      if (err?.response?.data?.meta?.message) {
        errorMessage = err.response.data.meta.message;
      } else if (err?.meta?.message) {
        errorMessage = err.meta.message;
      } else if (err?.code === 'NETWORK_ERROR' || err?.message?.includes('Network')) {
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
      }
      
      setError(errorMessage);
      log('[useHomeData] Exception while fetching today visits:', err);
    } finally {
      setLoadingVisits(false);
    }
  }, [fetchVisits, getTodayDateString]);

  /**
   * Refresh data - dapat dipanggil dari UI
   */
  const refreshData = useCallback(async () => {
    log('[useHomeData] Refreshing home data');
    await fetchTodayVisits();
  }, [fetchTodayVisits]);

  /**
   * Load initial data saat hook pertama kali digunakan
   */
  useEffect(() => {
    fetchTodayVisits();
  }, [fetchTodayVisits]);

  return {
    // Data
    todayVisits,
    loadingVisits,
    error,
    
    // Actions
    refreshData,
    
    // Utilities
    getTodayDateString,
  };
} 