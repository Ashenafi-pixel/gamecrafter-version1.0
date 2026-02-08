import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Building2, Save, Sparkles, Loader, Play, RotateCcw, Monitor, Smartphone } from 'lucide-react';
import { useGameStore, Studio } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingJourneyConfig } from './visual-journey/shared/LoadingJourneyStore';
import ProfessionalLoadingPreview from './visual-journey/shared/ProfessionalLoadingPreview';
import { enhancedOpenaiClient } from '../utils/enhancedOpenaiClient';
import { Button } from './Button';
import { ErrorBoundary } from './ErrorBoundary';

interface StudioCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    studioToEdit?: Studio | null;
}

// Default loading config to initialize new studios
const defaultLoadingConfig: LoadingJourneyConfig['loadingExperience'] = {
    studioLogo: null,
    studioLogoSize: 80,
    studioLogoPrompt: 'Professional gaming studio logo, modern design, elegant typography, premium casino aesthetic',
    studioLogoPosition: { x: 50, y: 15 },
    progressStyle: 'bar',
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    loadingSprite: null,
    spriteAnimation: 'roll',
    spriteSize: 40,
    spritePosition: 'in-bar',
    loadingTips: [
        'Look for scatter symbols to trigger bonus rounds!',
        'Wild symbols substitute for all symbols except scatters',
        'Higher bets unlock bigger win potential',
    ],
    audioEnabled: true,
    minimumDisplayTime: 3000,
    showPercentage: true,
    percentagePosition: 'above',
    progressBarPosition: { x: 50, y: 65 },
    progressBarWidth: 60,
    customMessage: 'GameStudio™ - 2024',
    customMessagePosition: { x: 50, y: 90 },
    customMessageSize: 14,
};

