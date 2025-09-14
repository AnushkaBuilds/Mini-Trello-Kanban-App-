import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';

// Simple in-memory cache for development
// In production, you'd use Redis
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 300000; // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new MemoryCache();

// Cleanup expired entries every minute
setInterval(() => cache.cleanup(), 60000);

// Generate cache key from request
export const generateCacheKey = (req: Request): string => {
  const user = (req as any).user;
  const key = `${req.method}:${req.path}:${JSON.stringify(req.query)}:${user?.id || 'anonymous'}`;
  return createHash('md5').update(key).digest('hex');
};

// Cache middleware factory
export const cacheMiddleware = (ttl?: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req);
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      console.log(`Cache hit: ${cacheKey}`);
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl);
        console.log(`Cached response: ${cacheKey}`);
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Cache invalidation utilities
export const invalidateCache = {
  // Invalidate all user-related cache
  user: (userId: string) => {
    const keys = cache.getStats().keys;
    keys.forEach(key => {
      if (key.includes(userId)) {
        cache.delete(key);
      }
    });
  },

  // Invalidate board-related cache
  board: (boardId: string) => {
    const keys = cache.getStats().keys;
    keys.forEach(key => {
      if (key.includes(boardId) || key.includes('boards')) {
        cache.delete(key);
      }
    });
  },

  // Invalidate pattern-based cache
  pattern: (pattern: string) => {
    const keys = cache.getStats().keys;
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    });
  },

  // Clear all cache
  all: () => {
    cache.clear();
  }
};

// Response compression helper
export const shouldCompress = (req: Request, res: Response): boolean => {
  // Don't compress responses with this request header
  if (req.headers['x-no-compression']) {
    return false;
  }

  // Use compression filter function
  return true;
};

// ETags for conditional requests
export const generateETag = (data: any): string => {
  return createHash('md5').update(JSON.stringify(data)).digest('hex');
};

export const conditionalRequest = (req: Request, res: Response, data: any): boolean => {
  const etag = generateETag(data);
  res.setHeader('ETag', etag);

  // Check if client has cached version
  const clientETag = req.headers['if-none-match'];
  if (clientETag === etag) {
    res.status(304).end();
    return true;
  }

  return false;
};
