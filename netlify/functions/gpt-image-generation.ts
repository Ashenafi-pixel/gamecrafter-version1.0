import { Handler } from '@netlify/functions';

interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  size?: string;
  quality?: string;
  n?: number;
  test?: boolean;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_ORG_ID = 'org-EbZLwKpoPUaLvuyhZJid8rUF';
const GPT_IMAGE_MODEL = 'gpt-4.1-mini';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Origin, X-Requested-With',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const requestBody: ImageGenerationRequest = JSON.parse(event.body || '{}');
    const { prompt, model = 'gpt-image-1', size = '512x512', quality = 'standard', n = 1, test = false } = requestBody;

    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not configured on the server');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'Image generation is not configured. Missing OPENAI_API_KEY.' })
      };
    }

    // Handle test connection
    if (test) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'GPT-image-1 connection test successful' })
      };
    }

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }

    console.log('🎨 Generating image with working model:', GPT_IMAGE_MODEL, 'prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Organization': OPENAI_ORG_ID
      },
      body: JSON.stringify({
        model: GPT_IMAGE_MODEL,
        prompt: prompt,
        media_type: 'image/png',
        count: n || 1
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const choice = data.choices[0];
      const imageUrl = choice.message?.content || choice.content;
      console.log('✅ Image generated successfully with', GPT_IMAGE_MODEL);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          imageUrl: imageUrl,
          model: GPT_IMAGE_MODEL,
          prompt: prompt,
          seed: Math.floor(Math.random() * 10000)
        })
      };
    } else {
      throw new Error('No image data received from OpenAI');
    }
    
  } catch (error) {
    console.error('❌ Image generation failed:', error);
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Check server logs for more information'
      })
    };
  }
};