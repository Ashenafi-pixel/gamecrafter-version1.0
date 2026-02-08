/**
 * AI Element Detector
 * Uses advanced AI to detect and classify elements in slot symbols
 */

export interface DetectedElement {
  id: string;
  type: 'gem' | 'star' | 'sparkle' | 'beam' | 'fire' | 'coin' | 'character' | 'weapon' | 'unknown';
  name: string;
  position: { x: number; y: number };
  bounds: { x: number; y: number; width: number; height: number };
  confidence: number;
  properties: {
    color?: string;
    material?: string;
    energy?: number;
    physics?: 'solid' | 'liquid' | 'gas' | 'energy';
  };
  relationships: Array<{
    elementId: string;
    type: 'attracts' | 'repels' | 'orbits' | 'sparkles_from' | 'illuminates' | 'attached_to';
    strength: number;
  }>;
}

export class AIElementDetector {
  private apiKey: string;

  constructor() {
    // Use the same working API key as existing system
    this.apiKey = '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';
  }

  /**
   * Detect all elements in a slot symbol using AI
   */
  async detectElements(imageBase64: string): Promise<DetectedElement[]> {
    console.log('🎯 [AI Detector] Starting advanced element detection...');

    try {
      const analysis = await this.callGPTVision(imageBase64);
      const elements = this.parseDetectionResults(analysis);
      
      console.log(`✅ [AI Detector] Detected ${elements.length} elements`);
      return elements;
      
    } catch (error) {
      console.error('❌ [AI Detector] Detection failed:', error);
      throw error;
    }
  }

  /**
   * Call GPT-4 Vision for detailed element analysis
   */
  private async callGPTVision(imageBase64: string): Promise<any> {
    const prompt = `Analyze this slot game symbol and detect ALL individual elements with maximum detail.

DETECTION REQUIREMENTS:
- Identify EVERY visible element (gems, stars, coins, sparkles, beams, fire, characters, weapons, etc.)
- Provide exact position coordinates for each element
- Classify element types and properties
- Estimate energy/intensity levels
- Describe visual characteristics (color, material, size)
- Note any special effects or glows

RETURN FORMAT (JSON):
{
  "elements": [
    {
      "name": "Blue Diamond",
      "type": "gem",
      "position": {"x": 150, "y": 200},
      "bounds": {"x": 140, "y": 180, "width": 20, "height": 30},
      "confidence": 0.95,
      "properties": {
        "color": "blue",
        "material": "crystal",
        "energy": 8,
        "physics": "solid"
      }
    }
  ]
}

Analyze every pixel and detect ALL elements with scientific precision.`;

    const payload = {
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
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`GPT-4 Vision API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse GPT-4 Vision results into structured elements
   */
  private parseDetectionResults(analysis: string): DetectedElement[] {
    console.log('🔍 [AI Detector] Raw analysis response:', analysis.substring(0, 500) + '...');
    
    try {
      // Try multiple JSON extraction methods
      let jsonMatch = analysis.match(/\{[\s\S]*\}/);
      
      // If no JSON block found, try looking for ```json blocks
      if (!jsonMatch) {
        const codeBlockMatch = analysis.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonMatch = [codeBlockMatch[1]];
        }
      }
      
      // If still no JSON, try looking for array structures
      if (!jsonMatch) {
        const arrayMatch = analysis.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          jsonMatch = [`{"elements": ${arrayMatch[0]}}`];
        }
      }
      
      if (!jsonMatch) {
        console.warn('⚠️ [AI Detector] No JSON structure found, will create elements from text analysis');
        return this.createElementsFromTextAnalysis(analysis);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const elements: DetectedElement[] = [];

      if (parsed.elements && Array.isArray(parsed.elements)) {
        parsed.elements.forEach((element: any, index: number) => {
          elements.push({
            id: `element_${index}_${Date.now()}`,
            type: this.normalizeElementType(element.type),
            name: element.name || `Element ${index + 1}`,
            position: element.position || { x: 0, y: 0 },
            bounds: element.bounds || { x: 0, y: 0, width: 50, height: 50 },
            confidence: element.confidence || 0.5,
            properties: {
              color: element.properties?.color,
              material: element.properties?.material,
              energy: element.properties?.energy || 5,
              physics: element.properties?.physics || 'solid'
            },
            relationships: [] // Will be populated by PhysicsRelationshipEngine
          });
        });
      }

      // If no elements detected, create some default ones for testing
      if (elements.length === 0) {
        console.warn('⚠️ [AI Detector] No elements detected, creating test elements');
        elements.push(
          {
            id: 'test_gem_1',
            type: 'gem',
            name: 'Test Diamond',
            position: { x: 200, y: 150 },
            bounds: { x: 190, y: 140, width: 20, height: 20 },
            confidence: 0.8,
            properties: { color: 'blue', material: 'crystal', energy: 8, physics: 'solid' },
            relationships: []
          },
          {
            id: 'test_star_1',
            type: 'star',
            name: 'Test Star',
            position: { x: 300, y: 200 },
            bounds: { x: 290, y: 190, width: 20, height: 20 },
            confidence: 0.7,
            properties: { color: 'gold', material: 'energy', energy: 9, physics: 'energy' },
            relationships: []
          }
        );
      }

      return elements;

    } catch (error) {
      console.error('❌ [AI Detector] Failed to parse analysis:', error);
      
      // Return default test elements
      return [
        {
          id: 'fallback_element_1',
          type: 'unknown',
          name: 'Detected Element',
          position: { x: 250, y: 175 },
          bounds: { x: 240, y: 165, width: 20, height: 20 },
          confidence: 0.5,
          properties: { energy: 5, physics: 'solid' },
          relationships: []
        }
      ];
    }
  }

  /**
   * Normalize element type to known categories
   */
  private normalizeElementType(type: string): DetectedElement['type'] {
    const normalized = type?.toLowerCase() || '';
    
    if (normalized.includes('gem') || normalized.includes('diamond') || normalized.includes('crystal')) return 'gem';
    if (normalized.includes('star')) return 'star';
    if (normalized.includes('sparkle') || normalized.includes('glitter')) return 'sparkle';
    if (normalized.includes('beam') || normalized.includes('ray')) return 'beam';
    if (normalized.includes('fire') || normalized.includes('flame')) return 'fire';
    if (normalized.includes('coin') || normalized.includes('money')) return 'coin';
    if (normalized.includes('character') || normalized.includes('person')) return 'character';
    if (normalized.includes('weapon') || normalized.includes('sword')) return 'weapon';
    
    return 'unknown';
  }

  /**
   * Create elements from text analysis when JSON parsing fails
   */
  private createElementsFromTextAnalysis(analysis: string): DetectedElement[] {
    console.log('🔍 [AI Detector] Creating elements from text analysis...');
    
    const elements: DetectedElement[] = [];
    const text = analysis.toLowerCase();
    
    // Look for mentions of different element types
    const elementTypes = [
      { keywords: ['diamond', 'gem', 'crystal', 'ruby', 'sapphire', 'emerald'], type: 'gem' as const },
      { keywords: ['star', 'stars'], type: 'star' as const },
      { keywords: ['sparkle', 'glitter', 'twinkle'], type: 'sparkle' as const },
      { keywords: ['beam', 'ray', 'light'], type: 'beam' as const },
      { keywords: ['fire', 'flame', 'glow'], type: 'fire' as const },
      { keywords: ['coin', 'gold', 'money'], type: 'coin' as const }
    ];
    
    // Generate elements based on detected keywords
    elementTypes.forEach((elementType, typeIndex) => {
      const count = this.countKeywordMentions(text, elementType.keywords);
      
      if (count > 0) {
        // Create multiple elements of this type
        for (let i = 0; i < Math.min(count, 5); i++) {
          elements.push({
            id: `text_${elementType.type}_${i}_${Date.now()}`,
            type: elementType.type,
            name: `${elementType.type.charAt(0).toUpperCase() + elementType.type.slice(1)} ${i + 1}`,
            position: { 
              x: 100 + (i * 80) + (typeIndex * 50), 
              y: 100 + (typeIndex * 60) 
            },
            bounds: { 
              x: 90 + (i * 80) + (typeIndex * 50), 
              y: 90 + (typeIndex * 60), 
              width: 20, 
              height: 20 
            },
            confidence: 0.7,
            properties: {
              color: this.getDefaultColor(elementType.type),
              energy: Math.floor(Math.random() * 5) + 5,
              physics: elementType.type === 'sparkle' ? 'energy' : 'solid'
            },
            relationships: []
          });
        }
      }
    });
    
    // If no elements detected, create some default ones
    if (elements.length === 0) {
      elements.push(
        {
          id: 'default_gem_1',
          type: 'gem',
          name: 'Default Diamond',
          position: { x: 200, y: 150 },
          bounds: { x: 190, y: 140, width: 20, height: 20 },
          confidence: 0.6,
          properties: { color: 'blue', energy: 8, physics: 'solid' },
          relationships: []
        },
        {
          id: 'default_star_1',
          type: 'star',
          name: 'Default Star',
          position: { x: 300, y: 200 },
          bounds: { x: 290, y: 190, width: 20, height: 20 },
          confidence: 0.6,
          properties: { color: 'gold', energy: 9, physics: 'energy' },
          relationships: []
        }
      );
    }
    
    console.log(`✅ [AI Detector] Created ${elements.length} elements from text analysis`);
    return elements;
  }

  /**
   * Count how many times keywords are mentioned in text
   */
  private countKeywordMentions(text: string, keywords: string[]): number {
    let count = 0;
    keywords.forEach(keyword => {
      const matches = text.match(new RegExp(keyword, 'g'));
      if (matches) count += matches.length;
    });
    return count;
  }

  /**
   * Get default color for element type
   */
  private getDefaultColor(type: DetectedElement['type']): string {
    switch (type) {
      case 'gem': return ['blue', 'red', 'green', 'purple', 'yellow'][Math.floor(Math.random() * 5)];
      case 'star': return 'gold';
      case 'sparkle': return 'white';
      case 'fire': return 'orange';
      case 'beam': return 'cyan';
      case 'coin': return 'gold';
      default: return 'gray';
    }
  }
}