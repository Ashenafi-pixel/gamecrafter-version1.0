/**
 * Placeholder for the removed GPT API client
 * 
 * This file exists only to satisfy imports in the codebase
 * The actual GPT/DALL-E API integration has been removed as requested
 */

import { GameConfig } from '../types';

export interface GPTConfig {
  apiKey: string;
  modelName: string;
}

// Placeholder functions that return fallback values
export const getGPTConfig = (config: Partial<GameConfig>): GPTConfig => {
  return {
    apiKey: '',
    modelName: 'removed'
  };
};

// Simplified GPT client with fallback behavior
export const gptClient = {
  // Placeholder for image generation
  generateImage: async (prompt: string): Promise<{imageUrl: string; seed?: number}> => {
    console.warn('GPT/DALL-E API integration has been removed');
    return {
      imageUrl: '/public/themes/base-style.avif',
      seed: 12345
    };
  },
  
  // Placeholder for connection testing
  testConnection: async (): Promise<boolean> => {
    console.warn('GPT/DALL-E API integration has been removed');
    return false;
  }
};