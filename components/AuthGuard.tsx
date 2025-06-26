import { useAuth } from '@/context/auth-context';
import { log } from '@/utils/logger';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { token, loading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  // Hanya redirect ke login jika tidak ada token
  // 401/403 errors akan dihandle otomatis oleh API level auto-logout
  useEffect(() => {
    if (!loading && !token && !hasRedirected.current) {
      log('[AUTH_GUARD] No token found, redirecting to login');
      hasRedirected.current = true;
      router.replace('/login');
    }
    
    // Reset redirect flag jika token kembali ada (user login lagi)
    if (token) {
      hasRedirected.current = false;
    }
  }, [token, loading, router]);

  return <>{children}</>;
}; 