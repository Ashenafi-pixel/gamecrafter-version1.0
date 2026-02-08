
import { GameConfig } from '../../types';

export interface SpinResult {
    isWin: boolean;
    totalWin: number;
    winAmount: number; // Raw coin value
    multiplier: number; // TotalWin / TotalBet
    grid: string[][];
    winningLines: WinningLine[];
    featuresTriggered: string[];
}

export interface WinningLine {
    lineIndex?: number;
    symbol: string;
    count: number;
    win: number;
    positions: number[][]; // [row, col]
    type: 'line' | 'way' | 'cluster';
}

// Standard 20 Lines for 5x3
const STANDARD_LINES_5x3 = [
    [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], // Rows
    [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], // V shapes
    [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], // Diagonals
    [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], // M/W
    [0, 1, 0, 1, 0], [2, 1, 2, 1, 2], // Alternating
    [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], // Valleys/Hills
    [0, 1, 1, 1, 0], [2, 1, 1, 1, 2],
    [0, 2, 0, 2, 0], [2, 0, 2, 0, 2], // Deep Alt
    [0, 2, 2, 2, 0], [2, 0, 0, 0, 2],
    [0, 0, 2, 0, 0], [2, 2, 0, 2, 2]
];

/**
 * Deterministic RNG
 */
const seededRandom = (seed: string) => {
    let h = 0xdeadbeef;
    for (let i = 0; i < seed.length; i++)
        h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);

    return () => {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return ((h >>> 0) / 4294967296);
    }
};

/**
 * Generates a random grid
 */
const generateGrid = (rows: number, cols: number, symbols: string[], rng: () => number): string[][] => {
    const grid: string[][] = [];
    for (let r = 0; r < rows; r++) {
        const row: string[] = [];
        for (let c = 0; c < cols; c++) {
            const idx = Math.floor(rng() * symbols.length);
            row.push(symbols[idx]);
        }
        grid.push(row);
    }
    return grid;
};

// --- MECHANIC 1: BETLINES ---
const evaluateBetlines = (grid: string[][], betPerLine: number): WinningLine[] => {
    const wins: WinningLine[] = [];
    const lines = STANDARD_LINES_5x3;

    lines.forEach((lineDef, lineIdx) => {
        // Guard against grid size mismatch
        if (!grid[0] || lineDef.length > grid[0].length) return;

        const lineSymbols: { val: string, r: number, c: number }[] = [];

        for (let c = 0; c < lineDef.length; c++) {
            const r = lineDef[c];
            if (r < grid.length) {
                lineSymbols.push({ val: grid[r][c], r, c });
            }
        }

        if (lineSymbols.length < 3) return;

        const firstSym = lineSymbols[0].val;
        let count = 1;
        const positions = [[lineSymbols[0].r, lineSymbols[0].c]];

        for (let i = 1; i < lineSymbols.length; i++) {
            const current = lineSymbols[i].val;
            // TODO: Add Wild logic here
            if (current === firstSym) {
                count++;
                positions.push([lineSymbols[i].r, lineSymbols[i].c]);
            } else {
                break;
            }
        }

        if (count >= 3) {
            // Mock payout: (Count-2) * 5 * BetPerLine
            // e.g. 3 => 5x, 4 => 10x, 5 => 15x
            const payout = ((count - 2) * 5) * betPerLine;
            wins.push({
                lineIndex: lineIdx + 1,
                symbol: firstSym,
                count,
                win: payout,
                positions,
                type: 'line'
            });
        }
    });

    return wins;
};

// --- MECHANIC 2: WAYS TO WIN (Left-to-Right) ---
const evaluateWays = (grid: string[][], betSize: number): WinningLine[] => {
    const wins: WinningLine[] = [];
    if (!grid.length) return wins;

    const rows = grid.length;
    const cols = grid[0].length;

    // Check distinct symbols on reel 1 to start potential ways
    const startSymbols = new Set<string>();
    for (let r = 0; r < rows; r++) startSymbols.add(grid[r][0]);

    startSymbols.forEach(sym => {
        let reelCount = 1;
        let totalWays = 0;
        let positions: number[][] = [];

        // Collect positions on reel 1
        for (let r = 0; r < rows; r++) {
            if (grid[r][0] === sym) positions.push([r, 0]);
        }
        let currentWays = positions.length;

        // Check subsequent reels
        for (let c = 1; c < cols; c++) {
            let countOnReel = 0;
            const waysPositions: number[][] = [];
            for (let r = 0; r < rows; r++) {
                if (grid[r][c] === sym) { // Add Wild check here
                    countOnReel++;
                    waysPositions.push([r, c]);
                }
            }

            if (countOnReel > 0) {
                reelCount++;
                currentWays *= countOnReel;
                positions = [...positions, ...waysPositions];
            } else {
                break;
            }
        }

        if (reelCount >= 3) {
            // Mock payout for ways: usually lower than lines because ways multiplier is high
            // e.g. 3 => 1x, 4 => 2x, 5 => 5x
            const basePay = (reelCount - 2) * 2;
            const totalWin = basePay * currentWays * (betSize / 20); // Normalized bet

            wins.push({
                symbol: sym,
                count: reelCount, // Reels involved
                win: totalWin,
                positions, // All involved positions
                type: 'way'
            });
        }
    });

    return wins;
};

