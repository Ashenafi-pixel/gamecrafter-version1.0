export const analyzeAudio = async (audioData: ArrayBuffer, url: string): Promise<{
  dur: number;
  sr: number;
}> => {
  return new Promise((resolve) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audio = new Audio(url);
    
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration && isFinite(audio.duration) ? audio.duration : 0;
      resolve({
        dur: duration,
        sr: audioContext.sampleRate
      });
      audio.remove();
    });
    
    audio.addEventListener('error', () => {
      resolve({ dur: 0, sr: 44100 });
      audio.remove();
    });

    setTimeout(() => {
      const duration = audio.duration && isFinite(audio.duration) ? audio.duration : 0;
      resolve({
        dur: duration,
        sr: audioContext.sampleRate
      });
      audio.remove();
    }, 2000);
    
    audio.load();
  });
};
