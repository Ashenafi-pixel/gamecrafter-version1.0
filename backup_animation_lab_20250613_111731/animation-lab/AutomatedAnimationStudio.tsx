import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as PIXI from 'pixi.js';
import { ErrorBoundary } from '../ErrorBoundary';
import { 
  Sparkles, Upload, Play, Pause, Square, Download, 
  Wand2, Eye, Settings, Zap, Target, Brain, 
  CheckCircle, AlertCircle, Loader, ChevronDown,
  Monitor, Smartphone, Globe, RotateCcw, FileDown,
  BarChart3, Layers, Code, Gamepad2, HelpCircle
} from 'lucide-react';
import { aiAnimationEngine, AISymbolAnalysis, AutomatedAnimationPreset, AutomationLevel } from '../../utils/aiAnimationEngine';
import { professionalPixiRenderer } from '../../utils/professionalPixiRenderer';
import { analyzeSymbolWithGPTVision, type MultiLayerAnalysisResult } from '../../utils/gptVisionClient';
import { extractLayer, type ExtractedLayerData, type LayerExtractionOptions } from '../../utils/professionalLayerExtractor';
import { 
  professionalAnimationTimeline, 
  createTimelineFromLayers, 
  getAnimationPresets,
  getSupportedExportFormats,
  type AnimationSequence,
  type TimelineState,
  type AnimationPreset,
  type ExportFormat
} from '../../utils/professionalAnimationTimeline';
import { 
  visualAnimationRenderer,
  initializeVisualRenderer,
  loadSpritesForAnimation,
  updateAnimatedSprite,
  clearAnimationSprites,
  getRendererStats
} from '../../utils/visualAnimationRenderer';
import { useAutomationStore } from '../../store/automationStore';
import { realTimePerformanceMonitor } from '../../utils/realTimePerformanceMonitor';
import { animationExporter } from '../../utils/animationExporter';
import { 
  listAnimationLabSprites, 
  getAnimationLabSprite, 
  createDebugDownload,
  clearAnimationLabStorage,
  getStorageUsage,
  type AnimationLabSprite 
} from '../../utils/animationLabStorage';
import { testSwordBoundaryDetection, applySwordEdgeDetection, traceSwordContour, generateSwordAlphaMask, createSwordSprite, generateBackgroundCompletion, validateSwordExtraction, type SwordLayerData } from '../../utils/manualSwordExtraction';
import { extractSwordEnhanced, type EnhancedExtractionConfig, type EnhancedExtractionResult } from '../../utils/enhancedSwordExtraction';
import { recreateAsSprites, hasGPTApiKey, setGPTApiKey, type SpriteRecreationRequest, type SpriteRecreationResult } from '../../utils/gptSpriteRecreation';
import AutomatedTimeline from './AutomatedTimeline';
import GraphEditor from './GraphEditor';
import QADebugModule from '../visual-journey/debugging/QADebugModule';

interface AutomatedAnimationStudioProps {
  onSymbolGenerate?: (prompt: string) => Promise<string>;
  onSymbolUpload?: (file: File) => Promise<string>;
}

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  confidence?: number;
  duration?: number;
}

