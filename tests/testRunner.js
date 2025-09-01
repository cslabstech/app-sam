#!/usr/bin/env node

/**
 * Test Runner Script for SAM API Tests
 * Provides utilities to run and validate API tests
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  testDir: path.join(__dirname),
  coverageDir: path.join(__dirname, '../coverage'),
  timeout: 30000,
};

// ANSI color codes for output
const colors = {
  reset: '\\x1b[0m',
  bright: '\\x1b[1m',
  red: '\\x1b[31m',
  green: '\\x1b[32m',
  yellow: '\\x1b[33m',
  blue: '\\x1b[34m',
  magenta: '\\x1b[35m',
  cyan: '\\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\\n' + '='.repeat(60), 'cyan');
  log(` ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Function to check if test files exist
function checkTestFiles() {
  logHeader('Checking Test Files');
  
  const expectedTestFiles = [
    'api/auth.test.ts',
    'api/outlets.test.ts', 
    'api/visits.test.ts',
    'integration/realApi.test.ts',
    'config/testConfig.ts',
    'coverage/testCoverage.ts',
    'mocks/handlers.ts',
    'mocks/server.ts',
    'setup.js',
  ];
  
  const missingFiles = [];
  const existingFiles = [];
  
  expectedTestFiles.forEach(file => {
    const filePath = path.join(TEST_CONFIG.testDir, file);
    if (fs.existsSync(filePath)) {
      existingFiles.push(file);
      logSuccess(`Found: ${file}`);
    } else {
      missingFiles.push(file);
      logError(`Missing: ${file}`);
    }
  });
  
  log(`\\nSummary: ${existingFiles.length}/${expectedTestFiles.length} test files found`, 'bright');
  
  if (missingFiles.length > 0) {
    logWarning(`Missing ${missingFiles.length} test files. Run 'npm run test:setup' to create them.`);
  }
  
  return missingFiles.length === 0;
}

// Function to validate Jest configuration
function validateJestConfig() {
  logHeader('Validating Jest Configuration');
  
  const jestConfigPath = path.join(__dirname, '../jest.config.js');
  
  if (!fs.existsSync(jestConfigPath)) {
    logError('jest.config.js not found');
    return false;
  }
  
  try {
    const jestConfig = require(jestConfigPath);
    
    // Check essential configuration
    const requiredFields = ['preset', 'setupFilesAfterEnv', 'testMatch', 'moduleNameMapping'];
    const missingFields = requiredFields.filter(field => !jestConfig[field]);
    
    if (missingFields.length > 0) {
      logError(`Missing Jest configuration fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    logSuccess('Jest configuration is valid');
    
    // Check setup file
    const setupFile = jestConfig.setupFilesAfterEnv[0]?.replace('<rootDir>/', '');
    if (setupFile && fs.existsSync(path.join(__dirname, '..', setupFile))) {
      logSuccess('Test setup file found');
    } else {
      logWarning('Test setup file not found');
    }
    
    return true;
  } catch (error) {
    logError(`Jest configuration error: ${error.message}`);
    return false;
  }
}

// Function to check dependencies
function checkDependencies() {
  logHeader('Checking Test Dependencies');
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    logError('package.json not found');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const devDependencies = packageJson.devDependencies || {};
    
    const requiredDependencies = [
      'jest',
      '@testing-library/react-native',
      'msw',
      'babel-jest',
      'react-test-renderer',
    ];
    
    const missingDependencies = requiredDependencies.filter(dep => !devDependencies[dep]);
    
    if (missingDependencies.length > 0) {
      logError(`Missing test dependencies: ${missingDependencies.join(', ')}`);
      logInfo('Run: npm install --save-dev ' + missingDependencies.join(' '));
      return false;
    }
    
    logSuccess('All test dependencies are installed');
    
    // Check test scripts
    const scripts = packageJson.scripts || {};
    const testScripts = ['test', 'test:watch', 'test:coverage'];
    const missingScripts = testScripts.filter(script => !scripts[script]);
    
    if (missingScripts.length > 0) {
      logWarning(`Missing test scripts: ${missingScripts.join(', ')}`);
    } else {
      logSuccess('Test scripts are configured');
    }
    
    return true;
  } catch (error) {
    logError(`Package.json error: ${error.message}`);
    return false;
  }
}

// Function to run basic smoke tests
function runSmokeTests() {
  logHeader('Running Smoke Tests');
  
  logInfo('Testing API configuration...');
  
  try {
    const configPath = path.join(TEST_CONFIG.testDir, 'config/testConfig.ts');
    
    if (fs.existsSync(configPath)) {
      logSuccess('Test configuration file exists');
    } else {
      logError('Test configuration file missing');
      return false;
    }
    
    const handlersPath = path.join(TEST_CONFIG.testDir, 'mocks/handlers.ts');
    
    if (fs.existsSync(handlersPath)) {
      logSuccess('MSW handlers file exists');
    } else {
      logError('MSW handlers file missing');
      return false;
    }
    
    logSuccess('Smoke tests passed');
    return true;
    
  } catch (error) {
    logError(`Smoke test error: ${error.message}`);
    return false;
  }
}

// Main execution function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  try {
    switch (command) {
      case 'check':
        logHeader('SAM API Test Validation');
        const filesOk = checkTestFiles();
        const jestOk = validateJestConfig();
        const depsOk = checkDependencies();
        const smokeOk = runSmokeTests();
        
        if (filesOk && jestOk && depsOk && smokeOk) {
          logSuccess('\\n🎉 All checks passed! Tests are ready to run.');
          logInfo('Run "npm test" to execute the test suite');
        } else {
          logError('\\n❌ Some checks failed. Please fix the issues above.');
          process.exit(1);
        }
        break;
        
      case 'help':
      default:
        logHeader('SAM API Test Runner');
        log('Usage: node testRunner.js [command] [options]\\n');
        log('Commands:');
        log('  check     - Validate test setup and configuration (default)');
        log('  help      - Show this help message\\n');
        log('Examples:');
        log('  node testRunner.js check');
        break;
    }
  } catch (error) {
    logError(`Execution error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkTestFiles,
  validateJestConfig,
  checkDependencies,
  runSmokeTests,
};