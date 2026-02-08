import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  // Log request details
  console.log('Request Details:', {
    httpMethod: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body ? JSON.parse(event.body) : null,
  });

  // Log environment variables
  console.log('Environment Variables:', {
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ? 'Set (hidden for security)' : 'undefined',
    NODE_ENV: process.env.NODE_ENV,
    NETLIFY_DEV: process.env.NETLIFY_DEV,
  });

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    // Check API key
    if (!process.env.CLAUDE_API_KEY) {
      console.error('CLAUDE_API_KEY is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'CLAUDE_API_KEY is not configured',
          debug: {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            isNetlifyDev: process.env.NETLIFY_DEV === 'true'
          }
        })
      };
    }

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Claude API Function is working!',
        debug: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          isNetlifyDev: process.env.NETLIFY_DEV === 'true',
          apiKeyConfigured: true
        }
      })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          isNetlifyDev: process.env.NETLIFY_DEV === 'true'
        }
      })
    };
  }
};