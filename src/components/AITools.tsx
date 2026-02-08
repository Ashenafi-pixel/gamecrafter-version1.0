import React from 'react';
import { useGameStore } from '../store';
import { Key, Image, Music } from 'lucide-react';

export const AITools: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const { ai } = config;

  const handleApiKeyUpdate = (provider: string, apiKey: string) => {
    updateConfig({
      ai: {
        ...config.ai,
        providers: {
          ...config.ai?.providers,
          [provider]: {
            ...config.ai?.providers?.[provider],
            apiKey,
            enabled: !!apiKey
          }
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">AI Integration Setup</h3>
        
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Claude API</h4>
                <p className="text-sm text-slate-400">Game analysis and suggestions</p>
              </div>
            </div>
            
            <input
              type="password"
              value={ai?.providers?.claude?.apiKey || ''}
              onChange={(e) => handleApiKeyUpdate('claude', e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
              placeholder="Enter Claude API Key"
            />
          </div>

          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">DALL-E API</h4>
                <p className="text-sm text-slate-400">Symbol and asset generation</p>
              </div>
            </div>
            
            <input
              type="password"
              value={ai?.providers?.dalle?.apiKey || ''}
              onChange={(e) => handleApiKeyUpdate('dalle', e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
              placeholder="Enter DALL-E API Key"
            />
          </div>

          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">ElevenLabs API</h4>
                <p className="text-sm text-slate-400">Sound effect generation</p>
              </div>
            </div>
            
            <input
              type="password"
              value={ai?.providers?.elevenlabs?.apiKey || ''}
              onChange={(e) => handleApiKeyUpdate('elevenlabs', e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
              placeholder="Enter ElevenLabs API Key"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Asset Generation</h3>
        
        <div className="grid gap-4">
          <button
            className="w-full p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-slate-700 rounded-lg text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!ai?.providers?.dalle?.enabled}
          >
            <h4 className="font-semibold text-slate-200 mb-1">Generate Symbol Set</h4>
            <p className="text-sm text-slate-400">Create a complete set of themed symbols</p>
          </button>

          <button
            className="w-full p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-slate-700 rounded-lg text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!ai?.providers?.dalle?.enabled}
          >
            <h4 className="font-semibold text-slate-200 mb-1">Generate Background</h4>
            <p className="text-sm text-slate-400">Create themed background artwork</p>
          </button>

          <button
            className="w-full p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-slate-700 rounded-lg text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!ai?.providers?.elevenlabs?.enabled}
          >
            <h4 className="font-semibold text-slate-200 mb-1">Generate Sound Effects</h4>
            <p className="text-sm text-slate-400">Create themed sound effects and music</p>
          </button>
        </div>
      </div>
    </div>
  );
};