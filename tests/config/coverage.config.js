/**
 * Enhanced Coverage Reporting Configuration
 * Comprehensive test coverage metrics and detailed reporting for SAM Mobile App
 */

module.exports = {
  // ===== COVERAGE COLLECTION CONFIGURATION =====
  
  // Files to include in coverage collection
  collectCoverageFrom: [
    // Core application files
    'utils/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}', 
    'context/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    
    // Exclude problematic patterns
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/__tests__/**',
    '!**/test-utils/**',
    '!**/*.config.js',
    '!**/*.setup.js',
    '!app/_layout.tsx',
    '!app/+html.tsx',
    '!**/*.web.{js,jsx,ts,tsx}',
    '!**/*.ios.{js,jsx,ts,tsx}', 
    '!**/*.android.{js,jsx,ts,tsx}',
    '!components/ui/**', // Temporarily excluded due to Babel issues
  ],

  // ===== COVERAGE THRESHOLDS =====
  
  // Quality gates for code coverage
  coverageThreshold: {
    global: {
      branches: 70,     // 70% branch coverage
      functions: 70,    // 70% function coverage
      lines: 75,        // 75% line coverage
      statements: 75,   // 75% statement coverage
    },
    
    // Module-specific thresholds (stricter for critical modules)
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
    
    './context/': {
      branches: 75,
      functions: 75,
      lines: 80,
      statements: 80,
    },
    
    './components/': {
      branches: 65,
      functions: 70,
      lines: 75,
      statements: 75,
    },
    
    // API-related utilities (critical for business logic)
    './utils/api.ts': {
      branches: 90,
      functions: 90,
      lines: 95,
      statements: 95,
    },
    
    // Authentication hooks (security critical)
    './hooks/auth/': {
      branches: 85,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },

  // ===== COVERAGE REPORTING FORMATS =====
  
  coverageDirectory: 'coverage',
  coverageReporters: [
    // Console output formats
    'text',                    // Detailed console output with colors
    'text-summary',            // Brief summary for CI logs
    
    // File-based reports
    'lcov',                    // For VS Code extensions and SonarQube
    'html',                    // Interactive HTML report
    'json',                    // Machine-readable JSON format
    'json-summary',            // Summary statistics in JSON
    'cobertura',              // For Azure DevOps and Jenkins
    'clover',                 // XML format for various CI tools
    
    // Additional formats for comprehensive reporting
    ['text-lcov', { file: 'lcov.info' }], // Explicit LCOV file
  ],

  // ===== COVERAGE ANALYSIS CONFIGURATION =====
  
  // Paths to ignore in coverage calculation
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/__tests__/',
    '/coverage/',
    '\\.d\\.ts$',
    '\\.mock\\.',
    '\\.test\\.',
    '\\.spec\\.',
  ],

  // ===== ADVANCED COVERAGE OPTIONS =====
  
  // Coverage provider configuration
  coverageProvider: 'v8', // Use V8 coverage (more accurate than Babel)
  
  // Force coverage collection (even for unused files)
  forceCoverageMatch: [
    '**/utils/**',
    '**/hooks/**',
    '**/context/**',
  ],

  // ===== CUSTOM COVERAGE SCRIPTS =====
  
  // Coverage collection strategies for different scenarios
  coverageStrategies: {
    // Full coverage (all files)
    full: {
      collectCoverageFrom: [
        'utils/**/*.{js,jsx,ts,tsx}',
        'hooks/**/*.{js,jsx,ts,tsx}',
        'context/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/coverage/**',
        '!**/tests/**',
      ],
      coverageThreshold: {
        global: {
          branches: 65,
          functions: 65,
          lines: 70,
          statements: 70,
        }
      }
    },

    // Critical modules only (stricter thresholds)
    critical: {
      collectCoverageFrom: [
        'utils/api.ts',
        'utils/errorHandler.ts',
        'hooks/auth/**/*.{js,jsx,ts,tsx}',
        'context/auth-context.tsx',
      ],
      coverageThreshold: {
        global: {
          branches: 85,
          functions: 85,
          lines: 90,
          statements: 90,
        }
      }
    },

    // API layer focus
    api: {
      collectCoverageFrom: [
        'utils/api.ts',
        'utils/errorHandler.ts',
        'hooks/data/**/*.{js,jsx,ts,tsx}',
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 85,
          statements: 85,
        }
      }
    },

    // UI components focus
    ui: {
      collectCoverageFrom: [
        'components/**/*.{js,jsx,ts,tsx}',
        'hooks/ui/**/*.{js,jsx,ts,tsx}',
        '!components/ui/**', // Exclude problematic UI components
      ],
      coverageThreshold: {
        global: {
          branches: 60,
          functions: 65,
          lines: 70,
          statements: 70,
        }
      }
    }
  },

  // ===== COVERAGE QUALITY METRICS =====
  
  // Define what constitutes good coverage
  qualityMetrics: {
    excellent: { branches: 90, functions: 90, lines: 95, statements: 95 },
    good: { branches: 80, functions: 80, lines: 85, statements: 85 },
    acceptable: { branches: 70, functions: 70, lines: 75, statements: 75 },
    poor: { branches: 50, functions: 50, lines: 60, statements: 60 },
  },

  // ===== COVERAGE REPORTING ENHANCEMENTS =====
  
  // Custom report configurations
  reports: {
    // Detailed HTML report with enhanced features
    html: {
      subdir: 'html-report',
      skipCovered: false,
      skipEmpty: false,
    },
    
    // LCOV report for external tools
    lcov: {
      subdir: 'lcov-report',
      outputFile: 'lcov.info',
    },
    
    // JSON report for programmatic analysis
    json: {
      subdir: 'json-report', 
      outputFile: 'coverage.json',
    },
    
    // Cobertura for Azure DevOps
    cobertura: {
      subdir: 'cobertura-report',
      outputFile: 'cobertura-coverage.xml',
    },
  },

  // ===== INTEGRATION WITH CI/CD =====
  
  // CI-specific configurations
  ci: {
    // Fail build if coverage falls below thresholds
    failOnLowCoverage: true,
    
    // Coverage comparison with previous builds
    coverageComparison: {
      enabled: true,
      threshold: -2, // Fail if coverage drops by more than 2%
    },
    
    // Coverage reporting to external services
    externalReporting: {
      sonarqube: {
        enabled: false,
        reportPath: 'coverage/lcov.info',
      },
      codecov: {
        enabled: false,
        reportPath: 'coverage/lcov.info',
      },
      coveralls: {
        enabled: false,
        reportPath: 'coverage/lcov.info',
      },
    },
  },

  // ===== PERFORMANCE OPTIMIZATION =====
  
  // Optimize coverage collection for performance
  performance: {
    // Skip coverage for test files
    skipTestFiles: true,
    
    // Use cache for faster subsequent runs
    useCache: true,
    
    // Parallel processing
    maxWorkers: '50%',
    
    // Memory optimization
    maxMemoryUsage: '2GB',
  },
};