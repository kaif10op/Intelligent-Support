import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

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

  } catch (error: any) {
    logger.error('Admin Stats Error', { error: error.message, stack: error.stack });
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

/**
 * Get comprehensive analytics for admin dashboard
 * GET /api/admin/analytics
 */
export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all conversations in last 30 days
    const conversations = await prisma.message.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, role: true }
    });

    // Group conversations by date
    const conversationsByDate = conversations.reduce((acc: Record<string, number>, msg) => {
      const date = msg.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Get ticket statistics
    const tickets = await prisma.ticket.findMany();
    const ticketStats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'OPEN').length,
      inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter(t => t.status === 'RESOLVED').length,
      closed: tickets.filter(t => t.status === 'CLOSED').length,
      overdue: tickets.filter(t => t.isOverdue).length
    };

    // Get message statistics (AI vs Human)
    const messages = await prisma.message.findMany();
    const aiMessages = messages.filter(m => m.role === 'ai').length;
    const userMessages = messages.filter(m => m.role === 'user').length;
    const totalMessages = aiMessages + userMessages;

    // Calculate average confidence
    const confidenceScores = messages
      .filter(m => m.confidence !== null)
      .map(m => m.confidence || 0);
    const avgConfidence = confidenceScores.length > 0
      ? (confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length).toFixed(2)
      : 'N/A';

    // Get ticket priority distribution
    const priorityDistribution = {
      LOW: tickets.filter(t => t.priority === 'LOW').length,
      MEDIUM: tickets.filter(t => t.priority === 'MEDIUM').length,
      HIGH: tickets.filter(t => t.priority === 'HIGH').length,
      URGENT: tickets.filter(t => t.priority === 'URGENT').length
    };

    // Get SLA response stats
    const overdueDays = tickets
      .filter(t => t.dueAt && t.isOverdue)
      .map(t => {
        const ticketNow = new Date();
        const due = new Date(t.dueAt!);
        return Math.floor((ticketNow.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
      });
    const avgOverdueDays = overdueDays.length > 0
      ? (overdueDays.reduce((a, b) => a + b, 0) / overdueDays.length).toFixed(1)
      : 0;

    // Get user feedback stats
    const feedback = messages.filter(m => m.rating !== null);
    const feedbackStats = {
      positive: feedback.filter(m => m.rating === 1).length,
      negative: feedback.filter(m => m.rating === -1).length,
      total: feedback.length,
      positivePercentage: feedback.length > 0
        ? ((feedback.filter(m => m.rating === 1).length / feedback.length) * 100).toFixed(1)
        : 0
    };

    res.json({
      conversationsByDate,
      ticketStats,
      messageStats: {
        aiMessages,
        userMessages,
        total: totalMessages,
        aiPercentage: totalMessages > 0 ? ((aiMessages / totalMessages) * 100).toFixed(1) : 0
      },
      avgConfidence,
      priorityDistribution,
      overdueStats: {
        count: ticketStats.overdue,
        avgDaysOverdue: avgOverdueDays
      },
      feedbackStats
    });
  } catch (error: any) {
    logger.error('Analytics error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

/**
 * Change user role (promote/demote)
 * PUT /api/admin/users/:id/role
 */
export const changeUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'SUPPORT_AGENT', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be USER, SUPPORT_AGENT, or ADMIN' });
    }

    // Prevent removing all admins
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (role !== 'ADMIN' && id === req.user!.id && adminCount === 1) {
      return res.status(400).json({ error: 'Cannot remove the last admin' });
    }

    const user = await prisma.user.update({
      where: { id: id as string },
      data: { role }
    });

    res.json({ success: true, user });
  } catch (error: any) {
    logger.error('Change user role error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to change user role' });
  }
};
