import * as PIXI from 'pixi.js';

// Add a GlowFilter implementation to PIXI.filters if not available
// This adds the GlowFilter class to make sure our code works with various PIXI versions

// Define the interface for GlowFilter options
interface GlowFilterOptions {
  distance?: number;
  outerStrength?: number;
  innerStrength?: number;
  color?: number;
  quality?: number;
  knockout?: boolean;
}

// Define our GlowFilter implementation
// We'll conditionally add it to PIXI.filters only when properly initialized
class GlowFilter extends PIXI.Filter {
    constructor(options: GlowFilterOptions = {}) {
      // Default values
      const {
        distance = 10,
        outerStrength = 4,
        innerStrength = 0,
        color = 0xffffff,
        quality = 0.1,
        knockout = false
      } = options;

      // Vertex shader - pass through
      const vertexShader = `
        attribute vec2 aVertexPosition;
        attribute vec2 aTextureCoord;
        
        uniform mat3 projectionMatrix;
        
        varying vec2 vTextureCoord;
        
        void main(void) {
            gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
            vTextureCoord = aTextureCoord;
        }
      `;

      // Fragment shader for the glow effect
      const fragmentShader = `
        varying vec2 vTextureCoord;
        
        uniform sampler2D uSampler;
        uniform vec4 filterArea;
        uniform vec2 dimensions;
        
        uniform vec4 inputSize;
        uniform vec4 outputFrame;
        
        uniform float distance;
        uniform float outerStrength;
        uniform float innerStrength;
        uniform vec4 glowColor;
        uniform float quality;
        uniform bool knockout;
        
        vec2 px = vec2(1.0 / dimensions.x, 1.0 / dimensions.y);
        
        float random(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main(void) {
            vec4 ownColor = texture2D(uSampler, vTextureCoord);
            vec4 curColor;
            float totalAlpha = 0.0;
            float maxTotalAlpha = 0.0;
            float cosAngle;
            float sinAngle;
            
            // Maximum alpha for inner glow
            float maxAlpha = ownColor.a;
            
            // Inner glow contribution
            vec4 innerColor = ownColor;
            if (innerStrength > 0.0) {
                for (float angle = 0.0; angle < 6.283185307179586; angle += <%= quality %>) {
                    cosAngle = cos(angle);
                    sinAngle = sin(angle);
                    for (float offset = 1.0; offset <= <%= distance %>; offset++) {
                        curColor = texture2D(uSampler, vTextureCoord + vec2(cosAngle, sinAngle) * offset * px);
                        totalAlpha += (distance - offset) * curColor.a;
                    }
                }
            }
            
            // Apply inner strength
            innerColor = innerColor + (innerStrength * totalAlpha * glowColor);
            
            // Outer glow contribution
            vec4 outerGlow = vec4(0.0);
            totalAlpha = 0.0;
            
            if (outerStrength > 0.0) {
                for (float angle = 0.0; angle < 6.283185307179586; angle += <%= quality %>) {
                    cosAngle = cos(angle);
                    sinAngle = sin(angle);
                    for (float offset = 1.0; offset <= <%= distance %>; offset++) {
                        curColor = texture2D(uSampler, vTextureCoord + vec2(cosAngle, sinAngle) * offset * px);
                        totalAlpha += (distance - offset) * curColor.a;
                    }
                }
            }
            
            // Apply outer strength
            totalAlpha /= max(1.0, distance * quality * 0.5);
            outerGlow = glowColor.rgba * outerStrength * totalAlpha;
            
            // Calculate final color
            vec4 finalColor;
            if (knockout) {
                finalColor = outerGlow;
            } else {
                finalColor = innerColor + outerGlow;
            }
            
            gl_FragColor = finalColor;
        }
      `.replace(/<%= quality %>/g, quality.toFixed(7))
       .replace(/<%= distance %>/g, distance.toFixed(1));

      // Create the filter with the shaders
      super(vertexShader, fragmentShader);

      // Set uniforms
      this.uniforms.distance = distance;
      this.uniforms.outerStrength = outerStrength;
      this.uniforms.innerStrength = innerStrength;
      this.uniforms.glowColor = new Float32Array([
        ((color >> 16) & 0xFF) / 255,
        ((color >> 8) & 0xFF) / 255,
        (color & 0xFF) / 255,
        1.0
      ]);
      this.uniforms.knockout = knockout;
      this.uniforms.dimensions = new Float32Array([1, 1]);
      this.uniforms.quality = quality;
      
      // Set padding
      this.padding = Math.ceil(distance);
      this.quality = quality;
      this.blur = distance;
    }

    // Update the uniforms when the dimensions change
    apply(filterManager: PIXI.FilterSystem, input: PIXI.RenderTexture, output: PIXI.RenderTexture, clear: boolean): void {
      this.uniforms.dimensions[0] = input.width;
      this.uniforms.dimensions[1] = input.height;
      
      // Apply the filter
      filterManager.applyFilter(this, input, output, clear);
    }
  }

// We will register this filter using the registerGlowFilter function
// instead of immediately adding it to PIXI.filters

// Export our GlowFilter implementation
export default GlowFilter;