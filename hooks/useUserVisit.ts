import { useAuth } from '@/context/auth-context';
import { log } from '@/utils/logger';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export function useUserVisit() {
  const { token } = useAuth();

  // Get visits for a specific user (by user_id or current user)
  const getUserVisits = async (userId?: string) => {
    const url = userId ? `${BASE_URL}/visit/user/${userId}` : `${BASE_URL}/visit/user/me`;
    log('[USER VISIT] Fetching user visits', url);
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    const json = await res.json();
    log('[USER VISIT] User visits response', json);
    return json;
  };

  // Check-in Visit (store)
  const checkInVisit = async (formData: FormData) => {
    log('[USER VISIT] Check-in', formData);
    const res = await fetch(`${BASE_URL}/visit`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    const json = await res.json();
    log('[USER VISIT] Check-in response', json);
    return json;
  };

  // Check-out Visit (update)
  const checkOutVisit = async (visitId: string, formData: FormData) => {
    log('[USER VISIT] Check-out', { visitId, formData });
    const res = await fetch(`${BASE_URL}/visit/${visitId}`, {
      method: 'PUT', // Use PUT for update as per backend route
      headers: {
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    const json = await res.json();
    log('[USER VISIT] Check-out response', json);
    return json;
  };

  return { getUserVisits, checkInVisit, checkOutVisit };
}
