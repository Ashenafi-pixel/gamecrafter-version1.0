import { useCallback, useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import { PresetConfig, SymbolConfig } from '../../../types/EnhancedAnimationLabStep4';
import type { SymbolSpineAsset } from '../../../types';
import { useGameStore } from "../../../store";
import SymbolCarouselItem from "../../enhanced-animation-lab/Symbol-caraousel-Item";
import { Button } from "../../Button";
import { Loader, Sparkles, Upload, FileArchive, Play } from "lucide-react";
import { LAYOUT_TEMPLATES } from "../../enhanced-animation-lab/Layout-Animation-Template";
import enhancedOpenaiClient from "../../../utils/enhancedOpenaiClient";
import { PREDEFINED_SYMBOLS } from '../../../utils/predefinedSymbols';
import { cropImageSides } from '../../../utils/cropExtendedImage';
import { PRESET_CONFIGURATIONS, getDefaultDescription, getPresetPredefinedSymbols } from '../../../utils/symbolGenerationHelper';
import { motion, AnimatePresence } from 'framer-motion';
import SpineSymbolPreview from "../../enhanced-animation-lab/SpineSymbolPreview";

interface EnhancedAnimationLabProps {
    layoutMode?: 'full' | 'creation' | 'animation';
}

const Step5_SymbolGenerationNe: React.FC<EnhancedAnimationLabProps> = ({ layoutMode = 'full' }) => {

    // Game Store Integration
    const { config, updateConfig } = useGameStore();
    // Local state for paytable inputs
    const [selectedPreset, setSelectedPreset] = useState<string | null>('Classic');
    const getSymbolStorageKey = (symbolType: string): string => {
        return symbolType.toLowerCase().replace(/\s+/g, '');
    };
    const [currentSymbolIndex, setCurrentSymbolIndex] = useState(0);
    const [symbolType, setSymbolType] = useState<'block' | 'contour'>('block');
    const [contentType, setContentType] = useState<'symbol-only' | 'symbol-wild' | 'text-only' | 'custom-text'>('symbol-only');
    const [size, setSize] = useState<'1x1' | '1x3' | '2x2' | '3x3' | '4x4'>('1x1');
    const [isProcessing] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [customText, setCustomText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedLayoutTemplate, setSelectedLayoutTemplate] = useState<'text-top' | 'text-bottom' | 'text-overlay'>('text-bottom');
    const [hasManualOverride, setHasManualOverride] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);
    const spineSymbolZipInputRef = useRef<HTMLInputElement>(null);
    const selectedSymbolPlayWinRef = useRef<(() => void) | null>(null);

    const getSymbolSpecificContentType = (): { contentType: string; label: string } => {
        if (!selectedSymbol) return { contentType: 'symbol-only', label: 'Symbol + Wild (4 letters)' };
        const symbolType_1 = selectedSymbol.gameSymbolType?.toLowerCase() || 'wild';
        if (symbolType_1.includes('wild')) {
            return { contentType: 'symbol-wild', label: 'Symbol + Wild (4 letters)' };
        } else {
            const symbolName = symbolType_1.charAt(0).toUpperCase() + symbolType_1.slice(1);
            return { contentType: `symbol-${symbolType_1}`, label: `Symbol + ${symbolName} text` };
        }
    };

    // Handle preset switching - Classic symbols are initialized in store, others added here
    const lastPresetRef = useRef<string | null>(selectedPreset);

    useEffect(() => {
        if (selectedPreset && selectedPreset !== 'Classic' && selectedPreset !== lastPresetRef.current) {
            lastPresetRef.current = selectedPreset;
            const presetSymbols = getPresetPredefinedSymbols(selectedPreset);
            const preset = PRESET_CONFIGURATIONS.find(p => p.name === selectedPreset);
            const current = config?.theme?.generated?.symbols as Record<string, string | SymbolSpineAsset> | undefined;
            const merged: Record<string, string | SymbolSpineAsset> = {};
            const presetKeys = preset?.symbols.map(s => getSymbolStorageKey(s.type)) ?? [];
            presetKeys.forEach(key => {
                if (current && current[key] !== undefined) merged[key] = current[key];
                else merged[key] = presetSymbols[key] ?? (PREDEFINED_SYMBOLS as Record<string, string>)[key] ?? '';
            });
            updateConfig({
                theme: {
                    ...config.theme,
                    generated: {
                        background: config.theme?.generated?.background || null,
                        frame: config.theme?.generated?.frame || null,
                        symbols: merged,
                        bonusSymbols: config.theme?.generated?.bonusSymbols
                    }
                }
            });
        } else if (selectedPreset === 'Classic') {
            lastPresetRef.current = 'Classic';
        }
    }, [selectedPreset]);

    const getCurrentPresetSymbols = (): SymbolConfig[] => {
        const preset = PRESET_CONFIGURATIONS.find(p => p.name === selectedPreset);
        if (!preset) return [];

        const raw = config?.theme?.generated?.symbols;
        const symbolsRecord = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, string | SymbolSpineAsset>;
        const theme = config?.gameTheme || 'default';
        return preset.symbols.map(symbolDef => {
            const storageKey = symbolDef.type.toLowerCase().replace(/\s+/g, '');
            const val = symbolsRecord[storageKey];
            const imageUrl = typeof val === 'string' ? val : undefined;
            const spineAsset = val && typeof val === 'object' && 'atlasUrl' in val ? (val as SymbolSpineAsset) : undefined;
            return {
                id: storageKey,
                name: symbolDef.type.charAt(0).toUpperCase() + symbolDef.type.slice(1),
                symbolType: 'block' as const,
                contentType: symbolDef.type === 'wild' || symbolDef.type === 'wild 2' ? 'symbol-wild' as const : 'symbol-only' as const,
                size: '1x1' as const,
                prompt: `High quality slot machine symbol: ${getDefaultDescription(symbolDef.type, theme)}. Clean, professional design with transparent background.`,
                gameSymbolType: symbolDef.type,
                importance: symbolDef.importance,
                rarity: symbolDef.rarity,
                defaultDescription: getDefaultDescription(symbolDef.type, theme),
                imageUrl,
                spineAsset
            } as SymbolConfig;
        });
    };

    const presetSymbols = getCurrentPresetSymbols();
    const selectedSymbol = presetSymbols[currentSymbolIndex] || null;

    // Auto-sync contentType with selected symbol's type (only if no manual override)
    useEffect(() => {
        if (selectedSymbol?.contentType && !hasManualOverride) {
            const validContentTypes = ['symbol-only', 'symbol-wild', 'text-only', 'custom-text'] as const;
            if (validContentTypes.includes(selectedSymbol.contentType as typeof validContentTypes[number])) {
                setContentType(selectedSymbol.contentType as typeof validContentTypes[number]);
            }
        }
    }, [selectedSymbol, hasManualOverride]);

    useEffect(() => {
        const raw = config?.theme?.generated?.symbols;
        const symbolUrls = raw && typeof raw === 'object' && !Array.isArray(raw)
            ? Object.values(raw).filter((v): v is string => typeof v === 'string' && v !== '')
            : [];

        if (symbolUrls.length > 0) {
            window.dispatchEvent(new CustomEvent('symbolsChanged', {
                detail: {
                    symbols: symbolUrls,
                    gameId: config?.gameId || 'default',
                    source: 'symbol-update',
                    forceRefresh: true,
                    timestamp: Date.now()
                }
            }));
        }
    }, [config?.theme?.generated?.symbols, config?.gameId]);

    // Helper: build symbol map for preset, preserving existing uploads (image or Spine)
    const initializeEmptySymbolSlots = useCallback((preset: PresetConfig) => {
        const symbolSlots: Record<string, string | SymbolSpineAsset> = {};
        const raw = config?.theme?.generated?.symbols;
        const existing = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, string | SymbolSpineAsset>;
        const predefinedSymbolsRecord = PREDEFINED_SYMBOLS as Record<string, string>;
        const presetKeys = preset.symbols.map(s => s.type.toLowerCase().replace(/\s+/g, ''));

        presetKeys.forEach(key => {
            const existingVal = existing[key];
            if (existingVal !== undefined) {
                symbolSlots[key] = existingVal;
            } else {
                symbolSlots[key] = predefinedSymbolsRecord[key] || '';
            }
        });
        return symbolSlots;
    }, [config?.theme?.generated?.symbols]);

    // Handle preset selection with clean slate approach
    const handlePresetSelection = useCallback((presetName: string) => {
        const preset = PRESET_CONFIGURATIONS.find(p => p.name === presetName);
        if (!preset) return;
        setSelectedPreset(presetName);
        setCurrentSymbolIndex(0);

        // Get ONLY the symbols for this preset (clean slate with preservation)
        const presetSpecificSymbols = initializeEmptySymbolSlots(preset);

        updateConfig({
            theme: {
                ...config?.theme,
                generated: {
                    background: config?.theme?.generated?.background || null,
                    frame: config?.theme?.generated?.frame || null,
                    symbols: presetSpecificSymbols, // Only preset-specific symbols
                    bonusSymbols: config?.theme?.generated?.bonusSymbols
                }
            }
        });
    }, [config?.theme, initializeEmptySymbolSlots, updateConfig]);

    // Navigate to symbol with smooth scroll
    const navigateToSymbol = useCallback((index: number) => {
        const presetSymbols = getCurrentPresetSymbols();
        if (index >= 0 && index < presetSymbols.length) {
            setCurrentSymbolIndex(index);

            // Smooth scroll to center the selected symbol
            setTimeout(() => {
                if (carouselRef.current) {
                    const symbolElement = carouselRef.current.querySelector(`[data-symbol-index="${index}"]`) as HTMLElement;
                    if (symbolElement) {
                        const containerWidth = carouselRef.current.offsetWidth;
                        const symbolWidth = symbolElement.offsetWidth;
                        const symbolLeft = symbolElement.offsetLeft;
                        const scrollLeft = symbolLeft - (containerWidth / 2) + (symbolWidth / 2);

                        carouselRef.current.scrollTo({
                            left: scrollLeft,
                            behavior: 'smooth'
                        });
                    }
                }
            }, 50);

            // Sync content type radio buttons with selected symbol's type
            const selectedSymbol = presetSymbols[index];
            if (selectedSymbol && selectedSymbol.contentType) {
                const validContentTypes = ['symbol-only', 'symbol-wild', 'text-only', 'custom-text'] as const;
                const symbolContentType = selectedSymbol.contentType;
                if (validContentTypes.includes(symbolContentType as typeof validContentTypes[number])) {
                    setContentType(symbolContentType as typeof validContentTypes[number]);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyLayoutTemplate = useCallback((templateId: 'text-top' | 'text-bottom' | 'text-overlay') => {

        switch (templateId) {
            case 'text-top':
                setSelectedLayoutTemplate('text-top');
                break;
            case 'text-bottom':
                setSelectedLayoutTemplate('text-bottom');
                break;
            case 'text-overlay':
                setSelectedLayoutTemplate('text-overlay');
                break;
            default:
                console.warn('⚠️ Unknown layout template:', templateId);
                setSelectedLayoutTemplate('text-bottom');
        }
    }, []);

    // Convert URL to base64 if needed
    const convertUrlToBase64 = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    };

    // Build enhanced prompt with all context
    const buildEnhancedPrompt = useCallback(() => {
        if (!selectedSymbol) return prompt;

        let cleanedPrompt = prompt.trim() || selectedSymbol.defaultDescription;

        // Remove redundant terms
        const redundantTerms = [
            /\b(contour|block|square)\b/gi,
            /\b(symbol only|symbol-only|text only|text-only|custom text|custom-text|symbol text|symbol-text|symbol wild|symbol scatter|symbol bonus|symbol free|symbol jackpot)\b/gi,
            /\b(1x1|1x3|2x2|3x3|4x4) grid\b/gi,
            /\band the text\s*["']?\s*\w+\s*["']?/gi,
            /\bwith text\s*["']?\s*\w+\s*["']?/gi,
        ];
        redundantTerms.forEach(term => {
            cleanedPrompt = cleanedPrompt?.replace(term, '');
        });
        cleanedPrompt = cleanedPrompt?.replace(/\s+/g, ' ').trim();

        let enhancedPrompt = 'Create a PREMIUM casino slot machine symbol with PROFESSIONAL QUALITY. ';
        enhancedPrompt += 'Ultra-high resolution, crisp details, vibrant colors, perfect for high-end slot games. ';
        enhancedPrompt += `SUBJECT: ${cleanedPrompt}. `;

        // Symbol type
        if (symbolType === 'contour') {
            enhancedPrompt += 'SHAPE: Custom contour shape with transparent background and organic edges. ';
        } else {
            enhancedPrompt += 'SHAPE: Full square format with full transparent background fill. ';
        }

        // Size instructions
        const sizeInstructions = {
            '1x1': 'Standard single-cell symbol for 1x1 grid placement.',
            '1x3': 'Tall vertical symbol designed for 1x3 grid spanning multiple rows.',
            '2x2': 'Large square symbol for 2x2 grid placement.',
            '3x3': 'Extra large symbol for 3x3 grid.',
            '4x4': 'Mega symbol for 4x4 grid placement.'
        };
        enhancedPrompt += `SIZE: ${sizeInstructions[size]} `;

        // Get word configuration
        const getWordConfig = (ct: string): { word: string; letters: string[]; totalSprites: number } | null => {
            switch (ct) {
                case 'symbol-wild':
                    return { word: 'WILD', letters: ['W', 'I', 'L', 'D'], totalSprites: 5 };
                case 'custom-text':
                    if (customText && customText.length > 0) {
                        const letters = customText.split('');
                        return { word: customText, letters, totalSprites: letters.length + 1 };
                    }
                    return { word: 'TEXT', letters: ['T', 'E', 'X', 'T'], totalSprites: 5 };
                default:
                    return null;
            }
        };

        const wordConfig = getWordConfig(contentType);

        if (wordConfig && ((contentType.startsWith('symbol-') && contentType !== 'symbol-only') || contentType === 'custom-text')) {
            const { word: detectedText, letters, totalSprites } = wordConfig;
            enhancedPrompt += `WORD-SPECIFIC LAYOUT FOR "${detectedText}": Create exactly ${totalSprites} COMPLETELY ISOLATED ELEMENTS. `;

            // Layout template instructions
            if (selectedLayoutTemplate === 'text-bottom') {
                const zoneSplit = { symbolZone: 67, gapZone: 3, textZone: 30 };
                enhancedPrompt += `LAYOUT: Symbol in top ${zoneSplit.symbolZone}%, then ${zoneSplit.gapZone}% transparent gap, then ${letters.length} letters "${letters.join(' ')}" in bottom ${zoneSplit.textZone}%. Each letter centered in its own box with 10% spacing between letters. `;
            } else if (selectedLayoutTemplate === 'text-top') {
                const zoneSplit = { textZone: 30, gapZone: 3, symbolZone: 67 };
                enhancedPrompt += `LAYOUT: ${letters.length} letters "${letters.join(' ')}" in top ${zoneSplit.textZone}%, then ${zoneSplit.gapZone}% transparent gap, then symbol in bottom ${zoneSplit.symbolZone}%. Each letter centered in its own box with 10% spacing between letters. `;
            } else {
                enhancedPrompt += `LAYOUT: Text "${detectedText}" overlaid on symbol with strong contrast. `;
            }

            enhancedPrompt += `SPACING: ENORMOUS empty space between letters and between letter row and main symbol. `;
            enhancedPrompt += `ISOLATION: Each element COMPLETELY SEPARATE with NO overlapping. `;
        } else if (contentType === 'text-only') {
            enhancedPrompt += 'LAYOUT: Large, bold letters with clear spacing. ';
        } else {
            enhancedPrompt += 'LAYOUT: Single centered symbol taking up most of the space. ';
        }

        enhancedPrompt += 'High quality, transparent background, crisp details, bright colors suitable for casino slot games.';

        return enhancedPrompt;
    }, [selectedSymbol, prompt, config?.gameTheme, symbolType, contentType, customText, size, selectedLayoutTemplate]);

    // Revoke blob URLs for a Spine asset to avoid memory leaks (only revoke blob: URLs)
    const revokeSpineAssetBlobUrls = (asset: SymbolSpineAsset | undefined) => {
        if (!asset) return;
        if (asset.atlasUrl?.startsWith('blob:')) URL.revokeObjectURL(asset.atlasUrl);
        if (asset.skelUrl?.startsWith('blob:')) URL.revokeObjectURL(asset.skelUrl);
        if (asset.textureUrl?.startsWith('blob:')) URL.revokeObjectURL(asset.textureUrl);
    };

    // Handle symbol upload
    const handleUploadSymbol = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedSymbol) {
            console.warn('⚠️ No file selected or no symbol selected');
            return;
        }
        try {
            // Read file as base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const storageKey = getSymbolStorageKey(selectedSymbol.gameSymbolType || '');

                console.log(`[Step5] Uploading symbol with key: ${storageKey}, type: ${selectedSymbol.gameSymbolType}`);

                // Revoke previous Spine blob URLs if this slot had a zip (unified symbols)
                const rawSym = config?.theme?.generated?.symbols as Record<string, string | SymbolSpineAsset> | undefined;
                const prevVal = rawSym?.[storageKey];
                if (prevVal && typeof prevVal === 'object' && 'atlasUrl' in prevVal) revokeSpineAssetBlobUrls(prevVal as SymbolSpineAsset);

                const currentSymbols = (config?.theme?.generated?.symbols && typeof config.theme.generated.symbols === 'object' && !Array.isArray(config.theme.generated.symbols))
                    ? (config.theme.generated.symbols as Record<string, string | SymbolSpineAsset>)
                    : {};
                const updatedSymbols = { ...currentSymbols, [storageKey]: base64String };

                updateConfig({
                    theme: {
                        ...config.theme,
                        generated: {
                            background: config.theme?.generated?.background || null,
                            frame: config.theme?.generated?.frame || null,
                            symbols: updatedSymbols,
                            bonusSymbols: config.theme?.generated?.bonusSymbols
                        }
                    }
                });

                // Dispatch event immediately after config update to ensure SlotMachine gets the update
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('symbolsChanged', {
                        detail: {
                            symbols: Object.values(updatedSymbols).filter((v): v is string => typeof v === 'string' && v !== ''),
                            symbolKey: storageKey,
                            symbolUrl: base64String,
                            gameId: config?.gameId || 'default',
                            source: 'symbol-upload',
                            forceRefresh: true,
                            timestamp: Date.now()
                        }
                    }));
                    console.log(`[Step5] Dispatched symbolsChanged event for uploaded symbol: ${storageKey}`);
                }, 100);
            };

            reader.onerror = () => {
                console.error('Error reading file');
                alert('Error reading file. Please try again.');
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Symbol upload error:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Handle animated (Spine) symbol ZIP upload – same format as character: .atlas, .skel or .json, and texture
    const handleSpineSymbolZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedSymbol) return;
        if (!file.name.toLowerCase().endsWith('.zip')) {
            alert('Please select a ZIP file containing Spine assets (.atlas, .skel or .json, and texture image).');
            event.target.value = '';
            return;
        }
        try {
            const zip = await JSZip.loadAsync(file);
            const names = Object.keys(zip.files).filter(n => !n.startsWith('__MACOSX'));
            const atlasEntry = names.find(n => n.toLowerCase().endsWith('.atlas'));
            const skelEntry = names.find(n => n.toLowerCase().endsWith('.skel'));
            const jsonEntry = names.find(n => n.toLowerCase().endsWith('.json'));
            const imageEntries = names.filter(n => {
                const entry = zip.files[n];
                if (entry?.dir) return false;
                const lower = n.toLowerCase();
                return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp');
            });
            if (!atlasEntry) {
                alert('ZIP must contain a .atlas file.');
                event.target.value = '';
                return;
            }
            if (!skelEntry && !jsonEntry) {
                alert('ZIP must contain a .skel or .json skeleton file.');
                event.target.value = '';
                return;
            }
            if (imageEntries.length === 0) {
                alert('ZIP must contain at least one image (.png, .webp, etc.).');
                event.target.value = '';
                return;
            }
            const atlasText = await zip.files[atlasEntry].async('text');
            const firstLine = atlasText.trim().split(/[\r\n]+/)[0]?.trim() || '';
            const atlasPageName = firstLine || undefined;
            const matchingImage = atlasPageName
                ? imageEntries.find(entry => entry.replace(/^.*[/\\]/, '') === atlasPageName)
                : null;
            const imageEntry = matchingImage || imageEntries[0];
            const textureName = atlasPageName || imageEntry.split(/[/\\]/).pop() || imageEntry;

            const atlasBlob = await zip.files[atlasEntry].async('blob');
            const atlasUrl = URL.createObjectURL(atlasBlob);
            const skelOrJsonEntry = skelEntry || jsonEntry!;
            const skelBlob = await zip.files[skelOrJsonEntry].async('blob');
            const skelUrl = URL.createObjectURL(skelBlob);
            const imgBlob = await zip.files[imageEntry].async('blob');
            const textureUrl = URL.createObjectURL(imgBlob);

            const storageKey = getSymbolStorageKey(selectedSymbol.gameSymbolType || '');
            const raw = config?.theme?.generated?.symbols as Record<string, string | SymbolSpineAsset> | undefined;
            const currentSymbols = (raw && typeof raw === 'object') ? { ...raw } : {};
            const prev = currentSymbols[storageKey];
            if (prev && typeof prev === 'object' && 'atlasUrl' in prev) revokeSpineAssetBlobUrls(prev as SymbolSpineAsset);

            currentSymbols[storageKey] = { atlasUrl, skelUrl, textureUrl, textureName };

            updateConfig({
                theme: {
                    ...config.theme,
                    generated: {
                        background: config.theme?.generated?.background || null,
                        frame: config.theme?.generated?.frame || null,
                        symbols: currentSymbols,
                        bonusSymbols: config.theme?.generated?.bonusSymbols
                    }
                }
            });
            // Single source of truth: SlotMachine reacts to config via effect; event only notifies for optional re-render
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('symbolsChanged', {
                    detail: {
                        symbols: Object.values(currentSymbols).filter((v): v is string => typeof v === 'string' && v !== ''),
                        symbolKey: storageKey,
                        gameId: config?.gameId || 'default',
                        source: 'symbol-spine-upload',
                        forceRefresh: true,
                        spineAsset: currentSymbols[storageKey] as SymbolSpineAsset,
                        timestamp: Date.now()
                    }
                }));
            }, 100);
            alert('Animated symbol loaded. It will appear in the slot reels.');
        } catch (err) {
            console.error('Spine symbol ZIP error:', err);
            alert(err instanceof Error ? err.message : 'Failed to read ZIP.');
        }
        event.target.value = '';
    };

    // Handle symbol generation
    const handleGenerateSymbol = async () => {
        if (!selectedSymbol || !prompt.trim()) {
            console.warn('⚠️ No symbol selected or prompt is empty');
            return;
        }
        setIsGenerating(true);
        try {
            const storageKey = getSymbolStorageKey(selectedSymbol.gameSymbolType || '');
            const themeName = (config?.theme?.name as string) || 'default';

            // Handle 1x3 dual-request flow
            if (size === '1x3') {
                // First request: 1024x1536 with extendedPrompt
                const extendedPrompt = `Create a HIGH-QUALITY 1024x1536 PNG with alpha transparency (transparent background). This is an expanded slot-machine symbol for a "${themeName}" themed slot game. Render a single, focused, highly-detailed illustration of: ${prompt}.
                                    Composition & safe-cropping requirements:
                                    - Center the MAIN SUBJECT horizontally and vertically.
                                    - Ensure the SUBJECT occupies **no more than 50% of the canvas width** so that there is **at least 25% fully transparent margin on BOTH LEFT and RIGHT sides** (i.e., left margin ≥ 25% of width, right margin ≥ 25% of width). This is critical: the final system will crop 25% off both sides.
                                    - Do NOT let any important detail (faces, text, hands, props) extend into the left/right 25% safe zones.
                                    - Keep subject fully visible top-to-bottom (no head/foot cut-offs).

                                    Content & format rules:
                                    - Output: PNG, exact canvas 1024x1536, alpha = 0 (transparent background).
                                    - No text, no numeric badges, no logos, no watermarks, no signatures, no UI frames.
                                    - Single primary subject unless ${prompt} explicitly requests multiple subjects; avoid distracting secondary focal points.

                                    Failure avoidance / clarity:
                                    - If any ambiguity about composition, SCALE the subject slightly smaller rather than placing it near the left/right safe zones.
                                    - Make subject readable at small sizes (icon-level clarity).

                                    Negative constraints (must NOT include): text, watermark, logo, UI frames, busy backgrounds, subject touching edges, chopped body parts, extra limbs, low-res artifacts.`;
                const firstResponse = await enhancedOpenaiClient.generateImageWithConfig({
                    prompt: extendedPrompt,
                    targetSymbolId: selectedSymbol.id,
                    size: '1024x1536'
                });

                if (firstResponse.success && firstResponse.images?.[0]) {
                    let firstImageBase64 = firstResponse.images[0];

                    // Convert URL to base64 if needed
                    if (!firstImageBase64.startsWith('data:')) {
                        firstImageBase64 = await convertUrlToBase64(firstImageBase64);
                    }

                    // Crop the extended image (remove 20% from left and right sides)
                    let croppedImageBase64: string;
                    try {
                        croppedImageBase64 = await cropImageSides(firstImageBase64, 20);
                    } catch (error) {
                        console.warn('⚠️ Cropping failed, using original image:', error);
                        croppedImageBase64 = firstImageBase64;
                    }

                    // Second request: 1024x1024 with reference to cropped image
                    const extendedPrompt2 = `Create a PREMIUM casino slot machine symbol with PROFESSIONAL QUALITY. Ultra-high resolution, 
                    crisp details, vibrant colors, perfect for high-end slot games. SUBJECT: A closeUp look of the given Subject. perfect symmetry,
                    and eye-catching visual appeal. SHAPE: Full square format with full transparent background fill. Professional block design 
                    suitable for standard slot machine grid layout. SIZE: Standard single-cell symbol for 1x1 grid placement. LAYOUT: Single 
                    centered symbol taking up most of the space. High quality, transparent background, crisp details, bright colors suitable 
                    for casino slot games.`;

                    const secondResponse = await enhancedOpenaiClient.generateImageWithConfig({
                        prompt: extendedPrompt2,
                        targetSymbolId: selectedSymbol.id,
                        size: '1024x1024',
                        sourceImage: croppedImageBase64
                    });

                    if (secondResponse.success && secondResponse.images?.[0]) {
                        let secondImageBase64 = secondResponse.images[0];

                        // Convert URL to base64 if needed
                        if (!secondImageBase64.startsWith('data:')) {
                            secondImageBase64 = await convertUrlToBase64(secondImageBase64);
                        }

                        // Store BOTH symbols in GameStore
                        updateConfig({
                            theme: {
                                ...config.theme,
                                presetSymbol: {
                                    ...config.theme?.presetSymbol,
                                    [`${selectedSymbol.gameSymbolType}_original`]: firstImageBase64,
                                    [`${selectedSymbol.gameSymbolType}_extended`]: croppedImageBase64
                                },
                                generated: {
                                    ...config.theme?.generated,
                                    symbols: {
                                        ...config?.theme?.generated?.symbols,
                                        [storageKey]: secondImageBase64
                                    }
                                }
                            }
                        });

                    } else {
                        alert(`Second generation failed: ${secondResponse.error || 'Unknown error'}`);
                    }
                } else {
                    alert(`First generation failed: ${firstResponse.error || 'Unknown error'}`);
                }
            } else {
                // Standard single request for 1x1 and other sizes
                const enhancedPrompt = buildEnhancedPrompt();

                const result = await enhancedOpenaiClient.generateImageWithConfig({
                    prompt: enhancedPrompt,
                    size: '1024x1024',
                    targetSymbolId: selectedSymbol.id,
                });

                if (result.success && result.images?.[0]) {
                    let imageData = result.images[0];

                    // Convert URL to base64 if needed
                    if (!imageData.startsWith('data:')) {
                        imageData = await convertUrlToBase64(imageData);
                    }

                    const currentSymbols = config?.theme?.generated?.symbols || {};
                    const updatedSymbols = {
                        ...currentSymbols,
                        [storageKey]: imageData
                    };

                    updateConfig({
                        theme: {
                            ...config.theme,
                            generated: {
                                background: config.theme?.generated?.background || null,
                                frame: config.theme?.generated?.frame || null,
                                symbols: updatedSymbols,
                                bonusSymbols: config.theme?.generated?.bonusSymbols
                            }
                        }
                    });

                } else {
                    console.error('Generation failed:', result.error);
                    alert(`Generation failed: ${result.error || 'Unknown error'}`);
                }
            }
        } catch (error) {
            console.error('Symbol generation error:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <div className="animation-lab-container ">
                {/* Header with Symbol Carousel */}
                <div className='bg-white rounded-md space-y-3 p-2'>
                    <div >
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg shadow-sm border border-gray-200 mb-">
                            <div className="px-4 py-3 flex items-center gap-2 border-gray-200 border-l-4 border-l-red-500 ">
                                <h3 className="text-lg font-semibold text-gray-800 uw:text-3xl">
                                    Symbol Creation Lab
                                </h3>
                                <div className="flex items-center justify-end gap-4">
                                    <div className="text-sm text-gray-600 uw:text-2xl">
                                        <span className="font-medium">{selectedPreset}</span> preset •
                                        <span className="ml-1">{presetSymbols.length} symbols</span>
                                        <span className="ml-1">({presetSymbols.filter(s => s.imageUrl || s.spineAsset).length} generated)</span>

                                    </div>
                                    <button
                                        onClick={() => {
                                            if (selectedPreset) {
                                                const preset = PRESET_CONFIGURATIONS.find(p => p.name === selectedPreset);
                                                if (!preset) return;

                                                // Get ONLY predefined symbols for current preset
                                                const presetSymbols = getPresetPredefinedSymbols(selectedPreset);
                                                updateConfig({
                                                    theme: {
                                                        ...config.theme,
                                                        generated: {
                                                            background: config.theme?.generated?.background || null,
                                                            frame: config.theme?.generated?.frame || null,
                                                            symbols: presetSymbols, // Only preset-specific predefined symbols
                                                        }
                                                    }
                                                });
                                            }
                                        }}
                                        className="px-2 py-1 uw:px-4 uw:py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs uw:text-3xl"
                                        title="Reset to predefined symbols for current preset"
                                    >
                                        Reset All
                                    </button>
                                </div>
                            </div>
                            <div className="text-sm bg-gray-50 w-auto text-gray-500 mr-2 uw:text-2xl">
                                Symbol {currentSymbolIndex + 1} of {presetSymbols.length}
                            </div>
                        </div>
                    </div>

                    {/* Main Symbol Carousel with improved scrolling */}
                    <div className="p-4">
                        <div className="mb-4">
                            <div className='border p-2 uw:p-4 rounded-md bg-gray-50'>
                                <div className="text-sm font-medium text-gray-700 mb-1 uw:text-3xl uw:mb-4">Switch Preset:</div>
                                <div className="grid grid-cols-2 gap-2 uw:gap-4">
                                    {PRESET_CONFIGURATIONS.map((preset) => (
                                        <div
                                            key={preset.name}
                                            onClick={() => handlePresetSelection(preset.name)}
                                            className={`flex-shrink-0 cursor-pointer rounded-lg border p-2 min-w-[200px] transition-all duration-200
                                                            hover:shadow-md
                                                    ${selectedPreset === preset.name
                                                    ? 'border-red-300 bg-red-50 '
                                                    : 'border-gray-200 bg-white hover:border-red-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold text-gray-800 uw:text-3xl">{preset.name}</h4>
                                                <span className="text-xs uw:text-2xl bg-gray-100 text-gray-600 px-2 py-1 uw:px-4 uw:py-2 rounded">
                                                    {preset.estimatedRTP}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2 uw:mb-4 uw:text-2xl">{preset.description}</p>

                                            {/* Symbol breakdown */}
                                            <div className="flex flex-wrap gap-1 uw:gap-2">
                                                {preset.symbols.map((symbolDef, index) => (
                                                    <span
                                                        key={index}
                                                        className={`text-xs uw:text-2xl px-1.5 py-0.5 uw:px-3 uw:py-1 rounded ${symbolDef.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                                                            symbolDef.rarity === 'epic' ? 'bg-red-100 text-red-800' :
                                                                symbolDef.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-gray-100 text-gray-600'
                                                            }`}
                                                    >
                                                        {symbolDef.type}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigateToSymbol(currentSymbolIndex - 1)}
                                disabled={currentSymbolIndex === 0}
                                className="flex-shrink-0 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center p-1 text-xl uw:p-4 uw:text-5xl uw:w-[90px] uw:h-[90px]">
                                ←
                            </button>
                            <div className="flex-1 overflow-hidden">
                                <motion.div
                                    ref={carouselRef}
                                    className="symbol-carousel-container flex gap-3 uw:gap-3 overflow-x-auto scrollbar-hide py-2 uw:py-4"
                                    style={{
                                        scrollBehavior: 'smooth',
                                        scrollSnapType: 'x mandatory'
                                    }}
                                >
                                    <AnimatePresence mode="popLayout">
                                        {presetSymbols.map((symbol, index) => {
                                            return (
                                                <motion.div
                                                    key={`${symbol.id}-${index}`}
                                                    data-symbol-index={index}
                                                    data-symbol-type={symbol.gameSymbolType}
                                                    data-symbol-id={symbol.id}
                                                    className="flex-shrink-0 px-2 uw:px-7"
                                                    style={{ scrollSnapAlign: 'center' }}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{
                                                        opacity: 1,
                                                        scale: index === currentSymbolIndex ? 1.05 : 1,
                                                        transition: { duration: 0.3, ease: "easeOut" }
                                                    }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <SymbolCarouselItem
                                                        symbol={symbol}
                                                        isSelected={index === currentSymbolIndex}
                                                        onClick={() => {
                                                            navigateToSymbol(index);
                                                            setHasManualOverride(false);
                                                        }}
                                                        progress={0}
                                                    />
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </motion.div>
                            </div>

                            <button
                                onClick={() => navigateToSymbol(currentSymbolIndex + 1)}
                                disabled={currentSymbolIndex === presetSymbols.length - 1}
                                className="flex-shrink-0 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center p-1 text-xl  uw:text-5xl uw:w-[90px] uw:h-[90px]">
                                →
                            </button>
                        </div>

                        {/* Selected symbol preview below carousel - full symbol (image or Spine) */}
                        {selectedSymbol && (
                            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 uw:text-xl">Selected symbol preview</h3>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="flex-shrink-0 w-[160px] h-[160px] uw:w-[220px] uw:h-[220px] bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                                        {selectedSymbol.spineAsset ? (
                                            <SpineSymbolPreview
                                                asset={selectedSymbol.spineAsset}
                                                width={160}
                                                height={160}
                                                idle={true}
                                                playWinRef={selectedSymbolPlayWinRef}
                                            />
                                        ) : selectedSymbol.imageUrl ? (
                                            <img
                                                src={selectedSymbol.imageUrl}
                                                alt={selectedSymbol.name}
                                                className="max-w-full max-h-full object-contain p-2"
                                            />
                                        ) : (
                                            <div className="text-gray-400 text-sm">No symbol</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm font-medium text-gray-700 uw:text-lg">{selectedSymbol.name} ({selectedSymbol.gameSymbolType})</span>
                                        {selectedSymbol.spineAsset && (
                                            <button
                                                type="button"
                                                onClick={() => selectedSymbolPlayWinRef.current?.()}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors uw:text-lg uw:px-4 uw:py-3"
                                            >
                                                <Play className="w-4 h-4 uw:w-5 uw:h-5" />
                                                Play animation
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                    {/* Extended Symbol Previews */}
                    {selectedSymbol && selectedSymbol.gameSymbolType && config?.theme?.presetSymbol?.[`${selectedSymbol.gameSymbolType}_extended`] && (
                        <div className="p-3 border-b border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Original Uncropped Preview */}
                                {config?.theme?.presetSymbol?.[`${selectedSymbol.gameSymbolType}_original`] && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                        <div className="px-4 py-2 border-b border-gray-200 border-l-4 border-l-green-500 bg-green-50">
                                            <h3 className="font-semibold text-gray-900 text-sm ">Not Cropped (1024x1536)</h3>
                                        </div>
                                        <div className="p-4 flex justify-center">
                                            <img
                                                src={config.theme.presetSymbol[`${selectedSymbol.gameSymbolType}_original`]}
                                                alt={`Original ${selectedSymbol.name}`}
                                                className="max-w-24 max-h-32  object-contain border border-gray-200 rounded"
                                            />
                                        </div>
                                    </div>
                                )}
                                {/* Cropped Preview */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="px-4 py-2 border-b border-gray-200 border-l-4 border-l-blue-500 bg-blue-50">
                                        <h3 className="font-semibold text-gray-900 text-sm">Cropped (1024x1024)</h3>
                                    </div>
                                    <div className="p-4 flex justify-center">
                                        <img
                                            src={config.theme.presetSymbol[`${selectedSymbol.gameSymbolType}_extended`]}
                                            alt={`Cropped ${selectedSymbol.name}`}
                                            className="max-w-24 max-h-24  object-contain border border-gray-200 rounded"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div style={{
                        flex: layoutMode === 'creation' ? '1' : '0 0 40%',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {/* Step 4 (Creation): Sections 1-4 only */}
                        {(layoutMode === 'creation' || layoutMode === 'full') && (
                            <>
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 uw:mb-8">
                                    <div className="px-4 py-3 uw:px-8 uw:py-6 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                                        <h3 className="font-semibold text-gray-900 uw:text-3xl">Symbol Type</h3>
                                    </div>
                                    <div className='flex items-center justify-center p-2 gap-10 uw:gap-16 uw:p-4'>
                                        <div>
                                            <label className="flex items-center gap-3 cursor-pointer uw:gap-6">
                                                <div className="relative w-5 h-5 uw:w-10 uw:h-10">
                                                    <input
                                                        type="radio"
                                                        checked={symbolType === 'block'}
                                                        onChange={() => setSymbolType('block')}
                                                        className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        style={{ accentColor: '#e60012' }}
                                                    />
                                                    <div className="w-full h-full rounded-full border border-gray-400 peer-checked:border-red-600"></div>
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-600 rounded-full opacity-0 peer-checked:opacity-100 uw:w-4 uw:h-4"></div>
                                                </div>
                                                <span className="text-sm uw:text-3xl">Block (full square)</span>
                                            </label>
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-3 cursor-pointer uw:gap-6">
                                                <div className="relative w-5 h-5 uw:w-10 uw:h-10">
                                                    <input
                                                        type="radio"
                                                        checked={symbolType === 'contour'}
                                                        onChange={() => setSymbolType('contour')}
                                                        className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    <div className="w-full h-full rounded-full border border-gray-400 peer-checked:border-red-600"></div>
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-600 rounded-full opacity-0 peer-checked:opacity-100 uw:w-4 uw:h-4"></div>
                                                </div>
                                                <span className="text-sm uw:text-3xl">Contour (custom shape)</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                {/* Selected Symbol Info Display */}
                                <div>
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                                        <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                                            <h3 className="font-semibold text-gray-900 uw:text-3xl">Selected Symbol Info</h3>
                                        </div>
                                        <div className='p-4'>
                                            {selectedSymbol ? (
                                                <div className="flex items-center justify-between p-3 uw:p-6 bg-gray-50 rounded-lg border">
                                                    <div className="flex items-center gap-3 uw:gap-6">
                                                        <div className="w-3 h-3 uw:w-6 uw:h-6 bg-blue-500 rounded-full"></div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 uw:text-3xl">
                                                                {selectedSymbol.name}
                                                            </div>
                                                            <div className="text-sm text-gray-600 uw:text-3xl">
                                                                Preset Type: {
                                                                    selectedSymbol.contentType === 'symbol-wild' ? 'Wild Symbol' :
                                                                        selectedSymbol.contentType === 'symbol-scatter' ? 'Scatter Symbol' :
                                                                            selectedSymbol.contentType === 'text-only' ? 'Text Only' :
                                                                                selectedSymbol.contentType === 'custom-text' ? 'Custom Text Symbol' :
                                                                                    selectedSymbol.contentType?.startsWith('symbol-') ? 'Symbol + Text' :
                                                                                        'Symbol Only'
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 bg-white px-2 py-1 uw:px-4 uw:py-2 uw:text-3xl rounded border">
                                                        {selectedSymbol.gameSymbolType?.toUpperCase() || 'SYMBOL'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center text-gray-500 py-4">
                                                    Select a symbol from the carousel above to see its type
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Content Type Override */}
                                <div>
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                                        <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                                            <h3 className="font-semibold text-gray-900 uw:text-3xl">Content Type Override</h3>
                                        </div>
                                        <div className='p-4'>
                                            <div className="mb-3 text-xs uw:text-3xl text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                                                💡 Override the content type for the selected symbol. This will change what gets generated.
                                                {selectedSymbol && contentType !== selectedSymbol.contentType && (
                                                    <div className="mt-1 text-orange-700 font-medium uw:text-3xl">
                                                        ⚠️ Override active: Will generate {contentType} instead of {selectedSymbol.contentType}
                                                    </div>
                                                )}
                                                {selectedSymbol && contentType === selectedSymbol.contentType && (
                                                    <div className="mt-1 uw:mt-2 text-green-700 font-medium uw:text-3xl">
                                                        ✅ Matches symbol's original type
                                                    </div>
                                                )}
                                            </div>
                                            <div className='grid grid-cols-2 gap-2 uw:gap-6'>
                                                <label className="flex items-center gap-3 cursor-pointer uw:gap-6">
                                                    <div className="relative w-5 h-5 uw:w-10 uw:h-10">
                                                        <input
                                                            type="radio"
                                                            checked={contentType === 'symbol-only'}
                                                            onChange={() => {
                                                                setContentType('symbol-only');
                                                                setHasManualOverride(true);
                                                            }}
                                                            className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            style={{ accentColor: '#e60012' }}
                                                        />
                                                        <div className="w-full h-full rounded-full border border-gray-400 peer-checked:border-red-600"></div>
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-600 rounded-full opacity-0 peer-checked:opacity-100 uw:w-4 uw:h-4"></div>
                                                    </div>
                                                    <span className="text-sm uw:text-3xl">Symbol Only</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer uw:gap-6">
                                                    <div className="relative w-5 h-5 uw:w-10 uw:h-10">
                                                        <input
                                                            type="radio"
                                                            checked={contentType === getSymbolSpecificContentType().contentType}
                                                            onChange={() => {
                                                                const symbolSpecific = getSymbolSpecificContentType();
                                                                const validContentTypes = ['symbol-only', 'symbol-wild', 'text-only', 'custom-text'] as const;
                                                                const newContentType = validContentTypes.includes(
                                                                    symbolSpecific.contentType as typeof validContentTypes[number]
                                                                )
                                                                    ? (symbolSpecific.contentType as typeof validContentTypes[number])
                                                                    : 'symbol-only';
                                                                setContentType(newContentType);
                                                                setHasManualOverride(true);
                                                            }}
                                                            className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            style={{ accentColor: '#e60012' }}
                                                        />
                                                        <div className="w-full h-full rounded-full border border-gray-400 peer-checked:border-red-600"></div>
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-600 rounded-full opacity-0 peer-checked:opacity-100 uw:w-4 uw:h-4"></div>
                                                    </div>
                                                    <span className="text-sm uw:text-3xl">{getSymbolSpecificContentType().label}</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer uw:gap-6">
                                                    <div className="relative w-5 h-5 uw:w-10 uw:h-10">
                                                        <input
                                                            type="radio"
                                                            checked={contentType === 'text-only'}
                                                            onChange={() => {
                                                                setContentType('text-only');
                                                                setHasManualOverride(true);
                                                            }}
                                                            className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            style={{ accentColor: '#e60012' }}
                                                        />
                                                        <div className="w-full h-full rounded-full border border-gray-400 peer-checked:border-red-600"></div>
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-600 rounded-full opacity-0 peer-checked:opacity-100 uw:w-4 uw:h-4"></div>
                                                    </div>
                                                    <span className="text-sm uw:text-3xl">Text Only</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer uw:gap-6">
                                                    <div className="relative w-5 h-5 uw:w-10 uw:h-10">
                                                        <input
                                                            type="radio"
                                                            checked={contentType === 'custom-text'}
                                                            onChange={() => {
                                                                setContentType('custom-text');
                                                                setHasManualOverride(true);
                                                            }}
                                                            className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            style={{ accentColor: '#e60012' }}
                                                        />
                                                        <div className="w-full h-full rounded-full border border-gray-400 peer-checked:border-red-600"></div>
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-600 rounded-full opacity-0 peer-checked:opacity-100 uw:w-4 uw:h-4"></div>
                                                    </div>
                                                    <span className="text-sm uw:text-3xl">Custom Text</span>
                                                </label>
                                            </div>
                                            {/* Custom Text Input Field */}
                                            {contentType === 'custom-text' && (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-md border">
                                                    <label className="block text-sm uw:text-3xl font-medium text-gray-700 mb-2">
                                                        Enter Custom Text (max 10 letters)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={customText}
                                                        onChange={(e) => {
                                                            const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                                                            if (value.length <= 10) {
                                                                setCustomText(value);
                                                            }
                                                        }}
                                                        placeholder="Enter text..."
                                                        maxLength={10}
                                                        className="uw:px-6  uw:placeholder:text-3xl uw:py-4 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                    />
                                                    <div className="text-xs text-gray-500 mt-1 uw:text-2xl uw:mt-2">
                                                        {customText.length}/10 characters
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                                        <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                                            <h3 className="font-semibold text-gray-900 uw:text-3xl">Grid Presets</h3>
                                        </div>
                                        <div className='flex items-center justify-center gap-4 uw:gap-8 py-4 uw:text-3xl uw:py-6'>
                                            {(['1x1', '1x3', '2x2', '3x3', '4x4'] as const).map(sizeOption => (
                                                <label key={sizeOption} className="flex items-center gap-3 cursor-pointer uw:gap-6">
                                                    <div className="relative w-5 h-5 uw:w-8 uw:h-8">
                                                        <input
                                                            type="radio"
                                                            checked={size === sizeOption}
                                                            onChange={() => setSize(sizeOption)}
                                                            className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            style={{ accentColor: '#e60012' }}
                                                        />
                                                        <div className="w-full h-full rounded-full border border-gray-400 peer-checked:border-red-600"></div>
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-600 rounded-full opacity-0 peer-checked:opacity-100 uw:w-4 uw:h-4"></div>
                                                    </div>
                                                    <span className="text-sm uw:text-3xl">{sizeOption}</span>
                                                </label>

                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {/* Layout Template - Hidden for symbol-only and text-only */}
                                {contentType !== 'symbol-only' && contentType !== 'text-only' && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                                        <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                                            <h3 className="font-semibold text-gray-900 uw:text-3xl">Layout Templates</h3>
                                        </div>
                                        <div
                                            className="text-gray-800 flex items-center justify-center uw:text-3xl mb-3 px-2 py-2 rounded"
                                        >
                                            💡 Choose how text and symbols are arranged in your symbol
                                        </div>

                                        <div className="flex flex-wrap gap-3 uw:gap-6 p-4 pt-0">
                                            {LAYOUT_TEMPLATES.map(template => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => applyLayoutTemplate(template.id)}
                                                    className={`
            flex items-center gap-2 cursor-pointer rounded-lg border 
            p-2 transition-all duration-200 text-left
            hover:shadow-md text-xs uw:text-2xl
            
            basis-[48%]   
            uw:basis-[30%]  
            
            ${selectedLayoutTemplate === template.id
                                                            ? 'border-red-400 bg-red-50 shadow-lg ring-2 ring-red-200'
                                                            : 'border-gray-200 bg-white hover:border-red-200'
                                                        }
          `}
                                                >
                                                    <span className="text-xs uw:text-3xl">{template.icon}</span>

                                                    <div>
                                                        <div className="font-medium text-gray-700 uw:text-3xl">
                                                            {template.name}
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 uw:text-xl">
                                                            {template.description}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                                    <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                                        <h3 className="font-semibold text-gray-900 uw:text-3xl">Symbol Prompt</h3>
                                    </div>
                                    <div className="p-4">
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="Describe the symbol you want to create..."
                                            className="
    w-full h-24 p-3 uw:p-6 uw:h-48 
    border border-gray-300 rounded-md resize-none
    text-sm uw:text-3xl
    placeholder:text-gray-400 placeholder:text-sm uw:placeholder:text-3xl
  "
                                        />

                                        <div>

                                        </div>
                                        <div className='flex items-center justify-between gap-3'>
                                            <Button
                                                variant="generate"
                                                onClick={handleGenerateSymbol}
                                                className="
    w-full
    flex items-center justify-center
    text-sm  
    py-3 
    gap-2 
    rounded-lg
  "
                                                disabled={isGenerating || !prompt.trim()}
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <Loader className="w-6 h-6 uw:w-12 uw:h-12 animate-spin" />
                                                        <span className="uw:text-3xl">Generating...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-6 h-6 uw:w-12 uw:h-12" />
                                                        <span className="uw:text-3xl">Generate</span>
                                                    </>
                                                )}
                                            </Button>


                                            <div
                                                className="
    flex items-center justify-center 
    border border-gray-300 
    hover:bg-gray-100 
    bg-white 
    rounded-md 
    transition-colors 
    w-full
    p-2 uw:p-4
  "
                                            >
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleUploadSymbol}
                                                    className="hidden"
                                                    id="symbol-upload"
                                                    disabled={isProcessing || !selectedSymbol}
                                                />

                                                <label
                                                    htmlFor="symbol-upload"
                                                    className="
      w-full 
      flex items-center justify-center 
      cursor-pointer 
      p-1 uw:py-5
      text-sm uw:text-3xl
      gap-2 uw:gap-6
    "
                                                >
                                                    <Upload
                                                        size={16}
                                                        className="w-4 h-4 uw:w-10 uw:h-10"
                                                    />

                                                    {isProcessing ? (
                                                        <span className="uw:text-3xl">Processing...</span>
                                                    ) : (
                                                        <span className="uw:text-3xl">Choose Image File</span>
                                                    )}
                                                </label>
                                            </div>

                                            <div
                                                className="
    flex items-center justify-center 
    border border-gray-300 
    hover:bg-gray-100 
    bg-white 
    rounded-md 
    transition-colors 
    w-full
    p-2 uw:p-4
  "
                                            >
                                                <input
                                                    ref={spineSymbolZipInputRef}
                                                    type="file"
                                                    accept=".zip"
                                                    onChange={handleSpineSymbolZipUpload}
                                                    className="hidden"
                                                    id="symbol-spine-upload"
                                                    disabled={isProcessing || !selectedSymbol}
                                                />
                                                <label
                                                    htmlFor="symbol-spine-upload"
                                                    className="w-full flex items-center justify-center cursor-pointer p-1 uw:py-5 text-sm uw:text-3xl gap-2 uw:gap-6"
                                                >
                                                    <FileArchive size={16} className="w-4 h-4 uw:w-10 uw:h-10" />
                                                    <span className="uw:text-3xl">Upload Animated (ZIP)</span>
                                                </label>
                                            </div>

                                        </div>

                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Step5_SymbolGenerationNe;