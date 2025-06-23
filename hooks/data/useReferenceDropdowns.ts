import { useAuth } from '@/context/auth-context';
import { ApiResult, useBaseApi } from '@/hooks/utils/useBaseApi';
import { BaseResponse, apiRequest } from '@/utils/api';
import { log } from '@/utils/logger';
import { useEffect, useState } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export interface Role {
  id: number;
  name: string;
  scope_required_fields: string[];
  scope_multiple_fields: string[];
}

export interface ReferenceItem {
  id: number;
  name: string;
}

// ✅ Updated: Interface untuk ResponseFormatter format (array, bukan key-value)
export interface RolesResponse extends BaseResponse<Role[]> {}
export interface BadanUsahaResponse extends BaseResponse<ReferenceItem[]> {}
export interface DivisionsResponse extends BaseResponse<ReferenceItem[]> {}
export interface RegionsResponse extends BaseResponse<ReferenceItem[]> {}
export interface ClustersResponse extends BaseResponse<ReferenceItem[]> {}

export function useReferenceDropdowns() {
  const { token } = useAuth();
  
  // ✅ Use baseApi for roles (simple list)
  const rolesApi = useBaseApi<Role>('role', '/role');
  
  // ✅ Updated: Changed from key-value objects to arrays
  const [badanUsaha, setBadanUsaha] = useState<ReferenceItem[]>([]);
  const [divisions, setDivisions] = useState<ReferenceItem[]>([]);
  const [regions, setRegions] = useState<ReferenceItem[]>([]);
  const [clusters, setClusters] = useState<ReferenceItem[]>([]);
  const [roleScope, setRoleScope] = useState<{ required: string[]; multiple: string[] }>({ required: [], multiple: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch roles on mount
  useEffect(() => {
    if (token) {
      rolesApi.fetchList();
    }
  }, [token]);

  // ✅ Updated: Fetch badan usaha with new ResponseFormatter format
  useEffect(() => {
    if (!token) return;
    
    const fetchBadanUsaha = async () => {
      setLoading(true);
      setError(null);

      try {
        const json: BadanUsahaResponse = await apiRequest({
          url: `${BASE_URL}/badanusaha`,
          method: 'GET',
          body: null,
          logLabel: 'FETCH_BADAN_USAHA',
          token
        });
        
        if (json.data && Array.isArray(json.data)) {
          setBadanUsaha(json.data);
        } else {
          log('[useReferenceDropdowns] Invalid badan usaha data format:', json.data);
          setBadanUsaha([]);
        }
      } catch (err) {
        log('[useReferenceDropdowns] Failed to fetch badanusaha:', err);
        setBadanUsaha([]);
        setError(err instanceof Error ? err.message : 'Failed to fetch badan usaha');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBadanUsaha();
  }, [token]);

  // ✅ Updated: Returns ApiResult format with array data
  const fetchDivisions = async (badanUsahaId: string): Promise<ApiResult<ReferenceItem[]>> => {
    if (!token) {
      return { success: false, error: 'Token tidak tersedia' };
    }

    setLoading(true);
    setError(null);

    try {
      const json: DivisionsResponse = await apiRequest({
        url: `${BASE_URL}/division?badan_usaha_id=${badanUsahaId}`,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_DIVISIONS',
        token
      });
      
      if (json.data && Array.isArray(json.data)) {
        setDivisions(json.data);
        return { success: true, data: json.data };
      } else {
        log('[useReferenceDropdowns] Invalid divisions data format:', json.data);
        setDivisions([]);
        return { success: false, error: 'Invalid data format' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch divisions';
      log('[useReferenceDropdowns] Failed to fetch divisions:', err);
      setDivisions([]);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async (divisionId: string): Promise<ApiResult<ReferenceItem[]>> => {
    if (!token) {
      return { success: false, error: 'Token tidak tersedia' };
    }

    setLoading(true);
    setError(null);

    try {
      const json: RegionsResponse = await apiRequest({
        url: `${BASE_URL}/region?division_id=${divisionId}`,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_REGIONS',
        token
      });
      
      if (json.data && Array.isArray(json.data)) {
        setRegions(json.data);
        return { success: true, data: json.data };
      } else {
        log('[useReferenceDropdowns] Invalid regions data format:', json.data);
        setRegions([]);
        return { success: false, error: 'Invalid data format' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch regions';
      log('[useReferenceDropdowns] Failed to fetch regions:', err);
      setRegions([]);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const fetchClusters = async (regionId: string): Promise<ApiResult<ReferenceItem[]>> => {
    if (!token) {
      return { success: false, error: 'Token tidak tersedia' };
    }

    setLoading(true);
    setError(null);

    try {
      const json: ClustersResponse = await apiRequest({
        url: `${BASE_URL}/cluster?region_id=${regionId}`,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_CLUSTERS',
        token
      });
      
      if (json.data && Array.isArray(json.data)) {
        setClusters(json.data);
        return { success: true, data: json.data };
      } else {
        log('[useReferenceDropdowns] Invalid clusters data format:', json.data);
        setClusters([]);
        return { success: false, error: 'Invalid data format' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch clusters';
      log('[useReferenceDropdowns] Failed to fetch clusters:', err);
      setClusters([]);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const onRoleChange = (roleId: number) => {
    const role = rolesApi.data.find((r) => r.id === roleId);
    setRoleScope({
      required: role?.scope_required_fields || [],
      multiple: role?.scope_multiple_fields || [],
    });
  };

  return {
    // ✅ Roles using baseApi (consistent)
    roles: rolesApi.data,
    
    // ✅ Updated: Reference dropdowns now return arrays with id/name structure
    badanUsaha,
    divisions,
    regions,
    clusters,
    
    // ✅ Consistent loading/error states
    loading: loading || rolesApi.loading,
    error: error || rolesApi.error,
    
    // ✅ Standardized operations with ApiResult
    fetchDivisions,
    fetchRegions,
    fetchClusters,
    onRoleChange,
    roleScope,
  };
}
