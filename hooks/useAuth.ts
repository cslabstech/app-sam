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

// useAuth: Custom hook for authentication logic (renamed from useAuthLogic)
export function useAuth() {
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

    // Helper untuk fetch + log + error handling
    async function fetchWithLog({ url, method = 'POST', body, logLabel }: { url: string, method?: string, body?: any, logLabel: string }) {
        log(`[${logLabel}] Request:`, { url, method, body });
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            ...(body ? { body: JSON.stringify(body) } : {})
        });
        log(`[${logLabel}] Response status:`, res.status);
        const data = await res.json();
        log(`[${logLabel}] Response body:`, data);
        if (!res.ok || (data?.meta && data?.meta?.code && data.meta.code !== 200)) {
            log(`[${logLabel}] Failed:`, data?.meta?.message || data?.message);
            throw new Error(data?.meta?.message || data?.message || 'Request gagal');
        }
        return data;
    }

    const login = async (username: string, password: string) => {
        setLoading(true);
        try {
            if (notifIdLoading) {
                log('[LOGIN] notif_id OneSignal sedang diproses.');
                throw new Error('notif_id OneSignal sedang diproses. Silakan tunggu sebentar dan coba lagi.');
            }
            let notif_id: string | null = notifId;
            if (!notif_id) {
                log('[LOGIN] notif_id OneSignal tidak tersedia.');
                throw new Error('notif_id OneSignal tidak tersedia. Pastikan aplikasi sudah terdaftar di OneSignal.');
            }
            const data = await fetchWithLog({
                url: `${BASE_URL}/user/login`,
                body: { version: '1.0.3', username, password, notif_id },
                logLabel: 'LOGIN'
            });
            await loginWithToken(data.data.access_token, data.data.user);
            log('[LOGIN] Login success, token set');
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
            const data = await fetchWithLog({
                url: `${BASE_URL}/user`,
                method: 'GET',
                logLabel: 'REFRESH_USER'
            });
            setUser(data.data);
            await AsyncStorage.setItem('user', JSON.stringify(data.data));
            log('[REFRESH_USER] User data refreshed:', data.data);
        } catch (err) {
            log('[REFRESH_USER] Failed:', err);
            throw err;
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

    // Request OTP
    const requestOtp = async (phone: string) => {
        return fetchWithLog({
            url: `${BASE_URL}/user/send-otp`,
            body: { phone },
            logLabel: 'OTP'
        });
    };

    // Verify OTP
    const verifyOtp = async (phone: string, otp: string) => {
        const data = await fetchWithLog({
            url: `${BASE_URL}/user/verify-otp`,
            body: { phone, otp },
            logLabel: 'OTP_VERIFY'
        });
        await loginWithToken(data.data.access_token, data.data.user);
        log('[OTP] Login success from OTP, token set');
        return data;
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
        requestOtp,
        verifyOtp,
    };
}
