/**
 * Test Configuration for SAM Mobile App Backend API Integration
 * Base URL: https://sam.rizqis.com
 * Total Endpoints: 46
 */

export const TEST_CONFIG = {
  BASE_URL: 'https://sam.rizqis.com',
  API_TIMEOUT: 10000,
  UPLOAD_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  POLLING_INTERVAL: 1000,
};

// Test credentials for real API testing
export const TEST_CREDENTIALS = {
  username: 'appdev',
  password: 'password',
  phone: '+628123456789',
  otp: '123456',
};

// API Endpoints configuration
export const API_ENDPOINTS = {
  // Authentication & Profile APIs (8 endpoints)
  AUTH: {
    LOGIN: `${TEST_CONFIG.BASE_URL}/api/login`,
    LOGOUT: `${TEST_CONFIG.BASE_URL}/api/logout`,
    SEND_OTP: `${TEST_CONFIG.BASE_URL}/api/send-otp`,
    VERIFY_OTP: `${TEST_CONFIG.BASE_URL}/api/verify-otp`,
    PROFILE: `${TEST_CONFIG.BASE_URL}/api/profile`,
    UPDATE_PASSWORD: `${TEST_CONFIG.BASE_URL}/api/profile/password`,
    UPDATE_PHOTO: `${TEST_CONFIG.BASE_URL}/api/profile/photo`,
    UPDATE_PROFILE: `${TEST_CONFIG.BASE_URL}/api/profile/update`,
  },
  
  // Outlet Management APIs (7 endpoints)
  OUTLETS: {
    INDEX: `${TEST_CONFIG.BASE_URL}/api/outlets`,
    STORE: `${TEST_CONFIG.BASE_URL}/api/outlets`,
    SHOW: (id: string) => `${TEST_CONFIG.BASE_URL}/api/outlets/${id}`,
    UPDATE: (id: string) => `${TEST_CONFIG.BASE_URL}/api/outlets/${id}`,
    WITH_CUSTOM_FIELDS: (id: string) => `${TEST_CONFIG.BASE_URL}/api/outlets/${id}/with-custom-fields`,
    HISTORY: (outletId: string) => `${TEST_CONFIG.BASE_URL}/api/outlets/${outletId}/history`,
    HISTORY_CHANGE: (outletId: string) => `${TEST_CONFIG.BASE_URL}/api/outlets/${outletId}/history-change`,
  },

  // Visit Management APIs (6 endpoints)
  VISITS: {
    INDEX: `${TEST_CONFIG.BASE_URL}/api/visits`,
    STORE: `${TEST_CONFIG.BASE_URL}/api/visits`,
    CHECK: `${TEST_CONFIG.BASE_URL}/api/visits/check`,
    SHOW: (id: string) => `${TEST_CONFIG.BASE_URL}/api/visits/${id}`,
    UPDATE: (id: string) => `${TEST_CONFIG.BASE_URL}/api/visits/${id}`,
    DELETE: (id: string) => `${TEST_CONFIG.BASE_URL}/api/visits/${id}`,
  },

  // Plan Visit APIs (4 endpoints)
  PLAN_VISITS: {
    INDEX: `${TEST_CONFIG.BASE_URL}/api/plan-visits`,
    STORE: `${TEST_CONFIG.BASE_URL}/api/plan-visits`,
    UPDATE: (id: string) => `${TEST_CONFIG.BASE_URL}/api/plan-visits/${id}`,
    DELETE: (id: string) => `${TEST_CONFIG.BASE_URL}/api/plan-visits/${id}`,
  },

  // Notification APIs (7 endpoints)
  NOTIFICATIONS: {
    INDEX: `${TEST_CONFIG.BASE_URL}/api/notifications`,
    MARK_ALL_READ: `${TEST_CONFIG.BASE_URL}/api/notifications/mark-all-read`,
    DELETE_ALL_READ: `${TEST_CONFIG.BASE_URL}/api/notifications/read`,
    UNREAD_COUNT: `${TEST_CONFIG.BASE_URL}/api/notifications/unread-count`,
    SHOW: (id: string) => `${TEST_CONFIG.BASE_URL}/api/notifications/${id}`,
    DELETE: (id: string) => `${TEST_CONFIG.BASE_URL}/api/notifications/${id}`,
    MARK_READ: (id: string) => `${TEST_CONFIG.BASE_URL}/api/notifications/${id}/read`,
  },

  // User Management APIs (5 endpoints)
  USERS: {
    INDEX: `${TEST_CONFIG.BASE_URL}/api/user`,
    STORE: `${TEST_CONFIG.BASE_URL}/api/user`,
    SHOW: (userId: string) => `${TEST_CONFIG.BASE_URL}/api/user/${userId}`,
    UPDATE: (userId: string) => `${TEST_CONFIG.BASE_URL}/api/user/${userId}`,
    DELETE: (userId: string) => `${TEST_CONFIG.BASE_URL}/api/user/${userId}`,
  },

  // Reference Data APIs (8 endpoints)
  REFERENCES: {
    BADAN_USAHA: `${TEST_CONFIG.BASE_URL}/api/references/badan-usaha`,
    CLUSTER: `${TEST_CONFIG.BASE_URL}/api/references/cluster`,
    CUSTOM_FIELD_VALUES: `${TEST_CONFIG.BASE_URL}/api/references/custom-field-values`,
    CUSTOM_FIELDS: `${TEST_CONFIG.BASE_URL}/api/references/custom-fields`,
    DIVISION: `${TEST_CONFIG.BASE_URL}/api/references/division`,
    OUTLET_LEVEL_FIELDS: `${TEST_CONFIG.BASE_URL}/api/references/outlet-level-fields`,
    REGION: `${TEST_CONFIG.BASE_URL}/api/references/region`,
    ROLE: `${TEST_CONFIG.BASE_URL}/api/references/role`,
  },

  // Outlet History APIs (2 endpoints)
  OUTLET_HISTORIES: {
    PENDING: `${TEST_CONFIG.BASE_URL}/api/outlet-histories/pending`,
    PROCESS: (historyId: string) => `${TEST_CONFIG.BASE_URL}/api/outlet-histories/${historyId}/process`,
  },
};

