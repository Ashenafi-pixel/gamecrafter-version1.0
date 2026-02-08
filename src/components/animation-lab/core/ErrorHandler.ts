/**
 * Error Handling and Validation System for Animation Lab
 * Provides comprehensive error management, logging, and user-friendly error messages
 */

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  ASSET_LOADING = 'asset_loading',
  IMAGE_PROCESSING = 'image_processing',
  SPRITE_MANAGEMENT = 'sprite_management',
  ANIMATION_ENGINE = 'animation_engine',
  FILE_SYSTEM = 'file_system',
  VALIDATION = 'validation',
  PERFORMANCE = 'performance',
  NETWORK = 'network',
  USER_INPUT = 'user_input',
  UNKNOWN = 'unknown'
}

export interface AnimationLabError {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  details?: string;
  stack?: string;
  context?: Record<string, any>;
  userMessage: string;
  recoverable: boolean;
  suggestions?: string[];
}

export interface ValidationRule {
  name: string;
  validate: (value: any) => ValidationResult;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: Map<string, AnimationLabError> = new Map();
  private errorListeners: Array<(error: AnimationLabError) => void> = [];
  private maxErrorHistory = 100;

  private constructor() {
    // Setup global error handling
    this.setupGlobalErrorHandling();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error with full context
   */
  handleError(
    error: Error | string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: Record<string, any>
  ): AnimationLabError {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const animationLabError: AnimationLabError = {
      id: errorId,
      timestamp: new Date(),
      severity,
      category,
      message: error instanceof Error ? error.message : error,
      details: error instanceof Error ? error.stack : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      userMessage: this.generateUserMessage(category, error instanceof Error ? error.message : error),
      recoverable: this.isRecoverable(category, severity),
      suggestions: this.generateSuggestions(category, error instanceof Error ? error.message : error)
    };

    // Store error
    this.errors.set(errorId, animationLabError);
    this.trimErrorHistory();

    // Log to console
    this.logError(animationLabError);

    // Notify listeners
    this.notifyListeners(animationLabError);

    return animationLabError;
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: File): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`);
    }

    // File type validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type '${file.type}' is not supported. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // File name validation
    if (file.name.length > 255) {
      errors.push('File name is too long (maximum 255 characters)');
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      warnings.push('File name contains special characters that may cause issues');
    }

    // Performance warnings
    if (file.size > 5 * 1024 * 1024) {
      warnings.push('Large files may impact performance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate sprite configuration
   */
  validateSpriteConfig(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!config.id) errors.push('Sprite ID is required');
    if (!config.assetId) errors.push('Asset ID is required');

    // Position validation
    if (config.position) {
      if (typeof config.position.x !== 'number' || isNaN(config.position.x)) {
        errors.push('Position X must be a valid number');
      }
      if (typeof config.position.y !== 'number' || isNaN(config.position.y)) {
        errors.push('Position Y must be a valid number');
      }
    }

    // Scale validation
    if (config.scale) {
      if (typeof config.scale.x !== 'number' || config.scale.x <= 0) {
        errors.push('Scale X must be a positive number');
      }
      if (typeof config.scale.y !== 'number' || config.scale.y <= 0) {
        errors.push('Scale Y must be a positive number');
      }
      
      if (config.scale.x > 10 || config.scale.y > 10) {
        warnings.push('Very large scale values may impact performance');
      }
    }

    // Alpha validation
    if (config.alpha !== undefined) {
      if (typeof config.alpha !== 'number' || config.alpha < 0 || config.alpha > 1) {
        errors.push('Alpha must be a number between 0 and 1');
      }
    }

    // Rotation validation
    if (config.rotation !== undefined) {
      if (typeof config.rotation !== 'number' || isNaN(config.rotation)) {
        errors.push('Rotation must be a valid number');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate image dimensions
   */
  validateImageDimensions(width: number, height: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Minimum dimensions
    if (width < 1 || height < 1) {
      errors.push('Image dimensions must be at least 1x1 pixels');
    }

    // Maximum dimensions
    const maxDimension = 4096;
    if (width > maxDimension || height > maxDimension) {
      errors.push(`Image dimensions exceed maximum allowed size of ${maxDimension}x${maxDimension}`);
    }

    // Performance warnings
    const totalPixels = width * height;
    if (totalPixels > 2048 * 2048) {
      warnings.push('Large images may impact performance');
    }

    // Aspect ratio warnings
    const aspectRatio = width / height;
    if (aspectRatio > 10 || aspectRatio < 0.1) {
      warnings.push('Extreme aspect ratios may cause layout issues');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate canvas size
   */
  validateCanvasSize(width: number, height: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Minimum size
    if (width < 100 || height < 100) {
      warnings.push('Very small canvas size may make editing difficult');
    }

    // Maximum size for performance
    if (width > 2048 || height > 2048) {
      warnings.push('Large canvas size may impact performance');
    }

    // WebGL limits
    const maxTextureSize = 2048; // Conservative estimate
    if (width > maxTextureSize || height > maxTextureSize) {
      errors.push(`Canvas size exceeds WebGL texture limit of ${maxTextureSize}x${maxTextureSize}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Add error listener
   */
  addErrorListener(listener: (error: AnimationLabError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  removeErrorListener(listener: (error: AnimationLabError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Get all errors
   */
  getAllErrors(): AnimationLabError[] {
    return Array.from(this.errors.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): AnimationLabError[] {
    return this.getAllErrors().filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): AnimationLabError[] {
    return this.getAllErrors().filter(error => error.severity === severity);
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors.clear();
  }

  /**
   * Clear errors by category
   */
  clearErrorsByCategory(category: ErrorCategory): void {
    this.errors.forEach((error, id) => {
      if (error.category === category) {
        this.errors.delete(id);
      }
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    recent: number; // Last hour
  } {
    const allErrors = this.getAllErrors();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const stats = {
      total: allErrors.length,
      bySeverity: {
        [ErrorSeverity.INFO]: 0,
        [ErrorSeverity.WARNING]: 0,
        [ErrorSeverity.ERROR]: 0,
        [ErrorSeverity.CRITICAL]: 0
      },
      byCategory: {
        [ErrorCategory.ASSET_LOADING]: 0,
        [ErrorCategory.IMAGE_PROCESSING]: 0,
        [ErrorCategory.SPRITE_MANAGEMENT]: 0,
        [ErrorCategory.ANIMATION_ENGINE]: 0,
        [ErrorCategory.FILE_SYSTEM]: 0,
        [ErrorCategory.VALIDATION]: 0,
        [ErrorCategory.PERFORMANCE]: 0,
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.USER_INPUT]: 0,
        [ErrorCategory.UNKNOWN]: 0
      },
      recent: 0
    };

    allErrors.forEach(error => {
      stats.bySeverity[error.severity]++;
      stats.byCategory[error.category]++;
      
      if (error.timestamp > oneHourAgo) {
        stats.recent++;
      }
    });

    return stats;
  }

  // Private methods

  private setupGlobalErrorHandling(): void {
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.handleError(
        new Error(event.message),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.ERROR,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(`Unhandled promise rejection: ${event.reason}`),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.ERROR,
        {
          reason: event.reason
        }
      );
    });
  }

  private generateUserMessage(category: ErrorCategory, message: string): string {
    const categoryMessages = {
      [ErrorCategory.ASSET_LOADING]: 'Failed to load asset',
      [ErrorCategory.IMAGE_PROCESSING]: 'Image processing failed',
      [ErrorCategory.SPRITE_MANAGEMENT]: 'Sprite operation failed',
      [ErrorCategory.ANIMATION_ENGINE]: 'Animation system error',
      [ErrorCategory.FILE_SYSTEM]: 'File operation failed',
      [ErrorCategory.VALIDATION]: 'Validation error',
      [ErrorCategory.PERFORMANCE]: 'Performance issue detected',
      [ErrorCategory.NETWORK]: 'Network error',
      [ErrorCategory.USER_INPUT]: 'Invalid input',
      [ErrorCategory.UNKNOWN]: 'An unexpected error occurred'
    };

    return categoryMessages[category] || 'An error occurred';
  }

  private generateSuggestions(category: ErrorCategory, message: string): string[] {
    const suggestions: string[] = [];

    switch (category) {
      case ErrorCategory.ASSET_LOADING:
        suggestions.push(
          'Check if the file format is supported',
          'Try uploading a smaller file',
          'Ensure the file is not corrupted'
        );
        break;
        
      case ErrorCategory.IMAGE_PROCESSING:
        suggestions.push(
          'Try reducing the image size',
          'Convert to a different format',
          'Check if the image has valid dimensions'
        );
        break;
        
      case ErrorCategory.SPRITE_MANAGEMENT:
        suggestions.push(
          'Check sprite configuration values',
          'Ensure the asset exists',
          'Try refreshing the workspace'
        );
        break;
        
      case ErrorCategory.VALIDATION:
        suggestions.push(
          'Check the input values',
          'Refer to the validation requirements',
          'Try using different parameters'
        );
        break;
        
      case ErrorCategory.PERFORMANCE:
        suggestions.push(
          'Close unused assets',
          'Reduce image sizes',
          'Clear browser cache',
          'Refresh the page'
        );
        break;
        
      default:
        suggestions.push(
          'Try refreshing the page',
          'Check your internet connection',
          'Clear browser cache'
        );
    }

    return suggestions;
  }

  private isRecoverable(category: ErrorCategory, severity: ErrorSeverity): boolean {
    if (severity === ErrorSeverity.CRITICAL) return false;
    
    const recoverableCategories = [
      ErrorCategory.ASSET_LOADING,
      ErrorCategory.IMAGE_PROCESSING,
      ErrorCategory.VALIDATION,
      ErrorCategory.USER_INPUT
    ];

    return recoverableCategories.includes(category);
  }

  private logError(error: AnimationLabError): void {
    const logMethod = {
      [ErrorSeverity.INFO]: console.info,
      [ErrorSeverity.WARNING]: console.warn,
      [ErrorSeverity.ERROR]: console.error,
      [ErrorSeverity.CRITICAL]: console.error
    }[error.severity];

    logMethod(`[Animation Lab ${error.severity.toUpperCase()}] ${error.category}: ${error.message}`, {
      id: error.id,
      details: error.details,
      context: error.context
    });
  }

  private notifyListeners(error: AnimationLabError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }

  private trimErrorHistory(): void {
    if (this.errors.size > this.maxErrorHistory) {
      const sortedErrors = Array.from(this.errors.entries())
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      
      const toRemove = sortedErrors.slice(0, this.errors.size - this.maxErrorHistory);
      toRemove.forEach(([id]) => this.errors.delete(id));
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}