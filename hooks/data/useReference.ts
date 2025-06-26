import { useAuth } from '@/context/auth-context';
import { BaseResponse, apiRequest } from '@/utils/api';
import { log } from '@/utils/logger';
import { useCallback, useEffect, useState } from 'react';

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

export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: any;
}

// Interface untuk ResponseFormatter format sesuai foundation.md
export interface RolesResponse extends BaseResponse<Role[]> {}
export interface BadanUsahaResponse extends BaseResponse<ReferenceItem[]> {}
export interface DivisionsResponse extends BaseResponse<ReferenceItem[]> {}
export interface RegionsResponse extends BaseResponse<ReferenceItem[]> {}
export interface ClustersResponse extends BaseResponse<ReferenceItem[]> {}

// Tambahkan interface untuk response outlet-level-fields
export interface OutletLevelFieldSection {
  id: string | number | null;
  code: string;
  name: string;
  type: string;
  description?: string | null;
  sort_order: number;
  settings: any;
  custom_fields: OutletLevelCustomField[];
}

export interface OutletLevelCustomField {
  id: string | number | null;
  code: string;
  name: string;
  type: string;
  width: string;
  lookup_type: string | null;
  sort_order: number;
  validation_rules: any[];
  settings: any;
  options: any[];
  required: boolean;
  model_field: boolean;
  custom_field_found: boolean | null;
  custom_field_note: string | null;
  source: string;
}

export interface OutletLevelFieldsResponse extends BaseResponse<OutletLevelFieldSection[]> {}

