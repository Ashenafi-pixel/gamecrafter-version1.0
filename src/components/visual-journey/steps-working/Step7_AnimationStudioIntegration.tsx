import React from 'react';
import { Step6_AnimationStudio } from './Step7_AnimationStudio';

interface MaskControls {
  enabled: boolean;
  debugVisible: boolean;
  perReelEnabled: boolean[];
}

interface AnimationControls {
  speed: number;
  blurIntensity: number;
  easing: string;
}

interface VisualEffects {
  spinBlur: boolean;
  glowEffects: boolean;
  screenShake: boolean;
}

export const Step7_AnimationStudioIntegration: React.FC = () => {

  const handleMaskControlsChange = (controls: MaskControls) => {
    console.log('🎭 Mask controls changed:', controls);
  };

  const handleAnimationControlsChange = (controls: AnimationControls) => {
    console.log('🎬 Animation controls changed:', controls);
  };

  const handleVisualEffectsChange = (effects: VisualEffects) => {
    console.log('✨ Visual effects changed:', effects);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-full mx-auto">
        <Step6_AnimationStudio
          onMaskControlsChange={handleMaskControlsChange}
          onAnimationControlsChange={handleAnimationControlsChange}
          onVisualEffectsChange={handleVisualEffectsChange}
        />
      </div>
    </div>
  );
};
