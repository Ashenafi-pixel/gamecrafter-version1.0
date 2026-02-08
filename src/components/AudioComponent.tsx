import React, { useState } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, CheckCircle, Loader, Sparkles, Download } from 'lucide-react';
import { useGameStore } from '../store';
import { Button } from './Button';
import { elevenLabsClient, AudioGenerationResponse } from '../utils/elevenLabsClient';
import '../utils/elevenLabsTest'; // Import test utilities for console access

const AudioComponent: React.FC = () => {
  const { config, updateConfig, setStep, currentStep } = useGameStore();
  const [audioStep, setAudioStep] = useState(0);
  const totalAudioSteps = 3;

  const audioConfig = config.audio || {
    backgroundMusic: '',
    spinSound: '',
    winSounds: {
      small: '',
      medium: '',
      big: '',
      mega: ''
    },
    featureSounds: {},
    soundIntensity: 'medium',
    enableVoiceover: false
  };

  const handleAudioChange = (key: string, value: any) => {
    updateConfig({
      audio: {
        ...audioConfig,
        [key]: value
      }
    });
  };

  const updateWinSound = (winType: string, value: string) => {
    updateConfig({
      audio: {
        ...audioConfig,
        winSounds: {
          ...audioConfig.winSounds,
          [winType]: value
        }
      }
    });
  };

  // Available music tracks with descriptions
  const musicTracks = [
    { id: 'upbeat', name: 'Upbeat Casino', description: 'Energetic and exciting casino feel' },
    { id: 'mysterious', name: 'Mysterious Adventure', description: 'Enigmatic and suspenseful' },
    { id: 'epic', name: 'Epic Journey', description: 'Grand and inspiring orchestral score' },
    { id: 'relaxing', name: 'Relaxing Ambience', description: 'Calm and serene background music' },
    { id: 'tense', name: 'Tension Builder', description: 'Creates anticipation and excitement' },
    { id: 'playful', name: 'Playful Melody', description: 'Fun and lighthearted tunes' }
  ];
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioPrompt, setAudioPrompt] = useState('');
  const [generatedAudios, setGeneratedAudios] = useState<Record<string, AudioGenerationResponse>>({});
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null); 

  // Function to handle next audio step
  const nextAudioStep = () => {
    if (audioStep < totalAudioSteps - 1) {
      setAudioStep(audioStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Complete the section and move to Player Experience
      completeAudioSection();
    }
  };

  // Function to handle previous audio step
  const prevAudioStep = () => {
    if (audioStep > 0) {
      setAudioStep(audioStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Go back to UI Design section
      setStep(currentStep - 1);
    }
  };

  // Function to complete the Audio section and move to Player Experience
  const completeAudioSection = () => {
    // Always use direct navigation to ensure it works
    setStep(7); // Go to player experience section (index 7)

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Function to handle audio generation
  const handleGenerateAudio = async () => {
    if (!audioPrompt.trim()) {
      alert('Please enter a prompt for audio generation');
      return;
    }

    if (!audioConfig.backgroundMusic) {
      alert('Please select a music track first');
      return;
    }

    // Stop any currently playing audio
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      setIsPlaying(false);
      setPlayingTrack(null);
    }

    setIsGenerating(true);
    try {
      console.log('🎵 Generating audio with prompt:', audioPrompt);
      console.log('🎵 Selected music track:', audioConfig.backgroundMusic);

      const result = await elevenLabsClient.generateGameAudio(audioConfig.backgroundMusic, audioPrompt);

      if (result.error) {
        alert(`Audio generation failed: ${result.error}`);
      } else {
        // Store audio for the specific track, replacing any previous audio
        setGeneratedAudios(prev => ({
          ...prev,
          [audioConfig.backgroundMusic]: result
        }));
        console.log('✅ Audio generated successfully for track:', audioConfig.backgroundMusic);
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      alert('Failed to generate audio. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to play/pause generated audio for current track
  const toggleAudioPlayback = () => {
    if (!audioConfig.backgroundMusic) return;
    const currentTrackAudio = generatedAudios[audioConfig.backgroundMusic];
    if (!currentTrackAudio?.audio_url) return;

    if (currentAudio && !currentAudio.paused && playingTrack === audioConfig.backgroundMusic) {
      currentAudio.pause();
      setIsPlaying(false);
      setPlayingTrack(null);
    } else {
      // Stop any other playing audio
      if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
      }

      const audio = new Audio(currentTrackAudio.audio_url);
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setPlayingTrack(null);
      });
      audio.addEventListener('error', () => {
        console.error('Audio playback error');
        setIsPlaying(false);
        setPlayingTrack(null);
      });
      audio.play();
      setCurrentAudio(audio);
      setIsPlaying(true);
      setPlayingTrack(audioConfig.backgroundMusic);
    }
  };

  // Function to play audio for a specific track (from track cards)
  const playTrackAudio = (trackId: string) => {
    const trackAudio = generatedAudios[trackId];
    if (!trackAudio?.audio_url) {
      console.log(`No generated audio for track: ${trackId}`);
      return;
    }

    // Stop any currently playing audio
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
    }

    const audio = new Audio(trackAudio.audio_url);
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setPlayingTrack(null);
    });
    audio.addEventListener('error', () => {
      console.error('Audio playback error');
      setIsPlaying(false);
      setPlayingTrack(null);
    });
    audio.play();
    setCurrentAudio(audio);
    setIsPlaying(true);
    setPlayingTrack(trackId);
  };

  // Function to download generated audio for current track
  const downloadAudio = () => {
    if (!audioConfig.backgroundMusic) return;
    const currentTrackAudio = generatedAudios[audioConfig.backgroundMusic];
    if (!currentTrackAudio?.audio_url) return;

    const link = document.createElement('a');
    link.href = currentTrackAudio.audio_url;
    link.download = `generated-audio-${audioConfig.backgroundMusic}-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-2 bg-white">
      {/* Section 1  */}
      <section className="bg-white rounded-md shadow-sm border border-gray-100">
        <div
          className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900">Sound Configuration</h3>
            <p className="text-[#5E6C84]">Select audio elements for your slot game</p>
          </div>
        </div>
        <div className='bg-white p-3'>
          {/* Sound intensity */}
          <div className="mb-4 border p-3 rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold text-[#172B4D] mb-2">Sound Intensity</h3>
            <div className="flex space-x-4 justify-center">
              {['low', 'medium', 'high'].map((level) => (
                <button
                  key={level}
                  onClick={() => handleAudioChange('soundIntensity', level)}
                  className={`px-4 text-gray-900 py-2 rounded-lg border flex items-center space-x-2 ${audioConfig.soundIntensity === level
                    ? 'bg-red-50 border-red-400'
                    : 'bg-white '
                    }`}
                >
                  {level === 'low' && <VolumeX className="w-4 h-4" />}
                  {level === 'medium' && <Volume2 className="w-4 h-4" />}
                  {level === 'high' && <Music className="w-4 h-4" />}
                  <span className="capitalize">{level}</span>
                </button>
              ))}
            </div>
            <p className="text-sm text-[#5E6C84] mt-2">
              Controls overall volume and frequency of sound effects during gameplay
            </p>
          </div>

          {/* Background music selection */}
          <div className=" border p-3 rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold text-[#172B4D] mb-2">Background Music</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {musicTracks.map((track) => {
                const hasGeneratedAudio = generatedAudios[track.id]?.audio_url;
                const isCurrentlyPlaying = playingTrack === track.id && isPlaying;

                return (
                  <div
                    key={track.id}
                    className={`p-2 rounded-lg border cursor-pointer relative ${audioConfig.backgroundMusic === track.id
                      ? 'bg-red-50 border-red-400'
                      : 'bg-white'
                      }`}
                    onClick={() => handleAudioChange('backgroundMusic', track.id)}
                  >
                    {hasGeneratedAudio && (
                      <div className="absolute top-1 left-1 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{track.name}</span>
                      <button
                        className={`p-2 rounded-full transition-colors ${
                          hasGeneratedAudio
                            ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasGeneratedAudio) {
                            playTrackAudio(track.id);
                          }
                        }}
                        disabled={!hasGeneratedAudio}
                        title={hasGeneratedAudio ? 'Play generated audio' : 'No audio generated yet'}
                      >
                        {isCurrentlyPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-sm text-[#5E6C84]">{track.description}</p>
                    {hasGeneratedAudio && (
                      <p className="text-xs text-green-600 mt-1">✓ Audio generated</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4 mb-4">
              <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                <h3 className="font-semibold text-gray-900">AI Sound Effects Generation</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Generate custom sound effects using ElevenLabs AI based on your selected music track: <strong>{audioConfig.backgroundMusic || 'None selected'}</strong>
                </p>
              </div>
              <div className="p-4">
                <textarea
                  value={audioPrompt}
                  onChange={(e) => setAudioPrompt(e.target.value)}
                  placeholder="Describe the sound effect you want to create (e.g., 'spinning reels', 'clapping hands', 'coins dropping', 'bell ringing', 'whoosh sound', 'explosion')..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />

                <div className="mt-2 text-xs text-gray-500">
                  <strong>Examples:</strong> spinning reels, clapping hands, coins dropping, bell ringing, whoosh sound, explosion, cheering crowd, slot machine ding, jackpot fanfare
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant='generate'
                    onClick={handleGenerateAudio}
                    className='flex-1'
                    disabled={isGenerating || !audioPrompt.trim() || !audioConfig.backgroundMusic}
                  >
                    {isGenerating ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Sound Effect
                      </>
                    )}
                  </Button>

                  {audioConfig.backgroundMusic && generatedAudios[audioConfig.backgroundMusic]?.audio_url && (
                    <>
                      <button
                        onClick={toggleAudioPlayback}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
                      >
                        {isPlaying && playingTrack === audioConfig.backgroundMusic ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying && playingTrack === audioConfig.backgroundMusic ? 'Pause' : 'Play'}
                      </button>

                      <button
                        onClick={downloadAudio}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </>
                  )}
                </div>

                {audioConfig.backgroundMusic && generatedAudios[audioConfig.backgroundMusic]?.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">Error: {generatedAudios[audioConfig.backgroundMusic].error}</p>
                  </div>
                )}

                {audioConfig.backgroundMusic && generatedAudios[audioConfig.backgroundMusic]?.audio_url && !generatedAudios[audioConfig.backgroundMusic].error && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-700 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Sound effect generated successfully for <strong>{musicTracks.find(t => t.id === audioConfig.backgroundMusic)?.name}</strong>! Use the controls above to play or download.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </section>
      {/* Section 2  */}
      <section className="bg-white rounded-md shadow-sm border border-gray-100">
        <div
          className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900">Game Action Sounds</h3>
            <p className="text-[#5E6C84]">Configure the sounds for various game events</p>
          </div>
        </div>
        <div className='p-3 rounded-md '>
          {/* Win sound selection */}
          <div className="mb-4 border rounded-md p-2 bg-gray-50">
            <h3 className="text-lg font-semibold text-[#172B4D] mb-2">Win Sounds</h3>
            <div className="space-y-2">
              {[
                { id: 'small', name: 'Small Win', description: 'Plays for wins up to 5x your bet' },
                { id: 'medium', name: 'Medium Win', description: 'Plays for wins between 5x and 20x your bet' },
                { id: 'big', name: 'Big Win', description: 'Plays for wins between 20x and 50x your bet' },
                { id: 'mega', name: 'Mega Win', description: 'Plays for wins above 50x your bet' }
              ].map((winType) => (
                <div key={winType.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                  <div>
                    <span className="font-medium">{winType.name}</span>
                    <p className="text-xs text-[#5E6C84] mt-1">{winType.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    {['classic', 'modern', 'retro'].map((style) => (
                      <button
                        key={style}
                        className={`px-3 py-1 rounded border ${audioConfig.winSounds[winType.id as keyof typeof audioConfig.winSounds] === style
                          ? 'bg-red-50 border-red-400 '
                          : 'bg-white '
                          }`}
                        onClick={() => updateWinSound(winType.id, style)}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spin sound selection */}
          <div className=" border p-2 bg-gray-50 rounded-md">
            <h3 className="text-lg font-semibold text-[#172B4D] mb-3">Spin Sound</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['mechanical', 'digital', 'subtle', 'none'].map((spinSound) => (
                <button
                  key={spinSound}
                  onClick={() => handleAudioChange('spinSound', spinSound)}
                  className={`p-2 rounded-lg border ${audioConfig.spinSound === spinSound
                    ? 'bg-red-50 border-red-400'
                    : 'bg-white'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{spinSound}</span>
                    {spinSound !== 'none' && (
                      <Play className="w-3 h-3 text-[#0052CC]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </section>
      {/* section 3  */}
      <section className="bg-white rounded-md shadow-sm border border-gray-100">
        <div
          className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900">Special Features Audio</h3>
            <p className="text-[#5E6C84]">Configure sounds for bonus features and special events</p>
          </div>
        </div>
        <div className='p-3'>
          {/* Feature sound preview */}
          <div className="mb-4 p-2 rounded-md border bg-gray-50">
            <h3 className="text-lg font-semibold text-[#172B4D] mb-2">Feature Sounds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-2 bg-white border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Bonus Trigger</span>
                  <button className="text-[#0052CC] hover:text-[#0747A6]">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-[#5E6C84]">
                  Plays when bonus feature is triggered
                </p>
              </div>

              <div className="p-2 bg-white border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Wild Expansion</span>
                  <button className="text-[#0052CC] hover:text-[#0747A6]">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-[#5E6C84]">
                  Plays when wild symbols expand
                </p>
              </div>

              <div className="p-2 bg-white border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Free Spins</span>
                  <button className="text-[#0052CC] hover:text-[#0747A6]">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-[#5E6C84]">
                  Background music during free spins
                </p>
              </div>

              <div className="p-2 bg-white border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Multiplier Increase</span>
                  <button className="text-[#0052CC] hover:text-[#0747A6]">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-[#5E6C84]">
                  Plays when win multiplier increases
                </p>
              </div>
            </div>
          </div>

          {/* Voice over toggle */}
          <div className=" border p-2 rounded-md bg-gray-50">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableVoiceover"
                checked={audioConfig.enableVoiceover}
                onChange={(e) => handleAudioChange('enableVoiceover', e.target.checked)}
                className="w-4 h-4 text-[#0052CC] rounded focus:ring-[#0052CC]"
              />
              <label htmlFor="enableVoiceover" className="font-medium">
                Enable Voice Over Announcements
              </label>
            </div>
            <p className="text-[#5E6C84] text-sm mt-1 ml-6">
              Adds professional voice announcements for big wins and special features
            </p>
          </div>
        </div>


      </section>
      <div className='h-2 bg-gray-50'></div>
    </div>
  );
};

export default AudioComponent;