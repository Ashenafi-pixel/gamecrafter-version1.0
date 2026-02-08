import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store';
import { NINTENDO_RED } from '../GameCrafterTheme';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Play,
  Home, Settings, User, Gamepad2, ImageIcon, Palette, Sparkles, Volume2,
  Grid, LayoutTemplate, Zap, Trophy, Calculator, PenTool, Type, Smartphone, FileText, MousePointer, EyeOff, Move
} from 'lucide-react';
import { useSidebarStore } from '../../stores/sidebarStore';
import BrandLogo from '../ui/BrandLogo';
import VerticalStepSidebar from '../navigation/VerticalStepSidebar';
import { Stepper } from '../visual-journey/steps-working/Step11_EnhancedAudio/Stepper';
import SlotMachinePreview from '../mockups/SlotMachine';
import ScratchGridPreview from '../visual-journey/scratch-steps/ScratchGridPreview';

interface PremiumLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  stepDescription: string;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSave: () => void;
  onPreview: () => void;
  showCanvas?: boolean;
  hasUnsavedChanges?: boolean;
  gameId?: string;
  gameName?: string;
  steps?: { title: string; description: string }[];
}

const PremiumLayout: React.FC<PremiumLayoutProps> = ({
  children,
  currentStep,
  totalSteps,
  stepTitle,
  stepDescription,
  onPrevStep,
  onNextStep,
  onPreview,
  showCanvas = true,
  gameId = '',
  gameName = 'New Game',
  steps = [],
  hasUnsavedChanges = false

}) => {
  // Use sidebar store
  const { isSidebarCollapsed, } = useSidebarStore();
  const navigate = useNavigate();
  // Precomputed values
  const progress = totalSteps > 0 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  // Split Screen Logic
  const [splitRatio, setSplitRatio] = React.useState(50); // Percentage
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDraggingRef = React.useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Clamp between 20% and 80%
    if (newRatio >= 20 && newRatio <= 80) {
      setSplitRatio(newRatio);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.body.style.cursor = 'default';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Cleanup event listeners on unmount
  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Get store for scratch navigation
  const {
    gameType,
    scratchMechanicStep, setScratchMechanicStep,
    scratchAestheticStep, setScratchAestheticStep,
    scratchGameplayStep, setScratchGameplayStep,
    scratchProductionStep, setScratchProductionStep
  } = useGameStore();

  // Tab Configurations
  const MECHANIC_TABS = [
    { id: 'category', label: 'Category', icon: Grid },
    { id: 'layout', label: 'Rules & Grid', icon: LayoutTemplate },
    { id: 'features', label: 'Features', icon: Zap },
    { id: 'paytable', label: 'Paytable', icon: Trophy },
    { id: 'math', label: 'Math', icon: Calculator },
    { id: 'sim', label: 'Sim', icon: Play },
  ];

  const AESTHETIC_TABS = [
    { id: 'background', label: 'Background', icon: ImageIcon },
    { id: 'frame', label: 'Frame', icon: ImageIcon }, // Was Grid & Frame
    { id: 'grid', label: 'Grid Layout', icon: Grid }, // New Tab
    { id: 'logo', label: 'Game Logo', icon: Type },
    { id: 'foil', label: 'Foil Layer', icon: Palette },
    { id: 'mascot', label: 'Mascot', icon: User },
  ];

  const GAMEPLAY_TABS = [
    { id: 'brush', label: 'Brush & Cursor', icon: MousePointer },
    { id: 'symbols', label: 'Hidden Symbols', icon: EyeOff }, // Using EyeOff for Hidden
    { id: 'audio', label: 'Audio Effects', icon: Volume2 },
  ];

  const PRODUCTION_TABS = [
    { id: 'rules', label: 'Game Rules', icon: FileText },
    { id: 'marketing', label: 'Thumbnails', icon: ImageIcon },
  ];

  // Handle direct step navigation
  const handleStepClick = (stepNumber: number) => {
    if (stepNumber !== currentStep) {
      // Use the store's setStep function for reliable navigation
      useGameStore.getState().setStep(stepNumber);
    }
  };

  // Internal navigation handler for sub-tabs
  const handleInternalNext = () => {
    if (useGameStore.getState().gameType === 'scratch') {
      // Step 2: Mechanics & Math (Index 1)
      if (currentStep === 1) {
        if (scratchMechanicStep < MECHANIC_TABS.length - 1) {
          setScratchMechanicStep(scratchMechanicStep + 1);
          return;
        }
      }
      // Step 3: Card Design (Index 2)
      else if (currentStep === 2) {
        if (scratchAestheticStep < AESTHETIC_TABS.length - 1) {
          setScratchAestheticStep(scratchAestheticStep + 1);
          return;
        }
      }
      // Step 4: Gameplay Assets (Index 3)
      else if (currentStep === 3) {
        if (scratchGameplayStep < GAMEPLAY_TABS.length - 1) {
          setScratchGameplayStep(scratchGameplayStep + 1);
          return;
        }
      }
      // Step 5: Production (Index 4)
      else if (currentStep === 4) {
        if (scratchProductionStep < PRODUCTION_TABS.length - 1) {
          setScratchProductionStep(scratchProductionStep + 1);
          return;
        }
      }
    }
    onNextStep();
  };

  const handleInternalPrev = () => {
    if (useGameStore.getState().gameType === 'scratch') {
      // Step 2: Mechanics & Math (Index 1)
      if (currentStep === 1) {
        if (scratchMechanicStep > 0) {
          setScratchMechanicStep(scratchMechanicStep - 1);
          return;
        }
      }
      // Step 3: Card Design (Index 2)
      else if (currentStep === 2) {
        if (scratchAestheticStep > 0) {
          setScratchAestheticStep(scratchAestheticStep - 1);
          return;
        }
      }
      // Step 4: Gameplay Assets (Index 3)
      else if (currentStep === 3) {
        if (scratchGameplayStep > 0) {
          setScratchGameplayStep(scratchGameplayStep - 1);
          return;
        }
      }
      // Step 5: Production (Index 4)
      else if (currentStep === 4) {
        if (scratchProductionStep > 0) {
          setScratchProductionStep(scratchProductionStep - 1);
          return;
        }
      }
    }
    onPrevStep();
  };

  const pixiPreviewSteps = [1, 2, 3, 4, 5, 6, 7, 10, 11, 13];

  return (
    <div className="premium-layout h-screen flex flex-col bg-gray-50 fixed inset-0">
      {/* Premium Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="flex items-center justify-between px-6 h-16 uw:h-24">
          {/* Brand Logo with Navigation Toggle */}
          <BrandLogo
            gameName={gameName}
            showToggle={true}
            className="uw2:w-16 uw2:h-16"
          />
          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Game ID Display */}
            {gameId && gameName !== 'New Game' && (
              <div className="hidden md:flex items-center">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs uw:text-2xl text-gray-600">
                  ID: {gameId}
                </span>
              </div>
            )}

            {/* Home Dashboard */}
            <motion.button
              onClick={() => navigate("/home")}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              whileTap={{ scale: 0.95 }}
              title="Home Dashboard"
              aria-label="Go to home dashboard"
            >
              <Home size={18} className="uw:w-8 uw:h-8" />
            </motion.button>

            {/* Test Game */}
            <motion.button
              onClick={onPreview}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              whileTap={{ scale: 0.95 }}
              title="Test Game"
              aria-label="Preview and test the game"
            >
              <Gamepad2 size={18} className="uw:w-8 uw:h-8" />
            </motion.button>

            {/* Settings */}
            <motion.button
              onClick={() => {/* Open settings */ }}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              whileTap={{ scale: 0.95 }}
              title="Settings"
              aria-label="Open settings"
            >
              <Settings size={18} className="uw:w-8 uw:h-8" />
            </motion.button>

            {/* User */}
            <motion.div
              className="w-8 h-8 uw:w-10 uw:h-10 rounded-full flex items-center justify-center cursor-pointer"
              whileTap={{ scale: 0.95 }}
              style={{ backgroundColor: NINTENDO_RED }}
              role="button"
              tabIndex={0}
              aria-label="User profile"
            >
              <User size={16} className="text-white uw:w-8 uw:h-8" />
            </motion.div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <motion.div
            className="h-full"
            style={{ backgroundColor: NINTENDO_RED }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </header>

      {/* Main Content Area with Side Navigation */}
      <div className="flex-1 flex min-h-0">
        {/* Premium Side Navigation - Animated */}
        <motion.div
          className="bg-white border-r border-gray-200 overflow-y-auto z-40 flex-shrink-0"
          initial={false}
          animate={{
            width: isSidebarCollapsed
              ? 0
              : window.innerWidth >= 3440
                ? 420
                : window.innerWidth >= 2560
                  ? 390
                  : window.innerWidth >= 2200
                    ? 246
                    : 280
          }}

          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.25
          }}
          style={{ overflow: isSidebarCollapsed ? 'hidden' : 'auto' }}
          data-sidebar-type="main"
          data-testid="main-sidebar"
        >
          {!isSidebarCollapsed && (
            <div className="p-5">
              <h2 className="text-xl uw:text-4xl font-bold mb-4" style={{ color: NINTENDO_RED }}>Game Creation</h2>

              {/* Steps List */}
              <div className="space-y-1 mt-6">
                {steps && steps.length > 0 ? (
                  steps.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                      <div
                        key={`step-${index}`}
                        className={`
                            flex items-center p-3 rounded-lg cursor-pointer
                            ${isActive ? 'bg-red-50' : 'hover:bg-gray-50'}
                          `}
                        onClick={() => handleStepClick(index)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleStepClick(index);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Go to step ${index + 1}: ${step.title}`}
                        aria-current={isActive ? 'step' : undefined}
                      >
                        <div
                          className={`
                              w-6 h-6 uw:h-12 uw:w-12 rounded-full flex items-center justify-center mr-3
                              ${isActive
                              ? 'bg-red-500 text-white'
                              : isCompleted
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-600'}
                            `}
                          style={{ backgroundColor: isActive ? NINTENDO_RED : isCompleted ? '#10B981' : '' }}
                        >
                          {isCompleted ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <span className="text-xs uw:text-2xl">{index + 1}</span>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className={`text-base uw:text-3xl font-bold ${isActive ? 'text-red-700' : 'text-gray-900'}`}>
                            {step.title}
                          </div>

                          {isActive && (
                            <div className="text-sm uw:text-xl text-gray-500 mt-1">{step.description}</div>
                          )}
                        </div>

                        {isActive && (
                          <div
                            className="w-1.5 h-10  rounded-full"
                            style={{ backgroundColor: NINTENDO_RED }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    );
                  })
                ) : (
                  /* Fallback for when steps are not passed (legacy/error state) */
                  Array.from({ length: totalSteps }).map((_, index) => (
                    // ... keep simple fallback or simply return null to avoid errors
                    <div key={index} className="p-2 text-red-500">Steps not loaded</div>
                  ))
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Vertical Step Sidebar - Only visible when main sidebar is collapsed */}
        {isSidebarCollapsed && (
          <div className="relative z-30 flex-shrink-0">
            <VerticalStepSidebar
              currentStep={currentStep}
              totalSteps={totalSteps}
              onStepClick={handleStepClick}
            />
          </div>
        )}

        {/* Main Content with Header and Workspace */}
        <div
          className="flex-1 flex flex-col min-w-0 min-h-0"
          data-content-shifted={isSidebarCollapsed ? 'true' : 'false'}
          data-sidebar-state={isSidebarCollapsed ? 'closed' : 'open'}
          data-testid="sidebar-content-container"
        >
          {/* Step Header with Title and Navigation Controls */}
          <div className="bg-white border-b border-gray-200 p-2 flex justify-between items-center">
            <div className='flex items-baseline gap-3'>
              <h1 className="text-xl uw:text-4xl font-bold text-gray-900">{stepTitle}</h1>
              <p className="text-sm text-gray-400 uw:text-xl border-l border-gray-300 pl-3">{stepDescription}</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 px-3 py-1 rounded-full uw:px-6 uw:py-2 text-sm uw:text-2xl ">
                Step {currentStep + 1} of {totalSteps}
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs (Moved from Footer) */}
          {gameType === 'scratch' && (
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {/* Step 2: Mechanics & Math */}
              {currentStep === 1 && MECHANIC_TABS.map((step, idx) => {
                const isActive = idx === scratchMechanicStep;
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setScratchMechanicStep(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-bold transition-all whitespace-nowrap
                                      ${isActive
                        ? 'bg-red-50 text-red-600 shadow-sm border border-red-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                                  `}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="">{step.label}</span>
                  </button>
                );
              })}

              {/* Step 3: Card Design */}
              {currentStep === 2 && AESTHETIC_TABS.map((step, idx) => {
                const isActive = idx === scratchAestheticStep;
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setScratchAestheticStep(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-bold transition-all whitespace-nowrap
                                      ${isActive
                        ? 'bg-purple-50 text-purple-600 shadow-sm border border-purple-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                                  `}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="">{step.label}</span>
                  </button>
                );
              })}

              {/* Step 4: Gameplay Assets */}
              {currentStep === 3 && GAMEPLAY_TABS.map((step, idx) => {
                const isActive = idx === scratchGameplayStep;
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setScratchGameplayStep(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-bold transition-all whitespace-nowrap
                                      ${isActive
                        ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                                  `}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="">{step.label}</span>
                  </button>
                );
              })}

              {/* Step 5: Production */}
              {currentStep === 4 && PRODUCTION_TABS.map((step, idx) => {
                const isActive = idx === scratchProductionStep;
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setScratchProductionStep(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-bold transition-all whitespace-nowrap
                                      ${isActive
                        ? 'bg-green-50 text-green-600 shadow-sm border border-green-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                                  `}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="">{step.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Workspace Split View */}
          <div className="flex-1 flex min-h-0 relative" ref={containerRef}>
            {/* Main Content Area - Flexible Width */}
            <div
              className={`${showCanvas && !(gameType === 'scratch' && currentStep === 1 && scratchMechanicStep >= 3) ? 'border-r border-gray-200' : ''} overflow-y-auto`}
              style={{
                width: showCanvas && !(gameType === 'scratch' && currentStep === 1 && scratchMechanicStep >= 3) ? `${splitRatio}%` : '100%',
                flex: 'none' // Disable flex grow/shrink to respect width
              }}
            >
              {children}
            </div>

            {/* Drag Handle */}
            {showCanvas && !(gameType === 'scratch' && currentStep === 1 && scratchMechanicStep >= 3) && (
              <div
                className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize z-50 flex items-center justify-center transition-colors hover:w-1.5 active:bg-blue-600 active:w-1.5"
                onMouseDown={handleMouseDown}
                title="Drag to resize"
              >
                <div className="h-8 w-1 bg-gray-400 rounded-full" />
              </div>
            )}

            {/* Canvas Area */}
            {showCanvas && (
              // Logic check: Paytable (idx 3), Math (idx 4), Sim (idx 5) in Step 1 need to hide preview?
              // User said "when it comes to Paytable ( do not provide the Scratch Card Preview )"
              // That implies currentStep === 1 && scratchMechanicStep === 3

              !((gameType === 'scratch' && currentStep === 1 && scratchMechanicStep >= 3)) && (
                <div
                  className="bg-gray-100 flex flex-col relative"
                  id={`right-panel-step-${currentStep}`}
                  data-testid={`right-panel-step-${currentStep}`}
                  data-step-number={currentStep}
                  style={{
                    width: `${100 - splitRatio}%`,
                    height: '100%',
                    overflow: (gameType === 'scratch') ? 'visible' : 'hidden',
                    position: 'relative',
                    flex: 'none',
                    zIndex: (gameType === 'scratch') ? 50 : 0
                  }}
                >


                  {pixiPreviewSteps.includes(currentStep) && (
                    useGameStore.getState().gameType === 'scratch' ? (
                      <ScratchGridPreview
                        key={`preview-scratch-${currentStep}-${scratchMechanicStep}`}
                        mode={
                          currentStep === 2 ? 'assets' :  // Step 3 (Index 2) Aesthetics
                            currentStep === 3 ? 'assets' :  // Step 4 (Index 3) Gameplay Assets
                              currentStep === 1 ? (
                                scratchMechanicStep <= 1 ? 'layout' : 'mechanics'
                              ) :
                                'layout'
                        } />
                    ) : (
                      <SlotMachinePreview />
                    )
                  )}
                </div>
              )
            )}
          </div>

          {/* Bottom Navigation Controls */}
          {currentStep === 10 ? (
            <Stepper
              currentAudioTab={useGameStore.getState().currentAudioTab}
              setCurrentAudioTab={useGameStore.getState().setCurrentAudioTab}
              answers={useGameStore.getState().audioAnswers}
              onNextStep={onNextStep}
              onPrevStep={onPrevStep}
              skipSound={useGameStore.getState().skipSound}
            />
          ) : (
            <div className="bg-white border-t border-gray-200 p-2 flex justify-between items-center">
              {/* Standard navigation for other steps */}
              <button
                onClick={handleInternalPrev}
                disabled={currentStep === 0}
                className={`
                    flex items-center uw:px-6 uw:py-3 px-4 py-2 rounded-lg
                    ${currentStep === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}
                  `}
              >
                <ChevronLeft className="mr-1 w-5 h-5 uw:w-10 uw:h-10" />

                <span className='uw:text-3xl'>Previous</span>
              </button>

              <div className="flex space-x-3 items-center flex-1 justify-center px-4">
                {/* Tab Rendering Logic */}



                {currentStep >= 5 && ( // Replaced >= 4 with >= 5 to hide Test/Exporter for Step 5 (Index 4)
                  <div className='flex gap-2'>
                    <button
                      onClick={onPreview}
                      className="px-4 py-2 rounded-lg flex items-center bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play size={18} className="mr-1.5" />
                      <span>Test Game</span>
                    </button>
                    <button
                      onClick={() => useGameStore.getState().setShowStandaloneGameModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700"
                    >
                      <Play className="w-4 h-4" />
                      Exporter
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleInternalNext}
                disabled={currentStep === totalSteps - 1}
                className={`
                    flex items-center uw:px-6 uw:py-3 py-2.5 px-5 rounded-md transition
                    ${currentStep === totalSteps - 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white font-semibold'}
                  `}
                style={{
                  backgroundColor: currentStep === totalSteps - 1 ? undefined : NINTENDO_RED,
                }}
              >
                <span className="uw:text-3xl">{currentStep === totalSteps - 1 ? 'Complete' : 'Next Step'}</span>
                <ChevronRight size={18} className="ml-1.5 uw:w-10 uw:h-10" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PremiumLayout;