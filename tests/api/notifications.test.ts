/**
 * Notification API Tests
 * Tests for Notification endpoints (7 endpoints)
 * 
 * Endpoints tested:
 * - GET /api/notifications - Get all notifications
 * - POST /api/notifications/mark-all-read - Mark all notifications as read
 * - DELETE /api/notifications/read - Delete all read notifications
 * - GET /api/notifications/unread-count - Get unread notification count
 * - GET /api/notifications/{notification} - Get specific notification
 * - DELETE /api/notifications/{notification} - Delete specific notification
 * - POST /api/notifications/{notification}/read - Mark specific notification as read
 */

import { apiRequest } from '@/utils/api';
import { API_ENDPOINTS, TEST_DATA } from '../config/testConfig';

// TypeScript interfaces for Notification data models
interface Notification {
  id: string | number;
  title: string;
  message: string;
  type: 'visit_assignment' | 'outlet_update' | 'system_message' | 'reminder';
  read_at: string | null;
  created_at: string;
  updated_at: string;
  data?: Record<string, any>;
}

interface NotificationListResponse {
  data: Notification[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

interface UnreadCountResponse {
  unread_count: number;
}

// Mock fetch for these tests
const originalFetch = global.fetch;

describe('Notification API Tests', () => {
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  const mockToken = 'valid_jwt_token';
  const notificationId = '1';

  describe('GET /api/notifications - List Notifications', () => {
    it('should successfully retrieve paginated notifications list', async () => {
      const mockNotifications = [
        {
          id: '1',
          title: 'New Visit Assigned',
          message: 'You have been assigned a new visit to Test Outlet',
          type: 'visit_assignment',
          read_at: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          title: 'Outlet Updated',
          message: 'Outlet information has been updated',
          type: 'outlet_update',
          read_at: '2024-01-15T11:00:00Z',
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T11:00:00Z',
        },
      ];

      const mockResponse = {
        meta: {
          code: 200,
          status: 'success',
          message: 'Notifications retrieved successfully',
          current_page: 1,
          last_page: 1,
          total: 2,
          per_page: 15,
        },
        data: mockNotifications,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.INDEX,
        method: 'GET',
        logLabel: 'NOTIFICATIONS_INDEX_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.meta.status).toBe('success');
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);

      // Validate notification structure
      const notification = response.data[0];
      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('title');
      expect(notification).toHaveProperty('message');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('read_at');
      expect(notification).toHaveProperty('created_at');
    });

    it('should support pagination parameters', async () => {
      const mockResponse = {
        meta: {
          code: 200,
          status: 'success',
          message: 'Notifications retrieved successfully',
          current_page: 2,
          last_page: 3,
          total: 25,
          per_page: 10,
        },
        data: [TEST_DATA.NOTIFICATION_RESPONSE],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.NOTIFICATIONS.INDEX}?page=2&per_page=10`,
        method: 'GET',
        logLabel: 'NOTIFICATIONS_PAGINATION_TEST',
        token: mockToken,
      });

      expect(response.meta.current_page).toBe(2);
      expect(response.meta.per_page).toBe(10);
      expect(response.meta.total).toBe(25);
    });

    it('should filter notifications by read status', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [{ ...TEST_DATA.NOTIFICATION_RESPONSE, read_at: null }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.NOTIFICATIONS.INDEX}?read=false`,
        method: 'GET',
        logLabel: 'NOTIFICATIONS_FILTER_UNREAD_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data[0].read_at).toBeNull();
    });

    it('should require authentication', async () => {
      const mockResponse = {
        meta: { code: 401, status: 'error', message: 'Token is invalid or expired. Please login again.' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.NOTIFICATIONS.INDEX,
          method: 'GET',
          logLabel: 'NOTIFICATIONS_NO_AUTH_TEST',
          token: null,
        })
      ).rejects.toThrow('Token is invalid or expired. Please login again.');
    });
  });

  describe('POST /api/notifications/mark-all-read - Mark All Read', () => {
    it('should successfully mark all notifications as read', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'All notifications marked as read' },
        data: { marked_count: 5, message: 'All notifications marked as read' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
        method: 'POST',
        logLabel: 'NOTIFICATIONS_MARK_ALL_READ_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('marked_count');
      expect(response.data.marked_count).toBeGreaterThanOrEqual(0);
    });

    it('should handle case with no unread notifications', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'No unread notifications found' },
        data: { marked_count: 0, message: 'No unread notifications found' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
        method: 'POST',
        logLabel: 'NOTIFICATIONS_NO_UNREAD_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.marked_count).toBe(0);
    });
  });

