import { useAuth } from '@/context/auth-context';
import { BaseResponse, apiRequest } from '@/utils/api';
import { log } from '@/utils/logger';
import { useCallback, useState } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface ChangePasswordResponse extends BaseResponse<any> {}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: any;
}

export function useChangePassword() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Change password function
  const changePassword = useCallback(async (payload: ChangePasswordPayload): Promise<ApiResult<any>> => {
    setLoading(true);
    setError(null);
    log('[CHANGE_PASSWORD] payload', payload);

    try {
      const response: ChangePasswordResponse = await apiRequest({
        url: `${BASE_URL}/profile/password`,
        method: 'POST',
        body: payload,
        logLabel: 'CHANGE_PASSWORD',
        token
      });

      return { success: true, data: response.data, meta: response.meta };
    } catch (e: any) {
      // Handle validation errors from backend
      if (e.errors) {
        const errorMessages = Object.values(e.errors).flat().join(', ');
        setError(errorMessages);
        log('[CHANGE_PASSWORD] validation error:', errorMessages);
        return { success: false, error: errorMessages };
      }
      
      const errorMessage = e.message || 'Gagal mengubah password';
      setError(errorMessage);
      log('[CHANGE_PASSWORD] error:', errorMessage);
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
    changePassword,
  };
} 