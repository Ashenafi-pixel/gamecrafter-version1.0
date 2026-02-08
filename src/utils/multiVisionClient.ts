import OpenAI from 'openai';

// Multi-API Vision System for Professional Animation
// Combines OpenAI GPT-4o Vision + Google Cloud Vision for comprehensive analysis

interface VisionConfig {
  openaiKey: string;
  googleKey: string;
}

interface ComponentAnalysis {
  id: string;
  name: string;
  type: 'rigid' | 'flexible' | 'cloth' | 'hair' | 'liquid' | 'particle';
  bounds: { x: number; y: number; width: number; height: number };
  attachmentPoints: Array<{ x: number; y: number; type: 'root' | 'joint' | 'anchor' }>;
  children: string[]; // IDs of connected components
  parent?: string;
  material: {
    flexibility: number; // 0-1 (rigid to very flexible)
    weight: number; // 0-1 (light to heavy)
    damping: number; // 0-1 (no damping to high damping)
    elasticity: number; // 0-1 (no bounce to very bouncy)
  };
  animationProperties: {
    primaryMotion: 'rotation' | 'translation' | 'deformation' | 'physics';
    secondaryMotion: boolean; // follows parent movement
    constraints: Array<{
      type: 'rotation' | 'translation' | 'scale';
      min: number;
      max: number;
    }>;
  };
}

interface StyleAnalysis {
  artStyle: 'cartoon' | 'realistic' | 'anime' | 'pixel' | 'vector' | 'painterly';
  animationStyle: 'bouncy' | 'smooth' | 'snappy' | 'flowing' | 'mechanical';
  timingStyle: 'disney' | 'anime' | 'game' | 'realistic';
  complexity: 'simple' | 'medium' | 'complex' | 'professional';
  confidence: number;
}

interface DepthAnalysis {
  depthMap: number[][]; // 2D array of depth values 0-1
  layers: Array<{
    id: string;
    depth: number; // 0 (background) to 1 (foreground)
    components: string[]; // Component IDs in this layer
  }>;
  occlusionMap: { [componentId: string]: string[] }; // What components are hidden by others
}

interface ComprehensiveAnalysis {
  components: ComponentAnalysis[];
  style: StyleAnalysis;
  depth: DepthAnalysis;
  skeleton: {
    bones: Array<{
      id: string;
      name: string;
      parent?: string;
      position: { x: number; y: number };
      length: number;
      rotation: number;
      influence: number; // How much this bone affects surrounding pixels
    }>;
    hierarchy: { [boneId: string]: string[] }; // Parent -> children mapping
  };
  physics: {
    gravity: { x: number; y: number };
    airResistance: number;
    defaultConstraints: {
      hair: { flexibility: number; damping: number };
      cloth: { flexibility: number; damping: number };
      rigid: { flexibility: number; damping: number };
    };
  };
  recommendations: {
    suggestedAnimations: Array<{
      type: 'idle' | 'win' | 'attack' | 'special';
      components: string[];
      description: string;
      complexity: number;
    }>;
    riggingApproach: 'simple' | 'mesh' | 'bone' | 'physics';
    estimatedProcessingTime: number; // seconds
  };
}

class MultiVisionClient {
  private openai: OpenAI | null = null;
  private googleKey: string;
  private initialized = false;

  constructor(config: VisionConfig) {
    this.googleKey = config.googleKey;
    
    try {
      this.openai = new OpenAI({
        apiKey: config.openaiKey,
        dangerouslyAllowBrowser: true
      });
      this.initialized = true;
      console.log('[MultiVision] Initialized with OpenAI + Google Vision');
    } catch (error) {
      console.error('[MultiVision] Failed to initialize:', error);
    }
  }

  async analyzeImageComprehensively(imageBase64: string): Promise<ComprehensiveAnalysis> {
    if (!this.initialized || !this.openai) {
      throw new Error('MultiVision client not properly initialized');
    }

    console.log('[MultiVision] Starting comprehensive analysis...');

    try {
      // Run multiple analysis in parallel for speed
      const [
        semanticAnalysis,
        googleVisionData,
        depthAnalysis,
        styleAnalysis
      ] = await Promise.all([
        this.analyzeSemanticComponents(imageBase64),
        this.analyzeWithGoogleVision(imageBase64),
        this.estimateDepth(imageBase64),
        this.analyzeArtStyle(imageBase64)
      ]);

      // Combine all analysis into comprehensive result
      const comprehensiveResult = this.combineAnalysis(
        semanticAnalysis,
        googleVisionData,
        depthAnalysis,
        styleAnalysis
      );

      console.log('[MultiVision] Comprehensive analysis complete');
      return comprehensiveResult;

    } catch (error) {
      console.error('[MultiVision] Analysis failed:', error);
      throw error;
    }
  }

