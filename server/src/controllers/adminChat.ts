import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Admin: Take over a chat session
 * POST /api/admin/chat/:chatId/takeover
 * Admin can join and respond in user's chat
 */
export const takeoverChat = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { chatId } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId as string },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 }, user: { select: { name: true, email: true } } }
    });

    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // Record admin takeover event
    const admin = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
    const systemMessage = await prisma.message.create({
      data: {
        chatId: chatId as string,
        role: 'system',
        content: `[ADMIN TAKEOVER] Admin ${admin?.name || req.user!.email} has joined this chat to assist.`
      }
    });

    res.json({
      success: true,
      chat: {
        id: chat.id,
        title: chat.title,
        user: chat.user,
        messageCount: chat.messages.length,
        takenOverBy: admin?.name || req.user!.email,
        takenOverAt: systemMessage.createdAt
      }
    });
  } catch (error: any) {
    logger.error('Chat takeover error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to takeover chat' });
  }
};

/**
 * Admin: Inject a message into a chat
 * POST /api/admin/chat/:chatId/inject-message
 */
export const injectMessageIntoChat = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { chatId } = req.params;
    const { content, asAdmin = false } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content required' });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId as string }
    });

    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const admin = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });

    // Inject message as either admin or system
    const message = await prisma.message.create({
      data: {
        chatId: chatId as string,
        role: asAdmin ? 'admin' : 'system',
        content,
        context: asAdmin
          ? `Injected by admin ${admin?.name || req.user!.email} for customer assistance`
          : `System message: Admin intervention`
      }
    });

    res.json({
      success: true,
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
        injectedBy: admin?.name || req.user!.email
      }
    });
  } catch (error: any) {
    logger.error('Inject message error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to inject message' });
  }
};

/**
 * Admin: Mark conversation for review (low confidence, dislike, etc)
 * POST /api/admin/chat/:chatId/flag-review
 */
export const flagChatForReview = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { chatId } = req.params;
    const { reason, priority = 'normal' } = req.body;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId as string }
    });

    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const admin = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });

    // Add admin note about review
    const reviewNote = await prisma.message.create({
      data: {
        chatId: chatId as string,
        role: 'system',
        content: `[FLAGGED FOR REVIEW] Reason: ${reason || 'Admin discretion'}. Priority: ${priority}`,
        context: `Flagged by admin ${admin?.name || req.user!.email}`
      }
    });

    res.json({
      success: true,
      flagged: true,
      reason,
      priority,
      flaggedAt: reviewNote.createdAt
    });
  } catch (error: any) {
    logger.error('Flag for review error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to flag chat' });
  }
};

/**
 * Admin: Get chats requiring review (low confidence, disliked, etc)
 * GET /api/admin/chats/review-queue
 */
export const getReviewQueue = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get messages with low confidence or negative ratings
    const lowConfidenceMessages = await prisma.message.findMany({
      where: {
        role: 'ai',
        confidence: { lt: 0.7 }
      },
      include: {
        chat: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const dislikedMessages = await prisma.message.findMany({
      where: {
        role: 'ai',
        rating: -1
      },
      include: {
        chat: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Deduplicate and combine
    const chatIds = new Set();
    const reviewQueue = [];

    for (const msg of [...lowConfidenceMessages, ...dislikedMessages]) {
      if (!chatIds.has(msg.chatId)) {
        chatIds.add(msg.chatId);
        reviewQueue.push({
          chatId: msg.chatId,
          reason: msg.confidence && msg.confidence < 0.7 ? 'Low AI Confidence' : 'User Dislike',
          confidence: msg.confidence,
          userRating: msg.rating,
          message: msg.content.substring(0, 100),
          chat: msg.chat,
          flaggedAt: msg.createdAt
        });
      }
    }

    res.json({
      total: reviewQueue.length,
      queue: reviewQueue
    });
  } catch (error: any) {
    logger.error('Review queue error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch review queue' });
  }
};
