/**
 * Security Headers Middleware
 * Sets proper HTTP headers to prevent common vulnerabilities
 */

import type { Request, Response, NextFunction } from 'express';

export function secureHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent referrer leaking
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Don't cache sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  next();
}
