import React from 'react';
import { X, Lock, RotateCw, Coins } from 'lucide-react';
import { Button } from '../Button';

interface HoldSpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollect: (totalWin: number) => void;
  lockedSymbols: Array<{ reel: number; row: number; symbol: string; value: number }>;
  spinsRemaining: number;
  totalWin: number;
  config?: {
    holdAndSpin?: {
      gridSize?: [number, number];
      initialRespins?: number;
      maxSymbolValue?: number;
      resetRespins?: boolean;
      collectAll?: boolean;
    };
  };
}

const HoldSpinModal: React.FC<HoldSpinModalProps> = ({
  isOpen,
  onClose,
  onCollect,
  lockedSymbols,
  spinsRemaining,
  totalWin,
  config
}) => {
  if (!isOpen) return null;

  const holdSpinConfig = config?.holdAndSpin;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-blue-800 to-purple-900 p-6 rounded-lg shadow-2xl max-w-md w-full mx-4 border-4 border-yellow-400 relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <Coins className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-bounce-slow" />
          <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">HOLD & SPIN!</h2>
          <p className="text-sm text-blue-200">Lock in wins and respin for more!</p>
        </div>

        <div className="bg-blue-900 bg-opacity-50 rounded-md p-3 mb-4 border border-blue-700">
          <div className="flex justify-between items-center text-white text-lg font-semibold mb-1">
            <span>Spins Remaining:</span>
            <span className="text-yellow-300">{spinsRemaining}</span>
          </div>
          <div className="flex justify-between items-center text-white text-lg font-semibold">
            <span>Current Win:</span>
            <span className="text-green-400">${totalWin.toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Locked Symbols:</h3>
          <div className="grid grid-cols-3 gap-2 max-h-24 overflow-y-auto custom-scrollbar">
            {lockedSymbols.map((s, index) => (
              <div key={index} className="bg-blue-700 p-2 rounded-md flex items-center justify-center text-white text-xs font-medium">
                <Lock className="w-3 h-3 mr-1 text-yellow-300" />
                {s.symbol} ({s.value}x)
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => onCollect(totalWin)}
            className="px-6 py-2 text-sm animate-pulse-once"
          >
            <Coins className="w-4 h-4 mr-1" /> Collect Win
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HoldSpinModal;