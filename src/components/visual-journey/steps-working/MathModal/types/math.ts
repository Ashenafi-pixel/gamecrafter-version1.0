export interface MathSummary {
  profile: 0.96 | 0.94 | 0.92 | 0.88;
  rtpSplit: { base: number; features: number };
  volatility10: number;
  hitRate: number;
  avgWinX: number;
  maxWinX: number;
  confidence: number;
  risk: "Low" | "Medium" | "High";
}

export interface FeatureContribution {
  basePct: number;
  fsPct: number;
  pickPct: number;
  wheelPct: number;
  holdPct: number;
  respinPct: number;
}

export interface EditableFeatureContribution extends FeatureContribution {
  constraints: {
    basePctRange: [number, number];
    featuresTotalRange: [number, number];
  };
}

export interface FeatureSettings {
  freeSpins: {
    triggerRate: number; // 1 in X spins
    averageSpins: number;
    multiplierRange: [number, number];
    retriggerRate: number;
  };
  pickBonus: {
    triggerRate: number;
    picks: number;
    avgMultiplier: number;
  };
  wheel: {
    triggerRate: number;
    segments: number;
    maxMultiplier: number;
  };
  holdWin: {
    triggerRate: number;
    avgSymbols: number;
    maxSymbols: number;
  };
}

export interface VolatilityControls {
  bigWinConcentration: number; // 0-100, how much RTP in big wins vs small
  hitRateVsWinSize: number; // 0-100, frequent small vs rare big
  featurePowerVsTrigger: number; // 0-100, powerful rare vs weak frequent
}

export interface DistributionBand {
  band: string;   // "1–2×", "3–5×", ...
  freqPct: number;
}

export interface SessionSim {
  spins: number;
  bankroll: number;
  probFS: number;
  expectedCurve: number[];
  outcomeBands: { win: number; lose: number; breakEven: number };
}

export interface SymbolPay {
  symbol: string;
  icon: string;
  pay3: number;
  pay4?: number;
  pay5?: number;
  pay6?: number;
  pay7?: number;
  frequency: number;
}

export interface ComplianceMarket {
  code: string;
  name: string;
  status: "compliant" | "warning" | "blocked";
  rtpRequired?: number;
  maxWinAllowed?: number;
  issues?: string[];
}

export interface SimulationResult {
  totalRTP: number;
  baseRTP: number;
  featureRTP: number;
  hitRate: number;
  fsRate: number;
  bonusRate: number;
  bigWinRate: number;
  volatilityIndex: number;
  status: "pass" | "warning" | "fail";
}


export type RTPProfile = 0.96 | 0.94 | 0.92 | 0.88;
export type VolatilityLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type RiskLevel = "Low" | "Medium" | "High";
