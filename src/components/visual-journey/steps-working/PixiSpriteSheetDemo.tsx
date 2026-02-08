import React, { useState } from 'react';
import PixiAnimatedSymbol from './pixiSpriteSheet';

/**
 * Demo component showing how to use the upgraded PixiAnimatedSymbol
 * with OpenAI sprite sheet generation capabilities
 */
export default function PixiSpriteSheetDemo() {
  const [generatedSprites, setGeneratedSprites] = useState<string[]>([]);

  const handleSpriteGenerated = (spriteUrl: string) => {
    setGeneratedSprites(prev => [...prev, spriteUrl]);
    console.log('New sprite generated:', spriteUrl);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>
        🎬 Enhanced PIXI Sprite Sheet Generator
      </h1>
      
      <div style={{ display: 'grid', gap: '32px' }}>
        {/* Generator Section */}
        <div>
          <h2 style={{ marginBottom: '16px' }}>🚀 Generate New Animated Sprite</h2>
          <div style={{ 
            border: '2px solid #007bff', 
            borderRadius: '12px', 
            padding: '20px',
            backgroundColor: '#f8f9fa'
          }}>
            <PixiAnimatedSymbol
              enableGeneration={true}
              onSpriteGenerated={handleSpriteGenerated}
              width={300}
              height={300}
              animationSpeed={0.12}
            />
          </div>
        </div>

        {/* Example with Static Sprite Sheet */}
        <div>
          <h2 style={{ marginBottom: '16px' }}>📋 Example with Static Sprite Sheet</h2>
          <p style={{ marginBottom: '16px', color: '#666' }}>
            This shows how the component works with a pre-existing sprite sheet URL:
          </p>
          <div style={{ 
            border: '2px solid #28a745', 
            borderRadius: '12px', 
            padding: '20px',
            backgroundColor: '#f8f9fa'
          }}>
            <PixiAnimatedSymbol
              imageUrl="/path/to/your/sprite-sheet.png" // Replace with actual sprite sheet
              width={250}
              height={250}
              animationSpeed={0.2}
              gridCols={5}
              gridRows={5}
            />
          </div>
        </div>

        {/* Generated Sprites Gallery */}
        {generatedSprites.length > 0 && (
          <div>
            <h2 style={{ marginBottom: '16px' }}>🎨 Generated Sprites Gallery</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {generatedSprites.map((spriteUrl, index) => (
                <div 
                  key={index}
                  style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '8px', 
                    padding: '16px',
                    backgroundColor: 'white',
                    textAlign: 'center'
                  }}
                >
                  <h4 style={{ marginBottom: '12px' }}>Sprite #{index + 1}</h4>
                  <PixiAnimatedSymbol
                    imageUrl={spriteUrl}
                    width={150}
                    height={150}
                    animationSpeed={0.1}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div style={{ 
          backgroundColor: '#e9ecef', 
          padding: '20px', 
          borderRadius: '8px',
          marginTop: '32px'
        }}>
          <h3 style={{ marginBottom: '16px' }}>📖 How to Use</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <strong>1. Generate Mode:</strong> Set <code>enableGeneration={true}</code> to show generation controls
            </div>
            <div>
              <strong>2. Static Mode:</strong> Provide <code>imageUrl</code> prop with your sprite sheet URL
            </div>
            <div>
              <strong>3. Customization:</strong> Adjust <code>width</code>, <code>height</code>, <code>animationSpeed</code>, <code>gridCols</code>, <code>gridRows</code>
            </div>
            <div>
              <strong>4. Callbacks:</strong> Use <code>onSpriteGenerated</code> to handle newly generated sprites
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #ffeaa7'
        }}>
          <h3 style={{ marginBottom: '16px' }}>⚙️ Technical Features</h3>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>🤖 <strong>OpenAI Integration:</strong> Uses your existing enhancedOpenaiClient for sprite generation</li>
            <li>🎬 <strong>5x5 Sprite Sheets:</strong> Generates 25-frame animation sequences</li>
            <li>🎮 <strong>PIXI.js Animation:</strong> Smooth AnimatedSprite rendering with customizable speed</li>
            <li>🎨 <strong>Multiple Content Types:</strong> Symbol-only, WILD, SCATTER, BONUS, FREE, JACKPOT, text-only</li>
            <li>⚡ <strong>Animation Complexity:</strong> Simple, medium, or complex animation styles</li>
            <li>🔧 <strong>Flexible Configuration:</strong> Customizable grid size, dimensions, and animation parameters</li>
            <li>💾 <strong>Asset Management:</strong> Modern PIXI.Assets loading with error handling</li>
            <li>🎯 <strong>TypeScript Support:</strong> Full type safety and IntelliSense</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
