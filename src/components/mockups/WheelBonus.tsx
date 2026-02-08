import React from 'react';

interface WheelBonusProps {
  segments: number;
  maxMultiplier: number;
  segmentValues?: number[];
  bet: number;
  onComplete: (prize: number) => void;
  levelUp?: boolean;
  respin?: boolean;
  theme?: {
    primary: string;
    secondary: string;
  };
  announcementImage?: string;
}

interface WheelSegment {
  value: number;
  type: 'prize' | 'levelup' | 'respin';
  color: string;
  label: string;
}

const WheelBonus: React.FC<WheelBonusProps> = ({ 
  segments, 
  maxMultiplier, 
  segmentValues = [],
  bet, 
  onComplete, 
  levelUp = false,
  announcementImage, 
  respin = false,
  theme = { primary: '#FFD700', secondary: '#FF6B35' }
}) => {
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [rotation, setRotation] = React.useState(0);
  const [wonPrize, setWonPrize] = React.useState<number | null>(null);
  const [currentLevel, setCurrentLevel] = React.useState(1);
  const [canSkip, setCanSkip] = React.useState(false);
  const [showAnnouncement, setShowAnnouncement] = React.useState(true);
  const [showResult, setShowResult] = React.useState(false);

  // Generate segments with user-defined or weighted prize distribution
  const wheelSegments = React.useMemo((): WheelSegment[] => {
    const segmentsArray: WheelSegment[] = [];
    const totalSegments = segments;
    let remainingSegments = totalSegments;
    
    // Define color palette with better contrast
    const colors = [
      '#EF5350', '#42A5F5', '#66BB6A', '#FFA726', 
      '#8D6E63', '#26A69A', '#EC407A', '#7E57C2',
      '#5C6BC0', '#FFB74D', '#9CCC65', '#4DD0E1',
      '#AB47BC', '#FF7043', '#78909C', '#8BC34A'
    ];

    // Add special segments if enabled
    if (levelUp && remainingSegments > 2) {
      segmentsArray.push({
        value: 0,
        type: 'levelup',
        color: '#FFD700',
        label: 'LEVEL UP'
      });
      remainingSegments--;
    }

    if (respin && remainingSegments > 2) {
      segmentsArray.push({
        value: 0,
        type: 'respin',
        color: '#D1C4E9',
        label: 'RESPIN'
      });
      remainingSegments--;
    }

    // Use maxMultiplier for all segments if no custom values provided
    for (let i = 0; i < remainingSegments; i++) {
      const value = (segmentValues && segmentValues[i]) ? segmentValues[i] : maxMultiplier;
      segmentsArray.push({
        value,
        type: 'prize',
        color: colors[i % colors.length],
        label: `${value}x`
      });
    }

    return segmentsArray;
  }, [segments, maxMultiplier, segmentValues, levelUp, respin]);

  const spinWheel = React.useCallback(() => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setCanSkip(true);
    setWonPrize(null);
    
    // Generate random spin: 5-8 full rotations + random angle
    const fullRotations = 5 + Math.random() * 3;
    const randomAngle = Math.random() * 360;
    const targetRotation = 360 * fullRotations + randomAngle;
    
    setRotation(prev => prev + targetRotation);
    
    // Enable skip after 1 second
    setTimeout(() => {
      setCanSkip(false);
    }, 1000);
    
    setTimeout(() => {
      // Calculate which segment the pointer (at top) is pointing to
      const degreesPerSegment = 360 / wheelSegments.length;
      const finalRotation = (rotation + targetRotation) % 360;
      
      // Pointer is at top (270 degrees in our coordinate system)
      // Calculate which segment is under the pointer
      const pointerAngle = 270;
      const segmentAtPointer = Math.floor(((pointerAngle - finalRotation + 360) % 360) / degreesPerSegment) % wheelSegments.length;
      
      const selectedSegment = wheelSegments[segmentAtPointer];
      let prize = 0;
      
      // Handle different segment types
      if (selectedSegment.type === 'levelup') {
        setCurrentLevel(prev => prev + 1);
        prize = 0; // Level up doesn't give immediate prize
      } else if (selectedSegment.type === 'respin') {
        // Respin logic - could trigger another spin
        prize = 0;
      } else {
        prize = selectedSegment.value * bet;
      }
      
      setWonPrize(prize);
      setIsSpinning(false);
      setShowResult(true);
      
      // Don't auto-close, wait for user click
    }, 3000);
  }, [isSpinning, wheelSegments, bet, rotation, onComplete]);

  // Keyboard accessibility
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isSpinning && !wonPrize) {
        spinWheel();
      }
    }
  }, [isSpinning, wonPrize, spinWheel]);

  // Skip animation function
  const skipAnimation = React.useCallback(() => {
    if (!canSkip || !isSpinning) return;
    
    // Immediately complete the spin
    const degreesPerSegment = 360 / wheelSegments.length;
    const finalRotation = rotation % 360;
    const pointerAngle = 270;
    const segmentAtPointer = Math.floor(((pointerAngle - finalRotation + 360) % 360) / degreesPerSegment) % wheelSegments.length;
    
    const selectedSegment = wheelSegments[segmentAtPointer];
    let prize = 0;
    
    if (selectedSegment.type === 'levelup') {
      setCurrentLevel(prev => prev + 1);
    } else if (selectedSegment.type === 'respin') {
      // Respin logic
    } else {
      prize = selectedSegment.value * bet;
    }
    
    setWonPrize(prize);
    setIsSpinning(false);
    setCanSkip(false);
    setShowResult(true);
    
    // Don't auto-close, wait for user click
  }, [canSkip, isSpinning, wheelSegments, rotation, bet, onComplete]);

  // Handle click to close result
  const handleResultClick = React.useCallback(() => {
    if (showResult && wonPrize !== null) {
      onComplete(wonPrize);
    }
  }, [showResult, wonPrize, onComplete]);

  return (
    <>
      {/* Announcement Modal */}
      {showAnnouncement && announcementImage && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn">
          <div 
            className="relative max-w-[600px] w-4/5 cursor-pointer"
            onClick={() => setShowAnnouncement(false)}
          >
            <img
              src={announcementImage}
              alt="Wheel Bonus Announcement"
              className="w-full h-auto rounded-lg shadow-2xl animate-pulse"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-sm mt-64 opacity-75">Click to continue</p>
            </div>
          </div>
        </div>
      )}

      <div 
        className="flex flex-col items-center justify-center gap-4 p-4 max-w-lg mx-auto"
        role="dialog"
        aria-labelledby="wheel-title"
        aria-describedby="wheel-instructions"
      >
      <div className="text-center">
        <h2 id="wheel-title" className="text-2xl font-bold text-yellow-400 mb-1">
          WHEEL BONUS!
        </h2>
        {currentLevel > 1 && (
          <p className="text-base text-yellow-300">Level {currentLevel}</p>
        )}
        <p id="wheel-instructions" className="text-xs text-gray-300 mt-1">
          Click the button or press Enter/Space to spin the wheel
        </p>
      </div>
      
      <div className="relative w-64 h-64 md:w-72 md:h-72">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-2xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
          }}
          role="img"
          aria-label="Prize wheel with segments"
        >
          {wheelSegments.map((segment, i) => {
            const angle = (360 / wheelSegments.length) * i;
            const nextAngle = (360 / wheelSegments.length) * (i + 1);
            const startRad = (angle * Math.PI) / 180;
            const endRad = (nextAngle * Math.PI) / 180;
            
            const x1 = 100 + 90 * Math.cos(startRad);
            const y1 = 100 + 90 * Math.sin(startRad);
            const x2 = 100 + 90 * Math.cos(endRad);
            const y2 = 100 + 90 * Math.sin(endRad);
            
            return (
              <g key={i}>
                <path
                  d={`M 100 100 L ${x1} ${y1} A 90 90 0 0 1 ${x2} ${y2} Z`}
                  fill={segment.color}
                  stroke="#fff"
                  strokeWidth="2"
                  className="hover:brightness-110 transition-all duration-200"
                />
                <text
                  x={100 + 60 * Math.cos((startRad + endRad) / 2)}
                  y={100 + 60 * Math.sin((startRad + endRad) / 2)}
                  fill="#fff"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="drop-shadow-lg"
                >
                  {segment.label}
                </text>
              </g>
            );
          })}
          <circle 
            cx="100" 
            cy="100" 
            r="20" 
            fill={theme.primary} 
            stroke="#fff" 
            strokeWidth="3"
            className="drop-shadow-lg"
          />
        </svg>
        
        {/* Enhanced pointer with better visibility */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 z-10">
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-red-600 drop-shadow-lg" />
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-t-[23px] border-t-red-500" />
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {!isSpinning && !wonPrize && (
          <button
            onClick={spinWheel}
            onKeyDown={handleKeyDown}
            className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-lg text-lg hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:ring-opacity-50"
            aria-label="Spin the wheel to win prizes"
          >
            SPIN THE WHEEL!
          </button>
        )}

        {isSpinning && canSkip && (
          <button
            onClick={skipAnimation}
            className="px-4 py-1.5 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50 text-sm"
            aria-label="Skip animation"
          >
            Skip Animation
          </button>
        )}
      </div>

      {/* Results display with click to close */}
      {showResult && wonPrize !== null && (
        <div 
          className="text-center animate-bounce cursor-pointer hover:scale-105 transition-transform"
          onClick={handleResultClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleResultClick();
            }
          }}
          aria-label="Click to close and collect prize"
        >
          <p className="text-xl font-bold text-green-400 mb-1">YOU WON!</p>
          <p className="text-3xl font-bold text-yellow-400">${wonPrize.toFixed(2)}</p>
          {currentLevel > 1 && (
            <p className="text-base text-yellow-300 mt-1">Level {currentLevel} Bonus!</p>
          )}
          <p className="text-sm text-gray-300 mt-2 opacity-75">Click anywhere to collect prize</p>
        </div>
      )}

      {/* Accessibility instructions */}
      <div className="text-xs text-gray-400 text-center max-w-sm">
        <p>Use keyboard: Enter or Space to spin</p>
        <p>Screen reader users: Each segment is announced as the wheel spins</p>
      </div>
    </div>
    </>
  );
};

export default WheelBonus;
