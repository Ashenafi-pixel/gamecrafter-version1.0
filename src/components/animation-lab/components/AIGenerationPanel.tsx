/**
 * AI Generation Panel Component
 * Complete AI sprite generation system from V1.0 with prompt fields and style selection
 */

import React, { useState, useCallback } from 'react';
import { enhancedOpenaiClient } from '../../../utils/enhancedOpenaiClient';

interface AIGenerationPanelProps {
  onSpriteGenerated: (result: any) => void;
  onError: (error: string) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
}

const STYLE_OPTIONS = [
  {
    id: 'fantasy-slot',
    name: 'Fantasy Slot',
    description: 'Medieval fantasy theme with dragons, castles, magic',
    preview: '🏰'
  },
  {
    id: 'egyptian-slot', 
    name: 'Egyptian Slot',
    description: 'Ancient Egypt theme with pyramids, pharaohs, gold',
    preview: '🔺'
  },
  {
    id: 'animated-cartoon',
    name: 'Animated Cartoon',
    description: 'Colorful cartoon style with bright colors',
    preview: '🎨'
  },
  {
    id: 'realistic-3d',
    name: 'Realistic 3D',
    description: 'Photorealistic 3D rendered objects',
    preview: '💎'
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    description: 'Retro pixel art style for classic games',
    preview: '🎮'
  },
  {
    id: 'neon-cyberpunk',
    name: 'Neon Cyberpunk',
    description: 'Futuristic cyberpunk with neon effects',
    preview: '🌃'
  }
];

const FORMAT_OPTIONS = [
  {
    id: 'square',
    name: 'Square',
    dimensions: '512x512',
    description: 'Perfect for slot symbols'
  },
  {
    id: 'portrait',
    name: 'Portrait',
    dimensions: '512x768',
    description: 'Tall format for characters'
  },
  {
    id: 'landscape',
    name: 'Landscape',
    dimensions: '768x512',
    description: 'Wide format for scenes'
  }
];

const PROMPT_EXAMPLES = [
  "Golden sword with magical glowing runes and sparkle effects",
  "Majestic dragon with emerald scales breathing blue fire",
  "Ancient treasure chest overflowing with jewels and coins",
  "Mystical crystal ball with swirling purple energy inside",
  "Royal crown with ruby gems and golden ornate details",
  "Magical potion bottle with bubbling green liquid and smoke"
];

