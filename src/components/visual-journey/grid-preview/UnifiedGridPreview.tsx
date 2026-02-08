import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store';
import { useSlotLayout } from '../../../hooks/useSlotLayout';
import SlotGameUI from '../slot-animation/SlotGameUI';
import MobileLandscapeUI from '../slot-animation/MobileLandscapeUI';
import MobilePortraitUI from '../slot-animation/MobilePortraitUI';
import { useStoredSymbols } from '../../../utils/symbolStorage';
import { useSlotGame } from '../contexts/SlotGameContext';

/**
 * Global grid scale modifier - adjust this to fine-tune overall grid scaling
 * - Use values < 1.0 to reduce overall grid size (e.g., 0.94 = 94% of calculated size)
 * - Smaller values (0.9) work better for large grids like 9x5
 * - Larger values (0.96) work better for standard grids like 5x3
 */
export const defaultGridScaleModifier = 0.94;

// Type definitions
interface UnifiedGridPreviewProps {
  /** Reels count (width) */
  reels: number;
  /** Rows count (height) */
  rows: number;
  /** Whether to animate grid cells */
  animate?: boolean;
  /** Pay mechanism (betlines, ways, cluster) */
  payMechanism?: string;
  /** Orientation of the grid (landscape or portrait) */
  orientation: 'landscape' | 'portrait';
  /** Additional CSS classes */
  className?: string;
  /** Enable debug label */
  showDebugLabel?: boolean;
  /** Optional id for the grid - helpful for event listeners */
  id?: string;
  /** Whether to automatically scale the grid to fit its container */
  scaleToFit?: boolean;
  /** Scale modifier for fine-tuning grid size (0.9 = 90% of default size) */
  gridScaleModifier?: number;
  /** Vertical offset for centering adjustment (positive = move down, negative = move up) */
  verticalOffset?: number;
  /** SVG string for custom spin button */
  spinButtonSvg?: string;
  /** Image URL for custom spin button */
  spinButtonImageUrl?: string;
  /** Handler for spin button click */
  onSpin?: () => void;
  /** Current balance value */
  balance?: number;
  /** Current bet value */
  bet?: number;
  /** Current win value */
  win?: number;
  /** Whether to show the unified UI components (optional) */
  showUnifiedUI?: boolean;
  /** Path to the frame image */
  framePath?: string | null;
  /** Frame position {x, y} */
  framePosition?: { x: number; y: number };
  /** Frame scale (percentage) */
  frameScale?: number;
  /** Frame stretch {x, y} (percentage) */
  frameStretch?: { x: number; y: number };
  /** Path to the background image */
  backgroundPath?: string | null;
  /** Whether to show cell backgrounds */
  showCellBackgrounds?: boolean;
  /** Custom UI button images */
  customButtons?: {
    spinButton?: string;
    autoplayButton?: string;
    menuButton?: string;
    soundButton?: string;
    settingsButton?: string;
  };
}

/**
 * Unified Grid Preview Component
 * 
 * A responsive grid preview that follows AAA slot game layout conventions
 * Renders correctly in both landscape and portrait orientations
 * Dynamically updates based on grid configuration changes
 */
