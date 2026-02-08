/**
 * Step 5: Animation Studio
 * Enhanced animation workspace with symbol carousel, PIXI.js preview,
 * animation templates, and letter animations carried over from Step 4
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../../store';
import Step4PixiPreview from '../../animation-lab/Step4PixiPreview';
import { getSymbolsFromLocalStorage, type StoredSymbol } from '../../../utils/symbolStorage';
import { Button } from '../../Button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { gsap } from 'gsap';

interface AnimationTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  gsapConfig: any;
}

interface LetterAnimation {
  id: string;
  name: string;
  description: string;
  preview: string;
  effect: string;
}

const ANIMATION_TEMPLATES: AnimationTemplate[] = [
  { id: 'bounce', name: 'Bounce', description: 'Classic bouncing animation', preview: '🏀', gsapConfig: { y: -20, repeat: -1, yoyo: true, ease: 'bounce.out' } },
  { id: 'pulse', name: 'Pulse', description: 'Rhythmic scaling effect', preview: '💓', gsapConfig: { scale: 1.2, repeat: -1, yoyo: true, ease: 'power2.inOut' } },
  { id: 'glow', name: 'Glow', description: 'Radiant glow effect', preview: '✨', gsapConfig: { filter: 'drop-shadow(0 0 10px gold)', repeat: -1, yoyo: true } },
  { id: 'rotate', name: 'Rotate', description: 'Continuous rotation', preview: '🌀', gsapConfig: { rotation: 360, repeat: -1, ease: 'none' } },
  { id: 'shake', name: 'Shake', description: 'Energetic shaking motion', preview: '📳', gsapConfig: { x: '+=5', repeat: -1, yoyo: true, ease: 'power2.inOut' } },
  { id: 'sparkle', name: 'Sparkle', description: 'Magical sparkle effect', preview: '⭐', gsapConfig: { opacity: 0.5, scale: 1.1, repeat: -1, yoyo: true } },
  { id: 'swing', name: 'Swing', description: 'Pendulum swinging motion', preview: '🎪', gsapConfig: { rotation: 15, repeat: -1, yoyo: true, ease: 'power2.inOut' } },
  { id: 'float', name: 'Float', description: 'Gentle floating motion', preview: '🎈', gsapConfig: { y: -10, repeat: -1, yoyo: true, ease: 'sine.inOut', duration: 2 } }
];

const LETTER_ANIMATIONS: LetterAnimation[] = [
  { id: 'typewriter', name: 'Typewriter', description: 'Letters appear one by one', preview: '⌨️', effect: 'sequential-fade-in' },
  { id: 'wave', name: 'Wave', description: 'Letters flow in wave motion', preview: '🌊', effect: 'wave-y-offset' },
  { id: 'zoom', name: 'Zoom In', description: 'Letters zoom into position', preview: '🔍', effect: 'scale-from-zero' },
  { id: 'slide', name: 'Slide In', description: 'Letters slide from the side', preview: '➡️', effect: 'slide-x-offset' },
  { id: 'flip', name: 'Flip', description: 'Letters flip into view', preview: '🔄', effect: 'rotate-y-flip' },
  { id: 'bounce-in', name: 'Bounce In', description: 'Letters bounce into position', preview: '⚡', effect: 'bounce-scale' },
  { id: 'fade-up', name: 'Fade Up', description: 'Letters fade up from below', preview: '⬆️', effect: 'fade-y-offset' }
];

const Step5_SymbolAnimation: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const [symbols, setSymbols] = useState<StoredSymbol[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState<StoredSymbol | null>(null);
  const [selectedAnimationTemplate, setSelectedAnimationTemplate] = useState<AnimationTemplate | null>(null);
  const [selectedLetterAnimation, setSelectedLetterAnimation] = useState<LetterAnimation | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [symbolFilter, setSymbolFilter] = useState<'all' | 'wild' | 'scatter' | 'high' | 'medium' | 'low'>('all');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<gsap.core.Timeline | null>(null);

  // Refs for animation preview - now for carousel symbols
  const symbolRefs = useRef<{ [key: string]: HTMLImageElement | null }>({});
  const animationTimelineRef = useRef<gsap.core.Timeline | null>(null);

  // Load symbols from Step 4
  const loadSymbols = useCallback(() => {
      const gameId = config?.gameId || config?.displayName || 'default';
      const storedSymbols = getSymbolsFromLocalStorage(gameId);

      // Ensure we always have an array, even if localStorage returns null/undefined
      const symbolsArray = Array.isArray(storedSymbols) ? storedSymbols : [];

      console.log('[Step5] Loading symbols:', symbolsArray.length, 'for game:', gameId);
      console.log('[Step5] Raw stored symbols:', storedSymbols);

      // Update debug info
      setDebugInfo(`GameId: ${gameId}, Symbols: ${symbolsArray.length}, Raw: ${storedSymbols ? 'exists' : 'null'}`);

      setSymbols(symbolsArray);
  }, [config]);

  useEffect(() => {
    loadSymbols();

    // Also listen for symbolsChanged events from EnhancedAnimationLab
    const handleSymbolsChanged = (event: CustomEvent) => {
      console.log('[Step5] Received symbolsChanged event:', event.detail);
      // Reload symbols when they change
      loadSymbols();
    };

    // Also check store symbols on mount and when config changes
    const checkStoreSymbols = () => {
      const storeSymbols = config?.theme?.generated?.symbols || [];
      console.log('[Step5] Checking store symbols:', {
        storeSymbolsLength: storeSymbols.length,
        currentSymbolsLength: symbols.length,
        storeSymbols: storeSymbols.slice(0, 2) // Log first 2 for debugging
      });

      if (storeSymbols.length > 0 && symbols.length === 0) {
        console.log('[Step5] Found symbols in store, converting to StoredSymbol format:', storeSymbols.length);

        // Convert store symbols to StoredSymbol format with proper typing
        const symbolTypes: Array<'wild' | 'scatter' | 'high' | 'medium' | 'low'> = ['wild', 'scatter', 'high', 'medium', 'low'];
        const convertedSymbols: StoredSymbol[] = storeSymbols.map((imageUrl, index) => ({
          id: `store_symbol_${index}`,
          name: `Symbol ${index + 1}`,
          type: symbolTypes[Math.min(index, symbolTypes.length - 1)],
          image: imageUrl,
          weight: 1,
          isWild: index === 0,
          isScatter: index === 1
        }));

        console.log('[Step5] Converted symbols:', convertedSymbols.slice(0, 2)); // Log first 2 for debugging
        setSymbols(convertedSymbols);
        setDebugInfo(`Store symbols converted: ${convertedSymbols.length}`);
      }
    };

    checkStoreSymbols();

    window.addEventListener('symbolsChanged', handleSymbolsChanged as EventListener);

    return () => {
      window.removeEventListener('symbolsChanged', handleSymbolsChanged as EventListener);
    };
  }, [config, loadSymbols]); // Removed selectedSymbol from dependencies to prevent infinite re-renders

  // Separate useEffect to set initial selected symbol
  useEffect(() => {
    if (symbols.length > 0 && !selectedSymbol) {
      setSelectedSymbol(symbols[0]);
    }
  }, [symbols, selectedSymbol]);

  // Filter symbols based on selected filter
  const filteredSymbols = symbols.filter(symbol => {
    if (symbolFilter === 'all') return true;
    return symbol.type === symbolFilter;
  });

  // Animation preview functions - now works with carousel symbols
  const playAnimationPreview = useCallback((template: AnimationTemplate) => {
    if (!selectedSymbol) return;

    const symbolElement = symbolRefs.current[selectedSymbol.id];
    if (!symbolElement) return;

    // Kill any existing animation
    if (animationTimelineRef.current) {
      animationTimelineRef.current.kill();
    }

    // Create new timeline
    const timeline = gsap.timeline({ repeat: -1 });

    // Apply the animation based on template
    switch (template.id) {
      case 'bounce':
        timeline.to(symbolElement, {
          y: -20,
          duration: 0.4,
          ease: "power2.out",
          yoyo: true,
          repeat: -1
        });
        break;
      case 'pulse':
        timeline.to(symbolElement, {
          scale: 1.2,
          duration: 0.6,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1
        });
        break;
      case 'glow':
        timeline.to(symbolElement, {
          filter: 'drop-shadow(0 0 15px gold) brightness(1.2)',
          duration: 0.8,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1
        });
        break;
      case 'rotate':
        timeline.to(symbolElement, {
          rotation: 360,
          duration: 2,
          ease: "none",
          repeat: -1
        });
        break;
      case 'shake':
        timeline.to(symbolElement, {
          x: '+=5',
          duration: 0.1,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1
        });
        break;
      case 'sparkle':
        timeline.to(symbolElement, {
          opacity: 0.7,
          scale: 1.1,
          duration: 0.5,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1
        });
        break;
      case 'swing':
        timeline.to(symbolElement, {
          rotation: 15,
          duration: 1,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1
        });
        break;
      case 'float':
        timeline.to(symbolElement, {
          y: -10,
          duration: 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        });
        break;
      default:
        break;
    }

    animationTimelineRef.current = timeline;
    setCurrentAnimation(timeline);
    setIsPreviewPlaying(true);
  }, [selectedSymbol]);

  const stopAnimationPreview = useCallback(() => {
    if (animationTimelineRef.current) {
      animationTimelineRef.current.kill();
      animationTimelineRef.current = null;
    }

    // Reset selected symbol to original state
    if (selectedSymbol) {
      const symbolElement = symbolRefs.current[selectedSymbol.id];
      if (symbolElement) {
        gsap.set(symbolElement, {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 1,
          filter: 'none'
        });
      }
    }

    setCurrentAnimation(null);
    setIsPreviewPlaying(false);
  }, [selectedSymbol]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (animationTimelineRef.current) {
        animationTimelineRef.current.kill();
      }
    };
  }, []);

  const handleSymbolSelect = useCallback((symbol: StoredSymbol) => {
    setSelectedSymbol(symbol);
    // Stop any current animation when selecting a new symbol
    stopAnimationPreview();
    // If we have an animation template selected, start preview with new symbol
    if (selectedAnimationTemplate) {
      setTimeout(() => playAnimationPreview(selectedAnimationTemplate), 100);
    }
  }, [selectedAnimationTemplate, stopAnimationPreview, playAnimationPreview]);

  const handleApplyAnimation = useCallback(async () => {
    if (!selectedSymbol || (!selectedAnimationTemplate && !selectedLetterAnimation)) {
      return;
    }

    setIsApplying(true);

    try {
      // Store animation configuration in the winAnimations section (which exists in GameConfig)
      const currentWinAnimations = config?.winAnimations || {};
      const updatedWinAnimations = {
        ...currentWinAnimations,
        symbolAnimations: {
          ...currentWinAnimations.symbolAnimations,
          [selectedSymbol.id]: {
            animationTemplate: selectedAnimationTemplate?.id,
            letterAnimation: selectedLetterAnimation?.id,
            animationConfig: {
              template: selectedAnimationTemplate?.gsapConfig,
              letterEffect: selectedLetterAnimation?.effect
            },
            lastAnimationUpdate: Date.now()
          }
        }
      };

      updateConfig({
        winAnimations: updatedWinAnimations
      });

      // Dispatch event for PIXI preview to update
      window.dispatchEvent(new CustomEvent('animationTemplateChanged', {
        detail: {
          symbolId: selectedSymbol.id,
          animationTemplate: selectedAnimationTemplate?.id,
          letterAnimation: selectedLetterAnimation?.id,
          config: {
            template: selectedAnimationTemplate?.gsapConfig,
            letterEffect: selectedLetterAnimation?.effect
          }
        }
      }));

      // Also dispatch immediate animation play event
      window.dispatchEvent(new CustomEvent('animationPlay', {
        detail: {
          symbolId: selectedSymbol.id,
          animationTemplate: selectedAnimationTemplate?.id,
          letterAnimation: selectedLetterAnimation?.id,
          autoPlay: true
        }
      }));

      console.log('[Step5] Applied animation:', {
        symbol: selectedSymbol.name,
        animationTemplate: selectedAnimationTemplate?.name,
        letterAnimation: selectedLetterAnimation?.name
      });

    } catch (error) {
      console.error('[Step5] Error applying animation:', error);
    } finally {
      setIsApplying(false);
    }
  }, [selectedSymbol, selectedAnimationTemplate, selectedLetterAnimation, config, updateConfig]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex ">
        {/* Main Panel - Symbol Carousel & Animation Controls */}
        <div className="flex-1 bg-white border-gray-200 flex flex-col">
          <div className="bg-white ">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-2">
              <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                <h1 className="text-xl font-bold text-gray-900">Animation Studio</h1>
                <p className="text-sm text-gray-600">Apply animations to your symbols and see them in action </p>
              </div>
            </div>
          </div>
          {/* Symbol Carousel */}
          <div className="p-2">
            <div className=' border p-4 rounded-md bg-gray-50'>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Symbol</h3>

            {/* Symbol Filter Buttons */}
            {symbols.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {(['all', 'wild', 'scatter', 'high', 'medium', 'low'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSymbolFilter(filter)}
                    className={`px-2 py-1 text-xs rounded transition-all ${
                      symbolFilter === filter
                        ? 'bg-purple-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-purple-100'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    {filter !== 'all' && (
                      <span className="ml-1 text-xs opacity-75">
                        ({symbols.filter(s => s.type === filter).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {(!symbols || !Array.isArray(symbols) || symbols.length === 0) ? (
                <div className="col-span-3 text-center py-4 text-gray-500">
                  <div className="text-2xl mb-2">🎨</div>
                  <p className="text-sm">No symbols found</p>
                  <p className="text-xs">Create symbols in Step 4 first</p>
                  {/* Debug info */}
                  <p className="text-xs text-red-500 mt-2">
                    Debug: symbols = {symbols ? `Array(${symbols.length})` : 'null/undefined'}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    {debugInfo}
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        console.log('[Step5] Manual reload triggered');
                        loadSymbols();
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Reload Symbols
                    </button>
                    <button
                      onClick={() => {
                        console.log('[Step5] Force load from store triggered');
                        const storeSymbols = config?.theme?.generated?.symbols || [];
                        console.log('[Step5] Store symbols:', storeSymbols);
                        if (storeSymbols.length > 0) {
                          const symbolTypes: Array<'wild' | 'scatter' | 'high' | 'medium' | 'low'> = ['wild', 'scatter', 'high', 'medium', 'low'];
                          const convertedSymbols: StoredSymbol[] = storeSymbols.map((imageUrl, index) => ({
                            id: `store_symbol_${index}`,
                            name: `Symbol ${index + 1}`,
                            type: symbolTypes[Math.min(index, symbolTypes.length - 1)],
                            image: imageUrl,
                            weight: 1,
                            isWild: index === 0,
                            isScatter: index === 1
                          }));
                          setSymbols(convertedSymbols);
                          setDebugInfo(`Force loaded from store: ${convertedSymbols.length}`);
                        }
                      }}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      Load from Store
                    </button>
                    <button
                      onClick={() => {
                        console.log('[Step5] Debug localStorage triggered');
                        const gameId = config?.gameId || config?.displayName || 'default';
                        const storageKey = `slotai_symbols_${gameId}`;
                        const stored = localStorage.getItem(storageKey);
                        console.log('[Step5] LocalStorage key:', storageKey);
                        console.log('[Step5] LocalStorage data:', stored);
                        if (stored) {
                          try {
                            const parsed = JSON.parse(stored);
                            console.log('[Step5] Parsed data:', parsed);
                            setDebugInfo(`LocalStorage: ${JSON.stringify(parsed).substring(0, 100)}...`);
                          } catch (e) {
                            console.error('[Step5] Parse error:', e);
                            setDebugInfo(`Parse error: ${e}`);
                          }
                        } else {
                          setDebugInfo(`No data in localStorage for key: ${storageKey}`);
                        }
                      }}
                      className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                    >
                      Debug Storage
                    </button>
                    <button
                      onClick={() => {
                        console.log('[Step5] Creating test symbols');
                        const testSymbols: StoredSymbol[] = [
                          {
                            id: 'test_wild',
                            name: 'Wild Symbol',
                            type: 'wild',
                            image: '/assets/games/322r3r32r_20250630/symbols/symbols_symbol_1_png.png',
                            weight: 5,
                            isWild: true,
                            isScatter: false
                          },
                          {
                            id: 'test_scatter',
                            name: 'Scatter Symbol',
                            type: 'scatter',
                            image: '/assets/games/322r3r32r_20250630/symbols/symbols_symbol_1_png.png',
                            weight: 3,
                            isWild: false,
                            isScatter: true
                          },
                          {
                            id: 'test_high',
                            name: 'High Symbol',
                            type: 'high',
                            image: '/assets/games/322r3r32r_20250630/symbols/symbols_symbol_1_png.png',
                            weight: 10,
                            isWild: false,
                            isScatter: false
                          }
                        ];
                        setSymbols(testSymbols);
                        setDebugInfo(`Test symbols created: ${testSymbols.length}`);
                      }}
                      className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                    >
                      Create Test Symbols
                    </button>
                  </div>
                </div>
              ) : filteredSymbols.length === 0 ? (
                <div className="col-span-3 text-center py-4 text-gray-500">
                  <div className="text-2xl mb-2">🔍</div>
                  <p className="text-sm">No {symbolFilter} symbols found</p>
                  <button
                    onClick={() => setSymbolFilter('all')}
                    className="mt-2 px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                  >
                    Show All Symbols
                  </button>
                </div>
              ) : (
                filteredSymbols.map((symbol) => (
                  <button
                    key={symbol.id}
                    onClick={() => handleSymbolSelect(symbol)}
                    className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${selectedSymbol?.id === symbol.id
                        ? isPreviewPlaying
                          ? 'border-green-500 ring-2 ring-green-200 shadow-lg'
                          : 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <img
                      ref={(el) => {
                        symbolRefs.current[symbol.id] = el;
                      }}
                      src={symbol.image}
                      alt={symbol.name}
                      className="w-full h-full object-cover"
                      style={{
                        transformOrigin: 'center center',
                        willChange: 'transform, opacity, filter'
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all" />
                    {selectedSymbol?.id === symbol.id && (
                      <>
                        <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${isPreviewPlaying ? 'bg-green-500' : 'bg-purple-500'}`} />
                        {isPreviewPlaying && selectedAnimationTemplate && (
                          <div className="absolute top-1 left-1 px-1 py-0.5 bg-green-500 text-white text-xs rounded">
                            {selectedAnimationTemplate.preview}
                          </div>
                        )}
                      </>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1">
                      <div className="truncate">{symbol.name}</div>
                      <div className="text-xs opacity-75">{symbol.type}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
            {selectedSymbol && (
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedSymbol.name}</p>
                    <p className="text-xs text-gray-600 capitalize">{selectedSymbol.type}</p>
                  </div>
                  {isPreviewPlaying && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      ▶ Playing
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  {selectedSymbol.isWild && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Wild</span>}
                  {selectedSymbol.isScatter && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Scatter</span>}
                </div>

                {/* Animation Controls */}
                {selectedAnimationTemplate && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        if (isPreviewPlaying) {
                          stopAnimationPreview();
                        } else {
                          playAnimationPreview(selectedAnimationTemplate);
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      {isPreviewPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {isPreviewPlaying ? 'Pause' : 'Play'}
                    </button>

                    <button
                      onClick={stopAnimationPreview}
                      disabled={!isPreviewPlaying}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>

                    <span className="text-xs text-gray-500">
                      {selectedAnimationTemplate.name}
                    </span>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Animation Templates */}
          <div className='p-2'> 
          <div className="p-4 rounded-md bg-gray-50 border border-gray-200 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Animation Templates</h3>
            {/* <div className="space-y-2 max-h-64 overflow-y-auto"> */}
            <div className="grid grid-cols-2 gap-2">
              {ANIMATION_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedAnimationTemplate(template);
                    if (selectedSymbol) {
                      playAnimationPreview(template);
                    }
                  }}
                  onMouseEnter={() => {
                    if (selectedSymbol && selectedAnimationTemplate?.id !== template.id) {
                      playAnimationPreview(template);
                    }
                  }}
                  onMouseLeave={() => {
                    if (selectedAnimationTemplate?.id !== template.id) {
                      stopAnimationPreview();
                    }
                  }}
                    className={`
                    flex items-center gap-1 w-ful cursor-pointer rounded-lg border p-1 min-w-[200px] transition-all duration-200
                    hover:shadow-md
                    ${selectedAnimationTemplate?.id === template.id
                          ? 'border-red-300 bg-red-50 border'
                          : 'border-gray-200 bg-white hover:border-red-200'
                        }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{template.preview}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{template.name}</p>
                      <p className="text-xs text-gray-600">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Animation Test */}
          {selectedSymbol && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-xs font-medium text-blue-900 mb-2">Quick Test</h4>
              <div className="flex flex-wrap gap-1">
                {ANIMATION_TEMPLATES.slice(0, 4).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => playAnimationPreview(template)}
                    className="px-2 py-1 text-xs bg-white hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                  >
                    {template.preview} {template.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          </div>


          {/* Letter Animations */}
          <div className='p-2'>
          <div className="p-4 rounded-md bg-gray-50 border border-gray-200 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Letter Animations</h3>
            <div className="grid grid-cols-2 gap-2">
              {LETTER_ANIMATIONS.map((animation) => (
                <button
                  key={animation.id}
                  onClick={() => {
                    setSelectedLetterAnimation(animation);
                    // If we have both symbol and animation template, restart preview with letter animation
                    if (selectedSymbol && selectedAnimationTemplate) {
                      playAnimationPreview(selectedAnimationTemplate);
                    }
                  }}

                    className={`
                    flex items-center gap-1 w-ful cursor-pointer rounded-lg border p-1 min-w-[200px] transition-all duration-200
                    hover:shadow-md
                    ${selectedLetterAnimation?.id === animation.id
                          ? 'border-red-300 bg-red-50 border'
                          : 'border-gray-200 bg-white hover:border-red-200'
                        }
                  `}

                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{animation.preview}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{animation.name}</p>
                      <p className="text-xs text-gray-600">{animation.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          </div>

          {/* Apply Button */}
          <div className="p-4 border-t border-gray-200">
            <Button
            variant='generate'
            className='w-full py-2'
              onClick={handleApplyAnimation}
              disabled={!selectedSymbol || (!selectedAnimationTemplate && !selectedLetterAnimation) || isApplying}
            >
              {isApplying ? 'Applying...' : 'Apply Animation'}
            </Button>
          </div>
        </div>



      </div>
    </div>
  );
};

export default Step5_SymbolAnimation;