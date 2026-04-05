import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// SECURITY: Require JWT_SECRET in environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required for security. Set it in .env file.');
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthRequest extends Request {
  cookies: Record<string, string>;
  user?: { id: string; role: string; email: string; name?: string };
}

const normalizeRole = (role?: string) => (role || '').toUpperCase();
const isAdminRole = (role?: string) => ['ADMIN', 'SUPER_ADMIN'].includes(normalizeRole(role));
const isSupportStaffRole = (role?: string) =>
  isAdminRole(role) || ['SUPPORT_AGENT', 'SUPPORT', 'AGENT'].includes(normalizeRole(role));

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Try to get token from multiple sources (in order of priority)
  let token = req.cookies.token;

  // If no token in cookies, try Authorization header (Bearer token)
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    }
  }

  // If still no token, try x-token header (alternative header)
  if (!token && req.headers['x-token']) {
    token = req.headers['x-token'] as string;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Not authorized, no token',
      tip: 'Send token in: cookie (token), Authorization header (Bearer), or x-token header'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      error: 'Not authorized, token failed',
      details: (err as any).message
    });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // First verify auth
  let token = req.cookies.token;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token && req.headers['x-token']) {
    token = Array.isArray(req.headers['x-token'])
      ? req.headers['x-token'][0]
      : (req.headers['x-token'] as string);
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (isAdminRole(decoded.role)) {
      req.user = decoded;
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
  } catch (err) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

export const requireSupportAgent = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Allow ADMIN and SUPPORT_AGENT
  let token = req.cookies.token;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token && req.headers['x-token']) {
    token = Array.isArray(req.headers['x-token'])
      ? req.headers['x-token'][0]
      : (req.headers['x-token'] as string);
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (isSupportStaffRole(decoded.role)) {
      req.user = decoded;
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Support Agent or Admin access required' });
    }
  } catch (err) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};
