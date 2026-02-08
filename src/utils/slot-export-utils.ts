
import { GameConfig } from '../types';
import { RGSMathSchema } from './scratch-export-utils'; // Reuse schema types

/**
 * Extracts and traverses the configuration to find all asset URLs for Slots.
 */
export const generateSlotAssetManifest = (config: GameConfig): string[] => {
    const assets = new Set<string>();

    // 1. Theme Symbols
    if (config.theme?.generated?.symbols) {
        Object.values(config.theme.generated.symbols).forEach(url => {
            if (typeof url === 'string') assets.add(url);
        });
    }

    // 2. Backgrounds
    if (config.derivedBackgrounds) {
        Object.values(config.derivedBackgrounds).forEach(url => {
            if (typeof url === 'string') assets.add(url);
        });
    }

    // 3. Frame/Reels
    if (config.frame?.frameImage) assets.add(config.frame.frameImage);

    // 4. Any direct asset references in the generic object walk
    const traverse = (obj: any) => {
        if (!obj) return;
        if (typeof obj === 'string') {
            if (obj.match(/^blob:/) || obj.match(/^https?:\/\//)) {
                assets.add(obj);
            }
            return;
        }
        if (typeof obj === 'object') {
            Object.values(obj).forEach(val => traverse(val));
        }
    };

    // Fallback scan
    traverse(config.theme);

    return Array.from(assets);
};

export const transformSlotToRGS = (config: GameConfig): RGSMathSchema => {
    // Basic Schema mapping for Slots
    return {
        schema_version: 1,
        model_id: config.gameId || 'slot_game',
        model_version: '1.0.0',
        mechanic: {
            type: config.reels?.payMechanism || 'betlines',
            grid_size: {
                rows: config.reels?.layout?.rows || 3,
                columns: config.reels?.layout?.reels || 5
            }
        },
        math_mode: 'UNLIMITED',
        win_logic: 'MULTI_WIN',
        prize_table: [], // Filled dynamically in real engine, placeholder here
        stats: {
            computed_rtp: 0.96,
            hit_rate: 0.25,
            variance: 10,
            max_win: 5000
        },
        integrity: { content_hash: 'pending' }
    };
};

export const generateCompleteSlotExport = (config: GameConfig) => {
    const rgsMath = transformSlotToRGS(config);
    const assetManifest = generateSlotAssetManifest(config);

    return {
        meta: {
            type: 'slot_machine',
            version: '2.0.0',
            exportedAt: new Date().toISOString()
        },
        visuals: config, // Full config for visual rebuild
        math: rgsMath,
        assets: assetManifest
    };
};
