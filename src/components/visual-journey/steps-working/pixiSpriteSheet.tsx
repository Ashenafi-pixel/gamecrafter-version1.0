import { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { generateSpriteSheet, type SpriteSheetConfig } from '../../../utils/spriteSheetGenerator';
import { analyzeSpriteSheet, generateFrameCoordinates, generateDynamicFrameCoordinates, generateDebugVisualization, alignSpriteSheetFrames } from '../../../utils/spriteSheetValidator';

/**
 * Enhanced PixiAnimatedSymbol with OpenAI Sprite Sheet Generation
 *
 * Props:
 * - imageUrl: URL or path to the generated sprite sheet (5x5 grid by default)
 * - gridCols: number of columns in the grid (default: 5)
 * - gridRows: number of rows in the grid (default: 5)
 * - animationSpeed: speed for AnimatedSprite (default: 0.2)
 * - width: desired width of the rendered symbol (default: frameWidth)
 * - height: desired height of the rendered symbol (default: frameHeight)
 * - enableGeneration: whether to show generation controls (default: false)
 * - onSpriteGenerated: callback when new sprite sheet is generated
 */

interface PixiAnimatedSymbolProps {
  imageUrl?: string;
  gridCols?: number;
  gridRows?: number;
  animationSpeed?: number;
  width?: number;
  height?: number;
  enableGeneration?: boolean;
  enableFrameAlignment?: boolean;
  onSpriteGenerated?: (spriteUrl: string) => void;
}

export default function PixiAnimatedSymbol({
  imageUrl,
  gridCols = 5,
  gridRows = 5,
  animationSpeed = 0.1,
  width,
  height,
  enableGeneration = false,
  enableFrameAlignment = true,
  onSpriteGenerated,
}: PixiAnimatedSymbolProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spriteRef = useRef<PIXI.AnimatedSprite | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSpriteUrl, setGeneratedSpriteUrl] = useState<string | null>(null);
  const [generationConfig, setGenerationConfig] = useState<SpriteSheetConfig>({
    prompt: 'Golden treasure chest with sparkling gems',
    symbolType: 'contour', // Always use contour for transparent backgrounds
    contentType: 'symbol-only',
    animationComplexity: 'medium'
  });

  // Upload state
  const [uploadLayout, setUploadLayout] = useState<'5x5' | 'single-row'>('5x5');
  const [uploadedSpriteUrl, setUploadedSpriteUrl] = useState<string | null>(null);

  // Use uploaded sprite URL first, then generated, then provided imageUrl
  const currentImageUrl = uploadedSpriteUrl || generatedSpriteUrl || imageUrl;

  // Determine grid layout based on source
  const effectiveGridCols = uploadedSpriteUrl ? (uploadLayout === 'single-row' ? 32 : 5) : gridCols;
  const effectiveGridRows = uploadedSpriteUrl ? (uploadLayout === 'single-row' ? 1 : 5) : gridRows;

  // Generate sprite sheet function (always uses 5x5 layout)
  const handleGenerateSprite = async () => {
    if (!enableGeneration) return;

    setIsGenerating(true);
    try {
      console.log('🎬 Generating sprite sheet with config:', generationConfig);
      const result = await generateSpriteSheet(generationConfig);

      if (result.success && result.spriteSheetUrl) {
        setGeneratedSpriteUrl(result.spriteSheetUrl);
        setUploadedSpriteUrl(null); // Clear uploaded sprite when generating new one
        onSpriteGenerated?.(result.spriteSheetUrl);
        console.log('✅ Sprite sheet generated successfully');
      } else {
        console.error('Sprite generation failed:', result.error);
        alert(`Sprite generation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Sprite generation error:', error);
      alert(`Sprite generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Create object URL for the uploaded file
    const fileUrl = URL.createObjectURL(file);
    setUploadedSpriteUrl(fileUrl);
    setGeneratedSpriteUrl(null); // Clear generated sprite when uploading
    onSpriteGenerated?.(fileUrl);

    console.log(`📁 Sprite sheet uploaded: ${file.name} (${uploadLayout} layout)`);
  };

  useEffect(() => {
    if (!currentImageUrl) return;

    // Initialize PIXI Application
    const app = new PIXI.Application({
      width: width || 256,
      height: height || 256,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
    });
    appRef.current = app;

    // Append view to container
    if (containerRef.current) {
      containerRef.current.appendChild(app.view as any);
    }

    // Load and setup animation using modern PIXI Assets with precise sprite cutting
    Promise.all([
      PIXI.Assets.load(currentImageUrl),
      analyzeSpriteSheet(currentImageUrl, effectiveGridCols, effectiveGridRows)
    ]).then(async ([texture, spriteAnalysis]) => {
      const baseTexture = texture.baseTexture;

      // Log analysis results
      console.log(`🖼️ Loaded sprite sheet: ${baseTexture.width}x${baseTexture.height}`);
      console.log(`📊 Sprite sheet analysis:`, spriteAnalysis.analysis);

      if (!spriteAnalysis.analysis.isValid) {
        console.warn('⚠️ Sprite sheet validation issues:', spriteAnalysis.analysis.issues);
        spriteAnalysis.analysis.recommendations.forEach(rec => {
          console.log(`💡 Recommendation: ${rec}`);
        });
      }

      // For 5x5 generated sprite sheets, use frame alignment if enabled
      let finalBaseTexture = baseTexture;
      let finalFrames = spriteAnalysis.frames;

      if (enableFrameAlignment && effectiveGridCols === 5 && effectiveGridRows === 5 && generatedSpriteUrl) {
        try {
          console.log('🎯 Applying frame alignment for consistent positioning...');
          const alignmentResult = await alignSpriteSheetFrames(currentImageUrl, spriteAnalysis.frames);

          // Load the aligned sprite sheet
          const alignedTexture = await PIXI.Assets.load(alignmentResult.alignedSpriteSheetUrl);
          finalBaseTexture = alignedTexture.baseTexture;
          finalFrames = alignmentResult.alignedFrames;

          console.log('✅ Frame alignment completed');
        } catch (alignError) {
          console.warn('⚠️ Frame alignment failed, using original frames:', alignError);
          // Continue with original frames
        }
      }

      // Log debug visualization
      console.log(generateDebugVisualization(finalFrames, finalBaseTexture.width, finalBaseTexture.height));

      const textures: PIXI.Texture[] = [];

      // Calculate frame dimensions for sizing
      const frameWidth = Math.floor(finalBaseTexture.width / effectiveGridCols);
      const frameHeight = Math.floor(finalBaseTexture.height / effectiveGridRows);

      // Create textures using validated frame coordinates
      finalFrames.forEach((frame, index) => {
        const frameTexture = new PIXI.Texture(
          finalBaseTexture,
          new PIXI.Rectangle(frame.x, frame.y, frame.width, frame.height)
        );

        textures.push(frameTexture);

        // Debug log for first few frames
        if (index < 3) {
          console.log(`🎬 Frame ${index + 1}: (${frame.x},${frame.y}) ${frame.width}x${frame.height}`);
        }
      });

      console.log(`✅ Created ${textures.length} frame textures with validation`);

      // Create AnimatedSprite with error handling
      if (textures.length === 0) {
        console.error('No textures created for animation');
        return;
      }

      const anim = new PIXI.AnimatedSprite(textures);
      anim.animationSpeed = animationSpeed;
      anim.loop = true;

      // Set size while maintaining aspect ratio
      const targetWidth = width || frameWidth;
      const targetHeight = height || frameHeight;

      // Maintain aspect ratio if only one dimension is specified
      if (width && !height) {
        const aspectRatio = frameHeight / frameWidth;
        anim.width = targetWidth;
        anim.height = targetWidth * aspectRatio;
      } else if (height && !width) {
        const aspectRatio = frameWidth / frameHeight;
        anim.height = targetHeight;
        anim.width = targetHeight * aspectRatio;
      } else {
        anim.width = targetWidth;
        anim.height = targetHeight;
      }

      // Center the animation
      anim.anchor.set(0.5);
      anim.x = app.renderer.width / 2;
      anim.y = app.renderer.height / 2;

      // Start animation
      anim.play();

      app.stage.addChild(anim);
      spriteRef.current = anim;

      console.log(`🎮 Animation started: ${anim.width}x${anim.height} at (${anim.x},${anim.y})`);

    }).catch((error) => {
      console.error('Failed to load or analyze sprite sheet:', error);
      console.error('URL:', currentImageUrl);

      // Show detailed error in the container
      if (containerRef.current) {
        const errorMessage = error.message || 'Unknown error occurred';
        const isValidationError = errorMessage.includes('validation') || errorMessage.includes('dimensions');

        containerRef.current.innerHTML = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${width || 256}px;
            height: ${height || 256}px;
            background: ${isValidationError ? '#fff3cd' : '#fee'};
            border: 2px dashed ${isValidationError ? '#ffc107' : '#f88'};
            border-radius: 8px;
            color: ${isValidationError ? '#856404' : '#c44'};
            font-size: 14px;
            text-align: center;
            padding: 16px;
          ">
            <div>
              <div style="font-weight: bold; margin-bottom: 8px;">
                ${isValidationError ? '⚠️ Sprite Sheet Issue' : 'Failed to Load'}
              </div>
              <div style="font-size: 12px; opacity: 0.8; margin-bottom: 8px;">
                ${isValidationError ? 'Check sprite sheet format' : 'Check console for details'}
              </div>
              ${isValidationError ? `
                <div style="font-size: 11px; background: rgba(255,255,255,0.5); padding: 4px 8px; border-radius: 4px; margin-top: 8px;">
                  Expected: 5x5 grid, transparent background, equal frame sizes
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }
    });

    return () => {
      // Cleanup on unmount
      if (spriteRef.current && appRef.current) {
        appRef.current.stage.removeChild(spriteRef.current);
        spriteRef.current.destroy();
      }
      if (appRef.current) {
        appRef.current.destroy(true);
      }
    };
  }, [currentImageUrl, effectiveGridCols, effectiveGridRows, animationSpeed, width, height, enableFrameAlignment]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* PIXI Animation Container */}
      <div ref={containerRef} style={{ display: 'inline-block' }} />

      {/* Generation Controls */}
      {enableGeneration && (
        <div style={{
          padding: '16px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
            🎬 Generate Animated Sprite Sheet
          </h3>

          <div style={{
            padding: '12px',
            backgroundColor: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px'
          }}>
            <strong>✨ Enhanced Generation:</strong> Creates 5x5 grid (25 frames) with transparent background,
            pixel-perfect alignment, and consistent sizing for smooth animation.
            {enableFrameAlignment && (
              <div style={{ marginTop: '8px', color: '#0066cc' }}>
                <strong>🎯 Frame Alignment:</strong> Automatically centers objects in each frame to prevent jumping during animation.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {/* Prompt Input */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Symbol Description:
              </label>
              <input
                type="text"
                value={generationConfig.prompt}
                onChange={(e) => setGenerationConfig(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="Describe your animated symbol..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Symbol Type */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Symbol Type:
              </label>
              <select
                value={generationConfig.symbolType}
                onChange={(e) => setGenerationConfig(prev => ({
                  ...prev,
                  symbolType: e.target.value as 'block' | 'contour'
                }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              >
                <option value="block">Block (Square with background)</option>
                <option value="contour">Contour (Custom shape, transparent)</option>
              </select>
            </div>



            {/* Content Type */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Content Type:
              </label>
              <select
                value={generationConfig.contentType}
                onChange={(e) => setGenerationConfig(prev => ({
                  ...prev,
                  contentType: e.target.value as any
                }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              >
                <option value="symbol-only">Symbol Only</option>
                <option value="symbol-wild">Symbol + WILD Text</option>
                <option value="symbol-scatter">Symbol + SCATTER Text</option>
                <option value="symbol-bonus">Symbol + BONUS Text</option>
                <option value="symbol-free">Symbol + FREE Text</option>
                <option value="symbol-jackpot">Symbol + JACKPOT Text</option>
                <option value="text-only">Text Only</option>
              </select>
            </div>

            {/* Animation Complexity */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Animation Complexity:
              </label>
              <select
                value={generationConfig.animationComplexity}
                onChange={(e) => setGenerationConfig(prev => ({
                  ...prev,
                  animationComplexity: e.target.value as 'simple' | 'medium' | 'complex'
                }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              >
                <option value="simple">Simple (Gentle floating, subtle glow)</option>
                <option value="medium">Medium (Dynamic movement, particles)</option>
                <option value="complex">Complex (Elaborate transformations, magical effects)</option>
              </select>
            </div>

            {/* Upload Layout Options */}
            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📐 Upload Layout (for uploaded images only):</div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="uploadLayout"
                    value="5x5"
                    checked={uploadLayout === '5x5'}
                    onChange={(e) => setUploadLayout(e.target.value as '5x5' | 'single-row')}
                  />
                  5x5 Grid (25 frames)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="uploadLayout"
                    value="single-row"
                    checked={uploadLayout === 'single-row'}
                    onChange={(e) => setUploadLayout(e.target.value as '5x5' | 'single-row')}
                  />
                  Single Row (horizontal strip)
                </label>
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                Generated sprites always use 5x5 layout. This setting only affects uploaded images.
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={handleGenerateSprite}
                disabled={isGenerating}
                style={{
                  flex: '1',
                  padding: '12px 16px',
                  backgroundColor: isGenerating ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                {isGenerating ? '🎬 Generating...' : '🚀 Generate 5x5 Sprite'}
              </button>

              {/* Upload Button */}
              <label style={{
                flex: '1',
                padding: '12px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                textAlign: 'center',
                display: 'inline-block'
              }}>
                📁 Upload Sprite Sheet
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Status */}
            {isGenerating && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                color: '#856404',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '8px' }}>🎬 Generating sprite sheet...</div>
                <div style={{ fontSize: '12px', opacity: '0.8' }}>
                  Creating 25 frames with transparent background and pixel-perfect alignment
                </div>
              </div>
            )}

            {/* Status Messages */}
            {generatedSpriteUrl && !isGenerating && (
              <div style={{
                padding: '12px',
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                color: '#155724'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  ✅ Sprite sheet generated successfully!
                </div>
                <div style={{ fontSize: '12px', opacity: '0.9' }}>
                  • 5x5 grid with 25 animation frames<br/>
                  • Transparent background for clean integration<br/>
                  • Pixel-perfect frame alignment<br/>
                  • Ready for PIXI.js animation
                </div>
              </div>
            )}

            {uploadedSpriteUrl && !generatedSpriteUrl && (
              <div style={{
                padding: '12px',
                backgroundColor: '#d1ecf1',
                border: '1px solid #bee5eb',
                borderRadius: '4px',
                color: '#0c5460'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  📁 Sprite sheet uploaded successfully!
                </div>
                <div style={{ fontSize: '12px', opacity: '0.9' }}>
                  • Layout: {uploadLayout === '5x5' ? '5x5 grid (25 frames)' : 'Single row (32 frames)'}<br/>
                  • Ready for animation preview<br/>
                  • Use radio buttons above to change layout interpretation
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
