import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req: Request, res: Response) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '-';
});

// Custom token for user ID
morgan.token('user-id', (req: any) => {
  return req.user?.id || 'anonymous';
});

// Custom token for request ID (we'll add this later)
morgan.token('request-id', (req: any) => {
  return req.requestId || '-';
});

// Create a custom format for detailed logging
const detailedFormat = ':request-id :remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms';

// Create a simple format for production
const simpleFormat = ':method :url :status :response-time-ms - :user-id';

// Development format with colors
const devFormat = ':method :url :status :response-time ms - :res[content-length]';

// Request ID middleware
export const requestIdMiddleware = (req: any, res: Response, next: NextFunction) => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Response time middleware
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only set header if response hasn't been sent yet
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', duration);
    }
  });
  
  next();
};

// Custom error logging middleware
export const errorLoggingMiddleware = (err: Error, req: any, res: Response, next: NextFunction) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  };

  console.error('Error occurred:', JSON.stringify(errorLog, null, 2));
  next(err);
};

// Create the appropriate morgan middleware based on environment
export const createLogger = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return morgan(simpleFormat, {
        skip: (req, res) => res.statusCode < 400, // Only log errors in production
        stream: process.stdout
      });
    case 'test':
      return morgan('silent'); // No logging in tests
    default:
      return morgan(devFormat, {
        stream: process.stdout
      });
  }
};

// API request/response logging middleware for detailed debugging
export const apiLogger = (req: any, res: Response, next: NextFunction) => {
  if (process.env.LOG_LEVEL === 'debug') {
    const requestLog = {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.method !== 'GET' ? req.body : undefined,
      userId: req.user?.id
    };

    console.log('API Request:', JSON.stringify(requestLog, null, 2));

    // Capture response data
    const originalSend = res.send;
    res.send = function(data) {
      const responseLog = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        statusCode: res.statusCode,
        responseTime: res.getHeader('X-Response-Time'),
        responseBody: process.env.LOG_RESPONSE_BODY === 'true' ? data : '[HIDDEN]'
      };

      console.log('API Response:', JSON.stringify(responseLog, null, 2));
      return originalSend.call(this, data);
    };
  }

  next();
};
