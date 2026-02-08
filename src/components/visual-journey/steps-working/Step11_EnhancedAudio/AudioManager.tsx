import { createContext, useContext, useRef, ReactNode } from 'react';

interface AudioManagerContextType {
  currentAudio: React.MutableRefObject<HTMLAudioElement | null>;
  stopCurrent: () => void;
}

const AudioManagerContext = createContext<AudioManagerContextType | null>(null);

export const AudioManagerProvider = ({ children }: { children: ReactNode }) => {
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  const stopCurrent = () => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.currentTime = 0;
    }
  };

  return (
    <AudioManagerContext.Provider value={{ currentAudio, stopCurrent }}>
      {children}
    </AudioManagerContext.Provider>
  );
};

export const useAudioManager = () => {
  const context = useContext(AudioManagerContext);
  if (!context) {
    throw new Error('useAudioManager must be used within AudioManagerProvider');
  }
  return context;
};
