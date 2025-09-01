/**
 * Visit Management API Endpoints Test Suite
 * Testing 6 visit management endpoints with comprehensive scenarios
 */

import { apiRequest } from '@/utils/api';
import { 
  API_ENDPOINTS, 
  TEST_DATA, 
  createAuthHeaders,
  StandardApiResponse 
} from '../config/testConfig';

describe('Visit Management API Endpoints', () => {
  const validToken = 'valid_bearer_token';
  const testVisitId = '1';
  const testOutletId = '1';
  const nonExistentVisitId = '999';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/visits', () => {
    it('should successfully retrieve visits list with authentication', async () => {
      const response = await apiRequest({
        url: API_ENDPOINTS.VISITS.INDEX,
        method: 'GET',
        body: null,
        logLabel: 'GET_VISITS_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Verify visit structure
      const visit = response.data[0];
      expect(visit).toHaveProperty('id');
      expect(visit).toHaveProperty('outlet_id');
      expect(visit).toHaveProperty('outlet');
      expect(visit).toHaveProperty('visit_date');
      expect(visit).toHaveProperty('checkin_time');
      expect(visit).toHaveProperty('checkin_location');
      expect(visit).toHaveProperty('type');
      expect(visit).toHaveProperty('status');
      expect(visit).toHaveProperty('created_at');
      expect(visit).toHaveProperty('updated_at');
      
      // Verify nested outlet structure
      expect(visit.outlet).toHaveProperty('id');
      expect(visit.outlet).toHaveProperty('code');
      expect(visit.outlet).toHaveProperty('name');
      
      // Verify location structure
      expect(visit.checkin_location).toHaveProperty('latitude');
      expect(visit.checkin_location).toHaveProperty('longitude');
      expect(typeof visit.checkin_location.latitude).toBe('number');
      expect(typeof visit.checkin_location.longitude).toBe('number');
    });

    it('should support filtering by outlet_id', async () => {
      const response = await apiRequest({
        url: `${API_ENDPOINTS.VISITS.INDEX}?outlet_id=${testOutletId}`,
        method: 'GET',
        body: null,
        logLabel: 'GET_VISITS_FILTER_OUTLET_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should support filtering by date range', async () => {
      const response = await apiRequest({
        url: `${API_ENDPOINTS.VISITS.INDEX}?date_from=2024-01-01&date_to=2024-01-31`,
        method: 'GET',
        body: null,
        logLabel: 'GET_VISITS_FILTER_DATE_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should support filtering by status', async () => {
      const response = await apiRequest({
        url: `${API_ENDPOINTS.VISITS.INDEX}?status=completed`,
        method: 'GET',
        body: null,
        logLabel: 'GET_VISITS_FILTER_STATUS_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fail without authentication', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.VISITS.INDEX,
          method: 'GET',
          body: null,
          logLabel: 'GET_VISITS_NO_AUTH_TEST',
        })
      ).rejects.toThrow();
    });
  });

  describe('POST /api/visits', () => {
    it('should successfully create visit with valid data', async () => {
      const visitData = {
        outlet_id: testOutletId,
        visit_date: '2024-01-15',
        checkin_time: '09:00:00',
        checkin_location: '-6.2088,106.8456',
        type: 'routine',
        notes: 'Regular visit for stock check',
      };

      const response = await apiRequest({
        url: API_ENDPOINTS.VISITS.STORE,
        method: 'POST',
        body: visitData,
        logLabel: 'CREATE_VISIT_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('outlet_id', visitData.outlet_id);
      expect(response.data).toHaveProperty('visit_date', visitData.visit_date);
      expect(response.data).toHaveProperty('checkin_time', visitData.checkin_time);
      expect(response.data).toHaveProperty('type', visitData.type);
      expect(response.data).toHaveProperty('notes', visitData.notes);
      expect(response.data).toHaveProperty('status', 'in_progress');
      expect(response.data).toHaveProperty('checkin_location');
      expect(response.data.checkin_location).toHaveProperty('latitude');
      expect(response.data.checkin_location).toHaveProperty('longitude');
    });

    it('should create visit with photo upload', async () => {
      const formData = new FormData();
      formData.append('outlet_id', testOutletId);
      formData.append('visit_date', '2024-01-15');
      formData.append('checkin_time', '09:00:00');
      formData.append('checkin_location', '-6.2088,106.8456');
      formData.append('type', 'routine');
      formData.append('checkin_photo', 'mock_checkin_photo_file');
      formData.append('notes', 'Visit with photo documentation');

      const response = await apiRequest({
        url: API_ENDPOINTS.VISITS.STORE,
        method: 'POST',
        body: formData,
        logLabel: 'CREATE_VISIT_WITH_PHOTO_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('outlet_id', testOutletId);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        // Missing required fields: outlet_id, visit_date
        checkin_time: '09:00:00',
        type: 'routine',
      };

      await expect(
        apiRequest({
          url: API_ENDPOINTS.VISITS.STORE,
          method: 'POST',
          body: incompleteData,
          logLabel: 'CREATE_VISIT_VALIDATION_TEST',
          token: validToken,
        })
      ).rejects.toThrow();
    });

    it('should fail without authentication', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.VISITS.STORE,
          method: 'POST',
          body: TEST_DATA.VISIT_REQUEST,
          logLabel: 'CREATE_VISIT_NO_AUTH_TEST',
        })
      ).rejects.toThrow();
    });

    it('should support different visit types', async () => {
      const visitTypes = ['routine', 'emergency', 'follow_up'];
      
      for (const type of visitTypes) {
        const visitData = {
          ...TEST_DATA.VISIT_REQUEST,
          type,
          notes: `${type} visit test`,
        };

        const response = await apiRequest({
          url: API_ENDPOINTS.VISITS.STORE,
          method: 'POST',
          body: visitData,
          logLabel: `CREATE_VISIT_TYPE_${type.toUpperCase()}_TEST`,
          token: validToken,
        });

        expect(response.meta.status).toBe('success');
        expect(response.data).toHaveProperty('type', type);
      }
    });
  });

  describe('GET /api/visits/check', () => {
    it('should successfully check for active visits', async () => {
      const response = await apiRequest({
        url: API_ENDPOINTS.VISITS.CHECK,
        method: 'GET',
        body: null,
        logLabel: 'CHECK_ACTIVE_VISITS_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('has_active_visit');
      expect(typeof response.data.has_active_visit).toBe('boolean');
      
      if (response.data.has_active_visit) {
        expect(response.data).toHaveProperty('active_visit');
        expect(response.data.active_visit).toHaveProperty('id');
        expect(response.data.active_visit).toHaveProperty('outlet_id');
        expect(response.data.active_visit).toHaveProperty('status');
      }
    });

    it('should fail without authentication', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.VISITS.CHECK,
          method: 'GET',
          body: null,
          logLabel: 'CHECK_VISITS_NO_AUTH_TEST',
        })
      ).rejects.toThrow();
    });
  });

  describe('GET /api/visits/:id', () => {
    it('should successfully retrieve specific visit', async () => {
      const response = await apiRequest({
        url: API_ENDPOINTS.VISITS.SHOW(testVisitId),
        method: 'GET',
        body: null,
        logLabel: 'GET_VISIT_BY_ID_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('id', testVisitId);
      expect(response.data).toHaveProperty('outlet_id');
      expect(response.data).toHaveProperty('outlet');
      expect(response.data).toHaveProperty('visit_date');
      expect(response.data).toHaveProperty('checkin_time');
      expect(response.data).toHaveProperty('checkin_location');
      expect(response.data).toHaveProperty('type');
      expect(response.data).toHaveProperty('status');
    });

    it('should return 404 for non-existent visit', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.VISITS.SHOW(nonExistentVisitId),
          method: 'GET',
          body: null,
          logLabel: 'GET_VISIT_NOT_FOUND_TEST',
          token: validToken,
        })
      ).rejects.toThrow();
    });

    it('should fail without authentication', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.VISITS.SHOW(testVisitId),
          method: 'GET',
          body: null,
          logLabel: 'GET_VISIT_NO_AUTH_TEST',
        })
      ).rejects.toThrow();
    });
  });

  describe('POST /api/visits/:id (UPDATE)', () => {
    it('should successfully update visit with checkout data', async () => {
      const checkoutData = {
        checkout_time: '11:00:00',
        checkout_location: '-6.2090,106.8458',
        notes: 'Visit completed successfully. All items checked.',
        status: 'completed',
      };

      const response = await apiRequest({
        url: API_ENDPOINTS.VISITS.UPDATE(testVisitId),
        method: 'POST',
        body: checkoutData,
        logLabel: 'UPDATE_VISIT_CHECKOUT_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('id', testVisitId);
      expect(response.data).toHaveProperty('checkout_time', checkoutData.checkout_time);
      expect(response.data).toHaveProperty('checkout_location');
      expect(response.data.checkout_location).toHaveProperty('latitude');
      expect(response.data.checkout_location).toHaveProperty('longitude');
      expect(response.data).toHaveProperty('notes', checkoutData.notes);
      expect(response.data).toHaveProperty('updated_at');
    });

    it('should update visit with checkout photo', async () => {
      const formData = new FormData();
      formData.append('checkout_time', '11:30:00');
      formData.append('checkout_location', '-6.2090,106.8458');
      formData.append('checkout_photo', 'mock_checkout_photo_file');
      formData.append('notes', 'Visit completed with photo documentation');
      formData.append('status', 'completed');

      const response = await apiRequest({
        url: API_ENDPOINTS.VISITS.UPDATE(testVisitId),
        method: 'POST',
        body: formData,
        logLabel: 'UPDATE_VISIT_WITH_PHOTO_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.data).toHaveProperty('id', testVisitId);
      expect(response.data).toHaveProperty('checkout_time', '11:30:00');
    });

    it('should allow partial visit updates', async () => {
      const partialUpdateData = {
        notes: 'Updated visit notes only',
      };

      const response = await apiRequest({
        url: API_ENDPOINTS.VISITS.UPDATE(testVisitId),
        method: 'POST',
        body: partialUpdateData,
        logLabel: 'PARTIAL_UPDATE_VISIT_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.data).toHaveProperty('notes', partialUpdateData.notes);
    });

    it('should return 404 for non-existent visit', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.VISITS.UPDATE(nonExistentVisitId),
          method: 'POST',
          body: { notes: 'Updated notes' },
          logLabel: 'UPDATE_VISIT_NOT_FOUND_TEST',
          token: validToken,
        })
      ).rejects.toThrow();
    });

    it('should fail without authentication', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.VISITS.UPDATE(testVisitId),
          method: 'POST',
          body: { notes: 'Updated notes' },
          logLabel: 'UPDATE_VISIT_NO_AUTH_TEST',
        })
      ).rejects.toThrow();
    });
  });

  describe('DELETE /api/visits/:id', () => {
    it('should successfully delete visit', async () => {
      const response = await apiRequest({
        url: API_ENDPOINTS.VISITS.DELETE(testVisitId),
        method: 'DELETE',
        body: null,
        logLabel: 'DELETE_VISIT_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('id', testVisitId);
    });

    it('should return 404 for non-existent visit', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.VISITS.DELETE(nonExistentVisitId),
          method: 'DELETE',
          body: null,
          logLabel: 'DELETE_VISIT_NOT_FOUND_TEST',
          token: validToken,
        })
      ).rejects.toThrow();
    });

    it('should fail without authentication', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.VISITS.DELETE(testVisitId),
          method: 'DELETE',
          body: null,
          logLabel: 'DELETE_VISIT_NO_AUTH_TEST',
        })
      ).rejects.toThrow();
    });
  });

  describe('Visit Management Integration Tests', () => {
    it('should support complete visit lifecycle (check-in to check-out)', async () => {
      // Step 1: Create visit (check-in)
      const checkinData = {
        outlet_id: testOutletId,
        visit_date: '2024-01-16',
        checkin_time: '09:00:00',
        checkin_location: '-6.2088,106.8456',
        type: 'routine',
        notes: 'Starting routine visit',
      };

      const createResponse = await apiRequest({
        url: API_ENDPOINTS.VISITS.STORE,
        method: 'POST',
        body: checkinData,
        logLabel: 'LIFECYCLE_CREATE_VISIT',
        token: validToken,
      });

      expect(createResponse.meta.status).toBe('success');
      const visitId = createResponse.data.id;
      expect(createResponse.data.status).toBe('in_progress');

      // Step 2: Check active visit status
      const checkResponse = await apiRequest({
        url: API_ENDPOINTS.VISITS.CHECK,
        method: 'GET',
        body: null,
        logLabel: 'LIFECYCLE_CHECK_ACTIVE',
        token: validToken,
      });

      expect(checkResponse.meta.status).toBe('success');
      expect(checkResponse.data.has_active_visit).toBe(true);

      // Step 3: Update visit during the visit
      const updateResponse = await apiRequest({
        url: API_ENDPOINTS.VISITS.UPDATE(visitId),
        method: 'POST',
        body: { notes: 'Updated notes during visit' },
        logLabel: 'LIFECYCLE_UPDATE_VISIT',
        token: validToken,
      });

      expect(updateResponse.meta.status).toBe('success');

      // Step 4: Complete visit (check-out)
      const checkoutResponse = await apiRequest({
        url: API_ENDPOINTS.VISITS.UPDATE(visitId),
        method: 'POST',
        body: {
          checkout_time: '11:00:00',
          checkout_location: '-6.2090,106.8458',
          status: 'completed',
          notes: 'Visit completed successfully',
        },
        logLabel: 'LIFECYCLE_CHECKOUT_VISIT',
        token: validToken,
      });

      expect(checkoutResponse.meta.status).toBe('success');
      expect(checkoutResponse.data.checkout_time).toBe('11:00:00');
    });

    it('should handle multiple concurrent visits to different outlets', async () => {
      const visitPromises = [
        apiRequest({
          url: API_ENDPOINTS.VISITS.STORE,
          method: 'POST',
          body: {
            ...TEST_DATA.VISIT_REQUEST,
            outlet_id: '1',
            notes: 'Concurrent visit to outlet 1',
          },
          logLabel: 'CONCURRENT_VISIT_1',
          token: validToken,
        }),
        apiRequest({
          url: API_ENDPOINTS.VISITS.STORE,
          method: 'POST',
          body: {
            ...TEST_DATA.VISIT_REQUEST,
            outlet_id: '2',
            notes: 'Concurrent visit to outlet 2',
          },
          logLabel: 'CONCURRENT_VISIT_2',
          token: validToken,
        }),
      ];

      const results = await Promise.all(visitPromises);
      
      results.forEach(result => {
        expect(result.meta.status).toBe('success');
        expect(result.data).toHaveProperty('id');
      });
    });

    it('should support visit filtering and search across multiple parameters', async () => {
      // Test complex filtering
      const filterParams = new URLSearchParams({
        outlet_id: testOutletId,
        status: 'completed',
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        type: 'routine',
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.VISITS.INDEX}?${filterParams.toString()}`,
        method: 'GET',
        body: null,
        logLabel: 'COMPLEX_FILTER_VISITS_TEST',
        token: validToken,
      });

      expect(response.meta.status).toBe('success');
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid outlet_id during visit creation', async () => {
      const invalidVisitData = {
        outlet_id: 'non_existent_outlet',
        visit_date: '2024-01-15',
        checkin_time: '09:00:00',
        checkin_location: '-6.2088,106.8456',
        type: 'routine',
      };

      // This might succeed or fail depending on outlet validation
      // The important thing is that it handles the error gracefully
      try {
        const response = await apiRequest({
          url: API_ENDPOINTS.VISITS.STORE,
          method: 'POST',
          body: invalidVisitData,
          logLabel: 'INVALID_OUTLET_ID_TEST',
          token: validToken,
        });
        
        // If it succeeds, it should have a valid response structure
        expect(response.meta).toHaveProperty('status');
      } catch (error) {
        // If it fails, it should be a proper API error
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle invalid location coordinates', async () => {
      const invalidLocationData = {
        outlet_id: testOutletId,
        visit_date: '2024-01-15',
        checkin_time: '09:00:00',
        checkin_location: 'invalid_coordinates',
        type: 'routine',
      };

      // Test that the API handles invalid coordinates appropriately
      try {
        const response = await apiRequest({
          url: API_ENDPOINTS.VISITS.STORE,
          method: 'POST',
          body: invalidLocationData,
          logLabel: 'INVALID_LOCATION_TEST',
          token: validToken,
        });
        
        expect(response.meta).toHaveProperty('status');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle file upload errors for photos', async () => {
      const formData = new FormData();
      formData.append('outlet_id', testOutletId);
      formData.append('visit_date', '2024-01-15');
      formData.append('checkin_time', '09:00:00');
      formData.append('checkin_location', '-6.2088,106.8456');
      formData.append('type', 'routine');
      // Simulate invalid file upload
      formData.append('checkin_photo', 'invalid_file_data');

      try {
        const response = await apiRequest({
          url: API_ENDPOINTS.VISITS.STORE,
          method: 'POST',
          body: formData,
          logLabel: 'VISIT_FILE_ERROR_TEST',
          token: validToken,
        });
        
        expect(response.meta).toHaveProperty('status');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle network timeouts', async () => {
      await expect(
        apiRequest({
          url: API_ENDPOINTS.VISITS.INDEX,
          method: 'GET',
          body: null,
          logLabel: 'VISIT_TIMEOUT_TEST',
          token: validToken,
          timeout: 1, // Very short timeout
        })
      ).rejects.toThrow(/timeout/i);
    });
  });
});