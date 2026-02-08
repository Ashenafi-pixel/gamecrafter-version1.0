/**
 * SlotAI Navigation Fix Script
 * 
 * This script provides an external, DOM-based fix for navigation issues
 * between Step 1 and Step 2 in the SlotAI application. It's designed to
 * be loaded as a separate script when needed and will:
 * 
 * 1. Monitor the Next button for clicks
 * 2. Directly update the store state to ensure navigation works
 * 3. Provide fallback mechanisms for emergencies
 * 
 * Version: 1.0.0
 * Last Updated: 2025-05-17
 */

(function() {
  console.log('🛠️ Navigation Fix Script loaded');
  
  // Track execution state
  let fixApplied = false;
  let storePatched = false;
  let attempts = 0;
  
  // Wait for application to fully load
  const init = () => {
    // Check if we're on step 0 by looking for theme selection UI
    const isStep0 = Boolean(
      document.querySelector('[data-theme-id]') || 
      document.querySelector('.theme-explorer') ||
      document.querySelector('.enhanced-theme-selection')
    );
    
    if (!isStep0) {
      console.log('🛠️ Not on Step 0, script not needed');
      return;
    }
    
    console.log('🛠️ On Step 0, applying navigation fixes');
    patchStoreIfNeeded();
    fixNextButton();
  };
  
  // Try to patch the Zustand store
  const patchStoreIfNeeded = () => {
    if (storePatched) return;
    
    try {
      // Check if we can access the window.__ZUSTAND_STORE__ debug object
      // Some applications expose this for debugging
      if (window.__ZUSTAND_STORE__ && window.__ZUSTAND_STORE__.getState) {
        console.log('🛠️ Found Zustand store in debug mode');
        
        // Save the original setStep method
        const originalSetStep = window.__ZUSTAND_STORE__.getState().setStep;
        
        // Replace it with our own implementation
        const patchedSetStep = (step) => {
          console.log(`🛠️ Patched setStep called with step=${step}`);
          
          // Call the original method
          try {
            originalSetStep(step);
          } catch (err) {
            console.error('🛠️ Error in original setStep', err);
          }
          
          // Verify the step was changed
          setTimeout(() => {
            const currentState = window.__ZUSTAND_STORE__.getState();
            
            if (currentState.currentStep !== step) {
              console.log(`🛠️ Store update failed, forcing update to step ${step}`);
              
              // Direct state manipulation
              window.__ZUSTAND_STORE__.setState({
                ...currentState,
                currentStep: step
              });
            }
          }, 100);
        };
        
        // Apply the patch
        window.__ZUSTAND_STORE__.setState({
          setStep: patchedSetStep
        });
        
        storePatched = true;
        console.log('🛠️ Store successfully patched');
      }
    } catch (err) {
      console.error('🛠️ Failed to patch store', err);
    }
  };
  
  // Fix the next button by replacing it
  const fixNextButton = () => {
    if (fixApplied) return;
    
    attempts++;
    
    // Find the Next button
    const findNextButton = () => {
      // Try multiple strategies to find the button
      
      // 1. Look for specific styling
      const styledButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const style = window.getComputedStyle(btn);
        const rect = btn.getBoundingClientRect();
        
        const isRedOrBlue = 
          style.backgroundColor.includes('rgb(220') || 
          style.backgroundColor.includes('rgb(230') || 
          style.backgroundColor.includes('rgb(59') ||  // Blue tones
          style.backgroundColor.includes('rgb(29') || 
          btn.className.includes('bg-red') ||
          btn.className.includes('bg-blue') ||
          btn.className.includes('from-red');
        
        const isBottomRight = 
          rect.bottom > window.innerHeight * 0.6 && 
          rect.right > window.innerWidth * 0.5;
          
        const hasNextText = 
          btn.textContent?.includes('Next') || 
          btn.textContent?.includes('Continue') || 
          btn.textContent?.includes('Game Type');
        
        return isRedOrBlue && isBottomRight && hasNextText;
      });
      
      if (styledButtons.length > 0) return styledButtons[0];
      
      // 2. Look for text content
      const contentButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent?.includes('Continue to Game Type') || 
        (btn.textContent?.includes('Next') && btn.textContent?.includes('Game Type'))
      );
      
      if (contentButtons.length > 0) return contentButtons[0];
      
      // 3. Look for any button with 'Next' and a chevron icon
      const chevronButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const hasChevron = btn.querySelector('svg[class*="chevron"]');
        return btn.textContent?.includes('Next') && hasChevron;
      });
      
      if (chevronButtons.length > 0) return chevronButtons[0];
      
      return null;
    };
    
    // Create our fixed click handler
    const createFixedHandler = (btn) => {
      // Save original onclick for later
      const originalClick = btn.onclick;
      
      return (e) => {
        // Prevent event propagation issues
        e.preventDefault();
        e.stopPropagation();
        console.log('🛠️ Fixed Next button clicked');
        
        // Try the original handler first
        if (originalClick) {
          try {
            originalClick.call(btn, e);
          } catch (err) {
            console.error('🛠️ Error in original click handler', err);
          }
        }
        
        // Save important state to localStorage
        window.localStorage.setItem('slotai_emergency_nav', 'true');
        window.localStorage.setItem('slotai_target_step', '1');
        window.localStorage.setItem('slotai_timestamp', Date.now().toString());
        
        // Check if a Zustand store is available in global scope
        if (window.__ZUSTAND_STORE__) {
          try {
            // Get current store state
            const store = window.__ZUSTAND_STORE__.getState();
            console.log('🛠️ Current store state', {
              currentStep: store.currentStep,
              config: {
                selectedTheme: store.config?.theme?.selectedThemeId,
                gameId: store.config?.gameId
              }
            });
            
            // Force update to step 1
            window.__ZUSTAND_STORE__.setState({
              ...store,
              currentStep: 1
            });
            
            console.log('🛠️ Store updated to step 1');
          } catch (err) {
            console.error('🛠️ Error updating store', err);
          }
        }
        
        // Final verification after a short delay
        setTimeout(() => {
          // Check URL parameter
          const url = new URL(window.location.href);
          const urlStep = url.searchParams.get('step');
          
          // Check if we've moved to Step 1
          const isStep1 = Boolean(
            document.querySelector('[data-game-type]') || 
            document.querySelector('.game-type-selection')
          );
          
          if (!isStep1 && urlStep !== '1') {
            console.log('🛠️ Navigation still failed, using direct URL navigation');
            
            // Final fallback - direct URL navigation
            window.location.href = '/?step=1&force=true&t=' + Date.now();
          }
        }, 500);
      };
    };
    
    // Find and replace the button
    const btn = findNextButton();
    
    if (btn) {
      console.log('🛠️ Found Next button, applying fix', btn);
      
      // Clone the button to remove existing event handlers
      const clone = btn.cloneNode(true);
      
      // Add a visual indicator
      const indicator = document.createElement('span');
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
      
      // Make sure button has position relative
      clone.style.position = 'relative';
      clone.appendChild(indicator);
      
      // Apply fixed handler
      clone.addEventListener('click', createFixedHandler(btn));
      
      // Replace the original button
      if (btn.parentNode) {
        btn.parentNode.replaceChild(clone, btn);
        fixApplied = true;
        console.log('🛠️ Next button fixed successfully');
      }
    } else if (attempts < 5) {
      // Button not found, retry after a delay
      console.log(`🛠️ Next button not found, will retry (attempt ${attempts}/5)`);
      setTimeout(fixNextButton, 1000);
    } else {
      console.log('🛠️ Max attempts reached, giving up');
    }
  };
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded, initialize immediately
    setTimeout(init, 100);
  }
})();