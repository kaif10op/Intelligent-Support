import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface PresenceIndicatorsProps {
  resourceId: string;
  resourceType: 'ticket' | 'chat' | 'kb';
}

/**
 * Real-time Presence Indicator Component
 * Shows who's currently viewing/editing a resource
 */
export const PresenceIndicators: React.FC<PresenceIndicatorsProps> = ({
  resourceId,
  resourceType,
}) => {
  const { socket } = useSocket();
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [typingUser, setTypingUser] = useState<User | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('user-presence', { resourceId, resourceType });

    // Listen for presence updates
    socket.on('presence-update', (data: { users: User[] }) => {
      setActiveUsers(data.users);
    });

    // Listen for typing indicators
    socket.on('user-typing', (data: { user: User }) => {
      setTypingUser(data.user);
      setTimeout(() => setTypingUser(null), 3000); // Clear after 3 seconds
    });

    socket.on('user-stopped-typing', () => {
      setTypingUser(null);
    });

    return () => {
      socket.off('presence-update');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
    };
  }, [socket, resourceId, resourceType]);

  if (activeUsers.length === 0 && !typingUser) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Active Users */}
      {activeUsers.length > 0 && (
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2">
            {activeUsers.slice(0, 3).map(user => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-xs text-white font-semibold"
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {activeUsers.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs text-white font-semibold">
                +{activeUsers.length - 3}
              </div>
            )}
          </div>
          <span className="text-gray-600">
            {activeUsers.length} viewing
          </span>
        </div>
      )}

      {/* Typing Indicator */}
      {typingUser && (
        <div className="flex items-center gap-1 text-blue-600">
          <span className="text-xs font-medium">{typingUser.name} typing</span>
          <div className="flex gap-1">
            <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></span>
            <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresenceIndicators;
