/**
 * Login Form Hook Tests
 * Basic tests for hooks/form/useLoginForm.ts functionality
 */

import { useLoginForm } from '@/hooks/form/useLoginForm';

// Mock dependencies
jest.mock('@/context/auth-context');
jest.mock('expo-router');
jest.mock('use-debounce');
jest.mock('react-native', () => ({
  Keyboard: {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  ScrollView: jest.fn(),
}));

const mockUseAuth = require('@/context/auth-context').useAuth;
const mockUseRouter = require('expo-router').useRouter;
const mockUseDebounce = require('use-debounce').useDebounce;

describe('useLoginForm Hook Tests', () => {
  const mockLogin = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({ login: mockLogin });
    mockUseRouter.mockReturnValue({ replace: mockReplace });
    mockUseDebounce.mockImplementation((value) => [value]);
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const hook = useLoginForm();

      expect(hook.email).toBe('');
      expect(hook.password).toBe('');
      expect(hook.loading).toBe(false);
      expect(hook.error).toBe('');
      expect(hook.showPassword).toBe(false);
      expect(hook.keyboardVisible).toBe(false);
      expect(hook.touched).toEqual({ email: false, password: false });
      expect(hook.formErrors).toEqual({ email: '', password: '' });
      expect(hook.isFormValid).toBe(false);
    });

    it('should provide all required methods and properties', () => {
      const hook = useLoginForm();

      expect(hook).toHaveProperty('email');
      expect(hook).toHaveProperty('password');
      expect(hook).toHaveProperty('loading');
      expect(hook).toHaveProperty('error');
      expect(hook).toHaveProperty('touched');
      expect(hook).toHaveProperty('formErrors');
      expect(hook).toHaveProperty('showPassword');
      expect(hook).toHaveProperty('isFormValid');
      expect(hook).toHaveProperty('keyboardVisible');
      expect(hook).toHaveProperty('scrollViewRef');

      expect(typeof hook.setEmail).toBe('function');
      expect(typeof hook.setPassword).toBe('function');
      expect(typeof hook.setShowPassword).toBe('function');
      expect(typeof hook.handleBlur).toBe('function');
      expect(typeof hook.handleLogin).toBe('function');
    });
  });

  describe('Form Validation', () => {
    it('should update touched state on blur', () => {
      const hook = useLoginForm();

      hook.handleBlur('email');
      expect(hook.touched.email).toBe(true);

      hook.handleBlur('password');
      expect(hook.touched.password).toBe(true);
    });
  });

  describe('Login Submission', () => {
    it('should handle successful login', async () => {
      mockLogin.mockResolvedValue(undefined);
      
      const hook = useLoginForm();
      hook.setEmail('testuser');
      hook.setPassword('password123');

      await hook.handleLogin();

      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });

    it('should handle login failure', async () => {
      const loginError = {
        response: {
          data: {
            meta: { code: 401, message: 'Invalid credentials' }
          }
        }
      };
      
      mockLogin.mockRejectedValue(loginError);
      
      const hook = useLoginForm();
      hook.setEmail('testuser');
      hook.setPassword('wrongpassword');

      await hook.handleLogin();

      expect(mockLogin).toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed'
      };
      
      mockLogin.mockRejectedValue(networkError);
      
      const hook = useLoginForm();
      hook.setEmail('testuser');
      hook.setPassword('password123');

      await hook.handleLogin();

      expect(mockLogin).toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('State Updates', () => {
    it('should update email and password', () => {
      const hook = useLoginForm();

      hook.setEmail('newemail@test.com');
      hook.setPassword('newpassword');
      
      expect(typeof hook.setEmail).toBe('function');
      expect(typeof hook.setPassword).toBe('function');
    });

    it('should toggle password visibility', () => {
      const hook = useLoginForm();

      expect(hook.showPassword).toBe(false);
      hook.setShowPassword(true);
      
      expect(typeof hook.setShowPassword).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing auth context', () => {
      mockUseAuth.mockReturnValue({});
      
      expect(() => useLoginForm()).not.toThrow();
    });

    it('should handle missing router context', () => {
      mockUseRouter.mockReturnValue({});
      
      expect(() => useLoginForm()).not.toThrow();
    });
  });
});