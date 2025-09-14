import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  timestamp: number;
  method: string;
  path: string;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  statusCode: number;
  responseSize: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getStats(): {
    totalRequests: number;
    averageResponseTime: number;
    slowestRequests: PerformanceMetrics[];
    errorRate: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    const totalRequests = this.metrics.length;
    const averageResponseTime = totalRequests > 0 
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
      : 0;
    
    const slowestRequests = this.metrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    const errorRequests = this.metrics.filter(m => m.statusCode >= 400);
    const errorRate = totalRequests > 0 ? (errorRequests.length / totalRequests) * 100 : 0;

    return {
      totalRequests,
      averageResponseTime,
      slowestRequests,
      errorRate,
      memoryUsage: process.memoryUsage()
    };
  }

  getHealthMetrics(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      avgResponseTime: number;
      errorRate: number;
      memoryUsage: number;
      uptime: number;
    };
    issues: string[];
  } {
    const stats = this.getStats();
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check response time
    if (stats.averageResponseTime > 2000) {
      issues.push('High average response time');
      status = 'critical';
    } else if (stats.averageResponseTime > 1000) {
      issues.push('Elevated response time');
      status = 'warning';
    }

    // Check error rate
    if (stats.errorRate > 10) {
      issues.push('High error rate');
      status = 'critical';
    } else if (stats.errorRate > 5) {
      issues.push('Elevated error rate');
      status = 'warning';
    }

    // Check memory usage (>80% of 512MB = critical)
    const memoryUsagePercent = (stats.memoryUsage.heapUsed / (512 * 1024 * 1024)) * 100;
    if (memoryUsagePercent > 80) {
      issues.push('High memory usage');
      status = 'critical';
    } else if (memoryUsagePercent > 60) {
      issues.push('Elevated memory usage');
      status = 'warning';
    }

    return {
      status,
      metrics: {
        avgResponseTime: Math.round(stats.averageResponseTime),
        errorRate: Math.round(stats.errorRate * 100) / 100,
        memoryUsage: Math.round(memoryUsagePercent * 100) / 100,
        uptime: Math.round(process.uptime())
      },
      issues
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Performance monitoring middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage();

  // Capture response size
  let responseSize = 0;
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function(data) {
    responseSize = Buffer.byteLength(data || '', 'utf8');
    
    // Set performance headers before sending
    const endTime = performance.now();
    const duration = endTime - startTime;
    const memoryUsage = process.memoryUsage();
    
    try {
      this.setHeader('X-Response-Time', `${Math.round(duration)}ms`);
      this.setHeader('X-Memory-Usage', `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
    } catch (error) {
      // Headers already sent, ignore
    }
    
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    responseSize = Buffer.byteLength(JSON.stringify(data || {}), 'utf8');
    
    // Set performance headers before sending
    const endTime = performance.now();
    const duration = endTime - startTime;
    const memoryUsage = process.memoryUsage();
    
    try {
      this.setHeader('X-Response-Time', `${Math.round(duration)}ms`);
      this.setHeader('X-Memory-Usage', `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
    } catch (error) {
      // Headers already sent, ignore
    }
    
    return originalJson.call(this, data);
  };

  // When response finishes
  res.on('finish', () => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      method: req.method,
      path: req.path,
      duration,
      memoryUsage: process.memoryUsage(),
      statusCode: res.statusCode,
      responseSize
    };

    performanceMonitor.addMetric(metric);

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.path} - ${Math.round(duration)}ms`);
    }
  });

  next();
};

// Resource monitoring
export const resourceMonitor = {
  getCpuUsage: (): Promise<number> => {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = performance.now();

      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const currentTime = performance.now();
        const timeDiff = currentTime - startTime;

        // Calculate CPU percentage
        const cpuPercent = ((currentUsage.user + currentUsage.system) / 1000) / timeDiff * 100;
        resolve(Math.round(cpuPercent * 100) / 100);
      }, 100);
    });
  },

  getMemoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
    };
  },

  getSystemHealth: async () => {
    const cpuUsage = await resourceMonitor.getCpuUsage();
    const memoryUsage = resourceMonitor.getMemoryUsage();
    const uptime = process.uptime();
    const performanceHealth = performanceMonitor.getHealthMetrics();

    return {
      cpu: {
        usage: cpuUsage,
        status: cpuUsage > 80 ? 'critical' : cpuUsage > 60 ? 'warning' : 'healthy'
      },
      memory: {
        ...memoryUsage,
        status: memoryUsage.heapUsed > 400 ? 'critical' : memoryUsage.heapUsed > 300 ? 'warning' : 'healthy'
      },
      uptime: Math.round(uptime),
      performance: performanceHealth
    };
  }
};

// Performance optimization helpers
export const compressionConfig = {
  threshold: 1024, // Only compress if response is larger than 1KB
  level: 6, // Compression level (1-9, 6 is good balance)
  memLevel: 8, // Memory level (1-9)
};

export const rateLimitConfig = {
  // Dynamic rate limiting based on system health
  getDynamicLimit: async (): Promise<number> => {
    const health = await resourceMonitor.getSystemHealth();
    
    if (health.cpu.status === 'critical' || health.memory.status === 'critical') {
      return 50; // Reduce to 50 requests per window
    } else if (health.cpu.status === 'warning' || health.memory.status === 'warning') {
      return 75; // Reduce to 75 requests per window
    }
    
    return 100; // Normal rate limit
  }
};
