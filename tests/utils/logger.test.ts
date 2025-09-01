/**
 * Logger Utility Tests
 * Comprehensive tests for utils/logger.ts functionality
 * 
 * Tests cover:
 * - log, warn, error functions
 * - Environment-based logging behavior
 * - Console output validation
 * - Production mode suppression
 */

// Mock console methods before importing logger
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

// Mock process.env
const originalEnv = process.env.EXPO_PUBLIC_ENV;

describe('Logger Utility Tests', () => {
  let mockLog: jest.SpyInstance;
  let mockWarn: jest.SpyInstance;
  let mockError: jest.SpyInstance;

  beforeEach(() => {
    mockLog = jest.spyOn(console, 'log').mockImplementation();
    mockWarn = jest.spyOn(console, 'warn').mockImplementation();
    mockError = jest.spyOn(console, 'error').mockImplementation();
    
    // Clear module cache to ensure fresh import for each test
    jest.resetModules();
  });

  afterEach(() => {
    mockLog.mockRestore();
    mockWarn.mockRestore();
    mockError.mockRestore();
    
    // Restore original environment
    process.env.EXPO_PUBLIC_ENV = originalEnv;
  });

  afterAll(() => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  });

  describe('Development Environment Logging', () => {
    it('should log messages in development environment', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log } = await import('@/utils/logger');
      
      const testMessage = 'Test log message';
      const testData = { key: 'value' };

      log(testMessage, testData);

      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(testMessage, testData);
    });

    it('should warn messages in development environment', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { warn } = await import('@/utils/logger');
      
      const testWarning = 'Test warning message';
      const testContext = { context: 'test' };

      warn(testWarning, testContext);

      expect(mockWarn).toHaveBeenCalledTimes(1);
      expect(mockWarn).toHaveBeenCalledWith(testWarning, testContext);
    });

    it('should error messages in development environment', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { error } = await import('@/utils/logger');
      
      const testError = 'Test error message';
      const errorDetails = { code: 500, stack: 'test-stack' };

      error(testError, errorDetails);

      expect(mockError).toHaveBeenCalledTimes(1);
      expect(mockError).toHaveBeenCalledWith(testError, errorDetails);
    });

    it('should handle multiple arguments', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log, warn, error } = await import('@/utils/logger');
      
      const args = ['Message', 123, { obj: true }, ['array'], null, undefined];

      log(...args);
      warn(...args);
      error(...args);

      expect(mockLog).toHaveBeenCalledWith(...args);
      expect(mockWarn).toHaveBeenCalledWith(...args);
      expect(mockError).toHaveBeenCalledWith(...args);
    });

    it('should handle no arguments', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log, warn, error } = await import('@/utils/logger');
      
      log();
      warn();
      error();

      expect(mockLog).toHaveBeenCalledWith();
      expect(mockWarn).toHaveBeenCalledWith();
      expect(mockError).toHaveBeenCalledWith();
    });

    it('should handle complex objects', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log, warn, error } = await import('@/utils/logger');
      
      const complexObject = {
        user: { id: 1, name: 'Test User' },
        metadata: { timestamp: Date.now(), version: '1.0.0' },
        actions: ['login', 'navigate', 'logout'],
      };

      log('Complex object log:', complexObject);
      warn('Complex object warning:', complexObject);
      error('Complex object error:', complexObject);

      expect(mockLog).toHaveBeenCalledWith('Complex object log:', complexObject);
      expect(mockWarn).toHaveBeenCalledWith('Complex object warning:', complexObject);
      expect(mockError).toHaveBeenCalledWith('Complex object error:', complexObject);
    });
  });

  describe('Production Environment Logging', () => {
    it('should NOT log messages in production environment', async () => {
      process.env.EXPO_PUBLIC_ENV = 'production';
      const { log } = await import('@/utils/logger');
      
      const testMessage = 'Production test log message';

      log(testMessage);

      expect(mockLog).not.toHaveBeenCalled();
    });

    it('should NOT warn messages in production environment', async () => {
      process.env.EXPO_PUBLIC_ENV = 'production';
      const { warn } = await import('@/utils/logger');
      
      const testWarning = 'Production test warning message';

      warn(testWarning);

      expect(mockWarn).not.toHaveBeenCalled();
    });

    it('should NOT error messages in production environment', async () => {
      process.env.EXPO_PUBLIC_ENV = 'production';
      const { error } = await import('@/utils/logger');
      
      const testError = 'Production test error message';

      error(testError);

      expect(mockError).not.toHaveBeenCalled();
    });

    it('should NOT log multiple calls in production', async () => {
      process.env.EXPO_PUBLIC_ENV = 'production';
      const { log, warn, error } = await import('@/utils/logger');
      
      log('Message 1');
      log('Message 2');
      warn('Warning 1');
      warn('Warning 2');
      error('Error 1');
      error('Error 2');

      expect(mockLog).not.toHaveBeenCalled();
      expect(mockWarn).not.toHaveBeenCalled();
      expect(mockError).not.toHaveBeenCalled();
    });
  });

  describe('Environment Edge Cases', () => {
    it('should log when EXPO_PUBLIC_ENV is undefined', async () => {
      delete process.env.EXPO_PUBLIC_ENV;
      const { log } = await import('@/utils/logger');

      log('Undefined env test');

      expect(mockLog).toHaveBeenCalledWith('Undefined env test');
    });

    it('should log when EXPO_PUBLIC_ENV is empty string', async () => {
      process.env.EXPO_PUBLIC_ENV = '';
      const { log } = await import('@/utils/logger');

      log('Empty env test');

      expect(mockLog).toHaveBeenCalledWith('Empty env test');
    });

    it('should log when EXPO_PUBLIC_ENV is "development"', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log } = await import('@/utils/logger');

      log('Development env test');

      expect(mockLog).toHaveBeenCalledWith('Development env test');
    });

    it('should log when EXPO_PUBLIC_ENV is "staging"', async () => {
      process.env.EXPO_PUBLIC_ENV = 'staging';
      const { log } = await import('@/utils/logger');

      log('Staging env test');

      expect(mockLog).toHaveBeenCalledWith('Staging env test');
    });

    it('should NOT log when EXPO_PUBLIC_ENV is "production"', async () => {
      process.env.EXPO_PUBLIC_ENV = 'production';
      const { log } = await import('@/utils/logger');

      log('Production env test');

      expect(mockLog).not.toHaveBeenCalled();
    });
  });

  describe('Logger Integration Scenarios', () => {
    it('should handle error logging with stack trace', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { error } = await import('@/utils/logger');
      
      const testError = new Error('Test error with stack');
      const context = 'API_REQUEST_FAILURE';

      error(`[${context}]`, testError.message, testError.stack);

      expect(mockError).toHaveBeenCalledWith(
        `[${context}]`,
        testError.message,
        testError.stack
      );
    });

    it('should handle structured logging', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log } = await import('@/utils/logger');
      
      const logEntry = {
        level: 'info',
        message: 'User action performed',
        timestamp: new Date().toISOString(),
        userId: '123',
        action: 'login',
        metadata: {
          device: 'mobile',
          version: '1.0.0',
        },
      };

      log(logEntry);

      expect(mockLog).toHaveBeenCalledWith(logEntry);
    });

    it('should handle performance logging', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log } = await import('@/utils/logger');
      
      const performanceData = {
        operation: 'api_request',
        duration: 245,
        endpoint: '/api/login',
        status: 'success',
        timestamp: Date.now(),
      };

      log('[PERFORMANCE]', performanceData);

      expect(mockLog).toHaveBeenCalledWith('[PERFORMANCE]', performanceData);
    });

    it('should handle debug logging with context', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log } = await import('@/utils/logger');
      
      const debugContext = {
        component: 'LoginScreen',
        state: { isLoading: true, error: null },
        props: { navigation: 'mock-navigation' },
      };

      log('[DEBUG]', 'Component rendered', debugContext);

      expect(mockLog).toHaveBeenCalledWith(
        '[DEBUG]',
        'Component rendered',
        debugContext
      );
    });
  });

  describe('Default Export', () => {
    it('should provide default export with all logging functions', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const loggerModule = await import('@/utils/logger');
      const defaultLogger = loggerModule.default;

      expect(defaultLogger).toHaveProperty('log');
      expect(defaultLogger).toHaveProperty('warn');
      expect(defaultLogger).toHaveProperty('error');
      expect(typeof defaultLogger.log).toBe('function');
      expect(typeof defaultLogger.warn).toBe('function');
      expect(typeof defaultLogger.error).toBe('function');
    });

    it('should work with default export functions', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const loggerModule = await import('@/utils/logger');
      const { log: defaultLog, warn: defaultWarn, error: defaultError } = loggerModule.default;

      defaultLog('Default log test');
      defaultWarn('Default warn test');
      defaultError('Default error test');

      expect(mockLog).toHaveBeenCalledWith('Default log test');
      expect(mockWarn).toHaveBeenCalledWith('Default warn test');
      expect(mockError).toHaveBeenCalledWith('Default error test');
    });
  });

  describe('Type Safety and Edge Cases', () => {
    it('should handle circular references safely', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log } = await import('@/utils/logger');
      
      const circularObj: any = { message: 'Circular reference test' };
      circularObj.self = circularObj;

      // Should not throw error
      expect(() => log('Circular object:', circularObj)).not.toThrow();
      expect(mockLog).toHaveBeenCalledWith('Circular object:', circularObj);
    });

    it('should handle very large objects', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log } = await import('@/utils/logger');
      
      const largeObject = {
        message: 'Large object test',
        data: new Array(1000).fill('large data string'),
      };

      expect(() => log('Large object:', largeObject)).not.toThrow();
      expect(mockLog).toHaveBeenCalledWith('Large object:', largeObject);
    });

    it('should handle special values', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log } = await import('@/utils/logger');
      
      log('Special values:', null, undefined, NaN, Infinity, -Infinity);

      expect(mockLog).toHaveBeenCalledWith(
        'Special values:',
        null,
        undefined,
        NaN,
        Infinity,
        -Infinity
      );
    });

    it('should handle functions as arguments', async () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log } = await import('@/utils/logger');
      
      const testFunction = () => 'test function';
      
      log('Function test:', testFunction);

      expect(mockLog).toHaveBeenCalledWith('Function test:', testFunction);
    });

    it('should handle symbols', () => {
      process.env.EXPO_PUBLIC_ENV = 'development';
      const { log } = getLogger();
      
      const testSymbol = Symbol('test-symbol');
      
      log('Symbol test:', testSymbol);

      expect(mockLog).toHaveBeenCalledWith('Symbol test:', testSymbol);
    });
  });
});