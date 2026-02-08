// Development Express server with API mocking for SlotAI
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
// Use current working directory as projectDir
const projectDir = process.cwd();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json());

// Use port 5173 for Vite compatibility
const PORT = 5173;

// Serve the built files if they exist
app.use(express.static(path.join(projectDir, 'dist')));

// Also serve the source files for development
app.use('/src', express.static(path.join(projectDir, 'src')));
app.use('/public', express.static(path.join(projectDir, 'public')));
app.use('/node_modules', express.static(path.join(projectDir, 'node_modules')));

// Sample game configurations storage
let gameConfigurations = {
  "wild-west-game": {
    "gameId": "wild-west-game",
    "theme": {
      "mainTheme": "Wild West",
      "artStyle": "realistic",
      "colorScheme": "desert-sunset",
      "mood": "adventurous",
      "description": "A thrilling slot game set in the American Old West with cowboys, outlaws, and gold rush elements"
    },
    "bet": {
      "min": 0.25,
      "max": 100,
      "increment": 0.25
    },
    "rtp": {
      "baseRTP": 90,
      "bonusRTP": 3,
      "featureRTP": 3,
      "targetRTP": 96,
      "volatilityScale": 7
    },
    "reels": {
      "payMechanism": "betlines",
      "layout": {
        "shape": "rectangle",
        "reels": 5,
        "rows": 3
      },
      "betlines": 20
    }
  },
  "space-adventure": {
    "gameId": "space-adventure",
    "theme": {
      "mainTheme": "Space Adventure",
      "artStyle": "cartoon",
      "colorScheme": "cosmic-dark",
      "mood": "exciting",
      "description": "An interstellar slot adventure with planets, astronauts, and alien creatures"
    },
    "bet": {
      "min": 0.20,
      "max": 100,
      "increment": 0.20
    },
    "rtp": {
      "baseRTP": 88,
      "bonusRTP": 5,
      "featureRTP": 3,
      "targetRTP": 96,
      "volatilityScale": 8
    },
    "reels": {
      "payMechanism": "betlines",
      "layout": {
        "shape": "rectangle",
        "reels": 5,
        "rows": 3
      },
      "betlines": 25
    }
  },
  "fruit-fiesta": {
    "gameId": "fruit-fiesta",
    "theme": {
      "mainTheme": "Fruit Fiesta",
      "artStyle": "cartoon",
      "colorScheme": "vibrant",
      "mood": "playful",
      "description": "A classic fruit-themed slot game with a modern twist"
    },
    "bet": {
      "min": 0.10,
      "max": 50,
      "increment": 0.10
    },
    "rtp": {
      "baseRTP": 92,
      "bonusRTP": 2,
      "featureRTP": 2,
      "targetRTP": 96,
      "volatilityScale": 4
    },
    "reels": {
      "payMechanism": "betlines",
      "layout": {
        "shape": "rectangle",
        "reels": 5,
        "rows": 3
      },
      "betlines": 10
    }
  }
};

// Create a directory for game configs if it doesn't exist
// Ensure the mock-db directory exists
const configsDir = path.join(projectDir, 'mock-db');
if (!fs.existsSync(configsDir)) {
  console.log('Creating mock-db directory for game configurations');
  fs.mkdirSync(configsDir, { recursive: true });
}

