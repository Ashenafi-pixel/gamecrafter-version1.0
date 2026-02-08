/**
 * Auto-crops transparent padding from images
 * Detects the actual content bounds and removes extra transparent space
 */

// Cache for cropped images to avoid reprocessing
const croppedImageCache = new Map<string, string>();

/**
 * Finds the bounding box of non-transparent content in an image
 */
function findContentBounds(
  imageData: ImageData
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const { data, width, height } = imageData;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasContent = false;

  // Scan all pixels to find content bounds
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3]; // Alpha channel

      // If pixel is not fully transparent, it's content
      if (alpha > 0) {
        hasContent = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!hasContent) {
    return null; // No content found
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Auto-crops transparent padding from an image
 * @param imageUrl - The source image URL (data URL or regular URL)
 * @param padding - Optional padding to add around the content (in pixels, default: 2)
 * @returns Cropped image as data URL
 */
export async function autoCropImage(
  imageUrl: string,
  padding: number = 2
): Promise<string> {
  // Check cache first
  const cacheKey = `${imageUrl}_${padding}`;
  if (croppedImageCache.has(cacheKey)) {
    return croppedImageCache.get(cacheKey)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Create canvas to read image data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0);

        // Get image data to analyze
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Find content bounds
        const bounds = findContentBounds(imageData);
        if (!bounds) {
          // No content found, return original
          resolve(imageUrl);
          return;
        }

        // Add padding
        const cropX = Math.max(0, bounds.minX - padding);
        const cropY = Math.max(0, bounds.minY - padding);
        const cropWidth = Math.min(
          canvas.width - cropX,
          bounds.maxX - bounds.minX + padding * 2
        );
        const cropHeight = Math.min(
          canvas.height - cropY,
          bounds.maxY - bounds.minY + padding * 2
        );

        // Create new canvas for cropped image
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        if (!croppedCtx) {
          reject(new Error('Could not get cropped canvas context'));
          return;
        }

        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;

        // Draw cropped portion
        croppedCtx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        // Convert to data URL
        const croppedDataUrl = croppedCanvas.toDataURL('image/png');

        // Cache the result
        croppedImageCache.set(cacheKey, croppedDataUrl);

        resolve(croppedDataUrl);
      } catch (error) {
        console.error('Error auto-cropping image:', error);
        // Fallback to original image on error
        resolve(imageUrl);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for auto-crop'));
    };

    img.src = imageUrl;
  });
}

/**
 * Clears the cropped image cache
 */
export function clearAutoCropCache(): void {
  croppedImageCache.clear();
}

