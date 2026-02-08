// Simple Express server for SlotAI
const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Use port 3500 to avoid conflicts with Fooocus (8888)
const PORT = 3600; // Changed to 3600 to avoid potential conflicts

// Serve the built files if they exist
// NOTE: API routes will be defined before static files to ensure they take priority

// We'll serve static files AFTER all API routes are defined
// This will be moved to the bottom of the file

// Add a CORS proxy for the API
app.use('/api-proxy', async (req, res) => {
  // Get the target URL from the query parameter
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    // Create a new request to the target URL with the same method, headers, and body
    const axiosOptions = {
      method: req.method,
      headers: {
        ...req.headers,
        'host': new URL(targetUrl).host, // Fix the host header
      },
      url: targetUrl,
    };

    // Forward the body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      axiosOptions.data = req.body;
    }

    // Make the request to the target URL
    const response = await axios(axiosOptions);

    // Return the response with the appropriate status code and headers
    res.status(response.status);
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Send the response body
    res.send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    // If we have a response from the server, forward it
    if (error.response) {
      res.status(error.response.status).json({
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    } else {
      // Otherwise return a generic error
      res.status(500).json({
        error: error.message,
        code: 'PROXY_ERROR'
      });
    }
  }
});

// API route middleware to ensure API routes return JSON
app.use('/api', (req, res, next) => {
  // Force Content-Type for ALL API responses to be application/json
  res.type('application/json');
  
  // Override the original res.send to enforce JSON content type
  const originalSend = res.send;
  res.send = function() {
    res.set('Content-Type', 'application/json');
    return originalSend.apply(res, arguments);
  };
  
  // Same for res.json to be extra safe
  const originalJson = res.json;
  res.json = function() {
    res.set('Content-Type', 'application/json');
    return originalJson.apply(res, arguments);
  };
  
  next();
});

// Add a configurations mock endpoint for testing
app.get('/api/v1/configurations', (req, res) => {
  console.log('API CONFIGURATIONS ENDPOINT HIT');
  // Force content type to be application/json
  res.set('Content-Type', 'application/json');
  
  const data = [
    {
      id: "mock-game-1",
      version: "v1",
      status: "active",
      config: {
        gameId: "mock-game-1",
        theme: {
          mainTheme: "Deep Ocean",
          artStyle: "cartoon",
          colorScheme: "cool-blue",
          mood: "mysterious",
          description: "Underwater adventure with sea creatures"
        },
        bet: {
          min: 0.20,
          max: 100,
          increment: 0.20
        }
      }
    },
    {
      id: "mock-game-2",
      version: "v1",
      status: "active",
      config: {
        gameId: "mock-game-2",
        theme: {
          mainTheme: "Ancient Egypt",
          artStyle: "realistic",
          colorScheme: "golden-warm",
          mood: "mysterious",
          description: "Ancient Egyptian treasures and artifacts"
        },
        bet: {
          min: 0.20,
          max: 100,
          increment: 0.20
        }
      }
    }
  ];
  
  console.log('Sending JSON response:', JSON.stringify(data).substring(0, 100) + '...');
  return res.json(data);
});

