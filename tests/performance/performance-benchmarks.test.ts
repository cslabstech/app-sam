/**
 * Performance Benchmark Tests
 * Tests that measure and validate performance of critical app functions
 */

import { 
  measureAsync, 
  performanceTest, 
  MemoryTracker, 
  batchPerformanceTest,
  rnPerformanceHelpers,
  performanceAssertions
} from './performance-utils';

// Mock dependencies for performance testing
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/utils/api');

describe('Performance Benchmarks', () => {
  let memoryTracker: MemoryTracker;

  beforeEach(() => {
    memoryTracker = new MemoryTracker();
    jest.clearAllMocks();
  });

  describe('API Performance', () => {
    it('should measure login API performance', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({
        data: { token: 'test-token', user: { id: 1 } }
      });

      const measurement = await rnPerformanceHelpers.measureApiCall(mockApiCall);
      
      expect(measurement.durationMs).toBeLessThan(100); // Should be fast in tests
      expect(measurement.memoryDelta).toBeDefined();
      
      console.log(`Login API performance: ${measurement.durationMs}ms`);
    });

    it('should measure outlet creation performance', async () => {
      const mockCreateOutlet = jest.fn().mockResolvedValue({
        data: { id: 1, name: 'Test Outlet' }
      });

      const test = performanceTest(
        'Outlet Creation', 
        mockCreateOutlet, 
        { threshold: 200 }
      );

      const measurement = await test();
      expect(measurement.durationMs).toBeLessThan(200);
    });

    it('should measure batch API calls performance', async () => {
      const apiTests = [
        {
          name: 'Get Outlets',
          fn: () => Promise.resolve({ data: [] }),
          threshold: 150
        },
        {
          name: 'Get Visits', 
          fn: () => Promise.resolve({ data: [] }),
          threshold: 150
        },
        {
          name: 'Get References',
          fn: () => Promise.resolve({ data: [] }),
          threshold: 100
        }
      ];

      const results = await batchPerformanceTest(apiTests, { iterations: 3 });
      
      results.forEach(result => {
        expect(result.passed).toBe(true);
        expect(result.average).toBeLessThan(result.threshold);
      });
    });
  });

  describe('Storage Performance', () => {
    it('should measure AsyncStorage performance', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.setItem.mockResolvedValue();
      AsyncStorage.getItem.mockResolvedValue('test-data');

      // Measure storage write
      const writeTest = await rnPerformanceHelpers.measureStorage(() =>
        AsyncStorage.setItem('test-key', JSON.stringify({ data: 'test' }))
      );

      // Measure storage read  
      const readTest = await rnPerformanceHelpers.measureStorage(() =>
        AsyncStorage.getItem('test-key')
      );

      expect(writeTest.durationMs).toBeLessThan(50);
      expect(readTest.durationMs).toBeLessThan(50);
      
      console.log(`Storage write: ${writeTest.durationMs}ms, read: ${readTest.durationMs}ms`);
    });

    it('should measure large data serialization performance', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: 'x'.repeat(100)
      }));

      memoryTracker.snapshot('before-serialize');
      
      const serializeTest = await measureAsync(() => 
        JSON.stringify(largeData)
      );
      
      memoryTracker.snapshot('after-serialize');
      
      const memoryDelta = memoryTracker.getDelta('before-serialize', 'after-serialize');
      
      expect(serializeTest.durationMs).toBeLessThan(100);
      expect(memoryDelta?.heapUsed || 0).toBeLessThan(10); // < 10MB
      
      console.log(`Serialization: ${serializeTest.durationMs}ms, memory: +${memoryDelta?.heapUsed}MB`);
    });
  });

  describe('Component Performance', () => {
    it('should measure component render performance', async () => {
      // Mock React component render
      const mockRender = jest.fn().mockImplementation(() => {
        // Simulate render work
        const start = performance.now();
        while (performance.now() - start < 10) {
          // Simulate 10ms of work
        }
        return { type: 'div', props: {} };
      });

      const renderTest = await rnPerformanceHelpers.measureRender(mockRender);
      
      expect(renderTest.durationMs).toBeLessThan(50);
      expect(mockRender).toHaveBeenCalled();
      
      console.log(`Component render: ${renderTest.durationMs}ms`);
    });

    it('should measure list rendering performance', async () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      
      const mockRenderList = jest.fn().mockImplementation(() => {
        // Simulate rendering 100 items
        return items.map(item => ({ key: item.id, text: item.name }));
      });

      const listRenderTest = await measureAsync(mockRenderList);
      
      expect(listRenderTest.durationMs).toBeLessThan(100);
      console.log(`List render (100 items): ${listRenderTest.durationMs}ms`);
    });
  });

  describe('Authentication Performance', () => {
    it('should measure login flow performance', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.setItem.mockResolvedValue();
      AsyncStorage.getItem.mockResolvedValue(null);

      const mockLoginFlow = async () => {
        // Simulate login steps
        await AsyncStorage.getItem('token'); // Check existing token
        await new Promise(resolve => setTimeout(resolve, 50)); // API call simulation
        await AsyncStorage.setItem('token', 'new-token'); // Store token
        await AsyncStorage.setItem('user', JSON.stringify({ id: 1 })); // Store user
      };

      memoryTracker.snapshot('login-start');
      const loginMeasurement = await measureAsync(mockLoginFlow);
      memoryTracker.snapshot('login-end');

      const memoryUsage = memoryTracker.getDelta('login-start', 'login-end');
      
      expect(loginMeasurement.durationMs).toBeLessThan(200);
      expect(memoryUsage?.heapUsed || 0).toBeLessThan(5);
      
      console.log(`Login flow: ${loginMeasurement.durationMs}ms, memory: +${memoryUsage?.heapUsed}MB`);
    });

    it('should measure token validation performance', async () => {
      const mockTokenValidation = () => {
        // Simulate JWT token validation
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
        const parts = token.split('.');
        return parts.length === 3;
      };

      const validationTest = await performanceTest(
        'Token Validation',
        mockTokenValidation,
        { threshold: 10 }
      );

      const measurement = await validationTest();
      expect(measurement.durationMs).toBeLessThan(10);
    });
  });

  describe('Data Processing Performance', () => {
    it('should measure outlet data processing', async () => {
      const mockOutlets = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `Outlet ${i}`,
        latitude: -6.2 + (Math.random() * 0.1),
        longitude: 106.8 + (Math.random() * 0.1),
        address: `Address ${i}`,
        status: i % 2 === 0 ? 'active' : 'inactive'
      }));

      const processOutlets = () => {
        return mockOutlets
          .filter(outlet => outlet.status === 'active')
          .map(outlet => ({
            ...outlet,
            distance: Math.sqrt(
              Math.pow(outlet.latitude - (-6.2088), 2) + 
              Math.pow(outlet.longitude - 106.8456, 2)
            )
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 50);
      };

      const processingTest = await measureAsync(processOutlets);
      
      expect(processingTest.durationMs).toBeLessThan(100);
      expect(processingTest.result).toHaveLength(50);
      
      console.log(`Outlet processing (500→50): ${processingTest.durationMs}ms`);
    });

    it('should measure visit data aggregation', async () => {
      const mockVisits = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        outlet_id: i % 100,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        duration: Math.floor(Math.random() * 120) + 15,
        status: ['completed', 'pending', 'cancelled'][i % 3]
      }));

      const aggregateVisits = () => {
        const byOutlet = mockVisits.reduce((acc, visit) => {
          if (!acc[visit.outlet_id]) {
            acc[visit.outlet_id] = [];
          }
          acc[visit.outlet_id].push(visit);
          return acc;
        }, {});

        return Object.entries(byOutlet).map(([outletId, visits]) => ({
          outletId: parseInt(outletId),
          totalVisits: visits.length,
          completedVisits: visits.filter(v => v.status === 'completed').length,
          averageDuration: visits.reduce((sum, v) => sum + v.duration, 0) / visits.length
        }));
      };

      const aggregationTest = await measureAsync(aggregateVisits);
      
      expect(aggregationTest.durationMs).toBeLessThan(150);
      expect(aggregationTest.result).toHaveLength(100);
      
      console.log(`Visit aggregation (1000 visits): ${aggregationTest.durationMs}ms`);
    });
  });

  describe('Performance Regression Tests', () => {
    it('should not regress API response processing', async () => {
      const mockApiResponse = {
        meta: { code: 200, status: 'success', message: 'OK' },
        data: Array.from({ length: 200 }, (_, i) => ({ id: i, value: `data-${i}` })),
        pagination: { total: 200, page: 1, per_page: 50, last_page: 4 }
      };

      const processResponse = () => {
        const { meta, data, pagination } = mockApiResponse;
        
        if (meta.code !== 200 || meta.status !== 'success') {
          throw new Error('API Error');
        }
        
        return {
          items: data.map(item => ({ ...item, processed: true })),
          totalPages: pagination.last_page,
          hasMore: pagination.page < pagination.last_page
        };
      };

      const baseline = 50; // Baseline performance expectation
      const measurement = await measureAsync(processResponse);
      
      performanceAssertions.assertDuration(measurement.duration, baseline, 0.5); // 50% tolerance
      
      console.log(`API response processing: ${measurement.durationMs}ms (baseline: ${baseline}ms)`);
    });

    it('should maintain form validation performance', async () => {
      const formData = {
        outlet_name: 'Test Outlet',
        address: '123 Test Street, Test City',
        latitude: -6.2088,
        longitude: 106.8456,
        phone: '+628123456789',
        email: 'test@example.com'
      };

      const validateForm = () => {
        const errors = {};
        
        if (!formData.outlet_name || formData.outlet_name.length < 3) {
          errors.outlet_name = 'Name must be at least 3 characters';
        }
        
        if (!formData.address || formData.address.length < 10) {
          errors.address = 'Address must be at least 10 characters';
        }
        
        if (!formData.latitude || Math.abs(formData.latitude) > 90) {
          errors.latitude = 'Invalid latitude';
        }
        
        if (!formData.longitude || Math.abs(formData.longitude) > 180) {
          errors.longitude = 'Invalid longitude';
        }
        
        if (!formData.phone || !/^\+\d{10,15}$/.test(formData.phone)) {
          errors.phone = 'Invalid phone number';
        }
        
        return { isValid: Object.keys(errors).length === 0, errors };
      };

      const validationTest = await measureAsync(validateForm);
      
      expect(validationTest.durationMs).toBeLessThan(20); // Very fast validation
      expect(validationTest.result.isValid).toBe(true);
      
      console.log(`Form validation: ${validationTest.durationMs}ms`);
    });
  });
});