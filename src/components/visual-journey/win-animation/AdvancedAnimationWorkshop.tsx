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
  Check,
  Eye,
  BarChart,
  Gauge,
  Timer,
  Activity,
  Droplets
} from 'lucide-react';
import gsap from 'gsap';
import { PreviewReelConfig, WinResultType } from './PreviewReelController';

// Define a unified configuration interface that encapsulates all animation categories
export interface UnifiedAnimationConfig {
  // Reel Spin Configuration
  spinDuration: number;
  reelStartDelay: number;
  bounceDistance: number;
  bounceDuration: number;
  easeInDuration: number;
  easeOutDuration: number;
  blurAmount: number;
  easeType: string;

  // Anticipation Configuration
  anticipationEnabled: boolean;
  anticipationDuration: number;
  anticipationIntensity: number;
  anticipationShakeEnabled: boolean;
  anticipationShakeAmount: number;
  anticipationFlashEnabled: boolean;
  anticipationFlashCount: number;
  anticipationFlashSpeed: number;
  anticipationSlowmoEnabled: boolean;
  anticipationSlowmoFactor: number;

  // Celebration Configuration
  celebrationEnabled: boolean;
  celebrationDuration: number;
  celebrationIntensity: number;
  celebrationParticles: number;
  celebrationParticleSize: number;
  celebrationParticleSpeed: number;
  celebrationSymbolZoomEnabled: boolean;
  celebrationSymbolZoomScale: number;
  celebrationSymbolRotationEnabled: boolean;
  celebrationSymbolRotationAmount: number;
  celebrationScreenFlashEnabled: boolean;
  celebrationFlashAlpha: number;
  celebrationCameraShakeEnabled: boolean;
  celebrationShakeAmount: number;
  celebrationCameraZoomEnabled: boolean;
  celebrationCameraZoom: number;
  celebrationGlowEnabled: boolean;
  celebrationGlowColor: string;
  celebrationGlowIntensity: number;
  celebrationColorPalette: 'vibrant' | 'subtle' | 'traditional' | 'intense' | 'monochrome';
}

// Parameter control interface
interface ParameterControl {
  key: keyof UnifiedAnimationConfig;
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
  category: 'reel-spin' | 'anticipation' | 'celebration';
  advancedOnly?: boolean;
}

