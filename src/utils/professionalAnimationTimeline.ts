// Professional Animation Timeline System - Phase 1.4
// Connects extracted sprites to professional animation workflows

export interface AnimationKeyframe {
  id: string;
  time: number; // milliseconds
  layerId: string;
  properties: {
    x: number;
    y: number;
    rotation: number; // degrees
    scaleX: number;
    scaleY: number;
    alpha: number; // 0-1
    visible: boolean;
  };
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  interpolation: 'smooth' | 'stepped';
}

export interface AnimationTrack {
  id: string;
  layerId: string;
  layerName: string;
  layerType: string;
  color: string;
  keyframes: AnimationKeyframe[];
  locked: boolean;
  muted: boolean;
  solo: boolean;
}

export interface AnimationSequence {
  id: string;
  name: string;
  duration: number; // milliseconds
  fps: number;
  tracks: AnimationTrack[];
  loop: boolean;
  autoReverse: boolean;
  metadata: {
    created: number;
    modified: number;
    creator: string;
    description?: string;
    tags: string[];
  };
}

export interface TimelineState {
  currentTime: number;
  isPlaying: boolean;
  isPaused: boolean;
  playbackSpeed: number; // 0.1 to 2.0
  selectedKeyframes: string[];
  selectedTracks: string[];
  zoom: number; // timeline zoom level
  viewportStart: number; // visible timeline start
  viewportEnd: number; // visible timeline end
  snapToKeyframes: boolean;
  onionSkinning: boolean;
  onionSkinFrames: number;
}

export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  category: 'idle' | 'win' | 'scatter' | 'wild' | 'bonus' | 'intro' | 'outro' | 'custom';
  duration: number;
  keyframes: Array<{
    layerType: string;
    time: number;
    properties: Partial<AnimationKeyframe['properties']>;
    easing: AnimationKeyframe['easing'];
  }>;
  preview: string; // base64 preview GIF
}

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  description: string;
  capabilities: {
    supportsLayers: boolean;
    supportsEasing: boolean;
    supportsEvents: boolean;
    supportsAudio: boolean;
    maxDuration?: number;
    maxFPS?: number;
  };
}

class ProfessionalAnimationTimeline {
  private sequences: Map<string, AnimationSequence> = new Map();
  private currentSequence: AnimationSequence | null = null;
  private timelineState: TimelineState;
  private animationLoop: number | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  constructor() {
    this.timelineState = {
      currentTime: 0,
      isPlaying: false,
      isPaused: false,
      playbackSpeed: 1.0,
      selectedKeyframes: [],
      selectedTracks: [],
      zoom: 1.0,
      viewportStart: 0,
      viewportEnd: 5000, // 5 seconds default view
      snapToKeyframes: true,
      onionSkinning: false,
      onionSkinFrames: 3
    };
  }

  /**
   * Create new animation sequence from extracted layers
   */
  createSequenceFromExtractedLayers(
    extractedLayers: Record<string, any>,
    name: string = 'New Animation',
    duration: number = 3000
  ): AnimationSequence {
    console.log(`🎬 [Timeline] Creating sequence "${name}" from ${Object.keys(extractedLayers).length} layers`);

    const sequence: AnimationSequence = {
      id: `seq_${Date.now()}`,
      name,
      duration,
      fps: 60,
      tracks: [],
      loop: true,
      autoReverse: false,
      metadata: {
        created: Date.now(),
        modified: Date.now(),
        creator: 'Animation Lab',
        description: `Generated from ${Object.keys(extractedLayers).length} extracted layers`,
        tags: ['auto-generated', 'extracted-layers']
      }
    };

    // Create tracks for each extracted layer
    Object.values(extractedLayers).forEach((layer: any, index) => {
      const track = this.createTrackFromLayer(layer, sequence.duration, index);
      sequence.tracks.push(track);
    });

    this.sequences.set(sequence.id, sequence);
    this.currentSequence = sequence;

    console.log(`✅ [Timeline] Sequence created with ${sequence.tracks.length} tracks`);
    return sequence;
  }

