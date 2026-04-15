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
    <section className={`space-y-4 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h3 className="heading-3 tracking-tight">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
};

export default Section;
