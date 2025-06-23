import { ApiResult, useBaseApi } from '@/hooks/utils/useBaseApi';

export interface PlanVisit {
  id: string;
  user_id: number;
  outlet_id: number;
  plan_date: string;
  type: string;
  created_at?: string;
  updated_at?: string;
  outlet?: {
    id: number;
    code: string;
    name: string;
    district: string;
    status: string;
    radius: number;
    location: string;
  };
}

export interface CreatePlanVisitData {
  outlet_id: number;
  plan_date: string;
  type: string;
}

export function usePlanVisit() {
  const baseApi = useBaseApi<PlanVisit>('planvisit', '/planvisit');

  // ✅ STANDARDIZED: Returns ApiResult format
  const createPlanVisit = async (data: CreatePlanVisitData): Promise<ApiResult<PlanVisit>> => {
    return baseApi.createItem(data);
  };

  const deletePlanVisit = async (id: string): Promise<ApiResult<void>> => {
    return baseApi.deleteItem(id);
  };

  const fetchPlanVisits = async (params?: Record<string, any>): Promise<ApiResult<PlanVisit[]>> => {
    return baseApi.fetchList(params);
  };

  const getPlanVisit = async (id: string): Promise<ApiResult<PlanVisit>> => {
    return baseApi.fetchItem(id);
  };

  return {
    // ✅ Consistent state from base hook
    planVisits: baseApi.data,
    loading: baseApi.loading,
    error: baseApi.error,
    meta: baseApi.meta,
    
    // ✅ Standardized operations with ApiResult
    fetchPlanVisits,
    getPlanVisit,
    createPlanVisit,
    deletePlanVisit,
  };
}
