import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  LineChart,
  Palette,
  Sliders,
  Sparkles,
  Zap,
  AlertTriangle,
  Play,
  Check
} from 'lucide-react';
import { PreviewReelConfig, DEFAULT_REEL_CONFIG, WinResultType } from './PreviewReelController';
import gsap from 'gsap';

// Parameter control interface
interface ParameterControl {
  key: keyof PreviewReelConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  professional: {
    min: number;
    max: number;
    warning?: string;
  };
  description: string;
}

// Ease function visualization interface
interface EasePoint {
  x: number;
  y: number;
}

interface AdvancedAnimationControlsProps {
  config: Partial<PreviewReelConfig>;
  onConfigChange: (config: Partial<PreviewReelConfig>) => void;
  onApplyAnimation: () => void;
  onResultTypeChange: (resultType: WinResultType) => void;
  resultType: WinResultType;
}

const AdvancedAnimationControls: React.FC<AdvancedAnimationControlsProps> = ({
  config,
  onConfigChange,
  onApplyAnimation,
  onResultTypeChange,
  resultType
}) => {
  const [activeTab, setActiveTab] = useState<'timing' | 'visual' | 'effects' | 'layout'>('timing');
  const [selectedEase, setSelectedEase] = useState<string>('power1.out');
  const [currentWarning, setCurrentWarning] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Combined configuration (defaults + custom settings)
  const [currentConfig, setCurrentConfig] = useState<PreviewReelConfig>({
    ...DEFAULT_REEL_CONFIG,
    ...config
  });
  
  // Parameter definitions with professional ranges
  const parameterControls: Record<string, ParameterControl> = {
    spinDuration: {
      key: 'spinDuration',
      label: 'Spin Duration',
      min: 0.5,
      max: 5,
      step: 0.1,
      unit: 's',
      professional: {
        min: 1.5,
        max: 3.0,
        warning: 'Spin duration under 1.5s may feel rushed, over 3s may feel sluggish'
      },
      description: 'The total time for the reels to complete spinning'
    },
    reelStartDelay: {
      key: 'reelStartDelay',
      label: 'Reel Start Delay',
      min: 0,
      max: 0.5,
      step: 0.05,
      unit: 's',
      professional: {
        min: 0.1,
        max: 0.25,
        warning: 'Start delay under 0.1s may appear simultaneous, over 0.25s can feel too slow'
      },
      description: 'The time delay between each reel starting to spin'
    },
    bounceDistance: {
      key: 'bounceDistance',
      label: 'Bounce Distance',
      min: 0,
      max: 50,
      step: 1,
      unit: 'px',
      professional: {
        min: 10,
        max: 30,
        warning: 'Low bounce values appear subtle, high values can look exaggerated'
      },
      description: 'How far the reels bounce when stopping'
    },
    bounceDuration: {
      key: 'bounceDuration',
      label: 'Bounce Duration',
      min: 0.1,
      max: 1.5,
      step: 0.1,
      unit: 's',
      professional: {
        min: 0.4,
        max: 0.8,
        warning: 'Bounce duration affects perception of weight and momentum'
      },
      description: 'How long the bounce effect lasts after reels stop'
    },
    blurAmount: {
      key: 'blurAmount',
      label: 'Motion Blur',
      min: 0,
      max: 20,
      step: 1,
      unit: '',
      professional: {
        min: 5,
        max: 15,
        warning: 'No blur may appear choppy, excessive blur can obscure symbols'
      },
      description: 'The intensity of motion blur during spinning'
    },
    easeInDuration: {
      key: 'easeInDuration',
      label: 'Ease In Duration',
      min: 0,
      max: 1,
      step: 0.1,
      unit: 's',
      professional: {
        min: 0.2,
        max: 0.6,
        warning: 'Lower values create an abrupt start, higher values a gradual acceleration'
      },
      description: 'How long it takes for the reels to accelerate to full speed'
    },
    easeOutDuration: {
      key: 'easeOutDuration',
      label: 'Ease Out Duration',
      min: 0,
      max: 1,
      step: 0.1,
      unit: 's',
      professional: {
        min: 0.3,
        max: 0.7,
        warning: 'Lower values create an abrupt stop, higher values a gradual deceleration'
      },
      description: 'How long it takes for the reels to decelerate to a stop'
    },
    anticipationDuration: {
      key: 'anticipationDuration',
      label: 'Anticipation Duration',
      min: 0,
      max: 3,
      step: 0.1,
      unit: 's',
      professional: {
        min: 0.5,
        max: 1.5,
        warning: 'Best used for big wins and features, can be annoying if too long'
      },
      description: 'Duration of anticipation effect before final reveal'
    },
    anticipationShakeIntensity: {
      key: 'anticipationShakeIntensity',
      label: 'Anticipation Intensity',
      min: 0,
      max: 20,
      step: 1,
      unit: '',
      professional: {
        min: 5,
        max: 15,
        warning: 'Higher values create more intense anticipation but can be distracting'
      },
      description: 'Intensity of shake effect during anticipation'
    },
    symbolWidth: {
      key: 'symbolWidth',
      label: 'Symbol Width',
      min: 50,
      max: 150,
      step: 5,
      unit: 'px',
      professional: {
        min: 80,
        max: 120
      },
      description: 'Width of each symbol in pixels'
    },
    symbolHeight: {
      key: 'symbolHeight',
      label: 'Symbol Height',
      min: 50,
      max: 150,
      step: 5,
      unit: 'px',
      professional: {
        min: 80,
        max: 120
      },
      description: 'Height of each symbol in pixels'
    },
    symbolPadding: {
      key: 'symbolPadding',
      label: 'Symbol Padding',
      min: 0,
      max: 30,
      step: 1,
      unit: 'px',
      professional: {
        min: 5,
        max: 15
      },
      description: 'Space between symbols in pixels'
    }
  };
  
  // Available ease functions - using GSAP ease names
  const easeOptions = [
    { value: 'power1.out', label: 'Smooth (Default)', description: 'A simple ease out, good for general use' },
    { value: 'back.out(1.7)', label: 'Overshoot', description: 'Overshoots the target and then comes back' },
    { value: 'elastic.out(1, 0.3)', label: 'Bounce', description: 'Elastic/spring effect that overshoots multiple times' },
    { value: 'sine.inOut', label: 'Gentle', description: 'Very smooth, soft animation with no bounce' },
    { value: 'power4.out', label: 'Anticipation', description: 'Starts slow then speeds up significantly' },
    { value: 'steps(5)', label: 'Stepped', description: 'Moves in distinct steps instead of smoothly' },
    { value: 'custom', label: 'Custom Cubic-Bezier', description: 'Design your own easing curve' }
  ];
  
  // Update local state when props change
  useEffect(() => {
    setCurrentConfig({
      ...DEFAULT_REEL_CONFIG,
      ...config
    });
  }, [config]);
  
  // Draw easing curve visualization when the canvas is available or ease changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    const gridSize = 20;
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Draw horizontal grid lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw vertical grid lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, 0);
    ctx.stroke();
    
    // Draw ease curve
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    
    // Generate points for the selected ease
    const points: EasePoint[] = [];
    const steps = 100;
    
    if (selectedEase !== 'custom') {
      for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        
        let easedValue = 0;
        try {
          // Use GSAP to calculate the eased value
          const ease = gsap.parseEase(selectedEase);
          easedValue = ease(progress);
        } catch (e) {
          // Fallback to linear if the ease is not recognized
          easedValue = progress;
        }
        
        points.push({
          x: progress * width,
          y: height - (easedValue * height)
        });
      }
    } else {
      // For custom ease, use a cubic-bezier curve as an example
      const bezierPoints = [
        { x: 0, y: height },
        { x: width * 0.2, y: height * 0.1 }, // Control point 1
        { x: width * 0.6, y: height * 0.9 }, // Control point 2
        { x: width, y: 0 }
      ];
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const point = cubicBezier(bezierPoints[0], bezierPoints[1], bezierPoints[2], bezierPoints[3], t);
        points.push(point);
      }
    }
    
    // Draw the curve
    ctx.beginPath();
    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }
    ctx.stroke();
    
    // Add a highlight dot for the current position (for demonstration)
    const dotPosition = 0.7; // 70% through the animation
    let easedDotPosition = 0;
    
    try {
      // Use GSAP to calculate the eased value
      const ease = gsap.parseEase(selectedEase !== 'custom' ? selectedEase : 'power1.out');
      easedDotPosition = ease(dotPosition);
    } catch (e) {
      // Fallback to linear if the ease is not recognized
      easedDotPosition = dotPosition;
    }
    
    const dotX = dotPosition * width;
    const dotY = height - (easedDotPosition * height);
    
    ctx.fillStyle = '#60A5FA';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
    ctx.setLineDash([4, 4]);
    
    // Horizontal projection line
    ctx.beginPath();
    ctx.moveTo(0, dotY);
    ctx.lineTo(dotX, dotY);
    ctx.stroke();
    
    // Vertical projection line
    ctx.beginPath();
    ctx.moveTo(dotX, dotY);
    ctx.lineTo(dotX, height);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
  }, [selectedEase, canvasRef.current]);
  
  // Cubic bezier function for custom easing visualization
  const cubicBezier = (p0: EasePoint, p1: EasePoint, p2: EasePoint, p3: EasePoint, t: number): EasePoint => {
    const cx = 3 * (p1.x - p0.x);
    const bx = 3 * (p2.x - p1.x) - cx;
    const ax = p3.x - p0.x - cx - bx;
    
    const cy = 3 * (p1.y - p0.y);
    const by = 3 * (p2.y - p1.y) - cy;
    const ay = p3.y - p0.y - cy - by;
    
    const x = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
    const y = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;
    
    return { x, y };
  };
  
  // Handle numeric input changes
  const handleNumberChange = (key: keyof PreviewReelConfig, value: string) => {
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      // Check for any professional warnings
      const param = Object.values(parameterControls).find(p => p.key === key);
      if (param && param.professional && param.professional.warning) {
        if (numValue < param.professional.min || numValue > param.professional.max) {
          setCurrentWarning(param.professional.warning);
        } else {
          setCurrentWarning(null);
        }
      }
      
      const newConfig = { ...currentConfig, [key]: numValue };
      setCurrentConfig(newConfig);
      onConfigChange(newConfig);
    }
  };
  
  // Handle boolean input changes
  const handleBooleanChange = (key: keyof PreviewReelConfig, checked: boolean) => {
    const newConfig = { ...currentConfig, [key]: checked };
    setCurrentConfig(newConfig);
    onConfigChange(newConfig);
  };
  
  // Handle color input changes
  const handleColorChange = (key: keyof PreviewReelConfig, value: string) => {
    const newConfig = { ...currentConfig, [key]: value };
    setCurrentConfig(newConfig);
    onConfigChange(newConfig);
  };
  
  // Handle ease selection
  const handleEaseChange = (ease: string) => {
    setSelectedEase(ease);
    // In a full implementation, we would update the relevant easing parameters
    // For now, just store it in the configuration for reference
    const newConfig = { ...currentConfig, easeType: ease };
    setCurrentConfig(newConfig);
    onConfigChange(newConfig);
  };
  
  // Render a parameter slider with professional range indicator
  const renderParameterSlider = (paramKey: string) => {
    const param = parameterControls[paramKey];
    if (!param) return null;
    
    const value = currentConfig[param.key] as number;
    const percentage = ((value - param.min) / (param.max - param.min)) * 100;
    const profMinPercent = ((param.professional.min - param.min) / (param.max - param.min)) * 100;
    const profMaxPercent = ((param.professional.max - param.min) / (param.max - param.min)) * 100;
    
    // Determine if the current value is outside the professional range
    const isOutsideRange = value < param.professional.min || value > param.professional.max;
    
    return (
      <div className="mb-4" key={param.key}>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-300">
            {param.label}
          </label>
          <span className="text-sm text-blue-300">
            {value}{param.unit}
          </span>
        </div>
        
        <div className="relative h-2 bg-gray-700 rounded-full">
          {/* Professional range indicator */}
          <div 
            className="absolute inset-y-0 rounded-full bg-green-900 bg-opacity-50"
            style={{
              left: `${profMinPercent}%`,
              right: `${100 - profMaxPercent}%`
            }}
          />
          
          {/* Current value indicator */}
          <div 
            className={`absolute inset-y-0 left-0 rounded-full ${isOutsideRange ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${percentage}%` }}
          />
          
          {/* Current position marker */}
          <div 
            className={`absolute top-1/2 w-4 h-4 rounded-full transform -translate-y-1/2 -translate-x-1/2 
              border-2 border-white shadow ${isOutsideRange ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ left: `${percentage}%` }}
          />
        </div>
        
        {/* Range input */}
        <input 
          type="range" 
          min={param.min} 
          max={param.max} 
          step={param.step}
          value={value} 
          onChange={(e) => handleNumberChange(param.key, e.target.value)}
          className="w-full mt-2 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
        
        {/* Description */}
        <p className="text-xs text-gray-400 mt-1">{param.description}</p>
      </div>
    );
  };
  
  // Define win types to display
  const winTypes: { value: WinResultType, label: string, color: string }[] = [
    { value: 'no-win', label: 'No Win', color: 'bg-gray-600' },
    { value: 'small-win', label: 'Small Win', color: 'bg-green-600' },
    { value: 'medium-win', label: 'Medium Win', color: 'bg-blue-600' },
    { value: 'big-win', label: 'Big Win', color: 'bg-purple-600' },
    { value: 'mega-win', label: 'Mega Win', color: 'bg-amber-600' },
    { value: 'feature-trigger', label: 'Feature', color: 'bg-pink-600' }
  ];
  
  return (
    <div className="bg-gray-800 rounded-lg text-white w-full">
      {/* Warning message */}
      {currentWarning && (
        <div className="mb-4 p-3 rounded-lg bg-amber-900 bg-opacity-30 border border-amber-800 flex items-start">
          <AlertTriangle className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-amber-200 text-sm">{currentWarning}</p>
        </div>
      )}
      
      {/* Section tabs */}
      <div className="flex border-b border-gray-700 overflow-hidden">
        <button 
          className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'timing' ? 'bg-blue-900 text-blue-200' : 'hover:bg-gray-700'}`}
          onClick={() => setActiveTab('timing')}
        >
          <Clock className="mr-2" size={16} />
          Timing
        </button>
        <button 
          className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'visual' ? 'bg-blue-900 text-blue-200' : 'hover:bg-gray-700'}`}
          onClick={() => setActiveTab('visual')}
        >
          <Palette className="mr-2" size={16} />
          Visual
        </button>
        <button 
          className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'effects' ? 'bg-blue-900 text-blue-200' : 'hover:bg-gray-700'}`}
          onClick={() => setActiveTab('effects')}
        >
          <Sparkles className="mr-2" size={16} />
          Effects
        </button>
        <button 
          className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'layout' ? 'bg-blue-900 text-blue-200' : 'hover:bg-gray-700'}`}
          onClick={() => setActiveTab('layout')}
        >
          <Sliders className="mr-2" size={16} />
          Layout
        </button>
      </div>
      
      <div className="p-6">
        {/* Timing settings */}
        {activeTab === 'timing' && (
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Clock className="mr-2 text-blue-400" size={18} />
              Timing Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {renderParameterSlider('spinDuration')}
                {renderParameterSlider('reelStartDelay')}
                {renderParameterSlider('bounceDuration')}
              </div>
              <div className="space-y-6">
                {renderParameterSlider('easeInDuration')}
                {renderParameterSlider('easeOutDuration')}
                
                {/* Easing curve selection and visualization */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Easing Function
                  </label>
                  <select
                    value={selectedEase}
                    onChange={(e) => handleEaseChange(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    {easeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    {easeOptions.find(o => o.value === selectedEase)?.description || 'Custom easing curve'}
                  </p>
                  
                  {/* Easing curve visualization */}
                  <div className="mt-3 bg-gray-900 border border-gray-700 rounded-lg p-2">
                    <canvas 
                      ref={canvasRef} 
                      width={300}
                      height={150}
                      className="w-full"
                    />
                    <p className="text-center text-xs text-gray-500 mt-1">Easing Curve Visualization</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Visual settings */}
        {activeTab === 'visual' && (
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Palette className="mr-2 text-purple-400" size={18} />
              Visual Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {renderParameterSlider('blurAmount')}
                {renderParameterSlider('bounceDistance')}
              </div>
              <div className="space-y-4">
                {/* Symbol colors */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Symbol Border Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={currentConfig.symbolBorderColor} 
                      onChange={(e) => handleColorChange('symbolBorderColor', e.target.value)}
                      className="h-10 w-10 rounded border-0 bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={currentConfig.symbolBorderColor} 
                      onChange={(e) => handleColorChange('symbolBorderColor', e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm w-32"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Symbol Background Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={currentConfig.symbolBackgroundColor} 
                      onChange={(e) => handleColorChange('symbolBackgroundColor', e.target.value)}
                      className="h-10 w-10 rounded border-0 bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={currentConfig.symbolBackgroundColor} 
                      onChange={(e) => handleColorChange('symbolBackgroundColor', e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm w-32"
                    />
                  </div>
                </div>
                
                {/* Color palette for symbols */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Symbol Colors
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {(currentConfig.symbolColors || []).map((color, index) => (
                      <div key={index} className="relative">
                        <input 
                          type="color" 
                          value={color} 
                          onChange={(e) => {
                            const newColors = [...(currentConfig.symbolColors || [])];
                            newColors[index] = e.target.value;
                            handleColorChange('symbolColors', JSON.stringify(newColors));
                          }}
                          className="h-10 w-full rounded border-0 bg-transparent"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Click on any color swatch to edit</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Effects settings */}
        {activeTab === 'effects' && (
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Sparkles className="mr-2 text-yellow-400" size={18} />
              Special Effects
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Anticipation toggle */}
                <div className="p-4 border border-gray-700 rounded-lg bg-gray-750">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center text-md font-medium text-gray-200">
                      <Zap className="mr-2 text-amber-400" size={18} />
                      Anticipation Effect
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!currentConfig.enableAnticipation} 
                        onChange={(e) => handleBooleanChange('enableAnticipation', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-4">
                    Adds a brief pause and shake effect before revealing winning combinations or features.
                    This builds tension and excitement, especially for big wins.
                  </p>
                  
                  <div className={`space-y-4 ${!currentConfig.enableAnticipation ? 'opacity-50' : ''}`}>
                    {renderParameterSlider('anticipationDuration')}
                    {renderParameterSlider('anticipationShakeIntensity')}
                  </div>
                </div>
                
                {/* Screen shake toggle */}
                <div className="p-4 border border-gray-700 rounded-lg bg-gray-750">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center text-md font-medium text-gray-200">
                      <Sliders className="mr-2 text-purple-400" size={18} />
                      Screen Shake
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!currentConfig.shakeEnabled} 
                        onChange={(e) => handleBooleanChange('shakeEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <p className="text-sm text-gray-400">
                    Adds a subtle shake effect when winning combinations are revealed,
                    enhancing the impact of wins.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Glow effect toggle */}
                <div className="p-4 border border-gray-700 rounded-lg bg-gray-750">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center text-md font-medium text-gray-200">
                      <Sparkles className="mr-2 text-amber-400" size={18} />
                      Glow Effect
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!currentConfig.glowEnabled} 
                        onChange={(e) => handleBooleanChange('glowEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-4">
                    Adds a colorful glow effect to winning symbols, making them stand out.
                    Especially effective for big wins and features.
                  </p>
                  
                  <div className={`${!currentConfig.glowEnabled ? 'opacity-50' : ''}`}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Glow Intensity
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        step="1"
                        value={currentConfig.glowIntensity || 7} 
                        onChange={(e) => handleNumberChange('glowIntensity', e.target.value)}
                        disabled={!currentConfig.glowEnabled}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Subtle</span>
                        <span>Balanced</span>
                        <span>Intense</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Performance warning */}
                <div className="p-4 border border-amber-800 border-opacity-50 rounded-lg bg-amber-900 bg-opacity-20">
                  <div className="flex items-start">
                    <AlertTriangle className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-medium text-amber-400 mb-2">Performance Consideration</h4>
                      <p className="text-sm text-amber-200">
                        Using multiple effects simultaneously can impact performance on lower-end devices.
                        Consider optimizing animations for mobile by reducing effect intensity or disabling
                        certain effects when running on mobile devices.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Layout settings */}
        {activeTab === 'layout' && (
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <LineChart className="mr-2 text-green-400" size={18} />
              Layout Parameters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {renderParameterSlider('symbolWidth')}
                {renderParameterSlider('symbolHeight')}
                {renderParameterSlider('symbolPadding')}
              </div>
              
              <div className="p-4 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-300 mb-2 flex items-center">
                  <Check className="mr-2" size={18} />
                  Layout Recommendations
                </h4>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    Keep symbol dimensions between 80-120px for optimal visibility
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    Use consistent padding (5-15px) between symbols for clean layout
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    Consider screen size variations when setting dimensions
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    Maintain a 1:1 aspect ratio for symbols when possible
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Win type selector and apply button */}
        <div className="mt-8 border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Animation Preview Type</h4>
              <div className="flex flex-wrap gap-2">
                {winTypes.map(type => (
                  <button
                    key={type.value}
                    className={`
                      py-1.5 px-3 rounded text-xs
                      ${resultType === type.value 
                        ? `${type.color} text-white shadow-md` 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                    `}
                    onClick={() => onResultTypeChange(type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center shadow-lg transform transition-transform hover:scale-105"
              onClick={onApplyAnimation}
            >
              <Play className="mr-2" size={18} />
              Preview Animation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnimationControls;