import React, { useState } from "react";
import { Volume2,Info } from "lucide-react";
import { useGameStore } from "../../../../store";
import { PackView } from "./PackView";
import { Summary } from "./Summary";
import { AudioManagerProvider } from "./AudioManager";
import { packs } from "./data";
import { elevenLabsClient } from "../../../../utils/elevenLabsClient";
import { analyzeAudio } from "./audioAnalyzer";
import type { SoundItemKey, Answer, ThemePreset, QualityPreset, WizardState } from "./types";

const Step11_EnhancedAudio: React.FC = () => {
  // State for info hover
  const [infoHovered, setInfoHovered] = useState(false);
  const { currentAudioTab, setCurrentAudioTab, setAudioFile, audioAnswers, setAudioAnswers, skipSound, setSkipSound } = useGameStore();
  
  // Local wizard state (non-answer state)
  const [wizardState, setWizardState] = useState({
    current: 0,
    themePreset: "Custom" as ThemePreset,
    qualityPreset: "Standard" as QualityPreset,
    abCompareMode: false,
    previousVersions: {} as Record<SoundItemKey, Answer | undefined>,
    enabledItems: packs.reduce((acc, pack) => {
      acc[pack.key] = new Set(pack.items.map(item => item.key));
      return acc;
    }, {} as Record<string, Set<SoundItemKey>>),
    loadingStates: {} as Record<SoundItemKey, boolean>,
    itemDurations: {} as Record<SoundItemKey, number>
  });

  const getStepDisplay = () => {
    const tabs = ["Background", "Reels", "UI Micro", "Wins", "Bonus", "Features", "Ambience", "Summary"];
    const currentIndex = tabs.findIndex(tab => tab === currentAudioTab);
    if (currentAudioTab === "Summary") {
      return "Final Review";
    }
    return `${currentIndex + 1} of 7 : ${currentAudioTab}`;
  };

  const getCurrentPack = () => {
    const packMap: Record<string, number> = {
      "Background": 0, "Reels": 1, "UI Micro": 2, "Wins": 3,
      "Bonus": 4, "Features": 5, "Ambience": 6
    };
    const packIndex = packMap[currentAudioTab || "Background"];
    return packs[packIndex];
  };

  // Get audio name and category from itemKey
  const getAudioInfo = (itemKey: SoundItemKey) => {
    const pack = packs.find(p => p.items.some(item => item.key === itemKey));
    const item = pack?.items.find(item => item.key === itemKey);
    const categoryMap: Record<string, string> = {
      'background': 'background',
      'reel': 'reels', 
      'ui': 'ui',
      'wins': 'wins',
      'bonus': 'bonus',
      'features': 'features',
      'ambience': 'ambience'
    };
    return {
      category: categoryMap[pack?.key || ''] || 'background',
      name: item?.key || itemKey  // Use key instead of label for consistent naming
    };
  };

  // ElevenLabs audio generation
  const generateAudio = async (itemKey: SoundItemKey, prompt: string, duration?: number) => {
    // Use stored duration for this item, or default to 3 seconds
    const finalDuration = duration ?? wizardState.itemDurations[itemKey] ?? 3;
    console.log("🚀 ~ generateAudio ~ duration:", finalDuration)

    setWizardState(prev => ({
      ...prev,
      loadingStates: { ...prev.loadingStates, [itemKey]: true }
    }));
    
    try {
      // Store previous version
      const currentAnswer = audioAnswers[itemKey];
      if (currentAnswer) {
        setWizardState(prev => ({
          ...prev,
          previousVersions: { ...prev.previousVersions, [itemKey]: currentAnswer }
        }));
      }

      // Generate audio using ElevenLabs
      const response = await elevenLabsClient.generateSoundEffect({
        text: prompt,
        duration_seconds: finalDuration,
        prompt_influence: 0.3
      });

      if (response.error || !response.audio_url || !response.audio_data) {
        throw new Error(response.error || 'Failed to generate audio');
      }

      // Get audio info for storage
      const { category, name } = getAudioInfo(itemKey);

      // Analyze audio to get real duration and sample rate
      const audioMetadata = await analyzeAudio(response.audio_data, response.audio_url);

      // Store in game store (will replace if exists)
      console.log('🎵 Storing audio file:', { category, name, url: response.audio_url, itemKey });
      setAudioFile(category, name, {
        url: response.audio_url,
        audioData: response.audio_data,
        metadata: { prompt, itemKey, generatedAt: new Date(), ...audioMetadata }
      });

      // Dispatch event to notify SlotMachine of new audio file
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('audioFileUpdated', {
          detail: { category, name, url: response.audio_url, itemKey }
        }));
      }

      const answer: Answer = {
        sourceType: 'generated',
        prompt,
        url: response.audio_url,
        lufs: -14.5 + Math.random() * 5,
        sr: audioMetadata.sr,
        dur: audioMetadata.dur,
        hasIssues: false
      };

      // Update answers immediately
      const currentAnswers = useGameStore.getState().audioAnswers;
      setAudioAnswers({ ...currentAnswers, [itemKey]: answer });
    } catch (error) {
      console.error('Audio generation failed:', error);
      setAudioAnswers({ 
        ...audioAnswers, 
        [itemKey]: {
          sourceType: 'generated',
          prompt,
          url: '',
          hasIssues: true
        }
      });
    } finally {
      setWizardState(prev => ({
        ...prev,
        loadingStates: { ...prev.loadingStates, [itemKey]: false }
      }));
    }
  };

  const uploadAudio = async (itemKey: SoundItemKey, file: File) => {
    setWizardState(prev => ({
      ...prev,
      loadingStates: { ...prev.loadingStates, [itemKey]: true }
    }));
    
    try {
      const url = URL.createObjectURL(file);
      const audioData = await file.arrayBuffer();
      
      // Get audio info for storage
      const { category, name } = getAudioInfo(itemKey);

      // Analyze audio to get real duration and sample rate
      const audioMetadata = await analyzeAudio(audioData, url);

      // Store in game store (will replace if exists)
      console.log('📁 Storing uploaded file:', { category, name, url, itemKey });
      setAudioFile(category, name, {
        url,
        audioData,
        metadata: { fileName: file.name, itemKey, uploadedAt: new Date(), ...audioMetadata }
      });

      // Dispatch event to notify SlotMachine of new audio file
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('audioFileUpdated', {
          detail: { category, name, url, itemKey }
        }));
      }
      
      const answer: Answer = {
        sourceType: 'uploaded',
        fileName: file.name,
        url,
        lufs: -12.5,
        sr: audioMetadata.sr,
        dur: audioMetadata.dur,
        hasIssues: false
      };

      // Update answers immediately
      const currentAnswers = useGameStore.getState().audioAnswers;
      setAudioAnswers({ ...currentAnswers, [itemKey]: answer });
    } catch (error) {
      console.error('Audio upload failed:', error);
    } finally {
      setWizardState(prev => ({
        ...prev,
        loadingStates: { ...prev.loadingStates, [itemKey]: false }
      }));
    }
  };

  const generateAllInPack = async (packIndex: number, metaPrompt: string) => {
    const pack = packs[packIndex];
    if (!pack) return;

    for (const item of pack.items) {
      const prompt = metaPrompt 
        ? `${metaPrompt}, ${item.defaultPrompt}`
        : item.defaultPrompt || '';
      
      // Use stored duration for this item, or default to 3 seconds
      const duration = wizardState.itemDurations[item.key] || 3;
      await generateAudio(item.key, prompt, duration);
    }
    
    // Force UI update after all generations complete
    setWizardState(prev => ({ ...prev }));
  };

  const toggleItem = (packKey: string, itemKey: SoundItemKey) => {
    setWizardState(prev => {
      const newEnabledItems = { ...prev.enabledItems };
      const packSet = new Set(newEnabledItems[packKey] || []);
      
      if (packSet.has(itemKey)) {
        packSet.delete(itemKey);
      } else {
        packSet.add(itemKey);
      }
      
      newEnabledItems[packKey] = packSet;
      return { ...prev, enabledItems: newEnabledItems };
    });
  };

  const updateItemDuration = (itemKey: SoundItemKey, duration: number) => {
    setWizardState(prev => ({
      ...prev,
      itemDurations: { ...prev.itemDurations, [itemKey]: duration }
    }));
  };

  const renderContent = () => {
    if (currentAudioTab === "Summary") {
      return (
        <Summary
          answers={audioAnswers}
          themePreset={wizardState.themePreset}
          qualityPreset={wizardState.qualityPreset}
        />
      );
    }

    const currentPack = getCurrentPack();
    if (!currentPack) {
      return <div className="p-4 border rounded-lg">Pack not found</div>;
    }

    const packMap: Record<string, number> = {
      "Background": 0, "Reels": 1, "UI Micro": 2, "Wins": 3,
      "Bonus": 4, "Features": 5, "Ambience": 6
    };
    const packIndex = packMap[currentAudioTab || "Background"];

    return (
      <PackView
        pack={currentPack}
        packIndex={packIndex}
        answers={audioAnswers}
        loadingStates={wizardState.loadingStates}
        enabledItems={wizardState.enabledItems}
        themePreset={wizardState.themePreset}
        qualityPreset={wizardState.qualityPreset}
        abCompareMode={wizardState.abCompareMode}
        previousVersions={wizardState.previousVersions}
        itemDurations={wizardState.itemDurations}
        onGenerate={generateAudio}
        onUpload={uploadAudio}
        onGenerateAll={generateAllInPack}
        onToggleItem={toggleItem}
        onUpdateDuration={updateItemDuration}
        onSetTheme={(theme) => setWizardState(prev => ({ ...prev, themePreset: theme }))}
        onSetQuality={(quality) => setWizardState(prev => ({ ...prev, qualityPreset: quality }))}
        onToggleAB={() => setWizardState(prev => ({ ...prev, abCompareMode: !prev.abCompareMode }))}
      />
    );
  };

  return (
    <AudioManagerProvider>
      <div className="w-full h-full border relative flex flex-col">
        {/* Header */}
        <div className="w-full bg-white border-l-4 border-l-red-500 border-b p-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50 text-red-600">
            <Volume2 className="h-6 w-6 uw:h-10 uw:w-10" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg uw:text-3xl font-semibold text-gray-900">SlotAI Sound Setup Wizard</h3>
            <p className="text-[#5E6C84] uw:text-2xl">step {getStepDisplay()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-between relative">
          <div className="relative flex items-center">
            {infoHovered && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded shadow-lg p-2 text-xs uw:text-2xl text-gray-800 w-64 whitespace-pre-line text-center">
                Enabling This will skip The Audio section and you can move directly to next Step
              </div>
            )}
            <p
              onMouseEnter={() => setInfoHovered(true)}
              onMouseLeave={() => setInfoHovered(false)}
              className="cursor-pointer relative flex items-center"
            >
              <Info size={16} className="uw:h-7 uw:w-7"  />
            </p>
          </div>
          <label htmlFor="no-sound-checkbox" className="text-gray-700 uw:text-2xl font-medium select-none">
            Skip Sound
          </label>
          <input
            type="checkbox"
            id="no-sound-checkbox"
            checked={skipSound}
            onChange={(e) => setSkipSound(e.target.checked)}
            className="accent-red-500 w-4 h-4 uw:h-6 uw:w-6 rounded border-gray-300 focus:ring-red-500 focus:ring-2"
          />
        </div>
      </div>

      {/* Dynamic Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {renderContent()}
      </div>

        {/* Bottom Stepper Navigation */}
        {/* <Stepper
          currentAudioTab={currentAudioTab || "Background"}
          setCurrentAudioTab={setCurrentAudioTab}
          answers={wizardState.answers}
        /> */}
      </div>
    </AudioManagerProvider>
  );
};

export default Step11_EnhancedAudio;