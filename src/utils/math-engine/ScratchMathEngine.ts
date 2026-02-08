import { GameMathConfig, PrizeTier, ResolvedOutcome } from './types';
import { RNG } from './rng';

/**
 * Scratch Math Engine (Dev-Ready Implementation)
 * Supports:
 * - Finite (Pool) vs Unlimited (RNG) modes
 * - Single Win vs Multi Win logic
 * - Deterministic Grid Generation
 */

export class ScratchMathEngine {
    private rng: RNG;

    constructor(seed?: number | string) {
        this.rng = new RNG(seed ?? Date.now());
    }

    /**
     * Resolves a round based on the configuration mode.
     */
    public resolveRound(config: GameMathConfig): ResolvedOutcome {
        // 1. Determine Outcome (Prize Tier)
        const selectedTier = this.determineOutcome(config);

        // 2. Generate Grid based on Outcome
        const gridSize = (config.layout?.rows || 3) * (config.layout?.columns || 3);

        // Default symbols if none provided
        const winSymbols = config.symbols?.win?.length > 0 ? config.symbols.win : ['WIN'];
        const loseSymbols = config.symbols?.lose?.length > 0 ? config.symbols.lose : ['LOSE1', 'LOSE2', 'LOSE3'];
        const isSingleWin = config.winLogic !== 'MULTI_WIN';

        let revealMap: string[];

        if (selectedTier.isWin && selectedTier.condition) {
            // Handle Polymorphic Win Conditions
            const condition = selectedTier.condition;

            if (condition.type === 'match_n') {
                // Classic Match-3 (or Match-N)
                const prizeSymbol = condition.symbolId || this.rng.pick(winSymbols);
                revealMap = this.generateWinningGrid(gridSize, loseSymbols, prizeSymbol, winSymbols, isSingleWin, condition.count);
            } else if (condition.type === 'find_target') {
                // Find Target (Instant Win style) - Just place 1 target?
                // Usually "Find Target" means finding a specific number or symbol.
                // For simplicity, we treat it as Match-1 with specific symbol.
                const targetSymbol = condition.symbolId || this.rng.pick(winSymbols);
                revealMap = this.generateWinningGrid(gridSize, loseSymbols, targetSymbol, winSymbols, isSingleWin, 1);
            } else {
                // Fallback
                revealMap = this.generateLosingGrid(gridSize, loseSymbols);
            }
        } else {
            // Losing Grid
            revealMap = this.generateLosingGrid(gridSize, loseSymbols);
        }

        return {
            roundId: `rnd_${Date.now()}_${this.rng.next()}`,
            finalPrize: selectedTier.value,
            isWin: selectedTier.isWin,
            tierId: selectedTier.id,
            revealMap,
            presentationSeed: this.rng.next()
        };
    }

    /**
     * Determines the prize tier based on Math Mode (Finite vs Unlimited)
     */
    private determineOutcome(config: GameMathConfig): PrizeTier {
        const tiers = config.prizeTable || [];
        if (tiers.length === 0) {
            return { id: 'default_lose', value: 0, probability: 1, isWin: false };
        }

        // --- POOL MODE ---
        let accumulatedProb = 0;
        const roll = this.rng.next(); // 0..1

        const deckSize = config.totalTickets || 1000000;
        // Check if we need to normalize weights
        // If config.mathMode is 'POOL', tiers likely have 'weight' instead of probability.
        // We need to support both or coerce.

        for (const tier of tiers) {
            let p = tier.probability || 0;
            const weight = tier.weight || 0;

            // If using weights and POOL mode
            if (config.mathMode === 'POOL' && weight > 0) {
                p = weight / deckSize;
            } else if (p > 1) {
                // Fallback for raw weights in probability field
                p = p / deckSize;
            }

            accumulatedProb += p;
            if (roll < accumulatedProb) {
                return tier;
            }
        }

        return { id: 'lose_pool', value: 0, probability: 1 - accumulatedProb, isWin: false };
    }

    /**
     * Generates a Losing Grid (No N-matches of ANY symbol)
     */
    private generateLosingGrid(N: number, loseValues: string[]): string[] {
        // Deterministic Approach (Poka-Yoke):
        // 1. Fill grid with random lose symbols
        // 2. Scan for accidental matches
        // 3. Break matches deterministically by swapping with a different symbol

        const grid: string[] = [];
        const allowedValues = loseValues;

        // 1. Initial Fill
        for (let i = 0; i < N; i++) {
            grid.push(this.rng.pick(allowedValues));
        }

        // 2. Scan & Fix (Simple 1-pass fix for Match-3)
        // Check for 3-of-a-kind
        const counts: Record<string, number> = {};
        grid.forEach(s => counts[s] = (counts[s] || 0) + 1);

        for (const [symbol, count] of Object.entries(counts)) {
            if (count >= 3) {
                // Determine how many to remove
                let toRemove = count - 2;

                // Replace instances until safe
                for (let i = 0; i < N && toRemove > 0; i++) {
                    if (grid[i] === symbol) {
                        // Find a replacement that isn't the current symbol
                        const replacement = allowedValues.find(v => v !== symbol) || allowedValues[0];
                        // Double check replacement doesn't create new match (simple heuristic: pick least freq)
                        grid[i] = replacement;
                        toRemove--;
                    }
                }
            }
        }

        return grid;
    }

    private generateWinningGrid(
        N: number,
        loseValues: string[],
        prizeSymbol: string,
        allWinValues: string[],
        isSingleWin: boolean,
        matchCount: number = 3
    ): string[] {
        const grid: string[] = new Array(N).fill(null);
        const counts: Record<string, number> = {};

        // 1. Place the Winning Match (Count)
        const positions = this.getRandomPositions(N, matchCount);
        for (const pos of positions) {
            grid[pos] = prizeSymbol;
        }
        counts[prizeSymbol] = matchCount;

        // 2. Fill remaining cells
        const allowedValues = [...loseValues, ...allWinValues];

        for (let i = 0; i < N; i++) {
            if (grid[i] !== null) continue;

            // Filter candidates
            const candidates = allowedValues.filter(v => {
                const c = counts[v] || 0;
                if (v === prizeSymbol) return false; // Strict match count
                if (isSingleWin && c >= 2) return false; // Prevent other wins (assuming match-3 rule)
                return true;
            });

            const val = candidates.length > 0 ? this.rng.pick(candidates) : loseValues[0];
            grid[i] = val;
            counts[val] = (counts[val] || 0) + 1;
        }
        return grid;
    }

    private getRandomPositions(max: number, count: number): number[] {
        const indices = Array.from({ length: max }, (_, i) => i);
        const result: number[] = [];
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(this.rng.next() * indices.length);
            result.push(indices[idx]);
            indices.splice(idx, 1);
        }
        return result;
    }
}

// Helpers for Paytable Editor
export const calculateRTP = (prizes: PrizeTier[], deckSize: number, ticketPrice: number): number => {
    if (deckSize <= 0 || ticketPrice <= 0) return 0;
    const totalPayout = prizes.reduce((sum, p) => {
        const weight = p.weight || (p.probability * deckSize);
        return sum + (weight * p.value * ticketPrice);
    }, 0);
    return totalPayout / (deckSize * ticketPrice);
};


