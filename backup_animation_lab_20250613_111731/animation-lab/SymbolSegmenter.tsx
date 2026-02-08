import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { analyzeSymbolWithGPTVision, percentageToPixels, percentageBoundsToPixels, WingSegmentationResult } from '../../utils/gptVisionClient';

interface SegmentationResult {
  body: string; // Base64 image of body
  leftWing: string; // Base64 image of left wing
  rightWing: string; // Base64 image of right wing
  segments: Array<{
    id: string;
    name: string;
    image: string;
    anchorPoint: { x: number; y: number };
    attachmentPoint: { x: number; y: number };
    zIndex: number;
  }>;
}

interface SymbolSegmenterProps {
  symbolImage: string;
  onSegmentationComplete: (result: SegmentationResult) => void;
}

const SymbolSegmenter: React.FC<SymbolSegmenterProps> = ({
  symbolImage,
  onSegmentationComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [previewSegments, setPreviewSegments] = useState<any[]>([]);

  // Real GPT-4 Vision segmentation
  const performSegmentation = async () => {
    setIsSegmenting(true);
    
    try {
      console.log('[Segmentation] Starting GPT-4 Vision analysis...');
      
      // Step 1: Analyze with GPT-4 Vision
      const visionResult = await analyzeSymbolWithGPTVision(symbolImage);
      console.log('[Segmentation] Vision analysis complete:', visionResult);
      
      // Step 2: Load the original image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = symbolImage;
      });

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Step 3: Create segments using GPT-4 Vision data
      const segments = await createIntelligentSegments(canvas, ctx, img, visionResult);
      
      setPreviewSegments(segments);
      
      // Convert segments to base64
      const result: SegmentationResult = {
        body: segments[0].image,
        leftWing: segments[1].image,
        rightWing: segments[2].image,
        segments: segments
      };
      
      onSegmentationComplete(result);
      
    } catch (error) {
      console.error('Segmentation failed:', error);
      alert(`Failed to segment symbol: ${error.message}. Please try again.`);
    } finally {
      setIsSegmenting(false);
    }
  };

  // Create segments using GPT-4 Vision analysis
  const createIntelligentSegments = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement, visionResult: WingSegmentationResult) => {
    const width = img.width;
    const height = img.height;
    
    console.log('[Segmentation] Creating intelligent segments with dimensions:', width, 'x', height);
    
    // Convert percentage coordinates to pixels
    const bodyCenter = percentageToPixels(visionResult.bodyCenter, width, height);
    const leftWingBounds = percentageBoundsToPixels(visionResult.leftWing.bounds, width, height);
    const rightWingBounds = percentageBoundsToPixels(visionResult.rightWing.bounds, width, height);
    const leftAttachment = percentageToPixels(visionResult.leftWing.attachmentPoint, width, height);
    const rightAttachment = percentageToPixels(visionResult.rightWing.attachmentPoint, width, height);
    
    console.log('[Segmentation] Converted coordinates:', {
      bodyCenter,
      leftWingBounds,
      rightWingBounds,
      leftAttachment,
      rightAttachment
    });
    
    const segments = [];
    
    // Body segment - create clean body without wings
    const bodyCanvas = document.createElement('canvas');
    const bodyCtx = bodyCanvas.getContext('2d')!;
    bodyCanvas.width = width;
    bodyCanvas.height = height;
    
    // First draw the original image
    bodyCtx.drawImage(img, 0, 0);
    
    // Create body mask using GPT-4 Vision analysis
    const bodyMask = createVisionBodyMask(bodyCtx, width, height, bodyCenter, visionResult.confidence);
    applyMask(bodyCtx, bodyMask, width, height);
    
    segments.push({
      id: 'body',
      name: 'Body',
      image: bodyCanvas.toDataURL(),
      anchorPoint: { x: 0.5, y: 0.5 },
      attachmentPoint: { x: 0.5, y: 0.5 },
      zIndex: 1
    });
    
    // Left Wing using GPT-4 Vision contour points
    const leftWingCanvas = document.createElement('canvas');
    const leftWingCtx = leftWingCanvas.getContext('2d')!;
    leftWingCanvas.width = width;
    leftWingCanvas.height = height;
    
    leftWingCtx.drawImage(img, 0, 0);
    const leftWingMask = createVisionWingMask(leftWingCtx, width, height, 'left', visionResult);
    applyMask(leftWingCtx, leftWingMask, width, height);
    
    // Calculate anchor point based on attachment
    const leftAnchorX = leftAttachment.x / width;
    const leftAnchorY = leftAttachment.y / height;
    
    segments.push({
      id: 'leftWing',
      name: 'Left Wing',
      image: leftWingCanvas.toDataURL(),
      anchorPoint: { x: leftAnchorX, y: leftAnchorY },
      attachmentPoint: { x: leftAnchorX, y: leftAnchorY },
      zIndex: 0
    });
    
    // Right Wing using GPT-4 Vision contour points
    const rightWingCanvas = document.createElement('canvas');
    const rightWingCtx = rightWingCanvas.getContext('2d')!;
    rightWingCanvas.width = width;
    rightWingCanvas.height = height;
    
    rightWingCtx.drawImage(img, 0, 0);
    const rightWingMask = createVisionWingMask(rightWingCtx, width, height, 'right', visionResult);
    applyMask(rightWingCtx, rightWingMask, width, height);
    
    // Calculate anchor point based on attachment  
    const rightAnchorX = rightAttachment.x / width;
    const rightAnchorY = rightAttachment.y / height;
    
    segments.push({
      id: 'rightWing',
      name: 'Right Wing',
      image: rightWingCanvas.toDataURL(),
      anchorPoint: { x: rightAnchorX, y: rightAnchorY },
      attachmentPoint: { x: rightAnchorX, y: rightAnchorY },
      zIndex: 0
    });
    
    console.log('[Segmentation] Created', segments.length, 'intelligent segments');
    return segments;
  };

  // Keep old function as fallback
  const createMockSegments = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    const width = img.width;
    const height = img.height;
    
    // Get image data for intelligent segmentation
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Create temporary canvases for each segment
    const segments = [];
    
    // Analyze the image to find the center body mass
    const bodyCenter = findBodyCenter(data, width, height);
    const wingDetection = detectWingAreas(data, width, height, bodyCenter);
    
    // Body (center portion with intelligent masking)
    const bodyCanvas = document.createElement('canvas');
    const bodyCtx = bodyCanvas.getContext('2d')!;
    bodyCanvas.width = width;
    bodyCanvas.height = height;
    
    // Create body mask - keep center oval/circular area
    bodyCtx.drawImage(img, 0, 0);
    const bodyMask = createBodyMask(bodyCtx, width, height, bodyCenter);
    applyMask(bodyCtx, bodyMask, width, height);
    
    segments.push({
      id: 'body',
      name: 'Body',
      image: bodyCanvas.toDataURL(),
      anchorPoint: { x: 0.5, y: 0.5 },
      attachmentPoint: { x: 0.5, y: 0.5 },
      zIndex: 1
    });
    
    // Left Wing (intelligent wing extraction)
    const leftWingCanvas = document.createElement('canvas');
    const leftWingCtx = leftWingCanvas.getContext('2d')!;
    leftWingCanvas.width = width;
    leftWingCanvas.height = height;
    
    leftWingCtx.drawImage(img, 0, 0);
    const leftWingMask = createWingMask(leftWingCtx, width, height, 'left', wingDetection);
    applyMask(leftWingCtx, leftWingMask, width, height);
    
    segments.push({
      id: 'leftWing',
      name: 'Left Wing',
      image: leftWingCanvas.toDataURL(),
      anchorPoint: { x: 0.9, y: 0.5 }, // Rotate from right edge (attachment to body)
      attachmentPoint: { x: 0.9, y: 0.5 },
      zIndex: 0
    });
    
    // Right Wing (intelligent wing extraction)
    const rightWingCanvas = document.createElement('canvas');
    const rightWingCtx = rightWingCanvas.getContext('2d')!;
    rightWingCanvas.width = width;
    rightWingCanvas.height = height;
    
    rightWingCtx.drawImage(img, 0, 0);
    const rightWingMask = createWingMask(rightWingCtx, width, height, 'right', wingDetection);
    applyMask(rightWingCtx, rightWingMask, width, height);
    
    segments.push({
      id: 'rightWing',
      name: 'Right Wing',
      image: rightWingCanvas.toDataURL(),
      anchorPoint: { x: 0.1, y: 0.5 }, // Rotate from left edge (attachment to body)
      attachmentPoint: { x: 0.1, y: 0.5 },
      zIndex: 0
    });
    
    return segments;
  };

  // Find the center mass of the body (densest pixel area)
  const findBodyCenter = (data: Uint8ClampedArray, width: number, height: number) => {
    let totalMass = 0;
    let centerX = 0;
    let centerY = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const alpha = data[i + 3];
        if (alpha > 128) { // Non-transparent pixel
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const mass = alpha * (brightness / 255);
          totalMass += mass;
          centerX += x * mass;
          centerY += y * mass;
        }
      }
    }
    
    return {
      x: centerX / totalMass,
      y: centerY / totalMass
    };
  };

  // Detect wing areas based on pixel density and distance from center
  const detectWingAreas = (data: Uint8ClampedArray, width: number, height: number, bodyCenter: {x: number, y: number}) => {
    const leftWingBounds = { minX: width, maxX: 0, minY: height, maxY: 0 };
    const rightWingBounds = { minX: width, maxX: 0, minY: height, maxY: 0 };
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const alpha = data[i + 3];
        if (alpha > 128) {
          const distanceFromCenter = Math.sqrt((x - bodyCenter.x) ** 2 + (y - bodyCenter.y) ** 2);
          
          // If far from center and on left side = left wing
          if (x < bodyCenter.x && distanceFromCenter > width * 0.15) {
            leftWingBounds.minX = Math.min(leftWingBounds.minX, x);
            leftWingBounds.maxX = Math.max(leftWingBounds.maxX, x);
            leftWingBounds.minY = Math.min(leftWingBounds.minY, y);
            leftWingBounds.maxY = Math.max(leftWingBounds.maxY, y);
          }
          // If far from center and on right side = right wing
          else if (x > bodyCenter.x && distanceFromCenter > width * 0.15) {
            rightWingBounds.minX = Math.min(rightWingBounds.minX, x);
            rightWingBounds.maxX = Math.max(rightWingBounds.maxX, x);
            rightWingBounds.minY = Math.min(rightWingBounds.minY, y);
            rightWingBounds.maxY = Math.max(rightWingBounds.maxY, y);
          }
        }
      }
    }
    
    return { leftWingBounds, rightWingBounds };
  };

  // Create a mask for the body (elliptical/circular area in center)
  const createBodyMask = (ctx: CanvasRenderingContext2D, width: number, height: number, bodyCenter: {x: number, y: number}) => {
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCanvas.width = width;
    maskCanvas.height = height;
    
    // Create elliptical body mask
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);
    
    maskCtx.fillStyle = 'white';
    maskCtx.beginPath();
    // Body ellipse - about 40% of width and 60% of height
    const bodyWidth = width * 0.35;
    const bodyHeight = height * 0.55;
    maskCtx.ellipse(bodyCenter.x, bodyCenter.y, bodyWidth, bodyHeight, 0, 0, 2 * Math.PI);
    maskCtx.fill();
    
    return maskCanvas;
  };

  // Create a mask for wings (everything outside body area on specific side)
  const createWingMask = (ctx: CanvasRenderingContext2D, width: number, height: number, side: 'left' | 'right', wingDetection: any) => {
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCanvas.width = width;
    maskCanvas.height = height;
    
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);
    
    maskCtx.fillStyle = 'white';
    
    const bounds = side === 'left' ? wingDetection.leftWingBounds : wingDetection.rightWingBounds;
    
    // Create wing mask based on detected bounds with some smoothing
    if (bounds.minX < width) { // Valid bounds detected
      const wingX = bounds.minX;
      const wingY = bounds.minY;
      const wingWidth = bounds.maxX - bounds.minX;
      const wingHeight = bounds.maxY - bounds.minY;
      
      // Create a more organic wing shape
      maskCtx.beginPath();
      if (side === 'left') {
        // Left wing - curved shape
        maskCtx.moveTo(wingX, wingY + wingHeight * 0.5);
        maskCtx.quadraticCurveTo(wingX + wingWidth * 0.3, wingY, wingX + wingWidth, wingY + wingHeight * 0.3);
        maskCtx.quadraticCurveTo(wingX + wingWidth * 0.7, wingY + wingHeight * 0.7, wingX + wingWidth, wingY + wingHeight);
        maskCtx.quadraticCurveTo(wingX + wingWidth * 0.5, wingY + wingHeight * 0.8, wingX, wingY + wingHeight * 0.5);
      } else {
        // Right wing - mirrored curved shape
        maskCtx.moveTo(wingX + wingWidth, wingY + wingHeight * 0.5);
        maskCtx.quadraticCurveTo(wingX + wingWidth * 0.7, wingY, wingX, wingY + wingHeight * 0.3);
        maskCtx.quadraticCurveTo(wingX + wingWidth * 0.3, wingY + wingHeight * 0.7, wingX, wingY + wingHeight);
        maskCtx.quadraticCurveTo(wingX + wingWidth * 0.5, wingY + wingHeight * 0.8, wingX + wingWidth, wingY + wingHeight * 0.5);
      }
      maskCtx.closePath();
      maskCtx.fill();
    }
    
    return maskCanvas;
  };

  // Create very conservative center body mask  
  const createCleanBodyMask = (ctx: CanvasRenderingContext2D, width: number, height: number, visionResult: WingSegmentationResult) => {
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCanvas.width = width;
    maskCanvas.height = height;
    
    // Start with black (remove everything)
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);
    
    // Draw white body area - only the center 20% of the image
    maskCtx.fillStyle = 'white';
    
    // Very conservative: only the center 20% strip to avoid any wing overlap
    const centerStart = width * 0.4; // Start at 40%
    const centerWidth = width * 0.2; // Only 20% width
    
    maskCtx.fillRect(centerStart, 0, centerWidth, height);
    
    return maskCanvas;
  };

  // Create body mask using GPT-4 Vision analysis
  const createVisionBodyMask = (ctx: CanvasRenderingContext2D, width: number, height: number, bodyCenter: {x: number, y: number}, confidence: number) => {
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCanvas.width = width;
    maskCanvas.height = height;
    
    // Create body mask
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);
    
    maskCtx.fillStyle = 'white';
    maskCtx.beginPath();
    
    // Adaptive body size based on confidence
    const baseBodyWidth = width * 0.3;
    const baseBodyHeight = height * 0.4;
    const confidenceAdjustment = 0.8 + (confidence * 0.4); // Scale 0.8-1.2 based on confidence
    
    const bodyWidth = baseBodyWidth * confidenceAdjustment;
    const bodyHeight = baseBodyHeight * confidenceAdjustment;
    
    maskCtx.ellipse(bodyCenter.x, bodyCenter.y, bodyWidth, bodyHeight, 0, 0, 2 * Math.PI);
    maskCtx.fill();
    
    return maskCanvas;
  };

  // Create aggressive wing mask that only takes outer wing areas
  const createCleanWingMask = (ctx: CanvasRenderingContext2D, width: number, height: number, side: 'left' | 'right', visionResult: WingSegmentationResult) => {
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCanvas.width = width;
    maskCanvas.height = height;
    
    // Start with black (remove everything)
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);
    
    // Draw white area for ONLY the outer wing areas
    maskCtx.fillStyle = 'white';
    
    const bodyCenter = percentageToPixels(visionResult.bodyCenter, width, height);
    
    if (side === 'left') {
      // Left side: only the leftmost 40% of the image
      maskCtx.fillRect(0, 0, width * 0.4, height);
    } else {
      // Right side: only the rightmost 40% of the image
      maskCtx.fillRect(width * 0.6, 0, width * 0.4, height);
    }
    
    return maskCanvas;
  };

  // Create wing mask using GPT-4 Vision contour points
  const createVisionWingMask = (ctx: CanvasRenderingContext2D, width: number, height: number, side: 'left' | 'right', visionResult: WingSegmentationResult) => {
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCanvas.width = width;
    maskCanvas.height = height;
    
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);
    
    maskCtx.fillStyle = 'white';
    maskCtx.beginPath();
    
    const wing = side === 'left' ? visionResult.leftWing : visionResult.rightWing;
    const contourPoints = wing.contourPoints;
    
    if (contourPoints && contourPoints.length > 0) {
      // Use GPT-4 Vision contour points
      const firstPoint = percentageToPixels(contourPoints[0], width, height);
      maskCtx.moveTo(firstPoint.x, firstPoint.y);
      
      for (let i = 1; i < contourPoints.length; i++) {
        const point = percentageToPixels(contourPoints[i], width, height);
        maskCtx.lineTo(point.x, point.y);
      }
      
      maskCtx.closePath();
    } else {
      // Fallback to bounds-based wing shape if no contour points
      const bounds = percentageBoundsToPixels(wing.bounds, width, height);
      const wingX = bounds.x;
      const wingY = bounds.y;
      const wingWidth = bounds.width;
      const wingHeight = bounds.height;
      
      // Create organic wing shape based on bounds
      if (side === 'left') {
        maskCtx.moveTo(wingX, wingY + wingHeight * 0.5);
        maskCtx.quadraticCurveTo(wingX + wingWidth * 0.2, wingY, wingX + wingWidth, wingY + wingHeight * 0.2);
        maskCtx.quadraticCurveTo(wingX + wingWidth * 0.8, wingY + wingHeight * 0.8, wingX + wingWidth, wingY + wingHeight);
        maskCtx.quadraticCurveTo(wingX + wingWidth * 0.4, wingY + wingHeight * 0.9, wingX, wingY + wingHeight * 0.5);
      } else {
        maskCtx.moveTo(wingX + wingWidth, wingY + wingHeight * 0.5);
        maskCtx.quadraticCurveTo(wingX + wingWidth * 0.8, wingY, wingX, wingY + wingHeight * 0.2);
        maskCtx.quadraticCurveTo(wingX + wingWidth * 0.2, wingY + wingHeight * 0.8, wingX, wingY + wingHeight);
        maskCtx.quadraticCurveTo(wingX + wingWidth * 0.6, wingY + wingHeight * 0.9, wingX + wingWidth, wingY + wingHeight * 0.5);
      }
      maskCtx.closePath();
    }
    
    maskCtx.fill();
    return maskCanvas;
  };

  // Apply mask to canvas
  const applyMask = (ctx: CanvasRenderingContext2D, mask: HTMLCanvasElement, width: number, height: number) => {
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        🔧 Symbol Segmentation
        <span className="text-sm font-normal text-gray-600 ml-2">
          (GPT-4 Vision AI)
        </span>
      </h3>
      
      <div className="space-y-4">
        {/* Original Image */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Original Symbol</p>
          <img 
            src={symbolImage} 
            alt="Original Symbol" 
            className="w-32 h-32 object-contain border border-gray-200 rounded mx-auto"
          />
        </div>
        
        {/* Segmentation Button */}
        <button
          onClick={performSegmentation}
          disabled={isSegmenting}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isSegmenting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{import.meta.env.VITE_OPENAI_API_KEY ? 'GPT-4 Vision Analyzing...' : 'AI Analyzing...'}</span>
            </>
          ) : (
            <>
              <span>🤖</span>
              <span>{import.meta.env.VITE_OPENAI_API_KEY ? 'AI Segment Wings' : 'Smart Segment Wings'}</span>
            </>
          )}
        </button>
        
        {/* Preview Segments */}
        {previewSegments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">✅ Segmentation Complete:</p>
            <div className="grid grid-cols-3 gap-2">
              {previewSegments.map((segment) => (
                <div key={segment.id} className="text-center">
                  <img 
                    src={segment.image} 
                    alt={segment.name}
                    className="w-20 h-20 object-contain border border-gray-200 rounded mx-auto"
                  />
                  <p className="text-xs text-gray-600 mt-1">{segment.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Hidden canvas for processing */}
        <canvas 
          ref={canvasRef} 
          className="hidden"
        />
        
        <div className={`p-2 rounded text-xs ${
          import.meta.env.VITE_OPENAI_API_KEY 
            ? 'bg-blue-50 text-blue-700' 
            : 'bg-orange-50 text-orange-700'
        }`}>
          {import.meta.env.VITE_OPENAI_API_KEY ? (
            <>🧠 <strong>GPT-4 Vision:</strong> AI analyzes your symbol to identify wing shapes and attachment points for cinema-quality animation!</>
          ) : (
            <>🔧 <strong>Enhanced Fallback:</strong> Smart algorithm creates realistic wing segments and attachment points. Add VITE_OPENAI_API_KEY for GPT-4 Vision!</>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymbolSegmenter;