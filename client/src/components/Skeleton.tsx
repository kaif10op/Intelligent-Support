import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height = '20px',
  className = ''
}) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`shimmer bg-surface-100 dark:bg-surface-200/50 ${className}`}
      style={{
        width: widthStyle,
        height: heightStyle,
        borderRadius: variant === 'circle' ? '50%' : '0.75rem'
      }}
    />
  );
};

export default Skeleton;

// Specialized skeleton components for common use cases
export const SkeletonText = ({ lines = 1, ...props }: SkeletonProps & { lines?: number }) => (
  <div className="flex flex-col gap-2.5 w-full">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} variant="text" height="16px" width={i === lines - 1 && lines > 1 ? '70%' : '100%'} {...props} />
    ))}
  </div>
);

export const SkeletonAvatar = (props: SkeletonProps) => (
  <Skeleton variant="circle" width="48px" height="48px" {...props} />
);

export const SkeletonCard = (props: SkeletonProps) => (
  <div className="flex flex-col gap-4 p-5 glass border border-border/50">
    <Skeleton height="24px" width="60%" {...props} />
    <SkeletonText lines={2} {...props} />
    <div className="mt-4 pt-4 border-t border-border/30">
      <Skeleton height="44px" width="100%" className="rounded-xl" {...props} />
    </div>
  </div>
);
