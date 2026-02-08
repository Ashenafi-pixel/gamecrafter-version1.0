import React from 'react';
import { registerGlowFilter } from './GlowFilter';

// Minimal component that just uses the registerGlowFilter function
// No hooks, just a simple function call
const MinimalReproduction: React.FC = () => {
  // Call the registerGlowFilter function directly - if this causes issues,
  // then the function itself is calling hooks improperly
  registerGlowFilter();
  
  return <div>Minimal Reproduction</div>;
};

export default MinimalReproduction;