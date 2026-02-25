import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../../store';
import { getSymbolsFromLocalStorage, type StoredSymbol } from '../../../utils/symbolStorage';
import { Button } from '../../Button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { gsap } from 'gsap';
import { bulletproofDetector, type SimpleSprite } from '../../../utils/bulletproofSpriteDetector';

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

const PULSE_ANIMATION_CONFIG = {
  scale: 1.15,
  duration: 0.6,
  ease: 'power2.inOut',
  yoyo: true,
  repeat: -1
};

const applyPulse = (timeline: gsap.core.Timeline, target: gsap.TweenTarget, position: gsap.Position = 0) => {
  timeline.to(target, PULSE_ANIMATION_CONFIG, position);
};

const applySymbolAnimation = (
  timeline: gsap.core.Timeline,
  target: gsap.TweenTarget,
  templateId: AnimationTemplate['id'],
  position: gsap.Position = 0
) => {
  switch (templateId) {
    case 'bounce':
      timeline.to(target, {
        y: -20,
        duration: 0.4,
        ease: "power2.out",
        yoyo: true,
        repeat: -1
      }, position);
      break;
    case 'pulse':
      applyPulse(timeline, target, position);
      break;
    case 'glow':
      timeline.to(target, {
        filter: 'drop-shadow(0 0 15px gold) brightness(1.2)',
        duration: 0.8,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      }, position);
      break;
    case 'rotate':
      timeline.to(target, {
        rotation: 360,
        duration: 2,
        ease: "none",
        repeat: -1
      }, position);
      break;
    case 'shake':
      timeline.to(target, {
        x: '+=5',
        duration: 0.1,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      }, position);
      break;
    case 'sparkle':
      timeline.to(target, {
        opacity: 0.7,
        scale: 1.1,
        duration: 0.5,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      }, position);
      break;
    case 'swing':
      timeline.to(target, {
        rotation: 15,
        duration: 1,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      }, position);
      break;
    case 'float':
      timeline.to(target, {
        y: -10,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      }, position);
      break;
    default:
      break;
  }
};

