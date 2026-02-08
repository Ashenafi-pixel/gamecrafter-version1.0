import React from 'react';
import { useGameStore } from '../store';
import { Trophy, Gift, Zap, Star } from 'lucide-react';

export const Features: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const { bonus } = config;

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Feature Configuration</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Free Spins
            </label>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={bonus?.freeSpins?.enabled}
                  onChange={(e) => updateConfig({
                    bonus: {
                      ...config.bonus,
                      freeSpins: {
                        ...config.bonus?.freeSpins,
                        enabled: e.target.checked
                      }
                    }
                  })}
                  className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <span className="ml-2 text-slate-300">Enable Free Spins</span>
              </label>

              {bonus?.freeSpins?.enabled && (
                <div className="space-y-4 pl-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Number of Free Spins
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={bonus?.freeSpins?.count || 10}
                      onChange={(e) => updateConfig({
                        bonus: {
                          ...config.bonus,
                          freeSpins: {
                            ...config.bonus?.freeSpins,
                            count: parseInt(e.target.value)
                          }
                        }
                      })}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Multiplier
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={bonus?.freeSpins?.multiplier || 1}
                      onChange={(e) => updateConfig({
                        bonus: {
                          ...config.bonus,
                          freeSpins: {
                            ...config.bonus?.freeSpins,
                            multiplier: parseInt(e.target.value)
                          }
                        }
                      })}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Special Features
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'expandingWilds', label: 'Expanding Wilds', icon: Star },
                { id: 'stickyWilds', label: 'Sticky Wilds', icon: Star },
                { id: 'cascadingReels', label: 'Cascading Reels', icon: Zap },
                { id: 'bonusWheel', label: 'Bonus Wheel', icon: Gift }
              ].map((feature) => (
                <label key={feature.id} className="flex items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    checked={bonus?.specialFeatures?.[feature.id]}
                    onChange={(e) => updateConfig({
                      bonus: {
                        ...config.bonus,
                        specialFeatures: {
                          ...config.bonus?.specialFeatures,
                          [feature.id]: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                  />
                  <feature.icon className="w-4 h-4 ml-3 text-slate-400" />
                  <span className="ml-2 text-slate-300">{feature.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};