import React, { useState, useEffect } from 'react';

// Simple wrapper function for logging
const logToStorage = (message: string, data: any = null) => {
  try {
    // Get existing logs from localStorage
    const existingLogsStr = localStorage.getItem('debug_nav_logs') || '[]';
    const existingLogs = JSON.parse(existingLogsStr);
    
    // Create new log entry
    const logEntry = {
      timestamp: Date.now(),
      message: message,
      data: data ? JSON.stringify(data) : null,
      step: getCurrentStep()
    };
    
    // Add to logs (at beginning) and trim if more than 100
    existingLogs.unshift(logEntry);
    if (existingLogs.length > 100) {
      existingLogs.length = 100;
    }
    
    // Save logs back to localStorage
    localStorage.setItem('debug_nav_logs', JSON.stringify(existingLogs));
    
    // Also log to console
    console.log(`🧭 [DirectLog] ${message}`, data || '');
  } catch (e) {
    console.error('Failed to log to storage:', e);
  }
};

// Get current step from URL
const getCurrentStep = (): number | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    return stepParam ? parseInt(stepParam, 10) : null;
  } catch (e) {
    return null;
  }
};

// Get logs from storage
const getLogsFromStorage = () => {
  try {
    const logsStr = localStorage.getItem('debug_nav_logs') || '[]';
    return JSON.parse(logsStr);
  } catch (e) {
    console.error('Failed to get logs from storage:', e);
    return [];
  }
};

// Add to window for console access
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.directLog = logToStorage;
  // @ts-ignore
  window.clearDirectLogs = () => localStorage.removeItem('debug_nav_logs');
  // @ts-ignore
  window.getDirectLogs = getLogsFromStorage;
}

/**
 * A very simple, direct debug logger component that will show
 * in any environment with minimal dependencies
 */
const DirectDebugLogger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logCounter, setLogCounter] = useState(0);
  
  // Initialize with a log
  useEffect(() => {
    logToStorage("DirectDebugLogger mounted", { 
      time: new Date().toISOString(),
      url: window.location.href
    });
    loadLogs();
    
    // Set up timer to refresh logs periodically
    const interval = setInterval(() => {
      const newLogs = getLogsFromStorage();
      if (newLogs.length !== logCounter) {
        setLogs(newLogs);
        setLogCounter(newLogs.length);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const loadLogs = () => {
    const logs = getLogsFromStorage();
    setLogs(logs);
    setLogCounter(logs.length);
  };
  
  const handleClearLogs = () => {
    localStorage.removeItem('debug_nav_logs');
    setLogs([]);
    setLogCounter(0);
  };
  
  // Simple toggle visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  return (
    <div style={{
      position: 'fixed',
      zIndex: 9999,
      bottom: '20px',
      left: '20px'
    }}>
      {/* Toggle button */}
      <button 
        onClick={toggleVisibility}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#3B82F6',
          color: 'white',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isVisible ? 'X' : '🪵'}
      </button>
      
      {/* Logs panel */}
      {isVisible && (
        <div style={{
          position: 'absolute',
          bottom: '50px',
          left: '0',
          width: '350px',
          maxHeight: '400px',
          backgroundColor: 'rgba(0,0,0,0.85)',
          color: 'white',
          borderRadius: '8px',
          overflow: 'auto',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          border: '1px solid #4B5563'
        }}>
          {/* Header */}
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid #4B5563',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{margin: 0, fontSize: '14px'}}>
              Navigation Logs ({logs.length})
            </h3>
            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                onClick={loadLogs}
                style={{
                  backgroundColor: 'transparent',
                  color: '#9CA3AF',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Refresh
              </button>
              <button 
                onClick={handleClearLogs}
                style={{
                  backgroundColor: 'transparent',
                  color: '#9CA3AF',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Clear
              </button>
            </div>
          </div>
          
          {/* Log entries */}
          <div style={{padding: '8px', maxHeight: '350px', overflow: 'auto'}}>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} style={{
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: index < logs.length - 1 ? '1px solid #374151' : 'none',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#9CA3AF',
                    fontSize: '10px',
                    marginBottom: '4px'
                  }}>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span>Step: {log.step !== null ? log.step : 'N/A'}</span>
                  </div>
                  <div style={{color: '#10B981', marginBottom: '4px'}}>
                    {log.message}
                  </div>
                  {log.data && (
                    <div style={{
                      backgroundColor: '#111827',
                      padding: '4px',
                      borderRadius: '4px',
                      color: '#D1D5DB',
                      fontSize: '10px',
                      wordBreak: 'break-word'
                    }}>
                      {log.data}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{color: '#9CA3AF', fontStyle: 'italic', padding: '10px'}}>
                No logs available.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Export the direct log function for use elsewhere
export { logToStorage as directLog };

export default DirectDebugLogger;