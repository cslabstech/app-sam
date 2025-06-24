import { ApiResult, useBaseApi } from '@/hooks/utils/useBaseApi';

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

export function usePlanVisit() {
  const baseApi = useBaseApi<PlanVisit>('planvisit', '/plan-visits');

  // Create plan visit - menggunakan baseApi yang sudah di-standardkan
  const createPlanVisit = async (data: CreatePlanVisitData): Promise<ApiResult<PlanVisit>> => {
    return baseApi.createItem(data);
  };

  // Update plan visit - menggunakan baseApi yang sudah di-standardkan
  const updatePlanVisit = async (id: string | number, data: UpdatePlanVisitData): Promise<ApiResult<PlanVisit>> => {
    return baseApi.updateItem(id, data);
  };

  const deletePlanVisit = async (id: string | number): Promise<ApiResult<void>> => {
    return await baseApi.deleteItem(id);
  };

  const fetchPlanVisits = async (params?: Record<string, any>): Promise<ApiResult<PlanVisit[]>> => {
    return baseApi.fetchList(params);
  };

  const fetchPlanVisit = async (id: string | number): Promise<ApiResult<PlanVisit>> => {
    return baseApi.fetchItem(id);
  };

  return {
    // Consistent state from base hook
    planVisits: baseApi.data,
    planVisit: baseApi.item,
    loading: baseApi.loading,
    error: baseApi.error,
    meta: baseApi.meta,
    
    // Standardized operations with ApiResult
    fetchPlanVisits,
    fetchPlanVisit,
    createPlanVisit,
    updatePlanVisit,
    deletePlanVisit,
  };
}
