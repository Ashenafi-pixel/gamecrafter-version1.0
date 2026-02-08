/**
 * Animation Lab Mode Provider
 * Manages Simple vs Advanced mode state and provides context
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ProfessionalAtlasResult } from '../../utils/professionalSpriteAtlas';

export type AnimationLabMode = 'simple' | 'advanced';

export interface AnimationLabContextType {
  mode: AnimationLabMode;
  setMode: (mode: AnimationLabMode) => void;
  toggleMode: () => void;
  atlasResult: ProfessionalAtlasResult | null;
  setAtlasResult: (result: ProfessionalAtlasResult | null) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const AnimationLabContext = createContext<AnimationLabContextType | undefined>(undefined);

export const useAnimationLab = () => {
  const context = useContext(AnimationLabContext);
  if (context === undefined) {
    throw new Error('useAnimationLab must be used within an AnimationLabProvider');
  }
  return context;
};

interface AnimationLabProviderProps {
  children: React.ReactNode;
  initialMode?: AnimationLabMode;
}

export const AnimationLabProvider: React.FC<AnimationLabProviderProps> = ({ 
  children, 
  initialMode = 'simple' 
}) => {
  const [mode, setMode] = useState<AnimationLabMode>(initialMode);
  const [atlasResult, setAtlasResult] = useState<ProfessionalAtlasResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'simple' ? 'advanced' : 'simple');
  }, []);

  const value: AnimationLabContextType = {
    mode,
    setMode,
    toggleMode,
    atlasResult,
    setAtlasResult,
    isProcessing,
    setIsProcessing
  };

  return (
    <AnimationLabContext.Provider value={value}>
      {children}
    </AnimationLabContext.Provider>
  );
};