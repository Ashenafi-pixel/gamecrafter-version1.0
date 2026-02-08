/**
 * ElevenLabs Sound Effects API Client
 */

export interface ElevenLabsConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface SoundEffectRequest {
  text: string;
  duration_seconds?: number;
  prompt_influence?: number;
}

export interface AudioGenerationResponse {
  audio_url?: string;
  audio_data?: ArrayBuffer;
  error?: string;
  source?: 'sound_effects' | 'text_to_speech';
}

export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
}

export class ElevenLabsClient {
  private config: ElevenLabsConfig;
  private baseUrl: string;
  private cachedVoices: Voice[] | null = null;

  constructor(config: ElevenLabsConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.elevenlabs.io';
  }

  /**
   * Generate sound effects using ElevenLabs Sound Effects API
   */
  async generateSoundEffect(request: SoundEffectRequest): Promise<AudioGenerationResponse> {
    try {
      const url = `${this.baseUrl}/v1/sound-generation`;

      const payload = {
        text: request.text,
        duration_seconds: request.duration_seconds || 3.0,
        prompt_influence: request.prompt_influence || 0.3
      };

      console.log('🔊 Generating sound effect with ElevenLabs:', { url, payload });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs Sound Effects API error:', response.status, errorText);
        return { error: `API Error: ${response.status} - ${errorText}` };
      }

      // Get the audio data as ArrayBuffer
      const audioData = await response.arrayBuffer();

      // Create a blob URL for playback
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('✅ Sound effect generated successfully');
      return { audio_url: audioUrl, audio_data: audioData, source: 'sound_effects' };

    } catch (error) {
      console.error('ElevenLabs sound effect generation failed:', error);
      return { error: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Get available voices from ElevenLabs with caching
   */
  async getVoices(): Promise<Voice[]> {
    // Return cached voices if available
    if (this.cachedVoices) {
      return this.cachedVoices;
    }

    try {
      console.log('🎤 Fetching available voices from ElevenLabs...');
      const response = await fetch(`${this.baseUrl}/v1/voices`, {
        headers: {
          'xi-api-key': this.config.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs Voices API error:', response.status, errorText);
        throw new Error(`Failed to fetch voices: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const voices: Voice[] = (data.voices || []).map((voice: any) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description
      }));

      // Cache the voices
      this.cachedVoices = voices;
      console.log(`✅ Fetched ${voices.length} voices successfully`);

      return voices;
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      return [];
    }
  }

  /**
   * Generate text-to-speech using ElevenLabs TTS API
   */
  async generateTextToSpeech(text: string, voiceId?: string): Promise<AudioGenerationResponse> {
    try {
      // Use a default voice if none provided (Rachel voice)
      const defaultVoiceId = 'ErXwobaYiN019PkySvjV';
      const selectedVoiceId = voiceId || defaultVoiceId;

      const url = `${this.baseUrl}/v1/text-to-speech/${selectedVoiceId}`;

      const payload = {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.6
        }
      };

      console.log('🗣️ Generating text-to-speech with ElevenLabs:', { url, text: text.substring(0, 50) + '...' });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs TTS API error:', response.status, errorText);
        return { error: `TTS API Error: ${response.status} - ${errorText}` };
      }

      // Get the audio data as ArrayBuffer
      const audioData = await response.arrayBuffer();

      // Create a blob URL for playback
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('✅ Text-to-speech generated successfully');
      return { audio_url: audioUrl, audio_data: audioData, source: 'text_to_speech' };

    } catch (error) {
      console.error('ElevenLabs text-to-speech generation failed:', error);
      return { error: `TTS generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Generate game sound effects based on music track and prompt
   */
  async generateGameAudio(musicTrack: string, prompt: string): Promise<AudioGenerationResponse> {
    // Create a contextual prompt based on the selected music track
    const trackContexts = {
      upbeat: 'energetic, exciting, casino-style',
      mysterious: 'enigmatic, suspenseful, mysterious',
      epic: 'grand, inspiring, orchestral',
      relaxing: 'calm, serene, peaceful',
      tense: 'anticipation, excitement, tension',
      playful: 'fun, lighthearted, cheerful'
    };

    const context = trackContexts[musicTrack as keyof typeof trackContexts] || 'gaming';
    const enhancedPrompt = `${context} ${prompt} sound effect for slot game`;

    // Determine duration based on prompt type
    let duration = 3.0;
    if (prompt.toLowerCase().includes('spin')) duration = 2.0;
    if (prompt.toLowerCase().includes('win') || prompt.toLowerCase().includes('jackpot')) duration = 4.0;
    if (prompt.toLowerCase().includes('clap') || prompt.toLowerCase().includes('click')) duration = 1.0;

    return this.generateSoundEffect({
      text: enhancedPrompt,
      duration_seconds: duration,
      prompt_influence: 0.4
    });
  }
}

// Create a singleton instance
const elevenLabsClient = new ElevenLabsClient({
  apiKey: 'sk_e4d596cf664e6a52e32ca3ead3d8dc99a5bacd416347216c'
});

export { elevenLabsClient };
