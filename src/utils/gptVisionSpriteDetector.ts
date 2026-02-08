/**
 * GPT Vision-based Sprite Detection System
 * Uses OpenAI GPT-4 Vision to intelligently analyze and separate sprite sheets
 */

interface VisionSpriteElement {
  id: string;
  type: 'main_symbol' | 'letter' | 'element';
  content: string; // e.g., "pig with straw hat", "letter W", "letter I"
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  order?: number; // For letters: W=0, I=1, L=2, D=3
}

interface VisionAnalysisResult {
  success: boolean;
  mainSymbol?: VisionSpriteElement;
  letters: VisionSpriteElement[];
  otherElements: VisionSpriteElement[];
  analysis: string;
  recommendations: string[];
  error?: string;
}

const OPENAI_API_KEY = "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";
const OPENAI_ORG_ID = "org-EbZLwKpoPUaLvuyhZJid8rUF";

/**
 * Analyze sprite sheet using GPT-4 Vision
 */
export async function analyzeSpritesWithVision(
  imageUrl: string,
  expectedText: string = "WILD",
  contentDescription: string = "slot machine symbol"
): Promise<VisionAnalysisResult> {
  try {
    console.log(`🔍 [GPT Vision] Starting sprite analysis for: ${contentDescription} with text "${expectedText}"`);
    
    const prompt = `You are an expert sprite sheet analyzer for casino slot machine symbols. Analyze this image and provide a JSON response with sprite detection.

TASK: Identify and locate ALL separate elements in this sprite sheet.

Expected Content:
- Main Subject: ${contentDescription} (should be the largest element, NO TEXT on it)
- EXACTLY ${expectedText.length} Letters: Must find ALL letters "${expectedText.split('').join('", "')}" spelling "${expectedText}"

CRITICAL ANALYSIS REQUIREMENTS:
1. Identify the main symbol/character (largest element, NO TEXT OVERLAP)
2. Find ALL ${expectedText.length} letters (${expectedText.split('').join(', ')}) - DO NOT miss any letter
3. Provide TIGHT bounding boxes that exclude background and overlapping elements  
4. Letters should have minimal padding and NO pig/symbol contamination
5. Main symbol bounds should exclude letter regions completely
6. Verify complete separation (zero overlap between elements)
7. MANDATORY: Return exactly ${expectedText.length} letters in order (${expectedText.split('').map((l, i) => `${l}=${i}`).join(', ')})

BOUNDING BOX REQUIREMENTS:
- Use EXTREMELY GENEROUS boxes that include COMPLETE letter shapes with MASSIVE padding
- Letters: Include full letter + 25-30px padding on ALL sides to guarantee no cropping
- Make bounding boxes 30-40% LARGER than the actual letter to ensure complete capture
- Letters must be COMPLETELY VISIBLE with NO edges cut off
- Main symbol: Exclude text regions completely but include generous padding
- NO overlapping regions between elements
- Coordinates are pixels from top-left (0,0)
- CRITICAL: Letter bounding boxes must capture the ENTIRE letter shape including serifs, strokes, and any decorative elements
- BETTER TO BE TOO LARGE than too small - we want COMPLETE letters, not cropped fragments

Return JSON in this EXACT format:
{
  "success": true,
  "analysis": "Description of what you see and separation quality",
  "mainSymbol": {
    "content": "description of main symbol",
    "bounds": {"x": 0, "y": 0, "width": 100, "height": 100},
    "confidence": 0.95,
    "hasTextContamination": false
  },
  "letters": [
    {
      "content": "letter W",
      "letter": "W", 
      "bounds": {"x": 0, "y": 0, "width": 30, "height": 40},
      "confidence": 0.90,
      "order": 0
    }
  ],
  "recommendations": ["Quality assessment comments"],
  "separationQuality": "excellent|good|poor",
  "letterOrder": "correct|incorrect"
}

Be precise with bounding boxes. Analyze the entire image systematically.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Organization": OPENAI_ORG_ID
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GPT Vision API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log(`🔍 [GPT Vision] Raw response:`, content);

    // Parse JSON response
    let visionResult;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        visionResult = JSON.parse(jsonMatch[0]);
      } else {
        visionResult = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('🔍 [GPT Vision] JSON parse error:', parseError);
      throw new Error(`Failed to parse GPT Vision response: ${parseError}`);
    }

    // Convert to our format
    const result: VisionAnalysisResult = {
      success: visionResult.success || true,
      analysis: visionResult.analysis || "Analysis completed",
      recommendations: visionResult.recommendations || [],
      mainSymbol: undefined,
      letters: [],
      otherElements: []
    };

    // Process main symbol
    if (visionResult.mainSymbol) {
      result.mainSymbol = {
        id: 'main_symbol_vision',
        type: 'main_symbol',
        content: visionResult.mainSymbol.content,
        bounds: visionResult.mainSymbol.bounds,
        confidence: visionResult.mainSymbol.confidence || 0.9
      };
    }

    // Process letters
    if (visionResult.letters && Array.isArray(visionResult.letters)) {
      result.letters = visionResult.letters.map((letter: any, index: number) => ({
        id: `letter_${letter.letter || index}_vision`,
        type: 'letter',
        content: letter.content || `letter ${letter.letter || index}`,
        bounds: letter.bounds,
        confidence: letter.confidence || 0.8,
        order: letter.order !== undefined ? letter.order : index
      }));

      // Sort letters by order to ensure correct sequence
      result.letters.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    console.log(`🔍 [GPT Vision] Analysis complete:`, {
      mainSymbol: !!result.mainSymbol,
      letterCount: result.letters.length,
      quality: visionResult.separationQuality,
      letterOrder: visionResult.letterOrder
    });

    return result;

  } catch (error) {
    console.error('🔍 [GPT Vision] Analysis failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      analysis: "Vision analysis failed",
      recommendations: ["Retry with different approach"],
      letters: [],
      otherElements: []
    };
  }
}

/**
 * Apply intelligent positioning based on vision analysis or template
 */
export function applyVisionBasedPositioning(
  visionResult: VisionAnalysisResult | any,
  workspaceWidth: number = 300,
  workspaceHeight: number = 200
): Array<{id: string, x: number, y: number, width: number, height: number, src: string, type: string, confidence?: number}> {
  const sprites = [];

  console.log(`🎯 [GPT Vision] Applying intelligent positioning...`);

  // Position main symbol - centered and larger
  if (visionResult.mainSymbol) {
    const symbolWidth = 120;
    const symbolHeight = 100;
    
    sprites.push({
      id: visionResult.mainSymbol.id,
      x: (workspaceWidth - symbolWidth) / 2, // True center
      y: (workspaceHeight - symbolHeight) / 2 + 30, // Slightly lower for letters above
      width: symbolWidth,
      height: symbolHeight,
      src: '', // Will be filled by sprite extraction
      type: 'element',
      confidence: visionResult.mainSymbol.confidence
    });
    
    console.log(`🎯 [GPT Vision] Positioned main symbol: centered at (${(workspaceWidth - symbolWidth) / 2}, ${(workspaceHeight - symbolHeight) / 2 + 30})`);
  }

  // Position letters - arranged in proper order at top
  if (visionResult.letters.length > 0) {
    const letterWidth = 35;
    const letterHeight = 30;
    const letterSpacing = 10;
    const totalWidth = visionResult.letters.length * letterWidth + (visionResult.letters.length - 1) * letterSpacing;
    const startX = (workspaceWidth - totalWidth) / 2;

    visionResult.letters.forEach((letter, index) => {
      sprites.push({
        id: letter.id,
        x: startX + (index * (letterWidth + letterSpacing)),
        y: 15, // Top of workspace
        width: letterWidth,
        height: letterHeight,
        src: '', // Will be filled by sprite extraction
        type: 'letter',
        confidence: letter.confidence
      });
    });
    
    console.log(`🎯 [GPT Vision] Positioned ${visionResult.letters.length} letters in order at top`);
  }

  console.log(`✅ [GPT Vision] Applied positioning for ${sprites.length} elements`);
  return sprites;
}

export default {
  analyzeSpritesWithVision,
  applyVisionBasedPositioning
};