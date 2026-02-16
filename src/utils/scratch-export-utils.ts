import { GameConfig, ScratchPrizeTier } from '../types';
import { GameMathConfig } from './math-engine/types';
import { ASSET_MAP } from './scratchAssets';

/**
 * Extracts and traverses the configuration to find all asset URLs.
 */
export const generateAssetManifest = (config: GameConfig): string[] => {
    const assets = new Set<string>();

    const traverse = (obj: any) => {
        if (!obj) return;
        if (typeof obj === 'string') {
            if (obj.match(/^https?:\/\//) || obj.match(/^\/fs\//) || obj.match(/^data:image/)) {
                assets.add(obj);
            }
            return;
        }
        if (typeof obj === 'object') {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    traverse(obj[key]);
                }
            }
        }
    };

    traverse(config);
    return Array.from(assets);
};

/**
 * Normalizes probabilities in a prize table so they sum to 1.
 */
const normalizePrizes = (config: GameMathConfig): GameMathConfig => {
    if (!config.prizeTable) return config;

    // Treat 'probability' field as weight if it isn't already normalized
    // Or if we are in 'weight' mode. 
    // The GameMathConfig input here typically comes from the UI which uses 'weight'.

    const totalWeight = config.prizeTable.reduce((s: number, p: any) => s + (p.probability || 0), 0);

    if (totalWeight > 0) {
        config.prizeTable.forEach((p: any) => {
            // Overwrite probability with normalized value
            p.probability = (p.probability || 0) / totalWeight;
        });
    }
    return config;
};

/**
 * Converts the UI-driven ScratchConfig into the Engine-driven GameMathConfig.
 */
export const getScratchMathConfig = (config: GameConfig): GameMathConfig => {
    if (!config.scratch) {
        throw new Error("Scratch config missing");
    }

    let category: any = 'MATCH';
    const type = config.scratch.mechanic?.type;
    if (type === 'find_symbol') category = 'GRID';
    if (type === 'lucky_number') category = 'BONUS';

    const isPoolMode = (config.scratch.math?.mathMode || 'POOL') === 'POOL';
    const deckSize = config.scratch.math?.totalTickets || 1000000;

    const mathConfig: GameMathConfig = {
        category,
        rtp: config.scratch.math?.rtp || 0.96,
        volatility: 'medium',
        mathMode: isPoolMode ? 'POOL' : 'UNLIMITED',
        totalTickets: deckSize,
        winLogic: config.scratch.math?.winLogic || 'SINGLE_WIN',
        layout: {
            rows: config.scratch.layout?.rows || 3,
            columns: config.scratch.layout?.columns || 3
        },
        prizeTable: (config.scratch.prizes && config.scratch.prizes.length > 0)
            ? config.scratch.prizes.map((p: ScratchPrizeTier) => {
                let prob = p.probability || 0;

                if (isPoolMode) {
                    // In Pool Mode, we use Weight / DeckSize
                    // UI provides 'weight' (count)
                    // If p.weight is present, use it.
                    if (p.weight !== undefined) {
                        prob = p.weight / deckSize;
                    }
                } else {
                    // In Unlimited Mode, we treat 'weight' as relative weight to be normalized
                    // unless probability is explicit
                    prob = p.weight !== undefined ? p.weight : (p.probability || 0);
                }

                return {
                    id: p.id,
                    value: p.payout * (config.scratch?.math?.ticketPrice || 1), // Real value (Price * Multiplier)
                    probability: prob,
                    weight: p.weight, // Pass weight for robust POOL mode handling
                    isWin: p.payout > 0
                };
            })
            : [],
        symbols: {
            // [UPDATED] Win symbols = All custom assets EXCEPT those marked as decoys
            win: (config.scratch?.symbols?.customAssets?.map(a => a.url) || ['WIN'])
                .filter(url => !(config.scratch?.symbols?.loseVariants || []).includes(url)),

            // [UPDATED] Lose symbols = Explicit decoys -> Presets -> Fallback
            lose: (config.scratch?.symbols?.loseVariants && config.scratch.symbols.loseVariants.length > 0)
                ? config.scratch.symbols.loseVariants
                : (config.scratch?.symbols?.style && config.scratch.symbols.style in ASSET_MAP
                    ? ASSET_MAP[config.scratch.symbols.style as keyof typeof ASSET_MAP].lose
                    : ['/assets/symbols/star_stone_fixed.png'])
        },
        // Category Mappings
        grid: category === 'GRID' ? {
            failSymbolProbability: 0.1, // Default, assumed from difficulty
            maxPicks: config.scratch.rulesGrid?.maxPicks
        } : undefined,

        match: category === 'MATCH' ? {
            matchCount: config.scratch.mechanic?.type === 'match_3' ? 3 : 2,
            allowWildcards: false // Future Feature
        } : undefined,

        // --- FAT PIPE: Pass full config to RGS to prevent Data Loss ---
        mechanic: config.scratch.mechanic,
        rulesGrid: config.scratch.rulesGrid,
        features: config.scratch.features
    };

    // Only normalize for Unlimited mode where weights are relative (and we expect Sum=1 for Win+Lose? No, usually Win-only weights normalized to RTP)
    // Actually, 'normalizePrizes' sums to 1. This implies 100% Hit Rate if we don't include losing tiers.
    // Standard scratch logic (Unlimited) usually defines Hit Rate separate from Prize Distribution.
    // But here normalization forces Sum=1. This is likely why "Freaking Wrong" also happened in Unlimited if weights were used without explicit Lose tiers.
    // However, fixing Finite Mode is the priority.

    if (isPoolMode) {
        return mathConfig;
    } else {
        return normalizePrizes(mathConfig);
    }
};

// --- RGS SCHEMA DEFINITIONS (v1.0.0) ---

interface RGSMechanic {
    type: string;
    match_count?: number;
    // Extensible for other types
    grid_size?: { rows: number; columns: number };
    fail_probability?: number;
}

interface RGSPrizeTier {
    tier: string;
    multiplier: number;
    weight: number;
    probability: number; // Included for transparency
}

interface RGSStats {
    computed_rtp: number;
    hit_rate: number;
    variance: number;
    max_win: number;
}

interface RGSIntegrity {
    content_hash?: string;
    secret_salt?: string;
}

export interface RGSMathSchema {
    schema_version: number;
    model_id: string;
    model_version: string;

    mechanic: RGSMechanic;

    math_mode: 'UNLIMITED' | 'POOL';
    win_logic: 'SINGLE_WIN' | 'MULTI_WIN';

    prize_table: RGSPrizeTier[];
    stats: RGSStats;

    integrity: RGSIntegrity;
}

/**
 * Calculates theoretical stats based on the prize table.
 */
const calculateStats = (prizes: RGSPrizeTier[]): RGSStats => {
    let totalRtp = 0;
    let hitRate = 0;
    let maxWin = 0;

    // 1. Calculate RTP and Hit Rate
    prizes.forEach(p => {
        totalRtp += p.multiplier * p.probability;
        if (p.multiplier > 0) {
            hitRate += p.probability;
        }
        if (p.multiplier > maxWin) maxWin = p.multiplier;
    });

    // 2. Calculate Variance
    // Var = Sum( p * (x - mean)^2 )
    let variance = 0;
    prizes.forEach(p => {
        // x = multiplier
        // mean = rtp
        const diff = p.multiplier - totalRtp;
        variance += p.probability * (diff * diff);
    });

    // Accounting for losing spins (multiplier 0)
    // The losing probability is (1 - hitRate)
    const loseProb = 1 - hitRate;
    if (loseProb > 0) {
        const diff = 0 - totalRtp;
        variance += loseProb * (diff * diff);
    }

    return {
        computed_rtp: Number(totalRtp.toFixed(5)),
        hit_rate: Number(hitRate.toFixed(6)),
        variance: Number(variance.toFixed(2)),
        max_win: maxWin
    };
};

/**
 * transforms internal GameConfig to the RGS Math Schema.
 */
export const transformToRGS = (config: GameConfig): RGSMathSchema => {
    const s = config.scratch;
    if (!s) throw new Error("Scratch config missing");

    // 1. Mechanic Definition
    const mechanicType = s.mechanic?.type || 'match_3';
    const mechanic: RGSMechanic = {
        type: mechanicType
    };

    if (mechanicType === 'match_3') {
        mechanic.match_count = 3;
    } else if (mechanicType === 'find_symbol') {
        mechanic.grid_size = {
            rows: s.layout?.rows || 3,
            columns: s.layout?.columns || 3
        };
    } else if ((mechanicType as string) === 'mines') {
        const rulesGridWithFail = s.rulesGrid as { failSymbolProbability?: number } | undefined;
        mechanic.fail_probability = rulesGridWithFail?.failSymbolProbability ?? 0.1;
    }

    // 2. Math Mode
    // Default to 'POOL' if undefined, matching PaytableEditor.tsx and RtpModeler.tsx defaults
    const mathMode = s.math?.mathMode || 'POOL';
    const isPool = mathMode === 'POOL';
    const deckSize = s.math?.totalTickets || 1000000;
    const totalWeight = s.prizes?.reduce((acc, p) => acc + (p.weight || 0), 0) || 0;

    // 3. Normalize Prize Table
    // We map internal tiers to RGS tiers
    const prizeTable: RGSPrizeTier[] = (s.prizes || []).map(p => {
        let prob = 0;
        let weight = p.weight || 0;

        if (isPool) {
            // In POOL, weight is the literal count tickets
            prob = weight / deckSize;
        } else {
            // In UNLIMITED, weight is relative. 
            // If explicit probability is given, use it.
            if (p.probability) {
                prob = p.probability;
                weight = Math.round(prob * 1000000); // inferred weight for display
            } else if (totalWeight > 0) {
                prob = weight / totalWeight;
            }
        }

        return {
            tier: p.id,
            multiplier: p.payout, // Assumed multiplier
            weight: weight,
            probability: prob
        };
    });

    // Add implicit "LOSE" tier if not explicit
    // (Usually RGS stat calculation needs to know the Lose weight/prob if not 100%)
    // But for the export table, we usually only list active prize tiers, 
    // and stats handle the "rest".
    // The user's example explicitly lists "LOSE". We can add it if we want, 
    // but typically non-winning tiers are implicit in 'weight' vs 'total stats'.
    // However, for POOL mode, we often want to explicit "LOSE" cards count.

    if (isPool) {
        // Calculate remaining tickets
        const winningTickets = prizeTable.reduce((sum, p) => sum + p.weight, 0);
        const losingTickets = deckSize - winningTickets;
        if (losingTickets > 0) {
            prizeTable.unshift({
                tier: 'LOSE',
                multiplier: 0,
                weight: losingTickets,
                probability: losingTickets / deckSize
            });
        }
    } else {
        // For unlimited, we can add a LOSE tier based on remaining probability
        const winProb = prizeTable.reduce((sum, p) => sum + p.probability, 0);
        if (winProb < 1) {
            prizeTable.unshift({
                tier: 'LOSE',
                multiplier: 0,
                weight: 0, // Logical weight 0 or inferred
                probability: 1 - winProb
            });
        }
    }

    // 4. Stats
    const stats = calculateStats(prizeTable);

    return {
        schema_version: 1,
        model_id: config.gameId || 'scratch_game',
        model_version: '1.0.0', // Could typically increment

        mechanic,

        math_mode: isPool ? 'POOL' : 'UNLIMITED',
        win_logic: s.math?.winLogic || 'SINGLE_WIN',

        prize_table: prizeTable,
        stats,

        integrity: {
            // Content hash would be generated by the backend during certification
            content_hash: 'sha256:pending_certification'
        }
    };
};

export interface RGSExportPayload {
    meta: {
        exportedAt: string;
        version: string;
        type: string;
        generator: string;
    };
    visuals: GameConfig;
    math: RGSMathSchema; // [UPDATED] Uses new RGS Schema
    assets: string[];
}

/**
 * Generates the complete export payload for RGS.
 */
export const generateCompleteExport = (config: GameConfig): RGSExportPayload => {
    // Legacy internal config (optional, can omit if RGS schema is enough)
    // const math = getScratchMathConfig(config); 

    const rgsMath = transformToRGS(config);
    const assets = generateAssetManifest(config);

    return {
        meta: {
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
            type: 'scratch_card',
            generator: 'GameCrafter Studio'
        },
        visuals: sanitizeConfigForScratch(config),
        math: rgsMath,
        assets: assets
    };
};

/**
 * Creates a sanitized version of the config for Scratchcard export.
 * Maps scratch specific assets to the theme structure expected by some viewers,
 * and removes irrelevant slot-specific theme data.
 */
/**
 * Generates a mock URL for a base64 asset.
 * In a real scenario, this would be the URL where the asset was uploaded.
 */
const convertBase64ToUrl = (base64: string, type: 'image' | 'audio' = 'image'): string => {
    // Simple hash to make the filename look consistent
    let hash = 0;
    for (let i = 0; i < base64.length; i++) {
        const char = base64.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const ext = type === 'image' ? 'png' : 'mp3';
    return `https://cdn.gamecrafter.com/assets/scratch/${Math.abs(hash).toString(16)}.${ext}`;
};

/**
 * Recursively cleans the object:
 * 1. Converts Base64 to URLs
 * 2. Removes null/undefined values
 */
const cleanObject = (obj: any): any => {
    if (!obj) return obj;

    if (typeof obj === 'string') {
        if (obj.startsWith('data:image')) {
            return convertBase64ToUrl(obj, 'image');
        }
        if (obj.startsWith('data:audio')) {
            return convertBase64ToUrl(obj, 'audio');
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => cleanObject(item));
    }

    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const cleaned = cleanObject(obj[key]);
                if (cleaned !== undefined && cleaned !== null) {
                    newObj[key] = cleaned;
                }
            }
        }
        return newObj;
    }

    return obj;
};

/**
 * Creates a sanitized version of the config for Scratchcard export.
 * STRICTLY removes all Slot Layout data and ensures assets are URLs.
 */
const sanitizeConfigForScratch = (config: GameConfig): any => {
    // 1. Extract ONLY what we need for Scratch
    // Unlike before, we start empty and pick what we want, rather than trying to delete what we don't.

    const baseConfig = {
        gameId: config.gameId || 'scratch_game',
        displayName: config.displayName || 'Scratch Card',
        gameTypeInfo: {
            id: 'scratch',
            title: 'Scratch Card',
            type: 'scratch'
        },
        // Core Metadata
        marketing: cleanObject(config.marketing),

        // Scratch Logic - STRICTLY Visuals Only
        // We explicitly omit: match, mechanic, rulesGrid, features, etc.
        // We keep: layers, background, brush, layout
        scratch: (() => {
            const s = config.scratch || {};
            // Destructure to separate visuals from math
            const {
                math, mechanic, rulesGrid, features, prizes, // EXCLUDED
                ...visuals // INCLUDED
            } = s as any;

            return cleanObject(visuals);
        })(),

        // Theme (Simplified for Scratch)
        theme: {
            description: config.theme?.description || "Scratch Card Game",
            mood: config.theme?.mood,
            logo: config.theme?.logo, // [FIX] Preserve Logo
            // We map the computed background/symbols here for viewers that expect 'theme'
            generated: {}
        } as any
    };

    // 2. Map Visuals to common 'Theme' structure (for compatibility)
    if (baseConfig.scratch) {
        // Map Background
        const layers = baseConfig.scratch.layers;
        if (layers?.scene?.value && !layers.scene.value.startsWith('#')) {
            baseConfig.theme.generated.background = layers.scene.value;
        } else if (baseConfig.scratch.background?.image) {
            baseConfig.theme.generated.background = baseConfig.scratch.background.image;
        }

        // Map Symbols (Flattening the prize structure to valid URLs)
        const symbolMap: Record<string, string> = {};
        if (baseConfig.scratch.prizes) {
            baseConfig.scratch.prizes.forEach((p: any) => {
                if (p.id && p.image) {
                    symbolMap[p.id] = p.image;
                }
            });
        }
        baseConfig.theme.generated.symbols = symbolMap;
    }

    // 3. Construct Final Object (No Reels, No Paylines, No Slot Rules)
    return baseConfig;
};

/**
 * Generates the standalone HTML player string.
 */
