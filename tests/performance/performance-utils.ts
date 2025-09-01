/**
 * Performance Testing Utilities
 * Helper functions for measuring test performance and identifying bottlenecks
 */

/**
 * Measure execution time of async functions
 */
export const measureAsync = async (fn, ...args) => {
  const start = performance.now();
  const result = await fn(...args);
  const end = performance.now();
  
  return {
    result,
    duration: end - start,
    durationMs: Math.round(end - start),
  };
};

/**
 * Measure execution time of sync functions
 */
export const measureSync = (fn, ...args) => {
  const start = performance.now();
  const result = fn(...args);
  const end = performance.now();
  
  return {
    result,
    duration: end - start,
    durationMs: Math.round(end - start),
  };
};

/**
 * Create a performance test wrapper
 */
export const performanceTest = (name, fn, options = {}) => {
  const { threshold = 1000, warmup = false } = options;
  
  return async () => {
    // Optional warmup run
    if (warmup) {
      await fn();
    }
    
    const measurement = await measureAsync(fn);
    
    // Log performance
    console.log(`⏱️  ${name}: ${measurement.durationMs}ms`);
    
    // Assert performance threshold
    if (measurement.duration > threshold) {
      console.warn(`⚠️  Performance warning: ${name} took ${measurement.durationMs}ms (threshold: ${threshold}ms)`);
    }
    
    return measurement;
  };
};

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  constructor() {
    this.snapshots = [];
  }
  
  snapshot(label) {
    const usage = this.getMemoryUsage();
    this.snapshots.push({
      label,
      timestamp: Date.now(),
      ...usage
    });
    return usage;
  }
  
  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(usage.external / 1024 / 1024 * 100) / 100,
        rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100
      };
    }
    return { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 };
  }
  
  getDelta(fromLabel, toLabel) {
    const from = this.snapshots.find(s => s.label === fromLabel);
    const to = this.snapshots.find(s => s.label === toLabel);
    
    if (!from || !to) return null;
    
    return {
      heapUsed: to.heapUsed - from.heapUsed,
      heapTotal: to.heapTotal - from.heapTotal,
      external: to.external - from.external,
      rss: to.rss - from.rss,
      duration: to.timestamp - from.timestamp
    };
  }
  
  reset() {
    this.snapshots = [];
  }
}

/**
 * Test execution timer decorator
 */
export const withTiming = (testFn) => {
  return async (...args) => {
    const start = performance.now();
    try {
      const result = await testFn(...args);
      const duration = performance.now() - start;
      console.log(`Test completed in ${Math.round(duration)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.log(`Test failed after ${Math.round(duration)}ms`);
      throw error;
    }
  };
};

/**
 * Batch performance testing
 */
export const batchPerformanceTest = async (tests, options = {}) => {
  const { iterations = 1, warmup = false } = options;
  const results = [];
  
  for (const test of tests) {
    const { name, fn, threshold } = test;
    const measurements = [];
    
    // Warmup if requested
    if (warmup) {
      await fn();
    }
    
    // Run iterations
    for (let i = 0; i < iterations; i++) {
      const measurement = await measureAsync(fn);
      measurements.push(measurement.duration);
    }
    
    // Calculate statistics
    const avg = measurements.reduce((a, b) => a + b) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    const result = {
      name,
      iterations,
      average: Math.round(avg),
      min: Math.round(min),
      max: Math.round(max),
      threshold,
      passed: threshold ? avg <= threshold : true
    };
    
    results.push(result);
    
    // Log result
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${name}: avg ${result.average}ms (min: ${result.min}ms, max: ${result.max}ms)`);
  }
  
  return results;
};

/**
 * React Native specific performance helpers
 */
export const rnPerformanceHelpers = {
  /**
   * Measure component render time
   */
  measureRender: async (renderFn) => {
    return measureAsync(renderFn);
  },
  
  /**
   * Measure API call performance
   */
  measureApiCall: async (apiCall) => {
    const tracker = new MemoryTracker();
    tracker.snapshot('before');
    
    const measurement = await measureAsync(apiCall);
    
    tracker.snapshot('after');
    const memoryDelta = tracker.getDelta('before', 'after');
    
    return {
      ...measurement,
      memoryDelta
    };
  },
  
  /**
   * Measure storage operation performance
   */
  measureStorage: async (storageOp) => {
    return measureAsync(storageOp);
  }
};

/**
 * Performance assertion helpers
 */
export const performanceAssertions = {
  /**
   * Assert execution time is within threshold
   */
  assertDuration: (actual, expected, tolerance = 0.1) => {
    const upperBound = expected * (1 + tolerance);
    const lowerBound = expected * (1 - tolerance);
    
    if (actual > upperBound || actual < lowerBound) {
      throw new Error(
        `Performance assertion failed: expected ${expected}ms ±${tolerance * 100}%, got ${actual}ms`
      );
    }
  },
  
  /**
   * Assert memory usage is within threshold
   */
  assertMemory: (actual, threshold) => {
    if (actual > threshold) {
      throw new Error(
        `Memory assertion failed: expected ≤${threshold}MB, got ${actual}MB`
      );
    }
  }
};