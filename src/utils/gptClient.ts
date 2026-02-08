/**
 * GPT Client for image generation using GPT-image-1
 */

import { GameConfig } from '../types';

export interface GPTConfig {
  apiKey: string;
  modelName: string;
}

export const getGPTConfig = (config: Partial<GameConfig>): GPTConfig => {
  return {
    apiKey: config.openaiApiKey || '',
    modelName: 'gpt-image-1'
  };
};

// GPT client for image generation
export const gptClient = {
  generateImage: async (prompt: string): Promise<{imageUrl: string; seed?: number}> => {
    try {
      console.log('🎨 Generating image with gpt-image-1:', prompt);
      
      const response = await fetch('/.netlify/functions/gpt-image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          model: 'gpt-image-1',
          size: '512x512',
          quality: 'standard',
          n: 1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        console.log('✅ Image generated successfully:', data.imageUrl);
        return {
          imageUrl: data.imageUrl,
          seed: data.seed || Math.floor(Math.random() * 10000)
        };
      } else {
        throw new Error(data.error || 'Image generation failed');
      }
    } catch (error) {
      console.error('❌ GPT-image-1 generation failed:', error);
      throw error;
    }
  },
  
  testConnection: async (): Promise<boolean> => {
    try {
      const response = await fetch('/.netlify/functions/gpt-image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test connection',
          model: 'gpt-image-1',
          test: true
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ GPT connection test failed:', error);
      return false;
    }
  }
};