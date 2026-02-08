/**
 * AI Analysis Validator for Animation Lab
 * Validates AI responses and provides confidence scoring
 */

import { ObjectClassificationResult, ComponentSegmentationResult, AnimationPotentialResult } from './GPTVisionClient';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '../core/ErrorHandler';

export interface ValidationResult {
  valid: boolean;
  confidence: number;
  errors: string[];
  warnings: string[];
  adjustedData?: any;
}

export interface ConfidenceFactors {
  responseStructure: number;
  dataConsistency: number;
  logicalCoherence: number;
  completeness: number;
}

export class AIAnalysisValidator {
  private errorHandler: ErrorHandler;
  private validObjectTypes = ['gem', 'weapon', 'character', 'organic', 'mechanical', 'unknown'];
  private validAnimationTypes = [
    'rotation', 'scale', 'pulse', 'bounce', 'swing', 'glow', 
    'particle', 'morph', 'float', 'spin', 'wobble', 'flash'
  ];
  private validComplexityLevels = ['simple', 'medium', 'complex'];
  private validFeasibilityLevels = ['high', 'medium', 'low'];

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  /**
   * Validate object classification result
   */
  validateClassification(result: ObjectClassificationResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    // Validate object type
    if (!this.validObjectTypes.includes(result.objectType)) {
      errors.push(`Invalid object type: ${result.objectType}`);
      confidence *= 0.3;
    }

    // Validate confidence score
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      errors.push(`Invalid confidence score: ${result.confidence}`);
      confidence *= 0.5;
    }

    // Validate reasoning
    if (!result.reasoning || typeof result.reasoning !== 'string' || result.reasoning.length < 10) {
      warnings.push('Reasoning is too brief or missing');
      confidence *= 0.9;
    }

    // Validate characteristics
    if (!Array.isArray(result.characteristics) || result.characteristics.length === 0) {
      warnings.push('No characteristics provided');
      confidence *= 0.9;
    }

    // Validate suggested animations
    if (!Array.isArray(result.suggestedAnimations)) {
      warnings.push('No suggested animations provided');
      confidence *= 0.9;
    } else {
      const invalidAnimations = result.suggestedAnimations.filter(
        anim => !this.validAnimationTypes.includes(anim)
      );
      if (invalidAnimations.length > 0) {
        warnings.push(`Unknown animation types: ${invalidAnimations.join(', ')}`);
        confidence *= 0.95;
      }
    }

    // Check logical consistency
    const consistencyScore = this.checkClassificationConsistency(result);
    confidence *= consistencyScore;

