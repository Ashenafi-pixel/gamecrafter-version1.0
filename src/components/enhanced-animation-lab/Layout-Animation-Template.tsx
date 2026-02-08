// Layout Template Definitions
interface LayoutTemplate {
  id: 'text-top' | 'text-bottom' | 'text-overlay';
  name: string;
  description: string;
  icon: string;
  applyLayout: (sprites: any[], workspaceWidth: number, workspaceHeight: number) => any[];
}

// Animation Template Definitions  
interface AnimationTemplate {
  id: 'bounce' | 'pulse' | 'glow' | 'rotate' | 'shake' | 'sparkle' | 'flash' | 'wave';
  name: string;
  description: string;
  icon: string;
  duration: number;
  applyAnimation: (sprites: any[]) => void;
}

// Layout Template Configurations
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'text-top',
    name: 'Text on Top',
    description: 'Text above, symbol below',
    icon: '🔤',
    applyLayout: (sprites, workspaceWidth, workspaceHeight) => {
      const symbolSprites = sprites.filter(s => s.type === 'symbol' || s.type === 'element');
      const letterSprites = sprites.filter(s => s.type === 'letter');

      const result = [];

      // Enhanced layout zones: 30% text, 3% gap, 67% symbol
      const zones = {
        textZone: 0.30,
        gapZone: 0.03,
        symbolZone: 0.67
      };

      // Position letters in the top 30% zone
      if (letterSprites.length > 0) {
        const textZoneHeight = workspaceHeight * zones.textZone;
        const maxLetterHeight = textZoneHeight * 0.8; // Use 80% of text zone height
        const letterSpacing = Math.max(workspaceWidth * 0.05, 20); // Minimum 5% spacing or 20px

        // Calculate total width needed with proper spacing
        const totalLetterWidth = letterSprites.reduce((total, sprite) => {
          const validHeight = (sprite.height && !isNaN(sprite.height) && sprite.height > 0) ? sprite.height : 50;
          const validWidth = (sprite.width && !isNaN(sprite.width) && sprite.width > 0) ? sprite.width : 50;
          const scaledHeight = Math.min(maxLetterHeight, validHeight);
          const scaledWidth = (validWidth / validHeight) * scaledHeight;
          return total + scaledWidth;
        }, 0);
        const totalSpacingWidth = (letterSprites.length - 1) * letterSpacing;
        const totalTextWidth = totalLetterWidth + totalSpacingWidth;

        let currentX = (workspaceWidth - totalTextWidth) / 2;
        const textY = textZoneHeight * 0.5; // Center vertically in text zone

        // Position each letter with proper spacing
        letterSprites.forEach((sprite, index) => {
          const validHeight = (sprite.height && !isNaN(sprite.height) && sprite.height > 0) ? sprite.height : 50;
          const validWidth = (sprite.width && !isNaN(sprite.width) && sprite.width > 0) ? sprite.width : 50;
          const scaledHeight = Math.min(maxLetterHeight, validHeight);
          const scaledWidth = (validWidth / validHeight) * scaledHeight;

          console.log(`📐 text-top letter ${index}: positioned at (${currentX}, ${textY}) with size ${scaledWidth}x${scaledHeight}`);

          result.push({
            ...sprite,
            x: currentX,
            y: textY - (scaledHeight / 2), // Center vertically
            width: scaledWidth,
            height: scaledHeight
          });

          currentX += scaledWidth + letterSpacing;
        });
      }

      // Position symbol in the bottom 67% zone (after 30% text + 3% gap)
      symbolSprites.forEach((sprite, index) => {
        const symbolZoneStart = workspaceHeight * (zones.textZone + zones.gapZone);
        const symbolZoneHeight = workspaceHeight * zones.symbolZone;
        const maxSymbolSize = Math.min(workspaceWidth * 0.6, symbolZoneHeight * 0.8);

        // Validate sprite dimensions
        const validWidth = (sprite.width && !isNaN(sprite.width) && sprite.width > 0) ? sprite.width : 100;
        const validHeight = (sprite.height && !isNaN(sprite.height) && sprite.height > 0) ? sprite.height : 100;
        const aspectRatio = validWidth / validHeight;

        let newWidth, newHeight;
        if (aspectRatio > 1) {
          newWidth = Math.min(maxSymbolSize, validWidth);
          newHeight = newWidth / aspectRatio;
        } else {
          newHeight = Math.min(maxSymbolSize, validHeight);
          newWidth = newHeight * aspectRatio;
        }

        // Center symbol in its zone
        const symbolX = (workspaceWidth - newWidth) / 2;
        const symbolY = symbolZoneStart + (symbolZoneHeight - newHeight) / 2;

        console.log(`📐 text-top symbol ${index}: positioned at (${symbolX}, ${symbolY}) with size ${newWidth}x${newHeight}`);

        result.push({
          ...sprite,
          x: symbolX,
          y: symbolY,
          width: newWidth,
          height: newHeight
        });
      });

      return result;
    }
  },
  {
    id: 'text-bottom',
    name: 'Text on Bottom',
    description: 'Large symbol above, text below',
    icon: '🔽',
    applyLayout: (sprites, workspaceWidth, workspaceHeight) => {
      const symbolSprites = sprites.filter(s => s.type === 'symbol' || s.type === 'element');
      const letterSprites = sprites.filter(s => s.type === 'letter');

      const result = [];

      // Enhanced layout zones: 67% symbol, 3% gap, 30% text
      const zones = {
        symbolZone: 0.67,
        gapZone: 0.03,
        textZone: 0.30
      };

      // Position symbol in the top 67% zone
      symbolSprites.forEach((sprite, index) => {
        const symbolZoneHeight = workspaceHeight * zones.symbolZone;
        const maxSymbolSize = Math.min(workspaceWidth * 0.6, symbolZoneHeight * 0.8);

        // Validate sprite dimensions
        const validWidth = (sprite.width && !isNaN(sprite.width) && sprite.width > 0) ? sprite.width : 100;
        const validHeight = (sprite.height && !isNaN(sprite.height) && sprite.height > 0) ? sprite.height : 100;
        const aspectRatio = validWidth / validHeight;

        let newWidth, newHeight;
        if (aspectRatio > 1) {
          newWidth = Math.min(maxSymbolSize, validWidth);
          newHeight = newWidth / aspectRatio;
        } else {
          newHeight = Math.min(maxSymbolSize, validHeight);
          newWidth = newHeight * aspectRatio;
        }

        // Center symbol in its zone
        const symbolX = (workspaceWidth - newWidth) / 2;
        const symbolY = (symbolZoneHeight - newHeight) / 2;

        console.log(`📐 text-bottom symbol ${index}: positioned at (${symbolX}, ${symbolY}) with size ${newWidth}x${newHeight}`);

        result.push({
          ...sprite,
          x: symbolX,
          y: symbolY,
          width: newWidth,
          height: newHeight
        });
      });

      // Position letters in the bottom 30% zone (after 67% symbol + 3% gap)
      if (letterSprites.length > 0) {
        const textZoneStart = workspaceHeight * (zones.symbolZone + zones.gapZone);
        const textZoneHeight = workspaceHeight * zones.textZone;
        const maxLetterHeight = textZoneHeight * 0.8; // Use 80% of text zone height
        const letterSpacing = Math.max(workspaceWidth * 0.05, 20); // Minimum 5% spacing or 20px

        // Calculate total width needed with proper spacing
        const totalLetterWidth = letterSprites.reduce((total, sprite) => {
          const validHeight = (sprite.height && !isNaN(sprite.height) && sprite.height > 0) ? sprite.height : 50;
          const validWidth = (sprite.width && !isNaN(sprite.width) && sprite.width > 0) ? sprite.width : 50;
          const scaledHeight = Math.min(maxLetterHeight, validHeight);
          const scaledWidth = (validWidth / validHeight) * scaledHeight;
          return total + scaledWidth;
        }, 0);
        const totalSpacingWidth = (letterSprites.length - 1) * letterSpacing;
        const totalTextWidth = totalLetterWidth + totalSpacingWidth;

        let currentX = (workspaceWidth - totalTextWidth) / 2;
        const textY = textZoneStart + (textZoneHeight * 0.5); // Center vertically in text zone

        // Position each letter with proper spacing
        letterSprites.forEach((sprite, index) => {
          const validHeight = (sprite.height && !isNaN(sprite.height) && sprite.height > 0) ? sprite.height : 50;
          const validWidth = (sprite.width && !isNaN(sprite.width) && sprite.width > 0) ? sprite.width : 50;
          const scaledHeight = Math.min(maxLetterHeight, validHeight);
          const scaledWidth = (validWidth / validHeight) * scaledHeight;

          console.log(`📐 text-bottom letter ${index}: positioned at (${currentX}, ${textY}) with size ${scaledWidth}x${scaledHeight}`);

          result.push({
            ...sprite,
            x: currentX,
            y: textY - (scaledHeight / 2), // Center vertically
            width: scaledWidth,
            height: scaledHeight
          });

          currentX += scaledWidth + letterSpacing;
        });
      }

      return result;
    }
  },
  {
    id: 'text-overlay',
    name: 'Text Overlay',
    description: 'Text centered over symbol',
    icon: '🎯',
    applyLayout: (sprites, workspaceWidth, workspaceHeight) => {
      const symbolSprites = sprites.filter(s => s.type === 'symbol' || s.type === 'element');
      const letterSprites = sprites.filter(s => s.type === 'letter');

      const result = [];

      // Position symbol as background element (larger, centered)
      symbolSprites.forEach((sprite, index) => {
        const maxSymbolSize = Math.min(workspaceWidth * 0.7, workspaceHeight * 0.7);

        // Validate sprite dimensions
        const validWidth = (sprite.width && !isNaN(sprite.width) && sprite.width > 0) ? sprite.width : 100;
        const validHeight = (sprite.height && !isNaN(sprite.height) && sprite.height > 0) ? sprite.height : 100;
        const aspectRatio = validWidth / validHeight;

        let newWidth, newHeight;
        if (aspectRatio > 1) {
          newWidth = Math.min(maxSymbolSize, validWidth);
          newHeight = newWidth / aspectRatio;
        } else {
          newHeight = Math.min(maxSymbolSize, validHeight);
          newWidth = newHeight * aspectRatio;
        }

        // Center symbol as background
        const symbolX = (workspaceWidth - newWidth) / 2;
        const symbolY = (workspaceHeight - newHeight) / 2;

        console.log(`📐 text-overlay symbol ${index}: positioned at (${symbolX}, ${symbolY}) with size ${newWidth}x${newHeight}`);

        result.push({
          ...sprite,
          x: symbolX,
          y: symbolY,
          width: newWidth,
          height: newHeight
        });
      });

      // Position letters overlaid on symbol with enhanced spacing and contrast
      if (letterSprites.length > 0) {
        const maxLetterHeight = workspaceHeight * 0.2; // Larger letters for overlay
        const letterSpacing = Math.max(workspaceWidth * 0.08, 30); // Larger spacing for overlay

        // Calculate total width needed with enhanced spacing
        const totalLetterWidth = letterSprites.reduce((total, sprite) => {
          const validHeight = (sprite.height && !isNaN(sprite.height) && sprite.height > 0) ? sprite.height : 50;
          const validWidth = (sprite.width && !isNaN(sprite.width) && sprite.width > 0) ? sprite.width : 50;
          const scaledHeight = Math.min(maxLetterHeight, validHeight);
          const scaledWidth = (validWidth / validHeight) * scaledHeight;
          return total + scaledWidth;
        }, 0);
        const totalSpacingWidth = (letterSprites.length - 1) * letterSpacing;
        const totalTextWidth = totalLetterWidth + totalSpacingWidth;

        let currentX = (workspaceWidth - totalTextWidth) / 2;
        const textY = workspaceHeight * 0.5; // Center vertically over symbol

        // Position each letter with enhanced spacing for overlay effect
        letterSprites.forEach((sprite, index) => {
          const validHeight = (sprite.height && !isNaN(sprite.height) && sprite.height > 0) ? sprite.height : 50;
          const validWidth = (sprite.width && !isNaN(sprite.width) && sprite.width > 0) ? sprite.width : 50;
          const scaledHeight = Math.min(maxLetterHeight, validHeight);
          const scaledWidth = (validWidth / validHeight) * scaledHeight;

          console.log(`📐 text-overlay letter ${index}: positioned at (${currentX}, ${textY}) with size ${scaledWidth}x${scaledHeight}`);

          result.push({
            ...sprite,
            x: currentX,
            y: textY - (scaledHeight / 2), // Center vertically
            width: scaledWidth,
            height: scaledHeight
          });

          currentX += scaledWidth + letterSpacing;
        });
      }

      return result;
    }
  }
];

// Animation Template Configurations
export const ANIMATION_TEMPLATES: AnimationTemplate[] = [
  {
    id: 'bounce',
    name: 'Bounce',
    description: 'Symbol bounces up and down',
    icon: '🏀',
    duration: 1.5,
    applyAnimation: (sprites) => {
      sprites.forEach(sprite => {
        if (sprite.type === 'element' || sprite.type === 'symbol') {
          gsap.to(sprite, {
            y: sprite.y - 20,
            duration: 0.4,
            ease: "power2.out",
            repeat: -1,
            yoyo: true
          });
        }
      });
    }
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Symbol scales in and out rhythmically',
    icon: '💓',
    duration: 1.2,
    applyAnimation: (sprites) => {
      sprites.forEach(sprite => {
        const originalWidth = sprite.width;
        const originalHeight = sprite.height;
        gsap.to(sprite, {
          width: originalWidth * 1.2,
          height: originalHeight * 1.2,
          x: sprite.x - originalWidth * 0.1,
          y: sprite.y - originalHeight * 0.1,
          duration: 0.6,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true
        });
      });
    }
  },
  {
    id: 'glow',
    name: 'Glow',
    description: 'Symbol glows with soft light',
    icon: '✨',
    duration: 2.0,
    applyAnimation: (sprites) => {
      // Glow effect would need custom canvas rendering
      console.log('🌟 Glow animation applied');
    }
  },
  {
    id: 'rotate',
    name: 'Rotate',
    description: 'Symbol rotates smoothly',
    icon: '🔄',
    duration: 3.0,
    applyAnimation: (sprites) => {
      sprites.forEach(sprite => {
        if (sprite.type === 'element' || sprite.type === 'symbol') {
          // Note: Canvas rotation would need transform origin setup
          console.log('🔄 Rotate animation applied to', sprite.id);
        }
      });
    }
  },
  {
    id: 'shake',
    name: 'Shake',
    description: 'Symbol shakes for excitement',
    icon: '🔥',
    duration: 0.8,
    applyAnimation: (sprites) => {
      sprites.forEach(sprite => {
        if (sprite.type === 'element' || sprite.type === 'symbol') {
          const originalX = sprite.x;
          gsap.to(sprite, {
            x: originalX + 5,
            duration: 0.1,
            ease: "power2.inOut",
            repeat: 7,
            yoyo: true,
            onComplete: () => {
              sprite.x = originalX;
            }
          });
        }
      });
    }
  },
  {
    id: 'sparkle',
    name: 'Sparkle',
    description: 'Text letters animate individually',
    icon: '🌟',
    duration: 2.0,
    applyAnimation: (sprites) => {
      const letterSprites = sprites.filter(s => s.type === 'letter');
      letterSprites.forEach((sprite, index) => {
        gsap.to(sprite, {
          y: sprite.y - 15,
          duration: 0.3,
          ease: "back.out(1.7)",
          delay: index * 0.1,
          repeat: -1,
          repeatDelay: 1.5,
          yoyo: true
        });
      });
    }
  },
  {
    id: 'flash',
    name: 'Flash',
    description: 'Quick flash animation',
    icon: '⚡',
    duration: 0.5,
    applyAnimation: (sprites) => {
      sprites.forEach(sprite => {
        // Flash effect with opacity
        gsap.to(sprite, {
          opacity: 0.3,
          duration: 0.1,
          repeat: 3,
          yoyo: true,
          onComplete: () => {
            sprite.opacity = 1;
          }
        });
      });
    }
  },
  {
    id: 'wave',
    name: 'Wave',
    description: 'Text letters wave in sequence',
    icon: '🌊',
    duration: 2.5,
    applyAnimation: (sprites) => {
      const letterSprites = sprites.filter(s => s.type === 'letter');
      letterSprites.forEach((sprite, index) => {
        gsap.to(sprite, {
          y: sprite.y - 10,
          duration: 0.4,
          ease: "sine.inOut",
          delay: index * 0.2,
          repeat: -1,
          repeatDelay: letterSprites.length * 0.2,
          yoyo: true
        });
      });
    }
  }
];
