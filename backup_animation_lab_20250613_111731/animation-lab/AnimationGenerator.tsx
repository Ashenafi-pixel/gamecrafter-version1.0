import React from 'react';

interface AnimationConfig {
  type: 'idle' | 'win' | 'scatter' | 'wild';
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

interface AnimationGeneratorProps {
  analysisResult: any;
  onAnimationGenerated: (config: AnimationConfig) => void;
}

const AnimationGenerator: React.FC<AnimationGeneratorProps> = ({
  analysisResult,
  onAnimationGenerated
}) => {
  const generateAnimation = (type: AnimationConfig['type']) => {
    if (!analysisResult) return;

    // Generate animation configuration based on analysis
    const config: AnimationConfig = {
      type,
      elements: analysisResult.identifiedElements.map((element: any) => ({
        id: element.id,
        name: element.name,
        animation: getAnimationForElement(element.id, type),
        duration: getDurationForType(type),
        delay: getDelayForElement(element.id),
        easing: getEasingForType(type)
      })),
      globalSettings: {
        loop: type !== 'win', // Win animations typically don't loop
        intensity: getIntensityForType(type),
        style: 'casino'
      }
    };

    onAnimationGenerated(config);
  };

  const getAnimationForElement = (elementId: string, type: string): string => {
    const animationMap: Record<string, Record<string, string>> = {
      wings: {
        idle: 'flutter-subtle',
        win: 'flutter-intense',
        scatter: 'shimmer',
        wild: 'transform'
      },
      body: {
        idle: 'float',
        win: 'scale-pulse',
        scatter: 'glow-pulse',
        wild: 'morph'
      },
      glow: {
        idle: 'pulse',
        win: 'explode',
        scatter: 'radiate',
        wild: 'color-shift'
      }
    };

    return animationMap[elementId]?.[type] || 'pulse';
  };

  const getDurationForType = (type: string): number => {
    const durations: Record<string, number> = {
      idle: 2.0,
      win: 1.0,
      scatter: 1.5,
      wild: 1.2
    };
    return durations[type] || 1.0;
  };

  const getDelayForElement = (elementId: string): number => {
    const delays: Record<string, number> = {
      glow: 0,
      body: 0.1,
      wings: 0.2
    };
    return delays[elementId] || 0;
  };

  const getEasingForType = (type: string): string => {
    const easings: Record<string, string> = {
      idle: 'ease-in-out',
      win: 'ease-out',
      scatter: 'ease-in-out',
      wild: 'cubic-bezier(0.4, 0, 0.2, 1)'
    };
    return easings[type] || 'ease-in-out';
  };

  const getIntensityForType = (type: string): 'subtle' | 'medium' | 'intense' => {
    const intensities: Record<string, 'subtle' | 'medium' | 'intense'> = {
      idle: 'subtle',
      win: 'intense',
      scatter: 'medium',
      wild: 'medium'
    };
    return intensities[type] || 'medium';
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Generate Animation</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            type: 'idle',
            name: 'Idle Animation',
            description: 'Subtle, looping movement',
            color: 'blue',
            icon: '😌'
          },
          {
            type: 'win',
            name: 'Win Animation',
            description: 'Explosive celebration effect',
            color: 'green',
            icon: '🎉'
          },
          {
            type: 'scatter',
            name: 'Scatter Bonus',
            description: 'Mystical magical glow',
            color: 'purple',
            icon: '✨'
          },
          {
            type: 'wild',
            name: 'Wild Transform',
            description: 'Dynamic transformation',
            color: 'orange',
            icon: '🔥'
          }
        ].map((anim) => (
          <button
            key={anim.type}
            onClick={() => generateAnimation(anim.type as AnimationConfig['type'])}
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors text-left"
          >
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{anim.icon}</span>
              <span className="font-medium">{anim.name}</span>
            </div>
            <p className="text-xs text-gray-600">{anim.description}</p>
          </button>
        ))}
      </div>

      {analysisResult && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Ready to animate:</strong> {analysisResult.identifiedElements.map((e: any) => e.name).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnimationGenerator;