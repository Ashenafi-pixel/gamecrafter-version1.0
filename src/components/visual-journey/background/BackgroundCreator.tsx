import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../store';
import { 
  Image, 
  CloudLightning, 
  CloudSnow, 
  Sparkles, 
  Sun,
  Moon,
  Clock,
  Droplets,
  Wind,
  Palette,
  Fire,
  Check,
  Camera,
  Upload,
  Download,
  AlertTriangle
} from 'lucide-react';

// Dynamic import for PIXI.js - will be set in useEffect
// IMPORTANT: Avoid direct constructor calls with PIXI classes to prevent compatibility issues
let PIXI: any;

// Define an interface for extracted elements
interface ExtractedElement {
  id: string;
  name: string;
  imageUrl: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  animation: 'none' | 'float' | 'rotate' | 'pulse' | 'bounce';
}

// Define types for background configuration
interface BackgroundConfig {
  type: 'static' | 'animated';
  style: 'nature' | 'space' | 'abstract' | 'fantasy' | 'urban' | 'custom';
  color: string;
  secondaryColor?: string;
  gradientType?: 'linear' | 'radial';
  gradientDirection?: 'top-to-bottom' | 'left-to-right' | 'diagonal';
  backgroundImage?: string;
  generationPrompt?: string;
  isGenerating?: boolean;
  isExtracting?: boolean;
  extractedElements?: ExtractedElement[];
  effects?: {
    particles?: boolean;
    particleColor?: string;
    particleCount?: number;
    particleSpeed?: number;
    lightning?: boolean;
    lightningFrequency?: number;
    rain?: boolean;
    rainIntensity?: number;
    snow?: boolean;
    snowIntensity?: number;
    stars?: boolean;
    starCount?: number;
    clouds?: boolean;
    cloudCount?: number;
    dayNightCycle?: boolean;
    cycleLength?: number;
  };
  customSettings?: Record<string, any>;
}

// Preset background configurations
const BACKGROUND_PRESETS: Record<string, Partial<BackgroundConfig>> = {
  nature: {
    type: 'animated',
    style: 'nature',
    color: '#8BC34A',
    secondaryColor: '#2E7D32',
    gradientType: 'linear',
    gradientDirection: 'top-to-bottom',
    effects: {
      particles: true,
      particleColor: '#FFFFFF',
      particleCount: 50,
      clouds: true,
      cloudCount: 3,
    }
  },
  space: {
    type: 'animated',
    style: 'space',
    color: '#000000',
    secondaryColor: '#212121',
    gradientType: 'radial',
    effects: {
      stars: true,
      starCount: 100,
      particles: true,
      particleColor: '#4FC3F7',
      particleCount: 20,
    }
  },
  abstract: {
    type: 'animated',
    style: 'abstract',
    color: '#673AB7',
    secondaryColor: '#3F51B5',
    gradientType: 'linear',
    gradientDirection: 'diagonal',
    effects: {
      particles: true,
      particleColor: '#F5F5F5',
      particleCount: 30,
    }
  },
  fantasy: {
    type: 'animated',
    style: 'fantasy',
    color: '#9C27B0',
    secondaryColor: '#4A148C',
    gradientType: 'linear',
    gradientDirection: 'top-to-bottom',
    effects: {
      particles: true,
      particleColor: '#FFD54F',
      particleCount: 40,
      lightning: true,
      lightningFrequency: 5,
    }
  },
  urban: {
    type: 'static',
    style: 'urban',
    color: '#263238',
    secondaryColor: '#37474F',
    gradientType: 'linear',
    gradientDirection: 'left-to-right',
    effects: {
      rain: true,
      rainIntensity: 3,
    }
  },
};

// CSS gradient classes for the preview thumbnails
const GRADIENT_CLASSES: Record<string, string> = {
  nature: 'from-green-400 to-green-800',
  space: 'from-gray-900 to-black',
  abstract: 'from-purple-500 to-blue-500',
  fantasy: 'from-purple-600 to-purple-900',
  urban: 'from-gray-700 to-gray-800',
};

