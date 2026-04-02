import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { ChatGroq } from '@langchain/groq';
import { generateEmbeddings } from '../utils/jina.js';
import { logger } from '../utils/logger.js';

/**
 * Search across all chats and knowledge bases
 * GET /api/search?q=query&type=all|chat|kb|ticket
 */
export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    const searchLimit = Math.min(Number(limit) || 20, 100);
    const results: any = { chats: [], kbs: [], tickets: [], documents: [] };

    // Search chats
    if (type === 'all' || type === 'chat') {
      const chats = await prisma.chat.findMany({
        where: {
          userId: req.user!.id,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { messages: { some: { content: { contains: q, mode: 'insensitive' } } } }
          ]
        },
        include: { kb: { select: { title: true } }, messages: { take: 1, orderBy: { createdAt: 'desc' } } },
        take: searchLimit
      });
      results.chats = chats;
    }

    // Search knowledge bases
    if (type === 'all' || type === 'kb') {
      const kbs = await prisma.knowledgeBase.findMany({
        where: {
          userId: req.user!.id,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        },
        include: { documents: { take: 3 }, _count: { select: { documents: true } } },
        take: searchLimit
      });
      results.kbs = kbs;
    }

    // Search tickets
    if (type === 'all' || type === 'ticket') {
      const tickets = await prisma.ticket.findMany({
        where: {
          userId: req.user!.id,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { notes: { some: { content: { contains: q, mode: 'insensitive' } } } }
          ]
        },
        include: { assignedTo: { select: { name: true } } },
        take: searchLimit
      });
      results.tickets = tickets;
    }

    // Search documents (via chunks)
    if (type === 'all' || type === 'kb') {
      const documents = await prisma.document.findMany({
        where: {
          kb: { userId: req.user!.id },
          filename: { contains: q, mode: 'insensitive' }
        },
        include: { kb: { select: { title: true } } },
        take: searchLimit / 2
      });
      results.documents = documents;
    }

    res.json({
      query: q,
      totalResults: results.chats.length + results.kbs.length + results.tickets.length + results.documents.length,
      results
    });
  } catch (error: any) {
    logger.error('Search error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Search failed' });
  }
};

/**
 * Summarize a chat conversation
 * POST /api/chat/:id/summarize
 */
export const summarizeChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const chat = await prisma.chat.findFirst({
      where: { id: id as string, userId: req.user!.id },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } }
    });

    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // Build conversation text
    const conversationText = chat.messages
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n\n');

    if (!conversationText) {
      return res.json({ summary: 'No messages to summarize' });
    }

    try {
      const llm = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY!,
        model: 'llama-3.1-8b-instant',
        temperature: 0.5,
      });

      const prompt = `Summarize this customer support conversation in 2-3 sentences. Focus on:
1. The customer's main issue or question
2. The AI's primary response
3. Resolution status

Conversation:
${conversationText}

Summary:`;

      const response = await llm.invoke(prompt);
      const summary = response.content?.toString() || '';

      res.json({ summary, messageCount: chat.messages.length });
    } catch (llmError: any) {
      logger.error('LLM summarization error', { error: llmError.message, stack: llmError.stack });
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  } catch (error: any) {
    logger.error('Summarize error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Summarization failed' });
  }
};

/**
 * Auto-categorize a conversation (tag it)
 * POST /api/chat/:id/auto-tag
 */
export const autoTagConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const chat = await prisma.chat.findFirst({
      where: { id: id as string, userId: req.user!.id },
      include: { messages: { take: 10 } }
    });

    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // Build context
    const messages = chat.messages.slice(0, 5).map(m => m.content).join(' ');
    const context = `${chat.title || ''} ${messages}`.substring(0, 500);

    try {
      const llm = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY!,
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
      });

      const prompt = `Categorize this customer support conversation into ONE primary category and UP TO 2 secondary categories.

Available categories:
- Billing & Pricing
- Technical Support
- Account & Access
- Product Features
- Documentation
- General Inquiry
- Bug Report
- Feature Request
- Performance
- Integration

Context:
${context}

Respond in this JSON format ONLY (no markdown):
{"primary": "category", "secondary": ["category1", "category2"]}`;

      const response = await llm.invoke(prompt);
      let tags = { primary: 'General Inquiry', secondary: [] };

      try {
        const jsonStr = response.content?.toString() || '{}';
        tags = JSON.parse(jsonStr);
      } catch (e) {
        logger.warn('Failed to parse tags JSON, using defaults');
      }

      res.json({ tags, context });
    } catch (llmError: any) {
      logger.error('LLM tagging error', { error: llmError.message, stack: llmError.stack });
      res.json({ tags: { primary: 'General Inquiry', secondary: [] }, context });
    }
  } catch (error: any) {
    logger.error('Auto-tag error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Auto-tagging failed' });
  }
};
