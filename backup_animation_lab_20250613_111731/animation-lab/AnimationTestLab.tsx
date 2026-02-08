import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Upload, Play, Pause, RotateCcw, Download, 
  Wand2, Eye, Settings, Zap, Target
} from 'lucide-react';
import PixiAnimationPreview from './PixiAnimationPreview';
import SymbolAnalyzer from './SymbolAnalyzer';
import AnimationGenerator from './AnimationGenerator';
import SymbolSegmenter from './SymbolSegmenter';
import SegmentedPixiPreview from './SegmentedPixiPreview';
import ProfessionalAnimationLab from './ProfessionalAnimationLab';
import AAAProfessionalAnimationStudio from './AAAProfessionalAnimationStudio';
import AutomatedAnimationStudio from './AutomatedAnimationStudio';
import { enhancedOpenaiClient } from '../../utils/enhancedOpenaiClient';
import { saveImage } from '../../utils/imageSaver';

interface AnimationConfig {
  type: 'idle' | 'win' | 'scatter' | 'wild';
  format: 'pixi' | 'spine2d' | 'lottie';
  elements: Array<{
    id: string;
    name: string;
    animation: string;
    duration: number;
    delay: number;
    easing: string;
  }>;
  globalSettings: {
    loop: boolean;
    intensity: 'subtle' | 'medium' | 'intense';
    style: 'casino' | 'fantasy' | 'modern';
  };
}

interface SegmentationResult {
  body: string;
  leftWing: string;
  rightWing: string;
  segments: Array<{
    id: string;
    name: string;
    image: string;
    anchorPoint: { x: number; y: number };
    attachmentPoint: { x: number; y: number };
    zIndex: number;
  }>;
}

const AnimationTestLab: React.FC = () => {
  const [symbolImage, setSymbolImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [symbolPrompt, setSymbolPrompt] = useState('Golden scarab beetle with detailed wings and metallic texture');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [animationConfig, setAnimationConfig] = useState<AnimationConfig | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<'generate' | 'analyze' | 'segment' | 'animate' | 'preview'>('generate');
  const [animationFormat, setAnimationFormat] = useState<'pixi' | 'spine2d' | 'lottie'>('pixi');
  const [segmentationResult, setSegmentationResult] = useState<SegmentationResult | null>(null);
  const [useSegmentedAnimation, setUseSegmentedAnimation] = useState(false);
  const [useProfessionalMode, setUseProfessionalMode] = useState(true);
  const [useAAAMode, setUseAAAMode] = useState(false);
  const [useAutomatedMode, setUseAutomatedMode] = useState(true);

  // Generate single complete symbol (simple approach)
  const generateSymbol = async () => {
    setIsGenerating(true);
    try {
      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: symbolPrompt + ' for a slot game symbol in a mix of style of pixar and blizzard hearthstone animation',
        targetSymbolId: `anim_test_${Date.now()}`,
        gameId: 'animation-lab'
      });

      if (result?.success && result?.images && result.images.length > 0) {
        const imageUrl = result.images[0];
        setSymbolImage(imageUrl);
        setCurrentStep('animate'); // Skip directly to animation
        
        // Auto-save for testing
        try {
          await saveImage(imageUrl, 'animation_test', `test_symbol_${Date.now()}`, 'animation-lab');
        } catch (saveError) {
          console.warn('Failed to save test symbol:', saveError);
        }
      } else {
        throw new Error('No images generated');
      }
    } catch (error) {
      console.error('Symbol generation failed:', error);
      alert('Failed to generate symbol. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle manual symbol upload
  const handleSymbolUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSymbolImage(e.target?.result as string);
        setCurrentStep('analyze');
      };
      reader.readAsDataURL(file);
    }
  };

  // Mock analysis function (will be replaced with real GPT-4 Vision)
  const analyzeSymbol = async () => {
    setIsAnalyzing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock analysis result
    const mockAnalysis = {
      symbolType: 'scarab',
      identifiedElements: [
        { id: 'wings', name: 'Wings', confidence: 0.95, position: { x: 0.3, y: 0.2, width: 0.4, height: 0.3 } },
        { id: 'body', name: 'Body', confidence: 0.98, position: { x: 0.4, y: 0.4, width: 0.2, height: 0.4 } },
        { id: 'glow', name: 'Metallic Glow', confidence: 0.85, position: { x: 0, y: 0, width: 1, height: 1 } }
      ],
      suggestedAnimations: [
        { element: 'wings', animations: ['flutter', 'shimmer', 'fold'] },
        { element: 'body', animations: ['wobble', 'float', 'pulse'] },
        { element: 'glow', animations: ['pulse', 'shimmer', 'radiate'] }
      ],
      recommendedStyle: 'casino'
    };
    
    setAnalysisResult(mockAnalysis);
    setCurrentStep(useSegmentedAnimation ? 'segment' : 'animate');
    setIsAnalyzing(false);
  };

  // Generate animation configuration
  const generateAnimation = (type: AnimationConfig['type']) => {
    if (!analysisResult) return;

    const config: AnimationConfig = {
      type,
      format: animationFormat,
      elements: [
        {
          id: 'wings',
          name: 'Wings',
          animation: type === 'win' ? 'flutter-intense' : 'flutter-subtle',
          duration: type === 'win' ? 0.3 : 0.8,
          delay: 0,
          easing: 'ease-in-out'
        },
        {
          id: 'body',
          name: 'Body',
          animation: type === 'win' ? 'scale-pulse' : 'float',
          duration: type === 'win' ? 0.5 : 2.0,
          delay: type === 'win' ? 0.2 : 0,
          easing: type === 'win' ? 'ease-out' : 'ease-in-out'
        },
        {
          id: 'glow',
          name: 'Glow Effect',
          animation: type === 'win' ? 'explode' : 'pulse',
          duration: type === 'win' ? 0.8 : 1.5,
          delay: type === 'win' ? 0.1 : 0.5,
          easing: 'ease-in-out'
        }
      ],
      globalSettings: {
        loop: type !== 'win',
        intensity: type === 'win' ? 'intense' : type === 'scatter' ? 'medium' : 'subtle',
        style: 'casino'
      }
    };

    setAnimationConfig(config);
    setCurrentStep('preview');
  };

  // Handle segmentation completion
  const handleSegmentationComplete = (result: SegmentationResult) => {
    setSegmentationResult(result);
    setCurrentStep('animate');
  };

  return (
    <div className="w-full h-full flex">
      {/* Left Panel - Controls */}
      <div className="w-1/2 p-6 space-y-6 overflow-y-auto border-r border-gray-200">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Animation Test Lab</h2>
              <p className="text-gray-600">Generate symbols and create automated animations</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            {useSegmentedAnimation ? 
              ['generate', 'analyze', 'segment', 'animate', 'preview'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep === step ? 'bg-blue-600 text-white' :
                    ['generate', 'analyze', 'segment', 'animate', 'preview'].indexOf(currentStep) > index ? 'bg-green-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 4 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
                </div>
              )) :
              ['generate', 'analyze', 'animate', 'preview'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step ? 'bg-blue-600 text-white' :
                    ['generate', 'analyze', 'animate', 'preview'].indexOf(currentStep) > index ? 'bg-green-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
                </div>
              ))
            }
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 capitalize">Current: {currentStep.replace('-', ' ')}</p>
            <button
              onClick={() => setUseSegmentedAnimation(!useSegmentedAnimation)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                useSegmentedAnimation ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {useSegmentedAnimation ? '🎭 Professional' : '🎮 Basic'}
            </button>
          </div>
        </div>

        {/* Step 1: Generate Symbol */}
        {currentStep === 'generate' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
              <Sparkles className="mr-2" size={18} />
              Step 1: Generate Symbol
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol Prompt
                </label>
                <textarea
                  value={symbolPrompt}
                  onChange={(e) => setSymbolPrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={3}
                  placeholder="Describe the symbol you want to animate..."
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={generateSymbol}
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate Symbol</span>
                    </>
                  )}
                </button>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSymbolUpload}
                  className="hidden"
                  id="symbol-upload"
                />
                <label
                  htmlFor="symbol-upload"
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Analyze Symbol */}
        {currentStep === 'analyze' && symbolImage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
              <Eye className="mr-2" size={18} />
              Step 2: Analyze Symbol
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                <img src={symbolImage} alt="Generated Symbol" className="w-32 h-32 object-contain" />
              </div>

              <button
                onClick={analyzeSymbol}
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <Target className="w-4 h-4 animate-pulse" />
                    <span>Analyzing Elements...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>Analyze for Animation</span>
                  </>
                )}
              </button>

              {isAnalyzing && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">
                    🤖 AI is identifying animatable elements in your symbol...
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3: Segment Symbol (Professional Mode) */}
        {currentStep === 'segment' && symbolImage && useSegmentedAnimation && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
              <Target className="mr-2" size={18} />
              Step 3: Segment Symbol
            </h3>
            
            <SymbolSegmenter
              symbolImage={symbolImage}
              onSegmentationComplete={handleSegmentationComplete}
            />
          </motion.div>
        )}

        {/* Step 3/4: Choose Animation Style */}
        {currentStep === 'animate' && analysisResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
              <Settings className="mr-2" size={18} />
              Step 3: Choose Animation Style
            </h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 mb-2">✅ Analysis Complete!</p>
                <p className="text-xs text-green-600">
                  Found: {analysisResult.identifiedElements.map(e => e.name).join(', ')}
                </p>
              </div>

              {/* Animation Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'pixi', name: 'PIXI.js', desc: 'Web games' },
                    { value: 'spine2d', name: 'Spine2D', desc: 'Industry standard' },
                    { value: 'lottie', name: 'Lottie', desc: 'After Effects' }
                  ].map((format) => (
                    <button
                      key={format.value}
                      onClick={() => setAnimationFormat(format.value as any)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        animationFormat === format.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-xs">{format.name}</div>
                      <div className="text-xs opacity-75">{format.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'idle', name: 'Idle Animation', desc: 'Subtle movement', color: 'blue' },
                  { type: 'win', name: 'Win Animation', desc: 'Explosive effect', color: 'green' },
                  { type: 'scatter', name: 'Scatter Bonus', desc: 'Mystical glow', color: 'purple' },
                  { type: 'wild', name: 'Wild Transform', desc: 'Dynamic change', color: 'orange' }
                ].map((anim) => (
                  <button
                    key={anim.type}
                    onClick={() => generateAnimation(anim.type as AnimationConfig['type'])}
                    className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                      `border-${anim.color}-200 hover:border-${anim.color}-400`
                    }`}
                  >
                    <div className="font-medium text-gray-900">{anim.name}</div>
                    <div className="text-xs text-gray-600">{anim.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Preview & Export */}
        {currentStep === 'preview' && animationConfig && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
              <Play className="mr-2" size={18} />
              Step 4: Preview & Export
            </h3>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                
                <button
                  onClick={() => setCurrentStep('generate')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>

                <button
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  🎬 Animation Type: <strong>{animationConfig.type.toUpperCase()}</strong> | Format: <strong>{animationConfig.format.toUpperCase()}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Elements: {animationConfig.elements.length} | Loop: {animationConfig.globalSettings.loop ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Right Panel - Animation Preview */}
      <div className="w-1/2 flex flex-col">
        {/* Mode Selector */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Animation Engine</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setUseAutomatedMode(true);
                  setUseAAAMode(false);
                  setUseProfessionalMode(false);
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  useAutomatedMode 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🤖 AI Automated
              </button>
              <button
                onClick={() => {
                  setUseAutomatedMode(false);
                  setUseAAAMode(true);
                  setUseProfessionalMode(true);
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  useAAAMode && !useAutomatedMode
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🏆 AAA Studio
              </button>
              <button
                onClick={() => {
                  setUseAutomatedMode(false);
                  setUseAAAMode(false);
                  setUseProfessionalMode(true);
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  !useAAAMode && useProfessionalMode && !useAutomatedMode
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🎭 Professional
              </button>
              <button
                onClick={() => {
                  setUseAutomatedMode(false);
                  setUseAAAMode(false);
                  setUseProfessionalMode(false);
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  !useProfessionalMode && !useAAAMode && !useAutomatedMode
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🎮 Basic
              </button>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mt-1">
            {useAutomatedMode 
              ? 'Fully automated AI-powered animation generation with zero-click workflow'
              : useAAAMode 
                ? 'AAA-level animation studio with skeleton preview, professional tools, and real-time rigging'
                : useProfessionalMode 
                  ? 'AI-powered rigging with physics simulation and professional animation'
                  : 'Simple transform-based animation for quick previews'
            }
          </p>
        </div>

        {/* Animation Preview */}
        <div className="flex-1">
          {useAutomatedMode ? (
            <AutomatedAnimationStudio
              onSymbolGenerate={async (prompt) => {
                setSymbolPrompt(prompt);
                const result = await enhancedOpenaiClient.generateImageWithConfig({
                  prompt: prompt + ' for a slot game symbol in a mix of style of pixar and blizzard hearthstone animation',
                  targetSymbolId: `anim_test_${Date.now()}`,
                  gameId: 'animation-lab'
                });
                
                if (result?.success && result?.images && result.images.length > 0) {
                  return result.images[0];
                }
                throw new Error('Failed to generate symbol');
              }}
              onSymbolUpload={async (file) => {
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    resolve(e.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                });
              }}
            />
          ) : useAAAMode ? (
            <AAAProfessionalAnimationStudio
              symbolImage={symbolImage}
              isPlaying={isPlaying}
              animationType={animationConfig?.type || 'idle'}
              onSymbolGenerate={(prompt) => {
                setSymbolPrompt(prompt);
                generateSymbol();
              }}
              onSymbolUpload={(file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  setSymbolImage(e.target?.result as string);
                  setCurrentStep('animate');
                };
                reader.readAsDataURL(file);
              }}
            />
          ) : useProfessionalMode ? (
            <ProfessionalAnimationLab
              symbolImage={symbolImage}
              isPlaying={isPlaying}
              animationType={animationConfig?.type || 'idle'}
            />
          ) : useSegmentedAnimation && segmentationResult ? (
            <SegmentedPixiPreview
              segmentationResult={segmentationResult}
              animationConfig={animationConfig}
              isPlaying={isPlaying}
            />
          ) : (
            <PixiAnimationPreview
              symbolImage={symbolImage}
              animationConfig={animationConfig}
              isPlaying={isPlaying}
              analysisResult={analysisResult}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimationTestLab;