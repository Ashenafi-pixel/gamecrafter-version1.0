import React, { useState, useEffect, useRef } from 'react';
import { Save, Download, Star, Trash2, Share, CheckCircle, ChevronDown, Filter } from 'lucide-react';

export interface AnimationProfile {
  id: string;
  name: string;
  description: string;
  stepType: 'animation' | 'grid' | 'assets' | 'win-animation' | 'theme' | 'general';
  settings: Record<string, any>;
  isDefault?: boolean;
  isFavorite?: boolean;
  tags?: string[];
  createdAt: Date;
  lastUsed?: Date;
  usageCount?: number;
  author?: string;
  version?: string;
}

export interface ProfileManagerProps {
  stepType: 'animation' | 'grid' | 'assets' | 'win-animation' | 'theme' | 'general';
  currentSettings: Record<string, any>;
  onProfileApply: (profile: AnimationProfile) => void;
  onProfileSave?: (profile: Omit<AnimationProfile, 'id' | 'createdAt'>) => void;
  onProfileDelete?: (profileId: string) => void;
  enabled?: boolean;
}

// Default animation profiles for different use cases
const DEFAULT_ANIMATION_PROFILES: AnimationProfile[] = [
  {
    id: 'classic-casino',
    name: 'Classic Casino',
    description: 'Traditional slot machine feel with balanced timing',
    stepType: 'animation',
    settings: {
      speed: 1.0,
      blurIntensity: 6,
      easing: 'back.out',
      visualEffects: { spinBlur: true, glowEffects: false, screenShake: false }
    },
    isDefault: true,
    tags: ['casino', 'traditional', 'balanced'],
    createdAt: new Date('2024-01-01'),
    usageCount: 150,
    author: 'SlotAI Team',
    version: '1.0'
  },
  {
    id: 'mobile-optimized',
    name: 'Mobile Optimized',
    description: 'Smooth performance on mobile devices',
    stepType: 'animation',
    settings: {
      speed: 1.2,
      blurIntensity: 4,
      easing: 'power2.out',
      visualEffects: { spinBlur: true, glowEffects: false, screenShake: false }
    },
    isDefault: true,
    tags: ['mobile', 'performance', 'optimized'],
    createdAt: new Date('2024-01-01'),
    usageCount: 89,
    author: 'SlotAI Team',
    version: '1.0'
  },
  {
    id: 'dramatic-impact',
    name: 'Dramatic Impact',
    description: 'Slow, intense animations with high visual impact',
    stepType: 'animation',
    settings: {
      speed: 0.7,
      blurIntensity: 12,
      easing: 'elastic.out',
      visualEffects: { spinBlur: true, glowEffects: true, screenShake: true }
    },
    isDefault: true,
    tags: ['dramatic', 'intense', 'premium'],
    createdAt: new Date('2024-01-01'),
    usageCount: 67,
    author: 'SlotAI Team',
    version: '1.0'
  },
  {
    id: 'lightning-fast',
    name: 'Lightning Fast',
    description: 'Quick spins for fast-paced gameplay',
    stepType: 'animation',
    settings: {
      speed: 2.2,
      blurIntensity: 8,
      easing: 'power2.in',
      visualEffects: { spinBlur: true, glowEffects: false, screenShake: false }
    },
    isDefault: true,
    tags: ['fast', 'energetic', 'arcade'],
    createdAt: new Date('2024-01-01'),
    usageCount: 43,
    author: 'SlotAI Team',
    version: '1.0'
  }
];

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  stepType,
  currentSettings,
  onProfileApply,
  onProfileSave,
  onProfileDelete,
  enabled = true
}) => {
  const [profiles, setProfiles] = useState<AnimationProfile[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [lastApplied, setLastApplied] = useState<string | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all']);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load profiles on mount
  useEffect(() => {
    if (!enabled) return;

    // Load from localStorage or use defaults
    const savedProfiles = localStorage.getItem(`profiles_${stepType}`);
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        setProfiles([...DEFAULT_ANIMATION_PROFILES.filter(p => p.stepType === stepType), ...parsed]);
      } catch (error) {
        console.error('Error loading profiles:', error);
        setProfiles(DEFAULT_ANIMATION_PROFILES.filter(p => p.stepType === stepType));
      }
    } else {
      setProfiles(DEFAULT_ANIMATION_PROFILES.filter(p => p.stepType === stepType));
    }
  }, [stepType, enabled]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Save profiles to localStorage
  const saveProfilesToStorage = (updatedProfiles: AnimationProfile[]) => {
    const customProfiles = updatedProfiles.filter(p => !p.isDefault);
    localStorage.setItem(`profiles_${stepType}`, JSON.stringify(customProfiles));
  };

  // Apply profile
  const handleApplyProfile = (profile: AnimationProfile) => {
    onProfileApply(profile);
    setLastApplied(profile.id);

    // Update usage count
    const updatedProfiles = profiles.map(p =>
      p.id === profile.id
        ? { ...p, lastUsed: new Date(), usageCount: (p.usageCount || 0) + 1 }
        : p
    );
    setProfiles(updatedProfiles);
    saveProfilesToStorage(updatedProfiles);

    // Clear after 3 seconds
    setTimeout(() => setLastApplied(null), 3000);
  };

  // Save new profile
  const handleSaveProfile = () => {
    if (!newProfileName.trim()) return;

    const newProfile: AnimationProfile = {
      id: `custom_${Date.now()}`,
      name: newProfileName.trim(),
      description: newProfileDescription.trim() || `Custom ${stepType} profile`,
      stepType,
      settings: { ...currentSettings },
      tags: selectedTags,
      createdAt: new Date(),
      usageCount: 0,
      author: 'User'
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    saveProfilesToStorage(updatedProfiles);

    if (onProfileSave) {
      onProfileSave(newProfile);
    }

    // Reset form
    setNewProfileName('');
    setNewProfileDescription('');
    setSelectedTags([]);
    setShowSaveDialog(false);
  };

  // Delete profile
  const handleDeleteProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile?.isDefault) return; // Can't delete default profiles

    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    saveProfilesToStorage(updatedProfiles);

    if (onProfileDelete) {
      onProfileDelete(profileId);
    }
  };

  // Toggle favorite
  const toggleFavorite = (profileId: string) => {
    const updatedProfiles = profiles.map(p =>
      p.id === profileId ? { ...p, isFavorite: !p.isFavorite } : p
    );
    setProfiles(updatedProfiles);
    saveProfilesToStorage(updatedProfiles);
  };

  // Export profile
  const exportProfile = (profile: AnimationProfile) => {
    const dataStr = JSON.stringify(profile, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.name.replace(/\s+/g, '_')}_profile.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get all available tags
  const getAllTags = () => {
    const allTags = new Set<string>();
    profiles.forEach(profile => {
      profile.tags?.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  // Filter profiles
  const getFilteredProfiles = () => {
    if (selectedFilters.includes('all')) return profiles;

    return profiles.filter(profile => {
      return selectedFilters.some(filter => {
        if (filter === 'favorites') return profile.isFavorite;
        if (filter === 'custom') return !profile.isDefault;
        return profile.tags?.includes(filter);
      });
    });
  };

  // Handle filter selection
  const handleFilterToggle = (filter: string) => {
    if (filter === 'all') {
      setSelectedFilters(['all']);
    } else {
      setSelectedFilters(prev => {
        const newFilters = prev.filter(f => f !== 'all');
        if (newFilters.includes(filter)) {
          const filtered = newFilters.filter(f => f !== filter);
          return filtered.length === 0 ? ['all'] : filtered;
        } else {
          return [...newFilters, filter];
        }
      });
    }
  };

  const availableTags = ['casino', 'mobile', 'dramatic', 'fast', 'smooth', 'premium', 'arcade'];

  if (!enabled) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 uw:rounded-2xl uw:border-2 uw:border-gray-200">
      <div
        className="w-full p-3 border-l-4 border-l-red-500 flex items-center justify-between text-left bg-gray-50 transition-colors border-b border-gray-100"
      >
        <div className="flex items-center space-x-3 uw:space-x-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 uw:text-2xl">Profile Manager</h3>
            <p className="text-sm text-gray-600 uw:text-2xl">
              {profiles.length} template{profiles.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 uw:space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSaveDialog(true);
            }}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors uw:p-3 uw:rounded-lg"
            title="Save current settings as profile"
          >
            <Save className="w-4 h-4 uw:w-6 uw:h-6" />
          </button>
        </div>
      </div>


      <div className="p-4 space-y-4 uw:p-6 uw:space-y-6">
        {/* Filter Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="flex uw:items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <div className="flex items-center space-x-2 uw:space-x-4 uw:text-2xl">
              <Filter className="w-4 h-4 uw:w-6 uw:h-6" />
              <span>
                {selectedFilters.includes('all')
                  ? `All Profiles (${profiles.length})`
                  : `${selectedFilters.length} Filter${selectedFilters.length !== 1 ? 's' : ''} Selected`
                }
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 uw:w-6 uw:h-6 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute  z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              <div className="p-2 u space-y-1 uw:p-4 uw:space-y-2">
                {/* All option */}
                <label className="flex items-center uw:p-4 uw:space-x-4 space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFilters.includes('all')}
                    onChange={() => handleFilterToggle('all')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 uw:text-2xl">All ({profiles.length})</span>
                </label>

                {/* Favorites option */}
                <label className="flex items-center uw:space-x-4 space-x-3 p-2 uw:p-4 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFilters.includes('favorites')}
                    onChange={() => handleFilterToggle('favorites')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 uw:text-2xl">Favorites ({profiles.filter(p => p.isFavorite).length})</span>
                </label>

                {/* Custom option */}
                <label className="flex items-center uw:p-4 uw:space-x-4 space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFilters.includes('custom')}
                    onChange={() => handleFilterToggle('custom')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 uw:text-2xl">Custom ({profiles.filter(p => !p.isDefault).length})</span>
                </label>

                {/* Tag options */}
                {getAllTags().map(tag => (
                  <label key={tag} className="flex items-center uw:p-4 uw:space-x-4 space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(tag)}
                      onChange={() => handleFilterToggle(tag)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm uw:text-2xl text-gray-700">{tag} ({profiles.filter(p => p.tags?.includes(tag)).length})</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profiles List */}
        <div className="space-y-3 uw:space-y-4 max-h-64 overflow-y-auto">
          {getFilteredProfiles().map((profile) => (
            <div
              key={profile.id}
              className={`p-3 uw:p-6 border bg-gray-50 rounded-lg transition-all ${lastApplied === profile.id
                  ? 'border-green-300 bg-red-50'
                  : 'border-gray-200 hover:border-red-300 '
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1 uw:space-x-4 uw:mb-2">
                    <h4 className="text-sm uw:text-3xl font-semibold text-gray-900">{profile.name}</h4>
                    {profile.isDefault && (
                      <span className="text-xs uw:text-2xl bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                    {lastApplied === profile.id && (
                      <CheckCircle className="w-4 h-4 uw:w-6 uw:h-6 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs uw:text-2xl  text-gray-600 mb-2">{profile.description}</p>

                  {/* Settings Preview */}
                  <div className="flex flex-wrap gap-1 mb-2 uw:gap-2 uw:mb-4">
                    {stepType === 'animation' && (
                      <>
                        <span className="text-xs uw:text-2xl bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          Speed: {profile.settings.speed}x
                        </span>
                        <span className="text-xs uw:text-2xl bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          Blur: {profile.settings.blurIntensity}px
                        </span>
                        <span className="text-xs uw:text-2xl bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {profile.settings.easing}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Tags */}
                  {profile.tags && profile.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2 uw:gap-2 uw:mb-4">
                      {profile.tags.map(tag => (
                        <span key={tag} className="text-xs uw:text-2xl bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Usage Stats */}
                  <div className="flex  uw:space-x-6 items-center space-x-3 text-xs uw:text-2xl text-gray-500">
                    <span>Used {profile.usageCount || 0} times</span>
                    {profile.lastUsed && (
                      <span>Last: {new Date(profile.lastUsed).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 ml-3 uw:ml-4 uw:space-x-2">
                  <button
                    onClick={() => toggleFavorite(profile.id)}
                    className={`p-1.5 uw:text-2xl uw:px-4 uw:py-2 rounded transition-colors ${profile.isFavorite
                        ? 'text-yellow-500 uw:text-2xl hover:text-yellow-600'
                        : 'text-gray-400 uw:text-2xl hover:text-yellow-500'
                      }`}
                    title="Toggle favorite"
                  >
                    <Star className={`w-4 h-4 uw:w-6 uw:h-6 ${profile.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleApplyProfile(profile)}
                    className="p-1.5 uw:text-2xl uw:px-4 uw:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                    title="Apply profile"
                  >
                    <Download className="w-4 h-4 uw:w-6 uw:h-6" />
                  </button>

                  <button
                    onClick={() => exportProfile(profile)}
                    className="p-1.5 uw:text-2xl uw:px-4 uw:py-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    title="Export profile"
                  >
                    <Share className="w-4 h-4 uw:w-6 uw:h-6" />
                  </button>

                  {!profile.isDefault && (
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="p-1.5 uw:text-2xl uw:px-4 uw:py-2 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4 uw:w-6 uw:h-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1002]">
          <div className="bg-white rounded-xl p-6 w-96 max-w-90vw">
            <h3 className="text-lg uw:text-3xl uw:mb-8 font-bold text-gray-900 mb-4">Save Profile</h3>

            <div className="space-y-4 uw:space-y-6">
              <div>
                <label className="block uw:text-2xl uw:mb-4 text-sm font-medium text-gray-700 mb-2">Profile Name</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full uw:text-2xl uw:px-6 uw:py-4 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="My Custom Profile"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uw:text-2xl uw:mb-4">Description</label>
                <textarea
                  value={newProfileDescription}
                  onChange={(e) => setNewProfileDescription(e.target.value)}
                  className="w-full uw:text-2xl uw:px-6 uw:py-4 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  placeholder="Describe your profile settings..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uw:text-2xl uw:mb-4">Tags</label>
                <div className="flex flex-wrap gap-2 uw:gap-4">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag)
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                      className={`px-3 py-1  uw:text-2xl uw:px-4 uw:py-2 text-xs rounded-full transition-colors ${selectedTags.includes(tag)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 uw:mt-8 uw:space-x-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 uw:text-2xl uw:px-6 uw:py-4 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={!newProfileName.trim()}
                className="px-4 py-2 uw:text-2xl uw:px-6 uw:py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4 uw:w-6 uw:h-6" />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};