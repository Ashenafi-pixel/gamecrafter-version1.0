import React from 'react';
import { EnhancedSlotMachine } from './index';

const SlotPIXIDemo: React.FC = () => {
  return (
    <div className="w-full p-6 bg-gray-900 min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-white mb-8">Slot Machine Demo</h1>
      
      <EnhancedSlotMachine 
        numReels={5}
        numRows={3}
        initialBalance={1000}
        showWinLines={true}
        className="mb-8"
      />
      
      <div className="bg-gray-800 p-4 rounded-lg max-w-xl w-full">
        <h2 className="text-xl font-bold text-white mb-4">How to Play</h2>
        <ul className="list-disc pl-5 text-gray-300 space-y-2">
          <li>Adjust your bet using the <strong>+/-</strong> buttons</li>
          <li>Use <strong>MAX BET</strong> to bet the maximum amount</li>
          <li>Press <strong>SPIN</strong> to spin the reels</li>
          <li>Match symbols on win lines to win prizes</li>
          <li>Click on win line numbers to see the different winning patterns</li>
        </ul>
        
        <h3 className="text-lg font-bold text-white mt-6 mb-2">Symbol Values (Multiplier)</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
          <div>
            <p><strong className="text-yellow-400">WILD:</strong> x50 (3), x200 (4), x500 (5)</p>
            <p><strong className="text-purple-400">SCATTER:</strong> x25 (3), x100 (4), x250 (5)</p>
            <p><strong className="text-red-400">HIGH:</strong> x10-20 (3), x30-50 (4), x100-200 (5)</p>
          </div>
          <div>
            <p><strong className="text-blue-400">MEDIUM:</strong> x5-8 (3), x15-20 (4), x60-80 (5)</p>
            <p><strong className="text-green-400">LOW:</strong> x1-3 (3), x5-10 (4), x20-40 (5)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotPIXIDemo;