import React from 'react';
import { useGameStore } from '../store';
import { Play, Image, Video, Clock } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const { splash } = config;

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-200">Splash Screen</h3>
            <p className="text-sm text-slate-400 mt-1">Configure your game's introduction screen</p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={splash?.enabled}
              onChange={(e) => updateConfig({
                splash: {
                  ...config.splash,
                  enabled: e.target.checked
                }
              })}
              className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
            />
            <span className="ml-2 text-slate-300">Enable Splash Screen</span>
          </label>
        </div>

        {splash?.enabled && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Style
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'video', label: 'Video', icon: Video },
                  { id: 'animated', label: 'Animated', icon: Play },
                  { id: 'static', label: 'Static', icon: Image }
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => updateConfig({
                      splash: {
                        ...config.splash,
                        style: style.id
                      }
                    })}
                    className={`p-4 rounded-lg border transition-all duration-200 flex flex-col items-center gap-2 ${
                      splash?.style === style.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-purple-500/50'
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <style.icon className="w-6 h-6" />
                    <span className="text-slate-200">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Duration (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={splash?.duration}
                onChange={(e) => updateConfig({
                  splash: {
                    ...config.splash,
                    duration: parseInt(e.target.value)
                  }
                })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Featured Content
              </label>
              <div className="space-y-2">
                {[
                  'Progressive Jackpots',
                  'Free Spins Feature',
                  'Bonus Games',
                  'Special Symbols',
                  'Max Win Potential'
                ].map((feature) => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={splash?.features?.includes(feature)}
                      onChange={(e) => {
                        const newFeatures = e.target.checked
                          ? [...(splash?.features || []), feature]
                          : (splash?.features || []).filter(f => f !== feature);
                        updateConfig({
                          splash: {
                            ...config.splash,
                            features: newFeatures
                          }
                        });
                      }}
                      className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-slate-300">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={splash?.showJackpots}
                  onChange={(e) => updateConfig({
                    splash: {
                      ...config.splash,
                      showJackpots: e.target.checked
                    }
                  })}
                  className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <span className="ml-2 text-slate-300">Show Jackpot Values</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={splash?.skipEnabled}
                  onChange={(e) => updateConfig({
                    splash: {
                      ...config.splash,
                      skipEnabled: e.target.checked
                    }
                  })}
                  className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <span className="ml-2 text-slate-300">Allow Skip</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {splash?.enabled && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Content Upload</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Logo Image
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-400">
                  {splash?.content?.logo || 'No file selected'}
                </div>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                  Browse
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Background Image
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-400">
                  {splash?.content?.background || 'No file selected'}
                </div>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                  Browse
                </button>
              </div>
            </div>

            {splash?.style === 'video' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Intro Video
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-400">
                    {splash?.content?.video || 'No file selected'}
                  </div>
                  <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                    Browse
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};