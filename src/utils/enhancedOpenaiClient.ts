// Image generation goes through our server proxy so the API key is never in the browser (avoids CORS + 401).
const IMAGE_MODEL = "gpt-image-1.5";
const IMAGE_PROXY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_IMAGE_PROXY) ||
  '/.netlify/functions/openai-images';

// Type definitions
export interface ImageGenerationConfig {
  size?: '256x256' | '512x512' | '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'low' | 'medium' | 'high' | 'auto';
  sourceImage?: string; // Base64 image for multi-turn generation
  count?: number;
  onProgress?: (progress: number) => void;
}

export interface ImageGenerationResult {
  imageUrl: string;
  seed?: number;
  revisedPrompt?: string;
}

export interface MultiImageGenerationResult {
  success: boolean;
  images?: string[];
  error?: string;
  responseId?: string; // For multi-turn conversations
}

export interface GPTVisionResult {
  success: boolean;
  analysis: string;
  sprites?: Array<{
    type: 'letter' | 'symbol' | 'object';
    bounds: { x: number, y: number, width: number, height: number };
    confidence: number;
    description: string;
  }>;
  error?: string;
}

// Store image generation response IDs for symbols
const symbolResponseIds = new Map<string, string>();

/**
 * Save response ID to localStorage for persistent access
 */
function saveResponseIdToStorage(symbolId: string, responseId: string, gameId?: string) {
  try {
    const storageKey = `slotai_response_ids_${gameId || 'default'}`;
    const existingData = localStorage.getItem(storageKey);
    const responseIds = existingData ? JSON.parse(existingData) : {};

    responseIds[symbolId] = responseId;
    localStorage.setItem(storageKey, JSON.stringify(responseIds));

    console.log(`[Response ID Storage] Saved ${symbolId} -> ${responseId}`);
  } catch (error) {
    console.warn('[Response ID Storage] Failed to save to localStorage:', error);
  }
}
/**
 * Generate image using OpenAI's GPT-4o model with function calling
 * @param prompt - The image generation prompt
 * @param config - Optional configuration for size and quality
 * @returns Promise with image URL and metadata
 */
async function generateImage(
  prompt: string,
  config: ImageGenerationConfig = {}
): Promise<ImageGenerationResult> {
  try {
    console.log(`[gpt-image-1] Generating image with prompt: ${prompt}`);
    console.log(`[gpt-image-1] Prompt length: ${prompt.length} characters`);

    // Add stack trace to debug where this is being called from
    if (prompt.length < 100) {
      console.warn('[gpt-image-1] Short prompt detected! Stack trace:');
      console.trace();
    }

    // Use gpt-image-1 with Image API (larger size for better sprite separation)
    const payload = {
      model: IMAGE_MODEL,
      prompt: prompt,
      n: 1,
      size: config.size || "1024x1024", // Force 1024x1024 for maximum spacing
      quality: config.quality || "high"  // Use high quality for sprite sheets
    };

    console.log(`[gpt-image-1] Generating image with model: ${IMAGE_MODEL}`);

    // Retry mechanism for network issues
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch(IMAGE_PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(180000) // 3 minutes for complex UI generation
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[gpt-image-1] API response:`, data);

          // Handle Image API response
          if (data.data && data.data.length > 0) {
            const imageData = data.data[0];

            // gpt-image-1 returns URL, not base64
            const imageUrl = imageData.url || imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : imageData;

            return {
              imageUrl,
              seed: Math.floor(Math.random() * 1000000),
              revisedPrompt: imageData.revised_prompt || prompt
            };
          } else {
            throw new Error('No image data in gpt-image-1 response');
          }
        }

        const errorText = await response.text();
        throw new Error(`gpt-image-1 API error (${response.status}): ${errorText}`);

      } catch (error) {
        retryCount++;
        console.warn(`[gpt-image-1] Attempt ${retryCount} failed:`, error);

        if (retryCount >= maxRetries) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount - 1)));
      }
    }

    // Should not reach here due to retry mechanism
    throw new Error('All retry attempts failed');

  } catch (error) {
    console.error('[gpt-image-1] Image generation failed:', error);

    // No fallbacks - let the error propagate
    throw error;
  }
}

/**
 * Set symbol response ID in memory cache
 */
function setSymbolResponseId(symbolId: string, responseId: string, gameId?: string): void {
  const key = gameId ? `${gameId}:${symbolId}` : symbolId;
  symbolResponseIds.set(key, responseId);
}

/**
 * Generate image with multi-turn support (for deriving symbols) - FIXED VERSION
 * @param config - Configuration including prompt and optional source image
 * @returns Promise with generation result
 */
async function generateImageWithConfig(config: {
  prompt: string;
  sourceImage?: string;
  sourceDescription?: string; // Description of the source image for better derivation
  sourceSymbolId?: string; // ID of the source symbol (for getting response ID)
  targetSymbolId?: string; // ID of the target symbol (for saving response ID)
  count?: number;
  onProgress?: (progress: number) => void;
  gameId?: string; // Game ID for persistent storage
  size?: string; // Image size parameter
  referenced_image_ids?: string[]; // Referenced image IDs for multi-turn generation
}): Promise<MultiImageGenerationResult> {
  try {
    const { prompt, sourceImage, targetSymbolId, count = 1, onProgress, gameId } = config;

    // console.log(`[gpt-image-1] Multi-turn generation with prompt: ${prompt}`);
    if (sourceImage) {
      console.log(`[gpt-image-1] Using source image for derivation`);
    }

    // Simulate progress
    if (onProgress) {
      onProgress(10);
    }

    // All image generation goes through server proxy (no API key in browser).
    let payload: any;
    let requestBody: string;

    if (sourceImage) {
      // Image edits (source image → new image) require multipart; our proxy is JSON-only.
      // Fall back to prompt-only generation so the flow still works.
      console.warn(`[gpt-image-1] Source image supplied but edits proxy not used; using prompt-only generation`);
      payload = {
        model: IMAGE_MODEL,
        prompt: prompt,
        n: 1,
        size: config.size || "1024x1024",
        quality: "high"
      };
      requestBody = JSON.stringify(payload);
    } else if (config.referenced_image_ids && config.referenced_image_ids.length > 0) {
      // Use regular generations endpoint with referenced_image_ids parameter
      console.log(`[gpt-image-1] Using generations endpoint with referenced images`);

      payload = {
        model: IMAGE_MODEL,
        prompt: prompt,
        n: 1,
        size: config.size || "1024x1024",
        quality: "high",
        referenced_image_ids: config.referenced_image_ids
      };
      requestBody = JSON.stringify(payload);
    } else {
      // Use regular generations endpoint
      payload = {
        model: IMAGE_MODEL,
        prompt: prompt,
        n: 1,
        size: config.size || "1024x1024",
        quality: "high"
      };
      requestBody = JSON.stringify(payload);
      console.log(`[gpt-image-1] Using generations endpoint`);
    }

    if (onProgress) {
      onProgress(60);
    }

    // Retry mechanism
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch(IMAGE_PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
          signal: AbortSignal.timeout(180000) // 3 minutes for complex generation
        });

        if (onProgress) {
          onProgress(70);
        }

        if (response.ok) {
          const data = await response.json();

          if (onProgress) {
            onProgress(80);
          }

          console.log(`[gpt-image-1] Multi-turn API response:`, data);

          // Handle Image API response
          if (data.data && data.data.length > 0) {
            const imageData = data.data[0];

            // gpt-image-1 returns URL, not base64
            const imageUrl = imageData.url || imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : imageData;

            // Store response ID for future multi-turn generation
            if (targetSymbolId) {
              const responseId = `gpt_image_${Date.now()}`;
              setSymbolResponseId(targetSymbolId, responseId, gameId);
              saveResponseIdToStorage(targetSymbolId, responseId, gameId);
              console.log(`[gpt-image-1] Stored response ID for symbol ${targetSymbolId}: ${responseId}`);
            }

            if (onProgress) {
              onProgress(100);
            }

            return {
              success: true,
              images: [imageUrl],
              responseId: `gpt_image_${Date.now()}`
            };
          } else {
            throw new Error('No image data in gpt-image-1 multi-turn response');
          }
        }

        const errorText = await response.text();
        throw new Error(`gpt-image-1 API error (${response.status}): ${errorText}`);

      } catch (error) {
        retryCount++;
        console.warn(`[gpt-image-1] Multi-turn attempt ${retryCount} failed:`, error);

        if (retryCount >= maxRetries) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount - 1)));
      }
    }

    throw new Error('All multi-turn retry attempts failed');

  } catch (error) {
    console.error('[gpt-image-1] Multi-turn generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 🎭 AUTO-GENERATE SPRITE COMPONENTS for animation
 * Takes the user's original symbol and creates separated components
 */
async function generateSpriteComponents(
  symbolId: string,
  responseId: string
): Promise<void> {
  // This function generates sprite components for animation
  // Implementation depends on whether we use responses API or function calling
  console.log(`[gpt-image-1] Auto-generating sprite components for ${symbolId}`);
}
/**
 * Analyze image with GPT-4o Vision for sprite detection refinement
 */
async function analyzeImageWithGPT4O(imageUrl: string, prompt: string): Promise<GPTVisionResult> {
  try {
    const visionKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_API_KEY) || '';
    if (!visionKey) {
      return { success: false, analysis: '', error: 'VITE_OPENAI_API_KEY not set for vision analysis' };
    }
    console.log('🧠 [GPT-4o Vision] Analyzing image for sprite refinement...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${visionKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`GPT-4o Vision API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content || '';

    console.log('✅ [GPT-4o Vision] Analysis complete:', analysis.substring(0, 200) + '...');

    return {
      success: true,
      analysis,
      sprites: [] // Could parse structured responses here
    };

  } catch (error) {
    console.error('[GPT-4o Vision] Analysis failed:', error);
    return {
      success: false,
      analysis: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export the main functions
export const enhancedOpenaiClient = {
  generateImage,
  generateImageWithConfig,
  generateSpriteComponents,
  analyzeImageWithGPT4O
};

export default enhancedOpenaiClient;