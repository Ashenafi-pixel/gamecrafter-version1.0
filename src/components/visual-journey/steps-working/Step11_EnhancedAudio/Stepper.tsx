import React from "react";
import { motion } from 'framer-motion';
// import { Check, ChevronLeft, ChevronRight, } from "lucide-react";
import { Check, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { packs } from "./data";
import type { SoundItemKey, Answer } from "./types";
import { NINTENDO_RED } from "../../../GameCrafterTheme";

interface StepperProps {
  currentAudioTab: string;
  setCurrentAudioTab: (tab: string) => void;
  answers: Record<SoundItemKey, Answer | undefined>;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  skipSound?: boolean;
}

export const Stepper: React.FC<StepperProps> = ({
  currentAudioTab,
  setCurrentAudioTab,
  answers,
  onNextStep,
  onPrevStep,
  skipSound = false
}) => {
  const tabs = [
    { name: "Background", icon: packs[0].icon },
    { name: "Reels", icon: packs[1].icon },
    { name: "UI Micro", icon: packs[2].icon },
    { name: "Wins", icon: packs[3].icon },
    { name: "Bonus", icon: packs[4].icon },
    { name: "Features", icon: packs[5].icon },
    { name: "Ambience", icon: packs[6].icon },
    { name: "Summary", icon: <FileText className="uw:w-10 "/> },
  ];

  const getPackProgress = (packIndex: number) => {
    if (packIndex >= packs.length) return 100; // Summary tab
    const pack = packs[packIndex];
    const completedItems = pack.items.filter(item => answers[item.key]).length;
    return Math.round((completedItems / pack.items.length) * 100);
  };

  const currentIndex = tabs.findIndex(tab => tab.name === currentAudioTab);
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < tabs.length - 1;

  const goToPrevious = () => {
    if (currentAudioTab === "Background" && onPrevStep) {
      onPrevStep();
    } else if (canGoBack) {
      setCurrentAudioTab(tabs[currentIndex - 1].name);
    }
  };

  const goToNext = () => {
    if ((currentAudioTab === "Summary" || skipSound) && onNextStep) {
      onNextStep();
    } else if (canGoNext) {
      setCurrentAudioTab(tabs[currentIndex + 1].name);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-2">
      <div className="max-w-6xl uw:max-w-[120rem] mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Back Button */}
          {currentAudioTab === "Background" ? (
            <button
              onClick={goToPrevious}
              className="flex items-center px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 uw:text-2xl"
            >
              <ChevronLeft size={18} className="mr-1 uw:h-10 uw:w-10" />
              <span>Previous</span>
            </button>
          ) : (
            <button
              onClick={goToPrevious}
              disabled={!canGoBack}
              className="shrink-0 p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed uw:text-2xl"
            >
              <ChevronLeft className="h-4 w-4 uw:h-10 uw:w-10" />
            </button>
          )}

          {/* Steps */}
          <div className="flex items-center gap-1 uw:gap-8 flex-1 justify-center overflow-x-auto uw:overflow-x-hidden">
            {tabs.map((tab, index) => {
              const isActive = tab.name === currentAudioTab;
              const progress = getPackProgress(index);
              const isCompleted = progress === 100;
              const isAccessible = index <= currentIndex;

              return (
                <button
                  key={tab.name}
                  onClick={() => isAccessible ? setCurrentAudioTab(tab.name) : undefined}
                  disabled={!isAccessible}
                  className={`relative flex items-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 min-w-fit flex-shrink-0 hover:bg-gray-100 hover:text-gray-900 ${
                    isActive ? "bg-red-600 text-white" : ""
                  } ${!isAccessible ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className={`relative p-1 rounded transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : isCompleted
                        ? "bg-gray-100 text-green-600"
                        : "bg-gray-100"
                  }`}>
                    {isCompleted && index < packs.length ? (
                      <Check className="h-4 w-4 uw:h-8 uw:w-8" />
                    ) : (
                      <span className="h-4 w-4 uw:w-8">{tab.icon}</span>
                    )}

                    {/* Progress Ring */}
                    {progress > 0 && progress < 100 && index < packs.length && (
                      <motion.div
                        className="absolute inset-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <svg
                          className="absolute inset-0 transform -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeOpacity="0.2"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${progress} 100`}
                            className={isActive ? "text-white" : "text-red-600 uw:text-2xl"}
                          />
                        </svg>
                      </motion.div>
                    )}
                  </div>

                  <span className="text-xs uw:text-2xl font-medium hidden md:block">
                    {tab.name}
                  </span>

                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeStep"
                      className="absolute inset-0 bg-red-600 rounded-lg -z-10"
                      transition={{ type: "spring", duration: 0.3 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          {currentAudioTab === "Summary" || skipSound ? (
            <button
              onClick={goToNext}
              className="flex items-center py-2.5 px-5 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold uw:text-2xl"
              style={{ backgroundColor: NINTENDO_RED }}
            >
              <span className="font-medium">Next Step</span>
              <ChevronRight size={18} className="ml-1.5 uw:h-10 uw:w-10" />
            </button>
          ) : (
            <button
              onClick={goToNext}
              disabled={!canGoNext}
              className="shrink-0 p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed uw:text-2xl"
            >
              <ChevronRight className="h-4 w-4 uw:h-10 uw:w-10" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};