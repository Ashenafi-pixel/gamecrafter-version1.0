/**
 * MEGA-LOGGER.js
 * 
 * This script logs EVERYTHING to both the console and to localStorage.
 * It captures:
 * - All React state changes
 * - All button clicks
 * - All navigation events
 * - All errors
 * - All store updates
 * - All network requests
 * 
 * HOW TO USE:
 * 1. Add this script to your index.html
 * 2. Check the logs via localStorage.getItem('STEPFUCK_LOGS')
 * 3. Or use the exportLogs() function in the console
 */

(function() {
  console.log('🔥 MEGA-LOGGER ACTIVATED');
  
  // Create storage for logs
  const MAX_LOGS = 10000; // Maximum number of log entries to keep
  let logs = [];
  
  // Initialize from localStorage if available
  try {
    const savedLogs = localStorage.getItem('STEPFUCK_LOGS');
    if (savedLogs) {
      logs = JSON.parse(savedLogs);
      console.log(`🔥 MEGA-LOGGER: Loaded ${logs.length} existing logs`);
    }
  } catch (e) {
    console.error('🔥 MEGA-LOGGER: Error loading existing logs', e);
  }
  
  /**
   * Add a log entry
   * @param {string} category - The log category (click, navigation, store, etc.)
   * @param {string} message - The log message
   * @param {any} data - Additional data to log
   */
  function addLog(category, message, data) {
    const timestamp = new Date().toISOString();
    const log = {
      timestamp,
      category,
      message,
      url: window.location.href,
      data: typeof data === 'undefined' ? null : data
    };
    
    // Add to our in-memory logs
    logs.unshift(log);
    
    // Trim logs if needed
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(0, MAX_LOGS);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem('STEPFUCK_LOGS', JSON.stringify(logs));
    } catch (e) {
      console.error('🔥 MEGA-LOGGER: Error saving logs to localStorage', e);
    }
    
    // ALSO write to file via the log server
    try {
      fetch('http://localhost:3501/write-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          message,
          data: {
            ...data,
            url: window.location.href,
            timestamp
          }
        })
      }).catch(err => {
        console.error('🔥 MEGA-LOGGER: Error sending log to server', err);
      });
    } catch (e) {
      console.error('🔥 MEGA-LOGGER: Error sending log to server', e);
    }
    
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
  }
  
  /**
   * Export logs to a downloadable file
   */
  function exportLogs() {
    // Format logs for readability
    const formattedLogs = logs.map(log => {
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
    a.download = 'STEPFUCK.log';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`🔥 MEGA-LOGGER: Exported ${logs.length} logs to STEPFUCK.log`);
    return `Exported ${logs.length} logs to STEPFUCK.log`;
  }
  
  /**
   * Clear all logs
   */
  function clearLogs() {
    logs = [];
    localStorage.removeItem('STEPFUCK_LOGS');
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
  
  // 1. Log all clicks on the page
  document.addEventListener('click', function(e) {
    // Get info about the clicked element
    const element = e.target;
    const tagName = element.tagName;
    const id = element.id || 'none';
    const classes = element.className || 'none';
    const text = element.innerText || element.textContent || 'none';
    
    // Additional info for buttons
    let extraInfo = {};
    if (tagName === 'BUTTON' || element.closest('button')) {
      const button = tagName === 'BUTTON' ? element : element.closest('button');
      extraInfo = {
        disabled: button.disabled,
        type: button.type || 'button',
        ariaLabel: button.getAttribute('aria-label') || 'none',
        dataAttributes: {}
      };
      
      // Capture all data attributes
      Array.from(button.attributes).forEach(attr => {
        if (attr.name.startsWith('data-')) {
          extraInfo.dataAttributes[attr.name] = attr.value;
        }
      });
    }
    
    addLog('CLICK', `Clicked on ${tagName}#${id}.${classes}`, {
      text,
      coordinates: { x: e.clientX, y: e.clientY },
      ...extraInfo
    });
  }, true);
  
  // 2. Monitor URL changes for navigation
  let lastUrl = window.location.href;
  setInterval(function() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      addLog('NAVIGATION', `URL changed from ${lastUrl} to ${currentUrl}`, {
        previous: lastUrl,
        current: currentUrl,
        changed: new Date().toISOString()
      });
      lastUrl = currentUrl;
    }
  }, 100);
  
  // 3. Monitor history changes
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;
  
  window.history.pushState = function() {
    addLog('NAVIGATION', 'history.pushState called', {
      arguments: Array.from(arguments)
    });
    return originalPushState.apply(this, arguments);
  };
  
  window.history.replaceState = function() {
    addLog('NAVIGATION', 'history.replaceState called', {
      arguments: Array.from(arguments)
    });
    return originalReplaceState.apply(this, arguments);
  };
  
  // 4. Monitor for errors
  window.addEventListener('error', function(event) {
    addLog('ERROR', `Error: ${event.message}`, {
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error ? event.error.stack : 'No stack trace'
    });
  });
  
  // 5. Monitor for unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    addLog('ERROR', 'Unhandled Promise Rejection', {
      reason: event.reason ? (event.reason.stack || event.reason.message || String(event.reason)) : 'Unknown reason'
    });
  });
  
  // 6. Monitor fetch requests
  const originalFetch = window.fetch;
  window.fetch = function() {
    const url = arguments[0];
    const options = arguments[1] || {};
    
    addLog('NETWORK', `fetch request to ${url}`, {
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null
    });
    
    return originalFetch.apply(this, arguments)
      .then(response => {
        addLog('NETWORK', `fetch response from ${url}`, {
          status: response.status,
          statusText: response.statusText,
          headers: Array.from(response.headers.entries())
        });
        return response;
      })
      .catch(error => {
        addLog('NETWORK', `fetch error for ${url}`, {
          error: error.message,
          stack: error.stack
        });
        throw error;
      });
  };
  
  // 7. Monitor XMLHttpRequest
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function() {
    this._requestUrl = arguments[1];
    this._requestMethod = arguments[0];
    return originalXhrOpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function() {
    addLog('NETWORK', `XMLHttpRequest to ${this._requestUrl}`, {
      method: this._requestMethod,
      url: this._requestUrl,
      body: arguments[0] || null
    });
    
    this.addEventListener('load', function() {
      addLog('NETWORK', `XMLHttpRequest response from ${this._requestUrl}`, {
        status: this.status,
        statusText: this.statusText,
        responseType: this.responseType,
        responseSize: this.response ? this.response.length : 0
      });
    });
    
    this.addEventListener('error', function() {
      addLog('NETWORK', `XMLHttpRequest error for ${this._requestUrl}`, {
        status: this.status,
        statusText: this.statusText
      });
    });
    
    return originalXhrSend.apply(this, arguments);
  };
  
  // 8. Monitor React state changes via useGameStore
  setInterval(function() {
    if (window.useGameStore) {
      try {
        const state = window.useGameStore.getState();
        addLog('STORE', 'Current store state', {
          currentStep: state.currentStep,
          gameType: state.gameType,
          config: {
            gameId: state.config?.gameId,
            theme: state.config?.theme,
            selectedGameType: state.config?.selectedGameType
          }
        });
      } catch (e) {
        addLog('ERROR', 'Error accessing store state', {
          error: e.message,
          stack: e.stack
        });
      }
    }
  }, 1000);
  
  // 9. Monitor localStorage changes
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    addLog('STORAGE', `localStorage.setItem('${key}')`, {
      key,
      value: value.length > 500 ? value.substring(0, 500) + '...' : value
    });
    return originalSetItem.apply(this, arguments);
  };
  
  // 10. Export functions to window for console access
  window.MEGA_LOGGER = {
    exportLogs,
    clearLogs,
    getLogsByCategory,
    getLogs: () => logs,
    addLog
  };
  
  // Add a visual indicator that logging is active
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    background-color: rgba(244, 67, 54, 0.9);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 12px;
    z-index: 9999;
    cursor: pointer;
  `;
  indicator.textContent = '🔥 MEGA-LOGGER ACTIVE';
  indicator.title = 'Click to export logs';
  
  // Add click event to export logs
  indicator.addEventListener('click', function() {
    exportLogs();
  });
  
  // Add to page when DOM is ready
  if (document.body) {
    document.body.appendChild(indicator);
  } else {
    window.addEventListener('DOMContentLoaded', function() {
      document.body.appendChild(indicator);
    });
  }
  
  // Initial log
  addLog('SYSTEM', 'MEGA-LOGGER initialized', {
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });
  
  console.log('🔥 MEGA-LOGGER ready, use window.MEGA_LOGGER.exportLogs() to download logs');
})();