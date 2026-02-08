import React from 'react';
import { useGameStore } from '../store';
import { FileText, Download, Globe, Shield } from 'lucide-react';

export const Documentation: React.FC = () => {
  const { config } = useGameStore();

  const generateGameSheet = () => {
    // This would generate documentation
    console.log('Generating game sheet...');
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-200">Documentation</h3>
            <p className="text-sm text-slate-400 mt-1">Generate detailed documentation for your game</p>
          </div>
          <button
            onClick={generateGameSheet}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Generate Documentation
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <FileText className="w-6 h-6 text-slate-400" />
            <div>
              <h4 className="font-medium text-slate-200">Game Rules</h4>
              <p className="text-sm text-slate-400">Complete rules and gameplay documentation</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <Shield className="w-6 h-6 text-slate-400" />
            <div>
              <h4 className="font-medium text-slate-200">Certification Package</h4>
              <p className="text-sm text-slate-400">RNG certification and compliance documents</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <Globe className="w-6 h-6 text-slate-400" />
            <div>
              <h4 className="font-medium text-slate-200">Localization Package</h4>
              <p className="text-sm text-slate-400">Translation files and regional configurations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Game Information</h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Game ID
              </label>
              <input
                type="text"
                value={config.id}
                readOnly
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Version
              </label>
              <input
                type="text"
                value={config.version}
                readOnly
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Game Description
            </label>
            <textarea
              value={config.theme?.description}
              readOnly
              className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};