const AutomatedAnimationStudio: React.FC<AutomatedAnimationStudioProps> = ({
  onSymbolGenerate,
  onSymbolUpload
}) => {
  // Use centralized automation store
  const {
    symbolImage,
    symbolPrompt,
    automationLevel,
    isAnalyzing,
    analysis,
    processingSteps,
    availablePresets,
    selectedPreset,
    animationState,
    targetPlatform,
    showAdvancedOptions,
    currentStep,
    isGenerating,
    performanceMetrics,
    performanceGrade,
    userPreferences,
    
    // Actions
    setSymbolImage,
    setSymbolPrompt,
    setAutomationLevel,
    setAnalyzing,
    setAnalysis,
    updateProcessingSteps,
    setAvailablePresets,
    setSelectedPreset,
    updateAnimationState,
    setTargetPlatform,
    setShowAdvancedOptions,
    setCurrentStep,
    setGenerating,
    setPerformanceMetrics,
    startAutomatedWorkflow,
    resetWorkflow
  } = useAutomationStore();

  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Additional state for new features
  const [showGraphEditor, setShowGraphEditor] = useState(false);
  const [selectedAnimationType, setSelectedAnimationType] = useState<'idle' | 'win' | 'scatter' | 'wild' | 'bonus' | 'intro'>('idle');
  const [exportFormat, setExportFormat] = useState<'spine' | 'dragonbones' | 'lottie' | 'css' | 'webgl' | 'unity'>('spine');
  const [isExporting, setIsExporting] = useState(false);
  
  // 🔬 Debug state for GPT-4 Vision detection results
  const [universalDetectionResults, setUniversalDetectionResults] = useState<any>(null);
  const [detectedObjectType, setDetectedObjectType] = useState<string>('');
  
  // 🎨 Multi-layer analysis results state
  const [multiLayerResults, setMultiLayerResults] = useState<MultiLayerAnalysisResult | null>(null);
  
  // 🎨 GPT-Vision Sprite Recreation state
  const [gptVisionReady, setGptVisionReady] = useState(false);
  const [clickMode, setClickMode] = useState<'manual' | 'gpt-vision'>('gpt-vision');
  const [gptRecreationResults, setGptRecreationResults] = useState<SpriteRecreationResult | null>(null);
  const [recreationMode, setRecreationMode] = useState<'auto' | 'guided' | 'custom'>('auto');
  const [targetLayers, setTargetLayers] = useState<string[]>(['weapon', 'character', 'background']);
  const [isUsingGPTVision, setIsUsingGPTVision] = useState(false);

  // 🎛️ Phase 1.2: Layer visibility controls
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({});
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  
  // 🎬 Layer animation controls
  const [layerAnimationEnabled, setLayerAnimationEnabled] = useState<Record<string, boolean>>({});
  
  // 🔬 Phase 1.3: Layer extraction and boundary refinement
  const [extractedLayers, setExtractedLayers] = useState<Record<string, ExtractedLayerData>>({});
  const [extractionProgress, setExtractionProgress] = useState<Record<string, { status: 'idle' | 'extracting' | 'complete' | 'error'; progress: number; message: string }>>({});
  const [showExtractedSprites, setShowExtractedSprites] = useState(false);
  
  // 🎬 Phase 1.4: Animation Timeline Integration
  const [currentAnimationSequence, setCurrentAnimationSequence] = useState<AnimationSequence | null>(null);
  const [timelineState, setTimelineState] = useState<TimelineState | null>(null);
  const [showAnimationTimeline, setShowAnimationTimeline] = useState(false);
  const [animationPresets] = useState<AnimationPreset[]>(getAnimationPresets());
  const [exportFormats] = useState<ExportFormat[]>(getSupportedExportFormats());
  const [selectedPresetId, setSelectedPresetId] = useState<string>('idle_gentle');
  
  // 🎭 Phase 2.0: Visual Animation Rendering
  const [visualRendererReady, setVisualRendererReady] = useState(false);
  const [animationCanvasRef] = useState<React.RefObject<HTMLCanvasElement>>(React.createRef());
  const [rendererStats, setRendererStats] = useState({ fps: 0, sprites: 0, memory: '0MB' });
  
  // 🔄 GPT-4 Vision status tracking
  const [visionStatus, setVisionStatus] = useState<{
    status: 'idle' | 'initializing' | 'calling-api' | 'processing' | 'complete' | 'error';
    message: string;
    startTime?: number;
  }>({ status: 'idle', message: 'Waiting for symbol upload' });
  
  // 🗡️ Manual Sword Extraction Debug
  const [swordExtractionDebug, setSwordExtractionDebug] = useState<any[]>([]);
  const [swordEdgeDetectionResults, setSwordEdgeDetectionResults] = useState<any>(null);
  const [swordStep1Success, setSwordStep1Success] = useState<{ bounds: any; layerData: any } | null>(null);
  const [swordContourResults, setSwordContourResults] = useState<any>(null);
  const [swordAlphaMaskResults, setSwordAlphaMaskResults] = useState<any>(null);
  const [swordSpriteResults, setSwordSpriteResults] = useState<any>(null);
  const [swordBackgroundResults, setSwordBackgroundResults] = useState<any>(null);
  const [swordValidationResults, setSwordValidationResults] = useState<any>(null);
  
  // 🎯 Parse console logs to detect object type (fallback)
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('🎯 Detected subject:')) {
        const match = message.match(/🎯 Detected subject: (\w+)/);
        if (match) {
          const objectType = match[1].toLowerCase();
          setDetectedObjectType(objectType.toUpperCase());
          // Store for AI analysis
          localStorage.setItem('lastDetectedObjectType', objectType);
          console.log(`🎯 FALLBACK: Detected object type from console: ${objectType}`);
        }
      }
      originalConsoleLog.apply(console, args);
    };
    
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);
  
  // 🆘 Q&A Debug Module state
  const [showQAModule, setShowQAModule] = useState(false);
  
  // 🎯 Animation Lab Sprites browser
  const [showSpriteBrowser, setShowSpriteBrowser] = useState(false);
  const [savedSprites, setSavedSprites] = useState<AnimationLabSprite[]>([]);

  // Track if renderer is initialized to prevent React Strict Mode double-initialization
  const rendererInitialized = useRef(false);
  const isComponentMounted = useRef(true);
  const [rendererReady, setRendererReady] = useState(false);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔬 Phase 1.3: Layer Extraction Function
  const extractLayerSprite = async (layer: any) => {
    if (!symbolImage || !multiLayerResults) {
      console.error('Cannot extract layer: No symbol image or layer results available');
      return;
    }

    const layerId = layer.id;
    const layerName = layer.name;

    console.log(`🔬 [Phase 1.3] Starting layer extraction for: ${layerName}`);

    try {
      // Update progress
      setExtractionProgress(prev => ({
        ...prev,
        [layerId]: { status: 'extracting', progress: 0, message: 'Initializing extraction...' }
      }));

      // Progress updates
      const updateProgress = (progress: number, message: string) => {
        setExtractionProgress(prev => ({
          ...prev,
          [layerId]: { status: 'extracting', progress, message }
        }));
      };

      updateProgress(20, 'Loading computer vision algorithms...');
      
      // Configure extraction options based on layer type and animation potential
      const extractionOptions: Partial<LayerExtractionOptions> = {
        method: 'auto',
        edgeThreshold: layer.animationPotential === 'high' ? 100 : 128, // More sensitive for high-animation layers
        morphologyKernel: 3,
        contourSimplification: layer.animationPotential === 'high' ? 0.5 : 1.0, // More detail for animated layers
        alphaFeathering: layer.type === 'effect' ? 4 : 2, // More feathering for effects
        backgroundRemoval: true
      };

      updateProgress(40, 'Applying computer vision boundary refinement...');

      // Extract the layer using professional CV algorithms
      const extractedLayerData = await extractLayer(
        symbolImage,
        layer.bounds,
        layer.contourPoints || [],
        layerId,
        layerName,
        layer.type,
        extractionOptions
      );

      updateProgress(80, 'Generating alpha channel and sprite...');

      // Store extracted layer data with preserved animation potential
      const enhancedLayerData = {
        ...extractedLayerData,
        animationPotential: layer.animationPotential, // ✅ PRESERVE CRITICAL ANIMATION DATA
        originalLayerType: layer.type,
        zIndex: layer.zIndex
      };

      setExtractedLayers(prev => ({
        ...prev,
        [layerId]: enhancedLayerData
      }));

      updateProgress(100, 'Extraction complete!');

      // Mark as complete
      setExtractionProgress(prev => ({
        ...prev,
        [layerId]: { status: 'complete', progress: 100, message: 'Layer extracted successfully!' }
      }));

      // Show extracted sprites panel
      setShowExtractedSprites(true);

      console.log(`✅ [Phase 1.3] Layer extraction complete for ${layerName}:`, {
        pixelCount: extractedLayerData.metadata.pixelCount,
        boundaryPoints: extractedLayerData.precisionContour.length,
        confidence: extractedLayerData.metadata.confidence,
        method: extractedLayerData.metadata.extractionMethod
      });

      // Alert user with details
      setTimeout(() => {
        alert(`🎉 Layer Extraction Complete!\n\nLayer: ${layerName}\nType: ${layer.type}\nPixels: ${extractedLayerData.metadata.pixelCount.toLocaleString()}\nBoundary Points: ${extractedLayerData.precisionContour.length}\nConfidence: ${Math.round(extractedLayerData.metadata.confidence * 100)}%\n\nSprite ready for animation! 🚀`);
      }, 500);

    } catch (error) {
      console.error(`[Phase 1.3] Layer extraction failed for ${layerName}:`, error);
      
      setExtractionProgress(prev => ({
        ...prev,
        [layerId]: { status: 'error', progress: 0, message: `Extraction failed: ${error.message}` }
      }));

      alert(`Layer extraction failed for ${layerName}:\n\n${error.message}\n\nPlease try again or contact support.`);
    }
  };

  // 🗡️ Manual Sword Extraction Functions
  const handleSwordBoundaryDetection = async () => {
    if (!symbolImage) {
      alert('No symbol image available! Please upload an image first.');
      return;
    }

    if (!multiLayerResults || !multiLayerResults.layers) {
      alert('No layer analysis results! Please run "🎨 TEST LAYERS" first to analyze the symbol.');
      return;
    }

    try {
      console.log('🗡️ [STEP 1] Starting manual sword boundary detection...');
      
      // Find the sword layer from analysis results (improved search)
      const swordLayer = multiLayerResults.layers.find(layer => {
        const name = (layer.name || '').toLowerCase();
        const type = (layer.type || '').toLowerCase();
        console.log(`🗡️ [SEARCH] Checking layer: name="${name}", type="${type}"`);
        return type === 'weapon' || name.includes('sword') || name === 'sword';
      });

      if (!swordLayer) {
        alert('No sword layer found in analysis results!\n\nDetected layers: ' + 
              multiLayerResults.layers.map(l => `${l.name} (${l.type})`).join(', ') +
              '\n\nPlease ensure the symbol contains a sword or weapon.');
        return;
      }

      console.log('🗡️ [FOUND] Sword layer:', swordLayer);
      console.log('🗡️ [DEBUG] All available layers:', multiLayerResults.layers);
      console.log('🗡️ [DEBUG] Searching for weapon or sword in:', multiLayerResults.layers.map(l => ({ name: l.name, type: l.type })));

      // Validate sword layer has required properties
      if (!swordLayer.bounds || swordLayer.bounds.x === undefined) {
        alert('Sword layer is missing bounds data!\n\n' +
              `Found layer: ${JSON.stringify(swordLayer, null, 2)}\n\n` +
              'The analysis may not have detected proper boundaries.');
        return;
      }

      const swordLayerData: SwordLayerData = {
        id: swordLayer.id || 'unknown',
        name: swordLayer.name || 'Unknown Sword',
        type: swordLayer.type || 'weapon',
        bounds: swordLayer.bounds,
        contourPoints: swordLayer.contourPoints || [],
        animationPotential: swordLayer.animationPotential || 'medium'
      };

      console.log('🗡️ [VALIDATED] Sword layer data:', swordLayerData);

      // Test boundary detection using the imported function
      console.log('🗡️ [IMPORT] testSwordBoundaryDetection function:', testSwordBoundaryDetection);
      
      if (!testSwordBoundaryDetection) {
        alert('Import error: testSwordBoundaryDetection function not available!\n\n' +
              'Check that the manual sword extraction module is properly imported.');
        return;
      }
      
      const debugResults = await testSwordBoundaryDetection(symbolImage, swordLayerData);
      
      console.log('🗡️ [RESULTS] Sword boundary detection results:', debugResults);
      setSwordExtractionDebug(debugResults);

      if (debugResults.length > 0 && debugResults[0].boundsValid) {
        // Store successful Step 1 results for Step 2
        setSwordStep1Success({
          bounds: debugResults[0].pixelBounds,
          layerData: swordLayerData
        });
        
        alert('✅ Sword boundary detection successful!\n\n' +
              `📊 Original bounds: ${JSON.stringify(swordLayerData.bounds)}\n` +
              `📐 Pixel bounds: ${JSON.stringify(debugResults[0].pixelBounds)}\n` +
              `🎯 Validation: PASSED\n\n` +
              '🗡️ Ready for Step 2: Surgical Edge Detection!');
      } else {
        const errorMsg = debugResults[0]?.errorMessage || 'Unknown validation error';
        alert('Sword boundary detection failed!\n\n' +
              `Error: ${errorMsg}\n\n` +
              'Check the debug panel below for detailed analysis.');
      }

    } catch (error) {
      console.error('🗡️ [FAILED] Sword boundary detection error:', error);
      setSwordExtractionDebug([{
        step: "CRITICAL ERROR",
        originalBounds: { x: -1, y: -1, width: -1, height: -1 },
        pixelBounds: { x: -1, y: -1, width: -1, height: -1 },
        imageSize: { width: 0, height: 0 },
        conversionValid: false,
        boundsValid: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }]);
      
      alert('🗡️ Critical Error in Sword Boundary Detection:\n\n' +
            (error instanceof Error ? error.message : 'Unknown error') +
            '\n\nCheck the debug panel for details.');
    }
  };

  // 🗡️ Step 2: Surgical Edge Detection
  const handleSwordEdgeDetection = async () => {
    if (!swordStep1Success) {
      alert('Step 1 not completed!\n\nPlease run "Test Sword Boundary Detection" first and ensure it passes validation.');
      return;
    }

    if (!symbolImage) {
      alert('No symbol image available! Please upload an image first.');
      return;
    }

    try {
      console.log('🗡️ [STEP 2] Starting surgical edge detection for sword...');
      console.log('🗡️ [INPUT] Using Step 1 results:', swordStep1Success);

      const edgeResults = await applySwordEdgeDetection(
        symbolImage,
        swordStep1Success.layerData,
        swordStep1Success.bounds
      );

      console.log('🗡️ [STEP 2 RESULTS] Edge detection complete:', edgeResults.debugInfo);
      setSwordEdgeDetectionResults(edgeResults);

      alert('✅ Surgical Edge Detection Complete!\n\n' +
            `🗡️ ROI: ${edgeResults.debugInfo.roiBounds.width}x${edgeResults.debugInfo.roiBounds.height}\n` +
            `🎯 Edge pixels: ${edgeResults.debugInfo.edgePixelCount} (${edgeResults.debugInfo.edgePercentage}%)\n` +
            `⚙️ Thresholds: ${edgeResults.debugInfo.thresholds.low}-${edgeResults.debugInfo.thresholds.high}\n\n` +
            '🗡️ Ready for Step 3: Contour Tracing!');

    } catch (error) {
      console.error('🗡️ [STEP 2 FAILED] Surgical edge detection error:', error);
      alert('🗡️ Edge Detection Failed:\n\n' +
            (error instanceof Error ? error.message : 'Unknown error') +
            '\n\nCheck console for details.');
    }
  };

  // 🗡️ Step 3: Precise Contour Tracing
  const handleSwordContourTracing = async () => {
    if (!swordEdgeDetectionResults) {
      alert('Step 2 not completed!\n\nPlease run "Apply Surgical Edge Detection" first and ensure it succeeds.');
      return;
    }

    try {
      console.log('🗡️ [STEP 3] Starting precise contour tracing for sword...');
      console.log('🗡️ [INPUT] Using Step 2 edge results:', swordEdgeDetectionResults.debugInfo);

      const contourResults = await traceSwordContour(
        swordEdgeDetectionResults.edges,
        swordEdgeDetectionResults.roiData,
        swordEdgeDetectionResults.debugInfo.roiBounds
      );

      console.log('🗡️ [STEP 3 RESULTS] Contour tracing complete:', contourResults.debugInfo);
      setSwordContourResults(contourResults);

      const corners = contourResults.contourPoints.filter(p => p.type === 'corner').length;
      const curves = contourResults.contourPoints.filter(p => p.type === 'curve').length;
      const edges = contourResults.contourPoints.filter(p => p.type === 'edge').length;

      alert('✅ Precise Contour Tracing Complete!\n\n' +
            `🗡️ Total points: ${contourResults.debugInfo.finalPoints}\n` +
            `📐 Corners: ${corners} | Curves: ${curves} | Edges: ${edges}\n` +
            `📏 Contour length: ${contourResults.debugInfo.contourLength.toFixed(1)}px\n` +
            `🎯 Reduction: ${contourResults.debugInfo.reductionRatio}% optimized\n` +
            `✅ Validation: ${contourResults.debugInfo.validation.overall ? 'PASSED' : 'FAILED'}\n\n` +
            '🗡️ Ready for Step 4: Alpha Mask Generation!');

    } catch (error) {
      console.error('🗡️ [STEP 3 FAILED] Contour tracing error:', error);
      alert('🗡️ Contour Tracing Failed:\n\n' +
            (error instanceof Error ? error.message : 'Unknown error') +
            '\n\nCheck console for details.');
    }
  };

  // 🗡️ Step 4: Alpha Mask Generation
  const handleSwordAlphaMaskGeneration = async () => {
    if (!swordContourResults) {
      alert('Step 3 not completed!\n\nPlease run "Trace Precise Contour" first and ensure it succeeds.');
      return;
    }

    if (!symbolImage || !swordStep1Success) {
      alert('Missing required data!\n\nPlease ensure Steps 1-3 are completed successfully.');
      return;
    }

    try {
      console.log('🗡️ [STEP 4] Starting alpha mask generation for sword...');
      console.log('🗡️ [INPUT] Using Step 3 contour results:', swordContourResults.debugInfo);

      const alphaMaskResults = await generateSwordAlphaMask(
        symbolImage,
        swordContourResults.contourPoints,
        swordStep1Success.bounds
      );

      console.log('🗡️ [STEP 4 RESULTS] Alpha mask generation complete:', alphaMaskResults.debugInfo);
      setSwordAlphaMaskResults(alphaMaskResults);

      const analysis = alphaMaskResults.debugInfo.pixelAnalysis;
      alert('✅ Alpha Mask Generation Complete!\n\n' +
            `🗡️ Mask size: ${alphaMaskResults.debugInfo.maskDimensions.width}x${alphaMaskResults.debugInfo.maskDimensions.height}\n` +
            `📊 Opaque pixels: ${analysis.opaque} (${analysis.opaquePercentage}%)\n` +
            `🔄 Partial pixels: ${analysis.partial} (${analysis.partialPercentage}%)\n` +
            `🔍 Total pixels: ${analysis.total}\n` +
            `✨ Feather radius: ${alphaMaskResults.debugInfo.featherRadius}px\n` +
            `✅ Quality: ${alphaMaskResults.debugInfo.maskQuality}\n\n` +
            '🗡️ Ready for Step 5: Sprite Isolation!');

    } catch (error) {
      console.error('🗡️ [STEP 4 FAILED] Alpha mask generation error:', error);
      alert('🗡️ Alpha Mask Generation Failed:\n\n' +
            (error instanceof Error ? error.message : 'Unknown error') +
            '\n\nCheck console for details.');
    }
  };

  // 🗡️ Step 5: Sword Sprite Isolation with Anti-aliasing
  const handleSwordSpriteCreation = async () => {
    if (!swordAlphaMaskResults) {
      alert('Step 4 not completed!\n\nPlease run "Generate Alpha Mask" first and ensure it succeeds.');
      return;
    }

    if (!symbolImage) {
      alert('No symbol image available! Please ensure all previous steps are completed.');
      return;
    }

    try {
      console.log('🗡️ [STEP 5] Starting sword sprite isolation with anti-aliasing...');
      console.log('🗡️ [INPUT] Using Step 4 alpha mask results:', swordAlphaMaskResults.debugInfo);

      const spriteResults = await createSwordSprite(
        symbolImage,
        swordAlphaMaskResults.alphaMask,
        swordAlphaMaskResults.debugInfo.maskDimensions,
        swordAlphaMaskResults.debugInfo.maskPosition
      );

      console.log('🗡️ [STEP 5 RESULTS] Sprite isolation complete:', spriteResults.debugInfo);
      setSwordSpriteResults(spriteResults);

      const quality = spriteResults.debugInfo.qualityMetrics;
      const pixels = spriteResults.debugInfo.pixelAnalysis;
      
      alert('✅ Sword Sprite Isolation Complete!\n\n' +
            `🗡️ Sprite size: ${spriteResults.debugInfo.spriteDimensions.width}x${spriteResults.debugInfo.spriteDimensions.height}\n` +
            `📊 Content ratio: ${quality.contentRatio}%\n` +
            `✨ Edge quality: ${quality.edgeQuality}%\n` +
            `🎨 Anti-aliasing: ${quality.antiAliasing}\n` +
            `📐 Opaque: ${pixels.opaquePercentage}% | Partial: ${pixels.partialPercentage}%\n` +
            `💾 File size: ${(spriteResults.debugInfo.spriteSize / 1024).toFixed(1)}KB\n` +
            `🏆 Overall quality: ${quality.overall}\n\n` +
            '🗡️ Ready for Step 6: Background Completion!');

    } catch (error) {
      console.error('🗡️ [STEP 5 FAILED] Sprite isolation error:', error);
      alert('🗡️ Sprite Isolation Failed:\n\n' +
            (error instanceof Error ? error.message : 'Unknown error') +
            '\n\nCheck console for details.');
    }
  };

  // 🗡️ Step 6: Background Completion with AI-Guided Inpainting
  const handleSwordBackgroundCompletion = async () => {
    if (!swordAlphaMaskResults || !swordSpriteResults) {
      alert('Steps 4-5 not completed!\n\nPlease complete "Generate Alpha Mask" and "Create Sword Sprite" first.');
      return;
    }

    if (!symbolImage) {
      alert('No symbol image available! Please ensure all previous steps are completed.');
      return;
    }

    try {
      console.log('🗡️ [STEP 6] Starting background completion with AI-guided inpainting...');
      console.log('🗡️ [INPUT] Using alpha mask and sprite results from Steps 4-5');

      const backgroundResults = await generateBackgroundCompletion(
        symbolImage,
        swordAlphaMaskResults.alphaMask,
        swordAlphaMaskResults.debugInfo.maskDimensions,
        swordAlphaMaskResults.debugInfo.maskPosition
      );

      console.log('🗡️ [STEP 6 RESULTS] Background completion complete:', backgroundResults.debugInfo);
      setSwordBackgroundResults(backgroundResults);

      const filling = backgroundResults.debugInfo.fillingAnalysis;
      const quality = backgroundResults.debugInfo.qualityMetrics;
      
      alert('✅ Background Completion Complete!\n\n' +
            `🖼️ Background size: ${backgroundResults.debugInfo.backgroundDimensions.width}x${backgroundResults.debugInfo.backgroundDimensions.height}\n` +
            `📊 Fill ratio: ${filling.fillRatio}%\n` +
            `🎨 Context samples: ${filling.contextSamples.toLocaleString()}\n` +
            `🌈 Dominant colors: ${filling.dominantColors}\n` +
            `🤖 AI method: ${quality.seamlessBlending}\n` +
            `🧠 Context awareness: ${quality.contextAwareness}\n` +
            `🏆 Fill quality: ${quality.fillQuality}\n` +
            `💾 File size: ${(backgroundResults.debugInfo.fileSize / 1024).toFixed(1)}KB\n\n` +
            '🗡️ Ready for Step 7: Animation Testing!');

    } catch (error) {
      console.error('🗡️ [STEP 6 FAILED] Background completion error:', error);
      alert('🗡️ Background Completion Failed:\n\n' +
            (error instanceof Error ? error.message : 'Unknown error') +
            '\n\nCheck console for details.');
    }
  };

  // 🗡️ Step 7: Validation & Animation Testing
  const handleSwordValidationAndTesting = async () => {
    if (!swordSpriteResults || !swordBackgroundResults) {
      alert('Steps 5-6 not completed!\n\nPlease complete "Create Sword Sprite" and "Complete Background" first.');
      return;
    }

    if (!symbolImage) {
      alert('No symbol image available! Please ensure all previous steps are completed.');
      return;
    }

    try {
      console.log('🗡️ [STEP 7] Starting validation and animation testing...');
      console.log('🗡️ [INPUT] Using sprite and background results from Steps 5-6');

      // Compile extraction metrics from all previous steps
      const extractionMetrics = {
        contour: swordContourResults?.debugInfo,
        alphaMask: swordAlphaMaskResults?.debugInfo?.pixelAnalysis,
        sprite: swordSpriteResults?.debugInfo?.qualityMetrics,
        background: swordBackgroundResults?.debugInfo?.fillingAnalysis
      };

      const validationResults = await validateSwordExtraction(
        symbolImage,
        swordSpriteResults.spriteBase64,
        swordBackgroundResults.backgroundBase64,
        extractionMetrics
      );

      console.log('🗡️ [STEP 7 RESULTS] Validation and testing complete:', validationResults);
      setSwordValidationResults(validationResults);

      const validation = validationResults.validationResults;
      const animation = validationResults.animationTest;
      const qualityDashboard = validationResults.qualityDashboard;
      const refinementTools = validationResults.refinementTools;
      
      alert('✅ Enhanced Validation Suite Complete!\n\n' +
            `🏆 Overall Score: ${validation.overallScore}/100 (${validation.overallStatus})\n` +
            `📊 Quality Dashboard:\n` +
            `  • Overall Quality Index: ${qualityDashboard.overallQualityIndex.toFixed(1)}/100\n` +
            `  • Pixel Precision: ${qualityDashboard.pixelPrecisionScore.toFixed(1)}/100\n` +
            `  • Alpha Quality: ${qualityDashboard.alphaQualityIndex.toFixed(1)}/100\n` +
            `  • Contour Smoothness: ${qualityDashboard.contourSmoothness.toFixed(1)}/100\n` +
            `  • Background Seamless: ${qualityDashboard.backgroundSeamlessness.toFixed(1)}/100\n\n` +
            `🎬 Advanced Animation Tests: ${animation.testCount} tests completed\n` +
            `📱 Animation Score: ${animation.overallAnimationScore.toFixed(1)}/100\n` +
            `🔧 Refinement Tools: ${refinementTools.toolCount} tools available\n` +
            `✅ Production Ready: ${validation.comparison.readyForProduction ? 'YES' : 'NO'}\n` +
            `💡 Recommendations: ${qualityDashboard.recommendations.length} improvements available\n\n` +
            '🗡️ Check enhanced validation dashboard below!');

    } catch (error) {
      console.error('🗡️ [STEP 7 FAILED] Validation and testing error:', error);
      alert('🗡️ Validation & Testing Failed:\n\n' +
            (error instanceof Error ? error.message : 'Unknown error') +
            '\n\nCheck console for details.');
    }
  };

  // 🎨 GPT-Vision Sprite Recreation Functions
  
  // Check GPT-Vision readiness on component mount
  useEffect(() => {
    const checkGPTVisionReady = () => {
      try {
        const ready = hasGPTApiKey();
        setGptVisionReady(ready);
        console.log(`🎨 [GPT-VISION] AI recreation system ${ready ? 'ready' : 'needs API key'}`);
      } catch (error) {
        console.error('🎨 [GPT-VISION] Failed to check readiness:', error);
        setGptVisionReady(false);
      }
    };
    
    checkGPTVisionReady();
  }, []);

  // Handle GPT-Vision sprite recreation trigger
  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (clickMode !== 'gpt-vision' || !gptVisionReady || !symbolImage) return;
    
    console.log(`🎨 [GPT-VISION] Image clicked - starting sprite recreation`);
    
    // Auto-run GPT-Vision recreation on click
    if (clickMode === 'gpt-vision') {
      handleGPTVisionRecreation();
    }
  };

  // GPT-Vision powered sprite recreation
  const handleGPTVisionRecreation = async () => {
    if (!symbolImage || !gptVisionReady) {
      alert('🎨 GPT-Vision AI system not ready. Please set your OpenAI API key in settings.');
      return;
    }

    setIsUsingGPTVision(true);
    console.log(`🎨 [GPT-VISION] Starting AI sprite recreation`);

    try {
      const request: SpriteRecreationRequest = {
        imageBase64: symbolImage,
        objectType: 'sword', // Could be made dynamic
        separationMode: recreationMode,
        outputLayers: targetLayers,
        stylePreservation: 'enhanced',
        outputFormat: 'layered'
      };

      const result = await recreateAsSprites(request);
      setGptRecreationResults(result);

      if (result.success) {
        alert(`🎨 ✅ GPT-Vision Recreation Complete!\n\n` +
              `🎯 Layers Created: ${result.layers.length}\n` +
              `🏆 Quality Score: ${result.qualityScore}/100\n` +
              `⚡ Processing Time: ${result.processingTime.toFixed(1)}ms\n` +
              `💰 Estimated Cost: $${result.totalCost.toFixed(3)}\n\n` +
              `💡 Recommendations:\n${result.recommendations.join('\n')}\n\n` +
              '🖼️ Check the results in the preview section!');
      } else {
        alert(`🎨 GPT-Vision Recreation Failed:\n\n${result.recommendations.join('\n')}`);
      }

    } catch (error) {
      console.error('🎨 [GPT-VISION] Recreation failed:', error);
      alert(`🎨 GPT-Vision Recreation Error:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your API key and try again.`);
    } finally {
      setIsUsingGPTVision(false);
    }
  };

  // Switch between manual and GPT-Vision modes
  const toggleExtractionMode = () => {
    if (!gptVisionReady && clickMode === 'manual') {
      alert('🎨 GPT-Vision AI system needs an API key. Please check settings.');
      return;
    }
    
    const newMode = clickMode === 'manual' ? 'gpt-vision' : 'manual';
    setClickMode(newMode);
    console.log(`🔄 [MODE] Switched to ${newMode.toUpperCase()} extraction mode`);
  };

  // 🎬 Phase 1.4: Animation Timeline Functions
  const createAnimationFromExtractedLayers = async () => {
    if (Object.keys(extractedLayers).length === 0) {
      const hasMultiLayerData = multiLayerResults && multiLayerResults.layers && multiLayerResults.layers.length > 0;
      
      if (hasMultiLayerData) {
        alert(`No extracted layers available!\n\n🎯 PHASE 2.0 WORKFLOW:\n1. ✅ Layer analysis complete (${multiLayerResults.layers.length} layers found)\n2. Need to extract layers using 📸 Extract buttons\n3. ⏳ Then create animation timeline\n\nPlease extract some layers first from the Layer Controls panel.`);
      } else {
        alert('No extracted layers available!\n\n🎯 COMPLETE WORKFLOW:\n1. Upload symbol image\n2. Click "🎨 TEST LAYERS" for analysis\n3. Extract layers using 📸 Extract buttons\n4. Create animation timeline\n\nPlease start with "🎨 TEST LAYERS" button.');
      }
      return;
    }

    try {
      console.log(`🎬 [Phase 1.4] Creating animation timeline from ${Object.keys(extractedLayers).length} layers...`);

      // Get selected preset
      const selectedPreset = animationPresets.find(p => p.id === selectedPresetId);
      const presetName = selectedPreset?.name || 'Custom Animation';
      const duration = selectedPreset?.duration || 3000;

      // Create animation sequence
      const sequence = createTimelineFromLayers(
        extractedLayers,
        `${presetName} - ${new Date().toLocaleTimeString()}`,
        duration
      );

      setCurrentAnimationSequence(sequence);
      setShowAnimationTimeline(true);

      // 🎭 Phase 2.0: Force-initialize visual renderer and load sprites
      console.log('🔍 [DEBUG] Visual renderer initialization check:', {
        visualRendererReady,
        canvasExists: !!animationCanvasRef.current,
        canvasElement: animationCanvasRef.current,
        canvasWidth: animationCanvasRef.current?.width,
        canvasHeight: animationCanvasRef.current?.height,
        isReady: visualAnimationRenderer.isReady()
      });
      
      if (!visualRendererReady && animationCanvasRef.current) {
        try {
          console.log('🔧 [Phase 2.0] Force-initializing visual renderer...');
          console.log('🔧 [DEBUG] Canvas details before init:', {
            canvas: animationCanvasRef.current,
            width: animationCanvasRef.current.width,
            height: animationCanvasRef.current.height,
            getBoundingClientRect: animationCanvasRef.current.getBoundingClientRect()
          });
          
          await initializeVisualRenderer(animationCanvasRef.current);
          setVisualRendererReady(true);
          
          console.log('✅ [Phase 2.0] Visual renderer force-initialized!');
          console.log('🔧 [DEBUG] Renderer state after init:', {
            visualRendererReady: true,
            isReady: visualAnimationRenderer.isReady()
          });
        } catch (error) {
          console.error('[Phase 2.0] Force-initialization failed:', error);
          console.error('[DEBUG] Full error details:', {
            message: error.message,
            stack: error.stack,
            canvasState: {
              exists: !!animationCanvasRef.current,
              width: animationCanvasRef.current?.width,
              height: animationCanvasRef.current?.height
            }
          });
        }
      } else {
        console.log('🔍 [DEBUG] Skipping force-init:', {
          reason: visualRendererReady ? 'already ready' : 'no canvas',
          visualRendererReady,
          canvasExists: !!animationCanvasRef.current
        });
      }
      
      // Load sprites into visual renderer (with retry mechanism)
      const maxRetries = 3;
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          if (visualAnimationRenderer.isReady()) {
            await loadSpritesForAnimation(extractedLayers);
            console.log(`🎨 [Phase 2.0] Sprites loaded into visual renderer (attempt ${retryCount + 1})`);
            break;
          } else {
            console.warn(`⚠️ [Phase 2.0] Visual renderer not ready, retrying... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 200)); // Wait 200ms
            retryCount++;
          }
        } catch (error) {
          console.error(`[Phase 2.0] Failed to load sprites (attempt ${retryCount + 1}):`, error);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait longer between retries
          }
        }
      }
      
      if (retryCount >= maxRetries) {
        console.error('[Phase 2.0] Failed to load sprites after maximum retries');
      }

      // Set up timeline callbacks
      professionalAnimationTimeline.on('timeUpdate', (data: any) => {
        setTimelineState(professionalAnimationTimeline.getTimelineState());
      });

      professionalAnimationTimeline.on('trackUpdate', (data: any) => {
        // Check if animation is enabled for this layer
        if (layerAnimationEnabled[data.layerId] === false) {
          return; // Skip animation if disabled
        }
        
        // 🎭 Phase 2.0: Update BOTH visual renderers - preview AND main canvas
        
        // 1. Update animation preview canvas (small one)
        const previewRendererReady = visualAnimationRenderer.isReady();
        if (previewRendererReady) {
          try {
            updateAnimatedSprite(data.layerId, data.properties);
            console.log(`🎭 [PREVIEW] ${data.layerId}: pos(${data.properties.x.toFixed(1)}, ${data.properties.y.toFixed(1)}) rot(${data.properties.rotation.toFixed(1)}°)`);
          } catch (error) {
            console.error(`[PREVIEW] Failed to update sprite ${data.layerId}:`, error);
          }
        }
        
        // 2. Update main canvas (professional renderer)
        const mainRendererReady = professionalPixiRenderer && rendererReady;
        if (mainRendererReady) {
          try {
            // Apply animation properties to main canvas sprites
            const mainSprite = professionalPixiRenderer.sprites.get(data.layerId);
            if (mainSprite) {
              // Apply position changes (scaled appropriately for main canvas)
              const scaleX = mainSprite.originalTransform.scaleX * data.properties.scaleX;
              const scaleY = mainSprite.originalTransform.scaleY * data.properties.scaleY;
              
              mainSprite.sprite.x = mainSprite.originalTransform.x + (data.properties.x - mainSprite.originalTransform.x) * 0.5;
              mainSprite.sprite.y = mainSprite.originalTransform.y + (data.properties.y - mainSprite.originalTransform.y) * 0.5;
              mainSprite.sprite.rotation = (data.properties.rotation * Math.PI) / 180;
              mainSprite.sprite.scale.set(scaleX, scaleY);
              mainSprite.sprite.alpha = data.properties.alpha;
              
              console.log(`🏛️ [MAIN CANVAS] ${data.layerId}: animated!`);
            } else {
              console.warn(`⚠️ [MAIN CANVAS] Sprite not found: ${data.layerId}`);
              const availableKeys = Array.from(professionalPixiRenderer.sprites.keys());
              console.warn(`🔍 [MAIN CANVAS] Available sprites:`, availableKeys);
              
              // 🔧 EMERGENCY FIX: Try to find sprite by similar name or use first available
              if (availableKeys.length > 0) {
                const fallbackSpriteId = availableKeys[0];
                console.log(`🚑 [MAIN CANVAS] Using fallback sprite: ${fallbackSpriteId}`);
                
                const fallbackSprite = professionalPixiRenderer.sprites.get(fallbackSpriteId);
                if (fallbackSprite) {
                  // Apply animation properties to fallback sprite
                  const scaleX = fallbackSprite.originalTransform.scaleX * data.properties.scaleX;
                  const scaleY = fallbackSprite.originalTransform.scaleY * data.properties.scaleY;
                  
                  fallbackSprite.sprite.x = fallbackSprite.originalTransform.x + (data.properties.x - fallbackSprite.originalTransform.x) * 0.5;
                  fallbackSprite.sprite.y = fallbackSprite.originalTransform.y + (data.properties.y - fallbackSprite.originalTransform.y) * 0.5;
                  fallbackSprite.sprite.rotation = (data.properties.rotation * Math.PI) / 180;
                  fallbackSprite.sprite.scale.set(scaleX, scaleY);
                  fallbackSprite.sprite.alpha = data.properties.alpha;
                  
                  console.log(`🏛️ [MAIN CANVAS FALLBACK] ${fallbackSpriteId}: animated!`);
                }
              }
            }
          } catch (error) {
            console.error(`[MAIN CANVAS] Failed to update sprite ${data.layerId}:`, error);
          }
        } else {
          console.warn(`⚠️ [MAIN CANVAS] Renderer not ready:`, {
            professionalRendererExists: !!professionalPixiRenderer,
            rendererReady,
            layerId: data.layerId
          });
        }
        
        // Debug logging (enhanced frequency for troubleshooting)
        if (Math.random() < 0.1) { // Log 10% of updates for better debugging
          console.log(`🎭 [Phase 2.0] Animation update ${data.layerId}:`, {
            position: `${data.properties.x.toFixed(1)}, ${data.properties.y.toFixed(1)}`,
            rotation: `${data.properties.rotation.toFixed(1)}°`,
            scale: `${data.properties.scaleX.toFixed(2)}x`,
            alpha: `${(data.properties.alpha * 100).toFixed(1)}%`,
            rendererReady: rendererReady
          });
        }
      });

      console.log(`✅ [Phase 1.4] Animation timeline created with ${sequence.tracks.length} tracks`);

      alert(`🎬 Animation Timeline Created!\n\n${sequence.tracks.length} tracks ready for animation\nDuration: ${duration}ms\nPreset: ${presetName}\n\n✅ Timeline panel active\n✅ Keyframes generated\n✅ Visual renderer ${visualRendererReady ? 'connected' : 'loading'}\n✅ Export system ready\n\n${visualRendererReady ? '🎭 Sprites will animate visually!' : '⏳ Loading visual renderer...'}`);

    } catch (error) {
      console.error(`[Phase 1.4] Timeline creation failed:`, error);
      alert(`Timeline creation failed:\n\n${error.message}`);
    }
  };

  const playAnimation = async () => {
    if (currentAnimationSequence) {
      // Force-check renderer readiness before playing
      const rendererReady = visualRendererReady && visualAnimationRenderer.isReady();
      
      if (!rendererReady) {
        console.warn('⚠️ [Play] Visual renderer not ready, checking...');
        
        // Try to force-initialize if canvas exists
        if (!visualRendererReady && animationCanvasRef.current) {
          try {
            console.log('🔧 [Play] Force-initializing visual renderer...');
            await initializeVisualRenderer(animationCanvasRef.current);
            setVisualRendererReady(true);
          } catch (error) {
            console.error('[Play] Force-initialization failed:', error);
          }
        }
        
        // Verify sprites are loaded
        console.log('🔍 [Play] Checking sprite loading...', {
          rendererReady: visualAnimationRenderer.isReady(),
          extractedLayersExist: !!extractedLayers,
          extractedLayersKeys: extractedLayers ? Object.keys(extractedLayers) : []
        });
        
        if (visualAnimationRenderer.isReady() && extractedLayers) {
          try {
            await loadSpritesForAnimation(extractedLayers);
            console.log('🎨 [Play] Sprites force-loaded for animation');
          } catch (error) {
            console.error('[Play] Failed to load sprites:', error);
          }
        } else {
          console.warn('⚠️ [Play] Cannot load sprites:', {
            rendererReady: visualAnimationRenderer.isReady(),
            hasExtractedLayers: !!extractedLayers
          });
        }
      }
      
      professionalAnimationTimeline.play();
      console.log(`▶️ [Phase 1.4] Playing animation: ${currentAnimationSequence.name}`, {
        rendererReady: visualRendererReady && visualAnimationRenderer.isReady(),
        spritesLoaded: visualAnimationRenderer.isReady()
      });
    }
  };

  const pauseAnimation = () => {
    professionalAnimationTimeline.pause();
    console.log(`⏸️ [Phase 1.4] Animation paused`);
  };

  const stopTimelineAnimation = () => {
    professionalAnimationTimeline.stop();
    console.log(`⏹️ [Phase 1.4] Animation stopped`);
  };

  const exportAnimation = async (format: 'spine' | 'lottie' | 'css' | 'gif' | 'webm') => {
    if (!currentAnimationSequence) {
      alert('No animation to export!\n\nCreate an animation timeline first.');
      return;
    }

    try {
      console.log(`🚀 [Phase 1.4] Exporting animation as ${format.toUpperCase()}...`);
      
      const exportedData = await professionalAnimationTimeline.exportAnimation(format);
      
      // Download the exported file
      const blob = new Blob([exportedData], { 
        type: format === 'css' ? 'text/css' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentAnimationSequence.name.replace(/\s+/g, '_')}.${format === 'css' ? 'css' : 'json'}`;
      link.click();
      URL.revokeObjectURL(url);

      console.log(`✅ [Phase 1.4] Animation exported as ${format.toUpperCase()}`);
      alert(`🚀 Animation Exported!\n\nFormat: ${format.toUpperCase()}\nFile: ${link.download}\n\nReady for professional animation software! 🎭`);

    } catch (error) {
      console.error(`[Phase 1.4] Export failed:`, error);
      alert(`Export failed:\n\n${error.message}`);
    }
  };
  
  // DEFENSIVE: Track DOM stability
  const domStabilityRef = useRef<{
    container: HTMLElement | null;
    canvas: HTMLCanvasElement | null;
    canvasParent: HTMLElement | null;
  }>({ container: null, canvas: null, canvasParent: null });
  
  // Add browser console utilities for debugging
  useEffect(() => {
    // Make storage utilities available globally for debugging
    (window as any).clearAnimationLab = clearAnimationLabStorage;
    (window as any).getStorageUsage = getStorageUsage;
    
    const usage = getStorageUsage();
    console.log(`📊 LocalStorage usage: ${usage.percentage}% (${(usage.used / 1024 / 1024).toFixed(1)}MB / ${(usage.total / 1024 / 1024).toFixed(1)}MB)`);
    
    if (usage.percentage > 30) {
      console.warn(`⚠️ LocalStorage usage high: ${usage.percentage}% - Auto-clearing to prevent quota errors`);
      
      // Aggressive clearing
      try {
        // Clear ALL localStorage first
        localStorage.clear();
        console.log('🧹 Cleared ALL localStorage');
        
        // Then use our specific clearing function
        clearAnimationLabStorage();
        
        const newUsage = getStorageUsage();
        console.log(`✅ LocalStorage cleared successfully: ${newUsage.percentage}%`);
      } catch (clearError) {
        console.error('Error during localStorage clearing:', clearError);
      }
    }
  }, []);

  // Force component to be mounted - but handle React Strict Mode
  useEffect(() => {
    isComponentMounted.current = true;
    console.log('🔧 Component mounted, setting flag to true');
    
    // Don't immediately set to false on unmount in dev mode (React Strict Mode)
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Delaying unmount flag...');
        setTimeout(() => {
          isComponentMounted.current = false;
          console.log('🔧 Component unmounting flag set after delay');
        }, 100);
      } else {
        console.log('🔧 Component unmounting, setting flag to false');
        isComponentMounted.current = false;
      }
    };
  }, []);

  // 🎭 Phase 2.0: Initialize Visual Animation Renderer
  useEffect(() => {
    const initializeAnimationRenderer = async () => {
      if (animationCanvasRef.current && !visualRendererReady) {
        try {
          console.log('🎭 [Phase 2.0] Initializing visual animation renderer...');
          await initializeVisualRenderer(animationCanvasRef.current);
          setVisualRendererReady(true);
          console.log('✅ [Phase 2.0] Visual animation renderer ready!');
        } catch (error) {
          console.error('[Phase 2.0] Visual renderer initialization failed:', error);
        }
      }
    };

    // Small delay to ensure canvas is mounted
    const timeoutId = setTimeout(initializeAnimationRenderer, 100);
    return () => clearTimeout(timeoutId);
  }, [animationCanvasRef, visualRendererReady]);

  // Update renderer stats periodically
  useEffect(() => {
    if (!visualRendererReady) return;

    const updateStats = () => {
      setRendererStats(getRendererStats());
    };

    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [visualRendererReady]);

  // Initialize Professional PIXI renderer - ULTRA ROBUST
  useEffect(() => {
    let cleanupFn: (() => void) | undefined;
    let initializationTimer: NodeJS.Timeout | undefined;
    let retryCount = 0;
    const maxRetries = 5; // More retries
    
    const initializeRenderer = async () => {
      try {
        retryCount++;
        console.log(`🚀 ROBUST: Renderer initialization attempt ${retryCount}/${maxRetries}`);
        
        // Wait for DOM to be stable
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        const container = canvasContainerRef.current;
        if (!container) {
          console.log('🛡️ No container found, retrying...');
          
          // Always retry if no container
          if (retryCount < maxRetries) {
            console.log(`🔄 Container not ready, retrying in 1000ms... (${retryCount}/${maxRetries})`);
            initializationTimer = setTimeout(initializeRenderer, 1000);
          } else {
            console.error('💥 FATAL: Container never became available');
            setVisionStatus({ 
              status: 'error', 
              message: 'Canvas container failed to initialize', 
              startTime: Date.now() 
            });
          }
          return;
        }
        
        // Reset component mount flag to true when we have a container
        isComponentMounted.current = true;
        
        // Check container dimensions
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          console.warn('⚠️ Container has zero dimensions, retrying...');
          if (retryCount < maxRetries) {
            initializationTimer = setTimeout(initializeRenderer, 500);
          }
          return;
        }
        
        console.log(`🎮 Initializing PIXI renderer (container: ${rect.width}x${rect.height})`);
        
        // Skip if already has a working canvas
        const existingCanvas = container.querySelector('canvas');
        if (existingCanvas && rendererInitialized.current) {
          console.log('✅ Canvas already exists and renderer initialized');
          setRendererReady(true);
          return;
        }
        
        // ULTRA SAFE: Force cleanup with comprehensive error handling
        try {
          if (existingCanvas) {
            console.log('🧹 Removing existing canvas');
            try {
              if (existingCanvas.parentNode === container) {
                existingCanvas.remove();
              } else if (existingCanvas.parentNode) {
                existingCanvas.parentNode.removeChild(existingCanvas);
              }
            } catch (canvasRemoveError) {
              console.warn('⚠️ Canvas removal failed (continuing):', canvasRemoveError.message);
              // Try alternative removal methods
              try {
                existingCanvas.style.display = 'none';
                existingCanvas.style.visibility = 'hidden';
              } catch (styleError) {
                console.warn('⚠️ Canvas hiding failed:', styleError.message);
              }
            }
          }
          
          // PRODUCTION: Gentler cleanup to avoid React conflicts
          try {
            // Only remove canvas elements, let React handle other elements
            const canvases = container.querySelectorAll('canvas');
            canvases.forEach((canvas, index) => {
              try {
                if (canvas.parentNode === container) {
                  container.removeChild(canvas);
                  console.log(`🧹 Removed canvas ${index}`);
                }
              } catch (canvasError) {
                console.warn(`⚠️ Canvas ${index} removal failed, hiding instead`);
                canvas.style.display = 'none';
              }
            });
          } catch (cleanupError) {
            console.warn('⚠️ Canvas cleanup failed:', cleanupError.message);
          }
        } catch (cleanupError) {
          console.warn('⚠️ Overall cleanup error (continuing):', cleanupError.message);
        }
        
        // Mark as initializing
        rendererInitialized.current = true;
        
        // Initialize PIXI with error handling
        try {
          console.log('🎮 Initializing PIXI with container dimensions:', container.getBoundingClientRect());
          await professionalPixiRenderer.initialize(container);
          
          // CRITICAL: Wait for canvas to be actually created
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const newCanvas = container.querySelector('canvas');
          if (newCanvas) {
            console.log('✅ RENDERER READY - Canvas created successfully');
            setRendererReady(true);
            
            // Reset vision status to ready for symbol loading
            setVisionStatus({ 
              status: 'idle', 
              message: 'Renderer ready - waiting for symbol upload' 
            });
            
            // Just log that renderer is ready - immediate trigger moved to symbolImage change
            console.log('🎯 Renderer ready - waiting for symbol to be set by automation store...');
            
            // Setup performance monitoring
            try {
              realTimePerformanceMonitor.startMonitoring();
              const unsubscribe = realTimePerformanceMonitor.onMetricsUpdate((metrics) => {
                if (isComponentMounted.current) {
                  setPerformanceMetrics(metrics);
                }
              });
              cleanupFn = () => {
                unsubscribe();
                realTimePerformanceMonitor.stopMonitoring();
              };
            } catch (monitorError) {
              console.warn('⚠️ Performance monitoring failed:', monitorError);
            }
          } else {
            throw new Error('Canvas was not created or component unmounted');
          }
          
        } catch (pixiError) {
          console.error(`PIXI initialization failed (attempt ${retryCount}):`, pixiError);
          rendererInitialized.current = false;
          
          // Retry if we haven't exceeded max attempts
          if (retryCount < maxRetries && isComponentMounted.current) {
            console.log(`🔄 Retrying in 1 second... (${retryCount}/${maxRetries})`);
            initializationTimer = setTimeout(initializeRenderer, 1000);
          } else {
            console.error('💥 FATAL: All renderer initialization attempts failed');
          }
        }
        
      } catch (error) {
        console.error('Renderer initialization error:', error);
        rendererInitialized.current = false;
        
        if (retryCount < maxRetries && isComponentMounted.current) {
          initializationTimer = setTimeout(initializeRenderer, 1000);
        }
      }
    };

    // Start initialization immediately when component mounts
    console.log('🚀 Starting ROBUST renderer initialization...');
    // Longer delay to ensure DOM is stable
    initializationTimer = setTimeout(initializeRenderer, 1000);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up ROBUST renderer initialization...');
      isComponentMounted.current = false;
      
      if (initializationTimer) clearTimeout(initializationTimer);
      if (cleanupFn) {
        try {
          cleanupFn();
        } catch (error) {
          console.warn('⚠️ Cleanup error:', error);
        }
      }
    };
  }, []); // Initialize once on mount
  
  // Handle cleanup only on page navigation/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (rendererInitialized.current) {
        console.log('🧹 AutomatedStudio: Page unload - destroying renderer...');
        isComponentMounted.current = false;
        try {
          professionalPixiRenderer.destroy();
        } catch (error) {
          console.warn('⚠️ Error during renderer cleanup:', error);
        }
        rendererInitialized.current = false;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // CRITICAL: Don't destroy renderer on component unmount in dev mode
      if (process.env.NODE_ENV !== 'development') {
        handleBeforeUnload();
      }
    };
  }, []);

  // Sync animation state with PIXI renderer - ONLY if sprites exist and component is mounted
  useEffect(() => {
    // DEFENSIVE: Check if component is still mounted
    if (!isComponentMounted.current) {
      console.log('🛡️ Component unmounted, skipping animation sync');
      return;
    }
    
    console.log('🔄 Syncing animation state:', animationState.isPlaying ? 'PLAYING' : 'PAUSED');
    
    try {
      // Check if sprites exist before trying to animate
      if (animationState.isPlaying) {
        // Only start if sprites are ready and renderer is initialized
        if (rendererInitialized.current && 
            professionalPixiRenderer.sprites && 
            professionalPixiRenderer.sprites.size > 0) {
          console.log('✅ Sprites ready, starting animation');
          professionalPixiRenderer.play();
        } else {
          console.log('⏳ Sprites not ready yet, waiting...');
        }
      } else {
        // Only pause if renderer is initialized
        if (rendererInitialized.current) {
          professionalPixiRenderer.pause();
        }
      }
    } catch (animationError) {
      console.warn('⚠️ Animation sync error (suppressed):', animationError);
    }
  }, [animationState.isPlaying]);

  // 🚀 IMMEDIATE TRIGGER: Load symbol as soon as symbolImage is set and renderer is ready
  useEffect(() => {
    // Only trigger if we have both symbolImage and renderer ready
    if (!symbolImage || !rendererReady) {
      if (!rendererReady) {
        console.log('🛡️ Renderer not ready, skipping symbol load', {
          hasSymbol: !!symbolImage,
          ready: rendererReady
        });
        setVisionStatus({ 
          status: 'idle', 
          message: 'Waiting for renderer to initialize...' 
        });
      } else if (!symbolImage) {
        console.log('🛡️ No symbol image, waiting...');
      }
      return;
    }
    
    // 🚀 IMMEDIATE: Both conditions met - fire immediately!
    console.log('🎯 IMMEDIATE: Symbol and renderer ready - triggering GPT-4 Vision NOW!');
    
    // ULTRA ROBUST: Direct immediate execution with comprehensive error handling
    const executeImmediately = async () => {
      let gptVisionStarted = false;
      let detectionResults = null;
      
      try {
        console.log('🚀 IMMEDIATE: Starting GPT-4 Vision analysis...');
        setVisionStatus({ status: 'initializing', message: 'Starting immediate symbol load...', startTime: Date.now() });
        
        // CRITICAL: Protect GPT-4 Vision call from React DOM errors
        try {
          console.log('🛡️ PROTECTED: Starting GPT-4 Vision API call...');
          setVisionStatus({ status: 'calling-api', message: 'Calling GPT-4 Vision API...', startTime: Date.now() });
          gptVisionStarted = true;
          
          // Use setTimeout to ensure call happens outside React lifecycle
          detectionResults = await new Promise((resolve, reject) => {
            setTimeout(async () => {
              try {
                console.log('🎯 ISOLATED: Executing multi-layer GPT-4 Vision analysis...');
                
                // Step 1: Multi-layer analysis with GPT-4 Vision - TEMPORARILY DISABLED FOR SVG TESTING
                // const { analyzeImageLayers } = await import('../../utils/gptVisionClient');
                // const multiLayerResults = await analyzeImageLayers(symbolImage);
                // console.log('✅ Multi-layer analysis completed:', multiLayerResults);
                
                // Step 1: Multi-layer analysis with GPT-4 Vision - RE-ENABLED FOR KNIGHT TEST
                const { analyzeImageLayers } = await import('../../utils/gptVisionClient');
                const multiLayerResults = await analyzeImageLayers(symbolImage);
                console.log('✅ Multi-layer analysis completed:', multiLayerResults);
                
                // Step 2: Load base symbol for main canvas - RE-ENABLED FOR KNIGHT TEST
                const results = await professionalPixiRenderer.loadSymbolWithUniversalDetection(symbolImage, 'idle');
                console.log('✅ Symbol loading completed:', results);
                
                // Step 3: DISABLED - Manual extraction workflow only
                console.log(`🗡️ [MANUAL MODE] Auto-extraction disabled - use manual sword extraction workflow`);
                console.log(`🎯 [ANALYSIS] Found ${multiLayerResults.layers.length} layers for manual extraction:`, multiLayerResults.layers.map(l => `${l.name} (${l.type})`));
                
                // Store analysis results for manual extraction workflow
                setMultiLayerResults(multiLayerResults);
                
                // OLD AUTO-EXTRACTION CODE DISABLED
                if (false && multiLayerResults && multiLayerResults.layers.length > 0) {
                  console.log(`🔧 Auto-extracting ${multiLayerResults.layers.length} detected layers...`);
                  
                  const { professionalLayerExtractor } = await import('../../utils/professionalLayerExtractor');
                  const extractedLayers = {};
                  
                  // Extract each detected layer automatically
                  for (const layer of multiLayerResults.layers) {
                    try {
                      console.log(`🔧 Extracting layer: ${layer.name} (${layer.type})`);
                      const extractedLayer = await professionalLayerExtractor.extractLayerFromImage(
                        symbolImage,
                        layer.bounds,
                        layer.contourPoints,
                        layer.id,
                        layer.name,
                        layer.type,
                        { 
                          method: 'surgical',
                          edgeThreshold: 80,
                          surgicalPrecision: 'high',
                          contentAwareFill: true,
                          antiAliasing: true,
                          edgeSmoothing: 2.0,
                          colorSimilarityThreshold: 25,
                          alphaFeathering: 3,
                          morphologyKernel: 3
                        }
                      );
                      
                      extractedLayers[layer.id] = {
                        ...extractedLayer,
                        animationPotential: layer.animationPotential
                      };
                      
                      console.log(`✅ Layer extracted: ${layer.name}`);
                    } catch (layerError) {
                      console.warn(`⚠️ Failed to extract layer ${layer.name}:`, layerError);
                    }
                  }
                  
                  // Store extracted layers for animation
                  setExtractedLayers(extractedLayers);
                  setMultiLayerResults(multiLayerResults);
                  
                  // Enable all layers for animation by default
                  const defaultAnimationSettings = {};
                  Object.keys(extractedLayers).forEach(layerId => {
                    defaultAnimationSettings[layerId] = true;
                  });
                  setLayerAnimationEnabled(defaultAnimationSettings);
                  
                  console.log(`✅ Auto-extraction complete: ${Object.keys(extractedLayers).length} layers ready`);
                  
                  // Step 4: Load individual layer sprites into main canvas
                  if (Object.keys(extractedLayers).length > 0) {
                    console.log('🎬 Loading individual layer sprites into main canvas...');
                    
                    setTimeout(async () => {
                      try {
                        // Hide the original whole symbol and clear the sprites map
                        professionalPixiRenderer.app.stage.removeChildren();
                        professionalPixiRenderer.sprites.clear();
                        
                        // Load each extracted layer as individual sprite in main canvas
                        for (const [layerId, layerData] of Object.entries(extractedLayers)) {
                          try {
                            console.log(`🔧 Loading layer sprite: ${layerData.name} into main canvas`);
                            
                            // Create PIXI texture from extracted layer base64
                            const texture = await PIXI.Texture.fromURL(layerData.spriteBase64);
                            const sprite = new PIXI.Sprite(texture);
                            
                            // Position the layer sprite to recreate the original symbol layout
                            const canvasWidth = professionalPixiRenderer.app.screen.width;
                            const canvasHeight = professionalPixiRenderer.app.screen.height;
                            
                            // Center the sprite on canvas like the original symbol (from logs: 1216,623.5)
                            const symbolCenterX = canvasWidth / 2;
                            const symbolCenterY = canvasHeight / 2;
                            
                            // Use the same scale as the original symbol
                            const mainSymbolScale = 0.49;
                            sprite.scale.set(mainSymbolScale, mainSymbolScale);
                            sprite.anchor.set(0.5, 0.5);
                            
                            // Position each layer sprite at the center, they will be moved by animation
                            // The animation timeline will handle the relative positioning
                            sprite.x = symbolCenterX;
                            sprite.y = symbolCenterY;
                            
                            // Store in professional renderer sprites map with proper structure
                            professionalPixiRenderer.sprites.set(layerId, {
                              id: layerId,
                              sprite,
                              alphaMask: new PIXI.Graphics(), // Create empty alpha mask
                              originalTransform: {
                                x: sprite.x,
                                y: sprite.y,
                                scaleX: sprite.scale.x,
                                scaleY: sprite.scale.y,
                                rotation: 0,
                                alpha: 1
                              },
                              animations: [], // Empty animations array to prevent errors
                              warnedAboutMissingAnimations: false
                            });
                            
                            // Add to stage
                            professionalPixiRenderer.app.stage.addChild(sprite);
                            
                            console.log(`✅ Layer sprite loaded: ${layerData.name} at (${sprite.x}, ${sprite.y})`);
                          } catch (layerLoadError) {
                            console.warn(`⚠️ Failed to load layer sprite ${layerData.name}:`, layerLoadError);
                          }
                        }
                        
                        console.log(`🎨 Loaded ${Object.keys(extractedLayers).length} individual layer sprites into main canvas`);
                        
                        // Now create animation timeline from extracted layers
                        const sequence = createTimelineFromLayers(
                          extractedLayers,
                          `Individual Layer Animation - ${new Date().toLocaleTimeString()}`,
                          3000
                        );
                        
                        setCurrentAnimationSequence(sequence);
                        setShowAnimationTimeline(true);
                        
                        // Set up timeline callbacks to handle layer animation enable/disable
                        professionalAnimationTimeline.on('trackUpdate', (data: any) => {
                          // Check if animation is enabled for this layer
                          if (layerAnimationEnabled[data.layerId] === false) {
                            console.log(`🚫 Layer animation disabled for ${data.layerId}, skipping update`);
                            return; // Skip animation if disabled
                          }
                          
                          // Apply animation to the sprite in the professional renderer
                          const spriteData = professionalPixiRenderer.sprites.get(data.layerId);
                          if (spriteData?.sprite) {
                            const sprite = spriteData.sprite;
                            sprite.x = data.properties.x;
                            sprite.y = data.properties.y;
                            sprite.rotation = data.properties.rotation * (Math.PI / 180); // Convert to radians
                            sprite.scale.set(data.properties.scaleX, data.properties.scaleY);
                            sprite.alpha = data.properties.alpha;
                            sprite.visible = data.properties.visible;
                            
                            console.log(`🎬 Animated ${data.layerId}: pos(${sprite.x.toFixed(1)}, ${sprite.y.toFixed(1)}) rot(${data.properties.rotation.toFixed(1)}°)`);
                          } else {
                            console.warn(`⚠️ No sprite found for layer ${data.layerId}`);
                          }
                        });
                        
                        console.log('✅ Auto-created animation timeline with individual layer animations');
                        
                        // Auto-start individual layer animations
                        setTimeout(() => {
                          if (professionalAnimationTimeline) {
                            professionalAnimationTimeline.play();
                            console.log('🎬 Auto-started individual layer animations');
                          }
                        }, 500);
                        
                      } catch (timelineError) {
                        console.warn('⚠️ Individual layer loading failed:', timelineError);
                      }
                    }, 2000); // Small delay to ensure extraction is complete
                  }
                } else {
                  console.log('🔍 Single-object detection, using whole symbol animation');
                }
                
                console.log('✅ ISOLATED: Complete analysis finished!', results);
                
                // MANUAL MODE SUCCESS: Analysis complete, ready for manual extraction
                try {
                  // Show manual mode success alert 
                  setTimeout(() => {
                    const analysisLayers = multiLayerResults?.layers || [];
                    const layerNames = analysisLayers.map(l => `${l.name} (${l.type})`).join(', ');
                    
                    alert(`🗡️ MANUAL MODE SUCCESS!\n\n🔍 Analysis: "${results.description}" as ${results.symbolType}\n📊 Found: ${analysisLayers.length} layers for manual extraction\n🔬 Next: Use "Test Sword Boundary Detection" button\n\nDetected layers: ${layerNames}`);
                  }, 500);
                } catch (alertError) {
                  console.warn('Alert failed but results are good:', alertError);
                }
                
                resolve(results);
              } catch (isolatedError) {
                console.error('ISOLATED: GPT-4 Vision failed:', isolatedError);
                reject(isolatedError);
              }
            }, 100); // Small delay to avoid React conflicts
          });
          
        } catch (gptError) {
          console.error('GPT-4 Vision API call failed:', gptError);
          setVisionStatus({ status: 'error', message: `GPT-4 Vision failed: ${gptError.message}`, startTime: Date.now() });
          throw gptError;
        }
        
        if (!detectionResults) {
          throw new Error('GPT-4 Vision returned no results');
        }
        
        setVisionStatus({ status: 'complete', message: `GPT-4 Vision complete! Detected: ${detectionResults?.symbolType}`, startTime: Date.now() });
        setUniversalDetectionResults(detectionResults);
        
        console.log('✅ IMMEDIATE: Symbol loading completed!', detectionResults);
        
        // 🔥 CRITICAL: Update automation store with real GPT-4 Vision analysis
        if (detectionResults && detectionResults.symbolType) {
          console.log('🎯 Updating automation store with GPT-4 Vision results...');
          
          try {
            // Import AI engine to generate real analysis based on GPT-4 Vision
            const { aiAnimationEngine } = await import('../../utils/aiAnimationEngine');
            
            // Generate comprehensive analysis with GPT-4 Vision context
            const realAnalysis = await aiAnimationEngine.analyzeSymbol(symbolImage, {
              universalDetectionResults: detectionResults,
              detectedObjectType: detectionResults.symbolType,
              gptVisionDescription: detectionResults.description
            });
            
            console.log('🎯 Real AI analysis generated:', realAnalysis);
            setAnalysis(realAnalysis);
            
            // Generate real animation presets
            const realPresets = await aiAnimationEngine.generateAutomatedPresets(realAnalysis);
            console.log('🎭 Real animation presets generated:', realPresets);
            setAvailablePresets(realPresets);
            
            // Auto-select first preset for zero-click mode
            if (realPresets.length > 0 && (userPreferences.autoPlay || automationLevel.level === 'zero-click')) {
              setSelectedPreset(realPresets[0]);
              console.log('🎯 Auto-selected first real preset:', realPresets[0].name);
            }
            
          } catch (analysisError) {
            console.error('Failed to generate AI analysis with GPT-4 Vision data:', analysisError);
            // Keep placeholder analysis if real analysis fails
            setVisionStatus({ status: 'error', message: `Analysis generation failed: ${analysisError.message}`, startTime: Date.now() });
          }
        } else {
          console.warn('⚠️ No valid detection results from GPT-4 Vision');
          setVisionStatus({ status: 'error', message: 'No valid detection results', startTime: Date.now() });
        }
        
        // Auto-start animation if enabled
        if (userPreferences.autoPlay) {
          updateAnimationState({ isPlaying: true });
          console.log('🎬 AutomatedStudio: Auto-starting animation...');
          
          setTimeout(() => {
            if (rendererInitialized.current && rendererReady) {
              try {
                professionalPixiRenderer.play();
                updateAnimationState({ isPlaying: true });
                console.log('🚀 AutomatedStudio: Animation started');
              } catch (playError) {
                console.warn('⚠️ Animation start error (suppressed):', playError);
              }
            } else {
              console.log('🛡️ Renderer not ready, skipping animation start');
            }
          }, 200);
        }
        
      } catch (error) {
        console.error('IMMEDIATE: Symbol loading failed:', error);
        setVisionStatus({ status: 'error', message: `Failed: ${error.message}`, startTime: Date.now() });
        
        // Show error to user - no silent failures
        alert(`AI Detection Failed\n\n${error.message}\n\nPlease check your API key and try again.`);
        
        // Reset workflow
        resetWorkflow();
      }
    };
    
    // Execute immediately - no delays
    executeImmediately();
    
  }, [symbolImage, rendererReady]); // Trigger when either changes

  // OLD useEffect - now disabled to prevent conflicts
  /*
  useEffect(() => {
    // Check if renderer is ready and we have the basic requirements
    if (!rendererReady) {
      console.log('🛡️ Renderer not ready, skipping symbol load', {
        mounted: isComponentMounted.current,
        ready: rendererReady
      });
      setVisionStatus({ 
        status: 'idle', 
        message: 'Waiting for renderer to initialize...' 
      });
      return;
    }
    
    // Always proceed if renderer is ready, even if mount flag is unstable
    console.log('✅ Renderer is ready, proceeding with symbol load...');
    
    // More lenient conditions - we can load with just the image
    if (symbolImage) {
      // OLD CODE DISABLED - conflicts with immediate trigger
    }
  }, [symbolImage, rendererReady, updateAnimationState]); // OLD dependencies
  */

  // Load saved sprites from animation lab
  const loadSavedSprites = useCallback(() => {
    const sprites = listAnimationLabSprites();
    setSavedSprites(sprites);
    console.log(`[AnimationLab] 📂 Loaded ${sprites.length} saved sprites`);
  }, []);

  // Load sprites on mount and when sprite browser opens
  useEffect(() => {
    if (showSpriteBrowser) {
      loadSavedSprites();
    }
  }, [showSpriteBrowser, loadSavedSprites]);

  // Load sprite from animation lab
  const handleLoadSprite = useCallback(async (sprite: AnimationLabSprite) => {
    try {
      console.log(`[AnimationLab] 📥 Loading sprite: ${sprite.id}`);
      
      // Use the saved sprite image
      await startAutomatedWorkflow(sprite.originalImageUrl, sprite.prompt);
      
      // Close sprite browser
      setShowSpriteBrowser(false);
      
      console.log(`[AnimationLab] ✅ Sprite loaded successfully`);
    } catch (error) {
      console.error('[AnimationLab] Failed to load sprite:', error);
    }
  }, [startAutomatedWorkflow]);

  // Handle symbol upload
  const handleFileUpload = useCallback(async (file: File) => {
    setGenerating(true);

    try {
      let imageUrl: string;
      
      if (onSymbolUpload) {
        imageUrl = await onSymbolUpload(file);
      } else {
        // Fallback: create blob URL
        imageUrl = URL.createObjectURL(file);
      }

      await startAutomatedWorkflow(imageUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setGenerating(false);
    }
  }, [onSymbolUpload, startAutomatedWorkflow, setGenerating]);

  // Handle symbol generation
  const handleSymbolGeneration = useCallback(async () => {
    if (!symbolPrompt.trim()) return;

    setGenerating(true);

    try {
      let imageUrl: string;
      
      if (onSymbolGenerate) {
        imageUrl = await onSymbolGenerate(symbolPrompt);
      } else {
        // Fallback for demo
        imageUrl = '/api/placeholder/300/300';
      }

      await startAutomatedWorkflow(imageUrl);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setGenerating(false);
    }
  }, [symbolPrompt, onSymbolGenerate, startAutomatedWorkflow, setGenerating]);


  // Animation controls - DEFENSIVE versions
  const togglePlayback = useCallback(() => {
    // DEFENSIVE: Check component and renderer state
    if (!isComponentMounted.current || !rendererInitialized.current) {
      console.log('🛡️ Component unmounted or renderer not ready, skipping playback toggle');
      return;
    }
    
    try {
      if (animationState.isPlaying) {
        professionalPixiRenderer.pause();
      } else {
        professionalPixiRenderer.play();
      }
      updateAnimationState({ isPlaying: !animationState.isPlaying });
    } catch (playbackError) {
      console.warn('⚠️ Playback toggle error (suppressed):', playbackError);
    }
  }, [animationState.isPlaying, updateAnimationState]);

  const stopAnimation = useCallback(() => {
    // DEFENSIVE: Check component and renderer state
    if (!isComponentMounted.current || !rendererInitialized.current) {
      console.log('🛡️ Component unmounted or renderer not ready, skipping animation stop');
      return;
    }
    
    try {
      professionalPixiRenderer.stop();
      updateAnimationState({ isPlaying: false, currentTime: 0 });
    } catch (stopError) {
      console.warn('⚠️ Animation stop error (suppressed):', stopError);
    }
  }, [updateAnimationState]);

  const handleSpeedChange = useCallback((speed: number) => {
    // DEFENSIVE: Check component and renderer state
    if (!isComponentMounted.current || !rendererInitialized.current) {
      console.log('🛡️ Component unmounted or renderer not ready, skipping speed change');
      return;
    }
    
    try {
      updateAnimationState({ speed });
      professionalPixiRenderer.setSpeed(speed);
    } catch (speedError) {
      console.warn('⚠️ Speed change error (suppressed):', speedError);
    }
  }, [updateAnimationState]);

  // Animation type switching
  const switchAnimationType = useCallback(async (type: typeof selectedAnimationType) => {
    if (!analysis) return;
    
    setSelectedAnimationType(type);
    console.log(`🎭 Switching to ${type} animation...`);
    
    // Generate new preset for selected animation type
    const newPresets = await aiAnimationEngine.generateAutomatedPresets(analysis);
    const targetPreset = newPresets.find(p => p.name.toLowerCase().includes(type));
    
    if (targetPreset) {
      setSelectedPreset(targetPreset);
      console.log(`✅ Switched to ${type} animation: ${targetPreset.name}`);
    }
  }, [analysis, setSelectedPreset]);

  // Export functionality
  const handleExport = useCallback(async () => {
    if (!selectedPreset || !analysis) return;
    
    setIsExporting(true);
    console.log(`📤 Exporting animation as ${exportFormat.toUpperCase()}...`);
    
    try {
      const exportOptions = {
        format: exportFormat,
        quality: targetPlatform === 'mobile' ? 'mobile' as const : 'desktop' as const,
        compression: 'medium' as const,
        includeTextures: true,
        includeAudio: false,
        frameRate: 60 as const,
        resolution: { width: 400, height: 400 },
        optimizations: {
          removeRedundantKeyframes: true,
          quantizeRotations: true,
          compressTextures: targetPlatform === 'mobile',
          generateMipmaps: false
        }
      };
      
      const exportResult = await animationExporter.exportAnimation(
        selectedPreset,
        analysis,
        exportOptions
      );
      
      if (exportResult.success) {
        console.log(`✅ Export successful: ${exportResult.files.length} files generated`);
        
        // Download the exported files
        await animationExporter.downloadExport(`${selectedPreset.id}-${exportFormat}`);
        
        // Show success notification
        alert(`🎉 Animation exported successfully!\n\nFormat: ${exportFormat.toUpperCase()}\nFiles: ${exportResult.files.length}\nCompression: ${exportResult.metadata.compressionRatio.toFixed(1)}x`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [selectedPreset, analysis, exportFormat, targetPlatform]);

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 bg-gray-900 text-white flex">
        {/* Left Panel: Controls */}
        <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Animation Studio</h1>
              <p className="text-sm text-gray-400">Automated animation generation</p>
            </div>
          </div>
        </div>

        {/* Automation Level Selector */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold mb-3">Automation Level</h3>
          <div className="grid grid-cols-1 gap-2">
            {[
              { level: 'zero-click', name: 'Zero-Click', desc: 'Fully automated', icon: '🚀' },
              { level: 'guided', name: 'Guided', desc: 'AI suggestions', icon: '🎭' },
              { level: 'professional', name: 'Professional', desc: 'Full control', icon: '⚙️' }
            ].map((option) => (
              <button
                key={option.level}
                onClick={() => setAutomationLevel({
                  level: option.level as any,
                  userType: option.level === 'zero-click' ? 'beginner' : option.level === 'guided' ? 'intermediate' : 'expert',
                  interfaceComplexity: option.level === 'zero-click' ? 'minimal' : option.level === 'guided' ? 'moderate' : 'full'
                })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  automationLevel.level === option.level
                    ? 'border-blue-500 bg-blue-600/20 text-white'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{option.icon}</span>
                  <div>
                    <div className="font-medium">{option.name}</div>
                    <div className="text-xs text-gray-400">{option.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 1: Symbol Input */}
        {currentStep === 'upload' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-b border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Sparkles className="mr-2" size={20} />
              Create Your Symbol
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Describe your symbol
                </label>
                <textarea
                  value={symbolPrompt}
                  onChange={(e) => setSymbolPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  rows={3}
                  placeholder="Golden scarab beetle with detailed wings..."
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleSymbolGeneration}
                  disabled={isGenerating || !symbolPrompt.trim()}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate with AI</span>
                    </>
                  )}
                </button>

                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Existing Image</span>
                  </button>
                </div>

                {/* Animation Lab Sprite Browser */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowSpriteBrowser(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-purple-600 hover:border-purple-500 rounded-lg transition-colors text-purple-400 hover:text-purple-300"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Browse Animation Lab</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: AI Analysis Progress */}
        {currentStep === 'analyze' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-b border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Brain className="mr-2" size={20} />
              AI Analysis
            </h3>

            <div className="space-y-3">
              {processingSteps.map((step) => (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {step.status === 'complete' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : step.status === 'processing' ? (
                      <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : step.status === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{step.name}</div>
                    {step.confidence && (
                      <div className="text-xs text-gray-400">
                        Confidence: {Math.round(step.confidence * 100)}%
                      </div>
                    )}
                  </div>
                  {step.duration && (
                    <div className="text-xs text-gray-500">
                      {step.duration}ms
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Animation Preview & Controls */}
        {currentStep === 'preview' && analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* AI Results Summary */}
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold mb-3">AI Analysis Results</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Theme:</span>
                  <span>{analysis.themeClassification.primary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Elements:</span>
                  <span>{analysis.detectedElements.length} detected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence:</span>
                  <span>{Math.round(analysis.confidence * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Animation Type Selection */}
            {automationLevel.level !== 'zero-click' && (
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold mb-3">Animation Types</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['idle', 'win', 'scatter', 'wild', 'bonus', 'intro'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => switchAnimationType(type)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        selectedAnimationType === type
                          ? 'border-purple-500 bg-purple-600/20'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-xs capitalize">{type}</div>
                      <div className="text-xs text-gray-400">
                        {type === 'idle' && '🌟 Gentle flutter'}
                        {type === 'win' && '🎉 Celebration'}
                        {type === 'scatter' && '✨ Mystical glow'}
                        {type === 'wild' && '⚡ Divine power'}
                        {type === 'bonus' && '🚀 Ascension'}
                        {type === 'intro' && '🎭 Awakening'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Animation Presets */}
            {automationLevel.level !== 'zero-click' && availablePresets.length > 0 && (
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold mb-3">AI Generated Presets</h3>
                <div className="grid grid-cols-1 gap-2">
                  {availablePresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedPreset?.id === preset.id
                          ? 'border-blue-500 bg-blue-600/20'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{preset.description}</div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-blue-400">
                          {Math.round(preset.confidence * 100)}% match
                        </span>
                        <span className="text-xs text-gray-500">
                          {preset.performance.estimatedFPS} FPS
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Playback Controls */}
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Controls</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <button
                    onClick={togglePlayback}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    {animationState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={stopAnimation}
                    className="flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetWorkflow}
                    className="flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Speed Control */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Speed: {animationState.speed}x
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={animationState.speed}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Platform Selection */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Target Platform</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { value: 'mobile', icon: Smartphone, label: 'Mobile' },
                      { value: 'desktop', icon: Monitor, label: 'Desktop' },
                      { value: 'all', icon: Globe, label: 'All' }
                    ].map((platform) => (
                      <button
                        key={platform.value}
                        onClick={() => setTargetPlatform(platform.value as any)}
                        className={`p-2 rounded text-xs transition-all ${
                          targetPlatform === platform.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <platform.icon className="w-4 h-4 mx-auto mb-1" />
                        {platform.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Layer Animation Controls */}
            {Object.keys(extractedLayers).length > 0 && (
              <div className="p-6 border-b border-gray-700 bg-blue-900/20">
                <h3 className="text-lg font-bold text-blue-400 flex items-center mb-4">
                  🎬 Individual Layer Animation
                </h3>
                <div className="space-y-3">
                  <div className="text-sm text-gray-300 mb-3">
                    Control which layers animate independently:
                  </div>
                  
                  {Object.entries(extractedLayers).map(([layerId, layerData]) => (
                    <div key={layerId} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded ${
                          layerData.type === 'weapon' ? 'bg-red-500' :
                          layerData.type === 'accessory' ? 'bg-purple-500' :
                          layerData.type === 'armor' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="font-medium">{layerData.name}</span>
                        <span className="text-xs text-gray-400">({layerData.type})</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          layerData.animationPotential === 'high' ? 'bg-red-900 text-red-300' :
                          layerData.animationPotential === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-gray-900 text-gray-300'
                        }`}>
                          {layerData.animationPotential}
                        </span>
                      </div>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={layerAnimationEnabled[layerId] !== false}
                          onChange={(e) => setLayerAnimationEnabled(prev => ({
                            ...prev,
                            [layerId]: e.target.checked
                          }))}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">Animate</span>
                      </label>
                    </div>
                  ))}
                  
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => {
                        const allEnabled = {};
                        Object.keys(extractedLayers).forEach(layerId => {
                          allEnabled[layerId] = true;
                        });
                        setLayerAnimationEnabled(allEnabled);
                      }}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                    >
                      Enable All
                    </button>
                    <button
                      onClick={() => {
                        const allDisabled = {};
                        Object.keys(extractedLayers).forEach(layerId => {
                          allDisabled[layerId] = false;
                        });
                        setLayerAnimationEnabled(allDisabled);
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      Disable All
                    </button>
                    <button
                      onClick={() => {
                        const weaponOnly = {};
                        Object.entries(extractedLayers).forEach(([layerId, layerData]) => {
                          weaponOnly[layerId] = layerData.type === 'weapon';
                        });
                        setLayerAnimationEnabled(weaponOnly);
                      }}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                    >
                      Sword Only
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 🎨 GPT-Vision AI Sprite Recreation */}
            {symbolImage && (
              <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
                <h3 className="text-lg font-bold text-blue-400 flex items-center mb-4">
                  <Sparkles className="w-5 h-5 mr-2" />
                  🎨 GPT-Vision AI Sprite Recreation
                  {gptVisionReady ? (
                    <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded">READY</span>
                  ) : (
                    <span className="ml-2 px-2 py-1 bg-yellow-600 text-white text-xs rounded flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      API KEY NEEDED
                    </span>
                  )}
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Professional AI sprite recreation using GPT-4 Vision. Intelligently separates objects into multiple sprite layers for animation.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={toggleExtractionMode}
                      className={`px-4 py-2 rounded font-medium transition-all ${
                        clickMode === 'gpt-vision' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                      disabled={!gptVisionReady}
                    >
                      {clickMode === 'gpt-vision' ? '🎨 AI Mode' : '🔧 Manual Mode'}
                    </button>
                    
                    {clickMode === 'gpt-vision' && gptVisionReady && (
                      <div className="text-sm text-blue-300 flex items-center">
                        <Sparkles className="w-4 h-4 mr-1" />
                        Click image to recreate as sprites
                      </div>
                    )}
                    
                    {!gptVisionReady && (
                      <div className="text-xs text-yellow-400">
                        ⚠️ Set OpenAI API key in settings
                      </div>
                    )}
                  </div>
                  
                  {/* Recreation Mode Selection */}
                  <div className="grid grid-cols-3 gap-2">
                    {(['auto', 'guided', 'custom'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setRecreationMode(mode)}
                        className={`px-3 py-2 text-sm rounded transition-all ${
                          recreationMode === mode 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {mode === 'auto' && '🤖 Auto'}
                        {mode === 'guided' && '🎯 Guided'}
                        {mode === 'custom' && '⚙️ Custom'}
                      </button>
                    ))}
                  </div>
                  
                  {/* Target Layers Selection */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Target Layers:</label>
                    <div className="flex flex-wrap gap-2">
                      {['weapon', 'character', 'background', 'armor', 'effects', 'accessories'].map(layer => (
                        <button
                          key={layer}
                          onClick={() => {
                            setTargetLayers(prev => 
                              prev.includes(layer) 
                                ? prev.filter(l => l !== layer)
                                : [...prev, layer]
                            );
                          }}
                          className={`px-2 py-1 text-xs rounded transition-all ${
                            targetLayers.includes(layer)
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                        >
                          {layer}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <img
                      src={symbolImage}
                      alt="Symbol for recreation"
                      className={`w-full max-w-md mx-auto rounded border-2 ${
                        clickMode === 'gpt-vision' && gptVisionReady 
                          ? 'border-blue-400 cursor-pointer hover:border-blue-300' 
                          : 'border-gray-600'
                      }`}
                      onClick={handleImageClick}
                      style={{ 
                        filter: clickMode === 'gpt-vision' && gptVisionReady ? 'brightness(1.1)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleGPTVisionRecreation}
                    disabled={!gptVisionReady || targetLayers.length === 0 || isUsingGPTVision}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 font-medium flex items-center justify-center gap-2"
                  >
                    {isUsingGPTVision ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Generating SVG...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Single SVG
                      </>
                    )}
                  </button>
                </div>

                {/* GPT-Vision Results Display */}
                {gptRecreationResults && (
                  <div className="mt-6 p-4 bg-gray-800 rounded">
                    <h4 className="text-blue-400 font-bold mb-2">🎨 GPT-Vision Recreation Results</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Layers:</span>
                        <span className="ml-2 text-white font-medium">{gptRecreationResults.layers.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Quality:</span>
                        <span className="ml-2 text-green-400 font-medium">{gptRecreationResults.qualityScore}/100</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Speed:</span>
                        <span className="ml-2 text-blue-400">{gptRecreationResults.processingTime.toFixed(1)}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Cost:</span>
                        <span className="ml-2 text-green-400">${gptRecreationResults.totalCost.toFixed(3)}</span>
                      </div>
                    </div>
                    
                    {gptRecreationResults.recommendations.length > 0 && (
                      <div className="mt-3">
                        <div className="text-yellow-400 text-xs font-medium mb-1">💡 Recommendations:</div>
                        <ul className="text-xs text-gray-300 space-y-1">
                          {gptRecreationResults.recommendations.map((rec, idx) => (
                            <li key={idx}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Complete SVG Recreation */}
                    {gptRecreationResults.svgContent && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-400 mb-2">Complete SVG Recreation:</div>
                        <div className="bg-gray-700 p-3 rounded border border-gray-600">
                          <div 
                            className="w-full max-w-md mx-auto bg-white rounded p-2"
                            dangerouslySetInnerHTML={{ __html: gptRecreationResults.svgContent }}
                          />
                          <div className="text-xs text-gray-400 mt-2 text-center">
                            SVG with {gptRecreationResults.layers.length} extractable elements
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Individual SVG Elements */}
                    <div className="mt-4">
                      <div className="text-sm text-gray-400 mb-2">Extracted SVG Elements:</div>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {gptRecreationResults.layers.map((layer, idx) => (
                          <div key={layer.id} className="text-center bg-gray-700 p-2 rounded">
                            <div className="text-xs text-gray-400 mb-1">{layer.name}</div>
                            {layer.svgContent ? (
                              <div 
                                className="w-full bg-white rounded p-1"
                                dangerouslySetInnerHTML={{ __html: layer.svgContent }}
                              />
                            ) : (
                              <img 
                                src={layer.imageBase64} 
                                alt={`${layer.name} sprite layer`} 
                                className="w-full rounded border border-gray-600" 
                              />
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Element: {layer.id} | Z:{layer.zIndex}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual Sword Extraction - Step 1 */}
            {multiLayerResults && multiLayerResults.layers && (
              <div className="p-6 border-b border-gray-700 bg-purple-900/20">
                <h3 className="text-lg font-bold text-purple-400 flex items-center mb-4">
                  🗡️ Manual Sword Extraction - Step 1
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Test surgical boundary detection for sword layer only
                </p>
                <div className="space-y-2">
                  <button 
                    onClick={handleSwordBoundaryDetection}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mr-2"
                    disabled={!symbolImage}
                  >
                    Step 1: Test Sword Boundary Detection
                  </button>
                  
                  {swordStep1Success && (
                    <button 
                      onClick={handleSwordEdgeDetection}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
                      disabled={!symbolImage}
                    >
                      Step 2: Apply Surgical Edge Detection
                    </button>
                  )}
                  
                  {swordEdgeDetectionResults && (
                    <button 
                      onClick={handleSwordContourTracing}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                      disabled={!symbolImage}
                    >
                      Step 3: Trace Precise Contour
                    </button>
                  )}
                  
                  {swordContourResults && (
                    <button 
                      onClick={handleSwordAlphaMaskGeneration}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 mr-2"
                      disabled={!symbolImage}
                    >
                      Step 4: Generate Alpha Mask
                    </button>
                  )}
                  
                  {swordAlphaMaskResults && (
                    <button 
                      onClick={handleSwordSpriteCreation}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-2"
                      disabled={!symbolImage}
                    >
                      Step 5: Create Sword Sprite
                    </button>
                  )}
                  
                  {swordSpriteResults && (
                    <button 
                      onClick={handleSwordBackgroundCompletion}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 mr-2"
                      disabled={!symbolImage}
                    >
                      Step 6: Complete Background
                    </button>
                  )}
                  
                  {swordBackgroundResults && (
                    <button 
                      onClick={handleSwordValidationAndTesting}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mr-2"
                      disabled={!symbolImage}
                    >
                      Step 7: Validate & Test Animation
                    </button>
                  )}
                </div>
                {swordExtractionDebug.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
                    <h4 className="text-purple-400 font-bold mb-2">Sword Extraction Debug Log:</h4>
                    {swordExtractionDebug.map((entry, index) => (
                      <div key={index} className="mb-2 p-2 bg-gray-700 rounded">
                        <div className="text-yellow-400 font-bold">{entry.step}</div>
                        <div className="text-gray-300">
                          Original: {JSON.stringify(entry.originalBounds)}<br/>
                          Pixel: {JSON.stringify(entry.pixelBounds)}<br/>
                          Valid: {entry.boundsValid ? '✅' : '❌'}<br/>
                          {entry.errorMessage && <span className="text-red-400">Error: {entry.errorMessage}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {swordEdgeDetectionResults && (
                  <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
                    <h4 className="text-green-400 font-bold mb-2">Step 2: Edge Detection Results</h4>
                    <div className="p-2 bg-gray-700 rounded">
                      <div className="text-green-400 font-bold">Surgical Edge Detection Complete ✅</div>
                      <div className="text-gray-300">
                        ROI Size: {swordEdgeDetectionResults.debugInfo.roiBounds.width}x{swordEdgeDetectionResults.debugInfo.roiBounds.height}<br/>
                        Edge Pixels: {swordEdgeDetectionResults.debugInfo.edgePixelCount} ({swordEdgeDetectionResults.debugInfo.edgePercentage}%)<br/>
                        Thresholds: {swordEdgeDetectionResults.debugInfo.thresholds.low}-{swordEdgeDetectionResults.debugInfo.thresholds.high}<br/>
                        Status: <span className="text-green-400">Ready for Step 3 🗡️</span>
                      </div>
                    </div>
                  </div>
                )}
                {swordContourResults && (
                  <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
                    <h4 className="text-blue-400 font-bold mb-2">Step 3: Contour Tracing Results</h4>
                    <div className="p-2 bg-gray-700 rounded">
                      <div className="text-blue-400 font-bold">Precise Contour Tracing Complete ✅</div>
                      <div className="text-gray-300">
                        Total Points: {swordContourResults.debugInfo.finalPoints}<br/>
                        Corners: {swordContourResults.contourPoints.filter(p => p.type === 'corner').length} | 
                        Curves: {swordContourResults.contourPoints.filter(p => p.type === 'curve').length} | 
                        Edges: {swordContourResults.contourPoints.filter(p => p.type === 'edge').length}<br/>
                        Length: {swordContourResults.debugInfo.contourLength.toFixed(1)}px<br/>
                        Reduction: {swordContourResults.debugInfo.reductionRatio}% optimized<br/>
                        Status: <span className="text-blue-400">Ready for Step 4 🗡️</span>
                      </div>
                    </div>
                  </div>
                )}
                {swordAlphaMaskResults && (
                  <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
                    <h4 className="text-orange-400 font-bold mb-2">Step 4: Alpha Mask Generation Results</h4>
                    <div className="p-2 bg-gray-700 rounded">
                      <div className="text-orange-400 font-bold">Alpha Mask Generation Complete ✅</div>
                      <div className="text-gray-300">
                        Mask Size: {swordAlphaMaskResults.debugInfo.maskDimensions.width}x{swordAlphaMaskResults.debugInfo.maskDimensions.height}<br/>
                        Position: ({swordAlphaMaskResults.debugInfo.maskPosition.x}, {swordAlphaMaskResults.debugInfo.maskPosition.y})<br/>
                        Opaque Pixels: {swordAlphaMaskResults.debugInfo.pixelAnalysis.opaque} ({swordAlphaMaskResults.debugInfo.pixelAnalysis.opaquePercentage}%)<br/>
                        Partial Alpha: {swordAlphaMaskResults.debugInfo.pixelAnalysis.partial} ({swordAlphaMaskResults.debugInfo.pixelAnalysis.partialPercentage}%)<br/>
                        Feather Radius: {swordAlphaMaskResults.debugInfo.featherRadius}px<br/>
                        Quality: <span className="text-green-400">{swordAlphaMaskResults.debugInfo.maskQuality}</span><br/>
                        Status: <span className="text-orange-400">Ready for Step 5 🗡️</span>
                      </div>
                    </div>
                  </div>
                )}
                {swordSpriteResults && (
                  <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
                    <h4 className="text-red-400 font-bold mb-2">Step 5: Sword Sprite Isolation Results</h4>
                    <div className="p-2 bg-gray-700 rounded">
                      <div className="text-red-400 font-bold">Sword Sprite Isolation Complete ✅</div>
                      <div className="text-gray-300">
                        Sprite Size: {swordSpriteResults.debugInfo.spriteDimensions.width}x{swordSpriteResults.debugInfo.spriteDimensions.height}<br/>
                        Position: ({swordSpriteResults.debugInfo.spritePosition.x}, {swordSpriteResults.debugInfo.spritePosition.y})<br/>
                        Content Ratio: {swordSpriteResults.debugInfo.qualityMetrics.contentRatio}%<br/>
                        Edge Quality: {swordSpriteResults.debugInfo.qualityMetrics.edgeQuality}%<br/>
                        Anti-aliasing: <span className="text-green-400">{swordSpriteResults.debugInfo.qualityMetrics.antiAliasing}</span><br/>
                        File Size: {(swordSpriteResults.debugInfo.spriteSize / 1024).toFixed(1)}KB ({swordSpriteResults.debugInfo.compression})<br/>
                        Overall Quality: <span className="text-green-400">{swordSpriteResults.debugInfo.qualityMetrics.overall}</span><br/>
                        Status: <span className="text-red-400">Ready for Step 6 🗡️</span>
                      </div>
                    </div>
                  </div>
                )}
                {swordBackgroundResults && (
                  <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
                    <h4 className="text-indigo-400 font-bold mb-2">Step 6: Background Completion Results</h4>
                    <div className="p-2 bg-gray-700 rounded">
                      <div className="text-indigo-400 font-bold">Background Completion Complete ✅</div>
                      <div className="text-gray-300">
                        Background Size: {swordBackgroundResults.debugInfo.backgroundDimensions.width}x{swordBackgroundResults.debugInfo.backgroundDimensions.height}<br/>
                        Processed Region: {swordBackgroundResults.debugInfo.processedRegion.width}x{swordBackgroundResults.debugInfo.processedRegion.height}<br/>
                        Fill Ratio: {swordBackgroundResults.debugInfo.fillingAnalysis.fillRatio}%<br/>
                        Context Samples: {swordBackgroundResults.debugInfo.fillingAnalysis.contextSamples.toLocaleString()}<br/>
                        Dominant Colors: {swordBackgroundResults.debugInfo.fillingAnalysis.dominantColors}<br/>
                        AI Method: <span className="text-green-400">{swordBackgroundResults.debugInfo.qualityMetrics.seamlessBlending}</span><br/>
                        Context Awareness: <span className="text-green-400">{swordBackgroundResults.debugInfo.qualityMetrics.contextAwareness}</span><br/>
                        Fill Quality: <span className="text-green-400">{swordBackgroundResults.debugInfo.qualityMetrics.fillQuality}</span><br/>
                        File Size: {(swordBackgroundResults.debugInfo.fileSize / 1024).toFixed(1)}KB<br/>
                        Status: <span className="text-indigo-400">Ready for Step 7 🗡️</span>
                      </div>
                    </div>
                  </div>
                )}
                {swordValidationResults && (
                  <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
                    <h4 className="text-purple-400 font-bold mb-2">Step 7: Validation & Animation Testing Results</h4>
                    <div className="space-y-3">
                      {/* Overall Score */}
                      <div className="p-2 bg-gray-700 rounded">
                        <div className="text-purple-400 font-bold">Overall Validation Complete ✅</div>
                        <div className="text-gray-300">
                          <span className="text-yellow-400 text-lg font-bold">
                            Score: {swordValidationResults.validationResults.overallScore}/100
                          </span> 
                          <span className="ml-2 text-green-400">
                            ({swordValidationResults.validationResults.overallStatus})
                          </span><br/>
                          Production Ready: 
                          <span className={swordValidationResults.validationResults.comparison.readyForProduction ? 'text-green-400' : 'text-yellow-400'}>
                            {swordValidationResults.validationResults.comparison.readyForProduction ? ' YES ✅' : ' REVIEW NEEDED ⚠️'}
                          </span>
                        </div>
                      </div>

                      {/* Quality Breakdown */}
                      <div className="p-2 bg-gray-700 rounded">
                        <div className="text-purple-400 font-bold mb-1">Quality Breakdown:</div>
                        <div className="text-gray-300 text-xs space-y-1">
                          <div>🎯 Contour: {swordValidationResults.validationResults.contourQuality.score}/100 ({swordValidationResults.validationResults.contourQuality.status})</div>
                          <div>🎨 Alpha Mask: {swordValidationResults.validationResults.alphaMaskQuality.score}/100 ({swordValidationResults.validationResults.alphaMaskQuality.status})</div>
                          <div>🖼️ Sprite: {swordValidationResults.validationResults.spriteQuality.score}/100 ({swordValidationResults.validationResults.spriteQuality.status})</div>
                          <div>🌄 Background: {swordValidationResults.validationResults.backgroundQuality.score}/100 ({swordValidationResults.validationResults.backgroundQuality.status})</div>
                        </div>
                      </div>

                      {/* Animation Test */}
                      <div className="p-2 bg-gray-700 rounded">
                        <div className="text-purple-400 font-bold mb-1">Animation Testing:</div>
                        <div className="text-gray-300 text-xs">
                          Test Type: {swordValidationResults.animationTest.testType}<br/>
                          Animation Score: <span className="text-green-400">{swordValidationResults.animationTest.animationScore}/100</span><br/>
                          Frame Count: {swordValidationResults.animationTest.frameCount}<br/>
                          Sprite Compatible: <span className="text-green-400">YES ✅</span>
                        </div>
                      </div>

                      {/* Visual Assets */}
                      <div className="p-2 bg-gray-700 rounded">
                        <div className="text-purple-400 font-bold mb-1">Preview Assets Generated:</div>
                        <div className="text-gray-300 text-xs">
                          📊 Side-by-side comparison<br/>
                          🔄 Before/after overlay<br/>
                          🎬 Animation test frames<br/>
                          📏 Dimension analysis<br/>
                          Status: <span className="text-green-400">Ready for visual inspection</span>
                        </div>
                      </div>

                      {/* Strengths & Improvements */}
                      {swordValidationResults.validationResults.comparison.strengths.length > 0 && (
                        <div className="p-2 bg-gray-700 rounded">
                          <div className="text-green-400 font-bold mb-1">Strengths:</div>
                          <div className="text-gray-300 text-xs">
                            {swordValidationResults.validationResults.comparison.strengths.map((strength: string, index: number) => (
                              <div key={index}>✅ {strength}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {swordValidationResults.validationResults.comparison.improvements.length > 0 && (
                        <div className="p-2 bg-gray-700 rounded">
                          <div className="text-yellow-400 font-bold mb-1">Potential Improvements:</div>
                          <div className="text-gray-300 text-xs">
                            {swordValidationResults.validationResults.comparison.improvements.map((improvement: string, index: number) => (
                              <div key={index}>💡 {improvement}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-center pt-2">
                        <span className="text-purple-400">🗡️ Manual Sword Extraction Complete! Ready for Step 8 🗡️</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 7: Visual Preview Canvas */}
                {swordValidationResults && (
                  <div className="mt-4 p-3 bg-gray-800 rounded">
                    <h4 className="text-purple-400 font-bold mb-3">🖼️ Visual Validation Preview</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      
                      {/* Side-by-side Comparison */}
                      <div className="bg-gray-700 rounded p-3">
                        <h5 className="text-purple-300 font-semibold mb-2">📊 Original | Sword | AI Background</h5>
                        <div className="bg-gray-900 rounded overflow-hidden">
                          <img 
                            src={swordValidationResults.previewAssets.comparison}
                            alt="Extraction Comparison"
                            className="w-full h-auto max-h-64 object-contain"
                          />
                        </div>
                        <p className="text-gray-400 text-xs mt-2">
                          Left: Original image | Center: Isolated sword sprite | Right: AI-completed background
                        </p>
                      </div>

                      {/* Before/After Overlay */}
                      <div className="bg-gray-700 rounded p-3">
                        <h5 className="text-purple-300 font-semibold mb-2">🔄 Before/After Reconstruction</h5>
                        <div className="bg-gray-900 rounded overflow-hidden">
                          <img 
                            src={swordValidationResults.previewAssets.overlay}
                            alt="Before/After Overlay"
                            className="w-full h-auto max-h-64 object-contain"
                          />
                        </div>
                        <p className="text-gray-400 text-xs mt-2">
                          Reconstructed image: AI background + sword sprite repositioned
                        </p>
                      </div>

                      {/* Animation Test Preview */}
                      <div className="bg-gray-700 rounded p-3">
                        <h5 className="text-purple-300 font-semibold mb-2">🎬 Animation Test Frames</h5>
                        <div className="bg-gray-900 rounded overflow-hidden">
                          <img 
                            src={swordValidationResults.animationTest.tests?.wobbleTest?.frames?.[0] || swordValidationResults.previewAssets?.originalWithOverlay || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFuaW1hdGlvbiBUZXN0PC90ZXh0Pjwvc3ZnPg=='}
                            alt="Animation Test Preview"
                            className="w-full h-auto max-h-64 object-contain"
                            id="animationTestFrame"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-gray-400 text-xs">
                            Animation Tests: {swordValidationResults.animationTest.testCount} tests completed
                          </p>
                          <button
                            onClick={() => {
                              const testNames = Object.keys(swordValidationResults.animationTest.tests || {});
                              const imgElement = document.getElementById('animationTestFrame') as HTMLImageElement;
                              let testIndex = 0;
                              
                              const cycleTests = () => {
                                if (imgElement && testNames[testIndex]) {
                                  const testName = testNames[testIndex];
                                  const test = swordValidationResults.animationTest.tests[testName];
                                  if (test?.frames?.[0]) {
                                    imgElement.src = test.frames[0];
                                  }
                                  testIndex = (testIndex + 1) % testNames.length;
                                }
                              };
                              
                              const interval = setInterval(cycleTests, 150);
                              setTimeout(() => clearInterval(interval), 3000); // 3 second animation
                            }}
                            className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                          >
                            ▶️ Play Test
                          </button>
                        </div>
                      </div>

                      {/* Download Options */}
                      <div className="bg-gray-700 rounded p-3">
                        <h5 className="text-purple-300 font-semibold mb-2">💾 Download Assets</h5>
                        <div className="space-y-2">
                          <a
                            href={swordValidationResults.previewAssets.swordPreview}
                            download="sword_sprite_isolated.png"
                            className="block w-full px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 text-center"
                          >
                            📥 Download Sword Sprite
                          </a>
                          <a
                            href={swordValidationResults.previewAssets.backgroundPreview}
                            download="background_ai_completed.png"
                            className="block w-full px-3 py-2 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 text-center"
                          >
                            📥 Download AI Background
                          </a>
                          <a
                            href={swordValidationResults.previewAssets.comparison}
                            download="extraction_comparison.png"
                            className="block w-full px-3 py-2 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 text-center"
                          >
                            📥 Download Comparison
                          </a>
                          <a
                            href={swordValidationResults.previewAssets.overlay}
                            download="before_after_overlay.png"
                            className="block w-full px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 text-center"
                          >
                            📥 Download Overlay
                          </a>
                        </div>
                        <p className="text-gray-400 text-xs mt-3">
                          All assets are ready for use in animation pipelines
                        </p>
                      </div>
                      
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Debug Controls */}
            {process.env.NODE_ENV === 'development' && (
              <div className="p-6 border-b border-gray-700 bg-red-900/20">
                <h3 className="text-lg font-bold text-red-400 flex items-center mb-4">
                  🐛 Debug Controls
                </h3>
                <div className="space-y-2 text-xs">
                  <button
                    onClick={async () => {
                      console.log('🧪 TESTING GPT-4 Vision Status Tracking...');
                      setVisionStatus({ status: 'initializing', message: 'Testing status system...', startTime: Date.now() });
                      
                      setTimeout(() => {
                        setVisionStatus({ status: 'calling-api', message: 'Simulating API call...', startTime: Date.now() });
                      }, 1000);
                      
                      setTimeout(() => {
                        setVisionStatus({ status: 'processing', message: 'Processing test results...', startTime: Date.now() });
                      }, 2500);
                      
                      setTimeout(() => {
                        setVisionStatus({ status: 'complete', message: 'Status test completed successfully!', startTime: Date.now() });
                      }, 4000);
                    }}
                    className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded"
                  >
                    🧪 Test GPT-4 Vision Status
                  </button>
                  
                  <button
                    onClick={async () => {
                      console.log('🔥 FORCE TRIGGER SYMBOL LOADING...');
                      if (symbolImage && rendererReady) {
                        try {
                          setVisionStatus({ status: 'initializing', message: 'Force loading symbol...', startTime: Date.now() });
                          
                          const loadSymbol = async () => {
                            setVisionStatus({ status: 'calling-api', message: 'Calling GPT-4 Vision API...', startTime: Date.now() });
                            const detectionResults = await professionalPixiRenderer.loadSymbolWithUniversalDetection(symbolImage, 'idle');
                            setVisionStatus({ status: 'complete', message: `GPT-4 Vision complete! Detected: ${detectionResults?.symbolType}`, startTime: Date.now() });
                            setUniversalDetectionResults(detectionResults);
                          };
                          
                          await loadSymbol();
                        } catch (error) {
                          setVisionStatus({ status: 'error', message: `Failed: ${error.message}`, startTime: Date.now() });
                        }
                      } else {
                        alert('Need symbol image and working renderer!');
                      }
                    }}
                    className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded"
                  >
                    🔥 Force Symbol Loading
                  </button>
                  
                  <button
                    onClick={async () => {
                      console.log('🚀 FORCE INITIALIZING RENDERER...');
                      if (canvasContainerRef.current) {
                        try {
                          rendererInitialized.current = false;
                          isComponentMounted.current = true;
                          await professionalPixiRenderer.initialize(canvasContainerRef.current);
                          setRendererReady(true);
                          console.log('✅ Force initialization complete');
                        } catch (error) {
                          console.error('Force initialization failed:', error);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    🚀 Force Initialize Renderer
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('🧹 CLEAR ALL STORAGE...');
                      localStorage.clear();
                      clearAnimationLabStorage();
                      console.log('✅ All storage cleared');
                    }}
                    className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
                  >
                    🧹 Clear All Storage
                  </button>
                  
                  <button
                    onClick={async () => {
                      console.log('💎 FORCE LOADING EMERALD GEM...');
                      if (!rendererReady || !rendererInitialized.current) {
                        console.warn('⚠️ Renderer not ready, initializing first...');
                        return;
                      }
                      
                      if (symbolImage) {
                        try {
                          // Force load the current symbol image with universal detection
                          console.log('🔥 Force loading symbol with image:', symbolImage.substring(0, 50) + '...');
                          const detectionResults = await professionalPixiRenderer.loadSymbolWithUniversalDetection(symbolImage, 'idle');
                          console.log('✅ Force symbol loading complete:', detectionResults);
                          
                          // Store detection results for preview
                          setUniversalDetectionResults(detectionResults);
                          
                          // Auto-start animation
                          setTimeout(() => {
                            try {
                              professionalPixiRenderer.play();
                              updateAnimationState({ isPlaying: true });
                              console.log('🎬 Animation started automatically');
                            } catch (animError) {
                              console.error('Animation start failed:', animError);
                            }
                          }, 500);
                          
                        } catch (error) {
                          console.error('Force symbol loading failed:', error);
                        }
                      } else {
                        console.warn('⚠️ No symbol image available to load');
                      }
                    }}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    💎 Force Load Current Symbol
                  </button>
                  
                  <button
                    onClick={async () => {
                      console.log('🔮 CREATING TEST GEM ANIMATION...');
                      if (!rendererReady || !rendererInitialized.current) {
                        console.warn('⚠️ Renderer not ready, initializing first...');
                        return;
                      }
                      
                      try {
                        // Create a simple test gem animation using PIXI graphics
                        const testGemDetection = {
                          symbolType: 'gem',
                          confidence: 1.0,
                          animatableElements: [
                            {
                              id: 'gem-core',
                              type: 'body',
                              name: 'Gem Core',
                              bounds: { x: 25, y: 25, width: 50, height: 50 },
                              attachmentPoint: { x: 50, y: 50 },
                              contourPoints: [
                                { x: 35, y: 25 }, { x: 65, y: 25 }, { x: 75, y: 50 }, 
                                { x: 65, y: 75 }, { x: 35, y: 75 }, { x: 25, y: 50 }
                              ],
                              animationConstraints: { maxRotation: 5, maxScale: 1.1 }
                            },
                            {
                              id: 'gem-shine',
                              type: 'decorative',
                              name: 'Shine Effect',
                              bounds: { x: 30, y: 30, width: 40, height: 40 },
                              attachmentPoint: { x: 50, y: 50 },
                              animationConstraints: { maxRotation: 0, maxScale: 1.3 }
                            }
                          ]
                        };
                        
                        console.log('🔮 Test gem detection created:', testGemDetection);
                        setUniversalDetectionResults(testGemDetection);
                        setDetectedObjectType('GEM');
                        
                        // Try to load this test data with the current symbol image or a fallback
                        const testImage = symbolImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cG9seWdvbiBwb2ludHM9IjUwLDEwIDgwLDM1IDgwLDY1IDUwLDkwIDIwLDY1IDIwLDM1IiBmaWxsPSIjMDBkOWZmIiBzdHJva2U9IiMwMGFhY2MiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==';
                        await professionalPixiRenderer.loadSymbolWithUniversalDetection(testImage, 'idle');
                        
                        // Start animation
                        setTimeout(() => {
                          try {
                            professionalPixiRenderer.play();
                            updateAnimationState({ isPlaying: true });
                            console.log('🎬 Test gem animation started');
                          } catch (animError) {
                            console.error('Test animation start failed:', animError);
                          }
                        }, 500);
                        
                      } catch (error) {
                        console.error('Test gem creation failed:', error);
                      }
                    }}
                    className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                  >
                    🔮 Create Test Gem Animation
                  </button>
                  
                  {selectedPreset && (
                    <button
                      onClick={() => {
                        console.log('🔥 Force starting animation...');
                        professionalPixiRenderer.play();
                        updateAnimationState({ isPlaying: true });
                      }}
                      className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      Force Start Animation
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      console.log('🔧 Debug renderer state...');
                      console.log('Renderer app initialized:', 'app' in professionalPixiRenderer);
                      console.log('Animation state:', animationState);
                      console.log('Selected preset:', selectedPreset?.name);
                      console.log('Sprites created:', professionalPixiRenderer.sprites?.size || 0);
                      console.log('Renderer ready:', rendererReady);
                      console.log('Component mounted:', isComponentMounted.current);
                      console.log('Renderer initialized:', rendererInitialized.current);
                      
                      // Canvas debug
                      const container = canvasContainerRef.current;
                      if (container) {
                        const canvas = container.querySelector('canvas');
                        console.log('🎯 Canvas debug:', {
                          containerExists: !!container,
                          canvasExists: !!canvas,
                          canvasVisible: canvas?.style.visibility,
                          canvasOpacity: canvas?.style.opacity,
                          canvasRect: canvas?.getBoundingClientRect(),
                          containerRect: container.getBoundingClientRect()
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded mt-1"
                  >
                    Debug State
                  </button>
                  <div className="text-gray-400">
                    <div>State: {animationState.isPlaying ? '▶️ Playing' : '⏸️ Paused'}</div>
                    <div>Mounted: {isComponentMounted.current ? '✅' : '❌'}</div>
                    <div>Initialized: {rendererInitialized.current ? '✅' : '❌'}</div>
                    <div>Ready: {rendererReady ? '✅' : '❌'}</div>
                    {selectedPreset && (
                      <>
                        <div>Time: {animationState.currentTime.toFixed(2)}s</div>
                        <div>Duration: {animationState.duration}s</div>
                        <div>Sprites: {selectedPreset.animations.length}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Export Controls */}
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-3">Professional Export</h3>
              
              {/* Export Format Selection */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Export Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="spine">🦴 Spine JSON</option>
                  <option value="dragonbones">🐉 DragonBones</option>
                  <option value="lottie">🎭 Lottie (Web)</option>
                  <option value="css">🎨 CSS Animations</option>
                  <option value="webgl">🎮 WebGL Shaders</option>
                  <option value="unity">🎯 Unity Package</option>
                </select>
              </div>
              
              {/* Export Options */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Quality:</span>
                  <span className="text-blue-400">{targetPlatform === 'mobile' ? 'Mobile' : 'Desktop'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Frame Rate:</span>
                  <span className="text-green-400">60 FPS</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">AI Confidence:</span>
                  <span className="text-purple-400">{selectedPreset ? Math.round(selectedPreset.confidence * 100) : 0}%</span>
                </div>
              </div>

              {/* Export Button */}
              <button 
                onClick={handleExport}
                disabled={!selectedPreset || isExporting}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all"
              >
                {isExporting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Export as {exportFormat.toUpperCase()}</span>
                  </>
                )}
              </button>
              
              {/* Quick Export Buttons */}
              {automationLevel.level === 'professional' && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setExportFormat('lottie'); handleExport(); }}
                    className="px-2 py-1 bg-purple-600/20 border border-purple-600 rounded text-xs hover:bg-purple-600/30 transition-colors"
                  >
                    <Code className="w-3 h-3 inline mr-1" />
                    Web
                  </button>
                  <button
                    onClick={() => { setExportFormat('unity'); handleExport(); }}
                    className="px-2 py-1 bg-blue-600/20 border border-blue-600 rounded text-xs hover:bg-blue-600/30 transition-colors"
                  >
                    <Gamepad2 className="w-3 h-3 inline mr-1" />
                    Game
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Right Panel: Animation Preview */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Top Bar */}
        <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">Animation Preview</h2>
            {selectedPreset && (
              <span className="text-sm bg-purple-600 px-3 py-1 rounded-full">
                {selectedPreset.name}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {(automationLevel.level === 'professional' || process.env.NODE_ENV === 'development') && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowGraphEditor(!showGraphEditor)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                    showGraphEditor ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Graph Editor</span>
                </button>
                
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Advanced</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
                </button>
                
                <button
                  onClick={() => setShowQAModule(true)}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                  title="Open Q&A Debug Module for troubleshooting"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Q&A Debug</span>
                </button>
                
                <button
                  onClick={async () => {
                    console.log('🔥 EMERGENCY TEST: Direct GPT-4 Vision call');
                    if (symbolImage) {
                      try {
                        const { analyzeSymbolWithGPTVision } = await import('../../utils/gptVisionClient');
                        console.log('🔥 EMERGENCY: Calling GPT-4 Vision directly...');
                        const result = await analyzeSymbolWithGPTVision(symbolImage);
                        console.log('🔥 EMERGENCY: Direct call succeeded!', result);
                        alert(`✅ GPT-4 Vision worked! Detected: ${result.symbolType} - ${result.description}`);
                      } catch (error) {
                        console.error('🔥 EMERGENCY: Direct call failed:', error);
                        alert(`GPT-4 Vision failed: ${error.message}`);
                      }
                    } else {
                      alert('No symbol image available. Upload a symbol first.');
                    }
                  }}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                  title="Emergency direct GPT-4 Vision test"
                >
                  <Zap className="w-4 h-4" />
                  <span>🔥 TEST GPT-4</span>
                </button>
                
                <button
                  onClick={async () => {
                    console.log('🎨 TESTING: Multi-layer analysis');
                    if (symbolImage) {
                      try {
                        const { analyzeImageLayers } = await import('../../utils/gptVisionClient');
                        console.log('🎨 LAYER TEST: Calling multi-layer analysis...');
                        const result = await analyzeImageLayers(symbolImage);
                        console.log('🎨 LAYER TEST: Analysis complete!', result);
                        
                        // Store results for AI Detection Preview
                        setMultiLayerResults(result);
                        
                        // 🧹 CRITICAL: Clear old extracted layers since we have new analysis
                        console.log('🧹 [Phase 2.0] Clearing old extracted layers - new analysis detected');
                        setExtractedLayers({});
                        setExtractionProgress({});
                        
                        // 🎛️ Initialize layer visibility (all visible by default)
                        const initialVisibility: Record<string, boolean> = {};
                        result.layers.forEach(layer => {
                          initialVisibility[layer.id] = true;
                        });
                        setLayerVisibility(initialVisibility);
                        setShowLayerPanel(true);
                        
                        alert(`🎨 Layer Analysis Success!\n\nFound ${result.layers.length} layers:\n${result.layers.map(l => `• ${l.name} (${l.type})`).join('\n')}\n\nAnimations: ${result.recommendedAnimations.length}`);
                      } catch (error) {
                        console.error('🎨 LAYER TEST: Failed:', error);
                        alert(`Layer analysis failed: ${error.message}`);
                      }
                    } else {
                      alert('No symbol image available. Upload a symbol first.');
                    }
                  }}
                  className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
                  title="Test new multi-layer analysis system"
                >
                  <Layers className="w-4 h-4" />
                  <span>🎨 TEST LAYERS</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Area */}
          <div className={`${showGraphEditor ? 'h-1/2' : 'flex-1'} relative`}>
            {/* 🔧 ULTRA SIMPLE CONTAINER - Maximum reliability */}
            <div 
              ref={canvasContainerRef}
              className="w-full h-full relative"
              style={{ 
                pointerEvents: 'auto',
                backgroundColor: 'rgba(26, 26, 46, 1)', // Professional dark background like sidebar
                border: '1px solid rgba(75, 85, 99, 0.3)', // Subtle border
                minHeight: '500px',
                minWidth: '500px',
                display: 'block',
                position: 'relative',
                borderRadius: '8px' // Smooth corners
              }}
            >
              {!symbolImage ? (
                <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
                  <div>
                    <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Upload or generate a symbol to begin</p>
                    <p className="text-sm">AI will automatically create animations</p>
                  </div>
                </div>
              ) : isAnalyzing ? (
                <div className="absolute inset-0 flex items-center justify-center text-center">
                  <div>
                    <Loader className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-500" />
                    <p className="text-lg">AI is analyzing your symbol...</p>
                    <p className="text-sm text-gray-400">This may take a few moments</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Performance Overlay */}
            {selectedPreset && performanceMetrics && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-70 rounded-lg p-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span>Performance:</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      performanceGrade === 'A' ? 'bg-green-600' :
                      performanceGrade === 'B' ? 'bg-blue-600' :
                      performanceGrade === 'C' ? 'bg-yellow-600' :
                      performanceGrade === 'D' ? 'bg-orange-600' : 'bg-red-600'
                    }`}>
                      {performanceGrade}
                    </span>
                  </div>
                  <div>FPS: {performanceMetrics.fps.toFixed(1)}</div>
                  <div>Memory: {performanceMetrics.memoryUsage.toFixed(1)}MB</div>
                  <div>Platform: {targetPlatform}</div>
                  {performanceMetrics.warnings.length > 0 && (
                    <div className="text-yellow-400">
                      ⚠️ {performanceMetrics.warnings.length} issues
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status display removed for production */}

            {/* 🔬 AI ANALYSIS DEBUG THUMBNAIL - ALWAYS VISIBLE FOR DEBUGGING */}
            {symbolImage && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-90 rounded-lg p-3 border border-gray-600 z-50">
                <div className="text-xs text-gray-300 mb-2 flex items-center space-x-2 flex-wrap">
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">AI Detection Preview</span>
                  {(universalDetectionResults?.symbolType || detectedObjectType) && (
                    <span className="bg-purple-600 px-2 py-0.5 rounded text-xs font-bold uppercase">
                      {universalDetectionResults?.symbolType || detectedObjectType || 'Unknown'}
                    </span>
                  )}
                  {universalDetectionResults?.specificCreatureType && (
                    <span className="bg-orange-600 px-2 py-0.5 rounded text-xs font-bold">
                      {universalDetectionResults.specificCreatureType.replace('-', ' ').toUpperCase()}
                    </span>
                  )}
                  {universalDetectionResults?.detectionMethod === 'gpt-4-vision' && (
                    <span className="bg-green-600 px-2 py-0.5 rounded text-xs font-bold">
                      GPT-4 VISION
                    </span>
                  )}
                  {multiLayerResults && (
                    <span className="bg-cyan-600 px-2 py-0.5 rounded text-xs font-bold">
                      🎨 {multiLayerResults.layers.length} LAYERS
                    </span>
                  )}
                </div>
                
                {/* Status removed for production */}
                
                {/* Debug info - Enhanced for mesh system */}
                <div className="text-xs text-yellow-400 mb-2">
                  <div>🎮 Mesh: {universalDetectionResults ? '✅' : '❌'}</div>
                  <div>📊 Analysis: {analysis ? '✅' : '❌'}</div>
                  <div>🔢 Components: {universalDetectionResults?.animatableElements?.length || analysis?.detectedElements?.length || 0}</div>
                  <div>🎯 Precision: {universalDetectionResults ? 'SURGICAL' : 'BASIC'}</div>
                  {universalDetectionResults && (
                    <>
                      <div className="text-green-300">🎯 Object: {universalDetectionResults.symbolType}</div>
                      {universalDetectionResults.gptVisionDescription && (
                        <div className="text-blue-300 text-xs mt-1">🤖 GPT-4: {universalDetectionResults.gptVisionDescription.substring(0, 100)}...</div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Debug thumbnail container */}
                <div className="relative w-48 h-48 bg-gray-800 rounded border border-gray-700 overflow-hidden">
                  {/* Original symbol as background */}
                  <img 
                    src={symbolImage} 
                    alt="Symbol Analysis"
                    className="absolute inset-0 w-full h-full object-contain opacity-80"
                  />
                  
                  {/* 🔬 DETECTION OVERLAYS - Show GPT-4 Vision results */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Debug overlay status */}
                    <div className="absolute bottom-2 left-2 text-xs text-green-400 bg-black bg-opacity-60 px-1 py-0.5 rounded">
                      Basic: {universalDetectionResults?.animatableElements ? 'READY' : 'MISSING'} ({universalDetectionResults?.animatableElements?.length || 0})
                      {multiLayerResults && (
                        <div>🎨 Layers: {multiLayerResults.layers.length}</div>
                      )}
                    </div>
                    
                    {/* Render detection overlays if we have universal detection results */}
                    {universalDetectionResults && universalDetectionResults.animatableElements && universalDetectionResults.animatableElements.length > 0 && (
                      <>
                        {universalDetectionResults.animatableElements.map((element, index) => {
                          // Debug log the element data
                          console.log(`🔬 Rendering overlay ${index}:`, {
                            id: element.id,
                            type: element.type,
                            bounds: element.bounds,
                            hasAttachment: !!element.attachmentPoint,
                            hasContours: !!element.contourPoints
                          });
                          
                          // Calculate overlay position and size (thumbnail is 192x192 = w-48 h-48)
                          const overlayX = (element.bounds.x / 100) * 192;
                          const overlayY = (element.bounds.y / 100) * 192;
                          const overlayWidth = (element.bounds.width / 100) * 192;
                          const overlayHeight = (element.bounds.height / 100) * 192;
                          
                          console.log(`🎯 Overlay coords: x=${overlayX}, y=${overlayY}, w=${overlayWidth}, h=${overlayHeight}`);
                          
                          // Color coding by element type
                          const getElementColor = (type: string) => {
                            switch (type) {
                              case 'wings': return 'rgb(59, 130, 246)'; // blue-500
                              case 'body': return 'rgb(34, 197, 94)'; // green-500
                              case 'limbs':
                              case 'legs': return 'rgb(234, 179, 8)'; // yellow-500
                              case 'eyes': return 'rgb(239, 68, 68)'; // red-500
                              case 'appendage': return 'rgb(168, 85, 247)'; // purple-500
                              case 'tail': return 'rgb(249, 115, 22)'; // orange-500
                              case 'decorative': return 'rgb(236, 72, 153)'; // pink-500
                              default: return 'rgb(156, 163, 175)'; // gray-400
                            }
                          };
                          
                          const color = getElementColor(element.type);
                          
                          return (
                            <div key={element.id || index}>
                              {/* PRECISION: Bounding box with proper colors */}
                              <div
                                className="absolute border-2"
                                style={{
                                  left: `${Math.max(0, overlayX)}px`,
                                  top: `${Math.max(0, overlayY)}px`,
                                  width: `${Math.max(10, overlayWidth)}px`,
                                  height: `${Math.max(10, overlayHeight)}px`,
                                  borderColor: color,
                                  backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.2)'),
                                  borderRadius: '4px',
                                  zIndex: 10
                                }}
                              />
                              
                              {/* Element label */}
                              <div
                                className="absolute text-xs font-bold px-1 py-0.5 rounded text-white shadow-lg"
                                style={{
                                  left: `${overlayX}px`,
                                  top: `${overlayY - 20}px`,
                                  backgroundColor: color,
                                  fontSize: '10px'
                                }}
                              >
                                {element.type}
                              </div>
                              
                              {/* Attachment point (if available) */}
                              {element.attachmentPoint && (
                                <div
                                  className="absolute w-2 h-2 rounded-full border-2 border-white"
                                  style={{
                                    left: `${(element.attachmentPoint.x / 100) * 192 - 4}px`,
                                    top: `${(element.attachmentPoint.y / 100) * 192 - 4}px`,
                                    backgroundColor: color
                                  }}
                                />
                              )}
                              
                              {/* MESH PRECISION: Polygon visualization */}
                              {element.contourPoints && element.contourPoints.length > 0 && (
                                <>
                                  {/* Draw polygon outline using SVG for precision */}
                                  <svg 
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                    style={{ zIndex: 15 }}
                                  >
                                    <polygon
                                      points={element.contourPoints
                                        .map(point => `${(point.x / 100) * 192},${(point.y / 100) * 192}`)
                                        .join(' ')}
                                      fill={color.replace('rgb', 'rgba').replace(')', ', 0.1)')}
                                      stroke={color}
                                      strokeWidth="1"
                                      strokeDasharray="3,2"
                                    />
                                  </svg>
                                  
                                  {/* Show precision mesh points */}
                                  {element.contourPoints.map((point, pointIndex) => (
                                    <div
                                      key={pointIndex}
                                      className="absolute w-1.5 h-1.5 rounded-full border border-white"
                                      style={{
                                        left: `${(point.x / 100) * 192 - 3}px`,
                                        top: `${(point.y / 100) * 192 - 3}px`,
                                        backgroundColor: color,
                                        opacity: 0.95,
                                        zIndex: 25
                                      }}
                                      title={`Mesh Point ${pointIndex + 1}: ${point.x.toFixed(1)}%, ${point.y.toFixed(1)}%`}
                                    />
                                  ))}
                                  
                                  {/* Mesh precision indicator */}
                                  <div
                                    className="absolute text-xs text-white bg-black bg-opacity-80 px-1 rounded"
                                    style={{
                                      left: `${overlayX}px`,
                                      top: `${overlayY + overlayHeight + 2}px`,
                                      fontSize: '8px',
                                      zIndex: 30,
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    🎮 {element.contourPoints.length}pts
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                    
                    {/* 🎨 MULTI-LAYER OVERLAYS - Show GPT-4 Vision layer analysis results */}
                    {multiLayerResults && multiLayerResults.layers && multiLayerResults.layers.length > 0 && (
                      <>
                        {multiLayerResults.layers.filter(layer => layerVisibility[layer.id] !== false).map((layer, index) => {
                          console.log(`🎨 Rendering multi-layer overlay ${index}:`, {
                            id: layer.id,
                            name: layer.name,
                            type: layer.type,
                            bounds: layer.bounds,
                            animationPotential: layer.animationPotential
                          });
                          
                          // Calculate overlay position and size (thumbnail is 192x192 = w-48 h-48)
                          const overlayX = (layer.bounds.x / 100) * 192;
                          const overlayY = (layer.bounds.y / 100) * 192;
                          const overlayWidth = (layer.bounds.width / 100) * 192;
                          const overlayHeight = (layer.bounds.height / 100) * 192;
                          
                          // Enhanced color coding for multi-layer types
                          const getLayerColor = (type: string) => {
                            switch (type) {
                              case 'weapon': return 'rgb(220, 38, 38)'; // red-600 - weapons
                              case 'armor': return 'rgb(37, 99, 235)'; // blue-600 - armor
                              case 'body': return 'rgb(34, 197, 94)'; // green-500 - body parts
                              case 'accessory': return 'rgb(168, 85, 247)'; // purple-500 - accessories
                              case 'clothing': return 'rgb(249, 115, 22)'; // orange-500 - clothing
                              case 'effect': return 'rgb(236, 72, 153)'; // pink-500 - effects
                              case 'limb': return 'rgb(234, 179, 8)'; // yellow-500 - limbs
                              default: return 'rgb(156, 163, 175)'; // gray-400 - other
                            }
                          };
                          
                          const color = getLayerColor(layer.type);
                          const isHighPotential = layer.animationPotential === 'high';
                          
                          return (
                            <div key={`layer-${layer.id || index}`}>
                              {/* 🎨 ENHANCED: Layer bounding box with animation potential styling */}
                              <div
                                className={`absolute border-2 ${isHighPotential ? 'border-dashed' : 'border-solid'}`}
                                style={{
                                  left: `${Math.max(0, overlayX)}px`,
                                  top: `${Math.max(0, overlayY)}px`,
                                  width: `${Math.max(10, overlayWidth)}px`,
                                  height: `${Math.max(10, overlayHeight)}px`,
                                  borderColor: color,
                                  backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.15)'),
                                  borderRadius: '4px',
                                  zIndex: 20 + index,
                                  borderWidth: isHighPotential ? '3px' : '2px'
                                }}
                              />
                              
                              {/* 🎨 ENHANCED: Layer name and type label */}
                              <div
                                className="absolute text-xs font-bold px-2 py-1 rounded text-white shadow-lg"
                                style={{
                                  left: `${overlayX}px`,
                                  top: `${overlayY - 25}px`,
                                  backgroundColor: color,
                                  fontSize: '10px',
                                  zIndex: 30 + index
                                }}
                              >
                                🎨 {layer.name}
                              </div>
                              
                              {/* 🎨 Animation potential indicator */}
                              <div
                                className="absolute text-xs text-white bg-black bg-opacity-80 px-1 rounded"
                                style={{
                                  left: `${overlayX}px`,
                                  top: `${overlayY + overlayHeight + 2}px`,
                                  fontSize: '8px',
                                  zIndex: 25 + index,
                                  fontWeight: 'bold'
                                }}
                              >
                                {layer.animationPotential === 'high' ? '🔥' : 
                                 layer.animationPotential === 'medium' ? '⚡' : '💤'} {layer.animationPotential}
                              </div>
                              
                              {/* 🎨 Attachment point (if available) */}
                              {layer.attachmentPoint && (
                                <div
                                  className="absolute w-2 h-2 rounded-full border-2 border-white"
                                  style={{
                                    left: `${(layer.attachmentPoint.x / 100) * 192 - 4}px`,
                                    top: `${(layer.attachmentPoint.y / 100) * 192 - 4}px`,
                                    backgroundColor: color,
                                    zIndex: 35 + index
                                  }}
                                />
                              )}
                              
                              {/* 🎨 Contour points (if available) */}
                              {layer.contourPoints && layer.contourPoints.length > 0 && (
                                <>
                                  {/* Draw polygon outline using SVG for precision */}
                                  <svg 
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                    style={{ zIndex: 15 + index }}
                                  >
                                    <polygon
                                      points={layer.contourPoints
                                        .map(point => `${(point.x / 100) * 192},${(point.y / 100) * 192}`)
                                        .join(' ')}
                                      fill={color.replace('rgb', 'rgba').replace(')', ', 0.1)')}
                                      stroke={color}
                                      strokeWidth="1"
                                      strokeDasharray={isHighPotential ? "5,3" : "3,2"}
                                    />
                                  </svg>
                                  
                                  {/* Show contour points */}
                                  {layer.contourPoints.map((point, pointIndex) => (
                                    <div
                                      key={pointIndex}
                                      className="absolute w-1.5 h-1.5 rounded-full border border-white"
                                      style={{
                                        left: `${(point.x / 100) * 192 - 3}px`,
                                        top: `${(point.y / 100) * 192 - 3}px`,
                                        backgroundColor: color,
                                        opacity: 0.95,
                                        zIndex: 40 + index
                                      }}
                                      title={`${layer.name} Point ${pointIndex + 1}: ${point.x.toFixed(1)}%, ${point.y.toFixed(1)}%`}
                                    />
                                  ))}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                    
                    {/* Detection summary badge */}
                    <div className="absolute top-2 left-2 text-xs text-white bg-black bg-opacity-60 px-2 py-1 rounded">
                      🔍 {universalDetectionResults?.animatableElements?.length || analysis?.detectedElements?.length || 0} elements detected
                    </div>
                    
                    {/* Analysis confidence */}
                    {universalDetectionResults && (
                      <div className="absolute top-2 right-2 text-xs text-white bg-black bg-opacity-60 px-2 py-1 rounded">
                        🎯 {Math.round((universalDetectionResults.confidence || 0) * 100)}%
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Detection legend - Show ALL elements */}
                <div className="mt-2 text-xs space-y-1 max-h-40 overflow-y-auto">
                  {/* Basic Detection Elements */}
                  {(universalDetectionResults?.animatableElements || analysis?.detectedElements) && (
                    <>
                      <div className="text-gray-400 font-semibold">Basic Detection:</div>
                      {(universalDetectionResults?.animatableElements || analysis?.detectedElements)?.map((element, index) => (
                        <div key={`basic-${index}`} className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            element.type === 'wing' ? 'bg-blue-500' :
                            element.type === 'body' ? 'bg-green-500' :
                            element.type === 'leg' || element.type === 'limbs' ? 'bg-yellow-500' :
                            element.type === 'antenna' ? 'bg-orange-500' :
                            element.type === 'eye' ? 'bg-red-500' :
                            'bg-purple-500'
                          }`}></div>
                          <span className="text-gray-300 text-xs leading-tight">{element.name || element.type}</span>
                          <span className="text-gray-500 text-xs">({element.animationPotential})</span>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* Multi-Layer Analysis Results */}
                  {multiLayerResults && multiLayerResults.layers && (
                    <>
                      <div className="text-cyan-400 font-semibold mt-2 pt-1 border-t border-gray-600 flex items-center space-x-2">
                        🎨 Multi-Layer Analysis:
                        {showLayerPanel && (
                          <span className="bg-cyan-600 px-1 py-0.5 rounded text-xs">ACTIVE</span>
                        )}
                      </div>
                      {multiLayerResults.layers.map((layer, index) => {
                        const isVisible = layerVisibility[layer.id] !== false;
                        return (
                          <div key={`layer-${index}`} className={`flex items-center space-x-2 ${!isVisible ? 'opacity-30' : ''}`}>
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              layer.type === 'weapon' ? 'bg-red-600' :
                              layer.type === 'armor' ? 'bg-blue-600' :
                              layer.type === 'body' ? 'bg-green-500' :
                              layer.type === 'accessory' ? 'bg-purple-500' :
                              layer.type === 'clothing' ? 'bg-orange-500' :
                              layer.type === 'effect' ? 'bg-pink-500' :
                              layer.type === 'limb' ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}></div>
                            <span className="text-cyan-300 text-xs leading-tight font-medium">
                              🎨 {layer.name}
                            </span>
                            <span className="text-cyan-500 text-xs">({layer.type})</span>
                            <span className="text-xs">
                              {layer.animationPotential === 'high' ? '🔥' : 
                               layer.animationPotential === 'medium' ? '⚡' : '💤'}
                            </span>
                            {!isVisible && (
                              <span className="text-xs text-gray-500">👁️‍🗨️</span>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Recommended Animations */}
                      {multiLayerResults.recommendedAnimations && multiLayerResults.recommendedAnimations.length > 0 && (
                        <>
                          <div className="text-green-400 font-semibold mt-1 text-xs">🎬 Suggested Animations:</div>
                          {multiLayerResults.recommendedAnimations.map((anim, index) => (
                            <div key={`anim-${index}`} className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
                              <span className="text-green-300 text-xs leading-tight">{anim.animationType}</span>
                              <span className="text-gray-500 text-xs">({anim.description.substring(0, 20)}...)</span>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Total count */}
                  <div className="text-gray-400 text-xs border-t border-gray-600 pt-1 mt-2">
                    Basic: {(universalDetectionResults?.animatableElements || analysis?.detectedElements)?.length || 0} | 
                    🎨 Layers: {showLayerPanel ? `${Object.values(layerVisibility).filter(Boolean).length}/${multiLayerResults?.layers?.length || 0}` : multiLayerResults?.layers?.length || 0} | 
                    🎬 Anims: {multiLayerResults?.recommendedAnimations?.length || 0}
                  </div>
                </div>
              </div>
            )}

            {/* 🎛️ PHASE 1.2: Visual Layer Panel UI with Toggle Controls */}
            {showLayerPanel && multiLayerResults && multiLayerResults.layers && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-95 rounded-lg p-4 border border-cyan-600 z-50 max-w-sm">
                <div className="text-sm text-cyan-300 mb-3 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold">Layer Controls</span>
                  <span className="bg-cyan-600 px-2 py-0.5 rounded text-xs font-bold">
                    PHASE 1.2
                  </span>
                  <button
                    onClick={() => setShowLayerPanel(false)}
                    className="ml-auto text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Individual Layer Toggle Controls */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {multiLayerResults.layers.map((layer, index) => {
                    const isVisible = layerVisibility[layer.id] !== false;
                    
                    // Enhanced color coding for layer types
                    const getLayerColor = (type: string) => {
                      switch (type) {
                        case 'weapon': return 'text-red-400 border-red-500';
                        case 'armor': return 'text-blue-400 border-blue-500';
                        case 'body': return 'text-green-400 border-green-500';
                        case 'accessory': return 'text-purple-400 border-purple-500';
                        case 'clothing': return 'text-orange-400 border-orange-500';
                        case 'effect': return 'text-pink-400 border-pink-500';
                        case 'limb': return 'text-yellow-400 border-yellow-500';
                        default: return 'text-gray-400 border-gray-500';
                      }
                    };
                    
                    const layerColors = getLayerColor(layer.type);
                    
                    return (
                      <div 
                        key={layer.id} 
                        className={`flex items-center space-x-3 p-2 rounded border ${layerColors} ${
                          isVisible 
                            ? 'bg-gray-800 bg-opacity-50' 
                            : 'bg-gray-900 bg-opacity-30 opacity-50'
                        } transition-all duration-200`}
                      >
                        {/* Toggle Switch */}
                        <button
                          onClick={() => {
                            setLayerVisibility(prev => ({
                              ...prev,
                              [layer.id]: !isVisible
                            }));
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                            isVisible ? 'bg-cyan-600' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                              isVisible ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        
                        {/* Layer Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">
                              {layer.name}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${layerColors.replace('text-', 'bg-').replace('border-', '').replace('-400', '-600').replace('-500', '')}`}>
                              {layer.type}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-400">
                              z-index: {layer.zIndex}
                            </span>
                            <span className="text-xs">
                              {layer.animationPotential === 'high' ? '🔥' : 
                               layer.animationPotential === 'medium' ? '⚡' : '💤'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {layer.animationPotential}
                            </span>
                          </div>
                        </div>
                        
                        {/* Layer Actions */}
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => {
                              // Future: Focus on this layer in preview
                              console.log(`🎯 Focus on layer: ${layer.name}`);
                            }}
                            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                            title="Focus on layer"
                          >
                            🎯
                          </button>
                          <button
                            onClick={() => extractLayerSprite(layer)}
                            className={`text-xs transition-colors ${
                              extractionProgress[layer.id]?.status === 'extracting' 
                                ? 'text-yellow-400 animate-pulse cursor-wait' 
                                : extractionProgress[layer.id]?.status === 'complete'
                                ? 'text-green-400 hover:text-green-300'
                                : extractionProgress[layer.id]?.status === 'error'
                                ? 'text-red-400 hover:text-red-300'
                                : 'text-green-400 hover:text-green-300'
                            }`}
                            title={
                              extractionProgress[layer.id]?.status === 'extracting' 
                                ? `Extracting... ${extractionProgress[layer.id]?.progress}%`
                                : extractionProgress[layer.id]?.status === 'complete'
                                ? 'Layer extracted! Click to re-extract'
                                : extractionProgress[layer.id]?.status === 'error'
                                ? 'Extraction failed - click to retry'
                                : 'Extract layer as individual sprite'
                            }
                            disabled={extractionProgress[layer.id]?.status === 'extracting'}
                          >
                            {extractionProgress[layer.id]?.status === 'extracting' ? '⏳' :
                             extractionProgress[layer.id]?.status === 'complete' ? '✅' :
                             extractionProgress[layer.id]?.status === 'error' ? '❌' : '📸'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Layer Panel Actions */}
                <div className="mt-4 pt-3 border-t border-gray-600 flex space-x-2">
                  <button
                    onClick={() => {
                      // Show all layers
                      const allVisible: Record<string, boolean> = {};
                      multiLayerResults.layers.forEach(layer => {
                        allVisible[layer.id] = true;
                      });
                      setLayerVisibility(allVisible);
                    }}
                    className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                  >
                    👁️ Show All
                  </button>
                  <button
                    onClick={() => {
                      // Hide all layers
                      const allHidden: Record<string, boolean> = {};
                      multiLayerResults.layers.forEach(layer => {
                        allHidden[layer.id] = false;
                      });
                      setLayerVisibility(allHidden);
                    }}
                    className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                  >
                    🚫 Hide All
                  </button>
                  <button
                    onClick={async () => {
                      // Extract ALL layers for animation
                      if (!symbolImage || !multiLayerResults) {
                        alert('No symbol or layer data available');
                        return;
                      }

                      const layersToExtract = multiLayerResults.layers.filter(layer => 
                        !extractedLayers[layer.id] && layerVisibility[layer.id] !== false
                      );
                      
                      if (layersToExtract.length === 0) {
                        alert('✅ All visible layers already extracted!');
                        return;
                      }

                      const confirmExtract = confirm(`🎬 Phase 2.0: Extract ${layersToExtract.length} layers for animation?\n\nLayers: ${layersToExtract.map(l => l.name).join(', ')}\n\nThis will prepare them for visual animation.`);
                      if (!confirmExtract) return;

                      // Extract all layers in parallel for speed
                      try {
                        const extractPromises = layersToExtract.map(layer => extractLayerSprite(layer));
                        await Promise.all(extractPromises);
                        
                        alert(`🎉 All ${layersToExtract.length} layers extracted!\n\nReady for animation timeline creation! 🚀`);
                      } catch (error) {
                        console.error('Batch extraction failed:', error);
                        alert('Some extractions failed. Please check individual layers.');
                      }
                    }}
                    className="flex-1 px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors"
                  >
                    🎬 Extract All
                  </button>
                  <button
                    onClick={async () => {
                      if (!symbolImage || !multiLayerResults) {
                        alert('No symbol or layer data available for export');
                        return;
                      }

                      // Extract all visible layers
                      const visibleLayers = multiLayerResults.layers.filter(layer => layerVisibility[layer.id] !== false);
                      
                      if (visibleLayers.length === 0) {
                        alert('No visible layers to export. Please make at least one layer visible.');
                        return;
                      }

                      const confirmExport = confirm(`🚀 Export ${visibleLayers.length} visible layers?\n\nThis will extract: ${visibleLayers.map(l => l.name).join(', ')}\n\nContinue?`);
                      if (!confirmExport) return;

                      // Extract all visible layers in sequence
                      for (const layer of visibleLayers) {
                        if (!extractedLayers[layer.id]) {
                          await extractLayerSprite(layer);
                        }
                      }

                      setShowExtractedSprites(true);
                    }}
                    className={`flex-1 px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded transition-colors ${
                      !symbolImage || !multiLayerResults ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!symbolImage || !multiLayerResults}
                  >
                    🚀 Export
                  </button>
                </div>
                
                {/* Statistics */}
                <div className="mt-2 text-xs text-gray-400 text-center">
                  {Object.values(layerVisibility).filter(Boolean).length} / {multiLayerResults.layers.length} layers visible
                </div>
              </div>
            )}

            {/* 🎨 PHASE 1.3: Extracted Sprites Panel */}
            {showExtractedSprites && Object.keys(extractedLayers).length > 0 && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-95 rounded-lg p-4 border border-green-600 z-50 max-w-md">
                <div className="text-sm text-green-300 mb-3 flex items-center space-x-2">
                  <FileDown className="w-4 h-4 text-green-400" />
                  <span className="font-bold">Extracted Sprites</span>
                  <span className="bg-green-600 px-2 py-0.5 rounded text-xs font-bold">
                    PHASE 1.3
                  </span>
                  <button
                    onClick={() => setShowExtractedSprites(false)}
                    className="ml-auto text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Extracted Sprites Grid */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.values(extractedLayers).map((extractedLayer, index) => {
                    const progress = extractionProgress[extractedLayer.layerId];
                    
                    return (
                      <div 
                        key={extractedLayer.layerId} 
                        className="bg-gray-800 rounded-lg p-3 border border-gray-600 hover:border-green-500 transition-colors"
                      >
                        {/* Layer Header */}
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            extractedLayer.type === 'weapon' ? 'bg-red-500' :
                            extractedLayer.type === 'armor' ? 'bg-blue-500' :
                            extractedLayer.type === 'body' ? 'bg-green-500' :
                            extractedLayer.type === 'accessory' ? 'bg-purple-500' :
                            extractedLayer.type === 'clothing' ? 'bg-orange-500' :
                            extractedLayer.type === 'effect' ? 'bg-pink-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="text-white font-bold text-sm">{extractedLayer.name}</span>
                          <span className="text-gray-400 text-xs">({extractedLayer.type})</span>
                          <span className="text-green-400 text-xs ml-auto">
                            {Math.round(extractedLayer.metadata.confidence * 100)}%
                          </span>
                        </div>
                        
                        {/* Sprite Preview */}
                        <div className="flex space-x-3">
                          <div className="w-20 h-20 bg-gray-700 rounded border border-gray-600 overflow-hidden">
                            <img 
                              src={extractedLayer.spriteBase64} 
                              alt={extractedLayer.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          
                          {/* Sprite Stats */}
                          <div className="flex-1 text-xs text-gray-300 space-y-1">
                            <div className="flex justify-between">
                              <span>Pixels:</span>
                              <span className="text-green-400 font-mono">
                                {extractedLayer.metadata.pixelCount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Boundaries:</span>
                              <span className="text-blue-400 font-mono">
                                {extractedLayer.precisionContour.length} pts
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Method:</span>
                              <span className="text-cyan-400 font-mono text-xs">
                                {extractedLayer.metadata.extractionMethod.split('-')[1]}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Size:</span>
                              <span className="text-yellow-400 font-mono">
                                {Math.round(extractedLayer.refinedBounds.width)}×{Math.round(extractedLayer.refinedBounds.height)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => {
                              // Download sprite
                              const link = document.createElement('a');
                              link.download = `${extractedLayer.name}_layer_sprite.png`;
                              link.href = extractedLayer.spriteBase64;
                              link.click();
                            }}
                            className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                          >
                            💾 Download
                          </button>
                          <button
                            onClick={() => {
                              // Copy base64 to clipboard
                              navigator.clipboard.writeText(extractedLayer.spriteBase64);
                              alert('✅ Sprite data copied to clipboard!');
                            }}
                            className="flex-1 px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors"
                          >
                            📋 Copy
                          </button>
                          <button
                            onClick={() => {
                              // Single layer animation - create timeline if needed
                              if (!currentAnimationSequence) {
                                createAnimationFromExtractedLayers();
                              } else {
                                alert(`🎬 ${extractedLayer.name} is ready for animation!\n\nUse the Animation Timeline panel to control playback and export.`);
                                setShowAnimationTimeline(true);
                              }
                            }}
                            className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                          >
                            🎬 Animate
                          </button>
                        </div>
                        
                        {/* Progress Bar (if extracting) */}
                        {progress && progress.status === 'extracting' && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>{progress.message}</span>
                              <span>{progress.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                              <div 
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: `${progress.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Panel Actions */}
                <div className="mt-4 pt-3 border-t border-gray-600 space-y-2">
                  {/* Animation Preset Selection */}
                  <div className="text-xs text-gray-300 mb-1">Animation Preset:</div>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white"
                  >
                    {animationPresets.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name} ({preset.duration}ms)
                      </option>
                    ))}
                  </select>
                  
                  {/* Main Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={createAnimationFromExtractedLayers}
                      className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors font-bold"
                      disabled={Object.keys(extractedLayers).length === 0}
                    >
                      🎬 Create Animation
                    </button>
                    <button
                      onClick={() => {
                        // Download all sprites as ZIP
                        console.log('📦 Downloading all sprites as ZIP...');
                        alert('📦 Bulk download feature coming soon!\n\nFor now, use individual Download buttons.');
                      }}
                      className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                    >
                      📦 Download All
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      // Clear all extracted layers
                      if (confirm('🗑️ Clear all extracted layers?\n\nThis cannot be undone.')) {
                        setExtractedLayers({});
                        setExtractionProgress({});
                        setShowExtractedSprites(false);
                        setCurrentAnimationSequence(null);
                        setShowAnimationTimeline(false);
                      }
                    }}
                    className="w-full px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                  >
                    🗑️ Clear All
                  </button>
                </div>
                
                {/* Statistics */}
                <div className="mt-2 text-xs text-gray-400 text-center">
                  {Object.keys(extractedLayers).length} sprite{Object.keys(extractedLayers).length !== 1 ? 's' : ''} extracted
                </div>
              </div>
            )}

            {/* 🎬 PHASE 1.4: Professional Animation Timeline Panel */}
            {showAnimationTimeline && currentAnimationSequence && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-95 rounded-lg p-4 border border-purple-600 z-50 max-w-lg">
                <div className="text-sm text-purple-300 mb-3 flex items-center space-x-2">
                  <Play className="w-4 h-4 text-purple-400" />
                  <span className="font-bold">Animation Timeline</span>
                  <span className="bg-purple-600 px-2 py-0.5 rounded text-xs font-bold">
                    PHASE 1.4
                  </span>
                  <button
                    onClick={() => setShowAnimationTimeline(false)}
                    className="ml-auto text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Animation Info */}
                <div className="mb-3 p-2 bg-gray-800 rounded border border-gray-600">
                  <div className="text-white font-bold text-sm mb-1">{currentAnimationSequence.name}</div>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span>📊 {currentAnimationSequence.tracks.length} tracks</span>
                    <span>⏱️ {currentAnimationSequence.duration}ms</span>
                    <span>🎯 {currentAnimationSequence.fps}fps</span>
                    <span>🔄 {currentAnimationSequence.loop ? 'Loop' : 'Once'}</span>
                  </div>
                </div>
                
                {/* Playback Controls */}
                <div className="mb-3 flex items-center space-x-2">
                  <button
                    onClick={playAnimation}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors flex items-center space-x-1"
                  >
                    <Play className="w-3 h-3" />
                    <span>Play</span>
                  </button>
                  <button
                    onClick={pauseAnimation}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded transition-colors flex items-center space-x-1"
                  >
                    <Pause className="w-3 h-3" />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={stopTimelineAnimation}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors flex items-center space-x-1"
                  >
                    <Square className="w-3 h-3" />
                    <span>Stop</span>
                  </button>
                  
                  {/* Timeline Scrubber */}
                  <div className="flex-1 mx-3">
                    <div className="text-xs text-gray-400 mb-1">
                      Time: {timelineState?.currentTime || 0}ms / {currentAnimationSequence.duration}ms
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 relative">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-100" 
                        style={{ 
                          width: `${((timelineState?.currentTime || 0) / currentAnimationSequence.duration) * 100}%` 
                        }}
                      />
                      <input
                        type="range"
                        min="0"
                        max={currentAnimationSequence.duration}
                        value={timelineState?.currentTime || 0}
                        onChange={(e) => {
                          const time = parseInt(e.target.value);
                          professionalAnimationTimeline.seekTo(time);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Animation Tracks */}
                <div className="mb-3 max-h-32 overflow-y-auto">
                  <div className="text-xs text-gray-400 mb-2">Animation Tracks:</div>
                  <div className="space-y-1">
                    {currentAnimationSequence.tracks.map((track, index) => (
                      <div 
                        key={track.id} 
                        className="flex items-center space-x-2 p-1 bg-gray-800 rounded border border-gray-600"
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: track.color }}
                        />
                        <span className="text-white text-xs font-medium flex-1">{track.layerName}</span>
                        <span className="text-gray-400 text-xs">({track.layerType})</span>
                        <span className="text-cyan-400 text-xs">{track.keyframes.length} keys</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Export Options */}
                <div className="pt-3 border-t border-gray-600">
                  <div className="text-xs text-gray-400 mb-2">Export Animation:</div>
                  <div className="grid grid-cols-3 gap-1">
                    {exportFormats.map(format => (
                      <button
                        key={format.id}
                        onClick={() => exportAnimation(format.id as any)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                        title={format.description}
                      >
                        {format.name}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Professional formats for Spine, Lottie, CSS animations
                  </div>
                </div>
                
                {/* Timeline Status */}
                <div className="mt-2 text-xs text-gray-400 text-center">
                  {timelineState?.isPlaying ? '▶️ Playing' : timelineState?.isPaused ? '⏸️ Paused' : '⏹️ Stopped'} | 
                  Speed: {timelineState?.playbackSpeed || 1.0}x
                </div>
              </div>
            )}

            {/* 🎭 PHASE 2.0: Visual Animation Canvas */}
            {showAnimationTimeline && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-95 rounded-lg p-3 border border-yellow-600 z-50">
                <div className="text-sm text-yellow-300 mb-2 flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold">Animation Preview</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    visualRendererReady ? 'bg-green-600' : 'bg-yellow-600'
                  }`}>
                    {visualRendererReady ? 'READY' : 'LOADING'}
                  </span>
                </div>
                
                {/* Animation Canvas */}
                <div className="relative">
                  <canvas
                    ref={animationCanvasRef}
                    width={400}
                    height={300}
                    className="border border-gray-600 rounded bg-gray-900"
                  />
                  
                  {/* Canvas Overlay Info */}
                  <div className="absolute top-2 left-2 text-xs text-white bg-black bg-opacity-60 px-2 py-1 rounded">
                    🎭 Live Animation Preview
                  </div>
                  
                  {/* Renderer Stats */}
                  <div className="absolute bottom-2 right-2 text-xs text-yellow-400 bg-black bg-opacity-60 px-2 py-1 rounded">
                    {rendererStats.fps.toFixed(0)} FPS | {rendererStats.sprites} sprites
                  </div>
                </div>
                
                {/* Canvas Controls */}
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => {
                      // Center view
                      visualAnimationRenderer.setViewport({ scale: 1.0 });
                    }}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                  >
                    🎯 Center
                  </button>
                  <button
                    onClick={() => {
                      // Zoom in
                      const currentScale = visualAnimationRenderer.getViewport().scale;
                      visualAnimationRenderer.setViewport({ scale: Math.min(currentScale * 1.2, 3.0) });
                    }}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                  >
                    🔍 Zoom In
                  </button>
                  <button
                    onClick={() => {
                      // Zoom out
                      const currentScale = visualAnimationRenderer.getViewport().scale;
                      visualAnimationRenderer.setViewport({ scale: Math.max(currentScale * 0.8, 0.2) });
                    }}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                  >
                    🔍 Zoom Out
                  </button>
                  <button
                    onClick={() => {
                      // Capture frame
                      try {
                        const frameData = visualAnimationRenderer.captureFrame();
                        const link = document.createElement('a');
                        link.download = `animation_frame_${Date.now()}.png`;
                        link.href = frameData;
                        link.click();
                      } catch (error) {
                        console.error('Failed to capture frame:', error);
                      }
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                  >
                    📸 Capture
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Graph Editor */}
          {showGraphEditor && automationLevel.level === 'professional' && (
            <div className="h-1/2 border-t border-gray-700">
              <GraphEditor />
            </div>
          )}
        </div>
        
        {/* Professional Timeline - Show for professional users or development */}
        {(automationLevel.level === 'professional' || process.env.NODE_ENV === 'development') && selectedPreset && (
          <AutomatedTimeline />
        )}
      </div>
      
      {/* Q&A Debug Module Modal */}
      {showQAModule && (
        <QADebugModule onClose={() => setShowQAModule(false)} />
      )}

      {/* 🎯 Animation Lab Sprite Browser Modal */}
      {showSpriteBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Animation Lab Browser</h2>
                    <p className="text-sm text-gray-400">Previously saved sprites and components</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSpriteBrowser(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="text-2xl text-gray-400">×</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {savedSprites.length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No saved sprites yet</h3>
                  <p className="text-gray-500">Generate or upload sprites to see them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedSprites.map((sprite) => (
                    <div key={sprite.id} className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600 hover:border-purple-500 transition-colors">
                      {/* Sprite Image */}
                      <div className="aspect-square bg-gray-800 relative overflow-hidden">
                        <img
                          src={sprite.originalImageUrl}
                          alt={sprite.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500"><span>Image not found</span></div>';
                            }
                          }}
                        />
                        {sprite.spriteSheetUrl && (
                          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                            SPRITES
                          </div>
                        )}
                      </div>
                      
                      {/* Sprite Info */}
                      <div className="p-4">
                        <h4 className="font-medium text-white mb-1">{sprite.name}</h4>
                        {sprite.prompt && (
                          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{sprite.prompt}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>
                            {sprite.components.length} components
                          </span>
                          <span>
                            {new Date(sprite.generatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Actions */}
                        <div className="space-y-2">
                          <button
                            onClick={() => handleLoadSprite(sprite)}
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                          >
                            Load & Animate
                          </button>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => createDebugDownload(sprite.originalImageUrl, `${sprite.id}_original.png`)}
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs transition-colors"
                            >
                              Download
                            </button>
                            {sprite.spriteSheetUrl && (
                              <button
                                onClick={() => createDebugDownload(sprite.spriteSheetUrl!, `${sprite.id}_sprites.png`)}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs transition-colors"
                              >
                                Sprites
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-700 bg-gray-750">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{savedSprites.length} sprites saved</span>
                <button
                  onClick={loadSavedSprites}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default AutomatedAnimationStudio;