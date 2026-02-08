import { GameConfig } from '../types';
import { CONFIG_DEFAULTS } from './configDefaults';
import { ApiConfig, ApiResponse, GameConfiguration, CloneOptions } from './apiTypes';
import { number } from 'framer-motion';

/**
 * Interface for API feature status 
 */
interface ApiFeatureStatus {
  configurations: boolean;
  imageGeneration: boolean;
  simulation: boolean;
  export: boolean;
}

/**
 * Interface for connection test result
 */
interface ConnectionTestResult {
  success: boolean;
  features?: ApiFeatureStatus;
  message?: string;
}

// Environment variables and constants
const DEFAULT_API_URL = 'https://slotsai-api.onrender.com';
const API_BASE_PATH = '/v1';

// --- CONFIGURATION TOGGLE ---
// Set this to true to use the local Node.js server (localhost:3500) 
// instead of the remote RGS (rgs-config.onrender.com)
export const USE_LOCAL_RGS = true;

const REMOTE_RGS_URL = 'https://rgs-config.onrender.com';
const LOCAL_RGS_URL = 'http://localhost:3500/api/rgs';

export const getRgsBaseUrl = () => USE_LOCAL_RGS ? LOCAL_RGS_URL : REMOTE_RGS_URL;
// ----------------------------

// Static fallback content - available for offline use or when API is unavailable
const FALLBACK_IMAGES = {
  WILD: '/public/themes/base-style.png',
  SCATTER: '/public/themes/ancient-egypt.png',
  HIGH: '/public/themes/cosmic-adventure.png',
  MEDIUM: '/public/themes/deep-ocean.png',
  LOW: '/public/themes/enchanted-forest.png',
  BACKGROUND: '/public/themes/deep-ocean.png',
  FRAME: '/public/themes/ancient-egypt.png'
};

// Array version for backward compatibility
const FALLBACK_IMAGES_ARRAY = [
  FALLBACK_IMAGES.WILD,
  FALLBACK_IMAGES.SCATTER,
  FALLBACK_IMAGES.HIGH,
  FALLBACK_IMAGES.MEDIUM,
  FALLBACK_IMAGES.LOW
];

// Maximum retry count for API calls
const MAX_RETRIES = 3;

// Templates for API configuration formats
const PAYLOAD_TEMPLATES = {
  DIRECT: (gameId: string, config: GameConfiguration) => ({ ...config }),
  WRAPPED: (gameId: string, config: GameConfiguration) => ({
    "id": gameId,
    "config": config
  }),
  MINIMAL_DIRECT: (gameId: string) => ({
    "gameId": gameId,
    "theme": {
      "mainTheme": "Basic Theme",
      "artStyle": "cartoon",
      "colorScheme": "warm-vibrant",
      "mood": "playful",
      "description": "Basic slot game configuration"
    },
    "bet": {
      "min": 0.20,
      "max": 100,
      "increment": 0.20
    }
  }),
  MINIMAL_WRAPPED: (gameId: string) => ({
    "id": gameId,
    "config": {
      "gameId": gameId,
      "theme": {
        "mainTheme": "Basic Theme",
        "artStyle": "cartoon",
        "colorScheme": "warm-vibrant",
        "mood": "playful",
        "description": "Basic slot game configuration"
      },
      "bet": {
        "min": 0.20,
        "max": 100,
        "increment": 0.20
      }
    }
  })
};

/**
 * Get a fallback image based on the prompt content or image type
 */
const getFallbackImage = (prompt: string, type?: string): string => {
  // If type is explicitly provided, use it directly
  if (type) {
    const typeUpper = type.toUpperCase();
    if (typeUpper in FALLBACK_IMAGES) {
      return FALLBACK_IMAGES[typeUpper as keyof typeof FALLBACK_IMAGES];
    }
  }

  // Otherwise detect from prompt
  const promptLower = prompt.toLowerCase();

  if (promptLower.includes('wild')) return FALLBACK_IMAGES.WILD;
  if (promptLower.includes('scatter')) return FALLBACK_IMAGES.SCATTER;
  if (promptLower.includes('high')) return FALLBACK_IMAGES.HIGH;
  if (promptLower.includes('medium') || promptLower.includes('mid')) return FALLBACK_IMAGES.MEDIUM;
  if (promptLower.includes('low')) return FALLBACK_IMAGES.LOW;
  if (promptLower.includes('background') || promptLower.includes('scene')) return FALLBACK_IMAGES.BACKGROUND;
  if (promptLower.includes('frame') || promptLower.includes('border')) return FALLBACK_IMAGES.FRAME;

  return FALLBACK_IMAGES.WILD; // Default to wild
};

/**
 * Determine if a URL should use the proxy
 */
const shouldUseProxy = (url: string): boolean => {
  // Always return false to avoid CORS issues - use local mock data only
  return false;
};

/**
 * Convert a URL to use the proxy if needed
 */
const getProxyUrl = (url: string): string => {
  return shouldUseProxy(url)
    ? `http://localhost:3500/api-proxy?url=${encodeURIComponent(url)}`
    : url;
};

/**
 * Sleep for a specified amount of time
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Normalize API URL
 */
const normalizeApiUrl = (baseUrl?: string): string => {
  if (!baseUrl ||
    baseUrl.startsWith('/') ||
    baseUrl.startsWith('./') ||
    baseUrl === 'local' ||
    baseUrl === 'https://local' ||
    baseUrl === 'http://local') {
    console.warn(`Invalid API base URL: "${baseUrl}", using default instead`);
    return DEFAULT_API_URL;
  }

  // Ensure URL has proper protocol
  let normalizedUrl = baseUrl;
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  // Final validation to ensure we have a valid URL
  try {
    new URL(normalizedUrl);
    return normalizedUrl;
  } catch (e) {
    console.warn(`URL "${normalizedUrl}" is not valid, using default instead`);
    return DEFAULT_API_URL;
  }
};

/**
 * Generic typed API request handler with error handling and retries
 */
