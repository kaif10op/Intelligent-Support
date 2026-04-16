import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      {/* Dark frosted overlay */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-300" />
      
      {/* Modal Container */}
      <div
        className={`relative w-full ${sizeStyles[size]} overflow-hidden animate-slide-up rounded-2xl border bg-card text-foreground shadow-2xl ${className}`}
        style={{ borderColor: 'var(--glass-border)' }}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Decorative top gradient border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500" />

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--glass-border)' }}>
            <h2 className="text-lg font-semibold font-heading text-foreground tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t bg-surface-50/50 px-6 py-4" style={{ borderColor: 'var(--glass-border)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
