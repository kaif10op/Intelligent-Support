import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const [userCount, kbCount, docCount, chatCount, messageCount, ticketCount] = await Promise.all([
      prisma.user.count(),
      prisma.knowledgeBase.count(),
      prisma.document.count(),
      prisma.chat.count(),
      (prisma as any).message.count(),
      (prisma as any).ticket.count(),
    ]);

    // Analytics aggregations
    const messages = await (prisma as any).message.findMany({
      where: { role: 'ai' },
      select: { confidence: true, rating: true, createdAt: true },
      take: 100, // Last 100 for recent trends
      orderBy: { createdAt: 'desc' }
    });

    const confidenceDist = [
      { name: 'Low (<0.7)', value: messages.filter((m: any) => m.confidence && m.confidence < 0.7).length },
      { name: 'Med (0.7-0.9)', value: messages.filter((m: any) => m.confidence && m.confidence >= 0.7 && m.confidence < 0.9).length },
      { name: 'High (>0.9)', value: messages.filter((m: any) => m.confidence && m.confidence >= 0.9).length },
    ];

    const feedbackStats = [
      { name: 'Positive', value: messages.filter((m: any) => m.rating === 1).length },
      { name: 'Negative', value: messages.filter((m: any) => m.rating === -1).length },
      { name: 'No Feedback', value: messages.filter((m: any) => !m.rating).length },
    ];

    const tickets = await (prisma as any).ticket.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, name: true } }
      }
    });

    res.json({
      totalUsers: userCount,
      totalKBs: kbCount,
      totalDocs: docCount,
      totalChats: chatCount,
      totalMessages: messageCount,
      totalTickets: ticketCount,
      confidenceDist,
      feedbackStats,
      tickets,
      recentUsers: await prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    });

  } catch (error) {
    console.error('Admin Stats Error:', error);
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
