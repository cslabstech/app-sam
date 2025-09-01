/**
 * Authentication API Endpoints Test Suite
 * Testing 8 authentication endpoints with comprehensive scenarios
 * 
 * Endpoints tested:
 * - POST /api/login - User login with credentials
 * - POST /api/logout - User logout 
 * - POST /api/send-otp - Send OTP to phone
 * - POST /api/verify-otp - Verify OTP and login
 * - GET /api/profile - Get user profile
 * - POST /api/profile/password - Update password
 * - POST /api/profile/photo - Update profile photo
 * - POST /api/profile/update - Update profile information
 */

import { apiRequest } from '@/utils/api';
import { 
  API_ENDPOINTS, 
  TEST_DATA, 
  TEST_CREDENTIALS
} from '../config/testConfig';

// Mock AsyncStorage for token storage tests
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock fetch for these tests
const originalFetch = global.fetch;

describe('Authentication API Endpoints', () => {
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(null);
    mockAsyncStorage.removeItem.mockResolvedValue(null);
  });

  describe('POST /api/login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginData = {
        version: '2.0.0',
        username: TEST_CREDENTIALS.username,
        password: TEST_CREDENTIALS.password,
        notif_id: 'test_notif_id',
      };

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Login successful' },
        data: TEST_DATA.LOGIN_RESPONSE
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.AUTH.LOGIN,
        method: 'POST',
        body: loginData,
        logLabel: 'LOGIN_TEST',
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('token_type', 'Bearer');
      expect(response.data).toHaveProperty('user');
      
      const user = response.data.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('role');
    });

    it('should fail login with invalid credentials', async () => {
      const mockResponse = {
        meta: { code: 401, status: 'error', message: 'Invalid credentials' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.AUTH.LOGIN,
          method: 'POST',
          body: { username: 'invalid', password: 'invalid' },
          logLabel: 'LOGIN_INVALID_TEST',
        })
      ).rejects.toThrow(/Invalid credentials|Token is invalid/);
    });

    it('should validate required fields', async () => {
      const mockResponse = {
        meta: { code: 422, status: 'error', message: 'Validation failed: The username field is required' },
        data: null,
        errors: { username: ['The username field is required'] }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.AUTH.LOGIN,
          method: 'POST',
          body: { password: 'password' }, // Missing username
          logLabel: 'LOGIN_VALIDATION_TEST',
        })
      ).rejects.toThrow(/validation failed/i);
    });
  });

  describe('POST /api/logout', () => {
    const validToken = 'valid_bearer_token';

    it('should successfully logout with valid token', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Logged out successfully' },
        data: { message: 'Logged out successfully' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.AUTH.LOGOUT,
        method: 'POST',
        logLabel: 'LOGOUT_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('message');
    });

    it('should fail logout without token', async () => {
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
          url: API_ENDPOINTS.AUTH.LOGOUT,
          method: 'POST',
          logLabel: 'LOGOUT_NO_TOKEN_TEST',
        })
      ).rejects.toThrow('Token is invalid or expired. Please login again.');
    });
  });

  describe('POST /api/send-otp', () => {
    it('should successfully send OTP to valid phone number', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'OTP sent successfully' },
        data: {
          message: 'OTP sent successfully',
          phone: TEST_CREDENTIALS.phone
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.AUTH.SEND_OTP,
        method: 'POST',
        body: { phone: TEST_CREDENTIALS.phone },
        logLabel: 'SEND_OTP_TEST',
      });

      expect(response.meta.status).toBe('success');
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('phone', TEST_CREDENTIALS.phone);
    });

    it('should validate phone number format', async () => {
      const mockResponse = {
        meta: { code: 422, status: 'error', message: 'Validation failed: The phone format is invalid' },
        data: null,
        errors: { phone: ['The phone format is invalid'] }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.AUTH.SEND_OTP,
          method: 'POST',
          body: { phone: 'invalid_phone' },
          logLabel: 'SEND_OTP_INVALID_TEST',
        })
      ).rejects.toThrow(/validation failed/i);
    });
  });

  describe('POST /api/verify-otp', () => {
    it('should successfully verify valid OTP', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'OTP verified successfully' },
        data: TEST_DATA.LOGIN_RESPONSE
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.AUTH.VERIFY_OTP,
        method: 'POST',
        body: {
          phone: TEST_CREDENTIALS.phone,
          otp: TEST_CREDENTIALS.otp,
          notif_id: 'test_notif_id',
        },
        logLabel: 'VERIFY_OTP_TEST',
      });

      expect(response.meta.status).toBe('success');
      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('user');
    });

    it('should fail with invalid OTP', async () => {
      const mockResponse = {
        meta: { code: 422, status: 'error', message: 'Invalid OTP' },
        data: null,
        errors: { otp: ['The OTP is invalid'] }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.AUTH.VERIFY_OTP,
          method: 'POST',
          body: {
            phone: TEST_CREDENTIALS.phone,
            otp: '000000', // Invalid OTP
          },
          logLabel: 'VERIFY_OTP_INVALID_TEST',
        })
      ).rejects.toThrow(/Invalid OTP/i);
    });
  });

  describe('GET /api/profile', () => {
    const validToken = 'valid_bearer_token';

    it('should successfully get user profile', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Profile retrieved successfully' },
        data: TEST_DATA.LOGIN_RESPONSE.user
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.AUTH.PROFILE,
        method: 'GET',
        logLabel: 'GET_PROFILE_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('username');
      expect(response.data).toHaveProperty('name');
    });

    it('should fail without authentication token', async () => {
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
          url: API_ENDPOINTS.AUTH.PROFILE,
          method: 'GET',
          logLabel: 'GET_PROFILE_NO_TOKEN_TEST',
        })
      ).rejects.toThrow('Token is invalid or expired. Please login again.');
    });
  });

  describe('POST /api/profile/password', () => {
    const validToken = 'valid_bearer_token';

    it('should successfully update password', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Password updated successfully' },
        data: { message: 'Password updated successfully' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.AUTH.UPDATE_PASSWORD,
        method: 'POST',
        body: {
          current_password: 'current_password',
          new_password: 'new_password123',
        },
        logLabel: 'UPDATE_PASSWORD_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.data).toHaveProperty('message');
    });

    it('should validate required password fields', async () => {
      const mockResponse = {
        meta: { code: 422, status: 'error', message: 'Validation failed: The current password field is required' },
        data: null,
        errors: { current_password: ['The current password field is required'] }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.AUTH.UPDATE_PASSWORD,
          method: 'POST',
          body: { new_password: 'new_password' }, // Missing current_password
          logLabel: 'UPDATE_PASSWORD_VALIDATION_TEST',
          token: validToken,
        })
      ).rejects.toThrow(/validation failed/i);
    });
  });

  describe('POST /api/profile/photo', () => {
    const validToken = 'valid_bearer_token';

    it('should successfully update profile photo', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Photo updated successfully' },
        data: {
          ...TEST_DATA.LOGIN_RESPONSE.user,
          photo: 'https://example.com/updated-photo.jpg'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const formData = new FormData();
      formData.append('photo', 'mock_photo_data');

      const response = await apiRequest({
        url: API_ENDPOINTS.AUTH.UPDATE_PHOTO,
        method: 'POST',
        body: formData,
        logLabel: 'UPDATE_PHOTO_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.data).toHaveProperty('photo');
    });
  });

  describe('POST /api/profile/update', () => {
    const validToken = 'valid_bearer_token';

    it('should successfully update profile information', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Profile updated successfully' },
        data: {
          ...TEST_DATA.LOGIN_RESPONSE.user,
          ...updateData
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.AUTH.UPDATE_PROFILE,
        method: 'POST',
        body: updateData,
        logLabel: 'UPDATE_PROFILE_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.data).toHaveProperty('name', updateData.name);
      expect(response.data).toHaveProperty('email', updateData.email);
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should support complete login-logout flow', async () => {
      // Mock login response
      const loginMockResponse = {
        meta: { code: 200, status: 'success', message: 'Login successful' },
        data: TEST_DATA.LOGIN_RESPONSE
      };

      // Mock logout response
      const logoutMockResponse = {
        meta: { code: 200, status: 'success', message: 'Logged out successfully' },
        data: { message: 'Logged out successfully' }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => loginMockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => logoutMockResponse,
        });

      // Step 1: Login
      const loginResponse = await apiRequest({
        url: API_ENDPOINTS.AUTH.LOGIN,
        method: 'POST',
        body: TEST_DATA.LOGIN_REQUEST,
        logLabel: 'INTEGRATION_LOGIN',
      });

      expect(loginResponse.meta.status).toBe('success');
      const token = loginResponse.data.access_token;

      // Step 2: Logout
      const logoutResponse = await apiRequest({
        url: API_ENDPOINTS.AUTH.LOGOUT,
        method: 'POST',
        logLabel: 'INTEGRATION_LOGOUT',
        token,
      });

      expect(logoutResponse.meta.status).toBe('success');
    });
  });
});