import { useAuth } from '@/context/auth-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface OutletAPI {
  id: string;
  code: string;
  name: string;
  district: string;
  status: string;
  radius: number;
  location: string;
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
}

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
      code: item.code,
      name: item.name,
      district: item.district,
      status: item.status,
      radius: item.radius,
      location: item.location,
      badan_usaha_id: item.badan_usaha_id,
      division_id: item.division_id,
      region_id: item.region_id,
      cluster_id: item.cluster_id,
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
    }));
  }, []);

  // Fetch all outlets
  const fetchOutlets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/outlet`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const json = await res.json();
      if (json.meta && json.meta.code === 200 && Array.isArray(json.data)) {
        const transformed = transformOutletData(json.data);
        setOutlets(transformed);
      } else {
        setOutlets([]);
        setError('No data or error in response');
      }
    } catch (e) {
      setOutlets([]);
      setError('Failed to fetch outlets');
    }
    setLoading(false);
  }, [token, transformOutletData]);

  // Fetch single outlet by id
  const fetchOutlet = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/outlet/${encodeURIComponent(id)}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const json = await res.json();
      if (json.meta && json.meta.code === 200 && json.data) {
        const dataObj = Array.isArray(json.data) ? json.data[0] : json.data;
        const mappedOutlet: OutletAPI = {
          id: String(dataObj.id ?? ''),
          code: dataObj.code ?? '',
          name: dataObj.name ?? '',
          district: dataObj.district ?? '',
          status: dataObj.status ?? '',
          radius: dataObj.radius ?? 0,
          location: dataObj.location ?? '',
          badan_usaha_id: dataObj.badan_usaha_id ?? 0,
          division_id: dataObj.division_id ?? 0,
          region_id: dataObj.region_id ?? 0,
          cluster_id: dataObj.cluster_id ?? 0,
          badan_usaha: {
            id: dataObj.badan_usaha?.id || 0,
            name: dataObj.badan_usaha?.name || '',
          },
          division: {
            id: dataObj.division?.id || 0,
            name: dataObj.division?.name || '',
          },
          region: {
            id: dataObj.region?.id || 0,
            name: dataObj.region?.name || '',
          },
          cluster: {
            id: dataObj.cluster?.id || 0,
            name: dataObj.cluster?.name || '',
          },
        };
        setOutlet(mappedOutlet);
      } else {
        setError('Outlet not found');
        setOutlet(null);
      }
    } catch (e) {
      setError('Failed to fetch outlet');
      setOutlet(null);
    }
    setLoading(false);
  }, [token]);

  // Create outlet
  const createOutlet = useCallback(async (data: Partial<OutletAPI>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/outlet`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.meta && json.meta.code === 200) {
        await fetchOutlets(); // refresh list
        return { success: true };
      } else {
        setError(json.meta?.message || 'Failed to create outlet');
        return { success: false, error: json.meta?.message };
      }
    } catch (e) {
      setError('Failed to create outlet');
      return { success: false, error: 'Failed to create outlet' };
    } finally {
      setLoading(false);
    }
  }, [token, fetchOutlets]);

  // Update outlet
  const updateOutlet = useCallback(async (id: string, data: Partial<OutletAPI>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/outlet/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.meta && json.meta.code === 200) {
        await fetchOutlets(); // refresh list
        return { success: true };
      } else {
        setError(json.meta?.message || 'Failed to update outlet');
        return { success: false, error: json.meta?.message };
      }
    } catch (e) {
      setError('Failed to update outlet');
      return { success: false, error: 'Failed to update outlet' };
    } finally {
      setLoading(false);
    }
  }, [token, fetchOutlets]);

  // Fetch outlets with advanced params
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
      const res = await fetch(`${BASE_URL}/outlet?${query.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const json = await res.json();
      if (json.meta && json.meta.code === 200 && Array.isArray(json.data)) {
        setMeta(json.meta);
        setOutlets(transformOutletData(json.data));
      } else {
        setOutlets([]);
        setMeta(null);
        setError('No data or error in response');
      }
    } catch (e) {
      setOutlets([]);
      setMeta(null);
      setError('Failed to fetch outlets');
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
      outlet.district.toLowerCase().includes(query)
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
  };
}
