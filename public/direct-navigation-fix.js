/**
 * Direct Navigation Fix for SlotAI
 * Version: 2.0.0 (2025-05-17)
 *
 * This script applies a direct, reliable fix for the navigation between steps.
 * It identifies and replaces the non-functioning button with a properly working one.
 * 
 * IMPORTANT: The script is loaded directly in the head to ensure it runs before React
 * initialization to properly intercept all button interactions.
 */

(function() {
  console.log("🛠️ Direct Navigation Fix 2.0 - Initializing...");

  // Configuration
  const DEBUG = true;
  const CHECK_INTERVAL = 500; // ms between checks
  const MAX_ATTEMPTS = 30;    // maximum number of checks (15 seconds total)
  let attempts = 0;

  // Logging with timestamps
  const log = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌ ERROR' : 
                  type === 'success' ? '✅ SUCCESS' : 
                  type === 'warning' ? '⚠️ WARNING' : '🔍 INFO';
    
    console.log(`[${timestamp}] ${prefix}: ${message}`);
    
    // Show visually if debugging is enabled
    if (DEBUG && type === 'success') {
      showSuccessMessage(message);
    } else if (DEBUG && type === 'error') {
      showErrorMessage(message);
    }
  };

  // Visual feedback for debugging
  const showSuccessMessage = (message) => {
    const msgEl = document.createElement('div');
    msgEl.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: rgba(0, 128, 0, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 10000;
      font-family: system-ui, sans-serif;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;
    msgEl.textContent = message;
    document.body.appendChild(msgEl);
    setTimeout(() => msgEl.remove(), 5000);
  };

  const showErrorMessage = (message) => {
    const msgEl = document.createElement('div');
    msgEl.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: rgba(220, 0, 0, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 10000;
      font-family: system-ui, sans-serif;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;
    msgEl.textContent = message;
    document.body.appendChild(msgEl);
    setTimeout(() => msgEl.remove(), 5000);
  };

  // Create a direct navigation helper button
  const createDirectNavHelper = () => {
    log("Creating emergency navigation helper");
    const helper = document.createElement('button');
    helper.textContent = "🚀 Go to Step 2";
    helper.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background-color: #E60012;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      z-index: 10000;
      font-family: system-ui, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;
    helper.addEventListener('click', () => {
      log("Direct navigation button clicked", 'info');
      navigateToStep2();
    });
    document.body.appendChild(helper);
    return helper;
  };

  // The main function to fix navigation
  const fixNavigation = () => {
    if (attempts >= MAX_ATTEMPTS) {
      log("Maximum attempts reached. Creating emergency navigation helper", 'warning');
      createDirectNavHelper();
      return;
    }
    
    attempts++;
    
    // Check if we're on step 1
    if (!isStep1Page()) {
      log("Not on Step 1, no fixes needed");
      return;
    }
    
    log(`Attempt ${attempts}/${MAX_ATTEMPTS}: Looking for next button...`);
    
    // Find the next button
    const nextButton = findNextButton();
    if (!nextButton) {
      log("Next button not found, will retry...");
      setTimeout(fixNavigation, CHECK_INTERVAL);
      return;
    }
    
    log("Next button found! Applying fix...", 'success');
    
    // Replace the button with our fixed version
    replaceWithFixedButton(nextButton);
  };
  
  // Check if we're on Step 1
  const isStep1Page = () => {
    try {
      // Method 1: Check by component class
      const hasThemeSelectionComponent = !!document.querySelector('.enhanced-theme-selection');
      
      // Method 2: Check by store state
      let storeStep = -1;
      try {
        if (window.useGameStore) {
          storeStep = window.useGameStore.getState().currentStep;
        }
      } catch (e) {
        console.error("Error checking store state:", e);
      }
      
      // Method 3: Check by UI elements
      const hasThemeUI = !!Array.from(document.querySelectorAll('h1, h2, h3'))
        .find(el => el.textContent?.includes('Theme'));
        
      // Log results
      log(`Theme component found: ${hasThemeSelectionComponent}, Store step: ${storeStep}, Theme UI elements: ${hasThemeUI}`);
      
      return hasThemeSelectionComponent || storeStep === 0 || hasThemeUI;
    } catch (e) {
      log(`Error checking step: ${e.message}`, 'error');
      return false;
    }
  };

  // Find the Next button using multiple strategies
  const findNextButton = () => {
    // Strategy 1: Look for buttons with "Next" or "Continue" text
    const buttonsByText = Array.from(document.querySelectorAll('button')).filter(btn => 
      (btn.textContent?.includes('Next') || 
       btn.textContent?.includes('Continue') ||
       btn.textContent?.includes('Game Type')) && 
      !btn.disabled &&
      getComputedStyle(btn).display !== 'none'
    );
    
    if (buttonsByText.length > 0) {
      log(`Found ${buttonsByText.length} Next buttons by text`);
      
      // First try to find the red button at the bottom right
      const redNextBtn = buttonsByText.find(btn => {
        const style = getComputedStyle(btn);
        const rect = btn.getBoundingClientRect();
        
        // Check for red styling
        const hasRedBg = style.backgroundColor.includes('rgb(230') || // E60012 (Nintendo red)
                       style.backgroundColor.includes('rgb(220') ||   // More red variants
                       style.backgroundColor.includes('rgb(255');     // RGB red
                       
        const hasRedClass = btn.className.includes('red') || 
                          btn.className.includes('nintendo') ||
                          btn.className.includes('primary');
                          
        // Check position (bottom half, right side)
        const isBottomRight = rect.bottom > window.innerHeight / 2 && 
                             rect.right > window.innerWidth / 2;
        
        return (hasRedBg || hasRedClass) && isBottomRight;
      });
      
      if (redNextBtn) {
        log("Found red Next button at bottom right!", 'success');
        return redNextBtn;
      }
      
      // Fall back to first next/continue button
      log("No red button found, using first Next button");
      return buttonsByText[0];
    }
    
    // Strategy 2: Look for bottom-right positioned buttons
    const allButtons = Array.from(document.querySelectorAll('button'));
    const bottomRightButton = allButtons.find(btn => {
      const rect = btn.getBoundingClientRect();
      return rect.bottom > window.innerHeight * 0.7 && 
             rect.right > window.innerWidth * 0.6;
    });
    
    if (bottomRightButton) {
      log("Found button at bottom right position");
      return bottomRightButton;
    }
    
    // Strategy 3: Find through parent containers
    const navContainer = document.querySelector('[class*="navigation"]') || 
                       document.querySelector('[class*="footer"]') ||
                       document.querySelector('[class*="bottom"]');
                       
    if (navContainer) {
      const navButtons = navContainer.querySelectorAll('button');
      if (navButtons.length > 0) {
        // Get rightmost button
        let rightmostButton = navButtons[0];
        let maxRight = rightmostButton.getBoundingClientRect().right;
        
        Array.from(navButtons).forEach(btn => {
          const rect = btn.getBoundingClientRect();
          if (rect.right > maxRight) {
            maxRight = rect.right;
            rightmostButton = btn;
          }
        });
        
        log("Found button in navigation container");
        return rightmostButton;
      }
    }
    
    return null;
  };

  // Replace with fixed button
  const replaceWithFixedButton = (originalButton) => {
    try {
      // Clone the button to preserve styling
      const fixedButton = originalButton.cloneNode(true);
      fixedButton.id = 'fixed-next-button';
      
      // Add a small indicator dot that this is fixed
      const indicator = document.createElement('span');
      indicator.style.cssText = `
        position: absolute;
        top: -4px;
        right: -4px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #4ade80;
        box-shadow: 0 0 5px #4ade80;
      `;
      
      // Make sure button has a relative position for the indicator
      fixedButton.style.position = 'relative';
      fixedButton.appendChild(indicator);
      
      // Remove all existing event listeners
      const newButton = fixedButton.cloneNode(true);
      
      // Add our direct event listener
      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        log("Fixed button clicked!", 'success');
        navigateToStep2();
      });
      
      // Replace the original button
      if (originalButton.parentNode) {
        originalButton.parentNode.replaceChild(newButton, originalButton);
        log("Button successfully replaced with fixed version", 'success');
      } else {
        log("Original button has no parent, cannot replace", 'error');
      }
    } catch (e) {
      log(`Error replacing button: ${e.message}`, 'error');
      createDirectNavHelper(); // Create emergency helper as fallback
    }
  };

  // Navigate to Step 2 using all available methods
  const navigateToStep2 = () => {
    log("Executing Step 2 navigation...");
    
    try {
      // 1. First try: Direct store manipulation
      if (window.useGameStore) {
        const store = window.useGameStore.getState();
        
        // Ensure we have required data
        if (!store.config.gameId) {
          const newGameId = `game_${Date.now()}`;
          log(`Creating gameId: ${newGameId}`);
          store.updateConfig({ gameId: newGameId, displayName: 'My Game' });
        }
        
        if (!store.config?.theme?.selectedThemeId) {
          log('Setting default theme');
          store.updateConfig({
            theme: {
              ...store.config.theme || {},
              mainTheme: 'Default Theme',
              selectedThemeId: 'default-theme',
              colors: {
                primary: '#E60012',
                secondary: '#0052cc',
                accent: '#ff6600',
                background: '#ffffff'
              }
            }
          });
        }
        
        // Save current progress
        store.saveProgress();
        
        // Execute navigation with delay
        setTimeout(() => {
          // Try setStep (most direct method)
          log("Trying direct setStep(1)");
          store.setStep(1);
          
          // Verify after a short delay
          setTimeout(() => {
            const newStep = window.useGameStore.getState().currentStep;
            if (newStep === 1) {
              log("Navigation successful!", 'success');
            } else {
              log("setStep failed, trying nextStep()", 'warning');
              
              // Try nextStep as fallback
              window.useGameStore.getState().nextStep();
              
              // Check again
              setTimeout(() => {
                const finalStep = window.useGameStore.getState().currentStep;
                if (finalStep === 1) {
                  log("Navigation with nextStep successful!", 'success');
                } else {
                  log("All direct methods failed, using URL navigation", 'error');
                  urlNavigation();
                }
              }, 200);
            }
          }, 200);
        }, 100);
      } else {
        log("Store not available, using URL navigation", 'warning');
        urlNavigation();
      }
    } catch (e) {
      log(`Error during navigation: ${e.message}`, 'error');
      urlNavigation();
    }
  };

  // URL-based navigation as a fallback
  const urlNavigation = () => {
    log("Using URL-based navigation", 'warning');
    
    try {
      // First save any state to localStorage
      if (window.useGameStore) {
        const store = window.useGameStore.getState();
        const config = store.config || {};
        
        localStorage.setItem('slotai_preserved_nav_state', JSON.stringify({
          gameId: config.gameId,
          theme: config.theme,
          timestamp: Date.now()
        }));
      }
      
      // Set emergency navigation flags
      localStorage.setItem('slotai_emergency_nav', 'true');
      localStorage.setItem('slotai_target_step', '1');
      localStorage.setItem('slotai_timestamp', Date.now().toString());
      localStorage.setItem('slotai_preserve_ui', 'true');
      
      // Navigate with UI preservation flag
      window.location.href = '/?step=1&preserve_ui=true&t=' + Date.now();
    } catch (e) {
      log(`URL navigation failed: ${e.message}`, 'error');
      showLastResortPrompt();
    }
  };

  // Show last resort instructions
  const showLastResortPrompt = () => {
    const promptDiv = document.createElement('div');
    promptDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      width: 90%;
      z-index: 10001;
      font-family: system-ui, sans-serif;
    `;
    
    promptDiv.innerHTML = `
      <h3 style="margin-top: 0;">Navigation Error</h3>
      <p>All navigation methods failed. Please try one of these options:</p>
      <ol style="padding-left: 20px;">
        <li>Refresh the page and try again</li>
        <li>Use this URL: <a href="/?step=1&force=true" style="color: blue;">Go to Step 2</a></li>
        <li>Or this standalone page: <a href="/standalone-step2.html" style="color: blue;">Standalone Step 2</a></li>
      </ol>
      <button id="close-prompt" style="padding: 8px 16px; background: #E60012; color: white; border: none; border-radius: 4px; margin-top: 10px; cursor: pointer;">Close</button>
    `;
    
    document.body.appendChild(promptDiv);
    
    document.getElementById('close-prompt').addEventListener('click', () => {
      promptDiv.remove();
    });
  };

  // Initialize the fix
  const initialize = () => {
    log("Initializing navigation fix...");
    
    // Check if we're on Step 1 first
    if (!isStep1Page()) {
      log("Not on Step 1, no fixes needed");
      return;
    }
    
    log("On Step 1, starting navigation fix", 'info');
    
    // Start the fix process
    fixNavigation();
  };

  // Run the initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // Small delay to ensure React is fully initialized
    setTimeout(initialize, 1000);
  }
})();