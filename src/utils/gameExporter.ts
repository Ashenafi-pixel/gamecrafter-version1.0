import { GameConfig } from '../types';

interface ExportOptions {
    gameId: string;
    gameConfig: Partial<GameConfig>;
    title?: string;
    includeAnalytics?: boolean;
    customCSS?: string;
    customJS?: string;
}

interface ExportResult {
    success: boolean;
    htmlContent?: string;
    assets?: { [key: string]: string };
    error?: string;
}

export const exportGameAsHTML = async (options: ExportOptions): Promise<ExportResult> => {
    try {
        const {
            gameId,
            gameConfig,
            title = 'Slot Machine Game',
            includeAnalytics = false,
            customCSS = '',
            customJS = ''
        } = options;

        console.log('🎮 [GameExporter] Exporting game:', gameId);

        // Helper function to get symbol URLs from both array and object formats
        const getSymbolUrls = (symbols: string[] | Record<string, string> | undefined): string[] => {
            if (!symbols) return [];
            if (Array.isArray(symbols)) {
                return symbols.filter(Boolean).map(symbol => {
                    if (typeof symbol === 'string') return symbol;
                    if (typeof symbol === 'object' && symbol) {
                        return (symbol as any).url || (symbol as any).imageUrl || null;
                    }
                    return null;
                }).filter(Boolean);
            }
            return Object.values(symbols).filter(Boolean);
        };

        // Extract game assets
        const symbolsRaw = gameConfig?.theme?.generated?.symbols;
        const symbols = getSymbolUrls(symbolsRaw);

        console.log('🎮 [GameExporter] Processing symbols:', {
            symbolsRaw,
            processedSymbols: symbols,
            symbolCount: symbols.length
        });

        const background = gameConfig?.theme?.generated?.background || undefined;

        // Handle both frame types: outer frame and reel frame (ensure string URLs)
        const rawFrame = gameConfig?.theme?.generated?.frame ?? (gameConfig as any)?.frame;
        const outerFrame = typeof rawFrame === 'string' ? rawFrame : undefined;
        const reelFrame = (gameConfig as any)?.aiReelImage || undefined;
        const frameStyle = gameConfig?.frameStyle || 'outer';

        // Frame positioning data
        const frameAdjustments = {
            position: gameConfig?.framePosition || { x: 0, y: 0 },
            scale: gameConfig?.frameScale || 100,
            stretch: gameConfig?.frameStretch || { x: 100, y: 100 }
        };

        const reelAdjustments = {
            gap: gameConfig?.reelGap || 10,
            position: gameConfig?.reelDividerPosition || { x: 0, y: 0 },
            stretch: gameConfig?.reelDividerStretch || { x: 100, y: 100 }
        };

        console.log('🎮 [GameExporter] Frame configuration:', {
            frameStyle,
            outerFrame: !!outerFrame,
            reelFrame: !!reelFrame,
            frameAdjustments,
            reelAdjustments
        });

        const bonusSymbols = (gameConfig?.theme as any)?.generated?.bonusSymbols || {};
        const uiButtons = (gameConfig as any)?.extractedUIButtons || (gameConfig as any)?.uiElements || {};

        const gridAdjustments = (gameConfig as any)?.gridAdjustments || {
            scale: 120,
            stretch: (gameConfig as any)?.gridStretch || { x: 100, y: 100 },
            position: (gameConfig as any)?.gridPosition || { x: 0, y: 0 }
        };

        const htmlContent = generateStandaloneHTML({
            gameId,
            title,
            gameConfig: gameConfig as any,
            symbols,
            background,
            outerFrame,
            reelFrame,
            frameStyle,
            frameAdjustments,
            reelAdjustments,
            bonusSymbols,
            uiButtons,
            customCSS,
            customJS,
            includeAnalytics,
            gridAdjustments
        });

        // Collect all assets that need to be included
        const assets: { [key: string]: string } = {};

        // Add symbols
        symbols.forEach((symbol: string, index: number) => {
            if (symbol && typeof symbol === 'string') {
                assets[`symbol_${index}.png`] = symbol;
            }
        });

        // Add background (only string URL)
        if (background && typeof background === 'string') {
            assets['background.png'] = background;
        }

        // Add frames based on frame style
        if (outerFrame && (frameStyle === 'outer' || frameStyle === 'both')) {
            assets['outer_frame.png'] = outerFrame;
        }
        if (reelFrame && (frameStyle === 'reel' || frameStyle === 'both')) {
            assets['reel_frame.png'] = reelFrame;
        }

        // Add UI buttons (only string URLs)
        Object.entries(uiButtons).forEach(([key, url]) => {
            if (url && typeof url === 'string') assets[`${key}.png`] = url;
        });

        // Add bonus symbols (only string URLs)
        Object.entries(bonusSymbols).forEach(([key, url]) => {
            if (url && typeof url === 'string') assets[`${key}.png`] = url;
        });

        console.log('✅ [GameExporter] Game exported successfully with frame configuration:', {
            frameStyle,
            hasOuterFrame: !!outerFrame,
            hasReelFrame: !!reelFrame,
            frameAdjustments,
            reelAdjustments
        });

        return {
            success: true,
            htmlContent,
            assets
        };

    } catch (error) {
        console.error('❌ [GameExporter] Export failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown export error'
        };
    }
};

/** When provided, GAME_CONFIG will use these paths so the HTML works when opened from disk (e.g. from a ZIP). */
export interface LocalAssetPaths {
    symbols: string[];
    background?: string;
    outerFrame?: string;
    reelFrame?: string;
    uiButtons?: Record<string, string>;
    bonusSymbols?: Record<string, string>;
}

