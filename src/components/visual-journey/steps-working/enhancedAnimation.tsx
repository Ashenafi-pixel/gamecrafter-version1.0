import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAnimationLab } from '../../animation-lab/AnimationLabModeProvider';
import { simpleAnimationEngine, type SpriteAnimation } from '../../../utils/simpleAnimationEngine';
// import { textIndividualizationEngine } from '../../utils/textIndividualization';
import { professionalSpriteAtlas, type SpriteElement } from '../../../utils/professionalSpriteAtlas';
import { detectSpritesUniversal } from '../../../utils/universalSpriteDetector';
import { enhancedOpenaiClient } from '../../../utils/enhancedOpenaiClient';
// import { analyzeSpritesWithVision, applyVisionBasedPositioning } from '../../utils/gptVisionSpriteDetector';
import { saveSymbolsToLocalStorage, getSymbolsFromLocalStorage, type StoredSymbol } from '../../../utils/symbolStorage';
import { saveImage } from '../../../utils/imageSaver';
import { useGameStore } from '../../../store';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { LAYOUT_TEMPLATES, ANIMATION_TEMPLATES } from '../../enhanced-animation-lab/Layout-Animation-Template';
import { WorkspacePanel } from '../../enhanced-animation-lab/WorkSpace-pannel';
import { PresetConfig, SymbolConfig } from '../../../types/EnhancedAnimationLabStep4';
import SymbolCarouselItem from '../../enhanced-animation-lab/Symbol-caraousel-Item';
import { PreviewPanel } from '../../enhanced-animation-lab/PreviewPannel';
import { TimelineControls } from '../../enhanced-animation-lab/Timeline-control';
import { LayerPanel } from '../../enhanced-animation-lab/LayerPannel';
import { Button } from '../../Button';
import { Loader, Sparkles } from 'lucide-react';

// Error Boundary Component for Canvas Operations
export class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Canvas Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center' as const,
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Canvas Error</div>
          <div style={{ fontSize: '14px' }}>Please refresh the page to reset the workspace</div>
        </div>
      );
    }

    return this.props.children;
  }
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
    'fantasy-kingdom': {
      wild: 'Royal crown with WILD text',
      scatter: 'Magic castle or portal',
      high: 'Dragon or wizard',
      medium: 'Knight or princess',
      low: 'Sword or shield'
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

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  children
}) => {
  // Get icon for each section
  const getIcon = (title: string) => {
    if (title.includes('Symbol Type')) return '🎨';
    if (title.includes('Content Type')) return '📝';
    if (title.includes('Symbol Size')) return '📏';
    if (title.includes('Symbol Prompt')) return '✨';
    if (title.includes('Animation Complexity')) return '⚡';
    if (title.includes('Layout Templates')) return '🎯';
    if (title.includes('Animation Templates')) return '🎬';
    if (title.includes('Letter Animations')) return '🌊';
    return '⚙️';
  };

  // Determine if this is a primary section
  const isPrimary = title.includes('Symbol Prompt');

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
      borderRadius: '12px',
      marginBottom: '12px',
      overflow: 'hidden',
      boxShadow: isExpanded
        ? '0 4px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(230, 0, 18, 0.1)'
        : '0 2px 6px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      transform: isExpanded ? 'translateY(-1px)' : 'translateY(0px)',
      border: isPrimary ? '2px solid #e60012' : '1px solid #e5e7eb'
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: isPrimary ? '16px 18px' : '14px 16px',
          background: isExpanded
            ? 'linear-gradient(135deg, #e60012 0%, #dc2626 100%)'
            : isPrimary
              ? 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)'
              : 'transparent',
          color: isExpanded ? 'white' : isPrimary ? '#e60012' : '#374151',
          border: 'none',
          fontSize: isPrimary ? '14px' : '13px',
          fontWeight: isPrimary ? '700' : '600',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = isPrimary
              ? 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = isPrimary
              ? 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)'
              : 'transparent';
          }
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{
            fontSize: '16px',
            filter: isExpanded ? 'brightness(1.2)' : 'none',
            transition: 'filter 0.2s ease'
          }}>
            {getIcon(title)}
          </span>
          <span>{title}</span>
        </div>
        <span style={{
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          fontSize: '12px',
          opacity: isExpanded ? 1 : 0.6
        }}>
          ▼
        </span>
      </button>
      {isExpanded && (
        <div
          style={{
            padding: '18px 18px 20px 18px',
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            borderTop: '1px solid rgba(229, 231, 235, 0.5)',
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// Simplified outline using CSS-style drop shadow effect
const createSimpleOutline = (
  ctx: CanvasRenderingContext2D,
  sprite: { x: number, y: number, width: number, height: number, src: string },
  imageCache: React.MutableRefObject<Map<string, HTMLImageElement>>,
  outlineWidth: number = 6
): boolean => {
  try {
    console.log('🎨 Creating outline for sprite:', sprite.id, 'from cache');

    // Get the sprite image from cache
    const img = imageCache.current.get(sprite.src);
    if (!img) {
      console.warn('⚠️ Image not found in cache for:', sprite.src);
      return false;
    }

    console.log('✅ Found image in cache, creating outline');

    // Save current context state
    ctx.save();

    // Draw outline using multiple shadow passes (simple but effective)
    const outlineColor = '#e60012';

    // Create outline by drawing the image multiple times with offset
    const offsets = [
      [-outlineWidth, -outlineWidth], [0, -outlineWidth], [outlineWidth, -outlineWidth],
      [-outlineWidth, 0], [outlineWidth, 0],
      [-outlineWidth, outlineWidth], [0, outlineWidth], [outlineWidth, outlineWidth]
    ];

    // Set outline style
    ctx.globalCompositeOperation = 'destination-over';
    ctx.filter = `drop-shadow(0px 0px 3px ${outlineColor})`;

    // Draw outline passes
    offsets.forEach(([dx, dy]) => {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.drawImage(
        img,
        sprite.x + dx,
        sprite.y + dy,
        sprite.width,
        sprite.height
      );
      ctx.restore();
    });

    // Reset composite operation and filter
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.restore();

    console.log('✅ Outline created successfully');
    return true;

  } catch (error) {
    console.error('❌ Failed to create outline:', error);
    return false;
  }
};

interface EnhancedAnimationLabProps {
  layoutMode?: 'full' | 'creation' | 'animation';
}

const EnhancedAnimationLab: React.FC<EnhancedAnimationLabProps> = ({ layoutMode = 'full' }) => {
  const { atlasResult, setAtlasResult, isProcessing, setIsProcessing } = useAnimationLab();

  // Game Store Integration
  const { config, updateConfig } = useGameStore();
  const gameId = config?.gameId || config?.displayName || 'default';

  // UI State
  const [expandedSections, setExpandedSections] = useState({
    symbolType: true,
    contentType: false,
    size: false,
    prompt: true,
    animation: false,
    layoutTemplates: false,
    animationTemplates: false,
    letterAnimations: false
  });

  // Symbol Management
  const [symbols, setSymbols] = useState<SymbolConfig[]>([]);
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
  const [nextSymbolId, setNextSymbolId] = useState(1);

  // Current Configuration
  const [symbolType, setSymbolType] = useState<'block' | 'contour'>('block');
  const [contentType, setContentType] = useState<'symbol-only' | 'symbol-wild' | 'symbol-scatter' | 'symbol-bonus' | 'symbol-free' | 'symbol-jackpot' | 'text-only'>('symbol-only');
  const [size, setSize] = useState<'1x1' | '1x3' | '2x2' | '3x3' | '4x4'>('1x1');
  const [prompt, setPrompt] = useState('');
  const [animationComplexity, setAnimationComplexity] = useState<'simple' | 'medium' | 'complex'>('simple');

  // Workspace State (moved up from WorkspacePanel)
  const [sprites, setSprites] = useState<Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    src: string;
    type: 'letter' | 'element' | 'symbol';
    identifiedLetter?: string;
  }>>([]);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  // Layer Management State
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({});
  const [layerLocks, setLayerLocks] = useState<Record<string, boolean>>({});

  // Animation State
  const [isPlaying, setIsPlaying] = useState(false);

  // Preset System State
  const [selectedPreset, setSelectedPreset] = useState<string | null>('Classic');
  const [currentSymbolIndex, setCurrentSymbolIndex] = useState(0);
  const [presetSymbols, setPresetSymbols] = useState<SymbolConfig[]>([]);
  const [showPresetSelection, setShowPresetSelection] = useState(false);

  // Initialize with Classic preset by default - moved after function definition
  const [animationFrame, setAnimationFrame] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const animationRef = useRef<number | null>(null);

  // 🔒 MUTEX SYSTEM: Bulletproof race condition prevention
  const processingMutex = useRef({
    locked: false,
    currentOperation: null as string | null,
    lock(operation: string): boolean {
      if (this.locked) {
        console.log(`🔒 BLOCKED: ${operation} - ${this.currentOperation} already in progress`);
        return false;
      }
      this.locked = true;
      this.currentOperation = operation;
      console.log(`🔓 LOCKED: ${operation} started`);
      return true;
    },
    unlock(): void {
      console.log(`🔓 UNLOCKED: ${this.currentOperation} completed`);
      this.locked = false;
      this.currentOperation = null;
    }
  });

  // Template State
  const [selectedLayoutTemplate, setSelectedLayoutTemplate] = useState<'text-top' | 'text-bottom' | 'text-overlay'>('text-bottom');
  const [selectedAnimationTemplate, setSelectedAnimationTemplate] = useState<'bounce' | 'pulse' | 'glow' | 'rotate' | 'shake' | 'sparkle' | 'flash' | 'wave'>('bounce');

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);

  // Preset System Functions
  const generateSymbolsFromPreset = useCallback((preset: PresetConfig, theme: string) => {
    const newSymbols: SymbolConfig[] = [];
    let symbolCounter = 1;

    preset.symbols.forEach(symbolDef => {
      for (let i = 0; i < symbolDef.count; i++) {
        const symbolName = symbolDef.count > 1 ?
          `${symbolDef.type.charAt(0).toUpperCase() + symbolDef.type.slice(1)} ${i + 1}` :
          symbolDef.type.charAt(0).toUpperCase() + symbolDef.type.slice(1);

        const defaultDesc = getDefaultDescription(symbolDef.type, theme);

        const newSymbol: SymbolConfig = {
          id: `preset_${Date.now()}_${symbolCounter++}`,
          name: symbolName,
          symbolType: 'block',
          contentType: symbolDef.type === 'wild' ? 'symbol-wild' :
            symbolDef.type === 'scatter' ? 'symbol-scatter' : 'symbol-only',
          size: '1x1',
          prompt: `High quality slot machine symbol: ${defaultDesc}. Clean, professional design with transparent background.`,
          animationComplexity: symbolDef.importance >= 4 ? 'complex' :
            symbolDef.importance >= 3 ? 'medium' : 'simple',
          gameSymbolType: symbolDef.type,
          importance: symbolDef.importance,
          rarity: symbolDef.rarity,
          defaultDescription: defaultDesc
        };

        newSymbols.push(newSymbol);
      }
    });

    return newSymbols;
  }, []);

  // Enhanced function to sync symbols with GameStore - maintains exact positions
  const syncSymbolsWithGameStore = useCallback((symbolsToSync: SymbolConfig[]) => {
    console.log('🔄 Syncing symbols with GameStore:', symbolsToSync.length);

    // Create array that matches the exact positions of symbolsToSync
    const symbolUrls: string[] = symbolsToSync.map(symbol => {
      return symbol.imageUrl || ''; // Keep empty string for empty slots
    });

    // Filter out empty strings for GameStore (only store actual generated symbols)
    const generatedSymbolUrls = symbolUrls.filter(url => url !== '');

    if (generatedSymbolUrls.length > 0) {
      updateConfig({
        theme: {
          ...config?.theme,
          generated: {
            ...config?.theme?.generated,
            symbols: generatedSymbolUrls
          }
        }
      });

      console.log('🔄 Synced symbols with GameStore:', generatedSymbolUrls.length, 'generated symbols');
    }
  }, [config, updateConfig]);

  const handlePresetSelection = useCallback((presetName: string) => {
    console.log('🎯 handlePresetSelection called:', presetName);
    console.log('🎯 Current state:', {
      symbolsLength: symbols.length,
      presetSymbolsLength: presetSymbols.length,
      gameStoreSymbols: config?.theme?.generated?.symbols?.length || 0
    });

    const preset = PRESET_CONFIGURATIONS.find(p => p.name === presetName);
    if (!preset) return;

    const theme = config?.gameTheme || 'default';

    // Load existing symbols from GameStore first
    const existingGameStoreSymbols = config?.theme?.generated?.symbols || [];
    let existingSymbols: SymbolConfig[] = [];

    // Get existing symbols from multiple sources
    if (symbols.length > 0 && symbols.some(s => s.imageUrl)) {
      console.log('🎯 Using already loaded symbols from state:', symbols.length);
      existingSymbols = symbols.filter(s => s.imageUrl);
    } else if (existingGameStoreSymbols.length > 0) {
      console.log('🎯 Loading symbols from GameStore:', existingGameStoreSymbols.length);

      // Generate preset symbols first to get the correct names and types
      const presetSymbolsForMapping = generateSymbolsFromPreset(preset, theme);

      existingSymbols = existingGameStoreSymbols.map((symbolUrl: string, index: number) => {
        // Get the corresponding preset symbol to preserve name and type
        const presetSymbol = presetSymbolsForMapping[index];

        return {
          id: `gamestore_symbol_${index + 1}`,
          name: presetSymbol ? presetSymbol.name : `Symbol ${index + 1}`,
          symbolType: 'block' as const,
          contentType: presetSymbol ? presetSymbol.contentType : (
            index === 0 ? 'symbol-wild' as const :
            index === 1 ? 'symbol-scatter' as const : 'symbol-only' as const
          ),
          gameSymbolType: presetSymbol ? presetSymbol.gameSymbolType : undefined,
          importance: presetSymbol ? presetSymbol.importance : undefined,
          rarity: presetSymbol ? presetSymbol.rarity : undefined,
          size: '1x1' as const,
          prompt: presetSymbol ? presetSymbol.prompt : '',
          animationComplexity: 'simple' as const,
          imageUrl: symbolUrl,
          retryCount: 0
        };
      });
    }

    console.log('🎯 Found existing symbols:', existingSymbols.length);

    // Generate preset symbols (these will be empty slots initially)
    const generatedSymbols = generateSymbolsFromPreset(preset, theme);
    console.log('🎯 Generated preset symbols:', generatedSymbols.length);

    // Merge existing symbols with preset structure
    const mergedSymbols = generatedSymbols.map((presetSymbol, index) => {
      // Try to find an existing symbol that matches this slot type
      const matchingExisting = existingSymbols.find(existing => {
        if (index === 0) return existing.contentType === 'symbol-wild';
        if (index === 1) return existing.contentType === 'symbol-scatter';
        return existing.contentType === 'symbol-only';
      });

      if (matchingExisting && matchingExisting.imageUrl) {
        console.log(`🎯 Slot ${index}: Using existing symbol ${matchingExisting.name}`);
        // Keep existing symbol but update metadata from preset
        return {
          ...matchingExisting,
          name: presetSymbol.name,
          contentType: presetSymbol.contentType,
          gameSymbolType: presetSymbol.gameSymbolType,
          importance: presetSymbol.importance,
          rarity: presetSymbol.rarity
        };
      } else {
        console.log(`🎯 Slot ${index}: Empty slot for ${presetSymbol.name}`);
        return presetSymbol; // Empty slot
      }
    });

    console.log('🎯 Final merged symbols:', mergedSymbols.length, 'total slots');

    setPresetSymbols(mergedSymbols);
    setSymbols(mergedSymbols);
    setSelectedPreset(presetName);
    setShowPresetSelection(false);
    setCurrentSymbolIndex(0);

    // Select first symbol and sync content type
    if (mergedSymbols.length > 0) {
      setSelectedSymbolId(mergedSymbols[0].id);
      if (mergedSymbols[0].contentType) {
        setContentType(mergedSymbols[0].contentType);
        console.log(`🔄 Auto-synced content type to: ${mergedSymbols[0].contentType} for first symbol`);
      }
    }

    console.log(`🎯 Created ${preset.name} preset with ${mergedSymbols.length} symbols (${existingSymbols.length} existing, ${generatedSymbols.length - existingSymbols.length} empty slots)`);
  }, [config?.gameTheme, config?.theme?.generated?.symbols, generateSymbolsFromPreset]);

  // This useEffect will be moved after loadSymbolsFromStorage is defined

  const navigateToSymbol = useCallback((index: number) => {
    if (index >= 0 && index < presetSymbols.length) {
      setCurrentSymbolIndex(index);
      setSelectedSymbolId(presetSymbols[index].id);

      // Sync content type radio buttons with selected symbol's type
      const selectedSymbol = presetSymbols[index];
      if (selectedSymbol && selectedSymbol.contentType) {
        setContentType(selectedSymbol.contentType);
        console.log(`🔄 Auto-synced content type to: ${selectedSymbol.contentType} for symbol: ${selectedSymbol.name}`);
      }

      // Auto-scroll to the selected item
      setTimeout(() => {
        const carouselContainer = document.querySelector('.symbol-carousel-container');
        const selectedItem = document.querySelector(`[data-symbol-index="${index}"]`);
        if (carouselContainer && selectedItem) {
          const containerRect = carouselContainer.getBoundingClientRect();
          const itemRect = selectedItem.getBoundingClientRect();
          const scrollLeft = carouselContainer.scrollLeft;

          // Calculate if item is out of view
          const itemStart = itemRect.left - containerRect.left + scrollLeft;
          const itemEnd = itemStart + itemRect.width;
          const viewStart = scrollLeft;
          const viewEnd = scrollLeft + containerRect.width;

          if (itemStart < viewStart || itemEnd > viewEnd) {
            // Center the item in the view
            const targetScroll = itemStart - (containerRect.width - itemRect.width) / 2;
            carouselContainer.scrollTo({
              left: Math.max(0, targetScroll),
              behavior: 'smooth'
            });
          }
        }
      }, 50);
    }
  }, [presetSymbols]);

  const updateCurrentSymbol = useCallback((updatedSymbol: SymbolConfig) => {
    // Update both symbol arrays
    setSymbols(prev => {
      const updated = prev.map(s => s.id === updatedSymbol.id ? updatedSymbol : s);
      // Sync with GameStore after state update
      setTimeout(() => syncSymbolsWithGameStore(updated), 0);
      return updated;
    });
    setPresetSymbols(prev => prev.map(s => s.id === updatedSymbol.id ? updatedSymbol : s));
  }, [syncSymbolsWithGameStore]);

  // Function to handle empty slot selection and generation
  const handleEmptySlotSelection = useCallback((slotIndex: number) => {
    console.log('🎯 Empty slot selected:', slotIndex);

    // Get the original preset symbol to preserve its properties
    const originalSymbol = presetSymbols[slotIndex];

    if (!originalSymbol) {
      console.warn('⚠️ No original symbol found for slot:', slotIndex);
      return;
    }

    // Create a new symbol that preserves the original name and properties
    const newSymbol: SymbolConfig = {
      ...originalSymbol, // Preserve all original properties including name and gameSymbolType
      id: `slot_${slotIndex}_${Date.now()}`, // Generate new ID for selection tracking
      imageUrl: undefined, // Clear image URL since this is for generation
      retryCount: 0
    };

    // Update the symbols array with the new symbol (preserving original properties)
    const updatedSymbols = [...symbols];
    if (slotIndex < updatedSymbols.length) {
      updatedSymbols[slotIndex] = newSymbol;
    } else {
      // Extend array if needed
      while (updatedSymbols.length <= slotIndex) {
        updatedSymbols.push(newSymbol);
      }
    }

    setSymbols(updatedSymbols);
    if (presetSymbols.length > 0) {
      const updatedPresetSymbols = [...presetSymbols];
      if (slotIndex < updatedPresetSymbols.length) {
        updatedPresetSymbols[slotIndex] = newSymbol;
      }
      setPresetSymbols(updatedPresetSymbols);
    }

    // Select this symbol for editing
    setSelectedSymbolId(newSymbol.id);
    setCurrentSymbolIndex(slotIndex);
    setContentType(newSymbol.contentType);

    console.log('✅ Empty slot prepared for generation with preserved name:', newSymbol.name, 'type:', newSymbol.gameSymbolType);
  }, [symbols, presetSymbols]);

  // Function to clear all symbols and reset to empty preset
  const clearAllSymbols = useCallback(() => {
    console.log('🗑️ Clearing all symbols');

    // Clear GameStore symbols
    updateConfig({
      theme: {
        ...config?.theme,
        generated: {
          ...config?.theme?.generated,
          symbols: []
        }
      }
    });

    // Clear localStorage
    saveSymbolsToLocalStorage([], gameId);

    // Reinitialize preset with empty symbols
    if (selectedPreset) {
      handlePresetSelection(selectedPreset);
    }

    // Show notification
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast('All symbols cleared successfully!', 'success');
    }

    console.log('✅ All symbols cleared');
  }, [config, updateConfig, gameId, selectedPreset, handlePresetSelection]);

  // Enhanced Symbol Persistence Functions with GameStore Integration
  const loadSymbolsFromStorage = useCallback(async () => {
    try {
      console.log('📂 Loading symbols from storage for game:', gameId);

      // First, check GameStore for existing symbols (primary source)
      const gameStoreSymbols = config?.theme?.generated?.symbols || [];
      let loadedSymbols: SymbolConfig[] = [];

      if (gameStoreSymbols.length > 0) {
        console.log('📂 Found symbols in GameStore:', gameStoreSymbols.length);

        // Get the Classic preset to map correct names and types
        const classicPreset = PRESET_CONFIGURATIONS.find(p => p.name === 'Classic');
        const theme = config?.gameTheme || 'default';
        const presetSymbolsForMapping = classicPreset ? generateSymbolsFromPreset(classicPreset, theme) : [];

        // Convert GameStore symbols to SymbolConfig format with correct names
        loadedSymbols = gameStoreSymbols.map((symbolUrl: string, index: number) => {
          const presetSymbol = presetSymbolsForMapping[index];

          return {
            id: `gamestore_symbol_${index + 1}`,
            name: presetSymbol ? presetSymbol.name : `Symbol ${index + 1}`,
            symbolType: 'block' as const,
            contentType: presetSymbol ? presetSymbol.contentType : (
              index === 0 ? 'symbol-wild' as const :
              index === 1 ? 'symbol-scatter' as const : 'symbol-only' as const
            ),
            gameSymbolType: presetSymbol ? presetSymbol.gameSymbolType : undefined,
            importance: presetSymbol ? presetSymbol.importance : undefined,
            rarity: presetSymbol ? presetSymbol.rarity : undefined,
            size: '1x1' as const,
            prompt: presetSymbol ? presetSymbol.prompt : '',
            animationComplexity: 'simple' as const,
            imageUrl: symbolUrl,
            retryCount: 0
          };
        });
      } else {
        // Fallback to localStorage if GameStore is empty
        const storedSymbols = getSymbolsFromLocalStorage(gameId);
        if (storedSymbols && storedSymbols.length > 0) {
          console.log('📂 Found symbols in localStorage:', storedSymbols.length);

          // Convert StoredSymbol to SymbolConfig format
          loadedSymbols = storedSymbols.map((stored: StoredSymbol) => ({
            id: stored.id,
            name: stored.name,
            symbolType: 'block' as const,
            contentType: stored.type === 'wild' ? 'symbol-wild' as const :
              stored.type === 'scatter' ? 'symbol-scatter' as const :
                'symbol-only' as const,
            size: '1x1' as const,
            prompt: stored.customPromptText || '',
            animationComplexity: 'simple' as const,
            imageUrl: stored.image,
            retryCount: 0
          }));

          // Sync localStorage symbols to GameStore
          const symbolUrls = loadedSymbols.map(s => s.imageUrl).filter(Boolean);
          if (symbolUrls.length > 0) {
            updateConfig({
              theme: {
                ...config?.theme,
                generated: {
                  ...config?.theme?.generated,
                  symbols: symbolUrls
                }
              }
            });
            console.log('📡 Synced localStorage symbols to GameStore');
          }
        }
      }

      if (loadedSymbols.length > 0) {
        console.log('📂 Setting loaded symbols:', loadedSymbols.map(s => `${s.name}(${s.imageUrl ? 'has image' : 'no image'})`));

        // Update both symbols and presetSymbols states
        setSymbols(loadedSymbols);
        setPresetSymbols(loadedSymbols);

        // Update nextSymbolId based on existing symbols
        const maxId = Math.max(...loadedSymbols.map(s => parseInt(s.id.replace(/\D/g, '')) || 0));
        setNextSymbolId(maxId + 1);

        // Set the first symbol as selected if available
        if (loadedSymbols[0]) {
          setSelectedSymbolId(loadedSymbols[0].id);
          setCurrentSymbolIndex(0);
          if (loadedSymbols[0].contentType) {
            setContentType(loadedSymbols[0].contentType);
          }
        }

        // Dispatch symbolsChanged event for PIXI preview
        const symbolUrls = loadedSymbols.map(s => s.imageUrl).filter(Boolean);
        if (symbolUrls.length > 0) {
          const symbolsChangedEvent = new CustomEvent('symbolsChanged', {
            detail: {
              symbols: symbolUrls,
              gameId: gameId,
              source: 'animation-lab-load',
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(symbolsChangedEvent);
          console.log('📡 Dispatched symbolsChanged event for loaded symbols:', symbolUrls.length);
        }
      } else {
        console.log('📂 No symbols found in storage');
      }

      console.log('✅ Symbol loading complete:', loadedSymbols.length, 'symbols loaded');
    } catch (error) {
      console.error('❌ Error loading symbols:', error);
    }
  }, [gameId, config, updateConfig]);

  // Load symbols from GameStore on component mount and initialize preset
  useEffect(() => {
    console.log('🔄 Component mounted, initializing...');

    const initializeComponent = async () => {
      try {
        // First, load any existing symbols from GameStore
        await loadSymbolsFromStorage();
        console.log('✅ Symbols loaded from GameStore');

        // Then, always initialize the Classic preset to ensure we have all 9 slots
        // This will merge existing symbols with the preset structure
        console.log('🎯 Initializing Classic preset with', symbols.length, 'existing symbols');
        handlePresetSelection('Classic');

      } catch (error) {
        console.error('Error during initialization:', error);
        // Fallback: just initialize the preset
        console.log('🎯 Fallback: Initializing Classic preset...');
        handlePresetSelection('Classic');
      }
    };

    initializeComponent();
  }, [gameId]); // Only depend on gameId to run once per game

  const saveSymbolsToStorage = useCallback(async (symbolsToSave: SymbolConfig[]) => {
    try {
      console.log('💾 Saving symbols to storage:', symbolsToSave.length);

      // Get symbol URLs for GameStore (primary storage)
      const symbolImageUrls = symbolsToSave.filter(s => s.imageUrl).map(s => s.imageUrl!);

      // 1. Save to GameStore first (primary storage)
      if (symbolImageUrls.length > 0) {
        updateConfig({
          theme: {
            ...config?.theme,
            generated: {
              ...config?.theme?.generated,
              symbols: symbolImageUrls
            }
          }
        });
        console.log('💾 Saved to GameStore:', symbolImageUrls.length, 'symbols');
      }

      // 2. Also save to localStorage for backward compatibility
      const storedSymbols: StoredSymbol[] = symbolsToSave
        .filter(s => s.imageUrl)
        .map(s => ({
          id: s.id,
          name: s.name,
          type: s.contentType === 'symbol-wild' ? 'wild' :
            s.contentType === 'symbol-scatter' ? 'scatter' :
              s.contentType === 'symbol-bonus' ? 'high' :
                s.contentType === 'symbol-free' ? 'medium' :
                  s.contentType === 'symbol-jackpot' ? 'high' : 'low',
          image: s.imageUrl!,
          weight: 1,
          isWild: s.contentType === 'symbol-wild',
          isScatter: s.contentType === 'symbol-scatter',
          objectDescription: s.name,
          customPromptText: s.prompt
        }));

      saveSymbolsToLocalStorage(storedSymbols, gameId);
      console.log('💾 Also saved to localStorage for compatibility:', storedSymbols.length, 'symbols');

      // Save individual symbol images to server
      for (const symbol of symbolsToSave) {
        if (symbol.imageUrl && symbol.imageUrl.startsWith('data:')) {
          try {
            const filename = `${symbol.id}.png`;
            const savedUrl = await saveImage(symbol.imageUrl, filename, 'symbols');
            if (savedUrl) {
              // Update symbol with server URL
              symbol.imageUrl = typeof savedUrl === 'string' ? savedUrl : savedUrl.filePath;
            }
          } catch (error) {
            console.error('❌ Error saving symbol image:', error);
          }
        }
      }

      // Dispatch symbolsChanged event for real-time preview updates
      const symbolsChangedEvent = new CustomEvent('symbolsChanged', {
        detail: {
          symbols: symbolImageUrls,
          gameId: gameId,
          source: 'animation-lab',
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(symbolsChangedEvent);
      console.log('📡 Dispatched symbolsChanged event for preview update');

      console.log('✅ Symbols saved successfully');
    } catch (error) {
      console.error('❌ Error saving symbols:', error);
    }
  }, [gameId, updateConfig]);

  // Load symbols on component mount
  useEffect(() => {
    loadSymbolsFromStorage();
  }, [loadSymbolsFromStorage]);

  // Load saved symbols on mount (from working commit)
  useEffect(() => {
    const savedSymbols = JSON.parse(localStorage.getItem('animation-lab-symbols') || '[]');
    if (savedSymbols.length > 0) {
      setSymbols(savedSymbols);
      setNextSymbolId(Math.max(...savedSymbols.map((s: any) => parseInt(s.id.split('_')[1]) || 0)) + 1);
    }
  }, []);

  // Handler functions (defined early to avoid hoisting issues)
  const handleSymbolUpdate = useCallback((symbolId: string, updates: Partial<SymbolConfig>) => {
    setSymbols(prev => {
      const newSymbols = prev.map(s =>
        s.id === symbolId ? { ...s, ...updates } : s
      );
      // Only save if there are actual changes
      const hasChanges = newSymbols.some((s, i) => s !== prev[i]);
      if (hasChanges) {
        setTimeout(() => saveSymbolsToStorage(newSymbols), 0);
      }
      return newSymbols;
    });
  }, [saveSymbolsToStorage]);

  // Layer management handlers
  const handleLayerSelect = useCallback((layerId: string) => {
    setSelectedLayerId(layerId);
    console.log('🎯 Layer selected:', layerId);
  }, []);

  const handleLayerVisibilityToggle = useCallback((layerId: string) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerId]: !(prev[layerId] !== false) // Toggle visibility
    }));
    console.log('👁️ Layer visibility toggled:', layerId);
  }, []);

  const handleLayerLockToggle = useCallback((layerId: string) => {
    setLayerLocks(prev => ({
      ...prev,
      [layerId]: !(prev[layerId] === true) // Toggle lock
    }));
    console.log('🔒 Layer lock toggled:', layerId);
  }, []);

  // Individual letter animation system for wavy effects
  const animateLettersWave = useCallback((amplitude: number = 10, speed: number = 1, stagger: number = 0.1) => {
    console.log('🌊 Starting wave animation for individual letters');

    // Enable playing state so DOM elements are rendered
    setIsPlaying(true);

    // Get all letter sprites (type 'letter')
    const letterSprites = sprites.filter(sprite => sprite.type === 'letter');

    if (letterSprites.length === 0) {
      console.log('⚠️ No letter sprites found for wave animation');
      return;
    }

    console.log(`🌊 Animating ${letterSprites.length} letters with wave effect`);

    // Small delay to ensure DOM elements are rendered
    setTimeout(() => {
      // Clear any existing animations (both workspace and preview)
      const workspaceIds = letterSprites.map(sprite => `#${sprite.id}`);
      const previewIds = letterSprites.map(sprite => `#preview-${sprite.id}`);
      gsap.killTweensOf([...workspaceIds, ...previewIds]);

      // Create sequential wave animation for letters only (avoid symbol ghosting)
      letterSprites.forEach((sprite, index) => {
        // ONLY animate letter elements, NOT symbols to prevent ghosting
        const workspaceElementId = `#${sprite.id}`;
        const previewElementId = `#preview-${sprite.id}`;

        // Verify this is actually a letter sprite before animating
        if (sprite.type !== 'letter') {
          console.log(`⚠️ Skipping non-letter sprite ${sprite.id} in wave animation`);
          return;
        }

        // Create a timeline for each letter's wave cycle
        const tl = gsap.timeline({
          repeat: -1,
          delay: index * stagger,
          onStart: () => console.log(`🌊 Wave started for letter ${sprite.id}`),
        });

        // Separate animations for workspace and preview to prevent interference
        // Workspace animation
        tl.to(workspaceElementId, {
          scale: 1.2 + (amplitude / 50),
          y: -amplitude,
          duration: speed * 0.3,
          ease: "power2.out"
        })
          .to(workspaceElementId, {
            scale: 1,
            y: 0,
            duration: speed * 0.3,
            ease: "power2.in"
          }, "<0.3") // Start return animation slightly delayed
          .to(workspaceElementId, {
            duration: speed * 0.4,
            ease: "none"
          });

        // Preview animation (separate timeline to prevent ghosting)
        const previewTl = gsap.timeline({
          repeat: -1,
          delay: index * stagger,
        });

        previewTl.to(previewElementId, {
          scale: 1.1 + (amplitude / 60), // Slightly different scale for preview
          y: -amplitude * 0.8, // Reduced amplitude for preview
          duration: speed * 0.3,
          ease: "power2.out"
        })
          .to(previewElementId, {
            scale: 1,
            y: 0,
            duration: speed * 0.3,
            ease: "power2.in"
          }, "<0.3")
          .to(previewElementId, {
            duration: speed * 0.4,
            ease: "none"
          });
      });

      console.log(`✅ Sequential wave animation applied to ${letterSprites.length} letters`);
    }, 50); // End setTimeout
  }, [sprites]);

  const stopLetterAnimations = useCallback(() => {
    console.log('⏹️ Stopping all letter animations');

    const letterSprites = sprites.filter(sprite => sprite.type === 'letter');
    const workspaceIds = letterSprites.map(sprite => `#${sprite.id}`);
    const previewIds = letterSprites.map(sprite => `#preview-${sprite.id}`);
    const allIds = [...workspaceIds, ...previewIds];

    // Kill all GSAP animations on letter elements (both workspace and preview)
    gsap.killTweensOf(allIds);

    // Reset positions
    gsap.set(allIds, { y: 0, x: 0, rotation: 0, scale: 1 });

    console.log(`✅ Stopped animations for ${letterSprites.length} letters`);
  }, [sprites]);

  const animateLettersBounce = useCallback((height: number = 15, speed: number = 0.5, stagger: number = 0.1) => {
    console.log('⬆️ Starting bounce animation for individual letters');

    // Enable playing state so DOM elements are rendered
    setIsPlaying(true);

    const letterSprites = sprites.filter(sprite => sprite.type === 'letter');

    if (letterSprites.length === 0) {
      console.log('⚠️ No letter sprites found for bounce animation');
      return;
    }

    // Small delay to ensure DOM elements are rendered
    setTimeout(() => {
      // Clear existing animations (both workspace and preview)
      const workspaceIds = letterSprites.map(sprite => `#${sprite.id}`);
      const previewIds = letterSprites.map(sprite => `#preview-${sprite.id}`);
      gsap.killTweensOf([...workspaceIds, ...previewIds]);

      letterSprites.forEach((sprite, index) => {
        const workspaceElementId = `#${sprite.id}`;
        const previewElementId = `#preview-${sprite.id}`;

        gsap.to([workspaceElementId, previewElementId], {
          y: `-=${height}`,
          duration: speed,
          repeat: -1,
          yoyo: true,
          ease: "bounce.out",
          delay: index * stagger
        });
      });

      console.log(`✅ Bounce animation applied to ${letterSprites.length} letters`);
    }, 50); // End setTimeout
  }, [sprites]);

  const animateLettersGlow = useCallback((intensity: number = 1.5, speed: number = 1, stagger: number = 0.2) => {
    console.log('✨ Starting glow animation for individual letters');

    // Enable playing state so DOM elements are rendered
    setIsPlaying(true);

    const letterSprites = sprites.filter(sprite => sprite.type === 'letter');

    if (letterSprites.length === 0) {
      console.log('⚠️ No letter sprites found for glow animation');
      return;
    }

    // Small delay to ensure DOM elements are rendered
    setTimeout(() => {
      // Clear existing animations (both workspace and preview)
      const workspaceIds = letterSprites.map(sprite => `#${sprite.id}`);
      const previewIds = letterSprites.map(sprite => `#preview-${sprite.id}`);
      gsap.killTweensOf([...workspaceIds, ...previewIds]);

      letterSprites.forEach((sprite, index) => {
        const workspaceElementId = `#${sprite.id}`;
        const previewElementId = `#preview-${sprite.id}`;

        gsap.to([workspaceElementId, previewElementId], {
          scale: intensity,
          duration: speed,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
          delay: index * stagger
        });
      });

      console.log(`✅ Glow animation applied to ${letterSprites.length} letters`);
    }, 50); // End setTimeout
  }, [sprites]);

  // Get selected symbol (moved up to avoid temporal dead zone)
  const selectedSymbol = presetSymbols.length > 0 ?
    presetSymbols[currentSymbolIndex] || null :
    symbols.find(s => s.id === selectedSymbolId) || null;

  // Viewport scaling function for coordinates - handles both pixel and percentage inputs
  const scaleCoordinates = useCallback((sourceX: number, sourceY: number, sourceWidth: number, sourceHeight: number, workspaceWidth: number = 300, workspaceHeight: number = 200, sourceImageSize: number = 1024) => {

    // Auto-detect coordinate format: percentage (0-100) vs pixel (0-1024+)
    // Enhanced detection: check if ALL coordinates suggest percentage format
    const maxCoordinate = Math.max(sourceX, sourceY, sourceWidth, sourceHeight);
    const isPercentageFormat = maxCoordinate <= 100 && sourceX >= 0 && sourceY >= 0 && sourceWidth > 0 && sourceHeight > 0;

    let pixelX, pixelY, pixelWidth, pixelHeight;

    if (isPercentageFormat) {
      // Convert percentage coordinates to pixel coordinates first
      pixelX = (sourceX / 100) * sourceImageSize;
      pixelY = (sourceY / 100) * sourceImageSize;
      pixelWidth = (sourceWidth / 100) * sourceImageSize;
      pixelHeight = (sourceHeight / 100) * sourceImageSize;
      console.log(`📐 Converting percentage to pixels: (${sourceX}%,${sourceY}%) → (${Math.round(pixelX)},${Math.round(pixelY)})`);
    } else {
      // Already in pixel coordinates
      pixelX = sourceX;
      pixelY = sourceY;
      pixelWidth = sourceWidth;
      pixelHeight = sourceHeight;
      console.log(`📐 Using pixel coordinates: (${Math.round(pixelX)},${Math.round(pixelY)})`);
    }

    // Calculate scale factors to fit in workspace
    const scaleX = workspaceWidth / sourceImageSize;
    const scaleY = workspaceHeight / sourceImageSize;

    // Use the smaller scale to maintain aspect ratio
    const scale = Math.min(scaleX, scaleY);

    // Apply scaling to pixel coordinates
    const scaledX = pixelX * scale;
    const scaledY = pixelY * scale;
    const scaledWidth = pixelWidth * scale;
    const scaledHeight = pixelHeight * scale;

    // Center in workspace if aspect ratios don't match
    const scaledImageWidth = sourceImageSize * scale;
    const scaledImageHeight = sourceImageSize * scale;
    const offsetX = (workspaceWidth - scaledImageWidth) / 2;
    const offsetY = (workspaceHeight - scaledImageHeight) / 2;

    // Enhanced positioning with better edge handling
    let finalX = scaledX + offsetX;
    let finalY = scaledY + offsetY;

    // Smart edge detection and adjustment
    const minMargin = 10; // Minimum margin from edges
    const topMargin = 20;  // Extra margin from top for better visibility

    // Horizontal bounds with margin
    finalX = Math.max(minMargin, Math.min(workspaceWidth - scaledWidth - minMargin, finalX));

    // Vertical bounds with enhanced top margin for letters
    const isNearTop = finalY < topMargin;
    if (isNearTop) {
      finalY = Math.max(topMargin, finalY); // Ensure letters are at least 20px from top
      console.log(`📐 Adjusted Y position from ${scaledY + offsetY} to ${finalY} (top margin applied)`);
    } else {
      finalY = Math.max(minMargin, Math.min(workspaceHeight - scaledHeight - minMargin, finalY));
    }

    // Enhanced sizing with minimum visibility thresholds
    let finalWidth = scaledWidth;
    let finalHeight = scaledHeight;

    // Ensure sprites are large enough to be visible and interactive
    const minVisibleWidth = 25;  // Minimum width for visibility
    const minVisibleHeight = 25; // Minimum height for visibility

    if (finalWidth < minVisibleWidth || finalHeight < minVisibleHeight) {
      const scaleBoost = Math.max(minVisibleWidth / finalWidth, minVisibleHeight / finalHeight);
      finalWidth = finalWidth * scaleBoost;
      finalHeight = finalHeight * scaleBoost;
      console.log(`📐 Size boost applied: ${scaleBoost.toFixed(2)}x (${Math.round(scaledWidth)}x${Math.round(scaledHeight)} → ${Math.round(finalWidth)}x${Math.round(finalHeight)})`);
    }

    // Final boundary checks
    finalWidth = Math.max(minVisibleWidth, Math.min(workspaceWidth - finalX, finalWidth));
    finalHeight = Math.max(minVisibleHeight, Math.min(workspaceHeight - finalY, finalHeight));

    return {
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight,
      scale: scale,
      debug: {
        sourceFormat: isPercentageFormat ? 'percentage' : 'pixel',
        pixelCoords: { x: pixelX, y: pixelY, width: pixelWidth, height: pixelHeight },
        scaledCoords: { x: scaledX, y: scaledY, width: scaledWidth, height: scaledHeight },
        offset: { x: offsetX, y: offsetY }
      }
    };
  }, []);

  // Sprite validation function to filter extra/invalid sprites
  const validateSprites = useCallback((sprites: any[], expectedCount: number = 6) => {
    console.log(`🔍 Validating ${sprites.length} sprites (expected: ${expectedCount})`);

    if (sprites.length <= expectedCount) {
      console.log(`✅ Sprite count valid: ${sprites.length} <= ${expectedCount}`);
      return sprites;
    }

    // If we have too many sprites, filter them intelligently
    console.log(`⚠️ Too many sprites detected: ${sprites.length} > ${expectedCount}, filtering...`);

    // Separate symbols and letters
    const symbols = sprites.filter(s => s.type === 'symbol');
    const letters = sprites.filter(s => s.type === 'letter');
    const others = sprites.filter(s => s.type !== 'symbol' && s.type !== 'letter');

    console.log(`📊 Sprite breakdown: ${symbols.length} symbols, ${letters.length} letters, ${others.length} others`);

    // Select best sprites by category
    const validatedSprites = [];

    // 1. Always keep the best symbol (or largest if no explicit symbol)
    if (symbols.length > 0) {
      const bestSymbol = symbols.sort((a, b) => (b.pixels || 0) - (a.pixels || 0))[0];
      validatedSprites.push(bestSymbol);
      console.log(`✅ Selected best symbol: ${bestSymbol.id}`);
    } else if (others.length > 0) {
      // Use largest 'other' sprite as main symbol
      const bestOther = others.sort((a, b) => (b.pixels || 0) - (a.pixels || 0))[0];
      validatedSprites.push({ ...bestOther, type: 'symbol' }); // Reclassify as symbol
      console.log(`✅ Reclassified largest 'other' as symbol: ${bestOther.id}`);
    }

    // 2. Keep the best 5 letters (or fill remaining slots)
    const remainingSlots = expectedCount - validatedSprites.length;
    const bestLetters = letters
      .sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5))
      .slice(0, remainingSlots);

    validatedSprites.push(...bestLetters);
    console.log(`✅ Selected ${bestLetters.length} best letters`);

    // 3. If still short, fill with best remaining sprites
    if (validatedSprites.length < expectedCount) {
      const usedIds = new Set(validatedSprites.map(s => s.id));
      const remaining = sprites.filter(s => !usedIds.has(s.id));
      const toAdd = remaining
        .sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5))
        .slice(0, expectedCount - validatedSprites.length);

      validatedSprites.push(...toAdd);
      console.log(`✅ Added ${toAdd.length} remaining sprites to reach target count`);
    }

    console.log(`✅ Final validation: ${validatedSprites.length} sprites selected`);
    console.log(`📊 Final breakdown:`, validatedSprites.map(s => `${s.id}(${s.type})`).join(', '));

    return validatedSprites;
  }, []);

  // GPT Vision full image analysis helper
  const analyzeFullImageWithVision = useCallback(async (imageUrl: string, letterSprites: any[]): Promise<{ [spriteId: string]: string }> => {
    if (!imageUrl) {
      console.log(`❌ No full image URL provided`);
      return {};
    }

    try {
      console.log(`🔍 GPT Vision analyzing full image for letter identification...`);
      console.log(`🔍 Image URL: ${imageUrl.substring(0, 50)}...`);
      console.log(`🔍 Letter sprites to identify: ${letterSprites.map(s => s.id).join(', ')}`);

      // Sort sprites to read naturally as "BONUS" - handle multi-row layouts
      const spatiallyOrderedSprites = [...letterSprites].sort((a, b) => {
        // First sort by Y position (top to bottom), then by X position (left to right)
        const yDiff = a.y - b.y;
        if (Math.abs(yDiff) > 20) { // If Y difference is significant (different rows)
          return yDiff; // Sort by row first
        }
        return a.x - b.x; // Then sort by X position within the same row
      });
      const spritePositions = spatiallyOrderedSprites.map((sprite, index) =>
        `${index + 1}. Position (${Math.round(sprite.x)}, ${Math.round(sprite.y)}) - Sprite ID: ${sprite.id}`
      ).join('\n');

      const prompt = `I need you to identify individual letters in this image that spell "BONUS". 

The sprites are listed in reading order (top row left-to-right, then bottom row left-to-right):

${spritePositions}

Look at each numbered position and tell me which letter (B, O, N, U, or S) you see there.

Respond in this exact format:
Position 1: [LETTER]
Position 2: [LETTER]
Position 3: [LETTER]
Position 4: [LETTER]
Position 5: [LETTER]

Important: Only identify what letter you actually see at each position. The positions are ordered to spell "BONUS" when read 1→2→3→4→5.`;

      console.log(`🔍 Calling enhancedOpenaiClient.analyzeImageWithGPT4O with full image...`);
      const response = await enhancedOpenaiClient.analyzeImageWithGPT4O(imageUrl, prompt);
      console.log(`🔍 GPT Vision full image response:`, response);

      if (response.success && response.analysis) {
        console.log(`🔍 Raw GPT Vision response: "${response.analysis}"`);

        // Parse the response to extract letter assignments
        const letterMap: { [spriteId: string]: string } = {};
        const lines = response.analysis.split('\n');

        lines.forEach((line, lineIndex) => {
          const match = line.match(/Position\s+(\d+):\s*([BONUS])/i);
          if (match) {
            const positionNumber = parseInt(match[1]) - 1; // Convert to 0-based index
            const letter = match[2].toUpperCase();
            // Use the spatially ordered sprites to assign letters correctly
            const sprite = spatiallyOrderedSprites[positionNumber];
            if (sprite && positionNumber < spatiallyOrderedSprites.length && ['B', 'O', 'N', 'U', 'S'].includes(letter)) {
              letterMap[sprite.id] = letter;
              console.log(`✅ GPT Vision assigned ${sprite.id} → "${letter}" (spatial position ${positionNumber + 1})`);
            } else {
              console.log(`⚠️ Invalid spatial position ${positionNumber + 1} or sprite not found for letter "${letter}"`);
            }
          }
        });

        console.log(`✅ GPT Vision letter mapping:`, letterMap);
        return letterMap;

      } else {
        console.log(`❌ GPT Vision full image analysis failed:`, response.error || 'No response.success or response.analysis');
      }
    } catch (error) {
      console.log(`❌ GPT Vision full image error:`, error);
    }

    return {};
  }, []);

  // NEW: Letter identification during sprite creation
  const identifyLettersDuringCreation = useCallback(async (
    fullImageUrl: string,
    detectedSprites: any[],
    expectedWord: string = 'BONUS'
  ): Promise<{ [spriteId: string]: string }> => {
    console.log('🏷️ LETTER IDENTIFICATION DURING CREATION STARTED');
    console.log('🏷️ Expected word:', expectedWord);
    console.log('🏷️ Sprites to identify:', detectedSprites.length);

    if (detectedSprites.length === 0) {
      console.log('⚠️ No sprites to identify!');
      return {};
    }

    // Filter out only letter sprites for identification
    const letterSprites = detectedSprites.filter(sprite => sprite.type === 'letter');
    console.log('🏷️ Letter sprites found:', letterSprites.length);

    if (letterSprites.length === 0) {
      console.log('⚠️ No letter sprites found for identification!');
      return {};
    }

    // Use GPT Vision to identify letters in the fresh, high-quality image
    try {
      // Sort sprites by X position (left to right) for consistent ordering
      const spatiallyOrderedSprites = [...letterSprites].sort((a, b) => a.bounds.x - b.bounds.x);

      const spritePositions = spatiallyOrderedSprites.map((sprite, index) =>
        `${index + 1}. Position (${Math.round(sprite.bounds.x)}, ${Math.round(sprite.bounds.y)}) - Sprite ID: ${sprite.id}`
      ).join('\n');

      const prompt = `Look at this image and identify the letters from the word ${expectedWord}. I can see there are letter sprites at these positions:

${spritePositions}

For each position (left to right), tell me which letter from ${expectedWord} is located there.

Respond in this exact format:
Position 1: [LETTER]
Position 2: [LETTER]
Position 3: [LETTER]
Position 4: [LETTER]
Position 5: [LETTER]

Only use the letters from ${expectedWord}. If you can't clearly see a letter at a position, use "UNKNOWN".`;

      console.log('🏷️ Calling GPT Vision for immediate letter identification...');
      const response = await enhancedOpenaiClient.analyzeImageWithGPT4O(fullImageUrl, prompt);

      if (response.success && response.analysis) {
        console.log('🏷️ GPT Vision response:', response.analysis);

        // Parse the response to extract letter assignments
        const letterMap: { [spriteId: string]: string } = {};
        const lines = response.analysis.split('\n');
        const expectedLetters = expectedWord.split('');

        lines.forEach((line, lineIndex) => {
          const match = line.match(/Position\s+(\d+):\s*([A-Z])/i);
          if (match) {
            const positionNumber = parseInt(match[1]) - 1; // Convert to 0-based index
            const letter = match[2].toUpperCase();
            // Use the spatially ordered sprites to assign letters correctly
            const sprite = spatiallyOrderedSprites[positionNumber];
            if (sprite && positionNumber < spatiallyOrderedSprites.length && expectedLetters.includes(letter)) {
              letterMap[sprite.id] = letter;
              console.log(`🏷️ ✅ GPT Vision assigned ${sprite.id} → "${letter}" (spatial position ${positionNumber + 1})`);
            } else {
              console.log(`🏷️ ⚠️ Invalid spatial position ${positionNumber + 1} or sprite not found for letter "${letter}"`);
            }
          }
        });

        console.log('🏷️ ✅ Final letter mapping:', letterMap);
        return letterMap;

      } else {
        console.log('🏷️ ❌ GPT Vision failed, using fallback spatial assignment');
        // Fallback: assign letters based on spatial order
        const letterMap: { [spriteId: string]: string } = {};
        const expectedLetters = expectedWord.split('');
        const spatiallyOrderedSprites = [...letterSprites].sort((a, b) => a.bounds.x - b.bounds.x);

        spatiallyOrderedSprites.forEach((sprite, index) => {
          if (index < expectedLetters.length) {
            letterMap[sprite.id] = expectedLetters[index];
            console.log(`🏷️ 📍 Fallback assigned ${sprite.id} → "${expectedLetters[index]}" (spatial position ${index + 1})`);
          }
        });

        return letterMap;
      }
    } catch (error) {
      console.error('🏷️ ❌ Letter identification failed:', error);
      // Final fallback: assign letters in order
      const letterMap: { [spriteId: string]: string } = {};
      const expectedLetters = expectedWord.split('');

      letterSprites.forEach((sprite, index) => {
        if (index < expectedLetters.length) {
          letterMap[sprite.id] = expectedLetters[index];
          console.log(`🏷️ 🔄 Emergency fallback assigned ${sprite.id} → "${expectedLetters[index]}"`);
        }
      });

      return letterMap;
    }
  }, []);

  // Letter identification and sorting helper
  const identifyAndSortLetters = useCallback(async (letterSprites: any[], expectedWord: string = 'BONUS') => {
    console.log('🔤 LETTER IDENTIFICATION STARTED');
    console.log('🔤 Expected word:', expectedWord);
    console.log('🔤 Input letter count:', letterSprites.length);
    console.log('📊 Input letters details:', letterSprites.map(s => `${s.id}(x:${Math.round(s.x)}, y:${Math.round(s.y)}, content:"${s.content || 'none'}")`).join(', '));

    if (letterSprites.length === 0) {
      console.log('⚠️ No letter sprites to sort!');
      return letterSprites;
    }

    // Create letter order map for expected word
    const expectedLetters = expectedWord.split('');
    const letterOrderMap: Record<string, number> = {};
    expectedLetters.forEach((letter, index) => {
      letterOrderMap[letter.toUpperCase()] = index;
    });

    // Method 1: Try GPT Vision analysis on full image for accurate letter detection
    console.log('🔍 Starting GPT Vision analysis on full image...');
    const fullImageUrl = selectedSymbol?.imageUrl;
    let visionLetterMap: { [spriteId: string]: string } = {};

    if (fullImageUrl) {
      visionLetterMap = await analyzeFullImageWithVision(fullImageUrl, letterSprites);
      console.log('🔍 GPT Vision letter mapping received:', Object.keys(visionLetterMap).length, 'assignments');
    } else {
      console.log('❌ No full image URL available for GPT Vision analysis');
    }

    // Try to identify letters by vision results first, then fallback methods
    const identifiedLetters = letterSprites.map((sprite, index) => {
      let identifiedLetter = '';
      let confidence = 0;

      // Method 1: Use GPT Vision full image result
      if (visionLetterMap[sprite.id]) {
        identifiedLetter = visionLetterMap[sprite.id];
        confidence = 0.95;
        console.log(`🎯 GPT Vision (full image) identified ${sprite.id} as letter "${identifiedLetter}" (confidence: ${confidence})`);
      }

      // Method 2: Use existing stored GPT Vision content if available
      if (!identifiedLetter && sprite.content && typeof sprite.content === 'string' && sprite.content !== 'none') {
        const content = sprite.content.toUpperCase().trim();
        if (expectedLetters.includes(content)) {
          identifiedLetter = content;
          confidence = 0.9;
          console.log(`🎯 Stored vision identified ${sprite.id} as letter "${content}" (confidence: ${confidence})`);
        }
      }

      // Method 2: Enhanced spatial analysis based on original sprite generation pattern
      if (!identifiedLetter) {
        // The original prompt places letters in a 2x3 grid:
        // B O N (top row)
        // U S   (bottom row) 
        // Symbol (bottom center)

        console.log(`🔍 Analyzing sprite ${sprite.id} at position (${Math.round(sprite.x)}, ${Math.round(sprite.y)})`);

        // Analyze the actual grid layout for BONUS letters
        // Expected layout: B O N (top row), U S (bottom row)
        const sortedByY = [...letterSprites].sort((a, b) => a.y - b.y);
        const avgY = sortedByY.reduce((sum, s) => sum + s.y, 0) / sortedByY.length;

        console.log(`📊 Y-position analysis: avgY=${Math.round(avgY)}, sprite.y=${Math.round(sprite.y)}`);

        // Separate into rows
        const topRow = letterSprites.filter(s => s.y < avgY).sort((a, b) => a.x - b.x);
        const bottomRow = letterSprites.filter(s => s.y >= avgY).sort((a, b) => a.x - b.x);

        console.log(`📊 Row analysis: topRow=${topRow.length} sprites, bottomRow=${bottomRow.length} sprites`);
        console.log(`   Top row sprites: ${topRow.map(s => `${s.id}(x:${Math.round(s.x)})`).join(', ')}`);
        console.log(`   Bottom row sprites: ${bottomRow.map(s => `${s.id}(x:${Math.round(s.x)})`).join(', ')}`);

        // IMPROVED SPATIAL APPROACH: Use actual spatial positions instead of sprite ID numbers
        // Sort all letter sprites by X position to determine correct spatial order
        const spatialOrder = [...letterSprites].sort((a, b) => a.x - b.x);
        const spatialIndex = spatialOrder.findIndex(s => s.id === sprite.id);

        console.log(`🔍 Sprite ${sprite.id} at X position ${Math.round(sprite.x)} has spatial index: ${spatialIndex}`);
        console.log(`🔍 Spatial order: ${spatialOrder.map(s => `${s.id}(x:${Math.round(s.x)})`).join(' → ')}`);

        // Map spatial position to letters based on expected word
        if (expectedWord === 'BONUS' && spatialIndex >= 0 && spatialIndex < 5) {
          const bonusLetters = ['B', 'O', 'N', 'U', 'S'];
          identifiedLetter = bonusLetters[spatialIndex];
          confidence = 0.85; // High confidence for spatial mapping
          console.log(`🎯 Spatial analysis assigned ${sprite.id} as letter "${identifiedLetter}" (spatial position ${spatialIndex}, confidence: ${confidence})`);
        } else if (expectedWord === 'WILD' && spatialIndex >= 0 && spatialIndex < 4) {
          const wildLetters = ['W', 'I', 'L', 'D'];
          identifiedLetter = wildLetters[spatialIndex];
          confidence = 0.85;
          console.log(`🎯 Spatial analysis assigned ${sprite.id} as letter "${identifiedLetter}" (spatial position ${spatialIndex}, confidence: ${confidence})`);
        } else {
          console.log(`⚠️ Could not assign letter to sprite ${sprite.id} (spatial index: ${spatialIndex}, expected length: ${expectedWord.length})`);
        }
      }

      // Method 3: Simple left-to-right fallback
      if (!identifiedLetter && letterSprites.length === expectedLetters.length) {
        const spatialIndex = [...letterSprites]
          .sort((a, b) => a.x - b.x)
          .findIndex(s => s.id === sprite.id);

        if (spatialIndex >= 0 && spatialIndex < expectedLetters.length) {
          identifiedLetter = expectedLetters[spatialIndex];
          confidence = 0.3;
          console.log(`📍 Simple spatial analysis assigned ${sprite.id} as letter "${identifiedLetter}" (position ${spatialIndex}, confidence: ${confidence})`);
        }
      }

      return {
        ...sprite,
        identifiedLetter,
        confidence,
        expectedIndex: letterOrderMap[identifiedLetter] || 999
      };
    });

    // CRITICAL FIX: Don't sort by letter position - GPT Vision already provided correct spatial order
    // The GPT Vision analysis identified letters in their correct spatial positions
    // Sorting by letter value would rearrange them alphabetically, which is wrong
    console.log('🎯 PRESERVING GPT VISION SPATIAL ORDER: Letters maintain their identified spatial sequence');

    const sortedLetters = identifiedLetters;

    console.log('🎯 LETTERS IN SPATIAL ORDER:', sortedLetters.map(s => s.identifiedLetter || '?').join(''));

    console.log('✅ LETTER SORTING COMPLETE');
    console.log('📊 Result summary:');
    console.log('   Expected:', expectedWord);
    console.log('   Identified:', sortedLetters.map(s => s.identifiedLetter || '?').join(''));
    console.log('   Sprite order:', sortedLetters.map(s => `${s.identifiedLetter || '?'}(${s.id})`).join(' → '));
    console.log('   Confidences:', sortedLetters.map(s => `${s.identifiedLetter}:${s.confidence}`).join(', '));

    // Validate that we have the expected letters
    const identifiedCount = sortedLetters.filter(s => s.identifiedLetter).length;
    if (identifiedCount < expectedLetters.length) {
      console.log(`⚠️ WARNING: Only identified ${identifiedCount}/${expectedLetters.length} letters correctly`);
    }

    return sortedLetters;
  }, [selectedSymbol]);

  // Template Application Handlers
  const applyLayoutTemplate = useCallback(async (templateId: 'text-top' | 'text-bottom' | 'text-overlay') => {
    console.log('📐 Layout template clicked:', templateId, 'mode:', layoutMode);

    // Update the selected template immediately for visual feedback
    setSelectedLayoutTemplate(templateId);

    // In creation mode, layout templates are visual preferences for generation
    if (layoutMode === 'creation') {
      console.log('📐 Layout template set for future generation:', templateId);

      // If we have an existing symbol with sprites, apply the layout now
      console.log('📐 DEBUG: Layout template check:', {
        hasSelectedSymbol: !!selectedSymbol,
        selectedSymbolId: selectedSymbol?.id,
        spriteCount: sprites.length,
        symbolsCount: symbols.length
      });

      // Try to load sprites from symbol data if not in workspace
      if (selectedSymbol && sprites.length === 0 && (selectedSymbol.spriteElements?.length ?? 0) > 0) {
        console.log('📐 Loading sprites from symbol data for layout application');
        const symbolSprites = selectedSymbol.spriteElements
          ? selectedSymbol.spriteElements.map(element => ({
            id: element.id,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            src: element.src,
            type: element.id.includes('letter') || (element.id.includes('sprite_') && element.id !== element.id.replace(/sprite_[1-5]/, 'sprite_1')) ? ('letter' as const) : ('element' as const),
          }))
          : [];
        setSprites(symbolSprites);
        console.log('📐 Loaded', symbolSprites.length, 'sprites from symbol data');
      }

      if (selectedSymbol && (sprites.length > 0 || (selectedSymbol.spriteElements?.length ?? 0) > 0)) {
        console.log('📐 Applying layout to existing symbol in creation mode');

        const template = LAYOUT_TEMPLATES.find(t => t.id === templateId);
        if (template) {
          // Use sprites from state or load from symbol data - fix coordinates in both cases
          console.log('📐 Sprites state length:', sprites.length);
          console.log('📐 Selected symbol sprite elements:', selectedSymbol.spriteElements?.length || 0);

          let rawSprites = sprites.length > 0 ? sprites :
            selectedSymbol.spriteElements?.map((element, index) => ({
              id: element.id,
              x: element.x,
              y: element.y,
              width: element.width ?? 100,
              height: element.height ?? 100,
              src: element.src,
              type: element.id.includes('letter') || (element.id.includes('sprite_') && element.id !== 'sprite_1') ? 'letter' : 'element'
            })) || [];

          // Fix invalid coordinates for ALL sprites
          const currentSprites = rawSprites.map((sprite, index) => {
            const x = (sprite.x !== undefined && !isNaN(sprite.x)) ? sprite.x : (100 + index * 50);
            const y = (sprite.y !== undefined && !isNaN(sprite.y)) ? sprite.y : (100 + index * 50);
            console.log(`📐 Sprite ${index}: original(${sprite.x},${sprite.y}) -> fixed(${x},${y})`);
            return {
              ...sprite,
              x: x,
              y: y
            };
          });

          console.log('📐 Using sprites for layout:', currentSprites.length, 'sprites');
          console.log('📐 Input sprites types:', currentSprites.map(s => `${s.type}(${s.x},${s.y})`));

          // Apply the layout to existing sprites
          // Use default workspace dimensions for Step 4 (since no canvas is visible)
          const defaultWorkspaceWidth = 800;
          const defaultWorkspaceHeight = 600;
          const updatedSprites = template.applyLayout(currentSprites, defaultWorkspaceWidth, defaultWorkspaceHeight);
          console.log('📐 Output sprites positions:', updatedSprites.map(s => `${s.type}(${Math.round(s.x)},${Math.round(s.y)})`));

          // Update the symbol data
          const updatedSymbol = {
            ...selectedSymbol,
            spriteElements: updatedSprites,
            layoutTemplate: templateId
          };

          // Update symbols array
          const updatedSymbols = symbols.map(s =>
            s.id === selectedSymbol.id ? updatedSymbol : s
          );
          setSymbols(updatedSymbols);

          // For PixiJS preview to work, we need to generate a new combined image
          // with the updated layout. For now, we'll recreate the symbol with new layout
          if (selectedSymbol.imageUrl) {
            console.log('📐 Regenerating symbol image with new layout...');

            // Create a canvas to combine the sprites in new positions
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = defaultWorkspaceWidth;
            canvas.height = defaultWorkspaceHeight;

            // Load and draw sprites in new positions
            const imagePromises = updatedSprites.map(sprite => {
              return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                  ctx?.drawImage(img, sprite.x, sprite.y, sprite.width, sprite.height);
                  resolve(null);
                };
                img.onerror = () => resolve(null);
                img.src = sprite.src;
              });
            });

            // Wait for all images to load and draw, then create new symbol
            Promise.all(imagePromises).then(async () => {
              const newImageUrl = canvas.toDataURL('image/png');
              console.log('📐 Generated new image URL:', newImageUrl.substring(0, 100) + '...');
              console.log('📐 Original image URL:', String(selectedSymbol.imageUrl || 'none').substring(0, 100) + '...');
              const finalUpdatedSymbol = {
                ...updatedSymbol,
                imageUrl: newImageUrl
              };

              const finalUpdatedSymbols = symbols.map(s =>
                s.id === selectedSymbol.id ? finalUpdatedSymbol : s
              );
              setSymbols(finalUpdatedSymbols);
              await saveSymbolsToStorage(finalUpdatedSymbols);

              // Dispatch symbolsChanged event to update PixiJS preview with new layout
              const symbolUrls = finalUpdatedSymbols.map(symbol => symbol.imageUrl).filter(Boolean);
              // Add a small delay to ensure the first symbol update completes before cache invalidation
              setTimeout(() => {
                const symbolsChangedEvent = new CustomEvent('symbolsChanged', {
                  detail: {
                    symbols: symbolUrls,
                    gameId: gameId,
                    source: 'animation-lab-layout',
                    layoutTemplate: templateId,
                    forceRefresh: true, // Force texture cache invalidation
                    timestamp: Date.now()
                  }
                });
                window.dispatchEvent(symbolsChangedEvent);
              }, 100); // Wait 100ms for the first update to complete

              console.log('✅ Layout applied and new image generated for PixiJS preview');
              console.log('📡 Dispatched symbolsChanged event for layout update');
            });
          } else {
            // Save to storage and dispatch events
            await saveSymbolsToStorage(updatedSymbols);

            // Dispatch symbolsChanged event to update PixiJS preview with new layout
            const symbolUrls = updatedSymbols.map(symbol => symbol.imageUrl).filter(Boolean);
            if (symbolUrls.length > 0) {
              const symbolsChangedEvent = new CustomEvent('symbolsChanged', {
                detail: {
                  symbols: symbolUrls,
                  gameId: gameId,
                  source: 'animation-lab-layout',
                  layoutTemplate: templateId,
                  timestamp: Date.now()
                }
              });
              window.dispatchEvent(symbolsChangedEvent);
              console.log('📡 Dispatched symbolsChanged event for layout update');
            }

            console.log('✅ Layout applied to existing symbol in creation mode');
          }
        }
      } else if (selectedSymbol && sprites.length === 0) {
        console.log('⚠️ Layout template: Selected symbol has no extracted sprites yet');
        console.log('💡 Layout templates only work with symbols that have been processed into individual sprites');
      } else {
        console.log('⚠️ Layout template: No selected symbol found');
        console.log('💡 Please select a symbol first, then click layout templates');
      }

      // Dispatch event to update CSS preview
      const layoutChangedEvent = new CustomEvent('layoutChanged', {
        detail: {
          template: templateId,
          gameId: gameId,
          source: 'animation-lab',
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(layoutChangedEvent);
      return;
    }

    // In animation mode, check for sprites to manipulate
    if (!selectedSymbol || sprites.length === 0) {
      console.log('⚠️ Layout template skipped - no symbol or sprites:', { selectedSymbol: !!selectedSymbol, spriteCount: sprites.length });
      return;
    }

    const template = LAYOUT_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      console.log('⚠️ Layout template not found:', templateId);
      return;
    }

    console.log('📐 Applying layout template:', templateId);
    console.log('📊 Input sprites:', sprites.map(s => `${s.id}(${s.type})`).join(', '));

    // Separate sprites by type
    const symbolSprites = sprites.filter(s => s.type === 'symbol' || s.type === 'element');
    const letterSprites = sprites.filter(s => s.type === 'letter');

    // NEW APPROACH: Use letter-based IDs to sort correctly
    console.log('🏷️ Using letter-based sprite IDs for sorting...');

    let sortedLetterSprites = letterSprites;

    // Check if sprites have letter-based IDs (e.g., "bulletproof_B", "bulletproof_O")
    const hasLetterBasedIds = letterSprites.some(sprite =>
      sprite.id.match(/_[BONUS]$/) || sprite.identifiedLetter
    );

    if (hasLetterBasedIds) {
      console.log('🏷️ ✅ Found letter-based IDs, sorting by BONUS order...');

      // Sort sprites to spell "BONUS" using their letter-based IDs or identifiedLetter
      const bonusOrder = ['B', 'O', 'N', 'U', 'S'];
      sortedLetterSprites = letterSprites.filter(sprite => {
        // Only include sprites that have valid BONUS letters
        const letter = sprite.identifiedLetter || sprite.id.split('_').pop() || '';
        return bonusOrder.includes(letter);
      }).sort((a, b) => {
        // Extract letter from ID (e.g., "bulletproof_B" → "B") or use identifiedLetter
        const letterA = a.identifiedLetter || a.id.split('_').pop() || '';
        const letterB = b.identifiedLetter || b.id.split('_').pop() || '';

        const indexA = bonusOrder.indexOf(letterA);
        const indexB = bonusOrder.indexOf(letterB);

        // If both letters are in BONUS, sort by their order
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }

        // Fallback to spatial order
        return a.x - b.x;
      });

      console.log('🏷️ ✅ Sorted letters by BONUS order:', sortedLetterSprites.map(s => {
        const letter = s.identifiedLetter || s.id.split('_').pop();
        return `${letter}(${s.id})`;
      }).join(' → '));

    } else {
      console.log('🏷️ ⚠️ No letter-based IDs found, falling back to spatial sorting...');
      // Fallback: sort by spatial position (left to right)
      sortedLetterSprites = letterSprites.sort((a, b) => a.x - b.x);
    }

    // Combine sorted letters with symbols
    const reorderedSprites = [...symbolSprites, ...sortedLetterSprites];

    console.log('🔄 Reordered sprites:', reorderedSprites.map(s => {
      const letter = s.identifiedLetter || (s.id.includes('_') ? s.id.split('_').pop() : '');
      return `${s.id}(${s.type}${letter ? ':' + letter : ''})`;
    }).join(', '));

    const workspaceWidth = 300;
    const workspaceHeight = 200;
    const repositionedSprites = template.applyLayout(reorderedSprites, workspaceWidth, workspaceHeight);

    console.log('📊 Repositioned sprites:', repositionedSprites.map(s => `${s.id}(${s.type}) at (${Math.round(s.x)},${Math.round(s.y)})`).join(', '));

    setSprites(repositionedSprites);
    setSelectedLayoutTemplate(templateId);

    // Save template preference to symbol
    handleSymbolUpdate(selectedSymbol.id, { layoutTemplate: templateId });

    console.log('✅ Layout template applied successfully:', templateId);
  }, [selectedSymbol, sprites, handleSymbolUpdate, layoutMode, gameId]);

  const applyAnimationTemplate = useCallback((templateId: 'bounce' | 'pulse' | 'glow' | 'rotate' | 'shake' | 'sparkle' | 'flash' | 'wave') => {
    if (!selectedSymbol || sprites.length === 0) return;

    const template = ANIMATION_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    console.log('🎬 Applying Animation Template to', sprites.length, 'sprites:', templateId);

    // Stop current animations
    gsap.killTweensOf('*'); // Kill all GSAP animations
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Apply template-specific animations to sprite objects directly
    switch (templateId) {
      case 'bounce':
        // Animate letters individually with bounce
        sprites.forEach((sprite, index) => {
          if (sprite.type === 'letter') {
            const delay = index * 0.1; // Stagger letters
            const originalY = sprite.y;
            gsap.to(sprite, {
              y: originalY - 20,
              duration: 0.6,
              ease: "power2.out",
              repeat: -1,
              yoyo: true,
              delay: delay,
              onUpdate: () => {
                // Canvas will auto-update via animation frame
              }
            });
          }
        });
        break;

      case 'pulse':
        // Scale letters individually
        sprites.forEach((sprite, index) => {
          const delay = index * 0.15;
          const originalWidth = sprite.width;
          const originalHeight = sprite.height;
          gsap.to(sprite, {
            width: originalWidth * 1.2,
            height: originalHeight * 1.2,
            x: sprite.x - originalWidth * 0.1,
            y: sprite.y - originalHeight * 0.1,
            duration: 0.8,
            ease: "power2.inOut",
            repeat: -1,
            yoyo: true,
            delay: delay
          });
        });
        break;

      case 'shake':
        // Shake letters individually
        sprites.forEach((sprite, index) => {
          if (sprite.type === 'letter') {
            const delay = index * 0.1;
            const originalX = sprite.x;
            gsap.to(sprite, {
              x: originalX + 5,
              duration: 0.1,
              ease: "power2.inOut",
              repeat: -1,
              yoyo: true,
              delay: delay
            });
          }
        });
        break;

      case 'sparkle':
        // Wave-like effect for letters
        sprites.forEach((sprite, index) => {
          if (sprite.type === 'letter') {
            const delay = index * 0.2;
            const originalY = sprite.y;
            const originalWidth = sprite.width;
            const originalHeight = sprite.height;
            gsap.to(sprite, {
              y: originalY - 15,
              width: originalWidth * 1.1,
              height: originalHeight * 1.1,
              duration: 0.4,
              ease: "back.out(1.7)",
              repeat: -1,
              repeatDelay: 1.5,
              yoyo: true,
              delay: delay
            });
          }
        });
        break;

      case 'wave':
        // Sequential wave animation
        sprites.forEach((sprite, index) => {
          if (sprite.type === 'letter') {
            const delay = index * 0.3;
            const originalY = sprite.y;
            gsap.to(sprite, {
              y: originalY - 12,
              duration: 0.5,
              ease: "sine.inOut",
              repeat: -1,
              repeatDelay: sprites.filter(s => s.type === 'letter').length * 0.3,
              yoyo: true,
              delay: delay
            });
          }
        });
        break;

      default:
        console.log('⚠️ Animation template not yet implemented:', templateId);
        // For unimplemented animations, apply basic bounce
        sprites.forEach((sprite, index) => {
          if (sprite.type === 'letter') {
            const originalY = sprite.y;
            gsap.to(sprite, {
              y: originalY - 10,
              duration: 0.8,
              ease: "power2.inOut",
              repeat: -1,
              yoyo: true,
              delay: index * 0.1
            });
          }
        });
    }

    setSelectedAnimationTemplate(templateId);

    // Auto-start playing to show the animation
    setIsPlaying(true);

    // Save template preference to symbol
    handleSymbolUpdate(selectedSymbol.id, { animationTemplate: templateId });

    // Dispatch event for PixiJS preview to react to animation changes
    const animationChangedEvent = new CustomEvent('animationTemplateChanged', {
      detail: {
        templateId,
        symbolId: selectedSymbol.id,
        gameId: gameId,
        source: 'animation-lab',
        isPlaying: true,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(animationChangedEvent);

    console.log('✅ Animation template applied successfully:', templateId);
  }, [selectedSymbol, sprites, handleSymbolUpdate]);

  // Load sprite elements when symbol changes (moved from WorkspacePanel)
  useEffect(() => {
    console.log('🔄 Workspace effect triggered:', {
      hasSelectedSymbol: !!selectedSymbol,
      isCanvasReady,
      selectedSymbolId: selectedSymbol?.id,
      lastRefresh: selectedSymbol?.lastRefresh,
      symbolData: selectedSymbol ? {
        name: selectedSymbol.name,
        hasLetterSprites: !!(selectedSymbol.letterSprites && selectedSymbol.letterSprites.length > 0),
        hasSpriteElements: !!(selectedSymbol.spriteElements && selectedSymbol.spriteElements.length > 0),
        hasImageUrl: !!selectedSymbol.imageUrl,
        isVisionProcessed: selectedSymbol.isVisionProcessed,
        spriteElementsCount: selectedSymbol.spriteElements?.length || 0
      } : null
    });

    if (!selectedSymbol || !isCanvasReady) {
      console.log('⏸️ Skipping sprite load - no symbol or canvas not ready');
      // DON'T clear sprites here - they might be temporarily loading during refresh
      return;
    }

    // Wait for processing to complete before loading sprites
    if (isProcessing && selectedSymbol.contentType?.startsWith('symbol-') && selectedSymbol.contentType !== 'symbol-only') {
      console.log('⏳ Waiting for GPT Vision processing to complete...');
      return;
    }

    const newSprites: Array<{ id: string, x: number, y: number, width: number, height: number, src: string | undefined, type: 'letter' | 'element' | 'symbol', confidence?: any, zIndex?: any, }> = [];

    // IMPROVED LOADING: Handle mixed content properly
    console.log('🎯 Content type analysis:', selectedSymbol.contentType);
    console.log('📊 Available data:', {
      hasLetterSprites: !!(selectedSymbol.letterSprites && selectedSymbol.letterSprites.length > 0),
      hasSpriteElements: !!(selectedSymbol.spriteElements && selectedSymbol.spriteElements.length > 0),
      hasImageUrl: !!selectedSymbol.imageUrl,
      letterSpritesCount: selectedSymbol.letterSprites?.length || 0,
      spriteElementsCount: selectedSymbol.spriteElements?.length || 0
    });

    // FOR SYMBOL+TEXT: Prioritize TEMPLATE results, then GPT Vision, then universal detection
    if (selectedSymbol.contentType?.startsWith('symbol-') && selectedSymbol.contentType !== 'symbol-only') {
      console.log('🎯 Processing symbol+text with SMART detection');

      // FIRST PRIORITY: TEMPLATE results (100% accurate)
      if (selectedSymbol.isVisionProcessed && selectedSymbol.visionAnalysis && (selectedSymbol.spriteElements?.length ?? 0) > 0) {
        // 🔒 MUTEX PROTECTION: Lock template extraction to prevent conflicts
        if (processingMutex.current.lock('template-extraction')) {
          try {
            console.log('🎯 ✅ TEMPLATE/VISION ACTIVE: Using direct sprite element positioning');

            // FIXED: Use sprite elements directly with proper viewport scaling
            selectedSymbol.spriteElements?.forEach((spriteElement, index) => {
              // Check if spriteElement has bounds (from universal detection) or use fallback positioning
              if (spriteElement.bounds) {
                // Scale from source coordinates to workspace size (300x200) with format auto-detection
                const scaled = scaleCoordinates(
                  spriteElement.bounds.x,
                  spriteElement.bounds.y,
                  spriteElement.bounds.width,
                  spriteElement.bounds.height,
                  300, // workspace width
                  200, // workspace height
                  1024 // source image size
                );

                newSprites.push({
                  id: spriteElement.id,
                  x: scaled.x,
                  y: scaled.y,
                  width: scaled.width,
                  height: scaled.height,
                  src: spriteElement.imageUrl,
                  type: spriteElement.type || 'element',
                  confidence: spriteElement.confidence || 1.0,
                  zIndex: spriteElement.type === 'letter' ? 2 : 1
                });
                console.log(`✅ Scaled sprite ${spriteElement.id}: (${spriteElement.bounds.x},${spriteElement.bounds.y}) [${scaled.debug.sourceFormat}] → (${Math.round(scaled.x)},${Math.round(scaled.y)}) scale=${scaled.scale.toFixed(3)} size=${Math.round(scaled.width)}x${Math.round(scaled.height)}`);
              } else {
                // Fallback positioning for elements without bounds data
                const isMainSymbol = spriteElement.id.includes('main_symbol');

                if (isMainSymbol) {
                  newSprites.push({
                    id: spriteElement.id,
                    x: (300 - 120) / 2,
                    y: (200 - 100) / 2 + 30,
                    width: 120,
                    height: 100,
                    src: spriteElement.imageUrl,
                    type: 'element',
                    confidence: spriteElement.confidence || 1.0,
                    zIndex: 1
                  });
                  console.log(`✅ Fallback positioned main symbol: ${spriteElement.id}`);
                } else {
                  const letterIndex = Math.max(0, index - 1);
                  const letterWidth = 35;
                  const letterSpacing = 10;
                  const totalWidth = 4 * letterWidth + 3 * letterSpacing;
                  const startX = (300 - totalWidth) / 2;

                  newSprites.push({
                    id: spriteElement.id,
                    x: startX + (letterIndex * (letterWidth + letterSpacing)),
                    y: 15,
                    width: letterWidth,
                    height: 30,
                    src: spriteElement.imageUrl,
                    type: 'letter',
                    confidence: spriteElement.confidence || 1.0,
                    zIndex: 2
                  });
                  console.log(`✅ Fallback positioned letter: ${spriteElement.id}`);
                }
              }
            });

            console.log('🎯 ✅ TEMPLATE POSITIONING COMPLETE: All sprite elements positioned directly');

            // CRITICAL: Set processing flag to prevent universal detection from overwriting
            setSymbols(prevSymbols =>
              prevSymbols.map(symbol =>
                symbol.id === selectedSymbol.id
                  ? { ...symbol, isVisionProcessed: true }
                  : symbol
              )
            );
            console.log('🔒 Template extraction complete - blocking universal detection from overwriting');
          } finally {
            processingMutex.current.unlock();
          }
        }
      }
      // SECOND PRIORITY: Universal detection results (good accuracy)
      else if (selectedSymbol.isUniversalProcessed && (selectedSymbol.spriteElements?.length ?? 0) > 0) {
        console.log('🎯 Using universal detection results - skipping old system');

        // Apply intelligent positioning based on sprite types
        console.log('🎯 Applying smart positioning for sprite types...');

        // SMART CLASSIFICATION: Separate by size and position (not just type)
        const allSprites = selectedSymbol.spriteElements;

        console.log(`🔍 Analyzing ${allSprites?.length} sprites for classification:`);
        allSprites?.forEach((sprite, index) => {
          console.log(`   Sprite ${index}: ${sprite.id} | type: ${sprite.type} | pixels: ${sprite?.pixels} | size: ${sprite.bounds?.width}x${sprite.bounds?.height} | confidence: ${sprite.confidence?.toFixed(2)}`);
        });

        // Try to find sprites explicitly classified as 'symbol' first
        let mainSymbol = allSprites?.find(sprite => sprite.type === 'symbol');

        if (!mainSymbol) {
          // Fallback: Sort by pixel count - largest is likely the main symbol
          const sortedBySize = [...allSprites].sort((a, b) => (b.pixels || 0) - (a.pixels || 0));
          mainSymbol = sortedBySize[0];
          console.log(`⚠️ No 'symbol' type found, using largest sprite as main symbol`);
        } else {
          console.log(`✅ Found explicit 'symbol' type sprite: ${mainSymbol.id}`);
        }

        const otherSprites = allSprites?.filter(sprite => sprite.id !== mainSymbol?.id);

        console.log(`📊 Final classification: Main symbol: ${mainSymbol?.id} (${mainSymbol?.pixels || 0} pixels) + ${otherSprites?.length} other elements`);
        console.log(`📊 Main symbol details:`, {
          id: mainSymbol?.id,
          type: mainSymbol?.type,
          bounds: mainSymbol?.bounds,
          pixels: mainSymbol?.pixels,
          confidence: mainSymbol?.confidence
        });

        // Position main symbol with proper scaling
        if (mainSymbol) {
          if (mainSymbol.bounds && mainSymbol.imageUrl) {
            const scaled = scaleCoordinates(
              mainSymbol.bounds.x,
              mainSymbol.bounds.y,
              mainSymbol.bounds.width,
              mainSymbol.bounds.height,
              300, // workspace width
              200, // workspace height
              1024 // source image size
            );

            newSprites.push({
              id: mainSymbol.id,
              x: scaled.x,
              y: scaled.y,
              width: scaled.width,
              height: scaled.height,
              src: mainSymbol.imageUrl,
              type: 'element',
              confidence: mainSymbol.confidence,
              zIndex: 1
            });
            console.log(`✅ Scaled main symbol ${mainSymbol.id}: (${mainSymbol.bounds.x},${mainSymbol.bounds.y}) [${scaled.debug.sourceFormat}] → (${Math.round(scaled.x)},${Math.round(scaled.y)}) size=${Math.round(scaled.width)}x${Math.round(scaled.height)}`);
          } else {
            console.log(`❌ Main symbol ${mainSymbol.id} missing bounds or imageUrl:`, {
              hasBounds: !!mainSymbol.bounds,
              hasImageUrl: !!mainSymbol.imageUrl,
              bounds: mainSymbol.bounds,
              imageUrl: mainSymbol.imageUrl?.substring(0, 50) + '...'
            });
            // Fallback positioning for main symbol without bounds
            newSprites.push({
              id: mainSymbol.id,
              x: 90,  // Center in 300px workspace
              y: 80,  // Below letters
              width: 120,
              height: 100,
              src: mainSymbol.imageUrl || '',
              type: 'element',
              confidence: mainSymbol.confidence || 0.5,
              zIndex: 1
            });
            console.log(`⚠️ Using fallback positioning for main symbol ${mainSymbol.id}`);
          }
        } else {
          console.log(`❌ No main symbol found in ${allSprites?.length} sprites`);
        }

        // Position letters/other elements with proper scaling
        if ((otherSprites?.length ?? 0) > 0) {
          // Sort letters by correct spelling order instead of X position
          console.log('🔤 Initial letter sorting for sprite loading...');
          const sortedByPosition = [...otherSprites].sort((a, b) => a.bounds.x - b.bounds.x);

          sortedByPosition.forEach((sprite, index) => {
            const scaled = scaleCoordinates(
              sprite.bounds.x,
              sprite.bounds.y,
              sprite.bounds.width,
              sprite.bounds.height,
              300, // workspace width
              200, // workspace height
              1024 // source image size
            );

            newSprites.push({
              id: sprite.id,
              x: scaled.x,
              y: scaled.y,
              width: scaled.width,
              height: scaled.height,
              src: sprite.imageUrl,
              type: 'letter',
              confidence: sprite.confidence,
              zIndex: 2
            });
            console.log(`✅ Scaled letter ${sprite.id}: (${sprite.bounds.x},${sprite.bounds.y}) [${scaled.debug.sourceFormat}] → (${Math.round(scaled.x)},${Math.round(scaled.y)}) size=${Math.round(scaled.width)}x${Math.round(scaled.height)}`);
          });
        }

        console.log(`✅ Loaded ${selectedSymbol.spriteElements?.length} universal sprites`);
      } else {
        console.log('🔄 No universal results yet, using fallback system');

        // FALLBACK: Old system only if universal detection hasn't run
        const symbolX = (300 - 80) / 2;
        const symbolY = 20;

        newSprites.push({
          id: `symbol_main`,
          x: symbolX,
          y: symbolY,
          width: 80,
          height: 80,
          src: selectedSymbol.imageUrl,
          type: 'element'
        });
        console.log(`📎 Main symbol positioned at (${symbolX}, ${symbolY})`);

        const textMatch = selectedSymbol.prompt.match(/["']([A-Z]+)["']/i) || selectedSymbol.prompt.match(/\b(wild|scatter|bonus|free|jackpot|mega|super|big|win)\b/i);
        const detectedText = textMatch ? textMatch[1].toUpperCase() : 'WILD';
        // For workspace loading, show ALL letters including duplicates (e.g., both T's in SCATTER)
        const letters = detectedText.split('');

        console.log(`🔤 Creating individual ${detectedText} letters...`);

        const letterAreaY = 130;
        const totalLetterWidth = letters.length * 40 + (letters.length - 1) * 10;
        const startX = (300 - totalLetterWidth) / 2;

        letters.forEach((letter, index) => {
          const letterX = startX + (index * 50);

          const letterSprite = {
            id: `letter_${letter}_${index}`,
            x: letterX,
            y: letterAreaY,
            width: 40,
            height: 45,
            src: selectedSymbol.imageUrl,
            type: 'letter'
          };

          newSprites.push(letterSprite);
          console.log(`📝 Letter ${letter} placeholder created:`, letterSprite);
        });
      }

      // Skip old sprite sheet processing if we have GPT Vision or universal results
      if (!selectedSymbol.isVisionProcessed && !selectedSymbol.isUniversalProcessed) {
        console.log('⚠️ Using OLD SYSTEM: GPT Vision not yet processed - may have contamination issues');
        const textMatch = selectedSymbol.prompt.match(/["']([A-Z]+)["']/i) || selectedSymbol.prompt.match(/\b(wild|scatter|bonus|free|jackpot|mega|super|big|win)\b/i);
        const detectedText = textMatch ? textMatch[1].toUpperCase() : 'WILD';
        // For workspace loading, show ALL letters including duplicates (e.g., both T's in SCATTER)
        const letters = detectedText.split('');

        console.log(`✅ Created 1 main symbol + ${letters.length} individual ${detectedText} letter sprites`);

        // ASYNC: Extract main symbol and individual letters from sprite sheet
        createSpriteSheetElements(selectedSymbol.imageUrl, letters, detectedText).then(spriteSheetResult => {
          const { mainSymbol, letterImages } = spriteSheetResult;

          if (mainSymbol && letterImages.length === letters.length) {
            console.log('🎨 Updating sprites with sprite sheet elements...', letterImages.length, 'letters + 1 main symbol');

            setSprites(prevSprites => {
              console.log('📊 SINGLE sprite update - preventing infinite loop');

              const updatedSprites = prevSprites.map((sprite, index) => {
                // Update main symbol (index 0) with extracted symbol
                if ((sprite.type === 'element' || sprite.type === 'symbol') && index === 0) {
                  return {
                    ...sprite,
                    src: mainSymbol
                  };
                }
                // Update letter sprites with extracted letters
                if (sprite.type === 'letter' && index >= 1 && index <= letters.length) {
                  const letterIndex = index - 1; // Adjust for 0-based array
                  return {
                    ...sprite,
                    src: letterImages[letterIndex]
                  };
                }
                return sprite;
              });

              console.log('✅ Single sprite update complete');
              return updatedSprites;
            });

            console.log('✅ All sprites updated with sprite sheet elements');
          } else {
            console.error('❌ Expected main symbol + 4 letter images, got:', mainSymbol ? 'main symbol' : 'no main symbol', letterImages.length, 'letters');
          }
        }).catch(error => {
          console.error('❌ Failed to create letter images:', error);
        });

        // AUTO-TRIGGER: Automatically split text for better individual letters
        // BUT ONLY if template extraction hasn't already provided perfect results
        if (!selectedSymbol.letterSprites || selectedSymbol.letterSprites.length === 0) {
          // Skip auto-trigger if template/vision extraction already worked
          if (selectedSymbol.isVisionProcessed || ((selectedSymbol.spriteElements?.length ?? 0) >= 4)) {
            console.log('🎯 SKIPPING auto-trigger - template extraction already provided', selectedSymbol.spriteElements?.length, 'perfect sprites');
            console.log('🎯 Auto-trigger flags:', { isVisionProcessed: selectedSymbol.isVisionProcessed, spriteCount: selectedSymbol.spriteElements?.length });
          } else {
            console.log('🔄 Auto-triggering text split for better individual letters...');
            setTimeout(() => {
              handleIndividualizeText(); // Use the correct function name
            }, 500);
          }
        }
      } else {
        console.log('🎯 ✅ SKIPPED OLD SYSTEM: GPT Vision or Universal detection already processed - no contamination risk');
      }

      // OPTIONAL: Use individual letter images if available from text analysis
      if (selectedSymbol.letterSprites && selectedSymbol.letterSprites.length > 0) {
        console.log('📊 Available letterSprites data:', selectedSymbol.letterSprites.length);
        selectedSymbol.letterSprites.slice(0, 4).forEach((letterSprite, index) => {
          // Update the letter sprite at index 1+index (since symbol is at index 0)
          const spriteIndex = index + 1;
          if (newSprites[spriteIndex] && newSprites[spriteIndex].type === 'letter') {
            newSprites[spriteIndex].src = letterSprite.imageUrl || selectedSymbol.imageUrl;
            // console.log(`🔄 Updated letter ${letters[index]} with individual image`);
          }
        });
      }
    }

    // FOR TEXT-ONLY: Only letters
    else if (selectedSymbol.contentType === 'text-only' &&
      selectedSymbol.letterSprites && selectedSymbol.letterSprites.length > 0) {
      console.log('🔤 Processing text-only content');
      selectedSymbol.letterSprites.forEach((letterSprite, index) => {
        const letterWidth = Math.max(30, letterSprite.bounds?.width || 40);
        const letterHeight = Math.max(40, letterSprite.bounds?.height || 50);
        const letterX = letterSprite.bounds?.x || (50 + index * 50);
        const letterY = letterSprite.bounds?.y || (200 - letterHeight) / 2;

        newSprites.push({
          id: `letter_${letterSprite.letter}_${index}`,
          x: letterX,
          y: letterY,
          width: letterWidth,
          height: letterHeight,
          src: letterSprite.imageUrl,
          type: 'letter',
        });
      });
      console.log('✅ Added', selectedSymbol.letterSprites.length, 'text-only letter sprites');
    }

    // FOR SYMBOL-ONLY: Only sprite elements
    else if (selectedSymbol.contentType === 'symbol-only' &&
      selectedSymbol.spriteElements && selectedSymbol.spriteElements.length > 0) {
      selectedSymbol.spriteElements.forEach((element, index) => {
        // Calculate position based on original bounds
        const x = Math.max(10, (element.bounds.x / 100) * 250); // Convert percentage to canvas coords
        const y = Math.max(10, (element.bounds.y / 100) * 150);
        const width = Math.max(30, (element.bounds.width / 100) * 250);
        const height = Math.max(30, (element.bounds.height / 100) * 150);

        newSprites.push({
          id: `element_${element.name}_${index}`,
          x: x,
          y: y,
          width: Math.min(width, 80), // Limit max size
          height: Math.min(height, 80),
          src: selectedSymbol.imageUrl,
          type: 'element'
        });
      });
      console.log('🎯 Added', selectedSymbol.spriteElements.length, 'symbol-only sprite elements');
    }

    // ERROR CASE: No sprites detected - this means detection failed
    else {
      console.error('❌ No sprites detected! This indicates sprite detection failure.');
      console.error('Debug info:', {
        contentType: selectedSymbol.contentType,
        hasLetterSprites: !!(selectedSymbol.letterSprites && selectedSymbol.letterSprites.length > 0),
        hasSpriteElements: !!(selectedSymbol.spriteElements && selectedSymbol.spriteElements.length > 0),
        hasImageUrl: !!selectedSymbol.imageUrl,
        letterSprites: selectedSymbol.letterSprites,
        spriteElements: selectedSymbol.spriteElements
      });

      // For debugging: show the main image so user can see what was generated
      if (selectedSymbol.imageUrl) {
        newSprites.push({
          id: 'debug_main_image',
          x: (300 - 100) / 2,
          y: (200 - 100) / 2,
          width: 100,
          height: 100,
          src: selectedSymbol.imageUrl,
          type: 'element'
        });
        console.log('🛜 Debug: Showing main image - sprite detection needs fixing');
        console.log('🛜 Run text individualization manually if this is a text symbol');
      }
    }

    setSprites(
      newSprites.map(sprite => ({
        ...sprite,
        src: sprite.src ?? ''
      }))
    );
    console.log('✨ Workspace loaded with', newSprites.length, 'draggable elements');

    // Apply layout template if the symbol has one saved
    if (selectedSymbol.layoutTemplate && newSprites.length > 0) {
      const template = LAYOUT_TEMPLATES.find(t => t.id === selectedSymbol.layoutTemplate);
      if (template) {
        setTimeout(() => {
          // Apply letter identification and sorting for auto-applied templates too
          const symbolSprites = newSprites.filter(s => s.type === 'symbol' || s.type === 'element');
          const letterSprites = newSprites.filter(s => s.type === 'letter');

          // Sort letters correctly
          const sortedLetterSprites = letterSprites.length > 0 ? identifyAndSortLetters(letterSprites) : [];
          const reorderedSprites = [...symbolSprites, ...sortedLetterSprites];

          console.log('🔄 Auto-template reordered sprites:', reorderedSprites.map(s => `${s.id}(${s.type}${s.identifiedLetter ? ':' + s.identifiedLetter : ''})`).join(', '));

          const repositionedSprites = template.applyLayout(reorderedSprites, 300, 200);
          setSprites(repositionedSprites);
          setSelectedLayoutTemplate(selectedSymbol.layoutTemplate!);
          console.log('📐 Auto-applied saved layout template:', selectedSymbol.layoutTemplate);
        }, 100);
      }
    }

    // Apply animation template if the symbol has one saved
    if (selectedSymbol.animationTemplate && newSprites.length > 0) {
      setSelectedAnimationTemplate(selectedSymbol.animationTemplate);
      console.log('🎬 Auto-loaded saved animation template:', selectedSymbol.animationTemplate);
    }
  }, [selectedSymbol?.id, selectedSymbol?.lastRefresh, selectedSymbol?.isVisionProcessed, selectedSymbol?.spriteElements?.length, isCanvasReady, isProcessing]);

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!selectedSymbolId) {
      alert('Please create a symbol first by generating one');
      return;
    }

    setIsProcessing(true);
    console.log('📁 Processing uploaded image:', file.name);

    try {
      const imageUrl = URL.createObjectURL(file);

      // Use SMART sprite atlas to analyze the image - avoid over-detection
      const atlasResult = await professionalSpriteAtlas.createAtlasWithPixelPerfectBounds(
        imageUrl,
        {
          alphaThreshold: 128, // Higher threshold to avoid noise
          minSpriteSize: 500,  // Much higher to avoid fragments  
          maxSprites: 3,       // Should only be: gem + text block
          mergeDistance: 15,   // Larger to group elements properly
          useGPTLabeling: true
        }
      );

      if (atlasResult.success) {
        // Update the selected symbol with the new image and analysis
        handleSymbolUpdate(selectedSymbolId, {
          imageUrl,
          spriteElements: atlasResult.spriteElements,
          atlasResult
        });

        console.log('✅ Image processed successfully:', atlasResult);
      } else {
        console.error('❌ Image processing failed:', atlasResult.error);
        alert(`Image processing failed: ${atlasResult.error}`);
      }
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      alert('Image upload failed');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedSymbolId, handleSymbolUpdate, setIsProcessing]);

  // ENHANCED SPRITE CUTTING: Improved detection parameters for better text separation
  const getEnhancedDetectionSettings = useCallback((expectedText: string, contentType: string) => {
    const letterCount = expectedText.length;
    const hasText = contentType.startsWith('symbol-') && contentType !== 'symbol-only';

    return {
      minSpriteSize: hasText ? 5 : 10,           // Very small for thin letters
      maxSpriteSize: 300000,                     // Allow large symbols
      separationThreshold: hasText ? 0.3 : 1,    // More sensitive for text
      noiseFilter: false,                        // Keep all content
      mergeThreshold: hasText ? 0.8 : 2,         // Less merging for letters
      confidenceThreshold: 0.001,               // Very permissive
      includeTransparentBorders: true,          // Capture decorative elements
      textAware: hasText,                       // Enable text-specific detection
      expectedLetters: hasText ? [...new Set(expectedText.split(''))] : [],
      letterSpacing: 'auto'                     // Auto-detect spacing
    };
  }, []);

  const handleGenerateSymbol = useCallback(async () => {
    console.log('🟢 BUTTON CLICKED: Generate Symbol button was clicked!');
    console.log('🟢 PROMPT CHECK:', { prompt: prompt.trim(), hasPrompt: !!prompt.trim() });

    if (!prompt.trim()) {
      console.log('🔴 STOPPED: No prompt entered');
      alert('Please enter a prompt for the symbol');
      return;
    }

    // Check if we have a selected symbol from the carousel to update
    const currentSymbol = selectedSymbol;
    if (!currentSymbol) {
      console.log('🔴 STOPPED: No symbol selected from carousel');
      alert('Please select a symbol from the carousel first');
      return;
    }

    console.log('🟢 CONTINUING: Prompt validation passed, starting generation...');
    console.log('🎯 UPDATING SYMBOL:', {
      symbolId: currentSymbol.id,
      symbolName: currentSymbol.name,
      currentType: currentSymbol.gameSymbolType,
      currentContentType: currentSymbol.contentType
    });

    setIsGenerating(true);

    // Use the override contentType from radio buttons, or fall back to symbol's original type
    const targetContentType = contentType || currentSymbol.contentType;

    console.log('🎨 Generating symbol with config:', {
      symbolType,
      contentType: targetContentType,
      size,
      prompt,
      animationComplexity,
      originalSymbolType: currentSymbol.contentType,
      overrideType: contentType
    });
    console.log('📋 Selection details:', {
      symbolType: symbolType === 'contour' ? 'Contour (custom shape)' : 'Block (full square)',
      contentType: targetContentType.startsWith('symbol-') && targetContentType !== 'symbol-only' ?
        `Symbol + ${targetContentType.split('-')[1].charAt(0).toUpperCase() + targetContentType.split('-')[1].slice(1)}` :
        targetContentType === 'symbol-only' ? 'Symbol Only' : 'Text Only',
      animationComplexity: animationComplexity,
      isOverride: contentType !== currentSymbol.contentType
    });

    try {
      // Build ANIMATION-AWARE SLOT SYMBOL prompt
      let enhancedPrompt = '';

      // === QUALITY & STYLE FOUNDATION ===
      enhancedPrompt += 'Create a PREMIUM casino slot machine symbol with PROFESSIONAL QUALITY. ';
      enhancedPrompt += 'Ultra-high resolution, crisp details, vibrant colors, perfect for high-end slot games. ';

      // === ANIMATION REQUIREMENTS ===
      if (animationComplexity === 'complex') {
        enhancedPrompt += 'ANIMATION DESIGN: Design with COMPLEX ANIMATION in mind. ';
        if (contentType.includes('text')) {
          enhancedPrompt += 'Letters must be clearly separated and individually animatable for wave, wobble, and zoom effects. ';
        }
        enhancedPrompt += 'Include multiple distinct elements that can move independently: ';
        enhancedPrompt += 'sparkle points, animated features (like blinking eyes for characters), floating particles, ';
        enhancedPrompt += 'rotating elements, pulsing glows, or moving appendages. ';
      } else if (animationComplexity === 'medium') {
        enhancedPrompt += 'ANIMATION DESIGN: Design for MODERATE ANIMATION effects. ';
        if (contentType.includes('text')) {
          enhancedPrompt += 'Text letters should be cleanly separated for basic bounce and glow animations. ';
        }
        enhancedPrompt += 'Include some animatable elements like glow effects, subtle sparkles, or gentle movement parts. ';
      } else {
        enhancedPrompt += 'ANIMATION DESIGN: Design for SIMPLE ANIMATION effects like glow, pulse, and scale. ';
        if (contentType.includes('text')) {
          enhancedPrompt += 'Text should be clear and readable with good contrast for glow effects. ';
        }
      }

      // Detect style preferences
      const styleKeywords = prompt.toLowerCase();

      if (styleKeywords.includes('gem') || styleKeywords.includes('diamond') || styleKeywords.includes('jewel')) {
        enhancedPrompt += 'STYLE: Luxurious gemstone with brilliant cut facets, prismatic light reflections, and crystalline clarity. ';
        enhancedPrompt += 'Rich, saturated colors with diamond-like sparkle effects. ';
        if (animationComplexity === 'complex') {
          enhancedPrompt += 'Multiple facet planes for independent sparkle animations. ';
        }
      } else if (styleKeywords.includes('character') || styleKeywords.includes('person') || styleKeywords.includes('face')) {
        enhancedPrompt += 'STYLE: Character design with clean, defined features. ';
        if (animationComplexity === 'complex') {
          enhancedPrompt += 'Eyes designed for blinking animation, mouth for expression changes, hair or accessories for movement. ';
        }
      } else if (styleKeywords.includes('wild') || styleKeywords.includes('scatter') || styleKeywords.includes('bonus')) {
        enhancedPrompt += 'STYLE: Bold, attention-grabbing special symbol design. ';
        if (animationComplexity === 'complex') {
          enhancedPrompt += 'Multiple layers for dramatic animation effects: background glow, foreground sparkles, text that can move independently. ';
        }
      } else if (styleKeywords.includes('gold') || styleKeywords.includes('treasure') || styleKeywords.includes('coin')) {
        enhancedPrompt += 'STYLE: Polished gold with mirror-like reflections, ornate details, and royal elegance. ';
        enhancedPrompt += 'Warm golden tones with metallic luster and embossed textures. ';
      } else if (styleKeywords.includes('fruit') || styleKeywords.includes('cherry') || styleKeywords.includes('lemon')) {
        enhancedPrompt += 'STYLE: Fresh, juicy fruit with realistic textures, vibrant natural colors, and appealing shine. ';
        enhancedPrompt += 'Photorealistic quality with perfect lighting and organic forms. ';
      } else {
        enhancedPrompt += 'STYLE: Professional casino symbol with bold, iconic design and premium finish. ';
        enhancedPrompt += 'Rich colors, perfect symmetry, and eye-catching visual appeal. ';
      }

      // === CLEAN USER PROMPT (remove redundant selections) ===
      let cleanedPrompt = prompt.trim();

      // Remove redundant text that's already specified by radio buttons
      const redundantTerms = [
        /\b(contour|block|square)\b/gi,
        /\b(symbol only|symbol-only|text only|text-only|symbol text|symbol-text|symbol wild|symbol scatter|symbol bonus|symbol free|symbol jackpot)\b/gi,
        /\b(simple|medium|complex) animation\b/gi,
        /\b(1x1|1x3|2x2|3x3|4x4) grid\b/gi,
        /\bsprite sheet\b/gi,
        /\bhorizontal layout\b/gi,
        // CRITICAL: Remove text instructions when symbol-text is selected
        /\band the text\s*["']?\s*\w+\s*["']?/gi,
        /\bwith text\s*["']?\s*\w+\s*["']?/gi,
        /\bwith the word\s*["']?\s*\w+\s*["']?/gi,
        /\btext\s*["']?\s*(wild|scatter|bonus|free)\s*["']?/gi,
        /\bthe word\s*["']?\s*(wild|scatter|bonus|free)\s*["']?/gi
      ];

      redundantTerms.forEach(term => {
        cleanedPrompt = cleanedPrompt.replace(term, '');
      });

      // Clean up extra spaces
      cleanedPrompt = cleanedPrompt.replace(/\s+/g, ' ').trim();

      console.log(`🧹 Cleaned prompt: "${prompt}" → "${cleanedPrompt}"`);

      // === SPECIFIC CONTENT REQUEST ===
      enhancedPrompt += `SUBJECT: ${cleanedPrompt}. `;

      // === SYMBOL TYPE INTEGRATION ===
      if (symbolType === 'contour') {
        enhancedPrompt += 'SHAPE: Custom contour shape that follows the natural outline of the subject. ';
        enhancedPrompt += 'Transparent background with organic, flowing edges that match the content perfectly. ';
      } else {
        enhancedPrompt += 'SHAPE: Full square format with complete background fill. ';
        enhancedPrompt += 'Professional block design suitable for standard slot machine grid layout. ';
      }

      // === SIZE INTEGRATION ===
      const sizeInstructions = {
        '1x1': 'Standard single-cell symbol for 1x1 grid placement.',
        '1x3': 'Tall vertical symbol designed for 1x3 grid spanning multiple rows.',
        '2x2': 'Large square symbol for 2x2 grid placement with prominent display.',
        '3x3': 'Extra large symbol for 3x3 grid with maximum visual impact.',
        '4x4': 'Mega symbol for 4x4 grid placement with premium presence.'
      };
      enhancedPrompt += `SIZE: ${sizeInstructions[size]} `;

      // === SIMPLIFIED SAFE ZONE LAYOUT ===
      // Get word-specific configuration based on content type
      const getWordConfig = (contentType: string) => {
        switch (contentType) {
          case 'symbol-wild':
            return { word: 'WILD', letters: ['W', 'I', 'L', 'D'], totalSprites: 5 };
          case 'symbol-scatter':
            return { word: 'SCATTER', letters: ['S', 'C', 'A', 'T', 'T', 'E', 'R'], totalSprites: 8 };
          case 'symbol-bonus':
            return { word: 'BONUS', letters: ['B', 'O', 'N', 'U', 'S'], totalSprites: 6 };
          case 'symbol-free':
            return { word: 'FREE', letters: ['F', 'R', 'E', 'E'], totalSprites: 5 };
          case 'symbol-jackpot':
            return { word: 'JACKPOT', letters: ['J', 'A', 'C', 'K', 'P', 'O', 'T'], totalSprites: 8 };
          default:
            // Fallback to prompt analysis for custom text
            const textMatch = prompt.match(/["']\s*([A-Z]+)\s*["']/i) ||
              prompt.match(/text\s+["']?\s*([A-Z]+)\s*["']?/i) ||
              prompt.match(/\b(wild|scatter|bonus|free|jackpot|mega|super|big|win|trigger)\b/i);
            const detectedText = textMatch ? textMatch[1].toUpperCase() : 'WILD';
            const letters = [...new Set(detectedText.split(''))];
            return { word: detectedText, letters, totalSprites: letters.length + 1 };
        }
      };

      const wordConfig = getWordConfig(targetContentType);
      const { word: detectedText, letters, totalSprites } = wordConfig;

      console.log(`🎯 Word-specific configuration: "${detectedText}" → ${letters.length} letters (${letters.join(', ')}) + 1 symbol = ${totalSprites} total sprites`);
      console.log(`📐 Using layout template: ${selectedLayoutTemplate}`);

      if (targetContentType.startsWith('symbol-') && targetContentType !== 'symbol-only') {
        // Word-specific optimized prompts
        enhancedPrompt += `WORD-SPECIFIC LAYOUT FOR "${detectedText}": Create exactly ${totalSprites} COMPLETELY ISOLATED ELEMENTS optimized for ${detectedText} casino symbol. `;

        // Layout template-specific instructions
        let layoutInstructions = '';
        switch (selectedLayoutTemplate) {
          case 'text-top':
            layoutInstructions = `PRECISE LAYOUT STRUCTURE:
            TOP ROW: Place ALL ${letters.length} letters "${letters.join(' ')}" in a single horizontal line across the top with MASSIVE spacing between each letter (at least 100 pixels apart). ${letters.includes('I') ? 'SPECIAL ATTENTION: Make the letter "I" highly visible with bold styling, clear serifs, or distinctive vertical lines. Do NOT skip or omit the "I" letter.' : ''}
            BOTTOM AREA: Place the main ${cleanedPrompt} symbol in the bottom center, COMPLETELY SEPARATE from all letters with huge empty space above it.
            `;
            break;
          case 'text-bottom':
            layoutInstructions = `PRECISE LAYOUT STRUCTURE:
            TOP AREA: Place the main ${cleanedPrompt} symbol in the top center, taking up the upper portion of the image.
            BOTTOM ROW: Place ALL ${letters.length} letters "${letters.join(' ')}" in a single horizontal line across the bottom with MASSIVE spacing between each letter (at least 100 pixels apart). ${letters.includes('I') ? 'SPECIAL ATTENTION: Make the letter "I" highly visible with bold styling, clear serifs, or distinctive vertical lines. Do NOT skip or omit the "I" letter.' : ''}
            SEPARATION: Ensure HUGE empty space between the symbol and the letter row.
            `;
            break;
          case 'text-overlay':
            layoutInstructions = `PRECISE LAYOUT STRUCTURE:
            BACKGROUND: Place the main ${cleanedPrompt} symbol as a large background element covering most of the image.
            OVERLAY TEXT: Place ALL ${letters.length} letters "${letters.join(' ')}" overlaid on top of the symbol in the center area with MASSIVE spacing between each letter (at least 100 pixels apart). ${letters.includes('I') ? 'SPECIAL ATTENTION: Make the letter "I" highly visible with bold styling, clear serifs, or distinctive vertical lines. Do NOT skip or omit the "I" letter.' : ''}
            CONTRAST: Ensure letters have strong contrast against the background symbol (use outline, shadow, or contrasting colors for readability).
            `;
            break;
          default:
            // Fallback to text-bottom as default
            layoutInstructions = `PRECISE LAYOUT STRUCTURE:
            TOP AREA: Place the main ${cleanedPrompt} symbol in the top center, taking up the upper portion of the image.
            BOTTOM ROW: Place ALL ${letters.length} letters "${letters.join(' ')}" in a single horizontal line across the bottom with MASSIVE spacing between each letter (at least 100 pixels apart). ${letters.includes('I') ? 'SPECIAL ATTENTION: Make the letter "I" highly visible with bold styling, clear serifs, or distinctive vertical lines. Do NOT skip or omit the "I" letter.' : ''}
            SEPARATION: Ensure HUGE empty space between the symbol and the letter row.
            `;
        }
        enhancedPrompt += layoutInstructions;

        // Word-specific requirements
        if (detectedText === 'SCATTER') {
          enhancedPrompt += `SCATTER-SPECIFIC: Ensure both T letters are clearly distinct and separated. Total 7 letters: S-C-A-T-T-E-R + 1 main symbol = 8 elements. `;
        } else if (detectedText === 'JACKPOT') {
          enhancedPrompt += `JACKPOT-SPECIFIC: Ensure all 7 letters J-A-C-K-P-O-T are clearly separated + 1 main symbol = 8 elements. `;
        } else if (detectedText === 'BONUS') {
          enhancedPrompt += `BONUS-SPECIFIC: Ensure all 5 letters B-O-N-U-S are clearly separated + 1 main symbol = 6 elements. `;
        } else if (detectedText === 'WILD') {
          enhancedPrompt += `WILD-SPECIFIC: Ensure all 4 letters W-I-L-D are clearly separated + 1 main symbol = 5 elements. CRITICAL: The letter "I" must be clearly visible and not missing. Make the "I" letter bold and distinct with serifs or vertical lines to ensure visibility. `;
        } else if (detectedText === 'FREE') {
          enhancedPrompt += `FREE-SPECIFIC: Ensure both E letters are clearly distinct. Total 4 letters: F-R-E-E + 1 main symbol = 5 elements. `;
        }

        enhancedPrompt += `SPACING REQUIREMENTS: Use ENORMOUS empty space between letters and between the letter row and main symbol. Each element must be in its own isolated rectangular area that can be easily cut out. `;
        enhancedPrompt += `ISOLATION REQUIREMENTS: Each element must be COMPLETELY SEPARATE with NO overlapping, NO connecting lines, NO shared elements. Think of each element as being in its own invisible rectangular box for easy cutting. `;
        enhancedPrompt += `CUTTING-FRIENDLY DESIGN: Design the layout so that each element (letters and symbol) can be easily extracted by drawing a rectangle around it without including parts of other elements. `;
        enhancedPrompt += `VERIFICATION: You MUST create exactly ${totalSprites} separate elements: ${letters.join(', ')}, and main symbol. Each must be completely isolated with large empty space around it for clean sprite extraction. `;

        console.log(`🎯 ${detectedText}-specific layout: ${letters.length} letters + 1 symbol = ${totalSprites} total elements`);
      } else if (targetContentType === 'text-only') {
        enhancedPrompt += 'LAYOUT: Large, bold letters spread across the image with clear spacing between each letter. ';
      } else {
        enhancedPrompt += 'LAYOUT: Single centered symbol taking up most of the space. ';
      }

      // === SIMPLE QUALITY REQUIREMENTS ===
      enhancedPrompt += 'High quality, transparent background, crisp details, bright colors suitable for casino slot games. ';
      if (targetContentType.startsWith('symbol-') && targetContentType !== 'symbol-only') {
        const verificationText = letters.includes('I') ?
          `FINAL VERIFICATION CHECKLIST: 1) Exactly ${totalSprites} separate elements visible, 2) Each letter ${letters.join('-')} in its own isolated area (ESPECIALLY the "I" letter which must be clearly visible), 3) Main symbol completely separate from all letters, 4) No touching or connecting elements, 5) Large transparent gaps between all elements. CRITICAL: Do not skip the "I" letter - it must be present and visible. FAILURE TO MEET ALL 5 REQUIREMENTS WILL RESULT IN REJECTION. ` :
          `FINAL VERIFICATION CHECKLIST: 1) Exactly ${totalSprites} separate elements visible, 2) Each letter ${letters.join('-')} in its own isolated area, 3) Main symbol completely separate from all letters, 4) No touching or connecting elements, 5) Large transparent gaps between all elements. FAILURE TO MEET ALL 5 REQUIREMENTS WILL RESULT IN REJECTION. `;
        enhancedPrompt += verificationText;
      }

      console.log('🎨 ENHANCED PROMPT:', enhancedPrompt);
      console.log('📏 Prompt length:', enhancedPrompt.length, 'characters');
      console.log('🔧 INTEGRATION SUMMARY:', {
        originalPrompt: prompt,
        cleanedPrompt: cleanedPrompt,
        symbolType: symbolType,
        contentType: contentType,
        size: size,
        animationComplexity: animationComplexity,
        layoutTemplate: selectedLayoutTemplate,
        canvasSize: '1024x1024',
        spacingStrategy: 'EXTREME_SEPARATION',
        promptReduction: `${prompt.length} → ${cleanedPrompt.length} chars`
      });

      let imageUrl: string;

      console.log('🚀 CALLING API: gpt-image-1 generation starting...');
      console.log('⏳ This may take 30-120 seconds for complex prompts...');

      // Call working GPT image generation (same as Step 4) - SINGLE IMAGE WITH TEXT
      const response = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: enhancedPrompt,
        targetSymbolId: currentSymbol.id,
        gameId: 'animationlab'
      });

      console.log('✅ API RESPONSE RECEIVED:', { success: response.success, hasImages: !!response.images });

      if (response.success && response.images && response.images.length > 0) {
        imageUrl = response.images[0];
        console.log('✅ SINGLE IMAGE: Generated image with text for sprite cutting');
      } else {
        throw new Error(response.error || 'Image generation failed');
      }

        // Update the existing symbol instead of creating a new one
        const updatedSymbol: SymbolConfig = {
          ...currentSymbol,
          symbolType,
          contentType: targetContentType, // Update with the target content type
          size,
          prompt,
          animationComplexity,
          layoutTemplate: selectedLayoutTemplate, // Save the selected layout template
          imageUrl: imageUrl,
          retryCount: 0, // Reset retry attempts
          // Clear previous processing results to trigger fresh analysis
          spriteElements: undefined,
          atlasResult: undefined,
          isVisionProcessed: false,
          isUniversalProcessed: false,
          templateExtracted: undefined,
          letterSprites: undefined,
          lastRefresh: Date.now()
        };

        // Update both symbols arrays
        setSymbols(prev => {
          const newSymbols = prev.map(s => s.id === currentSymbol.id ? updatedSymbol : s);

          // Get all symbol URLs for the preview (including the newly updated one)
          const allSymbolUrls = newSymbols.map(s => s.imageUrl).filter((url): url is string => Boolean(url));

          // Update game store with all symbols
          if (allSymbolUrls.length > 0) {
            const currentConfig = useGameStore.getState().config;
            updateConfig({
              theme: {
                ...currentConfig?.theme,
                generated: {
                  ...currentConfig?.theme?.generated,
                  symbols: allSymbolUrls
                }
              }
            });
          }

          // Dispatch symbolsChanged event with ALL generated symbols for preview
          const symbolsChangedEvent = new CustomEvent('symbolsChanged', {
            detail: {
              symbols: allSymbolUrls, // Send ALL symbol URLs, not just the updated one
              gameId: gameId,
              source: 'animation-lab-generation',
              updatedSymbol: updatedSymbol,
              forceRefresh: true, // Force texture cache refresh to show new symbols
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(symbolsChangedEvent);
          console.log('📡 Dispatched symbolsChanged event with all symbols:', allSymbolUrls.length);

          // Save to storage immediately after updating state
          setTimeout(() => {
            saveSymbolsToStorage(newSymbols);
            // Also sync with GameStore using enhanced sync function
            syncSymbolsWithGameStore(newSymbols);
          }, 0);
          return newSymbols;
        });

        setPresetSymbols(prev => {
          return prev.map(s => s.id === currentSymbol.id ? updatedSymbol : s);
        });

        console.log('✅ Symbol sprite sheet updated:', updatedSymbol);

        // ENHANCED SPRITE CUTTING - Use advanced detection for better letter separation
        (async () => {
          try {
            console.log('🎯 ENHANCED SPRITE CUTTING: Using advanced detection for text symbols...');
            setIsProcessing(true);

            // Extract text from prompt for expected content analysis
            const textMatch = prompt.match(/["']([A-Z]+)["']/i) || prompt.match(/\b(wild|scatter|bonus|free|jackpot|mega|super|big|win)\b/i);
            const expectedText = textMatch ? textMatch[1].toUpperCase() : 'WILD';
            // Get unique letters only (no duplicates for sprite detection)
            const expectedLetters = [...new Set(expectedText.split(''))];

            console.log(`🎯 Expected content: ${expectedText} (${expectedLetters.length} letters + 1 main symbol)`);

            // ENHANCED DETECTION: Use optimized settings for better text symbol cutting
            const detectionSettings = getEnhancedDetectionSettings(expectedText, targetContentType);
            console.log('🔧 Using enhanced detection settings:', detectionSettings);

            const universalResult = await detectSpritesUniversal(imageUrl, detectionSettings);

            console.log(`🎯 ENHANCED CUTTING: Universal detection result:`, universalResult);

            if (universalResult && universalResult.length > 0) {
              console.log('🎯 CUTTING SUCCESS! Enhanced boundaries detected. Processing sprite elements...');

              // Convert universal detection results to sprite elements with enhanced letter identification
              const spriteElements = universalResult.map((sprite, index) => {
                // Try to identify if this sprite is a letter based on its characteristics
                let identifiedLetter = '';
                let spriteType = sprite.type;

                // Enhanced letter identification for text symbols
                if (targetContentType.startsWith('symbol-') && targetContentType !== 'symbol-only') {
                  if (sprite.type === 'letter' || (sprite.density > 0.3 && sprite.pixels < 5000)) {
                    // This looks like a letter - try to identify which one
                    const letterIndex = Math.floor(index / 2); // Rough estimation
                    if (letterIndex < expectedLetters.length) {
                      identifiedLetter = expectedLetters[letterIndex];
                      spriteType = 'letter';
                    }
                  } else if (sprite.pixels > 10000 || sprite.type === 'symbol') {
                    // This looks like the main symbol
                    spriteType = 'symbol';
                  }
                }

                return {
                  id: sprite.id,
                  src: sprite.imageData,
                  x: sprite.bounds.x,
                  y: sprite.bounds.y,
                  width: sprite.bounds.width,
                  height: sprite.bounds.height,
                  name: spriteType === 'symbol' ? 'Main Symbol' :
                        identifiedLetter ? `Letter ${identifiedLetter}` : `sprite_${index + 1}`,
                  description: spriteType === 'symbol' ? 'Main symbol element' :
                              identifiedLetter ? `Letter "${identifiedLetter}"` : `Detected ${sprite.type} sprite`,
                  bounds: {
                    x: (sprite.bounds.x / 1024) * 100,      // Convert to percentage
                    y: (sprite.bounds.y / 1024) * 100,
                    width: (sprite.bounds.width / 1024) * 100,
                    height: (sprite.bounds.height / 1024) * 100
                  },
                  zIndex: spriteType === 'symbol' ? 3 : 5,
                  animationPotential: 'high' as const,
                  type: (spriteType === 'object' || spriteType === 'decoration' || spriteType === 'unknown') ? 'element' : spriteType as 'symbol' | 'letter' | 'element',
                  identifiedLetter: identifiedLetter || undefined,
                  imageUrl: sprite.imageData, // Individual sprite image for animation
                  pixels: sprite.pixels,
                  density: sprite.density,
                  confidence: sprite.confidence
                };
              });

              console.log(`✅ ENHANCED CUTTING: Processed ${spriteElements.length} sprite elements`);
              spriteElements.forEach((sprite, i) => {
                console.log(`   ${i + 1}. ${sprite.name} (${sprite.type}) - bounds: ${sprite.bounds.x.toFixed(1)}%, ${sprite.bounds.y.toFixed(1)}%, ${sprite.bounds.width.toFixed(1)}%x${sprite.bounds.height.toFixed(1)}%`);
              });

              // Update symbol with enhanced cutting results
              handleSymbolUpdate(updatedSymbol.id, {
                spriteElements,
                atlasResult: {
                  success: true,
                  spriteElements,
                  atlasImageUrl: imageUrl,
                  atlasMetadata: {
                    generationMethod: 'enhanced-cutting',
                    expectedText: expectedText,
                    detectedSprites: spriteElements.length
                  }
                },
                isVisionProcessed: true,
                isUniversalProcessed: true,
                templateExtracted: true,
                lastRefresh: Date.now()
              });

              console.log('✅ ENHANCED CUTTING: Sprite extraction complete!');

              // Enhanced sprites are automatically loaded by the workspace effect
              setTimeout(() => {
                console.log('🔄 Enhanced cutting complete - sprites should be visible');
                setIsProcessing(false);
              }, 100);

              console.log('✅ ENHANCED CUTTING: Processing complete');
            } else {
              console.error('❌ Enhanced cutting failed: Found 0 sprites');
              console.warn('🔄 FALLBACK: Will use template system instead');

              // Don't throw error - let it fall back to template system
              setIsProcessing(false);
              return; // Exit the enhanced cutting block, let template system handle it
            }
          } catch (error) {
            console.error('❌ ENHANCED CUTTING failed:', error);
            console.warn('🔄 FALLBACK: Enhanced cutting failed, template system will handle sprite extraction');
          } finally {
            setIsProcessing(false);
          }
        })();
    } catch (error) {
      console.error('❌ Symbol generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Symbol generation failed: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, symbolType, contentType, size, animationComplexity, nextSymbolId, handleSymbolUpdate]);

  const handleSymbolSelect = useCallback((symbolId: string) => {
    setSelectedSymbolId(symbolId);
    // Find the index in preset symbols if we're using presets
    if (presetSymbols.length > 0) {
      const index = presetSymbols.findIndex(s => s.id === symbolId);
      if (index >= 0) {
        setCurrentSymbolIndex(index);
      }
    }
  }, [presetSymbols]);

  const handleSymbolDelete = useCallback((symbolId: string) => {
    setSymbols(prev => {
      const newSymbols = prev.filter(s => s.id !== symbolId);
      // Save to storage immediately after deletion
      setTimeout(() => saveSymbolsToStorage(newSymbols), 0);
      return newSymbols;
    });
    if (selectedSymbolId === symbolId) {
      setSelectedSymbolId(null);
    }
  }, [selectedSymbolId, saveSymbolsToStorage]);

  const handleIndividualizeText = useCallback(async () => {
    if (!selectedSymbol?.imageUrl) {
      console.log('❌ No selected symbol or image URL');
      return;
    }

    // IMMEDIATE MUTEX CHECK: If template extraction is running, don't start
    if (processingMutex.current.locked && processingMutex.current.currentOperation === 'template-extraction') {
      console.log('🚫 BLOCKED: Universal detection blocked - template extraction in progress');
      return;
    }

    // BULLETPROOF PROTECTION: Multiple layers to prevent overwriting template results
    // Calculate expected sprites based on content type
    let expectedSprites = 1; // Default for symbol-only
    if (selectedSymbol.contentType?.startsWith('symbol-') && selectedSymbol.contentType !== 'symbol-only') {
      const getWordConfig = (contentType: string) => {
        switch (contentType) {
          case 'symbol-wild': return 5;     // 4 letters + 1 symbol
          case 'symbol-scatter': return 8;  // 7 letters + 1 symbol  
          case 'symbol-bonus': return 6;    // 5 letters + 1 symbol
          case 'symbol-free': return 5;     // 4 letters + 1 symbol
          case 'symbol-jackpot': return 8;  // 7 letters + 1 symbol
          default: return 6; // fallback
        }
      };
      expectedSprites = getWordConfig(selectedSymbol.contentType);
    }
    const hasValidSprites = selectedSymbol.spriteElements && selectedSymbol.spriteElements.length >= expectedSprites;
    const hasTemplateSprites = selectedSymbol.spriteElements && selectedSymbol.spriteElements.some(s => s.id.includes('template'));
    const wasTemplateProcessed = selectedSymbol.isVisionProcessed || hasTemplateSprites || selectedSymbol.templateExtracted;

    // ABSOLUTE BLOCKING CONDITIONS - ANY of these means template extraction succeeded
    if (selectedSymbol.isVisionProcessed ||
      selectedSymbol.isUniversalProcessed ||
      selectedSymbol.templateExtracted ||
      hasValidSprites ||
      hasTemplateSprites ||
      wasTemplateProcessed) {
      console.log('🚫 ABSOLUTE BLOCK - Template extraction succeeded, universal detection FORBIDDEN!', {
        isVisionProcessed: selectedSymbol.isVisionProcessed,
        isUniversalProcessed: selectedSymbol.isUniversalProcessed,
        templateExtracted: selectedSymbol.templateExtracted,
        spriteCount: selectedSymbol.spriteElements?.length || 0,
        expectedSprites: expectedSprites,
        hasTemplateSprites: hasTemplateSprites,
        wasTemplateProcessed: wasTemplateProcessed,
        templateSpriteIds: selectedSymbol.spriteElements?.filter(s => s.id.includes('template')).map(s => s.id) || [],
        reason: selectedSymbol.templateExtracted ? 'template-extraction-flag' : hasTemplateSprites ? 'template-sprites-exist' : hasValidSprites ? 'sufficient-sprites' : 'flags-set'
      });
      return;
    }

    if (isProcessing) {
      console.log('⏸️ Already processing, skipping manual trigger');
      return;
    }

    // 🔒 MUTEX PROTECTION: Lock universal detection to prevent conflicts
    if (!processingMutex.current.lock('universal-detection')) {
      return; // Another operation is in progress, skip
    }

    setIsProcessing(true);
    console.log('📝 Starting universal sprite detection for:', selectedSymbol.name);

    try {
      // Use universal detector for any content type with settings optimized for decorated symbols
      const detectedSprites = await detectSpritesUniversal(
        selectedSymbol.imageUrl,
        {
          minSpriteSize: 50,      // Catch even small letters
          maxSpriteSize: 200000,  // Allow large symbols
          separationThreshold: 2, // Even smaller separation to capture decorative borders
          noiseFilter: false,     // Don't filter noise to capture golden borders
          mergeThreshold: 5,      // Larger merge to include decorative elements as part of main symbol
          confidenceThreshold: 0.05, // More permissive to include border elements
          includeTransparentBorders: true // Capture semi-transparent decorative borders
        }
      );

      console.log(`🎯 Universal detection found ${detectedSprites.length} sprites:`, detectedSprites);

      if (detectedSprites.length > 0) {
        // Don't validate/filter sprites - show ALL detected sprites to preserve duplicates and ensure symbol is included
        console.log(`🎯 Showing ALL detected sprites without filtering to preserve duplicates like multiple T's in SCATTER`);
        const validatedSprites = detectedSprites; // Show all detected sprites

        // ENHANCED: Identify letters immediately during creation
        console.log('🏷️ Starting immediate letter identification during sprite creation...');
        const letterMapping = await identifyLettersDuringCreation(
          selectedSymbol.imageUrl,
          validatedSprites,
          'BONUS'
        );

        // Convert to sprite elements format with letter-based naming
        const spriteElements = validatedSprites.map((sprite, index) => {
          console.log(`🔍 Universal sprite ${index}: bounds(${sprite.bounds.x},${sprite.bounds.y},${sprite.bounds.width}x${sprite.bounds.height}) type=${sprite.type} pixels=${sprite.pixels}`);

          // Create letter-based ID if letter was identified
          let finalId = sprite.id;
          let finalName = `${sprite.type}_${index}`;

          if (sprite.type === 'letter' && letterMapping[sprite.id]) {
            const identifiedLetter = letterMapping[sprite.id];
            finalId = `${sprite.id.split('_')[0]}_${identifiedLetter}`;  // e.g., "bulletproof_B"
            finalName = `Letter_${identifiedLetter}`;
            console.log(`🏷️ ✅ Renamed sprite: ${sprite.id} → ${finalId} (letter: ${identifiedLetter})`);
          }

          return {
            id: finalId,
            name: finalName,
            bounds: sprite.bounds, // These are pixel coordinates from universalSpriteDetector
            imageUrl: sprite.imageData,
            confidence: sprite.confidence,
            type: sprite.type,
            pixels: sprite.pixels,
            density: sprite.density,
            letter: sprite.type === 'letter' ? letterMapping[sprite.id] || `Letter_${index}` : undefined,
            identifiedLetter: letterMapping[sprite.id] || undefined // Store the identified letter
          };
        });

        // Update symbol with universal detection results
        handleSymbolUpdate(selectedSymbol.id, {
          spriteElements,
          universalDetection: {
            totalSprites: detectedSprites.length,
            sprites: detectedSprites
          },
          isTextAnimationReady: true,
          isUniversalProcessed: true, // Prevent re-running universal detection
          templateExtracted: false    // Mark that this is NOT from template extraction
        });

        console.log('✅ Universal detection complete - sprites ready for animation');
        // Removed alert to prevent infinite loop - results visible in workspace
      } else {
        alert('No sprites detected - the image may be too simple or have connectivity issues.');
      }
    } catch (error) {
      console.error('❌ Universal sprite detection failed:', error);
      alert('Sprite detection failed');
    } finally {
      setIsProcessing(false);
      processingMutex.current.unlock();
    }
  }, [selectedSymbol, handleSymbolUpdate, setIsProcessing]);

  const handleSave = useCallback(() => {
    if (!selectedSymbol) return;

    // Save to localStorage for persistence
    const savedSymbols = JSON.parse(localStorage.getItem('animation-lab-symbols') || '[]');
    const updatedSymbols = [...savedSymbols.filter((s: any) => s.id !== selectedSymbol.id), selectedSymbol];
    localStorage.setItem('animation-lab-symbols', JSON.stringify(updatedSymbols));

    console.log('💾 Saving symbol:', selectedSymbol.name);
    alert(`Symbol "${selectedSymbol.name}" saved successfully!`);
  }, [selectedSymbol]);

  // Animation Handlers
  const handlePlay = useCallback(() => {
    if (!selectedSymbol) return;

    setIsPlaying(true);
    console.log('▶️ Starting animation for:', selectedSymbol.name);

    // If an animation template is selected, resume GSAP animations
    if (selectedAnimationTemplate) {
      console.log('▶️ Resuming GSAP animation:', selectedAnimationTemplate);
      gsap.globalTimeline.play(); // Resume all GSAP animations
      return;
    }

    // Fallback: Simple bounce animation if no template selected
    const animate = () => {
      setAnimationFrame(prev => {
        const nextFrame = (prev + animationSpeed) % 100;

        setSprites(prevSprites => prevSprites.map(sprite => {
          if (sprite.type === 'letter') {
            const bounceHeight = Math.sin(nextFrame * 0.1) * 8;
            return {
              ...sprite,
              y: sprite.y + bounceHeight * 0.3
            };
          }
          return sprite;
        }));

        return nextFrame;
      });

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [selectedSymbol, animationSpeed, selectedAnimationTemplate, isPlaying]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);

    // Pause GSAP animations if they're running
    if (selectedAnimationTemplate) {
      gsap.globalTimeline.pause();
      console.log('⏸️ GSAP animations paused');
    }

    // Cancel any manual animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    console.log('⏸️ Animation paused');
  }, [selectedAnimationTemplate]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setAnimationFrame(0);

    // Stop GSAP animations safely - only kill animations for this component
    const spriteSelectors = sprites.map(sprite => `#${sprite.id}`).join(',');
    if (spriteSelectors) {
      gsap.killTweensOf(spriteSelectors);
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Reset animation template selection
    setSelectedAnimationTemplate('bounce');

    // Reset sprites to original positions by triggering a refresh
    if (selectedSymbol && isCanvasReady) {
      console.log('🔄 Triggering sprite refresh without clearing selection');
      // Instead of clearing selection, trigger refresh by updating lastRefresh
      const updatedSymbol = { ...selectedSymbol, lastRefresh: Date.now() };
      handleSymbolUpdate(selectedSymbol.id, { lastRefresh: Date.now() });
    }

    console.log('⏹️ Animation stopped and reset');
  }, [selectedSymbol, isCanvasReady]);

  // Frame Seeking Handler
  const handleFrameSeek = useCallback((targetFrame: number) => {
    if (!selectedSymbol) return;

    // Stop current animation if playing
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Set the target frame
    setAnimationFrame(targetFrame);

    // Apply frame-specific animation to sprites
    setSprites(prevSprites => prevSprites.map(sprite => {
      const bounceHeight = Math.sin(targetFrame * 0.1) * 10; // Same calculation as the animation loop
      return {
        ...sprite,
        y: sprite.y + bounceHeight * 0.5 // Apply the frame-specific position
      };
    }));

    console.log('🎯 Seeking to frame:', targetFrame);

    // If animation was playing, restart it from the new frame
    if (isPlaying) {
      setTimeout(() => {
        if (isPlaying) { // Check if still playing after timeout
          const animate = () => {
            setAnimationFrame(prev => {
              const nextFrame = (prev + animationSpeed) % 100;

              setSprites(prevSprites => prevSprites.map(sprite => {
                const bounceHeight = Math.sin(nextFrame * 0.1) * 10;
                return {
                  ...sprite,
                  y: sprite.y + bounceHeight * 0.5
                };
              }));

              return nextFrame;
            });

            animationRef.current = requestAnimationFrame(animate);
          };

          animationRef.current = requestAnimationFrame(animate);
        }
      }, 50);
    }
  }, [selectedSymbol, isPlaying, animationSpeed]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Load saved symbols on mount
  useEffect(() => {
    const savedSymbols = JSON.parse(localStorage.getItem('animation-lab-symbols') || '[]');
    if (savedSymbols.length > 0) {
      setSymbols(savedSymbols);
      setNextSymbolId(Math.max(...savedSymbols.map((s: any) => parseInt(s.id.split('_')[1]) || 0)) + 1);
    }
  }, []);

  return (
    <>
      <div className="animation-lab-container" style={{
        width: '100%'
      }}>

        {/* Direct to Symbol Creation with preset carousel below */}
        <>
          {/* Header with Symbol Carousel */}
          <div className='bg-white rounded-md'
          >
            <div >
              <div className="flex items-center justify-between bg-gray-50 rounded-lg shadow-sm border border-gray-200 mb-">
                <div className="px-4 py-3 flex items-center gap-2 border-gray-200 border-l-4 border-l-red-500 ">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Symbol Creation Lab
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{selectedPreset}</span> preset •
                      <span className="ml-1">{presetSymbols.length} symbols</span>
                      <span className="ml-1">({presetSymbols.filter(s => s.imageUrl).length} generated)</span>
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        GameStore Sync ✓
                      </span>
                    </div>
                    <button
                      onClick={clearAllSymbols}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                      title="Clear all generated symbols from GameStore"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="text-sm bg-gray-50 w-auto text-gray-500 mr-2">
                  Symbol {currentSymbolIndex + 1} of {presetSymbols.length}
                </div>
              </div>
            </div>

            {/* Main Symbol Carousel with improved scrolling */}
            <div className="p-4">
              {/* Preset Selection Carousel - Horizontal under main carousel */}
              <div className="mb-4">
                <div className='border p-2 rounded-md bg-gray-50'>
                <div className="text-sm font-medium text-gray-700 mb-1">Switch Preset:</div>
                <div className="grid grid-cols-2 p- gap-2 ">
                  {PRESET_CONFIGURATIONS.map((preset) => (
                    <div
                      key={preset.name}
                      onClick={() => handlePresetSelection(preset.name)}
                      className={`
                    flex-shrink-0 cursor-pointer rounded-lg border p-2 min-w-[200px] transition-all duration-200
                    hover:shadow-md
                    ${selectedPreset === preset.name
                          ? 'border-red-300 bg-red-50 '
                          : 'border-gray-200 bg-white hover:border-red-200'
                        }
                  `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{preset.name}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {preset.estimatedRTP}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{preset.description}</p>

                      {/* Symbol breakdown */}
                      <div className="flex flex-wrap gap-1">
                        {preset.symbols.map((symbolDef, index) => (
                          <span
                            key={index}
                            className={`text-xs px-1.5 py-0.5 rounded ${symbolDef.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                              symbolDef.rarity === 'epic' ? 'bg-red-100 text-red-800' :
                                symbolDef.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-600'
                              }`}
                          >
                            {symbolDef.count}×{symbolDef.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateToSymbol(currentSymbolIndex - 1)}
                  disabled={currentSymbolIndex === 0}
                  className="flex-shrink-0 p-1 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors 
                         disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>

                <div className="flex-1 overflow-hidden">
                  <div
                    className="symbol-carousel-container flex gap-3 overflow-x-auto scrollbar-hide carousel-scroll py-2"
                  >
                    {presetSymbols.length > 0 ? presetSymbols.map((symbol, index) => (
                      <div
                        key={symbol.id}
                        data-symbol-index={index}
                        className="flex-shrink-0 px-2"
                      >
                        <SymbolCarouselItem
                          symbol={symbol}
                          isSelected={index === currentSymbolIndex}
                          onClick={() => {
                            console.log(`🎯 Clicked symbol ${index}:`, symbol.name, symbol.imageUrl ? 'has image' : 'empty');
                            if (symbol.imageUrl) {
                              // Navigate to existing symbol
                              navigateToSymbol(index);
                            } else {
                              // Handle empty slot selection
                              handleEmptySlotSelection(index);
                            }
                          }}
                          isGenerating={false}
                          progress={0}
                        />
                      </div>
                    )) : (
                      <div className="text-center text-gray-500 py-8">
                        <p>Loading symbols...</p>
                        <p className="text-xs">Symbols: {symbols.length}, Preset: {presetSymbols.length}</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigateToSymbol(currentSymbolIndex + 1)}
                  disabled={currentSymbolIndex === presetSymbols.length - 1}
                  className="flex-shrink-0 p-1 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors 
                         disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
            {/* Main Content */}
            <div className='p-3'>
              {layoutMode === 'creation' ? (
                <div
                  className='bg-gray-50 rounded-md border'
                  style={{
                    padding: '16px 20px'
                  }}>
                  {/* Content for creation mode when preset is selected */}
                  {selectedSymbol && (
                    <div className="text-center p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Creating: {selectedSymbol.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedSymbol.defaultDescription}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: 'white',
                  borderBottom: 'none',
                  padding: '12px 20px',
                }}>
                  <h1 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#e60012',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🎨 Animation Lab 2.0
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      background: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {layoutMode === 'animation' ? 'Symbol Animation' : 'Professional Studio'}
                    </span>
                  </h1>
                </div>
              )}
            </div>
            <div style={{
              flex: layoutMode === 'creation' ? '1' : '0 0 40%',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Step 4 (Creation): Sections 1-4 only */}
              {(layoutMode === 'creation' || layoutMode === 'full') && (
                <>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                    <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                      <h3 className="font-semibold text-gray-900">Symbol Type</h3>
                    </div>
                    <div className='flex items-center justify-center p-2 gap-10'>
                      <div>
                        <label  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            checked={symbolType === 'block'}
                            onChange={() => {
                              console.log('🟡 RADIO CLICKED: Symbol Type changed to BLOCK');
                              setSymbolType('block');
                            }}
                            style={{ accentColor: '#e60012' }}
                          />
                          <span>Block (full square)</span>
                        </label>
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            checked={symbolType === 'contour'}
                            onChange={() => {
                              console.log('🟡 RADIO CLICKED: Symbol Type changed to CONTOUR');
                              setSymbolType('contour');
                            }}
                            style={{ accentColor: '#e60012' }}
                          />
                          <span>Contour (custom shape)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  {/* Selected Symbol Info Display */}
                  <div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                      <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Selected Symbol Info</h3>
                      </div>
                      <div className='p-4'>
                        {selectedSymbol ? (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {selectedSymbol.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Preset Type: {selectedSymbol.contentType === 'symbol-wild' ? 'Wild Symbol' :
                                   selectedSymbol.contentType === 'symbol-scatter' ? 'Scatter Symbol' :
                                   selectedSymbol.contentType === 'symbol-bonus' ? 'Bonus Symbol' :
                                   selectedSymbol.contentType === 'symbol-free' ? 'Free Symbol' :
                                   selectedSymbol.contentType === 'symbol-jackpot' ? 'Jackpot Symbol' :
                                   selectedSymbol.contentType === 'text-only' ? 'Text Only' :
                                   'Symbol Only'}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                              {selectedSymbol.gameSymbolType?.toUpperCase() || 'SYMBOL'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            Select a symbol from the carousel above to see its type
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content Type Override */}
                  <div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                      <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Content Type Override</h3>
                      </div>
                      <div className='p-4'>
                        <div className="mb-3 text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                          💡 Override the content type for the selected symbol. This will change what gets generated.
                          {selectedSymbol && contentType !== selectedSymbol.contentType && (
                            <div className="mt-1 text-orange-700 font-medium">
                              ⚠️ Override active: Will generate {contentType} instead of {selectedSymbol.contentType}
                            </div>
                          )}
                          {selectedSymbol && contentType === selectedSymbol.contentType && (
                            <div className="mt-1 text-green-700 font-medium">
                              ✅ Matches symbol's original type
                            </div>
                          )}
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              checked={contentType === 'symbol-only'}
                              onChange={() => {
                                console.log('🔵 RADIO CLICKED: Content Type changed to SYMBOL-ONLY');
                                setContentType('symbol-only');
                              }}
                              style={{ accentColor: '#e60012' }}
                            />
                            <span>Symbol Only</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              checked={contentType === 'symbol-wild'}
                              onChange={() => {
                                console.log('🔵 RADIO CLICKED: Content Type changed to SYMBOL-WILD');
                                setContentType('symbol-wild');
                              }}
                              style={{ accentColor: '#e60012' }}
                            />
                            <span>Symbol + Wild (4 letters)</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              checked={contentType === 'symbol-scatter'}
                              onChange={() => {
                                console.log('🔵 RADIO CLICKED: Content Type changed to SYMBOL-SCATTER');
                                setContentType('symbol-scatter');
                              }}
                              style={{ accentColor: '#e60012' }}
                            />
                            <span>Symbol + Scatter (7 letters)</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              checked={contentType === 'symbol-bonus'}
                              onChange={() => {
                                console.log('🔵 RADIO CLICKED: Content Type changed to SYMBOL-BONUS');
                                setContentType('symbol-bonus');
                              }}
                              style={{ accentColor: '#e60012' }}
                            />
                            <span>Symbol + Bonus (5 letters)</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              checked={contentType === 'symbol-free'}
                              onChange={() => {
                                console.log('🔵 RADIO CLICKED: Content Type changed to SYMBOL-FREE');
                                setContentType('symbol-free');
                              }}
                              style={{ accentColor: '#e60012' }}
                            />
                            <span>Symbol + Free (4 letters)</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              checked={contentType === 'symbol-jackpot'}
                              onChange={() => {
                                console.log('🔵 RADIO CLICKED: Content Type changed to SYMBOL-JACKPOT');
                                setContentType('symbol-jackpot');
                              }}
                              style={{ accentColor: '#e60012' }}
                            />
                            <span>Symbol + Jackpot (7 letters)</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              checked={contentType === 'text-only'}
                              onChange={() => {
                                console.log('🔵 RADIO CLICKED: Content Type changed to TEXT-ONLY');
                                setContentType('text-only');
                              }}
                              style={{ accentColor: '#e60012' }}
                            />
                            <span>Text Only</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                      <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Grid Presets</h3>
                      </div>
                      <div className='flex items-center justify-center gap-4 py-4'>
                        {(['1x1', '1x3', '2x2', '3x3', '4x4'] as const).map(sizeOption => (
                          <label key={sizeOption} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              checked={size === sizeOption}
                              onChange={() => setSize(sizeOption)}
                              style={{ accentColor: '#e60012' }}
                            />
                            <span>{sizeOption}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Visual Group Separator - Main Action */}
                  {/* <div style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      background: 'linear-gradient(135deg,rgb(234, 8, 27) 0%, #dc2626 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      MAIN ACTION
                    </span>
                  </div> */}
                  {/* Layout Template  */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                    <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                      <h3 className="font-semibold text-gray-900">Layout Templates</h3>
                    </div>
                    <div className='text-gray-800 items-center flex justify-center' style={{
                      marginBottom: '12px',
                      padding: '8px',
                      // background: '#e0f2fe',
                      borderRadius: '4px',
                      fontSize: '12px',
                      // color: '#0369a1'
                    }}>
                      💡 Choose how text and symbols are arranged in your symbol
                    </div>
                    <div className='flex flex-wrap gap-2 p-4 pt-0'>
                      {LAYOUT_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          onClick={() => applyLayoutTemplate(template.id)}
                          className={`
                    flex items-center gap-1 w-ful cursor-pointer rounded-lg border p-1 min-w-[200px] transition-all duration-200
                    hover:shadow-md
                    ${selectedLayoutTemplate === template.id
                          ? 'border-red-300 bg-red-50 border'
                          : 'border-gray-200 bg-white hover:border-red-200'
                        }
                  `}
                          style={{
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span style={{ fontSize: '12px' }}>{template.icon}</span>
                          <div>
                            <div style={{ fontWeight: '400', color: '#374151' }}>{template.name}</div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>{template.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                    <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                      <h3 className="font-semibold text-gray-900">Symbol Prompt</h3>
                    </div>
                    <div className="p-4">
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the symbol you want to create..."
                        className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none"
                      />
                      <Button
                        variant='generate'
                        onClick={handleGenerateSymbol}
                        className='w-full'
                        disabled={isGenerating || !prompt.trim()}

                      >
                        {isGenerating ? (
                                            <>
                                              <Loader className="w-5 h-5 animate-spin" />
                                              Generating...
                                            </>
                                          ) : (
                                            <>
                                              <Sparkles className="w-5 h-5" />
                                              Generate
                                            </>
                                          )}

                      </Button>
                    </div>
                  </div>
                  
                </>
              )}

              {/* Step 5 (Animation): Sections 5-8 only */}
              {(layoutMode === 'animation' || layoutMode === 'full') && (
                <>
                  <CollapsibleSection
                    title="5. Animation Complexity"
                    isExpanded={expandedSections.animation}
                    onToggle={() => toggleSection('animation')}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={animationComplexity === 'simple'}
                          onChange={() => setAnimationComplexity('simple')}
                          style={{ accentColor: '#e60012', marginTop: '2px' }}
                        />
                        <div>
                          <div style={{ fontWeight: '500' }}>Simple</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Glow, bounce, scale - fast and easy</div>
                        </div>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={animationComplexity === 'medium'}
                          onChange={() => setAnimationComplexity('medium')}
                          style={{ accentColor: '#e60012', marginTop: '2px' }}
                        />
                        <div>
                          <div style={{ fontWeight: '500' }}>Medium</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Text effects, layered animations</div>
                        </div>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={animationComplexity === 'complex'}
                          onChange={() => setAnimationComplexity('complex')}
                          style={{ accentColor: '#e60012', marginTop: '2px' }}
                        />
                        <div>
                          <div style={{ fontWeight: '500' }}>Complex</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Bone-rigged, frame-based animations</div>
                        </div>
                      </label>
                    </div>
                  </CollapsibleSection>

                  {/* Visual Group Separator - Styling & Templates */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '20px 0',
                    gap: '12px'
                  }}>
                    <div style={{
                      flex: 1,
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent 0%, #6b7280 50%, transparent 100%)'
                    }}></div>
                    <span style={{
                      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      STYLING & TEMPLATES
                    </span>
                    <div style={{
                      flex: 1,
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent 0%, #6b7280 50%, transparent 100%)'
                    }}></div>
                  </div>


                  <CollapsibleSection
                    title="6. Animation Templates"
                    isExpanded={expandedSections.animationTemplates}
                    onToggle={() => toggleSection('animationTemplates')}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {ANIMATION_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          onClick={() => applyAnimationTemplate(template.id)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 6px',
                            background: selectedAnimationTemplate === template.id ? '#fef2f2' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            textAlign: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span style={{ fontSize: '14px' }}>{template.icon}</span>
                          <div style={{ fontWeight: '500', color: '#374151' }}>{template.name}</div>
                        </button>
                      ))}
                    </div>
                    <div style={{
                      marginTop: '8px',
                      padding: '6px 8px',
                      background: '#fef3c7',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#92400e'
                    }}>
                      💡 Templates automatically arrange symbols and add animations
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="7. Letter Animations"
                    isExpanded={expandedSections.letterAnimations}
                    onToggle={() => toggleSection('letterAnimations')}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <button
                        onClick={() => animateLettersWave()}
                        disabled={!selectedSymbol || sprites.filter(s => s.type === 'letter').length === 0}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 6px',
                          background: '#f0f9ff',
                          border: '1px solid #0ea5e9',
                          borderRadius: '6px',
                          cursor: selectedSymbol ? 'pointer' : 'not-allowed',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: selectedSymbol ? '#0c4a6e' : '#9ca3af'
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>🌊</span>
                        Wave
                      </button>

                      <button
                        onClick={() => animateLettersBounce()}
                        disabled={!selectedSymbol || sprites.filter(s => s.type === 'letter').length === 0}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 6px',
                          background: '#f0fdf4',
                          border: '1px solid #10b981',
                          borderRadius: '6px',
                          cursor: selectedSymbol ? 'pointer' : 'not-allowed',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: selectedSymbol ? '#065f46' : '#9ca3af'
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>⬆️</span>
                        Bounce
                      </button>

                      <button
                        onClick={() => animateLettersGlow()}
                        disabled={!selectedSymbol || sprites.filter(s => s.type === 'letter').length === 0}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 6px',
                          background: '#fefce8',
                          border: '1px solid #eab308',
                          borderRadius: '6px',
                          cursor: selectedSymbol ? 'pointer' : 'not-allowed',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: selectedSymbol ? '#713f12' : '#9ca3af'
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>✨</span>
                        Glow
                      </button>

                      <button
                        onClick={() => stopLetterAnimations()}
                        disabled={!selectedSymbol || sprites.filter(s => s.type === 'letter').length === 0}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 6px',
                          background: '#fef2f2',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: selectedSymbol ? 'pointer' : 'not-allowed',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: selectedSymbol ? '#7f1d1d' : '#9ca3af'
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>⏹️</span>
                        Stop
                      </button>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <label style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', display: 'block' }}>
                          Wave Speed
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          defaultValue="1"
                          style={{
                            width: '100%',
                            height: '4px',
                            background: '#e5e7eb',
                            borderRadius: '2px',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                          onChange={(e) => {
                            // Apply wave with new speed
                            if (sprites.filter(s => s.type === 'letter').length > 0) {
                              animateLettersWave(10, parseFloat(e.target.value), 0.1);
                            }
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px', display: 'block' }}>
                          Wave Height
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="25"
                          step="1"
                          defaultValue="10"
                          style={{
                            width: '100%',
                            height: '4px',
                            background: '#e5e7eb',
                            borderRadius: '2px',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                          onChange={(e) => {
                            // Apply wave with new amplitude
                            if (sprites.filter(s => s.type === 'letter').length > 0) {
                              animateLettersWave(parseInt(e.target.value), 1, 0.1);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div style={{
                      marginTop: '8px',
                      padding: '6px 8px',
                      background: '#f0f9ff',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#0c4a6e'
                    }}>
                      🌊 Individual letter animations for wavy text effects
                    </div>
                  </CollapsibleSection>
                </>
              )}
            </div>
          </div>


          <div className='pt-4' style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',

          }}>
            {/* Left Panel - Controls */}
            

            {layoutMode === 'full' && (
              // Right Panel (60%) - Full Animation Lab
              <div style={{
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingBottom: '20px'
              }}>
                {/* Symbol Carousel - Compact */}
                <div style={{
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  padding: '12px',
                  minHeight: '120px'
                }}>
                  {/* Compact Symbol Info */}
                  {selectedSymbol && (
                    <div className="text-center p-3">
                      <h4 className="font-medium text-gray-800">
                        {selectedSymbol.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedSymbol.gameSymbolType} • {selectedSymbol.rarity}
                      </p>
                    </div>
                  )}
                </div>

                {/* Workspace and Preview - Side by Side */}
                <div style={{ display: 'flex', gap: '12px', flex: '1', minHeight: '300px' }}>
                  <div style={{ flex: '1' }}>
                    <WorkspacePanel
                      selectedSymbol={selectedSymbol}
                      onSymbolUpdate={handleSymbolUpdate}
                      onImageUpload={handleImageUpload}
                      sprites={sprites}
                      setSprites={setSprites}
                      onCanvasReady={setIsCanvasReady}
                      selectedLayerId={selectedLayerId}
                      layerVisibility={layerVisibility}
                      layerLocks={layerLocks}
                      onLayerSelect={handleLayerSelect}
                      isPlaying={isPlaying}
                    />
                  </div>
                  <div style={{ flex: '1' }}>
                    <PreviewPanel
                      selectedSymbol={selectedSymbol}
                      isPlaying={isPlaying}
                      onIndividualizeText={handleIndividualizeText}
                      workspaceSprites={sprites}
                      layerVisibility={layerVisibility}
                      selectedLayerId={selectedLayerId}
                      isCanvasReady={isCanvasReady}
                    />
                  </div>
                </div>

                {/* Timeline Controls with Layer Management */}
                <div style={{
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  padding: '12px'
                }}>
                  <TimelineControls
                    isPlaying={isPlaying}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onStop={handleStop}
                    onSave={handleSave}
                    selectedSymbol={selectedSymbol}
                    animationFrame={animationFrame}
                    onFrameSeek={handleFrameSeek}
                    totalFrames={100}
                    selectedAnimationTemplate={selectedAnimationTemplate}
                    applyAnimationTemplate={applyAnimationTemplate}
                  />
                  <LayerPanel
                    sprites={sprites}
                    selectedLayerId={selectedLayerId}
                    layerVisibility={layerVisibility}
                    layerLocks={layerLocks}
                    onLayerSelect={handleLayerSelect}
                    onLayerVisibilityToggle={handleLayerVisibilityToggle}
                    onLayerLockToggle={handleLayerLockToggle}
                    setSprites={setSprites}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      </div>
    </>
  );
};

/**
 * Find main symbol region in sprite sheet (top 60% of image)
 */
function findSymbolRegionInImage(img: HTMLImageElement): { x: number; y: number; width: number; height: number } | null {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    console.log('🔍 Analyzing image for main symbol region:', { width: img.width, height: img.height });

    // Scan top 60% of image for main symbol
    const searchStartY = 10;
    const searchEndY = Math.floor(img.height * 0.6);

    let symbolBounds = {
      minX: img.width,
      maxX: 0,
      minY: img.height,
      maxY: 0,
      pixelCount: 0
    };

    // Find all non-transparent pixels in the search area
    for (let y = searchStartY; y < searchEndY; y++) {
      for (let x = 0; x < img.width; x++) {
        const alpha = data[(y * img.width + x) * 4 + 3];

        if (alpha > 128) { // Non-transparent pixel
          symbolBounds.minX = Math.min(symbolBounds.minX, x);
          symbolBounds.maxX = Math.max(symbolBounds.maxX, x);
          symbolBounds.minY = Math.min(symbolBounds.minY, y);
          symbolBounds.maxY = Math.max(symbolBounds.maxY, y);
          symbolBounds.pixelCount++;
        }
      }
    }

    // Validate that we found significant symbol
    if (symbolBounds.pixelCount < 100 || symbolBounds.maxX <= symbolBounds.minX) {
      console.log('❌ No significant symbol region found in top portion');
      return null;
    }

    // Add very generous padding around detected symbol to include decorative borders
    const padding = 60; // Increased from 30px to 60px to capture golden borders and ornate frames
    const finalBounds = {
      x: Math.max(0, symbolBounds.minX - padding),
      y: Math.max(0, symbolBounds.minY - padding),
      width: (symbolBounds.maxX - symbolBounds.minX) + (padding * 2),
      height: (symbolBounds.maxY - symbolBounds.minY) + (padding * 2)
    };

    console.log('✅ Detected symbol region:', finalBounds, `with ${symbolBounds.pixelCount} pixels`);
    return finalBounds;

  } catch (error) {
    console.error('❌ Symbol region detection failed:', error);
    return null;
  }
}

/**
 * Find text region in image by analyzing pixel patterns - IMPROVED for WILD text
 */
function findTextRegionInImage(img: HTMLImageElement): { x: number; y: number; width: number; height: number } | null {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    console.log('🔍 Analyzing image for text region:', { width: img.width, height: img.height });

    // Scan bottom 40% of image for text (letters in sprite sheet layout)
    const searchStartY = Math.floor(img.height * 0.55); // Start higher to catch letter tops
    const searchEndY = img.height - 5;

    let textBounds = {
      minX: img.width,
      maxX: 0,
      minY: img.height,
      maxY: 0,
      pixelCount: 0
    };

    // Find all non-transparent pixels in the search area
    for (let y = searchStartY; y < searchEndY; y++) {
      for (let x = 0; x < img.width; x++) {
        const alpha = data[(y * img.width + x) * 4 + 3];

        if (alpha > 128) { // Non-transparent pixel
          textBounds.minX = Math.min(textBounds.minX, x);
          textBounds.maxX = Math.max(textBounds.maxX, x);
          textBounds.minY = Math.min(textBounds.minY, y);
          textBounds.maxY = Math.max(textBounds.maxY, y);
          textBounds.pixelCount++;
        }
      }
    }

    // Validate that we found significant text
    if (textBounds.pixelCount < 100 || textBounds.maxX <= textBounds.minX) {
      console.log('❌ No significant text region found in bottom portion');
      return null;
    }

    // Add generous padding around detected text to capture decorative borders
    const horizontalPadding = 25; // Increased from 5px to 25px for golden borders
    const verticalPadding = 30; // Increased from 15px to 30px for letter tops/bottoms
    const finalBounds = {
      x: Math.max(0, textBounds.minX - horizontalPadding),
      y: Math.max(0, textBounds.minY - verticalPadding),
      width: (textBounds.maxX - textBounds.minX) + (horizontalPadding * 2),
      height: (textBounds.maxY - textBounds.minY) + (verticalPadding * 2)
    };

    console.log('✅ Detected text region:', finalBounds, `with ${textBounds.pixelCount} pixels`);
    return finalBounds;

  } catch (error) {
    console.error('❌ Text region detection failed:', error);
    return null;
  }
}

/**
 * Find individual letter boundaries within a text region using smart character width estimation
 */
function findIndividualLetterBounds(
  img: HTMLImageElement,
  textRegion: { x: number; y: number; width: number; height: number },
  expectedText: string = 'WILD'
): Array<{ x: number; y: number; width: number; height: number }> {

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(
    textRegion.x, textRegion.y,
    textRegion.width, textRegion.height
  );

  console.log('🔍 Analyzing text region for individual letters:', textRegion);

  // Calculate column densities for pattern analysis
  const columnDensities = [];
  for (let x = 0; x < textRegion.width; x++) {
    let pixelCount = 0;
    for (let y = 0; y < textRegion.height; y++) {
      const alpha = imageData.data[(y * textRegion.width + x) * 4 + 3];
      if (alpha > 128) pixelCount++;
    }
    columnDensities.push(pixelCount);
  }

  console.log('📊 Column densities range:', Math.min(...columnDensities), 'to', Math.max(...columnDensities));

  // SMART ALGORITHM: Use character width estimation for any text
  // Letters are typically connected but have distinct character patterns

  // For character width calculation, we need ALL letters including duplicates to calculate positions correctly
  const letters = expectedText.split('');

  // Calculate expected letter widths based on character types (dynamic)
  const getCharacterWidth = (char: string): number => {
    switch (char.toUpperCase()) {
      case 'W': case 'M': return 0.28; // Wide letters
      case 'I': case 'J': case 'L': return 0.15; // Narrow letters
      case 'F': case 'P': case 'R': case 'B': return 0.22; // Medium letters
      case 'A': case 'H': case 'N': case 'U': return 0.24; // Medium-wide letters
      case 'O': case 'Q': case 'C': case 'G': case 'D': return 0.25; // Round letters
      case 'S': case 'Z': case 'K': case 'X': return 0.20; // Variable letters
      default: return 0.22; // Default medium width
    }
  };

  const letterWidths = letters.map(getCharacterWidth);
  const totalProportion = letterWidths.reduce((sum, width) => sum + width, 0);

  // Calculate actual letter boundaries based on proportional widths
  const letterBounds: Array<{ x: number; y: number; width: number; height: number }> = [];
  let currentX = 0;

  letters.forEach((letter, index) => {
    const proportion = letterWidths[index] / totalProportion;
    const letterWidth = Math.floor(textRegion.width * proportion);

    // Add small overlap to ensure we don't miss connected parts
    const overlap = index < letters.length - 1 ? 3 : 0; // Add 3px overlap except for last letter

    letterBounds.push({
      x: textRegion.x + currentX,
      y: textRegion.y,
      width: letterWidth + overlap,
      height: textRegion.height
    });

    console.log(`📝 Letter ${letter} bounds: x=${currentX}, width=${letterWidth + overlap} (${(proportion * 100).toFixed(1)}%)`);

    currentX += letterWidth;
  });

  // Adjust last letter to fill remaining space
  if (letterBounds.length > 0) {
    const lastLetter = letterBounds[letterBounds.length - 1];
    lastLetter.width = textRegion.width - (lastLetter.x - textRegion.x);
    console.log('🔧 Adjusted last letter width to:', lastLetter.width);
  }

  console.log(`✅ Created ${letterBounds.length} proportional letter bounds using character width estimation`);
  return letterBounds;
}

/**
 * Create both main symbol and individual letter images from sprite sheet
 */
async function createSpriteSheetElements(imageUrl: string, letters: string[], expectedText?: string): Promise<{
  mainSymbol: string;
  letterImages: string[];
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const letterImages: string[] = [];

        // STEP 1: Extract main symbol from top area
        let symbolBounds = findSymbolRegionInImage(img);
        if (!symbolBounds) {
          console.log('📍 Using fallback symbol region detection');
          symbolBounds = {
            x: Math.floor(img.width * 0.2),
            y: Math.floor(img.height * 0.1),
            width: Math.floor(img.width * 0.6),
            height: Math.floor(img.height * 0.5)
          };
        }

        console.log('📍 Detected symbol region:', symbolBounds);

        // Create main symbol image
        const symbolCanvas = document.createElement('canvas');
        const symbolCtx = symbolCanvas.getContext('2d')!;
        symbolCanvas.width = Math.max(80, Math.ceil(symbolBounds.width + 10));
        symbolCanvas.height = Math.max(80, Math.ceil(symbolBounds.height + 10));
        symbolCtx.clearRect(0, 0, symbolCanvas.width, symbolCanvas.height);
        symbolCtx.drawImage(
          img,
          Math.floor(symbolBounds.x - 5), Math.floor(symbolBounds.y - 5),
          Math.ceil(symbolBounds.width + 10), Math.ceil(symbolBounds.height + 10),
          0, 0, symbolCanvas.width, symbolCanvas.height
        );
        const mainSymbolUrl = symbolCanvas.toDataURL('image/png');
        console.log('🎯 Created main symbol image:', symbolBounds);

        // STEP 2: Extract individual letters from bottom area
        let textBounds = findTextRegionInImage(img);
        if (!textBounds) {
          console.log('📍 Using fallback text region detection');
          textBounds = {
            x: Math.floor(img.width * 0.1),
            y: Math.floor(img.height * 0.6),
            width: Math.floor(img.width * 0.8),
            height: Math.floor(img.height * 0.3)
          };
        }

        console.log('📍 Detected text region:', textBounds);

        // SMART: Find individual letter boundaries within the text region
        const textToDetect = expectedText || letters.join('');
        const individualLetterBounds = findIndividualLetterBounds(img, textBounds, textToDetect);

        if (individualLetterBounds.length !== letters.length) {
          console.warn(`⚠️ Expected ${letters.length} letters, found ${individualLetterBounds.length}, using fallback division`);
          // Fallback to equal division if letter detection fails
          individualLetterBounds.length = 0; // Clear array
          for (let i = 0; i < letters.length; i++) {
            const letterWidth = textBounds.width / letters.length;
            individualLetterBounds[i] = {
              x: textBounds.x + (i * letterWidth),
              y: textBounds.y,
              width: letterWidth,
              height: textBounds.height
            };
          }
        }

        // Create individual letter images using detected boundaries
        for (let i = 0; i < letters.length; i++) {
          const letterBound = individualLetterBounds[i];
          if (!letterBound) continue;

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          // Set canvas size based on detected letter bounds with generous padding for decorative borders
          const horizontalPadding = 25; // Increased from 8px to 25px for golden borders
          const verticalPadding = 30; // Increased from 20px to 30px for letter decorative effects
          canvas.width = Math.max(60, Math.ceil(letterBound.width + horizontalPadding * 2));
          canvas.height = Math.max(60, Math.ceil(letterBound.height + verticalPadding * 2));

          // Clear with transparent background
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw the individual letter from the main image with extra padding
          ctx.drawImage(
            img,
            Math.floor(letterBound.x - horizontalPadding), Math.floor(letterBound.y - verticalPadding),
            Math.ceil(letterBound.width + horizontalPadding * 2), Math.ceil(letterBound.height + verticalPadding * 2), // Source rectangle with padding
            0, 0, canvas.width, canvas.height                                       // Destination rectangle
          );

          // Convert to data URL
          const letterImageUrl = canvas.toDataURL('image/png');
          letterImages.push(letterImageUrl);

          console.log(`🔤 Created individual letter ${letters[i]} from bounds:`, letterBound, `canvas: ${canvas.width}x${canvas.height}`);
        }

        resolve({
          mainSymbol: mainSymbolUrl,
          letterImages: letterImages
        });
      } catch (error) {
        console.error('❌ Failed to create sprite sheet elements:', error);
        resolve({
          mainSymbol: '',
          letterImages: []
        });
      }
    };

    img.onerror = () => {
      console.error('❌ Failed to load image for sprite sheet extraction');
      resolve({
        mainSymbol: '',
        letterImages: []
      });
    };

    img.src = imageUrl;
  });
}

export default EnhancedAnimationLab;