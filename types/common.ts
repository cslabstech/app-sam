/**
 * Common TypeScript type definitions following consistent naming conventions
 * and patterns throughout the application.
 */

// API Response Types
export interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}

export interface ResponseMeta {
  code: number;
  status: 'success' | 'error';
  message: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ResponseMeta & PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

// Error Types
export interface ApiError {
  code: number;
  message: string;
  field?: string;
  details?: string;
}

export interface ValidationError extends ApiError {
  field: string;
  rule: string;
}

// User Types
export interface User {
  id: string | number;
  username: string;
  name: string;
  email?: string;
  phone?: string | null;
  photo?: string;
  role_id: string | number;
  tm_id?: string | null;
  notif_id: string;
  role: UserRole;
  user_scopes: UserScope[] | UserScope;
  permissions?: string[];
}

export interface UserRole {
  id: string | number;
  name: string;
  scope_required_fields?: any;
  permissions: Permission[];
}

export interface Permission {
  name: string;
}

export interface UserScope {
  id?: number;
  badan_usaha_id?: number | null;
  division_id?: number | null;
  region_id?: number | null;
  cluster_id?: number | null;
}

// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
  notif_id: string;
  version: string;
}

export interface LoginResponse extends ApiResponse<{
  access_token: string;
  token_type: string;
  user: User;
}> {}

export interface OtpRequest {
  phone: string;
}

export interface OtpVerifyRequest {
  phone: string;
  otp: string;
  notif_id: string;
}

export interface OtpResponse extends ApiResponse<{
  access_token: string;
  token_type: string;
  user: User;
}> {}

// Loading States
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

// Common Status Types
export type Status = 'idle' | 'loading' | 'success' | 'error';
export type PermissionStatus = 'granted' | 'denied' | 'default';

// Hook Return Types
export interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseFormResult<T> {
  values: T;
  errors: Record<keyof T, string>;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  isValid: boolean;
  reset: () => void;
}