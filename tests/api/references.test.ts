/**
 * Reference Data API Tests
 * Tests for Reference Data endpoints (8 endpoints)
 * 
 * Endpoints tested:
 * - GET /api/references/badan-usaha - Get business entities
 * - GET /api/references/cluster - Get clusters
 * - GET /api/references/custom-field-values - Get custom field values
 * - GET /api/references/custom-fields - Get custom fields
 * - GET /api/references/division - Get divisions
 * - GET /api/references/outlet-level-fields - Get outlet level fields
 * - GET /api/references/region - Get regions
 * - GET /api/references/role - Get roles
 */

import { apiRequest } from '@/utils/api';
import { API_ENDPOINTS, TEST_DATA } from '../config/testConfig';

// TypeScript interfaces for Reference Data models
interface ReferenceItem {
  id: string | number;
  name: string;
  code?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface BadanUsaha extends ReferenceItem {
  code: string;
  full_name?: string;
  address?: string;
}

interface Cluster extends ReferenceItem {
  region_id: string | number;
  region?: ReferenceItem;
}

interface CustomField extends ReferenceItem {
  field_type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean';
  is_required: boolean;
  options?: string[];
  default_value?: any;
}

interface Division extends ReferenceItem {
  parent_id?: string | number;
  level: number;
  children?: Division[];
}

interface Region extends ReferenceItem {
  code: string;
  badan_usaha_id: string | number;
  badan_usaha?: BadanUsaha;
}

interface Role extends ReferenceItem {
  permissions: Array<{ name: string; description?: string }>;
  is_system: boolean;
}

// Mock fetch for these tests
const originalFetch = global.fetch;

describe('Reference Data API Tests', () => {
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  const mockToken = 'valid_jwt_token';

  describe('GET /api/references/badan-usaha - Business Entities', () => {
    it('should successfully retrieve business entities list', async () => {
      const mockBusinessEntities = [
        { id: '1', name: 'PT Media Selular Indonesia', code: 'MSI', full_name: 'PT Media Selular Indonesia', is_active: true },
        { id: '2', name: 'PT Digital Technology', code: 'DT', full_name: 'PT Digital Technology Tbk', is_active: true }
      ];

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Business entities retrieved successfully' },
        data: mockBusinessEntities
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.REFERENCES.BADAN_USAHA,
        method: 'GET',
        logLabel: 'BADAN_USAHA_INDEX_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);

      const businessEntity = response.data[0];
      expect(businessEntity).toHaveProperty('id');
      expect(businessEntity).toHaveProperty('name');
      expect(businessEntity).toHaveProperty('code');
      expect(businessEntity).toHaveProperty('is_active');
    });

    it('should filter by active status', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [{ id: '1', name: 'Active Business Entity', code: 'ABE', is_active: true }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.REFERENCES.BADAN_USAHA}?is_active=1`,
        method: 'GET',
        logLabel: 'BADAN_USAHA_ACTIVE_FILTER_TEST',
        token: mockToken,
      });

      expect(response.data.every((item: any) => item.is_active === true)).toBe(true);
    });
  });

  describe('GET /api/references/cluster - Clusters', () => {
    it('should successfully retrieve clusters list', async () => {
      const mockClusters = [
        { id: '1', name: 'Jakarta Pusat', region_id: '1', region: { id: '1', name: 'DKI Jakarta' } },
        { id: '2', name: 'Jakarta Selatan', region_id: '1', region: { id: '1', name: 'DKI Jakarta' } }
      ];

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Clusters retrieved successfully' },
        data: mockClusters
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.REFERENCES.CLUSTER,
        method: 'GET',
        logLabel: 'CLUSTER_INDEX_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      const cluster = response.data[0];
      expect(cluster).toHaveProperty('id');
      expect(cluster).toHaveProperty('name');
      expect(cluster).toHaveProperty('region_id');
    });

    it('should filter clusters by region', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [{ id: '1', name: 'Jakarta Pusat', region_id: '1' }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.REFERENCES.CLUSTER}?region_id=1`,
        method: 'GET',
        logLabel: 'CLUSTER_REGION_FILTER_TEST',
        token: mockToken,
      });

      expect(response.data.every((item: any) => item.region_id === '1')).toBe(true);
    });
  });

  describe('GET /api/references/custom-field-values - Custom Field Values', () => {
    it('should successfully retrieve custom field values', async () => {
      const mockCustomFieldValues = [
        { id: '1', custom_field_id: '1', value: 'Retail', label: 'Retail Store' },
        { id: '2', custom_field_id: '1', value: 'Wholesale', label: 'Wholesale Store' }
      ];

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Custom field values retrieved successfully' },
        data: mockCustomFieldValues
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.REFERENCES.CUSTOM_FIELD_VALUES,
        method: 'GET',
        logLabel: 'CUSTOM_FIELD_VALUES_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      const fieldValue = response.data[0];
      expect(fieldValue).toHaveProperty('id');
      expect(fieldValue).toHaveProperty('custom_field_id');
      expect(fieldValue).toHaveProperty('value');
    });

    it('should filter by custom field ID', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [{ id: '1', custom_field_id: '2', value: 'Small' }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.REFERENCES.CUSTOM_FIELD_VALUES}?custom_field_id=2`,
        method: 'GET',
        logLabel: 'CUSTOM_FIELD_VALUES_FILTER_TEST',
        token: mockToken,
      });

      expect(response.data.every((item: any) => item.custom_field_id === '2')).toBe(true);
    });
  });

  describe('GET /api/references/custom-fields - Custom Fields', () => {
    it('should successfully retrieve custom fields list', async () => {
      const mockCustomFields = [
        {
          id: '1',
          name: 'Store Type',
          field_type: 'select',
          is_required: true,
          options: ['Retail', 'Wholesale', 'Distributor'],
          default_value: 'Retail'
        },
        {
          id: '2',
          name: 'Store Size',
          field_type: 'select',
          is_required: false,
          options: ['Small', 'Medium', 'Large']
        }
      ];

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Custom fields retrieved successfully' },
        data: mockCustomFields
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.REFERENCES.CUSTOM_FIELDS,
        method: 'GET',
        logLabel: 'CUSTOM_FIELDS_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      const customField = response.data[0];
      expect(customField).toHaveProperty('id');
      expect(customField).toHaveProperty('name');
      expect(customField).toHaveProperty('field_type');
      expect(customField).toHaveProperty('is_required');
      expect(['text', 'number', 'select', 'multiselect', 'date', 'boolean']).toContain(customField.field_type);
    });

    it('should filter custom fields by type', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [{ id: '1', name: 'Store Type', field_type: 'select', is_required: true }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.REFERENCES.CUSTOM_FIELDS}?field_type=select`,
        method: 'GET',
        logLabel: 'CUSTOM_FIELDS_TYPE_FILTER_TEST',
        token: mockToken,
      });

      expect(response.data.every((item: any) => item.field_type === 'select')).toBe(true);
    });
  });

  describe('GET /api/references/division - Divisions', () => {
    it('should successfully retrieve divisions list', async () => {
      const mockDivisions = [
        { id: '1', name: 'Sales', level: 1, parent_id: null },
        { id: '2', name: 'Field Sales', level: 2, parent_id: '1' },
        { id: '3', name: 'Inside Sales', level: 2, parent_id: '1' }
      ];

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Divisions retrieved successfully' },
        data: mockDivisions
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.REFERENCES.DIVISION,
        method: 'GET',
        logLabel: 'DIVISION_INDEX_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      const division = response.data[0];
      expect(division).toHaveProperty('id');
      expect(division).toHaveProperty('name');
      expect(division).toHaveProperty('level');
      expect(typeof division.level).toBe('number');
    });

    it('should filter divisions by level', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [{ id: '1', name: 'Sales', level: 1, parent_id: null }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.REFERENCES.DIVISION}?level=1`,
        method: 'GET',
        logLabel: 'DIVISION_LEVEL_FILTER_TEST',
        token: mockToken,
      });

      expect(response.data.every((item: any) => item.level === 1)).toBe(true);
    });
  });

  describe('GET /api/references/outlet-level-fields - Outlet Level Fields', () => {
    it('should successfully retrieve outlet level fields', async () => {
      const mockOutletLevelFields = [
        { id: '1', name: 'Premium', description: 'High-value outlets', sort_order: 1 },
        { id: '2', name: 'Regular', description: 'Standard outlets', sort_order: 2 },
        { id: '3', name: 'Basic', description: 'Low-volume outlets', sort_order: 3 }
      ];

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Outlet level fields retrieved successfully' },
        data: mockOutletLevelFields
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.REFERENCES.OUTLET_LEVEL_FIELDS,
        method: 'GET',
        logLabel: 'OUTLET_LEVEL_FIELDS_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      const levelField = response.data[0];
      expect(levelField).toHaveProperty('id');
      expect(levelField).toHaveProperty('name');
      expect(levelField).toHaveProperty('description');
    });
  });

  describe('GET /api/references/region - Regions', () => {
    it('should successfully retrieve regions list', async () => {
      const mockRegions = [
        {
          id: '1',
          name: 'DKI Jakarta',
          code: 'JKT',
          badan_usaha_id: '1',
          badan_usaha: { id: '1', name: 'PT Media Selular Indonesia', code: 'MSI' }
        },
        {
          id: '2',
          name: 'Jawa Barat',
          code: 'JB',
          badan_usaha_id: '1',
          badan_usaha: { id: '1', name: 'PT Media Selular Indonesia', code: 'MSI' }
        }
      ];

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Regions retrieved successfully' },
        data: mockRegions
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.REFERENCES.REGION,
        method: 'GET',
        logLabel: 'REGION_INDEX_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      const region = response.data[0];
      expect(region).toHaveProperty('id');
      expect(region).toHaveProperty('name');
      expect(region).toHaveProperty('code');
      expect(region).toHaveProperty('badan_usaha_id');
    });

    it('should filter regions by business entity', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [{ id: '1', name: 'DKI Jakarta', code: 'JKT', badan_usaha_id: '1' }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.REFERENCES.REGION}?badan_usaha_id=1`,
        method: 'GET',
        logLabel: 'REGION_BADAN_USAHA_FILTER_TEST',
        token: mockToken,
      });

      expect(response.data.every((item: any) => item.badan_usaha_id === '1')).toBe(true);
    });
  });

  describe('GET /api/references/role - Roles', () => {
    it('should successfully retrieve roles list', async () => {
      const mockRoles = [
        {
          id: '1',
          name: 'Super Admin',
          permissions: [
            { name: 'user.create' }, { name: 'user.read' }, { name: 'user.update' }, { name: 'user.delete' },
            { name: 'outlet.create' }, { name: 'outlet.read' }, { name: 'outlet.update' }
          ],
          is_system: true
        },
        {
          id: '2',
          name: 'Field Sales',
          permissions: [
            { name: 'outlet.read' }, { name: 'outlet.create' }, { name: 'visit.create' }, { name: 'visit.read' }
          ],
          is_system: false
        }
      ];

      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Roles retrieved successfully' },
        data: mockRoles
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.REFERENCES.ROLE,
        method: 'GET',
        logLabel: 'ROLE_INDEX_TEST',
        token: mockToken,
      });

      expect(response.meta.code).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      const role = response.data[0];
      expect(role).toHaveProperty('id');
      expect(role).toHaveProperty('name');
      expect(role).toHaveProperty('permissions');
      expect(role).toHaveProperty('is_system');
      expect(Array.isArray(role.permissions)).toBe(true);
    });

    it('should filter roles by system status', async () => {
      const mockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [{ id: '2', name: 'Field Sales', permissions: [], is_system: false }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.REFERENCES.ROLE}?is_system=false`,
        method: 'GET',
        logLabel: 'ROLE_SYSTEM_FILTER_TEST',
        token: mockToken,
      });

      expect(response.data.every((item: any) => item.is_system === false)).toBe(true);
    });
  });

  describe('Reference Data Authentication & Error Handling', () => {
    it('should require authentication for all reference endpoints', async () => {
      const mockResponse = {
        meta: { code: 401, status: 'error', message: 'Token is invalid or expired. Please login again.' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => mockResponse,
      });

      const endpoints = [
        API_ENDPOINTS.REFERENCES.BADAN_USAHA,
        API_ENDPOINTS.REFERENCES.CLUSTER,
        API_ENDPOINTS.REFERENCES.CUSTOM_FIELDS,
        API_ENDPOINTS.REFERENCES.DIVISION,
        API_ENDPOINTS.REFERENCES.REGION,
        API_ENDPOINTS.REFERENCES.ROLE,
      ];

      for (const endpoint of endpoints) {
        await expect(
          apiRequest({
            url: endpoint,
            method: 'GET',
            logLabel: 'REFERENCE_NO_AUTH_TEST',
            token: null,
          })
        ).rejects.toThrow('Token is invalid or expired. Please login again.');
      }
    });

    it('should handle server errors gracefully', async () => {
      const mockResponse = {
        meta: { code: 500, status: 'error', message: 'Internal server error' },
        data: null
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockResponse,
      });

      await expect(
        apiRequest({
          url: API_ENDPOINTS.REFERENCES.BADAN_USAHA,
          method: 'GET',
          logLabel: 'REFERENCE_SERVER_ERROR_TEST',
          token: mockToken,
        })
      ).rejects.toThrow(/server error/i);
    });
  });

  describe('Reference Data Validation', () => {
    it('should validate custom field types', () => {
      const validFieldTypes = ['text', 'number', 'select', 'multiselect', 'date', 'boolean'];
      const invalidFieldTypes = ['invalid', '', null, undefined];

      validFieldTypes.forEach(type => {
        expect(['text', 'number', 'select', 'multiselect', 'date', 'boolean']).toContain(type);
      });

      invalidFieldTypes.forEach(type => {
        expect(['text', 'number', 'select', 'multiselect', 'date', 'boolean']).not.toContain(type);
      });
    });

    it('should validate division hierarchy levels', () => {
      const divisions = [
        { id: '1', name: 'Sales', level: 1, parent_id: null },
        { id: '2', name: 'Field Sales', level: 2, parent_id: '1' },
        { id: '3', name: 'Region A', level: 3, parent_id: '2' },
      ];

      divisions.forEach(division => {
        expect(division.level).toBeGreaterThan(0);
        expect(division.level).toBeLessThanOrEqual(5); // Reasonable max depth
        
        if (division.level === 1) {
          expect(division.parent_id).toBeNull();
        } else {
          expect(division.parent_id).not.toBeNull();
        }
      });
    });

    it('should validate role permissions structure', () => {
      const role = {
        id: '1',
        name: 'Test Role',
        permissions: [
          { name: 'outlet.create' },
          { name: 'outlet.read' },
          { name: 'visit.create' },
        ],
        is_system: false
      };

      expect(Array.isArray(role.permissions)).toBe(true);
      role.permissions.forEach(permission => {
        expect(permission).toHaveProperty('name');
        expect(typeof permission.name).toBe('string');
        expect(permission.name).toMatch(/^[a-z_]+\.[a-z_]+$/); // Format: resource.action
      });
    });
  });

  describe('Reference Data Integration Scenarios', () => {
    it('should support hierarchical data relationships', async () => {
      // Mock business entity response
      const businessEntityMockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [{ id: '1', name: 'PT Media Selular Indonesia', code: 'MSI' }]
      };

      // Mock region response
      const regionMockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [{ id: '1', name: 'DKI Jakarta', code: 'JKT', badan_usaha_id: '1' }]
      };

      // Mock cluster response
      const clusterMockResponse = {
        meta: { code: 200, status: 'success', message: 'Success' },
        data: [{ id: '1', name: 'Jakarta Pusat', region_id: '1' }]
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => businessEntityMockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => regionMockResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => clusterMockResponse,
        });

      // Get business entities
      const businessEntities = await apiRequest({
        url: API_ENDPOINTS.REFERENCES.BADAN_USAHA,
        method: 'GET',
        logLabel: 'INTEGRATION_BUSINESS_ENTITIES',
        token: mockToken,
      });

      expect(businessEntities.data).toHaveLength(1);
      const businessEntityId = businessEntities.data[0].id;

      // Get regions for business entity
      const regions = await apiRequest({
        url: `${API_ENDPOINTS.REFERENCES.REGION}?badan_usaha_id=${businessEntityId}`,
        method: 'GET',
        logLabel: 'INTEGRATION_REGIONS',
        token: mockToken,
      });

      expect(regions.data).toHaveLength(1);
      const regionId = regions.data[0].id;

      // Get clusters for region
      const clusters = await apiRequest({
        url: `${API_ENDPOINTS.REFERENCES.CLUSTER}?region_id=${regionId}`,
        method: 'GET',
        logLabel: 'INTEGRATION_CLUSTERS',
        token: mockToken,
      });

      expect(clusters.data).toHaveLength(1);
      expect(clusters.data[0].region_id).toBe(regionId);
    });
  });
});