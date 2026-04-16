import type { KeyboardEvent, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  interactive?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

const Card = ({
  children,
  className = '',
  elevated = false,
  interactive = false,
  gradient = false,
  onClick,
}: CardProps) => {
  // Using the new design system classes defined in index.css
  let baseStyles = 'glass overflow-hidden relative text-foreground transition-all duration-300';
  
  if (elevated) {
    baseStyles = 'glass-elevated overflow-hidden relative text-foreground transition-all duration-300';
  }
  
  if (gradient) {
    baseStyles = 'rounded-2xl border text-white overflow-hidden relative transition-all duration-300 bg-gradient-to-br from-primary-600 to-accent-600 border-white/20 shadow-[0_8px_30px_rgba(99,102,241,0.25)]';
  }

  const interactiveStyles = interactive
    ? `${gradient ? 'hover:shadow-[0_12px_40px_rgba(99,102,241,0.4)]' : 'card-interactive'} cursor-pointer`
    : '';

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`${baseStyles} ${interactiveStyles} ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {/* Subtle decorative mesh for gradient cards */}
      {gradient && (
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" 
             style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, white 0%, transparent 50%), radial-gradient(circle at 0% 100%, white 0%, transparent 50%)' }} />
      )}
      
      {/* Content wrapper */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default Card;
