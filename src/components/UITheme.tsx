import React from 'react';
import { useGameStore } from '../store';
import { Palette, Music, Image, Play } from 'lucide-react';

export const UITheme: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const { theme } = config;

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Visual Theme</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Theme Style
            </label>
            <select
              value={theme?.style || 'cartoon'}
              onChange={(e) => updateConfig({
                theme: {
                  ...config.theme,
                  style: e.target.value as any
                }
              })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
            >
              <option value="cartoon">Cartoon</option>
              <option value="realistic">Realistic</option>
              <option value="minimal">Minimal</option>
              <option value="artistic">Artistic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Color Scheme
            </label>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, index) => (
                <input
                  key={index}
                  type="color"
                  value={theme?.colorScheme?.[index] || '#000000'}
                  onChange={(e) => {
                    const newColors = [...(theme?.colorScheme || [])];
                    newColors[index] = e.target.value;
                    updateConfig({
                      theme: {
                        ...config.theme,
                        colorScheme: newColors
                      }
                    });
                  }}
                  className="w-full h-10 rounded cursor-pointer"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Sound Design</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Background Music
            </label>
            <select
              value={theme?.soundscape?.ambient || ''}
              onChange={(e) => updateConfig({
                theme: {
                  ...config.theme,
                  soundscape: {
                    ...config.theme?.soundscape,
                    ambient: e.target.value
                  }
                }
              })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
            >
              <option value="">Select style...</option>
              <option value="mysterious">Mysterious</option>
              <option value="upbeat">Upbeat</option>
              <option value="epic">Epic</option>
              <option value="relaxing">Relaxing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sound Effects
            </label>
            <div className="space-y-2">
              {[
                'Win Celebration',
                'Bonus Trigger',
                'Wild Appearance',
                'Reel Stop',
                'Button Click'
              ].map((effect) => (
                <label key={effect} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={theme?.soundscape?.effects?.includes(effect)}
                    onChange={(e) => {
                      const newEffects = e.target.checked
                        ? [...(theme?.soundscape?.effects || []), effect]
                        : (theme?.soundscape?.effects || []).filter(e => e !== effect);
                      updateConfig({
                        theme: {
                          ...config.theme,
                          soundscape: {
                            ...config.theme?.soundscape,
                            effects: newEffects
                          }
                        }
                      });
                    }}
                    className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-slate-300">{effect}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Animations</h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'spinAnimation', label: 'Spin Animation' },
              { id: 'winAnimation', label: 'Win Celebration' },
              { id: 'symbolAnimation', label: 'Symbol Effects' },
              { id: 'backgroundAnimation', label: 'Background Effects' }
            ].map((animation) => (
              <label key={animation.id} className="flex items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <input
                  type="checkbox"
                  checked={theme?.animations?.[animation.id]}
                  onChange={(e) => updateConfig({
                    theme: {
                      ...config.theme,
                      animations: {
                        ...config.theme?.animations,
                        [animation.id]: e.target.checked
                      }
                    }
                  })}
                  className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <span className="ml-2 text-slate-300">{animation.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};