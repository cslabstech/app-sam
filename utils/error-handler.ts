import { log } from './logger';
import type { ApiError } from '@/types/common';

/**
 * Standardized error handling utilities following the KISS principle.
 * Provides consistent error processing and user-friendly messages.
 */

/**
 * Extract user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle API error objects
  if (typeof error === 'object' && error !== null) {
    const apiError = error as any;
    
    // Try different error message fields
    if (apiError.message) return apiError.message;
    if (apiError.error) return apiError.error;
    if (apiError.details) return apiError.details;
    
    // Handle validation errors
    if (apiError.errors && typeof apiError.errors === 'object') {
      const firstError = Object.values(apiError.errors)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0] as string;
      }
      if (typeof firstError === 'string') {
        return firstError;
      }
    }
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = getErrorMessage(error).toLowerCase();
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('fetch')
  );
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;
  
  if (typeof error === 'object' && error !== null) {
    const apiError = error as any;
    return apiError.code === 401 || apiError.code === 403;
  }
  
  return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (!error) return false;
  
  if (typeof error === 'object' && error !== null) {
    const apiError = error as any;
    return apiError.code === 422 || apiError.errors;
  }
  
  return false;
}

/**
 * Create standardized API error object
 */
export function createApiError(
  code: number, 
  message: string, 
  field?: string
): ApiError {
  return {
    code,
    message,
    field,
  };
}

/**
 * Log error with context information
 */
export function logError(error: unknown, context: string): void {
  const errorMessage = getErrorMessage(error);
  log(`[ERROR:${context}]`, {
    message: errorMessage,
    error: error,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Standardized error handler hook return type
 */
export interface UseErrorHandlerResult {
  handleError: (error: unknown, context?: string) => string;
  logError: (error: unknown, context: string) => void;
  isNetworkError: (error: unknown) => boolean;
  isAuthError: (error: unknown) => boolean;
  isValidationError: (error: unknown) => boolean;
}

/**
 * Custom hook for standardized error handling
 */
export function useErrorHandler(): UseErrorHandlerResult {
  const handleError = (error: unknown, context?: string): string => {
    const message = getErrorMessage(error);
    if (context) {
      logError(error, context);
    }
    return message;
  };

  return {
    handleError,
    logError,
    isNetworkError,
    isAuthError,
    isValidationError,
  };
}