export type AssetSetKey = 'gems' | 'fruits' | 'numbers' | 'elements' | 'cash' | 'emojis' | 'mines' | 'instant_win';

export const ASSET_MAP: Record<AssetSetKey, { win: string[]; lose: string[] }> = {
    gems: {
        win: ['/assets/symbols/defstar.png', '/assets/symbols/defstar.png', '/assets/symbols/defstar.png'],
        lose: ['/assets/symbols/star_stone_fixed.png', '/assets/symbols/star_stone_fixed.png', '/assets/symbols/star_stone_fixed.png'] // Final Fixed PNG
    },
    fruits: {
        win: ['/assets/symbols/defstar.png', '/assets/symbols/defstar.png', '/assets/symbols/defstar.png'],
        lose: ['/assets/symbols/star_stone_fixed.png', '/assets/symbols/star_stone_fixed.png', '/assets/symbols/star_stone_fixed.png']
    },
    numbers: {
        win: ['€100', '€500', '€10,000'], // These are placeholders; logic replaces them with actual values
        lose: ['€0', '€0', '€0']
    },
    elements: {
        win: ['https://cdn-icons-png.flaticon.com/512/426/426833.png', 'https://cdn-icons-png.flaticon.com/512/1169/1169932.png', 'https://cdn-icons-png.flaticon.com/512/375/375762.png'],
        lose: ['https://cdn-icons-png.flaticon.com/512/327/327708.png', 'https://cdn-icons-png.flaticon.com/512/427/427112.png', 'https://cdn-icons-png.flaticon.com/512/2910/2910156.png']
    },
    cash: {
        win: ['https://cdn-icons-png.flaticon.com/512/2488/2488749.png', 'https://cdn-icons-png.flaticon.com/512/2489/2489240.png', 'https://cdn-icons-png.flaticon.com/512/936/936780.png'],
        lose: ['https://cdn-icons-png.flaticon.com/512/2488/2488667.png', 'https://cdn-icons-png.flaticon.com/512/2933/2933116.png', 'https://cdn-icons-png.flaticon.com/512/1077/1077306.png']
    },
    emojis: {
        win: ['https://cdn-icons-png.flaticon.com/512/10542/10542526.png', 'https://cdn-icons-png.flaticon.com/512/10542/10542542.png', 'https://cdn-icons-png.flaticon.com/512/10542/10542528.png'], // Sunglasses, Star-Eyes, Money-Mouth
        lose: ['https://cdn-icons-png.flaticon.com/512/10542/10542528.png', 'https://cdn-icons-png.flaticon.com/512/10542/10542486.png', 'https://cdn-icons-png.flaticon.com/512/10542/10542567.png'] // Poop, Clown, Skull
    },
    mines: {
        win: ['https://cdn-icons-png.flaticon.com/512/616/616430.png', 'https://cdn-icons-png.flaticon.com/512/266/266512.png', 'https://cdn-icons-png.flaticon.com/512/766/766023.png'], // Gems (Safe)
        lose: ['https://cdn-icons-png.flaticon.com/512/112/112683.png', 'https://cdn-icons-png.flaticon.com/512/493/493907.png', 'https://cdn-icons-png.flaticon.com/512/9338/9338042.png'] // Bombs
    },
    instant_win: {
        win: ['https://cdn-icons-png.flaticon.com/512/1628/1628441.png', 'https://cdn-icons-png.flaticon.com/512/744/744922.png', 'https://cdn-icons-png.flaticon.com/512/616/616430.png'], // Trophy, Crown, Gem
        lose: ['https://cdn-icons-png.flaticon.com/512/1828/1828665.png', 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png', 'https://cdn-icons-png.flaticon.com/512/2732/2732655.png'] // X, Empty
    }
};
