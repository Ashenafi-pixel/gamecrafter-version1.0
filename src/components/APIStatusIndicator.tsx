import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store';
import { slotApiClient } from '../utils/apiClient';
import { openaiClient } from '../utils/openaiClient';
import { leonardoClient } from '../utils/leonardoClient';
import { CheckCircle, XCircle, AlertCircle, Loader, Server, Database, Image, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';

interface ApiFeatureStatus {
  configurations: boolean;
  imageGeneration: boolean;
  simulation: boolean;
  export: boolean;
}

const APIStatusIndicator: React.FC = () => {
  const { config } = useGameStore();
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'partial'>('checking');
  const [expanded, setExpanded] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [checkCount, setCheckCount] = useState(0);
  const [features, setFeatures] = useState<ApiFeatureStatus>({
    configurations: false,
    imageGeneration: false,
    simulation: false,
    export: false
  });
  const [openaiStatus, setOpenaiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [leonardoStatus, setLeonardoStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const detailsRef = useRef<HTMLDivElement>(null);
  
  // Calculate the overall status based on features
  const determineOverallStatus = (featureStatus: ApiFeatureStatus): 'connected' | 'disconnected' | 'partial' => {
    const availableFeatures = Object.values(featureStatus).filter(Boolean).length;
    const totalFeatures = Object.values(featureStatus).length;
    
    if (availableFeatures === 0) return 'disconnected';
    if (availableFeatures === totalFeatures) return 'connected';
    return 'partial';
  };

  // Check OpenAI connection
  const checkOpenAIConnection = useCallback(async () => {
    setOpenaiStatus('checking');
    
    try {
      if (!config.openai?.apiKey) {
        setOpenaiStatus('disconnected');
        return;
      }
      
      const result = await openaiClient.testConnection(config.openai.apiKey);
      
      setOpenaiStatus(result ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Error checking OpenAI connection:', error);
      setOpenaiStatus('disconnected');
    }
  }, [config.openai?.apiKey]);
  
  // Check Leonardo.ai connection
  const checkLeonardoConnection = useCallback(async () => {
    setLeonardoStatus('checking');
    
    try {
      if (!config.leonardo?.apiKey) {
        setLeonardoStatus('disconnected');
        return;
      }
      
      const result = await leonardoClient.testConnection(config.leonardo.apiKey);
      
      setLeonardoStatus(result ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Error checking Leonardo.ai connection:', error);
      setLeonardoStatus('disconnected');
    }
  }, [config.leonardo?.apiKey]);

  // Memoize the checkConnection function to prevent recreation on every render
  const checkConnection = useCallback(async () => {
    setStatus('checking');
    try {
      // Create API configuration object with validation
      let validApiUrl = config?.api?.baseUrl || 'https://slotsai-api.onrender.com';
      
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
        apiKey: config?.api?.apiKey || ''
      };
      
      // Use enhanced testConnection that returns feature status
      const connectionResult = await slotApiClient.testConnection(apiConfig);
      
      if (connectionResult.success) {
        // Set feature status based on connection test
        if (connectionResult.features) {
          setFeatures(connectionResult.features);
        } else {
          // Fallback if no features are returned
          setFeatures({
            configurations: true,
            imageGeneration: true,
            simulation: false,
            export: true
          });
        }
        
        // Determine overall status
        setStatus(determineOverallStatus(connectionResult.features || {
          configurations: true,
          imageGeneration: true,
          simulation: false,
          export: true
        }));
        
        // Log information for debugging
        console.log('API status check results:', {
          success: connectionResult.success,
          features: connectionResult.features,
          message: connectionResult.message
        });
      } else {
        // Connection failed
        setStatus('disconnected');
        setFeatures({
          configurations: false,
          imageGeneration: false,
          simulation: false,
          export: false
        });
        
        console.warn('API connection failed:', connectionResult.message);
      }
    } catch (error) {
      console.error('Error checking API connection:', error);
      setStatus('disconnected');
      setFeatures({
        configurations: false,
        imageGeneration: false,
        simulation: false,
        export: false
      });
    }
    
    setLastChecked(new Date());
    setCheckCount(prev => prev + 1);
    
    // Also check AI image APIs
    checkOpenAIConnection();
    checkLeonardoConnection();
  }, [config?.api?.baseUrl, config?.api?.apiKey, checkOpenAIConnection, checkLeonardoConnection]);

  // Check connection on component mount and periodically
  useEffect(() => {
    // Initial check
    checkConnection();

    // Set up periodic checking (every 60 seconds)
    const intervalId = setInterval(() => {
      checkConnection();
    }, 60000); // 60 seconds

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [checkConnection]); // Now properly depending on memoized function
  
  // Add click outside handler to close expanded view
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node) && expanded) {
        setExpanded(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expanded]);

  return (
    <div ref={detailsRef} className="fixed bottom-4 right-4 z-50">
      {/* Expanded details panel */}
      {expanded && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-3 text-gray-800 min-w-[240px]">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-sm">API Status Details</h4>
            <button 
              onClick={() => setExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-xs">Configurations</span>
              </div>
              {features.configurations ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-xs">Image Generation</span>
              </div>
              {features.imageGeneration ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-xs">Export</span>
              </div>
              {features.export ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            
            {/* Leonardo.ai status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-xs">Leonardo.ai</span>
              </div>
              {leonardoStatus === 'checking' ? (
                <Loader className="w-4 h-4 text-purple-500 animate-spin" />
              ) : leonardoStatus === 'connected' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            
            {/* OpenAI status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs">OpenAI DALL-E</span>
              </div>
              {openaiStatus === 'checking' ? (
                <Loader className="w-4 h-4 text-blue-500 animate-spin" />
              ) : openaiStatus === 'connected' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Last checked: {lastChecked.toLocaleTimeString()}
              </div>
              <button 
                onClick={checkConnection}
                className="text-blue-500 hover:text-blue-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Leonardo.ai details */}
            {config.leonardo?.apiKey && (
              <div className="mt-2 text-xs">
                <div className="font-medium text-purple-800">Leonardo.ai Configuration:</div>
                <div className="flex justify-between mt-1">
                  <span>Model:</span>
                  <span>Leonardo Diffusion XL</span>
                </div>
                <div className="flex justify-between">
                  <span>API Key:</span>
                  <span>••••••••{config.leonardo.apiKey.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={leonardoStatus === 'connected' ? 'text-green-600' : 'text-gray-600'}>
                    {config.leonardo?.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            )}
            
            {/* OpenAI details */}
            {config.openai?.apiKey && (
              <div className="mt-2 text-xs">
                <div className="font-medium text-blue-800">OpenAI Configuration:</div>
                <div className="flex justify-between mt-1">
                  <span>Model:</span>
                  <span>{config.openai.modelName || 'dall-e-3'}</span>
                </div>
                <div className="flex justify-between">
                  <span>API Key:</span>
                  <span>••••••••{config.openai.apiKey.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={openaiStatus === 'connected' ? 'text-green-600' : 'text-gray-600'}>
                    {config.openai?.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Status indicator */}
      <div 
        className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-md cursor-pointer transition-all ${
          status === 'connected' 
            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
            : status === 'disconnected'
              ? 'bg-red-100 text-red-800 hover:bg-red-200 animate-pulse'
              : status === 'partial'
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-blue-100 text-blue-800'
        }`}
        onClick={() => setExpanded(!expanded)}
        title="Click to view API status details"
      >
        {status === 'checking' && (
          <Loader className="w-4 h-4 animate-spin" />
        )}
        {status === 'connected' && (
          <CheckCircle className="w-4 h-4" />
        )}
        {status === 'disconnected' && (
          <XCircle className="w-4 h-4" />
        )}
        {status === 'partial' && (
          <AlertCircle className="w-4 h-4" />
        )}
        <span className="text-xs font-medium">
          {status === 'checking' && 'Checking API...'}
          {status === 'connected' && 'API Connected'}
          {status === 'disconnected' && 'API Disconnected'}
          {status === 'partial' && 'API Partially Available'}
        </span>
        
        {/* Add AI indicators */}
        {leonardoStatus === 'connected' && (
          <span className="bg-purple-200 text-purple-800 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Image className="w-2.5 h-2.5" />
            Leonardo
          </span>
        )}
        
        {openaiStatus === 'connected' && (
          <span className="bg-blue-200 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Image className="w-2.5 h-2.5" />
            DALL-E
          </span>
        )}
        
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronUp className="w-3 h-3" />
        )}
      </div>
    </div>
  );
};

// Export with React.memo to prevent unnecessary re-renders
export default React.memo(APIStatusIndicator);