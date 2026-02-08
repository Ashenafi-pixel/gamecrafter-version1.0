import React, { useState, useEffect, ReactNode } from 'react';
import { useGameStore } from '../../../store';
import { Monitor, Smartphone, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import SlotMachineIntegration from '../slot-animation/SlotMachineIntegration';
import { useStoredSymbols } from '../../../utils/symbolStorage';

interface SymbolPreviewWrapperProps {
  children?: ReactNode;
}

/**
 * SymbolPreviewWrapper
 * ==================
 * 
 * A professional component for rendering slot game symbols inside device mockups.
 * Based on GridPreviewWrapper but customized for symbol previews.
 */
const SymbolPreviewWrapper: React.FC<SymbolPreviewWrapperProps> = ({ children }) => {
  // State management
  const [currentDevice, setCurrentDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [currentOrientation, setCurrentOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [overrideSymbols, setOverrideSymbols] = useState<string[]>([]);
  const { config } = useGameStore();
  const symbolStore = useStoredSymbols();
  
  // Listen for symbol changes from Step4
  useEffect(() => {
    const handleSymbolsChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log('SymbolPreviewWrapper received symbols:', detail);
      
      if (detail?.symbols && Array.isArray(detail.symbols)) {
        // Set override symbols from the event
        setOverrideSymbols(detail.symbols);
        console.log('SymbolPreviewWrapper updated with new symbols:', detail.symbols.length, detail.symbols);
      }
    };
    
    // Listen for requestSymbols events
    const handleRequestSymbols = () => {
      // If we have symbols in the store, send them to the component
      const symbolsToUse = getSymbolImages();
      if (symbolsToUse.length > 0) {
        console.log('Responding to requestSymbols with:', symbolsToUse.length);
        // Wrap in setTimeout to avoid potential race conditions
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('symbolsChanged', {
            detail: { symbols: symbolsToUse }
          }));
        }, 50);
      }
    };
    
    // Add event listeners with capture to ensure they fire
    window.addEventListener('symbolsChanged', handleSymbolsChanged, true);
    window.addEventListener('requestSymbols', handleRequestSymbols, true);
    
    // Force immediate request for symbols
    window.dispatchEvent(new CustomEvent('requestSymbols', {}));
    
    // Schedule several requests for symbols at different intervals
    // This helps ensure we capture symbols even if they're loaded asynchronously
    const intervals = [100, 500, 1000, 2000, 5000]; // millis
    
    const timeouts = intervals.map(interval => 
      setTimeout(() => {
        console.log(`[${interval}ms] SymbolPreviewWrapper requesting symbols`);
        window.dispatchEvent(new CustomEvent('requestSymbols', {}));
      }, interval)
    );
    
    // Also force-send any symbols we have
    setTimeout(() => {
      const symbols = getSymbolImages();
      if (symbols.length > 0) {
        console.log('SymbolPreviewWrapper proactively sending initial symbols:', symbols.length);
        window.dispatchEvent(new CustomEvent('symbolsChanged', {
          detail: { symbols: symbols }
        }));
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('symbolsChanged', handleSymbolsChanged, true);
      window.removeEventListener('requestSymbols', handleRequestSymbols, true);
      timeouts.forEach(t => clearTimeout(t));
    };
  }, []);
  
  // Get reels and rows from config
  const reels = config.reels?.layout?.reels || 5;
  const rows = config.reels?.layout?.rows || 3;
  
  // Device dimensions (sizes that match the GridPreviewWrapper component)
  const pcStyles = {
    width: '100%',
    height: '100%',
    minHeight: '400px',
    maxHeight: 'calc(100vh - 300px)',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const
  };
  
  const phoneStyles = {
    width: currentOrientation === 'landscape' ? '600px' : '320px',
    height: currentOrientation === 'landscape' ? '300px' : '580px',
    backgroundColor: '#000',
    borderRadius: '36px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 25px 35px -12px rgba(0, 0, 0, 0.15)',
    position: 'relative' as const,
    maxWidth: '90vw',
    maxHeight: 'calc(100vh - 240px)'
  };
  
  // Function to toggle device type
  const toggleDevice = () => {
    setCurrentDevice(currentDevice === 'desktop' ? 'mobile' : 'desktop');
  };
  
  // Function to toggle orientation (mobile only)
  const toggleOrientation = () => {
    if (currentDevice === 'mobile') {
      setCurrentOrientation(currentOrientation === 'landscape' ? 'portrait' : 'landscape');
    }
  };
  
  // Get symbol images from store or use placeholders with improved type detection
  const getSymbolImages = (): string[] => {
    console.log('SymbolPreviewWrapper.getSymbolImages called');
    
    // Helper function to ensure we have all required symbol types
    const ensureAllSymbolTypes = (symbols: string[]): string[] => {
      // Check for required symbol types
      const hasWild = symbols.some(s => s.includes('wild'));
      const hasScatter = symbols.some(s => s.includes('scatter'));
      const hasMedium = symbols.some(s => 
        s.includes('medium') || 
        s.includes('mid_') || 
        s.includes('mid/') || 
        s.toLowerCase().includes('medium')
      );
      
      // Make a copy to avoid modifying original
      const result = [...symbols];
      
      // If missing wild, add placeholder
      if (!hasWild && symbols.length > 0) {
        console.log('Adding missing WILD symbol');
        result.unshift('/assets/symbols/wild.png');
      }
      
      // If missing scatter, add placeholder
      if (!hasScatter && symbols.length > 0) {
        console.log('Adding missing SCATTER symbol');
        result.unshift('/assets/symbols/scatter.png');
      }
      
      // If missing medium, add placeholder
      if (!hasMedium && symbols.length > 0) {
        console.log('Adding missing MEDIUM symbol');
        result.push('/assets/symbols/mid_1.png');
        result.push('/assets/symbols/mid_2.png');
      }
      
      return result;
    };
    
    // First try to use overrideSymbols from symbolsChanged event
    if (overrideSymbols && overrideSymbols.length > 0) {
      console.log('Using overrideSymbols:', overrideSymbols.length);
      return ensureAllSymbolTypes(overrideSymbols);
    }
    
    // Then try to get from symbolStore
    if (symbolStore.symbols && symbolStore.symbols.length > 0) {
      console.log('Using symbolStore.symbols:', symbolStore.symbols.length);
      const images = symbolStore.symbols.map(s => s.image);
      console.log('Mapped images from symbolStore:', images.length);
      return ensureAllSymbolTypes(images);
    }
    
    // Helper function to get symbol URLs from both array and object formats
    const getSymbolUrls = (symbols: string[] | Record<string, string> | undefined): string[] => {
      if (!symbols) return [];
      if (Array.isArray(symbols)) return symbols;
      return Object.values(symbols);
    };

    // Then try to get from config
    const symbolUrls = getSymbolUrls(config?.theme?.generated?.symbols);
    if (symbolUrls.length > 0) {
      console.log('Using config.theme.generated.symbols:', symbolUrls.length);
      return ensureAllSymbolTypes(symbolUrls);
    }
    
    // Fallback to placeholders - complete set
    console.log('Using fallback placeholder symbols');
    return [
      '/assets/symbols/wild.png',
      '/assets/symbols/scatter.png',
      '/assets/symbols/high_1.png',
      '/assets/symbols/high_2.png',
      '/assets/symbols/high_3.png',
      '/assets/symbols/mid_1.png',
      '/assets/symbols/mid_2.png',
      '/assets/symbols/low_1.png',
      '/assets/symbols/low_2.png',
      '/assets/symbols/low_3.png'
    ];
  };

  // If children are provided, use them instead of the default SlotMachineIntegration
  const renderContent = () => {
    if (children) {
      return children;
    }
    
    // Get symbols and log them
    const symbols = getSymbolImages();
    console.log('SymbolPreviewWrapper.renderContent using symbols:', symbols);
    
    // Ensure they have correct paths
    const fixedSymbols = symbols.map(s => {
      // Remove leading /public if it exists
      let path = s;
      if (path.startsWith('/public/')) {
        path = path.replace('/public/', '/');
      }
      
      // Add leading slash if missing
      if (!path.startsWith('/') && !path.startsWith('http')) {
        path = '/' + path;
      }
      
      return path;
    });
    
    console.log('SymbolPreviewWrapper.renderContent fixed symbols:', fixedSymbols);
    
    return (
      <SlotMachineIntegration
        symbols={fixedSymbols}
        isEmbedded={true}
        rows={rows}
        cols={reels}
        onSpinStart={() => {}}
        onSpinComplete={() => {}}
        spinEnabled={fixedSymbols.length >= 9}
      />
    );
  };
  
  // DESKTOP MOCKUP
  if (currentDevice === 'desktop') {
    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-800 flex items-center">
            <Monitor size={16} className="mr-1.5 text-indigo-600" />
            Premium Slot Preview
          </h3>
          
          <div className="flex space-x-2">
            <button
              onClick={toggleDevice}
              className="p-1.5 rounded text-gray-700 hover:bg-gray-200 flex items-center justify-center"
              aria-label="Switch to mobile view"
            >
              <Smartphone size={16} />
            </button>
          </div>
        </div>
        
        {/* PC Mockup */}
        <div className="flex-1 bg-gray-800 flex items-center justify-center p-6">
          <div
            className="pc-mockup flex flex-col relative"
            style={pcStyles}
            aria-label="Desktop preview"
            data-device="desktop"
            data-orientation="landscape"
          >
            {/* Browser Top Bar */}
            <div className="bg-gray-800 h-8 flex items-center px-2 border-b border-gray-700">
              <div className="flex space-x-1.5 items-center">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-gray-700 rounded-md h-5 w-full max-w-md mx-auto"></div>
              </div>
            </div>
            
            {/* Browser Content */}
            <div className="flex-1 bg-gray-900 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="max-w-md w-full">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Message if not enough symbols */}
        {getSymbolImages().length < 9 && !children && (
          <div className="bg-amber-50 p-2 text-center text-sm text-amber-700">
            Generate at least 9 symbols for a complete preview
          </div>
        )}
      </div>
    );
  }
  
  // MOBILE PORTRAIT MOCKUP
  if (currentOrientation === 'portrait') {
    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-800 flex items-center">
            <Smartphone size={16} className="mr-1.5 text-indigo-600" />
            Mobile Preview
          </h3>
          
          <div className="flex space-x-2">
            <button
              onClick={toggleOrientation}
              className="p-1.5 rounded text-gray-700 hover:bg-gray-200 flex items-center justify-center"
              aria-label="Switch to landscape view"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={toggleDevice}
              className="p-1.5 rounded text-gray-700 hover:bg-gray-200 flex items-center justify-center"
              aria-label="Switch to desktop view"
            >
              <Monitor size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 bg-gray-800 flex items-center justify-center p-6">
          <div className="flex flex-col items-center">
            <div 
              className="phone-mockup portrait relative bg-black shadow-xl overflow-hidden"
              style={phoneStyles}
              aria-label="Mobile portrait preview"
              data-device="mobile"
              data-orientation="portrait"
            >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-xl z-10"></div>
              
              {/* Content area */}
              <div className="absolute inset-0 mt-7 mb-0 flex items-center justify-center">
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-full" style={{ maxWidth: '90%' }}>
                    {renderContent()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Message if not enough symbols */}
        {getSymbolImages().length < 9 && !children && (
          <div className="bg-amber-50 p-2 text-center text-sm text-amber-700">
            Generate at least 9 symbols for a complete preview
          </div>
        )}
      </div>
    );
  }
  
  // MOBILE LANDSCAPE MOCKUP
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-800 flex items-center">
          <Smartphone size={16} className="mr-1.5 text-indigo-600" />
          Mobile Landscape Preview
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={toggleOrientation}
            className="p-1.5 rounded text-gray-700 hover:bg-gray-200 flex items-center justify-center"
            aria-label="Switch to portrait view"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={toggleDevice}
            className="p-1.5 rounded text-gray-700 hover:bg-gray-200 flex items-center justify-center"
            aria-label="Switch to desktop view"
          >
            <Monitor size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-800 flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <div 
            className="phone-mockup landscape relative bg-black shadow-xl overflow-hidden"
            style={phoneStyles}
            aria-label="Mobile landscape preview"
            data-device="mobile"
            data-orientation="landscape"
          >
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-7 h-1/3 bg-black rounded-b-xl z-10"></div>
            
            {/* Content area */}
            <div className="absolute inset-0 ml-7 mr-0 flex items-center justify-center">
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-full" style={{ maxWidth: '90%' }}>
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Message if not enough symbols */}
      {getSymbolImages().length < 9 && !children && (
        <div className="bg-amber-50 p-2 text-center text-sm text-amber-700">
          Generate at least 9 symbols for a complete preview
        </div>
      )}
    </div>
  );
};

export default SymbolPreviewWrapper;