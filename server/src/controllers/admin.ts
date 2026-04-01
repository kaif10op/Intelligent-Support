import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';

export const requireAdmin = (req: AuthRequest, res: Response, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const [userCount, kbCount, docCount, chatCount, messageCount] = await Promise.all([
      prisma.user.count(),
      prisma.knowledgeBase.count(),
      prisma.document.count(),
      prisma.chat.count(),
      prisma.message.count(),
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const recentDocs = await prisma.document.findMany({
      take: 5,
      include: { kb: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      stats: { userCount, kbCount, docCount, chatCount, messageCount },
      recentUsers,
      recentDocs,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { knowledgeBases: true, chats: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: id as string },
      include: {
        knowledgeBases: {
          include: {
            documents: true,
          },
        },
        chats: {
          include: {
            messages: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};
