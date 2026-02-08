/**
 * MockupService - A utility for managing pre-generated assets for demos
 * This service provides paths and progress simulation for mockup demos
 */

// Define the themes we have mockups for
export const MOCKUP_THEMES = ['western', 'ancient-egypt', 'candy-land', 'ancient-aztec'];

// Define symbol types
export const SYMBOL_TYPES = ['wild', 'scatter', 'high_1', 'high_2', 'high_3', 'mid_1', 'mid_2', 'low_1', 'low_2', 'low_3'];

// File paths for each theme's assets
export const getMockupPaths = (theme: string) => {
  // Default to ancient-egypt if theme is not in our mockups (changed from western)
  const safeTheme = MOCKUP_THEMES.includes(theme) ? theme : 'ancient-egypt';
  
  // Symbol paths follow a consistent pattern
  const symbolPaths = SYMBOL_TYPES.reduce((paths, symbolType) => {
    // Use theme-specific paths for mockup symbols
    paths[symbolType] = `/assets/mockups/${safeTheme}/symbols/${symbolType}.png`;
    return paths;
  }, {} as Record<string, string>);
  
  return {
    symbols: symbolPaths,
    frame: `/assets/mockups/${safeTheme}/frames/frame.png`,
    background: `/assets/mockups/${safeTheme}/backgrounds/background.png`
  };
};

// Progress bar simulation
export const simulateProgress = (
  duration: number = 3000, 
  callback: (progress: number) => void,
  completeCallback: () => void
) => {
  const startTime = Date.now();
  const endTime = startTime + duration;
  
  // Update progress based on elapsed time with easing
  const updateProgress = () => {
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    
    // Apply easing function for more realistic progress
    // Slow start, faster middle, slow end
    const easedProgress = easeInOutCubic(progress);
    
    // Call the progress callback with percentage (0-100)
    callback(Math.round(easedProgress * 100));
    
    // Continue updating or complete
    if (progress < 1) {
      requestAnimationFrame(updateProgress);
    } else {
      completeCallback();
    }
  };
  
  // Start the progress updates
  requestAnimationFrame(updateProgress);
  
  // Return a function to cancel the simulation if needed
  return {
    cancel: () => {
      // Nothing to cancel in this implementation,
      // but this provides an API for future enhancements
    }
  };
};

