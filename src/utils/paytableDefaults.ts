// Market-accurate paytable values based on industry standards for 96% RTP slots
// Values are optimized for balanced gameplay, proper RTP contribution, and player engagement
export const PAYTABLE_DEFAULTS: Record<string, { pay3: number; pay4: number; pay5: number; pay6: number; pay7: number }> = {
  // Special Symbols - Premium payouts with industry-standard ratios
  wild: { pay3: 25, pay4: 100, pay5: 500, pay6: 1000, pay7: 2000 },
  wild2: { pay3: 25, pay4: 100, pay5: 500, pay6: 1000, pay7: 2000 },
  scatter: { pay3: 2, pay4: 10, pay5: 50, pay6: 100, pay7: 200 }, // Scatter pays anywhere, lower individual values
  
  // High-Value Symbols (Epic/Rare) - Premium theme symbols
  high1: { pay3: 15, pay4: 50, pay5: 200, pay6: 400, pay7: 800 },
  high2: { pay3: 12, pay4: 40, pay5: 150, pay6: 300, pay7: 600 },
  high3: { pay3: 10, pay4: 30, pay5: 100, pay6: 200, pay7: 400 },
  high4: { pay3: 8, pay4: 25, pay5: 75, pay6: 150, pay7: 300 },
  
  // Medium-Value Symbols (Uncommon) - Balanced progression
  medium1: { pay3: 6, pay4: 20, pay5: 80, pay6: 160, pay7: 320 },
  medium2: { pay3: 5, pay4: 15, pay5: 60, pay6: 120, pay7: 240 },
  medium3: { pay3: 4, pay4: 12, pay5: 40, pay6: 80, pay7: 160 },
  medium4: { pay3: 3, pay4: 10, pay5: 30, pay6: 60, pay7: 120 },
  
  // Low-Value Symbols (Common - Card symbols) - Frequent hits, lower payouts
  ace: { pay3: 3, pay4: 10, pay5: 30, pay6: 60, pay7: 120 },
  king: { pay3: 2, pay4: 8, pay5: 25, pay6: 50, pay7: 100 },
  queen: { pay3: 2, pay4: 6, pay5: 20, pay6: 40, pay7: 80 },
  jack: { pay3: 1, pay4: 5, pay5: 15, pay6: 30, pay7: 60 },
  ten: { pay3: 1, pay4: 3, pay5: 10, pay6: 20, pay7: 40 },
  nine: { pay3: 1, pay4: 2, pay5: 8, pay6: 16, pay7: 32 },
};

// Get default paytable based on rarity (includes all fields)
// Updated with market-accurate values for proper RTP balance
function getDefaultPaytableByRarity(rarity: string): { pay3: number; pay4: number; pay5: number; pay6: number; pay7: number } {
  switch (rarity) {
    case 'legendary':
    case 'epic':
      return { pay3: 25, pay4: 100, pay5: 500, pay6: 1000, pay7: 2000 }; // Premium wild-like payouts
    case 'rare':
      return { pay3: 12, pay4: 40, pay5: 150, pay6: 300, pay7: 600 }; // High-value theme symbols
    case 'uncommon':
      return { pay3: 5, pay4: 15, pay5: 60, pay6: 120, pay7: 240 }; // Medium-value symbols
    case 'common':
    default:
      return { pay3: 2, pay4: 6, pay5: 20, pay6: 40, pay7: 80 }; // Low-value card symbols
  }
}

// Get default paytable for a symbol by its type/key, filtered by reel count
export function getDefaultPaytable(
  symbolKey: string, 
  rarity?: string, 
  reelCount: number = 5
): Record<string, number> {
  const key = symbolKey.toLowerCase().replace(/\s+/g, '');
  
  // Get full defaults
  let fullDefaults = PAYTABLE_DEFAULTS[key] || (rarity ? getDefaultPaytableByRarity(rarity) : { pay3: 1, pay4: 3, pay5: 10, pay6: 20, pay7: 40 });
  
  // Filter based on reel count
  const result: Record<string, number> = { pay3: fullDefaults.pay3 };
  if (reelCount >= 4) result.pay4 = fullDefaults.pay4;
  if (reelCount >= 5) result.pay5 = fullDefaults.pay5;
  if (reelCount >= 6) result.pay6 = fullDefaults.pay6;
  if (reelCount >= 7) result.pay7 = fullDefaults.pay7;
  
  return result;
}
