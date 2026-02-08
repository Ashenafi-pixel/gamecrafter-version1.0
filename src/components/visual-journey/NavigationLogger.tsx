import React, { useState, useEffect } from 'react';
import { getNavLogs, clearNavLogs, saveLogsToFile } from './navlog';
import { X, Download, Trash2, RefreshCw } from 'lucide-react';

/**
 * NavigationLogger Component
 * 
 * A floating panel that displays navigation logs and persists across page reloads.
 * This is useful for debugging navigation issues where console logs would be lost.
 */
const NavigationLogger: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  // Load logs on mount and whenever localStorage changes
  useEffect(() => {
    loadLogs();

    // Listen for storage events to update when logs change from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'slotai_nav_log') {
        loadLogs();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Set up timer to refresh logs periodically
    const refreshTimer = setInterval(loadLogs, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(refreshTimer);
    };
  }, []);

  const loadLogs = () => {
    setLogs(getNavLogs());
  };

  const handleClearLogs = () => {
    clearNavLogs();
    loadLogs();
  };

  const handleDownloadLogs = () => {
    saveLogsToFile();
  };

  // Toggle logger open/closed state
  const toggleLogger = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  // Toggle minimized state
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      {/* Toggle button */}
      <button
        onClick={toggleLogger}
        className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg"
        title="Toggle Navigation Logger"
      >
        {isOpen ? <X size={18} /> : "🧭"}
      </button>

      {/* Logger panel */}
      {isOpen && (
        <div 
          className={`absolute bottom-12 left-0 bg-gray-800 text-white rounded-lg shadow-xl transition-all duration-300 ease-in-out ${
            isMinimized ? 'w-60 h-10' : 'w-96 h-96'
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-2 border-b border-gray-700">
            <h3 className="text-sm font-medium">Navigation Log {logs.length > 0 && `(${logs.length})`}</h3>
            <div className="flex gap-1">
              <button 
                onClick={loadLogs} 
                className="p-1 text-gray-400 hover:text-white"
                title="Refresh Logs"
              >
                <RefreshCw size={14} />
              </button>
              <button 
                onClick={handleDownloadLogs} 
                className="p-1 text-gray-400 hover:text-white"
                title="Download Logs"
              >
                <Download size={14} />
              </button>
              <button 
                onClick={handleClearLogs} 
                className="p-1 text-gray-400 hover:text-white"
                title="Clear Logs"
              >
                <Trash2 size={14} />
              </button>
              <button 
                onClick={toggleMinimize} 
                className="p-1 text-gray-400 hover:text-white"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? "+" : "-"}
              </button>
            </div>
          </div>

          {/* Log content */}
          {!isMinimized && (
            <div className="overflow-auto p-2 h-[calc(100%-36px)] text-xs font-mono">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="mb-3 pb-3 border-b border-gray-700">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{formatTime(log.timestamp)}</span>
                      <span>Step: {log.step !== null ? log.step : 'N/A'}</span>
                    </div>
                    <div className="text-green-400 mt-1 break-words">{log.message}</div>
                    {log.data && (
                      <div className="mt-1 text-gray-300 break-words bg-gray-900 p-1 rounded">
                        {log.data}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-gray-400 italic">No logs yet.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavigationLogger;