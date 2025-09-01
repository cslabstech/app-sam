/**
 * useAuth Hook Tests
 * Comprehensive tests for hooks/auth/useAuth.ts functionality
 * 
 * Tests cover:
 * - Combined authentication state management
 * - Integration between useAuthData and useAuthActions
 * - Loading state management
 * - Backward compatibility
 * - Error handling scenarios
 */

import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/auth/useAuth';

// Mock the dependent hooks
jest.mock('@/hooks/auth/useAuthData');
jest.mock('@/hooks/auth/useAuthActions');

const mockUseAuthData = require('@/hooks/auth/useAuthData').useAuthData;
const mockUseAuthActions = require('@/hooks/auth/useAuthActions').useAuthActions;

describe('useAuth Hook Tests', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    username: 'testuser',
    role: 'field_user',
    permissions: ['visit:create', 'visit:read']
  };

  const mockToken = 'mock_jwt_token_123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockUseAuthData.mockReturnValue({
      user: mockUser,
      token: mockToken,
      permissions: mockUser.permissions,
      loading: false,
      refresh: jest.fn().mockResolvedValue(undefined)
    });

    mockUseAuthActions.mockReturnValue({
      actionLoading: false,
      login: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn().mockResolvedValue(undefined),
      requestOtp: jest.fn().mockResolvedValue(undefined),
      verifyOtp: jest.fn().mockResolvedValue(undefined),
      refreshProfile: jest.fn().mockResolvedValue(undefined),
      loginWithToken: jest.fn().mockResolvedValue(undefined)
    });
  });

  describe('State Management', () => {
    it('should provide authentication state from useAuthData', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.permissions).toEqual(mockUser.permissions);
    });

    it('should combine loading states from both hooks', () => {
      mockUseAuthData.mockReturnValue({
        user: mockUser,
        token: mockToken,
        permissions: mockUser.permissions,
        loading: true, // Data loading
        refresh: jest.fn()
      });

      mockUseAuthActions.mockReturnValue({
        actionLoading: false, // Action not loading
        login: jest.fn(),
        logout: jest.fn(),
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        refreshProfile: jest.fn(),
        loginWithToken: jest.fn()
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true); // Should be true if either is loading
    });

    it('should show loading when action is in progress', () => {
      mockUseAuthData.mockReturnValue({
        user: mockUser,
        token: mockToken,
        permissions: mockUser.permissions,
        loading: false, // Data not loading
        refresh: jest.fn()
      });

      mockUseAuthActions.mockReturnValue({
        actionLoading: true, // Action loading
        login: jest.fn(),
        logout: jest.fn(),
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        refreshProfile: jest.fn(),
        loginWithToken: jest.fn()
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true); // Should be true if either is loading
    });

    it('should not be loading when both hooks are not loading', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Authentication Actions', () => {
    it('should provide login functionality', async () => {
      const mockLogin = jest.fn().mockResolvedValue(undefined);
      mockUseAuthActions.mockReturnValue({
        actionLoading: false,
        login: mockLogin,
        logout: jest.fn(),
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        refreshProfile: jest.fn(),
        loginWithToken: jest.fn()
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });

    it('should provide logout functionality', async () => {
      const mockLogout = jest.fn().mockResolvedValue(undefined);
      mockUseAuthActions.mockReturnValue({
        actionLoading: false,
        login: jest.fn(),
        logout: mockLogout,
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        refreshProfile: jest.fn(),
        loginWithToken: jest.fn()
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
    });

    it('should provide OTP request functionality', async () => {
      const mockRequestOtp = jest.fn().mockResolvedValue(undefined);
      mockUseAuthActions.mockReturnValue({
        actionLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        requestOtp: mockRequestOtp,
        verifyOtp: jest.fn(),
        refreshProfile: jest.fn(),
        loginWithToken: jest.fn()
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.requestOtp('testuser');
      });

      expect(mockRequestOtp).toHaveBeenCalledWith('testuser');
    });

    it('should provide OTP verification functionality', async () => {
      const mockVerifyOtp = jest.fn().mockResolvedValue(undefined);
      mockUseAuthActions.mockReturnValue({
        actionLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        requestOtp: jest.fn(),
        verifyOtp: mockVerifyOtp,
        refreshProfile: jest.fn(),
        loginWithToken: jest.fn()
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.verifyOtp('testuser', '123456');
      });

      expect(mockVerifyOtp).toHaveBeenCalledWith('testuser', '123456');
    });

    it('should provide token-based login functionality', async () => {
      const mockLoginWithToken = jest.fn().mockResolvedValue(undefined);
      mockUseAuthActions.mockReturnValue({
        actionLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        refreshProfile: jest.fn(),
        loginWithToken: mockLoginWithToken
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.loginWithToken('existing_token_123');
      });

      expect(mockLoginWithToken).toHaveBeenCalledWith('existing_token_123');
    });
  });

  describe('User Profile Management', () => {
    it('should provide refreshUser functionality', async () => {
      const mockRefreshProfile = jest.fn().mockResolvedValue(undefined);
      mockUseAuthActions.mockReturnValue({
        actionLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        refreshProfile: mockRefreshProfile,
        loginWithToken: jest.fn()
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(mockRefreshProfile).toHaveBeenCalledWith(mockToken);
    });

    it('should handle refreshUser without token', async () => {
      mockUseAuthData.mockReturnValue({
        user: null,
        token: null, // No token
        permissions: [],
        loading: false,
        refresh: jest.fn()
      });

      const { result } = renderHook(() => useAuth());

      await expect(async () => {
        await act(async () => {
          await result.current.refreshUser();
        });
      }).rejects.toThrow('No authentication token available');
    });

    it('should provide data refresh functionality', async () => {
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      mockUseAuthData.mockReturnValue({
        user: mockUser,
        token: mockToken,
        permissions: mockUser.permissions,
        loading: false,
        refresh: mockRefresh
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('Backward Compatibility', () => {
    it('should provide getProfile alias for refreshUser', async () => {
      const mockRefreshProfile = jest.fn().mockResolvedValue(undefined);
      mockUseAuthActions.mockReturnValue({
        actionLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        refreshProfile: mockRefreshProfile,
        loginWithToken: jest.fn()
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.getProfile();
      });

      expect(mockRefreshProfile).toHaveBeenCalledWith(mockToken);
    });

    it('should provide deprecated setUser function with warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setUser();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'setUser is deprecated. Use refreshUser or updateUser instead.'
      );
      
      consoleSpy.mockRestore();
    });

    it('should provide deprecated setToken function with warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setToken();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'setToken is deprecated. Use loginWithToken instead.'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Hook Integration', () => {
    it('should properly integrate useAuthData and useAuthActions', () => {
      const { result } = renderHook(() => useAuth());

      // Should have properties from both hooks
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('token');
      expect(result.current).toHaveProperty('permissions');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('requestOtp');
      expect(result.current).toHaveProperty('verifyOtp');
      expect(result.current).toHaveProperty('refreshUser');
      expect(result.current).toHaveProperty('loginWithToken');
      expect(result.current).toHaveProperty('refresh');
    });

    it('should handle changes in dependent hooks', () => {
      const { result, rerender } = renderHook(() => useAuth());

      // Initial state
      expect(result.current.user).toEqual(mockUser);

      // Update mock to simulate user change
      mockUseAuthData.mockReturnValue({
        user: { ...mockUser, name: 'Updated User' },
        token: mockToken,
        permissions: mockUser.permissions,
        loading: false,
        refresh: jest.fn()
      });

      rerender();

      expect(result.current.user.name).toBe('Updated User');
    });

    it('should handle loading state changes', () => {
      const { result, rerender } = renderHook(() => useAuth());

      // Initial state - not loading
      expect(result.current.loading).toBe(false);

      // Update to loading state
      mockUseAuthActions.mockReturnValue({
        actionLoading: true,
        login: jest.fn(),
        logout: jest.fn(),
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        refreshProfile: jest.fn(),
        loginWithToken: jest.fn()
      });

      rerender();

      expect(result.current.loading).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle errors in authentication actions', async () => {
      const mockLogin = jest.fn().mockRejectedValue(new Error('Login failed'));
      mockUseAuthActions.mockReturnValue({
        actionLoading: false,
        login: mockLogin,
        logout: jest.fn(),
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        refreshProfile: jest.fn(),
        loginWithToken: jest.fn()
      });

      const { result } = renderHook(() => useAuth());

      await expect(async () => {
        await act(async () => {
          await result.current.login('testuser', 'wrong_password');
        });
      }).rejects.toThrow('Login failed');
    });

    it('should handle errors in profile refresh', async () => {
      const mockRefreshProfile = jest.fn().mockRejectedValue(new Error('Profile refresh failed'));
      mockUseAuthActions.mockReturnValue({
        actionLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        refreshProfile: mockRefreshProfile,
        loginWithToken: jest.fn()
      });

      const { result } = renderHook(() => useAuth());

      await expect(async () => {
        await act(async () => {
          await result.current.refreshUser();
        });
      }).rejects.toThrow('Profile refresh failed');
    });

    it('should handle missing dependencies gracefully', () => {
      mockUseAuthData.mockReturnValue({
        user: null,
        token: null,
        permissions: [],
        loading: false,
        refresh: jest.fn()
      });

      mockUseAuthActions.mockReturnValue({
        actionLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
        refreshProfile: jest.fn(),
        loginWithToken: jest.fn()
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.permissions).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });
});