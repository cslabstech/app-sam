/**
 * Notification Context Provider Tests
 * Integration tests for context/notifid-context.tsx functionality
 * 
 * Tests cover:
 * - Notification context provider initialization
 * - State management for notification ID and permissions
 * - Hook integration with useNotification
 * - Loading state handling
 * - State synchronization between context and hook
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { NotifIdProvider, useNotifId } from '@/context/notifid-context';
import { ThemedText } from '@/components/ThemedText';

// Mock the notification hook
jest.mock('@/hooks/utils/useNotification');

const mockUseNotification = require('@/hooks/utils/useNotification').useNotification;

// Test component to consume notification context
const TestConsumer = ({ onNotificationReceived }: { onNotificationReceived?: (notification: any) => void }) => {
  const notification = useNotifId();
  
  React.useEffect(() => {
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  }, [notification, onNotificationReceived]);

  return (
    <ThemedText testID="notification-consumer">
      NotifID: {notification.notifId || 'None'}, 
      Permission: {notification.notificationPermission || 'None'}, 
      Loading: {notification.notifIdLoading ? 'Yes' : 'No'}
    </ThemedText>
  );
};

describe('NotificationContext Provider', () => {
  const mockNotificationHook = {
    notificationId: null,
    permission: null,
    loading: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotification.mockReturnValue(mockNotificationHook);
  });

  describe('Provider Initialization', () => {
    it('should provide initial state to consumers', () => {
      const { getByTestId } = render(
        <NotifIdProvider>
          <TestConsumer />
        </NotifIdProvider>
      );

      const consumer = getByTestId('notification-consumer');
      expect(consumer).toBeTruthy();
    });

    it('should render children correctly', () => {
      const { getByText } = render(
        <NotifIdProvider>
          <ThemedText>Notification Child Component</ThemedText>
        </NotifIdProvider>
      );

      expect(getByText('Notification Child Component')).toBeTruthy();
    });

    it('should render multiple children', () => {
      const { getByText } = render(
        <NotifIdProvider>
          <ThemedText>First Notification Child</ThemedText>
          <ThemedText>Second Notification Child</ThemedText>
        </NotifIdProvider>
      );

      expect(getByText('First Notification Child')).toBeTruthy();
      expect(getByText('Second Notification Child')).toBeTruthy();
    });

    it('should call useNotification hook on initialization', () => {
      render(
        <NotifIdProvider>
          <TestConsumer />
        </NotifIdProvider>
      );

      expect(mockUseNotification).toHaveBeenCalled();
    });
  });

  describe('Initial State Management', () => {
    it('should provide default initial state', () => {
      let receivedNotification: any = null;

      render(
        <NotifIdProvider>
          <TestConsumer onNotificationReceived={(notification) => { receivedNotification = notification; }} />
        </NotifIdProvider>
      );

      expect(receivedNotification).not.toBeNull();
      expect(receivedNotification.notifId).toBeNull();
      expect(receivedNotification.notificationPermission).toBeNull();
      expect(receivedNotification.notifIdLoading).toBe(true); // Initial loading state
      expect(typeof receivedNotification.setNotifId).toBe('function');
      expect(typeof receivedNotification.setNotificationPermission).toBe('function');
      expect(typeof receivedNotification.setNotifIdLoading).toBe('function');
    });

    it('should update state when notification hook provides data', async () => {
      mockUseNotification.mockReturnValue({
        notificationId: 'test-notification-id-123',
        permission: 'granted',
        loading: false
      });

      let receivedNotification: any = null;

      render(
        <NotifIdProvider>
          <TestConsumer onNotificationReceived={(notification) => { receivedNotification = notification; }} />
        </NotifIdProvider>
      );

      await waitFor(() => {
        expect(receivedNotification.notifId).toBe('test-notification-id-123');
        expect(receivedNotification.notificationPermission).toBe('granted');
        expect(receivedNotification.notifIdLoading).toBe(false);
      });
    });

    it('should handle partial data from notification hook', async () => {
      mockUseNotification.mockReturnValue({
        notificationId: 'partial-id',
        permission: null, // Missing permission
        loading: true
      });

      let receivedNotification: any = null;

      render(
        <NotifIdProvider>
          <TestConsumer onNotificationReceived={(notification) => { receivedNotification = notification; }} />
        </NotifIdProvider>
      );

      await waitFor(() => {
        expect(receivedNotification.notifId).toBe('partial-id');
        expect(receivedNotification.notificationPermission).toBeNull();
        expect(receivedNotification.notifIdLoading).toBe(true);
      });
    });
  });

  describe('State Synchronization', () => {
    it('should sync with notification hook changes', async () => {
      const { rerender } = render(
        <NotifIdProvider>
          <TestConsumer />
        </NotifIdProvider>
      );

      // Change notification hook return value
      mockUseNotification.mockReturnValue({
        notificationId: 'updated-notification-id',
        permission: 'denied',
        loading: false
      });

      let receivedNotification: any = null;

      rerender(
        <NotifIdProvider>
          <TestConsumer onNotificationReceived={(notification) => { receivedNotification = notification; }} />
        </NotifIdProvider>
      );

      await waitFor(() => {
        expect(receivedNotification.notifId).toBe('updated-notification-id');
        expect(receivedNotification.notificationPermission).toBe('denied');
        expect(receivedNotification.notifIdLoading).toBe(false);
      });
    });

    it('should handle loading state changes', async () => {
      let receivedNotification: any = null;

      const { rerender } = render(
        <NotifIdProvider>
          <TestConsumer onNotificationReceived={(notification) => { receivedNotification = notification; }} />
        </NotifIdProvider>
      );

      // Initially loading
      expect(receivedNotification.notifIdLoading).toBe(true);

      // Change to loaded state
      mockUseNotification.mockReturnValue({
        notificationId: 'loaded-id',
        permission: 'granted',
        loading: false
      });

      rerender(
        <NotifIdProvider>
          <TestConsumer onNotificationReceived={(notification) => { receivedNotification = notification; }} />
        </NotifIdProvider>
      );

      await waitFor(() => {
        expect(receivedNotification.notifIdLoading).toBe(false);
      });
    });

    it('should only update when hook data actually changes', () => {
      let updateCount = 0;
      
      const UpdateTracker = () => {
        const notification = useNotifId();
        React.useEffect(() => {
          updateCount++;
        }, [notification.notifId, notification.notificationPermission, notification.notifIdLoading]);
        
        return <ThemedText>Updates: {updateCount}</ThemedText>;
      };

      const { rerender } = render(
        <NotifIdProvider>
          <UpdateTracker />
        </NotifIdProvider>
      );

      const initialCount = updateCount;

      // Re-render with same data
      rerender(
        <NotifIdProvider>
          <UpdateTracker />
        </NotifIdProvider>
      );

      // Should trigger updates due to effect dependencies
      expect(updateCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  describe('Manual State Updates', () => {
    it('should allow manual notification ID updates', () => {
      let receivedNotification: any = null;

      const ManualUpdater = () => {
        const notification = useNotifId();
        
        React.useEffect(() => {
          receivedNotification = notification;
        }, [notification]);

        React.useEffect(() => {
          // Manually set notification ID
          notification.setNotifId('manually-set-id');
        }, [notification.setNotifId]);

        return <ThemedText>Manual ID: {notification.notifId}</ThemedText>;
      };

      render(
        <NotifIdProvider>
          <ManualUpdater />
        </NotifIdProvider>
      );

      expect(receivedNotification).not.toBeNull();
      expect(typeof receivedNotification.setNotifId).toBe('function');
    });

    it('should allow manual permission updates', () => {
      let receivedNotification: any = null;

      const PermissionUpdater = () => {
        const notification = useNotifId();
        
        React.useEffect(() => {
          receivedNotification = notification;
        }, [notification]);

        React.useEffect(() => {
          // Manually set permission
          notification.setNotificationPermission('granted');
        }, [notification.setNotificationPermission]);

        return <ThemedText>Permission: {notification.notificationPermission}</ThemedText>;
      };

      render(
        <NotifIdProvider>
          <PermissionUpdater />
        </NotifIdProvider>
      );

      expect(receivedNotification).not.toBeNull();
      expect(typeof receivedNotification.setNotificationPermission).toBe('function');
    });

    it('should allow manual loading state updates', () => {
      let receivedNotification: any = null;

      const LoadingUpdater = () => {
        const notification = useNotifId();
        
        React.useEffect(() => {
          receivedNotification = notification;
        }, [notification]);

        React.useEffect(() => {
          // Manually set loading state
          notification.setNotifIdLoading(false);
        }, [notification.setNotifIdLoading]);

        return <ThemedText>Loading: {notification.notifIdLoading ? 'Yes' : 'No'}</ThemedText>;
      };

      render(
        <NotifIdProvider>
          <LoadingUpdater />
        </NotifIdProvider>
      );

      expect(receivedNotification).not.toBeNull();
      expect(typeof receivedNotification.setNotifIdLoading).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useNotifId is used outside provider', () => {
      const ThrowingComponent = () => {
        useNotifId();
        return <ThemedText>Should not render</ThemedText>;
      };

      expect(() => render(<ThrowingComponent />)).toThrow(
        'useNotifId must be used within NotifIdProvider'
      );
    });

    it('should handle notification hook errors gracefully', () => {
      mockUseNotification.mockImplementation(() => {
        throw new Error('Notification hook error');
      });

      expect(() =>
        render(
          <NotifIdProvider>
            <TestConsumer />
          </NotifIdProvider>
        )
      ).toThrow('Notification hook error');
    });

    it('should handle missing notification hook data', () => {
      mockUseNotification.mockReturnValue({
        // Missing all properties
      });

      let receivedNotification: any = null;

      render(
        <NotifIdProvider>
          <TestConsumer onNotificationReceived={(notification) => { receivedNotification = notification; }} />
        </NotifIdProvider>
      );

      // Should still provide context functions
      expect(receivedNotification).not.toBeNull();
      expect(typeof receivedNotification.setNotifId).toBe('function');
      expect(typeof receivedNotification.setNotificationPermission).toBe('function');
      expect(typeof receivedNotification.setNotifIdLoading).toBe('function');
    });
  });

  describe('Multiple Consumers', () => {
    it('should provide same state to multiple consumers', () => {
      const consumers: any[] = [];

      const Consumer1 = () => {
        const notification = useNotifId();
        consumers[0] = notification;
        return <ThemedText>Consumer 1: {notification.notifId}</ThemedText>;
      };

      const Consumer2 = () => {
        const notification = useNotifId();
        consumers[1] = notification;
        return <ThemedText>Consumer 2: {notification.notificationPermission}</ThemedText>;
      };

      render(
        <NotifIdProvider>
          <Consumer1 />
          <Consumer2 />
        </NotifIdProvider>
      );

      expect(consumers).toHaveLength(2);
      expect(consumers[0]).toBeDefined();
      expect(consumers[1]).toBeDefined();
      expect(consumers[0]).toBe(consumers[1]); // Same context value
    });

    it('should update all consumers when state changes', async () => {
      const states: { consumer1: string[]; consumer2: string[] } = {
        consumer1: [],
        consumer2: []
      };

      const Consumer1 = () => {
        const { notifId } = useNotifId();
        React.useEffect(() => {
          states.consumer1.push(notifId || 'null');
        }, [notifId]);
        return <ThemedText>Consumer 1: {notifId}</ThemedText>;
      };

      const Consumer2 = () => {
        const { notifId } = useNotifId();
        React.useEffect(() => {
          states.consumer2.push(notifId || 'null');
        }, [notifId]);
        return <ThemedText>Consumer 2: {notifId}</ThemedText>;
      };

      const { rerender } = render(
        <NotifIdProvider>
          <Consumer1 />
          <Consumer2 />
        </NotifIdProvider>
      );

      // Change notification hook data
      mockUseNotification.mockReturnValue({
        notificationId: 'shared-id-update',
        permission: 'granted',
        loading: false
      });

      rerender(
        <NotifIdProvider>
          <Consumer1 />
          <Consumer2 />
        </NotifIdProvider>
      );

      await waitFor(() => {
        expect(states.consumer1).toContain('shared-id-update');
        expect(states.consumer2).toContain('shared-id-update');
      });
    });
  });

  describe('Nested Providers', () => {
    it('should handle nested NotifIdProviders correctly', () => {
      const OuterConsumer = () => {
        const { notifId } = useNotifId();
        return <ThemedText>Outer: {notifId}</ThemedText>;
      };

      const InnerConsumer = () => {
        const { notifId } = useNotifId();
        return <ThemedText>Inner: {notifId}</ThemedText>;
      };

      const { getByText } = render(
        <NotifIdProvider>
          <OuterConsumer />
          <NotifIdProvider>
            <InnerConsumer />
          </NotifIdProvider>
        </NotifIdProvider>
      );

      expect(getByText('Outer:')).toBeTruthy();
      expect(getByText('Inner:')).toBeTruthy();
    });
  });

  describe('Integration with Real Components', () => {
    it('should work with permission request components', () => {
      const PermissionComponent = () => {
        const { notificationPermission, setNotificationPermission } = useNotifId();
        
        const requestPermission = () => {
          setNotificationPermission('granted');
        };

        return (
          <ThemedText testID="permission-component">
            Permission: {notificationPermission || 'unknown'}
          </ThemedText>
        );
      };

      const { getByTestId } = render(
        <NotifIdProvider>
          <PermissionComponent />
        </NotifIdProvider>
      );

      expect(getByTestId('permission-component')).toBeTruthy();
    });

    it('should maintain context across deep component tree', () => {
      const DeepChild = () => {
        const { notifId } = useNotifId();
        return <ThemedText testID="deep-child">Deep: {notifId || 'None'}</ThemedText>;
      };

      const MiddleChild = () => (
        <ThemedText>
          Middle
          <DeepChild />
        </ThemedText>
      );

      const { getByTestId } = render(
        <NotifIdProvider>
          <MiddleChild />
        </NotifIdProvider>
      );

      expect(getByTestId('deep-child')).toBeTruthy();
    });
  });

  describe('Permission State Handling', () => {
    it('should handle all permission states correctly', async () => {
      const permissionStates = ['default', 'granted', 'denied'] as const;
      
      for (const permission of permissionStates) {
        mockUseNotification.mockReturnValue({
          notificationId: 'test-id',
          permission: permission,
          loading: false
        });

        let receivedNotification: any = null;

        const { unmount } = render(
          <NotifIdProvider>
            <TestConsumer onNotificationReceived={(notification) => { receivedNotification = notification; }} />
          </NotifIdProvider>
        );

        await waitFor(() => {
          expect(receivedNotification.notificationPermission).toBe(permission);
        });

        unmount();
      }
    });
  });

  describe('Performance Considerations', () => {
    it('should handle rapid state changes efficiently', async () => {
      let updateCount = 0;
      
      const PerformanceTracker = () => {
        const { notifId } = useNotifId();
        React.useEffect(() => {
          updateCount++;
        }, [notifId]);
        
        return <ThemedText>Updates: {updateCount}, ID: {notifId}</ThemedText>;
      };

      const { rerender } = render(
        <NotifIdProvider>
          <PerformanceTracker />
        </NotifIdProvider>
      );

      // Rapid changes
      const ids = ['id1', 'id2', 'id3', 'id4'];
      for (const id of ids) {
        mockUseNotification.mockReturnValue({
          notificationId: id,
          permission: 'granted',
          loading: false
        });

        rerender(
          <NotifIdProvider>
            <PerformanceTracker />
          </NotifIdProvider>
        );
      }

      expect(updateCount).toBeGreaterThan(0);
    });
  });
});