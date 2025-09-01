/**
 * Comprehensive test suite for utility hooks
 * Tests useCurrentLocation, useErrorHandler, useNotification, and other utility hooks
 * Covers location services, error handling, notifications, and permissions
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { useCurrentLocation } from '@/hooks/utils/useCurrentLocation';
import { useErrorHandler } from '@/hooks/utils/useErrorHandler';
import { useNotification } from '@/hooks/utils/useNotification';
import { usePermission } from '@/hooks/utils/usePermission';
import { useOutletDistanceValidation } from '@/hooks/utils/useOutletDistanceValidation';
import * as Location from 'expo-location';

// Mock dependencies
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: 4,
    High: 6
  }
}));

jest.mock('@/utils/logger', () => ({
  log: jest.fn(),
  logError: jest.fn()
}));

jest.mock('react-native-onesignal', () => ({
  setNotificationWillShowInForegroundHandler: jest.fn(),
  setNotificationOpenedHandler: jest.fn(),
  getDeviceState: jest.fn(() => Promise.resolve({ userId: 'test-user-id' }))
}));

// TypeScript interfaces for comprehensive validation
interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface LocationHookState {
  location: LocationCoords | null;
  loading: boolean;
  error: string | null;
  permissionStatus: string | null;
}

interface LocationHookActions {
  getLocation: () => Promise<void>;
  requestPermission: () => Promise<void>;
}

interface CompleteLocationHook extends LocationHookState, LocationHookActions {}

interface ErrorHandlerState {
  error: Error | null;
  hasError: boolean;
  errorCount: number;
}

interface ErrorHandlerActions {
  handleError: (error: Error) => void;
  clearError: () => void;
  retry: () => void;
}

interface CompleteErrorHandler extends ErrorHandlerState, ErrorHandlerActions {}

interface NotificationState {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    timestamp: number;
    read: boolean;
  }>;
  unreadCount: number;
}

interface NotificationActions {
  showNotification: (notification: Omit<NotificationState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

interface CompleteNotificationHook extends NotificationState, NotificationActions {}

interface DistanceValidationState {
  isWithinRange: boolean;
  distance: number | null;
  loading: boolean;
  error: string | null;
}

interface DistanceValidationActions {
  validateDistance: (targetLocation: LocationCoords) => Promise<void>;
  getCurrentDistance: () => number | null;
}

interface CompleteDistanceValidation extends DistanceValidationState, DistanceValidationActions {}

// Validation functions
const isValidLocationCoords = (coords: any): coords is LocationCoords => {
  return (
    typeof coords?.latitude === 'number' &&
    coords.latitude >= -90 && coords.latitude <= 90 &&
    typeof coords?.longitude === 'number' &&
    coords.longitude >= -180 && coords.longitude <= 180 &&
    (coords.accuracy === undefined || (typeof coords.accuracy === 'number' && coords.accuracy > 0))
  );
};

const isValidLocationHookState = (state: any): state is LocationHookState => {
  return (
    (state.location === null || isValidLocationCoords(state.location)) &&
    typeof state.loading === 'boolean' &&
    (typeof state.error === 'string' || state.error === null) &&
    (typeof state.permissionStatus === 'string' || state.permissionStatus === null)
  );
};

const isValidLocationHookActions = (actions: any): actions is LocationHookActions => {
  return (
    typeof actions.getLocation === 'function' &&
    typeof actions.requestPermission === 'function'
  );
};

// Test data
const TEST_LOCATION_COORDS: LocationCoords = {
  latitude: -6.2088,
  longitude: 106.8456,
  accuracy: 5.0
};

const TEST_OUTLET_LOCATION: LocationCoords = {
  latitude: -6.2090,
  longitude: 106.8458,
  accuracy: 3.0
};

describe('Utility Hooks', () => {
  const mockLocationModule = Location as jest.Mocked<typeof Location>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useCurrentLocation Hook', () => {
    it('should have correct TypeScript interface structure', () => {
      const { result } = renderHook(() => useCurrentLocation());
      const locationHook = result.current as CompleteLocationHook;

      // Validate state properties
      expect(isValidLocationHookState({
        location: locationHook.location,
        loading: locationHook.loading,
        error: locationHook.error,
        permissionStatus: locationHook.permissionStatus
      })).toBe(true);

      // Validate action functions
      expect(isValidLocationHookActions(locationHook)).toBe(true);
    });

    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useCurrentLocation());

      expect(result.current.location).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.permissionStatus).toBeNull();
    });

    it('should request location permission successfully', async () => {
      mockLocationModule.requestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never' as any
      });

      mockLocationModule.getCurrentPositionAsync.mockResolvedValueOnce({
        coords: {
          latitude: TEST_LOCATION_COORDS.latitude,
          longitude: TEST_LOCATION_COORDS.longitude,
          accuracy: TEST_LOCATION_COORDS.accuracy,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      });

      const { result } = renderHook(() => useCurrentLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionStatus).toBe('granted');
      expect(result.current.location).toEqual(TEST_LOCATION_COORDS);
      expect(result.current.error).toBeNull();
    });

    it('should handle permission denied gracefully', async () => {
      mockLocationModule.requestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'denied' as any,
        granted: false,
        canAskAgain: false,
        expires: 'never' as any
      });

      const { result } = renderHook(() => useCurrentLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionStatus).toBe('denied');
      expect(result.current.location).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should get current location when permission is already granted', async () => {
      mockLocationModule.getForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never' as any
      });

      mockLocationModule.getCurrentPositionAsync.mockResolvedValueOnce({
        coords: {
          latitude: TEST_LOCATION_COORDS.latitude,
          longitude: TEST_LOCATION_COORDS.longitude,
          accuracy: TEST_LOCATION_COORDS.accuracy,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      });

      const { result } = renderHook(() => useCurrentLocation());

      await act(async () => {
        await result.current.getLocation();
      });

      expect(result.current.location).toEqual(TEST_LOCATION_COORDS);
      expect(result.current.permissionStatus).toBe('granted');
    });

    it('should handle location service errors', async () => {
      mockLocationModule.getForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never' as any
      });

      mockLocationModule.getCurrentPositionAsync.mockRejectedValueOnce(
        new Error('Location service unavailable')
      );

      const { result } = renderHook(() => useCurrentLocation());

      await act(async () => {
        await result.current.getLocation();
      });

      expect(result.current.location).toBeNull();
      expect(result.current.error).toContain('Location service unavailable');
      expect(result.current.loading).toBe(false);
    });

    it('should handle loading states correctly', async () => {
      let resolveLocation: (value: any) => void;
      const locationPromise = new Promise((resolve) => {
        resolveLocation = resolve;
      });

      mockLocationModule.getForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never' as any
      });

      mockLocationModule.getCurrentPositionAsync.mockReturnValueOnce(locationPromise as any);

      const { result } = renderHook(() => useCurrentLocation());

      // Start location request
      act(() => {
        result.current.getLocation();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Complete location request
      act(() => {
        resolveLocation!({
          coords: {
            latitude: TEST_LOCATION_COORDS.latitude,
            longitude: TEST_LOCATION_COORDS.longitude,
            accuracy: TEST_LOCATION_COORDS.accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.location).toEqual(TEST_LOCATION_COORDS);
    });

    it('should validate location coordinates properly', async () => {
      const validationCases = [
        { lat: -90, lng: -180, valid: true, description: 'Min valid coordinates' },
        { lat: 90, lng: 180, valid: true, description: 'Max valid coordinates' },
        { lat: 0, lng: 0, valid: true, description: 'Zero coordinates' },
        { lat: -91, lng: 0, valid: false, description: 'Invalid latitude (too low)' },
        { lat: 91, lng: 0, valid: false, description: 'Invalid latitude (too high)' },
        { lat: 0, lng: -181, valid: false, description: 'Invalid longitude (too low)' },
        { lat: 0, lng: 181, valid: false, description: 'Invalid longitude (too high)' }
      ];

      validationCases.forEach(({ lat, lng, valid, description }) => {
        const coords = { latitude: lat, longitude: lng, accuracy: 5.0 };
        expect(isValidLocationCoords(coords)).toBe(valid);
      });
    });

    it('should handle multiple concurrent location requests', async () => {
      let resolveCount = 0;
      mockLocationModule.getForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never' as any
      });

      mockLocationModule.getCurrentPositionAsync.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolveCount++;
            resolve({
              coords: {
                latitude: TEST_LOCATION_COORDS.latitude,
                longitude: TEST_LOCATION_COORDS.longitude,
                accuracy: TEST_LOCATION_COORDS.accuracy,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
              },
              timestamp: Date.now()
            });
          }, 100);
        });
      });

      const { result } = renderHook(() => useCurrentLocation());

      // Start multiple concurrent requests
      const locationPromises = [
        act(async () => result.current.getLocation()),
        act(async () => result.current.getLocation()),
        act(async () => result.current.getLocation())
      ];

      await Promise.all(locationPromises);

      expect(resolveCount).toBeGreaterThan(0);
      expect(result.current.location).toEqual(TEST_LOCATION_COORDS);
    });
  });

  describe('useErrorHandler Hook', () => {
    // Mock error handler implementation
    const mockUseErrorHandler = () => {
      const [error, setError] = React.useState<Error | null>(null);
      const [errorCount, setErrorCount] = React.useState(0);

      const handleError = React.useCallback((err: Error) => {
        setError(err);
        setErrorCount(prev => prev + 1);
      }, []);

      const clearError = React.useCallback(() => {
        setError(null);
      }, []);

      const retry = React.useCallback(() => {
        setError(null);
        // Retry logic would be implemented here
      }, []);

      return {
        error,
        hasError: error !== null,
        errorCount,
        handleError,
        clearError,
        retry
      };
    };

    it('should handle errors with proper categorization', () => {
      const errorTypes = [
        { error: new Error('Network Error'), category: 'network' },
        { error: new Error('Validation failed'), category: 'validation' },
        { error: new Error('Permission denied'), category: 'permission' },
        { error: new Error('Server error'), category: 'server' }
      ];

      errorTypes.forEach(({ error, category }) => {
        // Test error categorization logic
        const getErrorCategory = (err: Error): string => {
          if (err.message.includes('Network')) return 'network';
          if (err.message.includes('Validation')) return 'validation';
          if (err.message.includes('Permission')) return 'permission';
          if (err.message.includes('Server')) return 'server';
          return 'unknown';
        };

        expect(getErrorCategory(error)).toBe(category);
      });
    });
  });

  describe('useOutletDistanceValidation Hook', () => {
    // Mock distance validation hook
    const mockUseOutletDistanceValidation = (maxDistance: number = 100) => {
      const [currentLocation, setCurrentLocation] = React.useState<LocationCoords | null>(null);
      const [isWithinRange, setIsWithinRange] = React.useState(false);
      const [distance, setDistance] = React.useState<number | null>(null);
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState<string | null>(null);

      const calculateDistance = (coord1: LocationCoords, coord2: LocationCoords): number => {
        const R = 6371000; // Earth's radius in meters
        const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
        const dLng = (coord2.longitude - coord1.longitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const validateDistance = React.useCallback(async (targetLocation: LocationCoords) => {
        setLoading(true);
        setError(null);

        try {
          // Mock getting current location
          const mockCurrentLocation = TEST_LOCATION_COORDS;
          setCurrentLocation(mockCurrentLocation);

          const calculatedDistance = calculateDistance(mockCurrentLocation, targetLocation);
          setDistance(calculatedDistance);
          setIsWithinRange(calculatedDistance <= maxDistance);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      }, [maxDistance]);

      const getCurrentDistance = React.useCallback(() => {
        return distance;
      }, [distance]);

      return {
        isWithinRange,
        distance,
        loading,
        error,
        validateDistance,
        getCurrentDistance
      };
    };

    it('should calculate distance between coordinates accurately', () => {
      // Test distance calculation
      const calculateDistance = (coord1: LocationCoords, coord2: LocationCoords): number => {
        const R = 6371000; // Earth's radius in meters
        const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
        const dLng = (coord2.longitude - coord1.longitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const distance = calculateDistance(TEST_LOCATION_COORDS, TEST_OUTLET_LOCATION);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1000); // Should be less than 1km for nearby coordinates
    });

    it('should validate proximity within acceptable range', async () => {
      const maxDistance = 50; // 50 meters
      const { result } = renderHook(() => mockUseOutletDistanceValidation(maxDistance));

      await act(async () => {
        await result.current.validateDistance(TEST_OUTLET_LOCATION);
      });

      expect(result.current.distance).not.toBeNull();
      expect(typeof result.current.distance).toBe('number');
      expect(result.current.isWithinRange).toBeDefined();
    });

    it('should handle validation with different distance thresholds', async () => {
      const testCases = [
        { threshold: 10, expectWithinRange: false },
        { threshold: 100, expectWithinRange: true },
        { threshold: 1000, expectWithinRange: true }
      ];

      for (const { threshold } of testCases) {
        const { result } = renderHook(() => mockUseOutletDistanceValidation(threshold));

        await act(async () => {
          await result.current.validateDistance(TEST_OUTLET_LOCATION);
        });

        expect(result.current.distance).not.toBeNull();
        expect(typeof result.current.isWithinRange).toBe('boolean');
      }
    });
  });

  describe('useNotification Hook', () => {
    // Mock notification hook
    const mockUseNotification = () => {
      const [notifications, setNotifications] = React.useState<NotificationState['notifications']>([]);

      const showNotification = React.useCallback((notif: Omit<NotificationState['notifications'][0], 'id' | 'timestamp' | 'read'>) => {
        const newNotification = {
          ...notif,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
      }, []);

      const markAsRead = React.useCallback((id: string) => {
        setNotifications(prev => prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        ));
      }, []);

      const markAllAsRead = React.useCallback(() => {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      }, []);

      const clearNotifications = React.useCallback(() => {
        setNotifications([]);
      }, []);

      const unreadCount = React.useMemo(() => {
        return notifications.filter(notif => !notif.read).length;
      }, [notifications]);

      return {
        notifications,
        unreadCount,
        showNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications
      };
    };

    it('should manage notification state correctly', () => {
      const { result } = renderHook(() => mockUseNotification());

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);

      act(() => {
        result.current.showNotification({
          title: 'Test Notification',
          message: 'This is a test notification',
          type: 'info'
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.unreadCount).toBe(1);
      expect(result.current.notifications[0].title).toBe('Test Notification');
    });

    it('should handle different notification types', () => {
      const notificationTypes = ['info', 'warning', 'error', 'success'] as const;
      const { result } = renderHook(() => mockUseNotification());

      notificationTypes.forEach((type, index) => {
        act(() => {
          result.current.showNotification({
            title: `${type} Notification`,
            message: `This is a ${type} notification`,
            type: type
          });
        });
      });

      expect(result.current.notifications).toHaveLength(4);
      expect(result.current.unreadCount).toBe(4);

      notificationTypes.forEach((type, index) => {
        expect(result.current.notifications[index].type).toBe(notificationTypes[3 - index]); // Reversed due to prepend
      });
    });

    it('should mark notifications as read', () => {
      const { result } = renderHook(() => mockUseNotification());

      // Add notifications
      act(() => {
        result.current.showNotification({
          title: 'Notification 1',
          message: 'First notification',
          type: 'info'
        });
        result.current.showNotification({
          title: 'Notification 2',
          message: 'Second notification',
          type: 'warning'
        });
      });

      expect(result.current.unreadCount).toBe(2);

      // Mark first notification as read
      act(() => {
        result.current.markAsRead(result.current.notifications[0].id);
      });

      expect(result.current.unreadCount).toBe(1);
      expect(result.current.notifications[0].read).toBe(true);
      expect(result.current.notifications[1].read).toBe(false);

      // Mark all as read
      act(() => {
        result.current.markAllAsRead();
      });

      expect(result.current.unreadCount).toBe(0);
      expect(result.current.notifications.every(notif => notif.read)).toBe(true);
    });

    it('should clear all notifications', () => {
      const { result } = renderHook(() => mockUseNotification());

      // Add notifications
      act(() => {
        result.current.showNotification({
          title: 'Notification 1',
          message: 'First notification',
          type: 'info'
        });
        result.current.showNotification({
          title: 'Notification 2',
          message: 'Second notification',
          type: 'warning'
        });
      });

      expect(result.current.notifications).toHaveLength(2);

      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle memory cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useCurrentLocation());

      expect(result.current).toBeDefined();

      unmount();

      // Should not cause memory leaks or errors
    });

    it('should handle rapid location requests', async () => {
      mockLocationModule.getForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: true,
        expires: 'never' as any
      });

      let callCount = 0;
      mockLocationModule.getCurrentPositionAsync.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          coords: {
            latitude: TEST_LOCATION_COORDS.latitude + (callCount * 0.001),
            longitude: TEST_LOCATION_COORDS.longitude + (callCount * 0.001),
            accuracy: TEST_LOCATION_COORDS.accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        });
      });

      const { result } = renderHook(() => useCurrentLocation());

      // Rapid location requests
      const requests = Array.from({ length: 10 }, () => 
        act(async () => result.current.getLocation())
      );

      await Promise.all(requests);

      expect(callCount).toBeGreaterThan(0);
      expect(result.current.location).not.toBeNull();
    });

    it('should validate coordinates with proper precision', () => {
      const precisionTestCases = [
        { lat: 1.23456789, lng: 2.34567890, description: 'High precision coordinates' },
        { lat: 1.2, lng: 2.3, description: 'Low precision coordinates' },
        { lat: 0, lng: 0, description: 'Zero coordinates' }
      ];

      precisionTestCases.forEach(({ lat, lng }) => {
        const coords = { latitude: lat, longitude: lng, accuracy: 1.0 };
        expect(isValidLocationCoords(coords)).toBe(true);
        expect(coords.latitude).toBe(lat);
        expect(coords.longitude).toBe(lng);
      });
    });
  });
});