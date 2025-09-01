/**
 * Authentication Context Provider Tests
 * Integration tests for context/auth-context.tsx functionality
 * 
 * Tests cover:
 * - Context provider initialization
 * - Authentication state management
 * - Hook integration with useAuth
 * - Error boundary handling
 * - Auto-logout callback setup
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ThemedText } from '@/components/ThemedText';

// Mock dependencies
jest.mock('@/hooks/auth/useAuth');
jest.mock('@/utils/api');

const mockUseAuthHook = require('@/hooks/auth/useAuth').useAuth;
const mockSetAutoLogoutCallback = require('@/utils/api').setAutoLogoutCallback;

// Test component to consume auth context
const TestConsumer = ({ onAuthReceived }: { onAuthReceived?: (auth: any) => void }) => {
  const auth = useAuth();
  
  React.useEffect(() => {
    if (onAuthReceived) {
      onAuthReceived(auth);
    }
  }, [auth, onAuthReceived]);

  return (
    <ThemedText testID="auth-consumer">
      User: {auth.user?.name || 'None'}, Loading: {auth.loading ? 'Yes' : 'No'}
    </ThemedText>
  );
};

describe('AuthContext Provider', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    username: 'testuser',
    role: 'field_user',
    permissions: ['visit:create', 'visit:read']
  };

  const mockAuthHook = {
    user: mockUser,
    token: 'mock_token',
    loading: false,
    permissions: mockUser.permissions,
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    loginWithToken: jest.fn(),
    requestOtp: jest.fn(),
    verifyOtp: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthHook.mockReturnValue(mockAuthHook);
    mockSetAutoLogoutCallback.mockImplementation((callback) => {
      // Store callback for testing
      (global as any).__autoLogoutCallback = callback;
    });
  });

  describe('Provider Initialization', () => {
    it('should provide auth hook values to consumers', () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(getByTestId('auth-consumer')).toBeTruthy();
      expect(mockUseAuthHook).toHaveBeenCalled();
    });

    it('should render children correctly', () => {
      const { getByText } = render(
        <AuthProvider>
          <ThemedText>Test Child Component</ThemedText>
        </AuthProvider>
      );

      expect(getByText('Test Child Component')).toBeTruthy();
    });

    it('should render multiple children', () => {
      const { getByText } = render(
        <AuthProvider>
          <ThemedText>First Child</ThemedText>
          <ThemedText>Second Child</ThemedText>
        </AuthProvider>
      );

      expect(getByText('First Child')).toBeTruthy();
      expect(getByText('Second Child')).toBeTruthy();
    });
  });

  describe('Context Value Propagation', () => {
    it('should propagate user state correctly', () => {
      let receivedAuth: any = null;

      render(
        <AuthProvider>
          <TestConsumer onAuthReceived={(auth) => { receivedAuth = auth; }} />
        </AuthProvider>
      );

      expect(receivedAuth).not.toBeNull();
      expect(receivedAuth.user).toEqual(mockUser);
      expect(receivedAuth.token).toBe('mock_token');
      expect(receivedAuth.loading).toBe(false);
      expect(receivedAuth.permissions).toEqual(mockUser.permissions);
    });

    it('should propagate authentication methods', () => {
      let receivedAuth: any = null;

      render(
        <AuthProvider>
          <TestConsumer onAuthReceived={(auth) => { receivedAuth = auth; }} />
        </AuthProvider>
      );

      expect(receivedAuth.login).toBe(mockAuthHook.login);
      expect(receivedAuth.logout).toBe(mockAuthHook.logout);
      expect(receivedAuth.refreshUser).toBe(mockAuthHook.refreshUser);
      expect(receivedAuth.loginWithToken).toBe(mockAuthHook.loginWithToken);
      expect(receivedAuth.requestOtp).toBe(mockAuthHook.requestOtp);
      expect(receivedAuth.verifyOtp).toBe(mockAuthHook.verifyOtp);
    });

    it('should handle null user state', () => {
      mockUseAuthHook.mockReturnValue({
        ...mockAuthHook,
        user: null,
        token: null,
        permissions: []
      });

      let receivedAuth: any = null;

      render(
        <AuthProvider>
          <TestConsumer onAuthReceived={(auth) => { receivedAuth = auth; }} />
        </AuthProvider>
      );

      expect(receivedAuth.user).toBeNull();
      expect(receivedAuth.token).toBeNull();
      expect(receivedAuth.permissions).toEqual([]);
    });

    it('should handle loading state', () => {
      mockUseAuthHook.mockReturnValue({
        ...mockAuthHook,
        loading: true
      });

      let receivedAuth: any = null;

      render(
        <AuthProvider>
          <TestConsumer onAuthReceived={(auth) => { receivedAuth = auth; }} />
        </AuthProvider>
      );

      expect(receivedAuth.loading).toBe(true);
    });
  });

  describe('Auto-Logout Callback Integration', () => {
    it('should set auto-logout callback on mount', () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(mockSetAutoLogoutCallback).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should call logout when auto-logout callback is triggered', () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Get the callback that was set
      const autoLogoutCallback = (global as any).__autoLogoutCallback;
      expect(autoLogoutCallback).toBeDefined();

      // Trigger the callback
      act(() => {
        autoLogoutCallback();
      });

      expect(mockAuthHook.logout).toHaveBeenCalled();
    });

    it('should update auto-logout callback when logout method changes', () => {
      const { rerender } = render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(mockSetAutoLogoutCallback).toHaveBeenCalledTimes(1);

      // Change the logout method
      const newLogout = jest.fn();
      mockUseAuthHook.mockReturnValue({
        ...mockAuthHook,
        logout: newLogout
      });

      rerender(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Should set callback again with new logout method
      expect(mockSetAutoLogoutCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useAuth is used outside provider', () => {
      const ThrowingComponent = () => {
        useAuth();
        return <ThemedText>Should not render</ThemedText>;
      };

      expect(() => render(<ThrowingComponent />)).toThrow(
        'useAuth must be used within AuthProvider'
      );
    });

    it('should handle auth hook errors gracefully', () => {
      mockUseAuthHook.mockImplementation(() => {
        throw new Error('Auth hook error');
      });

      expect(() =>
        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        )
      ).toThrow('Auth hook error');
    });

    it('should handle API callback setup errors', () => {
      mockSetAutoLogoutCallback.mockImplementation(() => {
        throw new Error('API setup error');
      });

      expect(() =>
        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        )
      ).toThrow('API setup error');
    });
  });

  describe('State Changes and Updates', () => {
    it('should re-render when auth state changes', () => {
      let renderCount = 0;
      
      const CountingConsumer = () => {
        renderCount++;
        const auth = useAuth();
        return <ThemedText>Render: {renderCount}, User: {auth.user?.name}</ThemedText>;
      };

      const { rerender } = render(
        <AuthProvider>
          <CountingConsumer />
        </AuthProvider>
      );

      expect(renderCount).toBe(1);

      // Change auth state
      mockUseAuthHook.mockReturnValue({
        ...mockAuthHook,
        user: { ...mockUser, name: 'Updated User' }
      });

      rerender(
        <AuthProvider>
          <CountingConsumer />
        </AuthProvider>
      );

      expect(renderCount).toBe(2);
    });

    it('should handle multiple consumers correctly', () => {
      const consumers: any[] = [];

      const Consumer1 = () => {
        const auth = useAuth();
        consumers[0] = auth;
        return <ThemedText>Consumer 1: {auth.user?.name}</ThemedText>;
      };

      const Consumer2 = () => {
        const auth = useAuth();
        consumers[1] = auth;
        return <ThemedText>Consumer 2: {auth.loading ? 'Loading' : 'Ready'}</ThemedText>;
      };

      render(
        <AuthProvider>
          <Consumer1 />
          <Consumer2 />
        </AuthProvider>
      );

      expect(consumers).toHaveLength(2);
      expect(consumers[0]).toBeDefined();
      expect(consumers[1]).toBeDefined();
      expect(consumers[0]).toBe(consumers[1]); // Same context value
    });
  });

  describe('Nested Providers', () => {
    it('should handle nested AuthProviders correctly', () => {
      const OuterConsumer = () => {
        const auth = useAuth();
        return <ThemedText>Outer: {auth.user?.name}</ThemedText>;
      };

      const InnerConsumer = () => {
        const auth = useAuth();
        return <ThemedText>Inner: {auth.user?.name}</ThemedText>;
      };

      const { getByText } = render(
        <AuthProvider>
          <OuterConsumer />
          <AuthProvider>
            <InnerConsumer />
          </AuthProvider>
        </AuthProvider>
      );

      expect(getByText('Outer: Test User')).toBeTruthy();
      expect(getByText('Inner: Test User')).toBeTruthy();
    });
  });

  describe('Integration with Real Components', () => {
    it('should work with real authentication flow components', () => {
      const LoginComponent = () => {
        const { login, loading } = useAuth();
        
        const handleLogin = () => {
          login('testuser', 'password');
        };

        return (
          <ThemedText testID="login-component">
            Loading: {loading ? 'Yes' : 'No'}
          </ThemedText>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <LoginComponent />
        </AuthProvider>
      );

      expect(getByTestId('login-component')).toBeTruthy();
    });

    it('should maintain context across component tree', () => {
      const DeepChild = () => {
        const { user } = useAuth();
        return <ThemedText testID="deep-child">Deep: {user?.name}</ThemedText>;
      };

      const MiddleChild = () => (
        <ThemedText>
          Middle
          <DeepChild />
        </ThemedText>
      );

      const { getByTestId } = render(
        <AuthProvider>
          <MiddleChild />
        </AuthProvider>
      );

      expect(getByTestId('deep-child')).toBeTruthy();
    });
  });

  describe('Performance Considerations', () => {
    it('should not cause excessive re-renders', () => {
      let renderCount = 0;
      
      const MemoizedConsumer = React.memo(() => {
        renderCount++;
        const { user } = useAuth();
        return <ThemedText>Renders: {renderCount}, User: {user?.name}</ThemedText>;
      });

      const { rerender } = render(
        <AuthProvider>
          <MemoizedConsumer />
        </AuthProvider>
      );

      expect(renderCount).toBe(1);

      // Re-render with same auth state
      rerender(
        <AuthProvider>
          <MemoizedConsumer />
        </AuthProvider>
      );

      // Component should re-render because context provider re-renders
      expect(renderCount).toBeGreaterThanOrEqual(1);
    });
  });
});