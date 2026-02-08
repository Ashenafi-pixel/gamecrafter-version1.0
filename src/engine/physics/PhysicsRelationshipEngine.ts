/**
 * Physics Relationship Engine
 * Analyzes relationships between detected elements and applies physics rules
 */

import { DetectedElement } from '../ai/AIElementDetector';

export class PhysicsRelationshipEngine {
  
  /**
   * Analyze relationships between elements and apply physics rules
   */
  async analyzeRelationships(elements: DetectedElement[]): Promise<DetectedElement[]> {
    console.log('⚡ [Physics Engine] Analyzing element relationships...');

    const elementsWithRelationships = [...elements];

    // Apply relationship analysis for each element
    for (let i = 0; i < elementsWithRelationships.length; i++) {
      const element = elementsWithRelationships[i];
      element.relationships = this.calculateRelationships(element, elementsWithRelationships);
    }

    console.log(`✅ [Physics Engine] Relationships calculated for ${elements.length} elements`);
    return elementsWithRelationships;
  }

  /**
   * Calculate relationships for a specific element
   */
  private calculateRelationships(element: DetectedElement, allElements: DetectedElement[]): Array<{
    elementId: string;
    type: 'attracts' | 'repels' | 'orbits' | 'sparkles_from' | 'illuminates' | 'attached_to';
    strength: number;
  }> {
    const relationships = [];

    for (const other of allElements) {
      if (other.id === element.id) continue;

      const distance = this.calculateDistance(element.position, other.position);
      const relationship = this.determineRelationshipType(element, other, distance);

      if (relationship) {
        relationships.push(relationship);
      }
    }

    return relationships;
  }

  /**
   * Determine the type of relationship between two elements
   */
  private determineRelationshipType(
    element1: DetectedElement, 
    element2: DetectedElement, 
    distance: number
  ): { elementId: string; type: any; strength: number } | null {
    
    // Close proximity relationships (distance < 100 pixels)
    if (distance < 100) {
      
      // Gems attract sparkles
      if (element1.type === 'gem' && element2.type === 'sparkle') {
        return {
          elementId: element2.id,
          type: 'attracts',
          strength: Math.max(0.1, 1 - distance / 100)
        };
      }

      // Stars illuminate nearby elements
      if (element1.type === 'star' && ['gem', 'coin'].includes(element2.type)) {
        return {
          elementId: element2.id,
          type: 'illuminates',
          strength: Math.max(0.2, 1 - distance / 80)
        };
      }

      // Fire creates sparkles
      if (element1.type === 'fire' && element2.type === 'sparkle') {
        return {
          elementId: element2.id,
          type: 'sparkles_from',
          strength: Math.max(0.3, 1 - distance / 60)
        };
      }

      // Characters are attached to weapons
      if (element1.type === 'character' && element2.type === 'weapon') {
        return {
          elementId: element2.id,
          type: 'attached_to',
          strength: 0.9
        };
      }
    }

    // Medium range relationships (distance < 200 pixels)
    if (distance < 200) {
      
      // High-energy elements attract each other
      const energy1 = element1.properties.energy || 5;
      const energy2 = element2.properties.energy || 5;
      
      if (energy1 > 7 && energy2 > 7) {
        return {
          elementId: element2.id,
          type: 'attracts',
          strength: Math.max(0.1, (energy1 + energy2) / 20 * (1 - distance / 200))
        };
      }

      // Similar types orbit each other
      if (element1.type === element2.type && ['gem', 'star', 'coin'].includes(element1.type)) {
        return {
          elementId: element2.id,
          type: 'orbits',
          strength: Math.max(0.15, 0.5 - distance / 400)
        };
      }
    }

    // Energy-based attraction across longer distances
    if (distance < 300) {
      const energy1 = element1.properties.energy || 5;
      const energy2 = element2.properties.energy || 5;

      // Very high energy elements have long-range effects
      if (energy1 > 8 || energy2 > 8) {
        return {
          elementId: element2.id,
          type: 'illuminates',
          strength: Math.max(0.05, (Math.max(energy1, energy2) - 8) / 2 * (1 - distance / 300))
        };
      }
    }

    return null;
  }

  /**
   * Calculate Euclidean distance between two points
   */
  private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }

  /**
   * Get physics properties for an element type
   */
  getPhysicsProperties(element: DetectedElement) {
    const baseProps = {
      mass: 1,
      friction: 0.1,
      bounce: 0.3,
      magnetism: 0,
      lightEmission: 0
    };

    switch (element.type) {
      case 'gem':
        return {
          ...baseProps,
          mass: 2,
          bounce: 0.8,
          magnetism: element.properties.energy || 5,
          lightEmission: (element.properties.energy || 5) * 0.1
        };

      case 'star':
        return {
          ...baseProps,
          mass: 0.5,
          friction: 0.05,
          bounce: 1.2,
          magnetism: element.properties.energy || 8,
          lightEmission: (element.properties.energy || 8) * 0.2
        };

      case 'sparkle':
        return {
          ...baseProps,
          mass: 0.1,
          friction: 0.02,
          bounce: 1.5,
          magnetism: -(element.properties.energy || 3), // Repelled by others
          lightEmission: (element.properties.energy || 3) * 0.3
        };

      case 'fire':
        return {
          ...baseProps,
          mass: 0.3,
          friction: 0.01,
          bounce: 0.1,
          magnetism: element.properties.energy || 9,
          lightEmission: (element.properties.energy || 9) * 0.4
        };

      case 'beam':
        return {
          ...baseProps,
          mass: 0,
          friction: 0,
          bounce: 0,
          magnetism: 0,
          lightEmission: (element.properties.energy || 7) * 0.5
        };

      default:
        return baseProps;
    }
  }
}