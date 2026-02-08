import React from "react";

const ReelsTab = () => {

    return(
        <div className="p-4 border rounded-lg space-y-4 w-full max-w-5xl mx-auto bg-white shadow">
                        {/* Header */}
                        <div className="flex items-center gap-4 relative">
                            <div className="p-2 rounded-full bg-red-100">
                                <Disc  className="text-red-700 w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <p className="font-semibold text-lg">Reel Pack</p>
                                <p className="text-sm text-gray-500">Mechanical sounds For the spinning reel</p>
                            </div>
                            <div className="absolute right-0 bg-green-100 text-green-800 px-3 py-1 text-sm rounded-full font-medium">
                                100% Complete
                            </div>
                        </div>

                        {/* Prompt + Generate */}
                        <div className="flex gap-2 w-full">
                            <input
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Western saloon music"
                                className="w-[80%] px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                            />
                            <button
                                onClick={handleGenerateAll}
                                disabled={isGenerating || !prompt.trim()}
                                className="bg-red-500 text-white px-4 rounded-md w-[20%] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate All'
                                )}
                            </button>
                        </div>

                        {/* Top Buttons */}
                        <div className="flex gap-4 text-sm text-gray-600">
                            <button className="hover:bg-gray-100 rounded-lg flex items-center gap-1 border rounded-lg p-1"><Upload size={16} /> Upload Files</button>
                            <button className="hover:bg-gray-100 rounded-lg p-1 flex items-center gap-1 " onClick={() => setSelectSoundContent(!selectSoundContent)}>Select Sounds (2) <ChevronDown size={16} /></button>
                            <button className="hover:bg-gray-100 rounded-lg p-1 flex items-center gap-1 " onClick={() => setIndividualControl(!individualControl)}>Settings <ChevronDown size={16} /></button>
                        </div>
                        {selectSoundContent && (
                            <div className="p-4 bg-gray-50 border rounded-lg shadow-sm w-full ">
                                <h2 className=" font-medium text-gray-700">
                                    Select Sounds to Generate
                                </h2>
                                <p className="text-xs text-gray-500 mb-3">Toggle individual sounds on/off</p>

                                <div className="flex space-x-2">
                                    {(['ReelStart', 'ReelLoop','StopSoft', 'StopHard'] as AudioType[]).map((audioType) => {
                                        const isSelected = selectedSounds.has(audioType);
                                        const displayName = audioType === 'MusicBed' ? 'Music Bed' : 'Alternate Loop';

                                        return (
                                            <button
                                                key={audioType}
                                                onClick={() => {
                                                    const newSelected = new Set(selectedSounds);
                                                    if (isSelected) {
                                                        newSelected.delete(audioType);
                                                    } else {
                                                        newSelected.add(audioType);
                                                    }
                                                    setSelectedSounds(newSelected);
                                                }}
                                                className={`px-3 py-1 text-sm rounded-full border ${isSelected
                                                        ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                                                        : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 '
                                                    }`}
                                            >
                                                {isSelected ? '✓' : ''} {displayName}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}


                        {/* Generated Sounds Section - Only show when sounds exist */}
                        {Object.values(backgroundMusic || {}).filter(Boolean).length > 0 && (
                            <div className="bg-green-50 border border-green-200 p-3 rounded-md space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">Generated Sounds ({Object.values(backgroundMusic || {}).filter(Boolean).length})</p>
                                    <p className="text-green-600 text-sm">Ready to use</p>
                                </div>

                                {/* Sound Cards */}
                                <div className="flex gap-4">
                                    {(["MusicBed", "AlternateLoop"] as AudioType[]).map((audioType, idx) => {
                                        const audioData: AudioFile | null = (backgroundMusic as any)?.[audioType] || null;
                                        const displayName = audioType === 'MusicBed' ? 'Music Bed' : 'Alternate Loop';

                                        if (!audioData?.url) return null;

                                        return (
                                            <div key={idx} className="rounded bg-white p-2 flex items-center gap-4 w-full relative border">
                                                <button
                                                    onClick={() => playAudio(audioData.url)}
                                                    className="rounded-full p-2 flex items-center bg-red-500 hover:bg-red-600 transition-colors"
                                                >
                                                    <Play className="text-white w-5 h-5" />
                                                </button>
                                                <div className="flex flex-col">
                                                    <p className="font-medium">{displayName}</p>
                                                    <p className="text-gray-400 text-sm">
                                                        {audioData.duration || 'Duration unknown'}
                                                    </p>
                                                </div>
                                                <div className="absolute right-4">
                                                    <Play className="text-green-400 w-4 h-4" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {individualControl && (
                            <div className="bg-gray-50 border border-green-200 p-3 flex items-center gap-4 justify-between rounded-md space-y-3">
                                {/* <div className="flex gap-4 items-center"> */}
                                <div>
                                    <label className="font-medium text-gray-600">Theme</label>
                                    <select className="block border border-gray-300 rounded-xl px-2">
                                        <option>Custom</option>
                                        <option>Additional</option>
                                        {/* Add other themes */}
                                    </select>
                                </div>

                                <div>
                                    <label className="font-medium text-gray-600">Quality</label>
                                    <div className="flex ">
                                        {qualities.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => setActiveQuality(q)}
                                                className={`px-3 py-1 border text-sm transition-all duration-150 ${activeQuality === q
                                                    ? "bg-red-500 text-white border-red-500"
                                                    : "bg-white text-gray-600 border-gray-300"
                                                    }`}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>

                                </div>
                                {/* </div> */}

                                <div className="flex items-center flex-col gap-2">
                                    <label className="text-sm">A/B Compare</label>
                                    <button className="px-3  border rounded bg-gray-200 text-gray-700">OFF</button>
                                </div>
                            </div>
                        )}

                        {/* Toggle Details */}
                        <button
                            className="gap-1 font-medium flex items-center"
                            onClick={() => setIndividualControl(!individualControl)}
                        >
                            {individualControl ? "Hide Individual Controls" : "Show Individual Controls"} <ChevronDown size={16} />
                        </button>

                        {/* Individual Controls */}
                        {individualControl && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Music Bed Control */}
                                <div className="border p-4 rounded-lg space-y-2">
                                    <p className="font-semibold">Music Bed</p>
                                    <input
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Describe the music bed..."
                                        className="w-full border px-2 py-1 rounded text-sm"
                                    />
                                    <div className="flex gap-2 text-sm">
                                        <button
                                            onClick={() => handleGenerateIndividual('MusicBed')}
                                            disabled={isGenerating || !prompt.trim()}
                                            className="bg-red-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : null}
                                            Generate
                                        </button>
                                        <button className="border px-4 py-1 rounded">Upload</button>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        <p>2.2s · -12.7 LUFS · Am · 128 BPM</p>
                                    </div>
                                </div>

                                {/* Alternate Loop Control */}
                                <div className="border p-4 rounded-lg space-y-2">
                                    <p className="font-semibold">Alternate Loop</p>
                                    <input
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Describe the alternate loop..."
                                        className="w-full border px-2 py-1 rounded text-sm"
                                    />
                                    <div className="flex gap-2 text-sm">
                                        <button
                                            onClick={() => handleGenerateIndividual('AlternateLoop')}
                                            disabled={isGenerating || !prompt.trim()}
                                            className="bg-red-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : null}
                                            Generate
                                        </button>
                                        <button className="border px-4 py-1 rounded">Upload</button>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        <p>1.1s · -16.2 LUFS · Dm · 110 BPM</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
    )
}

export default ReelsTab;