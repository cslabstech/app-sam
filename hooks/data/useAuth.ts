import { useNotifId } from '@/context/notifid-context';
import { BaseResponse, apiRequest } from '@/utils/api';
import { log } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export interface LoginResponse extends BaseResponse<{
    access_token: string;
    token_type: string;
    user: User;
}> {}

export interface OtpResponse extends BaseResponse<{
    access_token: string;
    token_type: string;
    user: User;
}> {}

export interface SendOtpResponse extends BaseResponse<any> {}

export interface UserResponse extends BaseResponse<User> {}

export interface User {
    id: string | number;
    username: string;
    name: string;
    email?: string;
    phone?: string | null;
    role_id: string | number;
    tm_id?: string | null;
    notif_id: string;
    role: {
        id: string | number;
        name: string;
        scope_required_fields?: any;
        permissions: Array<{
            id: string | number;
            name: string;
        }>;
    };
    user_scopes: {
        id?: number;
        badan_usaha_id?: number | null;
        division_id?: number | null;
        region_id?: number | null;
        cluster_id?: number | null;
    };
    permissions?: string[]; // computed field dari role.permissions
    [key: string]: any;
}

// useAuth: Custom hook for authentication logic (renamed from useAuthLogic)
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]); // simpan permissions
    const [loading, setLoading] = useState(true);
    const { notifId, notifIdLoading } = useNotifId();

    useEffect(() => {
        const loadAuth = async () => {
            setLoading(true);
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');
            const storedPermissions = await AsyncStorage.getItem('permissions');
            if (storedToken && storedUser) {
                setToken(storedToken);
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                // Ambil permissions dari AsyncStorage jika ada, fallback ke user.permissions atau user.role.permissions
                if (storedPermissions) {
                    setPermissions(JSON.parse(storedPermissions));
                } else if (parsedUser?.role?.permissions && Array.isArray(parsedUser.role.permissions)) {
                    const perms = parsedUser.role.permissions.map((p: any) => p.name);
                    setPermissions(perms);
                } else if (parsedUser && Array.isArray(parsedUser.permissions)) {
                    setPermissions(parsedUser.permissions);
                } else {
                    setPermissions([]);
                }
            }
            setLoading(false);
        };
        loadAuth();
    }, []);

    const login = async (username: string, password: string) => {
        log('[LOGIN] Attempting login for username:', username);
        
        if (!notifId) {
            log('[LOGIN] Warning: notif_id not available, using fallback');
        }
        
        const data: LoginResponse = await apiRequest({
            url: `${BASE_URL}/login`,
            method: 'POST',
            body: {
                version: '2.0.0',
                username,
                password,
                notif_id: notifId || 'expo_push_token'
            },
            logLabel: 'LOGIN',
            token: null
        });
        
        // Extract permissions from user.role.permissions
        const userPermissions = data.data.user?.role?.permissions?.map((p: any) => p.name) || [];
        
        // Add computed permissions field to user object
        const userWithPermissions = {
            ...data.data.user,
            permissions: userPermissions
        };
        
        await loginWithToken(data.data.access_token, userWithPermissions, userPermissions);
        setPermissions(userPermissions);
        // Simpan permissions ke AsyncStorage
        await AsyncStorage.setItem('permissions', JSON.stringify(userPermissions));
        log('[LOGIN] Login success, token set');
    };

    const logout = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                // Try to call logout endpoint, tapi jangan throw error jika gagal
                // karena yang penting adalah membersihkan local storage
                try {
                    await apiRequest({
                        url: `${BASE_URL}/logout`,
                        method: 'POST',
                        body: null,
                        logLabel: 'LOGOUT',
                        token
                    });
                    log('[LOGOUT] Server logout success');
                } catch (logoutError) {
                    // Ignore logout endpoint errors (401 is expected if token expired)
                    log('[LOGOUT] Server logout failed (expected if token expired):', logoutError);
                }
            }
            
            // Yang penting: bersihkan local storage dan state
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('permissions');
            setToken(null);
            setUser(null);
            setPermissions([]);
            log('[LOGOUT] Local cleanup success, user logged out');
        } catch (error) {
            log('[LOGOUT] Unexpected error during logout:', error);
            // Even if there's an error, clear local state
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('permissions');
            setToken(null);
            setUser(null);
            setPermissions([]);
        } finally {
            setLoading(false);
        }
    };

    const getProfile = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data: UserResponse = await apiRequest({
                url: `${BASE_URL}/profile`,
                method: 'GET',
                body: null,
                logLabel: 'GET_PROFILE',
                token
            });
            
            // Extract permissions from user.role.permissions
            const userPermissions = data.data?.role?.permissions?.map((p: any) => p.name) || [];
            
            // Add computed permissions field to user object
            const userWithPermissions = {
                ...data.data,
                permissions: userPermissions
            };
            
            setUser(userWithPermissions);
            setPermissions(userPermissions);
            await AsyncStorage.setItem('user', JSON.stringify(userWithPermissions));
            // Simpan permissions ke AsyncStorage
            await AsyncStorage.setItem('permissions', JSON.stringify(userPermissions));
            log('[GET_PROFILE] User profile refreshed:', userWithPermissions);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to get profile';
            log('[GET_PROFILE] error:', errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const loginWithToken = async (token: string, user: any, permissionsFromLogin?: string[]) => {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);
        if (permissionsFromLogin) {
            setPermissions(permissionsFromLogin);
            await AsyncStorage.setItem('permissions', JSON.stringify(permissionsFromLogin));
        }
        log('[LOGIN_WITH_TOKEN] Token and user set from OTP login');
    };

    // Request OTP
    const requestOtp = async (phone: string) => {
        return apiRequest({
            url: `${BASE_URL}/send-otp`,
            method: 'POST',
            body: { phone },
            logLabel: 'REQUEST_OTP',
            token: null
        }) as Promise<SendOtpResponse>;
    };

    // Verify OTP
    const verifyOtp = async (phone: string, otp: string) => {
        if (notifIdLoading) {
            log('[OTP_VERIFY] notif_id OneSignal sedang diproses.');
            throw new Error('notif_id OneSignal sedang diproses. Silakan tunggu sebentar dan coba lagi.');
        }
        
        let notif_id: string | null = notifId;
        if (!notif_id) {
            log('[OTP_VERIFY] notif_id OneSignal tidak tersedia.');
            throw new Error('notif_id OneSignal tidak tersedia. Pastikan aplikasi sudah terdaftar di OneSignal.');
        }
        
        // Log informasi environment dan notif_id untuk debugging
        log('[OTP_VERIFY] Environment info:', {
            notif_id,
            notifIdLoading,
            isExpoGo: notif_id?.includes('expo'),
            isFallback: notif_id?.includes('fallback')
        });
        
        const data: OtpResponse = await apiRequest({
            url: `${BASE_URL}/verify-otp`,
            method: 'POST',
            body: {
                phone,
                otp,
                notif_id: notif_id || 'expo_push_token'
            },
            logLabel: 'OTP_LOGIN',
            token: null
        });
        
        // Extract permissions from user.role.permissions
        const userPermissions = data.data.user?.role?.permissions?.map((p: any) => p.name) || [];
        
        // Add computed permissions field to user object
        const userWithPermissions = {
            ...data.data.user,
            permissions: userPermissions
        };
        
        await loginWithToken(data.data.access_token, userWithPermissions, userPermissions);
        log('[OTP] Login success from OTP, token set');
        return data;
    };

    const refreshUser = async () => {
        return getProfile();
    };

    return {
        user,
        token,
        loading,
        login,
        logout,
        getProfile,
        refreshUser, // alias untuk getProfile
        loginWithToken,
        setUser,
        setToken,
        permissions,
        requestOtp,
        verifyOtp,
    };
}
