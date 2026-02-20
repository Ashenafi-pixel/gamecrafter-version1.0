import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Assets, FillGradient } from "pixi.js";
import { GlowFilter } from "pixi-filters/glow";
import { gsap } from "gsap";
import { useGameStore } from "../../store";
import { useSidebarStore } from "../../stores/sidebarStore";
import { getBetlinePatterns } from "../../utils/betlinePatterns";
import { NormalDesign } from "../visual-journey/slot-animation/uiDesigns/NormalDesign";
import { ModernUI } from "../visual-journey/slot-animation/uiDesigns/ModernDesign";
import { UltimateDesign } from "../visual-journey/slot-animation/uiDesigns/UltimateDesign";
import SymbolPreloader from "../../utils/symbolPreloader";
import { DEFAULT_CLASSIC_SYMBOLS } from "../../utils/predefinedSymbols";
import { SimpleDesign } from "../visual-journey/slot-animation/uiDesigns/simple";
import { NumberImageRenderer } from "../shared/NumberImageRenderer";
import { Monitor, Smartphone, Plus } from "lucide-react";
import { detectDeviceType } from "../../utils/deviceDetection";
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import spineAtlasUrl from '../../assets/export_poison_witch/poison_witch.atlas?url';
import spineSkelUrl from '../../assets/export_poison_witch/poison_witch.skel?url';
import spineTextureUrl from '../../assets/export_poison_witch/poison_witch.webp';
import type { SymbolSpineAsset } from '../../types';
import { STEP_EVENTS } from '../../utils/stepTransitionCoordinator';

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
    
    /* Background transition keyframes (full-bleed, for normal <-> freespin bg change) */
    @keyframes bgFadeTransition {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes bgSlideInRight {
      0% { transform: translateX(100%); opacity: 1; }
      100% { transform: translateX(0); opacity: 1; }
    }
    @keyframes bgZoomIn {
      0% { transform: scale(0.1); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes bgDissolveTransition {
      0% { opacity: 0; filter: blur(20px); }
      100% { opacity: 1; filter: blur(0); }
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
    audioFiles,
    audioChannelVolumes
  } = useGameStore();
  const { isSidebarCollapsed } = useSidebarStore();
  const symbolsRaw = config.theme?.generated?.symbols;
  const { symbols, symbolSpineAssets } = useMemo(() => {
    if (typeof symbolsRaw === 'object' && !Array.isArray(symbolsRaw) && Object.keys(symbolsRaw).length > 0) {
      const textures: Record<string, string> = {};
      const spine: Record<string, SymbolSpineAsset> = {};
      for (const [k, v] of Object.entries(symbolsRaw)) {
        if (typeof v === 'string') textures[k] = v;
        else if (v && typeof v === 'object' && 'atlasUrl' in v) spine[k] = v as SymbolSpineAsset;
      }
      return { symbols: textures, symbolSpineAssets: spine };
    }
    return { symbols: DEFAULT_CLASSIC_SYMBOLS as Record<string, string>, symbolSpineAssets: {} as Record<string, SymbolSpineAsset> };
  }, [symbolsRaw]);
  /** All symbol keys (texture + Spine) so Spine-only symbols like wild appear in the grid. */
  const symbolKeys = useMemo(
    () => [...new Set([...Object.keys(symbols), ...Object.keys(symbolSpineAssets)])],
    [symbols, symbolSpineAssets]
  );
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
  const winLinesRef = useRef<Array<{ shadowLine: PIXI.Graphics; lineGraphics: PIXI.Graphics; mask?: PIXI.Graphics; gradient?: unknown }>>([]);
  const symbolSizeRef = useRef<number>(0);
  const reelSymbolSequencesRef = useRef<string[][]>([]);
  const blurFiltersRef = useRef<Map<PIXI.Container, PIXI.BlurFilter>>(new Map());
  const winHighlightsRef = useRef<PIXI.Graphics[]>([]);
  const winAnimationCompleteCallbackRef = useRef<(() => void) | null>(null);
  const freeSpinModeRef = useRef<boolean>(false);
  const freeSpinsRemainingRef = useRef<number>(0);
  const totalFreeSpinWinsRef = useRef<number>(0);
  const spinJustCompletedRef = useRef<boolean>(false);
  const quickStopRef = useRef<(() => void) | null>(null);
  const winAmountAnimationRef = useRef<gsap.core.Tween | null>(null);
  const particleOverlayRef = useRef<HTMLDivElement | null>(null);
  const logoContainerRef = useRef<HTMLDivElement | null>(null);
  const logoPositionsRef = useRef<Record<string, { x: number; y: number }> | null>(null);
  const logoScalesRef = useRef<Record<string, number> | null>(null);
  const currentDeviceRef = useRef<'desktop' | 'mobilePortrait' | 'mobileLandscape'>('desktop');
  const logoSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Spine character refs
  const spineCharacterRef = useRef<Spine | null>(null);
  /** Custom Spine asset ids from last load; unload before re-adding to avoid resolver "already has key" */
  const lastCustomSpineAssetIdsRef = useRef<{ skel: string; atlas: string; texture?: string } | null>(null);
  const spineAnimationStateRef = useRef<'idle' | 'win'>('idle');
  const computeResponsiveMetricsRef = useRef<(() => { size: number; spacingX: number; spacingY: number; offsetX: number; offsetY: number }) | null>(null);

  // Animated (Spine) symbol refs: asset IDs per symbol key, pool per key, last-loaded URLs for cleanup
  const spineSymbolAssetIdsRef = useRef<Record<string, { skel: string; atlas: string; texture?: string }>>({});
  const spineSymbolPoolRef = useRef<Map<string, Spine[]>>(new Map());
  const lastSpineSymbolUrlsRef = useRef<Record<string, string>>({});
  /** Spine symbol instances currently on a winning line; only these are updated so they animate. */
  const winningSpineInstancesRef = useRef<Set<Spine>>(new Set());
  const winningSpineTickerRef = useRef<((t: { deltaTime: number }) => void) | null>(null);
  /** When true, we're paused for step transition - don't run renderGrid/resize logic (avoids BatcherPipe geometry null). */
  const pausedForTeardownRef = useRef<boolean>(false);
  /** When true, Spine pool teardown is in progress - skip resize/render to avoid BatcherPipe/validateRenderables errors. */
  const spineTeardownInProgressRef = useRef<boolean>(false);

  // Symbol animation refs for win-based animations
  const activeSymbolAnimationsRef = useRef<Map<string, {
    timeline: gsap.core.Timeline;
    sprite: PIXI.Sprite | Spine;
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

  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const loopingAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const playAudio = useCallback((category: keyof AudioVolumes, name: string, options?: { loop?: boolean; volume?: number; stopPrevious?: boolean }) => {
    if (!isSoundEnabled) {
      console.log(`[Audio] Sound disabled, skipping ${category}/${name}`);
      return null;
    }

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

    let audio = audioElementsRef.current.get(audioKey);
    if (!audio || audio.src !== audioFile.url) {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.load();
      }
      audio = new Audio(audioFile.url);
      audio.preload = 'auto';
      audioElementsRef.current.set(audioKey, audio);
      console.log(`[Audio] Loaded audio: ${audioKey} from ${audioFile.url}`);
    }

    const categoryVolume = audioChannelVolumes[category] ?? 0.5;
    const finalVolume = (options?.volume ?? categoryVolume) * (isSoundEnabled ? 1 : 0);
    audio.volume = Math.max(0, Math.min(1, finalVolume));

    audio.loop = options?.loop ?? false;

    audio.play().catch(error => {
      console.warn(`[Audio] Failed to play ${audioKey}:`, error);
    });

    if (options?.loop) {
      loopingAudioRef.current.set(audioKey, audio);
    }

    return audio;
  }, [isSoundEnabled, audioChannelVolumes]);

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
    audioElementsRef.current.forEach((audio, key) => {
      const [category] = key.split('_') as [keyof AudioVolumes];
      const vol = audioChannelVolumes[category];
      if (category && vol !== undefined) {
        audio.volume = vol * (isSoundEnabled ? 1 : 0);
      }
    });
    loopingAudioRef.current.forEach((audio, key) => {
      const [category] = key.split('_') as [keyof AudioVolumes];
      const vol = audioChannelVolumes[category];
      if (category && vol !== undefined) {
        audio.volume = vol * (isSoundEnabled ? 1 : 0);
      }
    });
  }, [audioChannelVolumes, isSoundEnabled]);


  const playSpineAnimation = useCallback((animationName: 'idle' | 'win') => {
    const spine = spineCharacterRef.current;
    if (!spine || !spine.state) {
      console.warn('[Spine] Cannot play animation: spine not initialized');
      return;
    }

    try {
      const skeleton = spine.skeleton;
      if (!skeleton || !skeleton.data) {
        console.warn('[Spine] Skeleton data not available');
        return;
      }

      // Get available animations
      const availableAnimations = skeleton.data.animations.map((a: any) => a.name);
      console.log('[Spine] Available animations:', availableAnimations);

      // Map our animation states to actual animation names in the Spine file
      let actualAnimationName: string | null = null;

      if (animationName === 'idle') {
        // Try common idle animation names
        const idleNames = ['idle', 'breathing', 'stand', 'loop', 'default'];
        actualAnimationName = idleNames.find(name => availableAnimations.includes(name)) || availableAnimations[0] || null;
      } else if (animationName === 'win') {
        // Try common win/celebration animation names
        const winNames = ['win', 'celebrate', 'action', 'victory', 'happy', 'cheer'];
        actualAnimationName = winNames.find(name => availableAnimations.includes(name)) || availableAnimations[0] || null;
      }

      if (!actualAnimationName) {
        console.warn(`[Spine] No suitable animation found for ${animationName}`);
        return;
      }

      console.log(`[Spine] Playing animation: ${actualAnimationName} (requested: ${animationName})`);

      if (animationName === 'idle') {
        // Loop idle animation
        spine.state.setAnimation(0, actualAnimationName, true);
        spineAnimationStateRef.current = 'idle';
      } else if (animationName === 'win') {
        // Play win animation once, then return to idle
        spine.state.setAnimation(0, actualAnimationName, false);
        spineAnimationStateRef.current = 'win';

        // Set up listener for when win animation completes
        spine.state.addListener({
          complete: (trackEntry: any) => {
            if (trackEntry.animation.name === actualAnimationName) {
              // Return to idle animation
              setTimeout(() => {
                playSpineAnimation('idle');
              }, 100);
            }
          }
        });
      }
    } catch (error) {
      console.error('[Spine] Error playing animation:', error);
    }
  }, []);

  // Update Spine character position/scale to match current preview dimensions and layout + config overrides
  const updateSpinePosition = useCallback(() => {
    const app = appRef.current;
    const spine = spineCharacterRef.current;
    if (!app || !spine || spine.destroyed) return;

    const metrics = computeResponsiveMetricsRef.current?.();
    if (!metrics) return;
    const w = renderSizeRef.current.width;
    const h = renderSizeRef.current.height;
    const cfg = useGameStore.getState().config as { spineCharacterPosition?: { x: number; y: number }; spineCharacterScale?: number } | undefined;
    const posOffset = cfg?.spineCharacterPosition ?? { x: 0, y: 0 };
    const scalePercent = cfg?.spineCharacterScale ?? 40;

    // Slider range -200..200 maps to full preview width/height: -200 = left/top edge, 0 = center, +200 = right/bottom edge
    const margin = 24;
    const centerX = w / 2;
    const centerY = h / 2;
    const halfRangeX = Math.max(0, w / 2 - margin);
    const halfRangeY = Math.max(0, h / 2 - margin);
    spine.x = centerX + (posOffset.x / 200) * halfRangeX;
    spine.y = centerY + (posOffset.y / 200) * halfRangeY;
    const baseScale = 0.4;
    const scaleByHeight = Math.min(1.2, Math.max(0.25, h / 500));
    const scale = (baseScale * scaleByHeight * scalePercent) / 100;
    spine.scale.set(scale);
  }, []);

  // Load and initialize Spine character animation
  const loadSpineCharacter = useCallback(async () => {
    const app = appRef.current;
    if (!app || !app.stage) {
      console.warn('[Spine] Cannot load Spine: app or stage not ready');
      return;
    }

    // Clean up existing Spine character if it exists
    if (spineCharacterRef.current) {
      if (spineCharacterRef.current.parent) {
        spineCharacterRef.current.parent.removeChild(spineCharacterRef.current);
      }
      spineCharacterRef.current.destroy({ children: true });
      spineCharacterRef.current = null;
    }

    try {
      const cfg = useGameStore.getState().config as {
        spineCharacterAtlasUrl?: string | null;
        spineCharacterSkelUrl?: string | null;
        spineCharacterTextureUrl?: string | null;
        spineCharacterTextureName?: string | null;
      } | undefined;
      const useCustom = cfg?.spineCharacterAtlasUrl && cfg?.spineCharacterSkelUrl && cfg?.spineCharacterTextureUrl && cfg?.spineCharacterTextureName;

      let skelAssetId: string;
      let atlasAssetId: string;

      if (useCustom) {
        const textureName = cfg.spineCharacterTextureName!;
        const textureUrl = cfg.spineCharacterTextureUrl!;
        // Unload previous custom assets so resolver doesn't warn "already has key"
        const prev = lastCustomSpineAssetIdsRef.current;
        if (prev) {
          if (PIXI.Assets.cache.has(prev.skel)) await PIXI.Assets.unload(prev.skel);
          if (PIXI.Assets.cache.has(prev.atlas)) await PIXI.Assets.unload(prev.atlas);
          if (prev.texture && PIXI.Assets.cache.has(prev.texture)) await PIXI.Assets.unload(prev.texture);
          lastCustomSpineAssetIdsRef.current = null;
        }
        const unique = `${Date.now()}`;
        skelAssetId = `spine_custom_skel_${unique}`;
        atlasAssetId = `spine_custom_atlas_${unique}`;
        const textureAssetId = `spine_custom_tex_${unique}`;
        // Blob URLs have no extension; force loaders so PIXI knows how to parse them
        PIXI.Assets.add({
          alias: skelAssetId,
          src: cfg.spineCharacterSkelUrl!,
          loadParser: 'spineSkeletonLoader'
        });
        // Pre-load texture blob with explicit parser so atlas gets a TextureSource (blob URLs don't match .png)
        PIXI.Assets.add({
          alias: textureAssetId,
          src: textureUrl,
          loadParser: 'loadTextures'
        });
        const loadedTexture = await PIXI.Assets.load(textureAssetId) as import('pixi.js').Texture;
        const textureSource = loadedTexture?.source ?? null;
        PIXI.Assets.add({
          alias: atlasAssetId,
          src: cfg.spineCharacterAtlasUrl!,
          loadParser: 'spineTextureAtlasLoader',
          data: { images: textureSource ? { [textureName]: textureSource } : { [textureName]: textureUrl } }
        });
        lastCustomSpineAssetIdsRef.current = { skel: skelAssetId, atlas: atlasAssetId, texture: textureAssetId };
        console.log('[Spine] Loading custom Spine assets...', { textureName, atlasUrl: cfg.spineCharacterAtlasUrl?.slice(0, 50) });
      } else {
        skelAssetId = 'poison_witch_skel';
        atlasAssetId = 'poison_witch_atlas';
        if (!PIXI.Assets.cache.has(skelAssetId)) {
          PIXI.Assets.add({ alias: skelAssetId, src: spineSkelUrl });
        }
        if (!PIXI.Assets.cache.has(atlasAssetId)) {
          PIXI.Assets.add({
            alias: atlasAssetId,
            src: spineAtlasUrl,
            data: { images: { 'poison_witch.webp': spineTextureUrl } }
          });
        }
        console.log('[Spine] Loading default Spine animation assets...');
      }

      await PIXI.Assets.load([skelAssetId, atlasAssetId]);
      console.log('[Spine] Assets loaded successfully');

      const spine = Spine.from({ skeleton: skelAssetId, atlas: atlasAssetId });

      // Store reference before positioning so updateSpinePosition can find it
      spineCharacterRef.current = spine;

      // Add to stage (above background, below UI)
      app.stage.addChild(spine);

      // Position using current layout metrics so it displays correctly in the preview
      updateSpinePosition();

      // Log available animations
      if (spine.skeleton && spine.skeleton.data && spine.skeleton.data.animations) {
        const animations = spine.skeleton.data.animations.map((a: any) => a.name);
        console.log('[Spine] Available animations:', animations);
      }

      // Start with idle animation
      playSpineAnimation('idle');

      console.log('[Spine] Character loaded and initialized successfully');
    } catch (error) {
      console.error('[Spine] Failed to load Spine character:', error);
    }
  }, [playSpineAnimation, updateSpinePosition]);

  // Cleanup Spine character on unmount
  const cleanupSpineCharacter = useCallback(() => {
    if (spineCharacterRef.current) {
      if (spineCharacterRef.current.parent) {
        spineCharacterRef.current.parent.removeChild(spineCharacterRef.current);
      }
      spineCharacterRef.current.destroy({ children: true });
      spineCharacterRef.current = null;
    }
  }, []);

  const showSpineCharacter = (config as { showSpineCharacter?: boolean })?.showSpineCharacter === true;

  // Load Spine character when app is ready and "Show character" is enabled; otherwise keep it hidden
  useEffect(() => {
    if (!showSpineCharacter) {
      cleanupSpineCharacter();
      return;
    }
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 50; // Try for about 5 seconds (50 * 100ms)

    const loadSpineWithRetry = () => {
      if (appRef.current && appRef.current.stage) {
        console.log('[Spine] App is ready, loading Spine character...');
        loadSpineCharacter().then(() => {
          console.log('[Spine] Spine character loaded successfully');
        }).catch(error => {
          console.error('[Spine] Failed to load Spine character:', error);
        });
      } else {
        retryCount++;
        if (retryCount < maxRetries && isMounted) {
          setTimeout(loadSpineWithRetry, 100);
        } else if (retryCount >= maxRetries) {
          console.warn('[Spine] Max retries reached, app may not be initialized yet');
        }
      }
    };

    loadSpineWithRetry();

    return () => {
      isMounted = false;
      cleanupSpineCharacter();
    };
  }, [showSpineCharacter, loadSpineCharacter, cleanupSpineCharacter]);

  useEffect(() => {
    updateAudioVolumes();
  }, [updateAudioVolumes]);

  useEffect(() => {
    if (!isSoundEnabled) {
      stopAllAudio();
    }
  }, [isSoundEnabled, stopAllAudio]);

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

  useEffect(() => {
    const handleAudioFileUpdated = (event: CustomEvent) => {
      const { category, name, url } = event.detail;
      if (!category || !name || !url) return;

      console.log(`[Audio] Audio file updated: ${category}/${name}`, url);

      const audioKey = `${category}_${name}`;
      const existingAudio = audioElementsRef.current.get(audioKey);

      if (existingAudio) {
        const wasPlaying = !existingAudio.paused;
        const wasLooping = existingAudio.loop;
        const volume = existingAudio.volume;

        const newAudio = new Audio(url);
        newAudio.preload = 'auto';
        newAudio.volume = volume;
        newAudio.loop = wasLooping;

        if (wasPlaying) {
          newAudio.play().catch(error => {
            console.warn(`[Audio] Failed to play updated audio ${audioKey}:`, error);
          });
        }

        existingAudio.pause();
        existingAudio.src = '';
        audioElementsRef.current.set(audioKey, newAudio);

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

  useEffect(() => {
    return () => {
      stopAllAudio();
      audioElementsRef.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioElementsRef.current.clear();
      loopingAudioRef.current.clear();
    };
  }, [stopAllAudio]);

  // NOTE: PAUSE_SLOT / RESUME_SLOT event listeners are registered inside the main
  // event-listener useEffect (around line 4810) together with all other custom events.
  // Do NOT add a second listener here — it would be a duplicate and cause double-stops.

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
  /** When false, incoming bg layer uses "start" state; we flip to true after one frame to run CSS transition. */
  const [bgTransitionRevealed, setBgTransitionRevealed] = useState(true);
  const [freeSpinAwardedCount, setFreeSpinAwardedCount] = useState(0);
  const [_announcementTransitionStyle, setAnnouncementTransitionStyle] = useState<'fade' | 'slide' | 'zoom' | 'dissolve'>('fade');
  const [_announcementTransitionDuration, setAnnouncementTransitionDuration] = useState<number>(3);
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
    const convertToPercentage = (pos: { x: number; y: number } | undefined, defaultPos: { x: number; y: number }) => {
      if (!pos) return defaultPos;
      if (pos.x < 0 || pos.x > 100 || pos.y < 0 || pos.y > 100) {
        return defaultPos;
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

  const [winDisplayTextConfig, setWinDisplayTextConfig] = useState({
    positions: (config as any).winDisplayTextPositions || {
      desktop: { x: 50, y: 50 },
      mobilePortrait: { x: 50, y: 50 },
      mobileLandscape: { x: 50, y: 50 }
    },
    scales: (config as any).winDisplayTextScales || {
      desktop: 100,
      mobilePortrait: 100,
      mobileLandscape: 100
    },
    showWinText: (config as any).showWinText !== undefined ? (config as any).showWinText : true
  });

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

    setWinDisplayTextConfig(() => ({
      positions: (config as any).winDisplayTextPositions || {
        desktop: { x: 50, y: 50 },
        mobilePortrait: { x: 50, y: 50 },
        mobileLandscape: { x: 50, y: 50 }
      },
      scales: (config as any).winDisplayTextScales || {
        desktop: 100,
        mobilePortrait: 100,
        mobileLandscape: 100
      },
      showWinText: (config as any).showWinText !== undefined ? (config as any).showWinText : true
    }));
  }, [
    (config as any).winDisplayPositions,
    (config as any).winDisplayScales,
    (config as any).winDisplayTextPositions,
    (config as any).winDisplayTextScales,
    (config as any).showWinText
  ]);
  const [gridAdjustments, setGridAdjustments] = useState({
    position: (config as any).gridPosition || { x: 0, y: 0 },
    scale: (config as any).gridScale || 120,
    stretch: (config as any).gridStretch || { x: 100, y: 100 },
    showSymbolGrid: (config as any).showSymbolBackgrounds !== true
  });
  const symbolGridBackgroundRef = useRef<PIXI.Graphics | null>(null);
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
  const reelsRef = useRef(reels);
  const rowsRef = useRef(rows);
  const renderSizeRef = useRef(renderSize);
  const gridAdjustmentsRef = useRef(gridAdjustments);
  const frameConfigRef = useRef(frameConfig);

  reelsRef.current = reels;
  rowsRef.current = rows;
  renderSizeRef.current = renderSize;
  gridAdjustmentsRef.current = gridAdjustments;
  frameConfigRef.current = frameConfig;
  const outerFrameSpriteRef = useRef<PIXI.Sprite | null>(null);
  const reelDividerSpritesRef = useRef<PIXI.Sprite[]>([]);
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
  const screenShakeRef = useRef({ x: 0, y: 0 });
  const glowEffectsRef = useRef<Map<PIXI.Container, PIXI.Graphics>>(new Map());
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'mobile-landscape'>('desktop');

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
  currentDeviceRef.current = currentDevice;
  if (!logoSyncTimeoutRef.current) {
    logoPositionsRef.current = logoPositions;
    logoScalesRef.current = logoScales;
  }
  useEffect(() => {
    freeSpinModeRef.current = isInFreeSpinMode;
  }, [isInFreeSpinMode]);
  useEffect(() => {
    freeSpinsRemainingRef.current = freeSpinsRemaining;
  }, [freeSpinsRemaining]);
  useEffect(() => {
    animationSettingsRef.current = animationSettings;
  }, [animationSettings]);

  // === SPINE ANIMATION LIFECYCLE ===
  // Initialize Spine character when ready
  useEffect(() => {
    // Wait for app to be initialized  
    if (!appRef.current) return;

    // Delay loading slightly to ensure stage is ready
    const timeoutId = setTimeout(() => {
      loadSpineCharacter();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadSpineCharacter]);

  // Trigger win celebration animation when win occurs
  useEffect(() => {
    if (winAmount > 0 && showWinDisplay) {
      console.log('[Spine] Win detected, playing celebration animation');
      playSpineAnimation('win');
    }
  }, [winAmount, showWinDisplay, playSpineAnimation]);

  // Cleanup Spine on unmount
  useEffect(() => {
    return () => {
      cleanupSpineCharacter();
    };
  }, [cleanupSpineCharacter]);

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
    const maxBet = Math.min(balance, 100);
    setBetAmount(maxBet);
  }, [balance, setBetAmount]);

  const clearWinLines = useCallback(() => {
    winLinesRef.current.forEach(({ shadowLine, lineGraphics, mask, gradient }) => {
      const line = lineGraphics || shadowLine;
      if (line && !line.destroyed) {
        gsap.killTweensOf(line);
        if (line.parent) {
          line.parent.removeChild(line);
        }
        line.destroy({ children: true });
      }
      if (mask && !mask.destroyed) {
        gsap.killTweensOf(mask);
        if (mask.parent) {
          mask.parent.removeChild(mask);
        }
        mask.destroy({ children: true });
      }
      if (gradient && typeof (gradient as any).destroy === 'function') {
        (gradient as any).destroy();
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

    const first = symbolContainer.children[0] as PIXI.Sprite;
    const spine = symbolContainer.children.length > 1 ? (symbolContainer.children[1] as Spine) : null;
    const visible = spine?.visible ? spine : first;
    if (!visible || (visible as any).destroyed) return null;

    return { sprite: visible as PIXI.Sprite, container: symbolContainer };
  }, [rows]);

  // Reset sprite (or Spine) to original transform
  const resetSpriteTransform = useCallback((sprite: PIXI.Sprite | Spine, _container: PIXI.Container, originalTransform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    alpha: number;
    anchorX?: number;
    anchorY?: number;
  }) => {
    if (originalTransform.anchorX !== undefined && originalTransform.anchorY !== undefined && 'anchor' in sprite && sprite.anchor) {
      sprite.anchor.set(originalTransform.anchorX, originalTransform.anchorY);
    }

    sprite.x = originalTransform.x;
    sprite.y = originalTransform.y;
    sprite.scale.set(originalTransform.scaleX, originalTransform.scaleY);
    sprite.rotation = originalTransform.rotation;
    sprite.alpha = originalTransform.alpha;

    if (sprite.filters && sprite.filters.length > 0) {
      sprite.filters = [];
    }
  }, []);

  const cleanupSymbolAnimations = useCallback(() => {
    activeSymbolAnimationsRef.current.forEach((anim, key) => {
      if (anim.timeline) {
        anim.timeline.kill();
      }
      resetSpriteTransform(anim.sprite, anim.container, anim.originalTransform);
      activeSymbolAnimationsRef.current.delete(key);
    });
  }, [resetSpriteTransform]);

  const applySymbolAnimation = useCallback((
    sprite: PIXI.Sprite | Spine,
    container: PIXI.Container,
    animationTemplate: string,
    duration: number
  ) => {
    const hasAnchor = 'anchor' in sprite && sprite.anchor;
    const originalTransform = {
      x: sprite.x,
      y: sprite.y,
      scaleX: sprite.scale.x,
      scaleY: sprite.scale.y,
      rotation: sprite.rotation,
      alpha: sprite.alpha,
      anchorX: hasAnchor ? sprite.anchor.x : 0.5,
      anchorY: hasAnchor ? sprite.anchor.y : 0.5
    };

    const animKey = `${container.parent?.parent?.name || 'reel'}_${container.name || Date.now()}_${animationTemplate}`;

    const existingAnim = Array.from(activeSymbolAnimationsRef.current.entries()).find(
      ([_, anim]) => anim.sprite === sprite
    );
    if (existingAnim) {
      existingAnim[1].timeline.kill();
      resetSpriteTransform(existingAnim[1].sprite, existingAnim[1].container, existingAnim[1].originalTransform);
      activeSymbolAnimationsRef.current.delete(existingAnim[0]);
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        resetSpriteTransform(sprite, container, originalTransform);
        activeSymbolAnimationsRef.current.delete(animKey);
      }
    });
    let repeatCount = 0;
    let cycleDuration = 0.5;

    switch (animationTemplate) {
      case 'bounce':
        cycleDuration = 0.8;
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
        cycleDuration = 1.2;
        repeatCount = Math.max(1, Math.floor(duration / cycleDuration));

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
        cycleDuration = 1.6;
        repeatCount = Math.max(1, Math.floor(duration / cycleDuration));

        try {
          const glowFilter = new GlowFilter({
            distance: 15,
            outerStrength: 0,
            color: 0xFFD700,
            quality: 0.5
          });
          sprite.filters = [glowFilter];

          timeline.to(glowFilter, {
            outerStrength: 2,
            duration: 0.8,
            ease: "power2.inOut",
            yoyo: true,
            repeat: repeatCount,
            onComplete: () => {
              if (sprite.filters) {
                sprite.filters = sprite.filters.filter(f => f !== glowFilter);
              }
            }
          });
        } catch (error) {
          console.warn('[Symbol Animation] GlowFilter not available, using fallback:', error);
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
        const hasAnchor = 'anchor' in sprite && sprite.anchor;
        const currentAnchorX = hasAnchor ? sprite.anchor.x : 0.5;
        const currentAnchorY = hasAnchor ? sprite.anchor.y : 0.5;
        const spriteWidth = (sprite as PIXI.Sprite).width ?? (sprite as PIXI.Sprite).texture?.width ?? symbolSizeRef.current ?? 100;
        const spriteHeight = (sprite as PIXI.Sprite).height ?? (sprite as PIXI.Sprite).texture?.height ?? symbolSizeRef.current ?? 100;
        const anchorOffsetX = (0.5 - currentAnchorX) * spriteWidth;
        const anchorOffsetY = (0.5 - currentAnchorY) * spriteHeight;

        if (hasAnchor) sprite.anchor.set(0.5, 0.5);
        sprite.x = originalTransform.x + anchorOffsetX;
        sprite.y = originalTransform.y + anchorOffsetY;

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
      filters: sprite.filters ? [...sprite.filters] : undefined
    });
  }, [resetSpriteTransform]);



  // Helper to get animation config - reads from store at call time, normalizes symbol keys
  const getAnimationConfigForSymbol = useCallback((symbolKey: string) => {
    const latestConfig = useGameStore.getState().config;
    const symbolAnimations = latestConfig?.winAnimations?.symbolAnimations;
    if (!symbolAnimations || typeof symbolAnimations !== 'object') return null;
    const keysToTry = [
      symbolKey,
      symbolKey.replace(/([a-z]+)(\d+)/, '$1_$2'),
      symbolKey.replace(/_/g, ''),
      symbolKey.replace(/([a-z]+)_(\d+)/, '$1$2')
    ];
    for (const k of keysToTry) {
      const cfg = symbolAnimations[k];
      if (cfg?.animationTemplate) return cfg;
    }
    return null;
  }, []);

  // Apply winning symbol animations (reads config from store at call time to avoid stale closure)
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
    winningSpineInstancesRef.current.clear();
    const latestConfig = useGameStore.getState().config;
    const betlineConfig = (latestConfig as any)?.betlineConfig || {};
    const betlineSequential = betlineConfig.sequential !== undefined ? betlineConfig.sequential : true;
    const betlineSpeed = betlineConfig.speed || 1.0;
    const pauseBetweenLines = betlineConfig.pauseBetweenLines || 0.3;

    const fadeInDuration = betlineSpeed * 0.5;
    const displayDuration = betlineSpeed * 2.5;
    const fadeOutDuration = betlineSpeed * 0.5;
    const betlineTotalDuration = fadeInDuration + displayDuration + fadeOutDuration;

    const applyForWinDetail = (winDetail: typeof winDetails[number]) => {
      winDetail.positions.forEach(({ reel, row }, idx) => {
        const spriteData = getSpriteAtPosition(reel, row);
        if (!spriteData) return;

        const spriteOrSpine = spriteData.sprite;

        // If this cell shows a Spine (uploaded sprite symbol), play its win animation and update it for the win duration.
        // Includes e.g. wild when win is high1+wild+high1 and wild is uploaded as Spine.
        if (spriteOrSpine instanceof Spine) {
          const spine = spriteOrSpine;
          const anims = spine.skeleton?.data?.animations;
          if (anims?.length) {
            const winNames = ['win', 'celebrate', 'action', 'victory', 'happy', 'cheer'];
            const winAnim = winNames.find((n) => anims.some((a: { name: string }) => a.name === n));
            const winName = winAnim || anims[0].name;
            spine.state?.setAnimation(0, winName, false);
            winningSpineInstancesRef.current.add(spine);
            const idleName = anims.find((a: { name: string }) => a.name === 'idle')?.name ?? anims[0].name;
            setTimeout(() => {
              spine.state?.setAnimation(0, idleName, true);
              winningSpineInstancesRef.current.delete(spine);
            }, betlineTotalDuration * 1000);
          }
        }

        // Use actual symbol at this position (e.g. 'wild' or 'high1'), not just winning symbol type.
        // When wild substitutes, winDetail.symbol is 'high1' but the wild cell should use wild's animation.
        const actualSymbolAtPosition = winDetail.symbols[idx];
        const animationConfig = actualSymbolAtPosition
          ? getAnimationConfigForSymbol(actualSymbolAtPosition)
          : getAnimationConfigForSymbol(winDetail.symbol);

        if (animationConfig?.animationTemplate) {
          applySymbolAnimation(
            spriteOrSpine,
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
      winDetails.forEach((winDetail) => applyForWinDetail(winDetail));
    }
  }, [getAnimationConfigForSymbol, getSpriteAtPosition, applySymbolAnimation]);

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
    const betlineSpeed = betlineConfig.speed || 1.0;
    const betlineSequential = betlineConfig.sequential !== undefined ? betlineConfig.sequential : true;
    const pauseBetweenLines = betlineConfig.pauseBetweenLines || 0.3;
    const symbolHighlight = betlineConfig.symbolHighlight !== undefined ? betlineConfig.symbolHighlight : true;
    const symbolHighlightDuration = betlineConfig.symbolHighlightDuration || 1.5;

    // Thin line so glow comes from filter, not from thick stroke
    const coreLineWidth = Math.min(Math.max(betlineWidth, 1.5), 3);
    const glowExpand = 8;

    const configColors = betlineConfig.colors || [];
    const defaultLineColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFA500, 0x800080];
    const lineColors = configColors.length > 0
      ? configColors.map((color: string) => {
        if (typeof color === 'string' && color.startsWith('#')) {
          return parseInt(color.replace('#', ''), 16);
        }
        return typeof color === 'number' ? color : 0xFF0000;
      })
      : defaultLineColors;

    let betlinePatterns = (config.reels as any)?.betlinePatterns;
    const betlines = config.reels?.betlines || 20;

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

    const w = renderSize.width;
    const h = renderSize.height;

    let uiButtonHeight = 0;
    if (uiControlsRef.current) {
      const uiRect = uiControlsRef.current.getBoundingClientRect();
      uiButtonHeight = uiRect.height;
    } else {
      uiButtonHeight = 100;
    }
    const availableHeight = h - uiButtonHeight;
    const symbolWidth = Math.floor((w * 0.8) / currentReels);
    const symbolHeight = Math.floor((availableHeight * 0.8) / currentRows);
    let size = Math.min(symbolWidth, symbolHeight);

    const scaleFactor = gridAdjustments.scale / 120;
    size = size * scaleFactor;

    const baseSpacingX = size * 1.05 * (gridAdjustments.stretch.x / 100);
    const spacingY = size * 1.05 * (gridAdjustments.stretch.y / 100);

    const spacingX = baseSpacingX + (frameConfig.reelGap || 0);

    const totalWidth = currentReels * spacingX;
    const totalHeight = currentRows * spacingY;
    let offsetX = (w - totalWidth) / 2;
    let offsetY = (availableHeight - totalHeight) / 2;

    // Apply grid position adjustments
    offsetX += gridAdjustments.position.x;
    offsetY += gridAdjustments.position.y;
    const drawSingleLine = (
      detail: typeof winDetails[0],
      idx: number,
      lineDelay: number = 0
    ) => {
      if (!detail.positions || detail.positions.length === 0) return;

      const color = lineColors[idx % lineColors.length];
      const linePattern = betlinePatterns?.[detail.line - 1];

      if (!linePattern) return;

      const shouldDrawLines = winAnimationType === 'lines' || winAnimationType === 'both' || winAnimationType === 'curvedLines';
      const shouldDrawSquares = winAnimationType === 'squares' || winAnimationType === 'both';

      const points: Array<{ x: number, y: number }> = [];
      for (let reel = 0; reel < currentReels; reel++) {
        const row = linePattern[reel];

        // Validate row index
        if (row < 0 || row >= currentRows) {
          console.warn(`[Draw Win Lines] Invalid row ${row} for reel ${reel} in betline ${detail.line - 1}`);
          continue;
        }

        const centerX = offsetX + reel * spacingX + size / 2;
        const centerY = offsetY + row * spacingY + size / 2;
        points.push({ x: centerX, y: centerY });
      }

      if (points.length < 2) return;
      if (shouldDrawSquares) {
        detail.positions.forEach((pos) => {
          // Validate position is within current grid bounds
          if (pos.reel < 0 || pos.reel >= currentReels || pos.row < 0 || pos.row >= currentRows) {
            console.warn(`[Draw Win Lines] Skipping invalid highlight position: reel ${pos.reel}, row ${pos.row} (grid: ${currentReels}x${currentRows})`);
            return;
          }

          const highlight = new PIXI.Graphics();
          highlight.roundRect(
            offsetX + pos.reel * spacingX - 3,
            offsetY + pos.row * spacingY - 3,
            size + 6,
            size + 6,
            6
          ).fill({ color, alpha: 0.2 });

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

      if (shouldDrawLines) {
        // Thin glowing line: one thin stroke + GlowFilter so it glows from all sides, not a solid bar
        const lineGraphics = new PIXI.Graphics();
        lineGraphics.blendMode = 'add';

        const lineColor = lineColors[idx % lineColors.length];
        const r = (lineColor >> 16) & 0xFF;
        const g = (lineColor >> 8) & 0xFF;
        const b = lineColor & 0xFF;

        const drawSmoothCurve = (g: PIXI.Graphics, pts: { x: number, y: number }[]) => {
          if (pts.length < 2) return;

          g.moveTo(pts[0].x, pts[0].y);

          if (pts.length === 2) {
            g.lineTo(pts[1].x, pts[1].y);
            return;
          }

          for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[Math.max(0, i - 1)];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[Math.min(pts.length - 1, i + 2)];

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
          }
        };

        // Gradient: tail faded → leading bright (softer alphas so it reads as light, not solid)
        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        const midY = points.reduce((s, p) => s + p.y, 0) / points.length;
        const tailGradient = new FillGradient({
          type: 'linear',
          start: { x: minX, y: midY },
          end: { x: maxX, y: midY },
          colorStops: [
            { offset: 0, color: `rgba(${r},${g},${b},0.12)` },
            { offset: 0.4, color: `rgba(255,245,200,0.35)` },
            { offset: 0.75, color: `rgba(255,250,220,0.7)` },
            { offset: 1, color: 'rgba(255,255,255,0.95)' }
          ],
          textureSpace: 'global'
        });

        // Single thin line; GlowFilter makes it glow from all sides
        drawSmoothCurve(lineGraphics, points);
        lineGraphics.stroke({
          width: coreLineWidth,
          fill: tailGradient,
          cap: 'round',
          join: 'round'
        });
        try {
          const glowFilter = new GlowFilter({
            distance: glowExpand,
            outerStrength: 2.2,
            innerStrength: 0.4,
            color: lineColor,
            quality: 0.2
          });
          lineGraphics.filters = [glowFilter];
        } catch {
          lineGraphics.filters = [new PIXI.BlurFilter({ strength: 4, quality: 2 })];
        }

        if (appRef.current) {
          appRef.current.stage.addChild(lineGraphics);
        }
        const maskHeight = totalHeight + size * 2;
        const revealMask = new PIXI.Graphics();
        revealMask.rect(0, -size, spacingX * 2, maskHeight).fill(0xFFFFFF);

        // Position mask initially
        // Start far left
        const startX = offsetX - (spacingX * 2);
        const endX = offsetX + (currentReels * spacingX) + spacingX;

        revealMask.x = startX;
        revealMask.y = offsetY - size;
        lineGraphics.mask = revealMask;

        if (appRef.current) {
          appRef.current.stage.addChild(revealMask);
        }

        // Track for cleanup (destroy gradient to avoid memory leaks)
        winLinesRef.current.push({ shadowLine: lineGraphics, lineGraphics, mask: revealMask, gradient: tailGradient });
        const animationDuration = (betlineSpeed || 0.8) * 2; // Double the duration to slow it down 

        gsap.fromTo(revealMask,
          { x: startX },
          {
            x: endX,
            duration: animationDuration,
            delay: lineDelay + (betlineSequential ? 0 : idx * 0.1),
            ease: 'power2.out', // Fast start, smooth settle - beam traveling through symbols
            onComplete: () => {
              gsap.to(lineGraphics, {
                alpha: 0,
                duration: 0.3,
                onComplete: () => {
                  gsap.killTweensOf([lineGraphics, revealMask]);
                  if (lineGraphics.parent) lineGraphics.parent.removeChild(lineGraphics);
                  if (revealMask.parent) revealMask.parent.removeChild(revealMask);
                  lineGraphics.destroy({ children: true });
                  revealMask.destroy({ children: true });
                  tailGradient.destroy();

                  winLinesRef.current = winLinesRef.current.filter(
                    item => item.shadowLine !== lineGraphics
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

        // Subtle glow pulse
        gsap.to(lineGraphics, {
          alpha: 0.92,
          duration: 0.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1
        });
      }
    };

    if (betlineSequential && winDetails.length > 1) {
      let completedLines = 0;
      const totalLines = winDetails.length;

      winDetails.forEach((detail, idx) => {
        const lineDelay = idx * (betlineSpeed + pauseBetweenLines);

        setTimeout(() => {
          drawSingleLine(detail, idx, 0);

          // Track completion
          completedLines++;
          if (completedLines === totalLines) {
            if (onComplete) {
              const totalAnimationTime = betlineSpeed * totalLines + pauseBetweenLines * (totalLines - 1);
              setTimeout(() => {
                if (winAnimationCompleteCallbackRef.current) {
                  winAnimationCompleteCallbackRef.current();
                  winAnimationCompleteCallbackRef.current = null;
                }
              }, totalAnimationTime * 1000 + 500);
            }
          }
        }, lineDelay * 1000);
      });
    } else {
      winDetails.forEach((detail, idx) => {
        drawSingleLine(detail, idx, 0);
      });
    }
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
    const allKeys = symbolKeys;
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
          break;
        }
      }
    }

    if (winningSymbolKey === null && matchCount >= 3) {
      winningSymbolKey = 'wild';
    }

    if (winningSymbolKey === 'scatter' || winningSymbolKey === 'bonus' || winningSymbolKey === 'holdspin') {
      return { amount: 0, count: 0, symbol: null };
    }

    if (matchCount >= 3 && winningSymbolKey) {
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
    const betlines = config.reels?.betlines || 20;

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

      if (lineSymbols.length !== currentReels) {
        console.warn(`[Win Detection] Incomplete line ${lineIndex}: only ${lineSymbols.length}/${currentReels} symbols extracted`);
        continue;
      }

      // Check for winning combinations on this line
      const lineWin = checkLineWin(lineSymbols, betAmount / activeBetlines, symbolPaytable);

      if (lineWin.amount > 0) {
        totalWin += lineWin.amount;
        const winPositions = linePositions.slice(0, lineWin.count);

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
    const w = renderSizeRef.current.width;
    const h = renderSizeRef.current.height;
    const currentReels = reelsRef.current;
    const currentRows = rowsRef.current;
    const { position, scale, stretch } = gridAdjustmentsRef.current;
    const currentReelGap = frameConfigRef.current.reelGap || 0;

    let uiButtonHeight = 0;
    if (uiControlsRef.current) {
      const uiRect = uiControlsRef.current.getBoundingClientRect();
      uiButtonHeight = uiRect.height;
    } else {
      uiButtonHeight = 100;
    }

    const availableHeight = h - uiButtonHeight;
    const symbolWidth = Math.floor((w * 0.8) / currentReels);
    const symbolHeight = Math.floor((availableHeight * 0.8) / currentRows);
    let size = Math.min(symbolWidth, symbolHeight);
    symbolSizeRef.current = size;
    const scaleFactor = scale / 120;
    size = size * scaleFactor;

    // Apply grid stretch
    const baseSpacingX = size * 1.05 * (stretch.x / 100);
    const spacingY = size * 1.05 * (stretch.y / 100);

    const spacingX = baseSpacingX + currentReelGap;

    const totalWidth = currentReels * spacingX;
    const totalHeight = currentRows * spacingY;
    const freespinSpacingY = spacingY - 5;
    let offsetX = (w - totalWidth) / 2;
    let offsetY = (availableHeight - totalHeight) / 2;

    offsetX += position.x;
    offsetY += position.y;

    return {
      size,
      spacingX,
      spacingY,
      freespinSpacingY,
      offsetX,
      offsetY,
    };
  }, []);

  useEffect(() => {
    computeResponsiveMetricsRef.current = computeResponsiveMetrics;
  }, [computeResponsiveMetrics]);

  const preloadTextures = useCallback(async () => {
    await SymbolPreloader.waitForReady();

    const map: Record<string, PIXI.Texture> = {};
    const spineAssets = symbolSpineAssets;

    for (const [k, url] of Object.entries(symbols)) {
      if (spineAssets[k]) continue;
      if (!url || url === '') {
        console.warn(`⚠️ Symbol ${k} has empty URL, skipping`);
        continue;
      }

      // Prefer texture for this config URL (uploaded/custom) so spin always uses new symbols
      let texture = SymbolPreloader.getTexture(url) || null;
      if (!texture) {
        texture = await SymbolPreloader.waitForSymbol(url, 10000);
        if (!texture) {
          try {
            const newTexture = await Assets.load(url) as PIXI.Texture;
            if (newTexture) texture = newTexture;
          } catch (error) {
            console.error(`[SlotMachine] Failed to load symbol ${k}:`, error);
          }
        }
      }
      if (!texture) {
        texture = SymbolPreloader.getTexture(k) || null;
      }
      if (texture) {
        map[k] = texture;
      } else {
        console.warn(`⚠️ Symbol ${k} not available, using fallback`);
        map[k] = PIXI.Texture.WHITE;
      }
    }

    texturesRef.current = map;
  }, [symbols, symbolSpineAssets]);

  // Defer destroy pool instances and unload PIXI asset IDs after 2 rAFs to avoid BatcherPipe/crash
  const deferDestroyPoolAndUnload = (key: string, pool: Spine[], toUnload: { skel: string; atlas: string; texture?: string }) => {
    const toDestroy = [...pool];
    toDestroy.forEach(s => {
      if (s && !(s as any).destroyed && s.parent) {
        s.parent.removeChild(s);
        s.visible = false;
      }
    });
    spineSymbolPoolRef.current.set(key, []);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toDestroy.forEach(s => {
          try {
            if (s && !(s as any).destroyed) s.destroy({ children: true });
          } catch (_) { /* already destroyed, ignore */ }
        });
        const ids: string[] = [toUnload.skel, toUnload.atlas, toUnload.texture].filter((id): id is string => Boolean(id));
        if (ids.length > 0) PIXI.Assets.unload(ids);
      });
    });
  };

  // Load Spine assets for animated symbols (same format as character: atlas, skel, texture)
  const loadSpineSymbolAssets = useCallback(async () => {
    const raw = useGameStore.getState().config?.theme?.generated?.symbols;
    const assets: Record<string, SymbolSpineAsset> = {};
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      for (const [k, v] of Object.entries(raw)) {
        if (v && typeof v === 'object' && 'atlasUrl' in v) assets[k] = v as SymbolSpineAsset;
      }
    }
    const currentKeys = Object.keys(assets);
    const ids = spineSymbolAssetIdsRef.current;
    const lastUrls = lastSpineSymbolUrlsRef.current;

    let didTeardown = false;

    // Remove Spine symbols that are no longer in config: destroy pool and unload PIXI assets (deferred)
    const existingKeys = Object.keys(ids);
    for (const key of existingKeys) {
      if (currentKeys.includes(key)) continue;
      didTeardown = true;
      const prev = ids[key];
      const pool = spineSymbolPoolRef.current.get(key) || [];
      if (prev) deferDestroyPoolAndUnload(key, pool, prev);
      delete ids[key];
      delete lastUrls[key];
    }

    for (const key of currentKeys) {
      const asset = assets[key];
      if (!asset?.atlasUrl || !asset.skelUrl || !asset.textureUrl || !asset.textureName) continue;
      const urlKey = `${asset.atlasUrl}|${asset.skelUrl}`;
      if (lastUrls[key] === urlKey && ids[key]) continue;

      try {
        didTeardown = true;
        const prev = ids[key];
        const pool = spineSymbolPoolRef.current.get(key);
        if (pool && pool.length > 0) {
          const toDestroy = [...pool];
          toDestroy.forEach(s => {
            if (s && !(s as any).destroyed && s.parent) {
              s.parent.removeChild(s);
              s.visible = false;
            }
          });
          spineSymbolPoolRef.current.set(key, []);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              toDestroy.forEach(s => {
                try {
                  if (s && !(s as any).destroyed) s.destroy({ children: true });
                } catch (_) { /* already destroyed, ignore */ }
              });
            });
          });
        }

        const unique = `sym_${key}_${Date.now()}`;
        const skelId = `spine_sym_skel_${unique}`;
        const atlasId = `spine_sym_atlas_${unique}`;
        const texId = `spine_sym_tex_${unique}`;

        PIXI.Assets.add({ alias: skelId, src: asset.skelUrl, parser: 'spineSkeletonLoader' });
        PIXI.Assets.add({ alias: texId, src: asset.textureUrl, parser: 'loadTextures' });
        const loadedTex = await PIXI.Assets.load(texId) as PIXI.Texture;
        const textureSource = loadedTex?.source ?? null;
        PIXI.Assets.add({
          alias: atlasId,
          src: asset.atlasUrl,
          parser: 'spineTextureAtlasLoader',
          data: { images: textureSource ? { [asset.textureName]: textureSource } : { [asset.textureName]: asset.textureUrl } }
        });
        await PIXI.Assets.load([skelId, atlasId]);

        ids[key] = { skel: skelId, atlas: atlasId, texture: texId };
        lastUrls[key] = urlKey;

        // Deferred unload of previous asset IDs for this key (avoids memory leak when replacing zip)
        if (prev) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const toUnload: string[] = [prev.skel, prev.atlas, prev.texture].filter((id): id is string => Boolean(id));
              if (toUnload.length > 0) PIXI.Assets.unload(toUnload);
            });
          });
        }
      } catch (err) {
        console.error(`[SlotMachine] Failed to load Spine symbol ${key}:`, err);
      }
    }

    if (didTeardown) {
      spineTeardownInProgressRef.current = true;
      const app = appRef.current;
      if (app?.ticker) app.ticker.stop();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            spineTeardownInProgressRef.current = false;
            if (appRef.current?.ticker) appRef.current.ticker.start();
          });
        });
      });
    }
  }, []);

  /** Scale a Spine instance to fit inside a single symbol cell and center it (pixelSize x pixelSize). */
  function scaleSpineToFitCell(spine: Spine, pixelSize: number) {
    if (!spine || (spine as any).destroyed || !spine.skeleton) return;
    spine.update(0);
    const b = spine.bounds as { width?: number; height?: number; maxX?: number; minX?: number; maxY?: number; minY?: number };
    const minX = b?.minX ?? 0;
    const minY = b?.minY ?? 0;
    const maxX = b?.maxX ?? minX;
    const maxY = b?.maxY ?? minY;
    const w = (b?.width ?? (maxX - minX)) || 0;
    const h = (b?.height ?? (maxY - minY)) || 0;
    const maxDim = Math.max(w, h, 1);
    const scale = maxDim > 0 ? pixelSize / maxDim : pixelSize / 100;
    spine.scale.set(scale);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    spine.x = pixelSize / 2 - scale * centerX;
    spine.y = pixelSize / 2 - scale * centerY;
  }

  function getSpineFromPool(symbolKey: string, pixelSize: number): Spine | null {
    const ids = spineSymbolAssetIdsRef.current[symbolKey];
    if (!ids) return null;
    let pool = spineSymbolPoolRef.current.get(symbolKey);
    if (!pool) spineSymbolPoolRef.current.set(symbolKey, (pool = []));
    let spine: Spine | null = null;
    while (pool.length > 0) {
      const candidate = pool.shift()!;
      if (candidate && !(candidate as any).destroyed && candidate.skeleton) {
        spine = candidate;
        break;
      }
    }
    if (!spine) {
      try {
        spine = Spine.from({ skeleton: ids.skel, atlas: ids.atlas });
      } catch (e) {
        console.warn('[SlotMachine] Spine.from failed for', symbolKey, e);
        return null;
      }
    }
    spine.visible = true;
    const anims = spine.skeleton?.data?.animations;
    if (anims?.length) {
      const name = anims.find((a: { name: string }) => a.name === 'idle')?.name ?? anims[0].name;
      spine.state?.setAnimation(0, name, true);
    }
    scaleSpineToFitCell(spine, pixelSize);
    (spine as any).__symbolKey = symbolKey;
    return spine;
  }

  function returnSpineToPool(symbolKey: string, spine: Spine) {
    if (!spine || (spine as any).destroyed) return;
    if (spine.parent) spine.parent.removeChild(spine);
    spine.visible = false;
    let pool = spineSymbolPoolRef.current.get(symbolKey);
    if (!pool) spineSymbolPoolRef.current.set(symbolKey, (pool = []));
    pool.push(spine);
  }

  const updateBackground = useCallback((url: string | null, adjustments?: {
    position?: { x: number; y: number };
    scale?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  }) => {
    const app = appRef.current;
    if (!app) return;

    if (backgroundSpriteRef.current) {
      app.stage.removeChild(backgroundSpriteRef.current);
      backgroundSpriteRef.current.destroy();
      backgroundSpriteRef.current = null;
    }

    if (!url) {
      return;
    }

    Assets.load(url).then((texture: PIXI.Texture) => {
      if (!appRef.current) return;
      const app = appRef.current;
      try {
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
        sprite.anchor.set(0.5);
        sprite.x = symbolAreaX + symbolAreaWidth / 2 + pos.x;
        sprite.y = symbolAreaY + symbolAreaHeight / 2 + pos.y;

        // Create mask to constrain background to symbol area
        const bgMask = new PIXI.Graphics();
        bgMask.rect(symbolAreaX, symbolAreaY, symbolAreaWidth, symbolAreaHeight).fill(0xffffff);
        app.stage.addChild(bgMask);
        sprite.mask = bgMask;

        // Add to stage at the bottom (behind everything)
        app.stage.addChildAt(sprite, 0);
        backgroundSpriteRef.current = sprite;
      } catch (error) {
        console.error('Error loading background image:', error);
      }
    }).catch((error) => {
      console.error('Error loading background image:', error);
    });
  }, [backgroundAdjustments, reels, rows, computeResponsiveMetrics]);

  function renderReelFinal(_reelIndex: number, symbolsArr: string[] | undefined, rc: PIXI.Container, metrics: any) {
    // Visual polish: Remove blur filter when reel stops
    const blurFilter = blurFiltersRef.current.get(rc);
    if (blurFilter && rc.filters) {
      rc.filters = rc.filters.filter(f => f !== blurFilter);
      blurFiltersRef.current.delete(rc);
    }
    const keys = isInFreeSpinMode && config.bonus?.freeSpins?.retriggers === false
      ? symbolKeys.filter(key => key !== 'scatter')
      : symbolKeys;
    if (!symbolsArr || symbolsArr.length === 0) {
      symbolsArr = Array.from({ length: rows }, () => keys[Math.floor(Math.random() * keys.length)]);
    }

    const totalSprites = rc.children.length;
    const hasBufferSprites = totalSprites >= rows + 2;
    const spineAssets = symbolSpineAssets;
    const pixelSize = Math.round(metrics.size);

    for (let childIndex = 0; childIndex < totalSprites; childIndex++) {
      const symbolContainer = rc.children[childIndex] as PIXI.Container;
      if (!symbolContainer || symbolContainer.children.length === 0) continue;

      const sprite = symbolContainer.children[0] as PIXI.Sprite;
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

      if (spineAssets[sym]) {
        let spine = symbolContainer.children.length > 1 ? (symbolContainer.children[1] as Spine) : null;
        if (spine && ((spine as any).destroyed || !spine.skeleton)) {
          symbolContainer.removeChild(spine);
          returnSpineToPool((spine as any).__symbolKey ?? sym, spine);
          spine = null;
        }
        if (!spine) {
          spine = getSpineFromPool(sym, pixelSize);
          if (spine) symbolContainer.addChild(spine);
        }
        if (spine) {
          sprite.visible = false;
          spine.visible = true;
          scaleSpineToFitCell(spine, pixelSize);
        }
      } else {
        if (symbolContainer.children.length > 1) {
          const existingSpine = symbolContainer.children[1] as Spine;
          symbolContainer.removeChild(existingSpine);
          const poolKey = (existingSpine as any).__symbolKey ?? sym;
          returnSpineToPool(poolKey, existingSpine);
        }
        sprite.visible = true;
        const targetTexture = texturesRef.current[sym] || PIXI.Texture.WHITE;
        if (sprite.texture !== targetTexture) sprite.texture = targetTexture;
        sprite.width = pixelSize;
        sprite.height = pixelSize;
        sprite.x = 0;
        sprite.y = 0;
      }

      const targetX = 0;
      const targetY = hasBufferSprites ? (childIndex - 1) * metrics.spacingY : childIndex * metrics.spacingY;
      if (symbolContainer.x !== targetX || symbolContainer.y !== targetY) {
        symbolContainer.x = Math.round(targetX);
        symbolContainer.y = Math.round(targetY);
      }
    }
  }

  // GSAP-based spin animation helper
  function renderReelSpinning(rc: PIXI.Container, metrics: any, offsetPx: number, reelIndex: number) {
    const spacingY = metrics.spacingY;
    const totalSprites = rc.children.length;
    if (animationSettingsRef.current.visualEffects.spinBlur) {
      let blurFilter = blurFiltersRef.current.get(rc);
      if (!blurFilter) {
        blurFilter = new PIXI.BlurFilter({ strength: 0 });
        blurFiltersRef.current.set(rc, blurFilter);
        rc.filters = rc.filters ? [...rc.filters, blurFilter] : [blurFilter];
      }
    }
    if (!reelSymbolSequencesRef.current[reelIndex] || reelSymbolSequencesRef.current[reelIndex].length === 0) {
      const keys = isInFreeSpinMode && config.bonus?.freeSpins?.retriggers === false
        ? symbolKeys.filter(key => key !== 'scatter')
        : symbolKeys;

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
        ? symbolKeys.filter(key => key !== 'scatter')
        : symbolKeys;

      while (symbolSequence.length < minRequiredLength) {
        symbolSequence.push(availableKeys[Math.floor(Math.random() * availableKeys.length)]);
      }
    }

    // 3. RENDER LOOP (The Critical Fix)
    const spineAssets = symbolSpineAssets;
    const pixelSize = Math.round(metrics.size);

    for (let i = 0; i < totalSprites; i++) {
      const symbolContainer = rc.children[i] as PIXI.Container;
      if (!symbolContainer || symbolContainer.children.length === 0) continue;

      const sprite = symbolContainer.children[0] as PIXI.Sprite;
      const rawY = i * spacingY + offsetPx;
      const loopHeight = totalSprites * spacingY;
      const y = ((rawY % loopHeight) + loopHeight) % loopHeight - spacingY;

      symbolContainer.x = 0;
      symbolContainer.y = Math.round(y);
      const virtualIndex = Math.floor((offsetPx - y) / spacingY);

      const seqLen = symbolSequence.length;
      const wrappedIndex = ((virtualIndex % seqLen) + seqLen) % seqLen;

      const symbolKey = symbolSequence[wrappedIndex];

      if (spineAssets[symbolKey]) {
        let spine = symbolContainer.children.length > 1 ? (symbolContainer.children[1] as Spine) : null;
        if (spine && ((spine as any).destroyed || !spine.skeleton)) {
          symbolContainer.removeChild(spine);
          returnSpineToPool((spine as any).__symbolKey ?? symbolKey, spine);
          spine = null;
        }
        if (!spine) {
          spine = getSpineFromPool(symbolKey, pixelSize);
          if (spine) symbolContainer.addChild(spine);
        }
        if (spine) {
          sprite.visible = false;
          spine.visible = true;
          scaleSpineToFitCell(spine, pixelSize);
        }
      } else {
        if (symbolContainer.children.length > 1) {
          const existingSpine = symbolContainer.children[1] as Spine;
          symbolContainer.removeChild(existingSpine);
          returnSpineToPool((existingSpine as any).__symbolKey ?? symbolKey, existingSpine);
        }
        sprite.visible = true;
        const targetTexture = texturesRef.current[symbolKey] || PIXI.Texture.WHITE;
        if (sprite.texture !== targetTexture) {
          sprite.texture = targetTexture;
          sprite.width = pixelSize;
          sprite.height = pixelSize;
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

    if (freeSpinModeRef.current && freeSpinsConfig.retriggers === false) {
      return false;
    }

    const freeSpinsToAward = freeSpinsConfig.count || 10;

    if (!freeSpinModeRef.current) {
      freeSpinModeRef.current = true; // Update ref immediately
      freeSpinsRemainingRef.current = freeSpinsToAward; // Update ref immediately
      totalFreeSpinWinsRef.current = 0; // Reset accumulator when starting free spins
      setIsInFreeSpinMode(true);
      setFreeSpinsRemaining(freeSpinsToAward);
      setTotalFreeSpinWins(0); // Reset state accumulator
      playAudio('bonus', 'fs_start');
    } else {
      freeSpinsRemainingRef.current += freeSpinsToAward; // Update ref immediately
      setFreeSpinsRemaining(prev => prev + freeSpinsToAward);
      playAudio('bonus', 'fs_start');
    }

    setFreeSpinAwardedCount(freeSpinsToAward);

    const transitionStyle = (config as any)?.freespinTransition?.style || 'fade';
    const transitionDuration = (config as any)?.freespinTransition?.duration || 3;

    setAnnouncementTransitionStyle(transitionStyle);
    setAnnouncementTransitionDuration(transitionDuration);

    setShowFreeSpinAnnouncement(true);

    setTimeout(() => {
      setShowFreeSpinAnnouncement(false);
    }, transitionDuration * 1000);

    if (appRef.current && scatterPositions.length > 0) {
      scatterPositions.forEach((pos, idx) => {
        setTimeout(() => {
          const highlight = new PIXI.Graphics();
          const metrics = computeResponsiveMetrics();
          highlight.roundRect(
            metrics.offsetX + pos.reel * metrics.spacingX - 3,
            metrics.offsetY + pos.row * metrics.spacingY - 3,
            metrics.size + 6,
            metrics.size + 6,
            6
          ).fill({ color: 0xFF6B35, alpha: 0.8 }); // Orange glow for scatters

          if (appRef.current) {
            appRef.current.stage.addChild(highlight);
          }

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

  const triggerWheelBonus = useCallback((bonusCount: number, bonusPositions: Array<{ reel: number; row: number }>) => {
    const wheelConfig = config.bonus?.wheel;
    if (!wheelConfig?.enabled) return false;
    if (bonusCount < 3) return false;
    setShowWheelAnnouncement(true);

    setTimeout(() => {
      setShowWheelAnnouncement(false);
      setWheelRotation(0);
      setWheelSpinning(false);
      setWheelResult(null);
      setShowWheelBonus(true);
    }, 3000); // 3 second announcement display

    if (appRef.current && bonusPositions.length > 0) {
      bonusPositions.forEach((pos, idx) => {
        setTimeout(() => {
          const highlight = new PIXI.Graphics();
          const metrics = computeResponsiveMetrics();
          highlight.roundRect(
            metrics.offsetX + pos.reel * metrics.spacingX - 3,
            metrics.offsetY + pos.row * metrics.spacingY - 3,
            metrics.size + 6,
            metrics.size + 6,
            6
          ).fill({ color: 0xFFD700, alpha: 0.8 }); // Gold glow for bonus symbols

          if (appRef.current) {
            appRef.current.stage.addChild(highlight);
          }

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

  const initializePickAndClickGrid = useCallback(() => {
    const pickAndClickConfig = config.bonus?.pickAndClick;
    if (!pickAndClickConfig?.enabled) return;

    const gridSize = pickAndClickConfig.gridSize || [3, 3];
    const rows = gridSize[0];
    const cols = gridSize[1];
    const prizeValues = (pickAndClickConfig as any)?.prizeValues || [];
    const hasMultipliers = !!pickAndClickConfig.multipliers;
    const hasExtraPicks = !!pickAndClickConfig.extraPicks;

    const grid: Array<Array<{ type: 'prize' | 'extraPick' | 'multiplier'; value: number } | null>> = [];
    const revealed: Array<Array<boolean>> = [];

    const allCells: Array<{ type: 'prize' | 'extraPick' | 'multiplier'; value: number }> = [];

    for (let i = 0; i < rows * cols; i++) {
      const value = prizeValues[i] || 100;
      allCells.push({ type: 'prize', value });
    }

    if (hasExtraPicks && allCells.length > 0) {
      const extraPickIndex = Math.floor(Math.random() * allCells.length);
      allCells[extraPickIndex] = { type: 'extraPick', value: 0 };
    }

    if (hasMultipliers && allCells.length > 0) {
      let multiplierIndex = Math.floor(Math.random() * allCells.length);
      if (hasExtraPicks && allCells[multiplierIndex].type === 'extraPick') {
        multiplierIndex = (multiplierIndex + 1) % allCells.length;
      }
      const multiplierValue = [2, 3, 5][Math.floor(Math.random() * 3)];
      allCells[multiplierIndex] = { type: 'multiplier', value: multiplierValue };
    }

    for (let i = allCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
    }

    let cellIndex = 0;
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      revealed[r] = [];
      for (let c = 0; c < cols; c++) {
        if (cellIndex < allCells.length) {
          grid[r][c] = allCells[cellIndex];
        } else {
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

  const triggerPickAndClick = useCallback((bonusCount: number, bonusPositions: Array<{ reel: number; row: number }>) => {
    const pickAndClickConfig = config.bonus?.pickAndClick;
    if (!pickAndClickConfig?.enabled) return false;
    if (bonusCount < 3) return false;

    setShowPickAndClickAnnouncement(true);

    setTimeout(() => {
      setShowPickAndClickAnnouncement(false);
      initializePickAndClickGrid();
      setShowPickAndClick(true);
    }, 3000); // 3 second announcement display

    if (appRef.current && bonusPositions.length > 0) {
      bonusPositions.forEach((pos, idx) => {
        setTimeout(() => {
          const highlight = new PIXI.Graphics();
          const metrics = computeResponsiveMetrics();
          highlight.roundRect(
            metrics.offsetX + pos.reel * metrics.spacingX - 3,
            metrics.offsetY + pos.row * metrics.spacingY - 3,
            metrics.size + 6,
            metrics.size + 6,
            6
          ).fill({ color: 0xFFD700, alpha: 0.8 }); // Gold glow for bonus symbols

          if (appRef.current) {
            appRef.current.stage.addChild(highlight);
          }

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

  const handlePickAndClickCell = useCallback((row: number, col: number) => {
    if (pickAndClickPicksRemaining <= 0) return;
    if (pickAndClickRevealed[row]?.[col]) return; // Already revealed

    const cell = pickAndClickGrid[row]?.[col];
    if (!cell) return;

    const newRevealed = pickAndClickRevealed.map((r, rIdx) =>
      rIdx === row ? r.map((revealed, cIdx) => cIdx === col ? true : revealed) : r
    );
    setPickAndClickRevealed(newRevealed);

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

    if (newPicksRemaining <= 0) {
      setTimeout(() => {
        if (newTotalWin > 0) {
          const currentBalance = balance;
          setBalance(currentBalance + newTotalWin);
          setWinAmount(newTotalWin);

          const winTier = calculateWinTier(betAmount, newTotalWin);
          if (winTier !== 'small') {
            triggerParticleEffects(winTier);
          }

          setShowWinDisplay(true);
        }
        setTimeout(() => {
          setShowPickAndClick(false);
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
    if (isSpinning) {
      quickStopRef.current?.();
      return;
    }
    if (!symbolKeys.length) return;

    cleanupSymbolAnimations();

    playAudio('ui', 'ui_spin_press');

    if (!freeSpinModeRef.current) {
      if (balance < betAmount) {
        console.warn('Insufficient balance');
        return;
      }

      setBalance(balance - betAmount);
    } else {
      const newCount = freeSpinsRemainingRef.current - 1;
      freeSpinsRemainingRef.current = newCount; // Update ref immediately
      setFreeSpinsRemaining(newCount);

      if (newCount <= 0) {
        freeSpinModeRef.current = false; // Update ref immediately
        const totalWins = totalFreeSpinWinsRef.current;
        setTimeout(() => {
          setIsInFreeSpinMode(false);
          setTotalFreeSpinWins(totalWins);
          setShowFreeSpinSummary(true);
          playAudio('bonus', 'fs_end');
        }, 2000);
      }
    }

    clearWinLines();

    setWinAmount(0);
    setShowWinDisplay(false);

    const keys = isInFreeSpinMode && config.bonus?.freeSpins?.retriggers === false
      ? symbolKeys.filter(key => key !== 'scatter')
      : symbolKeys;

    // Use reel strips from MathWizard when available (store-based connection)
    const latestConfig = useGameStore.getState().config as { theme?: { generated?: { reelStrips?: Array<{ reelIndex: number; symbols: string[]; length: number }> } } };
    const storedReelStrips = latestConfig?.theme?.generated?.reelStrips;
    const hasValidReelStrips = storedReelStrips && Array.isArray(storedReelStrips) &&
      storedReelStrips.length === reels &&
      storedReelStrips.every((r) => r.symbols && r.symbols.length >= rows);

    let finalGrid: string[][];
    if (hasValidReelStrips) {
      finalGrid = Array.from({ length: reels }, (_, reelIdx) => {
        const strip = storedReelStrips[reelIdx];
        const stripLen = strip.symbols.length;
        const stop = Math.floor(Math.random() * stripLen);
        const resolve = (sym: string) => (keys.includes(sym) ? sym : keys[Math.floor(Math.random() * keys.length)]);
        return Array.from({ length: rows }, (_, rowIdx) =>
          resolve(strip.symbols[(stop + rowIdx) % stripLen])
        );
      });
    } else {
      finalGrid = Array.from({ length: reels }, () =>
        Array.from({ length: rows }, () => keys[Math.floor(Math.random() * keys.length)])
      );
    }

    finalGridRef.current = finalGrid;

    spinTimelinesRef.current.forEach(tl => {
      if (tl) tl.kill();
    });
    spinTimelinesRef.current = [];

    spinJustCompletedRef.current = false;

    playAudio('reels', 'reel_start');
    playAudio('reels', 'reel_loop', { loop: true, stopPrevious: true });

    setIsSpinning(true);
    window.dispatchEvent(new CustomEvent('spinStarted'));
    startGSAPSpin();
  };

  const startGSAPSpin = () => {
    const metrics = computeResponsiveMetrics();
    const { size, spacingX, spacingY, offsetX, offsetY } = metrics;
    const currentSpeed = animationSettingsRef.current.speed;
    const baseDurationMs = 3500 / currentSpeed; // Faster default: 2.5s at speed 1.0
    const baseMs = Math.max(800, Math.min(15000, baseDurationMs)); // Clamp between 0.8-15 seconds for wider range
    const reelDelay = 300; // Increased delay between reels

    const keys = isInFreeSpinMode && config.bonus?.freeSpins?.retriggers === false
      ? symbolKeys.filter(key => key !== 'scatter')
      : symbolKeys;
    if (keys.length === 0) {
      console.error('[startGSAPSpin] No symbols available! Cannot start spin.');
      setIsSpinning(false);
      return;
    }

    reelSymbolSequencesRef.current = [];

    const minScrollSymbols = 30;
    for (let i = 0; i < reels; i++) {
      const finalSymbols = finalGridRef.current ? finalGridRef.current[i] : null;
      const sequence: string[] = [];

      for (let j = 0; j < minScrollSymbols; j++) {
        sequence.push(keys[Math.floor(Math.random() * keys.length)]);
      }

      if (finalSymbols && finalSymbols.length === rows) {
        for (let j = finalSymbols.length - 1; j >= 0; j--) {
          sequence.push(finalSymbols[j]);
        }
      } else {
        for (let j = 0; j < rows; j++) {
          sequence.push(keys[Math.floor(Math.random() * keys.length)]);
        }
      }

      for (let j = 0; j < 50; j++) {
        sequence.push(keys[Math.floor(Math.random() * keys.length)]);
      }
      const currentSymbols = currentGrid?.[i];
      if (currentSymbols && currentSymbols.length === rows) {
        const sanitizedCurrent = currentSymbols.map(sym =>
          keys.includes(sym) ? sym : keys[Math.floor(Math.random() * keys.length)]
        );

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

    if (reelSymbolSequencesRef.current.length !== reels) {
      console.error('[startGSAPSpin] Failed to initialize symbol sequences!');
      setIsSpinning(false);
      return;
    }

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

    const scrollEasing = getGSAPEasing(configuredEasing);
    const stopEasing = getGSAPEasing(configuredEasing);

    const stopSettle = { enabled: false, px: 0, downDuration: 0, upDuration: 0 };

    let completedReels = 0;
    const totalReels = reels;
    const spinningReels = new Set<number>();

    for (let c = 0; c < reels; c++) {
      const rc = reelContainersRef.current[c];
      if (!rc) continue;

      const duration = (baseMs + c * reelDelay) / 1000; // Convert to seconds
      spinningReels.add(c);
      const minScrollSymbols = 30;
      const stopIndex = minScrollSymbols + (rows - 1);
      const finalOffset = stopIndex * spacingY;

      const spinProgress = { value: 0 };

      const tl = gsap.timeline();
      tl.to(spinProgress, {
        value: 1,
        duration: duration,
        ease: scrollEasing,
        onUpdate: function () {
          const progress = spinProgress.value;
          const currentScrollDistance = progress * finalOffset;
          const offset = currentScrollDistance;
          renderReelSpinning(rc, { size, spacingX, spacingY }, offset, c);

          const blurFilter = blurFiltersRef.current.get(rc);
          const currentSettings = animationSettingsRef.current;
          if (blurFilter && currentSettings.visualEffects.spinBlur) {
            const speed = 1 - progress;
            blurFilter.blur = (currentSettings.blurIntensity / 2) * (0.3 + speed * 1.4);
          } else if (blurFilter) {
            blurFilter.blur = 0;
          }

          if (progress > 0.85) {
            const anticipation = (progress - 0.85) / 0.15;
            rc.scale.set(1 + (anticipation * 0.015));
          } else {
            rc.scale.set(1);
          }

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
            glow.rect(offsetX + c * spacingX - 5, offsetY - 5, size + 10, rows * spacingY + 10).fill({ color: 0xffff00, alpha: 0.3 * glowIntensity });
          } else {
            const glow = glowEffectsRef.current.get(rc);
            if (glow && glow.parent) {
              glow.parent.removeChild(glow);
              glow.destroy();
              glowEffectsRef.current.delete(rc);
            }
          }

          if (currentSettings.visualEffects.screenShake && spinningReels.size > 0) {
            const shakeIntensity = (1 - progress) * 2;
            const shakeX = (Math.random() - 0.5) * shakeIntensity;
            const shakeY = (Math.random() - 0.5) * shakeIntensity;
            screenShakeRef.current = { x: shakeX, y: shakeY };
          }

          const shakeX = currentSettings.visualEffects.screenShake && spinningReels.size > 0
            ? screenShakeRef.current.x
            : 0;
          const shakeY = currentSettings.visualEffects.screenShake && spinningReels.size > 0
            ? screenShakeRef.current.y
            : 0;
          rc.x = offsetX + c * spacingX + shakeX;
          rc.y = offsetY + shakeY;

          const mask = reelMasksRef.current[c];
          if (mask) {
            const reelEnabled = maskControls.enabled && maskControls.perReelEnabled[c];
            mask.clear();
            if (reelEnabled) {
              if (maskControls.debugVisible) {
                mask.rect(offsetX + c * spacingX, offsetY, size, rows * spacingY).fill({ color: 0xff0000, alpha: 0.2 });
              } else {
                mask.rect(offsetX + c * spacingX, offsetY, size, rows * spacingY).fill(0xffffff);
              }
            } else {
              mask.rect(offsetX + c * spacingX, offsetY, size, rows * spacingY).fill({ color: 0x000000, alpha: 0 });
            }
            mask.visible = true;
            rc.mask = mask;
          }

          if (maskControls.enabled) {
            rc.visible = maskControls.perReelEnabled[c];
          } else {
            rc.visible = true;
          }
        }
      });

      tl.add(() => {
        spinningReels.delete(c);

        renderReelSpinning(rc, { size, spacingX, spacingY }, finalOffset, c);
        rc.scale.set(1, 1);
        const blurFilter = blurFiltersRef.current.get(rc);
        if (blurFilter) {
          blurFilter.blur = 0;
          if (rc.filters) {
            rc.filters = rc.filters.filter(f => f !== blurFilter);
          }
          blurFiltersRef.current.delete(rc);
        }

        const glow = glowEffectsRef.current.get(rc);
        if (glow && glow.parent) {
          glow.parent.removeChild(glow);
          glow.destroy();
          glowEffectsRef.current.delete(rc);
        }

        rc.x = offsetX + c * spacingX;
        rc.y = offsetY;
      });

      if (stopSettle.enabled) {
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


  const handleSpinComplete = () => {
    const finalGrid = finalGridRef.current || currentGrid;
    const metrics = computeResponsiveMetrics();
    setCurrentGrid(finalGrid);

    spinJustCompletedRef.current = true;

    // Apply final symbols reel-by-reel in stop order so it doesn't look like a sudden replace
    if (finalGrid) {
      const reelRevealDelayMs = 80;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          for (let i = 0; i < reels; i++) {
            const rc = reelContainersRef.current[i];
            if (!rc) continue;

            const reelSymbols = finalGrid[i];
            const delayMs = i * reelRevealDelayMs;

            if (delayMs === 0) {
              renderReelFinal(i, reelSymbols, rc, metrics);
              rc.x = metrics.offsetX + i * metrics.spacingX;
              rc.y = metrics.offsetY;
            } else {
              setTimeout(() => {
                if (rc.destroyed) return;
                renderReelFinal(i, reelSymbols, rc, metrics);
                rc.x = metrics.offsetX + i * metrics.spacingX;
                rc.y = metrics.offsetY;
              }, delayMs);
            }
          }
        });
      });
    }

    screenShakeRef.current = { x: 0, y: 0 };
    stopAudio('reels', 'reel_loop');

    if (finalGrid) {
      const scatterCheck = checkScatterSymbols(finalGrid);
      if (scatterCheck.count >= 3) {
        playAudio('features', 'feat_scatter');
      }
      triggerFreeSpins(scatterCheck.count, scatterCheck.positions);

      const bonusCheck = checkBonusSymbols(finalGrid);
      if (bonusCheck.count >= 3) {
        playAudio('bonus', 'bonus_trigger');
      }
      const wheelWasTriggered = triggerWheelBonus(bonusCheck.count, bonusCheck.positions);
      const pickAndClickWasTriggered = triggerPickAndClick(bonusCheck.count, bonusCheck.positions);
      const winResult = checkWinLines(finalGrid);

      if (winResult.totalWin > 0 && winResult.winDetails.length > 0) {
        cleanupSymbolAnimations();
        requestAnimationFrame(() => {
          setTimeout(() => {
            applyWinningSymbolAnimations(winResult.winDetails);
          }, 50);
        });
      } else {
        cleanupSymbolAnimations();
      }

      let finalWin = winResult.totalWin;
      if (freeSpinModeRef.current && config.bonus?.freeSpins?.multipliers && config.bonus.freeSpins.multipliers.length > 0) {
        const multipliers = config.bonus.freeSpins.multipliers;
        const multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
        finalWin = winResult.totalWin * multiplier;
      }

      setWinAmount(finalWin);

      if (freeSpinModeRef.current && finalWin > 0) {
        totalFreeSpinWinsRef.current += finalWin;
        setTotalFreeSpinWins(totalFreeSpinWinsRef.current);
      }

      if (finalWin > 0) {
        setBalance(balance + finalWin);
        const winTier = calculateWinTier(betAmount, finalWin);
        setCurrentWinTier(winTier);
        playAudio('reels', 'reel_stop_hard');

        // Trigger Spine character win animation
        playSpineAnimation('win');

        if (winTier === 'small') {
          playAudio('wins', 'win_small');
        } else if (winTier === 'big') {
          playAudio('wins', 'win_big');
        } else if (winTier === 'mega') {
          playAudio('wins', 'win_mega');
        } else {
          playAudio('wins', 'win_medium');
        }

        if (winTier !== 'small') {
          triggerParticleEffects(winTier);
        }

        const winTitleId = winTier === 'big' ? 'big_win' :
          winTier === 'mega' ? 'mega_win' :
            winTier === 'super' ? 'super_win' : null;

        let winTitleUrl = null;
        if (winTitleId) {
          winTitleUrl = config.generatedAssets?.winTitles?.[winTitleId] || null;

          if (!winTitleUrl && config.winTitleConfigs?.[winTitleId]?.generatedUrl) {
            winTitleUrl = config.winTitleConfigs[winTitleId].generatedUrl;
            console.log('[SlotMachine] Found win title URL in winTitleConfigs:', winTitleId);
          }
        }

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

        if (winTier !== 'small') {
          if (winTitleUrl) {
            setShowWinTitle(true);
            setShowWinDisplay(true);
            console.log('[SlotMachine] Showing win title:', winTitleId);

            const animationDuration = 3.5;
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
                  }, 5000);
                }
              });
            }, 100);
          }
        } else {
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
        playAudio('reels', 'reel_stop_soft');
        if (!wheelWasTriggered && !pickAndClickWasTriggered) {
          spinTimelinesRef.current = [];
          setIsSpinning(false);
          setTimeout(() => {
            spinJustCompletedRef.current = false;
          }, 1000);
        }
      }
    } else {
      playAudio('reels', 'reel_stop_soft');
      spinTimelinesRef.current = [];
      setIsSpinning(false);
      setTimeout(() => {
        spinJustCompletedRef.current = false;
      }, 1000);
    }
  };

  const quickStop = useCallback(() => {
    if (!isSpinning) return;
    spinTimelinesRef.current.forEach(tl => {
      if (tl) {
        gsap.killTweensOf(tl);
        tl.kill();
      }
    });
    spinTimelinesRef.current = [];
    cleanupSymbolAnimations();
    stopAudio('reels', 'reel_loop');

    const metrics = computeResponsiveMetrics();
    const { spacingX, offsetX, offsetY } = metrics;

    const finalGrid = finalGridRef.current || currentGrid;
    const quickRevealDelayMs = 55;

    for (let c = 0; c < reels; c++) {
      const rc = reelContainersRef.current[c];
      if (!rc) continue;

      const blurFilter = blurFiltersRef.current.get(rc);
      if (blurFilter) {
        blurFilter.blur = 0;
        if (rc.filters) {
          rc.filters = rc.filters.filter(f => f !== blurFilter);
        }
        blurFiltersRef.current.delete(rc);
      }

      const glow = glowEffectsRef.current.get(rc);
      if (glow && glow.parent) {
        glow.parent.removeChild(glow);
        glow.destroy();
        glowEffectsRef.current.delete(rc);
      }

      const reelSymbols = finalGrid && finalGrid[c] ? finalGrid[c] : undefined;
      const delayMs = c * quickRevealDelayMs;

      const applyFinal = () => {
        if (rc.destroyed) return;
        renderReelFinal(c, reelSymbols, rc, metrics);
        rc.scale.set(1, 1);
        rc.x = offsetX + c * spacingX;
        rc.y = offsetY;
      };

      if (delayMs === 0) {
        applyFinal();
      } else {
        setTimeout(applyFinal, delayMs);
      }
    }
    screenShakeRef.current = { x: 0, y: 0 };
    spinJustCompletedRef.current = true;

    handleSpinComplete();
  }, [isSpinning, reels, rows, computeResponsiveMetrics, currentGrid]);

  useEffect(() => {
    quickStopRef.current = quickStop;
  }, [quickStop]);

  useEffect(() => {
    const updateSize = () => {
      if (pausedForTeardownRef.current || spineTeardownInProgressRef.current) return;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setRenderSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        if (pausedForTeardownRef.current || spineTeardownInProgressRef.current) return;
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
  }, [viewMode]); // Re-run when viewMode changes to reattach ResizeObserver to new container

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

    let app: PIXI.Application = new PIXI.Application();
    let cancelled = false;

    (async () => {
      try {
        await app.init({
          backgroundColor: 0x000000,
          backgroundAlpha: 0,
          resizeTo: container,
          autoDensity: true,
          resolution: Math.max(1, window.devicePixelRatio || 1),
          roundPixels: true,
        });
      } catch (webglError) {
        console.warn('⚠️ WebGL initialization failed, falling back to Canvas renderer:', webglError);
        try {
          await app.init({
            backgroundColor: 0x000000,
            backgroundAlpha: 0,
            resizeTo: container,
            autoDensity: true,
            resolution: Math.max(1, window.devicePixelRatio || 1),
            roundPixels: true,
            preference: 'canvas',
          });
        } catch (canvasError) {
          console.error('❌ Failed to initialize PIXI with Canvas renderer:', canvasError);
          app.destroy(true, { children: true });
          return;
        }
      }
      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }
      appRef.current = app;
      containerRef.current?.appendChild(app.canvas as any);
      const canvasEl = app.canvas as HTMLCanvasElement;
      if (canvasEl?.style) {
        canvasEl.style.position = 'relative';
        canvasEl.style.zIndex = '10';
      }

      const reelContainers: PIXI.Container[] = [];
      const reelMasks: PIXI.Graphics[] = [];
      const metrics = computeResponsiveMetrics();

      for (let c = 0; c < reels; c++) {
        const rc = new PIXI.Container();
        reelContainers.push(rc);
        app.stage.addChild(rc);

        const mask = new PIXI.Graphics();
        mask.rect(metrics.offsetX + c * metrics.spacingX, metrics.offsetY, metrics.size, rows * metrics.spacingY).fill(0xffffff);
        app.stage.addChild(mask);
        rc.mask = mask;
        mask.visible = false;
        reelMasks.push(mask);

        const symbolCount = rows + 2;
        for (let r = 0; r < symbolCount; r++) {
          const symbolContainer = new PIXI.Container();
          const sprite = new PIXI.Sprite({ texture: PIXI.Texture.WHITE, roundPixels: true });
          symbolContainer.addChild(sprite);
          rc.addChild(symbolContainer);
        }
      }
      reelContainersRef.current = reelContainers;
      reelMasksRef.current = reelMasks;

      // Preload textures and Spine symbol assets before first render
      preloadTextures()
        .then(() => loadSpineSymbolAssets())
        .then(() => {
          if (appRef.current) renderGrid();
        })
        .catch((err) => {
          console.error('[SlotMachine] preloadTextures failed:', err);
          if (appRef.current) renderGrid();
        });

      renderGrid();

      // Update only Spine symbols that are on a winning line (so they animate during win).
      // Idle Spine symbols are not updated and stay static.
      const updateWinningSpines = (ticker: { deltaTime: number }) => {
        const set = winningSpineInstancesRef.current;
        if (set.size === 0) return;
        const deltaSec = ticker.deltaTime / 60;
        const toRemove: Spine[] = [];
        set.forEach((spine) => {
          if (!spine || (spine as any).destroyed || !spine.parent || !spine.skeleton) {
            toRemove.push(spine);
            return;
          }
          try {
            if (spine.visible) spine.update(deltaSec);
          } catch (_) {
            toRemove.push(spine);
          }
        });
        toRemove.forEach((s) => set.delete(s));
      };
      winningSpineTickerRef.current = updateWinningSpines;
      app.ticker.add(updateWinningSpines);

      const initialBackground = config.background?.backgroundImage || getBackgroundForMode();
      if (initialBackground) {
        setTimeout(() => {
          const adjustments = {
            position: config.backgroundPosition || { x: 0, y: 0 },
            scale: config.backgroundScale || 100,
            fit: (config.backgroundFit || 'cover') as 'cover' | 'contain' | 'fill' | 'scale-down'
          };
          setBackgroundUrl(initialBackground);
          setBackgroundAdjustments(adjustments);
        }, 100);
      }
    })();

    return () => {
      cancelled = true;
      const app = appRef.current;
      const container = containerRef.current;

      // CRITICAL: Stop ticker and remove canvas from DOM immediately.
      // This prevents any render from running during teardown (BatcherPipe geometry null).
      if (app) {
        app.ticker.stop();
        if (winningSpineTickerRef.current) {
          app.ticker.remove(winningSpineTickerRef.current);
          winningSpineTickerRef.current = null;
        }
        if (container && app.canvas && app.canvas.parentNode) {
          app.canvas.parentNode.removeChild(app.canvas);
        }
      }
      appRef.current = null;

      spinTimelinesRef.current.forEach(tl => { if (tl) tl.kill(); });
      spinTimelinesRef.current = [];
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (isSpinning) setIsSpinning(false);
      spinMetaRef.current = null;
      clearWinLines();
      gsap.killTweensOf('*');

      // Defer destruction to next frame so we never destroy mid-render.
      requestAnimationFrame(() => {
        try {
          if (symbolGridBackgroundRef.current && !symbolGridBackgroundRef.current.destroyed) {
            const bg = symbolGridBackgroundRef.current;
            if (bg.parent) bg.parent.removeChild(bg);
            bg.destroy({ children: true });
          }
          symbolGridBackgroundRef.current = null;

          blurFiltersRef.current.forEach((filter, cont) => {
            if (cont?.filters) cont.filters = cont.filters.filter(f => f !== filter);
          });
          blurFiltersRef.current.clear();

          glowEffectsRef.current.forEach((glow) => {
            if (glow && !glow.destroyed && glow.parent) {
              glow.parent.removeChild(glow);
              glow.destroy();
            }
          });
          glowEffectsRef.current.clear();

          if (backgroundSpriteRef.current?.mask) {
            const mask = backgroundSpriteRef.current.mask as PIXI.Graphics;
            backgroundSpriteRef.current.mask = null;
            if (mask?.parent) mask.parent.removeChild(mask);
            if (!mask?.destroyed) mask?.destroy();
          }

          if (outerFrameSpriteRef.current && !outerFrameSpriteRef.current.destroyed) {
            const ofs = outerFrameSpriteRef.current;
            if (ofs.parent) ofs.parent.removeChild(ofs);
            ofs.destroy();
            outerFrameSpriteRef.current = null;
          }

          reelDividerSpritesRef.current.forEach((d) => {
            if (d && !d.destroyed && d.parent) {
              d.parent.removeChild(d);
              d.destroy();
            }
          });
          reelDividerSpritesRef.current = [];

          reelContainersRef.current.forEach((rc) => {
            if (!rc?.destroyed && rc?.mask) rc.mask = null;
            if (rc?.children) {
              rc.children.forEach((sc) => {
                const sym = sc as PIXI.Container;
                if (sym.children.length > 1) {
                  const spine = sym.children[1] as Spine;
                  if (spine?.parent) spine.parent.removeChild(spine);
                  if (spine && !(spine as any).destroyed) spine.destroy({ children: true });
                }
              });
            }
          });
          reelMasksRef.current.forEach((m) => {
            if (m?.parent) m.parent.removeChild(m);
            if (m && !m.destroyed) m.destroy();
          });
          reelMasksRef.current = [];
          reelContainersRef.current = [];

          cleanupSymbolAnimations();
          winningSpineInstancesRef.current.clear();

          spineSymbolPoolRef.current.forEach((pool) => {
            pool.forEach((s) => {
              if (s && !(s as any).destroyed) s.destroy({ children: true });
            });
          });
          spineSymbolPoolRef.current.clear();

          if (app) {
            try { app.destroy(true, { children: true }); } catch (_) { /* already destroyed */ }
          }
        } catch (e) {
          console.warn('[SlotMachine] Teardown error (non-fatal):', e);
        }
      });
    };
  }, [reels, rows, clearWinLines, cleanupSymbolAnimations]);

  // Adjust grid size dynamically without destroying the PIXI app
  useEffect(() => {
    if (!appRef.current) return;

    const currentReels = config.reels?.layout?.reels ?? 5;
    const currentRows = config.reels?.layout?.rows ?? 3;
    const metrics = computeResponsiveMetrics();

    // Adjust reel containers count
    const currentContainers = reelContainersRef.current;
    const currentMasks = reelMasksRef.current;

    // Add or remove reel containers as needed
    if (currentContainers.length < currentReels) {
      for (let c = currentContainers.length; c < currentReels; c++) {
        const rc = new PIXI.Container();
        currentContainers.push(rc);
        appRef.current.stage.addChild(rc);

        const mask = new PIXI.Graphics();
        mask.rect(metrics.offsetX + c * metrics.spacingX, metrics.offsetY, metrics.size, currentRows * metrics.spacingY).fill(0xffffff);
        appRef.current.stage.addChild(mask);
        rc.mask = mask;
        mask.visible = false;
        currentMasks.push(mask);

        const symbolCount = currentRows + 2;
        for (let r = 0; r < symbolCount; r++) {
          const symbolContainer = new PIXI.Container();
          const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
          symbolContainer.addChild(sprite);
          rc.addChild(symbolContainer);
        }
      }
    } else if (currentContainers.length > currentReels) {
      for (let c = currentContainers.length - 1; c >= currentReels; c--) {
        const rc = currentContainers[c];
        const mask = currentMasks[c];

        const blurFilter = blurFiltersRef.current.get(rc);
        if (blurFilter && rc.filters) {
          rc.filters = rc.filters.filter(f => f !== blurFilter);
          blurFiltersRef.current.delete(rc);
        }

        if (rc && rc.parent) {
          rc.parent.removeChild(rc);
          rc.destroy({ children: true });
        }
        if (mask && mask.parent) {
          mask.parent.removeChild(mask);
          mask.destroy();
        }

        currentContainers.pop();
        currentMasks.pop();
      }
    }

    // Update all reel containers and masks for new row count
    for (let c = 0; c < currentReels; c++) {
      const rc = currentContainers[c];
      const mask = currentMasks[c];

      if (!rc || !mask) continue;

      rc.x = metrics.offsetX + c * metrics.spacingX;
      rc.y = metrics.offsetY;

      mask.clear();
      mask.rect(metrics.offsetX + c * metrics.spacingX, metrics.offsetY, metrics.size, currentRows * metrics.spacingY).fill(0xffffff);

      const currentSymbolCount = rc.children.length;
      const requiredSymbolCount = currentRows + 2;

      if (currentSymbolCount < requiredSymbolCount) {
        for (let r = currentSymbolCount; r < requiredSymbolCount; r++) {
          const symbolContainer = new PIXI.Container();
          const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
          symbolContainer.addChild(sprite);
          rc.addChild(symbolContainer);
        }
      } else if (currentSymbolCount > requiredSymbolCount) {
        const toDestroyLater: PIXI.Container[] = [];
        for (let r = currentSymbolCount - 1; r >= requiredSymbolCount; r--) {
          const symbolContainer = rc.children[r] as PIXI.Container;
          if (symbolContainer && symbolContainer.parent) {
            if (symbolContainer.children.length > 1) {
              const spine = symbolContainer.children[1] as Spine;
              if (spine && !(spine as any).destroyed) {
                const poolKey = (spine as any).__symbolKey;
                if (poolKey) returnSpineToPool(poolKey, spine);
                spine.parent?.removeChild(spine);
              }
            }
            symbolContainer.parent.removeChild(symbolContainer);
            toDestroyLater.push(symbolContainer);
          }
        }
        if (toDestroyLater.length > 0) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              toDestroyLater.forEach(c => {
                try {
                  if (c && !(c as any).destroyed) c.destroy({ children: true });
                } catch (_) { /* ignore */ }
              });
            });
          });
        }
      }
    }

    if (!pausedForTeardownRef.current) renderGrid();
  }, [config.reels?.layout?.reels, config.reels?.layout?.rows, computeResponsiveMetrics]);

  useEffect(() => {
    const currentReels = config.reels?.layout?.reels ?? 5;
    const currentRows = config.reels?.layout?.rows ?? 3;

    if (!currentGrid || currentGrid.length !== currentReels ||
      (currentGrid[0] && currentGrid[0].length !== currentRows)) {
      const availableKeys = isInFreeSpinMode && config.bonus?.freeSpins?.retriggers === false
        ? symbolKeys.filter(key => key !== 'scatter')
        : symbolKeys;
      const newGrid = Array.from({ length: currentReels }, () =>
        Array.from({ length: currentRows }, () => {
          return availableKeys.length > 0 ? availableKeys[Math.floor(Math.random() * availableKeys.length)] : 'low1';
        })
      );
      setCurrentGrid(newGrid);
    }
  }, [reels, rows, config.reels?.layout?.reels, config.reels?.layout?.rows, symbolKeys]);

  // Resize PIXI app and move canvas when viewMode changes
  useEffect(() => {
    if (appRef.current && containerRef.current) {
      setTimeout(() => {
        if (appRef.current && containerRef.current) {
          const canvas = appRef.current.canvas as HTMLCanvasElement;

          if (canvas && canvas.parentNode !== containerRef.current) {
            if (canvas.parentNode) {
              canvas.parentNode.removeChild(canvas);
            }
            containerRef.current.appendChild(canvas);
            if (canvas.style) {
              canvas.style.position = 'relative';
              canvas.style.zIndex = '10';
            }
          }

          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && !pausedForTeardownRef.current && !spineTeardownInProgressRef.current) {
            setRenderSize({ width: rect.width, height: rect.height });
            try {
              appRef.current.renderer.resize(rect.width, rect.height);
              renderGrid();
              updateSpinePosition();
            } catch (e) {
              console.warn('[SlotMachine] Resize/render skipped (teardown or invalid state):', e);
            }
          }
        }
      }, 150);
    }
  }, [viewMode, computeResponsiveMetrics, updateSpinePosition]);

  const previousSymbolsRef = useRef<string>('');
  useEffect(() => {
    const currentSymbols = config.theme?.generated?.symbols;
    const hasSymbols = currentSymbols && typeof currentSymbols === 'object' && !Array.isArray(currentSymbols) && Object.keys(currentSymbols).length > 0;
    if (!hasSymbols) {
      if (previousSymbolsRef.current === '') previousSymbolsRef.current = '{}';
      return;
    }

    const currentSymbolsStr = JSON.stringify(currentSymbols);
    if (currentSymbolsStr === previousSymbolsRef.current) return;
    previousSymbolsRef.current = currentSymbolsStr;

    preloadTextures().then(() => loadSpineSymbolAssets()).then(() => {
      if (appRef.current) {
        renderGrid();
      }
    }).catch(error => {
      console.error('[SlotMachine] Error reloading textures:', error);
    });
  }, [config.theme?.generated?.symbols, preloadTextures, loadSpineSymbolAssets]);

  // Delayed retry for texture load - handles async config/store hydration when opening project first time
  useEffect(() => {
    const timer = setTimeout(() => {
      if (symbolKeys.length > 0 && appRef.current) {
        preloadTextures().then(() => loadSpineSymbolAssets()).then(() => {
          if (appRef.current) renderGrid();
        }).catch(() => { });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [symbolKeys, preloadTextures, loadSpineSymbolAssets]);

  useEffect(() => {
    if (pausedForTeardownRef.current || spineTeardownInProgressRef.current) return;
    if (appRef.current && reelContainersRef.current?.length) {
      try {
        renderGrid();
      } catch (e) {
        console.warn('[SlotMachine] renderGrid skipped:', e);
      }
    }
  }, [currentGrid, renderSize, gridAdjustments, frameConfig, maskControls, isSpinning]);

  // Reposition Spine character when preview size or layout changes
  useEffect(() => {
    if (renderSize.width > 0 && renderSize.height > 0) {
      updateSpinePosition();
    }
  }, [renderSize.width, renderSize.height, updateSpinePosition]);

  // Reposition Spine when config position/scale changes (from Step4 sliders)
  const spinePos = (config as { spineCharacterPosition?: { x: number; y: number } })?.spineCharacterPosition;
  const spineScale = (config as { spineCharacterScale?: number })?.spineCharacterScale;
  useEffect(() => {
    updateSpinePosition();
  }, [spinePos?.x, spinePos?.y, spineScale, updateSpinePosition]);

  // Reload Spine when user uploads a new ZIP (custom event from Step4), only if "Show character" is on
  useEffect(() => {
    const onSpineCharacterUpdated = () => {
      if (!showSpineCharacter) return;
      loadSpineCharacter().catch(err => console.error('[Spine] Reload after ZIP upload failed:', err));
    };
    window.addEventListener('spineCharacterUpdated', onSpineCharacterUpdated);
    return () => window.removeEventListener('spineCharacterUpdated', onSpineCharacterUpdated);
  }, [showSpineCharacter, loadSpineCharacter]);

  // Recalculate grid position when UI button adjustments change
  useEffect(() => {
    if (appRef.current) {
      renderGrid();
    }
  }, [uiButtonAdjustments.scale, uiButtonAdjustments.buttonScales]);

  useEffect(() => {
    const currentReels = config.reels?.layout?.reels ?? 5;
    setMaskControls(prev => ({
      ...prev,
      perReelEnabled: Array(currentReels).fill(true) as boolean[]
    }));
  }, [config.reels?.layout?.reels]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setRenderSize({ width: rect.width, height: rect.height });
        }
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      setCurrentDevice(getCurrentDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculateWinTier = useCallback((betAmount: number, winAmount: number): 'small' | 'big' | 'mega' | 'super' => {
    if (winAmount === 0) return 'small';

    const multiplier = winAmount / betAmount;

    const thresholds = config.winMultiplierThresholds || {
      smallWin: 1,
      bigWin: 5,
      megaWin: 25,
      superWin: 100
    };

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

  const cleanDataUrl = useCallback((url: string): string => {
    if (!url) return url;
    let cleanedUrl = url;
    cleanedUrl = cleanedUrl.replace(/^data:image\/png;base64,data:image\/png;base64,/, 'data:image/png;base64,');
    cleanedUrl = cleanedUrl.replace(/^data:image\/jpeg;base64,data:image\/jpeg;base64,/, 'data:image/jpeg;base64,');
    cleanedUrl = cleanedUrl.replace(/^data:([^,]+),data:([^,]+),/, 'data:$1,');
    return cleanedUrl;
  }, []);

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

  const getParticleTypesForTier = useCallback((tier: 'small' | 'big' | 'mega' | 'super'): Array<{ url?: string, fallback: string, config?: any }> => {
    const particleConfigs = config.particleConfigs || {};
    const particleUrls = config.generatedAssets?.particles || {};
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

    if (tierParticles.length > 0) {
      return tierParticles;
    }
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

  const createFountainParticle = useCallback((
    overlay: HTMLElement,
    _tier: 'small' | 'big' | 'mega' | 'super',
    particleTypes: Array<{ url?: string, fallback: string, config?: any }>,
    duration: number
  ) => {
    const particle = document.createElement('div');
    const selectedParticle = particleTypes[Math.floor(Math.random() * particleTypes.length)];
    const particleConfig = selectedParticle.config;
    const sizeMultiplier = (particleConfig?.celebrationSize || 100) / 100;
    const spreadMultiplier = (particleConfig?.fountainSpread || 100) / 100;
    const speedMultiplier = (particleConfig?.particleSpeed || 100) / 100;
    const heightMultiplier = (particleConfig?.fountainHeight || 100) / 100;
    const windEffect = (particleConfig?.windEffect || 0) / 100;
    const pattern = particleConfig?.fountainPattern || 'classic-3';
    const leftAngle = particleConfig?.leftAngle || -45;
    const rightAngle = particleConfig?.rightAngle || 45;
    const centerWeight = (particleConfig?.centerWeight || 50) / 100;

    let horizontalVelocity: number;
    let baseVerticalVelocity: number | undefined = undefined;

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

    if (baseVerticalVelocity === undefined) {
      baseVerticalVelocity = -(120 + Math.random() * 80) * heightMultiplier;
    }

    const verticalVelocity = baseVerticalVelocity * speedMultiplier;
    const gravity = 300 * speedMultiplier;
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

    const animationDuration = duration * 0.8;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = elapsed / (animationDuration / 1000);

      if (progress >= 1) {
        particle.remove();
        return;
      }

      const windDrift = windEffect * elapsed * 30;
      const x = horizontalVelocity * elapsed + windDrift;
      const y = verticalVelocity * elapsed + 0.5 * gravity * elapsed * elapsed;

      const opacity = Math.max(0, 1 - progress);
      particle.style.transform = `translate(${x - particle.offsetWidth / 2}px, ${y}px)`;
      particle.style.opacity = opacity.toString();

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  const triggerParticleEffects = useCallback((tier: 'small' | 'big' | 'mega' | 'super') => {
    if (!containerRef.current) return;

    const winAnimations = config.winAnimations || {};
    const effects = winAnimations[tier] || {
      particles: tier === 'small' ? 30 : tier === 'big' ? 80 : tier === 'mega' ? 150 : 250,
      duration: tier === 'small' ? 1.5 : tier === 'big' ? 2.5 : tier === 'mega' ? 4.0 : 6.0,
      intensity: tier === 'small' ? 3 : tier === 'big' ? 6 : tier === 'mega' ? 8 : 10
    };

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

    const particleTypes = getParticleTypesForTier(tier);
    const fountainDuration = effects.duration * 1000;

    const particleContributions: Array<{ type: typeof particleTypes[0], count: number }> = [];
    let totalParticleCount = 0;

    if (particleTypes.length > 0 && particleTypes[0].config) {
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
      particleContributions.push({
        type: particleTypes[0],
        count: effects.particles
      });
      totalParticleCount = effects.particles;
    }

    const maxParticles = 1000;
    if (totalParticleCount > maxParticles) {
      const scaleFactor = maxParticles / totalParticleCount;
      particleContributions.forEach(contribution => {
        contribution.count = Math.round(contribution.count * scaleFactor);
      });
      totalParticleCount = particleContributions.reduce((sum, contrib) => sum + contrib.count, 0);
    }

    let particleIndex = 0;
    particleContributions.forEach(contribution => {
      for (let i = 0; i < contribution.count; i++) {
        setTimeout(() => {
          createFountainParticle(overlay!, tier, particleTypes, fountainDuration);
        }, particleIndex * 100);
        particleIndex++;
      }
    });

    setTimeout(() => {
      if (overlay && overlay.parentNode) {
        overlay.remove();
        particleOverlayRef.current = null;
      }
    }, fountainDuration);
  }, [config.winAnimations, getParticleTypesForTier, createFountainParticle]);

  useEffect(() => {
    if (winAmount > 0 && showWinDisplay) {
      const winTier = calculateWinTier(betAmount, winAmount);

      if (winTier === 'small') {
        setAnimatedWinAmount(winAmount);
        if (winAmountAnimationRef.current) {
          winAmountAnimationRef.current.kill();
          winAmountAnimationRef.current = null;
        }
        return;
      }

      setAnimatedWinAmount(0);
      if (winAmountAnimationRef.current) {
        winAmountAnimationRef.current.kill();
        winAmountAnimationRef.current = null;
      }

      const duration = Math.min(3, Math.max(1, winAmount / 1000));

      const animationTarget = { value: 0 };
      const timeline = gsap.to(animationTarget, {
        value: winAmount,
        duration: duration,
        ease: 'power2.out',
        onUpdate: () => {
          setAnimatedWinAmount(Math.floor(animationTarget.value));
        },
        onComplete: () => {
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
      setAnimatedWinAmount(0);
      if (winAmountAnimationRef.current) {
        winAmountAnimationRef.current.kill();
        winAmountAnimationRef.current = null;
      }
    }
  }, [winAmount, showWinDisplay, betAmount, calculateWinTier]);

  useEffect(() => {
    if (!showWinDisplay && !showWinTitle) {
      setCurrentWinTier('small');
      cleanupSymbolAnimations();
    }
  }, [showWinDisplay, showWinTitle, cleanupSymbolAnimations]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('winDisplayVisibilityChanged', { detail: { visible: showWinDisplay } }));
  }, [showWinDisplay]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(isSpinning ? 'spinStarted' : 'spinEnded'));
  }, [isSpinning]);

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

  useEffect(() => {
    if ((config as any).logo) {
      setLogoUrl((config as any).logo);
    }
    if ((config as any).logoPositions) {
      const convertToPercentage = (pos: { x: number; y: number } | undefined, defaultPos: { x: number; y: number }) => {
        if (!pos) return defaultPos;
        if (pos.x < 0 || pos.x > 100 || pos.y < 0 || pos.y > 100) {
          return defaultPos;
        }
        return pos;
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

      if (url) {
        setBackgroundUrl(url);
      }
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

    const scheduleLogoSync = () => {
      if (logoSyncTimeoutRef.current) clearTimeout(logoSyncTimeoutRef.current);
      logoSyncTimeoutRef.current = setTimeout(() => {
        logoSyncTimeoutRef.current = null;
        if (logoPositionsRef.current) setLogoPositions(prev => ({ ...prev, ...logoPositionsRef.current }));
        if (logoScalesRef.current) setLogoScales(prev => ({ ...prev, ...logoScalesRef.current }));
      }, 50);
    };

    const handleLogoPositionChanged = (event: CustomEvent) => {
      const { position, device } = event.detail;
      if (!device || !position) return;
      const next = { ...(logoPositionsRef.current || {}), [device]: position };
      logoPositionsRef.current = next;
      if (device === currentDeviceRef.current && logoContainerRef.current) {
        logoContainerRef.current.style.left = `${position.x}%`;
        logoContainerRef.current.style.top = `${position.y}%`;
      }
      scheduleLogoSync();
    };

    const handleLogoScaleChanged = (event: CustomEvent) => {
      const { scale, device } = event.detail;
      if (!device || scale === undefined) return;
      const next = { ...(logoScalesRef.current || {}), [device]: scale };
      logoScalesRef.current = next;
      if (device === currentDeviceRef.current && logoContainerRef.current) {
        logoContainerRef.current.style.transform = `translate(-50%, -50%) scale(${scale / 100})`;
      }
      scheduleLogoSync();
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
        if (
          prev.scale === newAdjustments.scale &&
          prev.showSymbolGrid === newAdjustments.showSymbolGrid &&
          prev.position.x === newAdjustments.position.x &&
          prev.position.y === newAdjustments.position.y &&
          prev.stretch.x === newAdjustments.stretch.x &&
          prev.stretch.y === newAdjustments.stretch.y
        ) {
          return prev;
        }
        return newAdjustments;
      });
    };

    const handleFrameUpdated = (event: CustomEvent) => {
      const { frameUrl, frameStyle } = event.detail;
      setFrameConfig(prev => ({
        ...prev,
        framePath: frameUrl !== undefined ? (frameUrl || null) : prev.framePath,
        frameStyle: frameStyle !== undefined ? frameStyle : prev.frameStyle
      }));
    };

    const handleFrameAdjustmentsUpdated = (event: CustomEvent) => {
      const { position, scale, stretch } = event.detail;
      setFrameConfig(prev => ({
        ...prev,
        framePosition: position !== undefined ? position : prev.framePosition,
        frameScale: scale !== undefined ? scale : prev.frameScale,
        frameStretch: stretch !== undefined ? stretch : prev.frameStretch
      }));
    };

    const handleReelGapAdjustmentsUpdated = (event: CustomEvent) => {
      const { gap, position, stretch } = event.detail;
      setFrameConfig(prev => ({
        ...prev,
        reelGap: gap !== undefined ? gap : prev.reelGap,
        reelDividerPosition: position !== undefined ? position : prev.reelDividerPosition,
        reelDividerStretch: stretch !== undefined ? stretch : prev.reelDividerStretch
      }));
    };

    const handleAIReelImageUpdated = (event: CustomEvent) => {
      const { aiReelImage, frameStyle } = event.detail;
      setFrameConfig(prev => ({
        ...prev,
        aiReelImage: aiReelImage !== undefined ? (aiReelImage || null) : prev.aiReelImage,
        frameStyle: frameStyle !== undefined ? frameStyle : prev.frameStyle
      }));
    };

    const handleWinDisplayConfigUpdated = (event: CustomEvent) => {
      const {
        winDisplayPositions,
        winDisplayScales,
        winDisplayTextPositions,
        winDisplayTextScales,
        showWinText
      } = event.detail;

      setWinDisplayConfig({
        positions: winDisplayPositions || winDisplayConfig.positions,
        scales: winDisplayScales || winDisplayConfig.scales
      });

      setWinDisplayTextConfig(prev => ({
        positions: winDisplayTextPositions || prev.positions,
        scales: winDisplayTextScales || prev.scales,
        showWinText: showWinText !== undefined ? showWinText : prev.showWinText
      }));
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

    const handleWinDisplayUpdated = (_event: CustomEvent) => {
      setShowWinDisplay(true);
    };

    const handleSlotSpin = () => {
      if (!isSpinning) {
        onSpin();
      }
    };

    // Single source of truth: symbol/spine reload is done by the effect (config.theme.generated). This handler
    // only triggers a re-render so the grid updates if the effect hasn't run yet (e.g. store from different tab).
    const handleSymbolsChanged = () => {
      setTimeout(() => {
        if (appRef.current && reelContainersRef.current?.length && renderGrid) {
          renderGrid();
        }
      }, 150);
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
    window.addEventListener('winDisplayConfigUpdated', handleWinDisplayConfigUpdated as EventListener);
    window.addEventListener('winDisplayUpdated', handleWinDisplayUpdated as EventListener);
    window.addEventListener('slotSpin', handleSlotSpin as EventListener);
    window.addEventListener('symbolsChanged', handleSymbolsChanged);

    // Option 3: Pause/resume when leaving Step 5 (Symbol Creation) to avoid BatcherPipe errors
    const handlePauseForTeardown = () => {
      pausedForTeardownRef.current = true;
      const app = appRef.current;
      const container = containerRef.current;

      // ── FIRST: detach all Spine symbol instances from the scene graph.
      // Spine uses stencil/clipping masks; if the ticker processes a Spine
      // that gets destroyed (by loadSpineSymbolAssets), the batcher encounters
      // null geometry → StencilMaskPipe.pop → null.clear crash.
      spineSymbolPoolRef.current.forEach(pool => {
        pool.forEach(s => {
          if (s && !(s as any).destroyed && s.parent) {
            s.parent.removeChild(s);
            s.visible = false;
          }
        });
      });
      // Also sweep Spine children still attached to reel containers.
      reelContainersRef.current.forEach(rc => {
        if (!rc || rc.destroyed) return;
        [...rc.children].forEach(child => {
          const c = child as PIXI.Container;
          if (!c.children) return;
          [...c.children].forEach(grandchild => {
            if (grandchild instanceof Spine && !(grandchild as any).destroyed) {
              c.removeChild(grandchild);
              grandchild.visible = false;
            }
          });
        });
      });

      // ── THEN: stop the ticker so no new frames start.
      if (app && container) {
        app.ticker.stop();
        if (app.canvas?.parentNode) app.canvas.parentNode.removeChild(app.canvas);
      }
    };
    const handleResumeAfterTeardown = () => {
      const app = appRef.current;
      const container = containerRef.current;
      if (app && container && app.canvas && !container.contains(app.canvas)) {
        container.appendChild(app.canvas as HTMLCanvasElement);
        app.ticker.start();
      }
      pausedForTeardownRef.current = false;
      // Sync grid after resume (layout may have changed during pause)
      if (appRef.current && reelContainersRef.current?.length && renderGrid) {
        requestAnimationFrame(() => renderGrid());
      }
    };
    window.addEventListener(STEP_EVENTS.PAUSE_SLOT, handlePauseForTeardown);
    window.addEventListener(STEP_EVENTS.RESUME_SLOT, handleResumeAfterTeardown);

    // Sync with MathWizard reel strips - refresh idle grid when strips are updated
    const handleReelStripsUpdated = (event: CustomEvent<{ reelStrips: Array<{ reelIndex: number; symbols: string[] }> }>) => {
      const latestConfig = useGameStore.getState().config;
      const latestSymbols = latestConfig?.theme?.generated?.symbols;
      const symKeys = typeof latestSymbols === 'object' && !Array.isArray(latestSymbols)
        ? Object.keys(latestSymbols)
        : [];
      if (symKeys.length === 0) return;

      const { reelStrips } = event.detail || {};
      if (!reelStrips || !Array.isArray(reelStrips)) return;
      const currentReels = latestConfig?.reels?.layout?.reels ?? 5;
      const currentRows = latestConfig?.reels?.layout?.rows ?? 3;
      if (reelStrips.length !== currentReels) return;

      const resolve = (sym: string) => (symKeys.includes(sym) ? sym : symKeys[Math.floor(Math.random() * symKeys.length)]);
      const newGrid = reelStrips.map((strip) => {
        const arr = strip.symbols;
        if (!arr || arr.length < currentRows) return Array.from({ length: currentRows }, () => symKeys[Math.floor(Math.random() * symKeys.length)]);
        const stop = Math.floor(Math.random() * arr.length);
        return Array.from({ length: currentRows }, (_, rowIdx) => resolve(arr[(stop + rowIdx) % arr.length]));
      });
      setCurrentGrid(newGrid);
    };
    window.addEventListener('reelStripsUpdated', handleReelStripsUpdated as EventListener);

    // Handle freespin transition preview
    const handleFreespinTransition = (event: CustomEvent) => {
      const { direction, style, duration } = event.detail;
      console.log('🎰 Freespin transition preview:', { direction, style, duration });

      const latestConfig = useGameStore.getState().config;
      const freeSpinCount = latestConfig?.bonus?.freeSpins?.count || 10;
      const transitionStyle = style || (latestConfig as any)?.freespinTransition?.style || 'fade';
      const transitionDuration = duration || (latestConfig as any)?.freespinTransition?.duration || 3;

      console.log('🎰 Free spin count from config:', freeSpinCount);
      console.log('🎰 Transition style:', transitionStyle, 'Duration:', transitionDuration);

      if (direction === 'to-freespin') {
        setAnnouncementTransitionStyle(transitionStyle);
        setAnnouncementTransitionDuration(transitionDuration);

        setFreeSpinAwardedCount(freeSpinCount);
        setShowFreeSpinAnnouncement(true);

        setTimeout(() => {
          setShowFreeSpinAnnouncement(false);
          setBgTransitionRevealed(false);
          setIsInFreeSpinMode(true);
          setFreeSpinsRemaining(freeSpinCount);
        }, transitionDuration * 1000);
      } else {
        setBgTransitionRevealed(false);
        setIsInFreeSpinMode(false);
        setFreeSpinsRemaining(0);
      }
    };

    window.addEventListener('previewFreespinTransition', handleFreespinTransition as EventListener);

    const handlePickAndClickTrigger = (event: CustomEvent) => {
      console.log('🎁 Pick & Click bonus trigger received:', event.detail);
      const mockPositions = [
        { reel: 0, row: 1 },
        { reel: 2, row: 1 },
        { reel: 4, row: 1 }
      ];
      triggerPickAndClick(3, mockPositions);
    };

    const handleWheelTrigger = (event: CustomEvent) => {
      console.log('🎰 Wheel bonus trigger received:', event.detail);
      const mockPositions = [
        { reel: 0, row: 1 },
        { reel: 2, row: 1 },
        { reel: 4, row: 1 }
      ];
      triggerWheelBonus(3, mockPositions);
    };

    const handleHoldAndSpinTrigger = (event: CustomEvent) => {
      console.log('🔄 Hold & Spin bonus trigger received:', event.detail);
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast('Hold & Spin bonus triggered!', 'success');
      }
    };

    const handleJackpotTrigger = (event: CustomEvent) => {
      console.log('💰 Jackpot trigger received:', event.detail);
      const { level } = event.detail;
      const jackpotConfig = config.bonus?.jackpots;
      if (!jackpotConfig?.enabled) return;

      const jackpotValues = jackpotConfig.values || { Mini: 20, Minor: 100, Major: 1000, Grand: 10000 };
      const jackpotMultiplier = jackpotValues[level as keyof typeof jackpotValues] || 100;
      const jackpotAmount = jackpotMultiplier * betAmount;

      setBalance(balance + jackpotAmount);
      setWinAmount(jackpotAmount);

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
      if (logoSyncTimeoutRef.current) clearTimeout(logoSyncTimeoutRef.current);
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
      window.removeEventListener('winDisplayConfigUpdated', handleWinDisplayConfigUpdated as EventListener);
      window.removeEventListener('winDisplayUpdated', handleWinDisplayUpdated as EventListener);
      window.removeEventListener('slotSpin', handleSlotSpin as EventListener);
      window.removeEventListener('symbolsChanged', handleSymbolsChanged);
      window.removeEventListener(STEP_EVENTS.PAUSE_SLOT, handlePauseForTeardown);
      window.removeEventListener(STEP_EVENTS.RESUME_SLOT, handleResumeAfterTeardown);
      window.removeEventListener('reelStripsUpdated', handleReelStripsUpdated as EventListener);
    };
  }, [updateBackground, backgroundUrl, backgroundAdjustments, uiButtonAdjustments, isSpinning, preloadTextures, loadSpineSymbolAssets, triggerPickAndClick, triggerWheelBonus, betAmount, balance, config.bonus?.jackpots]);

  const renderSymbolGridBackgrounds = useCallback((metrics: ReturnType<typeof computeResponsiveMetrics>, showSymbolGrid: boolean) => {
    const app = appRef.current;
    if (!app) return;

    if (!showSymbolGrid) {
      if (symbolGridBackgroundRef.current && symbolGridBackgroundRef.current.parent) {
        symbolGridBackgroundRef.current.parent.removeChild(symbolGridBackgroundRef.current);
      }
      return;
    }

    let bg = symbolGridBackgroundRef.current;
    if (!bg || bg.destroyed) {
      bg = new PIXI.Graphics();
      symbolGridBackgroundRef.current = bg;
    }

    bg.clear();
    for (let reel = 0; reel < reels; reel++) {
      for (let row = 0; row < rows; row++) {
        bg.roundRect(
          metrics.offsetX + reel * metrics.spacingX,
          metrics.offsetY + row * metrics.spacingY,
          metrics.size,
          metrics.size,
          4
        ).fill({ color: 0x000000, alpha: 0.2 }).stroke({ width: 1, color: 0xffffff, alpha: 0.1 });
      }
    }

    let insertIndex = app.stage.children.length;
    if (reelContainersRef.current.length > 0 && reelContainersRef.current[0]?.parent) {
      insertIndex = app.stage.getChildIndex(reelContainersRef.current[0]);
    }
    if (insertIndex < 0) {
      insertIndex = app.stage.children.length;
    }

    if (!bg.parent) {
      app.stage.addChildAt(bg, insertIndex);
    } else {
      const bgIndex = app.stage.getChildIndex(bg);
      if (bgIndex > insertIndex) {
        app.stage.removeChild(bg);
        app.stage.addChildAt(bg, insertIndex);
      }
    }
  }, [reels, rows]);

  const renderOuterFrame = useCallback((metrics: ReturnType<typeof computeResponsiveMetrics>) => {
    if (!appRef.current) return;
    if (outerFrameSpriteRef.current) {
      if (outerFrameSpriteRef.current.parent) {
        outerFrameSpriteRef.current.parent.removeChild(outerFrameSpriteRef.current);
      }
      outerFrameSpriteRef.current.destroy();
      outerFrameSpriteRef.current = null;
    }

    if ((frameConfig.frameStyle === 'outer' || frameConfig.frameStyle === 'both') && frameConfig.framePath) {
      Assets.load(frameConfig.framePath).then((texture: PIXI.Texture) => {
        if (!appRef.current) return;
        try {
          const sprite = new PIXI.Sprite(texture);

          const gridWidth = reels * metrics.spacingX;
          const gridHeight = rows * metrics.spacingY;
          const gridCenterX = metrics.offsetX + gridWidth / 2;
          const gridCenterY = metrics.offsetY + gridHeight / 2;

          const targetWidth = gridWidth * 1.1;
          const targetHeight = gridHeight * 1.1;

          const scaleX = targetWidth / texture.width;
          const scaleY = targetHeight / texture.height;
          const baseScale = Math.max(scaleX, scaleY);

          const scaleFactor = (frameConfig.frameScale / 100) * baseScale;

          const finalWidth = texture.width * scaleFactor * (frameConfig.frameStretch.x / 100);
          const finalHeight = texture.height * scaleFactor * (frameConfig.frameStretch.y / 100);

          sprite.width = finalWidth;
          sprite.height = finalHeight;
          sprite.anchor.set(0.5);
          sprite.x = gridCenterX + frameConfig.framePosition.x;
          sprite.y = gridCenterY + frameConfig.framePosition.y;

          let insertIndex = 0;
          if (reelContainersRef.current.length > 0 && reelContainersRef.current[0]?.parent) {
            insertIndex = appRef.current.stage.getChildIndex(reelContainersRef.current[0]);
          }
          const gridBackgroundCount = symbolGridBackgroundRef.current && symbolGridBackgroundRef.current.parent ? 1 : 0;
          insertIndex = Math.max(0, insertIndex - gridBackgroundCount);
          appRef.current.stage.addChildAt(sprite, insertIndex);
          outerFrameSpriteRef.current = sprite;
        } catch (error) {
          console.error('Error loading outer frame:', error);
        }
      }).catch((error) => console.error('Error loading outer frame:', error));
    }
  }, [frameConfig.framePath, frameConfig.frameStyle, frameConfig.framePosition, frameConfig.frameScale, frameConfig.frameStretch, reels, rows]);

  const renderReelDividers = useCallback((metrics: ReturnType<typeof computeResponsiveMetrics>) => {
    if (!appRef.current) return;

    reelDividerSpritesRef.current.forEach(divider => {
      if (divider && !divider.destroyed && divider.parent) {
        divider.parent.removeChild(divider);
        divider.destroy();
      }
    });
    reelDividerSpritesRef.current = [];

    if ((frameConfig.frameStyle === 'reel' || frameConfig.frameStyle === 'both') && frameConfig.aiReelImage) {
      const gridHeight = rows * metrics.spacingY;

      const baseDividerWidth = metrics.size * 0.08; // Base width as 8% of symbol size (independent of gap)
      const dividerWidth = baseDividerWidth * (frameConfig.reelDividerStretch.x / 100);

      const dividerHeight = gridHeight * (frameConfig.reelDividerStretch.y / 100);

      Assets.load(frameConfig.aiReelImage).then((texture: PIXI.Texture) => {
        if (!appRef.current) return;
        for (let i = 0; i < reels - 1; i++) {
          let dividerSprite: PIXI.Sprite;
          try {
            dividerSprite = new PIXI.Sprite(texture);

            const textureAspect = texture.width / texture.height;
            const dividerAspect = dividerWidth / dividerHeight;

            let scaleX: number, scaleY: number;
            if (textureAspect > dividerAspect) {
              scaleX = dividerWidth / texture.width;
              scaleY = scaleX;
            } else {
              scaleY = dividerHeight / texture.height;
              scaleX = scaleY;
            }

            dividerSprite.scale.set(scaleX, scaleY);
            dividerSprite.width = dividerWidth;
            dividerSprite.height = dividerHeight;

            const reelICenterX = metrics.offsetX + i * metrics.spacingX + metrics.size / 2;
            const reelI1CenterX = metrics.offsetX + (i + 1) * metrics.spacingX + metrics.size / 2;
            const dividerCenterX = (reelICenterX + reelI1CenterX) / 2;
            const dividerTopY = metrics.offsetY;

            dividerSprite.x = dividerCenterX + frameConfig.reelDividerPosition.x;
            dividerSprite.y = dividerTopY + frameConfig.reelDividerPosition.y;

            dividerSprite.anchor.set(0.5, 0);

            let insertIndex = 0;
            if (reelContainersRef.current.length > 0 && reelContainersRef.current[0]?.parent) {
              insertIndex = appRef.current.stage.getChildIndex(reelContainersRef.current[0]);
            }
            const gridBackgroundCount = symbolGridBackgroundRef.current && symbolGridBackgroundRef.current.parent ? 1 : 0;
            insertIndex = Math.max(0, insertIndex - gridBackgroundCount);
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
      }).catch((error) => console.error('Error loading AI reel image:', error));
    }
  }, [frameConfig.frameStyle, frameConfig.reelGap, frameConfig.reelDividerPosition, frameConfig.reelDividerStretch, frameConfig.aiReelImage, reels, rows]);

  function renderGrid() {
    if (!appRef.current || !reelContainersRef.current?.length) return;
    const metrics = computeResponsiveMetrics();
    renderSymbolGridBackgrounds(metrics, gridAdjustments.showSymbolGrid);

    renderOuterFrame(metrics);
    renderReelDividers(metrics);

    for (let c = 0; c < reels; c++) {
      const rc = reelContainersRef.current[c];
      if (!rc || (rc as PIXI.Container & { destroyed?: boolean }).destroyed) continue;

      if (!isSpinning && !spinJustCompletedRef.current) {
        const reelSymbols = currentGrid && currentGrid[c] ? currentGrid[c] : undefined;
        renderReelFinal(c, reelSymbols, rc, metrics);
        rc.x = metrics.offsetX + c * metrics.spacingX;
        rc.y = metrics.offsetY;
      }

      const mask = reelMasksRef.current[c];
      if (mask) {
        const reelEnabled = maskControls.enabled && maskControls.perReelEnabled[c];

        if (reelEnabled) {
          mask.clear();
          if (maskControls.debugVisible) {
            mask.rect(metrics.offsetX + c * metrics.spacingX, metrics.offsetY, metrics.size, rows * metrics.spacingY).fill({ color: 0xff0000, alpha: 0.2 });
          } else {
            mask.rect(metrics.offsetX + c * metrics.spacingX, metrics.offsetY, metrics.size, rows * metrics.spacingY).fill(0xffffff);
          }
          mask.visible = true;
        } else {
          mask.clear();
          mask.rect(metrics.offsetX + c * metrics.spacingX, metrics.offsetY, metrics.size, rows * metrics.spacingY).fill({ color: 0x000000, alpha: 0 });
          mask.visible = true;
        }
        rc.mask = mask;
      }

      if (maskControls.enabled) {
        rc.visible = maskControls.perReelEnabled[c];
      } else {
        rc.visible = true;
      }
    }
  }
  const betValues = [0.25, 0.5, 1, 2, 5, 10, 20, 30, 50, 100, 200, 300, 500];

  /** Reserved for announcement/transition UI. */
  // @ts-expect-error Reserved for future use - kept for transition UI
  const _getTransitionAnimation = (style: 'fade' | 'slide' | 'zoom' | 'dissolve', duration: number) => {
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
  /** Used for background image transition when switching normal <-> freespin (full-bleed keyframes). Reserved for future use. */
  // @ts-expect-error Reserved for future use - kept for background transition
  const _getBackgroundTransitionAnimation = (style: 'fade' | 'slide' | 'zoom' | 'dissolve', duration: number) => {
    switch (style) {
      case 'fade':
        return `bgFadeTransition ${duration}s ease-in-out both`;
      case 'slide':
        return `bgSlideInRight ${duration}s ease-in-out both`;
      case 'zoom':
        return `bgZoomIn ${duration}s ease-in-out both`;
      case 'dissolve':
        return `bgDissolveTransition ${duration}s ease-in-out both`;
      default:
        return `bgFadeTransition ${duration}s ease-in-out both`;
    }
  };
  /** Reserved for inline background style. */
  // @ts-expect-error Reserved for future use - kept for inline background style
  const _getBackgroundStyle = () => {
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

    let backgroundSize: string = 'cover';

    if (scale !== 100) {
      const scalePercent = `${scale}%`;
      if (fit === 'fill') {
        backgroundSize = `${scalePercent} ${scalePercent}`;
      } else {
        backgroundSize = scalePercent;
      }
    } else {
      if (fit === 'contain') backgroundSize = 'contain';
      else if (fit === 'fill') backgroundSize = '100% 100%';
      else if (fit === 'scale-down') backgroundSize = 'auto';
      else backgroundSize = 'cover';
    }

    return {
      backgroundImage: `url(${currentBackground})`,
      backgroundSize: backgroundSize,
      backgroundPosition: `calc(50% + ${pos.x}px) calc(50% + ${pos.y}px)`,
      backgroundRepeat: 'no-repeat' as const,
      backgroundAttachment: 'local' as const,
      width: '100%',
      height: '100%'
    };
  };

  /** Returns background style for a specific mode (for two-layer transition). */
  const getBackgroundStyleForMode = (mode: 'normal' | 'freespin') => {
    const base = config.theme?.generated;
    const normalUrl = config.background?.backgroundImage || (base as { background?: string })?.background || null;
    const freespinUrl = config.derivedBackgrounds?.freespin || (config as any)?.freeSpinBackgroundImage || (base as { freeSpinBackground?: string })?.freeSpinBackground || (base as { background?: string })?.background || null;
    const currentBackground = mode === 'freespin' ? freespinUrl : normalUrl;

    if (!currentBackground) {
      return {
        backgroundColor: '#2B2624'
      };
    }

    const pos = backgroundAdjustments.position;
    const fit = backgroundAdjustments.fit || 'cover';
    const scale = backgroundAdjustments.scale || 100;

    let backgroundSize: string = 'cover';

    if (scale !== 100) {
      const scalePercent = `${scale}%`;
      if (fit === 'fill') {
        backgroundSize = `${scalePercent} ${scalePercent}`;
      } else {
        backgroundSize = scalePercent;
      }
    } else {
      if (fit === 'contain') backgroundSize = 'contain';
      else if (fit === 'fill') backgroundSize = '100% 100%';
      else if (fit === 'scale-down') backgroundSize = 'auto';
      else backgroundSize = 'cover';
    }

    return {
      backgroundImage: `url(${currentBackground})`,
      backgroundSize: backgroundSize,
      backgroundPosition: `calc(50% + ${pos.x}px) calc(50% + ${pos.y}px)`,
      backgroundRepeat: 'no-repeat' as const,
      backgroundAttachment: 'local' as const,
      width: '100%',
      height: '100%'
    };
  };

  useEffect(() => {
    if (isInFreeSpinMode && config.derivedBackgrounds?.freespin) {
      setBackgroundUrl(config.derivedBackgrounds.freespin);
    } else if (!isInFreeSpinMode) {
      const normalBackground = config.background?.backgroundImage || getBackgroundForMode();
      if (normalBackground) {
        setBackgroundUrl(normalBackground);
      }
    }
  }, [isInFreeSpinMode, config.derivedBackgrounds?.freespin, config.background?.backgroundImage]);

  /** After mode change, reveal the incoming layer so CSS transition runs (delay ensures start state is painted). */
  useEffect(() => {
    setBgTransitionRevealed(false);
    const timeoutId = setTimeout(() => {
      setBgTransitionRevealed(true);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [isInFreeSpinMode]);

  /** Inline transition styles for bg layer. Start state has no transition so it applies instantly; end state has transition so it animates in. */
  const getBgTransitionOverlayStyle = (isIncoming: boolean, revealed: boolean): React.CSSProperties => {
    if (!isIncoming) return {};
    const style = (config as any)?.freespinTransition?.style || 'fade';
    const duration = (config as any)?.freespinTransition?.duration ?? 3;
    const t = `transform ${duration}s ease-in-out, opacity ${duration}s ease-in-out${style === 'dissolve' ? `, filter ${duration}s ease-in-out` : ''}`;
    if (!revealed) {
      switch (style) {
        case 'slide': return { transform: 'translateX(100%)', transition: 'none' };
        case 'zoom': return { transform: 'scale(0.15)', transition: 'none' };
        case 'dissolve': return { opacity: 0, filter: 'blur(20px)', transition: 'none' };
        case 'fade':
        default: return { opacity: 0, transition: 'none' };
      }
    }
    switch (style) {
      case 'slide': return { transform: 'translateX(0)', transition: t };
      case 'zoom': return { transform: 'scale(1)', transition: t };
      case 'dissolve': return { opacity: 1, filter: 'blur(0)', transition: t };
      case 'fade':
      default: return { opacity: 1, transition: t };
    }
  };

  useEffect(() => {
    if (isSoundEnabled) {
      const latestAudioFiles = useGameStore.getState().audioFiles;

      if (latestAudioFiles.background?.bgm_main?.url) {
        playAudio('background', 'bgm_main', { loop: true, stopPrevious: true });
      }
      if (latestAudioFiles.ambience?.amb_casino?.url) {
        playAudio('ambience', 'amb_casino', { loop: true, stopPrevious: true });
      }
    }

    return () => {
      stopAllAudio();
    };
  }, [isSoundEnabled, audioFiles, playAudio]);
  useEffect(() => {
    if (!isSoundEnabled) return;
    const latestAudioFiles = useGameStore.getState().audioFiles;

    if (isInFreeSpinMode) {
      stopAudio('background', 'bgm_main');
      if (latestAudioFiles.background?.bgm_alt_loop?.url) {
        playAudio('background', 'bgm_alt_loop', { loop: true, stopPrevious: true });
      }
    } else {
      stopAudio('background', 'bgm_alt_loop');
      if (latestAudioFiles.background?.bgm_main?.url) {
        playAudio('background', 'bgm_main', { loop: true, stopPrevious: true });
      }
    }
  }, [isInFreeSpinMode, isSoundEnabled, audioFiles, playAudio, stopAudio]);

  const wheelSpin = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setWheelSpinning(true);

    const segments = config.bonus?.wheel?.segments || 8;
    const segmentValues =
      (config.bonus?.wheel as any)?.segmentValues || Array(segments).fill(50);

    const hasLevelUp = config.bonus?.wheel?.levelUp || false;
    const hasRespin = config.bonus?.wheel?.respin || false;

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

    const anglePerSegment = 360 / segments;
    const baseRotation = 1440;
    const targetAngle = 360 - (winningSegment * anglePerSegment + anglePerSegment / 2);
    const finalRotation = baseRotation + targetAngle;
    setWheelRotation(finalRotation);

    setTimeout(() => {
      setWheelSpinning(false);
      setWheelResult({ value: segmentValue, type: segmentType });

      if (segmentType === 'prize') {
        const prizeAmount = segmentValue * betAmount;
        setBalance(balance + prizeAmount);
        setWinAmount(prizeAmount);

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
        overflow: 'hidden',
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

      {/* Pixi Preview */}
      <div className="flex-1 relative bg-black overflow-auto flex flex-col">
        {/* Device/Browser Mockup Container */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: viewMode === 'desktop'
            ? 'radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f1419 100%)'
            : 'linear-gradient(135deg, #000000 0%, #1a1a1a 25%, #0d0d0d 50%, #1a1a1a 75%, #000000 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: viewMode === 'desktop' ? '0' : '20px'
        }}>
          {viewMode === 'desktop' ? (
            /* Desktop View - Full Screen */
            <div
              className="relative"
              style={{
                zIndex: 1,
                overflow: 'hidden',
                width: '100%',
                height: '100%',
                minWidth: 0,
                minHeight: 0,
                position: 'relative',
                isolation: 'isolate'
              }}
            >
              {/* Two-layer background: CSS transition driven by bgTransitionRevealed */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  ...getBackgroundStyleForMode('normal'),
                  transformOrigin: 'center center',
                  zIndex: isInFreeSpinMode ? 0 : 1,
                  ...getBgTransitionOverlayStyle(!isInFreeSpinMode, bgTransitionRevealed)
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  ...getBackgroundStyleForMode('freespin'),
                  transformOrigin: 'center center',
                  zIndex: isInFreeSpinMode ? 1 : 0,
                  ...getBgTransitionOverlayStyle(isInFreeSpinMode, bgTransitionRevealed)
                }}
              />
              {/* Game/canvas area: above background layers so symbols are always visible */}
              <div
                ref={containerRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10
                }}
              />
              {/* Logo Display */}
              {logoUrl && (
                <div
                  ref={logoContainerRef}
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

                          {!wheelSpinning && !wheelResult && (
                            <div
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] min-w-[50px] aspect-square rounded-full cursor-pointer z-20 hover:bg-yellow-400/20 transition-colors"
                              onClick={wheelSpin}
                              title="Click to spin the wheel"
                            />
                          )}

                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 pointer-events-none">
                            <div className="w-0 h-0 border-l-[10px] sm:border-l-[12px] md:border-l-[15px] border-r-[10px] sm:border-r-[12px] md:border-r-[15px] border-t-[20px] sm:border-t-[24px] md:border-t-[30px] border-l-transparent border-r-transparent border-t-red-600"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
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
                            {wheelResult ? 'Continue Playing 🎮' : 'Close'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isInFreeSpinMode && (() => {
                const metrics = computeResponsiveMetrics();
                const totalHeight = rows * metrics.freespinSpacingY;
                const topPosition = metrics.offsetY + totalHeight;

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

              {/* UI Controls */}
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
                  zIndex: 100,
                  backgroundColor: 'transparent',
                  isolation: 'isolate'
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

              {showWinTitle && currentWinTier !== 'small' && (() => {
                const winTitleId = currentWinTier === 'big' ? 'big_win' :
                  currentWinTier === 'mega' ? 'mega_win' :
                    currentWinTier === 'super' ? 'super_win' : null;

                let winTitleUrl = null;
                if (winTitleId) {
                  winTitleUrl = config.generatedAssets?.winTitles?.[winTitleId] || null;

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
                const titleImageSize = winTitleConfig?.titleImageSize || 100;
                const titleSizeMultiplier = titleImageSize / 100;

                const baseWidth = 400;
                const baseHeight = 150;

                const finalWidth = Math.round(baseWidth * titleSizeMultiplier);
                const finalHeight = Math.round(baseHeight * titleSizeMultiplier);

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
          ) : (
            /* Mobile Phone Mockup */
            <div
              style={{
                position: 'relative',
                width: viewMode === 'mobile-landscape' ? '700px' : '450px',
                height: viewMode === 'mobile-landscape' ? '400px' : '800px',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Phone Frame/Bezel */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)',
                  borderRadius: viewMode === 'mobile-landscape' ? '20px' : '40px',
                  border: '8px solid #0a0a0a',
                  boxShadow: `
                    0 0 0 2px rgba(255, 255, 255, 0.05),
                    0 30px 60px -15px rgba(0, 0, 0, 0.9),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.5)
                  `,
                  padding: viewMode === 'mobile-landscape' ? '12px 20px' : '20px 12px'
                }}
              >
                {/* Top Bezel with Camera Notch (Portrait) */}
                {viewMode === 'mobile' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '120px',
                      height: '30px',
                      background: '#000000',
                      borderRadius: '0 0 20px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      zIndex: 10
                    }}
                  >
                    {/* Camera Lens */}
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 30%, #1a1a1a, #000000)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.8)'
                      }}
                    />
                    {/* Speaker Grille */}
                    <div
                      style={{
                        width: '40px',
                        height: '4px',
                        borderRadius: '2px',
                        background: 'linear-gradient(to right, #0a0a0a, #1a1a1a, #0a0a0a)',
                        boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.9)'
                      }}
                    />
                  </div>
                )}

                {/* Landscape Camera (for landscape mode) */}
                {viewMode === 'mobile-landscape' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '8px',
                      transform: 'translateY(-50%)',
                      width: '30px',
                      height: '120px',
                      background: '#000000',
                      borderRadius: '20px 0 0 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      zIndex: 10
                    }}
                  >
                    {/* Camera Lens */}
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 30%, #1a1a1a, #000000)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.8)'
                      }}
                    />
                    {/* Speaker Grille */}
                    <div
                      style={{
                        width: '4px',
                        height: '40px',
                        borderRadius: '2px',
                        background: 'linear-gradient(to bottom, #0a0a0a, #1a1a1a, #0a0a0a)',
                        boxShadow: 'inset 1px 0 1px rgba(0, 0, 0, 0.9)'
                      }}
                    />
                  </div>
                )}

                {/* Screen Area - Contains PIXI Canvas */}
                <div
                  className="relative"
                  style={{
                    borderRadius: viewMode === 'mobile-landscape' ? '12px' : '32px',
                    position: 'relative',
                    boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)',
                    zIndex: 1,
                    overflow: 'hidden',
                    width: '100%',
                    height: '100%',
                    minWidth: 0,
                    minHeight: 0,
                    isolation: 'isolate'
                  }}
                >
                  {/* Two-layer background: CSS transition driven by bgTransitionRevealed */}
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      ...getBackgroundStyleForMode('normal'),
                      transformOrigin: 'center center',
                      borderRadius: 'inherit',
                      zIndex: isInFreeSpinMode ? 0 : 1,
                      ...getBgTransitionOverlayStyle(!isInFreeSpinMode, bgTransitionRevealed)
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      ...getBackgroundStyleForMode('freespin'),
                      transformOrigin: 'center center',
                      borderRadius: 'inherit',
                      zIndex: isInFreeSpinMode ? 1 : 0,
                      ...getBgTransitionOverlayStyle(isInFreeSpinMode, bgTransitionRevealed)
                    }}
                  />
                  {/* Game/canvas area: above background layers so symbols are always visible */}
                  <div
                    ref={containerRef}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 10,
                      borderRadius: 'inherit'
                    }}
                  />
                  {/* Logo Display */}
                  {logoUrl && (
                    <div
                      ref={logoContainerRef}
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

                              {!wheelSpinning && !wheelResult && (
                                <div
                                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] min-w-[50px] aspect-square rounded-full cursor-pointer z-20 hover:bg-yellow-400/20 transition-colors"
                                  onClick={wheelSpin}
                                  title="Click to spin the wheel"
                                />
                              )}

                              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 pointer-events-none">
                                <div className="w-0 h-0 border-l-[10px] sm:border-l-[12px] md:border-l-[15px] border-r-[10px] sm:border-r-[12px] md:border-r-[15px] border-t-[20px] sm:border-t-[24px] md:border-t-[30px] border-l-transparent border-r-transparent border-t-red-600"></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2">
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
                                {wheelResult ? 'Continue Playing 🎮' : 'Close'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isInFreeSpinMode && (() => {
                    const metrics = computeResponsiveMetrics();
                    const totalHeight = rows * metrics.freespinSpacingY;
                    const topPosition = metrics.offsetY + totalHeight;

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

                  {/* UI Controls */}
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
                      zIndex: 100,
                      backgroundColor: 'transparent',
                      isolation: 'isolate'
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

                  {showWinTitle && currentWinTier !== 'small' && (() => {
                    const winTitleId = currentWinTier === 'big' ? 'big_win' :
                      currentWinTier === 'mega' ? 'mega_win' :
                        currentWinTier === 'super' ? 'super_win' : null;

                    let winTitleUrl = null;
                    if (winTitleId) {
                      winTitleUrl = config.generatedAssets?.winTitles?.[winTitleId] || null;

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
                    const titleImageSize = winTitleConfig?.titleImageSize || 100;
                    const titleSizeMultiplier = titleImageSize / 100;

                    const baseWidth = 400;
                    const baseHeight = 150;

                    const finalWidth = Math.round(baseWidth * titleSizeMultiplier);
                    const finalHeight = Math.round(baseHeight * titleSizeMultiplier);

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
              </div>
            </div>
          )}
        </div>
      </div>

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
                            const allPrizes = (config.bonus?.pickAndClick as any)?.prizeValues || [100];
                            const maxPrize = Math.max(...allPrizes);
                            const minPrize = Math.min(...allPrizes);
                            const range = maxPrize - minPrize;
                            bgColor = cell.value <= (minPrize + range * 0.33)
                              ? 'bg-[#5C6BC0]'
                              : cell.value <= (minPrize + range * 0.66)
                                ? 'bg-[#EF5350]'
                                : 'bg-[#FFD700]';

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

                <div className="flex justify-center flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPickAndClick(false);
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

      {/* Free Spin Announcement - always fades in/out, centered */}
      {showFreeSpinAnnouncement && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          style={{
            animation: 'fadeInOut 3s ease-in-out forwards'
          }}
        >
          {(config as any)?.freeSpinAnnouncementImage &&
            typeof (config as any).freeSpinAnnouncementImage === 'string' &&
            (config as any).freeSpinAnnouncementImage.trim() !== '' ? (
            <img
              src={(config as any).freeSpinAnnouncementImage}
              alt="Free Spins Announcement"
              className="max-w-[90vw] max-h-[50vh] object-contain rounded-lg shadow-2xl"
              style={{
                minWidth: '300px',
                minHeight: '150px'
              }}
              onError={() => {
                console.warn('Failed to load free spin announcement image');
                setShowFreeSpinAnnouncement(false);
              }}
            />
          ) : (
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
        const position = winDisplayConfig.positions[currentDevice] || { x: 50, y: 50 };
        const scale = winDisplayConfig.scales[currentDevice] || 100;

        const textPosition = winDisplayTextConfig.positions[currentDevice] || { x: 50, y: 50 };
        const textScale = winDisplayTextConfig.scales[currentDevice] || 100;

        return (
          <div
            className="absolute z-50 cursor-pointer"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: `translate(-50%, -50%) scale(${scale / 100})`,
            }}
            onClick={() => {
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
                onError={(_e) => {
                  console.warn('Failed to load win display image:', config.winDisplayImage);
                }}
              />
              {/* Win Amount Overlay */}
              <div className="absolute" style={{
                left: `${textPosition.x}%`,
                top: `${textPosition.y}%`,
                transform: `translate(-50%, -50%) scale(${textScale / 100})`,
              }}>
                <div className="text-white font-bold text-center drop-shadow-lg">
                  <div
                    className="text-2xl md:text-3xl lg:text-4xl"
                    style={{
                      fontSize: 'clamp(18px, 4vw, 32px)',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,255,0.3)'
                    }}
                  >
                    {winDisplayTextConfig.showWinText && 'Win: '}<NumberImageRenderer
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
