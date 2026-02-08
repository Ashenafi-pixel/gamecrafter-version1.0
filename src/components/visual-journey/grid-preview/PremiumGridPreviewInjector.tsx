import React from 'react';
import { useGameStore } from '../../../store';
import PremiumSlotPreviewBlock from './PremiumSlotPreviewBlock';
import { useStoredSymbols } from '../../../utils/symbolStorage';

/**
 * PremiumGridPreviewInjector
 * =========================
 * 
 * This component ensures consistent slot preview rendering across all steps.
 * It acts as a simplified bridge that passes the necessary props to the
 * PremiumSlotPreviewBlock, which in turn uses the UnifiedSlotPreview.
 * 
 * The new architecture ensures:
 * - Single source of truth for slot rendering
 * - Proper lifecycle management
 * - No WebGL context corruption
 * - Consistent behavior across all steps
 */
const PremiumGridPreviewInjector: React.FC<{
  stepSource: string;
  symbolsOverride?: string[];
  customTitle?: string;
  customInfo?: React.ReactNode;
}> = ({
  stepSource,
  symbolsOverride,
  customTitle,
  customInfo
}) => {
  // Access store for configuration
  const { config } = useGameStore();
  const symbolStore = useStoredSymbols();
  
  // Helper function to get symbol URLs from both array and object formats
  const getSymbolUrls = (symbols: string[] | Record<string, string> | undefined): string[] => {
    if (!symbols) return [];
    if (Array.isArray(symbols)) return symbols;
    return Object.values(symbols);
  };

  // Helper to get current symbols
  const getSymbols = (): string[] => {
    // First try to use symbolsOverride if provided
    if (symbolsOverride && symbolsOverride.length > 0) {
      return symbolsOverride.filter(Boolean);
    }

    // Next try symbol store
    if (symbolStore.symbols && symbolStore.symbols.length > 0) {
      return symbolStore.symbols.map(s => s.image).filter(Boolean);
    }

    // Finally try config store
    if (config?.theme?.generated?.symbols) {
      return getSymbolUrls(config.theme.generated.symbols).filter(Boolean);
    }

    // Default to empty array if no symbols found
    return [];
  };

  // Determine if we have enough symbols
  const hasEnoughSymbols = () => {
    return getSymbols().length >= 9;
  };
  
  // Render the Premium Slot Preview Block with the new architecture
  return (
    <PremiumSlotPreviewBlock
      title={customTitle || "Premium Slot Preview"}
      infoText={customInfo || "This is a live preview of your slot symbols."}
      hasEnoughSymbols={hasEnoughSymbols}
      notEnoughSymbolsMessage="Generate at least 9 symbols for a complete preview"
      stepSource={stepSource}
      symbolsOverride={getSymbols()}
    />
  );
};

export default PremiumGridPreviewInjector;