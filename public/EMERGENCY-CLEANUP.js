/**
 * EMERGENCY-CLEANUP.js - Enhanced comprehensive cleanup for emergency UIs and scripts
 * 
 * This script removes all emergency UI elements and disables emergency scripts
 * once the application has recovered. It's designed to run early in the 
 * page load cycle and prevents unnecessary UI creation.
 */

(function() {
  // Check if recovery is complete or if we're in recovered mode
  const urlParams = new URLSearchParams(window.location.search);
  const recoveryFlags = {
    recovered: urlParams.has('recovered'),
    safeMode: urlParams.has('safeMode'),
    recoveryComplete: localStorage.getItem('slotai_recovery_complete') === 'true'
  };
  
  // Set global flags immediately to prevent other scripts from creating UIs
  const isRecoveryComplete = recoveryFlags.recovered || recoveryFlags.recoveryComplete;
  
  // Add global flags for emergency scripts to check
  if (isRecoveryComplete) {
    window.__EMERGENCY_SCRIPTS_DISABLED = true;
    window.__RECOVERY_COMPLETE = true;
    
    // Create defensive property that will stop emergency scripts
    window.__NAVIGATION_STATE = {
      recoveryComplete: true,
      emergencyDisabled: true,
      disableEmergencyScripts: true
    };
    
    // Helper functions that emergency scripts may check
    window.isRecoveryCompleted = () => true;
    window.shouldDisableEmergencyScripts = () => true;
    window.getNavigationState = () => ({ 
      recoveryComplete: true,
      emergencyDisabled: true 
    });
  }
  
  console.log('🧹 EMERGENCY-CLEANUP: Initializing', recoveryFlags);
  
  // Wait for DOM to be ready before removing elements
  function cleanupEmergencyUI() {
    if (!document.body) {
      // If DOM isn't ready yet, try again later
      setTimeout(cleanupEmergencyUI, 100);
      return;
    }
    
    console.log('🧹 EMERGENCY-CLEANUP: Beginning UI cleanup');
    
    // Enhanced list of all selectors to remove
    const elementsToRemove = [
      // Data attributes
      '[data-emergency-ui]',
      '[data-emergency-ui="true"]',
      
      // Emergency navigation buttons
      '#emergency-nav-container',
      '#emergency-big-button',
      '#emergency-nav-button',
      '#emergency-debug-panel',
      '#emergency-fix-overlay',
      '#emergency-navigation-overlay',
      '#navigation-emergency-container',
      '#step-navigation-fix-container',
      '[id^="emergency-"]',
      '[id^="emergency-nav-button-"]',
      '[id*="emergency"]',
      
      // Common emergency button classes
      '.emergency-button',
      '.emergency-nav',
      '.emergency-step-fix',
      '.step1to2-fix-button',
      '.emergency-ui',
      '.emergency-overlay',
      '.emergency-control',
      '.navigation-emergency',
      '.step-navigation-fix',
      '.step-button-fix',
      '.fix-overlay',
      '.fix-button',
      '[class*="emergency"]',
      '[class*="step-fix"]',
      
      // Step menu selectors - especially bottom right menus
      '.step-menu',
      '.step-indicator',
      '.navigation-buttons',
      '.bottom-right-menu',
      '.step-navigation',
      '.fixed-bottom-right',
      '.fixed-navigation',
      '.step-dots',
      '[class*="step-nav"]',
      'div[style*="position: fixed"][style*="bottom: 20px"][style*="right: 20px"]',
      'div[style*="position: fixed"][style*="bottom:20px"][style*="right:20px"]',
      
      // Specific indicators
      'div[title="Click to export logs"]',
      'button[title*="emergency"]',
      'div[style*="position: fixed"][style*="z-index: 9999"]',
      
      // Additional reliable selectors for emergency UIs
      'div[style*="position: fixed"][style*="background-color: rgba"]',
      'div[style*="position:fixed"][style*="background-color:rgba"]',
      '.step1to2-fix-button',
      '.force-navigation-button',
      '[data-testid*="emergency"]',
      '[data-testid*="recovery"]',
      '[aria-label*="emergency"]'
    ];
    
    // Find and remove all emergency elements
    let removedCount = 0;
    elementsToRemove.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          try {
            element.remove();
            removedCount++;
          } catch (err) {
            // Fallback if remove doesn't work - with safe parent check
            if (element && element.parentNode) {
              try {
                element.parentNode.removeChild(element);
                removedCount++;
              } catch (e) {
                // Ignore any errors during removal
                console.error('Error during safe removeChild:', e);
              }
            }
          }
        });
      } catch (e) {
        console.error('🧹 EMERGENCY-CLEANUP: Error removing elements with selector:', selector, e);
      }
    });
    
    console.log(`🧹 EMERGENCY-CLEANUP: Removed ${removedCount} emergency UI elements`);
    
    // Clean up high z-index fixed position elements that might be emergency UIs
    try {
      const allElements = document.querySelectorAll('*');
      let fixedElementsRemoved = 0;
      
      allElements.forEach(el => {
        if (!el || el.nodeType !== Node.ELEMENT_NODE || !el.style) return;
        
        const style = window.getComputedStyle(el);
        const isFixed = style.position === 'fixed';
        const hasHighZIndex = parseInt(style.zIndex, 10) >= 1000;
        const isEmergencyRelated = 
          (el.id && (el.id.toLowerCase().includes('emergency') || el.id.toLowerCase().includes('fix'))) || 
          (el.className && (String(el.className).toLowerCase().includes('emergency') || String(el.className).toLowerCase().includes('fix')));
        
        if (isFixed && (hasHighZIndex || isEmergencyRelated)) {
          try {
            el.remove();
            fixedElementsRemoved++;
          } catch (e) {
            // If remove() fails, try removeChild
            if (el.parentNode) {
              el.parentNode.removeChild(el);
              fixedElementsRemoved++;
            }
          }
        }
      });
      
      if (fixedElementsRemoved > 0) {
        console.log(`🧹 EMERGENCY-CLEANUP: Removed ${fixedElementsRemoved} fixed-position emergency elements`);
      }
    } catch (e) {
      console.warn('Error cleaning fixed position elements:', e);
    }
    
    // Limit STEPFUCK_LOGS to 10 entries max if it exists
    if (localStorage.getItem('STEPFUCK_LOGS')) {
      try {
        const logs = JSON.parse(localStorage.getItem('STEPFUCK_LOGS'));
        if (Array.isArray(logs) && logs.length > 10) {
          const truncatedLogs = logs.slice(0, 10);
          localStorage.setItem('STEPFUCK_LOGS', JSON.stringify(truncatedLogs));
          console.log(`🧹 EMERGENCY-CLEANUP: Truncated STEPFUCK_LOGS from ${logs.length} to 10 entries`);
        }
      } catch (e) {
        // If parsing fails, just remove the logs entirely
        localStorage.removeItem('STEPFUCK_LOGS');
        console.log('🧹 EMERGENCY-CLEANUP: Removed corrupt STEPFUCK_LOGS');
      }
    }
    
    // Add meta flag in localStorage to indicate cleanup was performed
    try {
      localStorage.setItem('slotai_emergency_cleanup_performed', 'true');
      localStorage.setItem('slotai_emergency_cleanup_timestamp', Date.now().toString());
    } catch (e) {
      console.error('🧹 EMERGENCY-CLEANUP: Error setting localStorage cleanup flag', e);
    }
  }
  
  // Disable emergency scripts by overriding their global functions
  function disableEmergencyScripts() {
    // Create stub for the global navigation function
    if (typeof window.earlyForceNavigation === 'function') {
      const originalFunc = window.earlyForceNavigation;
      window.earlyForceNavigation = function() {
        console.log('🧹 EMERGENCY-CLEANUP: Blocked earlyForceNavigation call (recovery complete)');
        return false;
      };
      console.log('🧹 EMERGENCY-CLEANUP: Disabled earlyForceNavigation');
    }
    
    // Create stub for emergency recovery function 
    if (typeof window.emergencyRecover === 'function') {
      window.emergencyRecover = function() {
        console.log('🧹 EMERGENCY-CLEANUP: Blocked emergencyRecover call (recovery complete)');
        return false;
      };
      console.log('🧹 EMERGENCY-CLEANUP: Disabled emergencyRecover');
    }
    
    // Disable interval-based UI creators
    if (window.emergencyButtonInterval) {
      clearInterval(window.emergencyButtonInterval);
      console.log('🧹 EMERGENCY-CLEANUP: Cleared emergencyButtonInterval');
    }
    
    // Clear any emergency navigation flags
    if (window.__NAVIGATION_STATE) {
      window.__NAVIGATION_STATE.attempted = false;
      window.__NAVIGATION_STATE.recoveryComplete = true;
      console.log('🧹 EMERGENCY-CLEANUP: Updated __NAVIGATION_STATE');
    }
    
    // Override MEGA_LOGGER if it exists to minimize updates to STEPFUCK_LOGS
    if (window.MEGA_LOGGER) {
      // Keep the original functions but limit localStorage writes
      const originalAddLog = window.MEGA_LOGGER.addLog;
      
      if (typeof originalAddLog === 'function') {
        window.MEGA_LOGGER.addLog = function(category, message, data) {
          // Only pass through ERROR logs, drop the rest
          if (category === 'ERROR') {
            return originalAddLog(category, message, data);
          }
          // Skip all other logs
          return;
        };
        console.log('🧹 EMERGENCY-CLEANUP: Limited MEGA_LOGGER to error logs only');
      }
    }
  }
  
  // Restore clean navigation in Step 1 to Step 2
  function fixStepNavigation() {
    // Wait for DOM to be ready
    if (!document.body) {
      setTimeout(fixStepNavigation, 100);
      return;
    }
    
    // First pass - remove any existing step navigation emergency buttons
    function cleanExistingButtons() {
      try {
        // Clean step navigation buttons by selector
        const emergencyButtons = document.querySelectorAll(
          '.step1to2-fix-button, ' + 
          '.emergency-ui button, ' + 
          '.navigation-emergency button, ' +
          '.step-navigation-fix button, ' +
          '.step-button-fix, ' +
          '[data-emergency-ui="true"]'
        );
        
        for (let button of emergencyButtons) {
          try {
            button.remove();
          } catch (e) {
            // If remove fails, try to hide it
            if (button.style) {
              button.style.display = 'none';
            }
          }
        }
      } catch (e) {
        console.error('Error cleaning existing emergency buttons:', e);
      }
    }
    
    // Clean existing buttons right away
    cleanExistingButtons();
    
    // Monitor for Next buttons that might be added and ensure they use the correct handler
    const nextButtonObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // First, check if emergency scripts should still run
          if (window.shouldEmergencyScriptsRun && !window.shouldEmergencyScriptsRun()) {
            // If recovery is complete, just clean up existing buttons and disconnect observer
            cleanExistingButtons();
            nextButtonObserver.disconnect();
            console.log('🧹 EMERGENCY-CLEANUP: Recovery complete, disconnected observer');
            return;
          }
          
          // Look for added next buttons
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if this is a button or contains buttons
              const element = node;
              let buttons = [];
              
              if (element.tagName === 'BUTTON') {
                buttons = [element];
              } else if (element.querySelectorAll) {
                buttons = Array.from(element.querySelectorAll('button'));
              }
              
              buttons.forEach(function(button) {
                // Skip elements that lack necessary properties
                if (!button || !button.textContent) return;
                
                const buttonText = button.textContent.toLowerCase();
                if (buttonText.includes('next') || buttonText.includes('continue')) {
                  // Create a clean button to replace the original
                  const cleanButton = button.cloneNode(true);
                  
                  // Make sure it's using the React-handled onClick and not a direct href
                  if (cleanButton.hasAttribute && cleanButton.hasAttribute('onclick')) {
                    cleanButton.removeAttribute('onclick');
                  }
                  
                  // Remove any special emergency classes
                  if (cleanButton.className) {
                    cleanButton.className = cleanButton.className
                      .replace(/emergency/g, '')
                      .replace(/fix/g, '')
                      .trim();
                  }
                  
                  // Make sure the button isn't a direct navigation link
                  if (cleanButton.tagName === 'A' && cleanButton.hasAttribute('href')) {
                    const href = cleanButton.getAttribute('href');
                    if (href.includes('step=') || href.includes('force=true')) {
                      cleanButton.removeAttribute('href');
                    }
                  }
                  
                  // Replace the emergency button with our clean version
                  if (button.parentNode) {
                    button.parentNode.replaceChild(cleanButton, button);
                    console.log('🧹 EMERGENCY-CLEANUP: Cleaned Next button of emergency handlers');
                  }
                }
              });
            }
          });
        }
      });
    });
    
    // Start observing the document body for added nodes
    nextButtonObserver.observe(document.body, { childList: true, subtree: true });
    
    // Store the observer globally so we can disconnect it if needed
    window.__nextButtonObserver = nextButtonObserver;
    
    // Also run periodically to catch elements that might be missed
    setTimeout(cleanExistingButtons, 2000);
    setTimeout(cleanExistingButtons, 5000);
    
    console.log('🧹 EMERGENCY-CLEANUP: Set up Next button observer to ensure clean navigation');
  }
  
  // Disconnect any existing cleanup observers
  function disconnectObservers() {
    if (window.__emergencyCleanupObserver) {
      console.log('🧹 EMERGENCY-CLEANUP: Disconnecting existing cleanup observer');
      try {
        window.__emergencyCleanupObserver.disconnect();
      } catch (e) {
        console.error('Error disconnecting observer:', e);
      }
    }
    
    if (window.__nextButtonObserver) {
      console.log('🧹 EMERGENCY-CLEANUP: Disconnecting next button observer');
      try {
        window.__nextButtonObserver.disconnect();
      } catch (e) {
        console.error('Error disconnecting observer:', e);
      }
    }
  }
  
  // Only run the cleanup if we've recovered or we're in normal mode
  if (recoveryFlags.recovered || recoveryFlags.recoveryComplete || !recoveryFlags.safeMode) {
    console.log('🧹 EMERGENCY-CLEANUP: Recovery detected, performing cleanup');
    
    // Disconnect any existing observers
    disconnectObservers();
    
    // Run the cleanup functions
    cleanupEmergencyUI();
    disableEmergencyScripts();
    fixStepNavigation();
    
    // Additional localStorage cleanup
    const keysToRemove = [
      // Primary emergency flags
      'slotai_emergency_nav',
      'slotai_memory_crash',
      'blank_screen_detected',
      'last_emergency_ui',
      'last_emergency_ui_created',
      
      // Problematic logs
      'STEPFUCK_LOGS',
      'navigation_logs',
      
      // Legacy navigation flags
      'slotai_navigation_backup'
    ];
    
    // Clean up all emergency localStorage entries
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`🧹 EMERGENCY-CLEANUP: Removed localStorage key: ${key}`);
      } catch(e) {
        // Ignore errors
      }
    });
    
    // Set recovery flags to prevent emergency scripts
    localStorage.setItem('slotai_recovery_complete', 'true');
    localStorage.setItem('slotai_recovery_timestamp', Date.now().toString());
    
    // Execute cleanup again after a delay to catch anything added later
    setTimeout(cleanupEmergencyUI, 1000);
    setTimeout(cleanupEmergencyUI, 3000);
    setTimeout(cleanupEmergencyUI, 5000);
    
    // Set up MutationObserver to continue cleaning up any dynamically added elements
    try {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            let needsCleanup = false;
            
            // Check if any added nodes match our emergency selectors
            for (const node of mutation.addedNodes) {
              if (node.nodeType !== Node.ELEMENT_NODE) continue;
              
              const element = node;
              // Simple check for emergency-related elements to avoid heavy processing
              if (element.id && (
                element.id.includes('emergency') || 
                element.id.includes('fix') ||
                element.id.startsWith('emergency-')
              )) {
                needsCleanup = true;
                break;
              }
              
              if (element.className && (
                String(element.className).includes('emergency') ||
                String(element.className).includes('fix')
              )) {
                needsCleanup = true;
                break;
              }
            }
            
            if (needsCleanup) {
              const count = cleanupEmergencyUI();
              if (count > 0) {
                console.log(`🧹 EMERGENCY-CLEANUP: Removed dynamically added emergency UI elements`);
              }
            }
          }
        }
      });
      
      // Start observing with a configuration that watches for child nodes
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
        console.log('🧹 EMERGENCY-CLEANUP: Started MutationObserver to clean dynamically added emergency UIs');
      });
      
      // Store observer reference in window for later access
      window.__emergencyCleanupObserver = observer;
    } catch (e) {
      console.warn('Error setting up MutationObserver:', e);
    }
    
    // Execute again on page load
    window.addEventListener('load', function() {
      setTimeout(cleanupEmergencyUI, 1000);
    });
  } else {
    console.log('🧹 EMERGENCY-CLEANUP: In safe mode, skipping full cleanup');
    
    // Still limit STEPFUCK_LOGS to prevent memory issues
    if (localStorage.getItem('STEPFUCK_LOGS')) {
      try {
        const logs = JSON.parse(localStorage.getItem('STEPFUCK_LOGS'));
        if (Array.isArray(logs) && logs.length > 10) {
          const truncatedLogs = logs.slice(0, 10);
          localStorage.setItem('STEPFUCK_LOGS', JSON.stringify(truncatedLogs));
          console.log(`🧹 EMERGENCY-CLEANUP: Truncated STEPFUCK_LOGS from ${logs.length} to 10 entries`);
        }
      } catch (e) {
        localStorage.removeItem('STEPFUCK_LOGS');
      }
    }
  }
  
  // Make cleanup function available globally
  window.cleanupEmergencyUIs = cleanupEmergencyUI;
  
  // Function to check if emergency scripts should run
  window.shouldEmergencyScriptsRun = function() {
    // Always check localStorage directly rather than cached values
    const directRecoveryComplete = localStorage.getItem('slotai_recovery_complete') === 'true';
    const urlParams = new URLSearchParams(window.location.search);
    const urlRecovered = urlParams.has('recovered');
    const globalDisabled = window.__EMERGENCY_SCRIPTS_DISABLED === true;
    const globalRecoveryComplete = window.__RECOVERY_COMPLETE === true;
    const hasNavigationState = window.__NAVIGATION_STATE && window.__NAVIGATION_STATE.recoveryComplete === true;
    
    // Check all possible recovery flags to be bulletproof
    if (directRecoveryComplete || urlRecovered || globalDisabled || globalRecoveryComplete || hasNavigationState) {
      return false;
    }
    
    return true;
  };
  
  // Expose recovery state for other scripts to check
  window.__RECOVERY_STATE = {
    recovered: recoveryFlags.recovered,
    recoveryComplete: recoveryFlags.recoveryComplete,
    safeMode: recoveryFlags.safeMode,
    timestamp: Date.now()
  };
})();