import React from 'react';
import { motion } from 'framer-motion';

interface MockupProgressBarProps {
  progress: number;
  width?: string;
  height?: string;
  bgColor?: string;
  fillColor?: string;
  radius?: string;
  showPercentage?: boolean;
  textColor?: string;
  className?: string;
  label?: string;
}

const MockupProgressBar: React.FC<MockupProgressBarProps> = ({
  progress,
  width = '100%',
  height = '12px',
  bgColor = '#f1f5f9',
  fillColor = '#3b82f6',
  radius = '6px',
  showPercentage = false,
  textColor = '#1e293b',
  className = '',
  label
}) => {
  // Ensure progress is between 0 and 100
  const safeProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={`progress-bar-container ${className}`} style={{ width }}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium" style={{ color: textColor }}>{label}</span>
          {showPercentage && (
            <span className="text-xs" style={{ color: textColor }}>{safeProgress}%</span>
          )}
        </div>
      )}
      
      <div 
        className="progress-bar-bg"
        style={{ 
          height, 
          backgroundColor: bgColor, 
          borderRadius: radius,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <motion.div
          className="progress-bar-fill"
          style={{ 
            height: '100%', 
            backgroundColor: fillColor,
            borderRadius: radius,
            transformOrigin: 'left center'
          }}
          initial={{ width: 0 }}
          animate={{ width: `${safeProgress}%` }}
          transition={{ 
            type: 'spring',
            stiffness: 50,
            damping: 10
          }}
        />
        
        {/* Shimmer effect */}
        <motion.div
          className="progress-bar-shimmer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            zIndex: 10,
            overflow: 'hidden',
            borderRadius: radius
          }}
          animate={{
            x: ['0%', '100%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {!label && showPercentage && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#ffffff',
              textShadow: '0 0 2px rgba(0,0,0,0.5)'
            }}
          >
            {safeProgress}%
          </div>
        )}
      </div>
    </div>
  );
};

export default MockupProgressBar;