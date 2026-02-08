import React from 'react';
import { motion } from 'framer-motion';
import EnhancedGameTypeSelector from '../EnhancedGameTypeSelector';

/**
 * Enhanced Step 2: Game Type Selector Component
 * 
 * Premium UI/UX implementation inspired by industry leaders like Apple, Ubisoft,
 * Microsoft, and Atlassian, featuring:
 * 
 * - Cinematic intro animation
 * - Interactive 3D cards with depth effects
 * - Micro-interactions and hover states
 * - Premium progress indicators
 * - Animated transitions and notifications
 */
const EnhancedStep2_GameTypeSelector: React.FC = () => {
  return (
    <motion.div 
      className="enhanced-step-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <EnhancedGameTypeSelector />
    </motion.div>
  );
};

export default EnhancedStep2_GameTypeSelector;