import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { ChatGroq } from '@langchain/groq';
import { formatPaginatedResponse, parsePaginationParams, calculateSkipTake } from '../utils/pagination.js';

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority, chatId } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and description are required' });

    // Calculate SLA due date based on priority
    const now = new Date();
    const slaDays: Record<string, number> = { LOW: 7, MEDIUM: 3, HIGH: 1, URGENT: 0.25 }; // 0.25 = 6 hours
    const slaDuration = (slaDays[priority || 'MEDIUM'] || 3) * 24 * 60 * 60 * 1000;
    const dueAt = new Date(now.getTime() + slaDuration);

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        userId: req.user!.id,
        chatId: chatId || null,
        dueAt,
        isOverdue: false
      }
    });

    res.json(ticket);
  } catch (error) {
    console.error('Create Ticket Error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

export const getMyTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePaginationParams(req.query);
    const { skip, take } = calculateSkipTake(page, limit);

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        include: { assignedTo: { select: { name: true, email: true } } },
        skip,
        take
      }),
      prisma.ticket.count({ where: { userId: req.user!.id } })
    ]);

    res.json(formatPaginatedResponse(tickets, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your tickets' });
  }
};

export const getAllTickets = async (req: AuthRequest, res: Response) => {
  try {
    // Only admins should call this (handled by middleware)
    const { page, limit } = parsePaginationParams(req.query);
    const { skip, take } = calculateSkipTake(page, limit);

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          assignedTo: { select: { name: true, email: true } }
        },
        skip,
        take
      }),
      prisma.ticket.count()
    ]);

    res.json(formatPaginatedResponse(tickets, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all tickets' });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedToId } = req.body;

    // Check if ticket is overdue
    const ticket = await prisma.ticket.findUnique({ where: { id: id as string } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const now = new Date();
    const isOverdue = ticket.dueAt && new Date(ticket.dueAt) < now && ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED';

    const updatedTicket = await prisma.ticket.update({
      where: { id: id as string },
      data: {
        status,
        priority,
        assignedToId,
        isOverdue: isOverdue || false
      }
    });

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};

export const addTicketNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: 'Note content is required' });

    // Check ticket ownership or admin status
    const ticket = await prisma.ticket.findUnique({ where: { id: id as string } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const isOwner = ticket.userId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to add message' });
    }

    // Determine role (user or admin)
    const role = isAdmin ? 'admin' : 'user';

    const note = await prisma.ticketNote.create({
      data: {
        content,
        role,
        ticketId: id as string,
        ...(isAdmin && { adminId: req.user!.id }),
        ...(!isAdmin && { userId: req.user!.id })
      }
    });

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add message' });
  }
};

/**
 * Get all messages for a ticket (bidirectional - admin and user messages)
 * GET /api/tickets/:id/messages
 */
export const getTicketMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify user has access to this ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: id as string }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const isOwner = ticket.userId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get all messages (notes) for this ticket
    const messages = await prisma.ticketNote.findMany({
      where: { ticketId: id as string },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

/**
 * Delete a ticket message (user can delete own, admin can delete any)
 * DELETE /api/tickets/:id/messages/:noteId
 */
export const deleteTicketMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id, noteId } = req.params;

    // Get the message
    const message = await prisma.ticketNote.findUnique({
      where: { id: noteId as string }
    });

    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Check authorization
    const isMessageOwner = message.userId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isMessageOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    // Delete the message
    await prisma.ticketNote.delete({ where: { id: noteId as string } });

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

/**
 * Get AI-suggested professional reply for a ticket
 * POST /api/tickets/:id/suggest-reply
 */
export const suggestReply = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Only admins can get suggestions
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can get reply suggestions' });
    }

    // Get ticket with messages
    const ticket = await prisma.ticket.findUnique({
      where: { id: id as string },
      include: {
        notes: { orderBy: { createdAt: 'asc' }, take: 10 },
        user: { select: { name: true } }
      }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Build conversation context
    const conversationHistory = ticket.notes
      .map(note => `${note.role === 'admin' ? 'Admin' : 'User'}: ${note.content}`)
      .join('\n\n');

    const context = conversationHistory || `User (${ticket.user?.name}): ${ticket.description}`;

    // Use LLM to generate a professional reply
    try {
      const llm = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY!,
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
      });

      const prompt = `You are a helpful and professional customer support representative. Based on the following ticket conversation, generate a professional and empathetic reply to help resolve the customer's issue.

Conversation:
${context}

Generate a concise, professional reply (2-3 paragraphs max) that:
1. Acknowledges the customer's concern
2. Provides helpful information or next steps
3. Maintains a professional and friendly tone
4. Offers further assistance if needed

Reply:`;

      const response = await llm.invoke(prompt);
      const suggestedReply = response.content?.toString() || '';

      res.json({ suggestedReply });
    } catch (llmError) {
      console.error('LLM error generating reply:', llmError);
      res.status(500).json({ error: 'Failed to generate suggestion' });
    }
  } catch (error) {
    console.error('Suggest reply error:', error);
    res.status(500).json({ error: 'Failed to generate reply suggestion' });
  }
};
