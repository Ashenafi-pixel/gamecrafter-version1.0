/**
 * LoadLimiter Component
 * 
 * This component helps prevent memory issues by:
 * 1. Deferring heavy component rendering
 * 2. Limiting the number of components loaded at once
 * 3. Implementing aggressive cleanup on unmount
 */

import React, { useState, useEffect } from 'react';

interface LoadLimiterProps {
  children: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  delayMs?: number;
  placeholder?: React.ReactNode;
  id?: string;
}

const LoadLimiter: React.FC<LoadLimiterProps> = ({
  children,
  priority = 'medium',
  delayMs = 0,
  placeholder,
  id = 'component'
}) => {
  // Track if component is loaded
  const [isLoaded, setIsLoaded] = useState(priority === 'high');
  
  // Get delay based on priority
  const getDelay = () => {
    switch(priority) {
      case 'high': return delayMs;
      case 'medium': return delayMs + 100;
      case 'low': return delayMs + 300;
      default: return delayMs;
    }
  };
  
  // Set up staggered loading
  useEffect(() => {
    // Skip for high priority components that load immediately
    if (priority === 'high' && delayMs === 0) return;
    
    const delay = getDelay();
    const timeoutId = setTimeout(() => {
      console.log(`🦺 LoadLimiter: Loading ${id} (${priority} priority)`);
      setIsLoaded(true);
    }, delay);
    
    // Report to memory tracker if needed
    if (window.MEMORY_TRACKER) {
      window.MEMORY_TRACKER.registerComponent(id);
    }
    
    // Clean up on unmount
    return () => {
      clearTimeout(timeoutId);
      console.log(`🦺 LoadLimiter: Unloading ${id}`);
      
      // Report component unload
      if (window.MEMORY_TRACKER) {
        window.MEMORY_TRACKER.unregisterComponent(id);
      }
      
      // Force garbage collection for heavy components
      if (priority === 'low') {
        // Schedule GC recommendation after component unmount
        setTimeout(() => {
          if (window.gc) {
            console.log(`🦺 LoadLimiter: Suggesting GC after unloading ${id}`);
            window.gc();
          }
        }, 500);
      }
    };
  }, []);
  
  // If not loaded yet, show placeholder
  if (!isLoaded) {
    if (placeholder) {
      return <>{placeholder}</>;
    }
    
    // Default placeholder based on priority
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4 w-full">
          <div className={`rounded-md bg-slate-200 h-${
            priority === 'high' ? 16 : 
            priority === 'medium' ? 24 : 32
          } w-full`}></div>
        </div>
      </div>
    );
  }
  
  // Component is ready to render
  return <>{children}</>;
};

export default LoadLimiter;