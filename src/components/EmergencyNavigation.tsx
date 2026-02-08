import React, { useEffect } from 'react';
import { useGameStore } from '../store';

/**
 * EmergencyNavigation Component
 * 
 * This component is designed to be included directly in App.tsx to address
 * the root cause of navigation issues by directly manipulating the store
 * and ensuring proper game type selection.
 */
const EmergencyNavigation: React.FC = () => {
  const { setGameType, setStep } = useGameStore();

  useEffect(() => {
    console.log('🚨 EmergencyNavigation: Component mounted');

    // Attempt immediate first-step to second-step navigation fix
    const fixNavigation = () => {
      console.log('🚨 EmergencyNavigation: Applying direct store navigation fix');
      
      // Ensure we're on the right game type for visual journey
      setGameType('visual_journey');
      
      // Add a small delay before trying the step change to allow for game type to update
      setTimeout(() => {
        // Force step 1 (which is the second step since steps are 0-indexed)
        setStep(1);
        
        // Verify the step change
        setTimeout(() => {
          const currentStep = useGameStore.getState().currentStep;
          console.log(`🚨 EmergencyNavigation: After force navigation, currentStep = ${currentStep}`);
          
          if (currentStep !== 1) {
            console.log('🚨 EmergencyNavigation: First attempt failed, trying direct state manipulation');
            
            // Direct state manipulation as a last resort
            useGameStore.setState((state) => ({
              ...state,
              currentStep: 1,
              gameType: 'visual_journey',
            }));
            
            // Add UI indication that navigation occurred
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            notification.innerHTML = 'Navigation to Game Type step successful!';
            document.body.appendChild(notification);
            
            // Remove notification after 3 seconds
            setTimeout(() => {
              if (document.body.contains(notification)) {
                document.body.removeChild(notification);
              }
            }, 3000);
          }
        }, 200);
      }, 100);
    };

    // Check if we should apply the navigation fix
    // Only apply if we're on step 0 and in the right game type
    const shouldApplyFix = () => {
      const state = useGameStore.getState();
      
      // Check if we're at step 0 (theme selection)
      const isStepZero = state.currentStep === 0;
      
      // Check if we're in visual journey mode
      const isVisualJourney = state.gameType === 'visual_journey' || state.gameType === 'slots';
      
      // Check if we have required data to move forward
      const hasRequiredData = !!(state.config?.theme?.selectedThemeId || state.config?.gameId);
      
      const shouldFix = isStepZero && isVisualJourney && hasRequiredData;
      console.log('🚨 EmergencyNavigation: Should apply fix?', {
        isStepZero, 
        isVisualJourney, 
        hasRequiredData, 
        shouldFix
      });
      
      return shouldFix;
    };

    // Check for URL direction to enable fix
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    const forceParam = urlParams.get('force');
    
    if (stepParam === '1' && forceParam === 'true') {
      console.log('🚨 EmergencyNavigation: Force parameter detected in URL, applying fix');
      fixNavigation();
    } else if (shouldApplyFix()) {
      // Add button to UI for user to try navigation manually
      const button = document.createElement('button');
      button.className = 'fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        <span>Continue to Game Type</span>
      `;
      
      button.addEventListener('click', () => {
        fixNavigation();
        if (document.body.contains(button)) {
          document.body.removeChild(button);
        }
      });
      
      document.body.appendChild(button);
    }
    
    // Cleanup function
    return () => {
      // Remove any emergency UI elements we added
      const emergencyButtons = document.querySelectorAll('.emergency-nav-button');
      emergencyButtons.forEach(button => {
        if (document.body.contains(button)) {
          document.body.removeChild(button);
        }
      });
    };
  }, [setGameType, setStep]);
  
  // This component doesn't render anything
  return null;
};

export default EmergencyNavigation;