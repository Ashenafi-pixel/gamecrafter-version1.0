import JSZip from 'jszip';
import { GameConfig , typeofGame } from '../reactTemplate/gameTypes';
import { generatePackageJson , generateViteConfig , generateTsConfig , generateTsConfigNode } from '../reactTemplate/packageTemplate';
import { generateIndexHtml, generateMainTsx, generateAppTsx, generateIndexCss ,gitignore, generateStore } from '../reactTemplate/srcTemplate';
import { generateGameConfig } from '../reactTemplate/gameConfig';
import { generateLoadingComponent,generateInfoPage ,generateMenuModal ,baseModal ,anouncementModal} from '../reactTemplate/componentsTemplate';
import { generateSlotMachineComponent } from '../reactTemplate/slotMachine';
import { animationCss, generateAppCss, generateThemeCss, modalCss } from '../reactTemplate/appCss';
import { generatePickAndClickModal, generatePickAndClickCSS } from '../reactTemplate/pickAndClickTemplate';
import { gameInitializationFile, generateAutoPlay, generateSoundSystem, generateWheelBonus, generateWinANimation } from '../reactTemplate/utilsFilesExport';
import { generateAnnouncement, generateSlotGridSystem } from '../reactTemplate/utilsFilesExport2';
import { generateThemeContext } from '../reactTemplate/context';
import { useGameStore } from '../store';
import { NormalUiButtons,UltimateUiButtons ,ModernUiButtons } from '../reactTemplate/uiButtons';
import defaultFreeSpinBackgroundImage from '../assets/background/free-spin.png';


const generateTailwindConfig = () => `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        }
      },
      fontFamily: {
        'game': ['Arial', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}`;

const generatePostCSSConfig = () => `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

const generateIndexCssWithTailwind = () => `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
  overflow: hidden;
}

#root {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}`;

const generateReadme = (gameName: string) => `# ${gameName}

> Professional slot machine 

A professional slot machine game built with React, TypeScript, and PixiJS.

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
\`\`\`

## Features

- 🎰 Full slot machine functionality with professional animations
- 📱 Mobile responsive design (supports 3x3 to 7x6 grids)
- 🎨 Custom themes and symbols
- 🔊 Sound effects support
- 💰 Balance and betting system
- 🎯 Casino-quality win animations
- ⚡ GSAP-powered smooth animations
- 🎭 Real-time animation control
- 🔧 Professional easing curves

## Development

- **Framework**: React 18 + TypeScript
- **Graphics**: PixiJS 7
- **Build Tool**: Vite
- **Styling**: CSS3 with modern features

## Deployment

Build the project and deploy the \`dist\` folder to any static hosting service:

- Vercel
- Netlify
- GitHub Pages
- AWS S3
- Firebase Hosting

## Animation System

### Animation Studio Integration
This project includes full integration Animation Studio:

- **Real-time Control**: Change speed, blur, easing without restart
- **Visual Effects**: Motion blur, glow effects, screen shake
- **Reel Masking**: Show/hide individual reels with debug mode
- **Professional Easing**: back.out, bounce.out, elastic.out, power2.out
- **Grid Flexibility**: Works with any grid size (3x3 to 7x6)

### Animation Events
\`\`\`javascript
//  settings changes
window.addEventListener('animationSettingsChanged', (event) => {
  const { speed, blurIntensity, easing, visualEffects } = event.detail.settings;
  // Animation system automatically applies these settings
});

// Trigger spin from external controls
window.dispatchEvent(new CustomEvent('slotSpin', {
  detail: { source: 'step7-test-button' }
}));
\`\`\`

### Performance Optimization
- Automatic blur reduction on mobile devices
- Frame rate monitoring and adjustment
- Memory-efficient symbol cycling
- Hardware-accelerated transforms

## Customization

- Edit \`src/config/gameConfig.ts\` for game settings and animation defaults
- Modify \`src/components/SlotMachine.tsx\` for game logic and animation behavior
- Update styles in \`src/App.css\` for visual customization
- Replace assets in \`src/assets/\` with your own symbols and UI elements
- Adjust animation settings in the config or via Animation Studio

## Technical Details

### Animation Architecture
- **Reel System**: Individual PIXI containers for each reel
- **Masking**: Graphics-based clipping for clean edges
- **Symbol Cycling**: Infinite scroll with buffer symbols
- **Sequential Stopping**: Industry-standard reel stopping pattern
- **Easing Integration**: Full GSAP easing library support

### Grid Layout Support
| Layout |   Description   | Performance |
|--------|-----------------|-------------|
|   3x3  |  Classic slots  |  Excellent  |
|   5x3  | Standard modern |  Excellent  |
|   5x4  | Extended modern |  Very Good  |
|   6x4  |  Wide premium   |     Good    |
|   7x6  |  Megaways style |     Good*   |

*Performance automatically optimized for larger grids

## License

Private project - All rights reserved.
Step7 Animation Studio integration included.
`;
// Helper function to convert image to blob using canvas (bypasses CORS)
const imageUrlToBlob = async (url: string): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      } catch (error) {
        console.warn('Canvas conversion failed:', error);
        resolve(null);
      }
    };
    
    img.onerror = () => {
      console.warn('Image load failed:', url);
      resolve(null);
    };
    
    img.src = url;
  });
};

