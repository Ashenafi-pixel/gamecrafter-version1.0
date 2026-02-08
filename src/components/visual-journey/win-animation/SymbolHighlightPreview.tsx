import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Upload, RotateCcw, Play, Save, Sliders } from 'lucide-react';
import { CustomWinHighlightEffect, WinHighlightConfig } from './CustomWinHighlightEffect';

interface SymbolHighlightPreviewProps {
  canvasWidth?: number;
  canvasHeight?: number;
  onConfigSave?: (config: Partial<WinHighlightConfig>) => void;
}

const SymbolHighlightPreview: React.FC<SymbolHighlightPreviewProps> = ({ 
  canvasWidth = 600, 
  canvasHeight = 400,
  onConfigSave
}) => {
  // Container reference for canvas
  const containerRef = useRef<HTMLDivElement>(null);
  
  // PIXI application reference
  const appRef = useRef<PIXI.Application | null>(null);
  
  // Effect reference
  const effectRef = useRef<CustomWinHighlightEffect | null>(null);
  
  // Sample symbols reference
  const symbolsRef = useRef<PIXI.Sprite[]>([]);
  
  // State for configuration
  const [config, setConfig] = useState<Partial<WinHighlightConfig>>({
    particleCount: 12,
    orbitRadius: 60,
    orbitSpeed: 1,
    particleScale: 0.5,
    glowIntensity: 0.8,
    glowColor: 0xFFFFA0,
    showFrame: true,
    frameColor: 0xFFFFFF,
    frameThickness: 3
  });
  
  // State for custom image upload
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  
  // State for active symbol
  const [activeSymbolIndex, setActiveSymbolIndex] = useState<number>(0);
  
  // Initialize PIXI application
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clean up existing app if any
    if (appRef.current) {
      appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
      appRef.current = null;
    }
    
    // Create new PIXI application
    const app = new PIXI.Application({
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 0x1a1a2e,
      resolution: window.devicePixelRatio || 1,
      antialias: true
    });
    
    // Add canvas to container
    if (containerRef.current) {
      containerRef.current.appendChild(app.view as unknown as Node);
      appRef.current = app;
      
      // Set up scene
      setupScene();
    }
    
    // Function to handle resize events (defined to avoid errors with cancelResize)
    const cancelResize = () => {
      // This is a dummy function to prevent errors
      // If we had actual resize event handling, cleanup would happen here
    };
    
    // Clean up on unmount
    return () => {
      cancelResize();
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
    };
  }, [canvasWidth, canvasHeight]);
  
  // Update effect when config changes
  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.updateConfig(config);
    }
  }, [config]);
  
  // Set up scene with sample symbols
  const setupScene = () => {
    if (!appRef.current) return;
    
    const app = appRef.current;
    
    // Create container for slot grid
    const gridContainer = new PIXI.Container();
    app.stage.addChild(gridContainer);
    
    // Center the grid
    gridContainer.x = canvasWidth / 2 - 150;
    gridContainer.y = canvasHeight / 2 - 150;
    
    // Create sample symbols (3x3 grid)
    const symbols: PIXI.Sprite[] = [];
    const symbolTypes = ['A', 'K', 'Q', 'J', '10', '9'];
    const symbolColors = [0xFF5252, 0xFFEB3B, 0x4CAF50, 0x2196F3, 0x9C27B0, 0xFF9800];
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        // Create a symbol sprite
        const symbolIndex = (row * 3 + col) % symbolTypes.length;
        const symbol = createSymbolSprite(
          symbolTypes[symbolIndex], 
          symbolColors[symbolIndex]
        );
        
        // Position the symbol
        symbol.x = col * 100;
        symbol.y = row * 100;
        
        // Add to grid and array
        gridContainer.addChild(symbol);
        symbols.push(symbol);
      }
    }
    
    // Store symbols reference
    symbolsRef.current = symbols;
    
    // Create and apply highlight effect to the center symbol
    createHighlightEffect(symbols[activeSymbolIndex]);
    
    // Start animation loop
    app.ticker.add((delta) => {
      if (effectRef.current) {
        effectRef.current.update(delta);
      }
    });
  };
  
  // Create a simple symbol sprite
  const createSymbolSprite = (text: string, color: number): PIXI.Sprite => {
    // Create a graphic for the symbol background
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x666666);
    graphics.drawRect(0, 0, 80, 80);
    graphics.endFill();
    
    // Add text
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 36,
      fontWeight: 'bold',
      fill: color
    });
    
    const textSprite = new PIXI.Text(text, style);
    textSprite.x = 40 - textSprite.width / 2;
    textSprite.y = 40 - textSprite.height / 2;
    graphics.addChild(textSprite);
    
    // Create a texture from the graphics object
    const texture = appRef.current!.renderer.generateTexture(graphics);
    const sprite = new PIXI.Sprite(texture);
    
    return sprite;
  };
  
  // Create highlight effect
  const createHighlightEffect = (symbol: PIXI.Sprite) => {
    // Remove existing effect if any
    if (effectRef.current) {
      effectRef.current.remove();
    }
    
    // Create texture for particles
    let effectTexture: PIXI.Texture;
    
    if (customImageUrl) {
      // Use custom image if available
      effectTexture = PIXI.Texture.from(customImageUrl);
    } else {
      // Create a default star shape
      const starGraphics = new PIXI.Graphics();
      starGraphics.beginFill(0xFFFFFF);
      
      // Draw a star shape
      const startX = 0;
      const startY = 0;
      const spikes = 5;
      const outerRadius = 10;
      const innerRadius = 4;
      
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = Math.PI / spikes * i;
        const x = startX + Math.cos(angle) * radius;
        const y = startY + Math.sin(angle) * radius;
        
        if (i === 0) {
          starGraphics.moveTo(x, y);
        } else {
          starGraphics.lineTo(x, y);
        }
      }
      
      starGraphics.closePath();
      starGraphics.endFill();
      
      // Generate texture
      effectTexture = appRef.current!.renderer.generateTexture(starGraphics);
    }
    
    // Create configuration
    const effectConfig: WinHighlightConfig = {
      symbol,
      effectTexture,
      ...config
    };
    
    // Create highlight effect
    const highlightEffect = new CustomWinHighlightEffect(effectConfig);
    effectRef.current = highlightEffect;
    
    // Apply effect
    highlightEffect.applyTo(symbol);
  };
  
  // Handle custom image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Create URL for the file
    const url = URL.createObjectURL(file);
    setCustomImageUrl(url);
    
    // Load texture and update effect
    const texture = PIXI.Texture.from(url);
    texture.on('update', () => {
      if (effectRef.current) {
        effectRef.current.setTexture(texture);
      }
    });
  };
  
  // Reset highlight effect
  const resetEffect = () => {
    setCustomImageUrl(null);
    setConfig({
      particleCount: 12,
      orbitRadius: 60,
      orbitSpeed: 1,
      particleScale: 0.5,
      glowIntensity: 0.8,
      glowColor: 0xFFFFA0,
      showFrame: true,
      frameColor: 0xFFFFFF,
      frameThickness: 3
    });
    
    // Recreate default effect
    if (symbolsRef.current[activeSymbolIndex]) {
      createHighlightEffect(symbolsRef.current[activeSymbolIndex]);
    }
  };
  
  // Apply highlight to a different symbol
  const applyToNextSymbol = () => {
    if (!symbolsRef.current || symbolsRef.current.length === 0) return;
    
    // Remove current effect
    if (effectRef.current) {
      effectRef.current.remove();
    }
    
    // Calculate next index
    const nextIndex = (activeSymbolIndex + 1) % symbolsRef.current.length;
    setActiveSymbolIndex(nextIndex);
    
    // Apply to next symbol
    createHighlightEffect(symbolsRef.current[nextIndex]);
  };
  
  // Save configuration
  const saveConfig = () => {
    if (onConfigSave) {
      onConfigSave(config);
    }
    
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow z-50';
    toast.innerHTML = 'Symbol highlight configuration saved!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };
  
  // Convert hex string to number
  const hexToNumber = (hex: string): number => {
    return parseInt(hex.replace('#', ''), 16);
  };
  
  // Convert number to hex string
  const numberToHex = (num: number): string => {
    return '#' + num.toString(16).padStart(6, '0');
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      <h3 className="text-xl font-bold mb-4">Symbol Highlight Effect Editor</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas preview area */}
        <div className="lg:col-span-7">
          <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            <div ref={containerRef} className="w-full aspect-video"></div>
            
            <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-between">
              <div className="flex gap-2">
                <button
                  onClick={applyToNextSymbol}
                  className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                >
                  <Play className="w-4 h-4" />
                  Test on Next Symbol
                </button>
                
                <button
                  onClick={resetEffect}
                  className="px-3 py-1 rounded text-sm bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
              
              <button
                onClick={saveConfig}
                className="px-3 py-1 rounded text-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          </div>
        </div>
        
        {/* Controls area */}
        <div className="lg:col-span-5">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-bold mb-3 flex items-center">
              <Sliders className="w-4 h-4 mr-2" />
              Effect Settings
            </h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Custom Particle Image</label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center gap-2 p-2 border border-gray-600 rounded bg-gray-800 hover:bg-gray-700 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">{customImageUrl ? 'Change Image' : 'Upload Image'}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </label>
                
                {customImageUrl && (
                  <div className="w-10 h-10 border border-gray-600 rounded overflow-hidden">
                    <img 
                      src={customImageUrl} 
                      alt="Custom particle" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Particle Count: {config.particleCount}
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="30" 
                  step="1"
                  value={config.particleCount} 
                  onChange={(e) => setConfig({...config, particleCount: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Orbit Radius: {config.orbitRadius}px
                </label>
                <input 
                  type="range" 
                  min="20" 
                  max="100" 
                  step="1"
                  value={config.orbitRadius} 
                  onChange={(e) => setConfig({...config, orbitRadius: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Orbit Speed: {config.orbitSpeed?.toFixed(1)}
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="3" 
                  step="0.1"
                  value={config.orbitSpeed} 
                  onChange={(e) => setConfig({...config, orbitSpeed: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Particle Size: {config.particleScale?.toFixed(1)}
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="2" 
                  step="0.1"
                  value={config.particleScale} 
                  onChange={(e) => setConfig({...config, particleScale: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Glow Intensity: {config.glowIntensity?.toFixed(1)}
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.1"
                  value={config.glowIntensity} 
                  onChange={(e) => setConfig({...config, glowIntensity: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Glow Color</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={numberToHex(config.glowColor || 0xFFFFA0)} 
                    onChange={(e) => setConfig({...config, glowColor: hexToNumber(e.target.value)})}
                    className="h-8 w-8 rounded border border-gray-700"
                  />
                  <input 
                    type="text" 
                    value={numberToHex(config.glowColor || 0xFFFFA0)} 
                    onChange={(e) => setConfig({...config, glowColor: hexToNumber(e.target.value)})}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-24"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center text-sm mb-2">
                  <input 
                    type="checkbox" 
                    checked={config.showFrame} 
                    onChange={(e) => setConfig({...config, showFrame: e.target.checked})}
                    className="mr-2"
                  />
                  Show Frame
                </label>
                
                {config.showFrame && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Frame Color</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={numberToHex(config.frameColor || 0xFFFFFF)} 
                          onChange={(e) => setConfig({...config, frameColor: hexToNumber(e.target.value)})}
                          className="h-6 w-6 rounded border border-gray-700"
                        />
                        <input 
                          type="text" 
                          value={numberToHex(config.frameColor || 0xFFFFFF)} 
                          onChange={(e) => setConfig({...config, frameColor: hexToNumber(e.target.value)})}
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs w-20"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Frame Thickness: {config.frameThickness}px
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1"
                        value={config.frameThickness} 
                        onChange={(e) => setConfig({...config, frameThickness: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        <p>
          This editor allows you to create custom highlight effects for winning symbols, similar to the star/comet effects 
          seen in popular slot games like Wolf Gold. Upload your own particle image or use the default star shape, 
          then adjust the parameters to create your desired effect.
        </p>
      </div>
    </div>
  );
};

export default SymbolHighlightPreview;