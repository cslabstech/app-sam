#!/usr/bin/env node

/**
 * Test Performance Dashboard
 * Real-time monitoring and visualization of test performance metrics
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

class PerformanceDashboard {
  constructor(port = 3001) {
    this.port = port;
    this.metricsHistory = [];
    this.currentMetrics = {};
    this.server = null;
  }

  start() {
    console.log('🚀 Starting Test Performance Dashboard...');
    
    this.loadHistoricalData();
    this.startServer();
    this.startMetricsCollection();
    
    console.log(`📊 Dashboard available at: http://localhost:${this.port}`);
    console.log('Press Ctrl+C to stop the dashboard');
  }

  loadHistoricalData() {
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
      return;
    }

    try {
      // Load recent performance metrics
      const files = fs.readdirSync(resultsDir)
        .filter(f => f.startsWith('performance-') && f.endsWith('.json'))
        .sort()
        .slice(-10); // Last 10 runs

      files.forEach(file => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
          this.metricsHistory.push({
            timestamp: data.timestamp,
            totalTime: data.performance?.totalExecutionTime || 0,
            memoryUsage: data.performance?.memoryUsage?.totalHeapUsedMB || 0,
            testCount: Object.keys(data.testSuites || {}).length,
            slowTests: data.performance?.slowTests?.length || 0
          });
        } catch (e) {
          console.warn(`Failed to load ${file}:`, e.message);
        }
      });

      console.log(`📈 Loaded ${this.metricsHistory.length} historical performance records`);
    } catch (error) {
      console.warn('Failed to load historical data:', error.message);
    }
  }

  startServer() {
    this.server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${this.port}`);
      
      if (url.pathname === '/') {
        this.serveDashboard(res);
      } else if (url.pathname === '/api/metrics') {
        this.serveMetrics(res);
      } else if (url.pathname === '/api/run-tests') {
        this.runPerformanceTest(res);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    this.server.listen(this.port, () => {
      console.log(`🌐 Dashboard server started on port ${this.port}`);
    });
  }

  serveDashboard(res) {
    const html = this.generateDashboardHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  serveMetrics(res) {
    const data = {
      history: this.metricsHistory,
      current: this.currentMetrics,
      summary: this.generateSummary()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  async runPerformanceTest(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    try {
      console.log('🧪 Running performance test...');
      
      const result = execSync('node scripts/test-performance.js', {
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      // Reload metrics after test
      this.loadHistoricalData();
      
      res.end(JSON.stringify({
        success: true,
        message: 'Performance test completed successfully',
        output: result
      }));
    } catch (error) {
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
  }

  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Performance Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }
        .metric-label {
            color: #666;
            margin-top: 10px;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .controls {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover {
            background: #0056b3;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            display: none;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }
        .loading.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Test Performance Dashboard</h1>
        <p>Real-time monitoring of Jest test performance metrics</p>
        
        <div class="controls">
            <button onclick="runPerformanceTest()">🧪 Run Performance Test</button>
            <button onclick="refreshMetrics()">🔄 Refresh Metrics</button>
            <button onclick="exportData()">📊 Export Data</button>
        </div>
        
        <div id="status" class="status"></div>
        <div id="loading" class="loading">
            <p>Running performance test... This may take a few minutes.</p>
        </div>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value" id="totalTime">--</div>
            <div class="metric-label">Total Execution Time (ms)</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="memoryUsage">--</div>
            <div class="metric-label">Peak Memory Usage (MB)</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="testCount">--</div>
            <div class="metric-label">Test Suites</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="slowTests">--</div>
            <div class="metric-label">Slow Tests</div>
        </div>
    </div>

    <div class="chart-container">
        <h3>📈 Performance Trends</h3>
        <canvas id="performanceChart" width="400" height="200"></canvas>
    </div>

    <div class="chart-container">
        <h3>🧠 Memory Usage Trends</h3>
        <canvas id="memoryChart" width="400" height="200"></canvas>
    </div>

    <script>
        let performanceChart, memoryChart;
        
        async function loadMetrics() {
            try {
                const response = await fetch('/api/metrics');
                const data = await response.json();
                
                updateMetricCards(data.summary || {});
                updateCharts(data.history || []);
                
                return data;
            } catch (error) {
                console.error('Failed to load metrics:', error);
                showStatus('Failed to load metrics: ' + error.message, 'error');
            }
        }
        
        function updateMetricCards(summary) {
            document.getElementById('totalTime').textContent = 
                summary.totalTime ? summary.totalTime.toLocaleString() : '--';
            document.getElementById('memoryUsage').textContent = 
                summary.memoryUsage ? summary.memoryUsage.toFixed(1) : '--';
            document.getElementById('testCount').textContent = 
                summary.testCount || '--';
            document.getElementById('slowTests').textContent = 
                summary.slowTests || '--';
        }
        
        function updateCharts(history) {
            const labels = history.map(h => new Date(h.timestamp).toLocaleTimeString());
            const executionTimes = history.map(h => h.totalTime);
            const memoryUsages = history.map(h => h.memoryUsage);
            
            // Performance Chart
            if (performanceChart) performanceChart.destroy();
            
            const perfCtx = document.getElementById('performanceChart').getContext('2d');
            performanceChart = new Chart(perfCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Execution Time (ms)',
                        data: executionTimes,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            // Memory Chart
            if (memoryChart) memoryChart.destroy();
            
            const memCtx = document.getElementById('memoryChart').getContext('2d');
            memoryChart = new Chart(memCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Memory Usage (MB)',
                        data: memoryUsages,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        async function runPerformanceTest() {
            const button = event.target;
            button.disabled = true;
            
            document.getElementById('loading').classList.add('active');
            hideStatus();
            
            try {
                const response = await fetch('/api/run-tests', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    showStatus('Performance test completed successfully!', 'success');
                    await loadMetrics(); // Reload data
                } else {
                    showStatus('Performance test failed: ' + result.error, 'error');
                }
            } catch (error) {
                showStatus('Failed to run performance test: ' + error.message, 'error');
            } finally {
                button.disabled = false;
                document.getElementById('loading').classList.remove('active');
            }
        }
        
        async function refreshMetrics() {
            await loadMetrics();
            showStatus('Metrics refreshed!', 'success');
        }
        
        function exportData() {
            // This would trigger a download of the metrics data
            window.open('/api/metrics', '_blank');
        }
        
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = \`status \${type}\`;
            status.style.display = 'block';
            
            setTimeout(() => {
                hideStatus();
            }, 5000);
        }
        
        function hideStatus() {
            document.getElementById('status').style.display = 'none';
        }
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', () => {
            loadMetrics();
            
            // Auto-refresh every 30 seconds
            setInterval(loadMetrics, 30000);
        });
    </script>
</body>
</html>`;
  }

  generateSummary() {
    if (this.metricsHistory.length === 0) {
      return {
        totalTime: 0,
        memoryUsage: 0,
        testCount: 0,
        slowTests: 0
      };
    }

    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    return {
      totalTime: latest.totalTime,
      memoryUsage: latest.memoryUsage,
      testCount: latest.testCount,
      slowTests: latest.slowTests,
      trend: this.calculateTrend()
    };
  }

  calculateTrend() {
    if (this.metricsHistory.length < 2) return 'stable';
    
    const recent = this.metricsHistory.slice(-3);
    const avgRecent = recent.reduce((sum, m) => sum + m.totalTime, 0) / recent.length;
    
    const older = this.metricsHistory.slice(-6, -3);
    if (older.length === 0) return 'stable';
    
    const avgOlder = older.reduce((sum, m) => sum + m.totalTime, 0) / older.length;
    
    if (avgRecent > avgOlder * 1.1) return 'degrading';
    if (avgRecent < avgOlder * 0.9) return 'improving';
    return 'stable';
  }

  startMetricsCollection() {
    // Watch for new performance reports
    const resultsDir = path.join(process.cwd(), 'test-results');
    
    if (fs.existsSync(resultsDir)) {
      fs.watchFile(resultsDir, (curr, prev) => {
        // Reload when new files are added
        setTimeout(() => {
          this.loadHistoricalData();
        }, 1000);
      });
    }
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('📊 Dashboard server stopped');
    }
  }
}

// CLI Interface
if (require.main === module) {
  const port = process.argv[2] || 3001;
  const dashboard = new PerformanceDashboard(port);
  
  dashboard.start();
  
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping dashboard...');
    dashboard.stop();
    process.exit(0);
  });
}

module.exports = { PerformanceDashboard };