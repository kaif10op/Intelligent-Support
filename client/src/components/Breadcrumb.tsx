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

  // Auto-generate breadcrumbs from URL if not provided
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (items.length > 0) return items;

    const segments = location.pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ label: 'Dashboard', path: '/' }];

    segments.forEach((segment, index) => {
      const path = '/' + segments.slice(0, index + 1).join('/');
      const label = segment
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      crumbs.push({ label, path });
    });

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="breadcrumb-nav" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="breadcrumb-item">
            {index === 0 ? (
              <Link to={crumb.path || '/'} className="breadcrumb-link home">
                <Home size={16} />
              </Link>
            ) : index === breadcrumbs.length - 1 ? (
              <span className="breadcrumb-current">{crumb.label}</span>
            ) : (
              <>
                <Link to={crumb.path || '/'} className="breadcrumb-link">
                  {crumb.label}
                </Link>
                <ChevronRight size={16} className="breadcrumb-separator" />
              </>
            )}
            {index < breadcrumbs.length - 1 && index > 0 && (
              <ChevronRight size={16} className="breadcrumb-separator" />
            )}
          </li>
        ))}
      </ol>

      <style>{`
        .breadcrumb-nav {
          margin-bottom: 24px;
        }

        .breadcrumb-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .breadcrumb-link, .breadcrumb-current {
          font-size: 0.9rem;
          transition: 0.2s;
        }

        .breadcrumb-link {
          color: var(--text-muted);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .breadcrumb-link:hover {
          color: var(--accent-primary);
        }

        .breadcrumb-link.home {
          color: var(--accent-secondary);
        }

        .breadcrumb-link.home:hover {
          color: var(--accent-primary);
        }

        .breadcrumb-current {
          color: #fff;
          font-weight: 600;
        }

        .breadcrumb-separator {
          color: var(--text-muted);
          opacity: 0.5;
        }

        @media (max-width: 640px) {
          .breadcrumb-link {
            display: none;
          }

          .breadcrumb-list {
            gap: 0;
          }

          .breadcrumb-item:not(:last-child) {
            display: none;
          }

          .breadcrumb-current {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default Breadcrumb;