// BackgroundCreator component
const BackgroundCreator: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixiAppRef = useRef<any | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // State for PIXI.js initialization and error handling
  const [pixiInitialized, setPixiInitialized] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Initialize background config from store or use default
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>(
    config.background || {
      type: 'animated',
      style: 'nature',
      color: '#8BC34A',
      secondaryColor: '#2E7D32',
      gradientType: 'linear',
      gradientDirection: 'top-to-bottom',
      effects: {
        particles: true,
        particleColor: '#FFFFFF',
        particleCount: 50,
        clouds: true,
        cloudCount: 3,
      }
    }
  );
  
  // Selected preset
  const [selectedPreset, setSelectedPreset] = useState<string>(backgroundConfig.style || 'nature');
  
  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 480 });
  
  // Particles container for animations
  const particlesContainerRef = useRef<any | null>(null);
  
  // Initialize PIXI.js library
  useEffect(() => {
    // Dynamically import PIXI only on client-side
    const loadPixi = async () => {
      try {
        if (typeof window !== 'undefined') {
          const pixiModule = await import('pixi.js');
          PIXI = pixiModule;
          setPixiInitialized(true);
        }
      } catch (error) {
        console.error("Failed to load PIXI.js:", error);
        setErrorMessage("Failed to load animation library. Please try refreshing the page.");
      }
    };
    
    loadPixi();
    
    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (pixiAppRef.current) {
        try {
          pixiAppRef.current.destroy(true);
        } catch (error) {
          console.error("Error destroying PIXI application:", error);
        }
      }
    };
  }, []);
  
  // Initialize PixiJS application once PIXI is loaded
  useEffect(() => {
    if (!pixiInitialized || !canvasRef.current) return;
    
    try {
      // Clean up any existing PIXI app
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true);
      }
      
      // Create new PIXI application
      pixiAppRef.current = new PIXI.Application({
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundColor: parseInt(backgroundConfig.color.replace('#', '0x')),
        antialias: true,
        view: canvasRef.current,
        resolution: window.devicePixelRatio || 1,
      });
      
      // Create particles container
      particlesContainerRef.current = new PIXI.Container();
      pixiAppRef.current.stage.addChild(particlesContainerRef.current);
      
      // Pre-load any generated symbol textures if they'll be used for particles
      const generatedSymbols = config?.theme?.generated?.symbols || [];
      if (generatedSymbols.length > 0 && backgroundConfig.effects?.particles) {
        // Preload a few symbols for particles
        for (let i = 0; i < Math.min(generatedSymbols.length, 3); i++) {
          try {
            PIXI.Texture.from(generatedSymbols[i]);
          } catch (error) {
            console.error("Error pre-loading symbol texture:", error);
          }
        }
      }
      
      // Add background content
      renderBackground();
      
      // Start animation loop if background is animated
      if (backgroundConfig.type === 'animated') {
        startAnimationLoop();
      }
    } catch (error) {
      console.error("Error initializing PIXI application:", error);
      setErrorMessage("Failed to initialize the background renderer. Please try refreshing the page.");
    }
  }, [pixiInitialized, canvasRef, canvasSize, backgroundConfig.color, config?.theme?.generated?.symbols]);
  
  // Update background when config changes
  useEffect(() => {
    if (!pixiInitialized) return;
    
    try {
      renderBackground();
      
      // Save to global config whenever background config changes
      updateConfig({
        background: backgroundConfig
      });
      
      // Restart animation if config changes
      if (backgroundConfig.type === 'animated') {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        startAnimationLoop();
      }
    } catch (error) {
      console.error("Error updating background:", error);
      
      // Try to recover by restarting the animation or reinitializing
      try {
        if (backgroundConfig.type === 'animated') {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          
          if (particlesContainerRef.current) {
            particlesContainerRef.current.removeChildren();
          }
          
          startAnimationLoop();
        }
      } catch (secondaryError) {
        console.error("Failed to recover after background error:", secondaryError);
      }
    }
  }, [backgroundConfig, pixiInitialized, config?.theme?.generated?.symbols]);
  
  // Function to render the background
  const renderBackground = () => {
    if (!pixiInitialized || !pixiAppRef.current) return;
    
    try {
      // Clear previous content except particles container
      pixiAppRef.current.stage.children.forEach((child: any) => {
        if (child !== particlesContainerRef.current) {
          pixiAppRef.current?.stage.removeChild(child);
        }
      });
      
      // Create background container
      const backgroundContainer = new PIXI.Container();
      pixiAppRef.current.stage.addChildAt(backgroundContainer, 0);
      
      // Create a symbol grid container (will be on top of background)
      const symbolGridContainer = new PIXI.Container();
      
      // Check if we have a generated/custom background image
      if (backgroundConfig.backgroundImage) {
        try {
          // Create a new sprite with the background image
          const texture = PIXI.Texture.from(backgroundConfig.backgroundImage);
          const backgroundSprite = new PIXI.Sprite(texture);
          
          // Scale to fit the canvas
          backgroundSprite.width = canvasSize.width;
          backgroundSprite.height = canvasSize.height;
          
          // Add to background container
          backgroundContainer.addChild(backgroundSprite);
          
          // If we have extracted elements, render them on top
          if (backgroundConfig.extractedElements && backgroundConfig.extractedElements.length > 0) {
            renderExtractedElements();
          }
          
          // Add additional effects from the theme style if needed
          if (backgroundConfig.effects?.particles) {
            setupParticles();
          } else if (particlesContainerRef.current) {
            particlesContainerRef.current.removeChildren();
          }
        } catch (error) {
          console.error("Error loading background image:", error);
          // Fall back to the standard rendering if image load fails
          useStandardBackgroundRendering(backgroundContainer);
        }
      } else {
        // If no background image, use standard rendering
        useStandardBackgroundRendering(backgroundContainer);
      }
      
      // Add the symbol grid on top of the background
      renderSymbolGrid(symbolGridContainer);
      pixiAppRef.current.stage.addChild(symbolGridContainer);
      
      // Set up particles if enabled (always on top)
      if (backgroundConfig.effects?.particles) {
        setupParticles();
      } else if (particlesContainerRef.current) {
        particlesContainerRef.current.removeChildren();
      }
    } catch (error) {
      console.error("Error rendering background:", error);
      setErrorMessage("Failed to render background elements. Please try a different style.");
    }
  };
  
  // Helper function for standard background rendering
  const useStandardBackgroundRendering = (backgroundContainer: any) => {
    // Background gradient
    if (backgroundConfig.secondaryColor && pixiAppRef.current?.renderer?.background) {
      // For now, we'll simulate a gradient with a simple color
      pixiAppRef.current.renderer.background.color = parseInt(backgroundConfig.color.replace('#', '0x'));
    } else if (pixiAppRef.current?.renderer?.background) {
      pixiAppRef.current.renderer.background.color = parseInt(backgroundConfig.color.replace('#', '0x'));
    }
    
    // Add specific elements based on style
    switch (backgroundConfig.style) {
      case 'nature':
        addNatureElements(backgroundContainer);
        break;
      case 'space':
        addSpaceElements(backgroundContainer);
        break;
      case 'fantasy':
        addFantasyElements(backgroundContainer);
        break;
      case 'urban':
        addUrbanElements(backgroundContainer);
        break;
      case 'abstract':
        addAbstractElements(backgroundContainer);
        break;
    }
  };
  
  // Render a transparent symbol grid with the game's symbols
  const renderSymbolGrid = (container: any) => {
    if (!pixiInitialized || !PIXI) return;
    
    try {
      // Define grid dimensions - standard 5x3 slot grid
      const gridWidth = canvasSize.width * 0.8;
      const gridHeight = canvasSize.height * 0.6;
      const gridX = (canvasSize.width - gridWidth) / 2;
      const gridY = canvasSize.height * 0.2;
      const cols = 5;
      const rows = 3;
      
      // Create a transparent container for the symbol grid
      const gridBackground = new PIXI.Graphics();
      gridBackground.beginFill(0x000000, 0.15); // Very transparent black background
      gridBackground.drawRoundedRect(gridX, gridY, gridWidth, gridHeight, 12);
      gridBackground.endFill();
      
      // Add a subtle border
      gridBackground.lineStyle(2, 0xFFFFFF, 0.3);
      gridBackground.drawRoundedRect(gridX, gridY, gridWidth, gridHeight, 12);
      container.addChild(gridBackground);
      
      // Get symbols from the store
      const generatedSymbols = config?.theme?.generated?.symbols || [];
      const hasGeneratedSymbols = generatedSymbols.length > 0;
      
      // Calculate cell dimensions
      const cellWidth = gridWidth / cols;
      const cellHeight = gridHeight / rows;
      
      // Fallback symbol colors if no generated symbols are available
      const symbolColors = [
        0xFF5252, // Red
        0xFFD740, // Yellow
        0x69F0AE, // Green
        0x448AFF, // Blue
        0xE040FB, // Purple
      ];
      
      // Draw grid cells and symbols
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = gridX + col * cellWidth + cellWidth / 2;
          const y = gridY + row * cellHeight + cellHeight / 2;
          const size = Math.min(cellWidth, cellHeight) * 0.85; // Slightly larger than before
          
          // Draw subtle cell highlight
          const cell = new PIXI.Graphics();
          cell.beginFill(0xFFFFFF, 0.05);
          cell.drawRect(gridX + col * cellWidth, gridY + row * cellHeight, cellWidth, cellHeight);
          cell.endFill();
          container.addChild(cell);
          
          // Add a symbol
          if (hasGeneratedSymbols) {
            // Select a random symbol with higher probability for different rows
            // Top row favors high-value symbols, bottom row favors low-value symbols
            let symbolIndex;
            if (row === 0) {
              // Top row - higher chance of high-value symbols
              symbolIndex = Math.floor(Math.random() * Math.min(3, generatedSymbols.length));
            } else if (row === 2) {
              // Bottom row - higher chance of low-value symbols
              const offset = Math.max(0, generatedSymbols.length - 5);
              symbolIndex = offset + Math.floor(Math.random() * Math.min(5, generatedSymbols.length - offset));
            } else {
              // Middle row - random selection
              symbolIndex = Math.floor(Math.random() * generatedSymbols.length);
            }
            
            try {
              const texture = PIXI.Texture.from(generatedSymbols[symbolIndex]);
              const sprite = new PIXI.Sprite(texture);
              
              // Center the sprite
              sprite.anchor.set(0.5);
              sprite.x = x;
              sprite.y = y;
              
              // Scale the sprite to fit the cell
              sprite.width = size;
              sprite.height = size;
              
              // Add a slight shadow for better visibility
              if (PIXI.filters && PIXI.filters.DropShadowFilter) {
                try {
                  sprite.filters = [new PIXI.filters.DropShadowFilter({
                    distance: 5,
                    alpha: 0.3,
                    blur: 2,
                    quality: 3
                  })];
                } catch (error) {
                  console.error("Error applying shadow filter:", error);
                }
              }
              
              container.addChild(sprite);
              
              // Add a subtle animation to make the symbol stand out
              if (pixiAppRef.current?.ticker) {
                let time = 0;
                
                const animate = (delta: number) => {
                  time += delta * 0.01;
                  
                  // Very subtle floating animation
                  sprite.y = y + Math.sin(time + col) * 2;
                  
                  // Very subtle pulsing scale
                  const scale = 1 + Math.sin(time + row) * 0.02;
                  sprite.scale.set(scale);
                };
                
                pixiAppRef.current.ticker.add(animate);
              }
            } catch (error) {
              console.error("Error creating symbol sprite:", error);
              createBasicSymbol(container, x, y, size, symbolColors[Math.floor(Math.random() * symbolColors.length)]);
            }
          } else {
            // Create a basic shape as fallback
            createBasicSymbol(container, x, y, size, symbolColors[Math.floor(Math.random() * symbolColors.length)]);
          }
        }
      }
      
      // Draw grid lines
      const gridLines = new PIXI.Graphics();
      gridLines.lineStyle(1, 0xFFFFFF, 0.2);
      
      // Vertical grid lines
      for (let i = 1; i < cols; i++) {
        gridLines.moveTo(gridX + i * cellWidth, gridY);
        gridLines.lineTo(gridX + i * cellWidth, gridY + gridHeight);
      }
      
      // Horizontal grid lines
      for (let i = 1; i < rows; i++) {
        gridLines.moveTo(gridX, gridY + i * cellHeight);
        gridLines.lineTo(gridX + gridWidth, gridY + i * cellHeight);
      }
      
      container.addChild(gridLines);
    } catch (error) {
      console.error("Error rendering symbol grid:", error);
    }
  };
  
  // Helper to create a basic symbol shape
  const createBasicSymbol = (container: any, x: number, y: number, size: number, color: number) => {
    try {
      const symbol = new PIXI.Graphics();
      symbol.beginFill(color, 0.8);
      
      // Randomly choose between various symbol shapes
      const shapeType = Math.floor(Math.random() * 4);
      
      switch (shapeType) {
        case 0: // Circle
          symbol.drawCircle(0, 0, size / 2);
          break;
        case 1: // Square
          symbol.drawRoundedRect(-size/2, -size/2, size, size, size * 0.2);
          break;
        case 2: // Diamond
          symbol.moveTo(0, -size/2);
          symbol.lineTo(size/2, 0);
          symbol.lineTo(0, size/2);
          symbol.lineTo(-size/2, 0);
          symbol.lineTo(0, -size/2);
          break;
        case 3: // Star
          const points = 5;
          const innerRadius = size * 0.25;
          const outerRadius = size * 0.5;
          
          for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * 2 * i) / (points * 2) - Math.PI / 2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            
            if (i === 0) {
              symbol.moveTo(x, y);
            } else {
              symbol.lineTo(x, y);
            }
          }
          symbol.closePath();
          break;
      }
      
      symbol.endFill();
      symbol.position.set(x, y);
      container.addChild(symbol);
    } catch (error) {
      console.error("Error creating basic symbol:", error);
    }
  };
  
  // Render extracted elements from AI-generated background
  const renderExtractedElements = () => {
    if (!pixiInitialized || !pixiAppRef.current || !backgroundConfig.extractedElements) return;
    
    try {
      // Create a container for extracted elements
      const elementsContainer = new PIXI.Container();
      pixiAppRef.current.stage.addChild(elementsContainer);
      
      // Add each extracted element as a sprite
      backgroundConfig.extractedElements.forEach(element => {
        try {
          // Load the element texture
          const texture = PIXI.Texture.from(element.imageUrl);
          const sprite = new PIXI.Sprite(texture);
          
          // Position and size
          sprite.x = element.position.x;
          sprite.y = element.position.y;
          sprite.width = element.size.width;
          sprite.height = element.size.height;
          
          // Center anchor for rotation animations
          sprite.anchor.set(0.5);
          
          // Add to container
          elementsContainer.addChild(sprite);
          
          // Apply animations based on type
          if (element.animation !== 'none' && pixiAppRef.current?.ticker) {
            let time = 0;
            
            const animate = (delta: number) => {
              time += delta * 0.01;
              
              switch (element.animation) {
                case 'float':
                  // Gentle floating motion
                  sprite.y = element.position.y + Math.sin(time) * 10;
                  break;
                  
                case 'rotate':
                  // Slow rotation
                  sprite.rotation = time * 0.2;
                  break;
                  
                case 'pulse':
                  // Scale pulsing
                  const scale = 1 + Math.sin(time) * 0.1;
                  sprite.scale.set(scale);
                  break;
                  
                case 'bounce':
                  // Bouncing motion
                  sprite.y = element.position.y + Math.abs(Math.sin(time) * 15);
                  break;
              }
            };
            
            pixiAppRef.current.ticker.add(animate);
          }
        } catch (error) {
          console.error("Error rendering extracted element:", error);
        }
      });
    } catch (error) {
      console.error("Error rendering extracted elements:", error);
    }
  };
  
  // Animation loop
  const startAnimationLoop = () => {
    if (!pixiInitialized || !pixiAppRef.current) return;
    
    try {
      let time = 0;
      
      const animate = () => {
        time += 0.01;
        
        try {
          // Animate particles
          if (particlesContainerRef.current && backgroundConfig.effects?.particles) {
            particlesContainerRef.current.children.forEach((particle: any, i: number) => {
              // Simple floating movement
              particle.y -= (backgroundConfig.effects?.particleSpeed || 1) * 0.2;
              particle.x += Math.sin(time + i * 0.1) * 0.3;
              
              // Reset particle position when it goes out of bounds
              if (particle.y < -10) {
                particle.y = canvasSize.height + 10;
                particle.x = Math.random() * canvasSize.width;
              }
              
              // Fade particles in and out
              particle.alpha = 0.5 + Math.sin(time + i) * 0.5;
            });
          }
          
          // Animate lightning if enabled
          if (backgroundConfig.effects?.lightning) {
            // Random lightning flashes
            if (Math.random() < 0.005 * (backgroundConfig.effects.lightningFrequency || 1)) {
              createLightningFlash();
            }
          }
          
          // Continue animation loop
          animationFrameRef.current = requestAnimationFrame(animate);
        } catch (error) {
          console.error("Error in animation loop:", error);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        }
      };
      
      animate();
    } catch (error) {
      console.error("Error starting animation loop:", error);
    }
  };
  
  // Set up particles
  const setupParticles = () => {
    if (!pixiInitialized || !particlesContainerRef.current) return;
    
    try {
      // Clear existing particles
      particlesContainerRef.current.removeChildren();
      
      // Create new particles
      const count = backgroundConfig.effects?.particleCount || 50;
      const color = backgroundConfig.effects?.particleColor || '#FFFFFF';
      const colorInt = parseInt(color.replace('#', '0x'));
      
      // Check if we have generated symbols to use
      const generatedSymbols = config?.theme?.generated?.symbols || [];
      const useGeneratedSymbols = generatedSymbols.length > 0 && backgroundConfig.style !== 'abstract';
      
      for (let i = 0; i < count; i++) {
        // Decide whether to use a generated symbol or basic shape
        const useSymbol = useGeneratedSymbols && Math.random() > 0.7;
        
        if (useSymbol) {
          try {
            // Use a small version of a symbol as a particle
            const symbolIndex = Math.floor(Math.random() * generatedSymbols.length);
            const texture = PIXI.Texture.from(generatedSymbols[symbolIndex]);
            const sprite = new PIXI.Sprite(texture);
            
            // Make it small and semi-transparent
            const size = Math.random() * 10 + 5;
            sprite.width = size;
            sprite.height = size;
            sprite.alpha = Math.random() * 0.5 + 0.3;
            
            // Random position
            sprite.x = Math.random() * canvasSize.width;
            sprite.y = Math.random() * canvasSize.height;
            
            // Center anchor point for rotation
            sprite.anchor.set(0.5);
            
            particlesContainerRef.current.addChild(sprite);
          } catch (error) {
            console.error("Error creating symbol particle:", error);
            // Fall back to basic particle
            createBasicParticle(i, colorInt);
          }
        } else {
          createBasicParticle(i, colorInt);
        }
      }
    } catch (error) {
      console.error("Error setting up particles:", error);
    }
  };
  
  // Helper to create a basic particle
  const createBasicParticle = (index: number, colorInt: number) => {
    if (!particlesContainerRef.current) return;
    
    try {
      const particle = new PIXI.Graphics();
      particle.beginFill(colorInt);
      
      // Random particle size between 2 and 5
      const size = Math.random() * 3 + 2;
      
      // Different shapes based on background style
      if (backgroundConfig.style === 'abstract' && Math.random() > 0.5) {
        // Square or rectangle for abstract style
        const width = size * (Math.random() > 0.5 ? 1 : 2);
        const height = size * (Math.random() > 0.5 ? 1 : 2);
        particle.drawRect(-width/2, -height/2, width, height);
      } else {
        // Circle for other styles
        particle.drawCircle(0, 0, size);
      }
      
      particle.endFill();
      
      // Random position
      particle.x = Math.random() * canvasSize.width;
      particle.y = Math.random() * canvasSize.height;
      
      // Random alpha
      particle.alpha = Math.random() * 0.5 + 0.5;
      
      particlesContainerRef.current.addChild(particle);
    } catch (error) {
      console.error("Error creating basic particle:", error);
    }
  };
  
  // Add nature-themed elements
  const addNatureElements = (container: any) => {
    if (!pixiInitialized) return;
    
    try {
      // Add hills or mountains at the bottom
      const hills = new PIXI.Graphics();
      hills.beginFill(parseInt(backgroundConfig.secondaryColor?.replace('#', '0x') || '0x2E7D32'));
      
      // Draw a wavy hill line
      const baseY = canvasSize.height - 100;
      hills.moveTo(0, baseY + 50);
      
      // Create wavy pattern for hills
      for (let x = 0; x <= canvasSize.width; x += 20) {
        const y = baseY + Math.sin(x * 0.02) * 20;
        hills.lineTo(x, y);
      }
      
      // Complete the shape
      hills.lineTo(canvasSize.width, canvasSize.height);
      hills.lineTo(0, canvasSize.height);
      hills.lineTo(0, baseY + 50);
      hills.endFill();
      
      container.addChild(hills);
      
      // Add clouds if enabled
      if (backgroundConfig.effects?.clouds) {
        const cloudCount = backgroundConfig.effects.cloudCount || 3;
        
        for (let i = 0; i < cloudCount; i++) {
          const cloud = new PIXI.Graphics();
          cloud.beginFill(0xFFFFFF, 0.8);
          
          // Draw a simple cloud shape with multiple circles
          const cloudX = Math.random() * canvasSize.width;
          const cloudY = Math.random() * 150 + 50;
          const cloudSize = Math.random() * 30 + 20;
          
          cloud.drawCircle(0, 0, cloudSize);
          cloud.drawCircle(cloudSize * 0.7, -cloudSize * 0.2, cloudSize * 0.7);
          cloud.drawCircle(-cloudSize * 0.7, -cloudSize * 0.2, cloudSize * 0.6);
          cloud.drawCircle(cloudSize * 1.2, cloudSize * 0.2, cloudSize * 0.5);
          cloud.drawCircle(-cloudSize * 1.0, cloudSize * 0.2, cloudSize * 0.6);
          
          cloud.endFill();
          cloud.x = cloudX;
          cloud.y = cloudY;
          
          container.addChild(cloud);
        }
      }
    } catch (error) {
      console.error("Error adding nature elements:", error);
    }
  };
  
  // Add space-themed elements
  const addSpaceElements = (container: any) => {
    if (!pixiInitialized) return;
    
    try {
      // Add stars if enabled
      if (backgroundConfig.effects?.stars) {
        const starCount = backgroundConfig.effects.starCount || 100;
        
        for (let i = 0; i < starCount; i++) {
          const star = new PIXI.Graphics();
          star.beginFill(0xFFFFFF);
          
          // Different star sizes
          const size = Math.random() * 2 + 1;
          star.drawCircle(0, 0, size);
          star.endFill();
          
          // Random position
          star.x = Math.random() * canvasSize.width;
          star.y = Math.random() * canvasSize.height;
          
          // Vary the alpha for twinkling effect
          star.alpha = Math.random() * 0.5 + 0.5;
          
          container.addChild(star);
        }
      }
      
      // Add a nebula effect (subtle colored area)
      const nebula = new PIXI.Graphics();
      nebula.beginFill(parseInt(backgroundConfig.secondaryColor?.replace('#', '0x') || '0x3F51B5'), 0.3);
      
      // Create an organic shape
      const cx = canvasSize.width * 0.7;
      const cy = canvasSize.height * 0.3;
      const radius = Math.min(canvasSize.width, canvasSize.height) * 0.4;
      
      nebula.drawCircle(cx, cy, radius);
      nebula.endFill();
      
      // Apply a blur filter for a soft effect
      if (PIXI.filters && PIXI.filters.BlurFilter) {
        try {
          nebula.filters = [new PIXI.filters.BlurFilter(30)];
        } catch (error) {
          console.error("Error applying blur filter to nebula:", error);
          // Continue without the filter
        }
      }
      
      container.addChild(nebula);
    } catch (error) {
      console.error("Error adding space elements:", error);
    }
  };
  
  // Add fantasy-themed elements
  const addFantasyElements = (container: any) => {
    if (!pixiInitialized) return;
    
    try {
      // Add magical swirls
      const swirl = new PIXI.Graphics();
      swirl.lineStyle(3, 0xFFD54F, 0.7);
      
      // Start position
      const startX = canvasSize.width * 0.2;
      const startY = canvasSize.height * 0.8;
      swirl.moveTo(startX, startY);
      
      // Draw a spiral
      for (let i = 0; i < 20; i++) {
        const angle = i * 0.2;
        const radius = i * 10;
        const x = startX + radius * Math.cos(angle);
        const y = startY - radius * Math.sin(angle);
        swirl.lineTo(x, y);
      }
      
      // Add some small circles along the swirl for sparkle effect
      for (let i = 0; i < 10; i++) {
        const angle = i * 0.4;
        const radius = i * 15;
        const x = startX + radius * Math.cos(angle);
        const y = startY - radius * Math.sin(angle);
        
        const sparkle = new PIXI.Graphics();
        sparkle.beginFill(0xFFD54F, 0.9);
        sparkle.drawCircle(x, y, 3);
        sparkle.endFill();
        container.addChild(sparkle);
      }
      
      container.addChild(swirl);
      
      // Add a second swirl on the other side
      const swirl2 = new PIXI.Graphics();
      swirl2.lineStyle(2, 0xE040FB, 0.6);
      
      // Start position
      const startX2 = canvasSize.width * 0.8;
      const startY2 = canvasSize.height * 0.6;
      swirl2.moveTo(startX2, startY2);
      
      // Draw a spiral
      for (let i = 0; i < 15; i++) {
        const angle = i * 0.3;
        const radius = i * 8;
        const x = startX2 - radius * Math.cos(angle);
        const y = startY2 - radius * Math.sin(angle);
        swirl2.lineTo(x, y);
      }
      
      container.addChild(swirl2);
    } catch (error) {
      console.error("Error adding fantasy elements:", error);
    }
  };
  
  // Add urban-themed elements
  const addUrbanElements = (container: any) => {
    if (!pixiInitialized || !pixiAppRef.current) return;
    
    try {
      // Add a city skyline silhouette
      const skyline = new PIXI.Graphics();
      skyline.beginFill(0x000000, 0.7);
      
      // Start at the bottom left
      skyline.moveTo(0, canvasSize.height);
      
      // Create a series of buildings with different heights
      const buildingCount = Math.floor(canvasSize.width / 40);
      const baseHeight = canvasSize.height * 0.3;
      let currentX = 0;
      
      for (let i = 0; i < buildingCount; i++) {
        const buildingWidth = Math.random() * 30 + 20;
        const buildingHeight = Math.random() * 150 + baseHeight;
        
        // Draw the building
        skyline.lineTo(currentX, canvasSize.height - buildingHeight);
        currentX += buildingWidth;
        skyline.lineTo(currentX, canvasSize.height - buildingHeight);
        
        // Add some windows
        const windowRows = Math.floor(buildingHeight / 20);
        const windowCols = Math.floor(buildingWidth / 10);
        
        for (let row = 0; row < windowRows; row++) {
          for (let col = 0; col < windowCols; col++) {
            // Random chance for a lit window
            if (Math.random() > 0.6) {
              const windowX = currentX - buildingWidth + col * 10 + 2;
              const windowY = canvasSize.height - buildingHeight + row * 20 + 5;
              
              const window = new PIXI.Graphics();
              window.beginFill(0xFFFF99, 0.8);
              window.drawRect(windowX, windowY, 6, 10);
              window.endFill();
              container.addChild(window);
            }
          }
        }
      }
      
      // Complete the shape
      skyline.lineTo(canvasSize.width, canvasSize.height - baseHeight * 0.7);
      skyline.lineTo(canvasSize.width, canvasSize.height);
      skyline.lineTo(0, canvasSize.height);
      skyline.endFill();
      
      container.addChild(skyline);
      
      // Add rain if enabled
      if (backgroundConfig.effects?.rain) {
        const rainContainer = new PIXI.Container();
        const rainCount = backgroundConfig.effects.rainIntensity ? backgroundConfig.effects.rainIntensity * 100 : 300;
        
        for (let i = 0; i < rainCount; i++) {
          const rainDrop = new PIXI.Graphics();
          rainDrop.beginFill(0xCCCCFF, 0.6);
          
          // Rain drop as a small line
          rainDrop.drawRect(0, 0, 1, 8);
          rainDrop.endFill();
          
          // Random position
          rainDrop.x = Math.random() * canvasSize.width;
          rainDrop.y = Math.random() * canvasSize.height;
          
          // Angle for diagonal rain
          rainDrop.rotation = Math.PI * 0.1;
          
          rainContainer.addChild(rainDrop);
          
          // Animate rain drops
          const speed = Math.random() * 5 + 10;
          const animate = () => {
            try {
              rainDrop.y += speed;
              rainDrop.x += speed * 0.2;
              
              // Reset rain drop when it goes out of bounds
              if (rainDrop.y > canvasSize.height) {
                rainDrop.y = -10;
                rainDrop.x = Math.random() * canvasSize.width;
              }
            } catch (error) {
              // If there's an error, remove this animation from the ticker
              if (pixiAppRef.current?.ticker) {
                pixiAppRef.current.ticker.remove(animate);
              }
            }
          };
          
          if (pixiAppRef.current?.ticker) {
            pixiAppRef.current.ticker.add(animate);
          }
        }
        
        container.addChild(rainContainer);
      }
    } catch (error) {
      console.error("Error adding urban elements:", error);
    }
  };
  
  // Add abstract-themed elements
  const addAbstractElements = (container: any) => {
    if (!pixiInitialized || !pixiAppRef.current) return;
    
    try {
      // Add floating geometric shapes
      const shapes = new PIXI.Container();
      
      // Create several shapes with different colors and sizes
      for (let i = 0; i < 10; i++) {
        const shape = new PIXI.Graphics();
        
        // Use colors derived from the main and secondary colors
        const color = i % 2 === 0 
          ? parseInt(backgroundConfig.color.replace('#', '0x'))
          : parseInt(backgroundConfig.secondaryColor?.replace('#', '0x') || '0x3F51B5');
        
        shape.beginFill(color, 0.3);
        
        // Different shape types
        const shapeType = Math.floor(Math.random() * 3);
        const size = Math.random() * 100 + 50;
        
        switch (shapeType) {
          case 0: // Circle
            shape.drawCircle(0, 0, size / 2);
            break;
          case 1: // Rectangle
            shape.drawRect(-size/2, -size/2, size, size);
            break;
          case 2: // Triangle
            shape.moveTo(0, -size/2);
            shape.lineTo(size/2, size/2);
            shape.lineTo(-size/2, size/2);
            shape.lineTo(0, -size/2);
            break;
        }
        
        shape.endFill();
        
        // Random position
        shape.x = Math.random() * canvasSize.width;
        shape.y = Math.random() * canvasSize.height;
        
        // Add blur filter for a soft effect
        if (PIXI.filters && PIXI.filters.BlurFilter) {
          try {
            shape.filters = [new PIXI.filters.BlurFilter(10)];
          } catch (error) {
            console.error("Error applying blur filter to shape:", error);
            // Continue without the filter
          }
        }
        
        shapes.addChild(shape);
        
        // Animate shapes
        const speed = Math.random() * 0.5 + 0.2;
        const direction = Math.random() * Math.PI * 2;
        
        const animate = () => {
          try {
            shape.x += Math.cos(direction) * speed;
            shape.y += Math.sin(direction) * speed;
            
            // Bounce off edges
            if (shape.x < 0 || shape.x > canvasSize.width) {
              shape.x = Math.max(0, Math.min(shape.x, canvasSize.width));
            }
            
            if (shape.y < 0 || shape.y > canvasSize.height) {
              shape.y = Math.max(0, Math.min(shape.y, canvasSize.height));
            }
            
            // Slow rotation
            shape.rotation += 0.002;
          } catch (error) {
            // If there's an error, remove this animation from the ticker
            if (pixiAppRef.current?.ticker) {
              pixiAppRef.current.ticker.remove(animate);
            }
          }
        };
        
        if (pixiAppRef.current?.ticker) {
          pixiAppRef.current.ticker.add(animate);
        }
      }
      
      container.addChild(shapes);
    } catch (error) {
      console.error("Error adding abstract elements:", error);
    }
  };
  
  // Create a lightning flash effect
  const createLightningFlash = () => {
    if (!pixiInitialized || !pixiAppRef.current) return;
    
    try {
      // Create a white overlay
      const flash = new PIXI.Graphics();
      flash.beginFill(0xFFFFFF, 0.7);
      flash.drawRect(0, 0, canvasSize.width, canvasSize.height);
      flash.endFill();
      
      pixiAppRef.current.stage.addChild(flash);
      
      // Fade out and remove
      const fadeSpeed = 0.05;
      
      const fadeOut = () => {
        try {
          flash.alpha -= fadeSpeed;
          
          if (flash.alpha <= 0) {
            if (pixiAppRef.current?.ticker) {
              pixiAppRef.current.ticker.remove(fadeOut);
            }
            if (pixiAppRef.current?.stage) {
              pixiAppRef.current.stage.removeChild(flash);
            }
          }
        } catch (error) {
          console.error("Error in lightning fade out:", error);
          if (pixiAppRef.current?.ticker) {
            pixiAppRef.current.ticker.remove(fadeOut);
          }
        }
      };
      
      if (pixiAppRef.current.ticker) {
        pixiAppRef.current.ticker.add(fadeOut);
      }
    } catch (error) {
      console.error("Error creating lightning flash:", error);
    }
  };
  
  // Update background config when a preset is selected
  const applyPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    
    // Get the preset config and merge with the current config
    const preset = BACKGROUND_PRESETS[presetName];
    if (preset) {
      setBackgroundConfig({
        ...backgroundConfig,
        ...preset,
        style: presetName as any
      });
    }
  };
  
  // Update a specific property in the background config
  const updateBackgroundConfig = (property: string, value: any) => {
    setBackgroundConfig(prev => {
      // For nested properties like 'effects.particles'
      if (property.includes('.')) {
        const [parentProp, childProp] = property.split('.');
        return {
          ...prev,
          [parentProp]: {
            ...prev[parentProp as keyof BackgroundConfig],
            [childProp]: value
          }
        };
      }
      
      // For top-level properties
      return {
        ...prev,
        [property]: value
      };
    });
  };
  
  // Save the current background config
  const saveBackgroundConfig = () => {
    updateConfig({
      background: backgroundConfig
    });
    alert("Background design has been saved to your game configuration!");
  };
  
  // Toggle an effect on/off
  const toggleEffect = (effect: string) => {
    setBackgroundConfig(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [effect]: !prev.effects?.[effect as keyof typeof prev.effects]
      }
    }));
  };
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Image className="w-6 h-6 text-blue-600" />
        Background Creator & Symbol Preview
      </h2>
      
      <p className="text-gray-600 mb-6">
        Design the background for your slot game and see how your symbols look directly on the background. This creates a transparent display that showcases your symbols clearly.
      </p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="bg-blue-100 rounded-full p-2 mr-3 mt-1">
            <Image className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-800 mb-1">Symbols on Background</h3>
            <p className="text-sm text-blue-700">
              Your symbols are now displayed directly on the background, eliminating the need for a frame. This creates a cleaner look that highlights your symbol designs.
            </p>
          </div>
        </div>
      </div>
      
      {/* Error message display */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Canvas preview */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
          <div className="relative overflow-hidden rounded-lg shadow-lg bg-gray-900">
            {!pixiInitialized && !errorMessage ? (
              <div className="flex items-center justify-center" style={{ width: canvasSize.width, height: canvasSize.height }}>
                <div className="text-white text-center p-8">
                  <div className="animate-spin mb-4 mx-auto w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  <p>Initializing background editor...</p>
                </div>
              </div>
            ) : (
              <canvas 
                ref={canvasRef} 
                width={canvasSize.width} 
                height={canvasSize.height}
                className="block"
              />
            )}
          </div>
          
          <div className="mt-4 text-center">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center mx-auto gap-2"
              onClick={saveBackgroundConfig}
              disabled={!pixiInitialized || !!errorMessage}
            >
              <Check className="w-4 h-4" />
              Save Background Design
            </button>
          </div>
        </div>
        
        {/* Right column - Controls */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Background Settings</h3>
          
          {/* Background type */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Background Type</label>
            <div className="flex gap-2">
              <button
                className={`flex-1 p-2 border rounded-lg text-sm capitalize transition-all
                  ${backgroundConfig.type === 'static' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'}`}
                onClick={() => updateBackgroundConfig('type', 'static')}
              >
                Static
              </button>
              
              <button
                className={`flex-1 p-2 border rounded-lg text-sm capitalize transition-all
                  ${backgroundConfig.type === 'animated' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'}`}
                onClick={() => updateBackgroundConfig('type', 'animated')}
              >
                Animated
              </button>
            </div>
          </div>
          
          {/* Style presets */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Style Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(BACKGROUND_PRESETS).map(preset => (
                <button
                  key={preset}
                  className={`p-2 border rounded-lg text-sm capitalize transition-all
                    ${selectedPreset === preset 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'}`}
                  onClick={() => applyPreset(preset)}
                >
                  <div className={`w-full h-10 mb-1 rounded bg-gradient-to-br ${GRADIENT_CLASSES[preset]}`}></div>
                  {preset}
                </button>
              ))}
            </div>
          </div>
          
          {/* Color settings */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Primary Color</label>
            <div className="flex items-center">
              <input
                type="color"
                value={backgroundConfig.color}
                onChange={(e) => updateBackgroundConfig('color', e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={backgroundConfig.color}
                onChange={(e) => updateBackgroundConfig('color', e.target.value)}
                className="ml-2 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Secondary Color</label>
            <div className="flex items-center">
              <input
                type="color"
                value={backgroundConfig.secondaryColor || '#000000'}
                onChange={(e) => updateBackgroundConfig('secondaryColor', e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={backgroundConfig.secondaryColor || '#000000'}
                onChange={(e) => updateBackgroundConfig('secondaryColor', e.target.value)}
                className="ml-2 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          
          {/* Gradient settings */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Gradient Type</label>
            <div className="flex gap-2">
              <button
                className={`flex-1 p-2 border rounded-lg text-sm capitalize transition-all
                  ${backgroundConfig.gradientType === 'linear' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'}`}
                onClick={() => updateBackgroundConfig('gradientType', 'linear')}
              >
                Linear
              </button>
              
              <button
                className={`flex-1 p-2 border rounded-lg text-sm capitalize transition-all
                  ${backgroundConfig.gradientType === 'radial' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'}`}
                onClick={() => updateBackgroundConfig('gradientType', 'radial')}
              >
                Radial
              </button>
            </div>
          </div>
          
          {/* Effects */}
          <div className="mb-4">
            <h4 className="font-bold text-gray-800 mb-2">Visual Effects</h4>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                className={`p-2 border rounded-lg text-sm flex items-center gap-1 justify-center
                  ${backgroundConfig.effects?.particles 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'}`}
                onClick={() => toggleEffect('particles')}
              >
                <Sparkles className="w-4 h-4" />
                Particles
              </button>
              
              <button
                className={`p-2 border rounded-lg text-sm flex items-center gap-1 justify-center
                  ${backgroundConfig.effects?.lightning 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'}`}
                onClick={() => toggleEffect('lightning')}
              >
                <CloudLightning className="w-4 h-4" />
                Lightning
              </button>
              
              <button
                className={`p-2 border rounded-lg text-sm flex items-center gap-1 justify-center
                  ${backgroundConfig.effects?.rain 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'}`}
                onClick={() => toggleEffect('rain')}
              >
                <Droplets className="w-4 h-4" />
                Rain
              </button>
              
              <button
                className={`p-2 border rounded-lg text-sm flex items-center gap-1 justify-center
                  ${backgroundConfig.effects?.snow 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'}`}
                onClick={() => toggleEffect('snow')}
              >
                <CloudSnow className="w-4 h-4" />
                Snow
              </button>
              
              <button
                className={`p-2 border rounded-lg text-sm flex items-center gap-1 justify-center
                  ${backgroundConfig.effects?.stars 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'}`}
                onClick={() => toggleEffect('stars')}
              >
                <Sparkles className="w-4 h-4" />
                Stars
              </button>
              
              <button
                className={`p-2 border rounded-lg text-sm flex items-center gap-1 justify-center
                  ${backgroundConfig.effects?.clouds 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'}`}
                onClick={() => toggleEffect('clouds')}
              >
                <Wind className="w-4 h-4" />
                Clouds
              </button>
              
              <button
                className={`p-2 border rounded-lg text-sm flex items-center gap-1 justify-center
                  ${backgroundConfig.effects?.dayNightCycle 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'}`}
                onClick={() => toggleEffect('dayNightCycle')}
              >
                <Clock className="w-4 h-4" />
                Day/Night
              </button>
            </div>
            
            {/* Particle settings if enabled */}
            {backgroundConfig.effects?.particles && (
              <div className="p-3 bg-gray-50 rounded-lg mb-3">
                <h5 className="font-medium text-gray-700 mb-2">Particle Settings</h5>
                
                <div className="mb-2">
                  <label className="block text-xs text-gray-600 mb-1">Particle Color</label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={backgroundConfig.effects.particleColor || '#FFFFFF'}
                      onChange={(e) => updateBackgroundConfig('effects.particleColor', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                    />
                    <input
                      type="text"
                      value={backgroundConfig.effects.particleColor || '#FFFFFF'}
                      onChange={(e) => updateBackgroundConfig('effects.particleColor', e.target.value)}
                      className="ml-2 px-2 py-1 border rounded-lg text-sm w-20"
                    />
                  </div>
                </div>
                
                <div className="mb-2">
                  <label className="block text-xs text-gray-600 mb-1">Particle Count</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={backgroundConfig.effects.particleCount || 50}
                      onChange={(e) => updateBackgroundConfig('effects.particleCount', parseInt(e.target.value))}
                      className="w-full mr-2"
                    />
                    <span className="w-10 text-center">{backgroundConfig.effects.particleCount || 50}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Particle Speed</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={backgroundConfig.effects.particleSpeed || 1}
                      onChange={(e) => updateBackgroundConfig('effects.particleSpeed', parseInt(e.target.value))}
                      className="w-full mr-2"
                    />
                    <span className="w-10 text-center">{backgroundConfig.effects.particleSpeed || 1}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Lightning settings if enabled */}
            {backgroundConfig.effects?.lightning && (
              <div className="p-3 bg-gray-50 rounded-lg mb-3">
                <h5 className="font-medium text-gray-700 mb-2">Lightning Settings</h5>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Frequency</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={backgroundConfig.effects.lightningFrequency || 5}
                      onChange={(e) => updateBackgroundConfig('effects.lightningFrequency', parseInt(e.target.value))}
                      className="w-full mr-2"
                    />
                    <span className="w-10 text-center">{backgroundConfig.effects.lightningFrequency || 5}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* AI Background Generator */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1">
              <Palette className="w-4 h-4 text-purple-600" />
              AI Background Generator
            </h4>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-purple-200 mb-3">
              <p className="text-sm text-gray-700 mb-3">
                Describe the background you want for your slot game, and our AI will generate it for you.
              </p>
              
              <textarea
                className="w-full p-2 border border-gray-300 rounded mb-2 h-24 text-sm"
                placeholder="E.g., 'Underwater treasure scene with exotic fish and coral reefs' or 'Mystical forest with glowing mushrooms and fairy lights'"
                onChange={(e) => updateBackgroundConfig('generationPrompt', e.target.value)}
                value={backgroundConfig.generationPrompt || ''}
              />
              
              <div className="flex justify-between items-center">
                <button
                  className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center gap-1"
                  onClick={() => {
                    // Simulate AI generation with a placeholder
                    setBackgroundConfig(prev => ({
                      ...prev,
                      isGenerating: true
                    }));
                    
                    // Simulate API call delay
                    setTimeout(() => {
                      // Generate placeholder based on prompt content
                      const prompt = backgroundConfig.generationPrompt?.toLowerCase() || '';
                      let placeholderUrl = '';
                      
                      if (prompt.includes('underwater') || prompt.includes('ocean') || prompt.includes('sea')) {
                        placeholderUrl = 'https://placehold.co/1200x700/0077be/white?text=Underwater+Scene';
                      } else if (prompt.includes('forest') || prompt.includes('jungle') || prompt.includes('nature')) {
                        placeholderUrl = 'https://placehold.co/1200x700/2e8b57/white?text=Forest+Background';
                      } else if (prompt.includes('space') || prompt.includes('galaxy') || prompt.includes('cosmic')) {
                        placeholderUrl = 'https://placehold.co/1200x700/191970/white?text=Space+Background';
                      } else if (prompt.includes('desert') || prompt.includes('egypt') || prompt.includes('pyramid')) {
                        placeholderUrl = 'https://placehold.co/1200x700/daa520/white?text=Desert+Background';
                      } else if (prompt.includes('city') || prompt.includes('urban') || prompt.includes('night')) {
                        placeholderUrl = 'https://placehold.co/1200x700/1a1a2e/white?text=City+Background';
                      } else {
                        placeholderUrl = 'https://placehold.co/1200x700/6a5acd/white?text=Custom+Background';
                      }
                      
                      setBackgroundConfig(prev => ({
                        ...prev,
                        isGenerating: false,
                        backgroundImage: placeholderUrl,
                        generatedElements: []
                      }));
                    }, 3000);
                  }}
                  disabled={!backgroundConfig.generationPrompt || backgroundConfig.isGenerating}
                >
                  {backgroundConfig.isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Palette className="w-4 h-4" />
                      Generate Background
                    </>
                  )}
                </button>
                
                {backgroundConfig.isGenerating && (
                  <span className="text-xs text-gray-500">This may take a minute...</span>
                )}
              </div>
            </div>
            
            {/* Display generated background */}
            {backgroundConfig.backgroundImage && (
              <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-1">
                  <Image className="w-4 h-4 text-green-600" />
                  Generated Background
                </h5>
                
                <div className="relative mb-3">
                  <img 
                    src={backgroundConfig.backgroundImage} 
                    alt="Generated Background" 
                    className="w-full h-auto rounded shadow-sm"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="bg-black bg-opacity-50 p-2 rounded">
                      <button className="text-white text-sm px-2 py-1">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Element Extraction UI */}
                <div className="mb-2">
                  <h6 className="text-sm font-medium text-gray-700 mb-1">Extract Animated Elements</h6>
                  <p className="text-xs text-gray-600 mb-2">
                    Select elements from your background to animate independently.
                  </p>
                  
                  <button
                    className="w-full p-2 border border-dashed border-blue-300 rounded bg-blue-50 hover:bg-blue-100 transition-colors text-sm text-blue-700 flex items-center justify-center gap-1 mb-2"
                    onClick={() => {
                      // Simulate element extraction process
                      setBackgroundConfig(prev => ({
                        ...prev,
                        isExtracting: true
                      }));
                      
                      // Simulate API call delay
                      setTimeout(() => {
                        // Generate placeholder extracted elements
                        const extractedElements = [
                          {
                            id: 'element1',
                            name: 'Foreground Element',
                            imageUrl: 'https://placehold.co/300x300/9370db/white?text=Element+1',
                            position: { x: 100, y: 300 },
                            size: { width: 100, height: 100 },
                            animation: 'float'
                          },
                          {
                            id: 'element2',
                            name: 'Background Element',
                            imageUrl: 'https://placehold.co/300x300/4682b4/white?text=Element+2',
                            position: { x: 300, y: 150 },
                            size: { width: 120, height: 80 },
                            animation: 'rotate'
                          }
                        ];
                        
                        setBackgroundConfig(prev => ({
                          ...prev,
                          isExtracting: false,
                          extractedElements: extractedElements
                        }));
                      }, 2500);
                    }}
                    disabled={backgroundConfig.isExtracting}
                  >
                    {backgroundConfig.isExtracting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                        Extracting Elements...
                      </>
                    ) : (
                      <>
                        <Layers className="w-4 h-4" />
                        Extract Elements for Animation
                      </>
                    )}
                  </button>
                  
                  {/* Display extracted elements */}
                  {backgroundConfig.extractedElements && backgroundConfig.extractedElements.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {backgroundConfig.extractedElements.map((element, index) => (
                        <div key={element.id} className="bg-gray-50 p-2 rounded border border-gray-200">
                          <img 
                            src={element.imageUrl} 
                            alt={element.name} 
                            className="w-full h-auto mb-1 rounded"
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-700">{element.name}</span>
                            <select
                              className="text-xs p-1 border rounded"
                              value={element.animation}
                              onChange={(e) => {
                                const updatedElements = [...(backgroundConfig.extractedElements || [])];
                                updatedElements[index] = {
                                  ...updatedElements[index],
                                  animation: e.target.value
                                };
                                updateBackgroundConfig('extractedElements', updatedElements);
                              }}
                            >
                              <option value="none">No Animation</option>
                              <option value="float">Float</option>
                              <option value="rotate">Rotate</option>
                              <option value="pulse">Pulse</option>
                              <option value="bounce">Bounce</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Upload custom background image */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-1">Or Upload Your Own Image</h5>
              <button 
                className="w-full p-3 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
                onClick={() => alert("Custom image upload feature will be implemented in a future update.")}
              >
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Upload Background Image</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundCreator;