import React, { useState } from "react";
import { Upload, Wand2, AlertTriangle, Check } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import type { SoundItemKey, Answer } from "./types";

interface ItemCardProps {
  itemKey: SoundItemKey;
  label: string;
  placeholder?: string;
  defaultPrompt?: string;
  gridIndex?: number;
  answers: Record<SoundItemKey, Answer | undefined>;
  loadingStates: Record<SoundItemKey, boolean>;
  itemDurations: Record<SoundItemKey, number>;
  onGenerate: (itemKey: SoundItemKey, prompt: string, duration?: number) => void;
  onUpload: (itemKey: SoundItemKey, file: File) => void;
  onUpdateDuration: (itemKey: SoundItemKey, duration: number) => void;
  abCompareMode: boolean;
  previousVersions: Record<SoundItemKey, Answer | undefined>;
}

export const ItemCard: React.FC<ItemCardProps> = ({ 
  itemKey, label, placeholder, defaultPrompt, gridIndex, 
  answers, loadingStates, itemDurations, onGenerate, onUpload, onUpdateDuration, abCompareMode, previousVersions 
}) => {
  const [prompt, setPrompt] = useState(defaultPrompt || '');
  const [duration, setDuration] = useState(itemDurations[itemKey] || 3);
  const answer = answers[itemKey];
  const isLoading = loadingStates[itemKey] || false;
  const previousVersion = previousVersions[itemKey];

  const handleGenerate = () => {
    if (!prompt.trim() || isLoading) return;
    onGenerate(itemKey, prompt, duration);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(itemKey, file);
    }
  };


  return (
    <div className="relative border rounded-lg p-4 bg-white hover:shadow-md transition-all">
      {gridIndex !== undefined && (
        <div className="absolute -top-2 -left-2 z-10">
          <div className="h-5 w-5 uw:h-8 uw:w-8 bg-gray-200 text-xs uw:text-2xl uw:bg-gray-200 uw:rounded rounded flex items-center justify-center">
            {gridIndex + 1}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 ">
        <h3 className="font-medium text-sm uw:text-2xl uw:mt-4">{label}</h3>
        {answer?.hasIssues && (
          <div className="text-orange-600 text-xs uw:text-2xl flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 uw:h-9 uw:w-9" />
            Issues
          </div>
        )}
        {answer && !answer.hasIssues && (
          <div className="text-green-600 text-xs uw:text-xl flex items-center gap-1">
            <Check className="h-3 w-3 uw:h-6 uw:w-6" />
            Ready
          </div>
        )}
      </div>

      <div className="space-y-2 mb-3">
        <input
          type="text"
          placeholder={placeholder || "Describe the sound you want..."}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded text-sm uw:text-2xl"
        />

        <div className="flex items-center gap-2">
          <label className="text-xs uw:text-2xl text-gray-600 whitespace-nowrap">Duration:</label>
          <input
            type="range"
            min="0.5"
            max="30"
            step="0.5"
            value={duration}
            onChange={(e) => {
              const newDuration = parseFloat(e.target.value);
              setDuration(newDuration);
              onUpdateDuration(itemKey, newDuration);
            }}
            disabled={isLoading}
            className="flex-1"
          />
          <span className="text-xs uw:text-2xl text-gray-600 w-10">{duration}s</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded text-sm uw:text-2xl hover:bg-red-700 disabled:bg-gray-300"
          >
            <Wand2 className={`h-3 w-3 uw:h-6 uw:w-6 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? 'Generating...' : 'Generate'}
          </button>

          <label className="flex items-center gap-1 px-3 py-2 border rounded text-sm uw:text-2xl cursor-pointer hover:bg-gray-50">
            <Upload className="h-3 w-3 uw:h-6 uw:w-6" />
            Upload
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {answer ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between ">
            <AudioPlayer
              url={answer.url}
              abMode={abCompareMode}
              abUrl={previousVersion?.url}
              size="sm"
            />
          </div>

          {answer && (
            <div className="flex items-center gap-2 text-xs uw:text-2xl text-gray-500 ">
              {answer.dur && <span>{answer.dur.toFixed(1)}s</span>}
              {answer.lufs && <span>{answer.lufs.toFixed(1)} LUFS</span>}
              {answer.keySig && <span>{answer.keySig}</span>}
              {answer.bpm && <span>{answer.bpm} BPM</span>}
            </div>
          )}

          <div className="text-xs uw:text-2xl text-gray-500">
            {answer.sourceType === 'uploaded' ? (
              <span>📁 {answer.fileName}</span>
            ) : (
              <span>🎵 Generated</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-sm uw:text-2xl text-gray-500">
          No audio generated yet
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      )}
    </div>
  );
};