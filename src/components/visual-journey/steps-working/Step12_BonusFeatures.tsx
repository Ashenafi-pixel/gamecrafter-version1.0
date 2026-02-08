import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../../store';
import { Gift, Coins, Zap, AlertCircle, Plus, Minus, RotateCw, RefreshCw, Loader, Sparkles, Upload } from 'lucide-react';
import { Button } from '../../Button';
import BonusSymbolCarousel from '../../Step12_BonusFeatures/Symbol_carousel';
import { SymbolConfig } from '../../../types/EnhancedAnimationLabStep4';
import { enhancedOpenaiClient } from '../../../utils/enhancedOpenaiClient';
import { saveImage } from '../../../utils/imageSaver';
import { useWarningPopup } from '../../popups';
import './BonusConfirmation.css';


interface FreespinTransition {
  style: 'fade' | 'slide' | 'zoom' | 'dissolve';
  duration: number;
}
const BONUS_SYMBOL_PRESETS = [
  {
    type: 'bonus' as const,
    name: 'Bonus',
    description: 'Bonus game trigger symbol',
    importance: 5,
    rarity: 'epic' as const,
    weight: 2,
    enabled: true,
    defaultPrompt: 'treasure chest'
  },
  {
    type: 'scatter' as const,
    name: 'Scatter',
    description: 'Free spins trigger symbol',
    importance: 5,
    rarity: 'epic' as const,
    weight: 2,
    enabled: true,
    defaultPrompt: 'Gem'
  },
  {
    type: 'jackpot' as const,
    name: 'Jackpot',
    description: 'Jackpot trigger symbol',
    importance: 5,
    rarity: 'legendary' as const,
    weight: 1,
    enabled: false,
    defaultPrompt: 'diamond crown'
  },
  {
    type: 'holdspin' as const,
    name: 'HoldSpin',
    description: 'Hold and spin trigger symbol',
    importance: 5,
    rarity: 'epic' as const,
    weight: 2,
    enabled: true,
    defaultPrompt: 'golden coin'
  }
];

export const BonusFeatures: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const { bonus } = config;
  const { showWarning } = useWarningPopup()
  const gameId = config?.gameId || config?.displayName || 'default';

  // Track expanded features
  const [mathModel, setMathModel] = useState({
    featureRTP: 0,
    hitFrequency: 0,
    maxWin: 0
  });

  // Bonus Symbol Generation State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [bonusSymbols, setBonusSymbols] = useState<SymbolConfig[]>([]);
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [contentType, setContentType] = useState<'symbol-bonus' | 'symbol-scatter' | 'text-only' | 'custom-text'>('symbol-bonus');
  const [customText, setCustomText] = useState('');
  const [selectedLayoutTemplate, setSelectedLayoutTemplate] = useState<'text-top' | 'text-bottom' | 'text-overlay'>('text-bottom');

  // Freespin Transition State
  const [freespinTransition, setFreespinTransition] = useState<FreespinTransition>({
    style: (config as any)?.freespinTransition?.style || 'fade',
    duration: (config as any)?.freespinTransition?.duration || 2.0
  });

  // Track preview states separately for each feature
  const [previewStates, setPreviewStates] = useState({
    wheel: false,
    pickAndClick: false,
    holdAndSpin: false
  });
  const [showFeatureLimitModal, setShowFeatureLimitModal] = useState(false);
  const [showPickClickConfirmation, setShowPickClickConfirmation] = useState(false);
  const getSymbolSpecificContentType = () => {
    if (!selectedSymbol) return { contentType: 'symbol-bonus', label: 'Symbol + Bonus (5 letters)' };

    const symbolType = selectedSymbol.gameSymbolType?.toLowerCase() || 'bonus';

    if (symbolType.includes('bonus')) {
      return { contentType: 'symbol-bonus', label: 'Symbol + Bonus (5 letters)' };
    } else if (symbolType.includes('scatter')) {
      return { contentType: 'symbol-scatter', label: 'Symbol + Scatter (7 letters)' };
    } else if (symbolType.includes('jackpot')) {
      return { contentType: 'symbol-jackpot', label: 'Symbol + Jackpot (7 letters)' };
    } else if (symbolType.includes('free')) {
      return { contentType: 'symbol-free', label: 'Symbol + Free (4 letters)' };
    } else {
      // For other symbol types, use the symbol type name
      const symbolName = symbolType.charAt(0).toUpperCase() + symbolType.slice(1);
      return { contentType: `symbol-${symbolType}`, label: `Symbol + ${symbolName} text` };
    }
  };

  // Reference for setting which preview is actively displayed (for UI purposes)
  const [activePreview, setActivePreview] = useState<string | null>(null);

  const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
  const holdSpinCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    initializeBonusSymbols();
  }, [config?.theme?.generated?.bonusSymbols, config?.theme?.generated?.symbols]);

  useEffect(() => {
    const savedTransition = (config as any)?.freespinTransition;
    if (savedTransition) {
      setFreespinTransition(prev => {
        // Only update if different to avoid unnecessary re-renders
        if (prev.style !== savedTransition.style || prev.duration !== savedTransition.duration) {
          return savedTransition;
        }
        return prev;
      });
    }
  }, [(config as any)?.freespinTransition?.style, (config as any)?.freespinTransition?.duration]);

  const initializeBonusSymbols = useCallback(() => {
    const existingSymbols = config?.theme?.generated?.symbols || {};
    const initializedSymbols: SymbolConfig[] = [];

    BONUS_SYMBOL_PRESETS.forEach((preset) => {
      // All bonus symbols now stored in unified symbols config
      const existingImageUrl = existingSymbols[preset.type];

      const bonusSymbol: SymbolConfig = {
        id: `bonus_${preset.type}`,
        name: preset.name,
        symbolType: 'block',
        contentType: `symbol-${preset.type}` as any,
        bonusContentType: `symbol-${preset.type}` as any,
        size: '1x1',
        prompt: preset.defaultPrompt,
        animationComplexity: 'complex',
        gameSymbolType: preset.type,
        importance: preset.importance,
        rarity: preset.rarity,
        defaultDescription: preset.description,
        imageUrl: existingImageUrl || undefined,
        isGenerated: !!existingImageUrl,
        retryCount: 0
      };

      initializedSymbols.push(bonusSymbol);
    });
    setBonusSymbols(initializedSymbols);

    const enabledSymbols = initializedSymbols.filter(s =>
      BONUS_SYMBOL_PRESETS.find(p => p.type === s.gameSymbolType)?.enabled
    );

    if (enabledSymbols.length > 0) {
      // If no symbol is currently selected or current selection is invalid, select first available
      const currentSelected = initializedSymbols.find(s => s.id === selectedSymbolId);
      if (!currentSelected) {
        const symbolToSelect = enabledSymbols.find(s => s.isGenerated) || enabledSymbols[0];
        setSelectedSymbolId(symbolToSelect.id);
        setPrompt(symbolToSelect.prompt);
        setContentType(`symbol-${symbolToSelect.gameSymbolType}` as any);
      }
    }
  }, [config?.theme?.generated?.symbols, selectedSymbolId]);

  const generateEnhancedPrompt = useCallback((basePrompt: string, symbolContentType: string) => {
    let enhancedPrompt = 'Professional slot machine symbol design: ';

    enhancedPrompt += `${basePrompt.trim()}, `;

    enhancedPrompt += 'high-quality digital art, vibrant colors, clean design, ';
    enhancedPrompt += 'professional game asset, transparent background, ';
    enhancedPrompt += 'detailed shading and highlights, premium casino style, ';
    if (symbolContentType === 'custom-text') {
      const customTextValue = customText || 'TEXT';
      const letters = customTextValue.split('');
      enhancedPrompt += `with ${customTextValue} text integrated into design, vibrant effects, `;

      if (selectedLayoutTemplate === 'text-top') {
        enhancedPrompt += `LAYOUT: ${letters.length} letters ${letters.join('-')} arranged horizontally at top + main symbol below, `;
      } else if (selectedLayoutTemplate === 'text-overlay') {
        enhancedPrompt += `LAYOUT: Main symbol as background + ${letters.length} letters ${letters.join('-')} overlaid on center, `;
      } else {
        enhancedPrompt += `LAYOUT: Main symbol in center + ${letters.length} letters ${letters.join('-')} arranged horizontally below, `;
      }
      enhancedPrompt += 'SPACING: Large gaps between each element for easy separation, ';

    } else if (symbolContentType === 'text-only') {
      const textWord = customText || 'FREE';
      enhancedPrompt += `large ${textWord} text only, bold letters, premium typography, `;
    } else if (symbolContentType.startsWith('symbol-')) {
      const symbolTypeText = symbolContentType.replace('symbol-', '').toUpperCase();
      let textWord = symbolTypeText;
      let letters = symbolTypeText.split('');
      let effectType = 'vibrant effects';
      if (symbolTypeText === 'BONUS') {
        effectType = 'golden effects';
        letters = ['B', 'O', 'N', 'U', 'S'];
      } else if (symbolTypeText === 'SCATTER') {
        effectType = 'magical sparkles';
        letters = ['S', 'C', 'A', 'T', 'T', 'E', 'R'];
      } else if (symbolTypeText === 'JACKPOT') {
        effectType = 'diamond sparkles';
        letters = ['J', 'A', 'C', 'K', 'P', 'O', 'T'];
      } else if (symbolTypeText === 'FREE') {
        effectType = 'bright glowing effects';
        letters = ['F', 'R', 'E', 'E'];
      }

      enhancedPrompt += `with ${textWord} text integrated into design, ${effectType}, `;
      if (selectedLayoutTemplate === 'text-top') {
        enhancedPrompt += `LAYOUT: ${letters.length} letters ${letters.join('-')} arranged horizontally at top + main symbol below, `;
      } else if (selectedLayoutTemplate === 'text-overlay') {
        enhancedPrompt += `LAYOUT: Main symbol as background + ${letters.length} letters ${letters.join('-')} overlaid on center, `;
      } else { // text-bottom (default)
        enhancedPrompt += `LAYOUT: Main symbol in center + ${letters.length} letters ${letters.join('-')} arranged horizontally below, `;
      }
      enhancedPrompt += 'SPACING: Large gaps between each element for easy separation, ';

    }

    enhancedPrompt += 'isolated elements that can be easily cut out, no overlapping parts.';

    return enhancedPrompt;
  }, [selectedLayoutTemplate, customText]);

  const selectedSymbol = bonusSymbols.find(symbol => symbol.id === selectedSymbolId) || bonusSymbols[0];
  const saveBonusSymbolsToGameStore = useCallback((symbolsToSave: SymbolConfig[]) => {
    const allSymbols: Record<string, string> = {};

    symbolsToSave.forEach(symbol => {
      if (symbol.imageUrl && symbol.gameSymbolType) {
        allSymbols[symbol.gameSymbolType] = symbol.imageUrl;
      }
    });

    const currentTheme = config?.theme || {};
    const currentGenerated = currentTheme.generated || {};

    updateConfig({
      theme: {
        ...currentTheme,
        generated: {
          ...currentGenerated,
          symbols: {
            ...currentGenerated.symbols,
            ...allSymbols
          }
        }
      }
    });
  }, [config?.theme, updateConfig]);

  // Generate bonus symbol using OpenAI
  const handleGenerateSymbol = useCallback(async () => {
    if (!selectedSymbol || !prompt.trim()) {
      console.warn('⚠️ No symbol selected or prompt is empty');
      return;
    }
    setIsGenerating(true);

    try {
      const enhancedPrompt = generateEnhancedPrompt(prompt.trim(), contentType);
      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: enhancedPrompt,
        targetSymbolId: selectedSymbol.id,
        gameId: gameId,
        count: 1
      });

      if (result.success && result.images && result.images.length > 0) {
        const imageUrl = result.images[0];
        // Save the image
        const savedImageResult = await saveImage(
          imageUrl,
          `bonus_${selectedSymbol.gameSymbolType}`,
          selectedSymbol.id,
          gameId
        );

        // Update the symbol with the new image
        const updatedSymbols = bonusSymbols.map(symbol =>
          symbol.id === selectedSymbol.id
            ? { ...symbol, imageUrl: savedImageResult.filePath, retryCount: 0 }
            : symbol
        );

        setBonusSymbols(updatedSymbols);
        saveBonusSymbolsToGameStore(updatedSymbols);
        setTimeout(() => {
          // Get latest config from store after save
          const latestConfig = useGameStore.getState().config;
          const latestSymbols = latestConfig?.theme?.generated?.symbols || {};
          window.dispatchEvent(new CustomEvent('symbolsChanged', {
            detail: {
              symbols: Object.values(latestSymbols).filter((url): url is string => typeof url === 'string' && url !== ''),
              symbolKey: selectedSymbol.gameSymbolType,
              symbolUrl: savedImageResult.filePath,
              gameId: gameId,
              source: 'bonus-features',
              forceRefresh: true,
              timestamp: Date.now()
            }
          }));
        }, 100);

        // Also dispatch bonusSymbolsChanged for backward compatibility
        window.dispatchEvent(new CustomEvent('bonusSymbolsChanged', {
          detail: {
            symbols: updatedSymbols.filter(s => s.imageUrl).map(s => s.imageUrl),
            gameId: gameId,
            source: 'bonus-features',
            timestamp: Date.now()
          }
        }));

        // Show success notification
        if (typeof window !== 'undefined' && (window as any).showToast) {
          (window as any).showToast(`${selectedSymbol.name} symbol generated successfully!`, 'success');
        }
      } else {
        throw new Error(result.error || 'No image returned from generation');
      }
    } catch (error) {
      console.error('❌ Error generating bonus symbol:', error);

      // Update retry count
      const updatedSymbols = bonusSymbols.map(symbol =>
        symbol.id === selectedSymbol.id
          ? { ...symbol, retryCount: (symbol.retryCount || 0) + 1 }
          : symbol
      );
      setBonusSymbols(updatedSymbols);

      // Show error notification
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast(`Failed to generate ${selectedSymbol.name} symbol. Please try again.`, 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [selectedSymbol, prompt, contentType, customText, bonusSymbols, saveBonusSymbolsToGameStore, generateEnhancedPrompt]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedSymbol) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;

        // Save the uploaded image
        const savedImageResult = await saveImage(
          imageUrl,
          `bonus_${selectedSymbol.gameSymbolType}`,
          selectedSymbol.id,
          gameId
        );

        // Update the symbol with the uploaded image
        const updatedSymbols = bonusSymbols.map(symbol =>
          symbol.id === selectedSymbol.id
            ? { ...symbol, imageUrl: savedImageResult.filePath, retryCount: 0 }
            : symbol
        );

        setBonusSymbols(updatedSymbols);
        saveBonusSymbolsToGameStore(updatedSymbols);
        setTimeout(() => {
          // Get latest config from store after save
          const latestConfig = useGameStore.getState().config;
          const latestSymbols = latestConfig?.theme?.generated?.symbols || {};
          window.dispatchEvent(new CustomEvent('symbolsChanged', {
            detail: {
              symbols: Object.values(latestSymbols).filter((url): url is string => typeof url === 'string' && url !== ''),
              symbolKey: selectedSymbol.gameSymbolType,
              symbolUrl: savedImageResult.filePath,
              gameId: gameId,
              source: 'bonus-features-upload',
              forceRefresh: true,
              timestamp: Date.now()
            }
          }));
        }, 100);

        // Also dispatch bonusSymbolsChanged for backward compatibility
        window.dispatchEvent(new CustomEvent('bonusSymbolsChanged', {
          detail: {
            symbols: updatedSymbols.filter(s => s.imageUrl).map(s => s.imageUrl),
            gameId: gameId,
            source: 'bonus-features',
            timestamp: Date.now()
          }
        }));

        if (typeof window !== 'undefined' && (window as any).showToast) {
          (window as any).showToast(`${selectedSymbol.name} symbol uploaded successfully!`, 'success');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ Error uploading symbol:', error);
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast(`Failed to upload ${selectedSymbol.name} symbol.`, 'error');
      }
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  }, [selectedSymbol, bonusSymbols, saveBonusSymbolsToGameStore, gameId]);

  // Handle symbol selection
  const handleSymbolSelection = useCallback((symbolId: string) => {
    setSelectedSymbolId(symbolId);
    const symbol = bonusSymbols.find(s => s.id === symbolId);
    if (symbol) {
      setPrompt(symbol.prompt);
    }
  }, [bonusSymbols]);
  const handlePromptChange = useCallback((newPrompt: string) => {
    setPrompt(newPrompt);

    // Update the selected symbol's prompt
    if (selectedSymbol) {
      const updatedSymbols = bonusSymbols.map(symbol =>
        symbol.id === selectedSymbol.id
          ? { ...symbol, prompt: newPrompt }
          : symbol
      );
      setBonusSymbols(updatedSymbols);
    }
  }, [selectedSymbol, bonusSymbols]);

  // Freespin Transition Handlers
  const updateTransitionStyle = (style: FreespinTransition['style']) => {
    const newTransition = { ...freespinTransition, style };
    setFreespinTransition(newTransition);

    // Save to config
    updateConfig({
      freespinTransition: newTransition
    } as any);
  };

  const updateTransitionDuration = (duration: number) => {
    const newTransition = { ...freespinTransition, duration };
    setFreespinTransition(newTransition);
    updateConfig({
      freespinTransition: newTransition
    } as any);
  };
  // Function to draw wheel bonus preview
  const drawWheel = (segmentCount: number, hasLevelUp: boolean, hasRespin: boolean) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.45;
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    // Draw outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = '#F8C630';
    ctx.fill();

    // Define segment colors
    const colors = [
      '#EF5350', '#42A5F5', '#66BB6A', '#FFA726',
      '#8D6E63', '#26A69A', '#EC407A', '#7E57C2',
      '#5C6BC0', '#FFB74D', '#9CCC65', '#4DD0E1'
    ];

    // Define segment types - use user-defined values
    let segments: { type: string, value: number }[] = [];
    const segmentValues = bonus?.wheel?.segmentValues || [];

    // Create segments array with user-defined values
    for (let i = 0; i < segmentCount; i++) {
      // Add some level up and respin segments if enabled
      if (hasLevelUp && i === 2) {
        segments.push({ type: 'levelup', value: 0 });
      } else if (hasRespin && i === 5) {
        segments.push({ type: 'respin', value: 0 });
      } else {
        // Use user-defined value or default to 50
        const value = segmentValues[i] || 50;
        segments.push({ type: 'prize', value });
      }
    }

    // Draw wheel segments
    const anglePerSegment = (Math.PI * 2) / segmentCount;
    for (let i = 0; i < segmentCount; i++) {
      const startAngle = i * anglePerSegment;
      const endAngle = (i + 1) * anglePerSegment;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Coloring based on segment type
      if (segments[i].type === 'levelup') {
        ctx.fillStyle = '#FFD700';
      } else if (segments[i].type === 'respin') {
        ctx.fillStyle = '#D1C4E9';
      } else {
        ctx.fillStyle = colors[i % colors.length];
      }
      ctx.fill();
      // Add stroke
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      // Draw segment text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSegment / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#FFFFFF';

      // Different text based on segment type
      if (segments[i].type === 'levelup') {
        ctx.fillText('LEVEL UP', radius * 0.7, 0);
      } else if (segments[i].type === 'respin') {
        ctx.fillText('RESPIN', radius * 0.7, 0);
      } else {
        ctx.fillText(`${segments[i].value}x`, radius * 0.7, 0);
      }
      ctx.restore();
    }

    // Draw inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#F8C630';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 20);
    ctx.lineTo(centerX - 15, centerY - radius + 5);
    ctx.lineTo(centerX + 15, centerY - radius + 5);
    ctx.closePath();
    ctx.fillStyle = '#E53935';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
  };

  // Helper function to ensure proper bonus config defaults
  const ensureBonusDefaults = (featureType: string, updates: any) => {
    const currentBonus = config.bonus || {};

    switch (featureType) {
      case 'freeSpins':
        return {
          enabled: currentBonus.freeSpins?.enabled ?? true,
          count: currentBonus.freeSpins?.count ?? 10,
          triggers: currentBonus.freeSpins?.triggers ?? [3],
          multipliers: currentBonus.freeSpins?.multipliers ?? [1],
          retriggers: currentBonus.freeSpins?.retriggers ?? true,
          ...updates
        };
      case 'pickAndClick':
        return {
          enabled: currentBonus.pickAndClick?.enabled ?? true,
          gridSize: (currentBonus.pickAndClick?.gridSize ?? [3, 3]) as [number, number],
          picks: currentBonus.pickAndClick?.picks ?? 3,
          maxPrize: currentBonus.pickAndClick?.maxPrize ?? 100,
          prizeValues: currentBonus.pickAndClick?.prizeValues ?? [],
          extraPicks: currentBonus.pickAndClick?.extraPicks ?? false,
          multipliers: currentBonus.pickAndClick?.multipliers ?? false,
          ...updates
        };
      case 'wheel':
        return {
          enabled: currentBonus.wheel?.enabled ?? true,
          segments: currentBonus.wheel?.segments ?? 8,
          maxMultiplier: currentBonus.wheel?.maxMultiplier ?? 50,
          segmentValues: currentBonus.wheel?.segmentValues ?? [],
          levelUp: currentBonus.wheel?.levelUp ?? false,
          respin: currentBonus.wheel?.respin ?? false,
          ...updates
        };
      case 'holdAndSpin':
        return {
          enabled: currentBonus.holdAndSpin?.enabled ?? true,
          gridSize: (currentBonus.holdAndSpin?.gridSize ?? [3, 3]) as [number, number],
          initialRespins: currentBonus.holdAndSpin?.initialRespins ?? 3,
          maxSymbolValue: currentBonus.holdAndSpin?.maxSymbolValue ?? 100,
          resetRespins: currentBonus.holdAndSpin?.resetRespins ?? true,
          collectAll: currentBonus.holdAndSpin?.collectAll ?? false,
          ...updates
        };
      case 'jackpots':
        return {
          enabled: currentBonus.jackpots?.enabled ?? true,
          type: currentBonus.jackpots?.type ?? 'fixed',
          levels: currentBonus.jackpots?.levels ?? ['Mini', 'Minor', 'Major', 'Grand'],
          trigger: currentBonus.jackpots?.trigger ?? 'random',
          values: currentBonus.jackpots?.values ?? { Mini: 10, Minor: 50, Major: 250, Grand: 1000 },
          ...updates
        };
      default:
        return updates;
    }
  };

  // Function to render Pick & Click grid preview
  const renderPickAndClickGrid = () => {
    const gridSize = bonus?.pickAndClick?.gridSize || [3, 3];
    const picks = bonus?.pickAndClick?.picks || 3;
    const prizeValues = bonus?.pickAndClick?.prizeValues || [];
    const hasMultipliers = !!bonus?.pickAndClick?.multipliers;
    const hasExtraPicks = !!bonus?.pickAndClick?.extraPicks;
    const rows = gridSize[0];
    const cols = gridSize[1];
    // Create grid with different symbol types
    const grid = Array(rows).fill(0).map(() => Array(cols).fill(null));

    // Randomly distribute different cell types
    let remainingPrizes = [];

    // Use user-defined prize values
    for (let i = 0; i < rows * cols; i++) {
      const value = prizeValues[i] || 100;
      remainingPrizes.push({ type: 'prize', value });
    }
    // Add special symbols if enabled
    if (hasExtraPicks) {
      const extraPickIndex = Math.floor(Math.random() * remainingPrizes.length);
      remainingPrizes[extraPickIndex] = { type: 'extraPick', value: 0 };
    }

    if (hasMultipliers) {
      const multiplierIndex = Math.floor(Math.random() * remainingPrizes.length);
      if (multiplierIndex !== remainingPrizes.findIndex(p => p.type === 'extraPick')) {
        remainingPrizes[multiplierIndex] = { type: 'multiplier', value: [2, 3, 5][Math.floor(Math.random() * 3)] };
      }
    }

    let prizeIndex = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (prizeIndex < remainingPrizes.length) {
          grid[r][c] = remainingPrizes[prizeIndex];
          prizeIndex++;
        }
      }
    }

    // Simulate already opened cells
    const revealedCells = Array(rows).fill(0).map(() => Array(cols).fill(false));
    const openedCount = Math.min(picks, 4);

    // Randomly open a few cells
    for (let i = 0; i < openedCount; i++) {
      let r, c;
      do {
        r = Math.floor(Math.random() * rows);
        c = Math.floor(Math.random() * cols);
      } while (revealedCells[r][c]);
      revealedCells[r][c] = true;
    }

    return { grid, revealedCells, picks, totalPicks: picks };
  };

  const isFeatureEnabled = (feature: string) => {
    switch (feature) {
      case 'freeSpins':
        return bonus?.freeSpins?.enabled || false;
      case 'pickAndClick':
        return bonus?.pickAndClick?.enabled || false;
      case 'wheel':
        return bonus?.wheel?.enabled || false;
      case 'holdAndSpin':
        return bonus?.holdAndSpin?.enabled || false;
      case 'jackpots':
        return bonus?.jackpots?.enabled || false;
      default:
        return false;
    }
  };
  // Add this useEffect to sync contentType with selected symbol
  useEffect(() => {
    if (selectedSymbol) {
      const symbolSpecificContent = getSymbolSpecificContentType();
      setContentType(symbolSpecificContent.contentType as any);
    }
  }, [selectedSymbolId, selectedSymbol]);
  useEffect(() => {
    if (config.bonus?.holdAndSpin?.enabled && config.bonus?.holdAndSpin?.resetRespins === false) {
      updateConfig({
        bonus: {
          ...config.bonus,
          holdAndSpin: {
            ...config.bonus.holdAndSpin,
            resetRespins: true
          }
        }
      });
    }
  }, [config.bonus?.holdAndSpin?.enabled, config.bonus?.holdAndSpin?.resetRespins]);

  // Helper function to check if a specific symbol type is generated
  const hasSymbolType = (symbolType: 'bonus' | 'scatter' | 'jackpot' | 'holdspin'): boolean => {
    const existingSymbols = config?.theme?.generated?.symbols || {};
    const symbolUrl = existingSymbols[symbolType];
    return !!(symbolUrl && symbolUrl.length > 0);
  };

  // Helper function to check if a specific feature can be enabled based on required symbol
  const canEnableSpecificFeature = (featureType: string): { canEnable: boolean; requiredSymbol: string; symbolName: string } => {
    switch (featureType) {
      case 'freeSpins':
        return {
          canEnable: hasSymbolType('scatter'),
          requiredSymbol: 'scatter',
          symbolName: 'Scatter'
        };
      case 'holdAndSpin':
        return {
          canEnable: hasSymbolType('holdspin'),
          requiredSymbol: 'holdspin',
          symbolName: 'HoldSpin'
        };
      case 'pickAndClick':
        return {
          canEnable: hasSymbolType('bonus'),
          requiredSymbol: 'bonus',
          symbolName: 'Bonus'
        };
      case 'wheel':
        return {
          canEnable: hasSymbolType('bonus'),
          requiredSymbol: 'bonus',
          symbolName: 'Bonus'
        };
      case 'jackpots':
        return {
          canEnable: hasSymbolType('bonus'),
          requiredSymbol: 'bonus',
          symbolName: 'Bonus'
        };
      default:
        return {
          canEnable: false,
          requiredSymbol: 'unknown',
          symbolName: 'Unknown'
        };
    }
  };

  const updatePreviewState = (feature: string, value: boolean) => {
    if (feature === 'wheel' || feature === 'pickAndClick' || feature === 'holdAndSpin') {
      setPreviewStates(prev => ({
        ...prev,
        [feature]: value
      }));

      if (value) {
        setActivePreview(feature);
      }
    }
  };

  const toggleFeatureEnabled = (feature: string) => {
    const currentBonus = config.bonus || {};

    // Check if trying to enable a feature without the required specific symbol
    if (!isFeatureEnabled(feature)) {
      const featureValidation = canEnableSpecificFeature(feature);
      if (!featureValidation.canEnable) {
        showWarning('Enable this symbole ', `Please generate the ${featureValidation.symbolName} symbol to enable this feature.`);
        return;
      }

      // Check if already have 3 features enabled
      const enabledFeatures = ['freeSpins', 'pickAndClick', 'wheel', 'holdAndSpin', 'jackpots']
        .filter(f => isFeatureEnabled(f));

      if (enabledFeatures.length >= 3) {
        setShowFeatureLimitModal(true);
        return;
      }
    }

    switch (feature) {
      case 'freeSpins':
        updateConfig({
          bonus: {
            ...currentBonus,
            freeSpins: {
              enabled: !isFeatureEnabled(feature),
              count: currentBonus.freeSpins?.count || 10,
              triggers: currentBonus.freeSpins?.triggers || [3],
              multipliers: currentBonus.freeSpins?.multipliers || [1],
              retriggers: currentBonus.freeSpins?.retriggers || true
            }
          }
        });
        break;
      case 'pickAndClick':
        updateConfig({
          bonus: {
            ...currentBonus,
            pickAndClick: {
              enabled: !isFeatureEnabled(feature),
              gridSize: (currentBonus.pickAndClick?.gridSize || [3, 3]) as [number, number],
              picks: currentBonus.pickAndClick?.picks || 3,
              maxPrize: currentBonus.pickAndClick?.maxPrize || 100,
              extraPicks: currentBonus.pickAndClick?.extraPicks || false,
              multipliers: currentBonus.pickAndClick?.multipliers || false
            }
          }
        });
        break;
      case 'wheel':
        updateConfig({
          bonus: {
            ...currentBonus,
            wheel: {
              enabled: !isFeatureEnabled(feature),
              segments: currentBonus.wheel?.segments || 8,
              maxMultiplier: currentBonus.wheel?.maxMultiplier || 50,
              levelUp: currentBonus.wheel?.levelUp || false,
              respin: currentBonus.wheel?.respin || false
            }
          }
        });
        break;
      case 'holdAndSpin':
        updateConfig({
          bonus: {
            ...currentBonus,
            holdAndSpin: {
              enabled: !isFeatureEnabled(feature),
              gridSize: (currentBonus.holdAndSpin?.gridSize || [3, 3]) as [number, number],
              initialRespins: currentBonus.holdAndSpin?.initialRespins || 3,
              maxSymbolValue: currentBonus.holdAndSpin?.maxSymbolValue || 100,
              resetRespins: currentBonus.holdAndSpin?.resetRespins !== false ? true : currentBonus.holdAndSpin.resetRespins,
              collectAll: currentBonus.holdAndSpin?.collectAll || false
            }
          }
        });
        break;
      case 'jackpots':
        updateConfig({
          bonus: {
            ...currentBonus,
            jackpots: {
              enabled: !isFeatureEnabled(feature),
              type: currentBonus.jackpots?.type || 'fixed',
              levels: currentBonus.jackpots?.levels || ['Mini', 'Minor', 'Major', 'Grand'],
              trigger: currentBonus.jackpots?.trigger || 'random',
              values: currentBonus.jackpots?.values || { Mini: 10, Minor: 50, Major: 250, Grand: 1000 }
            }
          }
        });
        break;
    }

    // When enabling a feature, automatically show its preview
    if (!isFeatureEnabled(feature)) {
      if (feature === 'wheel' || feature === 'pickAndClick' || feature === 'holdAndSpin') {
        updatePreviewState(feature, true);
      }
    }
  };

  // Initialize preview states based on enabled features
  useEffect(() => {
    setPreviewStates({
      wheel: isFeatureEnabled('wheel'),
      pickAndClick: isFeatureEnabled('pickAndClick'),
      holdAndSpin: isFeatureEnabled('holdAndSpin')
    });

    // Set active preview to the first enabled feature
    if (isFeatureEnabled('wheel')) {
      setActivePreview('wheel');
    } else if (isFeatureEnabled('pickAndClick')) {
      setActivePreview('pickAndClick');
    } else if (isFeatureEnabled('holdAndSpin')) {
      setActivePreview('holdAndSpin');
    }
  }, []);

  // Render wheel preview when wheel state is active
  useEffect(() => {
    if (previewStates.wheel && isFeatureEnabled('wheel') && bonus?.wheel?.enabled) {
      const segmentCount = bonus?.wheel?.segments || 8;
      const hasLevelUp = !!bonus?.wheel?.levelUp;
      const hasRespin = !!bonus?.wheel?.respin;
      drawWheel(segmentCount, hasLevelUp, hasRespin);
    }
  }, [previewStates.wheel, bonus?.wheel?.segments, bonus?.wheel?.levelUp, bonus?.wheel?.respin, bonus?.wheel?.enabled, bonus?.wheel?.segmentValues]);

  // Function to draw Hold & Spin preview
  const drawHoldAndSpin = () => {
    const canvas = holdSpinCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#0F1423';
    ctx.fillRect(0, 0, width, height);

    // Get grid size
    const gridSize = bonus?.holdAndSpin?.gridSize || [3, 3];
    const rows = gridSize[0];
    const cols = gridSize[1];

    // Calculate cell size
    const padding = 20;
    const cellWidth = (width - padding * 2) / cols;
    const cellHeight = (height - padding * 2) / rows;

    // Generate random symbols and locked state
    const symbols: number[][] = [];
    const locked: boolean[][] = [];

    // Generate symbol values with distribution
    const maxValue = bonus?.holdAndSpin?.maxSymbolValue || 100;

    for (let r = 0; r < rows; r++) {
      symbols[r] = [];
      locked[r] = [];
      for (let c = 0; c < cols; c++) {
        // 50% chance of locked symbols (already held)
        locked[r][c] = Math.random() < 0.5;

        // Generate symbol value
        if (locked[r][c]) {
          // For locked symbols, use value distribution
          if (Math.random() < 0.7) {
            symbols[r][c] = Math.floor(Math.random() * (maxValue * 0.3) + 1); // Low value
          } else if (Math.random() < 0.9) {
            symbols[r][c] = Math.floor(Math.random() * (maxValue * 0.4) + (maxValue * 0.3)); // Medium value
          } else {
            symbols[r][c] = Math.floor(Math.random() * (maxValue * 0.3) + (maxValue * 0.7)); // High value
          }
        } else {
          symbols[r][c] = 0; // Empty cells
        }
      }
    }

    // Draw the grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padding + c * cellWidth;
        const y = padding + r * cellHeight;
        const value = symbols[r][c];
        const isLocked = locked[r][c];

        // Draw cell background
        ctx.fillStyle = isLocked ? '#1A5276' : '#2C3E50';
        ctx.beginPath();
        ctx.roundRect(x + 5, y + 5, cellWidth - 10, cellHeight - 10, 8);
        ctx.fill();

        if (isLocked) {
          // Draw value for locked symbols
          ctx.fillStyle = value < (maxValue * 0.3)
            ? '#3498DB' // Low value color
            : value < (maxValue * 0.7)
              ? '#E74C3C' // Medium value color
              : '#F1C40F'; // High value color

          ctx.beginPath();
          ctx.arc(x + cellWidth / 2, y + cellHeight / 2, cellWidth * 0.35, 0, Math.PI * 2);
          ctx.fill();

          // Draw symbol value
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${value}x`, x + cellWidth / 2, y + cellHeight / 2);
        } else {
          // Draw empty slot
          ctx.strokeStyle = '#95A5A6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x + cellWidth / 2, y + cellHeight / 2, cellWidth * 0.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Draw header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('HOLD & SPIN BONUS', width / 2, 8);

    // Draw respins info
    ctx.font = '12px Arial';
    ctx.fillText(`RESPINS: ${bonus?.holdAndSpin?.initialRespins || 3}`, width / 2, height - 20);
  }

  // Render Hold & Spin preview when holdAndSpin state is active
  useEffect(() => {
    if (previewStates.holdAndSpin && isFeatureEnabled('holdAndSpin')) {
      drawHoldAndSpin();
    }
  }, [previewStates.holdAndSpin, bonus?.holdAndSpin?.gridSize, bonus?.holdAndSpin?.initialRespins, bonus?.holdAndSpin?.maxSymbolValue]);

  // Calculate math model based on selected features
  useEffect(() => {
    let totalRTP = 0;
    let totalHitFrequency = 0;
    let maxWinPotential = 0;

    // Free Spins contribution
    if (bonus?.freeSpins?.enabled) {
      const multiplier = Math.max(...(bonus.freeSpins.multipliers || [1]));
      const spinsCount = bonus.freeSpins.count || 10;
      totalRTP += (multiplier * spinsCount * 0.1);
      totalHitFrequency += 1 / 165; // Base hit rate
      maxWinPotential = Math.max(maxWinPotential, multiplier * spinsCount * 100);
    }

    // Pick & Click contribution
    if (bonus?.pickAndClick?.enabled) {
      const picks = bonus.pickAndClick.picks || 3;
      const maxPrize = bonus.pickAndClick.maxPrize || 100;
      totalRTP += (picks * maxPrize * 0.05);
      totalHitFrequency += 1 / 200;
      maxWinPotential = Math.max(maxWinPotential, maxPrize);
    }

    // Wheel Bonus contribution
    if (bonus?.wheel?.enabled) {
      const maxMultiplier = bonus.wheel.maxMultiplier || 50;
      totalRTP += (maxMultiplier * 0.2);
      totalHitFrequency += 1 / 250;
      maxWinPotential = Math.max(maxWinPotential, maxMultiplier * 100);
    }

    // Hold & Spin contribution
    if (bonus?.holdAndSpin?.enabled) {
      const positions = (bonus.holdAndSpin.gridSize?.[0] || 3) * (bonus.holdAndSpin.gridSize?.[1] || 3);
      const maxValue = bonus.holdAndSpin.maxSymbolValue || 100;
      totalRTP += (positions * maxValue * 0.02);
      totalHitFrequency += 1 / 180;
      maxWinPotential = Math.max(maxWinPotential, positions * maxValue);
    }

    // Jackpots contribution
    if (bonus?.jackpots?.enabled) {
      const jackpotLevels = bonus.jackpots.levels || ['Minor', 'Major'];
      const isProgressive = bonus.jackpots.type === 'progressive';

      // Calculate based on jackpot levels
      const baseContribution = isProgressive ? 6 : 4;
      totalRTP += baseContribution * jackpotLevels.length * 0.5;

      // Higher hit frequency for more levels
      totalHitFrequency += jackpotLevels.length / 1000;

      // Max win potential for highest jackpot
      const highestLevel = jackpotLevels[jackpotLevels.length - 1];
      const jackpotValue =
        highestLevel === 'Mini' ? 20 :
          highestLevel === 'Minor' ? 100 :
            highestLevel === 'Major' ? 1000 :
              highestLevel === 'Grand' ? 10000 : 1000;

      maxWinPotential = Math.max(maxWinPotential, jackpotValue);
    }

    setMathModel({
      featureRTP: totalRTP,
      hitFrequency: totalHitFrequency,
      maxWin: maxWinPotential
    });
  }, [bonus]);

  return (
    <div className="space-y-2 rounded-md">
      {/* Bonus Features */}
      <div className='border bg-white rounded-md'>
        <div
          className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-900 uw:text-4xl">Select Bonus Symbol Type</h3>
          </div>
        </div>
        <div className="p-3">
          {/* Symbol Carousel */}
          <div className="mb-2 ">
            <div className="flex gap-3 overflow-x-auto p-2 uw:gap-4">
              {bonusSymbols.map((symbol) => (
                <BonusSymbolCarousel
                  key={symbol.id}
                  symbol={symbol}
                  isSelected={selectedSymbolId === symbol.id}
                  onClick={() => handleSymbolSelection(symbol.id)}
                  isGenerating={isGenerating && selectedSymbolId === symbol.id}
                  progress={0}
                />
              ))}
            </div>
          </div>
          {/* Bonus Symbol Generation Section */}
          <div className="space-y-3 bg-white rounded-md">
            <p className="text-sm text-[#5E6C84] uw:text-3xl">Generate bonus symbols required for bonus features. At least one symbol must be generated to enable features. Maximum 3 features can be enabled at once.</p>
            {selectedSymbol && (
              <div className="space-y-3 ">

                {/* Content Type Selection */}
                <div className="space-y-2 border rounded-md bg-gray-50 p-2">
                  <label className="block font-medium text-[#172B4D] uw:text-4xl">Content Type</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={contentType === getSymbolSpecificContentType().contentType}
                        onChange={() => {
                          const symbolSpecific = getSymbolSpecificContentType();
                          setContentType(symbolSpecific.contentType as any);
                        }}
                        className="w-4 h-4 text-[#0052CC] uw:w-6 uw:h-6"
                      />
                      <span className="text-sm text-[#172B4D] uw:text-3xl">{getSymbolSpecificContentType().label}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={contentType === 'text-only'}
                        onChange={() => setContentType('text-only')}
                        className="w-4 h-4 text-[#0052CC] uw:w-7 uw:h-7"
                      />
                      <span className="text-sm text-[#172B4D] uw:text-3xl">Text Only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={contentType === 'custom-text'}
                        onChange={() => setContentType('custom-text')}
                        className="w-4 h-4 text-[#0052CC] uw:w-7 uw:h-7"
                      />
                      <span className="text-sm text-[#172B4D] uw:text-3xl">Custom Text</span>
                    </label>
                  </div>
                  {/* Custom Text Input Field */}
                  {contentType === 'custom-text' && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md border">
                      <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC] uw:text-3xl"
                      />
                      <div className="text-xs text-gray-500 mt-1 uw:text-2xl">
                        {customText.length}/10 characters
                      </div>
                    </div>
                  )}
                </div>

                {/* Layout Templates */}
                <div className="space-y-2 border rounded-md p-2 bg-gray-50">
                  <label className="block text-sm font-medium text-[#172B4D] uw:text-4xl">Layout Templates</label>
                  <p className="text-xs text-[#5E6C84] mb-3 uw:text-3xl">Choose how text and symbols are arranged in your symbol</p>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={selectedLayoutTemplate === 'text-top'}
                        onChange={() => setSelectedLayoutTemplate('text-top')}
                        className="w-4 h-4 text-[#0052CC] uw:w-7 uw:h-7"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-sm uw:text-3xl">🔤</span>
                        <div>
                          <div className="text-sm font-medium text-[#172B4D] uw:text-3xl">Text on Top</div>
                          <div className="text-xs text-[#5E6C84] uw:text-3xl">Text above, symbol below</div>
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={selectedLayoutTemplate === 'text-bottom'}
                        onChange={() => setSelectedLayoutTemplate('text-bottom')}
                        className="w-4 h-4 text-[#0052CC] uw:w-7 uw:h-7"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-sm uw:text-3xl">🔽</span>
                        <div>
                          <div className="text-sm font-medium text-[#172B4D] uw:text-3xl">Text on Bottom</div>
                          <div className="text-xs text-[#5E6C84] uw:text-3xl">Large symbol above, text below</div>
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={selectedLayoutTemplate === 'text-overlay'}
                        onChange={() => setSelectedLayoutTemplate('text-overlay')}
                        className="w-4 h-4 text-[#0052CC] uw:w-7 uw:h-7"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-sm uw:text-3xl">📝</span>
                        <div>
                          <div className="text-sm font-medium text-[#172B4D] uw:text-3xl ">Text Overlay</div>
                          <div className="text-xs text-[#5E6C84] uw:text-3xl">Text overlaid on symbol</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Prompt Input */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 uw:text-3xl">
                    Generate {selectedSymbol.name} Symbol
                  </h3>

                  <textarea
                    value={prompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    placeholder="Describe the symbol you want to create..."
                    className="w-full h-24 p-3 placeholder:text-sm uw:placeholder:text-2xl uw:text-3xl border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 "
                  />

                  <div className="flex gap-2">
                    <Button
                      variant='generate'
                      onClick={handleGenerateSymbol}
                      className='flex-1'
                      disabled={isGenerating || isUploading || !prompt.trim()}
                    >
                      {isGenerating ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate
                        </>
                      )}
                    </Button>

                    <label className="relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isGenerating || isUploading}
                        className="hidden"
                      />
                      <Button
                        variant='uploadImage'
                        disabled={isGenerating || isUploading}
                        className="py-2 w-full pointer-events-none uw:text-3xl"
                      // as="span"
                      >
                        {isUploading ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 uw:w-11 uw:h-14" />
                            Upload Image
                          </>
                        )}
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-md p-0 border border-[#DFE1E6] shadow-sm">
        <div
          className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-900 uw:text-4xl">Bonus Features</h3>
          </div>
        </div>

        <div className="p-3 space-y-2 bg-white rounded-md">
          {/* Free Spins */}
          <div className="bg-gray-50 rounded-md border border-[#DFE1E6] overflow-hidden shadow-sm">
            <div className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-[#172B4D] uw:text-3xl">Free Spins</h4>
                    <p className="text-sm text-[#5E6C84] uw:text-3xl">Classic free spins bonus</p>
                    <p className="text-xs text-[#8993A4] mt-1 uw:text-3xl">
                      Requires: <span className="font-medium uw:text-3xl">Scatter symbol</span>
                      {hasSymbolType('scatter') ?
                        <span className="text-green-600 ml-1">✓ Generated</span> :
                        <span className="text-orange-600 ml-1">⚠ Not generated</span>
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center mr-2 p-1 px-2 border rounded-md bg-white gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFeatureEnabled('freeSpins')}
                      onChange={() => toggleFeatureEnabled('freeSpins')}
                      className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC] uw:w-6 uw:h-6"
                    />
                    <span className="text-sm text-[#172B4D] uw:text-3xl">Enable</span>
                  </label>
                </div>
              </div>
            </div>

            {isFeatureEnabled('freeSpins') && (
              <div className="px-2 pb-2">
                {/* Announcement Trigger Image */}
                <div className="mb-2 border p-2 rounded-md bg-white">
                  <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                    Announcement Trigger Image
                  </label>
                  <p className="text-xs text-gray-500 mb-2 uw:text-3xl">Generate or upload an image for free spins announcement</p>

                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Enter prompt for announcement image..."
                      value={(config as any)?.freeSpinAnnouncementPrompt || 'Free Spins Announcement Banner'}
                      onChange={(e) => {
                        updateConfig({
                          freeSpinAnnouncementPrompt: e.target.value
                        });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 uw:text-3xl"
                    />
                    <Button
                      variant="generate"
                      onClick={async () => {
                        const prompt = (config as any)?.freeSpinAnnouncementPrompt || 'Free Spins Announcement Banner';
                        setIsGenerating(true);
                        try {
                          const result = await enhancedOpenaiClient.generateImageWithConfig({
                            prompt: `${prompt}, vibrant casino style, exciting announcement banner, professional game asset`,
                            targetSymbolId: 'freespin_announcement',
                            gameId: gameId,
                            count: 1
                          });

                          if (result.success && result.images?.[0]) {
                            updateConfig({
                              freeSpinAnnouncementImage: result.images[0]
                            });
                            if (typeof window !== 'undefined' && (window as any).showToast) {
                              (window as any).showToast('Announcement image generated!', 'success');
                            }
                          }
                        } catch (error) {
                          console.error('Error generating announcement image:', error);
                        } finally {
                          setIsGenerating(false);
                        }
                      }}
                      disabled={isGenerating}
                      className="px-4"
                    >
                      {isGenerating ? (
                        <>
                          <Loader className="w-4 h-4 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-1" />
                          Generate
                        </>
                      )}
                    </Button>

                    <label className="relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const imageUrl = event.target?.result as string;
                            updateConfig({
                              freeSpinAnnouncementImage: imageUrl
                            });
                            if (typeof window !== 'undefined' && (window as any).showToast) {
                              (window as any).showToast('Announcement image uploaded!', 'success');
                            }
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      <Button variant="uploadImage" className="py-2 w-full pointer-events-none uw:text-3xl" as="span">
                        <Upload className="w-5 h-5 uw:w-11 uw:h-14" />
                        Upload Image
                      </Button>
                    </label>
                  </div>

                  {/* Preview */}
                  {(config as any)?.freeSpinAnnouncementImage && (
                    <div className="mt-2 border rounded-md p-2 bg-gray-50">
                      <p className="text-xs text-gray-600 mb-1 uw:text-2xl">Preview:</p>
                      <img
                        src={(config as any).freeSpinAnnouncementImage}
                        alt="Free Spin Announcement"
                        className="w-full max-h-32 object-contain rounded border"
                      />
                    </div>
                  )}
                </div>

                {/* Free Spin Background Image */}
                <div className="mb-2 border p-2 rounded-md bg-white">
                  <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                    Free Spin Background Image
                  </label>
                  <p className="text-xs text-gray-500 mb-2 uw:text-3xl">Generate or upload background image for free spins mode</p>

                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Enter prompt for background image..."
                      value={(config as any)?.freeSpinBackgroundPrompt || 'Free Spins Background'}
                      onChange={(e) => {
                        updateConfig({
                          freeSpinBackgroundPrompt: e.target.value
                        });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 uw:text-3xl"
                    />
                    <Button
                      variant="generate"
                      onClick={async () => {
                        const prompt = (config as any)?.freeSpinBackgroundPrompt || 'Free Spins Background';
                        setIsGenerating(true);
                        try {
                          const result = await enhancedOpenaiClient.generateImageWithConfig({
                            prompt: `${prompt}, vibrant casino background, exciting atmosphere, professional game background`,
                            targetSymbolId: 'freespin_background',
                            gameId: gameId,
                            count: 1
                          });

                          if (result.success && result.images?.[0]) {
                            const imageUrl = result.images[0];

                            updateConfig({
                              freeSpinBackgroundImage: imageUrl,
                              derivedBackgrounds: {
                                ...(config as any)?.derivedBackgrounds,
                                freespin: imageUrl
                              }
                            });

                            if (typeof window !== 'undefined' && (window as any).showToast) {
                              (window as any).showToast('Background image generated!', 'success');
                            }
                          }
                        } catch (error) {
                          console.error('Error generating background image:', error);
                        } finally {
                          setIsGenerating(false);
                        }
                      }}
                      disabled={isGenerating}
                      className="px-4"
                    >
                      {isGenerating ? (
                        <>
                          <Loader className="w-4 h-4 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-1" />
                          Generate
                        </>
                      )}
                    </Button>

                    <label className="relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const imageUrl = event.target?.result as string;
                            updateConfig({
                              freeSpinBackgroundImage: imageUrl,
                              derivedBackgrounds: {
                                ...(config as any)?.derivedBackgrounds,
                                freespin: imageUrl
                              }
                            });

                            if (typeof window !== 'undefined' && (window as any).showToast) {
                              (window as any).showToast('Background image uploaded!', 'success');
                            }
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      <Button variant="uploadImage" className="py-2 w-full pointer-events-none uw:text-3xl" as="span">
                        <Upload className="w-5 h-5 uw:w-11 uw:h-14" />
                        Upload Image
                      </Button>
                    </label>
                  </div>

                  {/* Preview */}
                  {((config as any)?.freeSpinBackgroundImage || config?.derivedBackgrounds?.freespin) && (
                    <div className="mt-2 border rounded-md p-2 bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-600 uw:text-2xl">Preview:</p>
                        {!((config as any)?.freeSpinBackgroundImage) && config?.derivedBackgrounds?.freespin && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded uw:text-2xl">Using Default Background</span>
                        )}
                      </div>
                      <img
                        src={(config as any)?.freeSpinBackgroundImage || config?.derivedBackgrounds?.freespin}
                        alt="Free Spin Background"
                        className="w-full max-h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {isFeatureEnabled('freeSpins') && (
              <div className="px-2 pb-4">
                <div className="pt-2 border-t border-[#DFE1E6]">
                  {/* Trigger Requirements */}
                  <div className='border p-2 rounded-md bg-white'>
                    <label className="block text-sm font-medium text-[#172B4D] mb-1 uw:text-3xl">
                      Trigger Requirements
                    </label>
                    <select
                      value={bonus?.freeSpins?.triggers?.[0] || 3}
                      onChange={(e) => updateConfig({
                        bonus: {
                          ...config.bonus,
                          freeSpins: {
                            enabled: config.bonus?.freeSpins?.enabled || false,
                            count: config.bonus?.freeSpins?.count || 10,
                            triggers: [parseInt(e.target.value)],
                            multipliers: config.bonus?.freeSpins?.multipliers || [1],
                            retriggers: config.bonus?.freeSpins?.retriggers || true
                          }
                        }
                      })}
                      className="w-full bg-white border border-[#DFE1E6] rounded-lg px-4 py-2 text-[#172B4D] uw:text-3xl"
                    >
                      <option value="3">3 Scatters</option>
                      <option value="4">4 Scatters</option>
                      <option value="5">5 Scatters</option>
                    </select>
                  </div>

                  {/* Free Spins Count */}
                  <div className="mt-2 border bg-white rounded-md p-2">
                    <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                      Number of Free Spins
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[8, 10, 12, 15, 20, 25].map((count) => (
                        <button
                          key={count}
                          onClick={() => updateConfig({
                            bonus: {
                              ...config.bonus,
                              freeSpins: ensureBonusDefaults('freeSpins', { count })
                            }
                          })}
                          className={`p-2 rounded-lg border uw:text-3xl transition-colors ${bonus?.freeSpins?.count === count
                            ? 'bg-red-50 border-[#0052CC] border-red-500'
                            : 'bg-white border-[#DFE1E6]'
                            }`}
                        >
                          {count} Spins
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multipliers */}
                  <div className="mt-2 border p-2 rounded-md bg-white">
                    <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                      Win Multipliers
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 5, 10].map((mult) => (
                        <label key={mult} className="flex items-center border py-1 px-2 rounded-md">
                          <input
                            type="checkbox"
                            checked={bonus?.freeSpins?.multipliers?.includes(mult)}
                            onChange={(e) => {
                              const newMults = e.target.checked
                                ? [...(bonus?.freeSpins?.multipliers || []), mult]
                                : (bonus?.freeSpins?.multipliers || []).filter(m => m !== mult);
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  freeSpins: ensureBonusDefaults('freeSpins', { multipliers: newMults })
                                }
                              });
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC] uw:w-6 uw:h-6"
                          />
                          <span className="ml-2 text-[#172B4D] uw:text-3xl">x{mult}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Additional Options */}
                  <div className="mt-2 border bg-white p-2 rounded-md space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bonus?.freeSpins?.retriggers}
                        onChange={(e) => updateConfig({
                          bonus: {
                            ...config.bonus,
                            freeSpins: ensureBonusDefaults('freeSpins', { retriggers: e.target.checked })
                          }
                        })}
                        className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC] uw:w-6 uw:h-6"
                      />
                      <span className="ml-2 text-[#172B4D] uw:text-3xl">Allow Retriggers</span>
                    </label>
                  </div>

                  {/* Freespin Transitions */}
                  <div className="mt-2 border bg-white rounded-md overflow-hidden">
                    <div className="w-full p-3 flex items-center justify-between text-left border-l-4 border-l-red-500 bg-gray-50 transition-colors border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 uw:text-2xl">Freespin Transitions</h3>
                          <p className="text-sm text-gray-600 uw:text-2xl">Title assets integration</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 space-y-3">
                      {/* Transition Style */}
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-800 uw:text-2xl">Transition Style:</label>
                        <select
                          value={freespinTransition.style}
                          onChange={(e) => updateTransitionStyle(e.target.value as FreespinTransition['style'])}
                          className="w-full bg-white border-2 border-gray-200 text-gray-800 rounded-lg px-4 py-3 uw:text-2xl"
                        >
                          <option value="fade">🌅 Fade</option>
                          <option value="slide">➡️ Slide</option>
                          <option value="zoom">🔍 Zoom In</option>
                          <option value="dissolve">💫 Dissolve</option>
                        </select>
                      </div>

                      {/* Duration */}
                      <div className="space-y-3">
                        <label className="text-sm font-semibold uw:text-2xl text-gray-800">
                          Duration: {freespinTransition.duration}s
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="5.0"
                          step="0.1"
                          value={freespinTransition.duration}
                          onChange={(e) => updateTransitionDuration(parseFloat(e.target.value))}
                          className="w-full h-3 bg-gradient-to-r from-gray-200 via-orange-200 to-orange-500 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Preview Buttons */}
                      <div className="space-y-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('previewFreespinTransition', {
                              detail: {
                                direction: 'to-freespin',
                                style: freespinTransition.style,
                                duration: freespinTransition.duration
                              }
                            }));
                          }}
                          className="w-full uw:text-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
                        >
                          🎰 Preview → Freespin
                        </button>

                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('previewFreespinTransition', {
                              detail: {
                                direction: 'to-regular',
                                style: freespinTransition.style,
                                duration: freespinTransition.duration
                              }
                            }));
                          }}
                          className="w-full uw:text-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105"
                        >
                          🌟 Freespin → Regular
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Pick & Click */}
          <div className="bg-gray-50 rounded-md border border-[#DFE1E6] overflow-hidden shadow-sm">
            <div className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-[#172B4D] uw:text-3xl">Pick & Click</h4>
                    <p className="text-sm text-[#5E6C84] uw:text-3xl">Interactive bonus game</p>
                    <p className="text-xs text-[#8993A4] mt-1 uw:text-3xl">
                      Requires: <span className="font-medium uw:text-3xl">Bonus symbol</span>
                      {hasSymbolType('bonus') ?
                        <span className="text-green-600 ml-1">✓ Generated</span> :
                        <span className="text-orange-600 ml-1">⚠ Not generated</span>
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center mr-2 p-1 px-2 border rounded-md bg-white gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFeatureEnabled('pickAndClick')}
                      onChange={() => toggleFeatureEnabled('pickAndClick')}
                      className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC] uw:w-6 uw:h-6"
                    />
                    <span className="text-sm text-[#172B4D] uw:text-3xl">Enable</span>
                  </label>
                </div>
              </div>
            </div>

            {isFeatureEnabled('pickAndClick') && (
              <div className="px-2 pb-2">
                <div className="pt-2 border-t border-[#DFE1E6]">
                  <div className="mb-2 border p-2 rounded-md bg-white">
                    <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                      Pick & Click Announcement Image
                    </label>
                    <p className="text-xs text-gray-500 mb-2 uw:text-3xl">Generate or upload announcement image for Pick & Click bonus</p>

                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Enter prompt for announcement image..."
                        value={(config as any)?.pickClickAnnouncementPrompt || 'Pick & Click Bonus Announcement'}
                        onChange={(e) => {
                          updateConfig({
                            pickClickAnnouncementPrompt: e.target.value
                          });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 uw:text-3xl"
                      />
                      <Button
                        variant="generate"
                        onClick={async () => {
                          const prompt = (config as any)?.pickClickAnnouncementPrompt || 'Pick & Click Bonus Announcement';
                          setIsGenerating(true);
                          try {
                            const result = await enhancedOpenaiClient.generateImageWithConfig({
                              prompt: `${prompt}, exciting bonus game announcement, vibrant casino style, professional game asset`,
                              targetSymbolId: 'pickclick_announcement',
                              gameId: gameId,
                              count: 1
                            });

                            if (result.success && result.images?.[0]) {
                              updateConfig({
                                pickClickAnnouncementImage: result.images[0]
                              });
                              if (typeof window !== 'undefined' && (window as any).showToast) {
                                (window as any).showToast('Announcement image generated!', 'success');
                              }
                            }
                          } catch (error) {
                            console.error('Error generating announcement image:', error);
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                        disabled={isGenerating}
                        className="px-4"
                      >
                        {isGenerating ? (
                          <>
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-1" />
                            Generate
                          </>
                        )}
                      </Button>

                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const imageUrl = event.target?.result as string;
                              updateConfig({
                                pickClickAnnouncementImage: imageUrl
                              });
                              if (typeof window !== 'undefined' && (window as any).showToast) {
                                (window as any).showToast('Announcement image uploaded!', 'success');
                              }
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                        <Button variant="uploadImage" className="py-2 w-full pointer-events-none uw:text-3xl" as="span">
                          <Upload className="w-5 h-5 uw:w-11 uw:h-14 uw:text-2xl" />
                          Upload Image
                        </Button>
                      </label>
                    </div>

                    {/* Preview */}
                    {(config as any)?.pickClickAnnouncementImage && (
                      <div className="mt-2 border rounded-md p-2 bg-gray-50">
                        <p className="text-xs text-gray-600 mb-1">Preview:</p>
                        <img
                          src={(config as any).pickClickAnnouncementImage}
                          alt="Pick & Click Announcement"
                          className="w-full max-h-32 object-contain rounded border"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex border p-1 rounded-md bg-white flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/2 space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                          Grid Size
                        </label>
                        <div className="grid grid-cols-3 gap-2 border p-1 bg-gray-50 rounded-md">
                          {[
                            { label: '3x3', size: [3, 3] },
                            { label: '3x4', size: [3, 4] },
                            { label: '4x4', size: [4, 4] }
                          ].map((grid) => (
                            <button
                              key={grid.label}
                              onClick={() => {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    pickAndClick: ensureBonusDefaults('pickAndClick', {
                                      gridSize: grid.size as [number, number]
                                    })
                                  }
                                });
                                if (activePreview !== 'pickAndClick') {
                                  setActivePreview('pickAndClick');
                                } else {
                                  const tempPreview = activePreview;
                                  setActivePreview(null);
                                  setTimeout(() => setActivePreview(tempPreview), 50);
                                }
                              }}
                              className={`p-1 rounded-lg border uw:text-2xl transition-colors ${JSON.stringify(bonus?.pickAndClick?.gridSize) === JSON.stringify(grid.size)
                                ? 'bg-red-50 border-red-500'
                                : 'bg-white '
                                }`}
                            >
                              {grid.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className='border p-2 rounded-md bg-gray-50'>
                        <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                          Initial Picks
                        </label>
                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              const currentPicks = bonus?.pickAndClick?.picks || 3;
                              if (currentPicks > 1) {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    pickAndClick: ensureBonusDefaults('pickAndClick', { picks: currentPicks - 1 })
                                  }
                                });
                                setActivePreview('pickAndClick');
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-[#F4F5F7] rounded-l-lg border border-[#DFE1E6] text-[#172B4D] hover:bg-[#E9ECF0]"
                          >
                            <Minus className="w-4 h-4 uw:w-5 uw:h-5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={bonus?.pickAndClick?.picks || 3}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  pickAndClick: ensureBonusDefaults('pickAndClick', { picks: parseInt(e.target.value) })
                                }
                              });
                              setActivePreview('pickAndClick');
                            }}
                            className="flex-1 h-8 bg-white border-t border-b border-[#DFE1E6] px-4 text-center text-[#172B4D] uw:h-10 uw:text-2xl"
                          />

                          <button
                            onClick={() => {
                              const currentPicks = bonus?.pickAndClick?.picks || 3;
                              if (currentPicks < 10) {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    pickAndClick: ensureBonusDefaults('pickAndClick', { picks: currentPicks + 1 })
                                  }
                                });
                                setActivePreview('pickAndClick');
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-[#F4F5F7] rounded-r-lg border border-[#DFE1E6] text-[#172B4D] hover:bg-[#E9ECF0]"
                          >
                            <Plus className="w-4 h-4 uw:w-5 uw:h-5" />
                          </button>
                        </div>
                        <div className="flex justify-center mt-1 text-xs text-[#5E6C84] uw:text-3xl">
                          <span>Picks remaining: {bonus?.pickAndClick?.picks || 3}</span>
                        </div>
                      </div>

                      <div className='border p-2 rounded-md bg-gray-50'>
                        <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                          Maximum Prize (Per Box)
                        </label>
                        <div className="grid gap-2" style={{
                          gridTemplateColumns: `repeat(${bonus?.pickAndClick?.gridSize?.[1] || 3}, 1fr)`
                        }}>
                          {Array.from({ length: (bonus?.pickAndClick?.gridSize?.[0] || 3) * (bonus?.pickAndClick?.gridSize?.[1] || 3) }).map((_, index) => (
                            <input
                              key={index}
                              type="number"
                              min="1"
                              max="1000"
                              value={bonus?.pickAndClick?.prizeValues?.[index] || 100}
                              onChange={(e) => {
                                const newValues = [...(bonus?.pickAndClick?.prizeValues || [])];
                                newValues[index] = parseInt(e.target.value) || 100;
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    pickAndClick: ensureBonusDefaults('pickAndClick', { prizeValues: newValues })
                                  }
                                });
                                setActivePreview('pickAndClick');
                              }}
                              placeholder="Prize"
                              className="w-full px-2 py-1 text-center border border-gray-300 rounded bg-white text-sm uw:text-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 uw:text-3xl">Set prize value for each box in the grid</p>
                      </div>

                      <div className="space-y-2 border p-2 rounded-md bg-gray-50">
                        <label className="flex items-center border p-1 rounded-md bg-white">
                          <input
                            type="checkbox"
                            checked={bonus?.pickAndClick?.extraPicks}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  pickAndClick: ensureBonusDefaults('pickAndClick', { extraPicks: e.target.checked })
                                }
                              });
                              setActivePreview('pickAndClick');
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC] uw:w-6 uw:h-6"
                          />
                          <span className="ml-2 text-[#172B4D] uw:text-3xl">Include Extra Pick Symbols</span>
                          <Plus className="ml-2 w-4 h-4 text-[#66BB6A] uw:w-6 uw:h-6" />
                        </label>
                        <label className="flex items-center border p-1 rounded-md bg-white">
                          <input
                            type="checkbox"
                            checked={bonus?.pickAndClick?.multipliers}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  pickAndClick: ensureBonusDefaults('pickAndClick', { multipliers: e.target.checked })
                                }
                              });
                              setActivePreview('pickAndClick');
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC] uw:w-6 uw:h-6"
                          />
                          <span className="ml-2 text-[#172B4D] uw:text-3xl  ">Include Multiplier Symbols</span>
                          <span className="ml-2 text-xs font-bold text-[#FFA726] uw:text-3xl">x2</span>
                        </label>
                      </div>
                    </div>

                    {/* Right column - Preview */}
                    <div className="w-full md:w-1/2 ">
                      <div className="flex flex-col items-center ">
                        <div className="mb-2 text-sm font-medium text-[#172B4D] flex items-center uw:text-3xl">
                          <span>Live Preview</span>
                          {!previewStates.pickAndClick && (
                            <button
                              onClick={() => updatePreviewState('pickAndClick', true)}
                              className="ml-2 text-[#0052CC] hover:text-[#0747A6] transition-colors"
                            >
                              (Show)
                            </button>
                          )}
                        </div>

                        {previewStates.pickAndClick && activePreview === 'pickAndClick' ? (
                          <div>
                            {(() => {
                              const { grid, revealedCells, picks } = renderPickAndClickGrid();
                              const gridSize = bonus?.pickAndClick?.gridSize || [3, 3];
                              const rows = gridSize[0];
                              const cols = gridSize[1];

                              return (
                                <div className="bg-[#0F1423] p-2 rounded-md">
                                  <div className="flex justify-between items-center mb-4">
                                    <div className="text-white font-semibold">PICK & CLICK BONUS</div>
                                    <div className="text-[#FFF176] font-semibold">Picks: {picks}</div>
                                  </div>

                                  {/* Bonus Trigger Confirmation Button */}
                                  <div className="mb-3 flex justify-center">
                                    <button
                                      onClick={() => setShowPickClickConfirmation(true)}
                                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-bold shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105 flex items-center gap-2"
                                    >
                                      <Gift className="w-5 h-5" />
                                      Show Bonus Trigger
                                    </button>
                                  </div>

                                  <div
                                    className="grid gap-2 mx-auto"
                                    style={{
                                      gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                      gridTemplateRows: `repeat(${rows}, 1fr)`
                                    }}
                                  >
                                    {Array(rows).fill(0).map((_, r) => (
                                      Array(cols).fill(0).map((_, c) => {
                                        const cell = grid[r][c];
                                        const isRevealed = revealedCells[r][c];

                                        if (isRevealed && cell) {
                                          // Render revealed cell with different styles based on type
                                          let content, bgColor;

                                          if (cell.type === 'extraPick') {
                                            content = (
                                              <div className="flex flex-col items-center text-center justify-center">
                                                <Plus className="w-4 h-4 text-white" />
                                                <p className="text-xs mt-1 text-white uw:text-2xl">EXTRA PICK</p>
                                              </div>
                                            );
                                            bgColor = 'bg-[#66BB6A]';
                                          } else if (cell.type === 'multiplier') {
                                            content = (
                                              <div className="flex flex-col items-center justify-center">
                                                <div className="text-base font-bold text-white">x{cell.value}</div>
                                                <div className="text-xs text-white uw:text-2xl">MULTIPLIER</div>
                                              </div>
                                            );
                                            bgColor = 'bg-[#FFA726]';
                                          } else {
                                            content = (
                                              <div className="flex flex-col items-center justify-center">
                                                <div className="text-base font-bold text-white">{cell.value}x</div>
                                                <div className="text-xs  text-white uw:text-3xl">WIN</div>
                                              </div>
                                            );
                                            const allPrizes = bonus?.pickAndClick?.prizeValues || [100];
                                            const maxPrize = Math.max(...allPrizes);
                                            const minPrize = Math.min(...allPrizes);
                                            const range = maxPrize - minPrize;
                                            bgColor = cell.value <= (minPrize + range * 0.33)
                                              ? 'bg-[#5C6BC0]'
                                              : cell.value <= (minPrize + range * 0.66)
                                                ? 'bg-[#EF5350]'
                                                : 'bg-[#FFD700]';
                                          }

                                          return (
                                            <div
                                              key={`${r}-${c}`}
                                              className={`${bgColor} w-12 h-12 rounded-lg shadow-md flex items-center justify-center text-white transition-all duration-300 transform hover:scale-105`}
                                            >
                                              {content}
                                            </div>
                                          );
                                        } else {
                                          return (
                                            <div
                                              key={`${r}-${c}`}
                                              className="w-12 uw:h-[100px] uw:w-[120px] h-12 bg-[#2D3748] rounded-lg flex items-center justify-center text-white cursor-pointer shadow-md transition-all duration-300 hover:bg-[#4A5568]"
                                              onClick={() => setActivePreview('pickAndClick')} // Re-render to show a different random setup
                                            >
                                              <div className="text-3xl font-bold text-[#A0AEC0] uw:text-4xl">?</div>
                                            </div>
                                          );
                                        }
                                      })
                                    ))}
                                  </div>

                                  <div className="flex justify-center mt-3">
                                    <button
                                      onClick={() => {
                                        const tempPreview = activePreview;
                                        setActivePreview(null);
                                        setTimeout(() => setActivePreview(tempPreview), 50);
                                      }}
                                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors uw:text-2xl"
                                    >
                                      Randomize Preview
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div
                            className="w-[300px] h-[300px] uw:h-[400px] uw:w-[400px] border border-dashed border-[#DFE1E6] rounded-lg flex items-center justify-center bg-[#F4F5F7] cursor-pointer hover:bg-[#DEEBFF] transition-colors"
                            onClick={() => updatePreviewState('pickAndClick', true)}
                          >
                            <div className="text-center p-5">
                              <Gift className="w-10 h-10  text-[#0052CC] mx-auto mb-2" />
                              <p className="text-[#172B4D] font-medium uw:text-3xl">Click to preview your Pick & Click Bonus</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pick & Click Trigger */}
                  <div className=" border mt-2 bg-white rounded-md overflow-hidden">
                    <div className="p-3 space-y-3">
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('previewPickAndClickBonus', {
                              detail: {
                                feature: 'pickAndClick',
                                action: 'trigger'
                              }
                            }));
                          }}
                          className="w-full uw:text-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105"
                        >
                          🎁 Trigger Pick & Click Bonus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wheel Bonus */}
          <div className="bg-gray-50 rounded-md border border-[#DFE1E6] overflow-hidden shadow-sm">
            <div className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-[#172B4D] uw:text-3xl">Wheel Bonus</h4>
                    <p className="text-sm text-[#5E6C84] uw:text-3xl">Wheel of fortune style bonus</p>
                    <p className="text-xs text-[#8993A4] mt-1 uw:text-3xl">
                      Requires: <span className="font-medium uw:text-3xl">Bonus symbol</span>
                      {hasSymbolType('bonus') ?
                        <span className="text-green-600 ml-1">✓ Generated</span> :
                        <span className="text-orange-600 ml-1">⚠ Not generated</span>
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center mr-2 p-1 px-2 border rounded-md bg-white gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFeatureEnabled('wheel')}
                      onChange={() => toggleFeatureEnabled('wheel')}
                      className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC] uw:w-6 uw:h-6"
                    />
                    <span className="text-sm text-[#172B4D] uw:text-3xl ">Enable</span>
                  </label>
                </div>
              </div>
            </div>

            {isFeatureEnabled('wheel') && (
              <div className="px-2 pb-2">
                <div className="pt-2 border-t border-[#DFE1E6]">
                  {/* Wheel Announcement Image */}
                  <div className="mb-2 border p-2 rounded-md bg-white">
                    <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                      Wheel Bonus Announcement Image
                    </label>
                    <p className="text-xs text-gray-500 mb-2 uw:text-3xl">Generate or upload announcement image for Wheel bonus</p>

                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Enter prompt for announcement image..."
                        value={(config as any)?.wheelAnnouncementPrompt || 'Wheel Bonus Announcement'}
                        onChange={(e) => {
                          updateConfig({
                            wheelAnnouncementPrompt: e.target.value
                          });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 uw:text-3xl"
                      />
                      <Button
                        variant="generate"
                        onClick={async () => {
                          const prompt = (config as any)?.wheelAnnouncementPrompt || 'Wheel Bonus Announcement';
                          setIsGenerating(true);
                          try {
                            const result = await enhancedOpenaiClient.generateImageWithConfig({
                              prompt: `${prompt}, exciting wheel of fortune announcement, vibrant casino style, professional game asset`,
                              targetSymbolId: 'wheel_announcement',
                              gameId: gameId,
                              count: 1
                            });

                            if (result.success && result.images?.[0]) {
                              updateConfig({
                                wheelAnnouncementImage: result.images[0]
                              });
                              if (typeof window !== 'undefined' && (window as any).showToast) {
                                (window as any).showToast('Announcement image generated!', 'success');
                              }
                            }
                          } catch (error) {
                            console.error('Error generating announcement image:', error);
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                        disabled={isGenerating}
                        className="px-4"
                      >
                        {isGenerating ? (
                          <>
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-1" />
                            Generate
                          </>
                        )}
                      </Button>

                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const imageUrl = event.target?.result as string;
                              updateConfig({
                                wheelAnnouncementImage: imageUrl
                              });
                              if (typeof window !== 'undefined' && (window as any).showToast) {
                                (window as any).showToast('Announcement image uploaded!', 'success');
                              }
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                        <Button variant="uploadImage" className="py-2 w-full pointer-events-none uw:text-3xl" as="span">
                          <Upload className="w-5 h-5 uw:w-11 uw:h-14" />
                          Upload Image
                        </Button>
                      </label>
                    </div>

                    {/* Preview */}
                    {(config as any)?.wheelAnnouncementImage && (
                      <div className="mt-2 border rounded-md p-2 bg-gray-50">
                        <p className="text-xs text-gray-600 mb-1 uw:text-2xl">Preview:</p>
                        <img
                          src={(config as any).wheelAnnouncementImage}
                          alt="Wheel Announcement"
                          className="w-full max-h-32 object-contain rounded border"
                        />
                      </div>
                    )}
                  </div>

                  {/* Preview and Configuration in two columns */}
                  <div className="flex border p-2 rounded-md bg-white flex-col md:flex-row gap-6">
                    {/* Left column - Configuration */}
                    <div className="w-full md:w-1/2 space-y-2">
                      {/* Number of Segments */}
                      <div className='border p-2 rounded-md bg-gray-50'>
                        <label className="block text-sm font-medium text-[#172B4D] mb-1 uw:text-3xl">
                          Number of Segments
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[8, 12, 16, 20].map((segments) => (
                            <button
                              key={segments}
                              onClick={() => {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    wheel: ensureBonusDefaults('wheel', { segments })
                                  }
                                });
                                setActivePreview('wheel');
                              }}
                              className={`p-1 rounded-lg border uw:text-2xl transition-colors ${bonus?.wheel?.segments === segments
                                ? 'bg-red-50 border-red-500'
                                : 'bg-white ]'
                                }`}
                            >
                              {segments}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Segment Values - Dynamic Inputs */}
                      <div className='border p-2 rounded-md bg-gray-50'>
                        <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                          Segment Values (Per Segment)
                        </label>
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                          {Array.from({ length: bonus?.wheel?.segments || 8 }).map((_, index) => (
                            <input
                              key={index}
                              type="number"
                              min="1"
                              max="1000"
                              value={bonus?.wheel?.segmentValues?.[index] || 50}
                              onChange={(e) => {
                                const newValues = [...(bonus?.wheel?.segmentValues || [])];
                                newValues[index] = parseInt(e.target.value) || 50;
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    wheel: ensureBonusDefaults('wheel', { segmentValues: newValues })
                                  }
                                });
                                setActivePreview('wheel');
                              }}
                              placeholder="Value"
                              className="w-full px-2 py-1 text-center border border-gray-300 rounded bg-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 uw:text-2xl"
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 uw:text-3xl">Set multiplier value for each wheel segment</p>
                      </div>

                      {/* Additional Features */}
                      <div className="space-y-2 border p-2 rounded-md bg-gray-50">
                        <label className="flex items-center border p-1 rounded-md bg-white">
                          <input
                            type="checkbox"
                            checked={bonus?.wheel?.levelUp}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  wheel: ensureBonusDefaults('wheel', { levelUp: e.target.checked })
                                }
                              });
                              setActivePreview('wheel');
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] uw:w-6 uw:h-6"
                          />
                          <span className="ml-2 text-base text-[#172B4D] uw:text-3xl">Include Level Up Segments</span>
                          {/* <Award className="ml-2 w-4 h-4 text-[#FFD700]" /> */}
                        </label>
                        <label className="flex items-center border p-1 rounded-md bg-white">
                          <input
                            type="checkbox"
                            checked={bonus?.wheel?.respin}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  wheel: ensureBonusDefaults('wheel', { respin: e.target.checked })
                                }
                              });
                              setActivePreview('wheel');
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC] uw:w-6 uw:h-6  "
                          />
                          <span className="ml-2 text-base text-[#172B4D] uw:text-3xl ">Include Respin Segments</span>
                        </label>
                      </div>
                    </div>

                    {/* Right column - Preview */}
                    <div className="w-full md:w-1/2">
                      <div className="flex flex-col items-center">
                        <div className="mb-2 text-sm font-medium text-[#172B4D] flex items-center uw:text-2xl">
                          <span>Live Preview</span>
                          {!previewStates.wheel && (
                            <button
                              onClick={() => updatePreviewState('wheel', true)}
                              className="ml-2 text-[#0052CC] hover:text-[#0747A6] transition-colors"
                            >
                              (Show)
                            </button>
                          )}
                        </div>
                        {previewStates.wheel && activePreview === 'wheel' ? (
                          <div className="relative">
                            <canvas
                              ref={wheelCanvasRef}
                              width={250}
                              height={250}
                              className="border border-[#DFE1E6] rounded-full shadow-sm uw:w-[350px] uw:h-[350px]"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <button
                                onClick={() => {
                                  const segmentCount = bonus?.wheel?.segments || 8;
                                  const hasLevelUp = !!bonus?.wheel?.levelUp;
                                  const hasRespin = !!bonus?.wheel?.respin;
                                  drawWheel(segmentCount, hasLevelUp, hasRespin);
                                }}
                                className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                <RotateCw className="w-5 h-5 text-[#0052CC]" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="w-[300px] h-[300px] border border-dashed border-[#DFE1E6] rounded-full flex items-center justify-center bg-[#F4F5F7] cursor-pointer hover:bg-[#DEEBFF] transition-colors"
                            onClick={() => {
                              updatePreviewState('wheel', true);
                            }}
                          >
                            <div className="text-center p-5">
                              <Zap className="w-10 h-10 text-[#0052CC] mx-auto mb-2" />
                              <p className="text-[#172B4D] font-medium uw:text-3xl">Click to preview your Wheel Bonus</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Wheel Bonus Trigger */}
                  <div className=" border mt-2 bg-white rounded-md overflow-hidden">
                    <div className="p-3 space-y-3">
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('previewWheelBonus', {
                              detail: {
                                feature: 'wheel',
                                action: 'trigger'
                              }
                            }));
                          }}
                          className="w-full uw:text-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all transform hover:scale-105"
                        >
                          🎰 Trigger Wheel Bonus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hold & Spin */}
          <div className="bg-gray-50 rounded-md border border-[#DFE1E6] overflow-hidden shadow-sm">
            <div className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-[#172B4D] uw:text-3xl">Hold & Spin</h4>
                    <p className="text-sm text-[#5E6C84] uw:text-3xl">Respin feature with locked symbols</p>
                    <p className="text-xs text-[#8993A4] mt-1 uw:text-3xl">
                      Requires: <span className="font-medium uw:text-3xl">HoldSpin symbol</span>
                      {hasSymbolType('holdspin') ?
                        <span className="text-green-600 ml-1">✓ Generated</span> :
                        <span className="text-orange-600 ml-1">⚠ Not generated</span>
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center mr-2 p-1 px-2 border rounded-md bg-white gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFeatureEnabled('holdAndSpin')}
                      onChange={() => toggleFeatureEnabled('holdAndSpin')}
                      className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC] uw:w-6 uw:h-6"
                    />
                    <span className="text-sm text-[#172B4D] uw:text-3xl">Enable</span>
                  </label>
                </div>
              </div>
            </div>

            {isFeatureEnabled('holdAndSpin') && (
              <div className="px-2 pb-2">
                <div className="pt-2 border-t border-[#DFE1E6]">
                  {/* Hold & Spin Announcement Image */}
                  <div className="mb-2 border p-2 rounded-md bg-white">
                    <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                      Hold & Spin Announcement Image
                    </label>
                    <p className="text-xs text-gray-500 mb-2 uw:text-3xl">Generate or upload announcement image for Hold & Spin bonus</p>

                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Enter prompt for announcement image..."
                        value={(config as any)?.holdSpinAnnouncementPrompt || 'Hold & Spin Bonus Announcement'}
                        onChange={(e) => {
                          updateConfig({
                            holdSpinAnnouncementPrompt: e.target.value
                          });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 uw:text-3xl"
                      />
                      <Button
                        variant="generate"
                        onClick={async () => {
                          const prompt = (config as any)?.holdSpinAnnouncementPrompt || 'Hold & Spin Bonus Announcement';
                          setIsGenerating(true);
                          try {
                            const result = await enhancedOpenaiClient.generateImageWithConfig({
                              prompt: `${prompt}, exciting hold and spin announcement, vibrant casino style, professional game asset`,
                              targetSymbolId: 'holdspin_announcement',
                              gameId: gameId,
                              count: 1
                            });

                            if (result.success && result.images?.[0]) {
                              updateConfig({
                                holdSpinAnnouncementImage: result.images[0]
                              });
                              if (typeof window !== 'undefined' && (window as any).showToast) {
                                (window as any).showToast('Announcement image generated!', 'success');
                              }
                            }
                          } catch (error) {
                            console.error('Error generating announcement image:', error);
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                        disabled={isGenerating}
                        className="px-4"
                      >
                        {isGenerating ? (
                          <>
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-1" />
                            Generate
                          </>
                        )}
                      </Button>

                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const imageUrl = event.target?.result as string;
                              updateConfig({
                                holdSpinAnnouncementImage: imageUrl
                              });
                              if (typeof window !== 'undefined' && (window as any).showToast) {
                                (window as any).showToast('Announcement image uploaded!', 'success');
                              }
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                        <Button variant="uploadImage" className="py-2 w-full pointer-events-none uw:text-3xl" as="span">
                          <Upload className="w-5 h-5 uw:w-11 uw:h-14" />
                          Upload Image
                        </Button>
                      </label>
                    </div>

                    {/* Preview */}
                    {(config as any)?.holdSpinAnnouncementImage && (
                      <div className="mt-2 border rounded-md p-2 bg-gray-50">
                        <p className="text-xs text-gray-600 mb-1 uw:text-2xl">Preview:</p>
                        <img
                          src={(config as any).holdSpinAnnouncementImage}
                          alt="Hold & Spin Announcement"
                          className="w-full max-h-32 object-contain rounded border"
                        />
                      </div>
                    )}
                  </div>

                  {/* Preview and Configuration in two columns */}
                  <div className="flex border p-2 rounded-md bg-white flex-col md:flex-row gap-6">
                    {/* Left column - Configuration */}
                    <div className="w-full md:w-1/2 space-y-2">
                      {/* Grid Size */}
                      <div className='border p-2 rounded-md bg-gray-50'>
                        <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                          Grid Size
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { label: '3x3', size: [3, 3] },
                            { label: '3x4', size: [3, 4] },
                            { label: '4x4', size: [4, 4] }
                          ].map((grid) => (
                            <button
                              key={grid.label}
                              onClick={() => {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    holdAndSpin: ensureBonusDefaults('holdAndSpin', {
                                      gridSize: grid.size as [number, number]
                                    })
                                  }
                                });
                                setActivePreview('holdAndSpin');
                              }}
                              className={`p-1 rounded-lg border uw:text-3xl transition-colors ${JSON.stringify(bonus?.holdAndSpin?.gridSize) === JSON.stringify(grid.size)
                                ? 'bg-red-50 border-red-500'
                                : 'bg-white'
                                }`}
                            >
                              {grid.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Initial Respins */}
                      <div className="mt-2 border rounded-md bg-gray-50 p-2">
                        <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                          Initial Respins
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={bonus?.holdAndSpin?.initialRespins || 3}
                          onChange={(e) => {
                            updateConfig({
                              bonus: {
                                ...config.bonus,
                                holdAndSpin: ensureBonusDefaults('holdAndSpin', { initialRespins: parseInt(e.target.value) })
                              }
                            });
                            setActivePreview('holdAndSpin');
                          }}
                          className="w-full bg-white border border-[#DFE1E6] rounded-lg px-2 py-1 text-[#172B4D] uw:text-3xl"
                        />
                      </div>

                      {/* Symbol Values */}
                      <div className="mt-2 border rounded-md bg-gray-50 p-2">
                        <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                          Maximum Symbol Value
                        </label>
                        <div className="grid grid-cols-4 gap-4">
                          {[25, 50, 100, 250].map((value) => (
                            <button
                              key={value}
                              onClick={() => {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    holdAndSpin: ensureBonusDefaults('holdAndSpin', { maxSymbolValue: value })
                                  }
                                });
                                setActivePreview('holdAndSpin');
                              }}
                              className={`p-1 rounded-lg border uw:text-3xl transition-colors ${bonus?.holdAndSpin?.maxSymbolValue === value
                                ? 'bg-red-50 border-red-500'
                                : 'bg-white '
                                }`}
                            >
                              {value}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Additional Features */}
                      <div className="mt-2 border rounded-md p-2 bg-gray-50 space-y-2">
                        <label className="flex items-center border p-1 rounded-md bg-white">
                          <input
                            type="checkbox"
                            checked={bonus?.holdAndSpin?.resetRespins !== false}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  holdAndSpin: ensureBonusDefaults('holdAndSpin', { resetRespins: e.target.checked })
                                }
                              });
                              setActivePreview('holdAndSpin');
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC] uw:w-6 uw:h-6"
                          />
                          <span className="ml-2 text-[#172B4D] uw:text-3xl">Reset Respins on Any Symbol Land</span>
                        </label>
                        <label className="flex items-center border p-1 rounded-md bg-white">
                          <input
                            type="checkbox"
                            checked={bonus?.holdAndSpin?.collectAll}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  holdAndSpin: ensureBonusDefaults('holdAndSpin', { collectAll: e.target.checked })
                                }
                              });
                              setActivePreview('holdAndSpin');
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC] uw:w-6 uw:h-6"
                          />
                          <span className="ml-2 text-[#172B4D] uw:text-3xl">Include Collect All Symbol</span>
                        </label>
                      </div>
                    </div>

                    {/* Right column - Preview */}
                    <div className="w-full md:w-1/2">
                      <div className="flex flex-col items-center">
                        <div className="mb-2 text-sm font-medium text-[#172B4D] flex items-center uw:text-2xl">
                          <span>Live Preview</span>
                          {!previewStates.holdAndSpin && (
                            <button
                              onClick={() => updatePreviewState('holdAndSpin', true)}
                              className="ml-2 text-[#0052CC] hover:text-[#0747A6] transition-colors"
                            >
                              (Show)
                            </button>
                          )}
                        </div>

                        {previewStates.holdAndSpin && activePreview === 'holdAndSpin' ? (
                          <div className="relative">
                            <canvas
                              ref={holdSpinCanvasRef}
                              width={260}
                              height={250}
                              className="border border-[#DFE1E6] rounded-lg shadow-sm uw:w-[380px] uw:h-[370px]"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <button
                                onClick={() => drawHoldAndSpin()}
                                className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                <RefreshCw className="w-5 h-5 text-[#0052CC]" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="w-[300px] h-[300px] border border-dashed border-[#DFE1E6] rounded-lg flex items-center justify-center bg-[#F4F5F7] cursor-pointer hover:bg-[#DEEBFF] transition-colors"
                            onClick={() => updatePreviewState('holdAndSpin', true)}
                          >
                            <div className="text-center p-5">
                              <Coins className="w-10 h-10 text-[#0052CC] mx-auto mb-2" />
                              <p className="text-[#172B4D] font-medium uw:text-3xl">Click to preview your Hold & Spin Bonus</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hold & Spin Trigger */}
                  <div className=" border mt-2 bg-white rounded-md overflow-hidden">
                    <div className="p-3 space-y-3">
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('previewHoldAndSpinBonus', {
                              detail: {
                                feature: 'holdAndSpin',
                                action: 'trigger'
                              }
                            }));
                          }}
                          className="w-full uw:text-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105"
                        >
                          🔄 Trigger Hold & Spin Bonus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Jackpots */}
          <div className="bg-gray-50 rounded-md border border-[#DFE1E6] overflow-hidden shadow-sm">
            <div className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-[#172B4D] uw:text-3xl">Jackpots</h4>
                    <p className="text-sm text-[#5E6C84] uw:text-3xl">Progressive or fixed jackpot prizes</p>
                    <p className="text-xs text-[#8993A4] mt-1 uw:text-3xl">
                      Requires: <span className="font-medium uw:text-3xl">Bonus symbol</span>
                      {hasSymbolType('bonus') ?
                        <span className="text-green-600 ml-1">✓ Generated</span> :
                        <span className="text-orange-600 ml-1">⚠ Not generated</span>
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center mr-2 p-1 px-2 border rounded-md bg-white gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFeatureEnabled('jackpots')}
                      onChange={() => toggleFeatureEnabled('jackpots')}
                      className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC] uw:w-6 uw:h-6"
                    />
                    <span className="text-sm text-[#172B4D] uw:text-3xl">Enable</span>
                  </label>
                </div>
              </div>
            </div>

            {isFeatureEnabled('jackpots') && (
              <div className="px-2 pb-2">
                <div className="pt-2 border-t border-[#DFE1E6]">
                  {/* Jackpot Type */}
                  <div className='flex gap-4'>
                    <div className='border p-2 rounded-md bg-white w-full'>
                      <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                        Jackpot Type
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {['Fixed', 'Progressive'].map((type) => (
                          <button
                            key={type}
                            onClick={() => updateConfig({
                              bonus: {
                                ...config.bonus,
                                jackpots: ensureBonusDefaults('jackpots', {
                                  type: type.toLowerCase() as 'fixed' | 'progressive'
                                })
                              }
                            })}
                            className={`p-2 rounded-lg border uw:text-3xl transition-colors ${config.bonus?.jackpots?.type === type.toLowerCase()
                              ? 'bg-red-50 border-red-500'
                              : 'bg-white'
                              }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Jackpot Levels */}
                    <div className="border p-2 rounded-md bg-white w-full">
                      <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                        Jackpot Levels
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { label: '2 Levels', levels: ['Minor', 'Major'] },
                          { label: '4 Levels', levels: ['Mini', 'Minor', 'Major', 'Grand'] }
                        ].map((option) => (
                          <button
                            key={option.label}
                            onClick={() => updateConfig({
                              bonus: {
                                ...config.bonus,
                                jackpots: ensureBonusDefaults('jackpots', { levels: option.levels })
                              }
                            })}
                            className={`p-2 rounded-lg border uw:text-3xl transition-colors ${JSON.stringify(config.bonus?.jackpots?.levels) === JSON.stringify(option.levels)
                              ? 'bg-red-50 border-red-500'
                              : 'bg-white'
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Trigger Mechanism */}
                  <div className="mt-2 border rounded-md bg-white p-2">
                    <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                      Trigger Mechanism
                    </label>
                    <select
                      value={config.bonus?.jackpots?.trigger || 'random'}
                      onChange={(e) => updateConfig({
                        bonus: {
                          ...config.bonus,
                          jackpots: ensureBonusDefaults('jackpots', {
                            trigger: e.target.value as 'symbol' | 'bonus' | 'random'
                          })
                        }
                      })}
                      className="w-full bg-white border border-[#DFE1E6] rounded-lg px-4 py-2 text-[#172B4D] uw:text-3xl"
                    >
                      <option value="random">Random (Mystery)</option>
                      <option value="symbol">Dedicated Symbols</option>
                      <option value="bonus">Bonus Feature</option>
                    </select>
                  </div>

                  {/* Max Jackpot Values */}
                  {config.bonus?.jackpots?.type === 'fixed' && (
                    <div className="mt-2 border p-2 rounded-md bg-white space-y-1">
                      <label className="block text-sm font-medium text-[#172B4D] mb-2 uw:text-3xl">
                        Jackpot Values (x Bet)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(config.bonus?.jackpots?.levels || ['Minor', 'Major']).map((level) => (
                          <div key={level} className="flex items-center border p-1 bg-gray-50 rounded-md gap-2">
                            <label className="w-20 text-[#172B4D] uw:text-3xl">{level}:</label>
                            <input
                              type="number"
                              min="10"
                              max="100000"
                              value={level === 'Mini' ? 20 : level === 'Minor' ? 100 : level === 'Major' ? 1000 : 10000}
                              className="w-full bg-white border border-[#DFE1E6] rounded-lg px-3 py-1 text-[#172B4D] uw:text-3xl"
                            />
                            {/* <span className="text-[#5E6C84]">x</span> */}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Jackpots Trigger */}
                  <div className=" border mt-2 bg-white rounded-md overflow-hidden">
                    <div className="p-3 space-y-3">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          {(config.bonus?.jackpots?.levels || ['Minor', 'Major']).map((level) => (
                            <button
                              key={level}
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('previewJackpotWin', {
                                  detail: {
                                    feature: 'jackpots',
                                    action: 'trigger',
                                    level: level
                                  }
                                }));
                              }}
                              className="w-full uw:text-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold py-3 px-4 rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all transform hover:scale-105"
                            >
                              💰 {level} Jackpot
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Math Model Impact */}
      <div className="bg-white rounded-lg p-0  border border-[#DFE1E6] shadow-sm">
        <div
          className="w-full bg-gray-50 border-l-4 border-l-red-500 p-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors mb-"
        >
          <div className="flex flex-col items-start">
            <h3 className="text-lg font-semibold text-gray-900 uw:text-3xl">Math Model Impact</h3>
            <p className="text-sm text-[#5E6C84] mt-1 uw:text-3xl">Feature contribution to overall game math</p>

          </div>
          <button className="p-2 text-[#5E6C84] hover:text-[#172B4D] transition-colors">
          </button>
        </div>

        <div className="grid grid-cols-3 p-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-[#5E6C84] uw:text-3xl">Feature RTP</div>
            <div className="text-2xl font-bold text-[#172B4D] uw:text-3xl">{mathModel.featureRTP.toFixed(1)}%</div>
            <div className="text-xs text-[#5E6C84] mt-1 uw:text-2xl">of total {(config as any).mathModel?.rtp || 96}% RTP</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-[#5E6C84] uw:text-3xl">Hit Frequency</div>
            <div className="text-2xl font-bold text-[#172B4D] uw:text-3xl">1:{Math.round(1 / mathModel.hitFrequency)}</div>
            <div className="text-xs text-[#5E6C84] mt-1 uw:text-2xl">spins per feature</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-[#5E6C84] uw:text-3xl">Win Potential</div>
            <div className="text-2xl font-bold text-[#172B4D] uw:text-4xl">{mathModel.maxWin.toLocaleString()}x</div>
            <div className="text-xs text-[#5E6C84] mt-1 uw:text-2xl">maximum feature win</div>
          </div>
        </div>

        {/* Feature Warnings */}
        {(() => {
          const enabledCount = ['freeSpins', 'pickAndClick', 'wheel', 'holdAndSpin', 'jackpots']
            .filter(f => isFeatureEnabled(f)).length;
          return enabledCount >= 3 && (
            <div className="mt-6 p-4 bg-[#FFFAE6] border border-[#FF991F] rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#FF8B00] mt-0.5" />
              <div>
                <h5 className="font-medium text-[#172B4D]">Maximum Features Reached</h5>
                <p className="text-sm text-[#5E6C84] mt-1 uw:text-2xl">
                  You have enabled {enabledCount} bonus features (maximum allowed).
                  To enable additional features, please disable one of the current features first.
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Spacer div to maintain consistent spacing */}
      <div className="mt-10 bg-gray-50 h-2"></div>

      {/* Feature Limit Modal */}
      {showFeatureLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 uw:text-4xl">Maximum Features Reached</h3>
                  <p className="text-sm text-gray-600 uw:text-3xl">Feature limit exceeded</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-gray-700">
                  You have already selected the maximum of 3 bonus features. Please disable one feature before enabling another.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowFeatureLimitModal(false)}
                  className="px-4 py-2"
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowFeatureLimitModal(false)}
                  className="px-4 py-2"
                >
                  Okay
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pick & Click Bonus Confirmation Modal */}
      {showPickClickConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-2xl max-w-lg w-full mx-4 border-4 border-yellow-400 animate-scaleIn">
            <div className="p-8">
              {/* Header with Icon */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
                  <Gift className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 text-center uw:text-5xl">
                  🎉 BONUS TRIGGERED! 🎉
                </h2>
              </div>

              {/* Bonus Symbol Display */}
              <div className="mb-6 bg-white rounded-xl p-6 shadow-inner">
                <div className="flex justify-center items-center gap-4 mb-4">
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-lg flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                        <Gift className="w-10 h-10 text-white uw:w-10 uw:h-10" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md uw:text-2xl">
                        {num}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-gray-700 font-semibold text-lg uw:text-3xl">
                  You landed 3 Bonus Symbols!
                </p>
              </div>

              {/* Message */}
              <div className="mb-6 text-center">
                <p className="text-gray-800 text-lg font-medium mb-2 uw:text-4xl">
                  Congratulations! 🎊
                </p>
                <p className="text-gray-600">
                  You've won the <span className="font-bold text-orange-600">Pick & Click Bonus Game</span>!
                </p>
                <p className="text-gray-600 mt-2">
                  Get ready to pick from the grid and reveal amazing prizes!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  variant="secondary"
                  onClick={() => setShowPickClickConfirmation(false)}
                  className="px-6 py-3 text-base"
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowPickClickConfirmation(false)}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-base font-bold shadow-lg"
                >
                  Let's Play! 🎮
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonusFeatures;