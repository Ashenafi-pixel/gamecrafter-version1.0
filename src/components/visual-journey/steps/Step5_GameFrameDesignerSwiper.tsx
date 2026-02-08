import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Frame,
  Paintbrush,
  Wand2,
  RefreshCw,
  CheckCircle,
  Loader,
  Sparkles,
  ImageIcon,
  Palette,
  Settings,
  Smartphone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { detectThemeCategory, getMockupAsset } from '../../../utils/mockupService';

// Import Swiper components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

// Define types for frame generation
interface FrameConfig {
  path: string | null;
  style: FrameStyle;
  material: FrameMaterial;
  decoration: FrameDecoration;
  isGenerating?: boolean;
  progress?: number;
}

type FrameStyle = 
  | 'Same as Symbols' 
  | 'Cartoon' 
  | 'Realistic' 
  | 'Cute' 
  | 'Dark' 
  | 'Neon' 
  | 'Futuristic' 
  | 'Minimal';

type FrameMaterial = 
  | 'Metallic' 
  | 'Wood' 
  | 'Glass' 
  | 'Soft' 
  | 'Organic' 
  | 'Neon';

type FrameDecoration = 
  | 'None' 
  | 'Minimal' 
  | 'Ornate' 
  | 'Floral' 
  | 'Geometric' 
  | 'Art Deco' 
  | 'Grunge' 
  | 'Classic';

