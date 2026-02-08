import React from 'react';
import { useGameStore } from '../store';
import { Grid, Layers, Box } from 'lucide-react';

export const BasicSetup: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const { reels } = config;

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Grid Configuration</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Grid Shape
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'square', label: 'Square', icon: Grid },
                { id: 'landscape', label: 'Landscape', icon: Layers },
                { id: 'portrait', label: 'Portrait', icon: Box }
              ].map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => updateConfig({
                    reels: {
                      ...config.reels,
                      layout: {
                        ...config.reels?.layout,
                        shape: shape.id as any
                      }
                    }
                  })}
                  className={`p-4 rounded-lg border transition-all duration-200 flex flex-col items-center gap-2 ${
                    reels?.layout?.shape === shape.id
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-purple-500/50'
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <shape.icon className="w-6 h-6" />
                  <span className="text-slate-200">{shape.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Number of Reels
              </label>
              <input
                type="number"
                min="3"
                max="8"
                value={reels?.layout?.reels || 5}
                onChange={(e) => updateConfig({
                  reels: {
                    ...config.reels,
                    layout: {
                      ...config.reels?.layout,
                      reels: parseInt(e.target.value)
                    }
                  }
                })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Number of Rows
              </label>
              <input
                type="number"
                min="3"
                max="8"
                value={reels?.layout?.rows || 3}
                onChange={(e) => updateConfig({
                  reels: {
                    ...config.reels,
                    layout: {
                      ...config.reels?.layout,
                      rows: parseInt(e.target.value)
                    }
                  }
                })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};