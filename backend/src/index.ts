import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { validateAndLoadConfig, getConfig } from './config/env';
import { setupSwagger } from './config/swagger';
import { checkDatabaseHealth, closeDatabaseConnection } from './config/database';
import { 
  apiRateLimit, 
  speedLimiter, 
  sanitizeInput, 
  securityHeaders, 
  requestSizeLimit 
} from './middleware/security';
import { 
  performanceMiddleware, 
  resourceMonitor, 
  compressionConfig 
} from './middleware/performance';
import { shouldCompress } from './middleware/cache';
import v1Routes from './routes/v1';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import { setupSocketHandlers } from './socket/socketHandlers';
import { 
  createLogger, 
  requestIdMiddleware, 
  responseTimeMiddleware, 
  apiLogger,
  errorLoggingMiddleware 
} from './middleware/logging';

// Load and validate environment configuration first
dotenv.config();
const config = validateAndLoadConfig();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = config.PORT;

// Middleware
app.use(requestIdMiddleware);
app.use(responseTimeMiddleware);
app.use(performanceMiddleware);
app.use(createLogger());

// Compression middleware
app.use(compression({
  filter: shouldCompress,
  threshold: compressionConfig.threshold,
  level: compressionConfig.level,
  memLevel: compressionConfig.memLevel
}));

// Security middleware
app.use(securityHeaders);
app.use(helmet({
  contentSecurityPolicy: false, // We handle CSP in securityHeaders
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(requestSizeLimit('10mb'));
app.use(sanitizeInput);
app.use(apiRateLimit());
app.use(speedLimiter);
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLogger);

// API versioning
app.use('/api/v1', v1Routes);

// Setup API Documentation
setupSwagger(app);

// Health check with database status
app.get('/api/health', async (req, res) => {
  try {
    const dbHealthy = await checkDatabaseHealth();
    const systemHealth = await resourceMonitor.getSystemHealth();
    
    const health = {
      status: dbHealthy && systemHealth.performance.status !== 'critical' ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: dbHealthy ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      system: systemHealth,
    };
    
    const isHealthy = dbHealthy && systemHealth.performance.status !== 'critical';
    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Performance metrics endpoint (protected)
app.get('/api/metrics', async (req, res) => {
  try {
    const systemHealth = await resourceMonitor.getSystemHealth();
    res.json({
      success: true,
      data: systemHealth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

// Error handling
app.use(errorLoggingMiddleware);
app.use(errorHandler);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`🔄 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close HTTP server
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    // Close database connections
    await closeDatabaseConnection();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API v1: http://localhost:${PORT}/api/v1`);
});

export { io };
