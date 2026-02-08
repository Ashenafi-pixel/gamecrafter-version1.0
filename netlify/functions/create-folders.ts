import { Handler } from '@netlify/functions';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const handler: Handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    let { gameId, folders = [] } = body;
    
    // Check for gameId in headers (higher priority)
    const headerGameId = event.headers['x-game-id'];
    if (headerGameId) {
      console.log(`Found gameId in headers: ${headerGameId}`);
      gameId = headerGameId;
    }
    
    if (!gameId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Game ID is required' }),
      };
    }
    
    console.log(`Creating folder structure for game: ${gameId}`);
    
    // Base directory for game assets - in Netlify environment, use tmp directory
    const GAME_ASSETS_DIR = path.join(os.tmpdir(), 'game-assets');
    
    // Create the game assets directory if it doesn't exist
    if (!fs.existsSync(GAME_ASSETS_DIR)) {
      fs.mkdirSync(GAME_ASSETS_DIR, { recursive: true });
      console.log(`Created game assets directory: ${GAME_ASSETS_DIR}`);
    }
    
    // Create the game directory if it doesn't exist
    const gameDir = path.join(GAME_ASSETS_DIR, gameId);
    if (!fs.existsSync(gameDir)) {
      fs.mkdirSync(gameDir, { recursive: true });
      console.log(`Created game directory: ${gameDir}`);
    }
    
    // Create standard folders if none specified
    const foldersToCreate = folders.length > 0 ? folders : [
      'symbols',
      'sound',
      'background',
      'frame',
      'gameconfig'
    ];
    
    // Create each requested subfolder
    const createdFolders = [];
    for (const folder of foldersToCreate) {
      const folderPath = path.join(gameDir, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Created folder: ${folderPath}`);
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
      folders: createdFolders,
      environment: 'netlify'
    };
    
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log(`Created game config file: ${configPath}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Successfully created folders for game ${gameId}`,
        path: `/game-assets/${gameId}`,
        folders: createdFolders
      }),
    };
  } catch (error) {
    console.error('Error creating folders:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create folders',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };