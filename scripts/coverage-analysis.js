#!/usr/bin/env node

/**
 * Coverage Analysis and Reporting Script
 * Provides detailed analysis of test coverage metrics and generates insights
 */

const fs = require('fs');
const path = require('path');

class CoverageAnalyzer {
  constructor() {
    this.coverageData = null;
    this.thresholds = {
      excellent: { branches: 90, functions: 90, lines: 95, statements: 95 },
      good: { branches: 80, functions: 80, lines: 85, statements: 85 },
      acceptable: { branches: 70, functions: 70, lines: 75, statements: 75 },
      poor: { branches: 50, functions: 50, lines: 60, statements: 60 },
    };
  }

  /**
   * Load coverage data from JSON report
   */
  loadCoverageData() {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');
    
    if (!fs.existsSync(coveragePath)) {
      throw new Error('Coverage data not found. Run tests with coverage first.');
    }

    try {
      this.coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      console.log('✅ Coverage data loaded successfully');
    } catch (error) {
      throw new Error(`Failed to load coverage data: ${error.message}`);
    }
  }

  /**
   * Calculate overall coverage metrics
   */
  calculateOverallMetrics() {
    if (!this.coverageData) {
      throw new Error('Coverage data not loaded');
    }

    let totalLines = 0;
    let coveredLines = 0;
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalBranches = 0;
    let coveredBranches = 0;

    Object.values(this.coverageData).forEach(fileData => {
      // Lines
      totalLines += Object.keys(fileData.l || {}).length;
      coveredLines += Object.values(fileData.l || {}).filter(count => count > 0).length;

      // Statements
      totalStatements += Object.keys(fileData.s || {}).length;
      coveredStatements += Object.values(fileData.s || {}).filter(count => count > 0).length;

      // Functions
      totalFunctions += Object.keys(fileData.f || {}).length;
      coveredFunctions += Object.values(fileData.f || {}).filter(count => count > 0).length;

      // Branches
      totalBranches += Object.keys(fileData.b || {}).length * 2; // Assuming binary branches
      Object.values(fileData.b || {}).forEach(branchArray => {
        coveredBranches += branchArray.filter(count => count > 0).length;
      });
    });

    return {
      lines: totalLines > 0 ? (coveredLines / totalLines * 100).toFixed(2) : 0,
      statements: totalStatements > 0 ? (coveredStatements / totalStatements * 100).toFixed(2) : 0,
      functions: totalFunctions > 0 ? (coveredFunctions / totalFunctions * 100).toFixed(2) : 0,
      branches: totalBranches > 0 ? (coveredBranches / totalBranches * 100).toFixed(2) : 0,
    };
  }

  /**
   * Analyze coverage by module/directory
   */
  analyzeByModule() {
    const moduleStats = {};

    Object.entries(this.coverageData).forEach(([filePath, fileData]) => {
      const relativePath = filePath.replace(process.cwd() + '/', '');
      const module = relativePath.split('/')[0];

      if (!moduleStats[module]) {
        moduleStats[module] = {
          files: 0,
          lines: { total: 0, covered: 0 },
          statements: { total: 0, covered: 0 },
          functions: { total: 0, covered: 0 },
          branches: { total: 0, covered: 0 },
        };
      }

      moduleStats[module].files++;

      // Calculate metrics for this file
      const lineTotal = Object.keys(fileData.l || {}).length;
      const lineCovered = Object.values(fileData.l || {}).filter(count => count > 0).length;
      moduleStats[module].lines.total += lineTotal;
      moduleStats[module].lines.covered += lineCovered;

      const stmtTotal = Object.keys(fileData.s || {}).length;
      const stmtCovered = Object.values(fileData.s || {}).filter(count => count > 0).length;
      moduleStats[module].statements.total += stmtTotal;
      moduleStats[module].statements.covered += stmtCovered;

      const funcTotal = Object.keys(fileData.f || {}).length;
      const funcCovered = Object.values(fileData.f || {}).filter(count => count > 0).length;
      moduleStats[module].functions.total += funcTotal;
      moduleStats[module].functions.covered += funcCovered;

      const branchTotal = Object.keys(fileData.b || {}).length * 2;
      let branchCovered = 0;
      Object.values(fileData.b || {}).forEach(branchArray => {
        branchCovered += branchArray.filter(count => count > 0).length;
      });
      moduleStats[module].branches.total += branchTotal;
      moduleStats[module].branches.covered += branchCovered;
    });

    // Calculate percentages
    Object.keys(moduleStats).forEach(module => {
      const stats = moduleStats[module];
      stats.percentages = {
        lines: stats.lines.total > 0 ? (stats.lines.covered / stats.lines.total * 100).toFixed(2) : 0,
        statements: stats.statements.total > 0 ? (stats.statements.covered / stats.statements.total * 100).toFixed(2) : 0,
        functions: stats.functions.total > 0 ? (stats.functions.covered / stats.functions.total * 100).toFixed(2) : 0,
        branches: stats.branches.total > 0 ? (stats.branches.covered / stats.branches.total * 100).toFixed(2) : 0,
      };
    });

    return moduleStats;
  }

  /**
   * Identify files with low coverage
   */
  findLowCoverageFiles(threshold = 70) {
    const lowCoverageFiles = [];

    Object.entries(this.coverageData).forEach(([filePath, fileData]) => {
      const relativePath = filePath.replace(process.cwd() + '/', '');
      
      const lineTotal = Object.keys(fileData.l || {}).length;
      const lineCovered = Object.values(fileData.l || {}).filter(count => count > 0).length;
      const linePercentage = lineTotal > 0 ? (lineCovered / lineTotal * 100) : 0;

      if (linePercentage < threshold && lineTotal > 0) {
        lowCoverageFiles.push({
          file: relativePath,
          coverage: linePercentage.toFixed(2),
          uncoveredLines: lineTotal - lineCovered,
          totalLines: lineTotal,
        });
      }
    });

    return lowCoverageFiles.sort((a, b) => a.coverage - b.coverage);
  }

  /**
   * Generate quality assessment
   */
  assessQuality(metrics) {
    const scores = Object.entries(this.thresholds).map(([quality, thresholds]) => {
      const score = Object.keys(thresholds).reduce((acc, metric) => {
        return acc + (parseFloat(metrics[metric]) >= thresholds[metric] ? 1 : 0);
      }, 0);
      return { quality, score, total: Object.keys(thresholds).length };
    });

    // Find the best matching quality level
    const bestMatch = scores.find(s => s.score === s.total);
    if (bestMatch) return bestMatch.quality;

    // If no perfect match, find the best partial match
    const sortedScores = scores.sort((a, b) => b.score - a.score);
    return sortedScores[0].quality;
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n🔍 SAM Mobile App - Coverage Analysis Report');
    console.log('='.repeat(50));

    // Overall metrics
    const overallMetrics = this.calculateOverallMetrics();
    const quality = this.assessQuality(overallMetrics);

    console.log('\n📊 Overall Coverage Metrics:');
    console.log(`   Lines:      ${overallMetrics.lines}%`);
    console.log(`   Statements: ${overallMetrics.statements}%`);
    console.log(`   Functions:  ${overallMetrics.functions}%`);
    console.log(`   Branches:   ${overallMetrics.branches}%`);
    console.log(`   Quality:    ${quality.toUpperCase()}`);

    // Module analysis
    const moduleStats = this.analyzeByModule();
    console.log('\n📁 Coverage by Module:');
    Object.entries(moduleStats).forEach(([module, stats]) => {
      console.log(`   ${module}:`);
      console.log(`     Files: ${stats.files}`);
      console.log(`     Lines: ${stats.percentages.lines}%`);
      console.log(`     Functions: ${stats.percentages.functions}%`);
      console.log(`     Branches: ${stats.percentages.branches}%`);
    });

    // Low coverage files
    const lowCoverageFiles = this.findLowCoverageFiles(70);
    if (lowCoverageFiles.length > 0) {
      console.log('\n⚠️  Files with Low Coverage (<70%):');
      lowCoverageFiles.slice(0, 10).forEach(file => {
        console.log(`   ${file.file}: ${file.coverage}% (${file.uncoveredLines}/${file.totalLines} lines uncovered)`);
      });
      
      if (lowCoverageFiles.length > 10) {
        console.log(`   ... and ${lowCoverageFiles.length - 10} more files`);
      }
    } else {
      console.log('\n✅ All files meet the 70% coverage threshold!');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (parseFloat(overallMetrics.branches) < 70) {
      console.log('   • Focus on improving branch coverage by adding tests for conditional logic');
    }
    if (parseFloat(overallMetrics.functions) < 80) {
      console.log('   • Add tests for uncovered functions, especially in utility modules');
    }
    if (lowCoverageFiles.length > 5) {
      console.log('   • Prioritize testing for the lowest coverage files');
    }
    if (quality === 'poor') {
      console.log('   • Coverage is below acceptable thresholds - immediate attention required');
    } else if (quality === 'acceptable') {
      console.log('   • Coverage meets minimum requirements but could be improved');
    } else if (quality === 'good') {
      console.log('   • Good coverage! Consider pushing for excellent coverage on critical modules');
    } else {
      console.log('   • Excellent coverage! Maintain this high standard');
    }

    console.log('\n📋 Next Steps:');
    console.log('   1. Review files with <70% coverage');
    console.log('   2. Add tests for uncovered branches and functions');
    console.log('   3. Focus on critical business logic modules');
    console.log('   4. Consider integration tests for complex workflows');

    return {
      overall: overallMetrics,
      quality,
      modules: moduleStats,
      lowCoverage: lowCoverageFiles,
    };
  }

  /**
   * Save detailed report to file
   */
  saveReport(reportData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(process.cwd(), 'coverage', `coverage-analysis-${timestamp}.json`);
    
    const detailedReport = {
      timestamp: new Date().toISOString(),
      summary: reportData.overall,
      quality: reportData.quality,
      modules: reportData.modules,
      lowCoverageFiles: reportData.lowCoverage,
      recommendations: this.generateRecommendations(reportData),
    };

    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(reportData) {
    const recommendations = [];

    // Coverage-based recommendations
    if (parseFloat(reportData.overall.branches) < 70) {
      recommendations.push({
        priority: 'high',
        type: 'coverage',
        message: 'Branch coverage is below 70%. Add tests for conditional statements, loops, and error handling paths.',
      });
    }

    // Module-based recommendations
    Object.entries(reportData.modules).forEach(([module, stats]) => {
      if (parseFloat(stats.percentages.lines) < 60) {
        recommendations.push({
          priority: 'high',
          type: 'module',
          message: `Module "${module}" has very low coverage (${stats.percentages.lines}%). This module needs immediate attention.`,
        });
      }
    });

    // File-based recommendations
    if (reportData.lowCoverage.length > 10) {
      recommendations.push({
        priority: 'medium',
        type: 'files',
        message: `${reportData.lowCoverage.length} files have low coverage. Focus on the files with the least coverage first.`,
      });
    }

    return recommendations;
  }
}

// Main execution
if (require.main === module) {
  const analyzer = new CoverageAnalyzer();
  
  try {
    analyzer.loadCoverageData();
    const reportData = analyzer.generateReport();
    analyzer.saveReport(reportData);
    
    // Exit with appropriate code
    const quality = reportData.quality;
    if (quality === 'poor') {
      process.exit(1); // Fail for poor coverage
    } else {
      process.exit(0); // Success for acceptable or better
    }
  } catch (error) {
    console.error('❌ Coverage analysis failed:', error.message);
    process.exit(1);
  }
}

module.exports = CoverageAnalyzer;