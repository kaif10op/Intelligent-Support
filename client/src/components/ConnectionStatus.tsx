import { useSocket } from '../contexts/SocketContext';
import { WifiOff } from 'lucide-react';

const ConnectionStatus = () => {
  const { isConnected } = useSocket();

  if (isConnected) return null; // Only show when disconnected

  return (
    <div className="connection-status">
      <WifiOff size={16} />
      <span>Reconnecting...</span>
      <style>{`
        .connection-status {
          position: fixed;
          bottom: 24px;
          left: 24px;
          background: rgba(255, 100, 100, 0.1);
          border: 1px solid rgba(255, 100, 100, 0.3);
          color: #ff6464;
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          z-index: 1000;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @media (max-width: 640px) {
          .connection-status {
            left: 12px;
            bottom: 12px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ConnectionStatus;
