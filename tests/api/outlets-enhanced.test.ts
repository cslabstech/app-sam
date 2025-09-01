/**
 * Enhanced Outlet API Tests with Hierarchical Relationship Validation
 * Comprehensive testing of outlet management with region/cluster/division relationships
 */

import { apiRequest } from '@/utils/api';
import { API_ENDPOINTS, TEST_CREDENTIALS } from '../config/testConfig';

// ===== TYPESCRIPT INTERFACES FOR HIERARCHICAL RELATIONSHIPS =====

interface Region {
  id: string;
  name: string;
  code: string;
  country_id: string;
  province_id: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface Cluster {
  id: string;
  name: string;
  code: string;
  region_id: string;
  region?: Region;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface Division {
  id: string;
  name: string;
  code: string;
  parent_division_id?: string;
  level: number;
  hierarchy_path: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface OutletCustomField {
  id: string;
  field_id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean';
  value: any;
  display_value?: string;
  required: boolean;
  sort_order: number;
}

interface OutletLocation {
  latitude: number;
  longitude: number;
  address?: string;
  postal_code?: string;
  district?: string;
  city?: string;
  province?: string;
  country?: string;
}

interface OutletPhotos {
  shop_sign?: string;
  front_view?: string;
  left_view?: string;
  right_view?: string;
  interior?: string;
  products?: string[];
}

interface OutletHierarchy {
  region_id: string;
  region?: Region;
  cluster_id: string;
  cluster?: Cluster;
  division_id?: string;
  division?: Division;
  territory_id?: string;
  area_id?: string;
}

interface EnhancedOutlet {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  type: 'retail' | 'wholesale' | 'distributor' | 'outlet' | 'kiosk';
  
  // Location information
  location: OutletLocation;
  
  // Owner information
  owner_name: string;
  owner_phone: string;
  owner_email?: string;
  owner_id_number?: string;
  
  // Business information
  business_name?: string;
  business_license?: string;
  tax_number?: string;
  
  // Hierarchical relationships
  hierarchy: OutletHierarchy;
  
  // Custom fields
  custom_fields?: OutletCustomField[];
  
  // Media
  photos?: OutletPhotos;
  video_url?: string;
  
  // Audit trail
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Additional metadata
  visit_frequency?: number;
  last_visit_date?: string;
  average_order_value?: number;
  customer_rating?: number;
  notes?: string;
}

interface OutletRelationshipValidation {
  outlet_id: string;
  region_validation: {
    is_valid: boolean;
    region_exists: boolean;
    region_active: boolean;
    user_has_access: boolean;
  };
  cluster_validation: {
    is_valid: boolean;
    cluster_exists: boolean;
    cluster_active: boolean;
    belongs_to_region: boolean;
    user_has_access: boolean;
  };
  division_validation: {
    is_valid: boolean;
    division_exists: boolean;
    division_active: boolean;
    hierarchy_valid: boolean;
    user_has_access: boolean;
  };
  territory_validation?: {
    is_valid: boolean;
    territory_exists: boolean;
    belongs_to_cluster: boolean;
  };
}

// ===== VALIDATION FUNCTIONS =====

const isValidRegion = (region: any): region is Region => {
  return (
    typeof region?.id === 'string' &&
    typeof region?.name === 'string' &&
    typeof region?.code === 'string' &&
    ['active', 'inactive'].includes(region?.status) &&
    typeof region?.created_at === 'string' &&
    typeof region?.updated_at === 'string'
  );
};

const isValidCluster = (cluster: any): cluster is Cluster => {
  return (
    typeof cluster?.id === 'string' &&
    typeof cluster?.name === 'string' &&
    typeof cluster?.code === 'string' &&
    typeof cluster?.region_id === 'string' &&
    ['active', 'inactive'].includes(cluster?.status) &&
    typeof cluster?.created_at === 'string' &&
    typeof cluster?.updated_at === 'string'
  );
};

const isValidOutletLocation = (location: any): location is OutletLocation => {
  return (
    typeof location?.latitude === 'number' &&
    typeof location?.longitude === 'number' &&
    location.latitude >= -90 && location.latitude <= 90 &&
    location.longitude >= -180 && location.longitude <= 180
  );
};

const isValidOutletHierarchy = (hierarchy: any): hierarchy is OutletHierarchy => {
  return (
    typeof hierarchy?.region_id === 'string' &&
    typeof hierarchy?.cluster_id === 'string' &&
    (!hierarchy.region || isValidRegion(hierarchy.region)) &&
    (!hierarchy.cluster || isValidCluster(hierarchy.cluster))
  );
};

const isValidEnhancedOutlet = (outlet: any): outlet is EnhancedOutlet => {
  return (
    typeof outlet?.id === 'string' &&
    typeof outlet?.code === 'string' &&
    typeof outlet?.name === 'string' &&
    ['active', 'inactive', 'pending', 'suspended'].includes(outlet?.status) &&
    ['retail', 'wholesale', 'distributor', 'outlet', 'kiosk'].includes(outlet?.type) &&
    isValidOutletLocation(outlet?.location) &&
    typeof outlet?.owner_name === 'string' &&
    typeof outlet?.owner_phone === 'string' &&
    isValidOutletHierarchy(outlet?.hierarchy) &&
    typeof outlet?.created_by === 'string' &&
    typeof outlet?.created_at === 'string' &&
    typeof outlet?.updated_at === 'string'
  );
};

// ===== MOCK SETUP =====

const originalFetch = global.fetch;

describe('Enhanced Outlet API with Hierarchical Relationship Validation', () => {
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Hierarchical Relationship Validation', () => {
    it('should validate complete outlet with hierarchical relationships', async () => {
      const mockOutletResponse = {
        meta: { code: 200, status: 'success', message: 'Outlet retrieved successfully' },
        data: {
          id: '1',
          code: 'OUT001',
          name: 'Test Outlet',
          status: 'active',
          type: 'retail',
          location: {
            latitude: -6.2088,
            longitude: 106.8456,
            address: '123 Test Street',
            postal_code: '12345',
            district: 'Test District',
            city: 'Jakarta',
            province: 'DKI Jakarta',
            country: 'Indonesia'
          },
          owner_name: 'John Doe',
          owner_phone: '+628123456789',
          owner_email: 'john@example.com',
          owner_id_number: '1234567890123456',
          business_name: 'Test Business',
          business_license: 'BL123456',
          tax_number: 'TX123456789',
          hierarchy: {
            region_id: 'R001',
            region: {
              id: 'R001',
              name: 'Jakarta Region',
              code: 'JKT',
              country_id: 'ID',
              province_id: 'JKT',
              status: 'active',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            cluster_id: 'C001',
            cluster: {
              id: 'C001',
              name: 'Jakarta Pusat',
              code: 'JKT_PUSAT',
              region_id: 'R001',
              status: 'active',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            division_id: 'D001',
            division: {
              id: 'D001',
              name: 'Sales Division',
              code: 'SALES',
              parent_division_id: null,
              level: 1,
              hierarchy_path: '/D001',
              status: 'active',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            territory_id: 'T001',
            area_id: 'A001'
          },
          custom_fields: [
            {
              id: 'CF001',
              field_id: 'F001',
              field_name: 'Store Type',
              field_type: 'select',
              value: 'retail',
              display_value: 'Retail Store',
              required: true,
              sort_order: 1
            },
            {
              id: 'CF002',
              field_id: 'F002',
              field_name: 'Size Category',
              field_type: 'select',
              value: 'medium',
              display_value: 'Medium',
              required: false,
              sort_order: 2
            }
          ],
          photos: {
            shop_sign: 'https://example.com/photos/shop_sign.jpg',
            front_view: 'https://example.com/photos/front.jpg',
            left_view: 'https://example.com/photos/left.jpg',
            right_view: 'https://example.com/photos/right.jpg',
            interior: 'https://example.com/photos/interior.jpg',
            products: [
              'https://example.com/photos/product1.jpg',
              'https://example.com/photos/product2.jpg'
            ]
          },
          video_url: 'https://example.com/videos/outlet_tour.mp4',
          created_by: 'user123',
          updated_by: 'user456',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          visit_frequency: 7,
          last_visit_date: '2024-01-10T00:00:00Z',
          average_order_value: 150000,
          customer_rating: 4.5,
          notes: 'High-performing outlet with good customer feedback'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOutletResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.SHOW('1'),
        method: 'GET',
        token: 'valid_token',
        logLabel: 'ENHANCED_OUTLET_HIERARCHY_TEST',
      });

      // Validate complete outlet structure
      expect(isValidEnhancedOutlet(response.data)).toBe(true);
      
      const outlet = response.data as EnhancedOutlet;
      
      // Validate hierarchical relationships
      expect(isValidOutletHierarchy(outlet.hierarchy)).toBe(true);
      expect(outlet.hierarchy.region?.id).toBe(outlet.hierarchy.region_id);
      expect(outlet.hierarchy.cluster?.id).toBe(outlet.hierarchy.cluster_id);
      expect(outlet.hierarchy.cluster?.region_id).toBe(outlet.hierarchy.region_id);
      
      // Validate location data
      expect(isValidOutletLocation(outlet.location)).toBe(true);
      expect(outlet.location.latitude).toBeGreaterThan(-90);
      expect(outlet.location.latitude).toBeLessThan(90);
      expect(outlet.location.longitude).toBeGreaterThan(-180);
      expect(outlet.location.longitude).toBeLessThan(180);
      
      // Validate custom fields structure
      if (outlet.custom_fields) {
        outlet.custom_fields.forEach(field => {
          expect(field.id).toBeTruthy();
          expect(field.field_name).toBeTruthy();
          expect(['text', 'number', 'select', 'multiselect', 'date', 'boolean']).toContain(field.field_type);
          expect(typeof field.required).toBe('boolean');
          expect(typeof field.sort_order).toBe('number');
        });
      }
      
      // Validate photos structure
      if (outlet.photos) {
        const photoFields = ['shop_sign', 'front_view', 'left_view', 'right_view', 'interior'];
        photoFields.forEach(field => {
          if (outlet.photos![field]) {
            expect(outlet.photos![field]).toMatch(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/);
          }
        });
        
        if (outlet.photos.products) {
          outlet.photos.products.forEach(photoUrl => {
            expect(photoUrl).toMatch(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/);
          });
        }
      }
      
      // Validate timestamps
      expect(new Date(outlet.created_at).getTime()).toBeGreaterThan(0);
      expect(new Date(outlet.updated_at).getTime()).toBeGreaterThan(0);
      if (outlet.last_visit_date) {
        expect(new Date(outlet.last_visit_date).getTime()).toBeGreaterThan(0);
      }
      
      // Validate business metrics
      if (outlet.visit_frequency) {
        expect(outlet.visit_frequency).toBeGreaterThan(0);
      }
      if (outlet.average_order_value) {
        expect(outlet.average_order_value).toBeGreaterThan(0);
      }
      if (outlet.customer_rating) {
        expect(outlet.customer_rating).toBeGreaterThanOrEqual(1);
        expect(outlet.customer_rating).toBeLessThanOrEqual(5);
      }
    });

    it('should validate outlet creation with hierarchical constraints', async () => {
      const outletCreateRequest = {
        code: 'OUT002',
        name: 'New Outlet',
        type: 'retail',
        location: {
          latitude: -6.2088,
          longitude: 106.8456,
          address: '456 New Street'
        },
        owner_name: 'Jane Smith',
        owner_phone: '+628987654321',
        hierarchy: {
          region_id: 'R001',
          cluster_id: 'C002',
          division_id: 'D001'
        },
        custom_fields: [
          {
            field_id: 'F001',
            value: 'wholesale'
          }
        ]
      };

      const mockCreateResponse = {
        meta: { code: 201, status: 'success', message: 'Outlet created successfully' },
        data: {
          ...outletCreateRequest,
          id: '2',
          status: 'pending',
          created_by: 'user123',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockCreateResponse,
      });

      const response = await apiRequest({
        url: API_ENDPOINTS.OUTLETS.STORE,
        method: 'POST',
        body: outletCreateRequest,
        token: 'valid_token',
        logLabel: 'CREATE_OUTLET_HIERARCHY_TEST',
      });

      expect(response.meta.status).toBe('success');
      expect(response.meta.code).toBe(201);
      expect(response.data.hierarchy.region_id).toBe('R001');
      expect(response.data.hierarchy.cluster_id).toBe('C002');
      expect(response.data.hierarchy.division_id).toBe('D001');
    });

    it('should validate hierarchical relationship constraints', async () => {
      const mockValidationResponse = {
        meta: { code: 200, status: 'success', message: 'Validation completed' },
        data: {
          outlet_id: '1',
          region_validation: {
            is_valid: true,
            region_exists: true,
            region_active: true,
            user_has_access: true
          },
          cluster_validation: {
            is_valid: true,
            cluster_exists: true,
            cluster_active: true,
            belongs_to_region: true,
            user_has_access: true
          },
          division_validation: {
            is_valid: true,
            division_exists: true,
            division_active: true,
            hierarchy_valid: true,
            user_has_access: true
          },
          territory_validation: {
            is_valid: true,
            territory_exists: true,
            belongs_to_cluster: true
          }
        } as OutletRelationshipValidation
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockValidationResponse,
      });

      const response = await apiRequest({
        url: `${API_ENDPOINTS.OUTLETS.SHOW('1')}/validate-relationships`,
        method: 'GET',
        token: 'valid_token',
        logLabel: 'VALIDATE_OUTLET_RELATIONSHIPS_TEST',
      });

      const validation = response.data as OutletRelationshipValidation;
      
      // Validate all hierarchical relationships
      expect(validation.region_validation.is_valid).toBe(true);
      expect(validation.region_validation.region_exists).toBe(true);
      expect(validation.region_validation.region_active).toBe(true);
      expect(validation.region_validation.user_has_access).toBe(true);
      
      expect(validation.cluster_validation.is_valid).toBe(true);
      expect(validation.cluster_validation.cluster_exists).toBe(true);
      expect(validation.cluster_validation.cluster_active).toBe(true);
      expect(validation.cluster_validation.belongs_to_region).toBe(true);
      expect(validation.cluster_validation.user_has_access).toBe(true);
      
      expect(validation.division_validation.is_valid).toBe(true);
      expect(validation.division_validation.division_exists).toBe(true);
      expect(validation.division_validation.division_active).toBe(true);
      expect(validation.division_validation.hierarchy_valid).toBe(true);
      expect(validation.division_validation.user_has_access).toBe(true);
    });
  });

  describe('Outlet Hierarchy Consistency Tests', () => {
    it('should maintain region-cluster relationships', () => {
      const region: Region = {
        id: 'R001',
        name: 'Jakarta Region',
        code: 'JKT',
        country_id: 'ID',
        province_id: 'JKT',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const cluster: Cluster = {
        id: 'C001',
        name: 'Jakarta Pusat',
        code: 'JKT_PUSAT',
        region_id: 'R001',
        region: region,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      expect(isValidRegion(region)).toBe(true);
      expect(isValidCluster(cluster)).toBe(true);
      expect(cluster.region_id).toBe(region.id);
      expect(cluster.region?.id).toBe(region.id);
    });

    it('should validate outlet code format consistency', () => {
      const validCodes = [
        'OUT001',
        'OUT999',
        'RETAIL001',
        'WS001',
        'DIST001'
      ];

      const invalidCodes = [
        'out001', // lowercase
        'OUT', // too short
        'OUT12345678901', // too long
        '001', // no prefix
        'OUT-001', // invalid character
        'OUT 001' // space
      ];

      validCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z]+\d{3,6}$/);
      });

      invalidCodes.forEach(code => {
        expect(code).not.toMatch(/^[A-Z]+\d{3,6}$/);
      });
    });

    it('should validate location coordinates consistency', () => {
      const validLocations = [
        { latitude: -6.2088, longitude: 106.8456 }, // Jakarta
        { latitude: -7.2575, longitude: 112.7521 }, // Surabaya
        { latitude: 3.5952, longitude: 98.6722 },   // Medan
        { latitude: -90, longitude: -180 },          // Edge case
        { latitude: 90, longitude: 180 }             // Edge case
      ];

      const invalidLocations = [
        { latitude: -91, longitude: 106.8456 },     // Invalid latitude
        { latitude: -6.2088, longitude: 181 },      // Invalid longitude
        { latitude: 'invalid', longitude: 106.8456 }, // Non-numeric
        { latitude: null, longitude: 106.8456 }     // Null value
      ];

      validLocations.forEach(location => {
        expect(isValidOutletLocation(location)).toBe(true);
      });

      invalidLocations.forEach(location => {
        expect(isValidOutletLocation(location)).toBe(false);
      });
    });

    it('should validate custom field type consistency', () => {
      const validCustomFields = [
        { field_type: 'text', value: 'Some text' },
        { field_type: 'number', value: 123 },
        { field_type: 'select', value: 'option1' },
        { field_type: 'multiselect', value: ['option1', 'option2'] },
        { field_type: 'date', value: '2024-01-15' },
        { field_type: 'boolean', value: true }
      ];

      validCustomFields.forEach(field => {
        expect(['text', 'number', 'select', 'multiselect', 'date', 'boolean']).toContain(field.field_type);
      });
    });
  });

  describe('Business Rule Validation', () => {
    it('should enforce outlet creation business rules', async () => {
      // Test case: Cannot create outlet in inactive region
      const mockBusinessRuleError = {
        meta: { code: 422, status: 'error', message: 'Business rule violation' },
        data: null,
        errors: {
          region_id: ['Selected region is inactive and cannot accept new outlets'],
          cluster_id: ['Cluster does not belong to the selected region'],
          business_rules: [
            'Outlet density limit exceeded in this cluster',
            'User does not have permission to create outlets in this region'
          ]
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockBusinessRuleError,
      });

      try {
        await apiRequest({
          url: API_ENDPOINTS.OUTLETS.STORE,
          method: 'POST',
          body: {
            code: 'OUT003',
            name: 'Invalid Outlet',
            region_id: 'R999', // Inactive region
            cluster_id: 'C999' // Invalid cluster
          },
          token: 'valid_token',
          logLabel: 'CREATE_OUTLET_BUSINESS_RULES_TEST',
        });
        fail('Should have thrown business rule violation');
      } catch (error: any) {
        expect(error.status).toBe(422);
        expect(error.message).toContain('Business rule violation');
        
        if (error.data?.errors) {
          expect(error.data.errors.region_id).toBeDefined();
          expect(error.data.errors.cluster_id).toBeDefined();
          expect(error.data.errors.business_rules).toBeDefined();
          expect(Array.isArray(error.data.errors.business_rules)).toBe(true);
        }
      }
    });
  });
});