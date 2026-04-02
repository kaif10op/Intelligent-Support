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

    // Generate our JWT
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

    res.json({ user });
  } catch (err: any) {
    logger.error('Google verification failed', {
        error: err.message,
        stack: err.stack
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
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    res.json({ user });
  } catch (e) {
    res.status(401).json({ error: 'Invalid session' });
  }
};
