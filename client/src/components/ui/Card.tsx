import type { ReactNode } from 'react';

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
  const baseStyles = 'rounded-lg border';
  const defaultStyles = 'bg-card border-border';
  const elevatedStyles = elevated ? 'bg-card border-border shadow-sm' : defaultStyles;
  const interactiveStyles = interactive ? 'hover:shadow-md hover:border-primary-300 transition-all cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${elevatedStyles} ${interactiveStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
