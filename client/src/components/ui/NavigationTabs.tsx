import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface NavigationTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const NavigationTabs = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: NavigationTabsProps) => {
  return (
    <div
      className={`flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 ${className}`}
      role="tablist"
      aria-label="Navigation tabs"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`flex min-w-max items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            activeTab === tab.id
              ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/35'
              : 'text-muted-foreground hover:bg-surface-100 hover:text-foreground'
          }`}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default NavigationTabs;
