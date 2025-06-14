import { useAuth } from '@/context/auth-context';
import logger from '@/utils/logger';
import { useState } from 'react';

export interface NewUserPayload {
  name: string;
  username: string;
  phone: string;
  role: string;
  badanusaha?: string;
  divisi?: string;
  region?: string;
  cluster?: string;
}

export interface UseAddUserResult {
  loading: boolean;
  error: string | null;
  success: boolean;
  addUser: (payload: NewUserPayload) => Promise<void>;
}

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export function useAddUser(): UseAddUserResult {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addUser = async (payload: NewUserPayload) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    logger.log('[useAddUser] Request payload:', payload);
    try {
      const res = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      logger.log('[useAddUser] Response status:', res.status);
      const data = await res.json();
      if (res.ok && data?.meta?.code === 200) {
        setSuccess(true);
        logger.log('[useAddUser] User added successfully');
      } else {
        setError(data?.meta?.message || 'Gagal menambah user');
        setSuccess(false);
        logger.log('[useAddUser] Failed:', data?.meta?.message || data?.message);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menambah user');
      setSuccess(false);
      logger.error('[useAddUser] Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, success, addUser };
}
