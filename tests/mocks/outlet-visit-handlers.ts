/**
 * Additional MSW v2 Handlers - Outlets and Visits
 */

import { http, HttpResponse } from 'msw';
import { TEST_DATA, createMockResponse, createErrorResponse } from '../config/testConfig';

const BASE_URL = 'https://sam.rizqis.com';

const checkAuth = (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  return authHeader && authHeader.includes('Bearer');
};

const unauthorizedResponse = () => {
  return HttpResponse.json(createErrorResponse(401, 'Unauthorized'), { status: 401 });
};

export const outletHandlers = [
  // ===== OUTLET MANAGEMENT ENDPOINTS (7 endpoints) =====
  
  // GET /api/outlets
  http.get(`${BASE_URL}/api/outlets`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const outlets = [TEST_DATA.OUTLET_RESPONSE, { ...TEST_DATA.OUTLET_RESPONSE, id: '2', code: 'OUT002' }];
    return HttpResponse.json(createMockResponse(outlets));
  }),

  // POST /api/outlets
  http.post(`${BASE_URL}/api/outlets`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const outletData = await request.json() as any;
    if (!outletData.name || !outletData.code) {
      return HttpResponse.json(createErrorResponse(422, 'Validation failed'), { status: 422 });
    }
    const newOutlet = { ...TEST_DATA.OUTLET_RESPONSE, id: Date.now().toString(), ...outletData };
    return HttpResponse.json(createMockResponse(newOutlet), { status: 201 });
  }),

  // GET /api/outlets/:id
  http.get(`${BASE_URL}/api/outlets/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { id } = params;
    if (id === '999') {
      return HttpResponse.json(createErrorResponse(404, 'Outlet not found'), { status: 404 });
    }
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.OUTLET_RESPONSE, id: id as string }));
  }),

  // POST /api/outlets/:id (UPDATE)
  http.post(`${BASE_URL}/api/outlets/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { id } = params;
    const updates = await request.json() as any;
    if (id === '999') {
      return HttpResponse.json(createErrorResponse(404, 'Outlet not found'), { status: 404 });
    }
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.OUTLET_RESPONSE, id: id as string, ...updates }));
  }),

  // GET /api/outlets/:id/with-custom-fields
  http.get(`${BASE_URL}/api/outlets/:id/with-custom-fields`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { id } = params;
    return HttpResponse.json(createMockResponse({
      ...TEST_DATA.OUTLET_RESPONSE,
      id: id as string,
      custom_fields: { store_type: 'Retail', size: 'Medium' }
    }));
  }),

  // GET /api/outlets/:outletId/history
  http.get(`${BASE_URL}/api/outlets/:outletId/history`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { outletId } = params;
    const history = [{
      id: '1', outlet_id: outletId, field: 'name', old_value: 'Old', new_value: 'New',
      changed_by: 'Test User', changed_at: '2024-01-15T10:00:00Z'
    }];
    return HttpResponse.json(createMockResponse(history));
  }),

  // POST /api/outlets/:outletId/history-change
  http.post(`${BASE_URL}/api/outlets/:outletId/history-change`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { outletId } = params;
    return HttpResponse.json(createMockResponse({
      message: 'History change recorded successfully', outlet_id: outletId
    }));
  }),
];

export const visitHandlers = [
  // ===== VISIT MANAGEMENT ENDPOINTS (6 endpoints) =====
  
  // GET /api/visits
  http.get(`${BASE_URL}/api/visits`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const visits = [TEST_DATA.VISIT_RESPONSE, { ...TEST_DATA.VISIT_RESPONSE, id: '2', status: 'completed' }];
    return HttpResponse.json(createMockResponse(visits));
  }),

  // POST /api/visits
  http.post(`${BASE_URL}/api/visits`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const visitData = await request.json() as any;
    if (!visitData.outlet_id || !visitData.visit_date) {
      return HttpResponse.json(createErrorResponse(422, 'Validation failed'), { status: 422 });
    }
    const newVisit = { ...TEST_DATA.VISIT_RESPONSE, id: Date.now().toString(), ...visitData };
    return HttpResponse.json(createMockResponse(newVisit), { status: 201 });
  }),

  // GET /api/visits/check
  http.get(`${BASE_URL}/api/visits/check`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse({
      has_active_visit: true, active_visit: TEST_DATA.VISIT_RESPONSE
    }));
  }),

  // GET /api/visits/:id
  http.get(`${BASE_URL}/api/visits/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { id } = params;
    if (id === '999') {
      return HttpResponse.json(createErrorResponse(404, 'Visit not found'), { status: 404 });
    }
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.VISIT_RESPONSE, id: id as string }));
  }),

  // POST /api/visits/:id (UPDATE)
  http.post(`${BASE_URL}/api/visits/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { id } = params;
    const updates = await request.json() as any;
    if (id === '999') {
      return HttpResponse.json(createErrorResponse(404, 'Visit not found'), { status: 404 });
    }
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.VISIT_RESPONSE, id: id as string, ...updates }));
  }),

  // DELETE /api/visits/:id
  http.delete(`${BASE_URL}/api/visits/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { id } = params;
    if (id === '999') {
      return HttpResponse.json(createErrorResponse(404, 'Visit not found'), { status: 404 });
    }
    return HttpResponse.json(createMockResponse({ message: 'Visit deleted successfully', id: id as string }));
  }),
];