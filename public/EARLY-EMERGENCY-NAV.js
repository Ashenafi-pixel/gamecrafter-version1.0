/**
 * EARLY-EMERGENCY-NAV.js
 * 
 * Immediate execution, ultra-lightweight navigation fix that loads very early
 * and ensures safe navigation even before React initializes.
 */

(function() {
  // Check if recovery is already complete
  const recoveryComplete = localStorage.getItem('slotai_recovery_complete') === 'true';
  const urlParams = new URLSearchParams(window.location.search);
  const recovered = urlParams.has('recovered');
  
  // Immediately exit if recovery is complete
  if (recoveryComplete || recovered || 
      (window.__RECOVERY_COMPLETE === true) || 
      (window.__EMERGENCY_SCRIPTS_DISABLED === true)) {
    console.log("🏎️ EARLY EMERGENCY NAVIGATION: Recovery complete, aborting load");
    return;
  }
  
  // Execute immediately without waiting for DOM to be ready
  console.log("🏎️ EARLY EMERGENCY NAVIGATION PATCH LOADED");
  
  // Detect safe mode
  const safeMode = urlParams.has('safeMode');
  const emergencyMode = urlParams.has('emergency');
  
  // Track navigation state to avoid duplicate attempts
  // Only initialize if it doesn't exist - don't override existing values
  if (!window.__NAVIGATION_STATE) {
    window.__NAVIGATION_STATE = {
      attempted: false,
      successful: false,
      targetStep: null,
      safeMode: safeMode,
      // Set recovery flags to ensure other scripts can check
      recoveryComplete: recoveryComplete || recovered
    };
  } else {
    // Update recovery state if it exists
    window.__NAVIGATION_STATE.recoveryComplete = 
      window.__NAVIGATION_STATE.recoveryComplete || recoveryComplete || recovered;
  }
  
  // Check URL parameters for direct navigation
  const stepParam = urlParams.get('step');
  
  if (stepParam !== null) {
    const stepNumber = parseInt(stepParam, 10);
    if (!isNaN(stepNumber)) {
      window.__NAVIGATION_STATE.targetStep = stepNumber;
      console.log(`🏎️ Target step detected: ${stepNumber}`);
    }
  }
  
  /**
   * Force navigation to a specific step
   * @param {number} stepNumber - The step to navigate to
   * @returns {boolean} Success state
   */
  function forceStepNavigation(stepNumber) {
    // Check if recovery has happened since script loaded
    const currentRecoveryState = localStorage.getItem('slotai_recovery_complete') === 'true';
    const windowRecovery = 
      (window.__RECOVERY_COMPLETE === true) || 
      (window.__EMERGENCY_SCRIPTS_DISABLED === true);
    
    if (currentRecoveryState || windowRecovery) {
      console.log(`🏎️ Navigation aborted - recovery is now complete`);
      return false;
    }
    
    if (window.__NAVIGATION_STATE.attempted && !window.__NAVIGATION_STATE.successful) {
      console.log(`🏎️ Already attempted navigation to step ${stepNumber}, waiting...`);
      return false;
    }
    
    window.__NAVIGATION_STATE.attempted = true;
    console.log(`🏎️ Attempting navigation to step ${stepNumber}`);
    
    try {
      // 1. Try direct store manipulation
      if (window.useGameStore && typeof window.useGameStore.getState === 'function') {
        // Get current state
        const store = window.useGameStore.getState();
        
        // Force visual_journey game type if not set
        if (!store.gameType) {
          console.log('🏎️ Setting gameType to visual_journey');
          window.useGameStore.setState({
            ...store,
            gameType: 'visual_journey'
          });
        }
        
        // Force step navigation
        console.log(`🏎️ Setting step to ${stepNumber} via direct state manipulation`);
        window.useGameStore.setState({
          ...window.useGameStore.getState(),
          currentStep: stepNumber
        });
        
        // Verify navigation was successful
        setTimeout(() => {
          const verifyStep = window.useGameStore.getState().currentStep;
          if (verifyStep === stepNumber) {
            console.log(`🏎️ Navigation to step ${stepNumber} verified successful`);
            window.__NAVIGATION_STATE.successful = true;
          } else {
            console.warn(`🏎️ Navigation verification failed, got ${verifyStep} instead of ${stepNumber}`);
            
            // One more attempt with a different approach
            window.useGameStore.getState().setStep(stepNumber);
            
            // Final verification
            setTimeout(() => {
              const finalCheck = window.useGameStore.getState().currentStep;
              window.__NAVIGATION_STATE.successful = (finalCheck === stepNumber);
              console.log(`🏎️ Final navigation check: ${window.__NAVIGATION_STATE.successful ? 'SUCCESS' : 'FAILED'}`);
            }, 100);
          }
        }, 100);
        
        return true;
      }
      
      // 2. If store isn't available, use localStorage for emergency nav
      console.log('🏎️ Store not ready, using localStorage emergency navigation');
      localStorage.setItem('slotai_emergency_nav', 'true');
      localStorage.setItem('slotai_target_step', stepNumber.toString());
      localStorage.setItem('slotai_timestamp', Date.now().toString());
      
      return false;
    } catch (error) {
      console.error('🏎️ Navigation error:', error);
      return false;
    }
  }
  
  // Expose the navigation function globally
  window.earlyForceNavigation = forceStepNavigation;
  
  // Register store availability watcher
  function checkStoreAndNavigate() {
    // Check recovery state again before proceeding
    if (localStorage.getItem('slotai_recovery_complete') === 'true' || 
        window.__RECOVERY_COMPLETE === true || 
        window.__EMERGENCY_SCRIPTS_DISABLED === true) {
      console.log("🏎️ Recovery complete, cancelling navigation checks");
      return;
    }
    
    // If already navigated successfully, don't try again
    if (window.__NAVIGATION_STATE.successful) return;
    
    // Check if store is available now
    if (window.useGameStore) {
      console.log("🏎️ Zustand store detected");
      
      // If we have a target step, try to navigate
      if (window.__NAVIGATION_STATE.targetStep !== null) {
        forceStepNavigation(window.__NAVIGATION_STATE.targetStep);
      }
    } else {
      // Try again soon
      setTimeout(checkStoreAndNavigate, 200);
    }
  }
  
  // Start watching for store
  checkStoreAndNavigate();
  
  // Create minimal emergency UI if in emergency mode
  if (emergencyMode) {
    window.addEventListener('DOMContentLoaded', function() {
      // Check recovery state again before creating UI
      if (localStorage.getItem('slotai_recovery_complete') === 'true' || 
          window.__RECOVERY_COMPLETE === true || 
          window.__EMERGENCY_SCRIPTS_DISABLED === true) {
        console.log("🏎️ Recovery complete, cancelling emergency UI creation");
        return;
      }
      
      const rootDiv = document.getElementById('root');
      if (!rootDiv) return;
      
      // Either clear the root or insert before it
      const emergencyUI = document.createElement('div');
      emergencyUI.setAttribute('data-emergency-ui', 'true');
      emergencyUI.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.98);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;
      
      emergencyUI.innerHTML = `
        <h2 style="margin-bottom: 20px; color: #e53e3e; font-size: 24px;">Emergency Navigation Mode</h2>
        <p style="margin-bottom: 30px; max-width: 600px; text-align: center; color: #4a5568;">
          The application has been loaded in emergency mode to help recover from a crash.
          Please select which step you'd like to navigate to:
        </p>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; max-width: 800px;">
          <button onclick="window.earlyForceNavigation(0)" style="padding: 12px 18px; background: #3182ce; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Step 1: Theme Selection</button>
          <button onclick="window.earlyForceNavigation(1)" style="padding: 12px 18px; background: #3182ce; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Step 2: Game Type</button>
          <button onclick="window.earlyForceNavigation(2)" style="padding: 12px 18px; background: #3182ce; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Step 3: Grid Layout</button>
          <button onclick="window.earlyForceNavigation(3)" style="padding: 12px 18px; background: #3182ce; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Step 4: Symbol Generation</button>
        </div>
        <p style="margin-top: 30px;">
          <button onclick="document.location.href='/?safeMode=true'" style="padding: 8px 16px; background: #38a169; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Switch to Safe Mode
          </button>
          <button onclick="this.parentNode.parentNode.style.display='none'" style="padding: 8px 16px; background: #a0aec0; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            Close This Panel
          </button>
        </p>
      `;
      
      document.body.appendChild(emergencyUI);
    });
  }
  
  // If the page stays blank for too long, show emergency UI
  setTimeout(function() {
    // Don't check if recovery is already marked as complete or we're in safe mode
    const recoveryComplete = localStorage.getItem('slotai_recovery_complete') === 'true';
    if (recoveryComplete || safeMode || 
        window.__RECOVERY_COMPLETE === true || 
        window.__EMERGENCY_SCRIPTS_DISABLED === true) {
      console.log('🏎️ Recovery already complete or in safe mode, skipping blank screen check');
      return;
    }
    
    if (document.readyState === 'complete') {
      // Page is loaded, check for root content
      const rootDiv = document.getElementById('root');
      
      // Check if we're looking at a real blank screen
      // A fully loaded app (especially React) should have many child nodes
      if (rootDiv && (rootDiv.innerHTML.trim() === '' || rootDiv.childNodes.length < 3)) {
        console.log('🏎️ Detected blank screen after load, showing emergency UI');
        
        // Create timestamp to prevent emergency loop
        const emergencyTimestamp = Date.now();
        localStorage.setItem('blank_screen_detected', emergencyTimestamp.toString());
        
        // Only force emergency mode if we haven't shown emergency UI in the last minute
        // This prevents emergency UI loops
        const lastEmergency = parseInt(localStorage.getItem('last_emergency_ui') || '0');
        const ONE_MINUTE = 60 * 1000;
        
        if (!emergencyMode && (emergencyTimestamp - lastEmergency > ONE_MINUTE)) {
          console.log('🏎️ Loading emergency UI for blank screen');
          localStorage.setItem('last_emergency_ui', emergencyTimestamp.toString());
          window.location.href = '/?emergency=true&t=' + emergencyTimestamp;
        } else {
          console.log('🏎️ Emergency UI already shown recently, not showing again');
          
          // If we're already in emergency mode but still see a blank screen,
          // that means emergency UI isn't helping - try safe mode instead
          if (emergencyMode) {
            console.log('🏎️ Emergency mode not fixing blank screen, trying safe mode');
            window.location.href = '/?safeMode=true&t=' + emergencyTimestamp;
          }
        }
      } else {
        // Successful load - reset emergency state
        console.log('🏎️ Root element has content, app loaded successfully');
        localStorage.removeItem('blank_screen_detected');
      }
    }
  }, 5000);
})();