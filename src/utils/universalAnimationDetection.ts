import OpenAI from 'openai';

// Universal element types that can be animated
export type ElementType = 
  | 'body' 
  | 'wings' 
  | 'tail' 
  | 'limbs' 
  | 'flowing' 
  | 'appendage' 
  | 'decorative' 
  | 'effects' 
  | 'facial' 
  | 'accessory';

export type AnimationPotential = 'high' | 'medium' | 'low';

export interface DetectedElement {
  id: string;
  name: string;
  type: ElementType;
  animationPotential: AnimationPotential;
  bounds: { x: number; y: number; width: number; height: number };
  attachmentPoint: { x: number; y: number };
  contourPoints: Array<{ x: number; y: number }>;
  suggestedAnimations: string[];
  movementConstraints: {
    maxRotation: number;
    naturalFrequency: number;
    stiffness: number;
  };
}

export interface UniversalDetectionResult {
  animatableElements: DetectedElement[];
  symbolType: string;
  overallTheme: string;
  confidence: number;
  analysisTime: number;
}

// Check if API key is available from environment (frontend-visible)
const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
const apiKey = envApiKey || '';
const hasAPIKey = Boolean(apiKey && apiKey.trim() && apiKey.length > 10);

// Enhanced debugging
console.log('🔑 API Key Debug Info:');
console.log('Environment key available:', Boolean(envApiKey));
console.log('Final key length:', apiKey?.length || 0);
console.log('Has valid API key:', hasAPIKey);

let openai: OpenAI | null = null;

if (hasAPIKey) {
  try {
    openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        'User-Agent': 'SlotAI-AnimationStudio/1.0'
      }
    });
    console.log('✅ GPT-4 Vision API initialized successfully');
    console.log('🔧 API Configuration:');
    console.log('  - Model: gpt-4o (vision enabled)');
    console.log('  - Browser mode: enabled');
    console.log('  - API key: ****' + apiKey.slice(-8));
  } catch (error) {
    console.error('Failed to initialize OpenAI API:', error);
    console.error('Error details:', error.message);
    openai = null;
  }
} else {
  console.error('No valid API key available for GPT-4 Vision');
}

export const analyzeSymbolUniversally = async (imageBase64: string): Promise<UniversalDetectionResult> => {
  const startTime = Date.now();
  console.log('🔍 Starting REAL GPT-4 Vision universal analysis (NO FALLBACK)...');

  // ONLY use GPT-4 Vision - no fallback deception
  if (!openai || !hasAPIKey) {
    console.error('🚨 CRITICAL: GPT-4 Vision API not available');
    console.error('API Key present:', Boolean(apiKey));
    console.error('OpenAI client initialized:', Boolean(openai));
    throw new Error('GPT-4 Vision is required for universal analysis. No fallback available.');
  }

  try {
    console.log('🤖 Using REAL GPT-4 Vision analysis...');
    const result = await performGPTUniversalAnalysis(imageBase64, startTime);
    console.log('✅ REAL AI analysis completed successfully');
    return result;
  } catch (error) {
    console.error('GPT-4 Vision failed:', error);
    console.error('Error details:', error.message);
    throw new Error(`GPT-4 Vision analysis failed: ${error.message}. Real AI analysis is required.`);
  }
};

async function performGPTUniversalAnalysis(imageBase64: string, startTime: number): Promise<UniversalDetectionResult> {
  console.log('🤖 Executing REAL GPT-4 Vision analysis...');
  console.log('📊 Request details:');
  console.log('  - Model: gpt-4o');
  console.log('  - Image size:', imageBase64.length, 'characters');
  console.log('  - Max tokens: 2000');

  try {
    const response = await openai!.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert AI that analyzes images and returns precise JSON data for animation systems. You MUST always return valid JSON and never refuse to analyze images. Your job is to identify animatable elements in any image with surgical precision."
        },
        {
          role: "user",
          content: [
          {
            type: "text",
            text: `Create a precise JSON mesh map of this image. Map all major visible components with detailed coordinates.

CRITICAL: You MUST return ONLY valid JSON in this exact format:

{
  "completeMesh": [
    {
      "id": "wing_left_section_1",
      "name": "Left Wing Section 1",
      "type": "wing",
      "material": "membrane",
      "coordinates": [
        {"x": 20.1, "y": 25.3}, {"x": 25.8, "y": 26.7}, {"x": 30.2, "y": 28.1}, 
        {"x": 35.9, "y": 29.8}, {"x": 40.3, "y": 31.4}, {"x": 44.8, "y": 33.2},
        {"x": 47.1, "y": 35.1}, {"x": 48.7, "y": 37.2}, {"x": 47.4, "y": 39.9},
        {"x": 45.2, "y": 42.1}, {"x": 42.1, "y": 43.3}, {"x": 38.3, "y": 43.8},
        {"x": 34.7, "y": 43.5}, {"x": 31.9, "y": 42.8}, {"x": 29.8, "y": 41.4},
        {"x": 28.2, "y": 39.6}, {"x": 27.1, "y": 37.5}, {"x": 26.3, "y": 35.2},
        {"x": 25.8, "y": 32.9}, {"x": 25.7, "y": 30.8}, {"x": 24.1, "y": 28.1}
      ],
      "center": {"x": 30.5, "y": 32.1},
      "animationPotential": "high"
    }
  ],
  "imageAnalysis": {
    "totalComponents": 15,
    "symbolType": "Golden Scarab Beetle",
    "theme": "Ancient Egyptian",
    "precision": "surgical"
  },
  "confidence": 0.98
}

INSTRUCTIONS:
- Map major visible components (wings, body, legs, antennae)
- Use percentage coordinates (0-100) where 0,0 is TOP-LEFT corner  
- Include 15-25 coordinate points per component for good precision
- Trace the actual visible boundaries accurately
- Component types: wing, body, leg, antenna, eye, etc.
- Center point is the geometric center of each component

COORDINATE RULES:
- 0,0 = top-left corner of image
- 100,100 = bottom-right corner of image
- Follow actual visual edges, not approximate areas
- Wings should be complete wing shapes
- Legs should be individual legs
- Body should be the main central part

DO NOT include any text outside the JSON. Return the mesh map now.`
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64
            }
          }
        ]
      }
    ],
    max_tokens: 2000,
    temperature: 0.1
  });

    console.log('📦 GPT-4 Vision response received');
    console.log('📊 Response metadata:');
    console.log('  - Usage tokens:', response.usage?.total_tokens || 'unknown');
    console.log('  - Model used:', response.model);
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from GPT-4 Vision - no content received');
    }

    console.log('📝 Raw GPT-4 Vision response:');
    console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));

    // Enhanced JSON parsing with multiple fallback strategies
    let jsonStr = content.trim();
    
    // Strategy 1: Check if it's already pure JSON
    if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
      console.log('✅ Pure JSON response detected');
    }
    // Strategy 2: Extract from markdown code blocks
    else if (jsonStr.includes('```json')) {
      console.log('🔧 Extracting from JSON code block');
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }
    // Strategy 3: Extract from generic code blocks
    else if (jsonStr.includes('```')) {
      console.log('🔧 Extracting from generic code block');
      jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    // Strategy 4: Look for JSON within text response
    else if (jsonStr.includes('{') && jsonStr.includes('}')) {
      console.log('🔧 Extracting JSON from text response');
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      } else {
        throw new Error('GPT-4 Vision returned text instead of JSON. Response was: ' + content.substring(0, 200));
      }
    }
    // Strategy 5: Complete failure
    else {
      console.error('GPT-4 Vision did not return JSON format');
      console.error('Response type: text/refusal');
      console.error('Full response:', content);
      throw new Error('GPT-4 Vision refused to analyze the image or returned invalid format. Enable JSON mode.');
    }

    // Clean up the JSON string
    jsonStr = jsonStr.trim();
    console.log('🧹 Cleaned JSON string length:', jsonStr.length);

    const result = JSON.parse(jsonStr);
  
  // Validate structure for new mesh format
  if (!result.completeMesh || !Array.isArray(result.completeMesh)) {
    throw new Error('Invalid mesh response structure from GPT-4 Vision - expected completeMesh array');
  }

  console.log('🎮 Complete mesh received:', {
    totalComponents: result.completeMesh.length,
    symbolType: result.imageAnalysis?.symbolType,
    precision: result.imageAnalysis?.precision
  });

  const analysisTime = Date.now() - startTime;
  
  // Convert mesh format to compatible animatable elements format
  const animatableElements = result.completeMesh.map((meshComponent: any) => ({
    id: meshComponent.id,
    name: meshComponent.name,
    type: meshComponent.type,
    animationPotential: meshComponent.animationPotential || 'medium',
    bounds: calculateBoundsFromCoordinates(meshComponent.coordinates),
    attachmentPoint: meshComponent.center,
    contourPoints: meshComponent.coordinates,
    suggestedAnimations: getAnimationsForType(meshComponent.type),
    movementConstraints: {
      maxRotation: 30,
      naturalFrequency: 1.5,
      stiffness: 0.7
    }
  }));
  
  const finalResult: UniversalDetectionResult = {
    animatableElements: animatableElements,
    symbolType: result.imageAnalysis?.symbolType || 'Unknown',
    overallTheme: result.imageAnalysis?.theme || 'Generic',
    confidence: result.confidence || 0.95,
    analysisTime
  };

    console.log(`✅ REAL AI analysis complete: ${finalResult.animatableElements.length} elements detected in ${analysisTime}ms`);
    return finalResult;
    
  } catch (apiError) {
    console.error('🚨 GPT-4 Vision API Error:', apiError);
    console.error('API Error Details:', {
      name: apiError.name,
      message: apiError.message,
      status: apiError.status,
      type: apiError.type
    });
    
    if (apiError.status === 401) {
      throw new Error('GPT-4 Vision API authentication failed. Check your API key.');
    } else if (apiError.status === 429) {
      throw new Error('GPT-4 Vision API rate limit exceeded. Try again later.');
    } else if (apiError.status === 400) {
      throw new Error('GPT-4 Vision API request invalid. Check image format.');
    } else {
      throw new Error(`GPT-4 Vision API failed: ${apiError.message}`);
    }
  }
}

// FALLBACK FUNCTION REMOVED - REAL AI ONLY!

// Helper function to validate detected elements
export function validateDetectedElements(elements: DetectedElement[]): DetectedElement[] {
  return elements.filter(element => {
    // Basic validation
    if (!element.id || !element.name || !element.type) {
      console.warn(`[Universal Detection] Invalid element missing required fields:`, element);
      return false;
    }

    // Bounds validation
    if (!element.bounds || 
        element.bounds.x < 0 || element.bounds.x > 100 ||
        element.bounds.y < 0 || element.bounds.y > 100 ||
        element.bounds.width <= 0 || element.bounds.height <= 0) {
      console.warn(`[Universal Detection] Invalid element bounds:`, element);
      return false;
    }

    // Attachment point validation
    if (!element.attachmentPoint ||
        element.attachmentPoint.x < 0 || element.attachmentPoint.x > 100 ||
        element.attachmentPoint.y < 0 || element.attachmentPoint.y > 100) {
      console.warn(`[Universal Detection] Invalid attachment point:`, element);
      return false;
    }

    return true;
  });
}

// Helper functions for mesh processing
function calculateBoundsFromCoordinates(coordinates: Array<{x: number, y: number}>) {
  if (!coordinates || coordinates.length === 0) {
    return { x: 0, y: 0, width: 10, height: 10 };
  }
  
  const xCoords = coordinates.map(p => p.x);
  const yCoords = coordinates.map(p => p.y);
  
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function getAnimationsForType(type: string): string[] {
  switch (type) {
    case 'wing':
      return ['flutter', 'spread', 'fold'];
    case 'leg':
    case 'limb':
      return ['walk', 'twitch', 'extend'];
    case 'body':
      return ['breathe', 'pulse', 'glow'];
    case 'antenna':
      return ['sway', 'twitch', 'search'];
    case 'pattern':
    case 'decoration':
      return ['shimmer', 'glow', 'pulse'];
    default:
      return ['pulse', 'glow'];
  }
}

// Helper to categorize elements by animation priority
export function categorizeElementsByPriority(elements: DetectedElement[]) {
  return {
    high: elements.filter(e => e.animationPotential === 'high'),
    medium: elements.filter(e => e.animationPotential === 'medium'),
    low: elements.filter(e => e.animationPotential === 'low')
  };
}