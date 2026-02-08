export const gameInitializationFile = () => `
import * as PIXI from 'pixi.js';
import { GameConfig } from '../types';
// Simple utility function for game initialization
export const createGameInitialization = () => {
  const loadingPhases = [
    { message: 'Initializing Game Engine...', duration: 800 },
    { message: 'Loading Game Symbols...', duration: 1200 },
    { message: 'Setting up Audio...', duration: 600 },
    { message: 'Preparing Interface...', duration: 800 },
    { message: 'Starting Game...', duration: 400 }
  ];

  const simulateLoadingPhases = async (
    setLoadingMessage: (message: string) => void,
    setLoadingProgress: (progress: number) => void,
    isMounted: boolean
  ) => {
    let currentProgress = 0;
    for (let i = 0; i < loadingPhases.length; i++) {
      const phase = loadingPhases[i];
      setLoadingMessage(phase.message);
      
      const targetProgress = ((i + 1) / loadingPhases.length) * 80; // 80% for phases
      const startProgress = currentProgress;
      const progressDiff = targetProgress - startProgress;
      
      // Animate progress for this phase
      const startTime = Date.now();
      while (Date.now() - startTime < phase.duration && isMounted) {
        const elapsed = Date.now() - startTime;
        const phaseProgress = Math.min(elapsed / phase.duration, 1);
        const easedProgress = phaseProgress < 0.5 
          ? 2 * phaseProgress * phaseProgress 
          : 1 - Math.pow(-2 * phaseProgress + 2, 3) / 2;
        
        currentProgress = startProgress + (progressDiff * easedProgress);
        setLoadingProgress(currentProgress);
        
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
      }
    }
  };

  const createPixiApp = () => {
    return new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1a1a1a,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
  };

  const collectAssets = (config: GameConfig) => {
    const assetsToLoad = [];
    if (config.background) assetsToLoad.push(config.background);
    
    // Add derived backgrounds to assets
    if (config.derivedBackgrounds) {
      Object.values(config.derivedBackgrounds).forEach(bgUrl => {
        if (bgUrl) assetsToLoad.push(bgUrl);
      });
    }
    
    if (config.symbols && config.symbols.length > 0) {
      assetsToLoad.push(...config.symbols.filter(Boolean));
    }
    
    // Add extended symbols to assets
    if (config.extendedSymbols) {
      Object.values(config.extendedSymbols).forEach(extUrl => {
        if (extUrl) assetsToLoad.push(extUrl);
      });
    }

    return assetsToLoad;
  };

  const loadAssets = async (
    assetsToLoad: string[],
    setLoadingProgress: (progress: number) => void,
    isMounted: boolean
  ) => {
    const loadedTextures = new Map();
    let loadedCount = 0;
    const baseProgress = 80;
    
    for (const assetUrl of assetsToLoad) {
      try {
        const texture = await PIXI.Assets.load(assetUrl);
        if (isMounted) {
          loadedTextures.set(assetUrl, texture);
          loadedCount++;
          const assetProgress = baseProgress + ((loadedCount / assetsToLoad.length) * 20);
          setLoadingProgress(assetProgress);
        }
      } catch (error) {
        console.warn('Failed to load asset:', assetUrl, error);
        // Create fallback texture
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#4A90E2';
          ctx.fillRect(0, 0, 200, 200);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('SYMBOL', 100, 100);
        }
        const fallbackTexture = PIXI.Texture.from(canvas);
        if (isMounted) {
          loadedTextures.set(assetUrl, fallbackTexture);
          loadedCount++;
          const assetProgress = baseProgress + ((loadedCount / assetsToLoad.length) * 20);
          setLoadingProgress(assetProgress);
        }
      }
    }

    return loadedTextures;
  };

  return {
    simulateLoadingPhases,
    createPixiApp,
    collectAssets,
    loadAssets
  };
};`

export const generateWheelBonus = () => `
import { GameConfig, WheelPrize } from '../types';
export const createWheelBonus = () => {
  const generateWheelPrizes = (config: GameConfig): WheelPrize[] => {
    const segments = config.bonus?.wheel?.segments || 8;
    const maxMultiplier = config.bonus?.wheel?.maxMultiplier || 50;
    
    const prizes: WheelPrize[] = [];
    for (let i = 0; i < segments; i++) {
      if (config.bonus?.wheel?.levelUp && i === 2) {
        prizes.push({ type: 'levelup', value: 0 });
      } else if (config.bonus?.wheel?.respin && i === 5) {
        prizes.push({ type: 'respin', value: 0 });
      } else {
        let value;
        if (i < segments * 0.6) {
          value = Math.floor(Math.random() * (maxMultiplier * 0.2) + 1);
        } else if (i < segments * 0.9) {
          value = Math.floor(Math.random() * (maxMultiplier * 0.5) + (maxMultiplier * 0.2));
        } else {
          value = Math.floor(Math.random() * (maxMultiplier * 0.3) + (maxMultiplier * 0.7));
        }
        prizes.push({ type: 'prize', value });
      }
    }
    return prizes;
  };

  const spinWheel = (
    wheelCanvasRef: React.RefObject<HTMLCanvasElement>,
    config: GameConfig,
    setIsSpinning: (spinning: boolean) => void,
    setWheelPrizes: (prizes: WheelPrize[]) => void,
    setWheelResult: (result: number) => void
  ) => {
    if (!wheelCanvasRef.current) return;
    
    setIsSpinning(true);
    const canvas = wheelCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const segments = config.bonus?.wheel?.segments || 8;
    const prizes = generateWheelPrizes(config);
    setWheelPrizes(prizes);
    
    // Animate wheel spin
    let rotation = 0;
    const finalRotation = Math.random() * 360 + 1440; // At least 4 full rotations
    const duration = 3000; // 3 seconds
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      rotation = finalRotation * easeOut;
      
      drawWheel(ctx, canvas, segments, prizes, rotation);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Determine winning segment - pointer is at top (270 degrees)
        const segmentAngle = 360 / segments;
        // Pointer is at top (270 degrees), wheel rotated by 'rotation' degrees
        // We need to find which segment is now under the pointer
        const effectiveAngle = (270 - (rotation % 360) + 360) % 360;
        const winningSegment = Math.floor(effectiveAngle / segmentAngle);

        const prize = prizes[winningSegment];
        console.log('🎯 Winning segment:', winningSegment, 'Prize:', prize);
        
        if (prize && prize.type === 'prize') {
          setWheelResult(prize.value || 1);
        } else if (prize && (prize.type === 'levelup' || prize.type === 'respin')) {
          setWheelResult(10); // Default prize for special segments
        } else {
          setWheelResult(winningSegment + 1); // Fallback
        }
        
        setIsSpinning(false);
      }
    };
    
    animate();
  };

  const drawWheel = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    segments: number, 
    prizes: WheelPrize[], 
    rotation: number = 0
  ) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.4;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    
    const colors = ['#EF5350', '#42A5F5', '#66BB6A', '#FFA726', '#8D6E63', '#26A69A', '#EC407A', '#7E57C2'];
    const anglePerSegment = (Math.PI * 2) / segments;
    
    for (let i = 0; i < segments; i++) {
      const startAngle = i * anglePerSegment;
      const endAngle = (i + 1) * anglePerSegment;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      
      if (prizes.length > 0 && prizes[i] && prizes[i].type === 'levelup') {
        ctx.fillStyle = '#FFD700';
      } else if (prizes.length > 0 && prizes[i] && prizes[i].type === 'respin') {
        ctx.fillStyle = '#D1C4E9';
      } else {
        ctx.fillStyle = colors[i % colors.length];
      }
      ctx.fill();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text
      ctx.save();
      ctx.rotate(startAngle + anglePerSegment / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#FFFFFF';
      
      if (prizes.length > 0 && prizes[i]) {
        if (prizes[i].type === 'levelup') {
          ctx.fillText('LEVEL UP', radius * 0.7, 0);
        } else if (prizes[i].type === 'respin') {
          ctx.fillText('RESPIN', radius * 0.7, 0);
        } else {
          ctx.fillText(\`\${prizes[i].value || 1}x\`, radius * 0.7, 0);
        }
      } else {
        ctx.fillText(\`\${i + 1}x\`, radius * 0.7, 0);
      }
      ctx.restore();
    }
    
    ctx.restore();
    
    // Draw pointer at top
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius + 10);     
    ctx.lineTo(centerX - 10, centerY - radius - 10);   
    ctx.lineTo(centerX + 10, centerY - radius - 10); 

    ctx.closePath();
    ctx.fillStyle = '#E53935';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const initializeWheel = (
    wheelCanvasRef: React.RefObject<HTMLCanvasElement>,
    config: GameConfig,
    showWheelBonus: boolean,
    setWheelPrizes: (prizes: WheelPrize[]) => void
  ) => {
    if (wheelCanvasRef.current && config.bonus?.wheel?.enabled && showWheelBonus) {
      const canvas = wheelCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const segments = config.bonus.wheel.segments || 8;
        const initialPrizes = generateWheelPrizes(config);
        setWheelPrizes(initialPrizes);
        drawWheel(ctx, canvas, segments, initialPrizes);
      }
    }
  };

  return {
    generateWheelPrizes,
    spinWheel,
    drawWheel,
    initializeWheel
  };
};`

export const generateAutoPlay = () => `
export const createAutoPlay = () => {
  return {
    // Stop auto play functionality
    stopAutoPlay: (
      setIsAutoPlay: (value: boolean) => void,
      setAutoSpinCount: (value: number) => void,
      autoSpinTimeoutRef: React.MutableRefObject<number | null>
    ) => {
      console.log('🛑 Stopping auto play');
      setIsAutoPlay(false);
      setAutoSpinCount(0);

      // Clear any pending timeout
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current);
        autoSpinTimeoutRef.current = null;
      }
    },

    // Start auto play with specified number of spins
    startAutoPlay: (
      spins: number = 10,
      isSpinning: boolean,
      isAutoPlay: boolean,
      setIsAutoPlay: (value: boolean) => void,
      setAutoSpinCount: (value: number) => void,
      handleSpin: () => void
    ) => {
      if (isSpinning || isAutoPlay) return;

      console.log('🤖 Starting auto play with', spins, 'spins');
      setIsAutoPlay(true);
      setAutoSpinCount(spins);

      // Start the first spin immediately
      handleSpin();
    },

    // Handle auto play button click
    handleAutoPlay: (
      isAutoPlay: boolean,
      stopAutoPlayFn: () => void,
      setShowAutoPlaySettings: (value: boolean) => void
    ) => {
      console.log('🎯 Auto button clicked, isAutoPlay:', isAutoPlay);
      if (isAutoPlay) {
        stopAutoPlayFn();
      } else {
        // Show auto play settings modal
        console.log('🎯 Setting showAutoPlaySettings to true');
        setShowAutoPlaySettings(true);
        console.log('🎯 showAutoPlaySettings should now be true');
      }
    },

    // Start auto play with specific spin count from modal
    startAutoPlayWithSpins: (
      spins: number,
      setShowAutoPlaySettings: (value: boolean) => void,
      startAutoPlayFn: (spins: number) => void
    ) => {
      console.log('🎯 Starting auto play with', spins, 'spins');
      setShowAutoPlaySettings(false);
      startAutoPlayFn(spins);
    },

    // Schedule next auto spin
    scheduleNextAutoSpin: (
      isAutoPlay: boolean,
      isSpinning: boolean,
      autoSpinCount: number,
      autoSpinDelay: number,
      autoSpinTimeoutRef: React.MutableRefObject<number | null>,
      handleSpin: () => void,
      stopAutoPlayFn: () => void
    ) => {
      if (isAutoPlay && !isSpinning && autoSpinCount > 0) {
        console.log('⏰ Scheduling next auto spin in', autoSpinDelay, 'ms');
        // Schedule next auto spin
        autoSpinTimeoutRef.current = setTimeout(() => {
          console.log('🎰 Auto spin timeout triggered');
          if (isAutoPlay && autoSpinCount > 0) {
            handleSpin();
          }
        }, autoSpinDelay);
      } else if (isAutoPlay && autoSpinCount === 0) {
        // Auto play completed
        console.log('✅ Auto play completed');
        stopAutoPlayFn();
      }
    }
  };
};`

export const generateSoundSystem = () => `
export const createSoundSystem = () => {
  // Preload audio files
  const audioCache: Record<string, HTMLAudioElement> = {};
  
  const preloadAudio = (key: string, path: string) => {
    if (!audioCache[key]) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.onloadeddata = () => {
      };
      audio.onerror = () => {
        delete audioCache[key];
      };
      audioCache[key] = audio;
    }
  };
  
  // Preload reel sounds
  preloadAudio('reelStart', '/assets/audio/reels/Reel Start.mp3');
  preloadAudio('reelStop', '/assets/audio/reels/Stop Soft.mp3');
  preloadAudio('click', '/assets/audio/ui/Click.mp3');
  preloadAudio('smallWin', '/assets/audio/wins/Small Win.mp3');
  preloadAudio('mediumWin', '/assets/audio/wins/Medium Win.mp3');
  preloadAudio('bigWin', '/assets/audio/wins/Big Win.mp3');
  preloadAudio('megaWin', '/assets/audio/wins/Mega Win.mp3');
  preloadAudio('bonusTrigger', '/assets/audio/bonus/Bonus Trigger.mp3');
  preloadAudio('freeSpinStart', '/assets/audio/bonus/Free Spins Start.mp3');
  preloadAudio('freeSpinEnd', '/assets/audio/bonus/Free Spins End.mp3');
  preloadAudio('musicBed', '/assets/audio/background/Music Bed.mp3');
  return {

  // Play background music
    playBackgroundMusic: (volume: number) => {
      const audio = audioCache['musicBed'];
      if (audio && !audio.error) {
        audio.volume = Math.max(0, Math.min(1, (volume * 0.4) / 100)); // 40% weight
        audio.loop = true;
        audio.play().catch(e => console.warn('Background music play failed:', e));
      }
    },

    // Stop background music
    stopBackgroundMusic: () => {
      const audio = audioCache['musicBed'];
      if (audio && !audio.error) {
        audio.pause();
        audio.currentTime = 0;
      }
    },

  playReelSound: (type: 'start' | 'stop', volume: number, isInFreeSpinMode?: boolean) => {
      
      let key;
      if (type === 'start') {
        key = isInFreeSpinMode && audioCache['freeSpinStart'] && !audioCache['freeSpinStart'].error ? 'freeSpinStart' : 'reelStart';
      } else {
        // Handle reel stop audio based on spin type
        if (isInFreeSpinMode && audioCache['freeSpinEnd'] && !audioCache['freeSpinEnd'].error) {
          key = 'freeSpinEnd';
        } else if (audioCache['reelStop'] && !audioCache['reelStop'].error) {
          key = 'reelStop';
        } else {
          console.warn('❌ No reel stop audio available');
          return; // No audio available
        }
      }
      
      const audio = audioCache[key];
      if (audio && !audio.error) {
        audio.volume = Math.max(0, Math.min(1, volume / 100));
        audio.currentTime = 0;
      } else {
        console.warn('❌ Audio not available or has error:', audio?.error);
      }
    },



    // Play click sound
    playClickSound: (volume: number) => {
      const audio = audioCache['click'];
      if (audio) {
        audio.volume = Math.max(0, Math.min(1, volume / 100));
        audio.currentTime = 0;
      }
    },
    // Play win sound based on amount
    playWinSound: (winAmount: number, volume: number) => {
      let audioKey = 'smallWin';
      
      if (winAmount >= 0.5 && winAmount <= 25) {
        audioKey = 'smallWin';
      } else if (winAmount >= 25.5 && winAmount <= 50) {
        audioKey = 'mediumWin';
      } else if (winAmount >= 50.5 && winAmount <= 100) {
        audioKey = 'bigWin';
      } else if (winAmount >= 100.5) {
        audioKey = 'megaWin';
      }
      
      const audio = audioCache[audioKey];
      if (audio) {
        audio.volume = Math.max(0, Math.min(1, volume / 100));
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Audio play failed:', e));
      }
    },

        // Play bonus trigger sound
    playBonusTriggerSound: (volume: number) => {
      const audio = audioCache['bonusTrigger'];
      if (audio) {
        audio.volume = Math.max(0, Math.min(1, volume / 100));
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Audio play failed:', e));
      }
    },

    // Handle click outside sound controls
    handleClickOutside: (
      event: MouseEvent,
      soundControlRef: React.RefObject<HTMLDivElement>,
      setShowSoundBar: (value: boolean) => void
    ) => {
      if (soundControlRef.current && !soundControlRef.current.contains(event.target as Node)) {
        setShowSoundBar(false);
      }
    },

    // Toggle sound bar visibility
    toggleSoundBar: (
      showSoundBar: boolean,
      setShowSoundBar: (value: boolean) => void
    ) => {
      setShowSoundBar(!showSoundBar);
    },

    // Update sound volume
    updateVolume: (
      value: string,
      setSoundVolume: (value: number) => void
    ) => {
      const newVolume = parseInt(value);
      setSoundVolume(newVolume);
      // Update background music volume with 40% weight
      const audio = audioCache['musicBed'];
      if (audio && !audio.error) {
        audio.volume = Math.max(0, Math.min(1, (newVolume * 0.4) / 100));
      }
    },

    // Setup click outside listener
    setupClickOutsideListener: (
      showSoundBar: boolean,
      soundControlRef: React.RefObject<HTMLDivElement>,
      setShowSoundBar: (value: boolean) => void
    ) => {
      const handleClickOutside = (event: MouseEvent) => {
        if (soundControlRef.current && !soundControlRef.current.contains(event.target as Node)) {
          setShowSoundBar(false);
        }
      };

      if (showSoundBar) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }

      return () => {};
    }
  };
};`

export const generateWinANimation = () => `
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { WinDetail, GameConfig } from '../types';

export const createWinAnimationSystem = () => {
  return {
    // Clear win highlights
    clearWinHighlights: (winHighlightRef: React.MutableRefObject<PIXI.Container[]>) => {
      winHighlightRef.current.forEach(highlight => {
        if (highlight && !highlight.destroyed) {
          if (highlight.parent) {
            highlight.parent.removeChild(highlight);
          }
          highlight.destroy();
        }
      });
      winHighlightRef.current = [];
    },

    // Clear win lines
    clearWinLines: (winLinesRef: React.MutableRefObject<PIXI.Graphics[]>) => {
      if (winLinesRef.current) {
        winLinesRef.current.forEach(line => {
          if (line && !line.destroyed) {
            if (line.parent) {
              line.parent.removeChild(line);
            }
            line.destroy();
          }
        });
        winLinesRef.current = [];
      }
    },

    // Enhanced win highlights with improved visual effects and shimmer
    showWinHighlights: (
      winDetailsArray: WinDetail[],
      app: PIXI.Application,
      config: GameConfig,
      symbolWidthRef: React.MutableRefObject<number>,
      symbolHeightRef: React.MutableRefObject<number>,
      winHighlightRef: React.MutableRefObject<PIXI.Container[]>,
      setShowWinHighlight: (value: boolean) => void,
      setIsWinAnimationPlaying: (value: boolean) => void,
      clearWinLines: () => void,
      clearExtendedWildSymbols: () => void,
      createEnhancedParticleEffect: (x: number, y: number, color: number) => void
    ) => {
      // Clear existing highlights
      winHighlightRef.current.forEach(highlight => {
        if (highlight && !highlight.destroyed) {
          if (highlight.parent) {
            highlight.parent.removeChild(highlight);
          }
          highlight.destroy();
        }
      });
      winHighlightRef.current = [];

      const highlights: PIXI.Container[] = [];

      // Create enhanced highlights for each winning position
      winDetailsArray.forEach((winDetail, winIndex) => {
        winDetail.positions.forEach((pos, posIndex: number) => {
          const highlightContainer = new PIXI.Container();

          // Main highlight background
          const highlight = new PIXI.Graphics();

          // Enhanced border with gradient effect
          const borderThickness = 5;
          highlight.lineStyle(borderThickness, winDetail.color, 1);

          // Create gradient fill effect
          const alpha1 = 0.4;
          highlight.beginFill(winDetail.color, alpha1);
          highlight.drawRoundedRect(0, 0, symbolWidthRef.current, symbolHeightRef.current, 12);
          highlight.endFill();

          // Add inner glow effect
          const innerGlow = new PIXI.Graphics();
          innerGlow.lineStyle(2, 0xFFFFFF, 0.8);
          innerGlow.beginFill(0xFFFFFF, 0.1);
          innerGlow.drawRoundedRect(4, 4, symbolWidthRef.current - 8, symbolHeightRef.current - 8, 8);
          innerGlow.endFill();
          highlight.addChild(innerGlow);

          // Create shimmer effect overlay
          const shimmer = new PIXI.Graphics();
          shimmer.beginFill(0xFFFFFF, 0.6);
          shimmer.drawRect(-20, 0, 20, symbolHeightRef.current);
          shimmer.endFill();
          shimmer.x = -20; // Start off-screen left

          // Add shimmer to container
          highlightContainer.addChild(highlight);
          highlightContainer.addChild(shimmer);

          // Create mask for shimmer effect
          const shimmerMask = new PIXI.Graphics();
          shimmerMask.beginFill(0xFFFFFF);
          shimmerMask.drawRoundedRect(0, 0, symbolWidthRef.current, symbolHeightRef.current, 12);
          shimmerMask.endFill();
          shimmer.mask = shimmerMask;
          highlightContainer.addChild(shimmerMask);

          // Position highlight container
          const gridOffsetX = (app.screen.width - (config.reels || 5) * symbolWidthRef.current) / 2;
          const gridOffsetY = (app.screen.height - (config.rows || 3) * symbolHeightRef.current) / 2;

          highlightContainer.x = gridOffsetX + (pos.reel * symbolWidthRef.current);
          highlightContainer.y = gridOffsetY + (pos.row * symbolHeightRef.current);

   // Smooth animation sequence with optimized timing
          const delay = winIndex * 0.15 + posIndex * 0.08;

          // Initial scale-in animation
          highlightContainer.scale.set(0);
          highlightContainer.alpha = 0;

          gsap.to(highlightContainer.scale, {
            x: 1,
            y: 1,
            duration: 0.3,
            delay: delay,
            ease: 'back.out(1.4)'
          });

          gsap.to(highlightContainer, {
            alpha: 1,
            duration: 0.25,
            delay: delay,
            ease: 'power2.out'
          });

          // Shimmer sweep animation
          gsap.delayedCall(delay + 0.3, () => {
            gsap.to(shimmer, {
              x: symbolWidthRef.current + 20,
              duration: 0.6,
              ease: 'power1.out',
              repeat: -1,
              repeatDelay: 1.5
            });
          });

          // Enhanced pulsing glow animation with color cycling
          gsap.delayedCall(delay + 0.25, () => {
            const tl = gsap.timeline({ repeat: -1 });
            tl.to(highlight, {
              alpha: 0.8,
              duration: 0.5,
              ease: 'sine.inOut'
            })
            .to(highlightContainer.scale, {
              x: 1.03,
              y: 1.03,
              duration: 0.5,
              ease: 'sine.inOut'
            }, 0)
            .to(highlight, {
              alpha: 1,
              duration: 0.5,
              ease: 'sine.inOut'
            })
            .to(highlightContainer.scale, {
              x: 1,
              y: 1,
              duration: 0.5,
              ease: 'sine.inOut'
            }, '-=0.5');
          });

          // Add enhanced particle effect for high-value wins
          if (winDetail.amount > 50) {
            gsap.delayedCall(delay + 0.6, () => {
              createEnhancedParticleEffect(highlightContainer.x + symbolWidthRef.current/2, highlightContainer.y + symbolHeightRef.current/2, winDetail.color);
            });
          }

          app.stage.addChild(highlightContainer);
          highlights.push(highlightContainer);
        });
      });

      winHighlightRef.current = highlights;
      setShowWinHighlight(true);

      // Hide highlights after 2.5 seconds with smooth fade-out
      gsap.delayedCall(2.5, () => {
        highlights.forEach((highlight, index) => {
          gsap.to(highlight, {
            alpha: 0,
            scale: 0.9,
            duration: 0.4,
            delay: index * 0.05,
            ease: 'power2.in',
            onComplete: () => {
              if (highlight.parent) {
                highlight.parent.removeChild(highlight);
              }
              highlight.destroy();
            }
          });
        });
        clearWinLines();
        clearExtendedWildSymbols();
        setShowWinHighlight(false);
        setIsWinAnimationPlaying(false);
      });
    },

    // Create particle effect for enhanced celebrations
    createParticleEffect: (x: number, y: number, color: number, app: PIXI.Application) => {
      const particleCount = 8;
      const particles: PIXI.Graphics[] = [];

      for (let i = 0; i < particleCount; i++) {
        const particle = new PIXI.Graphics();
        particle.beginFill(color, 0.8);
        particle.drawCircle(0, 0, 3);
        particle.endFill();

        particle.x = x;
        particle.y = y;

        const angle = (i / particleCount) * Math.PI * 2;
        const distance = 40 + Math.random() * 20;
        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance;

        app.stage.addChild(particle);
        particles.push(particle);

        // Animate particle outward with fade
        gsap.to(particle, {
          x: targetX,
          y: targetY,
          alpha: 0,
          duration: 1.2,
          ease: 'power2.out',
          onComplete: () => {
            if (particle.parent) {
              particle.parent.removeChild(particle);
            }
            particle.destroy();
          }
        });
      }
    },

    // Enhanced particle effect with physics and variety
    createEnhancedParticleEffect: (x: number, y: number, color: number, app: PIXI.Application) => {
      const particleCount = 8;
      const particles: PIXI.Graphics[] = [];

      for (let i = 0; i < particleCount; i++) {
        const particle = new PIXI.Graphics();

        // Vary particle shapes and sizes
        const particleType = Math.random();
        const size = 2 + Math.random() * 4;

        if (particleType < 0.3) {
          // Circle particles
          particle.beginFill(color, 0.9);
          particle.drawCircle(0, 0, size);
          particle.endFill();
        } else if (particleType < 0.6) {
          // Star particles
          particle.beginFill(color, 0.8);
          particle.lineStyle(1, 0xFFFFFF, 0.8);
          const points = 5;
          const outerRadius = size;
          const innerRadius = size * 0.5;

          for (let j = 0; j < points * 2; j++) {
            const angle = (j * Math.PI) / points;
            const radius = j % 2 === 0 ? outerRadius : innerRadius;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;

            if (j === 0) particle.moveTo(px, py);
            else particle.lineTo(px, py);
          }
          particle.endFill();
        } else {
          // Diamond particles
          particle.beginFill(color, 0.7);
          particle.drawPolygon([0, -size, size, 0, 0, size, -size, 0]);
          particle.endFill();
        }

        particle.x = x;
        particle.y = y;

        // Enhanced physics with gravity and rotation
        const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const velocity = 60 + Math.random() * 40;
        const targetX = x + Math.cos(angle) * velocity;
        const targetY = y + Math.sin(angle) * velocity - 20; // Initial upward bias
        const gravity = 30 + Math.random() * 20;

        app.stage.addChild(particle);
        particles.push(particle);


        // Animate with smooth physics simulation
        gsap.to(particle, {
          x: targetX,
          y: targetY + gravity, // Add gravity effect
          rotation: Math.random() * Math.PI * 3, // Smooth rotation
          alpha: 0,
          duration: 1.2 + Math.random() * 0.3,
          ease: 'power2.out',
          onComplete: () => {
            if (particle.parent) {
              particle.parent.removeChild(particle);
            }
            particle.destroy();
          }
        });

       // Add smooth scale animation
        gsap.to(particle.scale, {
          x: 0.3,
          y: 0.3,
          duration: 1.2 + Math.random() * 0.3,
          ease: 'power2.out'
        });
      }
    },

    // Enhanced animated winning lines with improved visual effects
    showWinLines: (
      winDetailsArray: WinDetail[],
      app: PIXI.Application,
      config: GameConfig,
      symbolWidthRef: React.MutableRefObject<number>,
      symbolHeightRef: React.MutableRefObject<number>,
      winLinesRef: React.MutableRefObject<PIXI.Graphics[]>,
      // calculateLineLength: (points: any[]) => number,
      redrawLineWithProgress: (line: PIXI.Graphics, points: any[], progress: number, color: number, thickness?: number, alpha?: number) => void,
      createEnhancedFlowingParticles: (points: any[], color: number, container: PIXI.Container) => void,
      createElectricSpark: (x: number, y: number, color: number) => void
    ) => {
      // Clear existing lines
      if (winLinesRef.current) {
        winLinesRef.current.forEach(line => {
          if (line && !line.destroyed) {
            if (line.parent) {
              line.parent.removeChild(line);
            }
            line.destroy();
          }
        });
        winLinesRef.current = [];
      }

      const lines: PIXI.Container[] = [];
      const gridOffsetX = (app.screen.width - (config.reels || 5) * symbolWidthRef.current) / 2;
      const gridOffsetY = (app.screen.height - (config.rows || 3) * symbolHeightRef.current) / 2;

      winDetailsArray.forEach((winDetail, winIndex) => {
        const lineContainer = new PIXI.Container();
        const positions = winDetail.positions;

        if (positions.length < 2) return; // Need at least 2 positions to draw a line

        // Calculate center points of each symbol
        const points = positions.map((pos) => ({
          x: gridOffsetX + (pos.reel * symbolWidthRef.current) + (symbolWidthRef.current / 2),
          y: gridOffsetY + (pos.row * symbolHeightRef.current) + (symbolHeightRef.current / 2)
        }));

                // Create lines with initial transparent state
        const glowLine = new PIXI.Graphics();
        glowLine.alpha = 0;
        
        const mainLine = new PIXI.Graphics();
        mainLine.alpha = 0;
        
        const highlightLine = new PIXI.Graphics();
        highlightLine.alpha = 0;
        
        const pulsingLine = new PIXI.Graphics();
        pulsingLine.alpha = 0;

        // Add lines to container in order
        lineContainer.addChild(glowLine);
        lineContainer.addChild(mainLine);
        lineContainer.addChild(highlightLine);
        lineContainer.addChild(pulsingLine);

        // Add subtle glow effect with available filters
        try {
          const blurFilter = new PIXI.filters.BlurFilter(2);
          lineContainer.filters = [blurFilter];
        } catch (error) {
          console.warn('Could not apply blur filter:', error);
        }

        // Set completely invisible initial state
        lineContainer.alpha = 0;
        lineContainer.scale.set(0.5);
        lineContainer.visible = true;

        app.stage.addChild(lineContainer);
        lines.push(lineContainer);

        // Ultra-smooth fade-in animation with no sudden appearance
        gsap.delayedCall(winIndex * 0.15, () => {
          // Smooth fade-in from completely transparent
          gsap.to(lineContainer, {
            alpha: 1,
            duration: 0.6,
            ease: 'power2.out'
          });

          gsap.to(lineContainer.scale, {
            x: 1,
            y: 1,
            duration: 0.6,
            ease: 'power2.out'
          });

          // Fade in individual line components smoothly
          gsap.to([glowLine, mainLine, highlightLine, pulsingLine], {
            alpha: 1,
            duration: 0.4,
            delay: 0.2,
            ease: 'power2.out'
          });

          // Animate line drawing effect with improved timing
          // const totalLength = calculateLineLength(points);

          gsap.to({ progress: 0 }, {
            progress: 1,
            duration: 1.0,
            delay: 0.3,
            ease: 'power1.out',
            onUpdate: function() {
              const progress = this.targets()[0].progress;
              redrawLineWithProgress(glowLine, points, progress, winDetail.color, 10, 0.3);
              redrawLineWithProgress(mainLine, points, progress, winDetail.color, 6, 0.9);
              redrawLineWithProgress(highlightLine, points, progress, 0xFFFFFF, 2, 0.8);

              // Add smooth pulsing width effect
              const pulseWidth = 4 + Math.sin(progress * Math.PI * 2) * 1.5;
              redrawLineWithProgress(pulsingLine, points, progress, winDetail.color, pulseWidth, 0.4);
            },
            onComplete: () => {
              // Smooth pulsing animation with refined effects
              const tl = gsap.timeline({ repeat: -1 });
              tl.to(lineContainer, {
                alpha: 0.7,
                duration: 0.6,
                ease: 'sine.inOut'
              })
              .to(lineContainer.scale, {
                x: 1.02,
                y: 1.02,
                duration: 0.6,
                ease: 'sine.inOut'
              }, 0)
              .to(lineContainer, {
                alpha: 1,
                duration: 0.6,
                ease: 'sine.inOut'
              })
              .to(lineContainer.scale, {
                x: 1,
                y: 1,
                duration: 0.6,
                ease: 'sine.inOut'
              }, '-=0.6');

              // Add enhanced flowing particle effect along the line
              createEnhancedFlowingParticles(points, winDetail.color, lineContainer);

              // Add electric spark effects at connection points
              points.forEach((point, index) => {
                if (index > 0) {
                  gsap.delayedCall(index * 0.2, () => {
                    createElectricSpark(point.x, point.y, winDetail.color);
                  });
                }
              });
            }
          });
        });
      });

      winLinesRef.current = lines as PIXI.Graphics[];
    },

    
    // Create flowing particles along the line path
    createFlowingParticles: (points: Array<{x: number, y: number}>, color: number, container: PIXI.Container) => {
      const particleCount = 3;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = new PIXI.Graphics();
        particle.beginFill(color, 0.8);
        particle.drawCircle(0, 0, 4);
        particle.endFill();
        
        // Add white core
        particle.beginFill(0xFFFFFF, 0.6);
        particle.drawCircle(0, 0, 2);
        particle.endFill();
        
        particle.x = points[0].x;
        particle.y = points[0].y;
        
        container.addChild(particle);
        
        // Animate particle along the path with optimized delay
        const delay = i * 0.3;
        
        gsap.delayedCall(delay, () => {
          const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });
          
          for (let j = 1; j < points.length; j++) {
            tl.to(particle, {
              x: points[j].x,
              y: points[j].y,
              duration: 0.5,
              ease: 'power2.inOut'
            });
          }
          
          // Return to start smoothly
          tl.to(particle, {
            x: points[0].x,
            y: points[0].y,
            duration: 0.05,
            ease: 'power2.inOut'
          });
        });
      }
    },

    // Enhanced flowing particles with trail effects
    createEnhancedFlowingParticles: (points: Array<{x: number, y: number}>, color: number, container: PIXI.Container) => {
      const particleCount = 5;

      for (let i = 0; i < particleCount; i++) {
        const particleContainer = new PIXI.Container();

        // Main particle
        const particle = new PIXI.Graphics();
        particle.beginFill(color, 0.9);
        particle.drawCircle(0, 0, 5);
        particle.endFill();

        // Trail particles
        const trailParticles: PIXI.Graphics[] = [];
        for (let t = 0; t < 3; t++) {
          const trail = new PIXI.Graphics();
          trail.beginFill(color, 0.6 - t * 0.2);
          trail.drawCircle(0, 0, 3 - t);
          trail.endFill();
          trailParticles.push(trail);
          particleContainer.addChild(trail);
        }

        particleContainer.addChild(particle);

        // Start at first point
        particleContainer.x = points[0].x;
        particleContainer.y = points[0].y;

        container.addChild(particleContainer);

       // Create smooth path animation
        const tl = gsap.timeline({ repeat: -1, delay: i * 0.3 });

        // Animate along each segment with smooth trail effect
        for (let j = 1; j < points.length; j++) {
          tl.to(particleContainer, {
            x: points[j].x,
            y: points[j].y,
            duration: 0.4,
            ease: 'power2.inOut',
            onUpdate: function() {
              // Update trail positions with smooth lag
              trailParticles.forEach((trail, index) => {
                const lagFactor = (index + 1) * 0.2;
                trail.x = -lagFactor * 8;
                trail.y = 0;
              });
            }
          });
        }

        // Smooth fade out and restart
        tl.to(particleContainer, {
          alpha: 0,
          scale: 0.7,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            particleContainer.x = points[0].x;
            particleContainer.y = points[0].y;
            particleContainer.alpha = 1;
            particleContainer.scale.set(1);
          }
        });
      }
    },

    // Create electric spark effects at connection points
    createElectricSpark: (x: number, y: number, color: number, app: PIXI.Application) => {
      const sparkCount = 6;

      for (let i = 0; i < sparkCount; i++) {
        const spark = new PIXI.Graphics();
        spark.lineStyle(2, color, 0.9);

        // Create jagged spark line
        const angle = (i / sparkCount) * Math.PI * 2;
        const length = 15 + Math.random() * 10;

        spark.moveTo(0, 0);
        let currentX = 0;
        let currentY = 0;

        for (let j = 0; j < 3; j++) {
          const segmentLength = length / 3;
          const jitterX = (Math.random() - 0.5) * 8;
          const jitterY = (Math.random() - 0.5) * 8;

          currentX += Math.cos(angle) * segmentLength + jitterX;
          currentY += Math.sin(angle) * segmentLength + jitterY;

          spark.lineTo(currentX, currentY);
        }

        spark.x = x;
        spark.y = y;
        spark.alpha = 0;

        app.stage.addChild(spark);

        // Animate spark
        gsap.to(spark, {
          alpha: 1,
          duration: 0.1,
          ease: 'power2.out',
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            if (spark.parent) {
              spark.parent.removeChild(spark);
            }
            spark.destroy();
          }
        });
      }
    },

    // Create screen flash effect for big wins
    createScreenFlashEffect: (winAmount: number, app: PIXI.Application) => {
      const flashOverlay = new PIXI.Graphics();
      flashOverlay.beginFill(0xFFFFFF, 0);
      flashOverlay.drawRect(0, 0, app.screen.width, app.screen.height);
      flashOverlay.endFill();

      app.stage.addChild(flashOverlay);

      // Determine flash intensity based on win amount
      const maxAlpha = Math.min(0.6, winAmount / 500); // Cap at 0.6 alpha
      const flashCount = winAmount >= 500 ? 3 : winAmount >= 200 ? 2 : 1;

      // Create flash sequence
      const tl = gsap.timeline({
        onComplete: () => {
          if (flashOverlay.parent) {
            flashOverlay.parent.removeChild(flashOverlay);
          }
          flashOverlay.destroy();
        }
      });

      for (let i = 0; i < flashCount; i++) {
        tl.to(flashOverlay, {
          alpha: maxAlpha,
          duration: 0.1,
          ease: 'power2.out'
        })
        .to(flashOverlay, {
          alpha: 0,
          duration: 0.2,
          ease: 'power2.in'
        });
      }
    },

    // Calculate total length of line path
    calculateLineLength: (points: Array<{x: number, y: number}>) => {
      let totalLength = 0;
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i-1].x;
        const dy = points[i].y - points[i-1].y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }
      return totalLength;
    },

   // Enhanced line drawing with progress for smoother animation without flicker
    redrawLineWithProgress: (line: PIXI.Graphics, points: Array<{x: number, y: number}>, progress: number, color: number, thickness: number = 6, alpha: number = 0.9) => {
      // Only clear and redraw if progress has actually changed
      if (progress <= 0) {
        line.clear();
        return;
      }
      
      line.clear();
      line.lineStyle(thickness, color, alpha);
      
      const totalSegments = points.length - 1;
      const targetSegment = Math.floor(progress * totalSegments);
      const segmentProgress = (progress * totalSegments) - targetSegment;
      
      if (points.length < 2) return;
      
      line.moveTo(points[0].x, points[0].y);
      
      // Draw complete segments with straight lines for stability
      for (let i = 1; i <= targetSegment && i < points.length; i++) {
        line.lineTo(points[i].x, points[i].y);
      }
      
      // Draw partial segment with smooth interpolation
      if (targetSegment + 1 < points.length && segmentProgress > 0) {
        const startPoint = points[targetSegment];
        const endPoint = points[targetSegment + 1];
        
        // Linear interpolation for stability
        const partialX = startPoint.x + (endPoint.x - startPoint.x) * segmentProgress;
        const partialY = startPoint.y + (endPoint.y - startPoint.y) * segmentProgress;
        
        line.lineTo(partialX, partialY);
      }
    }
  };
};`