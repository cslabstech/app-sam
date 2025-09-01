/**
 * Custom Jest Performance Reporter
 * Collects and reports performance metrics during test execution
 */

const fs = require('fs');
const path = require('path');

class PerformanceReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
    this.results = {
      timestamp: new Date().toISOString(),
      testRuns: [],
      summary: {
        totalTests: 0,
        totalSuites: 0,
        totalTime: 0,
        slowTests: [],
        fastTests: [],
        memoryUsage: {
          peak: 0,
          average: 0,
          total: 0
        }
      },
      performance: {
        byFile: {},
        byType: {},
        warnings: []
      }
    };
    
    this.startTime = Date.now();
    this.peakMemory = 0;
    this.memoryReadings = [];
  }

  onRunStart(results, options) {
    console.log('🚀 Performance Reporter: Starting test run analysis...');
    this.startTime = Date.now();
    
    // Monitor memory usage
    this.memoryMonitor = setInterval(() => {
      const usage = process.memoryUsage();
      this.memoryReadings.push(usage.heapUsed);
      
      if (usage.heapUsed > this.peakMemory) {
        this.peakMemory = usage.heapUsed;
      }
    }, 1000);
  }

  onTestFileResult(test, testResult, results) {
    const fileMetrics = this.analyzeTestFile(test, testResult);
    this.results.testRuns.push(fileMetrics);
    
    // Update summary
    this.results.summary.totalTests += testResult.numPassingTests + testResult.numFailingTests;
    this.results.summary.totalSuites++;
    
    // Track slow tests
    if (fileMetrics.executionTime > 5000) {
      this.results.summary.slowTests.push({
        file: fileMetrics.testPath,
        time: fileMetrics.executionTime,
        tests: fileMetrics.testCount
      });
    }
    
    // Track fast tests with good coverage
    if (fileMetrics.executionTime < 1000 && fileMetrics.testCount > 5) {
      this.results.summary.fastTests.push({
        file: fileMetrics.testPath,
        time: fileMetrics.executionTime,
        tests: fileMetrics.testCount
      });
    }
    
    // Real-time warnings for very slow tests
    if (fileMetrics.executionTime > 10000) {
      console.warn(`⚠️ Very slow test file: ${path.basename(fileMetrics.testPath)} (${fileMetrics.executionTime}ms)`);
      
      this.results.performance.warnings.push({
        type: 'slow_test',
        file: fileMetrics.testPath,
        time: fileMetrics.executionTime,
        severity: 'high'
      });
    }
  }

  onRunComplete(contexts, results) {
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }
    
    const totalTime = Date.now() - this.startTime;
    this.results.summary.totalTime = totalTime;
    
    // Calculate memory statistics
    if (this.memoryReadings.length > 0) {
      this.results.summary.memoryUsage = {
        peak: Math.round(this.peakMemory / 1024 / 1024 * 100) / 100,
        average: Math.round((this.memoryReadings.reduce((a, b) => a + b, 0) / this.memoryReadings.length) / 1024 / 1024 * 100) / 100,
        total: Math.round(this.memoryReadings.reduce((a, b) => Math.max(a, b), 0) / 1024 / 1024 * 100) / 100
      };
    }
    
    // Generate performance analysis
    this.generatePerformanceAnalysis();
    
    // Save results
    this.saveResults();
    
    // Print summary
    this.printSummary();
  }

  analyzeTestFile(test, testResult) {
    const testPath = test.path;
    const relativePath = path.relative(process.cwd(), testPath);
    
    const fileMetrics = {
      testPath: relativePath,
      executionTime: testResult.perfStats?.end - testResult.perfStats?.start || 0,
      testCount: testResult.numPassingTests + testResult.numFailingTests + testResult.numPendingTests,
      passingTests: testResult.numPassingTests,
      failingTests: testResult.numFailingTests,
      pendingTests: testResult.numPendingTests,
      coverage: this.extractCoverage(testResult),
      category: this.categorizeTest(relativePath),
      fileSize: this.getFileSize(testPath)
    };
    
    // Calculate efficiency metrics
    fileMetrics.efficiency = {
      testsPerSecond: fileMetrics.testCount > 0 ? 
        (fileMetrics.testCount / (fileMetrics.executionTime / 1000)).toFixed(2) : 0,
      timePerTest: fileMetrics.testCount > 0 ? 
        (fileMetrics.executionTime / fileMetrics.testCount).toFixed(2) : 0
    };
    
    return fileMetrics;
  }

  categorizeTest(filePath) {
    if (filePath.includes('/api/')) return 'api';
    if (filePath.includes('/components/')) return 'component';
    if (filePath.includes('/hooks/')) return 'hook';
    if (filePath.includes('/integration/')) return 'integration';
    if (filePath.includes('/utils/')) return 'utils';
    return 'other';
  }

  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return Math.round(stats.size / 1024 * 100) / 100; // KB
    } catch (error) {
      return 0;
    }
  }

  extractCoverage(testResult) {
    // Extract coverage information if available
    if (testResult.coverage) {
      const coverage = testResult.coverage;
      return {
        lines: coverage.lines?.pct || 0,
        functions: coverage.functions?.pct || 0,
        branches: coverage.branches?.pct || 0,
        statements: coverage.statements?.pct || 0
      };
    }
    return null;
  }

  generatePerformanceAnalysis() {
    // Analyze by category
    const byCategory = {};
    this.results.testRuns.forEach(run => {
      if (!byCategory[run.category]) {
        byCategory[run.category] = {
          count: 0,
          totalTime: 0,
          totalTests: 0,
          averageTime: 0,
          averageTestsPerFile: 0
        };
      }
      
      const cat = byCategory[run.category];
      cat.count++;
      cat.totalTime += run.executionTime;
      cat.totalTests += run.testCount;
    });
    
    // Calculate averages
    Object.keys(byCategory).forEach(category => {
      const cat = byCategory[category];
      cat.averageTime = Math.round(cat.totalTime / cat.count);
      cat.averageTestsPerFile = Math.round(cat.totalTests / cat.count * 100) / 100;
    });
    
    this.results.performance.byType = byCategory;
    
    // Generate recommendations
    this.results.recommendations = this.generateRecommendations(byCategory);
  }

  generateRecommendations(byCategory) {
    const recommendations = [];
    
    // Slow category detection
    Object.entries(byCategory).forEach(([category, stats]) => {
      if (stats.averageTime > 5000) {
        recommendations.push({
          type: 'performance',
          category,
          priority: 'high',
          message: `${category} tests are averaging ${stats.averageTime}ms execution time`,
          suggestion: 'Consider breaking down test files or optimizing test setup'
        });
      }
    });
    
    // Memory usage warnings
    if (this.results.summary.memoryUsage.peak > 512) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: `Peak memory usage of ${this.results.summary.memoryUsage.peak}MB detected`,
        suggestion: 'Consider clearing mocks and reducing memory footprint in tests'
      });
    }
    
    // Test parallelization opportunities
    const totalSuites = this.results.summary.totalSuites;
    if (totalSuites > 10 && this.results.summary.totalTime > 30000) {
      recommendations.push({
        type: 'parallelization',
        priority: 'low',
        message: `${totalSuites} test suites taking ${Math.round(this.results.summary.totalTime / 1000)}s could benefit from parallelization`,
        suggestion: 'Use Jest maxWorkers configuration to enable parallel test execution'
      });
    }
    
    return recommendations;
  }

  saveResults() {
    const outputDir = path.dirname(this.options.outputFile || 'test-results/performance-metrics.json');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = this.options.outputFile || path.join(outputDir, 'performance-metrics.json');
    
    try {
      fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
      console.log(`📊 Performance metrics saved to: ${outputFile}`);
    } catch (error) {
      console.error('Failed to save performance metrics:', error.message);
    }
    
    // Also save a CSV summary for easy analysis
    this.saveCSVSummary(outputDir);
  }

  saveCSVSummary(outputDir) {
    const csvLines = [
      'File,Category,Execution Time (ms),Test Count,Tests/Second,Time/Test (ms),File Size (KB),Status'
    ];
    
    this.results.testRuns.forEach(run => {
      csvLines.push([
        run.testPath,
        run.category,
        run.executionTime,
        run.testCount,
        run.efficiency.testsPerSecond,
        run.efficiency.timePerTest,
        run.fileSize,
        run.failingTests > 0 ? 'Failed' : 'Passed'
      ].join(','));
    });
    
    const csvPath = path.join(outputDir, 'performance-summary.csv');
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`📈 CSV summary saved to: ${csvPath}`);
  }

  printSummary() {
    console.log('\n📊 Performance Test Summary');
    console.log('═══════════════════════════');
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Total Suites: ${this.results.summary.totalSuites}`);
    console.log(`Total Time: ${Math.round(this.results.summary.totalTime / 1000 * 100) / 100}s`);
    console.log(`Peak Memory: ${this.results.summary.memoryUsage.peak}MB`);
    console.log(`Slow Tests: ${this.results.summary.slowTests.length}`);
    console.log(`Fast Tests: ${this.results.summary.fastTests.length}`);
    
    if (this.results.performance.warnings.length > 0) {
      console.log(`\n⚠️ Performance Warnings: ${this.results.performance.warnings.length}`);
    }
    
    // Print category breakdown
    console.log('\n📈 Performance by Category:');
    Object.entries(this.results.performance.byType).forEach(([category, stats]) => {
      console.log(`${category}: ${stats.averageTime}ms avg (${stats.count} files)`);
    });
    
    // Print recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Optimization Recommendations:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      });
    }
    
    console.log('\n✅ Performance analysis complete!\n');
  }
}

module.exports = PerformanceReporter;