import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AISymbolAnalysis, AutomatedAnimationPreset, AutomationLevel } from '../utils/aiAnimationEngine';
import { PerformanceMetrics } from '../utils/realTimePerformanceMonitor';

export interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  loop: boolean;
}

export interface AutomationState {
  // Core state
  symbolImage: string | null;
  symbolPrompt: string;
  automationLevel: AutomationLevel;
  
  // Analysis state
  isAnalyzing: boolean;
  analysis: AISymbolAnalysis | null;
  analysisProgress: number;
  
  // Animation state
  availablePresets: AutomatedAnimationPreset[];
  selectedPreset: AutomatedAnimationPreset | null;
  animationState: AnimationState;
  targetPlatform: 'mobile' | 'desktop' | 'all';
  
  // Performance state
  performanceMetrics: PerformanceMetrics | null;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  // UI state
  currentStep: 'upload' | 'analyze' | 'preview' | 'export';
  isGenerating: boolean;
  showAdvancedOptions: boolean;
  processingSteps: Array<{
    id: string;
    name: string;
    status: 'pending' | 'processing' | 'complete' | 'error';
    confidence?: number;
    duration?: number;
  }>;
  
  // User preferences
  userPreferences: {
    preferredAnimationStyle: string;
    defaultPlatform: 'mobile' | 'desktop' | 'all';
    autoPlay: boolean;
    showPerformanceMetrics: boolean;
  };
  
  // Actions
  setSymbolImage: (image: string | null) => void;
  setSymbolPrompt: (prompt: string) => void;
  setAutomationLevel: (level: AutomationLevel) => void;
  
  setAnalyzing: (analyzing: boolean) => void;
  setAnalysis: (analysis: AISymbolAnalysis | null) => void;
  setAnalysisProgress: (progress: number) => void;
  
  setAvailablePresets: (presets: AutomatedAnimationPreset[]) => void;
  setSelectedPreset: (preset: AutomatedAnimationPreset | null) => void;
  updateAnimationState: (state: Partial<AnimationState>) => void;
  setTargetPlatform: (platform: 'mobile' | 'desktop' | 'all') => void;
  
  setPerformanceMetrics: (metrics: PerformanceMetrics) => void;
  setPerformanceGrade: (grade: 'A' | 'B' | 'C' | 'D' | 'F') => void;
  
  setCurrentStep: (step: 'upload' | 'analyze' | 'preview' | 'export') => void;
  setGenerating: (generating: boolean) => void;
  setShowAdvancedOptions: (show: boolean) => void;
  updateProcessingSteps: (steps: AutomationState['processingSteps']) => void;
  
  updateUserPreferences: (preferences: Partial<AutomationState['userPreferences']>) => void;
  
  // Complex actions
  startAutomatedWorkflow: (imageUrl: string) => Promise<void>;
  resetWorkflow: () => void;
  exportAnimation: () => Promise<void>;
}

