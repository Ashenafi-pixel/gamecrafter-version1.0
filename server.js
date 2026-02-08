import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import multer from 'multer';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
// JSON middleware moved below to support rawBody

// Import RGS Router
import rgsRouter from './src/rgs/router.js';
// Import Aggregator Logic
import { aggRoutes } from './src/agg/routes.js';
import { openDb, run } from './src/db/sqlite.js';
import { runMigrations } from './src/db/migrate.js';
import { hmacAuth } from './src/middleware/hmacAuth.js';

// Setup DB and Migrations
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, "rgs.db");
const db = openDb(dbPath);

console.log('[Server] Running migrations...');
runMigrations(db).then(() => {
  console.log('[Server] Migrations applied.');
  // Ensure demo operator
  run(db,
    `INSERT OR IGNORE INTO operators (operator_id, name, is_active, hmac_secret)
         VALUES ('demo_operator', 'Demo Operator', 1, COALESCE(?, 'dev_secret'));`,
    [process.env.DEMO_OPERATOR_HMAC_SECRET || "dev_secret"]
  ).catch(e => console.error("Failed to seed operator:", e));
});

// Middleware for Raw Body (HMAC)
app.use(express.json({
  limit: '500mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString("utf8");
  }
}));
// Increase URL-encoded limit as well just in case
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Mount Aggregator API (Public)
app.use("/api/agg", hmacAuth({ db }), aggRoutes({ db }));

// Mount RGS API (Legacy/Internal)
app.use('/api/rgs', rgsRouter);

// Add request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 3500;
let currentApiKey = process.env.CLAUDE_API_KEY || '';

// Create game assets directory in root/games
const GAMES_DIR = path.join(__dirname, 'games');
if (!fs.existsSync(GAMES_DIR)) {
  fs.mkdirSync(GAMES_DIR, { recursive: true });
  console.log(`Created games directory at ${GAMES_DIR}`);
} else {
  console.log(`Games directory already exists at ${GAMES_DIR}`);
}

// Log the full path to the game directory to help with debugging
console.log(`Full path to games directory: ${path.resolve(GAMES_DIR)}`);

// Create test game directory and file to verify permissions
// Use the correct format: gamename_YYYYMMDD
const today = new Date();
const dateStr = today.getFullYear() +
  String(today.getMonth() + 1).padStart(2, '0') +
  String(today.getDate()).padStart(2, '0');

const TEST_GAME_DIR = path.join(GAMES_DIR, `test-game_${dateStr}`);
try {
  if (!fs.existsSync(TEST_GAME_DIR)) {
    fs.mkdirSync(TEST_GAME_DIR, { recursive: true });
    fs.writeFileSync(path.join(TEST_GAME_DIR, 'test.txt'), 'Test file to verify write permissions');
    console.log(`Created test directory and file at ${TEST_GAME_DIR}`);
  }
} catch (error) {
  console.error(`ERROR: Could not create test directory or file: ${error.message}`);
  console.error('This may indicate a permissions issue with the file system.');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    let gameId = req.params.gameId;
    const assetType = req.params.assetType; // symbols, background, frame, audio

    console.log(`[DEBUG] Multer storage: Setting destination for gameId: ${gameId}, assetType: ${assetType}`);

    // Validate the gameId format - should be name_YYYYMMDD
    if (!gameId.includes('_') || !/^\w+_\d{8}$/.test(gameId)) {
      console.warn(`[WARNING] gameId doesn't match expected format (name_YYYYMMDD): ${gameId}`);

      // Fix the format if needed
      if (!gameId.includes('_')) {
        // Add today's date in YYYYMMDD format
        const today = new Date();
        const dateStr = today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, '0') +
          String(today.getDate()).padStart(2, '0');

        const fixedGameId = `${gameId}_${dateStr}`;
        console.log(`[DEBUG] Fixed gameId format: ${gameId} -> ${fixedGameId}`);
        gameId = fixedGameId;
      }
    }

    // Create directory structure for game if it doesn't exist
    // We use the fixed gameId now
    const gameDir = path.join(GAMES_DIR, gameId);
    const assetDir = path.join(gameDir, assetType);

    console.log(`[DEBUG] Multer storage: Game directory path: ${gameDir}`);
    console.log(`[DEBUG] Multer storage: Asset directory path: ${assetDir}`);

    try {
      console.log(`[DEBUG] Multer storage: Creating game directory: ${gameDir}`);
      await fsPromises.mkdir(gameDir, { recursive: true });

      console.log(`[DEBUG] Multer storage: Creating asset directory: ${assetDir}`);
      await fsPromises.mkdir(assetDir, { recursive: true });

      // Verify directories were created
      if (fs.existsSync(gameDir) && fs.existsSync(assetDir)) {
        console.log(`[DEBUG] Multer storage: Directories created successfully`);
      } else {
        console.error(`[ERROR] Multer storage: Directories not created properly: gameDir exists: ${fs.existsSync(gameDir)}, assetDir exists: ${fs.existsSync(assetDir)}`);
      }

      cb(null, assetDir);
    } catch (err) {
      console.error(`[ERROR] Multer storage: Error creating directories:`, err);
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    // Sanitize file name, replace spaces with underscores
    const sanitizedName = file.originalname.replace(/\s+/g, '_');
    // Use timestamp to prevent overwriting files with the same name
    const fileName = `${Date.now()}-${sanitizedName}`;

    console.log(`[DEBUG] Multer storage: Generated filename: ${fileName} from original: ${file.originalname}`);

    cb(null, fileName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));
