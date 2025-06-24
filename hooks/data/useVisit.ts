import { useAuth } from '@/context/auth-context';
import { BaseResponse, apiRequest } from '@/utils/api';
import { log } from '@/utils/logger';
import { useCallback, useState } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

// Types for Visit API
export interface Visit {
  id: string | number;
  visit_date: string;
  checkin_time: string | null;
  checkout_time: string | null;
  checkin_location: string | null;
  checkout_location: string | null;
  checkin_photo: string | null;
  checkout_photo: string | null;
  type: string;
  transaction: string | null;
  report: string | null;
  duration: number | null;
  outlet: {
    id: string | number;
    code: string;
    name: string;
    owner_name: string;
    address: string;
    badan_usaha: {
      id: string | number;
      name: string;
    };
    division: {
      id: string | number;
      name: string;
    };
    region: {
      id: string | number;
      name: string;
    };
    cluster: {
      id: string | number;
      name: string;
    };
  };
  user: {
    id: string | number;
    name: string;
    username: string;
    role?: {
      id: string | number;
      name: string;
    };
  };
}

// Interface untuk response visit list dengan pagination
export interface VisitListResponse extends BaseResponse<Visit[]> {}

// Interface untuk response single visit
export interface VisitResponse extends BaseResponse<Visit> {}

// Interface untuk response check visit status
export interface VisitStatus {
  outlet_id: string | number;
  has_active_visit: boolean;
  today_visit_count: number;
  last_visit_date?: string;
  can_checkin: boolean;
  message?: string;
}

export interface VisitStatusResponse extends BaseResponse<VisitStatus> {}

export interface VisitListParams {
  per_page?: number;
  page?: number;
  search?: string;
  'filters[date]'?: string;
  'filters[month]'?: number;
  'filters[type]'?: string | string[];
  sort_column?: string;
  sort_direction?: string;
}

export function useVisit() {
  const { token } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get list of visits
  const fetchVisits = useCallback(async (params: VisitListParams = {}) => {
    setLoading(true);
    setError(null);
    log('[FETCH_VISITS] params', params);
    try {
      const query = new URLSearchParams();
      if (params.per_page) query.append('per_page', String(params.per_page));
      if (params.page) query.append('page', String(params.page));
      if (params.search) query.append('search', params.search);
      if (params['filters[date]']) query.append('filters[date]', params['filters[date]']);
      if (params['filters[month]']) query.append('filters[month]', String(params['filters[month]']));
      if (params['filters[type]']) {
        if (Array.isArray(params['filters[type]'])) {
          params['filters[type]'].forEach(type => query.append('filters[type][]', type));
        } else {
          query.append('filters[type]', params['filters[type]']);
        }
      }
      if (params.sort_column) query.append('sort_column', params.sort_column);
      else query.append('sort_column', 'visit_date');
      if (params.sort_direction) query.append('sort_direction', params.sort_direction);
      else query.append('sort_direction', 'desc');

      log('[FETCH_VISITS] query', query.toString());
      
      const queryString = query.toString();
      const url = `${BASE_URL}/visits${queryString ? `?${queryString}` : ''}`;

      const json: VisitListResponse = await apiRequest({
        url,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_VISITS',
        token
      });
      
      if (Array.isArray(json.data)) {
        setVisits(json.data);
        setMeta(json.meta);
        return { success: true, data: json.data, meta: json.meta };
      } else {
        setError('Invalid data format in response');
        return { success: false, error: 'Invalid data format in response' };
      }
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch visits';
      setError(errorMessage);
      log('[FETCH_VISITS] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Ambil detail visit satuan
  const fetchVisit = useCallback(async (visitId: string) => {
    setLoading(true);
    setError(null);
    log('[FETCH_VISIT] visitId', visitId);
    try {
      const json: VisitResponse = await apiRequest({
        url: `${BASE_URL}/visits/${visitId}`,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_VISIT',
        token
      });
      
      return { success: true, data: json.data, meta: json.meta };
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch visit detail';
      setError(errorMessage);
      log('[FETCH_VISIT] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Check-in Visit (store) - using FormData for file uploads
  const checkInVisit = async (formData: FormData) => {
    log('[CHECK_IN_VISIT] formData', formData);
    try {
      const json = await apiRequest({
        url: `${BASE_URL}/visits`,
        method: 'POST',
        body: formData,
        logLabel: 'CHECK_IN_VISIT',
        token
      });
      
      return json;
    } catch (e: any) {
      log('[CHECK_IN_VISIT] error:', e.message || 'Check-in failed');
      throw e;
    }
  };

  // Check-out Visit (update) - using PUT method with FormData for file uploads
  const checkOutVisit = async (visitId: string, formData: FormData) => {
    log('[CHECK_OUT_VISIT] params', { visitId, formData });
    try {
      const json = await apiRequest({
        url: `${BASE_URL}/visits/${visitId}`,
        method: 'PUT',
        body: formData,
        logLabel: 'CHECK_OUT_VISIT',
        token
      });
      
      return json;
    } catch (e: any) {
      log('[CHECK_OUT_VISIT] error:', e.message || 'Check-out failed');
      throw e;
    }
  };

  // Cek status visit/check-in/check-out outlet
  const checkVisitStatus = async (outletId: string) => {
    log('[GET_VISIT_STATUS] outletId', outletId);
    if (!outletId) {
      log('[GET_VISIT_STATUS] error: Outlet ID tidak valid');
      return { success: false, error: 'Outlet ID tidak valid' };
    }

    try {
      const json: VisitStatusResponse = await apiRequest({
        url: `${BASE_URL}/visits/check?outlet_id=${encodeURIComponent(outletId)}`,
        method: 'GET',
        body: null,
        logLabel: 'GET_VISIT_STATUS',
        token
      });
      
      return { success: true, data: json.data, meta: json.meta };
      
    } catch (e: any) {
      const errorMessage = e.message || 'Gagal memeriksa status kunjungan';
      log('[GET_VISIT_STATUS] error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Delete visit
  const deleteVisit = useCallback(async (visitId: string) => {
    setLoading(true);
    setError(null);
    log('[DELETE_VISIT] visitId', visitId);
    try {
      const json = await apiRequest({
        url: `${BASE_URL}/visits/${visitId}`,
        method: 'DELETE',
        body: null,
        logLabel: 'DELETE_VISIT',
        token
      });
      
      return { success: true, data: json.data, meta: json.meta };
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to delete visit';
      setError(errorMessage);
      log('[DELETE_VISIT] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { 
    visits, 
    meta, 
    loading, 
    error, 
    fetchVisits, 
    fetchVisit, 
    checkInVisit, 
    checkOutVisit, 
    checkVisitStatus,
    deleteVisit
  };
}
