
import crypto from 'crypto';
import * as ScratchLogic from './engines/ScratchLogic.js';

/**
 * Simple Linear Congruential Generator (LCG) for deterministic RNG
 * Same as the frontend implementation to ensure consistency.
 */
export class RNG {
    constructor(seed) {
        // If seed is string, hash it to get a number
        if (typeof seed === 'string') {
            const hash = crypto.createHash('sha256').update(seed).digest('hex');
            // Take first 8 chars and convert to int
            this.seed = parseInt(hash.substring(0, 8), 16);
        } else {
            this.seed = seed;
        }

        // Constants used in many standard LCGs (e.g., glibc)
        this.m = 2147483648; // 2^31
        this.a = 1103515245;
        this.c = 12345;
    }

    next() {
        this.seed = (this.a * this.seed + this.c) % this.m;
        return this.seed / this.m;
    }

    /**
     * Returns an integer in range [min, max] inclusive
     */
    range(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Returns a random element from an array
    /**
     * Returns a random element from an array
     */
    pick(array) {
        if (!array || array.length === 0) return null;
        return array[this.range(0, array.length - 1)];
    }

    /**
     * Returns 'count' unique random elements from an array.
     */
    pickUnique(array, count) {
        if (!array || array.length === 0) return [];
        const result = [];
        const copy = [...array];
        for (let i = 0; i < count; i++) {
            if (copy.length === 0) break;
            const idx = this.range(0, copy.length - 1);
            result.push(copy[idx]);
            copy.splice(idx, 1);
        }
        return result;
    }
}

/**
 * Resolve a single game round
 * @param {Object} config - The game configuration object
 * @param {string} seedProp - The seed for this round
 * @param {string} [forcedTierId] - Optional: Force a specific prize tier (for Finite Deck/Ticket systems)
 * @returns {Object} The resolved outcome
 */
export const resolveRound = (config, seedProp, forcedTierId = null) => {
    // 1. Initialize RNG
    const rng = new RNG(seedProp);
    const presentationSeed = rng.next() * 1000000;

    // 2. Select Prize Tier
    // Ensure we have a valid prize table or use defaults
    const tiers = (config.scratch && config.scratch.prizes && config.scratch.prizes.length > 0)
        ? config.scratch.prizes.map(p => ({
            id: p.id,
            value: p.payout,
            // Convert weight to normalized probability if needed, or just use weight
            // Ideally RGS should have processed this into a clean 0-1 range.
            // For now, we'll assume we probabilistic selection based on weights.
            weight: p.weight,
            isWin: p.payout > 0
        }))
        : [
            { id: 'tier_win_big', value: 100, weight: 10, isWin: true },
            { id: 'tier_win_small', value: 10, weight: 30, isWin: true },
            { id: 'tier_lose', value: 0, weight: 60, isWin: false }
        ];

    let selectedTier;

    if (forcedTierId) {
        // FORCED OUTCOME (GLI-14 Finite Deck)
        selectedTier = tiers.find(t => t.id === forcedTierId);
        if (!selectedTier) {
            console.warn(`[RGS] Forced tier '${forcedTierId}' not found in config. Falling back to RNG.`);
        }
    }

    // fallback to RNG if no force or force failed
    if (!selectedTier) {
        // Calculate total weight
        const totalWeight = tiers.reduce((sum, tier) => sum + tier.weight, 0);
        const randomValue = rng.next() * totalWeight;

        let accumulatedWeight = 0;
        selectedTier = tiers[tiers.length - 1]; // Default to last

        for (const tier of tiers) {
            accumulatedWeight += tier.weight;
            if (randomValue < accumulatedWeight) {
                selectedTier = tier;
                break;
            }
        }
    }

    // 3. Dispatch & Logic (Consolidated)
    // 4. Feature Logic: Multipliers
    let multiplier = 1;
    const multipliersConfig = config.scratch?.features?.multipliers;

    if (multipliersConfig?.enabled && selectedTier.isWin) {
        if (rng.next() < 0.25) {
            const availableMultipliers = multipliersConfig.values || [2, 5, 10];
            multiplier = rng.pick(availableMultipliers);
        }
    }

    const finalPrizeAmount = selectedTier.value * multiplier;

    // --- GAME LOGIC DISPATCHER ---
    let outcome = {};

    // Detect Game Type (simplistic check for now, can be robustified)
    if (config.instantGameType) {
        // --- INSTANT GAME LOGIC ---
        const type = config.instantGameType;
        const iConfig = config.instantGameConfig || {};

        if (type === 'plinko') {
            const rows = iConfig.plinko?.rows || 12;
            const risk = iConfig.plinko?.risk || 'medium';
            const path = [];
            for (let i = 0; i < rows; i++) {
                path.push(rng.next() > 0.5 ? 1 : 0);
            }
            const bucket = path.reduce((a, b) => a + b, 0);

            // Calculate Multiplier (Mock - should match frontend math)
            const center = rows / 2;
            const dist = Math.abs(bucket - center);
            const multiplier = parseFloat((0.5 + (dist * dist * (risk === 'high' ? 0.5 : 0.2))).toFixed(1));

            outcome = {
                type: 'plinko',
                path: path,
                bucket: bucket,
                multiplier: multiplier,
                isWin: multiplier >= 1
            };
            // Override shared vars
            multiplier = outcome.multiplier;
            selectedTier = { value: 10, isWin: outcome.isWin }; // Mock base bet
        }
        else if (type === 'mines') {
            const size = (iConfig.mines?.gridSize || 5);
            const totalCells = size * size;
            const mineCount = iConfig.mines?.mineCount || 3;

            // Generate Grid
            const grid = Array(totalCells).fill('safe');
            const minesIndices = rng.pickUnique(Array.from({ length: totalCells }, (_, i) => i), mineCount);
            minesIndices.forEach(i => grid[i] = 'mine');

            outcome = {
                type: 'mines',
                grid: grid,
                minesIndices: minesIndices
            };
            // Mines doesn't have a single "multiplier" at start, it's stateful
            multiplier = 0;
            selectedTier = { value: 10, isWin: false };
        }
        else if (type === 'coin_flip') {
            const result = rng.next() > 0.5 ? 'heads' : 'tails';
            const playerSide = iConfig.coin?.side || 'heads';
            const isWin = result === playerSide;
            const payout = isWin ? 1.96 : 0;

            outcome = {
                type: 'coin_flip',
                result: result,
                playerSide: playerSide,
                isWin: isWin
            };
            multiplier = payout;
            selectedTier = { value: 10, isWin: isWin };
        }
    }
    else if (config.scratch) {
        outcome = ScratchLogic.resolve(config, rng, selectedTier, multiplier);
    } else {
        // Fallback or Error for unknown types
        console.warn("[RGS] Unknown Game Type. Returning empty outcome.");
        outcome = { revealMap: [] };
    }

    return {
        gameId: config.gameId,
        roundId: `rnd_${Date.now()}_${Math.floor(rng.next() * 1000)}`,
        finalPrize: finalPrizeAmount,
        basePrize: selectedTier.value,
        multiplier: multiplier,
        isWin: selectedTier.isWin,
        tierId: selectedTier.id,
        revealMap: outcome.revealMap, // The Server-Authoritative Grid
        winningNumbers: outcome.winningNumbers, // For Lucky Number Games
        targetSymbol: outcome.targetSymbol, // For Find Symbol Games
        presentationSeed: presentationSeed,
        features: outcome.features || {}
    };
};
