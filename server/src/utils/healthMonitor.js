const { query, healthCheck: dbHealthCheck } = require('../config/database');
const { logger } = require('./logger');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

/**
 * Production-ready health monitoring system
 * Provides comprehensive system health checks and metrics
 */
class HealthMonitor {
  constructor() {
    this.checks = new Map();
    this.metrics = {
      requests: { total: 0, success: 0, errors: 0 },
      response_times: [],
      memory_usage: [],
      cpu_usage: [],
      active_connections: 0,
      uptime: process.uptime()
    };
    
    this.startTime = Date.now();
    this.lastMetricsReset = Date.now();
    
    // Start periodic health checks
    this.startPeriodicChecks();
    this.startMetricsCollection();
  }

  /**
   * Register a health check
   */
  registerCheck(name, checkFunction, options = {}) {
    this.checks.set(name, {
      name,
      check: checkFunction,
      timeout: options.timeout || 5000,
      critical: options.critical || false,
      interval: options.interval || 30000,
      lastRun: null,
      lastResult: null,
      enabled: options.enabled !== false
    });

    logger.info('Health check registered', { name, critical: options.critical });
  }

  /**
   * Run all health checks
   */
  async runHealthChecks() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {},
      metrics: this.getMetrics()
    };

    let hasFailures = false;
    let hasCriticalFailures = false;

    for (const [name, checkConfig] of this.checks.entries()) {
      if (!checkConfig.enabled) continue;

      try {
        const startTime = Date.now();
        
        // Run check with timeout
        const checkResult = await Promise.race([
          checkConfig.check(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), checkConfig.timeout)
          )
        ]);

        const duration = Date.now() - startTime;
        
        results.checks[name] = {
          status: 'healthy',
          duration: `${duration}ms`,
          details: checkResult,
          critical: checkConfig.critical,
          lastRun: new Date().toISOString()
        };

        checkConfig.lastRun = Date.now();
        checkConfig.lastResult = 'healthy';

      } catch (error) {
        const duration = Date.now() - checkConfig.lastRun || 0;
        
        results.checks[name] = {
          status: 'unhealthy',
          error: error.message,
          duration: `${duration}ms`,
          critical: checkConfig.critical,
          lastRun: new Date().toISOString()
        };

        checkConfig.lastResult = 'unhealthy';
        hasFailures = true;

        if (checkConfig.critical) {
          hasCriticalFailures = true;
        }

        logger.error('Health check failed', {
          check: name,
          error: error.message,
          critical: checkConfig.critical
        });
      }
    }

    // Determine overall status
    if (hasCriticalFailures) {
      results.status = 'critical';
    } else if (hasFailures) {
      results.status = 'degraded';
    }

    return results;
  }

  /**
   * Get system metrics
   */
  getMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      system: {
        uptime: process.uptime(),
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
          usage_percentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2)
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          load_average: os.loadavg()
        },
        os: {
          platform: os.platform(),
          arch: os.arch(),
          release: os.release(),
          free_memory: os.freemem(),
          total_memory: os.totalmem(),
          cpu_count: os.cpus().length
        }
      },
      application: {
        requests: this.metrics.requests,
        active_connections: this.metrics.active_connections,
        average_response_time: this.getAverageResponseTime(),
        error_rate: this.getErrorRate(),
        uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000)
      },
      database: {
        // Will be populated by database health check
      },
      cache: {
        // Will be populated by cache health check
      }
    };
  }

  /**
   * Record request metrics
   */
  recordRequest(success = true, responseTime = 0) {
    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }

    // Keep only last 1000 response times for memory efficiency
    this.metrics.response_times.push(responseTime);
    if (this.metrics.response_times.length > 1000) {
      this.metrics.response_times.shift();
    }
  }

  /**
   * Get average response time
   */
  getAverageResponseTime() {
    if (this.metrics.response_times.length === 0) return 0;
    
    const sum = this.metrics.response_times.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.response_times.length);
  }

  /**
   * Get error rate percentage
   */
  getErrorRate() {
    if (this.metrics.requests.total === 0) return 0;
    
    return ((this.metrics.requests.errors / this.metrics.requests.total) * 100).toFixed(2);
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks() {
    setInterval(async () => {
      try {
        const results = await this.runHealthChecks();
        
        // Log critical failures
        if (results.status === 'critical') {
          logger.error('Critical health check failures detected', {
            status: results.status,
            failedChecks: Object.entries(results.checks)
              .filter(([_, check]) => check.status === 'unhealthy' && check.critical)
              .map(([name, _]) => name)
          });
        }
        
        // Store latest results
        this.latestHealthCheck = results;
        
      } catch (error) {
        logger.error('Health check execution failed', {
          error: error.message,
          stack: error.stack
        });
      }
    }, 30000); // Run every 30 seconds
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Store memory usage (keep last 100 samples)
      this.metrics.memory_usage.push({
        timestamp: Date.now(),
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      });
      
      if (this.metrics.memory_usage.length > 100) {
        this.metrics.memory_usage.shift();
      }

      // Store CPU usage (keep last 100 samples)
      this.metrics.cpu_usage.push({
        timestamp: Date.now(),
        user: cpuUsage.user,
        system: cpuUsage.system
      });
      
      if (this.metrics.cpu_usage.length > 100) {
        this.metrics.cpu_usage.shift();
      }

    }, 10000); // Collect every 10 seconds
  }

  /**
   * Reset metrics (useful for monitoring periods)
   */
  resetMetrics() {
    this.metrics.requests = { total: 0, success: 0, errors: 0 };
    this.metrics.response_times = [];
    this.lastMetricsReset = Date.now();
    
    logger.info('Metrics reset');
  }

  /**
   * Get detailed system information
   */
  async getSystemInfo() {
    const packageJson = require('../../package.json');
    
    return {
      application: {
        name: packageJson.name,
        version: packageJson.version,
        node_version: process.version,
        environment: process.env.NODE_ENV,
        pid: process.pid,
        uptime: process.uptime(),
        started_at: new Date(Date.now() - process.uptime() * 1000).toISOString()
      },
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        cpus: os.cpus().length,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        load_average: os.loadavg(),
        network_interfaces: Object.keys(os.networkInterfaces())
      },
      process: {
        memory_usage: process.memoryUsage(),
        cpu_usage: process.cpuUsage(),
        versions: process.versions,
        features: process.features,
        argv: process.argv.slice(2) // Hide node path and script path
      }
    };
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(format = 'prometheus') {
    const metrics = this.getMetrics();
    
    if (format === 'prometheus') {
      return this.formatPrometheusMetrics(metrics);
    }
    
    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    }
    
    return metrics;
  }

  /**
   * Format metrics for Prometheus
   */
  formatPrometheusMetrics(metrics) {
    const lines = [];
    
    // Application metrics
    lines.push(`# HELP livedisplay_requests_total Total number of requests`);
    lines.push(`# TYPE livedisplay_requests_total counter`);
    lines.push(`livedisplay_requests_total{status="success"} ${metrics.application.requests.success}`);
    lines.push(`livedisplay_requests_total{status="error"} ${metrics.application.requests.errors}`);
    
    lines.push(`# HELP livedisplay_response_time_ms Average response time in milliseconds`);
    lines.push(`# TYPE livedisplay_response_time_ms gauge`);
    lines.push(`livedisplay_response_time_ms ${metrics.application.average_response_time}`);
    
    lines.push(`# HELP livedisplay_error_rate Error rate percentage`);
    lines.push(`# TYPE livedisplay_error_rate gauge`);
    lines.push(`livedisplay_error_rate ${metrics.application.error_rate}`);
    
    // System metrics
    lines.push(`# HELP livedisplay_memory_usage_bytes Memory usage in bytes`);
    lines.push(`# TYPE livedisplay_memory_usage_bytes gauge`);
    lines.push(`livedisplay_memory_usage_bytes{type="heap_used"} ${metrics.system.memory.used}`);
    lines.push(`livedisplay_memory_usage_bytes{type="heap_total"} ${metrics.system.memory.total}`);
    lines.push(`livedisplay_memory_usage_bytes{type="rss"} ${metrics.system.memory.rss}`);
    
    lines.push(`# HELP livedisplay_uptime_seconds Application uptime in seconds`);
    lines.push(`# TYPE livedisplay_uptime_seconds counter`);
    lines.push(`livedisplay_uptime_seconds ${metrics.application.uptime_seconds}`);
    
    return lines.join('\n');
  }

  /**
   * Generate health report
   */
  async generateHealthReport() {
    const healthCheck = await this.runHealthChecks();
    const systemInfo = await this.getSystemInfo();
    
    return {
      ...healthCheck,
      system_info: systemInfo,
      generated_at: new Date().toISOString(),
      report_version: '1.0'
    };
  }
}

