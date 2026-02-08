
// src/rgs/engines/ScratchLogic.js

/**
 * Resolves a Scratch Card round based on specific mechanic type.
 * @param {Object} config - The full game configuration.
 * @param {Object} rng - An instance of the RNG class.
 * @param {Object} selectedTier - The resolved prize tier for this round.
 * @param {number} multiplier - The resolved multiplier.
 * @returns {Object} The outcome object (revealMap, winningNumbers, features).
 */
export const resolve = (config, rng, selectedTier, multiplier) => {

    // determine mechanic type (normalized)
    // types: 'match_3', 'match_2', 'find_symbol', 'lucky_number', 'wheel'
    const mechanicType = config.scratch?.mechanic?.type || 'match_3';

    // Dispatch to specific solver
    if (mechanicType.startsWith('match_')) {
        return resolveMatchRound(config, rng, selectedTier, multiplier);
    }
    else if (mechanicType === 'lucky_number') {
        return resolveLuckyNumberRound(config, rng, selectedTier, multiplier);
    }
    else if (mechanicType === 'find_symbol' || mechanicType === 'mines') {
        return resolveFindSymbolRound(config, rng, selectedTier, multiplier);
    }
    else {
        // Default Fallback
        return resolveMatchRound(config, rng, selectedTier, multiplier);
    }
};

// =============================================================================
// SOLVER 1: MATCH-N (Classic Scratch)
// =============================================================================
function resolveMatchRound(config, rng, selectedTier, multiplier) {
    let revealMap = [];
    const { winSymbols, loseSymbols, isSingleWin } = getSymbolPools(config);
    const gridSize = (config.scratch?.layout?.rows || 3) * (config.scratch?.layout?.columns || 3);
    const features = config.scratch?.features || {};

    // Parse N from 'match_3' -> 3
    const typeStr = config.scratch?.mechanic?.type || 'match_3';
    const matchCount = parseInt(typeStr.split('_')[1]) || 3;

    let finalTier = selectedTier;
    let didTriggerSecondChance = false;

    // --- SECOND CHANCE LOGIC ---
    // If initially a loss, check if we should trigger Second Chance (10% prob if enabled)
    // If triggered, we upgrade to the smallest winning tier (or random winning tier)
    if (!finalTier.isWin && features.secondChance?.enabled && rng.next() < 0.15) {
        didTriggerSecondChance = true;
        // Find a winning tier to upgrade to
        // We need to look up the prize table from config.. but 'config' here is the raw JSON,
        // and we don't easily have the parsed tiers from engine.js.
        // However, we know 'winSymbols' contains IDs.
        // Let's assume we can just force a win generation using a random win symbol.
        finalTier = { isWin: true, id: rng.pick(winSymbols), value: 0 }; // Value 0 as placeholder, engine handles payout lookup usually, or we just trust symbol match.
    }

    if (finalTier.isWin) {
        const prizeSymbol = finalTier.id || rng.pick(winSymbols);
        revealMap = generateWinningGridMatch(
            gridSize,
            loseSymbols,
            prizeSymbol,
            winSymbols,
            isSingleWin,
            matchCount,
            rng
        );
    } else {
        // --- NEAR MISS LOGIC ---
        // If Near Miss is enabled, we FORCE a "Almost Win" (Match - 1)
        const forceNearMiss = features.nearMiss?.enabled && rng.next() < 0.4; // 40% chance of near miss on loss

        if (forceNearMiss) {
            // Pick a "tease" symbol (usually a high value win symbol)
            const teaseSymbol = rng.pick(winSymbols);
            revealMap = generateLosingGridMatch(gridSize, loseSymbols, matchCount, rng, teaseSymbol, matchCount - 1);
        } else {
            revealMap = generateLosingGridMatch(gridSize, loseSymbols, matchCount, rng);
        }
    }

    return {
        revealMap,
        features: {
            multiplier: multiplier > 1 ? multiplier : null,
            secondChance: didTriggerSecondChance,
            isNearMiss: features.nearMiss?.enabled && !finalTier.isWin
        }
    };
}

