import React, { useState, useEffect } from 'react';
import { CheckCircle, BarChart3, Database, ImageIcon, Loader } from 'lucide-react';
import { useGameStore } from '../store';
import { enhancedOpenaiClient } from '../utils/enhancedOpenaiClient';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const { config, updateConfig } = useGameStore();
  const [activeTab, setActiveTab] = useState<'api' | 'analytics' | 'ai'>('api');
  const [testingLeonardo, setTestingLeonardo] = useState(false);
  const [leonardoStatus, setLeonardoStatus] = useState<'untested' | 'success' | 'failure'>('untested');
  
  // Analytics settings
  const [playerIdParam, setPlayerIdParam] = useState('player_id');
  const [sessionIdParam, setSessionIdParam] = useState('session_id');
  const [trackSettings, setTrackSettings] = useState({
    spins: true,
    wins: true,
    features: true,
    sessionTime: true,
    betChanges: true
  });
  const [dataRetention, setDataRetention] = useState('90');
  
  useEffect(() => {
    // Load saved settings when modal opens
    if (isOpen) {
      // Set active tab to 'ai' by default to highlight the new feature
      setActiveTab('ai');
      
      // Load analytics settings
      const savedPlayerId = localStorage.getItem('analytics_player_id') || 'player_id';
      const savedSessionId = localStorage.getItem('analytics_session_id') || 'session_id';
      const savedRetention = localStorage.getItem('analytics_data_retention') || '90';
      
      setPlayerIdParam(savedPlayerId);
      setSessionIdParam(savedSessionId);
      setDataRetention(savedRetention);
      
      const savedTrackSettings = localStorage.getItem('analytics_track_settings');
      if (savedTrackSettings) {
        try {
          setTrackSettings(JSON.parse(savedTrackSettings));
        } catch (e) {
          console.error('Failed to parse saved track settings:', e);
        }
      }
      
      // Check if Leonardo.ai connection is already established
      if (config.leonardo?.lastConnected) {
        setLeonardoStatus('success');
      }
    }
  }, [isOpen, config.leonardo?.lastConnected]);

  const handleSave = () => {
    // Update store with API settings - use default local settings
    updateConfig({
      api: {
        ...config.api,
        baseUrl: 'local', // Special marker for local mode
        enabled: true // Enable API access
      },
      // Ensure Leonardo.ai settings are saved
      leonardo: {
        ...config.leonardo,
        // Only enable if there's an API key
        enabled: !!config.leonardo?.apiKey && (config.leonardo?.enabled ?? true)
      }
    });
    
    // Save analytics settings
    localStorage.setItem('analytics_player_id', playerIdParam);
    localStorage.setItem('analytics_session_id', sessionIdParam);
    localStorage.setItem('analytics_data_retention', dataRetention);
    localStorage.setItem('analytics_track_settings', JSON.stringify(trackSettings));
    
    // Save Leonardo API key to localStorage for persistence
    if (config.leonardo?.apiKey) {
      localStorage.setItem('leonardo_api_key', config.leonardo.apiKey);
      localStorage.setItem('leonardo_model', config.leonardo.modelId || 'e316348f-7773-490e-adcd-46757c738eb7');
      localStorage.setItem('leonardo_enabled', config.leonardo.enabled ? 'true' : 'false');
    }
    
    // Log what was saved for debugging
    console.log('Saved configuration:', {
      mode: 'local',
      leonardo: {
        enabled: config.leonardo?.enabled,
        modelId: config.leonardo?.modelId,
        hasApiKey: !!config.leonardo?.apiKey
      },
      analytics: {
        playerIdParam,
        sessionIdParam,
        dataRetention,
        trackSettings
      }
    });
    
    onClose();
    alert('Configuration saved! Changes will be applied immediately.');
  };
  
  const handleTrackSettingChange = (setting: keyof typeof trackSettings) => {
    setTrackSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold text-[#172B4D] mb-4">Configuration</h2>
        
        {/* Tab Navigation */}
        <div className="flex mb-4 border-b border-gray-200">
          <button 
            className={`pb-2 px-4 ${activeTab === 'api' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('api')}
          >
            <div className="flex items-center">
              <Database className="w-4 h-4 mr-1" />
              API Settings
            </div>
          </button>
          <button 
            className={`pb-2 px-4 ${activeTab === 'ai' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('ai')}
          >
            <div className="flex items-center">
              <ImageIcon className="w-4 h-4 mr-1" />
              AI Generator
            </div>
          </button>
          <button 
            className={`pb-2 px-4 ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('analytics')}
          >
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-1" />
              Analytics
            </div>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* API Settings Tab */}
          {activeTab === 'api' && (
            <>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Local Mode Enabled</h4>
                    <p className="text-sm text-gray-700">
                      The application is configured to use local placeholder images. 
                      External API integrations have been removed as requested.
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-2 bg-white rounded-md shadow-sm">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Using:</h5>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    <li>Static placeholder images</li>
                    <li>Local asset handling</li>
                    <li>Offline-capable operation</li>
                  </ul>
                </div>
              </div>
            </>
          )}
          
          {/* AI Generator Settings Tab */}
          {activeTab === 'ai' && (
            <>
              {/* Leonardo.ai Settings Section */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-start">
                  <ImageIcon className="w-5 h-5 text-purple-600 mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Leonardo.ai Image Generation</h4>
                    <p className="text-sm text-gray-700">
                      Configure Leonardo.ai for high-quality AI image generation in steps 4-7.
                    </p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Leonardo.ai API Key</label>
                    <input
                      type="password"
                      value={config.leonardo?.apiKey || ''}
                      onChange={(e) => updateConfig({
                        leonardo: {
                          ...config.leonardo,
                          apiKey: e.target.value,
                          enabled: !!e.target.value
                        }
                      })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
                      placeholder="Enter Leonardo.ai API Key"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get your API key from <a href="https://leonardo.ai/api" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Leonardo.ai API Settings</a>
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Model</label>
                    <select
                      value={config.leonardo?.modelId || 'aa77f04e-3eec-4034-9c07-d0f619684628'}
                      onChange={(e) => updateConfig({
                        leonardo: {
                          ...config.leonardo,
                          modelId: e.target.value
                        }
                      })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
                    >
                      <option value="aa77f04e-3eec-4034-9c07-d0f619684628">Leonardo Kino XL (Transparency Support)</option>
                      <option value="e316348f-7773-490e-adcd-46757c738eb7">Leonardo Diffusion XL</option>
                      <option value="f3296a34-9aef-4370-ad18-88daf26862c3">Leonardo Creative</option>
                      <option value="b6c1372f-fe9d-43b7-89f0-1b284cb5daee">Leonardo Select</option>
                      <option value="291be633-cb24-434f-898f-e662799936ad">Leonardo Signature</option>
                      <option value="b63f7119-21cb-4d22-9ead-5ad01c1c96de">Anime Model</option>
                      <option value="6bef9f1b-29cb-40c7-b9df-32b51c1f67d3">Dream Shaper</option>
                      <option value="73f52c24-e6ab-4f27-876a-2d3cb0227921">Realistic Vision</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Image Width</label>
                      <select
                        value={config.leonardo?.width || 768}
                        onChange={(e) => updateConfig({
                          leonardo: {
                            ...config.leonardo,
                            width: parseInt(e.target.value)
                          }
                        })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
                      >
                        <option value="512">512px</option>
                        <option value="576">576px</option>
                        <option value="640">640px</option>
                        <option value="704">704px</option>
                        <option value="768">768px</option>
                        <option value="832">832px</option>
                        <option value="896">896px</option>
                        <option value="960">960px</option>
                        <option value="1024">1024px</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Image Height</label>
                      <select
                        value={config.leonardo?.height || 768}
                        onChange={(e) => updateConfig({
                          leonardo: {
                            ...config.leonardo,
                            height: parseInt(e.target.value)
                          }
                        })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
                      >
                        <option value="512">512px</option>
                        <option value="576">576px</option>
                        <option value="640">640px</option>
                        <option value="704">704px</option>
                        <option value="768">768px</option>
                        <option value="832">832px</option>
                        <option value="896">896px</option>
                        <option value="960">960px</option>
                        <option value="1024">1024px</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="leonardo-prompt-magic"
                        checked={config.leonardo?.promptMagic !== false}
                        onChange={(e) => updateConfig({
                          leonardo: {
                            ...config.leonardo,
                            promptMagic: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                      />
                      <label htmlFor="leonardo-prompt-magic" className="ml-2 text-sm text-gray-700">
                        Prompt Magic
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="leonardo-alchemy"
                        checked={config.leonardo?.alchemy !== false}
                        onChange={(e) => updateConfig({
                          leonardo: {
                            ...config.leonardo,
                            alchemy: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                      />
                      <label htmlFor="leonardo-alchemy" className="ml-2 text-sm text-gray-700">
                        Alchemy
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      id="leonardo-enabled"
                      checked={!!config.leonardo?.enabled}
                      onChange={(e) => updateConfig({
                        leonardo: {
                          ...config.leonardo,
                          enabled: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                    />
                    <label htmlFor="leonardo-enabled" className="ml-2 text-sm text-gray-700 font-medium">
                      Enable Leonardo.ai Integration
                    </label>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded-md shadow-sm">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Leonardo.ai Features:</h5>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    <li>Premium quality image generation</li>
                    <li>Multiple specialized models</li>
                    <li>Prompt enhancement with Prompt Magic</li>
                    <li>Improved composition with Alchemy</li>
                  </ul>
                  
                  <button
                    onClick={async () => {
                      if (!config.leonardo?.apiKey) {
                        alert('Leonardo.ai API key is required');
                        return;
                      }
                      
                      setTestingLeonardo(true);
                      setLeonardoStatus('untested');
                      
                      try {
                        const result = await enhancedOpenaiClient.testConnection();
                        if (result) {
                          setLeonardoStatus('success');
                          updateConfig({
                            leonardo: {
                              ...config.leonardo,
                              enabled: true,
                              lastConnected: new Date().toISOString()
                            }
                          });
                        } else {
                          setLeonardoStatus('failure');
                        }
                      } catch (error) {
                        console.error('Error testing Leonardo.ai connection:', error);
                        setLeonardoStatus('failure');
                      } finally {
                        setTestingLeonardo(false);
                      }
                    }}
                    disabled={testingLeonardo || !config.leonardo?.apiKey}
                    className="mt-3 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-md text-white text-sm font-medium w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testingLeonardo ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Testing Connection...</span>
                      </>
                    ) : (
                      <span>Test GPT-Image-1 Connection</span>
                    )}
                  </button>
                  
                  {leonardoStatus === 'success' && (
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-100 text-green-700 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>GPT-Image-1 connection successful!</span>
                    </div>
                  )}
                  
                  {leonardoStatus === 'failure' && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-100 text-red-700 text-sm">
                      <p>GPT-Image-1 connection failed. Please check the API configuration and try again.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Analytics Settings Tab */}
          {activeTab === 'analytics' && (
            <>
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Parameter Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Player ID Parameter
                    </label>
                    <input
                      type="text"
                      value={playerIdParam}
                      onChange={(e) => setPlayerIdParam(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700"
                      placeholder="player_id"
                    />
                    <p className="mt-1 text-xs text-gray-500">Parameter name for tracking individual players</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session ID Parameter
                    </label>
                    <input
                      type="text"
                      value={sessionIdParam}
                      onChange={(e) => setSessionIdParam(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700"
                      placeholder="session_id"
                    />
                    <p className="mt-1 text-xs text-gray-500">Parameter name for tracking play sessions</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-md font-medium text-gray-800 mb-2">Analytics Tracking</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={trackSettings.spins}
                      onChange={() => handleTrackSettingChange('spins')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Enable Spin Tracking</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={trackSettings.wins}
                      onChange={() => handleTrackSettingChange('wins')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Enable Win Amount Tracking</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={trackSettings.features}
                      onChange={() => handleTrackSettingChange('features')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Track Feature Triggers</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={trackSettings.sessionTime}
                      onChange={() => handleTrackSettingChange('sessionTime')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Enable Session Time Tracking</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={trackSettings.betChanges}
                      onChange={() => handleTrackSettingChange('betChanges')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Track Bet Size Changes</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-2">Data Retention</h3>
                <select
                  value={dataRetention}
                  onChange={(e) => setDataRetention(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">365 days</option>
                </select>
              </div>
            </>
          )}
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#DFE1E6] rounded-md text-[#172B4D] hover:bg-[#F4F5F7]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#0052CC] text-white rounded-md hover:bg-[#0747A6]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;