  describe('DELETE /api/notifications/read - Delete All Read', () => {
    it('should successfully delete all read notifications', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Read notifications deleted successfully' },
        data: { deleted_count: 3, message: 'Read notifications deleted successfully' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.DELETE_ALL_READ,
        method: 'DELETE',
        logLabel: 'NOTIFICATIONS_DELETE_READ_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('deleted_count');
      expect(response.data.deleted_count).toBeGreaterThanOrEqual(0);
    });

    it('should handle case with no read notifications', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'No read notifications found' },
        data: { deleted_count: 0, message: 'No read notifications found' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.DELETE_ALL_READ,
        method: 'DELETE',
        logLabel: 'NOTIFICATIONS_NO_READ_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.deleted_count).toBe(0);
    });
  });

  describe('GET /api/notifications/unread-count - Unread Count', () => {
    it('should successfully retrieve unread notification count', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Unread count retrieved successfully' },
        data: { unread_count: 7 }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
        method: 'GET',
        logLabel: 'NOTIFICATIONS_UNREAD_COUNT_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('unread_count');
      expect(typeof response.data.unread_count).toBe('number');
      expect(response.data.unread_count).toBeGreaterThanOrEqual(0);
    });

    it('should return zero when no unread notifications', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Unread count retrieved successfully' },
        data: { unread_count: 0 }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
        method: 'GET',
        logLabel: 'NOTIFICATIONS_ZERO_UNREAD_TEST',
        token: mockToken,
      });

      expect(response.data.unread_count).toBe(0);
    });
  });

  describe('GET /api/notifications/{notification} - Show Notification', () => {
    it('should successfully retrieve specific notification', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Notification retrieved successfully' },
        data: {
          ...TEST_DATA.NOTIFICATION_RESPONSE,
          id: notificationId,
          data: { outlet_id: '1', visit_id: '2' }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.SHOW(notificationId),
        method: 'GET',
        logLabel: 'NOTIFICATIONS_SHOW_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.id).toBe(notificationId);
      expect(response.data).toHaveProperty('title');
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('type');
      expect(response.data).toHaveProperty('data');
    });

    it('should handle non-existent notification', async () => {
      const mockResponse = {
        meta: { code: 404, status: 'error', message: 'Notification not found' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.NOTIFICATIONS.SHOW('99999'),
          method: 'GET',
          logLabel: 'NOTIFICATIONS_NOT_FOUND_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('DELETE /api/notifications/{notification} - Delete Notification', () => {
    it('should successfully delete specific notification', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Notification deleted successfully' },
        data: { id: notificationId, message: 'Notification deleted successfully' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.DELETE(notificationId),
        method: 'DELETE',
        logLabel: 'NOTIFICATIONS_DELETE_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.meta.message).toMatch(/deleted successfully/i);
    });

    it('should handle deletion of non-existent notification', async () => {
      const mockResponse = {
        meta: { code: 404, status: 'error', message: 'Notification not found' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.NOTIFICATIONS.DELETE('99999'),
          method: 'DELETE',
          logLabel: 'NOTIFICATIONS_DELETE_NOT_FOUND_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('POST /api/notifications/{notification}/read - Mark Notification Read', () => {
    it('should successfully mark specific notification as read', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Notification marked as read' },
        data: {
          ...TEST_DATA.NOTIFICATION_RESPONSE,
          id: notificationId,
          read_at: '2024-01-15T12:00:00Z'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId),
        method: 'POST',
        logLabel: 'NOTIFICATIONS_MARK_READ_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.read_at).not.toBeNull();
      expect(response.data.id).toBe(notificationId);
    });

    it('should handle already read notification', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Notification is already marked as read' },
        data: {
          ...TEST_DATA.NOTIFICATION_RESPONSE,
          id: notificationId,
          read_at: '2024-01-15T10:00:00Z'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId),
        method: 'POST',
        logLabel: 'NOTIFICATIONS_ALREADY_READ_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.read_at).not.toBeNull();
    });
  });

  describe('Notification Data Validation', () => {
    it('should validate notification type enum values', () => {
      const validTypes = ['visit_assignment', 'outlet_update', 'system_message', 'reminder'];
      const invalidTypes = ['invalid_type', '', null, undefined];

      validTypes.forEach(type => {
        expect(['visit_assignment', 'outlet_update', 'system_message', 'reminder']).toContain(type);
      });

      invalidTypes.forEach(type => {
        expect(['visit_assignment', 'outlet_update', 'system_message', 'reminder']).not.toContain(type);
      });
    });

    it('should validate notification timestamp formats', () => {
      const validTimestamps = [
        '2024-01-15T10:00:00Z',
        '2024-12-31T23:59:59Z',
        '2024-01-01T00:00:00Z'
      ];

      validTimestamps.forEach(timestamp => {
        expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        // Test that it's a valid date
        const date = new Date(timestamp);
        expect(date.getTime()).not.toBeNaN();
        // Test that the format is consistent
        expect(date.toISOString().substring(0, 19) + 'Z').toBe(timestamp);
      });
    });

    it('should validate notification data structure', () => {
      const notification = {
        id: '1',
        title: 'Test Notification',
        message: 'Test message',
        type: 'system_message',
        read_at: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      // Required fields validation
      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('title');
      expect(notification).toHaveProperty('message');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('created_at');
      expect(notification).toHaveProperty('updated_at');

      // Type validation
      expect(typeof notification.title).toBe('string');
      expect(typeof notification.message).toBe('string');
      expect(['visit_assignment', 'outlet_update', 'system_message', 'reminder']).toContain(notification.type);
    });
  });

  describe('Notification Integration Scenarios', () => {
    it('should support notification lifecycle workflow', async () => {
      // Step 1: Get unread count
      const unreadMockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: { unread_count: 1 }
      };

      // Step 2: Get notification details
      const notificationMockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: { ...TEST_DATA.NOTIFICATION_RESPONSE, read_at: null }
      };

      // Step 3: Mark as read
      const markReadMockResponse = {
        meta: { code: 200, status: 'success', message: 'Notification marked as read' },
        data: { ...TEST_DATA.NOTIFICATION_RESPONSE, read_at: '2024-01-15T12:00:00Z' }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => unreadMockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => notificationMockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => markReadMockResponse,
        });

      // Get unread count
      const unreadResponse = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
        method: 'GET',
        logLabel: 'INTEGRATION_UNREAD_COUNT',
        token: mockToken,
      });

      expect(unreadResponse.data.unread_count).toBe(1);

      // Get notification details
      const notificationResponse = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.SHOW('1'),
        method: 'GET',
        logLabel: 'INTEGRATION_GET_NOTIFICATION',
        token: mockToken,
      });

      expect(notificationResponse.data.read_at).toBeNull();

      // Mark as read
      const markReadResponse = await apiRequest({
        url: API_ENDPOINTS.NOTIFICATIONS.MARK_READ('1'),
        method: 'POST',
        logLabel: 'INTEGRATION_MARK_READ',
        token: mockToken,
      });

      expect(markReadResponse.data.read_at).not.toBeNull();
    });
  });
});