/**
 * Deterministic Random Number Generator (Mulberry32)
 * 
 * Used to ensure replays and previews are identical given the same seed.
 */
export class RNG {
    private seed: number;

    constructor(seed: number | string) {
        if (typeof seed === 'string') {
            // Simple hash to convert string to number
            let h = 2166136261 >>> 0;
            for (let i = 0; i < seed.length; i++) {
                h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
            }
            this.seed = h >>> 0;
        } else {
            this.seed = seed >>> 0;
        }
    }

    /**
     * Returns a float between 0 (inclusive) and 1 (exclusive).
     */
    next(): number {
        let t = (this.seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Returns an integer between min (inclusive) and max (inclusive).
     */
    range(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Returns a boolean based on probability (0-1).
     */
    chance(probability: number): boolean {
        return this.next() < probability;
    }

    /**
     * Picks a random element from an array.
     */
    pick<T>(array: T[]): T {
        return array[this.range(0, array.length - 1)];
    }
}