// Parameter controls with professional ranges
const PARAMETER_CONTROLS: ParameterControl[] = [
  // Reel Spin Parameters
  {
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
    description: 'The total time for the reels to complete spinning',
    category: 'reel-spin'
  },
  {
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
    description: 'The time delay between each reel starting to spin',
    category: 'reel-spin'
  },
  {
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
    description: 'How far the reels bounce when stopping',
    category: 'reel-spin'
  },
  {
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
    description: 'How long the bounce effect lasts after reels stop',
    category: 'reel-spin'
  },
  {
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
    description: 'The intensity of motion blur during spinning',
    category: 'reel-spin'
  },
  {
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
    description: 'How long it takes for the reels to accelerate to full speed',
    category: 'reel-spin',
    advancedOnly: true
  },
  {
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
    description: 'How long it takes for the reels to decelerate to a stop',
    category: 'reel-spin',
    advancedOnly: true
  },

  // Anticipation Parameters
  {
    key: 'anticipationDuration',
    label: 'Anticipation Duration',
    min: 0.5,
    max: 5,
    step: 0.1,
    unit: 's',
    professional: {
      min: 1.0,
      max: 3.0,
      warning: 'Best used for big wins and features, can be annoying if too long'
    },
    description: 'Duration of anticipation effect before final reveal',
    category: 'anticipation'
  },
  {
    key: 'anticipationIntensity',
    label: 'Anticipation Intensity',
    min: 1,
    max: 15,
    step: 1,
    unit: '',
    professional: {
      min: 5,
      max: 12,
      warning: 'Higher values create more intense anticipation but can be distracting'
    },
    description: 'Overall intensity of anticipation effects',
    category: 'anticipation'
  },
  {
    key: 'anticipationShakeAmount',
    label: 'Shake Amount',
    min: 0,
    max: 20,
    step: 1,
    unit: 'px',
    professional: {
      min: 3,
      max: 10,
      warning: 'Higher values may be too jarring for players'
    },
    description: 'Intensity of screen shake during anticipation',
    category: 'anticipation'
  },
  {
    key: 'anticipationFlashCount',
    label: 'Flash Count',
    min: 1,
    max: 10,
    step: 1,
    unit: '',
    professional: {
      min: 2,
      max: 5,
      warning: 'Too many flashes can be disorienting'
    },
    description: 'Number of screen flashes during anticipation',
    category: 'anticipation'
  },
  {
    key: 'anticipationFlashSpeed',
    label: 'Flash Speed',
    min: 0.05,
    max: 0.5,
    step: 0.05,
    unit: 's',
    professional: {
      min: 0.1,
      max: 0.3,
      warning: 'Very fast flashes may cause discomfort'
    },
    description: 'Duration of each flash pulse',
    category: 'anticipation',
    advancedOnly: true
  },
  {
    key: 'anticipationSlowmoFactor',
    label: 'Slow Motion Factor',
    min: 0.1,
    max: 1,
    step: 0.1,
    unit: 'x',
    professional: {
      min: 0.3,
      max: 0.7,
      warning: 'Too slow may frustrate players'
    },
    description: 'Slow motion effect speed factor (lower is slower)',
    category: 'anticipation',
    advancedOnly: true
  },

  // Celebration Parameters
  {
    key: 'celebrationDuration',
    label: 'Celebration Duration',
    min: 1,
    max: 10,
    step: 0.5,
    unit: 's',
    professional: {
      min: 2,
      max: 5,
      warning: 'Long celebrations may slow game pace'
    },
    description: 'Duration of win celebration animations',
    category: 'celebration'
  },
  {
    key: 'celebrationIntensity',
    label: 'Celebration Intensity',
    min: 1,
    max: 20,
    step: 1,
    unit: '',
    professional: {
      min: 5,
      max: 15,
      warning: 'High intensity may overwhelm the screen'
    },
    description: 'Overall intensity of celebration effects',
    category: 'celebration'
  },
  {
    key: 'celebrationParticles',
    label: 'Particle Count',
    min: 0,
    max: 500,
    step: 10,
    unit: '',
    professional: {
      min: 50,
      max: 200,
      warning: 'High counts may impact performance'
    },
    description: 'Number of particles in celebration effects',
    category: 'celebration'
  },
  {
    key: 'celebrationParticleSize',
    label: 'Particle Size',
    min: 1,
    max: 20,
    step: 1,
    unit: 'px',
    professional: {
      min: 3,
      max: 10,
      warning: 'Large particles may obscure game elements'
    },
    description: 'Size of particle effects',
    category: 'celebration',
    advancedOnly: true
  },
  {
    key: 'celebrationParticleSpeed',
    label: 'Particle Speed',
    min: 50,
    max: 500,
    step: 10,
    unit: '',
    professional: {
      min: 100,
      max: 300,
      warning: 'Very fast particles may be hard to see'
    },
    description: 'Speed of particle movement',
    category: 'celebration',
    advancedOnly: true
  },
  {
    key: 'celebrationSymbolZoomScale',
    label: 'Symbol Zoom Scale',
    min: 1,
    max: 2,
    step: 0.05,
    unit: 'x',
    professional: {
      min: 1.05,
      max: 1.3,
      warning: 'Extreme zoom may disrupt player experience'
    },
    description: 'Scale factor for winning symbol zoom effect',
    category: 'celebration'
  },
  {
    key: 'celebrationSymbolRotationAmount',
    label: 'Symbol Rotation',
    min: 0,
    max: 90,
    step: 5,
    unit: '°',
    professional: {
      min: 5,
      max: 30,
      warning: 'Extreme rotation may be disorienting'
    },
    description: 'Rotation amount for winning symbols',
    category: 'celebration',
    advancedOnly: true
  },
  {
    key: 'celebrationFlashAlpha',
    label: 'Flash Brightness',
    min: 0,
    max: 1,
    step: 0.05,
    unit: '',
    professional: {
      min: 0.3,
      max: 0.7,
      warning: 'Very bright flashes may cause discomfort'
    },
    description: 'Brightness of screen flash effects',
    category: 'celebration',
    advancedOnly: true
  },
  {
    key: 'celebrationShakeAmount',
    label: 'Camera Shake Amount',
    min: 0,
    max: 30,
    step: 1,
    unit: 'px',
    professional: {
      min: 5,
      max: 15,
      warning: 'Excessive shake may be disorienting'
    },
    description: 'Intensity of camera shake on win',
    category: 'celebration',
    advancedOnly: true
  },
  {
    key: 'celebrationCameraZoom',
    label: 'Camera Zoom',
    min: 1,
    max: 2,
    step: 0.05,
    unit: 'x',
    professional: {
      min: 1.05,
      max: 1.3,
      warning: 'Extreme zoom may disrupt player experience'
    },
    description: 'Camera zoom factor during celebration',
    category: 'celebration',
    advancedOnly: true
  },
  {
    key: 'celebrationGlowIntensity',
    label: 'Glow Intensity',
    min: 0,
    max: 20,
    step: 1,
    unit: '',
    professional: {
      min: 3,
      max: 10,
      warning: 'Excessive glow may obscure symbols'
    },
    description: 'Intensity of glow effect on winning symbols',
    category: 'celebration',
    advancedOnly: true
  }
];

