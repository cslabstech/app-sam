/**
 * Additional MSW v2 Handlers - Plan Visits, Notifications, Users, References, History
 */

import { http, HttpResponse } from 'msw';
import { TEST_DATA, createMockResponse, createErrorResponse } from '../config/testConfig';

const BASE_URL = 'https://sam.rizqis.com';
const checkAuth = (request: Request) => request.headers.get('Authorization')?.includes('Bearer');
const unauthorizedResponse = () => HttpResponse.json(createErrorResponse(401, 'Unauthorized'), { status: 401 });

// ===== PLAN VISIT ENDPOINTS (4 endpoints) =====
export const planVisitHandlers = [
  http.get(`${BASE_URL}/api/plan-visits`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse([TEST_DATA.PLAN_VISIT_RESPONSE]));
  }),
  http.post(`${BASE_URL}/api/plan-visits`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const data = await request.json() as any;
    if (!data.outlet_id || !data.visit_date) {
      return HttpResponse.json(createErrorResponse(422, 'Validation failed'), { status: 422 });
    }
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.PLAN_VISIT_RESPONSE, id: Date.now().toString(), ...data }), { status: 201 });
  }),
  http.put(`${BASE_URL}/api/plan-visits/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { id } = params;
    const updates = await request.json() as any;
    if (id === '999') return HttpResponse.json(createErrorResponse(404, 'Plan visit not found'), { status: 404 });
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.PLAN_VISIT_RESPONSE, id: id as string, ...updates }));
  }),
  http.delete(`${BASE_URL}/api/plan-visits/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { id } = params;
    if (id === '999') return HttpResponse.json(createErrorResponse(404, 'Plan visit not found'), { status: 404 });
    return HttpResponse.json(createMockResponse({ message: 'Plan visit deleted successfully', id: id as string }));
  }),
];

