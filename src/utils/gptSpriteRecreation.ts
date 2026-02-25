// GPT-4 Vision Sprite Recreation System
// Professional multi-layer sprite generation using AI image understanding

export interface SpriteRecreationRequest {
  imageBase64: string;
  objectType?: string; // 'sword', 'character', 'armor', 'auto-detect'
  separationMode: 'auto' | 'guided' | 'custom';
  outputLayers: string[]; // e.g., ['sword', 'hand', 'body', 'background']
  stylePreservation: 'exact' | 'enhanced' | 'optimized';
  outputFormat: 'sprite' | 'layered' | 'both';
}

export interface SpriteLayer {
  id: string;
  name: string;
  description: string;
  imageBase64: string;
  svgContent?: string; // For SVG elements
  bounds: { x: number; y: number; width: number; height: number };
  zIndex: number;
  opacity: number;
  blendMode: string;
}

export interface SpriteRecreationResult {
  success: boolean;
  processingTime: number;
  totalCost: number;
  layers: SpriteLayer[];
  svgContent?: string; // Complete SVG with all elements
  originalAnalysis: string;
  recommendations: string[];
  qualityScore: number;
  debugInfo: {
    detectedObjects: string[];
    separationMethod: string;
    enhancementsApplied: string[];
    apiCalls: number;
  };
}

// Use the same API key as the main application
const OPENAI_API_KEY = "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";

// Import animation lab storage for saving SVG results
import { saveSymbolToAnimationLab, type AnimationLabSprite } from './animationLabStorage';

class GPTSpriteRecreator {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    // Use the same API key as the main application
    this.apiKey = OPENAI_API_KEY;
  }

  /**
   * Main sprite recreation method
   */
  async recreateAsSprites(request: SpriteRecreationRequest): Promise<SpriteRecreationResult> {
    console.log(`🎨 [GPT-SPRITE] Starting AI sprite recreation`);
    console.log(`🎯 [CONFIG] Mode: ${request.separationMode}, Layers: ${request.outputLayers.join(', ')}`);

    const startTime = performance.now();

    try {
      // Step 1: Analyze the image to understand objects and composition
      const analysis = await this.analyzeImageComposition(request.imageBase64, request.objectType);
      
      // Step 2: Generate separation strategy
      const strategy = this.generateSeparationStrategy(analysis, request);
      
      // Step 3: Generate single SVG with all elements using GPT-image-1
      const pngResult = await this.generatePNGRecreation(request.imageBase64, analysis, strategy);
      
      // Step 4: Extract individual elements from PNG sprite
      const layers = this.extractPNGElements(pngResult.imageContent);
      
      // Step 5: Validate and optimize results
      const validatedLayers = this.validateAndOptimizeLayers(layers);
      
      // Step 6: Save PNG to animation-lab folder
      const pngId = `png-recreation-${Date.now()}`;
      try {
        await this.savePNGToAnimationLab(pngResult.imageContent, validatedLayers, pngId, analysis);
        console.log(`🎨 [SAVE] PNG saved to animation lab as ${pngId}`);
      } catch (saveError) {
        console.warn(`🎨 [SAVE] Failed to save PNG to animation lab:`, saveError);
      }
      
      const processingTime = performance.now() - startTime;
      
      const result: SpriteRecreationResult = {
        success: true,
        processingTime,
        totalCost: this.calculateCost(layers.length),
        layers: validatedLayers,
        imageContent: pngResult.imageContent,
        originalAnalysis: analysis.description,
        recommendations: this.generateRecommendations(validatedLayers, analysis),
        qualityScore: this.calculateQualityScore(validatedLayers),
        debugInfo: {
          detectedObjects: analysis.objects,
          separationMethod: strategy.method,
          enhancementsApplied: strategy.enhancements,
          apiCalls: layers.length + 1 // 1 for analysis + 1 per layer
        }
      };

      console.log(`🎨 ✅ [GPT-SPRITE COMPLETE] ${layers.length} layers created in ${processingTime.toFixed(1)}ms`);
      return result;

    } catch (error) {
      console.error(`🎨 [GPT-SPRITE FAILED] Recreation error:`, error);
      
      return {
        success: false,
        processingTime: performance.now() - startTime,
        totalCost: 0,
        layers: [],
        originalAnalysis: '',
        recommendations: [`Recreation failed: ${error}`],
        qualityScore: 0,
        debugInfo: {
          detectedObjects: [],
          separationMethod: 'failed',
          enhancementsApplied: [],
          apiCalls: 0
        }
      };
    }
  }

  /**
   * Analyze image composition and objects
   */
  private async analyzeImageComposition(
    imageBase64: string, 
    objectType?: string
  ): Promise<{ description: string; objects: string[]; composition: any }> {
    
    console.log(`🔍 [ANALYZE] Analyzing image composition with GPT-4 Vision`);

    const analysisPrompt = `Analyze this fantasy game character image and identify all separable objects/layers for sprite creation.

Focus on identifying:
1. Main weapon/tool (sword, staff, bow, etc.)
2. Character body parts (head, torso, arms, legs)
3. Armor/clothing pieces (helmet, chest armor, gloves, boots)
4. Accessories (jewelry, belts, pouches)
5. Background elements

For each object, provide:
- Object name and type
- Approximate bounds/position
- Z-order (layering priority)
- Separation difficulty (easy/medium/hard)

Return a detailed analysis of what can be separated into individual sprite layers for animation purposes.`;

    try {
      const response = await this.callGPTVision(imageBase64, analysisPrompt);
      
      // Parse the response to extract structured data
      const objects = this.parseObjectsFromAnalysis(response);
      
      return {
        description: response,
        objects: objects,
        composition: {
          complexity: objects.length > 5 ? 'complex' : objects.length > 2 ? 'medium' : 'simple',
          mainObject: objects[0] || 'unknown',
          layerCount: objects.length
        }
      };

    } catch (error) {
      console.error(`🔍 [ANALYZE] Analysis failed:`, error);
      throw new Error(`Image analysis failed: ${error}`);
    }
  }

  /**
   * Generate separation strategy based on analysis
   */
  private generateSeparationStrategy(
    analysis: any, 
    request: SpriteRecreationRequest
  ): { method: string; enhancements: string[]; prompts: any[] } {
    
    console.log(`🧩 [STRATEGY] Generating separation strategy`);

    const strategy = {
      method: 'intelligent-recreation',
      enhancements: ['style-preservation', 'edge-cleanup', 'transparency-optimization'],
      prompts: []
    };

    // Generate specific prompts for each layer
    if (request.separationMode === 'auto') {
      // Auto-detect and separate common game object layers
      strategy.prompts = [
        this.createLayerPrompt('weapon', 'Extract and recreate only the weapon/tool with transparent background'),
        this.createLayerPrompt('character', 'Extract and recreate only the character body without weapon'),
        this.createLayerPrompt('background', 'Recreate only the background without character or weapon'),
        this.createLayerPrompt('effects', 'Extract any magical effects or glows as separate layer')
      ];
    } else if (request.outputLayers.length > 0) {
      // Use specified layers
      strategy.prompts = request.outputLayers.map(layer => 
        this.createLayerPrompt(layer, `Extract and recreate only the ${layer} as a sprite with transparent background`)
      );
    }

    return strategy;
  }

  /**
   * Generate single SVG recreation using GPT-image-1
   */
  private async generatePNGRecreation(
    imageBase64: string,
    analysis: any,
    strategy: any
  ): Promise<{ imageContent: string }> {
    
    console.log(`🎨 [PNG-RECREATION] Generating separated sprite PNG using GPT-image-1`);

    const pngPrompt = `Generate a PNG sprite image recreation of this character with all elements separated for animation.

STYLE: Match the exact visual style of the input image
FORMAT: PNG with transparent background
SIZE: 512x512 or larger
LAYOUT: Separate all elements spatially (character, weapons, armor, accessories)

Create a slot game sprite where each element can be animated independently.`;

    try {
      const imageContent = await this.callGPTImage1(imageBase64, pngPrompt);
      
      return {
        imageContent: imageContent
      };

    } catch (error) {
      console.error(`🎨 [PNG-RECREATION] Failed:`, error);
      throw error;
    }
  }

  /**
   * Call GPT-image-1 API for SVG generation using the correct Responses API format
   */
  private async callGPTImage1(imageBase64: string, prompt: string): Promise<string> {
    console.log(`🎨 [GPT-IMAGE-1] Calling image generation API with source image`);

    // Enhanced prompt specifically requesting SVG format
    const svgPrompt = `${prompt}

CRITICAL: Generate this as a complete SVG file format with clean XML structure. Return only the SVG code starting with <svg> and ending with </svg>.`;

    // Use the correct Responses API format with input images
    const payload = {
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: svgPrompt
            },
            {
              type: "input_image",
              image_url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
            }
          ]
        }
      ],
      tools: [{ type: "image_generation" }]
    };

    console.log(`🎨 [GPT-IMAGE-1] Using Responses API format with source image reference`);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'OpenAI-Organization': 'org-EbZLwKpoPUaLvuyhZJid8rUF'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🎨 [GPT-IMAGE-1] API Error:`, errorText);
      throw new Error(`GPT-image-1 API error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`🎨 [GPT-IMAGE-1] Raw API response:`, data);
    console.log(`🎨 [GPT-IMAGE-1] Response keys:`, Object.keys(data));
    console.log(`🎨 [GPT-IMAGE-1] Output array:`, data.output);
    console.log(`🎨 [GPT-IMAGE-1] Output length:`, data.output?.length);
    if (data.output && data.output.length > 0) {
      data.output.forEach((output: any, index: number) => {
        console.log(`🎨 [GPT-IMAGE-1] Output ${index}:`, output);
        console.log(`🎨 [GPT-IMAGE-1] Output ${index} type:`, output.type);
        console.log(`🎨 [GPT-IMAGE-1] Output ${index} keys:`, Object.keys(output));
      });
    }

    if (!data.output || data.output.length === 0) {
      throw new Error('No output data received from GPT-image-1 API');
    }

    // Find message output with content
    const messageOutput = data.output.find((output: any) => output.type === 'message');
    console.log(`🎨 [GPT-IMAGE-1] Found message output:`, messageOutput);
    
    if (!messageOutput || !messageOutput.content || messageOutput.content.length === 0) {
      throw new Error('No message content in API response');
    }
    
    console.log(`🎨 [GPT-IMAGE-1] Message content:`, messageOutput.content);
    
    // Debug content types only
    const contentTypes = messageOutput.content.map((content: any, index: number) => `${index}:${content.type}`);
    console.log(`🎨 [GPT-IMAGE-1] Content types:`, contentTypes.join(', '));
    
    // Check for output_text content but this should be image data, not SVG text
    const outputTextContent = messageOutput.content.find((content: any) => content.type === 'output_text');
    console.log(`🎨 [GPT-IMAGE-1] Found output_text content:`, outputTextContent);
    
    if (outputTextContent && outputTextContent.text) {
      console.log(`🎨 [GPT-IMAGE-1] Output text preview:`, outputTextContent.text.substring(0, 200) + '...');
      
      // This should be base64 image data, not SVG text
      const imageData = outputTextContent.text;
      
      // Check if it's base64 image data or actual SVG text
      if (imageData.startsWith('data:image/') || imageData.match(/^[A-Za-z0-9+/]+=*$/)) {
        console.log(`🎨 [GPT-IMAGE-1] Found base64 image data`);
        return imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
      } else if (imageData.includes('<svg')) {
        console.log(`🎨 [GPT-IMAGE-1] Found SVG text - converting to data URL`);
        return `data:image/svg+xml;base64,${btoa(imageData)}`;
      } else {
        console.log(`🎨 [GPT-IMAGE-1] Unknown text format - treating as base64`);
        return `data:image/png;base64,${imageData}`;
      }
    }
    
    // Fallback: Check for other text content types
    const textContent = messageOutput.content.find((content: any) => content.type === 'text');
    if (textContent && textContent.text) {
      console.log(`🎨 [GPT-IMAGE-1] Found fallback text content:`, textContent.text.substring(0, 200) + '...');
      return textContent.text;
    }
    
    // Find image generation within the content (backup)
    const imageContent = messageOutput.content.find((content: any) => 
      content.type === 'image_generation' || content.type === 'image'
    );
    console.log(`🎨 [GPT-IMAGE-1] Found image content:`, imageContent);
    
    if (!imageContent && !outputTextContent && !textContent) {
      throw new Error('No usable content found in message');
    }

    // The result should be base64 SVG data (if image content exists)
    if (imageContent) {
      const base64Data = imageContent.image_url || imageContent.data || imageContent.url;
      
      // Try to decode as SVG text, fallback to treating as image
      let svgContent: string;
      try {
        // Attempt to decode base64 as text (SVG)
        svgContent = atob(base64Data);
        
        // Validate it's actually SVG
        if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
          // If not SVG text, treat as image and return data URL
          svgContent = `data:image/svg+xml;base64,${base64Data}`;
        }
      } catch (error) {
        // If decoding fails, treat as image data
        svgContent = `data:image/svg+xml;base64,${base64Data}`;
      }
      
      console.log(`🎨 [GPT-IMAGE-1] Generated SVG (${svgContent.length} characters)`);
      
      // Store response ID for potential multi-turn generation
      if (data.id) {
        console.log(`🎨 [GPT-IMAGE-1] Storing response ID: ${data.id}`);
      }
      
      return svgContent;
    }
    
    throw new Error('No valid content found in API response');
  }

  /**
   * Extract individual elements from generated PNG sprite
   */
  private extractPNGElements(imageContent: string): SpriteLayer[] {
    console.log(`🎨 [PNG-EXTRACT] Creating sprite layer from PNG image`);
    
    const layers: SpriteLayer[] = [];
    
    try {
      // For PNG, we create a single layer representing the complete sprite
      // Individual element detection would require computer vision analysis
      layers.push({
        id: 'complete-sprite',
        name: 'Complete Sprite',
        description: 'Full PNG sprite with separated elements',
        imageBase64: imageContent,
        bounds: { x: 0, y: 0, width: 512, height: 512 },
        zIndex: 0,
        opacity: 1.0,
        blendMode: 'normal'
      });
      
      console.log(`🎨 [PNG-EXTRACT] Created PNG sprite layer for animation`);
      
    } catch (error) {
      console.error(`🎨 [PNG-EXTRACT] Failed to process PNG:`, error);
      // Return placeholder layer if processing fails
      layers.push({
        id: 'complete-sprite',
        name: 'Complete Sprite',
        description: 'Full PNG sprite with separated elements',
        imageBase64: imageContent,
        bounds: { x: 0, y: 0, width: 512, height: 512 },
        zIndex: 0,
        opacity: 1.0,
        blendMode: 'normal'
      });
    }
    
    return layers;
  }

  /**
   * Call GPT-4 Vision API
   */
  private async callGPTVision(imageBase64: string, prompt: string): Promise<string> {
    // API key is hardcoded, so no need to check

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
                } 
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`GPT-4 Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse objects from GPT analysis
   */
  private parseObjectsFromAnalysis(analysis: string): string[] {
    // Simple parsing - could be enhanced with more sophisticated NLP
    const objects: string[] = [];
    
    const commonObjects = ['sword', 'weapon', 'hand', 'arm', 'head', 'body', 'armor', 'helmet', 'shield', 'background', 'cloak', 'belt', 'boots'];
    
    for (const obj of commonObjects) {
      if (analysis.toLowerCase().includes(obj)) {
        objects.push(obj);
      }
    }
    
    return [...new Set(objects)]; // Remove duplicates
  }

  /**
   * Create layer prompt structure
   */
  private createLayerPrompt(name: string, prompt: string): any {
    return {
      name: name,
      prompt: prompt,
      description: `AI-generated ${name} sprite layer`
    };
  }

  /**
   * Create placeholder sprite (for development)
   */
  private createPlaceholderSprite(description: string): string {
    // Create a simple colored rectangle as placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    
    // Random color based on description
    const hash = description.length % 360;
    ctx.fillStyle = `hsl(${hash}, 60%, 50%)`;
    ctx.fillRect(50, 50, 100, 100);
    
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(description.substring(0, 20), 10, 30);
    
    return canvas.toDataURL();
  }

  /**
   * Validate and optimize generated layers
   */
  private validateAndOptimizeLayers(layers: SpriteLayer[]): SpriteLayer[] {
    // Basic validation and optimization
    return layers.filter(layer => {
      // Remove empty or invalid layers
      return layer.imageBase64 && layer.imageBase64.length > 100;
    });
  }

  /**
   * Calculate quality score based on layer results
   */
  private calculateQualityScore(layers: SpriteLayer[]): number {
    // Simple quality scoring
    const baseScore = 70;
    const layerBonus = Math.min(layers.length * 10, 30);
    return Math.min(100, baseScore + layerBonus);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(layers: SpriteLayer[], analysis: any): string[] {
    const recommendations: string[] = [];
    
    if (layers.length < 2) {
      recommendations.push("Consider separating more objects for better animation control");
    }
    
    if (layers.length > 6) {
      recommendations.push("Many layers detected - consider grouping related elements");
    }
    
    recommendations.push("Review each layer for transparency and edge quality");
    recommendations.push("Test layers together to ensure proper composition");
    
    return recommendations;
  }

  /**
   * Calculate estimated cost
   */
  private calculateCost(layerCount: number): number {
    // Estimated cost: $0.01-0.05 per GPT-4 Vision call
    const costPerCall = 0.03;
    return (layerCount + 1) * costPerCall; // +1 for analysis call
  }

  /**
   * Save SVG recreation to animation lab folder
   */
  private async savePNGToAnimationLab(
    imageContent: string, 
    layers: SpriteLayer[], 
    pngId: string, 
    analysis: any
  ): Promise<void> {
    try {
      console.log(`🎨 [SAVE] Saving PNG recreation to animation lab folder`);

      // Create animation lab sprite entry for the PNG
      const spriteData: AnimationLabSprite = {
        id: pngId,
        name: `PNG Recreation ${pngId}`,
        type: 'png-recreation',
        originalImageUrl: imageContent,
        components: layers.map(layer => ({
          name: layer.name,
          description: layer.description,
          bounds: layer.bounds,
          attachmentPoint: { x: layer.bounds.width / 2, y: layer.bounds.height / 2 }
        })),
        detectionResults: {
          method: 'gpt-vision-recreation',
          detectedObjects: analysis.objects,
          layerCount: layers.length,
          qualityScore: this.calculateQualityScore(layers),
          spriteElements: ['character', 'weapon', 'armor', 'accessories']
        },
        generatedAt: Date.now(),
        prompt: `GPT-Vision PNG Recreation: ${analysis.description.substring(0, 200)}`
      };

      // Import the storage utility
      const { saveSymbolToAnimationLab } = await import('./animationLabStorage');
      
      // Save the sprite data - use the PNG ID as both image URL and symbol ID
      await saveSymbolToAnimationLab(
        imageContent, 
        pngId, 
        spriteData.prompt, 
        spriteData.detectionResults
      );
      
      console.log(`🎨 [SAVE] PNG sprite saved successfully to animation lab`);

    } catch (error) {
      console.error(`🎨 [SAVE] Failed to save PNG to animation lab:`, error);
      throw error;
    }
  }

  private async saveSVGToAnimationLab(
    svgContent: string, 
    layers: SpriteLayer[], 
    svgId: string, 
    analysis: any
  ): Promise<void> {
    try {
      console.log(`🎨 [SAVE] Saving SVG recreation to animation lab folder`);

      // Create animation lab sprite entry for the SVG
      const spriteData: AnimationLabSprite = {
        id: svgId,
        name: `SVG Recreation ${svgId}`,
        type: 'svg-recreation',
        originalImageUrl: `data:image/svg+xml;base64,${btoa(svgContent)}`,
        components: layers.map(layer => ({
          name: layer.name,
          description: layer.description,
          bounds: layer.bounds,
          attachmentPoint: { x: layer.bounds.width / 2, y: layer.bounds.height / 2 }
        })),
        detectionResults: {
          method: 'gpt-vision-recreation',
          detectedObjects: analysis.objects,
          layerCount: layers.length,
          qualityScore: this.calculateQualityScore(layers),
          svgElementIds: layers.map(layer => layer.id)
        },
        generatedAt: Date.now(),
        prompt: `GPT-Vision SVG Recreation: ${analysis.description.substring(0, 200)}`
      };

      // Save to animation lab storage
      await saveSymbolToAnimationLab(
        spriteData.originalImageUrl,
        svgId,
        spriteData.prompt,
        spriteData.detectionResults
      );

      // Also save individual SVG elements as separate entries
      for (const layer of layers) {
        if (layer.svgContent) {
          const elementId = `${svgId}-${layer.id}`;
          const elementData = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${layer.svgContent}</svg>`)}`;
          
          await saveSymbolToAnimationLab(
            elementData,
            elementId,
            `SVG Element: ${layer.name}`,
            {
              parentSvg: svgId,
              elementType: layer.id,
              animationPotential: 'high'
            }
          );
        }
      }

      console.log(`🎨 [SAVE] ✅ SVG and ${layers.length} elements saved to animation lab`);

    } catch (error) {
      console.error(`🎨 [SAVE] Failed to save SVG to animation lab:`, error);
      throw error;
    }
  }

  /**
   * Set API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('openai_api_key', apiKey);
  }

  /**
   * Check if API key is available
   */
  hasApiKey(): boolean {
    return true; // We have a hardcoded API key
  }
}

// Export singleton instance
export const gptSpriteRecreator = new GPTSpriteRecreator();

// Export utility functions
export const recreateAsSprites = async (
  request: SpriteRecreationRequest
): Promise<SpriteRecreationResult> => {
  return gptSpriteRecreator.recreateAsSprites(request);
};

export const setGPTApiKey = (apiKey: string): void => {
  gptSpriteRecreator.setApiKey(apiKey);
};

export const hasGPTApiKey = (): boolean => {
  return gptSpriteRecreator.hasApiKey();
};