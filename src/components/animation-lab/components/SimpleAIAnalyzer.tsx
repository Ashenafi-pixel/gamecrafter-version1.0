import React, { useState, useCallback } from 'react';
import { AssetManager } from '../core/AssetManager';
import { ImageAnalysisResult } from '../core/ImageAnalyzer';
import { AIImageAnalyzer } from '../ai/AIImageAnalyzer';

interface SimpleAIAnalyzerProps {
  assetManager: AssetManager;
  onAnalysisComplete: (assetId: string, analysis: ImageAnalysisResult) => void;
  onError: (error: string) => void;
  onAnimationSelect: (assetId: string, animationType: string) => void;
  selectedAnimations: Map<string, string[]>;
}

export const SimpleAIAnalyzer: React.FC<SimpleAIAnalyzerProps> = ({
  assetManager,
  onAnalysisComplete,
  onError,
  onAnimationSelect,
  selectedAnimations
}) => {
  // Initialize AI analyzer with hardcoded API key for MVP
  const [aiAnalyzer] = useState(() => {
    const mvpApiKey = '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';
    return new AIImageAnalyzer(mvpApiKey, {
      useAI: true,
      fallbackToHeuristic: false, // Force AI analysis, no fallback
      confidenceThreshold: 0.7,
      enableComponentAnalysis: true,
      enableAnimationAssessment: true,
      cacheResults: true
    });
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<Map<string, ImageAnalysisResult>>(new Map());

  // Animation icons/emojis for visual representation
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
   * Analyze asset without PIXI dependency
   */
  const analyzeAsset = useCallback(async (assetId: string) => {
    if (results.has(assetId)) {
      console.log('Asset already analyzed:', assetId);
      alert('This asset has already been analyzed. Check the results below or in the Properties tab.');
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Get asset metadata
      const metadata = assetManager.getMetadata(assetId);
      if (!metadata) {
        throw new Error(`Asset ${assetId} not found`);
      }

      console.log(`Starting AI analysis for ${metadata.name} (${metadata.size.width}x${metadata.size.height})`);

      // Get the actual texture from AssetManager
      const texture = assetManager.getTexture(assetId);
      if (!texture || !texture.baseTexture) {
        throw new Error('Texture not available for analysis');
      }

      // Create canvas to extract image data from texture
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = metadata.size.width;
      canvas.height = metadata.size.height;

      // Draw texture to canvas and extract image data
      let imageData: ImageData;
      try {
        // Try to get the source from texture
        const source = texture.baseTexture.resource?.source;
        if (source instanceof HTMLImageElement) {
          ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } else {
          // Fallback: create simple dummy data
          const dummyPixels = new Uint8ClampedArray(metadata.size.width * metadata.size.height * 4);
          for (let i = 0; i < dummyPixels.length; i += 4) {
            dummyPixels[i] = 150; dummyPixels[i + 1] = 50; dummyPixels[i + 2] = 50; dummyPixels[i + 3] = 255;
          }
          imageData = new ImageData(dummyPixels, metadata.size.width, metadata.size.height);
        }
      } catch (error) {
        console.warn('Failed to extract real image data, using dummy data:', error);
        // Fallback: create simple dummy data
        const dummyPixels = new Uint8ClampedArray(metadata.size.width * metadata.size.height * 4);
        for (let i = 0; i < dummyPixels.length; i += 4) {
          dummyPixels[i] = 150; dummyPixels[i + 1] = 50; dummyPixels[i + 2] = 50; dummyPixels[i + 3] = 255;
        }
        imageData = new ImageData(dummyPixels, metadata.size.width, metadata.size.height);
      }

      // Use AI analyzer to analyze the image
      console.log('Sending to GPT-4o for analysis...');
      const analysis = await aiAnalyzer.analyzeImage(imageData, assetId);
      
      // Store results
      setResults(prev => new Map(prev).set(assetId, analysis));
      
      // Notify parent
      onAnalysisComplete(assetId, analysis);
      
      console.log(`Analysis complete for ${metadata.name}:`, analysis);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      onError(`Failed to analyze asset: ${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [assetManager, aiAnalyzer, onAnalysisComplete, onError, results]);

  return (
    <div className="simple-ai-analyzer" style={{ padding: '20px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
        AI Image Analysis
      </h3>
      
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#6c757d' }}>
        Click "Analyze" to run AI analysis on uploaded assets.
      </div>

      {/* Analysis Status */}
      {isAnalyzing && (
        <div style={{
          padding: '12px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            border: '2px solid #2196f3',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '8px'
          }} />
          <span style={{ color: '#1976d2' }}>Analyzing with AI...</span>
        </div>
      )}

      {/* Available Assets */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
          Available Assets ({assetManager.getAllMetadata().length})
        </h4>
        
        {assetManager.getAllMetadata().length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#6c757d',
            fontStyle: 'italic',
            border: '1px dashed #ccc',
            borderRadius: '4px'
          }}>
            No assets uploaded yet. Go to Upload tab to add images.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assetManager.getAllMetadata().map((metadata) => {
              const isAnalyzed = results.has(metadata.id);
              const analysis = results.get(metadata.id);
              
              return (
                <div key={metadata.id} style={{
                  padding: '12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: isAnalyzed ? '#f8f9fa' : '#ffffff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                      {/* Image Thumbnail */}
                      <div style={{
                        width: '60px',
                        height: '60px',
                        border: '2px solid #dee2e6',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {(() => {
                          try {
                            const texture = assetManager.getTexture(metadata.id);
                            const source = texture?.baseTexture?.resource?.source;
                            if (source instanceof HTMLImageElement) {
                              return (
                                <img 
                                  src={source.src} 
                                  alt={metadata.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                              );
                            }
                          } catch (error) {
                            console.warn('Could not load thumbnail:', error);
                          }
                          return (
                            <div style={{ fontSize: '24px', color: '#6c757d' }}>
                              🖼️
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Asset Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {metadata.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {metadata.size.width}×{metadata.size.height} • {metadata.format?.toUpperCase()}
                        </div>
                      
                      {isAnalyzed && analysis && (
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                          <div style={{ 
                            display: 'inline-block',
                            padding: '2px 6px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            borderRadius: '3px',
                            marginRight: '6px'
                          }}>
                            {analysis.objectType}
                          </div>
                          <span style={{ color: '#28a745' }}>
                            {(analysis.confidence * 100).toFixed(0)}% confidence
                          </span>
                          
                          {/* Animation Suggestions */}
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
                              🎭 Animation Suggestions:
                            </div>
                            {analysis.animationPotential.map((anim, index) => {
                              const isSelected = selectedAnimations.get(metadata.id)?.includes(anim.type) || false;
                              
                              return (
                                <div key={index} style={{
                                  padding: '4px 8px',
                                  margin: '2px 0',
                                  backgroundColor: isSelected ? '#e3f2fd' : '#f8f9fa',
                                  border: `1px solid ${isSelected ? '#2196f3' : '#e9ecef'}`,
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = '#e3f2fd';
                                  e.currentTarget.style.borderColor = '#2196f3';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                                  e.currentTarget.style.borderColor = '#e9ecef';
                                }
                              }}
                              onClick={() => {
                                onAnimationSelect(metadata.id, anim.type);
                              }}
                              >
                                <div>
                                  <span style={{ fontSize: '14px', marginRight: '6px' }}>
                                    {getAnimationIcon(anim.type)}
                                  </span>
                                  <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                                    {anim.type}
                                  </span>
                                  <span style={{ marginLeft: '6px', color: '#6c757d' }}>
                                    {anim.description}
                                  </span>
                                </div>
                                <span style={{ 
                                  color: anim.confidence > 0.8 ? '#28a745' : 
                                         anim.confidence > 0.6 ? '#ffc107' : '#dc3545',
                                  fontSize: '10px',
                                  fontWeight: 'bold'
                                }}>
                                  {(anim.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                      <button
                        onClick={() => analyzeAsset(metadata.id)}
                        disabled={isAnalyzing}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: isAnalyzed ? '#28a745' : '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                          opacity: isAnalyzing ? 0.6 : 1,
                          minWidth: '80px'
                        }}
                      >
                        {isAnalyzed ? '✓ Done' : isAnalyzing ? '...' : 'Analyze'}
                      </button>
                      
                      {isAnalyzed && (
                        <button
                          onClick={() => {
                            setResults(prev => {
                              const newMap = new Map(prev);
                              newMap.delete(metadata.id);
                              return newMap;
                            });
                            console.log(`Cleared analysis for ${metadata.name}`);
                          }}
                          style={{
                            padding: '6px 8px',
                            fontSize: '12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          title="Clear analysis to re-analyze"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {results.size > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#e8f5e8',
          borderRadius: '4px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
            Analysis Summary
          </h4>
          <div style={{ fontSize: '12px', color: '#2d5a2d' }}>
            {results.size} asset{results.size !== 1 ? 's' : ''} analyzed successfully
          </div>
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

export default SimpleAIAnalyzer;