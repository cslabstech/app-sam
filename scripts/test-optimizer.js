/**
 * Test Performance Optimization Utilities
 * Provides tools to optimize and analyze test performance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestOptimizer {
  constructor() {
    this.projectRoot = process.cwd();
    this.testDir = path.join(this.projectRoot, 'tests');
    this.optimizations = [];
  }

  async analyzeAndOptimize() {
    console.log('🔍 Analyzing test performance issues...\n');
    
    await this.analyzeMockUsage();
    await this.analyzeImportPatterns();
    await this.analyzeTestStructure();
    await this.analyzeMemoryLeaks();
    
    console.log('\n📊 Optimization Analysis Complete');
    console.log(`Found ${this.optimizations.length} optimization opportunities`);
    
    this.generateOptimizationReport();
  }

  async analyzeMockUsage() {
    console.log('📋 Analyzing mock usage patterns...');
    
    const testFiles = this.getAllTestFiles();
    let heavyMockFiles = [];
    
    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const mockCount = (content.match(/jest\.mock/g) || []).length;
      const requireMockCount = (content.match(/jest\.requireActual/g) || []).length;
      const clearMockCount = (content.match(/jest\.clearAllMocks|mockClear/g) || []).length;
      
      if (mockCount > 10) {
        heavyMockFiles.push({
          file: path.relative(this.projectRoot, file),
          mockCount,
          requireMockCount,
          clearMockCount,
          ratio: clearMockCount / mockCount
        });
      }
    });
    
    if (heavyMockFiles.length > 0) {
      this.optimizations.push({
        type: 'mock_optimization',
        severity: 'medium',
        description: `${heavyMockFiles.length} files with heavy mock usage detected`,
        details: heavyMockFiles,
        recommendations: [
          'Consider moving common mocks to setup files',
          'Use jest.doMock for conditional mocking',
          'Ensure proper mock cleanup with jest.clearAllMocks',
          'Use mock factories for complex objects'
        ]
      });
    }
  }

  async analyzeImportPatterns() {
    console.log('📦 Analyzing import patterns...');
    
    const testFiles = this.getAllTestFiles();
    let slowImports = [];
    
    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const imports = content.match(/import .* from ['"][^'"]+['"];?/g) || [];
      
      // Check for potentially slow imports
      const heavyImports = imports.filter(imp => 
        imp.includes('react-native') ||
        imp.includes('@react-native') ||
        imp.includes('expo') ||
        imp.includes('lodash') ||
        imp.includes('moment')
      );
      
      if (heavyImports.length > 5) {
        slowImports.push({
          file: path.relative(this.projectRoot, file),
          totalImports: imports.length,
          heavyImports: heavyImports.length,
          heavyImportsList: heavyImports
        });
      }
    });
    
    if (slowImports.length > 0) {
      this.optimizations.push({
        type: 'import_optimization',
        severity: 'low',
        description: `${slowImports.length} files with heavy import patterns`,
        details: slowImports,
        recommendations: [
          'Use dynamic imports for heavy dependencies in tests',
          'Mock heavy dependencies instead of importing them',
          'Consider using jest.isolateModules for isolated testing',
          'Split large test files to reduce import overhead'
        ]
      });
    }
  }

  async analyzeTestStructure() {
    console.log('🏗️ Analyzing test structure...');
    
    const testFiles = this.getAllTestFiles();
    let structureIssues = [];
    
    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const lineCount = content.split('\n').length;
      const describeBlocks = (content.match(/describe\(/g) || []).length;
      const testBlocks = (content.match(/it\(|test\(/g) || []).length;
      const beforeEachBlocks = (content.match(/beforeEach\(/g) || []).length;
      
      // Check for large test files
      if (lineCount > 1000) {
        structureIssues.push({
          file: path.relative(this.projectRoot, file),
          lines: lineCount,
          describes: describeBlocks,
          tests: testBlocks,
          beforeEach: beforeEachBlocks,
          avgTestsPerDescribe: describeBlocks > 0 ? Math.round(testBlocks / describeBlocks) : 0,
          issue: 'large_file'
        });
      }
      
      // Check for excessive setup
      if (beforeEachBlocks > 5) {
        structureIssues.push({
          file: path.relative(this.projectRoot, file),
          beforeEach: beforeEachBlocks,
          issue: 'excessive_setup'
        });
      }
    });
    
    if (structureIssues.length > 0) {
      this.optimizations.push({
        type: 'structure_optimization',
        severity: 'medium',
        description: `${structureIssues.length} files with structure issues`,
        details: structureIssues,
        recommendations: [
          'Split large test files into focused suites',
          'Reduce excessive setup operations',
          'Use test data factories instead of repeated setup',
          'Group related tests in describe blocks'
        ]
      });
    }
  }

  async analyzeMemoryLeaks() {
    console.log('🧠 Analyzing potential memory leaks...');
    
    const testFiles = this.getAllTestFiles();
    let memoryLeakPatterns = [];
    
    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for potential memory leak patterns
      const globalVariables = (content.match(/global\.\w+\s*=/g) || []).length;
      const timers = (content.match(/setTimeout|setInterval/g) || []).length;
      const eventListeners = (content.match(/addEventListener|on\w+\s*=/g) || []).length;
      const clearPatterns = (content.match(/clearTimeout|clearInterval|removeEventListener/g) || []).length;
      
      if (globalVariables > 0 || (timers > clearPatterns) || eventListeners > 0) {
        memoryLeakPatterns.push({
          file: path.relative(this.projectRoot, file),
          globalVariables,
          timers,
          eventListeners,
          clearPatterns,
          riskScore: globalVariables * 2 + (timers - clearPatterns) + eventListeners
        });
      }
    });
    
    if (memoryLeakPatterns.length > 0) {
      this.optimizations.push({
        type: 'memory_leak_prevention',
        severity: 'high',
        description: `${memoryLeakPatterns.length} files with potential memory leak patterns`,
        details: memoryLeakPatterns,
        recommendations: [
          'Clear timers and intervals in afterEach/afterAll blocks',
          'Remove event listeners after tests',
          'Avoid setting global variables in tests',
          'Use Jest fake timers for timer-based tests'
        ]
      });
    }
  }

  getAllTestFiles() {
    const testFiles = [];
    
    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.name.match(/\.(test|spec)\.(js|ts|tsx)$/)) {
          testFiles.push(fullPath);
        }
      });
    };
    
    scanDirectory(this.testDir);
    return testFiles;
  }

  generateOptimizationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      projectPath: this.projectRoot,
      totalOptimizations: this.optimizations.length,
      optimizations: this.optimizations,
      summary: this.generateSummary()
    };
    
    // Save detailed report
    const reportPath = path.join(this.projectRoot, 'test-results', 'optimization-report.json');
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate actionable recommendations
    this.generateActionableRecommendations(report);
    
    console.log(`\n📄 Optimization report saved to: ${reportPath}`);
  }

  generateSummary() {
    const summary = {
      byType: {},
      bySeverity: { high: 0, medium: 0, low: 0 },
      topPriorities: []
    };
    
    this.optimizations.forEach(opt => {
      // Count by type
      summary.byType[opt.type] = (summary.byType[opt.type] || 0) + 1;
      
      // Count by severity
      summary.bySeverity[opt.severity]++;
      
      // Track high priority items
      if (opt.severity === 'high') {
        summary.topPriorities.push({
          type: opt.type,
          description: opt.description
        });
      }
    });
    
    return summary;
  }

  generateActionableRecommendations(report) {
    const actions = [];
    
    report.optimizations.forEach(opt => {
      switch (opt.type) {
        case 'mock_optimization':
          actions.push({
            action: 'Create shared mock setup',
            priority: 'medium',
            effort: 'low',
            files: opt.details.map(d => d.file),
            script: 'npm run test:optimize-mocks'
          });
          break;
          
        case 'structure_optimization':
          actions.push({
            action: 'Split large test files',
            priority: 'high',
            effort: 'medium',
            files: opt.details.filter(d => d.issue === 'large_file').map(d => d.file),
            script: 'npm run test:split-files'
          });
          break;
          
        case 'memory_leak_prevention':
          actions.push({
            action: 'Add cleanup patterns',
            priority: 'high',
            effort: 'low',
            files: opt.details.map(d => d.file),
            script: 'npm run test:fix-leaks'
          });
          break;
      }
    });
    
    // Save actionable recommendations
    const actionsPath = path.join(this.projectRoot, 'test-results', 'optimization-actions.json');
    fs.writeFileSync(actionsPath, JSON.stringify(actions, null, 2));
    
    console.log('\n🎯 Actionable Recommendations:');
    actions.forEach((action, index) => {
      console.log(`${index + 1}. [${action.priority.toUpperCase()}] ${action.action}`);
      console.log(`   Files affected: ${action.files.length}`);
      console.log(`   Run: ${action.script}`);
    });
  }
}

// CLI Interface
if (require.main === module) {
  const optimizer = new TestOptimizer();
  optimizer.analyzeAndOptimize().catch(console.error);
}

module.exports = { TestOptimizer };