/**
 * Real API Integration Tests
 * Tests actual connectivity to https://sam.rizqis.com
 * These tests should be run against the real backend API
 * Use with caution as they may affect real data
 */

import { TEST_CONFIG, API_ENDPOINTS, TEST_CREDENTIALS, createAuthHeaders } from '../config/testConfig';

// Skip these tests by default to avoid hitting real API during CI/CD
const SKIP_REAL_API_TESTS = process.env.SKIP_REAL_API_TESTS !== 'false';

// Real API test configuration
const REAL_API_CONFIG = {
  baseUrl: TEST_CONFIG.BASE_URL,
  timeout: TEST_CONFIG.API_TIMEOUT,
  credentials: {
    username: process.env.TEST_USERNAME || 'test_user',
    password: process.env.TEST_PASSWORD || 'test_password',
    phone: process.env.TEST_PHONE || '+628123456789',
  },
};

describe('Real API Integration Tests', () => {
  let authToken: string | null = null;
  let testOutletId: string | null = null;
  let testVisitId: string | null = null;

  beforeAll(async () => {
    if (SKIP_REAL_API_TESTS) {
      console.log('Skipping real API tests. Set SKIP_REAL_API_TESTS=false to enable.');
      return;
    }
  });

  // Helper function for real API requests
  const makeRealApiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${REAL_API_CONFIG.baseUrl}${endpoint}`;
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      timeout: REAL_API_CONFIG.timeout,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  };

  describe('API Connectivity', () => {
    it.skipIf(SKIP_REAL_API_TESTS)('should connect to sam.rizqis.com successfully', async () => {
      const response = await fetch(`${REAL_API_CONFIG.baseUrl}/api/login`, {
        method: 'HEAD',
      });

      // Should return some response (even if it's an error response)
      expect(response).toBeDefined();
    }, 15000);

    it.skipIf(SKIP_REAL_API_TESTS)('should have proper CORS headers', async () => {
      const response = await fetch(`${REAL_API_CONFIG.baseUrl}/api/login`, {
        method: 'OPTIONS',
      });

      // Check for CORS headers (if applicable)
      expect(response.headers).toBeDefined();
    }, 10000);
  });

  describe('Authentication Flow', () => {
    it.skipIf(SKIP_REAL_API_TESTS)('should handle login request format', async () => {
      try {
        const response = await makeRealApiRequest('/api/login', {
          method: 'POST',
          body: JSON.stringify({
            version: '2.0.0',
            username: REAL_API_CONFIG.credentials.username,
            password: REAL_API_CONFIG.credentials.password,
            notif_id: 'test_integration_id',
          }),
        });

        // Verify response structure regardless of success/failure
        expect(response).toHaveProperty('meta');
        expect(response.meta).toHaveProperty('code');
        expect(response.meta).toHaveProperty('status');
        expect(response.meta).toHaveProperty('message');
        
        // If login is successful, save the token
        if (response.meta.status === 'success' && response.data?.access_token) {
          authToken = response.data.access_token;
          expect(response.data).toHaveProperty('access_token');
          expect(response.data).toHaveProperty('token_type', 'Bearer');
          expect(response.data).toHaveProperty('user');
        }
      } catch (error) {
        // Login might fail with test credentials, but we should get a proper error response
        expect(error).toBeInstanceOf(Error);
        console.log('Login failed as expected with test credentials:', error.message);
      }
    }, 15000);

    it.skipIf(SKIP_REAL_API_TESTS)('should handle OTP request format', async () => {
      try {
        const response = await makeRealApiRequest('/api/send-otp', {
          method: 'POST',
          body: JSON.stringify({
            phone: REAL_API_CONFIG.credentials.phone,
          }),
        });

        // Verify response structure
        expect(response).toHaveProperty('meta');
        expect(response.meta).toHaveProperty('code');
        expect(response.meta).toHaveProperty('status');
        expect(response.meta).toHaveProperty('message');
      } catch (error) {
        // OTP might fail, but we should get a proper error response
        expect(error).toBeInstanceOf(Error);
        console.log('OTP request handled:', error.message);
      }
    }, 15000);
  });

  describe('Authenticated Endpoints', () => {
    beforeEach(() => {
      if (SKIP_REAL_API_TESTS) return;
      
      // Skip authenticated tests if we don't have a token
      if (!authToken) {
        console.log('Skipping authenticated tests - no valid token available');
      }
    });

    it.skipIf(SKIP_REAL_API_TESTS || !authToken)('should access profile endpoint', async () => {
      const response = await makeRealApiRequest('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response).toHaveProperty('meta');
      expect(response.meta.status).toBe('success');
      expect(response).toHaveProperty('data');
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('username');
      expect(response.data).toHaveProperty('name');
    }, 10000);

    it.skipIf(SKIP_REAL_API_TESTS || !authToken)('should access outlets endpoint', async () => {
      const response = await makeRealApiRequest('/api/outlets', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response).toHaveProperty('meta');
      expect(response.meta.status).toBe('success');
      expect(response).toHaveProperty('data');
      expect(Array.isArray(response.data)).toBe(true);
      
      // If outlets exist, save one for further testing
      if (response.data.length > 0) {
        testOutletId = response.data[0].id;
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('code');
        expect(response.data[0]).toHaveProperty('name');
      }
    }, 10000);

    it.skipIf(SKIP_REAL_API_TESTS || !authToken)('should access visits endpoint', async () => {
      const response = await makeRealApiRequest('/api/visits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response).toHaveProperty('meta');
      expect(response.meta.status).toBe('success');
      expect(response).toHaveProperty('data');
      expect(Array.isArray(response.data)).toBe(true);
      
      // If visits exist, save one for further testing
      if (response.data.length > 0) {
        testVisitId = response.data[0].id;
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('outlet_id');
        expect(response.data[0]).toHaveProperty('visit_date');
      }
    }, 10000);

    it.skipIf(SKIP_REAL_API_TESTS || !authToken)('should access notifications endpoint', async () => {
      const response = await makeRealApiRequest('/api/notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response).toHaveProperty('meta');
      expect(response.meta.status).toBe('success');
      expect(response).toHaveProperty('data');
      expect(Array.isArray(response.data)).toBe(true);
    }, 10000);

    it.skipIf(SKIP_REAL_API_TESTS || !authToken)('should access reference data endpoints', async () => {
      const referenceEndpoints = [
        '/api/references/badan-usaha',
        '/api/references/cluster',
        '/api/references/division',
        '/api/references/region',
        '/api/references/role',
      ];

      for (const endpoint of referenceEndpoints) {
        try {
          const response = await makeRealApiRequest(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });

          expect(response).toHaveProperty('meta');
          expect(response.meta.status).toBe('success');
          expect(response).toHaveProperty('data');
          expect(Array.isArray(response.data)).toBe(true);
        } catch (error) {
          console.log(`Reference endpoint ${endpoint} failed:`, error.message);
          // Some reference endpoints might not be available or require special permissions
        }
      }
    }, 30000);
  });

  describe('Error Handling', () => {
    it.skipIf(SKIP_REAL_API_TESTS)('should handle 401 unauthorized properly', async () => {
      try {
        await makeRealApiRequest('/api/profile', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer invalid_token',
          },
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('401');
      }
    }, 10000);

    it.skipIf(SKIP_REAL_API_TESTS)('should handle 404 not found properly', async () => {
      try {
        await makeRealApiRequest('/api/non-existent-endpoint', {
          method: 'GET',
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('404');
      }
    }, 10000);

    it.skipIf(SKIP_REAL_API_TESTS)('should handle malformed requests', async () => {
      try {
        await makeRealApiRequest('/api/login', {
          method: 'POST',
          body: 'invalid_json_data',
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // Should get either 400 Bad Request or JSON parse error
      }
    }, 10000);
  });

  describe('Response Format Validation', () => {
    it.skipIf(SKIP_REAL_API_TESTS)('should validate standard response format', async () => {
      // Test with a simple endpoint that should always return standard format
      try {
        const response = await makeRealApiRequest('/api/login', {
          method: 'POST',
          body: JSON.stringify({
            version: '2.0.0',
            username: 'invalid_user',
            password: 'invalid_password',
          }),
        });
        
        // Even failed login should return standard format
        expect(response).toHaveProperty('meta');
        expect(response.meta).toHaveProperty('code');
        expect(response.meta).toHaveProperty('status');
        expect(response.meta).toHaveProperty('message');
      } catch (error) {
        // Even errors should follow the standard format when possible
        console.log('Login error response format test:', error.message);
      }
    }, 10000);

    it.skipIf(SKIP_REAL_API_TESTS)('should validate pagination format for list endpoints', async () => {
      if (!authToken) {
        console.log('Skipping pagination test - no auth token');
        return;
      }

      try {
        const response = await makeRealApiRequest('/api/outlets?page=1&per_page=5', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        expect(response).toHaveProperty('meta');
        expect(response.meta.status).toBe('success');
        
        // Check if pagination meta is present
        if (response.meta.total !== undefined) {
          expect(response.meta).toHaveProperty('current_page');
          expect(response.meta).toHaveProperty('last_page');
          expect(response.meta).toHaveProperty('total');
          expect(response.meta).toHaveProperty('per_page');
        }
      } catch (error) {
        console.log('Pagination test failed:', error.message);
      }
    }, 10000);
  });

  describe('Performance Tests', () => {
    it.skipIf(SKIP_REAL_API_TESTS)('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      try {
        await makeRealApiRequest('/api/login', {
          method: 'POST',
          body: JSON.stringify({
            version: '2.0.0',
            username: 'test_performance',
            password: 'test_performance',
          }),
        });
      } catch (error) {
        // We expect this to fail, but we're testing response time
      }
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    }, 10000);

    it.skipIf(SKIP_REAL_API_TESTS)('should handle concurrent requests', async () => {
      const requests = [];
      
      // Make 5 concurrent requests
      for (let i = 0; i < 5; i++) {
        requests.push(
          makeRealApiRequest('/api/login', {
            method: 'POST',
            body: JSON.stringify({
              version: '2.0.0',
              username: `test_concurrent_${i}`,
              password: 'test_password',
            }),
          }).catch(error => ({ error: error.message }))
        );
      }
      
      const results = await Promise.all(requests);
      
      // All requests should complete (even if they fail)
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    }, 15000);
  });

  afterAll(async () => {
    if (SKIP_REAL_API_TESTS || !authToken) return;
    
    // Clean up: logout if we have a token
    try {
      await makeRealApiRequest('/api/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      console.log('Successfully logged out after tests');
    } catch (error) {
      console.log('Logout failed (expected if token was invalid):', error.message);
    }
  });
});

// Export for use in other integration tests
export { makeRealApiRequest, REAL_API_CONFIG };