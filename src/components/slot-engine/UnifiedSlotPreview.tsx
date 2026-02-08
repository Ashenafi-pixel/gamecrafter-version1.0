import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../../engine/GameEngine';
import { IGameConfiguration } from '../../engine/types/types';
import { useGameStore } from '../../store';
import { detectDeviceType, DeviceType } from '../../utils/deviceDetection';
import SlotGameUI from '../visual-journey/slot-animation/SlotGameUI';

interface UnifiedSlotPreviewProps {
  stepSource?: string;
  symbolsOverride?: string[];
  className?: string;
  width?: number;
  height?: number;
  hideControls?: boolean;
  orientation?: 'portrait' | 'landscape';
  isMobile?: boolean;
  onSpinResult?: (result: { totalWin: number }) => void;
}

/**
 * Unified Slot Preview Component
 * 
 * This component acts as the single source of truth for slot previews across all steps.
 * It uses the new GameEngine for centralized state management and proper lifecycle handling.
 * 
 * Features:
 * 1. Single GameEngine instance management
 * 2. Proper event coordination between steps
 * 3. Canvas lifecycle to prevent WebGL corruption
 * 4. Symbol updates from various sources
 * 5. Centralized state management through GameEngine
 * 
 * Usage:
 * - Step 3: <UnifiedSlotPreview stepSource="step3" />
 * - Step 4: <UnifiedSlotPreview stepSource="step4" symbolsOverride={generatedSymbols} />
 * - Step 5: <UnifiedSlotPreview stepSource="step5" />
 * - Step 7: <UnifiedSlotPreview stepSource="step7" hideControls={true} />
 */
