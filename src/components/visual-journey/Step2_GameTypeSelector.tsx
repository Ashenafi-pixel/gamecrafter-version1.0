import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store';
import { gameTypes } from './steps-working/components/step2/gametypes';
import { GameTypeCard } from './steps-working/components/step2/GameTypeCard';
import { slotApiClient } from '../../utils/apiClient';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const GameTypeSelector: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Local selected state - default to classic-reels
  const [selectedGameTypeId, setSelectedGameTypeId] = useState<string | null>('classic-reels');
  const [isSaving, setIsSaving] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Auto-select classic-reels on component mount and sync with store
  useEffect(() => {
    if (config.selectedGameType) {
      setSelectedGameTypeId(config.selectedGameType);
      console.log("Setting selected game type from config:", config.selectedGameType);
    } else {
      // Auto-select classic-reels if no selection exists
      handleSelectGameType('classic-reels');
    }

    // Apply visual selection
    setTimeout(() => {
      document.querySelectorAll('[data-game-type]').forEach(card => {
        card.classList.remove('ring-4', 'ring-green-500', 'shadow-lg', 'scale-[1.02]');
      });
      const targetGameType = config.selectedGameType || 'classic-reels';
      const sel = document.querySelector(`[data-game-type="${targetGameType}"]`);
      if (sel) {
        sel.classList.add('ring-4', 'ring-green-500', 'shadow-lg', 'scale-[1.02]');
        console.log("Applied visual selection to card:", targetGameType);
      }
    }, 100);
  }, [config.selectedGameType]);

  // Selection handler
  const handleSelectGameType = async (gameTypeId: string) => {
    const selectedType = gameTypes.find(type => type.id === gameTypeId);
    if (!selectedType) return;

    console.log(`Selected game type: ${gameTypeId}`);
    setSelectedGameTypeId(gameTypeId);
    setIsSaving(true);

    // immediate visual highlight
    document.querySelectorAll('[data-game-type]').forEach(card => {
      if (card.getAttribute('data-game-type') === gameTypeId) {
        card.classList.add('ring-4', 'ring-green-500', 'shadow-lg', 'scale-[1.02]');
      }
    });

    try {
      // Get gameId from localStorage or store
      const gameId = localStorage.getItem('slotai_gameId') || config.gameId;

      if (!gameId) {
        alert('No game ID found. Please go back to Step 1 and create a game name first.');
        setIsSaving(false);
        return;
      }

      // Get current gameStore data
      const gameStoreData = useGameStore.getState().config;

      // Call RGS API with gameId, gameStore data, and gameType
      const result = await slotApiClient.saveGameConfig(gameId, gameStoreData, null, {
        gameType: gameTypeId
      });

      if (result.success) {
        console.log('RGS API save successful:', result);

        // Update global store only after API success
        updateConfig({
          ...selectedType.config,
          selectedGameType: gameTypeId,
          gameTypeInfo: {
            id: gameTypeId,
            title: selectedType.title,
            description: selectedType.description,
            features: Array.isArray(selectedType.highlightFeatures)
              ? selectedType.highlightFeatures.join(', ')
              : String(selectedType.highlightFeatures || ''),
            selectedAt: new Date().toISOString()
          },
          persistSelection: true
        } as Partial<import('../../types').GameConfig>);
      } else {
        console.error('RGS API save failed:', result.message);
        alert(`Failed to save game type: ${result.message}`);
        return;
      }
    } catch (error) {
      console.error('Error saving game type to RGS API:', error);
      alert('Failed to save game type configuration');
      return;
    } finally {
      setIsSaving(false);
    }

    // re-apply highlights after store update
    setTimeout(() => {
      const current = useGameStore.getState().config.selectedGameType;
      console.log("After updating store, selectedGameType =", current);
      document.querySelectorAll('[data-game-type]').forEach(card => {
        const id = card.getAttribute('data-game-type');
        if (id === current) {
          card.classList.add('ring-4', 'ring-green-500', 'shadow-lg', 'scale-[1.02]');
        } else {
          card.classList.remove('ring-4', 'ring-green-500', 'shadow-lg', 'scale-[1.02]');
        }
      });
    }, 50);

    // notification
    const url = new URL(window.location.href);
    url.searchParams.set('gameType', gameTypeId);
    window.history.pushState({}, '', url.toString());
  };

  const isGameTypeAvailable = (_: string) => true;

  // Check scroll position to enable/disable navigation buttons
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Handle scroll navigation
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth = 280; // Card width + gap
    const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time

    const currentScroll = container.scrollLeft;
    const newScroll = direction === 'left'
      ? currentScroll - scrollAmount
      : currentScroll + scrollAmount;

    container.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
  };

  // Check scroll position on mount and scroll events
  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, []);



  // Force Scratch Category (Updated to include all types)
  const [activeCategory, setActiveCategory] = useState<'slots' | 'scratch' | 'crash' | 'table'>('slots');

  const filteredTypes = gameTypes.filter(type => {
    const cat = (type as any).category || 'slots';
    // Handle 'grid' as slots for now, unless we want a separate tab. User provided "Grid Forge" thumb.
    // gametypes.ts has id: 'grid-slots', category: 'slots'. So it falls under slots.
    return cat === activeCategory;
  });

  const categories = [
    { id: 'slots', label: 'Slots' },
    { id: 'scratch', label: 'Scratch' },
    { id: 'crash', label: 'Crash' },
    { id: 'table', label: 'Table' }
  ];

  return (
    <div className="flex flex-col w-full h-full border">

      <h2 className="text-3xl uw:text-5xl uw:mt-4 font-bold mt-4 text-center mb-2">Choose Your Game Type</h2>

      <div className="flex justify-center gap-4 mb-6">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${activeCategory === cat.id
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <main className="flex-1 flex items-center justify-center p-6 pt-0">
        {/* Carousel Container */}
        <div className="relative w-full px-12 py-4">
          {/* Navigation Buttons */}
          {filteredTypes.length > 2 && ( // Only show nav if enough items
            <>
              <div className="absolute left-2  top-1/2 -translate-y-1/2 z-30 flex items-center ">
                <button
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className={`p-2.5 rounded-full shadow-lg border border-gray-200 transition-all duration-200 ${canScrollLeft
                    ? 'bg-gradient-to-r from-white via-white/95 to-white hover:shadow-xl hover:scale-110 text-gray-700 cursor-pointer active:scale-95'
                    : 'opacity-40 cursor-not-allowed text-gray-400 bg-white '
                    }`}
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-6 h-6 uw:w-14 uw:h-14" />
                </button>
              </div>

              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center">
                <button
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className={`p-2.5 rounded-full shadow-lg border border-gray-200 transition-all duration-200 ${canScrollRight
                    ? 'bg-gradient-to-l from-white via-white/95 to-white hover:shadow-xl hover:scale-110 text-gray-700 cursor-pointer active:scale-95'
                    : 'opacity-40 cursor-not-allowed text-gray-400 bg-white'
                    }`}
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-6 h-6  uw:w-14 uw:h-14" />
                </button>
              </div>
            </>
          )}

          {/* Carousel */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto py-4 scroll-smooth px-4 scrollbar-hide justify-center"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            } as React.CSSProperties}
          >
            {filteredTypes.map((type) => (
              <div
                key={type.id}
                className="flex-shrink-0 w-[280px] uw:w-[580px] "
              >
                <GameTypeCard
                  gameType={type}
                  isAvailable={isGameTypeAvailable(type.id) && !isSaving}
                  onSelect={() => handleSelectGameType(type.id)}
                  selectedGameTypeId={selectedGameTypeId!}
                />
              </div>
            ))}

            {filteredTypes.length === 0 && (
              <div className="w-full text-center text-gray-500 py-10 flex flex-col items-center">
                <p className="text-xl font-medium">Coming Soon</p>
                <p className="text-sm">These game types are currently in development.</p>
              </div>
            )}
          </div>
        </div>

        {isSaving && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
              <span className="text-gray-700">Saving game type...</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GameTypeSelector;