// Save the initial game configurations to files
console.log('Initializing mock API with sample game configurations');
Object.entries(gameConfigurations).forEach(([gameId, config]) => {
  const configPath = path.join(configsDir, `${gameId}.json`);
  if (!fs.existsSync(configPath)) {
    console.log(`Creating sample configuration: ${gameId}`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } else {
    console.log(`Configuration already exists: ${gameId}`);
  }
});

// Load configurations from files if available
try {
  const configFiles = fs.readdirSync(configsDir);
  configFiles.forEach(file => {
    if (file.endsWith('.json')) {
      const gameId = file.replace('.json', '');
      try {
        const configData = JSON.parse(fs.readFileSync(path.join(configsDir, file), 'utf8'));
        gameConfigurations[gameId] = configData;
      } catch (err) {
        console.error(`Error loading configuration ${file}:`, err);
      }
    }
  });
} catch (err) {
  console.error('Error loading configuration files:', err);
}

// API routes
// GET ping endpoint
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET all configurations
app.get('/v1/configurations', (req, res) => {
  const configs = Object.values(gameConfigurations);
  console.log(`Returning ${configs.length} game configurations`);
  res.json(configs);
});

// GET a specific configuration
app.get('/v1/configurations/:gameId', (req, res) => {
  const { gameId } = req.params;
  const config = gameConfigurations[gameId];
  
  if (config) {
    res.json(config);
  } else {
    res.status(404).json({ error: `Game configuration with ID ${gameId} not found` });
  }
});

// POST create a new configuration
app.post('/v1/configurations', (req, res) => {
  console.log('Received POST request to create configuration');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  // Handle different payload formats
  let gameConfig;
  
  // Format 1: Direct configuration object with gameId
  if (req.body.gameId && req.body.theme && req.body.bet) {
    gameConfig = req.body;
  } 
  // Format 2: Wrapped configuration with id/config structure
  else if (req.body.id && req.body.config && req.body.config.gameId) {
    gameConfig = req.body.config;
  }
  // Format 3: Wrapped with id at top level, but gameId missing from config
  else if (req.body.id && req.body.config && req.body.theme) {
    gameConfig = {
      gameId: req.body.id,
      ...req.body.config
    };
  }
  // Format 4: Identifier properties but missing actual configuration
  else if (req.body.id || req.body.gameId) {
    const id = req.body.gameId || req.body.id;
    console.log(`Missing required fields, but ID ${id} present. Creating minimal configuration.`);
    
    gameConfig = {
      gameId: id,
      theme: req.body.theme || {
        mainTheme: "New Game",
        artStyle: "cartoon",
        colorScheme: "vibrant",
        mood: "playful",
        description: "A new slot game configuration"
      },
      bet: req.body.bet || {
        min: 0.10,
        max: 50,
        increment: 0.10
      }
    };
  } else {
    return res.status(400).json({ error: "Invalid payload: gameId is required" });
  }
  
  // Check if gameId already exists
  if (gameConfigurations[gameConfig.gameId]) {
    return res.status(409).json({ 
      error: `Game configuration with ID ${gameConfig.gameId} already exists` 
    });
  }
  
  // Save the new configuration
  gameConfigurations[gameConfig.gameId] = gameConfig;
  
  // Write to file
  try {
    fs.writeFileSync(
      path.join(configsDir, `${gameConfig.gameId}.json`),
      JSON.stringify(gameConfig, null, 2)
    );
  } catch (err) {
    console.error(`Error saving configuration file for ${gameConfig.gameId}:`, err);
  }
  
  res.status(201).json(gameConfig);
});

// PUT update a configuration
app.put('/v1/configurations/:gameId', (req, res) => {
  const { gameId } = req.params;
  
  // Check if configuration exists
  if (!gameConfigurations[gameId]) {
    return res.status(404).json({ error: `Game configuration with ID ${gameId} not found` });
  }
  
  // Handle different payload formats
  let updatedConfig;
  
  // Format 1: Direct configuration object
  if (req.body.gameId && req.body.theme && req.body.bet) {
    updatedConfig = req.body;
  } 
  // Format 2: Wrapped configuration with id/config structure
  else if (req.body.id && req.body.config && (req.body.config.gameId || req.body.config.theme)) {
    updatedConfig = {
      ...req.body.config,
      gameId // Ensure the gameId matches the URL parameter
    };
  } else {
    return res.status(400).json({ error: "Invalid payload format" });
  }
  
  // Update the configuration
  gameConfigurations[gameId] = updatedConfig;
  
  // Write to file
  try {
    fs.writeFileSync(
      path.join(configsDir, `${gameId}.json`),
      JSON.stringify(updatedConfig, null, 2)
    );
  } catch (err) {
    console.error(`Error updating configuration file for ${gameId}:`, err);
  }
  
  res.json(updatedConfig);
});

// DELETE a configuration
app.delete('/v1/configurations/:gameId', (req, res) => {
  const { gameId } = req.params;
  const { softDelete } = req.query;
  
  // Check if configuration exists
  if (!gameConfigurations[gameId]) {
    return res.status(404).json({ error: `Game configuration with ID ${gameId} not found` });
  }
  
  // Handle soft delete (just mark as deleted)
  if (softDelete === 'true') {
    gameConfigurations[gameId].deleted = true;
    res.status(200).json({ message: `Game configuration ${gameId} marked as deleted` });
  } else {
    // Hard delete: remove from memory and file
    delete gameConfigurations[gameId];
    
    // Delete the file
    try {
      fs.unlinkSync(path.join(configsDir, `${gameId}.json`));
    } catch (err) {
      console.error(`Error deleting configuration file for ${gameId}:`, err);
    }
    
    res.status(204).send();
  }
});

// Clone a configuration
app.post('/v1/configurations/:gameId/clone', (req, res) => {
  const { gameId } = req.params;
  const { targetGameId, overrides } = req.body;
  
  // Check if source configuration exists
  if (!gameConfigurations[gameId]) {
    return res.status(404).json({ error: `Source game configuration with ID ${gameId} not found` });
  }
  
  // Check if target ID is provided
  if (!targetGameId) {
    return res.status(400).json({ error: "targetGameId is required for cloning" });
  }
  
  // Check if target already exists
  if (gameConfigurations[targetGameId]) {
    return res.status(409).json({ error: `Game configuration with ID ${targetGameId} already exists` });
  }
  
  // Create clone
  const clonedConfig = {
    ...JSON.parse(JSON.stringify(gameConfigurations[gameId])), // Deep copy
    gameId: targetGameId
  };
  
  // Apply any overrides
  if (overrides) {
    Object.entries(overrides).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && typeof clonedConfig[key] === 'object') {
        clonedConfig[key] = { ...clonedConfig[key], ...value };
      } else {
        clonedConfig[key] = value;
      }
    });
  }
  
  // Save the cloned configuration
  gameConfigurations[targetGameId] = clonedConfig;
  
  // Write to file
  try {
    fs.writeFileSync(
      path.join(configsDir, `${targetGameId}.json`),
      JSON.stringify(clonedConfig, null, 2)
    );
  } catch (err) {
    console.error(`Error saving cloned configuration file for ${targetGameId}:`, err);
  }
  
  res.status(201).json(clonedConfig);
});

// Get configuration history (mock)
app.get('/v1/configurations/:gameId/history', (req, res) => {
  const { gameId } = req.params;
  
  // Check if configuration exists
  if (!gameConfigurations[gameId]) {
    return res.status(404).json({ error: `Game configuration with ID ${gameId} not found` });
  }
  
  // Generate mock history
  const mockHistory = {
    gameId,
    history: [
      {
        version: "v1",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: "user@example.com",
        changes: [
          {
            path: "theme.mainTheme",
            oldValue: "Initial Theme",
            newValue: gameConfigurations[gameId].theme.mainTheme
          },
          {
            path: "bet.max",
            oldValue: 50,
            newValue: gameConfigurations[gameId].bet.max
          }
        ]
      }
    ]
  };
  
  res.json(mockHistory);
});

// Partial update to a configuration (PATCH)
app.patch('/v1/configurations/:gameId', (req, res) => {
  const { gameId } = req.params;
  
  // Check if configuration exists
  if (!gameConfigurations[gameId]) {
    return res.status(404).json({ error: `Game configuration with ID ${gameId} not found` });
  }
  
  // Handle different payload formats
  let updates;
  
  // Format 1: Direct updates
  if (req.body.gameId === gameId || (!req.body.gameId && !req.body.id)) {
    updates = req.body;
  } 
  // Format 2: Wrapped updates
  else if ((req.body.id === gameId || req.body.gameId === gameId) && req.body.config) {
    updates = req.body.config;
  } else {
    return res.status(400).json({ error: "Invalid payload format for patch" });
  }
  
  // Apply updates recursively
  const applyUpdates = (target, source) => {
    Object.entries(source).forEach(([key, value]) => {
      if (value === null) {
        // Handle null value as a delete operation
        delete target[key];
      } else if (typeof value === 'object' && value !== null && 
                 typeof target[key] === 'object' && target[key] !== null) {
        // Recursively update nested objects
        target[key] = target[key] || {};
        applyUpdates(target[key], value);
      } else {
        // Direct update for primitives or replacing objects
        target[key] = value;
      }
    });
    return target;
  };
  
  // Create updated config by merging updates with current config
  const updatedConfig = applyUpdates(
    JSON.parse(JSON.stringify(gameConfigurations[gameId])), // Deep copy
    updates
  );
  
  // Ensure gameId is preserved
  updatedConfig.gameId = gameId;
  
  // Save the updated configuration
  gameConfigurations[gameId] = updatedConfig;
  
  // Write to file
  try {
    fs.writeFileSync(
      path.join(configsDir, `${gameId}.json`),
      JSON.stringify(updatedConfig, null, 2)
    );
  } catch (err) {
    console.error(`Error saving updated configuration file for ${gameId}:`, err);
  }
  
  res.json(updatedConfig);
});

// Options route for CORS preflight requests
app.options('*', cors());

// Serve the root index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(projectDir, 'index.html'));
});

// Fallback for all other routes
app.get('*', (req, res) => {
  // If the path starts with /v1/, return a proper API 404 error
  if (req.path.startsWith('/v1/')) {
    return res.status(404).json({ error: `API endpoint ${req.path} not found` });
  }
  
  // Otherwise, serve the index.html for SPA routing
  res.sendFile(path.join(projectDir, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SlotAI development server running on http://localhost:${PORT}`);
  console.log(`Enhanced Animation Lab available at http://localhost:${PORT}/animtest`);
  console.log(`Mock API endpoints available at http://localhost:${PORT}/v1/configurations`);
  console.log('To stop the server, press Ctrl+C');
});