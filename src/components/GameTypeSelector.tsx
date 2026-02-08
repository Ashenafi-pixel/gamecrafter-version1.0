import React, { useState } from 'react';
import { 
  PlayCircle, 
  Joystick, 
  Car as Cards, 
  Dice1 as Dice, 
  Table, 
  ChevronRight,
  Settings
} from 'lucide-react';
import { useGameStore } from '../store';
import clsx from 'clsx';
import ConfigModal from './ConfigModal';

const gameTypes = [
  {
    id: 'slots',
    name: 'Slot Game',
    description: 'Create engaging slot games with multiple features',
    icon: Joystick,
    features: [
      'Multiple reel configurations',
      'Exciting bonus features',
      'Custom math models'
    ]
  },
  {
    id: 'scratch',
    name: 'Scratch Card',
    description: 'Design instant win scratch card games',
    icon: Cards,
    comingSoon: true
  },
  {
    id: 'bingo',
    name: 'Video Bingo',
    description: 'Build video bingo games with bonus rounds',
    icon: Dice,
    comingSoon: true
  },
  {
    id: 'table',
    name: 'Table Games',
    description: 'Develop classic casino table games',
    icon: Table,
    comingSoon: true
  }
];

export const GameTypeSelector: React.FC = () => {
  const { setGameType } = useGameStore();
  const [showConfig, setShowConfig] = useState(false);

  const handleGameSelect = (gameId: string) => {
    if (!gameId || gameId === '') return;
    
    console.log("Game type selected:", gameId);
    setGameType(gameId);
    
    // Force a navigation to the first step
    // This ensures the app refreshes and moves to the next step
    window.location.href = window.location.pathname + '?step=0&type=' + gameId;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile App Style Header */}
      <nav className="shadow-sm bg-gradient-to-r from-blue-600 to-blue-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-white" />
              <span className="text-xl font-bold text-white">
                SlotMaker AI
              </span>
            </div>
            <button
              onClick={() => setShowConfig(true)}
              className="p-2 text-white hover:bg-blue-700 rounded-full transition-colors flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Configuration</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile friendly game selector */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6">
          <div className="absolute inset-0 bg-blue-900 opacity-10 pattern-dots"></div>
          <div className="relative z-10 p-6 sm:p-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Start Creating
            </h2>
            <p className="text-blue-100 text-lg mb-0">
              Choose your game type to begin
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {gameTypes.map((game) => (
            <div
              key={game.id}
              className={clsx(
                'group relative p-6 bg-white rounded-xl transition-all duration-200 text-left overflow-hidden shadow-md h-full',
                game.comingSoon 
                  ? 'opacity-60 cursor-not-allowed border-gray-200' 
                  : 'hover:shadow-lg hover:scale-[1.02] hover:border-blue-300 cursor-pointer'
              )}
              onClick={() => !game.comingSoon && handleGameSelect(game.id)}
              role="button"
              tabIndex={game.comingSoon ? -1 : 0}
            >
              <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-md">
                  <game.icon className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {game.name}
                </h2>
                
                <p className="text-gray-600 mb-4">
                  {game.description}
                </p>

                {game.features && (
                  <ul className="space-y-2 mb-6">
                    {game.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {game.comingSoon ? (
                  <span className="absolute top-4 right-4 px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-600">
                    Coming Soon
                  </span>
                ) : (
                  <div className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
                    Get Started
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      
      {/* Configuration Modal */}
      <ConfigModal 
        isOpen={showConfig} 
        onClose={() => setShowConfig(false)} 
      />
    </div>
  );
};