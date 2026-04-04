import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// SECURITY: Require JWT_SECRET in environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required for security. Set it in .env file.');
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthRequest extends Request {
  cookies: Record<string, string>;
  user?: { id: string; role: string; email: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
};

