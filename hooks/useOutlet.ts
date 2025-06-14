import { useAuth } from '@/context/auth-context';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface OutletAPI {
  id: string;
  kodeOutlet: string;
  namaOutlet: string;
  alamatOutlet: string;
  namaPemilikOutlet: string;
  nomerTlpOutlet: string;
  potoShopSign: string;
  potoDepan: string;
  potoKiri: string;
  potoKanan: string;
  potoKtp: string;
  distric: string;
  video: string;
  limit: number;
  region: string;
  cluster: string;
  divisi: string;
  radius: number;
  latlong: string;
  statusOutlet: string;
}

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export function useOutlet(searchQuery: string) {
  const { token } = useAuth();
  const [outlets, setOutlets] = useState<OutletAPI[]>([]);
  const [outlet, setOutlet] = useState<OutletAPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transform backend data to our outlet format
  const transformOutletData = useCallback((data: any[]): OutletAPI[] => {
    return data.map((item: any) => ({
      id: String(item.id),
      kodeOutlet: item.kode_outlet,
      namaOutlet: item.nama_outlet,
      alamatOutlet: item.alamat_outlet,
      namaPemilikOutlet: item.nama_pemilik_outlet,
      nomerTlpOutlet: item.nomer_tlp_outlet,
      potoShopSign: item.poto_shop_sign,
      potoDepan: item.poto_depan,
      potoKiri: item.poto_kiri,
      potoKanan: item.poto_kanan,
      potoKtp: item.poto_ktp,
      distric: item.distric,
      video: item.video,
      limit: item.limit,
      region: item.region && typeof item.region === 'object' ? item.region.name : '',
      cluster: item.cluster && typeof item.cluster === 'object' ? item.cluster.name : '',
      divisi: item.divisi && typeof item.divisi === 'object' ? item.divisi.name : '',
      radius: item.radius,
      latlong: item.latlong,
      statusOutlet: (item.status_outlet || '').toLowerCase(),
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
          kodeOutlet: dataObj.kode_outlet ?? '',
          namaOutlet: dataObj.nama_outlet ?? '',
          alamatOutlet: dataObj.alamat_outlet ?? '',
          namaPemilikOutlet: dataObj.nama_pemilik_outlet ?? '',
          nomerTlpOutlet: dataObj.nomer_tlp_outlet ?? '',
          potoShopSign: dataObj.poto_shop_sign ?? '',
          potoDepan: dataObj.poto_depan ?? '',
          potoKiri: dataObj.poto_kiri ?? '',
          potoKanan: dataObj.poto_kanan ?? '',
          potoKtp: dataObj.poto_ktp ?? '',
          distric: dataObj.distric ?? '',
          video: dataObj.video ?? '',
          limit: dataObj.limit ?? 0,
          region: dataObj.region && typeof dataObj.region === 'object' ? dataObj.region.name : '',
          cluster: dataObj.cluster && typeof dataObj.cluster === 'object' ? dataObj.cluster.name : '',
          divisi: dataObj.divisi && typeof dataObj.divisi === 'object' ? dataObj.divisi.name : '',
          radius: dataObj.radius ?? 0,
          latlong: dataObj.latlong ?? '',
          statusOutlet: (dataObj.status_outlet || '').toLowerCase(),
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

  // Filter outlets based on search query locally
  const filteredOutlets = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return outlets;
    }
    const query = searchQuery.toLowerCase().trim();
    return outlets.filter(outlet =>
      outlet.namaOutlet.toLowerCase().includes(query) ||
      outlet.kodeOutlet.toLowerCase().includes(query)
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
    fetchOutlets,
    fetchOutlet,
    createOutlet,
    updateOutlet,
  };
}
