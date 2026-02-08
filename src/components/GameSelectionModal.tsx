import React from 'react';
import { useGameStore } from '../store';

interface GameTypeOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}

interface GameSelectionModalProps {
  onClose: () => void;
}

const GameSelectionModal: React.FC<GameSelectionModalProps> = ({ onClose }) => {
  const { setGameType, setStep } = useGameStore();

  const gameTypes: GameTypeOption[] = [
    {
      id: 'slots',
      title: 'Slot Games',
      description: 'Create engaging slot games with customizable reels, symbols, and bonus features',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
      available: true
    },
    {
      id: 'scratch',
      title: 'Scratch Cards',
      description: 'Design interactive scratch cards with hidden prizes and engaging visual reveals',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
      ),
      available: true
    },
    {
      id: 'crash',
      title: 'Crash Games',
      description: 'Build thrilling crash games with increasing multipliers and risk-based gameplay',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
      ),
      available: false
    },
    {
      id: 'table',
      title: 'Table Games',
      description: 'Develop classic table games like blackjack, roulette, and poker with custom rules',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
        </svg>
      ),
      available: false
    }
  ];

  const handleSelectGameType = (gameType: string, available: boolean) => {
    if (!available) {
      return; // Don't do anything for unavailable game types
    }
    
    // Set the game type to trigger the appropriate journey
    setGameType(gameType);
    
    // Always reset to first step
    setStep(0);
    
    // Close the modal
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Select Game Type</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameTypes.map(gameType => (
              <div 
                key={gameType.id}
                onClick={() => handleSelectGameType(gameType.id, gameType.available)}
                className={`
                  border rounded-lg p-4 flex gap-4 cursor-pointer transition-all
                  ${gameType.available 
                    ? 'hover:border-blue-500 hover:bg-blue-50' 
                    : 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-50'
                  }
                `}
              >
                <div className={`
                  flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center
                  ${gameType.available 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-400'
                  }
                `}>
                  {gameType.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold ${gameType.available ? 'text-gray-800' : 'text-gray-500'}`}>
                      {gameType.title}
                    </h3>
                    {!gameType.available && (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${gameType.available ? 'text-gray-600' : 'text-gray-400'}`}>
                    {gameType.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 flex justify-end border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSelectionModal;