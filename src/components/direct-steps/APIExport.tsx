import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store';
import { 
  Globe, ChevronLeft, Code, Server, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { slotApiClient, getApiConfig } from '../../utils/apiClient';
import { ApiResponse, GameConfiguration } from '../../utils/apiTypes';

/**
 * API Export Component
 * Provides functionality to configure API settings and export game data
 */
const APIExport: React.FC<{onNavigate?: (direction: 'next' | 'prev') => void}> = ({ onNavigate }) => {
  const { config, updateConfig } = useGameStore();
  const mountedRef = useRef(true);
  // Ensure we start with a valid API URL
  const DEFAULT_API_URL = 'https://slotsai-api.onrender.com';
  const storedApiUrl = config.api?.baseUrl || localStorage.getItem('slotai_api_url') || DEFAULT_API_URL;
  const [apiUrl, setApiUrl] = useState(
    storedApiUrl === 'local' || storedApiUrl === 'https://local' ? DEFAULT_API_URL : storedApiUrl
  );
  const [apiKey, setApiKey] = useState(config.api?.apiKey || "");
  const [apiTestStatus, setApiTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiData, setApiData] = useState<string>("");
  const [saveAsName, setSaveAsName] = useState(config.gameId || "my-slot-game");
  const [showApiData, setShowApiData] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastExportedId, setLastExportedId] = useState<string | null>(null);
  
  // Clean up and prevent memory leaks when unmounting
  useEffect(() => {
    mountedRef.current = true;
    
    // Try to restore config from sessionStorage if available
    try {
      const savedConfig = sessionStorage.getItem('preserved_game_config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig && Object.keys(parsedConfig).length > 0) {
          updateConfig(parsedConfig);
        }
      }
    } catch (error) {
      console.error("Failed to restore config:", error);
    }
    
    // Generate API data on mount
    generateApiData();
    
    // Don't try to update React state after unmounting
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Generate and format API data with enhanced error handling
  const generateApiData = () => {
    try {
      // Create complete config for API export
      const completeConfig = aggregateCompleteConfig();
      
      // Convert to API format using the documented structure
      const apiResponse = slotApiClient.convertToApiConfig(completeConfig, saveAsName);
      
      // Format as pretty JSON
      const formattedJson = JSON.stringify(apiResponse, null, 2);
      setApiData(formattedJson);
    } catch (error) {
      console.error("Failed to generate API data:", error);
      setApiData(JSON.stringify({ 
        error: "Failed to generate API data",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      }, null, 2));
    }
  };
  
  // Generate batch of symbol images with enhanced functionality
  const generateSymbolBatch = async () => {
    try {
      // Create API configuration object with validation
      let validApiUrl = apiUrl;
      
      // Strong validation for API URL
      if (!validApiUrl || 
          validApiUrl === 'local' || 
          validApiUrl === 'https://local' || 
          validApiUrl === 'http://local') {
        console.warn(`Invalid API base URL: "${validApiUrl}", using default instead`);
        validApiUrl = 'https://slotsai-api.onrender.com';
      }
      
      // Ensure proper protocol
      if (!validApiUrl.startsWith('http://') && !validApiUrl.startsWith('https://')) {
        validApiUrl = 'https://' + validApiUrl;
      }
      
      const apiConfig = {
        baseUrl: validApiUrl,
        apiKey: apiKey
      };
      
      setExportStatus('loading');
      setErrorMessage('Generating symbol set...');
      
      // Get the theme configuration
      const themeConfig = aggregateCompleteConfig().theme || {};
      
      // Use the new symbol set generation function with enhanced options
      const symbolSetResult = await slotApiClient.generateSymbolSet(
        saveAsName,
        {
          mainTheme: themeConfig.mainTheme || 'slot game',
          artStyle: themeConfig.artStyle || 'realistic',
          colorScheme: themeConfig.colorScheme || 'vibrant',
          mood: themeConfig.mood || 'exciting',
          description: themeConfig.description || ''
        },
        {
          numHigh: 3,
          numMedium: 2,
          numLow: 5,
          includeWild: true,
          includeScatter: true,
          width: 512,
          height: 512,
          transparentBackground: true,
          steps: 30,
          style: themeConfig.artStyle || 'realistic'
        },
        apiConfig
      );
      
      console.log('Symbol set generation result:', symbolSetResult);
      
      if (symbolSetResult.status === 'completed' && symbolSetResult.symbols.length > 0) {
        // Update the generated theme assets in the config
        const updatedConfig = { ...aggregateCompleteConfig() };
        
        if (!updatedConfig.theme) {
          updatedConfig.theme = {};
        }
        
        if (!updatedConfig.theme.generated) {
          updatedConfig.theme.generated = {
            symbols: [],
            background: null,
            frame: null
          };
        }
        
        // Update with the generated symbol URLs
        updatedConfig.theme.generated.symbols = symbolSetResult.symbols.map(symbol => symbol.imageUrl);
        
        // Update the store
        updateConfig(updatedConfig);
        
        setErrorMessage(`Symbols generated successfully! Created ${symbolSetResult.symbols.length} symbols.`);
        setTimeout(() => {
          setErrorMessage(null);
          setExportStatus('idle');
        }, 3000);
      } else if (symbolSetResult.status === 'processing' && symbolSetResult.batchId) {
        // Start checking status periodically for batch generation
        setErrorMessage('Symbol generation in progress... Will check status.');
        
        // Check status after a delay
        setTimeout(async () => {
          try {
            const statusResult = await slotApiClient.checkBatchStatus(symbolSetResult.batchId!, apiConfig);
            
            if (statusResult.status === 'completed' && statusResult.results) {
              // Create symbol objects from results
              const symbols = statusResult.results.map(result => {
                const idParts = result.id.split('_');
                const type = idParts.length > 1 ? idParts[0] : 'unknown';
                
                return {
                  id: result.id,
                  type,
                  imageUrl: result.imageUrl,
                  thumbnailUrl: result.thumbnailUrl
                };
              });
              
              // Update config with results
              const updatedConfig = { ...aggregateCompleteConfig() };
              
              if (!updatedConfig.theme) {
                updatedConfig.theme = {};
              }
              
              if (!updatedConfig.theme.generated) {
                updatedConfig.theme.generated = {
                  symbols: [],
                  background: null,
                  frame: null
                };
              }
              
              // Update with the generated symbol URLs
              updatedConfig.theme.generated.symbols = symbols.map(symbol => symbol.imageUrl);
              
              // Update the store
              updateConfig(updatedConfig);
              
              setErrorMessage(`Symbols generated successfully! Created ${symbols.length} symbols.`);
            } else {
              setErrorMessage(`Generation status: ${statusResult.status} (${statusResult.progress.completed}/${statusResult.progress.total})`);
            }
          } catch (statusError) {
            console.error('Error checking batch status:', statusError);
            setErrorMessage('Error checking batch status');
          } finally {
            setExportStatus('idle');
          }
        }, 5000);
      } else {
        // Handle case where generation may have failed or returned incomplete results
        setErrorMessage(symbolSetResult.message || 'Symbol generation encountered an issue');
        
        // If there are some symbols, still use them
        if (symbolSetResult.symbols.length > 0) {
          const updatedConfig = { ...aggregateCompleteConfig() };
          
          if (!updatedConfig.theme) {
            updatedConfig.theme = {};
          }
          
          if (!updatedConfig.theme.generated) {
            updatedConfig.theme.generated = {
              symbols: [],
              background: null,
              frame: null
            };
          }
          
          // Update with available symbol URLs
          updatedConfig.theme.generated.symbols = symbolSetResult.symbols.map(symbol => symbol.imageUrl);
          
          // Update the store
          updateConfig(updatedConfig);
        }
        
        setExportStatus('idle');
      }
    } catch (error) {
      console.error('Error generating symbol set:', error);
      setErrorMessage(`Error generating symbols: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setExportStatus('idle');
    }
  };
  
  // Generate background image with enhanced functionality
  const generateBackground = async () => {
    try {
      // Create API configuration object with validation
      let validApiUrl = apiUrl;
      
      // Strong validation for API URL
      if (!validApiUrl || 
          validApiUrl === 'local' || 
          validApiUrl === 'https://local' || 
          validApiUrl === 'http://local') {
        console.warn(`Invalid API base URL: "${validApiUrl}", using default instead`);
        validApiUrl = 'https://slotsai-api.onrender.com';
      }
      
      // Ensure proper protocol
      if (!validApiUrl.startsWith('http://') && !validApiUrl.startsWith('https://')) {
        validApiUrl = 'https://' + validApiUrl;
      }
      
      const apiConfig = {
        baseUrl: validApiUrl,
        apiKey: apiKey
      };
      
      setExportStatus('loading');
      setErrorMessage('Generating background...');
      
      // Get the theme configuration
      const themeConfig = aggregateCompleteConfig().theme || {};
      
      // Use the new background generation function
      const backgroundResult = await slotApiClient.generateBackground(
        saveAsName,
        {
          mainTheme: themeConfig.mainTheme || 'slot game',
          artStyle: themeConfig.artStyle || 'realistic',
          colorScheme: themeConfig.colorScheme || 'vibrant',
          mood: themeConfig.mood || 'exciting',
          description: themeConfig.description || ''
        },
        {
          // Use landscape mode for background
          landscape: true,
          width: 1920,
          height: 1080,
          steps: 40, // Higher quality for backgrounds
          style: themeConfig.artStyle || 'realistic'
        },
        apiConfig
      );
      
      console.log('Background generation result:', backgroundResult);
      
      if (backgroundResult.success) {
        // Update the config with the generated background
        const updatedConfig = { ...aggregateCompleteConfig() };
        
        if (!updatedConfig.theme) {
          updatedConfig.theme = {};
        }
        
        if (!updatedConfig.theme.generated) {
          updatedConfig.theme.generated = {
            symbols: [],
            background: null,
            frame: null
          };
        }
        
        // Update the background URL
        updatedConfig.theme.generated.background = backgroundResult.imageUrl;
        
        // Update the store
        updateConfig(updatedConfig);
        
        setErrorMessage('Background generated successfully!');
        setTimeout(() => {
          setErrorMessage(null);
          setExportStatus('idle');
        }, 3000);
      } else {
        setErrorMessage(backgroundResult.message || 'Background generation failed');
        setExportStatus('idle');
      }
    } catch (error) {
      console.error('Error generating background:', error);
      setErrorMessage(`Error generating background: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setExportStatus('idle');
    }
  };
  
  // Aggregate data from all configuration steps
  const aggregateCompleteConfig = () => {
    // Start with current config
    const completeConfig = { ...config };
    
    // Ensure required structures exist
    if (!completeConfig.gameId) completeConfig.gameId = saveAsName;
    if (!completeConfig.api) completeConfig.api = { baseUrl: apiUrl, apiKey };
    
    // Update API settings from component state
    completeConfig.api.baseUrl = apiUrl;
    completeConfig.api.apiKey = apiKey;
    
    return completeConfig;
  };
  
  // Update config in store
  const updateApiSettings = () => {
    const updatedConfig = {
      ...config,
      gameId: saveAsName,
      api: {
        ...(config.api || {}),
        baseUrl: apiUrl,
        apiKey: apiKey
      }
    };
    
    updateConfig(updatedConfig);
    generateApiData();
  };
  
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
    const updatedConfig = {
      ...config,
      api: {
        ...(config.api || {}),
        baseUrl: apiUrl,
        apiKey: apiKey
      }
    };
    sessionStorage.setItem('preserved_game_config', JSON.stringify(updatedConfig));
    
    // Create a completely new page load to fully reset React
    document.body.appendChild(form);
    
    // Use a timeout to ensure this happens outside React's reconciliation
    setTimeout(() => {
      form.submit();
    }, 0);
  };
  
  // Navigate to the previous step
  const handlePrev = () => {
    // Save current API settings first
    updateApiSettings();
    
    if (onNavigate) {
      onNavigate('prev');
    } else {
      navigateDirectly(8);
    }
  };
  
  // Handle API connection test with enhanced API feature detection
  const handleTestConnection = async () => {
    setApiTestStatus('loading');
    
    try {
      // Update the API settings
      updateApiSettings();
      
      // Create API config object with validation
      let validApiUrl = apiUrl;
      
      // Strong validation for API URL
      if (!validApiUrl || 
          validApiUrl === 'local' || 
          validApiUrl === 'https://local' || 
          validApiUrl === 'http://local') {
        console.warn(`Invalid API base URL: "${validApiUrl}", using default instead`);
        validApiUrl = DEFAULT_API_URL;
      }
      
      // Ensure proper protocol
      if (!validApiUrl.startsWith('http://') && !validApiUrl.startsWith('https://')) {
        validApiUrl = 'https://' + validApiUrl;
      }
      
      const apiConfig = {
        baseUrl: validApiUrl,
        apiKey: apiKey
      };
      
      // Test the connection with new detailed information
      const connectionResult = await slotApiClient.testConnection(apiConfig);
      
      // Update error message with detailed API availability
      if (connectionResult.success) {
        setApiTestStatus('success');
        
        // Display message about available features
        if (connectionResult.features) {
          const availableFeatures = Object.entries(connectionResult.features)
            .filter(([_, enabled]) => enabled)
            .map(([name, _]) => name)
            .join(", ");
            
          if (availableFeatures) {
            setErrorMessage(`API connected! Available features: ${availableFeatures}`);
          } else {
            setErrorMessage("API connected but no specific features detected");
          }
        } else {
          setErrorMessage("API connection successful");
        }
        
        // Reset status after delay
        setTimeout(() => {
          if (mountedRef.current) {
            setApiTestStatus('idle');
            setErrorMessage(null);
          }
        }, 5000);
      } else {
        setApiTestStatus('error');
        setErrorMessage(connectionResult.message || "API connection failed");
        setTimeout(() => {
          if (mountedRef.current) {
            setApiTestStatus('idle');
            setErrorMessage(null);
          }
        }, 5000);
      }
    } catch (error) {
      console.error("APIExport: API connection test failed:", error);
      setApiTestStatus('error');
      setErrorMessage(error instanceof Error ? error.message : "Unknown connection error");
      setTimeout(() => {
        if (mountedRef.current) {
          setApiTestStatus('idle');
          setErrorMessage(null);
        }
      }, 5000);
    }
  };
  
  // Handle game export
  const handleExportGame = async () => {
    setExportStatus('loading');
    setErrorMessage(null);
    
    try {
      // Update the API settings first
      updateApiSettings();
      
      // Validate game ID
      if (!saveAsName || saveAsName.trim() === '') {
        throw new Error('Game ID is required. Please provide a unique identifier for your game.');
      }
      
      // Create API config object with validation
      const apiConfig = {
        baseUrl: apiUrl,
        apiKey: apiKey
      };
      
      // Create/update the configuration on the API
      const completeConfig = aggregateCompleteConfig();
      
      console.log("Exporting with game ID:", saveAsName);
      console.log("API config:", apiConfig);
      
      // Test API connection first if the export URL is different from the last test
      if (apiTestStatus !== 'success') {
        const connectionTest = await slotApiClient.testConnection(apiConfig);
        if (!connectionTest) {
          throw new Error(
            'Cannot connect to API server. Please check your API URL ' +
            'and ensure the server is running. You can still continue in offline mode.'
          );
        }
      }
      
      // First attempt: Try creating a new configuration
      let success = false;
      let exportError = null;
      
      try {
        // Create a new configuration using our improved client with multiple format attempts
        console.log("Attempting to create a new configuration");
        const result = await slotApiClient.createConfiguration(
          {
            gameId: saveAsName,
            theme: completeConfig.theme || {},
            bet: completeConfig.bet || {},
            rtp: completeConfig.rtp,
            reels: completeConfig.reels,
            volatility: completeConfig.volatility,
            bonus: completeConfig.bonus,
            audio: completeConfig.audio,
            playerExperience: completeConfig.playerExperience,
            mobile: completeConfig.mobile
          }, 
          apiConfig
        );
        console.log("Successfully created new configuration:", result);
        success = true;
        setLastExportedId(saveAsName);
      } catch (createError) {
        console.error("Failed to create configuration:", createError);
        exportError = createError;
        
        // Second attempt: Try updating an existing configuration
        try {
          console.log("Attempting to update existing configuration");
          const result = await slotApiClient.updateConfiguration(
            saveAsName,
            {
              gameId: saveAsName,
              theme: completeConfig.theme || {},
              bet: completeConfig.bet || {},
              rtp: completeConfig.rtp,
              reels: completeConfig.reels,
              volatility: completeConfig.volatility,
              bonus: completeConfig.bonus,
              audio: completeConfig.audio,
              playerExperience: completeConfig.playerExperience,
              mobile: completeConfig.mobile
            },
            apiConfig
          );
          console.log("Successfully updated existing configuration:", result);
          success = true;
          setLastExportedId(saveAsName);
        } catch (updateError) {
          console.error("Failed to update configuration:", updateError);
          exportError = updateError;
          
          // Third attempt: Try using direct API structure as a last resort
          try {
            console.log("Attempting with simplified format as last resort");
            // This uses just the minimal required fields
            const minimalConfig = {
              gameId: saveAsName,
              theme: {
                mainTheme: completeConfig.theme?.mainTheme || "Basic Theme",
                artStyle: completeConfig.theme?.artStyle || "cartoon",
                colorScheme: completeConfig.theme?.colorScheme || "warm-vibrant",
                mood: completeConfig.theme?.mood || "playful",
                description: completeConfig.theme?.description || "Basic slot game configuration"
              },
              bet: {
                min: completeConfig.bet?.min || 0.20,
                max: completeConfig.bet?.max || 100,
                increment: completeConfig.bet?.increment || 0.20
              }
            };
            
            // Try to create a minimal version
            const result = await slotApiClient.createConfiguration(minimalConfig, apiConfig);
            console.log("Successfully created minimal configuration:", result);
            success = true;
            setLastExportedId(saveAsName);
          } catch (minimalError) {
            console.error("Even minimal format failed:", minimalError);
            exportError = minimalError;
            
            // Final attempt: Try direct fetch as absolute last resort
            try {
              console.log("Final attempt: direct fetch API call");
              const directResult = await fetch(`${apiConfig.baseUrl}/v1/configurations`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  ...(apiConfig.apiKey ? { 'Authorization': `Bearer ${apiConfig.apiKey}` } : {})
                },
                body: JSON.stringify({
                  id: saveAsName,
                  config: {
                    gameId: saveAsName,
                    theme: {
                      mainTheme: completeConfig.theme?.mainTheme || "Basic Theme",
                    },
                    bet: {
                      min: 0.20,
                      max: 100
                    }
                  }
                })
              });
              
              console.log(`Direct API call response: ${directResult.status}`);
              if (directResult.ok) {
                console.log("Direct API call succeeded");
                success = true;
                setLastExportedId(saveAsName);
              } else {
                const errorText = await directResult.text();
                console.error(`Direct API call failed: ${errorText}`);
                throw new Error(`API Error (${directResult.status}): ${errorText}`);
              }
            } catch (directError) {
              console.error("Direct API call also failed:", directError);
              exportError = directError;
            }
          }
        }
      }
      
      if (success) {
        setExportStatus('success');
        setErrorMessage(null);
        
        // Store successful game ID for future reference
        localStorage.setItem('last_exported_game_id', saveAsName);
        
        setTimeout(() => {
          if (mountedRef.current) setExportStatus('idle');
        }, 3000);
      } else {
        throw exportError || new Error("Failed to export game configuration after multiple attempts");
      }
    } catch (error) {
      console.error("APIExport: Game export failed:", error);
      
      // Display user-friendly error message
      let errorMsg = "Failed to export game configuration";
      
      if (error instanceof Error) {
        // Format specific error types
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMsg = "Network error: Could not connect to the API server. Please check your API URL and ensure the server is running.";
        } else if (error.message.includes('timeout')) {
          errorMsg = "Request timed out: The API server took too long to respond.";
        } else if (error.message.includes('CORS')) {
          errorMsg = "CORS error: The API server does not allow cross-origin requests from this application.";
        } else if (error.message.includes('Format')) {
          errorMsg = "Format error: The API server could not understand the request format. Check API requirements.";
        } else if (error.message.includes('multiple formats')) {
          errorMsg = "The API rejected all request formats. Please check your API documentation for the required format.";
        } else {
          // Use the actual error message
          errorMsg = error.message;
        }
      }
      
      // Save the error message to display to the user
      setErrorMessage(errorMsg);
      setExportStatus('error');
      
      // Reset status after a delay
      setTimeout(() => {
        if (mountedRef.current) setExportStatus('idle');
      }, 5000);
    }
  };
  
  // Handle loading a game from the library
  const handleLoadGame = async (gameId: string) => {
    try {
      // Create API config object with validation
      let validApiUrl = apiUrl;
      
      // Strong validation for API URL
      if (!validApiUrl || 
          validApiUrl === 'local' || 
          validApiUrl === 'https://local' || 
          validApiUrl === 'http://local') {
        console.warn(`Invalid API base URL: "${validApiUrl}", using default instead`);
        validApiUrl = DEFAULT_API_URL;
      }
      
      // Ensure proper protocol
      if (!validApiUrl.startsWith('http://') && !validApiUrl.startsWith('https://')) {
        validApiUrl = 'https://' + validApiUrl;
      }
      
      const apiConfig = {
        baseUrl: validApiUrl,
        apiKey: apiKey
      };
      
      // Get the game configuration
      const gameConfiguration = await slotApiClient.getConfiguration(gameId, {}, apiConfig);
      
      // Convert to SlotAI config format
      const slotaiConfig = slotApiClient.convertFromApiConfig(gameConfiguration);
      
      // Update the store
      updateConfig(slotaiConfig);
      
      // Update the save name
      setSaveAsName(gameId);
      
      // Regenerate API data
      generateApiData();
      
      alert(`Game "${gameId}" loaded successfully!`);
    } catch (error) {
      console.error(`Failed to load game ${gameId}:`, error);
      alert(`Failed to load game "${gameId}". Please check your API connection.`);
    }
  };
  
  // Toggle API data display
  const toggleApiData = () => {
    // Regenerate API data when showing
    if (!showApiData) {
      generateApiData();
    }
    setShowApiData(!showApiData);
  };
  
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">API & Export</h1>
        <p className="text-gray-600">Configure API connection and export your game.</p>
      </div>
      
      <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">API Connection</h2>
              <p className="text-slate-300">Connect to your game server API</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="text-lg font-medium text-white mb-2">API URL</h3>
            <input 
              type="text" 
              className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded"
              placeholder="Enter API URL"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
            <p className="text-slate-400 text-sm mt-2">The endpoint URL for your game server API</p>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="text-lg font-medium text-white mb-2">API Key (Optional)</h3>
            <input 
              type="password" 
              className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded"
              placeholder="Enter API Key if required"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-slate-400 text-sm mt-2">Security key if your API requires authentication</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="text-lg font-medium text-white mb-2">Game Library</h3>
            <div className="bg-slate-700 p-3 rounded text-white max-h-48 overflow-y-auto">
              <div className="mb-2 p-2 bg-slate-600 rounded flex justify-between items-center">
                <span>wild-west-adventure</span>
                <button 
                  className="px-2 py-1 bg-blue-600 rounded text-xs"
                  onClick={() => handleLoadGame('wild-west-adventure')}
                >
                  Load
                </button>
              </div>
              <div className="mb-2 p-2 bg-slate-600 rounded flex justify-between items-center">
                <span>space-odyssey</span>
                <button 
                  className="px-2 py-1 bg-blue-600 rounded text-xs"
                  onClick={() => handleLoadGame('space-odyssey')}
                >
                  Load
                </button>
              </div>
              <div className="mb-2 p-2 bg-slate-600 rounded flex justify-between items-center">
                <span>egyptian-treasures</span>
                <button 
                  className="px-2 py-1 bg-blue-600 rounded text-xs"
                  onClick={() => handleLoadGame('egyptian-treasures')}
                >
                  Load
                </button>
              </div>
            </div>
            <p className="text-slate-400 text-sm mt-2">Your saved games in the API</p>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="text-lg font-medium text-white mb-2">Export Options</h3>
            <div className="mb-4">
              <label className="text-sm text-slate-300 block mb-1">Save As</label>
              <input 
                type="text" 
                className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded"
                placeholder="Game ID for export"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox text-blue-600" defaultChecked />
                <span className="text-slate-300">Include assets</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox text-blue-600" defaultChecked />
                <span className="text-slate-300">Generate documentation</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox text-blue-600" />
                <span className="text-slate-300">Optimize for mobile</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="mb-6 bg-gradient-to-r from-green-900/30 to-teal-900/30 rounded-xl border border-green-800/30 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-300">Asset Generation</h3>
              <p className="text-sm text-green-200/70">Generate game assets using the API</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-800/70 p-4 rounded-lg border border-green-900/30">
              <h4 className="text-md font-medium text-green-300 mb-3">Symbol Set</h4>
              <p className="text-sm text-slate-300 mb-3">
                Generate a complete set of slot symbols (wild, scatter, high/medium/low) for your game theme.
              </p>
              <button
                onClick={generateSymbolBatch}
                disabled={exportStatus === 'loading' || !saveAsName.trim()}
                className="w-full px-3 py-2 bg-green-700 hover:bg-green-600 rounded-md text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${exportStatus === 'loading' ? 'animate-spin' : ''}`} />
                <span>Generate Symbol Set</span>
              </button>
            </div>
            
            <div className="bg-slate-800/70 p-4 rounded-lg border border-green-900/30">
              <h4 className="text-md font-medium text-green-300 mb-3">Background Art</h4>
              <p className="text-sm text-slate-300 mb-3">
                Generate a themed background for your slot game based on your theme settings.
              </p>
              <button
                onClick={generateBackground}
                disabled={exportStatus === 'loading' || !saveAsName.trim()}
                className="w-full px-3 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-md text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${exportStatus === 'loading' ? 'animate-spin' : ''}`} />
                <span>Generate Background</span>
              </button>
            </div>
          </div>
          
          <div className="text-sm text-slate-400 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="mb-2">
              <strong className="text-green-300">Note:</strong> Generated assets are automatically added to your game configuration 
              and will be included when you export your game.
            </p>
            <p>
              All assets use the game's theme settings to create cohesive visuals that match your slot game's style and mood.
            </p>
          </div>
        </div>
        
        {/* API Data Preview */}
        <div className="mb-6">
          <button
            onClick={toggleApiData}
            className="w-full text-left px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center">
              <Server className="w-5 h-5 mr-2 text-blue-500" />
              <span className="font-medium">API Data Preview</span>
            </div>
            <span className="text-sm text-slate-400">{showApiData ? 'Hide' : 'Show'}</span>
          </button>
          
          {showApiData && (
            <div className="mt-3 bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="bg-slate-900 p-3 rounded max-h-80 overflow-auto">
                <pre className="text-xs text-green-400 whitespace-pre-wrap">
                  {apiData}
                </pre>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={generateApiData}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Display error message if there is one */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-700/20 border border-red-800/30 rounded-lg">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1 text-red-300">Error</h4>
                <p className="text-sm text-red-200">{errorMessage}</p>
                
                {errorMessage.includes('API server') && (
                  <div className="mt-2 text-xs bg-red-900/50 p-2 rounded border border-red-800/50">
                    <p className="font-medium text-red-300">Troubleshooting:</p>
                    <ul className="list-disc list-inside mt-1 text-red-300/80 space-y-1">
                      <li>Verify the API URL is correct and the server is running</li>
                      <li>Try the Test Connection button first to validate connectivity</li>
                      <li>Check API documentation for required request format</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Last exported game notification */}
        {lastExportedId && exportStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-800/20 border border-green-800/30 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1 text-green-300">Export Successful</h4>
                <p className="text-sm text-green-200">
                  Game configuration exported successfully with ID: <strong>{lastExportedId}</strong>
                </p>
                <p className="text-xs mt-1 text-green-300/70">
                  Your game data is now available on the API server and can be accessed using this ID.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
          <button
            onClick={handleTestConnection}
            className={`px-6 py-3 ${
              apiTestStatus === 'loading' ? 'bg-blue-500' :
              apiTestStatus === 'success' ? 'bg-green-600' :
              apiTestStatus === 'error' ? 'bg-red-600' :
              'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-lg transition-colors flex items-center justify-center`}
            disabled={apiTestStatus === 'loading'}
          >
            {apiTestStatus === 'loading' && (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            )}
            {apiTestStatus === 'success' && (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {apiTestStatus === 'error' && (
              <XCircle className="w-5 h-5 mr-2" />
            )}
            {apiTestStatus === 'idle' ? 'Test Connection' : 
             apiTestStatus === 'loading' ? 'Testing...' :
             apiTestStatus === 'success' ? 'Connection Successful' :
             'Connection Failed'}
          </button>
          
          <button
            onClick={handleExportGame}
            className={`px-6 py-3 ${
              exportStatus === 'loading' ? 'bg-blue-500 animate-pulse' :
              exportStatus === 'success' ? 'bg-green-600' :
              exportStatus === 'error' ? 'bg-red-600' :
              'bg-green-600 hover:bg-green-700'
            } text-white rounded-lg transition-colors flex items-center justify-center font-medium`}
            disabled={exportStatus === 'loading'}
          >
            {exportStatus === 'loading' && (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            )}
            {exportStatus === 'success' && (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {exportStatus === 'error' && (
              <XCircle className="w-5 h-5 mr-2" />
            )}
            {exportStatus === 'idle' ? 'Export Game to API' : 
             exportStatus === 'loading' ? 'Exporting...' :
             exportStatus === 'success' ? 'Export Successful' :
             'Export Failed - Try Again'}
          </button>
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
      </div>
    </div>
  );
};

export default APIExport;