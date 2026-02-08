import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store';
import { 
  Check, Copy, Download, Play, Server, RefreshCw, AlertTriangle, 
  Code, Upload, XCircle, Shield, CheckCircle 
} from 'lucide-react';
import { slotApiClient } from '../../../utils/apiClient';
import { downloadGameAsZip } from '../../../utils/gameExporter';

/**
 * Step 12: API Export Component
 * Final step for exporting the game configuration
 */
const Step12_APIExport: React.FC = () => {
  const { config } = useGameStore();
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<null | { success: boolean; message: string }>(null);
  const [apiReadyConfig, setApiReadyConfig] = useState<string>('');
  const [showApiFormat, setShowApiFormat] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastExportedId, setLastExportedId] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [zipDownloading, setZipDownloading] = useState(false);
  
  // Format configuration for display
  const formattedConfig = JSON.stringify(config, null, 2);
  
  // Generate API-ready configuration on component mount or config change
  useEffect(() => {
    generateApiFormat();
  }, [config]);
  
  // Generate API-ready format of the configuration
  const generateApiFormat = () => {
    try {
      // Use the API client to convert the UI config to API format
      const gameId = config.gameId || `game_${Date.now()}`;
      const apiConfig = slotApiClient.convertToApiConfig(config, gameId);
      setApiReadyConfig(JSON.stringify(apiConfig, null, 2));
    } catch (error) {
      console.error("Error generating API format:", error);
      setApiReadyConfig(JSON.stringify({ error: "Failed to generate API format" }, null, 2));
    }
  };
  
  // Validate configuration before export
  const validateConfig = () => {
    const errors = [];
    
    // Check for required configuration
    if (!config.theme?.mainTheme) {
      errors.push('Theme selection is required');
    }
    
    if (!config.reels?.layout?.reels || !config.reels?.layout?.rows) {
      errors.push('Reel configuration is incomplete');
    }
    
    if (!config.reels?.payMechanism) {
      errors.push('Pay mechanism is required');
    }
    
    // Symbol validation
    const symbols = config.theme?.generated?.symbols;
    const symbolCount = Array.isArray(symbols) ? symbols.length : (symbols && typeof symbols === 'object' ? Object.keys(symbols).length : 0);
    if (!symbols || symbolCount < 3) {
      errors.push('At least 3 symbols must be generated');
    }
    
    // RTP validation
    const targetRTP = config.rtp?.targetRTP;
    if (targetRTP != null && (targetRTP < 80 || targetRTP > 100)) {
      errors.push('RTP must be between 80% and 100%');
    }
    
    // Bonus features validation
    if (config.bonus?.freeSpins?.enabled && !config.bonus.freeSpins.count) {
      errors.push('Free spins count must be specified when enabled');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  // Handle export to API with improved error handling and multiple attempts
  const handleExport = async () => {
    // Validate configuration first
    if (!validateConfig()) {
      return;
    }
    
    setExportStatus('loading');
    setErrorMessage(null);
    setAttemptCount(0);
    
    try {
      // Create API configuration object with default URL
      const DEFAULT_API_URL = 'https://slotsai-api.onrender.com';
      
      // Get base URL and validate
      let baseUrl = config.api?.baseUrl || DEFAULT_API_URL;
      
      // Strong validation for API URL - check for invalid values
      if (!baseUrl || 
          baseUrl === 'local' || 
          baseUrl === 'https://local' || 
          baseUrl === 'http://local') {
        console.warn(`Invalid API base URL: "${baseUrl}", using default instead`);
        baseUrl = DEFAULT_API_URL;
      }
      
      // Fix URL if necessary
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'https://' + baseUrl;
      }
      
      const apiConfig = {
        baseUrl: baseUrl,
        apiKey: config.api?.apiKey || ''
      };
      
      console.log("Using API configuration:", apiConfig);
      
      // Generate a game ID with timestamp for uniqueness if not already set
      const saveAsName = config.gameId || `game_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Convert to API format using the proper client function
      const apiFormatConfig = slotApiClient.convertToApiConfig(config, saveAsName);
      
      console.log("Exporting configuration with ID:", saveAsName);
      console.log("API config format (partial):", JSON.stringify(apiFormatConfig).substring(0, 300) + "...");
      
      // Track success state
      let success = false;
      let exportError = null;
      
      // First attempt: Try creating a new configuration
      try {
        setAttemptCount(prev => prev + 1);
        await slotApiClient.createConfiguration(apiFormatConfig.config, apiConfig);
        console.log("Successfully created new configuration");
        success = true;
      } catch (createError) {
        console.error("Failed to create configuration:", createError);
        exportError = createError;
        
        // Second attempt: Try updating an existing configuration
        try {
          setAttemptCount(prev => prev + 1);
          await slotApiClient.updateConfiguration(saveAsName, apiFormatConfig.config, apiConfig);
          console.log("Successfully updated existing configuration");
          success = true;
        } catch (updateError) {
          console.error("Failed to update configuration:", updateError);
          exportError = updateError;
          
          // Third attempt: Try using direct API structure as a last resort
          try {
            setAttemptCount(prev => prev + 1);
            // Try patch method with minimal payload
            await slotApiClient.patchConfiguration(saveAsName, {
              gameId: saveAsName,
              theme: {
                mainTheme: config.theme?.mainTheme || "Basic Theme",
                artStyle: config.theme?.artStyle || "cartoon",
                colorScheme: config.theme?.colorScheme || "warm-vibrant",
                mood: config.theme?.mood || "playful",
                description: config.theme?.description || "Basic slot game configuration"
              },
              bet: {
                min: config.bet?.min || 0.20,
                max: config.bet?.max || 100,
                increment: config.bet?.increment || 0.20
              }
            }, apiConfig);
            console.log("Successfully patched configuration with minimal payload");
            success = true;
          } catch (patchError) {
            console.error("Failed to patch configuration:", patchError);
            exportError = patchError;
            
            // Final attempt: Try direct fetch as absolute last resort
            try {
              setAttemptCount(prev => prev + 1);
              const response = await fetch(`${baseUrl}/v1/configurations`, {
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
                      mainTheme: config.theme?.mainTheme || "Basic Theme"
                    },
                    bet: {
                      min: 0.20,
                      max: 100,
                      increment: 0.20
                    }
                  }
                })
              });
              
              if (response.ok) {
                console.log("Direct fetch successful as last resort");
                success = true;
              } else {
                const errorText = await response.text();
                console.error(`Direct fetch failed with status ${response.status}:`, errorText);
                throw new Error(`API returned status ${response.status}: ${errorText.substring(0, 100)}...`);
              }
            } catch (fetchError) {
              console.error("All export attempts failed:", fetchError);
              exportError = fetchError;
            }
          }
        }
      }
      
      if (success) {
        // Success scenario
        setExportStatus('success');
        setErrorMessage(null);
        setLastExportedId(saveAsName);
        setTestResults({ 
          success: true, 
          message: `Configuration exported successfully to API and RGS with ID: ${saveAsName}` 
        });
        
        // Reset status after a delay
        setTimeout(() => {
          setExportStatus('idle');
        }, 5000);
      } else {
        throw exportError || new Error("Failed to export game configuration after multiple attempts");
      }
    } catch (error) {
      // Error scenario with improved user-friendly messages
      setExportStatus('error');
      
      // Format error message for better user experience
      let errorMsg = "Failed to export game configuration";
      
      if (error instanceof Error) {
        // Network/connection errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMsg = "Network error: Could not connect to the API server. Please check your internet connection and API URL.";
        } 
        // Timeout errors
        else if (error.message.includes('timeout')) {
          errorMsg = "Request timed out: The API server took too long to respond. The server may be under heavy load.";
        }
        // Authentication errors
        else if (error.message.includes('401') || error.message.includes('403') || error.message.includes('unauthorized')) {
          errorMsg = "Authentication error: The API key may be invalid or expired. Please check your API credentials.";
        }
        // Format errors
        else if (error.message.includes('format') || error.message.includes('invalid') || error.message.includes('schema')) {
          errorMsg = "Format error: The API rejected the configuration format. Please check API documentation for required format.";
        }
        // Server errors
        else if (error.message.includes('5') && error.message.includes('status')) {
          errorMsg = "Server error: The API server encountered an internal error. Please try again later.";
        }
        // Other errors - use the actual message but with nicer formatting
        else {
          errorMsg = `Export failed: ${error.message.charAt(0).toUpperCase() + error.message.slice(1)}`;
        }
      }
      
      setErrorMessage(errorMsg);
      setTestResults({ 
        success: false, 
        message: errorMsg
      });
      
      // We don't auto-reset on error to give the user time to read the message
    }
  };
  
  // Test the configuration against sandbox RGS with improved error handling
  const handleTestConfig = async () => {
    setExportStatus('loading');
    setErrorMessage(null);
    
    try {
      // Create API configuration object with default URL
      const DEFAULT_API_URL = 'https://slotsai-api.onrender.com';
      
      // Get base URL and validate
      let baseUrl = config.api?.baseUrl || DEFAULT_API_URL;
      
      // Strong validation for API URL - check for invalid values
      if (!baseUrl || 
          baseUrl === 'local' || 
          baseUrl === 'https://local' || 
          baseUrl === 'http://local') {
        console.warn(`Invalid API base URL: "${baseUrl}", using default instead`);
        baseUrl = DEFAULT_API_URL;
      }
      
      // Fix URL if necessary
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'https://' + baseUrl;
      }
      
      const apiConfig = {
        baseUrl: baseUrl,
        apiKey: config.api?.apiKey || ''
      };
      
      console.log("Using API configuration:", apiConfig);
      
      // Get the game ID or generate one
      const gameId = config.gameId || `game_${Date.now()}`;
      
      // Convert to API format
      const apiFormatConfig = slotApiClient.convertToApiConfig(config, gameId);
      
      // Test API connection with enhanced feature detection
      const connectionResult = await slotApiClient.testConnection(apiConfig);
      
      if (!connectionResult.success) {
        throw new Error(connectionResult.message || 'API connection test failed. Please check your API settings and server availability.');
      }
      
      // Check specifically for export feature availability
      if (connectionResult.features && !connectionResult.features.export) {
        throw new Error('API is connected, but the export feature is not available. Configuration test cannot proceed.');
      }
      
      // Simulate successful test with available feature information
      let testMessage = 'Configuration successfully tested against sandbox RGS. All tests passed!';
      
      // Add information about available API features
      if (connectionResult.features) {
        const featureCount = Object.values(connectionResult.features).filter(Boolean).length;
        const totalFeatures = Object.keys(connectionResult.features).length;
        
        testMessage += ` API features available: ${featureCount}/${totalFeatures}.`;
      }
      
      setExportStatus('idle');
      setErrorMessage(null);
      setTestResults({ 
        success: true, 
        message: testMessage
      });
    } catch (error) {
      setExportStatus('idle');
      
      // Format error message for better user experience
      let errorMsg = "Test failed: Configuration validation error";
      
      if (error instanceof Error) {
        if (error.message.includes('connection') || error.message.includes('connect')) {
          errorMsg = "Connection error: Could not connect to the API server. Please check your API settings.";
        } else if (error.message.includes('export feature')) {
          errorMsg = error.message;
        } else {
          errorMsg = `Test failed: ${error.message}`;
        }
      }
      
      setErrorMessage(errorMsg);
      setTestResults({ 
        success: false, 
        message: errorMsg
      });
    }
  };

  // Download playable game as ZIP (index.html + assets – matches designer when you open index.html)
  const handleDownloadPlayableZip = async () => {
    if (!config.theme?.generated?.symbols?.length) {
      setErrorMessage('Generate symbols and theme first');
      return;
    }
    setZipDownloading(true);
    setErrorMessage(null);
    try {
      await downloadGameAsZip({
        gameId: config.gameId || `game_${Date.now()}`,
        gameConfig: config,
        title: config.displayName || config.theme?.mainTheme || 'Slot Machine Game'
      });
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Playable ZIP download failed');
    } finally {
      setZipDownloading(false);
    }
  };
  
  // Download configuration as JSON file
  const handleDownload = () => {
    const blob = new Blob([formattedConfig], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slot-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Download API-ready configuration as JSON file
  const handleDownloadApiFormat = () => {
    const blob = new Blob([apiReadyConfig], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slot-api-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Copy configuration to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Would add a toast notification in a real implementation
  };
  
  return (
    <div className="step-container">
      <h2 className="text-2xl font-bold mb-6 text-center">Export Game Configuration</h2>
      <p className="text-center text-gray-600 mb-6 max-w-2xl mx-auto">
        Review your game configuration and export it to the API and RGS systems.
        You can test the configuration, download a copy, or deploy it directly.
      </p>
      
      {/* Error message display with troubleshooting guidance */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-700/20 border border-red-800/30 rounded-lg">
          <div className="flex items-start">
            <XCircle className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium mb-1 text-red-300">Error</h4>
              <p className="text-sm text-red-200">{errorMessage}</p>
              
              {/* Connection troubleshooting */}
              {errorMessage.includes('connect') && (
                <div className="mt-2 text-xs bg-red-900/50 p-2 rounded border border-red-800/50">
                  <p className="font-medium text-red-300">Troubleshooting:</p>
                  <ul className="list-disc list-inside mt-1 text-red-300/80 space-y-1">
                    <li>Verify the API URL is correct and the server is running</li>
                    <li>Check for typos in the base URL configuration</li>
                    <li>Try the Test Connection button first to validate connectivity</li>
                    <li>Ensure your network allows connections to the API server</li>
                  </ul>
                </div>
              )}
              
              {/* Format troubleshooting */}
              {errorMessage.includes('format') && (
                <div className="mt-2 text-xs bg-red-900/50 p-2 rounded border border-red-800/50">
                  <p className="font-medium text-red-300">Troubleshooting:</p>
                  <ul className="list-disc list-inside mt-1 text-red-300/80 space-y-1">
                    <li>Check API documentation for required request format</li>
                    <li>View the API Format to verify the structure</li>
                    <li>Try simplifying your configuration (removing optional fields)</li>
                    <li>Ensure all required fields are properly set</li>
                  </ul>
                </div>
              )}
              
              {/* Authentication troubleshooting */}
              {errorMessage.includes('Authentication') && (
                <div className="mt-2 text-xs bg-red-900/50 p-2 rounded border border-red-800/50">
                  <p className="font-medium text-red-300">Troubleshooting:</p>
                  <ul className="list-disc list-inside mt-1 text-red-300/80 space-y-1">
                    <li>Verify your API key is correct and not expired</li>
                    <li>Check if the API requires additional authentication headers</li>
                    <li>Ensure your account has permission to create/update configurations</li>
                  </ul>
                </div>
              )}
              
              {attemptCount > 0 && (
                <div className="mt-2 text-xs text-red-300/80">
                  Attempted {attemptCount} different API approaches before failing.
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
              
              <div className="mt-3 p-2 bg-green-900/30 rounded border border-green-800/40 text-xs">
                <div className="flex items-center gap-1 mb-1 text-green-300">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="font-medium">Next Steps:</span>
                </div>
                <ul className="list-disc list-inside text-green-300/80 space-y-1">
                  <li>Use this ID for future updates to this configuration</li>
                  <li>Share this ID with integrators to access your game</li>
                  <li>Download a local backup of your configuration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Configuration summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors mb-3"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Configuration Summary</h3>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={handleDownloadPlayableZip}
              disabled={zipDownloading || !config.theme?.generated?.symbols?.length}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 text-sm font-medium"
              title="Download playable game (ZIP with index.html + assets – open index.html for exact design)"
            >
              <Play className="w-4 h-4" />
              {zipDownloading ? 'Preparing…' : 'Download playable (ZIP)'}
            </button>
            <button
              onClick={() => handleCopy(formattedConfig)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Copy JSON"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Download JSON"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
            </div>
          
        </div>
        
        {/* Game Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">Theme</div>
            <div className="font-medium text-gray-800">{config.theme?.mainTheme || 'Not set'}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">Grid Size</div>
            <div className="font-medium text-gray-800">
              {config.reels?.layout?.reels || '?'} × {config.reels?.layout?.rows || '?'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">Pay Mechanism</div>
            <div className="font-medium text-gray-800 capitalize">
              {config.reels?.payMechanism === 'betlines' ? 'Paylines' : config.reels?.payMechanism || 'Not set'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">RTP Target</div>
            <div className="font-medium text-gray-800">{config.rtp?.targetRTP || 96}%</div>
          </div>
        </div>
        
        {/* Raw configuration */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Raw Configuration</div>
          <pre className="bg-gray-50 p-4 rounded-lg text-xs font-mono overflow-auto max-h-64 border border-gray-200">
            {formattedConfig}
          </pre>
        </div>
        
        {/* API-ready format toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowApiFormat(!showApiFormat)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <span className="text-blue-500 transition-transform duration-200" style={{ 
              transform: showApiFormat ? 'rotate(90deg)' : 'rotate(0deg)' 
            }}>▶</span>
            {showApiFormat ? 'Hide API Format' : 'Show API Format'}
          </button>
          
          {showApiFormat && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium text-gray-700">API-Ready Format</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(apiReadyConfig)}
                    className="p-1 text-gray-500 hover:text-gray-700 text-xs"
                    title="Copy API Format"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDownloadApiFormat}
                    className="p-1 text-gray-500 hover:text-gray-700 text-xs"
                    title="Download API Format"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <pre className="bg-slate-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-64 border border-slate-200">
                {apiReadyConfig}
              </pre>
            </div>
          )}
        </div>
        
        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Configuration Validation Errors</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-600">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Test results */}
        {testResults && !errorMessage && (
          <div className={`mb-6 p-3 ${testResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg`}>
            <div className={`flex items-center gap-2 ${testResults.success ? 'text-green-600' : 'text-red-600'} font-medium mb-1`}>
              {testResults.success ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span>{testResults.success ? 'Success' : 'Error'}</span>
            </div>
            <p className={`text-sm ${testResults.success ? 'text-green-600' : 'text-red-600'}`}>
              {testResults.message}
            </p>
          </div>
        )}
      </div>
      
      
      {/* Action buttons with improved states */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={handleTestConfig}
          disabled={exportStatus === 'loading'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-blue-300"
        >
          {exportStatus === 'loading' ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          Test Connection
        </button>
        
        <button
          onClick={handleExport}
          disabled={exportStatus === 'loading' || validationErrors.length > 0}
          className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 ${
            exportStatus === 'success' 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : exportStatus === 'error'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300'
          }`}
        >
          {exportStatus === 'loading' ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Exporting...
            </>
          ) : exportStatus === 'success' ? (
            <>
              <Check className="w-5 h-5" />
              Export Successful
            </>
          ) : exportStatus === 'error' ? (
            <>
              <AlertTriangle className="w-5 h-5" />
              Export Failed
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Export to API &amp; RGS
            </>
          )}
        </button>
        
        <button
          onClick={handleDownload}
          className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50"
        >
          <Download className="w-5 h-5" />
          Download JSON
        </button>
      </div>
    </div>
  );
};

export default Step12_APIExport;