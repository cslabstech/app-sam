import { useAuth } from '@/context/auth-context';
import { log } from '@/utils/logger';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export function useVisits() {
  const { token } = useAuth();

  // Get List Visit
  const getVisits = async (isnoo?: number) => {
    const params = isnoo ? `?isnoo=${isnoo}` : '';
    log('[VISIT] Fetching visit list', params);
    const res = await fetch(`${BASE_URL}/visit${params}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    const json = await res.json();
    log('[VISIT] Visit list response', json);
    return json;
  };

  // Submit Visit (Check In/Out)
  const submitVisit = async (formData: FormData) => {
    log('[VISIT] Submitting visit', formData);
    const res = await fetch(`${BASE_URL}/visit`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        // Content-Type jangan di-set manual untuk FormData
      },
      body: formData,
    });
    const json = await res.json();
    log('[VISIT] Submit visit response', json);
    return json;
  };

  // Check Visit Status
  const checkVisitStatus = async (kode_outlet: string, check_in?: boolean) => {
    const params = `?kode_outlet=${encodeURIComponent(kode_outlet)}${typeof check_in !== 'undefined' ? `&check_in=${check_in}` : ''}`;
    log('[VISIT] Checking visit status', params);
    const res = await fetch(`${BASE_URL}/visit/check${params}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    const json = await res.json();
    log('[VISIT] Check visit status response', json);
    return json;
  };

  return { getVisits, submitVisit, checkVisitStatus };
}
