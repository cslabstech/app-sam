import { useAuth } from '@/context/auth-context';
import { BaseResponse, apiRequest, uploadFile } from '@/utils/api';
import { log } from '@/utils/logger';
import { useCallback, useState } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
}

export interface UpdatePhotoPayload {
  photo: string; // File URI
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  photo: string;
  role: any;
  userScopes: any[];
}

export interface UpdateProfileResponse extends BaseResponse<User> {}
export interface UpdatePhotoResponse extends BaseResponse<User> {}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: any;
}

export function useProfile() {
  const { token, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update profile information
  const updateProfile = useCallback(async (payload: UpdateProfilePayload): Promise<ApiResult<User>> => {
    setLoading(true);
    setError(null);
    log('[UPDATE_PROFILE] payload', payload);

    try {
      const response: UpdateProfileResponse = await apiRequest({
        url: `${BASE_URL}/profile/update`,
        method: 'POST',
        body: payload,
        logLabel: 'UPDATE_PROFILE',
        token
      });

      // Refresh user data after successful update
      await refreshUser();

      return { success: true, data: response.data, meta: response.meta };
    } catch (e: any) {
      const errorMessage = e.message || 'Gagal memperbarui profil';
      setError(errorMessage);
      log('[UPDATE_PROFILE] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, refreshUser]);

  // Update profile photo
  const updatePhoto = useCallback(async (payload: UpdatePhotoPayload): Promise<ApiResult<User>> => {
    setLoading(true);
    setError(null);
    log('[UPDATE_PHOTO] uploading photo');

    try {
      // Convert file URI to FormData
      const formData = new FormData();
      formData.append('photo', {
        uri: payload.photo,
        type: 'image/jpeg',
        name: 'profile.jpg'
      } as any);

      const response: UpdatePhotoResponse = await uploadFile({
        url: `${BASE_URL}/profile/photo`,
        method: 'POST',
        formData,
        logLabel: 'UPDATE_PHOTO',
        token
      });

      // Refresh user data after successful update
      await refreshUser();

      return { success: true, data: response.data, meta: response.meta };
    } catch (e: any) {
      const errorMessage = e.message || 'Gagal memperbarui foto profil';
      setError(errorMessage);
      log('[UPDATE_PHOTO] error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, refreshUser]);

  return {
    // State
    loading,
    error,
    
    // Operations
    updateProfile,
    updatePhoto,
  };
} 