  /**
   * Create animation track from extracted layer
   */
  private createTrackFromLayer(extractedLayer: any, duration: number, zIndex: number): AnimationTrack {
    const layerColors = {
      weapon: '#DC2626',   // red
      armor: '#2563EB',    // blue  
      body: '#16A34A',     // green
      accessory: '#7C3AED', // purple
      clothing: '#EA580C',  // orange
      effect: '#EC4899',    // pink
      limb: '#CA8A04'      // yellow
    };

    const track: AnimationTrack = {
      id: `track_${extractedLayer.layerId}`,
      layerId: extractedLayer.layerId,
      layerName: extractedLayer.name,
      layerType: extractedLayer.type,
      color: layerColors[extractedLayer.type as keyof typeof layerColors] || '#6B7280',
      keyframes: [],
      locked: false,
      muted: false,
      solo: false
    };

    // Create default keyframes based on layer type and animation potential
    const defaultKeyframes = this.generateDefaultKeyframes(extractedLayer, duration, zIndex);
    track.keyframes = defaultKeyframes;

    return track;
  }

  /**
   * Generate smart default keyframes based on layer properties
   */
  private generateDefaultKeyframes(extractedLayer: any, duration: number, zIndex: number): AnimationKeyframe[] {
    const keyframes: AnimationKeyframe[] = [];
    const { type, animationPotential, refinedBounds } = extractedLayer;

    // 🎯 DEBUG: Log animation potential usage  
    console.log(`🎬 [Animation Intensity] Layer "${extractedLayer.name}" (${type}):`, {
      animationPotential: animationPotential || 'MISSING',
      willUseIntensiveAnimation: animationPotential === 'high',
      layerData: { type, animationPotential, layerId: extractedLayer.layerId }
    });

    // Convert percentage bounds to canvas coordinates
    // Assuming a 2432x1247 canvas with symbol centered at 1216,623.5 with 0.49 scale
    const canvasWidth = 2432;
    const canvasHeight = 1247;
    const symbolCenterX = canvasWidth / 2;
    const symbolCenterY = canvasHeight / 2;
    const symbolScale = 0.49;
    const originalImageSize = 1024;
    
    // Calculate layer center position in canvas coordinates
    const layerCenterXPercent = (refinedBounds.x + refinedBounds.width / 2) / 100;
    const layerCenterYPercent = (refinedBounds.y + refinedBounds.height / 2) / 100;
    
    // Convert to canvas coordinates relative to symbol center
    const baseX = symbolCenterX + (layerCenterXPercent - 0.5) * (originalImageSize * symbolScale);
    const baseY = symbolCenterY + (layerCenterYPercent - 0.5) * (originalImageSize * symbolScale);
    const baseScale = 1.0;

    // Start keyframe (0ms)
    keyframes.push({
      id: `kf_${Date.now()}_0`,
      time: 0,
      layerId: extractedLayer.layerId,
      properties: {
        x: baseX,
        y: baseY,
        rotation: 0,
        scaleX: baseScale,
        scaleY: baseScale,
        alpha: 1,
        visible: true
      },
      easing: 'ease-out',
      interpolation: 'smooth'
    });

    // Generate animation based on layer type and potential
    if (animationPotential === 'high') {
      console.log(`🚀 [HIGH INTENSITY] Applying dynamic animation for ${type} layer`);
      if (type === 'weapon') {
        // Weapon swing animation
        console.log(`⚔️ [WEAPON] Adding swing keyframes with 45° rotation`);
        this.addWeaponSwingKeyframes(keyframes, extractedLayer, duration, baseX, baseY);
      } else if (type === 'clothing') {
        // Cloth flutter animation  
        console.log(`👗 [CLOTHING] Adding flutter keyframes with cloth physics`);
        this.addClothFlutterKeyframes(keyframes, extractedLayer, duration, baseX, baseY);
      } else if (type === 'effect') {
        // Effect pulse animation
        console.log(`✨ [EFFECT] Adding pulse keyframes with 1.3x scale`);
        this.addEffectPulseKeyframes(keyframes, extractedLayer, duration, baseX, baseY);
      }
    } else if (animationPotential === 'medium') {
      console.log(`🎭 [MEDIUM INTENSITY] Applying subtle animation for ${type} layer`);
      if (type === 'accessory' || type === 'armor') {
        // Subtle float animation
        this.addFloatKeyframes(keyframes, extractedLayer, duration, baseX, baseY);
      }
    } else {
      // Low animation potential - gentle idle
      console.log(`😴 [LOW INTENSITY] Applying gentle idle for ${type} layer`);
      this.addIdleKeyframes(keyframes, extractedLayer, duration, baseX, baseY);
    }

    // End keyframe (return to start for looping)
    keyframes.push({
      id: `kf_${Date.now()}_end`,
      time: duration,
      layerId: extractedLayer.layerId,
      properties: {
        x: baseX,
        y: baseY,
        rotation: 0,
        scaleX: baseScale,
        scaleY: baseScale,
        alpha: 1,
        visible: true
      },
      easing: 'ease-in',
      interpolation: 'smooth'
    });

    return keyframes;
  }

  private addWeaponSwingKeyframes(keyframes: AnimationKeyframe[], layer: any, duration: number, baseX: number, baseY: number) {
    const swingTime = duration * 0.4; // 40% of animation for swing
    
    keyframes.push({
      id: `kf_${Date.now()}_swing`,
      time: swingTime,
      layerId: layer.layerId,
      properties: {
        x: baseX + 20,
        y: baseY - 10,
        rotation: 45,
        scaleX: 1.1,
        scaleY: 1.1,
        alpha: 1,
        visible: true
      },
      easing: 'ease-out',
      interpolation: 'smooth'
    });
  }

  private addClothFlutterKeyframes(keyframes: AnimationKeyframe[], layer: any, duration: number, baseX: number, baseY: number) {
    const flutterPoints = [0.25, 0.5, 0.75].map(t => t * duration);
    
    flutterPoints.forEach((time, index) => {
      const amplitude = 8 - (index * 2); // Decreasing amplitude
      keyframes.push({
        id: `kf_${Date.now()}_flutter_${index}`,
        time,
        layerId: layer.layerId,
        properties: {
          x: baseX + (index % 2 === 0 ? amplitude : -amplitude),
          y: baseY + Math.sin(index) * 3,
          rotation: (index % 2 === 0 ? 5 : -5),
          scaleX: 1.0 + (Math.sin(index) * 0.05),
          scaleY: 1.0,
          alpha: 1,
          visible: true
        },
        easing: 'ease-in-out',
        interpolation: 'smooth'
      });
    });
  }

  private addEffectPulseKeyframes(keyframes: AnimationKeyframe[], layer: any, duration: number, baseX: number, baseY: number) {
    const pulseTime = duration * 0.5;
    
    keyframes.push({
      id: `kf_${Date.now()}_pulse`,
      time: pulseTime,
      layerId: layer.layerId,
      properties: {
        x: baseX,
        y: baseY,
        rotation: 0,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.8,
        visible: true
      },
      easing: 'elastic',
      interpolation: 'smooth'
    });
  }

  private addFloatKeyframes(keyframes: AnimationKeyframe[], layer: any, duration: number, baseX: number, baseY: number) {
    const floatTime = duration * 0.5;
    
    keyframes.push({
      id: `kf_${Date.now()}_float`,
      time: floatTime,
      layerId: layer.layerId,
      properties: {
        x: baseX,
        y: baseY - 5,
        rotation: 2,
        scaleX: 1.02,
        scaleY: 1.02,
        alpha: 1,
        visible: true
      },
      easing: 'ease-in-out',
      interpolation: 'smooth'
    });
  }

  private addFloatKeyframes(keyframes: AnimationKeyframe[], layer: any, duration: number, baseX: number, baseY: number) {
    const floatPoints = [0.33, 0.66].map(t => t * duration);
    
    floatPoints.forEach((time, index) => {
      keyframes.push({
        id: `kf_${Date.now()}_float_${index}`,
        time,
        layerId: layer.layerId,
        properties: {
          x: baseX,
          y: baseY + (index % 2 === 0 ? -3 : 3), // Gentle floating up/down
          rotation: index % 2 === 0 ? 1 : -1, // Subtle rotation
          scaleX: 1.0 + (index % 2 === 0 ? 0.02 : -0.02), // Subtle scale pulse
          scaleY: 1.0 + (index % 2 === 0 ? 0.02 : -0.02),
          alpha: 1,
          visible: true
        },
        easing: 'ease-in-out',
        interpolation: 'smooth'
      });
    });
  }

  private addIdleKeyframes(keyframes: AnimationKeyframe[], layer: any, duration: number, baseX: number, baseY: number) {
    const breatheTime = duration * 0.6;
    
    keyframes.push({
      id: `kf_${Date.now()}_breathe`,
      time: breatheTime,
      layerId: layer.layerId,
      properties: {
        x: baseX,
        y: baseY - 1,
        rotation: 0,
        scaleX: 1.01,
        scaleY: 1.01,
        alpha: 1,
        visible: true
      },
      easing: 'ease-in-out',
      interpolation: 'smooth'
    });
  }

  /**
   * Timeline playback controls
   */
  play(): void {
    if (!this.currentSequence) return;
    
    this.timelineState.isPlaying = true;
    this.timelineState.isPaused = false;
    
    const startTime = performance.now() - this.timelineState.currentTime;
    
    const animate = (currentTime: number) => {
      if (!this.timelineState.isPlaying) return;
      
      const elapsed = (currentTime - startTime) * this.timelineState.playbackSpeed;
      this.timelineState.currentTime = elapsed % this.currentSequence!.duration;
      
      // Update all tracks
      this.updateTracksAtTime(this.timelineState.currentTime);
      
      // Trigger update callbacks
      this.triggerCallbacks('timeUpdate', { time: this.timelineState.currentTime });
      
      this.animationLoop = requestAnimationFrame(animate);
    };
    
    this.animationLoop = requestAnimationFrame(animate);
    console.log(`▶️ [Timeline] Playing sequence: ${this.currentSequence.name}`);
  }

  pause(): void {
    this.timelineState.isPlaying = false;
    this.timelineState.isPaused = true;
    
    if (this.animationLoop) {
      cancelAnimationFrame(this.animationLoop);
      this.animationLoop = null;
    }
    
    console.log(`⏸️ [Timeline] Paused at ${this.timelineState.currentTime}ms`);
  }

  stop(): void {
    this.timelineState.isPlaying = false;
    this.timelineState.isPaused = false;
    this.timelineState.currentTime = 0;
    
    if (this.animationLoop) {
      cancelAnimationFrame(this.animationLoop);
      this.animationLoop = null;
    }
    
    console.log(`⏹️ [Timeline] Stopped and reset`);
  }

  seekTo(time: number): void {
    this.timelineState.currentTime = Math.max(0, Math.min(time, this.currentSequence?.duration || 0));
    this.updateTracksAtTime(this.timelineState.currentTime);
    this.triggerCallbacks('timeUpdate', { time: this.timelineState.currentTime });
  }

  /**
   * Update all tracks at specific time
   */
  private updateTracksAtTime(time: number): void {
    if (!this.currentSequence) return;

    this.currentSequence.tracks.forEach(track => {
      if (track.muted) return;
      
      const interpolatedProperties = this.interpolateKeyframes(track.keyframes, time);
      this.triggerCallbacks('trackUpdate', { 
        layerId: track.layerId, 
        properties: interpolatedProperties,
        time 
      });
    });
  }

  /**
   * Interpolate between keyframes at given time
   */
  private interpolateKeyframes(keyframes: AnimationKeyframe[], time: number): AnimationKeyframe['properties'] {
    if (keyframes.length === 0) {
      return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1, visible: true };
    }

