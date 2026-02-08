import { ScratchConfig, ScratchPrizeTier } from '../../types';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Validates the Scratch Card configuration against game rules and constraints.
 */
export const validateScratchConfig = (config: ScratchConfig): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
    };

    if (!config) {
        result.isValid = false;
        result.errors.push("Configuration is missing.");
        return result;
    }

    // 1. Grid & Layout Validation
    const totalCells = (config.layout?.rows || 3) * (config.layout?.columns || 3);

    if (config.mechanic?.type === 'match_3') {
        if (totalCells < 3) {
            result.errors.push("Match-3 games require at least 3 grid cells.");
        }
        if (totalCells < 6) {
            result.warnings.push("Match-3 games usually play better with at least 6 cells (e.g. 3x2).");
        }
    }

    // 2. Mechanic Validation
    if (config.mechanic?.type === 'find_symbol') {
        if (!config.mechanic?.winningSymbol && !config.rulesGrid?.targetSymbolId) {
            result.warnings.push("Ensure a 'Target Symbol' is defined for Symbol Hunt games.");
        }
        if (config.rulesGrid) {
            if (config.rulesGrid.requiredHits !== undefined) {
                if (config.rulesGrid.requiredHits > totalCells) {
                    result.errors.push(`Required Hits (${config.rulesGrid.requiredHits}) cannot exceed Total Cells (${totalCells}).`);
                }
                if (config.rulesGrid.requiredHits < 1) {
                    result.errors.push("Required Hits must be at least 1.");
                }
            }
        }
    }

    // 3. Prize Structure Validation
    if (config.prizes && config.prizes.length > 0) {
        let totalPrizeTickets = 0;
        let hasGrandPrizeWinner = false;
        let maxPayout = -1;

        config.prizes.forEach(tier => {
            totalPrizeTickets += tier.weight;

            // Check for Max Price
            if (tier.payout > maxPayout) {
                maxPayout = tier.payout;
                // If this is the new max, check count
                hasGrandPrizeWinner = tier.weight > 0;
            } else if (tier.payout === maxPayout) {
                // If tied for max, any having > 0 is fine
                if (tier.weight > 0) hasGrandPrizeWinner = true;
            }

            // Zero value logic
            if (tier.payout > 0 && tier.weight === 0) {
                result.warnings.push(`Prize '${tier.name}' has 0 tickets/chance. Ideally remove it or add tickets.`);
            }
        });

        if (totalPrizeTickets <= 0) {
            result.errors.push("Total prize weight must be greater than 0.");
        }

        // Finite Mode Checks (if totalTickets defined)
        if (config.math?.totalTickets && config.math.mathMode === 'POOL') {
            if (totalPrizeTickets > config.math.totalTickets) {
                result.errors.push(`Total winning tickets (${totalPrizeTickets}) exceeds the Deck Size (${config.math.totalTickets}). Increase deck size or reduce winners.`);
            }
            if (!hasGrandPrizeWinner) {
                result.errors.push("The Top Prize has 0 winning tickets. That's not fair! Please add at least 1.");
            }
        }
    } else {
        result.warnings.push("No prize structure defined. Game will have no wins.");
    }

    // 4. Feature Validation
    if (config.features?.bonusZones?.enabled && config.features.bonusZones.count < 1) {
        result.errors.push("If Bonus Zones are enabled, Count must be at least 1.");
    }

    result.isValid = result.errors.length === 0;
    return result;
};

/**
 * Returns smart defaults based on the selected mechanic category (Layer 1).
 */