// Available ease functions for GSAP
const EASE_OPTIONS = [
  { value: 'power1.out', label: 'Smooth (Default)', description: 'A simple ease out, good for general use' },
  { value: 'back.out(1.7)', label: 'Overshoot', description: 'Overshoots the target and then comes back' },
  { value: 'elastic.out(1, 0.3)', label: 'Bounce', description: 'Elastic/spring effect that overshoots multiple times' },
  { value: 'sine.inOut', label: 'Gentle', description: 'Very smooth, soft animation with no bounce' },
  { value: 'power4.out', label: 'Anticipation', description: 'Starts slow then speeds up significantly' },
  { value: 'steps(5)', label: 'Stepped', description: 'Moves in distinct steps instead of smoothly' },
  { value: 'custom', label: 'Custom Cubic-Bezier', description: 'Design your own easing curve' }
];

// Available color palettes for celebration effects
const COLOR_PALETTES = [
  { value: 'vibrant', label: 'Vibrant', description: 'Bright, saturated colors for maximum visual impact' },
  { value: 'subtle', label: 'Subtle', description: 'Softer, more muted colors for elegant celebrations' },
  { value: 'traditional', label: 'Traditional', description: 'Classic gold, silver, and bronze casino colors' },
  { value: 'intense', label: 'Intense', description: 'Bold, high-contrast colors for dramatic effect' },
  { value: 'monochrome', label: 'Monochrome', description: 'Single-color variations for a unified look' }
];

interface AdvancedAnimationWorkshopProps {
  // Callback for when settings change
  onConfigChange: (config: Partial<UnifiedAnimationConfig>) => void;
  // Current configuration
  config: Partial<UnifiedAnimationConfig>;
  // The active animation category
  activeCategory: 'reel-spin' | 'anticipation' | 'celebration';
  // Callback to play current animation
  onPlay: () => void;
  // Current view mode (expert or normal)
  expertMode: boolean;
  // Win type for preview
  resultType: WinResultType;
  // Callback to change win type
  onResultTypeChange: (type: WinResultType) => void;
}

const AdvancedAnimationWorkshop: React.FC<AdvancedAnimationWorkshopProps> = ({
  onConfigChange,
  config,
  activeCategory,
  onPlay,
  expertMode,
  resultType,
  onResultTypeChange
}) => {
  // State for warning messages
  const [currentWarning, setCurrentWarning] = useState<string | null>(null);
  // Ref for the easing curve visualization canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Initialize the unified configuration with defaults and provided values
  const [unifiedConfig, setUnifiedConfig] = useState<UnifiedAnimationConfig>({
    // Reel Spin defaults
    spinDuration: 2.0,
    reelStartDelay: 0.2,
    bounceDistance: 20,
    bounceDuration: 0.5,
    easeInDuration: 0.5,
    easeOutDuration: 0.7,
    blurAmount: 10,
    easeType: 'power1.out',
    
    // Anticipation defaults
    anticipationEnabled: true,
    anticipationDuration: 1.5,
    anticipationIntensity: 8,
    anticipationShakeEnabled: true,
    anticipationShakeAmount: 5,
    anticipationFlashEnabled: true,
    anticipationFlashCount: 3,
    anticipationFlashSpeed: 0.2,
    anticipationSlowmoEnabled: true,
    anticipationSlowmoFactor: 0.5,
    
    // Celebration defaults
    celebrationEnabled: true,
    celebrationDuration: 3.0,
    celebrationIntensity: 8,
    celebrationParticles: 100,
    celebrationParticleSize: 7,
    celebrationParticleSpeed: 200,
    celebrationSymbolZoomEnabled: true,
    celebrationSymbolZoomScale: 1.2,
    celebrationSymbolRotationEnabled: true,
    celebrationSymbolRotationAmount: 15,
    celebrationScreenFlashEnabled: true,
    celebrationFlashAlpha: 0.5,
    celebrationCameraShakeEnabled: true,
    celebrationShakeAmount: 5,
    celebrationCameraZoomEnabled: true,
    celebrationCameraZoom: 1.1,
    celebrationGlowEnabled: true,
    celebrationGlowColor: '#ffcc00',
    celebrationGlowIntensity: 3,
    celebrationColorPalette: 'vibrant',
    
    // Apply any provided configurations
    ...config
  });
  
  // Update the unified configuration when the provided config changes
  useEffect(() => {
    setUnifiedConfig(prevConfig => ({
      ...prevConfig,
      ...config
    }));
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
    const points: { x: number, y: number }[] = [];
    const steps = 100;
    
    if (unifiedConfig.easeType !== 'custom') {
      for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        
        let easedValue = 0;
        try {
          // Use GSAP to calculate the eased value
          const ease = gsap.parseEase(unifiedConfig.easeType);
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
    
    // Add a highlight dot for the current position
    const dotPosition = 0.7; // 70% through the animation
    let easedDotPosition = 0;
    
    try {
      // Use GSAP to calculate the eased value
      const ease = gsap.parseEase(unifiedConfig.easeType !== 'custom' ? unifiedConfig.easeType : 'power1.out');
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
    
  }, [unifiedConfig.easeType, canvasRef.current]);
  
  // Cubic bezier function for custom easing visualization
  const cubicBezier = (p0: {x: number, y: number}, p1: {x: number, y: number}, p2: {x: number, y: number}, p3: {x: number, y: number}, t: number): {x: number, y: number} => {
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
  const handleNumberChange = (key: keyof UnifiedAnimationConfig, value: number) => {
    // Check for professional warnings
    const param = PARAMETER_CONTROLS.find(p => p.key === key);
    if (param && param.professional) {
      if (value < param.professional.min || value > param.professional.max) {
        setCurrentWarning(param.professional.warning || null);
      } else {
        setCurrentWarning(null);
      }
    }
    
    // Update unified config
    const newConfig = { ...unifiedConfig, [key]: value };
    setUnifiedConfig(newConfig);
    
    // Send to parent component for saving
    onConfigChange({ [key]: value });
  };
  
  // Handle boolean input changes
  const handleBooleanChange = (key: keyof UnifiedAnimationConfig, checked: boolean) => {
    const newConfig = { ...unifiedConfig, [key]: checked };
    setUnifiedConfig(newConfig);
    onConfigChange({ [key]: checked });
  };
  
  // Handle color input changes
  const handleColorChange = (key: keyof UnifiedAnimationConfig, value: string) => {
    const newConfig = { ...unifiedConfig, [key]: value };
    setUnifiedConfig(newConfig);
    onConfigChange({ [key]: value });
  };
  
  // Handle ease selection
  const handleEaseChange = (easeType: string) => {
    const newConfig = { ...unifiedConfig, easeType };
    setUnifiedConfig(newConfig);
    onConfigChange({ easeType });
  };
  
  // Handle color palette selection
  const handlePaletteChange = (palette: 'vibrant' | 'subtle' | 'traditional' | 'intense' | 'monochrome') => {
    const newConfig = { ...unifiedConfig, celebrationColorPalette: palette };
    setUnifiedConfig(newConfig);
    onConfigChange({ celebrationColorPalette: palette });
  };
  
  // Render a parameter slider with professional range indicator
  const renderParameterSlider = (param: ParameterControl) => {
    // Skip if we're not in expert mode and this is an expert-only parameter
    if (!expertMode && param.advancedOnly) return null;
    
    const value = unifiedConfig[param.key] as number;
    
    // Check if value is undefined (use the parameter's min as default)
    if (value === undefined) return null;
    
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
        
        <div className="relative h-8">
          {/* Range input positioned on top for better touch area */}
          <input 
            type="range" 
            min={param.min} 
            max={param.max} 
            step={param.step}
            value={value} 
            onChange={(e) => handleNumberChange(param.key, parseFloat(e.target.value))}
            className="absolute inset-0 w-full z-20 opacity-0 cursor-pointer"
          />
          
          {/* Visual slider elements positioned underneath */}
          <div className="absolute top-3 left-0 right-0 h-2 bg-gray-700 rounded-full">
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
          </div>
          
          {/* Current position marker - visible thumb */}
          <div 
            className={`absolute top-2.5 z-10 w-3 h-3 rounded-full transform -translate-x-1/2 
              border border-white shadow cursor-pointer ${isOutsideRange ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ left: `${percentage}%` }}
          />
        </div>
        
        {/* Description */}
        <p className="text-xs text-gray-400 mt-1">{param.description}</p>
      </div>
    );
  };
  
  // Render the boolean toggle control
  const renderToggleControl = (key: keyof UnifiedAnimationConfig, label: string, description?: string) => {
    const value = unifiedConfig[key] as boolean;
    
    return (
      <div className="mb-4 flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-300">{label}</label>
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
        <div 
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? 'bg-blue-600' : 'bg-gray-700'
          }`}
          onClick={() => handleBooleanChange(key, !value)}
        >
          <span 
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </div>
      </div>
    );
  };
  
  // Render the reel spin parameters
  const renderReelSpinParameters = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <Clock className="mr-2 text-blue-400" size={18} />
          Reel Spin Parameters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {PARAMETER_CONTROLS
              .filter(param => param.category === 'reel-spin' && (!param.advancedOnly || expertMode))
              .slice(0, Math.ceil(PARAMETER_CONTROLS.filter(p => p.category === 'reel-spin').length / 2))
              .map(param => renderParameterSlider(param))}
          </div>
          
          <div className="space-y-4">
            {PARAMETER_CONTROLS
              .filter(param => param.category === 'reel-spin' && (!param.advancedOnly || expertMode))
              .slice(Math.ceil(PARAMETER_CONTROLS.filter(p => p.category === 'reel-spin').length / 2))
              .map(param => renderParameterSlider(param))}
            
            {/* Easing curve selection and visualization */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Easing Function
              </label>
              <select
                value={unifiedConfig.easeType}
                onChange={(e) => handleEaseChange(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                {EASE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {EASE_OPTIONS.find(o => o.value === unifiedConfig.easeType)?.description || 'Custom easing curve'}
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
    );
  };
  
  // Render the anticipation parameters
  const renderAnticipationParameters = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <Timer className="mr-2 text-purple-400" size={18} />
          Anticipation Parameters
        </h3>
        
        {/* Main toggle for enabling/disabling anticipation */}
        {renderToggleControl('anticipationEnabled', 'Enable Anticipation Effects', 
          'Adds tension and excitement before big wins with special effects')}
        
        {unifiedConfig.anticipationEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {PARAMETER_CONTROLS
                .filter(param => param.category === 'anticipation' && (!param.advancedOnly || expertMode))
                .slice(0, Math.ceil(PARAMETER_CONTROLS.filter(p => p.category === 'anticipation' && (!p.advancedOnly || expertMode)).length / 2))
                .map(param => renderParameterSlider(param))}
              
              {renderToggleControl('anticipationShakeEnabled', 'Enable Screen Shake', 
                'Adds screen shake effect during anticipation')}
            </div>
            
            <div className="space-y-4">
              {PARAMETER_CONTROLS
                .filter(param => param.category === 'anticipation' && (!param.advancedOnly || expertMode))
                .slice(Math.ceil(PARAMETER_CONTROLS.filter(p => p.category === 'anticipation' && (!p.advancedOnly || expertMode)).length / 2))
                .map(param => renderParameterSlider(param))}
              
              {renderToggleControl('anticipationFlashEnabled', 'Enable Flash Effect', 
                'Adds screen flash effects during anticipation')}
              
              {expertMode && renderToggleControl('anticipationSlowmoEnabled', 'Enable Slow Motion', 
                'Slows down the animation during anticipation')}
            </div>
          </div>
        )}
        
        {/* Tips section */}
        <div className="p-4 bg-purple-900 bg-opacity-20 border border-purple-800 rounded-lg mt-4">
          <h4 className="font-medium text-purple-300 mb-2 flex items-center">
            <Eye className="mr-2" size={16} />
            Anticipation Tips
          </h4>
          <ul className="space-y-2 text-sm text-purple-200">
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              Use anticipation primarily for big wins and feature triggers
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              Keep durations under 3 seconds to maintain player engagement
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              Combine visual effects with sound for maximum impact
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              Avoid overusing anticipation for small wins to prevent player frustration
            </li>
          </ul>
        </div>
      </div>
    );
  };
  
  // Render the celebration parameters
  const renderCelebrationParameters = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <Sparkles className="mr-2 text-yellow-400" size={18} />
          Celebration Parameters
        </h3>
        
        {/* Main toggle for enabling/disabling celebration */}
        {renderToggleControl('celebrationEnabled', 'Enable Celebration Effects', 
          'Adds exciting visual effects to celebrate winning combinations')}
        
        {unifiedConfig.celebrationEnabled && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {PARAMETER_CONTROLS
                  .filter(param => param.category === 'celebration' && (!param.advancedOnly || expertMode))
                  .slice(0, 3)
                  .map(param => renderParameterSlider(param))}
                
                {/* Symbol effect toggles */}
                {renderToggleControl('celebrationSymbolZoomEnabled', 'Enable Symbol Zoom', 
                  'Winning symbols grow in size for emphasis')}
                
                {unifiedConfig.celebrationSymbolZoomEnabled && 
                  renderParameterSlider(PARAMETER_CONTROLS.find(p => p.key === 'celebrationSymbolZoomScale')!)}
                
                {renderToggleControl('celebrationGlowEnabled', 'Enable Symbol Glow', 
                  'Adds glowing effect to winning symbols')}
                
                {unifiedConfig.celebrationGlowEnabled && expertMode && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Glow Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="color" 
                        value={unifiedConfig.celebrationGlowColor} 
                        onChange={(e) => handleColorChange('celebrationGlowColor', e.target.value)}
                        className="h-10 w-10 rounded border-0 bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={unifiedConfig.celebrationGlowColor} 
                        onChange={(e) => handleColorChange('celebrationGlowColor', e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm w-36"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Screen effect toggles */}
                {renderToggleControl('celebrationScreenFlashEnabled', 'Enable Screen Flash', 
                  'Adds bright flash effect on wins')}
                
                {renderToggleControl('celebrationCameraShakeEnabled', 'Enable Camera Shake', 
                  'Adds screen shake effect on big wins')}
                
                {unifiedConfig.celebrationCameraShakeEnabled && expertMode && 
                  renderParameterSlider(PARAMETER_CONTROLS.find(p => p.key === 'celebrationShakeAmount')!)}
                
                {renderToggleControl('celebrationCameraZoomEnabled', 'Enable Camera Zoom', 
                  'Camera zooms in on winning symbols')}
                
                {unifiedConfig.celebrationCameraZoomEnabled && 
                  renderParameterSlider(PARAMETER_CONTROLS.find(p => p.key === 'celebrationCameraZoom')!)}
                
                {renderToggleControl('celebrationSymbolRotationEnabled', 'Enable Symbol Rotation', 
                  'Winning symbols rotate for added emphasis')}
                
                {unifiedConfig.celebrationSymbolRotationEnabled && expertMode && 
                  renderParameterSlider(PARAMETER_CONTROLS.find(p => p.key === 'celebrationSymbolRotationAmount')!)}
              </div>
            </div>
            
            {/* Particle system configuration */}
            {renderParameterSlider(PARAMETER_CONTROLS.find(p => p.key === 'celebrationParticles')!)}
            
            {expertMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  {renderParameterSlider(PARAMETER_CONTROLS.find(p => p.key === 'celebrationParticleSize')!)}
                </div>
                <div>
                  {renderParameterSlider(PARAMETER_CONTROLS.find(p => p.key === 'celebrationParticleSpeed')!)}
                </div>
              </div>
            )}
            
            {/* Color palette selection */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Color Palette
              </label>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {COLOR_PALETTES.map(palette => (
                  <div 
                    key={palette.value}
                    className={`rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-700 ${
                      unifiedConfig.celebrationColorPalette === palette.value
                        ? 'bg-blue-900 border-2 border-blue-600'
                        : 'bg-gray-800 border border-gray-700'
                    }`}
                    onClick={() => handlePaletteChange(palette.value as any)}
                  >
                    <div className="flex justify-center mb-2">
                      {/* Color sample visual representation */}
                      <div className="flex space-x-1">
                        {palette.value === 'vibrant' && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          </>
                        )}
                        {palette.value === 'subtle' && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                            <div className="w-3 h-3 rounded-full bg-indigo-300"></div>
                            <div className="w-3 h-3 rounded-full bg-purple-200"></div>
                            <div className="w-3 h-3 rounded-full bg-pink-200"></div>
                          </>
                        )}
                        {palette.value === 'traditional' && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-700"></div>
                          </>
                        )}
                        {palette.value === 'intense' && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-red-600"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-purple-700"></div>
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          </>
                        )}
                        {palette.value === 'monochrome' && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-center text-sm font-medium">
                      {palette.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Performance warning */}
        <div className="p-4 bg-yellow-900 bg-opacity-20 border border-yellow-800 rounded-lg mt-4">
          <div className="flex items-start">
            <AlertTriangle className="text-yellow-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-yellow-400 mb-2">Performance Consideration</h4>
              <p className="text-sm text-yellow-200">
                Using many particle effects and camera movements simultaneously can impact performance on mobile devices.
                For optimal mobile performance, consider reducing particle count to under 100 and limiting camera effects.
              </p>
            </div>
          </div>
        </div>
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
      
      {/* Main content */}
      <div className="p-6">
        {/* Render different parameters based on active category */}
        {activeCategory === 'reel-spin' && renderReelSpinParameters()}
        {activeCategory === 'anticipation' && renderAnticipationParameters()}
        {activeCategory === 'celebration' && renderCelebrationParameters()}
        
        {/* Expert mode indicator */}
        {expertMode && (
          <div className="mt-6 mb-6 p-3 bg-blue-900 bg-opacity-30 border border-blue-800 rounded-lg">
            <div className="flex items-center">
              <Gauge className="text-blue-500 mr-2" size={18} />
              <p className="text-blue-300 text-sm">
                <span className="font-semibold">Expert Mode Active:</span> Advanced parameters are now visible for maximum customization.
              </p>
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
              onClick={onPlay}
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

export default AdvancedAnimationWorkshop;