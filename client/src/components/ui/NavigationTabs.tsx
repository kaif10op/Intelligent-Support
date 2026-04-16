import { useState, useRef, useEffect } from 'react';
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
  fullWidth?: boolean;
}

const NavigationTabs = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  fullWidth = false,
}: NavigationTabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Find the active tab element
    const activeIndex = tabs.findIndex(t => t.id === activeTab);
    if (activeIndex === -1) return;
    
    const tabElements = containerRef.current.querySelectorAll('[role="tab"]');
    const activeElement = tabElements[activeIndex] as HTMLElement;
    
    if (activeElement) {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
        opacity: 1
      });
    }
  }, [activeTab, tabs]);

  return (
    <div
      ref={containerRef}
      className={`relative flex gap-1 overflow-x-auto rounded-2xl glass p-1.5 ${className}`}
      role="tablist"
      aria-label="Navigation tabs"
    >
      {/* Sliding Indicator */}
      <div 
        className="absolute top-1.5 bottom-1.5 rounded-xl bg-card shadow-sm border border-surface-200/50 transition-all duration-300 ease-out z-0"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity
        }}
        aria-hidden="true"
      />

      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            className={`relative flex ${fullWidth ? 'flex-1' : 'min-w-max'} items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 z-10 ${
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-surface-500 hover:text-surface-900'
            }`}
          >
            {tab.icon && (
              <span className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default NavigationTabs;
