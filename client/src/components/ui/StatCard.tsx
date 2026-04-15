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
  return (
    <Card elevated className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
            {trend && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                  trend.direction === 'up'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                }`}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
