import { useToast } from '../contexts/ToastContext';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

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

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'rgba(74, 222, 128, 0.1)',
          border: 'rgba(74, 222, 128, 0.3)',
          icon: '#4ade80',
          text: '#4ade80'
        };
      case 'error':
        return {
          bg: 'rgba(255, 100, 100, 0.1)',
          border: 'rgba(255, 100, 100, 0.3)',
          icon: '#ff6464',
          text: '#ff6464'
        };
      case 'warning':
        return {
          bg: 'rgba(255, 165, 0, 0.1)',
          border: 'rgba(255, 165, 0, 0.3)',
          icon: '#ffa500',
          text: '#ffa500'
        };
      case 'info':
        return {
          bg: 'rgba(0, 210, 255, 0.1)',
          border: 'rgba(0, 210, 255, 0.3)',
          icon: '#00d2ff',
          text: '#00d2ff'
        };
      default:
        return { bg: '', border: '', icon: '', text: '' };
    }
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const styles = getStyles(toast.type);
        return (
          <div
            key={toast.id}
            className="toast-item fade-in"
            style={{
              background: styles.bg,
              border: `1px solid ${styles.border}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: '320px',
              maxWidth: '400px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ color: styles.icon, display: 'flex', alignItems: 'center' }}>
              {getIcon(toast.type)}
            </div>
            <div style={{ flex: 1, color: '#f0f0f0', fontSize: '0.95rem' }}>
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: styles.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            >
              <X size={18} />
            </button>
          </div>
        );
      })}

      <style>{`
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 2000;
          pointer-events: none;
        }

        .toast-item {
          pointer-events: auto;
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .toast-container {
            bottom: 12px;
            right: 12px;
            left: 12px;
          }

          .toast-item {
            min-width: auto;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
