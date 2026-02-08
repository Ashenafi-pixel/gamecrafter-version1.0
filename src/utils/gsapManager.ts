import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import { pixiResourceManager } from './pixiResourceManager';

/**
 * GSAPManager - Utility for tracking and cleaning up GSAP animations
 * 
 * This utility helps prevent memory leaks by providing functions to create and
 * track GSAP animations, ensuring they are properly killed when components unmount.
 */
class GSAPManager {
  // Track animations by component ID
  private animations: Map<string, gsap.core.Tween[]> = new Map();
  
  // Track timelines by component ID
  private timelines: Map<string, gsap.core.Timeline[]> = new Map();
  
  // Singleton instance
  private static instance: GSAPManager;
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): GSAPManager {
    if (!GSAPManager.instance) {
      GSAPManager.instance = new GSAPManager();
    }
    return GSAPManager.instance;
  }
  
  /**
   * Create and track a GSAP animation
   * @param componentId Component identifier
   * @param target Target object to animate
   * @param vars Animation variables
   * @returns The GSAP animation
   */
  public to(componentId: string, target: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween {
    const tween = gsap.to(target, vars);
    this.registerAnimation(componentId, tween);
    return tween;
  }
  
  /**
   * Create and track a GSAP timeline
   * @param componentId Component identifier
   * @param vars Timeline variables
   * @returns The GSAP timeline
   */
  public timeline(componentId: string, vars?: gsap.TimelineVars): gsap.core.Timeline {
    const timeline = gsap.timeline(vars);
    this.registerTimeline(componentId, timeline);
    return timeline;
  }
  
  /**
   * Register an animation with the manager
   * @param componentId Component identifier
   * @param animation GSAP animation to track
   */
  public registerAnimation(componentId: string, animation: gsap.core.Tween): void {
    const animations = this.animations.get(componentId) || [];
    animations.push(animation);
    this.animations.set(componentId, animations);
    
    // Also register with PIXI resource manager for redundant safety
    pixiResourceManager.registerGsapAnimation(componentId, animation);
  }
  
  /**
   * Register a timeline with the manager
   * @param componentId Component identifier
   * @param timeline GSAP timeline to track
   */
  public registerTimeline(componentId: string, timeline: gsap.core.Timeline): void {
    const timelines = this.timelines.get(componentId) || [];
    timelines.push(timeline);
    this.timelines.set(componentId, timelines);
    
    // Also register with PIXI resource manager for redundant safety
    pixiResourceManager.registerGsapAnimation(componentId, timeline);
  }
  
  /**
   * Clean up all animations for a component
   * @param componentId Component identifier
   */
  public cleanupComponent(componentId: string): void {
    // Kill all animations
    const animations = this.animations.get(componentId) || [];
    animations.forEach(animation => {
      animation.kill();
    });
    this.animations.delete(componentId);
    
    // Kill all timelines
    const timelines = this.timelines.get(componentId) || [];
    timelines.forEach(timeline => {
      timeline.kill();
    });
    this.timelines.delete(componentId);
  }
}

// Export the singleton instance
export const gsapManager = GSAPManager.getInstance();

/**
 * React hook for safely using GSAP animations with automatic cleanup
 * @param componentId Unique identifier for the component
 * @returns Object with tracked GSAP methods
 */
export function useTrackedGSAP(componentId: string) {
  const animationsRef = useRef<(gsap.core.Tween | gsap.core.Timeline)[]>([]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Kill all tracked animations and timelines
      animationsRef.current.forEach(anim => {
        if (anim && typeof anim.kill === 'function') {
          anim.kill();
        }
      });
      animationsRef.current = [];
      
      // Also use the manager for redundant safety
      gsapManager.cleanupComponent(componentId);
    };
  }, [componentId]);
  
  // Return tracked GSAP methods
  return {
    to: (target: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween => {
      const tween = gsap.to(target, vars);
      animationsRef.current.push(tween);
      return tween;
    },
    
    from: (target: gsap.TweenTarget, vars: gsap.TweenVars): gsap.core.Tween => {
      const tween = gsap.from(target, vars);
      animationsRef.current.push(tween);
      return tween;
    },
    
    fromTo: (
      target: gsap.TweenTarget, 
      fromVars: gsap.TweenVars, 
      toVars: gsap.TweenVars
    ): gsap.core.Tween => {
      const tween = gsap.fromTo(target, fromVars, toVars);
      animationsRef.current.push(tween);
      return tween;
    },
    
    timeline: (vars?: gsap.TimelineVars): gsap.core.Timeline => {
      const timeline = gsap.timeline(vars);
      animationsRef.current.push(timeline);
      return timeline;
    },
    
    // Add any animation to tracking
    track: (animation: gsap.core.Tween | gsap.core.Timeline): void => {
      animationsRef.current.push(animation);
    },
    
    // Kill all tracked animations for this component
    killAll: (): void => {
      animationsRef.current.forEach(anim => {
        if (anim && typeof anim.kill === 'function') {
          anim.kill();
        }
      });
      animationsRef.current = [];
    }
  };
}