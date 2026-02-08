import React from 'react';
import ReactDOM from 'react-dom/client';
import GameFrameDesignerWithSwiper from './components/visual-journey/game-frame/GameFrameDesignerWithSwiper';
import './index.css';

// Standalone test app for the GameFrameDesignerWithSwiper component
function SwiperTest() {
  // Override console methods to display in the UI
  const [logs, setLogs] = React.useState<{type: 'log' | 'error', message: string}[]>([]);
  
  React.useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = function() {
      originalConsoleLog.apply(console, arguments);
      const args = Array.from(arguments).map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs(prev => [...prev, {type: 'log', message: args}]);
    };
    
    console.error = function() {
      originalConsoleError.apply(console, arguments);
      const args = Array.from(arguments).map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs(prev => [...prev, {type: 'error', message: args}]);
    };
    
    // Log successful rendering
    console.log('SwiperTest component mounted');
    
    // Restore original console methods on unmount
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">GameFrameDesigner with Swiper</h1>
          </div>
          
          <div>
            <GameFrameDesignerWithSwiper />
          </div>
        </div>
        
        <div className="bg-gray-900 text-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">Console Output</h2>
          <div className="font-mono text-sm h-64 overflow-auto">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`mb-1 ${log.type === 'error' ? 'text-red-400' : 'text-gray-300'}`}
              >
                [{log.type.toUpperCase()}] {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <SwiperTest />
    </React.StrictMode>
  );
}

export default SwiperTest;