/**
 * Test utility for ElevenLabs integration
 */

import { elevenLabsClient } from './elevenLabsClient';

export async function testElevenLabsConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing ElevenLabs Sound Effects API...');

    // Test with a simple sound effect
    const result = await elevenLabsClient.generateSoundEffect({
      text: 'spinning wheel sound',
      duration_seconds: 2.0,
      prompt_influence: 0.3
    });

    if (result.error) {
      console.error('ElevenLabs test failed:', result.error);
      return false;
    }

    if (result.audio_url) {
      console.log('✅ ElevenLabs Sound Effects test successful');
      // Clean up the test audio URL
      URL.revokeObjectURL(result.audio_url);
      return true;
    }

    return false;
  } catch (error) {
    console.error('ElevenLabs test error:', error);
    return false;
  }
}

export async function testGameAudioGeneration(): Promise<boolean> {
  try {
    console.log('🧪 Testing Game Audio Generation...');

    const result = await elevenLabsClient.generateGameAudio('upbeat', 'clapping hands');

    if (result.error) {
      console.error('Game audio test failed:', result.error);
      return false;
    }

    if (result.audio_url) {
      console.log('✅ Game audio generation test successful');
      URL.revokeObjectURL(result.audio_url);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Game audio test error:', error);
    return false;
  }
}

export async function testVoicesList(): Promise<void> {
  try {
    console.log('🧪 Testing ElevenLabs voices list...');
    const voices = await elevenLabsClient.getVoices();
    console.log('📋 Available voices:', voices.length);
    voices.forEach((voice, index) => {
      console.log(`${index + 1}. ${voice.name} (${voice.voice_id})`);
    });
  } catch (error) {
    console.error('Voices test error:', error);
  }
}

// Export for console testing
(window as any).testElevenLabs = {
  testConnection: testElevenLabsConnection,
  testGameAudio: testGameAudioGeneration,
  testVoices: testVoicesList
};