const ANIMATION_TEMPLATES: AnimationTemplate[] = [
  { id: 'bounce', name: 'Bounce', description: 'Classic bouncing animation', preview: '🏀', gsapConfig: { y: -20, repeat: -1, yoyo: true, ease: 'bounce.out' } },
  { id: 'pulse', name: 'Pulse', description: 'Rhythmic scaling effect', preview: '💓', gsapConfig: PULSE_ANIMATION_CONFIG },
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
  const [letterSprites, setLetterSprites] = useState<SimpleSprite[]>([]);
  const [symbolSprites, setSymbolSprites] = useState<SimpleSprite[]>([]);
  const [isProcessingSprites, setIsProcessingSprites] = useState(false);
  const [combinedAnimationTimeline, setCombinedAnimationTimeline] = useState<gsap.core.Timeline | null>(null);

  const symbolRefs = useRef<{ [key: string]: HTMLImageElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const animationTimelinesRef = useRef<Map<string, gsap.core.Timeline>>(new Map());
  const symbolAnimationsRef = useRef<Map<string, AnimationTemplate>>(new Map());
  const letterRefs = useRef<{ [key: string]: HTMLElement }>({});
  const previewTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const symbolsLoadedRef = useRef<string | null>(null);

  const processLetterSprites = useCallback(async (symbol: StoredSymbol) => {
    if (!symbol.image) {
      return;
    }

    setIsProcessingSprites(true);
    try {
      const sprites = await bulletproofDetector.detectSprites(symbol.image);
      const letters = sprites
        .filter(sprite => sprite.type === 'letter')
        .sort((a, b) => a.bounds.x - b.bounds.x);

      const symbols = sprites.filter(sprite => sprite.type === 'symbol');


      setLetterSprites(letters);
      setSymbolSprites(symbols);
    } catch (error) {
      console.error('Error processing letter sprites:', error);
      setLetterSprites([]);
    } finally {
      setIsProcessingSprites(false);
    }
  }, []);
  const loadSymbols = useCallback(() => {
      const gameId = config?.gameId || config?.displayName || 'default';
      const storedSymbols = getSymbolsFromLocalStorage(gameId);

      const symbolsArray = Array.isArray(storedSymbols) ? storedSymbols : [];
      setDebugInfo(`GameId: ${gameId}, Symbols: ${symbolsArray.length}, Raw: ${storedSymbols ? 'exists' : 'null'}`);

      setSymbols(symbolsArray);
  }, [config]);

  useEffect(() => {
    const gameId = config?.gameId || config?.displayName || 'default';
    
    if (symbolsLoadedRef.current !== gameId) {
      // Try loading from localStorage first
      const storedSymbols = getSymbolsFromLocalStorage(gameId);
      const symbolsArray = Array.isArray(storedSymbols) ? storedSymbols : [];

      if (symbolsArray.length > 0) {
        setSymbols(symbolsArray);
        symbolsLoadedRef.current = gameId;
        setDebugInfo(`GameId: ${gameId}, Symbols: ${symbolsArray.length}, Loaded from localStorage`);
      } else {
        const storeSymbols = config?.theme?.generated?.symbols;

        if (storeSymbols) {
          let convertedSymbols: StoredSymbol[] = [];

          if (Array.isArray(storeSymbols)) {
            // Legacy array format - assign types based on index
            const types: Array<'wild' | 'wild 2' | 'scatter' | 'high 1' | 'high 2' | 'high 3' | 'high 4' | 'medium 1' | 'medium 2' | 'medium 3' | 'medium 4' | 'low 1' | 'low 2' | 'low 3' | 'low 4'> = [
              'wild', 'scatter', 'high 1', 'high 2', 'high 3', 'high 4', 
              'medium 1', 'medium 2', 'medium 3', 'medium 4', 
              'low 1', 'low 2', 'low 3', 'low 4'
            ];
            const typeCounts: Record<string, number> = {};

            convertedSymbols = storeSymbols.map((imageUrl, index) => {
              const type = types[Math.min(index, types.length - 1)] || 'medium 1';
              typeCounts[type] = (typeCounts[type] || 0) + 1;
              const id = `${type.replace(/\s+/g, '')}_${typeCounts[type]}`;
              
              return {
                id,
                name: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
                type,
                image: imageUrl,
                weight: 1,
                isWild: type === 'wild' || type === 'wild 2',
                isScatter: type === 'scatter'
              };
            });
          } else if (typeof storeSymbols === 'object') {
            convertedSymbols = Object.entries(storeSymbols).map(([key, imageUrl]) => {
              let type: StoredSymbol['type'] = 'medium 1';
              let name = key;

              if (key.toLowerCase().startsWith('wild')) {
                const match = key.match(/(\d+)$/);
                if (match) {
                  type = match[1] === '2' ? 'wild 2' : 'wild';
                  name = `Wild ${match[1] || ''}`.trim();
                } else {
                  type = 'wild';
                  name = 'Wild';
                }
              } else if (key.toLowerCase().startsWith('scatter')) {
                type = 'scatter';
                name = 'Scatter';
              } else if (key.toLowerCase().startsWith('high')) {
                const match = key.match(/(\d+)$/);
                const num = match ? match[1] : '1';
                type = `high ${num}` as StoredSymbol['type'];
                name = `High ${num}`;
              } else if (key.toLowerCase().startsWith('medium')) {
                const match = key.match(/(\d+)$/);
                const num = match ? match[1] : '1';
                type = `medium ${num}` as StoredSymbol['type'];
                name = `Medium ${num}`;
              } else if (key.toLowerCase().startsWith('low')) {
                const match = key.match(/(\d+)$/);
                const num = match ? match[1] : '1';
                type = `low ${num}` as StoredSymbol['type'];
                name = `Low ${num}`;
              } else {
                const normalizedKey = key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
                const parts = normalizedKey.split(/\s+/);
                if (parts.length >= 2) {
                  const category = parts[0];
                  const num = parts[1];
                  if (['high', 'medium', 'low'].includes(category)) {
                    type = `${category} ${num}` as StoredSymbol['type'];
                    name = `${category.charAt(0).toUpperCase() + category.slice(1)} ${num}`;
                  }
                }
              }

              return {
                id: key,
                name,
                type,
                image: imageUrl as string,
                weight: 1,
                isWild: type === 'wild' || type === 'wild 2',
                isScatter: type === 'scatter'
              };
            });
          }

          if (convertedSymbols.length > 0) {
            setSymbols(convertedSymbols);
            symbolsLoadedRef.current = gameId;
            setDebugInfo(`Store symbols converted: ${convertedSymbols.length}`);
          } else {
            setSymbols(prev => prev.length > 0 ? prev : []);
            setDebugInfo(`No symbols found for gameId: ${gameId}`);
          }
        } else {
          setSymbols(prev => prev.length > 0 ? prev : []);
          setDebugInfo(`No symbols found for gameId: ${gameId}`);
        }
      }
    }

    const handleSymbolsChanged = () => {
      loadSymbols();
      symbolsLoadedRef.current = gameId;
    };

    window.addEventListener('symbolsChanged', handleSymbolsChanged as EventListener);

    return () => {
      window.removeEventListener('symbolsChanged', handleSymbolsChanged as EventListener);
    };
  }, [config?.gameId, config?.displayName, loadSymbols]); 
  useEffect(() => {
    if (symbols.length > 0 && !selectedSymbol) {
      setSelectedSymbol(symbols[0]);
    }
  }, [symbols, selectedSymbol]);

  useEffect(() => {
    if (!symbols.length || !config?.winAnimations?.symbolAnimations) return;

    const storedAnimations = config.winAnimations.symbolAnimations;
    Object.keys(storedAnimations).forEach((symbolId) => {
      const animationData = storedAnimations[symbolId];
      if (!animationData?.animationTemplate) return;

      const template = ANIMATION_TEMPLATES.find(t => t.id === animationData.animationTemplate);
      if (!template) return;

      const symbol = symbols.find(s => s.id === symbolId);
      if (!symbol) return;

      setTimeout(() => {
        const symbolElement = symbolRefs.current[symbolId];
        if (!symbolElement) return;

        const existingTimeline = animationTimelinesRef.current.get(symbolId);
        if (existingTimeline) {
          existingTimeline.kill();
        }
        gsap.set(symbolElement, {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 1,
          filter: 'none'
        });

        const timeline = gsap.timeline({ repeat: -1 });

        applySymbolAnimation(timeline, symbolElement, template.id);
        animationTimelinesRef.current.set(symbolId, timeline);
        symbolAnimationsRef.current.set(symbolId, template);
      }, 100);
    });
  }, [symbols, config]);

  const filteredSymbols = symbols.filter(symbol => {
    if (symbolFilter === 'all') return true;
    if (symbolFilter === 'wild') return symbol.type === 'wild' || symbol.type === 'wild 2';
    if (symbolFilter === 'scatter') return symbol.type === 'scatter';
    if (symbolFilter === 'high') return symbol.type.startsWith('high');
    if (symbolFilter === 'medium') return symbol.type.startsWith('medium');
    if (symbolFilter === 'low') return symbol.type.startsWith('low');
    return symbol.type === symbolFilter;
  });
  const playAnimationPreview = useCallback((template: AnimationTemplate, symbolId?: string, persist: boolean = true) => {
    const targetSymbolId = symbolId || selectedSymbol?.id;
    if (!targetSymbolId) return;

    const symbolElement = symbolRefs.current[targetSymbolId];
    if (!symbolElement) return;
    if (previewTimelineRef.current) {
      previewTimelineRef.current.kill();
      previewTimelineRef.current = null;
    }
    if (persist) {
      const existingTimeline = animationTimelinesRef.current.get(targetSymbolId);
      if (existingTimeline) {
        existingTimeline.kill();
        animationTimelinesRef.current.delete(targetSymbolId);
        symbolAnimationsRef.current.delete(targetSymbolId);
      }
    }
    gsap.set(symbolElement, {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
      filter: 'none'
    });
    const timeline = gsap.timeline({ repeat: -1 });

    applySymbolAnimation(timeline, symbolElement, template.id);
    if (persist) {
      animationTimelinesRef.current.set(targetSymbolId, timeline);
      symbolAnimationsRef.current.set(targetSymbolId, template);
      
      const currentWinAnimations = config?.winAnimations || {};
      const updatedWinAnimations = {
        ...currentWinAnimations,
        symbolAnimations: {
          ...currentWinAnimations.symbolAnimations,
          [targetSymbolId]: {
            animationTemplate: template.id,
            letterAnimation: null,
            animationConfig: {
              template: template.gsapConfig,
              letterEffect: null
            },
            lastAnimationUpdate: Date.now()
          }
        }
      };

      updateConfig({
        winAnimations: updatedWinAnimations
      });
    } else {
      previewTimelineRef.current = timeline;
    }
    if (targetSymbolId === selectedSymbol?.id) {
      setIsPreviewPlaying(true);
    }
  }, [selectedSymbol, config, updateConfig]);

  const stopAnimationPreview = useCallback(() => {
    if (previewTimelineRef.current) {
      previewTimelineRef.current.kill();
      previewTimelineRef.current = null;
    }
    setIsPreviewPlaying(false);
  }, []);

  // Stop a specific symbol's persisted animation
  const stopSymbolAnimation = useCallback((symbolId: string) => {
    const timeline = animationTimelinesRef.current.get(symbolId);
    if (timeline) {
      timeline.kill();
      animationTimelinesRef.current.delete(symbolId);
      symbolAnimationsRef.current.delete(symbolId);
    }

    // Remove from store
    const currentWinAnimations = config?.winAnimations || {};
    const updatedSymbolAnimations = { ...currentWinAnimations.symbolAnimations };
    delete updatedSymbolAnimations[symbolId];
    
    updateConfig({
      winAnimations: {
        ...currentWinAnimations,
        symbolAnimations: updatedSymbolAnimations
      }
    });

    // Reset the symbol to original state
    const symbolElement = symbolRefs.current[symbolId];
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
  }, [config, updateConfig]);

  // Separate function to stop combined animations
  const stopCombinedAnimationPreview = useCallback(() => {
    if (combinedAnimationTimeline) {
      combinedAnimationTimeline.kill();
      setCombinedAnimationTimeline(null);
    }

    // Reset letter sprites to original state
    letterSprites.forEach(sprite => {
      const letterElement = letterRefs.current[sprite.id];
      if (letterElement) {
        gsap.set(letterElement, {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          rotationY: 0,
          opacity: 1
        });
      }
    });

    // Reset symbol sprites to original state
    symbolSprites.forEach(sprite => {
      const symbolElement = letterRefs.current[sprite.id];
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
    });
  }, [combinedAnimationTimeline, letterSprites, symbolSprites]);

  useEffect(() => {
    return () => {
      animationTimelinesRef.current.forEach((timeline) => {
        timeline.kill();
      });
      animationTimelinesRef.current.clear();
      symbolAnimationsRef.current.clear();
      
      if (previewTimelineRef.current) {
        previewTimelineRef.current.kill();
      }
      
      if (combinedAnimationTimeline) {
        combinedAnimationTimeline.kill();
      }
    };
  }, [combinedAnimationTimeline]);

  const handleSymbolSelect = useCallback((symbol: StoredSymbol) => {
    setSelectedSymbol(symbol);
    stopAnimationPreview();
    stopCombinedAnimationPreview();
    setSelectedLetterAnimation(null);
    processLetterSprites(symbol);    
    const existingAnimation = symbolAnimationsRef.current.get(symbol.id);
    if (existingAnimation) {
      setIsPreviewPlaying(true);
      setSelectedAnimationTemplate(existingAnimation);
    } else {
      setIsPreviewPlaying(false);
    }
    
    // Scroll the selected symbol into view in the carousel
    setTimeout(() => {
      const el = symbolRefs.current[symbol.id];
      if (el && scrollContainerRef.current) {
        try {
          el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        } catch (e) {
          // fallback: adjust scrollLeft
          const parent = scrollContainerRef.current;
          parent.scrollLeft = el.offsetLeft - parent.clientWidth / 2 + el.clientWidth / 2;
        }
      }
    }, 120);
  }, [selectedAnimationTemplate, stopAnimationPreview, playAnimationPreview, processLetterSprites, stopCombinedAnimationPreview]);

  // Update scroll progress for the small scrollbar indicator
  const onCarouselScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const wheelHandler = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };

    el.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      el.removeEventListener('wheel', wheelHandler as EventListener);
    };
  }, []);

  const playCombinedAnimationPreview = useCallback(() => {
    if (!selectedSymbol) return;

    if (combinedAnimationTimeline) {
      combinedAnimationTimeline.kill();
    }

    const timeline = gsap.timeline({ repeat: -1 });

    if (selectedAnimationTemplate && symbolSprites.length > 0) {
      symbolSprites.forEach(sprite => {
        const symbolElement = letterRefs.current[sprite.id];
        if (!symbolElement) return;

        applySymbolAnimation(timeline, symbolElement, selectedAnimationTemplate.id, 0);
      });
    }

    if (selectedLetterAnimation && letterSprites.length > 0) {
      letterSprites.forEach((sprite, index) => {
        const letterElement = letterRefs.current[sprite.id];
        if (!letterElement) return;

        switch (selectedLetterAnimation.effect) {
          case 'sequential-fade-in':
            timeline.fromTo(letterElement,
              { opacity: 0 },
              { opacity: 1, duration: 0.3, ease: "power2.out" },
              index * 0.1
            );
            break;
          case 'wave-y-offset':
            timeline.to(letterElement, {
              y: -15,
              duration: 0.6,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1
            }, index * 0.1);
            break;
          case 'scale-from-zero':
            timeline.fromTo(letterElement,
              { scale: 0 },
              { scale: 1, duration: 0.4, ease: "back.out(1.7)" },
              index * 0.1
            );
            break;
          case 'slide-x-offset':
            timeline.fromTo(letterElement,
              { x: -50, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
              index * 0.1
            );
            break;
          case 'rotate-y-flip':
            timeline.fromTo(letterElement,
              { rotationY: 90, opacity: 0 },
              { rotationY: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
              index * 0.1
            );
            break;
          case 'bounce-scale':
            timeline.fromTo(letterElement,
              { scale: 0, y: 20 },
              { scale: 1, y: 0, duration: 0.6, ease: "bounce.out" },
              index * 0.1
            );
            break;
          default:
            timeline.to(letterElement, {
              y: -10,
              duration: 0.8,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1
            }, index * 0.1);
            break;
        }
      });
    }

    // 3. Show combined effect in carousel symbol
    const carouselSymbolElement = symbolRefs.current[selectedSymbol.id];
    if (carouselSymbolElement) {
      // Add a combined glow effect to indicate both animations are active
      const glowColor = selectedAnimationTemplate && selectedLetterAnimation
        ? 'rgba(147, 51, 234, 0.6)' // Purple for both
        : selectedAnimationTemplate
          ? 'rgba(34, 197, 94, 0.6)' // Green for symbol only
          : 'rgba(59, 130, 246, 0.6)'; // Blue for letter only

      timeline.to(carouselSymbolElement, {
        filter: `drop-shadow(0 0 12px ${glowColor})`,
        duration: 0.8,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      }, 0);
    }

    setCombinedAnimationTimeline(timeline);
  }, [selectedSymbol, selectedAnimationTemplate, selectedLetterAnimation, symbolSprites, letterSprites, combinedAnimationTimeline]);

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

    } catch (error) {
      console.error('[Step5] Error applying animation:', error);
    } finally {
      setIsApplying(false);
    }
  }, [selectedSymbol, selectedAnimationTemplate, selectedLetterAnimation, config, updateConfig]);

  // Apply currently selected animation template to every symbol
  const handleApplyAnimationToAll = useCallback(async () => {
    if (!selectedAnimationTemplate || symbols.length === 0) return;

    setIsApplying(true);
    try {
      const template = selectedAnimationTemplate;
      const currentWinAnimations = config?.winAnimations || {};
      const updatedSymbolAnimations = { ...currentWinAnimations.symbolAnimations };
      const timestamp = Date.now();

      symbols.forEach((symbol) => {
        const symbolElement = symbolRefs.current[symbol.id];

        // Reset and apply GSAP timeline to the carousel preview element
        if (symbolElement) {
          const existingTimeline = animationTimelinesRef.current.get(symbol.id);
          if (existingTimeline) {
            existingTimeline.kill();
          }
          gsap.set(symbolElement, {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            opacity: 1,
            filter: 'none'
          });

          const timeline = gsap.timeline({ repeat: -1 });
          applySymbolAnimation(timeline, symbolElement, template.id);
          animationTimelinesRef.current.set(symbol.id, timeline);
        }

        symbolAnimationsRef.current.set(symbol.id, template);
        updatedSymbolAnimations[symbol.id] = {
          animationTemplate: template.id,
          letterAnimation: null,
          animationConfig: {
            template: template.gsapConfig,
            letterEffect: null
          },
          lastAnimationUpdate: timestamp
        };
      });

      updateConfig({
        winAnimations: {
          ...currentWinAnimations,
          symbolAnimations: updatedSymbolAnimations
        }
      });

      window.dispatchEvent(new CustomEvent('animationTemplateChanged', {
        detail: {
          applyAll: true,
          animationTemplate: template.id
        }
      }));

      setIsPreviewPlaying(true);
    } catch (error) {
      console.error('[Step5] Error applying animation to all symbols:', error);
    } finally {
      setIsApplying(false);
    }
  }, [selectedAnimationTemplate, symbols, config, updateConfig]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex ">
        {/* Main Panel - Symbol Carousel & Animation Controls */}
        <div className="flex-1 bg-white border-gray-200 flex flex-col">
          <div className="bg-white ">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-2">
              <div className="px-4 py-3 border-b border-gray-200  border-l-4 border-l-red-500 bg-gray-50">
                <h1 className="text-xl font-bold text-gray-900 uw:text-4xl">Animation Studio</h1>
                <p className="text-sm text-gray-600 uw:text-3xl">Apply animations to your symbols and see them in action </p>
              </div>
            </div>
          </div>
          {/* Symbol Carousel */}
          <div className="p-2">
            <div className=' border p-4 rounded-md bg-gray-50'>
            <h3 className="text-sm font-semibold text-gray-900 uw:text-3xl mb-3">Select Symbol</h3>

            {/* Symbol Filter Buttons */}
            {symbols.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {(['all', 'wild', 'scatter', 'high', 'medium', 'low'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setSymbolFilter(filter);
                    }}
                    className={`px-2 py-1 text-xs rounded uw:text-3xl transition-all ${
                      symbolFilter === filter
                        ? 'bg-purple-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-purple-100'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    {filter !== 'all' && (
                      <span className="ml-1 text-xs uw:text-2xl opacity-75">
                        ({symbols.filter(s => {
                          if (filter === 'wild') return s.type === 'wild' || s.type === 'wild 2';
                          if (filter === 'scatter') return s.type === 'scatter';
                          if (filter === 'high') return s.type.startsWith('high');
                          if (filter === 'medium') return s.type.startsWith('medium');
                          if (filter === 'low') return s.type.startsWith('low');
                          return s.type === filter;
                        }).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const currentIndex = filteredSymbols.findIndex(s => s.id === selectedSymbol?.id);
                  const prevIndex = Math.max(0, currentIndex - 1);
                  if (filteredSymbols[prevIndex]) {
                    handleSymbolSelect(filteredSymbols[prevIndex]);
                  }
                }}
                disabled={!selectedSymbol || filteredSymbols.findIndex(s => s.id === selectedSymbol.id) === 0}
                className="p-1 rounded border disabled:opacity-50 uw:h-[120px] uw:w-[120px] uw:p-3 uw:text-5xl"
              >
                ←
              </button>

              <div className="flex-1">
                <div
                  ref={scrollContainerRef}
                  onScroll={onCarouselScroll}
                  className="overflow-x-auto max-h-52 uw:max-h-96"
                >
                  <div className="flex gap-2 py-2 snap-x snap-mandatory">
                  {(!symbols || !Array.isArray(symbols) || symbols.length === 0) ? (
                <div className="col-span-3 text-center py-4 text-gray-500">
                  <div className="text-2xl mb-2">🎨</div>
                  <p className="text-sm uw:text-2xl">No symbols found</p>
                  <p className="text-xs uw:text-2xl">Create symbols in Step 4 first</p>
                  {/* Debug info */}
                  <p className="text-xs text-red-500 mt-2 uw:text-2xl">
                    Debug: symbols = {symbols ? `Array(${symbols.length})` : 'null/undefined'}
                  </p>
                  <p className="text-xs text-blue-500 mt-1 uw:text-2xl">
                    {debugInfo}
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        loadSymbols();
                      }}
                      className="px-3 py-1 bg-blue-500 text-white uw:text-2xl text-xs rounded hover:bg-blue-600"
                    >
                      Reload Symbols
                    </button>
                    <button
                      onClick={() => {
                        const storeSymbols = config?.theme?.generated?.symbols;
                        if (!storeSymbols) return;

                        let convertedSymbols: StoredSymbol[] = [];

                        if (Array.isArray(storeSymbols)) {
                          // Legacy array format
                          const types: Array<'wild' | 'wild 2' | 'scatter' | 'high 1' | 'high 2' | 'high 3' | 'high 4' | 'medium 1' | 'medium 2' | 'medium 3' | 'medium 4' | 'low 1' | 'low 2' | 'low 3' | 'low 4'> = [
                            'wild', 'scatter', 'high 1', 'high 2', 'high 3', 'high 4', 
                            'medium 1', 'medium 2', 'medium 3', 'medium 4', 
                            'low 1', 'low 2', 'low 3', 'low 4'
                          ];
                          const typeCounts: Record<string, number> = {};

                          convertedSymbols = storeSymbols.map((imageUrl, index) => {
                            const type = types[Math.min(index, types.length - 1)] || 'medium 1';
                            typeCounts[type] = (typeCounts[type] || 0) + 1;
                            const id = `${type.replace(/\s+/g, '')}_${typeCounts[type]}`;
                            
                            return {
                              id,
                              name: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
                              type,
                              image: imageUrl,
                              weight: 1,
                              isWild: type === 'wild' || type === 'wild 2',
                              isScatter: type === 'scatter'
                            };
                          });
                        } else if (typeof storeSymbols === 'object') {
                          // Object format with keys
                          convertedSymbols = Object.entries(storeSymbols).map(([key, imageUrl]) => {
                            let type: StoredSymbol['type'] = 'medium 1';
                            let name = key;

                            if (key.toLowerCase().startsWith('wild')) {
                              const match = key.match(/(\d+)$/);
                              if (match) {
                                type = match[1] === '2' ? 'wild 2' : 'wild';
                                name = `Wild ${match[1] || ''}`.trim();
                              } else {
                                type = 'wild';
                                name = 'Wild';
                              }
                            } else if (key.toLowerCase().startsWith('scatter')) {
                              type = 'scatter';
                              name = 'Scatter';
                            } else if (key.toLowerCase().startsWith('high')) {
                              const match = key.match(/(\d+)$/);
                              const num = match ? match[1] : '1';
                              type = `high ${num}` as StoredSymbol['type'];
                              name = `High ${num}`;
                            } else if (key.toLowerCase().startsWith('medium')) {
                              const match = key.match(/(\d+)$/);
                              const num = match ? match[1] : '1';
                              type = `medium ${num}` as StoredSymbol['type'];
                              name = `Medium ${num}`;
                            } else if (key.toLowerCase().startsWith('low')) {
                              const match = key.match(/(\d+)$/);
                              const num = match ? match[1] : '1';
                              type = `low ${num}` as StoredSymbol['type'];
                              name = `Low ${num}`;
                            }

                            return {
                              id: key,
                              name,
                              type,
                              image: imageUrl as string,
                              weight: 1,
                              isWild: type === 'wild' || type === 'wild 2',
                              isScatter: type === 'scatter'
                            };
                          });
                        }

                        if (convertedSymbols.length > 0) {
                          setSymbols(convertedSymbols);
                          symbolsLoadedRef.current = config?.gameId || config?.displayName || 'default';
                          setDebugInfo(`Force loaded from store: ${convertedSymbols.length}`);
                        }
                      }}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      Load from Store
                    </button>
                    <button
                      onClick={() => {
                        const gameId = config?.gameId || config?.displayName || 'default';
                        const storageKey = `slotai_symbols_${gameId}`;
                        const stored = localStorage.getItem(storageKey);
                        if (stored) {
                          try {
                            const parsed = JSON.parse(stored);
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
                            id: 'test_high1',
                            name: 'High 1',
                            type: 'high 1',
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
                filteredSymbols.map((symbol) => {
                  const hasAnimation = symbolAnimationsRef.current.has(symbol.id);
                  const symbolAnimation = symbolAnimationsRef.current.get(symbol.id);
                  const isSelected = selectedSymbol?.id === symbol.id;
                  const isAnimated = hasAnimation || (isSelected && isPreviewPlaying);
                  
                  return (
                  <button
                    key={symbol.id}
                    onClick={() => handleSymbolSelect(symbol)}
                    className={`relative rounded-lg border-2 flex items-center justify-center flex-shrink-0 snap-start overflow-hidden transition-all px-1 py-1 w-1/4 min-w-[24%] ${isSelected
                        ? isPreviewPlaying || hasAnimation
                          ? 'border-green-500 ring-2 ring-green-200 shadow-lg'
                          : 'border-purple-500 ring-2 ring-purple-200'
                        : hasAnimation
                          ? 'border-green-300 ring-1 ring-green-100'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    style={{ aspectRatio: '1 / 1' }}
                  >
                    <img
                      ref={(el) => {
                        symbolRefs.current[symbol.id] = el;
                      }}
                      src={symbol.image}
                      alt={symbol.name}
                      className="w-4/5 h-4/5 object-contain mx-auto"
                      style={{
                        transformOrigin: 'center center',
                        willChange: 'transform, opacity, filter'
                      }}
                    />
                    <div className="absolute  inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all" />
                    {hasAnimation && (
                      <div className="absolute top-1 right-1 w-3 h-3 uw:w-6 uw:h-6 rounded-full bg-green-500" />
                    )}
                    {isSelected && !hasAnimation && (
                      <div className={`absolute top-1 right-1 w-3 h-3 uw:w-6 uw:h-6 rounded-full ${isPreviewPlaying ? 'bg-green-500' : 'bg-purple-500'}`} />
                    )}
                    {isAnimated && (symbolAnimation || selectedAnimationTemplate) && (
                      <div className="absolute top-1 left-1 px-1 py-0.5 bg-green-500 text-white text-xs rounded">
                        {(symbolAnimation || selectedAnimationTemplate)?.preview}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 uw:text-3xl text-white text-xs p-1">
                      <div className="truncate">{symbol.name}</div>
                      <div className="text-xs uw:text-2xl opacity-75">{symbol.type}</div>
                    </div>
                  </button>
                  );
                })
              )}
                  </div>
                </div>

                {/* progress indicator removed as requested */}
              </div>

              <button
                onClick={() => {
                  const currentIndex = filteredSymbols.findIndex(s => s.id === selectedSymbol?.id);
                  const nextIndex = Math.min(filteredSymbols.length - 1, currentIndex + 1);
                  if (filteredSymbols[nextIndex]) {
                    handleSymbolSelect(filteredSymbols[nextIndex]);
                  }
                }}
                disabled={!selectedSymbol || filteredSymbols.findIndex(s => s.id === selectedSymbol.id) === filteredSymbols.length - 1}
                className="p-1 rounded border disabled:opacity-50 uw:h-[120px] uw:w-[120px] uw:p-3 uw:text-5xl"
              >
                →
              </button>
            </div>
            {selectedSymbol && (
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 uw:text-3xl">{selectedSymbol.name}</p>
                    <p className="text-xs text-gray-600 capitalize uw:text-2xl">{selectedSymbol.type}</p>
                  </div>
                  {isPreviewPlaying && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      ▶ Playing
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  {selectedSymbol.isWild && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded uw:text-2xl">Wild</span>}
                  {selectedSymbol.isScatter && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Scatter</span>}
                </div>

                {/* Sprite Detection Results */}
                {(letterSprites.length > 0 || symbolSprites.length > 0) && (
                  <div className="mb-3 p-2 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium text-gray-700">
                        Detected Sprites ({letterSprites.length + symbolSprites.length})
                      </h4>
                      {isProcessingSprites && (
                        <span className="text-xs text-blue-600">Processing...</span>
                      )}
                    </div>

                    {/* Symbol Sprites */}
                    {symbolSprites.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-600 mb-1">Symbols ({symbolSprites.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {symbolSprites.map((sprite, index) => (
                            <div key={sprite.id} className="relative group">
                              <img
                                ref={(el) => {
                                  if (el) letterRefs.current[sprite.id] = el;
                                }}
                                src={sprite.imageData}
                                alt={`Symbol ${index + 1}`}
                                className="w-10 h-10 object-contain border border-green-200 rounded bg-white"
                                style={{
                                  transformOrigin: 'center center',
                                  willChange: 'transform, opacity'
                                }}
                              />
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                                💎
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Letter Sprites */}
                    {letterSprites.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Letters ({letterSprites.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {letterSprites.map((sprite, index) => (
                            <div key={sprite.id} className="relative group">
                              <img
                                ref={(el) => {
                                  if (el) letterRefs.current[sprite.id] = el;
                                }}
                                src={sprite.imageData}
                                alt={`Letter ${index + 1}`}
                                className="w-8 h-8 object-contain border border-blue-200 rounded bg-white"
                                style={{
                                  transformOrigin: 'center center',
                                  willChange: 'transform, opacity'
                                }}
                              />
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Combined Animation Controls */}
                {(selectedAnimationTemplate || selectedLetterAnimation) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        if (combinedAnimationTimeline) {
                          stopCombinedAnimationPreview();
                          setIsPreviewPlaying(false);
                        } else {
                          playCombinedAnimationPreview();
                          setIsPreviewPlaying(true);
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                    >
                      {combinedAnimationTimeline ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {combinedAnimationTimeline ? 'Pause' : 'Play Combined'}
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
                      {selectedAnimationTemplate?.name || selectedLetterAnimation?.name || 'Combined Animation'}
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uw:text-4xl">Animation Templates</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleApplyAnimationToAll}
                  disabled={!selectedAnimationTemplate || isApplying || symbols.length === 0}
                  className={`px-3 py-1 text-xs bg-white hover:bg-gray-100 rounded border border-gray-300 text-gray-700 uw:text-2xl uw:px-4 uw:py-2 transition-colors ${
                    !selectedAnimationTemplate ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  Apply to All
                </button>
                <button
                onClick={() => {
                  if (selectedSymbol && symbolAnimationsRef.current.has(selectedSymbol.id)) {
                    // Get the animation before removing it
                    const existingAnimation = symbolAnimationsRef.current.get(selectedSymbol.id);
                    // Remove animation from selected symbol only
                    stopSymbolAnimation(selectedSymbol.id);
                    // Clear selected template if it matches the removed animation
                    if (existingAnimation && selectedAnimationTemplate?.id === existingAnimation.id) {
                      setSelectedAnimationTemplate(null);
                    }
                    setIsPreviewPlaying(false);
                    stopCombinedAnimationPreview();
                  }
                }}
                disabled={!selectedSymbol || !symbolAnimationsRef.current.has(selectedSymbol.id)}
                className="px-3 py-1 text-xs bg-white hover:bg-gray-100 rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed uw:text-2xl uw:px-4 uw:py-2 transition-colors"
              >
                🚫 No Animation
              </button>
              </div>
            </div>
            {/* <div className="space-y-2 max-h-64 overflow-y-auto"> */}
            <div className="grid grid-cols-2 gap-2 uw:gap-3">
              {ANIMATION_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedAnimationTemplate(template);
                    // Stop combined animation preview
                    stopCombinedAnimationPreview();
                    // Apply animation persistently to the selected symbol
                    if (selectedSymbol) {
                      // Apply the animation immediately and persistently
                      playAnimationPreview(template, selectedSymbol.id);
                      setIsPreviewPlaying(true);
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
                  <div className="flex items-center gap-3 uw:gap-6">
                    <span className="text-lg uw:text-4xl px-2">{template.preview}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 uw:text-3xl">{template.name}</p>
                      <p className="text-xs text-gray-600 uw:text-2xl">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Animation Test */}
          {selectedSymbol && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-xs font-medium text-blue-900 mb-2 uw:text-4xl">Quick Test</h4>
              <div className="flex flex-wrap gap-1">
                {ANIMATION_TEMPLATES.slice(0, 4).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      // Quick Test now persists animations (changed from false to true)
                      setSelectedAnimationTemplate(template);
                      stopCombinedAnimationPreview();
                      playAnimationPreview(template, selectedSymbol?.id, true);
                      setIsPreviewPlaying(true);
                    }}
                    className="px-2 py-1 text-xs bg-white hover:bg-blue-100 rounded border uw:text-3xl border-blue-200 transition-colors"
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 uw:text-4xl">Letter Animations</h3>
              <div className="flex items-center gap-2">
                {letterSprites.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {letterSprites.length} letters detected
                  </span>
                )}
                {combinedAnimationTimeline && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    ▶ Playing
                  </span>
                )}
                {isProcessingSprites && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Processing...
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LETTER_ANIMATIONS.map((animation) => (
                <button
                  key={animation.id}
                  disabled={letterSprites.length === 0}
                  onClick={() => {
                    setSelectedLetterAnimation(animation);
                    // Stop any current animation when selecting new letter animation
                    stopCombinedAnimationPreview();
                    setIsPreviewPlaying(false);
                  }}

                    className={`
                    flex items-center gap-1 w-ful rounded-lg border p-1 min-w-[200px] transition-all duration-200
                    ${letterSprites.length === 0
                      ? 'cursor-not-allowed opacity-50 border-gray-200 bg-gray-100'
                      : 'cursor-pointer hover:shadow-md'
                    }
                    ${selectedLetterAnimation?.id === animation.id && letterSprites.length > 0
                          ? 'border-red-300 bg-red-50 border'
                          : letterSprites.length > 0
                            ? 'border-gray-200 bg-white hover:border-red-200'
                            : 'border-gray-200 bg-gray-100'
                        }
                  `}

                >
                  <div className="flex items-center gap-3 ">
                    <span className="text-lg uw:text-4xl">{animation.preview}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 uw:text-3xl">{animation.name}</p>
                      <p className="text-xs text-gray-600 uw:text-2xl">{animation.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {letterSprites.length === 0 && selectedSymbol && !isProcessingSprites && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 uw:text-3xl">No letter sprites detected</p>
                    <p className="text-xs text-yellow-700 uw:text-2xl">
                      Letter animations work best with symbols containing text (like WILD, SCATTER, etc.)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Apply Button */}
          <div className="p-4 border-t border-gray-200">
            <Button
            variant='generate'
            className='w-full py-2 uw:text-3xl uw:pb-4'
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
