import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../store';
import { 
  Palette, 
  Move, 
  Frame, 
  Layers, 
  Maximize,
  Minimize,
  Square,
  Plus,
  Check,
  Undo,
  Download,
  Image 
} from 'lucide-react';

// Direct image imports
import minimalDecoration from '../../../assets/frames/decorations/minimal.png';
import decoratedDecoration from '../../../assets/frames/decorations/decorated.png';
import cartoonStyle from '../../../assets/frames/styles/cartoon.png';
import darkStyle from '../../../assets/frames/styles/dark.png';

// Import PIXI only on client-side
let PIXI;

// Define OpenAI frame generation interface
interface OpenAIFrameGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// Define types for game frame configuration
interface FrameConfig {
  style: 'modern' | 'classic' | 'ornate' | 'minimal' | 'transparent' | 'custom';
  borderWidth: number;
  borderRadius: number;
  borderColor: string;
  backgroundColor: string;
  transparentBackground: boolean;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  frameImage?: string;
  buttons: {
    style: 'round' | 'square' | 'pill';
    color: string;
    textColor: string;
    position: 'bottom' | 'side';
    size: 'small' | 'medium' | 'large';
  };
  customStyles?: Record<string, any>;
}

// Presets for different frame styles
const FRAME_PRESETS: Record<string, Partial<FrameConfig>> = {
  transparent: {
    style: 'transparent',
    borderWidth: 2,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(0,0,0,0)',
    transparentBackground: true,
    shadowEnabled: true,
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowBlur: 8,
    buttons: {
      style: 'pill',
      color: 'rgba(59,130,246,0.7)',
      textColor: '#FFFFFF',
      position: 'bottom',
      size: 'medium',
    }
  },
  modern: {
    style: 'modern',
    borderWidth: 3,
    borderRadius: 12,
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
    transparentBackground: false,
    shadowEnabled: true,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 15,
    buttons: {
      style: 'pill',
      color: '#3B82F6',
      textColor: '#FFFFFF',
      position: 'bottom',
      size: 'medium',
    }
  },
  classic: {
    style: 'classic',
    borderWidth: 8,
    borderRadius: 0,
    borderColor: '#D4AF37',
    backgroundColor: '#8B0000',
    transparentBackground: false,
    shadowEnabled: true,
    shadowColor: 'rgba(0,0,0,0.7)',
    shadowBlur: 10,
    buttons: {
      style: 'square',
      color: '#D4AF37',
      textColor: '#FFFFFF',
      position: 'bottom',
      size: 'large',
    }
  },
  ornate: {
    style: 'ornate',
    borderWidth: 12,
    borderRadius: 5,
    borderColor: '#9F7833',
    backgroundColor: '#241C11',
    transparentBackground: false,
    shadowEnabled: true,
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowBlur: 12,
    buttons: {
      style: 'square',
      color: '#9F7833',
      textColor: '#FFFFFF',
      position: 'side',
      size: 'medium',
    }
  },
  minimal: {
    style: 'minimal',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    transparentBackground: false,
    shadowEnabled: false,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowBlur: 5,
    buttons: {
      style: 'round',
      color: '#1E293B',
      textColor: '#FFFFFF',
      position: 'bottom',
      size: 'small',
    }
  }
};

