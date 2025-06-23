import { useAuth } from '@/context/auth-context';
import { BaseResponse, apiRequest } from '@/utils/api';
import { log } from '@/utils/logger';
import { useCallback, useState } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

// Types for Visit API
export interface Visit {
  id: string;
  visit_date: string;
  user_id: number;
  outlet_id: number;
  type: string;
  checkin_time: string | null;
  checkout_time: string | null;
  outlet: {
    id: number;
    code: string;
    name: string;
    district: string;
    status: string;
    radius: number;
    location: string;
  };
  user: {
    id: number;
    name: string;
    username: string;
    tm_id?: string;
    role?: string;
  };
}

// Interface untuk response visit list dengan pagination
export interface VisitListResponse extends BaseResponse<Visit[]> {}

// Interface untuk response single visit
export interface VisitResponse extends BaseResponse<Visit> {}

// Interface untuk response check visit status
export interface VisitStatus {
  outlet_id: string;
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
    log('[VISIT] fetchVisits params', params);
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

      log('[VISIT] fetchVisits query', query.toString());
      
      const queryString = query.toString();
      const url = `${BASE_URL}/visit${queryString ? `?${queryString}` : ''}`;

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
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch visits';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Ambil detail visit satuan
  const fetchVisit = useCallback(async (visitId: string) => {
    setLoading(true);
    setError(null);
    log('[VISIT] fetchVisit visitId', visitId);
    try {
      const json: VisitResponse = await apiRequest({
        url: `${BASE_URL}/visit/${visitId}`,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_VISIT',
        token
      });
      
      return { success: true, data: json.data, meta: json.meta };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch visit detail';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Check-in Visit (store) - using FormData for file uploads
  const checkInVisit = async (formData: FormData) => {
    log('[USER VISIT] Check-in', formData);
    try {
      const json = await apiRequest({
        url: `${BASE_URL}/visit`,
        method: 'POST',
        body: formData,
        logLabel: 'CHECK_IN_VISIT',
        token
      });
      
      return json;
    } catch (e) {
      log('[USER VISIT] Check-in error', e);
      throw e;
    }
  };

  // Check-out Visit (update) - using FormData for file uploads
  const checkOutVisit = async (visitId: string, formData: FormData) => {
    log('[USER VISIT] Check-out', { visitId, formData });
    try {
      const json = await apiRequest({
        url: `${BASE_URL}/visit/${visitId}`,
        method: 'POST',
        body: formData,
        logLabel: 'CHECK_OUT_VISIT',
        token
      });
      
      return json;
    } catch (e) {
      log('[USER VISIT] Check-out error', e);
      throw e;
    }
  };

  // Cek status visit/check-in/check-out outlet
  const checkVisitStatus = async (outletId: string) => {
    log('[VISIT] checkVisitStatus outletId', outletId);
    if (!outletId) {
      log('[VISIT] checkVisitStatus error: Outlet ID tidak valid');
      return { success: false, error: 'Outlet ID tidak valid' };
    }

    try {
      const json: VisitStatusResponse = await apiRequest({
        url: `${BASE_URL}/visit/check?outlet_id=${encodeURIComponent(outletId)}`,
        method: 'GET',
        body: null,
        logLabel: 'GET_VISIT_STATUS',
        token
      });
      
      return { success: true, data: json.data, meta: json.meta };
      
    } catch (e: any) {
      log(`[VISIT] checkVisitStatus failed:`, { 
        httpStatus: e?.httpStatus, 
        code: e?.code, 
        message: e?.message 
      });
      
      // Handle different error types
      if (e?.code === 400) {
        // This is expected for business logic errors (already visited, etc.)
        return { 
          success: false, 
          error: e?.message || 'Gagal memeriksa status kunjungan',
          meta: { code: e?.code, status: e?.status, message: e?.message }
        };
      } else if (e?.httpStatus === 404) {
        return { 
          success: false, 
          error: 'Endpoint tidak ditemukan',
          meta: { code: 404, status: 'error', message: 'Endpoint tidak ditemukan' }
        };
      } else {
        const errorMessage = e instanceof Error ? e.message : 'Failed to check visit status';
        return { 
          success: false, 
          error: errorMessage,
          meta: { code: e?.code || 500, status: 'error', message: errorMessage }
        };
      }
    }
  };

  return { visits, meta, loading, error, fetchVisits, fetchVisit, checkInVisit, checkOutVisit, checkVisitStatus };
}
