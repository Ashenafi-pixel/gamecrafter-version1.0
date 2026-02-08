/**
 * Bulletproof initializeReelsAndSymbols() Function
 * =================================================
 * 
 * Complete implementation for Professional1to1PixiSlot.tsx
 * Ensures all symbols are visually rendered with proper layout
 */

/**
 * Initialize reels and symbols with bulletproof rendering
 * Called within useEffect() in Professional1to1PixiSlot component
 */
const initializeReelsAndSymbols = useCallback(async () => {
  console.log('🎰 === STARTING REEL INITIALIZATION ===');
  
  // ==========================================
  // VALIDATION AND SETUP
  // ==========================================
  
  const app = pixiAppRef.current;
  if (!app) {
    console.error('❌ CRITICAL: No PIXI Application found');
    return;
  }
  
  if (!app.stage) {
    console.error('❌ CRITICAL: No PIXI Stage found');
    return;
  }
  
  const canvasWidth = app.screen.width;
  const canvasHeight = app.screen.height;
  const symbolImages = getSymbolImages();
  
  console.log('📊 Canvas dimensions:', { canvasWidth, canvasHeight });
  console.log('🎯 Grid configuration:', { reels, rows });
  console.log('🖼️ Available symbols:', symbolImages.length);
  
  if (symbolImages.length === 0) {
    console.warn('⚠️ No symbol images available, using fallbacks');
  }
  
  // ==========================================
  // STAGE CLEANUP
  // ==========================================
  
  console.log('🧹 Cleaning previous stage elements...');
  
  // Clear existing reels
  if (reelContainersRef.current && reelContainersRef.current.length > 0) {
    reelContainersRef.current.forEach((container, index) => {
      if (container && container.parent) {
        console.log(`🗑️ Removing reel container ${index}`);
        container.parent.removeChild(container);
        container.destroy({ children: true, texture: false, baseTexture: false });
      }
    });
  }
  
  // Clear existing symbols
  if (symbolSpritesRef.current && symbolSpritesRef.current.length > 0) {
    symbolSpritesRef.current.forEach((reelSymbols, reelIndex) => {
      if (reelSymbols && reelSymbols.length > 0) {
        reelSymbols.forEach((sprite, symbolIndex) => {
          if (sprite && sprite.parent) {
            sprite.parent.removeChild(sprite);
            sprite.destroy({ texture: false, baseTexture: false });
          }
        });
      }
    });
  }
  
  // Reset refs
  reelContainersRef.current = [];
  symbolSpritesRef.current = [];
  
  // Clear any existing stage children (except permanent UI elements)
  const childrenToRemove = app.stage.children.filter(child => 
    child.name && (child.name.includes('reel') || child.name.includes('symbol') || child.name.includes('background'))
  );
  
  childrenToRemove.forEach(child => {
    app.stage.removeChild(child);
    child.destroy({ children: true, texture: false, baseTexture: false });
  });
  
  console.log('✅ Stage cleanup complete');
  
  // ==========================================
  // LAYOUT CALCULATIONS
  // ==========================================
  
  console.log('📐 Calculating layout dimensions...');
  
  // Calculate margins (10% of canvas on each side)
  const marginX = canvasWidth * 0.1;
  const marginY = canvasHeight * 0.1;
  const availableWidth = canvasWidth - (marginX * 2);
  const availableHeight = canvasHeight - (marginY * 2);
  
  // Calculate reel dimensions
  const reelWidth = availableWidth / reels;
  const reelHeight = availableHeight;
  
  // Calculate symbol dimensions with gaps
  const totalHorizontalGaps = (reels - 1) * 10; // 10px gap between reels
  const adjustedReelWidth = (availableWidth - totalHorizontalGaps) / reels;
  const symbolWidth = adjustedReelWidth * 0.85; // 85% of reel width for symbol
  
  const totalVerticalGaps = (rows - 1) * 5; // 5px gap between symbols
  const adjustedReelHeight = availableHeight - totalVerticalGaps;
  const symbolHeight = adjustedReelHeight / rows;
  
  const layout = {
    marginX,
    marginY,
    availableWidth,
    availableHeight,
    reelWidth: adjustedReelWidth,
    reelHeight,
    symbolWidth,
    symbolHeight,
    reelGap: 10,
    symbolGap: 5
  };
  
  console.log('📐 Layout calculated:', layout);
  
  // ==========================================
  // BACKGROUND CREATION
  // ==========================================
  
  console.log('🎨 Creating background...');
  
  // Create main background
  const background = new PIXI.Graphics();
  background.name = 'main-background';
  background.rect(0, 0, canvasWidth, canvasHeight);
  background.fill(0x0a0a0a); // Very dark background
  app.stage.addChild(background);
  
  // Create game area background
  const gameAreaBg = new PIXI.Graphics();
  gameAreaBg.name = 'game-area-background';
  gameAreaBg.rect(marginX, marginY, availableWidth, availableHeight);
  gameAreaBg.fill(0x1a1a2e); // Dark blue game area
  gameAreaBg.stroke({ width: 2, color: 0x16213e });
  app.stage.addChild(gameAreaBg);
  
  console.log('✅ Backgrounds created');
  
  // ==========================================
  // TEXTURE LOADING & VALIDATION
  // ==========================================
  
  console.log('🖼️ Loading and validating textures...');
  
  const textureCache = symbolTexturesRef.current;
  if (!textureCache) {
    console.error('❌ CRITICAL: No texture cache available');
    return;
  }
  
  // Ensure we have textures loaded
  if (textureCache.size === 0) {
    console.log('📥 Loading textures...');
    await loadSymbolTextures(symbolImages);
  }
  
  // Create fallback texture if needed
  let fallbackTexture: PIXI.Texture;
  try {
    const fallbackGraphics = new PIXI.Graphics();
    fallbackGraphics.rect(0, 0, 100, 100);
    fallbackGraphics.fill(0xff6600); // Orange
    fallbackGraphics.stroke({ width: 3, color: 0xffffff }); // White border
    
    // Add text indicator
    const fallbackText = new PIXI.Text('SYM', {
      fontSize: 24,
      fill: 0xffffff,
      fontWeight: 'bold'
    });
    fallbackText.anchor.set(0.5);
    fallbackText.x = 50;
    fallbackText.y = 50;
    fallbackGraphics.addChild(fallbackText);
    
    fallbackTexture = app.renderer.generateTexture(fallbackGraphics);
    console.log('✅ Fallback texture created');
  } catch (error) {
    console.error('❌ Failed to create fallback texture:', error);
    fallbackTexture = PIXI.Texture.WHITE;
  }
  
  // ==========================================
  // REEL CREATION
  // ==========================================
  
  console.log('🎡 Creating reels...');
  
  for (let reelIndex = 0; reelIndex < reels; reelIndex++) {
    console.log(`🎡 Creating reel ${reelIndex + 1}/${reels}...`);
    
    // Create reel container
    const reelContainer = new PIXI.Container();
    reelContainer.name = `reel-${reelIndex}`;
    reelContainer.sortableChildren = true;
    
    // Position reel
    const reelX = marginX + (reelIndex * (layout.reelWidth + layout.reelGap));
    const reelY = marginY;
    reelContainer.x = reelX;
    reelContainer.y = reelY;
    
    console.log(`📍 Reel ${reelIndex} positioned at (${reelX}, ${reelY})`);
    
    // Create reel background
    const reelBg = new PIXI.Graphics();
    reelBg.name = `reel-bg-${reelIndex}`;
    reelBg.rect(0, 0, layout.reelWidth, layout.reelHeight);
    reelBg.fill(0x2a2a3e); // Dark reel background
    reelBg.stroke({ width: 2, color: 0x4a4a6e }); // Reel border
    reelBg.zIndex = -1;
    reelContainer.addChild(reelBg);
    
    // Add reel to stage and refs
    app.stage.addChild(reelContainer);
    reelContainersRef.current.push(reelContainer);
    
    console.log(`✅ Reel ${reelIndex} container created and added to stage`);
    
    // ==========================================
    // SYMBOL CREATION FOR THIS REEL
    // ==========================================
    
    console.log(`🎯 Creating symbols for reel ${reelIndex}...`);
    
    const reelSymbols: PIXI.Sprite[] = [];
    
    // Create symbols for visible rows + buffer symbols
    const totalSymbols = rows + 8; // Visible + buffer for spinning
    
    for (let symbolIndex = 0; symbolIndex < totalSymbols; symbolIndex++) {
      console.log(`🎯 Creating symbol ${symbolIndex + 1}/${totalSymbols} for reel ${reelIndex}...`);
      
      // Select texture (cycle through available symbols)
      let texture: PIXI.Texture;
      if (symbolImages.length > 0) {
        const imageIndex = (reelIndex + symbolIndex) % symbolImages.length;
        const imageUrl = symbolImages[imageIndex];
        texture = textureCache.get(imageUrl) || fallbackTexture;
        console.log(`🖼️ Using texture for symbol ${reelIndex}-${symbolIndex}: ${imageUrl}`);
      } else {
        texture = fallbackTexture;
        console.log(`🔶 Using fallback texture for symbol ${reelIndex}-${symbolIndex}`);
      }
      
      // Create sprite
      const sprite = new PIXI.Sprite(texture);
      sprite.name = `symbol-${reelIndex}-${symbolIndex}`;
      
      // Set sprite properties for guaranteed visibility
      sprite.visible = true;
      sprite.alpha = 1.0;
      sprite.anchor.set(0.5);
      sprite.tint = 0xFFFFFF;
      sprite.zIndex = 10 + symbolIndex;
      
      // Calculate position within reel
      const symbolX = layout.reelWidth / 2;
      const symbolY = (symbolIndex * (layout.symbolHeight + layout.symbolGap)) + (layout.symbolHeight / 2) + 10;
      sprite.x = symbolX;
      sprite.y = symbolY;
      
      // Scale to fit symbol dimensions
      const scaleX = layout.symbolWidth / texture.width;
      const scaleY = layout.symbolHeight / texture.height;
      const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave padding
      sprite.scale.set(scale);
      
      console.log(`📍 Symbol ${reelIndex}-${symbolIndex} positioned at (${symbolX}, ${symbolY}), scale: ${scale}`);
      
      // Add symbol border for debugging
      const symbolBorder = new PIXI.Graphics();
      symbolBorder.name = `symbol-border-${reelIndex}-${symbolIndex}`;
      symbolBorder.rect(
        symbolX - layout.symbolWidth / 2,
        symbolY - layout.symbolHeight / 2,
        layout.symbolWidth,
        layout.symbolHeight
      );
      symbolBorder.stroke({ width: 1, color: 0x666666, alpha: 0.5 });
      symbolBorder.zIndex = 5;
      reelContainer.addChild(symbolBorder);
      
      // Add sprite to reel
      reelContainer.addChild(sprite);
      reelSymbols.push(sprite);
      
      console.log(`✅ Symbol ${reelIndex}-${symbolIndex} added to reel container`);
      
      // Force render update
      sprite.updateTransform();
    }
    
    // Add reel symbols to refs
    symbolSpritesRef.current.push(reelSymbols);
    
    console.log(`✅ Reel ${reelIndex} completed with ${reelSymbols.length} symbols`);
  }
  
  // ==========================================
  // DEBUG GRID OVERLAY (OPTIONAL)
  // ==========================================
  
  if (process.env.NODE_ENV === 'development' || showDevOverlay) {
    console.log('🔍 Adding debug grid overlay...');
    
    const debugGrid = new PIXI.Graphics();
    debugGrid.name = 'debug-grid';
    debugGrid.zIndex = 1000;
    
    // Draw reel boundaries
    for (let i = 0; i < reels; i++) {
      const x = marginX + (i * (layout.reelWidth + layout.reelGap));
      debugGrid.rect(x, marginY, layout.reelWidth, layout.reelHeight);
      debugGrid.stroke({ width: 1, color: 0x00ff00, alpha: 0.5 });
    }
    
    // Draw symbol grid
    for (let r = 0; r < reels; r++) {
      for (let s = 0; s < rows; s++) {
        const x = marginX + (r * (layout.reelWidth + layout.reelGap)) + (layout.reelWidth - layout.symbolWidth) / 2;
        const y = marginY + (s * (layout.symbolHeight + layout.symbolGap)) + 10;
        debugGrid.rect(x, y, layout.symbolWidth, layout.symbolHeight);
        debugGrid.stroke({ width: 1, color: 0xffff00, alpha: 0.3 });
      }
    }
    
    app.stage.addChild(debugGrid);
    console.log('✅ Debug grid overlay added');
  }
  
  // ==========================================
  // FINAL VALIDATION AND RENDERING
  // ==========================================
  
  console.log('🔍 Final validation...');
  
  // Force stage update
  app.stage.sortableChildren = true;
  app.stage.updateTransform();
  
  // Validate all elements are in stage
  const stageChildren = app.stage.children.length;
  const totalReels = reelContainersRef.current.length;
  const totalSymbols = symbolSpritesRef.current.flat().length;
  
  console.log('📊 Final counts:', {
    stageChildren,
    totalReels,
    totalSymbols,
    expectedReels: reels,
    expectedSymbolsPerReel: rows + 8
  });
  
  // Validation checks
  if (totalReels !== reels) {
    console.error(`❌ CRITICAL: Expected ${reels} reels, got ${totalReels}`);
  } else {
    console.log(`✅ Reel count validation passed: ${totalReels}/${reels}`);
  }
  
  if (totalSymbols !== reels * (rows + 8)) {
    console.error(`❌ CRITICAL: Expected ${reels * (rows + 8)} symbols, got ${totalSymbols}`);
  } else {
    console.log(`✅ Symbol count validation passed: ${totalSymbols}/${reels * (rows + 8)}`);
  }
  
  // Force renderer update
  app.renderer.render(app.stage);
  
  console.log('🎰 === REEL INITIALIZATION COMPLETE ===');
  console.log('🎉 All reels and symbols should now be visible!');
  
  // Optional: Add a visual confirmation
  setTimeout(() => {
    console.log('🔍 Post-initialization check...');
    console.log('📊 Rendered elements:', {
      stage: app.stage.children.length,
      reels: reelContainersRef.current.length,
      symbols: symbolSpritesRef.current.flat().length,
      visible: symbolSpritesRef.current.flat().filter(s => s.visible).length
    });
  }, 100);
  
}, [reels, rows, symbolImages, showDevOverlay]);

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Load symbol textures with robust error handling
 */
const loadSymbolTextures = async (symbolImages: string[]): Promise<void> => {
  console.log('📥 Loading symbol textures...');
  
  const textureCache = symbolTexturesRef.current;
  if (!textureCache) {
    console.error('❌ No texture cache available');
    return;
  }
  
  textureCache.clear();
  
  const loadPromises = symbolImages.map(async (imageUrl, index) => {
    try {
      console.log(`📥 Loading texture ${index + 1}/${symbolImages.length}: ${imageUrl}`);
      const texture = await PIXI.Assets.load(imageUrl);
      textureCache.set(imageUrl, texture);
      console.log(`✅ Texture loaded: ${imageUrl}`);
      return texture;
    } catch (error) {
      console.warn(`⚠️ Failed to load texture ${imageUrl}:`, error);
      
      // Create error placeholder
      const app = pixiAppRef.current;
      if (app) {
        const errorGraphics = new PIXI.Graphics();
        errorGraphics.rect(0, 0, 100, 100);
        errorGraphics.fill(0xff0000);
        errorGraphics.stroke({ width: 2, color: 0xffffff });
        
        const errorText = new PIXI.Text('ERR', {
          fontSize: 20,
          fill: 0xffffff,
          fontWeight: 'bold'
        });
        errorText.anchor.set(0.5);
        errorText.x = 50;
        errorText.y = 50;
        errorGraphics.addChild(errorText);
        
        const errorTexture = app.renderer.generateTexture(errorGraphics);
        textureCache.set(imageUrl, errorTexture);
        return errorTexture;
      }
      
      return PIXI.Texture.WHITE;
    }
  });
  
  await Promise.all(loadPromises);
  console.log(`✅ Texture loading complete: ${textureCache.size}/${symbolImages.length} textures loaded`);
};

/**
 * Get symbol images with validation
 */
const getSymbolImages = (): string[] => {
  // Implementation depends on your symbol source
  // This should return an array of symbol image URLs
  return symbolImages || [];
};

export default initializeReelsAndSymbols;