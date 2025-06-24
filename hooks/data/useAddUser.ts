import { ApiResult, useBaseApi } from '@/hooks/utils/useBaseApi';

export interface NewUserPayload {
  name: string;
  username: string;
  phone: string;
  role: string;
  badanusaha?: string;
  divisi?: string;
  region?: string;
  cluster?: string;
}

// User interface - extend base pattern
export interface User {
  id: string | number;
  name: string;
  username: string;
  phone: string;
  role: string;
  badanusaha?: string;
  divisi?: string;
  region?: string;
  cluster?: string;
}

export function useAddUser() {
  const baseApi = useBaseApi<User>('user', '/user');

  // ✅ STANDARDIZED: Returns ApiResult format
  const addUser = async (payload: NewUserPayload): Promise<ApiResult<User>> => {
    return baseApi.createItem(payload);
  };

  return {
    // ✅ Consistent state from base hook
    loading: baseApi.loading,
    error: baseApi.error,
    
    // ✅ Standardized operation
    addUser,
  };
}
