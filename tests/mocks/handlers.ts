/**
 * MSW v2 Mock Handlers for SAM Mobile App API Endpoints
 * Comprehensive coverage for all 46 API endpoints
 */

import { http, HttpResponse } from 'msw';
import { API_ENDPOINTS, TEST_DATA, createMockResponse, createErrorResponse } from '../config/testConfig';
import { outletHandlers, visitHandlers } from './outlet-visit-handlers';
import { planVisitHandlers, notificationHandlers, userHandlers, referenceHandlers, historyHandlers, errorHandlers } from './other-handlers';

const BASE_URL = 'https://sam.rizqis.com';

// Helper function to check authentication
const checkAuth = (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  return authHeader && authHeader.includes('Bearer');
};

// Helper function to return unauthorized error
const unauthorizedResponse = () => {
  return HttpResponse.json(
    createErrorResponse(401, 'Unauthorized'),
    { status: 401 }
  );
};

const authHandlers = [
  // ===== AUTHENTICATION ENDPOINTS (8 endpoints) =====
  
  // POST /api/login
  http.post(`${BASE_URL}/api/login`, async ({ request }) => {
    const body = await request.json() as any;
    const { username, password } = body;
    
    if (username === 'appdev' && password === 'password') {
      return HttpResponse.json(createMockResponse(TEST_DATA.LOGIN_RESPONSE));
    }
    
    return HttpResponse.json(
      createErrorResponse(401, 'Invalid credentials'),
      { status: 401 }
    );
  }),

  // POST /api/logout  
  http.post(`${BASE_URL}/api/logout`, async ({ request }) => {
    if (!checkAuth(request)) {
      return unauthorizedResponse();
    }
    return HttpResponse.json(createMockResponse({ message: 'Logged out successfully' }));
  }),

  // POST /api/send-otp
  http.post(`${BASE_URL}/api/send-otp`, async ({ request }) => {
    const { phone } = await request.json() as any;
    if (!phone) {
      return HttpResponse.json(createErrorResponse(422, 'Validation failed', {
        phone: ['The phone field is required']
      }), { status: 422 });
    }
    return HttpResponse.json(createMockResponse({ message: 'OTP sent successfully', phone }));
  }),

  // POST /api/verify-otp
  http.post(`${BASE_URL}/api/verify-otp`, async ({ request }) => {
    const { phone, otp } = await request.json() as any;
    if (otp === '123456') {
      return HttpResponse.json(createMockResponse(TEST_DATA.LOGIN_RESPONSE));
    }
    return HttpResponse.json(createErrorResponse(422, 'Invalid OTP', {
      otp: ['The OTP is invalid']
    }), { status: 422 });
  }),

  // GET /api/profile
  http.get(`${BASE_URL}/api/profile`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse(TEST_DATA.LOGIN_RESPONSE.user));
  }),

  // POST /api/profile/password
  http.post(`${BASE_URL}/api/profile/password`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { current_password, new_password } = await request.json() as any;
    if (!current_password || !new_password) {
      return HttpResponse.json(createErrorResponse(422, 'Validation failed'), { status: 422 });
    }
    return HttpResponse.json(createMockResponse({ message: 'Password updated successfully' }));
  }),

  // POST /api/profile/photo
  http.post(`${BASE_URL}/api/profile/photo`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.LOGIN_RESPONSE.user, photo: 'updated.jpg' }));
  }),

  // POST /api/profile/update
  http.post(`${BASE_URL}/api/profile/update`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const updates = await request.json() as any;
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.LOGIN_RESPONSE.user, ...updates }));
  }),
];

// Combine all handlers for comprehensive API coverage (46 endpoints total)
export const handlers = [
  ...authHandlers,        // 8 authentication endpoints
  ...outletHandlers,      // 7 outlet management endpoints  
  ...visitHandlers,       // 6 visit management endpoints
  ...planVisitHandlers,   // 4 plan visit endpoints
  ...notificationHandlers,// 7 notification endpoints
  ...userHandlers,        // 6 user management endpoints (including DELETE)
  ...referenceHandlers,   // 8 reference data endpoints
  ...historyHandlers,     // 2 outlet history endpoints
];

// Error simulation handlers for testing edge cases
export { errorHandlers };

// Default export for compatibility
export default handlers;