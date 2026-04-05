import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { WS_BASE_URL } from '../config/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  hasConnectedOnce: boolean;
  emitTicketUpdate: (ticketId: string, event: string, data: any) => void;
  emitChatMessage: (chatId: string, message: string) => void;
  sendChatMessage: (data: { chatId?: string; kbId: string; message: string }) => void;
  onTicketUpdate: (ticketId: string, callback: (data: any) => void) => void;
  onChatMessage: (chatId: string, callback: (data: any) => void) => () => void;
  subscribeTo: (resourceType: 'ticket' | 'chat', resourceId: string) => void;
  unsubscribeFrom: (resourceType: 'ticket' | 'chat', resourceId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);

  // Storage for active chat callbacks to handle routing without multiple listeners
  const chatCallbacks = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    if (!user) return;

    // Get JWT token for Socket.io authentication
    const token = localStorage.getItem('auth_token');

    const newSocket = io(WS_BASE_URL, {
      auth: {
        userId: user.id,
        username: user.name,
        role: user.role,
        token: token || undefined
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
      // Prefer websocket only to reduce handshake overhead
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('✓ Socket connected', { url: WS_BASE_URL, userId: user.id });
      setIsConnected(true);
      setHasConnectedOnce(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Centralized listeners for AI stream events
    newSocket.on('ai-typing', (data) => {
      const cb = chatCallbacks.current.get(data.chatId) || chatCallbacks.current.get('new');
      if (cb) cb({ type: 'ai-typing', ...data });
    });

    newSocket.on('ai-token', (data) => {
      // Route to specific chat OR 'new' if we are starting a fresh chat
      const cb = chatCallbacks.current.get(data.chatId) || chatCallbacks.current.get('new');
      if (cb) cb({ type: 'ai-token', token: data.token, chatId: data.chatId });
    });

    newSocket.on('ai-complete', (data) => {
      const cb = chatCallbacks.current.get(data.chatId) || chatCallbacks.current.get('new');
      if (cb) cb({ type: 'ai-complete', ...data });
    });

    newSocket.on('ai-error', (data) => {
      // Errors are usually broadcast to the sender
      const cb = Array.from(chatCallbacks.current.values())[0];
      if (cb) cb({ type: 'ai-error', ...data });
    });

    newSocket.on('ai-paused', (data) => {
      const cb = chatCallbacks.current.get(data.chatId) || chatCallbacks.current.get('new');
      if (cb) cb({ type: 'ai-paused', ...data });
    });

    newSocket.on('new-chat-message', (data) => {
      const cb = chatCallbacks.current.get(data.chatId);
      if (cb) cb(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const emitTicketUpdate = (ticketId: string, event: string, data: any) => {
    if (socket?.connected) socket.emit(event, { ticketId, ...data });
  };

  const emitChatMessage = (chatId: string, message: string) => {
    if (socket?.connected) {
      socket.emit('chat-message-received', { chatId, message, sender: user?.name, timestamp: new Date() });
    }
  };

  const sendChatMessage = (data: { chatId?: string; kbId: string; message: string }) => {
    if (socket?.connected) socket.emit('send-chat-message', data);
  };

  const onTicketUpdate = (ticketId: string, callback: (data: any) => void) => {
    if (!socket) return;
    socket.on('ticket-status-changed', (data) => data.ticketId === ticketId && callback(data));
    socket.on('new-ticket-message', (data) => data.ticketId === ticketId && callback(data));
  };

  const onChatMessage = (chatId: string, callback: (data: any) => void) => {
    // Save callback to registry
    chatCallbacks.current.set(chatId, callback);
    
    // Return cleanup function to remove from registry
    return () => {
      chatCallbacks.current.delete(chatId);
    };
  };

  const subscribeTo = (resourceType: 'ticket' | 'chat', resourceId: string) => {
    if (socket?.connected) {
      socket.emit(`subscribe-${resourceType}`, resourceId);
    }
  };

  const unsubscribeFrom = (resourceType: 'ticket' | 'chat', resourceId: string) => {
    if (socket?.connected) {
      socket.emit(`unsubscribe-${resourceType}`, resourceId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        hasConnectedOnce,
        emitTicketUpdate,
        emitChatMessage,
        sendChatMessage,
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
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