/**
 * Generate standalone HTML content.
 * Pass localAssetPaths when exporting as ZIP so assets load from assets/ folder.
 */
const generateStandaloneHTML = (params: {
    gameId: string;
    title: string;
    gameConfig: GameConfig;
    symbols: string[];
    background?: string;
    outerFrame?: string;
    reelFrame?: string;
    frameStyle: string;
    frameAdjustments: { position: { x: number; y: number }; scale: number; stretch: { x: number; y: number } };
    reelAdjustments: { gap: number; position: { x: number; y: number }; stretch: { x: number; y: number } };
    bonusSymbols: Record<string, string>;
    uiButtons: Record<string, string>;
    customCSS: string;
    customJS: string;
    includeAnalytics: boolean;
    localAssetPaths?: LocalAssetPaths;
    gridAdjustments?: { scale: number; stretch: { x: number; y: number }; position: { x: number; y: number } };
}): string => {
    const {
        gameId,
        title,
        gameConfig,
        symbols,
        background,
        outerFrame,
        reelFrame,
        frameStyle,
        frameAdjustments,
        reelAdjustments,
        bonusSymbols,
        uiButtons,
        customCSS,
        customJS,
        includeAnalytics,
        localAssetPaths,
        gridAdjustments = { scale: 120, stretch: { x: 100, y: 100 }, position: { x: 0, y: 0 } }
    } = params;

    const reels = gameConfig?.reels?.layout?.reels || 5;
    const rows = gameConfig?.reels?.layout?.rows || 3;
    const minBet = gameConfig?.bet?.min || 0.2;
    const maxBet = gameConfig?.bet?.max || 100;
    const initialBalance = (gameConfig?.playerExperience && (gameConfig.playerExperience as any).initialBalance) || 1000;

    const finalSymbols = localAssetPaths?.symbols ?? symbols.filter(Boolean);
    const finalBackground = localAssetPaths?.background ?? background;
    const finalOuterFrame = localAssetPaths?.outerFrame ?? outerFrame;
    const finalReelFrame = localAssetPaths?.reelFrame ?? reelFrame;
    const finalUiButtons = localAssetPaths?.uiButtons ?? uiButtons;
    const finalBonusSymbols = localAssetPaths?.bonusSymbols ?? bonusSymbols;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- PIXI.js -->
    <script src="https://cdn.jsdelivr.net/npm/pixi.js@7.4.3/dist/pixi.min.js"></script>
    
    <!-- GSAP for animations -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: #000;
            color: white;
            overflow: hidden;
        }
        
        .game-container {
            width: 100vw;
            height: 100vh;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        
        .game-header {
            background: #111;
            padding: 10px 20px;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .game-title {
            font-size: 18px;
            font-weight: bold;
        }
        
        .game-stats {
            font-size: 12px;
            color: #888;
        }
        
        .game-area {
            flex: 1;
            position: relative;
            background: radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f1419 100%);
        }
        
        .game-canvas {
            width: 100%;
            height: 100%;
            display: block;
        }
        
        .ui-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .game-info {
            display: flex;
            gap: 20px;
        }
        
        .info-item {
            text-align: center;
        }
        
        .info-label {
            font-size: 12px;
            color: #888;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 18px;
            font-weight: bold;
        }
        
        .win-value {
            color: #f59e0b;
        }
        
        .game-controls {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .control-btn {
            background: #333;
            border: 1px solid #555;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            font-size: 14px;
            font-weight: bold;
        }
        
        .control-btn:hover {
            background: #555;
        }
        
        .control-btn.active {
            background: #059669;
        }
        
        .spin-btn {
            background: linear-gradient(135deg, #dc2626, #ea580c);
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            color: white;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        .spin-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220,38,38,0.4);
        }
        
        .spin-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .spin-btn.spinning {
            background: #666;
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        ${customCSS}
    </style>
</head>
<body>
    <div class="game-container">
        <div class="game-header">
            <div class="game-title">${title}</div>
            <div class="game-stats">${reels}×${rows} grid</div>
        </div>
        
        <div class="game-area">
            <canvas id="gameCanvas" class="game-canvas"></canvas>
            
            <div class="ui-overlay">
                <div class="game-info">
                    <div class="info-item">
                        <div class="info-label">Balance</div>
                        <div class="info-value">$<span id="balance">${initialBalance.toFixed(2)}</span></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Bet</div>
                        <div class="info-value">$<span id="betAmount">${minBet.toFixed(2)}</span></div>
                    </div>
                </div>
                
                <div class="game-controls" id="gameControls">
                    <!-- UI buttons will be created dynamically -->
                </div>
                
                <div class="game-info">
                    <div class="info-item">
                        <div class="info-label">Win</div>
                        <div class="info-value win-value">$<span id="win">0.00</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Game Configuration (uses local paths when opened from ZIP)
        const GAME_CONFIG = ${JSON.stringify({
        gameId,
        reels,
        rows,
        symbols: finalSymbols,
        background: finalBackground,
        outerFrame: finalOuterFrame,
        reelFrame: finalReelFrame,
        frameStyle,
        frameAdjustments,
        reelAdjustments,
        bonusSymbols: finalBonusSymbols,
        uiButtons: finalUiButtons,
        gridAdjustments,
        minBet,
        maxBet,
        initialBalance,
        rtp: (gameConfig?.rtp && (gameConfig.rtp as any).target) || 96,
        volatility: gameConfig?.volatility?.level || 'medium',
        bonus: gameConfig?.bonus || {}
    }, null, 2)};
        
        console.log('🎮 Game configuration loaded:', GAME_CONFIG);
        
        // Game State
        let gameState = {
            balance: ${initialBalance},
            bet: ${minBet},
            win: 0,
            isSpinning: false,
            isAutoplayActive: false,
            autoplayCount: 0,
            spinHistory: []
        };
        
        // DOM Elements
        const canvas = document.getElementById('gameCanvas');
        const balanceEl = document.getElementById('balance');
        const winEl = document.getElementById('win');
        const betAmountEl = document.getElementById('betAmount');
        const spinBtn = document.getElementById('spinBtn');
        const autoBtn = document.getElementById('autoBtn');
        const betUpBtn = document.getElementById('betUp');
        const betDownBtn = document.getElementById('betDown');
        const quickBtn = document.getElementById('quickBtn');
        
        // PIXI Application
        let app = null;
        
        // Initialize the game
        async function initGame() {
            console.log('🎮 Initializing standalone slot game...');
            
            try {
                // Create PIXI application
                app = new PIXI.Application({
                    view: canvas,
                    width: canvas.offsetWidth || 800,
                    height: canvas.offsetHeight || 600,
                    backgroundColor: 0x000000,
                    antialias: true,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true
                });
                
                console.log('✅ PIXI application created');
                
                // Load and render game assets
                await loadGameAssets();
                console.log('✅ Assets loaded');
                
                renderSlotMachine();
                console.log('✅ Slot machine rendered');
                
                // Setup event listeners
                setupEventListeners();
                console.log('✅ Event listeners setup');
                
                console.log('✅ Game initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize game:', error);
                showError('Failed to initialize the game. Please refresh the page.');
            }
        }
        
        // Show error message
        function showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 8px; text-align: center; z-index: 1000;';
            errorDiv.innerHTML = '<h3>Game Loading Error</h3><p>' + message + '</p><button onclick="location.reload()" style="background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Refresh</button>';
            document.body.appendChild(errorDiv);
        }
        
        // Load game assets
        async function loadGameAssets() {
            console.log('📦 Loading game assets...');
            console.log('📦 Available symbols:', GAME_CONFIG.symbols);
            
            // Load symbols with proper error handling
            for (let i = 0; i < GAME_CONFIG.symbols.length; i++) {
                let symbolUrl = GAME_CONFIG.symbols[i];
                
                if (symbolUrl && typeof symbolUrl === 'string') {
                    try {
                        await PIXI.Assets.load(symbolUrl);
                        console.log('✅ Loaded symbol ' + i + ': ' + symbolUrl.substring(0, 50) + '...');
                    } catch (error) {
                        console.warn('⚠️ Failed to load symbol ' + i + ':', error);
                    }
                }
            }
            
            // Load background
            if (GAME_CONFIG.background) {
                try {
                    await PIXI.Assets.load(GAME_CONFIG.background);
                    console.log('✅ Loaded background');
                } catch (error) {
                    console.warn('⚠️ Failed to load background:', error);
                }
            }
            
            // Load frames based on frame style
            const frameStyle = GAME_CONFIG.frameStyle || 'outer';
            
            if (GAME_CONFIG.outerFrame && (frameStyle === 'outer' || frameStyle === 'both')) {
                try {
                    await PIXI.Assets.load(GAME_CONFIG.outerFrame);
                    console.log('✅ Loaded outer frame for style:', frameStyle);
                } catch (error) {
                    console.warn('⚠️ Failed to load outer frame:', error);
                }
            }
            
            if (GAME_CONFIG.reelFrame && (frameStyle === 'reel' || frameStyle === 'both')) {
                try {
                    await PIXI.Assets.load(GAME_CONFIG.reelFrame);
                    console.log('✅ Loaded reel frame for style:', frameStyle);
                } catch (error) {
                    console.warn('⚠️ Failed to load reel frame:', error);
                }
            }
            
            // Load UI buttons
            if (GAME_CONFIG.uiButtons) {
                for (const [buttonName, buttonUrl] of Object.entries(GAME_CONFIG.uiButtons)) {
                    if (buttonUrl && typeof buttonUrl === 'string') {
                        try {
                            await PIXI.Assets.load(buttonUrl);
                            console.log('✅ Loaded UI button ' + buttonName + ': ' + buttonUrl.substring(0, 50) + '...');
                        } catch (error) {
                            console.warn('⚠️ Failed to load UI button ' + buttonName + ':', error);
                        }
                    }
                }
            }
        }
        
        // Render the slot machine (layout matches designer: grid-centered, frame behind reels, dividers between reels)
        function renderSlotMachine() {
            app.stage.removeChildren();
            
            if (GAME_CONFIG.background) {
                const bg = PIXI.Sprite.from(GAME_CONFIG.background);
                bg.width = app.screen.width;
                bg.height = app.screen.height;
                app.stage.addChild(bg);
            }
            
            metrics = computeMetrics();
            const frameStyle = GAME_CONFIG.frameStyle || 'outer';
            const adjustments = GAME_CONFIG.frameAdjustments || { position: { x: 0, y: 0 }, scale: 100, stretch: { x: 100, y: 100 } };
            const reelAdj = GAME_CONFIG.reelAdjustments || { gap: 10, position: { x: 0, y: 0 }, stretch: { x: 100, y: 100 } };
            const gridCenterX = metrics.offsetX + metrics.totalWidth / 2;
            const gridCenterY = metrics.offsetY + metrics.totalHeight / 2;
            
            // Outer frame (behind reels, same as designer)
            if ((frameStyle === 'outer' || frameStyle === 'both') && GAME_CONFIG.outerFrame) {
                const frameSprite = PIXI.Sprite.from(GAME_CONFIG.outerFrame);
                const targetWidth = metrics.totalWidth * 1.1;
                const targetHeight = metrics.totalHeight * 1.1;
                const baseScaleX = targetWidth / frameSprite.texture.width;
                const baseScaleY = targetHeight / frameSprite.texture.height;
                const baseScale = Math.max(baseScaleX, baseScaleY);
                const scaleFactor = (adjustments.scale / 100) * baseScale;
                frameSprite.width = frameSprite.texture.width * scaleFactor * (adjustments.stretch.x / 100);
                frameSprite.height = frameSprite.texture.height * scaleFactor * (adjustments.stretch.y / 100);
                frameSprite.anchor.set(0.5);
                frameSprite.x = gridCenterX + (adjustments.position.x || 0);
                frameSprite.y = gridCenterY + (adjustments.position.y || 0);
                app.stage.addChild(frameSprite);
            }
            
            // Reel dividers (behind reels, same math as designer)
            if ((frameStyle === 'reel' || frameStyle === 'both') && GAME_CONFIG.reelFrame) {
                const baseDividerWidth = metrics.size * 0.08;
                const dividerWidth = baseDividerWidth * (reelAdj.stretch.x / 100);
                const dividerHeight = metrics.totalHeight * (reelAdj.stretch.y / 100);
                for (let i = 0; i < GAME_CONFIG.reels - 1; i++) {
                    const reelSprite = PIXI.Sprite.from(GAME_CONFIG.reelFrame);
                    const textureAspect = reelSprite.texture.width / reelSprite.texture.height;
                    const dividerAspect = dividerWidth / dividerHeight;
                    let scaleX, scaleY;
                    if (textureAspect > dividerAspect) {
                        scaleX = dividerWidth / reelSprite.texture.width;
                        scaleY = scaleX;
                    } else {
                        scaleY = dividerHeight / reelSprite.texture.height;
                        scaleX = scaleY;
                    }
                    reelSprite.scale.set(scaleX, scaleY);
                    reelSprite.width = dividerWidth;
                    reelSprite.height = dividerHeight;
                    const reelICenterX = metrics.offsetX + i * metrics.spacingX + metrics.size / 2;
                    const reelI1CenterX = metrics.offsetX + (i + 1) * metrics.spacingX + metrics.size / 2;
                    reelSprite.x = (reelICenterX + reelI1CenterX) / 2 + (reelAdj.position.x || 0);
                    reelSprite.y = metrics.offsetY + (reelAdj.position.y || 0);
                    reelSprite.anchor.set(0.5, 0);
                    app.stage.addChild(reelSprite);
                }
            }
            
            createSymbolGrid();
        }
        
        // Reel system variables (match designer layout)
        let reelContainers = [];
        let reelMasks = [];
        let symbolWidth = 0;
        let symbolHeight = 0;
        let gridOffsetX = 0;
        let gridOffsetY = 0;
        let gridHeight = 0;
        let metrics = null;
        
        // Same layout math as designer (SlotMachine computeResponsiveMetrics)
        function computeMetrics() {
            const w = app.screen.width;
            const h = app.screen.height;
            const availableHeight = h - 100;
            const gridAdj = GAME_CONFIG.gridAdjustments || { scale: 120, stretch: { x: 100, y: 100 }, position: { x: 0, y: 0 } };
            const reelAdj = GAME_CONFIG.reelAdjustments || { gap: 10, position: { x: 0, y: 0 }, stretch: { x: 100, y: 100 } };
            let size = Math.min(Math.floor((w * 0.8) / GAME_CONFIG.reels), Math.floor((availableHeight * 0.8) / GAME_CONFIG.rows));
            size = size * (gridAdj.scale / 120);
            const spacingX = size * 1.05 * (gridAdj.stretch.x / 100) + (reelAdj.gap || 0);
            const spacingY = size * 1.05 * (gridAdj.stretch.y / 100);
            const totalWidth = GAME_CONFIG.reels * spacingX;
            const totalHeight = GAME_CONFIG.rows * spacingY;
            const offsetX = (w - totalWidth) / 2 + (gridAdj.position.x || 0);
            const offsetY = (availableHeight - totalHeight) / 2 + (gridAdj.position.y || 0);
            return { size, spacingX, spacingY, offsetX, offsetY, totalWidth, totalHeight };
        }
        
        // Create reel-based slot machine system (matches designer layout)
        function createSymbolGrid() {
            metrics = computeMetrics();
            symbolWidth = metrics.size;
            symbolHeight = metrics.size;
            gridOffsetX = metrics.offsetX;
            gridOffsetY = metrics.offsetY;
            gridHeight = metrics.totalHeight;
            
            console.log('🎮 Creating reel-based slot machine (designer layout):', GAME_CONFIG.reels, 'reels', GAME_CONFIG.rows, 'rows', metrics);
            
            reelContainers = [];
            reelMasks = [];
            
            for (let reelIndex = 0; reelIndex < GAME_CONFIG.reels; reelIndex++) {
                const reelContainer = new PIXI.Container();
                reelContainer.x = gridOffsetX + reelIndex * metrics.spacingX;
                reelContainer.y = gridOffsetY;
                
                const mask = new PIXI.Graphics();
                mask.beginFill(0xffffff);
                mask.drawRect(0, 0, symbolWidth, gridHeight);
                mask.endFill();
                mask.x = reelContainer.x;
                mask.y = reelContainer.y;
                
                reelContainer.mask = mask;
                app.stage.addChild(mask);
                reelMasks.push(mask);
                
                populateReel(reelContainer, reelIndex);
                app.stage.addChild(reelContainer);
                reelContainers.push(reelContainer);
            }
            
            window.reelContainers = reelContainers;
            window.reelMasks = reelMasks;
        }
        
        // Populate a reel with symbols
        function populateReel(reelContainer, reelIndex) {
            // Clear existing symbols
            reelContainer.removeChildren();
            
            // Calculate how many symbols we need (visible + buffer for smooth scrolling)
            const visibleSymbols = GAME_CONFIG.rows;
            const bufferSymbols = 4; // Extra symbols above and below for smooth animation
            const totalSymbols = visibleSymbols + bufferSymbols;
            
            // Create symbols starting from above the visible area
            for (let i = 0; i < totalSymbols; i++) {
                const symbolSprite = createRandomSymbol();
                if (symbolSprite) {
                    // FIX: Maintain square aspect ratio
                    const symbolDisplaySize = Math.min(symbolWidth, symbolHeight) * 0.9;
                    symbolSprite.width = symbolDisplaySize;
                    symbolSprite.height = symbolDisplaySize;
                    symbolSprite.x = symbolWidth * 0.05;
                    symbolSprite.y = (i - 2) * symbolHeight + symbolHeight * 0.05; // Start 2 symbols above visible area
                    
                    reelContainer.addChild(symbolSprite);
                }
            }
        }
        
        // Create a random symbol sprite
        function createRandomSymbol() {
            if (GAME_CONFIG.symbols.length === 0) {
                // Create placeholder symbol
                const placeholder = new PIXI.Graphics();
                placeholder.beginFill(0x4a5568);
                placeholder.drawRoundedRect(0, 0, symbolWidth * 0.9, symbolHeight * 0.9, 8);
                placeholder.endFill();
                
                // Add border
                placeholder.lineStyle(2, 0x718096, 1);
                placeholder.drawRoundedRect(0, 0, symbolWidth * 0.9, symbolHeight * 0.9, 8);
                
                // Add text
                const text = new PIXI.Text('?', {
                    fontFamily: 'Arial',
                    fontSize: Math.min(symbolWidth, symbolHeight) * 0.3,
                    fill: 0xffffff,
                    align: 'center'
                });
                text.anchor.set(0.5);
                text.x = (symbolWidth * 0.9) / 2;
                text.y = (symbolHeight * 0.9) / 2;
                placeholder.addChild(text);
                
                return placeholder;
            }
            
            // Create actual symbol
            const symbolIndex = Math.floor(Math.random() * GAME_CONFIG.symbols.length);
            const symbolUrl = GAME_CONFIG.symbols[symbolIndex];
            
            try {
                const symbol = PIXI.Sprite.from(symbolUrl);
                return symbol;
            } catch (error) {
                console.warn('⚠️ Failed to create symbol from', symbolUrl, '- using placeholder');
                
                // Create fallback placeholder
                const placeholder = new PIXI.Graphics();
                placeholder.beginFill(0x718096);
                placeholder.drawRoundedRect(0, 0, symbolWidth * 0.9, symbolHeight * 0.9, 8);
                placeholder.endFill();
                
                return placeholder;
            }
        }
        
        // Add new symbol to top of reel
        function addSymbolToReel(reelContainer) {
            const newSymbol = createRandomSymbol();
            if (newSymbol) {
                newSymbol.width = symbolWidth * 0.9;
                newSymbol.height = symbolHeight * 0.9;
                newSymbol.x = symbolWidth * 0.05;
                
                // Position at the top (above visible area)
                const topSymbol = reelContainer.children[0];
                newSymbol.y = topSymbol.y - symbolHeight;
                
                reelContainer.addChildAt(newSymbol, 0);
            }
        }
        
        // Remove symbols that have scrolled off the bottom
        function removeBottomSymbols(reelContainer) {
            const maxY = gridHeight + symbolHeight; // Allow one symbol below visible area
            
            for (let i = reelContainer.children.length - 1; i >= 0; i--) {
                const symbol = reelContainer.children[i];
                if (symbol.y > maxY) {
                    reelContainer.removeChild(symbol);
                }
            }
        }
        
        // Setup event listeners
        function setupEventListeners() {
            // Get buttons after they're created
            const spinBtn = document.getElementById('spinBtn');
            const autoBtn = document.getElementById('autoBtn');
            const betUpBtn = document.getElementById('betUp');
            const betDownBtn = document.getElementById('betDown');
            const quickBtn = document.getElementById('quickBtn');
            
            // Spin button
            if (spinBtn) spinBtn.addEventListener('click', handleSpin);
            
            // Auto play button
            if (autoBtn) autoBtn.addEventListener('click', handleAutoplay);
            
            // Bet controls
            if (betUpBtn) betUpBtn.addEventListener('click', function() { changeBet(1); });
            if (betDownBtn) betDownBtn.addEventListener('click', function() { changeBet(-1); });
            
            // Quick spin button
            if (quickBtn) quickBtn.addEventListener('click', handleSpin);
            
            // Additional UI buttons
            const menuBtn = document.getElementById('menuBtn');
            const soundBtn = document.getElementById('soundBtn');
            const settingsBtn = document.getElementById('settingsBtn');
            
            if (menuBtn) menuBtn.addEventListener('click', function() { console.log('Menu clicked'); });
            if (soundBtn) soundBtn.addEventListener('click', function() { console.log('Sound clicked'); });
            if (settingsBtn) settingsBtn.addEventListener('click', function() { console.log('Settings clicked'); });
            
            // Resize handler
            window.addEventListener('resize', handleResize);
        }
        
        // Handle spin
        function handleSpin() {
            if (gameState.isSpinning || gameState.balance < gameState.bet) {
                console.log('⚠️ Cannot spin: spinning=' + gameState.isSpinning + ', balance=' + gameState.balance + ', bet=' + gameState.bet);
                return;
            }
            
            console.log('🎰 Starting spin...');
            
            // Kill any existing spin animations
            if (window.spinTimelines) {
                window.spinTimelines.forEach(timeline => timeline.kill());
            }
            gsap.killTweensOf('*'); // Kill all GSAP animations
            
            gameState.isSpinning = true;
            gameState.balance -= gameState.bet;
            gameState.win = 0;
            
            updateUI();
            
            // Small delay to ensure UI updates before animation starts
            gsap.delayedCall(0.1, animateSpin);
        }
        
        // Animate reel spin with proper slot machine mechanics
        function animateSpin() {
            if (!window.reelContainers || window.reelContainers.length === 0) {
                console.error('❌ No reel containers found for animation');
                gameState.isSpinning = false;
                updateUI();
                return;
            }
            
            console.log('🎰 Starting reel spin animation...');
            
            const reels = window.reelContainers;
            const spinDuration = 0.1; // Fast continuous spinning
            const stopDelays = [1.0, 1.3, 1.6, 1.9, 2.2]; // Staggered stop times
            const finalSettleDuration = 0.3;
            
            // Start all reels spinning
            const spinTimelines = [];
            
            reels.forEach((reel, reelIndex) => {
                // Create continuous spinning timeline for this reel
                const timeline = gsap.timeline();
                
                // Phase 1: Continuous spinning
                const spinTween = gsap.to(reel.children, {
                    y: '+='+symbolHeight,
                    duration: spinDuration,
                    ease: 'none',
                    repeat: -1,
                    onRepeat: function() {
                        // Add new symbols at top and remove bottom ones
                        addSymbolToReel(reel);
                        removeBottomSymbols(reel);
                    }
                });
                
                // Phase 2: Stop this reel after its delay
                gsap.delayedCall(stopDelays[reelIndex] || stopDelays[stopDelays.length - 1], function() {
                    // Kill the continuous spin
                    spinTween.kill();
                    
                    // Calculate final position to align symbols properly
                    const currentY = reel.children[2] ? reel.children[2].y : 0; // Use 3rd symbol as reference
                    const targetY = symbolHeight * 0.05; // Align to grid
                    const adjustment = targetY - (currentY % symbolHeight);
                    
                    // Final settle animation with bounce
                    gsap.to(reel.children, {
                        y: '+=' + adjustment,
                        duration: finalSettleDuration,
                        ease: 'back.out(1.7)',
                        onComplete: function() {
                            console.log('✅ Reel', reelIndex, 'stopped');
                            
                            // Check if all reels have stopped
                            if (reelIndex === reels.length - 1) {
                                // All reels stopped - finish spin
                                gsap.delayedCall(0.1, function() {
                                    calculateWin();
                                    gameState.isSpinning = false;
                                    updateUI();
                                    console.log('✅ All reels stopped - spin complete');
                                });
                            }
                        }
                    });
                });
                
                spinTimelines.push(timeline);
            });
            
            // Store timelines for potential cleanup
            window.spinTimelines = spinTimelines;
        }
        
        // Calculate win
        function calculateWin() {
            const winChance = Math.random();
            let winAmount = 0;
            
            if (winChance > 0.7) { // 30% win chance
                if (winChance > 0.95) {
                    winAmount = gameState.bet * (10 + Math.floor(Math.random() * 40));
                } else if (winChance > 0.85) {
                    winAmount = gameState.bet * (3 + Math.floor(Math.random() * 7));
                } else {
                    winAmount = gameState.bet * (1 + Math.floor(Math.random() * 2));
                }
            }
            
            gameState.win = winAmount;
            gameState.balance += winAmount;
            
            gameState.spinHistory.push({
                bet: gameState.bet,
                win: winAmount,
                timestamp: Date.now()
            });
            
            console.log('🎲 Spin result: bet ' + gameState.bet + ', win ' + winAmount);
        }
        
        // Handle autoplay
        function handleAutoplay() {
            gameState.isAutoplayActive = !gameState.isAutoplayActive;
            const autoBtn = document.getElementById('autoBtn');
            
            if (gameState.isAutoplayActive) {
                gameState.autoplayCount = 10;
                if (autoBtn) {
                    autoBtn.classList.add('active');
                    autoBtn.title = 'Stop auto play';
                }
                autoSpin();
            } else {
                gameState.autoplayCount = 0;
                if (autoBtn) {
                    autoBtn.classList.remove('active');
                    autoBtn.title = 'Auto play';
                }
            }
        }
        
        // Auto spin
        function autoSpin() {
            if (!gameState.isAutoplayActive || gameState.autoplayCount <= 0) {
                gameState.isAutoplayActive = false;
                const autoBtn = document.getElementById('autoBtn');
                if (autoBtn) autoBtn.classList.remove('active');
                return;
            }
            
            handleSpin();
            gameState.autoplayCount--;
            
            setTimeout(function() {
                if (gameState.isAutoplayActive) {
                    autoSpin();
                }
            }, 3000);
        }
        
        // Change bet
        function changeBet(direction) {
            const increment = 0.2;
            const newBet = gameState.bet + (direction * increment);
            
            if (newBet >= ${minBet} && newBet <= ${maxBet}) {
                gameState.bet = Math.round(newBet * 100) / 100;
                updateUI();
            }
        }
        
        // Update UI
        function updateUI() {
            if (balanceEl) balanceEl.textContent = gameState.balance.toFixed(2);
            if (winEl) winEl.textContent = gameState.win.toFixed(2);
            if (betAmountEl) betAmountEl.textContent = gameState.bet.toFixed(2);
            
            // Update spin button state
            const spinBtn = document.getElementById('spinBtn');
            if (spinBtn) {
                spinBtn.disabled = gameState.isSpinning || gameState.balance < gameState.bet;
                
                if (gameState.isSpinning) {
                    spinBtn.classList.add('spinning');
                    if (!GAME_CONFIG.uiButtons || !GAME_CONFIG.uiButtons.spinButton) {
                        spinBtn.textContent = 'SPINNING...';
                    }
                } else {
                    spinBtn.classList.remove('spinning');
                    if (!GAME_CONFIG.uiButtons || !GAME_CONFIG.uiButtons.spinButton) {
                        spinBtn.textContent = 'SPIN';
                    }
                }
            }
        }
        
        // Handle resize
        function handleResize() {
            if (app) {
                app.renderer.resize(canvas.offsetWidth, canvas.offsetHeight);
                
                // Clean up existing reel system
                if (window.reelContainers) {
                    window.reelContainers.forEach(reel => {
                        if (reel.parent) {
                            reel.parent.removeChild(reel);
                        }
                    });
                }
                
                if (window.reelMasks) {
                    window.reelMasks.forEach(mask => {
                        if (mask.parent) {
                            mask.parent.removeChild(mask);
                        }
                    });
                }
                
                // Recreate the slot machine with new dimensions
                renderSlotMachine();
            }
        }
        
        // Create UI buttons
        function createUIButtons() {
            const controlsContainer = document.getElementById('gameControls');
            if (!controlsContainer) return;
            
            // Clear existing buttons
            controlsContainer.innerHTML = '';
            
            // Button definitions with fallback - include all buttons from PixiJS preview
            const buttonDefs = [
                { id: 'betDown', key: null, text: '−', title: 'Decrease bet', class: 'control-btn' },
                { id: 'autoBtn', key: 'autoplayButton', text: '⟲', title: 'Auto play', class: 'control-btn' },
                { id: 'spinBtn', key: 'spinButton', text: 'SPIN', title: 'Spin', class: 'spin-btn' },
                { id: 'menuBtn', key: 'menuButton', text: '☰', title: 'Menu', class: 'control-btn' },
                { id: 'soundBtn', key: 'soundButton', text: '♪', title: 'Sound', class: 'control-btn' },
                { id: 'settingsBtn', key: 'settingsButton', text: '⚙', title: 'Settings', class: 'control-btn' },
                { id: 'quickBtn', key: null, text: '⏩', title: 'Quick spin', class: 'control-btn' },
                { id: 'betUp', key: null, text: '+', title: 'Increase bet', class: 'control-btn' }
            ];
            
            buttonDefs.forEach(def => {
                const button = document.createElement('button');
                button.id = def.id;
                button.className = def.class;
                button.title = def.title;
                
                // Use custom button image if available
                if (def.key && GAME_CONFIG.uiButtons && GAME_CONFIG.uiButtons[def.key]) {
                    button.style.backgroundImage = 'url(' + GAME_CONFIG.uiButtons[def.key] + ')';
                    button.style.backgroundSize = 'contain';
                    button.style.backgroundRepeat = 'no-repeat';
                    button.style.backgroundPosition = 'center';
                    button.style.border = 'none';
                    button.style.width = def.class === 'spin-btn' ? '60px' : '40px';
                    button.style.height = def.class === 'spin-btn' ? '60px' : '40px';
                    button.innerHTML = ''; // No text for image buttons
                } else {
                    button.textContent = def.text;
                }
                
                controlsContainer.appendChild(button);
            });
        }
        
        // Initialize game when page loads
        window.addEventListener('load', function() {
            console.log('🚀 Page loaded, initializing game...');
            console.log('🎮 Game config:', GAME_CONFIG);
            createUIButtons();
            initGame();
        });
        
        ${customJS}
        
        ${includeAnalytics ? `
        // Analytics tracking
        function trackEvent(event, data) {
            console.log('📊 Game Event:', event, data);
            // Add your analytics code here (Google Analytics, etc.)
        }
        ` : ''}
    </script>
</body>
</html>`;
};

/**
 * Fetch an asset URL (blob:, http:, or data:) and return as Blob for ZIP.
 */
async function fetchAssetAsBlob(url: string): Promise<Blob | null> {
    try {
        if (url.startsWith('data:')) {
            const res = await fetch(url);
            return await res.blob();
        }
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) return null;
        return await res.blob();
    } catch {
        return null;
    }
}

/**
 * Download game as ZIP with index.html and assets folder so the design matches when opening index.html.
 * Use this for the correct UI: assets are stored as local files and the HTML references them.
 */
export const downloadGameAsZip = async (options: ExportOptions): Promise<void> => {
    const result = await exportGameAsHTML(options);
    if (!result.success || !result.htmlContent || !result.assets) {
        throw new Error(result.error || 'Export failed');
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const assetsFolder = zip.folder('assets');
    if (!assetsFolder) throw new Error('Could not create assets folder');

    const assetList = Object.entries(result.assets);
    for (const [filename, url] of assetList) {
        if (!url) continue;
        const blob = await fetchAssetAsBlob(url);
        if (blob) assetsFolder.file(filename, blob);
    }

    const gridAdjustments = (options.gameConfig as any)?.gridAdjustments || {
        scale: 120,
        stretch: (options.gameConfig as any)?.gridStretch || { x: 100, y: 100 },
        position: (options.gameConfig as any)?.gridPosition || { x: 0, y: 0 }
    };

    const frameStyle = options.gameConfig?.frameStyle || 'outer';
    const symbols = result.assets ? Object.keys(result.assets)
        .filter(k => k.startsWith('symbol_'))
        .sort((a, b) => parseInt(a.replace('symbol_', ''), 10) - parseInt(b.replace('symbol_', ''), 10))
        .map(k => 'assets/' + k) : [];
    const localPaths: LocalAssetPaths = {
        symbols,
        background: result.assets['background.png'] ? 'assets/background.png' : undefined,
        outerFrame: (frameStyle === 'outer' || frameStyle === 'both') && result.assets['outer_frame.png'] ? 'assets/outer_frame.png' : undefined,
        reelFrame: (frameStyle === 'reel' || frameStyle === 'both') && result.assets['reel_frame.png'] ? 'assets/reel_frame.png' : undefined,
        uiButtons: {},
        bonusSymbols: {}
    };
    Object.keys(result.assets).forEach(k => {
        if (k.startsWith('symbol_') || k === 'background.png' || k === 'outer_frame.png' || k === 'reel_frame.png') return;
        if (k.endsWith('.png')) localPaths.uiButtons![k.replace('.png', '')] = 'assets/' + k;
    });
    Object.entries(result.assets).forEach(([k, _]) => {
        if (!k.startsWith('symbol_') && k !== 'background.png' && k !== 'outer_frame.png' && k !== 'reel_frame.png' && k.endsWith('.png')) {
            const key = k.replace('.png', '');
            if (!localPaths.uiButtons![key]) (localPaths.bonusSymbols as Record<string, string>)[key] = 'assets/' + k;
        }
    });

    const frameAdjustments = {
        position: options.gameConfig?.framePosition || { x: 0, y: 0 },
        scale: options.gameConfig?.frameScale || 100,
        stretch: options.gameConfig?.frameStretch || { x: 100, y: 100 }
    };
    const reelAdjustments = {
        gap: options.gameConfig?.reelGap ?? 10,
        position: options.gameConfig?.reelDividerPosition || { x: 0, y: 0 },
        stretch: options.gameConfig?.reelDividerStretch || { x: 100, y: 100 }
    };
    const symbolsRaw = options.gameConfig?.theme?.generated?.symbols;
    const getSymbolUrls = (s: string[] | Record<string, string> | undefined): string[] => {
        if (!s) return [];
        if (Array.isArray(s)) return s.filter(Boolean).map((x: any) => typeof x === 'string' ? x : (x?.url || x?.imageUrl)).filter(Boolean);
        return Object.values(s).filter(Boolean);
    };
    const symbolUrls = getSymbolUrls(symbolsRaw);
    const background = options.gameConfig?.theme?.generated?.background ?? undefined;
    const outerFrame = options.gameConfig?.theme?.generated?.frame ?? (options.gameConfig as any)?.frame;
    const outerFrameUrl = typeof outerFrame === 'string' ? outerFrame : undefined;
    const reelFrame = (options.gameConfig as any)?.aiReelImage;
    const bonusSymbols = (options.gameConfig?.theme as any)?.generated?.bonusSymbols || {};
    const uiButtons = (options.gameConfig as any)?.extractedUIButtons || (options.gameConfig as any)?.uiElements || {};

    const htmlForZip = generateStandaloneHTML({
        gameId: options.gameId,
        title: options.title || 'Slot Machine Game',
        gameConfig: options.gameConfig as GameConfig,
        symbols: symbolUrls,
        background,
        outerFrame: outerFrameUrl,
        reelFrame,
        frameStyle,
        frameAdjustments,
        reelAdjustments,
        bonusSymbols,
        uiButtons,
        customCSS: options.customCSS || '',
        customJS: options.customJS || '',
        includeAnalytics: options.includeAnalytics ?? false,
        localAssetPaths: localPaths,
        gridAdjustments
    });

    zip.file('index.html', htmlForZip);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${options.gameId || 'game'}-export.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ [GameExporter] ZIP with assets downloaded – open index.html from the extracted folder for correct design');
}

/**
 * Download game as HTML file (single file; asset URLs may be blob/data – for same design use downloadGameAsZip).
 */
export const downloadGameAsHTML = async (options: ExportOptions): Promise<void> => {
    const result = await exportGameAsHTML(options);

    if (result.success && result.htmlContent) {
        const blob = new Blob([result.htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${options.gameId}-standalone.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✅ [GameExporter] HTML file downloaded');
    } else {
        console.error('❌ [GameExporter] Failed to export game:', result.error);
        throw new Error(result.error || 'Export failed');
    }
};