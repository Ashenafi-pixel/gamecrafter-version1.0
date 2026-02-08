import React, { useEffect, useState } from "react";
import { gameTypes } from './gametypes';
import { useGameStore } from "../../../../store";
import { ArrowRight, CheckCircle } from 'lucide-react';

export const GameTypeCard: React.FC<{
  gameType: typeof gameTypes[0];
  onSelect: () => void;
  isAvailable?: boolean;
  selectedGameTypeId: string | null;
}> = ({ gameType, onSelect, isAvailable = true, selectedGameTypeId }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Get global state
  const { config } = useGameStore();
  
  // Use BOTH global state and local state to determine if selected
  // This ensures checkmark is shown immediately after selection 
  // and persists when navigating back from other steps
  const isSelected = config.selectedGameType === gameType.id || selectedGameTypeId === gameType.id;
  
  // Debug - log the selection state
  useEffect(() => {
    console.log(`[GameTypeCard ${gameType.id}] Selected: ${isSelected}, GlobalType: ${config.selectedGameType}, LocalType: ${selectedGameTypeId}`);
  }, [isSelected, config.selectedGameType, selectedGameTypeId, gameType.id]);
  
  return (
    <div
      data-game-type={gameType.id}
      data-selected={isSelected ? "true" : "false"}
      className={`relative overflow-hidden rounded-xl shadow-sm bg-white
                ${isSelected ? 'ring-2 ring-green-500' : ''}
                cursor-pointer`}
      onClick={() => {
        if (isAvailable) {
          // Call the select handler
          onSelect();
        }
      }}
    >
      {/* Clean image preview without overlays */}
      <div className="aspect-video relative">
        <img 
          src={gameType.placeholder}
          alt={gameType.title}
          className={`w-full h-full object-cover ${!isAvailable ? 'grayscale opacity-75' : ''}`}
        />
        
        {/* Coming Soon badge for unavailable games */}
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-gray-800/70 px-4 py-2 rounded-lg text-white font-semibold rotate-[-15deg] shadow-lg">
              COMING SOON
            </div>
          </div>
        )}
        
        {/* Simple selected indicator in the top right */}
        {isSelected && (
          <div className="absolute top-3 right-3 z-10 bg-green-600 text-white rounded-full p-1.5 shadow-md border border-white">
            <CheckCircle className="w-5 h-5" strokeWidth={3} />
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center p-3">
        <h3 className="text-lg font-bold text-gray-800">{gameType.title}</h3>
        
        {/* Clean select button with high contrast - only show if available */}
        {isAvailable ? (
          <button 
            className={`px-3 py-1.5 ${isSelected ? 'bg-green-600' : 'bg-blue-600'} text-white rounded-md
                      flex items-center shadow-sm font-medium text-sm`}
            onClick={(e) => {
              // Prevent double event firing
              e.stopPropagation();
              // Update selection state
              onSelect();
            }}
          >
            <span>{isSelected ? 'Selected' : 'Select'}</span>
            {isSelected ? (
              <CheckCircle className="w-3.5 h-3.5 ml-1.5" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            )}
          </button>
        ) : (
          <div className="text-xs text-gray-500 italic">Available soon</div>
        )}
      </div>
    </div>
  );
};