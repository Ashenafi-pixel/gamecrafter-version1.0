import React from 'react';
import { useGameStore } from '../store';
import { FileText, Download } from 'lucide-react';

export const GameRules: React.FC = () => {
  const { config, currentStep, setStep } = useGameStore();
  const { reels, bonus, jackpots } = config;
  
  // Navigation helpers
  const goToNextStep = () => {
    setStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const goToPreviousStep = () => {
    setStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateGameSheet = () => {
    // Create a formatted text version of the game rules
    const gameTitle = config.theme?.mainTheme || 'Slot Game';
    const now = new Date().toLocaleDateString();
    
    // Format the game rules content
    const content = `
      # ${gameTitle.toUpperCase()} - GAME RULES
      Generated on: ${now}
      
      ## BASIC GAME RULES
      - Game is played on a ${reels?.layout?.reels}x${reels?.layout?.rows} grid
      - Wins are paid ${reels?.payMechanism === 'betlines' ? `on ${reels?.betlines} betlines` : 'for clusters of matching symbols'}
      ${reels?.payMechanism === 'cluster' ? `- Minimum ${reels?.cluster?.minSymbols} matching symbols required for a win` : ''}
      ${reels?.symbols?.wilds > 0 ? '- Wild symbols substitute for all regular symbols' : ''}
      
      ## SYMBOLS AND PAYTABLE
      ${(reels?.symbols?.list || []).map(symbol => 
        `- ${symbol.name || 'Symbol'}: Pays up to ${Math.max(...Object.values(symbol.payouts || {}))}x bet`
      ).join('\n')}
      
      ${bonus?.freeSpins?.enabled ? `
      ## FREE SPINS
      - Triggered by ${bonus.freeSpins.triggers[0]} scatter symbols
      - Awards ${bonus.freeSpins.count} free spins
      - ${bonus.freeSpins.multipliers.length > 0 ? 'Multiplied wins up to x' + Math.max(...bonus.freeSpins.multipliers) : 'Base game wins'}
      ${bonus.freeSpins.retriggers ? '- Can be retriggered during feature' : ''}
      ` : ''}
      
      ${config.volatility ? `
      ## GAME STATISTICS
      - Volatility: ${config.volatility.level}
      - RTP: ${config.rtp?.targetRTP || 96}%
      - Hit Frequency: ${config.volatility.hitFrequency || 25}%
      - Max Win: ${config.volatility.maxWinPotential}x bet
      ` : ''}
      
      ## GAME CONTROLS
      - Spin: Starts the game round
      - Autoplay: ${config.playerExperience?.autospinOptions ? `Options: ${config.playerExperience.autospinOptions.join(', ')}` : 'Enables automatic spins'}
      - Bet: Adjusts the bet amount
      
      ## LEGAL INFORMATION
      - This is a game of chance. Results are determined by a random number generator.
      - Malfunction voids all pays and plays.
      - The expected return to player is ${config.rtp?.targetRTP || 96}%.
    `;
    
    // In a real implementation, this would generate a PDF
    // For this demo, we'll create a text file for download
    const blob = new Blob([content.replace(/^ +/gm, '')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gameTitle.replace(/\s+/g, '-').toLowerCase()}-game-rules.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    // Show feedback
    alert('Game rules document generated successfully!');
  };

  return (
    <div className="space-y-6">
      <section className="bg-white/50 p-6 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <FileText className="mr-2 w-6 h-6 text-blue-600" />
          Game Rules Overview
        </h2>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Basic Game Rules</h4>
            <div className="space-y-2 text-gray-600">
              <p>• Game is played on a {reels?.layout?.reels}x{reels?.layout?.rows} grid</p>
              <p>• Wins are paid {reels?.payMechanism === 'betlines' ? `on ${reels?.betlines} betlines` : 'for clusters of matching symbols'}</p>
              {reels?.payMechanism === 'cluster' && (
                <p>• Minimum {reels?.cluster?.minSymbols} matching symbols required for a win</p>
              )}
              {reels?.symbols?.wilds > 0 && (
                <p>• Wild symbols substitute for all regular symbols</p>
              )}
            </div>
          </div>

          {bonus?.freeSpins?.enabled && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Free Spins</h4>
              <div className="space-y-2 text-gray-600">
                <p>• Triggered by {bonus.freeSpins.triggers[0]} scatter symbols</p>
                <p>• Awards {bonus.freeSpins.multipliers.length > 0 ? 'multiplied wins up to x' + Math.max(...bonus.freeSpins.multipliers) : 'base game wins'}</p>
                {bonus.freeSpins.retriggers && (
                  <p>• Can be retriggered during feature</p>
                )}
              </div>
            </div>
          )}

          {jackpots?.enabled && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Jackpots</h4>
              <div className="space-y-2 text-gray-600">
                <p>• {Object.keys(jackpots.types).length} progressive jackpot levels</p>
                <p>• Contribution rate: {jackpots.contribution}% of bet</p>
                <p>• Triggered via {jackpots.triggerType} mechanism</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white/50 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <FileText className="mr-2 w-6 h-6 text-blue-600" />
              Game Sheet Generation
            </h2>
            <p className="text-sm text-gray-600 mt-1">Generate detailed documentation for your game</p>
          </div>
          <button
            onClick={generateGameSheet}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium w-full sm:w-auto"
          >
            <Download className="w-5 h-5" />
            Generate Game Sheet
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Game Rules Document</h4>
                <p className="text-sm text-gray-600">Complete rules and gameplay documentation</p>
              </div>
            </div>
            <button 
              onClick={generateGameSheet}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Math Model Documentation</h4>
                <p className="text-sm text-gray-600">Detailed mathematical specifications</p>
              </div>
            </div>
            <button 
              onClick={() => {
                // Create a formatted math model document
                const gameTitle = config.theme?.mainTheme || 'Slot Game';
                const now = new Date().toLocaleDateString();
                
                const content = `
                  # ${gameTitle.toUpperCase()} - MATH MODEL
                  Generated on: ${now}
                  
                  ## GAME CONFIGURATION
                  - Grid: ${reels?.layout?.reels}x${reels?.layout?.rows}
                  - Pay Mechanism: ${reels?.payMechanism || 'Betlines'}
                  ${reels?.payMechanism === 'betlines' ? `- Number of Betlines: ${reels?.betlines}` : ''}
                  ${reels?.payMechanism === 'cluster' ? `- Minimum Cluster Size: ${reels?.cluster?.minSymbols}` : ''}
                  
                  ## RTP BREAKDOWN
                  - Target RTP: ${config.rtp?.targetRTP || 96.0}%
                  - Base Game RTP: ${config.rtp?.baseRTP || 70.0}%
                  - Bonus Features RTP: ${config.rtp?.bonusRTP || 26.0}%
                  ${bonus?.freeSpins?.enabled ? `- Free Spins RTP Contribution: ${config.rtp?.featureRTP || 20.0}%` : ''}
                  
                  ## SYMBOL WEIGHTS AND DISTRIBUTION
                  ${(reels?.symbols?.list || []).map(symbol => 
                    `- ${symbol.name || 'Symbol'}: Weight ${symbol.weight || 5}, Max Payout ${Math.max(...Object.values(symbol.payouts || {}))}x`
                  ).join('\n')}
                  
                  ## VOLATILITY METRICS
                  - Volatility Level: ${config.volatility?.level || 'Medium'}
                  - Hit Frequency: ${config.volatility?.hitFrequency || 25}%
                  - Variance: ${config.volatility?.variance || 10}
                  - Maximum Win Potential: ${config.volatility?.maxWinPotential || 5000}x bet
                  
                  ## FEATURE FREQUENCIES
                  ${bonus?.freeSpins?.enabled ? `- Free Spins Trigger Frequency: ~${Math.round(100/((reels?.symbols?.list || []).filter(s => s.isScatter).length > 0 ? 20 : 100))}%` : ''}
                  ${bonus?.jackpots?.enabled ? `- Jackpot Hit Rate: Variable based on bet size` : ''}
                  
                  ## BET CONFIGURATION
                  - Minimum Bet: ${config.bet?.min || 0.20}
                  - Maximum Bet: ${config.bet?.max || 100}
                  - Bet Increment: ${config.bet?.increment || 0.20}
                `;
                
                // Create and download the file
                const blob = new Blob([content.replace(/^ +/gm, '')], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `${gameTitle.replace(/\s+/g, '-').toLowerCase()}-math-model.txt`;
                document.body.appendChild(a);
                a.click();
                
                setTimeout(() => {
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }, 100);
                
                alert('Math Model document generated successfully!');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Symbol Configuration</h4>
              <p className="text-sm text-gray-600">Symbol weights and payout tables</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={goToPreviousStep}
          className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={goToNextStep}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};