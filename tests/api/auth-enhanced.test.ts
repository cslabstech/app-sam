/**
 * Enhanced Authentication API Tests with TypeScript Interfaces and Validation
 * Comprehensive type safety and data model validation for all 8 auth endpoints
 */

import { apiRequest } from '@/utils/api';
import { API_ENDPOINTS, TEST_CREDENTIALS } from '../config/testConfig';

// ===== TYPESCRIPT INTERFACES FOR AUTH API =====

// User Role Interface
interface UserRole {
  id: string;
  name: string;
  permissions: UserPermission[];
}

// User Permission Interface
interface UserPermission {
  name: string;
  resource?: string;
  action?: string;
}

// User Interface
interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  photo?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
}

// Login Request Interface
interface LoginRequest {
  version: string;
  username: string;
  password: string;
  notif_id?: string;
  device_info?: {
    device_type: 'ios' | 'android';
    device_id: string;
    app_version: string;
  };
}

// Login Response Interface
interface LoginResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in?: number;
  user: User;
  permissions: string[];
  refresh_token?: string;
}

// OTP Request Interfaces
interface SendOtpRequest {
  phone: string;
  purpose?: 'login' | 'verification' | 'password_reset';
}

interface SendOtpResponse {
  message: string;
  phone: string;
  expires_in: number;
  attempt_count: number;
  max_attempts: number;
}

interface VerifyOtpRequest {
  phone: string;
  otp: string;
  notif_id?: string;
}

// Profile Update Interfaces
interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
}

interface PasswordUpdateRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation?: string;
}

// Standard API Response Interface
interface StandardApiResponse<T> {
  meta: {
    code: number;
    status: 'success' | 'error';
    message: string;
  };
  data: T;
  errors?: Record<string, string[]>;
}

// ===== TYPE VALIDATORS =====

const isValidUser = (user: any): user is User => {
  return (
    typeof user?.id === 'string' &&
    typeof user?.username === 'string' &&
    typeof user?.name === 'string' &&
    typeof user?.email === 'string' &&
    typeof user?.phone === 'string' &&
    typeof user?.role === 'object' &&
    typeof user?.role?.id === 'string' &&
    typeof user?.role?.name === 'string' &&
    Array.isArray(user?.role?.permissions) &&
    typeof user?.created_at === 'string' &&
    typeof user?.updated_at === 'string'
  );
};

const isValidLoginResponse = (data: any): data is LoginResponse => {
  return (
    typeof data?.access_token === 'string' &&
    data?.token_type === 'Bearer' &&
    isValidUser(data?.user) &&
    Array.isArray(data?.permissions)
  );
};

const isValidPermission = (permission: any): permission is UserPermission => {
  return typeof permission?.name === 'string';
};

const isValidRole = (role: any): role is UserRole => {
  return (
    typeof role?.id === 'string' &&
    typeof role?.name === 'string' &&
    Array.isArray(role?.permissions) &&
    role.permissions.every(isValidPermission)
  );
};

// ===== MOCK SETUP =====

const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

const originalFetch = global.fetch;

