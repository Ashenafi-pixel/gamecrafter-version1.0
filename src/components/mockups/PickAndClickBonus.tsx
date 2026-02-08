import React from 'react';
import { Target, Plus, X } from 'lucide-react';

interface PickAndClickBonusProps {
  gridSize: [number, number];
  picks: number;
  maxPrize: number;
  prizeValues?: number[];
  bet: number;
  onComplete: (prize: number) => void;
  extraPicks?: boolean;
  multipliers?: boolean;
  theme?: {
    primary: string;
    secondary: string;
  };
  announcementImage?: string;
}

interface GridCell {
  type: 'prize' | 'extraPick' | 'multiplier';
  value: number | number[];
  revealed: boolean;
  color: string;
}

const PickAndClickBonus: React.FC<PickAndClickBonusProps> = ({
  gridSize,
  picks,
  maxPrize,
  prizeValues = [],
  bet,
  onComplete,
  extraPicks = false,
  multipliers = false,
  theme = { primary: '#FFD700', secondary: '#FF6B35' },
  announcementImage
}) => {
  const [grid, setGrid] = React.useState<GridCell[][]>([]);
  const [remainingPicks, setRemainingPicks] = React.useState(picks);
  const [totalWinnings, setTotalWinnings] = React.useState(0);
  const [currentMultiplier, setCurrentMultiplier] = React.useState(1);
  const [gameComplete, setGameComplete] = React.useState(false);
  const [selectedCells, setSelectedCells] = React.useState<{ row: number; col: number }[]>([]);
  const [showResult, setShowResult] = React.useState(false);
  const [showAnnouncement, setShowAnnouncement] = React.useState(true);

  // Generate grid with user-defined or weighted prize distribution
  const generateGrid = React.useCallback((): GridCell[][] => {
    const [rows, cols] = gridSize;
    const totalCells = rows * cols;
    const cells: GridCell[] = [];

    // Define color palette
    const colors = [
      '#EF5350', '#42A5F5', '#66BB6A', '#FFA726',
      '#8D6E63', '#26A69A', '#EC407A', '#7E57C2',
      '#5C6BC0', '#FFB74D', '#9CCC65', '#4DD0E1'
    ];

    // Use maxPrize for all cells if no custom values provided
    for (let i = 0; i < totalCells; i++) {
      const value = (prizeValues && prizeValues[i]) ? prizeValues[i] : maxPrize;
      cells.push({
        type: 'prize',
        value,
        revealed: false,
        color: colors[i % colors.length]
      });
    }

    // Shuffle cells for random placement
    const shuffledCells = cells.sort(() => Math.random() - 0.5);

    // Add special cells if enabled
    if (extraPicks && shuffledCells.length > 2) {
      const extraPickIndex = Math.floor(Math.random() * shuffledCells.length);
      shuffledCells[extraPickIndex] = {
        type: 'extraPick',
        value: 0,
        revealed: false,
        color: '#66BB6A'
      };
    }

    if (multipliers && shuffledCells.length > 2) {
      const multiplierIndex = Math.floor(Math.random() * shuffledCells.length);
      if (multiplierIndex !== shuffledCells.findIndex(c => c.type === 'extraPick')) {
        const multiplierValue = [2, 3, 5][Math.floor(Math.random() * 3)];
        shuffledCells[multiplierIndex] = {
          type: 'multiplier',
          value: multiplierValue,
          revealed: false,
          color: '#FFA726'
        };
      }
    }

    const finalCells = shuffledCells;
    const gridArray: GridCell[][] = [];
    
    for (let r = 0; r < rows; r++) {
      gridArray[r] = [];
      for (let c = 0; c < cols; c++) {
        const cellIndex = r * cols + c;
        gridArray[r][c] = finalCells[cellIndex] || {
          type: 'prize',
          value: 1,
          revealed: false,
          color: colors[cellIndex % colors.length]
        };
      }
    }

    return gridArray;
  }, [gridSize, maxPrize, prizeValues, extraPicks, multipliers]);

  // Initialize grid on component mount
  React.useEffect(() => {
    setGrid(generateGrid());
  }, [generateGrid]);

  // Handle cell click
  const handleCellClick = React.useCallback((row: number, col: number) => {
    if (remainingPicks <= 0 || gameComplete) return;
    if (grid[row][col].revealed) return;

    const newGrid = [...grid];
    newGrid[row][col].revealed = true;
    setGrid(newGrid);

    const cell = newGrid[row][col];
    let winnings = 0;

    // Handle different cell types
    switch (cell.type) {
      case 'prize':
        winnings = (cell.value as number) * bet * currentMultiplier;
        setTotalWinnings(prev => prev + winnings);
        break;
      case 'extraPick':
        setRemainingPicks(prev => prev + 1);
        break;
      case 'multiplier':
        setCurrentMultiplier(prev => prev * (cell.value as number));
        break;
    }

    setRemainingPicks(prev => prev - 1);
    setSelectedCells(prev => [...prev, { row, col }]);

    // Check if game is complete
    if (remainingPicks - 1 <= 0) {
      setTimeout(() => {
        setGameComplete(true);
        setShowResult(true);
        // Don't auto-close, wait for user click
      }, 1000);
    }
  }, [grid, remainingPicks, gameComplete, bet, currentMultiplier, totalWinnings, onComplete]);

  // Keyboard accessibility
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent, row: number, col: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCellClick(row, col);
    }
  }, [handleCellClick]);

  // Handle click to close result
  const handleResultClick = React.useCallback(() => {
    if (showResult && gameComplete) {
      onComplete(totalWinnings);
    }
  }, [showResult, gameComplete, totalWinnings, onComplete]);

  // Reset game
  const resetGame = React.useCallback(() => {
    setGrid(generateGrid());
    setRemainingPicks(picks);
    setTotalWinnings(0);
    setCurrentMultiplier(1);
    setGameComplete(false);
    setSelectedCells([]);
    setShowResult(false);
  }, [generateGrid, picks]);

  const [rows, cols] = gridSize;

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
              alt="Pick & Click Announcement"
              className="w-full h-auto rounded-lg shadow-2xl animate-pulse"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-sm mt-64 opacity-75">Click to continue</p>
            </div>
          </div>
        </div>
      )}

      <div 
      className="flex flex-col items-center justify-center gap-4 p-4 max-w-2xl mx-auto"
      role="dialog"
      aria-labelledby="pick-title"
      aria-describedby="pick-instructions"
    >
      <div className="text-center">
        <h2 id="pick-title" className="text-2xl font-bold text-yellow-400 mb-1">
          PICK & CLICK BONUS!
        </h2>
        <p id="pick-instructions" className="text-xs text-gray-300 mt-1">
          Click on cells to reveal prizes. You have {remainingPicks} picks remaining.
        </p>
      </div>

      {/* Game Stats */}
      <div className="flex gap-4 text-sm">
        <div className="bg-gray-800 px-3 py-1 rounded">
          <span className="text-yellow-400">Picks: </span>
          <span className="text-white">{remainingPicks}</span>
        </div>
        <div className="bg-gray-800 px-3 py-1 rounded">
          <span className="text-green-400">Total: </span>
          <span className="text-white">${totalWinnings.toFixed(2)}</span>
        </div>
        {currentMultiplier > 1 && (
          <div className="bg-gray-800 px-3 py-1 rounded">
            <span className="text-orange-400">Multiplier: </span>
            <span className="text-white">{currentMultiplier}x</span>
          </div>
        )}
      </div>

      {/* Game Grid */}
      <div 
        className="grid gap-2 p-4 bg-gray-900 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
        role="grid"
        aria-label="Pick and click bonus grid"
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
              disabled={remainingPicks <= 0 || gameComplete || cell.revealed}
              className={`
                w-16 h-16 rounded-lg border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:ring-opacity-50
                ${cell.revealed
                  ? 'opacity-100 cursor-default'
                  : 'opacity-80 hover:opacity-100 hover:scale-105 cursor-pointer'
                }
                ${remainingPicks <= 0 || gameComplete ? 'cursor-not-allowed opacity-50' : ''}
              `}
              style={{
                backgroundColor: cell.revealed ? cell.color : '#2D3748',
                borderColor: cell.revealed ? '#FFFFFF' : '#4A5568'
              }}
              aria-label={`Cell ${rowIndex + 1}, ${colIndex + 1}. ${cell.revealed ? `Revealed: ${cell.type} ${cell.value}` : 'Hidden prize'}`}
            >
              {cell.revealed ? (
                <div className="flex flex-col items-center justify-center text-white text-xs font-bold">
                  {cell.type === 'extraPick' ? (
                    <Plus className="w-4 h-4" />
                  ) : cell.type === 'multiplier' ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <span>{cell.value}x</span>
                  )}
                  <span className="text-xs mt-1">
                    {cell.type === 'extraPick' ? 'EXTRA' : 
                     cell.type === 'multiplier' ? 'MULT' : 'PRIZE'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-400">
                  <Target className="w-6 h-6" />
                </div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Game Complete Message with click to close */}
      {showResult && gameComplete && (
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
          <p className="text-xl font-bold text-green-400 mb-1">BONUS COMPLETE!</p>
          <p className="text-3xl font-bold text-yellow-400">${totalWinnings.toFixed(2)}</p>
          <p className="text-sm text-gray-300 mt-1">Total winnings from all picks</p>
          <p className="text-sm text-gray-300 mt-2 opacity-75">Click anywhere to collect prize</p>
        </div>
      )}

      {/* Reset Button - only show when not showing results */}
      {gameComplete && !showResult && (
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50"
        >
          Play Again
        </button>
      )}

      {/* Accessibility instructions */}
      <div className="text-xs text-gray-400 text-center max-w-sm">
        <p>Use keyboard: Tab to navigate, Enter/Space to select</p>
        <p>Screen reader users: Each cell is announced with its position and content</p>
      </div>
    </div>
    </>
  );
};

export default PickAndClickBonus;
