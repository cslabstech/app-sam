import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/utils/api';
import { log } from '@/utils/logger';
import { useCallback, useState } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

// ========================================================================
// STANDARDIZED PATTERNS FOR ALL API HOOKS
// ========================================================================

// Standard return type for all operations
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: any;
}

// Standard state interface for hooks
export interface ApiHookState<T> {
  data: T[];
  item: T | null;
  loading: boolean;
  error: string | null;
  meta: any;
}

// Standard pagination interface sesuai foundation.md
export interface PaginationMeta {
  code: number;
  status: 'success' | 'error';
  message: string;
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

// Standard response format sesuai foundation.md
export interface StandardResponse<T> {
  meta: {
    code: number;
    status: 'success' | 'error';
    message: string;
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
  };
  data: T;
  errors?: Record<string, string[]>;
}

// ========================================================================
// BASE HOOK: Reusable API operations
// ========================================================================

export function useBaseApi<T extends { id: string | number }>(
  entityName: string, // 'user', 'outlet', 'visit', etc.
  entityPath: string  // '/user', '/outlets', '/visit', etc.
) {
  const { token } = useAuth();
  
  // Standard state pattern
  const [data, setData] = useState<T[]>([]);
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Standardized error handling
  const handleApiCall = useCallback(async <R>(
    operation: () => Promise<StandardResponse<R>>,
    operationName: string,
    onSuccess?: (result: StandardResponse<R>) => void
  ): Promise<ApiResult<R>> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await operation();
      
      // Check response status dari meta
      if (response.meta.status === 'error') {
        const errorMessage = response.meta.message || `Failed to ${operationName.toLowerCase()}`;
        setError(errorMessage);
        log(`[${entityName.toUpperCase()}_${operationName}] API Error:`, errorMessage);
        return { success: false, error: errorMessage, meta: response.meta };
      }
      
      onSuccess?.(response);
      log(`[${entityName.toUpperCase()}_${operationName}] Success:`, response.meta.message);
      return { 
        success: true, 
        data: response.data, 
        meta: response.meta 
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : `Failed to ${operationName.toLowerCase()}`;
      log(`[${entityName.toUpperCase()}_${operationName}] Error:`, errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [entityName]);

  // ========================================================================
  // STANDARD CRUD OPERATIONS
  // ========================================================================

  const fetchList = useCallback(async (params?: Record<string, any>): Promise<ApiResult<T[]>> => {
    return handleApiCall(async () => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const url = `${BASE_URL}${entityPath}${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response: StandardResponse<T[]> = await apiRequest({
        url,
        method: 'GET',
        body: null,
        logLabel: `FETCH_${entityName.toUpperCase()}_LIST`,
        token
      });
      
      setData(response.data || []);
      setMeta(response.meta as PaginationMeta);
      return response;
    }, 'FETCH_LIST', (response) => {
      setData(response.data || []);
      setMeta(response.meta as PaginationMeta);
    });
  }, [entityName, entityPath, handleApiCall, token]);

  const fetchItem = useCallback(async (id: string | number): Promise<ApiResult<T>> => {
    return handleApiCall(async () => {
      const response: StandardResponse<T> = await apiRequest({
        url: `${BASE_URL}${entityPath}/${encodeURIComponent(id)}`,
        method: 'GET',
        body: null,
        logLabel: `FETCH_${entityName.toUpperCase()}_ITEM`,
        token
      });
      
      setItem(response.data);
      return response;
    }, 'FETCH_ITEM', (response) => {
      setItem(response.data);
    });
  }, [entityName, entityPath, handleApiCall, token]);

  const createItem = useCallback(async (data: Partial<T>): Promise<ApiResult<T>> => {
    return handleApiCall(async () => {
      const response: StandardResponse<T> = await apiRequest({
        url: `${BASE_URL}${entityPath}`,
        method: 'POST',
        body: data,
        logLabel: `CREATE_${entityName.toUpperCase()}`,
        token
      });
      
      // Refresh list after creation
      await fetchList();
      return response;
    }, 'CREATE', (response) => {
      // List akan di-refresh lewat fetchList()
    });
  }, [entityName, entityPath, handleApiCall, token, fetchList]);

  const updateItem = useCallback(async (id: string | number, data: Partial<T>): Promise<ApiResult<T>> => {
    return handleApiCall(async () => {
      const response: StandardResponse<T> = await apiRequest({
        url: `${BASE_URL}${entityPath}/${encodeURIComponent(id)}`,
        method: 'PUT',
        body: data,
        logLabel: `UPDATE_${entityName.toUpperCase()}`,
        token
      });
      
      // Refresh list after update
      await fetchList();
      setItem(response.data);
      return response;
    }, 'UPDATE', (response) => {
      setItem(response.data);
    });
  }, [entityName, entityPath, handleApiCall, token, fetchList]);

  const deleteItem = useCallback(async (id: string | number): Promise<ApiResult<void>> => {
    return handleApiCall(async () => {
      const response: StandardResponse<void> = await apiRequest({
        url: `${BASE_URL}${entityPath}/${encodeURIComponent(id)}`,
        method: 'DELETE',
        body: null,
        logLabel: `DELETE_${entityName.toUpperCase()}`,
        token
      });
      
      // Refresh list after deletion
      await fetchList();
      if (item?.id === id) {
        setItem(null);
      }
      return response;
    }, 'DELETE');
  }, [entityName, entityPath, handleApiCall, token, fetchList, item]);

  // File upload operation - menggunakan POST untuk multipart
  const uploadFile = useCallback(async (
    id: string | number | null, 
    formData: FormData, 
    operation: 'create' | 'update' = 'update'
  ): Promise<ApiResult<T>> => {
    return handleApiCall(async () => {
      const url = id 
        ? `${BASE_URL}${entityPath}/${encodeURIComponent(id)}`
        : `${BASE_URL}${entityPath}`;
      
      const response: StandardResponse<T> = await apiRequest({
        url,
        method: 'POST', // Selalu POST untuk file upload
        body: formData,
        logLabel: `${operation.toUpperCase()}_${entityName.toUpperCase()}_FILE`,
        token
      });
      
      // Refresh list after upload
      await fetchList();
      if (operation === 'update' && id) {
        setItem(response.data);
      }
      return response;
    }, `${operation.toUpperCase()}_FILE`, (response) => {
      if (operation === 'update' && id) {
        setItem(response.data);
      }
    });
  }, [entityName, entityPath, handleApiCall, token, fetchList]);

  return {
    // State
    data,
    item,
    loading,
    error,
    meta,
    
    // Operations
    fetchList,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    uploadFile,
    
    // Utils
    setData,
    setItem,
    setError,
  };
}

// ========================================================================
// SPECIALIZED HOOKS: For complex operations
// ========================================================================

export function useAuthApi() {
  const { token } = useAuth();
  
  const handleAuthCall = useCallback(async <T>(
    operation: () => Promise<StandardResponse<T>>,
    operationName: string
  ): Promise<ApiResult<T>> => {
    try {
      const response = await operation();
      
      // Check response status dari meta
      if (response.meta.status === 'error') {
        const errorMessage = response.meta.message || `Failed to ${operationName}`;
        log(`[AUTH_${operationName}] API Error:`, errorMessage);
        return { success: false, error: errorMessage, meta: response.meta };
      }
      
      log(`[AUTH_${operationName}] Success:`, response.meta.message);
      return { success: true, data: response.data, meta: response.meta };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : `Failed to ${operationName}`;
      log(`[AUTH_${operationName}] Error:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const login = useCallback(async (username: string, password: string, notifId: string): Promise<ApiResult<any>> => {
    return handleAuthCall(async () => {
      return await apiRequest({
        url: `${BASE_URL}/login`,
        method: 'POST',
        body: { version: '2.0.0', username, password, notif_id: notifId },
        logLabel: 'LOGIN',
        token: null
      });
    }, 'LOGIN');
  }, [handleAuthCall]);

  const verifyOtp = useCallback(async (phone: string, otp: string, notifId: string): Promise<ApiResult<any>> => {
    return handleAuthCall(async () => {
      return await apiRequest({
        url: `${BASE_URL}/verify-otp`,
        method: 'POST',
        body: { phone, otp, notif_id: notifId },
        logLabel: 'VERIFY_OTP',
        token: null
      });
    }, 'VERIFY_OTP');
  }, [handleAuthCall]);

  const requestOtp = useCallback(async (phone: string): Promise<ApiResult<any>> => {
    return handleAuthCall(async () => {
      return await apiRequest({
        url: `${BASE_URL}/send-otp`,
        method: 'POST',
        body: { phone },
        logLabel: 'REQUEST_OTP',
        token: null
      });
    }, 'REQUEST_OTP');
  }, [handleAuthCall]);

  const getProfile = useCallback(async (): Promise<ApiResult<any>> => {
    return handleAuthCall(async () => {
      return await apiRequest({
        url: `${BASE_URL}/profile`,
        method: 'GET',
        body: null,
        logLabel: 'GET_PROFILE',
        token
      });
    }, 'GET_PROFILE');
  }, [handleAuthCall, token]);

  const logout = useCallback(async (): Promise<ApiResult<void>> => {
    return handleAuthCall(async () => {
      return await apiRequest({
        url: `${BASE_URL}/logout`,
        method: 'POST',
        body: null,
        logLabel: 'LOGOUT',
        token
      });
    }, 'LOGOUT');
  }, [handleAuthCall, token]);

  return {
    login,
    verifyOtp,
    requestOtp,
    getProfile,
    logout,
  };
} 