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
      className={`bg-gradient-to-r from-border/30 via-border/50 to-border/30 animate-pulse rounded ${className}`}
      style={{
        width: widthStyle,
        height: heightStyle,
        borderRadius: variant === 'circle' ? '50%' : '0.5rem'
      }}
    />
  );
};

export default Skeleton;

// Specialized skeleton components for common use cases
export const SkeletonText = ({ lines = 1, ...props }: SkeletonProps & { lines?: number }) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} variant="text" height="16px" {...props} />
    ))}
  </div>
);

export const SkeletonAvatar = (props: SkeletonProps) => (
  <Skeleton variant="circle" width="48px" height="48px" {...props} />
);

export const SkeletonCard = (props: SkeletonProps) => (
  <div className="flex flex-col gap-3 p-4">
    <Skeleton height="24px" width="60%" {...props} />
    <Skeleton height="16px" width="100%" {...props} />
    <Skeleton height="16px" width="90%" {...props} />
    <div className="mt-3">
      <Skeleton height="40px" width="100%" {...props} />
    </div>
  </div>
);
