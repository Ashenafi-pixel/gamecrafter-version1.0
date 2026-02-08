import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { pixiResourceManager } from '../../utils/pixiResourceManager';

interface PixiContainerProps {
  width: number;
  height: number;
  backgroundColor?: number;
  transparent?: boolean;
  componentId: string; // Unique identifier for resource tracking
  onAppReady?: (app: PIXI.Application) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * PixiContainer - A reusable React component for PIXI.js applications with built-in resource management
 * 
 * This component handles the PIXI.js application lifecycle and ensures proper cleanup of resources.
 * It uses the pixiResourceManager to track and clean up resources when the component unmounts.
 */
const PixiContainer: React.FC<PixiContainerProps> = ({
  width,
  height,
  backgroundColor = 0x000000,
  transparent = false,
  componentId,
  onAppReady,
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [appInitialized, setAppInitialized] = useState(false);
  
  // Set up PIXI application
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create PIXI application
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      transparent,
    });
    
    // Register the application with the resource manager
    pixiResourceManager.registerApplication(componentId, app);
    
    // Add the canvas to the DOM
    containerRef.current.appendChild(app.view as unknown as Node);
    
    // Make canvas responsive by setting its styles
    const canvasElement = app.view as HTMLCanvasElement;
    canvasElement.style.width = '100%';
    canvasElement.style.height = '100%';
    
    // Notify parent that app is ready
    if (onAppReady) {
      onAppReady(app);
    }
    
    setAppInitialized(true);
    
    // Cleanup on unmount
    return () => {
      // Use the resource manager to clean up everything related to this component
      pixiResourceManager.cleanupComponent(componentId);
      
      // Clear the container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [componentId, width, height, backgroundColor, transparent, onAppReady]);
  
  return (
    <div 
      ref={containerRef} 
      className={`pixi-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
      data-component-id={componentId}
    />
  );
};

export default PixiContainer;