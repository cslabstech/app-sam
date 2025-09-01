/**
 * Comprehensive Error Simulation and Edge Case Handlers for MSW
 * Provides realistic error scenarios for testing error handling and edge cases
 */

import { http, HttpResponse } from 'msw';
import { createErrorResponse } from '../config/testConfig';

const BASE_URL = 'https://sam.rizqis.com';

// Network and connectivity error scenarios
export const networkErrorHandlers = {
  // Complete network failure
  networkError: http.all('*', () => {
    return HttpResponse.error();
  }),

  // Timeout simulation (15 seconds delay)
  timeout: http.all('*', async () => {
    await new Promise(resolve => setTimeout(resolve, 15000));
    return HttpResponse.json(
      createErrorResponse(408, 'Request timeout'),
      { status: 408 }
    );
  }),

  // DNS resolution failure
  dnsError: http.all('*', () => {
    return new Response(null, {
      status: 0,
      statusText: 'DNS resolution failed',
    });
  }),

  // Connection reset
  connectionReset: http.all('*', () => {
    return HttpResponse.error();
  }),
};

// Server error scenarios (5xx)
export const serverErrorHandlers = {
  // Internal server error
  internalServerError: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(500, 'Internal server error', {
        error: 'Database connection failed',
        trace: 'SQLException: Connection refused'
      }),
      { status: 500 }
    );
  }),

  // Service unavailable
  serviceUnavailable: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(503, 'Service temporarily unavailable', {
        retry_after: '300',
        maintenance_mode: true
      }),
      { status: 503 }
    );
  }),

  // Bad gateway
  badGateway: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(502, 'Bad gateway', {
        upstream_server: 'database_server',
        error: 'Upstream server not responding'
      }),
      { status: 502 }
    );
  }),

  // Gateway timeout
  gatewayTimeout: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(504, 'Gateway timeout', {
        upstream_timeout: '30000ms',
        service: 'authentication_service'
      }),
      { status: 504 }
    );
  }),
};

// Authentication and authorization error scenarios
export const authErrorHandlers = {
  // Unauthorized - no token
  unauthorized: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(401, 'Unauthorized', {
        error: 'Missing or invalid authentication token',
        required: 'Bearer token in Authorization header'
      }),
      { status: 401 }
    );
  }),

  // Forbidden - insufficient permissions
  forbidden: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(403, 'Forbidden', {
        error: 'Insufficient permissions for this resource',
        required_permission: 'admin:write',
        user_permissions: ['user:read', 'outlet:read']
      }),
      { status: 403 }
    );
  }),

  // Token expired
  tokenExpired: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(401, 'Token expired', {
        error: 'Authentication token has expired',
        expired_at: '2024-01-15T10:00:00Z',
        refresh_required: true
      }),
      { status: 401 }
    );
  }),

  // Token blacklisted
  tokenBlacklisted: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(401, 'Token blacklisted', {
        error: 'Authentication token has been revoked',
        revoked_at: '2024-01-15T09:30:00Z',
        reason: 'User logout'
      }),
      { status: 401 }
    );
  }),
};

// Validation error scenarios (4xx)
export const validationErrorHandlers = {
  // Bad request - malformed data
  badRequest: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(400, 'Bad request', {
        error: 'Request body is not valid JSON',
        received: 'malformed JSON string'
      }),
      { status: 400 }
    );
  }),

  // Validation failed - field errors
  validationFailed: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(422, 'Validation failed', {
        name: ['The name field is required', 'The name must be at least 3 characters'],
        email: ['The email field must be a valid email address'],
        phone: ['The phone field is required'],
        outlet_id: ['The selected outlet_id is invalid']
      }),
      { status: 422 }
    );
  }),

  // Conflict - duplicate resource
  conflict: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(409, 'Resource conflict', {
        error: 'Resource already exists',
        field: 'code',
        value: 'OUT001',
        existing_id: '12345'
      }),
      { status: 409 }
    );
  }),

  // Gone - resource deleted
  gone: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(410, 'Resource no longer available', {
        error: 'Resource has been permanently deleted',
        deleted_at: '2024-01-10T15:30:00Z',
        deleted_by: 'admin_user'
      }),
      { status: 410 }
    );
  }),
};

// Resource error scenarios
export const resourceErrorHandlers = {
  // Not found
  notFound: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(404, 'Resource not found', {
        error: 'The requested resource does not exist',
        resource_type: 'outlet',
        resource_id: '99999'
      }),
      { status: 404 }
    );
  }),

  // Method not allowed
  methodNotAllowed: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(405, 'Method not allowed', {
        error: 'HTTP method not supported for this endpoint',
        allowed_methods: ['GET', 'POST'],
        received_method: 'DELETE'
      }),
      { status: 405 }
    );
  }),

  // Too many requests
  tooManyRequests: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(429, 'Too many requests', {
        error: 'Rate limit exceeded',
        limit: 100,
        window: '60 seconds',
        retry_after: 60
      }),
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60)
        }
      }
    );
  }),
};

