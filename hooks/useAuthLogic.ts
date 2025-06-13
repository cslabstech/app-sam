import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useNotifId } from '../context/notifid-context';
import { log } from '../utils/logger';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  [key: string]: any;
}

export function useAuthLogic() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { notifId, notifIdLoading } = useNotifId();

  useEffect(() => {
    const loadAuth = async () => {
      setLoading(true);
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    loadAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      if (notifIdLoading) {
        throw new Error('notif_id OneSignal sedang diproses. Silakan tunggu sebentar dan coba lagi.');
      }
      let notif_id: string | null = notifId;
      if (!notif_id) {
        throw new Error('notif_id OneSignal tidak tersedia. Pastikan aplikasi sudah terdaftar di OneSignal.');
      }
      const payload = {
        version: '1.0.3',
        username,
        password,
        notif_id,
      };
      log('[LOGIN] Request payload:', payload);
      const response = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      log('[LOGIN] Response status:', response.status);
      const result = await response.json();
      log('[LOGIN] Response body:', result);
      if (
        response.ok &&
        result.meta && result.meta.code === 200 &&
        result.data && result.data.access_token && result.data.user
      ) {
        await AsyncStorage.setItem('token', result.data.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(result.data.user));
        setToken(result.data.access_token);
        setUser(result.data.user);
        log('[LOGIN] Login success, token set');
      } else {
        const msg = (result.meta && result.meta.message) || result.message || 'Login gagal';
        log('[LOGIN] Login failed:', msg);
        throw new Error(msg);
      }
    } catch (err) {
      log('[LOGIN] Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        await fetch(`${BASE_URL}/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      log('[LOGOUT] Logout success, token and user removed');
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.status === 200) {
        setUser(result.data);
        await AsyncStorage.setItem('user', JSON.stringify(result.data));
        log('[REFRESH_USER] User data refreshed:', result.data);
      } else {
        log('[REFRESH_USER] Failed:', result.message || 'Gagal mendapatkan data user');
        throw new Error(result.message || 'Gagal mendapatkan data user');
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (token: string, user: any) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    log('[LOGIN_WITH_TOKEN] Token and user set from OTP login');
  };

  return {
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    loginWithToken,
    setUser,
    setToken,
  };
}