async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  data?: unknown,
  apiConfig?: ApiConfig,
  retryCount = 0
): Promise<T> {
  const config = apiConfig || { baseUrl: DEFAULT_API_URL };

  // Normalize API URL
  const baseUrl = normalizeApiUrl(config.baseUrl);

  let url = `${baseUrl}${API_BASE_PATH}${endpoint}`;
  url = getProxyUrl(url);

  // Prepare headers
  const headers: HeadersInit = { 'Accept': 'application/json' };

  if (data) headers['Content-Type'] = 'application/json';
  if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

  // Prepare request
  const options: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    mode: 'cors',
    cache: 'no-cache'
  };

  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');

    // If we're rate limited, wait and retry
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const retryAfter = Number(response.headers.get('Retry-After') || '5');
      await sleep(retryAfter * 1000);
      return apiRequest<T>(endpoint, method, data, apiConfig, retryCount + 1);
    }

    if (!response.ok) {
      const errorText = await response.text();

      // If server error, retry after delay
      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        await sleep(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return apiRequest<T>(endpoint, method, data, apiConfig, retryCount + 1);
      }

      throw new Error(`API error (${response.status}): ${errorText.substring(0, 100)}...`);
    }

    // Handle 204 No Content
    if (response.status === 204) return {} as T;

    // Get response text
    const responseText = await response.text();

    // Empty response check
    if (!responseText || responseText.trim() === '') {
      return {} as T;
    }

    // Try to parse as JSON regardless of content type
    if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
      try {
        return JSON.parse(responseText) as T;
      } catch (parseError) {
        throw new Error(`Failed to parse response as JSON: ${(parseError as Error).message}`);
      }
    }

    // If we expected JSON but got something else
    if (!contentType?.includes('application/json')) {
      throw new Error(`Expected JSON but received ${contentType || 'unknown content type'}`);
    }

    // Fallback for when response isn't JSON
    return responseText as unknown as T;
  } catch (error) {

    // Retry network errors
    if ((error as Error).message.includes('Failed to fetch') && retryCount < MAX_RETRIES) {
      await sleep(Math.pow(2, retryCount) * 1000); // Exponential backoff
      return apiRequest<T>(endpoint, method, data, apiConfig, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Extract API configuration from the store
 */
export const getApiConfig = (config: Partial<GameConfig>): ApiConfig => ({
  baseUrl: config?.api?.baseUrl || DEFAULT_API_URL,
  apiKey: config?.api?.apiKey,
  useLocalMock: config?.api?.useLocalMock
});

/**
 * Background generation result interface
 */
interface BackgroundGenerationResult {
  imageUrl: string;
  seed?: number;
  thumbnailUrl?: string;
  metadata?: {
    width: number;
    height: number;
    model: string;
    generatedAt: string;
    prompt?: string;
  };
  success: boolean;
  message?: string;
}

/**
 * Symbol item in a generation result
 */
interface SymbolResult {
  id: string;
  type: string;
  imageUrl: string;
  thumbnailUrl?: string;
}

/**
 * Symbol set generation result interface
 */
interface SymbolSetGenerationResult {
  status: 'processing' | 'completed' | 'failed';
  symbols: SymbolResult[];
  batchId?: string;
  message?: string;
}

/**
 * API client for accessing slot game configuration services
 */
export const slotApiClient = {
  /**
   * Generate a background image optimized for slot games with special handling
   */

  generateBackground: async (
    gameId: string,
    theme: {
      mainTheme?: string;
      artStyle?: string;
      colorScheme?: string;
      mood?: string;
      description?: string;
    },
    options?: {
      width?: number;
      height?: number;
      landscape?: boolean;
      negativePrompt?: string;
      steps?: number;
      seed?: number;
      style?: string;
      model?: string;
    },
    apiConfig?: ApiConfig
  ): Promise<BackgroundGenerationResult> => {
    try {
      // Construct an optimized prompt for slot game backgrounds
      const themeDesc = theme.mainTheme || 'slot game';
      const artStyle = theme.artStyle || 'realistic';
      const colorScheme = theme.colorScheme || 'vibrant';
      const mood = theme.mood || 'exciting';
      const description = theme.description || '';

      // Create an optimized prompt for background generation 
      const combinedPrompt = `A stunning background for a ${themeDesc} themed slot machine game, ${description}, ${colorScheme} colors, ${mood} atmosphere, ${artStyle} style. Highly detailed, no symbols, no text, no UI elements, seamless texture, dramatic lighting, professional game art, suitable as a slot machine background`;

      // Determine optimal dimensions based on orientation
      const isLandscape = options?.landscape !== false; // Default to landscape
      const width = options?.width || (isLandscape ? 1920 : 1080);
      const height = options?.height || (isLandscape ? 1080 : 1920);

      // Enhanced negative prompt specifically for backgrounds
      const defaultNegPrompt = 'text, words, letters, symbols, logos, UI elements, buttons, frames, interface elements, blurry, distorted, ugly, low quality, cartoon characters, human faces, people, animals unless part of theme';
      const negativePrompt = options?.negativePrompt || defaultNegPrompt;


      // Try using the API if it's available
      if (apiConfig?.baseUrl && !apiConfig.useLocalMock) {
        try {
          // Create the request payload
          const result = await this.generateImage(
            combinedPrompt,
            `background_${gameId}`,
            {
              width,
              height,
              negativePrompt,
              steps: options?.steps || 40, // More steps for better quality
              seed: options?.seed,
              gameId,
              style: options?.style || artStyle,
              model: options?.model || 'sdxl', // Use SDXL for better backgrounds
              type: 'background'
            },
            apiConfig
          );

          return {
            ...result,
            success: true,
            message: "Background generated successfully"
          };
        } catch (apiError) {
          console.error('Background generation API failed, using fallback:', apiError);
        }
      }

      // Use fallback if API fails or is not available
      const fallbackUrl = getFallbackImage('background', 'BACKGROUND');

      return {
        imageUrl: fallbackUrl,
        seed: options?.seed || Math.floor(Math.random() * 1000000),
        thumbnailUrl: fallbackUrl,
        metadata: {
          width,
          height,
          model: 'fallback',
          generatedAt: new Date().toISOString(),
          prompt: combinedPrompt
        },
        success: true,
        message: "Using fallback background image"
      };
    } catch (error) {
      console.error('Background generation error:', error);

      // Return a fallback in case of error
      const fallbackUrl = getFallbackImage('background', 'BACKGROUND');

      return {
        imageUrl: fallbackUrl,
        seed: Math.floor(Math.random() * 1000000),
        thumbnailUrl: fallbackUrl,
        metadata: {
          width: options?.width || 1920,
          height: options?.height || 1080,
          model: 'fallback-error',
          generatedAt: new Date().toISOString()
        },
        success: false,
        message: error instanceof Error ? error.message : "Unknown background generation error"
      };
    }
  },

  /**
   * Generate multiple images in a batch with a single API request
   */
  generateBatchImages: async (
    gameId: string,
    imagePrompts: Array<{ id: string; prompt: string; type?: string }>,
    options?: {
      width?: number;
      height?: number;
      negativePrompt?: string;
      steps?: number;
      style?: string;
      model?: string;
    },
    apiConfig?: ApiConfig
  ): Promise<{
    batchId: string;
    status: 'processing' | 'completed' | 'failed';
    progress: { total: number; completed: number; failed: number };
    results?: Array<{ id: string; status: string; imageUrl: string; thumbnailUrl?: string }>;
  }> => {
    try {

      // Only try the actual API if config is provided and enabled
      if (apiConfig?.baseUrl && !apiConfig.useLocalMock) {
        try {
          // Format the request according to the API specification
          const requestData = {
            gameId,
            batchName: `batch-${Date.now()}`,
            images: imagePrompts,
            options: {
              width: options?.width || 512,
              height: options?.height || 512,
              negativePrompt: options?.negativePrompt || 'text, words, letters, blurry, distorted, ugly, low quality',
              steps: options?.steps || 30,
              model: options?.model || 'sdxl',
              style: options?.style || 'realistic'
            }
          };

          // Attempt to call the batch generation endpoint
          const result = await apiRequest<{
            batchId: string;
            gameId: string;
            status: 'processing' | 'completed' | 'failed';
            progress: { total: number; completed: number; failed: number };
            estimatedCompletionTime?: string;
            statusCheckUrl?: string;
            results?: Array<{ id: string; status: string; imageUrl: string; thumbnailUrl?: string }>;
          }>(
            '/generation/batch',
            'POST',
            requestData,
            apiConfig
          );

          return {
            batchId: result.batchId,
            status: result.status,
            progress: result.progress,
            results: result.results
          };
        } catch (apiError) {
          console.error('Batch image generation API failed, using fallbacks:', apiError);
        }
      }

      // Simulate a processed batch with fallback images
      const results = imagePrompts.map(item => {
        const fallbackImageUrl = getFallbackImage(item.prompt, item.type);
        return {
          id: item.id,
          status: 'completed',
          imageUrl: fallbackImageUrl,
          thumbnailUrl: fallbackImageUrl
        };
      });

      return {
        batchId: `fallback-batch-${Date.now()}`,
        status: 'completed',
        progress: {
          total: imagePrompts.length,
          completed: imagePrompts.length,
          failed: 0
        },
        results
      };
    } catch (error) {
      console.error('Batch image generation error:', error);

      // Return fallback results if an error occurs
      const fallbackResults = imagePrompts.map(item => ({
        id: item.id,
        status: 'failed',
        imageUrl: getFallbackImage(item.prompt, item.type),
        thumbnailUrl: getFallbackImage(item.prompt, item.type)
      }));

      return {
        batchId: `error-batch-${Date.now()}`,
        status: 'failed',
        progress: {
          total: imagePrompts.length,
          completed: 0,
          failed: imagePrompts.length
        },
        results: fallbackResults
      };
    }
  },

  /**
   * Generate a complete set of slot symbols for a game theme
   */
  generateSymbolSet: async (
    gameId: string,
    theme: {
      mainTheme?: string;
      artStyle?: string;
      colorScheme?: string;
      mood?: string;
      description?: string;
    },
    options?: {
      numHigh?: number;
      numMedium?: number;
      numLow?: number;
      includeWild?: boolean;
      includeScatter?: boolean;
      width?: number;
      height?: number;
      transparentBackground?: boolean;
      negativePrompt?: string;
      steps?: number;
      style?: string;
      model?: string;
    },
    apiConfig?: ApiConfig
  ): Promise<SymbolSetGenerationResult> => {
    try {
      // Get theme details
      const themeDesc = theme.mainTheme || 'slot game';
      const artStyle = theme.artStyle || 'realistic';
      const colorScheme = theme.colorScheme || 'vibrant';
      const mood = theme.mood || 'exciting';

      // Set default options
      const numHigh = options?.numHigh || 2;
      const numMedium = options?.numMedium || 3;
      const numLow = options?.numLow || 4;
      const includeWild = options?.includeWild !== false; // Default to true
      const includeScatter = options?.includeScatter !== false; // Default to true
      const width = options?.width || 512;
      const height = options?.height || 512;

      // Define the base parameters for all symbols
      const baseParams = {
        transparentBg: options?.transparentBackground !== false, // Default to true
        centered: true,
        steps: options?.steps || 30,
        style: options?.style || artStyle,
        model: options?.model || 'sdxl',
        negativePrompt: options?.negativePrompt || 'text, words, letters, blurry, distorted, ugly, low quality, multiple symbols, background elements'
      };

      // Generate prompts for all symbols
      const symbolPrompts: Array<{ id: string; prompt: string; type: string }> = [];

      // Add wild symbol
      if (includeWild) {
        symbolPrompts.push({
          id: 'wild',
          type: 'wild',
          prompt: `A ${artStyle} style Wild symbol for ${themeDesc} slot game theme. Bright, vibrant, eye-catching, centered object on transparent background. Professional slot machine symbol design.`
        });
      }

      // Add scatter symbol
      if (includeScatter) {
        symbolPrompts.push({
          id: 'scatter',
          type: 'scatter',
          prompt: `A ${artStyle} style Scatter/Bonus symbol for ${themeDesc} slot game theme. Valuable, special appearance, iconic design for slot machine, single centered object on transparent background.`
        });
      }

      // Add high paying symbols
      for (let i = 1; i <= numHigh; i++) {
        symbolPrompts.push({
          id: `high_${i}`,
          type: 'high',
          prompt: `A ${artStyle} style high-paying symbol #${i} for ${themeDesc} slot game theme, ${colorScheme} colors, ${mood} mood. Valuable-looking, detailed, premium quality, single centered object on transparent background.`
        });
      }

      // Add medium paying symbols
      for (let i = 1; i <= numMedium; i++) {
        symbolPrompts.push({
          id: `medium_${i}`,
          type: 'medium',
          prompt: `A ${artStyle} style medium-paying symbol #${i} for ${themeDesc} slot game theme, ${colorScheme} colors. Single centered object on transparent background, clear design suitable for slot machine symbol.`
        });
      }

      // Add low paying symbols
      for (let i = 1; i <= numLow; i++) {
        symbolPrompts.push({
          id: `low_${i}`,
          type: 'low',
          prompt: `A ${artStyle} style low-paying symbol #${i} for ${themeDesc} slot game theme. Simple design, single centered object on transparent background, card suit inspired symbol appropriate for slots.`
        });
      }

      // Try using batch generation API
      if (apiConfig?.baseUrl && !apiConfig.useLocalMock) {
        try {
          // Generate images in a batch
          const batchResult = await this.generateBatchImages(
            gameId,
            symbolPrompts,
            {
              width,
              height,
              negativePrompt: baseParams.negativePrompt,
              steps: baseParams.steps,
              style: baseParams.style,
              model: baseParams.model
            },
            apiConfig
          );

          // If results are immediately available
          if (batchResult.status === 'completed' && batchResult.results) {
            const symbols = batchResult.results.map(result => ({
              id: result.id,
              type: symbolPrompts.find(p => p.id === result.id)?.type || 'unknown',
              imageUrl: result.imageUrl,
              thumbnailUrl: result.thumbnailUrl
            }));

            return {
              status: 'completed',
              symbols,
              batchId: batchResult.batchId,
              message: "Symbol set generated successfully"
            };
          }

          // If processing, return the batch ID for later status checking
          return {
            status: batchResult.status,
            symbols: [], // Empty until completed
            batchId: batchResult.batchId,
            message: "Symbol generation in progress, check status later"
          };
        } catch (batchError) {
          console.error('Batch symbol generation failed:', batchError);
        }
      }


      // Create fallback symbols
      const fallbackSymbols = symbolPrompts.map(prompt => ({
        id: prompt.id,
        type: prompt.type,
        imageUrl: getFallbackImage(prompt.prompt, prompt.type),
        thumbnailUrl: getFallbackImage(prompt.prompt, prompt.type)
      }));

      return {
        status: 'completed',
        symbols: fallbackSymbols,
        message: "Using fallback symbol images"
      };
    } catch (error) {
      console.error('Symbol set generation error:', error);

      // Return minimal fallback set on error
      const errorSymbols = [
        { id: 'wild', type: 'wild', imageUrl: getFallbackImage('wild', 'WILD') },
        { id: 'scatter', type: 'scatter', imageUrl: getFallbackImage('scatter', 'SCATTER') },
        { id: 'high_1', type: 'high', imageUrl: getFallbackImage('high', 'HIGH') },
        { id: 'medium_1', type: 'medium', imageUrl: getFallbackImage('medium', 'MEDIUM') },
        { id: 'low_1', type: 'low', imageUrl: getFallbackImage('low', 'LOW') }
      ];

      return {
        status: 'failed',
        symbols: errorSymbols,
        message: error instanceof Error ? error.message : "Unknown symbol generation error"
      };
    }
  },

  /**
   * Check status of a batch image generation job
   */
  checkBatchStatus: async (
    batchId: string,
    apiConfig?: ApiConfig
  ): Promise<{
    batchId: string;
    status: 'processing' | 'completed' | 'failed';
    progress: { total: number; completed: number; failed: number };
    results?: Array<{ id: string; status: string; imageUrl: string; thumbnailUrl?: string }>;
  }> => {
    try {
      // Only try the actual API if config is provided
      if (apiConfig?.baseUrl && !apiConfig.useLocalMock && !batchId.startsWith('fallback-') && !batchId.startsWith('error-')) {
        try {
          // Call the status check endpoint
          const result = await apiRequest<{
            batchId: string;
            status: 'processing' | 'completed' | 'failed';
            progress: { total: number; completed: number; failed: number };
            results?: Array<{ id: string; status: string; imageUrl: string; thumbnailUrl?: string }>;
          }>(
            `/generation/status/${batchId}`,
            'GET',
            undefined,
            apiConfig
          );

          return result;
        } catch (apiError) {
          console.error(`Failed to check batch status for ${batchId}:`, apiError);
          throw apiError;
        }
      }

      // For fallback batches, we assume they're already completed
      if (batchId.startsWith('fallback-')) {
        return {
          batchId,
          status: 'completed',
          progress: { total: 1, completed: 1, failed: 0 }
        };
      }

      // For error batches, return failed status
      if (batchId.startsWith('error-')) {
        return {
          batchId,
          status: 'failed',
          progress: { total: 1, completed: 0, failed: 1 }
        };
      }

      throw new Error(`Invalid batch ID: ${batchId}`);
    } catch (error) {
      console.error(`Error checking batch status for ${batchId}:`, error);
      throw error;
    }
  },

  /**
   * Generate an image using configured API with improved error handling and options
   */
  generateImage: async (
    prompt: string,
    id?: string,
    options?: {
      width?: number;
      height?: number;
      negativePrompt?: string;
      steps?: number;
      seed?: number;
      gameId?: string;
      style?: string;
      model?: string;
      type?: string; // Type of image: 'wild', 'scatter', 'background', etc.
    },
    apiConfig?: ApiConfig
  ): Promise<{ imageUrl: string; seed?: number; thumbnailUrl?: string; metadata?: any }> => {
    try {

      // Only try the actual API if config is provided and enabled
      if (apiConfig?.baseUrl && !apiConfig.useLocalMock) {
        try {
          // Format the request according to the API specification
          const requestData = {
            prompt,
            id: id || 'image',
            gameId: options?.gameId || 'default',
            options: {
              width: options?.width || 512,
              height: options?.height || 512,
              negativePrompt: options?.negativePrompt || 'text, words, letters, blurry, distorted, ugly, low quality',
              steps: options?.steps || 30,
              seed: options?.seed,
              style: options?.style || 'realistic',
              model: options?.model || 'sdxl'
            }
          };

          // Attempt to call the image generation endpoint
          const result = await apiRequest<{
            id: string;
            gameId: string;
            imageUrl: string;
            thumbnailUrl?: string;
            prompt: string;
            seed: number;
            metadata?: {
              width: number;
              height: number;
              model: string;
              generatedAt: string;
            }
          }>(
            '/generation/text-to-image',
            'POST',
            requestData,
            apiConfig
          );

          if (result.imageUrl) {
            return {
              imageUrl: result.imageUrl,
              thumbnailUrl: result.thumbnailUrl,
              seed: result.seed,
              metadata: result.metadata
            };
          }
        } catch (apiError) {
          console.error('API image generation failed, using fallback:', apiError);
        }
      }

      // Use a consistent placeholder based on the prompt content or specified type
      const imagePath = getFallbackImage(prompt, options?.type);

      // Generate a random seed but use a consistent one if provided
      const seed = options?.seed || Math.floor(Math.random() * 100000);


      return {
        imageUrl: imagePath,
        seed: seed,
        metadata: {
          width: options?.width || 512,
          height: options?.height || 512,
          model: 'fallback',
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Image generation error:', error);
      // Return a fallback image if an error occurs
      return {
        imageUrl: getFallbackImage(prompt, options?.type),
        seed: Math.floor(Math.random() * 100000),
        metadata: {
          width: options?.width || 512,
          height: options?.height || 512,
          model: 'fallback-error',
          generatedAt: new Date().toISOString()
        }
      };
    }
  },

  /**
   * Test API connectivity with robust error handling and feature detection
   */
  testConnection: async (apiConfig?: ApiConfig): Promise<ConnectionTestResult> => {
    if (!apiConfig?.baseUrl || apiConfig.useLocalMock) {
      return {
        success: true,
        features: {
          configurations: true,
          imageGeneration: true,
          simulation: true,
          export: true
        },
        message: "Mock mode active - all features available"
      };
    }

    // Initialize features object with all false
    const features: ApiFeatureStatus = {
      configurations: false,
      imageGeneration: false,
      simulation: false,
      export: false
    };

    try {
      // First try the health endpoint
      const baseUrl = normalizeApiUrl(apiConfig.baseUrl);
      let healthSuccess = false;

      try {
        const healthUrl = `${baseUrl}/health`;

        const healthResponse = await fetch(healthUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        });

        if (healthResponse.ok) {
          healthSuccess = true;

          // Try to parse health response for feature information
          try {
            const healthData = await healthResponse.json();
            if (healthData.services) {
              features.configurations = !!healthData.services.configurations;
              features.imageGeneration = !!healthData.services.imageGeneration;
              features.simulation = !!healthData.services.simulation;
              features.export = !!healthData.services.export;
            }
          } catch {
            console.warn('Could not parse health response for features');
          }
        }
      } catch {
        console.warn('Health check failed, trying main API endpoint');
      }

      // If health check didn't provide feature information, probe each endpoint
      if (!healthSuccess || !Object.values(features).some(Boolean)) {
        // Test configurations endpoint
        try {
          const configsUrl = `${baseUrl}${API_BASE_PATH}/configurations`;

          const configsResponse = await fetch(configsUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              ...(apiConfig.apiKey ? { 'Authorization': `Bearer ${apiConfig.apiKey}` } : {})
            },
            mode: 'cors'
          });

          // Check if the response is valid JSON
          const responseText = await configsResponse.text();
          if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            features.configurations = true;
            features.export = true; // If configurations work, export should work too
          }
        } catch {
          console.warn('Configurations endpoint check failed');
        }

        // Test image generation endpoint
        try {
          const imageUrl = `${baseUrl}${API_BASE_PATH}/generation/text-to-image`;

          // Just send a HEAD request to check if the endpoint exists
          const imageResponse = await fetch(imageUrl, {
            method: 'HEAD',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              ...(apiConfig.apiKey ? { 'Authorization': `Bearer ${apiConfig.apiKey}` } : {})
            },
            mode: 'cors'
          });

          if (imageResponse.status !== 404) {
            features.imageGeneration = true;
          }
        } catch {
          console.warn('Image generation endpoint check failed');
        }

        // Test simulation endpoint
        try {
          const simUrl = `${baseUrl}${API_BASE_PATH}/simulation`;

          // Just send a HEAD request to check if the endpoint exists
          const simResponse = await fetch(simUrl, {
            method: 'HEAD',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              ...(apiConfig.apiKey ? { 'Authorization': `Bearer ${apiConfig.apiKey}` } : {})
            },
            mode: 'cors'
          });

          if (simResponse.status !== 404) {
            features.simulation = true;
          }
        } catch {
          console.warn('Simulation endpoint check failed');
        }
      }

      // If we haven't detected any features, try a generic test endpoint
      if (!Object.values(features).some(Boolean)) {
        try {
          const testEndpoint = `${baseUrl}${API_BASE_PATH}/test`;

          const testResponse = await fetch(testEndpoint, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              ...(apiConfig.apiKey ? { 'Authorization': `Bearer ${apiConfig.apiKey}` } : {})
            },
            body: JSON.stringify({ message: 'test connection' }),
            mode: 'cors'
          });

          if (testResponse.ok) {
            features.configurations = true; // Assume basic functionality
          }
        } catch {
          console.warn('Test endpoint check failed');
        }
      }

      // If still no features detected, try a minimal configuration creation
      if (!Object.values(features).some(Boolean)) {
        try {
          const testGameId = `test-${Date.now()}`;
          const minimalPayload = PAYLOAD_TEMPLATES.MINIMAL_WRAPPED(testGameId);

          const createResponse = await fetch(`${baseUrl}${API_BASE_PATH}/configurations`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              ...(apiConfig.apiKey ? { 'Authorization': `Bearer ${apiConfig.apiKey}` } : {})
            },
            body: JSON.stringify(minimalPayload),
            mode: 'cors'
          });

          // Even if creation failed but returned valid JSON, consider it a successful connection
          const createText = await createResponse.text();
          if (createText && (createText.trim().startsWith('{') || createText.trim().startsWith('['))) {
            features.configurations = true;
          }
        } catch (createError) {
          console.error('Create test failed:', createError);
        }
      }

      // Determine overall success based on feature availability
      const success = Object.values(features).some(Boolean);

      // Generate appropriate message
      let message = "";
      if (success) {
        const availableCount = Object.values(features).filter(Boolean).length;
        const totalCount = Object.keys(features).length;

        if (availableCount === totalCount) {
          message = "All API features are available";
        } else {
          const availableFeatures = Object.entries(features)
            .filter(([, enabled]) => enabled)
            .map(([name]) => name)
            .join(", ");

          message = `Partial API availability. Available features: ${availableFeatures}`;
        }
      } else {
        message = "API connection failed. No features are available.";
      }

      return { success, features, message };
    } catch (error) {
      console.error('Connection test failed with unhandled error:', error);
      return {
        success: false,
        features: {
          configurations: false,
          imageGeneration: false,
          simulation: false,
          export: false
        },
        message: error instanceof Error ? error.message : "Unknown connection error"
      };
    }
  },

  /**
   * Get all game configurations with improved error handling
   */
  getAllConfigurations: async (apiConfig?: ApiConfig): Promise<GameConfiguration[]> => {
    if (!apiConfig?.baseUrl || apiConfig.useLocalMock) {
      // Return mock data to avoid API connectivity issues
      return [
        {
          gameId: "deep-ocean-adventure",
          theme: {
            mainTheme: "Deep Ocean",
            artStyle: "cartoon",
            colorScheme: "cool-blue",
            mood: "mysterious",
            description: "Underwater adventure with sea creatures and treasure",
            generated: {
              background: "/public/themes/deep-ocean.png",
              symbols: ["/public/themes/deep-ocean.png"],
              frame: null
            }
          },
          bet: {
            min: 0.20,
            max: 100,
            increment: 0.20
          }
        },
        {
          gameId: "ancient-egypt-treasures",
          theme: {
            mainTheme: "Ancient Egypt",
            artStyle: "realistic",
            colorScheme: "golden-warm",
            mood: "mysterious",
            description: "Ancient Egyptian treasures and artifacts",
            generated: {
              background: "/public/themes/ancient-egypt.png",
              symbols: ["/public/themes/ancient-egypt.png"],
              frame: null
            }
          },
          bet: {
            min: 0.20,
            max: 100,
            increment: 0.20
          }
        },
        {
          gameId: "enchanted-forest",
          theme: {
            mainTheme: "Enchanted Forest",
            artStyle: "hand-drawn",
            colorScheme: "green-mystical",
            mood: "magical",
            description: "Magical forest with mythical creatures and fairies",
            generated: {
              background: "/public/themes/enchanted-forest.png",
              symbols: ["/public/themes/enchanted-forest.png"],
              frame: null
            }
          },
          bet: {
            min: 0.20,
            max: 100,
            increment: 0.20
          }
        }
      ];
    }

    try {
      // Fetch configurations from API
      const response = await apiRequest<unknown>(
        '/configurations',
        'GET',
        undefined,
        apiConfig
      );

      // Process the response based on its format
      if (Array.isArray(response)) {
        // Direct array of configurations
        return response.map(item => {
          if (item.config) {
            // Wrapped format
            return {
              ...item.config,
              gameId: item.config.gameId || item.id
            };
          }
          // Direct format
          return item as GameConfiguration;
        });
      } else if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray((response as any).data)) {
          // Pagination wrapper
          return ((response as any).data).map((item: any) => {
            if (item.config) {
              return {
                ...item.config,
                gameId: item.config.gameId || item.id
              };
            }
            return item as GameConfiguration;
          });
        } else if ('config' in response) {
          // Single wrapped object
          return [{
            ...(response as any).config,
            gameId: (response as any).config.gameId || (response as any).id
          }];
        } else if ('gameId' in response) {
          // Single unwrapped object
          return [response as GameConfiguration];
        }
      }

      console.warn('Response format not recognized, returning empty array');
      return [];
    } catch (error) {
      console.error('Error getting configurations:', error);
      // Return empty array with error handling
      return [];
    }
  },

  /**
   * Create a new game configuration with multiple format attempts
   */
  createConfiguration: async (config: GameConfiguration, apiConfig?: ApiConfig): Promise<GameConfiguration> => {
    if (!apiConfig?.baseUrl || apiConfig.useLocalMock) {
      return config;
    }

    const gameId = config.gameId;

    // Try multiple payload formats in sequence until one works
    const payloadFormats = [
      // Format 1: Minimal payload with top-level ID and nested config
      {
        name: "Minimal wrapped",
        payload: {
          "id": gameId,
          "config": {
            "gameId": gameId,
            "gameType": config.gameType || "slots",
            "theme": {
              "mainTheme": config.theme?.mainTheme || "Basic Theme",
              "artStyle": config.theme?.artStyle || "cartoon",
              "colorScheme": config.theme?.colorScheme || "warm-vibrant",
              "mood": config.theme?.mood || "playful",
              "description": config.theme?.description || "Basic slot game configuration"
            },
            "bet": {
              "min": config.bet?.min || 0.20,
              "max": config.bet?.max || 100,
              "increment": config.bet?.increment || 0.20
            }
          }
        }
      },
      // Format 2: Direct payload with key fields
      {
        name: "Direct config",
        payload: {
          "gameId": gameId,
          "gameType": config.gameType || "slots",
          "theme": {
            "mainTheme": config.theme?.mainTheme || "Basic Theme",
            "artStyle": config.theme?.artStyle || "cartoon",
            "colorScheme": config.theme?.colorScheme || "warm-vibrant",
            "mood": config.theme?.mood || "playful",
            "description": config.theme?.description || "Basic slot game configuration"
          },
          "bet": {
            "min": config.bet?.min || 0.20,
            "max": config.bet?.max || 100,
            "increment": config.bet?.increment || 0.20
          }
        }
      },
      // Format 3: Combined approach with both top-level ID and direct config
      {
        name: "Combined ID and config",
        payload: {
          "id": gameId,
          "gameId": gameId,
          "gameType": config.gameType || "slots",
          "theme": {
            "mainTheme": config.theme?.mainTheme || "Basic Theme",
            "artStyle": config.theme?.artStyle || "cartoon",
            "colorScheme": config.theme?.colorScheme || "warm-vibrant",
            "mood": config.theme?.mood || "playful",
            "description": config.theme?.description || "Basic slot game configuration"
          },
          "bet": {
            "min": config.bet?.min || 0.20,
            "max": config.bet?.max || 100,
            "increment": config.bet?.increment || 0.20
          }
        }
      },
      // Format 4: Full configuration in wrapped format
      {
        name: "Full wrapped config",
        payload: {
          "id": gameId,
          "config": config
        }
      },
      // Format 5: Full configuration direct format
      {
        name: "Full direct config",
        payload: config
      }
    ];

    // Try each format in sequence
    for (const format of payloadFormats) {
      try {
        const result = await apiRequest<unknown>(
          '/configurations',
          'POST',
          format.payload,
          apiConfig
        );


        // Process the response based on its format
        if (result && typeof result === 'object') {
          if ('config' in result) {
            return {
              ...(result as any).config,
              gameId: (result as any).config.gameId || (result as any).id || gameId
            };
          } else if ('gameId' in result) {
            return result as GameConfiguration;
          }
        }

        // If result format is unrecognized, return original config with gameId
        return {
          ...config,
          gameId
        };
      } catch (error) {
        console.error(`Format ${format.name} failed:`, error);
        // Continue to next format
      }
    }

    // If all formats fail, throw error with helpful message
    throw new Error(`Failed to create configuration with gameId "${gameId}" after trying multiple formats. Check API documentation for required format.`);
  },

  /**
   * Get a specific game configuration with improved error handling
   */
  getConfiguration: async (
    gameId: string,
    options?: {
      version?: string,
      includeMetadata?: boolean
    },
    apiConfig?: ApiConfig
  ): Promise<GameConfiguration> => {
    if (!apiConfig?.baseUrl || apiConfig.useLocalMock) {
      // Return mock data for specific gameId
      return {
        gameId: gameId,
        gameType: "slots",
        theme: {
          mainTheme: `${gameId} Theme`,
          artStyle: "cartoon",
          colorScheme: "warm-vibrant",
          mood: "playful",
          description: `Generated slot game for ${gameId}`,
          name: gameId,
          primaryColor: "#33ccaa",
          secondaryColor: "#ff9933",
          generated: {
            background: "/public/themes/deep-ocean.png",
            symbols: ["/public/themes/deep-ocean.png"],
            frame: null
          }
        },
        bet: {
          min: 0.20,
          max: 100,
          increment: 0.20
        }
      };
    }

    // Build query string
    const queryParams = options ?
      `?${Object.entries(options)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&')}` :
      '';

    try {
      const result = await apiRequest<unknown>(
        `/configurations/${encodeURIComponent(gameId)}${queryParams}`,
        'GET',
        undefined,
        apiConfig
      );

      // Process the response based on its format
      if (result && typeof result === 'object') {
        if ('config' in result) {
          // Wrapped format
          const config = (result as any).config;
          if (!config.gameId && (result as any).id) {
            config.gameId = (result as any).id;
          }
          return config;
        } else if ('gameId' in result) {
          // Direct format
          return result as GameConfiguration;
        }
      }

      // If result format is unrecognized, create a minimal configuration
      console.warn('Unrecognized API response format, creating minimal configuration');
      return {
        gameId: gameId,
        gameType: "slots",
        theme: {
          mainTheme: "Default Theme",
          artStyle: "cartoon",
          colorScheme: "warm-vibrant",
          mood: "playful",
          description: "Generated slot game",
          name: "tropical",
          primaryColor: "#33ccaa",
          secondaryColor: "#ff9933"
        },
        bet: {
          min: 0.20,
          max: 100,
          increment: 0.20
        }
      };
    } catch (error) {
      console.error(`Error getting configuration for ${gameId}:`, error);
      // Create a minimal game configuration to avoid breaking the UI
      return {
        gameId: gameId,
        gameType: "slots",
        theme: {
          mainTheme: "Default Theme",
          artStyle: "cartoon",
          colorScheme: "warm-vibrant",
          mood: "playful",
          description: "Generated slot game",
          name: "tropical",
          primaryColor: "#33ccaa",
          secondaryColor: "#ff9933"
        },
        bet: {
          min: 0.20,
          max: 100,
          increment: 0.20
        }
      };
    }
  },

  /**
   * Update a game configuration with multiple format attempts
   */
  updateConfiguration: async (
    gameId: string,
    config: GameConfiguration,
    apiConfig?: ApiConfig
  ): Promise<GameConfiguration> => {
    if (!apiConfig?.baseUrl || apiConfig.useLocalMock) {
      return {
        ...config,
        gameId
      };
    }


    // Try multiple payload formats in sequence until one works
    const payloadFormats = [
      // Format 1: Minimal wrapped payload
      {
        name: "Minimal wrapped",
        payload: {
          "id": gameId,
          "config": {
            "gameId": gameId,
            "gameType": config.gameType || "slots",
            "theme": {
              "mainTheme": config.theme?.mainTheme || "Basic Theme",
              "artStyle": config.theme?.artStyle || "cartoon",
              "colorScheme": config.theme?.colorScheme || "warm-vibrant",
              "mood": config.theme?.mood || "playful",
              "description": config.theme?.description || "Basic slot game configuration"
            },
            "bet": {
              "min": config.bet?.min || 0.20,
              "max": config.bet?.max || 100,
              "increment": config.bet?.increment || 0.20
            }
          }
        }
      },
      // Format 2: Direct payload
      {
        name: "Direct payload",
        payload: {
          "gameId": gameId,
          ...config
        }
      },
      // Format 3: Full wrapped config
      {
        name: "Full wrapped config",
        payload: {
          "id": gameId,
          "config": {
            ...config,
            gameId
          }
        }
      }
    ];

    // Try each format in sequence
    for (const format of payloadFormats) {
      try {
        const result = await apiRequest<unknown>(
          `/configurations/${encodeURIComponent(gameId)}`,
          'PUT',
          format.payload,
          apiConfig
        );


        // Process the response based on its format
        if (result && typeof result === 'object') {
          if ('config' in result) {
            return {
              ...(result as any).config,
              gameId: (result as any).config.gameId || (result as any).id || gameId
            };
          } else if ('gameId' in result) {
            return result as GameConfiguration;
          }
        }

        // If result format is unrecognized, return original config with gameId
        return {
          ...config,
          gameId
        };
      } catch (error) {
        console.error(`Update format ${format.name} failed:`, error);
        // Continue to next format
      }
    }

    // Try PATCH as fallback if PUT fails
    try {
      const patchResult = await this.patchConfiguration(gameId, config, apiConfig);
      return patchResult;
    } catch (patchError) {
      console.error('PATCH fallback also failed:', patchError);
    }

    // If all formats fail, throw error with helpful message
    throw new Error(`Failed to update configuration with gameId "${gameId}" after trying multiple formats.`);
  },

  /**
   * Partially update a game configuration with improved error handling
   */
  patchConfiguration: async (
    gameId: string,
    updates: Partial<GameConfiguration>,
    apiConfig?: ApiConfig
  ): Promise<GameConfiguration> => {
    if (!apiConfig?.baseUrl || apiConfig.useLocalMock) {
      return {
        ...updates,
        gameId
      } as GameConfiguration;
    }


    // Try multiple payload formats for PATCH
    const payloadFormats = [
      // Format 1: Wrapped updates
      {
        name: "Wrapped updates",
        payload: {
          id: gameId,
          config: updates
        }
      },
      // Format 2: Direct updates
      {
        name: "Direct updates",
        payload: {
          ...updates,
          gameId
        }
      }
    ];

    // Try each format in sequence
    for (const format of payloadFormats) {
      try {
        const result = await apiRequest<unknown>(
          `/configurations/${encodeURIComponent(gameId)}`,
          'PATCH',
          format.payload,
          apiConfig
        );


        // Process the response based on its format
        if (result && typeof result === 'object') {
          if ('config' in result) {
            return {
              ...(result as any).config,
              gameId: (result as any).config.gameId || (result as any).id || gameId
            };
          } else if ('gameId' in result) {
            return result as GameConfiguration;
          }
        }

        // If result format is unrecognized, attempt to get the current configuration
        return await this.getConfiguration(gameId, undefined, apiConfig);
      } catch (error) {
        console.error(`Patch format ${format.name} failed:`, error);
        // Continue to next format
      }
    }

    // If all formats fail, throw error with helpful message
    throw new Error(`Failed to patch configuration with gameId "${gameId}" after trying multiple formats.`);
  },

  /**
   * Delete a game configuration with improved error handling
   */
  deleteConfiguration: async (
    gameId: string,
    softDelete?: boolean,
    apiConfig?: ApiConfig
  ): Promise<void> => {
    if (!apiConfig?.baseUrl || apiConfig.useLocalMock) {
      return;
    }

    const queryParams = softDelete !== undefined ? `?softDelete=${softDelete}` : '';

    try {
      return await apiRequest<void>(
        `/configurations/${encodeURIComponent(gameId)}${queryParams}`,
        'DELETE',
        undefined,
        apiConfig
      );
    } catch (error) {
      // Special case - if we get a 404, consider the delete "successful"
      if (error instanceof Error && error.message.includes('(404)')) {
        return;
      }
      throw error;
    }
  },

  /**
   * Clone a game configuration with improved error handling
   */
  cloneConfiguration: async (
    sourceGameId: string,
    options: CloneOptions,
    apiConfig?: ApiConfig
  ): Promise<GameConfiguration> => {
    if (!apiConfig?.baseUrl || apiConfig.useLocalMock) {

      // Get the source config (as a mock) and adjust the gameId
      const sourceConfig = await this.getConfiguration(sourceGameId, undefined, apiConfig);
      return {
        ...sourceConfig,
        gameId: options.newGameId
      };
    }


    // Try multiple payload formats for cloning
    const payloadFormats = [
      // Format 1: API Documentation format
      {
        name: "Documentation format",
        payload: {
          newGameId: options.newGameId
        }
      },
      // Format 2: Alternative format with target ID
      {
        name: "Alternative format",
        payload: {
          targetGameId: options.newGameId,
          overrides: options.overrides
        }
      },
      // Format 3: Both fields format
      {
        name: "Combined format",
        payload: {
          newGameId: options.newGameId,
          targetGameId: options.newGameId,
          overrides: options.overrides
        }
      }
    ];

    // Try each format in sequence
    for (const format of payloadFormats) {
      try {
        const result = await apiRequest<unknown>(
          `/configurations/${encodeURIComponent(sourceGameId)}/clone`,
          'POST',
          format.payload,
          apiConfig
        );


        // Process the response based on its format
        if (result && typeof result === 'object') {
          if ('config' in result) {
            return {
              ...(result as any).config,
              gameId: (result as any).config.gameId || (result as any).id || options.newGameId
            };
          } else if ('gameId' in result) {
            return result as GameConfiguration;
          }
        }

        // If response is unrecognized, try to fetch the new configuration directly
        return await this.getConfiguration(options.newGameId, undefined, apiConfig);
      } catch (error) {
        console.error(`Clone format ${format.name} failed:`, error);
        // Continue to next format
      }
    }

    // If API cloning fails, fallback to manual copy method
    try {

      // Get source configuration
      const sourceConfig = await this.getConfiguration(sourceGameId, undefined, apiConfig);

      // Create new configuration based on source
      const newConfig: GameConfiguration = {
        ...sourceConfig,
        ...options.overrides,
        gameId: options.newGameId
      };

      // Create the new configuration
      return await this.createConfiguration(newConfig, apiConfig);
    } catch (fallbackError) {
      console.error('Manual copy fallback also failed:', fallbackError);
      throw new Error(`Failed to clone configuration from "${sourceGameId}" to "${options.newGameId}" after trying multiple methods.`);
    }
  },

  /**
   * Save game configuration to RGS config API
   */
  saveGameConfig: async (
    gameId: string,
    gameStoreData: Partial<GameConfig>,
    theme?: string | null,
    additionalData?: Record<string, any>,
    apiConfig?: ApiConfig
  ): Promise<{ success: boolean; message?: string; data?: any }> => {
    try {
      // Use RGS config API base URL
      const rgsApiConfig = {
        baseUrl: 'https://rgs-config.onrender.com',
        ...apiConfig
      };

      // Determine game type - check store first, then additionalData, default to slots
      const isScratch = gameStoreData.selectedGameType?.includes('scratch') || additionalData?.gameType === 'scratch';
      const gameType = isScratch ? 'scratch' : (additionalData?.gameType || "slots");

      // Build the final payload with proper structure
      const payload: any = {
        gameId: gameId,
        gameType: gameType,
        theme: {
          mainTheme: theme || gameStoreData.theme?.mainTheme || 'Default Theme',
          artStyle: gameStoreData.theme?.artStyle || 'cartoon',
          colorScheme: gameStoreData.theme?.colorScheme || 'warm-vibrant',
          mood: gameStoreData.theme?.mood || 'playful',
          description: gameStoreData.theme?.description || 'Generated game',
          name: gameStoreData.theme?.name || gameStoreData.displayName || 'tropical',
          primaryColor: gameStoreData.theme?.colors?.primary || '#33ccaa',
          secondaryColor: gameStoreData.theme?.colors?.secondary || '#ff9933'
        },
        bet: {
          min: gameStoreData.bet?.min || 0.20,
          max: gameStoreData.bet?.max || 100,
          increment: gameStoreData.bet?.increment || 0.20
        }
      };

      // Add scratch config if applicable
      if (isScratch && gameStoreData.scratch) {
        payload.scratch = gameStoreData.scratch;
      }

      // Add theme ID if provided
      if (additionalData?.themeId) {
        payload.theme.selectedThemeId = additionalData.themeId;
      }

      // Add optional fields if they exist
      if (gameStoreData.rtp) {
        payload.rtp = {
          baseRTP: gameStoreData.rtp.baseRTP || 92,
          bonusRTP: gameStoreData.rtp.bonusRTP || 2,
          featureRTP: gameStoreData.rtp.featureRTP || 2,
          targetRTP: gameStoreData.rtp.targetRTP || 96,
          volatilityScale: gameStoreData.rtp.volatilityScale || 5
        };
      }

      if (gameStoreData.volatility) {
        payload.volatility = gameStoreData.volatility;
      }

      // Only add reels config if it's NOT a scratch card or if explicit reel data exists
      if (!isScratch && gameStoreData.reels) {
        payload.reels = {
          payMechanism: gameStoreData.reels.payMechanism || 'betlines',
          layout: {
            shape: gameStoreData.reels.layout?.shape || 'rectangle',
            reels: gameStoreData.reels.layout?.reels || 5,
            rows: gameStoreData.reels.layout?.rows || 3
          },
          betlines: gameStoreData.reels.betlines || 25,
          spinDirection: gameStoreData.reels.spinDirection || 'vertical'
        };
      }

      // Map additional data to correct structure
      if (additionalData) {
        if (additionalData.gameType) {
          payload.gameType = additionalData.gameType;
        }
        if (additionalData.reelConfig && !isScratch) {
          const [reels, rows] = additionalData.reelConfig.split('x').map(Number);
          payload.reels = {
            ...(payload.reels || {}),
            layout: {
              ...(payload.reels?.layout || {}),
              reels,
              rows
            }
          };
        }
        if (additionalData.betlines && !isScratch) {
          payload.reels = {
            ...(payload.reels || {}),
            betlines: additionalData.betlines
          };
        }
      }

      // Make API call to save config (direct endpoint without /v1)
      const baseUrl = normalizeApiUrl(rgsApiConfig.baseUrl);
      const url = `${baseUrl}/config/save`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(rgsApiConfig.apiKey ? { 'Authorization': `Bearer ${rgsApiConfig.apiKey}` } : {})
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RGS API error (${response.status}): ${errorText}`);
      }

      const result = response.status === 204 ? {} : await response.json();

      return {
        success: true,
        message: 'Game configuration saved successfully',
        data: result
      };
    } catch (error) {
      console.error('Error in saveGameConfig:', error);
      return { success: false, message: error instanceof Error ? error.message : "Unknown error", gameId: gameId || "" };
    }
  },



  /**
   * Save game configuration to RGS config API (Workshop)
   */
  saveToWorkshop: async (
    gameId: string,
    gameStoreData: Partial<GameConfig>,
    apiConfig?: ApiConfig
  ): Promise<{ success: boolean; message?: string; data?: any }> => {
    // Reuse saveGameConfig logic but explicitly for Workshop
    return slotApiClient.saveGameConfig(gameId, gameStoreData, null, { context: 'workshop' }, apiConfig);
  },

  /**
   * Publish certified game to RGS
   */
  publishToRGS: async (
    gameId: string,
    certificationTicket: string,
    apiConfig?: ApiConfig
  ): Promise<{ success: boolean; version: string; endpoint: string; deployedAt: string }> => {
    try {
      // Use RGS config API base URL or override
      const rgsApiConfig = {
        baseUrl: getRgsBaseUrl(),
        ...apiConfig
      };

      const baseUrl = normalizeApiUrl(rgsApiConfig.baseUrl);
      // Endpoint for publishing validated games
      const url = `${baseUrl}/publish/rgs`;

      const payload = {
        gameId,
        ticketId: certificationTicket,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(rgsApiConfig.apiKey ? { 'Authorization': `Bearer ${rgsApiConfig.apiKey}` } : {})
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (!response.ok) {
        // Fallback for demo/dev environment if the endpoint doesn't exist yet
        if (response.status === 404) {
          console.warn("RGS Publish Endpoint not found, simulating success for dev");
          return {
            success: true,
            version: "1.0.0-dev",
            // Use local demo link for development context
            endpoint: `http://localhost:5173/play/demo/${gameId}`,
            deployedAt: new Date().toISOString()
          };
        }
        const errorText = await response.text();
        throw new Error(`RGS Publish Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      return {
        success: true,
        version: result.version || '1.0.0',
        endpoint: result.endpoint || `https://rgs.slotai.com/play/${gameId}`,
        deployedAt: result.deployedAt || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to publish to RGS:', error);
      throw error;
    }
  },

  /**
   * Fetch game configurations from RGS API
   */
  fetchGameConfigs: async (
    page: number = 1,
    pageSize: number = 50,
    apiConfig?: ApiConfig
  ): Promise<{ configs: any[]; metadata: any }> => {
    try {

      // Use RGS config API base URL
      const rgsApiConfig = {
        baseUrl: 'https://rgs-config.onrender.com',
        ...apiConfig
      };

      const baseUrl = normalizeApiUrl(rgsApiConfig.baseUrl);
      const url = `${baseUrl}/configs?page=${page}&pageSize=${pageSize}`;


      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(rgsApiConfig.apiKey ? { 'Authorization': `Bearer ${rgsApiConfig.apiKey}` } : {})
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RGS API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      return {
        configs: result.configs || [],
        metadata: result.metadata || { currentPage: 1, pageSize: 10, totalRecords: 0 }
      };
    } catch (error) {
      console.error('Failed to fetch game configs:', error);
      return {
        configs: [],
        metadata: { currentPage: 1, pageSize: 10, totalRecords: 0 }
      };
    }
  },

  /**
   * Convert from SlotAI GameConfig to API GameConfiguration with improved validation
   */
  convertToApiConfig: (config: Partial<GameConfig>, gameId: string): ApiResponse => {
    // Validate and clean the gameId
    const safeGameId = gameId.trim() || `game_${Date.now()}`;

    // Create a base configuration to ensure all required fields
    const configResult: GameConfiguration = {
      gameId: safeGameId,
      gameType: "slots",
      theme: {
        mainTheme: config.theme?.mainTheme || 'Default Theme',
        artStyle: config.theme?.artStyle || 'cartoon',
        colorScheme: config.theme?.colorScheme || 'warm-vibrant',
        mood: config.theme?.mood || 'playful',
        description: config.theme?.description || 'Generated slot game',
        name: config.theme?.name || "tropical",
        primaryColor: config.theme?.primaryColor || "#33ccaa",
        secondaryColor: config.theme?.secondaryColor || "#ff9933",
        includeCardSymbols: config.theme?.includeCardSymbols,
        includeWild: config.theme?.includeWild,
        includeScatter: config.theme?.includeScatter,
        selectedSymbols: config.theme?.selectedSymbols,
        generated: config.theme?.generated
      },
      bet: {
        min: config.bet?.min || 0.20,
        max: config.bet?.max || 100,
        increment: config.bet?.increment || 0.20,
        quickOptions: config.bet?.quickOptions,
        defaultBet: config.bet?.defaultBet,
        maxLines: config.bet?.maxLines
      }
    };

    // Only add optional fields if they exist to reduce payload size
    if (config.rtp) {
      configResult.rtp = {
        baseRTP: config.rtp.baseRTP || 92,
        bonusRTP: config.rtp.bonusRTP || 2,
        featureRTP: config.rtp.featureRTP || 2,
        targetRTP: config.rtp.targetRTP || 96,
        volatilityScale: config.rtp.volatilityScale || 5,
        variants: config.rtp.variants
      };
    }

    if (config.volatility) {
      configResult.volatility = config.volatility;
    }

    if (config.reels) {
      configResult.reels = {
        ...config.reels,
        // Convert number keys to string keys for payouts in symbol list
        symbols: config.reels.symbols ? {
          ...config.reels.symbols,
          list: config.reels.symbols.list?.map(symbol => ({
            ...symbol,
            payouts: symbol.payouts ? Object.fromEntries(
              Object.entries(symbol.payouts).map(([k, v]) => [String(k), v])
            ) : {}
          }))
        } : undefined
      };
    }

    if (config.bonus) configResult.bonus = config.bonus;
    if (config.audio) configResult.audio = config.audio;
    if (config.playerExperience) configResult.playerExperience = config.playerExperience;
    if (config.mobile) configResult.mobile = config.mobile;
    if (config.analytics) configResult.analytics = config.analytics;
    if (config.certification) configResult.certification = config.certification;
    if (config.distribution) configResult.distribution = config.distribution;
    if (config.gameRules) configResult.gameRules = config.gameRules;
    if (config.gameRules) configResult.gameRules = config.gameRules;
    if (config.localization) configResult.localization = config.localization;
    if (config.scratch) configResult.scratch = config.scratch;

    // Create the wrapper structure that the API expects based on documentation
    return {
      id: safeGameId,
      config: configResult
    };
  },

  /**
   * Convert from API GameConfiguration to SlotAI GameConfig with improved validation
   */
  convertFromApiConfig: (apiConfig: GameConfiguration): Partial<GameConfig> => {
    // Create a base config with defaults
    const baseConfig = CONFIG_DEFAULTS;

    // Safety check for null/undefined apiConfig
    if (!apiConfig) {
      console.warn('Received null or undefined apiConfig, returning defaults');
      return baseConfig;
    }

    // Merge with API config, preferring API values where they exist
    return {
      // Include gameId in the root for convenient access
      gameId: apiConfig.gameId,

      theme: {
        ...baseConfig.theme,
        ...(apiConfig.theme as any || {}),
        // Ensure references array exists
        references: apiConfig.theme?.references || []
      },

      bet: {
        ...baseConfig.bet,
        ...(apiConfig.bet || {})
      },

      rtp: apiConfig.rtp ? {
        ...baseConfig.rtp,
        ...(apiConfig.rtp as any),
        // Calculate targetRTP if not provided directly
        targetRTP: apiConfig.rtp.targetRTP ||
          ((apiConfig.rtp.baseRTP || 92) + (apiConfig.rtp.bonusRTP || 0) + (apiConfig.rtp.featureRTP || 0)),
        variants: apiConfig.rtp.variants || baseConfig.rtp.variants
      } : baseConfig.rtp,

      volatility: apiConfig.volatility ? {
        ...baseConfig.volatility,
        ...(apiConfig.volatility as any)
      } : baseConfig.volatility,

      reels: apiConfig.reels ? {
        ...baseConfig.reels,
        ...(apiConfig.reels as any),
        layout: {
          ...baseConfig.reels.layout,
          ...(apiConfig.reels.layout || {})
        },
        symbols: {
          ...baseConfig.reels.symbols,
          ...(apiConfig.reels.symbols || {}),
          list: apiConfig.reels.symbols?.list || []
        }
      } : baseConfig.reels,

      bonus: apiConfig.bonus ? {
        ...baseConfig.bonus,
        ...(apiConfig.bonus as any)
      } : baseConfig.bonus,

      audio: apiConfig.audio ? {
        ...baseConfig.audio,
        ...(apiConfig.audio as any)
      } : baseConfig.audio,

      playerExperience: apiConfig.playerExperience ? {
        ...baseConfig.playerExperience,
        ...(apiConfig.playerExperience as any)
      } : baseConfig.playerExperience,

      mobile: apiConfig.mobile ? {
        ...baseConfig.mobile,
        ...(apiConfig.mobile as any)
      } : baseConfig.mobile,

      analytics: apiConfig.analytics ? {
        ...baseConfig.analytics,
        ...(apiConfig.analytics as any)
      } : baseConfig.analytics,

      certification: apiConfig.certification ? {
        ...baseConfig.certification,
        ...(apiConfig.certification as any)
      } : baseConfig.certification,

      distribution: apiConfig.distribution ? {
        ...baseConfig.distribution,
        ...(apiConfig.distribution as any)
      } : baseConfig.distribution,

      gameRules: apiConfig.gameRules ? {
        ...baseConfig.gameRules,
        ...(apiConfig.gameRules as any)
      } : baseConfig.gameRules,

      localization: apiConfig.localization ? {
        ...baseConfig.localization,
        ...(apiConfig.localization as any)
      } : baseConfig.localization,

      scratch: apiConfig.scratch ? {
        ...baseConfig.scratch,
        ...(apiConfig.scratch as any)
      } : baseConfig.scratch
    };
  }
};