// Standard API Response Format
export interface StandardApiResponse<T> {
  meta: {
    code: number;
    status: 'success' | 'error';
    message: string;
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
  };
  data: T;
  errors?: any;
}

// Test Data Models
export const TEST_DATA = {
  // Authentication test data
  LOGIN_REQUEST: {
    version: '2.0.0',
    username: TEST_CREDENTIALS.username,
    password: TEST_CREDENTIALS.password,
    notif_id: 'test_notif_id',
  },

  LOGIN_RESPONSE: {
    access_token: 'mock_access_token',
    token_type: 'Bearer',
    user: {
      id: '1',
      username: 'test_user',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+628123456789',
      role: {
        id: '1',
        name: 'Field Sales',
        permissions: [
          { name: 'outlet.view' },
          { name: 'outlet.create' },
          { name: 'visit.create' },
        ],
      },
    },
  },

  // Outlet test data
  OUTLET_REQUEST: {
    code: 'OUT001',
    name: 'Test Outlet',
    location: '-6.2088,106.8456',
    owner_name: 'John Doe',
    owner_phone: '+628123456789',
  },

  OUTLET_RESPONSE: {
    id: '1',
    code: 'OUT001',
    name: 'Test Outlet',
    location: {
      latitude: -6.2088,
      longitude: 106.8456,
    },
    owner_name: 'John Doe',
    owner_phone: '+628123456789',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },

  // Visit test data
  VISIT_REQUEST: {
    outlet_id: '1',
    visit_date: '2024-01-15',
    checkin_time: '09:00:00',
    checkin_location: '-6.2088,106.8456',
    type: 'routine',
    notes: 'Regular monthly visit',
  },

  VISIT_RESPONSE: {
    id: '1',
    outlet_id: '1',
    outlet: {
      id: '1',
      code: 'OUT001',
      name: 'Test Outlet',
    },
    visit_date: '2024-01-15',
    checkin_time: '09:00:00',
    checkin_location: {
      latitude: -6.2088,
      longitude: 106.8456,
    },
    type: 'routine',
    status: 'in_progress',
    notes: 'Regular monthly visit',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z',
  },

  // Plan Visit test data
  PLAN_VISIT_REQUEST: {
    outlet_id: '1',
    visit_date: '2024-01-20',
  },

  PLAN_VISIT_RESPONSE: {
    id: '1',
    user_id: '1',
    outlet_id: '1',
    visit_date: '2024-01-20',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    outlet: {
      id: '1',
      code: 'OUT001',
      name: 'Test Outlet',
      address: 'Jl. Test Street No. 123',
    },
    user: {
      id: '1',
      name: 'Test User',
      username: 'test_user',
    },
  },

  // Notification test data
  NOTIFICATION_RESPONSE: {
    id: '1',
    title: 'New Visit Assigned',
    message: 'You have been assigned a new visit to Test Outlet',
    type: 'visit_assignment',
    read_at: null,
    created_at: '2024-01-15T10:00:00Z',
  },

  // User test data
  USER_REQUEST: {
    name: 'New User',
    username: 'newuser',
    phone: '+628987654321',
    role: '2',
    badanusaha: '1',
    divisi: '1',
    region: '1',
    cluster: '1',
  },

  USER_RESPONSE: {
    id: '2',
    name: 'New User',
    username: 'newuser',
    phone: '+628987654321',
    role: 'Sales Representative',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },

  // Reference data
  REFERENCE_RESPONSE: [
    { id: '1', name: 'PT Media Selular Indonesia' },
    { id: '2', name: 'PT Digital Technology' },
  ],
};

// Error scenarios for testing
export const ERROR_SCENARIOS = {
  NETWORK_ERROR: new Error('Network request failed'),
  TIMEOUT_ERROR: new Error('Request timeout'),
  UNAUTHORIZED: {
    meta: { code: 401, status: 'error', message: 'Unauthorized' },
    data: null,
    errors: { auth: ['Invalid credentials'] },
  },
  VALIDATION_ERROR: {
    meta: { code: 422, status: 'error', message: 'Validation failed' },
    data: null,
    errors: {
      name: ['The name field is required'],
      phone: ['The phone format is invalid'],
    },
  },
  SERVER_ERROR: {
    meta: { code: 500, status: 'error', message: 'Internal server error' },
    data: null,
  },
};

// Test utilities
export const createMockResponse = <T>(data: T, meta: Partial<StandardApiResponse<T>['meta']> = {}): StandardApiResponse<T> => ({
  meta: {
    code: 200,
    status: 'success',
    message: 'Success',
    ...meta,
  },
  data,
});

export const createErrorResponse = (code: number, message: string, errors?: any): StandardApiResponse<null> => ({
  meta: {
    code,
    status: 'error',
    message,
  },
  data: null,
  errors,
});

// Helper functions for test setup
export const createAuthHeaders = (token?: string) => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
});

export const createFormDataHeaders = (token?: string) => ({
  'Accept': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  // Don't set Content-Type for FormData - let browser handle it
});

// Wait utilities for async testing
export const waitForCondition = async (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
      } else {
        setTimeout(check, interval);
      }
    };
    
    check();
  });
};