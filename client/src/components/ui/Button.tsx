import type { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  disabled = false,
  className = '',
  children,
  ...props
}: ButtonProps) => {
  const baseStyles = 'relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98] overflow-hidden group';

  const variantStyles = {
    primary: 'text-white shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] focus-visible:ring-primary-500 border border-primary-400/50 hover:-translate-y-[1px]',
    secondary: 'bg-surface-100 text-surface-900 border border-border shadow-sm hover:bg-surface-200 hover:border-surface-300 focus-visible:ring-surface-400',
    destructive: 'bg-rose-500 text-white shadow-sm shadow-rose-500/25 hover:bg-rose-600 hover:shadow-md hover:shadow-rose-500/35 focus-visible:ring-rose-500',
    ghost: 'text-surface-600 hover:text-surface-900 hover:bg-surface-100 focus-visible:ring-surface-400',
    outline: 'border border-border bg-transparent text-foreground hover:bg-surface-50 hover:border-surface-300 focus-visible:ring-primary-500',
    glass: 'bg-white/10 dark:bg-white/5 backdrop-blur-md text-foreground border border-white/20 hover:bg-white/20 dark:hover:bg-white/10 focus-visible:ring-primary-500 shadow-sm',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const isPrimary = variant === 'primary';

  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {/* Gradient Background for Primary */}
      {isPrimary && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-500 transition-all duration-300 group-hover:scale-[1.02]" />
      )}
      
      {/* Shimmer Effect for Primary */}
      {isPrimary && !disabled && !loading && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
      )}

      {/* Content wrapper to stay above backgrounds */}
      <div className="relative flex items-center justify-center gap-2 z-10 w-full">
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </div>
    </button>
  );
};

export default Button;
