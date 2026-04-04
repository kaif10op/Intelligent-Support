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
    <div className={`flex gap-2 border-b border-surface-200 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors text-sm font-medium ${
            activeTab === tab.id
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-surface-600 hover:text-surface-900'
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
