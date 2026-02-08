import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store';
import { logNav } from './navlog';
import { directLog } from './DirectDebugLogger';

/**
 * FixedNavigationHandler Component
 * 
 * This component fixes the navigation issues between steps in the SlotAI application by:
 * 1. Directly interacting with the Next button to ensure click events register
 * 2. Fixing state synchronization issues between component state and global store
 * 3. Properly preserving the theme and game type selections during navigation
 * 4. Eliminating race conditions in timeouts and state updates
 * 
 * This is designed as a persistent, always-present component that proactively
 * manages navigation for the entire journey, not just Step 1 to Step 2.
 */
const FixedNavigationHandler: React.FC = () => {
  const { currentStep, config, setStep, updateConfig } = useGameStore();
  const fixAppliedRef = useRef(false);
  const hasBeenMountedRef = useRef(false);
  const debugModeRef = useRef(false);
  
  // Set this to true to enable detailed console logging
  const ENABLE_DEBUG = true;

  // Debug logging helper - now uses multiple persistent logging methods
  const log = (message: string, data?: any) => {
    if (!ENABLE_DEBUG) return;
    // Log to console
    console.log(`🛠️ [NavFix] ${message}`, data ? data : '');
    // Log to persistent storage using both methods
    logNav(`[NavFix] ${message}`, data);
    directLog(`[NavFix] ${message}`, data);
  };
  
  /**
   * Fix navigation to work around React component re-render issues
   */
  const fixNextButtonAndNavigation = () => {
    log(`Step ${currentStep}: Applying next button fix`);
    
    // Find all potential Next buttons - try various approaches to find the correct one
    const findNextButton = () => {
      log(`Finding Next button for Step ${currentStep}`);
      
      // Strategy 0: Look for buttons with our special data attribute - highest priority
      const dataAttributeButton = document.querySelector('button[data-next-button="true"]');
      if (dataAttributeButton && dataAttributeButton instanceof HTMLButtonElement) {
        log('Found button via data attribute', dataAttributeButton);
        return dataAttributeButton;
      }
      
      // Strategy 0.5: Look for recently clicked next buttons (marked by our enhanced onClick handler)
      const recentlyClickedButton = document.querySelector('button[data-next-clicked="true"]');
      if (recentlyClickedButton && recentlyClickedButton instanceof HTMLButtonElement) {
        log('Found recently clicked next button', recentlyClickedButton);
        return recentlyClickedButton;
      }
      
      // Strategy for Step 1 (Theme Selection) - most critical step
      if (currentStep === 0) {
        log('Finding Next button for Step 0 (Theme Selection)');
        
        // Strategy 1: Look for the main Next button at the bottom right with specific styling
        const redNextButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
          const computedStyle = window.getComputedStyle(btn);
          const rect = btn.getBoundingClientRect();
          
          // Look for red/blue themed button at bottom right
          const isRedOrBlue = 
            computedStyle.backgroundColor.includes('rgb(220') || 
            computedStyle.backgroundColor.includes('rgb(230') || 
            computedStyle.backgroundColor.includes('rgb(59') ||  // Blue tones
            computedStyle.backgroundColor.includes('rgb(29') || 
            btn.className.includes('bg-red') ||
            btn.className.includes('bg-blue') ||
            btn.className.includes('bg-gradient');
          
          const isBottomRight = 
            rect.bottom > window.innerHeight * 0.6 && 
            rect.right > window.innerWidth * 0.5;
            
          const hasNextText = 
            btn.textContent?.includes('Next') || 
            btn.textContent?.includes('Continue') || 
            btn.textContent?.includes('Game Type');
          
          return isRedOrBlue && isBottomRight && hasNextText;
        });
        
        if (redNextButtons.length > 0) {
          log('Found button via style and position', redNextButtons[0]);
          return redNextButtons[0] as HTMLButtonElement;
        }
        
        // Strategy 2: Look for content text that's specific to the button we want
        const contentButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
          btn.textContent?.includes('Continue to Game Type') || 
          btn.textContent?.includes('Next') && btn.textContent?.includes('Game Type')
        );
        
        if (contentButtons.length > 0) {
          log('Found button via text content', contentButtons[0]);
          return contentButtons[0] as HTMLButtonElement;
        }
        
        // Strategy 3: Check if we're in EnhancedThemeSelection with special styling
        const enhancedButton = document.querySelector('button.bg-gradient-to-r.from-red-600.to-red-700');
        if (enhancedButton && enhancedButton instanceof HTMLButtonElement) {
          log('Found enhanced theme selection button', enhancedButton);
          return enhancedButton;
        }
      }
      
      // For other steps, find the generic Next button in the navigation footer
      const genericNextButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const hasChevron = btn.querySelector('svg.lucide-chevron-right');
        const hasNextText = btn.textContent?.includes('Next');
        return hasChevron && hasNextText;
      });
      
      if (genericNextButtons.length > 0) {
        log(`Found generic Next button for step ${currentStep}`, genericNextButtons[0]);
        return genericNextButtons[0] as HTMLButtonElement;
      }
      
      // Last resort: Find any buttons in the footer area
      const footerButtons = Array.from(document.querySelectorAll('.visual-journey-container > div:last-child button')).filter(btn => {
        // Avoid the Previous button
        return !btn.textContent?.includes('Previous');
      });
      
      if (footerButtons.length > 0) {
        log('Found button in footer area (last resort)', footerButtons[footerButtons.length - 1]);
        return footerButtons[footerButtons.length - 1] as HTMLButtonElement;
      }
      
      log('No Next button found');
      return null;
    };
    
    // Create an improved click handler that correctly advances to the next step
    const createImprovedClickHandler = (originalButton: HTMLButtonElement) => {
      return (e: MouseEvent) => {
        // Stop propagation to prevent any potential event conflicts
        e.preventDefault();
        e.stopPropagation();
        log('🔄 Fixed Next button clicked - direct navigation mode');

        try {
          // Step 1: Ensure we have all required data in the store
          ensureRequiredDataExists();
          
          // Step 2: Save the current step's progress - use a reference to the store
          // Create a fresh reference to the store to avoid stale closures
          const store = useGameStore.getState();
          const previousStep = store.currentStep;
          log('Current state before navigation', {
            currentStep: store.currentStep,
            config: {
              gameId: store.config.gameId,
              theme: store.config.theme?.selectedThemeId,
              selectedGameType: store.config.selectedGameType || 'classic-reels' // Ensure default is set
            }
          });
          
          // Save progress (extended with more information)
          try {
            // Extended save with more details
            const extendedSaveData = {
              ...store.savedProgress,
              [currentStep]: {
                config: store.config,
                timestamp: new Date(),
                details: {
                  step: currentStep,
                  theme: store.config.theme?.selectedThemeId,
                  gameType: store.config.selectedGameType || 'classic-reels',
                  gameId: store.config.gameId
                }
              }
            };
            
            // Update saved progress directly - use setState pattern for atomic updates
            useGameStore.setState(state => ({
              ...state,
              savedProgress: extendedSaveData,
              hasUnsavedChanges: false
            }));
            
            log('Extended progress saved successfully');
          } catch (saveError) {
            log('Error during extended save:', saveError);
            // Fallback to standard save - use the store reference we captured
            store.saveProgress();
          }
          
          // Step 3: Directly update the store with the new step using multiple approaches
          const targetStep = currentStep + 1;
          log(`🔄 Navigating to step ${targetStep} using multi-layered approach`);
          
          // Approach 1: Direct setState for maximum reliability
          useGameStore.setState(state => ({
            ...state,
            currentStep: targetStep,
            savedProgress: {
              ...state.savedProgress,
              [currentStep]: {
                config: state.config,
                timestamp: new Date()
              }
            }
          }));
          
          // Approach 2: Also use the official setStep method as backup
          setTimeout(() => {
            useGameStore.getState().setStep(targetStep);
          }, 20);
          
          // Approach 3: If we're on step 0, force classic-reels selection to ensure Step 2 works
          if (currentStep === 0) {
            setTimeout(() => {
              const currentConfig = useGameStore.getState().config;
              if (!currentConfig.selectedGameType) {
                log('🔄 Fixing missing game type selection for Step 2');
                useGameStore.getState().updateConfig({
                  selectedGameType: 'classic-reels',
                  gameTypeInfo: {
                    id: 'classic-reels',
                    title: 'Classic Reels',
                    description: '5x3 grid with payline wins',
                    features: ['Multiple paylines', 'Traditional symbols', 'Familiar mechanics'],
                    selectedAt: new Date().toISOString()
                  }
                });
              }
            }, 50);
          }
          
          // Step 4: Verify navigation success and fix if needed
          setTimeout(() => {
            // Get a fresh reference to the store state for verification
            const storeState = useGameStore.getState();
            const newStep = storeState.currentStep;
            log(`🔄 Navigation verification: ${previousStep} -> ${newStep} (target: ${targetStep})`);
            
            if (newStep !== targetStep) {
              log('🔄 Navigation failed, using fallback approaches');
              
              // Approach 4: Try nextStep method with fresh store reference
              storeState.nextStep();
              
              // Approach 5: Force direct URL navigation if all else fails
              setTimeout(() => {
                // Get another fresh reference for final check
                const finalStoreState = useGameStore.getState();
                const finalStep = finalStoreState.currentStep;
                if (finalStep !== targetStep) {
                  log('🔄 All navigation methods failed, using direct URL navigation');
                  const navUrl = new URL(window.location.href);
                  navUrl.searchParams.set('step', targetStep.toString());
                  navUrl.searchParams.set('force', 'true');
                  navUrl.searchParams.set('t', Date.now().toString()); // Cache buster
                  window.location.href = navUrl.toString();
                }
              }, 150);
            } else {
              log('🔄 Navigation successful!');
            }
          }, 100);
        } catch (error) {
          log('🔄 Critical error during navigation', error);
          
          // Last resort - emergency URL navigation
          window.location.href = `/?step=${currentStep + 1}&force=true&emergency=true&t=${Date.now()}`;
        }
      };
    };
    
    // Ensure we have all required data before navigation
    const ensureRequiredDataExists = () => {
      const store = useGameStore.getState();
      const updates: any = {};
      let needsUpdate = false;
      
      // Ensure game ID exists - always needed regardless of current step
      if (!store.config.gameId) {
        const theme = store.config?.theme?.mainTheme || 'mygame';
        const baseId = theme.toLowerCase().replace(/\s+/g, '-');
        const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const newGameId = `${baseId}_${formattedDate}`;
        
        log(`🔄 Auto-generating gameId: ${newGameId}`);
        updates.gameId = newGameId;
        updates.displayName = store.config?.theme?.mainTheme || 'My Game';
        needsUpdate = true;
      }
      
      // Ensure theme exists - always needed regardless of current step
      if (!store.config?.theme?.selectedThemeId) {
        log('🔄 Setting default theme');
        updates.theme = {
          ...store.config.theme || {},
          mainTheme: 'Default Theme',
          description: 'A default theme',
          selectedThemeId: 'default-theme',
          colors: {
            primary: '#E60012',
            secondary: '#0052cc',
            accent: '#ff6600',
            background: '#ffffff'
          }
        };
        needsUpdate = true;
      }
      
      // Always ensure game type exists - critical for proper step 0->1 navigation
      if (!store.config.selectedGameType) {
        log('🔄 Setting default game type: classic-reels (required for step navigation)');
        updates.selectedGameType = 'classic-reels';
        updates.gameTypeInfo = {
          id: 'classic-reels',
          title: 'Classic Reels',
          description: '5x3 grid with payline wins',
          features: ['Multiple paylines', 'Traditional symbols', 'Familiar mechanics'],
          selectedAt: new Date().toISOString()
        };
        
        // Also add reels configuration required by the game type
        updates.reels = {
          ...(store.config.reels || {}),
          payMechanism: 'betlines',
          layout: {
            shape: 'rectangle',
            reels: 5,
            rows: 3
          },
          betlines: 20
        };
        
        needsUpdate = true;
      }
      
      // Apply all updates at once
      if (needsUpdate) {
        log('🔄 Applying critical data updates before navigation', updates);
        
        // Use direct state update for maximum reliability
        useGameStore.setState(state => ({
          ...state,
          config: {
            ...state.config,
            ...updates
          }
        }));
        
        // Also use the standard update method for completeness
        setTimeout(() => {
          store.updateConfig(updates);
        }, 10);
      }
      
      // Double-check that game type is set - this is critical for Step 2
      setTimeout(() => {
        const updatedConfig = useGameStore.getState().config;
        if (!updatedConfig.selectedGameType) {
          log('🔄 CRITICAL: Game type still not set, forcing update one more time');
          
          // Last attempt to fix missing game type
          useGameStore.getState().updateConfig({
            selectedGameType: 'classic-reels',
            gameTypeInfo: {
              id: 'classic-reels',
              title: 'Classic Reels',
              description: '5x3 grid with payline wins',
              features: ['Multiple paylines', 'Traditional symbols', 'Familiar mechanics'],
              selectedAt: new Date().toISOString()
            }
          });
        }
      }, 50);
    };
    
    // Find and fix the next button
    setTimeout(() => {
      const nextButton = findNextButton();
      
      if (nextButton) {
        try {
          log('Found Next button, replacing with fixed version');
          
          // Instead of creating a cloned button (which can lead to issues with event listeners),
          // we'll directly add our improved click handler to the existing button
          
          // First, store a reference to the original click handler
          const originalOnClick = nextButton.onclick;
          
          // Now, replace the onclick handler with our improved one
          nextButton.onclick = (e) => {
            // Prevent the original handler from firing
            e.preventDefault();
            e.stopPropagation();
            
            // Log that we're using our fixed handler
            log('🔄 Intercepted Next button click with improved handler');
            
            // Create and execute our improved handler
            const improvedHandler = createImprovedClickHandler(nextButton);
            improvedHandler(e as MouseEvent);
          };
          
          // Add a visual indicator to show the button is fixed
          const indicatorId = 'nav-fix-indicator';
          if (!document.getElementById(indicatorId)) {
            const indicator = document.createElement('span');
            indicator.id = indicatorId;
            indicator.style.cssText = `
              position: absolute;
              top: -3px;
              right: -3px;
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background-color: #22c55e;
              box-shadow: 0 0 5px rgba(34, 197, 94, 0.8);
            `;
            
            // Only add the indicator if the button has position relative
            const buttonStyle = window.getComputedStyle(nextButton);
            if (buttonStyle.position !== 'relative') {
              nextButton.style.position = 'relative';
            }
            
            nextButton.appendChild(indicator);
          }
          
          // Mark the fix as applied
          fixAppliedRef.current = true;
          log('Next button successfully fixed');
          
          // Add a data attribute to indicate this button has been fixed
          nextButton.setAttribute('data-nav-fixed', 'true');
        } catch (err) {
          log('Error fixing button', err);
          
          // Try an alternative approach - use direct event listener
          try {
            log('Trying alternative approach with direct event listener');
            
            // First, check if we've already applied this alternative fix
            if (!nextButton.hasAttribute('data-alt-fix-applied')) {
              // Remove any existing click listeners by using the capture option
              const captureListener = (e: Event) => {
                e.stopPropagation();
                e.preventDefault();
                
                // Remove this listener after it's used once
                nextButton.removeEventListener('click', captureListener, true);
                
                // Apply our improved handler
                const improvedHandler = createImprovedClickHandler(nextButton);
                improvedHandler(e as MouseEvent);
              };
              
              // Add our capture listener - this will run before other listeners
              nextButton.addEventListener('click', captureListener, true);
              
              // Mark this button as having the alternative fix applied
              nextButton.setAttribute('data-alt-fix-applied', 'true');
              
              // Mark the fix as applied
              fixAppliedRef.current = true;
              log('Alternative next button fix successfully applied');
            }
          } catch (altErr) {
            log('Alternative fix also failed', altErr);
          }
        }
      } else {
        // Button not found, retry after a delay
        setTimeout(() => {
          if (!fixAppliedRef.current) {
            fixNextButtonAndNavigation();
          }
        }, 1000);
      }
    }, 1000);
  };

  /**
   * Preserve critical selection state during all component mounts and updates
   */
  const preserveSelectionState = () => {
    if (!hasBeenMountedRef.current) {
      hasBeenMountedRef.current = true;
      log('Initial component mount, preserving state');
      
      // Always ensure classic-reels is selected as default game type
      setTimeout(() => {
        const store = useGameStore.getState();
        
        // Only apply default if no game type is selected
        if (!store.config.selectedGameType && currentStep === 1) {
          log('Setting default game type: classic-reels');
          store.updateConfig({
            selectedGameType: 'classic-reels',
            gameTypeInfo: {
              id: 'classic-reels',
              title: 'Classic Reels',
              description: '5x3 grid with payline wins',
              features: ['Multiple paylines', 'Traditional symbols', 'Familiar mechanics'],
              selectedAt: new Date().toISOString()
            }
          });
          
          // Visual update of the selected card
          setTimeout(() => {
            const selectedCard = document.querySelector('[data-game-type="classic-reels"]');
            if (selectedCard) {
              selectedCard.classList.add('ring-4', 'ring-green-500', 'shadow-lg', 'scale-[1.02]');
            }
          }, 200);
        }
      }, 500);
    }
  };

  // Manually navigate to the next step - can be called from outside this component
  const manuallyNavigateToNextStep = () => {
    log('🔄 Manual navigation to next step triggered');
    
    // Ensure we have all required data
    ensureRequiredDataExists();
    
    // Calculate the target step
    const targetStep = currentStep + 1;
    log(`🔄 Manual navigation to step ${targetStep}`);
    
    // Use direct state update for maximum reliability
    useGameStore.setState(state => ({
      ...state,
      currentStep: targetStep,
      savedProgress: {
        ...state.savedProgress,
        [currentStep]: {
          config: state.config,
          timestamp: new Date()
        }
      }
    }));
    
    // Also use the official setStep method as backup
    setTimeout(() => {
      useGameStore.getState().setStep(targetStep);
    }, 20);
    
    // Verify and fix if needed
    setTimeout(() => {
      const newStep = useGameStore.getState().currentStep;
      if (newStep !== targetStep) {
        log('🔄 Manual navigation failed, using fallback');
        
        // Try nextStep method
        useGameStore.getState().nextStep();
        
        // Force direct URL navigation if all else fails
        setTimeout(() => {
          const finalStep = useGameStore.getState().currentStep;
          if (finalStep !== targetStep) {
            log('🔄 All manual navigation methods failed, using direct URL');
            window.location.href = `/?step=${targetStep}&force=true&t=${Date.now()}`;
          }
        }, 150);
      } else {
        log('🔄 Manual navigation successful!');
      }
    }, 100);
  };

  // Add manual navigation method to window for emergency use
  useEffect(() => {
    // @ts-ignore
    window.manuallyNavigateToNextStep = manuallyNavigateToNextStep;
    
    return () => {
      // @ts-ignore
      delete window.manuallyNavigateToNextStep;
    };
  }, [currentStep]);

  // Initialization logic - using multiple effects for better reliability
  
  // Critical first-run initialization
  useEffect(() => {
    log(`🔄 Component mounted on step ${currentStep} - initializing navigation fixes`);
    
    // Always preserve selection state across steps
    preserveSelectionState();
    
    // Check for URL parameters that might indicate emergency navigation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('debug') || urlParams.has('force')) {
      debugModeRef.current = true;
      log('🔄 Debug/Force mode enabled via URL parameter');
    }
    
    // Set a more aggressive initialization for critical steps
    if (currentStep === 0) {
      log('🔄 Critical initial step 0 - applying aggressive navigation fix');
      // Run the fix multiple times to ensure it catches the button
      fixNextButtonAndNavigation();
      
      // Schedule additional fixes with increasing delays for reliability
      setTimeout(fixNextButtonAndNavigation, 500);
      setTimeout(fixNextButtonAndNavigation, 1500);
      setTimeout(fixNextButtonAndNavigation, 3000);
    } else {
      // For other steps, run the fix once immediately and once after a delay
      fixNextButtonAndNavigation();
      setTimeout(fixNextButtonAndNavigation, 1000);
    }
    
    // Clean up on unmount
    return () => {
      fixAppliedRef.current = false;
      log('🔄 Component unmounted, cleaning up');
    };
  }, []); // Only run once on mount for the initial fix
  
  // Step-specific updates when step changes
  useEffect(() => {
    log(`🔄 Step changed to ${currentStep} - refreshing navigation fixes`);
    
    // Reset the fix applied flag to ensure we try again
    fixAppliedRef.current = false;
    
    // Apply fixes
    preserveSelectionState();
    fixNextButtonAndNavigation();
    
    // Schedule an additional fix after any animations complete
    setTimeout(fixNextButtonAndNavigation, 700);
  }, [currentStep]);
  
  // Config-specific updates to ensure data consistency
  useEffect(() => {
    // Only run when config changes in a meaningful way
    if (config?.theme?.selectedThemeId || config?.selectedGameType || config?.gameId) {
      log('🔄 Config changed - ensuring navigation is updated');
      fixNextButtonAndNavigation();
    }
  }, [
    config?.theme?.selectedThemeId, 
    config?.selectedGameType, 
    config?.gameId
  ]);
  
  // DOM polling effect to constantly check for new buttons
  useEffect(() => {
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    
    // Only poll if we haven't applied the fix yet
    if (!fixAppliedRef.current) {
      log('🔄 Starting navigation button polling');
      
      // Poll every second to find and fix navigation buttons
      pollTimer = setInterval(() => {
        if (!fixAppliedRef.current) {
          fixNextButtonAndNavigation();
        } else {
          // If fix is applied, stop polling
          if (pollTimer) clearInterval(pollTimer);
        }
      }, 1000);
    }
    
    // Clean up interval on unmount
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [fixAppliedRef.current]);
  
  // Manual click handler for emergency navigation
  useEffect(() => {
    // Add event listener to handle clicks from debug tools
    const handleEmergencyClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if click was on our debug navigation button
      if (target && target.closest('[data-debug-nav="true"]')) {
        e.preventDefault();
        e.stopPropagation();
        log('🔄 Emergency navigation via debug button');
        manuallyNavigateToNextStep();
      }
    };
    
    // Add the event listener
    document.addEventListener('click', handleEmergencyClick, true);
    
    // Clean up
    return () => {
      document.removeEventListener('click', handleEmergencyClick, true);
    };
  }, [currentStep]);
  
  // This component doesn't render anything visible, but adds an emergency button
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'none' }}>
      <button 
        data-debug-nav="true"
        style={{ 
          padding: '8px 12px', 
          backgroundColor: '#f59e0b', 
          color: 'white', 
          borderRadius: '4px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        onClick={manuallyNavigateToNextStep}
      >
        Emergency Next
      </button>
    </div>
  );
};

export default FixedNavigationHandler;