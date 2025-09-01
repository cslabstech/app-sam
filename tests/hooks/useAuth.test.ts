/**
 * Comprehensive test suite for authentication hooks
 * Tests useAuth, useAuthData, useAuthActions with TypeScript interfaces and validation
 * Covers authentication state management, token handling, and error scenarios
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/auth/useAuth';
import { useAuthData } from '@/hooks/auth/useAuthData';
import { useAuthActions } from '@/hooks/auth/useAuthActions';
import { User } from '@/types/common';
// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('@/utils/api', () => ({
  apiRequest: jest.fn(),
}));

jest.mock('@/context/notifid-context', () => ({
  useNotifId: () => ({
    notifId: 'test_notif_id',
    notifIdLoading: false,
  }),
}));

jest.mock('@/utils/logger', () => ({
  log: jest.fn(),
}));

// TypeScript interfaces for comprehensive validation
interface AuthHookState {
  user: User | null;
  token: string | null;
  permissions: string[];
  loading: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
}

interface CompleteAuthHook extends AuthHookState, AuthActions {
  refresh: () => Promise<void>;
  getProfile: () => Promise<void>;
  setUser: () => void;
  setToken: () => void;
}

// Test data with proper TypeScript typing
const TEST_USER: User = {
  id: '1',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  phone: '+628123456789',
  photo: 'https://example.com/photo.jpg',
  role_id: '1',
  tm_id: 'TM001',
  notif_id: 'test_notif_id',
  role: {
    id: '1',
    name: 'Admin',
    scope_required_fields: {},
    permissions: [
      { name: 'users.read' },
      { name: 'users.write' },
      { name: 'outlets.manage' }
    ]
  },
  user_scopes: [{
    id: 1,
    badan_usaha_id: 1,
    division_id: 1,
    region_id: 1,
    cluster_id: 1
  }],
  permissions: ['users.read', 'users.write', 'outlets.manage']
};

const TEST_TOKEN = 'test_bearer_token_123';
const TEST_PERMISSIONS = ['users.read', 'users.write', 'outlets.manage'];

// Validation functions for TypeScript interfaces
const isValidUser = (user: any): user is User => {
  return (
    typeof user?.id === 'string' &&
    typeof user?.username === 'string' &&
    typeof user?.name === 'string' &&
    typeof user?.role === 'object' &&
    typeof user?.role?.name === 'string' &&
    Array.isArray(user?.role?.permissions) &&
    (Array.isArray(user?.user_scopes) || typeof user?.user_scopes === 'object')
  );
};

const isValidAuthState = (state: any): state is AuthHookState => {
  return (
    (state.user === null || isValidUser(state.user)) &&
    (typeof state.token === 'string' || state.token === null) &&
    Array.isArray(state.permissions) &&
    typeof state.loading === 'boolean'
  );
};

const isValidAuthActions = (actions: any): actions is AuthActions => {
  return (
    typeof actions.login === 'function' &&
    typeof actions.logout === 'function' &&
    typeof actions.requestOtp === 'function' &&
    typeof actions.verifyOtp === 'function' &&
    typeof actions.refreshUser === 'function' &&
    typeof actions.loginWithToken === 'function'
  );
};

describe('Authentication Hooks', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockApiRequest = require('@/utils/api').apiRequest as jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
  });

  describe('useAuth (Main Hook)', () => {
    it('should have correct TypeScript interface structure', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const authHook = result.current as CompleteAuthHook;

      // Validate state properties with TypeScript checking
      expect(isValidAuthState({
        user: authHook.user,
        token: authHook.token,
        permissions: authHook.permissions,
        loading: authHook.loading
      })).toBe(true);

      // Validate action functions
      expect(isValidAuthActions(authHook)).toBe(true);

      // Check backward compatibility methods
      expect(typeof authHook.refresh).toBe('function');
      expect(typeof authHook.getProfile).toBe('function');
      expect(typeof authHook.setUser).toBe('function');
      expect(typeof authHook.setToken).toBe('function');
    });

    it('should initialize with empty state when no stored data', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.permissions).toEqual([]);
    });

    it('should restore authenticated state from AsyncStorage', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'token':
            return Promise.resolve(TEST_TOKEN);
          case 'user':
            return Promise.resolve(JSON.stringify(TEST_USER));
          case 'permissions':
            return Promise.resolve(JSON.stringify(TEST_PERMISSIONS));
          default:
            return Promise.resolve(null);
        }
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(TEST_USER);
      expect(result.current.token).toBe(TEST_TOKEN);
      expect(result.current.permissions).toEqual(TEST_PERMISSIONS);
    });

    it('should perform successful login with proper data validation', async () => {
      const loginResponse = {
        meta: { status: 'success', code: 200, message: 'Login successful' },
        data: {
          access_token: TEST_TOKEN,
          token_type: 'Bearer',
          user: TEST_USER
        }
      };

      mockApiRequest.mockResolvedValueOnce(loginResponse);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('appdev', 'password');
      });

      // Validate stored data
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('token', TEST_TOKEN);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'user', 
        JSON.stringify(expect.objectContaining({
          id: TEST_USER.id,
          username: TEST_USER.username,
          permissions: TEST_PERMISSIONS
        }))
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'permissions', 
        JSON.stringify(TEST_PERMISSIONS)
      );
    });

    it('should handle login error with proper error parsing', async () => {
      const errorResponse = {
        meta: { status: 'error', code: 401, message: 'Invalid credentials' },
        data: null
      };

      mockApiRequest.mockRejectedValueOnce(errorResponse);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('wrong', 'credentials');
        })
      ).rejects.toMatchObject({
        meta: { code: 401, message: 'Invalid credentials' }
      });

      // Ensure state remains clean after error
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.permissions).toEqual([]);
    });

    it('should perform proper logout and cleanup', async () => {
      // Setup authenticated state first
      mockAsyncStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'token':
            return Promise.resolve(TEST_TOKEN);
          case 'user':
            return Promise.resolve(JSON.stringify(TEST_USER));
          case 'permissions':
            return Promise.resolve(JSON.stringify(TEST_PERMISSIONS));
          default:
            return Promise.resolve(null);
        }
      });

      mockApiRequest.mockResolvedValueOnce({
        meta: { status: 'success', code: 200, message: 'Logged out successfully' },
        data: { message: 'Logged out successfully' }
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(TEST_USER);
      });

      await act(async () => {
        await result.current.logout();
      });

      // Verify cleanup
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('permissions');

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.permissions).toEqual([]);
    });

    it('should handle OTP request and verification', async () => {
      const otpResponse = {
        meta: { status: 'success', code: 200, message: 'OTP sent successfully' },
        data: { message: 'OTP sent successfully', phone: '+628123456789' }
      };

      const verifyResponse = {
        meta: { status: 'success', code: 200, message: 'OTP verified successfully' },
        data: {
          access_token: TEST_TOKEN,
          token_type: 'Bearer',
          user: TEST_USER
        }
      };

      mockApiRequest
        .mockResolvedValueOnce(otpResponse)
        .mockResolvedValueOnce(verifyResponse);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Test OTP request
      await act(async () => {
        await result.current.requestOtp('+628123456789');
      });

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/send-otp'),
          method: 'POST',
          body: expect.objectContaining({
            phone: '+628123456789'
          })
        })
      );

      // Test OTP verification
      await act(async () => {
        await result.current.verifyOtp('+628123456789', '123456');
      });

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/verify-otp'),
          method: 'POST',
          body: expect.objectContaining({
            phone: '+628123456789',
            otp: '123456'
          })
        })
      );

      // Verify authenticated state after OTP verification
      expect(result.current.user).toEqual(expect.objectContaining({
        id: TEST_USER.id,
        username: TEST_USER.username
      }));
      expect(result.current.token).toBe(TEST_TOKEN);
    });

    it('should refresh user profile when authenticated', async () => {
      // Setup authenticated state
      mockAsyncStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'token':
            return Promise.resolve(TEST_TOKEN);
          case 'user':
            return Promise.resolve(JSON.stringify(TEST_USER));
          case 'permissions':
            return Promise.resolve(JSON.stringify(TEST_PERMISSIONS));
          default:
            return Promise.resolve(null);
        }
      });

      const profileResponse = {
        meta: { status: 'success', code: 200, message: 'Profile retrieved successfully' },
        data: { ...TEST_USER, name: 'Updated Test User' }
      };

      mockApiRequest.mockResolvedValueOnce(profileResponse);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(TEST_USER);
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/profile'),
          method: 'GET',
          token: TEST_TOKEN
        })
      );
    });

    it('should throw error when refreshing without token', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.refreshUser();
        })
      ).rejects.toThrow('No authentication token available');
    });

    it('should handle network errors gracefully', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('Network Error'));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('appdev', 'password');
        })
      ).rejects.toThrow('Network Error');

      // Ensure state remains clean after network error
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('should support loginWithToken functionality', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithToken(TEST_TOKEN);
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('token', TEST_TOKEN);
    });

    it('should handle deprecated method warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setUser();
        result.current.setToken();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'setUser is deprecated. Use refreshUser or updateUser instead.'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'setToken is deprecated. Use loginWithToken instead.'
      );

      consoleSpy.mockRestore();
    });

    it('should handle complex permission structures', async () => {
      const complexUser = {
        ...TEST_USER,
        role: {
          ...TEST_USER.role,
          permissions: [
            { name: 'admin.full_access' },
            { name: 'outlets.create' },
            { name: 'outlets.update' },
            { name: 'outlets.delete' },
            { name: 'visits.manage' },
            { name: 'users.admin' },
            { name: 'reports.view' }
          ]
        }
      };

      const expectedPermissions = [
        'admin.full_access',
        'outlets.create',
        'outlets.update',
        'outlets.delete',
        'visits.manage',
        'users.admin',
        'reports.view'
      ];

      const loginResponse = {
        meta: { status: 'success', code: 200, message: 'Login successful' },
        data: {
          access_token: TEST_TOKEN,
          token_type: 'Bearer',
          user: complexUser
        }
      };

      mockApiRequest.mockResolvedValueOnce(loginResponse);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('appdev', 'password');
      });

      expect(result.current.permissions).toEqual(expectedPermissions);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'permissions',
        JSON.stringify(expectedPermissions)
      );
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle concurrent login attempts', async () => {
      const loginResponse = {
        meta: { status: 'success', code: 200, message: 'Login successful' },
        data: {
          access_token: TEST_TOKEN,
          token_type: 'Bearer',
          user: TEST_USER
        }
      };

      mockApiRequest.mockResolvedValue(loginResponse);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate concurrent login attempts
      const loginPromises = [
        act(async () => result.current.login('appdev', 'password')),
        act(async () => result.current.login('appdev', 'password')),
        act(async () => result.current.login('appdev', 'password'))
      ];

      await Promise.all(loginPromises);

      // Should still have consistent state
      expect(result.current.user).toEqual(expect.objectContaining({
        id: TEST_USER.id,
        username: TEST_USER.username
      }));
      expect(result.current.token).toBe(TEST_TOKEN);
    });

    it('should handle malformed user data from storage', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'token':
            return Promise.resolve(TEST_TOKEN);
          case 'user':
            return Promise.resolve('invalid_json_data');
          case 'permissions':
            return Promise.resolve(JSON.stringify(TEST_PERMISSIONS));
          default:
            return Promise.resolve(null);
        }
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle malformed data gracefully
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.permissions).toEqual([]);
    });
  });
});