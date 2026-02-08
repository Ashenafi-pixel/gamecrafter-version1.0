import { GameConfig } from './gameTypes';
export const generateGameConfig = (config: GameConfig) => {
  const symbols = Array.isArray(config.symbols) ? config.symbols : Object.values(config.symbols || {});
  
  // Always use actual symbol keys from GameStore object
  let symbolTypes: string[];
  
  if (!Array.isArray(config.symbols) && config.symbols && typeof config.symbols === 'object') {
    // Use the actual keys from GameStore symbols object
    symbolTypes = Object.keys(config.symbols);
    console.log('✅ Using actual symbol keys from GameStore:', symbolTypes);
  } else {
    // If symbols is an array, generate keys based on common slot patterns
    symbolTypes = symbols.map((_, index) => {
      if (index === 0) return 'wild';
      if (index <= 3) return `high${index}`;
      if (index <= 6) return `medium${index - 3}`;
      return `low${index - 6}`;
    });
    console.log('Generated symbol types from array:', symbolTypes);
  }
  
  // Extract bonus symbols from GameStore
  const bonusSymbols = config?.theme?.generated?.bonusSymbols || {};
  console.log('🎯 Found bonus symbols:', Object.keys(bonusSymbols));
  
  // Combine regular symbols with bonus symbols
  const allSymbols = [...symbols];
  const allSymbolTypes = [...symbolTypes];
  
  // Add bonus symbols to the arrays
  Object.entries(bonusSymbols).forEach(([key, url]) => {
    if (typeof url === 'string' && url) {
      allSymbols.push(url);
      // Extract symbol name from key (e.g., 'bonus_bonus' -> 'bonus')
      const symbolName = key.replace('bonus_', '');
      allSymbolTypes.push(symbolName);
      console.log(`✅ Added bonus symbol: ${symbolName}`);
    }
  });
  
  const symbolPaths = allSymbols.map((symbolUrl, index) => {
    if (!symbolUrl) return null;
    const symbolName = allSymbolTypes[index] || `symbol_${index + 1}`;
    return `'/assets/symbols/${symbolName}.png'`;
  }).filter(Boolean).join(',\n    ');
  
  // Extract grid and betline configuration from GameStore
  const reels = config.reels?.layout?.reels || 5;
  const rows = config.reels?.layout?.rows || 3;
  const payMechanism = config.reels?.payMechanism || 'betlines';
  const betlines = config.reels?.betlines || 25;
  const winAnimationType = config.winAnimationType || 'both';
  
  // Generate betline patterns based on grid configuration
  const generateBetlinePatterns = (reels: number, rows: number, betlines: number) => {
    const patterns = [];
    
    // Standard betline patterns for different grid sizes
    if (reels === 5 && rows === 3) {
      // Standard 5x3 patterns
      const standardPatterns = [
        [1, 1, 1, 1, 1], // Line 1: Middle row
        [0, 0, 0, 0, 0], // Line 2: Top row
        [2, 2, 2, 2, 2], // Line 3: Bottom row
        [0, 1, 2, 1, 0], // Line 4: V shape
        [2, 1, 0, 1, 2], // Line 5: Inverted V
        [1, 0, 0, 0, 1], // Line 6: Top V
        [1, 2, 2, 2, 1], // Line 7: Bottom V
        [0, 0, 1, 2, 2], // Line 8: Ascending
        [2, 2, 1, 0, 0], // Line 9: Descending
        [1, 2, 1, 0, 1], // Line 10: Zigzag
        [1, 0, 1, 2, 1], // Line 11: Reverse zigzag
        [0, 1, 0, 1, 0], // Line 12: Top zigzag
        [2, 1, 2, 1, 2], // Line 13: Bottom zigzag
        [1, 1, 0, 1, 1], // Line 14: Top dip
        [1, 1, 2, 1, 1], // Line 15: Bottom dip
        [0, 0, 2, 0, 0], // Line 16: Top with bottom center
        [2, 2, 0, 2, 2], // Line 17: Bottom with top center
        [0, 2, 0, 2, 0], // Line 18: Alternating top-bottom
        [2, 0, 2, 0, 2], // Line 19: Alternating bottom-top
        [1, 0, 2, 0, 1], // Line 20: Diamond
        [0, 1, 1, 1, 0], // Line 21: Top curve
        [2, 1, 1, 1, 2], // Line 22: Bottom curve
        [1, 2, 0, 2, 1], // Line 23: Inverted diamond
        [0, 2, 1, 2, 0], // Line 24: W shape
        [2, 0, 1, 0, 2]  // Line 25: M shape
      ];
      
      for (let i = 0; i < Math.min(betlines, standardPatterns.length); i++) {
        patterns.push(standardPatterns[i]);
      }
    } else if (reels === 3 && rows === 3) {
  const standardPatterns = [
    [1, 1, 1], // Middle horizontal
    [0, 0, 0], // Top horizontal  
    [2, 2, 2], // Bottom horizontal
    [0, 1, 2], // Diagonal down
    [2, 1, 0], // Diagonal up
    [1, 0, 1], // V-shape
    [1, 2, 1], // Inverted V
    [0, 1, 0], // Top dip
    [2, 1, 2]  // Bottom dip
  ];
  for (let i = 0; i < Math.min(betlines, standardPatterns.length); i++) {
        patterns.push(standardPatterns[i]);
      }
    } else if (reels === 3 && rows ===4) {
      const standardPatterns =[
  [1,1,1],[1,1,2],[1,2,1],[1,2,2],[1,2,3],
  [2,1,1],[2,1,2],[2,2,1],[2,2,2],[2,2,3],
  [2,3,2],[2,3,3],[2,3,4],
  [3,2,1],[3,2,2],[3,2,3],
  [3,3,2],[3,3,3],[3,3,4],
  [3,4,3],[3,4,4],
  [4,3,2],[4,3,3],[4,3,4],
  [4,4,3],[4,4,4]
]
for (let i = 0; i < Math.min(betlines, standardPatterns.length); i++) {
        patterns.push(standardPatterns[i]);
      }

    }
    else {
      // Generate patterns for other grid sizes
      for (let i = 0; i < betlines; i++) {
        if (i < rows) {
          // First few lines are straight horizontal lines
          patterns.push(new Array(reels).fill(i));
        } else {
          // Generate more complex patterns
          const pattern = [];
          for (let reel = 0; reel < reels; reel++) {
            const row = Math.floor(Math.random() * rows);
            pattern.push(row);
          }
          patterns.push(pattern);
        }
      }
    }
    
    return patterns;
  };
  
  // Generate symbol paytable based on actual symbol types (including bonus symbols)
  const symbolPaytable: Record<string, Record<number, number>> = {};
  
  allSymbolTypes.forEach((symbolType, index) => {
    if (symbolType === 'wild') {
      symbolPaytable[symbolType] = { 3: 50, 4: 200, 5: 1000 };
    } else if (symbolType === 'scatter') {
      symbolPaytable[symbolType] = { 3: 10, 4: 50, 5: 200 }; // Scatter symbols typically pay anywhere
    } else if (symbolType === 'bonus') {
      symbolPaytable[symbolType] = { 3: 20, 4: 100, 5: 500 }; // Bonus symbols for triggering features
    } else if (symbolType.startsWith('high')) {
      const multiplier = 4 - (parseInt(symbolType.replace('high', '')) || 1);
      symbolPaytable[symbolType] = { 3: 15 + multiplier * 5, 4: 60 + multiplier * 20, 5: 300 + multiplier * 100 };
    } else if (symbolType.startsWith('medium')) {
      const multiplier = 3 - (parseInt(symbolType.replace('medium', '')) || 1);
      symbolPaytable[symbolType] = { 3: 6 + multiplier * 2, 4: 25 + multiplier * 8, 5: 100 + multiplier * 50 };
    } else if (symbolType.startsWith('low')) {
      const multiplier = 3 - (parseInt(symbolType.replace('low', '')) || 1);
      symbolPaytable[symbolType] = { 3: 2 + multiplier * 1, 4: 10 + multiplier * 5, 5: 40 + multiplier * 20 };
    } else {
      // Default paytable for any other symbol types (including other bonus symbols)
      symbolPaytable[symbolType] = { 3: 5, 4: 20, 5: 80 };
    }
  });
  
  console.log('Generated paytable for symbols:', Object.keys(symbolPaytable));
  console.log('🎯 Total symbols (including bonus):', allSymbols.length, 'Types:', allSymbolTypes);
  
  // Extract loading assets
  const generated = config?.theme?.generated || {};
  const loadingAssets = config?.loadingAssets || {};
  const hasStudioLogo = loadingAssets?.studioLogo?.url || config.studioLogo;
  const hasLoadingSprite = loadingAssets?.loadingSprite?.url || config.loadingSprite;
  
  // Extract extended symbols from presetSymbol
  const extendedSymbols = config?.theme?.presetSymbol || {};
  const extendedSymbolPaths = Object.entries(extendedSymbols)
    .filter(([key, url]) => key.endsWith('_extended') && url)
    .map(([key, url]) => {
      const symbolType = key.replace('_extended', '');
      return `${symbolType}_extended: '/assets/symbols/${symbolType}_extended.png'`;
    }).join(',\n    ');
  
  // Extract number images from generatedAssets (including decimal point)
  const numberImages = config?.generatedAssets?.numberImages || {};
  const bonusNumberImages = config?.generatedAssets?.bonusNumberImage || {};
  
  // Add decimal point to number images if it exists
  if (config?.generatedAssets?.numberImages?.dot) {
    numberImages.dot = config.generatedAssets.numberImages.dot;
  }
  if (config?.generatedAssets?.bonusNumberImage?.dot) {
    bonusNumberImages.dot = config.generatedAssets.bonusNumberImage.dot;
  }
  
  return `
  import { GameConfig } from '../types';
  export const gameConfig:GameConfig = {
  name: '${config.name || config.gameId || 'My Slot Game'}',
  background: '${config.background ? '/assets/backgrounds/background.png' : ''}',
  logo: '${config.logo ? '/assets/logo.png' : ''}',
  frame: '${config.frame ? '/assets/frame.png' : ''}',
  studioLogo: '${hasStudioLogo ? '/assets/LoadingAssets/studioLogo.png' : ''}',
  loadingSprite: '${hasLoadingSprite ? '/assets/LoadingAssets/loadingSprite.png' : ''}',
  
  // Derived backgrounds for different game modes
  derivedBackgrounds: {
    freespin: '/assets/backgrounds/free-spin.png', // Always available
    night: '${config.derivedBackgrounds?.night ? '/assets/backgrounds/night.png' : ''}',
    day: '${config.derivedBackgrounds?.day ? '/assets/backgrounds/day.png' : ''}',
    bonus: '${config.derivedBackgrounds?.bonus ? '/assets/backgrounds/bonus.png' : ''}'  
  },
  numberImages: {
    ${Object.keys(numberImages).map(num => `${num}: '/assets/NumberImages/${num}.png'`).join(',\n    ')}
  },
  bonusNumberImages: {
    ${Object.keys(bonusNumberImages).map(num => `${num}: '/assets/BonusNumberImages/${num}.png'`).join(',\n    ')}
  },
  symbols: [
    ${symbolPaths}
  ],
  symbolTypes: ${JSON.stringify(allSymbolTypes.slice(0, allSymbols.length))},
  extendedSymbols: {
    ${extendedSymbolPaths}
  },
  uiElements: {
    menuButton: '${config.uiElements?.menuButton ? '/assets/buttons/menu.png' : ''}',
    spinButton: '${config.uiElements?.spinButton ? '/assets/buttons/spin.png' : ''}',
    autoplayButton: '${config.uiElements?.autoplayButton ? '/assets/buttons/autoplay.png' : ''}',
    soundButton: '${config.uiElements?.soundButton ? '/assets/buttons/sound.png' : ''}',
    settingsButton: '${config.uiElements?.settingsButton ? '/assets/buttons/settings.png' : ''}',
    quickButton: '${config.uiElements?.quickButton ? '/assets/buttons/quick.png' : ''}'
  },
  reels: ${reels},
  rows: ${rows},
  payMechanism: '${payMechanism}',
  betlines: ${betlines},
  betlinePatterns: ${JSON.stringify(generateBetlinePatterns(reels, rows, betlines))},
  symbolPaytable: ${JSON.stringify(symbolPaytable)},
  initialBalance: 1000,
  minBet: 1,
  maxBet: 100,
  defaultBet: 10,
  
  // Loading Assets Configuration (from Step9)
  loadingAssets: {
    studioLogo: {
      x: ${loadingAssets?.studioLogo?.x || 50},
      y: ${loadingAssets?.studioLogo?.y || 15},
      size: ${loadingAssets?.studioLogo?.size || 80}
    },
    loadingSprite: {
      position: '${loadingAssets?.loadingSprite?.position || 'center'}',
      animation: '${loadingAssets?.loadingSprite?.animation || 'spin'}',
      size: ${loadingAssets?.loadingSprite?.size || 40}
    },
    progressBar: {
      x: ${loadingAssets?.progressBar?.x || 50},
      y: ${loadingAssets?.progressBar?.y || 65},
      width: ${loadingAssets?.progressBar?.width || 60},
      display: '${loadingAssets?.progressBar?.display || 'bar'}',
      color: '${loadingAssets?.progressBar?.color || '#ffd700'}'
    },
    customMessage: {
      text: '${loadingAssets?.customMessage?.text || 'GameStudio™ - 2024'}',
      x: ${loadingAssets?.customMessage?.x || 50},
      y: ${loadingAssets?.customMessage?.y || 90},
      size: ${loadingAssets?.customMessage?.size || 14}
    },
    percentagePosition: '${loadingAssets?.percentagePosition || 'above'}'
  },
  
  // Loading Experience Configuration (from Step9)
  loadingExperience: {
    backgroundColor: '${config.loadingExperience?.backgroundColor || '#1a1a2e'}',
    accentColor: '${loadingAssets?.progressBar?.color || '#ffd700'}',
    textColor: '${config.loadingExperience?.textColor || '#ffffff'}',
    customMessage: '${config.loadingExperience?.customMessage || 'GameStudio™ - 2024'}',
    showPercentage: ${config.loadingExperience?.showPercentage !== false},
    percentagePosition: '${config.loadingExperience?.percentagePosition || 'above'}',
    studioLogoSize: ${config.loadingExperience?.studioLogoSize || 80},
    spriteSize: ${config.loadingExperience?.spriteSize || 40},
    progressBarWidth: ${config.loadingExperience?.progressBarWidth || 60},
    progressStyle: '${config.loadingExperience?.progressStyle || loadingAssets?.progressBar?.display || 'bar'}'
  },
  
  // Animation settings (controlled by Step7 Animation Studio)
  animation: {
    speed: 1.0,
    blurIntensity: 8,
    easing: 'back.out',
    visualEffects: {
      spinBlur: true,
      glowEffects: false,
      screenShake: false
    }
  },
  
  // Mask settings (controlled by Step7 Animation Studio)
  masks: {
    enabled: true,
    debugVisible: false,
    perReelEnabled: [true, true, true, true, true]
  },
  
  // Win Animation Configuration
  winAnimationType: '${config.winAnimationType || 'both'}',
  
  // Bonus Features Configuration (from Step12 Bonus Features)
  bonus: {
    freeSpins: {
      enabled: ${config.bonus?.freeSpins?.enabled || false},
      count: ${config.bonus?.freeSpins?.count || 10}, // Number of free spins awarded
      triggers: ${JSON.stringify(config.bonus?.freeSpins?.triggers || [3])}, // Array of scatter counts that trigger bonus
      multipliers: ${JSON.stringify(config.bonus?.freeSpins?.multipliers || [1])}, // Available multipliers during free spins
      retriggers: ${config.bonus?.freeSpins?.retriggers !== false}, // Allow retriggers during free spins
      scatterSymbolsRequired: ${config.bonus?.freeSpins?.triggers?.[0] || 3} // Minimum scatter symbols to trigger
    },
    pickAndClick: {
      enabled: ${config.bonus?.pickAndClick?.enabled || false},
      gridSize: ${JSON.stringify(config.bonus?.pickAndClick?.gridSize || [3, 3])}, // Grid size for Pick & Click
      picks: ${config.bonus?.pickAndClick?.picks || 3}, // Number of picks allowed
      maxPrize: ${config.bonus?.pickAndClick?.maxPrize || 100}, // Maximum prize multiplier
      extraPicks: ${config.bonus?.pickAndClick?.extraPicks || false}, // Include extra pick symbols
      multipliers: ${config.bonus?.pickAndClick?.multipliers || false}, // Include multiplier symbols
       announcementImage: '/assets/PickClickAnnouncement/announcement.png' 
    },
    wheel: {
      enabled: ${config.bonus?.wheel?.enabled || false},
      segments: ${config.bonus?.wheel?.segments || 8}, // Number of wheel segments
      maxMultiplier: ${config.bonus?.wheel?.maxMultiplier || 50}, // Maximum multiplier on wheel
      levelUp: ${config.bonus?.wheel?.levelUp || false}, // Include level up segments
      respin: ${config.bonus?.wheel?.respin || false}, // Include respin segments
      bonusSymbolsRequired: 3 ,// Number of bonus symbols needed to trigger wheel
       announcementImage: '/assets/WheelBonus/wheelAnnouncement.png'
    },
    holdAndSpin: {
      enabled: ${config.bonus?.holdAndSpin?.enabled || false},
      gridSize: ${JSON.stringify(config.bonus?.holdAndSpin?.gridSize || [3, 3])}, // Grid size for Hold & Spin
      initialRespins: ${config.bonus?.holdAndSpin?.initialRespins || 3}, // Initial number of respins
      maxSymbolValue: ${config.bonus?.holdAndSpin?.maxSymbolValue || 100}, // Maximum symbol value
      resetRespins: ${config.bonus?.holdAndSpin?.resetRespins || false}, // Reset respins on new symbol
      collectAll: ${config.bonus?.holdAndSpin?.collectAll || false} // Include collect all symbol
    }
  }
};`;
};