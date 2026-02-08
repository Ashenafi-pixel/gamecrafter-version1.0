import React, { useState, useEffect } from 'react';
import { Palette, RefreshCw, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background?: string;
}

interface ColorCustomizerProps {
  colors: ThemeColors;
  onChange: (colors: ThemeColors) => void;
  onReset?: () => void;
  className?: string;
}

/**
 * ColorCustomizer Component
 * 
 * A component for customizing the colors of a theme with real-time preview
 * and synchronization with the GameCanvas.
 */
const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  colors,
  onChange,
  onReset,
  className = '',
}) => {
  // Local state for color editing
  const [editedColors, setEditedColors] = useState<ThemeColors>(colors);
  const [expanded, setExpanded] = useState(false);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  
  // Update local state when colors prop changes
  useEffect(() => {
    setEditedColors(colors);
  }, [colors]);
  
  // Handle color change for a specific property
  const handleColorChange = (property: keyof ThemeColors, value: string) => {
    const newColors = {
      ...editedColors,
      [property]: value
    };
    
    setEditedColors(newColors);
    onChange(newColors);
  };
  
  // Generate complementary colors based on primary color
  const generateComplementaryColors = () => {
    try {
      // Start with the primary color in hex format
      const hex = editedColors.primary.replace('#', '');
      
      // Convert to RGB
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      // Generate secondary color (complementary)
      const secondaryR = 255 - r;
      const secondaryG = 255 - g;
      const secondaryB = 255 - b;
      
      // Generate accent color (adjusted complementary)
      const accentR = Math.min(255, Math.max(0, (r + 100) % 255));
      const accentG = Math.min(255, Math.max(0, (g + 150) % 255));
      const accentB = Math.min(255, Math.max(0, (b + 200) % 255));
      
      // Convert back to hex
      const secondaryHex = `#${secondaryR.toString(16).padStart(2, '0')}${secondaryG.toString(16).padStart(2, '0')}${secondaryB.toString(16).padStart(2, '0')}`;
      const accentHex = `#${accentR.toString(16).padStart(2, '0')}${accentG.toString(16).padStart(2, '0')}${accentB.toString(16).padStart(2, '0')}`;
      
      // Update colors
      const newColors = {
        ...editedColors,
        secondary: secondaryHex,
        accent: accentHex
      };
      
      setEditedColors(newColors);
      onChange(newColors);
    } catch (error) {
      console.error('Error generating complementary colors:', error);
    }
  };
  
  // Reset to original colors
  const handleReset = () => {
    setEditedColors(colors);
    onChange(colors);
    if (onReset) onReset();
  };
  
  // Define color properties to edit
  const colorProperties: Array<{key: keyof ThemeColors, label: string}> = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' }
  ];
  
  return (
    <div className={`color-customizer ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
          whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)" }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Palette className="w-4 h-4" />
          <span className="font-medium">
            {expanded ? 'Hide Color Editor' : 'Customize Colors'}
          </span>
        </motion.button>
        
        {expanded && (
          <div className="flex gap-2">
            <motion.button
              onClick={generateComplementaryColors}
              className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md"
              whileHover={{ scale: 1.1, rotate: 180, boxShadow: "0 3px 10px rgba(124, 58, 237, 0.3)" }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              title="Generate complementary colors"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              onClick={handleReset}
              className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
              whileHover={{ scale: 1.1, boxShadow: "0 3px 10px rgba(16, 185, 129, 0.3)" }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              title="Reset to original colors"
            >
              <Check className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>
      
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="color-editor bg-gradient-to-b from-white to-gray-50 p-4 rounded-xl border border-gray-200 shadow-lg mb-4"
        >
          <div className="color-swatches mb-3 flex justify-center gap-2">
            {colorProperties.map(prop => (
              <motion.div
                key={prop.key}
                className={`color-swatch w-16 h-16 rounded-full cursor-pointer relative ${activeColor === prop.key ? 'ring-2 ring-offset-2 ring-blue-500' : 'ring-1 ring-white ring-offset-1'}`}
                style={{ 
                  backgroundColor: editedColors[prop.key],
                  boxShadow: `0 4px 10px ${editedColors[prop.key]}80`
                }}
                onClick={() => setActiveColor(activeColor === prop.key ? null : prop.key)}
                whileHover={{ scale: 1.15, y: -5, boxShadow: `0 8px 20px ${editedColors[prop.key]}90` }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
                  {prop.label}
                </span>
              </motion.div>
            ))}
          </div>
          
          {activeColor && (
            <motion.div 
              className="color-picker mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: editedColors[activeColor as keyof ThemeColors] }}></span>
                {activeColor.charAt(0).toUpperCase() + activeColor.slice(1)} Color
              </label>
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 rounded-lg overflow-hidden shadow-inner border border-gray-200">
                  <input
                    type="color"
                    value={editedColors[activeColor as keyof ThemeColors]}
                    onChange={(e) => handleColorChange(activeColor as keyof ThemeColors, e.target.value)}
                    className="w-12 h-12 cursor-pointer border-0"
                    style={{ margin: '-2px', padding: 0 }}
                  />
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={editedColors[activeColor as keyof ThemeColors]}
                    onChange={(e) => handleColorChange(activeColor as keyof ThemeColors, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm shadow-sm 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#RRGGBB"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="text-xs text-gray-500">HEX</div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex justify-between">
                <span>Format: #RRGGBB</span>
                <span>
                  RGB: {
                    editedColors[activeColor as keyof ThemeColors]
                      ? `${parseInt(editedColors[activeColor as keyof ThemeColors]!.slice(1, 3), 16)},${parseInt(editedColors[activeColor as keyof ThemeColors]!.slice(3, 5), 16)},${parseInt(editedColors[activeColor as keyof ThemeColors]!.slice(5, 7), 16)}`
                      : '--,--,--'
                  }
                </span>
              </div>
            </motion.div>
          )}
          
          <motion.div 
            className="color-preview mt-6 rounded-xl overflow-hidden shadow-lg" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 flex justify-between items-center">
              <h3 className="text-white text-sm font-medium">Live Color Preview</h3>
              <span className="text-xs text-gray-400">Theme Color System</span>
            </div>
            
            <div className="p-4" style={{ 
              background: `linear-gradient(150deg, ${editedColors.primary}15, ${editedColors.secondary}25)`,
            }}>
              <div className="flex flex-wrap gap-3 justify-center mb-4">
                {/* Premium button examples */}
                <button
                  className="px-5 py-2.5 rounded-lg text-white font-medium shadow-md transition-transform transform hover:scale-105"
                  style={{ 
                    backgroundColor: editedColors.primary,
                    boxShadow: `0 4px 10px ${editedColors.primary}50` 
                  }}
                >
                  Primary
                </button>
                <button
                  className="px-5 py-2.5 rounded-lg text-white font-medium shadow-md transition-transform transform hover:scale-105"
                  style={{ 
                    backgroundColor: editedColors.secondary,
                    boxShadow: `0 4px 10px ${editedColors.secondary}50` 
                  }}
                >
                  Secondary
                </button>
                <button
                  className="px-5 py-2.5 rounded-lg text-white font-medium shadow-md transition-transform transform hover:scale-105"
                  style={{ 
                    backgroundColor: editedColors.accent,
                    boxShadow: `0 4px 10px ${editedColors.accent}50` 
                  }}
                >
                  Accent
                </button>
              </div>
              
              {/* Theme UI example */}
              <div className="mt-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 border border-white border-opacity-20"
                   style={{ boxShadow: `0 8px 16px ${editedColors.primary}20` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium" style={{ color: editedColors.primary }}>Theme Preview</h4>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: editedColors.primary }}></div>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: editedColors.secondary }}></div>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: editedColors.accent }}></div>
                  </div>
                </div>
                <div className="h-10 rounded-md mb-2" style={{ 
                  background: `linear-gradient(135deg, ${editedColors.primary}40, ${editedColors.secondary}40)`,
                  border: `1px solid ${editedColors.accent}30`
                }}></div>
                <div className="flex justify-between">
                  <div className="w-1/3 h-4 rounded" style={{ backgroundColor: `${editedColors.primary}30` }}></div>
                  <div className="w-1/4 h-4 rounded" style={{ backgroundColor: `${editedColors.secondary}40` }}></div>
                  <div className="w-1/5 h-4 rounded" style={{ backgroundColor: `${editedColors.accent}50` }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ColorCustomizer;