// Component for the frame style selection carousel
const StyleCarousel: React.FC<{
  options: Array<{ id: FrameStyle, name: string, image: string }>;
  selected: FrameStyle;
  onChange: (style: FrameStyle) => void;
}> = ({ options, selected, onChange }) => {
  // Find the index of the currently selected style
  const selectedIndex = options.findIndex(option => option.id === selected);
  const swiperRef = useRef<SwiperInstance | null>(null);
  
  return (
    <div className="relative w-full">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          // Initially slide to selected index
          if (selectedIndex > 0) {
            swiper.slideTo(selectedIndex, 0);
          }
        }}
        slidesPerView={1.5}
        centeredSlides={true}
        spaceBetween={15}
        loop={true}
        modules={[Navigation, Pagination]}
        navigation={{
          prevEl: '.style-prev-button',
          nextEl: '.style-next-button',
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        onSlideChange={(swiper) => {
          const currentIndex = swiper.realIndex;
          onChange(options[currentIndex].id);
        }}
        className="w-full h-[400px]"
      >
        {options.map((style) => (
          <SwiperSlide key={style.id}>
            <div 
              className={`
                h-full rounded-lg overflow-hidden transition-all duration-300 
                ${style.id === selected ? 'ring-4 ring-blue-500 scale-[1.02]' : 'opacity-70'}
              `}
              onClick={() => onChange(style.id)}
            >
              <div className="relative h-full">
                {/* Example image fallback if path doesn't load */}
                <div className="absolute inset-0 bg-gray-200 flex justify-center items-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
                
                {/* Actual image */}
                <img 
                  src={style.image} 
                  alt={style.name}
                  className="w-full h-full object-cover"
                  onLoad={(e) => console.log(`Style image loaded: ${style.name}`)}
                  onError={(e) => console.error(`Style image error: ${style.name}`, e)}
                />
                
                {/* Overlay and label */}
                <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-60 p-3">
                  <h3 className="text-white text-lg font-semibold">{style.name}</h3>
                </div>
                
                {/* Selected indicator */}
                {style.id === selected && (
                  <div className="absolute top-3 right-3 bg-blue-500 text-white p-1 rounded-full">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Custom navigation buttons */}
      <button 
        className="style-prev-button absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-r-lg z-10"
        onClick={() => swiperRef.current?.slidePrev()}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button 
        className="style-next-button absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-l-lg z-10"
        onClick={() => swiperRef.current?.slideNext()}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

// Component for the material selection carousel
const MaterialCarousel: React.FC<{
  options: Array<{ id: FrameMaterial, name: string, image: string }>;
  selected: FrameMaterial;
  onChange: (material: FrameMaterial) => void;
}> = ({ options, selected, onChange }) => {
  // Find the index of the currently selected material
  const selectedIndex = options.findIndex(option => option.id === selected);
  const swiperRef = useRef<SwiperInstance | null>(null);
  
  return (
    <div className="relative w-full">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          // Initially slide to selected index
          if (selectedIndex > 0) {
            swiper.slideTo(selectedIndex, 0);
          }
        }}
        slidesPerView={1.5}
        centeredSlides={true}
        spaceBetween={15}
        loop={true}
        modules={[Navigation, Pagination]}
        navigation={{
          prevEl: '.material-prev-button',
          nextEl: '.material-next-button',
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        onSlideChange={(swiper) => {
          const currentIndex = swiper.realIndex;
          onChange(options[currentIndex].id);
        }}
        className="w-full h-[400px]"
      >
        {options.map((material) => (
          <SwiperSlide key={material.id}>
            <div 
              className={`
                h-full rounded-lg overflow-hidden transition-all duration-300 
                ${material.id === selected ? 'ring-4 ring-blue-500 scale-[1.02]' : 'opacity-70'}
              `}
              onClick={() => onChange(material.id)}
            >
              <div className="relative h-full">
                {/* Example image fallback if path doesn't load */}
                <div className="absolute inset-0 bg-gray-200 flex justify-center items-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
                
                {/* Actual image */}
                <img 
                  src={material.image} 
                  alt={material.name}
                  className="w-full h-full object-cover"
                  onLoad={(e) => console.log(`Material image loaded: ${material.name}`)}
                  onError={(e) => console.error(`Material image error: ${material.name}`, e)}
                />
                
                {/* Overlay and label */}
                <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-60 p-3">
                  <h3 className="text-white text-lg font-semibold">{material.name}</h3>
                </div>
                
                {/* Selected indicator */}
                {material.id === selected && (
                  <div className="absolute top-3 right-3 bg-blue-500 text-white p-1 rounded-full">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Custom navigation buttons */}
      <button 
        className="material-prev-button absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-r-lg z-10"
        onClick={() => swiperRef.current?.slidePrev()}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button 
        className="material-next-button absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-l-lg z-10"
        onClick={() => swiperRef.current?.slideNext()}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

// Component for the decoration selection carousel
const DecorationCarousel: React.FC<{
  options: Array<{ id: FrameDecoration, name: string, image: string }>;
  selected: FrameDecoration;
  onChange: (decoration: FrameDecoration) => void;
}> = ({ options, selected, onChange }) => {
  // Find the index of the currently selected decoration
  const selectedIndex = options.findIndex(option => option.id === selected);
  const swiperRef = useRef<SwiperInstance | null>(null);
  
  return (
    <div className="relative w-full">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          // Initially slide to selected index
          if (selectedIndex > 0) {
            swiper.slideTo(selectedIndex, 0);
          }
        }}
        slidesPerView={1.5}
        centeredSlides={true}
        spaceBetween={15}
        loop={true}
        modules={[Navigation, Pagination]}
        navigation={{
          prevEl: '.decoration-prev-button',
          nextEl: '.decoration-next-button',
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        onSlideChange={(swiper) => {
          const currentIndex = swiper.realIndex;
          onChange(options[currentIndex].id);
        }}
        className="w-full h-[400px]"
      >
        {options.map((decoration) => (
          <SwiperSlide key={decoration.id}>
            <div 
              className={`
                h-full rounded-lg overflow-hidden transition-all duration-300 
                ${decoration.id === selected ? 'ring-4 ring-blue-500 scale-[1.02]' : 'opacity-70'}
              `}
              onClick={() => onChange(decoration.id)}
            >
              <div className="relative h-full">
                {/* Example image fallback if path doesn't load */}
                <div className="absolute inset-0 bg-gray-200 flex justify-center items-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
                
                {/* Actual image */}
                <img 
                  src={decoration.image} 
                  alt={decoration.name}
                  className="w-full h-full object-cover"
                  onLoad={(e) => console.log(`Decoration image loaded: ${decoration.name}`)}
                  onError={(e) => console.error(`Decoration image error: ${decoration.name}`, e)}
                />
                
                {/* Overlay and label */}
                <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-60 p-3">
                  <h3 className="text-white text-lg font-semibold">{decoration.name}</h3>
                </div>
                
                {/* Selected indicator */}
                {decoration.id === selected && (
                  <div className="absolute top-3 right-3 bg-blue-500 text-white p-1 rounded-full">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Custom navigation buttons */}
      <button 
        className="decoration-prev-button absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-r-lg z-10"
        onClick={() => swiperRef.current?.slidePrev()}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button 
        className="decoration-next-button absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-l-lg z-10"
        onClick={() => swiperRef.current?.slideNext()}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

// Main component
const Step5_GameFrameDesigner: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const [frameConfig, setFrameConfig] = useState<FrameConfig>({
    path: null,
    style: 'Same as Symbols',
    material: 'Metallic',
    decoration: 'Minimal',
  });
  const [currentView, setCurrentView] = useState<'frame-type' | 'frame-design'>('frame-type');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [mockupPath, setMockupPath] = useState<string | null>(null);
  
  // Style options with examples
  const styleOptions = [
    { id: 'Same as Symbols' as FrameStyle, name: 'Same as Symbols', image: `/assets/frames/styles/same-as-symbols.png` },
    { id: 'Cartoon' as FrameStyle, name: 'Cartoon', image: `/assets/frames/styles/cartoon.png` },
    { id: 'Realistic' as FrameStyle, name: 'Realistic', image: `/assets/frames/styles/realistic.png` },
    { id: 'Dark' as FrameStyle, name: 'Dark', image: `/assets/frames/styles/dark.png` },
    { id: 'Minimal' as FrameStyle, name: 'Minimal', image: `/assets/frames/styles/minimal.png` },
    // Add more options as needed
  ];
  
  // Material options with examples  
  const materialOptions = [
    { id: 'Metallic' as FrameMaterial, name: 'Metallic', image: `/assets/frames/materials/metallic.png` },
    { id: 'Wood' as FrameMaterial, name: 'Wood', image: `/assets/frames/materials/wood.png` },
    { id: 'Glass' as FrameMaterial, name: 'Glass', image: `/assets/frames/materials/glass.png` },
    { id: 'Soft' as FrameMaterial, name: 'Soft', image: `/assets/frames/materials/soft.png` },
    // Add more options as needed
  ];
  
  // Decoration options with examples
  const decorationOptions = [
    { id: 'None' as FrameDecoration, name: 'None', image: `/assets/frames/decorations/none.png` },
    { id: 'Minimal' as FrameDecoration, name: 'Minimal', image: `/assets/frames/decorations/minimal.png` },
    { id: 'Ornate' as FrameDecoration, name: 'Ornate', image: `/assets/frames/decorations/ornate.png` },
    { id: 'Geometric' as FrameDecoration, name: 'Geometric', image: `/assets/frames/decorations/geometric.png` },
    // Add more options as needed
  ];
  
  // Log carousel options to debug
  useEffect(() => {
    console.log('Frame carousel options:', {
      styles: styleOptions,
      materials: materialOptions,
      decorations: decorationOptions
    });
  }, []);
  
  // Attempt to load mockup frame if available
  useEffect(() => {
    if (config?.theme) {
      const themeCategory = detectThemeCategory(config.theme);
      const mockupFramePath = getMockupAsset(themeCategory, 'frames', 'frame');
      
      if (mockupFramePath) {
        setMockupPath(mockupFramePath);
        console.log('Loaded mockup frame:', mockupFramePath);
      } else {
        console.log('No mockup frame available for theme:', config.theme);
      }
    }
  }, [config?.theme]);
  
  // Simulate frame generation
  const generateFrame = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            // Save the frame configuration
            const newConfig = {
              ...frameConfig,
              path: mockupPath || '/assets/frames/default-frame.png'
            };
            setFrameConfig(newConfig);
            updateConfig({ 
              frame: newConfig.path,
              frameStyle: newConfig.style,
              frameMaterial: newConfig.material,
              frameDecoration: newConfig.decoration
            });
          }, 500);
          return 100;
        }
        return next;
      });
    }, 500);
  };
  
  // Handle style change
  const handleStyleChange = (style: FrameStyle) => {
    setFrameConfig(prev => ({ ...prev, style }));
  };
  
  // Handle material change
  const handleMaterialChange = (material: FrameMaterial) => {
    setFrameConfig(prev => ({ ...prev, material }));
  };
  
  // Handle decoration change
  const handleDecorationChange = (decoration: FrameDecoration) => {
    setFrameConfig(prev => ({ ...prev, decoration }));
  };
  
  return (
    <div className="step-container">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          <Frame className="w-6 h-6 mr-2 text-blue-500" />
          <h1 className="text-2xl font-bold">Game Frame Designer</h1>
        </div>
        
        {/* Frame design view */}
        <AnimatePresence mode="wait">
          {currentView === 'frame-type' ? (
            <motion.div
              key="frame-type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h2 className="text-xl font-bold mb-6 text-center">Choose Your Frame Type</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Use Existing Frame */}
                <div 
                  className={`
                    p-6 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all
                    ${mockupPath ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                  `}
                  onClick={() => setCurrentView('frame-design')}
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {mockupPath ? (
                        <img 
                          src={mockupPath} 
                          alt="Theme Frame"
                          className="w-full h-full object-contain" 
                        />
                      ) : (
                        <Frame className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-2">
                    {mockupPath ? 'Use Theme Frame' : 'No Theme Frame'}
                  </h3>
                  <p className="text-center text-gray-600 text-sm">
                    {mockupPath 
                      ? 'Use the frame provided with your selected theme' 
                      : 'Your selected theme does not include a frame'}
                  </p>
                </div>
                
                {/* Generate Custom Frame */}
                <div 
                  className="p-6 rounded-lg border-2 border-blue-500 bg-blue-50 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setCurrentView('frame-design')}
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                      <Sparkles className="w-12 h-12" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-2">
                    Generate Custom Frame
                  </h3>
                  <p className="text-center text-gray-600 text-sm">
                    Create a unique frame for your slot machine
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="frame-design"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-8">
                <button 
                  className="flex items-center text-blue-500 hover:text-blue-700"
                  onClick={() => setCurrentView('frame-type')}
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Back
                </button>
                <h2 className="text-xl font-bold">Design Your Frame</h2>
                <div className="w-20"></div> {/* Spacer to center the heading */}
              </div>
              
              {/* Design options */}
              <div className="space-y-10">
                {/* Style selection */}
                <div>
                  <div className="flex items-center mb-4">
                    <Palette className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold">Frame Style</h3>
                  </div>
                  <StyleCarousel 
                    options={styleOptions}
                    selected={frameConfig.style}
                    onChange={handleStyleChange}
                  />
                </div>
                
                {/* Material selection */}
                <div>
                  <div className="flex items-center mb-4">
                    <Paintbrush className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold">Frame Material</h3>
                  </div>
                  <MaterialCarousel 
                    options={materialOptions}
                    selected={frameConfig.material}
                    onChange={handleMaterialChange}
                  />
                </div>
                
                {/* Decoration selection */}
                <div>
                  <div className="flex items-center mb-4">
                    <Wand2 className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold">Frame Decoration</h3>
                  </div>
                  <DecorationCarousel 
                    options={decorationOptions}
                    selected={frameConfig.decoration}
                    onChange={handleDecorationChange}
                  />
                </div>
                
                {/* Generate button */}
                <div className="mt-10">
                  <button
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={generateFrame}
                    disabled={isGenerating}
                  >
                    <div className="flex items-center justify-center">
                      {isGenerating ? (
                        <>
                          <Loader className="w-5 h-5 mr-2 animate-spin" />
                          <span>Generating Frame... {Math.round(generationProgress)}%</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          <span>Generate Frame</span>
                        </>
                      )}
                    </div>
                  </button>
                  
                  {/* Progress bar */}
                  {isGenerating && (
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-4">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Step5_GameFrameDesigner;