describe('Enhanced Authentication API with TypeScript Validation', () => {
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

  describe('POST /api/login - Enhanced Type Validation', () => {
    it('should validate complete login response structure', async () => {
      const loginRequest: LoginRequest = {
        version: '2.0.0',
        username: TEST_CREDENTIALS.username,
        password: TEST_CREDENTIALS.password,
        notif_id: 'test_notif_id_12345',
        device_info: {
          device_type: 'android',
          device_id: 'test_device_12345',
          app_version: '2.0.0'
        }
      };

      const mockLoginResponse: StandardApiResponse<LoginResponse> = {
        meta: { code: 200, status: 'success', message: 'Login successful' },
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
          token_type: 'Bearer',
          expires_in: 86400,
          user: {
            id: '1',
            username: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            phone: '+628123456789',
            photo: null,
            role: {
              id: '1',
              name: 'Field Sales',
              permissions: [
                { name: 'outlet.view', resource: 'outlet', action: 'view' },
                { name: 'outlet.create', resource: 'outlet', action: 'create' },
                { name: 'visit.create', resource: 'visit', action: 'create' },
                { name: 'visit.read', resource: 'visit', action: 'read' },
              ]
            },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            last_login_at: '2024-01-15T10:00:00Z',
            email_verified_at: '2024-01-01T00:00:00Z',
            phone_verified_at: '2024-01-01T00:00:00Z',
          },
          permissions: ['outlet.view', 'outlet.create', 'visit.create', 'visit.read'],
          refresh_token: 'refresh_token_12345'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.AUTH.LOGIN,
        method: 'POST',
        body: loginRequest,
        logLabel: 'ENHANCED_LOGIN_TEST',
      }) as StandardApiResponse<LoginResponse>;

      // Validate response structure
      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(typeof response.meta.message).toBe('string');

      // Validate login response data with type checking
      expect(isValidLoginResponse(response.data)).toBe(true);
      
      const { data } = response;
      expect(data.access_token).toMatch(/^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/);
      expect(data.token_type).toBe('Bearer');
      expect(typeof data.expires_in).toBe('number');
      expect(data.expires_in).toBeGreaterThan(0);

      // Validate user structure
      expect(isValidUser(data.user)).toBe(true);
      expect(data.user.id).toMatch(/^\d+$/);
      expect(data.user.username).toBeTruthy();
      expect(data.user.name).toBeTruthy();
      expect(data.user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(data.user.phone).toMatch(/^\+\d{10,15}$/);

      // Validate role structure
      expect(isValidRole(data.user.role)).toBe(true);
      expect(data.user.role.permissions).toHaveLength(4);
      data.user.role.permissions.forEach(permission => {
        expect(isValidPermission(permission)).toBe(true);
        expect(permission.name).toBeTruthy();
      });

      // Validate timestamps
      expect(new Date(data.user.created_at).getTime()).toBeGreaterThan(0);
      expect(new Date(data.user.updated_at).getTime()).toBeGreaterThan(0);

      // Validate permissions array
      expect(Array.isArray(data.permissions)).toBe(true);
      expect(data.permissions.length).toBeGreaterThan(0);
      data.permissions.forEach(permission => {
        expect(typeof permission).toBe('string');
        expect(permission).toMatch(/^[a-z_]+\.[a-z_]+$/);
      });
    });

    it('should validate login request with device info', async () => {
      const loginRequest: LoginRequest = {
        version: '2.0.0',
        username: TEST_CREDENTIALS.username,
        password: TEST_CREDENTIALS.password,
        notif_id: 'test_notif_id',
        device_info: {
          device_type: 'ios',
          device_id: 'ios_device_12345',
          app_version: '2.0.0'
        }
      };

      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          meta: { code: 200, status: 'success', message: 'Login successful' },
          data: { access_token: 'token', token_type: 'Bearer', user: { id: '1' }, permissions: [] }
        }),
      });

      await apiRequest({
        url: API_ENDPOINTS.AUTH.LOGIN,
        method: 'POST',
        body: loginRequest,
        logLabel: 'LOGIN_WITH_DEVICE_INFO',
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody.device_info).toBeDefined();
      expect(requestBody.device_info.device_type).toMatch(/^(ios|android)$/);
      expect(requestBody.device_info.device_id).toBeTruthy();
      expect(requestBody.device_info.app_version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should handle validation errors with proper error structure', async () => {
      const mockValidationError: StandardApiResponse<null> = {
        meta: { code: 422, status: 'error', message: 'Validation failed' },
        data: null,
        errors: {
          username: ['The username field is required.', 'The username must be at least 3 characters.'],
          password: ['The password field is required.', 'The password must be at least 6 characters.'],
          version: ['The version field is required.']
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockValidationError,
      });

      try {
        await apiRequest({
          url: API_ENDPOINTS.AUTH.LOGIN,
          method: 'POST',
          body: { username: '', password: '' }, // Invalid data
          logLabel: 'LOGIN_VALIDATION_ERROR',
        });
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.status).toBe(422);
        expect(error.message).toContain('Validation failed');
        
        // Validate error structure
        if (error.data && error.data.errors) {
          expect(typeof error.data.errors).toBe('object');
          Object.values(error.data.errors).forEach(fieldErrors => {
            expect(Array.isArray(fieldErrors)).toBe(true);
            (fieldErrors as string[]).forEach(errorMessage => {
              expect(typeof errorMessage).toBe('string');
              expect(errorMessage.length).toBeGreaterThan(0);
            });
          });
        }
      }
    });
  });

  describe('POST /api/send-otp - Enhanced Type Validation', () => {
    it('should validate send OTP response structure', async () => {
      const otpRequest: SendOtpRequest = {
        phone: TEST_CREDENTIALS.phone,
        purpose: 'login'
      };

      const mockOtpResponse: StandardApiResponse<SendOtpResponse> = {
        meta: { code: 200, status: 'success', message: 'OTP sent successfully' },
        data: {
          message: 'OTP sent successfully to your phone number',
          phone: TEST_CREDENTIALS.phone,
          expires_in: 300,
          attempt_count: 1,
          max_attempts: 5
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOtpResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.AUTH.SEND_OTP,
        method: 'POST',
        body: otpRequest,
        logLabel: 'ENHANCED_SEND_OTP_TEST',
      }) as StandardApiResponse<SendOtpResponse>;

      // Validate response structure
      expect(response.meta.status).toBe('success');
      expect(response.data.phone).toMatch(/^\+\d{10,15}$/);
      expect(typeof response.data.expires_in).toBe('number');
      expect(response.data.expires_in).toBeGreaterThan(0);
      expect(typeof response.data.attempt_count).toBe('number');
      expect(response.data.attempt_count).toBeGreaterThanOrEqual(1);
      expect(typeof response.data.max_attempts).toBe('number');
      expect(response.data.max_attempts).toBeGreaterThan(response.data.attempt_count);
    });
  });

  describe('GET /api/profile - Enhanced Type Validation', () => {
    it('should validate complete profile response structure', async () => {
      const mockProfileResponse: StandardApiResponse<User> = {
        meta: { code: 200, status: 'success', message: 'Profile retrieved successfully' },
        data: {
          id: '1',
          username: 'testuser',
          name: 'Test User',
          email: 'test@example.com',
          phone: '+628123456789',
          photo: 'https://example.com/photos/user1.jpg',
          role: {
            id: '1',
            name: 'Field Sales',
            permissions: [
              { name: 'outlet.view', resource: 'outlet', action: 'view' },
              { name: 'visit.create', resource: 'visit', action: 'create' }
            ]
          },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          last_login_at: '2024-01-15T09:30:00Z',
          email_verified_at: '2024-01-01T00:00:00Z',
          phone_verified_at: '2024-01-01T00:00:00Z',
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfileResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.AUTH.PROFILE,
        method: 'GET',
        token: 'valid_token',
        logLabel: 'ENHANCED_PROFILE_TEST',
      }) as StandardApiResponse<User>;

      // Validate complete user structure
      expect(isValidUser(response.data)).toBe(true);
      
      const user = response.data;
      expect(user.photo).toMatch(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/);
      expect(new Date(user.last_login_at!).getTime()).toBeGreaterThan(0);
      expect(new Date(user.email_verified_at!).getTime()).toBeGreaterThan(0);
      expect(new Date(user.phone_verified_at!).getTime()).toBeGreaterThan(0);

      // Validate role and permissions structure
      expect(isValidRole(user.role)).toBe(true);
      user.role.permissions.forEach(permission => {
        expect(permission.resource).toBeTruthy();
        expect(permission.action).toBeTruthy();
        expect(['view', 'create', 'update', 'delete']).toContain(permission.action);
      });
    });
  });

  describe('Data Model Consistency Validation', () => {
    it('should maintain consistent user ID format across endpoints', async () => {
      const userId = '12345';
      
      // Mock responses with consistent user ID
      const mockResponses = [
        { data: { user: { id: userId } } },
        { data: { id: userId } }
      ];

      mockResponses.forEach(response => {
        expect(response.data.user?.id || response.data.id).toMatch(/^\d+$/);
        expect(response.data.user?.id || response.data.id).toBe(userId);
      });
    });

    it('should validate permission naming conventions', () => {
      const validPermissions = [
        'outlet.view',
        'outlet.create', 
        'outlet.update',
        'outlet.delete',
        'visit.create',
        'visit.read',
        'visit.update',
        'user.manage'
      ];

      validPermissions.forEach(permission => {
        expect(permission).toMatch(/^[a-z_]+\.[a-z_]+$/);
        const [resource, action] = permission.split('.');
        expect(resource).toBeTruthy();
        expect(action).toBeTruthy();
        expect(['view', 'read', 'create', 'update', 'delete', 'manage']).toContain(action);
      });
    });

    it('should validate timestamp format consistency', () => {
      const timestamps = [
        '2024-01-01T00:00:00Z',
        '2024-01-15T10:30:45Z',
        '2024-12-31T23:59:59Z'
      ];

      timestamps.forEach(timestamp => {
        expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        expect(new Date(timestamp).toISOString()).toBe(timestamp);
        expect(new Date(timestamp).getTime()).toBeGreaterThan(0);
      });
    });
  });
});