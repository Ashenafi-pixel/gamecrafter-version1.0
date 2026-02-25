import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { 
  Play, Pause, Square, SkipBack, SkipForward, 
  Eye, EyeOff, Settings, Layers, Bone, 
  Grid, Maximize2, Download, Upload,
  Scissors, Wand2, Target, Zap, Sparkles
} from 'lucide-react';
import { professionalPixiRenderer } from '../../utils/professionalPixiRenderer';

interface AAAProfessionalAnimationStudioProps {
  symbolImage: string | null;
  isPlaying: boolean;
  animationType: 'idle' | 'win' | 'scatter' | 'wild';
  onSymbolGenerate?: (prompt: string) => void;
  onSymbolUpload?: (file: File) => void;
}

interface SkeletonBone {
  id: string;
  name: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  parentId?: string;
  children: string[];
  rotation: number;
  length: number;
}

interface AnimationComponent {
  id: string;
  name: string;
  type: 'body' | 'wing' | 'head' | 'limb' | 'accessory';
  visible: boolean;
  locked: boolean;
  sprite?: PIXI.Sprite;
  mask?: PIXI.Graphics;
  bones: string[];
}

interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  showSkeleton: boolean;
  showGrid: boolean;
  showBounds: boolean;
  onionSkin: boolean;
}

const AAAProfessionalAnimationStudio: React.FC<AAAProfessionalAnimationStudioProps> = ({
  symbolImage,
  isPlaying,
  animationType,
  onSymbolGenerate,
  onSymbolUpload
}) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'select' | 'bone' | 'segment' | 'paint'>('select');
  const [components, setComponents] = useState<AnimationComponent[]>([]);
  const [skeleton, setSkeleton] = useState<SkeletonBone[]>([]);
  const [viewport, setViewport] = useState<ViewportState>({
    zoom: 1.0,
    panX: 0,
    panY: 0,
    showSkeleton: true,
    showGrid: false,
    showBounds: false,
    onionSkin: false
  });
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [symbolPrompt, setSymbolPrompt] = useState('Golden scarab beetle with detailed wings and metallic texture');
  const [currentStep, setCurrentStep] = useState<'generate' | 'analyze' | 'animate' | 'preview'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize Professional PIXI Renderer
  useEffect(() => {
    if (!canvasContainerRef.current || isInitialized) return;

    const initializeProfessionalRenderer = async () => {
      try {
        console.log('🏆 AAA Studio: Initializing Professional PIXI Renderer...');
        await professionalPixiRenderer.initialize(canvasContainerRef.current!);
        setIsInitialized(true);
        setProcessingStep('Professional renderer ready');
        console.log('✅ AAA Studio: Professional renderer initialized successfully');
      } catch (error) {
        console.error('AAA Studio: Failed to initialize professional renderer:', error);
        setProcessingStep(`Renderer error: ${error.message}`);
      }
    };

    initializeProfessionalRenderer();

    return () => {
      console.log('🧹 AAA Studio: Cleaning up professional renderer...');
      professionalPixiRenderer.destroy();
    };
  }, []);

  // Load symbol with professional pipeline
  useEffect(() => {
    if (symbolImage && isInitialized) {
      loadSymbolWithProfessionalPipeline(symbolImage);
    }
  }, [symbolImage, isInitialized]);

  // Handle play/pause changes
  useEffect(() => {
    if (isInitialized && components.length > 0) {
      if (isPlaying) {
        console.log('🏆 AAA Studio: Playing professional animations');
        professionalPixiRenderer.play();
      } else {
        console.log('🏆 AAA Studio: Pausing professional animations');
        professionalPixiRenderer.pause();
      }
    }
  }, [isPlaying, isInitialized, components.length]);

  const createGrid = (width: number, height: number): PIXI.Graphics => {
    const grid = new PIXI.Graphics();
    grid.lineStyle(1, 0x333333, 0.5);

    const gridSize = 50;
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
    }
    
    // Horizontal lines  
    for (let y = 0; y <= height; y += gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(width, y);
    }

    grid.visible = false;
    return grid;
  };

  const loadSymbolWithProfessionalPipeline = async (imageUrl: string) => {
    setIsProcessing(true);
    setProcessingStep('🏆 AAA Studio: Initializing professional pipeline...');

    try {
      console.log('🏆 AAA Studio: Starting professional symbol loading...');
      
      setProcessingStep('🔍 Analyzing symbol with Universal AI Detection...');
      
      // Use the professional renderer's universal detection system
      const detectionResult = await professionalPixiRenderer.loadSymbolWithUniversalDetection(imageUrl, animationType);
      
      console.log('🏆 AAA Studio: Universal detection complete:', detectionResult);
      
      setProcessingStep('🎭 Creating professional sprites with mesh processing...');
      
      // The professional renderer has already created sprites with Web Workers, GSAP, etc.
      // Get the sprite information for our UI
      const sprites = professionalPixiRenderer.sprites;
      console.log(`🏆 AAA Studio: ${sprites.size} professional sprites created`);
      
      // Convert professional sprites to our component format for UI display
      const newComponents: AnimationComponent[] = Array.from(sprites.entries()).map(([id, spriteData]) => ({
        id,
        name: spriteData.element?.name || id,
        type: (spriteData.element?.type as any) || 'body',
        visible: spriteData.sprite.visible,
        locked: false,
        sprite: spriteData.sprite,
        mask: spriteData.alphaMask,
        bones: []
      }));

      setComponents(newComponents);
      
      setProcessingStep('🎬 Starting professional GSAP animations...');
      
      // Start the professional animation system
      professionalPixiRenderer.play();
      
      console.log('🏆 AAA Studio: Professional animation started');
      
      setProcessingStep('✅ AAA Professional Pipeline Complete!');
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
        setCurrentStep('preview');
      }, 1000);

    } catch (error) {
      console.error('AAA Studio: Professional pipeline failed:', error);
      setIsProcessing(false);
      setProcessingStep(`Error: ${error.message}`);
    }
  };

  const drawSkeleton = (skeletonBones: SkeletonBone[], container: PIXI.Container) => {
    // Remove existing skeleton graphics
    const existingSkeleton = container.getChildByName('skeleton');
    if (existingSkeleton) {
      container.removeChild(existingSkeleton);
    }

    const skeletonGraphics = new PIXI.Graphics();
    skeletonGraphics.name = 'skeleton';

    skeletonBones.forEach(bone => {
      // Draw bone
      skeletonGraphics.lineStyle(3, 0x00ff00, 0.8);
      skeletonGraphics.moveTo(bone.startX, bone.startY);
      skeletonGraphics.lineTo(bone.endX, bone.endY);

      // Draw joints
      skeletonGraphics.beginFill(0x00ff00, 0.9);
      skeletonGraphics.drawCircle(bone.startX, bone.startY, 4);
      skeletonGraphics.drawCircle(bone.endX, bone.endY, 4);
      skeletonGraphics.endFill();

      // Draw bone name
      const text = new PIXI.Text(bone.name, {
        fontSize: 10,
        fill: 0x00ff00,
        fontFamily: 'Arial'
      });
      text.x = (bone.startX + bone.endX) / 2;
      text.y = (bone.startY + bone.endY) / 2 - 15;
      text.anchor.set(0.5);
      skeletonGraphics.addChild(text);
    });

    skeletonGraphics.visible = viewport.showSkeleton;
    container.addChild(skeletonGraphics);
  };

  const toggleSkeletonVisibility = () => {
    setViewport(prev => ({ ...prev, showSkeleton: !prev.showSkeleton }));
    
    if (pixiAppRef.current) {
      const skeleton = pixiAppRef.current.stage.getChildByName('skeleton');
      if (skeleton) {
        skeleton.visible = !viewport.showSkeleton;
      }
    }
  };

  const toggleGridVisibility = () => {
    setViewport(prev => ({ ...prev, showGrid: !prev.showGrid }));
    
    if (pixiAppRef.current) {
      const grid = pixiAppRef.current.stage.children[0].children[0]; // First child should be grid
      if (grid) {
        grid.visible = !viewport.showGrid;
      }
    }
  };

  const handleZoom = (delta: number) => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5.0, prev.zoom + delta))
    }));
  };

  const startAnimation = () => {
    if (!pixiAppRef.current) return;

    // Simple wing flapping animation
    const leftWing = components.find(c => c.id === 'leftWing')?.sprite;
    const rightWing = components.find(c => c.id === 'rightWing')?.sprite;

    if (leftWing && rightWing) {
      const animate = () => {
        const time = Date.now() * 0.01;
        
        leftWing.rotation = Math.sin(time) * 0.3;
        rightWing.rotation = -Math.sin(time) * 0.3;

        if (isPlaying) {
          requestAnimationFrame(animate);
        }
      };

      if (isPlaying) {
        animate();
      }
    }
  };

  useEffect(() => {
    startAnimation();
  }, [isPlaying, components]);

  // Handle symbol generation
  const handleGenerateSymbol = () => {
    if (onSymbolGenerate) {
      setIsGenerating(true);
      onSymbolGenerate(symbolPrompt);
      setCurrentStep('animate');
      setTimeout(() => setIsGenerating(false), 3000);
    }
  };

  // Handle symbol upload
  const handleSymbolUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onSymbolUpload) {
      onSymbolUpload(file);
      setCurrentStep('animate');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex z-50">
      {/* Left Control Panel */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AAA Animation Studio</h2>
              <p className="text-sm text-gray-400">Professional-grade animation tool</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            {['generate', 'animate', 'preview'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step ? 'bg-blue-600 text-white' :
                  ['generate', 'animate', 'preview'].indexOf(currentStep) > index ? 'bg-green-600 text-white' :
                  'bg-gray-600 text-gray-300'
                }`}>
                  {index + 1}
                </div>
                {index < 2 && <div className="w-12 h-0.5 bg-gray-600 mx-2" />}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 capitalize">Current: {currentStep.replace('-', ' ')}</p>
        </div>

        {/* Step 1: Generate Symbol */}
        {currentStep === 'generate' && (
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-bold text-white flex items-center mb-4">
              <Sparkles className="mr-3" size={20} />
              Generate Symbol
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Symbol Prompt
                </label>
                <textarea
                  value={symbolPrompt}
                  onChange={(e) => setSymbolPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-white"
                  rows={3}
                  placeholder="Describe the symbol you want to animate..."
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleGenerateSymbol}
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate</span>
                    </>
                  )}
                </button>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSymbolUpload}
                  className="hidden"
                  id="aaa-symbol-upload"
                />
                <label
                  htmlFor="aaa-symbol-upload"
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Animation Type Selection */}
        {symbolImage && (
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-bold text-white flex items-center mb-4">
              <Target className="mr-3" size={20} />
              Animation Type
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'idle', name: 'Idle', desc: 'Subtle movement', color: 'blue' },
                { type: 'win', name: 'Win', desc: 'Celebration', color: 'green' },
                { type: 'scatter', name: 'Scatter', desc: 'Mystical glow', color: 'purple' },
                { type: 'wild', name: 'Wild', desc: 'Transform', color: 'orange' }
              ].map((anim) => (
                <button
                  key={anim.type}
                  className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                    animationType === anim.type
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium text-sm">{anim.name}</div>
                  <div className="text-xs opacity-75">{anim.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Symbol Preview */}
        {symbolImage && (
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-bold text-white flex items-center mb-4">
              <Eye className="mr-3" size={20} />
              Symbol Preview
            </h3>
            <div className="flex items-center justify-center p-4 border border-gray-600 rounded-lg bg-gray-700">
              <img src={symbolImage} alt="Generated Symbol" className="w-32 h-32 object-contain" />
            </div>
          </div>
        )}

        {/* Export Controls */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-white flex items-center mb-4">
            <Download className="mr-3" size={20} />
            Export
          </h3>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Export Animation</span>
            </button>
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
              <span>Animation Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tool Toolbar */}
      <div className="w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-8 space-y-8">
        <button
          onClick={() => setSelectedTool('select')}
          className={`p-4 rounded-lg transition-colors ${
            selectedTool === 'select' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Select Tool"
        >
          <Target size={24} />
        </button>
        
        <button
          onClick={() => setSelectedTool('bone')}
          className={`p-4 rounded-lg transition-colors ${
            selectedTool === 'bone' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Bone Tool"
        >
          <Bone size={24} />
        </button>
        
        <button
          onClick={() => setSelectedTool('segment')}
          className={`p-4 rounded-lg transition-colors ${
            selectedTool === 'segment' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Segment Tool"
        >
          <Scissors size={24} />
        </button>
        
        <button
          onClick={() => setSelectedTool('paint')}
          className={`p-4 rounded-lg transition-colors ${
            selectedTool === 'paint' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Paint Weights"
        >
          <Wand2 size={24} />
        </button>

        <div className="flex-1" />

        <button
          onClick={toggleSkeletonVisibility}
          className={`p-4 rounded-lg transition-colors ${
            viewport.showSkeleton ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Toggle Skeleton"
        >
          {viewport.showSkeleton ? <Eye size={24} /> : <EyeOff size={24} />}
        </button>

        <button
          onClick={toggleGridVisibility}
          className={`p-4 rounded-lg transition-colors ${
            viewport.showGrid ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Toggle Grid"
        >
          <Grid size={24} />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-6 space-x-6">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white">AAA Animation Studio</h1>
            <span className="text-sm bg-purple-600 px-3 py-1 rounded-full">PROFESSIONAL</span>
          </div>

          <div className="flex-1" />

          {/* Playback Controls */}
          <div className="flex items-center space-x-3 bg-gray-700 rounded-lg p-2">
            <button className="p-3 hover:bg-gray-600 rounded">
              <SkipBack size={20} />
            </button>
            <button className="p-3 hover:bg-gray-600 rounded">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button className="p-3 hover:bg-gray-600 rounded">
              <Square size={20} />
            </button>
            <button className="p-3 hover:bg-gray-600 rounded">
              <SkipForward size={20} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => handleZoom(-0.1)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium"
            >
              -
            </button>
            <span className="text-sm w-16 text-center font-mono">{Math.round(viewport.zoom * 100)}%</span>
            <button 
              onClick={() => handleZoom(0.1)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium"
            >
              +
            </button>
          </div>

          <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded">
            <Settings size={20} />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-gray-900">
          <div 
            ref={canvasContainerRef}
            className="absolute inset-0 w-full h-full"
            style={{ transform: `scale(${viewport.zoom}) translate(${viewport.panX}px, ${viewport.panY}px)` }}
          />

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white font-medium">{processingStep}</p>
              </div>
            </div>
          )}

          {/* Viewport Info */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 rounded px-3 py-2 text-xs">
            <div>Tool: {selectedTool}</div>
            <div>Zoom: {Math.round(viewport.zoom * 100)}%</div>
            <div>Components: {components.length}</div>
            <div>Bones: {skeleton.length}</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-[400px] bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* Components Panel */}
        <div className="p-8 border-b border-gray-700">
          <h3 className="font-semibold text-white mb-6 flex items-center text-xl">
            <Layers className="mr-4" size={24} />
            Components
          </h3>
          
          <div className="space-y-4">
            {components.map(component => (
              <div 
                key={component.id}
                className={`flex items-center p-4 rounded-lg cursor-pointer transition-all ${
                  selectedComponent === component.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => setSelectedComponent(component.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const updatedComponents = components.map(c => 
                      c.id === component.id ? { ...c, visible: !c.visible } : c
                    );
                    setComponents(updatedComponents);
                    
                    if (component.sprite) {
                      component.sprite.visible = !component.visible;
                    }
                  }}
                  className="mr-4"
                >
                  {component.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                
                <div className={`w-5 h-5 rounded mr-4 ${
                  component.type === 'body' ? 'bg-blue-500' :
                  component.type === 'wing' ? 'bg-green-500' :
                  component.type === 'head' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
                
                <span className="flex-1 text-base font-medium">{component.name}</span>
                
                <button className="text-gray-400 hover:text-white">
                  <Settings size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton Panel */}
        <div className="p-8 border-b border-gray-700">
          <h3 className="font-semibold text-white mb-6 flex items-center text-xl">
            <Bone className="mr-4" size={24} />
            Skeleton
            <button
              onClick={toggleSkeletonVisibility}
              className={`ml-auto p-3 rounded-lg transition-colors ${
                viewport.showSkeleton ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              {viewport.showSkeleton ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </h3>
          
          <div className="space-y-3">
            {skeleton.map(bone => (
              <div key={bone.id} className="flex items-center p-4 bg-gray-700 rounded-lg">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-4" />
                <span className="flex-1 font-medium">{bone.name}</span>
                <span className="text-sm text-gray-400 font-mono">{Math.round(bone.length)}px</span>
              </div>
            ))}
          </div>
        </div>

        {/* Animation Controls */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="font-semibold text-white mb-4 flex items-center text-lg">
            <Zap className="mr-3" size={20} />
            Animation
          </h3>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            {['idle', 'win', 'scatter', 'wild'].map(type => (
              <button
                key={type}
                className={`p-3 rounded text-sm capitalize transition-colors ${
                  animationType === type 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Frame Rate:</span>
              <span>60 FPS</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>2.0s</span>
            </div>
            <div className="flex justify-between">
              <span>Keyframes:</span>
              <span>12</span>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="flex-1 p-6">
          <h3 className="font-semibold text-white mb-4 text-lg">Properties</h3>
          
          {selectedComponent && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Transform</label>
                <div className="space-y-2">
                  <div className="flex space-x-3">
                    <input 
                      type="number" 
                      placeholder="X" 
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
                    />
                    <input 
                      type="number" 
                      placeholder="Y" 
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <input 
                      type="number" 
                      placeholder="Rotation" 
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
                    />
                    <input 
                      type="number" 
                      placeholder="Scale" 
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Material</label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm">
                  <option>Organic</option>
                  <option>Metallic</option>
                  <option>Cloth</option>
                  <option>Hair</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Physics</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-sm">Enable Physics</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-sm">Soft Body</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span className="text-sm">Collision</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AAAProfessionalAnimationStudio;