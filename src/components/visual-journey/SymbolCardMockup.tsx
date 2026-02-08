import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash, Sparkles, Copy, ImageOff, Loader } from 'lucide-react';
import MockupProgressBar from '../MockupProgressBar';
import { simulateProgress, getMockupAsset, detectThemeCategory } from '../../utils/mockupService';

// Symbol Card Props
interface SymbolCardMockupProps {
  symbol: {
    id: string;
    name: string;
    type: string;
    image: string | null;
    isGenerating: boolean;
    prompt?: string;
    objectDescription?: string;
  };
  onGenerate: (id: string, objectDescription?: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, field: string, value: any) => void;
  theme: string;
  generationProgress: number;
}

// Symbol Card Component with Mockup Functionality
const SymbolCardMockup: React.FC<SymbolCardMockupProps> = ({
  symbol,
  onGenerate,
  onDelete,
  onEdit,
  theme,
  generationProgress
}) => {
  // State for object description and progress
  const [objectDescription, setObjectDescription] = useState(symbol.objectDescription || '');
  const [progress, setProgress] = useState(generationProgress);
  const [isGenerating, setIsGenerating] = useState(symbol.isGenerating);
  
  // Update progress when prop changes
  useEffect(() => {
    setProgress(generationProgress);
    setIsGenerating(symbol.isGenerating);
  }, [generationProgress, symbol.isGenerating]);
  
  // Get placeholder based on theme and symbol type
  const getPlaceholder = (type: string, theme: string) => {
    const themeCategory = detectThemeCategory(theme);
    
    if (themeCategory === 'ancient-egypt') {
      if (type === 'wild') return 'Golden scarab with WILD text';
      if (type === 'scatter') return 'Pyramid or ankh symbol';
      if (type === 'high') return 'Pharaoh mask, Eye of Horus';
      if (type === 'medium') return 'Egyptian cat, Ankh';
      return 'Hieroglyphic symbol';
    } 
    else if (themeCategory === 'western') {
      if (type === 'wild') return 'Sheriff badge with WILD text';
      if (type === 'scatter') return 'Revolver or horseshoe';
      if (type === 'high') return 'Cowboy hat, Gold nugget';
      if (type === 'medium') return 'Whiskey bottle, Horseshoe';
      return 'Playing card or poker chip';
    }
    else if (themeCategory === 'candy-land') {
      if (type === 'wild') return 'Lollipop with WILD text';
      if (type === 'scatter') return 'Gummy bear or candy jar';
      if (type === 'high') return 'Chocolate bar, Cupcake';
      if (type === 'medium') return 'Candy cane, Cotton candy';
      return 'Jelly bean, Donut';
    }
    else if (themeCategory === 'ancient-aztec') {
      if (type === 'wild') return 'Golden mask with WILD text';
      if (type === 'scatter') return 'Aztec temple or calendar';
      if (type === 'high') return 'Jaguar statue, Golden idol';
      if (type === 'medium') return 'Ancient calendar, Temple';
      return 'Tribal pattern, Aztec coin';
    }
    
    // Generic placeholders
    if (type === 'wild') return 'Golden emblem with WILD text';
    if (type === 'scatter') return 'Magical artifact or treasure';
    if (type === 'high') return 'Premium symbol for this theme';
    if (type === 'medium') return 'Medium-value themed object';
    return 'Simple symbol for low value';
  };
  
  // Handle generating the symbol
  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(0);
    
    // Use the mockup service to simulate progress
    simulateProgress(
      3000, // 3 seconds duration
      (progress) => {
        setProgress(progress);
      },
      () => {
        // When complete, call the parent's onGenerate with the object description
        onGenerate(symbol.id, objectDescription);
        setIsGenerating(false);
      }
    );
  };
  
  // Get theme-specific colors for the card
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'wild': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'scatter': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-green-50 border-green-200 text-green-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };
  
  // Get symbol preview image (mockup or actual)
  const getImageUrl = () => {
    if (symbol.image) return symbol.image;
    
    // Get direct path to asset based on symbol type
    let symbolType = symbol.type;
    
    // Map general types to specific file names
    if (symbolType === 'high') symbolType = 'high_1';
    if (symbolType === 'medium') symbolType = 'mid_1';
    if (symbolType === 'low') symbolType = 'low_1';
    
    // Get theme category
    const themeCategory = detectThemeCategory(theme);
    const basePath = window.location.origin;
    
    // Use the specific mockup paths as provided
    if (themeCategory === 'wild-west') {
      return `${basePath}/assets/mockups/western/symbols/${symbolType}.png`;
    } else {
      // Fallback to regular symbol path if not western
      return `${basePath}/assets/symbols/${symbolType}.png`;
    }
  };
  
  return (
    <div className={`symbol-card border rounded-xl overflow-hidden shadow-sm ${symbol.image ? '' : 'border-dashed'}`}>
      {/* Card Header */}
      <div className={`p-4 border-b ${getTypeColor(symbol.type)}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-bold capitalize">{symbol.name}</h3>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded-full bg-white bg-opacity-50 capitalize">
              {symbol.type}
            </span>
            <button 
              onClick={() => onDelete(symbol.id)}
              className="p-1 rounded-full hover:bg-white hover:bg-opacity-20"
              title="Delete symbol"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Symbol Preview */}
      <div className="aspect-square relative bg-gray-100 flex items-center justify-center overflow-hidden">
        {symbol.image || isGenerating ? (
          <>
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-75 z-10">
                <Loader className="w-8 h-8 text-white animate-spin mb-2" />
                <MockupProgressBar
                  progress={progress}
                  width="80%"
                  height="8px"
                  bgColor="rgba(255,255,255,0.2)"
                  fillColor="#3b82f6"
                  showPercentage={false}
                />
                <p className="text-white text-sm mt-2">{progress}% Complete</p>
              </div>
            ) : null}
            
            <motion.img
              src={getImageUrl()}
              alt={symbol.name}
              className="w-full h-full object-contain p-4"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                scale: isGenerating ? [1, 1.05, 1] : 1
              }}
              transition={{ 
                duration: 0.5,
                scale: { duration: 2, repeat: Infinity, repeatType: "reverse" }
              }}
            />
          </>
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <ImageOff className="w-12 h-12 mb-2" />
            <span className="text-sm">No Image Generated</span>
          </div>
        )}
      </div>
      
      {/* Symbol Configuration */}
      <div className="p-4 border-t border-gray-200">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Symbol Object</label>
          <input
            type="text"
            value={objectDescription}
            onChange={(e) => setObjectDescription(e.target.value)}
            placeholder={getPlaceholder(symbol.type, theme)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full py-2 rounded-md flex items-center justify-center gap-2 text-sm
            ${isGenerating 
              ? 'bg-gray-200 text-gray-500 cursor-wait' 
              : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {isGenerating ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Symbol
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SymbolCardMockup;