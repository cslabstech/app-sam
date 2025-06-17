import { useAuth } from '@/context/auth-context';
import { useCallback, useState } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export interface PlanVisit {
  id: string;
  user_id: number;
  outlet_id: number;
  plan_date: string;
  type: string;
  created_at?: string;
  updated_at?: string;
  // Tambahkan field lain sesuai response API jika ada
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

export function usePlanVisit() {
  const { token } = useAuth();
  const [planVisits, setPlanVisits] = useState<PlanVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil list plan visit
  const fetchPlanVisits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/planvisit`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const json = await res.json();
      if (json.meta && json.meta.code === 200) {
        setPlanVisits(json.data);
        return { success: true, data: json.data };
      } else {
        setError(json.meta?.message || 'Failed to fetch plan visits');
        return { success: false, error: json.meta?.message };
      }
    } catch (e) {
      setError('Failed to fetch plan visits');
      return { success: false, error: 'Failed to fetch plan visits' };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Tambah plan visit
  const createPlanVisit = useCallback(async (data: {
    outlet_id: number;
    plan_date: string;
    type: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/planvisit`, {
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
        await fetchPlanVisits();
        return { success: true, data: json.data };
      } else {
        setError(json.meta?.message || 'Failed to create plan visit');
        return { success: false, error: json.meta?.message };
      }
    } catch (e) {
      setError('Failed to create plan visit');
      return { success: false, error: 'Failed to create plan visit' };
    } finally {
      setLoading(false);
    }
  }, [token, fetchPlanVisits]);

  // Hapus plan visit
  const deletePlanVisit = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/planvisit/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const json = await res.json();
      if (json.meta && json.meta.code === 200) {
        await fetchPlanVisits();
        return { success: true };
      } else {
        setError(json.meta?.message || 'Failed to delete plan visit');
        return { success: false, error: json.meta?.message };
      }
    } catch (e) {
      setError('Failed to delete plan visit');
      return { success: false, error: 'Failed to delete plan visit' };
    } finally {
      setLoading(false);
    }
  }, [token, fetchPlanVisits]);

  return {
    planVisits,
    loading,
    error,
    fetchPlanVisits,
    createPlanVisit,
    deletePlanVisit,
  };
}
