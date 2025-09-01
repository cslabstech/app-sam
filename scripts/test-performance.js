/**
 * Test Performance Benchmarking and Optimization Script
 * 
 * Features:
 * - Test execution timing and performance metrics
 * - Memory usage monitoring during test runs
 * - Test suite performance comparison
 * - Performance regression detection
 * - Slow test identification and optimization recommendations
 * - Resource usage analysis
 * - Performance reporting with visual charts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

class TestPerformanceAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: this.getEnvironmentInfo(),
      testSuites: {},
      performance: {
        totalExecutionTime: 0,
        averageTestTime: 0,
        slowTests: [],
        fastTests: [],
        memoryUsage: {},
        cpuUsage: {}
      },
      recommendations: []
    };
    
    this.thresholds = {
      slowTestWarning: 5000, // 5 seconds
      memoryWarningMB: 512,
      cpuWarningPercent: 80
    };
  }

  getEnvironmentInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
      cpuCores: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Unknown'
    };
  }

  async runTestSuitePerformanceAnalysis() {
    console.log('🚀 Starting Test Performance Analysis...\n');
    
    const testSuites = this.discoverTestSuites();
    
    for (const suite of testSuites) {
      console.log(`📊 Analyzing ${suite.name}...`);
      await this.analyzeSuitePerformance(suite);
    }
    
    this.generatePerformanceReport();
    this.generateOptimizationRecommendations();
    await this.saveResults();
    
    console.log('\n✅ Performance analysis complete!');
    console.log(`📄 Results saved to: ${this.getResultsPath()}`);
  }

  discoverTestSuites() {
    const testDir = path.join(process.cwd(), 'tests');
    const suites = [];
    
    // API Test Suites
    const apiDir = path.join(testDir, 'api');
    if (fs.existsSync(apiDir)) {
      const apiFiles = fs.readdirSync(apiDir).filter(f => f.endsWith('.test.ts'));
      apiFiles.forEach(file => {
        suites.push({
          name: `API: ${file.replace('.test.ts', '')}`,
          path: path.join(apiDir, file),
          category: 'api',
          expectedComplexity: 'medium'
        });
      });
    }

    // Component Test Suites
    const componentDir = path.join(testDir, 'components');
    if (fs.existsSync(componentDir)) {
      const componentFiles = fs.readdirSync(componentDir).filter(f => f.endsWith('.test.tsx'));
      componentFiles.forEach(file => {
        suites.push({
          name: `Component: ${file.replace('.test.tsx', '')}`,
          path: path.join(componentDir, file),
          category: 'component',
          expectedComplexity: 'low'
        });
      });
    }

    // Hook Test Suites
    const hooksDir = path.join(testDir, 'hooks');
    if (fs.existsSync(hooksDir)) {
      const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.test.ts'));
      hookFiles.forEach(file => {
        suites.push({
          name: `Hook: ${file.replace('.test.ts', '')}`,
          path: path.join(hooksDir, file),
          category: 'hook',
          expectedComplexity: 'medium'
        });
      });
    }

    // Integration Test Suites
    const integrationDir = path.join(testDir, 'integration');
    if (fs.existsSync(integrationDir)) {
      const integrationFiles = fs.readdirSync(integrationDir).filter(f => f.endsWith('.test.ts') || f.endsWith('.test.tsx'));
      integrationFiles.forEach(file => {
        suites.push({
          name: `Integration: ${file.replace(/\.test\.tsx?$/, '')}`,
          path: path.join(integrationDir, file),
          category: 'integration',
          expectedComplexity: 'high'
        });
      });
    }

    // Utils Test Suites
    const utilsDir = path.join(testDir, 'utils');
    if (fs.existsSync(utilsDir)) {
      const utilFiles = fs.readdirSync(utilsDir).filter(f => f.endsWith('.test.ts'));
      utilFiles.forEach(file => {
        suites.push({
          name: `Utils: ${file.replace('.test.ts', '')}`,
          path: path.join(utilsDir, file),
          category: 'utils',
          expectedComplexity: 'low'
        });
      });
    }

    return suites;
  }

  async analyzeSuitePerformance(suite) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      // Run the specific test suite with Jest
      const jestCommand = `npx jest "${suite.path}" --verbose --no-cache --forceExit`;
      
      const result = execSync(jestCommand, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const executionTime = endTime - startTime;
      
      const suiteResult = {
        name: suite.name,
        category: suite.category,
        executionTime,
        memoryUsage: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
          rss: endMemory.rss - startMemory.rss
        },
        testCount: this.extractTestCount(result),
        status: 'passed',
        averageTestTime: 0
      };
      
      suiteResult.averageTestTime = suiteResult.testCount > 0 ? 
        executionTime / suiteResult.testCount : 0;
      
      this.results.testSuites[suite.name] = suiteResult;
      
      // Track slow/fast tests
      if (executionTime > this.thresholds.slowTestWarning) {
        this.results.performance.slowTests.push({
          name: suite.name,
          time: executionTime,
          category: suite.category
        });
      } else if (executionTime < 1000 && suiteResult.testCount > 5) {
        this.results.performance.fastTests.push({
          name: suite.name,
          time: executionTime,
          category: suite.category,
          testCount: suiteResult.testCount
        });
      }
      
      console.log(`  ✅ ${suite.name}: ${executionTime}ms (${suiteResult.testCount} tests)`);
      
    } catch (error) {
      console.log(`  ❌ ${suite.name}: Failed - ${error.message.split('\n')[0]}`);
      
      this.results.testSuites[suite.name] = {
        name: suite.name,
        category: suite.category,
        executionTime: Date.now() - startTime,
        status: 'failed',
        error: error.message.split('\n')[0]
      };
    }
  }

  extractTestCount(jestOutput) {
    const match = jestOutput.match(/(\d+) passed/);
    return match ? parseInt(match[1], 10) : 0;
  }

  generatePerformanceReport() {
    const suites = Object.values(this.results.testSuites);
    const passedSuites = suites.filter(s => s.status === 'passed');
    
    this.results.performance.totalExecutionTime = passedSuites
      .reduce((sum, suite) => sum + suite.executionTime, 0);
    
    this.results.performance.averageTestTime = passedSuites.length > 0 ? 
      this.results.performance.totalExecutionTime / passedSuites.length : 0;
    
    // Memory usage analysis
    const totalHeapUsed = passedSuites
      .reduce((sum, suite) => sum + (suite.memoryUsage?.heapUsed || 0), 0);
    
    this.results.performance.memoryUsage = {
      totalHeapUsedMB: Math.round(totalHeapUsed / 1024 / 1024 * 100) / 100,
      averagePerSuiteMB: passedSuites.length > 0 ? 
        Math.round((totalHeapUsed / passedSuites.length) / 1024 / 1024 * 100) / 100 : 0,
      maxSuiteMemoryMB: Math.max(...passedSuites.map(s => 
        Math.round((s.memoryUsage?.heapUsed || 0) / 1024 / 1024 * 100) / 100
      ))
    };

    // Performance by category
    this.results.performance.byCategory = this.analyzeByCategory(passedSuites);
    
    console.log('\n📈 Performance Summary:');
    console.log(`Total Execution Time: ${this.results.performance.totalExecutionTime}ms`);
    console.log(`Average Suite Time: ${Math.round(this.results.performance.averageTestTime)}ms`);
    console.log(`Total Memory Used: ${this.results.performance.memoryUsage.totalHeapUsedMB}MB`);
    console.log(`Slow Tests: ${this.results.performance.slowTests.length}`);
    console.log(`Fast Tests: ${this.results.performance.fastTests.length}`);
  }

  analyzeByCategory(suites) {
    const categories = {};
    
    suites.forEach(suite => {
      if (!categories[suite.category]) {
        categories[suite.category] = {
          count: 0,
          totalTime: 0,
          averageTime: 0,
          totalMemory: 0,
          averageMemory: 0
        };
      }
      
      categories[suite.category].count++;
      categories[suite.category].totalTime += suite.executionTime;
      categories[suite.category].totalMemory += suite.memoryUsage?.heapUsed || 0;
    });
    
    Object.keys(categories).forEach(category => {
      const cat = categories[category];
      cat.averageTime = Math.round(cat.totalTime / cat.count);
      cat.averageMemory = Math.round((cat.totalMemory / cat.count) / 1024 / 1024 * 100) / 100;
    });
    
    return categories;
  }

  generateOptimizationRecommendations() {
    const recommendations = [];
    
    // Slow test recommendations
    if (this.results.performance.slowTests.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Slow Test Detection',
        description: `${this.results.performance.slowTests.length} test suite(s) are running slower than ${this.thresholds.slowTestWarning}ms`,
        suggestions: [
          'Consider breaking down large test files into smaller, focused suites',
          'Mock heavy dependencies to reduce execution time',
          'Use Jest\'s --maxWorkers option to parallelize test execution',
          'Review and optimize setup/teardown operations'
        ],
        affectedTests: this.results.performance.slowTests.map(t => t.name)
      });
    }

    // Memory usage recommendations
    const maxMemory = this.results.performance.memoryUsage.maxSuiteMemoryMB;
    if (maxMemory > this.thresholds.memoryWarningMB) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        title: 'High Memory Usage',
        description: `Peak memory usage of ${maxMemory}MB detected during test execution`,
        suggestions: [
          'Clear mocks and reset modules between test suites',
          'Avoid keeping large objects in memory during tests',
          'Use Jest\'s --logHeapUsage flag for detailed memory analysis',
          'Consider using --runInBand for memory-constrained environments'
        ]
      });
    }

    // Integration test recommendations
    const integrationSuites = Object.values(this.results.testSuites)
      .filter(s => s.category === 'integration' && s.status === 'passed');
    
    if (integrationSuites.length > 0) {
      const avgIntegrationTime = integrationSuites
        .reduce((sum, s) => sum + s.executionTime, 0) / integrationSuites.length;
      
      if (avgIntegrationTime > 10000) {
        recommendations.push({
          type: 'integration',
          priority: 'medium',
          title: 'Long Integration Tests',
          description: `Integration tests average ${Math.round(avgIntegrationTime)}ms execution time`,
          suggestions: [
            'Consider using test doubles instead of real network calls',
            'Implement test data fixtures for faster setup',
            'Use parallel test execution for independent integration tests',
            'Cache heavy setup operations between related tests'
          ]
        });
      }
    }

    // Test parallelization recommendations
    const totalSuites = Object.keys(this.results.testSuites).length;
    if (totalSuites > 10) {
      recommendations.push({
        type: 'parallelization',
        priority: 'low',
        title: 'Test Parallelization Opportunity',
        description: `${totalSuites} test suites could benefit from parallel execution`,
        suggestions: [
          'Configure Jest to use multiple workers: --maxWorkers=50%',
          'Ensure tests are isolated and can run independently',
          'Use --testPathPattern for targeted test execution',
          'Consider splitting test execution across CI/CD stages'
        ]
      });
    }

    this.results.recommendations = recommendations;
    
    console.log('\n💡 Optimization Recommendations:');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      console.log(`   ${rec.description}`);
    });
  }

  async runComparisonBenchmark() {
    console.log('\n🔄 Running Performance Comparison...');
    
    const benchmarkResults = {
      timestamp: new Date().toISOString(),
      scenarios: {}
    };
    
    // Test different Jest configurations
    const configurations = [
      { name: 'Default', options: '' },
      { name: 'No Cache', options: '--no-cache' },
      { name: 'Single Worker', options: '--runInBand' },
      { name: 'Multiple Workers', options: '--maxWorkers=4' },
      { name: 'Silent Mode', options: '--silent' }
    ];
    
    for (const config of configurations) {
      console.log(`Testing configuration: ${config.name}`);
      
      const startTime = Date.now();
      try {
        execSync(`npx jest tests/api --passWithNoTests ${config.options}`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        benchmarkResults.scenarios[config.name] = {
          executionTime: Date.now() - startTime,
          status: 'success'
        };
      } catch (error) {
        benchmarkResults.scenarios[config.name] = {
          executionTime: Date.now() - startTime,
          status: 'failed',
          error: error.message.split('\n')[0]
        };
      }
    }
    
    // Save comparison results
    const comparisonPath = path.join(process.cwd(), 'test-results', 'performance-comparison.json');
    fs.writeFileSync(comparisonPath, JSON.stringify(benchmarkResults, null, 2));
    
    console.log('📊 Configuration Comparison Results:');
    Object.entries(benchmarkResults.scenarios).forEach(([name, result]) => {
      console.log(`${name}: ${result.executionTime}ms (${result.status})`);
    });
  }

  generatePerformanceChart() {
    // Generate HTML report with charts
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Performance Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .chart-container { width: 800px; height: 400px; margin: 20px 0; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .recommendation { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
        .metric { display: inline-block; margin: 10px 20px; }
    </style>
</head>
<body>
    <h1>Test Performance Report</h1>
    <div class="summary">
        <h2>Performance Summary</h2>
        <div class="metric">
            <strong>Total Execution Time:</strong> ${this.results.performance.totalExecutionTime}ms
        </div>
        <div class="metric">
            <strong>Average Suite Time:</strong> ${Math.round(this.results.performance.averageTestTime)}ms
        </div>
        <div class="metric">
            <strong>Total Memory Used:</strong> ${this.results.performance.memoryUsage.totalHeapUsedMB}MB
        </div>
        <div class="metric">
            <strong>Test Suites:</strong> ${Object.keys(this.results.testSuites).length}
        </div>
    </div>
    
    <div class="chart-container">
        <canvas id="executionTimeChart"></canvas>
    </div>
    
    <div class="chart-container">
        <canvas id="memoryUsageChart"></canvas>
    </div>
    
    <h2>Optimization Recommendations</h2>
    ${this.results.recommendations.map(rec => `
        <div class="recommendation">
            <h3>[${rec.priority.toUpperCase()}] ${rec.title}</h3>
            <p>${rec.description}</p>
            <ul>${rec.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>
        </div>
    `).join('')}
    
    <script>
        // Execution Time Chart
        const execCtx = document.getElementById('executionTimeChart').getContext('2d');
        new Chart(execCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(Object.keys(this.results.testSuites))},
                datasets: [{
                    label: 'Execution Time (ms)',
                    data: ${JSON.stringify(Object.values(this.results.testSuites).map(s => s.executionTime || 0))},
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
        
        // Memory Usage Chart
        const memCtx = document.getElementById('memoryUsageChart').getContext('2d');
        new Chart(memCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(${JSON.stringify(this.results.performance.byCategory || {})}),
                datasets: [{
                    data: ${JSON.stringify(Object.values(this.results.performance.byCategory || {}).map(c => c.averageMemory))},
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 205, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    </script>
</body>
</html>`;

    const htmlPath = path.join(process.cwd(), 'test-results', 'performance-report.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`📄 Visual report generated: ${htmlPath}`);
  }

  async saveResults() {
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const resultsPath = this.getResultsPath();
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    
    // Generate visual report
    this.generatePerformanceChart();
    
    // Generate CSV for spreadsheet analysis
    this.generateCSVReport();
  }

  generateCSVReport() {
    const csvLines = ['Suite Name,Category,Execution Time (ms),Memory Used (MB),Test Count,Status'];
    
    Object.values(this.results.testSuites).forEach(suite => {
      const memoryMB = suite.memoryUsage ? 
        Math.round(suite.memoryUsage.heapUsed / 1024 / 1024 * 100) / 100 : 0;
      
      csvLines.push([
        suite.name,
        suite.category,
        suite.executionTime || 0,
        memoryMB,
        suite.testCount || 0,
        suite.status
      ].join(','));
    });
    
    const csvPath = path.join(process.cwd(), 'test-results', 'performance-data.csv');
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`📊 CSV report generated: ${csvPath}`);
  }

  getResultsPath() {
    return path.join(process.cwd(), 'test-results', `performance-${Date.now()}.json`);
  }
}

// CLI Interface
if (require.main === module) {
  const analyzer = new TestPerformanceAnalyzer();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--compare')) {
    analyzer.runComparisonBenchmark();
  } else {
    analyzer.runTestSuitePerformanceAnalysis();
  }
}

module.exports = { TestPerformanceAnalyzer };