// Serve files from public directory
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
// Serve files from games directory
app.use('/games', express.static(path.join(__dirname, 'games')));

// API routes
app.post('/api/test', async (req, res) => {
  try {
    const { apiKey } = req.body;

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 100,
      messages: [
        { role: 'user', content: 'Test message' }
      ],
    });

    if (response) {
      currentApiKey = apiKey;
      // In production, you would want to store this in a secure environment variable
      // or a secure key management service, not in a file
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error testing API key:', error);
    res.status(400).json({ error: 'Invalid API key' });
  }
});

// OpenAI/DALL-E API endpoint
app.post('/api/v1/openai/dalle', async (req, res) => {
  try {
    console.log("DALL-E API endpoint called with prompt:", req.body.prompt);
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(400).json({ error: "No API key provided" });
    }

    // Make the request to OpenAI
    console.log(`Making OpenAI request with key ${apiKey.substring(0, 4)}...`);

    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: req.body.prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "url"
        })
      });

      console.log(`OpenAI response status: ${openaiResponse.status}`);

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error(`OpenAI error: ${errorText}`);
        return res.status(openaiResponse.status).json({ error: errorText });
      }

      const data = await openaiResponse.json();
      console.log("OpenAI success! Image URL received");
      return res.json(data);

    } catch (error) {
      console.error("Error calling OpenAI:", error.message);
      return res.status(500).json({ error: `OpenAI API error: ${error.message}` });
    }
  } catch (error) {
    console.error('Error in DALL-E endpoint:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { gameDescription } = req.body;
    const apiKey = currentApiKey;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key not configured' });
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

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
      ],
    });

    res.json({ content: response.content[0].text });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const apiKey = currentApiKey;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key not configured' });
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: messages,
    });

    res.json({ content: response.content[0].text });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Catch all routes and serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Get local IP address
import os from 'os';

const getLocalIP = () => {
  const nets = os.networkInterfaces();
  let localIP = 'localhost';

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (net.family === 'IPv4' && !net.internal) {
        localIP = net.address;
        return localIP;
      }
    }
  }
  return localIP;
};

const localIP = getLocalIP();

