/**
 * Step Navigation Fix for SlotAI
 * Version: 1.0.0 (2025-05-16)
 * 
 * This script fixes the navigation between steps while preserving the global UI/UX,
 * including the steps tab on the left and the top navbar.
 */

(function() {
  console.log("🔄 Step Navigation Fix - Initializing...");
  
  // Add persistent logging
  function logToStorage(message, data) {
    try {
      // Get existing logs
      const existingLogsStr = localStorage.getItem('debug_nav_logs') || '[]';
      const existingLogs = JSON.parse(existingLogsStr);
      
      // Create new log entry
      const logEntry = {
        timestamp: Date.now(),
        message: message,
        data: data ? JSON.stringify(data) : null,
        step: getCurrentStep()
      };
      
      // Add to logs and trim if necessary
      existingLogs.unshift(logEntry);
      if (existingLogs.length > 100) {
        existingLogs.length = 100;
      }
      
      // Save logs
      localStorage.setItem('debug_nav_logs', JSON.stringify(existingLogs));
      
      // Also log to console
      console.log(`🧭 [FixScript] ${message}`, data || '');
    } catch (e) {
      console.error('Failed to log to storage:', e);
    }
  }
  
  // Get current step from URL
  function getCurrentStep() {
    try {
      const params = new URLSearchParams(window.location.search);
      const stepParam = params.get('step');
      return stepParam ? parseInt(stepParam, 10) : null;
    } catch (e) {
      return null;
    }
  }
  
  // Log initialization
  logToStorage('Navigation Fix Script initialized');
  
  // Add emergency UI with direct navigation buttons
  function addEmergencyUI() {
    try {
      // Create a container for our emergency navigation UI
      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background-color: rgba(220, 38, 38, 0.9);
        color: white;
        padding: 15px;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      `;
      
      // Add a title
      const title = document.createElement('h2');
      title.textContent = 'Navigation Emergency UI';
      title.style.cssText = `
        margin: 0;
        font-size: 16px;
        font-weight: bold;
      `;
      container.appendChild(title);
      
      // Add buttons row
      const buttonsRow = document.createElement('div');
      buttonsRow.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 10px;
      `;
      
      // Add direct navigation button
      const directButton = document.createElement('button');
      directButton.textContent = 'Direct to Step 2';
      directButton.style.cssText = `
        background-color: white;
        color: #b91c1c;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
      `;
      directButton.onclick = () => {
        window.location.href = '/?step=1&force=true&t=' + Date.now();
      };
      buttonsRow.appendChild(directButton);
      
      // Add standalone button
      const standaloneButton = document.createElement('a');
      standaloneButton.textContent = 'Open Step 2 in New Tab';
      standaloneButton.style.cssText = `
        background-color: #0f172a;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
      `;
      standaloneButton.href = '/standalone-step2.html';
      standaloneButton.target = '_blank';
      buttonsRow.appendChild(standaloneButton);
      
      // Add dismiss button
      const dismissButton = document.createElement('button');
      dismissButton.textContent = 'Dismiss';
      dismissButton.style.cssText = `
        background-color: transparent;
        color: white;
        border: 1px solid white;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
      `;
      dismissButton.onclick = () => {
        container.style.display = 'none';
      };
      buttonsRow.appendChild(dismissButton);
      
      container.appendChild(buttonsRow);
      
      // Add to body
      document.body.appendChild(container);
      
      logToStorage('Added emergency UI to page');
    } catch (e) {
      logToStorage('Error adding emergency UI', { error: e.message });
    }
  }

  // Wait for page to be fully loaded
  function init() {
    // Add the emergency UI first thing
    setTimeout(addEmergencyUI, 500);
    // Check if we're on step 1
    if (isStep1Page()) {
      logToStorage("Step Navigation Fix - On Step 1, applying fixes...");
      setTimeout(fixStep1Navigation, 1000);
    } else {
      logToStorage("Step Navigation Fix - Not on Step 1, no fixes needed.");
    }
  }
  
  // Check if we're on Step 1 (Theme Selection)
  function isStep1Page() {
    try {
      // Method 1: Check store
      if (window.useGameStore) {
        const currentStep = window.useGameStore.getState().currentStep;
        if (currentStep === 0) {
          return true;
        }
      }
      
      // Method 2: Check DOM
      return !!document.querySelector('.enhanced-theme-selection') ||
             !!document.querySelector('[class*="theme-selection"]');
    } catch (e) {
      logToStorage("Step Navigation Fix - Error checking page", { error: e.message });
      return false;
    }
  }
  
  // Fix navigation for Step 1
  function fixStep1Navigation() {
    try {
      // Find the Next button
      const nextButton = findNextButton();
      if (!nextButton) {
        logToStorage("Step Navigation Fix - Could not find Next button, will retry...");
        setTimeout(fixStep1Navigation, 1000);
        return;
      }
      
      logToStorage("Step Navigation Fix - Found Next button, applying fix...");
      
      // Create a wrapper to preserve the original styling
      const buttonWrapper = nextButton.parentElement;
      
      // Create fixed button with same styling
      const fixedButton = nextButton.cloneNode(true);
      fixedButton.id = 'fixed-next-button';
      
      // Add fixed CSS to ensure the button is visible
      fixedButton.style.position = 'relative';
      
      // Add a small indicator that it's been fixed
      const indicator = document.createElement('span');
      indicator.style.cssText = `
        position: absolute;
        top: -5px;
        right: -5px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #4ade80;
        box-shadow: 0 0 5px #4ade80;
      `;
      fixedButton.appendChild(indicator);
      
      // Replace the button with our fixed version
      buttonWrapper.replaceChild(fixedButton, nextButton);
      
      // Add our custom click handler
      fixedButton.addEventListener('click', handleNextButtonClick);
      
      logToStorage("Step Navigation Fix - Next button fixed successfully!");
    } catch (e) {
      logToStorage("Step Navigation Fix - Error applying fix", { error: e.message });
    }
  }
  
  // Find the Next button on the Step 1 page
  function findNextButton() {
    // Strategy 1: Look for buttons with "Next" or "Continue" text
    const buttonsByText = Array.from(document.querySelectorAll('button')).filter(btn => 
      (btn.textContent?.includes('Next') || btn.textContent?.includes('Continue')) && 
      !btn.textContent?.includes('Force') &&
      !btn.disabled &&
      getComputedStyle(btn).display !== 'none'
    );
    
    if (buttonsByText.length > 0) {
      logToStorage(`Step Navigation Fix - Found Next buttons by text`, { count: buttonsByText.length });
      
      // Try to find the red button at the bottom right
      const redNextBtn = buttonsByText.find(btn => {
        const style = getComputedStyle(btn);
        const isRed = style.backgroundColor.includes('rgb(220') || 
                      style.backgroundColor.includes('rgb(239') || 
                      style.backgroundColor.includes('rgb(230') || 
                      btn.classList.contains('bg-red') ||
                      btn.classList.contains('from-red') ||
                      btn.className.includes('red');
                      
        const rect = btn.getBoundingClientRect();
        const isBottomRight = rect.bottom > window.innerHeight * 0.5 && 
                             rect.right > window.innerWidth * 0.5;
        
        return isRed && isBottomRight;
      });
      
      if (redNextBtn) {
        logToStorage("Step Navigation Fix - Found red Next button!");
        return redNextBtn;
      }
      
      // Fall back to first button
      return buttonsByText[0];
    }
    
    // Strategy 2: Look for any buttons at the bottom right
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      const rect = btn.getBoundingClientRect();
      if (rect.bottom > window.innerHeight * 0.7 && rect.right > window.innerWidth * 0.6) {
        logToStorage("Step Navigation Fix - Found button at bottom right");
        return btn;
      }
    }
    
    return null;
  }
  
  // Custom handler for the Next button click
  function handleNextButtonClick(e) {
    // Prevent default behavior
    e.preventDefault();
    e.stopPropagation();
    
    logToStorage("Step Navigation Fix - Fixed Next button clicked");
    
    // This is our carefully crafted navigation handler
    // The key is to avoid URL-based navigation to preserve the global UI
    
    try {
      if (!window.useGameStore) {
        logToStorage("Step Navigation Fix - useGameStore not found, cannot perform in-app navigation");
        fallbackNavigation();
        return;
      }
      
      // Get the store
      const store = window.useGameStore.getState();
      
      // 1. Ensure we have required data
      ensureRequiredData(store);
      
      // 2. Execute the step change with proper timeout to avoid React state conflicts
      executeStepChange(store);
      
    } catch (error) {
      logToStorage("Step Navigation Fix - Error during navigation", { error: error.message });
      fallbackNavigation();
    }
  }
  
  // Make sure we have the required data before navigating
  function ensureRequiredData(store) {
    // Create a config updates object
    const updates = {};
    const config = store.config || {};
    
    // Check if we need to create a game ID
    if (!config.gameId) {
      const themeName = config.theme?.mainTheme || 'mygame';
      const baseId = themeName.toLowerCase().replace(/\s+/g, '-');
      const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const newGameId = `${baseId}_${formattedDate}`;
      
      logToStorage(`Step Navigation Fix - Creating gameId`, { newGameId });
      updates.gameId = newGameId;
      updates.displayName = config.theme?.mainTheme || 'My Game';
    }
    
    // Check if we need to set a theme
    if (!config.theme?.selectedThemeId) {
      logToStorage("Step Navigation Fix - Setting default theme");
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
    }
    
    // Apply updates if needed
    if (Object.keys(updates).length > 0) {
      logToStorage("Step Navigation Fix - Applying data updates", updates);
      store.updateConfig(updates);
    }
  }
  
  // Execute the step change with safeguards
  function executeStepChange(store) {
    logToStorage("Step Navigation Fix - Executing step change");
    
    // First, get the current step for logging
    const beforeStep = store.currentStep;
    
    // Create a series of timed operations to ensure reliable navigation
    setTimeout(() => {
      try {
        // 1. Direct store manipulation - most reliable method
        logToStorage("Step Navigation Fix - Setting step to 1 via store.setStep()");
        store.setStep(1);
        
        // 2. Verify change after a short delay
        setTimeout(() => {
          const afterStep = window.useGameStore.getState().currentStep;
          logToStorage(`Step Navigation Fix - Step changed`, { from: beforeStep, to: afterStep });
          
          if (afterStep !== 1) {
            logToStorage("Step Navigation Fix - First method failed, trying nextStep()");
            // 3. Try alternative method
            window.useGameStore.getState().nextStep();
            
            // 4. Check again
            setTimeout(() => {
              const finalStep = window.useGameStore.getState().currentStep;
              logToStorage(`Step Navigation Fix - After nextStep()`, { finalStep });
              
              if (finalStep !== 1) {
                logToStorage("Step Navigation Fix - All direct methods failed");
                fallbackNavigation();
              }
            }, 200);
          }
        }, 200);
      } catch (error) {
        logToStorage("Step Navigation Fix - Error during step change", { error: error.message });
        fallbackNavigation();
      }
    }, 50);
  }
  
  // Last resort fallback navigation
  function fallbackNavigation() {
    logToStorage("Step Navigation Fix - Using fallback navigation");
    
    try {
      // Try to preserve state
      if (window.useGameStore) {
        const store = window.useGameStore.getState();
        const config = store.config || {};
        
        localStorage.setItem('slotai_preserved_nav_state', JSON.stringify({
          gameId: config.gameId,
          theme: config.theme,
          timestamp: Date.now()
        }));
      }
      
      // Set navigation flags
      localStorage.setItem('slotai_emergency_nav', 'true');
      localStorage.setItem('slotai_target_step', '1');
      localStorage.setItem('slotai_timestamp', Date.now().toString());
      localStorage.setItem('slotai_preserve_ui', 'true');
      
      // Navigate
      window.location.href = '/?step=1&preserve_ui=true&t=' + Date.now();
    } catch (e) {
      logToStorage("Step Navigation Fix - Fallback navigation failed", { error: e.message });
      alert("Navigation failed. Please try reloading the page.");
    }
  }
  
  // Start the fix
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();