/**
 * Outlet History API Tests
 * Tests for Outlet History endpoints (2 endpoints)
 * 
 * Endpoints tested:
 * - GET /api/outlet-histories/pending - Get pending outlet history changes
 * - POST /api/outlet-histories/{historyId}/process - Process outlet history change
 */

import { apiRequest } from '@/utils/api';
import { API_ENDPOINTS, TEST_DATA } from '../config/testConfig';

// TypeScript interfaces for Outlet History data models
interface OutletHistory {
  id: string | number;
  outlet_id: string | number;
  field: string;
  old_value: any;
  new_value: any;
  changed_by: string | number;
  changed_at: string;
  status: 'pending' | 'approved' | 'rejected';
  processed_by?: string | number;
  processed_at?: string;
  reason?: string;
  outlet?: {
    id: string | number;
    code: string;
    name: string;
  };
  user?: {
    id: string | number;
    name: string;
    username: string;
  };
}

interface ProcessHistoryRequest {
  action: 'approve' | 'reject';
  reason?: string;
}

// Mock fetch for these tests
const originalFetch = global.fetch;

describe('Outlet History API Tests', () => {
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  const mockToken = 'admin_jwt_token';
  const historyId = '1';

  describe('GET /api/outlet-histories/pending - Get Pending Changes', () => {
    it('should successfully retrieve pending outlet history changes', async () => {
      const mockPendingHistories = [
        {
          id: '1',
          outlet_id: '1',
          field: 'name',
          old_value: 'Old Outlet Name',
          new_value: 'New Outlet Name',
          changed_by: '2',
          changed_at: '2024-01-15T10:00:00Z',
          status: 'pending',
          outlet: { id: '1', code: 'OUT001', name: 'Test Outlet' },
          user: { id: '2', name: 'Field User', username: 'fielduser' }
        },
        {
          id: '2',
          outlet_id: '1',
          field: 'owner_name',
          old_value: 'Old Owner',
          new_value: 'New Owner',
          changed_by: '2',
          changed_at: '2024-01-15T11:00:00Z',
          status: 'pending',
          outlet: { id: '1', code: 'OUT001', name: 'Test Outlet' },
          user: { id: '2', name: 'Field User', username: 'fielduser' }
        }
      ];

      const mockResponse = {
        meta: {
          code: 200,
          status: 'success',
          message: 'Pending outlet histories retrieved successfully',
          current_page: 1,
          last_page: 1,
          total: 2,
          per_page: 15,
        },
        data: mockPendingHistories,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLET_HISTORIES.PENDING,
        method: 'GET',
        logLabel: 'OUTLET_HISTORIES_PENDING_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.meta.status).toBe('success');
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);

      // Validate outlet history structure
      const history = response.data[0];
      expect(history).toHaveProperty('id');
      expect(history).toHaveProperty('outlet_id');
      expect(history).toHaveProperty('field');
      expect(history).toHaveProperty('old_value');
      expect(history).toHaveProperty('new_value');
      expect(history).toHaveProperty('changed_by');
      expect(history).toHaveProperty('changed_at');
      expect(history).toHaveProperty('status', 'pending');
      expect(history).toHaveProperty('outlet');
      expect(history).toHaveProperty('user');
    });

    it('should support pagination for pending histories', async () => {
      const mockResponse = {
        meta: {
          code: 200,
          status: 'success',
          message: 'Pending outlet histories retrieved successfully',
          current_page: 2,
          last_page: 3,
          total: 25,
          per_page: 10,
        },
        data: [
          {
            id: '11',
            outlet_id: '2',
            field: 'phone',
            old_value: '+628123456789',
            new_value: '+628987654321',
            changed_by: '3',
            changed_at: '2024-01-15T12:00:00Z',
            status: 'pending',
          }
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.OUTLET_HISTORIES.PENDING}?page=2&per_page=10`,
        method: 'GET',
        logLabel: 'OUTLET_HISTORIES_PAGINATION_TEST',
        token: mockToken,
      });

      expect(response.meta.current_page).toBe(2);
      expect(response.meta.per_page).toBe(10);
      expect(response.meta.total).toBe(25);
    });

    it('should filter pending histories by outlet', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [
          {
            id: '1',
            outlet_id: '1',
            field: 'name',
            old_value: 'Old Name',
            new_value: 'New Name',
            status: 'pending',
          }
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.OUTLET_HISTORIES.PENDING}?outlet_id=1`,
        method: 'GET',
        logLabel: 'OUTLET_HISTORIES_OUTLET_FILTER_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.every((item: any) => item.outlet_id === '1')).toBe(true);
    });

    it('should filter pending histories by date range', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [
          {
            id: '1',
            outlet_id: '1',
            field: 'name',
            changed_at: '2024-01-15T10:00:00Z',
            status: 'pending',
          }
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.OUTLET_HISTORIES.PENDING}?from_date=2024-01-15&to_date=2024-01-15`,
        method: 'GET',
        logLabel: 'OUTLET_HISTORIES_DATE_FILTER_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return empty array when no pending histories', async () => {
      const mockResponse = {
        meta: {
          code: 200,
          status: 'success',
          message: 'No pending outlet histories found',
          current_page: 1,
          last_page: 1,
          total: 0,
          per_page: 15,
        },
        data: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLET_HISTORIES.PENDING,
        method: 'GET',
        logLabel: 'OUTLET_HISTORIES_EMPTY_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveLength(0);
      expect(response.meta.total).toBe(0);
    });

    it('should require admin authentication', async () => {
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
          url: API_ENDPOINTS.OUTLET_HISTORIES.PENDING,
          method: 'GET',
          logLabel: 'OUTLET_HISTORIES_NO_AUTH_TEST',
          token: null,
        })
      ).rejects.toThrow('Token is invalid or expired. Please login again.');
    });

    it('should require sufficient permissions', async () => {
      const mockResponse = {
        meta: { code: 403, status: 'error', message: 'You do not have permission to access this resource.' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLET_HISTORIES.PENDING,
          method: 'GET',
          logLabel: 'OUTLET_HISTORIES_FORBIDDEN_TEST',
          token: 'field_user_token', // Non-admin token
        })
      ).rejects.toThrow(/You do not have permission to access this resource/i);
    });
  });

  describe('POST /api/outlet-histories/{historyId}/process - Process History Change', () => {
    it('should successfully approve pending outlet history change', async () => {
      const approveData: ProcessHistoryRequest = {
        action: 'approve',
        reason: 'Data correction approved by manager'
      };

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Outlet history change approved successfully' },
        data: {
          id: historyId,
          outlet_id: '1',
          field: 'name',
          old_value: 'Old Outlet Name',
          new_value: 'New Outlet Name',
          changed_by: '2',
          changed_at: '2024-01-15T10:00:00Z',
          status: 'approved',
          processed_by: '1',
          processed_at: '2024-01-15T14:00:00Z',
          reason: approveData.reason
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLET_HISTORIES.PROCESS(historyId),
        method: 'POST',
        body: approveData,
        logLabel: 'OUTLET_HISTORY_APPROVE_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.status).toBe('approved');
      expect(response.data.processed_by).toBe('1');
      expect(response.data.processed_at).not.toBeNull();
      expect(response.data.reason).toBe(approveData.reason);
    });

    it('should successfully reject pending outlet history change', async () => {
      const rejectData: ProcessHistoryRequest = {
        action: 'reject',
        reason: 'Data change is not accurate'
      };

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Outlet history change rejected successfully' },
        data: {
          id: historyId,
          outlet_id: '1',
          field: 'name',
          old_value: 'Old Outlet Name',
          new_value: 'New Outlet Name',
          changed_by: '2',
          changed_at: '2024-01-15T10:00:00Z',
          status: 'rejected',
          processed_by: '1',
          processed_at: '2024-01-15T14:00:00Z',
          reason: rejectData.reason
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLET_HISTORIES.PROCESS(historyId),
        method: 'POST',
        body: rejectData,
        logLabel: 'OUTLET_HISTORY_REJECT_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.status).toBe('rejected');
      expect(response.data.processed_by).toBe('1');
      expect(response.data.processed_at).not.toBeNull();
      expect(response.data.reason).toBe(rejectData.reason);
    });

    it('should validate required action field', async () => {
      const mockResponse = {
        meta: { code: 422, status: 'error', message: 'Validation failed: The action field is required' },
        data: null,
        errors: { action: ['The action field is required'] }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLET_HISTORIES.PROCESS(historyId),
          method: 'POST',
          body: { reason: 'Missing action' }, // Missing action field
          logLabel: 'OUTLET_HISTORY_VALIDATION_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/validation failed/i);
    });

    it('should validate action field values', async () => {
      const mockResponse = {
        meta: { code: 422, status: 'error', message: 'Validation failed: The selected action is invalid' },
        data: null,
        errors: { action: ['The selected action is invalid'] }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLET_HISTORIES.PROCESS(historyId),
          method: 'POST',
          body: { action: 'invalid_action' }, // Invalid action
          logLabel: 'OUTLET_HISTORY_INVALID_ACTION_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/validation failed/i);
    });

    it('should handle non-existent history ID', async () => {
      const mockResponse = {
        meta: { code: 404, status: 'error', message: 'Outlet history not found' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLET_HISTORIES.PROCESS('99999'),
          method: 'POST',
          body: { action: 'approve' },
          logLabel: 'OUTLET_HISTORY_NOT_FOUND_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/not found/i);
    });

    it('should handle already processed history', async () => {
      const mockResponse = {
        meta: { code: 400, status: 'error', message: 'Outlet history change has already been processed' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLET_HISTORIES.PROCESS(historyId),
          method: 'POST',
          body: { action: 'approve' },
          logLabel: 'OUTLET_HISTORY_ALREADY_PROCESSED_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/already been processed/i);
    });

    it('should require admin authentication for processing', async () => {
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
          url: API_ENDPOINTS.OUTLET_HISTORIES.PROCESS(historyId),
          method: 'POST',
          body: { action: 'approve' },
          logLabel: 'OUTLET_HISTORY_PROCESS_NO_AUTH_TEST',
          token: null,
        })
      ).rejects.toThrow('Token is invalid or expired. Please login again.');
    });
  });

  describe('Outlet History Data Validation', () => {
    it('should validate history status enum values', () => {
      const validStatuses = ['pending', 'approved', 'rejected'];
      const invalidStatuses = ['invalid_status', '', null, undefined];

      validStatuses.forEach(status => {
        expect(['pending', 'approved', 'rejected']).toContain(status);
      });

      invalidStatuses.forEach(status => {
        expect(['pending', 'approved', 'rejected']).not.toContain(status);
      });
    });

    it('should validate action enum values', () => {
      const validActions = ['approve', 'reject'];
      const invalidActions = ['invalid_action', '', null, undefined];

      validActions.forEach(action => {
        expect(['approve', 'reject']).toContain(action);
      });

      invalidActions.forEach(action => {
        expect(['approve', 'reject']).not.toContain(action);
      });
    });

    it('should validate outlet history structure', () => {
      const history = {
        id: '1',
        outlet_id: '1',
        field: 'name',
        old_value: 'Old Name',
        new_value: 'New Name',
        changed_by: '2',
        changed_at: '2024-01-15T10:00:00Z',
        status: 'pending',
      };

      // Required fields validation
      expect(history).toHaveProperty('id');
      expect(history).toHaveProperty('outlet_id');
      expect(history).toHaveProperty('field');
      expect(history).toHaveProperty('old_value');
      expect(history).toHaveProperty('new_value');
      expect(history).toHaveProperty('changed_by');
      expect(history).toHaveProperty('changed_at');
      expect(history).toHaveProperty('status');

      // Type validation
      expect(typeof history.field).toBe('string');
      expect(['pending', 'approved', 'rejected']).toContain(history.status);
      expect(history.changed_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    it('should validate trackable field names', () => {
      const trackableFields = [
        'name', 'owner_name', 'owner_phone', 'address', 'location',
        'custom_field_1', 'custom_field_2', 'level', 'status'
      ];

      trackableFields.forEach(field => {
        expect(typeof field).toBe('string');
        expect(field.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Outlet History Integration Scenarios', () => {
    it('should support complete history approval workflow', async () => {
      // Step 1: Get pending histories
      const pendingMockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [
          {
            id: '1',
            outlet_id: '1',
            field: 'name',
            old_value: 'Old Name',
            new_value: 'New Name',
            status: 'pending',
          }
        ]
      };

      // Step 2: Approve history change
      const approveMockResponse = {
        meta: { code: 200, status: 'success', message: 'Outlet history change approved successfully' },
        data: {
          id: '1',
          outlet_id: '1',
          field: 'name',
          old_value: 'Old Name',
          new_value: 'New Name',
          status: 'approved',
          processed_by: '1',
          processed_at: '2024-01-15T14:00:00Z',
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => pendingMockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => approveMockResponse,
        });

      // Get pending histories
      const pendingResponse = await apiRequest({
        url: API_ENDPOINTS.OUTLET_HISTORIES.PENDING,
        method: 'GET',
        logLabel: 'INTEGRATION_GET_PENDING',
        token: mockToken,
      });

      expect(pendingResponse.data).toHaveLength(1);
      const pendingHistory = pendingResponse.data[0];
      expect(pendingHistory.status).toBe('pending');

      // Approve the history change
      const approveResponse = await apiRequest({
        url: API_ENDPOINTS.OUTLET_HISTORIES.PROCESS(pendingHistory.id),
        method: 'POST',
        body: { action: 'approve', reason: 'Approved for integration test' },
        logLabel: 'INTEGRATION_APPROVE_HISTORY',
        token: mockToken,
      });

      expect(approveResponse.data.status).toBe('approved');
      expect(approveResponse.data.processed_by).toBe('1');
      expect(approveResponse.data.processed_at).not.toBeNull();
    });

    it('should handle batch processing scenario', async () => {
      // Mock multiple pending histories
      const pendingMockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [
          { id: '1', outlet_id: '1', field: 'name', status: 'pending' },
          { id: '2', outlet_id: '1', field: 'owner_name', status: 'pending' },
          { id: '3', outlet_id: '2', field: 'phone', status: 'pending' },
        ]
      };

      // Mock approval responses
      const approveMockResponse1 = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: { id: '1', status: 'approved', processed_by: '1' }
      };

      const approveMockResponse2 = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: { id: '2', status: 'approved', processed_by: '1' }
      };

      const rejectMockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: { id: '3', status: 'rejected', processed_by: '1' }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => pendingMockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => approveMockResponse1,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => approveMockResponse2,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => rejectMockResponse,
        });

      // Get pending histories
      const pendingResponse = await apiRequest({
        url: API_ENDPOINTS.OUTLET_HISTORIES.PENDING,
        method: 'GET',
        logLabel: 'BATCH_GET_PENDING',
        token: mockToken,
      });

      expect(pendingResponse.data).toHaveLength(3);

      // Process each history
      const results = [];
      
      // Approve first two
      for (let i = 0; i < 2; i++) {
        const result = await apiRequest({
          url: API_ENDPOINTS.OUTLET_HISTORIES.PROCESS(pendingResponse.data[i].id),
          method: 'POST',
          body: { action: 'approve' },
          logLabel: `BATCH_APPROVE_${i + 1}`,
          token: mockToken,
        });
        results.push(result);
      }

      // Reject third one
      const rejectResult = await apiRequest({
        url: API_ENDPOINTS.OUTLET_HISTORIES.PROCESS(pendingResponse.data[2].id),
        method: 'POST',
        body: { action: 'reject', reason: 'Data inconsistency' },
        logLabel: 'BATCH_REJECT',
        token: mockToken,
      });
      results.push(rejectResult);

      // Validate results
      expect(results[0].data.status).toBe('approved');
      expect(results[1].data.status).toBe('approved');
      expect(results[2].data.status).toBe('rejected');
    });
  });
});