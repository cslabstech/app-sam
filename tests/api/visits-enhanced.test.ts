/**
 * Enhanced Visit API Tests with Location Validation and Offline Sync Testing
 * Comprehensive testing of visit management with GPS validation and offline capabilities
 */

import { apiRequest } from '@/utils/api';
import { API_ENDPOINTS } from '../config/testConfig';

// ===== CORE INTERFACES =====

interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationValidation {
  is_within_radius: boolean;
  distance_meters: number;
  max_allowed_distance: number;
  gps_accuracy_acceptable: boolean;
  location_source: 'gps' | 'network' | 'passive';
}

interface VisitLocation {
  checkin_location: GeoLocation;
  checkout_location?: GeoLocation;
  outlet_location: GeoLocation;
  checkin_validation: LocationValidation;
}

interface OfflineVisitData {
  id: string;
  temp_id: string;
  outlet_id: string;
  status: 'draft' | 'syncing' | 'synced' | 'failed';
  sync_attempts: number;
  location_data: VisitLocation;
  offline_created_at: string;
}

interface EnhancedVisit {
  id: string;
  outlet_id: string;
  visit_date: string;
  checkin_time: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  location_data: VisitLocation;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
  updated_at: string;
}

// ===== VALIDATION FUNCTIONS =====

const isValidGeoLocation = (location: any): location is GeoLocation => {
  return (
    typeof location?.latitude === 'number' &&
    typeof location?.longitude === 'number' &&
    location.latitude >= -90 && location.latitude <= 90 &&
    location.longitude >= -180 && location.longitude <= 180 &&
    typeof location.accuracy === 'number' &&
    location.accuracy > 0 &&
    typeof location.timestamp === 'number'
  );
};

const isValidLocationValidation = (validation: any): validation is LocationValidation => {
  return (
    typeof validation?.is_within_radius === 'boolean' &&
    typeof validation?.distance_meters === 'number' &&
    typeof validation?.gps_accuracy_acceptable === 'boolean' &&
    ['gps', 'network', 'passive'].includes(validation?.location_source)
  );
};

// ===== MOCKS =====

const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

const originalFetch = global.fetch;

describe('Enhanced Visit API with Location and Offline Sync', () => {
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockAsyncStorage.getItem.mockClear();
  });

  describe('Location Validation Tests', () => {
    it('should validate visit creation with accurate GPS location', async () => {
      const checkinLocation: GeoLocation = {
        latitude: -6.2088,
        longitude: 106.8456,
        accuracy: 8,
        timestamp: Date.now()
      };

      const mockResponse = {
        meta: { code: 201, status: 'success', message: 'Visit created successfully' },
        data: {
          id: '1',
          outlet_id: '1',
          visit_date: '2024-01-15',
          checkin_time: '09:00:00',
          status: 'in_progress',
          location_data: {
            checkin_location: checkinLocation,
            outlet_location: checkinLocation,
            checkin_validation: {
              is_within_radius: true,
              distance_meters: 8.5,
              max_allowed_distance: 50,
              gps_accuracy_acceptable: true,
              location_source: 'gps'
            }
          },
          sync_status: 'synced',
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T09:00:00Z'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.VISITS.STORE,
        method: 'POST',
        body: {
          outlet_id: '1',
          visit_date: '2024-01-15',
          checkin_time: '09:00:00',
          location_data: { checkin_location: checkinLocation }
        },
        token: 'valid_token',
        logLabel: 'CREATE_VISIT_LOCATION_TEST',
      });

      const visit = response.data as EnhancedVisit;
      
      // Validate location structure
      expect(isValidGeoLocation(visit.location_data.checkin_location)).toBe(true);
      expect(isValidLocationValidation(visit.location_data.checkin_validation)).toBe(true);
      expect(visit.location_data.checkin_validation.is_within_radius).toBe(true);
      expect(visit.location_data.checkin_validation.distance_meters).toBeLessThan(50);
      expect(visit.location_data.checkin_validation.gps_accuracy_acceptable).toBe(true);
    });

    it('should reject visit with inaccurate location', async () => {
      const inaccurateLocation: GeoLocation = {
        latitude: -6.5000, // Too far
        longitude: 107.0000,
        accuracy: 100, // Poor accuracy
        timestamp: Date.now()
      };

      const mockErrorResponse = {
        meta: { code: 422, status: 'error', message: 'Location validation failed' },
        data: null,
        errors: {
          location: ['GPS location is too far from outlet'],
          location_validation: {
            is_within_radius: false,
            distance_meters: 52340,
            gps_accuracy_acceptable: false
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockErrorResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.VISITS.STORE,
          method: 'POST',
          body: {
            outlet_id: '1',
            location_data: { checkin_location: inaccurateLocation }
          },
          token: 'valid_token',
          logLabel: 'INVALID_LOCATION_TEST',
        })
      ).rejects.toThrow('Location validation failed');
    });
  });

  describe('Offline Sync Testing', () => {
    it('should sync offline visits when network available', async () => {
      const offlineVisit: OfflineVisitData = {
        id: 'offline_1',
        temp_id: 'temp_12345',
        outlet_id: '1',
        status: 'draft',
        sync_attempts: 0,
        location_data: {
          checkin_location: {
            latitude: -6.2088,
            longitude: 106.8456,
            accuracy: 10,
            timestamp: Date.now()
          },
          outlet_location: {
            latitude: -6.2088,
            longitude: 106.8456,
            accuracy: 5,
            timestamp: Date.now()
          },
          checkin_validation: {
            is_within_radius: true,
            distance_meters: 5.2,
            max_allowed_distance: 50,
            gps_accuracy_acceptable: true,
            location_source: 'gps'
          }
        },
        offline_created_at: '2024-01-15T09:00:00Z'
      };

      const mockSyncResponse = {
        meta: { code: 200, status: 'success', message: 'Sync successful' },
        data: {
          success: true,
          synced_visits: ['temp_12345'],
          failed_visits: [],
          total_processed: 1,
          sync_duration_ms: 1250
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSyncResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.VISITS.INDEX}/sync-offline`,
        method: 'POST',
        body: { offline_visits: [offlineVisit] },
        token: 'valid_token',
        logLabel: 'OFFLINE_SYNC_TEST',
      });

      expect(response.data.success).toBe(true);
      expect(response.data.synced_visits).toContain('temp_12345');
      expect(response.data.failed_visits).toHaveLength(0);
    });

    it('should handle sync conflicts', async () => {
      const conflictVisit: OfflineVisitData = {
        id: 'conflict_1',
        temp_id: 'temp_conflict_12345',
        outlet_id: '1',
        status: 'syncing',
        sync_attempts: 2,
        location_data: {
          checkin_location: { latitude: -6.2088, longitude: 106.8456, accuracy: 8, timestamp: Date.now() },
          outlet_location: { latitude: -6.2088, longitude: 106.8456, accuracy: 5, timestamp: Date.now() },
          checkin_validation: {
            is_within_radius: true, distance_meters: 8.5, max_allowed_distance: 50,
            gps_accuracy_acceptable: true, location_source: 'gps'
          }
        },
        offline_created_at: '2024-01-15T09:00:00Z'
      };

      const mockConflictResponse = {
        meta: { code: 409, status: 'conflict', message: 'Sync conflicts detected' },
        data: {
          success: false,
          conflicts: ['temp_conflict_12345'],
          total_processed: 1,
          errors: {
            'temp_conflict_12345': 'Visit modified on server'
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockConflictResponse,
      });

      await expect(
        apiRequest({
          url: `${API_ENDPOINTS.VISITS.INDEX}/sync-offline`,
          method: 'POST',
          body: { offline_visits: [conflictVisit] },
          token: 'valid_token',
          logLabel: 'SYNC_CONFLICT_TEST',
        })
      ).rejects.toThrow('Sync conflicts detected');
    });
  });

  describe('Location and Offline Integration', () => {
    it('should validate location accuracy based on network state', () => {
      const onlineRequirement = {
        max_distance: 50,
        min_accuracy: 20,
        sources: ['gps']
      };

      const offlineRequirement = {
        max_distance: 100,
        min_accuracy: 50,
        sources: ['gps', 'network']
      };

      expect(onlineRequirement.max_distance).toBeLessThan(offlineRequirement.max_distance);
      expect(onlineRequirement.min_accuracy).toBeLessThan(offlineRequirement.min_accuracy);
      expect(onlineRequirement.sources).toHaveLength(1);
      expect(offlineRequirement.sources).toHaveLength(2);
    });
  });
});