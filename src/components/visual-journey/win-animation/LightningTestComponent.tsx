import React, { useState, useEffect, useRef } from 'react';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';

interface LightningTestProps {
  canvasWidth?: number;
  canvasHeight?: number;
  intensity?: number;
  particleCount?: number;
  color?: string;
  secondaryColor?: string;
  glowEnabled?: boolean;
  glowIntensity?: number;
  shakeEnabled?: boolean;
  shakeIntensity?: number;
}

const LightningTestComponent: React.FC<LightningTestProps> = ({ 
  canvasWidth = 800, 
  canvasHeight = 480,
  intensity = 7,
  particleCount = 100,
  color = '#4FC3F7',
  secondaryColor = '#039BE5',
  glowEnabled = true,
  glowIntensity = 8,
  shakeEnabled = true,
  shakeIntensity = 5
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [winSize, setWinSize] = useState<'small' | 'medium' | 'big'>('medium');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const effectImages = useRef<HTMLImageElement[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lightningPathsRef = useRef<LightningPath[]>([]);
  const assetsLoadedRef = useRef<boolean>(false);
  
  // Interface for particle objects
  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    size: number;
    image: HTMLImageElement | null;
    rotation: number;
    rotationSpeed: number;
    fadeSpeed: number;
    color?: string; // Fallback color if no image
  }
  
  // Interface for lightning path segments
  interface LightningPath {
    points: {x: number, y: number}[];
    width: number;
    alpha: number;
    color: string;
    fadeSpeed: number;
  }

  // Load lightning particle images
  useEffect(() => {
    const loadImages = async () => {
      try {
        const imageUrls = [
          '/assets/effects/lightning_particle1.png',
          '/assets/effects/lightning_particle2.png',
          '/assets/effects/lightning_particle3.png',
          '/assets/effects/lightning_particle4.png'
        ];
        
        const loadedImages: HTMLImageElement[] = [];
        
        for (const url of imageUrls) {
          const img = new Image();
          img.src = url;
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = () => {
              console.warn(`Failed to load image: ${url}`);
              resolve(null); 
            };
            
            // Also resolve if image is already loaded
            if (img.complete) resolve(null);
          });
          
          if (img.complete) {
            loadedImages.push(img);
          }
        }
        
        console.log(`Loaded ${loadedImages.length} lightning particle images`);
        effectImages.current = loadedImages;
        assetsLoadedRef.current = true;
      } catch (error) {
        console.error("Error loading particle images:", error);
        assetsLoadedRef.current = true; // Continue without images
      }
    };
    
    loadImages();
    
    return () => {
      // Clean up animation frame on unmount
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  // Create a lightning effect between two points
  const createLightningBetween = (
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number,
    complexity: number = 6,
    displacementFactor: number = 100,
    color: string = '#4FC3F7'
  ) => {
    // Generate a lightning path with recursively subdivided segments
    const generateLightningPoints = (
      x1: number, y1: number, 
      x2: number, y2: number, 
      displacementFactor: number,
      iterations: number
    ): {x: number, y: number}[] => {
      if (iterations <= 0) {
        return [{x: x1, y: y1}, {x: x2, y: y2}];
      }
      
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      // Random displacement perpendicular to the line segment
      const dx = x2 - x1;
      const dy = y2 - y1;
      
      // Calculate perpendicular displacement
      const length = Math.sqrt(dx * dx + dy * dy);
      const displacement = (Math.random() - 0.5) * displacementFactor * (length / 100);
      
      // Avoid division by zero
      if (length < 0.01) {
        return [{x: x1, y: y1}, {x: x2, y: y2}];
      }
      
      // Calculate perpendicular vector
      const perpX = -dy / length;
      const perpY = dx / length;
      
      // Apply displacement
      const newMidX = midX + perpX * displacement;
      const newMidY = midY + perpY * displacement;
      
      // Recursively generate the two half-segments
      const firstHalf = generateLightningPoints(x1, y1, newMidX, newMidY, displacementFactor * 0.8, iterations - 1);
      const secondHalf = generateLightningPoints(newMidX, newMidY, x2, y2, displacementFactor * 0.8, iterations - 1);
      
      // Combine the two half-segments (without duplicating the middle point)
      return [...firstHalf.slice(0, -1), ...secondHalf];
    };
    
    // Generate the lightning path
    const points = generateLightningPoints(startX, startY, endX, endY, displacementFactor, complexity);
    
    // Create a lightning path object
    const lightningPath: LightningPath = {
      points,
      width: Math.random() * 3 + 2, // Random width
      alpha: Math.random() * 0.4 + 0.6, // Random initial alpha
      color,
      fadeSpeed: Math.random() * 0.03 + 0.02 // Random fade speed
    };
    
    lightningPathsRef.current.push(lightningPath);
    
    // Add particles along the lightning path
    const segmentCount = points.length - 1;
    for (let i = 0; i < segmentCount; i += 2) {
      // Add random particles along each segment
      const segStartX = points[i].x;
      const segStartY = points[i].y;
      const segEndX = points[Math.min(i + 1, points.length - 1)].x;
      const segEndY = points[Math.min(i + 1, points.length - 1)].y;
      
      // Add 1-3 particles per segment
      const particleCount = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < particleCount; j++) {
        // Random position along the segment
        const t = Math.random();
        const x = segStartX + (segEndX - segStartX) * t;
        const y = segStartY + (segEndY - segStartY) * t;
        
        addParticle(x, y, color);
      }
    }
  };

  // Add a particle at a specific position
  const addParticle = (x: number, y: number, color: string = '#4FC3F7') => {
    let particleImage: HTMLImageElement | null = null;
    
    // Try to use an image if available
    if (effectImages.current.length > 0) {
      const imageIndex = Math.floor(Math.random() * effectImages.current.length);
      particleImage = effectImages.current[imageIndex];
    }
    
    // Create a new particle with random properties
    const particle: Particle = {
      x,
      y,
      vx: (Math.random() - 0.5) * 4, // Random velocity
      vy: (Math.random() - 0.5) * 4 - 1, // Slight upward bias
      alpha: Math.random() * 0.5 + 0.5, // Random alpha
      size: Math.random() * 20 + 10, // Random size
      image: particleImage,
      rotation: Math.random() * Math.PI * 2, // Random rotation
      rotationSpeed: (Math.random() - 0.5) * 0.2, // Random rotation speed
      fadeSpeed: Math.random() * 0.02 + 0.01, // Random fade speed
      color // Fallback color if no image
    };
    
    particlesRef.current.push(particle);
  };

  // Create a lightning effect based on win size and provided parameters
  const createLightningEffect = () => {
    // Clear previous particles and paths
    particlesRef.current = [];
    lightningPathsRef.current = [];
    
    // Get canvas dimensions
    const width = canvasWidth;
    const height = canvasHeight;
    
    // Define win line position (middle of canvas)
    const lineY = height / 2;
    const lineStartX = width * 0.2;
    const lineEndX = width * 0.8;
    
    // Determine lightning parameters based on win size and provided props
    let branchCount: number;
    let branchComplexity: number;
    let actualParticleCount: number;
    let mainColor: string = color;
    let actualSecondaryColor: string = secondaryColor;
    
    // Scale parameters based on win size but influenced by props
    switch (winSize) {
      case 'small':
        branchCount = Math.max(2, Math.floor(intensity * 0.4));
        branchComplexity = Math.max(3, Math.floor(intensity * 0.5));
        actualParticleCount = Math.floor(particleCount * 0.7);
        break;
      case 'medium':
        branchCount = Math.max(3, Math.floor(intensity * 0.7));
        branchComplexity = Math.max(4, Math.floor(intensity * 0.7));
        actualParticleCount = particleCount;
        break;
      case 'big':
        branchCount = Math.max(5, Math.floor(intensity * 1.1));
        branchComplexity = Math.max(5, Math.floor(intensity * 0.8));
        actualParticleCount = Math.floor(particleCount * 1.5);
        mainColor = secondaryColor; // Use more intense color for big wins
        break;
      default:
        branchCount = Math.max(3, Math.floor(intensity * 0.7));
        branchComplexity = Math.max(4, Math.floor(intensity * 0.7));
        actualParticleCount = particleCount;
    }
    
    // Create main lightning path along win line
    createLightningBetween(lineStartX, lineY, lineEndX, lineY, branchComplexity, 40 * (intensity / 7), mainColor);
    
    // Create additional lightning branches
    for (let i = 0; i < branchCount; i++) {
      // Random position along the main path
      const startX = lineStartX + (lineEndX - lineStartX) * Math.random();
      const startY = lineY;
      
      // Random endpoint
      const angle = Math.random() * Math.PI * 1.5 - Math.PI * 0.75; // Random angle
      const length = Math.random() * 100 + 50 * (intensity / 7);
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;
      
      // Alternate between primary and secondary colors
      const branchColor = i % 2 === 0 ? mainColor : actualSecondaryColor;
      createLightningBetween(startX, startY, endX, endY, branchComplexity - 1, 50 * (intensity / 7), branchColor);
    }
    
    // Add particles proportional to particleCount setting
    const particlesPerBranch = Math.max(5, Math.floor(actualParticleCount / (branchCount + 1)));
    
    // Add particles along main path
    for (let i = 0; i < particlesPerBranch; i++) {
      const x = lineStartX + (lineEndX - lineStartX) * Math.random();
      const y = lineY + (Math.random() - 0.5) * 30;
      addParticle(x, y, mainColor);
    }
    
    // Add extra particles for big wins
    if (winSize === 'big' || intensity > 8) {
      const extraParticles = Math.floor(particlesPerBranch * 1.5);
      for (let i = 0; i < extraParticles; i++) {
        const x = lineStartX + (lineEndX - lineStartX) * Math.random();
        const y = lineY + (Math.random() - 0.5) * 80;
        addParticle(x, y, actualSecondaryColor);
      }
    }
    
    // Create a flash effect for the entire canvas if glow is enabled
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && glowEnabled) {
      // Flash effect with fade out, intensity based on glowIntensity
      const flashAlpha = Math.min(0.7, glowIntensity / 10);
      let flashColor = color.replace('#', '');
      // Extract RGB components
      const r = parseInt(flashColor.substring(0, 2), 16);
      const g = parseInt(flashColor.substring(2, 4), 16);
      const b = parseInt(flashColor.substring(4, 6), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Add screen shake if enabled
    if (shakeEnabled && canvasRef.current) {
      // Scale shake based on win size and shakeIntensity
      let actualIntensity = shakeIntensity;
      if (winSize === 'small') actualIntensity *= 0.5;
      if (winSize === 'big') actualIntensity *= 1.5;
      
      const shakeX = (Math.random() - 0.5) * actualIntensity;
      const shakeY = (Math.random() - 0.5) * actualIntensity;
      canvasRef.current.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
      
      // Reset shake after a short delay
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.style.transform = 'translate(0, 0)';
        }
      }, 100);
    }
  };

  // Animation loop to update and render all effects
  const animate = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw a darker background with a gradient for contrast
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw a simulated slot machine grid to visualize win lines
    drawSlotGrid(ctx);
    
    // Update and draw lightning paths
    lightningPathsRef.current.forEach((path, index) => {
      // Fade out the path
      path.alpha -= path.fadeSpeed;
      
      // Remove paths that have faded out
      if (path.alpha <= 0) {
        lightningPathsRef.current.splice(index, 1);
        return;
      }
      
      // Draw the path
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.globalAlpha = path.alpha;
      
      if (path.points.length > 0) {
        ctx.moveTo(path.points[0].x, path.points[0].y);
        path.points.slice(1).forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
      }
      
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    
    // Update and draw particles
    particlesRef.current.forEach((particle, index) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Apply a slight gravity effect
      particle.vy += 0.05;
      
      // Fade out
      particle.alpha -= particle.fadeSpeed;
      
      // Update rotation
      particle.rotation += particle.rotationSpeed;
      
      // Remove particles that have faded out
      if (particle.alpha <= 0) {
        particlesRef.current.splice(index, 1);
        return;
      }
      
      // Draw the particle
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      
      if (particle.image && particle.image.complete) {
        // Draw image with proper centering
        ctx.drawImage(
          particle.image, 
          -particle.size / 2, 
          -particle.size / 2, 
          particle.size, 
          particle.size
        );
      } else {
        // Fallback to drawing a glowing circle if image isn't available
        const glow = ctx.createRadialGradient(
          0, 0, 0,
          0, 0, particle.size / 2
        );
        glow.addColorStop(0, particle.color || '#4FC3F7');
        glow.addColorStop(1, 'rgba(79, 195, 247, 0)');
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
    
    // Continue animation if playing or if there are still active elements
    if (isPlaying || particlesRef.current.length > 0 || lightningPathsRef.current.length > 0) {
      animationFrameId.current = requestAnimationFrame(animate);
    } else {
      animationFrameId.current = null;
    }
  };

  // Draw a simulated slot machine grid
  const drawSlotGrid = (ctx: CanvasRenderingContext2D) => {
    // Draw 5x3 grid with symbol outlines
    const symbolWidth = 80;
    const symbolHeight = 80;
    const spacing = 10;
    const cols = 5;
    const rows = 3;
    
    const gridWidth = cols * (symbolWidth + spacing) - spacing;
    const gridHeight = rows * (symbolHeight + spacing) - spacing;
    
    const startX = (canvasWidth - gridWidth) / 2;
    const startY = (canvasHeight - gridHeight) / 2;
    
    ctx.strokeStyle = '#6c7b95';
    ctx.lineWidth = 1;
    
    // Draw horizontal win line for active wins
    ctx.save();
    const winLineY = startY + (symbolHeight + spacing) * Math.floor(rows / 2);
    
    // Fill win line with a gradient
    const lineGradient = ctx.createLinearGradient(startX, winLineY, startX + gridWidth, winLineY);
    lineGradient.addColorStop(0, 'rgba(79, 195, 247, 0.1)');
    lineGradient.addColorStop(0.5, 'rgba(79, 195, 247, 0.3)');
    lineGradient.addColorStop(1, 'rgba(79, 195, 247, 0.1)');
    
    ctx.fillStyle = lineGradient;
    ctx.fillRect(startX, winLineY - 40, gridWidth, 80);
    ctx.restore();
    
    // Draw individual symbols
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * (symbolWidth + spacing);
        const y = startY + row * (symbolHeight + spacing);
        
        // Determine if this symbol is part of the winning line
        const isWinning = row === Math.floor(rows / 2);
        
        // Draw symbol background
        ctx.fillStyle = isWinning ? '#3a4161' : '#22293c';
        ctx.fillRect(x, y, symbolWidth, symbolHeight);
        
        // Draw symbol border
        ctx.strokeStyle = isWinning ? '#4FC3F7' : '#6c7b95';
        ctx.strokeRect(x, y, symbolWidth, symbolHeight);
        
        // Draw "A" symbol outline as placeholder
        if (isWinning) {
          ctx.font = 'bold 36px Arial';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('A', x + symbolWidth / 2, y + symbolHeight / 2);
        } else {
          ctx.font = 'bold 36px Arial';
          ctx.fillStyle = '#aaa';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Use different letters for different positions
          const symbols = ['K', 'Q', 'J', '10'];
          const symbolIndex = (row * cols + col) % symbols.length;
          ctx.fillText(symbols[symbolIndex], x + symbolWidth / 2, y + symbolHeight / 2);
        }
      }
    }
  };

  // Start the animation
  const playAnimation = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    // Clear any existing animation frame
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    // Create a new lightning effect
    createLightningEffect();
    
    // Start the animation loop
    animationFrameId.current = requestAnimationFrame(animate);
    
    // Auto stop after a duration
    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
  };

  // Stop the animation
  const stopAnimation = () => {
    setIsPlaying(false);
  };

  // Reset the animation
  const resetAnimation = () => {
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    particlesRef.current = [];
    lightningPathsRef.current = [];
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      drawSlotGrid(ctx);
    }
    
    setIsPlaying(false);
  };

  useEffect(() => {
    // Initialize the canvas when the component mounts
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Draw initial slot grid
        drawSlotGrid(ctx);
      }
    }
  }, [canvasWidth, canvasHeight]);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        <canvas 
          ref={canvasRef} 
          width={canvasWidth} 
          height={canvasHeight}
          className="w-full"
        />
      </div>
      
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={playAnimation}
            disabled={isPlaying}
            className={`px-4 py-2 rounded flex items-center gap-1 ${
              isPlaying 
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Play className="w-4 h-4" />
            Play Animation
          </button>
          
          <button
            onClick={stopAnimation}
            disabled={!isPlaying}
            className={`px-4 py-2 rounded flex items-center gap-1 ${
              !isPlaying 
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <Pause className="w-4 h-4" />
            Stop
          </button>
          
          <button
            onClick={resetAnimation}
            className="px-4 py-2 rounded flex items-center gap-1 bg-gray-600 text-white hover:bg-gray-700"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setWinSize('small')}
            className={`px-3 py-1 rounded text-sm ${
              winSize === 'small' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Small Win
          </button>
          
          <button
            onClick={() => setWinSize('medium')}
            className={`px-3 py-1 rounded text-sm ${
              winSize === 'medium' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Medium Win
          </button>
          
          <button
            onClick={() => setWinSize('big')}
            className={`px-3 py-1 rounded text-sm ${
              winSize === 'big' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Big Win
          </button>
        </div>
      </div>
    </div>
  );
};

export default LightningTestComponent;