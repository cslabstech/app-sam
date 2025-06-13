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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      logger.log('[useAddUser] Response status:', res.status);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        logger.error('[useAddUser] Error response:', data);
        throw new Error(data?.message || 'Gagal menambah user');
      }
      setSuccess(true);
      logger.log('[useAddUser] User added successfully');
    } catch (err: any) {
      setError(err.message || 'Gagal menambah user');
      logger.error('[useAddUser] Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, success, addUser };
}
