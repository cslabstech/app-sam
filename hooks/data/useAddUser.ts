import { useAuth } from '@/context/auth-context';
import { BaseResponse, apiRequest } from '@/utils/api';
import { log } from '@/utils/logger';
import { useCallback, useState } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

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

// User interface - extend base pattern
export interface User {
  id: string | number;
  name: string;
  username: string;
  phone: string;
  role: string;
  badanusaha?: string;
  divisi?: string;
  region?: string;
  cluster?: string;
}

export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: any;
}

export interface AddUserResponse extends BaseResponse<User> {}

export function useAddUser() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add user function
  const addUser = useCallback(async (payload: NewUserPayload): Promise<ApiResult<User>> => {
    setLoading(true);
    setError(null);
    log('[ADD_USER] payload', payload);

    try {
      const response: AddUserResponse = await apiRequest({
        url: `${BASE_URL}/user`,
        method: 'POST',
        body: payload,
        logLabel: 'ADD_USER',
        token
      });

      return { success: true, data: response.data, meta: response.meta };
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to add user';
      setError(errorMessage);
      log('[ADD_USER] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    // State
    loading,
    error,
    
    // Operations
    addUser,
  };
}
