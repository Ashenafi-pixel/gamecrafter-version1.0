/**
 * Adaptive Button Detection System
 * Provides flexible button extraction and layout for tier 1 slot games
 */

interface ButtonInfo {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'circle' | 'square' | 'hexagon' | 'rounded' | 'irregular';
  centerX: number;
  centerY: number;
  aspectRatio: number;
  visualWeight: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface LayoutConstraints {
  containerWidth: number;
  containerHeight: number;
  minButtonSize: number;
  maxButtonSize: number;
  minSpacing: number;
  spinButtonRatio: number; // How much larger spin should be
}

export class AdaptiveButtonDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Detect buttons in an image using edge detection and clustering
   */
  async detectButtons(imageUrl: string): Promise<ButtonInfo[]> {
    const img = await this.loadImage(imageUrl);
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);

    const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
    const regions = this.findButtonRegions(imageData);
    const buttons = this.analyzeRegions(regions, imageData);

    return this.assignButtonNames(buttons);
  }

  /**
   * Find distinct button regions using edge detection
   */
  private findButtonRegions(imageData: ImageData): Array<{x: number, y: number, width: number, height: number}> {
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;
    const visited = new Array(width * height).fill(false);
    const regions: Array<{x: number, y: number, width: number, height: number}> = [];

    // Simple flood fill to find connected components
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x);
        const pixelIdx = idx * 4;
        
        // Check if pixel is non-transparent and not visited
        if (pixels[pixelIdx + 3] > 128 && !visited[idx]) {
          const region = this.floodFill(imageData, x, y, visited);
          
          // Filter out very small regions (noise)
          if (region.width > 30 && region.height > 30) {
            regions.push(region);
          }
        }
      }
    }

    return this.mergeCloseRegions(regions);
  }

  /**
   * Flood fill to find connected component
   */
  private floodFill(imageData: ImageData, startX: number, startY: number, visited: boolean[]): {x: number, y: number, width: number, height: number} {
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;
    const stack: [number, number][] = [[startX, startY]];
    
    let minX = startX, maxX = startX;
    let minY = startY, maxY = startY;

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx]) {
        continue;
      }

      const pixelIdx = idx * 4;
      if (pixels[pixelIdx + 3] < 128) { // Transparent pixel
        continue;
      }

      visited[idx] = true;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      // Check 8 neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          stack.push([x + dx, y + dy]);
        }
      }
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  /**
   * Merge regions that are very close (likely same button)
   */
  private mergeCloseRegions(regions: Array<{x: number, y: number, width: number, height: number}>): Array<{x: number, y: number, width: number, height: number}> {
    const merged: Array<{x: number, y: number, width: number, height: number}> = [];
    const used = new Array(regions.length).fill(false);

    for (let i = 0; i < regions.length; i++) {
      if (used[i]) continue;
      
      let current = { ...regions[i] };
      used[i] = true;

      // Check if any other region is close enough to merge
      for (let j = i + 1; j < regions.length; j++) {
        if (used[j]) continue;

        const other = regions[j];
        const distance = Math.sqrt(
          Math.pow(current.x + current.width/2 - other.x - other.width/2, 2) +
          Math.pow(current.y + current.height/2 - other.y - other.height/2, 2)
        );

        // If centers are close, merge
        if (distance < 50) {
          const minX = Math.min(current.x, other.x);
          const minY = Math.min(current.y, other.y);
          const maxX = Math.max(current.x + current.width, other.x + other.width);
          const maxY = Math.max(current.y + current.height, other.y + other.height);
          
          current = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
          };
          used[j] = true;
        }
      }

      merged.push(current);
    }

    return merged;
  }

  /**
   * Analyze regions to determine button properties
   */
  private analyzeRegions(regions: Array<{x: number, y: number, width: number, height: number}>, imageData: ImageData): ButtonInfo[] {
    return regions.map((region, index) => {
      const shape = this.detectShape(region, imageData);
      const visualWeight = this.calculateVisualWeight(region, imageData);
      
      return {
        name: `button_${index}`,
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
        shape,
        centerX: region.x + region.width / 2,
        centerY: region.y + region.height / 2,
        aspectRatio: region.width / region.height,
        visualWeight,
        boundingBox: region
      };
    });
  }

  /**
   * Detect button shape based on pixel distribution
   */
  private detectShape(region: {x: number, y: number, width: number, height: number}, imageData: ImageData): ButtonInfo['shape'] {
    const { x, y, width, height } = region;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.min(width, height) / 2;
    
    let circularPixels = 0;
    let totalPixels = 0;

    // Sample pixels to determine shape
    for (let py = y; py < y + height; py += 2) {
      for (let px = x; px < x + width; px += 2) {
        const idx = (py * imageData.width + px) * 4;
        if (imageData.data[idx + 3] > 128) {
          totalPixels++;
          const dist = Math.sqrt(Math.pow(px - centerX, 2) + Math.pow(py - centerY, 2));
          if (dist <= radius * 1.1) {
            circularPixels++;
          }
        }
      }
    }

    const circularRatio = circularPixels / totalPixels;
    const aspectRatio = width / height;

    // Determine shape based on metrics
    if (circularRatio > 0.85) {
      return 'circle';
    } else if (Math.abs(aspectRatio - 1) < 0.1 && circularRatio < 0.7) {
      return 'square';
    } else if (circularRatio > 0.7) {
      return 'rounded';
    } else {
      return 'irregular';
    }
  }

  /**
   * Calculate visual weight (how prominent the button is)
   */
  private calculateVisualWeight(region: {x: number, y: number, width: number, height: number}, imageData: ImageData): number {
    const { x, y, width, height } = region;
    let brightness = 0;
    let pixels = 0;

    for (let py = y; py < y + height; py += 4) {
      for (let px = x; px < x + width; px += 4) {
        const idx = (py * imageData.width + px) * 4;
        if (imageData.data[idx + 3] > 128) {
          const r = imageData.data[idx];
          const g = imageData.data[idx + 1];
          const b = imageData.data[idx + 2];
          brightness += (r + g + b) / 3;
          pixels++;
        }
      }
    }

    const avgBrightness = brightness / pixels / 255;
    const sizeWeight = (width * height) / (imageData.width * imageData.height);
    
    return avgBrightness * 0.3 + sizeWeight * 0.7;
  }

  /**
   * Assign button names based on position and size
   */
  private assignButtonNames(buttons: ButtonInfo[]): ButtonInfo[] {
    // Sort by visual weight and position
    const sorted = [...buttons].sort((a, b) => {
      // Largest button is likely spin
      const sizeDiff = (b.width * b.height) - (a.width * a.height);
      if (Math.abs(sizeDiff) > 1000) return sizeDiff;
      
      // Otherwise sort by position (top to bottom, left to right)
      if (Math.abs(a.centerY - b.centerY) > 50) {
        return a.centerY - b.centerY;
      }
      return a.centerX - b.centerX;
    });

    // Assign names based on common patterns
    const names = ['spinButton', 'autoplayButton', 'menuButton', 'soundButton', 'settingsButton'];
    
    return sorted.slice(0, 5).map((button, index) => ({
      ...button,
      name: names[index] || `button_${index}`
    }));
  }

  /**
   * Calculate optimal layout for detected buttons
   */
  calculateOptimalLayout(buttons: ButtonInfo[], constraints: LayoutConstraints): Array<{name: string, x: number, y: number, scale: number}> {
    const { containerWidth, containerHeight, minButtonSize, maxButtonSize, minSpacing, spinButtonRatio } = constraints;
    
    // Sort buttons by importance (spin button first)
    const sortedButtons = [...buttons].sort((a, b) => {
      if (a.name === 'spinButton') return -1;
      if (b.name === 'spinButton') return 1;
      
      // Order: spin, autoplay, menu, sound, settings
      const order = ['spinButton', 'autoplayButton', 'menuButton', 'soundButton', 'settingsButton'];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });

    // Calculate sizes based on button importance
    const spinButton = sortedButtons.find(b => b.name === 'spinButton');
    const isSpinButton = (name: string) => name === 'spinButton';
    
    // Calculate total space needed
    const buttonCount = buttons.length;
    const totalSpacing = minSpacing * (buttonCount + 1);
    const availableWidth = containerWidth - totalSpacing - 300; // Reserve space for balance/win displays
    
    // Calculate button sizes - increased for better visibility
    const spinSize = Math.min(containerHeight * 0.95, maxButtonSize * spinButtonRatio);
    const regularSize = Math.min(containerHeight * 0.8, maxButtonSize);
    
    // Layout array
    const layout: Array<{name: string, x: number, y: number, scale: number}> = [];
    
    // Center region for buttons (accounting for balance/win displays on sides)
    const centerRegionStart = 150; // After balance display
    const centerRegionEnd = containerWidth - 150; // Before win display
    const centerRegionWidth = centerRegionEnd - centerRegionStart;
    
    // Calculate positions to distribute buttons evenly across the UI bar
    // Layout strategy: [sound] [autoplay] [SPIN] [menu] [settings]
    const buttonOrder = ['soundButton', 'autoplayButton', 'spinButton', 'menuButton', 'settingsButton'];
    const buttonSizes = {
      spinButton: spinSize,
      autoplayButton: regularSize,
      menuButton: regularSize,
      soundButton: regularSize * 0.8,
      settingsButton: regularSize * 0.8
    };
    
    // Calculate total width needed
    let totalButtonWidth = 0;
    buttonOrder.forEach(name => {
      if (sortedButtons.find(b => b.name === name)) {
        totalButtonWidth += buttonSizes[name as keyof typeof buttonSizes] || regularSize;
      }
    });
    
    // Calculate spacing between buttons
    const remainingWidth = centerRegionWidth - totalButtonWidth;
    const spacing = Math.max(minSpacing, remainingWidth / (buttonOrder.length + 1));
    
    // Position buttons
    let currentX = centerRegionStart + spacing;
    
    buttonOrder.forEach((buttonName) => {
      const button = sortedButtons.find(b => b.name === buttonName);
      if (!button) return;
      
      const size = buttonSizes[buttonName as keyof typeof buttonSizes] || regularSize;
      const scale = size / Math.max(button.width, button.height);
      
      // Ensure scale doesn't make buttons too large
      const finalScale = Math.min(scale, 1.2);
      
      // Position button at currentX + half its scaled width
      const x = currentX + (size / 2);
      
      layout.push({
        name: button.name,
        x: x,
        y: containerHeight / 2,
        scale: finalScale
      });
      
      // Move currentX for next button
      currentX += size + spacing;
    });
    
    return layout;
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}

export const adaptiveButtonDetector = new AdaptiveButtonDetector();