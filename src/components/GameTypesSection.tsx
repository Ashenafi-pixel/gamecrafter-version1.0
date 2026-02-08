import React from 'react';
import { useGameStore } from '../store';

export const GameTypesSection: React.FC = () => {
  const setGameType = useGameStore((state) => state.setGameType);
  const setStep = useGameStore((state) => state.setStep);

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Game Types</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Slots */}
        <div
          className="border border-blue-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-blue-50"
          onClick={() => {
            setGameType('slots');
            setStep(0);
          }}>
          <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <div className="p-3">
            <div className="text-sm font-medium text-gray-800">Slot Games</div>
            <div className="text-xs text-gray-500 mt-1">Classic reels, paylines, and bonus features</div>
          </div>
        </div>

        {/* Scratch Cards */}
        <div className="border border-green-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-green-50"
          onClick={() => {
            setGameType('scratch');
            setStep(0);
          }}>
          <div className="h-24 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
          <div className="p-3">
            <div className="text-sm font-medium text-gray-800">Scratch Cards</div>
            <div className="text-xs text-gray-500 mt-1">Instant win games with reveal mechanics</div>
          </div>
        </div>

        {/* Instant Games */}
        <div className="border border-purple-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-purple-50"
          onClick={() => {
            setGameType('instant');
            setStep(0);
          }}>
          <div className="h-24 bg-gradient-to-r from-purple-500 to-fuchsia-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div className="p-3">
            <div className="text-sm font-medium text-gray-800">Instant Games</div>
            <div className="text-xs text-gray-500 mt-1">Plinko, Mines, and quick win games</div>
          </div>
        </div>

        {/* Crash Games */}
        <div className="border border-gra-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-orange-50"
          onClick={() => {
            setGameType('crash');
            setStep(0);
          }}>
          <div className="h-24 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
          </div>
          <div className="p-3">
            <div className="text-sm font-medium text-gray-800">Crash Games</div>
            <div className="text-xs text-gray-500 mt-1">Risk-based multiplier games</div>
          </div>
        </div>

        {/* Table Games - Coming Soon */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 opacity-70 relative">
          <div className="h-24 bg-gradient-to-r from-purple-500 to-pink-500 grayscale flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
            </svg>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-3 py-1 bg-black/70 text-white text-sm font-medium rounded-full">Coming Soon</span>
          </div>
          <div className="p-3">
            <div className="text-sm font-medium text-gray-800">Table Games</div>
            <div className="text-xs text-gray-500 mt-1">Card, dice, and wheel-based games</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameTypesSection;