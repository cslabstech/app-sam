import React, { createContext, useContext } from 'react';
import { useAuthLogic, User } from '../hooks/useAuthLogic';

interface AuthContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginWithToken: (token: string, user: any) => Promise<void>;
  requestOtp: (phone: string) => Promise<any>;
  verifyOtp: (phone: string, otp: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    loginWithToken,
    requestOtp,
    verifyOtp,
  } = useAuthLogic();

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser, loginWithToken, requestOtp, verifyOtp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
