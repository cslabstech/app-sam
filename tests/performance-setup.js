/**
 * Performance Test Setup
 * Configures performance monitoring and optimization for Jest tests
 */

global.performance = global.performance || require('perf_hooks').performance;

// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.testMetrics = new Map();
    this.suiteMetrics = new Map();
    this.globalStartTime = Date.now();
  }

  startTest(testName) {
    this.testMetrics.set(testName, {
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
    });
  }

  endTest(testName) {
    const metrics = this.testMetrics.get(testName);
    if (metrics) {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      metrics.duration = endTime - metrics.startTime;
      metrics.memoryDelta = {
        heapUsed: endMemory.heapUsed - metrics.startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - metrics.startMemory.heapTotal,
        external: endMemory.external - metrics.startMemory.external,
      };
      
      return metrics;
    }
    return null;
  }

  startSuite(suiteName) {
    this.suiteMetrics.set(suiteName, {
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
      testCount: 0,
    });
  }

  endSuite(suiteName) {
    const metrics = this.suiteMetrics.get(suiteName);
    if (metrics) {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      metrics.duration = endTime - metrics.startTime;
      metrics.memoryDelta = {
        heapUsed: endMemory.heapUsed - metrics.startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - metrics.startMemory.heapTotal,
      };
      
      return metrics;
    }
    return null;
  }

  getAllMetrics() {
    return {
      tests: Array.from(this.testMetrics.entries()),
      suites: Array.from(this.suiteMetrics.entries()),
      totalExecutionTime: Date.now() - this.globalStartTime,
    };
  }
}

// Global performance monitor instance
global.performanceMonitor = new PerformanceMonitor();

// Performance optimization helpers
global.optimizeTest = {
  // Fast mock creation for large objects
  createMockData: (template, count = 100) => {
    return Array.from({ length: count }, (_, i) => ({
      ...template,
      id: `mock_${i}`,
      timestamp: Date.now() + i,
    }));
  },

  // Memory-efficient mock functions
  createMockFunction: () => {
    const fn = jest.fn();
    // Clear calls periodically to prevent memory buildup
    const originalCall = fn.mockImplementation;
    fn.mockImplementation = function(...args) {
      if (fn.mock.calls.length > 1000) {
        fn.mockClear();
      }
      return originalCall.apply(this, args);
    };
    return fn;
  },

  // Async test helpers with timeout
  withTimeout: (fn, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timeout after ${timeout}ms`));
      }, timeout);

      Promise.resolve(fn()).then(resolve, reject).finally(() => {
        clearTimeout(timer);
      });
    });
  },

  // Memory leak detection
  detectMemoryLeaks: () => {
    const usage = process.memoryUsage();
    if (usage.heapUsed > 512 * 1024 * 1024) { // 512MB threshold
      console.warn(`⚠️ High memory usage detected: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
    }
    return usage;
  },
};

// Performance test utilities
global.measurePerformance = (testName, fn) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  
  const result = fn();
  
  const endTime = performance.now();
  const endMemory = process.memoryUsage();
  
  const metrics = {
    duration: endTime - startTime,
    memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
  };
  
  if (metrics.duration > 1000) { // Warn for tests over 1 second
    console.warn(`⚠️ Slow test detected: ${testName} took ${metrics.duration.toFixed(2)}ms`);
  }
  
  return { result, metrics };
};

// Mock optimization for React Native components
const originalMock = jest.mock;
jest.mock = (moduleName, moduleFactory, options) => {
  // Optimize common React Native mocks
  if (moduleName === 'react-native') {
    const optimizedFactory = () => ({
      ...jest.requireActual('react-native'),
      Platform: {
        OS: 'ios',
        select: jest.fn(obj => obj.ios || obj.default),
      },
      Dimensions: {
        get: jest.fn(() => ({ width: 375, height: 667 })),
      },
      Alert: { alert: jest.fn() },
      AsyncStorage: {
        getItem: jest.fn(() => Promise.resolve(null)),
        setItem: jest.fn(() => Promise.resolve()),
        removeItem: jest.fn(() => Promise.resolve()),
      },
    });
    return originalMock(moduleName, moduleFactory || optimizedFactory, options);
  }
  
  return originalMock(moduleName, moduleFactory, options);
};

// Cleanup utilities
global.cleanupAfterTest = () => {
  // Clear timers
  if (global.gc) {
    global.gc();
  }
  
  // Clear require cache for test files to prevent memory leaks
  Object.keys(require.cache).forEach(key => {
    if (key.includes('/tests/')) {
      delete require.cache[key];
    }
  });
};

// Hook into Jest lifecycle
const originalIt = global.it;
global.it = (testName, testFn, timeout) => {
  return originalIt(testName, async () => {
    global.performanceMonitor.startTest(testName);
    
    try {
      await testFn();
    } finally {
      const metrics = global.performanceMonitor.endTest(testName);
      
      // Log performance warnings
      if (metrics && metrics.duration > 2000) {
        console.log(`⚠️ Slow test: "${testName}" took ${metrics.duration.toFixed(2)}ms`);
      }
      
      global.cleanupAfterTest();
    }
  }, timeout);
};

// Hook into describe blocks
const originalDescribe = global.describe;
global.describe = (suiteName, suiteFn) => {
  return originalDescribe(suiteName, () => {
    global.performanceMonitor.startSuite(suiteName);
    
    try {
      suiteFn();
    } finally {
      global.performanceMonitor.endSuite(suiteName);
    }
  });
};

// Error handling for performance issues
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in performance test:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in performance test:', error);
});

// Export for use in tests
module.exports = {
  performanceMonitor: global.performanceMonitor,
  optimizeTest: global.optimizeTest,
  measurePerformance: global.measurePerformance,
  cleanupAfterTest: global.cleanupAfterTest,
};