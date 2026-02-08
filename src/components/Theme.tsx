import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { 
  Palette, 
  Sparkles,
  Wand2,
  AlertCircle,
  Loader,
  Image,
  Music,
  Play,
  Info
} from 'lucide-react';
import clsx from 'clsx';
import ThemePreview from './ThemePreview';
import SymbolProcessor from './SymbolProcessor';

// Theme options
const themeOptions = [
  { 
    id: 'ancient-egypt', 
    name: 'Ancient Egypt', 
    description: 'Pyramids, pharaohs, and desert treasures',
    image: '/themes/ancient-egypt.png',
    mood: 'mysterious',
    colors: 'gold & sand'
  },
  { 
    id: 'enchanted-forest', 
    name: 'Enchanted Forest', 
    description: 'Magical woodland creatures and mystical trees',
    image: 'https://via.placeholder.com/250x400/4CAF50/FFFFFF?text=Enchanted+Forest',
    mood: 'whimsical',
    colors: 'greens & purple'
  },
  { 
    id: 'deep-sea', 
    name: 'Deep Sea Treasures', 
    description: 'Underwater adventure with mermaids and shipwrecks',
    image: 'https://via.placeholder.com/250x400/03A9F4/FFFFFF?text=Deep+Sea',
    mood: 'serene',
    colors: 'blues & aqua'
  },
  { 
    id: 'space-odyssey', 
    name: 'Space Odyssey', 
    description: 'Interstellar journey through galaxies',
    image: 'https://via.placeholder.com/250x400/673AB7/FFFFFF?text=Space+Odyssey',
    mood: 'futuristic',
    colors: 'purples & blue'
  }
];

// Art styles
const artStyles = [
  { id: 'realistic', name: 'Realistic', description: 'Detailed and true-to-life visuals' },
  { id: 'cartoon', name: 'Cartoon', description: 'Fun, animated style with bold outlines' },
  { id: '3d', name: '3D Rendered', description: 'Rich three-dimensional graphics' },
  { id: 'hand-drawn', name: 'Hand-Drawn', description: 'Artistic, sketched appearance' },
];

// Color schemes
const colorSchemes = [
  { id: 'vibrant', name: 'Vibrant', colors: ['#FF5733', '#33FF57', '#3357FF', '#FF33F5'] },
  { id: 'pastel', name: 'Pastel', colors: ['#FFB6C1', '#ADD8E6', '#98FB98', '#FFFACD'] },
  { id: 'dark', name: 'Dark', colors: ['#1A1A2E', '#16213E', '#0F3460', '#E94560'] },
  { id: 'retro', name: 'Retro', colors: ['#F8B195', '#F67280', '#C06C84', '#6C5B7B'] },
  { id: 'neon', name: 'Neon', colors: ['#FF00FF', '#00FFFF', '#FF00AA', '#AAFF00'] },
  { id: 'earthy', name: 'Earthy', colors: ['#A0522D', '#8B4513', '#CD853F', '#DEB887'] },
  { id: 'blackwhite', name: 'Black & White', colors: ['#000000', '#FFFFFF', '#333333', '#DDDDDD'] },
];

// Moods
const moods = ['Exciting', 'Mysterious', 'Luxurious', 'Playful', 'Adventurous', 'Serene', 'Epic'];

export const Theme: React.FC = () => {
  const { config, updateConfig, nextStep } = useGameStore();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blackAndWhiteMode, setBlackAndWhiteMode] = useState(false);
  const [currentThemeStep, setCurrentThemeStep] = useState(1); // 1: Theme Selection, 2: Art Style & Details

  const handleGenerate = async () => {
    if (!config.theme?.mainTheme) {
      setError('Please select a theme first');
      return;
    }

    if (!config.theme?.artStyle) {
      setError('Please select an art style first');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // Simulate API call with different placeholder images for variety
      const placeholderSymbols = [
        'https://via.placeholder.com/200/FF5733/FFFFFF',
        'https://via.placeholder.com/200/33FF57/FFFFFF',
        'https://via.placeholder.com/200/3357FF/FFFFFF',
        'https://via.placeholder.com/200/FF33F5/FFFFFF',
        'https://via.placeholder.com/200/33FFF5/FFFFFF',
        'https://via.placeholder.com/200/F5FF33/FFFFFF',
        'https://via.placeholder.com/200/FF3333/FFFFFF',
        'https://via.placeholder.com/200/33FF33/FFFFFF',
        'https://via.placeholder.com/200/3333FF/FFFFFF',
        'https://via.placeholder.com/200/FF33FF/FFFFFF',
        'https://via.placeholder.com/200/33FFFF/FFFFFF',
        'https://via.placeholder.com/200/FFFF33/FFFFFF'
      ];
      
      updateConfig({
        theme: {
          ...config.theme,
          generated: {
            background: 'https://via.placeholder.com/1920x1080/123456/FFFFFF',
            symbols: placeholderSymbols,
            frame: 'https://via.placeholder.com/800x600/654321/FFFFFF'
          }
        }
      });

      // Scroll to preview
      const previewElement = document.getElementById('theme-preview');
      if (previewElement) {
        previewElement.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      setError('Failed to generate theme assets');
    } finally {
      setGenerating(false);
    }
  };

  // Helper function to get symbol URLs from both array and object formats
  const getSymbolUrls = (symbols: string[] | Record<string, string> | undefined): string[] => {
    if (!symbols) return [];
    if (Array.isArray(symbols)) return symbols;
    return Object.values(symbols);
  };

  const handleRegenerateSymbol = async (index: number) => {
    if (!config.theme?.generated?.symbols) return;

    try {
      // Simulate regenerating a single symbol with a different color
      const colors = ['FF5733', '33FF57', '3357FF', 'FF33F5', '33FFF5', 'F5FF33'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const symbolUrls = getSymbolUrls(config.theme.generated.symbols);

      if (Array.isArray(config.theme.generated.symbols)) {
        // Legacy array format
        const newSymbols = [...config.theme.generated.symbols];
        newSymbols[index] = `https://via.placeholder.com/200/${randomColor}/FFFFFF`;

        updateConfig({
          theme: {
            ...config.theme,
            generated: {
              ...config.theme.generated,
              symbols: newSymbols
            }
          }
        });
      } else {
        // New object format - regenerate by key
        const symbolKeys = Object.keys(config.theme.generated.symbols);
        if (symbolKeys[index]) {
          const newSymbols = { ...config.theme.generated.symbols };
          newSymbols[symbolKeys[index]] = `https://via.placeholder.com/200/${randomColor}/FFFFFF`;

          updateConfig({
            theme: {
              ...config.theme,
              generated: {
                ...config.theme.generated,
                symbols: newSymbols
              }
            }
          });
        }
      }
    } catch (err) {
      setError(`Failed to regenerate symbol ${index + 1}`);
    }
  };

  // Go to next theme step (from theme selection to art style)
  const handleContinueToArtStyle = () => {
    if (!config.theme?.mainTheme) {
      setError('Please select a theme first');
      return;
    }
    setError(null);
    setCurrentThemeStep(2);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Log when theme component mounts for debugging
  useEffect(() => {
    console.log("Theme component mounted with options:", themeOptions);
  }, []);

  return (
    <div className="space-y-8">
      {/* Step 1: Theme Selection */}
      {currentThemeStep === 1 && (
        <>
          <div className="bg-white rounded-lg p-6 border border-[#DFE1E6] shadow-sm">
            <h3 className="text-xl font-semibold text-blue-600 mb-4">Choose Your Game Theme</h3>
            
            {/* Help text */}
            <div className="flex items-center gap-2 mb-4 bg-blue-50 p-3 rounded-lg text-blue-700">
              <Info className="w-5 h-5" />
              <p className="text-sm">Select a theme to customize your slot game</p>
            </div>
            
            {/* HORIZONTAL SCROLLING THEME CARDS */}
            <div className="relative">
              {/* Scroll indicator */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-white to-transparent w-16 h-full rounded-r-lg z-10 flex items-center justify-end pr-2 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 animate-pulse">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
              <div className="overflow-x-auto pb-4 scroll-smooth" style={{ marginBottom: '20px', WebkitOverflowScrolling: 'touch' }}>
                <div className="flex gap-6 pl-2 pr-16" style={{ minWidth: 'min-content' }}>
                  {themeOptions.map((theme) => (
                  <div
                    key={theme.id}
                    onClick={() => updateConfig({
                      theme: {
                        ...config.theme,
                        mainTheme: theme.name,
                        description: theme.description,
                        mood: theme.mood
                      }
                    })}
                    className={clsx(
                      'relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all flex-shrink-0',
                      'w-[300px]', // Fixed width
                      'h-[500px]', // Fixed height
                      config.theme?.mainTheme === theme.name
                        ? 'border-blue-600 shadow-lg ring-2 ring-blue-300'
                        : 'border-gray-200 hover:border-gray-400'
                    )}
                  >
                    <img
                      src={theme.image}
                      alt={theme.name}
                      className="w-full h-[350px] object-cover border-8 border-red-500"
                    />
                    <div className="p-4">
                      <h3 className="text-black font-semibold mb-2">{theme.name}</h3>
                      <p className="text-gray-800 text-sm mb-3">{theme.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                          {theme.mood}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">
                          {theme.colors}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>
            
            {/* Hide scrollbar but keep scrolling functionality */}
            <style>
              {`
                /* Hide scrollbar in all browsers */
                .overflow-x-auto::-webkit-scrollbar {
                  display: none;
                }
                .overflow-x-auto {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}
            </style>
          </div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <button
              onClick={handleContinueToArtStyle}
              disabled={!config.theme?.mainTheme}
              className={clsx(
                'px-8 py-4 rounded-lg flex items-center gap-3 transition-all duration-200 text-lg',
                !config.theme?.mainTheme
                  ? 'bg-[#DFE1E6] text-[#5E6C84] cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
              )}
            >
              Continue to Art Style
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 ml-1">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </>
      )}

      {/* Step 2: Art Style & Details */}
      {currentThemeStep === 2 && (
        <>
          {/* Back button */}
          <button 
            onClick={() => setCurrentThemeStep(1)}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            Back to Theme Selection
          </button>
          
          <div className="bg-white rounded-lg p-6 border border-blue-100 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold text-blue-600">Selected Theme: </h3>
              <span className="font-bold">{config.theme?.mainTheme}</span>
            </div>
            <p className="text-gray-700">{config.theme?.description}</p>
          </div>

          {/* Art Style */}
          <div className="bg-white rounded-lg p-6 border border-[#DFE1E6] shadow-sm">
            <h3 className="text-xl font-semibold text-blue-600 mb-4">Choose Your Art Style</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {artStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => updateConfig({
                    theme: {
                      ...config.theme,
                      artStyle: style.id as any
                    }
                  })}
                  className={clsx(
                    'p-4 rounded-lg border-2 transition-all duration-200 aspect-[3/2]',
                    config.theme?.artStyle === style.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                      : 'bg-white border-gray-200 text-gray-800 hover:border-blue-300'
                  )}
                >
                  <h4 className="font-medium mb-1">{style.name}</h4>
                  <p className="text-sm opacity-80">{style.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div className="bg-white rounded-lg p-6 border border-[#DFE1E6] shadow-sm mt-8">
            <h3 className="text-xl font-semibold text-blue-600 mb-4">Color Scheme</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => updateConfig({
                    theme: {
                      ...config.theme,
                      colorScheme: scheme.id
                    }
                  })}
                  className={clsx(
                    'p-4 rounded-lg border-2 transition-all duration-200',
                    config.theme?.colorScheme === scheme.id
                      ? 'border-blue-600 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300'
                  )}
                >
                  <div className="flex flex-wrap gap-1 mb-3">
                    {scheme.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{scheme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="bg-white rounded-lg p-6 border border-[#DFE1E6] shadow-sm mt-8">
            <h3 className="text-xl font-semibold text-blue-600 mb-4">Mood</h3>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <button
                  key={mood}
                  onClick={() => updateConfig({
                    theme: {
                      ...config.theme,
                      mood: mood.toLowerCase()
                    }
                  })}
                  className={clsx(
                    'px-4 py-2 rounded-full transition-all duration-200',
                    config.theme?.mood === mood.toLowerCase()
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  )}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleGenerate}
              disabled={generating || !config.theme?.mainTheme || !config.theme?.artStyle}
              className={clsx(
                'px-8 py-4 rounded-lg flex items-center gap-3 transition-all duration-200 text-lg',
                generating || !config.theme?.mainTheme || !config.theme?.artStyle
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
              )}
            >
              {generating ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  Generating Theme...
                </>
              ) : (
                <>
                  <Wand2 className="w-6 h-6" />
                  Generate Theme Assets
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Theme Preview and Symbols - shown when generated */}
      {config.theme?.generated && (
        <div id="theme-preview" className="bg-white rounded-lg p-6 border border-[#DFE1E6] shadow-sm space-y-8 mt-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-blue-600">Theme Preview</h3>
              <button
                onClick={() => setBlackAndWhiteMode(!blackAndWhiteMode)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  blackAndWhiteMode 
                    ? "bg-gray-800 text-white hover:bg-gray-700" 
                    : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                <Palette className="w-5 h-5" />
                {blackAndWhiteMode ? "Color Mode" : "Black & White Mode"}
              </button>
            </div>
            <ThemePreview
              background={config.theme.generated.background}
              symbols={getSymbolUrls(config.theme.generated.symbols)}
              frame={config.theme.generated.frame}
              gridSize={{ rows: 3, cols: 5 }}
              blackAndWhiteMode={blackAndWhiteMode}
            />
          </div>

          {config.theme.generated.symbols && (
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Game Symbols</h3>
              <div
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4"
                style={{ filter: blackAndWhiteMode ? 'grayscale(100%)' : 'none' }}
              >
                {getSymbolUrls(config.theme.generated.symbols).map((symbol, index) => (
                  <SymbolProcessor
                    key={index}
                    symbol={symbol}
                    onRegenerate={() => handleRegenerateSymbol(index)}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Continue to next step button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={nextStep}
              className="px-8 py-4 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition-all duration-200 text-lg"
            >
              Continue to Game Mechanics
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};