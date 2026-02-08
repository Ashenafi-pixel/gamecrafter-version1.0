import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
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
  ExternalLink,
  LayoutDashboard
} from 'lucide-react';

// Standardized color palette for the entire application
const COLOR_PALETTE = {
  primary: {
    gradient: 'from-blue-600 to-indigo-700',
    solid: 'bg-indigo-600',
    text: 'text-indigo-600',
    hover: 'hover:bg-indigo-50',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-200',
    shadow: 'shadow-indigo-200/50'
  },
  success: {
    gradient: 'from-emerald-500 to-green-600',
    solid: 'bg-emerald-600',
    text: 'text-emerald-600',
    hover: 'hover:bg-emerald-50',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    shadow: 'shadow-emerald-200/50'
  },
  warning: {
    gradient: 'from-amber-500 to-orange-600',
    solid: 'bg-amber-500',
    text: 'text-amber-500',
    hover: 'hover:bg-amber-50',
    lightBg: 'bg-amber-50',
    border: 'border-amber-200',
    shadow: 'shadow-amber-200/50'
  },
  error: {
    gradient: 'from-red-500 to-rose-600',
    solid: 'bg-red-600',
    text: 'text-red-600',
    hover: 'hover:bg-red-50',
    lightBg: 'bg-red-50',
    border: 'border-red-200',
    shadow: 'shadow-red-200/50'
  },
  neutral: {
    gradient: 'from-gray-500 to-slate-600',
    solid: 'bg-gray-600',
    text: 'text-gray-600',
    hover: 'hover:bg-gray-50',
    lightBg: 'bg-gray-50',
    border: 'border-gray-200',
    shadow: 'shadow-gray-200/50'
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
        className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
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
 * User Profile Component with simplified design
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
 * Unified Step Indicator
 * 
 * A cleaner, more intuitive navigation component for steps
 */
interface StepIndicatorProps {
  steps: any[];
  currentStep: number;
  onStepChange: (index: number) => void;
}

const UnifiedStepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  onStepChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to center the active step when it changes
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const activeStep = container.querySelector('[data-active="true"]');
      
      if (activeStep) {
        const containerWidth = container.offsetWidth;
        const stepLeft = (activeStep as HTMLElement).offsetLeft;
        const stepWidth = (activeStep as HTMLElement).offsetWidth;
        
        // Calculate scroll position to center the active step
        const scrollPosition = stepLeft - containerWidth / 2 + stepWidth / 2;
        
        container.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [currentStep]);
  
  return (
    <div 
      ref={containerRef}
      className="flex items-center gap-1 overflow-x-auto pb-2 hide-scrollbar"
    >
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isClickable = index <= currentStep + 1;
        
        return (
          <motion.button
            key={step.id || `step-${index}`}
            data-active={isActive ? "true" : "false"}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-colors
              ${isActive 
                ? `${COLOR_PALETTE.primary.solid} text-white` 
                : isCompleted 
                  ? `${COLOR_PALETTE.success.lightBg} ${COLOR_PALETTE.success.text}` 
                  : 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400'}
              ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              min-w-fit flex-shrink-0
            `}
            whileHover={isClickable ? { scale: 1.02 } : {}}
            whileTap={isClickable ? { scale: 0.98 } : {}}
            onClick={() => isClickable && onStepChange(index)}
            title={step.description || `Step ${index + 1}`}
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-sm
              ${isActive 
                ? 'bg-white/20 text-white' 
                : isCompleted 
                  ? `${COLOR_PALETTE.success.lightBg} ${COLOR_PALETTE.success.text}` 
                  : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'}
            `}>
              {isCompleted ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>
            
            <span className="text-sm font-medium">{step.title}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

/**
 * Refined Navigation Header
 */
interface NavHeaderProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  progress: number;
}

const NavigationHeader: React.FC<NavHeaderProps> = ({
  title,
  description,
  currentStep,
  totalSteps,
  progress
}) => {
  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <div className="text-indigo-700 dark:text-indigo-400 font-bold text-sm">{Math.round(progress)}%</div>
          </div>
        </div>
      </div>
      
      {/* Progress Bar with Smooth Animation */}
      <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-blue-600"
          style={{ width: `${progress}%` }}
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

/**
 * Footer Navigation Buttons
 */
interface FooterNavProps {
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  isLastStep: boolean;
}

const FooterNavigation: React.FC<FooterNavProps> = ({
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onSave,
  hasUnsavedChanges,
  isLastStep
}) => {
  return (
    <div className="flex justify-between items-center">
      <motion.button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={`
          flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm
          ${canGoPrevious
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-70'}
        `}
        whileHover={canGoPrevious ? { scale: 1.02 } : {}}
        whileTap={canGoPrevious ? { scale: 0.98 } : {}}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="font-medium">Previous</span>
      </motion.button>
      
      <div className="flex items-center gap-3">
        <motion.button
          onClick={onSave}
          className={`
            px-4 py-2 rounded-lg border flex items-center gap-2 text-sm
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
          className="px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Play className="w-4 h-4" />
          <span>Preview</span>
        </motion.button>
      </div>
      
      <motion.button
        onClick={onNext}
        disabled={!canGoNext}
        className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-lg text-sm
          ${canGoNext 
            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700'
            : 'bg-indigo-400 cursor-not-allowed opacity-70'}
        `}
        whileHover={canGoNext ? { scale: 1.02 } : {}}
        whileTap={canGoNext ? { scale: 0.98 } : {}}
      >
        {isLastStep ? (
          <>
            <span className="font-medium">Complete</span>
            <Check className="w-4 h-4" />
          </>
        ) : (
          <>
            <span className="font-medium">Next</span>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
      </motion.button>
    </div>
  );
};

/**
 * Simple Toast Notification System
 */
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  // Auto dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-500',
    info: 'bg-blue-600'
  };
  
  const icons = {
    success: <Check className="w-5 h-5" />,
    error: <AlertTriangle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <HelpCircle className="w-5 h-5" />
  };
  
  return (
    <motion.div
      className={`fixed bottom-6 right-6 z-50 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3`}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {icons[type]}
      <span className="font-medium">{message}</span>
      <button 
        className="ml-2 text-white/70 hover:text-white"
        onClick={onClose}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

/**
 * Toast Container
 */
interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Add toast globally
  window.showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  };
  
  // Remove toast by id
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  return (
    <AnimatePresence>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </AnimatePresence>
  );
};

// Add type definition for the global function
declare global {
  interface Window {
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => string;
  }
}

/**
 * Mobile Menu Drawer
 */
const MobileMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (destination: string) => void;
}> = ({ isOpen, onClose, onNavigate }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div 
            className="fixed left-0 top-16 bottom-0 w-4/5 max-w-[320px] bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 z-40"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
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
                  className="flex items-center gap-2 w-full px-4 py-3 text-left rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 my-1"
                  onClick={() => {
                    onNavigate('dashboard');
                    onClose();
                  }}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-medium">Dashboard</span>
                </button>
                
                <div className="mt-3 mb-2 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Game Creation
                </div>
                
                <button 
                  className="flex items-center gap-2 w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 my-1"
                  onClick={() => {
                    onNavigate('slots');
                    onClose();
                  }}
                >
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span className="text-gray-800 dark:text-white">Slot Game</span>
                </button>
                
                <button 
                  className="flex items-center gap-2 w-full px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 my-1"
                  onClick={() => {
                    onNavigate('scratch');
                    onClose();
                  }}
                >
                  <Calculator className="w-5 h-5 text-green-500" />
                  <span className="text-gray-800 dark:text-white">Scratch Card</span>
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
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Error Boundary Component
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
    console.error("Navigation Error:", error, errorInfo);
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
 * Refined App Navigation Component
 * 
 * A cleaner, more consistent application navigation system that 
 * eliminates redundancy and creates a clear visual hierarchy.
 */
const RefinedAppNavigation: React.FC<{
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
    hasUnsavedChanges,
    saveProgress,
    nextStep: goToNextStep,
    prevStep: goToPrevStep,
  } = useGameStore();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Calculate progress based on current step
  const progressPercentage = steps.length <= 1 
    ? 100 
    : Math.max(0, Math.min(100, (currentStep / (steps.length - 1)) * 100));
  
  // Handle navigation
  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    } else {
      // Complete the current journey
      if (window.showToast) {
        window.showToast('Game creation completed!', 'success');
      }
    }
  };
  
  const handleSave = () => {
    saveProgress();
    if (window.showToast) {
      window.showToast('Progress saved successfully', 'success');
    }
  };
  
  const handleNavigate = (destination: string) => {
    switch (destination) {
      case 'dashboard':
        setGameType(null);
        break;
      case 'slots':
        setGameType('slots');
        break;
      case 'scratch':
        setGameType('scratch');
        break;
      default:
        console.warn('Unknown navigation destination:', destination);
    }
  };
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
        {/* Simplified Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-30">
          <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <GameLogo />
              
              <div className="block md:hidden">
                <button 
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
              
              <div className="hidden md:flex items-center gap-2">
                <button 
                  onClick={() => handleNavigate('dashboard')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span className="font-medium text-sm">Dashboard</span>
                </button>
                
                {/* Display the current game type */}
                {gameType && (
                  <>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    
                    <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
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
              <UserProfile />
            </div>
          </div>
        </header>
        
        {/* Mobile Menu */}
        <MobileMenu 
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          onNavigate={handleNavigate}
        />
        
        {/* Main Content with Unified Navigation */}
        <main className="pt-16 pb-24">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {gameType && steps.length > 0 ? (
              <>
                {/* Step Navigation */}
                <div className="mb-6">
                  {/* Header with unified styling */}
                  <NavigationHeader 
                    title={steps[currentStep]?.title || 'Game Creation'}
                    description={steps[currentStep]?.description || 'Create your game step by step'}
                    currentStep={currentStep}
                    totalSteps={steps.length}
                    progress={progressPercentage}
                  />
                  
                  {/* Step Indicator Pills */}
                  <UnifiedStepIndicator 
                    steps={steps}
                    currentStep={currentStep}
                    onStepChange={onStepChange}
                  />
                </div>
                
                {/* Content Area */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`step-${currentStep}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {children}
                    </motion.div>
                  </AnimatePresence>
                </div>
                
                {/* Footer Navigation */}
                <FooterNavigation 
                  canGoPrevious={currentStep > 0}
                  canGoNext={true} // Always allow next for simplicity
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  onSave={handleSave}
                  hasUnsavedChanges={hasUnsavedChanges}
                  isLastStep={currentStep === steps.length - 1}
                />
              </>
            ) : (
              // Simple container when no game type is selected
              <div className="mt-4">
                {children}
              </div>
            )}
          </div>
        </main>
        
        {/* Toast Container for notifications */}
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
};

export default RefinedAppNavigation;