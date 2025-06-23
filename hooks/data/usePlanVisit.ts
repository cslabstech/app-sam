import { ApiResult, useBaseApi } from '@/hooks/utils/useBaseApi';

export interface PlanVisit {
  id: string | number;
  user_id: number;
  outlet_id: number;
  visit_date: string;
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
  visit_date: string;
}

export function usePlanVisit() {
  const baseApi = useBaseApi<PlanVisit>('planvisit', '/planvisit');

  // ✅ STANDARDIZED: Returns ApiResult format with enhanced field error handling
  const createPlanVisit = async (data: CreatePlanVisitData): Promise<ApiResult<PlanVisit> & { fieldErrors?: any }> => {
    try {
      const result = await baseApi.createItem(data);
      return result;
    } catch (error: any) {
      // Enhanced error handling for validation errors (422)
      const errorMessage = error.message || 'Gagal membuat plan visit';
      
      // Check if this is a validation error with field errors
      if (error.code === 422 && error.errors) {
        return {
          success: false,
          error: errorMessage,
          fieldErrors: error.errors // Field errors from API response errors property
        };
      }
      
      // Return standard error for non-validation errors
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const deletePlanVisit = async (id: string | number): Promise<ApiResult<void>> => {
    console.log('usePlanVisit.deletePlanVisit called with ID:', id);
    console.log('ID type:', typeof id);
    console.log('ID length:', String(id)?.length);
    console.log('ID is truthy:', !!id);
    
    const result = await baseApi.deleteItem(id);
    console.log('deletePlanVisit result:', JSON.stringify(result, null, 2));
    return result;
  };

  const fetchPlanVisits = async (params?: Record<string, any>): Promise<ApiResult<PlanVisit[]>> => {
    return baseApi.fetchList(params);
  };

  return {
    // ✅ Consistent state from base hook
    planVisits: baseApi.data,
    loading: baseApi.loading,
    error: baseApi.error,
    meta: baseApi.meta,
    
    // ✅ Standardized operations with ApiResult
    fetchPlanVisits,
    createPlanVisit,
    deletePlanVisit,
  };
}
