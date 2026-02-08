import type {
  MathSummary,
  FeatureContribution,
  DistributionBand,
  SessionSim,
  SymbolPay,
  ComplianceMarket,
  SimulationResult,
  RTPProfile
} from '../types/math';
import type { Step12Configuration, GameGrid, ReelSymbol, ReelStrip } from '../types/step12';

export function mockMathSummary(profile: RTPProfile): MathSummary {
  const profiles = {
    0.96: { base: 68, features: 32, vol: 7, hit: 21.5, avg: 4.2, max: 5000, conf: 94, risk: "Medium" as const },
    0.94: { base: 70, features: 30, vol: 6, hit: 23.1, avg: 3.8, max: 4500, conf: 96, risk: "Low" as const },
    0.92: { base: 72, features: 28, vol: 5, hit: 24.8, avg: 3.5, max: 4000, conf: 97, risk: "Low" as const },
    0.88: { base: 75, features: 25, vol: 4, hit: 27.2, avg: 3.1, max: 3500, conf: 98, risk: "Low" as const }
  };

  const p = profiles[profile];
  return {
    profile,
    rtpSplit: { base: p.base, features: p.features },
    volatility10: p.vol,
    hitRate: p.hit,
    avgWinX: p.avg,
    maxWinX: p.max,
    confidence: p.conf,
    risk: p.risk
  };
}

export function mockFeatureContribution(): FeatureContribution {
  return {
    basePct: 68,
    fsPct: 18,
    pickPct: 8,
    wheelPct: 4,
    holdPct: 2,
    respinPct: 0
  };
}

export function mockDistribution(): DistributionBand[] {
  return [
    { band: "1–2×", freqPct: 45.2 },
    { band: "3–5×", freqPct: 28.6 },
    { band: "6–10×", freqPct: 15.8 },
    { band: "11–20×", freqPct: 7.1 },
    { band: "21–50×", freqPct: 2.8 },
    { band: "51–100×", freqPct: 0.4 },
    { band: "100×+", freqPct: 0.1 }
  ];
}

export function mockSessionSim(spins: number, bankroll: number): SessionSim {
  const baseProb = 0.07; // 7% base FS prob
  const probFS = 1 - Math.pow(1 - baseProb, spins / 100);

  // Mock bankroll curve - starts at 100%, generally declines with volatility
  const expectedCurve = Array.from({ length: 11 }, (_, i) => {
    const progress = i / 10;
    const decline = Math.pow(progress, 1.2) * 0.15; // 15% expected decline
    const volatility = (Math.sin(progress * Math.PI * 4) * 0.05); // Some ups and downs
    return Math.max(0, 100 - (decline * 100) + (volatility * 100));
  });

  return {
    spins,
    bankroll,
    probFS: probFS * 100,
    expectedCurve,
    outcomeBands: {
      win: 28,
      lose: 52,
      breakEven: 20
    }
  };
}

export function mockSymbolPays(): SymbolPay[] {
  return [
    { symbol: "Wild", icon: "⭐", pay5: 50, pay4: 15, pay3: 5, frequency: 2.1 },
    { symbol: "Scatter", icon: "💎", pay5: 100, pay4: 20, pay3: 5, frequency: 1.8 },
    { symbol: "High1", icon: "👑", pay5: 25, pay4: 8, pay3: 3, frequency: 4.2 },
    { symbol: "High2", icon: "💰", pay5: 20, pay4: 6, pay3: 2, frequency: 5.1 },
    { symbol: "High3", icon: "🎲", pay5: 15, pay4: 5, pay3: 2, frequency: 6.8 },
    { symbol: "Low1", icon: "🃏", pay5: 8, pay4: 3, pay3: 1, frequency: 12.5 },
    { symbol: "Low2", icon: "🎯", pay5: 6, pay4: 2, pay3: 1, frequency: 15.2 },
    { symbol: "Low3", icon: "🎪", pay5: 5, pay4: 2, pay3: 1, frequency: 18.3 },
    { symbol: "Low4", icon: "🎨", pay5: 4, pay4: 1, pay3: 1, frequency: 21.1 },
    { symbol: "Low5", icon: "🎭", pay5: 3, pay4: 1, pay3: 1, frequency: 12.8 }
  ];
}

export function mockCompliance(): ComplianceMarket[] {
  return [
    { code: "UK", name: "United Kingdom", status: "warning", issues: ["Stake limits £2-5 required", "No auto-spin >10s"] },
    { code: "MT", name: "Malta", status: "compliant" },
    { code: "IT", name: "Italy", status: "warning", issues: ["Max win >2000× requires approval"] },
    { code: "ES", name: "Spain", status: "compliant" },
    { code: "SE", name: "Sweden", status: "warning", issues: ["Loss limits €25k/month", "Mandatory cool-down periods"] },
    { code: "DE", name: "Germany", status: "blocked", issues: ["Bonus buy prohibited", "RTP must be exactly 96%", "No autoplay >5s", "€1 stake limit"] },
    { code: "ON", name: "Ontario", status: "warning", issues: ["Max autoplay 100 spins", "Reality check every 30min", "No infinite autoplay"] },
    { code: "NL", name: "Netherlands", status: "blocked", issues: ["Max win >500× prohibited", "No FS retrigger", "€2.50 stake limit"] }
  ];
}

export function mockSimulationResult(): SimulationResult {
  return {
    totalRTP: 95.94,
    baseRTP: 65.12,
    featureRTP: 30.82,
    hitRate: 21.7,
    fsRate: 0.89, // 1 in 112
    bonusRate: 0.31, // 1 in 323
    bigWinRate: 0.18, // 1 in 556
    volatilityIndex: 6.8,
    status: "pass"
  };
}

export function mockDiffs(prevProfile: RTPProfile, nextProfile: RTPProfile): string[] {
  const diffs = [
    `RTP adjusted from ${(prevProfile * 100).toFixed(0)}% to ${(nextProfile * 100).toFixed(0)}%`,
    "Base game contribution increased by +2%",
    "Free Spins budget reduced by -1.5%",
    "L2 symbol pays decreased by -5%",
    "Volatility index adjusted to maintain target"
  ];

  return diffs.slice(0, Math.floor(Math.random() * 3) + 2);
}

// Step 12 Configuration Mock Data
export function mockStep12Configuration(): Step12Configuration {
  return {
    gameTitle: "Treasures of Ra",
    grid: { width: 5, height: 3, label: "5×3" },
    theme: "Ancient Egypt",
    features: [
      {
        id: "free_spins",
        name: "Free Spins",
        type: "free_spins",
        enabled: true,
        mechanics: {
          spins: 12,
          triggerSymbols: ["scatter"],
          triggerCount: 3,
          retrigger: true
        }
      },
      {
        id: "pick_bonus",
        name: "Treasure Pick",
        type: "pick_bonus",
        enabled: true,
        mechanics: {
          picks: 5,
          revealType: "mixed"
        }
      },
      {
        id: "respins",
        name: "Ra Respins",
        type: "respin",
        enabled: true,
        mechanics: {
          respinTrigger: "wild",
          maxRespins: 3
        }
      }
    ],
    maxWin: 5000,
    targetMarkets: ["UK", "Malta", "Spain", "Sweden"],
    createdAt: "2025-01-15T10:30:00Z",
    version: "v2.1"
  };
}

export function mockReelSymbols(): ReelSymbol[] {
  return [
    { id: "wild", name: "Wild Ra", icon: "⭐", type: "wild", rarity: "epic" },
    { id: "scatter", name: "Pyramid Scatter", icon: "🔺", type: "scatter", rarity: "rare" },
    { id: "pharaoh", name: "Pharaoh", icon: "👑", type: "regular", rarity: "rare" },
    { id: "cleopatra", name: "Cleopatra", icon: "👸", type: "regular", rarity: "rare" },
    { id: "anubis", name: "Anubis", icon: "🐺", type: "regular", rarity: "uncommon" },
    { id: "eye", name: "Eye of Ra", icon: "👁️", type: "regular", rarity: "uncommon" },
    { id: "ankh", name: "Ankh", icon: "☥", type: "regular", rarity: "common" },
    { id: "ace", name: "Ace", icon: "A", type: "regular", rarity: "common" },
    { id: "king", name: "King", icon: "K", type: "regular", rarity: "common" },
    { id: "queen", name: "Queen", icon: "Q", type: "regular", rarity: "common" },
    { id: "jack", name: "Jack", icon: "J", type: "regular", rarity: "common" },
    { id: "ten", name: "Ten", icon: "10", type: "regular", rarity: "common" }
  ];
}

export function mockReelStrips(grid: GameGrid): ReelStrip[] {
  const symbols = mockReelSymbols();
  const reelLength = 32; // Standard reel length

  // Create different symbol distributions per reel for 5×3 grid
  const reelConfigs = [
    // Reel 1: More wilds and high symbols
    { wild: 2, scatter: 1, pharaoh: 3, cleopatra: 3, anubis: 4, eye: 4, ankh: 5, ace: 3, king: 3, queen: 2, jack: 1, ten: 1 },
    // Reel 2: Balanced
    { wild: 1, scatter: 2, pharaoh: 3, cleopatra: 3, anubis: 4, eye: 4, ankh: 4, ace: 4, king: 3, queen: 3, jack: 2, ten: 3 },
    // Reel 3: More scatters (trigger reel)
    { wild: 1, scatter: 3, pharaoh: 2, cleopatra: 2, anubis: 4, eye: 5, ankh: 4, ace: 3, king: 3, queen: 3, jack: 3, ten: 3 },
    // Reel 4: Balanced
    { wild: 1, scatter: 2, pharaoh: 3, cleopatra: 3, anubis: 4, eye: 4, ankh: 4, ace: 4, king: 3, queen: 3, jack: 2, ten: 3 },
    // Reel 5: Higher pays concentration
    { wild: 2, scatter: 1, pharaoh: 4, cleopatra: 4, anubis: 3, eye: 3, ankh: 4, ace: 3, king: 3, queen: 2, jack: 2, ten: 1 }
  ];

  return Array.from({ length: grid.width }, (_, reelIndex) => {
    const config = reelConfigs[reelIndex] || reelConfigs[0];
    const reelSymbols: string[] = [];

    // Build reel strip based on configuration
    Object.entries(config).forEach(([symbolId, count]) => {
      for (let i = 0; i < count; i++) {
        reelSymbols.push(symbolId);
      }
    });

    // Shuffle the symbols
    for (let i = reelSymbols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [reelSymbols[i], reelSymbols[j]] = [reelSymbols[j], reelSymbols[i]];
    }

    return {
      reelIndex,
      symbols: reelSymbols,
      length: reelSymbols.length
    };
  });
}
