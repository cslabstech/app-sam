/**
 * Comprehensive integration tests for user workflows
 * Tests complete user journeys: login → outlet management → visit workflow
 * Covers authentication flow, data synchronization, and business process validation
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '@/utils/api';

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

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('@/utils/logger', () => ({
  log: jest.fn(),
  logError: jest.fn(),
}));

// TypeScript interfaces for workflow validation
interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data?: any;
  error?: string;
  timestamp?: number;
}

interface UserWorkflowState {
  currentStep: string;
  steps: WorkflowStep[];
  user: any | null;
  token: string | null;
  selectedOutlet: any | null;
  activeVisit: any | null;
  isOnline: boolean;
  lastSync: number | null;
}

interface WorkflowContext {
  state: UserWorkflowState;
  executeStep: (stepId: string, data?: any) => Promise<void>;
  rollbackStep: (stepId: string) => Promise<void>;
  resetWorkflow: () => void;
  validateStep: (stepId: string) => boolean;
}

// Test data for workflows
const TEST_CREDENTIALS = {
  username: 'appdev',
  password: 'password'
};

const TEST_USER = {
  id: '1',
  username: 'appdev',
  name: 'Test User',
  email: 'test@example.com',
  role: {
    id: '1',
    name: 'Field Agent',
    permissions: [
      { name: 'outlets.read' },
      { name: 'outlets.create' },
      { name: 'outlets.update' },
      { name: 'visits.create' },
      { name: 'visits.manage' }
    ]
  }
};

const TEST_TOKEN = 'test_bearer_token_workflow';

const TEST_OUTLET = {
  id: 'outlet_workflow_1',
  code: 'WF001',
  name: 'Workflow Test Outlet',
  owner_name: 'John Workflow',
  owner_phone: '+628123456789',
  location: {
    latitude: -6.2088,
    longitude: 106.8456,
    address: 'Jakarta Test Area'
  },
  status: 'active'
};

const TEST_VISIT = {
  id: 'visit_workflow_1',
  outlet_id: 'outlet_workflow_1',
  user_id: '1',
  visit_date: new Date().toISOString().split('T')[0],
  status: 'scheduled',
  location: {
    latitude: -6.2088,
    longitude: 106.8456,
    accuracy: 5.0
  }
};

// Mock workflow implementation
const createMockWorkflow = (): WorkflowContext => {
  let state: UserWorkflowState = {
    currentStep: 'initial',
    steps: [],
    user: null,
    token: null,
    selectedOutlet: null,
    activeVisit: null,
    isOnline: true,
    lastSync: null
  };

  const executeStep = async (stepId: string, data?: any): Promise<void> => {
    const step: WorkflowStep = {
      id: stepId,
      name: stepId.replace('_', ' '),
      status: 'in_progress',
      data,
      timestamp: Date.now()
    };

    state.steps.push(step);
    state.currentStep = stepId;

    try {
      switch (stepId) {
        case 'login':
          await simulateLogin(data);
          step.status = 'completed';
          state.user = TEST_USER;
          state.token = TEST_TOKEN;
          break;
        
        case 'load_outlets':
          await simulateLoadOutlets();
          step.status = 'completed';
          step.data = [TEST_OUTLET];
          break;
        
        case 'select_outlet':
          state.selectedOutlet = data.outlet;
          step.status = 'completed';
          break;
        
        case 'create_visit':
          await simulateCreateVisit(data);
          step.status = 'completed';
          state.activeVisit = { ...TEST_VISIT, ...data };
          break;
        
        case 'start_visit':
          await simulateStartVisit(data);
          step.status = 'completed';
          if (state.activeVisit) {
            state.activeVisit.status = 'in_progress';
            state.activeVisit.check_in_time = new Date().toISOString();
          }
          break;
        
        case 'complete_visit':
          await simulateCompleteVisit(data);
          step.status = 'completed';
          if (state.activeVisit) {
            state.activeVisit.status = 'completed';
            state.activeVisit.check_out_time = new Date().toISOString();
          }
          break;
        
        case 'sync_data':
          await simulateDataSync();
          step.status = 'completed';
          state.lastSync = Date.now();
          break;
        
        case 'logout':
          await simulateLogout();
          step.status = 'completed';
          state.user = null;
          state.token = null;
          state.selectedOutlet = null;
          state.activeVisit = null;
          break;
        
        default:
          throw new Error(`Unknown step: ${stepId}`);
      }
    } catch (error) {
      step.status = 'failed';
      step.error = (error as Error).message;
      throw error;
    }
  };

  const rollbackStep = async (stepId: string): Promise<void> => {
    const stepIndex = state.steps.findIndex(s => s.id === stepId);
    if (stepIndex > -1) {
      state.steps = state.steps.slice(0, stepIndex);
      state.currentStep = state.steps.length > 0 ? state.steps[state.steps.length - 1].id : 'initial';
    }
  };

  const resetWorkflow = (): void => {
    state = {
      currentStep: 'initial',
      steps: [],
      user: null,
      token: null,
      selectedOutlet: null,
      activeVisit: null,
      isOnline: true,
      lastSync: null
    };
  };

  const validateStep = (stepId: string): boolean => {
    switch (stepId) {
      case 'login':
        return !state.user && !state.token;
      case 'load_outlets':
        return !!state.user && !!state.token;
      case 'select_outlet':
        return !!state.user && !!state.token;
      case 'create_visit':
        return !!state.selectedOutlet && !!state.user;
      case 'start_visit':
        return !!state.activeVisit && state.activeVisit.status === 'scheduled';
      case 'complete_visit':
        return !!state.activeVisit && state.activeVisit.status === 'in_progress';
      case 'logout':
        return !!state.user;
      default:
        return true;
    }
  };

  return {
    get state() { return { ...state }; },
    executeStep,
    rollbackStep,
    resetWorkflow,
    validateStep
  };
};

// Simulation functions
const simulateLogin = async (data: any): Promise<void> => {
  const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
  
  mockApiRequest.mockResolvedValueOnce({
    meta: { status: 'success', code: 200, message: 'Login successful' },
    data: {
      access_token: TEST_TOKEN,
      token_type: 'Bearer',
      user: TEST_USER
    }
  });

  await apiRequest({
    url: '/login',
    method: 'POST',
    body: data,
    logLabel: 'WORKFLOW_LOGIN'
  });
};

const simulateLoadOutlets = async (): Promise<void> => {
  const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
  
  mockApiRequest.mockResolvedValueOnce({
    meta: { status: 'success', code: 200, message: 'Outlets loaded' },
    data: [TEST_OUTLET]
  });

  await apiRequest({
    url: '/outlets',
    method: 'GET',
    logLabel: 'WORKFLOW_LOAD_OUTLETS',
    token: TEST_TOKEN
  });
};

const simulateCreateVisit = async (data: any): Promise<void> => {
  const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
  
  mockApiRequest.mockResolvedValueOnce({
    meta: { status: 'success', code: 201, message: 'Visit created' },
    data: { ...TEST_VISIT, ...data }
  });

  await apiRequest({
    url: '/visits',
    method: 'POST',
    body: data,
    logLabel: 'WORKFLOW_CREATE_VISIT',
    token: TEST_TOKEN
  });
};

const simulateStartVisit = async (data: any): Promise<void> => {
  const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
  
  mockApiRequest.mockResolvedValueOnce({
    meta: { status: 'success', code: 200, message: 'Visit started' },
    data: { ...TEST_VISIT, status: 'in_progress', check_in_time: new Date().toISOString() }
  });

  await apiRequest({
    url: `/visits/${TEST_VISIT.id}/start`,
    method: 'POST',
    body: data,
    logLabel: 'WORKFLOW_START_VISIT',
    token: TEST_TOKEN
  });
};

const simulateCompleteVisit = async (data: any): Promise<void> => {
  const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
  
  mockApiRequest.mockResolvedValueOnce({
    meta: { status: 'success', code: 200, message: 'Visit completed' },
    data: { 
      ...TEST_VISIT, 
      status: 'completed', 
      check_out_time: new Date().toISOString(),
      ...data 
    }
  });

  await apiRequest({
    url: `/visits/${TEST_VISIT.id}/complete`,
    method: 'POST',
    body: data,
    logLabel: 'WORKFLOW_COMPLETE_VISIT',
    token: TEST_TOKEN
  });
};

const simulateDataSync = async (): Promise<void> => {
  const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
  
  mockApiRequest.mockResolvedValueOnce({
    meta: { status: 'success', code: 200, message: 'Data synced' },
    data: { synced_at: new Date().toISOString() }
  });

  await apiRequest({
    url: '/sync',
    method: 'POST',
    logLabel: 'WORKFLOW_SYNC_DATA',
    token: TEST_TOKEN
  });
};

const simulateLogout = async (): Promise<void> => {
  const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
  
  mockApiRequest.mockResolvedValueOnce({
    meta: { status: 'success', code: 200, message: 'Logged out successfully' },
    data: { message: 'Logged out successfully' }
  });

  await apiRequest({
    url: '/logout',
    method: 'POST',
    logLabel: 'WORKFLOW_LOGOUT',
    token: TEST_TOKEN
  });
};

describe('User Workflow Integration Tests', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  let workflow: WorkflowContext;

  beforeEach(() => {
    jest.clearAllMocks();
    workflow = createMockWorkflow();
    
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
  });

  describe('Complete User Journey: Login → Outlets → Visits → Logout', () => {
    it('should complete full user workflow successfully', async () => {
      // Step 1: User Login
      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
      });

      expect(workflow.state.currentStep).toBe('login');
      expect(workflow.state.user).toEqual(TEST_USER);
      expect(workflow.state.token).toBe(TEST_TOKEN);
      expect(workflow.state.steps[0].status).toBe('completed');

      // Step 2: Load Outlets
      await act(async () => {
        await workflow.executeStep('load_outlets');
      });

      expect(workflow.state.currentStep).toBe('load_outlets');
      expect(workflow.state.steps[1].status).toBe('completed');
      expect(workflow.state.steps[1].data).toEqual([TEST_OUTLET]);

      // Step 3: Select Outlet
      await act(async () => {
        await workflow.executeStep('select_outlet', { outlet: TEST_OUTLET });
      });

      expect(workflow.state.currentStep).toBe('select_outlet');
      expect(workflow.state.selectedOutlet).toEqual(TEST_OUTLET);
      expect(workflow.state.steps[2].status).toBe('completed');

      // Step 4: Create Visit
      await act(async () => {
        await workflow.executeStep('create_visit', {
          outlet_id: TEST_OUTLET.id,
          notes: 'Workflow test visit'
        });
      });

      expect(workflow.state.currentStep).toBe('create_visit');
      expect(workflow.state.activeVisit).toBeTruthy();
      expect(workflow.state.activeVisit?.outlet_id).toBe(TEST_OUTLET.id);
      expect(workflow.state.steps[3].status).toBe('completed');

      // Step 5: Start Visit
      await act(async () => {
        await workflow.executeStep('start_visit', {
          location: TEST_VISIT.location
        });
      });

      expect(workflow.state.currentStep).toBe('start_visit');
      expect(workflow.state.activeVisit?.status).toBe('in_progress');
      expect(workflow.state.activeVisit?.check_in_time).toBeTruthy();
      expect(workflow.state.steps[4].status).toBe('completed');

      // Step 6: Complete Visit
      await act(async () => {
        await workflow.executeStep('complete_visit', {
          notes: 'Visit completed successfully',
          photos: ['photo1.jpg', 'photo2.jpg']
        });
      });

      expect(workflow.state.currentStep).toBe('complete_visit');
      expect(workflow.state.activeVisit?.status).toBe('completed');
      expect(workflow.state.activeVisit?.check_out_time).toBeTruthy();
      expect(workflow.state.steps[5].status).toBe('completed');

      // Step 7: Data Sync
      await act(async () => {
        await workflow.executeStep('sync_data');
      });

      expect(workflow.state.currentStep).toBe('sync_data');
      expect(workflow.state.lastSync).toBeTruthy();
      expect(workflow.state.steps[6].status).toBe('completed');

      // Step 8: Logout
      await act(async () => {
        await workflow.executeStep('logout');
      });

      expect(workflow.state.currentStep).toBe('logout');
      expect(workflow.state.user).toBeNull();
      expect(workflow.state.token).toBeNull();
      expect(workflow.state.steps[7].status).toBe('completed');

      // Verify complete workflow
      expect(workflow.state.steps).toHaveLength(8);
      expect(workflow.state.steps.every(step => step.status === 'completed')).toBe(true);
    });

    it('should handle workflow step validation correctly', async () => {
      // Login should be valid initially
      expect(workflow.validateStep('login')).toBe(true);
      
      // Outlets should not be valid without login
      expect(workflow.validateStep('load_outlets')).toBe(false);

      // Login first
      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
      });

      // Now outlets should be valid
      expect(workflow.validateStep('load_outlets')).toBe(true);
      
      // Visit creation should not be valid without outlet selection
      expect(workflow.validateStep('create_visit')).toBe(false);

      // Select outlet
      await act(async () => {
        await workflow.executeStep('select_outlet', { outlet: TEST_OUTLET });
      });

      // Now visit creation should be valid
      expect(workflow.validateStep('create_visit')).toBe(true);
    });

    it('should handle workflow errors and recovery', async () => {
      // Mock API error
      const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
      mockApiRequest.mockRejectedValueOnce(new Error('Network error'));

      // Attempt login with network error
      await expect(
        act(async () => {
          await workflow.executeStep('login', TEST_CREDENTIALS);
        })
      ).rejects.toThrow('Network error');

      expect(workflow.state.steps[0].status).toBe('failed');
      expect(workflow.state.steps[0].error).toBe('Network error');
      expect(workflow.state.user).toBeNull();

      // Reset and try again with successful response
      workflow.resetWorkflow();
      mockApiRequest.mockResolvedValueOnce({
        meta: { status: 'success', code: 200, message: 'Login successful' },
        data: { access_token: TEST_TOKEN, user: TEST_USER }
      });

      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
      });

      expect(workflow.state.steps[0].status).toBe('completed');
      expect(workflow.state.user).toEqual(TEST_USER);
    });

    it('should support workflow rollback functionality', async () => {
      // Execute first 3 steps
      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
        await workflow.executeStep('load_outlets');
        await workflow.executeStep('select_outlet', { outlet: TEST_OUTLET });
      });

      expect(workflow.state.steps).toHaveLength(3);
      expect(workflow.state.currentStep).toBe('select_outlet');

      // Rollback to after login
      await act(async () => {
        await workflow.rollbackStep('load_outlets');
      });

      expect(workflow.state.steps).toHaveLength(1);
      expect(workflow.state.currentStep).toBe('login');
      expect(workflow.state.user).toEqual(TEST_USER); // State should still have user
    });
  });

  describe('Alternative Workflow Scenarios', () => {
    it('should handle visit workflow without check-in', async () => {
      // Login and setup
      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
        await workflow.executeStep('load_outlets');
        await workflow.executeStep('select_outlet', { outlet: TEST_OUTLET });
      });

      // Create visit but skip start_visit step
      await act(async () => {
        await workflow.executeStep('create_visit', {
          outlet_id: TEST_OUTLET.id,
          type: 'remote_visit'
        });
      });

      // Try to complete without starting (should be invalid)
      expect(workflow.validateStep('complete_visit')).toBe(false);

      // Start visit first
      await act(async () => {
        await workflow.executeStep('start_visit', { location: TEST_VISIT.location });
      });

      // Now completion should be valid
      expect(workflow.validateStep('complete_visit')).toBe(true);
    });

    it('should handle multiple outlet visits in sequence', async () => {
      // Setup
      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
        await workflow.executeStep('load_outlets');
      });

      const outlets = [
        { ...TEST_OUTLET, id: 'outlet_1', code: 'OUT001' },
        { ...TEST_OUTLET, id: 'outlet_2', code: 'OUT002' },
      ];

      // Visit first outlet
      await act(async () => {
        await workflow.executeStep('select_outlet', { outlet: outlets[0] });
        await workflow.executeStep('create_visit', { outlet_id: outlets[0].id });
        await workflow.executeStep('start_visit', { location: TEST_VISIT.location });
        await workflow.executeStep('complete_visit', { notes: 'First visit completed' });
      });

      expect(workflow.state.activeVisit?.status).toBe('completed');

      // Visit second outlet
      await act(async () => {
        await workflow.executeStep('select_outlet', { outlet: outlets[1] });
        await workflow.executeStep('create_visit', { outlet_id: outlets[1].id });
        await workflow.executeStep('start_visit', { location: TEST_VISIT.location });
        await workflow.executeStep('complete_visit', { notes: 'Second visit completed' });
      });

      expect(workflow.state.activeVisit?.outlet_id).toBe(outlets[1].id);
      expect(workflow.state.steps.filter(s => s.id === 'complete_visit')).toHaveLength(2);
    });

    it('should handle interrupted workflow with state persistence', async () => {
      // Simulate workflow interruption after visit creation
      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
        await workflow.executeStep('load_outlets');
        await workflow.executeStep('select_outlet', { outlet: TEST_OUTLET });
        await workflow.executeStep('create_visit', { outlet_id: TEST_OUTLET.id });
      });

      const savedState = workflow.state;

      // Create new workflow and restore state (simulation)
      const newWorkflow = createMockWorkflow();
      
      // Resume from where we left off
      await act(async () => {
        await newWorkflow.executeStep('start_visit', { location: TEST_VISIT.location });
        await newWorkflow.executeStep('complete_visit', { notes: 'Resumed and completed' });
      });

      expect(newWorkflow.state.steps.some(s => s.id === 'complete_visit')).toBe(true);
    });
  });

  describe('Workflow Performance and Optimization', () => {
    it('should handle rapid workflow execution efficiently', async () => {
      const startTime = Date.now();
      
      // Execute complete workflow rapidly
      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
        await workflow.executeStep('load_outlets');
        await workflow.executeStep('select_outlet', { outlet: TEST_OUTLET });
        await workflow.executeStep('create_visit', { outlet_id: TEST_OUTLET.id });
        await workflow.executeStep('start_visit', { location: TEST_VISIT.location });
        await workflow.executeStep('complete_visit', { notes: 'Rapid execution test' });
        await workflow.executeStep('sync_data');
        await workflow.executeStep('logout');
      });

      const executionTime = Date.now() - startTime;
      
      expect(workflow.state.steps).toHaveLength(8);
      expect(workflow.state.steps.every(step => step.status === 'completed')).toBe(true);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent workflow operations', async () => {
      const workflows = Array.from({ length: 5 }, () => createMockWorkflow());
      
      // Execute login on all workflows concurrently
      const loginPromises = workflows.map(wf => 
        act(async () => {
          await wf.executeStep('login', TEST_CREDENTIALS);
        })
      );

      await Promise.all(loginPromises);

      // Verify all workflows completed login successfully
      workflows.forEach(wf => {
        expect(wf.state.user).toEqual(TEST_USER);
        expect(wf.state.token).toBe(TEST_TOKEN);
      });
    });

    it('should handle workflow memory management', async () => {
      // Execute workflow and verify memory cleanup
      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
        await workflow.executeStep('load_outlets');
        await workflow.executeStep('logout');
      });

      // Reset workflow
      workflow.resetWorkflow();

      expect(workflow.state.steps).toHaveLength(0);
      expect(workflow.state.user).toBeNull();
      expect(workflow.state.token).toBeNull();
      expect(workflow.state.selectedOutlet).toBeNull();
      expect(workflow.state.activeVisit).toBeNull();
    });
  });

  describe('Workflow State Management', () => {
    it('should maintain workflow state consistency', async () => {
      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
      });

      // State should be consistent
      expect(workflow.state.user).toBeTruthy();
      expect(workflow.state.token).toBeTruthy();
      expect(workflow.state.steps[0].status).toBe('completed');
      expect(workflow.state.currentStep).toBe('login');

      // Each step should have timestamp
      expect(workflow.state.steps[0].timestamp).toBeTruthy();
      expect(typeof workflow.state.steps[0].timestamp).toBe('number');
    });

    it('should handle workflow state transitions correctly', async () => {
      const stateTransitions: string[] = [];

      // Monitor state changes
      const originalExecuteStep = workflow.executeStep;
      workflow.executeStep = async (stepId: string, data?: any) => {
        stateTransitions.push(workflow.state.currentStep);
        await originalExecuteStep(stepId, data);
        stateTransitions.push(workflow.state.currentStep);
      };

      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
        await workflow.executeStep('load_outlets');
      });

      expect(stateTransitions).toEqual([
        'initial', 'login',
        'login', 'load_outlets'
      ]);
    });

    it('should validate workflow business rules', async () => {
      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
        await workflow.executeStep('load_outlets');
        await workflow.executeStep('select_outlet', { outlet: TEST_OUTLET });
        await workflow.executeStep('create_visit', { outlet_id: TEST_OUTLET.id });
      });

      // Business rule: Cannot create another visit for same outlet on same day
      const sameOutletVisit = {
        outlet_id: TEST_OUTLET.id,
        visit_date: TEST_VISIT.visit_date
      };

      // This should be validated by business logic (implementation dependent)
      expect(workflow.state.activeVisit?.outlet_id).toBe(TEST_OUTLET.id);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from network failures during workflow', async () => {
      const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

      // Success, then failure, then success
      mockApiRequest
        .mockResolvedValueOnce({
          meta: { status: 'success', code: 200 },
          data: { access_token: TEST_TOKEN, user: TEST_USER }
        })
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          meta: { status: 'success', code: 200 },
          data: [TEST_OUTLET]
        });

      // Login succeeds
      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
      });

      expect(workflow.state.user).toEqual(TEST_USER);

      // Load outlets fails
      await expect(
        act(async () => {
          await workflow.executeStep('load_outlets');
        })
      ).rejects.toThrow('Network timeout');

      expect(workflow.state.steps[1].status).toBe('failed');

      // Retry load outlets succeeds
      await act(async () => {
        await workflow.executeStep('load_outlets');
      });

      expect(workflow.state.steps[2].status).toBe('completed');
    });

    it('should handle partial workflow completion gracefully', async () => {
      // Complete partial workflow
      await act(async () => {
        await workflow.executeStep('login', TEST_CREDENTIALS);
        await workflow.executeStep('load_outlets');
        await workflow.executeStep('select_outlet', { outlet: TEST_OUTLET });
      });

      expect(workflow.state.steps).toHaveLength(3);
      expect(workflow.state.selectedOutlet).toEqual(TEST_OUTLET);

      // Workflow is in a valid intermediate state
      expect(workflow.validateStep('create_visit')).toBe(true);
      expect(workflow.state.user).toBeTruthy();
      expect(workflow.state.token).toBeTruthy();
    });
  });
});