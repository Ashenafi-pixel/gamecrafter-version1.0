export const generateSlotMachineComponent = () =>
  `import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import LoadingScreen from './LoadingScreen';
import InfoPage from './InfoPage';
import MenuModal from './MenuModal';
import PickAndClickModal from './PickAndClickModal';
import AnnouncementModal from './AnnouncementModal';
import { useTheme } from '../context/ThemeContext';
import { createGameInitialization } from '../utils/gameInitialization';
import { createWheelBonus } from '../utils/wheelBonus';
import { createAutoPlay } from '../utils/autoPlay';
import { createSoundSystem } from '../utils/soundSystem';
import { createWinAnimationSystem } from '../utils/winAnimationSystem';
import { createSlotGridSystem } from '../utils/slotGridSystem';
import { LockedSymbol, WinDetail, AnimationSettings, HoldSpinState, WheelPrize, ThemeType, WindowWithGameFunctions,SymbolType } from '../types';
import UiButtons from './uiButtons';
import { useGameStore } from '../store';
import { gameConfig } from '../config/gameConfig';



const SlotMachine =() => {
  const {balance , bet, setBalance, setBet , isSpinning, setIsSpinning, showMenu, setShowMenu ,showInfo, setShowInfo, showSettings, setShowSettings,
  showAutoPlaySettings, setShowAutoPlaySettings
  } = useGameStore();
  const config = gameConfig;
  const { theme, setTheme } = useTheme();
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [isWinAnimationPlaying, setIsWinAnimationPlaying] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [displayedWinAmount, setDisplayedWinAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Game...');
  const [showSoundBar, setShowSoundBar] = useState(false);
  const [soundVolume, setSoundVolume] = useState(75);
  const [winAnimation, setWinAnimation] = useState<boolean>(true);
  const [winDetails, setWinDetails] = useState<WinDetail[]>([]);
  const [showWinHighlight, setShowWinHighlight] = useState(false);
  const soundControlRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [showWinDisplay, setShowWinDisplay] = useState(false);
  const [showWheelBonus, setShowWheelBonus] = useState(false);
  const [wheelResult, setWheelResult] = useState<number>(0);
  const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Pick & Click Feature States
  const [showPickAndClickModal, setShowPickAndClickModal] = useState(false);
  const [showPickAndClickAnnouncement, setShowPickAndClickAnnouncement] = useState(false);
  const [pickAndClickWinAmount, setPickAndClickWinAmount] = useState(0);
  const [showPickAndClickWinModal, setShowPickAndClickWinModal] = useState(false);
  
  // Free Spin Feature States
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(0);
  const [isInFreeSpinMode, setIsInFreeSpinMode] = useState(false);
  const [showFreeSpinAnnouncement, setShowFreeSpinAnnouncement] = useState(false);
  const [freeSpinAwardedCount, setFreeSpinAwardedCount] = useState(0);
  const [freeSpinIndicatorFading, setFreeSpinIndicatorFading] = useState(false);
  // Hold & Spin Feature States
  const [isInHoldSpinMode, setIsInHoldSpinMode] = useState(false);
  const [holdSpinSpinsRemaining, setHoldSpinSpinsRemaining] = useState(0);
  const [lockedSymbols, setLockedSymbols] = useState<LockedSymbol[]>([]);
  const [holdSpinTotalWin, setHoldSpinTotalWin] = useState(0);
  const [showHoldSpinAnnouncement, setShowHoldSpinAnnouncement] = useState(false);
  const [showHoldSpinWinModal, setShowHoldSpinWinModal] = useState(false);
  const holdSpinOverlayRef = useRef<PIXI.Container[]>([]);

    // Near Miss Feature States
  // const [isNearMissActive, setIsNearMissActive] = useState(false);
  const [showNearMissModal, setShowNearMissModal] = useState(false);
  const [nearMissScatterCount] = useState(0);
  const nearMissStateRef = useRef({ isActive: false, scatterCount: 0, checkedReels: 0 });
  
  // Hold & Spin State Manager - Fix for async state issues
  const holdSpinStateRef = useRef<HoldSpinState>({
    lockedSymbols: [],
    spinsRemaining: 0,
    isActive: false
  });

  // Free Spin State Manager - Fix for audio timing issues
  const freeSpinStateRef = useRef({
    isInFreeSpinMode: false,
    spinsRemaining: 0
  });

  // Sync state with ref for immediate access
  useEffect(() => {
    holdSpinStateRef.current = {
      lockedSymbols,
      spinsRemaining: holdSpinSpinsRemaining,
      isActive: isInHoldSpinMode
    };
  }, [lockedSymbols, holdSpinSpinsRemaining, isInHoldSpinMode]);
  
 // Sync free spin state with ref
  useEffect(() => {
    freeSpinStateRef.current = {
      isInFreeSpinMode,
      spinsRemaining: freeSpinsRemaining
    };
  }, [isInFreeSpinMode, freeSpinsRemaining]);

// Handle free spin counter fade-out when reaching 0 AND not spinning
  useEffect(() => {
    if (isInFreeSpinMode && freeSpinsRemaining === 0 && !isSpinning) {
      setTimeout(() => {
        setFreeSpinIndicatorFading(true);
        setTimeout(() => {
          setIsInFreeSpinMode(false);
          setFreeSpinIndicatorFading(false);
        }, 500);
      }, 1000);
    }
  }, [freeSpinsRemaining, isInFreeSpinMode, isSpinning]);


  // Background switching effect for free spin mode
  useEffect(() => {
    const updateBg = (window as WindowWithGameFunctions).updateGameBackground;
    if (isInFreeSpinMode && config.derivedBackgrounds?.freespin && updateBg) {
      updateBg(config.derivedBackgrounds.freespin);
      console.log('🎨 Switched to free spin background');
    } else if (!isInFreeSpinMode && config.background && updateBg) {
      updateBg(config.background);
      console.log('🎨 Switched back to normal background');
    }
  }, [isInFreeSpinMode, config.derivedBackgrounds?.freespin, config.background]);

  // Auto Play Feature States
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoSpinCount, setAutoSpinCount] = useState(0);
  // const [autoSpinDelay, setAutoSpinDelay] = useState(3000);
  const autoSpinTimeoutRef = useRef<number | null>(null);
  
   // Animation settings controlled by Step7 - optimized for smoothness
  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>({
    speed: 0.9,
    blurIntensity: 6,
    easing: 'back.out'
  });
  
  // Reel system variables (matching HTML exporter)
  const reelContainersRef = useRef<PIXI.Container[]>([]);
  const reelMasksRef = useRef<PIXI.Graphics[]>([]);
  const symbolWidthRef = useRef(0);
  const symbolHeightRef = useRef(0);
  const winHighlightRef = useRef<PIXI.Graphics[]>([]);
  const winLinesRef = useRef<PIXI.Graphics[]>([]);
  const extendedWildSpritesRef = useRef<Array<{reel: number, sprite: PIXI.Sprite}>>([]);

  // Sound system functionality
  const soundSystem = createSoundSystem();
  const [musicInitialized, setMusicInitialized] = useState(false);
    // Initialize background music on first user interaction after loading
  const initializeMusic = () => {
    if (!isLoading && !musicInitialized) {
      soundSystem.playBackgroundMusic(soundVolume);
      setMusicInitialized(true);
    }
  };

  // Background music control
  useEffect(() => {
    return () => {
      soundSystem.stopBackgroundMusic();
    };
  }, []);

    // Update background music volume when sound volume changes
 useEffect(() => {
    if (musicInitialized) {
      soundSystem.playBackgroundMusic(soundVolume);
    }
  }, [soundVolume, musicInitialized]);

  // Add global click listener to start music after loading
  useEffect(() => {
    const handleFirstClick = () => {
      if (!isLoading && !musicInitialized) {
        soundSystem.playBackgroundMusic(soundVolume);
        setMusicInitialized(true);
        document.removeEventListener('click', handleFirstClick);
      }
    };

    if (!isLoading && !musicInitialized) {
      document.addEventListener('click', handleFirstClick);
    }

    return () => {
      document.removeEventListener('click', handleFirstClick);
    };
  }, [isLoading, musicInitialized, soundVolume]);
  
    // Win animation system functionality
  const winAnimationSystem = createWinAnimationSystem();
  // Handle click outside popups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      soundSystem.handleClickOutside(event, soundControlRef, setShowSoundBar);
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    if (showSoundBar || showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSoundBar, showSettings]);

  // Clear win highlights
  const clearWinHighlights = () => {
    winAnimationSystem.clearWinHighlights(winHighlightRef);
  };

  // Clear win lines
  const clearWinLines = () => {
    winAnimationSystem.clearWinLines(winLinesRef);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadingProgress(0);

    const initializeGame = async () => {
      try {
      const gameInit = createGameInitialization();
        
        // Simulate loading phases
        await gameInit.simulateLoadingPhases(setLoadingMessage, setLoadingProgress, isMounted);
        
        setLoadingMessage('Loading Assets...');

        // Create PIXI application
        const app = gameInit.createPixiApp();

        if (!isMounted) {
          app.destroy(true);
          return;
        }

        appRef.current = app;
        canvasRef.current?.appendChild(app.view as HTMLCanvasElement);

        // Collect and load all Assets
                const assetsToLoad = gameInit.collectAssets(config);
        const loadedTextures = await gameInit.loadAssets(assetsToLoad, setLoadingProgress, isMounted);

        if (!isMounted) {
          app.destroy(true);
          return;
        }

        // Load and display background (with support for derived backgrounds)
        let currentBackground = config.background;
        
        // Check if we're in free spin mode and have a free spin background
        if (isInFreeSpinMode && config.derivedBackgrounds?.freespin) {
          currentBackground = config.derivedBackgrounds.freespin;
        }
        
        if (currentBackground && loadedTextures.has(currentBackground)) {
          const bg = new PIXI.Sprite(loadedTextures.get(currentBackground));
          bg.width = app.screen.width;
          bg.height = app.screen.height;
          (bg as PIXI.Sprite & { isBackground?: boolean }).isBackground = true; // Mark as background for easy identification
          app.stage.addChild(bg);
        }
        // Create slot grid system
        const gridSystem = createSlotGridSystem();
        
        // Fixed Hold & Spin symbol detection
        const isHoldSpinSymbol = (symbolType: string | undefined): boolean => {
          // Debug log to see what symbols we're getting
          console.log('🔍 Checking symbol:', symbolType, 'for Hold & Spin');

          if (!symbolType || typeof symbolType !== 'string') {
            return false;
          }
          // Check multiple possible Hold & Spin symbol variations
          return symbolType === 'holdSpin' || 
                 symbolType === 'hold' || 
                 symbolType === 'holdspin' ||
                 symbolType.toLowerCase().includes('holdspin') || 
                 symbolType.toLowerCase().includes('hold');
        };
        
        gridSystem.createSymbolGrid(
          app,
          config,
          loadedTextures,
          reelContainersRef,
          reelMasksRef,
          symbolWidthRef,
          symbolHeightRef,
          holdSpinStateRef,
          isHoldSpinSymbol
        );
        // Handle resize
        const handleResize = () => {
          if (app && !app.renderer) {
            app.renderer.resize(window.innerWidth, window.innerHeight);
          }
        };

        window.addEventListener('resize', handleResize);

        // Step7 Animation Studio Integration
        const setupStep7Integration = () => {
          // Listen for animation settings changes from Step7
        const handleAnimationSettingsChange = (event: Event) => {
            const customEvent = event as CustomEvent<{settings: Partial<AnimationSettings>}>;
            const { settings } = customEvent.detail;
            console.log('🎭 Animation settings updated from Step7:', settings);
            setAnimationSettings(prev => ({
              ...prev,
              ...settings
            }));
          };
          
          // Listen for spin triggers from Step7
           const handleSlotSpin = (event: Event) => {
            const customEvent = event as CustomEvent<{source?: string}>;
            console.log('🎰 Spin triggered from Step7:', customEvent.detail?.source || 'unknown');
            if (!isSpinning) {
              performSpin();
            }
          };
          window.addEventListener('animationSettingsChanged', handleAnimationSettingsChange);
          window.addEventListener('slotSpin', handleSlotSpin);
          return () => {
            window.removeEventListener('animationSettingsChanged', handleAnimationSettingsChange);
            window.removeEventListener('slotSpin', handleSlotSpin);
          };
        };
        
        const cleanupStep7 = setupStep7Integration();

        // Setup win animation event listener
        const handleShowWinAnimations = (event: Event) => {
          const customEvent = event as CustomEvent<{winDetails: WinDetail[], animationType: string}>;
          const { winDetails, animationType } = customEvent.detail;

          if (animationType === 'squares' || animationType === 'both') {
            showWinHighlights(winDetails);
          }
          if (animationType === 'lines' || animationType === 'both') {
            showWinLines(winDetails);
          }
        };

        window.addEventListener('showWinAnimations', handleShowWinAnimations);
        // Exact spin animation from HTML exporter with Step7 controls
        const performSpin = () => {
          if (isSpinning || reelContainersRef.current.length === 0) {
            console.log('⚠️ Cannot spin: spinning=' + isSpinning + ', reels=' + reelContainersRef.current.length);
            return;
          }
          console.log('🎰 Starting spin with settings:', animationSettings);
          // Kill any existing animations
          gsap.killTweensOf('*');

          setIsSpinning(true);
          // Reset win amounts at start of new spin
          setWinAmount(0);
          setDisplayedWinAmount(0);

          // Small delay to ensure UI updates
          gsap.delayedCall(0.1, animateSpin);
        };
        
        // Hold & Spin specific spin that preserves locked symbols
        const performHoldSpinSpin = () => {
          if (isSpinning || reelContainersRef.current.length === 0) {
            console.log('⚠️ Cannot Hold & Spin: spinning=' + isSpinning + ', reels=' + reelContainersRef.current.length);
            return;
          }
          console.log('🎯 Starting Hold & Spin respin with locked symbols:', lockedSymbols);
          // Kill any existing animations
          gsap.killTweensOf('*');

          setIsSpinning(true);

          // Small delay to ensure UI updates
          gsap.delayedCall(0.1, animateHoldSpinSpin);
        };
        
        // Add new symbol to top of reel (fixed positioning)
        const addSymbolToReel = (reelContainer: PIXI.Container) => {
          const newSymbol = gridSystem.createRandomSymbol(symbolWidthRef.current, loadedTextures, config, holdSpinStateRef, isHoldSpinSymbol);
          if (newSymbol) {
            newSymbol.width = symbolWidthRef.current;
            newSymbol.height = symbolHeightRef.current;
            newSymbol.x = 0;
            
            const topSymbol = reelContainer.children[0];
            newSymbol.y = topSymbol.y - symbolHeightRef.current;
            
            reelContainer.addChildAt(newSymbol, 0);
          }
        };
        
        // Remove symbols that scrolled off bottom (from HTML exporter)
        const removeBottomSymbols = (reelContainer: PIXI.Container) => {
          const maxY = (app.screen.height * 0.6) + symbolHeightRef.current;
          
          for (let i = reelContainer.children.length - 1; i >= 0; i--) {
            const symbol = reelContainer.children[i];
            if (symbol.y > maxY) {
              reelContainer.removeChild(symbol);
            }
          }
        };
        
        // Hold & Spin animation that only spins unlocked positions
        const animateHoldSpinSpin = () => {
          const reels = reelContainersRef.current;
          if (!reels || reels.length === 0) {
            console.error('No reel containers found for Hold & Spin animation');
            setIsSpinning(false);
            return;
          }
          
          console.log('🎯 Starting Hold & Spin reel animation...');
          
          // Get current locked symbols from ref (not stale state)
          const currentLockedSymbols = holdSpinStateRef.current.lockedSymbols as LockedSymbol[];
          console.log('🎯 Current locked symbols:', currentLockedSymbols);
          
          // Store locked symbol sprites before spinning
          const lockedSprites = new Map();
          currentLockedSymbols.forEach((lockedPos) => {
            const reel = reels[lockedPos.reel];
            if (reel && reel.children[lockedPos.row + 2]) { // +2 for buffer symbols
              const sprite = reel.children[lockedPos.row + 2];
              lockedSprites.set(\`\${lockedPos.reel}-\${lockedPos.row}\`, {
                texture: sprite.texture,
                userData: sprite.userData,
              });
              console.log('🎯 Stored locked symbol at', lockedPos.reel, lockedPos.row);
            }
          });
          

          // Ultra-smooth Hold & Spin timing
          const baseSpinDuration = 0.06 / animationSettings.speed;
          const startDelays = [0, 0.06, 0.12, 0.18, 0.24].map(delay => delay / animationSettings.speed);
          const stopDelays = [1.0, 1.2, 1.4, 1.6, 1.8].map(delay => delay / animationSettings.speed);
          const finalSettleDuration = 0.3;
          
          let stoppedReels = 0;
          
          // Spin all reels but restore locked positions after
          for (let reelIndex = 0; reelIndex < reels.length; reelIndex++) {
            const reel = reels[reelIndex];
            const startDelay = startDelays[reelIndex] || (reelIndex * 0.1 / animationSettings.speed);
            const stopDelay = stopDelays[reelIndex] || (1.0 + reelIndex * 0.3) / animationSettings.speed;
            
            gsap.delayedCall(startDelay, () => {
              if (animationSettings.blurIntensity > 0) {
                const blurFilter = new PIXI.BlurFilter();
                blurFilter.blur = animationSettings.blurIntensity;
                reel.filters = [blurFilter];
              }
              
              const spinTween = gsap.to(reel.children, {
                y: '+='+symbolHeightRef.current,
                duration: baseSpinDuration,
                ease: 'none',
                repeat: -1,
                onRepeat: () => {
                  addSymbolToReel(reel);
                  removeBottomSymbols(reel);
                }
              });
              
              gsap.delayedCall(stopDelay, () => {
                spinTween.kill();
                
                const targetSymbolIndex = 2;
                const targetY = 0;
                const currentSymbolY = reel.children[targetSymbolIndex] ? reel.children[targetSymbolIndex].y : 0;
                const adjustment = targetY - currentSymbolY;
                
                gsap.to(reel.children, {
                  y: '+=' + adjustment,
                  duration: finalSettleDuration,
                  ease: 'back.out(1.2)', // Smooth back ease for Hold & Spin
                  onComplete: () => {
                    if (reel.filters) {
                      reel.filters = null;
                    }
                    
                    // Use current state from ref instead of stale closure
                    const currentLocked = holdSpinStateRef.current.lockedSymbols as LockedSymbol[];
                    currentLocked.forEach(lockedPos => {
                      if (lockedPos.reel === reelIndex) {
                        const spriteData = lockedSprites.get(\`\${lockedPos.reel}-\${lockedPos.row}\`);
                        if (spriteData && reel.children[lockedPos.row + 2]) {
                          const sprite = reel.children[lockedPos.row + 2] as PIXI.Sprite & { userData?: string };
                          sprite.texture = spriteData.texture;
                          sprite.userData = spriteData.userData;
                          console.log('🎯 Restored locked symbol at', lockedPos.reel, lockedPos.row);
                        }
                      }
                    });
                    
                    stoppedReels++;
                    
                    if (stoppedReels === reels.length) {
                      gsap.delayedCall(0.1, () => {
                        console.log('✅ Hold & Spin respin complete');
                        setIsSpinning(false);
                        calculateHoldSpinWin();
                      });
                    }
                  }
                });
              });
            });
          }
        };
        
        // Animate reel spin (exact copy from HTML exporter with Step7 speed/blur controls)
        const animateSpin = () => {
          const reels = reelContainersRef.current;
          if (!reels || reels.length === 0) {
            console.error('No reel containers found for animation');
            setIsSpinning(false);
            return;
          }
          
          console.log('🎰 Starting reel spin animation with Step7 settings...');

                    // Reset near miss state
          // setIsNearMissActive(false);
          nearMissStateRef.current = { isActive: false, scatterCount: 0, checkedReels: 0 };

             // Ultra-smooth spin control with optimized timing
          const baseSpinDuration = 0.06 / animationSettings.speed; // Even faster for ultra-smooth motion
          const startDelays = [0, 0.06, 0.12, 0.18, 0.24].map(delay => delay / animationSettings.speed); // Tighter stagger
          let stopDelays = [1.0, 1.2, 1.4, 1.6, 1.8].map(delay => delay / animationSettings.speed); // Reduced for quicker response
          const finalSettleDuration = 0.3; // Optimized settle duration

          
          // Track which reels have stopped to ensure proper completion detection
          let stoppedReels = 0;
          
          // Start reels sequentially from left to right (reel 0, then 1, then 2, etc.)
          for (let reelIndex = 0; reelIndex < reels.length; reelIndex++) {
            const reel = reels[reelIndex];
            const startDelay = startDelays[reelIndex] || (reelIndex * 0.1 / animationSettings.speed);
            const stopDelay = stopDelays[reelIndex] || (1.0 + reelIndex * 0.3) / animationSettings.speed;
            
            console.log(\`🎰 Scheduling reel \${reelIndex + 1} to start after \${startDelay.toFixed(2)}s and stop after \${stopDelay.toFixed(2)}s\`);
            
            // Staggered start timing - delay each reel's start in order
            gsap.delayedCall(startDelay, () => {
              console.log(\`🎰 Starting reel \${reelIndex + 1}\`);
              
              // Play reel start sound
               soundSystem.playReelSound('start', soundVolume, freeSpinStateRef.current.isInFreeSpinMode);
              
              // Apply Step7 blur control
              if (animationSettings.blurIntensity > 0) {
                const blurFilter = new PIXI.BlurFilter();
                blurFilter.blur = animationSettings.blurIntensity;
                reel.filters = [blurFilter];
              }
              
              // Phase 1: Continuous spinning
              const spinTween = gsap.to(reel.children, {
                y: '+='+symbolHeightRef.current,
                duration: baseSpinDuration,
                ease: 'none',
                repeat: -1,
                onRepeat: () => {
                  addSymbolToReel(reel);
                  removeBottomSymbols(reel);
                }
              });
              
              // Create stop callback function
              const stopReelCallback = () => {
                spinTween.kill();
                
                soundSystem.playReelSound('stop', soundVolume, freeSpinStateRef.current.isInFreeSpinMode);
                
                const targetSymbolIndex = 2;
                const targetY = 0;
                const currentSymbolY = reel.children[targetSymbolIndex] ? reel.children[targetSymbolIndex].y : 0;
                const adjustment = targetY - currentSymbolY;
                
                // Use slower settle duration for near miss
                const settleDuration = nearMissStateRef.current.isActive && reelIndex > nearMissStateRef.current.checkedReels ? 
                  finalSettleDuration * 1.5 : finalSettleDuration;
                
                gsap.to(reel.children, {
                  y: '+=' + adjustment,
                  duration: settleDuration,
                  ease: 'back.out(1.2)', // Smoother back ease for better feel
                  onComplete: () => {
                    if (reel.filters) {
                      reel.filters = null;
                    }
                    
                    
                    // Check for near miss after each reel stops
                    // const isNearMiss = checkNearMiss(reelIndex);
                    
                    stoppedReels++;
                    
                    if (stoppedReels === reels.length) {
                      gsap.delayedCall(0.1, () => {
                        console.log('✅ All reels stopped - spin complete');
                        setIsSpinning(false);
                        
                        // Check final result for near miss
                        const finalResults = getCurrentReelResults();
                        let finalScatterCount = 0;
                        const maxRows = Math.min(3, config.rows || 3);
                        
                        for (let row = 0; row < maxRows; row++) {
                          finalResults.forEach(reel => {
                            if (reel[row] === 'scatter') {
                              finalScatterCount++;
                            }
                          });
                        }
                        
                        if (nearMissStateRef.current.isActive && finalScatterCount === 2) {
                          console.log('🎯 Near Miss confirmed! Showing modal');
                          setShowNearMissModal(true);
                          setTimeout(() => setShowNearMissModal(false), 3000);
                        }
                        
                        calculateWin();
                      });
                    }
                  }
                });
              };
              
              // Schedule stop with potential near miss delay
              let currentStopDelay = stopDelays[reelIndex] || (1.0 + reelIndex * 0.3) / animationSettings.speed;
              
              // Add delay for remaining reels if near miss is detected
              if (reelIndex > 0) {
                gsap.delayedCall(currentStopDelay, () => {
                  // Check if near miss was detected by previous reels
                  if (nearMissStateRef.current.isActive && reelIndex > nearMissStateRef.current.checkedReels) {
                    gsap.delayedCall(2.0, stopReelCallback);
                  } else {
                    stopReelCallback();
                  }
                });
              } else {
                gsap.delayedCall(currentStopDelay, stopReelCallback);
              }
            });
          }
        };
        
        // Async state update helper
        const updateHoldSpinState = async (newSymbols: LockedSymbol[], newSpinsRemaining: number): Promise<boolean> => {
          return new Promise((resolve) => {
            setLockedSymbols(prev => {
              const updated = [...prev, ...newSymbols];
              holdSpinStateRef.current.lockedSymbols = updated;
              return updated;
            });
            setHoldSpinSpinsRemaining(newSpinsRemaining);
            holdSpinStateRef.current.spinsRemaining = newSpinsRemaining;
            
            // Use setTimeout to ensure state updates complete
            setTimeout(() => {
              createHoldSpinOverlay(holdSpinStateRef.current.lockedSymbols);
              resolve(true);
            }, 50);
          });
        };

        // Fixed Hold & Spin win calculation
        const calculateHoldSpinWin = async () => {
          const reelResults = getCurrentReelResults();
          if (!reelResults || reelResults.length === 0) {
            console.warn('No reel results available for Hold & Spin calculation');
            return;
          }
          
          console.log('🎯 Calculating Hold & Spin win, current respins:', holdSpinStateRef.current.spinsRemaining);
          
          const newHoldSpinPositions: LockedSymbol[] = [];
          let foundNewSymbols = false;
          
          reelResults.forEach((reel: string[], reelIndex: number) => {
            reel.forEach((symbol: string, rowIndex: number) => {
              if (isHoldSpinSymbol(symbol)) {
                const isAlreadyLocked = holdSpinStateRef.current.lockedSymbols.some(
                  locked => locked.reel === reelIndex && locked.row === rowIndex
                );
                if (!isAlreadyLocked) {
                  newHoldSpinPositions.push({ 
                    reel: reelIndex, 
                    row: rowIndex, 
                    value: Math.floor(Math.random() * 5 + 1) * bet 
                  });
                  foundNewSymbols = true;
                  console.log('🎯 New holdSpin symbol found at reel', reelIndex, 'row', rowIndex);
                }
              }
            });
          });
          
          if (foundNewSymbols) {
            await updateHoldSpinState(newHoldSpinPositions, 3);
            console.log('🎯 New holdSpin symbols locked, respins reset to 3');
          } else {
            const newCount = holdSpinStateRef.current.spinsRemaining - 1;
            setHoldSpinSpinsRemaining(newCount);
            holdSpinStateRef.current.spinsRemaining = newCount;
            console.log('🎯 No new symbols, respins decreased to:', newCount);
            
            if (newCount <= 0) {
              console.log('🎯 No more respins, ending Hold & Spin bonus');
              setTimeout(() => endHoldSpinBonus(), 100);
            }
          }
          
          // Check if all positions are locked (jackpot condition)
          const totalPositions = (config.reels || 5) * (config.rows || 3);
          const currentTotalLocked = holdSpinStateRef.current.lockedSymbols.length + newHoldSpinPositions.length;
          if (currentTotalLocked >= totalPositions) {
            console.log('🎯 All positions locked - JACKPOT!');
            setTimeout(() => endHoldSpinBonus(), 100);
          }
        };
        
        // Extended symbol utility functions
        const hasExtendedSymbol = (symbolType: string) => {
          return config.extendedSymbols && config.extendedSymbols[\`\${symbolType}_extended\`];
        };
        
        const getExtendedSymbolTexture = (symbolType: string) => {
          const extendedUrl = config.extendedSymbols[\`\${symbolType}_extended\`];
          return loadedTextures.get(extendedUrl);
        };
        
        const clearExtendedWildSymbols = () => {
          if (extendedWildSpritesRef.current) {
            extendedWildSpritesRef.current.forEach(({ reel, sprite }) => {
              const reelContainer = reelContainersRef.current[reel];

              // Animate extended symbol fade out
              gsap.to(sprite, {
                alpha: 0,
                scale: 0.8,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                  if (sprite.parent) {
                    sprite.parent.removeChild(sprite);
                  }
                  sprite.destroy();
                }
              });
              
              // Restore original symbol visibility with animation
              const originalSymbols = reelContainer.children.slice(2, 2 + (config.rows || 3));
              originalSymbols.forEach((symbol, index) => {
                gsap.to(symbol, {
                  alpha: 1,
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: 'power2.out'
                });
              });
            });
            extendedWildSpritesRef.current = [];
          }
        };
        
        const createExtendedWildSymbol = (reelIndex: number) => {
          const extendedTexture = getExtendedSymbolTexture('wild');
          if (!extendedTexture) return;
          
          const reel = reelContainersRef.current[reelIndex];
          const visibleRows = config.rows || 3;

          const visibleSymbols = reel.children.slice(2, 2 + visibleRows);
          visibleSymbols.forEach((symbol) => {
            // Update userData to wild for win calculation
               (symbol as PIXI.DisplayObject & { userData?: { symbolType: string; isExtended: boolean } }).userData = { symbolType: 'wild', isExtended: true };
          });
          
          // Create extended symbol sprite
          const extendedSprite = new PIXI.Sprite(extendedTexture) as ExtendedSprite;
          extendedSprite.width = symbolWidthRef.current;
          extendedSprite.height = symbolHeightRef.current * visibleRows;
          
          // Position to cover all visible rows
          extendedSprite.x = symbolWidthRef.current * 0.05;
          extendedSprite.y = 0;
          
            // Start with extended symbol invisible
          extendedSprite.alpha = 0;
          extendedSprite.scale.set(0.8);
          
          // Add extended symbol to reel
          extendedSprite.userData = { symbolType: 'wild', isExtended: true }; reel.addChild(extendedSprite);


          // Animate extended symbol appearance
          gsap.to(extendedSprite, {
            alpha: 1,
            duration: 0.3,
            ease: 'power2.out'
          });
          
          gsap.to(extendedSprite.scale, {
            x: 0.2,
            y: 0.3,
            duration: 0.4,
            ease: 'back.out(1.7)'
          });
          
          // Animate original symbols fade out with slight delay
          const originalSymbols = reel.children.slice(2, 2 + visibleRows);
          originalSymbols.forEach((symbol, index) => {
            gsap.to(symbol, {
              alpha: 0,
              duration: 0.2,
              delay: index * 0.05,
              ease: 'power2.in'
            });
          });
          
          // Store reference for cleanup
          extendedWildSpritesRef.current.push({ reel: reelIndex, sprite: extendedSprite });
          
          console.log('🎯 Created extended wild symbol for reel', reelIndex);
        };
        
        const replaceWildSymbolsWithExtended = () => {
          if (!hasExtendedSymbol('wild')) return;
          
          const reelResults = getCurrentReelResults();
          const wildReels = new Set<number>();
          
          // Find reels containing wild symbols
          reelResults.forEach((reel, reelIndex) => {
            reel.forEach((symbol: string) => {
              if (symbol === 'wild') {
                wildReels.add(reelIndex);
              }
            });
          });
          
          // Create extended wild symbols for each reel with wilds
          wildReels.forEach(reelIndex => {
            createExtendedWildSymbol(reelIndex);
          });
          console.log('🎯 Replaced wild symbols in reels:', Array.from(wildReels));
        };

        // Enhanced symbol-based win calculation with highlighting
        const calculateWin = () => {
          const reelResults = getCurrentReelResults();
          if (!reelResults || reelResults.length === 0) {
            console.warn('No reel results available for win calculation');
            setWinAmount(0);
            setWinDetails([]);
            return;
          }
          
          // Replace wild symbols with extended versions before getting results
          replaceWildSymbolsWithExtended();
           // Get updated results after extended symbol replacement
          const updatedReelResults = getCurrentReelResults();
          
          // Check for scatter symbols first (free spin trigger)
          const scatterPositions: Array<{reel: number, row: number}> = [];
          let totalScatters = 0;
          
          // Check for bonus symbols (wheel trigger)
          const bonusPositions: Array<{reel: number, row: number}> = [];
          let totalBonusSymbols = 0;
          
          // Check for holdSpin symbols (Hold & Spin trigger)
          const holdSpinPositions: Array<{reel: number, row: number}> = [];
          let totalHoldSpinSymbols = 0;
          
          updatedReelResults.forEach((reel, reelIndex) => {
            reel.forEach((symbol: string, rowIndex: number) => {
              if (symbol === 'scatter') {
                totalScatters++;
                scatterPositions.push({ reel: reelIndex, row: rowIndex });
              }
              if (symbol === 'bonus') {
                totalBonusSymbols++;
                bonusPositions.push({ reel: reelIndex, row: rowIndex });
              }
              // Check for holdSpin symbol (exact matching)
              if (isHoldSpinSymbol(symbol)) {
                totalHoldSpinSymbols++;
                holdSpinPositions.push({ reel: reelIndex, row: rowIndex });
                console.log('🎯 Found holdSpin symbol at reel', reelIndex, 'row', rowIndex, 'symbol:', symbol);
              }
            });
          });
          const requiredHoldSpinSymbols = 3; // Requirement for Hold & Spin
          // Debug: Log all symbols found
          console.log('🎲 All symbols found:', reelResults.flat());
          console.log('🎯 HoldSpin symbols found:', totalHoldSpinSymbols, 'at positions:', holdSpinPositions);
          console.log('🎯 Required HoldSpin symbols:', requiredHoldSpinSymbols);
          console.log('🎯 Is in HoldSpin mode already:', isInHoldSpinMode);
          
          // Check if Hold & Spin should be triggered using holdSpin symbols
          
          if (totalHoldSpinSymbols >= requiredHoldSpinSymbols && !isInHoldSpinMode && config.bonus?.holdAndSpin?.enabled) {
            console.log('🎯 Hold & Spin triggered with', totalHoldSpinSymbols, 'holdSpin symbols');
            // Show holdSpin symbol win animation first, then trigger Hold & Spin
            showHoldSpinWin(holdSpinPositions, totalHoldSpinSymbols, () => {
              // This callback runs after holdSpin animation completes
              triggerHoldSpinBonus(holdSpinPositions);
            });
            return; // Exit early to prevent other bonus checks
          }
          
          // Check bonus triggers - each feature checks independently
          if (totalBonusSymbols >= 3) {
            // Check Pick & Click (if enabled)
            if (config.bonus?.pickAndClick?.enabled) {
              console.log('🎯 Pick & Click triggered with', totalBonusSymbols, 'bonus symbols');
              showBonusWin(bonusPositions, totalBonusSymbols, () => {
                triggerPickAndClickBonus();
              });
              return; // Exit early to prevent other bonus checks
            }
            // Check Wheel bonus (if enabled)
            if (config.bonus?.wheel?.enabled) {
              const requiredBonusSymbols = config.bonus.wheel.bonusSymbolsRequired || 3;
              if (totalBonusSymbols >= requiredBonusSymbols) {
                console.log('🎡 Wheel bonus triggered with', totalBonusSymbols, 'bonus symbols');
                showBonusWin(bonusPositions, totalBonusSymbols, () => {
                  triggerWheelBonus();
                });
                return; // Exit early to prevent other bonus checks
              }
            }
          }
          
          // ✅ FREE SPIN TRIGGER – FINAL FIX (No Retrigger When Disabled)
const requiredScatters = config.bonus?.freeSpins?.scatterSymbolsRequired || 3;
 if (totalScatters >= requiredScatters && config.bonus?.freeSpins?.enabled) {
   if (freeSpinStateRef.current.isInFreeSpinMode && config.bonus?.freeSpins?.retriggers === false) {
    console.log("🛑 Free spin retrigger blocked (config.retriggers = false)");
    return; 
  }

  // ✅ Safe trigger
  showScatterWin(scatterPositions, totalScatters, () => {
    const freeSpinsToAdd = config.bonus?.freeSpins?.count || 10;

    // First time free spin start (normal)
   if (!freeSpinStateRef.current.isInFreeSpinMode) {
      setIsInFreeSpinMode(true);
      setFreeSpinsRemaining(freeSpinsToAdd);
        // 🔧 ref ko turant sync karo (closure delay se bachne ke liye)
       freeSpinStateRef.current.isInFreeSpinMode = true;
       freeSpinStateRef.current.spinsRemaining = freeSpinsToAdd;
    }
    // Allowed retrigger
    else {
      setFreeSpinsRemaining(prev => prev + freeSpinsToAdd);
    }

    setFreeSpinAwardedCount(freeSpinsToAdd);
    setShowFreeSpinAnnouncement(true);
    setTimeout(() => setShowFreeSpinAnnouncement(false), 3000);
  });

  return; // Make sure no further calculation happens
}

          
          let totalWin = 0;
          const winDetailsArray: WinDetail[] = [];
          const activeBetlines = config.betlines || 25;
          const betPerLine = bet / activeBetlines;
          
          // Check each active betline for wins
          for (let lineIndex = 0; lineIndex < activeBetlines; lineIndex++) {
            const linePattern = config.betlinePatterns[lineIndex];
            if (!linePattern) continue;
            
            const lineSymbols: string[] = [];
            const linePositions: Array<{reel: number, row: number}> = [];
            
            // Extract symbols and positions for this betline
            for (let reel = 0; reel < updatedReelResults.length; reel++) {
              const row = linePattern[reel];
              if (updatedReelResults[reel] && updatedReelResults[reel][row]) {
                lineSymbols.push(updatedReelResults[reel][row]);
                linePositions.push({ reel, row });
              }
            }
            
            // Check for winning combinations
            const lineWin = checkLineWin(lineSymbols, betPerLine);
            if (lineWin.amount > 0) {
              totalWin += lineWin.amount;
              winDetailsArray.push({
                line: lineIndex + 1,
                symbols: lineSymbols,
                positions: linePositions.slice(0, lineWin.count), // Only winning positions
                count: lineWin.count,
                symbol: (lineWin.symbol || 'low1') as SymbolType,
                amount: parseFloat(lineWin.amount.toFixed(2)),
                pattern: linePattern,
                color: getLineColor(lineIndex) // Add unique color for each line
              });
            }
          }
          
          // Apply free spin multipliers if in free spin mode
          let finalWin = totalWin;
          if (isInFreeSpinMode && config.bonus?.freeSpins?.multipliers?.length > 0) {
            const multipliers = config.bonus.freeSpins.multipliers;
            const multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
            finalWin = totalWin * multiplier;
            console.log(\`🎰 Free spin multiplier applied: \${multiplier}x (\${totalWin} -> \${finalWin})\`);
          }
          
          setWinAmount(parseFloat(finalWin.toFixed(2)));
          setBalance(prev => parseFloat((prev + finalWin).toFixed(2)));
          setWinDetails(winDetailsArray);
        // Play win sound if there's a win (delayed by 2 seconds)
          if (finalWin > 0) {
            setTimeout(() => {
              soundSystem.playWinSound(finalWin, soundVolume);
            }, 1500);
          }


          // Trigger win animations outside of this function where winAnimation state is accessible
          if (winDetailsArray.length > 0) {
            // Store win data for external animation handling
            window.dispatchEvent(new CustomEvent('winCalculated', {
              detail: {
                winDetails: winDetailsArray,
                finalWin: finalWin,
                animationType: config.winAnimationType || 'both'
              }
            }));
          }
          
          console.log('🎲 Spin result:', {
            bet: bet,
            activeBetlines: activeBetlines,
            totalWin: totalWin,
            winDetails: winDetailsArray
          });
        };
        
        // Show bonus symbol win animation
        const showBonusWin = (positions: Array<{reel: number, row: number}>,_count:number, onComplete: () => void) => {
                  soundSystem.playBonusTriggerSound(soundVolume);  
        const highlights: PIXI.Graphics[] = [];
          
          positions.forEach((pos) => {
            const highlight = new PIXI.Graphics();
            highlight.beginFill(0xFFD700, 0.8); // Gold glow for bonus symbols
            highlight.drawRoundedRect(0, 0, symbolWidthRef.current, symbolHeightRef.current, 12);
            highlight.endFill();
            
            // Position highlight
            const gridOffsetX = (app.screen.width - (config.reels || 5) * symbolWidthRef.current) / 2;
            const gridOffsetY = (app.screen.height - (config.rows || 3) * symbolHeightRef.current) / 2;
            
            highlight.x = gridOffsetX + (pos.reel * symbolWidthRef.current);
            highlight.y = gridOffsetY + (pos.row * symbolHeightRef.current);
            
            app.stage.addChild(highlight);
            highlights.push(highlight);
            
            // Pulsing animation
            gsap.to(highlight, {
              alpha: 0.3,
              duration: 0.5,
              repeat: 5,
              yoyo: true,
              ease: 'power2.inOut'
            });
          });
          
          // Remove highlights and trigger callback after 3 seconds
          gsap.delayedCall(3, () => {
            highlights.forEach(highlight => {
              if (highlight.parent) {
                highlight.parent.removeChild(highlight);
              }
            });
            if (onComplete) onComplete();
          });
        };
        
        // Show scatter win animation
        const showScatterWin = (positions: Array<{reel: number, row: number}>,_count:number, onComplete: () => void) => {
          const highlights: PIXI.Graphics[] = [];
          
          positions.forEach((pos) => {
            const highlight = new PIXI.Graphics();
            highlight.beginFill(0xFF6B35, 0.8); // Orange glow for scatters
            highlight.drawRoundedRect(0, 0, symbolWidthRef.current, symbolHeightRef.current, 12);
            highlight.endFill();
            
            // Position highlight
            const gridOffsetX = (app.screen.width - (config.reels || 5) * symbolWidthRef.current) / 2;
            const gridOffsetY = (app.screen.height - (config.rows || 3) * symbolHeightRef.current) / 2;
            
            highlight.x = gridOffsetX + (pos.reel * symbolWidthRef.current);
            highlight.y = gridOffsetY + (pos.row * symbolHeightRef.current);
            
            app.stage.addChild(highlight);
            highlights.push(highlight);
            
            // Pulsing animation
            gsap.to(highlight, {
              alpha: 0.3,
              duration: 0.5,
              repeat: 5,
              yoyo: true,
              ease: 'power2.inOut'
            });
          });
          
          // Remove highlights and trigger callback after 3 seconds
          gsap.delayedCall(3, () => {
            highlights.forEach(highlight => {
              if (highlight.parent) {
                highlight.parent.removeChild(highlight);
              }
            });
            if (onComplete) onComplete();
          });
        };
        
        // Show holdSpin symbol win animation
        const showHoldSpinWin = (positions: Array<{reel: number, row: number}>,_count:number, onComplete: () => void) => {
          const highlights: PIXI.Graphics[] = [];
          
          positions.forEach((pos) => {
            const highlight = new PIXI.Graphics();
            highlight.beginFill(0x9C27B0, 0.8); // Purple glow for holdSpin symbols
            highlight.drawRoundedRect(0, 0, symbolWidthRef.current, symbolHeightRef.current, 12);
            highlight.endFill();
            
            // Position highlight
            const gridOffsetX = (app.screen.width - (config.reels || 5) * symbolWidthRef.current) / 2;
            const gridOffsetY = (app.screen.height - (config.rows || 3) * symbolHeightRef.current) / 2;
            highlight.x = gridOffsetX + (pos.reel * symbolWidthRef.current);
            highlight.y = gridOffsetY + (pos.row * symbolHeightRef.current);
            
            app.stage.addChild(highlight);
            highlights.push(highlight);
            
            // Pulsing animation
            gsap.to(highlight, {
              alpha: 0.3,
              duration: 0.5,
              repeat: 5,
              yoyo: true,
              ease: 'power2.inOut'
            });
          });
          
          // Remove highlights and trigger callback after 3 seconds
          gsap.delayedCall(3, () => {
            highlights.forEach(highlight => {
              if (highlight.parent) {
                highlight.parent.removeChild(highlight);
              }
            });
            if (onComplete) onComplete();
          });
        };
        
        // Trigger Pick & Click bonus
        const triggerPickAndClickBonus = () => {
          console.log('🎯 Triggering Pick & Click bonus!');
          
          if (config.bonus?.pickAndClick?.announcementImage) {
            const testImg = new Image();
            testImg.onload = () => {
              const announcementOverlay = document.createElement('div');
              announcementOverlay.className = 'pick-click-announcement-overlay';
              announcementOverlay.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
              \`;
              
              const announcementImg = document.createElement('img');
              announcementImg.src = config.bonus.pickAndClick.announcementImage;
              announcementImg.style.cssText = \`
                max-width: 80%;
                max-height: 80%;
                object-fit: contain;
              \`;
              
              announcementOverlay.appendChild(announcementImg);
              document.body.appendChild(announcementOverlay);
              
              setTimeout(() => {
                document.body.removeChild(announcementOverlay);
                setShowPickAndClickModal(true);
              }, 2000);
            };
            testImg.onerror = () => {
              setShowPickAndClickAnnouncement(true);
              setTimeout(() => {
                setShowPickAndClickAnnouncement(false);
                setShowPickAndClickModal(true);
              }, 3000);
            };
            testImg.src = config.bonus.pickAndClick.announcementImage;
          } else {
            setShowPickAndClickAnnouncement(true);
            setTimeout(() => {
              setShowPickAndClickAnnouncement(false);
              setShowPickAndClickModal(true);
            }, 3000);
          }
        };
        
        // Update symbol visibility for Hold & Spin mode
        const updateSymbolVisibility = () => {
          reelContainersRef.current.forEach(reel => {
            reel.children.forEach(symbol => {
              const symbolType = (symbol as PIXI.DisplayObject & {userData?: {symbolType?: string}}).userData?.symbolType;
              if (holdSpinStateRef.current.isActive) {
                // During Hold & Spin: show only hold spin symbols
                symbol.alpha = isHoldSpinSymbol(symbolType) ? 1 : 0;
              } else {
                // Normal mode: show all symbols
                symbol.alpha = 1;
              }
            });
          });
        };
        
        // Trigger Hold & Spin bonus
        const triggerHoldSpinBonus = (initialPositions: Array<{reel: number, row: number}>) => {
          console.log('🎯 Triggering Hold & Spin bonus with positions:', initialPositions);
          const lockedSymbolsWithValues = initialPositions.map(pos => ({ 
            ...pos, 
            value: Math.floor(Math.random() * 5 + 1) * bet 
          }));
          
          // Update all states
          setIsInHoldSpinMode(true);
          setHoldSpinSpinsRemaining(3);
          setLockedSymbols(lockedSymbolsWithValues);
          setHoldSpinTotalWin(0);
          setShowHoldSpinAnnouncement(true);
          
          // Update ref immediately
          holdSpinStateRef.current = {
            lockedSymbols: lockedSymbolsWithValues,
            spinsRemaining: 3,
            isActive: true
          };
          console.log('🎯 Hold & Spin state initialized:', holdSpinStateRef.current);
          
          // Update symbol visibility to hide non-hold spin symbols
          updateSymbolVisibility();
          
          // Create visual overlay for locked positions
          setTimeout(() => {
            createHoldSpinOverlay(lockedSymbolsWithValues);
          }, 100);
          // Hide announcement after 3 seconds
          setTimeout(() => setShowHoldSpinAnnouncement(false), 3000);
        };
        
        // Create Hold & Spin placeholder symbol with lock effects
        const createHoldSpinPlaceholder = (symbolType: string, symbolSize: number): PIXI.Container => {
          const placeholderContainer = new PIXI.Container();
          
          // Get the original symbol texture
          const symbolUrl = config.symbols?.find((_, index) => config.symbolTypes?.[index] === symbolType) || config.symbols?.[0];
          let symbolSprite;
          
          if (symbolUrl && loadedTextures.has(symbolUrl)) {
            symbolSprite = new PIXI.Sprite(loadedTextures.get(symbolUrl));
            symbolSprite.width = symbolSize;
            symbolSprite.height = symbolSize;
          } else {
            // Fallback to graphics if texture not found
            symbolSprite = new PIXI.Graphics();
            symbolSprite.beginFill(0x4A90E2);
            symbolSprite.drawRoundedRect(0, 0, symbolSize, symbolSize, 8);
            symbolSprite.endFill();
          }
          
          // Add lock overlay with golden tint
          const lockOverlay = new PIXI.Graphics();
          lockOverlay.beginFill(0xFFD700, 0.2);
          lockOverlay.lineStyle(3, 0xFFD700, 1);
          lockOverlay.drawRoundedRect(0, 0, symbolSize, symbolSize, 8);
          lockOverlay.endFill();
          
          // Add "BackGround"
          const solidBackground = new PIXI.Graphics();
          solidBackground.beginFill(0x1a1a1a, 1.0); // Solid dark background
          solidBackground.drawRoundedRect(0, 0, symbolSize, symbolSize, 8);
          solidBackground.endFill();
          placeholderContainer.addChild(solidBackground);
          placeholderContainer.addChild(symbolSprite);
          placeholderContainer.addChild(lockOverlay);
          
          // Add pulsing animation
          gsap.to(lockOverlay, {
            alpha: 0.1,
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut'
          });
          return placeholderContainer;
        };
        
        // Enhanced Hold & Spin overlay with symbol placeholders
        const createHoldSpinOverlay = (positions: LockedSymbol[]) => {
          // Clear existing overlays properly
          holdSpinOverlayRef.current.forEach(overlay => {
            if (overlay.parent) overlay.parent.removeChild(overlay);
            overlay.destroy();
          });
          holdSpinOverlayRef.current = [];
          if (!positions || positions.length === 0) return;
          const gridOffsetX = (app.screen.width - (config.reels || 5) * symbolWidthRef.current) / 2;
          const gridOffsetY = (app.screen.height - (config.rows || 3) * symbolHeightRef.current) / 2;
          
          positions.forEach(pos => {
            // Get the actual symbol at this position
            const reel = reelContainersRef.current[pos.reel];
            const symbolSprite = reel?.children[pos.row + 2];
            const symbolType = (symbolSprite as PIXI.DisplayObject & { userData?: { symbolType?: string } })?.userData?.symbolType || 'holdSpin';
            
            // Create placeholder symbol instead of simple box
            const placeholder = createHoldSpinPlaceholder(symbolType, symbolWidthRef.current);
            placeholder.x = gridOffsetX + (pos.reel * symbolWidthRef.current);
            placeholder.y = gridOffsetY + (pos.row * symbolHeightRef.current);
            app.stage.addChild(placeholder);
            holdSpinOverlayRef.current.push(placeholder);
          });
        };
        
        // Handle Hold & Spin respin logic
        const performHoldSpinRespin = () => {
          const currentSpins = holdSpinStateRef.current.spinsRemaining;
          console.log('🎯 performHoldSpinRespin called, spins remaining:', currentSpins);
          
          if (currentSpins <= 0) {
            console.log('🎯 No spins remaining, ending Hold & Spin bonus');
            endHoldSpinBonus();
            return;
          }
          console.log('🎯 Hold & Spin respin with', currentSpins, 'spins remaining');

          // Perform modified spin that only spins unlocked positions
          performHoldSpinSpin();
        };
        
        // End Hold & Spin bonus
        const endHoldSpinBonus = () => {
          console.log('🎯 Hold & Spin bonus ended!');
          
          // Calculate total win from locked symbols using ref
          const currentLocked = holdSpinStateRef.current.lockedSymbols;
          const totalWin = currentLocked.reduce((sum, symbol) => sum + (symbol.value || 0), 0);
          console.log('🎯 Final Hold & Spin win:', totalWin, 'from symbols:', currentLocked);
          setHoldSpinTotalWin(totalWin);
          setBalance(prev => prev + totalWin);
          
          // Clear overlays properly
          holdSpinOverlayRef.current.forEach(overlay => {
            if (overlay.parent) overlay.parent.removeChild(overlay);
            overlay.destroy();
          });
          holdSpinOverlayRef.current = [];
          
          // Show win modal if there's a win
          if (totalWin > 0) {
            setShowHoldSpinWinModal(true);
            // Hide modal after 3 seconds
            setTimeout(() => setShowHoldSpinWinModal(false), 3000);
          }
          
          // Reset Hold & Spin state
          setTimeout(() => {
            setIsInHoldSpinMode(false);
            setLockedSymbols([]);
            setHoldSpinTotalWin(0);
            setHoldSpinSpinsRemaining(0);
            
            // Reset ref
            holdSpinStateRef.current = {
              lockedSymbols: [],
              spinsRemaining: 0,
              isActive: false
            };
            
            // Restore visibility of all symbols
            updateSymbolVisibility();
          }, totalWin > 0 ? 3000 : 0); // Delay reset if showing win modal
        };
        
        // Get unique color for each winning line
        const getLineColor = (lineIndex: number) => {
          const colors = [
            0xFF0000, // Red
            0x00FF00, // Green  
            0x0000FF, // Blue
            0xFFFF00, // Yellow
            0xFF00FF, // Magenta
            0x00FFFF, // Cyan
            0xFFA500, // Orange
            0x800080, // Purple
            0xFFC0CB, // Pink
            0x90EE90, // Light Green
            0xFFB6C1, // Light Pink
            0x87CEEB, // Sky Blue
            0xDDA0DD, // Plum
            0x98FB98, // Pale Green
            0xF0E68C, // Khaki
            0xE6E6FA, // Lavender
            0xFFE4B5, // Moccasin
            0xB0C4DE, // Light Steel Blue
            0xF5DEB3, // Wheat
            0xD3D3D3, // Light Gray
            0xFFA07A, // Light Salmon
            0x20B2AA, // Light Sea Green
            0x87CEFA, // Light Sky Blue
            0xFFB347, // Light Orange
            0xDC143C  // Crimson
          ];
          return colors[lineIndex % colors.length];
        };
        
        // Enhanced win highlights with improved visual effects and shimmer
        const showWinHighlights = (winDetailsArray: WinDetail[]) => {
            winAnimationSystem.showWinHighlights(
            winDetailsArray,
            app,
            config,
            symbolWidthRef,
            symbolHeightRef,
            winHighlightRef,
            setShowWinHighlight,
            setIsWinAnimationPlaying,
            clearWinLines,
            clearExtendedWildSymbols,
            createEnhancedParticleEffect
          );
        };

        // Enhanced particle effect with physics and variety
        const createEnhancedParticleEffect = (x: number, y: number, color: number) => {
          winAnimationSystem.createEnhancedParticleEffect(x, y, color, app);
        };
        
        // Enhanced animated winning lines with improved visual effects
        const showWinLines = (winDetailsArray: WinDetail[]) => {
          winAnimationSystem.showWinLines(
            winDetailsArray,
            app,
            config,
            symbolWidthRef,
            symbolHeightRef,
            winLinesRef,
            // calculateLineLength,
            redrawLineWithProgress,
            createEnhancedFlowingParticles,
            createElectricSpark
          );
        };
        
        // Enhanced flowing particles with trail effects
        const createEnhancedFlowingParticles = (points: Array<{x: number, y: number}>, color: number, container: PIXI.Container) => {
          winAnimationSystem.createEnhancedFlowingParticles(points, color, container);
        };

        // Create electric spark effects at connection points
        const createElectricSpark = (x: number, y: number, color: number) => {
          winAnimationSystem.createElectricSpark(x, y, color, app);
        };
        
        // Enhanced line drawing with progress for smoother animation
        const redrawLineWithProgress = (line: PIXI.Graphics, points: Array<{x: number, y: number}>, progress: number, color: number, thickness: number = 6, alpha: number = 0.9) => {
          winAnimationSystem.redrawLineWithProgress(line, points, progress, color, thickness, alpha);
        };
        
        // Get current reel results from displayed symbols
        const getCurrentReelResults = () => {
          const results: string[][] = [];
          
          reelContainersRef.current.forEach((reelContainer, reelIndex) => {
            const reelSymbols: string[] = [];
            const visibleSymbols = reelContainer.children.slice(2, 2 + (config.rows || 3));
            visibleSymbols.forEach((symbolSprite, rowIndex) => {
              // Get symbol type from sprite userData
              const symbolType = (symbolSprite as PIXI.DisplayObject & {userData?: {symbolType?: string}}).userData?.symbolType || 'low1';
              reelSymbols.push(symbolType);
            });
            results.push(reelSymbols);
          });
          return results;
        };
        
        // Check line for winning combinations
        const checkLineWin = (lineSymbols: string[], betPerLine: number): {amount: number, count: number, symbol: string | null} => {
          if (!lineSymbols || lineSymbols.length < 3) {
            return { amount: 0, count: 0, symbol: null };
          }
            // Process extended wilds as regular wilds for line calculation
          const processedSymbols = lineSymbols.map(symbol => {
            // If symbol has extended property, treat as wild
            return symbol === 'wild' ? 'wild' : symbol;
          });

          // Find the first non-wild, non-scatter, non-bonus symbol to establish the winning symbol type
          let winningSymbolType = null;
          let matchCount = 0;

          for (let i = 0; i < processedSymbols.length; i++) {
            const currentSymbol = processedSymbols[i];

            // Skip scatter, bonus, and holdSpin symbols - they don't contribute to line wins
            if (currentSymbol === 'scatter' || currentSymbol === 'bonus' || isHoldSpinSymbol(currentSymbol)) {
              break; // Stop at scatter, bonus, or holdSpin symbol as it breaks the line
            }

            if (winningSymbolType === null) {
              // First symbol - establish the type (skip wilds)
              if (currentSymbol === 'wild') {
                matchCount++;
                continue;
              } else {
                winningSymbolType = currentSymbol;
                matchCount++;
              }
            } else {
              // Subsequent symbols - must match established type or be wild
              if (currentSymbol === winningSymbolType || currentSymbol === 'wild') {
                matchCount++;
              } else {
                break; // Stop at first non-matching symbol
              }
            }
          }

          // Handle case where all symbols are wilds
          if (winningSymbolType === null && matchCount >= 3) {
            winningSymbolType = 'wild';
          }

          // Scatter, bonus, and holdSpin symbols cannot be the winning symbol type for line wins
         if (winningSymbolType === 'scatter' || winningSymbolType === 'bonus' || (winningSymbolType && isHoldSpinSymbol(winningSymbolType))) {
            return { amount: 0, count: 0, symbol: null };
          }

          // Check for minimum 3 consecutive matches
          if (matchCount >= 3 && winningSymbolType) {
            const paytable = config.symbolPaytable[winningSymbolType as SymbolType] || config.symbolPaytable['low1'];
                        const payout = paytable[matchCount] || 0;

            return {
              amount: payout * betPerLine,
              count: matchCount,
              symbol: winningSymbolType
            };
          }

          return { amount: 0, count: 0, symbol: null };
        };
        
        // Wheel Bonus functionality
        const triggerWheelBonus = () => {
          console.log('🎡 Triggering wheel bonus!');
           
          if (config.bonus?.wheel?.announcementImage) {
            const testImg = new Image();
            testImg.onload = () => {
              const announcementOverlay = document.createElement('div');
              announcementOverlay.className = 'wheel-announcement-overlay';
              announcementOverlay.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
              \`;
              
              const announcementImg = document.createElement('img');
              announcementImg.src = config.bonus.wheel.announcementImage;
              announcementImg.style.cssText = \`
                max-width: 80%;
                max-height: 80%;
                object-fit: contain;
              \`;
              
              announcementOverlay.appendChild(announcementImg);
              document.body.appendChild(announcementOverlay);
              
              setTimeout(() => {
                document.body.removeChild(announcementOverlay);
                setShowWheelBonus(true);
              }, 2000);
            };
            testImg.onerror = () => {
              setShowWheelBonus(true);
            };
            testImg.src = config.bonus.wheel.announcementImage;
          } else {
            setShowWheelBonus(true);
          }
        };
        
        // Store performSpin globally for external access
        (window as WindowWithGameFunctions).performSpin = performSpin;
        (window as WindowWithGameFunctions).triggerWheelBonus = triggerWheelBonus;
        (window as WindowWithGameFunctions).triggerPickAndClickBonus = triggerPickAndClickBonus;
        (window as WindowWithGameFunctions).triggerHoldSpinBonus = triggerHoldSpinBonus;
        (window as WindowWithGameFunctions).performHoldSpinRespin = performHoldSpinRespin;
        (window as WindowWithGameFunctions).performHoldSpinSpin = performHoldSpinSpin;
        (window as WindowWithGameFunctions).clearExtendedWildSymbols = clearExtendedWildSymbols;
        
        // Create global background update function
        (window as WindowWithGameFunctions).updateGameBackground = (newBackgroundUrl: string) => {
          console.log('🎨 Updating game background to:', newBackgroundUrl);
          
          // Find existing background sprite
          const existingBg = app.stage.children.find(child => (child as PIXI.DisplayObject & {isBackground?: boolean}).isBackground);
          if (existingBg) {
            app.stage.removeChild(existingBg);
          }
          
          // Check if texture is already loaded
          if (loadedTextures.has(newBackgroundUrl)) {
            const bg = new PIXI.Sprite(loadedTextures.get(newBackgroundUrl));
            bg.width = app.screen.width;
            bg.height = app.screen.height;
            (bg as PIXI.Sprite & {isBackground: boolean}).isBackground = true;
            app.stage.addChildAt(bg, 0); // Add at bottom layer
            console.log('✅ Background updated from cache');
          } else {
            // Load new background texture
            PIXI.Assets.load(newBackgroundUrl).then(texture => {
              loadedTextures.set(newBackgroundUrl, texture); // Cache the texture
              const bg = new PIXI.Sprite(texture);
              bg.width = app.screen.width;
              bg.height = app.screen.height;
              (bg as PIXI.Sprite & {isBackground: boolean}).isBackground = true;
              app.stage.addChildAt(bg, 0); // Add at bottom layer
              console.log('✅ Background updated successfully');
            }).catch(error => {
              console.warn('⚠️ Failed to load new background:', error);
            });
          }
        };
        
        // Final loading completion
        setLoadingMessage('Game Ready!');
        setLoadingProgress(100);
        
        // Brief delay to show completion
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (isMounted) {
          setIsLoading(false);
        }

        return () => {
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('showWinAnimations', handleShowWinAnimations);
          cleanupStep7();
        };
      } catch (error) {
        console.error('Failed to initialize game:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeGame();

    return () => {
      isMounted = false;
      // Clear any win animations and extended symbols
      if (clearWinHighlights) clearWinHighlights();
      if (clearWinLines) clearWinLines();
      const clearExtended = (window as WindowWithGameFunctions).clearExtendedWildSymbols;
      if (clearExtended) {
        clearExtended();
      }
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [config]);
  
  // Wheel bonus functionality
  const [wheelPrizes, setWheelPrizes] = useState<WheelPrize[]>([]);
  console.log("🚀 ~ generateSlotMachineComponent ~ wheelPrizes:", wheelPrizes)
  const wheelBonus = createWheelBonus();
  
  // Initialize wheel on component mount
  useEffect(() => {
       wheelBonus.initializeWheel(wheelCanvasRef, config, showWheelBonus, setWheelPrizes);
  }, [showWheelBonus, config.bonus?.wheel?.enabled]);

  const handleSpin = () => {
    if (isSpinning) return;

        // Play reel start sound immediately when play button is clicked
    soundSystem.playReelSound('start', soundVolume, freeSpinStateRef.current.isInFreeSpinMode);
    // Handle Hold & Spin mode
    if (isInHoldSpinMode) {
      console.log('🎯 Hold & Spin mode active, spins remaining:', holdSpinSpinsRemaining);
      if (holdSpinSpinsRemaining > 0) {
        console.log('🎯 Hold & Spin respin triggered');
        const holdSpinSpin = (window as WindowWithGameFunctions).performHoldSpinSpin;
        if (holdSpinSpin) {
          holdSpinSpin();
        }
        return;
      } else {
        console.log('🎯 No more Hold & Spin respins available');
        return; // No more respins available
      }
    }

    // Check if we should stop auto play due to insufficient balance
    if (isAutoPlay && !isInFreeSpinMode && balance < bet) {
      console.log('🛑 Auto play stopped: insufficient balance');
      stopAutoPlay();
      return;
    }

    // Handle free spin mode
    if (isInFreeSpinMode && freeSpinsRemaining > 0) {
      console.log('🎰 Free spin triggered');
      setFreeSpinsRemaining(prev => {
   const next = prev - 1;
   freeSpinStateRef.current.spinsRemaining = next;
   return next;
 });
      // No balance deduction for free spins
    } else if (balance >= bet) {
      console.log('🎰 Regular spin triggered');
      setBalance(prev => prev - bet);
    } else {
      return; // Insufficient balance
    }

    // Handle auto play count
    if (isAutoPlay && autoSpinCount > 0) {
      setAutoSpinCount(prev => prev - 1);
    }

    // Call the performSpin function directly
    const performSpinFn = (window as WindowWithGameFunctions).performSpin;
    if (performSpinFn) {
      performSpinFn();
    }
  };

  const adjustBet = (amount: number) => {
    const newBet = Math.max(config.minBet || 1, Math.min(config.maxBet || 100, bet + amount));
    setBet(newBet);
  };

  // Auto Play functionality
  const autoPlay = createAutoPlay();
  
  const stopAutoPlay = () => {
    autoPlay.stopAutoPlay(setIsAutoPlay, setAutoSpinCount, autoSpinTimeoutRef);
  };

  const startAutoPlay = (spins: number = 10) => {
    autoPlay.startAutoPlay(spins, isSpinning, isAutoPlay, setIsAutoPlay, setAutoSpinCount, handleSpin);
  };

  const handleAutoPlay = () => {
    if (showAutoPlaySettings) {
      setShowAutoPlaySettings(false);
    } else {
      autoPlay.handleAutoPlay(isAutoPlay, stopAutoPlay, setShowAutoPlaySettings);
    }
  };

  const startAutoPlayWithSpins = (spins: number) => {
    autoPlay.startAutoPlayWithSpins(spins, setShowAutoPlaySettings, (spinCount: number) => {
      autoPlay.startAutoPlay(spinCount, isSpinning, isAutoPlay, setIsAutoPlay, setAutoSpinCount, handleSpin);
    });
  };
  useEffect(() => {
  if (winAmount > 0 && winAnimation) {
    setShowWinDisplay(true);

    // Animate number counting from 0 to winAmount
    const duration = Math.min(1.5, Math.max(0.5, winAmount / 100)); // Dynamic duration based on amount
    gsap.to({ value: displayedWinAmount }, {
      value: winAmount,
      duration: duration,
      ease: 'power2.out',
      onUpdate: function() {
      setDisplayedWinAmount(this.targets()[0].value);
      }
    });

  } else if (winAmount > 0 && !winAnimation) {
    setDisplayedWinAmount(winAmount);
    setShowWinDisplay(false);
  }
}, [winAmount, winAnimation]);

  // Auto Play Effect - Continue auto play after spin completes
  useEffect(() => {autoPlay.scheduleNextAutoSpin(
      isAutoPlay, 
      isSpinning, 
      autoSpinCount, 
     3000, // autoSpinDelay, 
      autoSpinTimeoutRef, 
      handleSpin, 
      stopAutoPlay
    );
    // Cleanup timeout on unmount or when auto play stops
    return () => {
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current);
        autoSpinTimeoutRef.current = null;
      }
    };
  }, [isAutoPlay, isSpinning, autoSpinCount]);

  // Theme change handler
  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    
    // Update game background based on theme
    let backgroundUrl = config.background;
    if (newTheme === 'day' && config.derivedBackgrounds?.day) {
      backgroundUrl = config.derivedBackgrounds.day;
    } else if (newTheme === 'night' && config.derivedBackgrounds?.night) {
      backgroundUrl = config.derivedBackgrounds.night;
    }
    
    const updateBgFn = (window as WindowWithGameFunctions).updateGameBackground;
    if (updateBgFn) {
      updateBgFn(backgroundUrl);
    }
  };

  // Win Animation Handler - Handles animations with access to winAnimation state
  useEffect(() => {
    const handleWinCalculated = (event: Event) => {
      const customEvent = event as CustomEvent<{winDetails: WinDetail[], finalWin: number, animationType: string}>;
      const { winDetails, finalWin, animationType } = customEvent.detail;

      if (winDetails.length > 0) {
        // Set win animation state to disable spin button
        if (winAnimation) {
          setIsWinAnimationPlaying(true);

          // Fallback timer to ensure spin button is re-enabled after 3.5 seconds
          setTimeout(() => {
            setIsWinAnimationPlaying(false);
          }, 3500);

          // Reset win amount and hide win display after 3 seconds when animations are enabled
          setTimeout(() => {
            setWinAmount(0);
            setDisplayedWinAmount(0);
            setShowWinDisplay(false);
          }, 3000);

          if (appRef.current) {
            // Add screen flash effect for big wins
            if (finalWin >= 100) {
              // Create screen flash effect
              winAnimationSystem.createScreenFlashEffect(finalWin, appRef.current);
            }

            // Trigger win highlights and lines
            window.dispatchEvent(new CustomEvent('showWinAnimations', {
              detail: { winDetails, animationType }
            }));
          }
        } else {
          // When animations are disabled, allow immediate spinning
          setIsWinAnimationPlaying(false);

          // Reset win amount immediately when animations are disabled
          setTimeout(() => {
            setWinAmount(0);
            setDisplayedWinAmount(0);
          }, 1000); // Short delay to show the win briefly
        }
      }
    };

    window.addEventListener('winCalculated', handleWinCalculated);

    return () => {
      window.removeEventListener('winCalculated', handleWinCalculated);
    };
  }, [winAnimation]);

  // Cleanup auto play on component unmount
  useEffect(() => {
    return () => {
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current);
      }
    };
  }, []);


  return (
         <div className="slot-machine-container" onClick={(e) => {
       soundSystem.playClickSound(soundVolume);
       initializeMusic();
       if (showAutoPlaySettings && 
           !target.closest('.relative') && 
           !target.closest('.auto-btn') &&
           !target.closest('.autoplay-control-container') &&
           !target.closest('[class*="bg-gray-900"]')) {
         setShowAutoPlaySettings(false);
       }
     }}>
      {isLoading && (
        <LoadingScreen 
          progress={loadingProgress} 
          message={loadingMessage}
          config={config}
        />
      )}
      <div ref={canvasRef} className="game-canvas" />
      
      {/* Right Side Win Display with Number Images */}
      {showWinDisplay && (
        <div className="right-win-display">
          <div className="win-amount-container">
            <span className="win-currency">Win:</span>
            <div className="win-digits">
              {displayedWinAmount.toFixed(2).split('').map((digit, index) => {
                const imageKey = digit === '.' ? 'dot' : digit;
                return config.numberImages && config.numberImages[imageKey] ? (
                  <img
                    key={index}
                    src={config.numberImages[imageKey]}
                    alt={digit === '.' ? 'decimal point' : digit}
                    className={\`animated-number \${digit === '.' ? 'win-decimal-image' : 'win-digit-image'}\`}
                  />
                ) : (
                  <span key={index} className="win-digit-text animated-number">{digit}</span>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Free Spin Announcement Modal */}
      <AnnouncementModal
        isOpen={showFreeSpinAnnouncement}
        title="🎉 FREE SPINS TRIGGERED! 🎉"
        subtitle={\`\${freeSpinAwardedCount} Free Spins Awarded!\`}
        info={\`\${config.bonus?.freeSpins?.scatterSymbolsRequired || 3} Scatter symbols activated the bonus!\`}
        bgColor="gold"
        imageType="free-spins"
      />
      
      {/* Free Spin Indicator */}
      {isInFreeSpinMode && (
        <div className={\`free-spin-indicator \${freeSpinIndicatorFading ? 'fade-out' : ''}\`}>
          <span className="free-spin-text">Free Spins: {freeSpinsRemaining}</span>
         </div>
      )}
      
      {/* Hold & Spin Announcement Modal */}
      <AnnouncementModal
        isOpen={showHoldSpinAnnouncement}
        title="🎯 HOLD & SPIN TRIGGERED! 🎯"
        subtitle="3 Respins Awarded!"
        info="Land more symbols to reset respins!"
        bgColor="purple"
        imageType="hold-spin"
      />
      
      {/* Hold & Spin Top Bar */}
      {isInHoldSpinMode && (
        <div className="hold-spin-top-bar">
          <div className="hold-spin-bar-content">
            <div className="hold-spin-title">🎯 HOLD & SPIN</div>
            <div className="hold-spin-counter">
              <span className="spins-label">RESPINS:</span>
              <span className="spins-count">{holdSpinSpinsRemaining}</span>
            </div>
            <div className="hold-spin-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: \`\${(holdSpinSpinsRemaining / 3) * 100}%\` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hold & Spin Win Modal */}
      {showHoldSpinWinModal && (
        <div className="hold-spin-win-modal">
          <div className="hold-spin-win-content">
            <h2>🎯 HOLD & SPIN COMPLETE!</h2>
            <div className="hold-spin-win-amount">
              <span className="win-label">TOTAL WIN:</span>
              <span className="win-value">\${holdSpinTotalWin}</span>
            </div>
            <div className="hold-spin-win-details">
              {lockedSymbols.length} symbols locked
            </div>
          </div>
        </div>
      )}
              
      {/* Near Miss Modal */}
      {showNearMissModal && (
        <div className="near-miss-modal">
          <div className="near-miss-content">
            <h2>😔 SO CLOSE!</h2>
            <p>You got {nearMissScatterCount} scatter symbols!</p>
            <div className="near-miss-info">You needed just 1 more for FREE SPINS!</div>
            <div className="near-miss-encouragement">Try again - you're almost there! 🎯</div>
          </div>
        </div>
      )}
      
      {/* UI Overlay */}
      <UiButtons
      startAutoPlayWithSpins={startAutoPlayWithSpins}
      handleSpin={handleSpin}
      adjustBet={adjustBet}
      displayedWinAmount={displayedWinAmount}
      soundSystem={soundSystem}
      soundControlRef={soundControlRef}
      settingsRef={settingsRef}
      />

          {showSoundBar && (
              <div className="sound-bar-popup">
                <div className="sound-bar-container">
                  <div className="sound-bar-track">
                    <div 
                      className="sound-bar-fill" 
                      style={{ height: \`\${soundVolume}%\` }}
                    />
                    <div 
                      className="sound-bar-handle" 
                      style={{ bottom: \`\${soundVolume}%\` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={soundVolume}
                      onChange={(e) => soundSystem.updateVolume(e.target.value, setSoundVolume)}
                      className="sound-slider"
                      // orient="vertical"
                    />
                  </div>
                  <div className="sound-value">{soundVolume}%</div>
                </div>
              </div>
            )}
        {showSettings && (
              <div className="absolute bottom-16 right-0 bg-black/90 border border-gray-600 rounded-lg p-4 backdrop-blur-sm z-[1001] min-w-[200px] animate-[settingsSlideUp_0.2s_ease-out]" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center gap-3">
                   <span className="text-white text-sm font-medium">Volume</span>
                    <div className="flex items-center gap-2">
                      <div className="relative w-20 h-1 bg-white/20 rounded-sm">
                        <div 
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-sm transition-all"
                          style={{ width: \`\${soundVolume}%\` }}
                        />
                        <div 
                           className="absolute top-1/2 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full shadow-sm transform -translate-y-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity"
                          style={{ left: \`\${soundVolume}%\` }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={soundVolume}
                          onChange={(e) => soundSystem.updateVolume(e.target.value, setSoundVolume)}
                          className="absolute top-0 left-0 w-full h-3 opacity-0 cursor-pointer"
                        />
                      </div>
                       <span className="text-white text-xs font-semibold min-w-[30px] text-right">{soundVolume}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-white text-sm font-medium">Win Animation</span>
                    <label className="relative inline-block w-11 h-6">
                      <input
                        type="checkbox"
                        checked={!!winAnimation}
                        onChange={(e) => setWinAnimation(e.target.checked)}
                        className="opacity-0 w-0 h-0"
                      />
                      <span className={\`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors \${winAnimation ? 'bg-yellow-400' : 'bg-white/20'} before:absolute before:content-[''] before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:transition-transform before:rounded-full \${winAnimation ? 'before:translate-x-5' : ''}\`}></span>
                    </label>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-white text-sm font-medium">Win Animation Control</span>
                    <span className="text-gray-400 text-xs leading-tight">When enabled: Shows win highlights</span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-white text-sm font-medium">Theme</span>
                    <div className="flex gap-1">
                      <button 
                        className={\`w-6 h-6 rounded border-2 transition-all \${theme === 'normal' ? 'border-yellow-400 bg-gray-600' : 'border-gray-500 bg-gray-700 hover:border-gray-400'}\`}
                        onClick={() => handleThemeChange('normal')}
                        title="Normal Theme"
                      />
                      <button 
                        className={\`w-6 h-6 rounded border-2 transition-all \${theme === 'day' ? 'border-yellow-400 bg-yellow-200' : 'border-gray-500 bg-yellow-300 hover:border-gray-400'}\`}
                        onClick={() => handleThemeChange('day')}
                        title="Day Theme"
                      />
                      <button 
                        className={\`w-6 h-6 rounded border-2 transition-all \${theme === 'night' ? 'border-yellow-400 bg-blue-900' : 'border-gray-500 bg-blue-800 hover:border-gray-400'}\`}
                        onClick={() => handleThemeChange('night')}
                        title="Night Theme"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

      {/* Animation Status Indicator */}
      <div className={\`animation-status \${isSpinning ? 'visible speed-indicator' : ''}\`}>
        Speed: {animationSettings.speed}x | Blur: {animationSettings.blurIntensity}px | {animationSettings.easing}
      </div>

      {/* Win Details Popup */}
      {showWinHighlight && winDetails.length > 0 && !isInFreeSpinMode &&  (
        <div className="fixed top-1/2 left-[15%] transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-black/95 to-gray-800/95 border-2 border-yellow-400 rounded-2xl p-6 z-[2500] backdrop-blur-sm shadow-2xl min-w-[300px] max-w-[500px] animate-[winPopupSlideIn_0.5s_ease-out]">
          <div className="text-center mb-5 border-b border-yellow-400/30 pb-4">
            <h3 className="text-yellow-400 text-2xl mb-2 font-bold text-shadow">🎉 Winning Lines!</h3>
            <div className="text-white text-lg font-semibold">Total Win: {winAmount.toFixed(2)}</div>
          </div>
          <div className="flex flex-col gap-3">
            {winDetails.map((detail, index) => (
              <div key={index} className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 transition-all hover:bg-yellow-400/20 hover:-translate-y-0.5" style={{ borderLeft: \`4px solid #\${detail.color.toString(16).padStart(6, '0')}\` }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-yellow-400 font-semibold text-sm flex items-center gap-2" style={{ color: \`#\${detail.color.toString(16).padStart(6, '0')}\` }}>
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 shadow-sm animate-[colorPulse_2s_ease-in-out_infinite]" style={{ backgroundColor: \`#\${detail.color.toString(16).padStart(6, '0')}\` }}></span>
                    Line {detail.line}
                  </span>
                  <span className="text-green-500 font-bold text-base">\${detail.amount.toFixed(2)}</span>
                </div>
                <div className="text-white/80 text-xs capitalize">
                  {detail.count}x {detail.symbol.toUpperCase()} symbols
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branding Bar */}
      <div className="branding-bar">
        <span className="brand-text">Powered by SlotAI </span>
      </div>
      
      {/* Info Modal */}
      <InfoPage 
        isOpen={showInfo} 
        onClose={() => {
          soundSystem.playClickSound(soundVolume);
          setShowInfo(false);
        }} 
        gameTitle={config.name || config.gameId || 'My Slot Game'} 
      />
      
      {/* Menu Modal */}
      <MenuModal
        isOpen={showMenu}
        onClose={() => {
          soundSystem.playClickSound(soundVolume);
          setShowMenu(false);
        }}
        onLogout={() => window.location.reload()}
      />

      {/* Wheel Bonus Modal */}
      {showWheelBonus && (
            <div className="wheel-bonus-overlay" onClick={() => soundSystem.playClickSound(soundVolume)}>
          <div className="wheel-bonus-modal">
            <div className="wheel-bonus-header">
              <h2>🎡 WHEEL BONUS!</h2>
              <p>Spin the wheel to win prizes!</p>
            </div>
            <div className="wheel-bonus-content">
              <canvas
                ref={wheelCanvasRef}
                width={300}
                height={300}
                className="wheel-canvas"
                onClick={() => {
                  if (!isSpinning && wheelResult === 0) {
                    wheelBonus.spinWheel(wheelCanvasRef, config, setIsSpinning, setWheelPrizes, setWheelResult);
                  }
                }}
              />
              <div className="wheel-instructions">
                {!isSpinning ? 'Click the wheel to spin!' : 'Spinning...'}
              </div>
              {wheelResult > 0 && (
                <div className="wheel-result">
                  <h3>You won: {wheelResult}x your bet!</h3>
                  <button 
                    className="collect-btn"
                    onClick={() => {
                      setBalance(prev => prev + (wheelResult * bet));
                      setShowWheelBonus(false);
                      setWheelResult(0);
                    }}
                  >
                    Collect Prize
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Pick & Click Announcement Modal */}
      <AnnouncementModal
        isOpen={showPickAndClickAnnouncement}
        title="🎯 PICK & CLICK TRIGGERED! 🎯"
        subtitle="Choose your prizes!"
        info={\`\${config.bonus?.pickAndClick?.picks || 3} picks available!\`}
        bgColor="purple"
        imageType="pick-click"
      />
      
      {/* Pick & Click Modal */}
      <PickAndClickModal
        isOpen={showPickAndClickModal}
        onClose={() => setShowPickAndClickModal(false)}
        config={{
          ...config,
          bonusNumberImages: config.bonusNumberImages || {}
        }}
        onWin={(amount) => {
          setPickAndClickWinAmount(amount);
          setBalance(prev => prev + amount);
          setShowPickAndClickModal(false);
          setShowPickAndClickWinModal(true);
          // Hide win modal after 3 seconds
          setTimeout(() => setShowPickAndClickWinModal(false), 3000);
        }}
      />
      
      {/* Pick & Click Win Modal */}
      {showPickAndClickWinModal && (
        <div className="pick-click-win-modal">
          <div className="pick-click-win-content">
            <h2>🎯 PICK & CLICK COMPLETE!</h2>
            <div className="pick-click-win-amount">
              <span className="win-label">TOTAL WIN:</span>
              <span className="win-value">{pickAndClickWinAmount}</span>
            </div>
            <div className="pick-click-win-details">
              Congratulations on your bonus win!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SlotMachine;`;