// Helper function to download and add asset to ZIP with multiple fallback methods
const addAssetToZip = async (zip: JSZip, assetUrl: any, assetPath: string): Promise<boolean> => {
  if (!assetUrl || typeof assetUrl !== 'string' || !assetUrl.trim()) {
    console.warn(`⚠️ Invalid asset URL for ${assetPath}:`, assetUrl);
    return false;
  }
  
  console.log(`📥 Attempting to fetch: ${assetUrl}`);
  
  // Method 1: Try direct fetch with CORS
  try {
    const response = await fetch(assetUrl, {
      mode: 'cors',
      headers: {
        'Accept': 'image/*,*/*'
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      zip.file(assetPath, blob);
      console.log(`✅ Added asset via fetch: ${assetPath} (${blob.size} bytes)`);
      return true;
    }
  } catch (fetchError) {
    console.warn(`⚠️ Fetch failed for ${assetUrl}:`, fetchError);
  }
  
  // Method 2: Try canvas conversion (bypasses CORS for some cases)
  try {
    const blob = await imageUrlToBlob(assetUrl);
    if (blob) {
      zip.file(assetPath, blob);
      console.log(`✅ Added asset via canvas: ${assetPath} (${blob.size} bytes)`);
      return true;
    }
  } catch (canvasError) {
    console.warn(`⚠️ Canvas conversion failed for ${assetUrl}:`, canvasError);
  }
  
  // Method 3: Try no-cors mode (will get opaque response but might work)
  try {
    const response = await fetch(assetUrl, {
      mode: 'no-cors'
    });
    
    if (response.type === 'opaque') {
      // We can't read the content, but we can try to use it
      console.warn(`⚠️ Got opaque response for ${assetUrl}, cannot include in ZIP`);
      return false;
    }
  } catch (noCorsError) {
    console.warn(`⚠️ No-cors fetch failed for ${assetUrl}:`, noCorsError);
  }
  
  console.error(`All methods failed for ${assetUrl}`);
  return false;
};

export const exportReactProject = async (config: GameConfig): Promise<Blob> => {
  const zip = new JSZip();
  const gameName = config.name || config.gameId || 'My Slot Game';
  const { uiType } = useGameStore.getState();

  console.log('📦 Starting React project export...');
  console.log('🔍 Config structure:', {
    hasConfig: !!config,
    hasTheme: !!config?.theme,
    hasGenerated: !!config?.theme?.generated,
    generatedKeys: config?.theme?.generated ? Object.keys(config.theme.generated) : []
  });

  // Extract assets from the correct nested structure
  const generated = config?.theme?.generated || {};
  const loadingAssets = config?.loadingAssets || {};
  
  // Fix background extraction - check all possible paths where background might be stored
  const background = config.background?.backgroundImage || config.background || generated.background || config?.theme?.background || config?.theme?.generated?.background;
  const logo = config.logo || generated.logo || config?.theme?.logo;
  const frame = config.frame || generated.frame || config?.theme?.frame;
  const symbols = config.symbols || generated.symbols || config?.theme?.symbols;
  const uiElements = config.uiElements || generated.uiElements || config?.theme?.uiElements || {};
  
  // Extract extended symbols from presetSymbol (multiple {symbolType}_extended)
  const extendedSymbols = config?.theme?.presetSymbol || {};
  
  // Extract derived backgrounds (including free-spin background)
  // Ensure default free-spin background is included if not already set
  const derivedBackgrounds = {
    ...(config.derivedBackgrounds || {}),
    // Use default if no custom free-spin background was set
    freespin: config.derivedBackgrounds?.freespin || defaultFreeSpinBackgroundImage
  };
  
  // Extract loading experience assets from loadingAssets
  const studioLogo = loadingAssets?.studioLogo?.url ||  null;
  const loadingSprite = loadingAssets?.loadingSprite?.url || null;
  
  // Extract number images from generatedAssets
  const numberImages = config?.generatedAssets?.numberImages || {};
  const bonusNumberImages = config?.generatedAssets?.bonusNumberImage || {};
  const freeSpinAnnouncementImage = (config as any)?.freeSpinAnnouncementImage || null;
  
  // Extract bonus game specific images
  const pickClickAnnouncementImage = config?.pickClickAnnouncementImage || 
    config?.generatedAssets?.pickClickAnnouncementImage || 
    config?.bonus?.pickAndClick?.announcementImage ||
    config?.theme?.generated?.pickClickAnnouncementImage ||
    null;
  
  const holdSpinAnnouncementImage = config?.holdSpinAnnouncementImage || 
    config?.generatedAssets?.holdSpinAnnouncementImage || 
    config?.holdSpinAnnouncement ||
    config?.bonus?.holdSpin?.announcementImage ||
    null;
  
  const holdSpinSymbol = config?.holdSpinSymbol || 
    config?.generatedAssets?.holdSpinSymbol || 
    config?.symbols?.holdspin ||
    config?.bonus?.holdSpin?.symbol ||
    null;
  
  // Debug: Check all possible wheel properties
  console.log('🔍 Wheel Debug - Available config keys:', Object.keys(config));
  console.log('🔍 Wheel Debug - generatedAssets keys:', config?.generatedAssets ? Object.keys(config.generatedAssets) : 'none');
  console.log('🔍 Wheel Debug - theme keys:', config?.theme ? Object.keys(config.theme) : 'none');
  
  // Check all possible wheel bonus locations and ensure wheel announcement image
  const wheelAnnouncementImage = config?.wheelAnnouncementImage || 
    config?.generatedAssets?.wheelAnnouncementImage || 
    config?.bonus?.wheel?.announcementImage ||
    config?.theme?.generated?.wheelAnnouncementImage ||
    null;

  // Check all possible wheel bonus locations
  const wheelBonusImages = {
    wheelAnnouncement: wheelAnnouncementImage,
    ...config?.wheelBonusImages,
    ...config?.generatedAssets?.wheelBonusImages,
    ...config?.wheelBonus,
    ...config?.wheel,
    ...config?.theme?.wheelBonus,
    ...config?.theme?.generated?.wheelBonus,
    ...config?.bonusFeatures?.wheel,
    ...config?.bonus?.wheel?.images,
    ...config?.features?.wheel
  };
  
  // Also check for individual wheel properties in all locations
  const wheelBackground = config?.wheelBackground || config?.generatedAssets?.wheelBackground || config?.theme?.wheelBackground || config?.theme?.generated?.wheelBackground || config?.bonusFeatures?.wheelBackground || null;
  const wheelPointer = config?.wheelPointer || config?.generatedAssets?.wheelPointer || config?.theme?.wheelPointer || config?.theme?.generated?.wheelPointer || config?.bonusFeatures?.wheelPointer || null;
  const wheelSegment = config?.wheelSegment || config?.generatedAssets?.wheelSegment || config?.theme?.wheelSegment || config?.theme?.generated?.wheelSegment || config?.bonusFeatures?.wheelSegment || null;
  
  // Check for wheel images in bonus assets
  const wheelFromBonus = config?.bonusAssets?.wheel || config?.bonus?.wheel || {};
  
  console.log('🔍 Wheel Debug - Found images:', {
    wheelBonusImages: Object.keys(wheelBonusImages).length,
    wheelBackground: !!wheelBackground,
    wheelPointer: !!wheelPointer,
    wheelSegment: !!wheelSegment
  });

  console.log('🎯 Extracted assets:', {
    background: background ? (typeof background === 'string' ? `${background.substring(0, 50)}...` : 'object') : 'none',
    logo: logo ? (typeof logo === 'string' ? `${logo.substring(0, 50)}...` : 'object') : 'none',
    frame: frame ? (typeof frame === 'string' ? `${frame.substring(0, 50)}...` : 'object') : 'none',
    symbols: symbols ? (Array.isArray(symbols) ? symbols.length : Object.keys(symbols).length) : 0,
    uiElements: Object.keys(uiElements).length,
    studioLogo: !!studioLogo,
    loadingSprite: !!loadingSprite,
    derivedBackgrounds: Object.keys(derivedBackgrounds).length,
    freespinBg: !!derivedBackgrounds.freespin,
    extendedSymbols: Object.keys(extendedSymbols).length,
    pickClickAnnouncement: !!pickClickAnnouncementImage,
    wheelBonusCount: Object.keys(wheelBonusImages).length
  });
   // Config with corrected asset paths and loading experience
  const configWithAssets = {
    ...config, 
    background, 
    logo, 
    frame, 
    symbols, 
    uiElements,
    studioLogo,
    loadingSprite,
    derivedBackgrounds,
    numberImages,
    bonusNumberImages,
    freeSpinAnnouncementImage,
    // Include loading experience config if available
    loadingExperience: config.loadingExperience || {
      backgroundColor: '#1a1a2e',
      accentColor: '#ffd700',
      textColor: '#ffffff',
      customMessage: 'GameStudio™ - 2024',
      showPercentage: true,
      studioLogoSize: 80,
      spriteSize: 40,
      progressBarWidth: 60
    }
  };

  // Root files
  zip.file('package.json', generatePackageJson(gameName));
  zip.file('vite.config.ts', generateViteConfig());
  zip.file('tsconfig.json', generateTsConfig());
  zip.file('tsconfig.node.json', generateTsConfigNode());
  zip.file('index.html', generateIndexHtml(gameName));
  zip.file('README.md', generateReadme(gameName));
  zip.file('tailwind.config.js', generateTailwindConfig());
  zip.file('postcss.config.js', generatePostCSSConfig());

  // Source files
  zip.file('src/main.tsx', generateMainTsx());
  zip.file('src/App.tsx', generateAppTsx(configWithAssets));
  zip.file('src/index.css', generateIndexCssWithTailwind());
  zip.file('src/App.css', generateAppCss() + '\n\n' + generatePickAndClickCSS());
  zip.file('.gitignore', gitignore());
  zip.file('src/store.ts', generateStore());

  zip.file('src/config/gameConfig.ts', generateGameConfig(configWithAssets));
  zip.file('src/context/ThemeContext.tsx', generateThemeContext());

  // Utils
  zip.file('src/utils/gameInitialization.ts', gameInitializationFile());
  zip.file('src/utils/wheelBonus.ts', generateWheelBonus());
  zip.file('src/utils/autoPlay.ts', generateAutoPlay());
  zip.file('src/utils/soundSystem.ts', generateSoundSystem());
  zip.file('src/utils/winAnimationSystem.ts', generateWinANimation());
  zip.file('src/utils/slotGridSystem.ts', generateSlotGridSystem());
  zip.file('src/utils/announcementSystem.ts', generateAnnouncement());

  // Components
  if(uiType === 'normal') {
    zip.file('src/components/uiButtons.tsx', NormalUiButtons());
  } else if(uiType === 'ultimate') {
    zip.file('src/components/uiButtons.tsx', UltimateUiButtons());
  } else if (uiType === 'modern') {
    zip.file('src/components/uiButtons.tsx', ModernUiButtons());
  }
  zip.file('src/components/SlotMachine.tsx', generateSlotMachineComponent());
  zip.file('src/components/LoadingScreen.tsx', generateLoadingComponent());
  zip.file('src/components/InfoPage.tsx', generateInfoPage(configWithAssets));
  zip.file('src/components/MenuModal.tsx', generateMenuModal());
  zip.file('src/components/BaseModal.tsx', baseModal());
  zip.file('src/components/AnnouncementModal.tsx', anouncementModal());
  zip.file('src/components/PickAndClickModal.tsx', generatePickAndClickModal());
  zip.file('src/styles/modals.css', modalCss());
  zip.file('src/styles/animations.css', animationCss())
  zip.file('src/styles/theme.css', generateThemeCss())
  zip.file('src/types/index.ts',typeofGame());

  // Create folder structure explicitly
  console.log('📁 Creating folder structure...');
  zip.folder('public');
  zip.folder('public/assets');
  zip.folder('public/assets/symbols');
  zip.folder('public/assets/buttons');
  zip.folder('public/assets/LoadingAssets');
  zip.folder('public/assets/NumberImages');
  zip.folder('public/assets/BonusNumberImages');
  zip.folder('public/assets/backgrounds');
  zip.folder('public/assets/audio');
  zip.folder('public/assets/audio/background');
  zip.folder('public/assets/audio/reels');
  zip.folder('public/assets/audio/ui');
  zip.folder('public/assets/audio/wins');
  zip.folder('public/assets/audio/bonus');
  zip.folder('public/assets/audio/features');
  zip.folder('public/assets/audio/ambience'); 
  zip.folder('public/assets/announcements');
  zip.folder('public/assets/BonusNumberImages');
  zip.folder('public/assets/PickClickAnnouncement');
  zip.folder('public/assets/WheelBonus');

  // Check if game type requires bonus assets folder
  const bonusGameTypes = ['Pick & Click', 'Interactive Bonus Game', 'Wheel Bonus', 'Wheel of Fortune Style Bonus'];
  const holdSpinGameTypes = ['HoldSpin Symbol', 'Hold & Spin Announcement Image'];
  const gameType = config.gameType || config.type || '';
  const isBonusGame = bonusGameTypes.includes(gameType);
  const isHoldSpinGame = holdSpinGameTypes.includes(gameType);
  
  if (isBonusGame) {
    console.log(`🎰 Detected bonus game type: ${gameType} - Creating bonus assets folder`);
    zip.folder('public/assets/bonus');
  }

  // Assets folder structure
  console.log('📁 Downloading assets...');
  let assetsDownloaded = 0;
  let bonusAssetsCount = 0;
  
  // Add main background
  if (background) {
    console.log('⬇️ Downloading background:', background);
    const success = await addAssetToZip(zip, background, 'public/assets/backgrounds/background.png');
    if (success) assetsDownloaded++;
  }
  
  // Add derived backgrounds (free-spin, night, day, bonus)
  if (derivedBackgrounds.freespin) {
    console.log('⬇️ Downloading free-spin background:', derivedBackgrounds.freespin);
    const success = await addAssetToZip(zip, derivedBackgrounds.freespin, 'public/assets/backgrounds/free-spin.png');
    if (success) assetsDownloaded++;
  }
  
  if (derivedBackgrounds.night) {
    console.log('⬇️ Downloading night background:', derivedBackgrounds.night);
    const success = await addAssetToZip(zip, derivedBackgrounds.night, 'public/assets/backgrounds/night.png');
    if (success) assetsDownloaded++;
  }
  
  if (derivedBackgrounds.day) {
    console.log('⬇️ Downloading day background:', derivedBackgrounds.day);
    const success = await addAssetToZip(zip, derivedBackgrounds.day, 'public/assets/backgrounds/day.png');
    if (success) assetsDownloaded++;
  }
  
  if (derivedBackgrounds.bonus) {
    console.log('⬇️ Downloading bonus background:', derivedBackgrounds.bonus);
    const success = await addAssetToZip(zip, derivedBackgrounds.bonus, 'public/assets/backgrounds/bonus.png');
    if (success) assetsDownloaded++;
  }
  
  // Add logo
  if (logo) {
    console.log('⬇️ Downloading logo:', logo);
    const success = await addAssetToZip(zip, logo, 'public/assets/logo.png');
    if (success) assetsDownloaded++;
  }
  
  // Add frame
  if (frame) {
    console.log('⬇️ Downloading frame:', frame);
    const success = await addAssetToZip(zip, frame, 'public/assets/frame.png');
    if (success) assetsDownloaded++;
  }
  
  // Add symbols with actual names from GameStore (bonus symbols now in unified config)
  const symbolsArray = Array.isArray(symbols) ? symbols : Object.values(symbols || {});
  
  // Get actual symbol types from GameStore (includes bonus symbols)
  let symbolTypesForExport: string[];
  if (!Array.isArray(symbols) && symbols && typeof symbols === 'object') {
    symbolTypesForExport = Object.keys(symbols);
    console.log('✅ Using actual symbol keys for export (includes bonus):', symbolTypesForExport);
  } else {
    // Generate symbol types for array format
    symbolTypesForExport = symbolsArray.map((_, index) => {
      if (index === 0) return 'wild';
      if (index <= 3) return `high${index}`;
      if (index <= 6) return `medium${index - 3}`;
      return `low${index - 6}`;
    });
    console.log('Generated symbol types for array format:', symbolTypesForExport);
  }
  
  // Add extended symbols to export if they exist
  console.log(`⬇️ Downloading ${Object.keys(extendedSymbols).length} extended symbols...`);
  for (const [extendedKey, extendedSymbolUrl] of Object.entries(extendedSymbols)) {
    if (extendedSymbolUrl && extendedKey.endsWith('_extended')) {
      const symbolType = extendedKey.replace('_extended', '');
      console.log(`⬇️ Downloading extended symbol ${symbolType}:`, typeof extendedSymbolUrl === 'string' ? extendedSymbolUrl.substring(0, 50) + '...' : 'base64 data');
      const success = await addAssetToZip(zip, extendedSymbolUrl, `public/assets/symbols/${symbolType}_extended.png`);
      if (success) assetsDownloaded++;
    }
  }
  
  // All symbols (including bonus) are now in the unified symbols array
  const allSymbolsForExport = symbolsArray;
  const allSymbolTypesForExport = symbolTypesForExport;
  
  console.log(`⬇️ Downloading ${allSymbolsForExport.length} symbols (includes bonus symbols)...`);
  for (let i = 0; i < allSymbolsForExport.length; i++) {
    const symbolUrl = allSymbolsForExport[i];
    if (symbolUrl) {
      const symbolName = allSymbolTypesForExport[i] || `symbol_${i + 1}`;
      const isBonusType = ['bonus', 'scatter', 'jackpot', 'holdspin'].includes(symbolName);
      console.log(`⬇️ Downloading ${isBonusType ? 'bonus ' : ''}symbol ${i + 1}/${allSymbolsForExport.length}: ${symbolName}`);
      const success = await addAssetToZip(zip, symbolUrl, `public/assets/symbols/${symbolName}.png`);
      if (success) assetsDownloaded++;
    }
  }
  
  // Add studio logo and loading sprite
  if (studioLogo) {
    console.log('⬇️ Downloading studio logo:', studioLogo);
    const success = await addAssetToZip(zip, studioLogo, 'public/assets/LoadingAssets/studioLogo.png');
    if (success) assetsDownloaded++;
  }
  
  if (loadingSprite) {
    console.log('⬇️ Downloading loading sprite:', loadingSprite);
    const success = await addAssetToZip(zip, loadingSprite, 'public/assets/LoadingAssets/loadingSprite.png');
    if (success) assetsDownloaded++;
  }

  // Add Announcement Trigger Image (Level 12)
  if (freeSpinAnnouncementImage) {
    console.log('⬇️ Downloading free spin announcement image:', freeSpinAnnouncementImage);
    const success = await addAssetToZip(zip, freeSpinAnnouncementImage, 'public/assets/announcements/free-spins.png');
    if (success) assetsDownloaded++;
  }
  
  // Add Pick & Click Announcement Image
  if (pickClickAnnouncementImage) {
    console.log('⬇️ Downloading Pick & Click announcement image:', pickClickAnnouncementImage);
    const success = await addAssetToZip(zip, pickClickAnnouncementImage, 'public/assets/PickClickAnnouncement/announcement.png');
    if (success) assetsDownloaded++;
  }
  
  // Add Hold & Spin Announcement Images
  if (holdSpinAnnouncementImage) {
    console.log('⬇️ Downloading Hold & Spin announcement image:', holdSpinAnnouncementImage);
    const success = await addAssetToZip(zip, holdSpinAnnouncementImage, 'public/assets/announcements/hold-spin.png');
    if (success) assetsDownloaded++;
  }
  
  if (holdSpinSymbol) {
    console.log('⬇️ Downloading HoldSpin symbol:', holdSpinSymbol);
    const success = await addAssetToZip(zip, holdSpinSymbol, 'public/assets/announcements/holdspin-symbol.png');
    if (success) assetsDownloaded++;
  }
  
  // Add Wheel Bonus Images from all sources
  const allWheelImages = { ...wheelBonusImages, ...wheelFromBonus };
  
  // Create WheelBonus directory structure first
  zip.folder('public/assets/WheelBonus');
  
  // Process wheel bonus images
  for (const [key, imageUrl] of Object.entries(allWheelImages)) {
    if (imageUrl && typeof imageUrl === 'string') {
      console.log(`⬇️ Downloading wheel bonus image ${key}:`, imageUrl);
      try {
        const success = await addAssetToZip(zip, imageUrl, `public/assets/WheelBonus/${key}.png`);
        if (success) {
          assetsDownloaded++;
          console.log(`✅ Successfully added ${key} to WheelBonus folder`);
        } else {
          console.warn(`⚠️ Failed to add ${key} to WheelBonus folder`);
        }
      } catch (error) {
        console.error(`Error adding ${key} to WheelBonus folder:`, error);
      }
    }
  }
  
  // Add individual wheel assets
  if (wheelBackground) {
    console.log('⬇️ Downloading wheel background:', wheelBackground);
    const success = await addAssetToZip(zip, wheelBackground, 'public/assets/WheelBonus/background.png');
    if (success) assetsDownloaded++;
  }
  
  if (wheelPointer) {
    console.log('⬇️ Downloading wheel pointer:', wheelPointer);
    const success = await addAssetToZip(zip, wheelPointer, 'public/assets/WheelBonus/pointer.png');
    if (success) assetsDownloaded++;
  }
  
  if (wheelSegment) {
    console.log('⬇️ Downloading wheel segment:', wheelSegment);
    const success = await addAssetToZip(zip, wheelSegment, 'public/assets/WheelBonus/segment.png');
    if (success) assetsDownloaded++;
  }
  
  // Add number images (0-9)
  console.log(`⬇️ Downloading ${Object.keys(numberImages).length} number images...`);
  for (const [number, imageUrl] of Object.entries(numberImages)) {
    if (imageUrl) {
      console.log(`⬇️ Downloading number ${number}:`, imageUrl);
      const success = await addAssetToZip(zip, imageUrl, `public/assets/NumberImages/${number}.png`);
      if (success) assetsDownloaded++;
    }
  }
  
  // Add bonus number images (0-9) to dedicated folder
  console.log(`⬇️ Downloading ${Object.keys(bonusNumberImages).length} bonus number images...`);
  for (const [number, imageUrl] of Object.entries(bonusNumberImages)) {
    if (imageUrl) {
      console.log(`⬇️ Downloading bonus number ${number}:`, imageUrl);
      const success = await addAssetToZip(zip, imageUrl, `public/assets/BonusNumberImages/${number}.png`);
      if (success) assetsDownloaded++;
    }
  }
  
  // Add audio files from Step11_EnhancedAudio if they exist
  const audioFiles: any = config?.audioFiles || {};
  const audioCategories = ['background', 'reels', 'ui', 'wins', 'bonus', 'features', 'ambience'];
  let audioFilesCount = 0;
  
  console.log('🎵 Processing audio files...');
  for (const category of audioCategories) {
    const categoryFiles: any = audioFiles[category];
    if (categoryFiles && Object.keys(categoryFiles).length > 0) {
      console.log(`⬇️ Adding ${Object.keys(categoryFiles).length} audio files from ${category}...`);
      for (const [name, fileData] of Object.entries(categoryFiles)) {
        const data: any = fileData;
        if (data.audioData) {
          try {
            // Convert ArrayBuffer to Blob if needed
            const audioBlob = data.audioData instanceof Blob 
              ? data.audioData 
              : new Blob([data.audioData], { type: 'audio/mpeg' });
            
            zip.file(`public/assets/audio/${category}/${name}.mp3`, audioBlob);
            audioFilesCount++;
            console.log(`✅ Added audio file: ${category}/${name}.mp3`);
          } catch (error) {
            console.warn(`⚠️ Failed to add audio file ${category}/${name}:`, error);
          }
        }
      }
    }
  }
  
  if (audioFilesCount > 0) {
    console.log(`✅ Added ${audioFilesCount} audio files to export`);
  } else {
    console.log('ℹ️ No audio files found to export');
  }
  
  // Add UI buttons if they exist
  console.log('⬇️ Downloading UI buttons...');
  const buttonMappings = [
    ['menuButton', 'menu.png'],
    ['spinButton', 'spin.png'],
    ['autoplayButton', 'autoplay.png'],
    ['soundButton', 'sound.png'],
    ['settingsButton', 'settings.png'],
    ['quickButton', 'quick.png']
  ];

  for (const [buttonKey, fileName] of buttonMappings) {
    if (uiElements[buttonKey]) {
      console.log(`⬇️ Downloading ${buttonKey}:`, uiElements[buttonKey]);
      const success = await addAssetToZip(zip, uiElements[buttonKey], `public/assets/buttons/${fileName}`);
      if (success) assetsDownloaded++;
    }
  }

  // Add bonus game assets if applicable
  if (isBonusGame) {
    console.log('🎰 Processing bonus game assets...');
    
    // Extract bonus-related images from config
    const bonusAssets = config.bonusAssets || config.bonus || {};
    const wheelAssets = config.wheelAssets || {};
    const pickClickAssets = config.pickClickAssets || {};
    
    // Remove this block as it's handled earlier
    
    // Process bonus assets from multiple possible sources
    const allBonusAssets = { ...bonusAssets, ...wheelAssets, ...pickClickAssets };
    
    // Process wheel bonus images from all sources
    for (const [key, imageUrl] of Object.entries(allWheelImages)) {
      if (imageUrl && typeof imageUrl === 'string') {
        console.log(`⬇️ Downloading wheel bonus image ${key}:`, imageUrl);
        const success = await addAssetToZip(zip, imageUrl, `public/assets/WheelBonus/${key}.png`);
        if (success) {
          assetsDownloaded++;
          bonusAssetsCount++;
        }
      }
    }
    
    // Wheel Bonus assets
    const wheelImageMappings = [
      ['wheelBackground', 'wheel-background.png'],
      ['wheelPointer', 'wheel-pointer.png'],
      ['wheelSegment', 'wheel-segment.png']
    ];
    
    for (const [assetKey, fileName] of wheelImageMappings) {
      if (allBonusAssets[assetKey]) {
        console.log(`⬇️ Downloading wheel asset ${assetKey}:`, allBonusAssets[assetKey]);
        const success = await addAssetToZip(zip, allBonusAssets[assetKey], `public/assets/WheelBonus/${fileName}`);
        if (success) {
          assetsDownloaded++;
          bonusAssetsCount++;
        }
      }
    }
    
    // Common bonus assets
    const bonusImageMappings = [
      ['bonusBackground', 'bonus-background.png'],
      ['pickItem', 'pick-item.png'],
      ['revealedItem', 'revealed-item.png'],
      ['bonusSymbol', 'bonus-symbol.png']
    ];
    
    for (const [assetKey, fileName] of bonusImageMappings) {
      if (allBonusAssets[assetKey]) {
        console.log(`⬇️ Downloading bonus asset ${assetKey}:`, allBonusAssets[assetKey]);
        const success = await addAssetToZip(zip, allBonusAssets[assetKey], `public/assets/bonus/${fileName}`);
        if (success) {
          assetsDownloaded++;
          bonusAssetsCount++;
        }
      }
    }
    
    console.log(`✅ Added ${bonusAssetsCount} bonus assets for ${gameType}`);
  }

  // Create placeholder images for failed downloads
  const createPlaceholderImage = (width: number, height: number, text: string, color: string = '#4A90E2'): Blob => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    
    // Background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    
    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.min(width, height) / 8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    }) as any;
  };
  
  // Create free-spin background placeholder
  const createFreeSpinBackground = (): Blob => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1920;
    canvas.height = 1080;
    
    // Dark gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1920, 1080);
    
    // Add stars effect
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1920;
      const y = Math.random() * 1080;
      const size = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add "FREE SPINS" text overlay
    ctx.fillStyle = 'rgba(255, 107, 53, 0.3)';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FREE SPINS', 960, 540);
    
    // Add border glow
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 8;
    ctx.strokeText('FREE SPINS', 960, 540);
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    }) as any;
  };
  
  // Count derived backgrounds
  const derivedBackgroundCount = Object.values(derivedBackgrounds).filter(Boolean).length;
  
  const totalExpectedAssets = (background ? 1 : 0) + (logo ? 1 : 0) + (frame ? 1 : 0) + allSymbolsForExport.length + Object.keys(uiElements).length + (studioLogo ? 1 : 0) + (loadingSprite ? 1 : 0) + Object.keys(numberImages).length + Object.keys(bonusNumberImages).length + derivedBackgroundCount + Object.keys(extendedSymbols).length + audioFilesCount + bonusAssetsCount;
  
  console.log(`✅ Assets processing complete: ${assetsDownloaded} real assets downloaded`);
  
  // Add placeholder images for missing assets
  if (assetsDownloaded < totalExpectedAssets) {
    console.log(`🆔 Creating ${totalExpectedAssets - assetsDownloaded} placeholder images...`);
    
    // Only add placeholder background if no background was provided at all
    if (!background) {
      const placeholder = createPlaceholderImage(1920, 1080, 'BACKGROUND', '#2C3E50');
      zip.file('public/assets/background.png', placeholder);
      console.log('🆔 Added placeholder background (no background provided)');
    } else if (!zip.file('public/assets/background.png')) {
      console.warn('⚠️ Background was provided but failed to download, keeping empty');
    }
    
    // Always add free-spin background (either real or placeholder)
    // Only create placeholder if download failed (default should already be included)
    if (!zip.file('public/assets/backgrounds/free-spin.png')) {
      // Check if we have a default or custom free-spin background that failed to download
      if (derivedBackgrounds.freespin) {
        console.warn('⚠️ Free-spin background was provided but failed to download, creating placeholder');
        const freeSpinBg = createFreeSpinBackground();
        zip.file('public/assets/backgrounds/free-spin.png', freeSpinBg);
        console.log('🆔 Added free-spin background placeholder');
      } else {
        // No free-spin background at all, use default
        const freeSpinBg = createFreeSpinBackground();
        zip.file('public/assets/backgrounds/free-spin.png', freeSpinBg);
        console.log('🆔 Added free-spin background placeholder (no background provided)');
      }
    }
    
    // Add other derived background placeholders if they were provided but failed to download
    const derivedBgMappings = [
      ['night', 'night.png', 'NIGHT', '#2C3E50'],
      ['day', 'day.png', 'DAY', '#3498DB'],
      ['bonus', 'bonus.png', 'BONUS', '#E74C3C']
    ];
    
    for (const [key, fileName, text, color] of derivedBgMappings) {
      const bgPath = `public/assets/backgrounds/${fileName}`;
      
      if (derivedBackgrounds[key] && !zip.file(bgPath)) {
        const placeholder = createPlaceholderImage(1920, 1080, text, color);
        zip.file(bgPath, placeholder);
        console.log(`🆔 Added placeholder ${key} background`);
      }
    }
    
    // Add placeholder logo if missing
    if (logo && !zip.file('public/assets/logo.png')) {
      const placeholder = createPlaceholderImage(400, 200, 'LOGO', '#E74C3C');
      zip.file('public/assets/logo.png', placeholder);
      console.log('🆔 Added placeholder logo');
    }
    
    // Add placeholder frame if missing
    if (frame && !zip.file('public/assets/frame.png')) {
      const placeholder = createPlaceholderImage(800, 600, 'FRAME', '#8E44AD');
      zip.file('public/assets/frame.png', placeholder);
      console.log('🆔 Added placeholder frame');
    }
    
    // Add placeholder loading assets if missing
    if (studioLogo && !zip.file('public/assets/LoadingAssets/studioLogo.png')) {
      const placeholder = createPlaceholderImage(80, 80, 'STUDIO', '#E74C3C');
      zip.file('public/assets/LoadingAssets/studioLogo.png', placeholder);
      console.log('🆔 Added placeholder studio logo');
    }
    
    if (loadingSprite && !zip.file('public/assets/LoadingAssets/loadingSprite.png')) {
      const placeholder = createPlaceholderImage(40, 40, 'SPRITE', '#FFD700');
      zip.file('public/assets/LoadingAssets/loadingSprite.png', placeholder);
      console.log('🆔 Added placeholder loading sprite');
    }
    
    // Add placeholder symbols if missing (bonus symbols included in unified array)
    for (let i = 0; i < allSymbolsForExport.length; i++) {
      const symbolName = allSymbolTypesForExport[i] || `symbol_${i + 1}`;
      const symbolPath = `public/assets/symbols/${symbolName}.png`;
      
      if (allSymbolsForExport[i] && !zip.file(symbolPath)) {
        const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#FFD700', '#FF6B35'];
        const isBonusType = ['bonus', 'scatter', 'jackpot', 'holdspin'].includes(symbolName);
        const color = isBonusType ? '#FFD700' : colors[i % colors.length]; // Gold for bonus symbols
        const placeholder = createPlaceholderImage(200, 200, symbolName.toUpperCase(), color);
        zip.file(symbolPath, placeholder);
        console.log(`🆔 Added placeholder ${isBonusType ? 'bonus ' : ''}symbol: ${symbolName}`);
      }
    }
    
    // Add placeholder number images if missing
    for (const [number, imageUrl] of Object.entries(numberImages)) {
      const numberPath = `public/assets/NumberImages/${number}.png`;
      
      if (imageUrl && !zip.file(numberPath)) {
        const placeholder = createPlaceholderImage(64, 64, number, '#FFD700');
        zip.file(numberPath, placeholder);
        console.log(`🆔 Added placeholder number image: ${number}`);
      }
    }
    
    // Add placeholder bonus number images if missing
    for (const [number, imageUrl] of Object.entries(bonusNumberImages)) {
      const bonusNumberPath = `public/assets/BonusNumberImages/${number}.png`;
      
      if (imageUrl && !zip.file(bonusNumberPath)) {
        const placeholder = createPlaceholderImage(64, 64, number, '#FFD700');
        zip.file(bonusNumberPath, placeholder);
        console.log(`🆔 Added placeholder bonus number image: ${number}`);
      }
    }
    
    // Add placeholder UI buttons if missing
    const buttonColors = {
      menuButton: '#34495E',
      spinButton: '#E67E22',
      autoplayButton: '#27AE60',
      soundButton: '#8E44AD',
      settingsButton: '#95A5A6',
      quickButton: '#E74C3C'
    };
    
    for (const [buttonKey, fileName] of buttonMappings) {
      const buttonPath = `public/assets/buttons/${fileName}`;
      
      if (uiElements[buttonKey] && !zip.file(buttonPath)) {
        const placeholder = createPlaceholderImage(100, 100, buttonKey.replace('Button', '').toUpperCase(), buttonColors[buttonKey as keyof typeof buttonColors]);
        zip.file(buttonPath, placeholder);
        console.log(`🆔 Added placeholder button: ${buttonKey}`);
      }
    }
  }
  
  // Add export info file
  const infoContent = `# SlotAI React Project Export\n\nExported: ${new Date().toISOString()}\nAssets Downloaded: ${assetsDownloaded}/${totalExpectedAssets}\nPlaceholders: ${totalExpectedAssets - assetsDownloaded}\n\n## Loading Experience\n- Studio Logo: ${studioLogo ? 'Generated' : 'Placeholder'}\n- Loading Sprite: ${loadingSprite ? 'Generated' : 'Placeholder'}\n- Background Color: ${config.loadingExperience?.backgroundColor || '#1a1a2e'}\n- Accent Color: ${config.loadingExperience?.accentColor || '#ffd700'}\n\n## Derived Backgrounds\n- Free Spin: ${derivedBackgrounds.freespin ? 'Included' : 'Not generated'}\n- Night Version: ${derivedBackgrounds.night ? 'Included' : 'Not generated'}\n- Day Version: ${derivedBackgrounds.day ? 'Included' : 'Not generated'}\n- Bonus Round: ${derivedBackgrounds.bonus ? 'Included' : 'Not generated'}\n\n## Audio Files\n- Total Audio Files: ${audioFilesCount}\n- Background Music: ${audioFiles.background ? Object.keys(audioFiles.background).length : 0}\n- Reel Sounds: ${audioFiles.reels ? Object.keys(audioFiles.reels).length : 0}\n- UI Sounds: ${audioFiles.ui ? Object.keys(audioFiles.ui).length : 0}\n- Win Sounds: ${audioFiles.wins ? Object.keys(audioFiles.wins).length : 0}\n- Bonus Sounds: ${audioFiles.bonus ? Object.keys(audioFiles.bonus).length : 0}\n- Feature Sounds: ${audioFiles.features ? Object.keys(audioFiles.features).length : 0}\n- Ambience: ${audioFiles.ambience ? Object.keys(audioFiles.ambience).length : 0}\n\n## Instructions\n1. Run 'npm install'\n2. Run 'npm run dev'\n3. Replace placeholder images if needed\n4. Customize loading experience in src/config/gameConfig.ts\n5. Use derivedBackgrounds in your game logic for different modes\n6. Audio files are located in public/assets/audio/ organized by category\n`;
  zip.file('EXPORT_INFO.md', infoContent);

  // Generate ZIP
  return zip.generateAsync({ type: 'blob' });
};

/**
 * Download React project as ZIP file
 */
export const downloadReactProject = async (config: GameConfig): Promise<void> => {
  try {
    console.log('📦 Exporting React project...');
    const zipBlob = await exportReactProject(config);
    
    // Create download link
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(config.gameId || config.name || 'slot-game').toLowerCase().replace(/[^a-z0-9]/g, '-')}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ React project downloaded successfully');
  } catch (error) {
    console.error('Failed to export React project:', error);
    throw error;
  }
};