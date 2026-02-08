import React, { useState } from "react";
import { useGameStore } from "../../../store";
import { Music, Disc, MousePointer, Trophy, GitBranch, Star, Waves, Hourglass, Play, Upload, ChevronDown, Loader2 } from "lucide-react";
import BackgroundTab from "./step11_Tabs/BackgroundTab";
import ReelsTab from "./step11_Tabs/ReelsTab";
type AudioType = 'MusicBed' | 'AlternateLoop';
type QualityType = 'Lite' | 'Standard' | 'AAA';

const AudioComponent: React.FC = () => {
    const {
        currentAudioTab,
        setCurrentAudioTab,
        generateAudio,isAudioGenerating,setIsAudioGenerating
    } = useGameStore();

    const [prompt, setPrompt] = useState<string>("Western saloon music");
    const tabs = [
        { name: "Background", icon: <Music size={16} /> },
        { name: "Reels", icon: <Disc size={16} /> },
        { name: "UI Micro", icon: <MousePointer size={16} /> },
        { name: "Wins", icon: <Trophy size={16} /> },
        { name: "Bonus", icon: <GitBranch size={16} /> },
        { name: "Features", icon: <Star size={16} /> },
        { name: "Ambience", icon: <Waves size={16} /> },
        { name: "Summary", icon: <Hourglass size={16} /> },
    ];

    const getStepDisplay = () => {
        const currentIndex = tabs.findIndex(tab => tab.name === currentAudioTab);
        if (currentAudioTab === "Summary") {
            return "Final Review";
        }
        return `${currentIndex + 1} of 7 : ${currentAudioTab}`;
    };
    

    const playAudio = (url: string) => {
        const audio = new Audio(url);
        audio.play().catch(console.error);
    };

    const renderContent = () => {
        switch (currentAudioTab) {
            case "Background":
                return (
                    <BackgroundTab/>
                );
            case "Reels":
                return (
                    <ReelsTab/>
                );
            case "UI Micro":
                return <div className="p-4 border rounded-lg">UI Micro dummy section</div>;
            case "Wins":
                return <div className="p-4 border rounded-lg">Wins dummy section</div>;
            case "Bonus":
                return <div className="p-4 border rounded-lg">Bonus dummy section</div>;
            case "Features":
                return <div className="p-4 border rounded-lg">Features dummy section</div>;
            case "Ambience":
                return <div className="p-4 border rounded-lg">Ambience dummy section</div>;
            case "Summary":
                return <div className="p-4 border rounded-lg">Summary dummy section</div>;
            default:
                return <div className="p-4 border rounded-lg">Select a tab</div>;
        }
    };

    return (
        <div className="w-full h-full border relative flex flex-col">
            <div
                className="w-full bg-white border-l-4 border-l-red-500 border-b p-1 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
                <div className="flex flex-col">
                    <h3 className="text-lg uw:text-2xl font-semibold text-gray-900">SlotAi Sound Setup Wizard</h3>
                    <p className="text-[#5E6C84]">step {getStepDisplay()}</p>
                </div>
            </div>
            {/* No sound checkbox */}
            <div className="flex items-center mb-2 w-full border p-4 justify-between">
                <label htmlFor="no-sound-checkbox" className="ml-2 text-gray-700 font-medium select-none">
                    Skip Sound
                </label>
                <input
                    type="checkbox"
                    id="no-sound-checkbox"
                    className="accent-red-500 w-4 h-4 rounded border-gray-300 focus:ring-red-500 focus:ring-2"
                />
            </div>
            {/* Dynamic Tab Content */}
            <div className="flex-1 overflow-auto p-2">
                {renderContent()}
            </div>

            {/* Tabs at bottom */}
            <div className="flex gap-1 border-t items-center w-full p-2 bottom-0 left-0 sticky bg-white overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.name}
                        onClick={() => setCurrentAudioTab(tab.name)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-normal transition whitespace-nowrap
              ${currentAudioTab === tab.name
                                ? "bg-red-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        {tab.icon}
                        {tab.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AudioComponent;
