import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shuffle, Search } from 'lucide-react';
import { useGameStore } from '../../store';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectCoverflow, Mousewheel, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import { themeOptions } from '../animation-lab/components/EnhancedThemeExplorer/themeoptions';

const NINTENDO_RED = '#E60012';

// Theme Card Component (optimized with correct aspect ratios and shadows)
const ThemeCard: React.FC<{
  theme: typeof themeOptions[0];
  isSelected: boolean;
  onSelect: () => void;
}> = ({ theme, isSelected, onSelect }) => {
  return (
    <motion.div
      data-theme-id={theme.id}
      className={`relative cursor-pointer bg-white rounded-lg overflow-hidden
                 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all 
                 ${isSelected ? 'ring-2 ring-red-600 ring-offset-2' : 'hover:shadow-xl'}`}
      onClick={onSelect}
      whileHover={{ y: -5, scale: 1.03, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Theme preview image with consistent aspect ratio */}
      <div className="aspect-[3/4] relative overflow-hidden">
        <img
          src={theme.previewImage || theme.moodImage}
          alt={theme.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Selected indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 shadow-md"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <Check className="w-5 h-5" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Main Theme Explorer Component
const EnhancedThemeExplorer: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(config?.theme?.selectedThemeId || null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [search, setSearch] = useState(''); 
  const swiperRef = useRef<any>(null);
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);

  // Filtered themes based on search
  const filteredThemes = search.trim() === ''
    ? themeOptions
    : themeOptions.filter(theme => {
        const q = search.trim().toLowerCase();
        return (
          theme.name.toLowerCase().includes(q) ||
          (theme.keywords && theme.keywords.some((kw: string) => kw.toLowerCase().includes(q)))
        );
      });

  // Get the full theme object for the selected theme
  const selectedThemeObject = themeOptions.find(t => t.id === selectedTheme);

  // Find the index of the selected theme, or default to center
  const selectedIndex = selectedTheme
    ? Math.max(0, filteredThemes.findIndex(t => t.id === selectedTheme))
    : Math.floor(filteredThemes.length / 2);

  // On mount, if no theme is selected, select the center one
  useEffect(() => {
    if (!selectedTheme && themeOptions.length > 0) {
      const centerTheme = themeOptions[Math.floor(themeOptions.length / 2)];
      handleSelectTheme(centerTheme.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize sound effects

useEffect(() => {
  try {
    // Load your full spin-down MP3 here
    const spinTrack = new Audio('/sounds/my-tick.mp3');
    spinTrack.volume = 0.4;
    spinTrack.preload = 'auto';
    spinSoundRef.current = spinTrack;
  } catch (e) {
    console.warn('Audio init failed', e);
  }
}, []);

const startRandomSelection = () => {
  if (isSpinning || !swiperRef.current?.swiper || !spinSoundRef.current) return;
  setIsSpinning(true);

  const audio = spinSoundRef.current!;
  // wait for metadata to know exact duration
  if (!audio.duration || isNaN(audio.duration)) {
    audio.addEventListener('loadedmetadata', startRandomSelection, { once: true });
    return;
  }

  // Measured raw tick‑intervals (ms) from track
  const raw = [80,80,90,90,80, 90,80,80,90,90, 90,80,80,80,90, 120,150,180,160,190,210];
  const sumRaw = raw.reduce((a,b) => a+b, 0);             // ~2280
  const soundMs = audio.duration * 1000;                  // e.g. 3000
  const scale   = soundMs / sumRaw;                       // e.g. 1.316

  // scaled intervals that exactly fill track
  const intervals = raw.map(i => Math.round(i * scale));

  const swiper      = swiperRef.current.swiper;
  const totalSlides = themeOptions.length;
  const targetIndex = Math.floor(Math.random() * totalSlides);

  let tic        = 0;
  let currentIdx = swiper.realIndex;

  // start the audio once
  audio.currentTime = 0;
  audio.play().catch(() => {});

  const doTic = () => {
    if (tic < intervals.length) {
      currentIdx = (currentIdx + 1) % totalSlides;
      swiper.slideToLoop(currentIdx, 60, false);
      setTimeout(doTic, intervals[tic]);
      tic++;
    } else {
      // slider has done all ticks; now snap to final choice
      swiper.slideToLoop(targetIndex, 200, true);

      setTimeout(() => {
        handleSelectTheme(themeOptions[targetIndex].id);
        setIsSpinning(false);
      }, 250);
    }
  };

  doTic();
};


  // Initialize swiper with proper loop
  useEffect(() => {
    // Ensure Swiper loop is working properly
    const fixSwiperLoop = () => {
      if (swiperRef.current?.swiper) {
        try {
          const swiper = swiperRef.current.swiper;

          // Force update for proper rendering
          swiper.update();

          // Only recreate loop if it's enabled
          if (swiper.params.loop) {
            swiper.loopDestroy();
            swiper.loopCreate();
            swiper.update();
          }
        } catch (e) {
          console.warn('Error fixing Swiper loop:', e);
        }
      }
    };

    // Fix after a short delay to ensure rendering is complete
    const timer = setTimeout(fixSwiperLoop, 100);
    return () => clearTimeout(timer);
  }, []);

  // Generate a game ID based on the theme
  const generateGameId = (theme: typeof themeOptions[0]) => {
    const baseId = theme.name.toLowerCase().replace(/\s+/g, '-');
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
    return `${baseId}_${formattedDate}`;
  };

  // Handle theme selection with improved state management
  const handleSelectTheme = (themeId: string) => {
    const theme = themeOptions.find(t => t.id === themeId);
    if (!theme) return;

    // Set the selected theme
    setSelectedTheme(themeId);

    // Generate a suggested game ID if none exists yet
    const suggestedGameId = config.gameId || generateGameId(theme);

    // Keep existing display name or use theme name
    const displayName = config.displayName ;

    // Get the global store directly for more reliable update
    const store = useGameStore.getState();

    // Prepare all of our updates at once
    const updates = {
      gameId: suggestedGameId,
      displayName: displayName,
      theme: {
        ...config.theme,
        mainTheme: theme.name,
        description: theme.description,
        colorScheme: 'default',
        mood: 'exciting',
        references: theme.keywords,
        selectedThemeId: themeId,
        colors: { ...theme.colors }
      }
    };

    // Use direct store access for more reliable update
    console.log('Applying theme update with direct store access:', updates);
    store.updateConfig(updates);

    // Double-check that the update was applied after a slight delay
    setTimeout(() => {
      const currentConfig = useGameStore.getState().config;
      console.log('Verifying theme update:', {
        selectedThemeId: currentConfig?.theme?.selectedThemeId,
        gameId: currentConfig?.gameId
      });

      // If the update didn't stick, force it again
      if (currentConfig?.theme?.selectedThemeId !== themeId) {
        console.warn('Theme update failed, forcing again');
        useGameStore.getState().updateConfig(updates);
      }
    }, 50);

    // Show success notification
    // const notification = document.createElement('div');
    // notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 transform transition-all duration-500 translate-y-20 opacity-0';
    // notification.innerHTML = `
    //   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    //     <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
    //   </svg>
    //   <span>${theme.name} selected!</span>
    // `;
    // document.body.appendChild(notification);

    // // Animate in
    // setTimeout(() => {
    //   notification.style.transform = 'translateY(0)';
    //   notification.style.opacity = '1';
    // }, 100);

    // // Animate out and remove
    // setTimeout(() => {
    //   notification.style.transform = 'translateY(20px)';
    //   notification.style.opacity = '0';

    //   setTimeout(() => {
    //     document.body.removeChild(notification);
    //   }, 500);
    // }, 2000);
  };

  return (
    <div className="absolut inset-0 flex flex-col items-center">
      {/* Main container with proper height and centering */}

        {/* Game name input */}
        <div className='flex items-center justify-center relative w-full'>
          <div>
          <div className="relative w-64 h-10">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                style={{ background: `linear-gradient(135deg, ${NINTENDO_RED} 0%, #d40010 100%)` }}
              >
                N
              </div>
            </div>
            <input
              type="text"
              value={config.displayName || ''}
              onChange={(e) => {
                const displayName = e.target.value;
                const idName = displayName.trim().toLowerCase().replace(/\s+/g, '-');

                const currentDate = new Date();
                const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
                const newGameId = idName ? `${idName}_${formattedDate}` : '';

                // Ensure we set both gameId and displayName
                console.log(`Setting gameId: ${newGameId} from displayName: ${displayName}`);

                // Save the gameId in localStorage for access in Step 4
                localStorage.setItem('slotai_gameId', newGameId);
                localStorage.setItem('slotai_current_game', newGameId);
                console.log(`Saved gameId to localStorage: ${newGameId}`);

                // Use direct store access for more reliable updates
                useGameStore.getState().updateConfig({
                  gameId: newGameId,
                  displayName: displayName
                });
              }}
              onBlur={(e) => {
                // Force update on blur to ensure gameId is set
                if (e.target.value) {
                  const displayName = e.target.value;
                  const idName = displayName.trim().toLowerCase().replace(/\s+/g, '-');
                  const currentDate = new Date();
                  const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
                  const newGameId = idName ? `${idName}_${formattedDate}` : '';

                  console.log(`Force updating gameId on blur: ${newGameId}`);

                  // Save the gameId in localStorage for access in Step 4
                  localStorage.setItem('slotai_gameId', newGameId);
                  localStorage.setItem('slotai_current_game', newGameId);
                  console.log(`Saved gameId to localStorage on blur: ${newGameId}`);

                  // Use direct store access for more reliable updates
                  useGameStore.getState().updateConfig({
                    gameId: newGameId,
                    displayName: displayName
                  });

                  // Double-check that the update was applied
                  setTimeout(() => {
                    const currentConfig = useGameStore.getState().config;
                    if (currentConfig.gameId !== newGameId) {
                      console.warn('Game ID update failed, forcing again');
                      useGameStore.getState().updateConfig({
                        gameId: newGameId,
                        displayName: displayName
                      });
                    }
                  }, 50);
                }
              }}
              placeholder="Enter name..."
              className="w-full pl-8 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg h-10
                      focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-transparent
                      text-xs placeholder-gray-400 shadow-sm"
            />
          </div>
          </div>
          <div className='absolute right-0'>
          <div className="relative w-48 ml-auto">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              className='bg-white border border-gray-200 rounded-lg h-10 w-full pl-8
                        focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-transparent
                        text-xs placeholder-gray-400 shadow-sm'
              type='text'
              placeholder='Search'
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          </div>
        </div>


      <div className="flex-1 w-full flex flex-col justify-center items-center relative">
        {/* Top title and search bar in the same row */}
          <div className="flex-1 flex justify-center mt-4">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Choose your theme</h2>
          </div>
        {/* Carousel - perfectly centered with correct spacing */}
        <div className="w-full mt-0 z-50">
          <Swiper
            ref={swiperRef}
            effect={'coverflow'}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView="auto"
            loop={true}
            initialSlide={selectedIndex}
            onSlideChange={(swiper) => {
              // Only update theme if not spinning
              if (!isSpinning) {
                const realIndex = swiper.realIndex;
                const theme = (filteredThemes.length === 0
                  ? [themeOptions.find(t => t.id === 'other')].filter(Boolean)
                  : filteredThemes)[realIndex];
                if (theme && theme.id !== selectedTheme) {
                  handleSelectTheme(theme.id);
                }
              }
            }}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 2,
              slideShadows: false,
            }}
            pagination={{
              clickable: true,
              bulletActiveClass: 'swiper-pagination-bullet-active bg-red-600',
              renderBullet: function (index, className) {
                return `<span class="${className}" style="background-color: ${isSpinning ? 'rgba(0,0,0,0.2)' : index === this.realIndex ? '#E60012' : 'rgba(0,0,0,0.2)'}"></span>`;
              }
            }}
            modules={[EffectCoverflow, Pagination, Mousewheel, Autoplay]}
            className="w-full !py-4 !px-2"
          >
            {filteredThemes.length === 0
              ? (() => {
                  const otherTheme = themeOptions.find(t => t.id === 'other');
                  return otherTheme ? (
                    <SwiperSlide
                      key={otherTheme.id}
                      data-theme-id={otherTheme.id}
                      style={{ width: '190px', height: '280px' }}
                      className="mx-1 my-4 transition-all"
                    >
                      <motion.div
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: selectedTheme === otherTheme.id ? 1 : 0.9 }}
                        transition={{ duration: 0.5 }}
                      >
                        <ThemeCard
                          theme={otherTheme}
                          isSelected={selectedTheme === otherTheme.id}
                          onSelect={() => {
                            if (swiperRef.current?.swiper) {
                              swiperRef.current.swiper.slideToLoop(0, 300, true);
                            }
                            handleSelectTheme(otherTheme.id);
                          }}
                        />
                      </motion.div>
                    </SwiperSlide>
                  ) : null;
                })()
              : filteredThemes.map((theme, idx) => (
                <SwiperSlide
                  key={theme.id}
                  data-theme-id={theme.id}
                  style={{ width: '190px', height: '280px' }}
                  className="mx-1 my-4 transition-all"
                >
                  <motion.div
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: selectedTheme === theme.id ? 1 : 0.9 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ThemeCard
                      theme={theme}
                      isSelected={selectedTheme === theme.id}
                      onSelect={() => {
                        if (swiperRef.current?.swiper) {
                          swiperRef.current.swiper.slideToLoop(idx, 300, true);
                        }
                        handleSelectTheme(theme.id);
                      }}
                    />
                  </motion.div>
                </SwiperSlide>
              ))}
          </Swiper>
        </div>

        {/* Bottom controls with minimal spacing */}
        <div className="flex items-center gap-4 mt-2">
          {/* Random button */}
          <button
            onClick={startRandomSelection}
            disabled={isSpinning}
            className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg
                    flex items-center gap-1.5 shadow-sm hover:shadow-md transform hover:scale-102 
                    transition-all duration-200 font-medium disabled:opacity-70 text-sm"
            style={{ background: isSpinning ? `#777777` : `linear-gradient(90deg, ${NINTENDO_RED} 0%, #d40010 100%)` }}
          >
            <Shuffle className="w-4 h-4" />
            Random
          </button>

          {/* Game name input
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                style={{ background: `linear-gradient(135deg, ${NINTENDO_RED} 0%, #d40010 100%)` }}
              >
                N
              </div>
            </div>
            <input
              type="text"
              value={config.displayName || ''}
              onChange={(e) => {
                const displayName = e.target.value;
                const idName = displayName.trim().toLowerCase().replace(/\s+/g, '-');

                const currentDate = new Date();
                const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
                const newGameId = idName ? `${idName}_${formattedDate}` : '';

                // Ensure we set both gameId and displayName
                console.log(`Setting gameId: ${newGameId} from displayName: ${displayName}`);

                // Save the gameId in localStorage for access in Step 4
                localStorage.setItem('slotai_gameId', newGameId);
                localStorage.setItem('slotai_current_game', newGameId);
                console.log(`Saved gameId to localStorage: ${newGameId}`);

                // Use direct store access for more reliable updates
                useGameStore.getState().updateConfig({
                  gameId: newGameId,
                  displayName: displayName
                });
              }}
              onBlur={(e) => {
                // Force update on blur to ensure gameId is set
                if (e.target.value) {
                  const displayName = e.target.value;
                  const idName = displayName.trim().toLowerCase().replace(/\s+/g, '-');
                  const currentDate = new Date();
                  const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
                  const newGameId = idName ? `${idName}_${formattedDate}` : '';

                  console.log(`Force updating gameId on blur: ${newGameId}`);

                  // Save the gameId in localStorage for access in Step 4
                  localStorage.setItem('slotai_gameId', newGameId);
                  localStorage.setItem('slotai_current_game', newGameId);
                  console.log(`Saved gameId to localStorage on blur: ${newGameId}`);

                  // Use direct store access for more reliable updates
                  useGameStore.getState().updateConfig({
                    gameId: newGameId,
                    displayName: displayName
                  });

                  // Double-check that the update was applied
                  setTimeout(() => {
                    const currentConfig = useGameStore.getState().config;
                    if (currentConfig.gameId !== newGameId) {
                      console.warn('Game ID update failed, forcing again');
                      useGameStore.getState().updateConfig({
                        gameId: newGameId,
                        displayName: displayName
                      });
                    }
                  }, 50);
                }
              }}
              placeholder="Enter name..."
              className="w-full pl-8 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg 
                      focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-transparent
                      text-xs placeholder-gray-400 shadow-sm"
            />
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default EnhancedThemeExplorer;