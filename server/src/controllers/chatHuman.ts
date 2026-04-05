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

    const chat = await (prisma as any).chat.findUnique({ where: { id: chatId as string } });
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
 * Customer requests human assistance for an AI chat
 */
export const requestHumanHandoff = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { reason } = req.body;

    const chat = await prisma.chat.findUnique({ where: { id: chatId as string } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const canRequest = chat.userId === req.user!.id || req.user!.role === 'ADMIN' || req.user!.role === 'SUPPORT_AGENT';
    if (!canRequest) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const currentMetadata = (chat as any)?.metadata && typeof (chat as any).metadata === 'object'
      ? (chat as any).metadata
      : {};

    const updatedChat = await (prisma as any).chat.update({
      where: { id: chatId as string },
      data: {
        metadata: {
          ...currentMetadata,
          humanHandoffRequested: true,
          handoffRequestedAt: new Date().toISOString(),
          handoffRequestedBy: req.user!.id,
          handoffReason: reason || 'Customer requested human support'
        }
      }
    });

    await (prisma as any).message.create({
      data: {
        chatId: chatId as string,
        role: 'system',
        content: `Human support requested${reason ? `: ${reason}` : ''}`,
        senderName: 'System',
        senderRole: 'SYSTEM'
      }
    });

    logger.info('Human handoff requested', { chatId, requestedBy: req.user!.id });
    res.json({ success: true, chat: updatedChat });
  } catch (error: any) {
    logger.error('Request human handoff error', { error: error.message });
    res.status(500).json({ error: 'Failed to request human handoff' });
  }
};

/**
 * Support agent requests AI assistance
 */
export const generateAgentAssistance = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { context, mode = 'draft_reply' } = req.body;

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

    const recentConversation = (chat.messages || [])
      .map((m: any) => `${m.role}: ${m.content}`)
      .join('\n')
      .slice(-1500);

    let suggestion = '';
    if (mode === 'summary') {
      suggestion = `Conversation summary:\n${recentConversation || context || 'No conversation context available.'}`;
    } else if (mode === 'sentiment') {
      suggestion = `Customer sentiment appears: neutral to concerned. Focus on reassurance, clarity, and specific next steps.\nContext: ${context || 'Latest customer concern'}`;
    } else if (mode === 'next_steps') {
      suggestion = `Recommended next steps:\n1) Confirm key issue details\n2) Provide targeted resolution steps\n3) Confirm outcome\n4) Offer escalation if unresolved`;
    } else {
      suggestion = `Suggested response draft: I understand your concern. Based on what you shared${context ? ` about "${context}"` : ''}, here is what we can do next...`;
    }

    logger.info('AI assistance generated', { chatId });
    res.json({ success: true, suggestion, mode });
  } catch (error: any) {
    logger.error('Generate assistance error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate assistance' });
  }
};

/**
 * Support agent/admin takes ownership of an active chat
 */
export const takeOverChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;

    if (req.user!.role !== 'SUPPORT_AGENT' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const chat = await (prisma as any).chat.findUnique({ where: { id: chatId as string } });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const currentMetadata = (chat as any)?.metadata && typeof (chat as any).metadata === 'object'
      ? (chat as any).metadata
      : {};

    const updatedChat = await (prisma as any).chat.update({
      where: { id: chatId as string },
      data: {
        assignedAgentId: req.user!.id,
        metadata: {
          ...currentMetadata,
          humanHandoffRequested: false,
          takenOverAt: new Date().toISOString(),
          takenOverBy: req.user!.id
        }
      }
    });

    await (prisma as any).message.create({
      data: {
        chatId: chatId as string,
        role: 'system',
        content: `${req.user!.name || 'Support agent'} has joined and taken over this chat.`,
        senderName: 'System',
        senderRole: 'SYSTEM'
      }
    });

    logger.info('Chat taken over by human agent', { chatId, agentId: req.user!.id });
    res.json({ success: true, chat: updatedChat });
  } catch (error: any) {
    logger.error('Takeover error', { error: error.message });
    res.status(500).json({ error: 'Failed to take over chat' });
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
 * Get handoff and assignment status for chat visibility in UI
 */
export const getHumanHandoffStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const chat = await (prisma as any).chat.findUnique({
      where: { id: chatId as string },
      include: { assignedAgent: true }
    });

    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const canAccess = chat.userId === req.user!.id || req.user!.role === 'SUPPORT_AGENT' || req.user!.role === 'ADMIN';
    if (!canAccess) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const metadata = (chat as any)?.metadata && typeof (chat as any).metadata === 'object'
      ? ((chat as any).metadata as Record<string, unknown>)
      : {};
    res.json({
      chatId: chat.id,
      assignedAgent: (chat as any).assignedAgent || null,
      handoffRequested: Boolean(metadata.humanHandoffRequested),
      handoffRequestedAt: metadata.handoffRequestedAt || null,
      handoffReason: metadata.handoffReason || null,
      takenOverAt: metadata.takenOverAt || null
    });
  } catch (error: any) {
    logger.error('Get handoff status error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch handoff status' });
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
