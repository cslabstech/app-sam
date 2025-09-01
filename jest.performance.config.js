/**
 * Jest Performance Configuration
 * Optimized settings for React Native test performance
 */

module.exports = {
  // Performance optimizations
  preset: 'react-native',
  
  // Test execution optimization
  maxWorkers: process.env.CI ? 2 : '50%', // Limit workers in CI, use 50% CPU cores locally
  workerIdleMemoryLimit: '500MB',
  
  // Cache optimization
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Test discovery and execution
  testMatch: [
    '<rootDir>/tests/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/tests/**/*.(test|spec).[jt]s?(x)'
  ],
  
  // Module resolution optimization
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1'
  },
  
  // Setup files
  setupFiles: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/tests/performance-setup.js'
  ],
  
  setupFilesAfterEnv: [
    '<rootDir>/tests/jest-setup.js'
  ],
  
  // Transform optimization
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-navigation|@react-navigation|@expo|expo|react-native-vector-icons|react-native-image-picker|@react-native-community|react-native-fs)/)'
  ],
  
  // Test environment
  testEnvironment: 'node',
  
  // Coverage configuration (optimized for performance)
  collectCoverage: false, // Disable by default for performance
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.expo/',
    '/coverage/',
    '/test-results/'
  ],
  
  // Performance monitoring
  logHeapUsage: true,
  detectOpenHandles: true,
  forceExit: true,
  
  // Reporter optimization
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }],
    ['<rootDir>/scripts/performance-reporter.js', {
      outputFile: 'test-results/performance-metrics.json'
    }]
  ],
  
  // Test timeout optimization
  testTimeout: process.env.CI ? 15000 : 10000,
  
  // Bail configuration for fast failure detection
  bail: process.env.CI ? 1 : false,
  
  // Silent mode for performance testing
  silent: process.env.PERFORMANCE_TEST === 'true',
  verbose: process.env.PERFORMANCE_TEST !== 'true'
};