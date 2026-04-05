import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';
import { ChatGroq } from '@langchain/groq';
import { formatPaginatedResponse, parsePaginationParams, calculateSkipTake } from '../utils/pagination.js';
import { exportTicketsToCSV, getExportFilename } from '../utils/export.js';
import { sendTicketReplyEmail, sendTicketStatusChangedEmail, sendTicketAssignedEmail } from '../utils/email.js';
import { WebhookService } from '../services/webhookService.js';
import { TagService } from '../services/tagService.js';
import { TicketAssignmentService } from '../services/ticketAssignmentService.js';
import { CacheService } from '../utils/cacheService.js';

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority, chatId } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and description are required' });

    // Calculate SLA due date based on priority
    const now = new Date();
    const slaDays: Record<string, number> = { LOW: 7, MEDIUM: 3, HIGH: 1, URGENT: 0.25 }; // 0.25 = 6 hours
    const slaDuration = (slaDays[priority || 'MEDIUM'] || 3) * 24 * 60 * 60 * 1000;
    const dueAt = new Date(now.getTime() + slaDuration);

    logger.info('Creating ticket', { title, description, priority, userId: req.user!.id, chatId });

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

    logger.info('Ticket created successfully', { ticketId: ticket.id });

    // Emit webhook event for ticket creation
    WebhookService.emit('ticket.created', {
      ticketId: ticket.id,
      title: ticket.title,
      priority: ticket.priority,
      userId: ticket.userId,
      dueAt: ticket.dueAt?.toISOString(),
      chatId: ticket.chatId,
      createdAt: ticket.createdAt.toISOString(),
    }).catch(err => logger.error('Webhook emit error:', err));

    CacheService.deletePattern(`ticket:list:${req.user!.role}:${req.user!.id}:*`).catch(() => {});
    CacheService.deletePattern('ticket:list:ADMIN:*:*').catch(() => {});
    CacheService.deletePattern('ticket:list:SUPPORT_AGENT:*:*').catch(() => {});

    res.json(ticket);
  } catch (error: any) {
    logger.error('Create Ticket Error', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      details: error
    });
    res.status(500).json({ error: 'Failed to create ticket', details: error.message });
  }
};

export const getMyTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePaginationParams(req.query);
    const { skip, take } = calculateSkipTake(page, limit);
    const userRole = req.user!.role;
    const userId = req.user!.id;
    const cacheKey = `ticket:list:${userRole}:${userId}:p${page}:l${limit}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Build where clause based on user role
    let whereClause: any;

    if (userRole === 'SUPPORT_AGENT') {
      // Support agents should see:
      // 1. Tickets assigned to them
      // 2. Tickets they created
      // 3. Unassigned tickets (available for pickup)
      whereClause = {
        OR: [
          { assignedToId: userId },
          { userId: userId },
          { assignedToId: null }
        ]
      };
    } else if (userRole === 'ADMIN') {
      // Admins see all tickets (no filter)
      whereClause = {};
    } else {
      // Regular users see only tickets they created
      whereClause = { userId: userId };
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          assignedTo: { select: { name: true, email: true } }
        },
        skip,
        take
      }),
      prisma.ticket.count({ where: whereClause })
    ]);

    const payload = formatPaginatedResponse(tickets, total, page, limit);
    await CacheService.set(cacheKey, payload, { ttl: 20, tags: ['ticket-list', `user-${userId}`] });
    res.json(payload);
  } catch (error: any) {
    const msg = typeof error?.message === 'string' ? error.message : '';
    const missingSchema =
      msg.includes('does not exist') ||
      msg.includes('relation') ||
      msg.includes('The table');

    if (missingSchema) {
      const { page, limit } = parsePaginationParams(req.query);
      return res.json(formatPaginatedResponse([], 0, page, limit));
    }

    logger.error('Fetch My Tickets Error', { error: error.message, userId: req.user!.id, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch your tickets' });
  }
};

export const getAllTickets = async (req: AuthRequest, res: Response) => {
  try {
    // Only admins should call this (handled by middleware)
    const { page, limit } = parsePaginationParams(req.query);
    const { skip, take } = calculateSkipTake(page, limit);
    const cacheKey = `ticket:list:ADMIN:${req.user!.id}:p${page}:l${limit}`;

    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

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

    const payload = formatPaginatedResponse(tickets, total, page, limit);
    await CacheService.set(cacheKey, payload, { ttl: 20, tags: ['ticket-list', 'admin-list'] });
    res.json(payload);
  } catch (error: any) {
    const msg = typeof error?.message === 'string' ? error.message : '';
    const missingSchema =
      msg.includes('does not exist') ||
      msg.includes('relation') ||
      msg.includes('The table');

    if (missingSchema) {
      const { page, limit } = parsePaginationParams(req.query);
      return res.json(formatPaginatedResponse([], 0, page, limit));
    }

    logger.error('Fetch All Tickets Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch all tickets' });
  }
};

/**
 * Get single ticket details
 * GET /api/tickets/:id
 */
export const getTicketById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id: id as string },
      include: {
        user: { select: { id: true, name: true, email: true, picture: true, createdAt: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        chat: { select: { id: true, title: true, kbId: true, createdAt: true, updatedAt: true } }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const isOwner = ticket.userId === req.user!.id;
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'SUPPORT_AGENT';
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(ticket);
  } catch (error: any) {
    logger.error('Get ticket by id error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch ticket details' });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  let { status, priority, assignedToId } = req.body;

  try {
    // Check if ticket is overdue
    const ticket = await prisma.ticket.findUnique({
      where: { id: id as string },
      include: { user: { select: { email: true, name: true } }, assignedTo: { select: { name: true } } }
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const isAdmin = req.user!.role === 'ADMIN';
    const isSupportAgent = req.user!.role === 'SUPPORT_AGENT';
    const isAssignedAgent = ticket.assignedToId === req.user!.id;

    if (isSupportAgent && !isAssignedAgent && ticket.assignedToId) {
      return res.status(403).json({ error: 'Support agents can only update tickets assigned to them' });
    }

    // Support agents can self-assign unassigned tickets but cannot reassign assigned tickets to others
    if (isSupportAgent && assignedToId) {
      const isSelfAssign = assignedToId === req.user!.id;
      const isCurrentlyUnassigned = !ticket.assignedToId;
      if (!(isSelfAssign && isCurrentlyUnassigned)) {
        return res.status(403).json({ error: 'Support agents can only self-assign unassigned tickets' });
      }
    }

    if (!isAdmin && assignedToId && assignedToId !== req.user!.id) {
      return res.status(403).json({ error: 'Only admins can assign tickets to other agents' });
    }

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

    // Emit webhook event for status change
    if (status && status !== ticket.status) {
      WebhookService.emit('ticket.status.changed', {
        ticketId: id,
        previousStatus: ticket.status,
        newStatus: status,
        updatedAt: updatedTicket.updatedAt.toISOString(),
      }).catch(err => logger.error('Webhook emit error:', err));
    }

    // Send email notifications
    if (ticket.user?.email) {
      // Status changed
      if (status && status !== ticket.status) {
        await sendTicketStatusChangedEmail(ticket.user.email, ticket.title, status);
      }

      // Ticket assigned to someone
      if (assignedToId && assignedToId !== ticket.assignedToId) {
        const admin = await prisma.user.findUnique({
          where: { id: assignedToId },
          select: { name: true }
        });
        if (admin?.name) {
          await sendTicketAssignedEmail(ticket.user.email, ticket.title, admin.name);
        }
      }
    }

    CacheService.deletePattern('ticket:list:*:*:*').catch(() => {});

    res.json(updatedTicket);
  } catch (error: any) {
    logger.error('Update Ticket Error', {
      error: error.message,
      stack: error.stack,
      ticketId: id,
      update: { status, priority, assignedToId }
    });
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};

export const addTicketNote = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    if (!content) return res.status(400).json({ error: 'Note content is required' });

    // Check ticket ownership or admin status
    const ticket = await prisma.ticket.findUnique({
      where: { id: id as string },
      include: { user: { select: { email: true, name: true } } }
    });
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

    // Send email notification if admin replied
    if (isAdmin && ticket.user?.email) {
      const adminUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { name: true }
      });
      const replyPreview = content.substring(0, 100);
      await sendTicketReplyEmail(ticket.user.email, ticket.title, adminUser?.name || 'Support', replyPreview);
    }

    CacheService.deletePattern('ticket:list:*:*:*').catch(() => {});

    res.json(note);
  } catch (error: any) {
    logger.error('Add Ticket Note Error', { error: error.message, stack: error.stack, ticketId: id });
    res.status(500).json({ error: 'Failed to add message' });
  }
};

/**
 * Get all messages for a ticket (bidirectional - admin and user messages)
 * GET /api/tickets/:id/messages
 */
export const getTicketMessages = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
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
  } catch (error: any) {
    logger.error('Fetch Ticket Messages Error', { error: error.message, stack: error.stack, ticketId: id });
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

/**
 * Delete a ticket message (user can delete own, admin can delete any)
 * DELETE /api/tickets/:id/messages/:noteId
 */
export const deleteTicketMessage = async (req: AuthRequest, res: Response) => {
  const { id, noteId } = req.params;
  try {
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
    CacheService.deletePattern('ticket:list:*:*:*').catch(() => {});

    res.json({ success: true, message: 'Message deleted' });
  } catch (error: any) {
    logger.error('Delete Ticket Message Error', { error: error.message, stack: error.stack, noteId });
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
    } catch (llmError: any) {
      logger.error('LLM error generating reply', { error: llmError.message, stack: llmError.stack });
      res.status(500).json({ error: 'Failed to generate suggestion' });
    }
  } catch (error: any) {
    logger.error('Suggest reply error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate reply suggestion' });
  }
};

/**
 * Export user's tickets to CSV
 * GET /api/tickets/export/csv
 */
export const exportMyTicketsAsCSV = async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user!.id },
      include: {
        user: { select: { name: true } },
        assignedTo: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const csv = exportTicketsToCSV(tickets);
    const filename = getExportFilename('my-tickets');

    res.setHeader('Content-Type', 'text/csv;charset=utf-8;');
    res.setHeader('Content-Disposition', `attachment;filename="${filename}"`);
    res.send(csv);
  } catch (error: any) {
    logger.error('Export tickets error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to export tickets' });
  }
};

/**
 * Export all tickets to CSV (admin only)
 * GET /api/tickets/export/all/csv
 */
export const exportAllTicketsAsCSV = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const tickets = await prisma.ticket.findMany({
      include: {
        user: { select: { name: true } },
        assignedTo: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const csv = exportTicketsToCSV(tickets);
    const filename = getExportFilename('all-tickets');

    res.setHeader('Content-Type', 'text/csv;charset=utf-8;');
    res.setHeader('Content-Disposition', `attachment;filename="${filename}"`);
    res.send(csv);
  } catch (error: any) {
    logger.error('Export all tickets error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to export tickets' });
  }
};

/**
 * Assign ticket to support agent (admin only)
 * PUT /api/tickets/:id/assign
 */
export const assignTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    // Only admins can assign tickets
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!assignedToId) {
      return res.status(400).json({ error: 'assignedToId is required' });
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({ where: { id: id as string } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Verify assigned agent exists and is support agent or admin
    const agent = await prisma.user.findUnique({
      where: { id: assignedToId as string }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Support agent not found' });
    }

    if (agent.role !== 'SUPPORT_AGENT' && agent.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Can only assign to support agents or admins' });
    }

    // Assign ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: id as string },
      data: {
        assignedToId: assignedToId as string,
        status: 'IN_PROGRESS' // Automatically mark as in progress when assigned
      },
      include: {
        user: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } }
      }
    });

    logger.info('Ticket assigned', {
      ticketId: id,
      assignedTo: assignedToId,
      adminId: req.user!.id
    });

    CacheService.deletePattern('ticket:list:*:*:*').catch(() => {});

    res.json({ ticket: updatedTicket, success: true });
  } catch (error: any) {
    logger.error('Assign ticket error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to assign ticket' });
  }
};

/**
 * Get ticket assignment metrics (admin only)
 * GET /api/tickets/admin/assignment-metrics
 */
export const getAssignmentMetrics = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await TicketAssignmentService.getAssignmentStats();
    res.json(stats);
  } catch (error: any) {
    logger.error('Get assignment metrics error', { error: error.message });
    res.status(500).json({ error: 'Failed to get assignment metrics' });
  }
};

/**
 * Auto-assign all unassigned tickets (admin only)
 * POST /api/tickets/admin/auto-assign
 */
export const autoAssignTickets = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await TicketAssignmentService.autoAssignUnassignedTickets();

    logger.info('Auto-assign completed', result);

    res.json({
      success: true,
      assigned: result.assigned,
      failed: result.errors,
      message: `Successfully assigned ${result.assigned} tickets to support agents${result.errors > 0 ? `, ${result.errors} failed` : ''}`
    });
  } catch (error: any) {
    logger.error('Auto-assign error', { error: error.message });
    res.status(500).json({ error: 'Failed to auto-assign tickets' });
  }
};

/**
 * Rebalance tickets among agents (admin only)
 * POST /api/tickets/admin/rebalance
 * Moves tickets from overloaded agents to available agents
 */
export const rebalanceTickets = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const reassignments = await TicketAssignmentService.rebalanceTickets();

    logger.info('Ticket rebalance completed', {
      count: reassignments.length,
      details: reassignments
    });

    res.json({
      success: true,
      reassignments,
      message: `Rebalanced ${reassignments.length} tickets among support agents`
    });
  } catch (error: any) {
    logger.error('Rebalance error', { error: error.message });
    res.status(500).json({ error: 'Failed to rebalance tickets' });
  }
};

/**
 * Reassign slow tickets to faster agents (admin only)
 * POST /api/tickets/admin/optimize
 * Finds tickets stuck in progress and reassigns to faster agents
 */
export const optimizeTicketAssignment = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [slowReassignments, inactiveReassignments] = await Promise.all([
      TicketAssignmentService.reassignSlowTickets(),
      TicketAssignmentService.reassignInactiveAgentsTickets()
    ]);
    const reassignments = [...slowReassignments, ...inactiveReassignments];

    logger.info('Ticket optimization completed', {
      count: reassignments.length,
      details: reassignments
    });

    res.json({
      success: true,
      reassignments,
      message: `Optimized ${reassignments.length} tickets through slow/inactive-agent reassignment`
    });
  } catch (error: any) {
    logger.error('Optimize error', { error: error.message });
    res.status(500).json({ error: 'Failed to optimize ticket assignment' });
  }
};

/**
 * Get comprehensive customer context for a ticket
 * GET /api/tickets/:id/context
 */
export const getTicketContext = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id: id as string },
      include: {
        user: { select: { id: true, name: true, email: true, picture: true, createdAt: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const isOwner = ticket.userId === req.user!.id;
    const isStaff = req.user!.role === 'ADMIN' || req.user!.role === 'SUPPORT_AGENT';
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const [ticketHistory, chats, kbInteractions, notes] = await Promise.all([
      prisma.ticket.findMany({
        where: { userId: ticket.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, title: true, status: true, priority: true, assignedToId: true, createdAt: true, updatedAt: true }
      }),
      prisma.chat.findMany({
        where: { userId: ticket.userId },
        include: {
          kb: { select: { id: true, title: true } },
          messages: { select: { id: true, role: true, content: true, createdAt: true, confidence: true, rating: true }, orderBy: { createdAt: 'desc' }, take: 5 }
        },
        orderBy: { updatedAt: 'desc' },
        take: 15
      }),
      prisma.chat.findMany({
        where: { userId: ticket.userId },
        include: {
          kb: { select: { id: true, title: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
      }),
      prisma.ticketNote.findMany({
        where: { ticketId: id as string },
        orderBy: { createdAt: 'asc' },
        take: 100
      })
    ]);

    const kbUsageMap = new Map<string, { kbId: string; title: string; interactions: number; lastUsedAt: Date }>();
    for (const chat of kbInteractions) {
      if (!chat.kb) continue;
      const existing = kbUsageMap.get(chat.kb.id);
      if (existing) {
        existing.interactions += 1;
        if (chat.updatedAt > existing.lastUsedAt) existing.lastUsedAt = chat.updatedAt;
      } else {
        kbUsageMap.set(chat.kb.id, {
          kbId: chat.kb.id,
          title: chat.kb.title,
          interactions: 1,
          lastUsedAt: chat.updatedAt
        });
      }
    }

    res.json({
      ticket,
      user: ticket.user,
      assignedTo: ticket.assignedTo,
      context: {
        ticketHistory,
        recentChats: chats,
        knowledgeBaseInteractions: Array.from(kbUsageMap.values()).sort((a, b) => b.interactions - a.interactions),
        currentTicketNotes: notes
      }
    });
  } catch (error: any) {
    logger.error('Get ticket context error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch ticket context' });
  }
};
