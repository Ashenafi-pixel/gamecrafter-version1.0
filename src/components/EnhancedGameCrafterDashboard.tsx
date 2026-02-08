import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Home, Search, Settings, Bell, User, ChevronRight, ChevronLeft,
  Play, Edit, Clock, ArrowRight, Sparkles, Palette, FileText, FileEdit,
  LayoutGrid, Gamepad2, Ticket, BarChart4, CreditCard, X
} from 'lucide-react';
import { useGameStore } from '../store';
import SavedConfigsSection from './SavedConfigsSection';
import StudioSelection from './StudioSelection';
import StudioCreationModal from './StudioCreationModal';
import { Studio } from '../store';

// Type definitions
interface EnhancedGameCrafterDashboardProps {
  setGameType: (type: string | null) => void;
  setStep: (step: number) => void;
  setShowConfig: (show: boolean) => void;
}

interface GameItem {
  id: string;
  title: string;
  type: string;
  progress: number;
  thumbnail: string;
  lastEdited: string;
}

interface TemplateItem {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  description: string;
}

// Sample data for demonstration
const recentGames: GameItem[] = [
  {
    id: 'game1',
    title: 'Egyptian Treasures',
    type: 'slots',
    progress: 75,
    thumbnail: '/assets/workingGames/egypt.jpg',
    lastEdited: '2 hours ago'
  },
  {
    id: 'game2',
    title: 'Candy Crush Slots',
    type: 'slots',
    progress: 45,
    thumbnail: '/assets/workingGames/candy-slot.jpg',
    lastEdited: 'Yesterday'
  },
  {
    id: 'game3',
    title: 'Wild West Fortune',
    type: 'slots',
    progress: 90,
    thumbnail: '/assets/workingGames/wild-west.jpg',
    lastEdited: '3 days ago'
  },
  {
    id: 'game4',
    title: 'Aztec Legends',
    type: 'slots',
    progress: 30,
    thumbnail: '/assets/workingGames/aztec.jpeg',
    lastEdited: 'Last week'
  }
];

const templates: TemplateItem[] = [
  {
    id: 'template1',
    title: 'Classic 5-Reel Slot',
    category: 'slots',
    thumbnail: '/assets/dashboard/templates/classic-slot.png',
    description: 'Traditional 5x3 slot with standard paylines'
  },
  {
    id: 'template2',
    title: 'Megaways™ Style',
    category: 'slots',
    thumbnail: '/assets/dashboard/templates/megaways.png',
    description: 'Dynamic reels with thousands of ways to win'
  },
  {
    id: 'template3',
    title: 'Cluster Pays',
    category: 'slots',
    thumbnail: '/assets/dashboard/templates/cluster-pays.png',
    description: 'Win by forming clusters of symbols'
  },
  {
    id: 'template4',
    title: 'Instant Win Scratch Card',
    category: 'scratch',
    thumbnail: '/assets/dashboard/templates/scratch-card.png',
    description: 'Revealing symbols to win instant prizes'
  },
  {
    id: 'template5',
    title: 'Crash Game',
    category: 'crash',
    thumbnail: '/assets/dashboard/templates/crash-game.png',
    description: 'Increasing multiplier with cash-out mechanic'
  },
  {
    id: 'template6',
    title: 'Video Poker',
    category: 'table',
    thumbnail: '/assets/dashboard/templates/video-poker.png',
    description: 'Classic video poker with standard rules'
  }
];

// Game types offered by the platform
const gameTypes = [
  {
    id: 'slots',
    name: 'Slot Games',
    icon: LayoutGrid,
    description: 'Create engaging slot games with reels, paylines, and exciting features',
    thumbnail: '/thumbnails/slots.png' // Fixed: was crash.png, contains slots reels
  },
  {
    id: 'scratch',
    name: 'Scratch Cards',
    icon: Ticket,
    description: 'Design instant-win scratch cards with custom themes and prize structures',
    thumbnail: '/thumbnails/scratch.jpg' // Updated
  },
  {
    id: 'instant',
    name: 'Instant Games',
    icon: Gamepad2,
    description: 'Plinko, Mines, and quick win games',
    thumbnail: '/thumbnails/instant.png'
  },
  {
    id: 'grid',
    name: 'GridForge',
    icon: LayoutGrid,
    description: 'Cluster mechanics and grid logic',
    thumbnail: '/thumbnails/grid.jpg' // Updated
  },
  {
    id: 'crash',
    name: 'Crash Games',
    icon: BarChart4,
    description: 'Develop crash-style games with multipliers and cash-out mechanics',
    thumbnail: '/thumbnails/crash.jpg' // Fixed: was slots.jpg, contains crash rocket
  },
  {
    id: 'table',
    name: 'Table Games',
    icon: CreditCard,
    description: 'Build casino table games like blackjack, roulette, and video poker',
    thumbnail: '/thumbnails/table.jpg' // Updated
  }
];



// Circular progress indicator component
const CircularProgress: React.FC<{ progress: number, size?: number }> = ({ progress, size = 36 }) => {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg width={size} height={size} className="absolute inset-0">
        <circle
          className="text-gray-200"
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>

      {/* Progress circle */}
      <svg width={size} height={size} className="absolute inset-0 rotate-[-90deg]">
        <circle
          className="text-red-500"
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>

      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

// Individual game card component with hover effects
const GameCard: React.FC<{
  game: GameItem;
  onClick: () => void;
  onResume?: () => void;
  showResume?: boolean;
}> = ({ game, onClick, onResume, showResume = false }) => {
  return (
    <div
      className="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-300 bg-white border border-gray-100"
      onClick={onClick}
    >
      {/* Game thumbnail with hover zoom */}
      <div className="aspect-[16/9] overflow-hidden relative">
        <img
          src={game.thumbnail}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Fallback for missing thumbnails
            e.currentTarget.src = '/assets/themes/placeholder.txt';
          }}
        />

        {/* Progress indicator overlay */}
        <div className="absolute top-2 right-2">
          <CircularProgress progress={game.progress} size={32} />
        </div>

        {/* Game type badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs uw:text-xl font-medium bg-black/60 text-white">
          {game.type === 'slots' ? 'Slot Game' :
            game.type === 'scratch' ? 'Scratch Card' :
              game.type === 'crash' ? 'Crash Game' : 'Table Game'}
        </div>
      </div>

      {/* Card content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors uw:text-2xl">
          {game.title}
        </h3>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs uw:text-xl text-gray-500">
            Edited {game.lastEdited}
          </p>

          {/* Action buttons */}
          {showResume && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResume && onResume();
              }}
              className="text-xs uw:text-xl flex items-center gap-1 uw:gap-2 text-red-600 hover:text-red-700 font-medium"
            >
              <Play className="w-3 h-3 uw:w-6 uw:h-6" />
              Resume
            </button>
          )}
        </div>
      </div>

      {/* Hover overlay with actions */}
      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onResume && onResume();
          }}
          className="p-2 rounded-full bg-white text-red-600 hover:bg-red-50 transition-colors"
        >
          <Play className="w-5 h-5 uw:w-8 uw:h-8" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="p-2 rounded-full bg-white text-red-600 hover:bg-red-50 transition-colors"
        >
          <Edit className="w-5 h-5 uw:w-8 uw:h-8" />
        </button>
      </div>
    </div>
  );
};

// Game Carousel component for displaying game lists
const GameCarousel: React.FC<{
  title: string;
  games: GameItem[];
  emptyText?: string;
  onGameSelect: (game: GameItem) => void;
  onResume?: (game: GameItem) => void;
  showViewAll?: boolean;
}> = ({
  title,
  games,
  emptyText = "No games found",
  onGameSelect,
  onResume,
  showViewAll = false
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;

      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl uw:text-3xl font-semibold text-gray-900">{title}</h2>

          {/* Navigation controls */}
          <div className="flex items-center gap-2">
            {showViewAll && (
              <button className="text-sm uw:text-lg text-red-600 hover:text-red-700 flex items-center gap-1">
                View all
                <ChevronRight className="w-4 h-4 uw:w-8 uw:h-8" />
              </button>
            )}

            <div className="flex items-center">
              <button
                onClick={() => scroll('left')}
                className="p-1 uw:p-2 rounded-full hover:bg-gray-100"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4 uw:w-8 uw:h-8 text-gray-700" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-1 uw:p-2 rounded-full hover:bg-gray-100"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4 uw:w-8 uw:h-8 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {games.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            {emptyText}
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth hide-scrollbar uw:gap-6 uw:px-2 uw:py-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {games.map(game => (
              <div key={game.id} className="min-w-[280px] max-w-[280px] uw:min-w-[450px] uw:max-w-[450px] flex-shrink-0">
                <GameCard
                  game={game}
                  onClick={() => onGameSelect(game)}
                  onResume={() => onResume ? onResume(game) : onGameSelect(game)}
                  showResume={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };



// Game type selection module with visual cards
const GameTypeSelection: React.FC<{
  onGameTypeSelect: (type: string) => void
}> = ({ onGameTypeSelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.7;

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl uw:text-3xl font-semibold text-gray-900">Game Types</h2>

        {/* Navigation controls */}
        <div className="flex items-center">
          <button
            onClick={() => scroll('left')}
            className="p-1 uw:p-2 rounded-full hover:bg-gray-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 uw:w-8 uw:h-8 text-gray-700" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1 uw:p-2 rounded-full hover:bg-gray-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 uw:w-8 uw:h-8 text-gray-700" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar px-1 uw:px-2 py-1 uw:py-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {gameTypes.map(type => (
          <div
            key={type.id}
            className="min-w-[300px] max-w-[300px] uw:min-w-[450px] uw:max-w-[450px] flex-shrink-0 cursor-pointer group relative"
            onClick={() => onGameTypeSelect(type.id)}
          >
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow hover:shadow-md transform-gpu hover:scale-105 transition-all duration-300">
              {/* Clean game type thumbnail - Updated to 1:2 Poster Ratio */}
              <div className="aspect-[1/2] overflow-hidden relative">
                <img
                  src={type.thumbnail}
                  alt={type.name}
                  className="w-full h-full object-cover will-change-transform"
                  onError={(e) => {
                    // Fallback for missing thumbnails
                    e.currentTarget.src = '/assets/symbols/placeholder.png';
                  }}
                />
                {/* No text overlay - clean image only */}
              </div>

              {/* No caption - clean image only */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Quick resume section showing recently edited games
const QuickResumeSection: React.FC<{
  onGameSelect: (game: GameItem) => void;
  onResume: (game: GameItem) => void;
}> = ({ onGameSelect, onResume }) => {
  const recentEditedGames = recentGames.sort((a, b) => {
    // Sort by last edited time (mock data)
    return a.lastEdited.localeCompare(b.lastEdited);
  }).slice(0, 4);

  return (
    <GameCarousel
      title="Continue Working"
      games={recentEditedGames}
      emptyText="No recent games found"
      onGameSelect={onGameSelect}
      onResume={onResume}
      showViewAll={recentEditedGames.length > 0}
    />
  );
};

// Templates section for starting new games from templates
const TemplatesSection: React.FC<{
  onTemplateSelect: (template: TemplateItem) => void
}> = ({ onTemplateSelect }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter templates by category or show all
  const filteredTemplates = activeCategory === 'all'
    ? templates
    : templates.filter(template => template.category === activeCategory);

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'slots', name: 'Slot Games' },
    { id: 'scratch', name: 'Scratch Cards' },
    { id: 'crash', name: 'Crash Games' },
    { id: 'table', name: 'Table Games' }
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.7;

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl uw:text-3xl font-semibold text-gray-900">Templates</h2>

        {/* Navigation controls */}
        <div className="flex items-center">
          <button
            onClick={() => scroll('left')}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 uw:w-8 uw:h-8 text-gray-700" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 uw:w-8 uw:h-8 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-1.5 rounded-full text-sm uw:text-lg font-medium whitespace-nowrap transition-colors
              ${activeCategory === category.id
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg uw:text-2xl">
          No templates found for this category
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="min-w-[280px] max-w-[280px] uw:min-w-[450px] uw:max-w-[450px] flex-shrink-0 cursor-pointer group"
              onClick={() => onTemplateSelect(template)}
            >
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300">
                {/* Template thumbnail */}
                <div className="aspect-video overflow-hidden relative">
                  <img
                    src={template.thumbnail}
                    alt={template.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback for missing thumbnails
                      e.currentTarget.src = '/assets/themes/placeholder.txt';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg uw:text-2xl font-medium text-white">{template.title}</h3>
                    </div>
                  </div>

                  {/* Category badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs uw:text-xl font-medium bg-black/60 text-white">
                    {template.category === 'slots' ? 'Slot Game' :
                      template.category === 'scratch' ? 'Scratch Card' :
                        template.category === 'crash' ? 'Crash Game' : 'Table Game'}
                  </div>
                </div>

                {/* Template description */}
                <div className="p-4">
                  <p className="text-sm uw:text-lg text-gray-600">{template.description}</p>
                  <button className="mt-3 text-sm flex items-center gap-1 text-red-600 group-hover:text-red-700 font-medium">
                    <span className="uw:text-lg">Use template</span>
                    <ArrowRight className="w-3.5 h-3.5 uw:w-6 uw:h-6 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// User profile dropdown component
const UserProfileDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
      >
        <User className="w-5 h-5 uw:w-8 uw:h-8 text-gray-700" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 uw:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 uw:w-16 uw:h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium">
                <span className="text-sm uw:text-lg">JD</span>
              </div>
              <div>
                <p className="font-medium uw:text-xl text-gray-900">John Doe</p>
                <p className="text-xs uw:text-xl text-gray-500">john.doe@example.com</p>
              </div>
            </div>
          </div>

          <div className="py-1">
            <button className="w-full text-left px-4 py-2 text-sm uw:text-lg text-gray-700 hover:bg-gray-50">
              Profile Settings
            </button>
            <button className="w-full text-left px-4 py-2 text-sm uw:text-lg text-gray-700 hover:bg-gray-50">
              Billing & Subscription
            </button>
            <button className="w-full text-left px-4 py-2 text-sm uw:text-lg text-gray-700 hover:bg-gray-50">
              API Keys
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              className="w-full text-left px-4 py-2 text-sm uw:text-lg text-red-600 hover:bg-red-50"
              onClick={() => {
                localStorage.removeItem('slotai_password');
                navigate('/login');
              }}
            >
              <span className="text-sm uw:text-lg">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Notification bell component
const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setOpen(!open);
          if (hasNotifications) setHasNotifications(false);
        }}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
      >
        <Bell className="w-5 h-5 uw:w-8 uw:h-8 text-gray-700" />
        {hasNotifications && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 uw:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-medium uw:text-xl text-gray-900">Notifications</h3>
            <button className="text-xs uw:text-lg text-red-600 hover:text-red-700">
              Mark all as read
            </button>
          </div>

          <div className="max-h-80 uw:max-h-128 overflow-y-auto">
            <div className="p-3 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex items-center gap-3 uw:gap-4">
                <div className="w-8 h-8 uw:w-16 uw:h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <FileEdit className="w-4 h-4 uw:w-8 uw:h-8" />
                </div>
                <div>
                  <p className="text-sm uw:text-xl text-gray-900">Your game "Egyptian Treasures" was auto-saved</p>
                  <p className="text-xs uw:text-xl text-gray-500">2 hours ago</p>
                </div>
              </div>
            </div>

            <div className="p-3 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex items-center gap-3 uw:gap-4">
                <div className="w-8 h-8 uw:w-16 uw:h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Sparkles className="w-4 h-4 uw:w-8 uw:h-8" />
                </div>
                <div>
                  <p className="text-sm uw:text-xl text-gray-900">New template available: "Megaways™ Style"</p>
                  <p className="text-xs uw:text-xl text-gray-500">Yesterday</p>
                </div>
              </div>
            </div>

            <div className="p-3 hover:bg-gray-50">
              <div className="flex items-center gap-3 uw:gap-4">
                <div className="w-8 h-8 uw:w-16 uw:h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <Bell className="w-4 h-4 uw:w-8 uw:h-8" />
                </div>
                <div>
                  <p className="text-sm uw:text-xl text-gray-900">Updated terms of service</p>
                  <p className="text-xs uw:text-xl text-gray-500">3 days ago</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2 border-t border-gray-100 text-center">
            <button className="text-sm uw:text-lg text-red-600 hover:text-red-700">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Search bar component with keyboard shortcut
const SearchBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set up keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }

      // Close on escape
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pl-0 pr-3 py-1.5 rounded-md border border-gray-300 text-gray-600 flex items-center gap-2 hover:bg-gray-50 text-sm hidden md:flex w-64 uw:w-96"
      >
        <div className="bg-gray-50 px-1.5 py-1 rounded-md border border-gray-100 ml-1">
          <Search className="w-4 h-4 uw:w-8 uw:h-8 text-gray-500" />
        </div>
        <span className="text-sm uw:text-lg">Search</span>
        <span className="ml-auto px-1.5 py-1 rounded bg-gray-50 border-gray-100 border text-gray-500 text-xs uw:text-lg">⌘K</span>
      </button>

      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full hover:bg-gray-100 md:hidden"
      >
        <Search className="w-5 h-5 text-gray-500" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 uw:pt-40">
          <div
            ref={searchRef}
            className="w-full max-w-xl uw:max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-4 uw:p-6">
              <div className="flex items-center border-b border-gray-300 pb-2">
                <Search className="w-5 h-5 uw:w-8 uw:h-8 text-gray-400 mr-2" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for games, templates, or features..."
                  className="flex-1 outline-none text-gray-800 uw:text-lg"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <X className="w-4 h-4 uw:w-8 uw:h-8 text-gray-500" />
                </button>
              </div>

              {/* Quick links */}
              <div className="pt-2 ">
                <p className="text-xs uw:text-lg text-gray-500 mb-2">SUGGESTED</p>
                <div className="space-y-1">
                  <button className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 uw:w-8 uw:h-8 text-gray-500" />
                    <span className="text-sm uw:text-lg">Create new slot game</span>
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 uw:w-8 uw:h-8 text-gray-500" />
                    <span className="text-sm uw:text-lg">Documentation</span>
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4 uw:w-8 uw:h-8 text-gray-500" />
                    <span className="text-sm uw:text-lg">Settings</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-2 uw:p-4 text-gray-500 flex justify-between">
              <span className="text-sm uw:text-lg">Press ↑↓ to navigate</span>
              <span className="text-sm uw:text-lg">Press ↵ to select</span>
              <span className="text-sm uw:text-lg">Press Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Sidebar navigation with collapsible design
const SidebarNavigation: React.FC<{
  collapsed: boolean;
  onToggle: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}> = ({ collapsed, onToggle, currentView, onNavigate }) => {
  const navigationItems = [
    {
      icon: Home,
      label: 'Dashboard',
      view: 'dashboard',
      onClick: () => onNavigate('dashboard')
    },
    {
      icon: Gamepad2,
      label: 'My Games',
      view: 'myGames',
      onClick: () => onNavigate('myGames')
    },
    { icon: Palette, label: 'Templates', view: 'templates', onClick: undefined },
    { icon: Clock, label: 'Recent', view: 'recent', onClick: undefined },
    { divider: true },
    { icon: FileText, label: 'Documentation', view: 'documentation', onClick: undefined },
    { icon: Settings, label: 'Settings', view: 'settings', onClick: undefined }
  ];

  return (
    <aside
      className={`bg-white border-r border-gray-200 sticky top-0 transition-all duration-300 h-screen flex flex-col ${collapsed ? 'w-16 uw:w-28' : 'w-52 uw:w-96'
        }`}
    >
      <div
        className="p-3 flex justify-between items-center border-b border-gray-100"
      >
        {collapsed ? (
          <div className="flex justify-center w-full" onClick={onToggle}>
            <img
              src="/assets/brand/logo-small.svg"
              alt="Game Crafter"
              className="h-10 uw:h-24"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 uw:gap-4">
            <img
              src="/assets/brand/logo-small.svg"
              alt="Game Crafter"
              className="h-10 uw:h-24"
            />
            <span className="font-medium text-gray-900 uw:text-3xl">Game Crafter</span>
          </div>
        )}

        <button
          onClick={onToggle}
          className={`p-1.5 rounded-md hover:bg-gray-100 ${collapsed ? 'hidden' : ''
            }`}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-5 h-5 uw:w-8 uw:h-8 text-gray-700" />
        </button>
      </div>

      <nav className="p-2 flex-1 flex flex-col">
        <ul className="space-y-1 flex-1">
          {navigationItems.map((item, index) => {
            if ('divider' in item) {
              return <li key={`divider-${index}`} className="bg-gray-200 my-2" />;
            }

            const isActive = 'view' in item && currentView === item.view;

            return (
              <li key={item.label}>
                <button
                  className={`flex items-center gap-3 p-2 rounded-md w-full transition-colors ${isActive
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-700 hover:bg-gray-100'
                    } ${collapsed ? 'justify-center hover:bg-red-50 hover:text-red-700' : ''
                    }`}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else if (collapsed) {
                      onToggle();
                    }
                  }}
                  title={collapsed ? `${item.label} (Click to expand sidebar)` : item.label}
                >
                  <item.icon className={`${collapsed ? 'w-5 h-5 uw:w-10 uw:h-10' : 'w-4 h-4 uw:w-10 uw:h-10'}`} />
                  {!collapsed && <span className="text-sm uw:text-lg">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer area with version info */}
        {/* Footer area */}
        {collapsed ? (
          <div className="mt-auto pb-2 px-2 text-center">
            <button
              onClick={onToggle}
              className="w-full flex justify-center p-2 rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5 uw:w-8 uw:h-8" />
            </button>
          </div>
        ) : (
          <div className="mt-auto pt-4 pb-2 px-2 text-center text-xs uw:text-lg text-gray-400 border-t border-gray-100">
            <p>Game Crafter v1.0</p>
          </div>
        )}
      </nav>
    </aside>
  );
};

// Main dashboard component that integrates all subcomponents
const EnhancedGameCrafterDashboard: React.FC<EnhancedGameCrafterDashboardProps> = ({
  setGameType,
  setStep,
  setShowConfig
}) => {
  // Router hooks
  const navigate = useNavigate();

  // UI States
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Handle game selection
  const handleGameSelect = (game: GameItem) => {
    setSelectedGame(game);

    // Navigate to the game in the actual application
    if (game.type) {
      setGameType(game.type);

      // Navigate to create page with proper URL parameters
      navigate(`/create?game=${game.id}`);
    }
  };

  // Handle direct game type selection
  const handleGameTypeSelect = (type: string) => {
    // Generate a new game ID for this session
    const newGameId = `game_${Date.now()}`;

    // First set the game type in the Zustand store
    setGameType(type);

    // For slot games, navigate to the proper theme selection step
    if (type === 'slots') {
      // Initialize the config with the game type and required fields
      const initialConfig = {
        gameId: newGameId,
        displayName: 'New Slot Game',
        gameType: 'slots',
        selectedGameType: 'classic-reels',
        theme: {
          selectedThemeId: 'ancient-egypt', // Set a default theme
          mainTheme: 'ancient-egypt',
          artStyle: 'cartoon' as 'cartoon',
          colorScheme: 'warm-vibrant',
          mood: 'playful'
        }
      } as any;

      // Update store with initial config and create game session
      useGameStore.getState().updateConfig(initialConfig);

      // Create a new game session explicitly before navigating
      const createNewGameSession = () => {
        // Ensure we have a valid game session by saving the data to localStorage
        try {
          const gameSession = {
            gameId: newGameId,
            type: "slot",
            template: null,
            created: Date.now(),
            lastModified: Date.now(),
            config: initialConfig
          };

          // Save to localStorage to ensure persistence
          localStorage.setItem(`slotai_session_${newGameId}`, JSON.stringify(gameSession));
          localStorage.setItem('slotai_active_session', newGameId);

          return true;
        } catch (e) {
          console.error('Failed to create game session:', e);
          return false;
        }
      };

      // Create session before navigation
      if (createNewGameSession()) {

        // Navigate to premium slot experience using React Router
        navigate('/new-game?step=0&force=true');
      } else {
        // Fallback - navigate to dashboard if session creation fails
        console.error('Failed to create game session, redirecting to home');
        navigate('/home');
      }
    } else {
      // For other game types, use the same approach for consistency
      const initialConfig = {
        gameId: newGameId,
        displayName: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Game`,
        gameType: type,
        selectedGameType: type === 'scratch' ? 'standard-scratch' : 'standard',
      } as any;

      // Create a new game session for other game types
      const createNewGameSession = () => {

        try {
          const gameSession = {
            gameId: newGameId,
            type: type,
            template: null,
            created: Date.now(),
            lastModified: Date.now(),
            config: initialConfig
          };

          // Save to localStorage
          localStorage.setItem(`slotai_session_${newGameId}`, JSON.stringify(gameSession));
          localStorage.setItem('slotai_active_session', newGameId);

          return true;
        } catch (e) {
          console.error('Failed to create game session:', e);
          return false;
        }
      };

      // Update store with initial config
      useGameStore.getState().updateConfig(initialConfig);

      // Create session before navigation
      if (createNewGameSession()) {

        // Use consistent navigation pattern for all game types
        navigate(`/new-game?step=0&force=true&gameType=${type}`);
      } else {
        // Fallback - navigate to dashboard if session creation fails
        console.error('Failed to create game session, redirecting to home');
        navigate('/home');
      }
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: TemplateItem) => {
    // Set the game type based on the template category
    if (template.category) {
      setGameType(template.category);

      // Generate a new game ID for this session
      const newGameId = `game_${Date.now()}`;

      // Initialize the config with the template
      const initialConfig = {
        gameId: newGameId,
        displayName: `New ${template.title}`,
        gameType: template.category,
        // Set specific fields based on template category
        selectedGameType: template.category === 'slots' ? 'classic-reels' :
          template.category === 'scratch' ? 'standard-scratch' : 'standard',
      } as any;

      // Add theme-specific config for slot games
      if (template.category === 'slots') {
        initialConfig.theme = {
          selectedThemeId: template.id.includes('classic') ? 'classic-reels' :
            template.id.includes('egypt') ? 'ancient-egypt' :
              template.id.includes('aztec') ? 'ancient-aztec' :
                template.id.includes('candy') ? 'candy-land' : 'ancient-egypt',
          mainTheme: template.id.includes('classic') ? 'classic-reels' :
            template.id.includes('egypt') ? 'ancient-egypt' :
              template.id.includes('aztec') ? 'ancient-aztec' :
                template.id.includes('candy') ? 'candy-land' : 'ancient-egypt',
          artStyle: 'cartoon',
          colorScheme: 'warm-vibrant',
          mood: 'playful'
        };
      }

      // Update store with initial config
      useGameStore.getState().updateConfig(initialConfig);
      // Navigate to premium experience with proper URL parameters including template and step=0
      navigate(`/new-game?step=0&force=true&template=${template.id}`);
    }
  };

  // Studio Modal State
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);

  const handleEditStudio = (studio: Studio) => {
    setEditingStudio(studio);
    setIsStudioModalOpen(true);
  };

  const handleCloseStudioModal = () => {
    setIsStudioModalOpen(false);
    setEditingStudio(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar navigation */}
      <div className='sticky left-0 top-0'>
        <SidebarNavigation
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentView={currentView}
          onNavigate={setCurrentView}
        />
      </div>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300`}>
        {/* Top navigation bar */}
        <header className="bg-white p-3 uw:py-8 border-b border-gray-200 sticky top-0 z-30">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <SearchBar />
            </div>

            <div className="flex items-center gap-2 uw:gap-4">
              <NotificationBell />
              <UserProfileDropdown />
            </div>
          </div>
        </header>

        {/* Main dashboard content */}
        <main className="p-4 max-w-screen-xl uw:max-w-full uw:px-28 mx-auto">
          {currentView === 'myGames' ? (
            <SavedConfigsSection onConfigSelect={(config) => {
              console.log('Selected config:', config);
            }} />
          ) : (
            <div className="space-y-12">
              {/* Studio Selection */}
              <StudioSelection
                onCreateStudio={() => {
                  setEditingStudio(null);
                  setIsStudioModalOpen(true);
                }}
                onEditStudio={handleEditStudio}
              />

              {/* Gated Content - Now valid for all, just studio selection is optional/top */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12 -mt-4"
              >
                {/* Game type selection */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <span className="text-red-500">Create New</span>
                  </h2>
                  <GameTypeSelection onGameTypeSelect={handleGameTypeSelect} />
                </div>

                {/* Quick resume section */}
                <QuickResumeSection
                  onGameSelect={handleGameSelect}
                  onResume={handleGameSelect}
                />

                {/* Templates section */}
                <TemplatesSection onTemplateSelect={handleTemplateSelect} />
              </motion.div>
            </div>
          )}
        </main>
      </div>

      <StudioCreationModal
        isOpen={isStudioModalOpen}
        onClose={handleCloseStudioModal}
        studioToEdit={editingStudio}
      />
    </div>
  );
};

export default EnhancedGameCrafterDashboard;