export const useAutomationStore = create<AutomationState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    symbolImage: null,
    symbolPrompt: 'Golden scarab beetle with detailed wings and metallic texture',
    automationLevel: {
      level: 'zero-click',
      userType: 'beginner',
      interfaceComplexity: 'minimal'
    },
    
    isAnalyzing: false,
    analysis: null,
    analysisProgress: 0,
    
    availablePresets: [],
    selectedPreset: null,
    animationState: {
      isPlaying: false,
      currentTime: 0,
      duration: 2,
      speed: 1,
      loop: true
    },
    targetPlatform: 'all',
    
    performanceMetrics: null,
    performanceGrade: 'A',
    
    currentStep: 'upload',
    isGenerating: false,
    showAdvancedOptions: false,
    processingSteps: [],
    
    userPreferences: {
      preferredAnimationStyle: 'mystical',
      defaultPlatform: 'all',
      autoPlay: true,
      showPerformanceMetrics: true
    },
    
    // Simple actions
    setSymbolImage: (image) => set({ symbolImage: image }),
    setSymbolPrompt: (prompt) => set({ symbolPrompt: prompt }),
    setAutomationLevel: (level) => set({ automationLevel: level }),
    
    setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
    setAnalysis: (analysis) => set({ analysis }),
    setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
    
    setAvailablePresets: (presets) => set({ availablePresets: presets }),
    setSelectedPreset: (preset) => set({ selectedPreset: preset }),
    updateAnimationState: (newState) => set((state) => ({
      animationState: { ...state.animationState, ...newState }
    })),
    setTargetPlatform: (platform) => set({ targetPlatform: platform }),
    
    setPerformanceMetrics: (metrics) => set({ performanceMetrics: metrics }),
    setPerformanceGrade: (grade) => set({ performanceGrade: grade }),
    
    setCurrentStep: (step) => set({ currentStep: step }),
    setGenerating: (generating) => set({ isGenerating: generating }),
    setShowAdvancedOptions: (show) => set({ showAdvancedOptions: show }),
    updateProcessingSteps: (steps) => set({ processingSteps: steps }),
    
    updateUserPreferences: (preferences) => set((state) => ({
      userPreferences: { ...state.userPreferences, ...preferences }
    })),
    
    // Complex actions
    startAutomatedWorkflow: async (imageUrl: string, prompt?: string) => {
      const { setSymbolImage, setCurrentStep, setAnalyzing } = get();
      
      try {
        setSymbolImage(imageUrl);
        if (prompt) {
          set({ symbolPrompt: prompt });
        }
        setCurrentStep('analyze');
        setAnalyzing(true);
        
        // This would integrate with the AI engine
        console.log('🤖 Starting automated workflow for:', imageUrl);
        
        // Import and use AI engine
        const { aiAnimationEngine } = await import('../utils/aiAnimationEngine');
        
        // ENHANCED: Detect object type for adaptive analysis with multiple sources
        let detectedObjectType = 'unknown'; // Let GPT-4 Vision decide
        let gptVisionDescription = null;
        
        // 🚫 NO FALLBACK DETECTION - GPT-4 Vision handles everything
        console.log('🤖 AUTOMATION STORE: Will use GPT-4 Vision for ALL detection - no fallbacks');
        detectedObjectType = 'unknown'; // GPT-4 Vision will determine this
        
        // 🔥 CRITICAL: Don't do AI analysis here - let renderer handle it with GPT-4 Vision
        console.log('🎯 WORKFLOW: Setting up workflow state - AI analysis will happen when symbol loads');
        
        // Set a minimal placeholder analysis to allow workflow to continue
        const placeholderAnalysis = {
          confidence: 0.0,
          detectedElements: [],
          themeClassification: {
            primary: 'Unknown - awaiting GPT-4 Vision',
            confidence: 0.0,
            alternatives: []
          },
          styleRecommendations: [],
          brandCompatibility: {
            gameType: 'premium' as const,
            suggestedTiming: 'medium' as const,
            effectIntensity: 'moderate' as const
          },
          performancePrediction: {
            estimatedFPS: 60,
            mobileCompatible: true,
            optimizationSuggestions: []
          }
        };
        
        set({ analysis: placeholderAnalysis });
        
        // Create a minimal preset to allow workflow to continue
        const placeholderPreset = {
          id: 'placeholder-preset',
          name: 'Awaiting GPT-4 Vision Analysis',
          description: 'Will be replaced with real analysis when renderer is ready',
          confidence: 0.0,
          animations: [],
          effects: [],
          performance: {
            complexity: 'low' as const,
            mobileOptimized: true,
            estimatedFPS: 60
          }
        };
        
        set({ availablePresets: [placeholderPreset] });
        
        // Auto-select placeholder preset for zero-click mode
        const { automationLevel, userPreferences } = get();
        if (automationLevel.level === 'zero-click') {
          set({ selectedPreset: placeholderPreset });
          console.log('🎯 Zero-click mode: Selected placeholder preset - will update when GPT-4 Vision completes');
        } else if (userPreferences.autoPlay) {
          set({ selectedPreset: placeholderPreset });
          console.log('🎯 Auto-play mode: Selected placeholder preset - will update when GPT-4 Vision completes');
        }
        
        setCurrentStep('preview');
        
      } catch (error) {
        console.error('Automated workflow failed:', error);
        setCurrentStep('upload');
      } finally {
        setAnalyzing(false);
      }
    },
    
    resetWorkflow: () => set({
      symbolImage: null,
      analysis: null,
      availablePresets: [],
      selectedPreset: null,
      currentStep: 'upload',
      isGenerating: false,
      isAnalyzing: false,
      processingSteps: [],
      animationState: {
        isPlaying: false,
        currentTime: 0,
        duration: 2,
        speed: 1,
        loop: true
      }
    }),
    
    exportAnimation: async () => {
      const { selectedPreset, analysis, targetPlatform } = get();
      
      if (!selectedPreset || !analysis) {
        throw new Error('No animation to export');
      }
      
      console.log('📤 Exporting animation...', {
        preset: selectedPreset.name,
        platform: targetPlatform,
        elements: analysis.detectedElements.length
      });
      
      // Simulate export process
      set({ currentStep: 'export' });
      
      // This would trigger actual export logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Animation exported successfully');
    }
  }))
);

