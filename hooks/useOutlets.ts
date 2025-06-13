import { useAuth } from '@/context/auth-context';
import { log } from '@/utils/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Cache to store outlets data
let outletsCache: OutletAPI[] | null = null;
let lastFetchTime = 0;
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

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

export function useOutlets(searchQuery: string) {
  const { token } = useAuth();
  const [allOutlets, setAllOutlets] = useState<OutletAPI[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Fetch all outlets only once when the component mounts or token changes
  useEffect(() => {
    const fetchAllOutlets = async () => {
      setLoading(true);
      
      try {
        // Check if cache is valid
        const now = Date.now();
        if (outletsCache && now - lastFetchTime < CACHE_EXPIRATION) {
          log('[OUTLET] Using cached outlets data');
          setAllOutlets(outletsCache);
          setLoading(false);
          return;
        }
        
        // Fetch new data if cache is expired or doesn't exist
        log('[OUTLET] Fetching outlets from server');
        const res = await fetch(`${BASE_URL}/outlet`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        const json = await res.json();
        
        if (json.meta && json.meta.code === 200 && Array.isArray(json.data)) {
          const transformedData = transformOutletData(json.data);
          setAllOutlets(transformedData);
          
          // Update cache
          outletsCache = transformedData;
          lastFetchTime = now;
          log('[OUTLET] Updated outlets cache with', transformedData.length, 'items');
        } else {
          setAllOutlets([]);
          outletsCache = null;
          log('[OUTLET] No data or error in response', json);
        }
      } catch (e) {
        log('[OUTLET] Error fetching outlets:', e);
        setAllOutlets([]);
      }
      setLoading(false);
    };
    
    fetchAllOutlets();
  }, [token, transformOutletData]);

  // Function to force refresh the outlets data
  const refreshOutlets = useCallback(async () => {
    setLoading(true);
    try {
      log('[OUTLET] Refreshing outlets from server');
      const res = await fetch(`${BASE_URL}/outlet`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const json = await res.json();
      
      if (json.meta && json.meta.code === 200 && Array.isArray(json.data)) {
        const transformedData = transformOutletData(json.data);
        setAllOutlets(transformedData);
        
        // Update cache
        outletsCache = transformedData;
        lastFetchTime = Date.now();
        log('[OUTLET] Refreshed outlets cache with', transformedData.length, 'items');
      } else {
        setAllOutlets([]);
        outletsCache = null;
        log('[OUTLET] No data or error in refresh response', json);
      }
    } catch (e) {
      log('[OUTLET] Error refreshing outlets:', e);
    }
    setLoading(false);
  }, [token, transformOutletData]);

  // Filter outlets based on search query locally
  const outlets = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return allOutlets;
    }

    const query = searchQuery.toLowerCase().trim();
    return allOutlets.filter(outlet => {
      // Search in multiple fields
      return (
        outlet.namaOutlet.toLowerCase().includes(query) ||
        outlet.kodeOutlet.toLowerCase().includes(query)
      );
    });
  }, [allOutlets, searchQuery]);

  return { outlets, loading, refreshOutlets };
}
