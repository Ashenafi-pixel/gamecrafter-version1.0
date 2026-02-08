import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Types
type ElementType = 'background' | 'frame' | 'symbol' | 'button' | 'text' | 'particle';
type LayerType = 'background' | 'frame' | 'symbols' | 'ui' | 'effects';

interface CanvasElement {
  id: string;
  type: ElementType;
  layer: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  selected: boolean;
  data: any; // Additional properties specific to element type
}

interface PropertyPanelProps {
  element: CanvasElement | null;
  onUpdate: (properties: Partial<CanvasElement>) => void;
  className?: string;
}

/**
 * PropertyPanel - Dynamic panel for editing selected element properties
 * 
 * Features:
 * - Context-aware property editing based on element type
 * - Collapsible sections for different property categories
 * - Precise numeric input with slider controls
 * - Color picker for applicable properties
 * - Expandable/collapsible design to save space
 */
const PropertyPanel: React.FC<PropertyPanelProps> = ({
  element,
  onUpdate,
  className = ''
}) => {
  const [activeSection, setActiveSection] = useState<string>('transform');
  
  if (!element) {
    return (
      <div className={`property-panel h-full bg-gray-800 text-white p-4 rounded-lg ${className}`}>
        <div className="no-selection flex flex-col items-center justify-center h-full">
          <div className="text-gray-400 text-center">
            <svg className="w-12 h-12 mx-auto mb-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="text-sm">Select an element to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Handle input changes for various properties
  const handleNumberChange = (property: keyof CanvasElement, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onUpdate({ [property]: numValue });
    }
  };
  
  const handleDataChange = (property: string, value: any) => {
    onUpdate({
      data: {
        ...element.data,
        [property]: value
      }
    });
  };
  
  const handleVisibilityToggle = () => {
    onUpdate({ visible: !element.visible });
  };
  
  // Helper to render input with label
  const renderLabeledInput = (
    label: string, 
    property: keyof CanvasElement | string, 
    value: any, 
    type: string = 'number', 
    step: number = 1,
    min?: number,
    max?: number,
    isDataProperty: boolean = false
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = type === 'number' ? e.target.value : 
                        type === 'checkbox' ? e.target.checked : 
                        e.target.value;
      
      if (isDataProperty) {
        handleDataChange(property as string, inputValue);
      } else {
        handleNumberChange(property as keyof CanvasElement, inputValue);
      }
    };
    
    return (
      <div className="property-row flex items-center mb-2">
        <label className="w-1/3 text-sm text-gray-300">{label}</label>
        <div className="w-2/3 flex">
          {type === 'color' ? (
            <div className="color-picker-wrapper flex items-center">
              <input
                type="color"
                value={value || '#ffffff'}
                onChange={handleChange}
                className="mr-2 w-6 h-6 rounded overflow-hidden"
              />
              <input
                type="text"
                value={value || '#ffffff'}
                onChange={handleChange}
                className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm"
              />
            </div>
          ) : type === 'checkbox' ? (
            <label className="switch">
              <input
                type="checkbox"
                checked={!!value}
                onChange={handleChange}
              />
              <span className="slider round"></span>
            </label>
          ) : (
            <input
              type={type}
              value={value !== undefined ? value : ''}
              onChange={handleChange}
              step={step}
              min={min}
              max={max}
              className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm"
            />
          )}
        </div>
      </div>
    );
  };
  
  // Render section
  const renderSection = (title: string, sectionId: string, content: React.ReactNode) => {
    const isActive = activeSection === sectionId;
    
    return (
      <div className="property-section mb-3">
        <button
          className="section-header w-full flex items-center justify-between bg-gray-700 px-3 py-2 rounded text-left"
          onClick={() => setActiveSection(isActive ? '' : sectionId)}
        >
          <span className="text-sm font-medium">{title}</span>
          <svg 
            className={`w-4 h-4 transform transition-transform ${isActive ? 'rotate-180' : ''}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <motion.div
          className="section-content px-3 py-2"
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: isActive ? 'auto' : 0,
            opacity: isActive ? 1 : 0
          }}
          transition={{ duration: 0.2 }}
          style={{ overflow: 'hidden' }}
        >
          {content}
        </motion.div>
      </div>
    );
  };
  
  // Type-specific sections
  const renderTypeSpecificProperties = () => {
    switch (element.type) {
      case 'background':
        return renderSection('Background Properties', 'background', (
          <>
            {renderLabeledInput('Color', 'color', element.data?.color, 'color', 0, 0, 0, true)}
            {renderLabeledInput('Image URL', 'src', element.data?.src, 'text', 0, 0, 0, true)}
            {renderLabeledInput('Fill Mode', 'fillMode', element.data?.fillMode || 'cover', 'text', 0, 0, 0, true)}
          </>
        ));
        
      case 'text':
        return renderSection('Text Properties', 'text', (
          <>
            {renderLabeledInput('Text', 'text', element.data?.text || '', 'text', 0, 0, 0, true)}
            {renderLabeledInput('Font Size', 'fontSize', element.data?.fontSize || '16px', 'text', 0, 0, 0, true)}
            {renderLabeledInput('Color', 'color', element.data?.color || '#ffffff', 'color', 0, 0, 0, true)}
            {renderLabeledInput('Font Family', 'fontFamily', element.data?.fontFamily || 'sans-serif', 'text', 0, 0, 0, true)}
            {renderLabeledInput('Text Align', 'textAlign', element.data?.textAlign || 'center', 'text', 0, 0, 0, true)}
          </>
        ));
        
      case 'symbol':
        return renderSection('Symbol Properties', 'symbol', (
          <>
            {renderLabeledInput('Symbol ID', 'symbolId', element.data?.symbolId || '', 'text', 0, 0, 0, true)}
            {renderLabeledInput('Symbol Type', 'symbolType', element.data?.symbolType || 'regular', 'text', 0, 0, 0, true)}
            {renderLabeledInput('Animation', 'animation', element.data?.animation || 'none', 'text', 0, 0, 0, true)}
          </>
        ));
        
      default:
        return null;
    }
  };
  
  return (
    <div className={`property-panel bg-gray-800 text-white p-2 rounded-lg ${className}`}>
      <div className="element-header flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
        <div className="element-info flex items-center">
          <div className={`element-type-indicator w-3 h-3 rounded-full mr-2 bg-${getElementTypeColor(element.type)}-500`}></div>
          <h3 className="text-sm font-medium">{formatElementType(element.type)} Element</h3>
        </div>
        <div className="element-actions flex items-center">
          <button
            className={`visibility-toggle mr-2 ${element.visible ? 'text-blue-400' : 'text-gray-500'}`}
            onClick={handleVisibilityToggle}
            title={element.visible ? 'Hide Element' : 'Show Element'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {element.visible ? (
                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              ) : (
                <path d="M2 2L22 22M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              )}
            </svg>
          </button>
        </div>
      </div>
      
      <div className="property-sections">
        {/* Transform Section */}
        {renderSection('Transform', 'transform', (
          <>
            {renderLabeledInput('X Position', 'x', element.x, 'number', 1)}
            {renderLabeledInput('Y Position', 'y', element.y, 'number', 1)}
            {renderLabeledInput('Width', 'width', element.width, 'number', 1, 1)}
            {renderLabeledInput('Height', 'height', element.height, 'number', 1, 1)}
            {renderLabeledInput('Rotation', 'rotation', element.rotation, 'number', 1)}
            {renderLabeledInput('Scale', 'scale', element.scale, 'number', 0.1, 0.1)}
          </>
        ))}
        
        {/* Style Section */}
        {renderSection('Style', 'style', (
          <>
            {renderLabeledInput('Opacity', 'opacity', element.opacity, 'number', 0.1, 0, 1)}
            {renderLabeledInput('Z-Index', 'zIndex', element.zIndex, 'number', 1)}
            {renderLabeledInput('Layer', 'layer', element.layer, 'text')}
          </>
        ))}
        
        {/* Type-specific properties */}
        {renderTypeSpecificProperties()}
      </div>
    </div>
  );
};

// Helper functions
const getElementTypeColor = (type: ElementType) => {
  switch (type) {
    case 'background': return 'blue';
    case 'frame': return 'purple';
    case 'symbol': return 'yellow';
    case 'button': return 'green';
    case 'text': return 'pink';
    case 'particle': return 'orange';
    default: return 'gray';
  }
};

const formatElementType = (type: ElementType) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export default PropertyPanel;