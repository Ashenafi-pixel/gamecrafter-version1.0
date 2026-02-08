/**
 * Persistent Navigation Logger
 * 
 * This module provides logging functionality that persists across page reloads.
 * Logs are stored in localStorage and can be viewed in the browser.
 */

// Set to true to enable logging, false to disable
const ENABLE_LOGGING = true;

// Maximum number of log entries to keep (oldest will be removed first)
const MAX_LOG_ENTRIES = 100;

// localStorage key for storing logs
const STORAGE_KEY = 'slotai_nav_log';

/**
 * Log a navigation event with persistence across page reloads
 * @param {string} message - The message to log
 * @param {any} data - Optional data to include with the log
 */
export const logNav = (message, data = null) => {
  if (!ENABLE_LOGGING) return;
  
  try {
    // Get existing logs or initialize empty array
    const existingLogs = getNavLogs();
    
    // Create new log entry
    const logEntry = {
      timestamp: Date.now(),
      message: message,
      data: data ? JSON.stringify(data) : null,
      url: window.location.href,
      step: getStepFromUrl(),
    };
    
    // Add to logs and trim if necessary
    existingLogs.unshift(logEntry);
    if (existingLogs.length > MAX_LOG_ENTRIES) {
      existingLogs.length = MAX_LOG_ENTRIES;
    }
    
    // Save logs
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingLogs));
    
    // Also log to console
    console.log(`🧭 [NavLog] ${message}`, data || '');
  } catch (e) {
    console.error('Failed to save navigation log:', e);
  }
};

/**
 * Retrieve navigation logs from localStorage
 * @returns {Array} Array of log entries
 */
export const getNavLogs = () => {
  try {
    const savedLogs = localStorage.getItem(STORAGE_KEY);
    return savedLogs ? JSON.parse(savedLogs) : [];
  } catch (e) {
    console.error('Failed to retrieve navigation logs:', e);
    return [];
  }
};

/**
 * Clear all navigation logs from localStorage
 */
export const clearNavLogs = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🧭 [NavLog] Logs cleared');
  } catch (e) {
    console.error('Failed to clear navigation logs:', e);
  }
};

/**
 * Get current step from URL parameters
 * @returns {number|null} Current step or null if not found
 */
export const getStepFromUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    return stepParam ? parseInt(stepParam, 10) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Formats logs into a string for display or saving
 * @returns {string} Formatted log string
 */
export const getFormattedLogs = () => {
  const logs = getNavLogs();
  
  if (logs.length === 0) {
    return "No navigation logs available.";
  }
  
  return logs.map(log => {
    const date = new Date(log.timestamp);
    const timeStr = date.toLocaleTimeString();
    const dateStr = date.toLocaleDateString();
    
    return `[${dateStr} ${timeStr}] [Step: ${log.step !== null ? log.step : 'N/A'}] ${log.message}${log.data ? '\nData: ' + log.data : ''}`;
  }).join('\n\n');
};

/**
 * Save logs to a file that can be downloaded
 */
export const saveLogsToFile = () => {
  try {
    const formattedLogs = getFormattedLogs();
    const blob = new Blob([formattedLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `slotai-nav-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Failed to save logs to file:', e);
  }
};

// Initialize with startup log
if (ENABLE_LOGGING) {
  logNav('Navigation logger initialized', {
    url: window.location.href,
    timestamp: new Date().toISOString(),
  });
}

// Add logger to window object for console access
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.navLog = logNav;
  // @ts-ignore
  window.clearNavLogs = clearNavLogs;
  // @ts-ignore
  window.getNavLogs = getNavLogs;
  // @ts-ignore
  window.downloadNavLogs = saveLogsToFile;
  
  console.log('Navigation logger available in console! Use window.navLog(message, data) to add logs.');
}

export default {
  logNav,
  getNavLogs,
  clearNavLogs,
  getFormattedLogs,
  saveLogsToFile,
};