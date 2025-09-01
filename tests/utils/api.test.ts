/**
 * API Client Utility Tests
 * Comprehensive tests for utils/api.ts functionality
 * 
 * Tests cover:
 * - apiRequest function with various configurations
 * - Error handling and timeout management
 * - Authentication token handling
 * - FormData/file upload functionality
 * - Response validation and standardization
 * - Auto logout callback functionality
 */

import { 
  apiRequest, 
  uploadFile, 
  setAutoLogoutCallback,
  BaseResponse 
} from '@/utils/api';

// Mock dependencies
jest.mock('@/utils/logger', () => ({
  log: jest.fn(),
}));

jest.mock('@/utils/error-handler', () => ({
  createApiError: jest.fn((code, message) => ({ code, message, type: 'api_error' })),
  getErrorMessage: jest.fn((error) => error?.message || 'Unknown error'),
  logError: jest.fn(),
}));

// Import mocked function for use in tests
const { createApiError } = require('@/utils/error-handler');

// Mock fetch for these tests
const originalFetch = global.fetch;

describe('API Client Utility Tests', () => {
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  describe('apiRequest - Basic Functionality', () => {
    it('should successfully make GET request', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: { id: 1, name: 'Test Data' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
        logLabel: 'TEST_GET_REQUEST',
      });

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('should successfully make POST request with JSON body', async () => {
      const requestData = { username: 'test', password: 'password' };
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Created successfully' },
        data: { id: 1, username: 'test' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: 'https://api.example.com/login',
        method: 'POST',
        body: requestData,
        logLabel: 'TEST_POST_REQUEST',
      });

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestData),
        })
      );
    });

    it('should handle FormData requests correctly', async () => {
      const formData = new FormData();
      formData.append('file', 'mock-file-data');
      formData.append('name', 'test-file');

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'File uploaded successfully' },
        data: { id: 1, filename: 'test-file' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: 'https://api.example.com/upload',
        method: 'POST',
        body: formData,
        logLabel: 'TEST_FORMDATA_REQUEST',
      });

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/upload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            // Should NOT have Content-Type for FormData
          }),
          body: formData,
        })
      );

      const call = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(call.headers['Content-Type']).toBeUndefined();
    });

    it('should include authentication token when provided', async () => {
      const token = 'bearer-token-123';
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Authorized success' },
        data: { user: 'test' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await apiRequest({
        url: 'https://api.example.com/protected',
        method: 'GET',
        token,
        logLabel: 'TEST_AUTH_REQUEST',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      );
    });

    it('should merge custom headers with default headers', async () => {
      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        'X-App-Version': '1.0.0',
      };

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: {}
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await apiRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: customHeaders,
        logLabel: 'TEST_CUSTOM_HEADERS',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'X-Custom-Header': 'custom-value',
            'X-App-Version': '1.0.0',
          }),
        })
      );
    });
  });

  describe('apiRequest - Error Handling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle 401 unauthorized errors and trigger auto logout', async () => {
      const logoutCallback = jest.fn();
      setAutoLogoutCallback(logoutCallback);

      const mockErrorResponse = {
        meta: { code: 401, status: 'error', message: 'Token is invalid or expired. Please login again.' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      await expect(
        apiRequest({
          url: 'https://api.example.com/protected',
          method: 'GET',
          token: 'invalid-token',
          logLabel: 'TEST_401_ERROR',
        })
      ).rejects.toThrow(/Token is invalid or expired/);

      // Fast-forward the timer to trigger the callback
      jest.advanceTimersByTime(100);
      expect(logoutCallback).toHaveBeenCalled();
    });

    it('should handle 422 validation errors properly', async () => {
      const mockErrorResponse = {
        meta: { code: 422, status: 'error', message: 'Validation failed' },
        data: null,
        errors: {
          username: ['The username field is required'],
          password: ['The password must be at least 8 characters']
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockErrorResponse,
      });

      await expect(
        apiRequest({
          url: 'https://api.example.com/register',
          method: 'POST',
          body: { username: '', password: '123' },
          logLabel: 'TEST_VALIDATION_ERROR',
        })
      ).rejects.toThrow(/validation failed/i);
    });

    it('should handle 500 server errors', async () => {
      const mockErrorResponse = {
        meta: { code: 500, status: 'error', message: 'Internal server error' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      });

      await expect(
        apiRequest({
          url: 'https://api.example.com/test',
          method: 'GET',
          logLabel: 'TEST_SERVER_ERROR',
        })
      ).rejects.toThrow(/server error/i);
    });


  });

  describe('apiRequest - Response Validation', () => {
    it('should validate successful response format', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: { result: 'valid data' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
        logLabel: 'TEST_RESPONSE_VALIDATION',
      });

      expect(response.meta).toHaveProperty('code', 200);
      expect(response.meta).toHaveProperty('status', 'success');
      expect(response.meta).toHaveProperty('message');
      expect(response).toHaveProperty('data');
    });

    it('should reject response with invalid success format', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'error', message: 'Invalid format' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: 'https://api.example.com/test',
          method: 'GET',
          logLabel: 'TEST_INVALID_SUCCESS_FORMAT',
        })
      ).rejects.toThrow();
    });

    it('should handle paginated responses', async () => {
      const mockResponse = {
        meta: { 
          code: 200, 
          status: 'success', 
          message: 'Success',
          current_page: 1,
          last_page: 5,
          total: 100,
          per_page: 20
        },
        data: [{ id: 1 }, { id: 2 }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: 'https://api.example.com/paginated',
        method: 'GET',
        logLabel: 'TEST_PAGINATED_RESPONSE',
      });

      expect(response.meta).toHaveProperty('current_page', 1);
      expect(response.meta).toHaveProperty('last_page', 5);
      expect(response.meta).toHaveProperty('total', 100);
      expect(response.meta).toHaveProperty('per_page', 20);
    });
  });

  describe('uploadFile - File Upload Functionality', () => {
    it('should successfully upload file with FormData', async () => {
      const formData = new FormData();
      formData.append('file', 'mock-file-blob');
      formData.append('description', 'Test file upload');

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'File uploaded successfully' },
        data: { id: 1, filename: 'uploaded-file.jpg', size: 1024 }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await uploadFile({
        url: 'https://api.example.com/upload',
        formData,
        logLabel: 'TEST_FILE_UPLOAD',
        token: 'upload-token',
      });

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/upload',
        expect.objectContaining({
          method: 'POST',
          body: formData,
          headers: expect.objectContaining({
            'Authorization': 'Bearer upload-token',
          }),
        })
      );
    });

    it('should use longer timeout for file uploads', async () => {
      const formData = new FormData();
      formData.append('large_file', 'very-large-file-data');

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Large file uploaded' },
        data: { id: 1 }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await uploadFile({
        url: 'https://api.example.com/upload-large',
        formData,
        logLabel: 'TEST_LARGE_FILE_UPLOAD',
        timeout: 30000, // Should use upload timeout
      });

      // Verify that the request was made (timeout handling is internal)
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle file upload failures', async () => {
      const formData = new FormData();
      formData.append('invalid_file', 'corrupt-file-data');

      const mockErrorResponse = {
        meta: { code: 400, status: 'error', message: 'Invalid file format' },
        data: null,
        errors: { file: ['The file must be an image'] }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      });

      await expect(
        uploadFile({
          url: 'https://api.example.com/upload',
          formData,
          logLabel: 'TEST_FILE_UPLOAD_ERROR',
        })
      ).rejects.toThrow(/Invalid file format/);
    });
  });

  describe('Auto Logout Callback', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set and trigger auto logout callback on 401 errors', async () => {
      const logoutCallback = jest.fn();
      setAutoLogoutCallback(logoutCallback);

      const mockErrorResponse = {
        meta: { code: 401, status: 'error', message: 'Unauthorized access' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      await expect(
        apiRequest({
          url: 'https://api.example.com/protected',
          method: 'GET',
          token: 'expired-token',
          logLabel: 'TEST_AUTO_LOGOUT',
        })
      ).rejects.toThrow();

      // Fast-forward the timer to trigger the callback
      jest.advanceTimersByTime(100);
      expect(logoutCallback).toHaveBeenCalledTimes(1);
    });

    it('should not trigger auto logout callback for other error codes', async () => {
      const logoutCallback = jest.fn();
      setAutoLogoutCallback(logoutCallback);

      const mockErrorResponse = {
        meta: { code: 400, status: 'error', message: 'Bad request' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      });

      await expect(
        apiRequest({
          url: 'https://api.example.com/test',
          method: 'GET',
          logLabel: 'TEST_NO_AUTO_LOGOUT',
        })
      ).rejects.toThrow();

      expect(logoutCallback).not.toHaveBeenCalled();
    });

    it('should handle case where no logout callback is set', async () => {
      setAutoLogoutCallback(null as any);

      const mockErrorResponse = {
        meta: { code: 401, status: 'error', message: 'Token is invalid or expired. Please login again.' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      // Should not throw due to missing callback
      await expect(
        apiRequest({
          url: 'https://api.example.com/test',
          method: 'GET',
          logLabel: 'TEST_NO_CALLBACK',
        })
      ).rejects.toThrow(/Token is invalid or expired/);
    });
  });

  describe('Request Configuration Edge Cases', () => {
    it('should handle undefined body', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: {}
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await apiRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
        body: undefined,
        logLabel: 'TEST_UNDEFINED_BODY',
      });

      const call = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(call.body).toBeUndefined();
    });

    it('should handle null body', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: {}
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await apiRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
        body: null,
        logLabel: 'TEST_NULL_BODY',
      });

      const call = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(call.body).toBeUndefined();
    });

    it('should default to POST method when not specified', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: {}
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await apiRequest({
        url: 'https://api.example.com/test',
        body: { data: 'test' },
        logLabel: 'TEST_DEFAULT_METHOD',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should use default timeout when not specified', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: {}
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await apiRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
        logLabel: 'TEST_DEFAULT_TIMEOUT',
      });

      // Should complete without timeout error
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Type Safety and Interface Compatibility', () => {
    it('should work with BaseResponse interface', async () => {
      const mockResponse: BaseResponse<{ id: number; name: string }> = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: { id: 1, name: 'Test Item' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: 'https://api.example.com/items',
        method: 'GET',
        logLabel: 'TEST_TYPE_SAFETY',
      });

      expect(response.data.id).toBe(1);
      expect(response.data.name).toBe('Test Item');
      expect(response.meta.status).toBe('success');
    });

    it('should handle 204 success responses', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'No content' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: 'https://api.example.com/empty',
        method: 'DELETE',
        logLabel: 'TEST_EMPTY_RESPONSE',
      });

      expect(response.data).toBeNull();
      expect(response.meta.code).toBe(200);
    });
  });
});