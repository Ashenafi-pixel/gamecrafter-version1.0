import React, { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { useAudioManager } from "./AudioManager";

interface AudioPlayerProps {
  url?: string;
  size?: "sm" | "md";
  abMode?: boolean;
  abUrl?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  url, 
  size = "md", 
  abMode, 
  abUrl 
}) => {
  const { currentAudio, stopCurrent } = useAudioManager();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingAB, setIsPlayingAB] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioABRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleGlobalStop = () => {
      if (audioRef.current !== currentAudio.current) setIsPlaying(false);
      if (audioABRef.current !== currentAudio.current) setIsPlayingAB(false);
    };
    
    const interval = setInterval(handleGlobalStop, 100);
    return () => {
      clearInterval(interval);
      audioRef.current?.pause();
      audioABRef.current?.pause();
    };
  }, [currentAudio]);

  const toggleAudio = (audioUrl?: string, isAB = false) => {
    if (!audioUrl) return;
    
    const localAudioRef = isAB ? audioABRef : audioRef;
    const currentIsPlaying = isAB ? isPlayingAB : isPlaying;
    const setCurrentIsPlaying = isAB ? setIsPlayingAB : setIsPlaying;
    
    if (currentIsPlaying && localAudioRef.current) {
      localAudioRef.current.pause();
      localAudioRef.current.currentTime = 0;
      setCurrentIsPlaying(false);
      currentAudio.current = null;
    } else {
      stopCurrent();
      if (!localAudioRef.current || localAudioRef.current.src !== audioUrl) {
        localAudioRef.current = new Audio(audioUrl);
        localAudioRef.current.onended = () => {
          setCurrentIsPlaying(false);
          currentAudio.current = null;
        };
      }
      currentAudio.current = localAudioRef.current;
      localAudioRef.current.play().catch(console.error);
      setCurrentIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => toggleAudio(url)}
        disabled={!url}
        className={`
          flex items-center justify-center rounded-full transition-colors
          ${size === "sm" ? "w-8 h-8" : "w-10 h-10"}
          ${url 
            ? "bg-red-600 text-white hover:bg-red-700" 
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }
        `}
      >
        {isPlaying ? (
          <Pause className={size === "sm" ? "w-3 h-3 uw:h-6 uw:w-6" : "w-4 h-4 uw:h-6 uw:w-6"} />
        ) : (
          <Play className={size === "sm" ? "w-3 h-3 uw:h-6 uw:w-6" : "w-4 h-4 uw:h-6 uw:w-6"} />
        )}
      </button>
      {abMode && abUrl && (
        <button
          onClick={() => toggleAudio(abUrl, true)}
          className={`
            flex items-center justify-center rounded-full transition-colors
            ${size === "sm" ? "w-8 h-8" : "w-10 h-10"}
            bg-blue-600 text-white hover:bg-blue-700
          `}
        >
          {isPlayingAB ? (
            <Pause className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
          ) : (
            <span className="text-xs uw:text-2xl font-bold">B</span>
          )}
        </button>
      )}
    </div>
  );
};