// File upload endpoints
app.post('/api/games/:gameId/:assetType/upload', upload.single('file'), async (req, res) => {
  try {
    let { gameId, assetType } = req.params;

    console.log(`[DEBUG] Received file upload request for gameId: ${gameId}, assetType: ${assetType}`);

    // Validate the gameId format - should be name_YYYYMMDD
    if (!gameId.includes('_') || !/^\w+_\d{8}$/.test(gameId)) {
      console.warn(`[WARNING] gameId doesn't match expected format (name_YYYYMMDD): ${gameId}`);

      // Fix the format if needed
      if (!gameId.includes('_')) {
        // Add today's date in YYYYMMDD format
        const today = new Date();
        const dateStr = today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, '0') +
          String(today.getDate()).padStart(2, '0');

        const fixedGameId = `${gameId}_${dateStr}`;
        console.log(`[DEBUG] Fixed gameId format: ${gameId} -> ${fixedGameId}`);
        gameId = fixedGameId;
      }
    }

    if (!req.file) {
      console.error('[ERROR] No file uploaded in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`[DEBUG] File received: ${req.file.originalname}, size: ${req.file.size} bytes`);
    console.log(`[DEBUG] File initially saved to: ${req.file.path}`);

    // Make sure the directory exists - with additional logging
    const gameDir = path.join(GAMES_DIR, gameId);
    const assetDir = path.join(gameDir, assetType);

    console.log(`[DEBUG] Game directory path: ${gameDir}`);
    console.log(`[DEBUG] Asset directory path: ${assetDir}`);

    // Check if directories exist and create if needed
    try {
      // Check game directory
      if (!fs.existsSync(gameDir)) {
        console.log(`[DEBUG] Game directory doesn't exist, creating: ${gameDir}`);
        await fsPromises.mkdir(gameDir, { recursive: true });

        // Verify creation
        if (fs.existsSync(gameDir)) {
          console.log(`[DEBUG] Game directory created successfully: ${gameDir}`);
        } else {
          console.error(`[ERROR] Failed to create game directory despite no error: ${gameDir}`);
        }
      } else {
        console.log(`[DEBUG] Game directory already exists: ${gameDir}`);
      }

      // Check asset directory
      if (!fs.existsSync(assetDir)) {
        console.log(`[DEBUG] Asset directory doesn't exist, creating: ${assetDir}`);
        await fsPromises.mkdir(assetDir, { recursive: true });

        // Verify creation
        if (fs.existsSync(assetDir)) {
          console.log(`[DEBUG] Asset directory created successfully: ${assetDir}`);
        } else {
          console.error(`[ERROR] Failed to create asset directory despite no error: ${assetDir}`);
        }
      } else {
        console.log(`[DEBUG] Asset directory already exists: ${assetDir}`);
      }

      // List contents of game directory
      const gameContents = await fsPromises.readdir(gameDir);
      console.log(`[DEBUG] Game directory contents: ${gameContents.join(', ')}`);

      // List contents of asset directory if it exists
      if (fs.existsSync(assetDir)) {
        const assetContents = await fsPromises.readdir(assetDir);
        console.log(`[DEBUG] Asset directory contents: ${assetContents.join(', ')}`);
      }
    } catch (dirError) {
      console.error(`[ERROR] Error ensuring directories for file upload:`, dirError);
      throw dirError;
    }

    // Return the file path that can be used by the client
    const relativePath = path.join('games', gameId, assetType, req.file.filename)
      .replace(/\\/g, '/'); // Replace backslashes with forward slashes for consistency

    console.log(`[DEBUG] File upload relative path: ${relativePath}`);
    console.log(`[DEBUG] Full absolute file path: ${path.resolve(req.file.path)}`);

    // Perform additional verification
    if (fs.existsSync(req.file.path)) {
      const stats = fs.statSync(req.file.path);
      console.log(`[DEBUG] Uploaded file verified on disk, size: ${stats.size} bytes`);
    } else {
      console.error(`[WARNING] Uploaded file not found at expected path: ${req.file.path}`);
    }

    res.json({
      success: true,
      path: `/${relativePath}`, // Add leading slash for absolute path
      originalName: req.file.originalname,
      fileName: req.file.filename,
      gameId: gameId,
      assetType: assetType
    });
  } catch (error) {
    console.error('[ERROR] Error uploading file:', error);
    res.status(500).json({ error: `Failed to upload file: ${error.message}` });
  }
});

// Base64 image upload endpoint
app.post('/api/games/:gameId/:assetType/upload-base64', async (req, res) => {
  try {
    let { gameId, assetType } = req.params;
    const { base64Data, fileName } = req.body;

    console.log(`[DEBUG] Received base64 upload request for gameId: ${gameId}, assetType: ${assetType}, fileName: ${fileName}`);

    // Validate the gameId format - should be name_YYYYMMDD
    if (!gameId.includes('_') || !/^\w+_\d{8}$/.test(gameId)) {
      console.warn(`[WARNING] gameId doesn't match expected format (name_YYYYMMDD): ${gameId}`);

      // Fix the format if needed
      if (!gameId.includes('_')) {
        // Add today's date in YYYYMMDD format
        const today = new Date();
        const dateStr = today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, '0') +
          String(today.getDate()).padStart(2, '0');

        const fixedGameId = `${gameId}_${dateStr}`;
        console.log(`[DEBUG] Fixed gameId format: ${gameId} -> ${fixedGameId}`);
        gameId = fixedGameId;
      }
    }

    if (!base64Data || !fileName) {
      console.error(`[ERROR] Missing required fields for base64 upload`);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create game directory structure
    // We use the fixed gameId now
    const gameDir = path.join(GAMES_DIR, gameId);
    const assetDir = path.join(gameDir, assetType);

    // Create directories with verbose logging
    console.log(`[DEBUG] Creating directory structure for base64 upload: ${assetDir}`);

    try {
      // Check and create game directory
      if (!fs.existsSync(gameDir)) {
        console.log(`[DEBUG] Creating game directory for base64 upload: ${gameDir}`);
        await fsPromises.mkdir(gameDir, { recursive: true });
        console.log(`[DEBUG] Game directory created successfully for base64 upload: ${gameDir}`);
      } else {
        console.log(`[DEBUG] Game directory already exists for base64 upload: ${gameDir}`);
      }

      // Check and create asset type directory
      if (!fs.existsSync(assetDir)) {
        console.log(`[DEBUG] Creating asset directory for base64 upload: ${assetDir}`);
        await fsPromises.mkdir(assetDir, { recursive: true });
        console.log(`[DEBUG] Asset directory created successfully for base64 upload: ${assetDir}`);
      } else {
        console.log(`[DEBUG] Asset directory already exists for base64 upload: ${assetDir}`);
      }

      // Verify the directories were created
      if (!fs.existsSync(gameDir)) {
        console.error(`[ERROR] Game directory doesn't exist after creation: ${gameDir}`);
        throw new Error(`Failed to create game directory: ${gameDir}`);
      }

      if (!fs.existsSync(assetDir)) {
        console.error(`[ERROR] Asset directory doesn't exist after creation: ${assetDir}`);
        throw new Error(`Failed to create asset directory: ${assetDir}`);
      }

      // List the contents of the game directory
      const gameDirContents = await fsPromises.readdir(gameDir);
      console.log(`[DEBUG] Game directory contents: ${gameDirContents.join(', ')}`);

    } catch (dirError) {
      console.error(`[ERROR] Error creating directories for base64 upload:`, dirError);
      throw dirError;
    }

    // Sanitize file name
    const sanitizedName = fileName.replace(/\s+/g, '_');
    const fullFileName = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(assetDir, fullFileName);

    // Extract the base64 data
    let dataToSave = base64Data;
    if (base64Data.includes(';base64,')) {
      dataToSave = base64Data.split(';base64,').pop();
    }

    console.log(`[DEBUG] Writing base64 file to: ${filePath}`);
    // Write the file with error handling
    try {
      await fsPromises.writeFile(filePath, dataToSave, { encoding: 'base64' });
      console.log(`[DEBUG] Base64 file written successfully: ${filePath}`);
    } catch (writeError) {
      console.error(`[ERROR] Error writing base64 file:`, writeError);
      throw writeError;
    }

    // Verify the file was created
    if (!fs.existsSync(filePath)) {
      console.error(`[ERROR] Base64 file doesn't exist after writing: ${filePath}`);
      throw new Error(`Failed to write base64 file: ${filePath}`);
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    console.log(`[DEBUG] Base64 file saved: ${filePath}, size: ${stats.size} bytes`);

    // Return the file path that can be used by the client
    const relativePath = path.join('games', gameId, assetType, fullFileName)
      .replace(/\\/g, '/'); // Replace backslashes with forward slashes for consistency

    console.log(`[DEBUG] Base64 file relative path: ${relativePath}`);

    res.json({
      success: true,
      path: `/${relativePath}`, // Add leading slash for absolute path
      originalName: fileName,
      fileName: fullFileName
    });
  } catch (error) {
    console.error('[ERROR] Error saving base64 file:', error);
    res.status(500).json({ error: `Failed to save file: ${error.message}` });
  }
});

// JSON configuration saving endpoint
app.post('/api/games/:gameId/config/:configType', async (req, res) => {
  try {
    let { gameId, configType } = req.params;
    const configData = req.body;

    console.log(`[DEBUG] Received config save request for gameId: ${gameId}, configType: ${configType}`);

    // Validate the gameId format - should be name_YYYYMMDD
    if (!gameId.includes('_') || !/^\w+_\d{8}$/.test(gameId)) {
      console.warn(`[WARNING] gameId doesn't match expected format (name_YYYYMMDD): ${gameId}`);

      // Fix the format if needed
      if (!gameId.includes('_')) {
        // Add today's date in YYYYMMDD format
        const today = new Date();
        const dateStr = today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, '0') +
          String(today.getDate()).padStart(2, '0');

        const fixedGameId = `${gameId}_${dateStr}`;
        console.log(`[DEBUG] Fixed gameId format: ${gameId} -> ${fixedGameId}`);
        gameId = fixedGameId;
      }
    }

    if (!configData) {
      console.error(`[ERROR] No configuration data provided`);
      return res.status(400).json({ error: 'No configuration data provided' });
    }

    // Create game directory structure
    const gameDir = path.join(GAMES_DIR, gameId);
    const configDir = path.join(gameDir, 'config');

    console.log(`[DEBUG] Creating directory structure: ${configDir}`);

    // Create directories with more verbose logging
    try {
      if (!fs.existsSync(gameDir)) {
        console.log(`[DEBUG] Creating game directory: ${gameDir}`);
        await fsPromises.mkdir(gameDir, { recursive: true });
        console.log(`[DEBUG] Game directory created successfully: ${gameDir}`);
      } else {
        console.log(`[DEBUG] Game directory already exists: ${gameDir}`);
      }

      if (!fs.existsSync(configDir)) {
        console.log(`[DEBUG] Creating config directory: ${configDir}`);
        await fsPromises.mkdir(configDir, { recursive: true });
        console.log(`[DEBUG] Config directory created successfully: ${configDir}`);
      } else {
        console.log(`[DEBUG] Config directory already exists: ${configDir}`);
      }
    } catch (dirError) {
      console.error(`[ERROR] Error creating directories:`, dirError);
      throw dirError;
    }

    // Verify the directories were created with detailed messages
    if (!fs.existsSync(gameDir)) {
      console.error(`[ERROR] Game directory doesn't exist after creation: ${gameDir}`);
      console.error(`[ERROR] Games dir exists: ${fs.existsSync(GAMES_DIR)}`);
      throw new Error(`Failed to create game directory: ${gameDir}`);
    }
    if (!fs.existsSync(configDir)) {
      console.error(`[ERROR] Config directory doesn't exist after creation: ${configDir}`);
      throw new Error(`Failed to create config directory: ${configDir}`);
    }

    // Get directory listing to verify permissions and contents
    try {
      const gameFiles = await fsPromises.readdir(gameDir);
      console.log(`[DEBUG] Game directory contents: ${gameFiles.join(', ')}`);
    } catch (readError) {
      console.error(`[ERROR] Error reading game directory:`, readError);
    }

    // Save configuration to file
    const configPath = path.join(configDir, `${configType}.json`);
    console.log(`[DEBUG] Saving configuration to: ${configPath}`);

    const configJson = JSON.stringify(configData, null, 2);
    console.log(`[DEBUG] Config size: ${configJson.length} bytes`);

    // Write file with error handling
    try {
      await fsPromises.writeFile(configPath, configJson);
      console.log(`[DEBUG] Configuration file written successfully: ${configPath}`);
    } catch (writeError) {
      console.error(`[ERROR] Error writing configuration file:`, writeError);
      throw writeError;
    }

    // Verify the file was created
    if (!fs.existsSync(configPath)) {
      console.error(`[ERROR] Config file doesn't exist after writing: ${configPath}`);
      throw new Error(`Failed to create config file: ${configPath}`);
    }

    const stats = fs.statSync(configPath);
    console.log(`[DEBUG] Configuration saved: ${configPath}, size: ${stats.size} bytes`);
    console.log(`[DEBUG] All paths:
    - GAMES_DIR: ${GAMES_DIR}
    - gameDir: ${gameDir}
    - configDir: ${configDir}
    - configPath: ${configPath}
    - Absolute configPath: ${path.resolve(configPath)}
    - Current working directory: ${process.cwd()}
    `);

    res.json({
      success: true,
      message: `Configuration '${configType}' saved successfully`,
      path: configPath
    });
  } catch (error) {
    console.error('[ERROR] Error saving configuration:', error);
    res.status(500).json({ error: `Failed to save configuration: ${error.message}` });
  }
});

// JSON configuration loading endpoint
app.get('/api/games/:gameId/config/:configType', async (req, res) => {
  try {
    let { gameId, configType } = req.params;

    console.log(`[DEBUG] Received config load request for gameId: ${gameId}, configType: ${configType}`);

    // Validate the gameId format - should be name_YYYYMMDD
    if (!gameId.includes('_') || !/^\w+_\d{8}$/.test(gameId)) {
      console.warn(`[WARNING] gameId doesn't match expected format (name_YYYYMMDD): ${gameId}`);

      // Fix the format if needed
      if (!gameId.includes('_')) {
        // Add today's date in YYYYMMDD format
        const today = new Date();
        const dateStr = today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, '0') +
          String(today.getDate()).padStart(2, '0');

        const fixedGameId = `${gameId}_${dateStr}`;
        console.log(`[DEBUG] Fixed gameId format: ${gameId} -> ${fixedGameId}`);
        gameId = fixedGameId;
      }
    }

    // Build path to configuration file
    const configPath = path.join(GAMES_DIR, gameId, 'config', `${configType}.json`);

    // Check if configuration file exists
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    // Read and parse configuration
    const configData = await fsPromises.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);

    console.log(`Configuration loaded: ${configPath}`);

    res.json(config);
  } catch (error) {
    console.error('Error loading configuration:', error);
    res.status(500).json({ error: 'Failed to load configuration' });
  }
});

