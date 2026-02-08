/**
 * BLANK SCREEN FIX
 * This script attempts to fix the blank screen issue by triggering
 * a complete page reload and adding minimal direct HTML UI.
 */

(function() {
  let attempts = 0;
  const maxAttempts = 3;
  
  // Check URL parameters and recovery state
  const urlParams = new URLSearchParams(window.location.search);
  const safeMode = urlParams.has('safeMode');
  const emergency = urlParams.has('emergency');
  const recovered = urlParams.has('recovered');
  const recoveryComplete = localStorage.getItem('slotai_recovery_complete') === 'true';
  
  console.log('BLANK-SCREEN-FIX: Initializing', { 
    safeMode, 
    emergency, 
    recovered, 
    recoveryComplete 
  });
  
  // Add data-emergency-ui attribute to all emergency UIs created
  function createEmergencyUI() {
    // Create a timestamp to ensure we don't reload too frequently
    const timestamp = Date.now();
    localStorage.setItem('last_emergency_ui_created', timestamp.toString());
    
    console.log('Creating emergency UI for blank screen');
    
    // Create a helpful UI
    const emergencyDiv = document.createElement('div');
    emergencyDiv.setAttribute('data-emergency-ui', 'true');
    emergencyDiv.style.position = 'fixed';
    emergencyDiv.style.top = '0';
    emergencyDiv.style.left = '0';
    emergencyDiv.style.width = '100%';
    emergencyDiv.style.height = '100%';
    emergencyDiv.style.backgroundColor = 'white';
    emergencyDiv.style.padding = '20px';
    emergencyDiv.style.zIndex = '9999';
    
    emergencyDiv.innerHTML = `
      <div style="max-width: 600px; margin: 100px auto; background-color: #f8d7da; border-radius: 8px; padding: 20px; border: 1px solid #f5c6cb; color: #721c24;">
        <h2 style="margin-top: 0;">Application Loading Error</h2>
        <p>The application encountered a loading error. Please try one of these options:</p>
        
        <div style="margin: 20px 0;">
          <button onclick="window.location.href='/?safeMode=true&t=${timestamp}'" 
                  style="background-color: #38a169; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
            Enter Safe Mode
          </button>
          
          <button onclick="window.location.href='/?clean=true&t=${timestamp}'" 
                  style="background-color: #e53e3e; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
            Clear Cache and Reload
          </button>
          
          <button onclick="this.parentElement.parentElement.parentElement.style.display='none'"
                  style="background-color: #718096; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer;">
            Dismiss
          </button>
        </div>
        
        <div style="margin-top: 30px;">
          <p><strong>Direct Navigation Links:</strong></p>
          <div>
            <a href="/?step=0&force=true&t=${timestamp}" 
               style="display: inline-block; margin: 5px 10px 5px 0; padding: 8px 15px; background-color: #48bb78; color: white; text-decoration: none; border-radius: 5px;">
              Step 1: Theme
            </a>
            <a href="/?step=1&force=true&t=${timestamp}" 
               style="display: inline-block; margin: 5px 10px 5px 0; padding: 8px 15px; background-color: #48bb78; color: white; text-decoration: none; border-radius: 5px;">
              Step 2: Game Type
            </a>
            <a href="/?step=2&force=true&t=${timestamp}" 
               style="display: inline-block; margin: 5px 10px 5px 0; padding: 8px 15px; background-color: #48bb78; color: white; text-decoration: none; border-radius: 5px;">
              Step 3: Grid
            </a>
          </div>
        </div>
        
        <div style="margin-top: 20px; font-size: 12px; color: #666;">
          <p id="memoryUsageDisplay">Checking memory usage...</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(emergencyDiv);
    
    // Add memory usage monitoring to the emergency UI
    function updateMemoryDisplay() {
      try {
        if (performance && performance.memory) {
          const memUsage = performance.memory.usedJSHeapSize;
          const memLimit = performance.memory.jsHeapSizeLimit;
          const usagePercent = (memUsage / memLimit) * 100;
          
          const usedMB = Math.round(memUsage / (1024 * 1024));
          const totalMB = Math.round(memLimit / (1024 * 1024));
          
          const memoryDisplay = document.getElementById('memoryUsageDisplay');
          if (memoryDisplay) {
            memoryDisplay.textContent = `Memory usage: ${usedMB}MB / ${totalMB}MB (${usagePercent.toFixed(1)}%)`;
            
            // Color code based on usage
            if (usagePercent > 80) {
              memoryDisplay.style.color = '#e53e3e';
              memoryDisplay.style.fontWeight = 'bold';
            } else if (usagePercent > 70) {
              memoryDisplay.style.color = '#dd6b20';
            } else {
              memoryDisplay.style.color = '#38a169';
            }
          }
        }
      } catch (e) {
        console.error('Error updating memory display', e);
      }
    }
    
    // Update memory display every 3 seconds
    updateMemoryDisplay();
    setInterval(updateMemoryDisplay, 3000);
    
    // Also try to clear problematic localStorage items
    setTimeout(() => {
      try {
        // Only clear app-specific localStorage items related to emergency state
        const keysToRemove = [
          'slotai_emergency_nav',
          'slotai_memory_crash',
          'STEPFUCK_LOGS'
        ];
        
        // Remove the identified keys
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log(`Cleared emergency state localStorage items`);
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
    }, 500);
  }

  function checkForBlankScreen() {
    // Skip checks if recovery is complete or we're already in safe mode
    if (recoveryComplete || safeMode || recovered) {
      console.log('BLANK-SCREEN-FIX: Recovery complete or in safe mode, skipping check');
      return;
    }
    
    attempts++;
    console.log(`Blank screen check attempt ${attempts}/${maxAttempts}`);

    // Check if the page appears to be blank (root div empty)
    const rootDiv = document.getElementById('root');
    
    // If the root div exists but has no content, or only has a few child nodes
    if (rootDiv && (rootDiv.innerHTML.trim() === '' || rootDiv.childNodes.length < 3)) {
      console.log('Detected blank screen condition!');
      
      // Don't create emergency UI if we already created one recently (within 30 seconds)
      // This prevents multiple UIs from stacking and loop reloads
      const lastUICreated = parseInt(localStorage.getItem('last_emergency_ui_created') || '0');
      const now = Date.now();
      const THIRTY_SECONDS = 30 * 1000;
      
      if (now - lastUICreated > THIRTY_SECONDS) {
        createEmergencyUI();
      } else {
        console.log('Emergency UI created too recently, not creating another');
        
        // If we've already created emergency UI recently but screen is still blank,
        // and we're not in safe mode, force safe mode
        if (!safeMode && !emergency) {
          console.log('Blank screen persists, redirecting to safe mode');
          window.location.href = '/?safeMode=true&t=' + now;
        }
      }
      
      return; // Stop checking once we've detected and fixed the issue
    } else if (rootDiv) {
      // We have content, clear any emergency flags
      console.log('BLANK-SCREEN-FIX: Root has content, app loaded successfully');
      localStorage.removeItem('last_emergency_ui_created');
    }
    
    // If we haven't reached max attempts and haven't detected a blank screen yet, try again
    if (attempts < maxAttempts) {
      setTimeout(checkForBlankScreen, 2000); // Check again after 2 seconds
    }
  }

  // Check if emergency scripts should even run
  function shouldRunEmergencyChecks() {
    // Always recheck localStorage rather than using cached values
    const directRecoveryComplete = localStorage.getItem('slotai_recovery_complete') === 'true';
    
    // Check all possible recovery flags
    if (safeMode || directRecoveryComplete || recovered) return false;
    
    // Check global flags set by EMERGENCY-CLEANUP.js
    if (window.__EMERGENCY_SCRIPTS_DISABLED === true) return false;
    if (window.__RECOVERY_COMPLETE === true) return false;
    
    // Check navigation state object if it exists
    if (window.__NAVIGATION_STATE && 
        (window.__NAVIGATION_STATE.recoveryComplete === true || 
         window.__NAVIGATION_STATE.emergencyDisabled === true || 
         window.__NAVIGATION_STATE.disableEmergencyScripts === true)) {
      return false;
    }
    
    // Check helper function if available - this is now the most comprehensive check
    if (typeof window.shouldEmergencyScriptsRun === 'function') {
      return window.shouldEmergencyScriptsRun();
    }
    
    // If we have a recovery timestamp in the last 2 minutes, don't run checks
    const recoveryTimestamp = parseInt(localStorage.getItem('slotai_recovery_timestamp') || '0');
    const TWO_MINUTES = 2 * 60 * 1000;
    if (recoveryTimestamp > 0 && (Date.now() - recoveryTimestamp < TWO_MINUTES)) {
      return false;
    }
    
    return true;
  }
  
  // Wait for the page to load
  window.addEventListener('load', function() {
    // Skip blank screen checks if we're in safe mode or recovery is complete
    if (!shouldRunEmergencyChecks()) {
      console.log('BLANK-SCREEN-FIX: Recovery complete or safe mode, skipping check');
      return;
    }
    
    // Start checking after a short delay to give React time to render
    setTimeout(checkForBlankScreen, 3000);
  });
  
  // Add a global emergency recovery function
  window.emergencyRecover = function() {
    // Clear emergency flags and reload in safe mode
    localStorage.removeItem('slotai_emergency_nav');
    localStorage.removeItem('slotai_memory_crash');
    localStorage.setItem('slotai_recovery_timestamp', Date.now().toString());
    
    // Redirect to safe mode
    window.location.href = '/?safeMode=true&t=' + Date.now();
  };
  
  // If recovery is already complete, hide any existing emergency UIs
  if (recoveryComplete || recovered) {
    window.addEventListener('load', function() {
      console.log('BLANK-SCREEN-FIX: Recovery complete, hiding emergency UIs');
      const emergencyUIs = document.querySelectorAll('[data-emergency-ui="true"]');
      emergencyUIs.forEach(ui => {
        try {
          if (ui && ui.style) {
            ui.style.display = 'none';
          }
        } catch (e) {
          // Ignore errors, try vanilla JS
          try {
            ui.style.display = 'none';
          } catch (e2) {
            // Last attempt - use setAttribute
            ui.setAttribute('style', 'display: none !important');
          }
        }
      });
    });
  }
  
  // Also check if the URL has emergency parameters
  if (emergency && !safeMode && !recoveryComplete && !recovered) {
    // Override normal loading only if not in safe mode and recovery not complete
    window.addEventListener('load', function() {
      console.log('BLANK-SCREEN-FIX: Emergency mode active, showing emergency UI');
      createEmergencyUI();
    });
  }
})();