import { Handler } from '@netlify/functions';

interface GenerateRequest {
  theme: any;
  symbolIndex?: number;
}

// Default placeholder images
const PLACEHOLDER_IMAGES = {
  background: 'https://placehold.co/1920x1080/808080/ffffff?text=Background',
  frame: 'https://placehold.co/1024x1024/808080/ffffff?text=Frame',
  wild: '/public/themes/base-style.avif',
  scatter: '/public/themes/ancient-egypt.avif',
  high: '/public/themes/cosmic-adventure.avif',
  medium: '/public/themes/deep-ocean.avif',
  low: '/public/themes/enchanted-forest.avif'
};

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Origin, X-Requested-With',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 204, 
      headers
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const { theme, symbolIndex }: GenerateRequest = JSON.parse(event.body);

    if (!theme?.mainTheme) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Theme configuration is required' })
      };
    }

    // Generate a single symbol
    if (typeof symbolIndex === 'number') {
      // Select an appropriate placeholder based on the index
      const placeholderTypes = ['wild', 'scatter', 'high', 'high', 'medium', 'medium', 'low', 'low', 'low', 'low'];
      const symbolType = placeholderTypes[symbolIndex % placeholderTypes.length] || 'low';
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          symbol: PLACEHOLDER_IMAGES[symbolType] || `https://placehold.co/1024x1024/808080/ffffff?text=Symbol+${symbolIndex + 1}`
        })
      };
    }

    // Generate initial assets with placeholders
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        background: PLACEHOLDER_IMAGES.background,
        frame: PLACEHOLDER_IMAGES.frame,
        symbols: [
          PLACEHOLDER_IMAGES.wild,
          PLACEHOLDER_IMAGES.scatter,
          PLACEHOLDER_IMAGES.high,
          PLACEHOLDER_IMAGES.high,
          PLACEHOLDER_IMAGES.medium,
          PLACEHOLDER_IMAGES.medium,
          PLACEHOLDER_IMAGES.low,
          PLACEHOLDER_IMAGES.low,
          PLACEHOLDER_IMAGES.low,
          PLACEHOLDER_IMAGES.low,
          PLACEHOLDER_IMAGES.low,
          PLACEHOLDER_IMAGES.low
        ],
        partial: true
      })
    };
  } catch (error: any) {
    console.error('Error generating images:', error);
    
    return {
      statusCode: error?.status || 500,
      headers,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate images',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};