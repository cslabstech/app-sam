import { useAuth } from '@/context/auth-context';
import { BaseResponse, apiRequest } from '@/utils/api';
import { log } from '@/utils/logger';
import { useCallback, useState } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export interface PlanVisit {
  id: string | number;
  visit_date: string;
  outlet_id: string | number;
  user_id: string | number;
  outlet: {
    id: string | number;
    code: string;
    name: string;
    owner_name: string;
    address: string;
    location: string;
    district: string;
    status: string;
    badan_usaha_id: string | number;
    division_id: string | number;
    region_id: string | number;
    cluster_id: string | number;
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
  created_at?: string;
  updated_at?: string;
}

export interface CreatePlanVisitData {
  outlet_id: string | number;
  visit_date: string;
}

export interface UpdatePlanVisitData {
  outlet_id: string | number;
  visit_date: string;
}

export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: any;
}

export interface PlanVisitListResponse extends BaseResponse<PlanVisit[]> {}
export interface PlanVisitResponse extends BaseResponse<PlanVisit> {}

export function usePlanVisit() {
  const { token } = useAuth();
  const [planVisits, setPlanVisits] = useState<PlanVisit[]>([]);
  const [planVisit, setPlanVisit] = useState<PlanVisit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);

  // Fetch plan visits list
  const fetchPlanVisits = useCallback(async (params?: Record<string, any>): Promise<ApiResult<PlanVisit[]>> => {
    setLoading(true);
    setError(null);
    log('[PLAN_VISIT] fetchPlanVisits params', params);

    try {
             const query = new URLSearchParams();
       if (params) {
         Object.entries(params).forEach(([key, value]) => {
           if (value !== undefined && value !== null && value !== '') {
             query.append(key, String(value));
           }
         });
       }

      const queryString = query.toString();
      const url = `${BASE_URL}/plan-visits${queryString ? `?${queryString}` : ''}`;

      const response: PlanVisitListResponse = await apiRequest({
        url,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_PLANVISIT_LIST',
        token
      });

      if (Array.isArray(response.data)) {
        setPlanVisits(response.data);
        setMeta(response.meta);
        return { success: true, data: response.data, meta: response.meta };
      } else {
        setError('Invalid data format in response');
        return { success: false, error: 'Invalid data format in response' };
      }
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch plan visits';
      setError(errorMessage);
      log('[FETCH_PLANVISIT_LIST] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch single plan visit
  const fetchPlanVisit = useCallback(async (id: string | number): Promise<ApiResult<PlanVisit>> => {
    setLoading(true);
    setError(null);
    log('[PLAN_VISIT] fetchPlanVisit id', id);

    try {
      const response: PlanVisitResponse = await apiRequest({
        url: `${BASE_URL}/plan-visits/${encodeURIComponent(id)}`,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_PLANVISIT_ITEM',
        token
      });

      setPlanVisit(response.data);
      return { success: true, data: response.data, meta: response.meta };
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch plan visit';
      setError(errorMessage);
      log('[FETCH_PLANVISIT_ITEM] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create plan visit
  const createPlanVisit = useCallback(async (data: CreatePlanVisitData): Promise<ApiResult<PlanVisit>> => {
    setLoading(true);
    setError(null);
    log('[PLAN_VISIT] createPlanVisit data', data);

    try {
      const response: PlanVisitResponse = await apiRequest({
        url: `${BASE_URL}/plan-visits`,
        method: 'POST',
        body: data,
        logLabel: 'CREATE_PLANVISIT',
        token
      });

      // Refresh list after creation
      await fetchPlanVisits();
      return { success: true, data: response.data, meta: response.meta };
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to create plan visit';
      setError(errorMessage);
      log('[CREATE_PLANVISIT] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, fetchPlanVisits]);

  // Update plan visit
  const updatePlanVisit = useCallback(async (id: string | number, data: UpdatePlanVisitData): Promise<ApiResult<PlanVisit>> => {
    setLoading(true);
    setError(null);
    log('[PLAN_VISIT] updatePlanVisit', { id, data });

    try {
      const response: PlanVisitResponse = await apiRequest({
        url: `${BASE_URL}/plan-visits/${encodeURIComponent(id)}`,
        method: 'PUT',
        body: data,
        logLabel: 'UPDATE_PLANVISIT',
        token
      });

      // Refresh list after update
      await fetchPlanVisits();
      setPlanVisit(response.data);
      return { success: true, data: response.data, meta: response.meta };
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to update plan visit';
      setError(errorMessage);
      log('[UPDATE_PLANVISIT] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, fetchPlanVisits]);

  // Delete plan visit
  const deletePlanVisit = useCallback(async (id: string | number): Promise<ApiResult<void>> => {
    setLoading(true);
    setError(null);
    log('[PLAN_VISIT] deletePlanVisit id', id);

    try {
      await apiRequest({
        url: `${BASE_URL}/plan-visits/${encodeURIComponent(id)}`,
        method: 'DELETE',
        body: null,
        logLabel: 'DELETE_PLANVISIT',
        token
      });

      // Refresh list after deletion
      await fetchPlanVisits();
      if (planVisit?.id === id) {
        setPlanVisit(null);
      }
      return { success: true };
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to delete plan visit';
      setError(errorMessage);
      log('[DELETE_PLANVISIT] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, fetchPlanVisits, planVisit]);

  return {
    // State
    planVisits,
    planVisit,
    loading,
    error,
    meta,
    
    // Operations
    fetchPlanVisits,
    fetchPlanVisit,
    createPlanVisit,
    updatePlanVisit,
    deletePlanVisit,
  };
}
