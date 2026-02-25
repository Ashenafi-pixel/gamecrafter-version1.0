import { Howl, Howler } from 'howler';
import { 
  IAudioManager, 
  SoundType, 
  SoundDefinition,
  AudioState 
} from '../core/interfaces';

// Define AudioConfig locally if not available
interface AudioConfig {
  masterVolume?: number;
  musicVolume?: number;
  effectsVolume?: number;
  muted?: boolean;
  musicEnabled?: boolean;
  effectsEnabled?: boolean;
}

export class AudioManager implements IAudioManager {
  private sounds: Map<string, Howl> = new Map();
  private soundQueues: Map<SoundType, string[]> = new Map();
  private currentMusic: string | null = null;
  private state: AudioState = {
    masterVolume: 1.0,
    musicVolume: 0.7,
    effectsVolume: 1.0,
    muted: false,
    musicEnabled: true,
    effectsEnabled: true
  };
  
  constructor() {
    // Initialize sound type queues
    this.soundQueues.set('music', []);
    this.soundQueues.set('effect', []);
    this.soundQueues.set('ambient', []);
    this.soundQueues.set('ui', []);
  }
  
  async initialize(config?: AudioConfig): Promise<void> {
    console.log('🔊 Initializing Audio Manager');
    
    // Apply configuration
    if (config) {
      this.state = { ...this.state, ...config };
      Howler.volume(this.state.masterVolume);
    }
    
    // Set up visibility change handler for mobile
    this.setupVisibilityHandler();
    
    console.log('✅ Audio Manager initialized');
  }
  
  destroy(): void {
    console.log('🧹 Destroying Audio Manager');
    
    // Stop all sounds
    this.stopAll();
    
    // Unload all sounds
    this.sounds.forEach(sound => {
      sound.unload();
    });
    this.sounds.clear();
    
    // Clear queues
    this.soundQueues.clear();
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    console.log('✅ Audio Manager destroyed');
  }
  
  async loadSound(definition: SoundDefinition): Promise<void> {
    console.log(`📦 Loading sound: ${definition.id}`);
    
    try {
      const sound = new Howl({
        src: [definition.url],
        loop: definition.loop || false,
        volume: definition.volume || 1.0,
        preload: true,
        html5: definition.stream || false,
        onload: () => {
          console.log(`✅ Sound loaded: ${definition.id}`);
        },
        onloaderror: (_id, error) => {
          console.error(`Failed to load sound ${definition.id}:`, error);
        }
      });
      
      this.sounds.set(definition.id, sound);
      
      // Add to appropriate queue
      const queue = this.soundQueues.get(definition.type);
      if (queue && !queue.includes(definition.id)) {
        queue.push(definition.id);
      }
      
    } catch (error) {
      console.error(`Failed to create sound ${definition.id}:`, error);
    }
  }
  
  async loadSounds(definitions: SoundDefinition[]): Promise<void> {
    console.log(`📦 Loading ${definitions.length} sounds`);
    
    const promises = definitions.map(def => this.loadSound(def));
    await Promise.all(promises);
    
    console.log('✅ All sounds loaded');
  }
  
  play(id: string, options?: { volume?: number; loop?: boolean }): number {
    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`Sound not found: ${id}`);
      return -1;
    }
    
    // Check if sound type is enabled
    const soundType = this.getSoundType(id);
    if (soundType === 'music' && !this.state.musicEnabled) return -1;
    if (soundType === 'effect' && !this.state.effectsEnabled) return -1;
    
    // Apply options
    if (options?.volume !== undefined) {
      sound.volume(options.volume * this.getVolumeForType(soundType));
    }
    if (options?.loop !== undefined) {
      sound.loop(options.loop);
    }
    
    return sound.play();
  }
  
  stop(id: string): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.stop();
    }
  }
  
  pause(id: string): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.pause();
    }
  }
  
  resume(id: string): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.play();
    }
  }
  
  stopAll(): void {
    this.sounds.forEach(sound => {
      sound.stop();
    });
  }
  
  playMusic(id: string, fadeIn: number = 1000): void {
    // Stop current music with fade out
    if (this.currentMusic) {
      const currentSound = this.sounds.get(this.currentMusic);
      if (currentSound) {
        currentSound.fade(currentSound.volume(), 0, fadeIn);
        currentSound.once('fade', () => {
          currentSound.stop();
        });
      }
    }
    
    // Play new music with fade in
    const newMusic = this.sounds.get(id);
    if (newMusic && this.state.musicEnabled) {
      newMusic.volume(0);
      newMusic.loop(true);
      newMusic.play();
      newMusic.fade(0, this.state.musicVolume, fadeIn);
      this.currentMusic = id;
    }
  }
  
  stopMusic(fadeOut: number = 1000): void {
    if (this.currentMusic) {
      const music = this.sounds.get(this.currentMusic);
      if (music) {
        music.fade(music.volume(), 0, fadeOut);
        music.once('fade', () => {
          music.stop();
          this.currentMusic = null;
        });
      }
    }
  }
  
  playEffect(id: string, volume: number = 1.0): void {
    if (this.state.effectsEnabled) {
      this.play(id, { 
        volume: volume * this.state.effectsVolume,
        loop: false 
      });
    }
  }
  
  setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.state.masterVolume);
  }
  
  setMusicVolume(volume: number): void {
    this.state.musicVolume = Math.max(0, Math.min(1, volume));
    
    // Update current music volume
    if (this.currentMusic) {
      const music = this.sounds.get(this.currentMusic);
      if (music) {
        music.volume(this.state.musicVolume);
      }
    }
  }
  
  setEffectsVolume(volume: number): void {
    this.state.effectsVolume = Math.max(0, Math.min(1, volume));
  }
  
  mute(): void {
    this.state.muted = true;
    Howler.mute(true);
  }
  
  unmute(): void {
    this.state.muted = false;
    Howler.mute(false);
  }
  
  toggleMute(): void {
    if (this.state.muted) {
      this.unmute();
    } else {
      this.mute();
    }
  }
  
  enableMusic(): void {
    this.state.musicEnabled = true;
  }
  
  disableMusic(): void {
    this.state.musicEnabled = false;
    this.stopMusic();
  }
  
  enableEffects(): void {
    this.state.effectsEnabled = true;
  }
  
  disableEffects(): void {
    this.state.effectsEnabled = false;
  }
  
  getState(): AudioState {
    return { ...this.state };
  }
  
  // Private methods
  
  private getSoundType(id: string): SoundType {
    for (const [type, ids] of this.soundQueues.entries()) {
      if (ids.includes(id)) {
        return type;
      }
    }
    return 'effect'; // Default to effect
  }
  
  private getVolumeForType(type: SoundType): number {
    switch (type) {
      case 'music':
        return this.state.musicVolume;
      case 'effect':
      case 'ui':
        return this.state.effectsVolume;
      case 'ambient':
        return this.state.musicVolume * 0.5; // Ambient at half music volume
      default:
        return 1.0;
    }
  }
  
  private setupVisibilityHandler(): void {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      // Pause all sounds when tab becomes hidden
      this.sounds.forEach(sound => {
        if (sound.playing()) {
          sound.pause();
        }
      });
    } else {
      // Resume music when tab becomes visible
      if (this.currentMusic && this.state.musicEnabled) {
        const music = this.sounds.get(this.currentMusic);
        if (music && !music.playing()) {
          music.play();
        }
      }
    }
  };
  
  // Preload common sounds for better performance
  async preloadCommonSounds(): Promise<void> {
    const commonSounds: SoundDefinition[] = [
      // { id: 'spin_start', url: '/sounds/spin_start.mp3', type: 'effect' }, // Commented out - file not available
      { id: 'spin_stop', url: '/sounds/spin_stop.mp3', type: 'effect' },
      { id: 'reel_stop', url: '/sounds/reel_stop.mp3', type: 'effect' },
      { id: 'win_small', url: '/sounds/win_small.mp3', type: 'effect' },
      { id: 'win_medium', url: '/sounds/win_medium.mp3', type: 'effect' },
      { id: 'win_big', url: '/sounds/win_big.mp3', type: 'effect' },
      { id: 'coin_drop', url: '/sounds/coin_drop.mp3', type: 'effect' },
      { id: 'button_click', url: '/sounds/button_click.mp3', type: 'ui' },
      { id: 'button_hover', url: '/sounds/button_hover.mp3', type: 'ui' }
    ];
    
    await this.loadSounds(commonSounds);
  }
}