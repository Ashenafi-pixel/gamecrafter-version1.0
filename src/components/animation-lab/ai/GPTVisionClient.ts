/**
 * GPT-Vision-1 Client for Animation Lab
 * Handles AI-powered image analysis and classification
 */

import { ErrorHandler, ErrorCategory, ErrorSeverity } from '../core/ErrorHandler';

export interface GPTVisionConfig {
  apiKey: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
  model?: string;
}

export interface ImageAnalysisPrompt {
  systemPrompt: string;
  userPrompt: string;
  imageData: string; // Base64 encoded image
  maxTokens?: number;
  temperature?: number;
}

export interface GPTVisionResponse {
  success: boolean;
  data?: any;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  confidence?: number;
}

export interface ObjectClassificationResult {
  objectType: 'gem' | 'weapon' | 'character' | 'organic' | 'mechanical' | 'unknown';
  confidence: number;
  reasoning: string;
  characteristics: string[];
  suggestedAnimations: string[];
}

export interface ComponentSegmentationResult {
  components: Array<{
    name: string;
    description: string;
    bounds: { x: number; y: number; width: number; height: number };
    separable: boolean;
    animationPotential: string[];
  }>;
  complexity: 'simple' | 'medium' | 'complex';
  separationSuggestions: string[];
}

export interface AnimationPotentialResult {
  animations: Array<{
    type: string;
    feasibility: 'high' | 'medium' | 'low';
    confidence: number;
    description: string;
    requirements: string[];
    estimatedFrames?: number;
  }>;
  overallScore: number;
  recommendations: string[];
}

export class GPTVisionClient {
  private config: GPTVisionConfig;
  private errorHandler: ErrorHandler;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private rateLimitDelay: number = 1000; // 1 second between requests

  constructor(config: GPTVisionConfig) {
    this.config = {
      baseURL: 'https://api.openai.com/v1',
      maxRetries: 3,
      timeout: 30000,
      model: 'gpt-4o',
      ...config
    };
    this.errorHandler = ErrorHandler.getInstance();
  }

