import { Handler } from '@netlify/functions';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import fetch from 'node-fetch';

// Convert callbacks to promises
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);

// Define the base images directory
const IMAGES_BASE_DIR = '../../public/game-assets';

// Helper to decode a base64 image
const decodeBase64Image = (dataString: string) => {
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

// Helper to save an image from URL
const saveImageFromUrl = async (url: string, filePath: string): Promise<void> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    await writeFile(filePath, buffer);
  } catch (error) {
    console.error('Error saving image from URL:', error);
    throw error;
  }
};

// Handler for the save-image function
const handler: Handler = async (event, context) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }
  
  try {
    // Parse the request body
    const { image, gameId, symbolName, symbolId, folder } = JSON.parse(event.body || '{}');
    
    // Validate required parameters
    if (!image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required parameter: image' })
      };
    }
    
    if (!gameId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required parameter: gameId' })
      };
    }
    
    // Create the game directory path with optional subfolder
    const baseGameDir = path.join(IMAGES_BASE_DIR, gameId);
    const gameDir = folder ? path.join(baseGameDir, folder) : baseGameDir;
    
    // Check if the directory exists, create it if not
    if (!await exists(gameDir)) {
      await mkdir(gameDir, { recursive: true });
    }
    
    // Generate a filename using symbolId and name if provided, or a timestamp
    const filename = symbolId && symbolName 
      ? `${symbolId}_${symbolName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
      : `symbol_${Date.now()}.png`;
      
    // Complete file path
    const filePath = path.join(gameDir, filename);
    
    // Save the image
    if (image.startsWith('data:')) {
      // Handle base64 image data
      const imageBuffer = decodeBase64Image(image);
      await writeFile(filePath, imageBuffer.data);
    } else if (image.startsWith('http')) {
      // Handle image URL
      await saveImageFromUrl(image, filePath);
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid image format' })
      };
    }
    
    // Build the public URL for the saved image
    // Format: /game-assets/{gameId}/{folder}/{filename} or /game-assets/{gameId}/{filename}
    const publicUrl = folder ? `/game-assets/${gameId}/${folder}/${filename}` : `/game-assets/${gameId}/${filename}`;
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Image saved successfully',
        filePath: publicUrl,
        symbolId
      })
    };
  } catch (error) {
    console.error('Error saving image:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error saving image', error: (error as Error).message })
    };
  }
};

export { handler };