import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnimationEngine } from '../core/AnimationEngine';
import { AssetManager } from '../core/AssetManager';
import { UIController } from '../core/UIController';
import { ImageAnalysisResult } from '../core/ImageAnalyzer';

interface CanvasWorkspaceProps {
  width?: number;
  height?: number;
  onEngineReady: (engine: AnimationEngine, assetManager: AssetManager, uiController: UIController) => void;
  onError: (error: string) => void;
  assetManager: AssetManager;
  analysisResults: Map<string, ImageAnalysisResult>;
  className?: string;
  style?: React.CSSProperties;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  width = 800,
  height = 600,
  onEngineReady,
  onError,
  assetManager,
  analysisResults,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dimensions, setDimensions] = useState({ width, height });
  const engineRef = useRef<AnimationEngine | null>(null);
  const assetManagerRef = useRef<AssetManager | null>(null);
  const uiControllerRef = useRef<UIController | null>(null);

  /**
   * Handle container resize
   */
  const handleResize = useCallback(() => {
    if (!containerRef.current || !engineRef.current) return;
    
    const container = containerRef.current;
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    
    if (newWidth !== dimensions.width || newHeight !== dimensions.height) {
      setDimensions({ width: newWidth, height: newHeight });
      engineRef.current.resize(newWidth, newHeight);
    }
  }, [dimensions]);

  /**
   * Display assets in canvas for preview
   */
  const displayAssets = useCallback(() => {
    if (!engineRef.current || !assetManagerRef.current) return;

    const stage = engineRef.current.getStage();
    
    // Clear existing sprites
    stage.removeChildren();

    // Get all assets and display them
    const allMetadata = assetManager.getAllMetadata();
    
    if (allMetadata.length > 0) {
      // For now, display the first asset in the center
      const firstAsset = allMetadata[0];
      const texture = assetManager.getTexture(firstAsset.id);
      
      if (texture) {
        const sprite = new PIXI.Sprite(texture);
        
        // Scale to fit canvas while maintaining aspect ratio
        const maxSize = Math.min(dimensions.width * 0.6, dimensions.height * 0.6);
        const scale = Math.min(maxSize / texture.width, maxSize / texture.height);
        
        sprite.scale.set(scale);
        sprite.anchor.set(0.5);
        sprite.x = dimensions.width / 2;
        sprite.y = dimensions.height / 2;
        
        stage.addChild(sprite);
        
        console.log(`Displaying asset: ${firstAsset.name} at scale ${scale.toFixed(2)}`);
      }
    }
  }, [assetManager, dimensions]);

  /**
   * Initialize animation system  
   */
  const initializeAnimationSystem = useCallback(async () => {
    if (!canvasRef.current || isInitialized) return;

    try {
      console.log('🎬 Initializing Canvas Workspace...');
      
      // Create core systems
      const animationEngine = new AnimationEngine(canvasRef.current, dimensions.width, dimensions.height);
      // Use the existing assetManager passed as prop, don't create a new one
      
      // Initialize animation engine
      await animationEngine.initialize();
      
      // Create UI controller
      const uiController = new UIController(animationEngine, assetManager);
      uiController.initialize();

      // Store references
      engineRef.current = animationEngine;
      assetManagerRef.current = assetManager;  // Use the existing assetManager from props
      uiControllerRef.current = uiController;

      console.log(`✅ Asset manager has ${assetManager.getAllMetadata().length} assets`);

      // Notify parent component
      onEngineReady(animationEngine, assetManager, uiController);
      
      setIsInitialized(true);
      
      // Display assets after initialization
      setTimeout(() => {
        console.log('🎨 Attempting to display assets...');
        displayAssets();
      }, 100);
    } catch (error) {
      onError(`Failed to initialize animation system: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [dimensions, isInitialized, onEngineReady, onError, assetManager, displayAssets]);

  /**
   * Clean up animation system
   */
  const cleanupAnimationSystem = useCallback(() => {
    if (uiControllerRef.current) {
      uiControllerRef.current.destroy();
      uiControllerRef.current = null;
    }
    
    if (assetManagerRef.current) {
      assetManagerRef.current.clearAll();
      assetManagerRef.current = null;
    }
    
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    
    setIsInitialized(false);
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initializeAnimationSystem();
    
    return () => {
      cleanupAnimationSystem();
    };
  }, [initializeAnimationSystem, cleanupAnimationSystem]);

  /**
   * Handle window resize
   */
  useEffect(() => {
    const resizeObserver = new ResizeObserver(handleResize);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize]);

  /**
   * Display assets when they change or canvas is ready
   */
  useEffect(() => {
    if (isInitialized && assetManager) {
      displayAssets();
    }
  }, [isInitialized, assetManager, analysisResults, displayAssets]);

  /**
   * Handle dimensions change
   */
  useEffect(() => {
    if (engineRef.current && isInitialized) {
      engineRef.current.resize(dimensions.width, dimensions.height);
    }
  }, [dimensions, isInitialized]);

  return (
    <div className="canvas-workspace">
      {/* Main workspace container */}
      <div
        ref={containerRef}
        className={`workspace-container ${className}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          ...style
        }}
      >
        {/* Canvas element */}
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            cursor: 'default'
          }}
        />

        {/* Loading overlay */}
        {!isInitialized && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(248, 249, 250, 0.9)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              zIndex: 10
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e9ecef',
                borderTop: '4px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }}
            />
            <p style={{ margin: 0, color: '#6c757d' }}>Initializing Animation Lab...</p>
          </div>
        )}

        {/* Toolbar overlay (optional) */}
        {isInitialized && (
          <div
            className="workspace-toolbar"
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              gap: '8px',
              zIndex: 20
            }}
          >
            <button
              onClick={() => uiControllerRef.current?.zoomToFit()}
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
              title="Fit to Canvas"
            >
              🔍 Fit
            </button>
            
            <button
              onClick={() => uiControllerRef.current?.resetViewport()}
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
              title="Reset View"
            >
              🏠 Reset
            </button>
          </div>
        )}

        {/* Status overlay */}
        {isInitialized && (
          <div
            className="workspace-status"
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#6c757d',
              zIndex: 20
            }}
          >
            {dimensions.width} × {dimensions.height}
          </div>
        )}
      </div>

      {/* CSS for loading animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .workspace-container:hover .workspace-toolbar {
          opacity: 1;
        }
        
        .workspace-toolbar {
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default CanvasWorkspace;