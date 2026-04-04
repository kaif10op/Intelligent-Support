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
    <Card elevated className={`p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-surface-600 font-medium mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-surface-900">{value}</p>
            {trend && (
              <span
                className={`text-xs font-medium ${
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className="text-surface-300 flex-shrink-0 ml-4">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
