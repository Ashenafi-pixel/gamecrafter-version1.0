import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store';
import { useNavigate } from 'react-router-dom';

/**
 * Step Navigation Fix Component
 * 
 * This component addresses the navigation issues between steps in the visual journey.
 * It specifically targets the Next button in Step 1 to ensure reliable navigation to Step 2.
 * Now includes a retry limit to prevent infinite loops.
 */
const StepNavigationFix: React.FC = () => {
  const { currentStep, config, setStep, updateConfig } = useGameStore();
  const fixAppliedRef = useRef(false);
  const attemptCountRef = useRef(0);
  const [failedToFindButton, setFailedToFindButton] = useState(false);
  const navigate = useNavigate();
  
  // Constants
  const MAX_RETRY_ATTEMPTS = 3; // Maximum number of retry attempts
  const RETRY_DELAY = 1000; // Delay between retries in milliseconds
  
  // Only apply the fix on step 0 (Theme Selection)
  useEffect(() => {
    if (currentStep !== 0 || fixAppliedRef.current) return;
    
    console.log("🔧 StepNavigationFix: Applying fixes for Step 1 navigation");
    
    // Reset attempt counter when component mounts or step changes
    attemptCountRef.current = 0;
    
    // Function to find and fix the Next button
    const fixNextButton = () => {
      // Increment attempt counter
      attemptCountRef.current += 1;
      
      // Check if we've exceeded the maximum retry attempts
      if (attemptCountRef.current > MAX_RETRY_ATTEMPTS) {
        console.warn(`🔧 StepNavigationFix: Exceeded maximum retry attempts (${MAX_RETRY_ATTEMPTS})`);
        setFailedToFindButton(true);
        
        // Create an emergency button to continue anyway
        const container = document.querySelector('main');
        if (container && !document.getElementById('emergency-next-button')) {
          console.log("🔧 StepNavigationFix: Creating emergency navigation button");
          
          const emergencyButton = document.createElement('button');
          emergencyButton.id = 'emergency-next-button';
          emergencyButton.textContent = 'Continue to Next Step';
          emergencyButton.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2';
          emergencyButton.style.cssText = `
            animation: pulse 2s infinite;
            box-shadow: 0 0 0 0 rgba(229, 62, 62, 1);
          `;
          
          // Add a small arrow icon
          const arrowIcon = document.createElement('span');
          arrowIcon.innerHTML = '→';
          arrowIcon.className = 'text-xl';
          emergencyButton.prepend(arrowIcon);
          
          // Add animation keyframes
          const style = document.createElement('style');
          style.textContent = `
            @keyframes pulse {
              0% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.7);
              }
              70% {
                transform: scale(1);
                box-shadow: 0 0 0 10px rgba(229, 62, 62, 0);
              }
              100% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(229, 62, 62, 0);
              }
            }
          `;
          document.head.appendChild(style);
          
          // Add click handler
          emergencyButton.addEventListener('click', handleFixedNextClick);
          
          // Add to the DOM
          container.appendChild(emergencyButton);
        }
        
        return; // Stop retrying
      }
      
      // Wait for DOM to be fully loaded
      setTimeout(() => {
        // Log current attempt
        console.log(`🔧 StepNavigationFix: Attempt ${attemptCountRef.current} of ${MAX_RETRY_ATTEMPTS}`);
        
        // Find the Next/Continue button
        const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
          (btn.textContent?.includes('Next') || 
           btn.textContent?.includes('Continue') || 
           btn.textContent?.includes('Game Type')) && 
          !btn.textContent?.includes('Force') &&
          !btn.disabled
        );
        
        // Look specifically for the bottom-right red button
        const nextButton = buttons.find(btn => {
          const style = getComputedStyle(btn);
          const rect = btn.getBoundingClientRect();
          
          const isRed = style.backgroundColor.includes('rgb(230') || 
                       style.backgroundColor.includes('rgb(220') || 
                       style.backgroundColor.includes('rgb(255') ||
                       btn.className.includes('red') ||
                       btn.className.includes('nintendo') ||
                       btn.parentElement?.className.includes('red');
                     
          const isBottomRight = rect.bottom > window.innerHeight * 0.5 && 
                              rect.right > window.innerWidth * 0.5;
          
          return isRed && isBottomRight;
        }) || buttons[0]; // Fallback to first button if no red button found
        
        if (nextButton) {
          console.log("🔧 StepNavigationFix: Found Next button, applying fix");
          
          // Clone the button to remove existing event handlers
          const clone = nextButton.cloneNode(true) as HTMLButtonElement;
          
          // Add visual indicator
          clone.style.position = 'relative';
          const indicator = document.createElement('span');
          indicator.style.cssText = `
            position: absolute;
            top: -3px;
            right: -3px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #4ade80;
            box-shadow: 0 0 5px rgba(74, 222, 128, 0.8);
          `;
          clone.appendChild(indicator);
          
          // Add our own fixed click handler
          clone.addEventListener('click', handleFixedNextClick);
          
          // Replace the original button
          if (nextButton.parentNode) {
            nextButton.parentNode.replaceChild(clone, nextButton);
            fixAppliedRef.current = true;
            console.log("🔧 StepNavigationFix: Next button successfully fixed");
          }
        } else {
          console.log(`🔧 StepNavigationFix: Next button not found, will retry (${attemptCountRef.current}/${MAX_RETRY_ATTEMPTS})`);
          // Retry after a delay
          setTimeout(fixNextButton, RETRY_DELAY);
        }
      }, RETRY_DELAY);
    };
    
    // Handle the fixed next button click
    const handleFixedNextClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log("🔧 StepNavigationFix: Fixed Next button clicked");
      
      // Ensure we have required data
      let updates: any = {};
      let needsUpdate = false;
      
      if (!config.gameId) {
        // Default game name if neither gameId nor theme exists
        const themeName = config?.theme?.mainTheme || 'mygame';
        const baseId = themeName.toLowerCase().replace(/\s+/g, '-');
        const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const newGameId = `${baseId}_${formattedDate}`;
        
        console.log(`🔧 StepNavigationFix: Setting gameId: ${newGameId}`);
        updates.gameId = newGameId;
        updates.displayName = config?.theme?.mainTheme || 'My Game';
        needsUpdate = true;
      }
      
      if (!config?.theme?.selectedThemeId) {
        console.log('🔧 StepNavigationFix: Setting default theme');
        updates.theme = {
          ...config.theme || {},
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
      
      // Apply updates if needed
      if (needsUpdate) {
        updateConfig(updates);
      }
      
      // Navigate to Step 2 with a slight delay to let state updates settle
      setTimeout(() => {
        console.log("🔧 StepNavigationFix: Navigating to step 1 (second step)");
        setStep(1);
        
        // Verify navigation success
        setTimeout(() => {
          // Use the store reference from the closure instead of calling getState() directly
          const storeState = useGameStore.getState();
          const currentStepAfter = storeState.currentStep;
          if (currentStepAfter === 1) {
            console.log("🔧 StepNavigationFix: Navigation successful!");
          } else {
            console.log("🔧 StepNavigationFix: Navigation failed, direct store manipulation");
            // Try direct store manipulation - use the store reference
            storeState.setStep(1);
          }
        }, 100);
      }, 100);
    };
    
    // Apply the fix
    fixNextButton();
    
    // Clean up function
    return () => {
      console.log("🔧 StepNavigationFix: Cleaning up");
      fixAppliedRef.current = false;
      
      // Remove emergency button if it exists
      const emergencyButton = document.getElementById('emergency-next-button');
      if (emergencyButton) {
        emergencyButton.remove();
      }
    };
  }, [currentStep, config, setStep, updateConfig, navigate]);
  
  // If we failed to find the Next button after max attempts, add fallback UI
  if (failedToFindButton) {
    // This UI will be rendered in addition to the emergency button
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-md z-50 max-w-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm">Navigation button not found. Please use the emergency button in the bottom right corner to continue.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // This component doesn't render anything by default
  return null;
};

export default StepNavigationFix;