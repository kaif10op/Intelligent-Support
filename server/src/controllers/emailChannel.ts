import type { Response, Request } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';

/**
 * Simulate receiving an email as a support ticket
 * In production, integrate with webhook from email service (SendGrid, Mailgun, etc.)
 * POST /api/email-channel/receive
 */
export const receiveEmailTicket = async (req: Request, res: Response) => {
  try {
    const { from_email, from_name, subject, body, email_id } = req.body;

    // Validation
    if (!from_email || !subject || !body) {
      return res.status(400).json({ error: 'from_email, subject, and body are required' });
    }

    // Verify email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(from_email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Find or create user for this email
    let user = await prisma.user.findUnique({
      where: { email: from_email }
    });

    if (!user) {
      // Create a user for this email (they'll be invited to sign up)
      user = await prisma.user.create({
        data: {
          email: from_email,
          name: from_name || from_email.split('@')[0],
          googleId: `email_${from_email}_${Date.now()}`, // Placeholder for non-OAuth users
          picture: null
        }
      });
    }

    // Create a ticket from the email
    const ticket = await prisma.ticket.create({
      data: {
        title: subject || 'Email Support Request',
        description: body,
        priority: 'MEDIUM',
        userId: user.id,
        dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 day SLA for email
      }
    });

    // Create initial message in ticket with email content
    await prisma.ticketNote.create({
      data: {
        content: `Email received from: ${from_email}\n\nSubject: ${subject}\n\n${body}`,
        role: 'user',
        userId: user.id,
        ticketId: ticket.id
      }
    });

    // Store email ID for reference
    const metadata = {
      email_id,
      received_via: 'email',
      original_from: from_email,
      channel: 'email'
    };

    res.status(201).json({
      success: true,
      message: 'Email received and ticket created',
      ticket: {
        id: ticket.id,
        title: ticket.title,
        user_email: user.email,
        created_at: ticket.createdAt
      },
      metadata
    });
  } catch (error) {
    console.error('Receive Email Ticket Error:', error);
    res.status(500).json({ error: 'Failed to process email ticket' });
  }
};

/**
 * Send reply to email ticket via email
 * POST /api/email-channel/reply/:ticketId
 */
export const sendEmailReply = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { reply_text } = req.body;

    if (!reply_text) {
      return res.status(400).json({ error: 'reply_text is required' });
    }

    // Get ticket and verify access
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId as string },
      include: { user: { select: { email: true, name: true } } }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Only admin or ticket owner can reply
    const isOwner = ticket.userId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to reply to this ticket' });
    }

    // Create reply message
    const note = await prisma.ticketNote.create({
      data: {
        content: reply_text,
        role: isAdmin ? 'admin' : 'user',
        ...(isAdmin && { adminId: req.user!.id }),
        ...(!isAdmin && { userId: req.user!.id }),
        ticketId: ticketId as string
      }
    });

    // In production: Send email reply via SendGrid/Mailgun
    // Example: await sendEmailNotification(ticket.user.email, ticket.title, reply_text)

    res.json({
      success: true,
      message: 'Reply sent and logged',
      note
    });
  } catch (error) {
    console.error('Send Email Reply Error:', error);
    res.status(500).json({ error: 'Failed to send email reply' });
  }
};

/**
 * Get all email channel tickets
 * GET /api/email-channel/tickets
 */
export const getEmailTickets = async (req: AuthRequest, res: Response) => {
  try {
    // Only admins and ticket owners can view
    const isAdmin = req.user!.role === 'ADMIN';

    const where = isAdmin
      ? {
          notes: {
            some: {
              content: { contains: 'Email received from' } // Tickets created via email
            }
          }
        }
      : { userId: req.user!.id };

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        notes: { orderBy: { createdAt: 'asc' }, take: 1 } // Get original email
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      tickets: tickets.map(t => ({
        id: t.id,
        title: t.title,
        user: t.user,
        status: t.status,
        priority: t.priority,
        created_at: t.createdAt,
        channel: 'email'
      }))
    });
  } catch (error) {
    console.error('Get Email Tickets Error:', error);
    res.status(500).json({ error: 'Failed to fetch email tickets' });
  }
};

/**
 * Get statistics for email channel
 * GET /api/email-channel/stats
 */
export const getEmailChannelStats = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Count tickets created via email (have notes with "Email received from")
    const emailTickets = await prisma.ticket.findMany({
      where: {
        notes: {
          some: {
            content: { contains: 'Email received from' }
          }
        }
      }
    });

    // Stats breakdown
    const stats = {
      total_email_tickets: emailTickets.length,
      by_status: {
        OPEN: emailTickets.filter(t => t.status === 'OPEN').length,
        IN_PROGRESS: emailTickets.filter(t => t.status === 'IN_PROGRESS').length,
        RESOLVED: emailTickets.filter(t => t.status === 'RESOLVED').length,
        CLOSED: emailTickets.filter(t => t.status === 'CLOSED').length
      },
      by_priority: {
        LOW: emailTickets.filter(t => t.priority === 'LOW').length,
        MEDIUM: emailTickets.filter(t => t.priority === 'MEDIUM').length,
        HIGH: emailTickets.filter(t => t.priority === 'HIGH').length,
        URGENT: emailTickets.filter(t => t.priority === 'URGENT').length
      },
      avg_resolution_time: emailTickets
        .filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED')
        .reduce((sum, t) => {
          const created = new Date(t.createdAt).getTime();
          const updated = new Date(t.updatedAt).getTime();
          return sum + (updated - created);
        }, 0) / Math.max(emailTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length, 1)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get Email Channel Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch email channel statistics' });
  }
};
