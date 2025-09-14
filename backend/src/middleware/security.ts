import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import { getConfig } from '../config/env';

// Enhanced rate limiting for different endpoints
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Store in memory for development, use Redis for production
    // store: config.NODE_ENV === 'production' ? redisStore : undefined,
  });
};

// Strict rate limiting for auth endpoints
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts, please try again in 15 minutes.'
);

// General API rate limiting
export const apiRateLimit = () => {
  const config = getConfig();
  return createRateLimit(
    config.RATE_LIMIT_WINDOW_MS,
    config.RATE_LIMIT_MAX_REQUESTS
  );
};

// Speed limiting to slow down repeated requests
export const speedLimiter: ReturnType<typeof slowDown> = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 20, // Allow 20 requests per window at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize against NoSQL injection
  mongoSanitize();
  
  // Sanitize request body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key] as string);
      }
    }
  }
  
  next();
};

// CSRF protection for state-changing operations
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig();
  
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // For development, we'll use a simple CSRF token in headers
  const token = req.headers['x-csrf-token'] as string;
  const origin = req.headers.origin || req.headers.referer;
  
  // Verify origin matches expected frontend URL
  if (!origin || !origin.startsWith(config.FRONTEND_URL)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid origin',
      code: 'INVALID_ORIGIN'
    });
  }
  
  // For development, we'll skip token validation
  // In production, implement proper CSRF token validation
  if (config.NODE_ENV === 'production' && !token) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token required',
      code: 'MISSING_CSRF_TOKEN'
    });
  }
  
  next();
};

// Secure headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS header for HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Allow inline scripts for development
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'"
  ];
  
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  
  next();
};

// Request size limiting
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength) > parseSize(maxSize)) {
      return res.status(413).json({
        success: false,
        error: 'Request entity too large',
        maxSize
      });
    }
    next();
  };
};

// Parse size string to bytes
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return value * units[unit];
}

// IP whitelist/blacklist middleware
export const ipFilter = (whitelist: string[] = [], blacklist: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    // Check blacklist first
    if (blacklist.length > 0 && blacklist.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'IP_BLACKLISTED'
      });
    }
    
    // Check whitelist
    if (whitelist.length > 0 && !whitelist.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'IP_NOT_WHITELISTED'
      });
    }
    
    next();
  };
};

// API key validation middleware
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!apiKey || !validApiKeys.includes(apiKey as string)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key',
      code: 'INVALID_API_KEY'
    });
  }
  
  next();
};

// File upload security
export const fileUploadSecurity = {
  // Allowed file types
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // Max file size (5MB)
  maxSize: 5 * 1024 * 1024,
  
  // Validate file
  validateFile: (file: any) => {
    if (!file) return { valid: false, error: 'No file provided' };
    
    if (!fileUploadSecurity.allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid file type' };
    }
    
    if (file.size > fileUploadSecurity.maxSize) {
      return { valid: false, error: 'File too large' };
    }
    
    // Check for malicious file content (basic check)
    if (file.originalname.includes('..') || file.originalname.includes('/')) {
      return { valid: false, error: 'Invalid filename' };
    }
    
    return { valid: true };
  }
};
