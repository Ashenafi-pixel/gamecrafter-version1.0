import React, { useEffect, useRef } from 'react';
import { pixiResourceManager } from '../../utils/pixiResourceManager';

/**
 * Higher-Order Component (HOC) that adds animation frame tracking to any component
 * 
 * This HOC ensures that all animation frames are properly tracked and cleaned up
 * when the component unmounts, preventing memory leaks.
 * 
 * @param WrappedComponent The component to wrap
 * @returns A new component with animation frame tracking
 */
export function withAnimationFrameTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P & { componentId: string }> {
  return function WithAnimationFrameTracking(props: P & { componentId: string }) {
    const { componentId, ...rest } = props;
    const animationFramesRef = useRef<number[]>([]);
    
    // Replace the global requestAnimationFrame with our tracked version
    const originalRAF = window.requestAnimationFrame;
    
    useEffect(() => {
      // Create a patched version of requestAnimationFrame that tracks the frame IDs
      const patchedRequestAnimationFrame = (callback: FrameRequestCallback) => {
        // Use resource manager to register and track the animation frame
        const frameId = pixiResourceManager.animationFrame(componentId, callback);
        animationFramesRef.current.push(frameId);
        return frameId;
      };
      
      // Store original for safety
      const originalRequestAnimationFrame = window.requestAnimationFrame;
      
      // Apply the patch only within the scope of this component
      // This patched version only applies to code called within this component's methods
      (WrappedComponent.prototype as any).requestAnimationFrame = patchedRequestAnimationFrame;
      
      // Cleanup function
      return () => {
        // Restore original requestAnimationFrame
        (WrappedComponent.prototype as any).requestAnimationFrame = originalRequestAnimationFrame;
        
        // Cancel all animation frames
        animationFramesRef.current.forEach(frameId => {
          cancelAnimationFrame(frameId);
        });
        
        // Empty the array
        animationFramesRef.current = [];
      };
    }, [componentId]);
    
    // Inject a requestAnimationFrame utility function
    const requestTrackedAnimationFrame = (callback: FrameRequestCallback) => {
      const frameId = originalRAF(callback);
      pixiResourceManager.registerAnimationFrame(componentId, frameId);
      animationFramesRef.current.push(frameId);
      return frameId;
    };
    
    // Pass the tracked requestAnimationFrame to the wrapped component
    return (
      <WrappedComponent
        {...(rest as P)}
        componentId={componentId}
        requestAnimationFrame={requestTrackedAnimationFrame}
      />
    );
  };
}

/**
 * React hook for safely using animation frames with automatic cleanup
 * @param componentId Unique identifier for the component
 * @returns A function that requests an animation frame and automatically tracks it
 */
export function useTrackedAnimationFrame(componentId: string) {
  const frameIds = useRef<number[]>([]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all tracked animation frames
      frameIds.current.forEach(id => {
        cancelAnimationFrame(id);
      });
      frameIds.current = [];
    };
  }, []);
  
  // Return a function that requests an animation frame and tracks it
  return (callback: FrameRequestCallback): number => {
    const frameId = pixiResourceManager.animationFrame(componentId, callback);
    frameIds.current.push(frameId);
    return frameId;
  };
}