// OpenAI DALL-E 3 proxy endpoint
app.post('/api/v1/openai/dalle', async (req, res) => {
  // Set content type explicitly and firmly
  res.set({
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff' // Prevent content type sniffing
  });
  
  try {
    console.log('==========================================');
    console.log('Received OpenAI DALL-E 3 request');
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Query params:', JSON.stringify(req.query));
    console.log('Request body:', JSON.stringify(req.body));
    
    // Check if this is a mock request - reject it immediately
    if (req.query.mock === 'true') {
      console.log('Rejecting mock request - no mocks allowed');
      return res.status(403).json({
        error: 'Mock mode is disabled',
        message: 'Please use the direct OpenAI DALL-E 3 API with a valid API key',
        details: 'This application requires a valid OpenAI API key for image generation'
      });
    }
    
    // Get API key from header or use a default for testing (not recommended for production)
    const apiKey = req.headers['x-api-key'] || process.env.OPENAI_API_KEY || '';
    
    console.log('OpenAI API Key received:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length-4)}` : 'None');
    
    // Force direct OpenAI API call - no mocks
    console.log('FORCING DIRECT OPENAI API CALL - NO MOCKS');
    
    // If no API key, return an error
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key is required', 
        message: 'You must provide an OpenAI API key for DALL-E 3 image generation'
      });
    }
    
    // Forward request to OpenAI (real API call)
    try {
      console.log('Making REAL OpenAI API call with key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length-4)}` : 'No key provided');
      
      // Ensure we have the needed fields in the request body
      const requestBody = {
        prompt: req.body.prompt || 'A slot machine symbol',
        model: req.body.model || 'dall-e-3',
        n: req.body.n || 1,
        size: req.body.size || '1024x1024',
        quality: req.body.quality || 'standard',
        style: req.body.style || 'vivid',
        response_format: 'url'  // Always request URL format
      };
      
      console.log('Prepared OpenAI request body:', JSON.stringify(requestBody));
      
      // Log full headers for debugging (except Authorization)
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      
      console.log('Request headers:', JSON.stringify({
        'Content-Type': headers['Content-Type'],
        'Accept': headers['Accept'],
        'Authorization': apiKey ? 'Bearer sk-...REDACTED...' : 'Not provided'
      }));
      
      // Make the actual API call
      const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      // Handle error responses from OpenAI
      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error(`OpenAI API error: ${openaiResponse.status}`, errorText);
        
        // Return a structured error response
        return res.status(openaiResponse.status).json({ 
          error: `OpenAI API error: ${openaiResponse.status}`,
          details: errorText
        });
      }
      
      // Get OpenAI response as text first for logging
      const responseText = await openaiResponse.text();
      console.log('OpenAI response text (first 200 chars):', responseText.substring(0, 200) + '...');
      
      // Parse JSON
      let openaiData;
      try {
        openaiData = JSON.parse(responseText);
        console.log('OpenAI success response parsed:', JSON.stringify(openaiData, null, 2));
        
        // Validate the response structure
        if (!openaiData.data || !Array.isArray(openaiData.data) || !openaiData.data[0]) {
          console.error('Unexpected OpenAI response structure:', JSON.stringify(openaiData));
          
          // Try to fix the response structure if possible
          if (openaiData.url) {
            // If there's a direct URL, adapt it to the expected structure
            openaiData = {
              created: Date.now(),
              data: [
                {
                  url: openaiData.url,
                  revised_prompt: req.body.prompt,
                  model: 'dall-e-3'
                }
              ]
            };
            console.log('Adapted direct URL response to standard format');
          } else {
            return res.status(500).json({ 
              error: 'Invalid response structure from OpenAI',
              details: 'Response missing data array or URL',
              received: openaiData
            });
          }
        }
        
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', parseError);
        return res.status(500).json({ 
          error: 'Invalid JSON response from OpenAI',
          details: `Response text: ${responseText.substring(0, 100)}...`
        });
      }
      
      // Log the response before sending
      console.log('Sending OpenAI response to client with image URL:', 
        openaiData.data[0].url ? 
        `${openaiData.data[0].url.substring(0, 50)}...` : 
        'No URL found');
      
      // Ensure our Content-Type is set correctly
      res.set('Content-Type', 'application/json');
      
      // Return the OpenAI response
      return res.json(openaiData);
      
    } catch (openaiError) {
      console.error('Error calling OpenAI:', openaiError);
      
      // If the OpenAI API fails, send a helpful error response
      return res.status(500).json({ 
        error: 'Failed to call OpenAI API', 
        details: openaiError.message,
        suggestion: 'Check your API key validity or network connection'
      });
    }
  } catch (error) {
    console.error('Error processing OpenAI request:', error);
    
    // General error handler
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message
    });
  }
});

// Block mock image generation endpoint (no fallbacks allowed)
app.post('/api/v1/generation/text-to-image', (req, res) => {
  // Set content type explicitly 
  res.setHeader('Content-Type', 'application/json');
  
  // Return an error response indicating this endpoint is disabled
  console.log('Mock image generation endpoint is disabled. Direct OpenAI API calls only.');
  
  // Send a clear error message
  return res.status(403).json({
    error: 'Mock image generation is disabled',
    message: 'Please use the direct OpenAI DALL-E 3 API with a valid API key',
    details: 'This application requires a valid OpenAI API key for image generation'
  });
});

// API endpoints are defined above this line
// Only after all API routes are defined, add the static file routes

// ===============================================
// SERVE STATIC FILES (AFTER all API routes are defined)
// ===============================================

// Serve the built files if they exist
app.use(express.static(path.join(__dirname, 'dist')));

// Also serve the source files for development
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Serve the root index.html file
app.get('/', (req, res, next) => {
  // Make sure not to override API routes
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback for all other routes EXCEPT /api routes
app.get('*', (req, res, next) => {
  // Skip this middleware for API routes
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SlotAI server running on http://localhost:${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
  console.log('To stop the server, press Ctrl+C');
});