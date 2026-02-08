import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Add keyframe animation for progress bars
const progressBarStyles = `
  @keyframes progress {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0); }
    100% { transform: translateX(100%); }
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = progressBarStyles;
  document.head.appendChild(style);
}
import {
  ImageIcon,
  RefreshCw,
  PlusCircle,
  Trash2,
  Edit as EditIcon,
  Wand2,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon2,
  SplitSquareHorizontal,
  ZoomIn,
  Loader,
  Paintbrush,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Scissors,
  Copy,
  Download,
  Maximize2,
  MoveHorizontal,
  Camera,
  Filter,
  SlidersHorizontal,
  Lock,
  Save,
  Database
} from 'lucide-react';
import { useGameStore } from '../../store';
import { slotApiClient } from '../../utils/apiClient';
import { openaiClient } from '../../utils/openaiClient';
import { leonardoClient } from '../../utils/leonardoClient';
import { saveSymbolsToLocalStorage, getSymbolsFromLocalStorage } from '../../utils/symbolStorage';

// Define animation parameters interface
interface AnimationParams {
  intensity: number;
  speed: number;
  style: 'bounce' | 'rotate' | 'pulse' | 'shine' | 'float' | 'shake' | 'glow' | 'none';
  particleEffect: 'sparkle' | 'glow' | 'smoke' | 'coins' | 'stars' | 'none';
  autoPlay?: boolean;
  loop?: boolean;
  duration?: number;
}

// Define the symbol interface
interface Symbol {
  id: string;
  name: string;
  type: 'wild' | 'scatter' | 'high' | 'medium' | 'low';
  image: string | null;
  isGenerating: boolean;
  prompt: string;
  weight?: number;
  customStatus?: 'editing' | 'saved' | 'error';
  animation?: AnimationParams;
  svgData?: string;
  layers?: {id: string, name: string, visible: boolean}[];
  editHistory?: string[];
}

// Default placeholders for symbol images
const placeholderImages = {
  wild: '/public/themes/base-style.png',
  scatter: '/public/themes/ancient-egypt.png',
  high: '/public/themes/cosmic-adventure.png',
  medium: '/public/themes/deep-ocean.png',
  low: '/public/themes/enchanted-forest.png'
};

// Define type color mappings
const typeColors = {
  wild: '#f59e0b', // amber
  scatter: '#8b5cf6', // purple
  high: '#3b82f6', // blue
  medium: '#10b981', // green
  low: '#ef4444', // red
};

// Define symbol types
const symbolTypes = ['wild', 'scatter', 'high', 'medium', 'low'];

// Single Symbol Card Component
const SymbolCard: React.FC<{
  symbol: Symbol;
  onGenerate: (id: string, prompt: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Symbol>) => void;
  theme: string;
  generationProgress?: number;
}> = ({ symbol, onGenerate, onDelete, onEdit, theme, generationProgress = 0 }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [promptValue, setPromptValue] = useState(symbol.prompt);
  const [typeValue, setTypeValue] = useState(symbol.type);
  const [nameValue, setNameValue] = useState(symbol.name);
  const [objectDescription, setObjectDescription] = useState('');

  // Update local state when prop changes
  useEffect(() => {
    setPromptValue(symbol.prompt);
    setTypeValue(symbol.type);
    setNameValue(symbol.name);
    
    // Try to extract object description from prompt if it exists
    const extractedObject = extractObjectFromPrompt(symbol.prompt, symbol.type, theme);
    setObjectDescription(extractedObject || '');
  }, [symbol, theme]);
  
  // Helper function to extract object description from prompt
  const extractObjectFromPrompt = (prompt: string, type: string, theme: string): string | null => {
    if (!prompt) return null;
    
    // Updated regex patterns to match the new AAA-quality prompts
    let regex: RegExp;
    
    switch (type) {
      case 'wild':
      case 'scatter':
      case 'high':
      case 'medium':
      case 'low':
        // This pattern will work for all the new prompt formats
        regex = new RegExp(`featuring a (.*?) with transparent background`);
        break;
      default:
        regex = new RegExp(`featuring a (.*?) with transparent background`);
    }
    
    const match = prompt.match(regex);
    return match ? match[1] : null;
  };

  // Handle generate click
  const handleGenerateClick = () => {
    onGenerate(symbol.id, promptValue);
  };
  
  // Handle saving edits
  const handleSaveEdit = () => {
    // First, update the prompt with current object description if needed
    if (objectDescription) {
      const updatedPrompt = generateOptimizedPrompt(typeValue as any, theme, objectDescription);
      setPromptValue(updatedPrompt);
      
      onEdit(symbol.id, {
        name: nameValue,
        type: typeValue as any,
        prompt: updatedPrompt
      });
    } else {
      onEdit(symbol.id, {
        name: nameValue,
        type: typeValue as any,
        prompt: promptValue
      });
    }
    setIsEditing(false);
  };

  // Get appropriate display for symbol background
  const getSymbolBackground = () => {
    if (symbol.image) {
      return `url(${symbol.image})`;
    }
    return typeColors[symbol.type];
  };

  return (
    <div className={`symbol-card bg-white rounded-xl shadow-sm overflow-hidden ${isEditing ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="p-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <div 
            className="w-8 h-8 rounded-md mr-3 flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: typeColors[symbol.type] }}
          >
            {symbol.name.charAt(0).toUpperCase()}
          </div>
          
          {isEditing ? (
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
            />
          ) : (
            <h3 className="font-medium">{symbol.name}</h3>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <select
              value={typeValue}
              onChange={(e) => setTypeValue(e.target.value as any)}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
            >
              {symbolTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 capitalize">{symbol.type}</span>
          )}
          
          <button
            onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
            className="p-1 text-gray-500 hover:text-blue-600"
          >
            {isEditing ? <CheckCircle className="w-4 h-4" /> : <EditIcon className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => onDelete(symbol.id)}
            className="p-1 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div 
        className="h-40 w-full bg-center bg-cover bg-no-repeat relative flex items-center justify-center"
        style={{ 
          backgroundColor: symbol.image ? 'transparent' : typeColors[symbol.type],
          backgroundImage: symbol.image ? `url(${symbol.image})` : 'none',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: symbol.image ? 'drop-shadow(0 0 2px rgba(0,0,0,0.1))' : 'none',
          // Apply masking to remove the white background if image exists
          ...(symbol.image ? {
            WebkitMaskImage: `url(${symbol.image})`,
            maskImage: `url(${symbol.image})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center'
          } : {})
        }}
      >
        {!symbol.image && !symbol.isGenerating && (
          <div className="text-white text-center p-4">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-75" />
            <div className="text-sm opacity-80">No image generated</div>
          </div>
        )}
        
        {symbol.isGenerating && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
            <div className="text-white text-center mb-3">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <div className="text-sm">Generating symbol...</div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full px-4 max-w-[250px] mx-auto">
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                    style={{width: `${generationProgress}%`}}></div>
              </div>
              <div className="text-xs text-white flex items-center justify-between">
                <span>Symbol Generation</span>
                {generationProgress > 0 && (
                  <span className="font-mono bg-blue-900 text-blue-100 px-1.5 rounded text-[10px]">
                    {Math.round(generationProgress)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3">
        {/* Display generated symbol preview above button when available */}
        {symbol.image && (
          <div className="mb-3 text-center">
            <div className="relative inline-block">
              <img 
                src={symbol.image} 
                alt={`Generated ${symbol.name}`} 
                className="h-16 w-auto mx-auto object-contain rounded shadow-sm"
              />
              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                ✓
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">Symbol Generated</div>
          </div>
        )}
        
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Symbol Object</label>
          <input
            type="text"
            placeholder={getSymbolObjectPlaceholder(symbol.type, theme)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            value={objectDescription}
            onChange={(e) => {
              const newObjectDescription = e.target.value.trim();
              setObjectDescription(newObjectDescription);
              // Generate the optimized prompt and set it
              setPromptValue(generateOptimizedPrompt(symbol.type, theme, newObjectDescription));
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            Specify what object you want for this {symbol.type} symbol
          </p>
          
          {isEditing && (
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Advanced Prompt</label>
              <textarea
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-20"
                placeholder={`${theme} symbol, ${symbol.type} symbol type...`}
              />
            </div>
          )}
          
          {!isEditing && (
            <div className="text-sm bg-gray-50 p-2 rounded min-h-[60px] max-h-[80px] overflow-auto mt-2">
              <p className="text-xs font-medium text-gray-600">Generated Prompt:</p>
              <div className="text-xs text-gray-500">
                {symbol.prompt || `${theme} ${symbol.type} symbol`}
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleGenerateClick}
          disabled={symbol.isGenerating}
          className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm
            ${symbol.isGenerating 
              ? 'bg-gray-200 text-gray-500 cursor-wait' 
              : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {symbol.isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="mr-1">Generating...</span>
              <span className="inline-block w-16 h-1 bg-gray-300 rounded-full overflow-hidden">
                <span className="block h-full bg-white animate-[progress_1.5s_ease-in-out_infinite]" style={{width: '100%'}}></span>
              </span>
            </>
          ) : symbol.image ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate Symbol
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Helper function to get placeholder text based on symbol type and theme
const getSymbolObjectPlaceholder = (type: string, theme: string) => {
  // Theme-specific placeholder suggestions
  if (theme.toLowerCase().includes('egypt')) {
    switch (type) {
      case 'wild':
        return `Example: Golden scarab beetle (for Egyptian theme)`;
      case 'scatter':
        return `Example: Ancient pyramid (for Egyptian theme)`;
      case 'high':
        return `Example: Pharaoh mask, Sphinx, Horus eye (for Egyptian theme)`;
      case 'medium':
        return `Example: Ankh symbol, Lotus flower (for Egyptian theme)`;
      case 'low':
        return `Example: Hieroglyphic symbol, Papyrus scroll (for Egyptian theme)`;
      default:
        return `Enter Egyptian themed object...`;
    }
  } else if (theme.toLowerCase().includes('aztec')) {
    switch (type) {
      case 'wild':
        return `Example: Golden sun disk (for Aztec theme)`;
      case 'scatter':
        return `Example: Ancient temple pyramid (for Aztec theme)`;
      case 'high':
        return `Example: Tribal mask, Jaguar totem (for Aztec theme)`;
      case 'medium':
        return `Example: Aztec calendar, Feathered serpent (for Aztec theme)`;
      case 'low':
        return `Example: Stone carving, Tribal pattern (for Aztec theme)`;
      default:
        return `Enter Aztec themed object...`;
    }
  } else if (theme.toLowerCase().includes('asian') || theme.toLowerCase().includes('dynasty')) {
    switch (type) {
      case 'wild':
        return `Example: Golden dragon (for Asian theme)`;
      case 'scatter':
        return `Example: Pagoda temple (for Asian theme)`;
      case 'high':
        return `Example: Emperor's seal, Imperial crown (for Asian theme)`;
      case 'medium':
        return `Example: Lotus flower, Paper lantern (for Asian theme)`;
      case 'low':
        return `Example: Dynasty coin, Bamboo scroll (for Asian theme)`;
      default:
        return `Enter Asian themed object...`;
    }
  } else {
    // Generic placeholders
    switch (type) {
      case 'wild':
        return `Example: Golden emblem (for ${theme})`;
      case 'scatter':
        return `Example: Magical artifact (for ${theme})`;
      case 'high':
        return `Example: Premium icon (for ${theme})`;
      case 'medium':
        return `Example: Themed symbol (for ${theme})`;
      case 'low':
        return `Example: Simple icon (for ${theme})`;
      default:
        return `Enter object for ${theme} theme...`;
    }
  }
};

// Function to generate optimized prompts for each symbol type with AAA quality and proper theming
const generateOptimizedPrompt = (type: string, theme: string, objectDescription: string) => {
  if (!objectDescription) {
    // Default objects based on theme if none provided
    if (theme.toLowerCase().includes('egypt')) {
      objectDescription = type === 'wild' ? 'golden scarab beetle' : 
                          type === 'scatter' ? 'ancient pyramid' : 
                          type === 'high' ? 'pharaoh mask' :
                          type === 'medium' ? 'ankh symbol' :
                          'hieroglyphic symbol';
    } else if (theme.toLowerCase().includes('asian') || theme.toLowerCase().includes('dynasty')) {
      objectDescription = type === 'wild' ? 'golden dragon' : 
                          type === 'scatter' ? 'temple pagoda' : 
                          type === 'high' ? 'emperor\'s seal' :
                          type === 'medium' ? 'lotus flower' :
                          'dynasty coin';
    } else {
      objectDescription = type === 'wild' ? 'stylized WILD text' : 
                          type === 'scatter' ? 'mystical scatter symbol' : 
                          `${theme} ${type}-value symbol`;
    }
  }

  // Get thematic style based on theme name
  let thematicStyle = '';
  let letteringStyle = '';
  let decorationStyle = '';
  
  if (theme.toLowerCase().includes('egypt')) {
    thematicStyle = 'ancient Egyptian';
    letteringStyle = 'hieroglyphic-inspired gold';
    decorationStyle = 'ornate scarabs, ankhs, and hieroglyphs';
  } else if (theme.toLowerCase().includes('aztec')) {
    thematicStyle = 'ancient Aztec';
    letteringStyle = 'Mesoamerican stone-carved';
    decorationStyle = 'tribal patterns, sun symbols, and jaguar motifs';
  } else if (theme.toLowerCase().includes('asian') || theme.toLowerCase().includes('dynasty')) {
    thematicStyle = 'traditional Asian';
    letteringStyle = 'calligraphic brushstroke';
    decorationStyle = 'dragons, cloud patterns, and ornate Chinese knots';
  } else if (theme.toLowerCase().includes('forest') || theme.toLowerCase().includes('enchanted')) {
    thematicStyle = 'mystical forest';
    letteringStyle = 'vine-wrapped wooden';
    decorationStyle = 'leaves, mushrooms, and magical forest elements';
  } else if (theme.toLowerCase().includes('fantasy')) {
    thematicStyle = 'high fantasy';
    letteringStyle = 'ancient runic';
    decorationStyle = 'magical runes, gemstones, and elemental motifs';
  } else {
    thematicStyle = theme;
    letteringStyle = 'stylized';
    decorationStyle = `${theme} themed elements`;
  }

  switch (type) {
    case 'wild':
      return `Isolated slot machine WILD symbol for ${theme} theme with COMPLETELY TRANSPARENT background. Create a single ${objectDescription} object with the word "WILD" prominently displayed. The design should match ${thematicStyle} style appropriate for a ${theme} theme. IMPORTANT: Create ONLY ONE isolated object with NO BACKGROUND elements whatsoever. The image must be high-quality with perfect transparency (alpha channel) for direct use in slot games. Use vibrant colors with strong contrast and a recognizable silhouette.`;
    
    case 'scatter':
      return `Isolated slot machine SCATTER symbol for ${theme} theme with COMPLETELY TRANSPARENT background. Create a single ${objectDescription} object with the word "SCATTER" subtly incorporated if needed. The design should match ${thematicStyle} style appropriate for a ${theme} theme. IMPORTANT: Create ONLY ONE isolated object with NO BACKGROUND elements whatsoever. The image must be high-quality with perfect transparency (alpha channel) for direct use in slot games. Use bright colors with strong contrast and a recognizable silhouette.`;
    
    case 'high':
      return `Isolated high-paying slot symbol for ${theme} theme with COMPLETELY TRANSPARENT background. Create a single ${objectDescription} object with premium/high-value appearance. The design should match ${thematicStyle} style appropriate for a ${theme} theme. IMPORTANT: Create ONLY ONE isolated object with NO BACKGROUND elements whatsoever. The image must be high-quality with perfect transparency (alpha channel) for direct use in slot games. Use rich colors with luxurious detailing and a recognizable silhouette.`;
    
    case 'medium':
      return `Isolated medium-paying slot symbol for ${theme} theme with COMPLETELY TRANSPARENT background. Create a single ${objectDescription} object with balanced, professional appearance. The design should match ${thematicStyle} style appropriate for a ${theme} theme. IMPORTANT: Create ONLY ONE isolated object with NO BACKGROUND elements whatsoever. The image must be high-quality with perfect transparency (alpha channel) for direct use in slot games. Use medium-brightness colors and balanced detailing.`;
    
    case 'low':
      return `Isolated low-paying slot symbol for ${theme} theme with COMPLETELY TRANSPARENT background. Create a single ${objectDescription} object with simple, clean appearance. The design should match ${thematicStyle} style appropriate for a ${theme} theme. IMPORTANT: Create ONLY ONE isolated object with NO BACKGROUND elements whatsoever. The image must be high-quality with perfect transparency (alpha channel) for direct use in slot games. Use clear shapes and a simplified color palette.`;
    
    default:
      return `Isolated slot machine symbol for ${theme} theme with COMPLETELY TRANSPARENT background. Create a single ${objectDescription} object appropriate for a slot game. The design should match ${thematicStyle} style. IMPORTANT: Create ONLY ONE isolated object with NO BACKGROUND elements whatsoever. The image must be high-quality with perfect transparency (alpha channel) for direct use in slot games. Use clear shapes and strong contrast for good visibility.`;
  }
};

// Symbol Generator Main Component
const SymbolGenerator: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedId, setLastGeneratedId] = useState<string | null>(null);
  const [theme, setTheme] = useState(config?.theme?.mainTheme || 'fantasy slot game');
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<Record<string, number>>({});
  
  // Helper function to generate default animation params based on symbol type
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
    // Mock SVG data for the wild symbol (simplified)
    const mockWildSvgData = `
      <g>
        <circle cx="50" cy="50" r="40" fill="url(#gold-gradient)" />
        <text x="50" y="55" font-size="20" text-anchor="middle" fill="white" font-weight="bold">WILD</text>
        <defs>
          <radialGradient id="gold-gradient">
            <stop offset="0%" stop-color="#fff6d5" />
            <stop offset="50%" stop-color="#ffcc33" />
            <stop offset="100%" stop-color="#cc9900" />
          </radialGradient>
        </defs>
      </g>
    `;
    
    const defaultSymbols: Symbol[] = [
      {
        id: 'wild_1',
        name: 'WILD',
        type: 'wild',
        image: config?.theme?.generated?.symbols?.[0] || null,
        isGenerating: false,
        prompt: `256x256 px high-detail icon of a golden 'WILD' emblem for a ${theme} slot game, designed for a transparent background. The word 'WILD' is embossed in ancient runic-style letters carved into a polished gold plate, surrounded by jungle vines, small gemstones, and mysterious tribal engravings. The icon should have a strong silhouette, glowing magical aura, rich lighting with soft shadows and sharp highlights, no background, no watermark, no text outside the emblem. Visually distinct at small sizes, designed for 72–144 DPI slot game interface. Fantasy-adventure tone, high realism, cinematic texture finish.`,
        animation: getDefaultAnimation('wild'),
        svgData: mockWildSvgData,
        layers: [
          {id: 'base', name: 'Base Layer', visible: true},
          {id: 'glow', name: 'Glow Effect', visible: true},
          {id: 'particles', name: 'Particles', visible: true}
        ],
        editHistory: ['Initial creation', 'Added glow effect', 'Enhanced particles']
      },
      {
        id: 'scatter_1',
        name: 'SCATTER',
        type: 'scatter',
        image: config?.theme?.generated?.symbols?.[1] || null,
        isGenerating: false,
        prompt: `A single isolated ${theme} SCATTER symbol for slot machine with transparent background. The symbol should be centered and feature magical glowing effects with a mystical appearance. Create as an isolated object with completely transparent background. No text or watermarks. Symbol should occupy 70% of the image area with clear edges and high contrast for digital extraction.`,
        animation: getDefaultAnimation('scatter')
      },
      {
        id: 'high_1',
        name: 'H1',
        type: 'high',
        image: config?.theme?.generated?.symbols?.[2] || null,
        isGenerating: false,
        prompt: `A single high-value ${theme} slot machine symbol with transparent background. The symbol should be premium quality, detailed, and centered as an isolated object. Create with completely transparent background (alpha channel) and high contrast with clear edges. No text, watermarks, or elements outside the main symbol.`,
        animation: getDefaultAnimation('high'),
        layers: [
          {id: 'base', name: 'Base Layer', visible: true},
          {id: 'glow', name: 'Glow Effect', visible: true}
        ]
      },
      {
        id: 'high_2',
        name: 'H2',
        type: 'high',
        image: config?.theme?.generated?.symbols?.[3] || null,
        isGenerating: false,
        prompt: `A single unique high-value ${theme} slot machine symbol, distinct from others. MUST BE ON 100% PURE WHITE BACKGROUND (RGB 255,255,255) with no shadows or gradients outside the symbol itself. The symbol must be centered on a completely white background for easy digital extraction. Premium quality, detailed design. No text or watermarks.`,
        animation: getDefaultAnimation('high')
      },
      {
        id: 'medium_1',
        name: 'M1',
        type: 'medium',
        image: config?.theme?.generated?.symbols?.[4] || null,
        isGenerating: false,
        prompt: `A single medium-value ${theme} slot machine symbol. MUST BE ON PERFECT WHITE BACKGROUND (RGB 255,255,255) with no shadows, patterns, or noise in the background area. The symbol should be centered, with good quality and detail. The white background must be completely uniform and pure for automatic extraction. No text or watermarks.`,
        animation: getDefaultAnimation('medium')
      },
      {
        id: 'medium_2',
        name: 'M2',
        type: 'medium',
        image: config?.theme?.generated?.symbols?.[5] || null,
        isGenerating: false,
        prompt: `A single unique medium-value ${theme} slot machine symbol, distinct from others. MUST BE ON PURE WHITE BACKGROUND (RGB 255,255,255) with absolutely no shadows, gradients or texture in the background. The symbol should be centered with good quality, on a completely uniform white background for automatic extraction. No text or decorative elements.`,
        animation: getDefaultAnimation('medium')
      },
      {
        id: 'low_1',
        name: 'L1',
        type: 'low',
        image: config?.theme?.generated?.symbols?.[6] || null,
        isGenerating: false,
        prompt: `A single low-value ${theme} slot machine symbol with simple design. MUST BE ON 100% PURE WHITE BACKGROUND (RGB 255,255,255) with absolutely no shadows or background elements. The symbol should be centered on a perfectly white canvas for easy digital removal of background. Clean edges, simple design. No text or watermarks.`,
        animation: getDefaultAnimation('low')
      },
      {
        id: 'low_2',
        name: 'L2',
        type: 'low',
        image: config?.theme?.generated?.symbols?.[7] || null,
        isGenerating: false,
        prompt: `A single unique low-value ${theme} slot machine symbol, distinct from others. MUST BE ON PERFECTLY WHITE BACKGROUND (RGB 255,255,255) with no shading, shadows or visual elements in the background. The symbol must be centered, simple but distinct, with a completely white surrounding for automatic extraction. No text or decorations.`,
        animation: getDefaultAnimation('low')
      },
      {
        id: 'low_3',
        name: 'L3',
        type: 'low',
        image: (() => {
          const symbols = config?.theme?.generated?.symbols;
          if (!symbols) return null;
          if (Array.isArray(symbols)) return symbols[8] || null;
          const symbolUrls = Object.values(symbols);
          return symbolUrls[8] || null;
        })(),
        isGenerating: false,
        prompt: `A single unique low-value ${theme} slot machine symbol, distinct from others. MUST BE ON PERFECTLY WHITE BACKGROUND (RGB 255,255,255) with no shading, shadows or visual elements in the background. The symbol must be centered, simple but distinct, with a completely white surrounding for automatic extraction. No text or decorations.`,
        animation: getDefaultAnimation('low')
      }
    ];
    
    setSymbols(defaultSymbols);
    setTheme(config?.theme?.mainTheme || 'fantasy slot game');
  }, []);
  
  // Function to get fallback image based on symbol type
  const getFallbackImage = (symbolId: string, promptText: string): string => {
    // Extract type from the symbol ID or use prompt content to determine
    const type = symbolId.split('_')[0] || 'medium';
    
    // Map of fallback images by type
    const fallbackImages = {
      wild: '/public/themes/base-style.png',
      scatter: '/public/themes/ancient-egypt.png',
      high: '/public/themes/cosmic-adventure.png',
      medium: '/public/themes/deep-ocean.png',
      low: '/public/themes/enchanted-forest.png'
    };
    
    // Default to medium if type not recognized
    return fallbackImages[type as keyof typeof fallbackImages] || fallbackImages.medium;
  };
  
  // Helper function to create a data URL from a canvas
  const createSymbolPlaceholder = (symbolName: string, type: 'wild' | 'scatter' | 'high' | 'medium' | 'low'): string => {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Canvas context not available');
      return '';
    }
    
    // Get background color based on symbol type
    const bgColor = typeColors[type];
    
    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Add symbol name text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Adjust font size based on name length
    const fontSize = Math.min(60, 400 / symbolName.length);
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillText(symbolName, canvas.width / 2, canvas.height / 2);
    
    // Add shadow/glow effect
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Add type label
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText(type.toUpperCase(), canvas.width / 2, canvas.height - 30);
    
    // Convert to data URL
    return canvas.toDataURL('image/png');
  };

  // Generate a single symbol using OpenAI DALL-E API
  const generateSymbol = async (id: string, prompt: string) => {
    try {
      setError(null);
      
      // Find the symbol to be generated
      const symbolToGenerate = symbols.find(s => s.id === id);
      if (!symbolToGenerate) {
        throw new Error(`Symbol with id ${id} not found`);
      }
      
      // Update symbol status to generating and initialize progress
      setSymbols(prevSymbols => prevSymbols.map(s => 
        s.id === id ? { ...s, isGenerating: true } : s
      ));
      setGenerationProgress({...generationProgress, [id]: 0});
      
      // Simulate progress updates while waiting for API
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const currentProgress = prev[id] || 0;
          // Increment by 10-20% each time, but never reach 100% until complete
          const newProgress = Math.min(currentProgress + (Math.random() * 10 + 10), 95);
          return {...prev, [id]: newProgress};
        });
      }, 500);
      
      // Prepare prompt with theme context if not already included
      const fullPrompt = prompt.includes(theme) ? prompt : `${theme}, ${prompt}`;
      
      console.log('Generating symbol with Leonardo.ai:', fullPrompt);
      
      // Generate symbol with image generation API
      let generatedImageUrl;
      let usedFallback = false;
      
      try {
        // First check if Leonardo.ai integration is enabled (preferred)
        if (config.leonardo?.enabled && config.leonardo?.apiKey) {
          // Use Leonardo.ai to generate image with minimal parameters to avoid API errors
          const result = await leonardoClient.generateImage(
            fullPrompt, 
            config, 
            {
              width: config.leonardo?.width || 768,
              height: config.leonardo?.height || 768,
              modelId: config.leonardo?.modelId,
              negativePrompt: "text, watermark, signature, blurry, distorted, bad quality, low quality, ugly, duplicate, malformed, out of frame, extra fingers, weird text, letters, logo, white background"
            }
          );
          
          if (result.imageUrl) {
            generatedImageUrl = result.imageUrl;
            console.log('Successfully generated image with Leonardo.ai');
            console.log('Seed used:', result.seed);
          } else {
            console.warn('Leonardo.ai image generation failed, trying OpenAI as fallback');
            usedFallback = true;
          }
        } 
        // If Leonardo.ai fails or isn't enabled, try OpenAI
        else if (config.openai?.enabled && config.openai?.apiKey && !generatedImageUrl) {
          console.log('Using OpenAI DALL-E as fallback');
          // Use OpenAI DALL-E to generate image
          const result = await openaiClient.generateImage(
            fullPrompt, 
            config, 
            {
              size: '1024x1024',
              quality: 'standard',
              style: 'vivid' // More vibrant and saturated for slot symbols
            }
          );
          
          if (result.imageUrl) {
            generatedImageUrl = result.imageUrl;
            console.log('Successfully generated image with OpenAI DALL-E');
            
            if (result.revisedPrompt) {
              console.log('Revised prompt:', result.revisedPrompt);
            }
          } else {
            console.warn('OpenAI image generation failed, using built-in fallback');
            usedFallback = true;
          }
        } else {
          console.warn('No image generation APIs configured, using fallback');
          usedFallback = true;
        }
      } catch (genError) {
        console.error('Symbol generation failed:', genError);
        usedFallback = true;
      }
      
      // If the API fails or returns a fallback, create a custom placeholder
      if (usedFallback) {
        generatedImageUrl = createSymbolPlaceholder(
          symbolToGenerate.name, 
          symbolToGenerate.type
        );
      }
      
      // Stop progress updates
      clearInterval(progressInterval);
      
      // Set progress to 100% when complete
      setGenerationProgress(prev => ({...prev, [id]: 100}));
      
      // Update symbol with generated image
      setSymbols(prevSymbols => prevSymbols.map(s => 
        s.id === id ? { 
          ...s, 
          image: generatedImageUrl, 
          isGenerating: false
        } : s
      ));
      
      // Store last generated ID for animation
      setLastGeneratedId(id);
      
      // Update config with new symbols
      const updatedSymbols = symbols.map(s => 
        s.id === id ? { 
          ...s, 
          image: generatedImageUrl, 
          isGenerating: false
        } : s
      );
      
      // Extract symbol images for config update
      const symbolImages = updatedSymbols
        .filter(s => s.image)
        .map(s => s.image) as string[];
      
      updateConfig({
        theme: {
          ...config.theme,
          generated: {
            ...config.theme?.generated,
            symbols: symbolImages
          }
        }
      });
      
      // Clear progress after a delay
      setTimeout(() => {
        setGenerationProgress(prev => {
          const newState = {...prev};
          delete newState[id];
          return newState;
        });
      }, 2000);
      
    } catch (err) {
      console.error('Error generating symbol:', err);
      
      // Find the symbol that failed
      const failedSymbol = symbols.find(s => s.id === id);
      
      // Create a placeholder for the error case
      let fallbackImage;
      if (failedSymbol) {
        fallbackImage = createSymbolPlaceholder(failedSymbol.name, failedSymbol.type);
      } else {
        fallbackImage = getFallbackImage(id, prompt);
      }
      
      console.log(`Using fallback image due to error for ${id}`);
      
      // Update symbol with fallback image instead of error state
      setSymbols(prevSymbols => prevSymbols.map(s => 
        s.id === id ? { 
          ...s, 
          image: fallbackImage, 
          isGenerating: false 
        } : s
      ));
      
      // Clear progress for this symbol
      setGenerationProgress(prev => {
        const newState = {...prev};
        delete newState[id];
        return newState;
      });
    }
  };
  
  // Generate all symbols using OpenAI DALL-E
  const generateAllSymbols = async () => {
    setBatchProcessing(true);
    
    console.log('Generating all symbols using OpenAI DALL-E');
    
    // Check if OpenAI is configured
    if (!config.openai?.enabled || !config.openai?.apiKey) {
      console.warn('OpenAI integration not enabled or missing API key, using fallbacks');
      setNotification({
        message: 'OpenAI API key not configured. Please set up OpenAI in Settings.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    }
    
    let processed = 0;
    
    try {
      setNotification({
        message: 'Starting batch symbol creation with OpenAI DALL-E...',
        type: 'info'
      });
      
      for (const symbol of symbols) {
        if (!symbol.image) {
          await generateSymbol(symbol.id, symbol.prompt);
          processed++;
          // Add a small delay between generations for better UX
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      
      // Create a notification message
      if (processed > 0) {
        setNotification({
          message: `Successfully created ${processed} symbols with OpenAI DALL-E`,
          type: 'success'
        });
        setTimeout(() => setNotification(null), 5000);
        console.log(`Successfully created ${processed} symbols with OpenAI DALL-E`);
      } else {
        setNotification({
          message: 'All symbols already have images created',
          type: 'info'
        });
        setTimeout(() => setNotification(null), 5000);
        console.log('All symbols already have images created');
      }
    } catch (error) {
      console.error('Error during batch generation:', error);
      setError('Some symbols failed to generate. Please try again.');
      setNotification({
        message: 'Some symbols failed to generate. Please try again.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setBatchProcessing(false);
    }
  };
  
  // Add a new symbol
  const addNewSymbol = () => {
    const newId = `symbol_${Date.now()}`;
    // Get theme-specific styling for the new symbol
    let thematicStyle = '';
    let decorationStyle = '';
    
    if (theme.toLowerCase().includes('egypt')) {
      thematicStyle = 'ancient Egyptian';
      decorationStyle = 'ornate scarabs, ankhs, and hieroglyphs';
    } else if (theme.toLowerCase().includes('aztec')) {
      thematicStyle = 'ancient Aztec';
      decorationStyle = 'tribal patterns, sun symbols, and jaguar motifs';
    } else if (theme.toLowerCase().includes('asian')) {
      thematicStyle = 'traditional Asian';
      decorationStyle = 'dragons, cloud patterns, and ornate Chinese knots';
    } else {
      thematicStyle = theme;
      decorationStyle = `${theme} themed elements`;
    }
    
    // Create a default object based on theme
    const defaultObject = theme.toLowerCase().includes('egypt') ? 'ankh symbol' : 
                        theme.toLowerCase().includes('aztec') ? 'aztec calendar' :
                        theme.toLowerCase().includes('asian') ? 'lotus flower' :
                        'themed symbol';
    
    const newSymbol: Symbol = {
      id: newId,
      name: `SYM${symbols.length + 1}`,
      type: 'medium',
      image: null,
      isGenerating: false,
      prompt: `Isolated medium-paying slot symbol for ${theme} theme with COMPLETELY TRANSPARENT background. Create a single ${defaultObject} object with balanced, professional appearance. The design should match ${thematicStyle} style appropriate for a ${theme} theme. IMPORTANT: Create ONLY ONE isolated object with NO BACKGROUND elements whatsoever. The image must be high-quality with perfect transparency (alpha channel) for direct use in slot games. Use medium-brightness colors and balanced detailing.`
    };
    
    setSymbols([...symbols, newSymbol]);
  };
  
  // Delete a symbol
  const deleteSymbol = (id: string) => {
    setSymbols(symbols.filter(s => s.id !== id));
  };
  
  // Edit a symbol
  const editSymbol = (id: string, updates: Partial<Symbol>) => {
    setSymbols(symbols.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  };
  
  // Handle theme update
  const handleThemeUpdate = (newTheme: string) => {
    setTheme(newTheme);
    
    // Update prompts with new theme
    setSymbols(prevSymbols => prevSymbols.map(s => ({
      ...s,
      prompt: s.prompt.replace(theme, newTheme)
    })));
  };
  

  // Add a state for notification messages
  const [notification, setNotification] = useState<{
    message: string; 
    type: 'success' | 'error' | 'info'
  } | null>(null);

  // Add a function to check if symbols exist in local storage
  const checkLocalStorage = () => {
    const saved = getSymbolsFromLocalStorage(config?.gameId);
    return saved && saved.length > 0;
  };

  // Add a function to handle saving symbols to local storage
  const handleSaveToLocalStorage = () => {
    const hasImages = symbols.some(s => s.image);
    
    if (!hasImages) {
      setNotification({
        message: 'Please generate at least one symbol image before saving.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    
    const success = saveSymbolsToLocalStorage(symbols, config?.gameId);
    
    if (success) {
      setNotification({
        message: 'Symbols successfully saved to local storage!',
        type: 'success'
      });
      setTimeout(() => setNotification(null), 5000);
    } else {
      setNotification({
        message: 'Failed to save symbols. Please try again.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Add function to load symbols from local storage
  const handleLoadFromLocalStorage = () => {
    const saved = getSymbolsFromLocalStorage(config?.gameId);
    
    if (!saved || saved.length === 0) {
      setNotification({
        message: 'No saved symbols found in local storage.',
        type: 'info'
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    
    // Update the existing symbols with saved data where possible
    const updatedSymbols = [...symbols];
    
    saved.forEach(savedSymbol => {
      const index = updatedSymbols.findIndex(s => 
        s.id === savedSymbol.id || s.type === savedSymbol.type
      );
      
      if (index >= 0) {
        // Update existing symbol with saved data
        updatedSymbols[index] = {
          ...updatedSymbols[index],
          image: savedSymbol.image,
          name: savedSymbol.name,
          type: savedSymbol.type as any,
          weight: savedSymbol.weight
        };
      } else {
        // Add as new symbol if no match found
        updatedSymbols.push({
          id: savedSymbol.id,
          name: savedSymbol.name,
          type: savedSymbol.type as any,
          image: savedSymbol.image,
          isGenerating: false,
          prompt: `${theme} ${savedSymbol.type} symbol`
        });
      }
    });
    
    setSymbols(updatedSymbols);
    
    // Also update the config store with the images
    const symbolImages = updatedSymbols
      .filter(s => s.image)
      .map(s => s.image) as string[];
    
    updateConfig({
      theme: {
        ...config.theme,
        generated: {
          ...config.theme?.generated,
          symbols: symbolImages
        }
      }
    });
    
    setNotification({
      message: 'Symbols loaded from local storage!',
      type: 'success'
    });
    setTimeout(() => setNotification(null), 5000);
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
            {/* OpenAI API Status Indicator */}
            <div className="mr-2 px-3 py-1 bg-purple-50 text-purple-800 border border-purple-100 rounded-md text-xs flex items-center">
              <ImageIcon2 className="w-3 h-3 mr-1" />
              Using Leonardo.ai
              <span className="ml-1 px-1.5 py-0.5 bg-purple-100 rounded text-[10px]">
                {config?.leonardo?.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            {!config?.leonardo?.enabled && (
              <div className="mr-2 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-xs flex items-center">
                <ImageIcon2 className="w-3 h-3 mr-1" />
                OpenAI Fallback
                <span className="ml-1 px-1.5 py-0.5 bg-blue-100 rounded text-[10px]">
                  {config?.openai?.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            )}
          
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
            
            {/* Add Save to Local Storage button */}
            <button
              onClick={handleSaveToLocalStorage}
              disabled={batchProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              title="Save symbols to local storage for use in later steps"
            >
              <Save className="w-4 h-4" />
              Save Locally
            </button>
            
            {/* Add Load from Local Storage button if data exists */}
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
            
            {/* OpenAI API Settings Button */}
            <button
              onClick={() => {
                const apiKey = prompt("Enter your Leonardo.ai API Key:", 
                  config?.leonardo?.apiKey || "");
                
                if (apiKey) {
                  updateConfig({
                    leonardo: {
                      ...config.leonardo,
                      apiKey: apiKey,
                      modelId: 'e316348f-7773-490e-adcd-46757c738eb7', // Leonardo Diffusion XL
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
            
            <button
              onClick={() => {
                const apiKey = prompt("Enter your OpenAI API Key:", 
                  config?.openai?.apiKey || "");
                
                if (apiKey) {
                  updateConfig({
                    openai: {
                      ...config.openai,
                      apiKey: apiKey,
                      modelName: 'dall-e-3',
                      enabled: true
                    }
                  });
                  
                  setNotification({
                    message: `OpenAI API key configured successfully`,
                    type: 'success'
                  });
                  setTimeout(() => setNotification(null), 5000);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              title="Configure OpenAI API settings"
            >
              <Lock className="w-4 h-4" />
              OpenAI Settings
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
            <SymbolCard
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
      
      {/* Symbol Animation Studio */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Layers className="w-5 h-5 text-blue-600 mr-2" />
          Symbol Animation Studio
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Animation Preview Panel */}
          <div className="lg:col-span-2 bg-gray-900 rounded-lg p-8 text-center flex flex-col items-center justify-center" style={{ minHeight: '400px' }}>
            <div className="bg-gray-800 rounded-lg p-4 mb-4 w-full flex justify-between items-center">
              {(() => {
                // Track animation playback state
                const [playState, setPlayState] = useState<'playing' | 'paused'>('playing');
                
                return (
                  <div className="flex items-center gap-2">
                    {playState === 'playing' ? (
                      <button 
                        className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700 bg-gray-700 text-white"
                        onClick={() => {
                          // Pause the animation
                          const previewElement = document.querySelector('.preview-symbol') as HTMLElement;
                          if (previewElement) {
                            previewElement.getAnimations().forEach(animation => animation.pause());
                            setPlayState('paused');
                          }
                        }}
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700 bg-gray-700 text-white"
                        onClick={() => {
                          // Play the animation
                          const previewElement = document.querySelector('.preview-symbol') as HTMLElement;
                          if (previewElement) {
                            previewElement.getAnimations().forEach(animation => animation.play());
                            setPlayState('playing');
                          }
                        }}
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    
                    <button 
                      className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700"
                      onClick={() => {
                        // Reset the animation
                        const previewElement = document.querySelector('.preview-symbol') as HTMLElement;
                        if (previewElement) {
                          // Cancel all existing animations
                          previewElement.getAnimations().forEach(animation => animation.cancel());
                          
                          // Reset any applied styles
                          previewElement.style.transform = '';
                          previewElement.style.filter = '';
                          
                          // Reapply default animation
                          previewElement.animate([
                            { transform: 'scale(1)', opacity: 1 },
                            { transform: 'scale(1.05)', opacity: 1 },
                            { transform: 'scale(1)', opacity: 1 }
                          ], { 
                            duration: 2000, 
                            iterations: Infinity 
                          });
                          
                          // Reset play state
                          setPlayState('playing');
                        }
                      }}
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    
                    <span className="text-gray-400 text-xs px-2 py-1 bg-gray-700 rounded-full ml-1">
                      {playState === 'playing' ? 'Playing' : 'Paused'}
                    </span>
                  </div>
                );
              })()}
              
              <select 
                className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const previewElement = document.querySelector('.preview-symbol') as HTMLElement;
                  if (previewElement) {
                    // Cancel current animations
                    previewElement.getAnimations().forEach(animation => animation.cancel());
                    
                    // Apply preset animation based on selection
                    const viewMode = e.target.value;
                    if (viewMode === 'win') {
                      // Win animation - more energetic
                      previewElement.animate([
                        { transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)' },
                        { transform: 'scale(1.3) rotate(5deg)', filter: 'brightness(1.5)' },
                        { transform: 'scale(1.2) rotate(-5deg)', filter: 'brightness(1.3)' },
                        { transform: 'scale(1.3) rotate(5deg)', filter: 'brightness(1.5)' },
                        { transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)' }
                      ], { 
                        duration: 1500, 
                        iterations: Infinity 
                      });
                      
                      // Show particles for win animation
                      const particlesContainer = document.querySelector('.particles') as HTMLElement;
                      if (particlesContainer) {
                        particlesContainer.style.display = 'block';
                      }
                    } else if (viewMode === 'idle') {
                      // Idle animation - subtle movement
                      previewElement.animate([
                        { transform: 'translateY(0)' },
                        { transform: 'translateY(-3px)' },
                        { transform: 'translateY(0)' }
                      ], { 
                        duration: 2000, 
                        iterations: Infinity,
                        easing: 'ease-in-out'
                      });
                      
                      // Hide particles for idle animation
                      const particlesContainer = document.querySelector('.particles') as HTMLElement;
                      if (particlesContainer) {
                        particlesContainer.style.display = 'none';
                      }
                    } else if (viewMode === 'intro') {
                      // Intro animation - appears with impact
                      previewElement.animate([
                        { transform: 'scale(0) rotate(180deg)', opacity: 0 },
                        { transform: 'scale(1.2) rotate(0deg)', opacity: 1 },
                        { transform: 'scale(1) rotate(0deg)', opacity: 1 }
                      ], { 
                        duration: 1000, 
                        iterations: 1,
                        fill: 'forwards'
                      });
                      
                      // Brief particles for intro animation
                      const particlesContainer = document.querySelector('.particles') as HTMLElement;
                      if (particlesContainer) {
                        particlesContainer.style.display = 'block';
                        setTimeout(() => {
                          particlesContainer.style.display = 'none';
                        }, 1000);
                      }
                    } else {
                      // Default view - gentle pulse
                      previewElement.animate([
                        { transform: 'scale(1)', opacity: 1 },
                        { transform: 'scale(1.05)', opacity: 1 },
                        { transform: 'scale(1)', opacity: 1 }
                      ], { 
                        duration: 2000, 
                        iterations: Infinity 
                      });
                    }
                  }
                }}
              >
                <option value="default">Default View</option>
                <option value="win">Win Animation</option>
                <option value="idle">Idle State</option>
                <option value="intro">Intro Effect</option>
              </select>
              
              {(() => {
                // Track fullscreen state
                const [isFullscreen, setIsFullscreen] = useState(false);
                
                return (
                  <button 
                    className={`text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700 ${isFullscreen ? 'bg-gray-700 text-white' : ''}`}
                    onClick={() => {
                      // Toggle fullscreen preview
                      const previewContainer = document.querySelector('.preview-container') as HTMLElement;
                      if (previewContainer) {
                        if (isFullscreen) {
                          // Exit fullscreen
                          previewContainer.classList.remove('fullscreen');
                          previewContainer.style.position = '';
                          previewContainer.style.top = '';
                          previewContainer.style.left = '';
                          previewContainer.style.right = '';
                          previewContainer.style.bottom = '';
                          previewContainer.style.zIndex = '';
                          previewContainer.style.backgroundColor = '';
                          setIsFullscreen(false);
                        } else {
                          // Enter fullscreen
                          previewContainer.classList.add('fullscreen');
                          previewContainer.style.position = 'fixed';
                          previewContainer.style.top = '0';
                          previewContainer.style.left = '0';
                          previewContainer.style.right = '0';
                          previewContainer.style.bottom = '0';
                          previewContainer.style.zIndex = '9999';
                          previewContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                          setIsFullscreen(true);
                        }
                      }
                    }}
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                );
              })()}
            </div>
            
            <div className="preview-container relative flex items-center justify-center flex-1 w-full">
              <div className="grid-bg absolute inset-0 opacity-10" style={{ 
                backgroundImage: 'linear-gradient(#ffffff22 1px, transparent 1px), linear-gradient(90deg, #ffffff22 1px, transparent 1px)',
                backgroundSize: '20px 20px' 
              }}></div>
              
              <AnimatePresence>
                <motion.div 
                  key="animation-preview"
                  className="preview-symbol relative z-10"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0],
                    filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)']
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  {symbols[0]?.image ? (
                    <div className="relative">
                      <img 
                        src={symbols[0].image} 
                        alt="Symbol Preview" 
                        className="w-48 h-48 mx-auto object-contain rounded-md"
                        style={{ 
                          background: "transparent",
                          mixBlendMode: "normal",
                          filter: "drop-shadow(0 0 8px rgba(0, 0, 0, 0.2))",
                          // Remove background at the component level
                          WebkitMaskImage: "url(" + symbols[0].image + ")",
                          maskImage: "url(" + symbols[0].image + ")",
                          WebkitMaskSize: "contain",
                          maskSize: "contain",
                          WebkitMaskRepeat: "no-repeat",
                          maskRepeat: "no-repeat",
                          WebkitMaskPosition: "center",
                          maskPosition: "center"
                        }}
                      />
                      <motion.div 
                        className="absolute inset-0 z-10 pointer-events-none"
                        animate={{
                          opacity: [0, 0.3, 0],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                        style={{
                          background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)'
                        }}
                      />
                      
                      {/* Particle effects */}
                      <div className="particles absolute inset-0 z-20">
                        {Array(10).fill(0).map((_, i) => (
                          <motion.div
                            key={`particle-${i}`}
                            className="absolute w-2 h-2 rounded-full bg-yellow-400"
                            style={{ 
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                              y: [0, -20 - Math.random() * 50],
                              x: [0, (Math.random() - 0.5) * 40],
                              opacity: [1, 0],
                              scale: [0, 1, 0]
                            }}
                            transition={{
                              duration: 2 + Math.random(),
                              repeat: Infinity,
                              delay: Math.random() * 2,
                              repeatDelay: Math.random()
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="w-48 h-48 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600"
                    >
                      <ImageIcon className="w-20 h-20 text-white opacity-50" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="mt-6 w-full bg-gray-800 rounded-lg p-4">
              <div className="timeline-editor flex items-center gap-2">
                <div className="text-xs text-gray-400">00:00</div>
                <div className="flex-1 h-8 bg-gray-700 rounded relative">
                  <div className="absolute inset-y-0 left-0 bg-blue-500 w-1/4 rounded-l"></div>
                  <div className="absolute inset-y-0 left-1/4 w-1/4 bg-green-500"></div>
                  <div className="absolute inset-y-0 left-2/4 w-1/4 bg-purple-500"></div>
                  <div className="absolute inset-0 pointer-events-none">
                    {Array(20).fill(0).map((_, i) => (
                      <div 
                        key={`tick-${i}`} 
                        className="absolute h-full w-px bg-gray-600 opacity-50"
                        style={{ left: `${i * 5}%` }}
                      ></div>
                    ))}
                  </div>
                  <div className="absolute inset-y-0 left-[45%] w-0.5 bg-white"></div>
                </div>
                <div className="text-xs text-gray-400">03:00</div>
              </div>
            </div>
          </div>
          
          {/* Animation Controls Panel */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-800">Animation Properties</h4>
              <div className="flex items-center gap-2">
                <select 
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option>Custom Animation</option>
                  <option>Spin & Glow</option>
                  <option>Bounce Effect</option>
                  <option>Pulsing Radiance</option>
                  <option>Winning Celebration</option>
                </select>
                <button className="text-gray-500 hover:text-gray-700 p-1">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="text-gray-500 hover:text-gray-700 p-1">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Animation Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Animation Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {(() => {
                    // Use a local state inside the component
                    const [currentStyle, setCurrentStyle] = useState('pulse');
                    
                    return ['bounce', 'rotate', 'pulse', 'shine', 'float', 'shake', 'glow', 'none'].map(style => (
                      <button 
                        key={style}
                        className={`p-2 text-xs rounded border ${style === currentStyle ? 'bg-blue-600 text-white border-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}
                        onClick={() => {
                          // Update selected style in component state
                          setCurrentStyle(style);
                          
                          // Find the preview animation element and update its animation style
                          const previewElement = document.querySelector('.preview-symbol') as HTMLElement;
                          if (previewElement) {
                            // Cancel any existing animations
                            previewElement.getAnimations().forEach(animation => animation.cancel());
                            
                            // Apply the animation style based on selection
                            if (style === 'bounce') {
                              previewElement.animate([
                                { transform: 'translateY(0)' },
                                { transform: 'translateY(-15px)' },
                                { transform: 'translateY(0)' }
                              ], { 
                                duration: 1000, 
                                iterations: Infinity 
                              });
                            } else if (style === 'rotate') {
                              previewElement.animate([
                                { transform: 'rotate(0deg)' },
                                { transform: 'rotate(360deg)' }
                              ], { 
                                duration: 2000, 
                                iterations: Infinity 
                              });
                            } else if (style === 'pulse') {
                              previewElement.animate([
                                { transform: 'scale(1)', opacity: 1 },
                                { transform: 'scale(1.1)', opacity: 0.8 },
                                { transform: 'scale(1)', opacity: 1 }
                              ], { 
                                duration: 1500, 
                                iterations: Infinity 
                              });
                            } else if (style === 'shine') {
                              // Apply shine effect with CSS
                              previewElement.style.position = 'relative';
                              previewElement.style.overflow = 'hidden';
                              previewElement.animate([
                                { filter: 'brightness(1)' },
                                { filter: 'brightness(1.5)' },
                                { filter: 'brightness(1)' }
                              ], { 
                                duration: 2000, 
                                iterations: Infinity 
                              });
                            } else if (style === 'float') {
                              previewElement.animate([
                                { transform: 'translateY(0) rotate(0deg)' },
                                { transform: 'translateY(-10px) rotate(2deg)' },
                                { transform: 'translateY(0) rotate(-2deg)' },
                                { transform: 'translateY(5px) rotate(1deg)' },
                                { transform: 'translateY(0) rotate(0deg)' }
                              ], { 
                                duration: 3000, 
                                iterations: Infinity 
                              });
                            } else if (style === 'shake') {
                              previewElement.animate([
                                { transform: 'translateX(0)' },
                                { transform: 'translateX(-5px)' },
                                { transform: 'translateX(5px)' },
                                { transform: 'translateX(-5px)' },
                                { transform: 'translateX(5px)' },
                                { transform: 'translateX(0)' }
                              ], { 
                                duration: 500, 
                                iterations: Infinity 
                              });
                            } else if (style === 'glow') {
                              previewElement.animate([
                                { filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))' },
                                { filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))' },
                                { filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))' }
                              ], { 
                                duration: 2000, 
                                iterations: Infinity 
                              });
                            } else if (style === 'none') {
                              // Remove all animations
                              previewElement.getAnimations().forEach(animation => animation.cancel());
                              previewElement.style.transform = 'none';
                              previewElement.style.filter = 'none';
                            }
                          }
                        }}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ));
                  })()}
                </div>
              </div>
              
              {/* Intensity Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Effect Intensity</label>
                  <span className="text-xs text-gray-500" id="intensity-value">6/10</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-gray-400" />
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    defaultValue="6" 
                    className="w-full accent-blue-500"
                    onChange={(e) => {
                      // Update the display value
                      const valueDisplay = document.getElementById('intensity-value');
                      if (valueDisplay) valueDisplay.textContent = `${e.target.value}/10`;
                      
                      // Apply intensity to animation
                      const intensity = parseInt(e.target.value) / 10;
                      const previewElement = document.querySelector('.preview-symbol') as HTMLElement;
                      if (previewElement) {
                        // Adjust animation intensity based on slider
                        previewElement.style.animationDuration = `${3 - (intensity * 2)}s`; // Faster with higher intensity
                        previewElement.style.transform = `scale(${1 + (intensity * 0.2)})`; // Larger with higher intensity
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Animation Speed */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Animation Speed</label>
                  <span className="text-xs text-gray-500" id="speed-value">1.5x</span>
                </div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.1" 
                    defaultValue="1.5" 
                    className="w-full accent-blue-500"
                    onChange={(e) => {
                      // Update the display value
                      const valueDisplay = document.getElementById('speed-value');
                      if (valueDisplay) valueDisplay.textContent = `${e.target.value}x`;
                      
                      // Apply speed to animation
                      const speed = parseFloat(e.target.value);
                      const previewElement = document.querySelector('.preview-symbol') as HTMLElement;
                      if (previewElement) {
                        // Adjust animation playback rate
                        const animations = previewElement.getAnimations();
                        animations.forEach(animation => {
                          animation.playbackRate = speed;
                        });
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Particle Effects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Particle Effects</label>
                <div className="grid grid-cols-3 gap-2">
                  {(() => {
                    // Use a local state inside the component
                    const [currentEffect, setCurrentEffect] = useState('none');
                    
                    return ['sparkle', 'glow', 'smoke', 'coins', 'stars', 'none'].map(effect => (
                      <button 
                        key={effect}
                        className={`p-2 text-xs rounded border ${effect === currentEffect ? 'bg-blue-600 text-white border-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}
                        onClick={() => {
                          // Update selected effect in component state
                          setCurrentEffect(effect);
                          
                          // Toggle particle effects
                          const particlesContainer = document.querySelector('.particles') as HTMLElement;
                          if (particlesContainer) {
                            // Clear existing particles
                            particlesContainer.innerHTML = '';
                            
                            if (effect === 'none') {
                              // Remove all particles
                              particlesContainer.style.display = 'none';
                            } else {
                              // Show particles container
                              particlesContainer.style.display = 'block';
                              
                              // Create particles based on effect type
                              for (let i = 0; i < 15; i++) {
                                const particle = document.createElement('div');
                                
                                // Style based on effect type
                                if (effect === 'sparkle') {
                                  particle.className = 'absolute w-2 h-2 rounded-full bg-yellow-400';
                                } else if (effect === 'glow') {
                                  particle.className = 'absolute w-3 h-3 rounded-full bg-blue-300';
                                } else if (effect === 'smoke') {
                                  particle.className = 'absolute w-4 h-4 rounded-full bg-gray-400 opacity-60';
                                } else if (effect === 'coins') {
                                  particle.className = 'absolute w-2 h-3 rounded-sm bg-yellow-500';
                                } else if (effect === 'stars') {
                                  particle.className = 'absolute w-2 h-2 bg-purple-300';
                                  particle.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                                }
                                
                                // Random position
                                particle.style.left = `${Math.random() * 100}%`;
                                particle.style.top = `${Math.random() * 100}%`;
                                
                                // Add to container
                                particlesContainer.appendChild(particle);
                                
                                // Animate with JavaScript
                                const animation = particle.animate([
                                  { 
                                    transform: 'translate(0, 0) scale(0)', 
                                    opacity: 0 
                                  },
                                  { 
                                    transform: `translate(${(Math.random() - 0.5) * 50}px, ${-20 - Math.random() * 50}px) scale(1)`, 
                                    opacity: 1 
                                  },
                                  { 
                                    transform: `translate(${(Math.random() - 0.5) * 100}px, ${-50 - Math.random() * 100}px) scale(0)`, 
                                    opacity: 0 
                                  }
                                ], {
                                  duration: 2000 + Math.random() * 2000,
                                  iterations: Infinity,
                                  delay: Math.random() * 1000
                                });
                              }
                            }
                          }
                        }}
                      >
                        {effect.charAt(0).toUpperCase() + effect.slice(1)}
                      </button>
                    ));
                  })()}
                </div>
              </div>
              
              {/* Playback Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Playback Options</label>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    // Local state for playback options
                    const [playbackOptions, setPlaybackOptions] = useState({
                      autoPlay: true,
                      loop: true,
                      onWinOnly: false,
                      showParticles: false
                    });
                    
                    // Toggle an option and update animations accordingly
                    const toggleOption = (option: keyof typeof playbackOptions) => {
                      const newOptions = { 
                        ...playbackOptions, 
                        [option]: !playbackOptions[option] 
                      };
                      
                      setPlaybackOptions(newOptions);
                      
                      // Apply changes to the animation
                      const previewElement = document.querySelector('.preview-symbol') as HTMLElement;
                      const particlesContainer = document.querySelector('.particles') as HTMLElement;
                      
                      if (previewElement) {
                        const animations = previewElement.getAnimations();
                        
                        // Handle auto-play option
                        if (option === 'autoPlay') {
                          if (newOptions.autoPlay) {
                            animations.forEach(animation => animation.play());
                          } else {
                            animations.forEach(animation => animation.pause());
                          }
                        }
                        
                        // Handle loop option
                        if (option === 'loop') {
                          animations.forEach(animation => {
                            animation.effect.updateTiming({ 
                              iterations: newOptions.loop ? Infinity : 1 
                            });
                          });
                        }
                      }
                      
                      // Handle show particles option
                      if (option === 'showParticles' && particlesContainer) {
                        particlesContainer.style.display = newOptions.showParticles ? 'block' : 'none';
                      }
                    };
                    
                    return (
                      <>
                        <label className={`flex items-center px-3 py-1.5 rounded ${playbackOptions.autoPlay ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                          <input 
                            type="checkbox" 
                            checked={playbackOptions.autoPlay}
                            className="rounded text-blue-600" 
                            onChange={() => toggleOption('autoPlay')}
                          />
                          <span className={`text-sm ml-2 ${playbackOptions.autoPlay ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                            Auto Play
                          </span>
                        </label>
                        
                        <label className={`flex items-center px-3 py-1.5 rounded ${playbackOptions.loop ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                          <input 
                            type="checkbox" 
                            checked={playbackOptions.loop}
                            className="rounded text-blue-600" 
                            onChange={() => toggleOption('loop')}
                          />
                          <span className={`text-sm ml-2 ${playbackOptions.loop ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                            Loop
                          </span>
                        </label>
                        
                        <label className={`flex items-center px-3 py-1.5 rounded ${playbackOptions.onWinOnly ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                          <input 
                            type="checkbox" 
                            checked={playbackOptions.onWinOnly}
                            className="rounded text-blue-600" 
                            onChange={() => toggleOption('onWinOnly')}
                          />
                          <span className={`text-sm ml-2 ${playbackOptions.onWinOnly ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                            On Win Only
                          </span>
                        </label>
                        
                        <label className={`flex items-center px-3 py-1.5 rounded ${playbackOptions.showParticles ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                          <input 
                            type="checkbox" 
                            checked={playbackOptions.showParticles}
                            className="rounded text-blue-600" 
                            onChange={() => toggleOption('showParticles')}
                          />
                          <span className={`text-sm ml-2 ${playbackOptions.showParticles ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                            Show Particles
                          </span>
                        </label>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {/* Animation Layers */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Animation Layers</label>
                  <button className="text-xs text-blue-600 hover:text-blue-800">+ Add Layer</button>
                </div>
                <div className="space-y-1 max-h-[120px] overflow-y-auto">
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                      <span>Base Animation</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="text-gray-500 hover:text-gray-700 p-1">
                        <EditIcon className="w-3 h-3" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 p-1">
                        <Filter className="w-3 h-3" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 p-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                      <span>Particle Effects</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="text-gray-500 hover:text-gray-700 p-1">
                        <EditIcon className="w-3 h-3" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 p-1">
                        <Filter className="w-3 h-3" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 p-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                      <span>Glow Effect</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="text-gray-500 hover:text-gray-700 p-1">
                        <EditIcon className="w-3 h-3" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 p-1">
                        <Filter className="w-3 h-3" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 p-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" />
                  Generate 3D Version
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Multi-Symbol View */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-800">Multi-Symbol Preview</h4>
            <div className="flex items-center gap-2">
              <button className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg">
                Preview Win Sequence
              </button>
              <button className="text-xs px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg">
                Apply Style to All
              </button>
            </div>
          </div>
          
          <div className="flex overflow-x-auto pb-4 space-x-4">
            {symbols.slice(0, 5).map((symbol, i) => (
              <div key={symbol.id} className="flex-shrink-0">
                <motion.div 
                  className="w-20 h-20 rounded-lg overflow-hidden"
                  animate={{ 
                    y: [0, -5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 2, 
                    delay: i * 0.2,
                    repeat: Infinity,
                    repeatType: "reverse" 
                  }}
                >
                  {symbol.image ? (
                    <div className="relative w-full h-full">
                      <div 
                        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                        style={{
                          backgroundImage: `url(${symbol.image})`,
                          filter: "drop-shadow(0 0 2px rgba(0,0,0,0.2))",
                          // Apply masking to remove the background
                          WebkitMaskImage: `url(${symbol.image})`,
                          maskImage: `url(${symbol.image})`,
                          WebkitMaskSize: "contain",
                          maskSize: "contain",
                          WebkitMaskRepeat: "no-repeat",
                          maskRepeat: "no-repeat",
                          WebkitMaskPosition: "center",
                          maskPosition: "center"
                        }}
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: typeColors[symbol.type] }}
                    >
                      <span className="text-white font-bold">{symbol.name}</span>
                    </div>
                  )}
                </motion.div>
                <div className="text-xs text-center mt-1 text-gray-600">{symbol.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom padding for better spacing */}
      <div className="mt-8"></div>
    </div>
  );
};

export default SymbolGenerator;