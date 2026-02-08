import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AssetManager } from '../core/AssetManager';
import { ImageAnalysisResult } from '../core/ImageAnalyzer';
import { GSAPAnimationManager, AnimationState, LoopMode, PlaybackMode } from '../animation/GSAPAnimationManager';
import { spriteDecomposer, SpriteDecompositionResult } from '../../../utils/spriteDecomposer';
import AnimationComposer from './AnimationComposer';

interface SimpleAnimationCanvasProps {
  assetManager: AssetManager;
  selectedAnimations: Map<string, string[]>;
  analysisResults: Map<string, ImageAnalysisResult>;
  onError: (error: string) => void;
}

// AnimationState is now imported from GSAPAnimationManager

export const SimpleAnimationCanvas: React.FC<SimpleAnimationCanvasProps> = ({
  assetManager,
  selectedAnimations,
  analysisResults,
  onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationManagerRef = useRef<GSAPAnimationManager | null>(null);
  const [animationState, setAnimationState] = useState<AnimationState>({
    rotation: 0,
    scale: 1,
    glowIntensity: 0,
    floatY: 0,
    pulseScale: 1,
    x: 0,
    y: 0,
    alpha: 1,
    time: 0
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [assetCount, setAssetCount] = useState(0); // Track asset count changes
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [loopMode, setLoopMode] = useState<LoopMode>('forever');
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('simultaneous');
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [isSpriteProcessing, setIsSpriteProcessing] = useState(false);
  const [spriteDecomposition, setSpriteDecomposition] = useState<SpriteDecompositionResult | null>(null);
  const [keptSprites, setKeptSprites] = useState<Array<{
    name: string;
    imageUrl: string;
    element: any;
    keptAt: number;
  }>>([]);
  const [regeneratingSprites, setRegeneratingSprites] = useState<Set<string>>(new Set());
  const [showAnimationComposer, setShowAnimationComposer] = useState(false);
  const [creationMode, setCreationMode] = useState<'upload' | 'generate'>('upload');
  const [textPrompt, setTextPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('animated-cartoon');
  const [selectedFormat, setSelectedFormat] = useState('square');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandingSprite, setExpandingSprite] = useState<string | null>(null);
  const [textLayout, setTextLayout] = useState<'complete' | 'individual'>('complete');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      onError('Please upload a valid image file (PNG, JPG, WebP)');
      return;
    }

    console.log('📁 File selected for upload:', file.name);

    try {
      // Load the file directly into the asset manager using the correct method
      const assetId = `uploaded_${Date.now()}`;
      
      console.log('🔄 Loading image into asset manager...');
      await assetManager.loadImageAsset(assetId, file, file.name);
      
      // Update asset count to trigger re-render
      const newAssets = assetManager.getAllMetadata();
      setAssetCount(newAssets.length);
      
      // Set as current asset
      setCurrentAsset(assetId);
      console.log('✅ File uploaded and set as current asset:', assetId);
      
    } catch (error) {
      console.error('File upload error:', error);
      onError(`Failed to upload file: ${error}`);
    }

    // Clear the input so the same file can be uploaded again if needed
    if (event.target) {
      event.target.value = '';
    }
  }, [assetManager, onError]);

  // Trigger file input click
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Clean up localStorage on component mount to prevent quota issues
  useEffect(() => {
    try {
      // Clear large animation lab data that causes quota issues
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('animation_lab') || 
          key.includes('sprite_') || 
          key.includes('anim_test_') ||
          key.includes('test_symbol_')
        )) {
          keysToRemove.push(key);
        }
      }
      
      if (keysToRemove.length > 0) {
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`🧹 Cleaned up ${keysToRemove.length} localStorage items to prevent quota issues`);
      }
    } catch (error) {
      console.warn('localStorage cleanup failed:', error);
    }
  }, []);

  // Helper function to convert data URL to blob without fetch
  // Helper function to map layer types to sprite types
  const mapLayerTypeToSpriteType = (layerType: string): 'text' | 'character' | 'object' | 'effect' => {
    const typeMap: Record<string, 'text' | 'character' | 'object' | 'effect'> = {
      'text': 'text',
      'creature': 'character',
      'character': 'character',
      'object': 'object',
      'effect': 'effect',
      'magical': 'effect',
      'glow': 'effect'
    };
    
    return typeMap[layerType] || 'object';
  };

  const dataURLtoBlob = async (dataURL: string): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      };
      
      img.src = dataURL;
    });
  };

  /**
   * Load the current asset image
   */
  const loadAssetImage = useCallback(async (assetId: string) => {
    try {
      console.log(`🎨 Attempting to load image for asset: ${assetId}`);
      
      const metadata = assetManager.getMetadata(assetId);
      const texture = assetManager.getTexture(assetId);
      
      console.log('Metadata:', metadata);
      console.log('Texture:', texture);
      
      if (!metadata) {
        throw new Error(`Asset ${assetId} not found in AssetManager`);
      }

      if (!texture) {
        throw new Error(`Texture for ${assetId} not found in AssetManager`);
      }

      // Strategy 1: Use the PIXI texture source directly (most reliable)
      const pixiSource = texture.baseTexture?.resource?.source;
      if (pixiSource instanceof HTMLImageElement) {
        console.log('✅ Using PIXI texture source directly');
        setLoadedImage(pixiSource);
        setCurrentAsset(assetId);
        console.log(`✅ Loaded image successfully: ${metadata.name}`);
        return;
      }

      // Strategy 2: Use canvas method if PIXI source is a canvas
      if (pixiSource instanceof HTMLCanvasElement) {
        console.log('📝 Converting canvas to image');
        const img = new Image();
        img.onload = () => {
          setLoadedImage(img);
          setCurrentAsset(assetId);
          console.log(`✅ Loaded image from canvas: ${metadata.name}`);
        };
        img.onerror = (error) => {
          console.error('Failed to load canvas image:', error);
          onError(`Failed to load canvas image ${metadata.name}: ${error}`);
        };
        img.src = pixiSource.toDataURL();
        return;
      }

      // Strategy 3: Fallback - create a placeholder image
      console.log('⚠️ No valid image source found, creating placeholder');
      const canvas = document.createElement('canvas');
      canvas.width = metadata.size.width;
      canvas.height = metadata.size.height;
      const ctx = canvas.getContext('2d')!;
      
      // Draw placeholder
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(metadata.name, canvas.width / 2, canvas.height / 2);
      
      const img = new Image();
      img.onload = () => {
        setLoadedImage(img);
        setCurrentAsset(assetId);
        console.log(`✅ Loaded placeholder image: ${metadata.name}`);
      };
      img.src = canvas.toDataURL();
      
    } catch (error) {
      console.error('Failed to load asset image:', error);
      onError(`Failed to load image for animation: ${error}`);
    }
  }, [assetManager, onError]);

  /**
   * Initialize GSAP Animation Manager
   */
  const initializeGSAP = useCallback(() => {
    if (animationManagerRef.current) {
      animationManagerRef.current.destroy();
    }

    console.log('🎬 Initializing GSAP Animation Manager');
    const initialState: AnimationState = {
      rotation: 0,
      scale: 1,
      glowIntensity: 0,
      floatY: 0,
      pulseScale: 1,
      x: 0,
      y: 0,
      alpha: 1,
      time: 0
    };
    
    animationManagerRef.current = new GSAPAnimationManager(
      initialState,
      (newState: AnimationState) => {
        setAnimationState(newState);
        // Update timeline position when animation manager updates
        const currentPosition = animationManagerRef.current?.getTimelinePosition() || 0;
        setTimelinePosition(currentPosition);
      }
    );
  }, []); // Remove animationState dependency to prevent recreation

  /**
   * Render the image on canvas using GSAP animation state
   */
  const renderImage = useCallback(() => {
    if (!canvasRef.current || !loadedImage || !currentAsset) {
      // Only log once per state change, not continuously
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Cannot get canvas context');
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get selected animations for current asset
    const selectedAnims = selectedAnimations.get(currentAsset) || [];
    
    // Calculate position and scale using GSAP animation state
    const centerX = canvas.width / 2 + animationState.x;
    const centerY = canvas.height / 2 + animationState.floatY + animationState.y;
    
    // Calculate scale to fit image with GSAP scaling
    const maxSize = Math.min(canvas.width * 0.6, canvas.height * 0.6);
    const baseScale = Math.min(maxSize / loadedImage.width, maxSize / loadedImage.height);
    const finalScale = baseScale * animationState.scale * animationState.pulseScale;

    // Debug log animation values
    if (selectedAnims.length > 0) {
      console.log('🎭 GSAP Animation Values:', {
        selectedAnims,
        rotation: animationState.rotation.toFixed(3),
        scale: animationState.scale.toFixed(3),
        glowIntensity: animationState.glowIntensity.toFixed(3),
        floatY: animationState.floatY.toFixed(1),
        pulseScale: animationState.pulseScale.toFixed(3),
        finalScale: finalScale.toFixed(3)
      });
    }

    // Save context for transformations
    ctx.save();

    // Apply alpha
    ctx.globalAlpha = animationState.alpha;

    // Apply glow effect using GSAP glow intensity
    if (selectedAnims.includes('glow') && animationState.glowIntensity > 0) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 30 * animationState.glowIntensity;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Apply particle effect (enhanced glow)
    if (selectedAnims.includes('particle') && animationState.glowIntensity > 0) {
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 40 * animationState.glowIntensity;
    }

    // Translate to center and apply rotation
    ctx.translate(centerX, centerY);
    ctx.rotate(animationState.rotation);

    // Scale and draw image
    ctx.scale(finalScale, finalScale);
    ctx.drawImage(
      loadedImage,
      -loadedImage.width / 2,
      -loadedImage.height / 2,
      loadedImage.width,
      loadedImage.height
    );

    // Restore context
    ctx.restore();
  }, [loadedImage, currentAsset, selectedAnimations, animationState]);

  /**
   * Start GSAP animation
   */
  const startAnimation = useCallback(() => {
    if (animationManagerRef.current) {
      animationManagerRef.current.play();
      setIsPlaying(true);
      console.log('▶️ GSAP: Started animations');
    }
  }, []);

  /**
   * Stop GSAP animation
   */
  const stopAnimation = useCallback(() => {
    if (animationManagerRef.current) {
      animationManagerRef.current.pause();
      setIsPlaying(false);
      console.log('⏸️ GSAP: Paused animations');
    }
  }, []);

  /**
   * Reset GSAP animation state
   */
  const resetAnimation = useCallback(() => {
    if (animationManagerRef.current) {
      animationManagerRef.current.stop();
      setIsPlaying(false);
      console.log('⏹️ GSAP: Reset animations');
    }
  }, []);

  /**
   * Update animation speed
   */
  const updateSpeed = useCallback((speed: number) => {
    if (animationManagerRef.current) {
      animationManagerRef.current.setSpeed(speed);
      setAnimationSpeed(speed);
      console.log('🏃 GSAP: Speed set to', speed);
    }
  }, []);

  /**
   * Update loop mode
   */
  const updateLoopMode = useCallback((mode: LoopMode) => {
    if (animationManagerRef.current) {
      animationManagerRef.current.setLoopMode(mode);
      setLoopMode(mode);
      console.log('🔄 GSAP: Loop mode set to', mode);
    }
  }, []);

  /**
   * Update playback mode
   */
  const updatePlaybackMode = useCallback((mode: PlaybackMode) => {
    if (animationManagerRef.current) {
      animationManagerRef.current.setPlaybackMode(mode);
      setPlaybackMode(mode);
      console.log('🎬 GSAP: Playback mode set to', mode);
    }
  }, []);

  /**
   * Update timeline position
   */
  const updateTimelinePosition = useCallback((position: number) => {
    if (animationManagerRef.current) {
      animationManagerRef.current.setTimelinePosition(position);
      setTimelinePosition(position);
    }
  }, []);

  /**
   * Handle Sprite IT decomposition
   */
  const handleSpriteDecomposition = useCallback(async () => {
    if (!currentAsset) {
      onError('No asset selected for sprite decomposition');
      return;
    }

    const metadata = assetManager.getMetadata(currentAsset);
    const texture = assetManager.getTexture(currentAsset);
    
    if (!metadata || !texture) {
      onError('Asset not found for sprite decomposition');
      return;
    }

    setIsSpriteProcessing(true);
    
    try {
      console.log('🎭 Starting Sprite IT decomposition...');
      
      // Convert texture to File object for processing
      let imageFile: File;
      
      if (metadata.source && (metadata.source.startsWith('data:') || metadata.source.startsWith('blob:'))) {
        // Use existing source if available
        const response = await fetch(metadata.source);
        const blob = await response.blob();
        imageFile = new File([blob], metadata.name, { type: blob.type });
      } else {
        // Extract image data from PIXI texture
        console.log('📸 Extracting image data from texture...');
        
        // Get the base texture source
        const baseTexture = texture.baseTexture;
        const source = baseTexture.resource?.source;
        
        if (source instanceof HTMLImageElement) {
          // Convert image to blob
          const canvas = document.createElement('canvas');
          canvas.width = source.naturalWidth || source.width;
          canvas.height = source.naturalHeight || source.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(source, 0, 0);
          
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
          });
          
          imageFile = new File([blob], metadata.name, { type: 'image/png' });
        } else if (source instanceof HTMLCanvasElement) {
          // Extract from canvas
          const blob = await new Promise<Blob>((resolve) => {
            source.toBlob((blob) => resolve(blob!), 'image/png');
          });
          
          imageFile = new File([blob], metadata.name, { type: 'image/png' });
        } else {
          throw new Error('Unsupported texture source type for sprite decomposition');
        }
      }

      console.log('📁 Image file prepared:', imageFile.name, imageFile.size, 'bytes');
      console.log(`🔧 Upload Handler Debug: textLayout state = "${textLayout}"`);

      // Perform sprite decomposition with text layout context
      const result = await spriteDecomposer.decomposeImageToSprites(imageFile, textLayout);
      
      if (result.success) {
        setSpriteDecomposition(result);
        console.log(`✅ Sprite decomposition complete! Found ${result.generatedSprites.length} sprite elements`);
        
        // Sprites are now available in the gallery with download buttons
        console.log(`🎭 Sprite decomposition complete! ${result.generatedSprites.length} sprites available in gallery below.`);
        console.log(`💡 Use the download buttons in the gallery to save individual sprites.`);
        
      } else {
        onError(result.error || 'Sprite decomposition failed');
      }
      
    } catch (error) {
      console.error('Sprite decomposition error:', error);
      onError(`Sprite decomposition failed: ${error}`);
    } finally {
      setIsSpriteProcessing(false);
    }
  }, [currentAsset, assetManager, onError, textLayout]);

  // Keep a sprite in the collection
  const keepSprite = useCallback((sprite: any) => {
    const keptSprite = {
      name: sprite.name,
      imageUrl: sprite.imageUrl,
      element: sprite.element,
      keptAt: Date.now()
    };
    
    setKeptSprites(prev => {
      // Remove any existing sprite with the same name and add the new one
      const filtered = prev.filter(s => s.name !== sprite.name);
      return [...filtered, keptSprite];
    });
    
    console.log(`👍 Kept sprite: ${sprite.name}`);
  }, []);

  // Regenerate a specific sprite
  const regenerateSprite = useCallback(async (sprite: any) => {
    if (!spriteDecomposition) return;
    
    console.log(`🔄 Regenerating sprite: ${sprite.name}`);
    setRegeneratingSprites(prev => new Set(prev).add(sprite.name));
    
    try {
      // Check if this is a letter sprite that should use derivation system
      const isLetter = sprite.name.length === 1 || 
                       ['w', 'i', 'l', 'd', 's', 'c', 'a', 't', 'e', 'r', 'b', 'o', 'n', 'u', 'f', 'r', 'e', 'p', 'm'].includes(sprite.name.toLowerCase());
      
      if (isLetter && (spriteDecomposition as any).derivationResult) {
        console.log(`🎨 Regenerating letter "${sprite.name}" using derivation system for consistency...`);
        
        // Use letter derivation system for consistent styling
        const { letterDerivationSystem } = await import('../../../utils/letterDerivationSystem');
        const derivationResult = (spriteDecomposition as any).derivationResult;
        
        // Find the base letter from the derivation result
        const baseLetter = derivationResult.letters.find((l: any) => l.derivationMethod === 'base');
        if (!baseLetter) {
          throw new Error('No base letter found in derivation result');
        }
        
        // Get the style analysis from the derivation result
        const styleAnalysis = {
          primaryColor: 'golden metallic',
          secondaryColor: 'deep crimson outline',
          effects: ['magical glow', 'drop shadow', '3D bevel'],
          typography: 'Bold fantasy serif with ornate details',
          lighting: 'dramatic top lighting with rim highlights',
          texture: 'polished metallic surface with fine detail',
          artisticStyle: 'premium slot game artwork with fantasy elements'
        };
        
        // Re-derive this letter from the base letter
        const { enhancedOpenaiClient } = await import('../../../utils/enhancedOpenaiClient');
        
        const derivationPrompt = `Create the letter "${sprite.name.toUpperCase()}" that PERFECTLY MATCHES the styling of the reference letter "${baseLetter.letter.toUpperCase()}".

CRITICAL STYLE MATCHING:
- Use IDENTICAL color scheme: ${styleAnalysis.primaryColor} + ${styleAnalysis.secondaryColor}
- Use IDENTICAL typography: ${styleAnalysis.typography}
- Use IDENTICAL texture: ${styleAnalysis.texture}
- Use IDENTICAL lighting: ${styleAnalysis.lighting}
- Use IDENTICAL effects: ${styleAnalysis.effects.join(', ')}
- Use IDENTICAL artistic style: ${styleAnalysis.artisticStyle}

DERIVATION REQUIREMENTS:
- Change ONLY the letter shape from "${baseLetter.letter.toUpperCase()}" to "${sprite.name.toUpperCase()}"
- Keep EVERYTHING ELSE exactly the same
- Same proportions, same thickness, same spacing
- Same visual weight and presence
- Same effects intensity and placement

QUALITY SPECIFICATIONS:
- Ultra-high resolution 4K quality finished graphics
- Professional game-ready artwork matching reference quality
- Perfect edge definition and clean vector-style clarity
- Premium visual polish suitable for commercial slot games
- Completely transparent background
- Letter centered and properly sized to match reference

CONSISTENCY CHECKLIST:
✓ Color palette identical to reference
✓ Typography style identical to reference  
✓ Texture treatment identical to reference
✓ Lighting direction identical to reference
✓ Effects type and intensity identical to reference
✓ Only letter shape differs

The result should be the letter "${sprite.name.toUpperCase()}" that looks like it was created by the same artist using the same tools and techniques as the reference "${baseLetter.letter.toUpperCase()}".`;

        const imageResult = await enhancedOpenaiClient.generateImageWithConfig({
          prompt: derivationPrompt,
          count: 1,
          targetSymbolId: `letter_rederived_${sprite.name}_${Date.now()}`,
          gameId: 'letter_derivation'
        });

        if (imageResult.success && imageResult.images && imageResult.images.length > 0) {
          // Update the sprite in the decomposition results
          setSpriteDecomposition(prev => {
            if (!prev) return prev;
            
            const updatedSprites = prev.generatedSprites.map(s => 
              s.name === sprite.name 
                ? { ...s, imageUrl: imageResult.images![0] }
                : s
            );
            
            return { ...prev, generatedSprites: updatedSprites };
          });
          
          console.log(`✅ Re-derived letter "${sprite.name}" with consistent styling`);
        } else {
          throw new Error(`Failed to re-derive letter: ${imageResult.error || 'No images generated'}`);
        }
      } else {
        // Use regular regeneration for non-letter sprites
        console.log(`🎨 Regenerating non-letter sprite: ${sprite.name}`);
        
        const { enhancedOpenaiClient } = await import('../../../utils/enhancedOpenaiClient');
        
        // Create improved prompt for regeneration  
        const spritePrompt = `Create a high-quality PNG sprite of a ${sprite.element.name} for a fantasy slot game.

QUALITY SPECIFICATIONS:
- Ultra-high resolution 4K quality finished graphics
- Professional game-ready artwork with crisp details
- Perfect edge definition and clean vector-style clarity
- Premium visual polish suitable for commercial slot games
- Rich color depth and sophisticated lighting
- Flawless texturing and material definition

SPRITE REQUIREMENTS:
- Subject: ${sprite.element.description || sprite.element.name}
- Style: Fantasy slot game symbol, high quality, detailed artwork
- Background: Completely transparent (no background)
- Format: PNG with transparency
- Quality: High resolution, clean edges, professional game asset

SPECIFIC STYLE FOR ${sprite.element.name.toUpperCase()}:
${sprite.element.name === 'sword' ? '- Medieval fantasy sword with ornate details' : ''}
${sprite.element.name === 'stone' ? '- Ancient magical stone or gem with mystical properties' : ''}
${sprite.element.name === 'chalice' ? '- Ornate golden chalice with decorative patterns' : ''}
${sprite.element.name === 'gem' || sprite.element.name.includes('gem') ? '- Brilliant cut gemstone with faceted surface and magical glow' : ''}
${sprite.element.name.includes('glow') || sprite.element.name.includes('magical') ? '- Magical energy effect with sparkles and aura' : ''}

Create a completely isolated sprite ready for animation with commercial-grade visual quality.`;

        const imageResult = await enhancedOpenaiClient.generateImageWithConfig({
          prompt: spritePrompt,
          count: 1,
          targetSymbolId: `sprite_${sprite.element.name}_regen`,
          gameId: 'sprite_decomposition'
        });

        if (imageResult.success && imageResult.images && imageResult.images.length > 0) {
          // Update the sprite in the decomposition results
          setSpriteDecomposition(prev => {
            if (!prev) return prev;
            
            const updatedSprites = prev.generatedSprites.map(s => 
              s.name === sprite.name 
                ? { ...s, imageUrl: imageResult.images![0] }
                : s
            );
            
            return { ...prev, generatedSprites: updatedSprites };
          });
          
          console.log(`✅ Regenerated sprite: ${sprite.name}`);
        } else {
          throw new Error(`Failed to regenerate sprite: ${imageResult.error || 'No images generated'}`);
        }
      }
      
    } catch (error) {
      console.error(`Failed to regenerate sprite ${sprite.name}:`, error);
      onError(`Failed to regenerate ${sprite.name}: ${error}`);
    } finally {
      setRegeneratingSprites(prev => {
        const newSet = new Set(prev);
        newSet.delete(sprite.name);
        return newSet;
      });
    }
  }, [spriteDecomposition, onError]);

  // Extract individual letters from any detected text
  const extractTextLetters = useCallback(async (textSprite: any) => {
    if (!spriteDecomposition || !textSprite) return;

    // Extract the text content from the sprite name or description
    let textContent = '';
    
    // Try to extract text from various naming patterns
    if (textSprite.name.includes('wild')) {
      textContent = 'WILD';
    } else if (textSprite.name.includes('text') || textSprite.element.description.toLowerCase().includes('text')) {
      // Try to extract text from description or ask user
      const description = textSprite.element.description.toLowerCase();
      
      // Look for common slot game text patterns
      if (description.includes('bonus')) textContent = 'BONUS';
      else if (description.includes('free')) textContent = 'FREE';
      else if (description.includes('spin')) textContent = 'SPIN';
      else if (description.includes('win')) textContent = 'WIN';
      else if (description.includes('jackpot')) textContent = 'JACKPOT';
      else {
        // Ask user for the text content
        textContent = prompt(`Enter the text content for "${textSprite.name}" (e.g., WILD, BONUS, FREE):`)?.toUpperCase().trim() || '';
        if (!textContent) return;
      }
    }

    if (!textContent) {
      console.error('Could not determine text content');
      return;
    }

    console.log(`🔤 Extracting individual letters from "${textContent}" text...`);
    setIsSpriteProcessing(true);

    try {
      const { enhancedOpenaiClient } = await import('../../../utils/enhancedOpenaiClient');
      const letters = textContent.split('');
      const newSprites = [];

      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        if (letter.trim() === '') continue; // Skip spaces
        
        console.log(`🔤 Extracting letter: ${letter} (${i + 1}/${letters.length})`);

        const letterPrompt = `Extract and isolate the letter "${letter}" from the complete word "${textContent}" in slot game style.

QUALITY SPECIFICATIONS:
- Ultra-high resolution 4K quality finished graphics
- Professional game-ready artwork with crisp details
- Perfect edge definition and clean vector-style clarity
- Premium visual polish suitable for commercial slot games

EXTRACTION REQUIREMENTS:
- Extract only the letter "${letter}" (position ${i + 1} of ${letters.length} in the word "${textContent}")
- Maintain the exact same texture and styling as the complete text
- Transparent background
- Clean edges, properly cropped to just the letter bounds
- Preserve all visual effects (glow, shadows, metallic finish, etc.)
- High quality, detailed artwork matching the source text style
- Professional slot game typography

The result should be the letter "${letter}" cleanly extracted and isolated for individual animation with commercial-grade visual quality.`;

        try {
          const letterResult = await enhancedOpenaiClient.generateImageWithConfig({
            prompt: letterPrompt,
            count: 1,
            targetSymbolId: `sprite_extracted_letter_${letter}_${i}`,
            gameId: 'sprite_decomposition'
          });

          if (letterResult.success && letterResult.images && letterResult.images.length > 0) {
            newSprites.push({
              name: `letter_${letter}_${i}`,
              imageUrl: letterResult.images[0],
              element: {
                name: `letter_${letter}_${i}`,
                description: `Letter ${letter} extracted from ${textContent} text`,
                position: { x: 20 + (i * 15), y: 70 }, // Spread letters across bottom
                size: { width: 10, height: 15 },
                zIndex: 5
              }
            });
            console.log(`✅ Extracted letter: ${letter}`);
          }
        } catch (letterError) {
          console.error(`Failed to extract letter ${letter}:`, letterError);
        }

        // Small delay between extractions
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Update sprite decomposition with extracted letters
      if (newSprites.length > 0) {
        setSpriteDecomposition(prev => {
          if (!prev) return prev;
          
          // Remove existing individual letters and add new extracted ones
          const filteredSprites = prev.generatedSprites.filter(s => !s.name.startsWith('letter_'));
          
          return {
            ...prev,
            generatedSprites: [...filteredSprites, ...newSprites]
          };
        });
        
        console.log(`✅ Extracted ${newSprites.length} letters from "${textContent}" text`);
      }

    } catch (error) {
      console.error(`Failed to extract letters from ${textContent}:`, error);
      onError(`Failed to extract letters from ${textContent}: ${error}`);
    } finally {
      setIsSpriteProcessing(false);
    }
  }, [spriteDecomposition, onError]);

  // Extract quoted text from user prompts
  const extractQuotedText = (prompt: string): string => {
    // Look for text in quotes: 'text' or "text"
    const singleQuoteMatch = prompt.match(/'([^']+)'/);
    const doubleQuoteMatch = prompt.match(/"([^"]+)"/);
    
    if (singleQuoteMatch) return singleQuoteMatch[1].toUpperCase();
    if (doubleQuoteMatch) return doubleQuoteMatch[1].toUpperCase();
    
    // Fallback: look for common slot text patterns
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('wild')) return 'WILD';
    if (lowerPrompt.includes('scatter')) return 'SCATTER';
    if (lowerPrompt.includes('bonus')) return 'BONUS';
    if (lowerPrompt.includes('free')) return 'FREE';
    if (lowerPrompt.includes('spin')) return 'SPIN';
    
    // Default fallback
    return 'WILD';
  };

  // Generate symbol from text prompt
  const generateSymbolFromPrompt = useCallback(async () => {
    if (!textPrompt.trim()) {
      onError('Please enter a description for your symbol');
      return;
    }

    console.log('🎨 Starting text-to-sprite generation...');
    setIsGenerating(true);
    setIsSpriteProcessing(true);

    try {
      const { enhancedOpenaiClient } = await import('../../../utils/enhancedOpenaiClient');
      
      // Extract the actual text to generate from the prompt
      const extractedText = extractQuotedText(textPrompt);
      console.log(`🔤 Extracted text for generation: "${extractedText}" from prompt: "${textPrompt}"`);
      
      // Smart asset separation analysis for animation-ready poses
      const getAnimationReadyInstructions = (prompt: string): string => {
        const lowerPrompt = prompt.toLowerCase();
        let instructions = [];
        
        // Character with object instructions
        if (lowerPrompt.includes('with bone')) {
          instructions.push('🐕 Generate dog WITHOUT bone but with mouth positioned to hold bone');
          instructions.push('🦴 Generate separate bone asset that can be placed in dog\'s mouth');
        } else if (lowerPrompt.includes('with sword')) {
          instructions.push('⚔️ Generate character WITHOUT sword but with hand positioned to hold weapon');
          instructions.push('🗡️ Generate separate sword asset that can be placed in hand');
        } else if (lowerPrompt.includes('holding') || lowerPrompt.includes('with ')) {
          instructions.push('👤 Generate main character in holding pose but WITHOUT the held object');
          instructions.push('📦 Generate the held object as separate asset for animation placement');
        }
        
        // Character pose instructions
        if (lowerPrompt.includes('knight') || lowerPrompt.includes('warrior')) {
          instructions.push('🛡️ Generate armor and weapons as separate pieces when possible');
        }
        
        return instructions.length > 0 
          ? `\n🎬 ANIMATION-READY ASSET SEPARATION:\n${instructions.map(i => `- ${i}`).join('\n')}\n`
          : '';
      };
      
      const animationInstructions = getAnimationReadyInstructions(textPrompt);
      console.log(`🎬 Animation instructions: ${animationInstructions || 'None needed'}`);
      
      
      // Style-specific prompt additions
      const stylePrompts = {
        'fantasy-slot': 'medieval fantasy style with ornate details, magical effects, and rich textures',
        'egyptian-slot': 'ancient Egyptian style with hieroglyphs, gold accents, and desert themes',
        'modern-slot': 'sleek modern style with clean lines, vibrant colors, and contemporary design',
        'pirate-slot': 'pirate adventure style with weathered textures, nautical elements, and treasure themes',
        'space-slot': 'futuristic space style with neon effects, tech elements, and cosmic themes',
        'animated-cartoon': 'vibrant 3D animated style with rounded forms, expressive characters, warm lighting, and stylized proportions reminiscent of high-quality animated films',
        'tactical-card': 'detailed digital card game artwork with rich colors, dramatic lighting, fantasy elements, and polished illustration style typical of premium trading card games'
      };

      // Format specifications
      const formatSpecs = {
        'square': '768x768 pixels, square format perfect for slot symbols',
        'portrait': '768x960 pixels, portrait format for tall symbols',
        'landscape': '960x768 pixels, landscape format for wide symbols'
      };

      // NEW DIRECT SPRITE SHEET GENERATION APPROACH
      // FORCE individual letters for proper animation
      const forceIndividualLetters = true;
      const actualTextLayout = forceIndividualLetters ? 'individual' : textLayout;
      
      console.log(`🔧 Debug: forceIndividualLetters = ${forceIndividualLetters}, textLayout = "${textLayout}", actualTextLayout = "${actualTextLayout}"`);
      
      console.log(`🎨 Generating organized sprite sheet with ${actualTextLayout} text layout (forced: ${forceIndividualLetters})...`);
      
      const spriteSheetPrompt = `Create an organized SPRITE SHEET for "${textPrompt}" slot game symbol.

STYLE: ${stylePrompts[selectedStyle]}
FORMAT: ${formatSpecs[selectedFormat]}
${animationInstructions}
TEXT LAYOUT SPECIFICATION:
${actualTextLayout === 'individual' 
  ? `📝 ULTRA-CRITICAL: GENERATE MAXIMUM SEPARATION BETWEEN LETTERS
- ABSOLUTELY FORBIDDEN: "${extractedText}" as one word
- MANDATORY: Generate individual letters: ${extractedText.split('').map(l => `"${l}"`).join(', ')}
- MASSIVE SPACING: "${extractedText.split('').join('                    ')}" (20+ spaces between each letter)
- Each letter gets EXCLUSIVE 12% of image width (${Math.round(100/extractedText.length)}% each) with 3% gaps
- MINIMUM 80px buffer zone around each letter (COMPLETELY ISOLATED - no other content allowed)
- Letters must be MASSIVELY FAR APART like they are completely separate images
- Distribution: ${extractedText.split('').map((l, i) => `${l}(${i*14 + 2}%-${(i+1)*12 + 2}%)`).join(' | ')}
- SPACING EXAMPLE: ${extractedText.split('').join('[___HUGE_GAP___]')}
- RESULT: ${extractedText.length} COMPLETELY ISOLATED letter sprites, each in its own zone for independent animation`
  : `- Any text elements should be generated as COMPLETE WORDS/BLOCKS
- Text should appear as unified elements for word-level animations
- Example: "${extractedText}" should appear as a single "${extractedText}" text block
- Maintain text readability and visual impact as complete units`
}

SPRITE SHEET LAYOUT REQUIREMENTS:
- Create 3-5 SEPARATE sprites arranged in a clear grid layout
- Each sprite should be COMPLETELY ISOLATED with generous space between them
- CRITICAL POSITIONING for ${actualTextLayout === 'individual' ? 'widely spaced individual letters' : 'complete word'}:
  ${actualTextLayout === 'individual' 
    ? `* TEXT AREA (TOP): Place MASSIVELY SPACED individual "${extractedText}" letters across the entire top 30% of image
    * Each letter (${extractedText.split('').join(', ')}) must be in its own EXCLUSIVE zone with MASSIVE gaps
    * Letters should span with HUGE SEPARATION: ${extractedText.split('').join('[__MASSIVE_GAP__]')}
    * Each letter zone should be COMPLETELY ISOLATED - NO overlapping, touching, or proximity
    * ABSOLUTELY NO other sprites should overlap or come anywhere near the text area
    * CRITICAL: If generating "${extractedText}", ensure ALL ${extractedText.length} letters (including duplicate letters like double T in SCATTER) are included`
    : `* TEXT AREA (TOP): Place complete "${extractedText}" text in top 20% area`
  }
- Include these sprite types with EXACT positioning:
  * Main character/object (center-left area, below text)
  * Accessory/weapon/tool (top-right corner, below text area)
  * Background effect/aura (bottom area, largest sprite)
  * Additional detail element (right side, small sprite)

POSITIONING RULES:
${actualTextLayout === 'individual' 
  ? `- Individual Letter Zones: Top 0-30% divided into ${extractedText.length} EXCLUSIVE sections with gaps
  * Letter "${extractedText[0]}" zone: Top-left (2-14% horizontally, 0-30% vertically) - ISOLATED
  * Letter "${extractedText[1] || 'X'}" zone: Top-left-center (16-28% horizontally, 0-30% vertically) - ISOLATED
  * Continue pattern for all ${extractedText.length} letters with 2% gaps between zones
  * ENSURE ALL ${extractedText.length} letters of "${extractedText}" are positioned (including duplicate letters)
- Character area: Left-center 35-80% (well below letters with 5% gap)
- Accessory area: Right-center 35-70% (well below letters with 5% gap)  
- Effect area: Bottom 60-100% (maximum separation from letters)
- CRITICAL: Each letter must be in its own exclusive zone with MASSIVE gaps - NO overlap or proximity`
  : `- Text area: Top 0-20% (completely clear of other sprites)
- Character area: Left-center 20-80% 
- Accessory area: Right-top 20-60%
- Effect area: Bottom 60-100%`
}
- ABSOLUTELY NO overlapping between any sprites

QUALITY SPECIFICATIONS:
- Ultra-high resolution 4K quality finished graphics
- Professional game-ready artwork with crisp details
- Perfect edge definition and clean vector-style clarity
- Premium visual polish suitable for commercial slot games
- Consistent art style across ALL sprites
- Rich color depth and sophisticated lighting

CRITICAL SPRITE REQUIREMENTS:
- Each sprite must be COMPLETELY ISOLATED from others
- Clear spacing between sprites for easy separation
- Transparent background for each sprite
- Consistent lighting and art style across all elements
- Professional slot game quality
- Ready for immediate animation use

LAYOUT EXAMPLE:
${actualTextLayout === 'individual' 
  ? `[${extractedText.split('').join('] [')}]
[Main Character] [Accessory] [Effect]
[Detail Element]`
  : `[Accessory] [Text Element]
[Main Character] [Effect]
[Detail Element]`
}

The result should be a clean sprite sheet with separated elements, NOT a complete assembled symbol.`;

      // Generate the sprite sheet directly
      const spriteSheetResult = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: spriteSheetPrompt,
        count: 1,
        targetSymbolId: `sprite_sheet_${Date.now()}`,
        gameId: 'animation_lab_sprite_sheet'
      });

      if (!spriteSheetResult.success || !spriteSheetResult.images || spriteSheetResult.images.length === 0) {
        throw new Error(`Failed to generate sprite sheet: ${spriteSheetResult.error || 'No images generated'}`);
      }

      console.log('✅ Sprite sheet generated, analyzing layout...');

      // Convert the sprite sheet to a File object for coordinate-based extraction
      const blob = await dataURLtoBlob(spriteSheetResult.images[0]);
      const spriteSheetFile = new File([blob], `sprite_sheet.png`, { type: 'image/png' });

      // PROFESSIONAL APPROACH: Analyze coordinates with enhanced context
      const { analyzeImageLayers } = await import('../../../utils/gptVisionClient');
      let layerAnalysis = await analyzeImageLayers(
        spriteSheetResult.images[0], 
        spriteSheetFile,
        {
          textLayout: actualTextLayout, // Use forced individual layout
          originalPrompt: textPrompt,
          expectedText: extractedText,
          analysisContext: 'individual_letter_sprite_sheet'
        }
      );

      console.log('📍 Sprite sheet coordinate analysis complete');

      // BORDER DETECTION FOR PRECISE LETTER CUTTING - Enhanced approach for spaced text
      if (textLayout === 'individual') {
        console.log('🔤 Checking if individual letters were properly detected...');
        
        // Count detected text sprites and check if they look like individual letters
        const textSprites = layerAnalysis.layers.filter(layer => 
          layer.name.toLowerCase().includes('text') || 
          layer.name.toLowerCase().includes('letter') ||
          layer.name.length === 1 ||
          ['w', 'i', 'l', 'd', 's', 'c', 'a', 't', 'e', 'r'].includes(layer.name.toLowerCase())
        );
        
        console.log(`🔍 Found ${textSprites.length} potential text/letter sprites from GPT-4 Vision`);
        
        // GPT-4 Vision handles letter detection for professional atlas
        console.log(`✅ GPT-4 Vision detected ${textSprites.length} letter elements for professional atlas`);
        
        console.log(`🏭 Using professional atlas approach - individual letter cutting not needed`);
      }

      // Create professional sprite atlas data structure
      const spriteAtlas = {
        atlasImage: spriteSheetResult.images[0], // Keep original sprite sheet
        atlasFile: spriteSheetFile,
        metadata: {
          width: 768,
          height: 768,
          format: 'sprite_sheet',
          generatedAt: new Date().toISOString(),
          source: 'text_generation',
          textLayout: textLayout,
          originalPrompt: textPrompt
        },
        sprites: layerAnalysis.layers.map(layer => ({
          name: layer.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          description: layer.description,
          bounds: {
            x: layer.bounds.x, // percentage coordinates
            y: layer.bounds.y,
            width: layer.bounds.width,
            height: layer.bounds.height
          },
          zIndex: layer.zIndex,
          animationPotential: layer.animationPotential || 'medium'
        })),
        animations: layerAnalysis.recommendedAnimations || []
      };

      // PROFESSIONAL SPRITE ATLAS GENERATION (Industry Standard)
      console.log(`🏭 Creating professional sprite atlas from ${layerAnalysis.layers.length} detected elements...`);
      
      // Convert layer analysis to professional sprite elements
      const spriteElements = layerAnalysis.layers.map(layer => ({
        name: layer.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        description: layer.description,
        bounds: layer.bounds, // Keep as percentage coordinates
        zIndex: layer.zIndex,
        animationPotential: layer.animationPotential as 'high' | 'medium' | 'low',
        type: mapLayerTypeToSpriteType(layer.type || 'object')
      }));
      
      // Create professional atlas using PIXEL-PERFECT bounding box detection
      console.log('🎯 Using pixel-perfect bounding box detection for industry-standard accuracy...');
      const { professionalSpriteAtlas } = await import('../../../utils/professionalSpriteAtlas');
      const atlasResult = await professionalSpriteAtlas.createAtlasWithPixelPerfectBounds(
        spriteSheetResult.images[0], // Original sprite sheet as atlas
        {
          alphaThreshold: 50,
          minSpriteSize: 100,
          maxSprites: 15,
          mergeDistance: 3,
          useGPTLabeling: false
        }
      );
      
      if (!atlasResult.success) {
        throw new Error(`Professional atlas creation failed: ${atlasResult.error}`);
      }
      
      console.log(`✅ Professional sprite atlas created with ${Object.keys(atlasResult.atlasMetadata.frames).length} sprite definitions`);
      
      // Store professional atlas result
      setSpriteDecomposition({
        success: true,
        elements: spriteElements.map(element => ({
          name: element.name,
          description: element.description,
          position: { x: element.bounds.x, y: element.bounds.y },
          size: { width: element.bounds.width, height: element.bounds.height },
          zIndex: element.zIndex
        })),
        originalDimensions: { width: 768, height: 768 },
        generatedSprites: [], // No individual sprites - using professional atlas
        professionalAtlas: atlasResult, // NEW: Professional atlas system
        visionPositioning: {
          canvasSize: { width: 500, height: 400 },
          spritePositions: layerAnalysis.layers.map(layer => ({
            name: layer.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            position: { 
              x: (layer.bounds.x / 100) * 500, 
              y: (layer.bounds.y / 100) * 400 
            },
            size: { 
              width: (layer.bounds.width / 100) * 500, 
              height: (layer.bounds.height / 100) * 400 
            },
            scale: 1,
            zIndex: layer.zIndex
          }))
        }
      });
      
      console.log(`🎭 Professional sprite atlas created with ${layerAnalysis.layers.length} sprite regions!`);
      
      // Switch back to upload tab to show results
      setCreationMode('upload');
      
      // Clear the form
      setTextPrompt('');

    } catch (error) {
      console.error('Text-to-sprite generation failed:', error);
      onError(`Symbol generation failed: ${error}`);
    } finally {
      setIsGenerating(false);
      setIsSpriteProcessing(false);
    }
  }, [textPrompt, selectedStyle, selectedFormat, onError]);

  /**
   * Handle sprite animation selection (simple transform animations)
   */
  const handleSpriteAnimationSelect = useCallback((spriteName: string, animationType: string) => {
    console.log(`🎭 Selected ${animationType} animation for ${spriteName}`);
    // For simple transform animations, we don't need to expand the atlas
    // Just store the animation preference
  }, []);

  /**
   * Handle frame sequence generation for complex animations
   */
  const handleFrameSequenceGeneration = useCallback(async (spriteName: string, animationType: string) => {
    if (!spriteDecomposition?.spriteAtlas) return;
    
    try {
      setExpandingSprite(spriteName);
      console.log(`🎬 Generating frame sequence for ${spriteName} - ${animationType}`);
      
      // Find the sprite in the atlas
      const sprite = spriteDecomposition.spriteAtlas.sprites.find(s => s.name === spriteName);
      if (!sprite) {
        throw new Error(`Sprite ${spriteName} not found in atlas`);
      }
      
      // Generate frame sequence based on animation type
      const { generateAnimationFrameSequence, expandSpriteAtlas } = await import('../../../utils/expandableAtlas');
      
      const frameSequence = await generateAnimationFrameSequence(
        spriteDecomposition.spriteAtlas,
        sprite,
        animationType
      );
      
      if (frameSequence.success) {
        // Expand the atlas to include new frames
        const expandedAtlas = await expandSpriteAtlas(
          spriteDecomposition.spriteAtlas,
          frameSequence.frames,
          spriteName,
          animationType
        );
        
        // Update the sprite decomposition with expanded atlas
        setSpriteDecomposition(prev => ({
          ...prev!,
          spriteAtlas: expandedAtlas
        }));
        
        console.log(`✅ Atlas expanded with ${frameSequence.frames.length} animation frames for ${spriteName}`);
      } else {
        throw new Error(frameSequence.error || 'Frame sequence generation failed');
      }
      
    } catch (error) {
      console.error(`Failed to generate frame sequence for ${spriteName}:`, error);
      onError(`Animation generation failed: ${error}`);
    } finally {
      setExpandingSprite(null);
    }
  }, [spriteDecomposition, onError]);


  // Live Animation Preview Component
  const LiveAnimationPreview = ({ spriteAtlas, style }: { 
    spriteAtlas: any, 
    style: React.CSSProperties 
  }) => {
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
      if (!spriteAtlas || !previewCanvasRef.current) return;

      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load the sprite atlas image
      const atlasImage = new Image();
      atlasImage.crossOrigin = 'anonymous';
      
      atlasImage.onload = () => {
        // Start animation loop
        const animate = () => {
          const currentTime = Date.now();
          const elapsed = (currentTime - startTimeRef.current) / 1000; // seconds

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw each sprite with animation
          spriteAtlas.sprites.forEach((sprite: any, index: number) => {
            drawAnimatedSprite(ctx, atlasImage, sprite, elapsed, index, canvas);
          });

          animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();
      };

      atlasImage.src = spriteAtlas.atlasImage;

      // Cleanup
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [spriteAtlas]);

    const drawAnimatedSprite = (
      ctx: CanvasRenderingContext2D,
      atlasImage: HTMLImageElement,
      sprite: any,
      elapsed: number,
      index: number,
      canvas: HTMLCanvasElement
    ) => {
      // Calculate sprite source coordinates (from atlas)
      const sourceX = (sprite.bounds.x / 100) * atlasImage.width;
      const sourceY = (sprite.bounds.y / 100) * atlasImage.height;
      const sourceWidth = (sprite.bounds.width / 100) * atlasImage.width;
      const sourceHeight = (sprite.bounds.height / 100) * atlasImage.height;

      // Calculate animation parameters
      const phaseOffset = index * 0.5; // Offset animations
      const time = elapsed + phaseOffset;

      // Base position in preview canvas
      const baseX = (sprite.bounds.x / 100) * canvas.width;
      const baseY = (sprite.bounds.y / 100) * canvas.height;
      const displayWidth = (sprite.bounds.width / 100) * canvas.width;
      const displayHeight = (sprite.bounds.height / 100) * canvas.height;

      // Apply default animations based on sprite type
      let transformX = baseX;
      let transformY = baseY;
      let rotation = 0;
      let scaleX = 1;
      let scaleY = 1;
      let alpha = 1;

      // Animate based on sprite name/type
      if (sprite.name.includes('letter') || sprite.name.length === 1) {
        // Individual letter animations
        const bounce = Math.sin(time * 3 + index) * 10;
        transformY = baseY + bounce;
        rotation = Math.sin(time * 2 + index) * 0.1;
        scaleX = scaleY = 1 + Math.sin(time * 4 + index) * 0.1;
      } else if (sprite.name.includes('text') || sprite.name.includes('scatter') || sprite.name.includes('wild')) {
        // Text block animations
        const glow = (Math.sin(time * 2) + 1) / 2;
        alpha = 0.8 + glow * 0.2;
        scaleX = scaleY = 1 + Math.sin(time * 2) * 0.05;
      } else if (sprite.name.includes('hat') || sprite.name.includes('accessory')) {
        // Accessory animations
        rotation = Math.sin(time * 1.5) * 0.15;
        const sway = Math.sin(time * 2) * 5;
        transformX = baseX + sway;
      } else if (sprite.name.includes('pig') || sprite.name.includes('character') || sprite.name.includes('body')) {
        // Character breathing animation
        scaleX = 1 + Math.sin(time * 1.2) * 0.03;
        scaleY = 1 + Math.sin(time * 1.2) * 0.02;
      } else if (sprite.name.includes('effect') || sprite.name.includes('glow') || sprite.name.includes('aura')) {
        // Effect animations
        alpha = 0.5 + Math.sin(time * 3) * 0.3;
        scaleX = scaleY = 1 + Math.sin(time * 2.5) * 0.2;
        rotation = time * 0.5;
      } else {
        // Default gentle animation
        const float = Math.sin(time * 1.5 + index) * 3;
        transformY = baseY + float;
      }

      // Apply transformations
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Move to sprite center for rotation
      const centerX = transformX + displayWidth / 2;
      const centerY = transformY + displayHeight / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      ctx.scale(scaleX, scaleY);

      // Draw sprite from atlas
      ctx.drawImage(
        atlasImage,
        sourceX, sourceY, sourceWidth, sourceHeight,
        -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight
      );

      ctx.restore();
    };

    return (
      <canvas
        ref={previewCanvasRef}
        width={600}
        height={400}
        style={style}
      />
    );
  };

  // Define animation types that require frame sequences vs simple transforms
  const getAnimationTypes = (spriteType: string) => {
    const allAnimations = {
      transform: [
        { type: 'bounce', label: '⬆️ Bounce', description: 'Simple up/down movement' },
        { type: 'glow', label: '✨ Glow', description: 'Glowing effect' },
        { type: 'pulse', label: '💓 Pulse', description: 'Scale pulsing' },
        { type: 'float', label: '☁️ Float', description: 'Gentle floating motion' },
        { type: 'rotate', label: '🔄 Rotate', description: 'Simple rotation' }
      ],
      frameSequence: [
        { type: 'spin', label: '🌪️ Spin', description: 'Complex spinning with shape changes' },
        { type: 'wiggle', label: '🎭 Wiggle', description: 'Animated wiggling motion' },
        { type: 'wave', label: '🌊 Wave', description: 'Wave-like motion' },
        { type: 'breathe', label: '💨 Breathe', description: 'Breathing animation' },
        { type: 'celebrate', label: '🎉 Celebrate', description: 'Celebration animation' }
      ]
    };
    
    // Filter based on sprite type
    if (spriteType === 'character') {
      return {
        transform: allAnimations.transform,
        frameSequence: allAnimations.frameSequence.filter(a => ['wiggle', 'breathe', 'celebrate'].includes(a.type))
      };
    } else if (spriteType === 'accessory') {
      return {
        transform: allAnimations.transform,
        frameSequence: allAnimations.frameSequence.filter(a => ['spin', 'wiggle', 'wave'].includes(a.type))
      };
    } else {
      return {
        transform: allAnimations.transform.slice(0, 3), // Basic animations for other types
        frameSequence: allAnimations.frameSequence.slice(0, 2)
      };
    }
  };

  /**
   * Monitor asset count changes to trigger loading
   */
  useEffect(() => {
    const assets = assetManager.getAllMetadata();
    const newCount = assets.length;
    
    console.log('🔍 Asset count check:', { 
      oldCount: assetCount,
      newCount,
      currentAsset,
      assets: assets.map(a => ({ id: a.id, name: a.name }))
    });
    
    setAssetCount(newCount);
    
    // Load first asset if we have assets but no current asset
    if (newCount > 0 && !currentAsset) {
      console.log('📥 Loading first asset:', assets[0].id);
      loadAssetImage(assets[0].id);
    }
    // If current asset no longer exists, load the first available
    else if (newCount > 0 && currentAsset) {
      const assetExists = assets.some(a => a.id === currentAsset);
      if (!assetExists) {
        console.log('🔄 Current asset no longer exists, loading new one');
        loadAssetImage(assets[0].id);
      }
    }
    // If no assets, clear current asset
    else if (newCount === 0 && currentAsset) {
      console.log('🗑️ No assets available, clearing current asset');
      setCurrentAsset(null);
      setLoadedImage(null);
    }
  }, [assetManager, currentAsset, loadAssetImage, assetCount]);

  /**
   * Periodic check for new assets (fallback)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const assets = assetManager.getAllMetadata();
      if (assets.length !== assetCount) {
        console.log('⏰ Periodic check found asset count change');
        setAssetCount(assets.length);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [assetManager, assetCount]);

  /**
   * Initialize GSAP when component mounts
   */
  useEffect(() => {
    initializeGSAP();
    
    return () => {
      if (animationManagerRef.current) {
        animationManagerRef.current.destroy();
      }
    };
  }, [initializeGSAP]);

  /**
   * Update GSAP animations when selections change
   */
  useEffect(() => {
    const currentAnimations = currentAsset ? selectedAnimations.get(currentAsset) : [];
    
    if (animationManagerRef.current) {
      const animations = currentAnimations || [];
      console.log('🔄 GSAP: Updating selected animations:', animations);
      animationManagerRef.current.updateAnimations(animations);
      setIsPlaying(animationManagerRef.current.getIsPlaying());
    }
  }, [selectedAnimations, currentAsset]);

  /**
   * Render image when it loads or animation state changes
   */
  useEffect(() => {
    renderImage();
  }, [renderImage, loadedImage, currentAsset, animationState]);

  /**
   * Render loop using requestAnimationFrame for smooth canvas updates
   */
  useEffect(() => {
    let animationFrame: number;
    
    const renderLoop = () => {
      // Only render if we have something to show and animations are playing
      if (loadedImage && currentAsset && (isPlaying || selectedAnimations.get(currentAsset)?.length)) {
        renderImage();
      }
      animationFrame = requestAnimationFrame(renderLoop);
    };
    
    // Only start render loop if we have content to render
    if (loadedImage && currentAsset) {
      renderLoop();
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [renderImage, loadedImage, currentAsset, isPlaying, selectedAnimations]);

  /**
   * Handle canvas resize
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const assets = assetManager.getAllMetadata();
  const hasAnimations = currentAsset && selectedAnimations.get(currentAsset)?.length;

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Header with Tab System */}
      <div style={{
        padding: '24px 32px',
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #f5f5f5',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          margin: '0 0 24px 0',
          fontSize: '28px',
          fontWeight: '700',
          color: '#1a1a1a',
          letterSpacing: '-0.5px'
        }}>
          🎨 Animation Lab
        </h2>
        
        {/* Creation Mode Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => setCreationMode('upload')}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: creationMode === 'upload' ? '#dc2626' : '#ffffff',
              color: creationMode === 'upload' ? '#ffffff' : '#6b7280',
              border: creationMode === 'upload' ? 'none' : '2px solid #e5e7eb',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: creationMode === 'upload' ? '0 4px 12px rgba(220, 38, 38, 0.3)' : 'none'
            }}
          >
            📁 Upload Image
          </button>
          <button
            onClick={() => setCreationMode('generate')}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: creationMode === 'generate' ? '#dc2626' : '#ffffff',
              color: creationMode === 'generate' ? '#ffffff' : '#6b7280',
              border: creationMode === 'generate' ? 'none' : '2px solid #e5e7eb',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: creationMode === 'generate' ? '0 4px 12px rgba(220, 38, 38, 0.3)' : 'none'
            }}
          >
            ✨ Generate from Text
          </button>
        </div>

        {/* Upload Mode Content */}
        {creationMode === 'upload' && (
          <div 
            onClick={handleUploadClick}
            style={{
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '16px',
              border: '2px dashed #d1d5db',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            <div style={{ textAlign: 'center' }}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              
              {/* Clickable folder icon */}
              <div 
                onClick={handleUploadClick}
                style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  cursor: 'pointer',
                  display: 'inline-block',
                  padding: '8px',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    backgroundColor: '#f3f4f6'
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >📁</div>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Upload Your Symbol Image
              </h3>
              <p style={{
                margin: '0 0 20px 0',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Click anywhere to browse files • PNG, JPG, WebP supported
              </p>
              
              {/* Asset Selection */}
              {assets.length > 0 && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginBottom: '16px' }}
                >
                  <select
                    value={currentAsset || ''}
                    onChange={(e) => loadAssetImage(e.target.value)}
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                      color: '#374151',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      minWidth: '200px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select an image...</option>
                    {assets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Text Layout Selection for Upload */}
              {currentAsset && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginBottom: '20px' }}
                >
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    🔤 Text Analysis Mode
                  </h4>
                  <div style={{ 
                    display: 'flex', 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '12px', 
                    padding: '4px', 
                    gap: '4px' 
                  }}>
                    <button 
                      onClick={() => setTextLayout('complete')}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: textLayout === 'complete' ? '#ffffff' : 'transparent',
                        color: textLayout === 'complete' ? '#dc2626' : '#6b7280',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: textLayout === 'complete' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      📝 Complete Words
                    </button>
                    <button 
                      onClick={() => setTextLayout('individual')}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: textLayout === 'individual' ? '#ffffff' : 'transparent',
                        color: textLayout === 'individual' ? '#dc2626' : '#6b7280',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: textLayout === 'individual' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      🔤 Individual Letters
                    </button>
                  </div>
                  <p style={{
                    margin: '8px 0 0 0',
                    fontSize: '12px',
                    color: '#9ca3af',
                    fontStyle: 'italic'
                  }}>
                    {textLayout === 'individual' 
                      ? 'Cut spaced words into individual letters for animation'
                      : 'Keep text as complete words for unified animations'
                    }
                  </p>
                </div>
              )}

              {/* Sprite IT Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpriteDecomposition();
                }}
                disabled={!currentAsset || isSpriteProcessing}
                style={{
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '700',
                  backgroundColor: (!currentAsset || isSpriteProcessing) ? '#d1d5db' : '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: (!currentAsset || isSpriteProcessing) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: (!currentAsset || isSpriteProcessing) ? 'none' : '0 4px 16px rgba(220, 38, 38, 0.4)',
                  transform: (!currentAsset || isSpriteProcessing) ? 'none' : 'translateY(-2px)'
                }}
                onMouseEnter={(e) => {
                  if (!isSpriteProcessing && currentAsset) {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(220, 38, 38, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSpriteProcessing && currentAsset) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 16px rgba(220, 38, 38, 0.4)';
                  }
                }}
                title="Decompose image into individual sprite elements for independent animation"
              >
                {isSpriteProcessing ? '🔄 Analyzing Image...' : '🎭 Create Animated Sprites'}
              </button>

              {currentAsset && !isSpriteProcessing && (
                <p style={{
                  margin: '12px 0 0 0',
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  AI will analyze your image and create individual animated sprites
                </p>
              )}
            </div>
          </div>
        )}

        {/* Generate Mode Content */}
        {creationMode === 'generate' && (
          <div style={{
            padding: '24px',
            backgroundColor: '#f9fafb',
            borderRadius: '16px',
            border: '2px solid #e5e7eb'
          }}>
            <div style={{ maxWidth: '600px' }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151'
              }}>
                ✨ Describe Your Symbol
              </h3>
              
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="e.g., Medieval knight with glowing sword and golden crown..."
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '16px',
                  fontSize: '16px',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />

              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginTop: '16px',
                marginBottom: '24px' 
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    🎨 Style
                  </label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                      color: '#374151',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="fantasy-slot">Fantasy Medieval</option>
                    <option value="egyptian-slot">Ancient Egyptian</option>
                    <option value="modern-slot">Modern Sleek</option>
                    <option value="pirate-slot">Pirate Adventure</option>
                    <option value="space-slot">Futuristic Space</option>
                    <option value="animated-cartoon">3D Animated Film</option>
                    <option value="tactical-card">Digital Card Game</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    📐 Format
                  </label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                      color: '#374151',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="square">Square (1:1)</option>
                    <option value="portrait">Portrait (4:5)</option>
                    <option value="landscape">Landscape (5:4)</option>
                  </select>
                </div>
              </div>

              {/* Text Layout Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  🔤 Text Layout (for any text elements in your symbol)
                </label>
                <div style={{
                  display: 'flex',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  padding: '4px',
                  gap: '4px'
                }}>
                  <button
                    type="button"
                    onClick={() => setTextLayout('complete')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: textLayout === 'complete' ? '#ffffff' : 'transparent',
                      color: textLayout === 'complete' ? '#dc2626' : '#6b7280',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: textLayout === 'complete' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                    title="Generate text as complete words (e.g., 'WILD' as one block)"
                  >
                    📝 Complete Words
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextLayout('individual')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: textLayout === 'individual' ? '#ffffff' : 'transparent',
                      color: textLayout === 'individual' ? '#dc2626' : '#6b7280',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: textLayout === 'individual' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                    title="Generate text as spaced individual letters (e.g., 'W I L D' for letter-by-letter animation)"
                  >
                    🔤 Individual Letters
                  </button>
                </div>
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>
                  {textLayout === 'complete' 
                    ? '📝 Text will be generated as complete words for unified animations'
                    : '🔤 Text will be generated as spaced letters for individual letter animations'
                  }
                </div>
              </div>

              <button
                onClick={generateSymbolFromPrompt}
                disabled={!textPrompt.trim() || isGenerating}
                style={{
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '700',
                  backgroundColor: (!textPrompt.trim() || isGenerating) ? '#d1d5db' : '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: (!textPrompt.trim() || isGenerating) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: (!textPrompt.trim() || isGenerating) ? 'none' : '0 4px 16px rgba(220, 38, 38, 0.4)',
                  transform: (!textPrompt.trim() || isGenerating) ? 'none' : 'translateY(-2px)'
                }}
                onMouseEnter={(e) => {
                  if (!isGenerating && textPrompt.trim()) {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(220, 38, 38, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGenerating && textPrompt.trim()) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 16px rgba(220, 38, 38, 0.4)';
                  }
                }}
              >
                {isGenerating ? '🎨 Generating Symbol...' : '✨ Generate & Create Sprites'}
              </button>

              {textPrompt.trim() && !isGenerating && (
                <p style={{
                  margin: '12px 0 0 0',
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  AI will create your symbol and automatically separate it into animated sprites
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        backgroundColor: '#f9fafb',
        minHeight: 0
      }}>
        
        {/* Canvas Section */}
        <div style={{
          flex: 1,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Animation Controls */}
          {hasAnimations && (
            <div style={{
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={isPlaying ? stopAnimation : startAnimation}
                  style={{
                    padding: '12px 20px',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: isPlaying ? '#dc2626' : '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>

                <button
                  onClick={resetAnimation}
                  style={{
                    padding: '12px 20px',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: '#6b7280',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🔄 Reset
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151' 
                  }}>
                    Speed:
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={animationSpeed}
                    onChange={(e) => updateSpeed(parseFloat(e.target.value))}
                    style={{
                      width: '100px',
                      cursor: 'pointer',
                      accentColor: '#dc2626'
                    }}
                  />
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#6b7280',
                    minWidth: '40px'
                  }}>
                    {animationSpeed.toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            style={{
              flex: 1,
              minHeight: '400px',
              backgroundColor: '#ffffff',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
        </div>
      </div>

      {/* Professional Atlas System (Industry Standard) */}
      {spriteDecomposition && spriteDecomposition.success && spriteDecomposition.professionalAtlas && (
        <React.Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading professional atlas...</div>}>
          {React.createElement(
            React.lazy(() => import('./ProfessionalAtlasPreview')),
            {
              atlasResult: spriteDecomposition.professionalAtlas,
              onExport: (format: string) => {
                console.log(`✅ Professional atlas exported in ${format} format`);
              },
              onUsePixelPerfectBounds: async () => {
                console.log('🎯 Applying pixel-perfect bounding box detection...');
                try {
                  const { professionalSpriteAtlas } = await import('../../../utils/professionalSpriteAtlas');
                  
                  const pixelPerfectAtlas = await professionalSpriteAtlas.createAtlasWithPixelPerfectBounds(
                    spriteDecomposition.professionalAtlas!.atlasImageUrl,
                    {
                      alphaThreshold: 50,
                      minSpriteSize: 100,
                      maxSprites: 15,
                      mergeDistance: 3,
                      useGPTLabeling: false
                    }
                  );
                  
                  if (pixelPerfectAtlas.success) {
                    // Update the sprite decomposition with pixel-perfect bounds
                    setSpriteDecomposition(prev => ({
                      ...prev!,
                      professionalAtlas: pixelPerfectAtlas
                    }));
                    console.log(`✅ Updated atlas with pixel-perfect bounds: ${pixelPerfectAtlas.spriteElements.length} sprites`);
                  }
                } catch (error) {
                  console.error('❌ Pixel-perfect bounds update failed:', error);
                  onError(`Pixel-perfect detection failed: ${error}`);
                }
              }
            }
          )}
        </React.Suspense>
      )}

      {/* Legacy Sprite Atlas Results */}
      {spriteDecomposition && spriteDecomposition.success && spriteDecomposition.spriteAtlas && !spriteDecomposition.professionalAtlas && (
        <div style={{
          padding: '32px',
          backgroundColor: '#ffffff',
          borderTop: '2px solid #f5f5f5'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ 
              margin: '0', 
              fontSize: '24px', 
              fontWeight: '700',
              color: '#1a1a1a',
              letterSpacing: '-0.5px'
            }}>
              🎨 Professional Sprite Atlas ({spriteDecomposition.spriteAtlas.sprites.length} sprites)
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  // Export sprite atlas as JSON + WebP
                  const atlasData = {
                    metadata: spriteDecomposition.spriteAtlas!.metadata,
                    sprites: spriteDecomposition.spriteAtlas!.sprites,
                    animations: spriteDecomposition.spriteAtlas!.animations
                  };
                  
                  // Download JSON file
                  const jsonBlob = new Blob([JSON.stringify(atlasData, null, 2)], { type: 'application/json' });
                  const jsonUrl = URL.createObjectURL(jsonBlob);
                  const jsonLink = document.createElement('a');
                  jsonLink.href = jsonUrl;
                  jsonLink.download = `sprite_atlas_${Date.now()}.json`;
                  jsonLink.click();
                  
                  // Download WebP image
                  const imageLink = document.createElement('a');
                  imageLink.href = spriteDecomposition.spriteAtlas!.atlasImage;
                  imageLink.download = `sprite_atlas_${Date.now()}.webp`;
                  imageLink.click();
                  
                  console.log('📦 Exported professional sprite atlas');
                }}
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                }}
              >
                📦 Export Atlas
              </button>
            </div>
          </div>
          
          {/* Live Animation Preview */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              🎬 Live Animation Preview
            </h4>
            <LiveAnimationPreview 
              spriteAtlas={spriteDecomposition.spriteAtlas}
              style={{
                width: '100%',
                maxWidth: '600px',
                height: '400px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: '#f9fafb',
                marginBottom: '24px'
              }}
            />
          </div>

          {/* Sprite Atlas Preview with Coordinate Overlays */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              🖼️ Sprite Sheet Preview
            </h4>
            <div style={{
              position: 'relative',
              display: 'inline-block',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#f9fafb'
            }}>
              <img
                src={spriteDecomposition.spriteAtlas.atlasImage}
                alt="Sprite Atlas"
                style={{
                  maxWidth: '600px',
                  height: 'auto',
                  display: 'block'
                }}
              />
              
              {/* Coordinate Overlays */}
              {spriteDecomposition.spriteAtlas.sprites.map((sprite, index) => {
                const imgElement = document.querySelector('img[alt="Sprite Atlas"]') as HTMLImageElement;
                const displayWidth = imgElement?.clientWidth || 600;
                const displayHeight = imgElement?.clientHeight || 600;
                
                return (
                  <div
                    key={sprite.name}
                    style={{
                      position: 'absolute',
                      left: `${sprite.bounds.x}%`,
                      top: `${sprite.bounds.y}%`,
                      width: `${sprite.bounds.width}%`,
                      height: `${sprite.bounds.height}%`,
                      border: '2px solid #dc2626',
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      pointerEvents: 'none',
                      zIndex: sprite.zIndex
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '-24px',
                      left: '0',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}>
                      {sprite.name.replace(/_/g, ' ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Interactive Sprite Animation Selection */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              🎭 Sprite Animation Selection
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {spriteDecomposition.spriteAtlas.sprites.map((sprite, index) => {
                const animations = getAnimationTypes(sprite.animationPotential);
                const isExpanding = expandingSprite === sprite.name;
                
                return (
                  <div key={sprite.name} style={{
                    padding: '20px',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {/* Sprite Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '12px',
                        marginRight: '16px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {/* Sprite Preview */}
                        <div style={{
                          position: 'absolute',
                          left: `-${sprite.bounds.x}%`,
                          top: `-${sprite.bounds.y}%`,
                          width: `${100 * (100 / sprite.bounds.width)}%`,
                          height: `${100 * (100 / sprite.bounds.height)}%`
                        }}>
                          <img
                            src={spriteDecomposition.spriteAtlas.atlasImage}
                            alt={sprite.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#1a1a1a',
                          marginBottom: '4px'
                        }}>
                          {sprite.name.replace(/_/g, ' ')}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          {sprite.description}
                        </div>
                      </div>
                    </div>

                    {/* Transform Animations */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        🎮 Transform Animations
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {animations.transform.map(anim => (
                          <button
                            key={anim.type}
                            onClick={() => handleSpriteAnimationSelect(sprite.name, anim.type)}
                            style={{
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            title={anim.description}
                          >
                            {anim.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frame Sequence Animations */}
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        🎬 Frame Sequence Animations
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {animations.frameSequence.map(anim => (
                          <button
                            key={anim.type}
                            onClick={() => handleFrameSequenceGeneration(sprite.name, anim.type)}
                            disabled={isExpanding}
                            style={{
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: isExpanding ? '#f9fafb' : '#fef3c7',
                              color: isExpanding ? '#9ca3af' : '#92400e',
                              border: '2px solid #fde68a',
                              borderRadius: '8px',
                              cursor: isExpanding ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              opacity: isExpanding ? 0.6 : 1
                            }}
                            title={isExpanding ? 'Generating frames...' : anim.description}
                          >
                            {isExpanding ? '⏳' : anim.label}
                          </button>
                        ))}
                      </div>
                      {isExpanding && (
                        <div style={{
                          marginTop: '8px',
                          fontSize: '11px',
                          color: '#f59e0b',
                          fontWeight: '600'
                        }}>
                          🎬 Generating animation frames and expanding atlas...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Legacy Sprite Decomposition Results (for upload mode) */}
      {spriteDecomposition && spriteDecomposition.success && spriteDecomposition.generatedSprites.length > 0 && (
        <div style={{
          padding: '32px',
          backgroundColor: '#ffffff',
          borderTop: '2px solid #f5f5f5'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ 
              margin: '0', 
              fontSize: '24px', 
              fontWeight: '700',
              color: '#1a1a1a',
              letterSpacing: '-0.5px'
            }}>
              🎭 Animation Elements ({spriteDecomposition.generatedSprites.length})
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* Dynamic Text Extraction Button - shows only when text elements are detected */}
              {(() => {
                const textSprites = spriteDecomposition.generatedSprites.filter(sprite => 
                  sprite.name.toLowerCase().includes('text') || 
                  sprite.name.toLowerCase().includes('wild') ||
                  sprite.name.toLowerCase().includes('bonus') ||
                  sprite.name.toLowerCase().includes('free') ||
                  sprite.element.description.toLowerCase().includes('text') ||
                  sprite.element.description.toLowerCase().includes('letter') ||
                  sprite.element.description.toLowerCase().includes('word')
                );
                
                if (textSprites.length === 0) return null;

                return textSprites.map((textSprite, index) => (
                  <button
                    key={index}
                    onClick={() => extractTextLetters(textSprite)}
                    disabled={isSpriteProcessing}
                    style={{
                      padding: '12px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: isSpriteProcessing ? '#6b7280' : '#f59e0b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: isSpriteProcessing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSpriteProcessing ? 'none' : '0 2px 4px rgba(245, 158, 11, 0.3)'
                    }}
                    title={`Extract individual letters from "${textSprite.name}"`}
                  >
                    {isSpriteProcessing ? '🔄 Processing...' : `🔤 Extract "${textSprite.name.replace(/_/g, ' ').replace(/text|complete/gi, '').trim()}" Letters`}
                  </button>
                ));
              })()}

              <button
                onClick={() => {
                  // Download all sprites
                  spriteDecomposition.generatedSprites.forEach((sprite, index) => {
                    setTimeout(() => {
                      const link = document.createElement('a');
                      link.href = sprite.imageUrl;
                      link.download = `${sprite.name}.png`;
                      link.style.display = 'none';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }, index * 200); // Stagger downloads
                  });
                  console.log(`📥 Downloaded all ${spriteDecomposition.generatedSprites.length} sprites`);
                }}
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                }}
                title="Download all sprites at once"
              >
                📦 Download All
              </button>
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {spriteDecomposition.generatedSprites.map((sprite, index) => (
              <div key={index} style={{
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '2px solid #f3f4f6',
                textAlign: 'center',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                e.currentTarget.style.borderColor = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = '#f3f4f6';
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  backgroundColor: '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <img
                    src={sprite.imageUrl}
                    alt={sprite.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      console.error(`Failed to load sprite image: ${sprite.name}`);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div style={{ 
                  fontWeight: '700', 
                  fontSize: '16px',
                  color: '#1a1a1a',
                  textTransform: 'capitalize',
                  marginBottom: '8px'
                }}>
                  {sprite.name.replace(/_/g, ' ')}
                </div>
                <div style={{ 
                  color: '#6b7280', 
                  fontSize: '12px',
                  marginBottom: '8px',
                  lineHeight: '1.4'
                }}>
                  {sprite.element.description}
                </div>
                
                {/* Extraction Method Indicator */}
                {sprite.extractionMethod && (
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: sprite.extractionMethod === 'coordinate-based' ? '#dcfce7' : '#fef3c7',
                    color: sprite.extractionMethod === 'coordinate-based' ? '#166534' : '#92400e',
                    fontSize: '10px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    {sprite.extractionMethod === 'coordinate-based' ? '✂️ Extracted' : '🎨 Generated'}
                  </div>
                )}
                
                {/* Sprite Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px', 
                  marginTop: '16px' 
                }}>
                  <button
                    onClick={() => keepSprite(sprite)}
                    disabled={keptSprites.some(s => s.name === sprite.name)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: keptSprites.some(s => s.name === sprite.name) ? '#10b981' : '#0ea5e9',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: keptSprites.some(s => s.name === sprite.name) ? 'default' : 'pointer',
                      opacity: keptSprites.some(s => s.name === sprite.name) ? 0.8 : 1,
                      transition: 'all 0.2s ease',
                      boxShadow: keptSprites.some(s => s.name === sprite.name) ? 'none' : '0 2px 4px rgba(14, 165, 233, 0.3)'
                    }}
                    title={keptSprites.some(s => s.name === sprite.name) ? 'Already kept!' : `Keep this ${sprite.name}`}
                  >
                    {keptSprites.some(s => s.name === sprite.name) ? '✅ Kept' : '👍 Keep'}
                  </button>
                  
                  <button
                    onClick={() => regenerateSprite(sprite)}
                    disabled={regeneratingSprites.has(sprite.name)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: regeneratingSprites.has(sprite.name) ? '#6b7280' : '#f59e0b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: regeneratingSprites.has(sprite.name) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: regeneratingSprites.has(sprite.name) ? 'none' : '0 2px 4px rgba(245, 158, 11, 0.3)'
                    }}
                    title={`Regenerate ${sprite.name} with different style`}
                  >
                    {regeneratingSprites.has(sprite.name) ? '🔄...' : '🔄 Regen'}
                  </button>
                  
                </div>
              </div>
            ))}
          </div>
          

          <div style={{
            marginTop: '24px',
            padding: '16px 20px',
            backgroundColor: '#dbeafe',
            borderRadius: '12px',
            fontSize: '14px',
            color: '#1e40af',
            fontWeight: '600'
          }}>
            💡 <strong>Next:</strong> Individual sprites have been loaded into the asset manager. 
            You can now select each sprite in the Upload tab and apply different animations to create layered effects!
          </div>
        </div>
      )}

      {/* Kept Sprites Collection */}
      {keptSprites.length > 0 && (
        <div style={{
          padding: '32px',
          backgroundColor: '#ffffff',
          borderTop: '2px solid #f5f5f5'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ 
              margin: '0', 
              fontSize: '24px', 
              fontWeight: '700',
              color: '#1a1a1a',
              letterSpacing: '-0.5px'
            }}>
              ✅ Curated Collection ({keptSprites.length})
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAnimationComposer(true)}
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                }}
                title="Open Animation Composer to animate your kept sprites"
              >
                🎭 Animate Collection
              </button>

              <button
                onClick={() => {
                  // Download all kept sprites
                  keptSprites.forEach((sprite, index) => {
                    setTimeout(() => {
                      const link = document.createElement('a');
                      link.href = sprite.imageUrl;
                      link.download = `kept_${sprite.name}.png`;
                      link.style.display = 'none';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }, index * 200);
                  });
                  console.log(`📥 Downloaded all ${keptSprites.length} kept sprites`);
                }}
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                }}
              >
                📦 Download All Kept
              </button>
              <button
                onClick={() => {
                  setKeptSprites([]);
                  console.log('🧹 Cleared kept sprites collection');
                }}
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                }}
              >
                🗑️ Clear Collection
              </button>
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '16px'
          }}>
            {keptSprites.map((sprite, index) => (
              <div key={`${sprite.name}_${sprite.keptAt}`} style={{
                padding: '16px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '2px solid #10b981',
                textAlign: 'center',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <img
                    src={sprite.imageUrl}
                    alt={sprite.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <div style={{ 
                  fontWeight: '700', 
                  fontSize: '14px',
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>
                  {sprite.name.replace(/_/g, ' ')}
                </div>
                <button
                  onClick={() => {
                    setKeptSprites(prev => prev.filter(s => s.keptAt !== sprite.keptAt));
                    console.log(`🗑️ Removed ${sprite.name} from collection`);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title={`Remove ${sprite.name} from collection`}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
          
          <div style={{
            marginTop: '20px',
            padding: '16px 20px',
            backgroundColor: '#ecfdf5',
            borderRadius: '12px',
            fontSize: '14px',
            color: '#065f46',
            fontWeight: '600'
          }}>
            💡 <strong>Perfect!</strong> You've curated {keptSprites.length} high-quality sprites. 
            These are your final collection ready for animation!
          </div>
        </div>
      )}

      {/* Status */}
      <div style={{ 
        padding: '16px 32px',
        backgroundColor: '#f3f4f6',
        borderTop: '1px solid #e5e7eb',
        fontSize: '14px',
        color: '#6b7280',
        textAlign: 'center',
        fontWeight: '500'
      }}>
        {!currentAsset && 'No asset loaded'}
        {currentAsset && !hasAnimations && !spriteDecomposition && 'Select animations in Preview tab'}
        {currentAsset && hasAnimations && !spriteDecomposition && `${selectedAnimations.get(currentAsset)?.length} animations selected`}
        {spriteDecomposition && spriteDecomposition.success && (
          <span style={{ color: '#10b981', fontWeight: '600' }}>
            {spriteDecomposition.spriteAtlas 
              ? `🎨 Professional sprite atlas ready: ${spriteDecomposition.spriteAtlas.sprites.length} sprites`
              : `✅ Sprite decomposition complete: ${spriteDecomposition.generatedSprites.length} elements`
            }
          </span>
        )}
        {isSpriteProcessing && (
          <span style={{ color: '#f59e0b', fontWeight: '600' }}>
            {creationMode === 'generate' 
              ? `🎨 Generating sprite sheet (${textLayout === 'individual' ? 'spaced letters' : 'complete words'})...` 
              : '🔄 Analyzing image for sprite elements...'
            }
          </span>
        )}
      </div>

      {/* Animation Composer Modal */}
      {showAnimationComposer && keptSprites.length > 0 && (
        <AnimationComposer
          keptSprites={keptSprites}
          onClose={() => setShowAnimationComposer(false)}
          visionPositioning={spriteDecomposition?.visionPositioning}
        />
      )}
    </div>
  );
};

export default SimpleAnimationCanvas;