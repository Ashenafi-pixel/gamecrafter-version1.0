// Mock sound system for development
export class MockAudio {
  private src: string;
  public volume: number = 1;
  
  constructor(src: string) {
    this.src = src;
  }
  
  play(): Promise<void> {
    // Log sound play attempt for debugging
    console.log(`🔊 Mock sound played: ${this.src} at volume ${this.volume}`);
    return Promise.resolve();
  }
  
  pause(): void {
    console.log(`⏸️ Mock sound paused: ${this.src}`);
  }
  
  addEventListener(event: string, handler: Function): void {
    // Mock event listener
  }
  
  removeEventListener(event: string, handler: Function): void {
    // Mock event listener removal
  }
}

// Sound effects generator using Web Audio API
export function playSound(type: 'spin' | 'win' | 'click', volume: number = 0.5): void {
  console.log(`🔊 Playing ${type} sound at volume ${volume}`);
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case 'spin':
        // Spinning sound - rising frequency
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        break;
        
      case 'win':
        // Win sound - cheerful arpeggio
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(volume * 0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        break;
        
      case 'click':
        // Click sound - short beep
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        break;
    }
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
    
  } catch (e) {
    console.log('Web Audio API not supported, using mock sounds');
  }
}

// Export a function to create safe audio instances
export function createAudio(src: string): HTMLAudioElement | MockAudio {
  try {
    const audio = new Audio(src);
    // Test if audio can be created
    return audio;
  } catch (e) {
    // Fallback to mock audio
    return new MockAudio(src);
  }
}