const StudioCreationModal: React.FC<StudioCreationModalProps> = ({ isOpen, onClose, studioToEdit }) => {
    const { createStudio, updateStudio } = useGameStore();

    // Basic Studio State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Loading Experience State
    const [loadingConfig, setLoadingConfig] = useState<LoadingJourneyConfig['loadingExperience']>(defaultLoadingConfig);
    const [studioLogoGenerating, setStudioLogoGenerating] = useState(false);
    const [spriteGenerating, setSpriteGenerating] = useState(false);

    // Preview State
    const [previewDeviceMode, setPreviewDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (studioToEdit) {
                setName(studioToEdit.name);
                setDescription(studioToEdit.description);
                setLogoPreview(studioToEdit.logo);
                // Load existing preloader config or fall back to default
                if (studioToEdit.settings?.preloader) {
                    setLoadingConfig({ ...defaultLoadingConfig, ...studioToEdit.settings.preloader });
                } else {
                    // If editing but no preloader config, keep default but ensure studio logo is synced if we want that behavior
                    // Actually, let's just use default
                    setLoadingConfig(defaultLoadingConfig);
                }
            } else {
                setName('');
                setDescription('');
                setLogoPreview(null);
                setLoadingConfig(defaultLoadingConfig);
            }
            // Reset preview state
            setIsLoadingVideo(true);
            setLoadingProgress(50); // Show it half-way for static preview
        }

        return () => {
            if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        }
    }, [isOpen, studioToEdit]);

    // Sync Studio Logo with Loading Config Logo
    useEffect(() => {
        // When the main studio logo changes, we might want to update the loading config logo if it wasn't customized
        // For now, let's keep them separate as per the "Step 9" logic which has its own logo upload
    }, [logoPreview]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setLogoPreview(result);
                // Automatically update the loading screen logo as well for better UX
                setLoadingConfig(prev => ({ ...prev, studioLogo: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLoadingLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLoadingConfig(prev => ({ ...prev, studioLogo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSpriteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLoadingConfig(prev => ({ ...prev, loadingSprite: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const generateStudioLogo = async () => {
        setStudioLogoGenerating(true);
        try {
            const result = await enhancedOpenaiClient.generateImageWithConfig({
                prompt: loadingConfig.studioLogoPrompt || 'Epic game studio logo',
                targetSymbolId: `studio_logo_${Date.now()}`,
                gameId: 'studio-creation'
            });

            if (result?.success && result?.images && result.images.length > 0) {
                const imageUrl = result.images[0];
                setLoadingConfig(prev => ({ ...prev, studioLogo: imageUrl }));
            }
        } catch (error) {
            console.error('Studio logo generation failed:', error);
        } finally {
            setStudioLogoGenerating(false);
        }
    };

    const generateSprite = async () => {
        setSpriteGenerating(true);
        try {
            // Use a default prompt if none provided
            const result = await enhancedOpenaiClient.generateImageWithConfig({
                prompt: 'Golden nugget with metallic texture, 3D rendered, casino style, shiny gold finish', // Use hardcoded prompt or add field
                targetSymbolId: `loading_sprite_${Date.now()}`,
                gameId: 'studio-creation'
            });

            if (result?.success && result?.images && result.images.length > 0) {
                const imageUrl = result.images[0];
                setLoadingConfig(prev => ({ ...prev, loadingSprite: imageUrl }));
            }
        } catch (error) {
            console.error('Sprite generation failed:', error);
        } finally {
            setSpriteGenerating(false);
        }
    };

    const togglePreviewPlayback = () => {
        if (isLoadingVideo) {
            setIsLoadingVideo(false);
            if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        } else {
            setIsLoadingVideo(true);
            setLoadingProgress(0);

            let progress = 0;
            loadingIntervalRef.current = setInterval(() => {
                progress += 1;
                if (progress > 100) {
                    progress = 0; // Loop
                }
                setLoadingProgress(progress);
            }, 50);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const studioData = {
            name,
            description,
            logo: logoPreview || '',
            settings: {
                preloader: loadingConfig
            }
        };

        if (studioToEdit) {
            updateStudio(studioToEdit.id, studioData);
        } else {
            createStudio(studioData);
        }

        onClose();
    };

    if (!isOpen) return null;

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-[95vw] h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-red-600" />
                            {studioToEdit ? 'Edit Studio Configuration' : 'Create New Studio'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Content Area - Split View */}
                    <div className="flex flex-1 overflow-hidden">

                        {/* Left Panel: Configuration (Scrollable) */}
                        <div className="w-[45%] overflow-y-auto p-6 border-r border-gray-200 bg-gray-50/30">
                            <form id="studio-form" onSubmit={handleSubmit} className="space-y-8">

                                {/* 1. Basic Studio Info */}
                                <div id="section-identity" className="space-y-6 scroll-mt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-red-500 pl-3">Studio Identity</h3>

                                    <div className="flex gap-6 items-start">
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Studio Name <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="e.g. Thunderkick Games"
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    placeholder="Briefly describe your studio..."
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all h-20 resize-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Small Logo Upload for Studio Card */}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-32 h-32 flex-shrink-0 rounded-2xl border-2 border-dashed border-gray-300 hover:border-red-400 hover:bg-red-50 flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden bg-white"
                                        >
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-red-500 mb-2" />
                                                    <span className="text-xs text-center px-2 text-gray-500 group-hover:text-red-600 font-medium">Card Logo</span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-200" />

                                {/* 2. Loading Experience Config */}
                                <div id="section-loading" className="space-y-6 scroll-mt-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-blue-500 pl-3">Loading Experience</h3>
                                        <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">Step 9 Data</span>
                                    </div>

                                    {/* Studio Logo Config */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-amber-500" /> Studio Logo (Preloader)
                                        </h4>

                                        <textarea
                                            value={loadingConfig.studioLogoPrompt}
                                            onChange={(e) => setLoadingConfig({ ...loadingConfig, studioLogoPrompt: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                                            rows={2}
                                            placeholder="Prompt for logo generation..."
                                        />

                                        <div className="flex gap-2">
                                            <Button
                                                variant="generate"
                                                onClick={generateStudioLogo}
                                                disabled={studioLogoGenerating}
                                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                                            >
                                                {studioLogoGenerating ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                                AI Generate
                                            </Button>
                                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                                <Upload className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-700">Upload</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleLoadingLogoUpload} />
                                            </label>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>Size</span>
                                                    <span>{loadingConfig.studioLogoSize}px</span>
                                                </div>
                                                <input
                                                    type="range" min="40" max="200" step="10"
                                                    value={loadingConfig.studioLogoSize}
                                                    onChange={(e) => setLoadingConfig({ ...loadingConfig, studioLogoSize: parseInt(e.target.value) })}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>Horizontal</span>
                                                        <span>{loadingConfig.studioLogoPosition?.x}%</span>
                                                    </div>
                                                    <input
                                                        type="range" min="0" max="100"
                                                        value={loadingConfig.studioLogoPosition?.x}
                                                        onChange={(e) => setLoadingConfig({ ...loadingConfig, studioLogoPosition: { ...loadingConfig.studioLogoPosition, x: parseInt(e.target.value) } })}
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>Vertical</span>
                                                        <span>{loadingConfig.studioLogoPosition?.y}%</span>
                                                    </div>
                                                    <input
                                                        type="range" min="0" max="100"
                                                        value={loadingConfig.studioLogoPosition?.y}
                                                        onChange={(e) => setLoadingConfig({ ...loadingConfig, studioLogoPosition: { ...loadingConfig.studioLogoPosition, y: parseInt(e.target.value) } })}
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Style */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                        <h4 className="font-medium text-gray-900">Progress Style</h4>
                                        <div className="flex bg-gray-100 p-1 rounded-lg">
                                            {['bar', 'circular'].map(style => (
                                                <button
                                                    key={style}
                                                    type="button"
                                                    onClick={() => setLoadingConfig({ ...loadingConfig, progressStyle: style as any })}
                                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${loadingConfig.progressStyle === style ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    {style.charAt(0).toUpperCase() + style.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Background</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={loadingConfig.backgroundColor}
                                                        onChange={(e) => setLoadingConfig({ ...loadingConfig, backgroundColor: e.target.value })}
                                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                    />
                                                    <span className="text-xs font-mono text-gray-500">{loadingConfig.backgroundColor}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Accent</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={loadingConfig.accentColor}
                                                        onChange={(e) => setLoadingConfig({ ...loadingConfig, accentColor: e.target.value })}
                                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                    />
                                                    <span className="text-xs font-mono text-gray-500">{loadingConfig.accentColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Loading Sprite */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                        <h4 className="font-medium text-gray-900">Loading Sprite</h4>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="generate"
                                                onClick={generateSprite}
                                                disabled={spriteGenerating}
                                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                {spriteGenerating ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                                AI Generate
                                            </Button>
                                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                                <Upload className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-700">Upload</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleSpriteUpload} />
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Animation</label>
                                                <select
                                                    value={loadingConfig.spriteAnimation}
                                                    onChange={(e) => setLoadingConfig({ ...loadingConfig, spriteAnimation: e.target.value as any })}
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                                                >
                                                    <option value="roll">Roll</option>
                                                    <option value="spin">Spin</option>
                                                    <option value="bounce">Bounce</option>
                                                    <option value="pulse">Pulse</option>
                                                    <option value="slide">Slide</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Position</label>
                                                <select
                                                    value={loadingConfig.spritePosition}
                                                    onChange={(e) => setLoadingConfig({ ...loadingConfig, spritePosition: e.target.value as any })}
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                                                >
                                                    <option value="in-bar">Follow Progress</option>
                                                    <option value="above-bar">Above Bar</option>
                                                    <option value="below-bar">Below Bar</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Size</span>
                                                <span>{loadingConfig.spriteSize}px</span>
                                            </div>
                                            <input
                                                type="range" min="20" max="100" step="5"
                                                value={loadingConfig.spriteSize}
                                                onChange={(e) => setLoadingConfig({ ...loadingConfig, spriteSize: parseInt(e.target.value) })}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                            </form>
                        </div>

                        {/* Right Panel: Live Preview (Fixed) */}
                        <div className="flex-1 bg-gray-900 p-6 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <Monitor className="w-4 h-4 text-blue-400" /> Live Preview
                                </h3>

                                <div className="flex gap-2">
                                    <div className="bg-gray-800 rounded-lg p-1 flex">
                                        <button
                                            onClick={() => setPreviewDeviceMode('desktop')}
                                            className={`p-1.5 rounded-md transition-colors ${previewDeviceMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                            title="Desktop"
                                        >
                                            <Monitor className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setPreviewDeviceMode('mobile')}
                                            className={`p-1.5 rounded-md transition-colors ${previewDeviceMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                            title="Mobile"
                                        >
                                            <Smartphone className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={togglePreviewPlayback}
                                        className={`p-2 rounded-lg transition-colors ${isLoadingVideo ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}
                                        title={isLoadingVideo ? "Pause" : "Play"}
                                    >
                                        {isLoadingVideo ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 rounded-xl overflow-hidden border border-gray-800 shadow-2xl relative">
                                <ErrorBoundary fallback={
                                    <div className="flex items-center justify-center h-full text-white bg-gray-900">
                                        <div className="text-center">
                                            <p className="text-red-400 mb-2">Preview failed to load</p>
                                            <p className="text-xs text-gray-500">Check console for details</p>
                                        </div>
                                    </div>
                                }>
                                    <ProfessionalLoadingPreview
                                        loadingProgress={loadingProgress}
                                        currentPhase={1}
                                        assetCategories={[
                                            { name: 'Assets', loaded: Math.floor(loadingProgress / 10), total: 10, status: 'loading' }
                                        ]}
                                        isLoading={true} // Always show loading state for preview
                                        deviceMode={previewDeviceMode}
                                        customConfig={loadingConfig}
                                        className="h-full w-full"
                                    />
                                </ErrorBoundary>
                            </div>

                            <p className="text-gray-500 text-xs text-center mt-4">
                                Preview uses PixiJS rendering engine for pixel-perfect accuracy
                            </p>
                        </div>

                    </div>

                    {/* Bottom Bar: Actions */}
                    <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-white flex-shrink-0 z-20">
                        {/* Left: Cancel */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>

                        {/* Center: Tabs (Navigation) */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => scrollToSection('section-identity')}
                                className="px-4 py-1.5 text-sm font-medium rounded-md transition-all text-gray-600 hover:text-gray-900 hover:bg-white/50 flex items-center gap-2"
                            >
                                <Building2 className="w-4 h-4" />
                                Identity
                            </button>
                            <div className="w-px bg-gray-300 my-1 mx-1"></div>
                            <button
                                type="button"
                                onClick={() => scrollToSection('section-loading')}
                                className="px-4 py-1.5 text-sm font-medium rounded-md transition-all text-gray-600 hover:text-gray-900 hover:bg-white/50 flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Loading Experience
                            </button>
                        </div>

                        {/* Right: Save */}
                        <button
                            onClick={handleSubmit} // Trigger form submit
                            className="px-8 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save Configuration
                        </button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StudioCreationModal;
