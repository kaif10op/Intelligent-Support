import { useSocket } from '../contexts/SocketContext';
import { useAuthStore } from '../store/useAuthStore';
import { WifiOff } from 'lucide-react';

const ConnectionStatus = () => {
  const { isConnected, hasConnectedOnce } = useSocket();
  const { user } = useAuthStore();

  if (!user || isConnected || !hasConnectedOnce) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium animate-pulse">
      <WifiOff size={16} />
      <span>Reconnecting...</span>
    </div>
  );
};

export default ConnectionStatus;
