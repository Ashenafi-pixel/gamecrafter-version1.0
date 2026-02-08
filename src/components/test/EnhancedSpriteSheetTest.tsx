import React, { useState } from 'react';
import PixiAnimatedSymbol from '../visual-journey/steps-working/pixiSpriteSheet';
import { analyzeSpriteSheet, SPRITE_SHEET_RECOMMENDATIONS } from '../../utils/spriteSheetValidator';

/**
 * Enhanced test component for the improved sprite sheet generator
 * Tests transparency, sizing, and cutting logic
 */
export default function EnhancedSpriteSheetTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [generatedSprites, setGeneratedSprites] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSpriteGenerated = (spriteUrl: string) => {
    setGeneratedSprites(prev => [...prev, spriteUrl]);
    console.log('🎬 New sprite generated:', spriteUrl);
    
    // Automatically analyze the generated sprite
    analyzeGeneratedSprite(spriteUrl);
  };

  const analyzeGeneratedSprite = async (spriteUrl: string) => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeSpriteSheet(spriteUrl);
      setTestResults(analysis);
      console.log('📊 Sprite analysis complete:', analysis);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const testConfigurations = [
    {
      name: 'Golden Treasure Chest',
      config: {
        prompt: 'Golden treasure chest with sparkling gems and magical aura',
        symbolType: 'contour' as const,
        contentType: 'symbol-only' as const,
        animationComplexity: 'medium' as const
      }
    },
    {
      name: 'WILD Symbol',
      config: {
        prompt: 'Mystical wolf with glowing eyes and lightning effects',
        symbolType: 'block' as const,
        contentType: 'symbol-wild' as const,
        animationComplexity: 'complex' as const
      }
    },
    {
      name: 'SCATTER Coins',
      config: {
        prompt: 'Ancient golden coins with mystical runes',
        symbolType: 'contour' as const,
        contentType: 'symbol-scatter' as const,
        animationComplexity: 'simple' as const
      }
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>
        🧪 Enhanced Sprite Sheet Generator Test
      </h1>
      
      {/* Test Configurations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {testConfigurations.map((test, index) => (
          <div key={index} style={{ 
            border: '2px solid #e5e7eb', 
            borderRadius: '12px', 
            padding: '20px',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>{test.name}</h3>
            <PixiAnimatedSymbol
              enableGeneration={true}
              onSpriteGenerated={handleSpriteGenerated}
              width={300}
              height={300}
              animationSpeed={0.12}
            />
          </div>
        ))}
      </div>

      {/* Analysis Results */}
      {(testResults || isAnalyzing) && (
        <div style={{ 
          border: '2px solid #3b82f6', 
          borderRadius: '12px', 
          padding: '24px',
          backgroundColor: '#eff6ff',
          marginBottom: '32px'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#1e40af' }}>
            📊 Sprite Sheet Analysis
          </h2>
          
          {isAnalyzing ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>🔍 Analyzing sprite sheet...</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Checking dimensions, transparency, and frame alignment
              </div>
            </div>
          ) : testResults && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Validation Results */}
              <div>
                <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>Validation Results</h3>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: testResults.analysis.isValid ? '#d1fae5' : '#fee2e2',
                  border: `1px solid ${testResults.analysis.isValid ? '#10b981' : '#ef4444'}`,
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    {testResults.analysis.isValid ? '✅ Valid Sprite Sheet' : '❌ Issues Found'}
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    <strong>Dimensions:</strong> {testResults.analysis.dimensions.width}x{testResults.analysis.dimensions.height}<br/>
                    <strong>Frame Size:</strong> {testResults.analysis.dimensions.frameWidth}x{testResults.analysis.dimensions.frameHeight}<br/>
                    <strong>Grid:</strong> {testResults.analysis.gridInfo.cols}x{testResults.analysis.gridInfo.rows} ({testResults.analysis.gridInfo.totalFrames} frames)<br/>
                    <strong>Transparency:</strong> {testResults.debugInfo.hasTransparency ? '✅ Yes' : '❌ No'}<br/>
                    <strong>Format:</strong> {testResults.debugInfo.imageFormat}<br/>
                    <strong>Load Time:</strong> {testResults.debugInfo.loadTime}ms
                  </div>
                </div>

                {/* Issues */}
                {testResults.analysis.issues.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ color: '#dc2626', marginBottom: '8px' }}>Issues:</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                      {testResults.analysis.issues.map((issue: string, i: number) => (
                        <li key={i} style={{ marginBottom: '4px', color: '#dc2626' }}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {testResults.analysis.recommendations.length > 0 && (
                  <div>
                    <h4 style={{ color: '#d97706', marginBottom: '8px' }}>Recommendations:</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                      {testResults.analysis.recommendations.map((rec: string, i: number) => (
                        <li key={i} style={{ marginBottom: '4px', color: '#d97706' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Frame Coordinates Preview */}
              <div>
                <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>Frame Coordinates</h3>
                <div style={{ 
                  backgroundColor: '#f3f4f6', 
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '16px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  {testResults.frames.slice(0, 10).map((frame: any, i: number) => (
                    <div key={i} style={{ marginBottom: '4px' }}>
                      Frame {i + 1}: ({frame.x},{frame.y}) {frame.width}x{frame.height}
                    </div>
                  ))}
                  {testResults.frames.length > 10 && (
                    <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                      ... and {testResults.frames.length - 10} more frames
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Sprites Gallery */}
      {generatedSprites.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '20px' }}>🎨 Generated Sprites</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {generatedSprites.map((spriteUrl, index) => (
              <div key={index} style={{ 
                border: '1px solid #d1d5db', 
                borderRadius: '8px', 
                padding: '16px',
                backgroundColor: 'white',
                textAlign: 'center'
              }}>
                <h4 style={{ marginBottom: '12px' }}>Sprite #{index + 1}</h4>
                <PixiAnimatedSymbol
                  imageUrl={spriteUrl}
                  width={150}
                  height={150}
                  animationSpeed={0.1}
                />
                <button
                  onClick={() => analyzeGeneratedSprite(spriteUrl)}
                  style={{
                    marginTop: '12px',
                    padding: '6px 12px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  🔍 Analyze
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div style={{ 
        backgroundColor: '#f0f9ff', 
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', color: '#0c4a6e' }}>💡 Optimal Settings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px' }}>
          <div>
            <h4 style={{ marginBottom: '8px' }}>Recommended Sizes:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {SPRITE_SHEET_RECOMMENDATIONS.OPTIMAL_SIZES.map((size, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>
                  {size.width}x{size.height} ({size.frameSize}px frames)
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '8px' }}>Quality Requirements:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Transparent background (PNG format)</li>
              <li>Pixel-perfect grid alignment</li>
              <li>Consistent frame sizes</li>
              <li>Minimum 64px frame size</li>
              <li>Square aspect ratio preferred</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
