import { Anthropic } from '@anthropic-ai/sdk';

export const handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  if (!process.env.CLAUDE_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'CLAUDE_API_KEY environment variable is not set' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { type, gameDescription, messages } = body;

    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });

    switch (type) {
      case 'test': {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 100,
            messages: [{ role: 'user', content: 'Test message' }]
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        } catch (error) {
          console.error('Test connection error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to connect to Claude API' })
          };
        }
      }

      case 'analyze': {
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'system',
              content: `You are an expert slot game designer AI assistant. Analyze the following slot game description and help refine the concept by asking relevant questions about missing or unclear elements. Focus on:

1. Core mechanics (reels, paylines)
2. Mathematical model (RTP, volatility)
3. Theme and visuals
4. Special features and bonus games
5. Player engagement elements

Be conversational and helpful. Ask one question at a time, focusing on the most critical missing elements first. Provide suggestions based on current slot game trends and player preferences.`
            },
            { role: 'user', content: gameDescription }
          ]
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ content: response.content[0].text })
        };
      }

      case 'chat': {
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 1000,
          messages
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ content: response.content[0].text })
        };
      }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid type' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};