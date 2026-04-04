import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
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
  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`bg-white rounded-lg shadow-lg ${sizeStyles[size]} w-full mx-4 overflow-hidden ${className}`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
            <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-surface-400 hover:text-surface-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-surface-200 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
