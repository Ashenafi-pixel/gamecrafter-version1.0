import { PresetConfig } from '../types/EnhancedAnimationLabStep4';
import { PREDEFINED_SYMBOLS } from './predefinedSymbols';

export const getPresetSymbolKeys = (presetName: string): string[] => {
    const preset = PRESET_CONFIGURATIONS.find(p => p.name === presetName);
    if (!preset) return [];
    return preset.symbols.map(s => s.type.toLowerCase().replace(/\s+/g, ''));
};

export const getPresetPredefinedSymbols = (presetName: string): Record<string, string> => {
    const keys = getPresetSymbolKeys(presetName);
    const predefinedRecord = PREDEFINED_SYMBOLS as Record<string, string>;
    const result: Record<string, string> = {};
    
    keys.forEach(key => {
        if (predefinedRecord[key]) {
            result[key] = predefinedRecord[key];
        }
    });
    
    return result;
};

export const PRESET_CONFIGURATIONS: PresetConfig[] = [
    {
        name: 'Classic',
        description: 'Traditional 8-symbol setup',
        recommendedFor: 'New slot developers, simple games',
        estimatedRTP: '94-96%',
        suggestedFeatures: ['freespins', 'wild_substitution'],
        symbols: [
            { type: 'wild', count: 1, importance: 5, rarity: 'legendary' },
            { type: 'high 1', count: 1, importance: 4, rarity: 'rare' },
            { type: 'high 2', count: 1, importance: 4, rarity: 'rare' },
            { type: 'high 3', count: 1, importance: 4, rarity: 'rare' },
            { type: 'medium 1', count: 1, importance: 3, rarity: 'common' },
            { type: 'medium 2', count: 1, importance: 3, rarity: 'common' },
            { type: 'low 1', count: 1, importance: 2, rarity: 'common' },
            { type: 'low 2', count: 1, importance: 2, rarity: 'common' }
        ]
    },
    {
        name: 'Extended',
        description: 'Enhanced 10-symbol variety',
        recommendedFor: 'Intermediate games, more engagement',
        estimatedRTP: '95-97%',
        suggestedFeatures: ['freespins', 'wild_substitution', 'scatter_pays'],
        symbols: [
            { type: 'wild', count: 1, importance: 5, rarity: 'legendary' },
            { type: 'high 1', count: 1, importance: 4, rarity: 'rare' },
            { type: 'high 2', count: 1, importance: 4, rarity: 'rare' },
            { type: 'high 3', count: 1, importance: 4, rarity: 'rare' },
            { type: 'medium 1', count: 1, importance: 3, rarity: 'common' },
            { type: 'medium 2', count: 1, importance: 3, rarity: 'common' },
            { type: 'low 1', count: 1, importance: 2, rarity: 'common' },
            { type: 'low 2', count: 1, importance: 2, rarity: 'common' },
            { type: 'low 3', count: 1, importance: 2, rarity: 'common' },
            { type: 'low 4', count: 1, importance: 2, rarity: 'common' },
        ]
    },
    {
        name: 'Premium',
        description: 'High-variance 11-symbol set',
        recommendedFor: 'Advanced games, high engagement',
        estimatedRTP: '96-98%',
        suggestedFeatures: ['freespins', 'expanding_wilds', 'multipliers', 'bonus_rounds'],
        symbols: [
            { type: 'wild', count: 1, importance: 5, rarity: 'legendary' },
            { type: 'high 1', count: 1, importance: 4, rarity: 'rare' },
            { type: 'high 2', count: 1, importance: 4, rarity: 'rare' },
            { type: 'high 3', count: 1, importance: 4, rarity: 'rare' },
            { type: 'high 4', count: 1, importance: 4, rarity: 'rare' },
            { type: 'medium 1', count: 1, importance: 3, rarity: 'common' },
            { type: 'medium 2', count: 1, importance: 3, rarity: 'common' },
            { type: 'medium 3', count: 1, importance: 3, rarity: 'common' },
            { type: 'low 1', count: 1, importance: 2, rarity: 'common' },
            { type: 'low 2', count: 1, importance: 2, rarity: 'common' },
            { type: 'low 3', count: 1, importance: 2, rarity: 'common' },
        ]
    },
    {
        name: 'Mega',
        description: 'Maximum 14-symbol complexity',
        recommendedFor: 'Expert developers, AAA quality games',
        estimatedRTP: '96-99%',
        suggestedFeatures: ['freespins', 'expanding_wilds', 'sticky_wilds', 'multipliers', 'progressive_jackpot'],
        symbols: [
            { type: 'wild', count: 1, importance: 5, rarity: 'legendary' },
            { type: 'wild 2', count: 1, importance: 5, rarity: 'legendary' },
            { type: 'high 1', count: 1, importance: 4, rarity: 'rare' },
            { type: 'high 2', count: 1, importance: 4, rarity: 'rare' },
            { type: 'high 3', count: 1, importance: 4, rarity: 'rare' },
            { type: 'high 4', count: 1, importance: 4, rarity: 'rare' },
            { type: 'medium 1', count: 1, importance: 3, rarity: 'common' },
            { type: 'medium 2', count: 1, importance: 3, rarity: 'common' },
            { type: 'medium 3', count: 1, importance: 3, rarity: 'common' },
            { type: 'medium 4', count: 1, importance: 3, rarity: 'common' },
            { type: 'low 1', count: 1, importance: 2, rarity: 'common' },
            { type: 'low 2', count: 1, importance: 2, rarity: 'common' },
            { type: 'low 3', count: 1, importance: 2, rarity: 'common' },
            { type: 'low 4', count: 1, importance: 2, rarity: 'common' },
        ]
    }
];

export const getDefaultDescription = (type: string, theme: string): string => {
    const themeDescriptions: Record<string, Record<string, string>> = {
        'ancient-egypt': {
            wild: 'Golden pharaoh with WILD text',
            high: 'Egyptian god or goddess',
            medium: 'Egyptian cat or ankh',
            low: 'Egyptian hieroglyph'
        },
        'wild-west': {
            wild: 'Sheriff star with WILD text',
            high: 'Cowboy hat or revolver',
            medium: 'Horse or cactus',
            low: 'Playing card suit'
        },
        'candy-land': {
            wild: 'Golden candy with WILD text',
            high: 'Gummy bear or lollipop',
            medium: 'Chocolate or caramel',
            low: 'Candy cane or mint'
        },
        'fantasy-kingdom': {
            wild: 'Royal crown with WILD text',
            high: 'Dragon or wizard',
            medium: 'Knight or princess',
            low: 'Sword or shield'
        },
        default: {
            wild: 'Golden coin with WILD text',
            high: 'Crown or diamond',
            medium: 'Crystal or star',
            low: 'Card symbol'
        }
    };

    const themeKey = theme.toLowerCase().replace(/\s+/g, '-');
    const descriptions = themeDescriptions[themeKey] || themeDescriptions.default;
    return descriptions[type] || descriptions.high;
};
