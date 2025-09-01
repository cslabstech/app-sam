import { useState } from 'react';
import { useNotifId } from '@/context/notifid-context';
import { useAuthData } from './useAuthData';
import { useErrorHandler } from '@/utils/error-handler';
import { apiRequest } from '@/utils/api';
import type { LoginResponse, OtpResponse, SendOtpResponse, UserResponse, User } from '@/types/common';
import { log } from '@/utils/logger';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

/**
 * Hook for authentication actions (login, logout, OTP)
 * Focuses only on authentication operations, not data management
 */
export function useAuthActions() {
  const [actionLoading, setActionLoading] = useState(false);
  const { notifId, notifIdLoading } = useNotifId();
  const { saveAuthData, clearAuthData, updateUser } = useAuthData();
  const { handleError } = useErrorHandler();

  const login = async (username: string, password: string): Promise<void> => {
    if (!notifId) {
      log('[LOGIN] Warning: notif_id not available, using fallback');
    }

    setActionLoading(true);
    try {
      const response: LoginResponse = await apiRequest({
        url: `${BASE_URL}/login`,
        method: 'POST',
        body: {
          version: '2.0.0',
          username,
          password,
          notif_id: notifId || 'expo_push_token'
        },
        logLabel: 'LOGIN'
      });

      // Extract and save auth data
      const userPermissions = response.data.user?.role?.permissions?.map((p: any) => p.name) || [];
      const userWithPermissions = {
        ...response.data.user,
        permissions: userPermissions
      };

      await saveAuthData(response.data.access_token, userWithPermissions, userPermissions);
      log('[LOGIN] Login successful');
    } catch (error) {
      const errorMessage = handleError(error, 'LOGIN');
      throw new Error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setActionLoading(true);
    try {
      // Try to call logout endpoint (don't throw on failure)
      try {
        const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('token'));
        if (token) {
          await apiRequest({
            url: `${BASE_URL}/logout`,
            method: 'POST',
            body: null,
            logLabel: 'LOGOUT',
            token
          });
          log('[LOGOUT] Server logout successful');
        }
      } catch (logoutError) {
        // Ignore server logout errors (401 is expected if token expired)
        log('[LOGOUT] Server logout failed (expected if token expired):', logoutError);
      }

      // Always clear local data regardless of server response
      await clearAuthData();
      log('[LOGOUT] Local cleanup successful');
    } catch (error) {
      log('[LOGOUT] Unexpected error during logout:', error);
      // Force clear local data even on error
      await clearAuthData();
    } finally {
      setActionLoading(false);
    }
  };

  const requestOtp = async (phone: string): Promise<SendOtpResponse> => {
    setActionLoading(true);
    try {
      const response = await apiRequest({
        url: `${BASE_URL}/send-otp`,
        method: 'POST',
        body: { phone },
        logLabel: 'REQUEST_OTP'
      }) as SendOtpResponse;

      log('[OTP] Request successful');
      return response;
    } catch (error) {
      const errorMessage = handleError(error, 'REQUEST_OTP');
      throw new Error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const verifyOtp = async (phone: string, otp: string): Promise<OtpResponse> => {
    if (notifIdLoading) {
      throw new Error('Notification ID is being processed. Please wait and try again.');
    }

    if (!notifId) {
      throw new Error('Notification ID is not available. Please ensure OneSignal is properly configured.');
    }

    setActionLoading(true);
    try {
      log('[OTP_VERIFY] Environment info:', {
        notif_id: notifId,
        notifIdLoading,
        isExpoGo: notifId?.includes('expo'),
        isFallback: notifId?.includes('fallback')
      });

      const response: OtpResponse = await apiRequest({
        url: `${BASE_URL}/verify-otp`,
        method: 'POST',
        body: {
          phone,
          otp,
          notif_id: notifId
        },
        logLabel: 'OTP_LOGIN'
      });

      // Extract and save auth data
      const userPermissions = response.data.user?.role?.permissions?.map((p: any) => p.name) || [];
      const userWithPermissions = {
        ...response.data.user,
        permissions: userPermissions
      };

      await saveAuthData(response.data.access_token, userWithPermissions, userPermissions);
      log('[OTP] Login successful');
      return response;
    } catch (error) {
      const errorMessage = handleError(error, 'OTP_VERIFY');
      throw new Error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const refreshProfile = async (token: string): Promise<void> => {
    setActionLoading(true);
    try {
      const response: UserResponse = await apiRequest({
        url: `${BASE_URL}/profile`,
        method: 'GET',
        body: null,
        logLabel: 'GET_PROFILE',
        token
      });

      // Extract permissions and update user
      const userPermissions = response.data?.role?.permissions?.map((p: any) => p.name) || [];
      const userWithPermissions = {
        ...response.data,
        permissions: userPermissions
      };

      await updateUser(userWithPermissions);
      log('[PROFILE] Profile refreshed successfully');
    } catch (error) {
      const errorMessage = handleError(error, 'GET_PROFILE');
      throw new Error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const loginWithToken = async (token: string, user: User, permissions?: string[]): Promise<void> => {
    const userPermissions = permissions || user?.role?.permissions?.map((p: any) => p.name) || [];
    await saveAuthData(token, user, userPermissions);
    log('[LOGIN_WITH_TOKEN] Token and user set from external login');
  };

  return {
    // State
    actionLoading,
    
    // Actions
    login,
    logout,
    requestOtp,
    verifyOtp,
    refreshProfile,
    loginWithToken,
  };
}