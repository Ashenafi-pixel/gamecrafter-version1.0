import { Handler } from '@netlify/functions';

/**
 * Proxies OpenAI Images API (v1/images/generations) so the API key stays server-side.
 * Set OPENAI_API_KEY in Netlify (or .env for local) for image generation to work.
 */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_ORG_ID = process.env.OPENAI_ORG_ID || '';

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

  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Image generation not configured. Set OPENAI_API_KEY on the server.'
      })
    };
  }

  try {
    const body = event.body || '{}';
    const parsed = JSON.parse(body) as Record<string, unknown>;

    const openaiHeaders: Record<string, string> = {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    };
    if (OPENAI_ORG_ID) {
      openaiHeaders['OpenAI-Organization'] = OPENAI_ORG_ID;
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: openaiHeaders,
      body: JSON.stringify(parsed)
    });

    const text = await response.text();
    if (!response.ok) {
      console.error('OpenAI Images API error:', response.status, text);
      return {
        statusCode: response.status,
        headers,
        body: text
      };
    }

    return {
      statusCode: 200,
      headers,
      body: text
    };
  } catch (error) {
    console.error('openai-images proxy failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Proxy error'
      })
    };
  }
};
