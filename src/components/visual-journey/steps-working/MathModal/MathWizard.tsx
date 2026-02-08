import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useGameStore } from '../../../../store';
import { getDefaultPaytable } from '../../../../utils/paytableDefaults';
import { getPaytableFields, getPaytableFieldLabel, validatePaytableValue } from '../../../../utils/paytableHelpers';
import {
  Download,
  ChevronDown,
  ChevronUp,
  Shield,
  Target,
  Zap,
  DollarSign,
  Trophy,
  Activity,
  Sparkles,
  Crown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../ui/Card';
import { Button } from '../../../ui/UIButton';
import { Badge } from '../../../ui/Badge';
import { Progress } from '../../../ui/Progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../ui/Select';
import { Slider } from '../../../ui/Slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../ui/Dialog';
import type { RTPProfile, EditableFeatureContribution, FeatureSettings, VolatilityControls, SymbolPay } from './types/math';
import type { Step12Configuration, ReelStrip, ReelSymbol } from './types/step12';
import {
  mockMathSummary,
  mockDistribution,
  mockSymbolPays,
  mockCompliance,
  mockStep12Configuration,
  mockReelSymbols,
  mockReelStrips
} from './lib/mathMocks';
import { RTPSplitCard } from './sections/RTPSplitCard';
import { SymbolPaytable } from './sections/SymbolPaytable';
import { RTPBalancing } from './sections/RTPBalancing';
import { HitDistribution } from './sections/HitDistribution';
import { FeatureConfiguration } from './sections/FeatureConfiguration';
import { VolatilityTuning } from './sections/VolatilityTuning';
import { MarketCompliance } from './sections/MarketCompliance';
import { ReelStripEditor } from './sections/ReelStripEditor';

interface MathWizardProps {
  className?: string;
}

export function MathWizard({ className }: MathWizardProps) {
  const [rtpProfile, setRtpProfile] = useState<RTPProfile>(0.96);
  const selectedFeatureTemplate = useGameStore((state) => state.selectedFeatureTemplate);
  const setSelectedFeatureTemplate = useGameStore((state) => state.setSelectedFeatureTemplate);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Local state for temporary paytable input values
  const [tempPaytables, setTempPaytables] = useState<Record<number, Record<string, string>>>({});

  const isFeatureEnabled = (feature: string) => {
    return config?.bonus?.[feature]?.enabled === true;
  };
  // Get symbols from gameStore
  const config = useGameStore((state) => state.config);
  const updateConfig = useGameStore((state) => state.updateConfig);

  // Convert gameStore symbols to ReelSymbol format
  const reelSymbols = useMemo<ReelSymbol[]>(() => {
    const storeSymbols = config?.theme?.generated?.symbols;

    if (!storeSymbols) {
      return mockReelSymbols();
    }

    // Handle array format (legacy)
    if (Array.isArray(storeSymbols)) {
      if (storeSymbols.length === 0) return mockReelSymbols();

      return storeSymbols.map((symbolUrl, index) => ({
        id: `symbol_${index}`,
        name: `Symbol ${index + 1}`,
        icon: symbolUrl,
        type: index === 0 ? 'wild' : index === 1 ? 'scatter' : 'regular',
        rarity: (index < 2 ? 'epic' : index < 4 ? 'rare' : index < 7 ? 'uncommon' : 'common') as 'epic' | 'rare' | 'uncommon' | 'common'
      }));
    }

    // Handle object format (key-based)
    const symbolEntries = Object.entries(storeSymbols);
    if (symbolEntries.length === 0) return mockReelSymbols();

    return symbolEntries.map(([key, symbolUrl], index) => ({
      id: key,
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: symbolUrl,
      type: key.includes('wild') ? 'wild' : key.includes('scatter') ? 'scatter' : 'regular',
      rarity: (index < 2 ? 'epic' : index < 4 ? 'rare' : index < 7 ? 'uncommon' : 'common') as 'epic' | 'rare' | 'uncommon' | 'common'
    }));
  }, [config?.theme?.generated?.symbols]);

  // Step 12 Configuration (imported)
  const [step12Config] = useState<Step12Configuration>(mockStep12Configuration());

  // Get dynamic grid configuration from game store
  const gridConfig = useMemo(() => {
    const reels = config?.reels?.layout?.reels || 5;
    const rows = config?.reels?.layout?.rows || 3;
    const gridConfig = {
      width: reels,
      height: rows,
      label: `${reels}×${rows}`
    };
    console.log('[MathWizard] Grid config updated:', gridConfig);
    return gridConfig;
  }, [config?.reels?.layout?.reels, config?.reels?.layout?.rows]);

  // Helper function to generate new reel strips
  const generateReelStrips = useCallback((reelSymbols: ReelSymbol[], gridConfig: { width: number; height: number; label: string }) => {
    if (reelSymbols.length === 0) {
      return mockReelStrips(gridConfig);
    }

    const reelLength = 32;
    const reelCount = gridConfig.width;

    return Array.from({ length: reelCount }, (_, reelIndex) => {
      const symbols: string[] = [];

      // Create weighted distribution based on symbol rarity
      reelSymbols.forEach(symbol => {
        let count = 0;
        switch (symbol.rarity) {
          case 'epic':
            count = Math.max(1, Math.floor(reelLength * 0.03)); // 3% of reel
            break;
          case 'rare':
            count = Math.max(2, Math.floor(reelLength * 0.06)); // 6% of reel
            break;
          case 'uncommon':
            count = Math.max(4, Math.floor(reelLength * 0.12)); // 12% of reel
            break;
          case 'common':
            count = Math.max(8, Math.floor(reelLength * 0.25)); // 25% of reel
            break;
          default:
            count = Math.max(4, Math.floor(reelLength * 0.10)); // 10% of reel
        }

        for (let i = 0; i < count; i++) {
          symbols.push(symbol.id);
        }
      });

      // Fill remaining positions with random symbols to reach exactly 32
      while (symbols.length < reelLength) {
        const randomSymbol = reelSymbols[Math.floor(Math.random() * reelSymbols.length)];
        symbols.push(randomSymbol.id);
      }

      // Ensure we have exactly 32 symbols
      symbols.splice(reelLength);

      // Shuffle the symbols
      for (let i = symbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
      }

      return {
        reelIndex,
        symbols: symbols.slice(0, reelLength),
        length: symbols.length
      };
    });
  }, []);

  // Initialize reelStrips - load from store if available, otherwise generate
  const [reelStrips, setReelStrips] = useState<ReelStrip[]>(() => {
    // Try to load from store first
    const storedReelStrips = config?.theme?.generated?.reelStrips;
    if (storedReelStrips && Array.isArray(storedReelStrips) && storedReelStrips.length > 0) {
      console.log('[MathWizard] Loading reel strips from store:', {
        count: storedReelStrips.length,
        firstReelLength: storedReelStrips[0]?.symbols?.length || 0
      });
      return storedReelStrips;
    }

    // Generate new reel strips if none stored
    console.log('[MathWizard] No stored reel strips found, generating new ones');
    return generateReelStrips(reelSymbols, gridConfig);
  });

  // Track if this is the initial load to avoid saving on mount
  const isInitialLoadRef = useRef(true);

  // Save reel strips to store whenever they change (but not on initial load)
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    if (reelStrips.length > 0) {
      // Check if reel strips actually changed from what's in store
      const storedReelStrips = config?.theme?.generated?.reelStrips;
      const storedJson = JSON.stringify(storedReelStrips);
      const currentJson = JSON.stringify(reelStrips);

      // Only save if they're different
      if (storedJson !== currentJson) {
        // Update store with current reel strips
        updateConfig({
          theme: {
            ...config.theme,
            generated: {
              ...config.theme?.generated,
              reelStrips: reelStrips
            }
          }
        });

        console.log('[MathWizard] Saved reel strips to store:', {
          count: reelStrips.length,
          firstReelLength: reelStrips[0]?.symbols?.length || 0
        });
      }

      // Always dispatch event for preview updates
      window.dispatchEvent(new CustomEvent('reelStripsUpdated', {
        detail: {
          reelStrips: reelStrips,
          symbolMapping: config?.theme?.generated?.symbols || {},
          timestamp: Date.now()
        }
      }));
    }
  }, [reelStrips, updateConfig, config?.theme]);

  // Regenerate reel strips only if grid config changes (number of reels changes)
  // or if symbols change and we don't have stored reel strips
  useEffect(() => {
    const storedReelStrips = config?.theme?.generated?.reelStrips;
    const hasStoredStrips = storedReelStrips && Array.isArray(storedReelStrips) && storedReelStrips.length > 0;
    const storedReelCount = hasStoredStrips ? storedReelStrips.length : 0;
    const currentReelCount = gridConfig.width;

    if (reelSymbols.length > 0 && (!hasStoredStrips || storedReelCount !== currentReelCount)) {
      console.log('[MathWizard] Regenerating reel strips due to config change:', {
        hasStoredStrips,
        storedReelCount,
        currentReelCount
      });

      const newReelStrips = generateReelStrips(reelSymbols, gridConfig);
      setReelStrips(newReelStrips);
    }
  }, [reelSymbols, gridConfig.width, config?.theme?.generated?.reelStrips, generateReelStrips]);

  // Enhanced Reel Strip Visualization State
  const [reelView, setReelView] = useState<'frequency' | 'sequence'>('frequency');
  const [sortBy, setSortBy] = useState<'position' | 'symbol' | 'frequency' | 'value'>('position');
  const [filterSymbol, setFilterSymbol] = useState<string>('all');
  const [editingPosition, setEditingPosition] = useState<{ reel: number, position: number } | null>(null);

  // Demo Enhancement States
  const [mathSimplified, setMathSimplified] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Math-only controls state (based on Step 12 features)
  const getInitialFeatureRTP = () => {
    const features = step12Config.features.filter(f => f.enabled);

    return {
      basePct: 68,
      // Allocate RTP based on actual Step 12 features
      fsPct: features.find(f => f.type === 'free_spins') ? 18 : 0,
      pickPct: features.find(f => f.type === 'pick_bonus') ? 8 : 0,
      wheelPct: features.find(f => f.type === 'wheel') ? 4 : 0,
      holdPct: features.find(f => f.type === 'hold_win') ? 2 : 0,
      respinPct: features.find(f => f.type === 'respin') ? 4 : 0,
      constraints: {
        basePctRange: [50, 80] as [number, number],
        featuresTotalRange: [20, 50] as [number, number]
      }
    };
  };

  const [editableFeatures, setEditableFeatures] = useState<EditableFeatureContribution>(getInitialFeatureRTP());

  // Convert symbols to paytable format - read from store or use defaults
  const getInitialSymbolPays = useCallback(() => {
    const storedPaytables = config?.theme?.generated?.symbolPaytables || {};
    const reelCount = gridConfig.width;

    return reelSymbols.map(symbol => {
      const key = symbol.id;
      const paytable = storedPaytables[key] || getDefaultPaytable(symbol.rarity, reelCount);

      return {
        symbol: symbol.name,
        icon: symbol.icon,
        pay3: paytable.pay3 || 0,
        pay4: paytable.pay4 || 0,
        pay5: paytable.pay5 || 0,
        pay6: paytable.pay6 || 0,
        pay7: paytable.pay7 || 0,
        frequency: symbol.rarity === 'epic' ? 2.1 :
          symbol.rarity === 'rare' ? 4.2 :
            symbol.rarity === 'uncommon' ? 8.5 :
              symbol.rarity === 'common' ? 15.2 : 12.8
      };
    });
  }, [reelSymbols, config?.theme?.generated?.symbolPaytables, gridConfig.width]);

  const [symbolPaysState, setSymbolPaysState] = useState(() => getInitialSymbolPays());

  // Update symbolPaysState when reelSymbols change
  useEffect(() => {
    setSymbolPaysState(getInitialSymbolPays());
  }, [reelSymbols, getInitialSymbolPays]);

  const [volatilityControls, setVolatilityControls] = useState<VolatilityControls>({
    bigWinConcentration: 65,
    hitRateVsWinSize: 45,
    featurePowerVsTrigger: 70
  });

  // Feature Settings State (based on Step 12 configuration)
  const getInitialFeatureSettings = (): FeatureSettings => ({
    freeSpins: {
      triggerRate: 112,
      averageSpins: 12,
      multiplierRange: [2, 5],
      retriggerRate: 0.15
    },
    pickBonus: {
      triggerRate: 250,
      picks: 3,
      avgMultiplier: 8
    },
    wheel: {
      triggerRate: 400,
      segments: 8,
      maxMultiplier: 50
    },
    holdWin: {
      triggerRate: 500,
      avgSymbols: 6,
      maxSymbols: 15
    }
  });

  const [featureSettings, setFeatureSettings] = useState<FeatureSettings>(getInitialFeatureSettings());

  // Computed volatility based on controls
  const computedVolatility = Math.max(1, Math.min(10,
    Math.round((volatilityControls.bigWinConcentration + volatilityControls.featurePowerVsTrigger) / 20)
  ));

  // Business Intelligence Calculations
  const businessMetrics = {
    // Revenue projections based on math model
    weeklyGGRPerK: Math.round(2400 * (rtpProfile * 0.85) * (computedVolatility / 10) * 1.2),
    monthlyRevProjection: Math.round(2400 * (rtpProfile * 0.85) * (computedVolatility / 10) * 1.2 * 4.3 * 50), // 50K players
    competitorBeats: Math.round(45 + (computedVolatility * 3.2) + (rtpProfile * 100 - 92) * 8),
    developmentCostROI: Math.round(180 + (step12Config.features.filter(f => f.enabled).length * 30)),
    timeToMarket: Math.max(8, 16 - (step12Config.features.filter(f => f.enabled).length * 2)),

    // Market positioning
    playerRetention: Math.round(72 + (computedVolatility * 2.1) - ((rtpProfile * 100 - 94) * 3)),
    sessionLength: Math.round(8.5 + (computedVolatility * 0.8) - ((rtpProfile * 100 - 95) * 2)),

    // Risk assessment
    regulatoryRisk: step12Config.maxWin > 5000 ? 'HIGH' : step12Config.maxWin > 2000 ? 'MEDIUM' : 'LOW',
    complianceScore: Math.round(85 + (rtpProfile * 100 - 88) * 2.5 - (step12Config.maxWin > 3000 ? 10 : 0))
  };
  // Computed values based on user adjustments
  const mathSummary = {
    ...mockMathSummary(rtpProfile),
    rtpSplit: { base: editableFeatures.basePct, features: 100 - editableFeatures.basePct },
    volatility10: computedVolatility
  };
  const distribution = mockDistribution();
  const compliance = mockCompliance();

  // Interactive control handlers
  const updateFeatureRTP = useCallback((feature: keyof Omit<EditableFeatureContribution, 'constraints'>, value: number) => {
    setEditableFeatures(prev => {
      const updated = { ...prev, [feature]: value };

      // Calculate available feature RTP (100% - base game)
      const availableFeatureRTP = 100 - updated.basePct;

      // Calculate total of enabled features only
      let enabledFeaturesTotal = 0;
      if (isFeatureEnabled('freeSpins')) enabledFeaturesTotal += updated.fsPct;
      if (isFeatureEnabled('pickAndClick')) enabledFeaturesTotal += updated.pickPct;
      if (isFeatureEnabled('wheel')) enabledFeaturesTotal += updated.wheelPct;
      if (isFeatureEnabled('holdAndSpin')) enabledFeaturesTotal += updated.holdPct;
      if (isFeatureEnabled('respin')) enabledFeaturesTotal += updated.respinPct;

      // If updating base game, we need to adjust features proportionally
      if (feature === 'basePct') {
        const currentFeatureTotal =
          (isFeatureEnabled('freeSpins') ? prev.fsPct : 0) +
          (isFeatureEnabled('pickAndClick') ? prev.pickPct : 0) +
          (isFeatureEnabled('wheel') ? prev.wheelPct : 0) +
          (isFeatureEnabled('holdAndSpin') ? prev.holdPct : 0) +
          (isFeatureEnabled('respin') ? prev.respinPct : 0);

        // If new available RTP is less than current feature total, scale down features proportionally
        if (availableFeatureRTP < currentFeatureTotal && currentFeatureTotal > 0) {
          const scaleFactor = availableFeatureRTP / currentFeatureTotal;
          if (isFeatureEnabled('freeSpins')) updated.fsPct = prev.fsPct * scaleFactor;
          if (isFeatureEnabled('pickAndClick')) updated.pickPct = prev.pickPct * scaleFactor;
          if (isFeatureEnabled('wheel')) updated.wheelPct = prev.wheelPct * scaleFactor;
          if (isFeatureEnabled('holdAndSpin')) updated.holdPct = prev.holdPct * scaleFactor;
          if (isFeatureEnabled('respin')) updated.respinPct = prev.respinPct * scaleFactor;
        }
      } else {
        // When updating a feature, ensure total doesn't exceed available RTP
        if (enabledFeaturesTotal > availableFeatureRTP) {
          // Clamp the feature value to not exceed available RTP
          const currentFeatureValue = feature === 'fsPct' ? updated.fsPct :
            feature === 'pickPct' ? updated.pickPct :
              feature === 'wheelPct' ? updated.wheelPct :
                feature === 'holdPct' ? updated.holdPct :
                  feature === 'respinPct' ? updated.respinPct : 0;
          const otherFeaturesTotal = enabledFeaturesTotal - currentFeatureValue;
          const maxForThisFeature = Math.max(0, availableFeatureRTP - otherFeaturesTotal);
          const clampedValue = Math.min(value, maxForThisFeature);

          if (feature === 'fsPct') updated.fsPct = clampedValue;
          else if (feature === 'pickPct') updated.pickPct = clampedValue;
          else if (feature === 'wheelPct') updated.wheelPct = clampedValue;
          else if (feature === 'holdPct') updated.holdPct = clampedValue;
          else if (feature === 'respinPct') updated.respinPct = clampedValue;
        }
      }

      return updated;
    });
  }, [isFeatureEnabled]);

  const updateSymbolPay = useCallback((symbolIndex: number, field: keyof SymbolPay, value: string) => {
    const reelCount = gridConfig.width;
    const fields = getPaytableFields(reelCount);

    // Update local temp state only
    setTempPaytables(prev => {
      const current = symbolPaysState[symbolIndex];
      const updated: Record<string, string> = {};

      fields.forEach(f => {
        updated[f] = f === field ? value : (prev[symbolIndex]?.[f] || (current as any)[f]?.toString() || '0');
      });

      return {
        ...prev,
        [symbolIndex]: updated
      };
    });
  }, [symbolPaysState, gridConfig.width]);

  const saveSymbolPay = useCallback((symbolIndex: number, field: keyof SymbolPay, value: string) => {
    const numValue = parseFloat(value) || 0;
    const symbol = reelSymbols[symbolIndex];
    if (!symbol) return;

    const reelCount = gridConfig.width;
    const fields = getPaytableFields(reelCount);
    const currentPays = symbolPaysState[symbolIndex];

    // Build current pays object for validation
    const paysForValidation: Record<string, number> = {};
    fields.forEach(f => {
      paysForValidation[f] = tempPaytables[symbolIndex]?.[f] !== undefined
        ? parseFloat(tempPaytables[symbolIndex][f])
        : ((currentPays as any)[f] || 0);
    });
    paysForValidation[field] = numValue;

    // Validation
    if (!validatePaytableValue(field, numValue, paysForValidation)) {
      alert(`Invalid value for ${getPaytableFieldLabel(field)}. Values must be in ascending order (3-of-kind ≤ 4-of-kind ≤ 5-of-kind).`);
      setTempPaytables(prev => {
        const updated = { ...prev };
        delete updated[symbolIndex];
        return updated;
      });
      return;
    }

    // Update state
    setSymbolPaysState(prev => {
      const updated = [...prev];
      updated[symbolIndex] = { ...updated[symbolIndex], [field]: numValue };
      return updated;
    });

    // Update store with only relevant fields
    const storedPaytables = config?.theme?.generated?.symbolPaytables || {};
    const key = symbol.id;
    const updatedPaytable: Record<string, number> = {};
    fields.forEach(f => {
      updatedPaytable[f] = f === field ? numValue : ((currentPays as any)[f] || 0);
    });

    // Ensure all required fields are present
    const completePaytable = {
      pay3: updatedPaytable.pay3 || 0,
      pay4: updatedPaytable.pay4 || 0,
      pay5: updatedPaytable.pay5 || 0,
      pay6: updatedPaytable.pay6 || 0,
      pay7: updatedPaytable.pay7 || 0
    };

    updateConfig({
      theme: {
        ...config.theme,
        generated: {
          ...config.theme?.generated,
          symbolPaytables: {
            ...storedPaytables,
            [key]: completePaytable
          }
        }
      }
    });

    // Dispatch paytable update event
    const newStoredPaytables = {
      ...storedPaytables,
      [key]: completePaytable
    };
    window.dispatchEvent(new CustomEvent('paytableUpdated', {
      detail: { symbolPaytables: newStoredPaytables }
    }));

    // Clear temp state
    setTempPaytables(prev => {
      const updated = { ...prev };
      delete updated[symbolIndex];
      return updated;
    });
  }, [symbolPaysState, reelSymbols, config, updateConfig, tempPaytables]);

  const updateFeatureSetting = useCallback((feature: keyof FeatureSettings, field: string, value: number) => {
    setFeatureSettings(prev => ({
      ...prev,
      [feature]: { ...prev[feature], [field]: value }
    }));
  }, []);

  const updateVolatilityControl = useCallback((control: keyof VolatilityControls, value: number) => {
    setVolatilityControls(prev => ({ ...prev, [control]: value }));
  }, []);

  // Professional Reel Strip Manipulation Functions
  const updateSymbolCount = useCallback((reelIndex: number, symbolId: string, newCount: number) => {
    setReelStrips(prev => {
      const updated = [...prev];
      const reel = { ...updated[reelIndex] };

      // Remove all instances of this symbol
      const filteredSymbols = reel.symbols.filter(id => id !== symbolId);

      // Add new instances at random positions
      const newSymbols = [...filteredSymbols];
      for (let i = 0; i < newCount; i++) {
        const randomIndex = Math.floor(Math.random() * (newSymbols.length + 1));
        newSymbols.splice(randomIndex, 0, symbolId);
      }

      // Update reel length to maintain 32 positions
      while (newSymbols.length < 32) {
        // Fill with low-value symbols
        const fillSymbol = ['ten', 'jack', 'queen'][Math.floor(Math.random() * 3)];
        const randomIndex = Math.floor(Math.random() * newSymbols.length);
        newSymbols.splice(randomIndex, 0, fillSymbol);
      }

      // Trim to exactly 32 if over
      while (newSymbols.length > 32) {
        const randomIndex = Math.floor(Math.random() * newSymbols.length);
        newSymbols.splice(randomIndex, 1);
      }

      reel.symbols = newSymbols;
      reel.length = newSymbols.length;
      updated[reelIndex] = reel;

      // Dispatch reel strip update event
      window.dispatchEvent(new CustomEvent('reelStripsUpdated', {
        detail: {
          reelStrips: updated,
          symbolMapping: config?.theme?.generated?.symbols || {},
          timestamp: Date.now()
        }
      }));

      return updated;
    });
  }, [config?.theme?.generated?.symbols]);

  const autoBalanceReelStrips = useCallback(() => {
    if (reelSymbols.length === 0) return;

    setReelStrips(prev => {
      const updated = prev.map((reel, reelIndex) => {
        const newSymbols: string[] = [];
        const reelLength = 32;

        // Create balanced distribution based on symbol rarity
        reelSymbols.forEach(symbol => {
          let count = 0;
          switch (symbol.rarity) {
            case 'epic':
              count = Math.max(1, Math.floor(reelLength * 0.03)); // 3% of reel
              break;
            case 'rare':
              count = Math.max(2, Math.floor(reelLength * 0.06)); // 6% of reel
              break;
            case 'uncommon':
              count = Math.max(3, Math.floor(reelLength * 0.12)); // 12% of reel
              break;
            case 'common':
              count = Math.max(6, Math.floor(reelLength * 0.25)); // 25% of reel
              break;
            default:
              count = Math.max(3, Math.floor(reelLength * 0.10)); // 10% of reel
          }

          // Add symbols to reel
          for (let i = 0; i < count; i++) {
            newSymbols.push(symbol.id);
          }
        });

        // Fill remaining positions to reach exactly 32
        while (newSymbols.length < reelLength) {
          const commonSymbols = reelSymbols.filter(s => s.rarity === 'common');
          const fillSymbol = commonSymbols.length > 0
            ? commonSymbols[Math.floor(Math.random() * commonSymbols.length)].id
            : reelSymbols[Math.floor(Math.random() * reelSymbols.length)].id;
          newSymbols.push(fillSymbol);
        }

        // Trim to exactly 32 if over
        newSymbols.splice(reelLength);

        // Shuffle using Fisher-Yates algorithm
        for (let i = newSymbols.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newSymbols[i], newSymbols[j]] = [newSymbols[j], newSymbols[i]];
        }

        return {
          reelIndex,
          symbols: newSymbols,
          length: newSymbols.length
        };
      });

      // Dispatch reel strip update event
      window.dispatchEvent(new CustomEvent('reelStripsUpdated', {
        detail: {
          reelStrips: updated,
          symbolMapping: config?.theme?.generated?.symbols || {},
          timestamp: Date.now()
        }
      }));

      return updated;
    });
  }, [reelSymbols, config?.theme?.generated?.symbols]);

  const calculateReelMetrics = useCallback((reelIndex: number) => {
    const reel = reelStrips[reelIndex];
    if (!reel) return null;

    const metrics = {
      totalPositions: reel.length,
      symbolCounts: {} as Record<string, number>,
      hitRate: 0,
      volatilityFactor: 0
    };

    // Count symbol frequencies
    reel.symbols.forEach(symbolId => {
      metrics.symbolCounts[symbolId] = (metrics.symbolCounts[symbolId] || 0) + 1;
    });

    // Debug logging
    if (reelIndex === 0) { // Only log for first reel to avoid spam
      console.log(`[MathWizard] Reel ${reelIndex + 1} metrics:`, {
        totalPositions: metrics.totalPositions,
        symbolCounts: metrics.symbolCounts,
        totalSymbols: Object.values(metrics.symbolCounts).reduce((sum, count) => sum + count, 0)
      });
    }

    // Calculate basic hit rate (simplified)
    const highValueSymbols = ['wild', 'scatter', 'pharaoh', 'cleopatra'];
    const highValueCount = Object.entries(metrics.symbolCounts)
      .filter(([symbolId]) => highValueSymbols.includes(symbolId))
      .reduce((sum, [, count]) => sum + count, 0);

    metrics.hitRate = (highValueCount / reel.length) * 100;
    metrics.volatilityFactor = Math.abs(metrics.hitRate - 25); // Deviation from 25% baseline

    return metrics;
  }, [reelStrips]);

  // Enhanced reel visualization functions
  const updateSymbolAtPosition = useCallback((reelIndex: number, position: number, newSymbolId: string) => {
    setReelStrips(prev => {
      const updated = [...prev];
      const reel = { ...updated[reelIndex] };
      const newSymbols = [...reel.symbols];
      newSymbols[position] = newSymbolId;
      reel.symbols = newSymbols;
      reel.length = newSymbols.length;
      updated[reelIndex] = reel;
      return updated;
    });
    setEditingPosition(null);
  }, []);

  // New functions for vertical reel management
  const insertSymbolAtPosition = useCallback((reelIndex: number, position: number, symbolId: string = 'ten') => {
    setReelStrips(prev => {
      const updated = [...prev];
      const reel = { ...updated[reelIndex] };
      const newSymbols = [...reel.symbols];
      newSymbols.splice(position, 0, symbolId);
      reel.symbols = newSymbols;
      reel.length = newSymbols.length; 
      updated[reelIndex] = reel;
      return updated;
    });
  }, []);

  const removeSymbolAtPosition = useCallback((reelIndex: number, position: number) => {
    setReelStrips(prev => {
      const updated = [...prev];
      const reel = { ...updated[reelIndex] };
      if (reel.symbols.length > 16) {
        const newSymbols = [...reel.symbols];
        newSymbols.splice(position, 1);
        reel.symbols = newSymbols;
        reel.length = newSymbols.length; // Update length property
        updated[reelIndex] = reel;
      }
      return updated;
    });
    setEditingPosition(null);
  }, []);

  const moveSymbol = useCallback((reelIndex: number, fromPosition: number, toPosition: number) => {
    if (fromPosition === toPosition) return;

    setReelStrips(prev => {
      const updated = [...prev];
      const reel = { ...updated[reelIndex] };
      const newSymbols = [...reel.symbols];
      const [movedSymbol] = newSymbols.splice(fromPosition, 1);
      newSymbols.splice(toPosition, 0, movedSymbol);
      reel.symbols = newSymbols;
      updated[reelIndex] = reel;
      return updated;
    });
  }, []);

  // Drag and drop state
  const [draggedSymbol, setDraggedSymbol] = useState<{ reelIndex: number, position: number } | null>(null);

  const getSymbolDisplayName = useCallback((symbolId: string) => {
    const allSymbols = [...reelSymbols, ...reelSymbols.map(s => ({ ...s, id: `${s.id}_fs`, name: s.name }))];
    const symbol = allSymbols.find(s => s.id === symbolId);
    if (!symbol) return symbolId.toUpperCase();

    // Shortened display names for sequence view
    const shortNames = {
      'wild': 'W',
      'scatter': 'S',
      'pharaoh': 'H1',
      'cleopatra': 'H2',
      'anubis': 'M1',
      'eye': 'M2',
      'ankh': 'M3',
      'ace': 'L1',
      'king': 'L2',
      'queen': 'L3',
      'jack': 'L4',
      'ten': 'L5'
    };

    return shortNames[symbolId as keyof typeof shortNames] || symbolId.toUpperCase();
  }, [reelSymbols]);

  const getFilteredAndSortedPositions = useCallback((reel: ReelStrip) => {
    let positions = reel.symbols.map((symbolId, index) => ({
      position: index,
      symbolId,
      symbol: [...reelSymbols, ...reelSymbols.map(s => ({ ...s, id: `${s.id}_fs`, name: s.name }))].find(s => s.id === symbolId),
      displayName: getSymbolDisplayName(symbolId)
    }));

    // Filter by symbol if selected
    if (filterSymbol !== 'all') {
      positions = positions.filter(p => p.symbolId === filterSymbol);
    }

    // Sort based on selection
    switch (sortBy) {
      case 'position':
        return positions.sort((a, b) => a.position - b.position);
      case 'symbol':
        return positions.sort((a, b) => a.displayName.localeCompare(b.displayName));
      case 'frequency':
        const frequencies: Record<string, number> = {};
        reel.symbols.forEach(s => {
          frequencies[s] = (frequencies[s] || 0) + 1;
        });
        return positions.sort((a, b) => frequencies[b.symbolId] - frequencies[a.symbolId]);
      case 'value':
        return positions.sort((a, b) => {
          const aValue = a.symbol?.rarity === 'epic' ? 4 :
            a.symbol?.rarity === 'rare' ? 3 :
              a.symbol?.rarity === 'uncommon' ? 2 : 1;
          const bValue = b.symbol?.rarity === 'epic' ? 4 :
            b.symbol?.rarity === 'rare' ? 3 :
              b.symbol?.rarity === 'uncommon' ? 2 : 1;
          return bValue - aValue;
        });
      default:
        return positions;
    }
  }, [reelSymbols, getSymbolDisplayName, filterSymbol, sortBy]);

  // Feature Balance Templates (Demo)
  const featureBalanceTemplates = {
    'high_retrigger': {
      name: 'High Retrigger Build',
      description: 'Focus on frequent feature triggers',
      icon: <Zap className="h-4 w-4" />,
      settings: { fsPct: 25, pickPct: 5, wheelPct: 2, holdPct: 0, respinPct: 5 },
      bestFor: 'Player retention, session length'
    },
    'big_win_chase': {
      name: 'Big Win Chase',
      description: 'Lower frequency, higher power features',
      icon: <Trophy className="h-4 w-4" />,
      settings: { fsPct: 15, pickPct: 12, wheelPct: 8, holdPct: 15, respinPct: 2 },
      bestFor: 'High volatility players, jackpot appeal'
    },
    'balanced_appeal': {
      name: 'Balanced Appeal',
      description: 'Optimal balance for broad market',
      icon: <Target className="h-4 w-4" />,
      settings: { fsPct: 18, pickPct: 8, wheelPct: 4, holdPct: 2, respinPct: 5 },
      bestFor: 'Mass market appeal, proven retention'
    }
  };

  const applyFeatureTemplate = useCallback(
    (templateKey: keyof typeof featureBalanceTemplates) => {
      const template = featureBalanceTemplates[templateKey];

      //  Store me selected template save karo
      setSelectedFeatureTemplate(templateKey);

      //  Apply template settings
      setEditableFeatures((prev) => ({
        ...prev,
        ...template.settings,
        basePct:
          100 -
          Object.values(template.settings).reduce((sum, val) => sum + val, 0),
      }));
    },
    []
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={["h-full overflow-auto relative no-select", className].filter(Boolean).join(" ")}>
      {/* Header */}
      <header className="sticky top-0 w-full z-30 bg-white border-b border-gray-200 shadow">
        <div className="border px-4 py-2">
          <div className="flex items-center gap-4">
            {/* Basic/Advanced Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs uw:text-3xl text-gray-600">View:</span>
              <div className='flex bg-gray-100 rounded p-0.5'>
                <button
                  onClick={() => setShowAdvanced(false)}
                  className={["px-2 py-1 text-xs uw:text-2xl rounded transition-all",
                    showAdvanced ? "text-gray-600 hover:text-gray-800" : "bg-white text-gray-900 shadow-sm"
                  ].filter(Boolean).join(" ")}
                >
                  Basic
                </button>
                <button
                  onClick={() => setShowAdvanced(true)}
                  className={[
                    "px-2 py-1 text-xs uw:text-2xl uw:ml-10 rounded transition-all",
                    !showAdvanced ? "text-gray-600 hover:text-gray-800" : "bg-white text-gray-900 shadow-sm"
                  ].filter(Boolean).join(" ")}
                >
                  Advanced
                </button>
              </div>
            </div>

            {/* Math Simplified Toggle (Demo Enhancement) */}
            {showAdvanced && (
              <div className="flex items-center gap-2 border-l pl-4">
                <span className="text-xs uw:text-3xl text-gray-600">Mode:</span>
                <div className="flex bg-gray-100 rounded p-0.5">
                  <button
                    onClick={() => setMathSimplified(true)}
                    className={[
                      "px-2 py-1 text-xs uw:text-2xl rounded transition-all",
                      mathSimplified ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-800"
                    ].filter(Boolean).join(" ")}
                  >
                    Simplified
                  </button>
                  <button
                    onClick={() => setMathSimplified(false)}
                    className={[
                      "px-2 py-1 text-xs uw:text-2xl uw:ml-6 rounded transition-all",
                      !mathSimplified ? "bg-white text-gray-900 shadow-sm " : "text-gray-600 hover:text-gray-800"
                    ].filter(Boolean).join(" ")}
                  >
                    Full
                  </button>
                </div>
              </div>
            )}

            {/* RTP Profile Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm uw:text-2xl font-medium">RTP:</span>
              <Select value={rtpProfile.toString()} onValueChange={(value) => setRtpProfile(parseFloat(value) as RTPProfile)}>
                <SelectTrigger className="w-20 uw:text-2xl uw:mx-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.96">96%</SelectItem>
                  <SelectItem value="0.94">94%</SelectItem>
                  <SelectItem value="0.92">92%</SelectItem>
                  <SelectItem value="0.88">88%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" className='uw:text-2xl'>
              <Download className="h-4 w-4 uw:h-8 uw:w-8 mr-2" />
              Export Par Sheet
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto p-4 space-y-4">
        {/* Feature Balance Templates (Demo Enhancement) */}
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center border gap-2">
              Feature Balance Templates
              <Badge variant="secondary" className="text-xs uw:text-2xl ml-2 bg-orange-100 text-orange-700">
                PM-Friendly
              </Badge>
            </CardTitle>
            <CardDescription>
              One-click feature balance optimization for non-math team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {Object.entries(featureBalanceTemplates).map(([key, template]) => (
                // <div key={key} className="p-4 bg-white rounded-lg border hover:border-orange-300 transition-colors">
                <div
                  key={key}
                  className={`p-4 bg-white rounded-lg border transition-colors
    ${selectedFeatureTemplate === key ? "border-green-500 shadow-lg" : "hover:border-orange-300"}
  `}
                >

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {/* {template.icon} */}
                      <h4 className="font-medium uw:text-2xl text-gray-900">{template.name}</h4>
                    </div>
                    {/* <Button
                      size="sm1"
                      onClick={() => applyFeatureTemplate(key as keyof typeof featureBalanceTemplates)}
                      className="bg-orange-600 hover:bg-orange-700 text-white uw:text-2xl uw:h-[60px] uw:w-[100px]"
                    >
                     Applied
                    </Button> */}

                    <Button
                      size="sm1"
                      onClick={() => applyFeatureTemplate(key as keyof typeof featureBalanceTemplates)}
                      className={`text-white uw:text-2xl uw:h-[60px] uw:w-[100px]
    ${selectedFeatureTemplate === key
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-orange-600 hover:bg-orange-700"}
  `}
                    >
                      {selectedFeatureTemplate === key ? "Applied" : "Apply"}
                    </Button>

                  </div>
                  <p className="text-sm uw:text-2xl text-gray-600 mb-3">{template.description}</p>
                  <div className="space-y-1">
                    <div className="mb-1 uw:text-2xl"><strong>Allocation:</strong></div>
                    <div className="text-xs uw:text-xl space-y-1">
                      {isFeatureEnabled('freeSpins') && (
                        <div className="flex justify-between">
                          <span className='uw:text-2xl'>Free Spins:</span>
                          <span className="font-semibold uw:text-2xl">{template.settings.fsPct}%</span>
                        </div>
                      )}
                      {isFeatureEnabled('pickAndClick') && (
                        <div className="flex justify-between">
                          <span className='uw:text-2xl'>Pick Bonus:</span>
                          <span className="font-semibold uw:text-2xl">{template.settings.pickPct}%</span>
                        </div>
                      )}
                      {isFeatureEnabled('holdAndSpin') && (
                        <div className="flex justify-between">
                          <span className='uw:text-2xl'>Hold & Win:</span>
                          <span className="font-semibold uw:text-2xl">{template.settings.holdPct}%</span>
                        </div>
                      )}
                      {!isFeatureEnabled('freeSpins') && !isFeatureEnabled('pickAndClick') && !isFeatureEnabled('holdAndSpin') && (
                        <div className="text-gray-400 italic uw:text-2xl">No features enabled</div>
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t text-xs uw:text-2xl text-gray-500">
                      <strong className='uw:text-2xl'>Best for:</strong> {template.bestFor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Controls - Only shown in Advanced Mode */}
        {showAdvanced && (
          <>
            {/* Math Simplified Mode Content */}
            {mathSimplified ? (
              <>
                {/* Simplified RTP Control */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base  flex items-center gap-2">
                      <Target className="h-4 w-4 uw:h-8 uw:w-8 text-green-600" />
                      Essential Math Controls
                      <Badge variant="secondary" className="text-xs uw:text-2xl bg-green-100 text-green-700">
                        PM-Friendly
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Core math settings without complexity - perfect for Product Managers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                      {/* Simple RTP Control */}
                      <div className="space-y-4">
                        <h4 className="font-medium uw:text-2xl text-gray-900 flex items-center gap-2">
                          <DollarSign className="h-4 w-4 uw:h-6 uw:w-6 text-green-600" />
                          Target RTP
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm uw:text-2xl text-gray-600">Current RTP:</span>
                            <span className="font-mono font-bold text-lg uw:text-3xl text-green-700">{(rtpProfile * 100).toFixed(0)}%</span>
                          </div>
                          <Select value={rtpProfile.toString()} onValueChange={(value) => setRtpProfile(parseFloat(value) as RTPProfile)}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.96">96% - Premium</SelectItem>
                              <SelectItem value="0.94">94% - Standard</SelectItem>
                              <SelectItem value="0.92">92% - Competitive</SelectItem>
                              <SelectItem value="0.88">88% - Budget</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Simple Volatility Control */}
                      <div className="space-y-4">
                        <h4 className="font-medium uw:text-3xl text-gray-900 flex items-center gap-2">
                          <Activity className="h-4 w-4 uw:h-8 uw:w-8 text-blue-600" />
                          Volatility Level
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm uw:text-2xl text-gray-600">Current Level:</span>
                            <span className="font-mono font-bold text-lg uw:text-2xl text-blue-700">{computedVolatility}/10</span>
                          </div>
                          <Slider
                            value={[volatilityControls.bigWinConcentration]}
                            onValueChange={([value]) => {
                              updateVolatilityControl('bigWinConcentration', value);
                              updateVolatilityControl('hitRateVsWinSize', value * 0.7);
                              updateVolatilityControl('featurePowerVsTrigger', value * 0.8);
                            }}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs uw:text-2xl text-gray-500">
                            <span>Low Risk</span>
                            <span>High Risk</span>
                          </div>
                        </div>
                      </div>

                      {/* Simple Compliance Status */}
                      <div className="space-y-4">
                        <h4 className="font-medium uw:text-3xl text-gray-900 flex items-center gap-2">
                          <Shield className="h-4 w-4 uw:h-8 uw:w-8 text-purple-600" />
                          Compliance Status
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm uw:text-2xl text-gray-600">Markets Ready:</span>
                            <span className="font-semibold uw:text-2xl text-green-600">{compliance.filter(m => m.status === 'compliant').length}/{compliance.length}</span>
                          </div>
                          <div className="text-xs uw:text-xl text-gray-500">
                            {compliance.filter(m => m.status === 'blocked').length > 0 && (
                              <div className="text-red-600 ">⚠️ {compliance.filter(m => m.status === 'blocked').length} blocked markets</div>
                            )}
                            {compliance.filter(m => m.status === 'warning').length > 0 && (
                              <div className="text-yellow-600">⚠️ {compliance.filter(m => m.status === 'warning').length} warnings</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium uw:text-3xl text-blue-800 mb-2">💡 Quick Summary</h5>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600 uw:text-2xl">RTP:</span>
                          <div className="font-bold uw:text-xl">{(rtpProfile * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                          <span className="text-blue-600 uw:text-2xl">Volatility:</span>
                          <div className="font-bold uw:text-xl">{computedVolatility}/10</div>
                        </div>
                        <div>
                          <span className="text-blue-600 uw:text-2xl">Hit Rate:</span>
                          <div className="font-bold uw:text-xl">{mathSummary.hitRate}%</div>
                        </div>
                        <div>
                          <span className="text-blue-600 uw:text-2xl">Max Win:</span>
                          <div className="font-bold uw:text-xl">{mathSummary.maxWinX}×</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* FULL MODE: All Complex Controls */
              <>
                {/* Step 12 Configuration Import Panel */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3 gap-2 flex">
                    <CardTitle className="text-base uw:text-3xl flex items-center gap-2">
                      Configuration from Step 12
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 uw:text-2xl">Game:</span>
                        <div className="font-medium uw:text-xl">{step12Config.gameTitle}</div>
                        <div className="text-xs uw:text-xl text-gray-500">{step12Config.theme} Theme</div>
                      </div>
                      <div>
                        <span className="text-gray-600 uw:text-2xl">Grid & Features:</span>
                        <div className="font-medium uw:text-xl">{step12Config.grid.label} Grid</div>
                        <div className="text-xs uw:text-xl text-gray-500">
                          {step12Config.features.filter(f => f.enabled).map(f => f.name).join(', ')}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 uw:text-2xl">Constraints:</span>
                        <div className="font-medium uw:text-xl">Max Win: {step12Config.maxWin.toLocaleString()}×</div>
                        <div className="text-xs uw:text-xl text-gray-500">
                          Markets: {step12Config.targetMarkets.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="h-7  text-xs uw:text-2xl uw:py-6">
                        🔙 Modify in Step 12
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs uw:text-2xl uw:py-6">
                        📥 Import Different Configuration
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Automatic View - Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* RTP Split */}
                  <RTPSplitCard
                    baseRTP={mathSummary.rtpSplit.base}
                    featuresRTP={mathSummary.rtpSplit.features}
                  />

                  {/* Volatility */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm uw:text-3xl font-medium flex items-center gap-2">
                        {/* <TrendingUp className="h-4 w-4 text-red-600" /> */}
                        Volatility
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-gray-200"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${(mathSummary.volatility10 / 10) * 88} 88`}
                            className="text-red-600"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">{mathSummary.volatility10}</span>
                        </div>
                      </div>
                      <p className="text-xs uw:text-2xl text-gray-500 text-center mt-2">Scale 1-10</p>
                    </CardContent>
                  </Card>

                  {/* Hit Rate & Max Win */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {/* <Target className="h-4 w-4 text-red-600" /> */}
                        Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm uw:text-2xl text-gray-600">Hit Rate</span>
                          <span className="text-lg uw:text-2xl font-bold">{mathSummary.hitRate}%</span>
                        </div>
                        <p className="text-xs uw:text-2xl text-gray-500">Avg Win: {mathSummary.avgWinX}× bet</p>
                      </div>
                      <div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm uw:text-2xl text-gray-600">Max Win</span>
                          <span className="text-lg uw:text-2xl font-bold">{mathSummary.maxWinX.toLocaleString()}×</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Assessment */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-">
                        {/* <Shield className="h-4 w-4 text-red-600" /> */}
                        Risk Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Badge className={["text-xs uw:text-2xl", getRiskColor(mathSummary.risk)].filter(Boolean).join(" ")}>
                          {mathSummary.risk} Risk
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm uw:text-2xl text-gray-600">Confidence</span>
                          <span className="font-semibold uw:text-2xl">{mathSummary.confidence}%</span>
                        </div>
                        <Progress value={mathSummary.confidence} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* Editable Symbol Paytable */}
                <SymbolPaytable
                  symbolPaysState={symbolPaysState}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  updateSymbolPay={updateSymbolPay}
                  saveSymbolPay={saveSymbolPay}
                  tempPaytables={tempPaytables}
                  resetPaytable={() => {
                    // Reset symbol pays to initial state
                    setSymbolPaysState(getInitialSymbolPays());
                    // Clear temp paytables
                    setTempPaytables({});
                    // Clear stored paytables from config
                    updateConfig({
                      theme: {
                        ...config.theme,
                        generated: {
                          ...config.theme?.generated,
                          symbolPaytables: {}
                        }
                      }
                    });
                    // Dispatch reset event
                    window.dispatchEvent(new CustomEvent('paytableReset', {
                      detail: { timestamp: Date.now() }
                    }));
                  }}
                />

                {/* RTP Balancing Controls */}
                <RTPBalancing
                  editableFeatures={editableFeatures}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  updateFeatureRTP={updateFeatureRTP}
                  isFeatureEnabled={isFeatureEnabled}
                />

                {/* Hit & Win Distribution */}
                <HitDistribution
                  mathSummary={mathSummary}
                  distribution={distribution}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                />

                {/* Feature Configuration */}
                <FeatureConfiguration
                  featureSettings={featureSettings}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  updateFeatureSetting={updateFeatureSetting}
                  isFeatureEnabled={isFeatureEnabled}
                />

                {/* Volatility Tuning */}
                <VolatilityTuning
                  volatilityControls={volatilityControls}
                  computedVolatility={computedVolatility}
                  step12Config={step12Config}
                  businessMetrics={businessMetrics}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  updateVolatilityControl={updateVolatilityControl}
                />

                {/* Market Compliance */}
                <MarketCompliance
                  compliance={compliance}
                  businessMetrics={businessMetrics}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                />

                {/* Professional Reel Strip Editor */}
                <ReelStripEditor
                  reelStrips={reelStrips}
                  reelSymbols={reelSymbols}
                  step12Config={{ ...step12Config, grid: gridConfig }}
                  reelView={reelView}
                  sortBy={sortBy}
                  filterSymbol={filterSymbol}
                  editingPosition={editingPosition}
                  draggedSymbol={draggedSymbol}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  setReelView={setReelView}
                  setSortBy={setSortBy}
                  setFilterSymbol={setFilterSymbol}
                  setEditingPosition={setEditingPosition}
                  setDraggedSymbol={setDraggedSymbol}
                  updateSymbolCount={updateSymbolCount}
                  autoBalanceReelStrips={autoBalanceReelStrips}
                  calculateReelMetrics={calculateReelMetrics}
                  updateSymbolAtPosition={updateSymbolAtPosition}
                  insertSymbolAtPosition={insertSymbolAtPosition}
                  removeSymbolAtPosition={removeSymbolAtPosition}
                  moveSymbol={moveSymbol}
                  getSymbolDisplayName={getSymbolDisplayName}
                  getFilteredAndSortedPositions={getFilteredAndSortedPositions}
                  setReelStrips={setReelStrips}
                  allowFreeSpinRetriggers={config?.bonus?.freeSpins?.retriggers ?? true}
                  isFeatureEnabled={isFeatureEnabled}
                />

                {/* Business Intelligence Dashboard (Full)
              <BusinessIntelligenceFull
                businessMetrics={businessMetrics}
                playerSegmentData={playerSegmentData}
                selectedPlayerSegment={selectedPlayerSegment}
                setSelectedPlayerSegment={(segment: string) => setSelectedPlayerSegment(segment as 'all' | 'casual' | 'vip' | 'bonus_hunter')}
                step12Config={step12Config}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                getBIRangeEstimate={getBIRangeEstimate}
              /> */}

              </>
            )}
          </>
        )}

        {/* Advanced Toggle */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm uw:text-2xl text-gray-600"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Controls
            {showAdvanced ? <ChevronUp className="h-4 w-4 uw:h-8 uw:w-8 ml-1" /> : <ChevronDown className="h-4 w-4 uw:h-8 uw:w-8 ml-1" />}
          </Button>
        </div>

      </main>

      {/* Export Options Modal (Demo Enhancement) */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 uw:h-8 uw:w-8 text-blue-600" />
              Export Options
            </DialogTitle>
            <DialogDescription>
              Choose your export format based on the intended audience and workflow
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Excel Export */}
            <div className="p-4 border rounded-lg hover:border-green-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">XLS</span>
                </div>
                <div>
                  <h3 className="font-semibold">Excel Workbook</h3>
                  <p className="text-sm text-gray-600">For CFOs & Finance Teams</p>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1 mb-4">
                <li>• Revenue projections & ROI analysis</li>
                <li>• Player segment breakdown</li>
                <li>• Market compliance summary</li>
                <li>• Business KPI dashboards</li>
              </ul>
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                Export Excel
              </Button>
            </div>

            {/* JSON Export */}
            <div className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">JSON</span>
                </div>
                <div>
                  <h3 className="font-semibold">RGS Integration</h3>
                  <p className="text-sm text-gray-600">For Development Teams</p>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1 mb-4">
                <li>• Complete math configuration</li>
                <li>• Reel strip data & symbol maps</li>
                <li>• Feature trigger definitions</li>
                <li>• API-ready format</li>
              </ul>
              <Button size="sm" variant="outline" className="w-full border-blue-300 text-blue-600">
                Export JSON
              </Button>
            </div>

            {/* PDF Export */}
            <div className="p-4 border rounded-lg hover:border-red-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">PDF</span>
                </div>
                <div>
                  <h3 className="font-semibold">Compliance Pack</h3>
                  <p className="text-sm text-gray-600">For Regulators</p>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1 mb-4">
                <li>• Detailed PAR sheet</li>
                <li>• Jurisdiction compliance report</li>
                <li>• Mathematical proofs</li>
                <li>• Test lab submission ready</li>
              </ul>
              <Button size="sm" variant="outline" className="w-full border-red-300 text-red-600">
                Export PDF
              </Button>
            </div>

            {/* CSV Export */}
            <div className="p-4 border rounded-lg hover:border-purple-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">CSV</span>
                </div>
                <div>
                  <h3 className="font-semibold">Data Analysis</h3>
                  <p className="text-sm text-gray-600">For Analytics Teams</p>
                </div>
              </div>
              <ul className="text-xs text-gray-500 space-y-1 mb-4">
                <li>• Raw simulation results</li>
                <li>• Symbol frequency data</li>
                <li>• Win distribution tables</li>
                <li>• Statistical validation data</li>
              </ul>
              <Button size="sm" variant="outline" className="w-full border-purple-300 text-purple-600">
                Export CSV
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              Custom Studio Integration
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Need a custom format for your studio workflow? Configure automated exports to your existing tools.
            </p>
            <Button size="sm" variant="outline" className="text-xs">
              Configure Custom Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
