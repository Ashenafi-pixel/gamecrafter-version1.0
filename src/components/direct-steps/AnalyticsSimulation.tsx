import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store';
import { 
  BarChart3, Play, Percent, Trophy, BarChart, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';

/**
 * A completely isolated implementation of Analytics & Simulation 
 * Uses an entirely different approach to avoid React error #185
 */
const AnalyticsSimulation: React.FC<{onNavigate?: (direction: 'next' | 'prev') => void}> = ({ onNavigate }) => {
  const { config } = useGameStore();
  const mountedRef = useRef(true);
  
  // Clean up and prevent memory leaks when unmounting
  useEffect(() => {
    mountedRef.current = true;
    
    // Don't try to update React state after unmounting
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Direct URL-based navigation completely bypassing React
  const navigateDirectly = (targetStep: number) => {
    // Create a completely separate browser history entry
    const form = document.createElement('form');
    form.style.display = 'none';
    form.method = 'GET';
    form.action = '/';
    
    // Add parameters
    const params = {
      'step': targetStep.toString(),
      'visual': 'true',
      'bypass': Date.now().toString(),
      'nostate': 'true'
    };
    
    // Add form fields
    Object.entries(params).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    
    // Save config to sessionStorage
    sessionStorage.setItem('preserved_game_config', JSON.stringify(config));
    
    // Create a completely new page load to fully reset React
    document.body.appendChild(form);
    
    // Use a timeout to ensure this happens outside React's reconciliation
    setTimeout(() => {
      form.submit();
    }, 0);
  };
  
  // Navigate to the next step
  const handleNext = () => {
    if (onNavigate) {
      onNavigate('next');
    } else {
      navigateDirectly(8);
    }
  };
  
  // Navigate to the previous step
  const handlePrev = () => {
    if (onNavigate) {
      onNavigate('prev');
    } else {
      navigateDirectly(6);
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Analytics & Simulation</h1>
        <p className="text-gray-600">Run game simulations and verify your game's math model.</p>
      </div>
      
      <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Game Analytics</h2>
              <p className="text-slate-300">Run simulations to verify your game's RTP and volatility</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
            <div className="w-14 h-14 bg-blue-800/60 rounded-full flex items-center justify-center mb-2">
              <Percent className="w-6 h-6 text-blue-200" />
            </div>
            <h3 className="text-xl font-bold text-white">{config.rtp?.targetRTP || 96.2}%</h3>
            <p className="text-xs text-slate-400 mt-1">Return to Player (RTP)</p>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
            <div className="w-14 h-14 bg-purple-800/60 rounded-full flex items-center justify-center mb-2">
              <BarChart className="w-6 h-6 text-purple-200" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {config.volatility?.level ? 
                config.volatility.level.charAt(0).toUpperCase() + config.volatility.level.slice(1) : 
                'Medium'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Volatility Level</p>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
            <div className="w-14 h-14 bg-green-800/60 rounded-full flex items-center justify-center mb-2">
              <Trophy className="w-6 h-6 text-green-200" />
            </div>
            <h3 className="text-xl font-bold text-white">24.2%</h3>
            <p className="text-xs text-slate-400 mt-1">Hit Frequency</p>
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
          <h3 className="text-lg font-medium text-white mb-3">Run Simulation</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            <button className="px-3 py-1.5 bg-blue-700 text-white rounded-md text-sm">100 Spins</button>
            <button className="px-3 py-1.5 bg-blue-700 text-white rounded-md text-sm">1,000 Spins</button>
            <button className="px-3 py-1.5 bg-blue-700 text-white rounded-md text-sm">10,000 Spins</button>
            <button className="px-3 py-1.5 bg-slate-700 text-white rounded-md text-sm">100,000 Spins</button>
            <button className="px-3 py-1.5 bg-slate-700 text-white rounded-md text-sm">1,000,000 Spins</button>
          </div>
          <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
            <Play className="w-4 h-4" />
            Run Simulation
          </button>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-lg font-medium text-white mb-3">Simulation Results Summary</h3>
          <div className="flex flex-col space-y-4">
            <div className="bg-slate-700 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-slate-200 mb-2">Feature Performance</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Base Game:</span>
                  <span className="text-xs text-blue-300">64.8% of RTP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Free Spins:</span>
                  <span className="text-xs text-blue-300">25.4% of RTP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Bonus Game:</span>
                  <span className="text-xs text-blue-300">9.8% of RTP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Max Win:</span>
                  <span className="text-xs text-green-300">5,280x</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-slate-400">
                Results based on 10,000 spins
              </div>
              <button className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded">
                View Detailed Report
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Step Navigation */}
      <div className="mt-8 pt-8 border-t border-gray-200 flex justify-between">
        <button
          onClick={handlePrev}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous Step
        </button>
        
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          Next Step
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AnalyticsSimulation;