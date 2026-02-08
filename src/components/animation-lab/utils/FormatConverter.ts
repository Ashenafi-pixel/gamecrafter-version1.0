/**
 * Format Conversion Utilities for Animation Lab
 * Handles various file format conversions and data transformations
 */

import { SpriteConfig } from '../core/SpriteManager';
import { AssetMetadata } from '../core/AssetManager';
import { ImageAnalysisResult } from '../core/ImageAnalyzer';

export interface ProjectData {
  version: string;
  metadata: {
    name: string;
    created: string;
    modified: string;
    description?: string;
  };
  assets: AssetMetadata[];
  sprites: Record<string, SpriteConfig>;
  analyses: Record<string, ImageAnalysisResult>;
  layers: LayerData[];
  settings: ProjectSettings;
}

export interface LayerData {
  id: string;
  name: string;
  sprites: string[];
  visible: boolean;
  alpha: number;
  locked: boolean;
}

export interface ProjectSettings {
  canvasSize: { width: number; height: number };
  backgroundColor: string;
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface ExportOptions {
  format: 'json' | 'zip' | 'spritesheet' | 'individual';
  includeAssets: boolean;
  includeAnalysis: boolean;
  compression: boolean;
  quality?: number;
}

export class FormatConverter {
  /**
   * Convert project data to JSON
   */
  static projectToJSON(projectData: ProjectData): string {
    try {
      return JSON.stringify(projectData, null, 2);
    } catch (error) {
      throw new Error(`Failed to convert project to JSON: ${error}`);
    }
  }

  /**
   * Parse project data from JSON
   */
  static projectFromJSON(jsonString: string): ProjectData {
    try {
      const data = JSON.parse(jsonString);
      
      // Validate required fields
      if (!data.version || !data.metadata || !data.assets) {
        throw new Error('Invalid project format: missing required fields');
      }
      
      return data as ProjectData;
    } catch (error) {
      throw new Error(`Failed to parse project JSON: ${error}`);
    }
  }

  /**
   * Convert PIXI sprite sheet data to standard format
   */
  static pixiToStandardSpriteSheet(pixiData: any): {
    frames: Record<string, {
      frame: { x: number; y: number; w: number; h: number };
      sourceSize: { w: number; h: number };
      spriteSourceSize: { x: number; y: number; w: number; h: number };
    }>;
    meta: {
      image: string;
      format: string;
      size: { w: number; h: number };
      scale: number;
    };
  } {
    const standardData = {
      frames: {} as any,
      meta: {
        image: pixiData.meta?.image || '',
        format: pixiData.meta?.format || 'RGBA8888',
        size: pixiData.meta?.size || { w: 0, h: 0 },
        scale: pixiData.meta?.scale || 1
      }
    };

    // Convert frames
    if (pixiData.frames) {
      for (const [frameName, frameData] of Object.entries(pixiData.frames as any)) {
        const frame = frameData as any;
        standardData.frames[frameName] = {
          frame: {
            x: frame.frame?.x || 0,
            y: frame.frame?.y || 0,
            w: frame.frame?.w || 0,
            h: frame.frame?.h || 0
          },
          sourceSize: {
            w: frame.sourceSize?.w || frame.frame?.w || 0,
            h: frame.sourceSize?.h || frame.frame?.h || 0
          },
          spriteSourceSize: {
            x: frame.spriteSourceSize?.x || 0,
            y: frame.spriteSourceSize?.y || 0,
            w: frame.spriteSourceSize?.w || frame.frame?.w || 0,
            h: frame.spriteSourceSize?.h || frame.frame?.h || 0
          }
        };
      }
    }

    return standardData;
  }

  /**
   * Convert standard sprite sheet data to PIXI format
   */
  static standardToPixiSpriteSheet(standardData: any): any {
    const pixiData = {
      frames: {} as any,
      meta: {
        image: standardData.meta?.image || '',
        format: standardData.meta?.format || 'RGBA8888',
        size: standardData.meta?.size || { w: 0, h: 0 },
        scale: standardData.meta?.scale || 1
      }
    };

    // Convert frames
    if (standardData.frames) {
      for (const [frameName, frameData] of Object.entries(standardData.frames as any)) {
        const frame = frameData as any;
        pixiData.frames[frameName] = {
          frame: frame.frame,
          sourceSize: frame.sourceSize,
          spriteSourceSize: frame.spriteSourceSize || frame.frame
        };
      }
    }

    return pixiData;
  }

  /**
   * Convert image analysis to exportable format
   */
  static analysisToExport(analysis: ImageAnalysisResult): any {
    return {
      objectType: analysis.objectType,
      confidence: analysis.confidence,
      metadata: {
        width: analysis.metadata.width,
        height: analysis.metadata.height,
        format: analysis.metadata.format,
        hasTransparency: analysis.metadata.hasTransparency,
        complexity: analysis.metadata.complexity,
        aspectRatio: analysis.metadata.aspectRatio
      },
      animationPotential: analysis.animationPotential.map(potential => ({
        type: potential.type,
        confidence: potential.confidence,
        description: potential.description,
        requiredAssets: potential.requiredAssets
      })),
      components: analysis.components.map(component => ({
        name: component.name,
        bounds: component.bounds,
        type: component.type,
        separable: component.separable,
        description: component.description
      }))
    };
  }

  /**
   * Convert sprite configurations to CSS animations
   */
  static spriteToCSSAnimation(
    spriteConfig: SpriteConfig,
    animationType: 'rotation' | 'scale' | 'pulse' | 'bounce',
    duration: number = 1000
  ): string {
    const { position, scale, rotation, alpha } = spriteConfig;
    
    let keyframes = '';
    let animationName = `sprite-${animationType}-${Date.now()}`;
    
    switch (animationType) {
      case 'rotation':
        keyframes = `
          @keyframes ${animationName} {
            from { transform: translate(${position.x}px, ${position.y}px) scale(${scale.x}, ${scale.y}) rotate(${rotation}rad); }
            to { transform: translate(${position.x}px, ${position.y}px) scale(${scale.x}, ${scale.y}) rotate(${rotation + Math.PI * 2}rad); }
          }
        `;
        break;
        
      case 'scale':
        keyframes = `
          @keyframes ${animationName} {
            0% { transform: translate(${position.x}px, ${position.y}px) scale(${scale.x}, ${scale.y}) rotate(${rotation}rad); }
            50% { transform: translate(${position.x}px, ${position.y}px) scale(${scale.x * 1.2}, ${scale.y * 1.2}) rotate(${rotation}rad); }
            100% { transform: translate(${position.x}px, ${position.y}px) scale(${scale.x}, ${scale.y}) rotate(${rotation}rad); }
          }
        `;
        break;
        
      case 'pulse':
        keyframes = `
          @keyframes ${animationName} {
            0% { opacity: ${alpha}; transform: translate(${position.x}px, ${position.y}px) scale(${scale.x}, ${scale.y}) rotate(${rotation}rad); }
            50% { opacity: ${alpha * 0.7}; transform: translate(${position.x}px, ${position.y}px) scale(${scale.x * 1.1}, ${scale.y * 1.1}) rotate(${rotation}rad); }
            100% { opacity: ${alpha}; transform: translate(${position.x}px, ${position.y}px) scale(${scale.x}, ${scale.y}) rotate(${rotation}rad); }
          }
        `;
        break;
        
      case 'bounce':
        keyframes = `
          @keyframes ${animationName} {
            0%, 100% { transform: translate(${position.x}px, ${position.y}px) scale(${scale.x}, ${scale.y}) rotate(${rotation}rad); }
            25% { transform: translate(${position.x}px, ${position.y - 20}px) scale(${scale.x * 1.1}, ${scale.y * 0.9}) rotate(${rotation}rad); }
            50% { transform: translate(${position.x}px, ${position.y - 40}px) scale(${scale.x}, ${scale.y}) rotate(${rotation}rad); }
            75% { transform: translate(${position.x}px, ${position.y - 20}px) scale(${scale.x * 0.9}, ${scale.y * 1.1}) rotate(${rotation}rad); }
          }
        `;
        break;
    }
    
    const animation = `animation: ${animationName} ${duration}ms ease-in-out infinite;`;
    
    return keyframes + '\n' + `.sprite-${spriteConfig.id} { ${animation} }`;
  }

  /**
   * Convert sprite configurations to GSAP timeline code
   */
  static spriteToGSAPCode(
    spriteConfig: SpriteConfig,
    animationType: 'rotation' | 'scale' | 'pulse' | 'bounce',
    duration: number = 1
  ): string {
    const target = `sprite_${spriteConfig.id}`;
    
    switch (animationType) {
      case 'rotation':
        return `gsap.to(${target}, { rotation: "+=360", duration: ${duration}, repeat: -1, ease: "none" });`;
        
      case 'scale':
        return `gsap.to(${target}, { scale: 1.2, duration: ${duration/2}, yoyo: true, repeat: -1, ease: "power2.inOut" });`;
        
      case 'pulse':
        return `gsap.to(${target}, { alpha: 0.7, scale: 1.1, duration: ${duration/2}, yoyo: true, repeat: -1, ease: "power2.inOut" });`;
        
      case 'bounce':
        return `
          gsap.timeline({ repeat: -1 })
            .to(${target}, { y: "-=40", scaleX: 1.1, scaleY: 0.9, duration: ${duration/4}, ease: "power2.out" })
            .to(${target}, { y: "-=40", scaleX: 1, scaleY: 1, duration: ${duration/4}, ease: "power2.inOut" })
            .to(${target}, { y: "+=40", scaleX: 0.9, scaleY: 1.1, duration: ${duration/4}, ease: "power2.in" })
            .to(${target}, { y: "+=40", scaleX: 1, scaleY: 1, duration: ${duration/4}, ease: "power2.out" });
        `;
    }
  }

  /**
   * Convert color formats
   */
  static colorToHex(color: string | number): string {
    if (typeof color === 'number') {
      return `#${color.toString(16).padStart(6, '0')}`;
    }
    
    if (color.startsWith('#')) {
      return color;
    }
    
    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = parseInt(matches[0]).toString(16).padStart(2, '0');
        const g = parseInt(matches[1]).toString(16).padStart(2, '0');
        const b = parseInt(matches[2]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
    }
    
    return '#000000'; // Default black
  }

  /**
   * Convert hex color to RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    return { r, g, b };
  }

  /**
   * Convert RGB to PIXI tint value
   */
  static rgbToPixiTint(r: number, g: number, b: number): number {
    return (r << 16) | (g << 8) | b;
  }

  /**
   * Generate file name with timestamp
   */
  static generateFileName(
    baseName: string,
    extension: string,
    includeTimestamp: boolean = true
  ): string {
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = includeTimestamp ? `_${Date.now()}` : '';
    return `${cleanBaseName}${timestamp}.${extension}`;
  }

  /**
   * Convert bytes to human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate project data structure
   */
  static validateProjectData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.version) errors.push('Missing version field');
    if (!data.metadata) errors.push('Missing metadata field');
    if (!data.assets || !Array.isArray(data.assets)) errors.push('Missing or invalid assets field');
    if (!data.sprites || typeof data.sprites !== 'object') errors.push('Missing or invalid sprites field');
    
    if (data.metadata) {
      if (!data.metadata.name) errors.push('Missing project name');
      if (!data.metadata.created) errors.push('Missing creation date');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize file name for cross-platform compatibility
   */
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Remove duplicate underscores
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .toLowerCase();
  }
}