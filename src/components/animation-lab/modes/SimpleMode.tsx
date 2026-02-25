/**
 * Simple Mode - Streamlined Animation Interface
 * AI-powered animation with smart defaults and one-click presets
 */

import React, { useState, useCallback } from 'react';
import { useAnimationLab } from '../AnimationLabModeProvider';
import ImageUploader from '../components/ImageUploader';
import AutoAnimateSection from '../components/AutoAnimateSection';
import QuickPresets from '../components/QuickPresets';
import SimplePreview from '../components/SimplePreview';
import ExportSection from '../components/ExportSection';
import CreationModeSelector from '../components/CreationModeSelector';
import AIGenerationPanel from '../components/AIGenerationPanel';
import KeptSpritesManager, { type KeptSprite } from '../components/KeptSpritesManager';
import { simpleAnimationEngine, type SpriteAnimation } from '../../../utils/simpleAnimationEngine';
import { textIndividualizationEngine } from '../../../utils/textIndividualization';

const SimpleMode: React.FC = () => {
  const { atlasResult, setAtlasResult, isProcessing, setIsProcessing } = useAnimationLab();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimations, setCurrentAnimations] = useState<SpriteAnimation[]>([]);
  
  // V1.0 Features
  const [creationMode, setCreationMode] = useState<'upload' | 'generate'>('upload');
  const [keptSprites, setKeptSprites] = useState<KeptSprite[]>([]);
  const [textLayout, setTextLayout] = useState<'complete' | 'individual'>('complete');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKeptSprites, setShowKeptSprites] = useState(false);

  const handleImageUploaded = useCallback((result: any) => {
    setAtlasResult(result);
    setSelectedPreset(null);
    setCurrentAnimations([]);
  }, [setAtlasResult]);

  const handlePresetSelected = useCallback((presetId: string) => {
    if (!atlasResult) return;
    
    setSelectedPreset(presetId);
    
    try {
      // Apply preset animation
      const animations = simpleAnimationEngine.applyPreset(presetId, atlasResult.spriteElements || []);
      setCurrentAnimations(animations);
      console.log(`🎨 Applied preset "${presetId}":`, animations);
    } catch (error) {
      console.error('Failed to apply preset:', error);
    }
  }, [atlasResult]);

  const handleAutoAnimate = useCallback(async () => {
    if (!atlasResult) return;
    
    setIsAnimating(true);
    setSelectedPreset('auto'); // Special indicator for auto mode
    
    console.log('🤖 Auto-animating sprites...');
    
    try {
      // Simulate AI analysis time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Apply AI-powered auto animation
      const animations = simpleAnimationEngine.autoAnimate(atlasResult.spriteElements || []);
      setCurrentAnimations(animations);
      
      console.log('✅ Auto-animation complete:', animations);
    } catch (error) {
      console.error('Auto-animation failed:', error);
    } finally {
      setIsAnimating(false);
    }
  }, [atlasResult]);

  // Handle AI sprite generation
  const handleSpriteGenerated = useCallback((result: any) => {
    setAtlasResult(result);
    setSelectedPreset(null);
    setCurrentAnimations([]);
    console.log('🎨 AI generated sprite loaded:', result);
  }, [setAtlasResult]);

  // Handle error from AI generation
  const handleGenerationError = useCallback((error: string) => {
    console.error('AI Generation error:', error);
    alert(`AI Generation failed: ${error}`);
  }, []);

  // Handle keeping a sprite
  const handleKeepSprite = useCallback((spriteElement: any, imageUrl: string) => {
    // This would be called from the sprite analysis interface
    console.log('📦 Keeping sprite:', spriteElement.name);
  }, []);

  // Handle sprite individualization
  const handleIndividualizeText = useCallback(async () => {
    if (!atlasResult) return;

    try {
      setIsProcessing(true);
      console.log('📝 Starting text individualization...');

      const textSprites = atlasResult.spriteElements?.filter((sprite: any) => 
        sprite.type === 'letter' || sprite.name.includes('SCATTER') || sprite.name.includes('BONUS')
      ) || [];

      if (textSprites.length === 0) {
        alert('No text sprites found for individualization');
        return;
      }

      for (const sprite of textSprites) {
        const result = await textIndividualizationEngine.individualizeText(
          atlasResult.imageUrl,
          {
            minLetterWidth: 8,
            minLetterHeight: 12,
            maxGapSize: 30,
            mergeThreshold: 3,
            expectedText: sprite.name
          }
        );

        console.log(`📝 Individualized ${sprite.name}:`, result);
      }

      // Update the text layout setting
      setTextLayout('individual');
      console.log('✅ Text individualization completed');

    } catch (error) {
      console.error('Text individualization failed:', error);
      alert('Text individualization failed');
    } finally {
      setIsProcessing(false);
    }
  }, [atlasResult, setIsProcessing]);

  // Handle opening animation composer
  const handleOpenAnimationComposer = useCallback((sprites: KeptSprite[]) => {
    console.log('🎭 Opening animation composer with sprites:', sprites.length);
    // This would open the full animation composer interface
  }, []);

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px'
    }}>
      {/* Creation Mode Selector */}
      <CreationModeSelector
        mode={creationMode}
        onModeChange={setCreationMode}
        disabled={isProcessing || isGenerating}
      />

      {/* Main workflow steps */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px'
      }}>
        
        {/* Step 1: Create/Upload Content */}
        <section style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              background: '#3b82f6',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              1
            </span>
            {creationMode === 'upload' ? 'Upload Your Sprite Image' : 'Generate Sprite with AI'}
          </h2>
          
          <p style={{
            margin: '0 0 16px 0',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            {creationMode === 'upload' 
              ? 'Upload a sprite sheet or symbol image. Our AI will automatically detect and classify all sprites.'
              : 'Describe the sprite you want and let AI generate it for you with professional game quality.'
            }
          </p>

          {creationMode === 'upload' ? (
            <ImageUploader onImageUploaded={handleImageUploaded} isProcessing={isProcessing} />
          ) : (
            <AIGenerationPanel
              onSpriteGenerated={handleSpriteGenerated}
              onError={handleGenerationError}
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
            />
          )}
        </section>

        {/* Step 2: AI Detection Results (shown when image is uploaded) */}
        {atlasResult && (
          <section style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                background: '#10b981',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                ✓
              </span>
              AI Detection Complete
            </h2>
            
            {/* Detection summary */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '14px', color: '#059669', marginBottom: '8px' }}>
                <strong>🎯 Analysis Results:</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#047857' }}>
                Detected {Object.keys(atlasResult.atlasMetadata.frames).length} sprites: 
                {' '}
                {atlasResult.spriteElements
                  .reduce((acc, sprite) => {
                    acc[sprite.type || 'unknown'] = (acc[sprite.type || 'unknown'] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                  && Object.entries(
                    atlasResult.spriteElements.reduce((acc, sprite) => {
                      acc[sprite.type || 'unknown'] = (acc[sprite.type || 'unknown'] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`).join(', ')
                }
              </div>
            </div>

            {/* Text Layout Options */}
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#0369a1',
                marginBottom: '8px'
              }}>
                📝 Text Animation Options
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#0284c7'
                }}>
                  <input
                    type="radio"
                    checked={textLayout === 'complete'}
                    onChange={() => setTextLayout('complete')}
                  />
                  Complete Text
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#0284c7'
                }}>
                  <input
                    type="radio"
                    checked={textLayout === 'individual'}
                    onChange={() => setTextLayout('individual')}
                  />
                  Individual Letters
                </label>
                <button
                  onClick={handleIndividualizeText}
                  disabled={isProcessing || !atlasResult}
                  style={{
                    padding: '4px 8px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    opacity: isProcessing || !atlasResult ? 0.5 : 1
                  }}
                >
                  📝 Auto-Individualize
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <AutoAnimateSection 
                onAutoAnimate={handleAutoAnimate}
                isAnimating={isAnimating}
                disabled={!atlasResult}
              />
              <QuickPresets 
                onPresetSelected={handlePresetSelected}
                selectedPreset={selectedPreset}
                disabled={!atlasResult}
              />
            </div>
          </section>
        )}

        {/* Step 3: Preview and Export (shown when animation is applied) */}
        {atlasResult && (selectedPreset || isAnimating || currentAnimations.length > 0) && (
          <section style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                background: '#8b5cf6',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                3
              </span>
              Preview & Export
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '24px'
            }}>
              <SimplePreview 
                atlasResult={atlasResult}
                selectedPreset={selectedPreset}
                isAnimating={isAnimating}
              />
              <ExportSection 
                atlasResult={atlasResult}
                disabled={currentAnimations.length === 0}
                animations={currentAnimations}
              />
            </div>
          </section>
        )}

        {/* Kept Sprites Collection */}
        {(keptSprites.length > 0 || showKeptSprites) && (
          <section style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                margin: '0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  background: '#10b981',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  📦
                </span>
                Sprite Collection
              </h2>
              
              <button
                onClick={() => setShowKeptSprites(!showKeptSprites)}
                style={{
                  padding: '6px 12px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {showKeptSprites ? 'Hide' : 'Show'} Collection
              </button>
            </div>

            <KeptSpritesManager
              keptSprites={keptSprites}
              onKeptSpritesChange={setKeptSprites}
              onSpriteSelected={(sprite) => console.log('Selected sprite:', sprite)}
              onOpenAnimationComposer={handleOpenAnimationComposer}
            />
          </section>
        )}

        {/* Help and Tips */}
        <section style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            💡 Tips for Better Results
          </h3>
          <ul style={{
            margin: '0',
            paddingLeft: '20px',
            color: '#64748b',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <li>Use high-quality images with clear sprite separation</li>
            <li>Ensure sprites have transparent backgrounds for best detection</li>
            <li>Try different presets to find the perfect animation style</li>
            <li>Switch to Advanced Mode for manual fine-tuning</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default SimpleMode;