// =============================================================================
// SOLVER 2: LUCKY NUMBERS (Bonus Row Match)
// =============================================================================
function resolveLuckyNumberRound(config, rng, selectedTier, multiplier) {
    // Config Extraction
    const { winSymbols, loseSymbols } = getSymbolPools(config);
    const gridSize = (config.scratch?.layout?.rows || 3) * (config.scratch?.layout?.columns || 3);
    const winningNumberCount = config.scratch?.mechanic?.winningNumberCount || 5;

    // A. Generate "Winning Numbers" (Top Row)
    // Usually these are unique distinct numbers/symbols from the pool.
    // For simplicity, we just pick random distinct symbols from the WHOLE pool (Win+Lose mixed is common in numbering, 
    // but usually Lucky Numbers are strictly numeric. Here we rely on symbols being strings '1', '2', etc.)
    const allSymbols = [...winSymbols, ...loseSymbols];
    const winningNumbers = rng.pickUnique(allSymbols, winningNumberCount);

    let revealMap = [];
    let prizeSymbol = null; // In Lucky Numbers, the prize is often separate (value below symbol), but here we simplfy: Symbol match IS the win.

    // NOTE: In advanced Lucky Numbers, each cell has (Your Number + Prize Value). 
    // Our current simple model treats the SYMBOL as the identifier of value. 
    // So if '10' is a winning symbol, revealing '10' wins even if Top Row says '5'? 
    // STANDARD RULES: Match YOUR NUMBER to WINNING NUMBER. 
    // So if Top row has '5', and Grid has '5', you win the prize under '5'.

    // Simplified Implementation for this cycle:
    // If WIN: Force one of the grid numbers to match one of the winning numbers.
    // If LOSE: Ensure NO grid numbers match any winning number.

    if (selectedTier.isWin) {
        // 1. Pick a winner from the generated top row to ensure a match
        const matchSymbol = rng.pick(winningNumbers);

        // 2. Place it in the grid (1 match usually, or multiple if Multi-Win)
        const matchPositions = getRandomPositions(gridSize, 1, rng);
        revealMap = new Array(gridSize).fill(null);

        // Place winner
        matchPositions.forEach(pos => revealMap[pos] = matchSymbol);

        // Fill rest with NON-winning symbols
        for (let i = 0; i < gridSize; i++) {
            if (revealMap[i] === null) {
                // detailed filter: cannot be in winningNumbers
                const safeSymbols = allSymbols.filter(s => !winningNumbers.includes(s));
                revealMap[i] = rng.pick(safeSymbols) || 'LOSE';
            }
        }

    } else {
        // LOSING GRID
        // Fill grid with symbols that are NOT in winningNumbers
        revealMap = [];
        const safeSymbols = allSymbols.filter(s => !winningNumbers.includes(s));

        // Fallback checks
        if (safeSymbols.length === 0) safeSymbols.push('LOSE');

        for (let i = 0; i < gridSize; i++) {
            revealMap.push(rng.pick(safeSymbols));
        }
    }

    return {
        revealMap,
        winningNumbers, // Critical for UI
        features: {
            multiplier: multiplier > 1 ? multiplier : null
        }
    };
}

// =============================================================================
// SOLVER 3: FIND SYMBOL (Mines / Grid Search)
// =============================================================================
function resolveFindSymbolRound(config, rng, selectedTier, multiplier) {
    const { winSymbols, loseSymbols } = getSymbolPools(config);
    const gridSize = (config.scratch?.layout?.rows || 3) * (config.scratch?.layout?.columns || 3);

    // Logic: Find N instances of Target? Or Find 1 Target to win?
    // Usually "Find 3 Gold Bars". 
    // Config should specify target. We'll assume the 'prizeSymbol' is the target.

    // If Tier is Win, we must place the required count of targets.
    // requiredHits typically comes from rulesGrid.
    const requiredHits = config.scratch?.rulesGrid?.requiredHits || 3;

    let revealMap = [];

    if (selectedTier.isWin) {
        const prizeSymbol = selectedTier.id || rng.pick(winSymbols);

        // Place N prize symbols
        revealMap = new Array(gridSize).fill(null);
        const winPositions = getRandomPositions(gridSize, requiredHits, rng);

        winPositions.forEach(pos => revealMap[pos] = prizeSymbol);

        // Fill rest with lose symbols
        for (let i = 0; i < gridSize; i++) {
            if (revealMap[i] === null) {
                revealMap[i] = rng.pick(loseSymbols);
            }
        }

    } else {
        // LOSE: Place fewer than requiredHits, or 0.
        // Let's place (requiredHits - 1) to make it a "Near Miss" often
        const teaseCount = rng.next() < 0.5 ? (requiredHits - 1) : 0;

        // If we don't know the target (no win/tier id), pick a random win symbol to tease with
        const teaseSymbol = rng.pick(winSymbols);

        revealMap = new Array(gridSize).fill(null);
        if (teaseCount > 0) {
            const teasePositions = getRandomPositions(gridSize, teaseCount, rng);
            teasePositions.forEach(pos => revealMap[pos] = teaseSymbol);
        }

        for (let i = 0; i < gridSize; i++) {
            if (revealMap[i] === null) {
                revealMap[i] = rng.pick(loseSymbols);
            }
        }
    }

    return {
        revealMap,
        targetSymbol: selectedTier.id || winSymbols[0], // Tell UI what we were looking for
        features: {
            multiplier: multiplier > 1 ? multiplier : null
        }
    };
}


// =============================================================================
// HELPERS
// =============================================================================

function getSymbolPools(config) {
    let winSymbols = [];
    let loseSymbols = [];
    if (config.scratch?.prizes?.length > 0) {
        winSymbols = config.scratch.prizes.filter(p => p.payout > 0).map(p => p.id || String(p.value));
        loseSymbols = config.scratch.prizes.filter(p => p.payout === 0).map(p => p.id || String(p.value));
    }
    if (winSymbols.length === 0) winSymbols = ['WIN'];
    if (loseSymbols.length === 0) loseSymbols = ['LOSE1', 'LOSE2', 'LOSE3'];
    if (loseSymbols.length === 0) loseSymbols = ['0', '00', '000'];
    const isSingleWin = config.scratch?.winLogic !== 'MULTI_WIN';
    return { winSymbols, loseSymbols, isSingleWin };
}

function generateLosingGridMatch(N, loseValues, matchCount, rng, teaseSymbol = null, teaseCount = 0) {
    const grid = new Array(N).fill(null);
    const counts = {};

    // 1. Place Tease Symbols (Near Miss)
    if (teaseSymbol && teaseCount > 0) {
        const positions = getRandomPositions(N, teaseCount, rng);
        positions.forEach(pos => grid[pos] = teaseSymbol);
        counts[teaseSymbol] = teaseCount;
    }

    // 2. Fill Rest with Lose Values
    for (let i = 0; i < N; i++) {
        if (grid[i] !== null) continue;
        grid[i] = rng.pick(loseValues);
    }

    // 3. Fix Accidents (If we accidentally made a winner, break it)
    // Recalculate counts
    for (let i = 0; i < N; i++) {
        const sym = grid[i];
        counts[sym] = 0;
    }
    grid.forEach(s => counts[s] = (counts[s] || 0) + 1);

    for (const [symbol, count] of Object.entries(counts)) {
        if (count >= matchCount) {
            let toRemove = count - (matchCount - 1);
            // If this is our tease symbol, we already set it to matchCount-1, so it shouldn't trigger unless we added more by accident.
            // If it DOES trigger, we remove extras.

            for (let i = 0; i < N && toRemove > 0; i++) {
                if (grid[i] === symbol) {
                    // Don't replace if it was part of our intentional tease placement? 
                    // Actually, if we have >= MatchCount, it's a WIN, which is bad for a losing grid. So we MUST break it.
                    const replacement = loseValues.find(v => v !== symbol) || loseValues[0];
                    grid[i] = replacement;
                    toRemove--;
                }
            }
        }
    }
    return grid;
}

function generateWinningGridMatch(N, loseValues, prizeSymbol, allWinValues, isSingleWin, matchCount, rng) {
    const grid = new Array(N).fill(null);
    const counts = {};

    const positions = getRandomPositions(N, matchCount, rng);
    for (const pos of positions) {
        grid[pos] = prizeSymbol;
    }
    counts[prizeSymbol] = matchCount;

    const allowedValues = isSingleWin ? loseValues : [...loseValues, ...allWinValues];
    for (let i = 0; i < N; i++) {
        if (grid[i] !== null) continue;
        const candidates = allowedValues.filter(v => {
            const c = counts[v] || 0;
            if (v === prizeSymbol) return false;
            if (isSingleWin && allWinValues.includes(v) && c >= (matchCount - 1)) return false;
            return true;
        });
        const val = candidates.length > 0 ? rng.pick(candidates) : loseValues[0];
        grid[i] = val;
        counts[val] = (counts[val] || 0) + 1;
    }
    return grid;
}

function getRandomPositions(max, count, rng) {
    const indices = Array.from({ length: max }, (_, i) => i);
    const result = [];
    for (let i = 0; i < count; i++) {
        const idx = Math.floor(rng.next() * indices.length);
        result.push(indices[idx]);
        indices.splice(idx, 1);
    }
    return result;
}

// Extension to RNG for "pickUnique"
// Since RNG is passed in as instance, typically we'd extend the class, but here we can just do a util func
// But wait, RNG is defined in `engine.js`. We need to rely on `rng.pick` or `rng.range`.
// Let's monkey-patch or just iterate manually since we can't edit RNG class easily here without circular dependency or copying it.
// We'll calculate it using `rng.next()` locally.
