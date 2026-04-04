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
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-surface-200 text-surface-900 hover:bg-surface-300 focus:ring-surface-300',
    destructive: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'text-surface-700 hover:bg-surface-100 focus:ring-surface-300',
    outline: 'border border-surface-300 text-surface-900 hover:bg-surface-50 focus:ring-primary-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || loading}
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
