/**
 * Universal AI Animation Engine
 * Next-generation slot game animation system powered by AI
 * 
 * Features:
 * - AI-powered element detection and analysis
 * - Physics-based relationship understanding
 * - Sophisticated contextual animations
 * - Real-time orchestration and coordination
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AIElementDetector } from '../../engine/ai/AIElementDetector';
import { PhysicsRelationshipEngine } from '../../engine/physics/PhysicsRelationshipEngine';
import { SophisticatedAnimationOrchestrator } from '../../engine/animation/SophisticatedAnimationOrchestrator';

interface UniversalAnimationEngineProps {
  className?: string;
}

interface SpriteFrame {
  id: number;
  canvas: HTMLCanvasElement;
  bounds: { x: number; y: number; width: number; height: number };
  centerPoint: { x: number; y: number };
}

interface SpriteSheetAnalysis {
  gridLayout: { rows: number; cols: number };
  frameCount: number;
  frameSize: { width: number; height: number };
  objectBounds: { width: number; height: number };
  extractedFrames: SpriteFrame[];
}

interface DetectedElement {
  id: string;
  type: 'gem' | 'star' | 'sparkle' | 'beam' | 'fire' | 'coin' | 'character' | 'weapon' | 'unknown';
  name: string;
  position: { x: number; y: number };
  bounds: { x: number; y: number; width: number; height: number };
  confidence: number;
  properties: {
    color?: string;
    material?: string;
    energy?: number;
    physics?: 'solid' | 'liquid' | 'gas' | 'energy';
  };
  relationships: Array<{
    elementId: string;
    type: 'attracts' | 'repels' | 'orbits' | 'sparkles_from' | 'illuminates' | 'attached_to';
    strength: number;
  }>;
}

interface AnimationRule {
  elementId: string;
  animation: {
    type: 'rotate' | 'pulse' | 'sparkle' | 'flow' | 'cascade' | 'swing' | 'orbit';
    duration: number;
    intensity: number;
    easing: string;
    triggers: string[];
  };
}

export const UniversalAnimationEngine: React.FC<UniversalAnimationEngineProps> = ({ 
  className = "" 
}) => {
  // State Management
  const [symbolImage, setSymbolImage] = useState<string>('');
  const [detectedElements, setDetectedElements] = useState<DetectedElement[]>([]);
  const [animationRules, setAnimationRules] = useState<AnimationRule[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');

  // Sprite Sheet Processing State
  const [spriteSheetMode, setSpriteSheetMode] = useState(false);
  const [spriteAnalysis, setSpriteAnalysis] = useState<SpriteSheetAnalysis | null>(null);
  const [isSpriteProcessing, setIsSpriteProcessing] = useState(false);
  const [spriteAnimationFrame, setSpriteAnimationFrame] = useState(0);
  const [spriteAnimationInterval, setSpriteAnimationInterval] = useState<NodeJS.Timeout | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SophisticatedAnimationOrchestrator | null>(null);
  
  // File Upload Handler
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSymbolImage(result);
      console.log('🎯 [Universal Engine] Image uploaded, ready for AI analysis');
    };
    reader.readAsDataURL(file);
  }, []);

  // AI Analysis Pipeline
  const analyzeSymbol = useCallback(async () => {
    if (!symbolImage) return;

    setIsAnalyzing(true);
    setAnalysisStatus('analyzing');
    console.log('🔍 [Universal Engine] Starting AI analysis pipeline...');

    try {
      // Step 1: AI Element Detection
      console.log('🎯 Step 1: AI Element Detection');
      const detector = new AIElementDetector();
      const elements = await detector.detectElements(symbolImage);
      
      // Step 2: Physics Relationship Analysis
      console.log('⚡ Step 2: Physics Relationship Analysis');
      const physicsEngine = new PhysicsRelationshipEngine();
      const elementsWithRelationships = await physicsEngine.analyzeRelationships(elements);
      
      // Step 3: Generate Animation Rules
      console.log('🎬 Step 3: Generate Sophisticated Animation Rules');
      const orchestrator = new SophisticatedAnimationOrchestrator();
      const rules = await orchestrator.generateAnimationRules(elementsWithRelationships);
      
      setDetectedElements(elementsWithRelationships);
      setAnimationRules(rules);
      setAnalysisStatus('complete');
      
      console.log(`✅ [Universal Engine] Analysis complete: ${elements.length} elements, ${rules.length} animation rules`);
      
    } catch (error) {
      console.error('[Universal Engine] Analysis failed:', error);
      setAnalysisStatus('error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [symbolImage]);

  // Animation Control
  const startAnimation = useCallback(async () => {
    if (!canvasRef.current || detectedElements.length === 0) return;

    console.log('🎪 [Universal Engine] Starting sophisticated animation orchestration...');
    
    try {
      // Initialize animation engine
      if (!engineRef.current) {
        engineRef.current = new SophisticatedAnimationOrchestrator();
        await engineRef.current.initialize(canvasRef.current);
      }

      // Load symbol and elements
      await engineRef.current.loadSymbol(symbolImage, detectedElements);
      
      // Apply animation rules
      await engineRef.current.applyAnimationRules(animationRules);
      
      // Start coordinated animation
      engineRef.current.startOrchestration();
      
      setIsAnimating(true);
      console.log('✨ [Universal Engine] Animation orchestration active');
      
    } catch (error) {
      console.error('[Universal Engine] Animation failed:', error);
    }
  }, [symbolImage, detectedElements, animationRules]);

  // Universal Sprite Sheet Processor
  const processSpriteSheet = useCallback(async () => {
    if (!symbolImage) return;

    setIsSpriteProcessing(true);
    console.log('🔄 [Sprite Processor] Starting universal sprite sheet analysis...');

    try {
      // Step 1: Use GPT-4 Vision to analyze the sprite sheet
      console.log('👁️ Step 1: GPT-4 Vision analysis of sprite sheet layout');
      const visionAnalysis = await analyzeWithGPTVision(symbolImage);
      
      // Step 2: Extract frames based on AI analysis
      console.log('✂️ Step 2: Smart frame extraction');
      const extractedFrames = await extractFramesIntelligently(symbolImage, visionAnalysis);
      
      // Step 3: Align all frames to common center point
      console.log('🎯 Step 3: Center alignment and optimization');
      const alignedFrames = await alignFramesToCenter(extractedFrames);
      
      const analysis: SpriteSheetAnalysis = {
        gridLayout: visionAnalysis.gridLayout,
        frameCount: alignedFrames.length,
        frameSize: visionAnalysis.frameSize,
        objectBounds: visionAnalysis.objectBounds,
        extractedFrames: alignedFrames
      };

      setSpriteAnalysis(analysis);
      console.log(`✅ [Sprite Processor] Successfully processed ${analysis.frameCount} frames`);
      
    } catch (error) {
      console.error('[Sprite Processor] Failed:', error);
    } finally {
      setIsSpriteProcessing(false);
    }
  }, [symbolImage]);

  // GPT-4 Vision Analysis
  const analyzeWithGPTVision = async (imageBase64: string) => {
    console.log('🤖 Calling GPT-4 Vision for sprite sheet analysis...');
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this sprite sheet image and provide EXACT technical details:

1. Grid layout (how many rows and columns)
2. Total number of frames
3. What object is being animated (gem, character, broccoli, etc.)
4. Optimal frame extraction size to capture the object consistently
5. Recommended center point for alignment

Respond in JSON format:
{
  "gridLayout": {"rows": X, "cols": Y},
  "frameCount": Z,
  "objectType": "description",
  "frameSize": {"width": W, "height": H},
  "objectBounds": {"width": OW, "height": OH},
  "notes": "technical observations"
}`
            },
            {
              type: 'input_image',
              input_image: {
                data: imageBase64,
                format: 'base64'
              }
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    console.log('📊 GPT-4 Vision Analysis:', analysis);
    return analysis;
  };

  // Intelligent Frame Extraction
  const extractFramesIntelligently = async (imageBase64: string, analysis: any): Promise<SpriteFrame[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const frames: SpriteFrame[] = [];
        const { rows, cols } = analysis.gridLayout;
        const frameWidth = img.width / cols;
        const frameHeight = img.height / rows;

        console.log(`🔪 Extracting ${rows}x${cols} grid with ${frameWidth}x${frameHeight} frames`);

        for (let i = 0; i < analysis.frameCount; i++) {
          const row = Math.floor(i / cols);
          const col = i % cols;
          
          const sourceX = col * frameWidth;
          const sourceY = row * frameHeight;

          // Create canvas for this frame
          const canvas = document.createElement('canvas');
          canvas.width = frameWidth;
          canvas.height = frameHeight;
          const ctx = canvas.getContext('2d')!;

          // Extract the frame
          ctx.drawImage(
            img,
            sourceX, sourceY, frameWidth, frameHeight,
            0, 0, frameWidth, frameHeight
          );

          frames.push({
            id: i,
            canvas,
            bounds: { x: sourceX, y: sourceY, width: frameWidth, height: frameHeight },
            centerPoint: { x: frameWidth / 2, y: frameHeight / 2 }
          });
        }

        console.log(`✅ Extracted ${frames.length} raw frames`);
        resolve(frames);
      };
      img.src = imageBase64;
    });
  };

  // Center Alignment
  const alignFramesToCenter = async (frames: SpriteFrame[]): Promise<SpriteFrame[]> => {
    console.log('🎯 Aligning frames to common center...');
    
    // Find the optimal bounding box that fits all objects
    let maxWidth = 0;
    let maxHeight = 0;
    
    // Analyze each frame to find object bounds (this could use edge detection)
    frames.forEach(frame => {
      const bounds = findObjectBounds(frame.canvas);
      maxWidth = Math.max(maxWidth, bounds.width);
      maxHeight = Math.max(maxHeight, bounds.height);
    });

    const alignedFrames = frames.map(frame => {
      const alignedCanvas = document.createElement('canvas');
      alignedCanvas.width = maxWidth + 40; // Add padding
      alignedCanvas.height = maxHeight + 40;
      const ctx = alignedCanvas.getContext('2d')!;

      // Center the object in the new canvas
      const centerX = alignedCanvas.width / 2;
      const centerY = alignedCanvas.height / 2;
      const objectBounds = findObjectBounds(frame.canvas);
      
      ctx.drawImage(
        frame.canvas,
        centerX - objectBounds.width / 2,
        centerY - objectBounds.height / 2
      );

      return {
        ...frame,
        canvas: alignedCanvas,
        centerPoint: { x: centerX, y: centerY }
      };
    });

    console.log(`✅ Aligned ${alignedFrames.length} frames to center`);
    return alignedFrames;
  };

  // Find Object Bounds (simplified edge detection)
  const findObjectBounds = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let minX = canvas.width, minY = canvas.height;
    let maxX = 0, maxY = 0;

    // Find non-transparent pixels
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3];
        
        if (alpha > 10) { // Non-transparent pixel
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  // Sprite Animation
  const startSpriteAnimation = useCallback(() => {
    if (!spriteAnalysis || spriteAnimationInterval) return;

    console.log('🎬 Starting sprite animation with', spriteAnalysis.frameCount, 'frames');
    setSpriteAnimationFrame(0);

    const interval = setInterval(() => {
      setSpriteAnimationFrame(prev => (prev + 1) % spriteAnalysis.frameCount);
    }, 120);

    setSpriteAnimationInterval(interval);
  }, [spriteAnalysis, spriteAnimationInterval]);

  const stopSpriteAnimation = useCallback(() => {
    if (spriteAnimationInterval) {
      clearInterval(spriteAnimationInterval);
      setSpriteAnimationInterval(null);
    }
  }, [spriteAnimationInterval]);

  // Draw current sprite frame
  useEffect(() => {
    if (!spriteAnalysis || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const currentFrame = spriteAnalysis.extractedFrames[spriteAnimationFrame];

    if (currentFrame) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Center the frame in the canvas
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const drawSize = 200;
      
      ctx.drawImage(
        currentFrame.canvas,
        centerX - drawSize / 2,
        centerY - drawSize / 2,
        drawSize,
        drawSize
      );
    }
  }, [spriteAnalysis, spriteAnimationFrame]);

  const stopAnimation = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stopOrchestration();
      setIsAnimating(false);
      console.log('⏹️ [Universal Engine] Animation stopped');
    }
  }, []);

  // Auto-analyze when image is uploaded
  useEffect(() => {
    if (symbolImage) {
      analyzeSymbol();
    }
  }, [symbolImage, analyzeSymbol]);

  return (
    <div className={`universal-animation-engine ${className}`}>
      <div className="bg-gray-900 text-white min-h-screen p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">
          🎪 Universal AI Animation Engine
        </h1>
        <p className="text-gray-300 text-center mb-8">
          Next-generation slot game animation powered by artificial intelligence
        </p>

        {/* Mode Selection */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🎯 Processing Mode</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setSpriteSheetMode(false)}
                className={`px-6 py-3 rounded font-semibold ${
                  !spriteSheetMode ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                🧠 AI Element Detection
              </button>
              <button
                onClick={() => setSpriteSheetMode(true)}
                className={`px-6 py-3 rounded font-semibold ${
                  spriteSheetMode ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                🔄 Universal Sprite Sheet Processor
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {spriteSheetMode 
                ? 'Process any sprite sheet (gem, broccoli, character, etc.) with intelligent frame extraction'
                : 'Analyze complex symbols and detect individual elements for sophisticated animation'
              }
            </p>
          </div>

          {/* Upload Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {spriteSheetMode ? '📊 Upload Sprite Sheet' : '📤 Upload Slot Symbol'}
            </h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
            />
            {symbolImage && (
              <div className="mt-4">
                <img 
                  src={symbolImage} 
                  alt="Uploaded image" 
                  className="max-w-xs mx-auto rounded border border-gray-600"
                />
              </div>
            )}
          </div>

          {/* Processing Controls */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {spriteSheetMode ? '🔄 Sprite Sheet Processing' : '🔍 AI Analysis Status'}
            </h2>
            
            {spriteSheetMode ? (
              <div className="space-y-4">
                <div className={`p-3 rounded ${
                  isSpriteProcessing ? 'bg-blue-900' : 
                  spriteAnalysis ? 'bg-green-900' : 'bg-gray-700'
                }`}>
                  Status: {isSpriteProcessing && '🔄 Processing sprite sheet with AI vision...'}
                         {spriteAnalysis && !isSpriteProcessing && '✅ Sprite sheet processed successfully'}
                         {!spriteAnalysis && !isSpriteProcessing && '⏳ Ready to process sprite sheet'}
                </div>
                
                {spriteAnalysis && (
                  <div className="text-sm text-gray-300">
                    Processed {spriteAnalysis.frameCount} frames in {spriteAnalysis.gridLayout.rows}x{spriteAnalysis.gridLayout.cols} grid
                  </div>
                )}
                
                <button
                  onClick={processSpriteSheet}
                  disabled={!symbolImage || isSpriteProcessing}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded font-semibold"
                >
                  {isSpriteProcessing ? '🔄 Processing...' : '🚀 Process Sprite Sheet'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-3 rounded ${
                  analysisStatus === 'analyzing' ? 'bg-blue-900' :
                  analysisStatus === 'complete' ? 'bg-green-900' :
                  analysisStatus === 'error' ? 'bg-red-900' : 'bg-gray-700'
                }`}>
                  Status: {analysisStatus === 'analyzing' && '🔄 Analyzing with AI...'}
                         {analysisStatus === 'complete' && '✅ Analysis Complete'}
                         {analysisStatus === 'error' && 'Analysis Failed'}
                         {analysisStatus === 'idle' && '⏳ Ready for Analysis'}
                </div>
                
                {detectedElements.length > 0 && (
                  <div className="text-sm text-gray-300">
                    Detected {detectedElements.length} elements, {animationRules.length} animation rules generated
                  </div>
                )}
                
                <button
                  onClick={analyzeSymbol}
                  disabled={!symbolImage || isAnalyzing}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-semibold"
                >
                  {isAnalyzing ? '🔄 Analyzing...' : '🚀 Analyze Symbol'}
                </button>
              </div>
            )}
          </div>

          {/* Sprite Frames Display */}
          {spriteSheetMode && spriteAnalysis && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🎬 Extracted Frames</h2>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
                {spriteAnalysis.extractedFrames.map((frame, index) => (
                  <div 
                    key={frame.id} 
                    className={`border-2 rounded p-2 ${
                      index === spriteAnimationFrame ? 'border-yellow-400' : 'border-gray-600'
                    }`}
                  >
                    <canvas 
                      ref={(el) => {
                        if (el && frame.canvas) {
                          el.width = 60;
                          el.height = 60;
                          const ctx = el.getContext('2d');
                          if (ctx) {
                            ctx.drawImage(frame.canvas, 0, 0, 60, 60);
                          }
                        }
                      }}
                      className="w-full h-auto"
                    />
                    <div className="text-xs text-center text-gray-400 mt-1">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-300">
                Frame {spriteAnimationFrame + 1} of {spriteAnalysis.frameCount} 
                • Grid: {spriteAnalysis.gridLayout.rows}×{spriteAnalysis.gridLayout.cols}
              </div>
            </div>
          )}

          {/* Detected Elements */}
          {!spriteSheetMode && detectedElements.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🎯 Detected Elements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {detectedElements.map((element) => (
                  <div key={element.id} className="bg-gray-700 rounded p-4">
                    <div className="font-semibold">{element.name}</div>
                    <div className="text-sm text-gray-300">Type: {element.type}</div>
                    <div className="text-sm text-gray-300">Confidence: {Math.round(element.confidence * 100)}%</div>
                    <div className="text-xs text-gray-400 mt-2">
                      Relationships: {element.relationships.length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Animation Canvas */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🎬 Animation Canvas</h2>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full max-w-4xl mx-auto bg-black rounded border border-gray-600"
            />
            
            <div className="flex justify-center space-x-4 mt-4">
              {spriteSheetMode ? (
                <>
                  <button
                    onClick={startSpriteAnimation}
                    disabled={!spriteAnalysis || spriteAnimationInterval !== null}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-semibold"
                  >
                    {spriteAnimationInterval ? '🎬 Playing...' : '▶️ Play Sprite Animation'}
                  </button>
                  
                  <button
                    onClick={stopSpriteAnimation}
                    disabled={spriteAnimationInterval === null}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded font-semibold"
                  >
                    ⏹️ Stop Sprite Animation
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startAnimation}
                    disabled={detectedElements.length === 0 || isAnimating}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-semibold"
                  >
                    {isAnimating ? '🎪 Animating...' : '▶️ Start Animation'}
                  </button>
                  
                  <button
                    onClick={stopAnimation}
                    disabled={!isAnimating}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded font-semibold"
                  >
                    ⏹️ Stop Animation
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🛠️ Engine Debug</h2>
            <div className="text-sm text-gray-300 font-mono">
              <div>Elements: {detectedElements.length}</div>
              <div>Animation Rules: {animationRules.length}</div>
              <div>Engine Status: {isAnimating ? 'Running' : 'Stopped'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalAnimationEngine;