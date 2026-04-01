import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority, chatId } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and description are required' });

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        userId: req.user!.id,
        chatId: chatId || null
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
    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { name: true, email: true } } }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your tickets' });
  }
};

export const getAllTickets = async (req: AuthRequest, res: Response) => {
  try {
    // Only admins should call this (handled by middleware)
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } }
      }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all tickets' });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedToId } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: id as string },
      data: { status, priority, assignedToId }
    });

    res.json(ticket);
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
