import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store';
import VisualJourney from './visual-journey/VisualJourney';
import { motion } from 'framer-motion';
import { Loader, Home } from 'lucide-react';

/**
 * SlotCreator Component
 * This component acts as a wrapper for the slot creation experience
 * It handles URL parameters for step navigation and ensures authentication
 */
const SlotCreator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setGameType = useGameStore((state) => state.setGameType);
  const setStep = useGameStore((state) => state.setStep);
  const currentStep = useGameStore((state) => state.currentStep);
  const config = useGameStore((state) => state.config);
  const updateConfig = useGameStore((state) => state.updateConfig);

  // Session initialization and validation states
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [sessionValid, setSessionValid] = useState(false);
  
  // Cache gameId in component state to preserve it across re-renders
  const [cachedGameId, setCachedGameId] = useState<string | null>(null);

  // Helper function to safely log circular structures
  function getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      return value;
    };
  }

  // Store the gameId in localStorage to ensure persistence
  const persistGameSession = (gameId: string, configData: any) => {
    console.log(`🔐 Persisting game session: ${gameId}`);
    
    try {
      // Save both as active session and in session storage
      localStorage.setItem('slotai_active_session', gameId);
      localStorage.setItem(`slotai_session_${gameId}`, JSON.stringify({
        gameId,
        config: configData,
        created: Date.now(),
        lastModified: Date.now()
      }));
      
      // Set in component state as well
      setCachedGameId(gameId);
      return true;
    } catch (error) {
      console.error('Failed to persist game session:', error);
      return false;
    }
  };

  // Get the effective gameId, prioritizing cached value to ensure consistency
  const effectiveGameId = useMemo(() => {
    // First check component cache
    if (cachedGameId) {
      console.log(`📦 Using cached gameId: ${cachedGameId}`);
      return cachedGameId;
    }
    
    // Then check store
    if (config.gameId) {
      console.log(`🔄 Using config gameId: ${config.gameId}`);
      return config.gameId;
    }
    
    // Finally check localStorage
    const activeSessionId = localStorage.getItem('slotai_active_session');
    if (activeSessionId) {
      console.log(`💾 Using localStorage gameId: ${activeSessionId}`);
      return activeSessionId;
    }
    
    console.log('⚠️ No gameId found in any storage location');
    return null;
  }, [cachedGameId, config.gameId]);

  // Handle initialization and URL parameters - ONLY for the /new-game route
  useEffect(() => {
    console.log('🚀 SlotCreator component mounted - initializing game creation');
    
    // Explicitly set the game type for the slot creator to ensure we're in the right mode
    setGameType('visual_journey');
    
    // Parse step from URL parameters
    const params = new URLSearchParams(location.search);
    const stepParam = params.get('step');
    const forceParam = params.get('force') === 'true';
    const gameParam = params.get('game');
    const templateParam = params.get('template');
    
    // Log parameters and current state
    console.log(`🔍 SlotCreator: URL parameters - step: ${stepParam}, force: ${forceParam}, game: ${gameParam}, template: ${templateParam}`);
    console.log(`🔍 Current effective gameId: ${effectiveGameId}`);
    try {
      console.log('🔍 Current config state:', JSON.stringify(config, getCircularReplacer()));
    } catch (e) {
      console.warn("Couldn't stringify config due to circular reference", e);
    }
    
    // Load existing session or create a new one
    let shouldCreateNewSession = !effectiveGameId;
    
    // If specific game ID provided in URL, try to load it
    if (gameParam && !shouldCreateNewSession) {
      try {
        console.log(`🔄 Attempting to load game data for: ${gameParam}`);
        // Attempt to load game data from localStorage
        const saveKey = `slotai_save_${gameParam}`;
        const savedGame = localStorage.getItem(saveKey);
        
        if (savedGame) {
          const gameData = JSON.parse(savedGame);
          console.log(`✅ Successfully loaded game data for: ${gameParam}`);
          
          // Update the store with the game data
          if (gameData.config) {
            updateConfig(gameData.config);
            
            // Persist this game ID
            persistGameSession(gameParam, gameData.config);
            setSessionInitialized(true);
            shouldCreateNewSession = false;
          }
        } else {
          console.log(`⚠️ No saved game found for: ${gameParam}`);
          shouldCreateNewSession = true;
        }
      } catch (err) {
        console.error('❌ Error loading game data:', err);
        shouldCreateNewSession = true;
      }
    }
    
    // Create a new game session if needed
    if (shouldCreateNewSession) {
      console.log('🆕 Creating new game session');
      const newGameId = `game_${Date.now()}`;
      
      // Create a new configuration with required fields
      const newConfig = {
        gameId: newGameId,
        displayName: 'New Slot Game',
        gameType: 'slots',
        selectedGameType: 'classic-reels',
        theme: {
          selectedThemeId: 'ancient-egypt',
          mainTheme: 'ancient-egypt',
          artStyle: 'cartoon',
          colorScheme: 'warm-vibrant',
          mood: 'playful'
        }
      };
      
      // Update the store
      updateConfig(newConfig);
      
      // Persist the new session
      persistGameSession(newGameId, newConfig);
      console.log(`✅ Created new session with gameId: ${newGameId}`);
      setSessionInitialized(true);
    }
    
    // Apply template if provided
    if (templateParam) {
      console.log(`🔄 Initializing with template: ${templateParam}`);
      
      // Ensure theme is set
      if (!config.theme || !config.theme.selectedThemeId) {
        updateConfig({
          theme: {
            selectedThemeId: 'ancient-egypt',
            mainTheme: 'ancient-egypt',
            artStyle: 'cartoon',
            colorScheme: 'warm-vibrant',
            mood: 'playful'
          }
        });
      }
    }
    
    // Set the step from URL or default to 0
    if (stepParam) {
      const targetStep = parseInt(stepParam, 10);
      console.log(`🔢 Setting step to: ${targetStep}`);
      
      // Set the step after a small delay to ensure store is initialized
      setTimeout(() => {
        setStep(targetStep);
      }, 300);
    } else {
      console.log('🔢 No step parameter, defaulting to step 0');
      setStep(0);
    }
    
    // Initialization complete
    setIsInitializing(false);
  }, [navigate, location.search, setGameType, setStep, effectiveGameId, updateConfig]);

  // Validate session after initialization completes
  useEffect(() => {
    // Skip validation while still initializing
    if (isInitializing) return;
    
    console.log('🔍 Validating game session');
    
    const validateSession = () => {
      // First check for cached gameId
      if (cachedGameId) {
        console.log(`🔍 Validating cached gameId: ${cachedGameId}`);
        const sessionData = localStorage.getItem(`slotai_session_${cachedGameId}`);
        if (sessionData) {
          console.log('✅ Session valid (cached gameId)');
          return true;
        }
      }
      
      // Then check store config
      if (config.gameId) {
        console.log(`🔍 Validating config gameId: ${config.gameId}`);
        const sessionData = localStorage.getItem(`slotai_session_${config.gameId}`);
        if (sessionData) {
          // Make sure it's also set as cached gameId for future reference
          setCachedGameId(config.gameId);
          console.log('✅ Session valid (config gameId)');
          return true;
        }
      }
      
      // Finally check active session
      const activeSessionId = localStorage.getItem('slotai_active_session');
      if (activeSessionId) {
        console.log(`🔍 Validating active session: ${activeSessionId}`);
        const sessionData = localStorage.getItem(`slotai_session_${activeSessionId}`);
        if (sessionData) {
          // Make sure it's also set as cached gameId for future reference
          setCachedGameId(activeSessionId);
          
          // And update config if needed
          if (!config.gameId) {
            try {
              const parsedData = JSON.parse(sessionData);
              if (parsedData.config) {
                updateConfig(parsedData.config);
              }
            } catch (error) {
              console.error('Failed to parse session data:', error);
            }
          }
          
          console.log('✅ Session valid (active session)');
          return true;
        }
      }
      
      console.error('❌ No valid game session found');
      return false;
    };
    
    const isValid = validateSession();
    setSessionValid(isValid);
    
    // If not valid after initialization complete, redirect to home
    if (!isValid && !isInitializing) {
      console.error('❌ No valid game session after initialization, redirecting to home');
      navigate('/home');
    }
  }, [isInitializing, config, cachedGameId, navigate, updateConfig]);

  // Show loading spinner during initialization or if session is invalid
  if (isInitializing || !sessionValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-10 w-10 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {isInitializing ? 'Initializing game session...' : 'Validating session...'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <header className="bg-white py-2 px-4 shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-20">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                // Always clear the game type when navigating back to the dashboard
                setGameType(null);
                
                // Navigate to the dedicated dashboard route
                navigate('/home');
              }}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </button>
            
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            
            {/* Display current step */}
            <div className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
              Step {currentStep + 1}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Home Dashboard Icon */}
            <button 
              onClick={() => navigate('/home')}
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              title="Home Dashboard"
            >
              <Home size={18} />
            </button>
            
            {/* Logout Button */}
            <button 
              onClick={() => {
                localStorage.removeItem('slotai_password');
                navigate('/login');
              }}
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              title="Logout"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-screen-xl mx-auto p-4">
        <React.Suspense 
          fallback={
            <div className="p-8 flex justify-center">
              <Loader className="animate-spin h-8 w-8 text-red-600" />
            </div>
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 bg-white rounded-lg shadow border border-gray-100"
          >
            <VisualJourney />
          </motion.div>
        </React.Suspense>
      </main>
    </div>
  );
};

export default SlotCreator;