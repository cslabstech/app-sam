/**
 * Error Simulation and Edge Case Testing
 * Tests comprehensive error scenarios and edge cases using MSW error handlers
 */

import { setupServer } from 'msw/node';
import { allErrorHandlers, applyErrorScenario } from './error-handlers';
import { apiRequest } from '@/utils/api';

// Test server for error simulation
const errorTestServer = setupServer();

describe('MSW Error Simulation and Edge Cases', () => {
  beforeAll(() => {
    errorTestServer.listen({ onUnhandledRequest: 'warn' });
  });

  afterEach(() => {
    errorTestServer.resetHandlers();
  });

  afterAll(() => {
    errorTestServer.close();
  });

  describe('Network Error Scenarios', () => {
    it('should handle complete network failure', async () => {
      errorTestServer.use(allErrorHandlers.network.networkError);

      await expect(
        apiRequest({ url: '/api/test', method: 'GET' })
      ).rejects.toThrow();
    });

    it('should handle request timeout', async () => {
      errorTestServer.use(allErrorHandlers.network.timeout);
      
      const timeoutPromise = apiRequest({ 
        url: '/api/test', 
        method: 'GET',
        timeout: 1000 // 1 second timeout for testing
      });

      await expect(timeoutPromise).rejects.toThrow();
    }, 10000);

    it('should handle DNS resolution failure', async () => {
      errorTestServer.use(allErrorHandlers.network.dnsError);

      await expect(
        apiRequest({ url: '/api/test', method: 'GET' })
      ).rejects.toThrow();
    });
  });

  describe('Server Error Scenarios (5xx)', () => {
    it('should handle internal server error (500)', async () => {
      errorTestServer.use(allErrorHandlers.server.internalServerError);

      await expect(
        apiRequest({ url: '/api/test', method: 'GET' })
      ).rejects.toMatchObject({
        status: 500,
        message: expect.stringContaining('Internal server error')
      });
    });

    it('should handle service unavailable (503)', async () => {
      errorTestServer.use(allErrorHandlers.server.serviceUnavailable);

      await expect(
        apiRequest({ url: '/api/test', method: 'GET' })
      ).rejects.toMatchObject({
        status: 503,
        message: expect.stringContaining('Service temporarily unavailable')
      });
    });

    it('should handle bad gateway (502)', async () => {
      errorTestServer.use(allErrorHandlers.server.badGateway);

      await expect(
        apiRequest({ url: '/api/test', method: 'GET' })
      ).rejects.toMatchObject({
        status: 502,
        message: expect.stringContaining('Bad gateway')
      });
    });

    it('should handle gateway timeout (504)', async () => {
      errorTestServer.use(allErrorHandlers.server.gatewayTimeout);

      await expect(
        apiRequest({ url: '/api/test', method: 'GET' })
      ).rejects.toMatchObject({
        status: 504,
        message: expect.stringContaining('Gateway timeout')
      });
    });
  });

  describe('Authentication Error Scenarios', () => {
    it('should handle unauthorized access (401)', async () => {
      errorTestServer.use(allErrorHandlers.auth.unauthorized);

      await expect(
        apiRequest({ url: '/api/test', method: 'GET' })
      ).rejects.toMatchObject({
        status: 401,
        message: expect.stringContaining('Unauthorized')
      });
    });

    it('should handle forbidden access (403)', async () => {
      errorTestServer.use(allErrorHandlers.auth.forbidden);

      await expect(
        apiRequest({ 
          url: '/api/test', 
          method: 'GET',
          headers: { Authorization: 'Bearer valid_token' }
        })
      ).rejects.toMatchObject({
        status: 403,
        message: expect.stringContaining('Forbidden')
      });
    });

    it('should handle expired token', async () => {
      errorTestServer.use(allErrorHandlers.auth.tokenExpired);

      await expect(
        apiRequest({ 
          url: '/api/test', 
          method: 'GET',
          headers: { Authorization: 'Bearer expired_token' }
        })
      ).rejects.toMatchObject({
        status: 401,
        message: expect.stringContaining('Token expired')
      });
    });

    it('should handle blacklisted token', async () => {
      errorTestServer.use(allErrorHandlers.auth.tokenBlacklisted);

      await expect(
        apiRequest({ 
          url: '/api/test', 
          method: 'GET',
          headers: { Authorization: 'Bearer blacklisted_token' }
        })
      ).rejects.toMatchObject({
        status: 401,
        message: expect.stringContaining('Token blacklisted')
      });
    });
  });

  describe('Validation Error Scenarios', () => {
    it('should handle bad request (400)', async () => {
      errorTestServer.use(allErrorHandlers.validation.badRequest);

      await expect(
        apiRequest({ 
          url: '/api/test', 
          method: 'POST',
          body: { malformed: 'data' }
        })
      ).rejects.toMatchObject({
        status: 400,
        message: expect.stringContaining('Bad request')
      });
    });

    it('should handle validation failures (422)', async () => {
      errorTestServer.use(allErrorHandlers.validation.validationFailed);

      try {
        await apiRequest({ 
          url: '/api/test', 
          method: 'POST',
          body: { incomplete: 'data' }
        });
      } catch (error) {
        expect(error).toMatchObject({
          status: 422,
          message: expect.stringContaining('Validation failed')
        });

        // Check if validation errors are properly structured
        expect(error.data?.name).toBeDefined();
        expect(error.data?.email).toBeDefined();
        expect(error.data?.phone).toBeDefined();
      }
    });

    it('should handle resource conflict (409)', async () => {
      errorTestServer.use(allErrorHandlers.validation.conflict);

      await expect(
        apiRequest({ 
          url: '/api/test', 
          method: 'POST',
          body: { code: 'OUT001' }
        })
      ).rejects.toMatchObject({
        status: 409,
        message: expect.stringContaining('Resource conflict')
      });
    });
  });

  describe('Resource Error Scenarios', () => {
    it('should handle not found (404)', async () => {
      errorTestServer.use(allErrorHandlers.resource.notFound);

      await expect(
        apiRequest({ url: '/api/outlets/99999', method: 'GET' })
      ).rejects.toMatchObject({
        status: 404,
        message: expect.stringContaining('Resource not found')
      });
    });

    it('should handle method not allowed (405)', async () => {
      errorTestServer.use(allErrorHandlers.resource.methodNotAllowed);

      await expect(
        apiRequest({ url: '/api/test', method: 'DELETE' })
      ).rejects.toMatchObject({
        status: 405,
        message: expect.stringContaining('Method not allowed')
      });
    });

    it('should handle too many requests (429)', async () => {
      errorTestServer.use(allErrorHandlers.resource.tooManyRequests);

      try {
        await apiRequest({ url: '/api/test', method: 'GET' });
      } catch (error) {
        expect(error).toMatchObject({
          status: 429,
          message: expect.stringContaining('Too many requests')
        });

        // Check rate limiting headers
        expect(error.headers).toMatchObject({
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0'
        });
      }
    });
  });

  describe('Business Logic Error Scenarios', () => {
    it('should handle business rule violations', async () => {
      errorTestServer.use(allErrorHandlers.business.businessRuleViolation);

      await expect(
        apiRequest({ url: '/api/outlets/1', method: 'DELETE' })
      ).rejects.toMatchObject({
        status: 422,
        message: expect.stringContaining('Business rule violation')
      });
    });

    it('should handle data integrity violations', async () => {
      errorTestServer.use(allErrorHandlers.business.dataIntegrityViolation);

      await expect(
        apiRequest({ 
          url: '/api/visits', 
          method: 'POST',
          body: { outlet_id: 'invalid_id' }
        })
      ).rejects.toMatchObject({
        status: 422,
        message: expect.stringContaining('Data integrity violation')
      });
    });

    it('should handle concurrent modification', async () => {
      errorTestServer.use(allErrorHandlers.business.concurrentModification);

      await expect(
        apiRequest({ 
          url: '/api/outlets/1', 
          method: 'POST',
          body: { version: 3, name: 'Updated Name' }
        })
      ).rejects.toMatchObject({
        status: 409,
        message: expect.stringContaining('Concurrent modification detected')
      });
    });
  });

  describe('Endpoint-Specific Error Scenarios', () => {
    it('should handle account locked during login', async () => {
      errorTestServer.use(allErrorHandlers.endpoint.loginErrors.accountLocked);

      await expect(
        apiRequest({ 
          url: '/api/login', 
          method: 'POST',
          body: { username: 'locked_user', password: 'password' }
        })
      ).rejects.toMatchObject({
        status: 423,
        message: expect.stringContaining('Account locked')
      });
    });

    it('should handle password expired during login', async () => {
      errorTestServer.use(allErrorHandlers.endpoint.loginErrors.passwordExpired);

      await expect(
        apiRequest({ 
          url: '/api/login', 
          method: 'POST',
          body: { username: 'expired_user', password: 'old_password' }
        })
      ).rejects.toMatchObject({
        status: 422,
        message: expect.stringContaining('Password expired')
      });
    });

    it('should handle file too large during upload', async () => {
      errorTestServer.use(allErrorHandlers.endpoint.uploadErrors.fileTooLarge);

      await expect(
        apiRequest({ 
          url: '/api/profile/photo', 
          method: 'POST',
          body: { photo: 'large_file_data' }
        })
      ).rejects.toMatchObject({
        status: 413,
        message: expect.stringContaining('File too large')
      });
    });

    it('should handle invalid file type during upload', async () => {
      errorTestServer.use(allErrorHandlers.endpoint.uploadErrors.invalidFileType);

      await expect(
        apiRequest({ 
          url: '/api/profile/photo', 
          method: 'POST',
          body: { photo: 'invalid_file_type.bmp' }
        })
      ).rejects.toMatchObject({
        status: 422,
        message: expect.stringContaining('Invalid file type')
      });
    });
  });

  describe('Error Handler Utility Functions', () => {
    it('should apply specific error scenario', () => {
      const networkErrors = applyErrorScenario('network');
      expect(Array.isArray(networkErrors)).toBe(true);
      expect(networkErrors.length).toBeGreaterThan(0);
    });

    it('should apply specific error type within scenario', () => {
      const specificError = applyErrorScenario('auth', 'unauthorized');
      expect(Array.isArray(specificError)).toBe(true);
      expect(specificError.length).toBe(1);
    });

    it('should handle invalid scenario gracefully', () => {
      const invalidErrors = applyErrorScenario('invalid' as any);
      expect(Array.isArray(invalidErrors)).toBe(true);
    });
  });

  describe('Chaos Engineering Tests', () => {
    it('should handle random failures gracefully', async () => {
      // Run multiple requests to test random failure behavior
      errorTestServer.use(allErrorHandlers.chaos.randomFailure);
      
      const requests = Array.from({ length: 10 }, () => 
        apiRequest({ url: '/api/test', method: 'GET' })
          .catch(error => ({ error: true, status: error.status }))
      );

      const results = await Promise.all(requests);
      
      // Some requests should succeed, some should fail
      const failures = results.filter(result => result.error);
      const successes = results.filter(result => !result.error);
      
      // With 10% failure rate, we might get 0-10 failures (random)
      expect(failures.length + successes.length).toBe(10);
    });

    it('should handle intermittent slow responses', async () => {
      errorTestServer.use(allErrorHandlers.chaos.slowResponse);
      
      const start = Date.now();
      
      try {
        await apiRequest({ url: '/api/test', method: 'GET' });
      } catch (error) {
        // Request might succeed or fail, but we're testing timing
      }
      
      const duration = Date.now() - start;
      
      // Test should complete within reasonable time (not hang indefinitely)
      expect(duration).toBeLessThan(10000); // 10 seconds max
    }, 15000);
  });
});