import { useToast } from '../contexts/ToastContext';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      case 'info': return 'text-blue-400';
      default: return 'text-foreground';
    }
  };

  const getBgClasses = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/30';
      case 'error': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-amber-500/10 border-amber-500/30';
      case 'info': return 'bg-blue-500/10 border-blue-500/30';
      default: return 'bg-card/50 border-border/30';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 pointer-events-none max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            flex items-center gap-3
            px-4 py-4 rounded-lg
            border
            min-w-80 max-w-md
            shadow-lg
            animate-fadeIn
            ${getBgClasses(toast.type)}
          `}
        >
          {/* Icon */}
          <div className={getIconColor(toast.type)} style={{ flexShrink: 0 }}>
            {getIcon(toast.type)}
          </div>

          {/* Message */}
          <div className="flex-1 text-sm text-foreground break-words">
            {toast.message}
          </div>

          {/* Close Button */}
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
