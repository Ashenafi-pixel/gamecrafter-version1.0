import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store';

// Types for the unified game canvas
export interface GameCanvasProps {
  /** Enable or disable edit mode (direct manipulation) */
  editMode?: boolean;
  /** Current active editing layer */
  activeLayer?: 'background' | 'symbols' | 'ui' | 'effects' | 'all';
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Zoom level (1 = 100%) */
  zoom?: number;
  /** Callback when an element is selected */
  onElementSelect?: (elementId: string, elementType: string) => void;
  /** Class name for additional styling */
  className?: string;
  /** Whether the game is currently playing/animating */
  isPlaying?: boolean;
}

/**
 * Unified Game Canvas Component
 * 
 * This component serves as the central preview and editing surface for the
 * slot game creation process. It provides real-time visualization of the
 * game being created across all steps of the creation process.
 */
const GameCanvas: React.FC<GameCanvasProps> = ({
  editMode = false,
  activeLayer = 'all',
  width = 800,
  height = 600,
  zoom = 1,
  onElementSelect,
  className = '',
  isPlaying = false,
}) => {
  // Refs for the canvas and container elements
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Local state for canvas interactions
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPosition, setPanStartPosition] = useState({ x: 0, y: 0 });
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [themeUpdated, setThemeUpdated] = useState(0); // Counter to force re-renders
  
  // Get game configuration from the store
  const gameConfig = useGameStore(state => ({
    gameType: state.gameType,
    theme: state.theme,
    gridSize: state.gridSize,
    symbols: state.symbols,
    // Add more configuration as needed
  }));
  
  // Force re-render when theme colors change
  useEffect(() => {
    console.log("Canvas detected theme color change:", gameConfig.theme?.colors);
    setThemeUpdated(prev => prev + 1);
  }, [JSON.stringify(gameConfig.theme?.colors)]);

  // Handle mouse down (start pan or select element)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle button or Alt+Left click
      setIsPanning(true);
      setPanStartPosition({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    } else if (editMode && e.button === 0) { // Left click in edit mode
      // Implement element selection logic here
      // For now, this is a placeholder
      const mockSelectedElement = 'element-1';
      setSelectedElement(mockSelectedElement);
      onElementSelect?.(mockSelectedElement, 'symbol');
    }
  };

  // Handle mouse move (pan the canvas)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - panStartPosition.x;
      const deltaY = e.clientY - panStartPosition.y;
      setCanvasPosition({
        x: canvasPosition.x + deltaX,
        y: canvasPosition.y + deltaY
      });
      setPanStartPosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse up (end pan)
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Handle mouse wheel (zoom in/out)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      // Implement zoom logic here
      // This is a placeholder
    }
  };

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseLeave = () => {
      if (isPanning) {
        setIsPanning(false);
      }
    };

    container.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isPanning]);

  // Prevent context menu in edit mode
  const handleContextMenu = (e: React.MouseEvent) => {
    if (editMode) {
      e.preventDefault();
    }
  };

  // Render different layers based on active layers and game configuration
  const renderLayers = () => {
    // Get theme-specific data for rendering
    const themeId = gameConfig.theme?.selectedThemeId || gameConfig.theme?.mainTheme?.toLowerCase().replace(/\s+/g, '-') || 'base-style';
    const themeName = gameConfig.theme?.mainTheme || 'Default Theme';
    const themeColors = gameConfig.theme?.colors || { primary: '#4682B4', secondary: '#2F4F4F', accent: '#FF6347' };
    
    console.log('GameCanvas rendering with theme:', { themeId, themeName, themeColors: JSON.stringify(themeColors) });
    
    // Determine theme type for special effects
    const isEgyptTheme = themeName.toLowerCase().includes('egypt') || themeId.includes('egypt');
    const isCosmicTheme = themeName.toLowerCase().includes('cosmic') || themeId.includes('cosmic');
    const isForestTheme = themeName.toLowerCase().includes('forest') || themeId.includes('forest');
    const isOceanTheme = themeName.toLowerCase().includes('ocean') || themeId.includes('ocean');
    const isWesternTheme = themeName.toLowerCase().includes('west') || themeId.includes('west');
    const isAsianTheme = (themeName.toLowerCase().includes('asian') || themeName.toLowerCase().includes('dynasty')) || 
                         (themeId.includes('asian') || themeId.includes('dynasty'));
    
    return (
      <>
        {/* Background Layer */}
        {(activeLayer === 'all' || activeLayer === 'background') && (
          <div className="absolute inset-0 bg-gray-900">
            {/* Dynamic background rendering */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: gameConfig.theme?.generated?.background || 
                                (gameConfig.theme?.selectedThemeId ? `url(/themes/${themeId}.png)` : 'none'),
                backgroundColor: !gameConfig.theme?.selectedThemeId ? '#111827' : 'transparent',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.9
              }}
            ></div>
            
            {/* Background overlay with theme-specific gradients - MORE VIBRANT */}
            <div 
              className="absolute inset-0"
              style={{
                background: (() => {
                  if (isEgyptTheme) {
                    return `radial-gradient(circle at 70% 30%, ${themeColors.primary}70, ${themeColors.primary}00 80%)`;
                  } else if (isCosmicTheme) {
                    return `linear-gradient(135deg, ${themeColors.primary}60, ${themeColors.secondary}70)`;
                  } else if (isForestTheme) {
                    return `linear-gradient(to bottom, ${themeColors.primary}20, ${themeColors.primary}80)`;
                  } else if (isOceanTheme) {
                    return `linear-gradient(to top, ${themeColors.primary}80, ${themeColors.primary}00 70%)`;
                  } else if (isWesternTheme) {
                    return `linear-gradient(0deg, ${themeColors.secondary}65, ${themeColors.secondary}10 60%)`;
                  } else if (isAsianTheme) {
                    return `radial-gradient(circle at 30% 70%, ${themeColors.primary}60, ${themeColors.primary}00 70%)`;
                  } else {
                    return themeColors ? 
                      `linear-gradient(135deg, ${themeColors.primary}60, ${themeColors.secondary}70)` : 
                      'none';
                  }
                })(),
                opacity: 0.4,
                mixBlendMode: 'multiply'
              }}
            ></div>
            
            {/* Additional color overlay for more obvious color changes */}
            <div 
              className="absolute inset-0 mix-blend-color-burn"
              style={{
                backgroundColor: `${themeColors.primary}30`,
                opacity: 0.3
              }}
            ></div>
          </div>
        )}
        
        {/* Symbol Layer */}
        {(activeLayer === 'all' || activeLayer === 'symbols') && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {/* Symbol grid with theme-specific styling */}
            <div 
              className="grid grid-cols-5 gap-1 p-4 rounded-lg backdrop-blur-sm"
              style={{
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: gameConfig.theme?.colors?.accent 
                  ? `${gameConfig.theme.colors.accent}50` 
                  : 'rgba(255,255,255,0.2)',
                backgroundColor: gameConfig.theme?.colors?.secondary 
                  ? `${gameConfig.theme.colors.secondary}20`
                  : 'rgba(0,0,0,0.3)',
                boxShadow: gameConfig.theme?.colors?.accent
                  ? `0 0 15px ${gameConfig.theme.colors.accent}30`
                  : 'none'
              }}
            >
              {/* Generate symbols based on theme */}
              {Array(15).fill(0).map((_, i) => {
                // Special handling for specific positions to show theme-specific symbols
                const isWild = i === 9;
                const isScatter = i === 10;
                const isSpecial = i > 10;
                
                // Get the symbol name based on position and theme
                const getSymbolName = () => {
                  if (isWild) return 'WILD';
                  if (isScatter) return 'SCAT';
                  if (isSpecial) return ['♦', '♥', '♠', '♣'][i-11];
                  
                  // Regular symbols
                  if (gameConfig.theme?.mainTheme) {
                    // If we have theme-specific symbols, use them
                    const themeSymbols = {
                      'Ancient Egypt': ['Scarab', 'Ankh', 'Eye', 'Pharaoh', 'Pyramid', 'Cat', 'Mummy', 'Cobra', 'Oasis'],
                      'Cosmic Adventure': ['Planet', 'Star', 'Rocket', 'Alien', 'UFO', 'Comet', 'Satellite', 'Meteor', 'Astronaut'],
                      'Enchanted Forest': ['Fairy', 'Elf', 'Unicorn', 'Mushroom', 'Crystal', 'Potion', 'Tree', 'Flower', 'Wand'],
                      'Deep Ocean': ['Dolphin', 'Shark', 'Whale', 'Shell', 'Coral', 'Pearl', 'Octopus', 'Treasure', 'Anchor'],
                      'Wild West': ['Sheriff', 'Bandit', 'Horse', 'Cactus', 'Wagon', 'Gold', 'Boots', 'Hat', 'Whiskey'],
                      'Asian Dynasty': ['Dragon', 'Emperor', 'Lantern', 'Fan', 'Temple', 'Koi', 'Coin', 'Blossom', 'Scroll'],
                      'Candy Land': ['Lollipop', 'Candy', 'Chocolate', 'Donut', 'Cupcake', 'Ice Cream', 'Gummy', 'Gingerbread', 'Cake'],
                      'Tropical Paradise': ['Palm', 'Coconut', 'Flamingo', 'Toucan', 'Pineapple', 'Hibiscus', 'Cocktail', 'Surfboard', 'Tiki'],
                      'Ancient Aztec': ['Mask', 'Temple', 'Sun', 'Gold', 'Jaguar', 'Feather', 'Calendar', 'Sacrifice', 'Chief']
                    };
                    
                    // Get theme-specific symbols if available
                    const theme = Object.keys(themeSymbols).find(key => 
                      gameConfig.theme?.mainTheme?.includes(key));
                    
                    if (theme && i < themeSymbols[theme].length) {
                      return themeSymbols[theme][i];
                    }
                  }
                  
                  // Default to generic symbol name
                  return `Sym ${i+1}`;
                };
                
                // Get the symbol style based on theme
                const getSymbolStyle = () => {
                  // Base style for all themes
                  const baseStyle = {
                    backgroundColor: `rgba(0,0,0,0.3)`,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.2)`
                  };
                  
                  // Theme-specific styling
                  const themeName = gameConfig.theme?.mainTheme?.toLowerCase();
                  if (!themeName) return baseStyle;
                  
                  if (themeName.includes('egypt')) {
                    return {
                      ...baseStyle,
                      borderImage: isWild || isScatter ? 
                        'linear-gradient(to bottom right, #D4AF37, #A67C00) 1' : 'none',
                      borderWidth: isWild || isScatter ? '1px' : '0',
                      borderStyle: isWild || isScatter ? 'solid' : 'none',
                      backgroundImage: isWild || isScatter ? 
                        `radial-gradient(circle, ${gameConfig.theme.colors?.accent || '#D4AF37'}40 0%, transparent 70%)` :
                        i < 3 ? `linear-gradient(45deg, rgba(212, 175, 55, 0.2), transparent)` : 'none'
                    };
                  }
                  
                  if (themeName.includes('cosmic')) {
                    return {
                      ...baseStyle,
                      borderRadius: '8px',
                      backgroundImage: isWild || isScatter ? 
                        `radial-gradient(circle, ${gameConfig.theme.colors?.accent || '#6A0DAD'}40 0%, transparent 70%)` :
                        i < 3 ? `linear-gradient(225deg, rgba(106, 13, 173, 0.3), transparent)` : 'none'
                    };
                  }
                  
                  if (themeName.includes('forest')) {
                    return {
                      ...baseStyle,
                      borderRadius: '6px',
                      backgroundImage: isWild || isScatter ? 
                        `radial-gradient(circle, ${gameConfig.theme.colors?.accent || '#228B22'}40 0%, transparent 70%)` :
                        i < 3 ? `linear-gradient(to bottom, rgba(34, 139, 34, 0.3), transparent)` : 'none'
                    };
                  }
                  
                  if (themeName.includes('ocean')) {
                    return {
                      ...baseStyle,
                      borderRadius: '50%',
                      backgroundImage: isWild || isScatter ? 
                        `radial-gradient(circle, ${gameConfig.theme.colors?.accent || '#1E90FF'}40 0%, transparent 70%)` :
                        i < 3 ? `linear-gradient(to top, rgba(30, 144, 255, 0.3), transparent)` : 'none'
                    };
                  }
                  
                  if (themeName.includes('west')) {
                    return {
                      ...baseStyle,
                      borderRadius: '4px',
                      backgroundImage: isWild || isScatter ? 
                        `radial-gradient(circle, ${gameConfig.theme.colors?.accent || '#CD853F'}40 0%, transparent 70%)` :
                        i < 3 ? `linear-gradient(to right, rgba(205, 133, 63, 0.3), transparent)` : 'none'
                    };
                  }
                  
                  // Default style with special handling for special symbols
                  return {
                    ...baseStyle,
                    backgroundImage: isWild || isScatter || isSpecial ?
                      `radial-gradient(circle, ${gameConfig.theme.colors?.accent || '#FF5555'}40 0%, transparent 70%)` :
                      'none'
                  };
                };
                
                const symbolName = getSymbolName();
                const symbolColor = gameConfig.theme?.colors
                  ? (isWild ? gameConfig.theme.colors.accent : 
                     isScatter ? gameConfig.theme.colors.secondary :
                     isSpecial ? gameConfig.theme.colors.primary :
                     ['#EDD381', '#E5C66D', '#DCB959', '#D3AC45'][i % 4])
                  : '#FFFFFF';
                
                return (
                  <div 
                    key={`symbol-${i}`}
                    className={`w-16 h-16 flex items-center justify-center rounded-md cursor-pointer transition-all
                      ${editMode ? 'hover:bg-red-800 hover:bg-opacity-30' : 'hover:scale-105 hover:brightness-110'}
                      ${selectedElement === `symbol-${i}` ? 'ring-2 ring-red-500' : ''}
                    `}
                    style={getSymbolStyle()}
                    onClick={() => editMode && setSelectedElement(`symbol-${i}`)}
                  >
                    <div className="flex flex-col items-center">
                      <span 
                        className="text-sm font-medium"
                        style={{ 
                          color: symbolColor,
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }}
                      >
                        {symbolName}
                      </span>
                      
                      {/* Value for high/mid/low symbols */}
                      {!isWild && !isScatter && !isSpecial && (
                        <span className="text-xs text-white text-opacity-70 mt-1">
                          {i < 3 ? 'High' : i < 6 ? 'Mid' : 'Low'}
                        </span>
                      )}
                      
                      {/* Special indicator for wild and scatter */}
                      {(isWild || isScatter) && (
                        <span className="text-xs mt-1"
                          style={{ color: symbolColor }}
                        >
                          {isWild ? 'Wild' : 'Scatter'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* UI Layer */}
        {(activeLayer === 'all' || activeLayer === 'ui') && (
          <>
            {/* Title area - themed by selected theme - MORE VIBRANT */}
            <div className="absolute inset-x-0 top-4 flex justify-center items-center z-20">
              <div 
                className="px-6 py-2 rounded-lg backdrop-blur-sm"
                style={{
                  backgroundColor: themeColors.accent ? 
                    `${themeColors.accent}90` : 'rgba(0,0,0,0.3)',
                  boxShadow: themeColors.primary ?
                    `0 4px 20px ${themeColors.primary}90` : 'none',
                  border: themeColors.secondary ?
                    `2px solid ${themeColors.secondary}90` : 'none',
                  background: `linear-gradient(135deg, ${themeColors.accent}90, ${themeColors.secondary}80)`
                }}
              >
                <h2 
                  className="text-xl font-bold text-white"
                  style={{
                    textShadow: themeColors.primary ?
                      `0 2px 4px ${themeColors.primary}FF` : 'none'
                  }}
                >
                  {gameConfig.theme?.mainTheme || 'SLOT GAME'}
                </h2>
              </div>
            </div>
            
            {/* Game info display - balance, bet, win */}
            <div className="absolute top-20 w-full flex justify-center items-center z-20">
              <div className="flex gap-3 bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-2 px-4">
                {[
                  { label: 'BALANCE', value: '1,000.00' },
                  { label: 'BET', value: '1.00' },
                  { label: 'WIN', value: '0.00' }
                ].map((info, index) => (
                  <div 
                    key={info.label}
                    className="flex flex-col items-center"
                    style={{ 
                      borderRight: index < 2 ? `1px solid rgba(255,255,255,0.1)` : 'none',
                      paddingRight: index < 2 ? '12px' : '0',
                      marginRight: index < 2 ? '12px' : '0'
                    }}
                  >
                    <span className="text-xs text-gray-400">{info.label}</span>
                    <span 
                      className="text-sm font-medium"
                      style={{ 
                        color: info.label === 'WIN' && gameConfig.theme?.colors?.primary 
                          ? gameConfig.theme.colors.primary 
                          : 'white'
                      }}
                    >
                      {info.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          
            {/* Bottom UI bar with buttons - themed to match the selected theme - MORE VIBRANT */}
            <div 
              className="absolute inset-x-0 bottom-0 h-20 backdrop-blur-md flex items-center justify-center z-20"
              style={{
                background: themeColors.secondary
                  ? `linear-gradient(to top, ${themeColors.secondary}95, ${themeColors.primary}50, transparent)`
                  : 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.4), transparent)',
                borderTop: themeColors.accent
                  ? `2px solid ${themeColors.accent}90`
                  : '1px solid rgba(255,255,255,0.1)',
                boxShadow: `0 -10px 30px ${themeColors.primary}50`
              }}
            >
              <div className="flex gap-4">
                {[
                  { name: 'SPIN', icon: '▶' },
                  { name: 'BET', icon: '💰' },
                  { name: 'AUTO', icon: '🔄' },
                  { name: 'MENU', icon: '≡' }
                ].map((button) => {
                  // Customize button style based on type - MORE VIBRANT
                  const isPrimary = button.name === 'SPIN';
                  const buttonColor = isPrimary 
                    ? themeColors.accent 
                    : (button.name === 'MENU' ? themeColors.secondary : themeColors.primary);
                  const fallbackColor = isPrimary ? '#ff5555' : '#555555';
                  
                  // Generate gradient for buttons
                  const gradientStart = buttonColor || fallbackColor;
                  const gradientEnd = button.name === 'MENU' 
                    ? themeColors.accent || '#ff5555'
                    : themeColors.secondary || '#333333';
                  
                  return (
                    <div 
                      key={`ui-${button.name}`}
                      className={`${isPrimary ? 'w-16 h-16' : 'w-12 h-12'} rounded-full flex items-center justify-center cursor-pointer
                        transition-all duration-200
                        ${editMode ? 'hover:bg-red-800 hover:bg-opacity-50' : 
                                    'hover:scale-110 hover:brightness-110'}
                        ${selectedElement === `ui-${button.name}` ? 'ring-3 ring-white' : ''}
                      `}
                      style={{
                        background: isPrimary
                          ? `radial-gradient(circle at 30% 30%, ${gradientStart}, ${gradientEnd})`
                          : `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                        boxShadow: `0 0 20px ${buttonColor || fallbackColor}70, 0 0 40px ${buttonColor || fallbackColor}40`,
                        border: `2px solid rgba(255,255,255,0.2)`
                      }}
                      onClick={() => editMode && setSelectedElement(`ui-${button.name}`)}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-lg">{button.icon}</span>
                        <span className="text-white text-opacity-90 text-xs font-medium">
                          {button.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Side UI elements - only show in certain themes */}
            {gameConfig.theme?.mainTheme && (
              <>
                {/* Left side decorative elements */}
                <div className="absolute left-2 top-1/3 z-20">
                  <div 
                    className="w-8 h-24 flex flex-col items-center justify-around"
                    style={{
                      background: gameConfig.theme.colors?.primary
                        ? `linear-gradient(to bottom, ${gameConfig.theme.colors.primary}30, ${gameConfig.theme.colors.secondary}30)`
                        : 'none',
                      borderRadius: '4px',
                      opacity: 0.7
                    }}
                  >
                    {Array(3).fill(0).map((_, i) => (
                      <div 
                        key={`deco-left-${i}`}
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: gameConfig.theme.colors?.primary
                            ? `${gameConfig.theme.colors.primary}50`
                            : 'rgba(255,255,255,0.1)',
                          boxShadow: `0 0 5px ${gameConfig.theme.colors?.primary || '#FFFFFF'}20`
                        }}
                      >
                        <span className="text-xs text-white text-opacity-80">{i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Right side decorative elements */}
                <div className="absolute right-2 top-1/3 z-20">
                  <div 
                    className="w-8 h-24 flex flex-col items-center justify-around"
                    style={{
                      background: gameConfig.theme.colors?.secondary
                        ? `linear-gradient(to bottom, ${gameConfig.theme.colors.secondary}30, ${gameConfig.theme.colors.primary}30)`
                        : 'none',
                      borderRadius: '4px',
                      opacity: 0.7
                    }}
                  >
                    {Array(3).fill(0).map((_, i) => (
                      <div 
                        key={`deco-right-${i}`}
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: gameConfig.theme.colors?.secondary
                            ? `${gameConfig.theme.colors.secondary}50`
                            : 'rgba(255,255,255,0.1)',
                          boxShadow: `0 0 5px ${gameConfig.theme.colors?.secondary || '#FFFFFF'}20`
                        }}
                      >
                        <span className="text-xs text-white text-opacity-80">{3-i}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
        
        {/* Effects Layer */}
        {(activeLayer === 'all' || activeLayer === 'effects') && (
          <div className="absolute inset-0 pointer-events-none z-30">
            {/* Theme-specific ambient effects */}
            {gameConfig.theme?.mainTheme && (
              <>
                {/* Different effects based on theme */}
                {(() => {
                  const theme = gameConfig.theme.mainTheme.toLowerCase();
                  const themeColors = gameConfig.theme.colors || { primary: '#4682B4', secondary: '#2F4F4F', accent: '#FF6347' };
                  
                  // Ancient Egypt theme effects
                  if (theme.includes('egypt')) {
                    return (
                      <div className="absolute inset-0">
                        {/* Dust particles */}
                        <div className="absolute inset-0 opacity-20">
                          {Array(15).fill(0).map((_, i) => (
                            <div 
                              key={`dust-${i}`}
                              className="absolute rounded-full"
                              style={{
                                width: `${2 + Math.random() * 5}px`,
                                height: `${2 + Math.random() * 5}px`,
                                backgroundColor: themeColors.primary || '#D4AF37',
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                opacity: 0.3 + Math.random() * 0.3,
                                animation: `float ${5 + Math.random() * 10}s linear infinite`,
                                animationDelay: `-${Math.random() * 10}s`
                              }}
                            ></div>
                          ))}
                        </div>
                        {/* Golden hieroglyphs */}
                        <div className="absolute inset-0 opacity-10">
                          {Array(3).fill(0).map((_, i) => (
                            <div 
                              key={`glyph-${i}`}
                              className="absolute text-2xl"
                              style={{
                                color: themeColors.accent || '#D4AF37',
                                top: `${20 + Math.random() * 60}%`,
                                left: `${20 + Math.random() * 60}%`,
                                opacity: 0.2 + Math.random() * 0.3,
                                transform: `rotate(${Math.random() * 360}deg) scale(${0.8 + Math.random() * 0.5})`,
                                textShadow: `0 0 10px ${themeColors.accent || '#D4AF37'}`
                              }}
                            >𓂀</div>
                          ))}
                        </div>
                        {/* Golden glow */}
                        <div 
                          className="absolute inset-0 opacity-10"
                          style={{
                            background: `radial-gradient(circle at center, ${themeColors.primary}30 0%, transparent 70%)`
                          }}
                        ></div>
                      </div>
                    );
                  }
                  
                  // Cosmic theme effects
                  else if (theme.includes('cosmic')) {
                    return (
                      <div className="absolute inset-0">
                        {/* Stars */}
                        <div className="absolute inset-0">
                          {Array(30).fill(0).map((_, i) => (
                            <div 
                              key={`star-${i}`}
                              className="absolute rounded-full"
                              style={{
                                width: `${1 + Math.random() * 3}px`,
                                height: `${1 + Math.random() * 3}px`,
                                backgroundColor: i % 5 === 0 ? themeColors.accent : 'white',
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                opacity: 0.3 + Math.random() * 0.7,
                                animation: `pulse ${1 + Math.random() * 5}s infinite`
                              }}
                            ></div>
                          ))}
                        </div>
                        {/* Distant planets */}
                        <div className="absolute inset-0">
                          {Array(2).fill(0).map((_, i) => {
                            const size = 30 + Math.random() * 50;
                            return (
                              <div 
                                key={`planet-${i}`}
                                className="absolute rounded-full"
                                style={{
                                  width: `${size}px`,
                                  height: `${size}px`,
                                  background: `radial-gradient(circle at ${40 + Math.random() * 20}% ${40 + Math.random() * 20}%, ${themeColors.secondary}90, ${themeColors.primary}40)`,
                                  top: `${Math.random() * 30}%`,
                                  left: `${70 + Math.random() * 20}%`,
                                  opacity: 0.2,
                                  boxShadow: `0 0 20px ${themeColors.secondary}30`
                                }}
                              ></div>
                            );
                          })}
                        </div>
                        {/* Nebula glow */}
                        <div 
                          className="absolute inset-0 opacity-20"
                          style={{
                            background: `radial-gradient(ellipse at top right, ${themeColors.secondary}30, transparent 70%)`
                          }}
                        ></div>
                      </div>
                    );
                  }
                  
                  // Enchanted Forest theme effects
                  else if (theme.includes('forest')) {
                    return (
                      <div className="absolute inset-0">
                        {/* Floating particles */}
                        <div className="absolute inset-0">
                          {Array(20).fill(0).map((_, i) => (
                            <div 
                              key={`particle-${i}`}
                              className="absolute rounded-full"
                              style={{
                                width: `${2 + Math.random() * 4}px`,
                                height: `${2 + Math.random() * 4}px`,
                                backgroundColor: i % 3 === 0 ? themeColors.accent : (i % 3 === 1 ? themeColors.primary : themeColors.secondary),
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                opacity: 0.2 + Math.random() * 0.3,
                                animation: `float ${3 + Math.random() * 7}s ease-in-out infinite`,
                                animationDelay: `-${Math.random() * 5}s`
                              }}
                            ></div>
                          ))}
                        </div>
                        {/* Magical butterflies */}
                        <div className="absolute inset-0">
                          {Array(3).fill(0).map((_, i) => (
                            <div 
                              key={`butterfly-${i}`}
                              className="absolute text-xs"
                              style={{
                                color: i % 2 === 0 ? themeColors.accent : themeColors.primary,
                                top: `${30 + Math.random() * 40}%`,
                                left: `${Math.random() * 80}%`,
                                opacity: 0.3 + Math.random() * 0.3,
                                animation: `float ${8 + Math.random() * 5}s ease-in-out infinite`,
                                animationDelay: `-${Math.random() * 8}s`,
                                filter: `blur(${Math.random()}px)`
                              }}
                            >🦋</div>
                          ))}
                        </div>
                        {/* Magical mist */}
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-1/4 opacity-20"
                          style={{
                            background: `linear-gradient(to top, ${themeColors.primary}30, transparent)`
                          }}
                        ></div>
                      </div>
                    );
                  }
                  
                  // Ocean theme effects
                  else if (theme.includes('ocean')) {
                    return (
                      <div className="absolute inset-0">
                        {/* Bubbles */}
                        <div className="absolute inset-0">
                          {Array(12).fill(0).map((_, i) => {
                            const size = 2 + Math.random() * 8;
                            const speed = 4 + Math.random() * 8;
                            return (
                              <div 
                                key={`bubble-${i}`}
                                className="absolute rounded-full"
                                style={{
                                  width: `${size}px`,
                                  height: `${size}px`,
                                  border: `1px solid ${themeColors.secondary}80`,
                                  top: `${50 + Math.random() * 50}%`,
                                  left: `${Math.random() * 100}%`,
                                  opacity: 0.2 + Math.random() * 0.4,
                                  animation: `float ${speed}s ease-in infinite`,
                                  animationDelay: `-${Math.random() * 5}s`,
                                  transform: 'translateY(0)',
                                  background: `radial-gradient(circle at 30% 30%, ${themeColors.secondary}10, transparent 70%)`
                                }}
                              ></div>
                            );
                          })}
                        </div>
                        {/* Small fish */}
                        <div className="absolute inset-0">
                          {Array(2).fill(0).map((_, i) => (
                            <div 
                              key={`fish-${i}`}
                              className="absolute text-xs"
                              style={{
                                color: i === 0 ? themeColors.accent : themeColors.primary,
                                top: `${30 + Math.random() * 40}%`,
                                left: `${Math.random() * 70}%`,
                                opacity: 0.3,
                                animation: `float ${15 + Math.random() * 10}s linear infinite`,
                                animationDirection: i % 2 === 0 ? 'alternate' : 'alternate-reverse',
                                transform: i % 2 === 0 ? 'scaleX(1)' : 'scaleX(-1)',
                                filter: `blur(${Math.random()}px)`
                              }}
                            >🐠</div>
                          ))}
                        </div>
                        {/* Underwater light rays */}
                        <div 
                          className="absolute inset-0 opacity-15"
                          style={{
                            background: `linear-gradient(135deg, ${themeColors.primary}20, transparent 70%)`
                          }}
                        ></div>
                      </div>
                    );
                  }
                  
                  // Western theme effects
                  else if (theme.includes('west')) {
                    return (
                      <div className="absolute inset-0">
                        {/* Dust particles */}
                        <div className="absolute inset-0">
                          {Array(10).fill(0).map((_, i) => (
                            <div 
                              key={`dust-${i}`}
                              className="absolute rounded-full"
                              style={{
                                width: `${1 + Math.random() * 3}px`,
                                height: `${1 + Math.random() * 3}px`,
                                backgroundColor: '#CD853F',
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                opacity: 0.2 + Math.random() * 0.2,
                                animation: `float ${7 + Math.random() * 8}s linear infinite`,
                                animationDelay: `-${Math.random() * 7}s`
                              }}
                            ></div>
                          ))}
                        </div>
                        {/* Tumbleweeds */}
                        <div className="absolute inset-0">
                          {Array(1).fill(0).map((_, i) => (
                            <div 
                              key={`tumbleweed-${i}`}
                              className="absolute text-sm opacity-20"
                              style={{
                                color: themeColors.secondary || '#8B4513',
                                top: `${80 + Math.random() * 10}%`,
                                left: `-5%`,
                                animation: `float 30s linear infinite`,
                                transform: `scale(${0.8 + Math.random() * 0.4}) rotate(${Math.random() * 360}deg)`
                              }}
                            >🌵</div>
                          ))}
                        </div>
                        {/* Heat waves */}
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-1/6 opacity-10"
                          style={{
                            background: `linear-gradient(to top, ${themeColors.secondary || '#8B4513'}30, transparent)`
                          }}
                        ></div>
                      </div>
                    );
                  }
                  
                  // Asian Dynasty theme effects
                  else if (theme.includes('asian') || theme.includes('dynasty')) {
                    return (
                      <div className="absolute inset-0">
                        {/* Cherry blossom petals */}
                        <div className="absolute inset-0">
                          {Array(15).fill(0).map((_, i) => (
                            <div 
                              key={`petal-${i}`}
                              className="absolute rounded-full"
                              style={{
                                width: `${4 + Math.random() * 4}px`,
                                height: `${4 + Math.random() * 4}px`,
                                backgroundColor: '#FFB7C5',
                                borderRadius: '50% 50% 0 50%',
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                opacity: 0.2 + Math.random() * 0.4,
                                animation: `float ${10 + Math.random() * 20}s linear infinite`,
                                animationDelay: `-${Math.random() * 10}s`,
                                transform: `rotate(${Math.random() * 360}deg)`
                              }}
                            ></div>
                          ))}
                        </div>
                        {/* Lantern glow */}
                        <div className="absolute top-10 right-10 opacity-30">
                          <div 
                            className="w-12 h-20 rounded-full"
                            style={{
                              background: `radial-gradient(circle, ${themeColors.accent || '#FF4500'}60, transparent)`,
                              boxShadow: `0 0 20px ${themeColors.accent || '#FF4500'}60`
                            }}
                          ></div>
                        </div>
                        {/* Ink wash effect */}
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1/5 opacity-15"
                          style={{
                            background: `linear-gradient(to left, ${themeColors.primary || '#000000'}30, transparent)`
                          }}
                        ></div>
                      </div>
                    );
                  }
                  
                  // Candy Land theme effects
                  else if (theme.includes('candy')) {
                    return (
                      <div className="absolute inset-0">
                        {/* Sugar particles */}
                        <div className="absolute inset-0">
                          {Array(25).fill(0).map((_, i) => (
                            <div 
                              key={`sugar-${i}`}
                              className="absolute rounded-full"
                              style={{
                                width: `${1 + Math.random() * 3}px`,
                                height: `${1 + Math.random() * 3}px`,
                                backgroundColor: [
                                  '#FF69B4', // Pink
                                  '#7DF9FF', // Blue
                                  '#FFFF00', // Yellow
                                  '#FF6347', // Red
                                  '#98FB98'  // Green
                                ][i % 5],
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                opacity: 0.4 + Math.random() * 0.4,
                                animation: `float ${5 + Math.random() * 10}s linear infinite`,
                                animationDelay: `-${Math.random() * 5}s`,
                                boxShadow: `0 0 2px rgba(255,255,255,0.8)`
                              }}
                            ></div>
                          ))}
                        </div>
                        {/* Candy swirl */}
                        <div 
                          className="absolute inset-0 opacity-10"
                          style={{
                            background: `repeating-conic-gradient(
                              ${themeColors.primary || '#FF69B4'}10 0deg 30deg, 
                              ${themeColors.secondary || '#7DF9FF'}10 30deg 60deg, 
                              ${themeColors.accent || '#FFFF00'}10 60deg 90deg
                            )`
                          }}
                        ></div>
                      </div>
                    );
                  }
                  
                  // Default subtle effects for other themes
                  return (
                    <div className="absolute inset-0 opacity-10">
                      {/* Generic ambient glow */}
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: gameConfig.theme?.colors?.primary 
                            ? `radial-gradient(circle at center, ${gameConfig.theme.colors.primary}30 0%, transparent 70%)`
                            : 'none'
                        }}
                      ></div>
                      
                      {/* Subtle particles */}
                      <div className="absolute inset-0">
                        {Array(8).fill(0).map((_, i) => (
                          <div 
                            key={`particle-${i}`}
                            className="absolute rounded-full"
                            style={{
                              width: `${1 + Math.random() * 2}px`,
                              height: `${1 + Math.random() * 2}px`,
                              backgroundColor: gameConfig.theme?.colors?.accent || '#FFFFFF',
                              top: `${Math.random() * 100}%`,
                              left: `${Math.random() * 100}%`,
                              opacity: 0.1 + Math.random() * 0.2,
                              animation: `pulse ${3 + Math.random() * 4}s infinite`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
            
            {/* Win effect - only show when element is selected or when playing */}
            {(selectedElement || isPlaying) && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                {/* Primary effect */}
                <div 
                  className="rounded-full animate-ping"
                  style={{
                    width: '100px',
                    height: '100px',
                    backgroundColor: gameConfig.theme?.colors?.primary ? 
                      `${gameConfig.theme.colors.primary}30` : 'rgba(255,210,0,0.2)'
                  }}
                ></div>
                
                {/* Secondary glow effect */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    animation: 'pulse 2s infinite',
                    background: gameConfig.theme?.colors?.accent 
                      ? `radial-gradient(circle, ${gameConfig.theme.colors.accent}30 30%, transparent 70%)`
                      : 'radial-gradient(circle, rgba(255,255,255,0.2) 30%, transparent 70%)'
                  }}
                ></div>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden border border-gray-700 rounded-lg bg-gradient-to-b from-gray-900 to-gray-800 ${className}`}
      style={{ width, height }}
      onContextMenu={handleContextMenu}
    >
      {/* Canvas controls overlay */}
      {editMode && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 bg-gray-800 bg-opacity-70 p-1 rounded-md">
          <button className="w-8 h-8 rounded hover:bg-gray-700 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8v8"></path>
              <path d="M8 12h8"></path>
            </svg>
          </button>
          <button className="w-8 h-8 rounded hover:bg-gray-700 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 12h8"></path>
            </svg>
          </button>
          <button className="w-8 h-8 rounded hover:bg-gray-700 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 15l6 6"></path>
              <path d="M21 15h-6v6"></path>
            </svg>
          </button>
        </div>
      )}
      
      {/* Main canvas area */}
      <div
        ref={canvasRef}
        className="absolute inset-0 overflow-hidden"
        style={{
          transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          cursor: isPanning ? 'grabbing' : (editMode ? 'default' : 'grab')
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {renderLayers()}
      </div>
      
      {/* Status indicator */}
      <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-md">
        {editMode ? 'Edit Mode' : 'View Mode'} | Zoom: {Math.round(zoom * 100)}% | Layer: {activeLayer}
      </div>
    </div>
  );
};

export default GameCanvas;