import React, { useState, useEffect } from 'react';
import { Lightbulb, X, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';

export interface AISuggestion {
  id: string;
  type: 'performance' | 'ux' | 'accessibility' | 'best-practice';
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
  action?: string;
  condition?: string;
  stepSpecific?: boolean;
}

export interface AIAssistantProps {
  stepType: 'theme' | 'grid' | 'animation' | 'assets' | 'win-animation' | 'bonus' | 'math';
  context: Record<string, any>;
  enabled?: boolean;
  experienceLevel?: 'beginner' | 'advanced' | 'expert';
  onSuggestionAction?: (suggestionId: string, action: string) => void;
}

// Step-specific suggestion rules
const SUGGESTION_RULES = {
  animation: [
    {
      id: 'mobile-speed-warning',
      condition: (ctx: any) => ctx.speed > 2.5 && ctx.device === 'mobile',
      type: 'performance' as const,
      severity: 'warning' as const,
      message: 'Animation speed above 2.5x may feel too fast on mobile devices',
      action: 'Set speed to 1.5x for mobile optimization'
    },
    {
      id: 'blur-performance-warning',
      condition: (ctx: any) => ctx.blurIntensity > 15,
      type: 'performance' as const,
      severity: 'warning' as const,
      message: 'High blur intensity may impact performance on older devices',
      action: 'Reduce blur to 8-12px for better performance'
    },
    {
      id: 'beginner-easing-suggestion',
      condition: (ctx: any) => ctx.experienceLevel === 'beginner' && ctx.easing?.includes('elastic'),
      type: 'ux' as const,
      severity: 'info' as const,
      message: 'For a classic casino feel, try "Power2 Out" or "Back Out" easing',
      action: 'Apply recommended easing'
    },
    {
      id: 'dramatic-preset-suggestion',
      condition: (ctx: any) => ctx.speed < 1 && ctx.blurIntensity > 10,
      type: 'best-practice' as const,
      severity: 'success' as const,
      message: 'Great choice! Slow speed with blur creates dramatic impact',
      action: 'Try the "Dramatic" preset for similar effects'
    },
    {
      id: 'accessibility-warning',
      condition: (ctx: any) => ctx.visualEffects?.screenShake && ctx.experienceLevel !== 'expert',
      type: 'accessibility' as const,
      severity: 'warning' as const,
      message: 'Screen shake effects may cause issues for users with vestibular disorders',
      action: 'Add accessibility toggle or reduce intensity'
    }
  ],
  // Placeholders for other steps
  theme: [
    {
      id: 'mobile-theme-suggestion',
      condition: (ctx: any) => ctx.device === 'mobile',
      type: 'ux' as const,
      severity: 'info' as const,
      message: 'This theme works well for mobile audiences',
      action: 'Optimize for mobile'
    }
  ],
  grid: [
    {
      id: 'grid-performance-suggestion',
      condition: (ctx: any) => ctx.gridSize?.includes('5x5'),
      type: 'performance' as const,
      severity: 'info' as const,
      message: '5x5 grids require more processing power',
      action: 'Consider 3x5 for better performance'
    }
  ],
  assets: [],
  'win-animation': [],
  bonus: [],
  math: []
};

export const AIAssistant: React.FC<AIAssistantProps> = ({
  stepType,
  context,
  enabled = true,
  experienceLevel = 'beginner',
  onSuggestionAction
}) => {
  const [activeSuggestions, setActiveSuggestions] = useState<AISuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Evaluate suggestions based on context
  useEffect(() => {
    if (!enabled) return;

    const rules = SUGGESTION_RULES[stepType] || [];
    const contextWithExperience = { ...context, experienceLevel };
    
    const newSuggestions = rules
      .filter(rule => {
        // Check if condition is met and not dismissed
        const conditionMet = typeof rule.condition === 'function' 
          ? rule.condition(contextWithExperience)
          : true;
        
        return conditionMet && !dismissedSuggestions.includes(rule.id);
      })
      .map(rule => ({
        ...rule,
        stepSpecific: true
      }));

    setActiveSuggestions(newSuggestions);
  }, [stepType, context, experienceLevel, enabled, dismissedSuggestions]);

  const handleDismiss = (suggestionId: string) => {
    setDismissedSuggestions(prev => [...prev, suggestionId]);
  };

  const handleAction = (suggestion: AISuggestion) => {
    if (onSuggestionAction && suggestion.action) {
      onSuggestionAction(suggestion.id, suggestion.action);
    }
    handleDismiss(suggestion.id);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (!enabled || activeSuggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-600">
              {activeSuggestions.length} suggestion{activeSuggestions.length !== 1 ? 's' : ''} for {stepType}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            Smart
          </span>
          <Lightbulb className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {activeSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`p-4 rounded-lg border ${getSeverityStyles(suggestion.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getSeverityIcon(suggestion.severity)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{suggestion.message}</p>
                    {suggestion.action && (
                      <button
                        onClick={() => handleAction(suggestion)}
                        className="mt-2 text-xs bg-white hover:bg-gray-50 px-3 py-1 rounded-full border border-gray-300 transition-colors"
                      >
                        {suggestion.action}
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(suggestion.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Context-aware tips */}
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Pro Tip</span>
            </div>
            <p className="text-sm text-purple-700">
              {stepType === 'animation' && 'Test your animations on different devices to ensure optimal performance across all platforms.'}
              {stepType === 'theme' && 'Consider your target audience when selecting themes - mobile users prefer simpler, high-contrast designs.'}
              {stepType === 'grid' && 'Grid complexity directly impacts performance - start simple and add complexity gradually.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};