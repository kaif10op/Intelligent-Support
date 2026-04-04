import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  icon?: ReactNode;
  className?: string;
}

const Badge = ({
  children,
  variant = 'default',
  icon,
  className = '',
}: BadgeProps) => {
  const variantStyles = {
    default: 'bg-surface-100 text-surface-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </div>
  );
};

export default Badge;