const UnifiedGridPreview: React.FC<UnifiedGridPreviewProps> = ({
  reels,
  rows,
  animate = true,
  payMechanism = 'betlines',
  orientation = 'landscape',
  className = '',
  showDebugLabel = true,
  id = 'slot-grid',
  scaleToFit = false,
  gridScaleModifier = defaultGridScaleModifier,
  verticalOffset = 0,
  spinButtonSvg,
  spinButtonImageUrl,
  onSpin = () => console.log('Spin clicked'),
  balance = 1000,
  bet = 1.00,
  win = 0.00,
  showUnifiedUI = true,
  framePath = null,
  framePosition = { x: 0, y: 0 },
  frameScale = 100,
  frameStretch = { x: 100, y: 100 },
  backgroundPath = null,
  showCellBackgrounds = false,
  customButtons
}) => {
  // Debug log to check if component is receiving customButtons
  useEffect(() => {
    console.log('[UnifiedGridPreview] Component mounted/updated');
    console.log('[UnifiedGridPreview] customButtons received:', customButtons);
    console.log('[UnifiedGridPreview] showUnifiedUI:', showUnifiedUI);
  }, [customButtons, showUnifiedUI]);

  const { theme, config } = useGameStore(state => ({
    theme: state.theme,
    config: state.config
  }));
  
  // Add state for storing symbol images from events
  const [symbolImages, setSymbolImages] = useState<string[]>([]);
  const [symbolsLoading, setSymbolsLoading] = useState(false); // Loading state to false by default to show fallbacks 
  const [isLoading, setIsLoading] = useState(false); // Overall loading state to false by default
  const symbolStore = useStoredSymbols();
  
  // Spinning state for real slot machine behavior
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelStops, setReelStops] = useState<number[]>([]);
  const [spinResult, setSpinResult] = useState<string[][]>([]);
  const [stoppedReels, setStoppedReels] = useState<boolean[]>([]);
  
  // Use ref to track if symbol request is in progress to avoid duplicate requests
  const requestInProgressRef = useRef(false);
  
  // Pre-load common symbols to memory for faster access
  useEffect(() => {
    // Preload standard symbols that might be needed
    const symbolsToPreload = [
      '/assets/symbols/wild.png',
      '/assets/symbols/scatter.png',
      '/assets/symbols/mid_1.png',
      '/assets/symbols/mid_2.png',
      '/assets/symbols/high_1.png',
      '/assets/symbols/high_2.png'
    ];
    
    // Create Image objects to preload
    symbolsToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);
  
  // Local state to ensure orientation updates are rendered correctly
  const [currentOrientation, setCurrentOrientation] = useState<'landscape' | 'portrait'>(orientation);
  
  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  
  // Log when showCellBackgrounds changes for debugging
  useEffect(() => {
    console.log(`UnifiedGridPreview: showCellBackgrounds changed to ${showCellBackgrounds}`);
  }, [showCellBackgrounds]);
  
  // Update local orientation state when props change
  useEffect(() => {
    setCurrentOrientation(orientation);
  }, [orientation]);
  
  // Listen for loading state changes - optimized version with shorter transitions
  useEffect(() => {
    const handleLoadingStateChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.loading !== undefined) {
        console.log(`Setting symbolsLoading to ${detail.loading} from source: ${detail.source || 'unknown'}`);
        setSymbolsLoading(detail.loading);
        setIsLoading(detail.loading);
        
        // If loading is complete, ensure we reset isLoading after a minimal delay
        if (!detail.loading) {
          setTimeout(() => {
            setIsLoading(false);
          }, 50); // Shorter delay for faster response
        }
      }
    };
    
    // Add event listener
    window.addEventListener('symbolLoadingStateChange', handleLoadingStateChange);
    
    return () => {
      window.removeEventListener('symbolLoadingStateChange', handleLoadingStateChange);
    };
  }, []);
  
  // Detect mobile and orientation
  useEffect(() => {
    const detectMobile = () => {
      // Enhanced mobile detection using multiple methods
      
      // Method 1: User agent detection (traditional)
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileByUA = mobileRegex.test(userAgent.toLowerCase());
      
      // Method 2: Screen size detection (more reliable for some devices)
      // Consider devices with screen width < 768px potentially mobile
      const isMobileBySize = window.innerWidth < 768;
      
      // Method 3: Touch capability (most modern mobile devices support touch)
      const isMobileByTouch = ('ontouchstart' in window) || 
                            (navigator.maxTouchPoints > 0) || 
                            ((navigator as any).msMaxTouchPoints > 0);
      
      // Combine detection methods - if any two are true, consider it mobile
      const mobileDetectionCount = [isMobileByUA, isMobileBySize, isMobileByTouch].filter(Boolean).length;
      const isMobileDevice = mobileDetectionCount >= 2 || isMobileByUA; // Either 2+ methods match or UA match
      
      // Determine orientation with improved detection
      const isLandscapeMode = (window.innerWidth > window.innerHeight) && 
                             window.matchMedia("(orientation: landscape)").matches;
      
      console.log(`[MobileDetection] UA: ${isMobileByUA}, Size: ${isMobileBySize}, Touch: ${isMobileByTouch}`);
      console.log(`[MobileDetection] IsMobile: ${isMobileDevice}, IsLandscape: ${isLandscapeMode}`);
      
      // Force mobile landscape mode for development/testing on specific URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const forceMobile = urlParams.get('forceMobile') === 'true';
      const forceLandscape = urlParams.get('forceLandscape') === 'true';
      
      setIsMobile(forceMobile || isMobileDevice);
      setIsLandscape(forceLandscape || isLandscapeMode);
    };
    
    // Initial detection
    detectMobile();
    
    // Set up listeners for orientation and size changes
    const updateDetection = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      console.log(`[OrientationChange] Width: ${window.innerWidth}, Height: ${window.innerHeight}, IsLandscape: ${isLandscapeMode}`);
      setIsLandscape(isLandscapeMode);
      
      // Full re-detection on significant size changes
      // This helps catch device rotation that might trigger resize but not orientationchange
      detectMobile();
    };
    
    window.addEventListener('resize', updateDetection);
    window.addEventListener('orientationchange', updateDetection);
    
    return () => {
      window.removeEventListener('resize', updateDetection);
      window.removeEventListener('orientationchange', updateDetection);
    };
  }, []);
  
  // Use the custom hook to calculate layout dimensions with the current orientation
  const { 
    isSmallGrid, 
    isMediumGrid,
    isLargeGrid,
    gapSize, 
    symbolSize, 
    fontSize, 
    gridPadding,
    containerAspectRatio,
    debugLabel,
    gridWidthPct,
    gridHeightPct,
    gridScale,
    virtualContainerWidth,
    virtualContainerHeight
  } = useSlotLayout(reels, rows, currentOrientation);
    
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Measure container dimensions for responsive scaling
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0
  });
  
  // Track scale factor for responsive scaling
  const [computedScale, setComputedScale] = useState(1);
  const gridContentRef = useRef<HTMLDivElement>(null);
  
  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    // Initial measurement
    updateDimensions();
    
    // Set up resize observer for responsive updates
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Implement scaleToFit functionality
  useEffect(() => {
    if (!scaleToFit || !containerRef.current || !gridContentRef.current) return;
    
    const calculateOptimalScale = () => {
      const container = containerRef.current;
      const gridContent = gridContentRef.current;
      
      if (!container || !gridContent) return 1;
      
      // Available container space
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      
      // Natural grid size (without scaling)
      const gridWidth = gridContent.scrollWidth;
      const gridHeight = gridContent.scrollHeight;
      
      // Calculate aspect ratios
      const gridAspectRatio = gridWidth / gridHeight;
      
      // Determine optimal scale within the container
      // Adjust padding based on grid dimensions - larger grids need more padding
      const paddingFactor = 
        (reels >= 7 || rows >= 5) ? 0.85 :  // Large grids (7+ reels or 5+ rows) need more padding
        (reels >= 5 || rows >= 4) ? 0.88 :  // Medium grids need moderate padding
        0.92;                               // Small grids (3x3, 4x3) need less padding
      
      // Apply precise padding based on grid dimensions
      const maxContainerWidth = containerWidth * paddingFactor;
      const maxContainerHeight = containerHeight * paddingFactor;
      
      // Scale factors based on width and height constraints
      const scaleByWidth = maxContainerWidth / gridWidth;
      const scaleByHeight = maxContainerHeight / gridHeight;
      
      // Use the smaller scale factor to ensure grid fits within container
      // Then apply the global gridScaleModifier for fine-tuning
      const baseScale = Math.min(scaleByWidth, scaleByHeight);
      
      // Special case for 3x3 grid - further reduce size to avoid UI overlap
      const specificGridModifier = 
        (reels === 3 && rows === 3) ? 0.9 :     // 3x3 needs smaller scaling
        (reels === 9 || rows >= 7) ? 0.9 :      // Very large grids need smaller scaling
        (reels >= 7 || rows >= 5) ? 0.92 :      // Large grids need reduced scaling
        1.0;                                    // Standard grids use normal scaling
      
      // Apply both global and grid-specific modifiers
      const optimalScale = baseScale * gridScaleModifier * specificGridModifier;
      
      // For debugging
      console.debug(`Grid ${reels}x${rows}: baseScale=${baseScale.toFixed(2)}, modifier=${gridScaleModifier}, specificMod=${specificGridModifier}, final=${optimalScale.toFixed(2)}`);
      
      return optimalScale;
    };
    
    const handleResize = () => {
      const scale = calculateOptimalScale();
      setComputedScale(scale);
    };
    
    // Initial calculation
    handleResize();
    
    // Add resize listener for responsive updates
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [scaleToFit, reels, rows, gridScaleModifier]);
  
  // Cell animation variants for staggered animation
  const cellVariants = {
    hidden: { scale: 0, opacity: 0 },
    loading: { scale: 0.95, opacity: 0.7 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.01, // Faster animation
        duration: 0.2,
        type: 'spring',
        stiffness: 300,
        damping: 12
      }
    }),
    hover: { 
      scale: 1.05, 
      boxShadow: "0 0 8px rgba(255,255,255,0.2)",
      transition: { duration: 0.2 }
    }
  };
  
  // Different animation variant for winning cells
  const winningCellVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.01 + 0.3, // Slight additional delay for dramatic effect
        duration: 0.3,
        type: 'spring',
        stiffness: 200,
        damping: 10
      }
    }),
    // Continuous pulsing animation for winning cells
    animate: {
      scale: [1, 1.07, 1],
      boxShadow: [
        "0 0 15px rgba(255,215,0,0.3)", 
        "0 0 25px rgba(255,215,0,0.6)", 
        "0 0 15px rgba(255,215,0,0.3)"
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "reverse"
      }
    },
    hover: { 
      scale: 1.1,
      boxShadow: "0 0 15px rgba(255,215,0,0.7)",
      transition: { duration: 0.2 }
    }
  };
  
  // Update grid attributes when props change
  useEffect(() => {
    if (gridRef.current) {
      // Add data attributes for external references
      gridRef.current.setAttribute('data-reels', reels.toString());
      gridRef.current.setAttribute('data-rows', rows.toString());
      gridRef.current.setAttribute('data-orientation', currentOrientation);
      
      // Update the grid preview header if it exists
      const header = document.getElementById('grid-preview-header');
      if (header) {
        header.textContent = `${reels}×${rows} grid - ${currentOrientation} mode`;
      }
    }
  }, [reels, rows, currentOrientation]);
  
  // Listen for grid config changed events from Step3_ReelConfiguration
  useEffect(() => {
    const handleGridConfigChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.orientation) {
        setCurrentOrientation(detail.orientation);
      }
    };
    
    window.addEventListener('gridConfigChanged', handleGridConfigChange);
    
    return () => {
      window.removeEventListener('gridConfigChanged', handleGridConfigChange);
    };
  }, []);
  
  // Listen for background changed events from Step6_BackgroundCreator
  useEffect(() => {
    const handleBackgroundChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log('UnifiedGridPreview received backgroundChanged event:', detail);
      
      if (detail?.backgroundPath) {
        // Update the store with the new background path
        const { config } = useGameStore.getState();
        useGameStore.getState().updateConfig({
          background: {
            ...config.background,
            backgroundImage: detail.backgroundPath,
            type: detail.type || 'static'
          },
          backgroundImage: detail.backgroundPath
        });
        
        console.log('Updated background path in store:', detail.backgroundPath);
        
        // Force a refresh of the grid
        setTimeout(() => {
          document.dispatchEvent(new Event('refreshGridContent'));
        }, 50);
      }
    };
    
    window.addEventListener('backgroundChanged', handleBackgroundChanged);
    
    return () => {
      window.removeEventListener('backgroundChanged', handleBackgroundChanged);
    };
  }, []);
  
  // Listen for grid refresh events from refresh button
  useEffect(() => {
    const handleGridRefresh = () => {
      console.log('Grid refresh triggered in UnifiedGridPreview');
      console.log('Current backgroundPath:', backgroundPath);
      
      try {
        // Get symbols directly from store if available
        const { theme } = useGameStore.getState();
        if (theme?.generated?.symbols && theme.generated.symbols.length > 0) {
          console.log('Directly loading symbols from store on grid refresh:', 
            theme.generated.symbols.length);
          
          // Update symbols from store
          setSymbolImages(theme.generated.symbols);
          prevSymbolsRef.current = [...theme.generated.symbols];
        } else {
          // Fallback to request mechanism
          window.dispatchEvent(new CustomEvent('requestSymbols'));
          console.log('Requesting symbols due to grid refresh (store empty)');
        }
      } catch (error) {
        console.error('Error getting symbols from store:', error);
        // Fallback to request mechanism
        window.dispatchEvent(new CustomEvent('requestSymbols'));
      }
      
      // Force re-render by briefly setting a loading state
      setIsMobile(prevState => {
        // Toggle and then toggle back to force React to re-render
        setTimeout(() => setIsMobile(prevState), 50);
        return !prevState;
      });
      
      // Also re-render the grid with current symbols
      console.log(`Current symbolImages count: ${symbolImages.length}`);
      
      // Reset any animation states or cached values if needed
      // This creates a visual refresh effect for the user
      
      // Dispatch a DOM event that child components can listen for
      const refreshDetailEvent = new CustomEvent('gridContentRefreshed', {
        detail: { timestamp: Date.now(), symbolCount: symbolImages.length }
      });
      document.dispatchEvent(refreshDetailEvent);
    };
    
    document.addEventListener('refreshGridContent', handleGridRefresh);
    
    return () => {
      document.removeEventListener('refreshGridContent', handleGridRefresh);
    };
  }, []);
  
  // Cache the previously received symbols to prevent unnecessary updates
  const prevSymbolsRef = useRef<string[]>([]);
  
  // Check the store for symbols when our local symbolImages are empty
  useEffect(() => {
    try {
      // Reference to store config
      const { theme } = useGameStore.getState();
      
      // Only run if we don't have symbols locally but they exist in the store
      if (symbolImages.length === 0 && 
          theme?.generated?.symbols && 
          theme.generated.symbols.length > 0) {
        console.log('UnifiedGridPreview: No local symbols, loading from store:', 
          theme.generated.symbols.length);
        
        // Use symbols from the store
        setSymbolImages(theme.generated.symbols);
        prevSymbolsRef.current = [...theme.generated.symbols];
      }
      
      // Set loading to false after we've checked for symbols
      if (symbolsLoading && symbolImages.length > 0) {
        // Small delay to ensure rendering is complete
        setTimeout(() => {
          setSymbolsLoading(false);
          setIsLoading(false);
        }, 100);
      }
    } catch (error) {
      console.error('Error checking store for symbols:', error);
      // Still set loading to false even if there's an error
      setSymbolsLoading(false);
    }
  }, [symbolImages.length, symbolsLoading]);
  
  // Listen for symbolsChanged events - optimized for faster transitions and fewer dispatches
  useEffect(() => {
    const handleSymbolsChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log('UnifiedGridPreview received symbolsChanged event:', detail);
      
      // Mark request as no longer in progress
      requestInProgressRef.current = false;
      
      // If loading state is provided directly in the event, set it
      if (detail?.loading !== undefined) {
        setSymbolsLoading(detail.loading);
      }
      
      if (detail?.symbols && Array.isArray(detail.symbols)) {
        // Log the symbol types and counts to debug medium symbol issues
        const symbolTypes = {
          all: detail.symbols.length,
          base64: detail.symbols.filter(s => s.startsWith('data:')).length,
          url: detail.symbols.filter(s => !s.startsWith('data:')).length,
          medium: detail.symbols.filter(s => s.includes('medium') || s.includes('mid')).length
        };
        console.log('Symbol analysis:', symbolTypes);
        
        // Enhanced comparison - only skip update if both lengths AND all URLs are identical
        // Always proceed with the update when generating new images (never skip in that case)
        const isGenerating = detail.source === 'generateSymbol' || detail.forceUpdate === true;
        const isSameSymbols = 
          !isGenerating && 
          prevSymbolsRef.current.length === detail.symbols.length && 
          JSON.stringify(prevSymbolsRef.current) === JSON.stringify(detail.symbols);
          
        if (isSameSymbols) {
          console.log('Skipping symbol update - received identical symbols');
          setSymbolsLoading(false);
          setIsLoading(false);
          return;
        }
        
        // Verify we have all expected symbol types
        const hasWild = detail.symbols.some(s => s.includes('wild'));
        const hasScatter = detail.symbols.some(s => s.includes('scatter'));
        const hasMedium = symbolTypes.medium > 0;
        
        // IMPORTANT: Always update symbols when they're available
        // This is critical for Step 3-4 transitions
        // Keep a copy of the current set for future comparisons
        prevSymbolsRef.current = [...detail.symbols];
        
        // Set symbols from the event - do this first before changing loading state
        setSymbolImages(detail.symbols);
        
        // Set loading to false now that we have symbols - use minimal delay
        setSymbolsLoading(false);
        setIsLoading(false);
        console.log('UnifiedGridPreview updated with symbols:', detail.symbols.length, 'Previous count:', symbolImages.length);
        
        // Force refresh grid content with ultra-short delay
        setTimeout(() => {
          const refreshDetailEvent = new CustomEvent('gridContentRefreshed', {
            detail: { timestamp: Date.now() }
          });
          document.dispatchEvent(refreshDetailEvent);
        }, 50); // Shorter timeout for faster response
      } else {
        // No symbols in the event, make sure loading is still set to false
        setSymbolsLoading(false);
        setIsLoading(false);
        console.log('No symbols in event, ensuring loading state is false');
      }
    };
    
    // Handle symbol requests more efficiently - prevent duplicate requests
    const handleRequestSymbols = () => {
      // Don't make duplicate requests when one is already in progress
      if (requestInProgressRef.current) {
        console.log('Ignoring duplicate symbol request - request already in progress');
        return;
      }
      
      // Mark request as in progress
      requestInProgressRef.current = true;
      
      // First check if we already have symbols
      if (symbolImages.length > 0) {
        console.log('Already have symbols, no need to request more');
        requestInProgressRef.current = false;
        return;
      }
      
      console.log('Processing symbol request');
      
      // Try to get symbols from store
      try {
        const { theme } = useGameStore.getState();
        if (theme?.generated?.symbols && theme.generated.symbols.length > 0) {
          console.log('Found symbols in store during request:', theme.generated.symbols.length);
          
          // Update state with store symbols
          setSymbolImages(theme.generated.symbols);
          prevSymbolsRef.current = [...theme.generated.symbols];
          setSymbolsLoading(false);
          setIsLoading(false);
          requestInProgressRef.current = false;
        } else {
          // No symbols found, mark request as no longer in progress
          requestInProgressRef.current = false;
        }
      } catch (error) {
        console.error('Error processing symbol request:', error);
        requestInProgressRef.current = false;
      }
    };
    
    // Add event listeners
    window.addEventListener('symbolsChanged', handleSymbolsChanged);
    window.addEventListener('requestSymbols', handleRequestSymbols);
    
    // Initial request on mount - if we don't already have symbols
    if (symbolImages.length === 0 && !requestInProgressRef.current) {
      window.dispatchEvent(new CustomEvent('requestSymbols'));
    }
    
    // Single check for store symbols on mount - critical for Step 3-4 transition
    const checkStoreForSymbols = () => {
      try {
        const { theme } = useGameStore.getState();
        if (theme?.generated?.symbols && theme.generated.symbols.length > 0) {
          console.log('Checking store for symbols on mount:', theme.generated.symbols.length);
          
          // Update state with store symbols
          setSymbolImages(theme.generated.symbols);
          prevSymbolsRef.current = [...theme.generated.symbols];
          setSymbolsLoading(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking store for symbols:', error);
      }
    };
    
    // Check once on mount
    checkStoreForSymbols();
    
    // Set up a single follow-up check after a short delay
    const timeout = setTimeout(() => {
      // Only make another request if we still don't have symbols
      if (symbolImages.length === 0 && !requestInProgressRef.current) {
        window.dispatchEvent(new CustomEvent('requestSymbols'));
      }
    }, 500);
    
    return () => {
      window.removeEventListener('symbolsChanged', handleSymbolsChanged);
      window.removeEventListener('requestSymbols', handleRequestSymbols);
      clearTimeout(timeout);
    };
  }, [symbolImages.length]);
  
  // Spin handler function to create real slot machine behavior
  const handleSpin = () => {
    if (isSpinning) return; // Prevent double spins
    
    console.log('🎰 Starting real slot machine spin...');
    setIsSpinning(true);
    setStoppedReels(new Array(reels).fill(false));
    
    // Call the original onSpin handler if provided
    if (onSpin) {
      onSpin();
    }
    
    // Generate random symbols for each position
    const availableSymbols = symbolImages.length > 0 ? symbolImages : [
      '/assets/symbols/wild.png',
      '/assets/symbols/scatter.png',
      '/assets/symbols/high_1.png',
      '/assets/symbols/high_2.png',
      '/assets/symbols/high_3.png',
      '/assets/symbols/mid_1.png',
      '/assets/symbols/mid_2.png',
      '/assets/symbols/low_1.png',
      '/assets/symbols/low_2.png',
      '/assets/symbols/low_3.png'
    ];
    
    // Create new grid result
    const newResult: string[][] = [];
    for (let reel = 0; reel < reels; reel++) {
      const reelSymbols: string[] = [];
      for (let row = 0; row < rows; row++) {
        // Random symbol selection with weighted distribution
        const randomIndex = Math.floor(Math.random() * availableSymbols.length);
        reelSymbols.push(availableSymbols[randomIndex]);
      }
      newResult.push(reelSymbols);
    }
    
    // Set the final result immediately
    setSpinResult(newResult);
    
    // Set up staggered reel stopping (left to right like real slots)
    for (let i = 0; i < reels; i++) {
      const stopDelay = 1500 + (i * 300); // Each reel stops 300ms after the previous
      setTimeout(() => {
        setStoppedReels(prev => {
          const newStopped = [...prev];
          newStopped[i] = true;
          return newStopped;
        });
        
        // If this is the last reel, end the spin
        if (i === reels - 1) {
          setTimeout(() => {
            setIsSpinning(false);
            setStoppedReels([]);
            console.log('🎰 Spin complete!');
          }, 500);
        }
      }, stopDelay);
    }
  };
  
  // Generate grid cells
  const renderGridCells = () => {
    // Check for valid dimensions
    if (reels <= 0 || rows <= 0 || reels > 9 || rows > 9) {
      return null;
    }
    
    const cells = [];
    
    // Create the cells
    for (let row = 0; row < rows; row++) {
      for (let reel = 0; reel < reels; reel++) {
        // Calculate is winning cell (for demo purposes)
        const isWinningCell = payMechanism === 'betlines' ? 
          // Simple middle row win line for betlines
          (row === Math.floor(rows/2) && reel <= Math.min(4, reels-1)) : 
          // Cluster of cells for cluster pays
          (payMechanism === 'cluster' && 
           row > 0 && row < rows-1 && reel > 0 && reel < reels-1 && 
           Math.abs(row - Math.floor(rows/2)) + Math.abs(reel - Math.floor(reels/2)) <= 1);
        
        // Determine if this reel should be spinning
        const isReelSpinning = isSpinning && (stoppedReels.length === 0 || !stoppedReels[reel]);
        
        cells.push(
          <motion.div
            key={`cell-${reel}-${row}`}
            className={`relative flex items-center justify-center ${
              isSmallGrid ? 'border-2 border-gray-700/80' : 'border border-gray-700/70'
            } hover:border-blue-400/80 rounded-md overflow-hidden ${
              isWinningCell ? 'border-yellow-400 ring-1 ring-yellow-400/50' : ''
            } ${isReelSpinning ? 'reel-spinning' : ''}`}
            custom={(row * reels) + reel} // For staggered animation
            initial="hidden"
            animate={isLoading ? "loading" : (animate ? (isWinningCell ? ["visible", "animate"] : "visible") : "hidden")}
            whileHover="hover"
            variants={isWinningCell ? winningCellVariants : cellVariants}
            style={{
              backgroundColor: showCellBackgrounds ? '#0a1428' : 'transparent', // Conditionally apply background
              boxShadow: isWinningCell ? 
                "inset 0 0 10px rgba(255,215,0,0.5), 0 0 15px rgba(255,215,0,0.4)" : 
                showCellBackgrounds ? (isSmallGrid ? "inset 0 0 3px rgba(0,0,0,0.3)" : "inset 0 0 5px rgba(0,0,0,0.5)") : "none",
              width: `${symbolSize}px`,
              height: `${symbolSize}px`,
              maxWidth: `${symbolSize}px`,
              maxHeight: `${symbolSize}px`,
            }}
            data-reel={reel}
            data-row={row}
            data-winning={isWinningCell ? 'true' : 'false'}
          >
            {/* Win line indicator */}
            {isWinningCell && (
              <div className="absolute inset-0 bg-yellow-400/10 z-10 animate-pulse"></div>
            )}
            
            {/* Card symbols for better visualization */}
            <div 
              className={`flex items-center justify-center w-full h-full ${
                isWinningCell ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              {/* Show loading state if symbols are loading */}
              {symbolsLoading || isLoading ? (
                <div className="w-full h-full flex items-center justify-center animate-pulse">
                  <div 
                    className={`w-2/3 h-2/3 rounded-md shadow-inner ${
                      // Highlight the middle row with a different color
                      (row === 1 && rows === 3) || row === Math.floor(rows/2) ? 
                        'bg-purple-700/40 border border-purple-500/30' : 
                        'bg-gray-700/50'
                    }`}
                  ></div>
                </div>
              ) : (
                /* Render actual symbol images if available */
                symbolImages.length > 0 ? (
                  // Calculate symbol index based on position - use spin result if spinning
                  (() => {
                    let imageSrc: string;
                    const symbolIndex = (row * reels + reel) % symbolImages.length;
                    
                    // Use spin result if available and not spinning, otherwise use normal distribution
                    if (spinResult.length > 0 && spinResult[reel] && spinResult[reel][row] && !isReelSpinning) {
                      imageSrc = spinResult[reel][row];
                    } else {
                      imageSrc = symbolImages[symbolIndex];
                    }
                    
                    // If we have a valid image, render it
                    if (imageSrc) {
                      return (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            backgroundImage: `url(${imageSrc})`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        >
                          {/* Render actual image element for base64 data or saved server images */}
                          {(imageSrc.startsWith('data:') || imageSrc.includes('/saved-images/')) && (
                            <img 
                              src={imageSrc} 
                              alt={`Symbol ${symbolIndex}`}
                              className="max-w-full max-h-full object-contain"
                              loading="eager" // Prioritize loading these images
                              onLoad={(e) => {
                                // Add a success class to indicate the image loaded successfully
                                (e.target as HTMLImageElement).classList.add('loaded-success');
                                console.log(`Successfully loaded symbol image: ${imageSrc.substring(0, 30)}...`);
                                
                                // Force parent containers to update
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  parent.style.opacity = '0.99';
                                  setTimeout(() => {
                                    parent.style.opacity = '1';
                                  }, 10);
                                }
                              }}
                              onError={(e) => {
                                // Handle image loading errors
                                console.error(`Error loading image: ${imageSrc}`);
                                
                                // Try to determine if this is a scatter or wild based on the URL
                                const isSpecialSymbol = 
                                  imageSrc.includes('wild') || 
                                  imageSrc.includes('scatter');
                                
                                // Use appropriate fallback image
                                if (isSpecialSymbol) {
                                  if (imageSrc.includes('wild')) {
                                    (e.target as HTMLImageElement).src = '/assets/symbols/wild.png';
                                  } else {
                                    (e.target as HTMLImageElement).src = '/assets/symbols/scatter.png';
                                  }
                                } else {
                                  // For regular symbols, use the placeholder
                                  (e.target as HTMLImageElement).src = '/assets/symbols/placeholder.png';
                                }
                                
                                // Mark as fallback for debugging
                                (e.target as HTMLImageElement).dataset.fallback = 'true';
                                
                                // Force parent element to update
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  parent.style.opacity = '0.99';
                                  setTimeout(() => {
                                    parent.style.opacity = '1';
                                  }, 10);
                                }
                                
                                // Request a refresh of grid content
                                setTimeout(() => {
                                  console.log('Requesting refresh after image error');
                                  document.dispatchEvent(new Event('refreshGridContent'));
                                }, 100);
                              }}
                            />
                          )}
                        </div>
                      );
                    }
                    // Fallback to text if image is not valid
                    return (
                      <div className="font-bold">
                        {symbolIndex + 1}
                      </div>
                    );
                  })()
                ) : (
                  // Fallback to text symbols if no images are available
                  (() => {
                    // Generate different symbols based on position
                    // Creating a pattern of symbols that looks like a real slot machine
                    const symbols = ['10', 'J', 'Q', 'K', 'A', '♦', '♥', '♠', '♣', 'W'];
                    
                    // Special symbols in specific positions
                    if (reel === Math.floor(reels/2) && row === Math.floor(rows/2)) {
                      // Wild in center
                      return (
                        <div 
                          className="text-yellow-400 font-bold"
                          style={{ 
                            fontSize: `${Math.min(fontSize * 1.2, 32)}px`,
                            textShadow: '0 0 5px rgba(255,215,0,0.7)'
                          }}
                        >
                          W
                        </div>
                      );
                    } else if (reel === reels-1 && row === 0) {
                      // Scatter in top right (bonus symbol)
                      return (
                        <div 
                          className="text-blue-400 font-bold"
                          style={{
                            fontSize: `${Math.min(fontSize * 1.2, 32)}px`,
                            textShadow: '0 0 5px rgba(59,130,246,0.7)'
                          }}
                        >
                          ★
                        </div>
                      );
                    } else {
                      // Regular symbols - distributed to make visual sense
                      const baseIndex = (row * reels + reel) % symbols.length;
                      
                      // Determine symbol type based on position
                      let symbolType: 'high' | 'medium' | 'low';
                      let isSpecialMedium = false;
                      
                      // Force medium symbols in certain positions to ensure they're visible
                      // Make sure middle row always has medium symbols for 3-row grids
                      if ((reel === 1 && row === 1) || (reel === 2 && row === 1) || 
                          (rows === 3 && row === 1) || // Always use medium symbols for middle row in 3-row grids
                          (rows > 3 && row === Math.floor(rows/2))) { // Middle row for grids with more than 3 rows
                        symbolType = 'medium';
                        isSpecialMedium = true;
                      } else if (row === 0) {
                        symbolType = 'high';
                      } else if (row === 1 || (rows <= 3 && row === rows - 1)) {
                        symbolType = 'medium';
                      } else {
                        symbolType = 'low';
                      }
                      
                      // Card symbols (high value)
                      if (symbolType === 'high') {
                        const symbolIndex = (baseIndex % 5); // High value symbols (10, J, Q, K, A)
                        return (
                          <div 
                            className="font-bold"
                            data-symbol-type="high"
                            style={{
                              fontSize: `${fontSize}px`,
                              textShadow: '0 0 3px rgba(0,0,0,0.5)'
                            }}
                          >
                            {symbols[symbolIndex]}
                          </div>
                        );
                      } 
                      // Medium value symbols (suits)
                      else if (symbolType === 'medium') {
                        // Use special styling for debug positions
                        const symbolIndex = 5 + (baseIndex % 4); // Medium value symbols (suits)
                        return (
                          <div 
                            className={
                              isSpecialMedium ? 
                                (row === 1 || row === Math.floor(rows/2) ? 'text-purple-500 font-bold' : 'text-green-500 font-bold') :
                              symbolIndex === 6 || symbolIndex === 5 ? 'text-red-400 font-bold' : 'text-blue-200 font-bold'
                            }
                            data-symbol-type="medium"
                            style={{
                              fontSize: `${fontSize}px`,
                              textShadow: isSpecialMedium ?
                                (row === 1 || row === Math.floor(rows/2) ? 
                                  '0 0 5px rgba(168,85,247,0.7)' : // Purple glow for middle row
                                  '0 0 5px rgba(16,185,129,0.6)') : // Green glow for other special mediums
                                symbolIndex === 6 || symbolIndex === 5 ? 
                                  '0 0 3px rgba(248,113,113,0.4)' : '0 0 3px rgba(56,189,248,0.4)',
                              border: isSpecialMedium ? 
                                (row === 1 || row === Math.floor(rows/2) ? 
                                  '1px solid rgba(168,85,247,0.6)' : // Purple border for middle row
                                  '1px solid rgba(16,185,129,0.5)') : // Green border for other special mediums
                                'none'
                            }}
                          >
                            {isSpecialMedium ? (row === 1 || row === Math.floor(rows/2) ? '♣' : '♦') : symbols[symbolIndex]}
                          </div>
                        );
                      } 
                      // Numbers/low value
                      else {
                        const symbolIndex = baseIndex % 5; // Low value symbols
                        return (
                          <div
                            className="text-gray-400 font-bold"
                            data-symbol-type="low"
                            style={{
                              fontSize: `${fontSize}px`,
                              textShadow: '0 0 3px rgba(156,163,175,0.3)'
                            }}
                          >
                            {symbols[symbolIndex]}
                          </div>
                        );
                      }
                    }
                  })()
                )
              )}
            </div>
          </motion.div>
        );
      }
    }
    
    return cells;
  };
  
  // Apply premium shadow styling based on grid size
  const getGridShadowStyle = () => {
    if (isSmallGrid) {
      return 'inset 0 0 40px rgba(0,40,80,0.7), 0 0 25px rgba(0,0,0,0.7), 0 0 1px rgba(59,130,246,0.5)';
    } else if (isMediumGrid) {
      return 'inset 0 0 35px rgba(0,40,80,0.6), 0 0 20px rgba(0,0,0,0.6), 0 0 1px rgba(59,130,246,0.4)';
    } else {
      return 'inset 0 0 30px rgba(0,40,80,0.5), 0 0 15px rgba(0,0,0,0.5), 0 0 1px rgba(59,130,246,0.3)';
    }
  };
  
  // Render portrait mode virtual phone container
  const renderPortraitMode = () => {
    // Calculate the virtual phone container size based on available space
    const containerWidth = containerDimensions.width;
    const containerHeight = containerDimensions.height;
    
    // iPhone aspect ratio
    const phoneRatio = 390 / 844;
    
    // Calculate phone size to fit in container while maintaining aspect ratio
    let phoneWidth, phoneHeight;
    
    if (containerHeight * phoneRatio <= containerWidth) {
      // Height constrained
      phoneHeight = containerHeight * 0.9; // 90% of available height
      phoneWidth = phoneHeight * phoneRatio;
    } else {
      // Width constrained
      phoneWidth = containerWidth * 0.9; // 90% of available width
      phoneHeight = phoneWidth / phoneRatio;
    }
    
    return (
      <>
        {/* Phone frame */}
        <div 
          className="relative rounded-[40px] bg-black shadow-xl overflow-hidden"
          style={{
            width: `${phoneWidth}px`,
            height: `${phoneHeight}px`,
            maxWidth: '100%',
            maxHeight: '100%',
            boxShadow: '0 0 0 2px rgba(255,255,255,0.1), 0 10px 40px rgba(0,0,0,0.5)'
          }}
        >
          {/* Phone notch */}
          <div 
            className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/4 h-[30px] bg-black z-20 rounded-b-xl"
            style={{ 
              boxShadow: 'inset 0 -2px 8px rgba(255,255,255,0.1)' 
            }}
          >
            <div className="absolute left-1/2 top-[10px] transform -translate-x-1/2 w-[8px] h-[8px] rounded-full bg-gray-500"></div>
          </div>
          
          {/* Phone screen with dark blue game background */}
          <div 
            className="w-full h-full flex flex-col bg-[#051425] pt-[40px] pb-[20px] px-[10px]"
          >
            {/* Game title bar */}
            <div className="h-[40px] flex items-center justify-between px-2 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 rounded-t-lg">
              <div className="text-white font-semibold text-sm">Premium Slot</div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500/80 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-3 h-3 text-white fill-current">
                    <path d="M8 3.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H6a.5.5 0 0 1 0-1h1.5V4a.5.5 0 0 1 .5-.5z"/>
                    <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14z"/>
                  </svg>
                </div>
                <div className="text-white text-xs">$1,000</div>
              </div>
            </div>
            
            {/* Mobile Grid Area */}
            <div 
              className="flex-grow bg-[#041022] flex items-center justify-center p-4"
            >
              {/* Grid Cells Container - Scaled appropriately for mobile */}
              <div 
                className={`slot-grid-container relative rounded-md ${
                  isSmallGrid ? 'border-2' : 'border'
                } border-blue-700 bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center`}
                data-testid="slot-grid-container"
                style={{
                  width: `${85}%`,
                  height: `${60}%`,
                  padding: `${gridPadding}px`,
                  boxShadow: getGridShadowStyle(),
                  position: 'relative', // Needed for frame positioning
                  overflow: 'hidden' // For background and frame overflow control
                }}
                data-grid-size={`${reels}x${rows}`}
                data-orientation={currentOrientation}
                id={id}
              >
                {/* Background image if provided (inside grid container) */}
                {backgroundPath && (
                  <div 
                    className="absolute inset-0 z-0" 
                    style={{
                      backgroundImage: `url(${backgroundPath})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: 0.9,
                      backgroundRepeat: 'no-repeat',
                      transform: 'scale(1.1)', // Slightly larger to cover the container
                      filter: 'blur(0px)' // Optional subtle blur for depth
                    }}
                  />
                )}
                
                {/* Grid with proper slot machine styling */}
                <div 
                  className="slot-grid flex flex-wrap items-center justify-center relative z-10"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${reels}, ${symbolSize}px)`,
                    gridTemplateRows: `repeat(${rows}, ${symbolSize}px)`,
                    gap: `${gapSize}px`,
                    width: 'auto',
                    height: 'auto',
                  }}
                >
                  {renderGridCells()}
                </div>
                
                {/* Frame overlay if provided */}
                {framePath && (
                  <div 
                    className="absolute inset-0 z-20 pointer-events-none" 
                    style={{
                      backgroundImage: `url(${framePath})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      transform: `translate(${framePosition.x}px, ${framePosition.y}px) scale(${frameScale/100}) scaleX(${frameStretch.x/100}) scaleY(${frameStretch.y/100})`
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Mobile Header - Just visual, actual UI is rendered below */}
            <div className="h-[50px] bg-gradient-to-r from-gray-900 to-gray-800 rounded-b-lg"></div>
          </div>
        </div>
        
        {/* Fallback message if no cells render */}
        {(!reels || !rows) && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
            <p>No valid grid dimensions ({reels}×{rows})</p>
          </div>
        )}
      </>
    );
  };
  
  // Render landscape mode game container
  const renderLandscapeMode = () => {
    // IMPORTANT: This function was causing nested mockups issue
    // Now we rely on direct props rather than DOM hierarchy detection
    // which was causing rendering problems
    
    // We've moved the UI control bar to a fixed position at the bottom of the component
    // No need to conditionally render it based on any detection
    
    // Calculate a reasonable scale factor for wide grids to prevent overflow
    // For grid sizes wider than 5x3, scale down proportionally
    // Calculate based on reels relative to standard 5-reel grid
    const getScaleFactor = () => {
      if (reels <= 5) return 1.0; // Standard size
      return Math.max(0.8, 5 / reels); // Scale down for wider grids (6+)
    };
    
    const scaleFactor = getScaleFactor();
    
    return (
      <>
        {/* Debug label */}
        {showDebugLabel && (
          <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-gray-800/80 text-white text-xs rounded">
            {debugLabel}
          </div>
        )}
        
        {/* Grid Cells Container with auto-scaling for wide grids */}
        <div 
          className={`slot-grid-container relative rounded-md ${
            isSmallGrid ? 'border-2' : isMediumGrid ? 'border-2' : 'border'
          } border-blue-700 bg-transparent flex items-center justify-center`}
          data-testid="slot-grid-container"
          style={{
            width: `${gridWidthPct}%`,
            height: `${gridHeightPct - 10}%`,  // Always leave space for UI
            padding: `${gridPadding}px`,
            boxShadow: getGridShadowStyle(),
            transition: 'all 0.3s ease-in-out', // Smooth transitions when dimensions change
            marginBottom: '20px',  // Reduced margin since we're using vertical offset for centering
            position: 'relative', // Needed for frame positioning
            overflow: 'hidden' // For background and frame overflow control
          }}
          data-grid-size={`${reels}x${rows}`}
          data-orientation={currentOrientation}
          id={id}
        >
          {/* Background image removed from grid container to prevent duplication */}
          {/* The background is now only applied to the main container layer */}
          
          {/* Scaled grid container for wide grid layouts */}
          <div 
            className="scaled-grid-container relative z-10"
            style={{
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Grid with proper slot machine styling */}
            <div 
              className="slot-grid flex flex-wrap items-center justify-center"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${reels}, ${symbolSize}px)`,
                gridTemplateRows: `repeat(${rows}, ${symbolSize}px)`,
                gap: `${gapSize}px`,
                width: 'auto',
                height: 'auto',
              }}
            >
              {renderGridCells()}
            </div>
          </div>
          
          {/* Frame overlay if provided */}
          {framePath && (
            <div 
              className="absolute inset-0 z-20 pointer-events-none" 
              style={{
                backgroundImage: `url(${framePath})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                transform: `translate(${framePosition.x}px, ${framePosition.y}px) scale(${frameScale/100}) scaleX(${frameStretch.x/100}) scaleY(${frameStretch.y/100})`
              }}
            />
          )}
        </div>
        
        {/* Fallback message if no cells render */}
        {(!reels || !rows) && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
            <p>No valid grid dimensions ({reels}×{rows})</p>
          </div>
        )}
        
      </>
    );
  };
  
  // Calculate grid dimensions with proper aspect ratio
  // This ensures the container matches the orientation properly
  const containerStyle = {
    aspectRatio: containerAspectRatio,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    position: 'relative' as 'relative',
    paddingBottom: '72px', // Add padding to make room for the UI bar (72px height)
  };

  // Calculate grid-specific vertical offset adjustment
  const calculateVerticalOffset = () => {
    // UI bar height is approximately 70px
    // We want to vertically center the grid in the available space *above* the UI bar
    // Therefore we need to shift the grid up by half the UI bar's height
    
    // Base offset - always shift up to account for the UI bar (negative = up)
    const baseOffset = -5; // shift everything up by 5% of container height
    
    // Grid-specific adjustments
    if (reels === 3 && rows === 3) {
      // Small 3x3 grid - needs less upward shift
      return baseOffset + 2; // less upward shift
    } else if (reels === 4 && rows === 3) {
      // 4x3 grid - standard small grid
      return baseOffset + 1; 
    } else if (reels === 5 && rows === 3) {
      // Standard 5x3 grid - baseline
      return baseOffset;
    } else if (reels === 5 && rows === 4) {
      // Taller 5x4 grid - needs more upward shift
      return baseOffset - 1;
    } else if (reels >= 6 && rows <= 3) {
      // Wide but short grids
      return baseOffset - 1;
    } else if (reels >= 6 && rows >= 4) {
      // Large grids need to be moved up more to avoid UI overlap
      return baseOffset - 2;
    } else if (reels >= 7 || rows >= 5) {
      // Extra large grids need even more upward shift
      return baseOffset - 3;
    }
    
    // Apply any custom vertical offset passed in props, using baseOffset as the default
    return verticalOffset !== 0 ? verticalOffset : baseOffset;
  };
  
  // Get the calculated vertical offset for current grid
  const finalVerticalOffset = calculateVerticalOffset();
  
  // Apply scaleToFit styles when enabled
  const gridContainerStyle = scaleToFit ? {
    position: 'absolute' as 'absolute',
    // Add percentage-based vertical offset to center alignment
    top: `calc(50% + ${finalVerticalOffset}%)`,
    left: '50%',
    transform: `translate(-50%, -50%) scale(${computedScale})`,
    transformOrigin: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto'
  } : {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div 
      ref={containerRef}
      className={`slot-frame relative flex flex-col items-center justify-center ${className}`}
      style={containerStyle}
      data-orientation={currentOrientation}
      data-reels={reels}
      data-rows={rows}
      data-scale-to-fit={scaleToFit ? 'true' : 'false'}
      data-is-mobile={isMobile.toString()}
      data-is-landscape={isLandscape.toString()}
      id="unified-grid-preview"
    >
      {/* Background image if available */}
      {backgroundPath && (
        <div 
          className="absolute inset-0 z-0" 
          style={{
            backgroundImage: `url(${backgroundPath})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.9,
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
      {/* Debug indicators removed for production UI */}
      <div 
        ref={gridRef}
        style={gridContainerStyle}
        className="flex-grow flex items-center justify-center pb-0"
      >
        <div ref={gridContentRef}>
          {currentOrientation === 'portrait' 
            ? renderPortraitMode() 
            : renderLandscapeMode()
          }
        </div>
      </div>
      
      {/* Conditional UI rendering based on device type and orientation */}
      {(() => {
        console.log('[UnifiedGridPreview] UI Render conditions:', {
          showUnifiedUI,
          isMobile,
          isLandscape,
          orientation,
          customButtons: customButtons || config.uiElements
        });
        return null;
      })()}
      {showUnifiedUI && (
        <>
          {isMobile ? (
            // Mobile UI - different components based on orientation
            <>
              {isLandscape ? (
                // Mobile Landscape UI - Vertical controls on right side
                <div className="absolute inset-0 z-30 pointer-events-auto">
                  <MobileLandscapeUI
                    onSpin={handleSpin}
                    onAutoplayToggle={() => console.log('Autoplay toggled')}
                    onMenuToggle={() => console.log('Menu clicked')}
                    onSoundToggle={() => console.log('Sound toggled')}
                    onBetChange={() => console.log('Bet changed')}
                    balance={balance}
                    bet={bet}
                    win={win}
                    isSpinning={isSpinning}
                    customButtons={customButtons || config.uiElements}
                    className="h-full w-full"
                  />
                  {/* Debug info about mobile UI */}
                  {process.env.NODE_ENV !== 'production' && (
                    <div className="absolute top-5 left-0 right-0 text-center text-white bg-black/70 p-1 z-50 text-xs">
                      MobileLandscapeUI active - If you can't see the vertical controls, check browser console
                    </div>
                  )}
                </div>
              ) : (
                // Mobile Portrait UI - Horizontal controls at bottom
                <div className="absolute inset-0 z-30 pointer-events-auto">
                  <MobilePortraitUI
                    onSpin={handleSpin}
                    onAutoplayToggle={() => console.log('Autoplay toggled')}
                    onMenuToggle={() => console.log('Menu clicked')}
                    onSoundToggle={() => console.log('Sound toggled')}
                    onBetChange={() => console.log('Bet changed')}
                    balance={balance}
                    bet={bet}
                    win={win}
                    isSpinning={isSpinning}
                    customButtons={customButtons || config.uiElements}
                    className="h-full w-full"
                  />
                  {/* Debug info about mobile UI */}
                  {process.env.NODE_ENV !== 'production' && (
                    <div className="absolute top-5 left-0 right-0 text-center text-white bg-black/70 p-1 z-50 text-xs">
                      MobilePortraitUI active - Premium-style UI with horizontal controls
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            // Desktop UI - Standard horizontal bar at bottom - Only show this for desktop (non-mobile) in landscape orientation
            <>
              {!isMobile && orientation === 'landscape' && (
                <div className="absolute bottom-0 left-0 right-0 w-full z-20">
                  <SlotGameUI 
                    onSpin={handleSpin}
                    onAutoplayToggle={() => {}}
                    onMaxBet={() => {}}
                    balance={balance}
                    bet={bet}
                    win={win}
                    isSpinning={isSpinning}
                    spinButtonSvg={spinButtonSvg}
                    spinButtonImageUrl={spinButtonImageUrl}
                    customButtons={(() => {
                      const buttons = customButtons || config.uiElements;
                      console.log('[UnifiedGridPreview] Passing customButtons to SlotGameUI:', buttons);
                      return buttons;
                    })()}
                    className="shadow-lg border-t border-gray-700/50 h-[72px]" // Fixed height for consistent spacing
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default UnifiedGridPreview;