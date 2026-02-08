import { useState } from 'react';
import PixiAnimatedSymbol from './pixiSpriteSheet';

export default function Step_SpriteSheetGenerator() {
  const [generatedSprites, setGeneratedSprites] = useState<Array<{
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
  }>>([]);

  const handleSpriteGenerated = (spriteUrl: string, prompt?: string) => {
    const newSprite = {
      id: `sprite_${Date.now()}`,
      url: spriteUrl,
      prompt: prompt || 'Generated sprite',
      timestamp: Date.now()
    };
    
    setGeneratedSprites(prev => [...prev, newSprite]);
    console.log('✅ New animated sprite added to collection:', newSprite);
  };

  const removeSprite = (id: string) => {
    setGeneratedSprites(prev => prev.filter(sprite => sprite.id !== id));
  };

  return (
    <div className="step-container" style={{ padding: '24px' }}>
      {/* Step Header */}
      <div className="step-header" style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          background: 'linear-gradient(45deg, #007bff, #28a745)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🎬 Animated Sprite Sheet Generator
        </h2>
        <p style={{ fontSize: '16px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
          Generate custom animated sprite sheets using AI. Create 5x5 grid animations 
          with 25 frames for smooth slot machine symbol animations.
        </p>
      </div>

      {/* Main Generator */}
      <div className="generator-section" style={{ marginBottom: '40px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          border: '2px solid #007bff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,123,255,0.15)'
        }}>
          <PixiAnimatedSymbol
            enableGeneration={true}
            onSpriteGenerated={(url) => handleSpriteGenerated(url)}
            width={320}
            height={320}
            animationSpeed={0.12}
          />
        </div>
      </div>

      {/* Generated Sprites Collection */}
      {generatedSprites.length > 0 && (
        <div className="sprites-collection" style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🎨 Your Generated Sprites ({generatedSprites.length})
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {generatedSprites.map((sprite) => (
              <div 
                key={sprite.id}
                style={{ 
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}
              >
                {/* Remove Button */}
                <button
                  onClick={() => removeSprite(sprite.id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Remove sprite"
                >
                  ×
                </button>

                {/* Sprite Animation */}
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <PixiAnimatedSymbol
                    imageUrl={sprite.url}
                    width={200}
                    height={200}
                    animationSpeed={0.1}
                  />
                </div>

                {/* Sprite Info */}
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    Generated: {new Date(sprite.timestamp).toLocaleTimeString()}
                  </div>
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    wordBreak: 'break-word'
                  }}>
                    {sprite.prompt}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '12px' 
                }}>
                  <button
                    onClick={() => {
                      // Copy sprite URL to clipboard
                      navigator.clipboard.writeText(sprite.url);
                      alert('Sprite URL copied to clipboard!');
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    📋 Copy URL
                  </button>
                  <button
                    onClick={() => {
                      // Download sprite sheet
                      const link = document.createElement('a');
                      link.href = sprite.url;
                      link.download = `sprite_${sprite.id}.png`;
                      link.click();
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    💾 Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integration Tips */}
      <div style={{ 
        background: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '32px'
      }}>
        <h4 style={{ marginBottom: '12px', color: '#0056b3' }}>
          💡 Integration Tips
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#0056b3' }}>
          <li>Generated sprites are automatically saved and can be reused across your game</li>
          <li>Each sprite sheet contains 25 frames in a 5x5 grid for smooth animation loops</li>
          <li>Use the Copy URL feature to integrate sprites into other components</li>
          <li>Download sprites for use in external tools or as backup assets</li>
          <li>Experiment with different animation complexities for varied effects</li>
        </ul>
      </div>
    </div>
  );
}
