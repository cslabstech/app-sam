import { useAuth } from '@/context/auth-context';
import { ApiResult, useBaseApi } from '@/hooks/utils/useBaseApi';
import { BaseResponse, apiRequest } from '@/utils/api';
import { log } from '@/utils/logger';
import { useEffect, useState } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export interface Role {
  id: string | number;
  name: string;
  scope_required_fields: string[];
  scope_multiple_fields: string[];
}

export interface ReferenceItem {
  id: string | number;
  name: string;
}

// Interface untuk ResponseFormatter format sesuai foundation.md
export interface RolesResponse extends BaseResponse<Role[]> {}
export interface BadanUsahaResponse extends BaseResponse<ReferenceItem[]> {}
export interface DivisionsResponse extends BaseResponse<ReferenceItem[]> {}
export interface RegionsResponse extends BaseResponse<ReferenceItem[]> {}
export interface ClustersResponse extends BaseResponse<ReferenceItem[]> {}

export function useReference() {
  const { token } = useAuth();
  
  // Use baseApi for roles
  const rolesApi = useBaseApi<Role>('role', '/references/role');
  
  // Reference dropdowns state
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

  // Fetch badan usaha with new ResponseFormatter format
  useEffect(() => {
    if (!token) return;
    
    const fetchBadanUsaha = async () => {
      setLoading(true);
      setError(null);

      try {
        const json: BadanUsahaResponse = await apiRequest({
          url: `${BASE_URL}/references/badan-usaha`,
          method: 'GET',
          body: null,
          logLabel: 'FETCH_BADAN_USAHA',
          token
        });
        
        if (json.data && Array.isArray(json.data)) {
          setBadanUsaha(json.data);
        } else {
          log('[useReference] Invalid badan usaha data format:', json.data);
          setBadanUsaha([]);
        }
      } catch (err: any) {
        // Parse error sesuai StandardResponse format
        let errorMessage = 'Failed to fetch badan usaha';
        if (err?.response?.data?.meta?.message) {
          errorMessage = err.response.data.meta.message;
        } else if (err?.meta?.message) {
          errorMessage = err.meta.message;
        } else if (err?.code === 'NETWORK_ERROR' || err?.message?.includes('Network')) {
          errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        }
        
        log('[useReference] Failed to fetch badan usaha:', err);
        setBadanUsaha([]);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBadanUsaha();
  }, [token]);

  // Fetch divisions dengan parameter badan_usaha_id
  const fetchDivisions = async (badanUsahaId?: string): Promise<ApiResult<ReferenceItem[]>> => {
    if (!token) {
      return { success: false, error: 'Token tidak tersedia' };
    }

    setLoading(true);
    setError(null);

    try {
      const url = badanUsahaId 
        ? `${BASE_URL}/references/division?badan_usaha_id=${badanUsahaId}`
        : `${BASE_URL}/references/division`;
        
      const json: DivisionsResponse = await apiRequest({
        url,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_DIVISIONS',
        token
      });
      
      if (json.data && Array.isArray(json.data)) {
        setDivisions(json.data);
        return { success: true, data: json.data };
      } else {
        log('[useReference] Invalid divisions data format:', json.data);
        setDivisions([]);
        return { success: false, error: 'Invalid data format' };
      }
    } catch (err: any) {
      // Parse error sesuai StandardResponse format
      let errorMessage = 'Failed to fetch divisions';
      if (err?.response?.data?.meta?.message) {
        errorMessage = err.response.data.meta.message;
      } else if (err?.meta?.message) {
        errorMessage = err.meta.message;
      } else if (err?.code === 'NETWORK_ERROR' || err?.message?.includes('Network')) {
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
      }
      
      log('[useReference] Failed to fetch divisions:', err);
      setDivisions([]);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fetch regions dengan parameter division_id
  const fetchRegions = async (divisionId?: string): Promise<ApiResult<ReferenceItem[]>> => {
    if (!token) {
      return { success: false, error: 'Token tidak tersedia' };
    }

    setLoading(true);
    setError(null);

    try {
      const url = divisionId 
        ? `${BASE_URL}/references/region?division_id=${divisionId}`
        : `${BASE_URL}/references/region`;
        
      const json: RegionsResponse = await apiRequest({
        url,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_REGIONS',
        token
      });
      
      if (json.data && Array.isArray(json.data)) {
        setRegions(json.data);
        return { success: true, data: json.data };
      } else {
        log('[useReference] Invalid regions data format:', json.data);
        setRegions([]);
        return { success: false, error: 'Invalid data format' };
      }
    } catch (err: any) {
      // Parse error sesuai StandardResponse format
      let errorMessage = 'Failed to fetch regions';
      if (err?.response?.data?.meta?.message) {
        errorMessage = err.response.data.meta.message;
      } else if (err?.meta?.message) {
        errorMessage = err.meta.message;
      } else if (err?.code === 'NETWORK_ERROR' || err?.message?.includes('Network')) {
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
      }
      
      log('[useReference] Failed to fetch regions:', err);
      setRegions([]);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fetch clusters dengan parameter region_id
  const fetchClusters = async (regionId?: string): Promise<ApiResult<ReferenceItem[]>> => {
    if (!token) {
      return { success: false, error: 'Token tidak tersedia' };
    }

    setLoading(true);
    setError(null);

    try {
      const url = regionId 
        ? `${BASE_URL}/references/cluster?region_id=${regionId}`
        : `${BASE_URL}/references/cluster`;
        
      const json: ClustersResponse = await apiRequest({
        url,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_CLUSTERS',
        token
      });
      
      if (json.data && Array.isArray(json.data)) {
        setClusters(json.data);
        return { success: true, data: json.data };
      } else {
        log('[useReference] Invalid clusters data format:', json.data);
        setClusters([]);
        return { success: false, error: 'Invalid data format' };
      }
    } catch (err: any) {
      // Parse error sesuai StandardResponse format
      let errorMessage = 'Failed to fetch clusters';
      if (err?.response?.data?.meta?.message) {
        errorMessage = err.response.data.meta.message;
      } else if (err?.meta?.message) {
        errorMessage = err.meta.message;
      } else if (err?.code === 'NETWORK_ERROR' || err?.message?.includes('Network')) {
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
      }
      
      log('[useReference] Failed to fetch clusters:', err);
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
    // Roles using baseApi (consistent)
    roles: rolesApi.data,
    
    // Reference dropdowns return arrays with id/name structure
    badanUsaha,
    divisions,
    regions,
    clusters,
    
    // Consistent loading/error states
    loading: loading || rolesApi.loading,
    error: error || rolesApi.error,
    
    // Standardized operations with ApiResult
    fetchDivisions,
    fetchRegions,
    fetchClusters,
    onRoleChange,
    roleScope,
  };
} 