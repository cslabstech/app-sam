import { useAuth } from '@/context/auth-context';
import { BaseResponse, apiRequest } from '@/utils/api';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Interface untuk outlet photos
export interface OutletPhotos {
  shop_sign: string | null;
  front: string | null;
  left: string | null;
  right: string | null;
  id_card: string | null;
}

// Interface untuk outlet API sesuai backend baru
export interface OutletAPI {
  id: string;
  code: string;
  name: string;
  owner_name: string | null;
  owner_phone: string | null;
  address: string | null;
  location: string;
  district: string;
  status: string;
  badan_usaha_id: number;
  division_id: number;
  region_id: number;
  cluster_id: number;
  badan_usaha: {
    id: number;
    name: string;
  };
  division: {
    id: number;
    name: string;
  };
  region: {
    id: number;
    name: string;
  };
  cluster: {
    id: number;
    name: string;
  };
  photos: OutletPhotos;
  video: string | null;
  radius?: number; // Optional untuk backward compatibility
}

// Interface untuk response paginated outlets
export interface OutletsResponse extends BaseResponse<OutletAPI[]> {
  meta: {
    code: number;
    status: 'success' | 'error';
    message: string;
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

// Interface untuk response single outlet
export interface OutletResponse extends BaseResponse<OutletAPI> {}

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export function useOutlet(searchQuery: string) {
  const { token } = useAuth();
  const [outlets, setOutlets] = useState<OutletAPI[]>([]);
  const [outlet, setOutlet] = useState<OutletAPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);

  const pageRef = useRef(1);
  const perPageRef = useRef(20);
  const sortColumnRef = useRef('name');
  const sortDirectionRef = useRef('asc');

  // Transform backend data to our outlet format
  const transformOutletData = useCallback((data: any[]): OutletAPI[] => {
    return data.map((item: any) => ({
      id: String(item.id),
      code: item.code || '',
      name: item.name || '',
      owner_name: item.owner_name || null,
      owner_phone: item.owner_phone || null,
      address: item.address || null,
      location: item.location || '',
      district: item.district || '',
      status: item.status || '',
      badan_usaha_id: item.badan_usaha_id || 0,
      division_id: item.division_id || 0,
      region_id: item.region_id || 0,
      cluster_id: item.cluster_id || 0,
      badan_usaha: {
        id: item.badan_usaha?.id || 0,
        name: item.badan_usaha?.name || '',
      },
      division: {
        id: item.division?.id || 0,
        name: item.division?.name || '',
      },
      region: {
        id: item.region?.id || 0,
        name: item.region?.name || '',
      },
      cluster: {
        id: item.cluster?.id || 0,
        name: item.cluster?.name || '',
      },
      photos: {
        shop_sign: item.photos?.shop_sign || null,
        front: item.photos?.front || null,
        left: item.photos?.left || null,
        right: item.photos?.right || null,
        id_card: item.photos?.id_card || null,
      },
      video: item.video || null,
      radius: item.radius || 0, // Default untuk backward compatibility
    }));
  }, []);

  // Transform single outlet data
  const transformSingleOutletData = useCallback((item: any): OutletAPI => {
    return {
      id: String(item.id),
      code: item.code || '',
      name: item.name || '',
      owner_name: item.owner_name || null,
      owner_phone: item.owner_phone || null,
      address: item.address || null,
      location: item.location || '',
      district: item.district || '',
      status: item.status || '',
      badan_usaha_id: item.badan_usaha_id || 0,
      division_id: item.division_id || 0,
      region_id: item.region_id || 0,
      cluster_id: item.cluster_id || 0,
      badan_usaha: {
        id: item.badan_usaha?.id || 0,
        name: item.badan_usaha?.name || '',
      },
      division: {
        id: item.division?.id || 0,
        name: item.division?.name || '',
      },
      region: {
        id: item.region?.id || 0,
        name: item.region?.name || '',
      },
      cluster: {
        id: item.cluster?.id || 0,
        name: item.cluster?.name || '',
      },
      photos: {
        shop_sign: item.photos?.shop_sign || null,
        front: item.photos?.front || null,
        left: item.photos?.left || null,
        right: item.photos?.right || null,
        id_card: item.photos?.id_card || null,
      },
      video: item.video || null,
      radius: item.radius || 0,
    };
  }, []);

  // Fetch all outlets (basic - no pagination)
  const fetchOutlets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json: OutletsResponse = await apiRequest({
        url: `${BASE_URL}/outlet`,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_OUTLETS',
        token
      });
      
      if (Array.isArray(json.data)) {
        const transformed = transformOutletData(json.data);
        setOutlets(transformed);
        setMeta(json.meta);
      } else {
        setOutlets([]);
        setMeta(null);
        setError('Invalid data format in response');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch outlets';
      setOutlets([]);
      setMeta(null);
      setError(errorMessage);
      console.error('[fetchOutlets] Error:', e);
    }
    setLoading(false);
  }, [token, transformOutletData]);

  // Fetch single outlet by id
  const fetchOutlet = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const json: OutletResponse = await apiRequest({
        url: `${BASE_URL}/outlet/${encodeURIComponent(id)}`,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_OUTLET',
        token
      });
      
      if (json.data) {
        const mappedOutlet = transformSingleOutletData(json.data);
        setOutlet(mappedOutlet);
      } else {
        setError('Outlet not found');
        setOutlet(null);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch outlet';
      setError(errorMessage);
      setOutlet(null);
      console.error('[fetchOutlet] Error:', e);
    }
    setLoading(false);
  }, [token, transformSingleOutletData]);

  // Create outlet
  const createOutlet = useCallback(async (data: Partial<OutletAPI>) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest({
        url: `${BASE_URL}/outlet`,
        method: 'POST',
        body: data,
        logLabel: 'CREATE_OUTLET',
        token
      });
      
      await fetchOutlets(); // refresh list
      return { success: true };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to create outlet';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, fetchOutlets]);

  // Update outlet
  const updateOutlet = useCallback(async (id: string, data: Partial<OutletAPI>) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest({
        url: `${BASE_URL}/outlet/${encodeURIComponent(id)}`,
        method: 'POST',
        body: data,
        logLabel: 'UPDATE_OUTLET',
        token
      });
      
      await fetchOutlets(); // refresh list
      return { success: true };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to update outlet';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, fetchOutlets]);

  // Update outlet with FormData (for file upload)
  const updateOutletWithFile = useCallback(async (id: string, formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest({
        url: `${BASE_URL}/outlet/${encodeURIComponent(id)}`,
        method: 'POST',
        body: formData,
        logLabel: 'UPDATE_OUTLET_WITH_FILE',
        token
      });
      
      await fetchOutlets(); // refresh list
      return { success: true };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to update outlet';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, fetchOutlets]);

  // Fetch outlets with advanced params (with pagination support)
  const fetchOutletsAdvanced = useCallback(async (params?: {
    page?: number;
    per_page?: number;
    sort_column?: string;
    sort_direction?: string;
    search?: string;
    filters?: Record<string, any>;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', String(params.page));
      if (params?.per_page) query.append('per_page', String(params.per_page));
      if (params?.sort_column) query.append('sort_column', params.sort_column);
      if (params?.sort_direction) query.append('sort_direction', params.sort_direction);
      if (params?.search) query.append('search', params.search);
      if (params?.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query.append(`filters[${key}]`, String(value));
          }
        });
      }
      
      const json: OutletsResponse = await apiRequest({
        url: `${BASE_URL}/outlet?${query.toString()}`,
        method: 'GET',
        body: null,
        logLabel: 'FETCH_OUTLETS_ADVANCED',
        token
      });
      
      if (Array.isArray(json.data)) {
        setMeta(json.meta);
        setOutlets(transformOutletData(json.data));
      } else {
        setOutlets([]);
        setMeta(null);
        setError('Invalid data format in response');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch outlets';
      setOutlets([]);
      setMeta(null);
      setError(errorMessage);
      console.error('[fetchOutletsAdvanced] Error:', e);
    }
    setLoading(false);
  }, [token, transformOutletData]);

  // Filter outlets based on search query locally
  const filteredOutlets = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return outlets;
    }
    const query = searchQuery.toLowerCase().trim();
    return outlets.filter(outlet =>
      outlet.name.toLowerCase().includes(query) ||
      outlet.code.toLowerCase().includes(query) ||
      outlet.district.toLowerCase().includes(query) ||
      (outlet.owner_name && outlet.owner_name.toLowerCase().includes(query)) ||
      (outlet.address && outlet.address.toLowerCase().includes(query))
    );
  }, [outlets, searchQuery]);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  return {
    outlets: filteredOutlets,
    outlet,
    loading,
    error,
    meta,
    fetchOutlets,
    fetchOutletsAdvanced,
    fetchOutlet,
    createOutlet,
    updateOutlet,
    updateOutletWithFile,
  };
}
