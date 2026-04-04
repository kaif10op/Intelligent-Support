import type { ReactNode } from 'react';

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const Section = ({
  title,
  subtitle,
  children,
  actions,
  className = '',
}: SectionProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between">
          <div>
            {title && <h3 className="heading-3">{title}</h3>}
            {subtitle && <p className="text-sm text-surface-600 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Section;
