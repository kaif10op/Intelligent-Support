import type { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import type { AuthRequest } from './middlewares/auth.js';
import { prisma } from './prisma.js';
import { logger } from './utils/logger.js';
import { AIService } from './services/aiService.js';

interface SocketUser {
  userId: string;
  username: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

import { config } from './config.js';

type ResourceType = 'ticket' | 'chat' | 'kb';

interface PresenceUser {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  userId: string;
  socketId: string;
  seenAt: string;
}

export const initializeSocket = (httpServer: HTTPServer) => {
  const corsOrigins = config.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true
    }
  });

  // Middleware to verify JWT on socket connection
  io.use(async (socket, next) => {
    try {
      const userId = socket.handshake.auth.userId;
      const username = socket.handshake.auth.username;
      const role = socket.handshake.auth.role;

      if (!userId || !username) return next(new Error('Authentication required'));

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

    const presenceRegistry = (io as any).presenceRegistry || new Map<string, Map<string, PresenceUser>>();
    const socketPresenceMap = (io as any).socketPresenceMap || new Map<string, Set<string>>();
    (io as any).presenceRegistry = presenceRegistry;
    (io as any).socketPresenceMap = socketPresenceMap;

    const presenceKey = (resourceType: ResourceType, resourceId: string) => `${resourceType}:${resourceId}`;
    const isStaffRole = (role: string) => ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT', 'SUPPORT', 'AGENT'].includes((role || '').toUpperCase());
    const emitPresenceUpdate = (resourceType: ResourceType, resourceId: string) => {
      const key = presenceKey(resourceType, resourceId);
      const users = Array.from((presenceRegistry.get(key)?.values() || []) as Iterable<PresenceUser>).map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar
      }));
      io.to(`${resourceType}-${resourceId}`).emit('presence-update', { resourceType, resourceId, users });
    };
    const addPresence = (resourceType: ResourceType, resourceId: string) => {
      const key = presenceKey(resourceType, resourceId);
      const bySocket = socketPresenceMap.get(socket.id) || new Set<string>();
      const resourceUsers = presenceRegistry.get(key) || new Map<string, PresenceUser>();
      const now = new Date().toISOString();
      resourceUsers.set(socket.id, {
        id: user.userId,
        name: user.username,
        role: user.role,
        userId: user.userId,
        socketId: socket.id,
        seenAt: now
      });
      presenceRegistry.set(key, resourceUsers);
      bySocket.add(key);
      socketPresenceMap.set(socket.id, bySocket);
      socket.join(`${resourceType}-${resourceId}`);
      emitPresenceUpdate(resourceType, resourceId);
    };
    const removePresence = (resourceType: ResourceType, resourceId: string) => {
      const key = presenceKey(resourceType, resourceId);
      const resourceUsers = presenceRegistry.get(key);
      if (resourceUsers) {
        resourceUsers.delete(socket.id);
        if (resourceUsers.size === 0) {
          presenceRegistry.delete(key);
        } else {
          presenceRegistry.set(key, resourceUsers);
        }
      }
      const bySocket = socketPresenceMap.get(socket.id);
      bySocket?.delete(key);
      if (bySocket && bySocket.size === 0) socketPresenceMap.delete(socket.id);
      socket.leave(`${resourceType}-${resourceId}`);
      emitPresenceUpdate(resourceType, resourceId);
    };
    const cleanupSocketPresence = () => {
      const keys = Array.from((socketPresenceMap.get(socket.id) || []) as Iterable<string>);
      for (const key of keys) {
        const [resourceType, resourceId] = key.split(':') as [ResourceType, string];
        removePresence(resourceType, resourceId);
      }
    };
    const hasActiveStaffPresence = (resourceType: ResourceType, resourceId: string, excludeUserId?: string) => {
      const key = presenceKey(resourceType, resourceId);
      const users = presenceRegistry.get(key);
      if (!users || users.size === 0) return false;
      return Array.from(users.values() as Iterable<PresenceUser>).some((u) => {
        if (u.socketId === socket.id) return false;
        if (excludeUserId && u.userId === excludeUserId) return false;
        return isStaffRole(u.role);
      });
    };

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

    socket.on('user-presence', (data: { resourceId: string; resourceType: ResourceType }) => {
      if (!data?.resourceId || !data?.resourceType) return;
      addPresence(data.resourceType, data.resourceId);
      logger.debug('Presence joined', { username: user.username, resourceType: data.resourceType, resourceId: data.resourceId });
    });

    socket.on('leave-presence', (data: { resourceId: string; resourceType: ResourceType }) => {
      if (!data?.resourceId || !data?.resourceType) return;
      removePresence(data.resourceType, data.resourceId);
      logger.debug('Presence left', { username: user.username, resourceType: data.resourceType, resourceId: data.resourceId });
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

    // Chat message sent (client initiates new message via socket)
    socket.on('send-chat-message', async (data: { chatId?: string; kbId: string; message: string }) => {
      const { chatId, kbId, message } = data;
      const trimmedMessage = (message || '').trim();

      if (!trimmedMessage) {
        socket.emit('ai-error', { message: 'Message cannot be empty' });
        return;
      }

      const chatRecord = chatId
        ? await prisma.chat.findUnique({
            where: { id: chatId },
            select: {
              id: true,
              userId: true,
              assignedAgentId: true,
              tickets: { select: { id: true } }
            }
          })
        : null;

      const ticketIds = chatRecord?.tickets?.map((ticket) => ticket.id) || [];
      const humanActive = (chatId && hasActiveStaffPresence('chat', chatId, user.userId))
        || ticketIds.some((ticketId) => hasActiveStaffPresence('ticket', ticketId, user.userId));

      if (humanActive && chatId) {
        socket.emit('ai-paused', {
          chatId,
          reason: 'human_active',
          message: 'A support agent is actively viewing this conversation, so AI will wait.'
        });
        io.to(`chat-${chatId}`).emit('ai-paused', {
          chatId,
          reason: 'human_active',
          message: 'A support agent is actively viewing this conversation, so AI will wait.'
        });
        return;
      }

      // Notify both room and sender so UI starts consistently.
      if (chatId) {
        io.to(`chat-${chatId}`).emit('ai-typing', { chatId });
      } else {
        socket.emit('ai-typing', { chatId: 'new' });
      }

      let settled = false;
      const finishError = (errorMessage: string) => {
        if (settled) return;
        settled = true;
        socket.emit('ai-error', { message: errorMessage });
      };
      const finishComplete = (finalChatId: string, fullAnswer: string) => {
        if (settled) return;
        settled = true;
        socket.emit('ai-complete', { chatId: finalChatId, fullAnswer });
      };

      // Prevent infinite "AI is thinking" UX if provider/tool stream hangs.
      const watchdog = setTimeout(() => {
        finishError('AI response timed out. Please try again.');
      }, 45000);

      try {
        await AIService.processMessage(trimmedMessage, {
          userId: user.userId,
          kbId,
          chatId,
          onToken: (token, realizedChatId) => {
            if (settled) return;
            socket.emit('ai-token', { chatId: realizedChatId, token });
          },
          onComplete: (fullAnswer, finalChatId) => {
            clearTimeout(watchdog);
            finishComplete(finalChatId, fullAnswer);
          },
          onError: (error) => {
            clearTimeout(watchdog);
            finishError(error?.message || 'Failed to process message');
          }
        });
      } catch (error: any) {
        clearTimeout(watchdog);
        finishError(error?.message || 'Failed to process message');
      } finally {
        clearTimeout(watchdog);
      }
    });

    // Chat message received (notifications)
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
      cleanupSocketPresence();
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
