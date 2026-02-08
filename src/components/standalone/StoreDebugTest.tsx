import React from 'react';
import { useGameStore } from '../../store';

/**
 * Simple debug component to test store functionality
 */
const StoreDebugTest: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const [testResults, setTestResults] = React.useState<string[]>([]);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(`[StoreDebugTest] ${message}`);
  };

  const testStoreWrite = () => {
    addLog('Testing store write...');
    
    const testSymbols = {
      wild: 'data:image/png;base64,test-wild',
      scatter: 'data:image/png;base64,test-scatter',
      high1: 'data:image/png;base64,test-high1'
    };

    updateConfig({
      theme: {
        ...config?.theme,
        generated: {
          ...config?.theme?.generated,
          symbols: testSymbols
        }
      }
    });

    addLog(`Wrote symbols to store: ${Object.keys(testSymbols).join(', ')}`);
  };

  const testStoreRead = () => {
    addLog('Testing store read...');
    
    const symbols = config?.theme?.generated?.symbols;
    addLog(`Read symbols from store: ${symbols ? 'Found' : 'Not found'}`);
    addLog(`Symbol type: ${typeof symbols}`);
    addLog(`Is array: ${Array.isArray(symbols)}`);
    
    if (symbols) {
      if (Array.isArray(symbols)) {
        addLog(`Array length: ${symbols.length}`);
        addLog(`Array content: ${symbols.slice(0, 3).join(', ')}`);
      } else {
        addLog(`Object keys: ${Object.keys(symbols).join(', ')}`);
        addLog(`Object values count: ${Object.values(symbols).length}`);
      }
    }
  };

  const clearStore = () => {
    addLog('Clearing store...');
    updateConfig({
      theme: {
        ...config?.theme,
        generated: {
          ...config?.theme?.generated,
          symbols: undefined
        }
      }
    });
    addLog('Store cleared');
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 Store Debug Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Controls</h2>
          
          <div className="space-y-2">
            <button
              onClick={testStoreWrite}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              1. Write Test Symbols to Store
            </button>
            
            <button
              onClick={testStoreRead}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              2. Read Symbols from Store
            </button>
            
            <button
              onClick={clearStore}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              3. Clear Store
            </button>
            
            <button
              onClick={clearLogs}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Logs
            </button>
          </div>

          {/* Current State */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Current State</h3>
            <div className="text-sm space-y-1">
              <div>Config exists: {config ? '✅' : '❌'}</div>
              <div>Theme exists: {config?.theme ? '✅' : '❌'}</div>
              <div>Generated exists: {config?.theme?.generated ? '✅' : '❌'}</div>
              <div>Symbols exist: {config?.theme?.generated?.symbols ? '✅' : '❌'}</div>
              <div>Symbol type: {typeof config?.theme?.generated?.symbols}</div>
              <div>Is array: {Array.isArray(config?.theme?.generated?.symbols) ? '✅' : '❌'}</div>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Test Results</h2>
          <div className="bg-black text-green-400 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <div className="text-gray-500">No tests run yet...</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">{result}</div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Raw Data */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Raw Store Data</h2>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
          {JSON.stringify(config?.theme?.generated?.symbols, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default StoreDebugTest;
