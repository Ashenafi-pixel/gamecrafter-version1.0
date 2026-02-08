import React, { useState, useEffect } from 'react';
import { logNav, getNavLogs, clearNavLogs, saveLogsToFile } from './navlog';

/**
 * A more simplified, always-visible debug logger component
 * that's guaranteed to appear on the screen
 */
const DebugLogger: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize with a log to ensure it's working
  useEffect(() => {
    logNav("DebugLogger component mounted", { time: new Date().toISOString() });
    loadLogs();
    
    // Refresh logs every second
    const interval = setInterval(loadLogs, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const loadLogs = () => {
    const navLogs = getNavLogs();
    setLogs(navLogs);
  };
  
  const handleClearLogs = () => {
    clearNavLogs();
    loadLogs();
  };
  
  const handleDownloadLogs = () => {
    saveLogsToFile();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '10px'
      }}
    >
      {/* Simple button styled with inline styles for maximum compatibility */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: '#2563EB',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        {isOpen ? 'X' : '🔎'}
      </button>
      
      {/* Log panel */}
      {isOpen && (
        <div 
          style={{
            backgroundColor: '#1F2937',
            color: 'white',
            borderRadius: '8px',
            width: '350px',
            maxHeight: '400px',
            overflow: 'auto',
            boxShadow: '0 10px 15px rgba(0,0,0,0.2)',
            border: '1px solid #374151',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid #374151',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '14px' }}>
              Navigation Logs ({logs.length})
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
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
                onClick={handleDownloadLogs}
                style={{
                  backgroundColor: 'transparent',
                  color: '#9CA3AF',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Download
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
          <div style={{ padding: '8px 12px', maxHeight: '350px', overflow: 'auto' }}>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  style={{
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: index < logs.length - 1 ? '1px solid #374151' : 'none'
                  }}
                >
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
                  <div style={{ color: '#10B981', marginBottom: '4px' }}>
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
              <div style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                No logs available.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugLogger;