import React, { useState, useEffect, useCallback } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, CheckCircle, Loader, Sparkles, Download } from 'lucide-react';
import { useGameStore } from '../../../store';
import { Button } from '../../Button';
import { elevenLabsClient, AudioGenerationResponse, Voice } from '../../../utils/elevenLabsClient';
import '../../../utils/elevenLabsTest';

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

    // If sound intensity is changed and audio is currently playing, update the volume
    if (key === 'soundIntensity' && currentAudio && !currentAudio.paused) {
      const newVolume = value === 'low' ? 0.3 : value === 'medium' ? 0.6 : 1.0;
      currentAudio.volume = newVolume;
      console.log(`🔊 Updated playing audio volume to: ${newVolume} (${value})`);
    }
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

  // Audio cleanup effect
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.removeEventListener('ended', () => {});
        currentAudio.removeEventListener('error', () => {});
      }
    };
  }, [currentAudio]);

  // Section 3 Feature Sounds Generation State
  const [selectedFeatureSound, setSelectedFeatureSound] = useState<string>('');
  const [featureAudioPrompt, setFeatureAudioPrompt] = useState('');
  const [isGeneratingFeature, setIsGeneratingFeature] = useState(false);
  const [generatedFeatureAudios, setGeneratedFeatureAudios] = useState<Record<string, AudioGenerationResponse>>({});

  // Voice Over Announcements State
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<string>('');
  const [announcementText, setAnnouncementText] = useState('');
  const [isGeneratingAnnouncement, setIsGeneratingAnnouncement] = useState(false);
  const [generatedAnnouncements, setGeneratedAnnouncements] = useState<Record<string, AudioGenerationResponse>>({});

  // Voice Selection State
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  // Fetch available voices on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      setIsLoadingVoices(true);
      try {
        const voices = await elevenLabsClient.getVoices();
        setAvailableVoices(voices);

        // Set the first voice as default if available
        if (voices.length > 0) {
          setSelectedVoiceId(voices[0].voice_id);
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
      } finally {
        setIsLoadingVoices(false);
      }
    };

    fetchVoices();
  }, []);

  // Helper function to get volume level based on sound intensity
  const getVolumeLevel = (): number => {
    switch (audioConfig.soundIntensity) {
      case 'low':
        return 0.3;
      case 'medium':
        return 0.6;
      case 'high':
        return 1.0;
      default:
        return 0.6; // Default to medium
    }
  };

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
  const toggleAudioPlayback = useCallback(() => {
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
      audio.volume = getVolumeLevel();
      
      const handleEnded = () => {
        setIsPlaying(false);
        setPlayingTrack(null);
      };
      
      const handleError = () => {
        console.error('Audio playback error');
        setIsPlaying(false);
        setPlayingTrack(null);
      };
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.play();
      setCurrentAudio(audio);
      setIsPlaying(true);
      setPlayingTrack(audioConfig.backgroundMusic);
    }
  }, [audioConfig.backgroundMusic, generatedAudios, currentAudio, playingTrack, getVolumeLevel]);

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
    audio.volume = getVolumeLevel(); // Apply sound intensity volume
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
  const downloadAudio = useCallback(() => {
    if (!audioConfig.backgroundMusic) return;
    const currentTrackAudio = generatedAudios[audioConfig.backgroundMusic];
    if (!currentTrackAudio?.audio_url) return;

    const url = currentTrackAudio.audio_url;
    const filename = `generated-audio-${audioConfig.backgroundMusic}-${Date.now()}.mp3`;
    
    // Use URL.createObjectURL approach for better HMR compatibility
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(console.error);
  }, [audioConfig.backgroundMusic, generatedAudios]);

  // Section 3 Feature Sound Generation Functions
  const handleFeatureAudioGeneration = async () => {
    if (!featureAudioPrompt.trim()) {
      alert('Please enter a prompt for feature audio generation');
      return;
    }

    if (!selectedFeatureSound) {
      alert('Please select a feature sound first');
      return;
    }

    // Stop any currently playing audio
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      setIsPlaying(false);
      setPlayingTrack(null);
    }

    setIsGeneratingFeature(true);
    try {
      console.log('🎵 Generating feature audio with prompt:', featureAudioPrompt);
      console.log('🎵 Selected feature sound:', selectedFeatureSound);

      const result = await elevenLabsClient.generateGameAudio('upbeat', featureAudioPrompt);

      if (result.error) {
        alert(`Feature audio generation failed: ${result.error}`);
      } else {
        // Store audio for the specific feature sound
        setGeneratedFeatureAudios(prev => ({
          ...prev,
          [selectedFeatureSound]: result
        }));
        console.log('✅ Feature audio generated successfully for:', selectedFeatureSound);
      }
    } catch (error) {
      console.error('Feature audio generation error:', error);
      alert('Failed to generate feature audio. Please try again.');
    } finally {
      setIsGeneratingFeature(false);
    }
  };

  // Function to play/pause feature audio
  const toggleFeatureAudioPlayback = useCallback((featureId: string) => {
    const featureAudio = generatedFeatureAudios[featureId];
    if (!featureAudio?.audio_url) return;

    if (currentAudio && !currentAudio.paused && playingTrack === featureId) {
      currentAudio.pause();
      setIsPlaying(false);
      setPlayingTrack(null);
    } else {
      // Stop any other playing audio
      if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
      }

      const audio = new Audio(featureAudio.audio_url);
      audio.volume = getVolumeLevel();
      
      const handleEnded = () => {
        setIsPlaying(false);
        setPlayingTrack(null);
      };
      
      const handleError = () => {
        console.error('Feature audio playback error');
        setIsPlaying(false);
        setPlayingTrack(null);
      };
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.play();
      setCurrentAudio(audio);
      setIsPlaying(true);
      setPlayingTrack(featureId);
    }
  }, [generatedFeatureAudios, currentAudio, playingTrack, getVolumeLevel]);

  // Function to download feature audio
  const downloadFeatureAudio = useCallback((featureId: string) => {
    const featureAudio = generatedFeatureAudios[featureId];
    if (!featureAudio?.audio_url) return;

    const url = featureAudio.audio_url;
    const filename = `feature-audio-${featureId}-${Date.now()}.mp3`;
    
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(console.error);
  }, [generatedFeatureAudios]);

  // Voice Over Announcement Functions
  const handleAnnouncementGeneration = async () => {
    if (!announcementText.trim()) {
      alert('Please enter text for the announcement');
      return;
    }

    if (!selectedAnnouncement) {
      alert('Please select an announcement type first');
      return;
    }

    // Stop any currently playing audio
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      setIsPlaying(false);
      setPlayingTrack(null);
    }

    setIsGeneratingAnnouncement(true);
    try {
      console.log('🗣️ Generating announcement with text:', announcementText);
      console.log('🗣️ Selected announcement type:', selectedAnnouncement);
      console.log('🗣️ Selected voice ID:', selectedVoiceId);

      const result = await elevenLabsClient.generateTextToSpeech(announcementText, selectedVoiceId);

      if (result.error) {
        alert(`Announcement generation failed: ${result.error}`);
      } else {
        // Store audio for the specific announcement
        setGeneratedAnnouncements(prev => ({
          ...prev,
          [selectedAnnouncement]: result
        }));
        console.log('✅ Announcement generated successfully for:', selectedAnnouncement);
      }
    } catch (error) {
      console.error('Announcement generation error:', error);
      alert('Failed to generate announcement. Please try again.');
    } finally {
      setIsGeneratingAnnouncement(false);
    }
  };

  // Function to play/pause announcement audio
  const toggleAnnouncementPlayback = useCallback((announcementId: string) => {
    const announcementAudio = generatedAnnouncements[announcementId];
    if (!announcementAudio?.audio_url) return;

    if (currentAudio && !currentAudio.paused && playingTrack === announcementId) {
      currentAudio.pause();
      setIsPlaying(false);
      setPlayingTrack(null);
    } else {
      // Stop any other playing audio
      if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
      }

      const audio = new Audio(announcementAudio.audio_url);
      audio.volume = getVolumeLevel();
      
      const handleEnded = () => {
        setIsPlaying(false);
        setPlayingTrack(null);
      };
      
      const handleError = () => {
        console.error('Announcement audio playback error');
        setIsPlaying(false);
        setPlayingTrack(null);
      };
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.play();
      setCurrentAudio(audio);
      setIsPlaying(true);
      setPlayingTrack(announcementId);
    }
  }, [generatedAnnouncements, currentAudio, playingTrack, getVolumeLevel]);

  // Function to download announcement audio
  const downloadAnnouncement = useCallback((announcementId: string) => {
    const announcementAudio = generatedAnnouncements[announcementId];
    if (!announcementAudio?.audio_url) return;

    const url = announcementAudio.audio_url;
    const filename = `announcement-${announcementId}-${Date.now()}.mp3`;
    
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(console.error);
  }, [generatedAnnouncements]);


  return (
    <div className="space-y-2 bg-white">
      {/* Section 1  */}
      <section className="bg-white rounded-md shadow-sm border border-gray-100">
        <div
          className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col">
            <h3 className="text-lg uw:text-3xl font-semibold text-gray-900">Sound Configuration</h3>
            <p className="text-[#5E6C84] uw:text-2xl">Select audio elements for your slot game</p>
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
              Controls overall volume of all audio in the game. Low (30%), Medium (60%), High (100%)
            </p>
          </div>

          {/* Background music selection */}
          <div className=" border p-3 rounded-md bg-gray-50">
            <div className='mb-2'>
            <h3 className="text-lg font-semibold text-[#172B4D]">Background Music</h3>
            <p className='text-[0.8rem] text-[#5E6C84]'>Select any music and generate The sound From Below</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
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
                       onClick={toggleAudioPlayback}
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
              <div className="px-2 py-1 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Background Sound Effects Generation</h3>
                <p className="text-sm text-gray-600">
                  selected music track: <strong>{audioConfig.backgroundMusic || 'None selected'}</strong>
                </p>
              </div>
              <div className="p-3">
                <textarea
                  value={audioPrompt}
                  onChange={(e) => setAudioPrompt(e.target.value)}
                  placeholder="Describe the sound effect you want to create (e.g., 'spinning reels', 'coins dropping', 'bell ringing', 'whoosh sound', 'explosion')..."
                  className="w-full h-24 p-2 border border-gray-300 rounded-md resize-none "
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
                      Sound effect generated successfully for <strong>{musicTracks.find(t => t.id === audioConfig.backgroundMusic)?.name}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </section>
      {/* Section 2  */}
      {/* <section className="bg-white rounded-md shadow-sm border border-gray-100">
        <div
          className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900">Game Action Sounds</h3>
            <p className="text-[#5E6C84]">Configure the sounds for various game events</p>
          </div>
        </div>
        <div className='p-3 rounded-md '>
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
      </section> */}
      {/* section 3  */}
      <section className="bg-white rounded-md shadow-sm border border-gray-100">
        <div
          className="w-full bg-gray-50 border-l-4 border-l-red-500 p-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900">Special Features Audio</h3>
            <p className="text-[#5E6C84]">Configure sounds for bonus features and special events</p>
          </div>
        </div>
        <div className='p-3'>
          {/* Feature sound selection */}
          <div className="mb-4 p-2 rounded-md border bg-gray-50">
            <div className='mb-2'>
              <h3 className="text-lg font-semibold text-[#172B4D]">Feature Sounds</h3>
              <p className='text-[0.8rem] text-[#5E6C84]'>Select any feature sound and generate audio from below</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'bonus-trigger', name: 'Bonus Trigger', description: 'Plays when bonus feature is triggered' },
                { id: 'wild-expansion', name: 'Wild Expansion', description: 'Plays when wild symbols expand' },
                { id: 'free-spins', name: 'Free Spins', description: 'Background music during free spins' },
                { id: 'multiplier-increase', name: 'Multiplier Increase', description: 'Plays when win multiplier increases' }
              ].map((feature) => {
                const hasGeneratedAudio = generatedFeatureAudios[feature.id]?.audio_url;
                const isCurrentlyPlaying = playingTrack === feature.id && isPlaying;

                return (
                  <div
                    key={feature.id}
                    className={`p-2 rounded-lg border cursor-pointer relative ${selectedFeatureSound === feature.id
                      ? 'bg-red-50 border-red-400'
                      : 'bg-white'
                      }`}
                    onClick={() => setSelectedFeatureSound(feature.id)}
                  >
                    {hasGeneratedAudio && (
                      <div className="absolute top-1 left-1 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{feature.name}</span>
                      <button
                        className={`p-2 rounded-full transition-colors ${
                          hasGeneratedAudio
                            ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFeatureAudioPlayback(feature.id);
                        }}
                        disabled={!hasGeneratedAudio}
                        title={hasGeneratedAudio ? 'Play generated audio' : 'No audio generated yet'}
                      >
                        {isCurrentlyPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-sm text-[#5E6C84]">{feature.description}</p>
                    {hasGeneratedAudio && (
                      <p className="text-xs text-green-600 mt-1">✓ Audio generated</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Feature Audio Generation Interface */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
              <div className="px-2 py-1 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Feature Sound Effects Generation</h3>
                <p className="text-sm text-gray-600">
                  Selected feature sound: <strong>{selectedFeatureSound ? selectedFeatureSound.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'None selected'}</strong>
                </p>
              </div>
              <div className="p-3">
                <textarea
                  value={featureAudioPrompt}
                  onChange={(e) => setFeatureAudioPrompt(e.target.value)}
                  placeholder="Describe the feature sound effect you want to create (e.g., 'magical chime', 'explosion with sparkles', 'triumphant fanfare', 'mystical whoosh')..."
                  className="w-full h-24 p-2 border border-gray-300 rounded-md resize-none"
                />

                <div className="mt-2 text-xs text-gray-500">
                  <strong>Examples:</strong> magical chime, explosion with sparkles, triumphant fanfare, mystical whoosh, bonus bell, wild transformation, free spin activation, multiplier ding
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant='generate'
                    onClick={handleFeatureAudioGeneration}
                    className='flex-1'
                    disabled={isGeneratingFeature || !featureAudioPrompt.trim() || !selectedFeatureSound}
                  >
                    {isGeneratingFeature ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Feature Sound
                      </>
                    )}
                  </Button>

                  {selectedFeatureSound && generatedFeatureAudios[selectedFeatureSound]?.audio_url && (
                    <>
                      <button
                        onClick={() => toggleFeatureAudioPlayback(selectedFeatureSound)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
                      >
                        {isPlaying && playingTrack === selectedFeatureSound ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying && playingTrack === selectedFeatureSound ? 'Pause' : 'Play'}
                      </button>

                      <button
                        onClick={() => downloadFeatureAudio(selectedFeatureSound)}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </>
                  )}
                </div>

                {selectedFeatureSound && generatedFeatureAudios[selectedFeatureSound]?.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">Error: {generatedFeatureAudios[selectedFeatureSound].error}</p>
                  </div>
                )}

                {selectedFeatureSound && generatedFeatureAudios[selectedFeatureSound]?.audio_url && !generatedFeatureAudios[selectedFeatureSound].error && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-700 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Feature sound generated successfully for <strong>{selectedFeatureSound.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                    </p>
                  </div>
                )}
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

            {/* Voice Over Announcements UI - Only show when enabled */}
            {audioConfig.enableVoiceover && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className='mb-2'>
                  <h4 className="text-md font-semibold text-[#172B4D]">Voice Announcements</h4>
                  <p className='text-[0.8rem] text-[#5E6C84]'>Select any announcement type and generate voice from below</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'win', name: 'Win', description: 'Announcement for regular wins' },
                    { id: 'loose', name: 'Loose', description: 'Encouraging message for losses' },
                    { id: 'mega-win', name: 'Mega Win', description: 'Exciting announcement for big wins' },
                    { id: 'sodalicious', name: 'Sodalicious', description: 'Special branded announcement' }
                  ].map((announcement) => {
                    const hasGeneratedAudio = generatedAnnouncements[announcement.id]?.audio_url;
                    const isCurrentlyPlaying = playingTrack === announcement.id && isPlaying;

                    return (
                      <div
                        key={announcement.id}
                        className={`p-2 rounded-lg border cursor-pointer relative ${selectedAnnouncement === announcement.id
                          ? 'bg-red-50 border-red-400'
                          : 'bg-white'
                          }`}
                        onClick={() => setSelectedAnnouncement(announcement.id)}
                      >
                        {hasGeneratedAudio && (
                          <div className="absolute top-1 left-1 w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{announcement.name}</span>
                          <button
                            className={`p-2 rounded-full transition-colors ${
                              hasGeneratedAudio
                                ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAnnouncementPlayback(announcement.id);
                            }}
                            disabled={!hasGeneratedAudio}
                            title={hasGeneratedAudio ? 'Play generated announcement' : 'No announcement generated yet'}
                          >
                            {isCurrentlyPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-sm text-[#5E6C84]">{announcement.description}</p>
                        {hasGeneratedAudio && (
                          <p className="text-xs text-green-600 mt-1">✓ Announcement generated</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Announcement Generation Interface */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
                  <div className="px-2 py-1 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Voice Announcement Generation</h3>
                    <p className="text-sm text-gray-600">
                      Selected announcement: <strong>{selectedAnnouncement ? selectedAnnouncement.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'None selected'}</strong>
                    </p>
                  </div>
                  <div className="p-3">
                    <textarea
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      placeholder="Enter the text you want to be announced (e.g., 'Congratulations! You won!', 'Better luck next time!', 'MEGA WIN! Incredible!', 'Sodalicious bonus activated!')..."
                      className="w-full h-24 p-2 border border-gray-300 rounded-md resize-none"
                    />

                    <div className="mt-2 text-xs text-gray-500">
                      <strong>Examples:</strong> "Congratulations! You won!", "Better luck next time!", "MEGA WIN! Incredible!", "Sodalicious bonus activated!", "Amazing! You're on fire!"
                    </div>

                    {/* Voice Selection Dropdown */}
                    <div className="mt-3 flex items-center gap-2">
                      <label htmlFor="voiceSelect" className="block w-[20%] text-sm font-medium text-gray-700">
                        Select Voice
                      </label>
                      <select
                        id="voiceSelect"
                        value={selectedVoiceId}
                        onChange={(e) => setSelectedVoiceId(e.target.value)}
                        disabled={isLoadingVoices}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        {isLoadingVoices ? (
                          <option>Loading voices...</option>
                        ) : availableVoices.length === 0 ? (
                          <option>No voices available</option>
                        ) : (
                          availableVoices.map((voice) => (
                            <option key={voice.voice_id} value={voice.voice_id}>
                              {voice.name} {voice.category ? `(${voice.category})` : ''}
                            </option>
                          ))
                        )}
                      </select>
                      {isLoadingVoices && (
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Loader className="w-3 h-3 animate-spin mr-1" />
                          Fetching available voices...
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        variant='generate'
                        onClick={handleAnnouncementGeneration}
                        className='flex-1'
                        disabled={isGeneratingAnnouncement || !announcementText.trim() || !selectedAnnouncement}
                      >
                        {isGeneratingAnnouncement ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Generate Voice Announcement
                          </>
                        )}
                      </Button>

                      {selectedAnnouncement && generatedAnnouncements[selectedAnnouncement]?.audio_url && (
                        <>
                          <button
                            onClick={() => toggleAnnouncementPlayback(selectedAnnouncement)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
                          >
                            {isPlaying && playingTrack === selectedAnnouncement ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {isPlaying && playingTrack === selectedAnnouncement ? 'Pause' : 'Play'}
                          </button>

                          <button
                            onClick={() => downloadAnnouncement(selectedAnnouncement)}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </>
                      )}
                    </div>

                    {selectedAnnouncement && generatedAnnouncements[selectedAnnouncement]?.error && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700 text-sm">Error: {generatedAnnouncements[selectedAnnouncement].error}</p>
                      </div>
                    )}

                    {selectedAnnouncement && generatedAnnouncements[selectedAnnouncement]?.audio_url && !generatedAnnouncements[selectedAnnouncement].error && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-700 text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Voice announcement generated successfully for <strong>{selectedAnnouncement.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


      </section>
      <div className='h-2 bg-gray-50'></div>
    </div>
  );
};

export default AudioComponent;