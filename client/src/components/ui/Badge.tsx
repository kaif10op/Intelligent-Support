import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'glass';
  icon?: ReactNode;
  className?: string;
  dot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Badge = ({
  children,
  variant = 'default',
  icon,
  className = '',
  dot = false,
  size
}: BadgeProps) => {
  const variantStyles = {
    default: 'bg-surface-100 text-surface-700 border-surface-200/50',
    success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    error: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
    info: 'bg-primary-500/10 text-primary-600 border-primary-500/20 dark:text-primary-400',
    glass: 'bg-white/10 dark:bg-white/5 backdrop-blur-md text-foreground border-white/20',
  };

  const dotColors = {
    default: 'bg-surface-400',
    success: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse-slow',
    warning: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse-slow',
    error: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse-slow',
    info: 'bg-primary-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse-slow',
    glass: 'bg-white',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'} font-semibold tracking-wide uppercase border ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColors[variant]}`} />
      )}
      {icon && <span className="flex-shrink-0 opacity-80">{icon}</span>}
      <span className="mt-[1px]">{children}</span>
    </div>
  );
};

export default Badge;
