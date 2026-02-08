/**
 * Server-Side Math Engine (CommonJS)
 * 
 * This allows the Node.js server to run the same logic as the frontend
 * without needing on-the-fly TypeScript compilation.
 * 
 * In a real production setup, this would be a shared NPM package.
 */

class RNG {
    constructor(seed) {
        if (typeof seed === 'string') {
            let h = 2166136261 >>> 0;
            for (let i = 0; i < seed.length; i++) {
                h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
            }
            this.seed = h >>> 0;
        } else {
            this.seed = seed >>> 0;
        }
    }

    next() {
        let t = (this.seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    range(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    pick(array) {
        if (!array || array.length === 0) return null;
        return array[this.range(0, array.length - 1)];
    }
}

const resolveRound = (config, seedProp) => {
    const rng = new RNG(seedProp);
    const presentationSeed = rng.next() * 1000000;

    // Default Fallback
    const tiers = config.prizeTable && config.prizeTable.length > 0 ? config.prizeTable : [
        { id: 'tier_win_big', value: 100, probability: 0.1, isWin: true },
        { id: 'tier_win_small', value: 10, probability: 0.3, isWin: true },
        { id: 'tier_lose', value: 0, probability: 0.6, isWin: false }
    ];

    const rnd = rng.next();
    let accumulatedProb = 0;
    let selectedTier = tiers[tiers.length - 1];

    for (const tier of tiers) {
        accumulatedProb += tier.probability;
        if (rnd < accumulatedProb) {
            selectedTier = tier;
            break;
        }
    }

    const category = config.category || 'MATCH';
    let revealMap = [];

    switch (category) {
        case 'MATCH':
            revealMap = resolveMatchRound(config, selectedTier, rng);
            break;
        case 'GRID':
            revealMap = resolveGridRound(config, selectedTier, rng);
            break;
        case 'BONUS':
            revealMap = resolveBonusRound(config, selectedTier, rng);
            break;
        case 'PROGRESSION':
            revealMap = resolveMatchRound(config, selectedTier, rng);
            break;
        default:
            revealMap = resolveMatchRound(config, selectedTier, rng);
            break;
    }

    // --- Layer 3: Feature Modifiers (DOM-003) ---
    if (config.features?.multipliers?.enabled && config.features.multipliers.values.length > 0) {
        if (selectedTier.isWin && rng.next() > 0.8) {
            const mult = rng.pick(config.features.multipliers.values);
            selectedTier = { ...selectedTier, value: selectedTier.value * mult };
        }
    }

    return {
        roundId: `rnd_${Date.now()}_${Math.floor(rng.next() * 1000)}`,
        finalPrize: selectedTier.value,
        isWin: selectedTier.isWin,
        tierId: selectedTier.id,
        revealMap,
        presentationSeed
    };
};

// --- Helpers ---
const resolveMatchRound = (config, tier, rng) => {
    const totalCells = (config.layout?.rows || 3) * (config.layout?.columns || 3);
    const matchCount = config.match?.matchCount || 3;
    const map = new Array(totalCells).fill('');

    if (tier.isWin) {
        const winSymbol = config.symbols.win.length > 0 ? rng.pick(config.symbols.win) : 'WIN';
        const indices = new Set();
        const safeTotal = Math.min(totalCells, 100);
        while (indices.size < matchCount) {
            indices.add(rng.range(0, safeTotal - 1));
        }
        for (let i = 0; i < totalCells; i++) {
            if (indices.has(i)) {
                map[i] = winSymbol;
            } else {
                let trash = 'LOSE';
                if (config.symbols.lose.length > 0) {
                    do {
                        trash = rng.pick(config.symbols.lose);
                    } while (trash === winSymbol && config.symbols.lose.length > 1);
                }
                map[i] = trash;
            }
        }
    } else {
        for (let i = 0; i < totalCells; i++) {
            map[i] = config.symbols.lose.length > 0 ? rng.pick(config.symbols.lose) : 'LOSE';
        }
    }
    return map;
};

const resolveGridRound = (config, tier, rng) => {
    const totalCells = (config.layout?.rows || 3) * (config.layout?.columns || 3);
    const map = new Array(totalCells).fill('');

    if (tier.isWin) {
        const prizePos = rng.range(0, totalCells - 1);
        for (let i = 0; i < totalCells; i++) {
            if (i === prizePos) {
                map[i] = config.symbols.win[0] || 'PRIZE';
            } else {
                map[i] = 'BLANK';
            }
        }
    } else {
        for (let i = 0; i < totalCells; i++) {
            map[i] = 'BLANK';
        }
    }
    return map;
};

const resolveBonusRound = (config, tier, rng) => {
    const totalCells = (config.layout?.rows || 3) * (config.layout?.columns || 3);
    const map = new Array(totalCells).fill('O');
    const isBonusWin = tier.id.includes('bonus') || tier.isWin;

    if (isBonusWin) {
        const idx = rng.range(0, totalCells - 1);
        map[idx] = config.bonus?.triggerSymbol || 'BONUS';
    }
    return map;
};


module.exports = {
    RNG,
    resolveRound
};
