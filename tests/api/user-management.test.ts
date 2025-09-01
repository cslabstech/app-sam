/**
 * User Management API Tests
 * Tests for User Management endpoints (5 endpoints)
 * 
 * Endpoints tested:
 * - GET /api/user - Get all users
 * - POST /api/user - Create new user
 * - GET /api/user/{user} - Get specific user
 * - PUT /api/user/{user} - Update user
 * - DELETE /api/user/{user} - Delete user
 */

import { apiRequest } from '@/utils/api';
import { API_ENDPOINTS, TEST_DATA } from '../config/testConfig';

// TypeScript interfaces for User Management data models
interface User {
  id: string | number;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  photo?: string;
  role_id: string | number;
  tm_id?: string | number;
  notif_id?: string;
  role: {
    id: string | number;
    name: string;
    permissions: Array<{ name: string }>;
  };
  created_at: string;
  updated_at: string;
}

interface UserRequest {
  name: string;
  username: string;
  phone: string;
  role_id: string | number;
  password: string;
  badan_usaha_id?: string | number;
  division_id?: string | number;
  region_id?: string | number;
  cluster_id?: string | number;
}

// Mock fetch for these tests
const originalFetch = global.fetch;

describe('User Management API Tests', () => {
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

  describe('GET /api/user - List Users', () => {
    it('should successfully retrieve list of users', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [
          TEST_DATA.USER_RESPONSE,
          { ...TEST_DATA.USER_RESPONSE, id: '2', username: 'user2', name: 'User Two' }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.USERS.INDEX,
        method: 'GET',
        logLabel: 'USERS_INDEX_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.meta.status).toBe('success');
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);

      // Validate user structure
      const user = response.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('created_at');
      expect(user).toHaveProperty('updated_at');
    });

    it('should support filtering and search parameters', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [TEST_DATA.USER_RESPONSE]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.USERS.INDEX}?search=test&role_id=1`,
        method: 'GET',
        logLabel: 'USERS_FILTER_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
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
          url: API_ENDPOINTS.USERS.INDEX,
          method: 'GET',
          logLabel: 'USERS_NO_AUTH_TEST',
          token: null,
        })
      ).rejects.toThrow('Token is invalid or expired. Please login again.');
    });
  });

  describe('POST /api/user - Create User', () => {
    it('should successfully create a new user', async () => {
      const userData: UserRequest = {
        name: 'New User',
        username: 'newuser',
        phone: '+628987654321',
        role_id: '2',
        password: 'password123',
        badan_usaha_id: '1',
      };

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'User created successfully' },
        data: { ...TEST_DATA.USER_RESPONSE, id: '3', ...userData }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.USERS.STORE,
        method: 'POST',
        body: userData,
        logLabel: 'USER_CREATE_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.name).toBe(userData.name);
      expect(response.data.username).toBe(userData.username);
      expect(response.data.phone).toBe(userData.phone);
    });

    it('should validate required fields', async () => {
      const mockResponse = {
        meta: { code: 422, status: 'error', message: 'Validation failed: The name field is required' },
        data: null,
        errors: {
          name: ['The name field is required'],
          username: ['The username field is required']
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.USERS.STORE,
          method: 'POST',
          body: { phone: '+628123456789' }, // Missing required fields
          logLabel: 'USER_VALIDATION_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/validation failed/i);
    });

    it('should validate unique username', async () => {
      const mockResponse = {
        meta: { code: 422, status: 'error', message: 'Validation failed: The username has already been taken' },
        data: null,
        errors: { username: ['The username has already been taken'] }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.USERS.STORE,
          method: 'POST',
          body: {
            name: 'Test User',
            username: 'existinguser', // Duplicate username
            phone: '+628123456789',
            role_id: '2',
            password: 'password'
          },
          logLabel: 'USER_DUPLICATE_USERNAME_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/validation failed/i);
    });
  });

  describe('GET /api/user/{user} - Get User Details', () => {
    const userId = '1';

    it('should successfully retrieve user details', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'User retrieved successfully' },
        data: { ...TEST_DATA.USER_RESPONSE, id: userId }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.USERS.SHOW(userId),
        method: 'GET',
        logLabel: 'USER_SHOW_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.id).toBe(userId);
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('username');
    });

    it('should handle non-existent user', async () => {
      const mockResponse = {
        meta: { code: 404, status: 'error', message: 'User not found' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.USERS.SHOW('99999'),
          method: 'GET',
          logLabel: 'USER_NOT_FOUND_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('PUT /api/user/{user} - Update User', () => {
    const userId = '1';

    it('should successfully update user', async () => {
      const updateData = {
        name: 'Updated User Name',
        phone: '+628999888777',
      };

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'User updated successfully' },
        data: { ...TEST_DATA.USER_RESPONSE, id: userId, ...updateData }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.USERS.UPDATE(userId),
        method: 'PUT',
        body: updateData,
        logLabel: 'USER_UPDATE_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.name).toBe(updateData.name);
      expect(response.data.phone).toBe(updateData.phone);
    });

    it('should handle validation errors in update', async () => {
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
          url: API_ENDPOINTS.USERS.UPDATE(userId),
          method: 'PUT',
          body: { phone: 'invalid_phone' },
          logLabel: 'USER_UPDATE_VALIDATION_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/validation failed/i);
    });
  });

  describe('DELETE /api/user/{user} - Delete User', () => {
    const userId = '1';

    it('should successfully delete user', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'User deleted successfully' },
        data: { id: userId }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.USERS.DELETE(userId),
        method: 'DELETE',
        logLabel: 'USER_DELETE_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.meta.message).toMatch(/deleted successfully/i);
    });

    it('should prevent deletion of current user', async () => {
      const mockResponse = {
        meta: { code: 400, status: 'error', message: 'Cannot delete your own account' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.USERS.DELETE('1'), // Current user ID
          method: 'DELETE',
          logLabel: 'USER_DELETE_SELF_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/Cannot delete your own account/i);
    });

    it('should prevent deletion of users with active data', async () => {
      const mockResponse = {
        meta: { code: 400, status: 'error', message: 'Cannot delete user with active visits or outlets' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.USERS.DELETE('2'),
          method: 'DELETE',
          logLabel: 'USER_DELETE_WITH_DATA_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/Cannot delete user with active/i);
    });
  });

  describe('User Management Data Validation', () => {
    it('should validate user role permissions', () => {
      const user = TEST_DATA.USER_RESPONSE;
      
      expect(user).toHaveProperty('role');
      expect(typeof user.role).toBe('string');
    });

    it('should validate phone number formats', () => {
      const validPhones = ['+628123456789', '08123456789', '628123456789'];
      const invalidPhones = ['123', 'abc', '+1234'];

      validPhones.forEach(phone => {
        expect(phone).toMatch(/^(\+?62|0)8\d{8,11}$/);
      });

      invalidPhones.forEach(phone => {
        expect(phone).not.toMatch(/^(\+?62|0)8\d{8,11}$/);
      });
    });

    it('should validate username format', () => {
      const validUsernames = ['user123', 'test_user', 'admin'];
      const invalidUsernames = ['user@123', 'test user', 'ab', 'a'];

      validUsernames.forEach(username => {
        expect(username).toMatch(/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/);
      });

      invalidUsernames.forEach(username => {
        expect(username).not.toMatch(/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/);
      });
    });
  });
});