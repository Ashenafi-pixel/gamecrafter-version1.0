import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  Settings, 
  User,
  ChevronRight,
  ChevronLeft,
  FileEdit,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Loader
} from 'lucide-react';
import { useGameStore } from '../store';
import GameSelectionModal from './GameSelectionModal';

// Sample game data to use when API fails
const SAMPLE_GAMES = [
  { 
    id: 'wild-west-1', 
    name: 'Wild West Adventure', 
    lastModified: '2025-03-23', 
    image: 'https://placehold.co/100x70/964B00/white?text=Wild+West', 
    description: 'A thrilling slot game set in the American Old West with cowboys, outlaws, and gold rush elements',
    reelsConfig: '5x3',
    rtp: '96%',
    paylines: '20',
    progress: 85
  },
  { 
    id: 'space-adventure', 
    name: 'Space Adventure', 
    lastModified: '2025-03-22', 
    image: 'https://placehold.co/100x70/4B0082/white?text=Space', 
    description: 'An interstellar slot adventure with planets, astronauts, and alien creatures',
    reelsConfig: '5x3',
    rtp: '96%',
    paylines: '25',
    progress: 60
  },
  { 
    id: 'fruit-fiesta', 
    name: 'Fruit Fiesta', 
    lastModified: '2025-03-20', 
    image: 'https://placehold.co/100x70/008000/white?text=Fruit', 
    description: 'A classic fruit-themed slot game with a modern twist',
    reelsConfig: '5x3',
    rtp: '96%',
    paylines: '10',
    progress: 100
  },
  { 
    id: 'egyptian-treasures', 
    name: 'Egyptian Treasures', 
    lastModified: '2025-03-18', 
    image: 'https://placehold.co/100x70/CD853F/white?text=Egypt', 
    description: 'Explore ancient tombs and discover pharaohs\' treasures in this Egyptian-themed slot',
    reelsConfig: '5x3',
    rtp: '95.5%',
    paylines: '15',
    progress: 30
  },
  { 
    id: 'dragon-kingdom', 
    name: 'Dragon Kingdom', 
    lastModified: '2025-03-15', 
    image: 'https://placehold.co/100x70/FF4500/white?text=Dragon', 
    description: 'Enter a medieval fantasy world with dragons, knights, and magical treasures',
    reelsConfig: '5x4',
    rtp: '96.2%',
    paylines: '30',
    progress: 45
  }
];

// Simple list of actual games from the API - directly hardcoded as a backup
const REAL_GAMES = [
  "test-connection-3", "pichi", "test-connection-1", "Pisha", "wild", 
  "scatter", "fairy", "unicorn", "dragon", "wizard", 
  "crystal", "test-fixed-game", "WickyWild", "WesternWild", 
  "test-connection", "treasure-hunt", "captain", "chest", 
  "fortune-princess", "princess", "crown", "crystal-ball"
];

// Nintendo-inspired animated demo reel component
const AnimatedDemoReel: React.FC = () => {
  return (
    <div className="overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-red-600 to-red-800 relative">
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-3">Game Crafter</h2>
          <p className="text-white/90 text-sm mb-4">Create amazing games with advanced tools</p>
          <button 
            className="bg-white px-5 py-2 rounded-full text-red-600 font-medium text-sm hover:bg-white/90 transition-colors shadow-lg"
          >
            Start Creating
          </button>
        </div>
      </div>
      <div className="absolute inset-0 bg-black/40 z-0"></div>
      <div className="relative h-80 w-full overflow-hidden">
        {/* Animated background elements that simulate game demos */}
        <div className="animate-slide-right absolute top-1/4 left-0 w-[200%] flex">
          {[...Array(6)].map((_, i) => (
            <div key={`reel-1-${i}`} className="w-40 h-24 bg-white/20 rounded-lg m-2 flex-shrink-0"></div>
          ))}
        </div>
        <div className="animate-slide-left absolute bottom-1/4 left-0 w-[200%] flex">
          {[...Array(6)].map((_, i) => (
            <div key={`reel-2-${i}`} className="w-48 h-20 bg-white/20 rounded-lg m-2 flex-shrink-0"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Apple-style circular progress indicator component
const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative h-8 w-8">
      <svg className="h-8 w-8" viewBox="0 0 32 32">
        <circle 
          cx="16" 
          cy="16" 
          r={radius} 
          stroke="#e5e7eb" 
          strokeWidth="3" 
          fill="none" 
        />
        <circle 
          cx="16" 
          cy="16" 
          r={radius} 
          stroke="#ef4444" 
          strokeWidth="3" 
          fill="none" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          className="transition-all duration-500 ease-out" 
          transform="rotate(-90 16 16)"
        />
        <text 
          x="16" 
          y="17" 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fill="#ef4444" 
          className="text-xs font-medium"
        >
          {progress}%
        </text>
      </svg>
    </div>
  );
};

// Game card with hover animation
const GameCard: React.FC<{ 
  game: any, 
  isSelected: boolean, 
  onClick: () => void 
}> = ({ game, isSelected, onClick }) => {
  return (
    <div 
      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
        isSelected 
          ? 'border-2 border-red-500 bg-red-50 shadow-md' 
          : 'border border-gray-100 shadow hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <div className="flex gap-4">
        <div 
          className="w-24 h-16 rounded-lg flex-shrink-0 overflow-hidden relative group"
          style={{ 
            backgroundColor: game.colorHex || '#6082B6',
            backgroundImage: game.image && game.image.startsWith('http') ? `url(${game.image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!game.image.startsWith('http') && (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/80 to-red-700/80 text-white text-center">
              <div>
                <div className="font-bold text-xs">{game.name.substring(0, 2).toUpperCase()}</div>
              </div>
            </div>
          )}
          
          {/* Hover effect with subtle animation */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <PlayCircle className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="font-medium text-gray-800 truncate flex items-center justify-between">
              <span>{game.name}</span>
              {game.progress && <CircularProgress progress={game.progress} />}
            </div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                {game.reelsConfig}
              </span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {game.rtp}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 mt-3 truncate flex justify-between items-center">
            <span>Last edited: {game.lastModified}</span>
            <ChevronRight size={14} className="text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Horizontal carousel component for game browsing
const GameCarousel: React.FC<{ 
  title: string, 
  games: any[],
  selectedGame: any,
  onSelectGame: (game: any) => void 
}> = ({ title, games, selectedGame, onSelectGame }) => {
  const scrollContainer = React.useRef<HTMLDivElement>(null);
  
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainer.current) return;
    
    const scrollAmount = 300;
    const currentScroll = scrollContainer.current.scrollLeft;
    
    scrollContainer.current.scrollTo({
      left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
      behavior: 'smooth'
    });
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <div className="flex gap-1">
          <button 
            onClick={() => handleScroll('left')}
            className="p-1 rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => handleScroll('right')}
            className="p-1 rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollContainer}
        className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar snap-x snap-mandatory scroll-smooth"
      >
        {games.map(game => (
          <div key={game.id} className="min-w-[280px] max-w-[280px] flex-shrink-0 snap-start">
            <GameCard 
              game={game} 
              isSelected={selectedGame?.id === game.id}
              onClick={() => onSelectGame(game)}
            />
          </div>
        ))}
        
        {/* Add Game card */}
        <div className="min-w-[280px] max-w-[280px] flex-shrink-0 snap-start">
          <div 
            className="p-4 h-full border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-red-50 hover:border-red-300 transition-colors"
            onClick={() => {
              // Generate a new game ID for this session
              const newGameId = `game_${Date.now()}`;
              
              // Initialize the config with default game type
              const initialConfig = {
                gameId: newGameId,
                displayName: 'New Slot Game',
                gameType: 'slots' // Default to slots game type
              };
              
              // Update store with initial config
              useGameStore.getState().updateConfig(initialConfig);
              setGameType('slots');
              
              // Navigate to slot creator with proper parameters
              navigate('/create?step=0&force=true');
            }}
          >
            <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-medium text-gray-800 mb-1">Create New Game</h3>
            <p className="text-sm text-gray-500">Start with a blank template or use a preset</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick resume section for recently edited games
const QuickResumeSection: React.FC<{
  recentGames: any[],
  onSelectGame: (game: any) => void
}> = ({ recentGames, onSelectGame }) => {
  return (
    <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Continue Creating</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {recentGames.map(game => (
          <div 
            key={game.id}
            onClick={() => onSelectGame(game)}
            className="flex items-center gap-3 bg-white p-3 rounded-lg cursor-pointer hover:shadow-md transition-all border border-gray-100"
          >
            <div 
              className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden"
              style={{ 
                backgroundColor: game.colorHex || '#6082B6',
                backgroundImage: game.image && game.image.startsWith('http') ? `url(${game.image})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!game.image.startsWith('http') && (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/80 to-red-700/80 text-white text-center">
                  <div className="font-bold text-xs">{game.name.substring(0, 2).toUpperCase()}</div>
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-800 truncate">{game.name}</div>
              <div className="flex items-center gap-1">
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-red-600 h-1.5 rounded-full"
                    style={{ width: `${game.progress || 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{game.progress || 0}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Templates section
const TemplatesSection: React.FC<{
  onSelectTemplate: (template: string) => void
}> = ({ onSelectTemplate }) => {
  const templates = [
    { id: 'classic-slots', name: 'Classic Slots', image: 'https://placehold.co/100x70/ff0000/white?text=Classic' },
    { id: 'video-slots', name: 'Video Slots', image: 'https://placehold.co/100x70/0000ff/white?text=Video' },
    { id: 'megaways', name: 'Megaways', image: 'https://placehold.co/100x70/00ff00/white?text=Megaways' },
    { id: 'cluster-pays', name: 'Cluster Pays', image: 'https://placehold.co/100x70/ff00ff/white?text=Cluster' },
  ];
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Start from a Template</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {templates.map(template => (
          <div 
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className="border border-gray-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all hover:border-red-300 group"
          >
            <div 
              className="h-32 bg-gradient-to-br from-gray-500 to-gray-700 relative"
              style={{ 
                backgroundImage: `url(${template.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/90 px-3 py-1.5 rounded-full text-sm font-medium text-red-600">
                  Use Template
                </div>
              </div>
            </div>
            <div className="p-3 bg-white">
              <div className="font-medium text-center text-gray-800">{template.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Collapsible sidebar navigation
const SidebarNavigation: React.FC<{
  isCollapsed: boolean,
  setIsCollapsed: (collapsed: boolean) => void
}> = ({ isCollapsed, setIsCollapsed }) => {
  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 shadow-sm ${
      isCollapsed ? 'w-16' : 'w-64'
    } h-full fixed left-0 top-16 bottom-0 z-10`}>
      <div className="p-3 border-b border-gray-200 flex justify-end">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <nav className="p-3">
        <ul className="space-y-2">
          {[
            { icon: <PlayCircle size={20} />, label: 'Games', active: true },
            { icon: <Sparkles size={20} />, label: 'Templates', active: false },
            { icon: <Settings size={20} />, label: 'Settings', active: false },
            { icon: <User size={20} />, label: 'Account', active: false },
          ].map((item, index) => (
            <li key={index}>
              <a 
                href="#" 
                className={`flex items-center py-2 px-3 rounded-lg ${
                  item.active 
                    ? 'bg-red-100 text-red-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

// Game Crafter Dashboard component with redesigned UI
const GameCrafterDashboard: React.FC<{ 
  setGameType: (type: string | null) => void, 
  setStep: (step: number) => void,
  setShowConfig: (show: boolean) => void
}> = ({ setGameType, setStep, setShowConfig }) => {
  const [games, setGames] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [showGameSelectionModal, setShowGameSelectionModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1280);
  
  // Define fetchGames function outside useEffect so it can be called directly
  const fetchGames = async () => {
    setIsLoading(true);
    setError(null);
    setUsingSampleData(false);
    
    try {
      console.log('Attempting to fetch games...');
      
      // Simulate API call with a delay
      setTimeout(() => {
        // Use sample data as a successful response
        const gameList = SAMPLE_GAMES;
        
        // Sort games by last modified date (most recent first)
        const sortedGames = [...gameList].sort((a, b) => {
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        });
        
        setGames(sortedGames);
        setIsLoading(false);
        setError(null);
      }, 1000);
      
    } catch (err) {
      console.error('Error fetching games:', err);
      
      setGames(SAMPLE_GAMES);
      setError('Failed to connect to API. Using sample data.');
      setUsingSampleData(true);
      setIsLoading(false);
    }
  };
  
  // On first load, fetch games
  useEffect(() => {
    fetchGames();
    
    // Add window resize handler for sidebar state
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1280);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleSelectTemplate = (templateId: string) => {
    // Generate a new game ID for this session
    const newGameId = `game_${Date.now()}`;
    
    // Initialize the config with the template ID
    const initialConfig = {
      gameId: newGameId,
      displayName: `New Game from Template`,
      gameType: 'slots', // Default to slots for templates
      templateId: templateId
    };
    
    // Update store with initial config
    useGameStore.getState().updateConfig(initialConfig);
    setGameType('slots');
    
    // Navigate to slot creator with step=0 and force=true
    navigate('/create?step=0&force=true&template=' + templateId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white py-3 px-4 sticky top-0 z-20 shadow-sm border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-2 rounded-lg">
              <PlayCircle className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-gray-800">Game Crafter</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowConfig(true)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-1.5 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-medium">
              U
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex">
        {/* Sidebar Navigation */}
        <SidebarNavigation 
          isCollapsed={sidebarCollapsed} 
          setIsCollapsed={setSidebarCollapsed} 
        />
        
        {/* Main Content Area */}
        <div className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          <div className="max-w-screen-xl mx-auto p-6">
            {/* Animated welcome/demo section */}
            {!selectedGame && (
              <div className="mb-8">
                <AnimatedDemoReel />
              </div>
            )}
            
            {/* Quick resume section for recently edited games */}
            {games.length > 0 && (
              <QuickResumeSection 
                recentGames={games.slice(0, 3)} 
                onSelectGame={setSelectedGame}
              />
            )}
            
            {/* Game details when a game is selected */}
            {selectedGame && (
              <div className="bg-white rounded-xl shadow-sm p-5 mb-8 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Game preview thumbnail */}
                  <div className="w-full md:w-1/3 aspect-video md:aspect-square rounded-lg overflow-hidden shadow-sm bg-gradient-to-r from-red-100 to-red-200">
                    <div 
                      className="w-full h-full flex items-center justify-center relative"
                      style={{ 
                        backgroundColor: selectedGame.colorHex || '#6082B6',
                        backgroundImage: selectedGame.image && selectedGame.image.startsWith('http') ? `url(${selectedGame.image})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!selectedGame.image.startsWith('http') && (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/80 to-red-700/80 text-white text-center p-4">
                          <div>
                            <div className="font-bold text-3xl mb-2">{selectedGame.name ? selectedGame.name.substring(0, 2).toUpperCase() : 'SG'}</div>
                            <div className="text-sm opacity-90">{selectedGame.name || 'Slot Game'}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => alert(`Playing "${selectedGame.name}"`)}
                          className="w-16 h-16 rounded-full bg-white/80 hover:bg-white text-red-600 flex items-center justify-center transition-all transform hover:scale-110"
                        >
                          <PlayCircle className="w-8 h-8" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Game details */}
                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <h1 className="text-2xl font-bold text-gray-800">{selectedGame.name}</h1>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md font-medium">
                          {selectedGame.reelsConfig || '5x3'} Grid
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md font-medium">
                          {selectedGame.rtp || '96%'} RTP
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-1.5 text-xs text-gray-500 flex items-center">
                      <span className="font-medium">ID:</span> 
                      <span className="font-mono ml-1">{selectedGame.id}</span>
                    </div>
                    
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-gray-700">
                        {selectedGame.description || `Game configuration for ${selectedGame.id}`}
                      </p>
                    </div>
                    
                    {/* Game metrics grid */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col p-3 bg-white border border-gray-200 rounded-lg">
                        <span className="text-xs text-gray-500">Paylines</span>
                        <span className="font-medium text-red-700">{selectedGame.paylines || '20'}</span>
                      </div>
                      
                      <div className="flex flex-col p-3 bg-white border border-gray-200 rounded-lg">
                        <span className="text-xs text-gray-500">Volatility</span>
                        <span className="font-medium text-amber-600">{selectedGame.volatility || 'Medium'}</span>
                      </div>
                      
                      <div className="flex flex-col p-3 bg-white border border-gray-200 rounded-lg">
                        <span className="text-xs text-gray-500">Completion</span>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-red-600 h-1.5 rounded-full"
                              style={{ width: `${selectedGame.progress || 0}%` }}
                            />
                          </div>
                          <span className="font-medium text-red-700">{selectedGame.progress || 0}%</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col p-3 bg-white border border-gray-200 rounded-lg">
                        <span className="text-xs text-gray-500">Last Modified</span>
                        <span className="font-medium text-gray-700">{selectedGame.lastModified}</span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button 
                        onClick={() => {
                          // Set game type to slots
                          setGameType('slots');
                          
                          // Generate a new game ID if needed
                          if (!selectedGame.id) {
                            const newGameId = `game_${Date.now()}`;
                            // Update config with game ID
                            useGameStore.getState().updateConfig({
                              gameId: newGameId,
                              displayName: selectedGame.name || 'Slot Game',
                              gameType: 'slots'
                            });
                          } else {
                            // Use existing game ID
                            useGameStore.getState().updateConfig({
                              gameId: selectedGame.id,
                              displayName: selectedGame.name,
                              gameType: 'slots'
                            });
                          }
                          
                          // Navigate to create with proper URL parameters
                          navigate('/create?step=0&force=true');
                        }}
                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FileEdit className="w-4 h-4" />
                        <span>Edit Game</span>
                      </button>
                      
                      <button 
                        onClick={() => alert(`Duplicating ${selectedGame.name}`)}
                        className="px-5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Duplicate</span>
                      </button>
                      
                      <button 
                        onClick={() => alert(`Deleting ${selectedGame.name}`)}
                        className="px-3 py-2 border border-gray-200 hover:bg-red-50 hover:border-red-200 text-red-600 rounded-lg font-medium flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Game carousel sections */}
            <GameCarousel 
              title="Recent Games" 
              games={games} 
              selectedGame={selectedGame}
              onSelectGame={setSelectedGame}
            />
            
            <div className="mt-8">
              <TemplatesSection onSelectTemplate={handleSelectTemplate} />
            </div>
          </div>
        </div>
      </main>
      
      {/* Game Selection Modal */}
      {showGameSelectionModal && (
        <GameSelectionModal onClose={() => setShowGameSelectionModal(false)} />
      )}
    </div>
  );
};

export default GameCrafterDashboard;