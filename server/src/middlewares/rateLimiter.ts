/**
 * Rate Limiting Middleware
 * Protects API from abuse
 */

import type { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use X-Forwarded-For if behind proxy, otherwise use remote address
    return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/ping';
  },
  handler: (req: Request, res: any) => {
    res.status(429).json({
      error: 'Too many requests',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      statusCode: 429,
    });
  },
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.AUTH_MAX_REQUESTS,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req: Request) => {
    return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: any) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      statusCode: 429,
    });
  },
});

// Looser limiter for chat endpoints
export const chatLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.CHAT_MAX_REQUESTS,
  message: 'Slow down! You are sending too many chat messages.',
  keyGenerator: (req: Request) => {
    return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  },
  skip: (req: Request) => {
    // Skip for non-POST/GET requests
    return !['POST', 'GET'].includes(req.method);
  },
  handler: (req: Request, res: any) => {
    res.status(429).json({
      error: 'Too many chat requests',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      statusCode: 429,
    });
  },
});
