import { useAuth } from '@/context/auth-context';
import logger from '@/utils/logger';
import { useCallback, useState } from 'react';
import { OutletAPI } from './useOutlets';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export function useOutletDetail() {
  const { token } = useAuth();
  const [outlet, setOutlet] = useState<OutletAPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch single outlet by kodeOutlet
  const fetchOutlet = useCallback(async (kodeOutlet: string) => {
    setLoading(true);
    setError(null);
    logger.log('[useOutletDetail] Fetching outlet', kodeOutlet);
    try {
      const res = await fetch(`${BASE_URL}/outlet/${encodeURIComponent(kodeOutlet)}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const json = await res.json();
      logger.log('[useOutletDetail] API response', json); // Tambahkan log response API
      if (json.meta && json.meta.code === 200 && json.data) {
        // Handle if json.data is an array (as in the log)
        const dataObj = Array.isArray(json.data) ? json.data[0] : json.data;
        logger.log('[useOutletDetail] mapping from dataObj', dataObj);
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
        logger.log('[useOutletDetail] mappedOutlet', mappedOutlet);
        setOutlet(mappedOutlet);
        logger.log('[useOutletDetail] Fetched outlet success', dataObj);
      } else {
        setError('Outlet not found');
        setOutlet(null);
        logger.error('[useOutletDetail] Outlet not found', json);
      }
    } catch (e) {
      setError('Failed to fetch outlet');
      setOutlet(null);
      logger.error('[useOutletDetail] Failed to fetch outlet', e);
    }
    setLoading(false);
  }, [token]);

  // Update outlet
  const updateOutlet = useCallback(async (data: Partial<OutletAPI>) => {
    setLoading(true);
    setError(null);
    logger.log('[useOutletDetail] Updating outlet', data);
    try {
      const res = await fetch(`${BASE_URL}/outlet`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kode_outlet: data.kodeOutlet,
          nama_pemilik_outlet: data.namaPemilikOutlet,
          nomer_tlp_outlet: data.nomerTlpOutlet,
          latlong: data.latlong,
        }),
      });
      const json = await res.json();
      if (json.meta && json.meta.code === 200) {
        // Optionally update local state
        setOutlet(prev => prev ? { ...prev, ...data } as OutletAPI : prev);
        logger.log('[useOutletDetail] Update outlet success', json);
        return { success: true };
      } else {
        setError(json.meta?.message || 'Failed to update outlet');
        logger.error('[useOutletDetail] Failed to update outlet', json);
        return { success: false, error: json.meta?.message };
      }
    } catch (e) {
      setError('Failed to update outlet');
      logger.error('[useOutletDetail] Failed to update outlet', e);
      return { success: false, error: 'Failed to update outlet' };
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { outlet, loading, error, fetchOutlet, updateOutlet };
}
