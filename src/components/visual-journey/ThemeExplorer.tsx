import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shuffle } from 'lucide-react';
import { useGameStore } from '../../store';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, FreeMode, Mousewheel, Autoplay } from 'swiper/modules';
import BezierEasing from 'bezier-easing';
import ColorCustomizer from './ColorCustomizer';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import { ColorSet, ThemeConfig } from '../../types';

// Theme definitions
const themeOptions = [
  {
    id: 'ancient-egypt',
    name: 'Ancient Egypt',
    description: 'Explore the treasures of pharaohs and pyramids',
    colors: {
      primary: '#D4AF37',
      secondary: '#1E3F66',
      accent: '#BA0020',
      background: '#F2D2A9'
    },
    keywords: ['pyramids', 'pharaoh', 'hieroglyphs', 'sphinx', 'gold', 'desert'],
    symbolIdeas: ['scarab', 'ankh', 'eye of horus', 'mummy', 'pyramid', 'pharaoh mask'],
    previewImage: '/themes/ancient-egypt.png',
    moodImage: 'https://placehold.co/600x400/F2D2A9/000000/png?text=Ancient+Egypt'
  },
  {
    id: 'cosmic-adventure',
    name: 'Cosmic Adventure',
    description: 'Journey through space with galaxies and nebulae',
    colors: {
      primary: '#6A0DAD',
      secondary: '#00BFFF',
      accent: '#FF4500',
      background: '#0A0A2A'
    },
    keywords: ['space', 'planets', 'galaxies', 'astronauts', 'stars', 'cosmic'],
    symbolIdeas: ['planet', 'rocket', 'astronaut', 'alien', 'ufo', 'star'],
    previewImage: '/themes/cosmic-adventure.png',
    moodImage: 'https://placehold.co/600x400/0A0A2A/FFFFFF/png?text=Cosmic+Adventure'
  },
  {
    id: 'enchanted-forest',
    name: 'Enchanted Forest',
    description: 'Magical woodland realm with mystical creatures',
    colors: {
      primary: '#228B22',
      secondary: '#9932CC',
      accent: '#FFD700',
      background: '#1A472A'
    },
    keywords: ['magic', 'woodland', 'fairies', 'elves', 'mystical', 'nature'],
    symbolIdeas: ['fairy', 'mushroom', 'tree spirit', 'magic potion', 'unicorn', 'crystal'],
    previewImage: '/themes/enchanted-forest.png',
    moodImage: 'https://placehold.co/600x400/1A472A/FFFFFF/png?text=Enchanted+Forest'
  },
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    description: 'Explore the mysterious depths of the sea',
    colors: {
      primary: '#00008B',
      secondary: '#20B2AA',
      accent: '#FF7F50',
      background: '#000080'
    },
    keywords: ['underwater', 'sea creatures', 'treasure', 'shipwreck', 'coral', 'ocean'],
    symbolIdeas: ['mermaid', 'treasure chest', 'anchor', 'whale', 'jellyfish', 'coral'],
    previewImage: '/themes/deep-ocean.png',
    moodImage: 'https://placehold.co/600x400/000080/FFFFFF/png?text=Deep+Ocean'
  },
  {
    id: 'wild-west',
    name: 'Wild West',
    description: 'Frontier adventure in the old American West',
    colors: {
      primary: '#8B4513',
      secondary: '#DAA520',
      accent: '#DC143C',
      background: '#F4A460'
    },
    keywords: ['cowboys', 'sheriff', 'western', 'gold rush', 'desert', 'saloon'],
    symbolIdeas: ['sheriff badge', 'horseshoe', 'revolver', 'cowboy hat', 'whiskey', 'gold nugget'],
    previewImage: '/themes/wild-west.png',
    moodImage: 'https://placehold.co/600x400/F4A460/000000/png?text=Wild+West'
  },
  {
    id: 'asian-dynasty',
    name: 'Asian Dynasty',
    description: 'Ancient Far East with dragons and emperors',
    colors: {
      primary: '#E60000',
      secondary: '#FFD700',
      accent: '#000000',
      background: '#EFE1C6'
    },
    keywords: ['dynasty', 'dragon', 'emperor', 'temple', 'cherry blossom', 'lantern'],
    symbolIdeas: ['dragon', 'fan', 'lantern', 'koi fish', 'emperor', 'temple'],
    previewImage: '/themes/asian-dynasty.png',
    moodImage: 'https://placehold.co/600x400/EFE1C6/000000/png?text=Asian+Dynasty'
  },
  {
    id: 'fantasy-kingdom',
    name: 'Fantasy Kingdom',
    description: 'Medieval fantasy realm with knights and dragons',
    colors: {
      primary: '#4B0082',
      secondary: '#FFD700',
      accent: '#B22222',
      background: '#483D8B'
    },
    keywords: ['dragons', 'castle', 'kingdom', 'knight', 'princess', 'magic sword'],
    symbolIdeas: ['dragon', 'crown', 'castle', 'magic sword', 'shield', 'wizard'],
    previewImage: '/themes/fantasy-kingdom.png',
    moodImage: 'https://placehold.co/600x400/483D8B/FFFFFF/png?text=Fantasy+Kingdom'
  },
  {
    id: 'futuristic-city',
    name: 'Futuristic City',
    description: 'Neon-lit cyberpunk metropolis of tomorrow',
    colors: {
      primary: '#00FFFF',
      secondary: '#FF00FF',
      accent: '#7B68EE',
      background: '#0C0C0C'
    },
    keywords: ['cyberpunk', 'neon', 'futuristic', 'robots', 'holograms', 'skyscrapers'],
    symbolIdeas: ['robot', 'flying car', 'neon sign', 'hologram', 'cyborg', 'microchip'],
    previewImage: '/themes/futuristic-city.png',
    moodImage: 'https://placehold.co/600x400/0C0C0C/00FFFF/png?text=Futuristic+City'
  },
  {
    id: 'tropical-paradise',
    name: 'Tropical Paradise',
    description: 'Exotic beach vacation with palm trees and cocktails',
    colors: {
      primary: '#FF6347',
      secondary: '#32CD32',
      accent: '#1E90FF',
      background: '#87CEEB'
    },
    keywords: ['beach', 'palm trees', 'island', 'cocktails', 'sunshine', 'tropical fruits'],
    symbolIdeas: ['coconut', 'palm tree', 'pineapple', 'cocktail', 'flamingo', 'beach umbrella'],
    previewImage: '/themes/tropical-paradise.png',
    moodImage: 'https://placehold.co/600x400/87CEEB/FFFFFF/png?text=Tropical+Paradise'
  },
  {
    id: 'golden-vegas',
    name: 'Golden Vegas',
    description: 'Glitzy casino atmosphere with lights and luxury',
    colors: {
      primary: '#FFD700',
      secondary: '#8B0000',
      accent: '#4B0082',
      background: '#000000'
    },
    keywords: ['casino', 'jackpot', 'luxury', 'gambling', 'vegas strip', 'neon lights'],
    symbolIdeas: ['dice', 'playing card', 'roulette', 'dollar sign', 'diamond', 'lucky seven'],
    previewImage: '/themes/golden-vegas.png',
    moodImage: 'https://placehold.co/600x400/000000/FFD700/png?text=Golden+Vegas'
  },
  {
    id: 'ancient-aztec',
    name: 'Ancient Aztec',
    description: 'Lost temples and Mesoamerican treasures',
    colors: {
      primary: '#CD853F',
      secondary: '#006400',
      accent: '#B22222',
      background: '#8B4513'
    },
    keywords: ['temple', 'gold', 'jungle', 'treasure', 'ancient civilization', 'rituals'],
    symbolIdeas: ['golden mask', 'sun stone', 'jaguar', 'temple', 'golden idol', 'ancient calendar'],
    previewImage: '/themes/ancient-aztec.png',
    moodImage: 'https://placehold.co/600x400/8B4513/FFFFFF/png?text=Ancient+Aztec'
  },
  {
    id: 'candy-land',
    name: 'Candy Land',
    description: 'Sweet treats and colorful confectionery world',
    colors: {
      primary: '#FF69B4',
      secondary: '#00BFFF',
      accent: '#ADFF2F',
      background: '#FFCCFF'
    },
    keywords: ['candy', 'sweets', 'chocolate', 'lollipop', 'gummy', 'dessert'],
    symbolIdeas: ['lollipop', 'candy cane', 'chocolate bar', 'cupcake', 'gummy bear', 'ice cream'],
    previewImage: '/themes/candy-land.png',
    moodImage: 'https://placehold.co/600x400/FFCCFF/000000/png?text=Candy+Land'
  }
];

