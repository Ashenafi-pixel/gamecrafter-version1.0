/**
 * RGS Math Engine Types
 */

import { WinCondition } from '../../types';

export interface PrizeTier {
    id: string; // e.g., "tier_1", "tier_lose"
    value: number; // Monetary multiplier or distinct value
    probability: number; // 0-1
    isWin: boolean;
    condition?: WinCondition; // Defined for winning tiers
    weight?: number; // Added for compatibility with POOL mode
}

export interface ResolvedOutcome {
    roundId: string;
    finalPrize: number;
    isWin: boolean;
    tierId: string;
    revealMap: string[]; // Flat array of symbol IDs/URLs to display on grid
    presentationSeed: number;
}

// --- Domain Model Layer 1: Outcome Categories ---
export type OutcomeCategory = 'MATCH' | 'GRID' | 'BONUS' | 'PROGRESSION';

// Sub-configurations for each category
export interface MatchConfig {
    matchCount: number; // e.g., 3 for Match-3
    allowWildcards: boolean;
}

export interface GridConfig {
    failSymbolProbability: number; // e.g., 0.1 for Mines
    maxPicks?: number; // For "Pick N" distinct from revealing all
}

export interface BonusConfig {
    triggerSymbol: string;
    bonusProbablity: number;
}

// --- Domain Model Layer 2: Presentation Styles ---
export type PresentationStyle =
    | 'SINGLE_ZONE'
    | 'MULTI_ZONE'
    | 'GRID_NxM'
    | 'PATH'
    | 'REEL'
    | 'STORY'
    | 'COUNTDOWN'
    | 'PICK_A_BOX';

export interface PresentationConfig {
    style: PresentationStyle;
    zones?: number; // for multi-zone
    pathNodes?: number; // for path
}

// --- Domain Model Layer 3: Features ---
export interface FeatureConfig {
    multipliers?: { enabled: boolean; values: number[] };
    bonusZones?: { enabled: boolean; count: number };
    secondChance?: { enabled: boolean; probability: number };
    nearMiss?: { enabled: boolean; intensity: 'low' | 'high' };
}

export interface GameMathConfig {
    category: OutcomeCategory; // Layer 1
    presentation?: PresentationConfig; // Layer 2
    features?: FeatureConfig; // Layer 3

    mathMode?: 'POOL' | 'UNLIMITED';
    totalTickets?: number;

    rtp: number;
    volatility: 'low' | 'medium' | 'high';
    prizeTable: PrizeTier[];
    layout: {
        rows: number; // For GRID_NxM
        columns: number;
    };
    symbols: {
        win: string[]; // Pool for winning positions
        lose: string[]; // Pool for losing positions
        bonus?: string[]; // Pool for bonus triggers
        wild?: string[]; // Wildcards
    };
    // Category-specific params
    match?: MatchConfig;
    grid?: GridConfig;
    bonus?: BonusConfig;

    // Advanced Engine Config
    winLogic?: 'SINGLE_WIN' | 'MULTI_WIN';

    // Pass-through Configuration for specialized solvers
    mechanic?: any; // Full mechanic config from editor
    rulesGrid?: any; // Full rulesGrid config from editor
}