// --- MECHANIC 3: CLUSTER PAYS ---
const evaluateCluster = (grid: string[][], betSize: number): WinningLine[] => {
    const wins: WinningLine[] = [];
    const rows = grid.length;
    const cols = grid[0].length;
    const visited = new Set<string>();

    const getKey = (r: number, c: number) => `${r},${c}`;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (visited.has(getKey(r, c))) continue;

            const sym = grid[r][c];
            const cluster: number[][] = [];
            const queue = [[r, c]];
            visited.add(getKey(r, c));

            while (queue.length > 0) {
                const [currR, currC] = queue.shift()!;
                cluster.push([currR, currC]);

                // Check 4 neighbors
                const neighbors = [
                    [currR - 1, currC], [currR + 1, currC],
                    [currR, currC - 1], [currR, currC + 1]
                ];

                for (const [nR, nC] of neighbors) {
                    if (nR >= 0 && nR < rows && nC >= 0 && nC < cols) {
                        if (!visited.has(getKey(nR, nC)) && grid[nR][nC] === sym) {
                            visited.add(getKey(nR, nC));
                            queue.push([nR, nC]);
                        }
                    }
                }
            }

            if (cluster.length >= 5) { // Min Cluster Size 5
                // Payout: Size * 0.5x approx
                const payout = cluster.length * 0.5 * (betSize / 10);
                wins.push({
                    symbol: sym,
                    count: cluster.length,
                    win: payout,
                    positions: cluster,
                    type: 'cluster'
                });
            }
        }
    }

    return wins;
};

/**
 * Helper: Refill Grid after Cascades
 */
const performCascade = (grid: string[][], winningPositions: number[][], symbols: string[], rng: () => number): string[][] => {
    const rows = grid.length;
    const cols = grid[0].length;

    // 1. Create a copy to mutate
    const newGrid = grid.map(r => [...r]);

    // 2. Mark removals
    winningPositions.forEach(([r, c]) => {
        newGrid[r][c] = ''; // Empty
    });

    // 3. Drop Down
    for (let c = 0; c < cols; c++) {
        let writeRow = rows - 1;
        // Scan bottom up
        for (let r = rows - 1; r >= 0; r--) {
            if (newGrid[r][c] !== '') {
                newGrid[writeRow][c] = newGrid[r][c];
                if (writeRow !== r) newGrid[r][c] = '';
                writeRow--;
            }
        }
    }

    // 4. Refill Top
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            if (newGrid[r][c] === '') {
                const idx = Math.floor(rng() * symbols.length);
                newGrid[r][c] = symbols[idx];
            }
        }
    }

    return newGrid;
};

/**
 * Main Resolver Function
 */
export const resolveSpin = (config: GameConfig, seed: string): SpinResult => {
    const rng = seededRandom(seed);

    // 1. Setup
    const rows = config.reels?.layout?.rows || 3;
    const cols = config.reels?.layout?.reels || 5;
    const symbols = Object.keys(config.theme?.generated?.symbols || { 'S1': 1, 'S2': 1, 'S3': 1, 'S4': 1, 'S5': 1 });

    if (symbols.length === 0) symbols.push('H1', 'H2', 'H3', 'L1', 'L2', 'L3');

    // 2. Initial Spin
    let grid = generateGrid(rows, cols, symbols, rng);
    const mechanism = config.reels?.payMechanism || 'betlines';
    const bet = 10; // Normalized total bet

    let allWinningLines: WinningLine[] = [];
    let cumulativeWin = 0;
    let cascadeCount = 0;
    const MAX_CASCADES = 10;

    // 3. Loop for Cascades (Only if Cluster or explicitly enabled)
    // For now, auto-enable for Cluster
    const isCascadeEnabled = mechanism === 'cluster';

    do {
        // Evaluate
        let currentWins: WinningLine[] = [];
        if (mechanism === 'ways') {
            currentWins = evaluateWays(grid, bet);
        } else if (mechanism === 'cluster') {
            currentWins = evaluateCluster(grid, bet);
        } else {
            currentWins = evaluateBetlines(grid, bet / 20); // bet per line
        }

        if (currentWins.length > 0) {
            allWinningLines = [...allWinningLines, ...currentWins];
            cumulativeWin += currentWins.reduce((sum, w) => sum + w.win, 0);

            if (isCascadeEnabled) {
                // Collect clear positions
                const clearPositions = currentWins.flatMap(w => w.positions);
                grid = performCascade(grid, clearPositions, symbols, rng);
                cascadeCount++;
            } else {
                break; // No cascade, just one spin
            }
        } else {
            break; // No more wins
        }

    } while (isCascadeEnabled && cascadeCount < MAX_CASCADES);

    return {
        isWin: cumulativeWin > 0,
        totalWin: cumulativeWin,
        winAmount: cumulativeWin,
        multiplier: cumulativeWin / bet,
        grid, // Returns the FINAL state after cascades
        winningLines: allWinningLines,
        featuresTriggered: cascadeCount > 0 ? ['cascade'] : []
    };
};