const AIGenerationPanel: React.FC<AIGenerationPanelProps> = ({
  onSpriteGenerated,
  onError,
  isGenerating,
  setIsGenerating
}) => {
  const [textPrompt, setTextPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('fantasy-slot');
  const [selectedFormat, setSelectedFormat] = useState('square');
  const [textLayout, setTextLayout] = useState<'complete' | 'individual'>('complete');
  const [includeAnimationData, setIncludeAnimationData] = useState(true);

  // Generate sprite from text prompt
  const generateSpriteFromPrompt = useCallback(async () => {
    if (!textPrompt.trim()) {
      onError('Please enter a description for the sprite you want to generate');
      return;
    }

    setIsGenerating(true);

    try {
      const styleConfig = STYLE_OPTIONS.find(s => s.id === selectedStyle);
      const formatConfig = FORMAT_OPTIONS.find(f => f.id === selectedFormat);

      // Enhanced prompt with style and format specifications
      const enhancedPrompt = `Create a high-quality slot game sprite: ${textPrompt}. 
        Style: ${styleConfig?.description}. 
        Format: ${formatConfig?.dimensions} ${formatConfig?.description}.
        ${textLayout === 'individual' ? 'If text is included, ensure letters are well-spaced for individual animation.' : ''}
        ${includeAnimationData ? 'Design for smooth animation with clear boundaries.' : ''}
        Professional game asset quality, transparent background, crisp details.`;

      console.log('🎨 Generating sprite with prompt:', enhancedPrompt);

      // Call the enhanced OpenAI client for image generation
      const result = await enhancedOpenaiClient.generateImage({
        prompt: enhancedPrompt,
        style: selectedStyle,
        format: selectedFormat,
        size: formatConfig?.dimensions || '512x512',
        quality: 'hd'
      });

      if (result.success && result.imageUrl) {
        // Process the generated image for sprite atlas
        const processedResult = await processGeneratedSprite(result.imageUrl, {
          textLayout,
          includeAnimationData,
          style: selectedStyle,
          originalPrompt: textPrompt
        });

        onSpriteGenerated(processedResult);
        console.log('✅ Sprite generation completed successfully');
      } else {
        throw new Error(result.error || 'Failed to generate sprite');
      }

    } catch (error) {
      console.error('❌ Sprite generation failed:', error);
      onError(`Sprite generation failed: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  }, [textPrompt, selectedStyle, selectedFormat, textLayout, includeAnimationData, onSpriteGenerated, onError, setIsGenerating]);

  // Process generated sprite for animation
  const processGeneratedSprite = useCallback(async (imageUrl: string, options: any) => {
    // This would integrate with the professional sprite atlas system
    // For now, return a mock result structure
    return {
      imageUrl,
      spriteElements: [
        {
          name: 'generated_sprite',
          type: 'object',
          bounds: { x: 0, y: 0, width: 512, height: 512 },
          metadata: {
            generatedFrom: options.originalPrompt,
            style: options.style,
            textLayout: options.textLayout
          }
        }
      ],
      atlasMetadata: {
        frames: {
          'generated_sprite': {
            frame: { x: 0, y: 0, w: 512, h: 512 }
          }
        }
      },
      success: true
    };
  }, []);

  // Use example prompt
  const useExamplePrompt = useCallback((example: string) => {
    setTextPrompt(example);
  }, []);

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        color: 'white',
        padding: '16px 20px'
      }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700' }}>
          🎨 AI Sprite Generator
        </h3>
        <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>
          Generate custom sprites using advanced AI with professional game quality
        </p>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Main Prompt Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Describe Your Sprite
          </label>
          <textarea
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            placeholder="Describe the sprite you want to generate (e.g., 'Golden sword with magical glowing runes')"
            disabled={isGenerating}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'system-ui',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '4px'
          }}>
            {textPrompt.length}/500 characters
          </div>
        </div>

        {/* Example Prompts */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            💡 Example Prompts
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            {PROMPT_EXAMPLES.map((example, index) => (
              <button
                key={index}
                onClick={() => useExamplePrompt(example)}
                disabled={isGenerating}
                style={{
                  padding: '4px 8px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '16px',
                  fontSize: '11px',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
              >
                {example.length > 40 ? example.substring(0, 37) + '...' : example}
              </button>
            ))}
          </div>
        </div>

        {/* Style Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Art Style
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '8px'
          }}>
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                disabled={isGenerating}
                style={{
                  padding: '12px',
                  border: selectedStyle === style.id ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: selectedStyle === style.id ? '#f3f4f6' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '20px',
                  marginBottom: '4px'
                }}>
                  {style.preview}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: selectedStyle === style.id ? '#8b5cf6' : '#374151',
                  marginBottom: '2px'
                }}>
                  {style.name}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#6b7280',
                  lineHeight: '1.3'
                }}>
                  {style.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Format & Size
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          }}>
            {FORMAT_OPTIONS.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                disabled={isGenerating}
                style={{
                  padding: '10px',
                  border: selectedFormat === format.id ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: selectedFormat === format.id ? '#f3f4f6' : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: selectedFormat === format.id ? '#8b5cf6' : '#374151',
                  marginBottom: '2px'
                }}>
                  {format.name}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#6b7280'
                }}>
                  {format.dimensions}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div style={{
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px'
          }}>
            🔧 Advanced Options
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#374151'
            }}>
              <input
                type="radio"
                checked={textLayout === 'complete'}
                onChange={() => setTextLayout('complete')}
                disabled={isGenerating}
              />
              Complete Text - Generate text as single image
            </label>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#374151'
            }}>
              <input
                type="radio"
                checked={textLayout === 'individual'}
                onChange={() => setTextLayout('individual')}
                disabled={isGenerating}
              />
              Individual Letters - Optimize for letter-by-letter animation
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#374151',
              marginTop: '4px'
            }}>
              <input
                type="checkbox"
                checked={includeAnimationData}
                onChange={(e) => setIncludeAnimationData(e.target.checked)}
                disabled={isGenerating}
              />
              Include animation optimization data
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateSpriteFromPrompt}
          disabled={!textPrompt.trim() || isGenerating}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: isGenerating ? '#9ca3af' : 
                       !textPrompt.trim() ? '#e5e7eb' : 
                       'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: isGenerating || !textPrompt.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isGenerating ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Generating Sprite...
            </>
          ) : (
            <>
              🎨 Generate Sprite
            </>
          )}
        </button>

        {isGenerating && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#0369a1',
            textAlign: 'center'
          }}>
            ⏳ This may take 15-30 seconds. Creating your custom sprite with AI...
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIGenerationPanel;