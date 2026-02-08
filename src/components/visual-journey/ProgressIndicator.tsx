import React from 'react';

interface ProgressIndicatorProps {
  progress: number;  // 0-100 percentage
  showLabel?: boolean;
  showPercentage?: boolean;
  color?: string;
  height?: number;
  label?: string;
  className?: string;
  indeterminate?: boolean;
  isPulsing?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  showLabel = false,
  showPercentage = true,
  color = 'bg-blue-600',
  height = 4,
  label = 'Loading...',
  className = '',
  indeterminate = false,
  isPulsing = false
}) => {
  // Ensure progress is clamped to 0-100
  const safeProgress = Math.min(100, Math.max(0, progress));

  // CSS for indeterminate animation
  const indeterminateStyle = {
    width: '30%',
    animation: 'indeterminateAnim 1.5s ease-in-out infinite'
  };

  // CSS for determinate progress
  const determinateStyle = {
    width: `${safeProgress}%`,
    transition: 'width 0.3s ease-in-out'
  };

  // Add keyframes for indeterminate animation
  React.useEffect(() => {
    if (typeof document !== 'undefined' && indeterminate) {
      const styleElement = document.getElementById('progress-indicator-style');
      if (!styleElement) {
        const style = document.createElement('style');
        style.id = 'progress-indicator-style';
        style.textContent = `
          @keyframes indeterminateAnim {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [indeterminate]);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">{label}</span>
          {showPercentage && !indeterminate && (
            <span className="text-xs font-medium text-gray-700">
              {Math.round(safeProgress)}%
            </span>
          )}
        </div>
      )}
      
      <div className="relative w-full bg-gray-200 rounded-full overflow-hidden" style={{ height: `${height}px` }}>
        <div 
          className={`absolute top-0 left-0 h-full ${color} ${isPulsing ? 'animate-pulse' : ''}`}
          style={indeterminate ? indeterminateStyle : determinateStyle} 
        />
      </div>
      
      {!showLabel && showPercentage && !indeterminate && (
        <div className="mt-1 text-center">
          <span className="text-xs text-gray-500">
            {Math.round(safeProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;