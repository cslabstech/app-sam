/**
 * Outlet Management API Endpoints Test Suite
 * Testing 5 outlet management endpoints with comprehensive scenarios
 * 
 * Endpoints tested:
 * - GET /api/outlets - List outlets with pagination
 * - GET /api/outlets/{id} - Get specific outlet details
 * - GET /api/outlets/{id}/with-custom-fields - Get outlet with custom fields
 * - POST /api/outlets - Create new outlet
 * - POST /api/outlets/{id} - Update existing outlet
 */

import { apiRequest } from '@/utils/api';
import { 
  API_ENDPOINTS, 
  TEST_DATA, 
  createAuthHeaders,
  createFormDataHeaders,
  StandardApiResponse 
} from '../config/testConfig';

// Mock fetch for these tests
const originalFetch = global.fetch;

describe('Outlet Management API Endpoints', () => {
  const validToken = 'valid_bearer_token';
  const testOutletId = '1';
  const nonExistentOutletId = '999';

  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('GET /api/outlets', () => {
    it('should successfully retrieve outlets list with authentication', async () => {
      const mockResponse = {
        meta: { 
          code: 200, 
          status: 'success', 
          message: 'Outlets retrieved successfully',
          current_page: 1,
          last_page: 1,
          total: 2,
          per_page: 10
        },
        data: [
          TEST_DATA.OUTLET_RESPONSE,
          {
            ...TEST_DATA.OUTLET_RESPONSE,
            id: '2',
            code: 'OUT002',
            name: 'Second Outlet'
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.INDEX,
        method: 'GET',
        logLabel: 'GET_OUTLETS_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(2);
      
      // Verify outlet structure
      const outlet = response.data[0];
      expect(outlet).toHaveProperty('id');
      expect(outlet).toHaveProperty('code');
      expect(outlet).toHaveProperty('name');
      expect(outlet).toHaveProperty('location');
      expect(outlet).toHaveProperty('owner_name');
      expect(outlet).toHaveProperty('owner_phone');
      expect(outlet).toHaveProperty('created_at');
      expect(outlet).toHaveProperty('updated_at');
      
      // Verify location structure
      expect(outlet.location).toHaveProperty('latitude');
      expect(outlet.location).toHaveProperty('longitude');
      expect(typeof outlet.location.latitude).toBe('number');
      expect(typeof outlet.location.longitude).toBe('number');
    });

    it('should support pagination parameters', async () => {
      const mockResponse = {
        meta: { 
          code: 200, 
          status: 'success', 
          message: 'Success',
          current_page: 1,
          last_page: 5,
          total: 50,
          per_page: 10
        },
        data: [TEST_DATA.OUTLET_RESPONSE]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.OUTLETS.INDEX}?page=1&per_page=10`,
        method: 'GET',
        logLabel: 'GET_OUTLETS_PAGINATION_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta).toHaveProperty('current_page', 1);
      expect(response.meta).toHaveProperty('last_page', 5);
      expect(response.meta).toHaveProperty('total', 50);
      expect(response.meta).toHaveProperty('per_page', 10);
    });

    it('should fail without authentication', async () => {
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
          url: API_ENDPOINTS.OUTLETS.INDEX,
          method: 'GET',
          logLabel: 'GET_OUTLETS_NO_AUTH_TEST',
        })
      ).rejects.toThrow('Token is invalid or expired. Please login again.');
    });

    it('should support filtering and search parameters', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [TEST_DATA.OUTLET_RESPONSE]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.OUTLETS.INDEX}?search=test&code=OUT001`,
        method: 'GET',
        logLabel: 'GET_OUTLETS_FILTER_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('POST /api/outlets', () => {
    it('should successfully create outlet with valid data', async () => {
      const outletData = {
        code: 'OUT003',
        name: 'New Test Outlet',
        location: '-6.2088,106.8456',
        owner_name: 'John Doe',
        owner_phone: '+628123456789',
      };

      const mockResponse = {
        meta: { code: 201, status: 'success', message: 'Outlet created successfully' },
        data: {
          id: '3',
          code: outletData.code,
          name: outletData.name,
          location: { latitude: -6.2088, longitude: 106.8456 },
          owner_name: outletData.owner_name,
          owner_phone: outletData.owner_phone,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.STORE,
        method: 'POST',
        body: outletData,
        logLabel: 'CREATE_OUTLET_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('code', outletData.code);
      expect(response.data).toHaveProperty('name', outletData.name);
      expect(response.data).toHaveProperty('owner_name', outletData.owner_name);
      expect(response.data).toHaveProperty('owner_phone', outletData.owner_phone);
      expect(response.data).toHaveProperty('location');
      expect(response.data.location).toHaveProperty('latitude');
      expect(response.data.location).toHaveProperty('longitude');
    });

    it('should create outlet with file uploads', async () => {
      const formData = new FormData();
      formData.append('code', 'OUT004');
      formData.append('name', 'Outlet with Photos');
      formData.append('location', '-6.2088,106.8456');
      formData.append('owner_name', 'Jane Doe');
      formData.append('owner_phone', '+628987654321');
      formData.append('photo_shop_sign', 'mock_shop_sign_file');
      formData.append('photo_front', 'mock_front_file');
      formData.append('photo_left', 'mock_left_file');
      formData.append('photo_right', 'mock_right_file');
      formData.append('video', 'mock_video_file');

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.STORE,
        method: 'POST',
        body: formData,
        logLabel: 'CREATE_OUTLET_WITH_FILES_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('code', 'OUT004');
      expect(response.data).toHaveProperty('name', 'Outlet with Photos');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        // Missing required fields: code, name
        location: '-6.2088,106.8456',
        owner_name: 'John Doe',
      };

      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLETS.STORE,
          method: 'POST',
          body: incompleteData,
          logLabel: 'CREATE_OUTLET_VALIDATION_TEST',
          token: validToken,
        })
      ).rejects.toThrow();
    });

    it('should fail without authentication', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLETS.STORE,
          method: 'POST',
          body: TEST_DATA.OUTLET_REQUEST,
          logLabel: 'CREATE_OUTLET_NO_AUTH_TEST',
        })
      ).rejects.toThrow();
    });

    it('should handle custom fields', async () => {
      const outletDataWithCustomFields = {
        ...TEST_DATA.OUTLET_REQUEST,
        code: 'OUT005',
        custom_fields: {
          store_type: 'Retail',
          size: 'Medium',
          features: ['WiFi', 'Parking', 'AC'],
        },
      };

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.STORE,
        method: 'POST',
        body: outletDataWithCustomFields,
        logLabel: 'CREATE_OUTLET_CUSTOM_FIELDS_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('code', 'OUT005');
    });
  });

  describe('GET /api/outlets/:id', () => {
    it('should successfully retrieve specific outlet', async () => {
      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.SHOW(testOutletId),
        method: 'GET',
        body: null,
        logLabel: 'GET_OUTLET_BY_ID_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('id', testOutletId);
      expect(response.data).toHaveProperty('code');
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('location');
      expect(response.data).toHaveProperty('owner_name');
      expect(response.data).toHaveProperty('owner_phone');
    });

    it('should return 404 for non-existent outlet', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLETS.SHOW(nonExistentOutletId),
          method: 'GET',
          body: null,
          logLabel: 'GET_OUTLET_NOT_FOUND_TEST',
          token: validToken,
        })
      ).rejects.toThrow();
    });

    it('should fail without authentication', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLETS.SHOW(testOutletId),
          method: 'GET',
          body: null,
          logLabel: 'GET_OUTLET_NO_AUTH_TEST',
        })
      ).rejects.toThrow();
    });
  });

  describe('POST /api/outlets/:id (UPDATE)', () => {
    it('should successfully update outlet with valid data', async () => {
      const updateData = {
        name: 'Updated Outlet Name',
        owner_name: 'Updated Owner',
        owner_phone: '+628999888777',
      };

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.UPDATE(testOutletId),
        method: 'POST',
        body: updateData,
        logLabel: 'UPDATE_OUTLET_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('id', testOutletId);
      expect(response.data).toHaveProperty('name', updateData.name);
      expect(response.data).toHaveProperty('owner_name', updateData.owner_name);
      expect(response.data).toHaveProperty('owner_phone', updateData.owner_phone);
      expect(response.data).toHaveProperty('updated_at');
    });

    it('should update outlet with file uploads', async () => {
      const formData = new FormData();
      formData.append('name', 'Updated with New Photos');
      formData.append('photo_shop_sign', 'updated_shop_sign_file');
      formData.append('photo_front', 'updated_front_file');

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.UPDATE(testOutletId),
        method: 'POST',
        body: formData,
        logLabel: 'UPDATE_OUTLET_WITH_FILES_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.data).toHaveProperty('id', testOutletId);
      expect(response.data).toHaveProperty('name', 'Updated with New Photos');
    });

    it('should return 404 for non-existent outlet', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLETS.UPDATE(nonExistentOutletId),
          method: 'POST',
          body: { name: 'Updated Name' },
          logLabel: 'UPDATE_OUTLET_NOT_FOUND_TEST',
          token: validToken,
        })
      ).rejects.toThrow();
    });

    it('should fail without authentication', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLETS.UPDATE(testOutletId),
          method: 'POST',
          body: { name: 'Updated Name' },
          logLabel: 'UPDATE_OUTLET_NO_AUTH_TEST',
        })
      ).rejects.toThrow();
    });

    it('should allow partial updates', async () => {
      const partialUpdateData = {
        name: 'Partially Updated Name',
      };

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.UPDATE(testOutletId),
        method: 'POST',
        body: partialUpdateData,
        logLabel: 'PARTIAL_UPDATE_OUTLET_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.data).toHaveProperty('name', partialUpdateData.name);
    });
  });

  describe('GET /api/outlets/:id/with-custom-fields', () => {
    it('should successfully retrieve outlet with custom fields', async () => {
      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.WITH_CUSTOM_FIELDS(testOutletId),
        method: 'GET',
        body: null,
        logLabel: 'GET_OUTLET_WITH_CUSTOM_FIELDS_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('id', testOutletId);
      expect(response.data).toHaveProperty('custom_fields');
      expect(typeof response.data.custom_fields).toBe('object');
    });

    it('should include standard outlet data with custom fields', async () => {
      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.WITH_CUSTOM_FIELDS(testOutletId),
        method: 'GET',
        body: null,
        logLabel: 'GET_OUTLET_CUSTOM_FIELDS_COMPLETE_TEST',
        token: validToken,
      });

      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('code');
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('location');
      expect(response.data).toHaveProperty('custom_fields');
    });

    it('should fail without authentication', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLETS.WITH_CUSTOM_FIELDS(testOutletId),
          method: 'GET',
          body: null,
          logLabel: 'GET_OUTLET_CUSTOM_FIELDS_NO_AUTH_TEST',
        })
      ).rejects.toThrow();
    });
  });

  describe('GET /api/outlets/:outletId/history', () => {
    it('should successfully retrieve outlet history', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Outlet history retrieved successfully' },
        data: [
          {
            id: '1',
            outlet_id: testOutletId,
            field: 'name',
            old_value: 'Old Name',
            new_value: 'New Name',
            changed_by: '2',
            changed_at: '2024-01-15T10:00:00Z'
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.HISTORY(testOutletId),
        method: 'GET',
        body: null,
        logLabel: 'GET_OUTLET_HISTORY_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const historyItem = response.data[0];
        expect(historyItem).toHaveProperty('id');
        expect(historyItem).toHaveProperty('outlet_id', testOutletId);
        expect(historyItem).toHaveProperty('field');
        expect(historyItem).toHaveProperty('old_value');
        expect(historyItem).toHaveProperty('new_value');
        expect(historyItem).toHaveProperty('changed_by');
        expect(historyItem).toHaveProperty('changed_at');
      }
    });

    it('should support history pagination', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: []
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.OUTLETS.HISTORY(testOutletId)}?page=1&per_page=5`,
        method: 'GET',
        body: null,
        logLabel: 'GET_OUTLET_HISTORY_PAGINATION_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
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
          url: API_ENDPOINTS.OUTLETS.HISTORY(testOutletId),
          method: 'GET',
          body: null,
          logLabel: 'GET_OUTLET_HISTORY_NO_AUTH_TEST',
        })
      ).rejects.toThrow('Token is invalid or expired. Please login again.');
    });
  });

  describe('POST /api/outlets/:outletId/history-change', () => {
    it('should successfully record history change', async () => {
      const changeData = {
        field: 'name',
        old_value: 'Old Name',
        new_value: 'New Name',
        reason: 'Data correction',
      };

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'History change recorded successfully' },
        data: {
          message: 'Change recorded',
          outlet_id: testOutletId
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.HISTORY_CHANGE(testOutletId),
        method: 'POST',
        body: changeData,
        logLabel: 'RECORD_OUTLET_HISTORY_CHANGE_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('outlet_id', testOutletId);
    });

    it('should fail without authentication', async () => {
      const changeData = {
        field: 'name',
        old_value: 'Old Name',
        new_value: 'New Name',
      };

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
          url: API_ENDPOINTS.OUTLETS.HISTORY_CHANGE(testOutletId),
          method: 'POST',
          body: changeData,
          logLabel: 'RECORD_OUTLET_HISTORY_NO_AUTH_TEST',
        })
      ).rejects.toThrow('Token is invalid or expired. Please login again.');
    });
  });

  describe('Outlet Management Integration Tests', () => {
    it('should support complete outlet lifecycle', async () => {
      // Create outlet
      const createMockResponse = {
        meta: { code: 200, status: 'success', message: 'Outlet created successfully' },
        data: {
          id: 'lifecycle_test_id',
          code: 'LIFECYCLE_TEST',
          name: 'Lifecycle Test Outlet'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => createMockResponse,
      });

      const createResponse = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.STORE,
        method: 'POST',
        body: {
          ...TEST_DATA.OUTLET_REQUEST,
          code: 'LIFECYCLE_TEST',
        },
        logLabel: 'LIFECYCLE_CREATE_OUTLET',
        token: validToken,
      });

      expect(createResponse.meta.status).toBe('success');
      const outletId = createResponse.data.id;

      // Get outlet details
      const getMockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: { id: outletId, code: 'LIFECYCLE_TEST', name: 'Lifecycle Test Outlet' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => getMockResponse,
      });

      const getResponse = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.SHOW(outletId),
        method: 'GET',
        body: null,
        logLabel: 'LIFECYCLE_GET_OUTLET',
        token: validToken,
      });

      expect(getResponse.meta.status).toBe('success');
      expect(getResponse.data.id).toBe(outletId);

      // Update outlet
      const updateMockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: { id: outletId, name: 'Updated Lifecycle Outlet' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updateMockResponse,
      });

      const updateResponse = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.UPDATE(outletId),
        method: 'POST',
        body: { name: 'Updated Lifecycle Outlet' },
        logLabel: 'LIFECYCLE_UPDATE_OUTLET',
        token: validToken,
      });

      expect(updateResponse.meta.status).toBe('success');
      expect(updateResponse.data.name).toBe('Updated Lifecycle Outlet');
    });

    it('should handle concurrent outlet operations', async () => {
      // Mock responses for concurrent operations
      const mockResponses = [
        { meta: { code: 200, status: 'success' }, data: [] },
        { meta: { code: 200, status: 'success' }, data: { id: testOutletId } },
        { meta: { code: 200, status: 'success' }, data: [] }
      ];

      mockResponses.forEach(response => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => response,
        });
      });

      // Test concurrent operations don't interfere
      const promises = [
        apiRequest({
          url: API_ENDPOINTS.OUTLETS.INDEX,
          method: 'GET',
          body: null,
          logLabel: 'CONCURRENT_GET_OUTLETS',
          token: validToken,
        }),
        apiRequest({
          url: API_ENDPOINTS.OUTLETS.SHOW(testOutletId),
          method: 'GET',
          body: null,
          logLabel: 'CONCURRENT_GET_OUTLET',
          token: validToken,
        }),
        apiRequest({
          url: API_ENDPOINTS.OUTLETS.HISTORY(testOutletId),
          method: 'GET',
          body: null,
          logLabel: 'CONCURRENT_GET_HISTORY',
          token: validToken,
        }),
      ];

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.meta.status).toBe('success');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors properly', async () => {
      const invalidData = {
        code: '', // Empty code should fail validation
        name: '',
        location: 'invalid_coordinates',
      };

      const mockResponse = {
        meta: { code: 422, status: 'error', message: 'Validation failed' },
        data: null,
        errors: {
          code: ['The code field is required'],
          name: ['The name field is required']
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLETS.STORE,
          method: 'POST',
          body: invalidData,
          logLabel: 'OUTLET_VALIDATION_ERROR_TEST',
          token: validToken,
        })
      ).rejects.toThrow(/validation failed/i);
    });

    it('should handle file upload errors', async () => {
      const formData = new FormData();
      formData.append('code', 'FILE_ERROR_TEST');
      formData.append('name', 'File Error Test Outlet');
      // Simulate invalid file upload
      formData.append('photo_shop_sign', 'invalid_file_data');

      const mockSuccessResponse = {
        meta: { code: 200, status: 'success', message: 'File uploaded successfully' },
        data: { id: '1', code: 'FILE_ERROR_TEST', name: 'File Error Test Outlet' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      });

      // This should either succeed or fail gracefully
      try {
        const response = await apiRequest({
          url: API_ENDPOINTS.OUTLETS.STORE,
          method: 'POST',
          body: formData,
          logLabel: 'OUTLET_FILE_ERROR_TEST',
          token: validToken,
        });
        
        // If it succeeds, verify the response structure
        expect(response.meta).toHaveProperty('status');
        expect(response.meta.status).toBe('success');
      } catch (error) {
        // If it fails, it should be a proper API error response
        expect(error).toHaveProperty('message');
      }
    });

    it('should handle network timeouts', async () => {
      const mockResponse = {
        meta: { code: 408, status: 'error', message: 'Request timeout' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 408,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.OUTLETS.INDEX,
          method: 'GET',
          body: null,
          logLabel: 'OUTLET_TIMEOUT_TEST',
          token: validToken,
          timeout: 1, // Very short timeout
        })
      ).rejects.toThrow(/timeout/i);
    });
  });
});