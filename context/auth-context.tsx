import { useAuth as useAuthHook } from '@/hooks/auth/useAuth';
import type { User } from '@/types/common';
import { setAutoLogoutCallback } from '@/utils/api';
import React, { createContext, useContext, useEffect } from 'react';

interface AuthContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  permissions: string[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginWithToken: (token: string, user: User, permissions?: string[]) => Promise<void>;
  requestOtp: (phone: string) => Promise<any>;
  verifyOtp: (phone: string, otp: string) => Promise<any>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authHook = useAuthHook();

  // Setup auto logout callback for API
  useEffect(() => {
    setAutoLogoutCallback(() => {
      // Logout without loading state to avoid UI flicker
      authHook.logout();
    });
  }, [authHook.logout]);

  return (
    <AuthContext.Provider value={authHook}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
