/**
 * EMERGENCY BIG BUTTON AND FILE LOGGER
 * This script creates an unmissable button directly above "Choose Your Theme"
 * and also logs navigation events to the console and to localStorage
 */

(function() {
  console.log("🚨 EMERGENCY BIG BUTTON SCRIPT LOADED");

  // Time-based ID to ensure unique identification
  const buttonId = 'emergency-nav-button-' + Date.now();
  
  // Create logs array in localStorage if it doesn't exist
  if (!localStorage.getItem('navigation_logs')) {
    localStorage.setItem('navigation_logs', JSON.stringify([]));
  }

  // Log function that writes to localStorage
  function logEvent(message, data) {
    try {
      // Get existing logs
      const logs = JSON.parse(localStorage.getItem('navigation_logs') || '[]');
      
      // Add new log with timestamp
      logs.unshift({
        timestamp: new Date().toISOString(),
        message: message,
        data: data || null
      });
      
      // Keep only the last 100 logs
      if (logs.length > 100) {
        logs.length = 100;
      }
      
      // Save back to localStorage
      localStorage.setItem('navigation_logs', JSON.stringify(logs));
      
      // Also log to console
      console.log(`🚨 EMERGENCY LOG: ${message}`, data || '');
    } catch (e) {
      console.error("Failed to log to localStorage:", e);
    }
  }

  // Function to add the emergency big button
  function addEmergencyButton() {
    logEvent("Adding emergency big button to page");
    
    try {
      // Find the theme title - any h2 element that contains "theme"
      const themeElements = Array.from(document.querySelectorAll('h2, h1')).filter(el => 
        el.textContent && el.textContent.toLowerCase().includes('theme')
      );
      
      let targetElement = null;
      
      if (themeElements.length > 0) {
        targetElement = themeElements[0];
        logEvent("Found theme title element", { text: targetElement.textContent });
      } else {
        // Fallback to just putting at the top of the body
        targetElement = document.body.firstChild;
        logEvent("No theme title found, using body first child as target");
      }
      
      // Create the emergency button
      const button = document.createElement('div');
      button.id = buttonId;
      button.style.cssText = `
        background: linear-gradient(to right, #ff0000, #ff5e00);
        color: white;
        padding: 20px;
        margin: 20px 0;
        border-radius: 8px;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        z-index: 10000;
        position: relative;
        animation: pulse 2s infinite;
      `;
      
      // Add animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
      
      button.innerHTML = '⚠️ CLICK HERE TO GO TO STEP 2 ⚠️';
      
      // Add click handler
      button.addEventListener('click', function() {
        logEvent("Emergency button clicked");
        
        try {
          // Try to update the store directly if possible
          if (window.useGameStore) {
            const store = window.useGameStore.getState();
            logEvent("Found useGameStore, setting step directly");
            
            // Ensure we have the required data
            if (!store.config.gameId) {
              const newGameId = 'emergency_' + Date.now();
              logEvent("Setting emergency gameId", { gameId: newGameId });
              store.updateConfig({ gameId: newGameId });
            }
            
            // Try to set step directly
            store.setStep(1);
            logEvent("Called store.setStep(1)");
            
            // Verify it worked after a short delay
            setTimeout(() => {
              const currentStep = window.useGameStore.getState().currentStep;
              logEvent("Current step after setStep", { step: currentStep });
              
              if (currentStep !== 1) {
                // Try nextStep
                window.useGameStore.getState().nextStep();
                logEvent("Called store.nextStep()");
                
                // Final verification
                setTimeout(() => {
                  const finalStep = window.useGameStore.getState().currentStep;
                  logEvent("Current step after nextStep", { step: finalStep });
                  
                  if (finalStep !== 1) {
                    // Fallback to URL navigation
                    logEvent("Direct methods failed, using URL navigation");
                    window.location.href = '/?step=1&force=true&t=' + Date.now();
                  }
                }, 200);
              }
            }, 200);
          } else {
            // Store not found, use URL navigation directly
            logEvent("useGameStore not found, using URL navigation");
            window.location.href = '/?step=1&force=true&t=' + Date.now();
          }
        } catch (e) {
          logEvent("Error during navigation", { error: e.message });
          // Last resort
          window.location.href = '/?step=1&force=true&emergency=true&t=' + Date.now();
        }
      });
      
      // Insert the button before the target element
      if (targetElement && targetElement.parentNode) {
        targetElement.parentNode.insertBefore(button, targetElement);
        logEvent("Emergency button added to page");
      } else {
        // Fallback to just appending to body
        document.body.appendChild(button);
        logEvent("Emergency button added to body (fallback)");
      }
      
      // Also add a global function to dump logs to console
      window.dumpNavigationLogs = function() {
        const logs = JSON.parse(localStorage.getItem('navigation_logs') || '[]');
        console.log('NAVIGATION LOGS:', logs);
        return logs;
      };
      
      logEvent("Added global dumpNavigationLogs function");
    } catch (e) {
      logEvent("Error adding emergency button", { error: e.message });
      
      // Super fallback - add fixed position button
      try {
        const fallbackButton = document.createElement('div');
        fallbackButton.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: red;
          color: white;
          padding: 20px;
          border-radius: 8px;
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          cursor: pointer;
          z-index: 100000;
          box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        `;
        fallbackButton.innerHTML = '⚠️ EMERGENCY NAVIGATION TO STEP 2 ⚠️';
        fallbackButton.onclick = function() {
          window.location.href = '/?step=1&force=true&t=' + Date.now();
        };
        document.body.appendChild(fallbackButton);
        logEvent("Added fallback fixed position button");
      } catch (err) {
        logEvent("Critical error, all button additions failed", { error: err.message });
      }
    }
  }
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(addEmergencyButton, 1000);
    });
  } else {
    setTimeout(addEmergencyButton, 1000);
    // Also retry after a longer delay in case the theme element loads later
    setTimeout(addEmergencyButton, 3000);
  }
  
  // Write logs to localStorage
  logEvent("Emergency big button script initialized");
})();