// ===== NOTIFICATION ENDPOINTS (7 endpoints) =====
export const notificationHandlers = [
  http.get(`${BASE_URL}/api/notifications`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse([TEST_DATA.NOTIFICATION_RESPONSE]));
  }),
  http.post(`${BASE_URL}/api/notifications/mark-all-read`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse({ message: 'All notifications marked as read', updated_count: 5 }));
  }),
  http.delete(`${BASE_URL}/api/notifications/read`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse({ message: 'All read notifications deleted', deleted_count: 3 }));
  }),
  http.get(`${BASE_URL}/api/notifications/unread-count`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse({ unread_count: 3 }));
  }),
  http.get(`${BASE_URL}/api/notifications/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { id } = params;
    if (id === '999') return HttpResponse.json(createErrorResponse(404, 'Notification not found'), { status: 404 });
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.NOTIFICATION_RESPONSE, id: id as string }));
  }),
  http.delete(`${BASE_URL}/api/notifications/:id`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { id } = params;
    if (id === '999') return HttpResponse.json(createErrorResponse(404, 'Notification not found'), { status: 404 });
    return HttpResponse.json(createMockResponse({ message: 'Notification deleted successfully', id: id as string }));
  }),
  http.post(`${BASE_URL}/api/notifications/:id/read`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { id } = params;
    if (id === '999') return HttpResponse.json(createErrorResponse(404, 'Notification not found'), { status: 404 });
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.NOTIFICATION_RESPONSE, id: id as string, read_at: new Date().toISOString() }));
  }),
];

// ===== USER MANAGEMENT ENDPOINTS (6 endpoints) =====
export const userHandlers = [
  http.get(`${BASE_URL}/api/user`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse([TEST_DATA.USER_RESPONSE]));
  }),
  http.post(`${BASE_URL}/api/user`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const userData = await request.json() as any;
    if (!userData.name || !userData.username || !userData.phone) {
      return HttpResponse.json(createErrorResponse(422, 'Validation failed'), { status: 422 });
    }
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.USER_RESPONSE, id: Date.now().toString(), ...userData }), { status: 201 });
  }),
  http.get(`${BASE_URL}/api/user/:userId`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { userId } = params;
    if (userId === '999') return HttpResponse.json(createErrorResponse(404, 'User not found'), { status: 404 });
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.USER_RESPONSE, id: userId as string }));
  }),
  http.put(`${BASE_URL}/api/user/:userId`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { userId } = params;
    const updates = await request.json() as any;
    if (userId === '999') return HttpResponse.json(createErrorResponse(404, 'User not found'), { status: 404 });
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.USER_RESPONSE, id: userId as string, ...updates }));
  }),
  http.patch(`${BASE_URL}/api/user/:userId`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { userId } = params;
    const updates = await request.json() as any;
    if (userId === '999') return HttpResponse.json(createErrorResponse(404, 'User not found'), { status: 404 });
    return HttpResponse.json(createMockResponse({ ...TEST_DATA.USER_RESPONSE, id: userId as string, ...updates }));
  }),
  http.delete(`${BASE_URL}/api/user/:userId`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { userId } = params;
    if (userId === '999') return HttpResponse.json(createErrorResponse(404, 'User not found'), { status: 404 });
    return HttpResponse.json(createMockResponse({ message: 'User deleted successfully', id: userId as string }));
  }),
];

// ===== REFERENCE DATA ENDPOINTS (8 endpoints) =====
export const referenceHandlers = [
  http.get(`${BASE_URL}/api/references/badan-usaha`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse(TEST_DATA.REFERENCE_RESPONSE));
  }),
  http.get(`${BASE_URL}/api/references/cluster`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse([{ id: '1', name: 'Jakarta Pusat' }, { id: '2', name: 'Jakarta Selatan' }]));
  }),
  http.get(`${BASE_URL}/api/references/custom-field-values`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse([{ id: '1', field_id: '1', value: 'Retail' }]));
  }),
  http.get(`${BASE_URL}/api/references/custom-fields`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse([{ id: '1', name: 'Store Type', type: 'select', required: true }]));
  }),
  http.get(`${BASE_URL}/api/references/division`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse([{ id: '1', name: 'Sales Division' }]));
  }),
  http.get(`${BASE_URL}/api/references/outlet-level-fields`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse([{ id: '1', code: 'store_info', name: 'Store Information' }]));
  }),
  http.get(`${BASE_URL}/api/references/region`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse([{ id: '1', name: 'Jakarta' }, { id: '2', name: 'Bandung' }]));
  }),
  http.get(`${BASE_URL}/api/references/role`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse([{ id: '1', name: 'Field Sales', scope_required_fields: ['region_id'] }]));
  }),
];

// ===== OUTLET HISTORY ENDPOINTS (2 endpoints) =====
export const historyHandlers = [
  http.get(`${BASE_URL}/api/outlet-histories/pending`, async ({ request }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    return HttpResponse.json(createMockResponse([{ id: '1', outlet_id: '1', status: 'pending' }]));
  }),
  http.post(`${BASE_URL}/api/outlet-histories/:historyId/process`, async ({ request, params }) => {
    if (!checkAuth(request)) return unauthorizedResponse();
    const { historyId } = params;
    const { action } = await request.json() as any;
    if (historyId === '999') return HttpResponse.json(createErrorResponse(404, 'History record not found'), { status: 404 });
    if (!action || !['approve', 'reject'].includes(action)) {
      return HttpResponse.json(createErrorResponse(422, 'Invalid action'), { status: 422 });
    }
    return HttpResponse.json(createMockResponse({ id: historyId as string, status: action, message: `History ${action}d successfully` }));
  }),
];

// Error simulation handlers
export const errorHandlers = {
  networkError: http.all('*', () => HttpResponse.error()),
  serverError: http.all('*', () => HttpResponse.json(createErrorResponse(500, 'Internal server error'), { status: 500 })),
  unauthorized: http.all('*', () => HttpResponse.json(createErrorResponse(401, 'Unauthorized'), { status: 401 })),
};

// Export comprehensive error handlers from separate file
export { allErrorHandlers, applyErrorScenario } from './error-handlers';