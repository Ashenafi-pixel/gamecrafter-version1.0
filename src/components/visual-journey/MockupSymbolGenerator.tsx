import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusCircle,
  Lock,
  ImageIcon,
  Palette,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Trash,
  Paintbrush,
  Sparkles,
  Database,
  Save,
  SplitSquareHorizontal,
  Loader
} from 'lucide-react';
import { useGameStore } from '../../store';
import SymbolCardMockup from './SymbolCardMockup';
import { detectThemeCategory, getMockupAsset } from '../../utils/mockupService';

// Define Symbol Interface
interface Symbol {
  id: string;
  name: string;
  type: string;
  image: string | null;
  isGenerating: boolean;
  prompt?: string;
  objectDescription?: string;
  animation?: AnimationParams;
}

// Define Animation Parameters
interface AnimationParams {
  intensity: number;
  speed: number;
  style: string;
  particleEffect: string;
  autoPlay: boolean;
  loop: boolean;
  duration: number;
}

// Type colors for visual differentiation
const typeColors: Record<string, string> = {
  wild: '#f59e0b',
  scatter: '#8b5cf6',
  high: '#ef4444',
  medium: '#10b981',
  low: '#3b82f6',
  custom: '#6b7280'
};

// MockupSymbolGenerator Component
const MockupSymbolGenerator: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedId, setLastGeneratedId] = useState<string | null>(null);
  const [theme, setTheme] = useState(config?.theme?.mainTheme || 'fantasy slot game');
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<Record<string, number>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Helper function to get default animation params based on symbol type
  const getDefaultAnimation = (type: 'wild' | 'scatter' | 'high' | 'medium' | 'low'): AnimationParams => {
    switch(type) {
      case 'wild':
        return {
          intensity: 8,
          speed: 1.2,
          style: 'glow',
          particleEffect: 'sparkle',
          autoPlay: true,
          loop: true,
          duration: 2.5
        };
      case 'scatter':
        return {
          intensity: 7,
          speed: 1.0,
          style: 'pulse',
          particleEffect: 'stars',
          autoPlay: true,
          loop: true,
          duration: 2.0
        };
      case 'high':
        return {
          intensity: 5,
          speed: 1.0,
          style: 'shine',
          particleEffect: 'glow',
          autoPlay: true,
          loop: true,
          duration: 2.0
        };
      case 'medium':
        return {
          intensity: 3,
          speed: 0.8,
          style: 'float',
          particleEffect: 'none',
          autoPlay: true,
          loop: true,
          duration: 1.5
        };
      case 'low':
      default:
        return {
          intensity: 2,
          speed: 0.7,
          style: 'bounce',
          particleEffect: 'none',
          autoPlay: true,
          loop: true,
          duration: 1.0
        };
    }
  };

  // Initialize symbols based on configuration
  useEffect(() => {
    const defaultSymbols: Symbol[] = [
      {
        id: 'wild_1',
        name: 'WILD',
        type: 'wild',
        image: config?.theme?.generated?.symbols?.[0] || null,
        isGenerating: false,
        prompt: `256x256 px high-detail icon of a golden 'WILD' emblem for a ${theme} slot game, designed for a transparent background.`,
        animation: getDefaultAnimation('wild')
      },
      {
        id: 'scatter_1',
        name: 'SCATTER',
        type: 'scatter',
        image: config?.theme?.generated?.symbols?.[1] || null,
        isGenerating: false,
        prompt: `A single isolated ${theme} SCATTER symbol for slot machine with transparent background.`,
        animation: getDefaultAnimation('scatter')
      },
      {
        id: 'high_1',
        name: 'H1',
        type: 'high',
        image: config?.theme?.generated?.symbols?.[2] || null,
        isGenerating: false,
        prompt: `A single isolated high-value symbol for ${theme} theme slot machine with transparent background.`,
        animation: getDefaultAnimation('high')
      },
      {
        id: 'high_2',
        name: 'H2',
        type: 'high',
        image: config?.theme?.generated?.symbols?.[3] || null,
        isGenerating: false,
        prompt: `A single isolated high-value symbol for ${theme} theme slot machine with transparent background.`,
        animation: getDefaultAnimation('high')
      },
      {
        id: 'high_3',
        name: 'H3',
        type: 'high',
        image: config?.theme?.generated?.symbols?.[4] || null,
        isGenerating: false,
        prompt: `A single isolated high-value symbol for ${theme} theme slot machine with transparent background.`,
        animation: getDefaultAnimation('high')
      },
      {
        id: 'medium_1',
        name: 'M1',
        type: 'medium',
        image: config?.theme?.generated?.symbols?.[5] || null,
        isGenerating: false,
        prompt: `A single isolated medium-value symbol for ${theme} theme slot machine with transparent background.`,
        animation: getDefaultAnimation('medium')
      },
      {
        id: 'medium_2',
        name: 'M2',
        type: 'medium',
        image: config?.theme?.generated?.symbols?.[6] || null,
        isGenerating: false,
        prompt: `A single isolated medium-value symbol for ${theme} theme slot machine with transparent background.`,
        animation: getDefaultAnimation('medium')
      },
      {
        id: 'low_1',
        name: 'L1',
        type: 'low',
        image: config?.theme?.generated?.symbols?.[7] || null,
        isGenerating: false,
        prompt: `A single isolated low-value symbol for ${theme} theme slot machine with transparent background.`,
        animation: getDefaultAnimation('low')
      },
      {
        id: 'low_2',
        name: 'L2',
        type: 'low',
        image: config?.theme?.generated?.symbols?.[8] || null,
        isGenerating: false,
        prompt: `A single isolated low-value symbol for ${theme} theme slot machine with transparent background.`,
        animation: getDefaultAnimation('low')
      },
      {
        id: 'low_3',
        name: 'L3',
        type: 'low',
        image: config?.theme?.generated?.symbols?.[9] || null,
        isGenerating: false,
        prompt: `A single isolated low-value symbol for ${theme} theme slot machine with transparent background.`,
        animation: getDefaultAnimation('low')
      }
    ];
    
    setSymbols(defaultSymbols);
  }, []);

  // Update theme when game theme changes
  useEffect(() => {
    if (config?.theme?.mainTheme) {
      setTheme(config.theme.mainTheme);
    }
  }, [config?.theme?.mainTheme]);

  // Handle theme updates 
  const handleThemeUpdate = (newTheme: string) => {
    setTheme(newTheme);
    
    if (config.theme) {
      updateConfig({
        theme: {
          ...config.theme,
          mainTheme: newTheme
        }
      });
    }
  };

  // Generate Symbol
  const generateSymbol = (id: string, objectDescription?: string) => {
    const symbolIndex = symbols.findIndex(s => s.id === id);
    if (symbolIndex === -1) return;
    
    const symbol = symbols[symbolIndex];
    console.log(`Generating ${symbol.type} symbol: ${objectDescription || 'no description'}`);
    
    // Mark as generating
    const updatedSymbols = [...symbols];
    updatedSymbols[symbolIndex] = { 
      ...symbol, 
      isGenerating: true,
      objectDescription
    };
    setSymbols(updatedSymbols);
    
    // Set progress to 0
    setGenerationProgress(prev => ({
      ...prev,
      [id]: 0
    }));
    
    // Use mockup service to simulate image generation
    setTimeout(() => {
      const themeCategory = detectThemeCategory(theme);
      
      // Map symbol types to specific file names for the mockup
      let symbolType = symbol.type;
      if (symbol.id.includes('_')) {
        const parts = symbol.id.split('_');
        if (parts[1]) {
          symbolType = `${symbol.type}_${parts[1]}`;
        }
      }
      
      // Map to correct file names based on ID
      if (symbol.id === 'wild_1') symbolType = 'wild';
      if (symbol.id === 'scatter_1') symbolType = 'scatter';
      if (symbol.id === 'high_1') symbolType = 'high_1';
      if (symbol.id === 'high_2') symbolType = 'high_2';
      if (symbol.id === 'high_3') symbolType = 'high_3';
      if (symbol.id === 'medium_1') symbolType = 'mid_1';
      if (symbol.id === 'medium_2') symbolType = 'mid_2';
      if (symbol.id === 'low_1') symbolType = 'low_1';
      if (symbol.id === 'low_2') symbolType = 'low_2';
      if (symbol.id === 'low_3') symbolType = 'low_3';
      
      // Use our fixed mockupService to get the correct path
      const mockupImageUrl = getMockupAsset('symbol', themeCategory, symbolType);
      
      console.log(`Loading symbol image from: ${mockupImageUrl} (theme: ${themeCategory})`);
      
      // Update symbol with "generated" image
      const finalSymbols = [...updatedSymbols];
      const finalIndex = finalSymbols.findIndex(s => s.id === id);
      
      if (finalIndex !== -1) {
        finalSymbols[finalIndex] = {
          ...finalSymbols[finalIndex],
          image: mockupImageUrl,
          isGenerating: false
        };
        
        setSymbols(finalSymbols);
        setLastGeneratedId(id);
        
        // Reset progress
        setGenerationProgress(prev => ({
          ...prev,
          [id]: 100
        }));
        
        // Update the config with the generated symbols
        const generatedSymbols = finalSymbols.map(s => s.image).filter(Boolean) as string[];
        updateConfig({
          theme: {
            ...config.theme,
            generated: {
              ...config.theme?.generated,
              symbols: generatedSymbols
            }
          }
        });
      }
    }, 3100);
  };

  // Generate all symbols at once
  const generateAllSymbols = () => {
    if (batchProcessing) return;
    
    setBatchProcessing(true);
    
    const pendingSymbols = symbols.filter(s => !s.image);
    let count = 0;
    
    const processNext = () => {
      if (count < pendingSymbols.length) {
        const symbol = pendingSymbols[count];
        count++;
        
        generateSymbol(symbol.id);
        
        // Schedule next symbol with a small delay
        setTimeout(processNext, 1000);
      } else {
        setBatchProcessing(false);
        
        setNotification({
          message: 'All symbols have been generated successfully!',
          type: 'success'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    };
    
    // Start processing
    processNext();
  };

  // Delete a symbol
  const deleteSymbol = (id: string) => {
    const updatedSymbols = symbols.filter(symbol => symbol.id !== id);
    setSymbols(updatedSymbols);
    
    // Update config
    const generatedSymbols = updatedSymbols.map(s => s.image).filter(Boolean) as string[];
    updateConfig({
      theme: {
        ...config.theme,
        generated: {
          ...config.theme?.generated,
          symbols: generatedSymbols
        }
      }
    });
  };

  // Edit a symbol
  const editSymbol = (id: string, field: string, value: any) => {
    const updatedSymbols = symbols.map(symbol => {
      if (symbol.id === id) {
        return { ...symbol, [field]: value };
      }
      return symbol;
    });
    
    setSymbols(updatedSymbols);
  };

  // Add a new symbol
  const addNewSymbol = () => {
    const newSymbol: Symbol = {
      id: `custom_${Math.random().toString(36).substring(2, 9)}`,
      name: `Custom ${symbols.length + 1}`,
      type: 'custom',
      image: null,
      isGenerating: false,
      objectDescription: '',
      animation: getDefaultAnimation('low')
    };
    
    setSymbols([...symbols, newSymbol]);
  };

  // Helper to check if there's data in local storage
  const checkLocalStorage = () => {
    return !!localStorage.getItem('slotai_symbols');
  };

  // Save symbols to local storage
  const handleSaveToLocalStorage = () => {
    const symbolsToSave = symbols.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      image: s.image,
      animation: s.animation
    }));
    
    localStorage.setItem('slotai_symbols', JSON.stringify(symbolsToSave));
    
    // Show notification
    setNotification({
      message: 'Symbols saved to local storage successfully!',
      type: 'success'
    });
    setTimeout(() => setNotification(null), 5000);
  };

  // Load symbols from local storage
  const handleLoadFromLocalStorage = () => {
    const storedData = localStorage.getItem('slotai_symbols');
    if (!storedData) return;
    
    try {
      const storedSymbols = JSON.parse(storedData);
      
      // Merge with existing symbols
      const updatedSymbols = symbols.map(symbol => {
        const stored = storedSymbols.find((s: any) => s.id === symbol.id);
        if (stored) {
          return { ...symbol, ...stored };
        }
        return symbol;
      });
      
      setSymbols(updatedSymbols);
      
      // Update config
      const generatedSymbols = updatedSymbols.map(s => s.image).filter(Boolean) as string[];
      updateConfig({
        theme: {
          ...config.theme,
          generated: {
            ...config.theme?.generated,
            symbols: generatedSymbols
          }
        }
      });
      
      // Show notification
      setNotification({
        message: 'Symbols loaded from local storage successfully!',
        type: 'success'
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setError('Failed to load symbols from local storage.');
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className="symbol-generator">
      <h2 className="text-2xl font-bold mb-6 text-center">Symbol Generator</h2>
      
      {/* Theme and controls */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Game Theme</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={theme}
                onChange={(e) => handleThemeUpdate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="e.g., Ancient Egypt, Space Adventure, etc."
              />
              <button 
                className="flex-shrink-0 bg-gray-100 p-2 rounded-lg text-gray-600 hover:bg-gray-200"
                title="Apply Theme to All Prompts"
              >
                <Paintbrush className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* API Status Indicator */}
            <div className="mr-2 px-3 py-1 bg-purple-50 text-purple-800 border border-purple-100 rounded-md text-xs flex items-center">
              <ImageIcon className="w-3 h-3 mr-1" />
              Using Leonardo.ai
              <span className="ml-1 px-1.5 py-0.5 bg-purple-100 rounded text-[10px]">
                {config?.leonardo?.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            <button
              onClick={generateAllSymbols}
              disabled={batchProcessing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg
                ${batchProcessing 
                  ? 'bg-gray-200 text-gray-500 cursor-wait' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {batchProcessing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating Symbols...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create All Symbols
                </>
              )}
            </button>
            
            {/* Save to Local Storage button */}
            <button
              onClick={handleSaveToLocalStorage}
              disabled={batchProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              title="Save symbols to local storage for use in later steps"
            >
              <Save className="w-4 h-4" />
              Save Locally
            </button>
            
            {/* Load from Local Storage button if data exists */}
            {checkLocalStorage() && (
              <button
                onClick={handleLoadFromLocalStorage}
                disabled={batchProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                title="Load symbols from local storage"
              >
                <Database className="w-4 h-4" />
                Load Saved
              </button>
            )}
            
            {/* API Settings Button */}
            <button
              onClick={() => {
                const apiKey = prompt("Enter your Leonardo.ai API Key:", 
                  config?.leonardo?.apiKey || "");
                
                if (apiKey) {
                  updateConfig({
                    leonardo: {
                      ...config.leonardo,
                      apiKey: apiKey,
                      modelId: 'aa77f04e-3eec-4034-9c07-d0f619684628', // Leonardo Kino XL
                      enabled: true
                    }
                  });
                  
                  setNotification({
                    message: `Leonardo.ai API key configured successfully`,
                    type: 'success'
                  });
                  setTimeout(() => setNotification(null), 5000);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              title="Configure Leonardo.ai API settings"
            >
              <Lock className="w-4 h-4" />
              Leonardo.ai Settings
            </button>
          </div>
        </div>
        
        {/* Notification message */}
        {notification && (
          <div className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2
            ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 
              notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 
              'bg-blue-50 border border-blue-200 text-blue-800'}`}
          >
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> :
             notification.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : 
             <ImageIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <div>{notification.message}</div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}
      </div>
      
      {/* Symbol cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {symbols.map(symbol => (
          <motion.div
            key={symbol.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: lastGeneratedId === symbol.id ? [1, 1.03, 1] : 1 
            }}
            transition={{ 
              duration: 0.3,
              scale: { duration: 0.5 }
            }}
          >
            <SymbolCardMockup
              symbol={symbol}
              onGenerate={generateSymbol}
              onDelete={deleteSymbol}
              onEdit={editSymbol}
              theme={theme}
              generationProgress={generationProgress[symbol.id] || 0}
            />
          </motion.div>
        ))}
        
        {/* Add new symbol card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className="h-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={addNewSymbol}
          >
            <PlusCircle className="w-12 h-12 text-gray-400 mb-4" />
            <div className="text-gray-600 font-medium">Add New Symbol</div>
            <div className="text-sm text-gray-500 mt-2 text-center">
              Create additional symbols for your game
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Symbol table overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <SplitSquareHorizontal className="w-5 h-5 text-blue-600 mr-2" />
          Symbol Overview
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {symbols.map((symbol, index) => (
                <tr key={symbol.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded-md bg-center bg-cover bg-no-repeat"
                        style={{ 
                          backgroundColor: typeColors[symbol.type],
                          backgroundImage: symbol.image ? `url(${symbol.image})` : 'none'
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {symbol.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span 
                      className="px-2 py-1 text-xs rounded-full capitalize"
                      style={{ 
                        backgroundColor: `${typeColors[symbol.type]}20`,
                        color: typeColors[symbol.type]
                      }}
                    >
                      {symbol.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {symbol.isGenerating ? (
                      <span className="text-blue-600 flex items-center">
                        <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                        Generating
                      </span>
                    ) : symbol.image ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Generated
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Generated
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MockupSymbolGenerator;