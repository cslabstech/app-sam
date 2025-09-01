import { useAuthData } from './useAuthData';
import { useAuthActions } from './useAuthActions';

/**
 * Main authentication hook that combines data and actions
 * This provides a clean interface that matches the original useAuth hook
 * while internally using simplified, single-responsibility hooks
 */
export function useAuth() {
  const { user, token, permissions, loading, refresh } = useAuthData();
  const { 
    actionLoading, 
    login, 
    logout, 
    requestOtp, 
    verifyOtp, 
    refreshProfile,
    loginWithToken 
  } = useAuthActions();

  // Combine loading states
  const isLoading = loading || actionLoading;

  // Refresh user profile using current token
  const refreshUser = async () => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    await refreshProfile(token);
  };

  return {
    // State
    user,
    token,
    permissions,
    loading: isLoading,
    
    // Actions (maintain backward compatibility)
    login,
    logout,
    requestOtp,
    verifyOtp,
    refreshUser,
    loginWithToken,
    
    // Additional data actions
    refresh,
    
    // Backward compatibility aliases
    getProfile: refreshUser,
    setUser: () => {
      console.warn('setUser is deprecated. Use refreshUser or updateUser instead.');
    },
    setToken: () => {
      console.warn('setToken is deprecated. Use loginWithToken instead.');
    },
  };
}

// Re-export types for backward compatibility
export type { User } from '@/types/common';