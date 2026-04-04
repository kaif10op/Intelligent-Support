/**
 * Human-in-Loop Chat Controller
 */

import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Support agent or admin sends a human message
 */
export const addHumanMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const userId = req.user!.id;
    const userName = req.user!.name || 'Support Agent';
    const userRole = req.user!.role;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (userRole !== 'SUPPORT_AGENT' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only support agents and admins can send messages' });
    }

    const chat = await prisma.chat.findUnique({ where: { id: chatId as string } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const humanMessage = await (prisma as any).message.create({
      data: {
        role: 'human',
        content: message.trim(),
        chatId: chatId as string,
        userId,
        senderName: userName,
        senderRole: userRole
      }
    });

    logger.info('Human message sent', { chatId, userId, userRole });
    res.json({ success: true, message: humanMessage });
  } catch (error: any) {
    logger.error('Add human message error', { error: error.message });
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * Support agent requests AI assistance
 */
export const generateAgentAssistance = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { context } = req.body;

    if (req.user!.role !== 'SUPPORT_AGENT' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only support agents and admins can use this' });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId as string },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 5 } }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const suggestion = `AI Suggestion: Based on the conversation, consider addressing: ${context || 'the customer concern'}`;
    logger.info('AI assistance generated', { chatId });
    res.json({ success: true, suggestion });
  } catch (error: any) {
    logger.error('Generate assistance error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate assistance' });
  }
};

/**
 * Transfer chat to another support agent
 */
export const transferChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, targetAgentId } = req.params;
    const { reason } = req.body;

    if (req.user!.role !== 'SUPPORT_AGENT' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const [chat, targetAgent] = await Promise.all([
      prisma.chat.findUnique({ where: { id: chatId as string } }),
      prisma.user.findUnique({ where: { id: targetAgentId as string } })
    ]);

    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!targetAgent) return res.status(404).json({ error: 'Agent not found' });

    const agentName = targetAgent.name || targetAgent.email;

    await (prisma as any).message.create({
      data: {
        chatId: chatId as string,
        role: 'system',
        content: `Transferred to ${agentName}. Reason: ${reason || 'N/A'}`,
        senderName: 'System'
      }
    });

    const updated = await (prisma as any).chat.update({
      where: { id: chatId as string },
      data: { assignedAgentId: targetAgentId as string }
    });

    logger.info('Chat transferred', { chatId, toAgent: targetAgentId });
    res.json({ success: true, chat: updated });
  } catch (error: any) {
    logger.error('Transfer error', { error: error.message });
    res.status(500).json({ error: 'Failed to transfer' });
  }
};

/**
 * Get chat transcript
 */
export const getChatTranscript = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId as string },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const canAccess = chat.userId === req.user!.id || req.user!.role === 'SUPPORT_AGENT' || req.user!.role === 'ADMIN';
    if (!canAccess) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      chatId,
      createdAt: chat.createdAt,
      messageCount: chat.messages.length,
      messages: chat.messages.map((m: any) => ({
        timestamp: m.createdAt,
        sender: m.senderName || (m.role === 'assistant' ? 'AI' : 'Customer'),
        role: m.role,
        message: m.content
      }))
    });
  } catch (error: any) {
    logger.error('Transcript error', { error: error.message });
    res.status(500).json({ error: 'Failed to get transcript' });
  }
};

/**
 * Close chat
 */
export const closeChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { summary, satisfaction } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    const chat = await prisma.chat.findUnique({ where: { id: chatId as string } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const closedByName = req.user!.name || 'Support Agent';

    await (prisma as any).message.create({
      data: {
        chatId: chatId as string,
        role: 'system',
        content: `Closed by ${closedByName}${summary ? '. ' + summary : ''}`,
        senderName: 'System'
      }
    });

    const closed = await (prisma as any).chat.update({
      where: { id: chatId as string },
      data: {
        isClosed: true,
        closedAt: new Date(),
        closedBy: req.user!.id,
        metadata: { summary, satisfaction }
      }
    });

    logger.info('Chat closed', { chatId });
    res.json({ success: true, chat: closed });
  } catch (error: any) {
    logger.error('Close error', { error: error.message });
    res.status(500).json({ error: 'Failed to close chat' });
  }
};
