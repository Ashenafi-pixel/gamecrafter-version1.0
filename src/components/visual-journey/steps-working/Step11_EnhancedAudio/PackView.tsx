import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, Upload, GitCompare, ChevronDown, ChevronUp
} from "lucide-react";
import { ItemCard } from "./ItemCard";
import { AudioPlayer } from "./AudioPlayer";
import type { Pack, SoundItemKey, Answer, ThemePreset, QualityPreset } from "./types";

interface PackViewProps {
  pack: Pack;
  packIndex: number;
  answers: Record<SoundItemKey, Answer | undefined>;
  loadingStates: Record<SoundItemKey, boolean>;
  enabledItems: Record<string, Set<SoundItemKey>>;
  themePreset: ThemePreset;
  qualityPreset: QualityPreset;
  abCompareMode: boolean;
  previousVersions: Record<SoundItemKey, Answer | undefined>;
  itemDurations: Record<SoundItemKey, number>;
  onGenerate: (itemKey: SoundItemKey, prompt: string, duration?: number) => void;
  onUpload: (itemKey: SoundItemKey, file: File) => void;
  onGenerateAll: (packIndex: number, metaPrompt: string) => void;
  onToggleItem: (packKey: string, itemKey: SoundItemKey) => void;
  onUpdateDuration: (itemKey: SoundItemKey, duration: number) => void;
  onSetTheme: (theme: ThemePreset) => void;
  onSetQuality: (quality: QualityPreset) => void;
  onToggleAB: () => void;
}

export const PackView: React.FC<PackViewProps> = ({ 
  pack, packIndex, answers, loadingStates, enabledItems, 
  themePreset, qualityPreset, abCompareMode, previousVersions, itemDurations,
  onGenerate, onUpload, onGenerateAll, onToggleItem, onUpdateDuration,
  onSetTheme, onSetQuality, onToggleAB
}) => {
  const [metaPrompt, setMetaPrompt] = useState('');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);

  const packEnabledItems = enabledItems[pack.key] || new Set();
  const activeItems = pack.items.filter(item => packEnabledItems.has(item.key));
  const generatedItems = activeItems.filter(item => answers[item.key]);
  const progress = Math.round((generatedItems.length / pack.items.length) * 100);

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    try {
      await onGenerateAll(packIndex, metaPrompt);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const themePresets: ThemePreset[] = ['Candy Land', 'Ancient Egypt', 'Western', 'Cyberpunk', 'Aztec', 'Custom'];
  const qualityPresets: QualityPreset[] = ['Lite', 'Standard', 'AAA'];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pack.key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Pack Header */}
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              {pack.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-xl uw:text-3xl font-bold">{pack.title}</h2>
              {pack.description && (
                <p className="text-gray-600 text-sm uw:text-2xl mt-1">{pack.description}</p>
              )}
            </div>
            <div className={`px-3 py-1 rounded text-sm uw:text-xl font-medium ${
              progress === 100 ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {progress}% Complete
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Generate ${pack.title.toLowerCase()} sounds...`}
                  value={metaPrompt}
                  onChange={(e) => setMetaPrompt(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded uw:text-xl"
                />
                <button
                  onClick={handleGenerateAll}
                  disabled={isGeneratingAll}
                  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 flex items-center gap-2 uw:text-2xl"
                >
                  <Wand2 className={`h-4 w-4 uw:h-6 uw:w-6 ${isGeneratingAll ? "animate-spin" : ""}`} />
                  {isGeneratingAll ? 'Generating...' : 'Generate All'}
                </button>
              </div>

              <div className="flex gap-2 items-center">
                <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50 flex items-center gap-1 uw:text-2xl">
                  <Upload className="h-4 w-4 uw:h-6 uw:w-6" />
                  Upload Files
                </button>

                <button
                  onClick={() => setShowItemSelector(!showItemSelector)}
                  className="px-3 py-1 border rounded text-sm uw:text-2xl hover:bg-gray-50 flex items-center gap-1"
                >
                  Select Sounds ({activeItems.length})
                  {showItemSelector ? <ChevronUp className="h-3 w-3 uw:h-10 uw:w-10" /> : <ChevronDown className="h-3 w-3 uw:h-10 uw:w-10" />}
                </button>

                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="px-3 py-1 border rounded text-sm uw:text-2xl hover:bg-gray-50 flex items-center gap-1"
                >
                  Settings
                  {showAdvanced ? <ChevronUp className="h-3 w-3 uw:h-10 uw:w-10" /> : <ChevronDown className="h-3 w-3 uw:h-10 uw:w-10" />}
                </button>
              </div>
            </div>

            {/* Generated Sounds Preview */}
            {generatedItems.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm uw:text-3xl font-medium text-green-800">Generated Sounds ({generatedItems.length})</span>
                  <span className="text-xs uw:text-2xl text-green-600">Ready to use</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {generatedItems.map((item) => {
                    const answer = answers[item.key];
                    return (
                      <div key={item.key} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs uw:text-xl font-medium truncate">{item.label}</div>
                          <div className="text-xs uw:text-xl  text-gray-500">
                            {answer?.dur && `${answer.dur.toFixed(1)}s`}
                          </div>
                        </div>
                        <AudioPlayer url={answer?.url} size="sm"/>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Item Selector */}
            <AnimatePresence>
              {showItemSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="mb-3">
                    <h4 className="text-sm uw:text-2xl font-medium">Select Sounds to Generate</h4>
                    <p className="text-xs uw:text-xl text-gray-500">Toggle individual sounds on/off</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pack.items.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => onToggleItem(pack.key, item.key)}
                        className={`px-3 py-1 text-sm uw:text-2xl rounded-md border transition-colors ${
                          packEnabledItems.has(item.key)
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {packEnabledItems.has(item.key) ? '✓' : '○'} {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Advanced Settings */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm  uw:text-2xl font-medium">Theme</label>
                      <select
                        value={themePreset}
                        onChange={(e) => onSetTheme(e.target.value as ThemePreset)}
                        className="w-full px-3 py-2 border rounded uw:text-2xl"
                      >
                        {themePresets.map((theme) => (
                          <option key={theme} value={theme}>{theme}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm uw:text-2xl font-medium">Quality</label>
                      <div className="flex rounded-md border border-gray-200">
                        {qualityPresets.map((quality) => (
                          <button
                            key={quality}
                            onClick={() => onSetQuality(quality)}
                            className={`flex-1 px-3 py-2 text-sm uw:text-2xl font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                              qualityPreset === quality
                                ? "bg-red-600 text-white"
                                : "hover:bg-gray-100 text-gray-600"
                            }`}
                          >
                            {quality}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm uw:text-2xl font-medium">A/B Compare</label>
                      <button
                        onClick={onToggleAB}
                        className={`w-full px-3 py-2 uw:text-2xl rounded flex items-center justify-center gap-2 ${
                          abCompareMode ? "bg-red-600 text-white" : "border hover:bg-gray-50"
                        }`}
                      >
                        <GitCompare className="h-4 w-4 uw:h-6 uw:w-6 uw:text-xl" />
                        {abCompareMode ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Individual Item Cards */}
        {activeItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {activeItems.map((item, index) => (
              <ItemCard
                key={item.key}
                itemKey={item.key}
                label={item.label}
                placeholder={item.placeholder}
                defaultPrompt={item.defaultPrompt}
                gridIndex={index}
                answers={answers}
                loadingStates={loadingStates}
                itemDurations={itemDurations}
                onGenerate={onGenerate}
                onUpload={onUpload}
                onUpdateDuration={onUpdateDuration}
                abCompareMode={abCompareMode}
                previousVersions={previousVersions}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};