  private async analyzeSemanticComponents(imageBase64: string): Promise<any> {
    const response = await this.openai!.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a professional animator analyzing this image for automatic rigging and animation.

Identify EVERY component that could be animated, including:
- Hair strands (individual sections)
- Clothing pieces (sleeves, skirts, accessories) 
- Body parts (arms, legs, head, torso)
- Flexible elements (ribbons, scarves, tails)
- Accessories (jewelry, weapons, props)
- Effects (sparkles, auras, magical elements)

For each component, determine:
1. What type of material it is (rigid bone, flexible hair, flowing cloth, etc.)
2. How it should move (rotation, translation, physics simulation)
3. What it's connected to (parent relationships)
4. Movement constraints (how far can it bend/rotate)
5. Physics properties (weight, flexibility, damping)

Return detailed JSON with this structure:
{
  "components": [
    {
      "id": "component_1",
      "name": "Left Hair Strand",
      "type": "hair",
      "bounds": {"x": 10, "y": 20, "width": 30, "height": 40},
      "attachmentPoints": [{"x": 15, "y": 25, "type": "root"}],
      "parent": "head",
      "children": ["hair_strand_2"],
      "material": {
        "flexibility": 0.8,
        "weight": 0.3,
        "damping": 0.6,
        "elasticity": 0.4
      },
      "animationProperties": {
        "primaryMotion": "physics",
        "secondaryMotion": true,
        "constraints": [
          {"type": "rotation", "min": -45, "max": 45}
        ]
      }
    }
  ]
}

Be extremely detailed - identify every animatable element.`
            },
            {
              type: "image_url",
              image_url: { url: imageBase64 }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No semantic analysis response');

    // Parse JSON from response
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }

    return JSON.parse(jsonStr);
  }

  private async analyzeWithGoogleVision(imageBase64: string): Promise<any> {
    try {
      // Convert base64 to blob for Google Vision
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.googleKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Data
              },
              features: [
                { type: 'OBJECT_LOCALIZATION', maxResults: 50 },
                { type: 'IMAGE_PROPERTIES' },
                { type: 'FACE_DETECTION' },
                { type: 'LANDMARK_DETECTION' },
                { type: 'LABEL_DETECTION', maxResults: 50 }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      console.log('[MultiVision] Google Vision data:', data);
      
      return data.responses[0] || {};
    } catch (error) {
      console.warn('[MultiVision] Google Vision failed, using fallback:', error);
      return {};
    }
  }

  private async estimateDepth(imageBase64: string): Promise<DepthAnalysis> {
    // Use GPT-4o to estimate depth and layering
    const response = await this.openai!.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze the depth and layering of this image for animation purposes.

Identify:
1. What elements are in front vs behind others
2. Depth layers from background to foreground
3. Which elements would occlude (hide) others during animation
4. Estimated depth values for each major component

Return JSON:
{
  "layers": [
    {
      "id": "background",
      "depth": 0.0,
      "components": ["bg_element1", "bg_element2"]
    },
    {
      "id": "midground", 
      "depth": 0.5,
      "components": ["body", "main_elements"]
    },
    {
      "id": "foreground",
      "depth": 1.0,
      "components": ["hair", "accessories"]
    }
  ],
  "occlusionMap": {
    "hair": ["face_parts"],
    "left_arm": ["torso"]
  }
}`
            },
            {
              type: "image_url",
              image_url: { url: imageBase64 }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No depth analysis response');

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);
    
    // Generate depth map (simplified for now)
    const depthMap: number[][] = [];
    for (let y = 0; y < 100; y++) {
      depthMap[y] = [];
      for (let x = 0; x < 100; x++) {
        depthMap[y][x] = Math.random(); // Placeholder - would use real depth estimation
      }
    }

