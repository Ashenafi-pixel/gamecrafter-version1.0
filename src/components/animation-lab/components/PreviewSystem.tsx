import React, { useState, useCallback, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { AnimationEngine } from '../core/AnimationEngine';
import { AssetManager } from '../core/AssetManager';
import { SpriteManager } from '../core/SpriteManager';
import { ImageAnalyzer, ImageAnalysisResult } from '../core/ImageAnalyzer';

interface PreviewSystemProps {
  animationEngine: AnimationEngine;
  assetManager: AssetManager;
  spriteManager: SpriteManager;
  onAnalysisComplete: (assetId: string, analysis: ImageAnalysisResult) => void;
  onError: (error: string) => void;
}

interface PreviewItem {
  assetId: string;
  spriteId: string;
  analysis: ImageAnalysisResult;
  isSelected: boolean;
}

export const PreviewSystem: React.FC<PreviewSystemProps> = ({
  animationEngine,
  assetManager,
  spriteManager,
  onAnalysisComplete,
  onError
}) => {
  const [previewItems, setPreviewItems] = useState<Map<string, PreviewItem>>(new Map());
  const [imageAnalyzer] = useState(() => new ImageAnalyzer());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * Add asset to preview system
   */
  const addAssetToPreview = useCallback(async (assetId: string) => {
    if (previewItems.has(assetId)) return;

    try {
      setIsAnalyzing(true);
      
      // Get asset metadata
      const metadata = assetManager.getMetadata(assetId);
      if (!metadata) {
        throw new Error(`Asset ${assetId} not found`);
      }

      // Create sprite for preview
      const spriteId = `preview_${assetId}_${Date.now()}`;
      const pixiApp = animationEngine.getApp();
      const screen = pixiApp.screen || pixiApp.renderer?.screen || { width: 800, height: 600 };
      const canvasSize = {
        width: screen.width || 800,
        height: screen.height || 600
      };

      // Get texture for analysis
      const texture = assetManager.getTexture(assetId);
      if (!texture) {
        throw new Error(`Texture for asset ${assetId} not found`);
      }

      // Create canvas from texture for analysis
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = texture.width;
      canvas.height = texture.height;
      
      // Extract pixel data for analysis
      let imageData: ImageData;
      const renderer = pixiApp?.renderer;
      
      if (renderer && renderer.extract) {
        try {
          const renderTexture = PIXI.RenderTexture.create({
            width: texture.width,
            height: texture.height
          });
          
          const tempSprite = new PIXI.Sprite(texture);
          renderer.render(tempSprite, { renderTexture });
          
          const pixels = renderer.extract.pixels(renderTexture);
          imageData = new ImageData(
            new Uint8ClampedArray(pixels.buffer),
            texture.width,
            texture.height
          );
          
          // Clean up temporary objects
          tempSprite.destroy();
          renderTexture.destroy();
        } catch (pixelError) {
          console.warn('Failed to extract pixel data, using dummy data:', pixelError);
          // Create dummy image data for analysis
          const dummyPixels = new Uint8ClampedArray(texture.width * texture.height * 4);
          dummyPixels.fill(128); // Fill with gray
          imageData = new ImageData(dummyPixels, texture.width, texture.height);
        }
      } else {
        console.warn('Renderer not available, using dummy image data for analysis');
        // Create dummy image data for analysis
        const dummyPixels = new Uint8ClampedArray(texture.width * texture.height * 4);
        dummyPixels.fill(128); // Fill with gray
        imageData = new ImageData(dummyPixels, texture.width, texture.height);
      }

      // Analyze image
      const analysis = await imageAnalyzer.analyzeImage(imageData, assetId);
      
      // Create preview item (with or without sprite)
      const previewItem: PreviewItem = {
        assetId,
        spriteId,
        analysis,
        isSelected: false
      };

      // Update state
      setPreviewItems(prev => new Map(prev).set(assetId, previewItem));
      
      // Notify parent
      onAnalysisComplete(assetId, analysis);
      
      // Try to create sprite (optional - analysis works without it)
      try {
        spriteManager.createSpriteFromAnalysis(
          spriteId,
          assetId,
          analysis,
          canvasSize
        );
        console.log('Sprite created successfully for', assetId);
      } catch (spriteError) {
        console.warn('Failed to create sprite (analysis still successful):', spriteError);
      }
      
      console.log(`Preview created for asset ${assetId}:`, analysis);
      
    } catch (error) {
      onError(`Failed to create preview for asset ${assetId}: ${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [previewItems, assetManager, animationEngine, spriteManager, imageAnalyzer, onAnalysisComplete, onError]);

  /**
   * Remove asset from preview
   */
  const removeAssetFromPreview = useCallback((assetId: string) => {
    const previewItem = previewItems.get(assetId);
    if (!previewItem) return;

    // Remove sprite
    spriteManager.removeSprite(previewItem.spriteId);
    
    // Update state
    setPreviewItems(prev => {
      const newMap = new Map(prev);
      newMap.delete(assetId);
      return newMap;
    });
  }, [previewItems, spriteManager]);

  /**
   * Select preview item
   */
  const selectPreviewItem = useCallback((assetId: string, selected: boolean = true) => {
    const previewItem = previewItems.get(assetId);
    if (!previewItem) return;

    // Update sprite selection
    if (selected) {
      spriteManager.selectSprite(previewItem.spriteId);
    } else {
      spriteManager.deselectSprite(previewItem.spriteId);
    }

    // Update state
    setPreviewItems(prev => {
      const newMap = new Map(prev);
      const updatedItem = { ...previewItem, isSelected: selected };
      newMap.set(assetId, updatedItem);
      return newMap;
    });
  }, [previewItems, spriteManager]);

  /**
   * Clear all previews
   */
  const clearAllPreviews = useCallback(() => {
    previewItems.forEach((item) => {
      spriteManager.removeSprite(item.spriteId);
    });
    setPreviewItems(new Map());
  }, [previewItems, spriteManager]);

  /**
   * Get preview statistics
   */
  const getPreviewStats = useCallback(() => {
    const items = Array.from(previewItems.values());
    return {
      total: items.length,
      selected: items.filter(item => item.isSelected).length,
      byType: items.reduce((acc, item) => {
        acc[item.analysis.objectType] = (acc[item.analysis.objectType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [previewItems]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearAllPreviews();
      imageAnalyzer.destroy();
    };
  }, [clearAllPreviews, imageAnalyzer]);

  return (
    <div className="preview-system">
      {/* Preview Controls */}
      <div className="preview-controls" style={{
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="preview-stats">
          <span style={{ fontSize: '14px', color: '#6c757d' }}>
            {getPreviewStats().total} items • {getPreviewStats().selected} selected
          </span>
        </div>
        
        <div className="preview-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearAllPreviews}
            disabled={previewItems.size === 0}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: previewItems.size === 0 ? 'not-allowed' : 'pointer',
              opacity: previewItems.size === 0 ? 0.5 : 1
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Analysis Status */}
      {isAnalyzing && (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          backgroundColor: '#e3f2fd',
          borderBottom: '1px solid #bbdefb'
        }}>
          <div style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '2px solid #2196f3',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '12px'
          }} />
          <span style={{ color: '#1976d2' }}>Analyzing images...</span>
        </div>
      )}

      {/* Available Assets for Analysis */}
      {previewItems.size === 0 && (
        <div style={{ padding: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Available Assets</h4>
          <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '12px' }}>
            Select an asset to analyze with AI:
          </div>
          
          {assetManager.getAllMetadata().map((metadata) => (
            <div key={metadata.id} style={{
              padding: '12px',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              marginBottom: '8px',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {metadata.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {metadata.size.width}×{metadata.size.height} • {metadata.format?.toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => addAssetToPreview(metadata.id)}
                disabled={isAnalyzing}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                  opacity: isAnalyzing ? 0.6 : 1
                }}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Items List */}
      <div className="preview-list" style={{
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {Array.from(previewItems.values()).map((item) => (
          <PreviewItemComponent
            key={item.assetId}
            item={item}
            onSelect={selectPreviewItem}
            onRemove={removeAssetFromPreview}
          />
        ))}
      </div>

      {/* Preview Statistics */}
      {previewItems.size > 0 && (
        <div className="preview-summary" style={{
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #dee2e6',
          fontSize: '12px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Object Types:</div>
          {Object.entries(getPreviewStats().byType).map(([type, count]) => (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ textTransform: 'capitalize' }}>{type}:</span>
              <span>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* CSS for loading animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Preview Item Component
const PreviewItemComponent: React.FC<{
  item: PreviewItem;
  onSelect: (assetId: string, selected: boolean) => void;
  onRemove: (assetId: string) => void;
}> = ({ item, onSelect, onRemove }) => {
  const { analysis } = item;

  return (
    <div
      className={`preview-item ${item.isSelected ? 'selected' : ''}`}
      style={{
        padding: '12px',
        borderBottom: '1px solid #e9ecef',
        backgroundColor: item.isSelected ? '#e3f2fd' : 'white',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      }}
      onClick={() => onSelect(item.assetId, !item.isSelected)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Item Info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
            {analysis.metadata.width}×{analysis.metadata.height} • {analysis.objectType}
          </div>
          
          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
            Confidence: {(analysis.confidence * 100).toFixed(0)}%
          </div>
          
          {/* Animation Potential */}
          <div style={{ fontSize: '12px' }}>
            <strong>Animations:</strong>
            <div style={{ marginTop: '4px' }}>
              {analysis.animationPotential.slice(0, 3).map((potential, index) => (
                <span
                  key={index}
                  style={{
                    display: 'inline-block',
                    margin: '2px 4px 2px 0',
                    padding: '2px 6px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '3px',
                    fontSize: '11px',
                    textTransform: 'capitalize'
                  }}
                >
                  {potential.type}
                </span>
              ))}
              {analysis.animationPotential.length > 3 && (
                <span style={{ fontSize: '11px', color: '#6c757d' }}>
                  +{analysis.animationPotential.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div style={{ marginLeft: '12px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.assetId);
            }}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewSystem;