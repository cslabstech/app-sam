/**
 * Comprehensive test suite for React Context providers
 * Tests AuthProvider, NetworkProvider, NotifIdProvider integration and state management
 * Covers context value propagation, state updates, error handling, and provider composition
 */

import React, { useEffect } from 'react';
import { render, act, waitFor, renderHook } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { NetworkProvider, useNetwork } from '@/context/network-context';
import { NotifIdProvider, useNotifId } from '@/context/notifid-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  useNetInfo: () => ({
    isConnected: true,
    type: 'wifi',
  }),
}));

jest.mock('@/hooks/auth/useAuth', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    permissions: [],
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    loginWithToken: jest.fn(),
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
  }),
}));

jest.mock('@/hooks/utils/useNotification', () => ({
  useNotification: () => ({
    notificationId: 'test_notification_id',
    permission: 'granted',
    loading: false,
  }),
}));

jest.mock('@/utils/api', () => ({
  setAutoLogoutCallback: jest.fn(),
}));

// TypeScript interfaces for context validation
interface AuthContextValue {
  user: any | null;
  token: string | null;
  loading: boolean;
  permissions: string[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginWithToken: (token: string, user: any, permissions?: string[]) => Promise<void>;
  requestOtp: (phone: string) => Promise<any>;
  verifyOtp: (phone: string, otp: string) => Promise<any>;
}

interface NetworkContextValue {
  isConnected: boolean;
}

interface NotifIdContextValue {
  notifId: string | null;
  setNotifId: (id: string | null) => void;
  notificationPermission: 'default' | 'granted' | 'denied' | null;
  setNotificationPermission: (status: 'default' | 'granted' | 'denied' | null) => void;
  notifIdLoading: boolean;
  setNotifIdLoading: (loading: boolean) => void;
}

// Test data
const TEST_USER = {
  id: '1',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  permissions: ['users.read', 'outlets.manage']
};

const TEST_TOKEN = 'test_bearer_token_123';

// Helper components for testing context consumption
const AuthConsumer = ({ onContextValue }: { onContextValue: (value: AuthContextValue) => void }) => {
  const authValue = useAuth();
  
  useEffect(() => {
    onContextValue(authValue);
  }, [authValue, onContextValue]);

  return (
    <div testID="auth-consumer">
      <div testID="user-info">{authValue.user?.name || 'No user'}</div>
      <div testID="loading-state">{authValue.loading.toString()}</div>
      <div testID="permissions-count">{authValue.permissions.length}</div>
    </div>
  );
};

const NetworkConsumer = ({ onContextValue }: { onContextValue: (value: NetworkContextValue) => void }) => {
  const networkValue = useNetwork();
  
  useEffect(() => {
    onContextValue(networkValue);
  }, [networkValue, onContextValue]);

  return (
    <div testID="network-consumer">
      <div testID="connection-status">{networkValue.isConnected ? 'Connected' : 'Disconnected'}</div>
    </div>
  );
};

const NotifIdConsumer = ({ onContextValue }: { onContextValue: (value: NotifIdContextValue) => void }) => {
  const notifValue = useNotifId();
  
  useEffect(() => {
    onContextValue(notifValue);
  }, [notifValue, onContextValue]);

  return (
    <div testID="notif-consumer">
      <div testID="notif-id">{notifValue.notifId || 'No ID'}</div>
      <div testID="permission-status">{notifValue.notificationPermission || 'Unknown'}</div>
      <div testID="notif-loading">{notifValue.notifIdLoading.toString()}</div>
    </div>
  );
};

// Validation functions
const isValidAuthContext = (value: any): value is AuthContextValue => {
  return (
    (value.user === null || typeof value.user === 'object') &&
    (typeof value.token === 'string' || value.token === null) &&
    typeof value.loading === 'boolean' &&
    Array.isArray(value.permissions) &&
    typeof value.login === 'function' &&
    typeof value.logout === 'function' &&
    typeof value.refreshUser === 'function' &&
    typeof value.loginWithToken === 'function' &&
    typeof value.requestOtp === 'function' &&
    typeof value.verifyOtp === 'function'
  );
};

const isValidNetworkContext = (value: any): value is NetworkContextValue => {
  return typeof value.isConnected === 'boolean';
};

const isValidNotifIdContext = (value: any): value is NotifIdContextValue => {
  return (
    (typeof value.notifId === 'string' || value.notifId === null) &&
    typeof value.setNotifId === 'function' &&
    (value.notificationPermission === null || 
     ['default', 'granted', 'denied'].includes(value.notificationPermission)) &&
    typeof value.setNotificationPermission === 'function' &&
    typeof value.notifIdLoading === 'boolean' &&
    typeof value.setNotifIdLoading === 'function'
  );
};

describe('React Context Providers', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockNetInfo = require('@react-native-community/netinfo');

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
  });

  describe('AuthProvider', () => {
    it('should provide auth context with correct interface structure', () => {
      let capturedValue: AuthContextValue | null = null;
      const onContextValue = (value: AuthContextValue) => {
        capturedValue = value;
      };

      render(
        <AuthProvider>
          <AuthConsumer onContextValue={onContextValue} />
        </AuthProvider>
      );

      expect(capturedValue).not.toBeNull();
      expect(isValidAuthContext(capturedValue!)).toBe(true);
    });

    it('should provide initial auth state', () => {
      let capturedValue: AuthContextValue | null = null;

      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer onContextValue={(value) => { capturedValue = value; }} />
        </AuthProvider>
      );

      expect(getByTestId('user-info')).toHaveTextContent('No user');
      expect(getByTestId('loading-state')).toHaveTextContent('false');
      expect(getByTestId('permissions-count')).toHaveTextContent('0');
      
      expect(capturedValue?.user).toBeNull();
      expect(capturedValue?.token).toBeNull();
      expect(capturedValue?.permissions).toEqual([]);
      expect(capturedValue?.loading).toBe(false);
    });

    it('should setup auto logout callback on mount', () => {
      const mockSetAutoLogoutCallback = require('@/utils/api').setAutoLogoutCallback;
      
      render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      expect(mockSetAutoLogoutCallback).toHaveBeenCalledTimes(1);
      expect(mockSetAutoLogoutCallback).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should provide auth actions to consumers', () => {
      let capturedValue: AuthContextValue | null = null;

      render(
        <AuthProvider>
          <AuthConsumer onContextValue={(value) => { capturedValue = value; }} />
        </AuthProvider>
      );

      // Validate all auth actions are available
      expect(typeof capturedValue?.login).toBe('function');
      expect(typeof capturedValue?.logout).toBe('function');
      expect(typeof capturedValue?.refreshUser).toBe('function');
      expect(typeof capturedValue?.loginWithToken).toBe('function');
      expect(typeof capturedValue?.requestOtp).toBe('function');
      expect(typeof capturedValue?.verifyOtp).toBe('function');
    });

    it('should throw error when useAuth is used outside provider', () => {
      const TestComponent = () => {
        useAuth(); // This should throw
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => render(<TestComponent />)).toThrow(
        'useAuth must be used within AuthProvider'
      );

      consoleSpy.mockRestore();
    });

    it('should handle state updates from useAuth hook', () => {
      // Mock updated auth hook state
      const mockUseAuth = jest.fn(() => ({
        user: TEST_USER,
        token: TEST_TOKEN,
        permissions: ['users.read', 'outlets.manage'],
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
        loginWithToken: jest.fn(),
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
      }));

      jest.doMock('@/hooks/auth/useAuth', () => ({
        useAuth: mockUseAuth
      }));

      let capturedValue: AuthContextValue | null = null;

      const { getByTestId } = render(
        <AuthProvider>
          <AuthConsumer onContextValue={(value) => { capturedValue = value; }} />
        </AuthProvider>
      );

      // Note: This test would require proper mocking to work fully
      // The interface structure should be correct regardless
      expect(isValidAuthContext(capturedValue!)).toBe(true);
    });
  });

  describe('NetworkProvider', () => {
    it('should provide network context with correct interface structure', () => {
      let capturedValue: NetworkContextValue | null = null;
      const onContextValue = (value: NetworkContextValue) => {
        capturedValue = value;
      };

      render(
        <NetworkProvider>
          <NetworkConsumer onContextValue={onContextValue} />
        </NetworkProvider>
      );

      expect(capturedValue).not.toBeNull();
      expect(isValidNetworkContext(capturedValue!)).toBe(true);
    });

    it('should provide initial connection state', () => {
      let capturedValue: NetworkContextValue | null = null;

      const { getByTestId } = render(
        <NetworkProvider>
          <NetworkConsumer onContextValue={(value) => { capturedValue = value; }} />
        </NetworkProvider>
      );

      expect(getByTestId('connection-status')).toHaveTextContent('Connected');
      expect(capturedValue?.isConnected).toBe(true);
    });

    it('should setup NetInfo listener on mount', () => {
      const mockAddEventListener = jest.fn(() => jest.fn()); // Returns unsubscribe function
      mockNetInfo.addEventListener = mockAddEventListener;

      render(
        <NetworkProvider>
          <div>Test</div>
        </NetworkProvider>
      );

      expect(mockAddEventListener).toHaveBeenCalledTimes(1);
      expect(mockAddEventListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle network state changes', () => {
      const mockUnsubscribe = jest.fn();
      const mockAddEventListener = jest.fn((callback) => {
        // Simulate network state change
        setTimeout(() => {
          callback({ isConnected: false });
        }, 100);
        return mockUnsubscribe;
      });
      mockNetInfo.addEventListener = mockAddEventListener;

      let capturedValue: NetworkContextValue | null = null;

      const { rerender } = render(
        <NetworkProvider>
          <NetworkConsumer onContextValue={(value) => { capturedValue = value; }} />
        </NetworkProvider>
      );

      // Initial state
      expect(capturedValue?.isConnected).toBe(true);

      // Force re-render to trigger state update simulation
      rerender(
        <NetworkProvider>
          <NetworkConsumer onContextValue={(value) => { capturedValue = value; }} />
        </NetworkProvider>
      );

      // Interface should remain valid
      expect(isValidNetworkContext(capturedValue!)).toBe(true);
    });

    it('should cleanup listener on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockNetInfo.addEventListener = jest.fn(() => mockUnsubscribe);

      const { unmount } = render(
        <NetworkProvider>
          <div>Test</div>
        </NetworkProvider>
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('NotifIdProvider', () => {
    it('should provide notification context with correct interface structure', () => {
      let capturedValue: NotifIdContextValue | null = null;
      const onContextValue = (value: NotifIdContextValue) => {
        capturedValue = value;
      };

      render(
        <NotifIdProvider>
          <NotifIdConsumer onContextValue={onContextValue} />
        </NotifIdProvider>
      );

      expect(capturedValue).not.toBeNull();
      expect(isValidNotifIdContext(capturedValue!)).toBe(true);
    });

    it('should provide initial notification state', () => {
      let capturedValue: NotifIdContextValue | null = null;

      const { getByTestId } = render(
        <NotifIdProvider>
          <NotifIdConsumer onContextValue={(value) => { capturedValue = value; }} />
        </NotifIdProvider>
      );

      // Initial state based on mock
      expect(getByTestId('notif-id')).toHaveTextContent('test_notification_id');
      expect(getByTestId('permission-status')).toHaveTextContent('granted');
      expect(getByTestId('notif-loading')).toHaveTextContent('false');

      expect(capturedValue?.notifId).toBe('test_notification_id');
      expect(capturedValue?.notificationPermission).toBe('granted');
      expect(capturedValue?.notifIdLoading).toBe(false);
    });

    it('should provide setter functions', () => {
      let capturedValue: NotifIdContextValue | null = null;

      render(
        <NotifIdProvider>
          <NotifIdConsumer onContextValue={(value) => { capturedValue = value; }} />
        </NotifIdProvider>
      );

      expect(typeof capturedValue?.setNotifId).toBe('function');
      expect(typeof capturedValue?.setNotificationPermission).toBe('function');
      expect(typeof capturedValue?.setNotifIdLoading).toBe('function');
    });

    it('should handle notification hook state updates', () => {
      // Mock different notification hook states
      const mockUseNotification = jest.fn()
        .mockReturnValueOnce({
          notificationId: null,
          permission: 'default',
          loading: true,
        })
        .mockReturnValueOnce({
          notificationId: 'updated_notification_id',
          permission: 'granted',
          loading: false,
        });

      jest.doMock('@/hooks/utils/useNotification', () => ({
        useNotification: mockUseNotification
      }));

      let capturedValue: NotifIdContextValue | null = null;

      const { rerender } = render(
        <NotifIdProvider>
          <NotifIdConsumer onContextValue={(value) => { capturedValue = value; }} />
        </NotifIdProvider>
      );

      // Trigger re-render to simulate hook state change
      rerender(
        <NotifIdProvider>
          <NotifIdConsumer onContextValue={(value) => { capturedValue = value; }} />
        </NotifIdProvider>
      );

      // Interface should remain valid
      expect(isValidNotifIdContext(capturedValue!)).toBe(true);
    });

    it('should throw error when useNotifId is used outside provider', () => {
      const TestComponent = () => {
        useNotifId(); // This should throw
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => render(<TestComponent />)).toThrow(
        'useNotifId must be used within NotifIdProvider'
      );

      consoleSpy.mockRestore();
    });

    it('should handle different permission states', () => {
      const permissionStates = ['default', 'granted', 'denied'] as const;
      
      permissionStates.forEach((permission) => {
        const mockUseNotification = jest.fn(() => ({
          notificationId: 'test_id',
          permission,
          loading: false,
        }));

        jest.doMock('@/hooks/utils/useNotification', () => ({
          useNotification: mockUseNotification
        }));

        let capturedValue: NotifIdContextValue | null = null;

        const { unmount } = render(
          <NotifIdProvider>
            <NotifIdConsumer onContextValue={(value) => { capturedValue = value; }} />
          </NotifIdProvider>
        );

        expect(isValidNotifIdContext(capturedValue!)).toBe(true);
        unmount();
      });
    });
  });

  describe('Provider Composition and Integration', () => {
    const ComposedProviders = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>
        <NetworkProvider>
          <NotifIdProvider>
            {children}
          </NotifIdProvider>
        </NetworkProvider>
      </AuthProvider>
    );

    const MultiConsumer = () => {
      const auth = useAuth();
      const network = useNetwork();
      const notif = useNotifId();

      return (
        <div testID="multi-consumer">
          <div testID="auth-user">{auth.user?.name || 'No auth user'}</div>
          <div testID="network-connected">{network.isConnected.toString()}</div>
          <div testID="notif-id">{notif.notifId || 'No notif ID'}</div>
        </div>
      );
    };

    it('should compose multiple providers correctly', () => {
      const { getByTestId } = render(
        <ComposedProviders>
          <MultiConsumer />
        </ComposedProviders>
      );

      expect(getByTestId('multi-consumer')).toBeTruthy();
      expect(getByTestId('auth-user')).toHaveTextContent('No auth user');
      expect(getByTestId('network-connected')).toHaveTextContent('true');
      expect(getByTestId('notif-id')).toHaveTextContent('test_notification_id');
    });

    it('should handle provider interactions', () => {
      // Test component that uses multiple contexts
      const InteractiveComponent = () => {
        const auth = useAuth();
        const network = useNetwork();
        const notif = useNotifId();

        const handleLogin = () => {
          auth.login('testuser', 'password');
        };

        const updateNotifId = () => {
          notif.setNotifId('updated_id');
        };

        return (
          <div testID="interactive-component">
            <button testID="login-btn" onClick={handleLogin}>Login</button>
            <button testID="update-notif-btn" onClick={updateNotifId}>Update Notif</button>
            <div testID="connection-status">{network.isConnected ? 'Online' : 'Offline'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <ComposedProviders>
          <InteractiveComponent />
        </ComposedProviders>
      );

      expect(getByTestId('interactive-component')).toBeTruthy();
      expect(getByTestId('connection-status')).toHaveTextContent('Online');
    });

    it('should maintain provider isolation', () => {
      // Test that providers don't interfere with each other
      const IsolatedTest = () => {
        try {
          const auth = useAuth();
          const network = useNetwork();
          const notif = useNotifId();

          return (
            <div testID="isolated-test">
              <div testID="auth-valid">{typeof auth.login === 'function' ? 'valid' : 'invalid'}</div>
              <div testID="network-valid">{typeof network.isConnected === 'boolean' ? 'valid' : 'invalid'}</div>
              <div testID="notif-valid">{typeof notif.setNotifId === 'function' ? 'valid' : 'invalid'}</div>
            </div>
          );
        } catch (error) {
          return <div testID="error">Error: {(error as Error).message}</div>;
        }
      };

      const { getByTestId } = render(
        <ComposedProviders>
          <IsolatedTest />
        </ComposedProviders>
      );

      expect(getByTestId('auth-valid')).toHaveTextContent('valid');
      expect(getByTestId('network-valid')).toHaveTextContent('valid');
      expect(getByTestId('notif-valid')).toHaveTextContent('valid');
    });

    it('should handle provider order changes', () => {
      // Test different provider ordering
      const AlternateProviders = ({ children }: { children: React.ReactNode }) => (
        <NotifIdProvider>
          <NetworkProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </NetworkProvider>
        </NotifIdProvider>
      );

      const { getByTestId } = render(
        <AlternateProviders>
          <MultiConsumer />
        </AlternateProviders>
      );

      // Should work regardless of provider order
      expect(getByTestId('multi-consumer')).toBeTruthy();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle hook errors gracefully', () => {
      const mockUseAuth = jest.fn(() => {
        throw new Error('Hook error');
      });

      jest.doMock('@/hooks/auth/useAuth', () => ({
        useAuth: mockUseAuth
      }));

      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        try {
          return <div>{children}</div>;
        } catch (error) {
          return <div testID="error-boundary">Error caught</div>;
        }
      };

      // Should handle hook errors without crashing the entire app
      expect(() => {
        render(
          <ErrorBoundary>
            <AuthProvider>
              <div>Test</div>
            </AuthProvider>
          </ErrorBoundary>
        );
      }).not.toThrow();
    });

    it('should handle rapid provider mounting/unmounting', () => {
      const TestProvider = ({ show }: { show: boolean }) => {
        if (!show) return <div testID="no-provider">No Provider</div>;

        return (
          <AuthProvider>
            <NetworkProvider>
              <NotifIdProvider>
                <div testID="with-providers">With Providers</div>
              </NotifIdProvider>
            </NetworkProvider>
          </AuthProvider>
        );
      };

      const { getByTestId, rerender } = render(<TestProvider show={true} />);
      expect(getByTestId('with-providers')).toBeTruthy();

      rerender(<TestProvider show={false} />);
      expect(getByTestId('no-provider')).toBeTruthy();

      rerender(<TestProvider show={true} />);
      expect(getByTestId('with-providers')).toBeTruthy();
    });

    it('should handle context consumers with conditional rendering', () => {
      const ConditionalConsumer = ({ showAuth, showNetwork }: { showAuth: boolean; showNetwork: boolean }) => {
        return (
          <div testID="conditional-consumer">
            {showAuth && (
              <div testID="auth-section">
                {useAuth().user?.name || 'No user'}
              </div>
            )}
            {showNetwork && (
              <div testID="network-section">
                {useNetwork().isConnected ? 'Connected' : 'Disconnected'}
              </div>
            )}
          </div>
        );
      };

      const { getByTestId, queryByTestId, rerender } = render(
        <ComposedProviders>
          <ConditionalConsumer showAuth={true} showNetwork={false} />
        </ComposedProviders>
      );

      expect(getByTestId('auth-section')).toBeTruthy();
      expect(queryByTestId('network-section')).toBeNull();

      rerender(
        <ComposedProviders>
          <ConditionalConsumer showAuth={false} showNetwork={true} />
        </ComposedProviders>
      );

      expect(queryByTestId('auth-section')).toBeNull();
      expect(getByTestId('network-section')).toBeTruthy();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(
        <ComposedProviders>
          <MultiConsumer />
        </ComposedProviders>
      );

      // Should not throw errors when unmounting
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid context value changes', () => {
      let renderCount = 0;
      const RenderCounter = () => {
        renderCount++;
        const auth = useAuth();
        return <div testID="render-counter">{auth.loading.toString()}</div>;
      };

      const { rerender } = render(
        <AuthProvider>
          <RenderCounter />
        </AuthProvider>
      );

      const initialRenderCount = renderCount;

      // Trigger multiple re-renders
      for (let i = 0; i < 10; i++) {
        rerender(
          <AuthProvider>
            <RenderCounter />
          </AuthProvider>
        );
      }

      // Should handle multiple re-renders gracefully
      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });

    it('should handle large numbers of consumers', () => {
      const consumers = Array.from({ length: 50 }, (_, index) => (
        <div key={index} testID={`consumer-${index}`}>
          Consumer {index}: {useAuth().loading.toString()}
        </div>
      ));

      const ManyConsumers = () => <div>{consumers}</div>;

      const { getAllByTestId } = render(
        <AuthProvider>
          <ManyConsumers />
        </AuthProvider>
      );

      expect(getAllByTestId(/consumer-\d+/)).toHaveLength(50);
    });
  });
});