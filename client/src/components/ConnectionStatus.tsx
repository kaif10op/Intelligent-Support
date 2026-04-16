import { useSocket } from '../contexts/SocketContext';
import { useAuthStore } from '../store/useAuthStore';
import { WifiOff } from 'lucide-react';

const ConnectionStatus = () => {
  const { isConnected, hasConnectedOnce } = useSocket();
  const { user } = useAuthStore();

  if (!user || isConnected || !hasConnectedOnce) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 backdrop-blur-xl text-rose-500 rounded-full text-sm font-semibold shadow-[0_4px_20px_rgba(244,63,94,0.15)] animate-slide-up">
      <div className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
        <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
      </div>
      <WifiOff size={16} className="text-rose-400" />
      <span>Reconnecting...</span>
    </div>
  );
};

export default ConnectionStatus;