export const getScratchDefaults = (type: string): Partial<ScratchConfig> => {
    switch (type) {
        case 'match_2':
            return {
                mechanic: { type: 'match_2' },
                layout: { rows: 3, columns: 3, shape: 'square' },
                brush: { size: 30 },
                prizes: [
                    { id: 'm2_1', name: 'Perfect Pair', image: '/assets/symbols/high_1.png', condition: { type: 'match_n', count: 2, symbolId: 'gem_1' }, payout: 10, weight: 1000, probability: 1.0 },
                    { id: 'm2_2', name: 'Money Back', image: '/assets/symbols/mid_1.png', condition: { type: 'match_n', count: 2, symbolId: 'gem_2' }, payout: 1, weight: 5000, probability: 5.0 }
                ]
            };
        case 'match_4':
            return {
                mechanic: { type: 'match_4' },
                layout: { rows: 4, columns: 4, shape: 'square' }, // Requires bigger grid
                brush: { size: 15 },
                prizes: [
                    { id: 'm4_1', name: 'Ultra Match', image: '/assets/symbols/high_1.png', condition: { type: 'match_n', count: 4, symbolId: 'gem_1' }, payout: 500, weight: 10, probability: 0.01 },
                    { id: 'm4_2', name: 'Super Match', image: '/assets/symbols/mid_1.png', condition: { type: 'match_n', count: 4, symbolId: 'gem_2' }, payout: 50, weight: 100, probability: 0.1 },
                    { id: 'm4_3', name: 'Win', image: '/assets/symbols/low_1.png', condition: { type: 'match_n', count: 4, symbolId: 'gem_3' }, payout: 5, weight: 5000, probability: 5.0 }
                ]
            };
        case 'find_symbol':
            return {
                mechanic: { type: 'find_symbol', winningSymbol: '/assets/symbols/defstar.png' },
                rulesGrid: {
                    ruleMode: 'COLLECT_X',
                    targetSymbolId: '/assets/symbols/defstar.png',
                    requiredHits: 3,
                    revealStyle: 'MANUAL',
                    grid: { rows: 4, cols: 4 }
                },
                layout: { rows: 4, columns: 4, shape: 'square' },
                brush: { size: 20 },
                prizes: [
                    { id: 'fs_1', name: 'Found 10', image: '/assets/symbols/defstar.png', condition: { type: 'match_n', count: 10, symbolId: '/assets/symbols/defstar.png' }, payout: 1000, weight: 10000, probability: 1.0 },
                    { id: 'fs_2', name: 'Found 5', image: '/assets/symbols/defstar.png', condition: { type: 'match_n', count: 5, symbolId: '/assets/symbols/defstar.png' }, payout: 50, weight: 50000, probability: 5.0 },
                    { id: 'fs_3', name: 'Found 3', image: '/assets/symbols/defstar.png', condition: { type: 'match_n', count: 3, symbolId: '/assets/symbols/defstar.png' }, payout: 2, weight: 400000, probability: 40.0 }
                ]
            };
        case 'golden_path':
            return {
                mechanic: { type: 'golden_path', winningSymbol: 'path_end' },
                presentation: { style: 'PATH', pathNodes: 12 },
                layout: { rows: 4, columns: 3, shape: 'custom' },
                brush: { size: 15 },
                prizes: [
                    { id: 'gp_1', name: 'Finish Line', image: '/assets/mechanics/progression.jpg', condition: { type: 'match_n', count: 12, symbolId: 'path_step' }, payout: 100, weight: 100, probability: 0.1 },
                    { id: 'gp_2', name: 'Half Way', image: '/assets/mechanics/progression.jpg', condition: { type: 'match_n', count: 6, symbolId: 'path_step' }, payout: 2, weight: 5000, probability: 5.0 }
                ]
            };
        case 'lucky_number':
            return {
                mechanic: { type: 'lucky_number', winningSymbol: '7' },
                layout: { rows: 3, columns: 3, shape: 'square' },
                brush: { size: 20 },
                prizes: [
                    { id: 'ln_1', name: 'Match 3', image: '/assets/symbols/7.png', condition: { type: 'match_n', count: 3, symbolId: 'wild' }, payout: 100, weight: 50, probability: 0.05 },
                    { id: 'ln_2', name: 'Match 1', image: '/assets/symbols/7.png', condition: { type: 'match_n', count: 1, symbolId: 'wild' }, payout: 2, weight: 10000, probability: 10.0 }
                ]
            };
        case 'pick_one':
            return {
                mechanic: { type: 'pick_one', winningSymbol: 'box_open' },
                presentation: { style: 'PICK_A_BOX', zones: 3 },
                layout: { rows: 1, columns: 3, shape: 'rectangle' },
                brush: { size: 40 },
                prizes: [
                    { id: 'po_1', name: 'Grand Prize', image: '/assets/symbols/box_closed.png', condition: { type: 'match_n', count: 1, symbolId: 'prize_1' }, payout: 10, weight: 33, probability: 3.3 },
                    { id: 'po_2', name: 'Consolation', image: '/assets/symbols/box_open.png', condition: { type: 'match_n', count: 1, symbolId: 'prize_2' }, payout: 1, weight: 33, probability: 3.3 }
                ]
            };
        case 'wheel':
            return {
                mechanic: { type: 'wheel', winningSymbol: 'arrow' },
                layout: { rows: 1, columns: 1, shape: 'circle' },
                brush: { size: 0 }, // No brush usually
                presentation: { style: 'SINGLE_ZONE' },
                prizes: [
                    { id: 'wh_1', name: 'Jackpot Sector', image: '/assets/symbols/high_1.png', condition: { type: 'match_n', count: 1, symbolId: 'sec_1' }, payout: 100, weight: 1, probability: 0.1 },
                    { id: 'wh_2', name: 'Big Sector', image: '/assets/symbols/mid_1.png', condition: { type: 'match_n', count: 1, symbolId: 'sec_2' }, payout: 20, weight: 10, probability: 1.0 },
                    { id: 'wh_3', name: 'Common Sector', image: '/assets/symbols/low_1.png', condition: { type: 'match_n', count: 1, symbolId: 'sec_3' }, payout: 2, weight: 50, probability: 5.0 }
                ]
            };
        case 'instant_win':
            return {
                mechanic: { type: 'instant_win', winningSymbol: 'cash' },
                layout: { rows: 1, columns: 1, shape: 'square' },
                brush: { size: 50 },
                prizes: [
                    { id: 'iw_1', name: 'Instant Cash', image: 'https://cdn-icons-png.flaticon.com/512/2488/2488749.png', condition: { type: 'match_n', count: 1, symbolId: 'cash' }, payout: 5, weight: 100, probability: 10.0 }
                ]
            };
        case 'journey':
            return {
                mechanic: { type: 'journey', winningSymbol: 'level_complete' },
                layout: { rows: 1, columns: 3, shape: 'landscape' }, // 3 Levels
                brush: { size: 30 },
                presentation: { style: 'STAGES', zones: 3 },
                prizes: [
                    { id: 'j_1', name: 'Complete Journey', image: '/assets/mechanics/progression.jpg', condition: { type: 'match_n', count: 3, symbolId: 'star' }, payout: 100, weight: 10, probability: 0.1 },
                    { id: 'j_2', name: 'Reach Level 2', image: '/assets/mechanics/progression.jpg', condition: { type: 'match_n', count: 2, symbolId: 'star' }, payout: 5, weight: 500, probability: 5.0 }
                ]
            };
        case 'match_3':
            return {
                mechanic: { type: 'match_3' },
                layout: { rows: 3, columns: 3, shape: 'square' },
                brush: { size: 20 },
                prizes: [
                    { id: 'm3_1', name: 'Grand Prize', image: '/assets/symbols/high_1.png', condition: { type: 'match_n', count: 3, symbolId: 'gem_1' }, payout: 100, weight: 10, probability: 0.1 },
                    { id: 'm3_2', name: 'Big Win', image: '/assets/symbols/mid_1.png', condition: { type: 'match_n', count: 3, symbolId: 'gem_2' }, payout: 20, weight: 100, probability: 1.0 },
                    { id: 'm3_3', name: 'Prize', image: '/assets/symbols/low_1.png', condition: { type: 'match_n', count: 3, symbolId: 'gem_3' }, payout: 5, weight: 1000, probability: 10.0 }
                ]
            };
        default: // match_3 fallback
            return {
                mechanic: { type: 'match_3' },
                layout: { rows: 3, columns: 3, shape: 'square' },
                brush: { size: 20 },
                prizes: [
                    { id: 'm3_1', name: 'Grand Prize', image: '/assets/symbols/high_1.png', condition: { type: 'match_n', count: 3, symbolId: 'gem_1' }, payout: 100, weight: 10, probability: 0.1 },
                    { id: 'm3_2', name: 'Big Win', image: '/assets/symbols/mid_1.png', condition: { type: 'match_n', count: 3, symbolId: 'gem_2' }, payout: 20, weight: 100, probability: 1.0 },
                    { id: 'm3_3', name: 'Prize', image: '/assets/symbols/low_1.png', condition: { type: 'match_n', count: 3, symbolId: 'gem_3' }, payout: 5, weight: 1000, probability: 10.0 }
                ]
            };
    }
};

/**
 * Calculates the theoretical Return to Player (RTP).
 * Supports both Finite Deck (POOL) and Unlimited (Probability) modes.
 */
export const calculateRTP = (prizes: ScratchPrizeTier[], deckSize?: number): number => {
    if (!prizes || prizes.length === 0) return 0;

    // If deckSize provided, use it (Finite Mode logic)
    if (deckSize && deckSize > 0) {
        const totalPayout = prizes.reduce((sum, p) => sum + (p.payout * p.weight), 0);
        return totalPayout / deckSize;
    }

    // Default / Unlimited logic (Probability-based)
    // Assumes p.weight is actually probability if deckSize is missing? 
    // Or we normalized it. 
    // If 'probability' field exists, usage depends on call site.
    // Ideally this function should take the full config object, but to keep signature simple:

    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
    if (totalWeight === 0) return 0;

    const totalReturn = prizes.reduce((sum, p) => sum + (p.payout * p.weight), 0);
    return (totalReturn / totalWeight);
};