// Main Theme Explorer Component
const ThemeExplorer: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(config?.theme?.selectedThemeId || null);
  // const [customColors, setCustomColors] = useState<Record<string, string> | null>(null);
  const [customColors, setCustomColors] = useState<ThemeConfig['colors'] | null>();
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const swiperRef = useRef<any>(null);
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Get the full theme object for the selected theme
  const selectedThemeObject = themeOptions.find(t => t.id === selectedTheme);
  
  // Set up a ref to track component mounted state
  const isMountedRef = useRef(false);
  
  // Initialize sound effects with fallback for missing files
  useEffect(() => {
    // Sample ticking sound function - creates a safe fallback if no audio file
    const initializeSpinSound = () => {
      try {
        // Try to create audio element first
        const tickSound = new Audio('/sounds/tick.mp3');
        
        // Test if we can play it
        tickSound.volume = 0.2;
        
        // Use Web Audio API as fallback if audio file doesn't load properly
        tickSound.addEventListener('error', () => {
          console.log('Audio file error, using oscillator fallback');
          createOscillatorFallback();
        });
        
        // Store the audio element
        spinSoundRef.current = tickSound;
      } catch (error) {
        console.warn('Audio element creation failed, using oscillator fallback:', error);
        createOscillatorFallback();
      }
    };
    
    // Fallback using oscillator if audio file doesn't work
    const createOscillatorFallback = () => {
      try {
        // Create an oscillator-based tick sound that works without files
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create a makeshift tick function that uses browser audio API
        const createTick = () => {
          try {
            // Create oscillator for tick sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Configure sound
            oscillator.type = 'sine';
            oscillator.frequency.value = 800; // Medium-high pitch
            gainNode.gain.value = 0.1; // Quieter volume
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Quick envelope for a "tick" sound
            const now = audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
            
            // Start and stop
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            
            return {
              // Fake API to match Audio element
              play: () => {},
              pause: () => {},
              playbackRate: 1,
              set currentTime(value: number) {},
            };
          } catch (e) {
            console.warn('Could not create audio fallback:', e);
            return null;
          }
        };
        
        // Store the sound generator function instead of an audio element
        spinSoundRef.current = {
          play: () => createTick(),
          pause: () => {},
          get playbackRate() { return 1; },
          set playbackRate(value: number) {},
          get currentTime() { return 0; },
          set currentTime(value: number) {},
        } as any;
      } catch (error) {
        console.warn('Sound initialization failed, falling back to silent mode:', error);
        spinSoundRef.current = null;
      }
    };
    
    // Initialize immediately - our fallback is safe
    initializeSpinSound();
    
    // Fix Swiper infinite loop issue by manually updating after component mounts
    const fixSwiperLoop = () => {
      if (swiperRef.current?.swiper) {
        try {
          // Force update to recalculate loop
          swiperRef.current.swiper.update();
          
          // Mark the component as mounted
          isMountedRef.current = true;
          
          // Force looped slides to be created properly
          swiperRef.current.swiper.loopDestroy();
          swiperRef.current.swiper.loopCreate();
          
          // Reset slide positions properly
          swiperRef.current.swiper.slideToLoop(0, 0, false);
          
          // Update again after a short delay (helps with rendering)
          setTimeout(() => {
            if (swiperRef.current?.swiper) {
              // One more update with a delay helps ensure proper slide rendering
              swiperRef.current.swiper.update();
              
              // Ensure we have proper slide duplicates for loop
              if (swiperRef.current.swiper.isBeginning || swiperRef.current.swiper.isEnd) {
                swiperRef.current.swiper.loopFix();
              }
              
              // Force another update to ensure loop works properly
              setTimeout(() => {
                if (swiperRef.current?.swiper) {
                  // Manually move a bit to ensure loop is activated
                  swiperRef.current.swiper.slideNext(0);
                  swiperRef.current.swiper.slidePrev(0);
                  swiperRef.current.swiper.update();
                }
              }, 300);
            }
          }, 200);
        } catch (e) {
          console.warn('Error fixing Swiper loop:', e);
        }
      }
    };
    
    // Initial fix needs a short delay to ensure DOM is ready
    setTimeout(fixSwiperLoop, 50);
    
    // Also fix whenever the window is resized
    window.addEventListener('resize', fixSwiperLoop);
    
    return () => {
      // Clean up
      window.removeEventListener('resize', fixSwiperLoop);
      
      if (spinSoundRef.current) {
        spinSoundRef.current.pause();
        spinSoundRef.current = null;
      }
    };
  }, []);
  
  // Reset custom colors when selected theme changes
  useEffect(() => {
    if (selectedThemeObject) {
      setCustomColors({ ...selectedThemeObject.colors });
    } else {
      setCustomColors(null);
    }
  }, [selectedTheme]);
  
  // Pre-defined easing curve for smooth acceleration and deceleration
  const spinEase = BezierEasing(0.32, 0.0, 0.68, 1.0);

  // Smooth studio-quality random selection with precise timing
  const startRandomSelection = () => {
    if (isSpinning || !swiperRef.current?.swiper) return;
    
    setIsSpinning(true);

    try {
      const swiper = swiperRef.current.swiper;
      const totalSlides = swiper.slides.length;
      const SPIN_MS = 3000; // Exactly 3 seconds total duration
      
      // Calculate random target slide
      const targetIndex = Math.floor(Math.random() * themeOptions.length);
      const finalTheme = themeOptions[targetIndex];
      
      // Store original settings to restore later
      const prevSpeed = swiper.params.speed;
      
      // Disable Swiper's own transitions during our animation
      if (swiper.autoplay) swiper.autoplay.stop();
      swiper.params.speed = 0; // Instant slide changes during animation
      
      // Use performance.now() for more accurate timing
      const t0 = performance.now();
      
      // Simple tick sound function
      const tickSound = () => {
        if (!isAudioEnabled || !spinSoundRef.current) return;
        
        try {
          const p = Math.min(1, (performance.now() - t0) / SPIN_MS);
          
          // Adjust tick rate and volume based on animation progress
          if ('playbackRate' in spinSoundRef.current) {
            // Map eased progress to appropriate playback rate
            if (p < 0.3) {
              // Acceleration phase
              const accelProgress = p / 0.3;
              spinSoundRef.current.playbackRate = 0.7 + (spinEase(accelProgress) * 0.8);
            } else if (p < 0.7) {
              // Constant speed phase
              spinSoundRef.current.playbackRate = 1.5;
            } else {
              // Deceleration phase
              const decelProgress = (p - 0.7) / 0.3;
              spinSoundRef.current.playbackRate = Math.max(0.5, 1.5 - (spinEase(decelProgress) * 1.0));
            }
          }
          
          // Reset and play sound
          if ('currentTime' in spinSoundRef.current) {
            spinSoundRef.current.currentTime = 0;
          }
          spinSoundRef.current.play().catch(() => {});
        } catch (e) {
          // Silent error handling
        }
      };
      
      // Main animation step function using requestAnimationFrame
      const step = () => {
        const now = performance.now();
        let progress = (now - t0) / SPIN_MS;
        
        // Cap progress at 1.0
        if (progress > 1) progress = 1;
        
        // Apply easing to get smooth acceleration and deceleration
        const eased = spinEase(progress);
        
        // Calculate virtual rotation angle and current index
        const rotations = 3 + eased * 5; // 3 to 8 full rotations total
        const angle = rotations * totalSlides;
        const idx = Math.floor(angle % totalSlides);
        
        // Apply slide change instantly, without transition
        if (idx !== swiper.activeIndex) {
          swiper.slideToLoop(idx, 0, false);
        }
        
        // Play tick sound at appropriate intervals
        const tickThreshold = 0.1; // Play sound every 10% of a rotation
        const normalizedAngle = angle % 1;
        if (normalizedAngle < tickThreshold || normalizedAngle > (1 - tickThreshold)) {
          tickSound();
        }
        
        // Continue animation if not finished
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          // Animation completed, smooth transition to final position
          
          // Re-enable transitions for final slide
          swiper.params.speed = 600;
          
          // Slide to target with a smooth transition
          swiper.slideToLoop(targetIndex, 600, true);
          
          // Play final selection sound
          try {
            if (isAudioEnabled) {
              const selectionSound = new Audio('/sounds/select.mp3');
              selectionSound.volume = 0.3;
              selectionSound.play().catch(() => {});
            }
          } catch (e) {
            // Silent error handling
          }
          
          // Finalize selection after transition completes
          setTimeout(() => {
            // Apply theme selection
            handleSelectTheme(finalTheme.id);
            
            // Restore original settings
            swiper.params.speed = prevSpeed;
            
            // End spinning state
            setIsSpinning(false);
          }, 600);
        }
      };
      
      // Start the animation
      requestAnimationFrame(step);
      
    } catch (error) {
      console.error('Animation error:', error);
      setIsSpinning(false);
    }
  };
  
  // Generate a game ID based on the theme
  const generateGameId = (theme: typeof themeOptions[0]) => {
    // Create a kebab-case game ID from the theme name
    const baseId = theme.name.toLowerCase().replace(/\s+/g, '-');
    // Add date suffix for uniqueness
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
    return `${baseId}_${formattedDate}`;
  };

  // Handle theme selection
  const handleSelectTheme = (themeId: string) => {
    const theme = themeOptions.find(t => t.id === themeId);
    if (!theme) return;
    
    // Set the selected theme
    setSelectedTheme(themeId);
    
    // Generate a suggested game ID if none exists yet
    const suggestedGameId = config.gameId || generateGameId(theme);
    
    // Keep existing display name or use theme name
    const displayName = config.displayName || theme.name;
    
    // Update the store with the theme data and suggested game ID
    updateConfig({
      gameId: suggestedGameId,
      displayName: displayName, // Store the display name with spaces
      theme: {
        ...config.theme,
        mainTheme: theme.name,
        description: theme.description,
        colorScheme: 'custom',
        mood: 'exciting',
        references: theme.keywords,
        selectedThemeId: themeId, // Store the selected ID for persistence
        colors: { ...theme.colors }
      }
    });
    
    // Show a small notification
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 transform transition-all duration-500 translate-y-20 opacity-0';
    notification.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
      <span>${theme.name} theme selected!</span>
    `;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateY(0)';
      notification.style.opacity = '1';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
      notification.style.transform = 'translateY(20px)';
      notification.style.opacity = '0';
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 2000);
    
    // Scroll the preview into view on mobile
    const previewElement = document.querySelector('.theme-preview');
    if (previewElement && window.innerWidth < 1024) {
      setTimeout(() => {
        previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };
  
  // Handle customizing colors
 const handleColorChange = (newColors: ColorSet) => {
  console.log('Color change:', newColors);
  setCustomColors(newColors);

  if (selectedThemeObject) {
    updateConfig({
      theme: {
        ...(config.theme ?? {}),
        colorScheme: 'custom',
        colors: newColors
      } as Partial<ThemeConfig>
    });
  }
};
  // Finalize theme selection when leaving this step
  useEffect(() => {
    if (selectedThemeObject) {
      // Save theme customizations to the store
      updateConfig({
        theme: {
          ...config.theme,
          mainTheme: selectedThemeObject.name,
          description: selectedThemeObject.description,
          colorScheme: 'custom',
          mood: 'exciting',
          references: selectedThemeObject.keywords,
          colors: customColors || selectedThemeObject.colors,
          appliedAt: new Date().toISOString()
        }
      });
    }
  }, [selectedThemeObject, customColors]);
  
  return (
    <div 
      className="theme-explorer"
    >
      <div className="pt-4 max-w-full mx-auto overflow-hidden">
        {/* Theme selection carousel using Swiper */}
        <div className="w-full relative px-2">
          <div 
            className="carousel-container"
            style={{ 
              position: 'relative',
              marginBottom: '2rem',
              marginTop: '1rem',
              padding: '20px 0',
              overflow: 'visible', // Allow effects to be visible
              width: '100%'
            }}
          >
            <Swiper
              ref={swiperRef}
              slidesPerView={'auto'} // Auto-width slides
              spaceBetween={20} // Good spacing between slides
              centeredSlides={true} // Center the active slide
              grabCursor={true} // Show grab cursor
              loop={true} // Enable infinite loop
              loopAdditionalSlides={4} // More slides for smoother looping
              loopPreventsSliding={false} // Better looping behavior
              speed={300} // Smooth transitions
              freeMode={{ // Smooth scrolling
                enabled: true,
                sticky: true, // Improved sticky behavior
                momentumBounce: true
              }}
              mousewheel={true} // Enable mousewheel scrolling
              pagination={{ 
                clickable: true,
                dynamicBullets: true // Dynamic bullets for professional look
              }}
              modules={[FreeMode, Mousewheel, Pagination, Autoplay]}
              className="theme-swiper"
              style={{ 
                width: '100%',
                paddingBottom: '50px' // Space for pagination
              }}
              updateOnWindowResize={true}
              observer={true}
              observeParents={true}
              slideToClickedSlide={true} // Click to select
            >
              {themeOptions.map(theme => (
                <SwiperSlide 
                  key={theme.id}
                  data-theme-id={theme.id}
                  style={{ width: '220px' }} // Poster-sized cards, moderately sized
                >
                  <div className="theme-card-container plain-card" onClick={() => handleSelectTheme(theme.id)}>
                    <ThemeCard
                      theme={theme}
                      isSelected={selectedTheme === theme.id}
                      onSelect={() => handleSelectTheme(theme.id)}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          
          {/* Random button and sound toggle */}
          <div className="flex justify-center items-center mb-6 gap-3">
            <button
              onClick={startRandomSelection}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full
                         flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 
                         transition-all duration-200 font-bold"
              disabled={isSpinning}
            >
              <Shuffle className="w-5 h-5" />
              RANDOM
            </button>
            
            {/* Sound toggle button */}
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200
                        ${isAudioEnabled ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}
              title={isAudioEnabled ? "Sound On" : "Sound Off"}
              aria-label={isAudioEnabled ? "Turn sound off" : "Turn sound on"}
            >
              {isAudioEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
              )}
            </button>
          </div>
          
          {/* Color Customizer - Only shown when a theme is selected */}
          {selectedTheme && selectedThemeObject && (
            <motion.div 
              className="w-full max-w-xl mx-auto mt-8 mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
            >
              <div className="flex items-center justify-center mb-2">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-gray-300"></div>
                <h3 className="mx-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Theme Customization</h3>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-gray-300"></div>
              </div>
              
              <ColorCustomizer 
                colors={customColors || selectedThemeObject.colors}
                onChange={handleColorChange}
                onReset={() => {
                  // Reset to theme's original colors
                  if (selectedThemeObject) {
                    setCustomColors(null);
                    updateConfig({
                      theme: {
                        ...config.theme,
                        colorScheme: 'default',
                        colors: selectedThemeObject.colors
                      }
                    });
                  }
                }}
                className="bg-white p-4 rounded-xl shadow-xl border border-gray-200"
              />
            </motion.div>
          )}
          
          {/* No redundant theme preview - using the GameCanvas instead */}
          
          {/* Game ID input and Continue button - Centered below the grid */}
          {selectedTheme && (
            <motion.div 
              className="flex flex-col items-center mt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
            >
              <div className="w-full max-w-md mb-4">
                <div className="flex items-center mb-2">
                  <div className="mr-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-md">
                      ID
                    </div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-1">Game Name</label>
                    <p className="text-xs text-gray-500">This will create a unique identifier for your game</p>
                  </div>
                </div>
                
                <div className="mt-3 relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                  <input 
                    type="text" 
                    value={config.displayName || ''}
                    onChange={(e) => {
                      // Allow spaces in the display name, but convert to kebab-case for the ID
                      const displayName = e.target.value;
                      const idName = displayName.trim().toLowerCase().replace(/\s+/g, '-');
                      
                      const currentDate = new Date();
                      const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
                      const newGameId = idName ? `${idName}_${formattedDate}` : '';
                      
                      updateConfig({ 
                        gameId: newGameId,
                        displayName: displayName // Store the display name with spaces
                      });
                    }}
                    placeholder="Enter a name for your game (e.g., Ocean Treasure)"
                    className="relative w-full px-5 py-3 bg-white border border-gray-300 rounded-lg 
                            shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            text-base font-medium placeholder-gray-400"
                  />
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Creates a unique ID with today's date</p>
                  {config.gameId && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs text-blue-600 font-medium"
                    >
                      ID: {config.gameId}
                    </motion.div>
                  )}
                </div>
              </div>
              
              {!config.gameId && (
                <motion.p 
                  className="mt-4 text-sm text-amber-600 flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please enter a game name to continue
                </motion.p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeExplorer;