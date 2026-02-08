import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store';
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Play,
  Check,
  Home,
  Settings,
  LogOut,
  Loader,
  Gamepad2,
  Sparkles,
  Calculator,
  ArrowRight,
  Share,
  Zap,
  Bell,
  User,
  Search,
  Menu,
  X,
  HelpCircle,
  AlertTriangle,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

// Special background colors for different game types
const GAME_TYPE_COLORS = {
  slots: {
    primary: 'from-purple-500 to-indigo-600',
    secondary: 'from-indigo-500 to-blue-600',
    accent: 'bg-indigo-600',
    text: 'text-indigo-600',
    hover: 'hover:bg-indigo-50',
    lightBg: 'bg-indigo-50'
  },
  visual_journey: {
    primary: 'from-red-500 to-rose-600',
    secondary: 'from-red-500 to-pink-600',
    accent: 'bg-red-600',
    text: 'text-red-600',
    hover: 'hover:bg-red-50',
    lightBg: 'bg-red-50'
  },
  scratch: {
    primary: 'from-emerald-500 to-green-600',
    secondary: 'from-green-500 to-teal-600',
    accent: 'bg-green-600',
    text: 'text-green-600',
    hover: 'hover:bg-green-50',
    lightBg: 'bg-green-50'
  }
};

/**
 * Premium Game Logo Component
 * 
 * Displays the game brand and logo with premium styling
 */
const GameLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg"
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
      >
        <Gamepad2 className="w-5 h-5 text-white" />
      </motion.div>
      <div>
        <motion.h1 
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          SlotAI
        </motion.h1>
        <motion.span 
          className="text-xs text-gray-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Game Crafter
        </motion.span>
      </div>
    </div>
  );
};

/**
 * User Profile Mini Component
 * 
 * Displays user avatar and options
 */
const UserProfile: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <motion.button
        className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20 shadow-sm p-0.5 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-700/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
      >
        <span className="font-medium text-indigo-800 dark:text-indigo-300">GD</span>
      </motion.button>
      
      <AnimatePresence>
        {showMenu && (
          <motion.div 
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="font-medium text-gray-800 dark:text-white">Game Designer</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">designer@example.com</div>
            </div>
            <div className="py-1">
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </button>
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                <HelpCircle className="w-4 h-4" />
                <span>Help & Support</span>
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
              <button 
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  localStorage.removeItem('slotai_logged_in');
                  window.location.reload();
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Notification Component 
 * 
 * Displays animated notifications
 */
const Notifications: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotifications] = useState(true);

  return (
    <div className="relative">
      <motion.button
        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 shadow-sm p-2 flex items-center justify-center relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {hasNotifications && (
          <motion.div 
            className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              repeat: Infinity,
              duration: 2
            }}
          />
        )}
      </motion.button>
      
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium text-gray-800 dark:text-white">Notifications</h3>
              <button className="text-xs text-blue-600 dark:text-blue-400">Mark all as read</button>
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">Game saved successfully</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your game "Egypt Adventure" was saved to the cloud.</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Just now</div>
                  </div>
                </div>
              </div>
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">New comment on your game</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">John commented: "Love the bonus feature concept!"</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">2 hours ago</div>
                  </div>
                </div>
              </div>
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">New feature available</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Try our new advanced win animation workshop!</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Yesterday</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 text-center border-t border-gray-100 dark:border-gray-700">
              <button className="text-sm text-blue-600 dark:text-blue-400 font-medium">View all notifications</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Global Search Component
 * 
 * Provides search functionality across the app
 */
const GlobalSearch: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        className="h-10 px-3 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-2 text-gray-500 dark:text-gray-400 w-[180px] lg:w-[240px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsSearchOpen(true)}
      >
        <Search className="w-4 h-4" />
        <span className="text-sm">Search...</span>
        <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md">⌘K</span>
      </motion.button>
      
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
            />
            <motion.div 
              className="fixed top-[15%] left-1/2 transform -translate-x-1/2 w-[640px] max-w-[90vw] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50"
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="p-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                <Search className="w-5 h-5 text-gray-400" />
                <input 
                  autoFocus
                  placeholder="Search games, components, or tools..."
                  className="flex-grow bg-transparent border-none outline-none text-gray-800 dark:text-white placeholder-gray-400"
                />
                <button 
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="py-2 px-1 max-h-[60vh] overflow-y-auto">
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Recent Searches</div>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg mx-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-800 dark:text-white">Win animation presets</span>
                </button>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg mx-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-800 dark:text-white">Egypt theme customization</span>
                </button>
                
                <div className="mt-2 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Suggested</div>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg mx-1">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-800 dark:text-white">Theme Generator</span>
                </button>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg mx-1">
                  <Calculator className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-800 dark:text-white">Math Model Editor</span>
                </button>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg mx-1">
                  <Gamepad2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-800 dark:text-white">Game Preview</span>
                </button>
              </div>
              
              <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                <div>
                  <span className="inline-block mx-1">Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">↑</kbd> <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">↓</kbd> to navigate</span>
                  <span className="inline-block mx-1">Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Enter</kbd> to select</span>
                </div>
                <span className="inline-block mx-1">Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Esc</kbd> to close</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Clock Component for Search
 */
const Clock: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

/**
 * Step Navigation Item Component
 * 
 * Individual navigation step with premium styling and animations
 */
interface StepNavigationItemProps {
  step: any;
  index: number;
  currentStep: number;
  totalSteps: number;
  onClick: (index: number) => void;
  gameType: string | null;
}

const StepNavigationItem: React.FC<StepNavigationItemProps> = ({
  step,
  index,
  currentStep,
  totalSteps,
  onClick,
  gameType
}) => {
  const isActive = index === currentStep;
  const isCompleted = index < currentStep;
  const isClickable = isCompleted || index === currentStep || index === currentStep + 1;
  
  // Get type-specific colors
  const colors = gameType && GAME_TYPE_COLORS[gameType as keyof typeof GAME_TYPE_COLORS] 
    ? GAME_TYPE_COLORS[gameType as keyof typeof GAME_TYPE_COLORS]
    : GAME_TYPE_COLORS.slots;
  
  return (
    <motion.button
      key={step.id}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all
        ${isActive 
          ? `${colors.accent} text-white shadow-md` 
          : isCompleted 
            ? `${colors.lightBg} ${colors.text} ${colors.hover}` 
            : 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400'}
        ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        min-w-fit flex-shrink-0 border border-transparent
        ${isActive ? 'border-white/20' : isCompleted ? `border-${colors.text}/10` : 'border-transparent'}
      `}
      whileHover={isClickable ? { scale: 1.05 } : {}}
      whileTap={isClickable ? { scale: 0.97 } : {}}
      onClick={() => isClickable && onClick(index)}
      aria-current={isActive ? 'step' : undefined}
      title={step.description}
    >
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center
        ${isActive 
          ? 'bg-white/20 text-white' 
          : isCompleted 
            ? `bg-${colors.text}/10 ${colors.text}` 
            : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'}
      `}>
        {isCompleted ? (
          <Check className="w-4 h-4" />
        ) : (
          <span className="text-sm font-medium">{index + 1}</span>
        )}
      </div>
      
      <span className="text-sm font-medium">{step.title}</span>
      
      {/* Current step indicator */}
      {isActive && (
        <motion.span 
          className="ml-1 text-xs bg-white text-red-700 dark:bg-white/90 px-1.5 py-0.5 rounded-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {index + 1}/{totalSteps}
        </motion.span>
      )}
    </motion.button>
  );
};

/**
 * Mobile Menu Component
 */
const MobileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const gameType = useGameStore((state) => state.gameType);
  
  return (
    <div className="md:hidden relative z-50">
      <motion.button
        className="p-2 text-gray-700 dark:text-gray-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              className="fixed left-0 top-16 bottom-0 w-4/5 max-w-[320px] bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 dark:text-white">SlotAI</h2>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Game Crafter</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <button 
                    className="flex items-center gap-2 w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 my-1"
                    onClick={() => {
                      useGameStore.getState().setGameType(null);
                      setIsOpen(false);
                    }}
                  >
                    <Home className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-800 dark:text-white">Dashboard</span>
                  </button>
                  
                  <div className="mt-3 mb-2 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Game Tools
                  </div>
                  
                  <button className="flex items-center gap-2 w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 my-1">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-800 dark:text-white">Theme Generator</span>
                  </button>
                  
                  <button className="flex items-center gap-2 w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 my-1">
                    <Calculator className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-800 dark:text-white">Math Models</span>
                  </button>
                  
                  <button className="flex items-center gap-2 w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 my-1">
                    <ExternalLink className="w-5 h-5 text-green-500" />
                    <span className="text-gray-800 dark:text-white">API Access</span>
                  </button>
                </div>
                
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    onClick={() => {
                      localStorage.removeItem('slotai_logged_in');
                      window.location.reload();
                    }}
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Error Boundary Component
 * 
 * Premium error boundary for AppNavigation
 */
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, errorMessage: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { 
      hasError: false, 
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { 
      hasError: true, 
      errorMessage: error.message
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error in AppNavigation:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-xl text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-300 mb-4">Navigation Error</h2>
          <p className="text-amber-700 dark:text-amber-400 mb-4">
            {this.state.errorMessage || "An error occurred in the navigation system"}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Unified App Navigation Component
 * 
 * Premium UI/UX implementation inspired by industry leaders like Apple, Google,
 * Microsoft, and Atlassian, featuring:
 * 
 * - Consistent navigation across all game types
 * - Adaptive styling based on selected game type
 * - Premium micro-interactions and animations
 * - Responsive design for all screen sizes
 * - Error resilient navigation and state preservation
 * - Premium visual treatments including glass morphism
 */
const UnifiedAppNavigation: React.FC<{
  children: React.ReactNode;
  steps: any[];
  currentStep: number;
  onStepChange: (step: number) => void;
}> = ({
  children,
  steps,
  currentStep,
  onStepChange
}) => {
  const { 
    gameType, 
    setGameType, 
    config,
    hasUnsavedChanges,
    saveProgress,
    nextStep: goToNextStep,
    prevStep: goToPrevStep,
    totalSteps
  } = useGameStore();
  
  // Calculate progress based on current step
  const progressPercentage = Math.max(0, Math.min(100, (currentStep / (steps.length - 1)) * 100));
  
  // Handle save progress
  const handleSaveProgress = () => {
    saveProgress();
  };
  
  // Get type-specific colors
  const colors = gameType && GAME_TYPE_COLORS[gameType as keyof typeof GAME_TYPE_COLORS] 
    ? GAME_TYPE_COLORS[gameType as keyof typeof GAME_TYPE_COLORS]
    : GAME_TYPE_COLORS.slots;
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Premium Header with adaptive styling */}
        <header className="bg-white dark:bg-gray-800 py-3 px-4 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-30">
          <div className="max-w-screen-xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <GameLogo />
              
              <MobileMenu />
              
              <div className="hidden md:block h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
              
              <div className="hidden md:flex items-center gap-2">
                <button 
                  onClick={() => setGameType(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span className="font-medium text-sm">Dashboard</span>
                </button>
                
                {/* Display the current game type */}
                {gameType && (
                  <>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      gameType === 'scratch' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : gameType === 'visual_journey'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300'
                    }`}>
                      {gameType === 'scratch' 
                        ? 'Scratch Card' 
                        : gameType === 'visual_journey' 
                          ? 'Visual Journey' 
                          : 'Slot Game'}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <GlobalSearch />
              </div>
              
              <Notifications />
              
              <div className="hidden sm:block">
                <UserProfile />
              </div>
            </div>
          </div>
        </header>
        
        {/* Premium Progress Indicator - only show when game is selected */}
        {gameType && (
          <div className="fixed top-[64px] left-0 right-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="max-w-screen-xl mx-auto px-4 py-3">
              {/* Current step information */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {steps[currentStep]?.title || 'Step Progress'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {steps[currentStep]?.description || 'Creating your game'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  <div className={`w-12 h-12 rounded-full ${colors.lightBg} flex items-center justify-center`}>
                    <div className={`${colors.text} font-bold`}>{Math.round(progressPercentage)}%</div>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar with animations */}
              <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors.primary}`}
                  style={{ width: `${progressPercentage}%` }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              </div>
              
              {/* Mobile-friendly step navigation */}
              <div className="mt-4 overflow-x-auto scrollbar-hide py-1 flex gap-2">
                {steps.map((step, index) => (
                  <StepNavigationItem
                    key={step.id}
                    step={step}
                    index={index}
                    currentStep={currentStep}
                    totalSteps={steps.length}
                    onClick={onStepChange}
                    gameType={gameType}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <main className={`${gameType ? 'pt-[160px] md:pt-[176px]' : 'pt-[64px]'} pb-20`}>
          <div className="max-w-screen-xl mx-auto p-4">
            {children}
          </div>
        </main>
        
        {/* Navigation Footer - only show when game is selected with steps */}
        {gameType && steps.length > 0 && (
          <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-20">
            <div className="max-w-screen-xl mx-auto px-4 py-3">
              <div className="flex justify-between items-center">
                <motion.button
                  onClick={goToPrevStep}
                  disabled={currentStep === 0}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-lg
                    ${currentStep === 0
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'}
                  `}
                  whileHover={currentStep !== 0 ? { scale: 1.02 } : {}}
                  whileTap={currentStep !== 0 ? { scale: 0.98 } : {}}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="font-medium">Previous</span>
                </motion.button>
                
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={handleSaveProgress}
                    className={`
                      px-4 py-2 rounded-lg border flex items-center gap-2
                      ${hasUnsavedChanges
                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'}
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    animate={hasUnsavedChanges ? {
                      scale: [1, 1.03, 1],
                      transition: { 
                        repeat: Infinity, 
                        duration: 2,
                        repeatType: "mirror"
                      }
                    } : {}}
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => alert('Game preview feature coming soon!')}
                    className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 dark:hover:bg-green-600"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Play className="w-4 h-4" />
                    <span>Preview</span>
                  </motion.button>
                </div>
                
                <motion.button
                  onClick={() => onStepChange(currentStep + 1)}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${colors.primary} text-white rounded-lg transition-colors`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {currentStep < steps.length - 1 ? (
                    <>
                      <span className="font-medium">Next</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Complete</span>
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </footer>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default UnifiedAppNavigation;