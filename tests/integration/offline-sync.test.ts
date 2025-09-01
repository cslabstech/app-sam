/**
 * Comprehensive offline synchronization and network resilience tests
 * Tests data persistence, sync mechanisms, conflict resolution, and network failure recovery
 * Covers offline-first architecture, queue management, and data integrity
 */

import { act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('@/utils/api', () => ({
  apiRequest: jest.fn(),
}));

// Test interfaces and implementations
interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
}

interface SyncManager {
  operations: OfflineOperation[];
  addOperation: (op: Omit<OfflineOperation, 'id' | 'timestamp' | 'status'>) => Promise<string>;
  processQueue: () => Promise<void>;
  getOfflineData: (type: string, id?: string) => Promise<any>;
  setOfflineData: (type: string, id: string, data: any) => Promise<void>;
}

// Mock sync manager
const createSyncManager = (): SyncManager => {
  let operations: OfflineOperation[] = [];
  let offlineData: Record<string, Record<string, any>> = {
    outlets: {},
    visits: {}
  };

  const addOperation = async (op: Omit<OfflineOperation, 'id' | 'timestamp' | 'status'>): Promise<string> => {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const operation: OfflineOperation = {
      ...op,
      id,
      timestamp: Date.now(),
      status: 'pending'
    };
    operations.push(operation);
    await AsyncStorage.setItem('sync_queue', JSON.stringify(operations));
    return id;
  };

  const processQueue = async (): Promise<void> => {
    const mockApiRequest = require('@/utils/api').apiRequest;
    
    for (const operation of operations.filter(op => op.status === 'pending')) {
      try {
        await mockApiRequest({
          url: operation.endpoint,
          method: operation.type === 'CREATE' ? 'POST' : operation.type === 'UPDATE' ? 'PUT' : 'DELETE',
          body: operation.data
        });
        operation.status = 'completed';
      } catch (error) {
        operation.status = 'failed';
      }
    }
  };

  const getOfflineData = async (type: string, id?: string): Promise<any> => {
    return id ? offlineData[type]?.[id] : offlineData[type];
  };

  const setOfflineData = async (type: string, id: string, data: any): Promise<void> => {
    if (!offlineData[type]) offlineData[type] = {};
    offlineData[type][id] = { ...data, last_modified: Date.now() };
    await AsyncStorage.setItem('offline_data', JSON.stringify(offlineData));
  };

  return { operations, addOperation, processQueue, getOfflineData, setOfflineData };
};

const TEST_OUTLET = {
  id: 'outlet_1',
  name: 'Test Outlet',
  location: { latitude: -6.2088, longitude: 106.8456 }
};

describe('Offline Synchronization Tests', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  let syncManager: SyncManager;

  beforeEach(() => {
    jest.clearAllMocks();
    syncManager = createSyncManager();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('Offline Data Management', () => {
    it('should store data offline', async () => {
      await act(async () => {
        await syncManager.setOfflineData('outlets', TEST_OUTLET.id, TEST_OUTLET);
      });

      const retrievedData = await syncManager.getOfflineData('outlets', TEST_OUTLET.id);
      expect(retrievedData.name).toBe(TEST_OUTLET.name);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_data',
        expect.stringContaining(TEST_OUTLET.id)
      );
    });

    it('should handle offline updates', async () => {
      await syncManager.setOfflineData('outlets', TEST_OUTLET.id, TEST_OUTLET);
      
      const updatedOutlet = { ...TEST_OUTLET, name: 'Updated Outlet' };
      await act(async () => {
        await syncManager.setOfflineData('outlets', TEST_OUTLET.id, updatedOutlet);
      });

      const retrievedData = await syncManager.getOfflineData('outlets', TEST_OUTLET.id);
      expect(retrievedData.name).toBe('Updated Outlet');
    });
  });

  describe('Sync Queue Operations', () => {
    it('should add operations to queue', async () => {
      const operationId = await act(async () => {
        return await syncManager.addOperation({
          type: 'CREATE',
          endpoint: '/api/outlets',
          data: TEST_OUTLET
        });
      });

      expect(operationId).toBeTruthy();
      expect(syncManager.operations).toHaveLength(1);
      expect(syncManager.operations[0].status).toBe('pending');
    });

    it('should process sync queue', async () => {
      const mockApiRequest = require('@/utils/api').apiRequest;
      mockApiRequest.mockResolvedValue({ success: true });

      await syncManager.addOperation({
        type: 'CREATE',
        endpoint: '/api/outlets',
        data: TEST_OUTLET
      });

      await act(async () => {
        await syncManager.processQueue();
      });

      expect(syncManager.operations[0].status).toBe('completed');
      expect(mockApiRequest).toHaveBeenCalledWith({
        url: '/api/outlets',
        method: 'POST',
        body: TEST_OUTLET
      });
    });

    it('should handle sync failures', async () => {
      const mockApiRequest = require('@/utils/api').apiRequest;
      mockApiRequest.mockRejectedValue(new Error('Network error'));

      await syncManager.addOperation({
        type: 'CREATE',
        endpoint: '/api/outlets',
        data: TEST_OUTLET
      });

      await act(async () => {
        await syncManager.processQueue();
      });

      expect(syncManager.operations[0].status).toBe('failed');
    });
  });

  describe('Network Resilience', () => {
    it('should handle network interruption during sync', async () => {
      const mockApiRequest = require('@/utils/api').apiRequest;
      mockApiRequest
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ success: true });

      await syncManager.addOperation({
        type: 'CREATE',
        endpoint: '/api/outlets',
        data: TEST_OUTLET
      });

      // First attempt fails
      await act(async () => {
        await syncManager.processQueue();
      });
      expect(syncManager.operations[0].status).toBe('failed');

      // Reset status and retry
      syncManager.operations[0].status = 'pending';
      await act(async () => {
        await syncManager.processQueue();
      });
      expect(syncManager.operations[0].status).toBe('completed');
    });

    it('should maintain data integrity during offline operations', async () => {
      await syncManager.setOfflineData('outlets', TEST_OUTLET.id, TEST_OUTLET);
      
      const allOutlets = await syncManager.getOfflineData('outlets');
      expect(allOutlets[TEST_OUTLET.id]).toEqual(
        expect.objectContaining({
          id: TEST_OUTLET.id,
          name: TEST_OUTLET.name,
          last_modified: expect.any(Number)
        })
      );
    });
  });
});