export const UnifiedSlotPreview: React.FC<UnifiedSlotPreviewProps> = ({
  stepSource = 'unknown',
  symbolsOverride,
  className = '',
  width = 1200,
  height = 800,
  hideControls = false,
  orientation = 'portrait',
  isMobile = false,
  onSpinResult
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [lastWin, setLastWin] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const mountedRef = useRef(false); // Track component mount status
  const initializationRef = useRef(false); // Track if initialization is in progress

  // Get game configuration from store
  const config = useGameStore(state => state.config);
  // IMPORTANT: Always use the store's grid configuration, no defaults
  const reels = config?.reels?.layout?.reels ?? 5;
  const rows = config?.reels?.layout?.rows ?? 3;
  const gameName = config?.name || 'Slot Game';
  const themeSymbols = config?.theme?.generated?.symbols || [];
  
  // Debug logging for grid changes
  useEffect(() => {
    console.log(`[UnifiedSlotPreview] Grid config from store: ${reels}x${rows} (stepSource: ${stepSource})`);
    console.log(`[UnifiedSlotPreview] Full reels config:`, config?.reels);
    console.log(`[UnifiedSlotPreview] Using default fallback? reels: ${!config?.reels?.layout?.reels}, rows: ${!config?.reels?.layout?.rows}`);
  }, [reels, rows, stepSource, config?.reels]);

  // Use override symbols if provided, otherwise use theme symbols
  const symbols = symbolsOverride || themeSymbols;
  
  // Debug logging for symbols in Step 4 and Step 5
  useEffect(() => {
    if (stepSource === 'step4') {
      console.log(`[UnifiedSlotPreview] Step 4 - symbolsOverride:`, symbolsOverride);
      console.log(`[UnifiedSlotPreview] Step 4 - themeSymbols:`, themeSymbols);
      console.log(`[UnifiedSlotPreview] Step 4 - final symbols:`, symbols);
      console.log(`[UnifiedSlotPreview] Step 4 - symbols length:`, symbols.length);
    } else if (stepSource === 'step5') {
      console.log(`[UnifiedSlotPreview] Step 5 - symbolsOverride:`, symbolsOverride);
      console.log(`[UnifiedSlotPreview] Step 5 - themeSymbols:`, themeSymbols);
      console.log(`[UnifiedSlotPreview] Step 5 - final symbols:`, symbols);
      console.log(`[UnifiedSlotPreview] Step 5 - symbols length:`, symbols.length);
    }
  }, [stepSource, symbolsOverride, themeSymbols, symbols]);
  
  // Handle orientation changes
  useEffect(() => {
    if (engineRef.current && engineRef.current.renderer && isInitialized) {
      console.log(`[UnifiedSlotPreview] Orientation changed to ${orientation} (mobile: ${isMobile})`);
      const renderer = engineRef.current.renderer as any;
      
      // Update renderer orientation if method exists
      if (renderer.setOrientation) {
        renderer.setOrientation(orientation, isMobile);
      }
      
      // Force resize to recalculate layout
      if (containerRef.current) {
        renderer.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    }
  }, [orientation, isMobile, isInitialized]);

  // Build game configuration
  console.log(`[UnifiedSlotPreview] Building game config with ${symbols.length} symbols:`, symbols);
  const gameConfig: IGameConfiguration = {
    reels,
    rows,
    symbols: symbols.map((symbolUrl, index) => ({
      id: `symbol_${index}`,
      name: `Symbol ${index}`,
      image: symbolUrl,
      payout: [0, 0, 5, 10, 20] // Default payouts for now
    })),
    paylines: [
      // Default paylines based on grid size
      { id: 1, positions: Array.from({ length: reels }, (_, i) => [i, Math.floor(rows / 2)]) }, // Middle line
      { id: 2, positions: Array.from({ length: reels }, (_, i) => [i, 0]) }, // Top line
      { id: 3, positions: Array.from({ length: reels }, (_, i) => [i, rows - 1]) }  // Bottom line
    ],
    betLevels: [1, 2, 5, 10, 20],
    coinValues: [0.01, 0.02, 0.05, 0.10, 0.25],
    defaultBet: 1,
    defaultCoinValue: 0.10,
    rtp: config?.math?.baseRTP || 96.5,
    volatility: config?.math?.volatility || 'medium'
  };

  // Initialize engine
  useEffect(() => {
    console.log(`[UnifiedSlotPreview] Initialization effect running for ${stepSource}, isMounted:`, isMounted, 'isInitialized:', isInitialized);
    
    if (!isMounted) {
      console.log(`[UnifiedSlotPreview] Not mounted yet, waiting...`);
      return;
    }
    
    // Add delay to prevent rapid initialization attempts
    const initTimer = setTimeout(() => {
      if (!mountedRef.current) {
        console.log(`[UnifiedSlotPreview] Component unmounted during init delay, aborting`);
        return;
      }

    const initEngine = async () => {
      // Prevent duplicate initialization
      if (initializationRef.current || isInitialized || engineRef.current) {
        console.log('[UnifiedSlotPreview] Initialization already in progress or completed, engineRef exists:', !!engineRef.current);
        return;
      }
      
      initializationRef.current = true;
      
      try {
        setError(null);
        console.log(`[UnifiedSlotPreview] Starting GameEngine initialization from ${stepSource} with config:`, gameConfig);
        
        // Ensure container is ready and has dimensions
        if (!containerRef.current) {
          console.error('[UnifiedSlotPreview] Container ref not ready');
          setError('Container element not ready');
          initializationRef.current = false;
          return;
        }
        
        // Force layout calculation
        containerRef.current.style.display = 'block';
        const rect = containerRef.current.getBoundingClientRect();
        console.log('[UnifiedSlotPreview] Container rect:', rect);
        
        // Validate container dimensions
        if (rect.width === 0 || rect.height === 0) {
          console.error('[UnifiedSlotPreview] Container has zero dimensions:', rect);
          setError('Container has zero dimensions');
          initializationRef.current = false;
          return;
        }
        
        // Destroy existing engine if any
        if (engineRef.current) {
          console.log('[UnifiedSlotPreview] Destroying existing engine');
          engineRef.current.destroy();
          engineRef.current = null;
        }

        // Create new engine instance
        const engine = new GameEngine();
        engineRef.current = engine;

        // Initialize with container and config
        console.log('[UnifiedSlotPreview] About to call engine.initialize...');
        
        // Use a timeout to ensure we don't hang indefinitely
        try {
          await Promise.race([
            engine.initialize(gameConfig, containerRef.current),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('GameEngine initialization timeout')), 30000)
            )
          ]);
          console.log('[UnifiedSlotPreview] engine.initialize completed successfully');
        } catch (initError) {
          console.warn('[UnifiedSlotPreview] GameEngine initialization issue:', initError);
          // Continue anyway - the visuals might still work
        }
        
        // Set initial orientation if renderer supports it
        const renderer = engine.renderer as any;
        if (renderer.setOrientation) {
          renderer.setOrientation(orientation, isMobile);
        }
        
        // Store reference again to ensure it's not lost
        engineRef.current = engine;
        
        // Set up Animation Studio integration
        console.log('🎨 Setting up Animation Studio integration');
        
        // Listen for animation settings changes from Step 6
        const handleAnimationUpdate = (event: CustomEvent) => {
          const { settings } = event.detail || {};
          if (settings && engineRef.current) {
            console.log('🎨 Received animation settings update:', settings);
            engineRef.current.updateAnimationSettings(settings);
          }
        };
        
        // Add event listener for real-time animation updates
        window.addEventListener('animationSettingsChanged', handleAnimationUpdate);
        
        // Clean up listener on unmount
        const cleanup = () => {
          window.removeEventListener('animationSettingsChanged', handleAnimationUpdate);
        };
        
        // Store cleanup function for later use
        (window as any).cleanupAnimationListeners = cleanup;
        
        // Expose renderer globally for Animation Studio integration
        if (engine.renderer) {
          console.log('[UnifiedSlotPreview] Exposing PixiJS renderer globally for Animation Studio');
          console.log('[UnifiedSlotPreview] Renderer methods available:', Object.getOwnPropertyNames(engine.renderer).filter(name => typeof engine.renderer[name] === 'function'));
          console.log('[UnifiedSlotPreview] Checking for Animation Studio methods:', {
            applyMaskControls: typeof engine.renderer.applyMaskControls,
            applyAnimationControls: typeof engine.renderer.applyAnimationControls,
            applyVisualEffects: typeof engine.renderer.applyVisualEffects
          });
          
          (window as any).PIXI_RENDERER_INSTANCE = engine.renderer;
          // Also store the engine for broader access
          (window as any).PIXI_GAME_ENGINE = engine;
          
          console.log('[UnifiedSlotPreview] ✅ Global renderer exposed. Animation Studio should be able to connect now.');
        }
        
        // IMMEDIATE logo sync attempt (regardless of initialization status)
        console.log('[UnifiedSlotPreview] Attempting immediate logo sync...');
        try {
          const gameConfig = useGameStore.getState().config;
          if (gameConfig?.logo && engine.renderer) {
            console.log('[UnifiedSlotPreview] Found logo in config, attempting sync:', gameConfig.logo.substring(0, 50) + '...');
            const currentDevice = detectDeviceType();
            const deviceLogoPosition = gameConfig?.logoPositions?.[currentDevice];
            const deviceLogoScale = (gameConfig?.logoScales?.[currentDevice] || 100) / 100;
            await (engine.renderer as any).updateLogo(gameConfig.logo, deviceLogoPosition, deviceLogoScale);
            console.log('[UnifiedSlotPreview] ✅ Immediate logo sync completed');
          } else {
            console.log('[UnifiedSlotPreview] No logo found for immediate sync');
          }
        } catch (logoError) {
          console.warn('[UnifiedSlotPreview] Immediate logo sync failed:', logoError);
        }
        
        // Update background only if explicitly set in Step 5
        if (config?.background?.backgroundImage) {
          const backgroundUrl = config.background.backgroundImage;
          console.log(`[UnifiedSlotPreview] Setting Step 5 background:`, backgroundUrl);
          try {
            await engine.updateBackground(backgroundUrl);
          } catch (err) {
            console.error(`[UnifiedSlotPreview] Failed to set Step 5 background:`, err);
          }
        }
        
        setIsInitialized(true);
        console.log(`[UnifiedSlotPreview] GameEngine initialized successfully from ${stepSource}`, {
          hasLogo: !!useGameStore.getState().config?.logo
        });

        // Test: Force apply background adjustments after initialization
        setTimeout(() => {
          if (engineRef.current) {
            const testAdjustments = { position: { x: 10, y: 10 }, scale: 110, fit: 'cover' as const };
            console.log('🧪 [UnifiedSlotPreview] Testing background adjustments:', testAdjustments);
            try {
              engineRef.current.updateBackgroundAdjustments(testAdjustments);
              console.log('✅ [UnifiedSlotPreview] Test background adjustments applied');
            } catch (err) {
              console.error('❌ [UnifiedSlotPreview] Test background adjustments failed:', err);
            }
          }
        }, 1000);

        // IMMEDIATE logo sync after engine initialization
        console.log('[UnifiedSlotPreview] 🔄 Starting immediate logo sync after engine init...');
        try {
          const gameConfig = useGameStore.getState().config;
          if (gameConfig?.logo && engine.renderer) {
            console.log('[UnifiedSlotPreview] Found logo for immediate sync:', gameConfig.logo.substring(0, 50) + '...');
            const currentDevice = detectDeviceType();
            const deviceLogoPosition = gameConfig?.logoPositions?.[currentDevice];
            const deviceLogoScale = (gameConfig?.logoScales?.[currentDevice] || 100) / 100;
            console.log('[UnifiedSlotPreview] Immediate sync details:', {
              device: currentDevice,
              position: deviceLogoPosition,
              scale: deviceLogoScale
            });
            await (engine.renderer as any).updateLogo(gameConfig.logo, deviceLogoPosition, deviceLogoScale);
            console.log('[UnifiedSlotPreview] ✅ Immediate logo sync completed successfully');
          } else {
            console.log('[UnifiedSlotPreview] ❌ No logo found for immediate sync:', {
              hasConfig: !!gameConfig,
              hasLogo: !!gameConfig?.logo,
              hasRenderer: !!engine.renderer
            });
          }
        } catch (logoError) {
          console.error('[UnifiedSlotPreview] ❌ Immediate logo sync failed:', logoError);
        }

        // Emit initialization event
        window.dispatchEvent(new CustomEvent('slotEngineInitialized', { 
          detail: { source: stepSource, engine } 
        }));

        // Force sync existing assets immediately after initialization
        console.log('[UnifiedSlotPreview] Force syncing assets immediately after init');
        
        // Start logo sync immediately (don't wait for timeout)
        const syncAssets = async () => {
          try {
            // Double-check engine is still available
            if (!engineRef.current || !mountedRef.current) {
              console.log('[UnifiedSlotPreview] Engine or component no longer available for asset sync');
              return;
            }
            
            const gameConfig = useGameStore.getState().config;
            console.log('[UnifiedSlotPreview] LOGO DEBUG - Full game config check:', {
              hasConfig: !!gameConfig,
              logo: gameConfig?.logo ? 'EXISTS' : 'MISSING',
              logoPositions: gameConfig?.logoPositions,
              logoScales: gameConfig?.logoScales,
              configKeys: gameConfig ? Object.keys(gameConfig) : []
            });
            
            // Sync logo if exists
            if (gameConfig?.logo) {
              console.log('[UnifiedSlotPreview] Syncing existing logo:', gameConfig.logo.substring(0, 50) + '...');
              const currentDevice = detectDeviceType();
              const deviceLogoPosition = gameConfig?.logoPositions?.[currentDevice];
              const deviceLogoScale = (gameConfig?.logoScales?.[currentDevice] || 100) / 100;
              console.log('[UnifiedSlotPreview] Logo sync details:', {
                device: currentDevice,
                position: deviceLogoPosition,
                scale: deviceLogoScale
              });
              await engineRef.current!.updateLogo(gameConfig.logo, deviceLogoPosition, deviceLogoScale);
              console.log('[UnifiedSlotPreview] ✅ Logo sync completed');
            } else {
              console.log('[UnifiedSlotPreview] No logo found in config - checking specific keys:', {
                hasLogo: 'logo' in (gameConfig || {}),
                hasLogoPath: 'logoPath' in (gameConfig || {}),
                allKeys: gameConfig ? Object.keys(gameConfig).filter(k => k.includes('logo')) : []
              });
            }
          } catch (err) {
            console.error('[UnifiedSlotPreview] Failed to sync assets after init:', err);
          }
        };
        
        // Call sync immediately and also with multiple delays as backup
        syncAssets();
        setTimeout(syncAssets, 500); // Backup sync
        setTimeout(() => {
          console.log('[UnifiedSlotPreview] 🔄 Final logo sync attempt...');
          syncAssets();
        }, 1000); // Final attempt
        
        initializationRef.current = false;
      } catch (err) {
        console.error(`[UnifiedSlotPreview] Failed to initialize GameEngine from ${stepSource}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to initialize game engine');
        initializationRef.current = false;
      }
    };

    // Initialize immediately if container is ready
    if (containerRef.current) {
      console.log(`[UnifiedSlotPreview] Container ready, initializing immediately for ${stepSource}`);
      initEngine();
    } else {
      // Initialize with a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        console.log(`[UnifiedSlotPreview] Delayed init check for ${stepSource} - containerRef:`, !!containerRef.current);
        if (containerRef.current) {
          initEngine();
        } else {
          console.log(`[UnifiedSlotPreview] Container still not ready after delay`);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
    }, 200); // 200ms delay to prevent rapid re-initialization
    
    return () => clearTimeout(initTimer);
  }, [stepSource, isMounted]); // Re-run when stepSource or mount status changes

  // Store previous grid config to detect changes
  const prevGridRef = useRef({ reels, rows });

  // Update grid when configuration changes
  useEffect(() => {
    // Skip if not initialized yet
    if (!isInitialized || !isMounted) {
      console.log(`[UnifiedSlotPreview] Skipping grid update - not initialized yet`);
      return;
    }

    // Check if grid actually changed
    if (prevGridRef.current.reels === reels && prevGridRef.current.rows === rows) {
      console.log(`[UnifiedSlotPreview] Grid unchanged, skipping update`);
      return;
    }

    const updateGrid = async () => {
      // Double-check engine exists at update time
      if (!engineRef.current) {
        console.warn(`[UnifiedSlotPreview] Engine ref lost, checking state:`, {
          engineRef: engineRef.current,
          isInitialized,
          mountedRef: mountedRef.current
        });
        return;
      }
      
      try {
        console.log(`[UnifiedSlotPreview] Updating grid from ${prevGridRef.current.reels}x${prevGridRef.current.rows} to ${reels}x${rows}`);
        await engineRef.current.updateGrid(reels, rows);
        
        // Update previous grid reference
        prevGridRef.current = { reels, rows };

        // Emit grid update event
        window.dispatchEvent(new CustomEvent('slotGridUpdated', { 
          detail: { source: stepSource, reels, rows } 
        }));
        
        console.log(`[UnifiedSlotPreview] Grid update completed successfully`);
        
        // Re-apply symbols if we have them
        if (symbols.length > 0) {
          console.log(`[UnifiedSlotPreview] Re-applying ${symbols.length} symbols after grid update`);
          const symbolConfigs = symbols.map((symbolUrl, index) => ({
            id: `symbol_${index}`,
            name: `Symbol ${index}`,
            image: symbolUrl,
            payout: [0, 0, 5, 10, 20]
          }));
          
          await engineRef.current.updateSymbols(symbolConfigs);
          console.log(`[UnifiedSlotPreview] Symbols re-applied successfully`);
        }
      } catch (err) {
        console.error(`[UnifiedSlotPreview] Failed to update grid from ${stepSource}:`, err);
      }
    };

    // Add a small delay to ensure renderer is ready
    const timer = setTimeout(updateGrid, 300); // Increased delay
    return () => clearTimeout(timer);
  }, [reels, rows, isInitialized, symbols]); // Added symbols to ensure re-application
  
  // Listen for grid config change events from Step 3
  useEffect(() => {
    const handleGridConfigChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.reels && detail?.rows && engineRef.current && isInitialized) {
        console.log(`[UnifiedSlotPreview] Received gridConfigChanged event:`, detail);
        engineRef.current.updateGrid(detail.reels, detail.rows).catch(err => {
          console.error('Failed to update grid from event:', err);
        });
      }
    };
    
    window.addEventListener('gridConfigChanged', handleGridConfigChange);
    return () => window.removeEventListener('gridConfigChanged', handleGridConfigChange);
  }, [isInitialized]); // Only depend on isInitialized to avoid recreating listener

  // Listen for symbol change events from Step 4
  useEffect(() => {
    const handleSymbolsChanged = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log(`[UnifiedSlotPreview] Received symbolsChanged event from ${detail?.source}:`, detail);
      
      if (!engineRef.current || !isInitialized) {
        console.warn(`[UnifiedSlotPreview] Cannot update symbols - engine not ready`);
        return;
      }
      
      // Additional check for engine state
      if (!engineRef.current.isReady()) {
        console.warn(`[UnifiedSlotPreview] Engine exists but not ready - state check failed`);
        return;
      }
      
      // Ignore events from Step 4 when we're in Step 5
      if (stepSource === 'step5' && detail?.source?.includes('generateSymbol')) {
        console.log(`[UnifiedSlotPreview] Ignoring Step 4 symbol event while in Step 5`);
        return;
      }
      
      // Debug the filtering condition
      console.log(`[UnifiedSlotPreview] Event filter check: stepSource="${stepSource}", source="${detail?.source}", should ignore:`, stepSource === 'step4' && detail?.source !== 'uploadSymbol' && !detail?.source?.includes('animation-lab'));
      
      // In Step 4, accept Animation Lab events but ignore other store updates
      if (stepSource === 'step4' && detail?.source !== 'uploadSymbol' && !detail?.source?.includes('animation-lab')) {
        console.log(`[UnifiedSlotPreview] IGNORING ${detail?.source} event in Step 4 - only handling uploadSymbol and animation-lab events`);
        return;
      }
      
      if (detail?.symbols && Array.isArray(detail.symbols) && detail.symbols.length > 0) {
        try {
          console.log(`[UnifiedSlotPreview] Updating engine with ${detail.symbols.length} new symbols via updateSymbols`);
          
          // Use the proper updateSymbols method which updates config
          const symbolConfigs = detail.symbols.map((symbolUrl: string, index: number) => ({
            id: `symbol_${index}`,
            name: `Symbol ${index}`,
            image: symbolUrl,
            payout: [0, 0, 5, 10, 20]
          }));
          
          await engineRef.current.updateSymbols(symbolConfigs, detail.forceRefresh);
          
          console.log(`[UnifiedSlotPreview] Symbols updated successfully in engine`);
        } catch (err) {
          console.error(`[UnifiedSlotPreview] Failed to update symbols:`, err);
        }
      }
    };

    window.addEventListener('symbolsChanged', handleSymbolsChanged);
    return () => window.removeEventListener('symbolsChanged', handleSymbolsChanged);
  }, [isInitialized, reels, rows]);


  // Update symbols when they change
  useEffect(() => {
    if (!engineRef.current || !isInitialized || !isMounted || symbols.length === 0) return;

    // Skip symbols prop updates in Step 4 - only use event-driven updates
    if (stepSource === 'step4') {
      console.log(`[UnifiedSlotPreview] Skipping symbols prop update in Step 4 - using event-driven updates only`);
      return;
    }

    const updateSymbols = async () => {
      try {
        // Additional safety check for engine state
        if (!engineRef.current.isReady()) {
          console.warn(`[UnifiedSlotPreview] Engine not ready for symbol update from ${stepSource}`);
          return;
        }
        
        console.log(`[UnifiedSlotPreview] Updating symbols from ${stepSource}:`, symbols);
        
        // Skip update if we're in Step 5 and engine already has these symbols
        if (stepSource === 'step5') {
          const currentConfig = engineRef.current.getConfig();
          if (currentConfig?.symbols?.length === symbols.length) {
            console.log(`[UnifiedSlotPreview] Skipping symbol update for step5 - already loaded`);
            return;
          }
        }
        
        // Update symbols in engine using the proper method
        const symbolConfigs = symbols.map((symbolUrl, index) => ({
          id: `symbol_${index}`,
          name: `Symbol ${index}`,
          image: symbolUrl,
          payout: [0, 0, 5, 10, 20]
        }));

        await engineRef.current.updateSymbols(symbolConfigs);

        // Emit symbol update event
        window.dispatchEvent(new CustomEvent('slotSymbolsUpdated', { 
          detail: { source: stepSource, symbols } 
        }));
      } catch (err) {
        console.error(`[UnifiedSlotPreview] Failed to update symbols from ${stepSource}:`, err);
      }
    };

    updateSymbols();
  }, [symbols, isInitialized, stepSource]);

  // Sync existing assets from store when PixiJS initializes
  useEffect(() => {
    console.log('[UnifiedSlotPreview] 🔄 Backup sync useEffect triggered:', {
      isInitialized,
      hasEngine: !!engineRef.current,
      stepSource
    });
    
    if (!isInitialized || !engineRef.current) {
      console.log('[UnifiedSlotPreview] Backup sync skipped - not ready:', {
        isInitialized,
        hasEngine: !!engineRef.current
      });
      return;
    }
    
    console.log('[UnifiedSlotPreview] 🚀 Running backup asset sync useEffect');
    const syncExistingAssets = async () => {
      try {
        const gameConfig = useGameStore.getState().config;
        console.log('[UnifiedSlotPreview] BACKUP SYNC - Full game config check:', {
          hasConfig: !!gameConfig,
          logo: gameConfig?.logo,
          logoPositions: gameConfig?.logoPositions,
          logoScales: gameConfig?.logoScales,
          configKeys: gameConfig ? Object.keys(gameConfig) : []
        });
        
        // Sync background if exists
        if (gameConfig?.backgroundPath) {
          console.log('[UnifiedSlotPreview] Syncing existing background with adjustments');

          // Get background adjustments from store
          const backgroundAdjustments = {
            position: gameConfig?.backgroundPosition || { x: 0, y: 0 },
            scale: gameConfig?.backgroundScale || 100,
            fit: gameConfig?.backgroundFit || 'cover'
          };

          console.log('[UnifiedSlotPreview] Applying background adjustments:', backgroundAdjustments);
          await engineRef.current!.updateBackground(gameConfig.backgroundPath, backgroundAdjustments);
        }
        
        // Sync frame if exists
        if (gameConfig?.framePath) {
          console.log('[UnifiedSlotPreview] Syncing existing frame');
          const frameConfig = {
            scale: gameConfig?.frameScale || 1.0,
            position: { 
              x: gameConfig?.framePosition?.x || 0, 
              y: gameConfig?.framePosition?.y || 0 
            },
            stretch: { 
              x: gameConfig?.frameStretch?.x || 1.0, 
              y: gameConfig?.frameStretch?.y || 1.0 
            }
          };
          await engineRef.current!.updateFrame(gameConfig.framePath, frameConfig);
        }
        
        // Sync logo if exists
        if (gameConfig?.logo) {
          console.log('[UnifiedSlotPreview] Syncing existing logo:', gameConfig.logo.substring(0, 50) + '...');
          const currentDevice = detectDeviceType();
          const deviceLogoPosition = gameConfig?.logoPositions?.[currentDevice];
          const deviceLogoScale = (gameConfig?.logoScales?.[currentDevice] || 100) / 100;
          console.log('[UnifiedSlotPreview] Logo sync details:', {
            device: currentDevice,
            position: deviceLogoPosition,
            scale: deviceLogoScale
          });
          await engineRef.current!.updateLogo(gameConfig.logo, deviceLogoPosition, deviceLogoScale);
        } else {
          console.log('[UnifiedSlotPreview] No logo found in config');
        }
        
        // Sync UI buttons if exists
        if (gameConfig?.extractedButtons) {
          console.log('[UnifiedSlotPreview] Syncing existing UI buttons');
          const buttonsWithLayout = {
            ...gameConfig.extractedButtons,
            _layout: gameConfig?.uiButtonLayout || [],
            _metadata: gameConfig?.uiButtonMetadata || {}
          };
          await engineRef.current!.updateUIButtons(buttonsWithLayout);
        }
        
        console.log('[UnifiedSlotPreview] Asset sync completed');
      } catch (error) {
        console.error('[UnifiedSlotPreview] Failed to sync existing assets:', error);
      }
    };
    
    syncExistingAssets();
  }, [isInitialized]);
  
  // Listen for background updates from Step 5
  useEffect(() => {
    const handleBackgroundUpdate = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log(`[UnifiedSlotPreview] Received backgroundUpdated event:`, detail);

      if (!engineRef.current || !isInitialized) {
        console.warn(`[UnifiedSlotPreview] Cannot update background - engine not ready`);
        return;
      }

      if (detail?.backgroundUrl) {
        try {
          console.log(`[UnifiedSlotPreview] Updating background with event data:`, detail);

          // Use adjustments from event if available, otherwise get from store
          let backgroundAdjustments;
          if (detail.position || detail.scale || detail.fit) {
            backgroundAdjustments = {
              position: detail.position || { x: 0, y: 0 },
              scale: detail.scale || 100,
              fit: detail.fit || 'cover'
            };
            console.log(`[UnifiedSlotPreview] Using adjustments from event:`, backgroundAdjustments);
          } else {
            // Fallback to store values
            const gameConfig = useGameStore.getState().config;
            backgroundAdjustments = {
              position: gameConfig?.backgroundPosition || { x: 0, y: 0 },
              scale: gameConfig?.backgroundScale || 100,
              fit: gameConfig?.backgroundFit || 'cover'
            };
            console.log(`[UnifiedSlotPreview] Using adjustments from store:`, backgroundAdjustments);
          }

          await engineRef.current.updateBackground(detail.backgroundUrl, backgroundAdjustments);
          console.log(`✅ [UnifiedSlotPreview] Background updated successfully with adjustments`);
        } catch (err) {
          console.error(`❌ [UnifiedSlotPreview] Failed to update background:`, err);
        }
      }
    };

    window.addEventListener('backgroundUpdated', handleBackgroundUpdate);
    return () => window.removeEventListener('backgroundUpdated', handleBackgroundUpdate);
  }, [isInitialized]);

  // Listen for background adjustments from Step 6
  useEffect(() => {
    const handleBackgroundAdjustments = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log(`🎯 [UnifiedSlotPreview] Background adjustments event received:`, detail);

      if (!engineRef.current || !isInitialized) {
        console.warn(`🎯 [UnifiedSlotPreview] Cannot update background adjustments - engine not ready (initialized: ${isInitialized})`);
        return;
      }

      try {
        const { position, scale, fit, backgroundUrl } = detail;

        if (backgroundUrl) {
          // Update background with new adjustments
          console.log(`🎯 [UnifiedSlotPreview] Updating background with adjustments:`, { position, scale, fit });
          await engineRef.current.updateBackground(backgroundUrl, { position, scale, fit });
        } else {
          // Just update adjustments for existing background
          console.log(`🎯 [UnifiedSlotPreview] Updating background adjustments only:`, { position, scale, fit });
          engineRef.current.updateBackgroundAdjustments({ position, scale, fit });
        }
        console.log(`✅ [UnifiedSlotPreview] Background adjustments applied successfully`);
      } catch (err) {
        console.error(`❌ [UnifiedSlotPreview] Failed to update background adjustments:`, err);
      }
    };

    console.log(`🎯 [UnifiedSlotPreview] Setting up background adjustments listener (initialized: ${isInitialized})`);
    window.addEventListener('backgroundAdjustmentsUpdated', handleBackgroundAdjustments);
    return () => {
      console.log(`🎯 [UnifiedSlotPreview] Removing background adjustments listener`);
      window.removeEventListener('backgroundAdjustmentsUpdated', handleBackgroundAdjustments);
    };
  }, [isInitialized]);

  // Listen for frame updates from Step 5
  useEffect(() => {
    const handleFrameUpdate = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log(`[UnifiedSlotPreview] Received frameUpdated event:`, detail);
      
      if (!engineRef.current || !isInitialized) {
        console.warn(`[UnifiedSlotPreview] Cannot update frame - engine not ready`);
        return;
      }
      
      if (detail?.frameUrl) {
        try {
          console.log(`[UnifiedSlotPreview] Updating frame with configuration`);
          
          // Get frame configuration from store
          const gameConfig = useGameStore.getState().config;
          const frameConfig = {
            scale: gameConfig?.frameScale || 1.0,
            position: { 
              x: gameConfig?.framePosition?.x || 0, 
              y: gameConfig?.framePosition?.y || 0 
            },
            stretch: { 
              x: gameConfig?.frameStretch?.x || 1.0, 
              y: gameConfig?.frameStretch?.y || 1.0 
            }
          };
          
          await engineRef.current.updateFrame(detail.frameUrl, frameConfig);
          console.log(`[UnifiedSlotPreview] Frame updated successfully`);
        } catch (err) {
          console.error(`[UnifiedSlotPreview] Failed to update frame:`, err);
        }
      }
    };
    
    window.addEventListener('frameUpdated', handleFrameUpdate);
    return () => window.removeEventListener('frameUpdated', handleFrameUpdate);
  }, [isInitialized]);

  // Listen for logo updates from Step 5
  useEffect(() => {
    const handleLogoUpdate = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log(`[UnifiedSlotPreview] Received logoUpdated event:`, detail);
      
      if (!engineRef.current || !isInitialized) {
        console.warn(`[UnifiedSlotPreview] Cannot update logo - engine not ready`);
        return;
      }
      
      if (detail?.logoUrl) {
        try {
          console.log(`[UnifiedSlotPreview] Updating logo with device-specific positioning`);
          
          // Get device-specific positioning from store
          const currentDevice = detectDeviceType();
          const gameConfig = useGameStore.getState().config;
          const deviceLogoPosition = gameConfig?.logoPositions?.[currentDevice];
          const deviceLogoScale = (gameConfig?.logoScales?.[currentDevice] || 100) / 100; // Convert percentage to scale
          
          await engineRef.current.updateLogo(detail.logoUrl, deviceLogoPosition, deviceLogoScale);
          console.log(`[UnifiedSlotPreview] Logo updated successfully for device: ${currentDevice}`);
        } catch (err) {
          console.error(`[UnifiedSlotPreview] Failed to update logo:`, err);
        }
      }
    };
    
    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => window.removeEventListener('logoUpdated', handleLogoUpdate);
  }, [isInitialized]);

  // Listen for UI button updates from Step 5
  useEffect(() => {
    const handleUIButtonsUpdate = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log(`[UnifiedSlotPreview] Received individualButtonsUpdated event:`, detail);
      
      if (!engineRef.current || !isInitialized) {
        console.warn(`[UnifiedSlotPreview] Cannot update UI buttons - engine not ready`);
        return;
      }
      
      if (detail?.buttons) {
        try {
          console.log(`[UnifiedSlotPreview] Updating UI buttons with layout from store`);
          
          // Get button layout configuration from store
          const gameConfig = useGameStore.getState().config;
          const buttonsWithLayout = {
            ...detail.buttons,
            _layout: gameConfig?.uiButtonLayout || [],
            _metadata: gameConfig?.uiButtonMetadata || {}
          };
          
          await engineRef.current.updateUIButtons(buttonsWithLayout);
          console.log(`[UnifiedSlotPreview] UI buttons updated successfully`);
        } catch (err) {
          console.error(`[UnifiedSlotPreview] Failed to update UI buttons:`, err);
        }
      }
    };
    
    window.addEventListener('individualButtonsUpdated', handleUIButtonsUpdate);
    return () => window.removeEventListener('individualButtonsUpdated', handleUIButtonsUpdate);
  }, [isInitialized]);

  // Handle spin
  const handleSpin = useCallback(async (animationSettings?: any) => {
    if (!engineRef.current || !isInitialized || isSpinning) return;

    try {
      setIsSpinning(true);
      setLastWin(0);

      // Deduct bet from balance
      const betAmount = 1; // TODO: Get from UI controls
      setBalance(prev => prev - betAmount);

      // Execute spin with force win for Step 7 and animation settings
      const forceWin = stepSource === 'step7';
      const easing = animationSettings?.easing; // Extract easing from Animation Studio
      console.log(`[UnifiedSlotPreview] Spin with easing:`, easing);
      const result = await engineRef.current.spin(betAmount, 3, forceWin, easing); // Pass easing parameter

      // Update balance with winnings
      if (result.totalWin > 0) {
        setBalance(prev => prev + result.totalWin);
        setLastWin(result.totalWin);
      }

      console.log(`[UnifiedSlotPreview] Spin result from ${stepSource}:`, result);
      
      // Call the onSpinResult callback if provided
      if (onSpinResult) {
        onSpinResult({ totalWin: result.totalWin });
      }
      
      // Dispatch completion event for Step 7 stats
      if (stepSource === 'step7') {
        window.dispatchEvent(new CustomEvent('spin:complete', {
          detail: { result, source: 'step7' }
        }));
      }
    } catch (err) {
      console.error(`[UnifiedSlotPreview] Spin failed from ${stepSource}:`, err);
      setError(err instanceof Error ? err.message : 'Spin failed');
    } finally {
      setIsSpinning(false);
    }
  }, [isInitialized, isSpinning, stepSource, onSpinResult]);

  // Handle quick spin
  const handleQuickSpin = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.quickSpin();
    }
  }, []);

  // Handle auto play
  const handleAutoPlay = useCallback((active: boolean) => {
    if (engineRef.current) {
      if (active) {
        engineRef.current.startAutoPlay();
      } else {
        engineRef.current.stopAutoPlay();
      }
    }
  }, []);

  // Handle bet change
  const handleBetChange = useCallback((bet: number) => {
    // TODO: Update bet in engine
    console.log(`[UnifiedSlotPreview] Bet changed to ${bet} from ${stepSource}`);
  }, [stepSource]);
  
  // Listen for slotSpin events from Step 7 and Animation Studio
  useEffect(() => {
    const handleSlotSpin = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      
      // Handle test spins from Animation Studio (Step 6)
      if (detail?.source === 'animation-studio-test' && stepSource === 'step6') {
        console.log(`[UnifiedSlotPreview] Received test spin from Animation Studio:`, detail);
        
        if (!engineRef.current || !isInitialized || isSpinning) {
          console.warn(`[UnifiedSlotPreview] Cannot handle test spin - engine not ready or already spinning`);
          return;
        }
        
        // Trigger the test spin with animation settings
        handleSpin(detail.settings);
      }
      // Handle spins from Step 7
      else if (detail?.source === 'step7' && stepSource === 'step7') {
        console.log(`[UnifiedSlotPreview] Received slotSpin event from Step 7:`, detail);
        
        if (!engineRef.current || !isInitialized || isSpinning) {
          console.warn(`[UnifiedSlotPreview] Cannot handle spin - engine not ready or already spinning`);
          return;
        }
        
        // Trigger the spin
        handleSpin();
      }
    };
    
    window.addEventListener('slotSpin', handleSlotSpin);
    return () => window.removeEventListener('slotSpin', handleSlotSpin);
  }, [isInitialized, isSpinning, stepSource, handleSpin]);

  // Handle slam stop events from Animation Studio
  useEffect(() => {
    const handleSlamStopAll = () => {
      console.log(`[UnifiedSlotPreview] Received slam stop all event`);
      
      if (!engineRef.current || !isSpinning) {
        console.warn(`[UnifiedSlotPreview] Cannot slam stop - engine not ready or not spinning`);
        return;
      }
      
      engineRef.current.slamStopAll();
    };

    const handleSlamStopReel = (event: any) => {
      const { reelIndex } = event.detail || {};
      console.log(`[UnifiedSlotPreview] Received slam stop reel event for reel ${reelIndex}`);
      
      if (!engineRef.current || !isSpinning || reelIndex === undefined) {
        console.warn(`[UnifiedSlotPreview] Cannot slam stop reel - engine not ready, not spinning, or invalid reel index`);
        return;
      }
      
      engineRef.current.slamStopReel(reelIndex);
    };
    
    window.addEventListener('slamStopAll', handleSlamStopAll);
    window.addEventListener('slamStopReel', handleSlamStopReel);
    
    return () => {
      window.removeEventListener('slamStopAll', handleSlamStopAll);
      window.removeEventListener('slamStopReel', handleSlamStopReel);
    };
  }, [isSpinning]);

  // Handle freespin transition events from Animation Studio
  useEffect(() => {
    const handleFreespinTransition = async (event: any) => {
      const { direction, style, duration } = event.detail || {};
      console.log(`[UnifiedSlotPreview] Received freespin transition event:`, { direction, style, duration });
      
      if (!engineRef.current || !engineRef.current.renderer) {
        console.warn(`[UnifiedSlotPreview] Cannot perform freespin transition - engine or renderer not available`);
        return;
      }

      // Get background URLs from config
      const regularBackgroundUrl = config?.background?.backgroundImage;
      const freespinBackgroundUrl = (config as any)?.derivedBackgrounds?.freespin;

      if (!regularBackgroundUrl || !freespinBackgroundUrl) {
        console.warn(`[UnifiedSlotPreview] Missing background URLs for freespin transition`, {
          regular: !!regularBackgroundUrl,
          freespin: !!freespinBackgroundUrl
        });
        return;
      }

      try {
        await (engineRef.current.renderer as any).performFreespinTransition({
          direction,
          style,
          duration,
          regularBackgroundUrl,
          freespinBackgroundUrl
        });
        console.log(`✅ Freespin transition completed successfully`);
      } catch (error) {
        console.error(`❌ Freespin transition failed:`, error);
      }
    };
    
    window.addEventListener('previewFreespinTransition', handleFreespinTransition);
    
    return () => {
      window.removeEventListener('previewFreespinTransition', handleFreespinTransition);
    };
  }, [config]);

  // Handle mask controls from Animation Studio
  useEffect(() => {
    const handleMaskControls = (event: any) => {
      const { controls } = event.detail || {};
      console.log(`[UnifiedSlotPreview] Applying mask controls:`, controls);
      
      if (engineRef.current && engineRef.current.renderer) {
        (engineRef.current.renderer as any).applyMaskControls?.(controls);
      }
    };

    window.addEventListener('applyMaskControls', handleMaskControls);
    
    return () => {
      window.removeEventListener('applyMaskControls', handleMaskControls);
    };
  }, []);

  // Handle professional animation events from Animation Studio
  useEffect(() => {
    const handleApplyPreset = async (event: any) => {
      const { presetName } = event.detail || {};
      console.log(`[UnifiedSlotPreview] Applying animation preset: ${presetName}`);
      
      if (engineRef.current && engineRef.current.renderer) {
        const success = (engineRef.current.renderer as any).applyAnimationPreset?.(presetName);
        console.log(`[UnifiedSlotPreview] Preset application ${success ? 'successful' : 'failed'}`);
      }
    };

    const handleGetPresets = () => {
      console.log(`[UnifiedSlotPreview] Requesting animation presets`);
      
      if (engineRef.current && engineRef.current.renderer) {
        const presets = (engineRef.current.renderer as any).getAnimationPresets?.();
        if (presets) {
          window.dispatchEvent(new CustomEvent('animationPresetsResponse', {
            detail: { presets }
          }));
        }
      }
    };

    const handleGetEasingCurve = (event: any) => {
      const { easing, steps } = event.detail || {};
      console.log(`[UnifiedSlotPreview] Requesting easing curve for: ${easing}`);
      
      if (engineRef.current && engineRef.current.renderer) {
        const points = (engineRef.current.renderer as any).getEasingCurvePoints?.(easing, steps);
        if (points) {
          window.dispatchEvent(new CustomEvent('easingCurveResponse', {
            detail: { points }
          }));
        }
      }
    };

    const handleGetPerformanceMetrics = () => {
      if (engineRef.current && engineRef.current.renderer) {
        const metrics = (engineRef.current.renderer as any).getPerformanceMetrics?.();
        if (metrics) {
          window.dispatchEvent(new CustomEvent('performanceMetricsResponse', {
            detail: { metrics }
          }));
        }
      }
    };

    const handleSetMaskPreviewMode = (event: any) => {
      const { mode } = event.detail || {};
      console.log(`[UnifiedSlotPreview] Setting mask preview mode: ${mode}`);
      
      if (engineRef.current && engineRef.current.renderer) {
        (engineRef.current.renderer as any).setMaskPreviewMode?.(mode);
      }
    };

    const handleSetDeviceProfile = (event: any) => {
      const { profile } = event.detail || {};
      console.log(`[UnifiedSlotPreview] Setting device profile: ${profile}`);
      
      if (engineRef.current && engineRef.current.renderer) {
        (engineRef.current.renderer as any).setDeviceProfile?.(profile);
      }
    };

    // Add event listeners
    window.addEventListener('applyAnimationPreset', handleApplyPreset);
    window.addEventListener('getAnimationPresets', handleGetPresets);
    window.addEventListener('getEasingCurve', handleGetEasingCurve);
    window.addEventListener('getPerformanceMetrics', handleGetPerformanceMetrics);
    window.addEventListener('setMaskPreviewMode', handleSetMaskPreviewMode);
    window.addEventListener('setDeviceProfile', handleSetDeviceProfile);

    return () => {
      window.removeEventListener('applyAnimationPreset', handleApplyPreset);
      window.removeEventListener('getAnimationPresets', handleGetPresets);
      window.removeEventListener('getEasingCurve', handleGetEasingCurve);
      window.removeEventListener('getPerformanceMetrics', handleGetPerformanceMetrics);
      window.removeEventListener('setMaskPreviewMode', handleSetMaskPreviewMode);
      window.removeEventListener('setDeviceProfile', handleSetDeviceProfile);
      
      // Clean up Animation Studio listeners
      if ((window as any).cleanupAnimationListeners) {
        (window as any).cleanupAnimationListeners();
      }
    };
  }, []);

  // Mount tracking
  useEffect(() => {
    console.log(`[UnifiedSlotPreview] Component mounted for ${stepSource}`);
    setIsMounted(true);
    mountedRef.current = true;
    
    return () => {
      console.log(`[UnifiedSlotPreview] Component unmounting from ${stepSource}`);
      setIsMounted(false);
      mountedRef.current = false;
      
      // Destroy engine when component truly unmounts
      if (engineRef.current) {
        console.log(`[UnifiedSlotPreview] Destroying GameEngine on unmount`);
        try {
          engineRef.current.destroy();
        } catch (err) {
          console.error('Error destroying engine:', err);
        }
        engineRef.current = null;
        setIsInitialized(false);
        initializationRef.current = false; // Reset initialization flag
      }
    };
  }, []); // Empty deps - only run on true unmount

  if (error) {
    return (
      <div className={`unified-slot-preview error ${className}`}>
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Game Engine Error</h3>
          <p className="mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`unified-slot-preview ${className}`} 
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {/* Game container where PIXI canvas will be mounted */}
      <div 
        ref={containerRef} 
        className="game-container"
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'relative',
          background: '#000',
          overflow: 'hidden' // Prevent content from expanding container
        }}
      />
      
      {/* CSS Logo - Show as fallback when PixiJS doesn't handle logo positioning, hide when PixiJS logo is active */}
      {config?.logo && isInitialized && stepSource !== 'step5' && stepSource !== 'step6' && stepSource !== 'step7' && (
        <div 
          className="absolute"
          style={{
            left: '50%',
            top: '40px',
            transform: 'translate(-50%, 0)',
            zIndex: 1001, // Above PixiJS and UI
            pointerEvents: 'none'
          }}
        >
          <img 
            src={config.logo}
            alt="Game Logo"
            style={{
              height: '60px',
              width: 'auto',
              filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))',
              opacity: 1.0 // Full opacity since this is now persistent
            }}
            onLoad={() => console.log('[UnifiedSlotPreview] ✅ CSS Logo loaded')}
            onError={() => console.error('[UnifiedSlotPreview] ❌ CSS Logo failed')}
          />
        </div>
      )}

      {/* UI Overlay - at bottom position with elevated z-index */}
      {isInitialized && !hideControls && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000 }}> {/* Position at bottom of container */}
          <SlotGameUI
            balance={balance}
            win={lastWin}
            bet={1}
            isSpinning={isSpinning}
            onSpin={handleSpin}
            onAutoplayToggle={handleAutoPlay}
            customButtons={config?.uiElements}
            gameLogo={(stepSource === 'step5' || stepSource === 'step6' || stepSource === 'step7') ? config?.logo : null} // Pass logo for PixiJS rendering in Steps 5-7
            logoPosition={config?.logoPosition}
            logoScale={config?.logoScale}
            logoPositioningMode={stepSource === 'step5'} // Enable logo positioning controls only in Step 5
            onLogoPositionChange={(position) => {
              // Update logo position through game store with device info
              const currentDevice = detectDeviceType();
              window.dispatchEvent(new CustomEvent('logoPositionChanged', {
                detail: { position, device: currentDevice }
              }));
            }}
          />
        </div>
      )}
      
      {/* Loading indicator */}
      {!isInitialized && !error && (
        <div className="loading-indicator absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center">
            <div className="spinner animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p className="text-white">Initializing game engine...</p>
          </div>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="error-display absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center max-w-md p-6 bg-red-900 rounded-lg">
            <p className="text-white mb-4">Failed to initialize game engine:</p>
            <p className="text-red-200 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedSlotPreview;