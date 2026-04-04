import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Comprehensive Security Headers Middleware
 * Production-ready security configuration
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS protection (browser built-in)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Force HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Vite dev requires these
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: ws: wss:", // Allow API and WebSocket
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (replaces Feature-Policy)
  const permissions = [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(', ');
  res.setHeader('Permissions-Policy', permissions);

  // Remove sensitive header
  res.removeHeader('X-Powered-By');

  next();
};

/**
 * CSRF Protection Middleware
 * Validates CSRF tokens on state-changing requests
 */
export class CSRFProtection {
  private readonly tokenKey = 'csrf-token';
  private readonly headerKey = 'x-csrf-token';

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip for GET, HEAD, OPTIONS
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Get token from header or body
      const token = req.get(this.headerKey) || req.body?.csrfToken;

      // Get session token (stored in session/cookie)
      const sessionToken = (req as any).session?.csrfToken;

      if (!token || !sessionToken || token !== sessionToken) {
        logger.warn(`CSRF token mismatch for ${req.method} ${req.path}`, {
          hasToken: !!token,
          hasSession: !!sessionToken,
          ip: req.ip,
        });
        return res.status(403).json({ error: 'CSRF validation failed' });
      }

      next();
    };
  }

  generateToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }
}

/**
 * Input Sanitization Middleware
 * Removes malicious content from request body
 */
export const inputSanitization = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (isValidKey(key)) {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }
  return obj;
}

function sanitizeString(str: string): string {
  // Remove null bytes
  str = str.replace(/\0/g, '');

  // Remove control characters
  str = str.replace(/[\x00-\x1F\x7F]/g, '');

  // Trim whitespace
  str = str.trim();

  return str;
}

function isValidKey(key: string): boolean {
  // Reject keys with dangerous patterns
  const dangerousPatterns = ['__proto__', 'constructor', 'prototype'];
  return !dangerousPatterns.includes(key);
}

/**
 * Rate Limiting Middleware
 * Limit requests per IP per time window
 */
export class RateLimiter {
  private readonly store = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  middleware(options?: { skip?: (req: Request) => boolean; keyGenerator?: (req: Request) => string }) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (options?.skip && options.skip(req)) {
        return next();
      }

      const key = options?.keyGenerator ? options.keyGenerator(req) : req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const record = this.store.get(key);

      if (!record || now > record.resetTime) {
        this.store.set(key, { count: 1, resetTime: now + this.windowMs });
        return next();
      }

      record.count++;

      if (record.count > this.maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter,
        });
      }

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', this.maxRequests - record.count);
      res.setHeader('X-RateLimit-Reset', record.resetTime);

      next();
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Request Validation Middleware
 * Validates request size, content-type, etc.
 */
export const requestValidation = (req: Request, res: Response, next: NextFunction) => {
  // Limit request body size to 10MB
  const maxSize = 10 * 1024 * 1024;

  let bodySize = 0;
  req.on('data', (chunk: any) => {
    bodySize += chunk.length;
    if (bodySize > maxSize) {
      res.status(413).json({ error: 'Payload too large' });
      req.socket.destroy();
    }
  });

  next();
};

/**
 * SQL Injection Prevention
 * (Already handled by Prisma ORM, but add logging)
 */
export const sqlInjectionDetection = (req: Request, _res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /(\bunion\b.*\bselect\b)/gi,
    /(\bor\b.*=.*)/i,
    /(-{2}|\/\*|\*\/)/,
    /(;\s*drop\b)/gi,
    /(;\s*delete\b)/gi,
    /(;\s*update\b)/gi,
  ];

  const body = JSON.stringify(req.body || {});
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(body)) {
      logger.warn('Potential SQL injection attempt detected', {
        path: req.path,
        ip: req.ip,
        pattern: pattern.source,
      });
      // Log but don't block (Prisma handles this)
      break;
    }
  }

  next();
};

/**
 * XSS Prevention Middleware
 * Checks for common XSS patterns
 */
export const xssDetection = (req: Request, _res: Response, next: NextFunction) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=/gi,
  ];

  const body = JSON.stringify(req.body || {});
  for (const pattern of xssPatterns) {
    if (pattern.test(body)) {
      logger.warn('Potential XSS attempt detected', {
        path: req.path,
        ip: req.ip,
        pattern: pattern.source,
      });
      // Log but don't block (React will escape output)
      break;
    }
  }

  next();
};

export default {
  securityHeaders,
  CSRFProtection,
  inputSanitization,
  RateLimiter,
  requestValidation,
  sqlInjectionDetection,
  xssDetection,
};
