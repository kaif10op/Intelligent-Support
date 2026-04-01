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

    const note = await prisma.ticketNote.create({
      data: {
        content,
        ticketId: id as string,
        adminId: req.user!.id
      }
    });

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add note' });
  }
};
