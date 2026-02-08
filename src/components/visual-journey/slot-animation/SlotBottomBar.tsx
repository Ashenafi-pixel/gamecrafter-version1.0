import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SlotBottomBarProps {
  balance?: number;
  betAmount?: number;
  totalBet?: number;
  currency?: string;
  winAmount?: number;
  onSpin: () => void;
  isSpinning: boolean;
  onBetChange?: (amount: number) => void;
  maxBet?: number;
  minBet?: number;
  betStep?: number;
}

/**
 * Professional slot machine bottom UI bar
 * Follows industry standards (Pragmatic Play, NetEnt, etc)
 */
const SlotBottomBar: React.FC<SlotBottomBarProps> = ({
  balance = 1000.00,
  betAmount = 5.00,
  totalBet = betAmount,
  currency = '€',
  winAmount = 0,
  onSpin,
  isSpinning,
  onBetChange,
  maxBet = 100.00,
  minBet = 0.20,
  betStep = 0.20
}) => {
  const [showWin, setShowWin] = useState(false);
  const [localBalance, setLocalBalance] = useState(balance);
  const [localWin, setLocalWin] = useState(winAmount);
  
  // Format currency values nicely
  const formatCurrency = (value: number) => {
    return `${currency}${value.toFixed(2)}`;
  };
  
  // Handle bet change
  const changeBet = (increase: boolean) => {
    if (!onBetChange || isSpinning) return;
    
    let newBet: number;
    
    if (increase) {
      newBet = Math.min(betAmount + betStep, maxBet);
    } else {
      newBet = Math.max(betAmount - betStep, minBet);
    }
    
    // Round to 2 decimal places to avoid floating point issues
    newBet = Math.round(newBet * 100) / 100;
    
    onBetChange(newBet);
  };
  
  // Handle spin button click
  const handleSpin = () => {
    if (isSpinning) return;
    
    // Start spin
    onSpin();
    
    // Hide win display
    setShowWin(false);
  };
  
  // Handle win animation and balance update
  useEffect(() => {
    if (winAmount > 0 && !isSpinning) {
      // Show win animation
      setLocalWin(winAmount);
      setShowWin(true);
      
      // Update balance (simulating win added to balance)
      setLocalBalance(prevBalance => prevBalance + winAmount);
    }
  }, [winAmount, isSpinning]);
  
  // Update local balance when prop changes
  useEffect(() => {
    setLocalBalance(balance);
  }, [balance]);
  
  return (
    // Fixed-position bar at the bottom of the viewport
    <div className="fixed inset-x-0 bottom-0 h-16 z-50" style={{ 
      background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.9) 80%, rgba(0,0,0,0.8) 100%)',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.5)'
    }}>
      <div className="max-w-screen-xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Left side: Balance info */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs uppercase tracking-wide">BALANCE</span>
            <span className="text-white font-semibold">{formatCurrency(localBalance)}</span>
          </div>
        </div>
        
        {/* Center: Win display and bet controls */}
        <div className="flex flex-col items-center">
          {/* Win display (shows after spin completes) */}
          {showWin && !isSpinning && (
            <motion.div 
              className="text-sm font-bold text-green-400 mb-1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              WIN {formatCurrency(localWin)}
            </motion.div>
          )}
          
          {/* Bet controls */}
          <div className="flex items-center space-x-2">
            <motion.button
              className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ backgroundColor: "#555" }}
              whileTap={{ scale: 0.95 }}
              disabled={isSpinning || betAmount <= minBet}
              onClick={() => changeBet(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </motion.button>
            
            <div className="flex flex-col items-center">
              <span className="text-gray-400 text-xs uppercase tracking-wide">BET</span>
              <span className="text-white font-semibold">{formatCurrency(betAmount)}</span>
            </div>
            
            <motion.button
              className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ backgroundColor: "#555" }}
              whileTap={{ scale: 0.95 }}
              disabled={isSpinning || betAmount >= maxBet}
              onClick={() => changeBet(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </motion.button>
          </div>
        </div>
        
        {/* Right side: Total bet and spin button */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-gray-400 text-xs uppercase tracking-wide">TOTAL BET</span>
            <span className="text-white font-semibold">{formatCurrency(totalBet)}</span>
          </div>
          
          {/* Spin button */}
          <motion.button
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg focus:outline-none 
              ${isSpinning ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`}
            whileHover={isSpinning ? {} : { scale: 1.05 }}
            whileTap={isSpinning ? {} : { scale: 0.95 }}
            onClick={handleSpin}
            disabled={isSpinning}
          >
            {isSpinning ? (
              // Spinning animation
              <div className="w-8 h-8 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
            ) : (
              // Play icon
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default SlotBottomBar;