import type { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';
import path from 'path';

// Force load env for auth specifically in case parent process failed
dotenv.config({ path: path.join(process.cwd(), '.env') });

let oauthClient: OAuth2Client | null = null;
const getOAuthClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    logger.debug('GOOGLE_CLIENT_ID from env', { exists: clientId ? 'EXISTS' : 'MISSING' });
    if (!oauthClient) {
        if (!clientId) throw new Error('GOOGLE_CLIENT_ID is missing from environment');
        oauthClient = new OAuth2Client(clientId);
    }
    return oauthClient;
};

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

const setSessionCookie = (res: Response, user: { id: string; role: string; email: string }) => {
  const sessionToken = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token missing' });

    const client = getOAuthClient();
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });
    
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ error: 'Invalid Google token' });

    const { email, name, sub: googleId, picture } = payload;

    // Determine admin based on exact match perhaps? Just mark first user as Admin
    const userCount = await prisma.user.count();
    let role: 'USER' | 'ADMIN' = userCount === 0 ? 'ADMIN' : 'USER';
    
    // Find or create
    let user = await prisma.user.findUnique({ where: { googleId } });
    if (!user) {
      user = await prisma.user.create({
        data: { googleId, email, name: name || 'User', picture: picture ?? null, role },
      });
    }

    setSessionCookie(res, user);

    res.json({ user });
  } catch (err: any) {
    logger.error('Google verification failed', {
        error: err.message,
        stack: err.stack
    });
    res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
};

export const clerkAuth = async (req: Request, res: Response) => {
  try {
    const { clerkId, email, name, picture } = req.body as {
      clerkId?: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!clerkId || !email) {
      return res.status(400).json({ error: 'clerkId and email are required' });
    }

    const userCount = await prisma.user.count();
    const firstUserRole: 'USER' | 'ADMIN' = userCount === 0 ? 'ADMIN' : 'USER';

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: `clerk_${clerkId}`,
          email,
          name: name || 'User',
          picture: picture ?? null,
          role: firstUserRole,
        },
      });
    }

    setSessionCookie(res, user);
    res.json({ user });
  } catch (err: any) {
    logger.error('Clerk authentication failed', {
      error: err.message,
      stack: err.stack,
    });
    res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // Try to get token from multiple sources
    let token = req.cookies.token;

    // If no token in cookies, try Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // If still no token, try x-token header
    if (!token && req.headers['x-token']) {
      token = req.headers['x-token'] as string;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Not authenticated',
        tip: 'Send JWT token in cookie (token), Authorization header (Bearer), or x-token header'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    res.json({ user });
  } catch (e) {
    res.status(401).json({
      error: 'Invalid session',
      details: (e as any).message
    });
  }
};