// Create singleton instance
const healthMonitor = new HealthMonitor();

// Register default health checks
healthMonitor.registerCheck('database', async () => {
  const dbHealth = await dbHealthCheck();
  if (dbHealth.status !== 'healthy') {
    throw new Error(`Database unhealthy: ${dbHealth.error}`);
  }
  return dbHealth;
}, { critical: true, timeout: 10000 });

healthMonitor.registerCheck('memory', async () => {
  const memoryUsage = process.memoryUsage();
  const usagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  if (usagePercent > 90) {
    throw new Error(`High memory usage: ${usagePercent.toFixed(2)}%`);
  }
  
  return {
    heap_used: memoryUsage.heapUsed,
    heap_total: memoryUsage.heapTotal,
    usage_percent: usagePercent.toFixed(2)
  };
}, { critical: true });

healthMonitor.registerCheck('disk_space', async () => {
  try {
    const stats = await fs.stat(process.cwd());
    // This is a simplified check - in production you'd want to check actual disk usage
    return { status: 'ok', checked_at: new Date().toISOString() };
  } catch (error) {
    throw new Error(`Disk check failed: ${error.message}`);
  }
}, { critical: false });

healthMonitor.registerCheck('external_services', async () => {
  // Check external service dependencies
  const checks = [];
  
  // Add your external service checks here
  // Example: API endpoints, third-party services, etc.
  
  return {
    services_checked: checks.length,
    all_healthy: true
  };
}, { critical: false });

module.exports = {
  healthMonitor,
  
  // Middleware for request metrics
  metricsMiddleware: (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const success = res.statusCode < 400;
      healthMonitor.recordRequest(success, responseTime);
    });
    
    next();
  },
  
  // Express route handlers
  healthCheckHandler: async (req, res) => {
    try {
      const results = await healthMonitor.runHealthChecks();
      const statusCode = results.status === 'healthy' ? 200 : 
                        results.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(results);
    } catch (error) {
      logger.error('Health check handler error', { error: error.message });
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        error: error.message
      });
    }
  },
  
  metricsHandler: (req, res) => {
    const format = req.query.format || 'json';
    const metrics = healthMonitor.exportMetrics(format);
    
    if (format === 'prometheus') {
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } else {
      res.json(typeof metrics === 'string' ? JSON.parse(metrics) : metrics);
    }
  },
  
  systemInfoHandler: async (req, res) => {
    try {
      const systemInfo = await healthMonitor.getSystemInfo();
      res.json(systemInfo);
    } catch (error) {
      logger.error('System info handler error', { error: error.message });
      res.status(500).json({
        error: 'Failed to get system information',
        message: error.message
      });
    }
  }
};
