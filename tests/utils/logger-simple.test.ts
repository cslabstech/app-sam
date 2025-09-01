/**
 * Logger Utility Tests - Simple Version
 * Basic tests for utils/logger.ts functionality
 */

import { log, warn, error } from '@/utils/logger';

describe('Logger Utility Tests', () => {
  let mockLog: jest.SpyInstance;
  let mockWarn: jest.SpyInstance;
  let mockError: jest.SpyInstance;
  let originalEnv: string | undefined;

  beforeEach(() => {
    mockLog = jest.spyOn(console, 'log').mockImplementation();
    mockWarn = jest.spyOn(console, 'warn').mockImplementation();
    mockError = jest.spyOn(console, 'error').mockImplementation();
    originalEnv = process.env.EXPO_PUBLIC_ENV;
  });

  afterEach(() => {
    mockLog.mockRestore();
    mockWarn.mockRestore();
    mockError.mockRestore();
    process.env.EXPO_PUBLIC_ENV = originalEnv;
  });

  describe('Basic Functionality', () => {
    it('should have log, warn, and error functions', () => {
      expect(typeof log).toBe('function');
      expect(typeof warn).toBe('function');
      expect(typeof error).toBe('function');
    });

    it('should handle multiple arguments in development', () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      
      const args = ['Message', 123, { obj: true }];
      log(...args);
      warn(...args);
      error(...args);

      expect(mockLog).toHaveBeenCalledWith(...args);
      expect(mockWarn).toHaveBeenCalledWith(...args);
      expect(mockError).toHaveBeenCalledWith(...args);
    });

    it('should handle no arguments', () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      
      log();
      warn();
      error();

      expect(mockLog).toHaveBeenCalledWith();
      expect(mockWarn).toHaveBeenCalledWith();
      expect(mockError).toHaveBeenCalledWith();
    });

    it('should handle complex objects', () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      
      const obj = { user: { id: 1 }, data: [1, 2, 3] };
      log('Test:', obj);
      
      expect(mockLog).toHaveBeenCalledWith('Test:', obj);
    });
  });

  describe('Environment Behavior', () => {
    it('should log in non-production environments', () => {
      const testCases = ['development', 'staging', '', undefined];
      
      testCases.forEach(env => {
        mockLog.mockClear();
        
        if (env === undefined) {
          delete process.env.EXPO_PUBLIC_ENV;
        } else {
          process.env.EXPO_PUBLIC_ENV = env;
        }
        
        log('Test message');
        expect(mockLog).toHaveBeenCalled();
      });
    });
  });

  describe('Default Export', () => {
    it('should provide default export', () => {
      const loggerModule = require('@/utils/logger');
      expect(loggerModule.default).toHaveProperty('log');
      expect(loggerModule.default).toHaveProperty('warn');
      expect(loggerModule.default).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should not throw on complex inputs', () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      
      const circular: any = { test: 'circular' };
      circular.self = circular;
      
      expect(() => log('Circular:', circular)).not.toThrow();
      expect(() => log('Null:', null)).not.toThrow();
      expect(() => log('Undefined:', undefined)).not.toThrow();
      expect(() => log('Function:', () => {})).not.toThrow();
    });
  });
});