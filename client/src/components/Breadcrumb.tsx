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
    <nav className="mb-2" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight size={16} className="text-muted-foreground/60" />}
            {index === 0 ? (
              <Link
                to={crumb.path || '/'}
                className="flex items-center text-accent hover:text-primary transition-colors"
              >
                <Home size={16} />
              </Link>
            ) : index === breadcrumbs.length - 1 ? (
              <span className="font-semibold text-foreground">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path || '/'}
                className="text-muted-foreground hover:text-primary transition-colors max-sm:hidden"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
