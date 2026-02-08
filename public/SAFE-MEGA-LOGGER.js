/**
 * SAFE-MEGA-LOGGER.js - Memory-safe version of MEGA-LOGGER
 * 
 * This is a safer version of MEGA-LOGGER with:
 * - Reduced log capacity (200 max logs)
 * - Memory safety checks
 * - Safe initialization
 * - Optional disable via URL parameter
 */

(function() {
  // Check for safe mode, recovery, or disable logger parameters
  const urlParams = new URLSearchParams(window.location.search);
  const isRecoveryComplete = urlParams.has('recovered') || localStorage.getItem('slotai_recovery_complete') === 'true';
  const isEmergencyScriptsDisabled = window.__EMERGENCY_SCRIPTS_DISABLED === true;
  
  if (urlParams.has('disableLogger') || urlParams.has('safeMode') || isRecoveryComplete || isEmergencyScriptsDisabled) {
    console.log('🔥 MEGA-LOGGER: Disabled via URL parameter or recovery state');
    
    // Create stub functions to handle any external calls to the logger
    window.MEGA_LOGGER = {
      exportLogs: () => 'Logging is disabled',
      clearLogs: () => 'Logging is disabled',
      getLogsByCategory: () => [],
      getLogs: () => [],
      addLog: () => {},
      isDisabled: true
    };
    
    // Remove any old logs in localStorage
    try {
      localStorage.removeItem('STEPFUCK_LOGS');
      localStorage.removeItem('SAFE_LOGS');
    } catch (e) {
      // Ignore errors
    }
    
    return; // Exit early
  }
  
  console.log('🔥 SAFE-MEGA-LOGGER ACTIVATED');
  
  // Create storage for logs with memory-safe limits
  const MAX_LOGS = 5; // Maximum number of log entries to keep (reduced from 10)
  const MAX_LOG_SIZE = 150; // Maximum size in characters for log data
  let logs = [];
  let isInitialized = false;
  
  // Memory safety state
  let memoryWarningIssued = false;
  let lastMemoryCheck = Date.now();
  
  // Check memory usage to ensure safety
  function checkMemorySafety() {
    // Only check memory every 5 seconds to avoid performance impact
    const now = Date.now();
    if (now - lastMemoryCheck < 5000) return true;
    
    lastMemoryCheck = now;
    
    try {
      // Check if we have access to memory info
      if (performance && performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize;
        const memoryLimit = performance.memory.jsHeapSizeLimit;
        
        // If we're using more than 75% of available memory, stop logging
        if (memoryUsage > memoryLimit * 0.75) {
          if (!memoryWarningIssued) {
            console.warn('🔥 MEGA-LOGGER: Memory usage high, disabling logging');
            memoryWarningIssued = true;
          }
          return false;
        }
      }
    } catch (e) {
      // If we can't check memory for any reason, allow logging to continue
      console.warn('🔥 MEGA-LOGGER: Could not check memory usage', e);
    }
    
    return true;
  }
  
  // Initialize from localStorage if available - with safety checks
  function safeInitialize() {
    if (isInitialized) return;
    
    // Check if recovery is complete - if so, don't load any logs
    const recoveryComplete = localStorage.getItem('slotai_recovery_complete') === 'true';
    const urlParams = new URLSearchParams(window.location.search);
    const recovered = urlParams.has('recovered');
    
    if (recoveryComplete || recovered) {
      console.log('🔥 MEGA-LOGGER: Recovery complete, skipping log loading');
      // Clean up old logs
      localStorage.removeItem('STEPFUCK_LOGS');
      logs = [];
      isInitialized = true;
      return;
    }
    
    try {
      // First check for newer safe logs
      let savedLogs = localStorage.getItem('SAFE_LOGS');
      
      // If no safe logs exist, check for old logs (but with extreme caution)
      if (!savedLogs) {
        const oldLogs = localStorage.getItem('STEPFUCK_LOGS');
        if (oldLogs) {
          console.log('🔥 MEGA-LOGGER: Found old logs, migrating to safe format');
          
          try {
            // Try to parse, but with strict limits
            const parsedOldLogs = JSON.parse(oldLogs);
            if (Array.isArray(parsedOldLogs)) {
              // Take only the first few logs to be extremely safe
              const limitedLogs = parsedOldLogs.slice(0, 5);
              
              // Immediately save in the new format
              localStorage.setItem('SAFE_LOGS', JSON.stringify(limitedLogs));
              
              // And remove the old logs
              localStorage.removeItem('STEPFUCK_LOGS');
              
              // Use these limited logs
              savedLogs = JSON.stringify(limitedLogs);
            }
          } catch (oldParseError) {
            console.error('🔥 MEGA-LOGGER: Error parsing old logs, deleting them', oldParseError);
            localStorage.removeItem('STEPFUCK_LOGS');
          }
        }
      }
      
      // Now process the logs (either new safe ones or migrated old ones)
      if (savedLogs) {
        try {
          const parsedLogs = JSON.parse(savedLogs);
          
          // Validate logs to ensure they're in the expected format
          if (Array.isArray(parsedLogs)) {
            // Only keep the most recent MAX_LOGS logs
            logs = parsedLogs.slice(0, MAX_LOGS);
            console.log(`🔥 MEGA-LOGGER: Loaded ${logs.length} existing logs (capped at ${MAX_LOGS})`);
          } else {
            throw new Error('Logs data is not an array');
          }
        } catch (parseError) {
          console.error('🔥 MEGA-LOGGER: Error parsing logs, resetting', parseError);
          localStorage.removeItem('SAFE_LOGS');
          logs = [];
        }
      }
    } catch (e) {
      console.error('🔥 MEGA-LOGGER: Error loading existing logs', e);
      logs = [];
    }
    
    isInitialized = true;
  }
  
  // Try to initialize, but don't blow up if it fails
  try {
    safeInitialize();
  } catch (error) {
    console.error('🔥 MEGA-LOGGER: Failed to initialize', error);
    logs = [];
    isInitialized = true;
  }
  
  /**
   * Add a log entry with memory safety checks
   * @param {string} category - The log category (click, navigation, store, etc.)
   * @param {string} message - The log message
   * @param {any} data - Additional data to log
   */
  function addLog(category, message, data) {
    // Check memory safety before logging
    if (!checkMemorySafety()) {
      return; // Skip logging if memory is under pressure
    }
    
    try {
      const timestamp = new Date().toISOString();
      
      // Ensure message is not too long
      const truncatedMessage = message && message.length > MAX_LOG_SIZE 
        ? message.substring(0, MAX_LOG_SIZE) + '...' 
        : message;
      
      // Ensure data is not too complex by stringifying and truncating
      let processedData = typeof data === 'undefined' ? null : data;
      if (processedData !== null) {
        try {
          // Stringify and limit size
          const stringData = JSON.stringify(processedData);
          if (stringData.length > MAX_LOG_SIZE) {
            processedData = { truncated: true, summary: stringData.substring(0, MAX_LOG_SIZE) + '...' };
          }
        } catch (e) {
          // If data can't be stringified, provide a basic summary
          processedData = { 
            unserializable: true, 
            type: typeof processedData,
            isArray: Array.isArray(processedData)
          };
        }
      }
      
      const log = {
        timestamp,
        category,
        message: truncatedMessage,
        url: window.location.href,
        data: processedData
      };
      
      // Add to our in-memory logs
      logs.unshift(log);
      
      // Trim logs if needed
      if (logs.length > MAX_LOGS) {
        logs = logs.slice(0, MAX_LOGS);
      }
      
      // Check recovery state before saving to localStorage
      const recoveryComplete = localStorage.getItem('slotai_recovery_complete') === 'true';
      const urlParams = new URLSearchParams(window.location.search);
      const recovered = urlParams.has('recovered');
      
      // Only save logs if recovery is not complete and with extremely low frequency (0.1%)
      if (!recoveryComplete && !recovered && Math.random() < 0.001) {
        try {
          // Use a different key to avoid conflicts with old logger
          localStorage.setItem('SAFE_LOGS', JSON.stringify(logs));
          // Remove old logs
          localStorage.removeItem('STEPFUCK_LOGS');
        } catch (e) {
          console.error('🔥 MEGA-LOGGER: Error saving logs to localStorage', e);
        }
      }
      
      // Logging to server is disabled in safe mode to reduce network traffic
      
      // Also log to console with category-specific formatting
      let style = '';
      switch (category) {
        case 'CLICK':
          style = 'background:#e91e63;color:white;padding:3px 5px;border-radius:3px;';
          break;
        case 'NAVIGATION':
          style = 'background:#2196f3;color:white;padding:3px 5px;border-radius:3px;';
          break;
        case 'STORE':
          style = 'background:#4caf50;color:white;padding:3px 5px;border-radius:3px;';
          break;
        case 'ERROR':
          style = 'background:#f44336;color:white;padding:3px 5px;border-radius:3px;';
          break;
        case 'NETWORK':
          style = 'background:#ff9800;color:white;padding:3px 5px;border-radius:3px;';
          break;
        default:
          style = 'background:#9c27b0;color:white;padding:3px 5px;border-radius:3px;';
      }
      
      console.log(`%c ${category} `, style, message, data || '');
    } catch (e) {
      console.error('🔥 MEGA-LOGGER: Error adding log', e);
    }
  }
  
  /**
   * Export logs to a downloadable file
   */
  function exportLogs() {
    // Format logs for readability (simplified)
    let formattedLogs = '';
    
    try {
      formattedLogs = logs.map(log => {
        return `[${log.timestamp}] [${log.category}] ${log.message}\n` +
          `URL: ${log.url}\n` +
          `Data: ${JSON.stringify(log.data, null, 2)}\n` +
          '------------------------------------------------\n';
      }).join('\n');
      
      // Create blob and download link
      const blob = new Blob([formattedLogs], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SAFE-MEGA-LOGS.log';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`🔥 MEGA-LOGGER: Exported ${logs.length} logs to SAFE-MEGA-LOGS.log`);
      return `Exported ${logs.length} logs to SAFE-MEGA-LOGS.log`;
    } catch (e) {
      console.error('🔥 MEGA-LOGGER: Error exporting logs', e);
      return 'Error exporting logs';
    }
  }
  
  /**
   * Clear all logs
   */
  function clearLogs() {
    logs = [];
    try {
      localStorage.removeItem('STEPFUCK_LOGS');
    } catch (e) {
      console.error('🔥 MEGA-LOGGER: Error clearing logs from localStorage', e);
    }
    console.log('🔥 MEGA-LOGGER: All logs cleared');
    return 'All logs cleared';
  }
  
  /**
   * Get logs filtered by category
   * @param {string} category - The category to filter by
   */
  function getLogsByCategory(category) {
    return logs.filter(log => log.category === category);
  }
  
  // Export functions to window for console access
  window.MEGA_LOGGER = {
    exportLogs,
    clearLogs,
    getLogsByCategory,
    getLogs: () => logs,
    addLog,
    isSafe: true
  };
  
  // Simplify event monitoring to reduce overhead and memory usage
  
  // Simplified click tracking - limit to buttons only
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      const element = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
      addLog('CLICK', `Clicked on button: ${element.textContent || '[empty button]'}`, {
        id: element.id || 'none'
      });
    }
  }, true);
  
  // Simplified URL change monitoring (reduced frequency)
  let lastUrl = window.location.href;
  setInterval(function() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      addLog('NAVIGATION', `URL changed to ${currentUrl}`, {
        previous: lastUrl
      });
      lastUrl = currentUrl;
    }
  }, 1000); // Check less frequently (every 1s instead of 100ms)
  
  // Simplified history tracking
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;
  
  window.history.pushState = function() {
    addLog('NAVIGATION', 'history.pushState called', {
      url: arguments[2] || 'unknown'
    });
    return originalPushState.apply(this, arguments);
  };
  
  window.history.replaceState = function() {
    addLog('NAVIGATION', 'history.replaceState called', {
      url: arguments[2] || 'unknown'
    });
    return originalReplaceState.apply(this, arguments);
  };
  
  // Error monitoring (keep this for debugging crashes)
  window.addEventListener('error', function(event) {
    addLog('ERROR', `Error: ${event.message}`, {
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error ? (event.error.stack ? event.error.stack.slice(0, MAX_LOG_SIZE) : 'No stack trace') : 'No error object'
    });
  });
  
  window.addEventListener('unhandledrejection', function(event) {
    addLog('ERROR', 'Unhandled Promise Rejection', {
      reason: event.reason ? (event.reason.stack || event.reason.message || String(event.reason)).slice(0, MAX_LOG_SIZE) : 'Unknown reason'
    });
  });
  
  // Simplified fetch monitoring - only track URL and method, not bodies
  const originalFetch = window.fetch;
  window.fetch = function() {
    const url = arguments[0];
    const options = arguments[1] || {};
    
    addLog('NETWORK', `fetch to ${url}`, {
      method: options.method || 'GET'
    });
    
    return originalFetch.apply(this, arguments)
      .then(response => {
        addLog('NETWORK', `fetch response from ${url}`, {
          status: response.status
        });
        return response;
      })
      .catch(error => {
        addLog('NETWORK', `fetch error for ${url}`, {
          error: error.message
        });
        throw error;
      });
  };
  
  // Store monitoring - reduced frequency to once every 5 seconds
  let lastStoreCheck = 0;
  const STORE_CHECK_INTERVAL = 5000; // 5 seconds
  
  setInterval(function() {
    const now = Date.now();
    if (now - lastStoreCheck < STORE_CHECK_INTERVAL) return;
    lastStoreCheck = now;
    
    if (window.useGameStore) {
      try {
        const state = window.useGameStore.getState();
        addLog('STORE', 'Current store state', {
          currentStep: state.currentStep,
          gameType: state.gameType
        });
      } catch (e) {
        addLog('ERROR', 'Error accessing store state', {
          error: e.message
        });
      }
    }
  }, 1000);
  
  // Minimal visual indicator with no animation
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    background-color: rgba(46, 125, 50, 0.9);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 12px;
    z-index: 9999;
    cursor: pointer;
  `;
  indicator.textContent = '🛡️ SAFE LOGGER ACTIVE';
  indicator.title = 'Click to export logs';
  
  indicator.addEventListener('click', function() {
    exportLogs();
  });
  
  // Only add indicator if we're NOT in recovery mode
  const shouldAddIndicator = !isRecoveryComplete && !urlParams.has('recovered');
  
  if (shouldAddIndicator) {
    // Add to page when DOM is ready
    if (document.body) {
      document.body.appendChild(indicator);
    } else {
      window.addEventListener('DOMContentLoaded', function() {
        // Double-check recovery state before adding
        if (localStorage.getItem('slotai_recovery_complete') !== 'true') {
          document.body.appendChild(indicator);
        }
      });
    }
  }
  
  // Initial log
  addLog('SYSTEM', 'SAFE-MEGA-LOGGER initialized', {
    logLimit: MAX_LOGS,
    timestamp: new Date().toISOString()
  });
  
  console.log('🛡️ SAFE-MEGA-LOGGER ready, use window.MEGA_LOGGER.exportLogs() to download logs');
})();