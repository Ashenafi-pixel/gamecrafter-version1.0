// Simple Express server for SlotAI
const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
// Use current working directory as __dirname
const __dirname = process.cwd();

const app = express();
app.use(cors());
app.use(express.json());

// Use port 3500 to avoid conflicts with Fooocus (8888)
const PORT = 3500;

// Serve the built files if they exist
app.use(express.static(path.join(__dirname, 'dist')));

// Also serve the source files for development
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

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

// Add a configurations mock endpoint for testing
app.get('/api/v1/configurations', (req, res) => {
  res.json([
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
  ]);
});

// Add mock image generation endpoint
app.post('/api/v1/generation/text-to-image', (req, res) => {
  const prompt = req.body.prompt || '';
  
  // Generate a color based on prompt content
  let colorHex = '6082B6'; // Default blue

  if (prompt.toLowerCase().includes('egypt')) {
    colorHex = 'CD853F';
  } else if (prompt.toLowerCase().includes('space')) {
    colorHex = '4B0082';
  } else if (prompt.toLowerCase().includes('forest')) {
    colorHex = '228B22';
  } else if (prompt.toLowerCase().includes('ocean')) {
    colorHex = '1E90FF';
  }
  
  // Generate text based on symbol type
  let symbolText = 'SYMBOL';
  
  if (prompt.toLowerCase().includes('wild')) {
    symbolText = 'WILD';
    colorHex = 'FFD700';
  } else if (prompt.toLowerCase().includes('scatter')) {
    symbolText = 'SCATTER';
  } else if (prompt.toLowerCase().includes('high')) {
    symbolText = 'HIGH';
  } else if (prompt.toLowerCase().includes('medium')) {
    symbolText = 'MED';
  } else if (prompt.toLowerCase().includes('low')) {
    symbolText = 'LOW';
  }
  
  // Return a mock image generation response
  res.json({
    success: true,
    images: [
      {
        url: `https://placehold.co/512x512/${colorHex}/FFFFFF/png?text=${encodeURIComponent(symbolText)}`,
        seed: Math.floor(Math.random() * 10000)
      }
    ],
    parameters: {
      prompt: prompt,
      negative_prompt: req.body.negative_prompt || "",
      seed: Math.floor(Math.random() * 10000)
    }
  });
});

// Serve the root index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SlotAI server running on http://localhost:${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
  console.log('To stop the server, press Ctrl+C');
});