// Easing function for realistic progress
const easeInOutCubic = (x: number): number => {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

// Get a mockup asset with theme detection
export const getMockupAsset = (assetType: 'symbol' | 'frame' | 'background', theme: string, symbolType?: string) => {
  const paths = getMockupPaths(theme);
  
  if (assetType === 'symbol' && symbolType) {
    // Try mockup path first, fall back to default symbols if not found
    return paths.symbols[symbolType] || `/assets/symbols/${symbolType}.png` || '/assets/symbols/placeholder.png';
  } else if (assetType === 'frame') {
    return paths.frame;
  } else if (assetType === 'background') {
    return paths.background;
  }
  
  return '';
};

// Helper for determining theme from a theme name or ID
export const detectThemeCategory = (themeName: string | undefined | null): string => {
  // Handle undefined or null theme names
  if (!themeName) return 'ancient-egypt'; // Using Egypt as default
  
  // Make sure we have a string
  const themeStr = String(themeName);
  const lowerTheme = themeStr.toLowerCase();
  
  // Check for themes with mockups
  if (lowerTheme.includes('egypt')) return 'ancient-egypt';
  if (lowerTheme.includes('aztec')) return 'ancient-aztec';
  if (lowerTheme.includes('west')) return 'wild-west';
  if (lowerTheme.includes('candy') || lowerTheme.includes('sweet')) return 'candy-land';
  
  // Check for additional themes
  if (lowerTheme.includes('pirate') || lowerTheme.includes('caribbean')) return 'pirate';
  if (lowerTheme.includes('tropic') || lowerTheme.includes('island') || lowerTheme.includes('beach')) return 'tropical';
  if (lowerTheme.includes('fruit')) return 'fruit';
  if (lowerTheme.includes('dragon') || lowerTheme.includes('fantasy')) return 'dragon';
  if (lowerTheme.includes('asian') || lowerTheme.includes('china') || lowerTheme.includes('japan')) return 'asian';
  if (lowerTheme.includes('farm') || lowerTheme.includes('country')) return 'farm';
  if (lowerTheme.includes('space') || lowerTheme.includes('galaxy')) return 'space';
  if (lowerTheme.includes('magic') || lowerTheme.includes('wizard')) return 'magic';
  if (lowerTheme.includes('greek') || lowerTheme.includes('roman')) return 'ancient-greece';
  if (lowerTheme.includes('viking') || lowerTheme.includes('norse')) return 'viking';
  if (lowerTheme.includes('jungle') || lowerTheme.includes('safari')) return 'jungle';
  if (lowerTheme.includes('halloween') || lowerTheme.includes('spooky')) return 'halloween';
  if (lowerTheme.includes('christmas') || lowerTheme.includes('winter')) return 'christmas';
  
  // Default to ancient-egypt if no match
  return 'ancient-egypt';
};

// Export theme-specific file name data for easy reference
export const MOCKUP_FILE_NAMES = {
  'western': {
    symbols: {
      wild: 'wild.png',
      scatter: 'scatter.png',
      high_1: 'high_1.png', // Sheriff badge
      high_2: 'high_2.png', // Revolver
      high_3: 'high_3.png', // Cowboy hat
      mid_1: 'mid_1.png',   // Horseshoe
      mid_2: 'mid_2.png',   // Whiskey bottle
      low_1: 'low_1.png',   // Gold nugget
      low_2: 'low_2.png',   // Playing card
      low_3: 'low_3.png'    // Poker chip
    },
    frame: 'frame.png',     // Wooden frame with metal accents
    background: 'background.png' // Desert with mountains and cacti
  },
  'ancient-egypt': {
    symbols: {
      wild: 'wild.png',
      scatter: 'scatter.png',
      high_1: 'high_1.png', // Anubis
      high_2: 'high_2.png', // Eye of Horus
      high_3: 'high_3.png', // Pharaoh mask
      mid_1: 'mid_1.png',   // Ankh
      mid_2: 'mid_2.png',   // Scarab
      low_1: 'low_1.png',   // Hieroglyphics
      low_2: 'low_2.png',   // Pyramid
      low_3: 'low_3.png'    // Egyptian cat
    },
    frame: 'frame.png',     // Gold and blue frame with hieroglyphics
    background: 'background.png' // Pyramids at sunset
  },
  'candy-land': {
    symbols: {
      wild: 'wild.png',
      scatter: 'scatter.png',
      high_1: 'high_1.png', // Lollipop
      high_2: 'high_2.png', // Chocolate bar
      high_3: 'high_3.png', // Cupcake
      mid_1: 'mid_1.png',   // Candy cane
      mid_2: 'mid_2.png',   // Gummy bear
      low_1: 'low_1.png',   // Jelly bean
      low_2: 'low_2.png',   // Cotton candy
      low_3: 'low_3.png'    // Donut
    },
    frame: 'frame.png',     // Colorful candy stripe frame
    background: 'background.png' // Candy landscape with chocolate river
  },
  'ancient-aztec': {
    symbols: {
      wild: 'wild.png',
      scatter: 'scatter.png',
      high_1: 'high_1.png', // Golden mask
      high_2: 'high_2.png', // Sun stone
      high_3: 'high_3.png', // Jaguar statue
      mid_1: 'mid_1.png',   // Temple
      mid_2: 'mid_2.png',   // Golden idol
      low_1: 'low_1.png',   // Ancient calendar
      low_2: 'low_2.png',   // Tribal pattern
      low_3: 'low_3.png'    // Aztec coin
    },
    frame: 'frame.png',     // Stone frame with tribal carvings
    background: 'background.png' // Jungle temple scene
  }
};