export function useReference() {
  const { token } = useAuth();
  
  // State management
  const [roles, setRoles] = useState<Role[]>([]);
  const [badanUsaha, setBadanUsaha] = useState<ReferenceItem[]>([]);
  const [divisions, setDivisions] = useState<ReferenceItem[]>([]);
  const [regions, setRegions] = useState<ReferenceItem[]>([]);
  const [clusters, setClusters] = useState<ReferenceItem[]>([]);
  const [roleScope, setRoleScope] = useState<{ required: string[]; multiple: string[] }>({ required: [], multiple: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch roles
  const fetchRoles = useCallback(async (): Promise<ApiResult<Role[]>> => {
    if (!token) {
      return { success: false, error: 'Token tidak tersedia' };
    }

    setLoading(true);
    setError(null);

    try {
      const response: RolesResponse = await apiRequest({
        url: `${BASE_URL}/references/role`,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_ROLES',
        token
      });
      
      if (response.data && Array.isArray(response.data)) {
        setRoles(response.data);
        return { success: true, data: response.data };
      } else {
        setRoles([]);
        setError('Invalid data format');
        log('[FETCH_ROLES] Invalid data format:', response.data);
        return { success: false, error: 'Invalid data format' };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch roles';
      setRoles([]);
      setError(errorMessage);
      log('[FETCH_ROLES] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch badan usaha
  const fetchBadanUsaha = useCallback(async (): Promise<ApiResult<ReferenceItem[]>> => {
    if (!token) {
      return { success: false, error: 'Token tidak tersedia' };
    }

    setLoading(true);
    setError(null);

    try {
      const response: BadanUsahaResponse = await apiRequest({
        url: `${BASE_URL}/references/badan-usaha`,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_BADAN_USAHA',
        token
      });
      
      if (response.data && Array.isArray(response.data)) {
        setBadanUsaha(response.data);
        return { success: true, data: response.data };
      } else {
        setBadanUsaha([]);
        setError('Invalid data format');
        log('[FETCH_BADAN_USAHA] Invalid data format:', response.data);
        return { success: false, error: 'Invalid data format' };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch badan usaha';
      setBadanUsaha([]);
      setError(errorMessage);
      log('[FETCH_BADAN_USAHA] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch divisions dengan parameter badan_usaha_id
  const fetchDivisions = useCallback(async (badanUsahaId?: string): Promise<ApiResult<ReferenceItem[]>> => {
    if (!token) {
      return { success: false, error: 'Token tidak tersedia' };
    }

    setLoading(true);
    setError(null);

    try {
      const url = badanUsahaId 
        ? `${BASE_URL}/references/division?badan_usaha_id=${badanUsahaId}`
        : `${BASE_URL}/references/division`;
        
      const response: DivisionsResponse = await apiRequest({
        url,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_DIVISIONS',
        token
      });
      
      if (response.data && Array.isArray(response.data)) {
        setDivisions(response.data);
        return { success: true, data: response.data };
      } else {
        setDivisions([]);
        setError('Invalid data format');
        log('[FETCH_DIVISIONS] Invalid data format:', response.data);
        return { success: false, error: 'Invalid data format' };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch divisions';
      setDivisions([]);
      setError(errorMessage);
      log('[FETCH_DIVISIONS] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch regions dengan parameter division_id
  const fetchRegions = useCallback(async (divisionId?: string): Promise<ApiResult<ReferenceItem[]>> => {
    if (!token) {
      return { success: false, error: 'Token tidak tersedia' };
    }

    setLoading(true);
    setError(null);

    try {
      const url = divisionId 
        ? `${BASE_URL}/references/region?division_id=${divisionId}`
        : `${BASE_URL}/references/region`;
        
      const response: RegionsResponse = await apiRequest({
        url,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_REGIONS',
        token
      });
      
      if (response.data && Array.isArray(response.data)) {
        setRegions(response.data);
        return { success: true, data: response.data };
      } else {
        setRegions([]);
        setError('Invalid data format');
        log('[FETCH_REGIONS] Invalid data format:', response.data);
        return { success: false, error: 'Invalid data format' };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch regions';
      setRegions([]);
      setError(errorMessage);
      log('[FETCH_REGIONS] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch clusters dengan parameter region_id
  const fetchClusters = useCallback(async (regionId?: string): Promise<ApiResult<ReferenceItem[]>> => {
    if (!token) {
      return { success: false, error: 'Token tidak tersedia' };
    }

    setLoading(true);
    setError(null);

    try {
      const url = regionId 
        ? `${BASE_URL}/references/cluster?region_id=${regionId}`
        : `${BASE_URL}/references/cluster`;
        
      const response: ClustersResponse = await apiRequest({
        url,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_CLUSTERS',
        token
      });
      
      if (response.data && Array.isArray(response.data)) {
        setClusters(response.data);
        return { success: true, data: response.data };
      } else {
        setClusters([]);
        setError('Invalid data format');
        log('[FETCH_CLUSTERS] Invalid data format:', response.data);
        return { success: false, error: 'Invalid data format' };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch clusters';
      setClusters([]);
      setError(errorMessage);
      log('[FETCH_CLUSTERS] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Handle role change
  const onRoleChange = useCallback((roleId: number) => {
    const role = roles.find((r) => r.id === roleId);
    setRoleScope({
      required: role?.scope_required_fields || [],
      multiple: role?.scope_multiple_fields || [],
    });
  }, [roles]);

  // Auto-fetch roles and badan usaha on mount
  useEffect(() => {
    if (token) {
      fetchRoles();
      fetchBadanUsaha();
    }
  }, [token, fetchRoles, fetchBadanUsaha]);

  return {
    // State
    roles,
    badanUsaha,
    divisions,
    regions,
    clusters,
    loading,
    error,
    roleScope,
    
    // Operations
    fetchRoles,
    fetchBadanUsaha,
    fetchDivisions,
    fetchRegions,
    fetchClusters,
    onRoleChange,
  };
}

// Custom hook untuk fetch outlet-level-fields
export function useOutletLevelFields(level: 'LEAD' | 'NOO') {
  const { token } = useAuth();
  const [data, setData] = useState<OutletLevelFieldSection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = useCallback(async () => {
    if (!token) {
      setError('Token tidak tersedia');
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response: OutletLevelFieldsResponse = await apiRequest({
        url: `${BASE_URL}/references/outlet-level-fields?level=${level}&include_custom_fields=true`,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_OUTLET_LEVEL_FIELDS',
        token
      });
      if (response.data && Array.isArray(response.data)) {
        setData(response.data);
      } else {
        setData(null);
        setError('Invalid data format');
      }
    } catch (err: any) {
      setData(null);
      setError(err.message || 'Gagal fetch outlet-level-fields');
    } finally {
      setLoading(false);
    }
  }, [token, level]);

  useEffect(() => {
    fetchFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  return { data, loading, error, fetchFields };
} 