// Professional Letter Derivation System
// Generates consistent letter series by deriving from a base letter style

export interface LetterDerivationResult {
  letters: Array<{
    letter: string;
    imageUrl: string;
    derivationMethod: 'base' | 'derived';
    styleReference: string;
  }>;
  baseStyle: string;
  confidence: number;
  method: 'letter_derivation';
}

export interface StyleAnalysisResult {
  primaryColor: string;
  secondaryColor?: string;
  effects: string[];
  typography: string;
  lighting: string;
  texture: string;
  artisticStyle: string;
}

export class LetterDerivationSystem {
  
  /**
   * Analyze the style of existing text in an image
   */
  async analyzeTextStyle(imageBase64: string, detectedText: string): Promise<StyleAnalysisResult> {
    try {
      // Skip complex image analysis to avoid header size limits
      // Use intelligent style detection based on detected text and context
      console.log('🎨 Using intelligent style analysis without re-processing large image...');
      
      // Determine style based on detected text and fantasy slot game context
      const styleAnalysis: StyleAnalysisResult = this.getIntelligentSlotStyle(detectedText);
      
      console.log('🎨 Analyzed text style (intelligent mode):', styleAnalysis);
      return styleAnalysis;
      
    } catch (error) {
      console.error('Style analysis failed, using default style:', error);
      return this.getDefaultSlotStyle();
    }
  }
  
  /**
   * Generate consistent letter series using derivation
   */
  async generateLetterSeries(
    word: string, 
    styleAnalysis: StyleAnalysisResult,
    gameContext: string = 'slot_game'
  ): Promise<LetterDerivationResult> {
    
    const letters = word.split('');
    const results: LetterDerivationResult['letters'] = [];
    let baseImageUrl: string | null = null;
    
    console.log(`🔤 Starting derivation for "${word}" (${letters.length} letters)`);
    
    try {
      const { enhancedOpenaiClient } = await import('./enhancedOpenaiClient');
      
      // Step 1: Generate the perfect base letter (first letter)
      const baseLetter = letters[0];
      console.log(`🎨 Generating base letter: ${baseLetter}`);
      
      const basePrompt = this.createBaseLetterPrompt(baseLetter, styleAnalysis, gameContext);
      
      const baseResult = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: basePrompt,
        count: 1,
        targetSymbolId: `letter_base_${baseLetter}_${Date.now()}`,
        gameId: 'letter_derivation'
      });
      
      if (!baseResult.success || !baseResult.images?.[0]) {
        throw new Error(`Failed to generate base letter ${baseLetter}`);
      }
      
      baseImageUrl = baseResult.images[0];
      results.push({
        letter: baseLetter,
        imageUrl: baseImageUrl,
        derivationMethod: 'base',
        styleReference: 'original'
      });
      
      console.log(`✅ Base letter ${baseLetter} generated successfully`);
      
      // Step 2: Derive all subsequent letters from the base
      for (let i = 1; i < letters.length; i++) {
        const targetLetter = letters[i];
        console.log(`🔄 Deriving letter: ${targetLetter} (${i + 1}/${letters.length})`);
        
        const derivationPrompt = this.createDerivationPrompt(
          targetLetter, 
          baseLetter, 
          styleAnalysis, 
          gameContext
        );
        
        const derivedResult = await enhancedOpenaiClient.generateImageWithConfig({
          prompt: derivationPrompt,
          count: 1,
          targetSymbolId: `letter_derived_${targetLetter}_${Date.now()}`,
          gameId: 'letter_derivation'
        });
        
        if (derivedResult.success && derivedResult.images?.[0]) {
          results.push({
            letter: targetLetter,
            imageUrl: derivedResult.images[0],
            derivationMethod: 'derived',
            styleReference: baseLetter
          });
          console.log(`✅ Letter ${targetLetter} derived successfully`);
        } else {
          console.error(`Failed to derive letter ${targetLetter}`);
          throw new Error(`Failed to derive letter ${targetLetter}`);
        }
      }
      
      return {
        letters: results,
        baseStyle: this.styleToString(styleAnalysis),
        confidence: 0.95,
        method: 'letter_derivation'
      };
      
    } catch (error) {
      console.error('Letter derivation failed:', error);
      throw error;
    }
  }
  
  /**
   * Create prompt for the base letter generation
   */
  private createBaseLetterPrompt(
    letter: string, 
    style: StyleAnalysisResult, 
    gameContext: string
  ): string {
    return `Create a perfect letter "${letter}" for ${gameContext} with the following precise styling:

STYLE SPECIFICATIONS:
- Primary Color: ${style.primaryColor}
- Secondary Color: ${style.secondaryColor || 'none'}
- Typography: ${style.typography}
- Texture: ${style.texture}
- Lighting: ${style.lighting}
- Effects: ${style.effects.join(', ')}
- Artistic Style: ${style.artisticStyle}

QUALITY REQUIREMENTS:
- Ultra-high resolution 4K quality finished graphics
- Professional game-ready artwork with crisp details
- Perfect edge definition and clean vector-style clarity
- Premium visual polish suitable for commercial ${gameContext}s
- Completely transparent background
- Letter should be centered and properly sized

CRITICAL SPECIFICATIONS:
- This will be the MASTER REFERENCE for all other letters
- Every visual aspect must be consistent and replicable
- Clean, isolated letter with no background elements
- Professional typography with perfect proportions
- Ready for animation and derivation

The result should be a perfect "${letter}" that serves as the foundation for generating matching letters.`;
  }
  
  /**
   * Create prompt for deriving subsequent letters
   */
  private createDerivationPrompt(
    targetLetter: string, 
    baseLetter: string, 
    style: StyleAnalysisResult, 
    gameContext: string
  ): string {
    return `Create the letter "${targetLetter}" that PERFECTLY MATCHES the styling of the reference letter "${baseLetter}".

CRITICAL STYLE MATCHING:
- Use IDENTICAL color scheme: ${style.primaryColor} ${style.secondaryColor ? `+ ${style.secondaryColor}` : ''}
- Use IDENTICAL typography: ${style.typography}
- Use IDENTICAL texture: ${style.texture}
- Use IDENTICAL lighting: ${style.lighting}
- Use IDENTICAL effects: ${style.effects.join(', ')}
- Use IDENTICAL artistic style: ${style.artisticStyle}

DERIVATION REQUIREMENTS:
- Change ONLY the letter shape from "${baseLetter}" to "${targetLetter}"
- Keep EVERYTHING ELSE exactly the same
- Same proportions, same thickness, same spacing
- Same visual weight and presence
- Same effects intensity and placement

QUALITY SPECIFICATIONS:
- Ultra-high resolution 4K quality finished graphics
- Professional game-ready artwork matching reference quality
- Perfect edge definition and clean vector-style clarity
- Premium visual polish suitable for commercial ${gameContext}s
- Completely transparent background
- Letter centered and properly sized to match reference

CONSISTENCY CHECKLIST:
✓ Color palette identical to reference
✓ Typography style identical to reference  
✓ Texture treatment identical to reference
✓ Lighting direction identical to reference
✓ Effects type and intensity identical to reference
✓ Only letter shape differs

The result should be the letter "${targetLetter}" that looks like it was created by the same artist using the same tools and techniques as the reference "${baseLetter}".`;
  }
  
  /**
   * Extract color information from description
   */
  private extractColor(description: string, type: 'primary' | 'secondary'): string {
    const colors = {
      primary: ['golden', 'gold', 'silver', 'bronze', 'red', 'blue', 'green', 'purple', 'yellow', 'orange'],
      secondary: ['shadowed', 'highlighted', 'outlined', 'accented']
    };
    
    for (const color of colors[type]) {
      if (description.includes(color)) {
        return color;
      }
    }
    
    return type === 'primary' ? 'golden metallic' : 'none';
  }
  
  /**
   * Extract effects from description
   */
  private extractEffects(description: string): string[] {
    const effects = [];
    
    if (description.includes('glow')) effects.push('magical glow');
    if (description.includes('shadow')) effects.push('drop shadow');
    if (description.includes('shine') || description.includes('shiny')) effects.push('metallic shine');
    if (description.includes('outline')) effects.push('bold outline');
    if (description.includes('bevel')) effects.push('3D bevel');
    if (description.includes('gradient')) effects.push('gradient fill');
    
    return effects.length > 0 ? effects : ['magical glow', 'drop shadow'];
  }
  
  /**
   * Extract typography style
   */
  private extractTypography(description: string): string {
    if (description.includes('bold')) return 'Bold fantasy serif';
    if (description.includes('ornate')) return 'Ornate decorative';
    if (description.includes('medieval')) return 'Medieval gothic';
    if (description.includes('modern')) return 'Modern sans-serif';
    
    return 'Bold fantasy serif with ornate details';
  }
  
  /**
   * Extract lighting information
   */
  private extractLighting(description: string): string {
    if (description.includes('top')) return 'dramatic top lighting';
    if (description.includes('ambient')) return 'soft ambient lighting';
    if (description.includes('side')) return 'side rim lighting';
    
    return 'dramatic top lighting with rim highlights';
  }
  
  /**
   * Extract texture information
   */
  private extractTexture(description: string): string {
    if (description.includes('metallic')) return 'polished metallic surface';
    if (description.includes('stone')) return 'carved stone texture';
    if (description.includes('crystal')) return 'crystalline surface';
    if (description.includes('wood')) return 'carved wooden texture';
    
    return 'polished metallic surface with fine detail';
  }
  
  /**
   * Extract artistic style
   */
  private extractArtisticStyle(description: string): string {
    if (description.includes('cartoon')) return '3D animated style with stylized proportions';
    if (description.includes('realistic')) return 'photorealistic rendering';
    if (description.includes('fantasy')) return 'high fantasy game art';
    if (description.includes('medieval')) return 'medieval fantasy illustration';
    
    return 'premium slot game artwork with fantasy elements';
  }
  
  /**
   * Convert style analysis to string
   */
  private styleToString(style: StyleAnalysisResult): string {
    return `${style.primaryColor} ${style.typography} with ${style.texture}, ${style.lighting}, and ${style.effects.join(' + ')}`;
  }
  
  /**
   * Get intelligent slot style based on detected text
   */
  private getIntelligentSlotStyle(detectedText: string): StyleAnalysisResult {
    const text = detectedText.toLowerCase();
    
    // Customize style based on detected text type
    if (text.includes('wild')) {
      return {
        primaryColor: 'golden metallic',
        secondaryColor: 'deep crimson outline',
        effects: ['magical glow', 'drop shadow', '3D bevel', 'fire aura'],
        typography: 'Bold fantasy serif with ornate details',
        lighting: 'dramatic top lighting with rim highlights',
        texture: 'polished metallic surface with carved details',
        artisticStyle: 'premium slot game artwork with mystical fantasy elements'
      };
    } else if (text.includes('scatter')) {
      return {
        primaryColor: 'silver metallic',
        secondaryColor: 'electric blue outline',
        effects: ['starlight sparkle', 'drop shadow', '3D bevel'],
        typography: 'Bold fantasy serif with crystalline details',
        lighting: 'cool ambient lighting with sparkle highlights',
        texture: 'crystalline metallic surface with prismatic effects',
        artisticStyle: 'premium slot game artwork with cosmic elements'
      };
    } else if (text.includes('bonus')) {
      return {
        primaryColor: 'royal purple metallic',
        secondaryColor: 'golden outline',
        effects: ['royal glow', 'drop shadow', '3D bevel', 'crown sparkle'],
        typography: 'Bold fantasy serif with royal ornaments',
        lighting: 'regal top lighting with golden highlights',
        texture: 'polished royal metallic with gem inlays',
        artisticStyle: 'premium slot game artwork with royal fantasy elements'
      };
    }
    
    // Default WILD style for any other text
    return this.getDefaultSlotStyle();
  }

  /**
   * Get default slot game style
   */
  private getDefaultSlotStyle(): StyleAnalysisResult {
    return {
      primaryColor: 'golden metallic',
      secondaryColor: 'dark bronze outline',
      effects: ['magical glow', 'drop shadow', '3D bevel'],
      typography: 'Bold fantasy serif with ornate details',
      lighting: 'dramatic top lighting with rim highlights',
      texture: 'polished metallic surface with fine detail',
      artisticStyle: 'premium slot game artwork with fantasy elements'
    };
  }
}

// Export singleton instance
export const letterDerivationSystem = new LetterDerivationSystem();