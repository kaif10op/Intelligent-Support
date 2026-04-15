import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  status?: 'uploading' | 'processing' | 'success' | 'error';
  label?: string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status = 'uploading',
  label,
  showPercentage = true
}) => {
  const getStatusClass = () => {
    switch (status) {
      case 'success':
        return 'bg-accent-500';
      case 'error':
        return 'bg-destructive';
      case 'processing':
        return 'bg-primary-500';
      default:
        return 'bg-primary-600';
    }
  };

  const getStatusTextClass = () => {
    switch (status) {
      case 'success':
        return 'text-accent-600';
      case 'error':
        return 'text-destructive';
      case 'processing':
        return 'text-primary-500';
      default:
        return 'text-primary-600';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return 'Upload Complete';
      case 'error':
        return 'Upload Failed';
      case 'processing':
        return 'Processing...';
      default:
        return 'Uploading...';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <div className="text-sm font-medium text-foreground">{label}</div>}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded bg-surface-200 dark:bg-surface-800 border border-border/40">
          <div
            className={`h-full rounded transition-all duration-300 ${getStatusClass()}`}
            style={{
              width: `${Math.min(progress, 100)}%`,
            }}
          />
        </div>
        {showPercentage && (
          <div className="min-w-10 text-right text-xs font-medium text-muted-foreground">
            {status === 'error' ? 'Error' : `${Math.round(progress)}%`}
          </div>
        )}
      </div>
      <div className={`text-xs font-medium ${getStatusTextClass()}`}>
        {getStatusText()}
      </div>
    </div>
  );
};

export default ProgressBar;
