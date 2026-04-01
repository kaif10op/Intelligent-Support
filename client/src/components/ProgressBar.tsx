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
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#4ade80';
      case 'error':
        return '#ff6464';
      case 'processing':
        return '#00d2ff';
      default:
        return '#8a2be2';
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
    <div className="progress-bar-container">
      {label && <div className="progress-label">{label}</div>}
      <div className="progress-bar-wrapper">
        <div className="progress-bar-background">
          <div
            className="progress-bar-fill"
            style={{
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: getStatusColor(),
              transition: 'width 0.3s ease'
            }}
          />
        </div>
        {showPercentage && (
          <div className="progress-text">
            {status === 'error' ? 'Error' : `${Math.round(progress)}%`}
          </div>
        )}
      </div>
      <div className="progress-status" style={{ color: getStatusColor() }}>
        {getStatusText()}
      </div>

      <style>{`
        .progress-bar-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .progress-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #fff;
        }

        .progress-bar-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar-background {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
          box-shadow: 0 0 8px currentColor;
        }

        .progress-text {
          min-width: 40px;
          text-align: right;
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .progress-status {
          font-size: 0.85rem;
          font-weight: 500;
          transition: color 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;
