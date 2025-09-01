module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|@unimodules|@testing-library/react-native|msw)/)',
  ],
  testMatch: [
    '<rootDir>/tests/**/*.test.(js|jsx|ts|tsx)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^expo-constants$': '<rootDir>/tests/mocks/expo-constants.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/tests/mocks/async-storage.js',
    '^expo-router$': '<rootDir>/tests/mocks/expo-router.js',
  },
  // Enhanced Coverage Configuration
  collectCoverage: false, // Set to true when running coverage
  collectCoverageFrom: [
    // Core application files (focus on tested modules)
    'utils/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'context/**/*.{js,jsx,ts,tsx}',
    
    // Exclude problematic patterns
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/__tests__/**',
    '!**/test-utils/**',
    '!**/*.config.js',
    '!**/*.setup.js',
    '!app/_layout.tsx', // Expo app entry point
    '!app/+html.tsx', // Expo web config
    '!**/*.web.{js,jsx,ts,tsx}', // Web-specific files
    '!**/*.ios.{js,jsx,ts,tsx}', // iOS-specific files (causing Babel issues)
    '!**/*.android.{js,jsx,ts,tsx}', // Android-specific files
    '!components/ui/**', // Exclude UI components for now due to Babel issues
  ],
  
  // Coverage thresholds for quality gates
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70, 
      lines: 75,
      statements: 75,
    },
    // Specific thresholds for critical modules
    './utils/': {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
    './hooks/': {
      branches: 75,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  
  // Coverage reporting options
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text', // Console output
    'text-summary', // Brief summary
    'lcov', // For CI/CD and VS Code extensions
    'html', // Detailed HTML report
    'json', // Machine-readable format
    'json-summary', // Summary in JSON
    'cobertura', // For Azure DevOps/Jenkins
  ],
  
  // Path mapping for coverage reports
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/__tests__/',
    '/coverage/',
    '\.d\.ts$',
  ],
  // Test environment and performance
  testEnvironment: 'node',
  testTimeout: 10000,
  maxWorkers: '50%', // Optimize for CI environments
  
  // Enhanced error reporting
  verbose: false, // Set to true for detailed test output
  bail: false, // Continue running tests after failures
  errorOnDeprecated: true,
};