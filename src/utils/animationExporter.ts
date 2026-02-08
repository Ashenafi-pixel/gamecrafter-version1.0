import { AutomatedAnimationPreset, AISymbolAnalysis } from './aiAnimationEngine';
import { aiBoneSystem, Skeleton } from './aiBoneSystem';

export interface ExportOptions {
  format: 'spine' | 'dragonbones' | 'lottie' | 'css' | 'webgl' | 'unity';
  quality: 'mobile' | 'desktop' | 'ultra';
  compression: 'none' | 'medium' | 'high';
  includeTextures: boolean;
  includeAudio: boolean;
  frameRate: 30 | 60 | 120;
  resolution: { width: number; height: number };
  optimizations: {
    removeRedundantKeyframes: boolean;
    quantizeRotations: boolean;
    compressTextures: boolean;
    generateMipmaps: boolean;
  };
}

export interface ExportResult {
  success: boolean;
  format: string;
  files: Array<{
    name: string;
    type: 'json' | 'atlas' | 'png' | 'webm' | 'mp4' | 'css' | 'js';
    size: number;
    content: string | Blob;
    url?: string;
  }>;
  metadata: {
    exportTime: number;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    aiGenerated: boolean;
    confidence: number;
  };
  preview?: string; // Base64 preview image
}

class AnimationExporter {
  private exportHistory: Map<string, ExportResult> = new Map();

  async exportAnimation(
    preset: AutomatedAnimationPreset,
    analysis: AISymbolAnalysis,
    options: ExportOptions
  ): Promise<ExportResult> {
    console.log(`📤 Exporting animation to ${options.format.toUpperCase()} format...`);
    
    const startTime = Date.now();
    
    try {
      let result: ExportResult;
      
      switch (options.format) {
        case 'spine':
          result = await this.exportToSpine(preset, analysis, options);
          break;
        case 'dragonbones':
          result = await this.exportToDragonBones(preset, analysis, options);
          break;
        case 'lottie':
          result = await this.exportToLottie(preset, analysis, options);
          break;
        case 'css':
          result = await this.exportToCSS(preset, analysis, options);
          break;
        case 'webgl':
          result = await this.exportToWebGL(preset, analysis, options);
          break;
        case 'unity':
          result = await this.exportToUnity(preset, analysis, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
      
      result.metadata.exportTime = Date.now() - startTime;
      this.exportHistory.set(`${preset.id}-${options.format}`, result);
      
      console.log(`✅ Export complete: ${result.files.length} files, ${result.metadata.compressionRatio.toFixed(1)}x compression`);
      return result;
      
    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  }

  private async exportToSpine(
    preset: AutomatedAnimationPreset,
    analysis: AISymbolAnalysis,
    options: ExportOptions
  ): Promise<ExportResult> {
    console.log('🦴 Generating Spine skeleton...');
    
    // Generate skeleton using AI bone system
    const skeleton = await aiBoneSystem.generateSkeletonFromAnalysis(
      analysis,
      options.resolution.width,
      options.resolution.height
    );
    
    // Generate animation data
    const animation = await aiBoneSystem.generateRealisticAnimation(
      skeleton.id,
      'idle',
      preset.animations[0]?.keyframes[preset.animations[0].keyframes.length - 1]?.time || 2.0
    );
    
    // Convert to Spine JSON format
    const spineData = aiBoneSystem.exportToSpineJSON(skeleton.id);
    
    // Add animation data
    spineData.animations = {
      [preset.name]: this.convertToSpineAnimation(preset, skeleton)
    };
    
    // Generate atlas and texture files
    const atlas = this.generateSpineAtlas(analysis, options);
    const texture = await this.generateTexture(analysis, options);
    
    const files = [
      {
        name: `${preset.id}.json`,
        type: 'json' as const,
        size: JSON.stringify(spineData).length,
        content: JSON.stringify(spineData, null, 2)
      },
      {
        name: `${preset.id}.atlas`,
        type: 'atlas' as const,
        size: atlas.length,
        content: atlas
      },
      {
        name: `${preset.id}.png`,
        type: 'png' as const,
        size: texture.size,
        content: texture.blob,
        url: texture.url
      }
    ];
    
    return {
      success: true,
      format: 'spine',
      files,
      metadata: {
        exportTime: 0,
        originalSize: this.calculateOriginalSize(preset),
        compressedSize: files.reduce((sum, file) => sum + file.size, 0),
        compressionRatio: 0,
        aiGenerated: true,
        confidence: preset.confidence
      }
    };
  }

  private async exportToDragonBones(
    preset: AutomatedAnimationPreset,
    analysis: AISymbolAnalysis,
    options: ExportOptions
  ): Promise<ExportResult> {
    console.log('🐉 Generating DragonBones armature...');
    
    const dragonBonesData = {
      frameRate: options.frameRate,
      name: preset.name,
      version: "5.6",
      compatibleVersion: "5.6",
      armature: [{
        name: "Armature",
        type: "Armature",
        frameRate: options.frameRate,
        bone: this.generateDragonBonesBones(analysis),
        slot: this.generateDragonBonesSlots(analysis),
        skin: [{
          name: "default",
          slot: this.generateDragonBonesSkin(analysis)
        }],
        animation: [{
          name: preset.name,
          duration: Math.ceil((preset.animations[0]?.keyframes[preset.animations[0].keyframes.length - 1]?.time || 2.0) * options.frameRate),
          bone: this.convertToDragonBonesAnimation(preset)
        }]
      }]
    };
    
    const texture = await this.generateTexture(analysis, options);
    const textureAtlas = this.generateDragonBonesAtlas(analysis, options);
    
    const files = [
      {
        name: `${preset.id}_ske.json`,
        type: 'json' as const,
        size: JSON.stringify(dragonBonesData).length,
        content: JSON.stringify(dragonBonesData, null, 2)
      },
      {
        name: `${preset.id}_tex.json`,
        type: 'json' as const,
        size: JSON.stringify(textureAtlas).length,
        content: JSON.stringify(textureAtlas, null, 2)
      },
      {
        name: `${preset.id}_tex.png`,
        type: 'png' as const,
        size: texture.size,
        content: texture.blob,
        url: texture.url
      }
    ];
    
    return {
      success: true,
      format: 'dragonbones',
      files,
      metadata: {
        exportTime: 0,
        originalSize: this.calculateOriginalSize(preset),
        compressedSize: files.reduce((sum, file) => sum + file.size, 0),
        compressionRatio: 0,
        aiGenerated: true,
        confidence: preset.confidence
      }
    };
  }

  private async exportToLottie(
    preset: AutomatedAnimationPreset,
    analysis: AISymbolAnalysis,
    options: ExportOptions
  ): Promise<ExportResult> {
    console.log('🎭 Generating Lottie animation...');
    
    const lottieData = {
      v: "5.7.1", // Lottie version
      fr: options.frameRate,
      ip: 0,
      op: Math.ceil((preset.animations[0]?.keyframes[preset.animations[0].keyframes.length - 1]?.time || 2.0) * options.frameRate),
      w: options.resolution.width,
      h: options.resolution.height,
      nm: preset.name,
      ddd: 0,
      assets: this.generateLottieAssets(analysis),
      layers: this.generateLottieLayers(preset, analysis),
      markers: []
    };
    
    // Apply optimizations
    if (options.optimizations.removeRedundantKeyframes) {
      this.optimizeLottieKeyframes(lottieData);
    }
    
    const lottieContent = JSON.stringify(lottieData, null, 2);
    
    const files = [
      {
        name: `${preset.id}.json`,
        type: 'json' as const,
        size: lottieContent.length,
        content: lottieContent
      }
    ];
    
    // Include textures if requested
    if (options.includeTextures) {
      const texture = await this.generateTexture(analysis, options);
      files.push({
        name: `${preset.id}_texture.png`,
        type: 'png' as const,
        size: texture.size,
        content: texture.blob,
        url: texture.url
      });
    }
    
    return {
      success: true,
      format: 'lottie',
      files,
      metadata: {
        exportTime: 0,
        originalSize: this.calculateOriginalSize(preset),
        compressedSize: files.reduce((sum, file) => sum + file.size, 0),
        compressionRatio: 0,
        aiGenerated: true,
        confidence: preset.confidence
      }
    };
  }

  private async exportToCSS(
    preset: AutomatedAnimationPreset,
    analysis: AISymbolAnalysis,
    options: ExportOptions
  ): Promise<ExportResult> {
    console.log('🎨 Generating CSS animations...');
    
    const cssAnimations = this.generateCSSAnimations(preset, analysis, options);
    const htmlDemo = this.generateHTMLDemo(preset, analysis, options);
    
    const files = [
      {
        name: `${preset.id}.css`,
        type: 'css' as const,
        size: cssAnimations.length,
        content: cssAnimations
      },
      {
        name: `${preset.id}_demo.html`,
        type: 'js' as const, // Using js type for HTML
        size: htmlDemo.length,
        content: htmlDemo
      }
    ];
    
    if (options.includeTextures) {
      const texture = await this.generateTexture(analysis, options);
      files.push({
        name: `${preset.id}_sprite.png`,
        type: 'png' as const,
        size: texture.size,
        content: texture.blob,
        url: texture.url
      });
    }
    
    return {
      success: true,
      format: 'css',
      files,
      metadata: {
        exportTime: 0,
        originalSize: this.calculateOriginalSize(preset),
        compressedSize: files.reduce((sum, file) => sum + file.size, 0),
        compressionRatio: 0,
        aiGenerated: true,
        confidence: preset.confidence
      }
    };
  }

  private async exportToWebGL(
    preset: AutomatedAnimationPreset,
    analysis: AISymbolAnalysis,
    options: ExportOptions
  ): Promise<ExportResult> {
    console.log('🎮 Generating WebGL shaders and animation data...');
    
    const vertexShader = this.generateVertexShader(preset, analysis);
    const fragmentShader = this.generateFragmentShader(preset, analysis);
    const animationData = this.generateWebGLAnimationData(preset, analysis, options);
    const webglCode = this.generateWebGLCode(preset, analysis, options);
    
    const files = [
      {
        name: `${preset.id}_vertex.glsl`,
        type: 'js' as const,
        size: vertexShader.length,
        content: vertexShader
      },
      {
        name: `${preset.id}_fragment.glsl`,
        type: 'js' as const,
        size: fragmentShader.length,
        content: fragmentShader
      },
      {
        name: `${preset.id}_animation.json`,
        type: 'json' as const,
        size: JSON.stringify(animationData).length,
        content: JSON.stringify(animationData, null, 2)
      },
      {
        name: `${preset.id}_webgl.js`,
        type: 'js' as const,
        size: webglCode.length,
        content: webglCode
      }
    ];
    
    if (options.includeTextures) {
      const texture = await this.generateTexture(analysis, options);
      files.push({
        name: `${preset.id}_texture.png`,
        type: 'png' as const,
        size: texture.size,
        content: texture.blob,
        url: texture.url
      });
    }
    
    return {
      success: true,
      format: 'webgl',
      files,
      metadata: {
        exportTime: 0,
        originalSize: this.calculateOriginalSize(preset),
        compressedSize: files.reduce((sum, file) => sum + file.size, 0),
        compressionRatio: 0,
        aiGenerated: true,
        confidence: preset.confidence
      }
    };
  }

  private async exportToUnity(
    preset: AutomatedAnimationPreset,
    analysis: AISymbolAnalysis,
    options: ExportOptions
  ): Promise<ExportResult> {
    console.log('🎯 Generating Unity animation and prefab...');
    
    const animatorController = this.generateUnityAnimatorController(preset, analysis);
    const animationClip = this.generateUnityAnimationClip(preset, analysis, options);
    const prefab = this.generateUnityPrefab(preset, analysis);
    const script = this.generateUnityScript(preset, analysis);
    
    const files = [
      {
        name: `${preset.id}Controller.controller`,
        type: 'json' as const,
        size: JSON.stringify(animatorController).length,
        content: JSON.stringify(animatorController, null, 2)
      },
      {
        name: `${preset.id}Animation.anim`,
        type: 'json' as const,
        size: JSON.stringify(animationClip).length,
        content: JSON.stringify(animationClip, null, 2)
      },
      {
        name: `${preset.id}.prefab`,
        type: 'json' as const,
        size: JSON.stringify(prefab).length,
        content: JSON.stringify(prefab, null, 2)
      },
      {
        name: `${preset.id}Controller.cs`,
        type: 'js' as const,
        size: script.length,
        content: script
      }
    ];
    
    if (options.includeTextures) {
      const texture = await this.generateTexture(analysis, options);
      files.push({
        name: `${preset.id}_texture.png`,
        type: 'png' as const,
        size: texture.size,
        content: texture.blob,
        url: texture.url
      });
    }
    
    return {
      success: true,
      format: 'unity',
      files,
      metadata: {
        exportTime: 0,
        originalSize: this.calculateOriginalSize(preset),
        compressedSize: files.reduce((sum, file) => sum + file.size, 0),
        compressionRatio: 0,
        aiGenerated: true,
        confidence: preset.confidence
      }
    };
  }

  // Helper methods for format-specific generation
  private convertToSpineAnimation(preset: AutomatedAnimationPreset, skeleton: Skeleton) {
    const spineAnimation: any = {
      slots: {},
      bones: {},
      deform: {}
    };
    
    preset.animations.forEach(anim => {
      const bone = skeleton.bones.get(anim.elementId);
      if (!bone) return;
      
      spineAnimation.bones[anim.elementId] = {
        rotate: anim.keyframes.map(kf => ({
          time: kf.time,
          angle: kf.properties.rotation ? kf.properties.rotation * (180 / Math.PI) : 0,
          curve: this.convertEasingToCurve(kf.easing)
        })),
        scale: anim.keyframes.map(kf => ({
          time: kf.time,
          x: kf.properties.scaleX || 1,
          y: kf.properties.scaleY || 1,
          curve: this.convertEasingToCurve(kf.easing)
        })),
        translate: anim.keyframes.map(kf => ({
          time: kf.time,
          x: kf.properties.x || 0,
          y: kf.properties.y || 0,
          curve: this.convertEasingToCurve(kf.easing)
        }))
      };
    });
    
    return spineAnimation;
  }

  private generateSpineAtlas(analysis: AISymbolAnalysis, options: ExportOptions): string {
    const atlasData = `
${analysis.detectedElements[0]?.name || 'symbol'}.png
size: ${options.resolution.width},${options.resolution.height}
format: RGBA8888
filter: Linear,Linear
repeat: none
symbol
  rotate: false
  xy: 0, 0
  size: ${options.resolution.width}, ${options.resolution.height}
  orig: ${options.resolution.width}, ${options.resolution.height}
  offset: 0, 0
  index: -1
    `.trim();
    
    return atlasData;
  }

  private generateDragonBonesBones(analysis: AISymbolAnalysis) {
    return analysis.detectedElements.map((element, index) => ({
      name: element.id,
      parent: index === 0 ? undefined : 'root',
      length: 100,
      x: element.boundingBox.x * 400,
      y: element.boundingBox.y * 400,
      skX: 0,
      skY: 0,
      scX: 1,
      scY: 1
    }));
  }

  private generateDragonBonesSlots(analysis: AISymbolAnalysis) {
    return analysis.detectedElements.map(element => ({
      name: element.id,
      parent: element.id,
      displayIndex: 0
    }));
  }

  private generateDragonBonesSkin(analysis: AISymbolAnalysis) {
    return analysis.detectedElements.map(element => ({
      name: element.id,
      display: [{
        name: element.name,
        type: "image",
        width: element.boundingBox.width * 400,
        height: element.boundingBox.height * 400
      }]
    }));
  }

  private convertToDragonBonesAnimation(preset: AutomatedAnimationPreset) {
    return preset.animations.map(anim => ({
      name: anim.elementId,
      translateFrame: anim.keyframes.map(kf => ({
        duration: Math.ceil((kf.time || 0) * 30),
        x: kf.properties.x || 0,
        y: kf.properties.y || 0,
        tweenEasing: this.convertEasingToTween(kf.easing)
      })),
      rotateFrame: anim.keyframes.map(kf => ({
        duration: Math.ceil((kf.time || 0) * 30),
        rotate: (kf.properties.rotation || 0) * (180 / Math.PI),
        tweenEasing: this.convertEasingToTween(kf.easing)
      })),
      scaleFrame: anim.keyframes.map(kf => ({
        duration: Math.ceil((kf.time || 0) * 30),
        x: kf.properties.scaleX || 1,
        y: kf.properties.scaleY || 1,
        tweenEasing: this.convertEasingToTween(kf.easing)
      }))
    }));
  }

  private generateLottieAssets(analysis: AISymbolAnalysis) {
    return analysis.detectedElements.map((element, index) => ({
      id: `image_${index}`,
      w: element.boundingBox.width * 400,
      h: element.boundingBox.height * 400,
      u: "images/",
      p: `${element.id}.png`,
      e: 0
    }));
  }

  private generateLottieLayers(preset: AutomatedAnimationPreset, analysis: AISymbolAnalysis) {
    return preset.animations.map((anim, index) => {
      const element = analysis.detectedElements.find(e => e.id === anim.elementId);
      if (!element) return null;
      
      return {
        ddd: 0,
        ind: index + 1,
        ty: 2, // Image layer
        nm: element.name,
        refId: `image_${index}`,
        sr: 1,
        ks: {
          o: { a: 0, k: 100 }, // Opacity
          r: { // Rotation
            a: 1,
            k: anim.keyframes.map(kf => ({
              i: { x: [0.833], y: [0.833] },
              o: { x: [0.167], y: [0.167] },
              t: kf.time * 30,
              s: [(kf.properties.rotation || 0) * (180 / Math.PI)]
            }))
          },
          p: { a: 0, k: [200, 200, 0] }, // Position
          a: { a: 0, k: [element.boundingBox.width * 200, element.boundingBox.height * 200, 0] },
          s: { // Scale
            a: 1,
            k: anim.keyframes.map(kf => ({
              i: { x: [0.833], y: [0.833] },
              o: { x: [0.167], y: [0.167] },
              t: kf.time * 30,
              s: [(kf.properties.scaleX || 1) * 100, (kf.properties.scaleY || 1) * 100, 100]
            }))
          }
        },
        ao: 0,
        ip: 0,
        op: 60,
        st: 0,
        bm: 0
      };
    }).filter(layer => layer !== null);
  }

  private generateCSSAnimations(preset: AutomatedAnimationPreset, analysis: AISymbolAnalysis, options: ExportOptions): string {
    let css = `/* AI Generated CSS Animation - ${preset.name} */\n\n`;
    
    preset.animations.forEach(anim => {
      const element = analysis.detectedElements.find(e => e.id === anim.elementId);
      if (!element) return;
      
      css += `.${anim.elementId} {\n`;
      css += `  animation: ${anim.elementId}-animation ${anim.keyframes[anim.keyframes.length - 1]?.time || 2}s infinite;\n`;
      css += `  transform-origin: center center;\n`;
      css += `}\n\n`;
      
      css += `@keyframes ${anim.elementId}-animation {\n`;
      anim.keyframes.forEach(kf => {
        const percent = ((kf.time / (anim.keyframes[anim.keyframes.length - 1]?.time || 2)) * 100).toFixed(1);
        css += `  ${percent}% {\n`;
        if (kf.properties.rotation) css += `    transform: rotate(${kf.properties.rotation * (180 / Math.PI)}deg)`;
        if (kf.properties.scaleX || kf.properties.scaleY) {
          const scaleX = kf.properties.scaleX || 1;
          const scaleY = kf.properties.scaleY || 1;
          css += ` scale(${scaleX}, ${scaleY})`;
        }
        css += `;\n`;
        if (kf.properties.alpha !== undefined) css += `    opacity: ${kf.properties.alpha};\n`;
        css += `  }\n`;
      });
      css += `}\n\n`;
    });
    
    return css;
  }

  private generateHTMLDemo(preset: AutomatedAnimationPreset, analysis: AISymbolAnalysis, options: ExportOptions): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${preset.name} - AI Generated Animation</title>
    <link rel="stylesheet" href="${preset.id}.css">
    <style>
        body {
            margin: 0;
            padding: 50px;
            background: #1a1a1a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
        }
        .animation-container {
            position: relative;
            width: ${options.resolution.width}px;
            height: ${options.resolution.height}px;
            background: #2d2d2d;
            border-radius: 10px;
            overflow: hidden;
        }
        .ai-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #8b5cf6;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            z-index: 100;
        }
    </style>
</head>
<body>
    <div class="animation-container">
        <div class="ai-badge">🤖 AI Generated</div>
        ${preset.animations.map(anim => 
          `<div class="${anim.elementId}"></div>`
        ).join('\n        ')}
    </div>
</body>
</html>`;
  }

  private async generateTexture(analysis: AISymbolAnalysis, options: ExportOptions) {
    // Create a simple texture representation
    const canvas = document.createElement('canvas');
    canvas.width = options.resolution.width;
    canvas.height = options.resolution.height;
    const ctx = canvas.getContext('2d')!;
    
    // Simple gradient texture as placeholder
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(1, '#ff8c00');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some texture details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 5 + 1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve as any, 'image/png');
    });
    
    return {
      blob: blob!,
      url: URL.createObjectURL(blob!),
      size: blob!.size
    };
  }

  // Additional helper methods for WebGL, Unity, etc.
  private generateVertexShader(preset: AutomatedAnimationPreset, analysis: AISymbolAnalysis): string {
    return `
attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute float a_time;

uniform mat3 u_matrix;
uniform float u_time;
uniform vec2 u_resolution;

varying vec2 v_texCoord;
varying float v_animationFactor;

void main() {
  // AI Generated vertex animation
  vec2 position = a_position;
  
  // Apply wing flutter based on AI analysis
  float flutter = sin(u_time * 8.0 + a_time) * 0.1;
  position.x += flutter;
  
  vec2 clipSpace = (u_matrix * vec3(position, 1)).xy;
  gl_Position = vec4(clipSpace, 0, 1);
  
  v_texCoord = a_texCoord;
  v_animationFactor = flutter;
}`;
  }

  private generateFragmentShader(preset: AutomatedAnimationPreset, analysis: AISymbolAnalysis): string {
    return `
precision mediump float;

uniform sampler2D u_texture;
uniform float u_time;
uniform float u_confidence;

varying vec2 v_texCoord;
varying float v_animationFactor;

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);
  
  // AI-enhanced golden shimmer
  float shimmer = sin(u_time * 4.0 + v_texCoord.x * 10.0) * 0.1 + 0.9;
  color.rgb *= shimmer;
  
  // Confidence-based glow
  float glow = u_confidence * 0.2;
  color.rgb += vec3(glow * 0.8, glow * 0.6, 0.0);
  
  gl_FragColor = color;
}`;
  }

  private generateWebGLAnimationData(preset: AutomatedAnimationPreset, analysis: AISymbolAnalysis, options: ExportOptions) {
    return {
      name: preset.name,
      duration: preset.animations[0]?.keyframes[preset.animations[0].keyframes.length - 1]?.time || 2.0,
      frameRate: options.frameRate,
      confidence: preset.confidence,
      aiGenerated: true,
      elements: preset.animations.map(anim => ({
        id: anim.elementId,
        keyframes: anim.keyframes.map(kf => ({
          time: kf.time,
          transform: {
            rotation: kf.properties.rotation || 0,
            scale: [kf.properties.scaleX || 1, kf.properties.scaleY || 1],
            position: [kf.properties.x || 0, kf.properties.y || 0]
          },
          easing: kf.easing
        }))
      }))
    };
  }

  private generateWebGLCode(preset: AutomatedAnimationPreset, analysis: AISymbolAnalysis, options: ExportOptions): string {
    return `// AI Generated WebGL Animation - ${preset.name}
class AIAnimationRenderer {
  constructor(canvas) {
    this.gl = canvas.getContext('webgl');
    this.program = null;
    this.buffers = {};
    this.uniforms = {};
    this.startTime = Date.now();
    
    this.initShaders();
    this.initBuffers();
  }
  
  initShaders() {
    const vertexShaderSource = \`${this.generateVertexShader(preset, analysis).replace(/`/g, '\\`')}\`;
    const fragmentShaderSource = \`${this.generateFragmentShader(preset, analysis).replace(/`/g, '\\`')}\`;
    
    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    this.gl.useProgram(this.program);
  }
  
  animate() {
    const currentTime = (Date.now() - this.startTime) / 1000;
    
    this.gl.uniform1f(this.uniforms.u_time, currentTime);
    this.gl.uniform1f(this.uniforms.u_confidence, ${preset.confidence});
    
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    
    requestAnimationFrame(() => this.animate());
  }
  
  // Additional WebGL boilerplate methods...
}

// Usage:
// const renderer = new AIAnimationRenderer(canvas);
// renderer.animate();`;
  }

  private generateUnityAnimatorController(preset: AutomatedAnimationPreset, analysis: AISymbolAnalysis) {
    return {
      "m_ObjectHideFlags": 1,
      "m_CorrespondingSourceObject": null,
      "m_PrefabInstance": null,
      "m_PrefabAsset": null,
      "m_Name": `${preset.id}Controller`,
      "m_States": [{
        "serializedVersion": 1,
        "m_Name": preset.name,
        "m_Speed": 1,
        "m_CycleOffset": 0,
        "m_Transitions": [],
        "m_StateMachineBehaviours": [],
        "m_Motion": {
          "m_ObjectHideFlags": 1,
          "m_Name": `${preset.id}Animation`
        }
      }],
      "m_AnyStateTransitions": [],
      "m_EntryTransitions": [],
      "m_StateMachineTransitions": {},
      "m_StateMachineBehaviours": [],
      "m_AnyStatePosition": { "x": 50, "y": 20, "z": 0 },
      "m_EntryPosition": { "x": 50, "y": 120, "z": 0 },
      "m_ExitPosition": { "x": 800, "y": 120, "z": 0 },
      "m_ParentStateMachinePosition": { "x": 800, "y": 20, "z": 0 },
      "m_DefaultState": 0
    };
  }

  private generateUnityAnimationClip(preset: AutomatedAnimationPreset, analysis: AISymbolAnalysis, options: ExportOptions) {
    return {
      "m_ObjectHideFlags": 0,
      "m_CorrespondingSourceObject": null,
      "m_PrefabInstance": null,
      "m_PrefabAsset": null,
      "m_Name": `${preset.id}Animation`,
      "serializedVersion": 6,
      "m_Legacy": false,
      "m_Compressed": false,
      "m_UseHighQualityCurve": true,
      "m_RotationCurves": [],
      "m_CompressedRotationCurves": [],
      "m_EulerCurves": preset.animations.map(anim => ({
        "curve": {
          "serializedVersion": 2,
          "m_Curve": anim.keyframes.map(kf => ({
            "serializedVersion": 3,
            "time": kf.time,
            "value": (kf.properties.rotation || 0) * (180 / Math.PI),
            "inTangent": 0,
            "outTangent": 0,
            "tangentMode": 136,
            "weightedMode": 0,
            "inWeight": 0,
            "outWeight": 0
          })),
          "m_PreInfinity": 2,
          "m_PostInfinity": 2,
          "m_RotationOrder": 4
        },
        "path": anim.elementId,
        "attribute": "localEulerAnglesRaw.z"
      })),
      "m_PositionCurves": [],
      "m_ScaleCurves": preset.animations.map(anim => ({
        "curve": {
          "serializedVersion": 2,
          "m_Curve": anim.keyframes.map(kf => ({
            "serializedVersion": 3,
            "time": kf.time,
            "value": {
              "x": kf.properties.scaleX || 1,
              "y": kf.properties.scaleY || 1,
              "z": 1
            },
            "inTangent": { "x": 0, "y": 0, "z": 0 },
            "outTangent": { "x": 0, "y": 0, "z": 0 },
            "tangentMode": 0,
            "weightedMode": 0,
            "inWeight": { "x": 0, "y": 0, "z": 0 },
            "outWeight": { "x": 0, "y": 0, "z": 0 }
          })),
          "m_PreInfinity": 2,
          "m_PostInfinity": 2
        },
        "path": anim.elementId,
        "attribute": "m_LocalScale"
      })),
      "m_FloatCurves": [],
      "m_PPtrCurves": [],
      "m_SampleRate": options.frameRate,
      "m_WrapMode": 2,
      "m_Bounds": {
        "m_Center": { "x": 0, "y": 0, "z": 0 },
        "m_Extent": { "x": 1, "y": 1, "z": 1 }
      },
      "m_ClipBindingConstant": {
        "genericBindings": [],
        "pptrCurveMapping": []
      },
      "m_AnimationClipSettings": {
        "serializedVersion": 2,
        "m_AdditiveReferencePoseClip": null,
        "m_AdditiveReferencePoseTime": 0,
        "m_StartTime": 0,
        "m_StopTime": preset.animations[0]?.keyframes[preset.animations[0].keyframes.length - 1]?.time || 2.0,
        "m_OrientationOffsetY": 0,
        "m_Level": 0,
        "m_CycleOffset": 0,
        "m_HasAdditiveReferencePose": false,
        "m_LoopTime": true,
        "m_LoopBlend": false,
        "m_LoopBlendOrientation": false,
        "m_LoopBlendPositionY": false,
        "m_LoopBlendPositionXZ": false,
        "m_KeepOriginalOrientation": false,
        "m_KeepOriginalPositionY": true,
        "m_KeepOriginalPositionXZ": false,
        "m_HeightFromFeet": false,
        "m_Mirror": false
      },
      "m_EditorCurves": [],
      "m_EulerEditorCurves": [],
      "m_HasGenericRootTransform": false,
      "m_HasMotionFloatCurves": false,
      "m_Events": []
    };
  }

  private generateUnityPrefab(preset: AutomatedAnimationPreset, analysis: AISymbolAnalysis) {
    return {
      "m_ObjectHideFlags": 0,
      "m_CorrespondingSourceObject": null,
      "m_PrefabInstance": null,
      "m_PrefabAsset": null,
      "serializedVersion": 6,
      "m_Component": [
        {
          "component": {
            "m_FileID": 1
          }
        },
        {
          "component": {
            "m_FileID": 2
          }
        }
      ],
      "m_Layer": 0,
      "m_Name": preset.id,
      "m_TagString": "Untagged",
      "m_Icon": null,
      "m_NavMeshLayer": 0,
      "m_StaticEditorFlags": 0,
      "m_IsActive": true
    };
  }

  private generateUnityScript(preset: AutomatedAnimationPreset, analysis: AISymbolAnalysis): string {
    return `using UnityEngine;

// AI Generated Unity Controller - ${preset.name}
// Confidence: ${Math.round(preset.confidence * 100)}%
public class ${preset.id}Controller : MonoBehaviour
{
    [Header("AI Animation Settings")]
    public float animationSpeed = 1f;
    public bool autoPlay = true;
    
    private Animator animator;
    
    void Start()
    {
        animator = GetComponent<Animator>();
        
        if (autoPlay)
        {
            PlayAnimation();
        }
    }
    
    public void PlayAnimation()
    {
        if (animator != null)
        {
            animator.SetFloat("Speed", animationSpeed);
            animator.Play("${preset.name}");
        }
    }
    
    public void SetAnimationSpeed(float speed)
    {
        animationSpeed = speed;
        if (animator != null)
        {
            animator.SetFloat("Speed", speed);
        }
    }
    
    // AI-generated animation states
    public void PlayIdle() { animator.SetTrigger("Idle"); }
    public void PlayWin() { animator.SetTrigger("Win"); }
    public void PlayScatter() { animator.SetTrigger("Scatter"); }
    public void PlayBonus() { animator.SetTrigger("Bonus"); }
}`;
  }

  // Utility methods
  private convertEasingToCurve(easing: string): string {
    const curves = {
      'linear': 'linear',
      'ease-in': 'stepped',
      'ease-out': 'stepped', 
      'ease-in-out': 'auto'
    };
    return curves[easing as keyof typeof curves] || 'auto';
  }

  private convertEasingToTween(easing: string): number {
    const tweens = {
      'linear': 0,
      'ease-in': 1,
      'ease-out': 2,
      'ease-in-out': 3
    };
    return tweens[easing as keyof typeof tweens] || 0;
  }

  private calculateOriginalSize(preset: AutomatedAnimationPreset): number {
    return JSON.stringify(preset).length;
  }

  private optimizeLottieKeyframes(lottieData: any): void {
    // Remove redundant keyframes that don't contribute to the animation
    lottieData.layers.forEach((layer: any) => {
      if (layer.ks && layer.ks.r && layer.ks.r.a === 1) {
        layer.ks.r.k = this.removeRedundantKeyframes(layer.ks.r.k);
      }
      if (layer.ks && layer.ks.s && layer.ks.s.a === 1) {
        layer.ks.s.k = this.removeRedundantKeyframes(layer.ks.s.k);
      }
    });
  }

  private removeRedundantKeyframes(keyframes: any[]): any[] {
    if (keyframes.length <= 2) return keyframes;
    
    const optimized = [keyframes[0]];
    
    for (let i = 1; i < keyframes.length - 1; i++) {
      const prev = keyframes[i - 1];
      const current = keyframes[i];
      const next = keyframes[i + 1];
      
      // Check if current keyframe is necessary
      const isDifferent = JSON.stringify(prev.s) !== JSON.stringify(current.s) ||
                         JSON.stringify(current.s) !== JSON.stringify(next.s);
      
      if (isDifferent) {
        optimized.push(current);
      }
    }
    
    optimized.push(keyframes[keyframes.length - 1]);
    return optimized;
  }

  // Public API
  getExportHistory(): Map<string, ExportResult> {
    return this.exportHistory;
  }

  async downloadExport(exportId: string): Promise<void> {
    const result = this.exportHistory.get(exportId);
    if (!result) throw new Error('Export not found');
    
    // Create and download zip file with all exported files
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    result.files.forEach(file => {
      if (typeof file.content === 'string') {
        zip.file(file.name, file.content);
      } else {
        zip.file(file.name, file.content);
      }
    });
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportId}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const animationExporter = new AnimationExporter();