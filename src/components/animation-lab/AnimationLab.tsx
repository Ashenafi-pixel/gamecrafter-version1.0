import React, { useState, useCallback, useEffect } from 'react';
import { AnimationEngine } from './core/AnimationEngine';
import { AssetManager } from './core/AssetManager';
import { UIController } from './core/UIController';
import { SpriteManager } from './core/SpriteManager';
import { ImageAnalyzer, ImageAnalysisResult } from './core/ImageAnalyzer';
import { ProjectManager } from './core/ProjectManager';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from './core/ErrorHandler';
import { AIImageAnalyzer, AIAnalysisConfig } from './ai/AIImageAnalyzer';
import CanvasWorkspace from './components/CanvasWorkspace';
import SimpleAnimationCanvas from './components/SimpleAnimationCanvas';

/**
 * Main Animation Lab Component
 * Professional animation system for slot game development
 */
export const AnimationLab: React.FC = () => {
  const [animationEngine, setAnimationEngine] = useState<AnimationEngine | null>(null);
  const [assetManager, setAssetManager] = useState<AssetManager | null>(null);
  const [uiController, setUIController] = useState<UIController | null>(null);
  const [spriteManager, setSpriteManager] = useState<SpriteManager | null>(null);
  const [projectManager, setProjectManager] = useState<ProjectManager | null>(null);
  const [errorHandler] = useState(() => ErrorHandler.getInstance());
  const [loadedAssets, setLoadedAssets] = useState<Map<string, any>>(new Map());
  const [analysisResults, setAnalysisResults] = useState<Map<string, ImageAnalysisResult>>(new Map());
  const [errors, setErrors] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [aiAnalyzer, setAIAnalyzer] = useState<AIImageAnalyzer | null>(null);
  const [selectedAnimations, setSelectedAnimations] = useState<Map<string, string[]>>(new Map()); // assetId -> animation types

  // Animation icons for visual representation
  const getAnimationIcon = (animationType: string): string => {
    const icons: { [key: string]: string } = {
      'rotation': '🔄',
      'glow': '✨',
      'pulse': '💓',
      'particle': '🎆',
      'bounce': '⬆️',
      'scale': '🔍',
      'swing': '↩️',
      'morph': '🔄',
      'float': '☁️',
      'default': '🎭'
    };
    return icons[animationType.toLowerCase()] || icons.default;
  };

  /**
   * Handle errors
   */
  const handleError = useCallback((error: string) => {
    setErrors(prev => [...prev, error]);
    console.error('Animation Lab Error:', error);
  }, []);

  /**
   * Initialize Animation Lab systems without PIXI dependency
   */
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        // Initialize AssetManager independently (without PIXI engine)
        const assetMgr = new AssetManager();
        setAssetManager(assetMgr);
        
        // Initialize AI analyzer with hardcoded API key for MVP
        const mvpApiKey = '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';
        const aiImgAnalyzer = new AIImageAnalyzer(mvpApiKey, {
          useAI: true,
          fallbackToHeuristic: true,
          confidenceThreshold: 0.7,
          enableComponentAnalysis: true,
          enableAnimationAssessment: true,
          cacheResults: true
        });
        setAIAnalyzer(aiImgAnalyzer);
        
        setIsInitialized(true);
        console.log('Animation Lab initialized successfully (PIXI-independent mode)');
      } catch (error) {
        console.error('Failed to initialize Animation Lab:', error);
        handleError(`Initialization failed: ${error}`);
      }
    };

    initializeSystems();
  }, [handleError]);

  /**
   * Handle animation system initialization (legacy - for future PIXI integration)
   */
  const handleEngineReady = useCallback((
    engine: AnimationEngine, 
    assetMgr: AssetManager, 
    uiCtrl: UIController
  ) => {
    setAnimationEngine(engine);
    setUIController(uiCtrl);
    
    // Initialize additional systems
    const spriteMgr = new SpriteManager(engine.getStage(), assetMgr);
    setSpriteManager(spriteMgr);
    
    const projMgr = new ProjectManager(assetMgr, spriteMgr);
    setProjectManager(projMgr);
    
    console.log('Animation Lab PIXI systems initialized');
  }, []);

  /**
   * Handle asset loading
   */
  const handleAssetLoaded = useCallback((assetId: string, metadata: any) => {
    if (!animationEngine || !assetManager || !spriteManager) return;

    try {
      // Update loaded assets list
      setLoadedAssets(prev => new Map(prev).set(assetId, metadata));
      console.log(`Asset loaded successfully: ${metadata?.name || assetId}`);
      
      // Auto-preview functionality can be added later if needed
    } catch (error) {
      handleError(`Failed to process asset ${assetId}: ${error}`);
    }
  }, [animationEngine, assetManager, spriteManager]);

  /**
   * Handle analysis completion
   */
  const handleAnalysisComplete = useCallback((assetId: string, analysis: ImageAnalysisResult) => {
    setAnalysisResults(prev => new Map(prev).set(assetId, analysis));
    console.log(`Analysis complete for ${assetId}:`, analysis);
  }, []);

  /**
   * Handle AI configuration changes
   */
  const handleAIConfigChange = useCallback((config: Partial<AIAnalysisConfig>) => {
    console.log('AI config updated:', config);
  }, []);

  /**
   * Handle API key setup
   */
  const handleAPIKeySet = useCallback((apiKey: string) => {
    if (aiAnalyzer) {
      aiAnalyzer.setAPIKey(apiKey);
      console.log('API key configured for AI analysis');
    }
  }, [aiAnalyzer]);

  /**
   * Handle animation selection
   */
  const handleAnimationSelect = useCallback((assetId: string, animationType: string) => {
    setSelectedAnimations(prev => {
      const newMap = new Map(prev);
      const currentSelections = newMap.get(assetId) || [];
      
      if (currentSelections.includes(animationType)) {
        // Remove if already selected
        const filtered = currentSelections.filter(type => type !== animationType);
        if (filtered.length === 0) {
          newMap.delete(assetId);
        } else {
          newMap.set(assetId, filtered);
        }
        console.log(`🎭 Deselected ${animationType} for ${assetId}`);
      } else {
        // Add to selection
        newMap.set(assetId, [...currentSelections, animationType]);
        console.log(`🎭 Selected ${animationType} for ${assetId}`);
      }
      
      return newMap;
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  /**
   * Clear all assets
   */
  const clearAllAssets = useCallback(() => {
    if (!assetManager || !spriteManager) return;

    try {
      // Clear sprite manager (handles stage cleanup)
      spriteManager.clearAll();
      
      // Clear asset manager
      assetManager.clearAll();
      
      // Clear state
      setLoadedAssets(new Map());
      setAnalysisResults(new Map());
      
      console.log('All assets cleared');
    } catch (error) {
      handleError(`Failed to clear assets: ${error}`);
    }
  }, [assetManager, spriteManager, handleError]);

  /**
   * Get memory statistics
   */
  const getMemoryStats = useCallback(() => {
    if (!assetManager) return null;
    return assetManager.getMemoryStats();
  }, [assetManager]);

  return (
    <div className="animation-lab" style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header */}
      <div className="lab-header" style={{
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            Animation Lab
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
            Professional Animation System for Slot Games
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {isInitialized && (
            <>
              <button
                onClick={clearAllAssets}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Clear All
              </button>
              
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#495057'
              }}>
                Assets: {loadedAssets.size} | 
                Memory: {getMemoryStats()?.estimatedMemoryMB.toFixed(1) || '0'}MB
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="lab-content" style={{
        flex: 1,
        display: 'flex',
        padding: '24px',
        overflow: 'hidden'
      }}>
        {/* Full width canvas workspace */}
        <div className="lab-workspace" style={{
          flex: 1,
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>

          {assetManager && isInitialized ? (
            <SimpleAnimationCanvas
              assetManager={assetManager}
              selectedAnimations={selectedAnimations}
              analysisResults={analysisResults}
              onError={handleError}
            />
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6c757d'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <div>Initializing Animation Canvas...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error notification */}
      {errors.length > 0 && (
        <div className="error-notifications" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          maxWidth: '400px'
        }}>
          {errors.slice(-3).map((error, index) => (
            <div key={index} style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '4px',
              border: '1px solid #f5c6cb',
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{error}</span>
              <button
                onClick={clearErrors}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#721c24',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: '12px'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimationLab;