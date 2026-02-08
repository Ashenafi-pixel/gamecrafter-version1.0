import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ImageIcon,
  Paintbrush,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Trash,
  Loader,
  Settings,
  Save,
  Wand2,
  Upload,
  FolderDown,
  Plus,
  Minus,
  ToggleLeft,
  ToggleRight,
  Zap,
  Crown,
  Star,
  Circle,
  Info,
  Lightbulb,
  Target,
  Trophy,
  Gem,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Download,
  ChevronDown,
  X
} from 'lucide-react';
import FileUploadButton from '../shared/FileUploadButton';
import { enhancedOpenaiClient } from '../../../utils/enhancedOpenaiClient';
import { saveImage } from '../../../utils/imageSaver';
import { useStoredSymbols, saveSymbolsToLocalStorage } from '../../../utils/symbolStorage';

// Symbol Interface with enhanced metadata
interface Symbol {
  id: string;
  name: string;
  type: 'wild' | 'scatter' | 'high' | 'medium' | 'low';
  image: string | null;
  savedImageUrl?: string | null;
  animated: boolean;
  isGenerating: boolean;
  objectDescription?: string; // Primary field for custom descriptions
  customPromptText?: string; // Legacy field for backward compatibility
  importance: number; // 1-5 scale for visual hierarchy
  suggestedFeatures?: string[]; // Features this symbol enables
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  completionStatus: 'empty' | 'generating' | 'complete' | 'error';
  derivedFrom?: string; // ID of the source symbol if this was derived
}

// Smart feature suggestions based on symbol types
interface FeatureSuggestion {
  symbolType: string;
  features: string[];
  description: string;
  icon: React.ComponentType<any>;
}

const SYMBOL_FEATURE_MAP: FeatureSuggestion[] = [
  {
    symbolType: 'scatter',
    features: ['freespins', 'bonus_rounds', 'scatter_pays'],
    description: 'Scatter symbols typically trigger bonus features like free spins',
    icon: Zap
  },
  {
    symbolType: 'wild',
    features: ['multipliers', 'expanding_wilds', 'sticky_wilds'],
    description: 'Wild symbols can substitute and often have special mechanics',
    icon: Crown
  },
  {
    symbolType: 'high',
    features: ['progressive_jackpot', 'high_value_bonuses'],
    description: 'High-value symbols work great with premium features',
    icon: Trophy
  }
];

// Animation configuration
interface AnimationConfig {
  type: 'glow' | 'pulse' | 'sparkle' | 'shine' | 'none';
  intensity: number;
}

// Notification interface
interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

// Enhanced preset configurations with feature suggestions
interface PresetConfig {
  name: string;
  description: string;
  recommendedFor: string;
  estimatedRTP: string;
  suggestedFeatures: string[];
  symbols: Array<{ 
    type: 'wild' | 'scatter' | 'high' | 'medium' | 'low'; 
    count: number;
    importance: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
}

const PRESET_CONFIGURATIONS: PresetConfig[] = [
  {
    name: 'Classic',
    description: 'Traditional 9-symbol setup',
    recommendedFor: 'New slot developers, simple games',
    estimatedRTP: '94-96%',
    suggestedFeatures: ['freespins', 'wild_substitution'],
    symbols: [
      { type: 'wild', count: 1, importance: 5, rarity: 'legendary' },
      { type: 'scatter', count: 1, importance: 5, rarity: 'epic' },
      { type: 'high', count: 3, importance: 4, rarity: 'rare' },
      { type: 'medium', count: 2, importance: 3, rarity: 'common' },
      { type: 'low', count: 2, importance: 2, rarity: 'common' }
    ]
  },
  {
    name: 'Extended',
    description: 'Enhanced 11-symbol variety',
    recommendedFor: 'Intermediate games, more engagement',
    estimatedRTP: '95-97%',
    suggestedFeatures: ['freespins', 'wild_substitution', 'scatter_pays'],
    symbols: [
      { type: 'wild', count: 1, importance: 5, rarity: 'legendary' },
      { type: 'scatter', count: 1, importance: 5, rarity: 'epic' },
      { type: 'high', count: 3, importance: 4, rarity: 'rare' },
      { type: 'medium', count: 2, importance: 3, rarity: 'common' },
      { type: 'low', count: 4, importance: 2, rarity: 'common' }
    ]
  },
  {
    name: 'Premium',
    description: 'High-variance 12-symbol set',
    recommendedFor: 'Advanced games, high engagement',
    estimatedRTP: '96-98%',
    suggestedFeatures: ['freespins', 'expanding_wilds', 'multipliers', 'bonus_rounds'],
    symbols: [
      { type: 'wild', count: 1, importance: 5, rarity: 'legendary' },
      { type: 'scatter', count: 1, importance: 5, rarity: 'epic' },
      { type: 'high', count: 4, importance: 4, rarity: 'rare' },
      { type: 'medium', count: 3, importance: 3, rarity: 'common' },
      { type: 'low', count: 3, importance: 2, rarity: 'common' }
    ]
  },
  {
    name: 'Mega',
    description: 'Maximum 15-symbol complexity',
    recommendedFor: 'Expert developers, AAA quality games',
    estimatedRTP: '96-99%',
    suggestedFeatures: ['freespins', 'expanding_wilds', 'sticky_wilds', 'multipliers', 'progressive_jackpot'],
    symbols: [
      { type: 'wild', count: 2, importance: 5, rarity: 'legendary' },
      { type: 'scatter', count: 1, importance: 5, rarity: 'epic' },
      { type: 'high', count: 4, importance: 4, rarity: 'rare' },
      { type: 'medium', count: 4, importance: 3, rarity: 'common' },
      { type: 'low', count: 4, importance: 2, rarity: 'common' }
    ]
  }
];

/**
 * Get default description for symbol type and theme
 */
const getDefaultDescription = (type: string, theme: string): string => {
  const themeDescriptions: Record<string, Record<string, string>> = {
    'ancient-egypt': {
      wild: 'Golden pharaoh with WILD text',
      scatter: 'Ancient pyramid or Eye of Horus',
      high: 'Egyptian god or goddess',
      medium: 'Egyptian cat or ankh',
      low: 'Egyptian hieroglyph'
    },
    'wild-west': {
      wild: 'Sheriff star with WILD text',
      scatter: 'Saloon doors or horseshoe',
      high: 'Cowboy hat or revolver',
      medium: 'Horse or cactus',
      low: 'Playing card suit'
    },
    'candy-land': {
      wild: 'Golden candy with WILD text',
      scatter: 'Candy castle or rainbow',
      high: 'Gummy bear or lollipop',
      medium: 'Chocolate or caramel',
      low: 'Candy cane or mint'
    },
    default: {
      wild: 'Golden coin with WILD text',
      scatter: 'Treasure chest or gem',
      high: 'Crown or diamond',
      medium: 'Crystal or star',
      low: 'Card symbol'
    }
  };

  const themeKey = theme.toLowerCase().replace(/\s+/g, '-');
  const descriptions = themeDescriptions[themeKey] || themeDescriptions.default;
  return descriptions[type] || descriptions.low;
};

/**
 * Generate standard prompt for symbol
 */
const generateStandardPrompt = (symbol: Symbol, theme: string): string => {
  const description = symbol.objectDescription || getDefaultDescription(symbol.type, theme);
  
  let prompt = `High quality slot machine symbol with COMPLETELY TRANSPARENT BACKGROUND (no background color, fully transparent PNG). ${description}. `;
  
  // Add type-specific requirements
  if (symbol.type === 'wild') {
    prompt += 'Include the word "WILD" clearly visible. ';
  } else if (symbol.type === 'scatter') {
    prompt += 'This is a special bonus symbol. ';
  }
  
  prompt += 'The symbol should be centered with clear edges and MUST have a transparent background (alpha channel). No solid background colors.';
  
  return prompt;
};

/**
 * Custom Description Section - Collapsible
 */
interface CustomDescriptionSectionProps {
  description: string;
  setDescription: (value: string) => void;
  symbol: Symbol;
  theme: string;
}

const CustomDescriptionSection: React.FC<CustomDescriptionSectionProps> = ({
  description,
  setDescription,
  symbol,
  theme
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasCustomDescription = description.trim().length > 0;

  return (
    <div className="mb-4 border border-gray-200 rounded-lg bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Custom Description</span>
          {hasCustomDescription && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              Custom
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-200">
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Override default {theme} theme description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={getDefaultDescription(symbol.type, theme)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-sm"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-2">
              Leave empty to use the default theme-based description
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * AI Symbol Designer Component
 */
interface AISymbolDesignerProps {
  theme: string;
  onApplySymbols: (suggestions: AISymbolSuggestion[]) => void;
  currentSymbols: Symbol[];
  gameId?: string;
}

interface AISymbolSuggestion {
  type: 'wild' | 'scatter' | 'high' | 'medium' | 'low';
  name: string;
  description: string;
  colorHierarchy: string;
  designRationale: string;
}

const AISymbolDesigner: React.FC<AISymbolDesignerProps> = ({ 
  theme, 
  onApplySymbols, 
  currentSymbols, 
  gameId 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AISymbolSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get current grid configuration
  const totalSymbols = currentSymbols.length;
  const symbolCounts = {
    wild: currentSymbols.filter(s => s.type === 'wild').length,
    scatter: currentSymbols.filter(s => s.type === 'scatter').length,
    high: currentSymbols.filter(s => s.type === 'high').length,
    medium: currentSymbols.filter(s => s.type === 'medium').length,
    low: currentSymbols.filter(s => s.type === 'low').length,
  };

  const generateAISymbols = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Build context-aware prompt for GPT-4o - prioritize user request over default theme
      const aiPrompt = `You are an expert slot machine game designer. Generate ${totalSymbols} UNIQUE and DISTINCT symbols for a slot game based on this specific request:

PRIMARY THEME REQUEST: "${prompt}"
CURRENT GRID: ${totalSymbols} total symbols  
SYMBOL DISTRIBUTION: ${symbolCounts.wild} Wild, ${symbolCounts.scatter} Scatter, ${symbolCounts.high} High, ${symbolCounts.medium} Medium, ${symbolCounts.low} Low

CRITICAL REQUIREMENTS:
1. ALL ${totalSymbols} symbols must be COMPLETELY DIFFERENT from each other
2. NO visual similarity between any symbols 
3. NO repeated concepts or duplicate imagery
4. Each symbol must be instantly recognizable as unique

IMPORTANT: Focus primarily on the user's theme request above. If no specific theme is mentioned, fall back to: ${theme}

Provide symbol suggestions that follow professional slot design principles:
1. Visual hierarchy (high value = warm colors, low value = cool colors)
2. Thematic coherence based on the PRIMARY THEME REQUEST
3. Color psychology for value perception  
4. Clear iconography that players understand
5. MAXIMUM VARIETY - each symbol should represent a different concept/object

For each symbol type, suggest:
- Specific visual design (what the symbol should be)
- Color scheme following hierarchy principles
- Brief design rationale

Return as JSON array with this structure:
[
  {
    "type": "wild",
    "name": "Golden Eagle",
    "description": "Majestic golden eagle with spread wings",
    "colorHierarchy": "Deep gold with red accents (highest value - warm, powerful)",
    "designRationale": "Eagles represent power and freedom, perfect for wild symbols"
  }
]

Generate ${totalSymbols} symbols that match the PRIMARY THEME REQUEST with MAXIMUM VARIETY - no two symbols should look similar.`;

      // Actually call GPT-4o for real AI suggestions
      console.log(`[AI Symbol Designer] Calling GPT-4o for: "${prompt}" with theme: ${theme}`);
      
      try {
        // Use the existing client but for text generation
        // We'll make a direct fetch to a text completion endpoint
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || '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'}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are an expert slot machine game designer with deep knowledge of symbolism, color psychology, and player psychology. Generate symbol suggestions as valid JSON only. Always respond with a JSON array, no additional text.'
              },
              {
                role: 'user',
                content: aiPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponseText = data.choices[0]?.message?.content;
        
        console.log('[AI Symbol Designer] GPT-4o Response:', aiResponseText);

        if (!aiResponseText) {
          throw new Error('No response from GPT-4o');
        }

        // Parse JSON response from GPT-4o
        let suggestions: AISymbolSuggestion[];
        try {
          // Clean the response and extract JSON
          const cleanedResponse = aiResponseText.trim();
          const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
          const jsonString = jsonMatch ? jsonMatch[0] : cleanedResponse;
          
          suggestions = JSON.parse(jsonString);
          console.log('[AI Symbol Designer] Parsed suggestions:', suggestions);
          
          // Validate the suggestions have required fields
          if (!Array.isArray(suggestions) || suggestions.length === 0) {
            throw new Error('Invalid suggestions format');
          }
          
          // Validate symbol uniqueness
          const symbolNames = suggestions.map(s => s.name.toLowerCase());
          const uniqueNames = new Set(symbolNames);
          
          if (uniqueNames.size !== symbolNames.length) {
            console.warn('[AI Symbol Designer] Duplicate symbol names detected:', symbolNames);
            // Remove duplicates by keeping first occurrence
            const seenNames = new Set();
            suggestions = suggestions.filter(suggestion => {
              const lowerName = suggestion.name.toLowerCase();
              if (seenNames.has(lowerName)) {
                console.warn(`[AI Symbol Designer] Removing duplicate: ${suggestion.name}`);
                return false;
              }
              seenNames.add(lowerName);
              return true;
            });
          }
          
          // Ensure we have the right number of symbols for the grid
          if (suggestions.length !== totalSymbols) {
            console.warn(`[AI Symbol Designer] Expected ${totalSymbols} symbols, got ${suggestions.length}. Using available suggestions.`);
          }
          
        } catch (parseError) {
          console.error('Failed to parse GPT-4o response:', aiResponseText);
          console.error('Parse error:', parseError);
          throw new Error('Failed to parse AI response');
        }

        setSuggestions(suggestions);
        console.log('[AI Symbol Designer] Successfully set suggestions:', suggestions);
        return; // Success - exit early

      } catch (apiError) {
        console.error('GPT-4o API call failed:', apiError);
        // Fall through to fallback logic
      }

      // Fallback: Create theme-appropriate suggestions if GPT-4o fails
      console.log('[AI Symbol Designer] Using fallback suggestions due to API failure');
      
      let fallbackSuggestions: AISymbolSuggestion[] = [];
      
      if (prompt.toLowerCase().includes('sea') || prompt.toLowerCase().includes('ocean') || prompt.toLowerCase().includes('underwater')) {
        // Generate unique sea-themed symbols based on grid size
        const seaSymbols = [
          { type: 'wild', name: 'Golden Trident', description: 'Majestic Neptune\'s trident crafted from pure gold with pearl inlays', colorHierarchy: 'Bright gold with blue-green accents (highest value - divine weapon)', designRationale: 'Neptune\'s trident commands all seas, perfect for wild symbol power' },
          { type: 'scatter', name: 'Treasure Chest', description: 'Barnacle-encrusted pirate treasure chest overflowing with gold coins', colorHierarchy: 'Rich brown wood with golden highlights (high value - hidden treasures)', designRationale: 'Sunken treasure chests trigger bonus adventures and free spins' },
          { type: 'high', name: 'Sea Dragon', description: 'Majestic sea serpent with shimmering scales and coral crown', colorHierarchy: 'Deep blues and greens with silver scales (medium-high value)', designRationale: 'Legendary sea creatures represent power and mystery of the deep' },
          { type: 'high', name: 'Kraken Tentacle', description: 'Powerful tentacle of the legendary kraken emerging from dark waters', colorHierarchy: 'Deep purple with silver suction cups (high value - fearsome)', designRationale: 'The kraken represents untamed ocean power and mystery' },
          { type: 'high', name: 'Pirate Captain', description: 'Weathered pirate captain with tricorn hat and eyepatch', colorHierarchy: 'Rich reds and golds with weathered leather (high value - adventurous)', designRationale: 'Pirate captains embody the spirit of ocean adventure and treasure hunting' },
          { type: 'medium', name: 'Sailing Ship', description: 'Ancient galleon with billowing sails navigating stormy waters', colorHierarchy: 'Warm browns with white sails and blue seas (medium value)', designRationale: 'Ships represent exploration and adventure on the high seas' },
          { type: 'medium', name: 'Lighthouse', description: 'Tall lighthouse beacon cutting through ocean fog and mist', colorHierarchy: 'White tower with golden beacon light (medium value - guidance)', designRationale: 'Lighthouses guide sailors safely through treacherous waters' },
          { type: 'low', name: 'Seashell', description: 'Elegant conch shell with natural spirals and ocean patterns', colorHierarchy: 'Soft pearl whites and ocean blues (lower value - common treasures)', designRationale: 'Beautiful shells are treasures found along every shore' },
          { type: 'low', name: 'Starfish', description: 'Vibrant orange starfish resting on sandy ocean floor', colorHierarchy: 'Warm orange with sandy beige accents (low value - peaceful)', designRationale: 'Starfish represent the calm beauty of ocean life' }
        ];
        
        // Select symbols based on current symbol distribution
        fallbackSuggestions = [];
        const neededSymbols = { ...symbolCounts };
        
        for (const symbol of seaSymbols) {
          if (neededSymbols[symbol.type] > 0) {
            fallbackSuggestions.push(symbol);
            neededSymbols[symbol.type]--;
          }
          if (fallbackSuggestions.length >= totalSymbols) break;
        }
      } else {
        // Generic fallback for unrecognized themes
        fallbackSuggestions = [
          {
            type: 'wild',
            name: 'Mystery Wild',
            description: `Powerful wild symbol themed around "${prompt}" with premium details`,
            colorHierarchy: 'Deep gold with rich accents (highest value)',
            designRationale: 'Premium wild symbol designed for maximum visual impact'
          }
        ];
      }
      
      setSuggestions(fallbackSuggestions);
    } catch (err) {
      setError('Failed to generate AI suggestions. Please try again.');
      console.error('AI Symbol Generation Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAll = () => {
    onApplySymbols(suggestions);
    setIsExpanded(false);
    setSuggestions([]);
    setPrompt('');
  };

  return (
    <div className="mb-4 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-blue-100/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-blue-900">AI Symbol Designer</h3>
            <p className="text-sm text-blue-600">Generate complete symbol sets with professional design</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-blue-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-blue-200">
          <div className="mt-4">
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Describe your vision:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`e.g., "Create symbols for a ${theme} slot with mystical creatures and ancient artifacts"`}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-blue-600">
                Grid: {totalSymbols} symbols • Theme: {theme}
              </div>
              <button
                onClick={generateAISymbols}
                disabled={!prompt.trim() || isGenerating}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Generate Ideas
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-blue-900">AI Suggestions:</h4>
                <button
                  onClick={handleApplyAll}
                  className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Apply All
                </button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-white border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                        suggestion.type === 'wild' ? 'bg-yellow-500' :
                        suggestion.type === 'scatter' ? 'bg-red-500' :
                        suggestion.type === 'high' ? 'bg-blue-500' :
                        suggestion.type === 'medium' ? 'bg-green-500' : 'bg-gray-500'
                      }`}>
                        {suggestion.type.toUpperCase()}
                      </span>
                      <span className="font-medium text-gray-900">{suggestion.name}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{suggestion.description}</p>
                    <div className="text-xs text-blue-600">
                      <strong>Color:</strong> {suggestion.colorHierarchy}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <strong>Why:</strong> {suggestion.designRationale}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 150x150 Symbol Carousel Item with importance-based styling
 */
interface SymbolCarouselItemProps {
  symbol: Symbol;
  isSelected: boolean;
  onClick: () => void;
  isGenerating?: boolean;
  progress?: number;
}

const SymbolCarouselItem: React.FC<SymbolCarouselItemProps> = ({ 
  symbol, 
  isSelected, 
  onClick, 
  isGenerating = false, 
  progress = 0 
}) => {
  // Get styling based on symbol importance and rarity
  const getFrameStyle = () => {
    if (isSelected) {
      return 'ring-2 ring-red-500 ring-offset-2';
    }
    
    // Importance-based border styling
    switch (symbol.rarity) {
      case 'legendary': // Wild symbols
        return 'border-2 border-yellow-400 shadow-lg shadow-yellow-400/20';
      case 'epic': // Scatter symbols
        return 'border-2 border-red-400 shadow-lg shadow-red-400/20';
      case 'rare': // High-value symbols
        return 'border-2 border-blue-400 shadow-md shadow-blue-400/20';
      default: // Common symbols
        return 'border border-gray-300';
    }
  };
  
  const getRarityIcon = () => {
    switch (symbol.rarity) {
      case 'legendary':
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'epic':
        return <Zap className="w-3 h-3 text-red-500" />;
      case 'rare':
        return <Star className="w-3 h-3 text-blue-500" />;
      default:
        return <Circle className="w-3 h-3 text-gray-400" />;
    }
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex-shrink-0 w-[120px] h-[120px] bg-white rounded-lg cursor-pointer
        transition-all duration-200 hover:shadow-md
        ${getFrameStyle()}
        mx-2 my-2
      `}
    >
      {/* Symbol Image Area */}
      <div className="relative w-full h-[90px] bg-gray-50 rounded-t-lg flex items-center justify-center overflow-hidden">
        {symbol.image ? (
          <img
            src={symbol.image}
            alt={symbol.name}
            className="w-full h-full object-contain p-3"
          />
        ) : isGenerating ? (
          <div className="flex flex-col items-center p-3">
            <Loader className="w-8 h-8 animate-spin text-red-500 mb-2" />
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 bg-red-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <ImageIcon className="w-8 h-8 mb-1" />
            <span className="text-xs">Empty</span>
          </div>
        )}
        
        {/* Completion Badge */}
        {symbol.image && (
          <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <CheckCircle className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        
        {/* Rarity Badge */}
        <div className="absolute top-2 left-2 w-6 h-6 bg-white rounded-full border shadow-sm flex items-center justify-center">
          {getRarityIcon()}
        </div>
      </div>
      
      {/* Symbol Info Bar */}
      <div className="h-[30px] px-2 py-1 bg-white rounded-b-lg border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700 truncate">
            {symbol.name}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded text-white ${
            symbol.type === 'wild' ? 'bg-yellow-500' :
            symbol.type === 'scatter' ? 'bg-red-500' :
            symbol.type === 'high' ? 'bg-blue-500' :
            symbol.type === 'medium' ? 'bg-green-500' : 'bg-gray-500'
          }`}>
            {symbol.type.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Inline Derivation Workflow Component
 */
interface InlineDerivationWorkflowProps {
  sourceSymbol: Symbol;
  allSymbols: Symbol[];
  theme: string;
  onDerive: (targetSymbolId: string, modifications: string, useImageOnly?: boolean) => void;
  onCancel?: () => void;
}

const InlineDerivationWorkflow: React.FC<InlineDerivationWorkflowProps> = ({
  sourceSymbol,
  allSymbols,
  theme,
  onDerive,
  onCancel
}) => {
  const [targetSymbolId, setTargetSymbolId] = useState('');
  const [modificationType, setModificationType] = useState<'preset' | 'custom'>('preset');
  const [colorChange, setColorChange] = useState('');
  const [styleChange, setStyleChange] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [preserveFrame, setPreserveFrame] = useState(true);
  const [preserveShape, setPreserveShape] = useState(true);
  const [useImageOnly, setUseImageOnly] = useState(false);
  const [showAllTargets, setShowAllTargets] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Get available target symbols
  const emptySymbols = allSymbols.filter(s => !s.image && s.id !== sourceSymbol?.id);
  const symbols = allSymbols.filter(s => s.id !== sourceSymbol?.id);

  const handleDerive = () => {
    if (!targetSymbolId) return;

    let modifications = '';
    
    if (modificationType === 'preset') {
      const changes = [];
      if (colorChange) changes.push(`change the color to ${colorChange}`);
      if (styleChange) changes.push(`make it ${styleChange}`);
      
      const preservations = [];
      if (preserveFrame) preservations.push('preserve the frame');
      if (preserveShape) preservations.push('keep the same shape');
      
      modifications = [...changes, ...preservations].join(', ');
    } else {
      modifications = customPrompt;
    }

    onDerive(targetSymbolId, modifications, useImageOnly);
    if (onCancel) onCancel();
  };

  const canProceed = () => {
    if (currentStep === 1) return targetSymbolId;
    if (currentStep === 2) return modificationType === 'custom' ? customPrompt.trim() : (colorChange || styleChange);
    return false;
  };

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50 p-4 mb-4 animate-in slide-in-from-top duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Derive from {sourceSymbol.name}</h3>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="p-1 hover:bg-blue-100 rounded-md transition-colors">
            <X className="w-4 h-4 text-blue-600" />
          </button>
        )}
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step <= currentStep ? 'bg-blue-500 text-white' : 
              step === currentStep + 1 && canProceed() ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-8 h-0.5 mx-1 ${
                step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Target Selection */}
      {currentStep === 1 && (
        <div className="space-y-3">
          <h4 className="font-medium text-blue-900">Step 1: Select Target Symbol</h4>
          
          {/* Toggle between empty and all symbols */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowAllTargets(false)}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                !showAllTargets ? 'bg-blue-500 text-white' : 'bg-white text-blue-600 hover:bg-blue-100'
              }`}
            >
              Empty Slots ({emptySymbols.length})
            </button>
            <button
              onClick={() => setShowAllTargets(true)}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                showAllTargets ? 'bg-blue-500 text-white' : 'bg-white text-blue-600 hover:bg-blue-100'
              }`}
            >
              All Symbols ({symbols.length})
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {(showAllTargets ? symbols : emptySymbols).map((symbol) => (
              <button
                key={symbol.id}
                onClick={() => setTargetSymbolId(symbol.id)}
                className={`p-2 border rounded-lg transition-all text-left ${
                  targetSymbolId === symbol.id
                    ? 'border-blue-500 bg-blue-100'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-medium truncate">{symbol.name}</div>
                <div className="text-xs text-gray-500">{symbol.type.toUpperCase()}</div>
                {symbol.image && <div className="text-xs text-orange-600">Will replace</div>}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!targetSymbolId}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Next: Style Changes
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Modifications */}
      {currentStep === 2 && (
        <div className="space-y-3">
          <h4 className="font-medium text-blue-900">Step 2: Define Changes</h4>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setModificationType('preset')}
              className={`p-3 border rounded-lg text-left ${
                modificationType === 'preset' ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="text-sm font-medium">Quick Changes</div>
              <div className="text-xs text-gray-500">Color & style presets</div>
            </button>
            <button
              onClick={() => setModificationType('custom')}
              className={`p-3 border rounded-lg text-left ${
                modificationType === 'custom' ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="text-sm font-medium">Custom Prompt</div>
              <div className="text-xs text-gray-500">Write specific changes</div>
            </button>
          </div>

          {modificationType === 'preset' && (
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-700">Color Change</label>
                <select
                  value={colorChange}
                  onChange={(e) => setColorChange(e.target.value)}
                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">Keep original color</option>
                  <option value="gold">Make it gold</option>
                  <option value="silver">Make it silver</option>
                  <option value="bronze">Make it bronze</option>
                  <option value="blue">Make it blue</option>
                  <option value="red">Make it red</option>
                  <option value="green">Make it green</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Style Change</label>
                <select
                  value={styleChange}
                  onChange={(e) => setStyleChange(e.target.value)}
                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">Keep original style</option>
                  <option value="more ornate">More ornate</option>
                  <option value="simpler">Simpler</option>
                  <option value="more detailed">More detailed</option>
                  <option value="glowing">Add glow effect</option>
                  <option value="weathered">Make it weathered</option>
                  <option value="crystalline">Make it crystalline</option>
                </select>
              </div>
            </div>
          )}

          {modificationType === 'custom' && (
            <div>
              <label className="text-xs font-medium text-gray-700">Custom modifications</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe how to modify the symbol..."
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={!canProceed()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Next: Advanced
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Advanced Options & Generate */}
      {currentStep === 3 && (
        <div className="space-y-3">
          <h4 className="font-medium text-blue-900">Step 3: Advanced Options</h4>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useImageOnly}
              onChange={(e) => setUseImageOnly(e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Pure visual derivation (ignore text prompts)</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preserveShape}
              onChange={(e) => setPreserveShape(e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Preserve shape</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preserveFrame}
              onChange={(e) => setPreserveFrame(e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Preserve frame</label>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleDerive}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              Generate Variation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Selected Symbol Editor Component
 */
interface SelectedSymbolEditorProps {
  symbol: Symbol;
  isGenerating: boolean;
  progress: number;
  onGenerate: () => void;
  onUpload: (file: File) => void;
  onEdit: () => void;
  onDerive: () => void;
  onDelete: () => void;
  onUpdateSymbol: (updatedSymbol: Symbol) => void;
  theme: string;
  smartSuggestions: string[];
  isMainPreview?: boolean;
  gameId?: string;
  allSymbols?: Symbol[];
  onInlineDerive?: (targetSymbolId: string, modifications: string, useImageOnly?: boolean) => void;
  isDerivationExpanded?: boolean;
  onCancelDerive?: () => void;
}

const SelectedSymbolEditor: React.FC<SelectedSymbolEditorProps> = ({
  symbol,
  isGenerating,
  progress,
  onGenerate,
  onUpload,
  onEdit,
  onDerive,
  onDelete,
  onUpdateSymbol,
  theme,
  smartSuggestions,
  isMainPreview = false,
  gameId,
  allSymbols = [],
  onInlineDerive,
  isDerivationExpanded = false,
  onCancelDerive
}) => {
  const [description, setDescription] = useState(symbol.objectDescription || '');
  
  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    // Immediately update the symbol's objectDescription
    const updatedSymbol = {
      ...symbol,
      objectDescription: newDescription.trim(),
      customPromptText: newDescription.trim() // Keep for backward compatibility
    };
    onUpdateSymbol(updatedSymbol);
  };
  
  return (
    <div className={isMainPreview ? "w-full" : "max-w-2xl mx-auto"}>
      {/* Symbol Preview Card */}
      <div className={`${isMainPreview ? 'bg-transparent border-0 shadow-none' : 'bg-white rounded-xl border border-gray-200 shadow-sm'} mb-4`}>
        <div className={isMainPreview ? "p-0" : "p-4"}>
          <div className={isMainPreview ? "flex flex-col gap-4" : "flex items-start gap-4"}>
            {/* Large Symbol Preview */}
            <div className={isMainPreview ? "w-full" : "flex-shrink-0"}>
              <div className={`${isMainPreview ? 'w-full h-80' : 'w-48 h-48'} bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden`}>
                {symbol.image ? (
                  <img
                    src={symbol.image}
                    alt={symbol.name}
                    className="w-full h-full object-contain p-4"
                  />
                ) : isGenerating ? (
                  <div className="flex flex-col items-center p-4">
                    <Loader className="w-12 h-12 animate-spin text-red-500 mb-4" />
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="h-2 bg-red-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">Generating... {progress}%</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <ImageIcon className="w-16 h-16 mb-2" />
                    <span className="text-sm font-medium">No Image</span>
                    <span className="text-xs">Generate or upload</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Symbol Details */}
            <div className={isMainPreview ? "w-full" : "flex-1"}>
              <div className={`flex items-center gap-3 ${isMainPreview ? 'mb-4' : 'mb-3'}`}>
                <h2 className={`${isMainPreview ? 'text-2xl' : 'text-xl'} font-bold text-gray-900`}>{symbol.name}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                  symbol.type === 'wild' ? 'bg-yellow-500' :
                  symbol.type === 'scatter' ? 'bg-red-500' :
                  symbol.type === 'high' ? 'bg-blue-500' :
                  symbol.type === 'medium' ? 'bg-green-500' : 'bg-gray-500'
                }`}>
                  {symbol.type.toUpperCase()}
                </span>
              </div>
              
              {/* Properties */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">Importance</label>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Star 
                        key={level}
                        className={`w-4 h-4 ${
                          level <= symbol.importance ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Rarity</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                      symbol.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                      symbol.rarity === 'epic' ? 'bg-red-100 text-red-800' :
                      symbol.rarity === 'rare' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {symbol.rarity === 'legendary' && <Crown className="w-3 h-3" />}
                      {symbol.rarity === 'epic' && <Zap className="w-3 h-3" />}
                      {symbol.rarity === 'rare' && <Star className="w-3 h-3" />}
                      {symbol.rarity === 'common' && <Circle className="w-3 h-3" />}
                      {symbol.rarity.charAt(0).toUpperCase() + symbol.rarity.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Suggested Features */}
              {symbol.suggestedFeatures && symbol.suggestedFeatures.length > 0 && (
                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1">
                    <Lightbulb className="w-3 h-3" />
                    Suggested Features for Step 8
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {symbol.suggestedFeatures.map((feature, index) => (
                      <span 
                        key={index}
                        className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium"
                      >
                        {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom Description - Collapsible */}
      <CustomDescriptionSection 
        description={description}
        setDescription={handleDescriptionChange}
        symbol={symbol}
        theme={theme}
      />
      
      {/* Action Buttons - Redesigned */}
      <div className="space-y-3 mb-4">
        {/* Primary Action */}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 h-8"
        >
          {isGenerating ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span className="text-sm">Generate</span>
        </button>
        
        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-2">
          <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors flex items-center justify-center gap-2 h-8">
            <Upload className="w-4 h-4" />
            <span className="text-sm">Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
          </label>
          
          {symbol.image && enhancedOpenaiClient.canDeriveFromSymbol(symbol.id, gameId) && (
            <button
              onClick={onDerive}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 h-8"
              title="Create variations from this symbol"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm">Derive</span>
            </button>
          )}
          
          {symbol.image && !enhancedOpenaiClient.canDeriveFromSymbol(symbol.id, gameId) && (
            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 h-8">
              <Zap className="w-4 h-4" />
              <span className="text-sm">Derive</span>
            </div>
          )}
        </div>
        
        {/* Tertiary Actions */}
        {symbol.image && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
            
            <button
              onClick={onDelete}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Inline Derivation Workflow */}
      {isDerivationExpanded && onInlineDerive && (
        <InlineDerivationWorkflow
          sourceSymbol={symbol}
          allSymbols={allSymbols}
          theme={theme}
          onDerive={onInlineDerive}
          onCancel={onCancelDerive}
        />
      )}

      {/* Smart Suggestions - Compact */}
      {smartSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-lg border border-red-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-medium text-red-900">Smart Suggestions</h4>
          </div>
          <div className="flex flex-wrap gap-1">
            {smartSuggestions.map((suggestion, index) => (
              <span 
                key={index} 
                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium"
              >
                {suggestion}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Derive Symbol Modal Component
 */
interface DeriveSymbolModalProps {
  sourceSymbol: Symbol | null;
  availableSymbols: Symbol[];
  isOpen: boolean;
  onClose: () => void;
  onDerive: (targetSymbolId: string, modifications: string, useImageOnly?: boolean) => void;
  theme: string;
}

const DeriveSymbolModal: React.FC<DeriveSymbolModalProps> = ({ 
  sourceSymbol, 
  availableSymbols, 
  isOpen, 
  onClose, 
  onDerive, 
  theme 
}) => {
  const [targetSymbolId, setTargetSymbolId] = useState('');
  const [modificationType, setModificationType] = useState<'preset' | 'custom'>('preset');
  const [colorChange, setColorChange] = useState('');
  const [styleChange, setStyleChange] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [preserveFrame, setPreserveFrame] = useState(true);
  const [preserveShape, setPreserveShape] = useState(true);
  const [useImageOnly, setUseImageOnly] = useState(false);
  const [showAllTargets, setShowAllTargets] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && sourceSymbol) {
      setTargetSymbolId('');
      setModificationType('preset');
      setColorChange('');
      setStyleChange('');
      setCustomPrompt('');
      setPreserveFrame(true);
      setPreserveShape(true);
      setShowAllTargets(false);
      
      // Auto-suggest image-only mode for uploaded symbols (symbols without descriptions)
      const isUploadedSymbol = !sourceSymbol.objectDescription && !sourceSymbol.customPromptText;
      setUseImageOnly(isUploadedSymbol);
    }
  }, [isOpen, sourceSymbol]);

  // Get available target symbols (empty ones) and all symbols for replacement
  const emptySymbols = availableSymbols.filter(s => !s.image && s.id !== sourceSymbol?.id);
  const symbols = availableSymbols.filter(s => s.id !== sourceSymbol?.id); // Exclude source symbol from targets

  const handleDerive = () => {
    if (!targetSymbolId) return;

    let modifications = '';
    
    if (modificationType === 'preset') {
      const changes = [];
      if (colorChange) changes.push(`change the color to ${colorChange}`);
      if (styleChange) changes.push(`make it ${styleChange}`);
      
      const preservations = [];
      if (preserveFrame) preservations.push('preserve the frame');
      if (preserveShape) preservations.push('keep the same shape');
      
      modifications = [...changes, ...preservations].join(', ');
    } else {
      modifications = customPrompt;
    }

    onDerive(targetSymbolId, modifications, useImageOnly);
    onClose();
  };

  if (!isOpen || !sourceSymbol) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Derive Symbol from {sourceSymbol.name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 rotate-45 text-gray-500" />
            </button>
          </div>

          {/* Source Symbol Preview */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border">
                <img
                  src={sourceSymbol.image!}
                  alt={sourceSymbol.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">Source: {sourceSymbol.name}</h3>
                  {!sourceSymbol.objectDescription && !sourceSymbol.customPromptText ? (
                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium">
                      📤 Uploaded
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                      🤖 Generated
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-600 capitalize">{theme} theme</span>
                {sourceSymbol.objectDescription ? (
                  <div className="text-xs text-blue-600 mt-1 font-medium">
                    Custom: "{sourceSymbol.objectDescription}"
                  </div>
                ) : sourceSymbol.customPromptText ? (
                  <div className="text-xs text-blue-600 mt-1 font-medium">
                    Description: "{sourceSymbol.customPromptText}"
                  </div>
                ) : (
                  <div className="text-xs text-orange-600 mt-1 font-medium">
                    No description available (uploaded image)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Image Only Mode Toggle */}
          <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={useImageOnly}
                onChange={(e) => setUseImageOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    🎯 Pure Visual Derivation
                  </span>
                  {sourceSymbol && !sourceSymbol.objectDescription && !sourceSymbol.customPromptText && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                      Recommended for uploaded symbols
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  When enabled, this will analyze <strong>only the visual elements</strong> in the image without considering any previous descriptions or theme context. Perfect for uploaded symbols where the stored prompt might not be relevant to your intended derivation.
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  <strong>Use this when:</strong> Deriving from uploaded symbols, creating completely different styles, or when the source prompt interferes with your vision.
                </div>
              </div>
            </div>
          </div>

          {/* Target Symbol Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Create as (select target symbol):
            </label>
            
            {/* Toggle between empty symbols and all symbols */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setShowAllTargets(false)}
                className={`px-3 py-1 text-sm rounded-md transition-all ${
                  !showAllTargets 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Empty Slots Only
              </button>
              <button
                onClick={() => setShowAllTargets(true)}
                className={`px-3 py-1 text-sm rounded-md transition-all ${
                  showAllTargets 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                All Symbols (Replace)
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {(showAllTargets ? symbols : emptySymbols).map((symbol) => {
                const isAlreadyGenerated = symbol.image;
                return (
                  <button
                    key={symbol.id}
                    onClick={() => setTargetSymbolId(symbol.id)}
                    className={`p-3 border-2 rounded-lg transition-all relative ${
                      targetSymbolId === symbol.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Show preview image if available */}
                    {isAlreadyGenerated && (
                      <div className="w-8 h-8 mx-auto mb-2 rounded border overflow-hidden">
                        <img 
                          src={symbol.image} 
                          alt={symbol.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="text-sm font-medium text-gray-900">{symbol.name}</div>
                    <div className={`text-xs mt-1 ${
                      symbol.type === 'wild' ? 'text-yellow-600' :
                      symbol.type === 'scatter' ? 'text-red-600' :
                      symbol.type === 'high' ? 'text-blue-600' :
                      symbol.type === 'medium' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {symbol.type.toUpperCase()}
                    </div>
                    
                    {/* Show status indicator */}
                    {isAlreadyGenerated && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">↻</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {!showAllTargets && emptySymbols.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">No empty symbol slots available</p>
                <button
                  onClick={() => setShowAllTargets(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  Show all symbols to replace existing ones
                </button>
              </div>
            )}
            
            {/* Warning when replacing existing symbol */}
            {targetSymbolId && symbols.find(s => s.id === targetSymbolId)?.image && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700">
                  <span>⚠️</span>
                  <span className="text-sm font-medium">Replacing existing symbol</span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  This will overwrite the current {symbols.find(s => s.id === targetSymbolId)?.name} image.
                </p>
              </div>
            )}
          </div>

          {/* Modification Type Toggle */}
          <div className="mb-6">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
              <button
                onClick={() => setModificationType('preset')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  modificationType === 'preset'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Quick Options
              </button>
              <button
                onClick={() => setModificationType('custom')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  modificationType === 'custom'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Custom Prompt
              </button>
            </div>
          </div>

          {/* Modification Options */}
          {modificationType === 'preset' ? (
            <div className="space-y-4 mb-6">
              {/* Color Change */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change Color:
                </label>
                <select
                  value={colorChange}
                  onChange={(e) => setColorChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Keep original color</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="emerald green">Emerald Green</option>
                  <option value="ruby red">Ruby Red</option>
                  <option value="sapphire blue">Sapphire Blue</option>
                </select>
              </div>

              {/* Style Change */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style Adjustment:
                </label>
                <select
                  value={styleChange}
                  onChange={(e) => setStyleChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No style changes</option>
                  <option value="brighter">Brighter</option>
                  <option value="darker">Darker</option>
                  <option value="more ornate">More Ornate</option>
                  <option value="simpler">Simpler</option>
                  <option value="more weathered">More Weathered</option>
                  <option value="shinier">Shinier</option>
                  <option value="with magical glow">Add Magical Glow</option>
                </select>
              </div>

              {/* Preservation Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preserve Elements:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preserveFrame}
                      onChange={(e) => setPreserveFrame(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Preserve the frame</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preserveShape}
                      onChange={(e) => setPreserveShape(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Keep the same shape</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Modification Prompt:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Change the gem color to emerald green while preserving the ornate gold frame"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              
              {/* Quick Phrase Helpers */}
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">💡 Quick phrases:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'preserve the frame',
                    'keep the same design',
                    'maintain the shape',
                    'only change the color',
                    'add magical glow'
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => setCustomPrompt(prev => prev + (prev ? ', ' : '') + phrase)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                    >
                      + "{phrase}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Prompt Preview */}
          {targetSymbolId && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
              <div className="text-xs font-medium text-gray-700 mb-2">🔍 Preview of generation prompt:</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                {(() => {
                  const targetSymbol = availableSymbols.find(s => s.id === targetSymbolId);
                  let modifications = '';
                  
                  if (modificationType === 'preset') {
                    const changes = [];
                    if (colorChange) changes.push(`change the color to ${colorChange}`);
                    if (styleChange) changes.push(`make it ${styleChange}`);
                    
                    const preservations = [];
                    if (preserveFrame) preservations.push('preserve the frame');
                    if (preserveShape) preservations.push('keep the same shape');
                    
                    modifications = [...changes, ...preservations].join(', ');
                  } else {
                    modifications = customPrompt;
                  }
                  
                  if (useImageOnly) {
                    // Image-only mode: analyze the image directly without theme influence
                    return modifications 
                      ? `Create a ${targetSymbol?.type} symbol for a slot game. Base this purely on the visual elements you see in the provided image, but ${modifications}. Maintain the same visual style and composition while applying the requested modifications.`
                      : `Create a ${targetSymbol?.type} symbol for a slot game based purely on the visual elements in the provided image.`;
                  } else {
                    // Standard mode: use description + image
                    const sourceDescription = sourceSymbol.objectDescription || sourceSymbol.customPromptText || `${theme} themed ${sourceSymbol.type} symbol`;
                    return modifications 
                      ? `Create a ${theme} themed ${targetSymbol?.type} symbol for a slot game. Base this on the provided source image of "${sourceDescription}" but ${modifications}. Maintain the same style and composition while applying the requested modifications.`
                      : `Will use the source symbol "${sourceDescription}" as the base for ${targetSymbol?.type} symbol.`;
                  }
                })()}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDerive}
              disabled={!targetSymbolId || (modificationType === 'custom' && !customPrompt.trim())}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Generate Variant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal component for editing symbol descriptions
 */
interface SymbolConfigModalProps {
  symbol: Symbol | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (symbol: Symbol) => void;
}

const SymbolConfigModal: React.FC<SymbolConfigModalProps> = ({ symbol, isOpen, onClose, onSave }) => {
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (symbol) {
      setDescription(symbol.objectDescription || '');
    }
  }, [symbol]);

  const handleSave = () => {
    if (!symbol) return;
    
    const updatedSymbol: Symbol = {
      ...symbol,
      objectDescription: description.trim(),
      customPromptText: description.trim() // Keep for backward compatibility
    };
    
    onSave(updatedSymbol);
    onClose();
  };

  if (!isOpen || !symbol) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg p-6 w-96 max-w-[90vw] shadow-2xl"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Edit {symbol.name}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter custom description for this symbol..."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              style={{ backgroundColor: '#b535f7' }}
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Main Step4 component for symbol generation
 */
const Step4_SymbolGeneration: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const theme = config?.theme?.mainTheme || 'ancient-egypt';
  
  // Debug gameId
  console.log('[Step4] Current config:', {
    gameId: config?.gameId,
    theme: config?.theme?.mainTheme,
    fullConfig: config
  });
  
  // State management
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [generatingSymbols, setGeneratingSymbols] = useState<Record<string, boolean>>({});
  const [symbolProgress, setSymbolProgress] = useState<Record<string, number>>({});
  const [notification, setNotification] = useState<Notification | null>(null);
  const [editingSymbol, setEditingSymbol] = useState<Symbol | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [derivingSymbol, setDerivingSymbol] = useState<Symbol | null>(null);
  const [isDeriveModalOpen, setIsDeriveModalOpen] = useState(false);
  
  // Load symbols from storage
  const { symbols: storedSymbols, isLoading } = useStoredSymbols();

  // Initialize symbols
  useEffect(() => {
    const initializeSymbols = () => {
      // Start with the first preset as default
      const defaultPreset = PRESET_CONFIGURATIONS[0];
      const defaultSymbols: Symbol[] = [];
      let symbolCounter = 1;
      
      defaultPreset.symbols.forEach(({ type, count, importance, rarity }) => {
        for (let i = 0; i < count; i++) {
          // Get suggested features for this symbol type
          const featureSuggestion = SYMBOL_FEATURE_MAP.find(f => f.symbolType === type);
          
          defaultSymbols.push({
            id: `${type}_${i + 1}`,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
            type,
            image: null,
            animated: false,
            isGenerating: false,
            importance,
            rarity,
            suggestedFeatures: featureSuggestion?.features || [],
            completionStatus: 'empty' as const
          });
        }
      });

      // Merge with stored symbols if available
      if (storedSymbols && storedSymbols.length > 0) {
        console.log('[Step4] Merging with stored symbols:', storedSymbols);
        
        // Create a map of stored symbols by ID for easier lookup
        const storedSymbolsMap = new Map(storedSymbols.map(s => [s.id, s]));
        
        const mergedSymbols = defaultSymbols.map(defaultSymbol => {
          const stored = storedSymbolsMap.get(defaultSymbol.id);
          if (stored) {
            // Merge stored data with default, preserving the image
            return { 
              ...defaultSymbol, 
              ...stored, 
              image: stored.image, // Explicitly preserve the image
              isGenerating: false 
            };
          }
          return defaultSymbol;
        });
        
        // Also check if there are any stored symbols that don't match default IDs
        // This can happen when switching between different grid sizes
        const unmatchedStoredSymbols = storedSymbols.filter(
          stored => !defaultSymbols.some(def => def.id === stored.id)
        );
        
        if (unmatchedStoredSymbols.length > 0) {
          console.log('[Step4] Found unmatched stored symbols:', unmatchedStoredSymbols);
          // You might want to handle these differently
        }
        
        setSymbols(mergedSymbols);
      } else {
        setSymbols(defaultSymbols);
      }
    };

    initializeSymbols();
  }, [storedSymbols]);

  // Save symbols to storage whenever they change
  useEffect(() => {
    if (symbols.length > 0) {
      saveSymbolsToLocalStorage(symbols, config?.gameId);
    }
  }, [symbols, config?.gameId]);

  // Update store and dispatch events whenever symbols change
  useEffect(() => {
    if (symbols.length > 0) {
      updateStoreWithSymbols(symbols);
      
      // Smart feature detection for Step 8
      updateSmartFeatureSuggestions(symbols);
      
      const symbolImages = symbols.map(s => s.image).filter(Boolean) as string[];
      if (symbolImages.length > 0) {
        window.dispatchEvent(new CustomEvent('symbolsChanged', { 
          detail: { symbols: symbolImages, source: 'symbolsUpdated' }
        }));
      }
    }
  }, [symbols]);

  /**
   * Update the global store with symbol images for preview components
   */
  const updateStoreWithSymbols = (updatedSymbols: Symbol[]) => {
    try {
      // Extract symbol images for the store
      const symbolImages = updatedSymbols.map(s => s.image).filter(Boolean) as string[];
      
      console.log(`[Store Update] Updating store with ${symbolImages.length} symbol images:`, symbolImages);
      
      // Only update if we have symbols with images, otherwise keep existing
      if (symbolImages.length > 0) {
        // Update the global store's theme.generated.symbols
        updateConfig({
          theme: {
            ...config?.theme,
            generated: {
              ...config?.theme?.generated,
              symbols: symbolImages
            }
          }
        });
        
        console.log(`[Store Update] Store updated successfully with symbols:`, symbolImages);
      } else {
        console.log(`[Store Update] No symbols with images to update - keeping existing symbols in store`);
      }
    } catch (error) {
      console.error('[Store Update] Error updating store with symbols:', error);
    }
  };

  /**
   * Smart feature suggestions for Step 8 based on symbol analysis
   */
  const updateSmartFeatureSuggestions = (symbolList: Symbol[]) => {
    try {
      const suggestions: Record<string, any> = {};
      
      // Analyze completed symbols
      const completedSymbols = symbolList.filter(s => s.image);
      
      // Scatter symbol detection -> Free Spins
      const scatterSymbols = completedSymbols.filter(s => s.type === 'scatter');
      if (scatterSymbols.length > 0) {
        suggestions.freespins_enabled = true;
        suggestions.freespins_trigger_symbol = 'scatter';
        suggestions.freespins_min_symbols = 3;
        suggestions.freespins_count = 10; // Default
        console.log('[Smart Features] Scatter detected - suggesting freespins');
      }
      
      // Wild symbol detection -> Wild Features
      const wildSymbols = completedSymbols.filter(s => s.type === 'wild');
      if (wildSymbols.length > 0) {
        suggestions.wild_substitution = true;
        if (wildSymbols.length > 1) {
          suggestions.expanding_wilds = true;
          console.log('[Smart Features] Multiple wilds detected - suggesting expanding wilds');
        }
      }
      
      // High-value symbol analysis -> Progressive Features
      const highValueSymbols = completedSymbols.filter(s => s.type === 'high');
      if (highValueSymbols.length >= 3) {
        suggestions.progressive_jackpot_available = true;
        suggestions.high_value_bonuses = true;
        console.log('[Smart Features] Rich symbol set detected - suggesting progressive features');
      }
      
      // Symbol count analysis -> RTP suggestions
      const totalCompletedSymbols = completedSymbols.length;
      if (totalCompletedSymbols >= 9) {
        suggestions.optimal_rtp_range = '96-98%';
        suggestions.volatility_recommendation = totalCompletedSymbols > 12 ? 'high' : 'medium';
      }
      
      // Store suggestions in global config for Step 8
      updateConfig({
        smartSuggestions: {
          ...config.smartSuggestions,
          fromSymbols: suggestions,
          lastUpdated: Date.now()
        }
      });
      
      console.log('[Smart Features] Updated suggestions for Step 8:', suggestions);
      
    } catch (error) {
      console.error('[Smart Features] Error updating feature suggestions:', error);
    }
  };

  /**
   * Apply a preset configuration
   */
  const applyPreset = (presetIndex: number) => {
    const preset = PRESET_CONFIGURATIONS[presetIndex];
    const newSymbols: Symbol[] = [];
    
    preset.symbols.forEach(({ type, count, importance, rarity }) => {
      for (let i = 0; i < count; i++) {
        // Get suggested features for this symbol type
        const featureSuggestion = SYMBOL_FEATURE_MAP.find(f => f.symbolType === type);
        
        newSymbols.push({
          id: `${type}_${i + 1}`,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
          type,
          image: null,
          animated: false,
          isGenerating: false,
          importance,
          rarity,
          suggestedFeatures: featureSuggestion?.features || [],
          completionStatus: 'empty' as const
        });
      }
    });
    
    setSymbols(newSymbols);
    setSelectedPreset(presetIndex);
  };

  /**
   * Handle inline derivation from the expandable workflow
   */
  const handleInlineDerive = async (targetSymbolId: string, modifications: string, useImageOnly?: boolean) => {
    console.log('[Inline Derive] Starting derivation:', { targetSymbolId, modifications, useImageOnly });
    
    const sourceSymbol = derivingSymbol;
    if (!sourceSymbol) return;

    try {
      await deriveSymbolFromAnother(sourceSymbol.id, targetSymbolId, modifications, useImageOnly);
      setDerivingSymbol(null); // Close the inline derivation workflow
    } catch (error) {
      console.error('[Inline Derive] Error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to derive symbol. Please try again.',
        isVisible: true
      });
    }
  };

  /**
   * Handle AI generated symbol suggestions
   */
  const handleAIGeneratedSymbols = (suggestions: AISymbolSuggestion[]) => {
    console.log('[AI Symbol Designer] Applying AI suggestions:', suggestions);
    
    // Update existing symbols with AI descriptions
    const updatedSymbols = symbols.map(symbol => {
      const suggestion = suggestions.find(s => s.type === symbol.type);
      if (suggestion) {
        return {
          ...symbol,
          objectDescription: suggestion.description,
          customPromptText: `${suggestion.description}. ${suggestion.colorHierarchy}. ${suggestion.designRationale}`,
          name: suggestion.name
        };
      }
      return symbol;
    });
    
    setSymbols(updatedSymbols);
    
    // Show success notification
    setNotification({
      type: 'success',
      message: `Applied AI suggestions for ${suggestions.length} symbol types!`,
      isVisible: true
    });
  };

  /**
   * Add a new symbol
   */
  const addSymbol = (type: 'wild' | 'scatter' | 'high' | 'medium' | 'low') => {
    const typeSymbols = symbols.filter(s => s.type === type);
    const nextNumber = typeSymbols.length + 1;
    
    // Get suggested features and default properties for this symbol type
    const featureSuggestion = SYMBOL_FEATURE_MAP.find(f => f.symbolType === type);
    const defaultImportance = type === 'wild' || type === 'scatter' ? 5 : type === 'high' ? 4 : type === 'medium' ? 3 : 2;
    const defaultRarity = type === 'wild' ? 'legendary' : type === 'scatter' ? 'epic' : type === 'high' ? 'rare' : 'common';
    
    const newSymbol: Symbol = {
      id: `${type}_${nextNumber}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nextNumber}`,
      type,
      image: null,
      animated: false,
      isGenerating: false,
      importance: defaultImportance,
      rarity: defaultRarity as 'common' | 'rare' | 'epic' | 'legendary',
      suggestedFeatures: featureSuggestion?.features || [],
      completionStatus: 'empty' as const
    };
    
    setSymbols([...symbols, newSymbol]);
  };

  /**
   * Remove a symbol
   */
  const removeSymbol = (symbolId: string) => {
    setSymbols(symbols.filter(s => s.id !== symbolId));
  };

  /**
   * Generate a single symbol using AI
   */
  const generateSymbol = async (symbolId: string) => {
    const symbolIndex = symbols.findIndex(s => s.id === symbolId);
    if (symbolIndex === -1) return;

    const symbol = symbols[symbolIndex];
    
    // Start generation process
    setGeneratingSymbols(prev => ({ ...prev, [symbolId]: true }));
    setSymbolProgress(prev => ({ ...prev, [symbolId]: 0 }));

    try {
      // Generate the prompt - prioritize objectDescription
      const prompt = generateStandardPrompt(symbol, theme);
      const customDesc = symbol.objectDescription || symbol.customPromptText;
      
      console.log(`[Generate Symbol] ${symbolId}: ${customDesc ? `Using custom description: "${customDesc}"` : 'Using default theme description'}`);
      console.log(`[Generate Symbol] Full prompt: ${prompt}`);
      
      // Update progress
      setSymbolProgress(prev => ({ ...prev, [symbolId]: 30 }));

      // Call AI image generation with symbol ID for response tracking
      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt,
        targetSymbolId: symbolId,
        gameId: config?.gameId
      });

      setSymbolProgress(prev => ({ ...prev, [symbolId]: 70 }));

      if (result?.success && result?.images && result.images.length > 0) {
        const imageUrl = result.images[0];
        console.log(`[Symbol Generation] Generated image URL: ${imageUrl}`);
        
        // Always use the original imageUrl first (it works in browser)
        let finalImageUrl = imageUrl;
        let serverSavedPath = null;
        
        try {
          // Try to save to server but don't let it break the flow
          const savedImage = await saveImage(imageUrl, symbol.name, symbol.id, config?.gameId);
          if (savedImage.filePath && !savedImage.error) {
            serverSavedPath = savedImage.filePath;
            console.log(`[Symbol Generation] Saved to server: ${serverSavedPath}`);
          }
        } catch (saveError) {
          console.warn(`[Symbol Generation] Server save failed, using original URL:`, saveError);
        }

        // Update symbol with generated image
        const updatedSymbols = [...symbols];
        updatedSymbols[symbolIndex] = {
          ...symbol,
          image: finalImageUrl, // Always use the working URL
          savedImageUrl: serverSavedPath,
          completionStatus: 'complete' as const
        };
        
        console.log(`[Symbol Generation] Updated symbol ${symbolId} with image: ${finalImageUrl}`);
        setSymbols(updatedSymbols);
        
        // Update the global store with symbol images for preview components
        updateStoreWithSymbols(updatedSymbols);
        
        // Dispatch event for preview components with delay to ensure processing
        const symbolImages = updatedSymbols.map(s => s.image).filter(Boolean) as string[];
        console.log(`[Symbol Generation] Dispatching symbolsChanged event with ${symbolImages.length} images`);
        
        // Immediate dispatch
        window.dispatchEvent(new CustomEvent('symbolsChanged', { 
          detail: { 
            symbols: symbolImages, 
            source: 'generateSymbol',
            symbolId: symbolId,
            forceUpdate: true 
          }
        }));
        
        // Delayed dispatch to ensure all components receive it
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('symbolsChanged', { 
            detail: { 
              symbols: symbolImages, 
              source: 'generateSymbolDelayed',
              symbolId: symbolId,
              forceUpdate: true 
            }
          }));
          console.log(`[Symbol Generation] Dispatched delayed symbolsChanged event`);
        }, 100);
        
        // Show success notification
        setNotification({
          message: `${symbol.name} generated successfully!`,
          type: 'success'
        });
        
        setSymbolProgress(prev => ({ ...prev, [symbolId]: 100 }));
      }
    } catch (error) {
      console.error(`Error generating ${symbolId}:`, error);
      setNotification({
        message: `Failed to generate ${symbol.name}`,
        type: 'error'
      });
    } finally {
      // Clean up generation state
      setGeneratingSymbols(prev => ({ ...prev, [symbolId]: false }));
      setTimeout(() => {
        setSymbolProgress(prev => ({ ...prev, [symbolId]: 0 }));
      }, 2000);
    }
  };

  /**
   * Generate all symbols at once
   */
  const generateAllSymbols = async () => {
    const symbolsToGenerate = symbols.filter(s => !s.image);
    
    for (const symbol of symbolsToGenerate) {
      await generateSymbol(symbol.id);
      // Small delay between generations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  /**
   * Edit a symbol's description
   */
  const editSymbol = (symbol: Symbol) => {
    setEditingSymbol(symbol);
    setIsModalOpen(true);
  };

  /**
   * Save edited symbol
   */
  const saveEditedSymbol = (updatedSymbol: Symbol) => {
    const updatedSymbols = symbols.map(s => 
      s.id === updatedSymbol.id ? updatedSymbol : s
    );
    setSymbols(updatedSymbols);
    
    // Update store and dispatch events
    updateStoreWithSymbols(updatedSymbols);
    const symbolImages = updatedSymbols.map(s => s.image).filter(Boolean) as string[];
    window.dispatchEvent(new CustomEvent('symbolsChanged', { 
      detail: { symbols: symbolImages, source: 'editSymbol' }
    }));
    
    console.log(`Updated ${updatedSymbol.id} with description: "${updatedSymbol.objectDescription}"`);
  };

  /**
   * Delete a symbol's image
   */
  const deleteSymbolImage = (symbolId: string) => {
    const updatedSymbols = symbols.map(s => 
      s.id === symbolId ? { ...s, image: null, savedImageUrl: null } : s
    );
    setSymbols(updatedSymbols);
    
    // Update store and dispatch events
    updateStoreWithSymbols(updatedSymbols);
    const symbolImages = updatedSymbols.map(s => s.image).filter(Boolean) as string[];
    window.dispatchEvent(new CustomEvent('symbolsChanged', { 
      detail: { symbols: symbolImages, source: 'deleteSymbol' }
    }));
  };

  /**
   * Open derive modal for a symbol
   */
  const openDeriveModal = (symbol: Symbol) => {
    setDerivingSymbol(symbol);
    setIsDeriveModalOpen(true);
  };

  /**
   * Derive a new symbol from an existing one using multi-turn image generation
   */
  const deriveSymbol = async (targetSymbolId: string, modifications: string, useImageOnly: boolean = false) => {
    const sourceSymbol = derivingSymbol;
    if (!sourceSymbol?.image) return;

    const targetSymbolIndex = symbols.findIndex(s => s.id === targetSymbolId);
    if (targetSymbolIndex === -1) return;

    const targetSymbol = symbols[targetSymbolIndex];
    
    // Start generation process
    setGeneratingSymbols(prev => ({ ...prev, [targetSymbolId]: true }));
    setSymbolProgress(prev => ({ ...prev, [targetSymbolId]: 0 }));

    try {
      console.log(`[Derive Symbol] Starting derivation from ${sourceSymbol.name} to ${targetSymbol.name}`);
      console.log(`[Derive Symbol] Modifications: ${modifications}`);

      // Progress simulation
      const progressInterval = setInterval(() => {
        setSymbolProgress(prev => ({
          ...prev,
          [targetSymbolId]: Math.min((prev[targetSymbolId] || 0) + Math.random() * 15, 90)
        }));
      }, 500);

      // Build enhanced prompt for derivation
      let basePrompt;
      
      if (useImageOnly) {
        // Image-only mode: completely theme-agnostic, pure visual analysis
        basePrompt = modifications 
          ? `Create a ${targetSymbol.type} symbol for a slot game with COMPLETELY TRANSPARENT BACKGROUND. Base this purely on the visual elements you see in the provided image, but ${modifications}. Maintain the same visual style and composition while applying the requested modifications. IMPORTANT: The background must be fully transparent (alpha channel), no solid background colors. Ensure it's suitable for a ${targetSymbol.type} symbol in a slot machine game.`
          : `Create a ${targetSymbol.type} symbol for a slot game with COMPLETELY TRANSPARENT BACKGROUND based purely on the visual elements in the provided image. IMPORTANT: The background must be fully transparent (alpha channel), no solid background colors. Ensure it's suitable for a ${targetSymbol.type} symbol in a slot machine game.`;
        console.log(`[Derive Symbol] Using image-only mode (no theme, no source description)`);
      } else {
        // Standard mode: use source symbol's description
        const sourceDescription = sourceSymbol.objectDescription || sourceSymbol.customPromptText || getDefaultDescription(sourceSymbol.type, theme);
        basePrompt = `Create a ${theme} themed ${targetSymbol.type} symbol for a slot game with COMPLETELY TRANSPARENT BACKGROUND. Base this on the provided source image of "${sourceDescription}" but ${modifications}. Maintain the same style and composition while applying the requested modifications. IMPORTANT: The background must be fully transparent (alpha channel), no solid background colors. Ensure it's suitable for a ${targetSymbol.type} symbol in a slot machine game.`;
        console.log(`[Derive Symbol] Using source description: "${sourceDescription}"`);
      }
      
      console.log(`[Derive Symbol] Modifications: "${modifications}"`);
      console.log(`[Derive Symbol] Enhanced prompt: ${basePrompt}`);

      // Get source description for better derivation
      const sourceDescription = sourceSymbol.objectDescription || sourceSymbol.customPromptText || getDefaultDescription(sourceSymbol.type, theme);
      
      // Call the AI image generation API with the source image and modifications
      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: basePrompt,
        sourceImage: sourceSymbol.image, // Pass the source image for multi-turn generation
        sourceDescription: sourceDescription, // Pass description for better context
        sourceSymbolId: sourceSymbol.id, // Pass source symbol ID for response ID lookup
        targetSymbolId: targetSymbolId, // Pass target symbol ID for saving response ID
        gameId: config?.gameId, // Pass game ID for persistent storage
        count: 1,
        onProgress: (progress) => {
          setSymbolProgress(prev => ({ ...prev, [targetSymbolId]: progress }));
        }
      });

      clearInterval(progressInterval);

      if (result.success && result.images && result.images.length > 0) {
        const imageUrl = result.images[0];
        
        // Save the derived image
        const savedUrl = await saveImage(imageUrl, `${targetSymbol.name.toLowerCase().replace(/\s+/g, '_')}_derived_from_${sourceSymbol.name.toLowerCase().replace(/\s+/g, '_')}`, targetSymbolId, config?.gameId);
        
        // Update the target symbol
        const updatedSymbols = symbols.map(s => 
          s.id === targetSymbolId 
            ? { ...s, image: imageUrl, savedImageUrl: savedUrl, derivedFrom: sourceSymbol.id }
            : s
        );
        setSymbols(updatedSymbols);
        
        // Update store and dispatch events
        updateStoreWithSymbols(updatedSymbols);
        const symbolImages = updatedSymbols.map(s => s.image).filter(Boolean) as string[];
        window.dispatchEvent(new CustomEvent('symbolsChanged', { 
          detail: { symbols: symbolImages, source: 'deriveSymbol', targetSymbolId }
        }));
        
        setNotification({
          message: `Successfully derived ${targetSymbol.name} from ${sourceSymbol.name}!`,
          type: 'success'
        });

        console.log(`[Derive Symbol] Successfully derived ${targetSymbol.name} from ${sourceSymbol.name}`);
      } else {
        throw new Error(result.error || 'Failed to derive symbol');
      }
    } catch (error) {
      console.error('[Derive Symbol] Error:', error);
      setNotification({
        message: `Failed to derive symbol: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setGeneratingSymbols(prev => ({ ...prev, [targetSymbolId]: false }));
      setSymbolProgress(prev => ({ ...prev, [targetSymbolId]: 0 }));
    }
  };

  /**
   * Handle file upload for a symbol
   */
  const handleSymbolUpload = (symbolId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const updatedSymbols = symbols.map(s => 
        s.id === symbolId ? { ...s, image: imageUrl } : s
      );
      setSymbols(updatedSymbols);
      
      // Update store and dispatch events
      updateStoreWithSymbols(updatedSymbols);
      const symbolImages = updatedSymbols.map(s => s.image).filter(Boolean) as string[];
      window.dispatchEvent(new CustomEvent('symbolsChanged', { 
        detail: { symbols: symbolImages, source: 'uploadSymbol' }
      }));
      
      setNotification({
        message: 'Image uploaded successfully!',
        type: 'success'
      });
    };
    reader.readAsDataURL(file);
  };

  // Clear notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Group symbols by type for display
  const groupedSymbols = symbols.reduce((acc, symbol) => {
    if (!acc[symbol.type]) acc[symbol.type] = [];
    acc[symbol.type].push(symbol);
    return acc;
  }, {} as Record<string, Symbol[]>);

  // Calculate completion stats for progress tracking
  const totalSymbols = symbols.length;
  const completedSymbols = symbols.filter(s => s.image).length;
  const completionPercentage = totalSymbols > 0 ? Math.round((completedSymbols / totalSymbols) * 100) : 0;
  
  // Get feature suggestions based on current symbols
  const getSmartSuggestions = () => {
    const suggestions: string[] = [];
    
    if (symbols.some(s => s.type === 'scatter' && s.image)) {
      suggestions.push('Enable Free Spins in Step 8');
    }
    if (symbols.some(s => s.type === 'wild' && s.image)) {
      suggestions.push('Configure Wild Features in Step 8');
    }
    if (symbols.filter(s => s.type === 'high' && s.image).length >= 3) {
      suggestions.push('Consider Progressive Jackpot in Step 8');
    }
    
    return suggestions;
  };

  const smartSuggestions = getSmartSuggestions();

  // State for carousel navigation
  const [selectedSymbolIndex, setSelectedSymbolIndex] = useState(0);
  const [carouselScrollPosition, setCarouselScrollPosition] = useState(0);
  
  // Keyboard shortcuts for desktop power users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedSymbolIndex(prev => prev === 0 ? symbols.length - 1 : prev - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedSymbolIndex(prev => prev === symbols.length - 1 ? 0 : prev + 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (symbols[selectedSymbolIndex] && !generatingSymbols[symbols[selectedSymbolIndex].id]) {
            generateSymbol(symbols[selectedSymbolIndex].id);
          }
          break;
        case 'e':
          e.preventDefault();
          if (symbols[selectedSymbolIndex]) {
            editSymbol(symbols[selectedSymbolIndex]);
          }
          break;
        case 'Delete':
          e.preventDefault();
          if (symbols[selectedSymbolIndex]?.image) {
            deleteSymbolImage(symbols[selectedSymbolIndex].id);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSymbolIndex, symbols, generatingSymbols]);
  
  // Auto-scroll carousel to keep selected symbol visible with infinite loop
  useEffect(() => {
    const symbolWidth = 120 + 16; // 120px width + 16px gap
    const containerWidth = 600; // Approximate visible area
    
    // Position the selected symbol from the middle set (repeatIndex = 1)
    const middleSetOffset = symbols.length * symbolWidth;
    const targetPosition = middleSetOffset + (selectedSymbolIndex * symbolWidth);
    const centerOffset = containerWidth / 2 - symbolWidth / 2;
    const newScrollPosition = targetPosition - centerOffset;
    
    setCarouselScrollPosition(newScrollPosition);
  }, [selectedSymbolIndex, symbols.length]);

  return (
    <div className="h-full bg-white text-gray-900 flex flex-col">
      {/* Symbol Studio Header Banner */}
      <div className="flex-shrink-0 bg-gradient-to-r from-red-600 to-red-700 p-4 text-white rounded-lg mx-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6" />
            <div>
              <h1 className="text-lg font-bold">Symbol Studio</h1>
              <p className="text-red-200 text-sm capitalize">{theme} Theme</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{completedSymbols}/{totalSymbols}</div>
            <div className="mt-1 w-24 bg-red-500 rounded-full h-1.5">
              <div 
                className="bg-white rounded-full h-1.5 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Guided/Advanced Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1.5">
              <span className={`text-sm font-medium ${!isAdvancedMode ? 'text-red-600' : 'text-gray-600'}`}>
                Guided
              </span>
              <button
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                className="relative w-10 h-5 rounded-full transition-colors duration-300"
                style={{ backgroundColor: isAdvancedMode ? '#DC2626' : '#e5e7eb' }}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                    isAdvancedMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isAdvancedMode ? 'text-red-600' : 'text-gray-600'}`}>
                Advanced
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={generateAllSymbols}
              className="bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-md text-sm font-medium text-white transition-colors flex items-center gap-1"
              style={{ backgroundColor: '#34cd01' }}
            >
              <Wand2 className="w-4 h-4" />
              Generate All
            </button>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Shortcuts:</span>
              <span className="bg-gray-100 px-1.5 py-0.5 rounded">←→</span>
              <span className="bg-gray-100 px-1.5 py-0.5 rounded">Enter</span>
              <span className="bg-gray-100 px-1.5 py-0.5 rounded">E</span>
            </div>
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Big Symbol Preview Panel */}
        <div className="w-2/5 border-r border-gray-200 bg-white p-4 overflow-y-auto">
          {/* AI Symbol Designer */}
          <AISymbolDesigner 
            theme={theme}
            onApplySymbols={handleAIGeneratedSymbols}
            currentSymbols={symbols}
            gameId={config?.gameId}
          />
          
          {symbols[selectedSymbolIndex] && (
            <SelectedSymbolEditor
              symbol={symbols[selectedSymbolIndex]}
              isGenerating={generatingSymbols[symbols[selectedSymbolIndex].id]}
              progress={symbolProgress[symbols[selectedSymbolIndex].id]}
              onGenerate={() => generateSymbol(symbols[selectedSymbolIndex].id)}
              onUpload={(file) => handleSymbolUpload(symbols[selectedSymbolIndex].id, file)}
              onEdit={() => editSymbol(symbols[selectedSymbolIndex])}
              onDerive={() => setDerivingSymbol(symbols[selectedSymbolIndex])}
              onDelete={() => deleteSymbolImage(symbols[selectedSymbolIndex].id)}
              onUpdateSymbol={(updatedSymbol) => {
                const newSymbols = symbols.map(s => s.id === updatedSymbol.id ? updatedSymbol : s);
                setSymbols(newSymbols);
              }}
              theme={theme}
              smartSuggestions={smartSuggestions}
              isMainPreview={true}
              gameId={config?.gameId}
              allSymbols={symbols}
              onInlineDerive={handleInlineDerive}
              isDerivationExpanded={derivingSymbol?.id === symbols[selectedSymbolIndex].id}
              onCancelDerive={() => setDerivingSymbol(null)}
            />
          )}
        </div>

        {/* Right Side: Symbol Grid Selection */}
        <div className="w-3/5 bg-gray-50 p- overflow-y-auto">
          {/* Horizontal Symbol Carousel */}
          <div className="mb-6">
            <div className="flex items-center gap-3 min-h-[200px]">
              {/* Carousel Navigation */}
              <button
                onClick={() => {
                  // Infinite loop: go to last symbol when at beginning
                  const newIndex = selectedSymbolIndex === 0 ? symbols.length - 1 : selectedSymbolIndex - 1;
                  setSelectedSymbolIndex(newIndex);
                }}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Symbol Carousel */}
              <div className="flex-1 overflow-hidden">
                <div 
                  className="flex gap-2 transition-transform duration-500 ease-out" 
                  style={{ 
                    transform: `translateX(-${carouselScrollPosition}px)`,
                    width: `${(symbols.length * 3) * (120 + 16)}px` // Triple width for infinite scroll effect (120px + 16px margin)
                  }}
                >
                  {/* Render symbols three times for infinite scroll illusion */}
                  {[...Array(3)].map((_, repeatIndex) => 
                    symbols.map((symbol, index) => {
                      const actualIndex = index;
                      const displayIndex = repeatIndex * symbols.length + index;
                      return (
                        <SymbolCarouselItem
                          key={`${symbol.id}-${repeatIndex}`}
                          symbol={symbol}
                          isSelected={actualIndex === selectedSymbolIndex && repeatIndex === 1}
                          onClick={() => setSelectedSymbolIndex(actualIndex)}
                          isGenerating={generatingSymbols[symbol.id]}
                          progress={symbolProgress[symbol.id]}
                        />
                      );
                    })
                  )}
                </div>
              </div>
              
              <button
                onClick={() => {
                  // Infinite loop: go to first symbol when at end
                  const newIndex = selectedSymbolIndex === symbols.length - 1 ? 0 : selectedSymbolIndex + 1;
                  setSelectedSymbolIndex(newIndex);
                }}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Symbol Grid Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Symbol Overview</h3>
            <div className="grid grid-cols-3 gap-3">
              {symbols.map((symbol, index) => (
                <button
                  key={symbol.id}
                  onClick={() => setSelectedSymbolIndex(index)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    index === selectedSymbolIndex 
                      ? 'border-red-500 bg-red-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                    {symbol.image ? (
                      <img
                        src={symbol.image}
                        alt={symbol.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-medium text-gray-900">{symbol.name}</div>
                  <div className={`text-xs mt-1 ${
                    symbol.type === 'wild' ? 'text-yellow-600' :
                    symbol.type === 'scatter' ? 'text-red-600' :
                    symbol.type === 'high' ? 'text-blue-600' :
                    symbol.type === 'medium' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {symbol.type.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 text-white max-w-sm"
            style={{
              backgroundColor: notification.type === 'success' ? '#34cd01' :
                              notification.type === 'error' ? '#ef4444' : '#DC2626'
            }}
          >
            <div className="flex items-center gap-3">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {notification.type === 'info' && <Info className="w-5 h-5" />}
              <span className="font-medium">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Derive Modal */}
      <DeriveSymbolModal
        sourceSymbol={derivingSymbol}
        availableSymbols={symbols}
        isOpen={isDeriveModalOpen}
        onClose={() => setIsDeriveModalOpen(false)}
        onDerive={deriveSymbol}
        theme={theme}
      />

      {/* Edit Modal */}
      <SymbolConfigModal
        symbol={editingSymbol}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={saveEditedSymbol}
      />
    </div>
  );
};

export default Step4_SymbolGeneration;