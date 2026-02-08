import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../store';
import { 
  Palette, 
  Move, 
  Frame, 
  Layers, 
  Maximize,
  Minimize,
  Square,
  Plus,
  Check,
  Undo,
  Download,
  Image 
} from 'lucide-react';

// Import Swiper components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, FreeMode, Mousewheel } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';

// Direct image imports
import minimalDecoration from '../../../assets/frames/decorations/minimal.png';
import decoratedDecoration from '../../../assets/frames/decorations/decorated.png';
import cartoonStyle from '../../../assets/frames/styles/cartoon.png';
import darkStyle from '../../../assets/frames/styles/dark.png';
import realisticStyle from '../../../assets/frames/styles/realistic.png';
import sameAsSymbolsStyle from '../../../assets/frames/styles/same-as-symbols.png';

const GameFrameDesignerWithSwiper: React.FC = () => {
  // Simple component state
  const [activeTab, setActiveTab] = useState('basic');
  const [showDecorationDetails, setShowDecorationDetails] = useState(false);
  const [showStyleDetails, setShowStyleDetails] = useState(false);
  const [selectedDecoration, setSelectedDecoration] = useState('minimal');
  const [selectedStyle, setSelectedStyle] = useState('cartoon');
  
  // Decoration and style options
  const decorationOptions = [
    { id: 'minimal', name: 'Minimal', image: minimalDecoration },
    { id: 'decorated', name: 'Decorated', image: decoratedDecoration }
  ];
  
  const styleOptions = [
    { id: 'cartoon', name: 'Cartoon', image: cartoonStyle },
    { id: 'dark', name: 'Dark', image: darkStyle },
    { id: 'realistic', name: 'Realistic', image: realisticStyle },
    { id: 'same-as-symbols', name: 'Same as Symbols', image: sameAsSymbolsStyle }
  ];
  
  // Refs for Swiper instances
  const decorationSwiperRef = useRef<any>(null);
  const styleSwiperRef = useRef<any>(null);
  
  // Handle decoration selection
  const handleDecorationSelect = (decorationId: string) => {
    setSelectedDecoration(decorationId);
    console.log(`Selected decoration: ${decorationId}`);
  };
  
  // Handle style selection
  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    console.log(`Selected style: ${styleId}`);
  };
  
  // Log image imports to debug
  useEffect(() => {
    console.log('Image imports:', {
      minimalDecoration,
      decoratedDecoration,
      cartoonStyle,
      darkStyle,
      realisticStyle,
      sameAsSymbolsStyle
    });
  }, []);
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Game Frame Designer (Swiper Edition)</h2>
      
      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button 
          className={`px-4 py-2 ${activeTab === 'basic' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600'}`}
          onClick={() => setActiveTab('basic')}
        >
          Basic Settings
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'advanced' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600'}`}
          onClick={() => setActiveTab('advanced')}
        >
          Advanced Settings
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'generate' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600'}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate Frame
        </button>
      </div>
      
      {/* Basic Settings Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Frame Basics</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Border Width</label>
              <input 
                type="range" 
                min="0" 
                max="20" 
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Border Radius</label>
              <input 
                type="range" 
                min="0" 
                max="20" 
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Border Color</label>
              <input 
                type="color" 
                className="w-full h-10 rounded border" 
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Advanced Settings Tab */}
      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Advanced Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input type="checkbox" id="transparentBg" className="mr-2" />
              <label htmlFor="transparentBg">Transparent Background</label>
            </div>
            
            <div className="flex items-center">
              <input type="checkbox" id="enableShadow" className="mr-2" />
              <label htmlFor="enableShadow">Enable Shadow</label>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Shadow Blur</label>
              <input 
                type="range" 
                min="0" 
                max="20" 
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Generate Frame Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Generate Custom Frame</h3>
          
          {/* Decoration Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Frame Decoration</h4>
              <button 
                className="text-blue-500 text-sm"
                onClick={() => setShowDecorationDetails(!showDecorationDetails)}
              >
                {showDecorationDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            {/* Decoration Swiper */}
            <div className="mb-6">
              <Swiper
                ref={decorationSwiperRef}
                slidesPerView={'auto'}
                spaceBetween={20}
                centeredSlides={false}
                grabCursor={true}
                freeMode={{
                  enabled: true,
                  sticky: true,
                }}
                mousewheel={true}
                pagination={{ 
                  clickable: true,
                  dynamicBullets: true
                }}
                modules={[FreeMode, Mousewheel, Pagination]}
                className="decoration-swiper"
                style={{ 
                  width: '100%',
                  paddingBottom: '30px'
                }}
              >
                {decorationOptions.map(decoration => (
                  <SwiperSlide 
                    key={decoration.id}
                    style={{ width: '200px' }}
                  >
                    <div 
                      className={`p-2 border rounded-lg cursor-pointer transition-all
                        ${selectedDecoration === decoration.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                      `}
                      onClick={() => handleDecorationSelect(decoration.id)}
                    >
                      <p className="text-sm font-medium mb-2 text-center">{decoration.name}</p>
                      <div className="w-full h-[200px] bg-white flex items-center justify-center relative">
                        <img 
                          src={decoration.image} 
                          alt={decoration.name} 
                          className="max-w-full max-h-full object-contain"
                          onLoad={() => console.log(`${decoration.name} decoration image loaded`)}
                          onError={(e) => console.error(`${decoration.name} decoration image error:`, e)}
                        />
                        
                        {selectedDecoration === decoration.id && (
                          <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1 rounded-full">
                            <Check size={16} />
                          </div>
                        )}
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            
            {/* Decoration Details */}
            {showDecorationDetails && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h5 className="font-medium mb-2">About {decorationOptions.find(d => d.id === selectedDecoration)?.name} Decoration</h5>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedDecoration === 'minimal' ? 
                    'A clean, simple frame with minimal ornamentation for a modern look.' : 
                    'An ornate frame with detailed decorations for a premium feel.'}
                </p>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Best for: </span>
                  {selectedDecoration === 'minimal' ? 
                    'Modern or minimalist themes, clean interfaces.' : 
                    'Luxury or classic themes, traditional games.'}
                </div>
              </div>
            )}
            
            {/* Style Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Frame Style</h4>
                <button 
                  className="text-blue-500 text-sm"
                  onClick={() => setShowStyleDetails(!showStyleDetails)}
                >
                  {showStyleDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              {/* Style Swiper */}
              <div className="mb-6">
                <Swiper
                  ref={styleSwiperRef}
                  slidesPerView={'auto'}
                  spaceBetween={20}
                  centeredSlides={false}
                  grabCursor={true}
                  freeMode={{
                    enabled: true,
                    sticky: true,
                  }}
                  mousewheel={true}
                  pagination={{ 
                    clickable: true,
                    dynamicBullets: true
                  }}
                  modules={[FreeMode, Mousewheel, Pagination]}
                  className="style-swiper"
                  style={{ 
                    width: '100%',
                    paddingBottom: '30px'
                  }}
                >
                  {styleOptions.map(style => (
                    <SwiperSlide 
                      key={style.id}
                      style={{ width: '200px' }}
                    >
                      <div 
                        className={`p-2 border rounded-lg cursor-pointer transition-all
                          ${selectedStyle === style.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                        `}
                        onClick={() => handleStyleSelect(style.id)}
                      >
                        <p className="text-sm font-medium mb-2 text-center">{style.name}</p>
                        <div className="w-full h-[200px] bg-white flex items-center justify-center relative">
                          <img 
                            src={style.image} 
                            alt={style.name} 
                            className="max-w-full max-h-full object-contain"
                            onLoad={() => console.log(`${style.name} style image loaded`)}
                            onError={(e) => console.error(`${style.name} style image error:`, e)}
                          />
                          
                          {selectedStyle === style.id && (
                            <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1 rounded-full">
                              <Check size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
              
              {/* Style Details */}
              {showStyleDetails && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h5 className="font-medium mb-2">About {styleOptions.find(s => s.id === selectedStyle)?.name} Style</h5>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedStyle === 'cartoon' ? 'Playful, vibrant style with bold outlines and bright colors.' : 
                     selectedStyle === 'dark' ? 'Rich, dramatic look with dark tones and subtle highlights.' : 
                     selectedStyle === 'realistic' ? 'Highly detailed, photorealistic textures and lighting effects.' : 
                     'Matched to your symbol style for a cohesive game appearance.'}
                  </p>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Best for: </span>
                    {selectedStyle === 'cartoon' ? 'Casual games, family-friendly themes.' : 
                     selectedStyle === 'dark' ? 'Mystery, adventure, or high-stakes games.' : 
                     selectedStyle === 'realistic' ? 'Premium games with immersive experiences.' : 
                     'Ensuring visual consistency throughout your game.'}
                  </div>
                </div>
              )}
            </div>
            
            {/* Generate Button */}
            <div className="mt-6">
              <button className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
                <div className="flex items-center justify-center">
                  <Image size={18} className="mr-2" />
                  Generate Custom Frame
                </div>
              </button>
              
              <p className="text-sm text-gray-500 mt-2 text-center">
                This will generate a custom frame based on your selections
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Preview Panel */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <div className="w-full aspect-video bg-gray-100 rounded flex items-center justify-center">
          <div className="text-gray-400">Frame preview will appear here</div>
        </div>
      </div>
    </div>
  );
};

export default GameFrameDesignerWithSwiper;