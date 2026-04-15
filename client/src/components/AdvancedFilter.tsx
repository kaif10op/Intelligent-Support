import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface FilterOption {
  id: string | number;
  label: string;
  count?: number;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'multiselect' | 'date-range' | 'text';
  options?: FilterOption[];
  placeholder?: string;
}

interface AdvancedFilterProps {
  filters: FilterConfig[];
  onApply: (filters: Record<string, any>) => void;
  onClear: () => void;
}

/**
 * Enterprise-grade Advanced Filter Component
 * Supports multi-select, date ranges, text search
 */
export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  filters,
  onApply,
  onClear,
}) => {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleSelectChange = (filterKey: string, value: string | number) => {
    setSelectedFilters(prev => {
      const current = prev[filterKey] || [];
      const newValue = current.includes(value)
        ? current.filter((v: any) => v !== value)
        : [...current, value];

      return {
        ...prev,
        [filterKey]: newValue.length > 0 ? newValue : undefined,
      };
    });
  };

  const handleDateChange = (filterKey: string, date: string, type: 'from' | 'to') => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterKey]: {
        ...(prev[filterKey] || {}),
        [type]: date,
      },
    }));
  };

  const handleTextChange = (filterKey: string, text: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterKey]: text || undefined,
    }));
  };

  const activeFilterCount = Object.values(selectedFilters).filter(v => v).length;

  const handleApply = () => {
    onApply(selectedFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedFilters({});
    onClear();
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/15 transition-colors"
      >
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="font-medium text-foreground">Filters</span>
        {activeFilterCount > 0 && (
          <span className="ml-2 px-2 py-1 bg-primary text-white text-xs rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Advanced Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs for filter groups */}
          <div className="flex border-b border-border overflow-x-auto">
            {filters.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === index
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {filters[index].label}
              </button>
            ))}
          </div>

          {/* Filter Content */}
          <div className="p-4">
            {filters[activeTab].type === 'multiselect' && (
              <div className="space-y-2">
                {filters[activeTab].options?.map(option => (
                  <label
                    key={option.id}
                    className="flex items-center p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedFilters[filters[activeTab].key]?.includes(
                          option.id
                        ) || false
                      }
                      onChange={() =>
                        handleSelectChange(filters[activeTab].key, option.id)
                      }
                      className="w-4 h-4 text-primary rounded"
                    />
                    <div className="ml-3 flex items-center justify-between flex-1">
                      <span className="text-sm text-foreground">{option.label}</span>
                      {option.count && (
                        <span className="text-xs text-muted-foreground bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                          {option.count}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {filters[activeTab].type === 'date-range' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={
                      selectedFilters[filters[activeTab].key]?.from || ''
                    }
                    onChange={e =>
                      handleDateChange(filters[activeTab].key, e.target.value, 'from')
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={
                      selectedFilters[filters[activeTab].key]?.to || ''
                    }
                    onChange={e =>
                      handleDateChange(filters[activeTab].key, e.target.value, 'to')
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
              </div>
            )}

            {filters[activeTab].type === 'text' && (
              <input
                type="text"
                placeholder={filters[activeTab].placeholder || 'Search...'}
                value={selectedFilters[filters[activeTab].key] || ''}
                onChange={e =>
                  handleTextChange(filters[activeTab].key, e.target.value)
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/40 outline-none"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 p-4 border-t border-border">
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-2 text-foreground bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 text-white bg-primary hover:bg-primary-700 rounded-lg font-medium transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilter;
