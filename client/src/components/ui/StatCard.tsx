import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import Card from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    direction: 'up' | 'down';
    value: number;
  };
  className?: string;
}

const StatCard = ({
  label,
  value,
  icon,
  trend,
  className = '',
}: StatCardProps) => {
  // Simple animation effect for numbers on mount
  const [displayValue, setDisplayValue] = useState<string | number>('-');
  
  useEffect(() => {
    // Only animate if it's a number
    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
      const numValue = Number(value);
      const duration = 1000; // 1s
      const steps = 20;
      const stepTime = duration / steps;
      let currentStep = 0;
      
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          // Easing easeOutQuart
          const progress = 1 - Math.pow(1 - currentStep / steps, 4);
          setDisplayValue(Math.floor(numValue * progress));
        }
      }, stepTime);
      
      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <Card elevated className={`p-6 group ${className}`}>
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-surface-900 dark:text-white transform scale-150 -translate-y-1/4 translate-x-1/4 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
        {icon}
      </div>
      
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-surface-500 mb-2">{label}</p>
          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-bold font-heading text-foreground tracking-tight">{displayValue}</p>
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide ${
                  trend.direction === 'up'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20 text-primary-500 shadow-inner">
            {icon}
          </div>
        )}
      </div>
      
      {/* Decorative gradient line */}
      <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  );
};

export default StatCard;
