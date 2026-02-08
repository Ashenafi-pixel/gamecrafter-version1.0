import React, { useEffect } from "react";
import { gameTypes } from './gametypes';
import { useGameStore } from "../../../../../store";
import { ArrowRight, CheckCircle } from 'lucide-react';

export const GameTypeCard: React.FC<{
  gameType: typeof gameTypes[0];
  onSelect: () => void;
  isAvailable?: boolean;
  selectedGameTypeId: string | null;
}> = ({ gameType, onSelect, isAvailable = true, selectedGameTypeId }) => {

  // Get global state
  const { config } = useGameStore();

  // Only show as selected if there's an actual selection (not null/empty)
  const isSelected = (config.selectedGameType === gameType.id && config.selectedGameType !== null) ||
    (selectedGameTypeId === gameType.id && selectedGameTypeId !== null);

  // Debug - log the selection state
  useEffect(() => {
    console.log(`[GameTypeCard ${gameType.id}] Selected: ${isSelected}, GlobalType: ${config.selectedGameType}, LocalType: ${selectedGameTypeId}`);
  }, [isSelected, config.selectedGameType, selectedGameTypeId, gameType.id]);

  return (
    <div
      data-game-type={gameType.id}
      data-selected={isSelected ? "true" : "false"}
      className={`relative overflow-hidden rounded-xl shadow-sm bg-white gap-2
              ${isSelected ? 'ring-2 ring-green-500' : ''}
              cursor-pointer w-64 uw:w-[520px] uw:ml-9`}   // fixed width for consistency
      onClick={() => {
        if (isAvailable) {
          onSelect();
        }
      }}
    >
      {/* Image preview with fixed aspect ratio (1:2 Poster Size) */}
      <div className="aspect-[1/2] relative w-full">
        <img
          src={gameType.placeholder}
          alt={gameType.title}
          className={`w-full h-full  object-cover rounded-t-xl ${!isAvailable ? 'grayscale opacity-75' : ''}`}
        />

        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-gray-800/70 px-4 py-2  rounded-lg uw:text-3xl text-white font-semibold rotate-[-15deg] shadow-lg">
              COMING SOON
            </div>
          </div>
        )}

        {isSelected && (
          <div className="absolute top-3 right-3  z-10 bg-green-600 text-white rounded-full p-1.5 shadow-md border border-white">
            <CheckCircle className="w-5 h-5" strokeWidth={3} />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center p-3">
        <h3 className="text-lg uw:text-3xl font-bold text-gray-800 truncate">{gameType.title}</h3>

        {isAvailable ? (
          <button
            className={`px-3 py-1.5 ${isSelected ? 'bg-green-600' : 'bg-blue-600'} text-white rounded-md
                  flex items-center shadow-sm font-medium text-sm uw:text-2xl`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <span>{isSelected ? 'Selected' : 'Select'}</span>
            {isSelected ? (
              <CheckCircle className="w-3.5 h-3.5 ml-1.5  uw:w-6 uw:h-6 " />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            )}
          </button>
        ) : (
          <div className="text-xs uw:text-3xl text-gray-500 italic">Available soon</div>
        )}
      </div>
    </div>

  );
};