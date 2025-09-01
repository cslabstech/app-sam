/**
 * Plan Visit API Tests
 * Tests for Plan Visit Management endpoints (4 endpoints)
 * 
 * Endpoints tested:
 * - GET /api/plan-visits - Get all plan visits
 * - POST /api/plan-visits - Create new plan visit
 * - PUT /api/plan-visits/{id} - Update existing plan visit
 * - DELETE /api/plan-visits/{id} - Delete plan visit
 */

import { apiRequest } from '@/utils/api';
import { API_ENDPOINTS, TEST_DATA, TEST_CONFIG } from '../config/testConfig';

// TypeScript interfaces for Plan Visit data models
interface PlanVisit {
  id: string | number;
  user_id: string | number;
  outlet_id: string | number;
  visit_date: string;
  created_at: string;
  updated_at: string;
}

interface PlanVisitRequest {
  outlet_id: string | number;
  visit_date: string;
}

// Mock fetch for these tests
const originalFetch = global.fetch;

describe('Plan Visit API Tests', () => {
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  const mockToken = 'test_jwt_token';

  describe('GET /api/plan-visits - List Plan Visits', () => {
    it('should successfully retrieve list of plan visits', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [
          TEST_DATA.PLAN_VISIT_RESPONSE,
          { ...TEST_DATA.PLAN_VISIT_RESPONSE, id: '2', visit_date: '2024-02-15' }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.PLAN_VISITS.INDEX,
        method: 'GET',
        logLabel: 'PLAN_VISITS_INDEX_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.meta.status).toBe('success');
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);
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
          url: API_ENDPOINTS.PLAN_VISITS.INDEX,
          method: 'GET',
          logLabel: 'PLAN_VISITS_NO_AUTH_TEST',
          token: null,
        })
      ).rejects.toThrow('Token is invalid or expired. Please login again.');
    });
  });

  describe('POST /api/plan-visits - Create Plan Visit', () => {
    it('should successfully create a new plan visit', async () => {
      const planVisitData: PlanVisitRequest = {
        outlet_id: '1',
        visit_date: '2024-02-15',
      };

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Plan visit created successfully' },
        data: { ...TEST_DATA.PLAN_VISIT_RESPONSE, id: '3', ...planVisitData }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.PLAN_VISITS.STORE,
        method: 'POST',
        body: planVisitData,
        logLabel: 'PLAN_VISIT_CREATE_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.outlet_id).toBe(planVisitData.outlet_id);
      expect(response.data.visit_date).toBe(planVisitData.visit_date);
    });

    it('should validate required fields', async () => {
      const mockResponse = {
        meta: { code: 422, status: 'error', message: 'Validation failed: The outlet_id field is required, The visit_date field is required' },
        data: null,
        errors: {
          outlet_id: ['The outlet_id field is required'],
          visit_date: ['The visit_date field is required']
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.PLAN_VISITS.STORE,
          method: 'POST',
          body: {},
          logLabel: 'PLAN_VISIT_VALIDATION_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/validation failed/i);
    });
  });

  describe('PUT /api/plan-visits/{id} - Update Plan Visit', () => {
    it('should successfully update a plan visit', async () => {
      const planVisitId = '1';
      const updateData = { visit_date: '2024-02-20' };

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Plan visit updated successfully' },
        data: { ...TEST_DATA.PLAN_VISIT_RESPONSE, id: planVisitId, ...updateData }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.PLAN_VISITS.UPDATE(planVisitId),
        method: 'PUT',
        body: updateData,
        logLabel: 'PLAN_VISIT_UPDATE_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.data.visit_date).toBe(updateData.visit_date);
    });

    it('should handle non-existent plan visit', async () => {
      const mockResponse = {
        meta: { code: 404, status: 'error', message: 'Plan visit not found' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.PLAN_VISITS.UPDATE('99999'),
          method: 'PUT',
          body: { visit_date: '2024-02-20' },
          logLabel: 'PLAN_VISIT_NOT_FOUND_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('DELETE /api/plan-visits/{id} - Delete Plan Visit', () => {
    it('should successfully delete a plan visit', async () => {
      const planVisitId = '1';

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Plan visit deleted successfully' },
        data: { id: planVisitId }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.PLAN_VISITS.DELETE(planVisitId),
        method: 'DELETE',
        logLabel: 'PLAN_VISIT_DELETE_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(response.meta.message).toMatch(/deleted successfully/i);
    });
  });

  describe('Data Model Validation', () => {
    it('should validate plan visit data structure', () => {
      const planVisit = TEST_DATA.PLAN_VISIT_RESPONSE;
      
      expect(planVisit).toHaveProperty('id');
      expect(planVisit).toHaveProperty('user_id');
      expect(planVisit).toHaveProperty('outlet_id');
      expect(planVisit).toHaveProperty('visit_date');
      expect(planVisit).toHaveProperty('created_at');
      expect(planVisit).toHaveProperty('updated_at');
      
      expect(typeof planVisit.visit_date).toBe('string');
      expect(planVisit.visit_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});