    return {
      depthMap,
      layers: parsed.layers || [],
      occlusionMap: parsed.occlusionMap || {}
    };
  }

  private async analyzeArtStyle(imageBase64: string): Promise<StyleAnalysis> {
    const response = await this.openai!.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze the art style of this image to determine appropriate animation approach.

Determine:
1. Art style (cartoon, realistic, anime, pixel art, etc.)
2. Animation style that would fit (bouncy cartoon, smooth realistic, etc.)
3. Timing style (Disney principles, anime style, game style, etc.)
4. Complexity level for animation system

Return JSON:
{
  "artStyle": "cartoon|realistic|anime|pixel|vector|painterly",
  "animationStyle": "bouncy|smooth|snappy|flowing|mechanical", 
  "timingStyle": "disney|anime|game|realistic",
  "complexity": "simple|medium|complex|professional",
  "confidence": 0.95
}`
            },
            {
              type: "image_url",
              image_url: { url: imageBase64 }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No style analysis response');

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }

    return JSON.parse(jsonStr);
  }

  private combineAnalysis(
    semantic: any,
    google: any,
    depth: DepthAnalysis,
    style: StyleAnalysis
  ): ComprehensiveAnalysis {
    // Combine all analysis sources into final result
    const components: ComponentAnalysis[] = semantic.components || [];
    
    // Enhance with Google Vision data
    if (google.localizedObjectAnnotations) {
      google.localizedObjectAnnotations.forEach((obj: any) => {
        // Cross-reference with semantic components and enhance
        console.log('[MultiVision] Google detected:', obj.name, obj.score);
      });
    }

    // Generate skeleton based on components
    const skeleton = this.generateSkeleton(components);
    
    // Generate physics settings based on style
    const physics = this.generatePhysicsSettings(style);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(components, style);

    return {
      components,
      style,
      depth,
      skeleton,
      physics,
      recommendations
    };
  }

  private generateSkeleton(components: ComponentAnalysis[]) {
    // Auto-generate bone structure based on component hierarchy
    const bones: any[] = [];
    const hierarchy: { [key: string]: string[] } = {};

    components.forEach(component => {
      if (component.type === 'rigid' || component.animationProperties.primaryMotion === 'rotation') {
        const bone = {
          id: `bone_${component.id}`,
          name: `${component.name} Bone`,
          parent: component.parent ? `bone_${component.parent}` : undefined,
          position: {
            x: component.bounds.x + component.bounds.width / 2,
            y: component.bounds.y + component.bounds.height / 2
          },
          length: Math.max(component.bounds.width, component.bounds.height),
          rotation: 0,
          influence: component.material.flexibility
        };
        
        bones.push(bone);
        
        if (bone.parent) {
          if (!hierarchy[bone.parent]) hierarchy[bone.parent] = [];
          hierarchy[bone.parent].push(bone.id);
        }
      }
    });

    return { bones, hierarchy };
  }

  private generatePhysicsSettings(style: StyleAnalysis) {
    const baseSettings = {
      cartoon: {
        gravity: { x: 0, y: 0.3 },
        airResistance: 0.8,
        defaultConstraints: {
          hair: { flexibility: 0.9, damping: 0.3 },
          cloth: { flexibility: 0.8, damping: 0.4 },
          rigid: { flexibility: 0.1, damping: 0.9 }
        }
      },
      realistic: {
        gravity: { x: 0, y: 0.8 },
        airResistance: 0.95,
        defaultConstraints: {
          hair: { flexibility: 0.7, damping: 0.6 },
          cloth: { flexibility: 0.6, damping: 0.7 },
          rigid: { flexibility: 0.05, damping: 0.95 }
        }
      }
    };

    return baseSettings[style.artStyle as keyof typeof baseSettings] || baseSettings.cartoon;
  }

  private generateRecommendations(components: ComponentAnalysis[], style: StyleAnalysis) {
    const suggestions = [];
    
    // Analyze what types of animations would work well
    const hasHair = components.some(c => c.type === 'hair');
    const hasCloth = components.some(c => c.type === 'cloth');
    const complexity = components.length;

    if (hasHair) {
      suggestions.push({
        type: 'idle' as const,
        components: components.filter(c => c.type === 'hair').map(c => c.id),
        description: 'Gentle hair sway with physics simulation',
        complexity: 0.6
      });
    }

    if (hasCloth) {
      suggestions.push({
        type: 'win' as const,
        components: components.filter(c => c.type === 'cloth').map(c => c.id),
        description: 'Dramatic cloth flutter for victory animation',
        complexity: 0.8
      });
    }

    return {
      suggestedAnimations: suggestions,
      riggingApproach: complexity > 10 ? 'mesh' : complexity > 5 ? 'bone' : 'simple',
      estimatedProcessingTime: Math.max(30, complexity * 5)
    };
  }
}

// Initialize with API keys
const config: VisionConfig = {
  openaiKey: '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',
  googleKey: 'AIzaSyDO-6K0PRwG23IgnikklEyYFxqM_Re6Bhs'
};

export const multiVisionClient = new MultiVisionClient(config);
export type { ComprehensiveAnalysis, ComponentAnalysis, StyleAnalysis };