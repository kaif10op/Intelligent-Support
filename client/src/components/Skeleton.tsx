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

  const baseStyles: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: variant === 'circle' ? '50%' : '8px',
    width: widthStyle,
    height: heightStyle,
    display: 'inline-block',
    animation: 'skeletonLoading 1.5s infinite',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  return (
    <>
      <div className={`skeleton ${className}`} style={baseStyles} />
      <style>{`
        @keyframes skeletonLoading {
          0% {
            background-color: rgba(255, 255, 255, 0.05);
          }
          50% {
            background-color: rgba(255, 255, 255, 0.1);
          }
          100% {
            background-color: rgba(255, 255, 255, 0.05);
          }
        }
      `}</style>
    </>
  );
};

export default Skeleton;

// Specialized skeleton components for common use cases
export const SkeletonText = ({ lines = 1, ...props }: SkeletonProps & { lines?: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} variant="text" height="16px" {...props} />
    ))}
  </div>
);

export const SkeletonAvatar = (props: SkeletonProps) => (
  <Skeleton variant="circle" width="48px" height="48px" {...props} />
);

export const SkeletonCard = (props: SkeletonProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
    <Skeleton height="24px" width="60%" {...props} />
    <Skeleton height="16px" width="100%" {...props} />
    <Skeleton height="16px" width="90%" {...props} />
    <div style={{ marginTop: '12px' }}>
      <Skeleton height="40px" width="100%" {...props} />
    </div>
  </div>
);