  /**
   * Classify object type using GPT-Vision-1
   */
  async classifyObject(imageData: string): Promise<ObjectClassificationResult> {
    const prompt: ImageAnalysisPrompt = {
      systemPrompt: this.getClassificationSystemPrompt(),
      userPrompt: this.getClassificationUserPrompt(),
      imageData,
      maxTokens: 500,
      temperature: 0.1
    };

    try {
      const response = await this.makeVisionRequest(prompt);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to classify object');
      }

      return this.parseClassificationResponse(response.data);
    } catch (error) {
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.NETWORK,
        ErrorSeverity.ERROR,
        { operation: 'classifyObject' }
      );
      throw error;
    }
  }

  /**
   * Analyze components for segmentation
   */
  async analyzeComponents(imageData: string): Promise<ComponentSegmentationResult> {
    const prompt: ImageAnalysisPrompt = {
      systemPrompt: this.getComponentSystemPrompt(),
      userPrompt: this.getComponentUserPrompt(),
      imageData,
      maxTokens: 800,
      temperature: 0.2
    };

    try {
      const response = await this.makeVisionRequest(prompt);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to analyze components');
      }

      return this.parseComponentResponse(response.data);
    } catch (error) {
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.NETWORK,
        ErrorSeverity.ERROR,
        { operation: 'analyzeComponents' }
      );
      throw error;
    }
  }

  /**
   * Assess animation potential
   */
  async assessAnimationPotential(
    imageData: string,
    objectType: string,
    components: any[]
  ): Promise<AnimationPotentialResult> {
    const prompt: ImageAnalysisPrompt = {
      systemPrompt: this.getAnimationSystemPrompt(),
      userPrompt: this.getAnimationUserPrompt(objectType, components),
      imageData,
      maxTokens: 1000,
      temperature: 0.3
    };

    try {
      const response = await this.makeVisionRequest(prompt);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to assess animation potential');
      }

      return this.parseAnimationResponse(response.data);
    } catch (error) {
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.NETWORK,
        ErrorSeverity.ERROR,
        { operation: 'assessAnimationPotential' }
      );
      throw error;
    }
  }

  /**
   * Make vision API request with retries and rate limiting
   */
  private async makeVisionRequest(prompt: ImageAnalysisPrompt): Promise<GPTVisionResponse> {
    await this.enforceRateLimit();
    
    for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
      try {
        const response = await this.makeRequest(prompt);
        this.requestCount++;
        return response;
      } catch (error) {
        console.warn(`GPT Vision request attempt ${attempt} failed:`, error);
        
        if (attempt === this.config.maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Make actual API request
   */
  private async makeRequest(prompt: ImageAnalysisPrompt): Promise<GPTVisionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: prompt.systemPrompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt.userPrompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${prompt.imageData}`
                  }
                }
              ]
            }
          ],
          max_tokens: prompt.maxTokens || 500,
          temperature: prompt.temperature || 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.choices[0]?.message?.content,
        usage: data.usage
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // System prompts for different analysis types

  private getClassificationSystemPrompt(): string {
    return `You are an expert image analyzer for game asset classification. Your task is to provide PRECISE, SPECIFIC classification of uploaded images for animation purposes.

Be as specific as possible. Don't use generic categories - identify the exact object type.

Specific Object Categories:
VESSELS & CONTAINERS:
- chalice: Holy grail, ceremonial cups, goblets
- cup: Drinking vessels, mugs, tankards
- bottle: Potions, wine bottles, flasks
- jar: Storage containers, urns, vases

PRECIOUS ITEMS:
- gem: Cut gemstones, crystals, precious stones
- jewelry: Rings, necklaces, bracelets, crowns
- coin: Gold coins, currency, medallions
- treasure: Treasure chests, gold piles, artifacts

WEAPONS:
- sword: Blades, sabers, katanas
- axe: Battle axes, war hammers
- bow: Bows, crossbows, arrows
- staff: Magical staffs, wands, scepters
- shield: Protective gear, armor pieces

CHARACTERS:
- human: People, warriors, royalty
- creature: Monsters, dragons, mythical beings
- animal: Natural animals, pets

NATURE:
- plant: Trees, flowers, herbs
- food: Fruits, vegetables, prepared food
- element: Fire, water, lightning effects

OBJECTS:
- book: Scrolls, tomes, manuscripts
- key: Keys, locks, mechanisms
- tool: Hammers, pickaxes, instruments
- symbol: Religious symbols, runes, emblems

FALLBACK:
- unknown: Only if truly unidentifiable

Analyze the image and provide your response in this exact JSON format:
{
  "objectType": "specific_object_name",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation of why this specific classification",
  "characteristics": ["precise visual features that led to this classification"],
  "suggestedAnimations": ["animation types suitable for this specific object"]
}

IMPORTANT: Be SPECIFIC. Instead of "gem" say "ruby" or "diamond". Instead of "weapon" say "sword" or "axe". Instead of "cup" say "chalice" if it's ceremonial/religious.`;
  }

  private getClassificationUserPrompt(): string {
    return `Analyze this image and identify the PRIMARY object or character. Focus on the COMPLETE subject, not just individual components.

CLASSIFICATION PRIORITY:
1. If there's a PERSON/CHARACTER → classify as the character type (knight, warrior, king, etc.)
2. If there's a complete SCENE → describe the main subject
3. Only focus on individual objects if there's no character present

For CHARACTERS, describe:
- Character type (knight, warrior, king, wizard, etc.)
- Key attributes (armored, crowned, weapon-wielding)
- Overall appearance and role

For OBJECTS, be specific:
- Instead of "gem" → "emerald", "ruby", "diamond"  
- Instead of "weapon" → "medieval sword", "battle axe"
- Instead of "cup" → "chalice", "goblet", "tankard"

IMPORTANT: Look at the ENTIRE image composition. If you see a knight with a crown and sword, classify it as "armored knight" or "crowned warrior", NOT just "crown" or "sword".

Examples:
- Knight with crown + sword = "crowned knight" or "royal warrior"
- Wizard with staff = "wizard" or "mage"  
- Warrior with axe = "battle warrior" or "viking"
- Princess with tiara = "royal princess" or "crowned maiden"

Provide only the JSON response focusing on the PRIMARY subject of the image.`;
  }

  private getComponentSystemPrompt(): string {
    return `You are an expert in image segmentation for animation purposes. Analyze images to identify separable components that can be animated independently.

Consider:
- Visual boundaries between different parts
- Color/texture differences
- Functional separation (handle vs blade, gem vs setting)
- Animation potential of each component
- Complexity of separation

Provide response in this JSON format:
{
  "components": [
    {
      "name": "component_name",
      "description": "what this component is",
      "bounds": {"x": 0, "y": 0, "width": 100, "height": 100},
      "separable": true/false,
      "animationPotential": ["possible animations"]
    }
  ],
  "complexity": "simple/medium/complex",
  "separationSuggestions": ["how to separate components"]
}`;
  }

  private getComponentUserPrompt(): string {
    return `Analyze this image for component segmentation. Identify:
1. Distinct visual components
2. Boundaries between parts
3. Which parts could be separated for animation
4. Estimated pixel bounds for each component

Focus on parts that could move independently. Provide only JSON response.`;
  }

  private getAnimationSystemPrompt(): string {
    return `You are an animation expert for slot games. Assess the animation potential of objects based on their visual characteristics and component structure.

Animation types to consider:
- rotation: Full 360° spinning
- scale: Growing/shrinking
- pulse: Rhythmic scaling with glow
- bounce: Elastic movement
- swing: Pendulum-like motion
- glow: Light emission effects
- particle: Surrounding particle effects
- morph: Shape transformation
- float: Gentle up/down movement

Provide response in this JSON format:
{
  "animations": [
    {
      "type": "animation_name",
      "feasibility": "high/medium/low",
      "confidence": 0.0-1.0,
      "description": "how this animation would work",
      "requirements": ["what's needed to implement"],
      "estimatedFrames": 8
    }
  ],
  "overallScore": 0.0-1.0,
  "recommendations": ["prioritized animation suggestions"]
}`;
  }

  private getAnimationUserPrompt(objectType: string, components: any[]): string {
    return `Assess animation potential for this ${objectType} with ${components.length} identified components.

Consider:
1. Object shape and structure
2. Visual appeal in slot game context
3. Technical feasibility
4. Component separation possibilities
5. Industry-standard slot animations

Provide only JSON response with practical animation recommendations.`;
  }

  // Response parsers

  private parseClassificationResponse(content: string): ObjectClassificationResult {
    try {
      const parsed = JSON.parse(this.extractJSON(content));
      return {
        objectType: parsed.objectType || 'unknown',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        reasoning: parsed.reasoning || '',
        characteristics: Array.isArray(parsed.characteristics) ? parsed.characteristics : [],
        suggestedAnimations: Array.isArray(parsed.suggestedAnimations) ? parsed.suggestedAnimations : []
      };
    } catch (error) {
      throw new Error(`Failed to parse classification response: ${error}`);
    }
  }

  private parseComponentResponse(content: string): ComponentSegmentationResult {
    try {
      const parsed = JSON.parse(this.extractJSON(content));
      return {
        components: Array.isArray(parsed.components) ? parsed.components : [],
        complexity: parsed.complexity || 'medium',
        separationSuggestions: Array.isArray(parsed.separationSuggestions) ? parsed.separationSuggestions : []
      };
    } catch (error) {
      throw new Error(`Failed to parse component response: ${error}`);
    }
  }

  private parseAnimationResponse(content: string): AnimationPotentialResult {
    try {
      const parsed = JSON.parse(this.extractJSON(content));
      return {
        animations: Array.isArray(parsed.animations) ? parsed.animations : [],
        overallScore: Math.max(0, Math.min(1, parsed.overallScore || 0)),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
      };
    } catch (error) {
      throw new Error(`Failed to parse animation response: ${error}`);
    }
  }

  // Utility methods

  private extractJSON(content: string): string {
    // Extract JSON from markdown code blocks or plain text
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                     content.match(/(\{[\s\S]*\})/);
    
    if (jsonMatch) {
      return jsonMatch[1];
    }
    
    throw new Error('No valid JSON found in response');
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await this.delay(this.rateLimitDelay - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    requestCount: number;
    lastRequestTime: Date | null;
    rateLimitDelay: number;
  } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime > 0 ? new Date(this.lastRequestTime) : null,
      rateLimitDelay: this.rateLimitDelay
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GPTVisionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}