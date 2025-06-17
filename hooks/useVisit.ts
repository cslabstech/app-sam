import { useAuth } from '@/context/auth-context';
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

export interface VisitMeta {
  code: number;
  status: string;
  message: string;
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface VisitListResponse {
  meta: VisitMeta;
  data: Visit[];
}

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
  const [meta, setMeta] = useState<VisitMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get list of visits
  const fetchVisits = useCallback(async (params: VisitListParams = {}) => {
    setLoading(true);
    setError(null);
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

      const res = await fetch(`${BASE_URL}/visit?${query.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const json: VisitListResponse = await res.json();
      if (json.meta && json.meta.code === 200) {
        setVisits(json.data);
        setMeta(json.meta);
        return { success: true, data: json.data, meta: json.meta };
      } else {
        setError(json.meta?.message || 'Failed to fetch visits');
        return { success: false, error: json.meta?.message };
      }
    } catch (e) {
      setError('Failed to fetch visits');
      return { success: false, error: 'Failed to fetch visits' };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Ambil detail visit satuan
  const fetchVisit = useCallback(async (visitId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/visit/${visitId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const json = await res.json();
      if (json.meta && json.meta.code === 200) {
        return { success: true, data: json.data, meta: json.meta };
      } else {
        setError(json.meta?.message || 'Failed to fetch visit detail');
        return { success: false, error: json.meta?.message };
      }
    } catch (e) {
      setError('Failed to fetch visit detail');
      return { success: false, error: 'Failed to fetch visit detail' };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Check-in Visit (store)
  const checkInVisit = async (formData: FormData) => {
    log('[USER VISIT] Check-in', formData);
    const res = await fetch(`${BASE_URL}/visit`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    const json = await res.json();
    log('[USER VISIT] Check-in response', json);
    return json;
  };

  // Check-out Visit (update)
  const checkOutVisit = async (visitId: string, formData: FormData) => {
    log('[USER VISIT] Check-out', { visitId, formData });
    const res = await fetch(`${BASE_URL}/visit/${visitId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    const json = await res.json();
    log('[USER VISIT] Check-out response', json);
    return json;
  };

  return { visits, meta, loading, error, fetchVisits, fetchVisit, checkInVisit, checkOutVisit };
}
