import { useToast } from '../contexts/ToastContext';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-500';
      case 'error': return 'text-rose-500';
      case 'warning': return 'text-amber-500';
      case 'info': return 'text-primary-500';
      default: return 'text-foreground';
    }
  };

  const getBgClasses = (type: string) => {
    switch (type) {
      case 'success': return 'border-emerald-500/20 bg-emerald-500/5 shadow-[0_4px_20px_rgba(16,185,129,0.1)]';
      case 'error': return 'border-rose-500/20 bg-rose-500/5 shadow-[0_4px_20px_rgba(244,63,94,0.1)]';
      case 'warning': return 'border-amber-500/20 bg-amber-500/5 shadow-[0_4px_20px_rgba(245,158,11,0.1)]';
      case 'info': return 'border-primary-500/20 bg-primary-500/5 shadow-[0_4px_20px_rgba(99,102,241,0.1)]';
      default: return 'bg-card/50 border-border/30';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'error': return <AlertCircle size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      case 'info': return <Info size={20} />;
      default: return null;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 pointer-events-none max-w-[380px] w-full">
      {toasts.map(toast => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onRemove={() => removeToast(toast.id)} 
          getBgClasses={getBgClasses} 
          getIconColor={getIconColor} 
          getIcon={getIcon} 
        />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove, getBgClasses, getIconColor, getIcon }: any) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 5000; // Assuming 5s life
    const interval = 10;
    const step = 100 / (duration / interval);
    
    const timer = setInterval(() => {
      setProgress(p => Math.max(0, p - step));
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`
        pointer-events-auto
        relative overflow-hidden
        flex items-start gap-3
        px-4 py-4 rounded-xl
        border backdrop-blur-xl
        animate-slide-up
        ${getBgClasses(toast.type)}
      `}
    >
      {/* Progress bar */}
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20"
        style={{ width: `${progress}%`, transition: 'width 10ms linear' }}
      />
      
      {/* Icon */}
      <div className={`${getIconColor(toast.type)} shrink-0 mt-0.5`}>
        {getIcon(toast.type)}
      </div>

      {/* Message */}
      <div className="flex-1 text-sm font-medium text-foreground leading-relaxed break-words pr-2">
        {toast.message}
      </div>

      {/* Close Button */}
      <button
        onClick={onRemove}
        className="text-surface-400 hover:text-foreground hover:bg-surface-100 rounded-md p-1 transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastContainer;