    // Find surrounding keyframes
    let prevKeyframe = keyframes[0];
    let nextKeyframe = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        prevKeyframe = keyframes[i];
        nextKeyframe = keyframes[i + 1];
        break;
      }
    }

    // If exactly on a keyframe
    if (time === prevKeyframe.time) return prevKeyframe.properties;
    if (time === nextKeyframe.time) return nextKeyframe.properties;

    // Interpolate between keyframes
    const duration = nextKeyframe.time - prevKeyframe.time;
    const progress = duration > 0 ? (time - prevKeyframe.time) / duration : 0;
    const easedProgress = this.applyEasing(progress, nextKeyframe.easing);

    return {
      x: this.lerp(prevKeyframe.properties.x, nextKeyframe.properties.x, easedProgress),
      y: this.lerp(prevKeyframe.properties.y, nextKeyframe.properties.y, easedProgress),
      rotation: this.lerp(prevKeyframe.properties.rotation, nextKeyframe.properties.rotation, easedProgress),
      scaleX: this.lerp(prevKeyframe.properties.scaleX, nextKeyframe.properties.scaleX, easedProgress),
      scaleY: this.lerp(prevKeyframe.properties.scaleY, nextKeyframe.properties.scaleY, easedProgress),
      alpha: this.lerp(prevKeyframe.properties.alpha, nextKeyframe.properties.alpha, easedProgress),
      visible: time >= prevKeyframe.time ? nextKeyframe.properties.visible : prevKeyframe.properties.visible
    };
  }

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  private applyEasing(t: number, easing: AnimationKeyframe['easing']): number {
    switch (easing) {
      case 'ease-in': return t * t;
      case 'ease-out': return 1 - Math.pow(1 - t, 2);
      case 'ease-in-out': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'bounce': return 1 - this.bounceOut(1 - t);
      case 'elastic': return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
      default: return t; // linear
    }
  }

  private bounceOut(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  /**
   * Export animation to various formats
   */
  async exportAnimation(format: 'spine' | 'lottie' | 'css' | 'gif' | 'webm'): Promise<string> {
    if (!this.currentSequence) {
      throw new Error('No sequence to export');
    }

    console.log(`🚀 [Timeline] Exporting animation as ${format.toUpperCase()}...`);

    switch (format) {
      case 'spine':
        return this.exportToSpine();
      case 'lottie':
        return this.exportToLottie();
      case 'css':
        return this.exportToCSS();
      case 'gif':
        return this.exportToGIF();
      case 'webm':
        return this.exportToWebM();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private exportToSpine(): string {
    // Simplified Spine JSON structure
    const spineData = {
      skeleton: {
        spine: "4.1.0",
        fps: this.currentSequence!.fps,
        images: "./images/",
        width: 1024,
        height: 1024
      },
      bones: [
        { name: "root" },
        ...this.currentSequence!.tracks.map(track => ({
          name: track.layerName,
          parent: "root"
        }))
      ],
      slots: this.currentSequence!.tracks.map(track => ({
        name: track.layerName,
        bone: track.layerName,
        attachment: track.layerName
      })),
      skins: [{
        name: "default",
        attachments: Object.fromEntries(
          this.currentSequence!.tracks.map(track => [
            track.layerName,
            { [track.layerName]: { type: "region" } }
          ])
        )
      }],
      animations: {
        [this.currentSequence!.name]: this.generateSpineKeyframes()
      }
    };

    return JSON.stringify(spineData, null, 2);
  }

  private exportToLottie(): string {
    // Simplified Lottie JSON structure
    const lottieData = {
      v: "5.7.0",
      fr: this.currentSequence!.fps,
      ip: 0,
      op: (this.currentSequence!.duration / 1000) * this.currentSequence!.fps,
      w: 1024,
      h: 1024,
      nm: this.currentSequence!.name,
      ddd: 0,
      layers: this.currentSequence!.tracks.map((track, index) => ({
        ddd: 0,
        ind: index + 1,
        ty: 2, // image layer
        nm: track.layerName,
        ks: this.generateLottieTransforms(track),
        ao: 0,
        ip: 0,
        op: (this.currentSequence!.duration / 1000) * this.currentSequence!.fps,
        st: 0
      }))
    };

    return JSON.stringify(lottieData, null, 2);
  }

  private exportToCSS(): string {
    let css = `/* Animation: ${this.currentSequence!.name} */\n`;
    css += `.animation-container {\n  position: relative;\n  width: 1024px;\n  height: 1024px;\n}\n\n`;

    this.currentSequence!.tracks.forEach(track => {
      css += `.layer-${track.layerId} {\n`;
      css += `  position: absolute;\n`;
      css += `  animation: ${track.layerName}-anim ${this.currentSequence!.duration}ms infinite;\n`;
      css += `}\n\n`;

      css += `@keyframes ${track.layerName}-anim {\n`;
      track.keyframes.forEach(keyframe => {
        const percentage = (keyframe.time / this.currentSequence!.duration) * 100;
        css += `  ${percentage.toFixed(1)}% {\n`;
        css += `    transform: translate(${keyframe.properties.x}px, ${keyframe.properties.y}px) `;
        css += `rotate(${keyframe.properties.rotation}deg) `;
        css += `scale(${keyframe.properties.scaleX}, ${keyframe.properties.scaleY});\n`;
        css += `    opacity: ${keyframe.properties.alpha};\n`;
        css += `  }\n`;
      });
      css += `}\n\n`;
    });

    return css;
  }

  private async exportToGIF(): Promise<string> {
    // Placeholder for GIF export
    console.log('🎞️ GIF export would render frames and encode to GIF');
    return 'data:image/gif;base64,placeholder_gif_data';
  }

  private async exportToWebM(): Promise<string> {
    // Placeholder for WebM export
    console.log('🎥 WebM export would render frames and encode to video');
    return 'data:video/webm;base64,placeholder_webm_data';
  }

  private generateSpineKeyframes(): any {
    // Convert timeline keyframes to Spine format
    return {};
  }

  private generateLottieTransforms(track: AnimationTrack): any {
    // Convert timeline keyframes to Lottie format
    return {};
  }

  /**
   * Event system for UI updates
   */
  on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  private triggerCallbacks(event: string, data?: any): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Getters
  getCurrentSequence(): AnimationSequence | null {
    return this.currentSequence;
  }

  getTimelineState(): TimelineState {
    return { ...this.timelineState };
  }

  getAllSequences(): AnimationSequence[] {
    return Array.from(this.sequences.values());
  }
}

// Export singleton and utilities
export const professionalAnimationTimeline = new ProfessionalAnimationTimeline();

export const createTimelineFromLayers = (extractedLayers: Record<string, any>, name?: string, duration?: number) => {
  return professionalAnimationTimeline.createSequenceFromExtractedLayers(extractedLayers, name, duration);
};

export const getAnimationPresets = (): AnimationPreset[] => {
  return [
    {
      id: 'idle_gentle',
      name: 'Gentle Idle',
      description: 'Subtle breathing and floating animation',
      category: 'idle',
      duration: 3000,
      keyframes: [],
      preview: ''
    },
    {
      id: 'win_celebration',
      name: 'Win Celebration',
      description: 'Energetic celebration with bouncing and glowing',
      category: 'win',
      duration: 2000,
      keyframes: [],
      preview: ''
    },
    {
      id: 'scatter_burst',
      name: 'Scatter Burst',
      description: 'Explosive scatter effect with particles',
      category: 'scatter',
      duration: 1500,
      keyframes: [],
      preview: ''
    }
  ];
};

export const getSupportedExportFormats = (): ExportFormat[] => {
  return [
    {
      id: 'spine',
      name: 'Spine JSON',
      extension: '.json',
      description: 'Professional 2D skeletal animation format',
      capabilities: {
        supportsLayers: true,
        supportsEasing: true,
        supportsEvents: true,
        supportsAudio: false
      }
    },
    {
      id: 'lottie',
      name: 'Lottie JSON',
      extension: '.json',
      description: 'Web and mobile animation format',
      capabilities: {
        supportsLayers: true,
        supportsEasing: true,
        supportsEvents: false,
        supportsAudio: false
      }
    },
    {
      id: 'css',
      name: 'CSS Animations',
      extension: '.css',
      description: 'Pure CSS keyframe animations',
      capabilities: {
        supportsLayers: true,
        supportsEasing: true,
        supportsEvents: false,
        supportsAudio: false
      }
    }
  ];
};