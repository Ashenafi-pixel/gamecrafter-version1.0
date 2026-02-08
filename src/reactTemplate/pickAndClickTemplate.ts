export const generatePickAndClickModal = () => `import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import {GridCell, PickAndClickConfig, PickAndClickModalProps } from '../types';
const PickAndClickModal: React.FC<PickAndClickModalProps> = ({ isOpen, onClose, config, onWin }) => {
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [picksRemaining, setPicksRemaining] = useState(0);
  const [totalWin, setTotalWin] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [multiplier, setMultiplier] = useState(1);

  const pickAndClickConfig: PickAndClickConfig = config?.bonus?.pickAndClick || {
    enabled: true,
    gridSize: [3, 3],
    picks: 3,
    maxPrize: 100,
    extraPicks: false,
    multipliers: false
  };

  useEffect(() => {
    if (isOpen) {
      initializeGame();
    }
  }, [isOpen]);

  const initializeGame = () => {
    const [rows, cols] = pickAndClickConfig.gridSize;
    const newGrid: GridCell[][] = [];
    
    // Generate prizes
    const totalCells = rows * cols;
    const prizes: GridCell[] = [];
    
    // Create prize distribution
    for (let i = 0; i < totalCells; i++) {
      let value: number;
      if (i < totalCells * 0.5) {
        value = Math.floor(Math.random() * (pickAndClickConfig.maxPrize * 0.3) + 1);
      } else if (i < totalCells * 0.8) {
        value = Math.floor(Math.random() * (pickAndClickConfig.maxPrize * 0.4) + (pickAndClickConfig.maxPrize * 0.3));
      } else {
        value = Math.floor(Math.random() * (pickAndClickConfig.maxPrize * 0.3) + (pickAndClickConfig.maxPrize * 0.7));
      }
      
      prizes.push({
        type: 'prize',
        value,
        revealed: false
      });
    }
    
    // Add special symbols
    if (pickAndClickConfig.extraPicks) {
      const extraPickIndex = Math.floor(Math.random() * prizes.length);
      prizes[extraPickIndex] = { type: 'extraPick', value: 1, revealed: false };
    }
    
    if (pickAndClickConfig.multipliers) {
      const multiplierIndex = Math.floor(Math.random() * prizes.length);
      if (prizes[multiplierIndex].type !== 'extraPick') {
        prizes[multiplierIndex] = { 
          type: 'multiplier', 
          value: [2, 3, 5][Math.floor(Math.random() * 3)], 
          revealed: false 
        };
      }
    }
    
    // Shuffle and arrange in grid
    const shuffled = [...prizes];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (let r = 0; r < rows; r++) {
      newGrid[r] = [];
      for (let c = 0; c < cols; c++) {
        newGrid[r][c] = shuffled[r * cols + c];
      }
    }
    
    setGrid(newGrid);
    setPicksRemaining(pickAndClickConfig.picks);
    setTotalWin(0);
    setGameComplete(false);
    setMultiplier(1);
  };

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col].revealed || picksRemaining <= 0 || gameComplete) return;
    
    const newGrid = [...grid];
    newGrid[row][col].revealed = true;
    setGrid(newGrid);
    
    const cell = newGrid[row][col];
    let newPicksRemaining = picksRemaining - 1;
    let newTotalWin = totalWin;
    let newMultiplier = multiplier;
    
    if (cell.type === 'prize') {
      newTotalWin += cell.value;
    } else if (cell.type === 'extraPick') {
      newPicksRemaining += cell.value;
    } else if (cell.type === 'multiplier') {
      newMultiplier = cell.value;
    }
    
    setPicksRemaining(newPicksRemaining);
    setTotalWin(newTotalWin);
    setMultiplier(newMultiplier);
    
     if (newPicksRemaining <= 0) {
      // Add delay before completing the game to let user see what they clicked
      setTimeout(() => {
        const finalWin = newTotalWin * newMultiplier;
        setTotalWin(finalWin);
        setGameComplete(true);
        onWin(finalWin);
      }, 1500); // 1.5 second delay
    }
  };

  const renderCellContent = (cell: GridCell) => {
    if (!cell.revealed) {
      return '?';
    }
    
    if (cell.type === 'extraPick') {
      return '+1';
    } else if (cell.type === 'multiplier') {
      return \`x\${cell.value}\`;
    } else {
      // For prize values, use bonus number images if available, fallback to regular number images
      const valueStr = cell.value.toString();
      const bonusNumberImages = config.bonusNumberImages || {};
      const hasBonusNumberImages = Object.keys(bonusNumberImages).length > 0;
      
      console.log('Pick & Click Debug:', {
        value: cell.value,
        valueStr,
        hasBonusNumberImages,
        bonusNumberImages,
      });
      
      if (hasBonusNumberImages) {
        const imagesToUse = bonusNumberImages ;
        return (
          <div className="number-display">
            {valueStr.split('').map((digit, index) => {
              const digitImageSrc = imagesToUse[digit];
              console.log('Digit mapping:', { digit, hasImage: !!digitImageSrc, imageType: hasBonusNumberImages ? 'bonus' : 'regular' });
              return digitImageSrc ? (
                <img
                  key={index}
                  src={digitImageSrc}
                  alt={digit}
                  className="digit-image"
                />
              ) : (
                <span key={index} className="digit-text">{digit}</span>
              );
            })}
          </div>
        );
      } else {
        return \`\${cell.value}\`;
      }
    }
  };

  const getCellClass = (cell: GridCell) => {
    let className = 'pick-click-cell';
    
    if (cell.revealed) {
      className += ' revealed';
      if (cell.type === 'extraPick') {
        className += ' extra-pick';
      } else if (cell.type === 'multiplier') {
        className += ' multiplier';
      } else if (cell.value >= pickAndClickConfig.maxPrize * 0.7) {
        className += ' high-prize';
      } else if (cell.value >= pickAndClickConfig.maxPrize * 0.3) {
        className += ' medium-prize';
      } else {
        className += ' low-prize';
      }
    }
    
    return className;
  };

  return (
 <BaseModal 
      isOpen={isOpen} 
      onClose={gameComplete ? onClose : () => {}} 
      title="🎯 PICK & CLICK BONUS!" 
      className="pick-click-modal"
    >
      <div className="pick-click-info">
        <div className="picks-remaining">Picks: {picksRemaining}</div>
        <div className="current-win">Win: {totalWin}</div>
        {multiplier > 1 && <div className="multiplier">Multiplier: x{multiplier}</div>}
      </div>
      
      <div 
        className="pick-click-grid"
        style={{
          gridTemplateColumns: \`repeat(\${pickAndClickConfig.gridSize[1]}, 1fr)\`,
          gridTemplateRows: \`repeat(\${pickAndClickConfig.gridSize[0]}, 1fr)\`
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={\`\${rowIndex}-\${colIndex}\`}
              className={getCellClass(cell)}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {renderCellContent(cell)}
            </div>
          ))
        )}
      </div>
      
      {gameComplete && (
        <div className="pick-click-complete">
          <h3>Bonus Complete!</h3>
          <div className="final-win">Total Win: {totalWin}</div>
          <button className="collect-btn" onClick={onClose}>
            Collect Prize
          </button>
        </div>
      )}
    </BaseModal>
  );
};

export default PickAndClickModal;`;

export const generatePickAndClickCSS = () => `/* Pick & Click Bonus Styles */
.pick-click-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

.pick-click-modal {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  border: 3px solid #ffd700;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.5s ease-out;
}

.pick-click-header {
  text-align: center;
  margin-bottom: 20px;
}

.pick-click-header h2 {
  color: #ffd700;
  font-size: 28px;
  margin: 0 0 15px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.pick-click-info {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.picks-remaining,
.current-win,
.multiplier {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid #ffd700;
  border-radius: 10px;
  padding: 8px 16px;
  color: #ffd700;
  font-weight: bold;
}

.pick-click-grid {
  display: grid;
  gap: 10px;
  margin: 20px 0;
  justify-content: center;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.pick-click-cell {
  width: 80px;
  height: 80px;
  background: #2d3748;
  border: 2px solid #4a5568;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #a0aec0;
  transition: all 0.3s ease;
  user-select: none;
}

.pick-click-cell:hover:not(.revealed) {
  background: #4a5568;
  transform: scale(1.05);
  border-color: #ffd700;
}

.pick-click-cell.revealed {
  cursor: default;
  transform: scale(1.1);
  animation: cellReveal 0.5s ease-out;
}

.pick-click-cell.low-prize {
  background: #3182ce;
  border-color: #63b3ed;
  color: white;
}

.pick-click-cell.medium-prize {
  background: #e53e3e;
  border-color: #fc8181;
  color: white;
}

.pick-click-cell.high-prize {
  background: #ffd700;
  border-color: #f6e05e;
  color: #1a202c;
}

.pick-click-cell.extra-pick {
  background: #38a169;
  border-color: #68d391;
  color: white;
}

.pick-click-cell.multiplier {
  background: #9f7aea;
  border-color: #b794f6;
  color: white;
}

/* Number display styles for Pick & Click */
.pick-click-cell .number-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.pick-click-cell .digit-image {
  height: 24px;
  width: auto;
  max-width: 20px;
  object-fit: contain;
}

.pick-click-cell .digit-text {
  font-size: 24px;
  font-weight: bold;
}

.pick-click-complete {
  text-align: center;
  margin-top: 20px;
  padding: 20px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 15px;
  border: 2px solid #ffd700;
}

.pick-click-complete h3 {
  color: #ffd700;
  margin: 0 0 15px 0;
  font-size: 24px;
}

.final-win {
  font-size: 32px;
  font-weight: bold;
  color: #ffd700;
  margin: 15px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.collect-btn {
  background: linear-gradient(135deg, #ffd700, #f6e05e);
  border: none;
  border-radius: 25px;
  padding: 12px 30px;
  font-size: 18px;
  font-weight: bold;
  color: #1a202c;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 15px;
}

.collect-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(255, 215, 0, 0.3);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes cellReveal {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1.1);
    opacity: 1;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .pick-click-modal {
    padding: 20px;
    margin: 20px;
  }
  
  .pick-click-cell {
    width: 60px;
    height: 60px;
    font-size: 18px;
  }
  
  .pick-click-header h2 {
    font-size: 24px;
  }
  
  .pick-click-info {
    flex-direction: column;
    gap: 10px;
  }
}`;