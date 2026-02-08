/**
 * AI-Powered Image Analyzer for Animation Lab
 * Integrates GPT-Vision-1 with the existing image analysis pipeline
 */

import { ImageAnalyzer, ImageAnalysisResult, AnimationPotential, ComponentAnalysis, ImageMetadata } from '../core/ImageAnalyzer';
import { GPTVisionClient, ObjectClassificationResult, ComponentSegmentationResult, AnimationPotentialResult } from './GPTVisionClient';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '../core/ErrorHandler';

export interface AIAnalysisConfig {
  useAI: boolean;
  fallbackToHeuristic: boolean;
  confidenceThreshold: number;
  enableComponentAnalysis: boolean;
  enableAnimationAssessment: boolean;
  cacheResults: boolean;
}

export interface AIAnalysisResult extends ImageAnalysisResult {
  aiAnalysis?: {
    classification: ObjectClassificationResult;
    components?: ComponentSegmentationResult;
    animationAssessment?: AnimationPotentialResult;
    processingTime: number;
    usedAI: boolean;
  };
}

export class AIImageAnalyzer extends ImageAnalyzer {
  private gptVisionClient: GPTVisionClient | null = null;
  private config: AIAnalysisConfig;
  private errorHandler: ErrorHandler;
  private analysisCache: Map<string, AIAnalysisResult> = new Map();

  constructor(apiKey?: string, config: Partial<AIAnalysisConfig> = {}) {
    super();
    
    this.config = {
      useAI: !!apiKey,
      fallbackToHeuristic: true,
      confidenceThreshold: 0.7,
      enableComponentAnalysis: true,
      enableAnimationAssessment: true,
      cacheResults: true,
      ...config
    };

    this.errorHandler = ErrorHandler.getInstance();

    if (apiKey && this.config.useAI) {
      this.gptVisionClient = new GPTVisionClient({
        apiKey,
        maxRetries: 3,
        timeout: 30000
      });
    }
  }

  /**
   * Enhanced analyze image with AI integration
   */
  async analyzeImage(
    imageSource: HTMLImageElement | ImageData | HTMLCanvasElement,
    assetId: string
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    let usedAI = false;

    try {
      // Check cache first
      if (this.config.cacheResults && this.analysisCache.has(assetId)) {
        const cached = this.analysisCache.get(assetId)!;
        console.log(`Using cached analysis for ${assetId}`);
        return cached;
      }

      // Get base analysis from parent class
      const baseAnalysis = await super.analyzeImage(imageSource, assetId);
      
      // Create enhanced result
      const enhancedResult: AIAnalysisResult = {
        ...baseAnalysis,
        aiAnalysis: undefined
      };

      // Use AI analysis if available and enabled
      if (this.gptVisionClient && this.config.useAI) {
        try {
          const imageData = await this.convertToBase64(imageSource);
          const aiAnalysis = await this.performAIAnalysis(imageData, baseAnalysis);
          
          enhancedResult.aiAnalysis = {
            ...aiAnalysis,
            processingTime: Date.now() - startTime,
            usedAI: true
          };

          // Override base analysis with AI results if confidence is high enough
          if (aiAnalysis.classification.confidence >= this.config.confidenceThreshold) {
            enhancedResult.objectType = aiAnalysis.classification.objectType;
            enhancedResult.confidence = aiAnalysis.classification.confidence;
            
            // Update animation potential with AI suggestions
            if (aiAnalysis.animationAssessment) {
              enhancedResult.animationPotential = this.convertAIAnimationPotential(
                aiAnalysis.animationAssessment
              );
            }

            // Update components with AI analysis
            if (aiAnalysis.components && this.config.enableComponentAnalysis) {
              enhancedResult.components = this.convertAIComponents(aiAnalysis.components);
            }
          }

          usedAI = true;
          console.log(`AI analysis completed for ${assetId} in ${Date.now() - startTime}ms`);
          
        } catch (aiError) {
          console.warn(`AI analysis failed for ${assetId}, using heuristic fallback:`, aiError);
          
          if (!this.config.fallbackToHeuristic) {
            throw aiError;
          }
          
          // Add fallback indicator
          enhancedResult.aiAnalysis = {
            classification: {
              objectType: 'unknown',
              confidence: 0,
              reasoning: 'AI analysis failed, using heuristic fallback',
              characteristics: [],
              suggestedAnimations: []
            },
            processingTime: Date.now() - startTime,
            usedAI: false
          };
        }
      }

      // Cache result if enabled
      if (this.config.cacheResults) {
        this.analysisCache.set(assetId, enhancedResult);
      }

      return enhancedResult;

    } catch (error) {
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.IMAGE_PROCESSING,
        ErrorSeverity.ERROR,
        { assetId, usedAI }
      );
      throw error;
    }
  }

  /**
   * Perform comprehensive AI analysis
   */
  private async performAIAnalysis(
    imageData: string,
    baseAnalysis: ImageAnalysisResult
  ): Promise<{
    classification: ObjectClassificationResult;
    components?: ComponentSegmentationResult;
    animationAssessment?: AnimationPotentialResult;
  }> {
    const results: any = {};

    // Step 1: Object Classification
    results.classification = await this.gptVisionClient!.classifyObject(imageData);

    // Step 2: Component Analysis (if enabled and confidence is high)
    if (this.config.enableComponentAnalysis && 
        results.classification.confidence >= this.config.confidenceThreshold) {
      try {
        results.components = await this.gptVisionClient!.analyzeComponents(imageData);
      } catch (error) {
        console.warn('Component analysis failed:', error);
      }
    }

    // Step 3: Animation Assessment (if enabled)
    if (this.config.enableAnimationAssessment && 
        results.classification.confidence >= this.config.confidenceThreshold) {
      try {
        results.animationAssessment = await this.gptVisionClient!.assessAnimationPotential(
          imageData,
          results.classification.objectType,
          results.components?.components || []
        );
      } catch (error) {
        console.warn('Animation assessment failed:', error);
      }
    }

    return results;
  }

  /**
   * Convert AI animation assessment to AnimationPotential format
   */
  private convertAIAnimationPotential(assessment: AnimationPotentialResult): AnimationPotential[] {
    return assessment.animations.map(anim => ({
      type: anim.type as any,
      confidence: anim.confidence,
      description: anim.description,
      requiredAssets: anim.requirements
    }));
  }

  /**
   * Convert AI components to ComponentAnalysis format
   */
  private convertAIComponents(segmentation: ComponentSegmentationResult): ComponentAnalysis[] {
    return segmentation.components.map(comp => ({
      name: comp.name,
      bounds: comp.bounds,
      type: 'primary' as any, // Simplified for now
      separable: comp.separable,
      description: comp.description
    }));
  }

  /**
   * Convert image source to base64
   */
  private async convertToBase64(
    source: HTMLImageElement | ImageData | HTMLCanvasElement
  ): Promise<string> {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    if (source instanceof HTMLCanvasElement) {
      canvas = source;
    } else {
      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d')!;

      if (source instanceof HTMLImageElement) {
        canvas.width = source.naturalWidth;
        canvas.height = source.naturalHeight;
        ctx.drawImage(source, 0, 0);
      } else if (source instanceof ImageData) {
        canvas.width = source.width;
        canvas.height = source.height;
        ctx.putImageData(source, 0, 0);
      }
    }

    // Convert to base64 (JPEG for smaller size)
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to convert image to blob'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.8);
    });
  }

  /**
   * Update AI configuration
   */
  updateConfig(newConfig: Partial<AIAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Set API key and enable AI
   */
  setAPIKey(apiKey: string): void {
    this.gptVisionClient = new GPTVisionClient({
      apiKey,
      maxRetries: 3,
      timeout: 30000
    });
    this.config.useAI = true;
  }

  /**
   * Disable AI analysis
   */
  disableAI(): void {
    this.config.useAI = false;
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    // Simplified stats for now
    return {
      size: this.analysisCache.size,
      maxSize: 100, // Could be configurable
      hitRate: 0 // Would need to track hits/misses
    };
  }

  /**
   * Get AI usage statistics
   */
  getAIStats(): {
    enabled: boolean;
    requestCount: number;
    lastRequestTime: Date | null;
    averageProcessingTime: number;
  } {
    const visionStats = this.gptVisionClient?.getUsageStats();
    
    return {
      enabled: this.config.useAI && !!this.gptVisionClient,
      requestCount: visionStats?.requestCount || 0,
      lastRequestTime: visionStats?.lastRequestTime || null,
      averageProcessingTime: 0 // Would need to track this
    };
  }

  /**
   * Validate AI analysis result
   */
  private validateAIResult(result: any): boolean {
    // Basic validation of AI response structure
    return !!(
      result &&
      typeof result === 'object' &&
      result.classification &&
      typeof result.classification.objectType === 'string' &&
      typeof result.classification.confidence === 'number'
    );
  }

  /**
   * Test AI connection
   */
  async testAIConnection(): Promise<boolean> {
    if (!this.gptVisionClient || !this.config.useAI) {
      return false;
    }

    try {
      // Create a small test image
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 100, 100);
      
      const testImageData = await this.convertToBase64(canvas);
      await this.gptVisionClient.classifyObject(testImageData);
      
      return true;
    } catch (error) {
      console.warn('AI connection test failed:', error);
      return false;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    super.destroy();
    this.clearCache();
    this.gptVisionClient = null;
  }
}