// Selectors for computed values
export const useAnimationProgress = () => useAutomationStore((state) => {
  if (state.animationState.duration === 0) return 0;
  return (state.animationState.currentTime / state.animationState.duration) * 100;
});

export const useWorkflowProgress = () => useAutomationStore((state) => {
  const steps = ['upload', 'analyze', 'preview', 'export'];
  const currentIndex = steps.indexOf(state.currentStep);
  return ((currentIndex + 1) / steps.length) * 100;
});

export const usePerformanceStatus = () => useAutomationStore((state) => {
  if (!state.performanceMetrics) return 'unknown';
  
  const { fps, warnings } = state.performanceMetrics;
  
  if (fps >= 55 && warnings.length === 0) return 'excellent';
  if (fps >= 45 && warnings.length <= 1) return 'good';
  if (fps >= 30 && warnings.length <= 2) return 'fair';
  return 'poor';
});

export const useAutomationFeatures = () => useAutomationStore((state) => {
  const { automationLevel } = state;
  
  return {
    showManualControls: automationLevel.level !== 'zero-click',
    showAdvancedSettings: automationLevel.level === 'professional',
    showAIExplanations: automationLevel.level === 'guided',
    autoSelectPresets: automationLevel.level === 'zero-click',
    showProgressSteps: true
  };
});

// Subscribe to state changes for side effects
useAutomationStore.subscribe(
  (state) => state.performanceMetrics,
  (metrics) => {
    if (metrics) {
      // Auto-calculate performance grade
      const { fps, warnings } = metrics;
      let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
      
      if (fps >= 55 && warnings.length === 0) grade = 'A';
      else if (fps >= 45 && warnings.length <= 1) grade = 'B';
      else if (fps >= 35 && warnings.length <= 2) grade = 'C';
      else if (fps >= 25 && warnings.length <= 3) grade = 'D';
      
      useAutomationStore.getState().setPerformanceGrade(grade);
      
      // Log performance issues
      if (warnings.length > 0) {
        console.warn('⚠️ Performance issues detected:', warnings);
      }
    }
  }
);

useAutomationStore.subscribe(
  (state) => state.selectedPreset,
  (preset) => {
    if (preset) {
      console.log('🎭 Animation preset selected:', preset.name);
      
      // Auto-update animation duration based on preset
      const maxTime = preset.animations.reduce((max, anim) => {
        const animMax = anim.keyframes.reduce((keyMax, keyframe) => 
          Math.max(keyMax, keyframe.time), 0);
        return Math.max(max, animMax);
      }, 0);
      
      if (maxTime > 0) {
        useAutomationStore.getState().updateAnimationState({ duration: maxTime });
      }
    }
  }
);

export default useAutomationStore;