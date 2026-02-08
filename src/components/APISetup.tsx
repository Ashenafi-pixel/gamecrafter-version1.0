import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { slotApiClient, GameConfiguration } from '../utils/apiClient';
import { openaiClient } from '../utils/openaiClient';
import { leonardoClient } from '../utils/leonardoClient';
import { 
  Globe, Lock, CheckCircle2, XCircle, Loader, Download, Save, 
  RefreshCw, Copy, Trash2, PlusCircle, Database, 
  FileEdit, Award
} from 'lucide-react';

// Enhanced APISetupWrapper provides advanced error boundaries and safe navigation
class APISetupErrorBoundary extends React.Component<{children: React.ReactNode}, {
  hasError: boolean, 
  errorMessage: string,
  errorComponentStack: string
}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { 
      hasError: false, 
      errorMessage: '',
      errorComponentStack: '' 
    };
    
    // Defensive initialization - check if we're coming from a navigation
    // that might be prone to errors (from Analytics step)
    const queryParams = new URLSearchParams(window.location.search);
    const stepParam = queryParams.get('step');
    if (stepParam === '8') {
      console.log("APISetup: Detected navigation from URL param, using extra precautions");
    }
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      errorMessage: error.message || "Unknown error in API Setup component",
      errorComponentStack: '' 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Comprehensive error logging for debugging
    console.error("Error in APISetup component:", error);
    console.log("Component stack:", errorInfo.componentStack);
    
    // Save component stack to state for display
    this.setState({
      errorComponentStack: errorInfo.componentStack || ''
    });
    
    // Log additional diagnostics
    console.log("Error analysis:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      isReactError: error.message.includes("React") || error.message.includes("Minified React error")
    });
  }

  // Safe navigation back to a working state
  safeNavigateToStep = (step: number) => {
    try {
      // Use URL parameter navigation to completely avoid React state updates
      // which could trigger additional errors
      console.log("API Setup error recovery - navigating to step:", step);
      setTimeout(() => {
        window.location.href = window.location.pathname + `?step=${step}`;
      }, 50);
    } catch (error) {
      console.error("Error during safe navigation:", error);
      // Last resort
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      // Enhanced fallback UI with more informative error details
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-4">API Setup Error</h2>
          <p className="text-red-600 mb-4">{this.state.errorMessage}</p>
          <p className="text-gray-600 mb-6">
            There was an error loading the API Setup component. This is likely due to a state management 
            issue or component navigation problem.
          </p>
          
          {/* Error details collapsible section for debugging */}
          {this.state.errorComponentStack && (
            <details className="mb-6 text-left bg-white p-3 rounded-lg">
              <summary className="cursor-pointer text-blue-700 font-medium">Technical Error Details</summary>
              <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto text-gray-700 max-h-32">
                {this.state.errorComponentStack}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => this.safeNavigateToStep(7)}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg"
            >
              Return to Analytics
            </button>
            <button 
              onClick={() => this.safeNavigateToStep(1)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg"
            >
              Go to First Step
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapped component with error handling
export const APISetup: React.FC = () => {
  return (
    <APISetupErrorBoundary>
      <APISetupContent />
    </APISetupErrorBoundary>
  );
};

// Actual component implementation
const APISetupContent: React.FC = () => {
  // Use React.useState instead of direct import which can sometimes cause reconciliation issues
  const [testingConnection, setTestingConnection] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<'untested' | 'success' | 'failure'>('untested');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [configurations, setConfigurations] = React.useState<GameConfiguration[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedConfig, setSelectedConfig] = React.useState<GameConfiguration | null>(null);
  const [gameIdInput, setGameIdInput] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [isCloning, setIsCloning] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  
  // Get config from store, but use a ref to prevent render issues
  const storeState = useGameStore();
  const { config, updateConfig } = storeState;
  const configRef = React.useRef(config);
  
  // Update ref when config changes
  React.useEffect(() => {
    configRef.current = config;
  }, [config]);
  
  const { api } = configRef.current;

  // Load configurations when connection is established
  useEffect(() => {
    if (connectionStatus === 'success') {
      loadConfigurations();
    }
  }, [connectionStatus]);

  const handleApiConfigUpdate = (key: string, value: string | boolean) => {
    updateConfig({
      api: {
        ...config.api,
        [key]: value,
        enabled: key === 'enabled' ? value : Boolean(config.api?.apiKey && value)
      }
    });
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setErrorMessage(null);
    
    try {
      if (!api?.baseUrl) {
        throw new Error('API URL is required');
      }
      
      // Ensure the URL has a valid protocol
      let baseUrl = api.baseUrl;
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'https://' + baseUrl;
        // Update the URL in the store with the correct protocol
        handleApiConfigUpdate('baseUrl', baseUrl);
      }
      
      console.log(`Testing connection to API: ${baseUrl}`);
      
      // Save API URL to localStorage for persistence
      localStorage.setItem('slotai_api_url', baseUrl);
      
      // First check health endpoint
      try {
        console.log('Making health check request');
        const healthResponse = await fetch(`${baseUrl}/health`, {
          method: 'GET',
          headers: { 
            'Accept': 'application/json' 
          },
          mode: 'cors',
          cache: 'no-cache'
        });
        
        console.log(`Health check response status: ${healthResponse.status}`);
        const healthData = await healthResponse.text();
        console.log(`Health check response: ${healthData}`);
        
        if (healthResponse.ok) {
          console.log('Health check succeeded, connecting to API');
        } else {
          console.warn('Health check failed, but continuing to test connection');
        }
      } catch (healthError) {
        console.warn('Health check error:', healthError);
        console.log('Continuing to test main API endpoint');
      }
      
      // Try direct fetch to the configurations endpoint
      try {
        console.log('Making direct GET request to test connection');
        const response = await fetch(`${baseUrl}/v1/configurations`, {
          method: 'GET',
          headers: { 
            'Accept': 'application/json' 
          },
          mode: 'cors',
          cache: 'no-cache'
        });
        
        console.log(`Direct API test response status: ${response.status}`);
        const contentType = response.headers.get('content-type');
        console.log(`Response content type: ${contentType}`);
        
        // Check if we got HTML instead of JSON
        if (contentType && contentType.includes('text/html')) {
          const htmlPreview = await response.text();
          console.error('API returned HTML instead of JSON:', htmlPreview.substring(0, 300));
          throw new Error('Server returned HTML instead of JSON. The endpoint may be incorrect.');
        }
        
        // Try to read response text to check format
        const responseText = await response.text();
        console.log(`Response preview: ${responseText.substring(0, 200)}`);
        
        try {
          // Check if it looks like JSON
          if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            // Parse as JSON to verify format
            const parsedData = JSON.parse(responseText);
            console.log('Successfully parsed API response as JSON:', parsedData);
            
            // Connection successful
            setConnectionStatus('success');
            handleApiConfigUpdate('enabled', true);
            updateConfig({
              api: {
                ...config.api,
                baseUrl, // Ensure we use the URL with protocol
                lastConnected: new Date().toISOString(),
                enabled: true
              }
            });
            return;
          } else {
            console.error('API response is not valid JSON format');
            throw new Error('API response is not in JSON format. Expected an array or object, but received: ' + responseText.substring(0, 50) + '...');
          }
        } catch (parseError) {
          console.error('Failed to parse API response as JSON:', parseError);
          throw new Error('Invalid JSON response: ' + responseText.substring(0, 100));
        }
      } catch (directError) {
        console.error('Direct API test failed:', directError);
        // Continue with the standard test if direct test fails
      }
      
      // Fall back to standard test via client
      const connected = await slotApiClient.testConnection({
        baseUrl,
        apiKey: api.apiKey
      });
      
      if (connected) {
        setConnectionStatus('success');
        handleApiConfigUpdate('enabled', true);
        updateConfig({
          api: {
            ...config.api,
            baseUrl, // Ensure we use the URL with protocol
            lastConnected: new Date().toISOString(),
            enabled: true
          }
        });
      } else {
        setConnectionStatus('failure');
        setErrorMessage('Could not connect to API. The server is not returning proper JSON data according to the API format.');
        handleApiConfigUpdate('enabled', false);
      }
    } catch (error) {
      setConnectionStatus('failure');
      console.error('API Connection Error:', error);
      
      // Provide a more detailed error message
      let errorMsg = 'Connection failed';
      if (error instanceof Error) {
        // Extract meaningful part of the error message
        const msg = error.message;
        if (msg.includes('HTML instead of JSON')) {
          errorMsg = 'Server returned HTML instead of JSON. The API endpoint may be incorrect or returning a web page instead of API data.';
        } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          errorMsg = 'Network error: Could not reach the API server. Check the URL including protocol (http/https) and port, and ensure the server is running.';
        } else if (msg.includes('Unexpected token') || msg.includes('JSON.parse')) {
          errorMsg = 'Invalid response format: The server is not returning proper JSON data. Check the API implementation.';
        } else if (msg.includes('cors') || msg.includes('CORS')) {
          errorMsg = 'CORS error: The API server is not configured to allow cross-origin requests. Add appropriate CORS headers to the server response.';
        } else if (msg.includes('timeout') || msg.includes('Timeout')) {
          errorMsg = 'Connection timeout: The API server took too long to respond. Check server load or connection.';
        } else {
          errorMsg = msg;
        }
      }
      
      setErrorMessage(errorMsg);
      handleApiConfigUpdate('enabled', false);
    } finally {
      setTestingConnection(false);
    }
  };

  const loadConfigurations = async () => {
    if (!api?.baseUrl) {
      setErrorMessage('API URL is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Ensure URL has a protocol
      let baseUrl = api.baseUrl;
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'https://' + baseUrl;
      }
      
      console.log(`Loading configurations from ${baseUrl}/v1/configurations`);
      
      // Set a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        // Try direct fetch first for better error handling
        const response = await fetch(`${baseUrl}/v1/configurations`, {
          method: 'GET',
          headers: { 
            'Accept': 'application/json' 
          },
          mode: 'cors',
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log(`Direct fetch response status: ${response.status}`);
        const contentType = response.headers.get('content-type');
        console.log(`Response content type: ${contentType}`);
        
        // Check if we got HTML instead of JSON
        if (contentType && contentType.includes('text/html')) {
          const htmlPreview = await response.text();
          console.error('API returned HTML instead of JSON:', htmlPreview.substring(0, 300));
          throw new Error('Server returned HTML instead of JSON. The endpoint may be incorrect.');
        }
        
        // Parse response text to handle different formats
        const responseText = await response.text();
        console.log(`Response preview: ${responseText.substring(0, 200)}`);
        
        if (responseText.trim()) {
          try {
            // Only parse if it looks like JSON
            if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
              const data = JSON.parse(responseText);
              console.log('Successfully parsed configurations:', data);
              
              // Process the data based on format
              let configsList: GameConfiguration[] = [];
              
              if (Array.isArray(data)) {
                // Convert array items to proper format
                configsList = data.filter(item => item && (item.gameId || (item.config && item.config.gameId)))
                                 .map(item => {
                                   // If using wrapper format with nested config
                                   if (item.config && typeof item.config === 'object') {
                                     return {
                                       ...item.config,
                                       gameId: item.config.gameId || item.id || 'unknown-id'
                                     };
                                   }
                                   // Direct game configuration format
                                   return item;
                                 });
              } else if (data && typeof data === 'object') {
                // Single object response
                if (data.config && typeof data.config === 'object') {
                  // Single wrapped object
                  configsList = [{
                    ...data.config,
                    gameId: data.config.gameId || data.id || 'unknown-id'
                  }];
                } else if (data.gameId) {
                  // Single configuration without wrapper
                  configsList = [data];
                }
              }
              
              console.log(`Processed ${configsList.length} game configurations`);
              setConfigurations(configsList);
            } else {
              throw new Error('Response is not in JSON format');
            }
          } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
          }
        } else {
          // Empty response
          console.log('API returned empty response, assuming no configurations');
          setConfigurations([]);
        }
      } catch (directError) {
        clearTimeout(timeoutId);
        console.error('Direct fetch failed:', directError);
        
        // Fall back to client method
        try {
          const configs = await slotApiClient.getAllConfigurations({
            baseUrl,
            apiKey: api.apiKey
          });
          
          setConfigurations(configs);
        } catch (clientError) {
          console.error('Client method also failed:', clientError);
          throw directError; // Re-throw the original error for better context
        }
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      
      // Provide a more detailed error message
      let errorMsg = 'Failed to load configurations';
      if (error instanceof Error) {
        const msg = error.message;
        if (msg.includes('HTML instead of JSON')) {
          errorMsg = 'Server returned HTML instead of JSON. Check API implementation.';
        } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          errorMsg = 'Network error: Could not reach the API server.';
        } else if (msg.includes('abort') || msg.includes('timeout')) {
          errorMsg = 'Request timed out. The server took too long to respond.';
        } else {
          errorMsg = `Error: ${msg}`;
        }
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConfiguration = async () => {
    if (!api?.baseUrl || !gameIdInput.trim()) {
      setErrorMessage('API URL and Game ID are required');
      return;
    }
    
    setIsCreating(true);
    setErrorMessage(null);
    
    try {
      console.log('Starting configuration creation with game ID:', gameIdInput.trim());
      
      // Try creating directly without the wrapper - simpler is better
      const gameId = gameIdInput.trim();
      const url = `${api.baseUrl}/v1/configurations`;
      
      // Simple payload following the API format
      const simplePayload = {
        id: gameId,
        config: {
          gameId: gameId,
          gameType: "slots",
          theme: {
            mainTheme: "New Game",
            artStyle: "realistic",
            colorScheme: "vibrant",
            mood: "adventurous",
            description: "A new slot game configuration"
          },
          bet: {
            min: 0.25,
            max: 100,
            increment: 0.25
          }
        }
      };
      
      console.log(`Creating new game with simple payload:`, simplePayload);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(simplePayload)
      });
      
      const responseText = await response.text();
      console.log(`API Response (${response.status}):`, responseText);
      
      // If failed with gameId required, try explicit top-level fields
      if (!response.ok && responseText.includes("gameId is required")) {
        console.log("First attempt failed. Trying with explicit top-level fields...");
        
        // Try with a different format
        const altPayload = {
          id: gameId,
          newGameId: gameId,
          config: {
            gameId: gameId,
            gameType: "slots",
            theme: {
              name: "tropical",
              primaryColor: "#33ccaa",
              secondaryColor: "#ff9933",
              mainTheme: "New Game",
              artStyle: "realistic",
              colorScheme: "vibrant",
              mood: "adventurous",
              description: "A new slot game configuration"
            },
            bet: {
              min: 0.25,
              max: 100,
              increment: 0.25
            }
          }
        };
        
        console.log(`Retrying with alt payload:`, altPayload);
        
        const altResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(altPayload)
        });
        
        const altResponseText = await altResponse.text();
        console.log(`Alt API Response (${altResponse.status}):`, altResponseText);
        
        if (!altResponse.ok) {
          throw new Error(`API error on retry (${altResponse.status}): ${altResponseText}`);
        }
        
        try {
          const result = JSON.parse(altResponseText);
          console.log('Configuration created successfully on retry:', result);
          
          // Refresh configuration list
          await loadConfigurations();
          
          // Find the newly created configuration
          const newConfiguration = result.config || result;
          setSelectedConfig(newConfiguration);
          
          // Reset input
          setGameIdInput('');
          return;
        } catch (e) {
          console.log('Response is not JSON:', altResponseText);
          throw new Error(`Invalid JSON response: ${altResponseText.substring(0, 100)}...`);
        }
      }
      
      if (!response.ok) {
        throw new Error(`API error (${response.status}): ${responseText}`);
      }
      
      try {
        const result = JSON.parse(responseText);
        console.log('Configuration created successfully:', result);
        
        // Refresh configuration list
        await loadConfigurations();
        
        // Find the newly created configuration
        const newConfiguration = result.config || result;
        setSelectedConfig(newConfiguration);
        
        // Reset input
        setGameIdInput('');
      } catch (e) {
        console.log('Response is not JSON:', responseText);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error('Error creating configuration:', error);
      let errorMsg = error.message || 'Failed to create configuration';
      
      // Enhance error message for common problems
      if (errorMsg.includes('400')) {
        errorMsg = 'Invalid request data: The API validation failed. Check the console for detailed payload information.';
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const importConfiguration = async (gameId: string) => {
    if (!api?.baseUrl || !gameId) {
      setErrorMessage('API URL and Game ID are required');
      return;
    }
    
    setIsImporting(true);
    setErrorMessage(null);
    
    try {
      // Get the configuration from API
      const apiConfig = await slotApiClient.getConfiguration(gameId, undefined, {
        baseUrl: api.baseUrl,
        apiKey: api.apiKey
      });
      
      // Convert to SlotAI format
      const slotAiConfig = slotApiClient.convertFromApiConfig(apiConfig);
      
      // Update application state
      updateConfig(slotAiConfig);
      
      // Select the configuration
      setSelectedConfig(apiConfig);
    } catch (error) {
      console.error('Error importing configuration:', error);
      setErrorMessage(error.message || 'Failed to import configuration');
    } finally {
      setIsImporting(false);
    }
  };

  const saveCurrentConfiguration = async () => {
    if (!api?.baseUrl || !selectedConfig) {
      setErrorMessage('API URL and selected configuration are required');
      return;
    }
    
    setIsSaving(true);
    setErrorMessage(null);
    
    try {
      // Convert current SlotAI config to API format
      const updatedConfig = slotApiClient.convertToApiConfig(config, selectedConfig.gameId);
      
      // Update the configuration via API
      await slotApiClient.updateConfiguration(selectedConfig.gameId, updatedConfig, {
        baseUrl: api.baseUrl,
        apiKey: api.apiKey
      });
      
      // Refresh configuration list
      await loadConfigurations();
    } catch (error) {
      console.error('Error saving configuration:', error);
      setErrorMessage(error.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const cloneConfiguration = async (sourceGameId: string) => {
    if (!api?.baseUrl) {
      setErrorMessage('API URL is required');
      return;
    }
    
    setIsCloning(true);
    setErrorMessage(null);
    
    try {
      // Generate a target ID based on source with suffix
      const newGameId = `${sourceGameId}-clone-${Date.now().toString().slice(-4)}`;
      
      // Clone the configuration via API
      const clonedConfig = await slotApiClient.cloneConfiguration(
        sourceGameId, 
        { newGameId }, 
        {
          baseUrl: api.baseUrl,
          apiKey: api.apiKey
        }
      );
      
      // Refresh configuration list
      await loadConfigurations();
      
      // Select the cloned configuration
      setSelectedConfig(clonedConfig);
    } catch (error) {
      console.error('Error cloning configuration:', error);
      setErrorMessage(`Failed to clone configuration: ${error.message}`);
    } finally {
      setIsCloning(false);
    }
  };

  const deleteConfigurationById = async (gameId: string) => {
    if (!api?.baseUrl) {
      setErrorMessage('API URL is required');
      return;
    }
    
    setDeletingId(gameId);
    setErrorMessage(null);
    
    try {
      // Delete the configuration via API
      await slotApiClient.deleteConfiguration(gameId, true, {
        baseUrl: api.baseUrl,
        apiKey: api.apiKey
      });
      
      // Remove the deleted configuration from local state
      setConfigurations(prevConfigs => prevConfigs.filter(c => c.gameId !== gameId));
      
      // Deselect if the deleted item was selected
      if (selectedConfig?.gameId === gameId) {
        setSelectedConfig(null);
      }
      
      // Show success message
      setErrorMessage(null);
    } catch (error) {
      console.error('Error deleting configuration:', error);
      setErrorMessage(`Failed to delete configuration: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold text-blue-800 mb-4">API Configuration</h3>
        
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-800">API URL</h4>
                <p className="text-sm text-gray-600">Enter slot game API endpoint</p>
              </div>
            </div>
            
            <input
              type="text"
              value={api?.baseUrl || ''}
              onChange={(e) => handleApiConfigUpdate('baseUrl', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
              placeholder="Enter API URL (e.g., https://a451-66-81-180-173.ngrok-free.app)"
            />
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-800">API Key</h4>
                <p className="text-sm text-gray-600">Optional authentication key</p>
              </div>
            </div>
            
            <input
              type="password"
              value={api?.apiKey || ''}
              onChange={(e) => handleApiConfigUpdate('apiKey', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
              placeholder="Enter API Key (if required)"
            />
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-start">
              <CheckCircle2 className="w-5 h-5 text-purple-600 mr-2 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Leonardo.ai Image Generation</h4>
                <p className="text-sm text-gray-700">
                  Configure Leonardo.ai image generation for themes, symbols, and backgrounds. Supports high-quality AI image generation with fine-tuned controls.
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Model</label>
                  <select
                    value={config.leonardo?.modelId || 'e316348f-7773-490e-adcd-46757c738eb7'}
                    onChange={(e) => updateConfig({
                      leonardo: {
                        ...config.leonardo,
                        modelId: e.target.value
                      }
                    })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
                  >
                    <option value="e316348f-7773-490e-adcd-46757c738eb7">Leonardo Diffusion XL</option>
                    <option value="f3296a34-9aef-4370-ad18-88daf26862c3">Leonardo Creative</option>
                    <option value="b6c1372f-fe9d-43b7-89f0-1b284cb5daee">Leonardo Select</option>
                    <option value="291be633-cb24-434f-898f-e662799936ad">Leonardo Signature</option>
                    <option value="b63f7119-21cb-4d22-9ead-5ad01c1c96de">Anime Model</option>
                    <option value="6bef9f1b-29cb-40c7-b9df-32b51c1f67d3">Dream Shaper</option>
                    <option value="73f52c24-e6ab-4f27-876a-2d3cb0227921">Realistic Vision</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Choose the best model for your style</span>
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Image Size</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Width</label>
                      <select
                        value={config.leonardo?.width || 768}
                        onChange={(e) => updateConfig({
                          leonardo: {
                            ...config.leonardo,
                            width: parseInt(e.target.value)
                          }
                        })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2 py-2 text-gray-800 text-sm"
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
                      <label className="block text-xs text-gray-500 mb-1">Height</label>
                      <select
                        value={config.leonardo?.height || 768}
                        onChange={(e) => updateConfig({
                          leonardo: {
                            ...config.leonardo,
                            height: parseInt(e.target.value)
                          }
                        })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2 py-2 text-gray-800 text-sm"
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
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Guidance Scale</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={config.leonardo?.guidanceScale || 7}
                    onChange={(e) => updateConfig({
                      leonardo: {
                        ...config.leonardo,
                        guidanceScale: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Creative</span>
                    <span>Value: {config.leonardo?.guidanceScale || 7}</span>
                    <span>Precise</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Contrast Ratio</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.leonardo?.contrastRatio || 0.5}
                    onChange={(e) => updateConfig({
                      leonardo: {
                        ...config.leonardo,
                        contrastRatio: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low</span>
                    <span>Value: {config.leonardo?.contrastRatio || 0.5}</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Enhanced Features</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.leonardo?.promptMagic !== false}
                      onChange={(e) => updateConfig({
                        leonardo: {
                          ...config.leonardo,
                          promptMagic: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Prompt Magic</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.leonardo?.alchemy !== false}
                      onChange={(e) => updateConfig({
                        leonardo: {
                          ...config.leonardo,
                          alchemy: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Alchemy</span>
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
              <h5 className="text-sm font-medium text-gray-700 mb-1">Leonardo.ai Features</h5>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-purple-50 rounded p-2 text-center">
                  <div className="text-xs font-medium">Premium Models</div>
                  <div className="text-[10px] text-gray-500">High Quality</div>
                </div>
                <div className="bg-purple-50 rounded p-2 text-center">
                  <div className="text-xs font-medium">Prompt Magic</div>
                  <div className="text-[10px] text-gray-500">Enhances Prompts</div>
                </div>
                <div className="bg-purple-50 rounded p-2 text-center">
                  <div className="text-xs font-medium">Alchemy</div>
                  <div className="text-[10px] text-gray-500">Improved Composition</div>
                </div>
              </div>
              
              <ul className="list-disc pl-5 text-sm text-gray-600 mb-3">
                <li>Generate high-quality images for themes, symbols, and backgrounds</li>
                <li>Multiple fine-tuned models for different styles</li>
                <li>Advanced controls for creative direction</li>
                <li>Fallback to local assets when API isn't available</li>
              </ul>
              
              <button
                onClick={async () => {
                  if (!config.leonardo?.apiKey) {
                    setErrorMessage('Leonardo.ai API key is required');
                    return;
                  }
                  
                  setTestingConnection(true);
                  try {
                    const result = await leonardoClient.testConnection(config.leonardo.apiKey);
                    if (result) {
                      setErrorMessage('Leonardo.ai API connection successful!');
                      
                      updateConfig({
                        leonardo: {
                          ...config.leonardo,
                          enabled: true,
                          lastConnected: new Date().toISOString()
                        }
                      });
                    } else {
                      setErrorMessage('Leonardo.ai API connection failed. Check your API key.');
                    }
                  } catch (error) {
                    setErrorMessage(`Leonardo.ai API error: ${error.message}`);
                  } finally {
                    setTestingConnection(false);
                  }
                }}
                className="mt-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-md text-white text-sm font-medium w-full"
              >
                Test Leonardo.ai Connection
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mt-4">
            <div className="flex items-start">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mr-2 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-800 mb-1">OpenAI Image Generation</h4>
                <p className="text-sm text-gray-700">
                  Configure OpenAI image generation for themes, symbols, and backgrounds. Supports DALL-E 3, DALL-E 2, and GPT-4o models.
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-600 mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={config.openai?.apiKey || ''}
                  onChange={(e) => updateConfig({
                    openai: {
                      ...config.openai,
                      apiKey: e.target.value,
                      enabled: !!e.target.value
                    }
                  })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
                  placeholder="Enter OpenAI API Key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI API Keys</a>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Model</label>
                  <select
                    value={config.openai?.modelName || 'dall-e-3'}
                    onChange={(e) => updateConfig({
                      openai: {
                        ...config.openai,
                        modelName: e.target.value
                      }
                    })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
                  >
                    <option value="dall-e-3">DALL-E 3</option>
                    <option value="dall-e-2">DALL-E 2</option>
                    <option value="gpt-image-1">GPT-4o Image</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Model capabilities:</span>
                    <br />
                    • DALL-E 3: High quality image generation
                    <br />
                    • DALL-E 2: Image generation, editing & variations
                    <br />
                    • GPT-4o: Superior text rendering & editing
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Image Size</label>
                  <select
                    value={config.openai?.size || '1024x1024'}
                    onChange={(e) => updateConfig({
                      openai: {
                        ...config.openai,
                        size: e.target.value as any
                      }
                    })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
                  >
                    <option value="1024x1024">1024×1024 (Square)</option>
                    <option value="1792x1024">1792×1024 (Landscape)</option>
                    <option value="1024x1792">1024×1792 (Portrait)</option>
                    <option value="512x512">512×512 (Small)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Image Quality</label>
                  <select
                    value={config.openai?.quality || 'standard'}
                    onChange={(e) => updateConfig({
                      openai: {
                        ...config.openai,
                        quality: e.target.value as any
                      }
                    })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
                  >
                    <option value="standard">Standard</option>
                    <option value="hd">HD (DALL-E 3)</option>
                    <option value="high">High (GPT-4o)</option>
                    <option value="medium">Medium (GPT-4o)</option>
                    <option value="low">Low (GPT-4o)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Style (DALL-E 3)</label>
                  <select
                    value={config.openai?.style || 'vivid'}
                    onChange={(e) => updateConfig({
                      openai: {
                        ...config.openai,
                        style: e.target.value as any
                      }
                    })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800"
                  >
                    <option value="vivid">Vivid</option>
                    <option value="natural">Natural</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="openai-transparent-bg"
                  checked={config.openai?.background === 'transparent'}
                  onChange={(e) => updateConfig({
                    openai: {
                      ...config.openai,
                      background: e.target.checked ? 'transparent' : 'solid'
                    }
                  })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="openai-transparent-bg" className="ml-2 text-sm text-gray-700">
                  Use transparent background (GPT-4o only)
                </label>
              </div>
              
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="openai-enabled"
                  checked={!!config.openai?.enabled}
                  onChange={(e) => updateConfig({
                    openai: {
                      ...config.openai,
                      enabled: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="openai-enabled" className="ml-2 text-sm text-gray-700 font-medium">
                  Enable OpenAI Integration
                </label>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-md shadow-sm">
              <h5 className="text-sm font-medium text-gray-700 mb-1">Feature Availability</h5>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-blue-50 rounded p-2 text-center">
                  <div className="text-xs font-medium">Image Generation</div>
                  <div className="text-[10px] text-gray-500">All Models</div>
                </div>
                <div className="bg-blue-50 rounded p-2 text-center">
                  <div className="text-xs font-medium">Image Edits</div>
                  <div className="text-[10px] text-gray-500">DALL-E 2, GPT-4o</div>
                </div>
                <div className="bg-blue-50 rounded p-2 text-center">
                  <div className="text-xs font-medium">Variations</div>
                  <div className="text-[10px] text-gray-500">DALL-E 2 only</div>
                </div>
              </div>
              
              <ul className="list-disc pl-5 text-sm text-gray-600 mb-3">
                <li>Images are used for themes, symbols, and backgrounds</li>
                <li>Fallback to local assets when API isn't available</li>
                <li>Transparent PNG support with GPT-4o model</li>
              </ul>
              
              <button
                onClick={async () => {
                  if (!config.openai?.apiKey) {
                    setErrorMessage('OpenAI API key is required');
                    return;
                  }
                  
                  setTestingConnection(true);
                  try {
                    const result = await openaiClient.testConnection(config.openai.apiKey);
                    if (result) {
                      setErrorMessage('OpenAI API connection successful!');
                      
                      // Also check for DALL-E availability
                      const hasDallE = await openaiClient.checkDallEAvailability(config.openai.apiKey);
                      
                      updateConfig({
                        openai: {
                          ...config.openai,
                          enabled: true,
                          lastConnected: new Date().toISOString()
                        }
                      });
                      
                      if (!hasDallE) {
                        setErrorMessage('OpenAI API connection successful, but DALL-E access may be limited. Consider enabling GPT-4o model instead.');
                      }
                    } else {
                      setErrorMessage('OpenAI API connection failed. Check your API key.');
                    }
                  } catch (error) {
                    setErrorMessage(`OpenAI API error: ${error.message}`);
                  } finally {
                    setTestingConnection(false);
                  }
                }}
                className="mt-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm font-medium w-full"
              >
                Test OpenAI Connection
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center gap-2">
            <div className="flex gap-2">
              <button
                onClick={testConnection}
                disabled={testingConnection || !api?.baseUrl}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingConnection ? (
                  <span className="flex items-center">
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </span>
                ) : (
                  'Test Connection'
                )}
              </button>
              <button
                onClick={async () => {
                  if (!api?.baseUrl) {
                    setErrorMessage('API URL is required');
                    return;
                  }
                  
                  console.log('Testing minimal API request');
                  const testId = `test-${Date.now().toString().slice(-6)}`;
                  const testConfig = {
                    "id": testId,
                    "config": {
                      "gameId": testId,
                      "theme": {
                        "mainTheme": "Test Theme",
                        "artStyle": "realistic",
                        "colorScheme": "desert-sunset",
                        "mood": "adventurous",
                        "description": "Test description"
                      },
                      "bet": {
                        "min": 0.25,
                        "max": 100,
                        "increment": 0.25
                      }
                    }
                  };
                  
                  try {
                    const url = `${api.baseUrl}/v1/configurations`;
                    console.log(`Sending minimal test request to ${url}:`, testConfig);
                    
                    const response = await fetch(url, {
                      method: 'POST',
                      headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(testConfig)
                    });
                    
                    const responseText = await response.text();
                    console.log(`Response (${response.status}):`, responseText);
                    
                    if (response.ok) {
                      setErrorMessage(`Test succeeded with ID: ${testId} - See console for details.`);
                      // Refresh the list
                      await loadConfigurations();
                    } else {
                      setErrorMessage(`Test failed: ${response.status} ${responseText}`);
                    }
                  } catch (error) {
                    console.error('Test request failed:', error);
                    setErrorMessage(`Test error: ${error.message}`);
                  }
                }}
                className="px-3 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg text-white text-sm font-medium"
                title="Run minimal API test"
              >
                Test API Directly
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {connectionStatus === 'success' && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-400">Connected</span>
                </>
              )}
              
              {connectionStatus === 'failure' && (
                <>
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-400">
                    {errorMessage || 'Connection failed'}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {api?.lastConnected && connectionStatus === 'success' && (
            <p className="text-xs text-slate-400 mt-2">
              Last connected: {new Date(api.lastConnected).toLocaleString()}
            </p>
          )}
        </div>
      </div>
      
      {connectionStatus === 'success' && (
        <>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-200">Saved Games</h3>
                  <p className="text-sm text-slate-400">Manage your game configurations</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadConfigurations}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm font-medium flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Loading...' : 'Refresh List'}
                </button>
                <button
                  onClick={async () => {
                    if (!api?.baseUrl) {
                      setErrorMessage('API URL is required');
                      return;
                    }
                    
                    // Use our direct API test function with minimum data
                    console.log('Running emergency direct API test');
                    try {
                      // First check the health endpoint
                      const healthUrl = `${api.baseUrl}/health`;
                      console.log(`Checking API health at ${healthUrl}`);
                      
                      const healthResponse = await fetch(healthUrl, {
                        method: 'GET',
                        headers: {
                          'Accept': 'application/json'
                        }
                      });
                      
                      const healthStatus = await healthResponse.text();
                      console.log(`Health check response (${healthResponse.status}):`, healthStatus);
                      
                      if (healthResponse.ok) {
                        console.log('Health check succeeded, now testing configuration creation');
                      } else {
                        console.warn('Health check failed, but continuing with config test');
                      }
                      
                      const testId = `emergency-test-${Date.now().toString().slice(-6)}`;
                      const url = `${api.baseUrl}/v1/configurations`;
                      
                      // Create a simple test payload
                      const simplePayload = {
                        "id": testId,
                        "config": {
                          "gameId": testId,
                          "gameType": "slots",
                          "theme": {
                            "mainTheme": "Test Theme",
                            "artStyle": "realistic",
                            "colorScheme": "warm-vibrant",
                            "mood": "playful", 
                            "description": "Test description"
                          },
                          "bet": {
                            "min": 0.25,
                            "max": 100,
                            "increment": 0.25
                          }
                        }
                      };
                      
                      console.log(`Emergency test - sending to ${url}:`, JSON.stringify(simplePayload, null, 2));
                      
                      const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                          'Accept': 'application/json',
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(simplePayload)
                      });
                      
                      const responseText = await response.text();
                      console.log(`Emergency test response (${response.status}):`, responseText);
                      
                      if (response.ok) {
                        setErrorMessage(`Emergency test succeeded! Created test game "${testId}" - see console for details`);
                        await loadConfigurations();
                      } else {
                        setErrorMessage(`Emergency test failed with ${response.status}: ${responseText}`);
                      }
                    } catch (error) {
                      console.error('Emergency test failed:', error);
                      setErrorMessage(`Emergency test error: ${error.message}`);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded-lg text-white text-sm font-medium"
                  title="Run emergency minimal API test"
                >
                  Emergency Test
                </button>
              </div>
            </div>
            
            {errorMessage && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg mb-4 text-red-300">
                <div className="flex items-start">
                  <XCircle className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">API Connection Error</h4>
                    <p className="text-sm">{errorMessage}</p>
                    
                    {errorMessage.includes('HTML instead of JSON') && (
                      <div className="mt-3 bg-red-950 p-3 rounded text-xs space-y-2">
                        <p className="font-medium text-red-300">JSON Response Required:</p>
                        <p className="text-red-300/90 mb-2">
                          The endpoint must return proper JSON data as per the Swagger spec, not HTML. 
                          The API server needs to be configured correctly.
                        </p>
                        <p className="font-medium text-red-300">Try this:</p>
                        <ol className="list-decimal pl-4 space-y-1 text-red-300/80">
                          <li>Open the API test page at <a href="/api-test.html" target="_blank" className="underline text-blue-300">/api-test.html</a> to test the API connection directly</li>
                          <li>Check if the URL is correct (should include the port number if needed)</li>
                          <li>Verify the API server is running and accessible</li>
                        </ol>
                        
                        <p className="font-medium text-red-300 mt-3">Server-side fixes needed:</p>
                        <ul className="list-disc pl-4 space-y-1 text-red-300/80">
                          <li>Ensure the API server is returning proper JSON responses to requests</li>
                          <li>Check Content-Type headers in the server response (should be application/json)</li>
                          <li>Remove any redirects to HTML pages or templates</li>
                          <li>Enable CORS headers on the server for browser requests:
                            <pre className="bg-red-900/30 p-2 rounded mt-1 overflow-auto text-red-200 text-xs">
                              Access-Control-Allow-Origin: *{"\n"}
                              Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS{"\n"}
                              Access-Control-Allow-Headers: Content-Type, Authorization
                            </pre>
                          </li>
                        </ul>
                        <p className="mt-2 font-medium text-red-300">Expected response format:</p>
                        <pre className="bg-red-900/30 p-2 rounded mt-1 overflow-auto text-red-200">
                          Content-Type: application/json{"\n"}
                          [{"\n"}
                            {"  "}{"{"}"gameId": "example", "theme": {"{"}"mainTheme": "Test"{"}"}...{"}"},
                            {"  "}...{"\n"}
                          ]
                        </pre>
                        
                        <p className="mt-3 p-2 bg-blue-900/30 rounded text-blue-300 border border-blue-800/50">
                          <span className="font-medium">Try checking the API URL:</span> Make sure you're using the correct URL format.
                          Example: <code className="bg-blue-900/50 px-1 rounded">https://example.com:8080</code> (include the port if needed)
                        </p>
                      </div>
                    )}
                    
                    {errorMessage.includes('Failed to fetch') && (
                      <div className="mt-3 bg-red-950 p-3 rounded text-xs space-y-2">
                        <p className="font-medium text-red-300">Network Connection Error:</p>
                        <p className="text-red-300/90 mb-2">
                          The application couldn't connect to the API server. This could be due to:
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-red-300/80">
                          <li>The API server is not running</li>
                          <li>The URL is incorrect</li>
                          <li>Network connectivity issues</li>
                          <li>CORS restrictions (if running in browser)</li>
                        </ul>
                        <p className="mt-3 p-2 bg-blue-900/30 rounded text-blue-300 border border-blue-800/50">
                          <span className="font-medium">Try these solutions:</span>
                          <ol className="list-decimal pl-4 mt-1">
                            <li>Verify the API server is running</li>
                            <li>Check the URL format - include the protocol (http/https) and port</li>
                            <li>Use our simple test page at <a href="/api-test.html" target="_blank" className="underline text-blue-300">/api-test.html</a></li>
                          </ol>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Save Current Game */}
              <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 rounded-lg p-5 border border-blue-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Save className="w-5 h-5 text-blue-400" />
                  </div>
                  <h4 className="font-medium text-blue-300">Save Current Game</h4>
                </div>
                
                <div>
                  <label htmlFor="gameId" className="block text-sm font-medium text-slate-300 mb-2">
                    Game ID
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="gameId"
                      type="text"
                      value={gameIdInput}
                      onChange={(e) => setGameIdInput(e.target.value)}
                      className="flex-1 bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
                      placeholder="e.g., wild-west-adventure"
                    />
                    <button
                      onClick={createNewConfiguration}
                      disabled={isCreating || !gameIdInput.trim()}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4" />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Save your current game design as a new configuration
                  </p>
                </div>
                
                {selectedConfig && (
                  <div className="mt-5 pt-5 border-t border-blue-900/30">
                    <div className="flex justify-between items-center">
                      <h5 className="text-sm font-medium text-blue-300">Update Selected Game</h5>
                      <button
                        onClick={saveCurrentConfiguration}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded-md text-white text-sm font-medium flex items-center gap-1.5"
                      >
                        {isSaving ? (
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Update</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Selected: <span className="text-blue-300">{selectedConfig.gameId}</span>
                    </p>
                  </div>
                )}
              </div>
              
              {/* Clone Game */}
              <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-lg p-5 border border-purple-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Copy className="w-5 h-5 text-purple-400" />
                  </div>
                  <h4 className="font-medium text-purple-300">Clone Existing Game</h4>
                </div>
                
                {configurations.length > 0 ? (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Source Game
                        </label>
                        <select 
                          className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                          value={selectedConfig?.gameId || ''}
                          onChange={(e) => {
                            const selected = configurations.find(c => c.gameId === e.target.value);
                            if (selected) setSelectedConfig(selected);
                          }}
                        >
                          <option value="">Select a game</option>
                          {configurations.map(config => (
                            <option key={config.gameId} value={config.gameId}>
                              {config.gameId}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          New Game ID
                        </label>
                        <input
                          type="text"
                          className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                          placeholder="new-game-id"
                          value={selectedConfig ? `${selectedConfig.gameId}-clone` : ''}
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => selectedConfig && cloneConfiguration(selectedConfig.gameId)}
                      disabled={!selectedConfig || isCloning}
                      className="w-full mt-4 px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCloning ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Cloning...</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Clone Selected Game</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No games available to clone</p>
                )}
              </div>
            </div>
            
            {/* Configuration list */}
            <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden mt-8">
              <div className="p-3 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="font-medium text-slate-200">Your Game Library</span>
                </div>
                <span className="text-xs px-2 py-1 bg-slate-700 rounded-full text-slate-300">
                  {configurations.length} game{configurations.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {isLoading ? (
                <div className="p-6 flex justify-center items-center">
                  <Loader className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              ) : configurations.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <ul className="divide-y divide-slate-700/50">
                    {configurations.map((config) => (
                      <li 
                        key={config.gameId}
                        className={`p-4 hover:bg-slate-800/30 cursor-pointer transition-colors ${
                          selectedConfig?.gameId === config.gameId ? 'bg-slate-800/50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => setSelectedConfig(config)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-slate-200 text-lg">{config.gameId}</h4>
                            <p className="text-sm text-slate-400 mt-1">
                              Theme: <span className="text-blue-300">{config.theme.mainTheme}</span>
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs px-2 py-0.5 bg-slate-700 rounded-full text-slate-300">
                                {config.theme.artStyle}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-slate-700 rounded-full text-slate-300">
                                {config.reels?.payMechanism || "betlines"}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-slate-700 rounded-full text-slate-300">
                                {config.volatility?.level || "medium"}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-green-900/50 rounded-full text-green-300">
                                RTP: {config.rtp?.targetRTP || 96}%
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                importConfiguration(config.gameId);
                              }}
                              className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white group relative"
                              title="Load into editor"
                            >
                              <Download className="w-4 h-4" />
                              <span className="absolute right-0 top-full mt-1 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                Load into editor
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cloneConfiguration(config.gameId);
                              }}
                              className="p-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white group relative"
                              title="Clone game"
                            >
                              <Copy className="w-4 h-4" />
                              <span className="absolute right-0 top-full mt-1 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                Clone game
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete "${config.gameId}"?`)) {
                                  deleteConfigurationById(config.gameId);
                                }
                              }}
                              disabled={deletingId === config.gameId}
                              className="p-2 rounded-md bg-red-600 hover:bg-red-700 text-white group relative disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete game"
                            >
                              {deletingId === config.gameId ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              <span className="absolute right-0 top-full mt-1 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                Delete game
                              </span>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-800/80 rounded-full mx-auto flex items-center justify-center mb-4">
                    <Database className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-slate-400 font-medium mb-2">No saved games found</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Create your first game configuration to see it here
                  </p>
                  <button 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
                    onClick={() => document.getElementById('gameId')?.focus()}
                  >
                    Create your first game
                  </button>
                </div>
              )}
            </div>
            
            {selectedConfig && (
              <div className="mt-6 p-5 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <FileEdit className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-300">Selected Game Details</h4>
                    <p className="text-xs text-slate-400">
                      {selectedConfig.gameId}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
                  <div className="bg-slate-900/40 p-3 rounded-lg">
                    <h5 className="font-medium text-slate-300 mb-1">Theme</h5>
                    <p className="text-sm text-slate-400">{selectedConfig.theme.mainTheme}</p>
                    <p className="text-xs text-slate-500 mt-1">Style: {selectedConfig.theme.artStyle}</p>
                  </div>
                  
                  <div className="bg-slate-900/40 p-3 rounded-lg">
                    <h5 className="font-medium text-slate-300 mb-1">Game Setup</h5>
                    <p className="text-sm text-slate-400">
                      {selectedConfig.reels?.layout?.reels || 5}×{selectedConfig.reels?.layout?.rows || 3} grid
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedConfig.reels?.betlines || 20} betlines
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/40 p-3 rounded-lg">
                    <h5 className="font-medium text-slate-300 mb-1">Math Model</h5>
                    <p className="text-sm text-slate-400">
                      RTP: {selectedConfig.rtp?.targetRTP || 96}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Volatility: {selectedConfig.volatility?.level || "medium"}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-4 justify-end">
                  <button
                    onClick={() => importConfiguration(selectedConfig.gameId)}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-white text-sm font-medium flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Load into editor</span>
                  </button>
                  
                  <button
                    onClick={saveCurrentConfiguration}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-white text-sm font-medium flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save current changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};