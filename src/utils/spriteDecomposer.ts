/**
 * Sprite Decomposition System using GPT-4o Vision
 * Analyzes 2D images and creates sprite sheets with separated elements
 */

import { enhancedOpenaiClient } from './enhancedOpenaiClient';
import { analyzeImageLayers } from './gptVisionClient';
import { extractLettersManually, detectExpectedText, ManualLetterExtractionResult } from './manualLetterExtractor';

// Use existing working vision client instead of creating new OpenAI instance

export interface SpriteElement {
  name: string;
  description: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

export interface GeneratedSprite {
  name: string;
  imageUrl: string;
  element: SpriteElement;
  // New professional extraction properties
  thumbnail?: string;
  extractionMethod?: 'coordinate-based' | 'regeneration';
  originalBounds?: { x: number; y: number; width: number; height: number };
}

export interface SpriteAtlas {
  atlasImage: string; // Base64 data URL of the complete sprite sheet
  atlasFile: File; // File object for reference
  metadata: {
    width: number;
    height: number;
    format: string;
    generatedAt: string;
    source: string;
  };
  sprites: Array<{
    name: string;
    description: string;
    bounds: {
      x: number; // percentage coordinates
      y: number;
      width: number;
      height: number;
    };
    zIndex: number;
    animationPotential: string;
    frameSequence?: {
      parentSprite: string;
      animationType: string;
      frameNumber: number;
      totalFrames: number;
    };
  }>;
  animations: Array<{
    layerId: string;
    animationType: string;
    description: string;
  }>;
}

export interface SpriteDecompositionResult {
  success: boolean;
  elements: SpriteElement[];
  originalDimensions: { width: number; height: number };
  generatedSprites: GeneratedSprite[];
  spriteAtlas?: SpriteAtlas; // Legacy sprite atlas data
  professionalAtlas?: import('./professionalSpriteAtlas').ProfessionalAtlasResult; // NEW: Industry-standard atlas
  visionPositioning?: {
    canvasSize: { width: number; height: number };
    spritePositions: Array<{
      name: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      scale: number;
      zIndex: number;
    }>;
  };
  error?: string;
}

export class SpriteDecomposer {
  
  /**
   * Enhanced analyze image with vision-powered positioning
   */
  async analyzeImageForSprites(imageFile: File, textLayout: 'complete' | 'individual' = 'complete', userText?: string): Promise<{
    elements: SpriteElement[];
    analysis: string;
    originalDimensions: { width: number; height: number };
    visionPositioning?: {
      canvasSize: { width: number; height: number };
      spritePositions: Array<{
        name: string;
        position: { x: number; y: number };
        size: { width: number; height: number };
        scale: number;
        zIndex: number;
      }>;
    };
  }> {
    try {
      // Convert file to base64
      const imageBase64 = await this.fileToBase64(imageFile);
      
      // Get image dimensions
      const dimensions = await this.getImageDimensions(imageFile);
      
      // Use enhanced vision analysis for precise positioning
      let layerAnalysis = await analyzeImageLayers(imageBase64, imageFile, {
        textLayout,
        analysisContext: 'uploaded_image_analysis'
      });

      // MANUAL LETTER EXTRACTION FALLBACK for uploaded images
      console.log(`🔧 Debug: textLayout parameter = "${textLayout}"`);
      if (textLayout === 'individual') {
        console.log('🔤 Checking if individual letters were properly detected in uploaded image...');
        
        // Count detected text sprites and check if they look like individual letters
        const textSprites = layerAnalysis.layers.filter(layer => 
          layer.name.toLowerCase().includes('text') || 
          layer.name.toLowerCase().includes('letter') ||
          layer.name.length === 1 ||
          ['w', 'i', 'l', 'd', 's', 'c', 'a', 't', 'e', 'r'].includes(layer.name.toLowerCase())
        );
        
        console.log(`🔍 Found ${textSprites.length} potential text/letter sprites from GPT-4 Vision`);
        
        // Check if we have actual individual letters (not just generic "text")
        const actualLetters = textSprites.filter(layer => 
          layer.name.length === 1 || 
          ['w', 'i', 'l', 'd', 's', 'c', 'a', 't', 'e', 'r'].includes(layer.name.toLowerCase())
        );
        
        console.log(`🔤 Found ${actualLetters.length} actual individual letters`);
        
        // Apply professional letter derivation system for consistent styling
        // Always use derivation for individual letters to ensure perfect quality
        console.log('🎨 Applying professional letter derivation system for consistent styling...');
        
        try {
          // Import letter derivation system
          const { letterDerivationSystem } = await import('./letterDerivationSystem');
          
          // Detect the text content from the image
          let detectedText = '';
          
          // First try to get text from existing layer description
          const textLayer = layerAnalysis.layers.find(layer => 
            layer.type === 'text' || layer.name.toLowerCase().includes('text')
          );
          
          if (textLayer) {
            const description = textLayer.description.toLowerCase();
            // Common slot game text patterns
            if (description.includes('wild')) detectedText = 'WILD';
            else if (description.includes('scatter')) detectedText = 'SCATTER';
            else if (description.includes('bonus')) detectedText = 'BONUS';
            else if (description.includes('free')) detectedText = 'FREE';
            else if (description.includes('spin')) detectedText = 'SPIN';
          }
          
          // Fallback to manual detection
          if (!detectedText) {
            const { detectExpectedText } = await import('./manualLetterExtractor');
            detectedText = await detectExpectedText(imageBase64) || 'WILD';
          }
          
          console.log(`🎯 Text detected for derivation: ${detectedText}`);
          
          // Analyze the style of the detected text
          const styleAnalysis = await letterDerivationSystem.analyzeTextStyle(imageBase64, detectedText);
          
          // Generate consistent letter series using derivation
          const derivationResult = await letterDerivationSystem.generateLetterSeries(
            detectedText,
            styleAnalysis,
            'slot_game'
          );
          
          if (derivationResult.confidence > 0.8 && derivationResult.letters.length > 0) {
            console.log(`✅ Derivation system generated ${derivationResult.letters.length} consistent letters`);
            
            // Convert derivation results to layer format
            const derivedLayers = derivationResult.letters.map((letter, index) => ({
              id: `derived_letter_${index}`,
              name: letter.letter,
              type: 'text' as const,
              bounds: {
                x: 20 + (index * 20), // Distribute letters horizontally
                y: 80, // Position at bottom
                width: 15,
                height: 15
              },
              attachmentPoint: { x: 27.5 + (index * 20), y: 87.5 },
              contourPoints: [],
              zIndex: 10,
              animationPotential: 'high' as const,
              description: `Letter ${letter.letter} derived with consistent styling`
            }));
            
            // Remove existing text sprites and add derived letters
            const nonTextLayers = layerAnalysis.layers.filter(layer => 
              !layer.name.toLowerCase().includes('text') && 
              !layer.name.toLowerCase().includes('letter') &&
              layer.name.length > 1
            );
            
            layerAnalysis = {
              ...layerAnalysis,
              layers: [...nonTextLayers, ...derivedLayers],
              description: layerAnalysis.description + ` (Enhanced with professional ${detectedText} letter derivation)`
            };
            
            // Store derivation result for later use
            (layerAnalysis as any).derivationResult = derivationResult;
            console.log(`🔍 Debug: Stored derivationResult with ${derivationResult.letters.length} letters`);
            
            console.log(`🔄 Updated layer analysis with professionally derived ${detectedText} letters`);
          }
        } catch (derivationError) {
          console.error('❌ Letter derivation failed for uploaded image:', derivationError);
          // Fallback to keep GPT-4 Vision detected letters if derivation fails
          console.log('🔄 Keeping GPT-4 Vision detected letters as fallback...');
        }
      }

      // Convert layer analysis to sprite elements with enhanced positioning
      const elements: SpriteElement[] = layerAnalysis.layers.map((layer, index) => ({
        name: layer.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        description: layer.description || layer.name,
        position: {
          x: layer.bounds.x,
          y: layer.bounds.y
        },
        size: {
          width: layer.bounds.width,
          height: layer.bounds.height
        },
        zIndex: layer.zIndex
      }));

      // Create vision-powered positioning for animation canvas
      const canvasSize = { width: 500, height: 400 }; // Animation canvas size
      const spritePositions = elements.map(element => {
        // Convert percentage coordinates to canvas coordinates
        const canvasX = (element.position.x / 100) * canvasSize.width;
        const canvasY = (element.position.y / 100) * canvasSize.height;
        
        // Calculate appropriate scale based on original size vs canvas
        const originalWidth = (element.size.width / 100) * dimensions.width;
        const originalHeight = (element.size.height / 100) * dimensions.height;
        const targetSize = 80; // Standard sprite display size
        const scale = Math.min(targetSize / originalWidth, targetSize / originalHeight, 2.0);
        
        return {
          name: element.name,
          position: { x: canvasX, y: canvasY },
          size: { 
            width: originalWidth * scale, 
            height: originalHeight * scale 
          },
          scale: scale,
          zIndex: element.zIndex
        };
      });

      // Create return object and preserve derivation result
      const result = {
        elements,
        analysis: `🎯 Vision Analysis: Detected ${elements.length} decomposable elements with precise positioning: ${elements.map(e => e.name).join(', ')}`,
        originalDimensions: dimensions,
        visionPositioning: {
          canvasSize,
          spritePositions
        }
      };
      
      // Preserve derivation result if it exists
      if ((layerAnalysis as any).derivationResult) {
        (result as any).derivationResult = (layerAnalysis as any).derivationResult;
        console.log(`🔍 Debug: Passing derivationResult through to final result`);
      }
      
      return result;

    } catch (error) {
      console.error('Failed to analyze image for sprites:', error);
      throw new Error(`Sprite analysis failed: ${error}`);
    }
  }

  /**
   * Generate individual sprite images for each element
   */
  async generateSpriteElements(
    originalImageFile: File,
    elements: SpriteElement[],
    originalDimensions: { width: number; height: number },
    userText?: string
  ): Promise<Array<{ name: string; imageUrl: string; element: SpriteElement }>> {
    // Use the existing working enhanced OpenAI client directly

    const results = [];
    
    // Convert original to base64 for reference
    const originalBase64 = await this.fileToBase64(originalImageFile);
    
    // Check if we have individual letters detected - if so, generate complete text first
    const targetText = userText || 'WILD'; // Default to WILD if no user text provided
    const expectedLetters = targetText.toLowerCase().split('');
    const hasIndividualLetters = elements.some(e => 
      expectedLetters.includes(e.name.toLowerCase()) || 
      e.name.toLowerCase().includes('letter')
    );
    
    if (hasIndividualLetters) {
      console.log(`🔤 Individual ${targetText} letters detected, generating complete ${targetText} text first...`);
      
      try {
        const completeTextPrompt = `Create the complete word "${targetText}" in fantasy slot game style.

REQUIREMENTS:
- Complete word "${targetText}" as it appears in slot games
- Golden metallic texture with ornate fantasy styling
- High resolution for clean letter extraction
- Transparent background
- Professional slot game typography
- Letters should be evenly spaced for clean cutting
- High quality, detailed artwork

The result should be the complete "${targetText}" text ready for individual letter extraction.`;

        const completeTextResult = await enhancedOpenaiClient.generateImageWithConfig({
          prompt: completeTextPrompt,
          count: 1,
          targetSymbolId: `sprite_complete_${targetText.toLowerCase()}_text`,
          gameId: 'sprite_decomposition'
        });

        if (completeTextResult.success && completeTextResult.images && completeTextResult.images.length > 0) {
          results.push({
            name: `complete_${targetText.toLowerCase()}_text`,
            imageUrl: completeTextResult.images[0],
            element: {
              name: `complete_${targetText.toLowerCase()}_text`,
              description: `Complete ${targetText} text for letter extraction`,
              position: { x: 30, y: 70 },
              size: { width: 40, height: 15 },
              zIndex: 5
            },
            extractionMethod: 'regeneration'
          });
          console.log(`✅ Generated complete ${targetText} text as foundation`);
        }
      } catch (completeTextError) {
        console.error(`Failed to generate complete ${targetText} text:`, completeTextError);
      }
    }

    for (const element of elements) {
      try {
        console.log(`🎨 Generating sprite for: ${element.name} (${element.description})`);
        
        // Skip individual letters if they were detected - we'll use complete text extraction instead
        if (expectedLetters.includes(element.name.toLowerCase()) || 
            element.name.toLowerCase().includes('letter')) {
          console.log(`⏭️ Skipping individual letter ${element.name} - will extract from complete ${targetText} text instead`);
          continue;
        }
        
        // Create a detailed prompt for generating the sprite element
        const spritePrompt = `Create a professional fantasy ${element.name} sprite for slot game animation.

DESIGN SPECIFICATIONS:
- ${element.name === 'sword' ? 'Medieval fantasy sword with ornate blade and decorated hilt' : ''}
- ${element.name === 'head' ? 'Knight or warrior head with medieval helmet and crown details' : ''}
- ${element.name === 'body' ? 'Armored knight torso with detailed chest plate and medieval styling' : ''}
- ${element.name === 'stone' ? 'Ancient stone pedestal or base with weathered medieval texture' : ''}
- ${element.name === 'magical_aura' || element.name.includes('aura') ? 'Glowing magical energy effect with sparkles and mystical aura' : ''}
- ${!['sword', 'head', 'body', 'stone'].includes(element.name) ? `Fantasy ${element.name} element with medieval game styling` : ''}

TECHNICAL REQUIREMENTS:
- High quality detailed artwork suitable for professional slot games
- Completely transparent background (PNG format)
- Clean edges and perfect isolation from background
- Professional game asset quality with rich details
- Centered composition optimized for animation use

ARTISTIC STYLE:
- Fantasy medieval theme with rich colors and metallic textures
- High contrast lighting with dramatic shadows
- Premium slot game visual quality
- Detailed textures and professional polish

The result should be a standalone ${element.name} sprite ready for animation assembly.`;
        
        // Enhanced handling for text elements - generate complete word then slice
        const textToGenerate = userText || 'WILD'; // Use user text or default to WILD
        if ((element.name === 'text' || element.name.includes('text') || element.name.toLowerCase().includes(textToGenerate.toLowerCase())) && 
            (element.description.toLowerCase().includes(textToGenerate.toLowerCase()) || element.name.toLowerCase().includes(textToGenerate.toLowerCase()))) {
          console.log(`🔤 Generating complete ${textToGenerate} text for consistent slicing...`);
          
          // First generate the complete text
          const completeTextPrompt = `Create the complete word "${textToGenerate}" in fantasy slot game style.

REQUIREMENTS:
- Complete word "${textToGenerate}" as it appears in the original image
- Golden metallic texture with ornate fantasy styling
- High resolution for clean letter extraction
- Transparent background
- Professional slot game typography
- Letters should be evenly spaced for clean cutting
- High quality, detailed artwork matching original style

The result should be the complete "${textToGenerate}" text ready for individual letter extraction.`;

          try {
            const completeTextResult = await enhancedOpenaiClient.generateImageWithConfig({
              prompt: completeTextPrompt,
              count: 1,
              targetSymbolId: `sprite_complete_${textToGenerate.toLowerCase()}_text`,
              gameId: 'sprite_decomposition'
            });

            if (completeTextResult.success && completeTextResult.images && completeTextResult.images.length > 0) {
              console.log(`✅ Generated complete ${textToGenerate} text, now extracting individual letters...`);
              
              // Add the complete text as a sprite option
              results.push({
                name: `complete_${textToGenerate.toLowerCase()}_text`,
                imageUrl: completeTextResult.images[0],
                element: {
                  ...element,
                  name: `complete_${textToGenerate.toLowerCase()}_text`,
                  description: `Complete ${textToGenerate} text for letter extraction`
                },
                extractionMethod: 'regeneration'
              });
              
              // Now generate individual letters with reference to the complete text
              const letters = textToGenerate.toUpperCase().split('');
              for (let i = 0; i < letters.length; i++) {
                const letter = letters[i];
                const letterPrompt = `Extract and isolate the letter "${letter}" from the word "${textToGenerate}" in fantasy slot game style.

REQUIREMENTS:
- Extract only the letter "${letter}" (${i + 1} of ${letters.length} letters)
- Maintain the same golden metallic texture and styling as the complete word
- Transparent background
- Clean edges, properly cropped to just the letter
- Same font style and effects as the original ${textToGenerate} text
- High quality, detailed artwork

The result should be just the letter "${letter}" cleanly extracted and isolated.`;

                try {
                  const letterResult = await enhancedOpenaiClient.generateImageWithConfig({
                    prompt: letterPrompt,
                    count: 1,
                    targetSymbolId: `sprite_letter_${letter}`,
                    gameId: 'sprite_decomposition'
                  });

                  if (letterResult.success && letterResult.images && letterResult.images.length > 0) {
                    results.push({
                      name: `letter_${letter}`,
                      imageUrl: letterResult.images[0],
                      element: {
                        ...element,
                        name: `letter_${letter}`,
                        description: `Letter ${letter} extracted from ${textToGenerate} text`
                      },
                      extractionMethod: 'regeneration'
                    });
                    console.log(`✅ Extracted letter: ${letter}`);
                  }
                } catch (letterError) {
                  console.error(`Failed to extract letter ${letter}:`, letterError);
                }
                
                // Small delay between letters
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          } catch (completeTextError) {
            console.error(`Failed to generate complete ${textToGenerate} text:`, completeTextError);
          }
          
          console.log(`✅ Completed ${textToGenerate} text processing with consistent letter extraction`);
          continue; // Skip the regular text sprite generation
        }

        console.log(`🎨 Using GPT-image-1 to generate sprite: ${element.name}`);
        const imageResult = await enhancedOpenaiClient.generateImageWithConfig({
          prompt: spritePrompt,
          count: 1,
          targetSymbolId: `sprite_${element.name}`,
          gameId: 'sprite_decomposition'
        });

        if (!imageResult.success || !imageResult.images || imageResult.images.length === 0) {
          throw new Error(`Failed to generate sprite for ${element.name}: ${imageResult.error || 'No images generated'}`);
        }

        const imageUrl = imageResult.images[0];

        results.push({
          name: element.name,
          imageUrl,
          element,
          extractionMethod: 'regeneration'
        });

        console.log(`✅ Generated sprite: ${element.name}`);
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Failed to generate sprite for ${element.name}:`, error);
        // Continue with other elements even if one fails
      }
    }
    
    return results;
  }

  /**
   * Complete sprite decomposition workflow using coordinate extraction
   */
  async decomposeImageToSprites(imageFile: File, textLayout: 'complete' | 'individual' = 'complete', userText?: string): Promise<SpriteDecompositionResult> {
    try {
      console.log('🔍 Starting coordinate-based sprite decomposition...');
      
      // Step 1: Analyze image for decomposable elements
      const analysis = await this.analyzeImageForSprites(imageFile, textLayout, userText);
      
      console.log(`📋 Found ${analysis.elements.length} decomposable elements:`, 
        analysis.elements.map(e => e.name));
      
      if (analysis.elements.length === 0) {
        return {
          success: false,
          elements: [],
          originalDimensions: analysis.originalDimensions,
          generatedSprites: [],
          error: 'No decomposable elements found in the image'
        };
      }
      
      // Step 2: Handle sprite extraction based on method
      let extractedSprites: GeneratedSprite[];
      
      // ALWAYS use derivation + regeneration approach for clean sprites
      const derivationResult = (analysis as any).derivationResult;
      console.log(`🔍 Debug: derivationResult exists = ${!!derivationResult}, textLayout = "${textLayout}"`);
      
      if (derivationResult && textLayout === 'individual') {
        console.log('🎨 Using derived letter images + regenerated sprites...');
        extractedSprites = await this.createSpritesFromDerivation(
          derivationResult,
          analysis.elements,
          imageFile,
          analysis.originalDimensions
        );
      } else {
        // Use regeneration method instead of coordinate extraction for clean sprites
        console.log('🎨 Regenerating all sprites for clean, isolated elements...');
        console.log(`🔍 Debug: Skipping derivation because derivationResult=${!!derivationResult}, textLayout="${textLayout}"`);
        extractedSprites = await this.generateSpriteElements(
          imageFile, 
          analysis.elements, 
          analysis.originalDimensions,
          userText
        );
      }
      
      // NEW: Create professional atlas with pixel-perfect bounds
      let professionalAtlas;
      try {
        console.log('🏭 Creating professional atlas with pixel-perfect bounding boxes...');
        const { professionalSpriteAtlas } = await import('./professionalSpriteAtlas');
        
        // Get the image URL for the file
        const imageUrl = URL.createObjectURL(imageFile);
        
        professionalAtlas = await professionalSpriteAtlas.createAtlasWithPixelPerfectBounds(
          imageUrl,
          {
            alphaThreshold: 50,
            minSpriteSize: 100,
            maxSprites: 15,
            mergeDistance: 3,
            useGPTLabeling: false
          }
        );
        
        // Clean up URL
        URL.revokeObjectURL(imageUrl);
        
        if (professionalAtlas.success) {
          console.log(`✅ Professional atlas created with ${professionalAtlas.spriteElements.length} pixel-perfect sprites`);
        }
      } catch (atlasError) {
        console.error('⚠️ Professional atlas creation failed, continuing with standard decomposition:', atlasError);
        professionalAtlas = null;
      }

      return {
        success: true,
        elements: analysis.elements,
        originalDimensions: analysis.originalDimensions,
        generatedSprites: extractedSprites,
        professionalAtlas: professionalAtlas && professionalAtlas.success ? professionalAtlas : undefined,
        visionPositioning: analysis.visionPositioning
      };
      
    } catch (error) {
      console.error('Sprite decomposition failed:', error);
      return {
        success: false,
        elements: [],
        originalDimensions: { width: 0, height: 0 },
        generatedSprites: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * LEGACY: Complete sprite decomposition workflow using regeneration
   * Keeping this as fallback option
   */
  async decomposeImageToSpritesLegacy(imageFile: File): Promise<SpriteDecompositionResult> {
    try {
      console.log('🔍 Starting legacy sprite decomposition analysis...');
      
      // Step 1: Analyze image for decomposable elements
      const analysis = await this.analyzeImageForSprites(imageFile);
      
      console.log(`📋 Found ${analysis.elements.length} decomposable elements:`, 
        analysis.elements.map(e => e.name));
      
      if (analysis.elements.length === 0) {
        return {
          success: false,
          elements: [],
          originalDimensions: analysis.originalDimensions,
          generatedSprites: [],
          error: 'No decomposable elements found in the image'
        };
      }
      
      // Step 2: Generate individual sprites (OLD METHOD)
      console.log('🎨 Generating individual sprite elements...');
      const generatedSprites = await this.generateSpriteElements(
        imageFile, 
        analysis.elements, 
        analysis.originalDimensions,
        userText
      );
      
      return {
        success: true,
        elements: analysis.elements,
        originalDimensions: analysis.originalDimensions,
        generatedSprites,
        visionPositioning: analysis.visionPositioning
      };
      
    } catch (error) {
      console.error('Sprite decomposition failed:', error);
      return {
        success: false,
        elements: [],
        originalDimensions: { width: 0, height: 0 },
        generatedSprites: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create sprites from derivation result (for consistent letters)
   */
  private async createSpritesFromDerivation(
    derivationResult: any,
    elements: SpriteElement[],
    originalImageFile: File,
    originalDimensions: { width: number; height: number }
  ): Promise<GeneratedSprite[]> {
    const sprites: GeneratedSprite[] = [];
    
    try {
      // First, handle derived letters
      for (const derivedLetter of derivationResult.letters) {
        const element = elements.find(e => e.name === derivedLetter.letter.toLowerCase());
        if (element) {
          sprites.push({
            name: element.name,
            imageUrl: derivedLetter.imageUrl,
            element: element,
            extractionMethod: 'derivation',
            thumbnail: derivedLetter.imageUrl, // Use the generated image as thumbnail
            originalBounds: {
              x: element.position.x,
              y: element.position.y,
              width: element.size.width,
              height: element.size.height
            }
          });
          console.log(`✅ Created sprite from derived letter: ${derivedLetter.letter}`);
        }
      }
      
      // Then, handle non-letter elements using regeneration for clean sprites
      const nonLetterElements = elements.filter(element => 
        !derivationResult.letters.some((letter: any) => letter.letter.toLowerCase() === element.name)
      );
      
      if (nonLetterElements.length > 0) {
        console.log(`🎨 Regenerating ${nonLetterElements.length} non-letter elements (sword, stone, etc.)...`);
        const regeneratedSprites = await this.generateSpriteElements(
          originalImageFile,
          nonLetterElements,
          originalDimensions,
          userText
        );
        sprites.push(...regeneratedSprites);
      }
      
      console.log(`🎨 Combined derivation result: ${sprites.length} total sprites`);
      return sprites;
      
    } catch (error) {
      console.error('Failed to create sprites from derivation:', error);
      throw error;
    }
  }

  /**
   * NEW PROFESSIONAL METHOD: Extract sprites using coordinate-based cropping
   * Much more efficient and accurate than regenerating sprites
   */
  private async extractSpritesUsingCoordinates(
    imageFile: File,
    elements: SpriteElement[],
    originalDimensions: { width: number; height: number }
  ): Promise<GeneratedSprite[]> {
    try {
      // Import the coordinate extractor
      const { coordinateExtractor, SpriteCoordinates } = await import('./coordinateExtractor');
      
      // Convert elements to coordinate format
      const coordinates: SpriteCoordinates[] = elements.map(element => ({
        name: element.name,
        bounds: {
          x: element.position.x,
          y: element.position.y,
          width: element.size.width,
          height: element.size.height
        },
        description: element.description,
        type: this.mapElementTypeToSpriteType(element.type || 'character'),
        zIndex: element.zIndex || 1
      }));

      console.log('📍 Converting elements to coordinates:', coordinates.length);

      // Validate coordinates
      const validation = coordinateExtractor.validateCoordinates(coordinates);
      if (!validation.valid) {
        console.warn('⚠️ Coordinate validation warnings:', validation.errors);
      }

      // Extract sprites using coordinate-based method
      const extractionResult = await coordinateExtractor.extractSpritesFromCoordinates(
        imageFile,
        coordinates
      );

      if (!extractionResult.success) {
        throw new Error(`Coordinate extraction failed: ${extractionResult.error}`);
      }

      console.log(`✅ Successfully extracted ${extractionResult.extractedSprites.length} sprites`);

      // Convert extraction results to GeneratedSprite format
      const generatedSprites: GeneratedSprite[] = extractionResult.extractedSprites.map(extracted => ({
        name: extracted.name,
        imageUrl: extracted.imageUrl,
        element: {
          name: extracted.name,
          description: extracted.coordinates.description,
          position: {
            x: extracted.coordinates.bounds.x,
            y: extracted.coordinates.bounds.y
          },
          size: {
            width: extracted.coordinates.bounds.width,
            height: extracted.coordinates.bounds.height
          },
          zIndex: extracted.coordinates.zIndex,
          type: extracted.coordinates.type
        },
        // Add thumbnail for UI display
        thumbnail: extracted.thumbnail,
        // Add extraction metadata
        extractionMethod: 'coordinate-based',
        originalBounds: extracted.originalBounds
      }));

      return generatedSprites;

    } catch (error) {
      console.error('❌ Coordinate-based extraction failed, falling back to legacy method:', error);
      
      // Fallback to the old regeneration method if coordinate extraction fails
      return this.generateSpriteElements(imageFile, elements, originalDimensions, userText);
    }
  }

  /**
   * Maps element types to sprite coordinate types
   */
  private mapElementTypeToSpriteType(elementType: string): 'character' | 'accessory' | 'text' | 'effect' | 'background' {
    const typeMap: Record<string, 'character' | 'accessory' | 'text' | 'effect' | 'background'> = {
      'character': 'character',
      'weapon': 'accessory',
      'armor': 'accessory',
      'accessory': 'accessory',
      'text': 'text',
      'effect': 'effect',
      'background': 'background',
      'magical': 'effect',
      'glow': 'effect'
    };

    return typeMap[elementType] || 'character';
  }

  // Helper methods
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getImageType(file: File): string {
    return file.type.split('/')[1] || 'png';
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}

export const spriteDecomposer = new SpriteDecomposer();