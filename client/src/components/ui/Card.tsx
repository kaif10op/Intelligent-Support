import type { KeyboardEvent, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

const Card = ({
  children,
  className = '',
  elevated = false,
  interactive = false,
  onClick,
}: CardProps) => {
  const baseStyles = 'rounded-2xl border border-border bg-card text-foreground';
  const elevatedStyles = elevated ? 'shadow-sm shadow-slate-900/5 dark:shadow-black/20' : '';
  const interactiveStyles = interactive
    ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/10 dark:hover:shadow-black/30 hover:border-primary-300/60 transition-all duration-200'
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
      className={`${baseStyles} ${elevatedStyles} ${interactiveStyles} ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default Card;
