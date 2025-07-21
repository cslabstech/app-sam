import { useAuth } from '@/context/auth-context';
import { BaseResponse, apiRequest } from '@/utils/api';
import { log } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  id: string | number;
  code: string;
  name: string;
  owner_name: string | null;
  owner_phone: string | null;
  address: string | null;
  location: string;
  district: string;
  status: string;
  radius: number;
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
  photos: OutletPhotos;
  video: string | null;
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

  // Debounce search untuk mengurangi request ke backend
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const searchTimeoutRef = useRef<any>(null);

  // Effect untuk debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

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
        shop_sign: item.photos?.shop_sign || item.photo_shop_sign || null,
        front: item.photos?.front || item.photo_front || null,
        left: item.photos?.left || item.photo_left || null,
        right: item.photos?.right || item.photo_right || null,
        id_card: item.photos?.id_card || item.photo_id_card || null,
      },
      video: item.video || null,
      radius: item.radius || 0, // Default value
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
        shop_sign: item.photos?.shop_sign || item.photo_shop_sign || null,
        front: item.photos?.front || item.photo_front || null,
        left: item.photos?.left || item.photo_left || null,
        right: item.photos?.right || item.photo_right || null,
        id_card: item.photos?.id_card || item.photo_id_card || null,
      },
      video: item.video || null,
      radius: item.radius || 0,
    };
  }, []);

  // Fetch outlets dengan search backend
  const fetchOutlets = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        per_page: 50, // Ambil lebih banyak untuk dropdown
        sort_column: 'name',
        sort_direction: 'asc',
      };
      
      // Tambahkan search query jika ada
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      const json: OutletsResponse = await apiRequest({
        url: `${BASE_URL}/outlets?${new URLSearchParams(params).toString()}`,
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
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch outlets';
      setError(errorMessage);
      setOutlets([]);
      setMeta(null);
      log('[FETCH_OUTLETS] error:', errorMessage);
    }
    setLoading(false);
  }, [token, transformOutletData]);

  // Effect untuk fetch outlets berdasarkan debounced search query
  useEffect(() => {
    fetchOutlets(debouncedSearchQuery);
  }, [debouncedSearchQuery, fetchOutlets]);

  // Fetch single outlet by id
  const fetchOutlet = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const json: OutletResponse = await apiRequest({
        url: `${BASE_URL}/outlets/${encodeURIComponent(id)}`,
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
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch outlet';
      setError(errorMessage);
      setOutlet(null);
      log('[FETCH_OUTLET] error:', errorMessage);
    }
    setLoading(false);
  }, [token, transformSingleOutletData]);

  // Create outlet
  const createOutlet = useCallback(async (data: Partial<OutletAPI>) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest({
        url: `${BASE_URL}/outlets`,
        method: 'POST',
        body: data,
        logLabel: 'CREATE_OUTLET',
        token
      });
      
      await fetchOutlets(''); // refresh list without search
      return { success: true };
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to create outlet';
      setError(errorMessage);
      log('[CREATE_OUTLET] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, fetchOutlets]);

  // Update outlet (sesuai API dokumentasi menggunakan POST)
  const updateOutlet = useCallback(async (id: string, data: Partial<OutletAPI>) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest({
        url: `${BASE_URL}/outlets/${encodeURIComponent(id)}`,
        method: 'POST',
        body: data,
        logLabel: 'UPDATE_OUTLET',
        token
      });
      
      await fetchOutlets(''); // refresh list without search
      return { success: true };
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to update outlet';
      setError(errorMessage);
      log('[UPDATE_OUTLET] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, fetchOutlets]);

  // Update outlet with FormData (for file upload) - tetap menggunakan POST untuk multipart
  const updateOutletWithFile = useCallback(async (id: string, formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest({
        url: `${BASE_URL}/outlets/${encodeURIComponent(id)}`,
        method: 'POST',
        body: formData,
        logLabel: 'UPDATE_OUTLET_WITH_FILE',
        token,
        timeout: 60000 // 60 seconds timeout for file uploads
      });
      
      await fetchOutlets(''); // refresh list without search
      return { success: true };
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to update outlet';
      setError(errorMessage);
      log('[UPDATE_OUTLET_WITH_FILE] error:', errorMessage);
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
        url: `${BASE_URL}/outlets?${query.toString()}`,
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
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch outlets';
      setError(errorMessage);
      setOutlets([]);
      setMeta(null);
      log('[FETCH_OUTLETS_ADVANCED] error:', errorMessage);
    }
    setLoading(false);
  }, [token, transformOutletData]);

  return {
    outlets,
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
