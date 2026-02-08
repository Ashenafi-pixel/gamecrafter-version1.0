// Enhanced Express server for SlotAI with image saving and folder creation capability
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
// __dirname is already defined in CommonJS modules

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-game-id'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased size limit for base64 images

// Use port 8080 instead
const PORT = 8080;

// Root directory for game assets and saved images
const PUBLIC_DIR = path.join(__dirname, 'public');
const GAME_ASSETS_DIR = path.join(PUBLIC_DIR, 'game-assets');
const SAVED_IMAGES_DIR = path.join(PUBLIC_DIR, 'saved-images');

// Ensure the public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  console.log(`Created public directory: ${PUBLIC_DIR} `);
}

// Ensure the game assets directory exists
if (!fs.existsSync(GAME_ASSETS_DIR)) {
  fs.mkdirSync(GAME_ASSETS_DIR, { recursive: true });
  console.log(`Created game assets directory: ${GAME_ASSETS_DIR} `);
}

// Ensure the saved images directory exists
if (!fs.existsSync(SAVED_IMAGES_DIR)) {
  fs.mkdirSync(SAVED_IMAGES_DIR, { recursive: true });
  console.log(`Created saved images directory: ${SAVED_IMAGES_DIR} `);
}

// Helper to decode a base64 image
const decodeBase64Image = (dataString) => {
  // Extract the content type and base64 data
  const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string');
  }

  const contentType = matches[1];
  const base64Data = matches[2];

  return {
    contentType,
    data: Buffer.from(base64Data, 'base64')
  };
};

// --- MATH ENGINE INTEGRATION (Server Side) ---
const { resolveRound } = require('./src/utils/math-engine/server-math.cjs');

