import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emitTicketUpdate: (ticketId: string, event: string, data: any) => void;
  emitChatMessage: (chatId: string, message: string) => void;
  onTicketUpdate: (ticketId: string, callback: (data: any) => void) => void;
  onChatMessage: (chatId: string, callback: (data: any) => void) => void;
  subscribeTo: (resourceType: 'ticket' | 'chat', resourceId: string) => void;
  unsubscribeFrom: (resourceType: 'ticket' | 'chat', resourceId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Get base URL by removing /api suffix if present
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

    // Create socket connection
    const newSocket = io(baseUrl, {
      auth: {
        userId: user.id,
        username: user.name,
        role: user.role
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✓ WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('✗ WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('heartbeat');
      }
    }, 25000); // Every 25 seconds

    setSocket(newSocket);

    return () => {
      clearInterval(heartbeatInterval);
      newSocket.disconnect();
    };
  }, [user]);

  const emitTicketUpdate = (ticketId: string, event: string, data: any) => {
    if (socket?.connected) {
      socket.emit(event, { ticketId, ...data });
    }
  };

  const emitChatMessage = (chatId: string, message: string) => {
    if (socket?.connected) {
      socket.emit('chat-message-received', {
        chatId,
        message,
        sender: user?.name,
        timestamp: new Date()
      });
    }
  };

  const onTicketUpdate = (ticketId: string, callback: (data: any) => void) => {
    if (!socket) return;

    // Listen to ticket-specific events
    socket.on('ticket-status-changed', (data) => {
      if (data.ticketId === ticketId) {
        callback(data);
      }
    });

    socket.on('new-ticket-message', (data) => {
      if (data.ticketId === ticketId) {
        callback(data);
      }
    });

    socket.on('ticket-assigned-notification', (data) => {
      if (data.ticketId === ticketId) {
        callback(data);
      }
    });

    socket.on('user-typing', (data) => {
      if (data.ticketId === ticketId) {
        callback({ type: 'typing', data });
      }
    });
  };

  const onChatMessage = (chatId: string, callback: (data: any) => void) => {
    if (!socket) return;

    socket.on('new-chat-message', (data) => {
      if (data.chatId === chatId) {
        callback(data);
      }
    });

    socket.on('ai-typing', (data) => {
      if (data.chatId === chatId) {
        callback({ type: 'ai-typing' });
      }
    });

    socket.on('ai-response-received', (data) => {
      if (data.chatId === chatId) {
        callback(data);
      }
    });

    socket.on('user-typing', (data) => {
      callback({ type: 'typing', data });
    });
  };

  const subscribeTo = (resourceType: 'ticket' | 'chat', resourceId: string) => {
    if (!socket?.connected) return;

    if (resourceType === 'ticket') {
      socket.emit('subscribe-ticket', resourceId);
    } else if (resourceType === 'chat') {
      socket.emit('subscribe-chat', resourceId);
    }
  };

  const unsubscribeFrom = (resourceType: 'ticket' | 'chat', resourceId: string) => {
    if (!socket?.connected) return;

    if (resourceType === 'ticket') {
      socket.emit('unsubscribe-ticket', resourceId);
    } else if (resourceType === 'chat') {
      socket.emit('unsubscribe-chat', resourceId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        emitTicketUpdate,
        emitChatMessage,
        onTicketUpdate,
        onChatMessage,
        subscribeTo,
        unsubscribeFrom
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
