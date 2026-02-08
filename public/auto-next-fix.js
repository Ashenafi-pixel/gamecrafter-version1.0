// Auto Next Button Fix
// Version 1.0.0 (2025-05-16)
// Auto-injecting simplified navigation fix

(function() {
  console.log("🔄 Auto Next Fix - Starting initialization");
  
  // Wait for DOM to be fully loaded
  function init() {
    console.log("🔄 Auto Next Fix - DOM loaded, waiting for React components");
    
    // Wait a bit longer for React to initialize components
    setTimeout(applyFixes, 2000);
  }
  
  // Find the Next button
  function findNextButton() {
    console.log("🔄 Auto Next Fix - Looking for Next button");
    
    // Look for buttons with "Next" text content
    const nextButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent?.includes('Next') && 
      !btn.textContent?.includes('Force') &&
      !btn.disabled
    );
    
    if (nextButtons.length > 0) {
      console.log(`🔄 Auto Next Fix - Found ${nextButtons.length} Next buttons`);
      
      // Try to find specifically the red button at bottom right (Step 1 to Step 2)
      const redNextButton = nextButtons.find(btn => {
        const style = getComputedStyle(btn);
        const rect = btn.getBoundingClientRect();
        
        // Check if it's at the bottom right
        const isBottomRight = rect.bottom > window.innerHeight * 0.7 && rect.right > window.innerWidth * 0.6;
        
        // Check if it has red styling
        const hasRedStyle = 
          style.backgroundColor.includes('rgb(220') || // Red-ish
          style.backgroundColor.includes('rgb(239') || // Red-ish
          btn.classList.contains('bg-red') ||
          btn.classList.contains('from-red') ||
          btn.classList.contains('to-red') ||
          btn.parentElement?.classList.contains('from-red');
        
        return isBottomRight && hasRedStyle;
      });
      
      if (redNextButton) {
        console.log("🔄 Auto Next Fix - Found red Next button at bottom right!");
        return redNextButton;
      }
      
      console.log("🔄 Auto Next Fix - No red Next button found, using first Next button");
      return nextButtons[0];
    }
    
    console.log("🔄 Auto Next Fix - No Next buttons found");
    return null;
  }
  
  // Fix the Next button
  function fixNextButton(button) {
    console.log("🔄 Auto Next Fix - Fixing Next button");
    
    if (!button) {
      console.log("🔄 Auto Next Fix - No button provided to fix");
      return false;
    }
    
    try {
      // Clone the button to remove existing handlers
      const clone = button.cloneNode(true);
      
      // Add a small indicator that this button has been enhanced
      clone.style.position = 'relative';
      clone.style.boxShadow = '0 0 5px rgba(0, 255, 0, 0.4)';
      
      // Add direct click handler that bypasses React's synthetic events
      clone.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("🔄 Auto Next Fix - Enhanced Next button clicked");
        
        // Ensure store is available
        if (!window.useGameStore) {
          console.log("🔄 Auto Next Fix - useGameStore not found, navigating to standalone page");
          window.location.href = '/standalone-step2.html';
          return;
        }
        
        // Get store state
        const store = window.useGameStore.getState();
        console.log(`🔄 Auto Next Fix - Current step: ${store.currentStep}`);
        
        // Ensure we have required data
        if (!store.config.gameId) {
          const gameId = `game_${Date.now()}`;
          console.log(`🔄 Auto Next Fix - Setting default gameId: ${gameId}`);
          store.updateConfig({ gameId });
        }
        
        if (!store.config?.theme?.selectedThemeId) {
          console.log("🔄 Auto Next Fix - Setting default theme");
          store.updateConfig({
            theme: {
              ...store.config.theme || {},
              selectedThemeId: 'default-theme',
              mainTheme: 'Default Theme'
            }
          });
        }
        
        // Directly set step to 1 (Step 2)
        console.log("🔄 Auto Next Fix - Directly setting step to 1");
        store.setStep(1);
        
        // Verify success after a short delay
        setTimeout(() => {
          const currentStep = window.useGameStore.getState().currentStep;
          
          if (currentStep === 1) {
            console.log("🔄 Auto Next Fix - Navigation successful!");
          } else {
            console.log("🔄 Auto Next Fix - Navigation failed, trying fallback");
            
            // Try using nextStep method
            window.useGameStore.getState().nextStep();
            
            // Check again
            setTimeout(() => {
              const newStep = window.useGameStore.getState().currentStep;
              if (newStep === 1) {
                console.log("🔄 Auto Next Fix - Navigation successful with nextStep!");
              } else {
                console.log("🔄 Auto Next Fix - All direct methods failed, using URL navigation");
                window.location.href = '/?step=1&force=true&t=' + Date.now();
              }
            }, 200);
          }
        }, 200);
      });
      
      // Replace the original button with our enhanced version
      button.parentNode.replaceChild(clone, button);
      
      console.log("🔄 Auto Next Fix - Next button successfully enhanced");
      return true;
    } catch (error) {
      console.error("🔄 Auto Next Fix - Error fixing button:", error);
      return false;
    }
  }
  
  // Apply all fixes
  function applyFixes() {
    console.log("🔄 Auto Next Fix - Applying fixes");
    
    // Only apply fixes if we're on step 0 (Theme Selection)
    let currentStep = 0;
    
    try {
      if (window.useGameStore) {
        currentStep = window.useGameStore.getState().currentStep;
        console.log(`🔄 Auto Next Fix - Current step: ${currentStep}`);
      }
    } catch (e) {
      console.log("🔄 Auto Next Fix - Could not determine current step");
    }
    
    // Only apply fix if we're on Step 1 (index 0)
    if (currentStep === 0) {
      // Find and fix the Next button
      const nextButton = findNextButton();
      
      if (nextButton) {
        fixNextButton(nextButton);
      } else {
        console.log("🔄 Auto Next Fix - Could not find Next button to fix");
        
        // Try again later as React might still be rendering
        setTimeout(() => {
          const retryButton = findNextButton();
          if (retryButton) {
            fixNextButton(retryButton);
          } else {
            console.log("🔄 Auto Next Fix - Next button not found after retry");
          }
        }, 3000);
      }
    } else {
      console.log(`🔄 Auto Next Fix - Not on Step 1 (current step: ${currentStep}), skipping fix`);
    }
    
    // Create help link
    const helpLink = document.createElement('a');
    helpLink.textContent = "Navigation Help";
    helpLink.href = "/navigation-fix-instructions.html";
    helpLink.target = "_blank";
    helpLink.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
      font-family: system-ui, sans-serif;
      font-size: 12px;
      text-decoration: none;
      z-index: 9999;
    `;
    document.body.appendChild(helpLink);
  }
  
  // Initialize when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();