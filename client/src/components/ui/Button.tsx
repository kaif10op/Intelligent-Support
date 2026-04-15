import type { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
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
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.99]';

  const variantStyles = {
    primary: 'bg-primary-500 text-white shadow-sm shadow-primary-500/30 hover:bg-primary-600 hover:shadow-md hover:shadow-primary-500/35 focus-visible:ring-primary-500',
    secondary: 'bg-card text-foreground border border-border shadow-sm hover:bg-surface-100 hover:border-surface-300 focus-visible:ring-surface-400',
    destructive: 'bg-rose-500 text-white shadow-sm shadow-rose-500/25 hover:bg-rose-600 hover:shadow-md hover:shadow-rose-500/35 focus-visible:ring-rose-500',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-surface-100 focus-visible:ring-surface-400',
    outline: 'border border-border bg-transparent text-foreground hover:bg-surface-100 hover:border-surface-300 focus-visible:ring-primary-500',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...props}
    >
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
    </button>
  );
};

export default Button;