// List game assets
app.get('/api/games/:gameId/:assetType', async (req, res) => {
  try {
    let { gameId, assetType } = req.params;

    console.log(`[DEBUG] Received asset list request for gameId: ${gameId}, assetType: ${assetType}`);

    // Validate the gameId format - should be name_YYYYMMDD
    if (!gameId.includes('_') || !/^\w+_\d{8}$/.test(gameId)) {
      console.warn(`[WARNING] gameId doesn't match expected format (name_YYYYMMDD): ${gameId}`);

      // Fix the format if needed
      if (!gameId.includes('_')) {
        // Add today's date in YYYYMMDD format
        const today = new Date();
        const dateStr = today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, '0') +
          String(today.getDate()).padStart(2, '0');

        const fixedGameId = `${gameId}_${dateStr}`;
        console.log(`[DEBUG] Fixed gameId format: ${gameId} -> ${fixedGameId}`);
        gameId = fixedGameId;
      }
    }

    // Build path to asset directory
    const assetDir = path.join(GAMES_DIR, gameId, assetType);

    // Check if directory exists
    if (!fs.existsSync(assetDir)) {
      return res.json({ assets: [] }); // Return empty array if directory doesn't exist
    }

    // Get list of files
    const files = await fsPromises.readdir(assetDir);

    // Build paths to files
    const assets = files.map(file => {
      const relativePath = path.join('games', gameId, assetType, file)
        .replace(/\\/g, '/'); // Replace backslashes with forward slashes for consistency

      return {
        fileName: file,
        path: `/${relativePath}` // Add leading slash for absolute path
      };
    });

    res.json({ assets });
  } catch (error) {
    console.error('Error listing assets:', error);
    res.status(500).json({ error: 'Failed to list assets' });
  }
});

// Verify game directory exists - must be defined before the :assetType route
app.get('/api/games/:gameId/verify-directory', async (req, res) => {
  try {
    let { gameId } = req.params;
    console.log(`[DEBUG] Verifying game directory exists for gameId: ${gameId}`);

    // Validate the gameId format - should be name_YYYYMMDD
    if (!gameId.includes('_') || !/^\w+_\d{8}$/.test(gameId)) {
      console.warn(`[WARNING] gameId doesn't match expected format (name_YYYYMMDD): ${gameId}`);

      // Fix the format if needed
      if (!gameId.includes('_')) {
        // Add today's date in YYYYMMDD format
        const today = new Date();
        const dateStr = today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, '0') +
          String(today.getDate()).padStart(2, '0');

        const fixedGameId = `${gameId}_${dateStr}`;
        console.log(`[DEBUG] Fixed gameId format: ${gameId} -> ${fixedGameId}`);
        gameId = fixedGameId;
      }
    }

    const gameDir = path.join(GAMES_DIR, gameId);

    // Check if directory exists
    const exists = fs.existsSync(gameDir);
    console.log(`[DEBUG] Game directory ${exists ? 'exists' : 'does not exist'}: ${gameDir}`);

    // If it exists, get contents
    let contents = [];
    if (exists) {
      try {
        contents = await fsPromises.readdir(gameDir);
        console.log(`[DEBUG] Game directory contents: ${contents.join(', ')}`);
      } catch (readError) {
        console.error(`[ERROR] Error reading game directory contents:`, readError);
      }
    } else {
      // Try to create the directory
      try {
        console.log(`[DEBUG] Attempting to create game directory: ${gameDir}`);
        await fsPromises.mkdir(gameDir, { recursive: true });

        // Verify creation
        const created = fs.existsSync(gameDir);
        console.log(`[DEBUG] Game directory ${created ? 'created successfully' : 'creation failed'}: ${gameDir}`);

        if (created) {
          try {
            contents = await fsPromises.readdir(gameDir);
            console.log(`[DEBUG] Created game directory contents: ${contents.join(', ')}`);
          } catch (readError) {
            console.error(`[ERROR] Error reading created game directory contents:`, readError);
          }
        }
      } catch (createError) {
        console.error(`[ERROR] Error creating game directory:`, createError);
      }
    }

    // Convert path to Windows format for direct file:// URLs in browser
    const absolutePath = path.resolve(gameDir);
    // Convert to Windows backslash format if running in WSL
    const windowsPath = absolutePath.replace(/^\/mnt\/([a-z])\//, '$1:\\').replace(/\//g, '\\');

    res.json({
      exists: fs.existsSync(gameDir),
      path: gameDir,
      contents: contents,
      absolutePath: absolutePath,
      windowsPath: windowsPath
    });
  } catch (error) {
    console.error('[ERROR] Error verifying game directory:', error);
    res.status(500).json({ error: 'Failed to verify game directory', message: error.message });
  }
});

// Explicit endpoint to create game directory structure
app.post('/api/games/:gameId/create-directory', async (req, res) => {
  try {
    let { gameId } = req.params;
    const { createSubdirectories } = req.body || { createSubdirectories: false };

    console.log(`[DEBUG] Received request to create game directory for gameId: ${gameId}`);

    // Validate the gameId format - should be name_YYYYMMDD
    if (!gameId.includes('_') || !/^\w+_\d{8}$/.test(gameId)) {
      console.warn(`[WARNING] gameId doesn't match expected format (name_YYYYMMDD): ${gameId}`);

      // Fix the format if needed
      if (!gameId.includes('_')) {
        // Add today's date in YYYYMMDD format
        const today = new Date();
        const dateStr = today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, '0') +
          String(today.getDate()).padStart(2, '0');

        const fixedGameId = `${gameId}_${dateStr}`;
        console.log(`[DEBUG] Fixed gameId format: ${gameId} -> ${fixedGameId}`);
        gameId = fixedGameId;
      }
    }

    // Create the game directory
    const gameDir = path.join(GAMES_DIR, gameId);
    console.log(`[DEBUG] Creating game directory: ${gameDir}`);

    if (!fs.existsSync(gameDir)) {
      await fsPromises.mkdir(gameDir, { recursive: true });
      console.log(`[DEBUG] Game directory created: ${gameDir}`);
    } else {
      console.log(`[DEBUG] Game directory already exists: ${gameDir}`);
    }

    // Create standard subdirectories if requested
    if (createSubdirectories) {
      const subdirs = ['symbols', 'background', 'frame', 'audio', 'config'];

      for (const subdir of subdirs) {
        const subdirPath = path.join(gameDir, subdir);
        console.log(`[DEBUG] Creating subdirectory: ${subdirPath}`);

        if (!fs.existsSync(subdirPath)) {
          await fsPromises.mkdir(subdirPath, { recursive: true });
          console.log(`[DEBUG] Subdirectory created: ${subdirPath}`);
        } else {
          console.log(`[DEBUG] Subdirectory already exists: ${subdirPath}`);
        }
      }
    }

    // Create a README.txt file in the game directory
    const readmePath = path.join(gameDir, 'README.txt');
    if (!fs.existsSync(readmePath)) {
      const content = `Game ID: ${gameId}\nCreated: ${new Date().toISOString()}\n\nThis directory contains all assets and configurations for your slot game.`;
      await fsPromises.writeFile(readmePath, content);
      console.log(`[DEBUG] Created README.txt in game directory`);
    }

    // List the directory contents
    const contents = await fsPromises.readdir(gameDir);

    // Convert path to Windows format for direct file:// URLs in browser
    const absolutePath = path.resolve(gameDir);
    // Convert to Windows backslash format if running in WSL
    const windowsPath = absolutePath.replace(/^\/mnt\/([a-z])\//, '$1:\\').replace(/\//g, '\\');

    // Try to execute a shell command to open the directory if on Windows WSL
    let shellResult = null;
    try {
      if (process.platform === 'linux' && absolutePath.startsWith('/mnt/')) {
        // Running in WSL - try to use explorer.exe
        const { exec } = require('child_process');
        const cmd = `explorer.exe "${windowsPath}"`;
        console.log(`[DEBUG] Executing shell command: ${cmd}`);

        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.error(`[ERROR] Explorer command failed: ${error}`);
          } else {
            console.log(`[DEBUG] Explorer command executed successfully`);
          }
        });

        shellResult = 'Explorer command executed';
      }
    } catch (shellError) {
      console.error(`[ERROR] Shell command execution failed:`, shellError);
      shellResult = `Shell error: ${shellError.message}`;
    }

    res.json({
      success: true,
      gameId: gameId,
      path: gameDir,
      absolutePath: absolutePath,
      windowsPath: windowsPath,
      contents: contents,
      url: `/games/${gameId}`,
      shellResult: shellResult
    });
  } catch (error) {
    console.error('[ERROR] Error creating game directory:', error);
    res.status(500).json({
      error: 'Failed to create game directory',
      message: error.message
    });
  }
});

