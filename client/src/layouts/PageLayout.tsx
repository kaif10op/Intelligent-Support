import type { ReactNode } from 'react';
import NavigationTabs from '../components/ui/NavigationTabs';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children: ReactNode;
  loading?: boolean;
}

const PageLayout = ({
  title,
  subtitle,
  actions,
  tabs,
  activeTab,
  onTabChange,
  children,
  loading = false,
}: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="border-b border-surface-200 bg-surface-50">
        <div className="px-6 py-6 space-y-4">
          {/* Title Section */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="heading-1 text-surface-900">{title}</h1>
              {subtitle && (
                <p className="text-surface-600 mt-1">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex-shrink-0">
                {actions}
              </div>
            )}
          </div>

          {/* Tabs */}
          {tabs && onTabChange && (
            <NavigationTabs
              tabs={tabs}
              activeTab={activeTab || tabs[0].id}
              onTabChange={onTabChange}
              className="-mx-6 px-6"
            />
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default PageLayout;
