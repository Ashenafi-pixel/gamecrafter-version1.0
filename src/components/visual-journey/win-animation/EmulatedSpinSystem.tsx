import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCw, Sparkles, Trophy, Star, Zap } from 'lucide-react';
import { useGameStore } from '../../../store';

interface SpinResult {
  symbols: string[][];
  winType: 'none' | 'small-win' | 'big-win' | 'mega-win' | 'jackpot';
  winAmount: number;
  winLines: number[];
  multiplier: number;
}

interface EmulatedSpinSystemProps {
  onSpinComplete?: (result: SpinResult) => void;
}

const EmulatedSpinSystem: React.FC<EmulatedSpinSystemProps> = ({ onSpinComplete }) => {
  const { config, triggerAnimation, isSpinning, setIsSpinning } = useGameStore();
  
  // State
  const [reels, setReels] = useState<string[][]>([]);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(1);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [spinHistory, setSpinHistory] = useState<SpinResult[]>([]);
  const winPopupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bonusPopupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation refs
  const reelRefs = useRef<HTMLDivElement[]>([]);
  
  // Get symbols from config or use defaults
  const configSymbols = config?.symbols || [];
  const symbols = configSymbols.length > 0 
    ? configSymbols.map((sym, index) => ({
        id: sym.id || `symbol_${index}`,
        name: sym.name || `Symbol ${index}`,
        value: sym.payout?.[3] || (9 - index) * 10, // Use 3-of-a-kind payout or descending values
        type: index === 0 ? 'special' : index === 1 ? 'special' : index < 5 ? 'high' : index < 7 ? 'medium' : 'low',
        imageUrl: sym.image
      }))
    : [
        { id: 'wild', name: 'Wild', value: 0, type: 'special' },
        { id: 'bones', name: 'Bones', value: 0, type: 'special' },
        { id: 'scatter', name: 'Scatter', value: 0, type: 'special' },
        { id: 'high1', name: 'High 1', value: 100, type: 'high' },
        { id: 'high2', name: 'High 2', value: 80, type: 'high' },
        { id: 'high3', name: 'High 3', value: 60, type: 'high' },
        { id: 'med1', name: 'Medium 1', value: 40, type: 'medium' },
        { id: 'med2', name: 'Medium 2', value: 30, type: 'medium' },
        { id: 'low1', name: 'Low 1', value: 20, type: 'low' },
        { id: 'low2', name: 'Low 2', value: 10, type: 'low' }
      ];
  
  // Initialize reels
  useEffect(() => {
    const initialReels = Array(5).fill(null).map(() =>
      Array(3).fill(null).map(() => 
        symbols[Math.floor(Math.random() * symbols.length)].id
      )
    );
    setReels(initialReels);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (winPopupTimeoutRef.current) {
        clearTimeout(winPopupTimeoutRef.current);
      }
      if (bonusPopupTimeoutRef.current) {
        clearTimeout(bonusPopupTimeoutRef.current);
      }
    };
  }, []);
  
  
  // Calculate win based on symbols
  const calculateWin = (reelSymbols: string[][]): SpinResult => {
    let totalWin = 0;
    let winLines: number[] = [];
    let winType: SpinResult['winType'] = 'none';
    
    // Check for matching symbols on paylines (simplified)
    for (let row = 0; row < 3; row++) {
      const lineSymbols = reelSymbols.map(reel => reel[row]);
      
      // Check for 3+ matching symbols
      const firstSymbol = lineSymbols[0];
      let matchCount = 1;
      
      for (let i = 1; i < lineSymbols.length; i++) {
        if (lineSymbols[i] === firstSymbol || lineSymbols[i] === 'wild') {
          matchCount++;
        } else {
          break;
        }
      }
      
      if (matchCount >= 3) {
        const symbol = symbols.find(s => s.id === firstSymbol);
        const lineWin = (symbol?.value || 0) * matchCount * bet;
        totalWin += lineWin;
        winLines.push(row);
      }
    }
    
    // Check for bones (bonus trigger)
    const bonesCount = reelSymbols.flat().filter(s => s === 'scatter' || s === 'bones').length;
    if (bonesCount >= 3) {
      totalWin += bet * 50 * bonesCount;
      winType = 'mega-win';
    }
    
    // Determine win type based on multiplier
    const multiplier = totalWin / bet;
    if (multiplier === 0) {
      winType = 'none';
    } else if (multiplier < 10) {
      winType = 'small-win';
    } else if (multiplier < 50) {
      winType = 'big-win';
    } else if (multiplier < 100) {
      winType = 'mega-win';
    } else {
      winType = 'jackpot';
    }
    
    return {
      symbols: reelSymbols,
      winType,
      winAmount: totalWin,
      winLines,
      multiplier
    };
  };
  
  // Spin the reels
  const spin = async () => {
    if (isSpinning || balance < bet) return;
    
    setIsSpinning(true);
    setBalance(prev => prev - bet);
    
    // Animate reels spinning
    reelRefs.current.forEach((reel, index) => {
      if (reel) {
        reel.style.transition = `transform ${0.5 + index * 0.1}s cubic-bezier(0.17, 0.67, 0.83, 0.67)`;
        reel.style.transform = 'translateY(-200%)';
      }
    });
    
    // Generate new symbols
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newReels = Array(5).fill(null).map(() =>
      Array(3).fill(null).map(() => {
        // Weighted random - higher chance for bones to test bonus
        const rand = Math.random();
        if (rand < 0.02) return 'wild';
        if (rand < 0.15) return 'bones'; // Higher chance for bones
        if (rand < 0.20) return 'scatter';
        if (rand < 0.30) return symbols[3].id; // high1
        if (rand < 0.40) return symbols[4].id; // high2
        if (rand < 0.50) return symbols[5].id; // high3
        if (rand < 0.70) return symbols[6].id; // med1
        if (rand < 0.85) return symbols[7].id; // med2
        return symbols[Math.floor(Math.random() * 2) + 8].id; // low symbols
      })
    );
    
    setReels(newReels);
    
    // Reset reel positions
    reelRefs.current.forEach(reel => {
      if (reel) {
        reel.style.transition = 'none';
        reel.style.transform = 'translateY(0)';
      }
    });
    
    // Calculate and display results
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = calculateWin(newReels);
    
    // Clear previous result first to ensure fresh popup
    setLastResult(null);
    
    // Small delay then set new result to trigger popup animation
    setTimeout(() => {
      setLastResult(result);
      setSpinHistory(prev => [...prev.slice(-9), result]);
      
      // Check for 3 bones bonus
      const bonesCount = newReels.flat().filter(s => s === 'bones').length;
      if (bonesCount >= 3) {
        console.log('🦴 BONUS TRIGGERED! Bones count:', bonesCount);
        setShowBonusPopup(true);
        
        // Clear any existing bonus timeout
        if (bonusPopupTimeoutRef.current) {
          clearTimeout(bonusPopupTimeoutRef.current);
        }
        
        // Auto-hide bonus popup after 5 seconds
        bonusPopupTimeoutRef.current = setTimeout(() => {
          setShowBonusPopup(false);
        }, 5000);
      }
      
      if (result.winAmount > 0) {
        setBalance(prev => prev + result.winAmount);
        
        // Show win popup
        setShowWinPopup(true);
        
        // Clear any existing timeout
        if (winPopupTimeoutRef.current) {
          clearTimeout(winPopupTimeoutRef.current);
        }
        
        // Auto-hide popup after 3 seconds
        winPopupTimeoutRef.current = setTimeout(() => {
          setShowWinPopup(false);
        }, 3000);
        
        // Trigger appropriate animation
        if (result.winType !== 'none') {
          triggerAnimation(result.winType);
        }
        
        console.log('🎉 WIN DETECTED:', result.winType, result.winAmount);
      }
      
      setIsSpinning(false);
      onSpinComplete?.(result);
    }, 100);
    
    // Autoplay
    if (isAutoplay && balance >= bet) {
      setTimeout(spin, 2000);
    }
  };
  
  // Get symbol image
  const getSymbolImage = (symbolId: string) => {
    // First check if we have the symbol in our symbols array
    const symbol = symbols.find(s => s.id === symbolId);
    if (symbol?.imageUrl) return symbol.imageUrl;
    
    // Then check config for generated symbols
    const symbolData = config?.theme?.generated?.symbols?.find(s => s.id === symbolId);
    if (symbolData?.imageUrl) return symbolData.imageUrl;
    
    // Fallback to placeholder
    return `/assets/symbols/${symbolId}.png`;
  };
  
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 shadow-2xl">
      {/* Slot Machine Preview */}
      <div className="mb-6">
        <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-4 overflow-hidden">
          {/* Reels Container */}
          <div className="grid grid-cols-5 gap-1 mb-4">
            {reels.map((reel, reelIndex) => (
              <div key={reelIndex} className="relative h-48 overflow-hidden bg-black/50 rounded">
                <div
                  ref={el => reelRefs.current[reelIndex] = el!}
                  className="absolute inset-0"
                >
                  {reel.map((symbol, symbolIndex) => (
                    <div
                      key={symbolIndex}
                      className="h-16 flex items-center justify-center p-1"
                    >
                      <img
                        src={getSymbolImage(symbol)}
                        alt={symbol}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/symbols/placeholder.png';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Win Lines Overlay */}
          {lastResult && lastResult.winLines.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {lastResult.winLines.map(line => (
                <div
                  key={line}
                  className="absolute left-0 right-0 h-16 border-2 border-yellow-400 animate-pulse"
                  style={{ top: `${line * 64 + 16}px` }}
                />
              ))}
            </div>
          )}
          
          {/* Win Display - Automatic Popup */}
          <AnimatePresence>
            {showWinPopup && lastResult && lastResult.winAmount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: 50 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    type: "spring",
                    damping: 15,
                    stiffness: 300
                  }
                }}
                exit={{ scale: 0, opacity: 0, y: -50 }}
                className="absolute inset-0 flex items-center justify-center bg-black/80 z-50"
              >
                <motion.div 
                  className="text-center bg-gradient-to-br from-yellow-400 to-yellow-600 p-8 rounded-2xl shadow-2xl border-4 border-yellow-300"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(255, 215, 0, 0.5)",
                      "0 0 40px rgba(255, 215, 0, 0.8)",
                      "0 0 20px rgba(255, 215, 0, 0.5)"
                    ]
                  }}
                  transition={{
                    boxShadow: {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }
                  }}
                >
                  <motion.div 
                    className="text-5xl font-bold text-black mb-4"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    🎉 {lastResult.winType.replace('-', ' ').toUpperCase()}! 🎉
                  </motion.div>
                  <div className="text-3xl font-bold text-black mb-2">
                    ${lastResult.winAmount.toFixed(2)}
                  </div>
                  <div className="text-xl text-black/80">
                    {lastResult.multiplier.toFixed(1)}x Multiplier
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Game Info */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-white">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400">BALANCE</div>
          <div className="text-xl font-bold">${balance.toFixed(2)}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400">BET</div>
          <div className="text-xl font-bold">${bet.toFixed(2)}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400">LAST WIN</div>
          <div className="text-xl font-bold">
            ${lastResult?.winAmount.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setIsAutoplay(!isAutoplay)}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            isAutoplay 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <RotateCw className="w-5 h-5 inline mr-2" />
          {isAutoplay ? 'Stop Auto' : 'Autoplay'}
        </button>
        
        <button
          onClick={spin}
          disabled={isSpinning || balance < bet}
          className={`px-8 py-4 rounded-full font-bold text-xl transition-all transform ${
            isSpinning || balance < bet
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black hover:scale-105 shadow-lg'
          }`}
        >
          {isSpinning ? (
            <div className="animate-spin">
              <RotateCw className="w-8 h-8" />
            </div>
          ) : (
            <>
              <Play className="w-8 h-8 inline mr-2" />
              SPIN
            </>
          )}
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBet(Math.max(0.5, bet - 0.5))}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            -
          </button>
          <span className="text-white px-3">BET</span>
          <button
            onClick={() => setBet(Math.min(10, bet + 0.5))}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            +
          </button>
        </div>
      </div>
      
      {/* Spin History */}
      {spinHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-white text-sm font-semibold mb-2">Recent Spins</h4>
          <div className="flex gap-2 overflow-x-auto">
            {spinHistory.map((result, index) => (
              <div
                key={index}
                className={`px-3 py-1 rounded text-xs whitespace-nowrap ${
                  result.winType === 'none' 
                    ? 'bg-gray-800 text-gray-400'
                    : result.winType === 'small-win'
                    ? 'bg-green-900 text-green-300'
                    : result.winType === 'big-win'
                    ? 'bg-blue-900 text-blue-300'
                    : result.winType === 'mega-win'
                    ? 'bg-purple-900 text-purple-300'
                    : 'bg-yellow-900 text-yellow-300'
                }`}
              >
                {result.winType === 'none' ? 'No Win' : `${result.multiplier}x`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmulatedSpinSystem;