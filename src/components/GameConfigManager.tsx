import React, { useState } from 'react';
import { Save, Download, Trash2, Plus } from 'lucide-react';
import { useGameConfigManager } from '../hooks/useGameConfigManager';

const GameConfigManager: React.FC = () => {
  const { savedConfigs, saveConfig, loadConfig, deleteConfig } = useGameConfigManager();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [configName, setConfigName] = useState('');

  const handleSave = () => {
    if (configName.trim()) {
      saveConfig(configName.trim());
      setConfigName('');
      setShowSaveDialog(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Game Configurations</h3>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Save Config
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <input
            type="text"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            placeholder="Enter configuration name..."
            className="w-full px-3 py-2 bg-gray-600 text-white rounded mb-2"
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved Configurations */}
      <div className="space-y-2">
        {savedConfigs.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No saved configurations</p>
        ) : (
          savedConfigs.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              <div className="flex-1">
                <h4 className="text-white font-medium">{config.name}</h4>
                <p className="text-gray-400 text-sm">
                  {new Date(config.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadConfig(config.id)}
                  className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  title="Load Configuration"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteConfig(config.id)}
                  className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                  title="Delete Configuration"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GameConfigManager;