export const generateScratchHTML = (cleanConfig: any): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${cleanConfig.displayName || 'Scratch Card'} | Game Crafter</title>
    <script src="https://pixijs.download/v8.1.0/pixi.min.js"></script>
    <style>
        body { margin: 0; background: #0f172a; overflow: hidden; touch-action: none; display: flex; flex-direction: column; height: 100vh; font-family: system-ui, sans-serif; }
        #loading { position: absolute; color: white; font-weight: bold; font-size: 24px; text-align: center; pointer-events: none; z-index: 10; }
        .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        #game-container { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; position: relative; width: 100%; height: 100%; }
        canvas { display: block; width: 100%; height: 100%; }
        /* Casino Shell Footer */
        #casino-footer { position: fixed; bottom: 0; left: 0; right: 0; height: 64px; background: #000; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-top: 1px solid #333; z-index: 50; box-shadow: 0 -4px 20px rgba(0,0,0,0.4); }
        .footer-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; overflow: hidden; }
        .footer-center { display: flex; align-items: center; gap: 10px; flex: 1.2; justify-content: center; padding: 0 4px; }
        .footer-right { display: flex; align-items: center; justify-content: flex-end; gap: 12px; flex: 1; min-width: 0; overflow: hidden; }
        
        .footer-label { font-size: 10px; font-weight: bold; color: #FFD700; text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.2; white-space: nowrap; }
        .footer-value { font-size: 18px; font-weight: bold; font-family: monospace; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .footer-group { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        
        .btn-icon { width: 36px; height: 36px; borderRadius: 50%; border: 1px solid #334155; background: transparent; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-icon:hover { border-color: #f8fafc; color: #f8fafc; }
        
        .bet-controls { display: flex; align-items: center; gap: 6px; }
        .btn-bet { width: 24px; height: 24px; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px; }
        .btn-bet:hover { background: #334155; }

        .btn-buy { height: 44px; padding: 0 32px; background: #22c55e; color: #fff; border: none; border-radius: 999px; font-weight: 900; font-size: 18px; text-transform: uppercase; cursor: pointer; box-shadow: 0 3px 0 #15803d; transition: all 0.1s; display: flex; align-items: center; justify-content: center; }
        .btn-buy:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 1px 0 #15803d; }
        .btn-buy:disabled { background: #374151; color: #9ca3af; cursor: not-allowed; box-shadow: none; opacity: 0.7; }
        
        .btn-autoplay { width: 44px; height: 44px; background: #1f2937; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; border: none; cursor: pointer; font-size: 8px; font-weight: 900; gap: 1px; }
        .btn-autoplay svg { width: 14px; height: 14px; }
        .btn-autoplay:hover:not(:disabled) { background: #374151; }
        .btn-stop { background: #ef4444; color: #fff; width: auto; padding: 0 16px; border-radius: 999px; font-size: 12px; }

        /* Autoplay Toggles */
        .autoplay-row { display: flex; items-center: center; justify-content: space-between; padding: 12px; background: #161616; border-radius: 8px; border: 1px solid #222; margin-bottom: 8px; cursor: pointer; }
        .autoplay-row:hover { background: #1a1a1a; border-color: #333; }
        .autoplay-row label { display: flex; items-center: center; gap: 8px; font-size: 13px; font-weight: bold; color: #ccc; cursor: pointer; width: 100%; }
        .autoplay-row input[type="checkbox"] { width: 18px; height: 18px; accent-color: #22c55e; }
        .btn-round { padding: 8px 0; background: #1e293b; border: 1px solid #334155; color: #fff; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 13px; transition: all 0.2s; }
        .btn-round.active { background: #22c55e; border-color: #22c55e; color: #fff; }
        .btn-round:hover:not(.active) { background: #334155; }

        /* Modals */
        .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); z-index: 200; align-items: center; justify-content: center; }
        .modal-overlay.open { display: flex; }
        .modal-card { background: #111; color: #fff; border-radius: 12px; width: 480px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column; border: 1px solid #333; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8); }
        .modal-header { padding: 16px; background: #000; border-bottom: 1px solid #222; display: flex; align-items: center; justify-content: space-between; }
        .modal-header h3 { margin: 0; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
        .modal-close { background: none; border: none; color: #666; cursor: pointer; padding: 4px; }
        .modal-close:hover { color: #fff; }
        .modal-body { flex: 1; overflow-y: auto; padding: 24px; }
        
        /* Stats Table (Hacksaw Style) */
        .rules-section { margin-bottom: 24px; }
        .rules-title { color: #FFD700; font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 12px; border-left: 3px solid #FFD700; padding-left: 8px; }
        .rules-text { font-size: 12px; color: #ccc; line-height: 1.5; white-space: pre-wrap; margin: 0; }
        .paytable-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; border: 1px solid #222; }
        .paytable-table th { background: #1a1a1a; padding: 8px; text-align: left; color: #888; border-bottom: 1px solid #333; }
        .paytable-table td { padding: 8px; border-bottom: 1px solid #222; }
        .paytable-table tr:nth-child(even) { background: #161616; }

        /* Mobile Optimization */
        @media (max-width: 640px) {
            #casino-footer { height: 72px; padding: 0 8px; }
            .footer-left { gap: 6px; flex: 1; }
            .footer-center { gap: 6px; flex: 1.4; }
            .footer-right { flex: 1; }
            
            .footer-label { font-size: 7px; letter-spacing: 0.02em; }
            .footer-value { font-size: 13px; }
            
            .btn-buy { height: 38px; padding: 0 12px; font-size: 13px; }
            .btn-autoplay { width: 34px; height: 34px; font-size: 6px; }
            .btn-icon { width: 30px; height: 30px; }
            
            .bet-controls { gap: 3px; }
            .btn-bet { width: 18px; height: 18px; font-size: 11px; }
            
            .modal-card { width: 100%; height: 100%; max-width: none; max-height: none; border-radius: 0; border: none; }
            .footer-left .btn-icon:first-child { display: none; } /* Hide menu on mobile */
            .btn-autoplay .stop-text { display: none; }
        }
        
        @media (max-width: 420px) {
            .footer-label { display: none; } 
            .footer-group { justify-content: center; }
            .footer-left { gap: 4px; }
            .footer-center { gap: 4px; }
        }
        
        @media (max-width: 380px) {
            .footer-label { display: none; } /* Hide labels on very small screens to save space */
            .footer-group { justify-content: center; }
            .btn-buy { padding: 0 12px; font-size: 14px; }
        }
    </style>
</head>
<body>
    <div id="loading">
        <div class="spinner"></div>
        <div>Loading Assets...</div>
        <div id="loading-status" style="font-size:14px; margin-top:10px; opacity:0.7"></div>
    </div>
    <div id="game-container"></div>

    <footer id="casino-footer">
        <div class="footer-left">
            <button class="btn-icon" title="Menu">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <button class="btn-icon" onclick="openInfoModal()" title="Info">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </button>
            <div class="footer-group">
                <span class="footer-label">Balance</span>
                <span class="footer-value">€<span id="footer-balance-value">0.00</span></span>
            </div>
        </div>
        
        <div class="footer-center">
            <button class="btn-autoplay" id="btn-autoplay">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" id="autoplay-icon-spin"><path d="M20 11a8.1 8.1 0 0 0-15.5-2m-.5-5v5h5"></path><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 5v-5h-5"></path></svg>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="currentColor" id="autoplay-icon-stop" style="display:none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                <span class="stop-text">AUTO</span>
            </button>
            <button class="btn-buy" id="btn-buy">BUY</button>
            <div class="footer-group">
                <span class="footer-label">Bet</span>
                <div class="bet-controls">
                    <span class="footer-value">€<span id="footer-bet-value">0.00</span></span>
                    <button class="btn-bet" onclick="changeBet(-0.1)">-</button>
                    <button class="btn-bet" onclick="changeBet(0.1)">+</button>
                </div>
            </div>
        </div>
        
        <div class="footer-right">
            <div id="footer-win" class="footer-group" style="display: none; align-items: flex-end;">
                <span class="footer-label" style="color: #4ade80;">Win</span>
                <span class="footer-value" style="color: #4ade80; font-size: 20px;">€<span id="footer-win-value">0.00</span></span>
            </div>
        </div>
    </footer>

    <!-- Info Modal (Hacksaw style) -->
    <div id="info-overlay" class="modal-overlay">
        <div class="modal-card">
            <div class="modal-header">
                <h3>Game Info - ${cleanConfig.displayName || 'Scratch Game'}</h3>
                <button class="modal-close" onclick="closeInfoModal()">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="rules-section">
                    <h4 class="rules-title">How To Play</h4>
                    <p class="rules-text" id="rules-how-to"></p>
                </div>
                <div class="rules-section">
                    <h4 class="rules-title">Value Symbols</h4>
                    <table class="paytable-table" id="rules-paytable">
                        <thead><tr><th>Prize</th><th style="text-align:right">Multiplier</th></tr></thead>
                        <tbody></tbody>
                    </table>
                </div>
                <div class="rules-section">
                    <h4 class="rules-title">Game Rules</h4>
                    <p class="rules-text" id="rules-general"></p>
                </div>
            </div>
        </div>
    </div>

    <!-- Autoplay Modal -->
    <div id="autoplay-overlay" class="modal-overlay">
        <div class="modal-card" style="width: 360px;">
            <div class="modal-header">
                <h3 style="display: flex; align-items: center; gap: 8px;">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="#22c55e" stroke-width="3" fill="none"><path d="M20 11a8.1 8.1 0 0 0-15.5-2m-.5-5v5h5"></path><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 5v-5h-5"></path></svg>
                    Autoplay Options
                </h3>
                <button class="modal-close" onclick="closeAutoplayModal()">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="modal-body">
                <p class="footer-label" style="margin-bottom: 12px; color: #666;">Number of Rounds</p>
                <div id="autoplay-round-selector" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 24px;">
                    <button class="btn-round active" onclick="setAutoRounds(10)">10</button>
                    <button class="btn-round" onclick="setAutoRounds(25)">25</button>
                    <button class="btn-round" onclick="setAutoRounds(50)">50</button>
                    <button class="btn-round" onclick="setAutoRounds(75)">75</button>
                    <button class="btn-round" onclick="setAutoRounds(100)">100</button>
                </div>

                <div class="autoplay-row">
                    <label>
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="#eab308" stroke-width="3" fill="none" style="margin-right: 4px;"><path d="m13 2-2 10h9L7 22l2-10H1L13 2z"/></svg>
                        Turbo Spin
                    </label>
                    <input type="checkbox" id="autoplay-turbo">
                </div>

                <div class="autoplay-row">
                    <label>Stop on Bonus</label>
                    <input type="checkbox" id="autoplay-stop-bonus" checked>
                </div>

                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button class="btn-icon" style="flex: 1; height: 44px; border-radius: 12px;" onclick="closeAutoplayModal()">Cancel</button>
                    <button id="btn-start-autoplay" class="btn-buy" style="flex: 1; border-radius: 12px;" onclick="runAutoplay()">Start</button>
                </div>
            </div>
        </div>
    </div>

    <!-- [CORS-FIX] Config Injection via Script Tag to handle large Base64 strings safely -->
    <script id="game-config" type="application/json">
    ${JSON.stringify(cleanConfig)}
    </script>

    <script>
        
        // --- Setup Log ---
        function log(msg, type='info') {
            console.log(\`[\${type.toUpperCase()}] \`, msg);
        }
        window.onerror = (msg, url, line) => {
            log(\`ERROR: \${msg} (\${line})\`, 'error');
        };

        // --- Standalone Scratch Mini-Engine ---
        let app, container, scratchMask, brushTexture;
        let isDrawing = false;
        const assetUrls = new Set();
        const textureCache = new Map();
        const audioCache = new Map();
        const CARD_WIDTH = 320;
        const CARD_HEIGHT = 460;
        let brushTip;
        let config = null;
        let particles = [];
        let particleContainer;
        let surfaceUrl = '';
        let hasCelebrated = false;
        let scratchThreshold = 0.95;
        let currentOutcome = { win: 0 };
        let fitScale = 1; // [FIX] Global fitScale for interaction handlers

        // --- Casino Shell State (Footer + Autoplay) ---
        let ticketPrice = 1;
        let shellState = { balance: 1000, bet: 1, win: 0, gameState: 'idle', isAutoPlaying: false, autoplayId: 0, autoplayRounds: 10 };
        let OPERATOR_ENDPOINT = '';

        // --- UI Modal & Footer Logic ---
        function openInfoModal() { 
            populateInfoModal();
            const overlay = document.getElementById('info-overlay');
            if (overlay) overlay.classList.add('open'); 
        }
        function closeInfoModal() { 
            const overlay = document.getElementById('info-overlay');
            if (overlay) overlay.classList.remove('open'); 
        }
        
        function openAutoplayModal() { 
            const overlay = document.getElementById('autoplay-overlay');
            if (overlay) overlay.classList.add('open'); 
        }
        function closeAutoplayModal() { 
            const overlay = document.getElementById('autoplay-overlay');
            if (overlay) overlay.classList.remove('open'); 
        }

        function setAutoRounds(r) {
            shellState.autoplayRounds = r;
            const btns = document.querySelectorAll('.btn-round');
            btns.forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.textContent) === r);
            });
            log("Autoplay Rounds set to: " + r);
        }
        


        function changeBet(delta) {
            if (shellState.gameState !== 'idle') return;
            const newBet = Math.max(0.1, shellState.bet + delta);
            shellState.bet = Number(newBet.toFixed(2));
            updateFooterDisplay();
        }

        function populateInfoModal() {
            if (!config) return;
            const rules = config.gameRules || {};
            const howTo = document.getElementById('rules-how-to');
            if (howTo) howTo.textContent = rules.howToPlayText || "Reveal three identical symbols to win a prize.";
            
            const general = document.getElementById('rules-general');
            if (general) general.textContent = rules.rulesText || "Malfunction voids all pays and plays.";
            
            // Populate Paytable
            const tbody = document.querySelector('#rules-paytable tbody');
            if (tbody) {
                tbody.innerHTML = '';
                const rows = rules.paytableRows || [];
                rows.forEach(function(row) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = '<td>' + row.symbol + '</td><td style="text-align:right">' + row.value + '</td>';
                    tbody.appendChild(tr);
                });
            }
        }

        function initSound() {
            log("Initializing Sound System");
            const unlock = () => {
                // Play a tiny silent dummy sound to unlock the AudioContext/HTML5 Audio for the session
                const dummy = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
                dummy.play().catch(function() {});
                log("Audio Unlocked");
                window.removeEventListener('pointerdown', unlock);
                window.removeEventListener('touchstart', unlock);
            };
            window.addEventListener('pointerdown', unlock);
            window.addEventListener('touchstart', unlock);
        }

        function initBrushTip() {
            log("Initializing Brush Tip Resources");
            const type = config.scratch?.brush?.tipType || 'coin';
            
            // Generate Emoji Textures for all types including Coin
            if (type !== 'custom') {
                const canvas = document.createElement('canvas');
                canvas.width = 128; canvas.height = 128;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.font = '115px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    let emoji = '🪙'; // Default Coin
                    if (type === 'finger') emoji = '👆';
                    else if (type === 'wand') emoji = '🪄';
                    else if (type === 'eraser') emoji = '🧼';
                    else if (type === 'coin') emoji = '🪙';
                    
                    ctx.fillText(emoji, 64, 70);
                    const tex = PIXI.Texture.from(canvas);
                    textureCache.set('brush_emoji_' + type, tex);
                    log("Generated Brush Texture for: " + type);
                }
            }
        }

        function playSound(nameOrUrl, loop) {
            let sound = audioCache.get(nameOrUrl);
            if (!sound && config.scratch && config.scratch.audio) {
                const path = config.scratch.audio[nameOrUrl];
                if (path) sound = audioCache.get(path);
            }
            if (sound) {
                if (loop) sound.loop = true;
                
                // If it's a loop and already playing, don't restart it (prevents stutter)
                if (loop && !sound.paused) return;

                sound.currentTime = 0;
                const p = sound.play();
                if (p !== undefined) {
                    p.catch(function(e) { log("Play failed: " + e.message, "warn"); });
                }
            }
        }

        function stopSound(nameOrUrl) {
            let sound = audioCache.get(nameOrUrl);
            if (!sound && config.scratch && config.scratch.audio) {
                const path = config.scratch.audio[nameOrUrl];
                if (path) sound = audioCache.get(path);
            }
            if (sound) {
                sound.pause();
                sound.currentTime = 0;
            }
        }
                    
        function updateFooterDisplay() {
            const balanceEl = document.getElementById('footer-balance-value');
            const betEl = document.getElementById('footer-bet-value');
            const winEl = document.getElementById('footer-win-value');
            const winDiv = document.getElementById('footer-win');
            const buyBtn = document.getElementById('btn-buy');
            const autoBtn = document.getElementById('btn-autoplay');
            
            if (balanceEl) balanceEl.textContent = shellState.balance.toFixed(2);
            if (betEl) betEl.textContent = shellState.bet.toFixed(2);
            if (winEl) winEl.textContent = shellState.win.toFixed(2);
            
            if (winDiv) {
                const hasWin = shellState.win > 0;
                winDiv.style.display = hasWin ? 'flex' : 'none';
                if (hasWin && !hasCelebrated) {
                    winDiv.classList.add('animate-pulse');
                    spawnWinConfetti(); // Trigger celebration
                    playSound('win'); // [FIX] Add win sound parity with preview
                    hasCelebrated = true; 
                    shellState.balance += shellState.win; // Add win to balance in demo
                    if (balanceEl) balanceEl.textContent = shellState.balance.toFixed(2);
                } else if (!hasWin) {
                    winDiv.classList.remove('animate-pulse');
                }
            }
            
            if (buyBtn) {
                let btnTxt = 'BUY';
                if (shellState.gameState === 'playing') btnTxt = '...';
                else if (shellState.gameState === 'revealed') btnTxt = 'PLAY';
                buyBtn.textContent = btnTxt;
                buyBtn.disabled = shellState.gameState === 'playing' || shellState.balance < shellState.bet || shellState.isAutoPlaying;
            }
            
            if (autoBtn) {
                const spinIcon = document.getElementById('autoplay-icon-spin');
                const stopIcon = document.getElementById('autoplay-icon-stop');
                const stopText = autoBtn.querySelector('.stop-text');
                
                if (shellState.isAutoPlaying) {
                    if (spinIcon) spinIcon.style.display = 'none';
                    if (stopIcon) stopIcon.style.display = 'block';
                    if (stopText) stopText.textContent = 'STOP';
                    autoBtn.classList.add('btn-stop');
                } else {
                    if (spinIcon) spinIcon.style.display = 'block';
                    if (stopIcon) stopIcon.style.display = 'none';
                    if (stopText) stopText.textContent = 'AUTO';
                    autoBtn.classList.remove('btn-stop');
                }
                autoBtn.disabled = shellState.gameState === 'playing';
            }
        }

        function buyTicket() {
            if (shellState.gameState === 'playing' || shellState.balance < shellState.bet || shellState.isAutoPlaying) return;
            shellState.balance -= shellState.bet;
            shellState.win = 0;
            shellState.gameState = 'playing';
            hasCelebrated = false;
            
            // Generate Random Outcome for Demo
            const isWin = Math.random() > 0.6;
            currentOutcome.win = isWin ? shellState.bet * (Math.floor(Math.random() * 5) + 2) : 0;
            
            // Play Buy Sound
            playSound('spin'); // Try spin first
            playSound('buy');  // Then buy
            
            setupScene();
            updateFooterDisplay();
        }



        async function runAutoplay() {
            const rounds = shellState.autoplayRounds || 10;
            const turbo = document.getElementById('autoplay-turbo').checked;
            const stopOnBonus = document.getElementById('autoplay-stop-bonus').checked;
            closeAutoplayModal();
            shellState.isAutoPlaying = true;
            const myId = ++shellState.autoplayId;
            updateFooterDisplay();
            for (let i = 0; i < rounds && shellState.isAutoPlaying && myId === shellState.autoplayId; i++) {
                if (shellState.balance < shellState.bet) break;
                buyTicket();
                if (stopOnBonus && shellState.win > 0) break;
                var delayMs = turbo ? 0 : 1500;
                await new Promise(r => setTimeout(r, delayMs));
                shellState.gameState = 'idle';
                updateFooterDisplay();
            }
            shellState.isAutoPlaying = false;
            shellState.gameState = 'idle';
            updateFooterDisplay();
        }

        function stopAutoplay() { shellState.isAutoPlaying = false; updateFooterDisplay(); }

        async function init() {
            try {
                log("Starting Init...");
                
                // Parse Config from DOM
                try {
                    const raw = document.getElementById('game-config').textContent;
                    config = JSON.parse(raw);
                    log("Config Loaded: " + (config ? config.displayName : "unknown"));

                    // Initialize Math & Shell State from Config
                    ticketPrice = (config.scratch && config.scratch.math && config.scratch.math.ticketPrice) ? Number(config.scratch.math.ticketPrice) : 1;
                    shellState.bet = ticketPrice;
                    scratchThreshold = (config.scratch && config.scratch.brush && config.scratch.brush.revealThreshold) ? Number(config.scratch.brush.revealThreshold) : 0.95;
                    // [FIX] Normalize threshold (Handle 65% vs 0.65 parity)
                    if (scratchThreshold > 1) scratchThreshold /= 100;
                    OPERATOR_ENDPOINT = (config.operator_endpoint || '');
                } catch(e) {
                    throw new Error("Failed to parse embedded config: " + e.message);
                }

                // 2. Setup Pixi App
                // A. Background (Scene)
                var bgUrl = (config.scratch && config.scratch.layers && config.scratch.layers.scene && config.scratch.layers.scene.value) || 
                            (config.background && config.background.value);
                
                // Determine initial background color for the Pixi app canvas
                // Determine initial background color for the Pixi app canvas
                var bgColor = '#1e293b'; // Default fallback color
                // [FIX] Pixi backgroundColor ONLY supports hex/rgb, NOT gradients.
                // If gradient detected, use fallback here. The actual gradient is rendered in setupScene via Canvas/Texture.
                if (bgUrl && (bgUrl.startsWith('#') || bgUrl.includes('rgb')) && !bgUrl.includes('gradient')) {
                    bgColor = bgUrl;
                }

                app = new PIXI.Application();
                await app.init({ 
                    resizeTo: window, // [FIX] Fullscreen
                    backgroundColor: bgColor,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true
                });
                const gameContainer = document.getElementById('game-container');
                if (gameContainer) gameContainer.appendChild(app.canvas); else document.body.appendChild(app.canvas);
                log("Pixi App Initialized");

                // --- Global Particle Physics Loop ---
                let checkTicker = 0;
                app.ticker.add(() => {
                    checkTicker++;
                    if (checkTicker % 10 === 0 && shellState.gameState === 'playing') {
                        checkScratchProgress();
                    }
                    if (!particles.length || !particleContainer) return;
                    
                    // Clear container children
                    particleContainer.removeChildren();
                    
                    for (let i = particles.length - 1; i >= 0; i--) {
                        const p = particles[i];
                        p.x += p.vx;
                        p.y += p.vy;
                        p.life -= 0.015;
                        
                        // Gravity
                        p.vy += 0.4;
                        // Friction
                        p.vx *= 0.98;
                        
                        if (p.type === 'confetti') {
                            p.rotation += p.vRotation;
                        }
                        
                        // Bounds check
                        if (p.life <= 0 || p.y > 1000) {
                            particles.splice(i, 1);
                            continue;
                        }
                        
                        // Render Particle
                        const g = new PIXI.Graphics();
                        g.alpha = Math.min(1, p.life);
                        
                        if (p.type === 'confetti') {
                            g.rect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
                             .fill({ color: p.color });
                            g.rotation = p.rotation;
                        } else {
                            g.circle(0, 0, p.size)
                             .fill({ color: p.color });
                        }
                        
                        g.x = p.x;
                        g.y = p.y;
                        particleContainer.addChild(g);
                    }
                });

                // Software Cursor (Visual Brush Tip)
                brushTip = new PIXI.Container();
                app.stage.addChild(brushTip);
                shellState.bet = ticketPrice;
                updateFooterDisplay();
                document.getElementById('btn-buy').onclick = buyTicket;
                document.getElementById('btn-autoplay').onclick = function() { if (shellState.isAutoPlaying) stopAutoplay(); else openAutoplayModal(); };

                // [FIX] Generate Emoji Brushes (Parity with Preview)
                function generateEmojiBrush(type, emoji) {
                     var c = document.createElement('canvas');
                     c.width = 128; c.height = 128; // High res
                     var ctx = c.getContext('2d');
                     ctx.font = '115px serif';
                     ctx.textAlign = 'center'; 
                     ctx.textBaseline = 'middle';
                     ctx.fillText(emoji, 64, 70);
                     return PIXI.Texture.from(c);
                }
                textureCache.set('brush_emoji_finger', generateEmojiBrush('finger', '👆'));
                textureCache.set('brush_emoji_wand', generateEmojiBrush('wand', '🪄'));
                textureCache.set('brush_emoji_eraser', generateEmojiBrush('eraser', '🧼'));
                textureCache.set('brush_emoji_coin', generateEmojiBrush('coin', '🪙'));

                // 3. Asset Loading (Custom Offline Loader)
                const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
                const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];

                // Broader traversal to catch everything
                const traverse = (obj) => {
                    if (!obj) return;
                    if (typeof obj === 'string') {
                        // Check if it looks like an asset path OR has image/audio extension OR is Base64
                        if (obj.includes('assets/') || 
                            imageExtensions.some(ext => obj.toLowerCase().endsWith(ext)) ||
                            audioExtensions.some(ext => obj.toLowerCase().endsWith(ext)) ||
                            obj.startsWith('data:image') ||
                            obj.startsWith('data:audio')) {
                            assetUrls.add(obj);
                        }
                    } else if (Array.isArray(obj)) {
                        obj.forEach(traverse);
                    } else if (typeof obj === 'object') {
                        Object.values(obj).forEach(traverse);
                    }
                };
                traverse(config);
                log("Found " + assetUrls.size + " potential assets");

                // Preload Assets
                let loadedCount = 0;
                
                // [FIX] Add timeout to prevent infinite loading
                const loadTimeout = setTimeout(() => {
                    log('Asset loading timed out - forcing start', 'warn');
                    startGame();
                }, 8000); // 8 seconds for audio/large assets

                const loadPromises = Array.from(assetUrls).map(url => {
                    const lower = url.toLowerCase();
                    const isImage = imageExtensions.some(ext => lower.endsWith(ext)) || url.startsWith('data:image');
                    const isAudio = audioExtensions.some(ext => lower.endsWith(ext)) || url.startsWith('data:audio');
                    
                    if (isImage) {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => {
                                const tex = PIXI.Texture.from(img);
                                textureCache.set(url, tex);
                                log("Loaded Image: " + url.substring(0, 40) + "...");
                                loadedCount++;
                                updateStatus();
                                resolve();
                            };
                            img.onerror = () => {
                                log("Failed to load image: " + url, "warn");
                                resolve(); 
                            };
                            img.src = url;
                        });
                    } else if (isAudio) {
                        return new Promise((resolve) => {
                            const audio = new Audio();
                            audio.preload = 'auto'; // Force buffer preload
                            audio.oncanplaythrough = () => {
                                log("Loaded Audio: " + url.substring(0, 40) + "...");
                                // Tag audio for lookup (find by extension-less name)
                                let assetId = url;
                                if (url.includes('base64')) {
                                    // Map common audio keys if it's base64
                                    if (config.scratch && config.scratch.audio) {
                                        for (const [key, val] of Object.entries(config.scratch.audio)) {
                                            if (val === url) { assetId = key; break; }
                                        }
                                    }
                                }
                                audioCache.set(assetId, audio);
                                loadedCount++;
                                updateStatus();
                                resolve();
                            };
                            audio.oncanplay = () => resolve(); 
                            audio.onerror = () => {
                                log("Failed to load audio: " + url, "warn");
                                resolve();
                            };
                            audio.src = url;
                        });
                    }
                    return Promise.resolve();
                });

                function updateStatus() {
                    const statusEl = document.getElementById('loading-status');
                    if(statusEl) {
                        statusEl.innerText = loadedCount + " / " + assetUrls.size;
                    }
                }

                if (loadPromises.length > 0) {
                    await Promise.all(loadPromises);
                }
                clearTimeout(loadTimeout);
                log("Asset Loading Complete");

                // Initialize Sound API
                initSound();

                // Initialize Brush Tip (Emoji Support)
                initBrushTip();
                
                startGame();

            } catch (e) {
                document.getElementById('loading').innerHTML = '<div style="color:red">Error: ' + e.message + '</div>';
                log(e.message, 'error');
                console.error(e);
            }
        }

        function startGame() {
             // Monkey-patch PIXI.Sprite.from to check our cache first
             const originalFrom = PIXI.Sprite.from;
             PIXI.Sprite.from = (source) => {
                 if (typeof source === 'string') {
                     if (textureCache.has(source)) {
                         return new PIXI.Sprite(textureCache.get(source));
                     }
                 }
                 return originalFrom(source);
             };

             // 4. Build Scene
             setupScene();
             document.getElementById('loading').style.display = 'none';
        }



function setupScene() {
    log('Setting up Scene...');
    // [FIX] Clean up existing listeners to prevent duplication on re-play
    app.stage.removeAllListeners();
    app.stage.removeChildren();
    
    var bgContainer = new PIXI.Container();
    app.stage.addChild(bgContainer);

    container = new PIXI.Container();
    app.stage.addChild(container);

    // Re-add/Move Brush Tip to the very top (Stage level)
    if (!brushTip) brushTip = new PIXI.Container();
    brushTip.removeChildren(); // [FIX] Clear old visual tips
    app.stage.addChild(brushTip);

    // A. Background
    var bgUrl = config.theme && config.theme.generated && config.theme.generated.background
        ? config.theme.generated.background
        : (config.scratch && config.scratch.layers && config.scratch.layers.scene && config.scratch.layers.scene.value);

    // [HEURISTIC] Search for bg image if explicit path is missing
    if (!bgUrl) {
        var potentialBgs = Array.from(assetUrls).filter(function (u) { return u.toLowerCase().includes('bg') || u.toLowerCase().includes('background'); });
        if (potentialBgs.length > 0) bgUrl = potentialBgs[0];
    }

    log('Background Value: ' + bgUrl);

    // A. Card Anchor (Logical 320x460 - Matches Preview wrapper)
    var cardAnchor = new PIXI.Container();

    // Unified Resize Handler for Mobile/Desktop parity
    var updateLayout = () => {
        // [NEW] Calculate Total Visual Bounds (Card + Pop-out Mascot/Logo)
        var minX = 0, maxX = CARD_WIDTH, minY = 0, maxY = CARD_HEIGHT;
        var mascotConf = (config.scratch && config.scratch.mascot) || {};
        var logoConf = (config.scratch && config.scratch.logo) || {};

        if (mascotConf.type === 'image' && mascotConf.image) {
            var mx = (CARD_WIDTH / 2) + (mascotConf.customPosition?.x || 0);
            var my = (CARD_HEIGHT / 2) + (mascotConf.customPosition?.y || 0);
            var mSize = (CARD_HEIGHT * (mascotConf.scale || 100)) / 100;
            // Refined heuristic: Mascots are usually ~0.6 width of height
            minX = Math.min(minX, mx - (mSize * 0.3)); 
            maxX = Math.max(maxX, mx + (mSize * 0.3));
            minY = Math.min(minY, my - (mSize * 0.5));
            maxY = Math.max(maxY, my + (mSize * 0.5));
        }
        if (logoConf.image && logoConf.layout !== 'integrated') {
            var lx = (CARD_WIDTH / 2) + (logoConf.customPosition?.x || 0);
            var ly = (logoConf.customPosition?.y ?? -180);
            var lScale = (logoConf.scale || 100) / 100;
            var lW = 280 * lScale;
            minX = Math.min(minX, lx - lW / 2);
            maxX = Math.max(maxX, lx + lW / 2);
            minY = Math.min(minY, ly);
        }

        // Horizontal: dist from 160
        var maxDistX = Math.max(160 - minX, maxX - 160);
        // Vertical: dist from 230
        var maxDistY = Math.max(230 - minY, maxY - 230);

        var totalW = maxDistX * 2;
        var totalH = maxDistY * 2;
        var vOffsetX = 0; // Keep card centered horizontally
        var vOffsetY = (minY + maxY) / 2 - (CARD_HEIGHT / 2);

        // 1. Background Scaling
        if (bgContainer.children.length > 0) {
            var bg = bgContainer.children[0];
            if (bg instanceof PIXI.Sprite) {
                var scale = Math.max(app.screen.width / bg.texture.width, app.screen.height / bg.texture.height);
                bg.scale.set(scale);
                bg.x = app.screen.width / 2;
                bg.y = app.screen.height / 2;
            } else if (bg instanceof PIXI.Graphics) {
                bg.clear().rect(0, 0, app.screen.width, app.screen.height).fill({ color: bgUrl || 0x1e293b });
            }
        }

        // 2. Card Scaling & Centering
        var footerH = window.innerWidth <= 640 ? 80 : 70;
        var marginX = window.innerWidth <= 640 ? 40 : 60;
        var marginY = window.innerWidth <= 640 ? 100 : 180;
        
        // Use totalW/totalH for scaling
        fitScale = Math.min((app.screen.width - marginX) / totalW, (app.screen.height - marginY) / totalH);
        cardAnchor.scale.set(fitScale);
        cardAnchor.x = (app.screen.width / 2) - (vOffsetX * fitScale);
        cardAnchor.y = ((app.screen.height - footerH) / 2) - (vOffsetY * fitScale);

        // [FIX] Scale brush tip to match fitScale (keep 1:1 with card logical size)
        if (brushTip) brushTip.scale.set(fitScale);
    };

    if (bgUrl) {
        if (textureCache.has(bgUrl) || bgUrl.startsWith('data:') || bgUrl.startsWith('http') || bgUrl.startsWith('/')) {
            var bgSprite = PIXI.Sprite.from(bgUrl);
            bgSprite.anchor.set(0.5);
            bgContainer.addChild(bgSprite);
            log('Background Loaded (Image)');
        } else if (bgUrl.startsWith('#') || bgUrl.includes('rgb') || bgUrl.includes('gradient')) {
            log('Detected CSS Background');
            if (bgUrl.includes('gradient')) {
                var canvas = document.createElement('canvas');
                canvas.width = 512; canvas.height = 512; 
                var ctx = canvas.getContext('2d');
                var grd = ctx.createLinearGradient(0, 0, 0, 512);
                var colors = bgUrl.match(/#[a-fA-F0-9]{3,6}|rgba?\([^\)]+\)/g) || ['#1e293b', '#0f172a'];
                if (colors.length >= 2) { grd.addColorStop(0, colors[0]); grd.addColorStop(1, colors[colors.length-1]); }
                else { grd.addColorStop(0, '#1e293b'); grd.addColorStop(1, '#0f172a'); }
                ctx.fillStyle = grd; ctx.fillRect(0, 0, 512, 512);
                var bgSprite = new PIXI.Sprite(PIXI.Texture.from(canvas));
                bgSprite.anchor.set(0.5);
                bgContainer.addChild(bgSprite);
            } else {
                var bgGfx = new PIXI.Graphics().rect(0, 0, app.screen.width, app.screen.height).fill({ color: bgUrl });
                bgContainer.addChild(bgGfx);
            }
        }
    } else {
        var g = new PIXI.Graphics().rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0x1e293b });
        bgContainer.addChild(g);
    }

    cardAnchor.pivot.set(CARD_WIDTH / 2, CARD_HEIGHT / 2);
    container.addChild(cardAnchor);

    // Initial Layout & Listeners
    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', () => setTimeout(updateLayout, 200));

    // B. Inner Masked Card Group (Frame + Grid + Surface)
    var innerCardGroup = new PIXI.Container();
    
    // Extract User-defined Card Transform (Step 4 Layout settings)
    var layoutTransform = (config.scratch && config.scratch.layout && config.scratch.layout.transform) || {};
    var cScaleX = (layoutTransform.scaleX || layoutTransform.scale || 100) / 100;
    var cScaleY = (layoutTransform.scaleY || layoutTransform.scale || 100) / 100;
    var cOffsetX = layoutTransform.x || 0;
    var cOffsetY = layoutTransform.y || 0;

    // Apply the inner transform (Scale from center of card)
    innerCardGroup.scale.set(cScaleX, cScaleY);
    innerCardGroup.x = (CARD_WIDTH / 2) + cOffsetX;
    innerCardGroup.y = (CARD_HEIGHT / 2) + cOffsetY;
    innerCardGroup.pivot.set(CARD_WIDTH / 2, CARD_HEIGHT / 2);
    
    cardAnchor.addChild(innerCardGroup);

    var symSizeScale = 0.85; 

    // A.1 Card Base Background (Always Bottom)
    var overlayConf = config.scratch?.layers?.overlay || {};
    var overlayColor = overlayConf.color || '#F2F0EB';
    if (overlayColor !== 'transparent') {
        var cardBg = new PIXI.Graphics().rect(0, 0, CARD_WIDTH, CARD_HEIGHT).fill({ color: overlayColor });
        innerCardGroup.addChild(cardBg);
        log('Card Base Background Rendered: ' + overlayColor);
    }

    // A.2 Card Frame Image Layer
    var frameUrl = config.theme && config.theme.generated && config.theme.generated.frame;
    var overlayZIndex = overlayConf.zIndex ?? 120;
    var overlayBlendMode = overlayConf.blendMode || 'normal';

    function renderFrameImage() {
        if (frameUrl && (textureCache.has(frameUrl) || frameUrl.startsWith('data:'))) {
            var frame = PIXI.Sprite.from(frameUrl);
            frame.width = CARD_WIDTH;
            frame.height = CARD_HEIGHT;
            if (overlayBlendMode === 'multiply') {
                frame.blendMode = 'multiply';
            }
            log('Card Frame Sprite Rendered (' + overlayBlendMode + ')');
            return frame;
        }
        return null;
    }

    var frameSprite = renderFrameImage();
    if (frameSprite && overlayZIndex < 50) {
        innerCardGroup.addChild(frameSprite); // Add at bottom (above background)
        log('Frame Image: Bottom');
    }

    // B. Grid / Internal Transforms
    var rows = (config.scratch && config.scratch.layout && config.scratch.layout.rows) || 3;
    var cols = (config.scratch && config.scratch.layout && config.scratch.layout.columns) || 3;

    var gridScaleX = (config.scratch?.layout?.grid?.scaleX ?? config.scratch?.layout?.grid?.scale ?? 87) / 100;
    var gridScaleY = (config.scratch?.layout?.grid?.scaleY ?? config.scratch?.layout?.grid?.scale ?? 79) / 100;
    var gridX = (config.scratch?.layout?.grid?.x ?? 0) + (CARD_WIDTH / 2); // Center relative to card pivot
    var gridY = (config.scratch?.layout?.grid?.y ?? 42) + (CARD_HEIGHT / 2);
    var gridBgColor = config.scratch?.layout?.gridBackgroundColor || '#ffffff';
    var cellStyle = config.scratch?.layout?.cellStyle || 'boxed';

    var gridContainer = new PIXI.Container();
    gridContainer.scale.set(gridScaleX, gridScaleY);
    gridContainer.x = gridX;
    gridContainer.y = gridY;
    
    // [FIX] Pivot should be Grid Center (200), not Card Center (230) to match Editor Scaling
    var isWheel = config.scratch?.mechanic?.type === 'wheel';
    var gridBaseHeight = isWheel ? 320 : 400;
    gridContainer.pivot.set(CARD_WIDTH / 2, gridBaseHeight / 2);
    
    // Add Grid Background
    var gridBg = new PIXI.Graphics().rect(0, 0, CARD_WIDTH, gridBaseHeight).fill({ color: gridBgColor, alpha: gridBgColor === 'transparent' ? 0 : 0.95 });
    gridContainer.addChild(gridBg);
    innerCardGroup.addChild(gridContainer);

    var mascotUrl = config.theme && config.theme.generated && config.theme.generated.mascot;
    var logoUrl = (config.scratch && config.scratch.logo && config.scratch.logo.image) || (config.theme && config.theme.generated && config.theme.generated.logo);

    var symbolValues = Object.values((config.theme && config.theme.generated && config.theme.generated.symbols) || {});
    
    if (symbolValues.length === 0) {
        symbolValues = ['https://cdn-icons-png.flaticon.com/512/616/616430.png'];
    }

    var cellW = CARD_WIDTH / cols;
    var cellH = 400 / rows; // Standard grid height is 400 in preview

    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            if (cellStyle === 'boxed') {
                var box = new PIXI.Graphics()
                    .roundRect(c * cellW + 4, r * cellH + 4, cellW - 8, cellH - 8, 8)
                    .fill({ color: 0xffffff, alpha: 0.9 })
                    .stroke({ color: 0xdddddd, width: 1 });
                gridContainer.addChild(box);
            }
            var symUrl = symbolValues.length > 0 ? symbolValues[Math.floor(Math.random() * symbolValues.length)] : null;
            if (symUrl) {
                var s = PIXI.Sprite.from(symUrl);
                s.width = cellW * 0.75;
                s.height = cellH * 0.75;
                s.anchor.set(0.5);
                s.x = c * cellW + cellW / 2;
                s.y = r * cellH + cellH / 2;
                gridContainer.addChild(s);

                // Add small currency label like at bottom right
                var currencyLabel = new PIXI.Text({
                    text: '$10',
                    style: {
                        fontFamily: 'monospace',
                        fontSize: 10,
                        fontWeight: 'bold',
                        fill: gridBgColor === 'transparent' ? 0x666666 : 0x999999,
                    }
                });
                currencyLabel.anchor.set(1, 1);
                currencyLabel.x = (c + 1) * cellW - 6;
                currencyLabel.y = (r + 1) * cellH - 6;
                gridContainer.addChild(currencyLabel);
            }
        }
    }

    // C. Scratch Surface
    var surfaceContainer = new PIXI.Container();
    surfaceContainer.scale.set(gridScaleX, gridScaleY);
    surfaceContainer.x = gridX;
    surfaceContainer.y = gridY;
    surfaceContainer.pivot.set(CARD_WIDTH / 2, gridBaseHeight / 2);
    innerCardGroup.addChild(surfaceContainer);

    surfaceUrl = config.theme && config.theme.generated && config.theme.generated.surface || '';
    var cover;
    if (surfaceUrl && textureCache.has(surfaceUrl)) {
        cover = PIXI.Sprite.from(surfaceUrl);
        cover.width = CARD_WIDTH;
        cover.height = gridBaseHeight; 
        log('Surface Image Loaded');
    } else if (surfaceUrl && (surfaceUrl.includes('foil') || surfaceUrl.includes('gold') || surfaceUrl.includes('silver') || surfaceUrl.includes('platinum') || surfaceUrl.includes('sand') || surfaceUrl.includes('copper'))) {
        log('Detected Procedural Preset: ' + surfaceUrl);
        var canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        var ctx = canvas.getContext('2d');
        if (surfaceUrl.includes('sand')) {
            ctx.fillStyle = '#e6c288'; ctx.fillRect(0, 0, 512, 512);
            for (var i = 0; i < 50000; i++) { ctx.fillStyle = Math.random() > 0.5 ? '#d4a76a' : '#f0d9b5'; ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
        } else if (surfaceUrl.includes('gold')) {
            var grd = ctx.createLinearGradient(0, 0, 512, 512);
            grd.addColorStop(0, '#bf953f'); grd.addColorStop(0.2, '#fcf6ba'); grd.addColorStop(0.4, '#b38728'); grd.addColorStop(0.6, '#fbf5b7'); grd.addColorStop(0.8, '#aa771c'); grd.addColorStop(1, '#bf953f');
            ctx.fillStyle = grd; ctx.fillRect(0, 0, 512, 512);
        } else if (surfaceUrl.includes('holographic')) {
            var grd = ctx.createLinearGradient(0, 0, 512, 512);
            grd.addColorStop(0, '#FF0000'); grd.addColorStop(0.14, '#FF7F00'); grd.addColorStop(0.28, '#FFFF00'); grd.addColorStop(0.42, '#00FF00'); grd.addColorStop(0.57, '#0000FF'); grd.addColorStop(0.71, '#4B0082'); grd.addColorStop(0.85, '#9400D3'); grd.addColorStop(1, '#FF0000');
            ctx.fillStyle = grd; ctx.fillRect(0, 0, 512, 512);
        } else if (surfaceUrl.includes('platinum') || surfaceUrl.includes('silver')) {
            var grd = ctx.createLinearGradient(0, 0, 512, 512);
            grd.addColorStop(0, '#E5E4E2'); grd.addColorStop(0.3, '#BFC0C2'); grd.addColorStop(0.6, '#FFFFFF'); grd.addColorStop(1, '#BFC0C2');
            ctx.fillStyle = grd; ctx.fillRect(0, 0, 512, 512);
        } else if (surfaceUrl.includes('copper')) {
            var grd = ctx.createLinearGradient(0, 0, 512, 512);
            grd.addColorStop(0, '#b87333'); grd.addColorStop(0.3, '#ec9b6b'); grd.addColorStop(0.6, '#b87333'); grd.addColorStop(1, '#8b4513');
            ctx.fillStyle = grd; ctx.fillRect(0, 0, 512, 512);
        } else {
            var grd = ctx.createLinearGradient(0, 0, 512, 512);
            grd.addColorStop(0, '#a0a0a0'); grd.addColorStop(0.5, '#e0e0e0'); grd.addColorStop(1, '#a0a0a0');
            ctx.fillStyle = grd; ctx.fillRect(0, 0, 512, 512);
        }
        var tex = PIXI.Texture.from(canvas);
        cover = new PIXI.Sprite(tex);
        cover.width = CARD_WIDTH;
        cover.height = gridBaseHeight; 
        log('Generated Procedural Texture');
    } else {
        var bgGfx = new PIXI.Graphics().rect(0, 0, CARD_WIDTH, gridBaseHeight).fill({ color: 0xFFD700 }); 
        cover = bgGfx;
    }
    surfaceContainer.addChild(cover);

    
    // E. Masking (Card Rounding) - Applied to INNER GROUP ONLY
    var mask = new PIXI.Graphics().roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 16).fill({ color: 0xffffff });
    innerCardGroup.addChild(mask);
    innerCardGroup.mask = mask;

    // [NEW] Add Frame Layer on TOP if zIndex is high
    if (frameSprite && overlayZIndex >= 50) {
        innerCardGroup.addChild(frameSprite);
        log('Frame Layer: Top');
    }
    
    // F. Scratch Masking (Surface) - [REFACTORED] Use Canvas2D for reliable parity with Preview
    const MASK_WIDTH = CARD_WIDTH;
    const MASK_HEIGHT = gridBaseHeight;
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = MASK_WIDTH;
    maskCanvas.height = MASK_HEIGHT;
    const maskCtx = maskCanvas.getContext('2d');
    
    // Initial Fill (White = Covered)
    maskCtx.fillStyle = 'white';
    maskCtx.fillRect(0, 0, MASK_WIDTH, MASK_HEIGHT);
    
    const maskTexture = PIXI.Texture.from(maskCanvas);
    const maskSprite = new PIXI.Sprite(maskTexture);
    
    // [FIX] Store on window for easy access by checkScratchProgress
    window.maskSprite = maskSprite;
    window.maskCtx = maskCtx;
    window.maskCanvas = maskCanvas;
    
    // Apply mask to surface
    surfaceContainer.mask = maskSprite;
    surfaceContainer.addChild(maskSprite); // Add to local space
    
    // G. Mascot Layer (Independent - Attached to Anchor, NOT Masked Group)
    // 1. Dynamic Mascot (from Step 3/Theme)
    if (mascotUrl) {
        var mascot = textureCache.has(mascotUrl) ? PIXI.Sprite.from(mascotUrl) : PIXI.Sprite.from(mascotUrl);
        var mascotConfig = (config.scratch && config.scratch.mascot) || {};
        var userScalePct = (mascotConfig.scale || 100) / 100;
        
        var baseRatio = CARD_HEIGHT / mascot.texture.height; 
        mascot.scale.set(baseRatio * userScalePct); 
        mascot.anchor.set(0.5);
        mascot.x = (CARD_WIDTH / 2) + (mascotConfig.customPosition?.x || 0);
        mascot.y = (CARD_HEIGHT / 2) + (mascotConfig.customPosition?.y || 0);
        cardAnchor.addChild(mascot);
        log('Mascot Overlay Added: ' + mascot.x + ',' + mascot.y);
    }
    
    // 2. Legacy Mascots
    if (config.scratch && config.scratch.layers && config.scratch.layers.overlay && Array.isArray(config.scratch.layers.overlay.mascots)) {
        config.scratch.layers.overlay.mascots.forEach(function(m) {
            if (m.source && textureCache.has(m.source)) {
                var legacyMascot = PIXI.Sprite.from(m.source);
                var scale = m.scale || 1;
                legacyMascot.width = 120 * scale; 
                var ratio = legacyMascot.texture.height / legacyMascot.texture.width;
                legacyMascot.height = legacyMascot.width * ratio;
                if (m.position.includes('top')) legacyMascot.y = -30;
                if (m.position.includes('bottom')) legacyMascot.y = CARD_HEIGHT - legacyMascot.height + 30;
                if (m.position.includes('left')) legacyMascot.x = -30;
                if (m.position.includes('right')) legacyMascot.x = CARD_WIDTH - legacyMascot.width + 30;
                
                cardAnchor.addChild(legacyMascot);
            }
        });
    }

    // H. Logo Layer
    if (logoUrl && textureCache.has(logoUrl)) {
        var logo = PIXI.Sprite.from(logoUrl);
        var logoConfig = (config.scratch && config.scratch.logo) || {};
        var logoLayout = logoConfig.layout || 'pop-out';
        var logoScale = (logoConfig.scale || 100) / 100;
        
        // Use texture width for reliable base dimensions
        var baseWidth = logo.texture.width;
        if (baseWidth > 280) {
            logoScale *= (280 / baseWidth);
        }

        logo.scale.set(logoScale);
        logo.anchor.set(0.5, 0); // Match React 'top: 0' + 'translate'
        
        // Positioning relative to Card Anchor
        logo.x = (CARD_WIDTH / 2) + (logoConfig.customPosition?.x || 0);
        logo.y = (logoConfig.customPosition?.y ?? -180); 
        
        if (logoLayout === 'integrated') {
            innerCardGroup.addChild(logo);
        } else {
            cardAnchor.addChild(logo);
        }
        log('Logo Added: ' + logo.x + ',' + logo.y + ' scale: ' + logoScale);
    }

        // I. Particle Layer (Topmost within card)
        particleContainer = new PIXI.Container();
        cardAnchor.addChild(particleContainer);

        function setupBrushInteraction() {
    let brushVisual;
    var brushConfig = (config.scratch && config.scratch.brush) || {};
    var bSize = Number(brushConfig.size || 40);
    var tipType = brushConfig.tipType || 'coin';
    
    if (tipType === 'custom' && brushConfig.customTipImage && textureCache.has(brushConfig.customTipImage)) {
        brushVisual = PIXI.Sprite.from(brushConfig.customTipImage);
        brushVisual.width = bSize; brushVisual.height = bSize;
        brushVisual.anchor.set(0.5);
    } else if (textureCache.has('brush_emoji_' + tipType)) {
        brushVisual = PIXI.Sprite.from('brush_emoji_' + tipType);
        brushVisual.width = bSize; brushVisual.height = bSize;
        brushVisual.anchor.set(0.5);
    } else {
        // Fallback (Circle) - Visual Cursor
        brushVisual = new PIXI.Graphics().circle(0, 0, bSize/2).fill({ color: 0xffffff, alpha: 0.8 }).stroke({ color: 0x000000, width: 2 });
    }
    brushTip.addChild(brushVisual);
    brushTip.visible = true; // [FIX] Always visible to act as cursor
    brushTip.eventMode = 'none'; 

    // Input Handling
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.cursor = 'none'; // [FIX] Hide default system cursor

    app.stage.on('pointerdown', onDragStart);
    app.stage.on('pointerup', onDragEnd);
    app.stage.on('pointerupoutside', onDragEnd);
    app.stage.on('pointermove', onDragMove);

    var brushSize = Number((config.scratch && config.scratch.brush && config.scratch.brush.size) || 40);
    // [REMOVED] brush graphics/sprite is no longer used for masking, only visual cursor


    function onDragStart(e) { 
        // [FIX] Restrict scratch start to the Card Area (Grid/Foil) only
        var localPos = surfaceContainer.toLocal(e.global);
        var margin = 10;
        if (localPos.x < -margin || localPos.x > CARD_WIDTH + margin || 
            localPos.y < -margin || localPos.y > gridBaseHeight + margin) {
            return;
        }

        isDrawing = true; 
        playSound('scratch', true); 
        // [FIX] Apply fitScale here too, use 0.95 for parity with preview
        brushTip.scale.set(fitScale * 0.95); 
        onDragMove(e);
    }
    function onDragEnd() { 
        isDrawing = false; 
        stopSound('scratch');
        checkScratchProgress(); // [FIX] Final check for instant reveal
        // [FIX] Restore to current fitScale
        brushTip.scale.set(fitScale); 
    }
    // [FIX] Helper for dynamic particle colors matching foil type
    const getParticleColor = () => {
        const foil = (surfaceUrl || '').toLowerCase();
        if (foil.includes('gold')) return 0xFFD700;
        if (foil.includes('silver') || foil.includes('platinum')) return 0xE5E4E2;
        if (foil.includes('copper')) return 0xB87333;
        if (foil.includes('holographic')) return Math.random() * 0xFFFFFF;
        if (foil.includes('sand')) return 0xE6C288;
        return 0xC0C0C0;
    };

    function onDragMove(e) {
        const pos = e.global;
        // Update Brush Tip (Visual)
        brushTip.position.copyFrom(pos);
        
        if (isDrawing) {
            // [FIX] Map global pointer to local coordinate space for masking
            const localPos = surfaceContainer.toLocal(pos);

            // Only scratch and spawn particles if we are within the surface bounds
            if (localPos.x >= 0 && localPos.x <= CARD_WIDTH && localPos.y >= 0 && localPos.y <= gridBaseHeight) {
                // [FIX] Use image-based scratching for 1:1 parity with Preview engine
                // This correctly handles image aspect ratio and internal padding/alpha
                let maskImg = null;
                if (brushVisual && brushVisual.texture) {
                    maskImg = brushVisual.texture.source?.resource;
                }

                // Calculate local scale compensation once
                const sCX = (typeof cScaleX !== 'undefined' ? cScaleX : 1);
                const sGX = (typeof gridScaleX !== 'undefined' ? gridScaleX : 1);
                const sCY = (typeof cScaleY !== 'undefined' ? cScaleY : 1);
                const sGY = (typeof gridScaleY !== 'undefined' ? gridScaleY : 1);
                
                maskCtx.save();
                maskCtx.globalCompositeOperation = 'destination-out';
                
                if (maskImg) {
                    // Match the visual brush's square envelope in local space
                    const localW = bSize / (sCX * sGX);
                    const localH = bSize / (sCY * sGY);
                    maskCtx.drawImage(maskImg, localPos.x - localW / 2, localPos.y - localH / 2, localW, localH);
                } else {
                    // Fallback to ellipse (matches Preview's geometric scratch path)
                    // We use 0.85 padding compensation for geometric shapes to match Preview parity
                    const localRadiusX = ((bSize / 2) * 0.85) / (sCX * sGX);
                    const localRadiusY = ((bSize / 2) * 0.85) / (sCY * sGY);
                    maskCtx.beginPath();
                    maskCtx.ellipse(localPos.x, localPos.y, localRadiusX, localRadiusY, 0, 0, Math.PI * 2);
                    maskCtx.fill();
                }
                maskCtx.restore();
                
                // Update the Pixi texture source
                if (maskTexture.source) maskTexture.source.update();
                else if (maskTexture.update) maskTexture.update(); // Legacy fallback


                // Spawn Particles (Shavings + Confetti)
                if (config.scratch?.effects?.particles !== false) {
                    const localCardPos = cardAnchor.toLocal(pos);
                    // 1. Shavings (Sparks) - Match foil color
                    for (let i = 0; i < 6; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const r = Math.random() * (bSize / 2);
                        particles.push({
                            x: localCardPos.x + Math.cos(angle) * r,
                            y: localCardPos.y + Math.sin(angle) * r,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            life: 1.5,
                            color: getParticleColor(),
                            type: 'spark',
                            size: Math.random() * 3 + 1
                        });
                    }
                    // 2. Confetti Snippets - Random vibrant colors (Parity with Preview)
                    if (config.scratch?.effects?.confetti !== false) {
                        for (let i = 0; i < 2; i++) {
                            particles.push({
                                x: localCardPos.x,
                                y: localCardPos.y,
                                vx: (Math.random() - 0.5) * 6,
                                vy: -5 - Math.random() * 5,
                                life: 3.0,
                                color: Math.random() * 0xFFFFFF,
                                type: 'confetti',
                                size: Math.random() * 6 + 4,
                                rotation: Math.random() * Math.PI,
                                vRotation: (Math.random() - 0.5) * 0.2
                            });
                        }
                    }
                }
            }
        }
    }
        }
        setupBrushInteraction();
    }

function spawnWinConfetti() {
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * CARD_WIDTH,
            y: -20 - Math.random() * 100,
            vx: (Math.random() - 0.5) * 10,
            vy: Math.random() * 5 + 2,
            life: 4.0,
            color: Math.random() * 0xFFFFFF,
            type: 'confetti',
            size: Math.random() * 8 + 4,
            rotation: Math.random() * Math.PI,
            vRotation: (Math.random() - 0.5) * 0.2
        });
    }
}

function resetGame() {
    setupScene();
}


async function checkScratchProgress() {
    if (shellState.gameState !== 'playing' && shellState.gameState !== 'idle') return;
    if (!window.maskCtx || !window.maskCanvas) return;

    try {
        const mCtx = window.maskCtx;
        const mCanvas = window.maskCanvas;
        
        // [REFACTORED] Standard Canvas2D pixel extraction (Parity with Preview)
        const imageData = mCtx.getImageData(0, 0, mCanvas.width, mCanvas.height);
        const pixels = imageData.data;
        
        // Count pixels with alpha (scratched area)
        // In destination-out, scratched area has alpha 0
        let scratchedCount = 0;
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 128) scratchedCount++;
        }
        
        const totalPixels = pixels.length / 4;
        const scratchedPct = scratchedCount / totalPixels;
        
        if (scratchedPct >= scratchThreshold) {
            shellState.win = currentOutcome.win;
            // [FIX] Sync with Preview State Machine (won vs revealed)
            shellState.gameState = shellState.win > 0 ? 'won' : 'revealed'; 
            
            // [FIX] Auto-reveal the rest of the foil (Clarity + Parity)
            mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height); 
            // Update the Sprite's texture source to reflect the cleared canvas
            if (window.maskSprite) window.maskSprite.texture.update();

            updateFooterDisplay();
        }
    } catch(e) {
        log("Progress check failed: " + e.message, "warn");
    }
}

window.addEventListener('load', init);
</script>
    </body>
    </html>`;
};
