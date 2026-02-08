export const generateSlotGridSystem = () =>`
import * as PIXI from 'pixi.js';
import { GameConfig, HoldSpinState, SymbolType } from '../types';

export const createSlotGridSystem = () => {
  // Create reel-based slot machine system (exact copy from HTML exporter)
  const createSymbolGrid = (
    app: PIXI.Application,
    config: GameConfig,
    loadedTextures: Map<string, PIXI.Texture>,
    reelContainersRef: React.MutableRefObject<PIXI.Container[]>,
    reelMasksRef: React.MutableRefObject<PIXI.Graphics[]>,
    symbolWidthRef: React.MutableRefObject<number>,
    symbolHeightRef: React.MutableRefObject<number>,
    holdSpinStateRef: React.MutableRefObject<HoldSpinState>,
    isHoldSpinSymbol: (symbolType: SymbolType | string) => boolean
  ) => {
    console.log('🎮 Creating reel-based slot machine with', config.reels || 5, 'reels and', config.rows || 3, 'rows');
    
    // Calculate grid dimensions
    const gridWidth = app.screen.width * 0.6;
    const gridHeight = app.screen.height * 0.6;
    
    // Use square symbols (minimum dimension)
    const symbolSize = Math.min(gridWidth / (config.reels || 5), gridHeight / (config.rows || 3));
    symbolWidthRef.current = symbolSize;
    symbolHeightRef.current = symbolSize;
    
    // Center the entire grid properly
    const actualGridWidth = (config.reels || 5) * symbolSize;
    const actualGridHeight = (config.rows || 3) * symbolSize;
    const gridOffsetX = (app.screen.width - actualGridWidth) / 2;
    const gridOffsetY = (app.screen.height - actualGridHeight) / 2;
    
    // Clear existing reels
    reelContainersRef.current = [];
    reelMasksRef.current = [];
    
    // Create individual reel containers
    for (let reelIndex = 0; reelIndex < (config.reels || 5); reelIndex++) {
      const reelContainer = new PIXI.Container();
      reelContainer.x = gridOffsetX + (reelIndex * symbolSize);
      reelContainer.y = gridOffsetY;
      
      // Create mask for this reel to hide symbols outside visible area
      const mask = new PIXI.Graphics();
      mask.beginFill(0xffffff);
      mask.drawRect(0, 0, symbolSize, gridHeight);
      mask.endFill();
      mask.x = reelContainer.x;
      mask.y = reelContainer.y;
      
      reelContainer.mask = mask;
      app.stage.addChild(mask);
      reelMasksRef.current.push(mask);
      
      // Populate reel with symbols (visible + buffer symbols)
      // populateReel(reelContainer, reelIndex, symbolSize, loadedTextures, config, holdSpinStateRef, isHoldSpinSymbol);
            populateReel(reelContainer, symbolSize, loadedTextures, config, holdSpinStateRef, isHoldSpinSymbol);

      app.stage.addChild(reelContainer);
      reelContainersRef.current.push(reelContainer);
    }
  };
  
  // Populate a reel with symbols (fixed positioning)
  const populateReel = (
    reelContainer: PIXI.Container, 
    // reelIndex: number, 
    symbolSize: number, 
    loadedTextures: Map<string, PIXI.Texture>,
    config: GameConfig,
    holdSpinStateRef: React.MutableRefObject<HoldSpinState>,
    isHoldSpinSymbol: (symbolType: SymbolType | string) => boolean
  ) => {
    reelContainer.removeChildren();
    const visibleSymbols = config.rows || 3;
    const bufferSymbols = 4;
    const totalSymbols = visibleSymbols + bufferSymbols;
    
    for (let i = 0; i < totalSymbols; i++) {
      const symbolSprite = createRandomSymbol(symbolSize, loadedTextures, config, holdSpinStateRef, isHoldSpinSymbol);
      if (symbolSprite) {
        symbolSprite.width = symbolSize;
        symbolSprite.height = symbolSize;
        symbolSprite.x = 0;
        symbolSprite.y = (i - 2) * symbolSize;
        
        reelContainer.addChild(symbolSprite);
      }
    }
  };
  
  // Create a random symbol sprite (fixed sizing)
  const createRandomSymbol = (
    symbolSize: number, 
    loadedTextures: Map<string, PIXI.Texture>,
    config: GameConfig,
    holdSpinStateRef: React.MutableRefObject<HoldSpinState>,
    isHoldSpinSymbol: (symbolType: SymbolType | string) => boolean
  ) => {
    if (!config.symbols || config.symbols.length === 0) {
      const placeholder = new PIXI.Graphics();
      placeholder.beginFill(0x4a5568);
      placeholder.drawRoundedRect(0, 0, symbolSize, symbolSize, 8);
      placeholder.endFill();
      placeholder.lineStyle(2, 0x718096, 1);
      placeholder.drawRoundedRect(0, 0, symbolSize, symbolSize, 8);
      
      const text = new PIXI.Text('?', {
        fontFamily: 'Arial',
        fontSize: symbolSize * 0.3,
        fill: 0xffffff,
        align: 'center'
      });
      text.anchor.set(0.5);
      text.x = symbolSize / 2;
      text.y = symbolSize / 2;
      placeholder.addChild(text);
      
      // Add symbol type for win calculation
      (placeholder as any).userData = { symbolType: 'low1' };
      return placeholder;
    }
    
    const symbolIndex = Math.floor(Math.random() * config.symbols.length);
    const symbolUrl = config.symbols[symbolIndex];
    const symbolType = config.symbolTypes[symbolIndex] || 'low1';
    
    try {
      if (loadedTextures.has(symbolUrl)) {
        const sprite = new PIXI.Sprite(loadedTextures.get(symbolUrl));
        // Add symbol type for win calculation
        (sprite as any).userData = { symbolType };
        
        // Hide non-hold spin symbols during Hold & Spin mode
        if (holdSpinStateRef.current.isActive && !isHoldSpinSymbol(symbolType)) {
          sprite.alpha = 0;
        }
        
        return sprite;
      } else {
        const placeholder = new PIXI.Graphics();
        placeholder.beginFill(0x718096);
        placeholder.drawRoundedRect(0, 0, symbolSize, symbolSize, 8);
        placeholder.endFill();
        // Add symbol type for win calculation
        (placeholder as any).userData = { symbolType };
        
        // Hide non-hold spin symbols during Hold & Spin mode
        if (holdSpinStateRef.current.isActive && !isHoldSpinSymbol(symbolType)) {
          placeholder.alpha = 0;
        }
        
        return placeholder;
      }
    } catch (error) {
      const placeholder = new PIXI.Graphics();
      placeholder.beginFill(0x718096);
      placeholder.drawRoundedRect(0, 0, symbolSize, symbolSize, 8);
      placeholder.endFill();
      // Add symbol type for win calculation
      (placeholder as any).userData = { symbolType };
      
      // Hide non-hold spin symbols during Hold & Spin mode
      if (holdSpinStateRef.current.isActive && !isHoldSpinSymbol(symbolType)) {
        placeholder.alpha = 0;
      }
      
      return placeholder;
    }
  };

  return {
    createSymbolGrid,
    populateReel,
    createRandomSymbol
  };
};`

export const generateAnnouncement = () => `export const createAnnouncementSystem = () => {
  // Check if announcement image exists for a specific type
  const checkAnnouncementImage = async (type: string): Promise<string | null> => {
    const imagePath = \`/assets/announcements/\${type}.png\`;
    
    try {
      // Create a test image to check if the file exists
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => resolve(imagePath);
        img.onerror = () => resolve(null);
        img.src = imagePath;
      });
    } catch {
      return null;
    }
  };

  return {
    checkAnnouncementImage
  };
};`