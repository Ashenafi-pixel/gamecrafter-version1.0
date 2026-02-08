import React from 'react';
import { useGameStore } from '../store';
import { Star, Sparkles, Zap } from 'lucide-react';

export const SymbolsPaytable: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const { reels } = config;

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Symbol Configuration</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Total Regular Symbols
            </label>
            <input
              type="number"
              min="8"
              max="20"
              value={reels?.symbols?.total || 10}
              onChange={(e) => updateConfig({
                reels: {
                  ...config.reels,
                  symbols: {
                    ...config.reels?.symbols,
                    total: parseInt(e.target.value)
                  }
                }
              })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Special Symbols
            </label>
            <div className="space-y-4">
              {[
                { id: 'wilds', label: 'Wild Symbols', icon: Star },
                { id: 'scatters', label: 'Scatter Symbols', icon: Sparkles },
                { id: 'bonus', label: 'Bonus Symbols', icon: Zap }
              ].map((symbol) => (
                <div key={symbol.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      <symbol.icon className="w-6 h-6 text-slate-400" />
                    </div>
                    <span className="text-slate-200">{symbol.label}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={reels?.symbols?.[symbol.id] || 0}
                    onChange={(e) => updateConfig({
                      reels: {
                        ...config.reels,
                        symbols: {
                          ...config.reels?.symbols,
                          [symbol.id]: parseInt(e.target.value)
                        }
                      }
                    })}
                    className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-slate-200 text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};