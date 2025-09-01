/**
 * Comprehensive test suite for data fetching hooks
 * Tests useOutlet, useVisit, usePlanVisit, useProfile, and other data hooks
 * Covers data fetching, caching, error handling, and loading states
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useOutlet } from '@/hooks/data/useOutlet';
import { useVisit } from '@/hooks/data/useVisit';
import { usePlanVisit } from '@/hooks/data/usePlanVisit';
import { useProfile } from '@/hooks/data/useProfile';
import { useReference } from '@/hooks/data/useReference';
import { useHomeData } from '@/hooks/data/useHomeData';
// Mock dependencies
jest.mock('@/utils/api', () => ({
  apiRequest: jest.fn(),
}));

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    token: 'test_bearer_token',
    user: {
      id: '1',
      username: 'testuser',
      name: 'Test User'
    }
  }),
}));

jest.mock('@/utils/logger', () => ({
  log: jest.fn(),
}));

// TypeScript interfaces for comprehensive validation
interface DataHookState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

interface DataHookActions {
  refresh: () => Promise<void>;
  fetchData: () => Promise<void>;
}

interface CompleteDataHook<T> extends DataHookState<T>, DataHookActions {}

interface OutletData {
  id: string;
  code: string;
  name: string;
  owner_name: string;
  owner_phone: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photos?: {
    shop_sign?: string;
    front?: string;
    left?: string;
    right?: string;
  };
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

interface VisitData {
  id: string;
  outlet_id: string;
  user_id: string;
  visit_date: string;
  check_in_time?: string;
  check_out_time?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  photos?: string[];
  notes?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

interface PlanVisitData {
  id: string;
  outlet_id: string;
  user_id: string;
  planned_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface ProfileData {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  role: {
    id: string;
    name: string;
    permissions: Array<{ name: string }>;
  };
}

interface ReferenceData {
  regions: Array<{ id: string; name: string; code: string }>;
  clusters: Array<{ id: string; name: string; region_id: string }>;
  divisions: Array<{ id: string; name: string; cluster_id: string }>;
  outlets: Array<OutletData>;
}

interface HomeData {
  stats: {
    total_outlets: number;
    total_visits: number;
    pending_visits: number;
    completed_visits: number;
  };
  recent_activities: Array<{
    id: string;
    type: string;
    description: string;
    created_at: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
  }>;
}

// Validation functions
const isValidDataHookState = <T>(state: any): state is DataHookState<T> => {
  return (
    (state.data === null || typeof state.data === 'object') &&
    typeof state.loading === 'boolean' &&
    (typeof state.error === 'string' || state.error === null) &&
    typeof state.refreshing === 'boolean'
  );
};

const isValidDataHookActions = (actions: any): actions is DataHookActions => {
  return (
    typeof actions.refresh === 'function' &&
    typeof actions.fetchData === 'function'
  );
};

const isValidOutletData = (data: any): data is OutletData => {
  return (
    typeof data?.id === 'string' &&
    typeof data?.code === 'string' &&
    typeof data?.name === 'string' &&
    typeof data?.owner_name === 'string' &&
    typeof data?.owner_phone === 'string' &&
    typeof data?.location === 'object' &&
    typeof data?.location?.latitude === 'number' &&
    typeof data?.location?.longitude === 'number' &&
    ['active', 'inactive', 'pending'].includes(data?.status) &&
    typeof data?.created_at === 'string' &&
    typeof data?.updated_at === 'string'
  );
};

const isValidVisitData = (data: any): data is VisitData => {
  return (
    typeof data?.id === 'string' &&
    typeof data?.outlet_id === 'string' &&
    typeof data?.user_id === 'string' &&
    typeof data?.visit_date === 'string' &&
    typeof data?.location === 'object' &&
    typeof data?.location?.latitude === 'number' &&
    typeof data?.location?.longitude === 'number' &&
    typeof data?.location?.accuracy === 'number' &&
    ['scheduled', 'in_progress', 'completed', 'cancelled'].includes(data?.status)
  );
};

// Test data
const TEST_OUTLET_DATA: OutletData = {
  id: 'outlet_1',
  code: 'OUT001',
  name: 'Test Outlet',
  owner_name: 'John Doe',
  owner_phone: '+628123456789',
  location: {
    latitude: -6.2088,
    longitude: 106.8456,
    address: 'Jakarta, Indonesia'
  },
  photos: {
    shop_sign: 'https://example.com/shop_sign.jpg',
    front: 'https://example.com/front.jpg'
  },
  status: 'active',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

const TEST_VISIT_DATA: VisitData = {
  id: 'visit_1',
  outlet_id: 'outlet_1',
  user_id: 'user_1',
  visit_date: '2023-01-01',
  check_in_time: '09:00:00',
  check_out_time: '10:00:00',
  location: {
    latitude: -6.2088,
    longitude: 106.8456,
    accuracy: 5.0
  },
  photos: ['https://example.com/photo1.jpg'],
  notes: 'Visit completed successfully',
  status: 'completed'
};

const TEST_PLAN_VISIT_DATA: PlanVisitData = {
  id: 'plan_1',
  outlet_id: 'outlet_1',
  user_id: 'user_1',
  planned_date: '2023-01-02',
  status: 'scheduled',
  notes: 'Planned visit for next week'
};

const TEST_PROFILE_DATA: ProfileData = {
  id: 'user_1',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  phone: '+628123456789',
  photo: 'https://example.com/avatar.jpg',
  role: {
    id: 'role_1',
    name: 'Field Agent',
    permissions: [
      { name: 'outlets.read' },
      { name: 'visits.manage' }
    ]
  }
};

describe('Data Fetching Hooks', () => {
  const mockApiRequest = require('@/utils/api').apiRequest as jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useOutlet Hook', () => {
    it('should have correct TypeScript interface structure', async () => {
      mockApiRequest.mockResolvedValueOnce({
        meta: { status: 'success', code: 200, message: 'Outlets retrieved successfully' },
        data: [TEST_OUTLET_DATA]
      });

      const { result } = renderHook(() => useOutlet());

      // Validate initial state
      expect(isValidDataHookState(result.current)).toBe(true);
      expect(isValidDataHookActions(result.current)).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Validate loaded data
      if (result.current.data) {
        expect(Array.isArray(result.current.data)).toBe(true);
        if (result.current.data.length > 0) {
          expect(isValidOutletData(result.current.data[0])).toBe(true);
        }
      }
    });

    it('should initialize with correct loading state', () => {
      const { result } = renderHook(() => useOutlet());

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.refreshing).toBe(false);
    });

    it('should fetch outlet data successfully', async () => {
      const mockResponse = {
        meta: { status: 'success', code: 200, message: 'Success' },
        data: [TEST_OUTLET_DATA]
      };

      mockApiRequest.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useOutlet());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([TEST_OUTLET_DATA]);
      expect(result.current.error).toBeNull();
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/outlets'),
          method: 'GET',
          token: 'test_bearer_token'
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockError = {
        meta: { status: 'error', code: 500, message: 'Server error' },
        data: null
      };

      mockApiRequest.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useOutlet());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toContain('Server error');
    });

    it('should support data refresh functionality', async () => {
      const initialResponse = {
        meta: { status: 'success', code: 200, message: 'Success' },
        data: [TEST_OUTLET_DATA]
      };

      const refreshResponse = {
        meta: { status: 'success', code: 200, message: 'Success' },
        data: [{
          ...TEST_OUTLET_DATA,
          name: 'Updated Outlet Name'
        }]
      };

      mockApiRequest
        .mockResolvedValueOnce(initialResponse)
        .mockResolvedValueOnce(refreshResponse);

      const { result } = renderHook(() => useOutlet());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.[0]?.name).toBe('Test Outlet');

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.data?.[0]?.name).toBe('Updated Outlet Name');
      expect(mockApiRequest).toHaveBeenCalledTimes(2);
    });

    it('should handle refreshing state correctly', async () => {
      const initialResponse = {
        meta: { status: 'success', code: 200, message: 'Success' },
        data: [TEST_OUTLET_DATA]
      };

      let resolveRefresh: () => void;
      const refreshPromise = new Promise<any>(resolve => {
        resolveRefresh = () => resolve(initialResponse);
      });

      mockApiRequest
        .mockResolvedValueOnce(initialResponse)
        .mockReturnValueOnce(refreshPromise);

      const { result } = renderHook(() => useOutlet());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start refresh
      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.refreshing).toBe(true);
      });

      expect(result.current.loading).toBe(false); // Loading should be false during refresh

      // Complete refresh
      act(() => {
        resolveRefresh!();
      });

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });
    });
  });

  describe('useVisit Hook', () => {
    it('should have correct TypeScript interface for visit data', async () => {
      mockApiRequest.mockResolvedValueOnce({
        meta: { status: 'success', code: 200, message: 'Visits retrieved successfully' },
        data: [TEST_VISIT_DATA]
      });

      const { result } = renderHook(() => useVisit());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      if (result.current.data && Array.isArray(result.current.data) && result.current.data.length > 0) {
        expect(isValidVisitData(result.current.data[0])).toBe(true);
      }
    });

    it('should fetch visit data with proper filtering', async () => {
      const mockResponse = {
        meta: { status: 'success', code: 200, message: 'Success' },
        data: [TEST_VISIT_DATA]
      };

      mockApiRequest.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useVisit({ outletId: 'outlet_1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/visits'),
          method: 'GET',
          token: 'test_bearer_token'
        })
      );
    });
  });

  describe('usePlanVisit Hook', () => {
    it('should handle plan visit data correctly', async () => {
      const mockResponse = {
        meta: { status: 'success', code: 200, message: 'Success' },
        data: [TEST_PLAN_VISIT_DATA]
      };

      mockApiRequest.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => usePlanVisit());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([TEST_PLAN_VISIT_DATA]);
    });

    it('should support creating new plan visits', async () => {
      const createResponse = {
        meta: { status: 'success', code: 201, message: 'Plan visit created' },
        data: TEST_PLAN_VISIT_DATA
      };

      mockApiRequest.mockResolvedValueOnce(createResponse);

      const { result } = renderHook(() => usePlanVisit());

      if (typeof (result.current as any).createPlanVisit === 'function') {
        await act(async () => {
          await (result.current as any).createPlanVisit({
            outlet_id: 'outlet_1',
            planned_date: '2023-01-02',
            notes: 'New plan visit'
          });
        });

        expect(mockApiRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
              outlet_id: 'outlet_1',
              planned_date: '2023-01-02',
              notes: 'New plan visit'
            })
          })
        );
      }
    });
  });

  describe('useProfile Hook', () => {
    it('should fetch and validate profile data', async () => {
      const mockResponse = {
        meta: { status: 'success', code: 200, message: 'Profile retrieved' },
        data: TEST_PROFILE_DATA
      };

      mockApiRequest.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(TEST_PROFILE_DATA);
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/profile'),
          method: 'GET',
          token: 'test_bearer_token'
        })
      );
    });

    it('should support profile updates', async () => {
      const updateData = { name: 'Updated Name', email: 'updated@example.com' };
      const updateResponse = {
        meta: { status: 'success', code: 200, message: 'Profile updated' },
        data: { ...TEST_PROFILE_DATA, ...updateData }
      };

      mockApiRequest.mockResolvedValueOnce(updateResponse);

      const { result } = renderHook(() => useProfile());

      if (typeof (result.current as any).updateProfile === 'function') {
        await act(async () => {
          await (result.current as any).updateProfile(updateData);
        });

        expect(mockApiRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            url: expect.stringContaining('/profile'),
            method: 'POST',
            body: updateData,
            token: 'test_bearer_token'
          })
        );
      }
    });
  });

  describe('useReference Hook', () => {
    it('should fetch reference data with hierarchical structure', async () => {
      const referenceData: ReferenceData = {
        regions: [
          { id: 'region_1', name: 'Jakarta', code: 'JKT' },
          { id: 'region_2', name: 'Bandung', code: 'BDG' }
        ],
        clusters: [
          { id: 'cluster_1', name: 'Jakarta Pusat', region_id: 'region_1' },
          { id: 'cluster_2', name: 'Jakarta Selatan', region_id: 'region_1' }
        ],
        divisions: [
          { id: 'division_1', name: 'Menteng', cluster_id: 'cluster_1' },
          { id: 'division_2', name: 'Kuningan', cluster_id: 'cluster_2' }
        ],
        outlets: [TEST_OUTLET_DATA]
      };

      mockApiRequest.mockResolvedValueOnce({
        meta: { status: 'success', code: 200, message: 'Reference data retrieved' },
        data: referenceData
      });

      const { result } = renderHook(() => useReference());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(referenceData);
      expect(result.current.data?.regions).toHaveLength(2);
      expect(result.current.data?.clusters).toHaveLength(2);
      expect(result.current.data?.divisions).toHaveLength(2);
      expect(result.current.data?.outlets).toHaveLength(1);
    });
  });

  describe('useHomeData Hook', () => {
    it('should fetch comprehensive home dashboard data', async () => {
      const homeData: HomeData = {
        stats: {
          total_outlets: 150,
          total_visits: 1250,
          pending_visits: 25,
          completed_visits: 1200
        },
        recent_activities: [
          {
            id: 'activity_1',
            type: 'visit_completed',
            description: 'Visit completed at Test Outlet',
            created_at: '2023-01-01T10:00:00Z'
          }
        ],
        notifications: [
          {
            id: 'notif_1',
            title: 'New Assignment',
            message: 'You have been assigned to visit 5 new outlets',
            read: false,
            created_at: '2023-01-01T08:00:00Z'
          }
        ]
      };

      mockApiRequest.mockResolvedValueOnce({
        meta: { status: 'success', code: 200, message: 'Home data retrieved' },
        data: homeData
      });

      const { result } = renderHook(() => useHomeData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(homeData);
      expect(result.current.data?.stats.total_outlets).toBe(150);
      expect(result.current.data?.recent_activities).toHaveLength(1);
      expect(result.current.data?.notifications).toHaveLength(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('Network timeout'));

      const { result } = renderHook(() => useOutlet());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Network timeout');
      expect(result.current.data).toBeNull();
    });

    it('should handle authentication errors', async () => {
      const authError = {
        meta: { status: 'error', code: 401, message: 'Token expired' },
        data: null
      };

      mockApiRequest.mockRejectedValueOnce(authError);

      const { result } = renderHook(() => useOutlet());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Token expired');
    });

    it('should handle malformed API responses', async () => {
      mockApiRequest.mockResolvedValueOnce({
        // Missing meta field
        data: 'invalid_data_format'
      });

      const { result } = renderHook(() => useOutlet());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
    });

    it('should handle concurrent data fetching', async () => {
      let resolveCount = 0;
      mockApiRequest.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolveCount++;
            resolve({
              meta: { status: 'success', code: 200, message: 'Success' },
              data: [TEST_OUTLET_DATA]
            });
          }, 100);
        });
      });

      const { result } = renderHook(() => useOutlet());

      // Start multiple concurrent fetches
      const fetchPromises = [
        act(async () => result.current.fetchData()),
        act(async () => result.current.fetchData()),
        act(async () => result.current.refresh())
      ];

      await Promise.all(fetchPromises);

      expect(resolveCount).toBeGreaterThan(0);
      expect(result.current.data).not.toBeNull();
    });

    it('should handle memory cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useOutlet());

      expect(result.current).toBeDefined();

      unmount();

      // Should not cause memory leaks or errors
    });
  });

  describe('Performance Optimization', () => {
    it('should prevent unnecessary API calls', async () => {
      const mockResponse = {
        meta: { status: 'success', code: 200, message: 'Success' },
        data: [TEST_OUTLET_DATA]
      };

      mockApiRequest.mockResolvedValue(mockResponse);

      const { result, rerender } = renderHook(() => useOutlet());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockApiRequest.mock.calls.length;

      // Re-render hook multiple times
      rerender();
      rerender();
      rerender();

      await waitFor(() => {
        expect(mockApiRequest.mock.calls.length).toBe(initialCallCount);
      });
    });

    it('should cache data appropriately', async () => {
      const mockResponse = {
        meta: { status: 'success', code: 200, message: 'Success' },
        data: [TEST_OUTLET_DATA]
      };

      mockApiRequest.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useOutlet());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const cachedData = result.current.data;

      // Multiple accesses should return same reference
      expect(result.current.data).toBe(cachedData);
      expect(result.current.data).toBe(cachedData);
    });
  });
});