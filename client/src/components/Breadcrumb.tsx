import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

const Breadcrumb = ({ items = [] }: BreadcrumbProps) => {
  const location = useLocation();

  const formatLabel = (segment: string): string => {
    const isIdLike = /^[a-f0-9-]{8,}$/i.test(segment) || /^\d+$/.test(segment);
    if (isIdLike) return 'Details';

    return segment
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Auto-generate breadcrumbs from URL if not provided
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (items.length > 0) return items;

    const segments = location.pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ label: 'Dashboard', path: '/' }];

    segments.forEach((segment, index) => {
      const path = '/' + segments.slice(0, index + 1).join('/');
      const label = formatLabel(segment);

      crumbs.push({ label, path });
    });

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="inline-flex">
      <ol className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-card/60 backdrop-blur-sm shadow-sm" style={{ borderColor: 'var(--glass-border)' }}>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;
          return (
            <li key={index} className="flex items-center gap-1.5 text-[13px]">
              {!isFirst && <ChevronRight size={14} className="text-surface-400 flex-shrink-0" />}
              {isFirst ? (
                <Link
                  to={crumb.path || '/'}
                  className="flex items-center justify-center p-1 rounded-md text-surface-500 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                >
                  <Home size={14} />
                </Link>
              ) : isLast ? (
                <span className="font-semibold text-foreground px-1">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path || '/'}
                  className="text-surface-500 hover:text-primary-500 transition-colors px-1 max-sm:hidden"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
