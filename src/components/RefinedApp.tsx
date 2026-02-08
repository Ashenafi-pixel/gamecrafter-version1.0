import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store';
import RefinedAppNavigation from './RefinedAppNavigation';
import LoginScreen from './LoginScreen';
import EnhancedGameCrafterDashboard from './EnhancedGameCrafterDashboard';
import ConfigModal from './ConfigModal';
import VisualJourney from './visual-journey/VisualJourney';
import ScratchCardJourney from './scratch-journey/ScratchCardJourney';
import { SLOT_STEPS, SCRATCH_STEPS } from './ProgressBar';
import { Loader, Sparkles } from 'lucide-react';

/**
 * Custom Loader Component with Refined Design
 */
const RefinedLoader: React.FC<{message?: string}> = ({ message = 'Loading' }) => {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 border-r-indigo-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-500 border-l-blue-500"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <Loader className="absolute inset-0 w-16 h-16 text-indigo-500 opacity-30" />
        </div>
        <motion.p
          className="text-lg font-medium text-gray-700 dark:text-gray-300"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
};

/**
 * Elegant Intro Animation Component
 */
const IntroAnimation: React.FC<{onComplete: () => void}> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <motion.div 
      className="fixed inset-0 bg-gradient-to-br from-indigo-900 to-blue-900 z-50 flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: [0.8, 1.1, 1],
          opacity: [0, 1, 1]
        }}
        transition={{ 
          duration: 2,
          times: [0, 0.6, 1]
        }}
        className="text-center"
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <Sparkles className="w-20 h-20 text-indigo-300 mx-auto" />
        </motion.div>
        <motion.h1
          className="text-4xl font-bold text-white mt-6 tracking-tight"
          animate={{
            letterSpacing: ["0.05em", "0.03em", "0.05em"]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          SlotAI Game Crafter
        </motion.h1>
        <motion.p
          className="text-xl text-indigo-300 mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Create amazing games with AI
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

/**
 * Refined App Component
 * 
 * A streamlined, consistent implementation of the main App
 * with improved visual hierarchy and navigation.
 */
const RefinedApp: React.FC = () => {
  // Check if we're running in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Experimental routes handling
  if (isBrowser) {
    // Handle special routes
    const specialRoutes: Record<string, React.LazyExoticComponent<any>> = {
      '/magic_box': React.lazy(() => import('./MagicBoxPage')),
      '/canvas_demo': React.lazy(() => import('./GameCanvasDemo'))
    };
    
    const currentPath = window.location.pathname;
    if (specialRoutes[currentPath]) {
      const SpecialComponent = specialRoutes[currentPath];
      return (
        <React.Suspense fallback={<RefinedLoader message={`Loading ${currentPath.slice(1)}`} />}>
          <SpecialComponent />
        </React.Suspense>
      );
    }
  }
  
  // UI States
  const [showLogin, setShowLogin] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  // Game States from Zustand store
  const gameType = useGameStore((state) => state.gameType);
  const currentStep = useGameStore((state) => state.currentStep);
  const setGameType = useGameStore((state) => state.setGameType);
  const setStep = useGameStore((state) => state.setStep);
  
  // Check if user is already logged in through localStorage
  useEffect(() => {
    if (isBrowser) {
      const isLoggedIn = localStorage.getItem('slotai_logged_in');
      if (isLoggedIn === 'true') {
        setShowLogin(false);
      }
    }
  }, []);
  
  // Handle successful login
  const handleLoginComplete = () => {
    setShowLogin(false);
  };
  
  // Handle intro animation completion
  const handleIntroComplete = () => {
    setShowIntro(false);
  };
  
  // Handle step change - unified across all game types
  const handleStepChange = (step: number) => {
    setStep(step);
  };
  
  // Get appropriate steps based on game type
  const getSteps = () => {
    switch (gameType) {
      case 'scratch':
        return SCRATCH_STEPS;
      case 'slots':
      case 'visual_journey':
      default:
        // For visual journey, use the VISUAL_STEPS from VisualJourney component directly
        // This ensures we have the correct steps with proper components
        return SLOT_STEPS;
    }
  };
  
  // Login screen conditional render
  if (showLogin) {
    return <LoginScreen onLogin={handleLoginComplete} />;
  }
  
  // Render main application
  return (
    <>
      {/* Intro animation - only show on initial load */}
      <AnimatePresence>
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      </AnimatePresence>
      
      {/* Main application with refined navigation */}
      <div className={showIntro ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
        <RefinedAppNavigation
          steps={getSteps()}
          currentStep={currentStep}
          onStepChange={handleStepChange}
        >
          {!gameType ? (
            // Dashboard when no game type is selected
            <EnhancedGameCrafterDashboard 
              setGameType={setGameType} 
              setStep={setStep} 
              setShowConfig={setShowConfig}
            />
          ) : (
            // Game Type specific content
            <React.Suspense fallback={<RefinedLoader message={`Loading ${gameType} journey`} />}>
              {(() => {
                // Render different journeys based on game type
                switch (gameType) {
                  case 'visual_journey':
                  case 'slots':
                    return <VisualJourney />;
                    
                  case 'scratch':
                    return <ScratchCardJourney />;
                    
                  default:
                    return (
                      <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-xl text-center">
                        <div className="text-amber-700 dark:text-amber-400 mb-4">
                          Unknown game type: {gameType}
                        </div>
                        <button 
                          onClick={() => setGameType(null)}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg"
                        >
                          Return to Dashboard
                        </button>
                      </div>
                    );
                }
              })()}
            </React.Suspense>
          )}
        </RefinedAppNavigation>
        
        {/* Configuration Modal */}
        <ConfigModal 
          isOpen={showConfig}
          onClose={() => setShowConfig(false)}
        />
      </div>
    </>
  );
};

export default RefinedApp;