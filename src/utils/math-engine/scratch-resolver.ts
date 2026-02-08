import { ScratchMathEngine } from './ScratchMathEngine';
import { GameMathConfig, ResolvedOutcome } from './types';

/**
 * Resolves a scratch card round deterministically.
 */
export const resolveRound = (config: GameMathConfig, seedProp: number | string): ResolvedOutcome => {
    // Instanciate the Robust Math Engine
    const engine = new ScratchMathEngine(seedProp);

    // Delegate to the engine
    // Note: The new engine handles everything including Grid Generation for Match/Grid games.
    // If we have legacy categories that aren't grid based, we might need a switch here,
    // but the engine is designed to handle the core Scratch Grid logic.
    return engine.resolveRound(config);
};

// --- Category Specific Resolvers ---

// --- Legacy Resolvers Removed (Logic moved to ScratchMathEngine) ---
