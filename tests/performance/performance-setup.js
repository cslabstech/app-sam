/**
 * Performance Benchmarking Setup for SAM Mobile App Tests
 * 
 * This module provides utilities for measuring and benchmarking test performance,
 * helping identify slow tests and optimization opportunities.
 */

const fs = require('fs');
const path = require('path');

class PerformanceBenchmark {
  constructor() {
    this.testMetrics = new Map();
    this.suiteMetrics = new Map();
    this.startTime = null;
    this.thresholds = {
      slow: 1000,      // Tests slower than 1s
      verySlow: 5000,  // Tests slower than 5s
      suite: 30000     // Suites slower than 30s
    };
  }

  /**
   * Start timing a test
   */
  startTest(testName, suiteName) {
    const key = `${suiteName}::${testName}`;
    this.testMetrics.set(key, {
      name: testName,
      suite: suiteName,
      startTime: performance.now(),
      endTime: null,
      duration: null,
      memory: this.getMemoryUsage(),
      status: 'running'
    });
  }

  /**
   * End timing a test
   */
  endTest(testName, suiteName, status = 'passed') {
    const key = `${suiteName}::${testName}`;
    const metric = this.testMetrics.get(key);
    
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.status = status;
      metric.memoryEnd = this.getMemoryUsage();
      metric.memoryDelta = metric.memoryEnd.used - metric.memory.used;
    }
  }

  /**
   * Start timing a test suite
   */
  startSuite(suiteName) {
    this.suiteMetrics.set(suiteName, {
      name: suiteName,
      startTime: performance.now(),
      endTime: null,
      duration: null,
      testCount: 0,
      passedCount: 0,
      failedCount: 0,
      memory: this.getMemoryUsage()
    });
  }

  /**
   * End timing a test suite
   */
  endSuite(suiteName, testResults) {
    const metric = this.suiteMetrics.get(suiteName);
    
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.testCount = testResults.total;
      metric.passedCount = testResults.passed;
      metric.failedCount = testResults.failed;
      metric.memoryEnd = this.getMemoryUsage();
      metric.memoryDelta = metric.memoryEnd.used - metric.memory.used;
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        used: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
        total: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
        external: Math.round(usage.external / 1024 / 1024 * 100) / 100 // MB
      };
    }
    return { used: 0, total: 0, external: 0 };
  }

  /**
   * Analyze test performance and identify issues
   */
  analyzePerformance() {
    const analysis = {
      totalTests: this.testMetrics.size,
      totalSuites: this.suiteMetrics.size,
      slowTests: [],
      verySlowTests: [],
      slowSuites: [],
      memoryIntensive: [],
      averageDuration: 0,
      totalDuration: 0
    };

    // Analyze individual tests
    let totalDuration = 0;
    for (const [key, metric] of this.testMetrics) {
      if (metric.duration) {
        totalDuration += metric.duration;
        
        if (metric.duration > this.thresholds.verySlow) {
          analysis.verySlowTests.push({
            name: metric.name,
            suite: metric.suite,
            duration: Math.round(metric.duration),
            memoryDelta: metric.memoryDelta
          });
        } else if (metric.duration > this.thresholds.slow) {
          analysis.slowTests.push({
            name: metric.name,
            suite: metric.suite,
            duration: Math.round(metric.duration),
            memoryDelta: metric.memoryDelta
          });
        }

        // Check memory usage
        if (metric.memoryDelta && metric.memoryDelta > 10) { // > 10MB
          analysis.memoryIntensive.push({
            name: metric.name,
            suite: metric.suite,
            memoryDelta: Math.round(metric.memoryDelta * 100) / 100
          });
        }
      }
    }

    analysis.totalDuration = totalDuration;
    analysis.averageDuration = analysis.totalTests > 0 
      ? Math.round(totalDuration / analysis.totalTests) 
      : 0;

    // Analyze test suites
    for (const [name, metric] of this.suiteMetrics) {
      if (metric.duration && metric.duration > this.thresholds.suite) {
        analysis.slowSuites.push({
          name: metric.name,
          duration: Math.round(metric.duration),
          testCount: metric.testCount,
          averageTestDuration: Math.round(metric.duration / metric.testCount)
        });
      }
    }

    return analysis;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const analysis = this.analyzePerformance();
    const timestamp = new Date().toISOString();
    
    const report = {
      timestamp,
      summary: {
        totalTests: analysis.totalTests,
        totalSuites: analysis.totalSuites,
        totalDuration: Math.round(analysis.totalDuration),
        averageDuration: analysis.averageDuration,
        slowTestsCount: analysis.slowTests.length,
        verySlowTestsCount: analysis.verySlowTests.length
      },
      performance: {
        slowTests: analysis.slowTests.slice(0, 10), // Top 10 slow tests
        verySlowTests: analysis.verySlowTests,
        slowSuites: analysis.slowSuites,
        memoryIntensive: analysis.memoryIntensive.slice(0, 5) // Top 5 memory intensive
      },
      recommendations: this.generateRecommendations(analysis),
      rawMetrics: {
        tests: Array.from(this.testMetrics.values()),
        suites: Array.from(this.suiteMetrics.values())
      }
    };

    return report;
  }

  /**
   * Generate performance optimization recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.verySlowTests.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Very Slow Tests Detected',
        message: `${analysis.verySlowTests.length} tests are taking more than 5 seconds. Consider optimizing these tests or breaking them into smaller units.`,
        tests: analysis.verySlowTests.map(t => `${t.suite}::${t.name}`)
      });
    }

    if (analysis.slowTests.length > analysis.totalTests * 0.2) {
      recommendations.push({
        type: 'warning',
        title: 'Many Slow Tests',
        message: `${analysis.slowTests.length} tests (${Math.round(analysis.slowTests.length / analysis.totalTests * 100)}%) are slower than 1 second. Consider optimization.`
      });
    }

    if (analysis.memoryIntensive.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Memory Intensive Tests',
        message: `${analysis.memoryIntensive.length} tests are using significant memory. Monitor for memory leaks.`,
        tests: analysis.memoryIntensive.map(t => `${t.suite}::${t.name}`)
      });
    }

    if (analysis.averageDuration > 500) {
      recommendations.push({
        type: 'warning',
        title: 'High Average Test Duration',
        message: `Average test duration is ${analysis.averageDuration}ms. Consider mocking expensive operations.`
      });
    }

    return recommendations;
  }

  /**
   * Save report to file
   */
  saveReport(outputPath = './tests/performance/reports') {
    const report = this.generateReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-report-${timestamp}.json`;
    
    // Ensure directory exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    const fullPath = path.join(outputPath, filename);
    fs.writeFileSync(fullPath, JSON.stringify(report, null, 2));
    
    console.log(`Performance report saved to: ${fullPath}`);
    return fullPath;
  }

  /**
   * Print summary to console
   */
  printSummary() {
    const analysis = this.analyzePerformance();
    
    console.log('\n🚀 Performance Benchmark Summary');
    console.log('================================');
    console.log(`Total Tests: ${analysis.totalTests}`);
    console.log(`Total Suites: ${analysis.totalSuites}`);
    console.log(`Total Duration: ${Math.round(analysis.totalDuration)}ms`);
    console.log(`Average Test Duration: ${analysis.averageDuration}ms`);
    
    if (analysis.verySlowTests.length > 0) {
      console.log(`\n⚠️  Very Slow Tests (>${this.thresholds.verySlow}ms):`);
      analysis.verySlowTests.forEach(test => {
        console.log(`  - ${test.suite}::${test.name} (${test.duration}ms)`);
      });
    }
    
    if (analysis.slowTests.length > 0) {
      console.log(`\n🐌 Slow Tests (>${this.thresholds.slow}ms):`);
      analysis.slowTests.slice(0, 5).forEach(test => {
        console.log(`  - ${test.suite}::${test.name} (${test.duration}ms)`);
      });
      if (analysis.slowTests.length > 5) {
        console.log(`  ... and ${analysis.slowTests.length - 5} more`);
      }
    }
    
    if (analysis.memoryIntensive.length > 0) {
      console.log(`\n🧠 Memory Intensive Tests:`);
      analysis.memoryIntensive.slice(0, 3).forEach(test => {
        console.log(`  - ${test.suite}::${test.name} (+${test.memoryDelta}MB)`);
      });
    }
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.testMetrics.clear();
    this.suiteMetrics.clear();
  }
}

// Jest reporter integration
class PerformanceReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
    this.benchmark = new PerformanceBenchmark();
  }

  onRunStart() {
    console.log('🚀 Starting performance benchmarking...');
    this.benchmark.reset();
  }

  onTestStart(test) {
    const suiteName = test.path.split('/').pop().replace('.test.', '');
    this.benchmark.startTest(test.title || 'unknown', suiteName);
  }

  onTestResult(test, testResult) {
    const suiteName = test.path.split('/').pop().replace('.test.', '');
    
    testResult.testResults.forEach(result => {
      const status = result.status === 'passed' ? 'passed' : 'failed';
      this.benchmark.endTest(result.title, suiteName, status);
    });
  }

  onRunComplete() {
    this.benchmark.printSummary();
    
    if (this.options.saveReport !== false) {
      this.benchmark.saveReport();
    }
  }
}

// Export for use in tests and Jest configuration
module.exports = {
  PerformanceBenchmark,
  PerformanceReporter
};