// Endpoint to directly open a directory in Explorer (Windows only)
app.get('/api/games/:gameId/open-directory', async (req, res) => {
  try {
    let { gameId } = req.params;
    console.log(`[DEBUG] Attempting to open directory for gameId: ${gameId}`);

    // Validate the gameId format - should be name_YYYYMMDD
    if (!gameId.includes('_') || !/^\w+_\d{8}$/.test(gameId)) {
      console.warn(`[WARNING] gameId doesn't match expected format (name_YYYYMMDD): ${gameId}`);

      // Fix the format if needed
      if (!gameId.includes('_')) {
        // Add today's date in YYYYMMDD format
        const today = new Date();
        const dateStr = today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, '0') +
          String(today.getDate()).padStart(2, '0');

        const fixedGameId = `${gameId}_${dateStr}`;
        console.log(`[DEBUG] Fixed gameId format: ${gameId} -> ${fixedGameId}`);
        gameId = fixedGameId;
      }
    }

    // Construct the directory path
    const gameDir = path.join(GAMES_DIR, gameId);
    console.log(`[DEBUG] Game directory path: ${gameDir}`);

    // Make sure the directory exists
    if (!fs.existsSync(gameDir)) {
      console.log(`[DEBUG] Directory doesn't exist, creating it: ${gameDir}`);
      await fsPromises.mkdir(gameDir, { recursive: true });

      // Create a README file
      const readmePath = path.join(gameDir, 'README.txt');
      await fsPromises.writeFile(readmePath, `Game directory for ${gameId}\nCreated: ${new Date().toISOString()}`);
    }

    // Get the Windows format path
    const absolutePath = path.resolve(gameDir);
    const windowsPath = absolutePath.replace(/^\/mnt\/([a-z])\//, '$1:\\').replace(/\//g, '\\');

    // Try to open the directory using explorer.exe if on WSL
    let openResult = 'Not attempted';

    if (process.platform === 'linux' && absolutePath.startsWith('/mnt/')) {
      try {
        // Use child_process.exec to run explorer.exe
        const { exec } = require('child_process');
        const cmd = `explorer.exe "${windowsPath}"`;
        console.log(`[DEBUG] Running command: ${cmd}`);

        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.error(`[ERROR] Failed to open explorer: ${error.message}`);
          }
          if (stderr) {
            console.error(`[ERROR] Explorer stderr: ${stderr}`);
          }
          if (stdout) {
            console.log(`[DEBUG] Explorer stdout: ${stdout}`);
          }
        });

        openResult = 'Command sent to explorer.exe';
      } catch (shellError) {
        console.error(`[ERROR] Shell execution failed:`, shellError);
        openResult = `Error: ${shellError.message}`;
      }
    } else {
      openResult = `Not on WSL platform: ${process.platform}`;
    }

    res.json({
      success: true,
      gameId: gameId,
      path: gameDir,
      windowsPath: windowsPath,
      openResult: openResult,
      platform: process.platform,
      isWsl: absolutePath.startsWith('/mnt/')
    });
  } catch (error) {
    console.error('[ERROR] Failed to open directory:', error);
    res.status(500).json({
      error: 'Failed to open directory',
      message: error.message,
      stack: error.stack
    });
  }
});