// GameFrameDesigner component
const GameFrameDesigner: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixiAppRef = useRef<any | null>(null);
  const [pixiInitialized, setPixiInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Initialize frame config from store or use default
  const [frameConfig, setFrameConfig] = useState<FrameConfig>(
    config.frame || {
      ...FRAME_PRESETS.modern as FrameConfig,
      customStyles: {}
    }
  );
  
  // Selected preset for styling
  const [selectedPreset, setSelectedPreset] = useState<string>(frameConfig.style || 'modern');
  
  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 480 });
  
  // State for AI frame generation
  const [generatingFrame, setGeneratingFrame] = useState(false);
  const [framePrompt, setFramePrompt] = useState('');
  const [generatedFrameUrl, setGeneratedFrameUrl] = useState<string | null>(null);
  
  // Initialize PIXI - only on client-side
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
    
    return () => {
      // Clean up PIXI app on unmount
      if (pixiAppRef.current) {
        try {
          pixiAppRef.current.destroy(true);
        } catch (error) {
          console.error("Error destroying PIXI app:", error);
        }
      }
    };
  }, []);
  
  // State for loaded style and material thumbnails
  const [styleImages, setStyleImages] = useState<Record<string, string>>({});
  const [materialImages, setMaterialImages] = useState<Record<string, string>>({});
  const [decorationImages, setDecorationImages] = useState<Record<string, string>>({});

  // Load thumbnail images
  useEffect(() => {
    // Helper function to check if an image exists
    const checkImageExists = async (url: string): Promise<boolean> => {
      try {
        console.log(`Checking image at ${url}`);
        const response = await fetch(url, { method: 'HEAD' });
        console.log(`Image at ${url} status:`, response.ok ? 'exists' : 'not found');
        return response.ok;
      } catch (error) {
        console.error(`Error checking image at ${url}:`, error);
        return false;
      }
    };

    // Load style images
    const loadStyleImages = async () => {
      const styles = ['cartoon', 'realistic', 'cute', 'dark', 'neon', 'futuristic', 'minimal', 'same-as-symbols'];
      const loadedImages: Record<string, string> = {};
      
      // Try direct loading without checks first
      for (const style of styles) {
        const url = `/assets/frames/styles/${style}.png`;
        // The fetch could be failing, so just set the URL directly
        loadedImages[style] = url;
        console.log(`Added style image: ${style} -> ${url}`);
      }
      
      setStyleImages(loadedImages);
      return loadedImages;
    };

    // Load material images
    const loadMaterialImages = async () => {
      const materials = ['metallic', 'wood', 'glass', 'soft', 'organic', 'neon'];
      const loadedImages: Record<string, string> = {};
      
      // Try direct loading without checks
      for (const material of materials) {
        const url = `/assets/frames/materials/${material}.png`;
        // Just set the URL directly
        loadedImages[material] = url;
        console.log(`Added material image: ${material} -> ${url}`);
      }
      
      setMaterialImages(loadedImages);
      return loadedImages;
    };

    // Load decoration images
    const loadDecorationImages = async () => {
      const decorations = ['minimal', 'decorated'];
      const loadedImages: Record<string, string> = {};
      
      // Try direct loading without checks
      for (const decoration of decorations) {
        const url = `/assets/frames/decorations/${decoration}.png`;
        // Just set the URL directly
        loadedImages[decoration] = url;
        console.log(`Added decoration image: ${decoration} -> ${url}`);
      }
      
      setDecorationImages(loadedImages);
      return loadedImages;
    };

    // Load all images
    loadStyleImages().then(() => console.log('Style images loaded:', styleImages));
    loadMaterialImages().then(() => console.log('Material images loaded:', materialImages));
    loadDecorationImages().then(() => console.log('Decoration images loaded:', decorationImages));
  }, []);

  // Initialize PixiJS application after PIXI is loaded
  useEffect(() => {
    if (!pixiInitialized || !PIXI || !canvasRef.current) return;
    
    try {
      // Clean up any existing PIXI app
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true);
      }
      
      // Create new PIXI application with error handling for constructor issues
      try {
        pixiAppRef.current = new PIXI.Application({
          width: canvasSize.width,
          height: canvasSize.height,
          backgroundColor: 0x282c34,
          antialias: true,
          view: canvasRef.current,
          resolution: window.devicePixelRatio || 1,
        });
        
        // Add frame content
        renderFrame();
      } catch (pixiError) {
        console.error("Error creating PIXI Application:", pixiError);
        
        // Fallback to Canvas API if PIXI fails
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Set canvas dimensions
          canvasRef.current.width = canvasSize.width;
          canvasRef.current.height = canvasSize.height;
          
          // Draw a simple frame with Canvas API
          renderCanvasFrame(ctx);
        } else {
          throw new Error("Could not get canvas context");
        }
      }
    } catch (error) {
      console.error("Error initializing rendering:", error);
      setErrorMessage("Failed to initialize animation. Please try refreshing the page.");
    }
  }, [pixiInitialized, canvasRef, canvasSize]);
  
  // Update frame when config changes
  useEffect(() => {
    if (!pixiInitialized) return;
    
    try {
      if (pixiAppRef.current) {
        renderFrame();
      } else {
        // Fallback to Canvas API if PIXI not available
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          renderCanvasFrame(ctx);
        }
      }
      
      // Save to global config whenever frame config changes
      updateConfig({
        frame: frameConfig
      });
    } catch (error) {
      console.error("Error updating frame:", error);
      setErrorMessage("Failed to update frame with new settings. Please try different settings.");
    }
  }, [frameConfig, pixiInitialized, config?.theme?.generated?.symbols]);
  
  // Function to generate frame using AI
  const generateFrameWithAI = async () => {
    if (!framePrompt.trim()) return;
    
    setGeneratingFrame(true);
    
    try {
      // In a real implementation, this would make an API call to OpenAI's DALL-E or another image generation API
      console.log('Generating frame with prompt:', framePrompt);
      
      // Select a placeholder based on the prompt content for better simulation
      // These are just for demo purposes - in production this would call the real API
      let placeholderUrl = '';
      
      // Simple keyword matching to provide more relevant placeholders based on the prompt
      const prompt = framePrompt.toLowerCase();
      
      if (prompt.includes('gold') || prompt.includes('ornate') || prompt.includes('luxury')) {
        placeholderUrl = 'https://placehold.co/800x400/D4AF37/1e1e1e?text=Ornate+Gold+Frame';
      } else if (prompt.includes('wood') || prompt.includes('rustic') || prompt.includes('natural')) {
        placeholderUrl = 'https://placehold.co/800x400/8B4513/fff?text=Rustic+Wooden+Frame';
      } else if (prompt.includes('blue') || prompt.includes('ocean') || prompt.includes('water')) {
        placeholderUrl = 'https://placehold.co/800x400/1e90ff/fff?text=Ocean+Theme+Frame';
      } else if (prompt.includes('space') || prompt.includes('galaxy') || prompt.includes('cosmic')) {
        placeholderUrl = 'https://placehold.co/800x400/483D8B/fff?text=Cosmic+Space+Frame';
      } else if (prompt.includes('jungle') || prompt.includes('forest') || prompt.includes('nature')) {
        placeholderUrl = 'https://placehold.co/800x400/228B22/fff?text=Jungle+Adventure+Frame';
      } else if (prompt.includes('fire') || prompt.includes('flames') || prompt.includes('dragon')) {
        placeholderUrl = 'https://placehold.co/800x400/B22222/fff?text=Dragon+Fire+Frame';
      } else if (prompt.includes('neon') || prompt.includes('modern') || prompt.includes('tech')) {
        placeholderUrl = 'https://placehold.co/800x400/FF00FF/000?text=Neon+Tech+Frame';
      } else {
        // Default generic frame
        placeholderUrl = 'https://placehold.co/800x400/708090/fff?text=Custom+AI+Frame';
      }
      
      // Simulate DALL-E or other API delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate successful response
      const simulatedResponse: OpenAIFrameGenerationResponse = {
        success: true,
        imageUrl: placeholderUrl,
      };
      
      if (simulatedResponse.success && simulatedResponse.imageUrl) {
        setGeneratedFrameUrl(simulatedResponse.imageUrl);
        // Add to frame config automatically
        updateFrameConfig('frameImage', simulatedResponse.imageUrl);
      } else {
        console.error('Error generating frame:', simulatedResponse.error);
        alert('Failed to generate frame. Please try again with a different description.');
      }
    } catch (error) {
      console.error('Error generating frame with AI:', error);
      alert('An error occurred while generating the frame. Please try again.');
    } finally {
      setGeneratingFrame(false);
    }
  };
  
  // Function to render the slot machine frame with PIXI
  const renderFrame = () => {
    if (!pixiInitialized || !PIXI || !pixiAppRef.current) return;
    
    try {
      // Clear previous content
      pixiAppRef.current.stage.removeChildren();
      
      // Create frame container
      const frameContainer = new PIXI.Container();
      pixiAppRef.current.stage.addChild(frameContainer);
      
      // Background (either using graphics or a frame image if available)
      if (frameConfig.frameImage) {
        // If we have a frameImage from AI generation, use it as background
        try {
          const frameTexture = PIXI.Texture.from(frameConfig.frameImage);
          const frameSprite = new PIXI.Sprite(frameTexture);
          
          // Scale to fit the canvas while maintaining aspect ratio
          frameSprite.width = canvasSize.width;
          frameSprite.height = canvasSize.height;
          
          // Add the frame sprite to the container
          frameContainer.addChild(frameSprite);
        } catch (error) {
          console.error("Error loading frame image:", error);
          // Fallback to standard background if image fails to load
          const background = new PIXI.Graphics();
          background.beginFill(parseInt(frameConfig.backgroundColor.replace('#', '0x')));
          background.drawRoundedRect(0, 0, canvasSize.width, canvasSize.height, frameConfig.borderRadius);
          background.endFill();
          frameContainer.addChild(background);
        }
      } else if (frameConfig.transparentBackground) {
        // Create a transparent background with a subtle checkered pattern to indicate transparency
        const transparentBackground = new PIXI.Graphics();
        
        // Create a subtle checkered pattern to indicate transparency
        for (let x = 0; x < canvasSize.width; x += 20) {
          for (let y = 0; y < canvasSize.height; y += 20) {
            transparentBackground.beginFill(((x / 20) + (y / 20)) % 2 === 0 ? 0xF0F0F0 : 0xE0E0E0, 0.2);
            transparentBackground.drawRect(x, y, 20, 20);
            transparentBackground.endFill();
          }
        }
        
        // Draw transparent container with a subtle rounded rectangle
        transparentBackground.lineStyle(1, 0xCCCCCC, 0.3);
        transparentBackground.drawRoundedRect(0, 0, canvasSize.width, canvasSize.height, frameConfig.borderRadius);
        frameContainer.addChild(transparentBackground);
      } else {
        // Standard background if no frame image
        const background = new PIXI.Graphics();
        background.beginFill(parseInt(frameConfig.backgroundColor.replace('#', '0x')));
        background.drawRoundedRect(0, 0, canvasSize.width, canvasSize.height, frameConfig.borderRadius);
        background.endFill();
        frameContainer.addChild(background);
      }
      
      // Add shadow if enabled
      if (frameConfig.shadowEnabled) {
        try {
          if (PIXI.filters && PIXI.filters.BlurFilter) {
            background.filters = [new PIXI.filters.BlurFilter(frameConfig.shadowBlur)];
          }
        } catch (error) {
          console.error("Error applying blur filter:", error);
          // Continue without the filter if there's an error
        }
      }
      
      // Reel area
      const reelWidth = canvasSize.width * 0.8;
      const reelHeight = canvasSize.height * 0.7;
      const reelX = (canvasSize.width - reelWidth) / 2;
      const reelY = canvasSize.height * 0.15;
      
      const reelArea = new PIXI.Graphics();
      reelArea.beginFill(0x000000);
      reelArea.drawRoundedRect(reelX, reelY, reelWidth, reelHeight, frameConfig.borderRadius / 2);
      reelArea.endFill();
      frameContainer.addChild(reelArea);
      
      // Frame border
      const frameBorder = new PIXI.Graphics();
      frameBorder.lineStyle(frameConfig.borderWidth, parseInt(frameConfig.borderColor.replace('#', '0x')));
      frameBorder.drawRoundedRect(0, 0, canvasSize.width, canvasSize.height, frameConfig.borderRadius);
      frameContainer.addChild(frameBorder);
      
      // Add some symbols to the reel area
      const addSymbols = () => {
        try {
          // Get generated symbols from the store
          const generatedSymbols = config?.theme?.generated?.symbols || [];
          const hasGeneratedSymbols = generatedSymbols.length > 0;
          
          // Grid lines for reels (3x5 default)
          const cellWidth = reelWidth / 5;
          const cellHeight = reelHeight / 3;
          
          // Fallback symbol colors if no generated symbols are available
          const symbolColors = [
            0xFF5252, // Red
            0xFFD740, // Yellow
            0x69F0AE, // Green
            0x448AFF, // Blue
            0xE040FB, // Purple
          ];
          
          // Draw symbols
          for (let row = 0; row < 3; row++) {
            for (let reel = 0; reel < 5; reel++) {
              const x = reelX + reel * cellWidth + cellWidth / 2;
              const y = reelY + row * cellHeight + cellHeight / 2;
              const size = Math.min(cellWidth, cellHeight) * 0.8;
              
              if (hasGeneratedSymbols && Math.random() > 0.4) {
                // Use a generated symbol
                const symbolIndex = Math.floor(Math.random() * generatedSymbols.length);
                const symbolUrl = generatedSymbols[symbolIndex];
                
                try {
                  const texture = PIXI.Texture.from(symbolUrl);
                  const sprite = new PIXI.Sprite(texture);
                  
                  // Center and scale the sprite
                  sprite.anchor.set(0.5);
                  sprite.width = size;
                  sprite.height = size;
                  sprite.position.set(x, y);
                  
                  frameContainer.addChild(sprite);
                } catch (error) {
                  console.error("Error creating symbol sprite:", error);
                  // Fallback to basic shape
                  createBasicSymbol(x, y, size, symbolColors[Math.floor(Math.random() * symbolColors.length)]);
                }
              } else {
                // Create a basic shape as fallback
                const color = symbolColors[Math.floor(Math.random() * symbolColors.length)];
                createBasicSymbol(x, y, size, color);
              }
            }
          }
          
          // Add grid lines
          const gridLines = new PIXI.Graphics();
          gridLines.lineStyle(1, 0x666666, 0.5);
          
          // Vertical grid lines
          for (let i = 1; i < 5; i++) {
            gridLines.moveTo(reelX + i * cellWidth, reelY);
            gridLines.lineTo(reelX + i * cellWidth, reelY + reelHeight);
          }
          
          // Horizontal grid lines
          for (let i = 1; i < 3; i++) {
            gridLines.moveTo(reelX, reelY + i * cellHeight);
            gridLines.lineTo(reelX + reelWidth, reelY + i * cellHeight);
          }
          
          frameContainer.addChild(gridLines);
        } catch (error) {
          console.error("Error adding symbols to frame:", error);
        }
      };
      
      // Helper to create a basic symbol shape
      const createBasicSymbol = (x: number, y: number, size: number, color: number) => {
        const symbol = new PIXI.Graphics();
        symbol.beginFill(color, 0.8);
        
        // Randomly choose between circle and rounded square
        if (Math.random() > 0.5) {
          symbol.drawCircle(0, 0, size / 2);
        } else {
          symbol.drawRoundedRect(-size/2, -size/2, size, size, size * 0.2);
        }
        
        symbol.endFill();
        symbol.position.set(x, y);
        frameContainer.addChild(symbol);
      };
      
      // Add symbols to the reel area
      addSymbols();
      
      // Add spin button
      const buttonRadius = frameConfig.buttons.size === 'large' ? 40 : 
                           frameConfig.buttons.size === 'medium' ? 30 : 20;
      
      const buttonX = canvasSize.width / 2;
      const buttonY = reelY + reelHeight + 50;
      
      const spinButton = new PIXI.Graphics();
      spinButton.beginFill(parseInt(frameConfig.buttons.color.replace('#', '0x')));
      
      if (frameConfig.buttons.style === 'round') {
        spinButton.drawCircle(0, 0, buttonRadius);
      } else if (frameConfig.buttons.style === 'square') {
        spinButton.drawRect(-buttonRadius, -buttonRadius, buttonRadius * 2, buttonRadius * 2);
      } else {
        // Pill shape
        spinButton.drawRoundedRect(-buttonRadius * 1.5, -buttonRadius / 2, buttonRadius * 3, buttonRadius, buttonRadius / 2);
      }
      
      spinButton.endFill();
      spinButton.position.set(buttonX, buttonY);
      frameContainer.addChild(spinButton);
      
      // Button text
      const buttonText = new PIXI.Text('SPIN', {
        fontFamily: 'Arial',
        fontSize: frameConfig.buttons.size === 'large' ? 24 : 
                  frameConfig.buttons.size === 'medium' ? 18 : 14,
        fill: frameConfig.buttons.textColor,
        align: 'center',
      });
      buttonText.anchor.set(0.5);
      buttonText.position.set(buttonX, buttonY);
      frameContainer.addChild(buttonText);
      
      // Add bet controls
      const addBetControls = () => {
        const controlsY = reelY + reelHeight + 50;
        const spacing = 100;
        
        // Minus button
        const minusButton = new PIXI.Graphics();
        minusButton.beginFill(parseInt(frameConfig.buttons.color.replace('#', '0x')));
        minusButton.drawCircle(0, 0, buttonRadius * 0.7);
        minusButton.endFill();
        minusButton.position.set(buttonX - spacing * 1.5, controlsY);
        frameContainer.addChild(minusButton);
        
        const minusText = new PIXI.Text('-', {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: frameConfig.buttons.textColor,
        });
        minusText.anchor.set(0.5);
        minusText.position.set(buttonX - spacing * 1.5, controlsY);
        frameContainer.addChild(minusText);
        
        // Bet display
        const betDisplay = new PIXI.Graphics();
        betDisplay.beginFill(0x000000, 0.6);
        betDisplay.drawRoundedRect(-40, -20, 80, 40, 5);
        betDisplay.endFill();
        betDisplay.position.set(buttonX - spacing * 0.75, controlsY);
        frameContainer.addChild(betDisplay);
        
        const betText = new PIXI.Text('1.00', {
          fontFamily: 'Arial',
          fontSize: 18,
          fill: 0xFFFFFF,
        });
        betText.anchor.set(0.5);
        betText.position.set(buttonX - spacing * 0.75, controlsY);
        frameContainer.addChild(betText);
        
        // Plus button
        const plusButton = new PIXI.Graphics();
        plusButton.beginFill(parseInt(frameConfig.buttons.color.replace('#', '0x')));
        plusButton.drawCircle(0, 0, buttonRadius * 0.7);
        plusButton.endFill();
        plusButton.position.set(buttonX - spacing * 0.0, controlsY);
        frameContainer.addChild(plusButton);
        
        const plusText = new PIXI.Text('+', {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: frameConfig.buttons.textColor,
        });
        plusText.anchor.set(0.5);
        plusText.position.set(buttonX - spacing * 0.0, controlsY);
        frameContainer.addChild(plusText);
        
        // Max bet button
        const maxBetButton = new PIXI.Graphics();
        maxBetButton.beginFill(parseInt(frameConfig.buttons.color.replace('#', '0x')));
        maxBetButton.drawRoundedRect(-40, -15, 80, 30, 5);
        maxBetButton.endFill();
        maxBetButton.position.set(buttonX + spacing * 0.75, controlsY);
        frameContainer.addChild(maxBetButton);
        
        const maxBetText = new PIXI.Text('MAX BET', {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: frameConfig.buttons.textColor,
        });
        maxBetText.anchor.set(0.5);
        maxBetText.position.set(buttonX + spacing * 0.75, controlsY);
        frameContainer.addChild(maxBetText);
        
        // Auto spin button
        const autoSpinButton = new PIXI.Graphics();
        autoSpinButton.beginFill(parseInt(frameConfig.buttons.color.replace('#', '0x')));
        autoSpinButton.drawRoundedRect(-40, -15, 80, 30, 5);
        autoSpinButton.endFill();
        autoSpinButton.position.set(buttonX + spacing * 1.5, controlsY);
        frameContainer.addChild(autoSpinButton);
        
        const autoSpinText = new PIXI.Text('AUTO', {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: frameConfig.buttons.textColor,
        });
        autoSpinText.anchor.set(0.5);
        autoSpinText.position.set(buttonX + spacing * 1.5, controlsY);
        frameContainer.addChild(autoSpinText);
      };
      
      addBetControls();
      
      // Add win display at top
      const winDisplay = new PIXI.Graphics();
      winDisplay.beginFill(0x000000, 0.6);
      winDisplay.drawRoundedRect(-100, -20, 200, 40, 5);
      winDisplay.endFill();
      winDisplay.position.set(canvasSize.width / 2, reelY - 30);
      frameContainer.addChild(winDisplay);
      
      const winText = new PIXI.Text('WIN: 0.00', {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xFFFFFF,
      });
      winText.anchor.set(0.5);
      winText.position.set(canvasSize.width / 2, reelY - 30);
      frameContainer.addChild(winText);
    } catch (error) {
      console.error("Error rendering frame with PIXI:", error);
      
      // Attempt fallback to Canvas API
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        renderCanvasFrame(ctx);
      } else {
        setErrorMessage("Failed to render frame. Please try a different style or refresh the page.");
      }
    }
  };
  
  // Enhanced fallback function to render frame with standard Canvas API 
  const renderCanvasFrame = (ctx: CanvasRenderingContext2D) => {
    try {
      // Clear canvas with high-quality clearing technique
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      
      // Calculate reel dimensions (same as in renderFrame)
      const reelWidth = canvasSize.width * 0.8;
      const reelHeight = canvasSize.height * 0.7;
      const reelX = (canvasSize.width - reelWidth) / 2;
      const reelY = canvasSize.height * 0.15;
      
      // ---------- Apply shadow effect if enabled (better Canvas shadow) ----------
      if (frameConfig.shadowEnabled) {
        ctx.save();
        // Canvas shadow properties
        ctx.shadowColor = frameConfig.shadowColor;
        ctx.shadowBlur = frameConfig.shadowBlur * 1.5; // Increased for better visibility
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
      }
      
      // ---------- Draw background with AI-generated frame or gradient effect ----------
      if (frameConfig.frameImage) {
        // Use the AI-generated frame image as background if available
        try {
          const frameImg = new Image();
          frameImg.src = frameConfig.frameImage;
          
          // If image is already loaded, draw it immediately
          if (frameImg.complete) {
            ctx.drawImage(frameImg, 0, 0, canvasSize.width, canvasSize.height);
          } else {
            // Otherwise set up an onload handler
            frameImg.onload = () => {
              ctx.drawImage(frameImg, 0, 0, canvasSize.width, canvasSize.height);
            };
            
            // Draw a placeholder gradient until image loads
            drawBackgroundGradient();
          }
        } catch (error) {
          console.error("Error drawing frame image:", error);
          // Fall back to gradient if image fails
          drawBackgroundGradient();
        }
      } else {
        // Standard gradient background if no frame image
        drawBackgroundGradient();
      }
      
      // Helper function to draw the gradient background
      function drawBackgroundGradient() {
        if (frameConfig.transparentBackground) {
          // Draw a checkered pattern to indicate transparency
          ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
          
          // Draw a subtle checkered pattern
          const squareSize = 20;
          ctx.fillStyle = 'rgba(240, 240, 240, 0.2)';
          
          for (let x = 0; x < canvasSize.width; x += squareSize) {
            for (let y = 0; y < canvasSize.height; y += squareSize) {
              if (((x / squareSize) + (y / squareSize)) % 2 === 0) {
                ctx.fillRect(x, y, squareSize, squareSize);
              }
            }
          }
          
          // Draw a subtle border to indicate the frame bounds
          ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          drawRoundedRect(ctx, 0, 0, canvasSize.width, canvasSize.height, frameConfig.borderRadius);
          ctx.stroke();
          
        } else {
          // Regular gradient background for non-transparent frames
          const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
          // Parse the background color to RGB components for gradient
          let bgColor = frameConfig.backgroundColor;
          let r, g, b;
          
          if (bgColor.startsWith('#')) {
            r = parseInt(bgColor.slice(1, 3), 16);
            g = parseInt(bgColor.slice(3, 5), 16);
            b = parseInt(bgColor.slice(5, 7), 16);
          } else {
            // Default if color format is not recognized
            r = 40; g = 44; b = 52; // Default dark color
          }
          
          // Create gradient with subtle variations of the background color
          bgGradient.addColorStop(0, `rgba(${r+15}, ${g+15}, ${b+15}, 1)`);
          bgGradient.addColorStop(0.5, bgColor);
          bgGradient.addColorStop(1, `rgba(${Math.max(0, r-15)}, ${Math.max(0, g-15)}, ${Math.max(0, b-15)}, 1)`);
          
          ctx.fillStyle = bgGradient;
          ctx.beginPath();
          drawRoundedRect(ctx, 0, 0, canvasSize.width, canvasSize.height, frameConfig.borderRadius);
          ctx.fill();
        }
      }
      
      if (frameConfig.shadowEnabled) {
        ctx.restore(); // Remove shadow for next elements
      }
      
      // ---------- Draw reel area with inner shadow effect ----------
      ctx.save();
      // Create inner shadow effect for reel area
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      drawRoundedRect(ctx, reelX, reelY, reelWidth, reelHeight, frameConfig.borderRadius / 2);
      ctx.fill();
      
      // Add subtle inner highlight to reel area
      const reelGradient = ctx.createLinearGradient(reelX, reelY, reelX, reelY + reelHeight);
      reelGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      reelGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      reelGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
      
      ctx.fillStyle = reelGradient;
      ctx.beginPath();
      drawRoundedRect(ctx, reelX, reelY, reelWidth, reelHeight, frameConfig.borderRadius / 2);
      ctx.fill();
      ctx.restore();
      
      // ---------- Draw symbols with enhanced visual effects ----------
      const cellWidth = reelWidth / 5;
      const cellHeight = reelHeight / 3;
      
      // Enhanced symbol colors with better visual appeal
      const symbolColors = [
        '#FF5252', // Red
        '#FFD740', // Yellow
        '#69F0AE', // Green
        '#448AFF', // Blue
        '#E040FB', // Purple
      ];
      
      // Get generated symbols from the store if available
      const generatedSymbols = config?.theme?.generated?.symbols || [];
      const hasGeneratedSymbols = generatedSymbols.length > 0;
      
      // Create and cache symbol images if we have them
      const symbolImages: HTMLImageElement[] = [];
      if (hasGeneratedSymbols) {
        // Attempt to use actual theme symbols if available
        for (let i = 0; i < Math.min(generatedSymbols.length, 15); i++) {
          const img = new Image();
          img.src = generatedSymbols[i];
          symbolImages.push(img);
        }
      }
      
      // Draw symbols
      for (let row = 0; row < 3; row++) {
        for (let reel = 0; reel < 5; reel++) {
          const x = reelX + reel * cellWidth + cellWidth / 2;
          const y = reelY + row * cellHeight + cellHeight / 2;
          const size = Math.min(cellWidth, cellHeight) * 0.8;
          
          // Add cell highlight effect (subtle gradient in each cell)
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.beginPath();
          ctx.rect(reelX + reel * cellWidth, reelY + row * cellHeight, cellWidth, cellHeight);
          ctx.fill();
          ctx.restore();
          
          // Try to use generated symbol images if available and loaded
          if (hasGeneratedSymbols && symbolImages.length > 0 && Math.random() > 0.4) {
            const symbolIndex = Math.floor(Math.random() * symbolImages.length);
            const symbolImg = symbolImages[symbolIndex];
            
            if (symbolImg.complete && symbolImg.naturalWidth !== 0) {
              // Draw the symbol image
              try {
                ctx.save();
                // Add a subtle shadow to the symbol
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                
                // Draw with proper centering and scaling
                const drawSize = size * 0.9; // Slightly smaller for better appearance
                ctx.drawImage(
                  symbolImg, 
                  x - drawSize/2, 
                  y - drawSize/2, 
                  drawSize, 
                  drawSize
                );
                ctx.restore();
                continue; // Skip the fallback shape drawing
              } catch (imgError) {
                console.error("Error drawing symbol image:", imgError);
                // Fall through to fallback shape drawing below
              }
            }
          }
          
          // Fallback: Draw enhanced symbols with Canvas
          ctx.save();
          
          // Generate a color with some randomness for visual interest
          const baseColor = symbolColors[Math.floor(Math.random() * symbolColors.length)];
          
          // Create radial gradient for symbol
          const symGradient = ctx.createRadialGradient(
            x, y, size * 0.1,
            x, y, size * 0.5
          );
          symGradient.addColorStop(0, lightenColor(baseColor, 20));
          symGradient.addColorStop(0.7, baseColor);
          symGradient.addColorStop(1, darkenColor(baseColor, 20));
          
          ctx.fillStyle = symGradient;
          ctx.globalAlpha = 0.9;
          
          // Add shadow to each symbol for depth
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 5;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          // Draw either a circle, star, diamond, or rounded square
          const symbolType = Math.floor(Math.random() * 4);
          
          switch(symbolType) {
            case 0: // Circle
              ctx.beginPath();
              ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
              ctx.fill();
              // Add highlight
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.beginPath();
              ctx.arc(x - size * 0.15, y - size * 0.15, size * 0.1, 0, Math.PI * 2);
              ctx.fill();
              break;
              
            case 1: // Star (simplified)
              drawStar(ctx, x, y, 5, size * 0.4, size * 0.2);
              break;
              
            case 2: // Diamond
              ctx.beginPath();
              ctx.moveTo(x, y - size * 0.4);
              ctx.lineTo(x + size * 0.4, y);
              ctx.lineTo(x, y + size * 0.4);
              ctx.lineTo(x - size * 0.4, y);
              ctx.closePath();
              ctx.fill();
              break;
              
            default: // Rounded square
              ctx.beginPath();
              drawRoundedRect(ctx, x - size * 0.4, y - size * 0.4, size * 0.8, size * 0.8, size * 0.15);
              ctx.fill();
              
              // Add highlight to top-left corner
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.beginPath();
              drawRoundedRect(ctx, x - size * 0.3, y - size * 0.3, size * 0.2, size * 0.2, size * 0.05);
              ctx.fill();
              break;
          }
          
          ctx.restore();
        }
      }
      
      // ---------- Draw enhanced grid lines with subtle glow ----------
      ctx.save();
      // Create subtle glow effect for grid lines
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.4)';
      ctx.lineWidth = 1;
      
      // Vertical grid lines with subtle fade effect
      for (let i = 1; i < 5; i++) {
        // Create vertical gradient for each line
        const lineGradient = ctx.createLinearGradient(0, reelY, 0, reelY + reelHeight);
        lineGradient.addColorStop(0, 'rgba(180, 180, 180, 0.3)');
        lineGradient.addColorStop(0.5, 'rgba(180, 180, 180, 0.6)');
        lineGradient.addColorStop(1, 'rgba(180, 180, 180, 0.3)');
        
        ctx.strokeStyle = lineGradient;
        ctx.beginPath();
        ctx.moveTo(reelX + i * cellWidth, reelY);
        ctx.lineTo(reelX + i * cellWidth, reelY + reelHeight);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let i = 1; i < 3; i++) {
        // Create horizontal gradient for each line
        const lineGradient = ctx.createLinearGradient(reelX, 0, reelX + reelWidth, 0);
        lineGradient.addColorStop(0, 'rgba(180, 180, 180, 0.3)');
        lineGradient.addColorStop(0.5, 'rgba(180, 180, 180, 0.6)');
        lineGradient.addColorStop(1, 'rgba(180, 180, 180, 0.3)');
        
        ctx.strokeStyle = lineGradient;
        ctx.beginPath();
        ctx.moveTo(reelX, reelY + i * cellHeight);
        ctx.lineTo(reelX + reelWidth, reelY + i * cellHeight);
        ctx.stroke();
      }
      ctx.restore();
      
      // ---------- Draw enhanced frame border with gradient and emboss effect ----------
      ctx.save();
      // Create gradient for border that matches the frame color but with subtle variation
      let borderColor = frameConfig.borderColor;
      let br, bg, bb;
      
      if (borderColor.startsWith('#')) {
        br = parseInt(borderColor.slice(1, 3), 16);
        bg = parseInt(borderColor.slice(3, 5), 16);
        bb = parseInt(borderColor.slice(5, 7), 16);
      } else {
        // Default if color format is not recognized
        br = 59; bg = 130; bb = 246; // Default blue color
      }
      
      // Create border gradient
      const borderGradient = ctx.createLinearGradient(0, 0, canvasSize.width, canvasSize.height);
      borderGradient.addColorStop(0, lightenColor(borderColor, 20));
      borderGradient.addColorStop(0.5, borderColor);
      borderGradient.addColorStop(1, darkenColor(borderColor, 20));
      
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = frameConfig.borderWidth;
      
      // Add subtle glow effect to border
      if (frameConfig.borderWidth > 2) {
        ctx.shadowColor = `rgba(${br}, ${bg}, ${bb}, 0.5)`;
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      ctx.beginPath();
      drawRoundedRect(ctx, 0, 0, canvasSize.width, canvasSize.height, frameConfig.borderRadius);
      ctx.stroke();
      ctx.restore();
      
      // ---------- Draw enhanced spin button with gradient, shadow, and highlight ----------
      const buttonRadius = frameConfig.buttons.size === 'large' ? 40 : 
                          frameConfig.buttons.size === 'medium' ? 30 : 20;
      const buttonX = canvasSize.width / 2;
      const buttonY = reelY + reelHeight + 50;
      
      ctx.save();
      
      // Parse button color for gradient
      let buttonColor = frameConfig.buttons.color;
      let btnR, btnG, btnB;
      
      if (buttonColor.startsWith('#')) {
        btnR = parseInt(buttonColor.slice(1, 3), 16);
        btnG = parseInt(buttonColor.slice(3, 5), 16);
        btnB = parseInt(buttonColor.slice(5, 7), 16);
      } else {
        // Default if color format is not recognized
        btnR = 59; btnG = 130; btnB = 246; // Default blue color
      }
      
      // Create button gradient
      const buttonGradient = ctx.createLinearGradient(
        buttonX, buttonY - buttonRadius,
        buttonX, buttonY + buttonRadius
      );
      buttonGradient.addColorStop(0, lightenColor(buttonColor, 15));
      buttonGradient.addColorStop(1, darkenColor(buttonColor, 15));
      
      // Add button shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      // Fill button shape
      ctx.fillStyle = buttonGradient;
      
      if (frameConfig.buttons.style === 'round') {
        ctx.beginPath();
        ctx.arc(buttonX, buttonY, buttonRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (frameConfig.buttons.style === 'square') {
        ctx.fillRect(buttonX - buttonRadius, buttonY - buttonRadius, buttonRadius * 2, buttonRadius * 2);
      } else {
        // Pill shape
        ctx.beginPath();
        drawRoundedRect(ctx, buttonX - buttonRadius * 1.5, buttonY - buttonRadius / 2, buttonRadius * 3, buttonRadius, buttonRadius / 2);
        ctx.fill();
      }
      
      // Add highlight to button (top edge highlight)
      if (frameConfig.buttons.style === 'round') {
        const highlightGradient = ctx.createRadialGradient(
          buttonX, buttonY - buttonRadius * 0.3, buttonRadius * 0.1,
          buttonX, buttonY, buttonRadius * 1.1
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(buttonX, buttonY, buttonRadius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Add highlight to other button shapes
        const buttonTop = frameConfig.buttons.style === 'square' 
          ? buttonY - buttonRadius 
          : buttonY - buttonRadius / 2;
        const buttonWidth = frameConfig.buttons.style === 'square'
          ? buttonRadius * 2
          : buttonRadius * 3;
        const buttonHeight = frameConfig.buttons.style === 'square'
          ? buttonRadius * 0.6
          : buttonRadius * 0.4;
          
        const highlightGradient = ctx.createLinearGradient(
          0, buttonTop,
          0, buttonTop + buttonHeight
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        
        if (frameConfig.buttons.style === 'square') {
          ctx.fillRect(buttonX - buttonRadius, buttonTop, buttonWidth, buttonHeight);
        } else {
          // Pill highlight
          ctx.beginPath();
          drawRoundedRect(ctx, 
            buttonX - buttonRadius * 1.45, 
            buttonTop + 1, 
            buttonRadius * 2.9, 
            buttonHeight, 
            buttonRadius / 3
          );
          ctx.fill();
        }
      }
      
      // Enhanced button text with slight shadow for readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.fillStyle = frameConfig.buttons.textColor;
      ctx.font = `bold ${
        frameConfig.buttons.size === 'large' ? 24 : 
        frameConfig.buttons.size === 'medium' ? 18 : 14
      }px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SPIN', buttonX, buttonY);
      ctx.restore();
      
      // ---------- Draw enhanced control buttons (simplified) ----------
      const addBetControls = () => {
        const controlsY = reelY + reelHeight + 50;
        const spacing = 100;
        
        // Button colors
        const controlButtonColor = frameConfig.buttons.color;
        
        // Helper function for control buttons
        const drawControlButton = (x: number, y: number, radius: number, label: string, isRound: boolean = true) => {
          // Button background
          ctx.save();
          
          // Create gradient
          const ctrlGradient = ctx.createLinearGradient(x, y - radius, x, y + radius);
          ctrlGradient.addColorStop(0, lightenColor(controlButtonColor, 10));
          ctrlGradient.addColorStop(1, darkenColor(controlButtonColor, 10));
          
          // Add shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 1;
          
          ctx.fillStyle = ctrlGradient;
          
          if (isRound) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add highlight to round button
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(x, y - radius * 0.3, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Rectangular button
            ctx.beginPath();
            drawRoundedRect(ctx, x - radius, y - radius/2, radius * 2, radius, 5);
            ctx.fill();
            
            // Add highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            drawRoundedRect(ctx, x - radius * 0.9, y - radius * 0.4, radius * 1.8, radius * 0.3, 3);
            ctx.fill();
          }
          
          // Button text
          ctx.fillStyle = frameConfig.buttons.textColor;
          ctx.font = isRound ? 'bold 20px Arial' : 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, x, y);
          ctx.restore();
        };
        
        // Draw simplified control buttons
        drawControlButton(buttonX - spacing * 1.5, controlsY, buttonRadius * 0.7, '-', true);
        
        // Bet display
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        drawRoundedRect(ctx, buttonX - spacing * 0.75 - 40, controlsY - 20, 80, 40, 5);
        ctx.fill();
        
        // Bet text with subtle glow
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = 2;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1.00', buttonX - spacing * 0.75, controlsY);
        ctx.restore();
        
        // Plus button
        drawControlButton(buttonX - spacing * 0.0, controlsY, buttonRadius * 0.7, '+', true);
        
        // Max bet button
        drawControlButton(buttonX + spacing * 0.75, controlsY, buttonRadius * 0.8, 'MAX BET', false);
        
        // Auto spin button
        drawControlButton(buttonX + spacing * 1.5, controlsY, buttonRadius * 0.8, 'AUTO', false);
      };
      
      // Draw control buttons
      addBetControls();
      
      // ---------- Draw enhanced win display with glow effect ----------
      ctx.save();
      // Win display background with gradient
      const winDisplayGradient = ctx.createLinearGradient(
        canvasSize.width / 2, reelY - 30 - 20,
        canvasSize.width / 2, reelY - 30 + 20
      );
      winDisplayGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      winDisplayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      
      ctx.fillStyle = winDisplayGradient;
      ctx.beginPath();
      drawRoundedRect(ctx, canvasSize.width / 2 - 100, reelY - 30 - 20, 200, 40, 5);
      ctx.fill();
      
      // Add subtle inner glow to win display
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Win text with glow effect
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 2;
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WIN: 0.00', canvasSize.width / 2, reelY - 30);
      ctx.restore();
      
    } catch (error) {
      console.error("Error rendering frame with Canvas API:", error);
      setErrorMessage("Failed to render frame with Canvas API. Please try a different browser.");
    }
  };
  
  // Helper function to draw a star shape
  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  };
  
  // Helper function to lighten a color
  const lightenColor = (color: string, amount: number): string => {
    if (!color.startsWith('#')) return color;
    
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Helper function to darken a color
  const darkenColor = (color: string, amount: number): string => {
    if (!color.startsWith('#')) return color;
    
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Helper function to draw rounded rectangles on Canvas
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number
  ) => {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  };
  
  // Update frame config when a preset is selected
  const applyPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    
    // Get the preset config and merge with the current config
    const preset = FRAME_PRESETS[presetName];
    if (preset) {
      setFrameConfig({
        ...frameConfig,
        ...preset,
        style: presetName as any
      });
    }
  };
  
  // Update a specific property in the frame config
  const updateFrameConfig = (property: string, value: any) => {
    setFrameConfig(prev => {
      // For nested properties like 'buttons.style'
      if (property.includes('.')) {
        const [parentProp, childProp] = property.split('.');
        return {
          ...prev,
          [parentProp]: {
            ...prev[parentProp as keyof FrameConfig],
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
  
  // Save the current frame config
  const saveFrameConfig = () => {
    updateConfig({
      frame: frameConfig
    });
    alert("Frame design has been saved to your game configuration!");
  };
  
  // Fallback content if PIXI fails to load or initialize
  if (errorMessage) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Frame className="w-6 h-6 text-blue-600" />
          Game Frame Designer
        </h2>
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
          <p className="text-amber-800">{errorMessage}</p>
          <p className="text-gray-600 mt-2">You can still configure the frame parameters below, but the preview may not display correctly.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Frame Settings</h3>
          
          {/* Style presets */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Style Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(FRAME_PRESETS).map(preset => (
                <button
                  key={preset}
                  className={`p-2 border rounded-lg text-sm capitalize transition-all
                    ${selectedPreset === preset 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'}`}
                  onClick={() => applyPreset(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
          
          {/* Basic color settings */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Background Color</label>
            <div className="flex items-center">
              <input
                type="color"
                value={frameConfig.backgroundColor}
                onChange={(e) => updateFrameConfig('backgroundColor', e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={frameConfig.backgroundColor}
                onChange={(e) => updateFrameConfig('backgroundColor', e.target.value)}
                className="ml-2 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Border Color</label>
            <div className="flex items-center">
              <input
                type="color"
                value={frameConfig.borderColor}
                onChange={(e) => updateFrameConfig('borderColor', e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={frameConfig.borderColor}
                onChange={(e) => updateFrameConfig('borderColor', e.target.value)}
                className="ml-2 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center mx-auto gap-2 mt-4"
            onClick={saveFrameConfig}
          >
            <Check className="w-4 h-4" />
            Save Frame Design
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Frame className="w-6 h-6 text-blue-600" />
        Game Frame Designer
      </h2>
      
      <p className="text-gray-600 mb-6">
        Design the frame for your slot machine. The frame surrounds your reels and defines the overall look of your game.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - Frame Customization */}
        <div className="lg:col-span-4 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-800">
            <Palette className="w-5 h-5 text-blue-600" />
            Frame Customization
          </h3>
          
          {/* Style carousel - 300x400px */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Style</label>
            <div className="relative">
              <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory py-2">
                <div className="flex space-x-4">
                  {Object.keys(FRAME_PRESETS).map(preset => (
                    <div 
                      key={preset}
                      className={`snap-center flex-shrink-0 w-[300px] h-[400px] rounded-lg transition-all cursor-pointer
                        ${selectedPreset === preset 
                          ? 'border-4 border-blue-500 shadow-lg' 
                          : 'border border-gray-300 hover:border-gray-400'}`}
                      onClick={() => applyPreset(preset)}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200">
                        <div className={`w-3/4 h-3/4 rounded-lg flex items-center justify-center`} 
                             style={{
                               backgroundColor: FRAME_PRESETS[preset].backgroundColor,
                               border: `${FRAME_PRESETS[preset].borderWidth}px solid ${FRAME_PRESETS[preset].borderColor}`,
                               borderRadius: `${FRAME_PRESETS[preset].borderRadius}px`,
                               boxShadow: FRAME_PRESETS[preset].shadowEnabled ? `0 0 ${FRAME_PRESETS[preset].shadowBlur}px ${FRAME_PRESETS[preset].shadowColor}` : 'none'
                             }}>
                          <span className="capitalize text-lg font-bold" style={{color: FRAME_PRESETS[preset].borderColor}}>
                            {preset}
                          </span>
                        </div>
                        <p className="mt-4 text-sm capitalize">{preset} Style</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-1 shadow">
                <button className="p-1 rounded-full hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-1 shadow">
                <button className="p-1 rounded-full hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Material carousel - 300x400px */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Material</label>
            <div className="relative">
              <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory py-2">
                <div className="flex space-x-4">
                  {['Gold', 'Silver', 'Bronze', 'Wood', 'Stone'].map(material => (
                    <div 
                      key={material}
                      className={`snap-center flex-shrink-0 w-[300px] h-[400px] rounded-lg transition-all cursor-pointer
                        border border-gray-300 hover:border-gray-400`}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200">
                        <div className="w-3/4 h-3/4 rounded-lg flex items-center justify-center" 
                             style={{
                               backgroundColor: material === 'Gold' ? '#FFD700' : 
                                              material === 'Silver' ? '#C0C0C0' :
                                              material === 'Bronze' ? '#CD7F32' :
                                              material === 'Wood' ? '#8B4513' : '#808080',
                               border: `2px solid ${material === 'Gold' ? '#B8860B' : 
                                                  material === 'Silver' ? '#A9A9A9' :
                                                  material === 'Bronze' ? '#8B4513' :
                                                  material === 'Wood' ? '#5D4037' : '#696969'}`
                             }}>
                          <span className="text-lg font-bold" style={{
                            color: material === 'Gold' ? '#000' : 
                                  material === 'Silver' ? '#000' :
                                  material === 'Bronze' ? '#FFF' :
                                  material === 'Wood' ? '#FFF' : '#FFF'
                          }}>
                            {material}
                          </span>
                        </div>
                        <p className="mt-4 text-sm">{material} Material</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-1 shadow">
                <button className="p-1 rounded-full hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-1 shadow">
                <button className="p-1 rounded-full hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Decoration selection - Two stacked thumbnails (200x200px each) */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Decoration</label>
            <div className="grid grid-cols-1 gap-4">
              {/* Minimal decoration thumbnail (200x200px) */}
              <div 
                className={`border ${frameConfig.decoration === 'minimal' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'} rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-all`}
                onClick={() => updateFrameConfig('decoration', 'minimal')}
              >
                <div className="w-full h-[200px] bg-white flex items-center justify-center relative">
                  {/* Using imported image */}
                  <img 
                    src={minimalDecoration} 
                    alt="Minimal Decoration" 
                    className="max-w-full max-h-full object-contain"
                  />
                  
                  {frameConfig.decoration === 'minimal' && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 z-10">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="p-2 text-center bg-white">
                  <p className="font-medium">Minimal</p>
                  <p className="text-xs text-gray-500">Clean design with minimal elements</p>
                </div>
              </div>
              
              {/* Decorated decoration thumbnail (200x200px) */}
              <div 
                className={`border ${frameConfig.decoration === 'decorated' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'} rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-all`}
                onClick={() => updateFrameConfig('decoration', 'decorated')}
              >
                <div className="w-full h-[200px] bg-white flex items-center justify-center relative">
                  {/* Using imported image */}
                  <img 
                    src={decoratedDecoration} 
                    alt="Decorated Style" 
                    className="max-w-full max-h-full object-contain"
                  />
                  
                  {frameConfig.decoration === 'decorated' && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 z-10">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="p-2 text-center bg-white">
                  <p className="font-medium">Decorated</p>
                  <p className="text-xs text-gray-500">Ornate with decorative elements</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Debug section - imported images */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-bold text-yellow-800 mb-2">Debug: Imported Images</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-yellow-700 mb-1">Imported Cartoon Style:</p>
                <div className="w-[200px] h-[200px] border border-yellow-300 bg-white flex items-center justify-center">
                  <img 
                    src={cartoonStyle} 
                    alt="Cartoon Style" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-yellow-700 mb-1">Imported Dark Style:</p>
                <div className="w-[200px] h-[200px] border border-yellow-300 bg-white flex items-center justify-center">
                  <img 
                    src={darkStyle} 
                    alt="Dark Style" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-yellow-700 mb-1">Imported Minimal Decoration:</p>
                <div className="w-[200px] h-[200px] border border-yellow-300 bg-white flex items-center justify-center">
                  <img 
                    src={minimalDecoration}
                    alt="Minimal Decoration" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-yellow-700 mb-1">External Reference:</p>
                <div className="w-[200px] h-[200px] border border-yellow-300 bg-white flex items-center justify-center">
                  <img 
                    src="https://via.placeholder.com/200" 
                    alt="External image" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Basic settings */}
          <div className="mb-4">
            <h4 className="font-bold text-gray-800 mb-2">Basic Settings</h4>
            
            <div className="mb-3">
              <label className="block text-gray-700 mb-1">Border Width</label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={frameConfig.borderWidth}
                  onChange={(e) => updateFrameConfig('borderWidth', parseInt(e.target.value))}
                  className="w-full mr-2"
                />
                <span className="w-10 text-center">{frameConfig.borderWidth}px</span>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-gray-700 mb-1">Border Radius</label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={frameConfig.borderRadius}
                  onChange={(e) => updateFrameConfig('borderRadius', parseInt(e.target.value))}
                  className="w-full mr-2"
                />
                <span className="w-10 text-center">{frameConfig.borderRadius}px</span>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-gray-700 mb-1">Border Color</label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={frameConfig.borderColor}
                  onChange={(e) => updateFrameConfig('borderColor', e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border border-gray-300"
                />
                <input
                  type="text"
                  value={frameConfig.borderColor}
                  onChange={(e) => updateFrameConfig('borderColor', e.target.value)}
                  className="ml-2 px-3 py-2 border rounded-lg w-full"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Middle column - Generate Frame section */}
        <div className="lg:col-span-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-md mb-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-800">
              <Image className="w-5 h-5 text-blue-600" />
              Generate Frame
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Describe the frame you want to generate and our AI will create it for you.
            </p>
            
            <div className="mb-4">
              <textarea
                placeholder="Describe the frame you want (e.g. 'Gold ornate slot machine frame with dragon motifs and red accents')"
                value={framePrompt}
                onChange={(e) => setFramePrompt(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 shadow-inner focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                disabled={generatingFrame}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 ${generatingFrame ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={generateFrameWithAI}
                disabled={generatingFrame || !framePrompt.trim()}
              >
                {generatingFrame ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>Generate Frame</span>
                  </>
                )}
              </button>
              
              <div className="text-xs text-gray-500">
                {generatingFrame ? 'This may take a moment...' : ''}
              </div>
            </div>
            
            {generatedFrameUrl && (
              <div className="mt-6 border border-gray-300 rounded-lg p-3 bg-white shadow">
                <p className="text-sm font-medium mb-2 text-gray-700">Generated Frame:</p>
                <img 
                  src={generatedFrameUrl} 
                  alt="AI Generated Frame" 
                  className="w-full h-auto rounded shadow-sm"
                />
                <div className="mt-3 flex justify-between">
                  <button
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1 shadow-sm"
                    onClick={() => {
                      updateFrameConfig('frameImage', generatedFrameUrl);
                      alert("Generated frame applied to your design!");
                    }}
                  >
                    <Check className="w-4 h-4" />
                    Apply to Frame
                  </button>
                  <button
                    className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-1 shadow-sm"
                    onClick={() => {
                      // Create a temporary anchor element to download the image
                      const a = document.createElement('a');
                      a.href = generatedFrameUrl;
                      a.download = 'generated-frame.png';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Advanced Settings */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Advanced Settings</h3>
            
            {/* Background settings */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Background</label>
              
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="transparentBackground"
                    checked={frameConfig.transparentBackground}
                    onChange={(e) => updateFrameConfig('transparentBackground', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="transparentBackground" className="text-gray-700 flex items-center">
                    Transparent Background
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Recommended for symbols</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Creates a transparent frame that will show the game background behind it, ideal for displaying your symbol grid cleanly.
                </p>
              </div>
              
              {!frameConfig.transparentBackground && (
                <div className="flex items-center">
                  <input
                    type="color"
                    value={frameConfig.backgroundColor}
                    onChange={(e) => updateFrameConfig('backgroundColor', e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={frameConfig.backgroundColor}
                    onChange={(e) => updateFrameConfig('backgroundColor', e.target.value)}
                    className="ml-2 px-3 py-2 border rounded-lg flex-grow"
                  />
                </div>
              )}
            </div>
            
            {/* Shadow settings */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="shadowEnabled"
                  checked={frameConfig.shadowEnabled}
                  onChange={(e) => updateFrameConfig('shadowEnabled', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="shadowEnabled" className="text-gray-700">Enable Shadow</label>
              </div>
              
              {frameConfig.shadowEnabled && (
                <>
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Shadow Blur</label>
                    <div className="flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={frameConfig.shadowBlur}
                        onChange={(e) => updateFrameConfig('shadowBlur', parseInt(e.target.value))}
                        className="w-full mr-2"
                      />
                      <span className="w-10 text-center">{frameConfig.shadowBlur}px</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-1">Shadow Color</label>
                    <div className="flex items-center">
                      <input
                        type="color"
                        value={frameConfig.shadowColor.replace('rgba', '#').split(',')[0]}
                        onChange={(e) => {
                          const color = e.target.value;
                          // Convert hex to rgba with transparency
                          const r = parseInt(color.substr(1, 2), 16);
                          const g = parseInt(color.substr(3, 2), 16);
                          const b = parseInt(color.substr(5, 2), 16);
                          updateFrameConfig('shadowColor', `rgba(${r},${g},${b},0.5)`);
                        }}
                        className="w-12 h-12 rounded cursor-pointer border border-gray-300"
                      />
                      <input
                        type="text"
                        value={frameConfig.shadowColor}
                        onChange={(e) => updateFrameConfig('shadowColor', e.target.value)}
                        className="ml-2 px-3 py-2 border rounded-lg flex-grow"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Button settings */}
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Button Settings</h4>
              
              <div className="mb-2">
                <label className="block text-gray-700 mb-1">Button Style</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className={`p-2 border rounded-full text-sm
                      ${frameConfig.buttons.style === 'round' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 hover:border-gray-400'}`}
                    onClick={() => updateFrameConfig('buttons.style', 'round')}
                  >
                    Round
                  </button>
                  
                  <button
                    className={`p-2 border rounded-lg text-sm
                      ${frameConfig.buttons.style === 'square' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 hover:border-gray-400'}`}
                    onClick={() => updateFrameConfig('buttons.style', 'square')}
                  >
                    Square
                  </button>
                  
                  <button
                    className={`p-2 border rounded-full text-sm
                      ${frameConfig.buttons.style === 'pill' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 hover:border-gray-400'}`}
                    onClick={() => updateFrameConfig('buttons.style', 'pill')}
                  >
                    Pill
                  </button>
                </div>
              </div>
              
              <div className="mb-2">
                <label className="block text-gray-700 mb-1">Button Size</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className={`p-2 border rounded-lg text-sm
                      ${frameConfig.buttons.size === 'small' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 hover:border-gray-400'}`}
                    onClick={() => updateFrameConfig('buttons.size', 'small')}
                  >
                    Small
                  </button>
                  
                  <button
                    className={`p-2 border rounded-lg text-sm
                      ${frameConfig.buttons.size === 'medium' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 hover:border-gray-400'}`}
                    onClick={() => updateFrameConfig('buttons.size', 'medium')}
                  >
                    Medium
                  </button>
                  
                  <button
                    className={`p-2 border rounded-lg text-sm
                      ${frameConfig.buttons.size === 'large' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 hover:border-gray-400'}`}
                    onClick={() => updateFrameConfig('buttons.size', 'large')}
                  >
                    Large
                  </button>
                </div>
              </div>
              
              <div className="mb-2">
                <label className="block text-gray-700 mb-1">Button Color</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={frameConfig.buttons.color}
                    onChange={(e) => updateFrameConfig('buttons.color', e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={frameConfig.buttons.color}
                    onChange={(e) => updateFrameConfig('buttons.color', e.target.value)}
                    className="ml-2 px-3 py-2 border rounded-lg flex-grow"
                  />
                </div>
              </div>
              
              <div className="mb-2">
                <label className="block text-gray-700 mb-1">Button Text Color</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={frameConfig.buttons.textColor}
                    onChange={(e) => updateFrameConfig('buttons.textColor', e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={frameConfig.buttons.textColor}
                    onChange={(e) => updateFrameConfig('buttons.textColor', e.target.value)}
                    className="ml-2 px-3 py-2 border rounded-lg flex-grow"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column - Frame Preview */}
        <div className="lg:col-span-4 bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Frame Preview
          </h3>
          
          <div className="mb-4 flex items-center gap-2">
            <button 
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setCanvasSize({ width: canvasSize.width - 50, height: canvasSize.height - 30 })}
              disabled={canvasSize.width <= 400}
            >
              <Minimize className="w-4 h-4" />
            </button>
            
            <span className="text-white">{canvasSize.width} x {canvasSize.height}</span>
            
            <button 
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setCanvasSize({ width: canvasSize.width + 50, height: canvasSize.height + 30 })}
              disabled={canvasSize.width >= 1000}
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative overflow-hidden rounded-lg shadow-lg bg-gray-900 mb-6">
            <canvas 
              ref={canvasRef} 
              width={canvasSize.width} 
              height={canvasSize.height}
              className="block"
            />
          </div>
          
          {/* Generated Frame info if applied */}
          {frameConfig.frameImage && (
            <div className="mb-6 bg-blue-900 bg-opacity-30 p-3 rounded-lg border border-blue-800 text-white w-full">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-blue-200 flex items-center gap-1">
                  <Image className="w-4 h-4 text-blue-400" />
                  AI Generated Frame Applied
                </h4>
                <button
                  className="text-red-400 text-xs hover:text-red-300"
                  onClick={() => updateFrameConfig('frameImage', undefined)}
                >
                  Remove
                </button>
              </div>
              <p className="text-xs text-blue-100">
                Your AI-generated frame is being used as the background. You can still customize other aspects of the frame appearance.
              </p>
            </div>
          )}
          
          <div className="text-center">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center mx-auto gap-2"
              onClick={saveFrameConfig}
            >
              <Check className="w-4 h-4" />
              Save Frame Design
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameFrameDesigner;