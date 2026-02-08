import { useCallback, useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { BlurFilter } from "pixi.js";
import { gsap } from "gsap";
import { useGameStore } from "../../store";
import { useSidebarStore } from "../../stores/sidebarStore";
import { getBetlinePatterns } from "../../utils/betlinePatterns";
import SymbolPreloader from "../../utils/symbolPreloader";
import { NormalDesign } from "../visual-journey/slot-animation/uiDesigns/NormalDesign";
import { ModernUI } from "../visual-journey/slot-animation/uiDesigns/ModernDesign";
import { UltimateDesign } from "../visual-journey/slot-animation/uiDesigns/UltimateDesign";
import { SimpleDesign } from "../visual-journey/slot-animation/uiDesigns/simple";
import { NumberImageRenderer } from "../shared/NumberImageRenderer";
import { detectDeviceType } from "../../utils/deviceDetection";
import { Monitor, Smartphone, Plus } from "lucide-react";

// Audio volume state type
type AudioVolumes = {
  background: number;
  reels: number;
  ui: number;
  wins: number;
  bonus: number;
  features: number;
  ambience: number;
};

// Add CSS animation for win display fade in/out
if (typeof document !== 'undefined' && !document.getElementById('win-display-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'win-display-styles';
  styleSheet.textContent = `
    @keyframes fadeInOut {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
      }
      10% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      85% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
      }
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
    .animate-scaleIn {
      animation: scaleIn 0.3s ease-out;
    }
    
    @keyframes fadeTransition {
      0% { transform: translate(-50%, -50%); opacity: 0; }
      20% { transform: translate(-50%, -50%); opacity: 1; }
      80% { transform: translate(-50%, -50%); opacity: 1; }
      100% { transform: translate(-50%, -50%); opacity: 0; }
    }
    
    @keyframes slideInRight {
      0% { transform: translate(-50%, -50%) translateX(100vw); opacity: 0; }
      20% { transform: translate(-50%, -50%) translateX(0); opacity: 1; }
      80% { transform: translate(-50%, -50%) translateX(0); opacity: 1; }
      100% { transform: translate(-50%, -50%) translateX(-100vw); opacity: 0; }
    }
    
    @keyframes slideOutLeft {
      0% { transform: translate(-50%, -50%) translateX(0); opacity: 1; }
      20% { transform: translate(-50%, -50%) translateX(-100%); opacity: 0; }
      100% { transform: translate(-50%, -50%) translateX(-100%); opacity: 0; }
    }
    
    @keyframes zoomIn {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
      20% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
    }
    
    @keyframes dissolveTransition {
      0% { transform: translate(-50%, -50%); opacity: 0; filter: blur(20px); }
      20% { transform: translate(-50%, -50%); opacity: 1; filter: blur(0px); }
      80% { transform: translate(-50%, -50%); opacity: 1; filter: blur(0px); }
      100% { transform: translate(-50%, -50%); opacity: 0; filter: blur(20px); }
    }
    
    @keyframes winTitleScaleIn {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0);
      }
      30% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.2);
      }
      80% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    @keyframes winDisplayBounce {
      0% {
        transform: translateY(0) scale(1);
      }
      20% {
        transform: translateY(-6px) scale(1.04);
      }
      40% {
        transform: translateY(3px) scale(0.99);
      }
      60% {
        transform: translateY(-4px) scale(1.02);
      }
      100% {
        transform: translateY(0) scale(1);
      }
    }

    .animate-win-display-bounce {
      animation: winDisplayBounce 1.4s ease-in-out infinite;
    }
  `;
  document.head.appendChild(styleSheet);
}

/** Responsive Slot Machine Preview */
export default function SlotMachinePreview(): JSX.Element {
  const { config, balance, betAmount, isSpinning, winAmount, isAutoplayActive, isSoundEnabled, showMenu, showSettings, uiType,
    setBalance, setBetAmount, setIsSpinning, setWinAmount, setIsAutoplayActive, setIsSoundEnabled, setShowMenu, setShowSettings,
    audioFiles
  } = useGameStore();
  const { isSidebarCollapsed } = useSidebarStore();
  const symbolsRaw = config.theme?.generated?.symbols;
  const symbols: Record<string, string> = (typeof symbolsRaw === 'object' && !Array.isArray(symbolsRaw))
    ? symbolsRaw
    : {};
  const rows = config.reels?.layout?.rows ?? 3;
  const reels = config.reels?.layout?.reels ?? 5;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const uiControlsRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const reelContainersRef = useRef<PIXI.Container[]>([]);
  const reelMasksRef = useRef<PIXI.Graphics[]>([]);
  const texturesRef = useRef<Record<string, PIXI.Texture>>({});
  const finalGridRef = useRef<string[][] | null>(null);
  const rafRef = useRef<number | null>(null);
  const spinMetaRef = useRef<any>(null);
  const spinTimelinesRef = useRef<gsap.core.Timeline[]>([]);
  const backgroundSpriteRef = useRef<PIXI.Sprite | null>(null);
  const winLinesRef = useRef<Array<{ shadowLine: PIXI.Graphics, lineGraphics: PIXI.Graphics, mask?: PIXI.Graphics }>>([]);
  const symbolSizeRef = useRef<number>(0);
  const reelSymbolSequencesRef = useRef<string[][]>([]);
  const blurFiltersRef = useRef<Map<PIXI.Container, BlurFilter>>(new Map());
  const winHighlightsRef = useRef<PIXI.Graphics[]>([]);
  const winAnimationCompleteCallbackRef = useRef<(() => void) | null>(null);
  const freeSpinModeRef = useRef<boolean>(false);
  const freeSpinsRemainingRef = useRef<number>(0);
  const totalFreeSpinWinsRef = useRef<number>(0);
  const spinJustCompletedRef = useRef<boolean>(false);
  const quickStopRef = useRef<(() => void) | null>(null);
  const winAmountAnimationRef = useRef<gsap.core.Tween | null>(null);
  const particleOverlayRef = useRef<HTMLDivElement | null>(null);

  // Symbol animation refs for win-based animations
  const activeSymbolAnimationsRef = useRef<Map<string, {
    timeline: gsap.core.Timeline;
    sprite: PIXI.Sprite;
    container: PIXI.Container;
    originalTransform: {
      x: number;
      y: number;
      scaleX: number;
      scaleY: number;
      rotation: number;
      alpha: number;
      anchorX?: number;
      anchorY?: number;
    };
    filters?: PIXI.Filter[];
  }>>(new Map());

  const [audioVolumes, setAudioVolumes] = useState<AudioVolumes>({
    background: 0.5,
    reels: 0.6,
    ui: 0.7,
    wins: 0.8,
    bonus: 0.8,
    features: 0.7,
    ambience: 0.3
  });
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const loopingAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const playAudio = useCallback((category: keyof AudioVolumes, name: string, options?: { loop?: boolean; volume?: number; stopPrevious?: boolean }) => {
    if (!isSoundEnabled) {
      console.log(`[Audio] Sound disabled, skipping ${category}/${name}`);
      return null;
    }

    // Get latest audioFiles from store to ensure we have the most recent files
    const latestAudioFiles = useGameStore.getState().audioFiles;
    const audioFile = latestAudioFiles[category]?.[name];

    if (!audioFile?.url) {
      console.warn(`[Audio] Audio file not found: ${category}/${name}`, {
        category,
        name,
        availableFiles: Object.keys(latestAudioFiles[category] || {})
      });
      return null;
    }

    const audioKey = `${category}_${name}`;

    // Stop previous audio if requested
    if (options?.stopPrevious) {
      const previousAudio = audioElementsRef.current.get(audioKey);
      if (previousAudio) {
        previousAudio.pause();
        previousAudio.currentTime = 0;
      }
      const previousLoop = loopingAudioRef.current.get(audioKey);
      if (previousLoop) {
        previousLoop.pause();
        previousLoop.currentTime = 0;
        loopingAudioRef.current.delete(audioKey);
      }
    }

    // Create or reuse audio element, but reload if URL changed
    let audio = audioElementsRef.current.get(audioKey);
    if (!audio || audio.src !== audioFile.url) {
      // If audio exists but URL changed, clean up old one
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.load();
      }
      // Create new audio element with updated URL
      audio = new Audio(audioFile.url);
      audio.preload = 'auto';
      audioElementsRef.current.set(audioKey, audio);
      console.log(`[Audio] Loaded audio: ${audioKey} from ${audioFile.url}`);
    }

    // Set volume
    const categoryVolume = audioVolumes[category];
    const finalVolume = (options?.volume ?? categoryVolume) * (isSoundEnabled ? 1 : 0);
    audio.volume = Math.max(0, Math.min(1, finalVolume));

    // Set loop
    audio.loop = options?.loop ?? false;

    // Play audio
    audio.play().catch(error => {
      console.warn(`[Audio] Failed to play ${audioKey}:`, error);
    });

    // Handle looping audio
    if (options?.loop) {
      loopingAudioRef.current.set(audioKey, audio);
    }

    return audio;
  }, [isSoundEnabled, audioVolumes]);

  const stopAudio = useCallback((category: keyof AudioVolumes, name: string) => {
    const audioKey = `${category}_${name}`;
    const audio = audioElementsRef.current.get(audioKey);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    const loopAudio = loopingAudioRef.current.get(audioKey);
    if (loopAudio) {
      loopAudio.pause();
      loopAudio.currentTime = 0;
      loopingAudioRef.current.delete(audioKey);
    }
  }, []);

  const stopAllAudio = useCallback(() => {
    audioElementsRef.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    loopingAudioRef.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    loopingAudioRef.current.clear();
  }, []);

  const updateAudioVolumes = useCallback(() => {
    // Update volumes for all active audio elements
    audioElementsRef.current.forEach((audio, key) => {
      const [category] = key.split('_') as [keyof AudioVolumes];
      if (category && audioVolumes[category] !== undefined) {
        audio.volume = audioVolumes[category] * (isSoundEnabled ? 1 : 0);
      }
    });
    loopingAudioRef.current.forEach((audio, key) => {
      const [category] = key.split('_') as [keyof AudioVolumes];
      if (category && audioVolumes[category] !== undefined) {
        audio.volume = audioVolumes[category] * (isSoundEnabled ? 1 : 0);
      }
    });
  }, [audioVolumes, isSoundEnabled]);

  // Update audio volumes when they change
  useEffect(() => {
    updateAudioVolumes();
  }, [updateAudioVolumes]);

  // Stop all audio when sound is disabled
  useEffect(() => {
    if (!isSoundEnabled) {
      stopAllAudio();
    }
  }, [isSoundEnabled, stopAllAudio]);

  // Listen for volume update events
  useEffect(() => {
    const handleVolumeUpdate = (event: CustomEvent) => {
      const { category, volume } = event.detail;
      if (category && volume !== undefined && category in audioVolumes) {
        setAudioVolumes(prev => ({
          ...prev,
          [category]: Math.max(0, Math.min(1, volume))
        }));
      }
    };

    const handleVolumeUpdateAll = (event: CustomEvent) => {
      const { volumes } = event.detail;
      if (volumes && typeof volumes === 'object') {
        setAudioVolumes(prev => {
          const updated = { ...prev };
          Object.keys(volumes).forEach(category => {
            if (category in updated) {
              updated[category as keyof AudioVolumes] = Math.max(0, Math.min(1, volumes[category]));
            }
          });
          return updated;
        });
      }
    };

    window.addEventListener('updateAudioVolume', handleVolumeUpdate as EventListener);
    window.addEventListener('updateAllAudioVolumes', handleVolumeUpdateAll as EventListener);
    return () => {
      window.removeEventListener('updateAudioVolume', handleVolumeUpdate as EventListener);
      window.removeEventListener('updateAllAudioVolumes', handleVolumeUpdateAll as EventListener);
    };
  }, [audioVolumes]);

  // Expose volume getter via custom event
  useEffect(() => {
    const handleGetVolumes = (event: CustomEvent) => {
      const detail = event.detail;
      if (detail && typeof detail === 'object' && 'callback' in detail) {
        (detail.callback as (volumes: AudioVolumes) => void)(audioVolumes);
      }
    };

    window.addEventListener('getAudioVolumes', handleGetVolumes as EventListener);
    return () => {
      window.removeEventListener('getAudioVolumes', handleGetVolumes as EventListener);
    };
  }, [audioVolumes]);

  // Debug: Log available audio files
  useEffect(() => {
    const latestAudioFiles = useGameStore.getState().audioFiles;
    console.log('[Audio] Available audio files:', {
      background: Object.keys(latestAudioFiles.background || {}),
      reels: Object.keys(latestAudioFiles.reels || {}),
      ui: Object.keys(latestAudioFiles.ui || {}),
      wins: Object.keys(latestAudioFiles.wins || {}),
      bonus: Object.keys(latestAudioFiles.bonus || {}),
      features: Object.keys(latestAudioFiles.features || {}),
      ambience: Object.keys(latestAudioFiles.ambience || {})
    });
  }, [audioFiles]);

  // Update current device type on resize/orientation change
  useEffect(() => {
    const updateDeviceType = () => {
      setCurrentDevice(detectDeviceType());
    };

    window.addEventListener('resize', updateDeviceType);
    window.addEventListener('orientationchange', updateDeviceType);

    return () => {
      window.removeEventListener('resize', updateDeviceType);
      window.removeEventListener('orientationchange', updateDeviceType);
    };
  }, []);

  // Listen for audio file updates and reload audio elements
  useEffect(() => {
    const handleAudioFileUpdated = (event: CustomEvent) => {
      const { category, name, url } = event.detail;
      if (!category || !name || !url) return;

      console.log(`[Audio] Audio file updated: ${category}/${name}`, url);

      const audioKey = `${category}_${name}`;
      const existingAudio = audioElementsRef.current.get(audioKey);

      if (existingAudio) {
        // If audio is currently playing, reload it
        const wasPlaying = !existingAudio.paused;
        const wasLooping = existingAudio.loop;
        const volume = existingAudio.volume;

        // Create new audio element with updated URL
        const newAudio = new Audio(url);
        newAudio.preload = 'auto';
        newAudio.volume = volume;
        newAudio.loop = wasLooping;

        // If it was playing, start playing the new one
        if (wasPlaying) {
          newAudio.play().catch(error => {
            console.warn(`[Audio] Failed to play updated audio ${audioKey}:`, error);
          });
        }

        // Replace old audio element
        existingAudio.pause();
        existingAudio.src = '';
        audioElementsRef.current.set(audioKey, newAudio);

        // Update looping reference if needed
        if (wasLooping) {
          loopingAudioRef.current.set(audioKey, newAudio);
        }
      }
    };

    window.addEventListener('audioFileUpdated', handleAudioFileUpdated as EventListener);
    return () => {
      window.removeEventListener('audioFileUpdated', handleAudioFileUpdated as EventListener);
    };
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      // Clean up all audio elements
      audioElementsRef.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioElementsRef.current.clear();
      loopingAudioRef.current.clear();
    };
  }, [stopAllAudio]);

  const [currentGrid, setCurrentGrid] = useState<string[][]>(() => createRandomGrid());
  const [renderSize, setRenderSize] = useState({ width: 800, height: 400 });
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundAdjustments, setBackgroundAdjustments] = useState({
    position: { x: 0, y: 0 },
    scale: 100,
    fit: 'cover' as 'cover' | 'contain' | 'fill' | 'scale-down'
  });
  const [showWinDisplay, setShowWinDisplay] = useState(false);
  const [animatedWinAmount, setAnimatedWinAmount] = useState(0);
  const [currentWinTier, setCurrentWinTier] = useState<'small' | 'big' | 'mega' | 'super'>('small');
  const [showWinTitle, setShowWinTitle] = useState(false);
  const [isInFreeSpinMode, setIsInFreeSpinMode] = useState(false);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(0);
  const [showFreeSpinAnnouncement, setShowFreeSpinAnnouncement] = useState(false);
  const [freeSpinAwardedCount, setFreeSpinAwardedCount] = useState(0);
  const [announcementTransitionStyle, setAnnouncementTransitionStyle] = useState<'fade' | 'slide' | 'zoom' | 'dissolve'>('fade');
  const [announcementTransitionDuration, setAnnouncementTransitionDuration] = useState<number>(3);
  const [showFreeSpinSummary, setShowFreeSpinSummary] = useState(false);
  const [totalFreeSpinWins, setTotalFreeSpinWins] = useState(0);
  // Wheel Bonus state
  const [showWheelBonus, setShowWheelBonus] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<{ value: number; type: 'prize' | 'levelup' | 'respin' } | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  // Pick & Click Bonus state
  const [showPickAndClick, setShowPickAndClick] = useState(false);
  const [pickAndClickGrid, setPickAndClickGrid] = useState<Array<Array<{ type: 'prize' | 'extraPick' | 'multiplier'; value: number } | null>>>([]);
  const [pickAndClickRevealed, setPickAndClickRevealed] = useState<Array<Array<boolean>>>([]);
  const [pickAndClickPicksRemaining, setPickAndClickPicksRemaining] = useState(0);
  const [pickAndClickTotalWin, setPickAndClickTotalWin] = useState(0);
  const [pickAndClickCurrentMultiplier, setPickAndClickCurrentMultiplier] = useState(1);
  const [showPickAndClickAnnouncement, setShowPickAndClickAnnouncement] = useState(false);
  // Wheel Bonus announcement state
  const [showWheelAnnouncement, setShowWheelAnnouncement] = useState(false);
  // UI Button adjustments state - only updated via events, no config sync
  const [uiButtonAdjustments, setUiButtonAdjustments] = useState({
    position: { x: 0, y: 0 },
    scale: 100,
    buttonScales: {
      spinButton: 100,
      autoplayButton: 100,
      menuButton: 100,
      soundButton: 100,
      settingsButton: 100
    },
    buttonPositions: {
      spinButton: { x: 0, y: 0 },
      autoplayButton: { x: 0, y: 0 },
      menuButton: { x: 0, y: 0 },
      soundButton: { x: 0, y: 0 },
      settingsButton: { x: 0, y: 0 }
    },
    visibility: true
  });
  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>((config as any).logo || null);
  const [logoPositions, setLogoPositions] = useState(() => {
    // Use percentage-based positioning: 50% = center, 0% = left, 100% = right
    // If config has old pixel values (negative or > 100), convert them to percentages
    const convertToPercentage = (pos: { x: number; y: number } | undefined, defaultPos: { x: number; y: number }) => {
      if (!pos) return defaultPos;
      // If values are in pixel range (negative or > 100), they're old pixel values - convert to center
      if (pos.x < 0 || pos.x > 100 || pos.y < 0 || pos.y > 100) {
        return defaultPos; // Return default percentage position
      }
      return pos;
    };

    const defaultDesktop = { x: 50, y: 10 };
    const defaultMobilePortrait = { x: 50, y: 10 };
    const defaultMobileLandscape = { x: 50, y: 10 };

    return {
      desktop: convertToPercentage((config as any).logoPositions?.desktop, defaultDesktop),
      mobilePortrait: convertToPercentage((config as any).logoPositions?.mobilePortrait, defaultMobilePortrait),
      mobileLandscape: convertToPercentage((config as any).logoPositions?.mobileLandscape, defaultMobileLandscape)
    };
  });
  const [logoScales, setLogoScales] = useState({
    desktop: (config as any).logoScales?.desktop || 100,
    mobilePortrait: (config as any).logoScales?.mobilePortrait || 100,
    mobileLandscape: (config as any).logoScales?.mobileLandscape || 100
  });
  // Win display config state
  const [winDisplayConfig, setWinDisplayConfig] = useState({
    positions: (config as any).winDisplayPositions || {
      desktop: { x: 50, y: 20 },
      mobilePortrait: { x: 50, y: 20 },
      mobileLandscape: { x: 50, y: 20 }
    },
    scales: (config as any).winDisplayScales || {
      desktop: 80,
      mobilePortrait: 80,
      mobileLandscape: 80
    }
  });
  // Grid adjustments state (from advanced tab)
  const [gridAdjustments, setGridAdjustments] = useState({
    position: (config as any).gridPosition || { x: 0, y: 0 },
    scale: (config as any).gridScale || 120,
    stretch: (config as any).gridStretch || { x: 100, y: 100 },
    showSymbolGrid: (config as any).showSymbolBackgrounds !== true
  });
  const symbolGridBackgroundsRef = useRef<PIXI.Graphics[]>([]);
  // Frame state (from Step4_GameAssets)
  const [frameConfig, setFrameConfig] = useState({
    framePath: (config as any).frame || null,
    frameStyle: (config as any).frameStyle || 'reel',
    framePosition: (config as any).framePosition || { x: 0, y: 0 },
    frameScale: (config as any).frameScale || 100,
    frameStretch: (config as any).frameStretch || { x: 100, y: 100 },
    reelGap: (config as any).reelGap || 10,
    reelDividerPosition: (config as any).reelDividerPosition || { x: 0, y: 0 },
    reelDividerStretch: (config as any).reelDividerStretch || { x: 100, y: 100 },
    aiReelImage: (config as any).aiReelImage || null
  });
  // References for frame sprites
  const outerFrameSpriteRef = useRef<PIXI.Sprite | null>(null);
  const reelDividerSpritesRef = useRef<PIXI.Sprite[]>([]);
  // Animation settings state (from Step7_AnimationStudio)
  const [animationSettings, setAnimationSettings] = useState({
    speed: 2.0,
    blurIntensity: 8,
    easing: 'back.out' as string,
    visualEffects: {
      spinBlur: true,
      glowEffects: false,
      screenShake: false
    }
  });
  const animationSettingsRef = useRef(animationSettings);
  const [maskControls, setMaskControls] = useState({
    enabled: true,
    debugVisible: false,
    perReelEnabled: Array(reels).fill(true) as boolean[]
  });
  // Screen shake effect refs
  const screenShakeRef = useRef({ x: 0, y: 0 });
  const glowEffectsRef = useRef<Map<PIXI.Container, PIXI.Graphics>>(new Map());

  // View mode state for device dimension switching
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'mobile-landscape'>('desktop');

  // Detect current device type
  const getCurrentDevice = (): 'desktop' | 'mobilePortrait' | 'mobileLandscape' => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    if (isMobile) {
      return height > width ? 'mobilePortrait' : 'mobileLandscape';
    }
    return 'desktop';
  };
  const [currentDevice, setCurrentDevice] = useState<'desktop' | 'mobilePortrait' | 'mobileLandscape'>(getCurrentDevice());

  // Sync refs with state (for immediate access in callbacks)
  useEffect(() => {
    freeSpinModeRef.current = isInFreeSpinMode;
  }, [isInFreeSpinMode]);
  useEffect(() => {
    freeSpinsRemainingRef.current = freeSpinsRemaining;
  }, [freeSpinsRemaining]);
  useEffect(() => {
    animationSettingsRef.current = animationSettings;
  }, [animationSettings]);

  // Get custom buttons from config
  const getCustomButtons = useCallback(() => {
    const extractedButtons = (config as any)?.extractedUIButtons || (config as any)?.uiElements;
    if (!extractedButtons) return undefined;

    return {
      spinButton: extractedButtons.spinButton || extractedButtons.SPIN,
      autoplayButton: extractedButtons.autoplayButton || extractedButtons.AUTO,
      menuButton: extractedButtons.menuButton || extractedButtons.MENU,
      soundButton: extractedButtons.soundButton || extractedButtons.SOUND,
      settingsButton: extractedButtons.settingsButton || extractedButtons.SETTINGS,
      quickButton: extractedButtons.quickButton || extractedButtons.QUICK
    };
  }, [config]);

  const customButtons = getCustomButtons();

  // Handler functions for NormalDesign component
  const handleDecreaseBet = useCallback(() => {
    playAudio('ui', 'ui_click');
    setBetAmount(Math.max(1.00, betAmount - 1.00));
  }, [betAmount, setBetAmount, playAudio]);

  const handleIncreaseBet = useCallback(() => {
    playAudio('ui', 'ui_click');
    setBetAmount(betAmount + 1.00);
  }, [betAmount, setBetAmount, playAudio]);

  const toggleAutoplay = useCallback(() => {
    playAudio('ui', 'ui_click');
    setIsAutoplayActive(!isAutoplayActive);
  }, [isAutoplayActive, setIsAutoplayActive, playAudio]);

  const toggleSound = useCallback(() => {
    playAudio('ui', 'ui_click');
    setIsSoundEnabled(!isSoundEnabled);
  }, [isSoundEnabled, setIsSoundEnabled, playAudio]);

  const toggleMenu = useCallback(() => {
    playAudio('ui', 'ui_click');
    setShowMenu(!showMenu);
  }, [showMenu, setShowMenu, playAudio]);

  const toggleSettings = useCallback(() => {
    playAudio('ui', 'ui_click');
    setShowSettings(!showSettings);
  }, [showSettings, setShowSettings, playAudio]);

  const handleMaxBet = useCallback(() => {
    // Set bet to maximum (could be balance or a fixed max)
    const maxBet = Math.min(balance, 100);
    setBetAmount(maxBet);
  }, [balance, setBetAmount]);

  // Clear win lines function
  const clearWinLines = useCallback(() => {
    winLinesRef.current.forEach(({ shadowLine, lineGraphics, mask }) => {
      if (shadowLine && !shadowLine.destroyed) {
        gsap.killTweensOf(shadowLine);
        if (shadowLine.parent) {
          shadowLine.parent.removeChild(shadowLine);
        }
        shadowLine.destroy({ children: true });
      }
      if (lineGraphics && !lineGraphics.destroyed) {
        gsap.killTweensOf(lineGraphics);
        if (lineGraphics.parent) {
          lineGraphics.parent.removeChild(lineGraphics);
        }
        lineGraphics.destroy({ children: true });
      }
      if (mask && !mask.destroyed) {
        gsap.killTweensOf(mask);
        if (mask.parent) {
          mask.parent.removeChild(mask);
        }
        mask.destroy({ children: true });
      }
    });
    winLinesRef.current = [];

    // Clear win highlights
    winHighlightsRef.current.forEach(highlight => {
      if (highlight && !highlight.destroyed) {
        gsap.killTweensOf(highlight);
        if (highlight.parent) {
          highlight.parent.removeChild(highlight);
        }
        highlight.destroy({ children: true });
      }
    });
    winHighlightsRef.current = [];
  }, []);

  // Get sprite at specific reel and row position (based on final grid layout)
  const getSpriteAtPosition = useCallback((reel: number, row: number): { sprite: PIXI.Sprite; container: PIXI.Container } | null => {
    if (reel < 0 || reel >= reelContainersRef.current.length) return null;
    if (row < 0 || row >= rows) return null;

    const reelContainer = reelContainersRef.current[reel];
    if (!reelContainer || reelContainer.children.length === 0) return null;

    // We keep 2 buffer containers per reel for smooth scrolling (rows + 2 total):
    // index 0 is the top buffer, visible rows start at index 1.
    const hasBufferSprites = reelContainer.children.length >= rows + 2;
    const childIndex = hasBufferSprites ? row + 1 : row;

    if (childIndex < 0 || childIndex >= reelContainer.children.length) return null;

    const symbolContainer = reelContainer.children[childIndex] as PIXI.Container;
    if (!symbolContainer || symbolContainer.children.length === 0) return null;

    const sprite = symbolContainer.children[0] as PIXI.Sprite;
    if (!sprite || sprite.destroyed) return null;

    return { sprite, container: symbolContainer };
  }, [rows]);

  // Reset sprite to original transform
  const resetSpriteTransform = useCallback((sprite: PIXI.Sprite, _container: PIXI.Container, originalTransform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    alpha: number;
    anchorX?: number;
    anchorY?: number;
  }) => {
    // Restore anchor if it was changed
    if (originalTransform.anchorX !== undefined && originalTransform.anchorY !== undefined) {
      sprite.anchor.set(originalTransform.anchorX, originalTransform.anchorY);
    }

    sprite.x = originalTransform.x;
    sprite.y = originalTransform.y;
    sprite.scale.set(originalTransform.scaleX, originalTransform.scaleY);
    sprite.rotation = originalTransform.rotation;
    sprite.alpha = originalTransform.alpha;

    // Remove filters
    if (sprite.filters && sprite.filters.length > 0) {
      sprite.filters = [];
    }
  }, []);

  // Clean up all active symbol animations
  const cleanupSymbolAnimations = useCallback(() => {
    activeSymbolAnimationsRef.current.forEach((anim, key) => {
      if (anim.timeline) {
        anim.timeline.kill();
      }
      resetSpriteTransform(anim.sprite, anim.container, anim.originalTransform);
      activeSymbolAnimationsRef.current.delete(key);
    });
  }, [resetSpriteTransform]);

  // Apply symbol animation based on template
  const applySymbolAnimation = useCallback((
    sprite: PIXI.Sprite,
    container: PIXI.Container,
    animationTemplate: string,
    duration: number
  ) => {
    // Store original transform (including anchor for rotation animations)
    const originalTransform = {
      x: sprite.x,
      y: sprite.y,
      scaleX: sprite.scale.x,
      scaleY: sprite.scale.y,
      rotation: sprite.rotation,
      alpha: sprite.alpha,
      anchorX: sprite.anchor.x,
      anchorY: sprite.anchor.y
    };

    // Create unique key for this animation
    const animKey = `${container.parent?.parent?.name || 'reel'}_${container.name || Date.now()}_${animationTemplate}`;

    // Clean up any existing animation for this sprite
    const existingAnim = Array.from(activeSymbolAnimationsRef.current.entries()).find(
      ([_, anim]) => anim.sprite === sprite
    );
    if (existingAnim) {
      existingAnim[1].timeline.kill();
      resetSpriteTransform(existingAnim[1].sprite, existingAnim[1].container, existingAnim[1].originalTransform);
      activeSymbolAnimationsRef.current.delete(existingAnim[0]);
    }

    // Create timeline with limited duration (not infinite)
    const timeline = gsap.timeline({
      onComplete: () => {
        // Reset sprite when animation completes
        resetSpriteTransform(sprite, container, originalTransform);
        activeSymbolAnimationsRef.current.delete(animKey);
      }
    });
    let repeatCount = 0;
    let cycleDuration = 0.5; // Default cycle duration

    // Apply animation based on template
    switch (animationTemplate) {
      case 'bounce':
        cycleDuration = 0.8; // 0.4s up + 0.4s down
        repeatCount = Math.max(1, Math.floor(duration / cycleDuration));
        timeline.to(sprite, {
          y: originalTransform.y - 20,
          duration: 0.4,
          ease: "power2.out",
          yoyo: true,
          repeat: repeatCount
        });
        break;

      case 'pulse':
        cycleDuration = 1.2; // 0.6s scale up + 0.6s scale down
        repeatCount = Math.max(1, Math.floor(duration / cycleDuration));

        // Don't change anchor - just scale from current anchor point
        timeline.to(sprite.scale, {
          x: originalTransform.scaleX * 1.03,
          y: originalTransform.scaleY * 1.03,
          duration: 0.6,
          ease: "power2.inOut",
          yoyo: true,
          repeat: repeatCount
        });
        break;

      case 'glow':
        cycleDuration = 1.6; // 0.8s glow up + 0.8s glow down
        repeatCount = Math.max(1, Math.floor(duration / cycleDuration));

        // Use PIXI GlowFilter for glow effect
        try {
          // In PixiJS v8, filters are often available directly or via Imports. 
          // Assuming standard filters or fallback
          // For now, let's use a simple alpha/scale pulse as 'glow' to match the safe fallback
          // This avoids the complexity of importing extra filter packages during this migration

          timeline.to(sprite, {
            alpha: 0.8, // Pulse alpha
            duration: 0.8,
            ease: "power2.inOut",
            yoyo: true,
            repeat: repeatCount
          });
          timeline.to(sprite.scale, {
            x: originalTransform.scaleX * 1.15,
            y: originalTransform.scaleY * 1.15,
            duration: 0.8,
            ease: "power2.inOut",
            yoyo: true,
            repeat: repeatCount
          }, 0);

        } catch (error) {
          console.warn('[Symbol Animation] Glow error, using fallback:', error);
          // Fallback animation
          timeline.to(sprite, {
            alpha: 0.9,
            duration: 0.8,
            ease: "power2.inOut",
            yoyo: true,
            repeat: repeatCount
          });
        }
        break;

      case 'rotate':
        cycleDuration = 2.0; // Full rotation duration
        repeatCount = Math.max(1, Math.floor(duration / cycleDuration));
        const currentAnchorX = sprite.anchor.x;
        const currentAnchorY = sprite.anchor.y;

        // Get sprite dimensions (use current width/height, fallback to texture dimensions)
        const spriteWidth = sprite.width || sprite.texture?.width || symbolSizeRef.current || 100;
        const spriteHeight = sprite.height || sprite.texture?.height || symbolSizeRef.current || 100;

        const anchorOffsetX = (0.5 - currentAnchorX) * spriteWidth;
        const anchorOffsetY = (0.5 - currentAnchorY) * spriteHeight;

        // Set anchor to center BEFORE adjusting position
        sprite.anchor.set(0.5, 0.5);
        sprite.x = originalTransform.x + anchorOffsetX;
        sprite.y = originalTransform.y + anchorOffsetY;

        // Update originalTransform to reflect new position and anchor
        originalTransform.x = sprite.x;
        originalTransform.y = sprite.y;
        originalTransform.anchorX = 0.5;
        originalTransform.anchorY = 0.5;

        timeline.to(sprite, {
          rotation: sprite.rotation + (Math.PI * 2), // 360 degrees in radians
          duration: 2.0,
          ease: "none",
          repeat: repeatCount
        });
        break;

      case 'shake':
        cycleDuration = 0.2; // 0.1s left + 0.1s right
        repeatCount = Math.max(1, Math.floor(duration / cycleDuration));
        timeline.to(sprite, {
          x: originalTransform.x + 5,
          duration: 0.1,
          ease: "power2.inOut",
          yoyo: true,
          repeat: repeatCount
        });
        break;

      case 'sparkle':
        cycleDuration = 1.0; // 0.5s fade + 0.5s fade back
        repeatCount = Math.max(1, Math.floor(duration / cycleDuration));
        timeline.to(sprite, {
          alpha: 0.7,
          duration: 0.5,
          ease: "power2.inOut",
          yoyo: true,
          repeat: repeatCount
        });
        timeline.to(sprite.scale, {
          x: 1.1,
          y: 1.1,
          duration: 0.5,
          ease: "power2.inOut",
          yoyo: true,
          repeat: repeatCount
        }, 0);
        break;

      case 'swing':
        cycleDuration = 2.0; // 1s left + 1s right
        repeatCount = Math.max(1, Math.floor(duration / cycleDuration));
        timeline.to(sprite, {
          rotation: originalTransform.rotation + (15 * Math.PI / 180), // 15 degrees in radians
          duration: 1.0,
          ease: "power2.inOut",
          yoyo: true,
          repeat: repeatCount
        });
        break;

      case 'float':
        cycleDuration = 4.0; // 2s up + 2s down
        repeatCount = Math.max(1, Math.floor(duration / cycleDuration));
        timeline.to(sprite, {
          y: originalTransform.y - 10,
          duration: 2.0,
          ease: "sine.inOut",
          yoyo: true,
          repeat: repeatCount
        });
        break;

      default:
        // Default: gentle pulse
        cycleDuration = 1.2;
        repeatCount = Math.max(1, Math.floor(duration / cycleDuration));
        timeline.to(sprite.scale, {
          x: 1.1,
          y: 1.1,
          duration: 0.6,
          ease: "power2.inOut",
          yoyo: true,
          repeat: repeatCount
        });
        break;
    }

    // Store animation for cleanup
    activeSymbolAnimationsRef.current.set(animKey, {
      timeline,
      sprite,
      container,
      originalTransform,
      filters: (sprite.filters as PIXI.Filter[]) || undefined
    });
  }, [resetSpriteTransform]);



  // Apply winning symbol animations
  const applyWinningSymbolAnimations = useCallback((
    winDetails: Array<{
      line: number;
      symbols: string[];
      positions: { reel: number; row: number }[];
      count: number;
      symbol: string;
      amount: number;
    }>,
  ) => {
    // Respect betline sequencing so animations play 1-by-1 per winning payline
    const betlineConfig = (config as any).betlineConfig || {};
    const betlineSequential = betlineConfig.sequential !== undefined ? betlineConfig.sequential : true;
    const betlineSpeed = betlineConfig.speed || 1.0; // seconds per line (mirrors drawWinLines)
    const pauseBetweenLines = betlineConfig.pauseBetweenLines || 0.3;

    const fadeInDuration = betlineSpeed * 0.5;
    const displayDuration = betlineSpeed * 2.5;
    const fadeOutDuration = betlineSpeed * 0.5;
    const betlineTotalDuration = fadeInDuration + displayDuration + fadeOutDuration;

    const applyForWinDetail = (winDetail: typeof winDetails[number]) => {
      const symbolKey = winDetail.symbol; // e.g., 'high1', 'scatter', etc.
      const animationConfig = config.winAnimations?.symbolAnimations?.[symbolKey];

      winDetail.positions.forEach(({ reel, row }) => {
        const spriteData = getSpriteAtPosition(reel, row);
        if (!spriteData) return;

        if (animationConfig?.animationTemplate) {
          applySymbolAnimation(
            spriteData.sprite,
            spriteData.container,
            animationConfig.animationTemplate,
            betlineTotalDuration
          );
        }
      });
    };

    if (betlineSequential && winDetails.length > 1) {
      winDetails.forEach((winDetail, idx) => {
        const lineDelay = idx * (betlineSpeed + pauseBetweenLines);
        setTimeout(() => applyForWinDetail(winDetail), lineDelay * 1000);
      });
    } else {
      // All at once
      winDetails.forEach((winDetail) => applyForWinDetail(winDetail));
    }
  }, [config.winAnimations?.symbolAnimations, getSpriteAtPosition, applySymbolAnimation]);

  // Draw win lines over symbols
  const drawWinLines = useCallback((winDetails: Array<{
    line: number;
    symbols: string[];
    positions: { reel: number; row: number }[];
    count: number;
    symbol: string;
    amount: number;
  }>, onComplete?: () => void) => {
    if (!appRef.current || !winDetails || winDetails.length === 0) return;
    if (reelContainersRef.current.length === 0) return;

    // Clear existing win lines
    clearWinLines();

    // Read win animation type from config
    const winAnimationType = (config as any).winAnimationType || 'both';

    // Read current grid dimensions directly from config (not from closure)
    const currentReels = config.reels?.layout?.reels ?? 5;
    const currentRows = config.reels?.layout?.rows ?? 3;

    const gridContainer = reelContainersRef.current[0]?.parent;

    if (!gridContainer) return;

    // Get betline configuration from config
    const betlineConfig = (config as any).betlineConfig || {};
    const betlineWidth = betlineConfig.width || 3;
    const betlineSpeed = betlineConfig.speed || 1.0; // Animation speed (0.5-3.0 seconds per line)
    const betlineSequential = betlineConfig.sequential !== undefined ? betlineConfig.sequential : true;
    const pauseBetweenLines = betlineConfig.pauseBetweenLines || 0.3; // Pause between sequential lines
    const symbolHighlight = betlineConfig.symbolHighlight !== undefined ? betlineConfig.symbolHighlight : true;
    const symbolHighlightDuration = betlineConfig.symbolHighlightDuration || 1.5; // How long symbols stay highlighted

    const mainWidth = Math.max(betlineWidth * 3, 6);
    const shadowWidth = mainWidth + 10;

    // Use colors from config if available, otherwise use default
    const configColors = betlineConfig.colors || [];
    const defaultLineColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFA500, 0x800080];
    // Convert hex colors to numbers if provided
    const lineColors = configColors.length > 0
      ? configColors.map((color: string) => {
        // Convert hex string to number (e.g., '#FF6B6B' -> 0xFF6B6B)
        if (typeof color === 'string' && color.startsWith('#')) {
          return parseInt(color.replace('#', ''), 16);
        }
        return typeof color === 'number' ? color : 0xFF0000;
      })
      : defaultLineColors;

    // Get betline patterns for drawing lines
    let betlinePatterns = (config.reels as any)?.betlinePatterns;
    const betlines = (config.reels as any)?.betlines || 20;

    // Validate and regenerate patterns if they don't match current grid dimensions
    const patternsValid = betlinePatterns &&
      Array.isArray(betlinePatterns) &&
      betlinePatterns.length > 0 &&
      betlinePatterns.every((pattern: number[]) =>
        Array.isArray(pattern) && pattern.length === currentReels
      );

    if (!patternsValid) {
      const sharedPatterns = getBetlinePatterns(currentReels, currentRows);
      if (sharedPatterns && Array.isArray(sharedPatterns) && sharedPatterns.length > 0) {
        betlinePatterns = sharedPatterns.slice(0, betlines);
      }
    }

    // Calculate metrics inline - MUST match computeResponsiveMetrics to account for UI buttons
    const w = renderSize.width;
    const h = renderSize.height;

    // Get UI button container height to account for space taken at bottom
    let uiButtonHeight = 0;
    if (uiControlsRef.current) {
      const uiRect = uiControlsRef.current.getBoundingClientRect();
      uiButtonHeight = uiRect.height;
    } else {
      // Fallback estimate: UI buttons are typically 80-130px tall
      uiButtonHeight = 100;
    }

    // Calculate available height (excluding UI buttons at bottom)
    const availableHeight = h - uiButtonHeight;

    // Base calculations - use available height instead of full height
    const symbolWidth = Math.floor((w * 0.8) / currentReels);
    const symbolHeight = Math.floor((availableHeight * 0.8) / currentRows);
    let size = Math.min(symbolWidth, symbolHeight);

    // Apply grid scale (120 = 100% baseline, so divide by 120 and multiply by scale)
    const scaleFactor = gridAdjustments.scale / 120;
    size = size * scaleFactor;

    // Apply grid stretch
    const baseSpacingX = size * 1.05 * (gridAdjustments.stretch.x / 100);
    const spacingY = size * 1.05 * (gridAdjustments.stretch.y / 100);

    // Apply reel gap to spacingX (reelGap affects actual spacing between reels)
    const spacingX = baseSpacingX + (frameConfig.reelGap || 0);

    // Calculate base offset (centered in available space, not full height)
    const totalWidth = currentReels * spacingX;
    const totalHeight = currentRows * spacingY;
    let offsetX = (w - totalWidth) / 2;
    // Center vertically in the available space (above UI buttons)
    let offsetY = (availableHeight - totalHeight) / 2;

    // Apply grid position adjustments
    offsetX += gridAdjustments.position.x;
    offsetY += gridAdjustments.position.y;

    // Helper function to draw a single line with all configurations
    const drawSingleLine = (
      detail: typeof winDetails[0],
      idx: number,
      lineDelay: number = 0
    ) => {
      if (!detail.positions || detail.positions.length === 0) return;

      const color = lineColors[idx % lineColors.length];
      const linePattern = betlinePatterns?.[detail.line - 1];

      if (!linePattern) return;

      // Determine what to draw based on winAnimationType
      const shouldDrawLines = winAnimationType === 'lines' || winAnimationType === 'both' || winAnimationType === 'curvedLines';
      const shouldDrawSquares = winAnimationType === 'squares' || winAnimationType === 'both';

      // Collect points for the FULL betline pattern (all reels, not just winning symbols)
      // This makes the line span the entire row
      const points: Array<{ x: number, y: number }> = [];
      for (let reel = 0; reel < currentReels; reel++) {
        const row = linePattern[reel];

        // Validate row index
        if (row < 0 || row >= currentRows) {
          console.warn(`[Draw Win Lines] Invalid row ${row} for reel ${reel} in betline ${detail.line - 1}`);
          continue;
        }

        // Calculate center position of symbol using calculated metrics
        const centerX = offsetX + reel * spacingX + size / 2;
        const centerY = offsetY + row * spacingY + size / 2;
        points.push({ x: centerX, y: centerY });
      }

      // Need at least 2 points to draw a line
      if (points.length < 2) return;

      // Visual polish: Highlight winning symbols (glowing squares) - only if squares are enabled
      // Note: Squares still only highlight the actual winning symbols, not the full row
      if (shouldDrawSquares) {
        detail.positions.forEach((pos) => {
          // Validate position is within current grid bounds
          if (pos.reel < 0 || pos.reel >= currentReels || pos.row < 0 || pos.row >= currentRows) {
            console.warn(`[Draw Win Lines] Skipping invalid highlight position: reel ${pos.reel}, row ${pos.row} (grid: ${currentReels}x${currentRows})`);
            return;
          }

          const highlight = new PIXI.Graphics();
          highlight.beginFill(color, 0.2);
          highlight.roundRect(
            offsetX + pos.reel * spacingX - 3,
            offsetY + pos.row * spacingY - 3,
            size + 6,
            size + 6,
            6
          );
          highlight.endFill();

          if (appRef.current) {
            appRef.current.stage.addChild(highlight);
          }
          winHighlightsRef.current.push(highlight);

          // Pulse animation with configurable duration
          if (symbolHighlight) {
            gsap.to(highlight, {
              alpha: 0.4,
              duration: 0.5,
              yoyo: true,
              repeat: 2,
              ease: 'sine.inOut',
              onComplete: () => {
                // Auto-hide highlights after configured duration
                gsap.to(highlight, {
                  alpha: 0,
                  duration: 0.5,
                  delay: symbolHighlightDuration - 1.5, // Subtract the pulse animation time
                  onComplete: () => {
                    gsap.killTweensOf(highlight);
                    if (highlight.parent) {
                      highlight.parent.removeChild(highlight);
                    }
                    highlight.destroy({ children: true });

                    // Remove from ref array
                    winHighlightsRef.current = winHighlightsRef.current.filter(h => h !== highlight);

                    // Check if all animations are complete
                    if (winAnimationCompleteCallbackRef.current &&
                      winLinesRef.current.length === 0 &&
                      winHighlightsRef.current.length === 0) {
                      winAnimationCompleteCallbackRef.current();
                      winAnimationCompleteCallbackRef.current = null;
                    }
                  }
                });
              }
            });
          }
        });
      }

      // Draw lines - only if lines are enabled
      if (shouldDrawLines) {
        // 1. SETUP GRAPHICS OBJECTS
        // We use shadowLine for the "Glow" and lineGraphics for the "Core"
        const shadowLine = new PIXI.Graphics();
        const lineGraphics = new PIXI.Graphics();

        // Set blend mode to ADD to make it look like light/fire
        shadowLine.blendMode = 'add';
        lineGraphics.blendMode = 'add';

        // 2. DEFINE STYLING CONSTANTS (Gold/Energy Theme)
        const GOLD_OUTER = 0xFFA500; // Orange-ish Gold
        const GOLD_INNER = 0xFFFF00; // Bright Yellow
        const CORE_WHITE = 0xFFFFFF; // Pure White center

        // 3. HELPER: SMOOTH CURVE FUNCTION
        // Uses Catmull-Rom spline to create smooth curves that pass through ALL center points
        const drawSmoothCurve = (g: PIXI.Graphics, pts: { x: number, y: number }[]) => {
          if (pts.length < 2) return;

          g.moveTo(pts[0].x, pts[0].y);

          if (pts.length === 2) {
            g.lineTo(pts[1].x, pts[1].y);
            return;
          }

          // Catmull-Rom spline: smooth curve through all points
          for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[Math.max(0, i - 1)];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[Math.min(pts.length - 1, i + 2)];

            // Calculate control points for bezier curve
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
          }
        };

        // 4. DRAW THE LAYERS

        // LAYER A: Outer Glow (Wide, Soft, Orange/Gold)
        // We draw this multiple times with low alpha to simulate a gradient fade
        shadowLine.lineStyle(shadowWidth + 15, GOLD_OUTER, 0.3);
        drawSmoothCurve(shadowLine, points);

        // LAYER B: Inner Glow (Medium, Bright Yellow)
        // We append this to shadowLine to keep them grouped in your existing logic
        shadowLine.lineStyle(mainWidth + 5, GOLD_INNER, 0.5);
        drawSmoothCurve(shadowLine, points);

        // LAYER C: The Core (Thin, White/Bright, Sharp)
        lineGraphics.lineStyle(mainWidth, CORE_WHITE, 1.0);
        drawSmoothCurve(lineGraphics, points);

        // 5. APPLY FILTERS
        // Heavy blur for the glow, slight blur for the core to remove pixelation
        shadowLine.filters = [new PIXI.BlurFilter(8, 4)]; // High quality blur
        lineGraphics.filters = [new PIXI.BlurFilter(1)];  // Very slight blur for smoothness

        // 6. ADD TO STAGE
        if (appRef.current) {
          appRef.current.stage.addChild(shadowLine);
          appRef.current.stage.addChild(lineGraphics);
        }

        // 7. ANIMATION (The "Beam" Travel Effect)
        // Create progressive reveal mask
        const maskHeight = totalHeight + size * 2;
        const revealMask = new PIXI.Graphics();

        // Draw a gradient-like mask (using steps) or solid rect
        // For a beam, a simple rect moving fast works well
        revealMask.beginFill(0xFFFFFF);
        // Make the mask wider (2 reels) so the tail of the beam doesn't cut off too abruptly
        revealMask.drawRect(0, -size, spacingX * 2, maskHeight);
        revealMask.endFill();

        // Position mask initially
        // Start far left
        const startX = offsetX - (spacingX * 2);
        const endX = offsetX + (currentReels * spacingX) + spacingX;

        revealMask.x = startX;
        revealMask.y = offsetY - size;

        // Rotate mask slightly if the line goes diagonally (optional, but looks cool)
        // For now, keep it simple vertical

        // Apply mask
        shadowLine.mask = revealMask;
        lineGraphics.mask = revealMask;

        if (appRef.current) {
          appRef.current.stage.addChild(revealMask);
        }

        // Track for cleanup
        winLinesRef.current.push({ shadowLine, lineGraphics, mask: revealMask });

        // 8. ANIMATE
        // Slower animation for better visibility
        const animationDuration = (betlineSpeed || 0.8) * 2; // Double the duration to slow it down 

        gsap.fromTo(revealMask,
          {
            x: startX,
            width: spacingX // Start narrow
          },
          {
            x: endX,
            width: spacingX * 4, // Grow wider as it travels (trail effect)
            duration: animationDuration,
            delay: lineDelay + (betlineSequential ? 0 : idx * 0.1),
            ease: 'power1.inOut', // Linear/Power1 is better for beams than elastic
            onComplete: () => {
              // Fade out
              gsap.to([shadowLine, lineGraphics], {
                alpha: 0,
                duration: 0.3,
                onComplete: () => {
                  // ... [Your existing Cleanup Logic here] ...
                  gsap.killTweensOf([shadowLine, lineGraphics, revealMask]);
                  if (shadowLine.parent) shadowLine.parent.removeChild(shadowLine);
                  if (lineGraphics.parent) lineGraphics.parent.removeChild(lineGraphics);
                  if (revealMask.parent) revealMask.parent.removeChild(revealMask);
                  shadowLine.destroy({ children: true });
                  lineGraphics.destroy({ children: true });
                  revealMask.destroy({ children: true });

                  winLinesRef.current = winLinesRef.current.filter(
                    item => item.shadowLine !== shadowLine
                  );

                  // Check callback
                  if (winAnimationCompleteCallbackRef.current &&
                    winLinesRef.current.length === 0 &&
                    winHighlightsRef.current.length === 0) {
                    winAnimationCompleteCallbackRef.current();
                    winAnimationCompleteCallbackRef.current = null;
                  }
                }
              });
            }
          }
        );

        // Optional: Pulse the opacity slightly while moving
        gsap.to([shadowLine, lineGraphics], {
          alpha: 0.8,
          duration: 0.1,
          yoyo: true,
          repeat: 8
        });
      }
    };

    // Draw lines sequentially or all at once based on configuration
    if (betlineSequential && winDetails.length > 1) {
      // Sequential: draw lines one by one with delays
      let completedLines = 0;
      const totalLines = winDetails.length;

      winDetails.forEach((detail, idx) => {
        const lineDelay = idx * (betlineSpeed + pauseBetweenLines);

        setTimeout(() => {
          drawSingleLine(detail, idx, 0);

          // Track completion
          completedLines++;
          if (completedLines === totalLines) {
            // All lines drawn, check if we need to call onComplete
            if (onComplete) {
              // Wait for all animations to complete
              const totalAnimationTime = betlineSpeed * totalLines + pauseBetweenLines * (totalLines - 1);
              setTimeout(() => {
                if (winAnimationCompleteCallbackRef.current) {
                  winAnimationCompleteCallbackRef.current();
                  winAnimationCompleteCallbackRef.current = null;
                }
              }, totalAnimationTime * 1000 + 500); // Add buffer for animations
            }
          }
        }, lineDelay * 1000);
      });
    } else {
      // All at once: draw all lines simultaneously
      winDetails.forEach((detail, idx) => {
        drawSingleLine(detail, idx, 0);
      });

      // Store callback for completion tracking
    }

    // Store callback for completion tracking (for non-sequential or single line)
    if (onComplete) {
      winAnimationCompleteCallbackRef.current = onComplete;

      // If no wins, call immediately
      if (winDetails.length === 0) {
        onComplete();
        winAnimationCompleteCallbackRef.current = null;
      }
    }
  }, [appRef, config.reels?.layout?.reels, config.reels?.layout?.rows, (config.reels as any)?.betlinePatterns, config.reels?.betlines, renderSize, clearWinLines, (config as any).winAnimationType, (config as any).betlineConfig, gridAdjustments, frameConfig.reelGap, reels, rows]);

  function getBackgroundForMode() {
    const base = config.theme?.generated;
    if (!base) return null;

    // Check if in free spin mode first
    if (isInFreeSpinMode) {
      return config.derivedBackgrounds?.freespin || (base as any).freeSpinBackground || base.background;
    }

    const mode = config.state?.mode;
    if (mode === "free-spin") {
      return (base as any).freeSpinBackground || base.background;
    }

    return base.background;
  }


  function createRandomGrid(): string[][] {
    const allKeys = Object.keys(symbols);

    // During initialization, isInFreeSpinMode is not yet defined, so use all symbols
    // During gameplay, this function is called from contexts where isInFreeSpinMode is accessible
    // For initialization, we always want all symbols (including scatter) since we start in regular mode
    const keys = allKeys;

    return Array.from({ length: reels }, () =>
      Array.from({ length: rows }, () => keys[Math.floor(Math.random() * keys.length)])
    );
  }

  // Generate default paytable if not in config
  const generateDefaultPaytable = useCallback(() => {
    return {
      'wild': { 3: 50, 4: 200, 5: 1000 },
      'scatter': { 3: 10, 4: 50, 5: 200 },
      'high_1': { 3: 25, 4: 100, 5: 500 },
      'high_2': { 3: 20, 4: 80, 5: 400 },
      'high_3': { 3: 15, 4: 60, 5: 300 },
      'high_4': { 3: 10, 4: 40, 5: 200 },
      'medium_1': { 3: 8, 4: 30, 5: 150 },
      'medium_2': { 3: 6, 4: 25, 5: 125 },
      'medium_3': { 3: 5, 4: 20, 5: 100 },
      'medium_4': { 3: 4, 4: 15, 5: 75 },
      'low_1': { 3: 3, 4: 10, 5: 50 },
      'low_2': { 3: 2, 4: 8, 5: 40 },
      'low_3': { 3: 2, 4: 6, 5: 30 },
      'low_4': { 3: 1, 4: 5, 5: 25 }
    };
  }, []);

  // Map storage key to paytable key format (e.g., 'high1' → 'high_1')
  const mapStorageKeyToPaytableKey = useCallback((storageKey: string): string => {
    if (storageKey === 'wild' || storageKey === 'scatter' || storageKey === 'bonus' || storageKey === 'holdspin') {
      return storageKey;
    }
    // Convert 'high1' → 'high_1', 'medium2' → 'medium_2', etc.
    return storageKey.replace(/([a-z]+)(\d+)/, '$1_$2');
  }, []);

  // Check a single line for winning combinations
  const checkLineWin = useCallback((
    lineSymbols: string[],
    betPerLine: number,
    symbolPaytable: Record<string, Record<number, number>>
  ) => {
    if (!lineSymbols || lineSymbols.length < 3) {
      return { amount: 0, count: 0, symbol: null };
    }

    // Find the first non-wild, non-bonus symbol to establish the winning symbol type
    let winningSymbolKey = null;
    let matchCount = 0;

    for (let i = 0; i < lineSymbols.length; i++) {
      const currentSymbolKey = lineSymbols[i];

      // Skip bonus symbols - they don't contribute to line wins (scatter, bonus, holdspin)
      if (currentSymbolKey === 'scatter' || currentSymbolKey === 'bonus' || currentSymbolKey === 'holdspin') {
        break; // Stop at bonus symbol as it breaks the line
      }

      if (winningSymbolKey === null) {
        // First symbol - establish the type (skip wilds)
        if (currentSymbolKey === 'wild') {
          matchCount++;
          continue;
        } else {
          winningSymbolKey = currentSymbolKey;
          matchCount++;
        }
      } else {
        // Subsequent symbols - must match established type or be wild
        if (currentSymbolKey === winningSymbolKey || currentSymbolKey === 'wild') {
          matchCount++;
        } else {
          break; // Stop at first non-matching symbol
        }
      }
    }

    // Handle case where all symbols are wilds
    if (winningSymbolKey === null && matchCount >= 3) {
      winningSymbolKey = 'wild';
    }

    // Bonus symbols cannot be the winning symbol type for line wins
    if (winningSymbolKey === 'scatter' || winningSymbolKey === 'bonus' || winningSymbolKey === 'holdspin') {
      return { amount: 0, count: 0, symbol: null };
    }

    // Check for minimum 3 consecutive matches
    if (matchCount >= 3 && winningSymbolKey) {
      // Map storage key to paytable key format
      const paytableKey = mapStorageKeyToPaytableKey(winningSymbolKey);
      const paytable = symbolPaytable[paytableKey] || symbolPaytable['low_1'];

      if (!paytable) {
        return { amount: 0, count: 0, symbol: null };
      }

      const payout = paytable[matchCount] || 0;

      return {
        amount: payout * betPerLine,
        count: matchCount,
        symbol: winningSymbolKey
      };
    }

    return { amount: 0, count: 0, symbol: null };
  }, [mapStorageKeyToPaytableKey]);

  // Main win detection function - checks all betlines
  const checkWinLines = useCallback((symbols: string[][]) => {
    if (!symbols || symbols.length === 0) {
      return { totalWin: 0, winDetails: [] };
    }

    // Read current grid dimensions directly from config (not from closure)
    const currentReels = config.reels?.layout?.reels ?? 5;
    const currentRows = config.reels?.layout?.rows ?? 3;
    const betlines = (config.reels as any)?.betlines || 20;

    // Validate that symbols array matches current grid dimensions
    if (symbols.length !== currentReels) {
      console.warn(`[Win Detection] Grid mismatch: symbols array has ${symbols.length} reels, but config expects ${currentReels} reels`);
    }

    // Get betline patterns from config
    let betlinePatterns = (config.reels as any)?.betlinePatterns;

    // Validate and regenerate patterns if they don't match current grid dimensions
    const patternsValid = betlinePatterns &&
      Array.isArray(betlinePatterns) &&
      betlinePatterns.length > 0 &&
      betlinePatterns.every((pattern: number[]) =>
        Array.isArray(pattern) && pattern.length === currentReels
      );

    if (!patternsValid) {
      // Generate patterns for current grid dimensions
      const sharedPatterns = getBetlinePatterns(currentReels, currentRows);
      if (sharedPatterns && Array.isArray(sharedPatterns) && sharedPatterns.length > 0) {
        betlinePatterns = sharedPatterns.slice(0, betlines);
      } else {
        // Fallback: simple horizontal patterns
        betlinePatterns = [];
        for (let i = 0; i < Math.min(betlines, currentRows); i++) {
          betlinePatterns.push(new Array(currentReels).fill(i));
        }
      }
    } else {
      // Log pattern validation success
      console.log(`[Win Detection] Using ${betlinePatterns.length} betline patterns for ${currentReels}x${currentRows} grid`);
    }

    // Get paytable from config or use defaults
    const configPaytable = config.theme?.generated?.symbolPaytables;
    let symbolPaytable: Record<string, Record<number, number>>;

    if (configPaytable && typeof configPaytable === 'object') {
      // Convert config paytable format to our format
      symbolPaytable = {};
      Object.entries(configPaytable).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          symbolPaytable[key] = value as Record<number, number>;
        }
      });
    } else {
      symbolPaytable = generateDefaultPaytable();
    }

    // Use all available betlines
    const activeBetlines = Math.min(betlines, betlinePatterns.length);

    let totalWin = 0;
    const winDetailsArray: Array<{
      line: number;
      symbols: string[];
      positions: { reel: number; row: number }[];
      count: number;
      symbol: string;
      amount: number;
    }> = [];

    // Check each active betline for wins
    for (let lineIndex = 0; lineIndex < activeBetlines; lineIndex++) {
      const linePattern = betlinePatterns[lineIndex];

      // Validate pattern matches current grid dimensions
      if (!linePattern || !Array.isArray(linePattern) || linePattern.length !== currentReels) {
        console.warn(`[Win Detection] Skipping invalid betline ${lineIndex}: pattern length ${linePattern?.length} vs expected ${currentReels} reels`);
        continue;
      }

      // Validate pattern matches symbols array length
      if (linePattern.length !== symbols.length) {
        console.warn(`[Win Detection] Skipping betline ${lineIndex}: pattern length ${linePattern.length} vs symbols array length ${symbols.length}`);
        continue;
      }

      const lineSymbols: string[] = [];
      const linePositions: { reel: number; row: number }[] = [];

      // Extract symbols and positions for this betline
      for (let reel = 0; reel < symbols.length; reel++) {
        const row = linePattern[reel];

        // Validate row index is within bounds using current grid dimensions
        if (row < 0 || row >= currentRows) {
          console.warn(`[Win Detection] Invalid row ${row} for reel ${reel} in betline ${lineIndex} (valid range: 0-${currentRows - 1})`);
          break;
        }

        if (symbols[reel] && symbols[reel][row] !== undefined) {
          lineSymbols.push(symbols[reel][row]);
          linePositions.push({ reel, row });
        } else {
          console.warn(`[Win Detection] Missing symbol at reel ${reel}, row ${row}`);
          break;
        }
      }

      // Only check for wins if we successfully extracted all symbols for this line
      if (lineSymbols.length !== currentReels) {
        console.warn(`[Win Detection] Incomplete line ${lineIndex}: only ${lineSymbols.length}/${currentReels} symbols extracted`);
        continue;
      }

      // Check for winning combinations on this line
      const lineWin = checkLineWin(lineSymbols, betAmount / activeBetlines, symbolPaytable);

      if (lineWin.amount > 0) {
        totalWin += lineWin.amount;
        const winPositions = linePositions.slice(0, lineWin.count); // Only winning positions

        winDetailsArray.push({
          line: lineIndex + 1,
          symbols: lineSymbols,
          positions: winPositions,
          count: lineWin.count,
          symbol: lineWin.symbol || '',
          amount: lineWin.amount
        });
      }
    }

    return { totalWin, winDetails: winDetailsArray };
  }, [config.reels?.layout?.reels, config.reels?.layout?.rows, (config.reels as any)?.betlinePatterns, config.reels?.betlines, config.theme?.generated?.symbolPaytables, betAmount, checkLineWin, generateDefaultPaytable]);

  const computeResponsiveMetrics = useCallback(() => {
    const w = renderSize.width;
    const h = renderSize.height;

    // Get UI button container height to account for space taken at bottom
    let uiButtonHeight = 0;
    if (uiControlsRef.current) {
      const uiRect = uiControlsRef.current.getBoundingClientRect();
      uiButtonHeight = uiRect.height;
    } else {
      // Fallback estimate: UI buttons are typically 80-130px tall
      uiButtonHeight = 100;
    }

    // Calculate available height (excluding UI buttons at bottom)
    const availableHeight = h - uiButtonHeight;

    // Base calculations - use available height instead of full height
    const symbolWidth = Math.floor((w * 0.8) / reels);
    const symbolHeight = Math.floor((availableHeight * 0.8) / rows);
    let size = Math.min(symbolWidth, symbolHeight);
    symbolSizeRef.current = size;

    // Apply grid scale (120 = 100% baseline, so divide by 120 and multiply by scale)
    const scaleFactor = gridAdjustments.scale / 120;
    size = size * scaleFactor;

    // Apply grid stretch
    const baseSpacingX = size * 1.05 * (gridAdjustments.stretch.x / 100);
    const spacingY = size * 1.05 * (gridAdjustments.stretch.y / 100);

    // Apply reel gap to spacingX (reelGap affects actual spacing between reels)
    // reelGap is in pixels, so we add it to the base spacing
    const spacingX = baseSpacingX + (frameConfig.reelGap || 0);

    // Calculate base offset (centered in available space, not full height)
    const totalWidth = reels * spacingX;
    const totalHeight = rows * spacingY;
    const freespinSpacingY = spacingY - 5;
    let offsetX = (w - totalWidth) / 2;
    // Center vertically in the available space (above UI buttons)
    let offsetY = (availableHeight - totalHeight) / 2;

    // Apply grid position adjustments
    offsetX += gridAdjustments.position.x;
    offsetY += gridAdjustments.position.y;

    return {
      size,
      spacingX,
      spacingY,
      freespinSpacingY,
      offsetX,
      offsetY,
    };
  }, [renderSize, reels, rows, gridAdjustments, frameConfig.reelGap]);

  const preloadTextures = useCallback(async () => {
    // Wait for preloader to be ready
    await SymbolPreloader.waitForReady();

    const map: Record<string, PIXI.Texture> = {};

    for (const [k, url] of Object.entries(symbols)) {
      if (!url || url === '') {
        console.warn(`⚠️ Symbol ${k} has empty URL, skipping`);
        continue;
      }

      // Try to get from cache first (instant!)
      let texture = SymbolPreloader.getTexture(url) ||
        SymbolPreloader.getTexture(k);

      if (!texture) {
        texture = await SymbolPreloader.waitForSymbol(url, 10000);

        // If still not loaded, try loading directly
        if (!texture) {
          try {
            let newTexture: PIXI.Texture | null = null;

            // For base64 data URLs, use PIXI.Texture.from directly
            if (url.startsWith('data:')) {
              newTexture = await PIXI.Assets.load(url);
            } else {
              // Regular URL - use PIXI.Assets
              newTexture = await PIXI.Assets.load(url);
            }

            if (newTexture) {
              texture = newTexture;
            }
          } catch (error) {
            console.error(`[SlotMachine] Failed to load symbol ${k}:`, error);
          }
        }
      }

      if (texture) {
        map[k] = texture;
      } else {
        // Fallback - try to use predefined symbol if available
        const predefinedTexture = SymbolPreloader.getTexture(k);
        if (predefinedTexture) {
          map[k] = predefinedTexture;
        } else {
          console.warn(`⚠️ Symbol ${k} not available, using fallback`);
          map[k] = PIXI.Texture.WHITE;
        }
      }
    }

    texturesRef.current = map;
  }, [symbols]);

  const updateBackground = useCallback((url: string | null, adjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  }) => {
    const app = appRef.current;
    if (!app) return;

    // Remove existing background sprite
    if (backgroundSpriteRef.current) {
      app.stage.removeChild(backgroundSpriteRef.current);
      backgroundSpriteRef.current.destroy();
      backgroundSpriteRef.current = null;
    }

    if (!url) {
      return;
    }

    // Load and create background sprite
    try {
      const texture = PIXI.Texture.from(url);
      const sprite = new PIXI.Sprite(texture);

      // Calculate symbol area bounds
      const metrics = computeResponsiveMetrics();
      const symbolAreaWidth = reels * metrics.spacingX;
      const symbolAreaHeight = rows * metrics.spacingY;
      const symbolAreaX = metrics.offsetX;
      const symbolAreaY = metrics.offsetY;

      // Apply adjustments
      const pos = adjustments?.position || backgroundAdjustments.position;
      const scale = adjustments?.scale ?? backgroundAdjustments.scale;
      const fit = adjustments?.fit || backgroundAdjustments.fit;

      // Calculate dimensions based on symbol area only
      const textureWidth = texture.width;
      const textureHeight = texture.height;

      let finalWidth = textureWidth;
      let finalHeight = textureHeight;

      switch (fit) {
        case 'cover':
          const coverScale = Math.max(symbolAreaWidth / textureWidth, symbolAreaHeight / textureHeight);
          finalWidth = textureWidth * coverScale;
          finalHeight = textureHeight * coverScale;
          break;
        case 'contain':
          const containScale = Math.min(symbolAreaWidth / textureWidth, symbolAreaHeight / textureHeight);
          finalWidth = textureWidth * containScale;
          finalHeight = textureHeight * containScale;
          break;
        case 'fill':
          finalWidth = symbolAreaWidth;
          finalHeight = symbolAreaHeight;
          break;
        case 'scale-down':
          const scaleDownScale = Math.min(1, Math.min(symbolAreaWidth / textureWidth, symbolAreaHeight / textureHeight));
          finalWidth = textureWidth * scaleDownScale;
          finalHeight = textureHeight * scaleDownScale;
          break;
      }

      // Apply scale percentage
      finalWidth = (finalWidth * scale) / 100;
      finalHeight = (finalHeight * scale) / 100;

      sprite.width = finalWidth;
      sprite.height = finalHeight;

      // Position within symbol area bounds only
      sprite.anchor.set(0.5);
      sprite.x = symbolAreaX + symbolAreaWidth / 2 + pos.x;
      sprite.y = symbolAreaY + symbolAreaHeight / 2 + pos.y;

      // Create mask to constrain background to symbol area
      const bgMask = new PIXI.Graphics();
      bgMask.beginFill(0xffffff);
      bgMask.drawRect(symbolAreaX, symbolAreaY, symbolAreaWidth, symbolAreaHeight);
      bgMask.endFill();
      app.stage.addChild(bgMask);
      sprite.mask = bgMask;

      // Add to stage at the bottom (behind everything)
      app.stage.addChildAt(sprite, 0);
      backgroundSpriteRef.current = sprite;
    } catch (error) {
      console.error('Error loading background image:', error);
    }
  }, [backgroundAdjustments, reels, rows, computeResponsiveMetrics]);

  function renderReelFinal(_reelIndex: number, symbolsArr: string[] | undefined, rc: PIXI.Container, metrics: any) {
    // Visual polish: Remove blur filter when reel stops
    const blurFilter = blurFiltersRef.current.get(rc);
    if (blurFilter && rc.filters) {
      rc.filters = rc.filters.filter(f => f !== blurFilter);
      blurFiltersRef.current.delete(rc);
    }

    // Safety check: if symbolsArr is undefined or empty, generate random symbols
    // Exclude scatter if in free spin mode with retriggers disabled
    const keys = isInFreeSpinMode && config.bonus?.freeSpins?.retriggers === false
      ? Object.keys(symbols).filter(key => key !== 'scatter')
      : Object.keys(symbols);
    if (!symbolsArr || symbolsArr.length === 0) {
      symbolsArr = Array.from({ length: rows }, () => keys[Math.floor(Math.random() * keys.length)]);
    }

    const totalSprites = rc.children.length;
    const hasBufferSprites = totalSprites >= rows + 2;

    for (let childIndex = 0; childIndex < totalSprites; childIndex++) {
      const symbolContainer = rc.children[childIndex] as PIXI.Container;
      if (!symbolContainer || symbolContainer.children.length === 0) continue;

      const sprite = symbolContainer.children[0] as PIXI.Sprite;

      // Keep final layout aligned with spinning layout:
      // - child 0: top buffer (hidden by mask)
      // - children 1..rows: visible symbols (rows 0..rows-1)
      // - last child: bottom buffer (hidden by mask)
      let symbolRow = childIndex;
      if (hasBufferSprites) {
        const topBufferIndex = 0;
        const bottomBufferIndex = totalSprites - 1;
        if (childIndex === topBufferIndex) {
          symbolRow = rows - 1;
        } else if (childIndex === bottomBufferIndex) {
          symbolRow = 0;
        } else {
          symbolRow = childIndex - 1;
        }
      }

      const sym = symbolsArr[symbolRow] || keys[Math.floor(Math.random() * keys.length)];
      sprite.texture = texturesRef.current[sym] || PIXI.Texture.WHITE;
      sprite.width = metrics.size;
      sprite.height = metrics.size;

      // Position the symbol container, sprite is at (0, 0) relative to container
      sprite.x = 0;
      sprite.y = 0;
      symbolContainer.x = 0;
      symbolContainer.y = hasBufferSprites ? (childIndex - 1) * metrics.spacingY : childIndex * metrics.spacingY;
    }
  }

  // GSAP-based spin animation helper
  function renderReelSpinning(rc: PIXI.Container, metrics: any, offsetPx: number, reelIndex: number) {
    const spacingY = metrics.spacingY;
    const totalSprites = rc.children.length;

    // 1. BLUR VISUALS
    // Only apply if enabled in settings
    if (animationSettingsRef.current.visualEffects.spinBlur) {
      let blurFilter = blurFiltersRef.current.get(rc);
      if (!blurFilter) {
        blurFilter = new PIXI.BlurFilter();
        blurFiltersRef.current.set(rc, blurFilter);
        // Ensure we don't overwrite existing filters if any
        rc.filters = rc.filters ? [...rc.filters, blurFilter] : [blurFilter];
      }
      // Note: Blur strength is controlled in the GSAP onUpdate loop
    }

    // 2. DATA SAFETY CHECKS (Keep your existing fallback logic)
    // Get symbol sequence for this reel
    if (!reelSymbolSequencesRef.current[reelIndex] || reelSymbolSequencesRef.current[reelIndex].length === 0) {
      const keys = isInFreeSpinMode && config.bonus?.freeSpins?.retriggers === false
        ? Object.keys(symbols).filter(key => key !== 'scatter')
        : Object.keys(symbols);

      const minScrollSymbols = 30;
      const sequenceLength = minScrollSymbols + rows + 10;
      reelSymbolSequencesRef.current[reelIndex] = Array.from({ length: sequenceLength }, () =>
        keys[Math.floor(Math.random() * keys.length)]
      );
    }
    const symbolSequence = reelSymbolSequencesRef.current[reelIndex];

    // Ensure sequence length (Your existing safety check)
    const totalScrollDistance = offsetPx;
    const symbolsScrolled = Math.floor(totalScrollDistance / spacingY);
    const minRequiredLength = symbolsScrolled + totalSprites + 10;

    if (symbolSequence.length < minRequiredLength) {
      const availableKeys = isInFreeSpinMode && config.bonus?.freeSpins?.retriggers === false
        ? Object.keys(symbols).filter(key => key !== 'scatter')
        : Object.keys(symbols);

      while (symbolSequence.length < minRequiredLength) {
        symbolSequence.push(availableKeys[Math.floor(Math.random() * availableKeys.length)]);
      }
    }

    // 3. RENDER LOOP (The Critical Fix)
    for (let i = 0; i < totalSprites; i++) {
      const symbolContainer = rc.children[i] as PIXI.Container;
      if (!symbolContainer || symbolContainer.children.length === 0) continue;

      const sprite = symbolContainer.children[0] as PIXI.Sprite;

      // --- STEP A: CALCULATE VISUAL Y POSITION FIRST ---
      // We calculate where the sprite physically is BEFORE deciding what symbol it shows.

      // rawY = Initial Position + Scroll Offset
      // (This moves the sprite DOWN as offset increases)
      const rawY = i * spacingY + offsetPx;

      // Wrap Logic: Keep sprite inside the visible window (+ buffer)
      // Range: -spacingY (just above top) to (totalSprites - 1) * spacingY (just below bottom)
      // IMPORTANT: loop height must match the number of symbol containers, otherwise sprites will
      // "wrap" into visible positions mid-spin and look like they change rows.
      const loopHeight = totalSprites * spacingY;

      // Mathematical modulo that handles wrapping correctly
      // This ensures 'y' is always valid on screen
      const y = ((rawY % loopHeight) + loopHeight) % loopHeight - spacingY;

      // Apply Position immediately
      symbolContainer.x = 0;
      symbolContainer.y = y;

      // --- STEP B: CALCULATE SYMBOL INDEX FROM Y ---
      // Now we map the physical Y position back to the data array.
      // Since we are scrolling DOWN, the "Virtual Index" effectively moves backward through the tape
      // (Or simply: "What symbol lives at this specific pixel?")

      // Formula: (Total Distance - Current Y) / Item Height
      // This creates a stable index that doesn't "jump" when the sprite wraps.
      const virtualIndex = Math.floor((offsetPx - y) / spacingY);

      // Safe Modulo to wrap around the data array
      const seqLen = symbolSequence.length;
      const wrappedIndex = ((virtualIndex % seqLen) + seqLen) % seqLen;

      const symbolKey = symbolSequence[wrappedIndex];

      // --- STEP C: UPDATE TEXTURE ---
      const targetTexture = texturesRef.current[symbolKey] || PIXI.Texture.WHITE;

      // Only swap if texture changed (Performance optimization)
      if (sprite.texture !== targetTexture) {
        sprite.texture = targetTexture;
        sprite.width = metrics.size;
        sprite.height = metrics.size;
      }
    }
  }

  // Reset sprite positions to canonical grid order
  // Used after spin animation to ensure renderGrid finds sprites in expected locations
  function resetSpritePositions(metrics: any) {
    const spacingY = metrics.spacingY;

    for (let c = 0; c < reelContainersRef.current.length; c++) {
      const rc = reelContainersRef.current[c];
      if (!rc) continue;

      const totalSprites = rc.children.length;
      for (let i = 0; i < totalSprites; i++) {
        const symbolContainer = rc.children[i];
        if (symbolContainer) {
          symbolContainer.x = 0;
          symbolContainer.y = i * spacingY;
        }
      }
    }
  }

  // Check for scatter symbols in the grid
  const checkScatterSymbols = useCallback((grid: string[][]): { count: number; positions: Array<{ reel: number; row: number }> } => {
    const scatterPositions: Array<{ reel: number; row: number }> = [];
    let scatterCount = 0;

    for (let reel = 0; reel < grid.length; reel++) {
      for (let row = 0; row < grid[reel].length; row++) {
        if (grid[reel][row] === 'scatter') {
          scatterCount++;
          scatterPositions.push({ reel, row });
        }
      }
    }

    return { count: scatterCount, positions: scatterPositions };
  }, []);

  // Check for bonus symbols in the grid
  const checkBonusSymbols = useCallback((grid: string[][]): { count: number; positions: Array<{ reel: number; row: number }> } => {
    const bonusPositions: Array<{ reel: number; row: number }> = [];
    let bonusCount = 0;

    for (let reel = 0; reel < grid.length; reel++) {
      for (let row = 0; row < grid[reel].length; row++) {
        if (grid[reel][row] === 'bonus') {
          bonusCount++;
          bonusPositions.push({ reel, row });
        }
      }
    }

    return { count: bonusCount, positions: bonusPositions };
  }, []);

  // Trigger free spins
  const triggerFreeSpins = useCallback((scatterCount: number, scatterPositions: Array<{ reel: number; row: number }>) => {
    const freeSpinsConfig = config.bonus?.freeSpins;
    if (!freeSpinsConfig?.enabled) return false;

    const requiredScatters = freeSpinsConfig.triggers?.[0] || 3;
    if (scatterCount < requiredScatters) return false;

    // Check if retriggers are allowed (use ref for immediate check)
    if (freeSpinModeRef.current && freeSpinsConfig.retriggers === false) {
      return false;
    }

    const freeSpinsToAward = freeSpinsConfig.count || 10;

    if (!freeSpinModeRef.current) {
      // First time triggering free spins
      freeSpinModeRef.current = true; // Update ref immediately
      freeSpinsRemainingRef.current = freeSpinsToAward; // Update ref immediately
      totalFreeSpinWinsRef.current = 0; // Reset accumulator when starting free spins
      setIsInFreeSpinMode(true);
      setFreeSpinsRemaining(freeSpinsToAward);
      setTotalFreeSpinWins(0); // Reset state accumulator
      // Play free spins start sound
      playAudio('bonus', 'fs_start');
    } else {
      // Retrigger - add more free spins
      freeSpinsRemainingRef.current += freeSpinsToAward; // Update ref immediately
      setFreeSpinsRemaining(prev => prev + freeSpinsToAward);
      // Play free spins start sound for retrigger
      playAudio('bonus', 'fs_start');
    }

    setFreeSpinAwardedCount(freeSpinsToAward);

    // Get transition style and duration from config
    const transitionStyle = (config as any)?.freespinTransition?.style || 'fade';
    const transitionDuration = (config as any)?.freespinTransition?.duration || 3;

    // Set transition style and duration for announcement
    setAnnouncementTransitionStyle(transitionStyle);
    setAnnouncementTransitionDuration(transitionDuration);

    setShowFreeSpinAnnouncement(true);

    // Hide announcement after configured duration
    setTimeout(() => {
      setShowFreeSpinAnnouncement(false);
    }, transitionDuration * 1000);

    // Show scatter highlight animation
    if (appRef.current && scatterPositions.length > 0) {
      scatterPositions.forEach((pos, idx) => {
        setTimeout(() => {
          const highlight = new PIXI.Graphics();
          highlight.beginFill(0xFF6B35, 0.8); // Orange glow for scatters
          const metrics = computeResponsiveMetrics();
          highlight.drawRoundedRect(
            metrics.offsetX + pos.reel * metrics.spacingX - 3,
            metrics.offsetY + pos.row * metrics.spacingY - 3,
            metrics.size + 6,
            metrics.size + 6,
            6
          );
          highlight.endFill();

          if (appRef.current) {
            appRef.current.stage.addChild(highlight);
          }

          // Pulsing animation
          gsap.to(highlight, {
            alpha: 0.3,
            duration: 0.5,
            repeat: 5,
            yoyo: true,
            ease: 'power2.inOut',
            onComplete: () => {
              if (highlight.parent) {
                highlight.parent.removeChild(highlight);
              }
              highlight.destroy();
            }
          });
        }, idx * 100);
      });
    }

    return true;
  }, [config.bonus?.freeSpins, isInFreeSpinMode, computeResponsiveMetrics]);

  // Trigger wheel bonus
  const triggerWheelBonus = useCallback((bonusCount: number, bonusPositions: Array<{ reel: number; row: number }>) => {
    const wheelConfig = config.bonus?.wheel;
    if (!wheelConfig?.enabled) return false;
    // Wheel bonus typically requires 3 bonus symbols
    if (bonusCount < 3) return false;
    // Show announcement first (image or default)
    setShowWheelAnnouncement(true);

    // After announcement, show wheel bonus modal
    setTimeout(() => {
      setShowWheelAnnouncement(false);
      setWheelRotation(0);
      setWheelSpinning(false);
      setWheelResult(null);
      setShowWheelBonus(true);
    }, 3000); // 3 second announcement display

    // Show bonus highlight animation
    if (appRef.current && bonusPositions.length > 0) {
      bonusPositions.forEach((pos, idx) => {
        setTimeout(() => {
          const highlight = new PIXI.Graphics();
          highlight.beginFill(0xFFD700, 0.8); // Gold glow for bonus symbols
          const metrics = computeResponsiveMetrics();
          highlight.drawRoundedRect(
            metrics.offsetX + pos.reel * metrics.spacingX - 3,
            metrics.offsetY + pos.row * metrics.spacingY - 3,
            metrics.size + 6,
            metrics.size + 6,
            6
          );
          highlight.endFill();

          if (appRef.current) {
            appRef.current.stage.addChild(highlight);
          }

          // Pulsing animation
          gsap.to(highlight, {
            alpha: 0.3,
            duration: 0.5,
            repeat: 5,
            yoyo: true,
            ease: 'power2.inOut',
            onComplete: () => {
              if (highlight.parent) {
                highlight.parent.removeChild(highlight);
              }
              highlight.destroy();
            }
          });
        }, idx * 100);
      });
    }

    return true;
  }, [config.bonus?.wheel, computeResponsiveMetrics]);

  // Initialize Pick & Click grid
  const initializePickAndClickGrid = useCallback(() => {
    const pickAndClickConfig = config.bonus?.pickAndClick;
    if (!pickAndClickConfig?.enabled) return;

    const gridSize = pickAndClickConfig.gridSize || [3, 3];
    const rows = gridSize[0];
    const cols = gridSize[1];
    const prizeValues = (pickAndClickConfig as any)?.prizeValues || [];
    const hasMultipliers = !!pickAndClickConfig.multipliers;
    const hasExtraPicks = !!pickAndClickConfig.extraPicks;

    // Create grid with prizes
    const grid: Array<Array<{ type: 'prize' | 'extraPick' | 'multiplier'; value: number } | null>> = [];
    const revealed: Array<Array<boolean>> = [];

    // Create array of all cells
    const allCells: Array<{ type: 'prize' | 'extraPick' | 'multiplier'; value: number }> = [];

    // Add prize values
    for (let i = 0; i < rows * cols; i++) {
      const value = prizeValues[i] || 100;
      allCells.push({ type: 'prize', value });
    }

    // Add extra pick if enabled
    if (hasExtraPicks && allCells.length > 0) {
      const extraPickIndex = Math.floor(Math.random() * allCells.length);
      allCells[extraPickIndex] = { type: 'extraPick', value: 0 };
    }

    // Add multiplier if enabled
    if (hasMultipliers && allCells.length > 0) {
      let multiplierIndex = Math.floor(Math.random() * allCells.length);
      // Make sure multiplier doesn't replace extra pick
      if (hasExtraPicks && allCells[multiplierIndex].type === 'extraPick') {
        multiplierIndex = (multiplierIndex + 1) % allCells.length;
      }
      const multiplierValue = [2, 3, 5][Math.floor(Math.random() * 3)];
      allCells[multiplierIndex] = { type: 'multiplier', value: multiplierValue };
    }

    // Shuffle the cells
    for (let i = allCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
    }

    // Fill grid
    let cellIndex = 0;
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      revealed[r] = [];
      for (let c = 0; c < cols; c++) {
        if (cellIndex < allCells.length) {
          grid[r][c] = allCells[cellIndex];
        } else {
          // Fill remaining cells with default prizes if needed
          const defaultValue = prizeValues[cellIndex] || 100;
          grid[r][c] = { type: 'prize', value: defaultValue };
        }
        revealed[r][c] = false;
        cellIndex++;
      }
    }

    setPickAndClickGrid(grid);
    setPickAndClickRevealed(revealed);
    setPickAndClickPicksRemaining(pickAndClickConfig.picks || 3);
    setPickAndClickTotalWin(0);
    setPickAndClickCurrentMultiplier(1);
  }, [config.bonus?.pickAndClick]);

  // Trigger Pick & Click bonus
  const triggerPickAndClick = useCallback((bonusCount: number, bonusPositions: Array<{ reel: number; row: number }>) => {
    const pickAndClickConfig = config.bonus?.pickAndClick;
    if (!pickAndClickConfig?.enabled) return false;
    // Pick & Click typically requires 3 bonus symbols
    if (bonusCount < 3) return false;

    // Show announcement first (image or default)
    setShowPickAndClickAnnouncement(true);

    // After announcement, initialize and show the grid
    setTimeout(() => {
      setShowPickAndClickAnnouncement(false);
      initializePickAndClickGrid();
      setShowPickAndClick(true);
    }, 3000); // 3 second announcement display

    // Show bonus highlight animation
    if (appRef.current && bonusPositions.length > 0) {
      bonusPositions.forEach((pos, idx) => {
        setTimeout(() => {
          const highlight = new PIXI.Graphics();
          highlight.beginFill(0xFFD700, 0.8); // Gold glow for bonus symbols
          const metrics = computeResponsiveMetrics();
          highlight.drawRoundedRect(
            metrics.offsetX + pos.reel * metrics.spacingX - 3,
            metrics.offsetY + pos.row * metrics.spacingY - 3,
            metrics.size + 6,
            metrics.size + 6,
            6
          );
          highlight.endFill();

          if (appRef.current) {
            appRef.current.stage.addChild(highlight);
          }

          // Pulsing animation
          gsap.to(highlight, {
            alpha: 0.3,
            duration: 0.5,
            repeat: 5,
            yoyo: true,
            ease: 'power2.inOut',
            onComplete: () => {
              if (highlight.parent) {
                highlight.parent.removeChild(highlight);
              }
              highlight.destroy();
            }
          });
        }, idx * 100);
      });
    }

    return true;
  }, [config.bonus?.pickAndClick, initializePickAndClickGrid, computeResponsiveMetrics]);

  // Handle Pick & Click cell selection
  const handlePickAndClickCell = useCallback((row: number, col: number) => {
    if (pickAndClickPicksRemaining <= 0) return;
    if (pickAndClickRevealed[row]?.[col]) return; // Already revealed

    const cell = pickAndClickGrid[row]?.[col];
    if (!cell) return;

    // Mark as revealed
    const newRevealed = pickAndClickRevealed.map((r, rIdx) =>
      rIdx === row ? r.map((revealed, cIdx) => cIdx === col ? true : revealed) : r
    );
    setPickAndClickRevealed(newRevealed);

    // Handle different cell types
    let newPicksRemaining = pickAndClickPicksRemaining;
    let newTotalWin = pickAndClickTotalWin;
    let newMultiplier = pickAndClickCurrentMultiplier;

    if (cell.type === 'prize') {
      const prizeAmount = cell.value * betAmount * newMultiplier;
      newTotalWin = pickAndClickTotalWin + prizeAmount;
      newPicksRemaining = pickAndClickPicksRemaining - 1;
      setPickAndClickTotalWin(newTotalWin);
      setPickAndClickPicksRemaining(newPicksRemaining);
    } else if (cell.type === 'extraPick') {
      newPicksRemaining = pickAndClickPicksRemaining + 1; // Add an extra pick
      setPickAndClickPicksRemaining(newPicksRemaining);
    } else if (cell.type === 'multiplier') {
      newMultiplier = pickAndClickCurrentMultiplier * cell.value;
      setPickAndClickCurrentMultiplier(newMultiplier);
    }

    // Check if game is over (after processing the pick)
    if (newPicksRemaining <= 0) {
      // Game ends after a short delay to show the last reveal
      setTimeout(() => {
        if (newTotalWin > 0) {
          const currentBalance = balance;
          setBalance(currentBalance + newTotalWin);
          setWinAmount(newTotalWin);

          // Calculate win tier and trigger particle effects for big, mega, and super wins
          const winTier = calculateWinTier(betAmount, newTotalWin);
          if (winTier !== 'small') {
            triggerParticleEffects(winTier);
          }

          setShowWinDisplay(true);
        }
        // Close modal after showing win
        setTimeout(() => {
          setShowPickAndClick(false);
          // Resume normal gameplay
          spinTimelinesRef.current.forEach(tl => {
            if (tl) tl.kill();
          });
          spinTimelinesRef.current = [];
          spinMetaRef.current = null;
          setIsSpinning(false);
          setTimeout(() => {
            spinJustCompletedRef.current = false;
          }, 1000);
          rafRef.current = null;
        }, 2000);
      }, 1500);
    }
  }, [pickAndClickPicksRemaining, pickAndClickRevealed, pickAndClickGrid, pickAndClickCurrentMultiplier, pickAndClickTotalWin, betAmount, setBalance, setWinAmount]);

  const onSpin = () => {
    // If spinning, stop the spin immediately
    if (isSpinning) {
      quickStopRef.current?.();
      return;
    }
    if (!Object.keys(symbols).length) return;

    // Clean up any active symbol animations before starting new spin
    cleanupSymbolAnimations();

    // Play UI spin press sound
    playAudio('ui', 'ui_spin_press');

    // In free spin mode, don't check balance or deduct bet (use ref for immediate check)
    if (!freeSpinModeRef.current) {
      // Check if balance is sufficient
      if (balance < betAmount) {
        console.warn('Insufficient balance');
        return;
      }

      // Deduct bet amount from balance (only in normal mode)
      setBalance(balance - betAmount);
    } else {
      // Decrement free spins remaining
      const newCount = freeSpinsRemainingRef.current - 1;
      freeSpinsRemainingRef.current = newCount; // Update ref immediately
      setFreeSpinsRemaining(newCount);

      if (newCount <= 0) {
        // Free spins ended - show summary after a short delay
        freeSpinModeRef.current = false; // Update ref immediately
        const totalWins = totalFreeSpinWinsRef.current;
        setTimeout(() => {
          setIsInFreeSpinMode(false);
          setTotalFreeSpinWins(totalWins);
          setShowFreeSpinSummary(true);
          // Play free spins end sound
          playAudio('bonus', 'fs_end');
        }, 2000);
      }
    }

    // Clear previous win lines
    clearWinLines();

    // Reset win state for new spin
    setWinAmount(0);

    // Get available symbols (exclude scatter if in free spin mode with retriggers disabled)
    const keys = isInFreeSpinMode && config.bonus?.freeSpins?.retriggers === false
      ? Object.keys(symbols).filter(key => key !== 'scatter')
      : Object.keys(symbols);

    const finalGrid = Array.from({ length: reels }, () =>
      Array.from({ length: rows }, () => keys[Math.floor(Math.random() * keys.length)])
    );

    finalGridRef.current = finalGrid;

    // Kill any existing spin timelines
    spinTimelinesRef.current.forEach(tl => {
      if (tl) tl.kill();
    });
    spinTimelinesRef.current = [];

    // Clear the spin completion flag when starting a new spin
    spinJustCompletedRef.current = false;

    // Play reel start sound
    playAudio('reels', 'reel_start');
    // Play reel loop sound (looping)
    playAudio('reels', 'reel_loop', { loop: true, stopPrevious: true });

    setIsSpinning(true);
    startGSAPSpin();
  };

  // GSAP-based spin animation
  const startGSAPSpin = () => {
    const metrics = computeResponsiveMetrics();
    const { size, spacingX, spacingY, offsetX, offsetY } = metrics;
    // Speed 1.0 = 2.5 seconds, speed 2.0 = 1.25 seconds, speed 0.5 = 5 seconds
    const currentSpeed = animationSettingsRef.current.speed;
    const baseDurationMs = 3500 / currentSpeed; // Faster default: 2.5s at speed 1.0
    const baseMs = Math.max(800, Math.min(15000, baseDurationMs)); // Clamp between 0.8-15 seconds for wider range
    const reelDelay = 300; // Increased delay between reels

    // Initialize symbol sequences for each reel with final symbols integrated
    // Exclude scatter if in free spin mode with retriggers disabled
    const keys = isInFreeSpinMode && config.bonus?.freeSpins?.retriggers === false
      ? Object.keys(symbols).filter(key => key !== 'scatter')
      : Object.keys(symbols);
    if (keys.length === 0) {
      console.error('[startGSAPSpin] No symbols available! Cannot start spin.');
      setIsSpinning(false);
      return;
    }

    reelSymbolSequencesRef.current = [];

    // Calculate how many symbols we need to scroll to bring final symbols into view
    const minScrollSymbols = 30; // Minimum symbols to scroll before final symbols appear

    for (let i = 0; i < reels; i++) {
      const finalSymbols = finalGridRef.current ? finalGridRef.current[i] : null;

      // Create sequence: random symbols first, then final symbols at the end
      const sequence: string[] = [];

      // Add random symbols for initial scrolling
      for (let j = 0; j < minScrollSymbols; j++) {
        sequence.push(keys[Math.floor(Math.random() * keys.length)]);
      }

      // Add final symbols that will scroll into view
      if (finalSymbols && finalSymbols.length === rows) {
        for (let j = finalSymbols.length - 1; j >= 0; j--) {
          sequence.push(finalSymbols[j]);
        }
      } else {
        // Fallback: add random symbols if final symbols not available
        for (let j = 0; j < rows; j++) {
          sequence.push(keys[Math.floor(Math.random() * keys.length)]);
        }
      }

      for (let j = 0; j < 50; j++) {
        sequence.push(keys[Math.floor(Math.random() * keys.length)]);
      }

      // Seed the tape with the currently visible symbols so the first spinning frame doesn't
      // "teleport" to a new random set before motion is visible.
      const currentSymbols = currentGrid?.[i];
      if (currentSymbols && currentSymbols.length === rows) {
        const sanitizedCurrent = currentSymbols.map(sym =>
          keys.includes(sym) ? sym : keys[Math.floor(Math.random() * keys.length)]
        );

        // With offset=0, row 0 uses sequence[0], row 1 uses sequence[-1], row 2 uses sequence[-2], etc.
        sequence[0] = sanitizedCurrent[0];
        for (let r = 1; r < rows; r++) {
          const idx = sequence.length - r;
          if (idx >= 0) {
            sequence[idx] = sanitizedCurrent[r];
          }
        }
      }

      reelSymbolSequencesRef.current[i] = sequence;
    }

    // Verify sequences were created successfully
    if (reelSymbolSequencesRef.current.length !== reels) {
      console.error('[startGSAPSpin] Failed to initialize symbol sequences!');
      setIsSpinning(false);
      return;
    }

    // Map easing string to GSAP easing
    const getGSAPEasing = (easingType: string): string => {
      const easingMap: Record<string, string> = {
        'linear': 'none',
        'power2.in': 'power2.in',
        'power2.out': 'power2.out',
        'power2.inOut': 'power2.inOut',
        'back.out': 'back.out(1.70158)',
        'bounce.out': 'bounce.out',
        'elastic.out': 'elastic.out(1, 0.3)'
      };
      return easingMap[easingType] || 'power2.out';
    };

    const configuredEasing = animationSettingsRef.current.easing;

    // Use native GSAP easing directly for the scroll.
    const scrollEasing = getGSAPEasing(configuredEasing);
    const stopEasing = getGSAPEasing(configuredEasing);

    // Disable the artificial settle animation
    const stopSettle = { enabled: false, px: 0, downDuration: 0, upDuration: 0 };

    let completedReels = 0;
    const totalReels = reels;
    const spinningReels = new Set<number>();

    // Create timeline for each reel
    for (let c = 0; c < reels; c++) {
      const rc = reelContainersRef.current[c];
      if (!rc) continue;

      const duration = (baseMs + c * reelDelay) / 1000; // Convert to seconds
      spinningReels.add(c);

      // Calculate total scroll distance needed to bring the final symbols into view.
      // Visible rows map to seq[n], seq[n-1], ... so we stop when the top row hits:
      // index = minScrollSymbols + (rows - 1)
      const minScrollSymbols = 30;
      const stopIndex = minScrollSymbols + (rows - 1);
      const finalOffset = stopIndex * spacingY;

      // Create a progress object to animate
      const spinProgress = { value: 0 };

      // Create a timeline for this reel
      const tl = gsap.timeline();

      // Animate the progress value
      tl.to(spinProgress, {
        value: 1,
        duration: duration,
        ease: scrollEasing,
        onUpdate: function () {
          const progress = spinProgress.value;

          // Apply easing to progress, then multiply by total distance
          // Speed multiplier affects how fast visually, but we still scroll the full distance
          const currentScrollDistance = progress * finalOffset;

          // Don't use modulo - let it scroll continuously
          const offset = currentScrollDistance;

          // Update reel spinning visuals
          renderReelSpinning(rc, { size, spacingX, spacingY }, offset, c);

          // Apply blur intensity from animation settings (use ref for real-time updates)
          const blurFilter = blurFiltersRef.current.get(rc);
          const currentSettings = animationSettingsRef.current;
          if (blurFilter && currentSettings.visualEffects.spinBlur) {
            const speed = 1 - progress; // Speed factor based on progress (1 at start, 0 at end)
            // Use blurIntensity from settings (0-20 range), convert to PIXI blur pixels
            // Blur is stronger at the start of spin and decreases as it slows down
            // Formula: blurIntensity (0-20) -> blur pixels (0-20), scaled by speed
            blurFilter.blur = (currentSettings.blurIntensity / 2) * (0.3 + speed * 1.4);
          } else if (blurFilter) {
            // Remove blur if spinBlur is disabled
            blurFilter.blur = 0;
          }

          // Visual polish: Anticipation scale when about to stop
          if (progress > 0.85) {
            const anticipation = (progress - 0.85) / 0.15;
            rc.scale.set(1 + (anticipation * 0.015));
          } else {
            rc.scale.set(1);
          }

          // Apply glow effects if enabled (use ref for real-time updates)
          if (currentSettings.visualEffects.glowEffects) {
            let glow = glowEffectsRef.current.get(rc);
            if (!glow) {
              glow = new PIXI.Graphics();
              glowEffectsRef.current.set(rc, glow);
              if (appRef.current) {
                const reelIndex = reelContainersRef.current.indexOf(rc);
                if (reelIndex >= 0) {
                  let insertIndex = appRef.current.stage.getChildIndex(rc);
                  appRef.current.stage.addChildAt(glow, insertIndex);
                }
              }
            }
            const glowIntensity = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
            glow.clear();
            glow.beginFill(0xffff00, 0.3 * glowIntensity);
            glow.drawRect(offsetX + c * spacingX - 5, offsetY - 5, size + 10, rows * spacingY + 10);
            glow.endFill();
          } else {
            // Remove glow if disabled
            const glow = glowEffectsRef.current.get(rc);
            if (glow && glow.parent) {
              glow.parent.removeChild(glow);
              glow.destroy();
              glowEffectsRef.current.delete(rc);
            }
          }

          // Apply screen shake if enabled (use ref for real-time updates)
          if (currentSettings.visualEffects.screenShake && spinningReels.size > 0) {
            const shakeIntensity = (1 - progress) * 2;
            const shakeX = (Math.random() - 0.5) * shakeIntensity;
            const shakeY = (Math.random() - 0.5) * shakeIntensity;
            screenShakeRef.current = { x: shakeX, y: shakeY };
          }

          // Update reel position (with screen shake if enabled)
          const shakeX = currentSettings.visualEffects.screenShake && spinningReels.size > 0
            ? screenShakeRef.current.x
            : 0;
          const shakeY = currentSettings.visualEffects.screenShake && spinningReels.size > 0
            ? screenShakeRef.current.y
            : 0;
          rc.x = offsetX + c * spacingX + shakeX;
          rc.y = offsetY + shakeY;

          // Update mask position and visibility
          const mask = reelMasksRef.current[c];
          if (mask) {
            const reelEnabled = maskControls.enabled && maskControls.perReelEnabled[c];
            mask.clear();
            if (reelEnabled) {
              if (maskControls.debugVisible) {
                mask.beginFill(0xff0000, 0.2);
              } else {
                mask.beginFill(0xffffff);
              }
              mask.drawRect(offsetX + c * spacingX, offsetY, size, rows * spacingY);
              mask.endFill();
            } else {
              mask.beginFill(0x000000, 0);
              mask.drawRect(offsetX + c * spacingX, offsetY, size, rows * spacingY);
              mask.endFill();
            }
            mask.visible = true;
            rc.mask = mask;
          }

          // Hide/show reel container based on mask controls
          if (maskControls.enabled) {
            rc.visible = maskControls.perReelEnabled[c];
          } else {
            rc.visible = true;
          }
        }
      });

      // Reel finished spinning: snap to final symbols, remove FX, then apply stop settle if configured.
      tl.add(() => {
        spinningReels.delete(c);

        // Snap to the exact final offset so the visible window shows the final symbols (no post-spin replacement)
        renderReelSpinning(rc, { size, spacingX, spacingY }, finalOffset, c);

        // Ensure scale is exactly 1.0 when reel stops
        rc.scale.set(1, 1);

        // Remove blur filter
        const blurFilter = blurFiltersRef.current.get(rc);
        if (blurFilter) {
          blurFilter.blur = 0;
          if (rc.filters) {
            rc.filters = rc.filters.filter(f => f !== blurFilter);
          }
          blurFiltersRef.current.delete(rc);
        }

        // Remove glow when finished
        const glow = glowEffectsRef.current.get(rc);
        if (glow && glow.parent) {
          glow.parent.removeChild(glow);
          glow.destroy();
          glowEffectsRef.current.delete(rc);
        }

        // Update position without shake
        rc.x = offsetX + c * spacingX;
        rc.y = offsetY;
      });

      if (stopSettle.enabled) {
        // Small overshoot down, then bounce back to final using the selected easing.
        tl.to(rc, {
          y: offsetY + stopSettle.px,
          duration: stopSettle.downDuration,
          ease: 'power2.out'
        }).to(rc, {
          y: offsetY,
          duration: stopSettle.upDuration,
          ease: stopEasing
        });
      }

      tl.eventCallback('onComplete', () => {
        completedReels++;
        if (completedReels === totalReels) {
          handleSpinComplete();
        }
      });

      spinTimelinesRef.current.push(tl);
    }
  };


  // Handle spin completion
  const handleSpinComplete = () => {
    const finalGrid = finalGridRef.current || currentGrid;
    const metrics = computeResponsiveMetrics();
    setCurrentGrid(finalGrid);

    // Reset sprite positions to canonical grid order to prevent visual "swapping"
    // when transitioning from spin animation (cyclic positions) to static grid (linear positions)
    resetSpritePositions(metrics);

    // Mark that spin just completed to prevent renderGrid/renderReelFinal from overwriting
    // while win animations/lines are being applied.
    spinJustCompletedRef.current = true;

    // Final symbols should already be visible from the spin sequence; this locks the final
    // layout so row indices map correctly for win highlights/animations (no visual replacement).
    if (finalGrid) {
      for (let i = 0; i < reels; i++) {
        const rc = reelContainersRef.current[i];
        if (!rc) continue;

        const reelSymbols = finalGrid[i];
        renderReelFinal(i, reelSymbols, rc, metrics);
        rc.x = metrics.offsetX + i * metrics.spacingX;
        rc.y = metrics.offsetY;
      }
    }

    // Reset screen shake
    screenShakeRef.current = { x: 0, y: 0 };

    // Stop reel loop sound
    stopAudio('reels', 'reel_loop');

    // Calculate wins after spin completes
    if (finalGrid) {
      // Check for scatter symbols first (before win calculation)
      const scatterCheck = checkScatterSymbols(finalGrid);
      if (scatterCheck.count >= 3) {
        // Play scatter sound
        playAudio('features', 'feat_scatter');
      }
      triggerFreeSpins(scatterCheck.count, scatterCheck.positions);

      // Check for bonus symbols (wheel bonus and pick & click)
      const bonusCheck = checkBonusSymbols(finalGrid);
      if (bonusCheck.count >= 3) {
        // Play bonus trigger sound
        playAudio('bonus', 'bonus_trigger');
      }
      const wheelWasTriggered = triggerWheelBonus(bonusCheck.count, bonusCheck.positions);
      const pickAndClickWasTriggered = triggerPickAndClick(bonusCheck.count, bonusCheck.positions);

      // Calculate wins (scatter is already excluded from line wins in checkLineWin)
      const winResult = checkWinLines(finalGrid);

      // Apply symbol animations to winning symbols (if configured)
      // Use a small delay to ensure sprites are in final positions after renderReelFinal
      if (winResult.totalWin > 0 && winResult.winDetails.length > 0) {
        // Clean up any existing animations first
        cleanupSymbolAnimations();
        // Wait a frame to ensure renderReelFinal has positioned sprites correctly
        requestAnimationFrame(() => {
          setTimeout(() => {
            // Apply animations with 3 second duration
            applyWinningSymbolAnimations(winResult.winDetails);
          }, 50); // Small delay to ensure sprites are positioned
        });
      } else {
        // No wins - clean up any lingering animations
        cleanupSymbolAnimations();
      }

      // Apply free spin multipliers if in free spin mode (use ref for immediate synchronous check)
      let finalWin = winResult.totalWin;
      if (freeSpinModeRef.current && config.bonus?.freeSpins?.multipliers && config.bonus.freeSpins.multipliers.length > 0) {
        const multipliers = config.bonus.freeSpins.multipliers;
        const multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
        finalWin = winResult.totalWin * multiplier;
      }

      setWinAmount(finalWin);

      // Accumulate free spin wins if in free spin mode
      if (freeSpinModeRef.current && finalWin > 0) {
        totalFreeSpinWinsRef.current += finalWin;
        setTotalFreeSpinWins(totalFreeSpinWinsRef.current);
      }

      // Add win amount to balance
      if (finalWin > 0) {
        setBalance(balance + finalWin);

        // Calculate win tier
        const winTier = calculateWinTier(betAmount, finalWin);
        setCurrentWinTier(winTier);

        // Play hard stop sound for wins
        playAudio('reels', 'reel_stop_hard');

        // Play win sound based on tier
        if (winTier === 'small') {
          playAudio('wins', 'win_small');
        } else if (winTier === 'big') {
          playAudio('wins', 'win_big');
        } else if (winTier === 'mega') {
          playAudio('wins', 'win_mega');
        } else {
          playAudio('wins', 'win_medium');
        }

        // Trigger particle effects for big, mega, and super wins
        if (winTier !== 'small') {
          triggerParticleEffects(winTier);
        }

        // Check for generated win title asset
        const winTitleId = winTier === 'big' ? 'big_win' :
          winTier === 'mega' ? 'mega_win' :
            winTier === 'super' ? 'super_win' : null;

        // Comprehensive check for win title URL - check multiple possible locations
        let winTitleUrl = null;
        if (winTitleId) {
          // First, try the standard location
          winTitleUrl = config.generatedAssets?.winTitles?.[winTitleId] || null;

          // If not found, also check winTitleConfigs for the URL
          if (!winTitleUrl && config.winTitleConfigs?.[winTitleId]?.generatedUrl) {
            winTitleUrl = config.winTitleConfigs[winTitleId].generatedUrl;
            console.log('[SlotMachine] Found win title URL in winTitleConfigs:', winTitleId);
          }
        }

        // Debug logging for win titles
        if (winTier !== 'small') {
          console.log('[SlotMachine] Win title check:', {
            winTier,
            winTitleId,
            betAmount,
            finalWin,
            multiplier: (finalWin / betAmount).toFixed(2) + 'x',
            winTitleUrl: winTitleUrl ? `${winTitleUrl.substring(0, 50)}...` : 'null',
            hasWinTitles: !!config.generatedAssets?.winTitles,
            allWinTitleIds: config.generatedAssets?.winTitles ? Object.keys(config.generatedAssets.winTitles) : [],
            hasWinTitleConfigs: Boolean(config.winTitleConfigs),
            winTitleConfigKeys: config.winTitleConfigs ? Object.keys(config.winTitleConfigs) : [],
            winTitleConfigForId:
              winTitleId && config.winTitleConfigs && typeof winTitleId === 'string' && winTitleId in config.winTitleConfigs
                ? {
                  generated: config.winTitleConfigs[winTitleId]?.generated,
                  hasUrl: Boolean(config.winTitleConfigs[winTitleId]?.generatedUrl),
                  urlPreview: config.winTitleConfigs[winTitleId]?.generatedUrl
                    ? `${config.winTitleConfigs[winTitleId].generatedUrl.substring(0, 50)}...`
                    : 'null'
                }
                : 'not found'
          });
        }

        // Show both win title and win display at the same time for big/mega/super wins
        // Show win title if URL exists, otherwise just show win display
        if (winTier !== 'small') {
          if (winTitleUrl) {
            // Show both win title and win display simultaneously
            setShowWinTitle(true);
            setShowWinDisplay(true);
            console.log('[SlotMachine] Showing win title:', winTitleId);

            // Hide both after the same animation duration
            const animationDuration = 3.5; // Match the fadeInOut animation duration
            setTimeout(() => {
              setShowWinTitle(false);
              setShowWinDisplay(false);
              setTimeout(() => {
                drawWinLines(winResult.winDetails, () => {
                  if (!wheelWasTriggered && !pickAndClickWasTriggered) {
                    spinTimelinesRef.current = [];
                    setIsSpinning(false);
                    setTimeout(() => {
                      spinJustCompletedRef.current = false;
                    }, 5000);
                  }
                });
              }, 100);
            }, animationDuration * 1000);
          } else {
            // No win title asset, just show win display
            console.log('[SlotMachine] No win title asset found for:', winTitleId, '- showing win display only');
            setShowWinDisplay(true);
            setTimeout(() => {
              drawWinLines(winResult.winDetails, () => {
                setTimeout(() => {
                  setShowWinDisplay(false);
                }, 500);
                if (!wheelWasTriggered && !pickAndClickWasTriggered) {
                  spinTimelinesRef.current = [];
                  setIsSpinning(false);
                  setTimeout(() => {
                    spinJustCompletedRef.current = false;
                  }, 5000); // Clear after 5 seconds (enough for win animations)
                }
              });
            }, 100);
          }
        } else {
          // Small wins - show win display immediately
          setShowWinDisplay(true);
          setTimeout(() => {
            drawWinLines(winResult.winDetails, () => {
              setTimeout(() => {
                setShowWinDisplay(false);
              }, 500);
              if (!wheelWasTriggered && !pickAndClickWasTriggered) {
                spinTimelinesRef.current = [];
                setIsSpinning(false);
                setTimeout(() => {
                  spinJustCompletedRef.current = false;
                }, 5000);
              }
            });
          }, 100);
        }
      } else {
        // No wins - play soft stop sound
        playAudio('reels', 'reel_stop_soft');
        if (!wheelWasTriggered && !pickAndClickWasTriggered) {
          spinTimelinesRef.current = [];
          setIsSpinning(false);
          // Clear the flag after a short delay
          setTimeout(() => {
            spinJustCompletedRef.current = false;
          }, 1000);
        }
      }
    } else {
      // No final grid, set isSpinning to false immediately
      // Play soft stop sound
      playAudio('reels', 'reel_stop_soft');
      spinTimelinesRef.current = [];
      setIsSpinning(false);
      // Clear the flag after a short delay
      setTimeout(() => {
        spinJustCompletedRef.current = false;
      }, 1000);
    }
  };

  // Quick Stop function 
  const quickStop = useCallback(() => {
    if (!isSpinning) return;
    // Kill all GSAP timelines immediately
    spinTimelinesRef.current.forEach(tl => {
      if (tl) {
        gsap.killTweensOf(tl);
        tl.kill();
      }
    });
    spinTimelinesRef.current = [];

    // Clean up any active symbol animations
    cleanupSymbolAnimations();

    // Stop reel loop sound
    stopAudio('reels', 'reel_loop');

    // Get metrics for positioning
    const metrics = computeResponsiveMetrics();
    const { spacingX, offsetX, offsetY } = metrics;

    // Get final grid symbols
    const finalGrid = finalGridRef.current || currentGrid;

    // Immediately set all reels to their final positions
    for (let c = 0; c < reels; c++) {
      const rc = reelContainersRef.current[c];
      if (!rc) continue;

      // Remove blur filter immediately
      const blurFilter = blurFiltersRef.current.get(rc);
      if (blurFilter) {
        blurFilter.blur = 0;
        if (rc.filters) {
          rc.filters = rc.filters.filter(f => f !== blurFilter);
        }
        blurFiltersRef.current.delete(rc);
      }

      // Remove glow effects immediately
      const glow = glowEffectsRef.current.get(rc);
      if (glow && glow.parent) {
        glow.parent.removeChild(glow);
        glow.destroy();
        glowEffectsRef.current.delete(rc);
      }

      // Get final symbols for this reel
      const reelSymbols = finalGrid && finalGrid[c] ? finalGrid[c] : undefined;
      // Render final symbols using renderReelFinal (same as normal completion)
      renderReelFinal(c, reelSymbols, rc, metrics);

      // Reset scale and position
      rc.scale.set(1, 1);
      rc.x = offsetX + c * spacingX;
      rc.y = offsetY;
    }

    // Reset screen shake
    screenShakeRef.current = { x: 0, y: 0 };

    // Mark that spin just completed
    spinJustCompletedRef.current = true;

    // Immediately process spin completion (calculate wins, show results)
    handleSpinComplete();
  }, [isSpinning, reels, rows, computeResponsiveMetrics, currentGrid]);

  // Store quickStop in ref so it can be called from onSpin
  useEffect(() => {
    quickStopRef.current = quickStop;
  }, [quickStop]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setRenderSize({ width: rect.width, height: rect.height });
    };

    // Initial size update
    updateSize();

    // Listen to window resize events
    window.addEventListener("resize", updateSize);

    // Use ResizeObserver to detect container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            setRenderSize({ width, height });
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateSize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const checkWebGLSupport = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          return {
            supported: false,
            reason: 'WebGL context not available',
            details: 'Browser does not support WebGL or it has been disabled'
          };
        }
        return { supported: true, gl };
      } catch (e) {
        return {
          supported: false,
          reason: 'WebGL check failed',
          details: String(e)
        };
      }
    };

    const webglCheck = checkWebGLSupport();
    if (!webglCheck.supported) {
      console.warn('⚠️ WebGL Diagnostic:', {
        reason: webglCheck.reason,
        details: webglCheck.details,
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as any).deviceMemory || 'unknown',
        possibleCauses: [
          'Hardware acceleration disabled in browser settings',
          'Graphics driver issue or outdated driver',
          'Browser extension blocking WebGL',
          'Antivirus/security software blocking WebGL',
          'Multiple GPU-intensive applications running',
          'Windows update affecting graphics drivers'
        ]
      });
    }

    const initApp = async () => {
      // Create application
      const app = new PIXI.Application();

      try {
        await app.init({
          background: '#000000',
          backgroundAlpha: 0,
          resizeTo: containerRef.current || window,
          autoDensity: true,
          resolution: window.devicePixelRatio || 1,
          preference: 'webgl'
        });
      } catch (error) {
        console.warn('⚠️ WebGL init failed, falling back to Canvas', error);
        // Fallback strategies if needed, but in v8 init handles things. 
        // Force canvas via preference if needed:
        try {
          // Re-create app for clean retry
          // Note: app.init can be called only once.
          // If it failed, we might need a new instance or different config.
          // For now, let's assume default init works or propagates error.
          console.error('Failed to init PIXI app', error);
          return;
        } catch (e) {
          return;
        }
      }

      if (!containerRef.current) {
        app.destroy();
        return;
      }

      // Add canvas to DOM
      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      // Preload textures asynchronously
      try {
        await preloadTextures();
      } catch (e) {
        console.error(e);
      }

      const reelContainers: PIXI.Container[] = [];
      const reelMasks: PIXI.Graphics[] = [];
      const metrics = computeResponsiveMetrics();

      for (let c = 0; c < reels; c++) {
        const rc = new PIXI.Container();
        reelContainers.push(rc);
        app.stage.addChild(rc);

        // Create a mask to clip sprites to visible rows only
        // Position mask at container's future position, but don't add as child
        const mask = new PIXI.Graphics();
        mask.rect(metrics.offsetX + c * metrics.spacingX, metrics.offsetY, metrics.size, rows * metrics.spacingY);
        mask.fill(0xffffff);
        app.stage.addChild(mask);
        rc.mask = mask;
        mask.visible = false; // Hide the mask graphics itself
        reelMasks.push(mask);

        // Always create enough symbol containers for smooth scrolling (rows + 2 extra for wrapping)
        const symbolCount = rows + 2;
        for (let r = 0; r < symbolCount; r++) {
          // Each symbol has its own container
          const symbolContainer = new PIXI.Container();
          const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
          symbolContainer.addChild(sprite);
          rc.addChild(symbolContainer);
        }
      }
      reelContainersRef.current = reelContainers;
      reelMasksRef.current = reelMasks;

      renderGrid();

      // Initialize background if available (now using CSS background on main div, not PIXI)
      const initialBackground = config.background?.backgroundImage || getBackgroundForMode();
      if (initialBackground) {
        setTimeout(() => {
          const adjustments = {
            position: config.backgroundPosition || { x: 0, y: 0 },
            scale: config.backgroundScale || 100,
            fit: (config.backgroundFit || 'cover') as 'cover' | 'contain' | 'fill' | 'scale-down'
          };
          // Set state for CSS background (no longer using PIXI background sprite)
          setBackgroundUrl(initialBackground);
          setBackgroundAdjustments(adjustments);
        }, 100);
      }
    };

    initApp();

    return () => {
      // Kill any ongoing GSAP timelines
      spinTimelinesRef.current.forEach(tl => {
        if (tl) tl.kill();
      });
      spinTimelinesRef.current = [];

      // Cancel any ongoing animation frame (legacy cleanup)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      // Reset spinning state if component unmounts during spin
      if (isSpinning) {
        setIsSpinning(false);
      }

      // Clear spin metadata
      spinMetaRef.current = null;

      // Clean up win lines
      clearWinLines();

      // Clean up symbol grid backgrounds
      symbolGridBackgroundsRef.current.forEach(bg => {
        if (bg && !bg.destroyed && bg.parent) {
          bg.parent.removeChild(bg);
          bg.destroy({ children: true });
        }
      });
      symbolGridBackgroundsRef.current = [];

      // Kill all GSAP animations
      gsap.killTweensOf('*');

      // Visual polish: Clean up blur filters
      blurFiltersRef.current.forEach((filter, container) => {
        if (container.filters) {
          container.filters = container.filters.filter(f => f !== filter);
        }
      });
      blurFiltersRef.current.clear();

      // Clean up glow effects
      glowEffectsRef.current.forEach((glow) => {
        if (glow && !glow.destroyed && glow.parent) {
          glow.parent.removeChild(glow);
          glow.destroy();
        }
      });
      glowEffectsRef.current.clear();

      // Clean up background mask
      if (backgroundSpriteRef.current?.mask) {
        const mask = backgroundSpriteRef.current.mask as PIXI.Graphics;
        if (mask.parent) {
          mask.parent.removeChild(mask);
        }
        mask.destroy();
      }

      // Clean up frames
      if (outerFrameSpriteRef.current) {
        if (outerFrameSpriteRef.current.parent) {
          outerFrameSpriteRef.current.parent.removeChild(outerFrameSpriteRef.current);
        }
        outerFrameSpriteRef.current.destroy();
        outerFrameSpriteRef.current = null;
      }

      reelDividerSpritesRef.current.forEach(divider => {
        if (divider && !divider.destroyed && divider.parent) {
          divider.parent.removeChild(divider);
          divider.destroy();
        }
      });
      reelDividerSpritesRef.current = [];

      // Clean up masks
      reelMasksRef.current.forEach(mask => {
        if (mask && mask.parent) {
          mask.parent.removeChild(mask);
          mask.destroy();
        }
      });
      reelMasksRef.current = [];

      // Clean up symbol animations
      cleanupSymbolAnimations();

      if (appRef.current) {
        appRef.current.destroy({ removeView: true }, { children: true });
        appRef.current = null;
      }
    };
  }, [symbols, reels, rows, clearWinLines, cleanupSymbolAnimations]);

  // Regenerate grid when dimensions change
  useEffect(() => {
    // Check if currentGrid dimensions don't match current reels/rows
    const currentReels = config.reels?.layout?.reels ?? 5;
    const currentRows = config.reels?.layout?.rows ?? 3;

    if (!currentGrid || currentGrid.length !== currentReels ||
      (currentGrid[0] && currentGrid[0].length !== currentRows)) {
      // Grid dimensions don't match, regenerate
      // Exclude scatter if in free spin mode with retriggers disabled
      const availableKeys = isInFreeSpinMode && config.bonus?.freeSpins?.retriggers === false
        ? Object.keys(symbols).filter(key => key !== 'scatter')
        : Object.keys(symbols);
      const newGrid = Array.from({ length: currentReels }, () =>
        Array.from({ length: currentRows }, () => {
          return availableKeys.length > 0 ? availableKeys[Math.floor(Math.random() * availableKeys.length)] : 'low1';
        })
      );
      setCurrentGrid(newGrid);
    }
  }, [reels, rows, config.reels?.layout?.reels, config.reels?.layout?.rows, symbols]);

  // Watch for symbol changes in config and reload textures
  const previousSymbolsRef = useRef<string>('');
  useEffect(() => {
    const currentSymbols = config.theme?.generated?.symbols;
    if (!currentSymbols || Object.keys(currentSymbols).length === 0) {
      // Initialize ref on first render if no symbols
      if (previousSymbolsRef.current === '') {
        previousSymbolsRef.current = '{}';
      }
      return;
    }

    // Serialize current symbols to compare
    const currentSymbolsStr = JSON.stringify(currentSymbols);

    // Check if symbols have actually changed
    if (currentSymbolsStr !== previousSymbolsRef.current) {
      previousSymbolsRef.current = currentSymbolsStr;
      // Reload textures when symbols change
      preloadTextures().then(() => {
        // Re-render grid after textures are loaded
        if (appRef.current) {
          renderGrid();
        }
      }).catch(error => {
        console.error('[SlotMachine] Error reloading textures:', error);
      });
    }
  }, [config.theme?.generated?.symbols, preloadTextures]);

  useEffect(() => {
    renderGrid();
    // Background is now handled via CSS on main div, no need to update PIXI background
  }, [currentGrid, renderSize, gridAdjustments, frameConfig, maskControls, isSpinning]);

  // Recalculate grid position when UI button adjustments change (to recenter symbols)
  useEffect(() => {
    if (appRef.current) {
      renderGrid();
    }
  }, [uiButtonAdjustments.scale, uiButtonAdjustments.buttonScales]);

  // REMOVED: Config sync for uiButtonAdjustments to prevent race condition
  // State is initialized from config once, then only updated via events

  // Update mask controls when reel count changes
  useEffect(() => {
    const currentReels = config.reels?.layout?.reels ?? 5;
    setMaskControls(prev => ({
      ...prev,
      perReelEnabled: Array(currentReels).fill(true) as boolean[]
    }));
  }, [config.reels?.layout?.reels]);

  // Force resize check when sidebar state changes (backup to ResizeObserver)
  useEffect(() => {
    // Small delay to allow sidebar animation to complete
    const timeoutId = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setRenderSize({ width: rect.width, height: rect.height });
        }
      }
    }, 350); // Slightly longer than sidebar animation duration (300ms)

    return () => clearTimeout(timeoutId);
  }, [isSidebarCollapsed]);

  // Detect device type changes
  useEffect(() => {
    const handleResize = () => {
      setCurrentDevice(getCurrentDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate win tier based on bet and win amounts
  const calculateWinTier = useCallback((betAmount: number, winAmount: number): 'small' | 'big' | 'mega' | 'super' => {
    if (winAmount === 0) return 'small';

    const multiplier = winAmount / betAmount;

    // Get thresholds from config or use defaults (industry standard)
    const thresholds = config.winMultiplierThresholds || {
      smallWin: 1,
      bigWin: 5,
      megaWin: 25,
      superWin: 100
    };

    console.log('[SlotMachine] Calculating win tier:', {
      betAmount,
      winAmount,
      multiplier: multiplier.toFixed(2) + 'x',
      thresholds,
      hasConfigThresholds: !!config.winMultiplierThresholds
    });

    let tier: 'small' | 'big' | 'mega' | 'super' = 'small';
    if (multiplier >= thresholds.superWin) {
      tier = 'super';
    } else if (multiplier >= thresholds.megaWin) {
      tier = 'mega';
    } else if (multiplier >= thresholds.bigWin) {
      tier = 'big';
    } else {
      tier = 'small';
    }

    console.log('[SlotMachine] Win tier result:', tier);
    return tier;
  }, [config.winMultiplierThresholds]);

  // Helper function to clean malformed data URLs
  const cleanDataUrl = useCallback((url: string): string => {
    if (!url) return url;
    let cleanedUrl = url;
    cleanedUrl = cleanedUrl.replace(/^data:image\/png;base64,data:image\/png;base64,/, 'data:image/png;base64,');
    cleanedUrl = cleanedUrl.replace(/^data:image\/jpeg;base64,data:image\/jpeg;base64,/, 'data:image/jpeg;base64,');
    cleanedUrl = cleanedUrl.replace(/^data:([^,]+),data:([^,]+),/, 'data:$1,');
    return cleanedUrl;
  }, []);

  // Get fallback emoji for custom particles based on name
  const getCustomParticleFallback = useCallback((name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('coin') || lowerName.includes('gold')) return '💰';
    if (lowerName.includes('silver') || lowerName.includes('bar')) return '🥈';
    if (lowerName.includes('diamond') || lowerName.includes('gem')) return '💎';
    if (lowerName.includes('star')) return '⭐';
    if (lowerName.includes('lightning') || lowerName.includes('bolt')) return '⚡';
    if (lowerName.includes('confetti') || lowerName.includes('party')) return '🎊';
    if (lowerName.includes('fire') || lowerName.includes('flame')) return '🔥';
    if (lowerName.includes('crystal')) return '🔮';
    if (lowerName.includes('ruby') || lowerName.includes('red')) return '🔴';
    if (lowerName.includes('emerald') || lowerName.includes('green')) return '🟢';
    if (lowerName.includes('sapphire') || lowerName.includes('blue')) return '🔵';
    return '✨';
  }, []);

  // Get particle types for each win tier
  const getParticleTypesForTier = useCallback((tier: 'small' | 'big' | 'mega' | 'super'): Array<{ url?: string, fallback: string, config?: any }> => {
    const particleConfigs = config.particleConfigs || {};
    const particleUrls = config.generatedAssets?.particles || {};

    // Get all particles assigned to this tier
    const tierParticles: Array<{ url?: string, fallback: string, config?: any }> = [];

    Object.entries(particleConfigs).forEach(([particleId, particleConfig]: [string, any]) => {
      if (particleConfig.winTiers && Array.isArray(particleConfig.winTiers) && particleConfig.winTiers.includes(tier)) {
        const particleUrl = particleUrls[particleId];
        const particleType = particleConfig.type || 'coins';

        let fallback = '💰';
        if (particleType === 'coins') fallback = '💰';
        else if (particleType === 'gems') fallback = '💎';
        else if (particleType === 'stars') fallback = '⭐';
        else if (particleType === 'lightning') fallback = '⚡';
        else if (particleType === 'confetti') fallback = '🎊';
        else if (particleType === 'custom') fallback = getCustomParticleFallback(particleConfig.name || 'particle');

        tierParticles.push({
          url: particleUrl ? cleanDataUrl(particleUrl) : undefined,
          fallback,
          config: particleConfig
        });
      }
    });

    // If we have particles assigned to this tier, use them
    if (tierParticles.length > 0) {
      return tierParticles;
    }

    // If no particles are assigned, fall back to default emoji icons
    switch (tier) {
      case 'small':
        return [{ fallback: '💰' }];
      case 'big':
        return [{ fallback: '💰' }];
      case 'mega':
        return [{ fallback: '💰' }, { fallback: '⭐' }];
      case 'super':
        return [{ fallback: '💰' }, { fallback: '⭐' }, { fallback: '💎' }];
      default:
        return [{ fallback: '💰' }];
    }
  }, [config.particleConfigs, config.generatedAssets?.particles, cleanDataUrl, getCustomParticleFallback]);

  // Create fountain particle with realistic physics
  const createFountainParticle = useCallback((
    overlay: HTMLElement,
    _tier: 'small' | 'big' | 'mega' | 'super',
    particleTypes: Array<{ url?: string, fallback: string, config?: any }>,
    duration: number
  ) => {
    const particle = document.createElement('div');
    const selectedParticle = particleTypes[Math.floor(Math.random() * particleTypes.length)];

    // Get particle configuration for celebration effects
    const particleConfig = selectedParticle.config;
    const sizeMultiplier = (particleConfig?.celebrationSize || 100) / 100;
    const spreadMultiplier = (particleConfig?.fountainSpread || 100) / 100;
    const speedMultiplier = (particleConfig?.particleSpeed || 100) / 100;
    const heightMultiplier = (particleConfig?.fountainHeight || 100) / 100;
    const windEffect = (particleConfig?.windEffect || 0) / 100;

    // Advanced fountain pattern logic
    const pattern = particleConfig?.fountainPattern || 'classic-3';
    const leftAngle = particleConfig?.leftAngle || -45;
    const rightAngle = particleConfig?.rightAngle || 45;
    const centerWeight = (particleConfig?.centerWeight || 50) / 100;

    let horizontalVelocity: number;
    let baseVerticalVelocity: number | undefined = undefined;

    // Determine direction based on fountain pattern
    switch (pattern) {
      case 'classic-3':
        const direction3 = [-1, 0, 1][Math.floor(Math.random() * 3)];
        horizontalVelocity = direction3 * (50 + Math.random() * 50) * spreadMultiplier;
        break;
      case 'fan-5':
        const directions5 = [-2, -1, 0, 1, 2];
        const direction5 = directions5[Math.floor(Math.random() * 5)];
        horizontalVelocity = direction5 * (40 + Math.random() * 30) * spreadMultiplier;
        break;
      case 'wide-7':
        const directions7 = [-3, -2, -1, 0, 1, 2, 3];
        const direction7 = directions7[Math.floor(Math.random() * 7)];
        horizontalVelocity = direction7 * (35 + Math.random() * 25) * spreadMultiplier;
        break;
      case 'single-vertical':
        horizontalVelocity = 0;
        break;
      case 'dual-side':
        const sideDirs = [-1, 1];
        const sideDir = sideDirs[Math.floor(Math.random() * 2)];
        horizontalVelocity = sideDir * (60 + Math.random() * 40) * spreadMultiplier;
        break;
      case 'random-burst':
        const randomAngle = Math.random() * 360 * (Math.PI / 180);
        const randomSpeed = 30 + Math.random() * 70;
        horizontalVelocity = Math.cos(randomAngle) * randomSpeed * spreadMultiplier;
        baseVerticalVelocity = -Math.abs(Math.sin(randomAngle)) * randomSpeed * heightMultiplier * speedMultiplier;
        break;
      case 'cascading':
        if (Math.random() < centerWeight) {
          horizontalVelocity = (Math.random() - 0.5) * 20 * spreadMultiplier;
        } else {
          const useLeft = Math.random() < 0.5;
          const angle = useLeft ? leftAngle : rightAngle;
          const angleRad = angle * (Math.PI / 180);
          const speed = 50 + Math.random() * 50;
          horizontalVelocity = Math.sin(angleRad) * speed * spreadMultiplier;
        }
        break;
      default:
        const directionDefault = [-1, 0, 1][Math.floor(Math.random() * 3)];
        horizontalVelocity = directionDefault * (50 + Math.random() * 50) * spreadMultiplier;
    }

    // Set vertical velocity if not already set by pattern
    if (baseVerticalVelocity === undefined) {
      baseVerticalVelocity = -(120 + Math.random() * 80) * heightMultiplier;
    }

    const verticalVelocity = baseVerticalVelocity * speedMultiplier;
    const gravity = 300 * speedMultiplier;

    // Create particle content - use generated image if available, otherwise fallback to emoji
    const finalSize = Math.round(32 * sizeMultiplier);

    if (selectedParticle.url) {
      const img = document.createElement('img');
      img.src = selectedParticle.url;
      img.style.cssText = `
        width: ${finalSize}px;
        height: ${finalSize}px;
        object-fit: contain;
        display: block;
      `;
      img.onerror = () => {
        particle.innerHTML = '';
        particle.textContent = selectedParticle.fallback;
        particle.style.fontSize = `${finalSize}px`;
      };
      particle.appendChild(img);
    } else {
      particle.textContent = selectedParticle.fallback;
      particle.style.fontSize = `${finalSize}px`;
    }

    particle.style.cssText = `
      position: absolute;
      top: 60%;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 98;
      user-select: none;
    `;

    overlay.appendChild(particle);

    // Physics-based animation
    const animationDuration = duration * 0.8;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = elapsed / (animationDuration / 1000);

      if (progress >= 1) {
        particle.remove();
        return;
      }

      // Calculate position using physics with wind effect
      const windDrift = windEffect * elapsed * 30;
      const x = horizontalVelocity * elapsed + windDrift;
      const y = verticalVelocity * elapsed + 0.5 * gravity * elapsed * elapsed;

      // Apply position and fade out over time
      const opacity = Math.max(0, 1 - progress);
      particle.style.transform = `translate(${x - particle.offsetWidth / 2}px, ${y}px)`;
      particle.style.opacity = opacity.toString();

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  // Trigger particle effects for a win tier
  const triggerParticleEffects = useCallback((tier: 'small' | 'big' | 'mega' | 'super') => {
    if (!containerRef.current) return;

    // Get win effects from config
    const winAnimations = config.winAnimations || {};
    const effects = winAnimations[tier] || {
      particles: tier === 'small' ? 30 : tier === 'big' ? 80 : tier === 'mega' ? 150 : 250,
      duration: tier === 'small' ? 1.5 : tier === 'big' ? 2.5 : tier === 'mega' ? 4.0 : 6.0,
      intensity: tier === 'small' ? 3 : tier === 'big' ? 6 : tier === 'mega' ? 8 : 10
    };

    // Create or get particle overlay
    let overlay = particleOverlayRef.current;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'win-particle-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 99;
        overflow: hidden;
      `;
      containerRef.current.appendChild(overlay);
      particleOverlayRef.current = overlay;
    }

    // Get particle types for this tier
    const particleTypes = getParticleTypesForTier(tier);
    const fountainDuration = effects.duration * 1000;

    // Calculate independent contributions from each particle type
    const particleContributions: Array<{ type: typeof particleTypes[0], count: number }> = [];
    let totalParticleCount = 0;

    if (particleTypes.length > 0 && particleTypes[0].config) {
      // Generated particles with individual density settings
      particleTypes.forEach(particleType => {
        const baseDensity = effects.particles / particleTypes.length;
        const densityMultiplier = (particleType.config?.particleDensity || 100) / 100;
        const individualCount = Math.round(baseDensity * densityMultiplier);

        particleContributions.push({
          type: particleType,
          count: individualCount
        });
        totalParticleCount += individualCount;
      });
    } else {
      // Fallback emoji particles - use base count
      particleContributions.push({
        type: particleTypes[0],
        count: effects.particles
      });
      totalParticleCount = effects.particles;
    }

    // Cap total particles for performance (max 1000)
    const maxParticles = 1000;
    if (totalParticleCount > maxParticles) {
      const scaleFactor = maxParticles / totalParticleCount;
      particleContributions.forEach(contribution => {
        contribution.count = Math.round(contribution.count * scaleFactor);
      });
      totalParticleCount = particleContributions.reduce((sum, contrib) => sum + contrib.count, 0);
    }

    // Create particles with individual timing
    let particleIndex = 0;
    particleContributions.forEach(contribution => {
      for (let i = 0; i < contribution.count; i++) {
        setTimeout(() => {
          createFountainParticle(overlay!, tier, particleTypes, fountainDuration);
        }, particleIndex * 100);
        particleIndex++;
      }
    });

    // Cleanup overlay after animation duration
    setTimeout(() => {
      if (overlay && overlay.parentNode) {
        overlay.remove();
        particleOverlayRef.current = null;
      }
    }, fountainDuration);
  }, [config.winAnimations, getParticleTypesForTier, createFountainParticle]);

  // Animate win amount counting from 0 to final amount (only for big, mega, and super wins)
  useEffect(() => {
    if (winAmount > 0 && showWinDisplay) {
      // Calculate win tier
      const winTier = calculateWinTier(betAmount, winAmount);

      // For small wins, display final amount immediately without animation
      if (winTier === 'small') {
        setAnimatedWinAmount(winAmount);
        // Kill any existing animation
        if (winAmountAnimationRef.current) {
          winAmountAnimationRef.current.kill();
          winAmountAnimationRef.current = null;
        }
        return;
      }

      // For big, mega, and super wins, animate from 0 to final amount
      // Reset animated amount to 0 when new win is shown
      setAnimatedWinAmount(0);

      // Kill any existing animation
      if (winAmountAnimationRef.current) {
        winAmountAnimationRef.current.kill();
        winAmountAnimationRef.current = null;
      }

      // Calculate animation duration based on win amount (longer for bigger wins)
      // Minimum 1 second, maximum 3 seconds
      const duration = Math.min(3, Math.max(1, winAmount / 1000));

      // Animate from 0 to winAmount
      const animationTarget = { value: 0 };
      const timeline = gsap.to(animationTarget, {
        value: winAmount,
        duration: duration,
        ease: 'power2.out',
        onUpdate: () => {
          setAnimatedWinAmount(Math.floor(animationTarget.value));
        },
        onComplete: () => {
          // Ensure final value is set
          setAnimatedWinAmount(winAmount);
          winAmountAnimationRef.current = null;
        }
      });

      winAmountAnimationRef.current = timeline;

      return () => {
        if (timeline) {
          timeline.kill();
        }
        winAmountAnimationRef.current = null;
      };
    } else {
      // Reset when win display is hidden
      setAnimatedWinAmount(0);
      if (winAmountAnimationRef.current) {
        winAmountAnimationRef.current.kill();
        winAmountAnimationRef.current = null;
      }
    }
  }, [winAmount, showWinDisplay, betAmount, calculateWinTier]);

  // Reset win title state when win display is hidden
  useEffect(() => {
    if (!showWinDisplay && !showWinTitle) {
      // When win UI is fully closed, also clear any symbol/overlay animations
      setCurrentWinTier('small');
      cleanupSymbolAnimations();
    }
  }, [showWinDisplay, showWinTitle, cleanupSymbolAnimations]);

  // Update frame config from store when it changes
  useEffect(() => {
    setFrameConfig(prev => ({
      framePath: (config as any).frame || prev.framePath,
      frameStyle: (config as any).frameStyle || prev.frameStyle,
      framePosition: (config as any).framePosition || prev.framePosition,
      frameScale: (config as any).frameScale || prev.frameScale,
      frameStretch: (config as any).frameStretch || prev.frameStretch,
      reelGap: (config as any).reelGap || prev.reelGap,
      reelDividerPosition: (config as any).reelDividerPosition || prev.reelDividerPosition,
      reelDividerStretch: (config as any).reelDividerStretch || prev.reelDividerStretch,
      aiReelImage: (config as any).aiReelImage || prev.aiReelImage
    }));
  }, [(config as any).frame, (config as any).frameStyle, (config as any).framePosition, (config as any).frameScale, (config as any).frameStretch, (config as any).reelGap, (config as any).reelDividerPosition, (config as any).reelDividerStretch, (config as any).aiReelImage]);

  // Update logo from config when it changes
  useEffect(() => {
    if ((config as any).logo) {
      setLogoUrl((config as any).logo);
    }
    if ((config as any).logoPositions) {
      // Convert old pixel values to percentages if needed
      const convertToPercentage = (pos: { x: number; y: number } | undefined, defaultPos: { x: number; y: number }) => {
        if (!pos) return defaultPos;
        // If values are in pixel range (negative or > 100), they're old pixel values - convert to center
        if (pos.x < 0 || pos.x > 100 || pos.y < 0 || pos.y > 100) {
          return defaultPos; // Return default percentage position
        }
        return pos; // Already in percentage format
      };

      const defaultDesktop = { x: 50, y: 10 };
      const defaultMobilePortrait = { x: 50, y: 10 };
      const defaultMobileLandscape = { x: 50, y: 10 };

      setLogoPositions({
        desktop: convertToPercentage((config as any).logoPositions.desktop, defaultDesktop),
        mobilePortrait: convertToPercentage((config as any).logoPositions.mobilePortrait, defaultMobilePortrait),
        mobileLandscape: convertToPercentage((config as any).logoPositions.mobileLandscape, defaultMobileLandscape)
      });
    }
    if ((config as any).logoScales) {
      setLogoScales({
        desktop: (config as any).logoScales.desktop || 100,
        mobilePortrait: (config as any).logoScales.mobilePortrait || 100,
        mobileLandscape: (config as any).logoScales.mobileLandscape || 100
      });
    }
  }, [(config as any).logo, (config as any).logoPositions, (config as any).logoScales]);

  // Update win display config when it changes
  useEffect(() => {
    setWinDisplayConfig({
      positions: (config as any).winDisplayPositions || {
        desktop: { x: 50, y: 20 },
        mobilePortrait: { x: 50, y: 20 },
        mobileLandscape: { x: 50, y: 20 }
      },
      scales: (config as any).winDisplayScales || {
        desktop: 80,
        mobilePortrait: 80,
        mobileLandscape: 80
      }
    });
  }, [(config as any).winDisplayPositions, (config as any).winDisplayScales]);

  // Listen for background updates from Step4_GameAssets
  useEffect(() => {
    const handleBackgroundUpdated = (event: CustomEvent) => {
      const { backgroundUrl: url, position, scale, fit } = event.detail;

      if (url) {
        setBackgroundUrl(url);
        const adjustments = {
          position: position || { x: 0, y: 0 },
          scale: scale || 100,
          fit: (fit || 'cover') as 'cover' | 'contain' | 'fill' | 'scale-down'
        };
        setBackgroundAdjustments(adjustments);
        // Background is now handled via CSS on main div, no PIXI update needed

        // Force a resize recalculation to prevent symbol position shifts
        setTimeout(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              setRenderSize({ width: rect.width, height: rect.height });
            }
          }
        }, 50);
      }
    };

    const handleBackgroundAdjustmentsUpdated = (event: CustomEvent) => {
      const { position, scale, fit, backgroundUrl: url } = event.detail;

      const adjustments = {
        position: position || backgroundAdjustments.position,
        scale: scale ?? backgroundAdjustments.scale,
        fit: (fit || backgroundAdjustments.fit) as 'cover' | 'contain' | 'fill' | 'scale-down'
      };
      setBackgroundAdjustments(adjustments);

      // Update background URL if provided
      if (url) {
        setBackgroundUrl(url);
      }
      // Background is now handled via CSS on main div, no PIXI update needed
    };

    const handleUIButtonAdjustmentsUpdated = (event: CustomEvent) => {
      const { position, scale, buttonScales, buttonPositions, visibility } = event.detail;
      setUiButtonAdjustments({
        position: position || uiButtonAdjustments.position,
        scale: scale ?? uiButtonAdjustments.scale,
        buttonScales: buttonScales || uiButtonAdjustments.buttonScales,
        buttonPositions: buttonPositions || uiButtonAdjustments.buttonPositions,
        visibility: visibility !== undefined ? visibility : uiButtonAdjustments.visibility
      });
    };

    const handleLogoUpdated = (event: CustomEvent) => {
      const { logoUrl: url } = event.detail;
      if (url) {
        setLogoUrl(url);
      }
    };

    const handleLogoPositionChanged = (event: CustomEvent) => {
      const { position, device } = event.detail;
      if (device && position) {
        setLogoPositions(prev => ({
          ...prev,
          [device]: position
        }));
      }
    };

    const handleLogoScaleChanged = (event: CustomEvent) => {
      const { scale, device } = event.detail;
      if (device && scale !== undefined) {
        setLogoScales(prev => ({
          ...prev,
          [device]: scale
        }));
      }
    };

    const handleGridAdjustmentsUpdated = (event: CustomEvent) => {
      const { position, scale, stretch, showSymbolGrid } = event.detail;
      setGridAdjustments(prev => {
        const newAdjustments = {
          position: position !== undefined ? position : prev.position,
          scale: scale !== undefined ? scale : prev.scale,
          stretch: stretch !== undefined ? stretch : prev.stretch,
          showSymbolGrid: showSymbolGrid !== undefined ? showSymbolGrid : prev.showSymbolGrid
        };
        return newAdjustments;
      });
      // Grid will re-render automatically via useEffect dependency on gridAdjustments
    };

    const handleFrameUpdated = (event: CustomEvent) => {
      const { frameUrl, frameStyle } = event.detail;
      setFrameConfig(prev => ({
        ...prev,
        framePath: frameUrl !== undefined ? (frameUrl || null) : prev.framePath,
        frameStyle: frameStyle !== undefined ? frameStyle : prev.frameStyle
      }));
      // Frames will re-render when frameConfig changes
    };

    const handleFrameAdjustmentsUpdated = (event: CustomEvent) => {
      const { position, scale, stretch } = event.detail;
      setFrameConfig(prev => ({
        ...prev,
        framePosition: position !== undefined ? position : prev.framePosition,
        frameScale: scale !== undefined ? scale : prev.frameScale,
        frameStretch: stretch !== undefined ? stretch : prev.frameStretch
      }));
      // Frames will re-render when frameConfig changes
    };

    const handleReelGapAdjustmentsUpdated = (event: CustomEvent) => {
      const { gap, position, stretch } = event.detail;
      setFrameConfig(prev => ({
        ...prev,
        reelGap: gap !== undefined ? gap : prev.reelGap,
        reelDividerPosition: position !== undefined ? position : prev.reelDividerPosition,
        reelDividerStretch: stretch !== undefined ? stretch : prev.reelDividerStretch
      }));
      // Reel dividers will re-render when frameConfig changes
    };

    const handleAIReelImageUpdated = (event: CustomEvent) => {
      const { aiReelImage, frameStyle } = event.detail;
      setFrameConfig(prev => ({
        ...prev,
        aiReelImage: aiReelImage !== undefined ? (aiReelImage || null) : prev.aiReelImage,
        frameStyle: frameStyle !== undefined ? frameStyle : prev.frameStyle
      }));
      // Reel dividers will re-render when frameConfig changes
    };

    const handleAnimationSettingsChanged = (event: CustomEvent) => {
      const { settings } = event.detail;
      if (settings) {
        setAnimationSettings(prev => ({
          speed: settings.speed !== undefined ? settings.speed : prev.speed,
          blurIntensity: settings.blurIntensity !== undefined ? settings.blurIntensity : prev.blurIntensity,
          easing: settings.easing !== undefined ? settings.easing : prev.easing,
          visualEffects: settings.visualEffects ? { ...prev.visualEffects, ...settings.visualEffects } : prev.visualEffects
        }));
      }
    };

    const handleApplyMaskControls = (event: CustomEvent) => {
      const { controls } = event.detail;
      if (controls) {
        setMaskControls(prev => ({
          enabled: controls.enabled !== undefined ? controls.enabled : prev.enabled,
          debugVisible: controls.debugVisible !== undefined ? controls.debugVisible : prev.debugVisible,
          perReelEnabled: controls.perReelEnabled ? [...controls.perReelEnabled] : prev.perReelEnabled
        }));
      }
    };

    const handleSlotSpin = () => {
      if (!isSpinning) {
        onSpin();
      }
    };

    const handleSymbolsChanged = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      // Force reload textures when symbols change
      try {
        // Wait a bit to ensure config and SymbolPreloader have updated
        await new Promise(resolve => setTimeout(resolve, 200));

        // Get the latest symbols directly from config (not from closure)
        const latestConfig = useGameStore.getState().config;
        const latestSymbolsRaw = latestConfig?.theme?.generated?.symbols;
        const latestSymbols: Record<string, string> = (typeof latestSymbolsRaw === 'object' && !Array.isArray(latestSymbolsRaw))
          ? latestSymbolsRaw
          : {};
        if (detail.forceRefresh) {
          console.log('[SlotMachine] Force refresh requested, reloading all textures');
        }

        // Reload textures with latest symbols from config
        await SymbolPreloader.waitForReady();
        const map: Record<string, PIXI.Texture> = {};

        for (const [k, url] of Object.entries(latestSymbols)) {
          if (!url || url === '') {
            continue;
          }
          // For force refresh, always try to load fresh (don't use cache)
          let texture: PIXI.Texture | null = null;

          if (detail.forceRefresh && detail.symbolKey === k) {
            try {
              if (url.startsWith('data:')) {
                texture = await PIXI.Assets.load(url);
              } else {
                texture = await PIXI.Assets.load(url);
              }
            } catch (error) {
              console.error(`[SlotMachine] Failed to force-load symbol ${k}:`, error);
            }
          } else {
            // Try to get from cache first
            texture = SymbolPreloader.getTexture(url) || SymbolPreloader.getTexture(k);
          }

          if (!texture) {
            // Not in cache - wait for it to load or load directly
            texture = await SymbolPreloader.waitForSymbol(url, 10000);

            // If still not loaded, try loading directly
            if (!texture) {
              try {
                let newTexture: PIXI.Texture | null = null;

                if (url.startsWith('data:')) {
                  newTexture = await PIXI.Assets.load(url);
                } else {
                  newTexture = await PIXI.Assets.load(url);
                }

                if (newTexture) {
                  texture = newTexture;
                }
              } catch (error) {
                console.error(`[SlotMachine] Failed to load symbol ${k}:`, error);
              }
            }
          }

          if (texture) {
            map[k] = texture;
          } else {
            // Fallback - try predefined symbol
            const predefinedTexture = SymbolPreloader.getTexture(k);
            if (predefinedTexture) {
              map[k] = predefinedTexture;
            } else {
              console.warn(`⚠️ Symbol ${k} not available, using fallback`);
              map[k] = PIXI.Texture.WHITE;
            }
          }
        }

        // Update textures ref with new textures
        texturesRef.current = map;
        // Force grid re-render to show new symbols
        if (appRef.current) {
          renderGrid();
        }
      } catch (error) {
        console.error('[SlotMachine] Error reloading textures after symbols change:', error);
      }
    };

    window.addEventListener('backgroundUpdated', handleBackgroundUpdated as EventListener);
    window.addEventListener('backgroundAdjustmentsUpdated', handleBackgroundAdjustmentsUpdated as EventListener);
    window.addEventListener('uiButtonAdjustmentsUpdated', handleUIButtonAdjustmentsUpdated as EventListener);
    window.addEventListener('logoUpdated', handleLogoUpdated as EventListener);
    window.addEventListener('logoPositionChanged', handleLogoPositionChanged as EventListener);
    window.addEventListener('logoScaleChanged', handleLogoScaleChanged as EventListener);
    window.addEventListener('gridAdjustmentsUpdated', handleGridAdjustmentsUpdated as EventListener);
    window.addEventListener('frameUpdated', handleFrameUpdated as EventListener);
    window.addEventListener('frameAdjustmentsUpdated', handleFrameAdjustmentsUpdated as EventListener);
    window.addEventListener('reelGapAdjustmentsUpdated', handleReelGapAdjustmentsUpdated as EventListener);
    window.addEventListener('aiReelImageUpdated', handleAIReelImageUpdated as EventListener);
    window.addEventListener('animationSettingsChanged', handleAnimationSettingsChanged as EventListener);
    window.addEventListener('applyMaskControls', handleApplyMaskControls as EventListener);
    window.addEventListener('slotSpin', handleSlotSpin as EventListener);
    window.addEventListener('symbolsChanged', handleSymbolsChanged);

    // Handle freespin transition preview
    const handleFreespinTransition = (event: CustomEvent) => {
      const { direction, style, duration } = event.detail;
      console.log('🎰 Freespin transition preview:', { direction, style, duration });

      // Get the latest config from store to ensure we have the most recent value
      const latestConfig = useGameStore.getState().config;
      const freeSpinCount = latestConfig?.bonus?.freeSpins?.count || 10;
      const transitionStyle = style || (latestConfig as any)?.freespinTransition?.style || 'fade';
      const transitionDuration = duration || (latestConfig as any)?.freespinTransition?.duration || 3;

      console.log('🎰 Free spin count from config:', freeSpinCount);
      console.log('🎰 Transition style:', transitionStyle, 'Duration:', transitionDuration);

      // Apply transition based on direction
      if (direction === 'to-freespin') {
        // Set transition style and duration for announcement
        setAnnouncementTransitionStyle(transitionStyle);
        setAnnouncementTransitionDuration(transitionDuration);

        // Show the announcement (image if available, otherwise custom modal)
        setFreeSpinAwardedCount(freeSpinCount); // Use configured free spin count
        setShowFreeSpinAnnouncement(true);

        // After announcement (using configured duration), apply free spin mode
        setTimeout(() => {
          setShowFreeSpinAnnouncement(false);
          setIsInFreeSpinMode(true);
          setFreeSpinsRemaining(freeSpinCount); // Use configured free spin count
        }, transitionDuration * 1000);
      } else {
        // Transition back to regular mode (no announcement needed)
        setIsInFreeSpinMode(false);
        setFreeSpinsRemaining(0);
      }
    };

    window.addEventListener('previewFreespinTransition', handleFreespinTransition as EventListener);

    // Handle Pick & Click bonus trigger
    const handlePickAndClickTrigger = (event: CustomEvent) => {
      console.log('🎁 Pick & Click bonus trigger received:', event.detail);
      // Trigger with mock data (3 bonus symbols)
      const mockPositions = [
        { reel: 0, row: 1 },
        { reel: 2, row: 1 },
        { reel: 4, row: 1 }
      ];
      triggerPickAndClick(3, mockPositions);
    };

    // Handle Wheel bonus trigger
    const handleWheelTrigger = (event: CustomEvent) => {
      console.log('🎰 Wheel bonus trigger received:', event.detail);
      // Trigger with mock data (3 bonus symbols)
      const mockPositions = [
        { reel: 0, row: 1 },
        { reel: 2, row: 1 },
        { reel: 4, row: 1 }
      ];
      triggerWheelBonus(3, mockPositions);
    };

    // Handle Hold & Spin bonus trigger
    const handleHoldAndSpinTrigger = (event: CustomEvent) => {
      console.log('🔄 Hold & Spin bonus trigger received:', event.detail);
      // For now, we'll show a message that this feature needs to be implemented
      // You can implement the actual trigger logic here
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast('Hold & Spin bonus triggered!', 'success');
      }
      // TODO: Implement hold & spin trigger logic
    };

    // Handle Jackpot win trigger
    const handleJackpotTrigger = (event: CustomEvent) => {
      console.log('💰 Jackpot trigger received:', event.detail);
      const { level } = event.detail;
      const jackpotConfig = config.bonus?.jackpots;
      if (!jackpotConfig?.enabled) return;

      // Calculate jackpot value based on level
      const jackpotValues = jackpotConfig.values || { Mini: 20, Minor: 100, Major: 1000, Grand: 10000 };
      const jackpotMultiplier = jackpotValues[level as keyof typeof jackpotValues] || 100;
      const jackpotAmount = jackpotMultiplier * betAmount;

      // Add to balance and show win
      setBalance(balance + jackpotAmount);
      setWinAmount(jackpotAmount);

      // Show win display
      setShowWinDisplay(true);
      setTimeout(() => {
        setShowWinDisplay(false);
      }, 3500);

      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast(`${level} Jackpot! ${jackpotAmount.toLocaleString()}`, 'success');
      }
    };

    window.addEventListener('previewPickAndClickBonus', handlePickAndClickTrigger as EventListener);
    window.addEventListener('previewWheelBonus', handleWheelTrigger as EventListener);
    window.addEventListener('previewHoldAndSpinBonus', handleHoldAndSpinTrigger as EventListener);
    window.addEventListener('previewJackpotWin', handleJackpotTrigger as EventListener);

    return () => {
      window.removeEventListener('backgroundUpdated', handleBackgroundUpdated as EventListener);
      window.removeEventListener('backgroundAdjustmentsUpdated', handleBackgroundAdjustmentsUpdated as EventListener);
      window.removeEventListener('uiButtonAdjustmentsUpdated', handleUIButtonAdjustmentsUpdated as EventListener);
      window.removeEventListener('logoUpdated', handleLogoUpdated as EventListener);
      window.removeEventListener('logoPositionChanged', handleLogoPositionChanged as EventListener);
      window.removeEventListener('logoScaleChanged', handleLogoScaleChanged as EventListener);
      window.removeEventListener('gridAdjustmentsUpdated', handleGridAdjustmentsUpdated as EventListener);
      window.removeEventListener('previewFreespinTransition', handleFreespinTransition as EventListener);
      window.removeEventListener('previewPickAndClickBonus', handlePickAndClickTrigger as EventListener);
      window.removeEventListener('previewWheelBonus', handleWheelTrigger as EventListener);
      window.removeEventListener('previewHoldAndSpinBonus', handleHoldAndSpinTrigger as EventListener);
      window.removeEventListener('previewJackpotWin', handleJackpotTrigger as EventListener);
      window.removeEventListener('frameUpdated', handleFrameUpdated as EventListener);
      window.removeEventListener('frameAdjustmentsUpdated', handleFrameAdjustmentsUpdated as EventListener);
      window.removeEventListener('reelGapAdjustmentsUpdated', handleReelGapAdjustmentsUpdated as EventListener);
      window.removeEventListener('aiReelImageUpdated', handleAIReelImageUpdated as EventListener);
      window.removeEventListener('animationSettingsChanged', handleAnimationSettingsChanged as EventListener);
      window.removeEventListener('applyMaskControls', handleApplyMaskControls as EventListener);
      window.removeEventListener('slotSpin', handleSlotSpin as EventListener);
      window.removeEventListener('symbolsChanged', handleSymbolsChanged);
    };
  }, [updateBackground, backgroundUrl, backgroundAdjustments, uiButtonAdjustments, isSpinning, preloadTextures, triggerPickAndClick, triggerWheelBonus, betAmount, balance, config.bonus?.jackpots]);

  // Render symbol grid square backgrounds
  const renderSymbolGridBackgrounds = useCallback((metrics: ReturnType<typeof computeResponsiveMetrics>, showSymbolGrid: boolean) => {
    if (!appRef.current) return;

    // Always clear existing backgrounds first - aggressive cleanup
    symbolGridBackgroundsRef.current.forEach(bg => {
      try {
        if (bg && !bg.destroyed) {
          if (bg.parent) {
            bg.parent.removeChild(bg);
          }
          bg.destroy({ children: true });
        }
      } catch (e) {
        // Ignore errors during cleanup
        console.warn('Error cleaning up symbol grid background:', e);
      }
    });
    symbolGridBackgroundsRef.current = [];

    // Only create backgrounds if enabled
    if (!showSymbolGrid) {
      return;
    }

    // Find insertion point (before first reel container)
    let baseInsertIndex = 0;
    if (reelContainersRef.current.length > 0 && reelContainersRef.current[0]?.parent) {
      baseInsertIndex = appRef.current.stage.getChildIndex(reelContainersRef.current[0]);
    }
    if (baseInsertIndex < 0) {
      baseInsertIndex = appRef.current.stage.children.length;
    }

    let currentInsertIndex = baseInsertIndex;
    for (let reel = 0; reel < reels; reel++) {
      for (let row = 0; row < rows; row++) {
        const bg = new PIXI.Graphics();

        bg.beginFill(0x000000, 0.2); // Semi-transparent black
        bg.lineStyle(1, 0xffffff, 0.1); // Subtle white border
        bg.drawRoundedRect(
          metrics.offsetX + reel * metrics.spacingX,
          metrics.offsetY + row * metrics.spacingY,
          metrics.size,
          metrics.size,
          4 // Rounded corners
        );
        bg.endFill();

        // Add to stage at the calculated insertion point
        appRef.current.stage.addChildAt(bg, currentInsertIndex);
        symbolGridBackgroundsRef.current.push(bg);
        // Increment for next background (they'll all stack before reel containers)
        currentInsertIndex++;
      }
    }
  }, [reels, rows]);

  // Render outer frame (border around entire grid)
  const renderOuterFrame = useCallback((metrics: ReturnType<typeof computeResponsiveMetrics>) => {
    if (!appRef.current) return;

    // Remove existing outer frame
    if (outerFrameSpriteRef.current) {
      if (outerFrameSpriteRef.current.parent) {
        outerFrameSpriteRef.current.parent.removeChild(outerFrameSpriteRef.current);
      }
      outerFrameSpriteRef.current.destroy();
      outerFrameSpriteRef.current = null;
    }

    // Only render if frame style includes outer and frame path exists
    if ((frameConfig.frameStyle === 'outer' || frameConfig.frameStyle === 'both') && frameConfig.framePath) {
      try {
        const texture = PIXI.Texture.from(frameConfig.framePath);
        const sprite = new PIXI.Sprite(texture);

        // Calculate grid dimensions
        const gridWidth = reels * metrics.spacingX;
        const gridHeight = rows * metrics.spacingY;
        const gridCenterX = metrics.offsetX + gridWidth / 2;
        const gridCenterY = metrics.offsetY + gridHeight / 2;

        const targetWidth = gridWidth * 1.1;
        const targetHeight = gridHeight * 1.1;

        // Calculate scale to fit grid while maintaining aspect ratio
        const scaleX = targetWidth / texture.width;
        const scaleY = targetHeight / texture.height;
        const baseScale = Math.max(scaleX, scaleY);

        // Apply frame scale adjustment
        const scaleFactor = (frameConfig.frameScale / 100) * baseScale;

        // Apply frame stretch
        const finalWidth = texture.width * scaleFactor * (frameConfig.frameStretch.x / 100);
        const finalHeight = texture.height * scaleFactor * (frameConfig.frameStretch.y / 100);

        sprite.width = finalWidth;
        sprite.height = finalHeight;
        sprite.anchor.set(0.5);

        // Apply frame position
        sprite.x = gridCenterX + frameConfig.framePosition.x;
        sprite.y = gridCenterY + frameConfig.framePosition.y;

        // Add to stage (behind symbols but above background)
        // Find insertion point - after backgrounds, before reel containers
        let insertIndex = 0;
        if (reelContainersRef.current.length > 0 && reelContainersRef.current[0]?.parent) {
          insertIndex = appRef.current.stage.getChildIndex(reelContainersRef.current[0]);
        }
        // Account for symbol grid backgrounds
        insertIndex = Math.max(0, insertIndex - symbolGridBackgroundsRef.current.length);
        appRef.current.stage.addChildAt(sprite, insertIndex);
        outerFrameSpriteRef.current = sprite;
      } catch (error) {
        console.error('Error loading outer frame:', error);
      }
    }
  }, [frameConfig.framePath, frameConfig.frameStyle, frameConfig.framePosition, frameConfig.frameScale, frameConfig.frameStretch, reels, rows]);

  // Render reel dividers (between reels)
  const renderReelDividers = useCallback((metrics: ReturnType<typeof computeResponsiveMetrics>) => {
    if (!appRef.current) return;

    // Remove existing reel divider sprites
    reelDividerSpritesRef.current.forEach(divider => {
      if (divider && !divider.destroyed && divider.parent) {
        divider.parent.removeChild(divider);
        divider.destroy();
      }
    });
    reelDividerSpritesRef.current = [];

    // Only render if frame style includes reel AND AI reel image is available
    // Don't show default dividers - only show when AI reel image exists
    if ((frameConfig.frameStyle === 'reel' || frameConfig.frameStyle === 'both') && frameConfig.aiReelImage) {
      const gridHeight = rows * metrics.spacingY;

      // Calculate divider dimensions
      // reelGap controls the actual spacing between reels (affects spacingX in computeResponsiveMetrics)
      // reelDividerStretch.x controls the width of the divider image itself (independent of gap)
      // Use symbol size as a reference for reasonable divider width, not reelGap
      const baseDividerWidth = metrics.size * 0.08; // Base width as 8% of symbol size (independent of gap)
      const dividerWidth = baseDividerWidth * (frameConfig.reelDividerStretch.x / 100);

      // Base height from grid height, apply stretch
      const dividerHeight = gridHeight * (frameConfig.reelDividerStretch.y / 100);

      // Render dividers between reels (one less than number of reels)
      for (let i = 0; i < reels - 1; i++) {
        let dividerSprite: PIXI.Sprite;

        // Only render if AI reel image is available
        try {
          const texture = PIXI.Texture.from(frameConfig.aiReelImage);
          dividerSprite = new PIXI.Sprite(texture);

          // Scale to fit divider dimensions while maintaining aspect ratio
          const textureAspect = texture.width / texture.height;
          const dividerAspect = dividerWidth / dividerHeight;

          let scaleX: number, scaleY: number;
          if (textureAspect > dividerAspect) {
            // Texture is wider - fit to width
            scaleX = dividerWidth / texture.width;
            scaleY = scaleX; // Maintain aspect ratio
          } else {
            // Texture is taller - fit to height
            scaleY = dividerHeight / texture.height;
            scaleX = scaleY; // Maintain aspect ratio
          }

          dividerSprite.scale.set(scaleX, scaleY);
          dividerSprite.width = dividerWidth;
          dividerSprite.height = dividerHeight;

          // Position divider exactly between two reels
          // Calculate the center point between reel i and reel i+1
          const reelICenterX = metrics.offsetX + i * metrics.spacingX + metrics.size / 2;
          const reelI1CenterX = metrics.offsetX + (i + 1) * metrics.spacingX + metrics.size / 2;
          const dividerCenterX = (reelICenterX + reelI1CenterX) / 2;

          // Y position starts at grid top, with adjustment
          const dividerTopY = metrics.offsetY;

          // Set position with adjustments
          dividerSprite.x = dividerCenterX + frameConfig.reelDividerPosition.x;
          dividerSprite.y = dividerTopY + frameConfig.reelDividerPosition.y;

          // Set anchor for sprite
          dividerSprite.anchor.set(0.5, 0); // Anchor at top center

          // Add to stage (same layer as outer frame)
          let insertIndex = 0;
          if (reelContainersRef.current.length > 0 && reelContainersRef.current[0]?.parent) {
            insertIndex = appRef.current.stage.getChildIndex(reelContainersRef.current[0]);
          }
          insertIndex = Math.max(0, insertIndex - symbolGridBackgroundsRef.current.length);
          if (outerFrameSpriteRef.current && outerFrameSpriteRef.current.parent) {
            const frameIndex = appRef.current.stage.getChildIndex(outerFrameSpriteRef.current);
            insertIndex = Math.max(insertIndex, frameIndex + 1);
          }
          appRef.current.stage.addChildAt(dividerSprite, insertIndex);
          reelDividerSpritesRef.current.push(dividerSprite);
        } catch (error) {
          console.error('Error loading AI reel image:', error);
        }
      }
    }
  }, [frameConfig.frameStyle, frameConfig.reelGap, frameConfig.reelDividerPosition, frameConfig.reelDividerStretch, frameConfig.aiReelImage, reels, rows]);

  function renderGrid() {
    const metrics = computeResponsiveMetrics();

    // Always call renderSymbolGridBackgrounds - it will clear and conditionally create backgrounds
    // This ensures the toggle works correctly
    renderSymbolGridBackgrounds(metrics, gridAdjustments.showSymbolGrid);

    // Render frames (outer frame and/or reel dividers)
    renderOuterFrame(metrics);
    renderReelDividers(metrics);

    for (let c = 0; c < reels; c++) {
      const rc = reelContainersRef.current[c];
      if (!rc) continue;

      // IMPORTANT: Don't reposition reel symbols during spin animation or immediately after
      // The spin animation (renderReelSpinning) handles symbol positioning during spins
      // After spin completes, positions are already correct, so don't overwrite them
      // Only render final positions when not spinning AND spin hasn't just completed
      if (!isSpinning && !spinJustCompletedRef.current) {
        // Safety check: ensure currentGrid has the correct dimensions
        const reelSymbols = currentGrid && currentGrid[c] ? currentGrid[c] : undefined;
        renderReelFinal(c, reelSymbols, rc, metrics);
        rc.x = metrics.offsetX + c * metrics.spacingX;
        rc.y = metrics.offsetY;
      }

      // Update mask position and visibility based on mask controls (always update masks)
      const mask = reelMasksRef.current[c];
      if (mask) {
        const reelEnabled = maskControls.enabled && maskControls.perReelEnabled[c];

        if (reelEnabled) {
          // Show reel - normal mask
          mask.clear();
          if (maskControls.debugVisible) {
            mask.rect(metrics.offsetX + c * metrics.spacingX, metrics.offsetY, metrics.size, rows * metrics.spacingY).fill({ color: 0xff0000, alpha: 0.2 }); // Red overlay for debug
          } else {
            mask.rect(metrics.offsetX + c * metrics.spacingX, metrics.offsetY, metrics.size, rows * metrics.spacingY).fill(0xffffff);
          }
          mask.visible = true;
        } else {
          // Hide reel - make mask transparent
          mask.clear();
          mask.beginFill(0x000000, 0); // Transparent mask
          mask.drawRect(metrics.offsetX + c * metrics.spacingX, metrics.offsetY, metrics.size, rows * metrics.spacingY);
          mask.endFill();
          mask.visible = true;
        }

        // Apply mask to reel container
        rc.mask = mask;
      }

      // Hide/show reel container based on mask controls
      if (maskControls.enabled) {
        rc.visible = maskControls.perReelEnabled[c];
      } else {
        rc.visible = true; // Show all if masking is disabled
      }
    }
  }
  const betValues = [0.25, 0.5, 1, 2, 5, 10, 20, 30, 50, 100, 200, 300, 500];

  // Helper function to get transition animation CSS
  const getTransitionAnimation = (style: 'fade' | 'slide' | 'zoom' | 'dissolve', duration: number) => {
    switch (style) {
      case 'fade':
        return `fadeTransition ${duration}s ease-in-out forwards`;
      case 'slide':
        return `slideInRight ${duration}s ease-in-out forwards`;
      case 'zoom':
        return `zoomIn ${duration}s ease-in-out forwards`;
      case 'dissolve':
        return `dissolveTransition ${duration}s ease-in-out forwards`;
      default:
        return `fadeTransition ${duration}s ease-in-out forwards`;
    }
  };

  // Calculate background style for preview container only

  const getBackgroundStyle = () => {
    // Use free spin background if in free spin mode
    const currentBackground = isInFreeSpinMode
      ? (config.derivedBackgrounds?.freespin || backgroundUrl)
      : backgroundUrl;

    if (!currentBackground) {
      return {
        backgroundColor: '#2B2624'
      };
    }

    const pos = backgroundAdjustments.position;
    const fit = backgroundAdjustments.fit || 'cover';
    const scale = backgroundAdjustments.scale || 100;

    // Map fit values to CSS background-size and apply scale
    let backgroundSize: string = 'cover';

    if (scale !== 100) {
      // When scale is not 100%, use percentage values to apply the scale
      const scalePercent = `${scale}%`;
      if (fit === 'fill') {
        backgroundSize = `${scalePercent} ${scalePercent}`;
      } else {
        // For cover, contain, and scale-down, use single percentage value
        // This will scale the background while maintaining aspect ratio
        backgroundSize = scalePercent;
      }
    } else {
      // When scale is 100%, use the fit value as-is
      if (fit === 'contain') backgroundSize = 'contain';
      else if (fit === 'fill') backgroundSize = '100% 100%';
      else if (fit === 'scale-down') backgroundSize = 'auto';
      else backgroundSize = 'cover'; // default
    }

    return {
      backgroundImage: `url(${currentBackground})`,
      backgroundSize: backgroundSize,
      backgroundPosition: `calc(50% + ${pos.x}px) calc(50% + ${pos.y}px)`,
      backgroundRepeat: 'no-repeat' as const,
      backgroundAttachment: 'local' as const, // Local attachment prevents movement when buttons resize
      width: '100%',
      height: '100%' // Fill the preview container
    };
  };

  // Update background when free spin mode changes
  useEffect(() => {
    if (isInFreeSpinMode && config.derivedBackgrounds?.freespin) {
      setBackgroundUrl(config.derivedBackgrounds.freespin);
    } else if (!isInFreeSpinMode) {
      // Restore normal background
      const normalBackground = config.background?.backgroundImage || getBackgroundForMode();
      if (normalBackground) {
        setBackgroundUrl(normalBackground);
      }
    }
  }, [isInFreeSpinMode, config.derivedBackgrounds?.freespin, config.background?.backgroundImage]);

  // Initialize background music and ambience on mount and when audio files are available
  useEffect(() => {
    if (isSoundEnabled) {
      // Check if audio files are available
      const latestAudioFiles = useGameStore.getState().audioFiles;

      // Play background music (loop) if available
      if (latestAudioFiles.background?.bgm_main?.url) {
        playAudio('background', 'bgm_main', { loop: true, stopPrevious: true });
      }

      // Play ambience (loop) if available
      if (latestAudioFiles.ambience?.amb_casino?.url) {
        playAudio('ambience', 'amb_casino', { loop: true, stopPrevious: true });
      }
    }

    return () => {
      // Cleanup on unmount
      stopAllAudio();
    };
  }, [isSoundEnabled, audioFiles, playAudio]); // Re-initialize when sound is toggled or audio files change

  // Switch background music when entering/exiting free spin mode
  useEffect(() => {
    if (!isSoundEnabled) return;

    // Get latest audio files
    const latestAudioFiles = useGameStore.getState().audioFiles;

    if (isInFreeSpinMode) {
      // Stop main background music
      stopAudio('background', 'bgm_main');
      // Play alternate loop if available
      if (latestAudioFiles.background?.bgm_alt_loop?.url) {
        playAudio('background', 'bgm_alt_loop', { loop: true, stopPrevious: true });
      }
    } else {
      // Stop alternate loop
      stopAudio('background', 'bgm_alt_loop');
      // Resume main background music if available
      if (latestAudioFiles.background?.bgm_main?.url) {
        playAudio('background', 'bgm_main', { loop: true, stopPrevious: true });
      }
    }
  }, [isInFreeSpinMode, isSoundEnabled, audioFiles, playAudio, stopAudio]);

  const wheelSpin = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Start wheel spin
    setWheelSpinning(true);

    const segments = config.bonus?.wheel?.segments || 8;
    const segmentValues =
      (config.bonus?.wheel as any)?.segmentValues || Array(segments).fill(50);

    const hasLevelUp = config.bonus?.wheel?.levelUp || false;
    const hasRespin = config.bonus?.wheel?.respin || false;

    // Determine winning segment (random)
    let winningSegment = Math.floor(Math.random() * segments);
    let segmentType: 'prize' | 'levelup' | 'respin' = 'prize';
    let segmentValue = segmentValues[winningSegment] || 50;

    if (hasLevelUp && winningSegment === 2) {
      segmentType = 'levelup';
      segmentValue = 0;
    } else if (hasRespin && winningSegment === 5) {
      segmentType = 'respin';
      segmentValue = 0;
    }

    // Wheel rotation logic
    const anglePerSegment = 360 / segments;
    const baseRotation = 1440;
    const targetAngle = 360 - (winningSegment * anglePerSegment + anglePerSegment / 2);
    const finalRotation = baseRotation + targetAngle;
    // Animate wheel
    setWheelRotation(finalRotation);

    // Handle result after spin animation
    setTimeout(() => {
      setWheelSpinning(false);
      setWheelResult({ value: segmentValue, type: segmentType });

      if (segmentType === 'prize') {
        const prizeAmount = segmentValue * betAmount;
        setBalance(balance + prizeAmount);
        setWinAmount(prizeAmount);

        // Calculate win tier and trigger particle effects for big, mega, and super wins
        const winTier = calculateWinTier(betAmount, prizeAmount);
        if (winTier !== 'small') {
          triggerParticleEffects(winTier);
        }

        setShowWinDisplay(true);
      }
    }, 3000);
  };

  return (
    <div
      className="w-full h-screen flex flex-col relative"
      style={{
        overflow: 'hidden', // Apply overflow on the style object instead
      }}
    >
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 uw:w-4 uw:h-4 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-gray-300 text-sm uw:text-2xl font-medium">Premium Slot Preview (PixiJS)</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-gray-500 text-xs uw:text-2xl">
            {reels}×{rows} grid • {viewMode === 'desktop' ? 'Desktop' : viewMode === 'mobile' ? 'Mobile Portrait' : 'Mobile Landscape'} mode
            {isSpinning && <span className="text-yellow-400 ml-2">• SPINNING</span>}
            {isAutoplayActive && <span className="text-green-400 ml-2">• AUTO</span>}
          </div>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${viewMode === 'desktop'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${viewMode === 'mobile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
            >
              <Smartphone className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('mobile-landscape')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${viewMode === 'mobile-landscape'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
            >
              <Smartphone className="w-3 h-3 rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* Pixi Preview - Background applied here, only in preview area */}
      <div
        ref={containerRef}
        className="flex-1 w-full relative"
        style={{
          ...getBackgroundStyle(), // Apply background to preview container only
          zIndex: 1,
          overflow: 'visible',
          minHeight: 0, // Important for flex children to respect container bounds
          flexShrink: 1, // Allow shrinking if needed
          position: 'relative',
          isolation: 'isolate' // Create stacking context to keep background stable
        }}
      >
        {/* Logo Display */}
        {logoUrl && (
          <div
            className="absolute z-40 pointer-events-none"
            style={{
              left: `${logoPositions[currentDevice].x}%`,
              top: `${logoPositions[currentDevice].y}%`,
              transform: `translate(-50%, -50%) scale(${logoScales[currentDevice] / 100})`,
              transformOrigin: 'center center',
              width: '400px',
              height: '200px',
              minWidth: '400px',
              minHeight: '200px',
              willChange: 'transform',
              boxSizing: 'border-box'
            }}
          >
            <img
              src={logoUrl}
              alt="Game Logo"
              className="w-full h-full object-contain"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))',
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                console.error('[SlotMachine] Failed to load logo:', logoUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {showFreeSpinSummary && (
          <div
            className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[199] animate-fadeIn"
            onClick={() => setShowFreeSpinSummary(false)}
          >
            <div
              className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl shadow-2xl max-w-md w-full mx-4 border-4 border-orange-400 animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                {/* Header with Icon */}
                <div className="flex flex-co items-center justify-center gap-4 mb-4">
                  <div className=" bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-4xl">🎰</span>
                  </div>
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600 text-center">
                    Free Spins Complete!
                  </h2>
                </div>

                {/* Total Wins Display */}
                <div className="mb-4 bg-white rounded-xl p-6 shadow-inner">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2">Your Total Winnings from Free Spins</p>
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                      <NumberImageRenderer
                        value={totalFreeSpinWins}
                        imageHeight="2em"
                        fallbackClassName="text-4xl font-bold"
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-2">Added to your balance</p>
                  </div>
                </div>
                {/* Action Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowFreeSpinSummary(false)}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-lg font-bold shadow-lg transition-all transform hover:scale-105 text-lg"
                  >
                    Continue Playing 🎮
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wheel Bonus Modal */}
        {showWheelBonus && (
          <div
            className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fadeIn p-2 sm:p-4"
          >
            <div
              className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-2xl w-full border-4 border-purple-400 animate-scaleIn overflow-hidden flex flex-col"
              style={{
                maxWidth: 'min(90vw, 600px)',
                maxHeight: 'min(50vh, 600px)',
                height: 'auto'
              }}
            >
              <div className="p-2 sm:p-4 md:p-3 flex flex-col items-center" style={{ minHeight: 0, maxHeight: '100%' }}>
                {/* Header */}
                <div className="flex gap-2 items-center mb-2 sm:mb-3 flex-shrink-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 text-center">
                    Wheel Bonus!
                  </h2>
                  <p className="text-gray-600 mt-1 text-xs sm:text-sm text-center">Spin the wheel to win amazing prizes!</p>
                </div>

                {/* Wheel Container */}
                <div className="flex justify-center mb-2 sm:mb-3 flex-shrink-0" style={{ width: '100%' }}>
                  <div
                    className="relative aspect-square"
                    style={{
                      width: 'min(60vw, 300px, calc(65vh - 250px))',
                      maxWidth: '100%'
                    }}
                  >
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 400 400"
                      style={{ position: 'relative' }}
                    >
                      {/* Rotating wheel segments group */}
                      <g
                        className="transition-transform duration-[3000ms] ease-out"
                        style={{
                          transform: `rotate(${wheelRotation}deg)`,
                          transformOrigin: '200px 200px'
                        }}
                      >
                        {(() => {
                          const segments = config.bonus?.wheel?.segments || 8;
                          const segmentValues = (config.bonus?.wheel as any)?.segmentValues || Array(segments).fill(50);
                          const hasLevelUp = config.bonus?.wheel?.levelUp || false;
                          const hasRespin = config.bonus?.wheel?.respin || false;
                          const anglePerSegment = 360 / segments;
                          const colors = [
                            '#EF5350', '#42A5F5', '#66BB6A', '#FFA726',
                            '#8D6E63', '#26A69A', '#EC407A', '#7E57C2',
                            '#5C6BC0', '#FFB74D', '#9CCC65', '#4DD0E1',
                            '#AB47BC', '#EF5350', '#42A5F5', '#66BB6A',
                            '#FFA726', '#8D6E63', '#26A69A', '#EC407A'
                          ];

                          return Array.from({ length: segments }).map((_, i) => {
                            const startAngle = (i * anglePerSegment - 90) * (Math.PI / 180);
                            const endAngle = ((i + 1) * anglePerSegment - 90) * (Math.PI / 180);
                            const centerX = 200;
                            const centerY = 200;
                            const radius = 180;

                            // Determine segment type
                            let segmentType: 'prize' | 'levelup' | 'respin' = 'prize';
                            let segmentValue = segmentValues[i] || 50;
                            let segmentColor = colors[i % colors.length];

                            if (hasLevelUp && i === 2) {
                              segmentType = 'levelup';
                              segmentColor = '#FFD700';
                            } else if (hasRespin && i === 5) {
                              segmentType = 'respin';
                              segmentColor = '#D1C4E9';
                            }

                            // Create path for segment
                            const x1 = centerX + radius * Math.cos(startAngle);
                            const y1 = centerY + radius * Math.sin(startAngle);
                            const x2 = centerX + radius * Math.cos(endAngle);
                            const y2 = centerY + radius * Math.sin(endAngle);
                            const largeArc = anglePerSegment > 180 ? 1 : 0;

                            return (
                              <g key={i}>
                                <path
                                  d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={segmentColor}
                                  stroke="#FFFFFF"
                                  strokeWidth="2"
                                />
                                <text
                                  x={centerX + (radius * 0.7) * Math.cos((startAngle + endAngle) / 2)}
                                  y={centerY + (radius * 0.7) * Math.sin((startAngle + endAngle) / 2)}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="#FFFFFF"
                                  fontSize="16"
                                  fontWeight="bold"
                                  className="pointer-events-none"
                                >
                                  {segmentType === 'levelup' ? 'LEVEL UP' :
                                    segmentType === 'respin' ? 'RESPIN' :
                                      `${segmentValue}x`}
                                </text>
                              </g>
                            );
                          });
                        })()}
                      </g>

                      {/* Fixed center circle - does not rotate */}
                      <circle
                        cx="200"
                        cy="200"
                        r="60"
                        fill="#F8C630"
                        stroke="#FFFFFF"
                        strokeWidth="3"
                        className="pointer-events-none"
                      />
                      <text
                        x="200"
                        y="200"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#FFFFFF"
                        fontSize="20"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        SPIN
                      </text>
                    </svg>

                    {/* Clickable overlay for center circle */}
                    {!wheelSpinning && !wheelResult && (
                      <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] min-w-[50px] aspect-square rounded-full cursor-pointer z-20 hover:bg-yellow-400/20 transition-colors"
                        onClick={wheelSpin}
                        title="Click to spin the wheel"
                      />
                    )}

                    {/* Pointer - Fixed at top center */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 pointer-events-none">
                      <div className="w-0 h-0 border-l-[10px] sm:border-l-[12px] md:border-l-[15px] border-r-[10px] sm:border-r-[12px] md:border-r-[15px] border-t-[20px] sm:border-t-[24px] md:border-t-[30px] border-l-transparent border-r-transparent border-t-red-600"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {/* Result Display */}
                  {wheelResult && (
                    <div className="bg-white rounded-xl p-2 md:p-2 shadow-inner flex-shrink-0 w-full max-w-md">
                      <div className="text-center">
                        {wheelResult.type === 'levelup' ? (
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-gray-600 text-xs">🎉 Level Up!</p>
                            <div className="text-xl sm:text-2xl md:text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                              Advance to the next level!
                            </div>
                          </div>
                        ) : wheelResult.type === 'respin' ? (
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-gray-600 text-xs">🔄 Respin!</p>
                            <div className="text-xl sm:text-2xl md:text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                              Spin again for another chance!
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-gray-600 text-xs">🎉 Your Prize</p>
                            <div className="text-xl sm:text-2xl md:text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 flex items-center gap-1">
                              <NumberImageRenderer value={wheelResult.value} imageHeight="1.2em" fallbackClassName="font-bold" /> x <NumberImageRenderer value={betAmount} imageHeight="1.2em" fallbackClassName="font-bold" /> = <NumberImageRenderer value={wheelResult.value * betAmount} imageHeight="1.2em" fallbackClassName="font-bold" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Close Button */}
                  <div className="flex justify-center flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowWheelBonus(false);
                        setWheelResult(null);
                        setWheelRotation(0);
                        setWheelSpinning(false);
                        // Resume normal gameplay
                        spinTimelinesRef.current.forEach(tl => {
                          if (tl) tl.kill();
                        });
                        spinTimelinesRef.current = [];
                        spinMetaRef.current = null;
                        setIsSpinning(false);
                        // Clear the spin completion flag after wheel closes
                        setTimeout(() => {
                          spinJustCompletedRef.current = false;
                        }, 1000);
                        rafRef.current = null;
                      }}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-3 md:py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold shadow-lg transition-all transform hover:scale-105 text-xs sm:text-sm md:text-xs cursor-pointer"
                      type="button"
                    >
                      {wheelResult ? 'Continue Playing 🎮' : 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Free Spin Counter - Displayed below symbols (only in free spin mode) */}
        {isInFreeSpinMode && (() => {
          const metrics = computeResponsiveMetrics();
          // Position below the symbols: offsetY + totalHeight + margin
          const totalHeight = rows * metrics.freespinSpacingY;
          const topPosition = metrics.offsetY + totalHeight; // 20px margin below symbols

          return (
            <div
              className="absolute left-1/2 transform -translate-x-1/2 z-30 pointer-events-none"
              style={{
                top: `${topPosition}px`,
              }}
            >
              <div className="bg-black bg-opacity-40 px-4 py-2 rounded-lg border-2 border-orange-400">
                <span className="text-white text-lg font-bold">
                  Remaining FreeSpins = {freeSpinsRemaining}
                </span>
              </div>
            </div>
          );
        })()}

        {/* UI Controls - Positioned absolutely at bottom, over background */}
        <div
          ref={uiControlsRef}
          className='w-full'
          style={{
            transform: `translate(${uiButtonAdjustments.position.x}px, ${uiButtonAdjustments.position.y}px)`,
            opacity: uiButtonAdjustments.visibility ? 1 : 0,
            pointerEvents: uiButtonAdjustments.visibility ? 'auto' : 'none',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100, // Higher z-index to ensure buttons are always on top
            backgroundColor: 'transparent',
            isolation: 'isolate' // Create new stacking context
          }}
        >
          {uiType === "modern" && (
            <ModernUI
              onSpin={onSpin}
              BET_VALUES={betValues}
              toggleMenu={toggleMenu}
              handleDecreaseBet={handleDecreaseBet}
              handleIncreaseBet={handleIncreaseBet}
              isAutoplayActive={isAutoplayActive}
              toggleAutoplay={toggleAutoplay}
              onAutoplayToggle={toggleAutoplay}
              onMaxBet={handleMaxBet}
              toggleSound={toggleSound}
              isSoundEnabled={isSoundEnabled}
              toggleSettings={toggleSettings}
              customButtons={customButtons}
              buttonScale={uiButtonAdjustments.scale}
              buttonScales={uiButtonAdjustments.buttonScales}
              buttonPositions={uiButtonAdjustments.buttonPositions}
            />
          )}
          {uiType === "normal" && (
            <NormalDesign
              onSpin={onSpin}
              toggleMenu={toggleMenu}
              handleDecreaseBet={handleDecreaseBet}
              handleIncreaseBet={handleIncreaseBet}
              isAutoplayActive={isAutoplayActive}
              toggleAutoplay={toggleAutoplay}
              onAutoplayToggle={toggleAutoplay}
              onMaxBet={handleMaxBet}
              toggleSound={toggleSound}
              isSoundEnabled={isSoundEnabled}
              toggleSettings={toggleSettings}
              customButtons={customButtons}
              buttonScale={uiButtonAdjustments.scale}
              buttonScales={uiButtonAdjustments.buttonScales}
              buttonPositions={uiButtonAdjustments.buttonPositions}
            />
          )}
          {uiType === "ultimate" && (
            <UltimateDesign
              onSpin={onSpin}
              toggleMenu={toggleMenu}
              handleDecreaseBet={handleDecreaseBet}
              handleIncreaseBet={handleIncreaseBet}
              isAutoplayActive={isAutoplayActive}
              toggleAutoplay={toggleAutoplay}
              onAutoplayToggle={toggleAutoplay}
              toggleSound={toggleSound}
              isSoundEnabled={isSoundEnabled}
              toggleSettings={toggleSettings}
              customButtons={customButtons}
              buttonScale={uiButtonAdjustments.scale}
              buttonScales={uiButtonAdjustments.buttonScales}
              buttonPositions={uiButtonAdjustments.buttonPositions}
            />
          )}
          {uiType === "simple" && (
            <SimpleDesign
              onSpin={onSpin}
              toggleMenu={toggleMenu}
              handleDecreaseBet={handleDecreaseBet}
              handleIncreaseBet={handleIncreaseBet}
              isAutoplayActive={isAutoplayActive}
              toggleAutoplay={toggleAutoplay}
              onAutoplayToggle={toggleAutoplay}
              toggleSound={toggleSound}
              isSoundEnabled={isSoundEnabled}
              toggleSettings={toggleSettings}
              customButtons={customButtons}
              buttonScale={uiButtonAdjustments.scale}
              buttonScales={uiButtonAdjustments.buttonScales}
              buttonPositions={uiButtonAdjustments.buttonPositions}
            />
          )}
        </div>

        {/* Win Title Asset Display - Inside game container */}
        {showWinTitle && currentWinTier !== 'small' && (() => {
          const winTitleId = currentWinTier === 'big' ? 'big_win' :
            currentWinTier === 'mega' ? 'mega_win' :
              currentWinTier === 'super' ? 'super_win' : null;

          // Comprehensive check for win title URL - check multiple possible locations
          let winTitleUrl = null;
          if (winTitleId) {
            // First, try the standard location
            winTitleUrl = config.generatedAssets?.winTitles?.[winTitleId] || null;

            // If not found, also check winTitleConfigs for the URL
            if (!winTitleUrl && config.winTitleConfigs?.[winTitleId]?.generatedUrl) {
              winTitleUrl = config.winTitleConfigs[winTitleId].generatedUrl;
              console.log('[SlotMachine] Found win title URL in winTitleConfigs during render:', winTitleId);
            }
          }

          const winTitleConfig = winTitleId ? (config.winTitleConfigs?.[winTitleId] || null) : null;

          if (!winTitleUrl) {
            console.warn('[SlotMachine] Win title URL not found for:', {
              winTitleId,
              currentWinTier,
              showWinTitle,
              hasGeneratedAssets: !!config.generatedAssets,
              hasWinTitles: !!config.generatedAssets?.winTitles,
              winTitleKeys: config.generatedAssets?.winTitles ? Object.keys(config.generatedAssets.winTitles) : [],
              hasWinTitleConfigs: !!config.winTitleConfigs,
              winTitleConfigKeys: config.winTitleConfigs ? Object.keys(config.winTitleConfigs) : []
            });
            return null;
          }

          // Get titleImageSize from config (defaults to 100% if not set)
          const titleImageSize = winTitleConfig?.titleImageSize || 100;
          const titleSizeMultiplier = titleImageSize / 100;

          // Base dimensions for win titles (these are the 100% size)
          const baseWidth = 400;
          const baseHeight = 150;

          // Calculate final dimensions based on size multiplier
          const finalWidth = Math.round(baseWidth * titleSizeMultiplier);
          const finalHeight = Math.round(baseHeight * titleSizeMultiplier);

          // Calculate max dimensions that respect the multiplier but don't exceed viewport
          // Use viewport dimensions for proper scaling
          const viewportWidth = window.innerWidth || 1920;
          const viewportHeight = window.innerHeight || 1080;
          const maxWidth = Math.min(finalWidth, viewportWidth * 0.8);
          const maxHeight = Math.min(finalHeight, viewportHeight * 0.4);

          console.log('[SlotMachine] Rendering win title:', {
            winTitleId,
            winTitleUrl: winTitleUrl ? `${winTitleUrl.substring(0, 50)}...` : 'null',
            titleImageSize,
            titleSizeMultiplier,
            baseWidth,
            baseHeight,
            finalWidth,
            finalHeight,
            maxWidth,
            maxHeight,
            viewportWidth,
            viewportHeight
          });

          return (
            <div
              className="absolute inset-0 z-[200] pointer-events-none"
              style={{
                animation: 'fadeInOut 3.5s ease-in-out forwards',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              <img
                src={winTitleUrl}
                alt={`${currentWinTier.toUpperCase()} WIN!`}
                className="object-contain"
                style={{
                  width: maxWidth < finalWidth ? `${maxWidth}px` : `${finalWidth}px`,
                  height: maxHeight < finalHeight ? `${maxHeight}px` : `${finalHeight}px`,
                  minWidth: '200px',
                  minHeight: '75px',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))',
                  animation: 'winTitleScaleIn 0.5s ease-out forwards',
                  display: 'block',
                  position: 'relative',
                  opacity: 1,
                  visibility: 'visible',
                  zIndex: 201
                }}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.log('[SlotMachine] Win title image loaded successfully', {
                    winTitleId,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    computedWidth: window.getComputedStyle(img).width,
                    computedHeight: window.getComputedStyle(img).height,
                    offsetWidth: img.offsetWidth,
                    offsetHeight: img.offsetHeight,
                    clientWidth: img.clientWidth,
                    clientHeight: img.clientHeight,
                    isVisible: img.offsetWidth > 0 && img.offsetHeight > 0
                  });
                }}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.error('[SlotMachine] Failed to load win title image:', {
                    winTitleId,
                    winTitleUrl: winTitleUrl ? `${winTitleUrl.substring(0, 100)}...` : 'null',
                    error: e,
                    imageSrc: img.src?.substring(0, 100),
                    imageComplete: img.complete,
                    imageNaturalWidth: img.naturalWidth,
                    imageNaturalHeight: img.naturalHeight
                  });
                  setShowWinTitle(false);
                  setShowWinDisplay(true);
                }}
              />
            </div>
          );
        })()}
      </div>

      {/* Pick & Click Bonus Modal */}
      {showPickAndClick && (
        <div
          className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fadeIn p-2 sm:p-4"
        >
          <div
            className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-2xl w-full border-4 border-yellow-400 animate-scaleIn overflow-hidden flex flex-col"
            style={{
              maxWidth: 'min(90vw, 600px)',
              maxHeight: 'min(50vh, 600px)',
              height: 'auto'
            }}
          >
            <div className="p-2 sm:p-4 md:p-3 flex flex-col items-center" style={{ minHeight: 0, maxHeight: '100%' }}>
              {/* Header */}
              <div className="flex gap-2 items-center mb-2 sm:mb-3 flex-shrink-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 text-center">
                  Pick & Click Bonus!
                </h2>
                <p className="text-gray-600 mt-1 text-xs sm:text-sm text-center">
                  Picks: <span className="font-bold text-orange-600">{pickAndClickPicksRemaining}</span>
                  {pickAndClickCurrentMultiplier > 1 && (
                    <span className="ml-2">• Multiplier: <span className="font-bold text-purple-600">{pickAndClickCurrentMultiplier}x</span></span>
                  )}
                </p>
              </div>

              {/* Grid Container */}
              <div className="flex justify-center mb-2 sm:mb-3 flex-shrink-0" style={{ width: '100%' }}>
                <div className="grid gap-1.5 p-2 bg-[#0F1423] rounded-lg" style={{ maxWidth: '100%' }}>
                  {pickAndClickGrid.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1.5">
                      {row.map((cell, colIndex) => {
                        const isRevealed = pickAndClickRevealed[rowIndex]?.[colIndex];
                        const canClick = pickAndClickPicksRemaining > 0 && !isRevealed;

                        let bgColor = 'bg-[#2D3748]';
                        let content = null;

                        if (isRevealed && cell) {
                          if (cell.type === 'extraPick') {
                            bgColor = 'bg-[#66BB6A]';
                            content = (
                              <div className="flex flex-col items-center justify-center text-white">
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                <p className="text-[10px] sm:text-xs mt-0.5 font-bold">EXTRA</p>
                              </div>
                            );
                          } else if (cell.type === 'multiplier') {
                            bgColor = 'bg-[#FFA726]';
                            content = (
                              <div className="flex flex-col items-center justify-center text-white">
                                <div className="text-sm sm:text-base font-bold">x{cell.value}</div>
                                <div className="text-[10px] sm:text-xs font-bold">MULT</div>
                              </div>
                            );
                          } else {
                            // Prize
                            const allPrizes = (config.bonus?.pickAndClick as any)?.prizeValues || [100];
                            const maxPrize = Math.max(...allPrizes);
                            const minPrize = Math.min(...allPrizes);
                            const range = maxPrize - minPrize;
                            bgColor = cell.value <= (minPrize + range * 0.33)
                              ? 'bg-[#5C6BC0]' // Low prize
                              : cell.value <= (minPrize + range * 0.66)
                                ? 'bg-[#EF5350]' // Medium prize
                                : 'bg-[#FFD700]'; // High prize

                            content = (
                              <div className="flex flex-col items-center justify-center text-white">
                                <div className="text-xs sm:text-sm font-bold">{cell.value}x</div>
                                <div className="text-[10px] sm:text-xs font-bold">WIN</div>
                              </div>
                            );
                          }
                        } else {
                          content = (
                            <div className="text-xl sm:text-2xl font-bold text-[#A0AEC0]">?</div>
                          );
                        }

                        return (
                          <button
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => canClick && handlePickAndClickCell(rowIndex, colIndex)}
                            disabled={!canClick}
                            className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${bgColor} rounded-lg flex items-center justify-center text-white cursor-pointer shadow-md transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                          >
                            {content}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Total Win Display */}
                {pickAndClickTotalWin > 0 && (
                  <div className="bg-white rounded-xl p-1 shadow-inner flex-shrink-0 w-full max-w-md">
                    <div className="text-center">
                      <p className="text-gray-600 text-xs">Total Win</p>
                      <div className="text-lg sm:text-xl md:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center gap-1">
                        <NumberImageRenderer value={pickAndClickTotalWin} imageHeight="1.2em" fallbackClassName="font-bold" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-center flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPickAndClick(false);
                      // Resume normal gameplay
                      spinTimelinesRef.current.forEach(tl => {
                        if (tl) tl.kill();
                      });
                      spinTimelinesRef.current = [];
                      spinMetaRef.current = null;
                      setIsSpinning(false);
                      setTimeout(() => {
                        spinJustCompletedRef.current = false;
                      }, 1000);
                      rafRef.current = null;
                    }}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-3 md:py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold shadow-lg transition-all transform hover:scale-105 text-xs sm:text-sm md:text-xs cursor-pointer"
                    type="button"
                  >
                    {pickAndClickPicksRemaining <= 0 ? 'Continue Playing 🎮' : 'Close'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Free Spin Announcement */}
      {showFreeSpinAnnouncement && (
        <div
          className="absolute left-1/2 top-1/2 z-50 pointer-events-none"
          style={{
            animation: getTransitionAnimation(announcementTransitionStyle, announcementTransitionDuration)
          }}
        >
          {/* Only show image if it exists and is not empty */}
          {(config as any)?.freeSpinAnnouncementImage &&
            typeof (config as any).freeSpinAnnouncementImage === 'string' &&
            (config as any).freeSpinAnnouncementImage.trim() !== '' ? (
            // Show ONLY the image - no basic announcement
            <img
              src={(config as any).freeSpinAnnouncementImage}
              alt="Free Spins Announcement"
              className="max-w-[90vw] max-h-[50vh] object-contain rounded-lg shadow-2xl"
              style={{
                minWidth: '300px',
                minHeight: '150px'
              }}
              onError={() => {
                // If image fails to load, hide the announcement
                console.warn('Failed to load free spin announcement image');
                setShowFreeSpinAnnouncement(false);
              }}
            />
          ) : (
            // Only show basic announcement when image is NOT available
            <div
              className="px-[32px] py-[24px] bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-[16px] font-bold text-center shadow-2xl"
              style={{
                fontSize: 'clamp(20px, 5vw, 40px)',
                minWidth: '300px'
              }}
            >
              🎰 FREE SPINS! 🎰<br />
              <span style={{ fontSize: 'clamp(16px, 4vw, 28px)' }}>
                {freeSpinAwardedCount} Free Spins Awarded!
              </span>
            </div>
          )}
        </div>
      )}


      {/* Pick & Click Announcement */}
      {showPickAndClickAnnouncement && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          style={{
            animation: 'fadeInOut 3s ease-in-out forwards'
          }}
        >
          {(config as any)?.pickClickAnnouncementImage ? (
            <img
              src={(config as any).pickClickAnnouncementImage}
              alt="Pick & Click Bonus Announcement"
              className="max-w-[90vw] max-h-[50vh] object-contain rounded-lg shadow-2xl"
              style={{
                minWidth: '300px',
                minHeight: '150px'
              }}
            />
          ) : (
            <div
              className="px-[32px] py-[24px] bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-[16px] font-bold text-center shadow-2xl"
              style={{
                fontSize: 'clamp(20px, 5vw, 40px)',
                minWidth: '300px'
              }}
            >
              🎁 PICK & CLICK BONUS! 🎁<br />
              <span style={{ fontSize: 'clamp(16px, 4vw, 28px)' }}>
                Pick boxes to reveal prizes!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Wheel Bonus Announcement */}
      {showWheelAnnouncement && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          style={{
            animation: 'fadeInOut 3s ease-in-out forwards'
          }}
        >
          {(config as any)?.wheelAnnouncementImage ? (
            <img
              src={(config as any).wheelAnnouncementImage}
              alt="Wheel Bonus Announcement"
              className="max-w-[90vw] max-h-[50vh] object-contain rounded-lg shadow-2xl"
              style={{
                minWidth: '300px',
                minHeight: '150px'
              }}
            />
          ) : (
            <div
              className="px-[32px] py-[24px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-[16px] font-bold text-center shadow-2xl"
              style={{
                fontSize: 'clamp(20px, 5vw, 40px)',
                minWidth: '300px'
              }}
            >
              🎡 WHEEL BONUS! 🎡<br />
              <span style={{ fontSize: 'clamp(16px, 4vw, 28px)' }}>
                Spin the wheel to win!
              </span>
            </div>
          )}
        </div>
      )}


      {/* Win Display */}
      {winAmount > 0 && showWinDisplay && config.winDisplayImage && (() => {
        // Get win display position and scale for current device
        const position = winDisplayConfig.positions[currentDevice] || { x: 50, y: 50 };
        const scale = winDisplayConfig.scales[currentDevice] || 100;

        return (
          <div
            className="absolute z-50 cursor-pointer"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: `translate(-50%, -50%) scale(${scale / 100})`,
              // animation: 'fadeInOut 3.5s ease-in-out forwards'
            }}
            onClick={() => {
              // Skip animation and jump to final amount
              if (winAmountAnimationRef.current) {
                winAmountAnimationRef.current.kill();
                winAmountAnimationRef.current = null;
              }
              setAnimatedWinAmount(winAmount);
            }}
            title="Click to skip animation"
          >
            <div className="relative animate-win-display-bounce">
              <img
                src={config.winDisplayImage}
                alt="Win Display"
                className="object-contain shadowxl rounded-lg"
                style={{
                  width: '360px',
                  height: '160px',
                  minWidth: '200px',
                  minHeight: '100px'
                }}
                onError={(e) => {
                  console.warn('Failed to load win display image:', config.winDisplayImage);
                  // Could optionally show fallback text here
                }}
              />
              {/* Win Amount Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white font-bold text-center drop-hadow-lg">
                  <div
                    className="text-2xl md:text-3xl lg:text-4xl"
                    style={{
                      fontSize: 'clamp(18px, 4vw, 32px)',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,255,0.3)'
                    }}
                  >
                    Win: <NumberImageRenderer
                      value={animatedWinAmount}
                      imageHeight="1.2em"
                      fallbackClassName="font-bold"
                    />
                    {isInFreeSpinMode && <div className="text-sm mt-1">(Free Spin Win)</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


    </div>
  );
}