    return {
      valid: errors.length === 0,
      confidence: Math.max(0, Math.min(1, confidence * result.confidence)),
      errors,
      warnings,
      adjustedData: this.adjustClassificationData(result)
    };
  }

  /**
   * Validate component segmentation result
   */
  validateComponentSegmentation(result: ComponentSegmentationResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    // Validate components array
    if (!Array.isArray(result.components)) {
      errors.push('Components must be an array');
      confidence *= 0.3;
    } else {
      // Validate each component
      result.components.forEach((comp, index) => {
        const compValidation = this.validateComponent(comp, index);
        errors.push(...compValidation.errors);
        warnings.push(...compValidation.warnings);
        confidence *= compValidation.confidence;
      });
    }

    // Validate complexity
    if (!this.validComplexityLevels.includes(result.complexity)) {
      errors.push(`Invalid complexity level: ${result.complexity}`);
      confidence *= 0.8;
    }

    // Validate separation suggestions
    if (!Array.isArray(result.separationSuggestions)) {
      warnings.push('No separation suggestions provided');
      confidence *= 0.9;
    }

    return {
      valid: errors.length === 0,
      confidence: Math.max(0, Math.min(1, confidence)),
      errors,
      warnings,
      adjustedData: this.adjustComponentData(result)
    };
  }

  /**
   * Validate animation potential result
   */
  validateAnimationPotential(result: AnimationPotentialResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    // Validate animations array
    if (!Array.isArray(result.animations)) {
      errors.push('Animations must be an array');
      confidence *= 0.3;
    } else {
      // Validate each animation
      result.animations.forEach((anim, index) => {
        const animValidation = this.validateAnimation(anim, index);
        errors.push(...animValidation.errors);
        warnings.push(...animValidation.warnings);
        confidence *= animValidation.confidence;
      });
    }

    // Validate overall score
    if (typeof result.overallScore !== 'number' || result.overallScore < 0 || result.overallScore > 1) {
      errors.push(`Invalid overall score: ${result.overallScore}`);
      confidence *= 0.7;
    }

    // Validate recommendations
    if (!Array.isArray(result.recommendations)) {
      warnings.push('No recommendations provided');
      confidence *= 0.9;
    }

    return {
      valid: errors.length === 0,
      confidence: Math.max(0, Math.min(1, confidence * result.overallScore)),
      errors,
      warnings,
      adjustedData: this.adjustAnimationData(result)
    };
  }

  /**
   * Calculate confidence factors for detailed analysis
   */
  calculateConfidenceFactors(result: any): ConfidenceFactors {
    const factors: ConfidenceFactors = {
      responseStructure: 1.0,
      dataConsistency: 1.0,
      logicalCoherence: 1.0,
      completeness: 1.0
    };

    // Response structure validation
    if (!result || typeof result !== 'object') {
      factors.responseStructure = 0.1;
    } else {
      const requiredFields = this.getRequiredFields(result);
      const missingFields = requiredFields.filter(field => !result[field]);
      factors.responseStructure = Math.max(0.1, 1 - (missingFields.length / requiredFields.length));
    }

    // Data consistency validation
    factors.dataConsistency = this.checkDataConsistency(result);

    // Logical coherence validation
    factors.logicalCoherence = this.checkLogicalCoherence(result);

    // Completeness validation
    factors.completeness = this.checkCompleteness(result);

    return factors;
  }

  /**
   * Validate individual component
   */
  private validateComponent(comp: any, index: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    // Validate name
    if (!comp.name || typeof comp.name !== 'string') {
      errors.push(`Component ${index}: Missing or invalid name`);
      confidence *= 0.7;
    }

    // Validate description
    if (!comp.description || typeof comp.description !== 'string') {
      warnings.push(`Component ${index}: Missing description`);
      confidence *= 0.9;
    }

    // Validate bounds
    if (!comp.bounds || typeof comp.bounds !== 'object') {
      errors.push(`Component ${index}: Missing bounds`);
      confidence *= 0.5;
    } else {
      const requiredBounds = ['x', 'y', 'width', 'height'];
      const missingBounds = requiredBounds.filter(prop => typeof comp.bounds[prop] !== 'number');
      if (missingBounds.length > 0) {
        errors.push(`Component ${index}: Invalid bounds - missing ${missingBounds.join(', ')}`);
        confidence *= 0.6;
      }
    }

    // Validate separable
    if (typeof comp.separable !== 'boolean') {
      warnings.push(`Component ${index}: Missing or invalid separable flag`);
      confidence *= 0.95;
    }

    // Validate animation potential
    if (!Array.isArray(comp.animationPotential)) {
      warnings.push(`Component ${index}: Missing animation potential`);
      confidence *= 0.9;
    }

    return { valid: errors.length === 0, confidence, errors, warnings };
  }

  /**
   * Validate individual animation
   */
  private validateAnimation(anim: any, index: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    // Validate type
    if (!anim.type || !this.validAnimationTypes.includes(anim.type)) {
      errors.push(`Animation ${index}: Invalid type ${anim.type}`);
      confidence *= 0.7;
    }

    // Validate feasibility
    if (!anim.feasibility || !this.validFeasibilityLevels.includes(anim.feasibility)) {
      errors.push(`Animation ${index}: Invalid feasibility ${anim.feasibility}`);
      confidence *= 0.8;
    }

    // Validate confidence
    if (typeof anim.confidence !== 'number' || anim.confidence < 0 || anim.confidence > 1) {
      errors.push(`Animation ${index}: Invalid confidence ${anim.confidence}`);
      confidence *= 0.6;
    }

    // Validate description
    if (!anim.description || typeof anim.description !== 'string') {
      warnings.push(`Animation ${index}: Missing description`);
      confidence *= 0.9;
    }

    // Validate requirements
    if (!Array.isArray(anim.requirements)) {
      warnings.push(`Animation ${index}: Missing requirements`);
      confidence *= 0.95;
    }

    // Validate estimated frames
    if (anim.estimatedFrames && (typeof anim.estimatedFrames !== 'number' || anim.estimatedFrames < 1)) {
      warnings.push(`Animation ${index}: Invalid estimated frames`);
      confidence *= 0.95;
    }

    return { valid: errors.length === 0, confidence, errors, warnings };
  }

  /**
   * Check classification consistency
   */
  private checkClassificationConsistency(result: ObjectClassificationResult): number {
    let score = 1.0;

    // Check if suggested animations match object type
    const typeAnimationMap: Record<string, string[]> = {
      gem: ['rotation', 'pulse', 'glow', 'scale'],
      weapon: ['swing', 'rotation', 'glow', 'spin'],
      character: ['bounce', 'float', 'particle', 'scale'],
      organic: ['morph', 'float', 'pulse', 'particle'],
      mechanical: ['rotation', 'spin', 'glow', 'scale']
    };

    const expectedAnimations = typeAnimationMap[result.objectType] || [];
    const matchingAnimations = result.suggestedAnimations.filter(anim => 
      expectedAnimations.includes(anim)
    );

    if (expectedAnimations.length > 0) {
      score *= 0.7 + (0.3 * matchingAnimations.length / expectedAnimations.length);
    }

    return score;
  }

  /**
   * Adjust classification data to fix common issues
   */
  private adjustClassificationData(result: ObjectClassificationResult): ObjectClassificationResult {
    const adjusted = { ...result };

    // Ensure object type is valid
    if (!this.validObjectTypes.includes(adjusted.objectType)) {
      adjusted.objectType = 'unknown';
    }

    // Clamp confidence
    adjusted.confidence = Math.max(0, Math.min(1, adjusted.confidence));

    // Filter invalid animations
    adjusted.suggestedAnimations = adjusted.suggestedAnimations.filter(anim =>
      this.validAnimationTypes.includes(anim)
    );

    return adjusted;
  }

  /**
   * Adjust component data
   */
  private adjustComponentData(result: ComponentSegmentationResult): ComponentSegmentationResult {
    const adjusted = { ...result };

    // Ensure complexity is valid
    if (!this.validComplexityLevels.includes(adjusted.complexity)) {
      adjusted.complexity = 'medium';
    }

    // Fix component bounds
    adjusted.components = adjusted.components.map(comp => ({
      ...comp,
      bounds: {
        x: Math.max(0, comp.bounds?.x || 0),
        y: Math.max(0, comp.bounds?.y || 0),
        width: Math.max(1, comp.bounds?.width || 1),
        height: Math.max(1, comp.bounds?.height || 1)
      }
    }));

    return adjusted;
  }

  /**
   * Adjust animation data
   */
  private adjustAnimationData(result: AnimationPotentialResult): AnimationPotentialResult {
    const adjusted = { ...result };

    // Clamp overall score
    adjusted.overallScore = Math.max(0, Math.min(1, adjusted.overallScore));

    // Fix animations
    adjusted.animations = adjusted.animations
      .filter(anim => this.validAnimationTypes.includes(anim.type))
      .map(anim => ({
        ...anim,
        confidence: Math.max(0, Math.min(1, anim.confidence)),
        feasibility: this.validFeasibilityLevels.includes(anim.feasibility) 
          ? anim.feasibility 
          : 'medium'
      }));

    return adjusted;
  }

  /**
   * Get required fields for different result types
   */
  private getRequiredFields(result: any): string[] {
    if (result.objectType !== undefined) {
      return ['objectType', 'confidence', 'reasoning'];
    } else if (result.components !== undefined) {
      return ['components', 'complexity'];
    } else if (result.animations !== undefined) {
      return ['animations', 'overallScore'];
    }
    return [];
  }

  /**
   * Check data consistency
   */
  private checkDataConsistency(result: any): number {
    // Placeholder for consistency checks
    return 1.0;
  }

  /**
   * Check logical coherence
   */
  private checkLogicalCoherence(result: any): number {
    // Placeholder for coherence checks
    return 1.0;
  }

  /**
   * Check completeness
   */
  private checkCompleteness(result: any): number {
    let score = 1.0;
    
    if (result.objectType !== undefined) {
      // Classification completeness
      if (!result.characteristics || result.characteristics.length === 0) score *= 0.9;
      if (!result.suggestedAnimations || result.suggestedAnimations.length === 0) score *= 0.9;
    }
    
    return score;
  }
}