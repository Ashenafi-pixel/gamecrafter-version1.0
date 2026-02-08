/**
 * Step 1 to Step 2 Navigation Fix
 * 
 * This script focuses ONLY on fixing the navigation from Step 1 to Step 2.
 */

(function() {
  // CRITICAL: Check if we should run at all - if recovery is complete, exit immediately
  if (localStorage.getItem('slotai_recovery_complete') === 'true' || 
      window.__RECOVERY_COMPLETE === true || 
      window.__EMERGENCY_SCRIPTS_DISABLED === true ||
      (window.location.search.includes('recovered=true'))) {
    console.log("⚡ Step1to2Fix: Recovery complete, aborting initialization");
    return;
  }
  
  console.log("⚡ Step1to2Fix: Initializing...");

  // Wait a bit for React to initialize
  setTimeout(function() {
    // Check recovery status again before proceeding
    if (localStorage.getItem('slotai_recovery_complete') === 'true' || 
        window.__RECOVERY_COMPLETE === true || 
        window.__EMERGENCY_SCRIPTS_DISABLED === true) {
      console.log("⚡ Step1to2Fix: Recovery now complete, aborting setup");
      return;
    }
    
    // Check if we're on Step 1
    const isOnStep1 = checkIfStep1();
    
    if (isOnStep1) {
      console.log("⚡ Step1to2Fix: On Step 1, applying fix");
      
      // Try to find the Next button
      const nextButton = findNextButton();
      
      if (nextButton) {
        console.log("⚡ Step1to2Fix: Found Next button, replacing with fixed version");
        replaceButton(nextButton);
      } else {
        console.log("⚡ Step1to2Fix: Next button not found, creating emergency button");
        createEmergencyButton();
      }
    } else {
      console.log("⚡ Step1to2Fix: Not on Step 1, no fix needed");
    }
  }, 3000);
  
  // Check if we're on Step 1
  function checkIfStep1() {
    // Method 1: Check store state
    if (window.useGameStore && window.useGameStore.getState().currentStep === 0) {
      return true;
    }
    
    // Method 2: Check for theme selection in the DOM
    const themeSelectionElement = document.querySelector('.enhanced-theme-selection');
    if (themeSelectionElement) {
      return true;
    }
    
    // Method 3: Look for theme-related content in the page
    const headings = document.querySelectorAll('h1, h2, h3, h4');
    for (let heading of headings) {
      if (heading.textContent && 
          (heading.textContent.includes('Theme') || 
           heading.textContent.includes('Creative Journey'))) {
        return true;
      }
    }
    
    return false;
  }
  
  // Find the Next button
  function findNextButton() {
    // Check again if recovery is complete
    if (localStorage.getItem('slotai_recovery_complete') === 'true' || 
        window.__RECOVERY_COMPLETE === true || 
        window.__EMERGENCY_SCRIPTS_DISABLED === true) {
      console.log("⚡ Step1to2Fix: Recovery now complete, aborting button search");
      return null;
    }
    
    // Look for buttons with Next text
    const nextButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
      const content = btn.textContent || '';
      return (content.includes('Next') || 
              content.includes('Continue') || 
              content.includes('Game Type')) && 
             !btn.disabled;
    });
    
    if (nextButtons.length === 0) {
      return null;
    }
    
    // Look for red button at bottom right
    const redButton = nextButtons.find(btn => {
      const style = getComputedStyle(btn);
      const rect = btn.getBoundingClientRect();
      
      // Check if it's red
      const isRed = style.backgroundColor.includes('rgb(230') || // E60012
                  style.backgroundColor.includes('rgb(220') || 
                  style.backgroundColor.includes('rgb(255') || 
                  btn.className.includes('red') ||
                  btn.className.includes('nintendo');
                  
      // Check if it's at bottom right
      const isBottomRight = rect.bottom > window.innerHeight * 0.7 && 
                           rect.right > window.innerWidth * 0.5;
                   
      return isRed && isBottomRight;
    });
    
    return redButton || nextButtons[0]; // Fall back to first button if no red one found
  }
  
  // Replace the button with our fixed version
  function replaceButton(button) {
    // Check again if recovery is complete
    if (localStorage.getItem('slotai_recovery_complete') === 'true' || 
        window.__RECOVERY_COMPLETE === true || 
        window.__EMERGENCY_SCRIPTS_DISABLED === true) {
      console.log("⚡ Step1to2Fix: Recovery now complete, aborting button replacement");
      return;
    }
    
    // Create a clone of the button to preserve styling
    const fixedButton = document.createElement('button');
    fixedButton.innerHTML = button.innerHTML;
    fixedButton.className = button.className;
    fixedButton.setAttribute('style', button.getAttribute('style') || '');
    
    // Add data-attribute for easy identification by cleanup scripts
    fixedButton.setAttribute('data-emergency-ui', 'true');
    fixedButton.classList.add('step1to2-fix-button');
    
    // Make sure button has relative position for the indicator
    if (!fixedButton.style.position) {
      fixedButton.style.position = 'relative';
    }
    
    // Add visual indicator that this is a fixed button
    const indicator = document.createElement('span');
    indicator.style.cssText = `
      position: absolute;
      top: -4px;
      right: -4px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #4ade80;
      box-shadow: 0 0 5px rgba(74, 222, 128, 0.8);
      z-index: 100;
    `;
    fixedButton.appendChild(indicator);
    
    // Add our own reliable click handler
    fixedButton.addEventListener('click', function(e) {
      // Check one more time before navigating
      if (localStorage.getItem('slotai_recovery_complete') === 'true' || 
          window.__RECOVERY_COMPLETE === true || 
          window.__EMERGENCY_SCRIPTS_DISABLED === true) {
        console.log("⚡ Step1to2Fix: Recovery now complete, using normal navigation");
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      console.log("⚡ Step1to2Fix: Fixed button clicked");
      
      // Set localStorage flags for emergency navigation
      localStorage.setItem('slotai_emergency_nav', 'true');
      localStorage.setItem('slotai_target_step', '1');
      localStorage.setItem('slotai_timestamp', Date.now().toString());
      
      // Set game data if missing
      try {
        if (window.useGameStore) {
          const store = window.useGameStore.getState();
          const config = store.config;
          
          // Create game ID if missing
          if (!config.gameId) {
            const gameId = `game_${Date.now()}`;
            store.updateConfig({ gameId, displayName: 'My Game' });
          }
          
          // Create theme if missing
          if (!config.theme?.selectedThemeId) {
            store.updateConfig({
              theme: {
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
          
          // Save to localStorage for recovery
          localStorage.setItem('slotai_game_data', JSON.stringify({
            gameId: config.gameId || `game_${Date.now()}`,
            theme: config.theme || {
              mainTheme: 'Default Theme',
              selectedThemeId: 'default-theme'
            }
          }));
        }
      } catch (err) {
        console.error("⚡ Step1to2Fix: Error preparing navigation:", err);
      }
      
      // Use URL navigation (most reliable method)
      window.location.href = '/?step=1&force=true&t=' + Date.now();
    });
    
    // Replace the original button
    if (button.parentNode) {
      button.parentNode.replaceChild(fixedButton, button);
      console.log("⚡ Step1to2Fix: Button successfully replaced!");
    }
  }
  
  // Create emergency button if we can't find the Next button
  function createEmergencyButton() {
    // Check again if recovery is complete
    if (localStorage.getItem('slotai_recovery_complete') === 'true' || 
        window.__RECOVERY_COMPLETE === true || 
        window.__EMERGENCY_SCRIPTS_DISABLED === true) {
      console.log("⚡ Step1to2Fix: Recovery now complete, aborting emergency button creation");
      return;
    }
    
    const emergencyButton = document.createElement('button');
    emergencyButton.textContent = "GO TO STEP 2";
    emergencyButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #E60012;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      font-weight: bold;
      border: none;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    `;
    
    // Add data-attributes for easy identification by cleanup scripts
    emergencyButton.setAttribute('data-emergency-ui', 'true');
    emergencyButton.classList.add('step1to2-fix-button');
    
    emergencyButton.addEventListener('click', function() {
      // Check again if recovery is complete
      if (localStorage.getItem('slotai_recovery_complete') === 'true' || 
          window.__RECOVERY_COMPLETE === true || 
          window.__EMERGENCY_SCRIPTS_DISABLED === true) {
        console.log("⚡ Step1to2Fix: Recovery now complete, aborting navigation");
        return;
      }
      
      console.log("⚡ Step1to2Fix: Emergency button clicked");
      localStorage.setItem('slotai_emergency_nav', 'true');
      localStorage.setItem('slotai_target_step', '1');
      localStorage.setItem('slotai_timestamp', Date.now().toString());
      window.location.href = '/?step=1&force=true&t=' + Date.now();
    });
    
    document.body.appendChild(emergencyButton);
    console.log("⚡ Step1to2Fix: Emergency button created");
  }
  
  // Add a recovery state watcher to remove our overrides if recovery happens
  window.addEventListener('storage', function(e) {
    if (e.key === 'slotai_recovery_complete' && e.newValue === 'true') {
      console.log("⚡ Step1to2Fix: Recovery detected, removing all fixes");
      
      // Remove any buttons we created
      const fixButtons = document.querySelectorAll('.step1to2-fix-button');
      fixButtons.forEach(button => {
        try {
          button.remove();
        } catch (e) {
          // Ignore errors
        }
      });
    }
  });
})();