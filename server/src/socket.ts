import type { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import type { AuthRequest } from './middlewares/auth.js';
import { prisma } from './prisma.js';
import { logger } from './utils/logger.js';

interface SocketUser {
  userId: string;
  username: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

import { config } from './config.js';

export const initializeSocket = (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN,
      credentials: true
    }
  });

  // Middleware to verify JWT on socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));

      // Verify JWT - in production, use proper JWT verification
      // For now, we'll assume token contains userId
      const userId = socket.handshake.auth.userId;
      const username = socket.handshake.auth.username;
      const role = socket.handshake.auth.role;

      if (!userId) return next(new Error('Invalid token'));

      (socket as AuthenticatedSocket).user = { userId, username, role };
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) return;

    logger.info('User connected', { username: user.username, socketId: socket.id });

    // Join user-specific room for direct notifications
    socket.join(`user-${user.userId}`);

    // Join admin room if user is admin
    if (user.role === 'ADMIN') {
      socket.join('admin-room');
    }

    // ===== TICKET EVENTS =====

    // Subscribe to ticket updates (for ticket details page)
    socket.on('subscribe-ticket', (ticketId: string) => {
      socket.join(`ticket-${ticketId}`);
      logger.debug('User subscribed to ticket', { username: user.username, ticketId });
    });

    socket.on('unsubscribe-ticket', (ticketId: string) => {
      socket.leave(`ticket-${ticketId}`);
      logger.debug('User unsubscribed from ticket', { username: user.username, ticketId });
    });

    // Ticket status updated
    socket.on('ticket-status-updated', (data: { ticketId: string; status: string; updatedBy: string }) => {
      io.to(`ticket-${data.ticketId}`).emit('ticket-status-changed', data);
      io.to('admin-room').emit('admin-notification', {
        type: 'ticket_status_changed',
        message: `Ticket status updated to ${data.status}`,
        ticketId: data.ticketId,
        timestamp: new Date()
      });
    });

    // Ticket assigned
    socket.on('ticket-assigned', (data: { ticketId: string; assignedTo: string; assignedBy: string }) => {
      io.to(`ticket-${data.ticketId}`).emit('ticket-assigned-notification', data);
      io.to(`user-${data.assignedTo}`).emit('notification', {
        type: 'ticket_assigned',
        message: `You have been assigned a new ticket`,
        ticketId: data.ticketId,
        timestamp: new Date()
      });
    });

    // New ticket message
    socket.on('ticket-message-added', (data: { ticketId: string; message: string; sender: string; senderRole: string }) => {
      io.to(`ticket-${data.ticketId}`).emit('new-ticket-message', data);
    });

    // ===== CHAT EVENTS =====

    // Subscribe to chat updates
    socket.on('subscribe-chat', (chatId: string) => {
      socket.join(`chat-${chatId}`);
      logger.debug('User subscribed to chat', { username: user.username, chatId });
    });

    socket.on('unsubscribe-chat', (chatId: string) => {
      socket.leave(`chat-${chatId}`);
    });

    // Chat message received
    socket.on('chat-message-received', (data: { chatId: string; message: string; sender: string; timestamp: Date }) => {
      io.to(`chat-${data.chatId}`).emit('new-chat-message', data);
    });

    // AI response started streaming
    socket.on('ai-response-started', (data: { chatId: string }) => {
      io.to(`chat-${data.chatId}`).emit('ai-typing', data);
    });

    // AI response completed
    socket.on('ai-response-completed', (data: { chatId: string; response: string; confidence?: number }) => {
      io.to(`chat-${data.chatId}`).emit('ai-response-received', data);
    });

    // ===== ADMIN EVENTS =====

    // Admin broadcasts message to all users
    if (user.role === 'ADMIN') {
      socket.on('broadcast-announcement', (data: { message: string; type: string }) => {
        io.emit('admin-announcement', {
          ...data,
          sender: user.username,
          timestamp: new Date()
        });
      });

      socket.on('system-maintenance', (data: { message: string; duration: number }) => {
        io.emit('system-notification', {
          type: 'maintenance',
          ...data,
          timestamp: new Date()
        });
      });
    }

    // ===== TYPING INDICATORS =====

    socket.on('typing-started', (data: { chatId?: string; ticketId?: string }) => {
      if (data.chatId) {
        socket.to(`chat-${data.chatId}`).emit('user-typing', { userId: user.userId, username: user.username });
      } else if (data.ticketId) {
        socket.to(`ticket-${data.ticketId}`).emit('user-typing', { userId: user.userId, username: user.username });
      }
    });

    socket.on('typing-stopped', (data: { chatId?: string; ticketId?: string }) => {
      if (data.chatId) {
        socket.to(`chat-${data.chatId}`).emit('user-stopped-typing', { userId: user.userId });
      } else if (data.ticketId) {
        socket.to(`ticket-${data.ticketId}`).emit('user-stopped-typing', { userId: user.userId });
      }
    });

    // ===== PRESENCE =====

    socket.on('heartbeat', () => {
      // Used to keep connection alive
      socket.emit('heartbeat-ack');
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      logger.info('User disconnected', { username: user.username, socketId: socket.id });
    });

    // Error handler
    socket.on('error', (error: any) => {
      logger.error('Socket error', { username: user.username, error: error.message, stack: error.stack });
    });
  });

  return io;
};

// Helper function to emit events from controllers
export const emitTicketUpdate = (io: any, ticketId: string, event: string, data: any) => {
  io.to(`ticket-${ticketId}`).emit(event, data);
};

export const emitChatUpdate = (io: any, chatId: string, event: string, data: any) => {
  io.to(`chat-${chatId}`).emit(event, data);
};

export const emitUserNotification = (io: any, userId: string, event: string, data: any) => {
  io.to(`user-${userId}`).emit(event, data);
};

export const emitAdminNotification = (io: any, event: string, data: any) => {
  io.to('admin-room').emit(event, data);
};