// Dedicated endpoint for folderCreator.ts compatibility
app.post('/create-folders', async (req, res) => {
  try {
    const { gameId, folders } = req.body;
    console.log(`[DEBUG] Received /create-folders request for ${gameId}`);

    if (!gameId || !folders || !Array.isArray(folders)) {
      return res.status(400).json({ error: 'Missing gameId or folders array' });
    }

    // Validate/Fix gameId
    let targetGameId = gameId;
    if (!targetGameId.includes('_') || !/^\w+_\d{8}$/.test(targetGameId)) {
      if (!targetGameId.includes('_')) {
        const today = new Date();
        const dateStr = today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, '0') +
          String(today.getDate()).padStart(2, '0');
        targetGameId = `${targetGameId}_${dateStr}`;
      }
    }

    const gameDir = path.join(GAMES_DIR, targetGameId);

    // Create base and subfolders
    if (!fs.existsSync(gameDir)) {
      await fsPromises.mkdir(gameDir, { recursive: true });
    }

    const results = [];
    for (const folder of folders) {
      const folderPath = path.join(gameDir, folder);
      if (!fs.existsSync(folderPath)) {
        await fsPromises.mkdir(folderPath, { recursive: true });
        results.push({ folder, created: true });
      } else {
        results.push({ folder, created: false });
      }
    }

    // Create Config if requested (referenced in folderCreator list)
    if (folders.includes('gameconfig') || folders.includes('config')) {
      const configDir = path.join(gameDir, 'config');
      if (!fs.existsSync(configDir)) await fsPromises.mkdir(configDir, { recursive: true });
    }

    console.log(`[DEBUG] Created folder structure for ${targetGameId}`);

    res.json({
      success: true,
      message: 'Folders created',
      path: gameDir,
      gameId: targetGameId,
      details: results
    });

  } catch (error) {
    console.error('[ERROR] /create-folders failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to verify server functionality
app.get('/api/test-directory', async (req, res) => {
  try {
    console.log(`[DEBUG TEST] Testing directory creation`);

    // Create a test game directory
    const today = new Date();
    const dateStr = today.getFullYear() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');

    const testGameId = `test-direct_${dateStr}`;
    const testDir = path.join(GAMES_DIR, testGameId);

    console.log(`[DEBUG TEST] Creating test directory at: ${testDir}`);

    if (!fs.existsSync(testDir)) {
      await fsPromises.mkdir(testDir, { recursive: true });
      console.log(`[DEBUG TEST] Test directory created: ${testDir}`);

      // Write a test file
      const testFile = path.join(testDir, 'test.txt');
      await fsPromises.writeFile(testFile, `Test file created: ${new Date().toISOString()}`);
      console.log(`[DEBUG TEST] Test file created: ${testFile}`);
    } else {
      console.log(`[DEBUG TEST] Test directory already exists: ${testDir}`);
    }

    // List all game directories
    const games = await fsPromises.readdir(GAMES_DIR);
    console.log(`[DEBUG TEST] All game directories: ${games.join(', ')}`);

    // Get absolute path and windows path
    const absolutePath = path.resolve(testDir);
    const windowsPath = absolutePath.replace(/^\/mnt\/([a-z])\//, '$1:\\').replace(/\//g, '\\');

    res.json({
      success: true,
      message: 'Test directory created successfully',
      testDir: testDir,
      absolutePath: absolutePath,
      windowsPath: windowsPath,
      gamesDir: GAMES_DIR,
      games: games
    });
  } catch (error) {
    console.error('[ERROR TEST] Error in test endpoint:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Local network access: http://${localIP}:${PORT}`);
  console.log('To stop the server, press Ctrl+C');

  // Create a log file entry
  const timestamp = new Date().toISOString();
  fs.appendFileSync(
    path.join(__dirname, 'server.log'),
    `${timestamp} - Server started on port ${PORT}\n`
  );
});