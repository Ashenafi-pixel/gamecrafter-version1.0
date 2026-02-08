import { useState, useEffect, useCallback } from 'react';
import { ScratchConfig } from '../types';

export interface PreviewSymbol {
    id: string;
    value: string; // The text/prize to display (e.g. "€5", "100")
    icon?: string; // Optional icon URL or emoji
    type: 'prize' | 'symbol' | 'mine' | 'bonus' | 'trap';
    isWin?: boolean;
    isSpecial?: boolean; // e.g. the mine or the target
}

export interface SimulationState {
    grid: PreviewSymbol[];
    winningNumbers?: number[]; // For Lucky Numbers
    targetSymbol?: string; // For Find Symbol
    path?: number[]; // For Golden Path indices
}

export const usePreviewSimulation = (config: Partial<ScratchConfig>) => {
    const [simulation, setSimulation] = useState<SimulationState>({ grid: [] });

    // Helper: Get random cash value
    const getRandomPrize = () => {
        const prizes = ['€1', '€2', '€5', '€10', '€20', '€50', '€100', '€500', '€1,000', '€10k'];
        const weights = [30, 25, 15, 10, 8, 5, 3, 2, 1, 1];
        // Simple weighted random
        let total = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        for (let i = 0; i < prizes.length; i++) {
            if (random < weights[i]) return prizes[i];
            random -= weights[i];
        }
        return '€1';
    };

    const generateSimulation = useCallback(() => {
        const type = config.mechanic?.type || 'match_3';
        const rows = config.layout?.rows || 3;
        const cols = config.layout?.columns || 3;
        const totalCells = rows * cols;
        const newState: SimulationState = { grid: [] };

        // --- 1. MINEFIELD LOGIC ---
        if (type === 'mines') {
            // 20% mines, 80% prizes
            const grid: PreviewSymbol[] = [];
            for (let i = 0; i < totalCells; i++) {
                const isMine = Math.random() < 0.2; // 20% chance
                if (isMine) {
                    grid.push({
                        id: `cell-${i}`,
                        value: 'BOOM',
                        icon: '💣',
                        type: 'mine',
                        isSpecial: true
                    });
                } else {
                    grid.push({
                        id: `cell-${i}`,
                        value: getRandomPrize(),
                        type: 'prize'
                    });
                }
            }
            newState.grid = grid;
        }

        // --- 2. LUCKY NUMBERS LOGIC ---
        else if (type === 'lucky_number') {
            // Generate 3 winning numbers
            // Dynamic winning numbers based on grid width (Balance visual)
            const winCount = Math.max(2, Math.min(cols, 5)); // Min 2, Max 5
            const winners = Array.from({ length: winCount }, () => Math.floor(Math.random() * 50) + 1);
            newState.winningNumbers = winners;

            const grid: PreviewSymbol[] = [];
            for (let i = 0; i < totalCells; i++) {
                const isWin = Math.random() < 0.2;
                const num = isWin
                    ? winners[Math.floor(Math.random() * winners.length)] // Match
                    : Math.floor(Math.random() * 50) + 1; // Random loser

                grid.push({
                    id: `cell-${i}`,
                    value: num.toString(),
                    type: isWin ? 'prize' : 'symbol',
                    isWin: isWin
                });
            }
            newState.grid = grid;
        }

        // --- 3. FIND SYMBOL LOGIC ---
        else if (type === 'find_symbol') {
            const target = '💎';
            newState.targetSymbol = target;

            const grid: PreviewSymbol[] = [];
            // Guarantee one win?
            const winIndex = Math.floor(Math.random() * totalCells);

            for (let i = 0; i < totalCells; i++) {
                const isWin = i === winIndex;
                grid.push({
                    id: `cell-${i}`,
                    value: isWin ? getRandomPrize() : '❌',
                    icon: isWin ? target : ['🍋', '🍒', '🔔', '🍀'][Math.floor(Math.random() * 4)],
                    type: isWin ? 'prize' : 'symbol',
                    isSpecial: isWin
                });
            }
            newState.grid = grid;
        }

        // --- 4. PICK ONE LOGIC ---
        else if (type === 'pick_one') {
            const grid: PreviewSymbol[] = [];
            // In a preview, maybe show one "Open" and the rest "Closed" to demonstrate the mechanic
            // Or just show all closed "Mystery Boxes"
            const revealedIndex = 1; // Middle one revealed for demo?

            for (let i = 0; i < totalCells; i++) {
                const isRevealed = i === revealedIndex;
                grid.push({
                    id: `box-${i}`,
                    value: isRevealed ? getRandomPrize() : '???',
                    icon: isRevealed ? undefined : '🎁', // Show Gift if hidden, Value if revealed
                    type: 'bonus',
                    isSpecial: isRevealed
                });
            }
            newState.grid = grid;
        }

        // --- 4. DEFAULT (MATCH 3) ---
        else {
            const grid: PreviewSymbol[] = [];
            for (let i = 0; i < totalCells; i++) {
                grid.push({
                    id: `cell-${i}`,
                    value: getRandomPrize(),
                    type: 'prize'
                });
            }
            newState.grid = grid;
        }

        setSimulation(newState);
    }, [config.mechanic?.type, config.layout?.rows, config.layout?.columns]);

    // Initial Gen
    useEffect(() => {
        generateSimulation();
    }, [generateSimulation]);

    return { simulation, regenerate: generateSimulation };
};
