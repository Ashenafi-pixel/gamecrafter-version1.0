import React, { useState } from 'react';
import PixiContainer from './PixiContainer';
import * as PIXI from 'pixi.js';
import { useTrackedGSAP } from '../../utils/gsapManager';
import { useTrackedAnimationFrame } from './withAnimationFrameTracking';
import { pixiResourceManager } from '../../utils/pixiResourceManager';

/**
 * Example component demonstrating optimal PIXI.js usage with proper resource management
 * 
 * This component serves as a demonstration of how to use the resource management 
 * utilities to create PIXI.js applications with proper memory management.
 */
const OptimizedPixiDemo: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const componentId = 'optimized-pixi-demo';
  
  // Get tracked versions of GSAP and requestAnimationFrame
  const trackedGSAP = useTrackedGSAP(componentId);
  const requestTrackedFrame = useTrackedAnimationFrame(componentId);
  
  // Handle app initialization
  const handleAppReady = (app: PIXI.Application) => {
    console.log('PIXI application ready');
    
    // Create a container for our content
    const container = new PIXI.Container();
    app.stage.addChild(container);
    
    // Center the container
    container.x = app.renderer.width / 2;
    container.y = app.renderer.height / 2;
    
    // Create some example sprites
    const createExampleSprites = () => {
      // Create a circle using graphics (rather than loading external textures)
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0x3498db);
      graphics.drawCircle(0, 0, 50);
      graphics.endFill();
      
      // Generate a texture from the graphics object and register it with the resource manager
      const circleTexture = pixiResourceManager.createTextureFromGraphics(
        `${componentId}-circle`, 
        graphics, 
        app.renderer
      );
      
      // Create 5 sprites using the same texture (efficient)
      for (let i = 0; i < 5; i++) {
        const sprite = new PIXI.Sprite(circleTexture);
        sprite.anchor.set(0.5);
        
        // Position in a circle
        const angle = (i / 5) * Math.PI * 2;
        sprite.x = Math.cos(angle) * 100;
        sprite.y = Math.sin(angle) * 100;
        
        container.addChild(sprite);
        
        // Animate with GSAP (tracked automatically)
        trackedGSAP.to(sprite, {
          x: sprite.x + Math.random() * 20 - 10,
          y: sprite.y + Math.random() * 20 - 10,
          rotation: Math.PI * 2,
          duration: 2 + Math.random() * 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      }
    };
    
    // Call the function to create sprites
    createExampleSprites();
    
    // Set up an animation loop with proper tracking
    const animate = () => {
      container.rotation += 0.01;
      
      // Only request another frame if we're still running
      if (isRunning) {
        requestTrackedFrame(animate);
      }
    };
    
    // Start animation loop when component mounts
    setIsRunning(true);
    requestTrackedFrame(animate);
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg p-5 border">
      <h2 className="text-xl font-bold mb-4">Optimized PIXI.js Demo</h2>
      <p className="mb-4 text-gray-600">
        This component demonstrates proper PIXI.js resource management using the new utility functions.
        All animations, textures, and objects are properly tracked and cleaned up on unmount.
      </p>
      
      <div className="aspect-video relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <PixiContainer
          width={800}
          height={450}
          backgroundColor={0xf8f9fa}
          componentId={componentId}
          onAppReady={handleAppReady}
        />
      </div>
      
      <div className="mt-4 text-sm">
        <ul className="list-disc list-inside text-gray-600">
          <li>Uses PixiContainer for automatic resource management</li>
          <li>All GSAP animations are tracked and properly cleaned up</li>
          <li>Animation frames are managed to prevent memory leaks</li>
          <li>Textures are registered with the resource manager</li>
          <li>All resources are properly cleaned up on unmount</li>
        </ul>
      </div>
    </div>
  );
};

export default OptimizedPixiDemo;