// RGS Endpoint: Resolve a single round (Server Preview Mode)
app.post('/preview/resolve', (req, res) => {
  try {
    const { config, seed } = req.body;
    if (!config) return res.status(400).json({ error: 'Config required' });

    // Use provided seed or generate one server-side
    const serverSeed = seed || Date.now().toString();
    const outcome = resolveRound(config, serverSeed);

    res.json({ success: true, outcome });
  } catch (e) {
    console.error("RGS Resolve Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Helper function for Monte Carlo simulation
const runSimulation = (config, rounds) => {
  const startTime = Date.now();
  let totalWin = 0;
  let totalBet = rounds * 10; // Assume 10 bet for normalization
  let wins = 0;
  let maxWin = 0;

  // Distribution tracking
  const tierHits = {};

  for (let i = 0; i < rounds; i++) {
    const outcome = resolveRound(config, `sim_${i}_${startTime} `);
    totalWin += outcome.finalPrize;
    if (outcome.isWin) wins++;
    if (outcome.finalPrize > maxWin) maxWin = outcome.finalPrize;

    // Track tiers
    tierHits[outcome.tierId] = (tierHits[outcome.tierId] || 0) + 1;
  }

  return {
    rounds,
    rtp: (totalWin / totalBet), // Normalized
    hitRate: wins / rounds,
    maxWin,
    tierDistribution: tierHits,
    duration: Date.now() - startTime
  };
};

// --- Simulation Endpoint ---
app.post('/simulation/run', (req, res) => {
  try {
    const { config, rounds } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Config required' });
    }

    const simRounds = rounds || 100;
    const stats = runSimulation(config, simRounds);

    res.json({ success: true, stats });
  } catch (e) {
    console.error("Simulation Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Endpoint to create folder structure for a game
app.post('/create-folders', (req, res) => {
  try {
    let { gameId, folders = [] } = req.body;

    // Check for gameId in headers (higher priority)
    const headerGameId = req.headers['x-game-id'];
    if (headerGameId) {
      console.log(`Found gameId in headers: ${headerGameId} `);
      gameId = headerGameId;
    }

    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    console.log(`Creating folder structure for game: ${gameId} `);

    // Create the game directory if it doesn't exist
    const gameDir = path.join(GAME_ASSETS_DIR, gameId);
    if (!fs.existsSync(gameDir)) {
      fs.mkdirSync(gameDir, { recursive: true });
      console.log(`Created game directory: ${gameDir} `);
    }

    // Create standard folders if none specified
    const foldersToCreate = folders.length > 0 ? folders : [
      'symbols',
      'symbols/wild',       // Wild symbols
      'symbols/scatter',    // Scatter symbols  
      'symbols/high',       // High-paying symbols
      'symbols/medium',     // Medium-paying symbols
      'symbols/low',        // Low-paying symbols
      'background',         // Background images
      'frame',              // Frame assets
      'ui',                 // UI elements
      'sound',              // Sound effects and music
      'sound/effects',      // Sound effects
      'sound/music',        // Background music
      'gameconfig'          // Game configuration files
    ];

    // Create each requested subfolder
    const createdFolders = [];
    for (const folder of foldersToCreate) {
      const folderPath = path.join(gameDir, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Created folder: ${folderPath} `);
      }
      createdFolders.push(folder);
    }

    // Create a gameconfig.json file with basic metadata
    const configPath = path.join(gameDir, 'gameconfig', 'config.json');
    const configDir = path.dirname(configPath);

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const configData = {
      gameId,
      createdAt: timestamp,
      updatedAt: timestamp,
      folders: createdFolders
    };

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log(`Created game config file: ${configPath} `);

    return res.json({
      success: true,
      message: `Successfully created folders for game ${gameId}`,
      path: `/ game - assets / ${gameId} `,
      folders: createdFolders
    });
  } catch (error) {
    console.error('Error creating folders:', error);
    return res.status(500).json({
      error: 'Failed to create folders',
      message: error.message
    });
  }
});

// Endpoint to check if folder structure exists for a game
app.post('/check-folders', (req, res) => {
  try {
    let { gameId } = req.body;

    // Check for gameId in headers (higher priority)
    const headerGameId = req.headers['x-game-id'];
    if (headerGameId) {
      gameId = headerGameId;
    }

    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    console.log(`Checking folder structure for game: ${gameId} `);

    // Check if the game directory exists
    const gameDir = path.join(GAME_ASSETS_DIR, gameId);
    const exists = fs.existsSync(gameDir);

    // Check for config file as additional verification
    const configPath = path.join(gameDir, 'gameconfig', 'config.json');
    const configExists = fs.existsSync(configPath);

    // Get folder list if they exist
    let folders = [];
    if (exists) {
      // Read the config file if it exists
      if (configExists) {
        try {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          folders = configData.folders || [];
        } catch (e) {
          console.error(`Error reading config file: ${e.message} `);
          // Fall back to listing directories
          folders = fs.readdirSync(gameDir)
            .filter(f => fs.statSync(path.join(gameDir, f)).isDirectory());
        }
      } else {
        // Just list the directories
        folders = fs.readdirSync(gameDir)
          .filter(f => fs.statSync(path.join(gameDir, f)).isDirectory());
      }
    }

    return res.json({
      exists,
      configExists,
      folders,
      path: exists ? `/ game - assets / ${gameId} ` : null
    });
  } catch (error) {
    console.error('Error checking folders:', error);
    return res.status(500).json({
      error: 'Failed to check folders',
      message: error.message
    });
  }
});

// Endpoint to save images
app.post('/save-image', (req, res) => {
  try {
    // Parse the request body
    let { image, gameId, symbolName, symbolId } = req.body;

    // Check for gameId in headers (higher priority)
    const headerGameId = req.headers['x-game-id'];
    if (headerGameId) {
      console.log(`Found gameId in headers: ${headerGameId} `);
      gameId = headerGameId;
    }

    console.log(`Received save request for game: ${gameId}, symbol: ${symbolName} (${symbolId})`);

    // Validate required parameters
    if (!image) {
      return res.status(400).json({ message: 'Missing required parameter: image' });
    }

    // Use a default gameId if none is provided
    if (!gameId) {
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      gameId = `default_${dateStr} `;
      console.log(`No gameId provided, using default: ${gameId} `);
    }

    // Create the game directory path - now using GAME_ASSETS_DIR
    const gameDir = path.join(GAME_ASSETS_DIR, gameId);

    // Check if the directory exists, create it if not
    if (!fs.existsSync(gameDir)) {
      fs.mkdirSync(gameDir, { recursive: true });
      console.log(`Created directory: ${gameDir} `);

      // Also create the symbols directory if needed
      const symbolsDir = path.join(gameDir, 'symbols');
      if (!fs.existsSync(symbolsDir)) {
        fs.mkdirSync(symbolsDir, { recursive: true });
      }
    }

    // Determine the subfolder based on symbolId
    let targetFolder = 'symbols';

    // More specific categorization for symbol types
    if (symbolId && symbolId.includes('background')) {
      targetFolder = 'background';
    } else if (symbolId && symbolId.includes('frame')) {
      targetFolder = 'frame';
    } else if (symbolId && symbolId.includes('sound')) {
      targetFolder = 'sound';
    } else if (symbolId && symbolId.includes('ui')) {
      targetFolder = 'ui';
    } else if (symbolId) {
      // Further categorize symbols by type
      if (symbolId.includes('wild')) {
        targetFolder = 'symbols/wild';
      } else if (symbolId.includes('scatter')) {
        targetFolder = 'symbols/scatter';
      } else if (symbolId.includes('high')) {
        targetFolder = 'symbols/high';
      } else if (symbolId.includes('medium')) {
        targetFolder = 'symbols/medium';
      } else if (symbolId.includes('low')) {
        targetFolder = 'symbols/low';
      }
    }

    // Ensure the target folder exists
    const targetDir = path.join(gameDir, targetFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Generate a filename using symbolId and name if provided, or a timestamp
    const filename = symbolId && symbolName
      ? `${symbolId}_${symbolName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
      : `symbol_${Date.now()}.png`;

    // Complete file path
    const filePath = path.join(targetDir, filename);

    console.log(`Saving image to: ${filePath} `);

    // Save the image
    if (image.startsWith('data:')) {
      // Handle base64 image data
      const imageBuffer = decodeBase64Image(image);
      fs.writeFileSync(filePath, imageBuffer.data);
      console.log(`Saved base64 image to: ${filePath} `);
    } else if (image.startsWith('http')) {
      // For URLs, we'll just log for now as they require fetch
      console.log(`Image URL detected: ${image.substring(0, 50)}...`);
      return res.status(200).json({
        message: 'Image URL recognized (not saved in development)',
        filePath: image, // Just return the original URL for now
        symbolId
      });
    } else {
      return res.status(400).json({ message: 'Invalid image format' });
    }

    // Build the public URL for the saved image
    const publicUrl = `/ game - assets / ${gameId} /${targetFolder}/${filename} `;

    res.status(200).json({
      message: 'Image saved successfully',
      filePath: publicUrl,
      symbolId
    });
  } catch (error) {
    console.error('Error saving image:', error);

    res.status(500).json({
      message: 'Error saving image',
      error: error.message
    });
  }
});

// Serve the built files if they exist
app.use(express.static(path.join(__dirname, 'dist')));

// Serve game assets with detailed error logging
app.use('/game-assets', express.static(GAME_ASSETS_DIR, {
  setHeaders: (res, path) => {
    console.log(`Serving game asset: ${path} `);
  }
}));

// Add error handling middleware for game assets
app.use('/game-assets', (err, req, res, next) => {
  console.error(`Error serving game asset ${req.path}: `, err);
  res.status(500).json({ error: 'Failed to serve game asset', details: err.message });
});

// Also serve the source files for development
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Serve the root index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('To stop the server, press Ctrl+C');
});