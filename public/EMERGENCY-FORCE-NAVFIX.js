/**
 * EMERGENCY NAVIGATION FIX
 * 
 * This script completely bypasses the React navigation system.
 * It directly manipulates the Zustand store to force step visibility.
 */

(function() {
  // Immediately check if we should even run
  // Use a more comprehensive recovery check
  function isRecoveryComplete() {
    const directRecoveryComplete = localStorage.getItem('slotai_recovery_complete') === 'true';
    const urlParams = new URLSearchParams(window.location.search);
    const urlRecovered = urlParams.has('recovered');
    const globalDisabled = window.__EMERGENCY_SCRIPTS_DISABLED === true;
    const globalRecoveryComplete = window.__RECOVERY_COMPLETE === true;
    const hasNavigationState = window.__NAVIGATION_STATE && 
                              window.__NAVIGATION_STATE.recoveryComplete === true;
    
    // Use window.shouldEmergencyScriptsRun if available as the most comprehensive check
    if (typeof window.shouldEmergencyScriptsRun === 'function') {
      return !window.shouldEmergencyScriptsRun();
    }
    
    return directRecoveryComplete || urlRecovered || globalDisabled || 
           globalRecoveryComplete || hasNavigationState;
  }
  
  if (isRecoveryComplete()) {
    console.log("🔥 EMERGENCY NAVIGATION FIX DISABLED - Recovery complete");
    return; // Exit immediately
  }
  
  console.log("🔥 EMERGENCY NAVIGATION FIX ACTIVATED 🔥");
  
  // Function to forcibly set the step in the store
  function forceStep(stepNumber) {
    console.log(`🔥 EMERGENCY: Forcing navigation to step ${stepNumber}`);
    
    // When store is available, directly update it
    if (window.useGameStore) {
      // Get the current state
      const store = window.useGameStore.getState();
      
      // Set step directly in the state
      window.useGameStore.setState({
        ...store,
        currentStep: stepNumber,
        // Force classic-reels as the selected game type
        config: {
          ...store.config,
          selectedGameType: "classic-reels"
        }
      });
      
      console.log(`✅ Set step to ${stepNumber} via direct state manipulation`);
      return true;
    }
    
    return false;
  }
  
  // Function to create emergency navigation button
  function createEmergencyButton() {
    const buttonContainer = document.createElement("div");
    buttonContainer.style.position = "fixed";
    buttonContainer.style.bottom = "20px";
    buttonContainer.style.right = "20px";
    buttonContainer.style.zIndex = "9999";
    buttonContainer.style.display = "flex";
    buttonContainer.style.flexDirection = "column";
    buttonContainer.style.gap = "10px";
    
    // Create buttons for each step
    const buttons = [
      { step: 0, label: "Step 1: Theme" },
      { step: 1, label: "Step 2: Game Type" },
      { step: 2, label: "Step 3: Grid" },
      { step: 3, label: "Step 4: Symbols" }
    ];
    
    buttons.forEach(({ step, label }) => {
      const button = document.createElement("button");
      button.textContent = label;
      button.style.padding = "10px 15px";
      button.style.backgroundColor = "#f44336";
      button.style.color = "white";
      button.style.border = "none";
      button.style.borderRadius = "5px";
      button.style.fontWeight = "bold";
      button.style.cursor = "pointer";
      button.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
      
      button.onclick = function() {
        forceStep(step);
      };
      
      buttonContainer.appendChild(button);
    });
    
    document.body.appendChild(buttonContainer);
  }
  
  // Check if any recovery has happened since script load
  function shouldAbortNavigation() {
    // Use our consistent isRecoveryComplete function
    return isRecoveryComplete();
  }
  
  // Wait for page to be fully loaded
  window.addEventListener("load", function() {
    // First check if we should abort
    if (shouldAbortNavigation()) {
      console.log("🔥 EMERGENCY NAVIGATION: Recovery complete, aborting");
      return;
    }
    
    // Wait a bit longer to ensure React has initialized
    setTimeout(function() {
      // Check again before creating UI
      if (shouldAbortNavigation()) {
        console.log("🔥 EMERGENCY NAVIGATION: Recovery complete, aborting UI creation");
        return;
      }
      // Create emergency navigation buttons
      createEmergencyButton();
      
      // Add a global debug function
      window.forceStepNavigation = forceStep;
      
      // Check URL parameters for direct navigation
      const urlParams = new URLSearchParams(window.location.search);
      const stepParam = urlParams.get('step');
      
      if (stepParam !== null) {
        const stepNumber = parseInt(stepParam, 10);
        if (!isNaN(stepNumber)) {
          // Try to force navigation immediately
          const success = forceStep(stepNumber);
          
          if (!success) {
            // If not successful, try again after a delay
            console.log("🔥 Store not ready, retrying after delay...");
            setTimeout(() => {
              forceStep(stepNumber);
            }, 1000);
          }
        }
      }
    }, 1000);
  });
  
  // Monitor for store availability
  const storeCheckInterval = setInterval(function() {
    if (window.useGameStore) {
      clearInterval(storeCheckInterval);
      console.log("🔥 Zustand store is available, navigation system ready");
    }
  }, 100);
  
  console.log("🔥 EMERGENCY NAVIGATION FIX READY");
})();