// Data integrity and business logic errors
export const businessLogicErrorHandlers = {
  // Business rule violation
  businessRuleViolation: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(422, 'Business rule violation', {
        error: 'Cannot delete outlet with active visits',
        rule: 'outlet_active_visits_check',
        active_visits_count: 3,
        suggestion: 'Complete or cancel all visits before deletion'
      }),
      { status: 422 }
    );
  }),

  // Data integrity violation
  dataIntegrityViolation: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(422, 'Data integrity violation', {
        error: 'Foreign key constraint violation',
        constraint: 'fk_visits_outlet_id',
        referenced_table: 'outlets',
        referenced_id: '12345'
      }),
      { status: 422 }
    );
  }),

  // Concurrent modification
  concurrentModification: http.all('*', () => {
    return HttpResponse.json(
      createErrorResponse(409, 'Concurrent modification detected', {
        error: 'Resource has been modified by another user',
        current_version: 5,
        provided_version: 3,
        modified_by: 'other_user',
        modified_at: '2024-01-15T10:15:00Z'
      }),
      { status: 409 }
    );
  }),
};

// Specific endpoint error scenarios
export const endpointSpecificErrors = {
  // Login specific errors
  loginErrors: {
    accountLocked: http.post(`${BASE_URL}/api/login`, () => {
      return HttpResponse.json(
        createErrorResponse(423, 'Account locked', {
          error: 'Account has been locked due to multiple failed login attempts',
          locked_until: '2024-01-15T11:00:00Z',
          failed_attempts: 5,
          max_attempts: 5
        }),
        { status: 423 }
      );
    }),

    passwordExpired: http.post(`${BASE_URL}/api/login`, () => {
      return HttpResponse.json(
        createErrorResponse(422, 'Password expired', {
          error: 'Password has expired and must be changed',
          expired_at: '2024-01-01T00:00:00Z',
          password_change_required: true
        }),
        { status: 422 }
      );
    }),
  },

  // File upload errors
  uploadErrors: {
    fileTooLarge: http.post(`${BASE_URL}/api/profile/photo`, () => {
      return HttpResponse.json(
        createErrorResponse(413, 'File too large', {
          error: 'Uploaded file exceeds maximum size limit',
          max_size: '5MB',
          received_size: '12MB',
          file_name: 'profile_photo.jpg'
        }),
        { status: 413 }
      );
    }),

    invalidFileType: http.post(`${BASE_URL}/api/profile/photo`, () => {
      return HttpResponse.json(
        createErrorResponse(422, 'Invalid file type', {
          error: 'File type not supported',
          allowed_types: ['image/jpeg', 'image/png', 'image/gif'],
          received_type: 'image/bmp'
        }),
        { status: 422 }
      );
    }),
  },
};

// Random error simulation for chaos testing
export const chaosErrorHandlers = {
  // Randomly failing requests (10% failure rate)
  randomFailure: http.all('*', () => {
    const shouldFail = Math.random() < 0.1; // 10% chance
    
    if (shouldFail) {
      const errorTypes = [500, 502, 503, 504];
      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      
      return HttpResponse.json(
        createErrorResponse(randomError, 'Random failure for testing'),
        { status: randomError }
      );
    }
    
    // Continue to next handler if not failing
    return;
  }),

  // Intermittent slow responses
  slowResponse: http.all('*', async () => {
    const shouldBeSlow = Math.random() < 0.2; // 20% chance
    
    if (shouldBeSlow) {
      const delay = Math.random() * 5000 + 1000; // 1-6 second delay
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return;
  }),
};

// Export all error handler collections
export const allErrorHandlers = {
  network: networkErrorHandlers,
  server: serverErrorHandlers,
  auth: authErrorHandlers,
  validation: validationErrorHandlers,
  resource: resourceErrorHandlers,
  business: businessLogicErrorHandlers,
  endpoint: endpointSpecificErrors,
  chaos: chaosErrorHandlers,
};

// Utility function to apply specific error scenario
export const applyErrorScenario = (scenario: keyof typeof allErrorHandlers, errorType?: string) => {
  const errorHandlers = allErrorHandlers[scenario];
  
  if (!errorHandlers) {
    return [];
  }
  
  if (errorType && errorHandlers[errorType]) {
    return [errorHandlers[errorType]];
  }
  
  return Object.values(errorHandlers);
};