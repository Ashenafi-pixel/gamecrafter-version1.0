import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store';
import LoginScreen from './LoginScreen';
import EnhancedGameCrafterDashboard from './EnhancedGameCrafterDashboard';
import ConfigModal from './ConfigModal';
import { Loader, Check, ChevronLeft, ChevronRight, Save, Play, Home, Settings, User } from 'lucide-react';

// Import only what's needed from visual journey and scratch card journey
import ThemeExplorer from './visual-journey/ThemeExplorer';
import { GameCanvasWorkspace } from './game-canvas';
import Step2_GameTypeSelector from './visual-journey/steps-working/Step2_GameTypeSelector';
import Step3_ReelConfiguration from './visual-journey/steps-working/Step3_ReelConfiguration';
import Step4_SymbolGeneration from './visual-journey/steps/Step4_SymbolGeneration';
import Step6_BackgroundCreator from './visual-journey/steps/Step6_BackgroundCreator';
import AudioComponent from './visual-journey/steps-working/Step11_AudioComponent';
import Step7_WinAnimationWorkshop from './visual-journey/steps/Step7_WinAnimationWorkshop';
import Step8_BonusFeatures from './visual-journey/steps/Step8_BonusFeatures';
import Step9_MathLab from './visual-journey/steps-working/Step13_MathLab';
import Step10_DeepSimulation from './visual-journey/steps-working/Step14_DeepSimulation';
import Step11_MarketCompliance from './visual-journey/steps/Step11_MarketCompliance';
import Step12_APIExport from './visual-journey/steps/Step12_APIExport';

// Simplified Step Management
// Only one source of truth for steps
const SLOT_STEPS = [
  {
    id: 'theme-selection',
    title: 'Theme Selection',
    component: ThemeExplorer
  },
  {
    id: 'game-type',
    title: 'Game Type',
    component: Step2_GameTypeSelector
  },
  {
    id: 'reel-config',
    title: 'Grid Layout',
    component: Step3_ReelConfiguration
  },
  {
    id: 'symbols',
    title: 'Symbols',
    component: Step4_SymbolGeneration
  },
  {
    id: 'background',
    title: 'Background',
    component: Step6_BackgroundCreator
  },
  {
    id: 'audio',
    title: 'Audio',
    component: AudioComponent
  },
  {
    id: 'win-animations',
    title: 'Win Animations',
    component: Step7_WinAnimationWorkshop
  },
  {
    id: 'bonus-features',
    title: 'Bonus Features',
    component: Step8_BonusFeatures
  },
  {
    id: 'math-model',
    title: 'Math Model',
    component: Step9_MathLab
  },
  {
    id: 'simulation',
    title: 'Simulation',
    component: Step10_DeepSimulation
  },
  {
    id: 'compliance',
    title: 'Compliance',
    component: Step11_MarketCompliance
  },
  {
    id: 'api-export',
    title: 'API Export',
    component: Step12_APIExport
  }
];

// Minimal scratch card steps
const SCRATCH_STEPS = [
  {
    id: 'theme-selection',
    title: 'Theme Selection',
    component: ThemeExplorer
  },
  // Add more steps for scratch journey as needed
];

// Simple Loading Component
const SimpleLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full"></div>
    <span className="ml-3 text-indigo-600 font-medium">Loading...</span>
  </div>
);

/**
 * Theme Canvas Preview Component
 */
const ThemeCanvasPreview = ({ themeId, fullscreen = false, onToggleFullscreen }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  return (
    <div className={`
      rounded-xl overflow-hidden bg-gray-900 border border-gray-700 relative
      ${fullscreen ? 'fixed inset-0 z-50' : 'h-[400px]'}
    `}>
      {/* Simple header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center">
        <h3 className="text-white font-medium">Theme Preview</h3>
        <button 
          onClick={onToggleFullscreen}
          className="text-gray-300 hover:text-white"
        >
          {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>
      
      {/* Loading indicator */}
      {isUpdating && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
          <div className="bg-gray-800 rounded-lg p-4 flex items-center">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mr-3"></div>
            <span className="text-white">Updating theme...</span>
          </div>
        </div>
      )}
      
      {/* Canvas component */}
      <GameCanvasWorkspace
        fullscreen={fullscreen}
        onToggleFullscreen={onToggleFullscreen}
        showPropertyPanel={false}
        showLayerPanel={false}
        className="w-full h-full"
      />
    </div>
  );
};

/**
 * Simplified Theme Selection Step Component
 */
const SimplifiedThemeSelection = () => {
  const [fullscreenCanvas, setFullscreenCanvas] = useState(false);
  
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/2">
        <h3 className="text-lg font-medium mb-4">Select a Theme</h3>
        <ThemeExplorer />
      </div>
      <div className="w-full md:w-1/2">
        <ThemeCanvasPreview 
          fullscreen={fullscreenCanvas}
          onToggleFullscreen={() => setFullscreenCanvas(!fullscreenCanvas)}
        />
      </div>
    </div>
  );
};

/**
 * Simplified App Component
 * 
 * A complete reimagining of the App with a single, clear navigation
 * structure and no redundant UI elements.
 */
const SimplifiedApp = () => {
  // UI States
  const [showLogin, setShowLogin] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  
  // Game States
  const { 
    gameType, 
    setGameType, 
    currentStep, 
    setStep, 
    hasUnsavedChanges, 
    saveProgress 
  } = useGameStore();
  
  // Check if user is already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('slotai_logged_in');
    if (isLoggedIn === 'true') {
      setShowLogin(false);
    }
  }, []);
  
  // Get steps based on game type
  const getSteps = () => {
    switch(gameType) {
      case 'scratch':
        return SCRATCH_STEPS;
      default:
        return SLOT_STEPS;
    }
  };
  
  // Calculate progress
  const steps = getSteps();
  const progress = steps.length 
    ? Math.round((currentStep / (steps.length - 1)) * 100)
    : 0;
  
  // Handle login completion
  const handleLoginComplete = () => {
    setShowLogin(false);
  };
  
  // Handle navigation
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };
  
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setStep(currentStep + 1);
    }
  };
  
  // Handle save
  const handleSave = () => {
    saveProgress();
    
    // Show a simple save notification
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 opacity-0 transition-opacity duration-300 shadow-lg';
    notification.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>Progress saved</span>
    `;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };
  
  // Show login screen if not logged in
  if (showLogin) {
    return <LoginScreen onLogin={handleLoginComplete} />;
  }
  
  // Show dashboard if no game type selected
  if (!gameType) {
    return (
      <div>
        <EnhancedGameCrafterDashboard 
          setGameType={setGameType} 
          setStep={setStep} 
          setShowConfig={setShowConfig}
        />
        
        {showConfig && (
          <ConfigModal 
            isOpen={showConfig}
            onClose={() => setShowConfig(false)}
          />
        )}
      </div>
    );
  }
  
  // Simplified header and navigation
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <header className="bg-white py-3 px-4 shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <div className="font-medium">SlotAI</div>
            </div>
            
            <div className="w-px h-5 bg-gray-200 mx-1"></div>
            
            <button 
              onClick={() => setGameType(null)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            
            <div className="w-px h-5 bg-gray-200 mx-1"></div>
            
            <div className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
              {gameType === 'scratch' ? 'Scratch Card' : 'Slot Game'}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowConfig(true)}
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => {
                localStorage.removeItem('slotai_logged_in');
                setShowLogin(true);
              }}
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              title="Logout"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Navigation and content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Single, clear step indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold text-gray-800">
              {steps[currentStep]?.title || 'Game Creation'}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </span>
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <div className="text-indigo-700 font-bold">{progress}%</div>
              </div>
            </div>
          </div>
          
          {/* Simple progress bar */}
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Step pills - simple and clear */}
          <div className="mt-3 flex overflow-x-auto pb-2 gap-1">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isClickable = index <= currentStep;
              
              return (
                <button
                  key={step.id}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap
                    ${isActive 
                      ? 'bg-indigo-600 text-white' 
                      : isCompleted 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-500'}
                    ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    min-w-fit flex-shrink-0 text-sm
                  `}
                  onClick={() => isClickable && setStep(index)}
                >
                  <div className={`
                    w-5 h-5 rounded-full flex items-center justify-center
                    ${isActive 
                      ? 'bg-white/20 text-white' 
                      : isCompleted 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-500'}
                  `}>
                    {isCompleted ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  
                  <span className="font-medium">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Simplified step content rendering */}
              {currentStep === 0 ? (
                <SimplifiedThemeSelection />
              ) : (
                <React.Suspense fallback={<SimpleLoader />}>
                  {React.createElement(steps[currentStep].component)}
                </React.Suspense>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Clear navigation footer */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className={`
              flex items-center gap-2 px-4 py-2 rounded
              ${currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className={`
                px-4 py-2 rounded border flex items-center gap-2
                ${hasUnsavedChanges
                  ? 'border-blue-300 bg-blue-50 text-blue-700 animate-pulse'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'}
              `}
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            
            <button
              onClick={() => alert('Preview feature coming soon!')}
              className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Preview</span>
            </button>
          </div>
          
          <button
            onClick={handleNextStep}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <span>{currentStep < steps.length - 1 ? 'Next' : 'Complete'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
      
      {/* Configuration Modal */}
      <ConfigModal 
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
      />
    </div>
  );
};

export default SimplifiedApp;