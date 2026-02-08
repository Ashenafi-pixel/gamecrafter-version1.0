import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store';
import { autoCropImage } from '../../utils/autoCropImage';

interface NumberImageRendererProps {
  value: number | string;
  className?: string;
  imageHeight?: number | string;
  imageWidth?: number | string;
  fallbackClassName?: string;
}

/**
 * Renders numbers using generated number images from Step 8
 * Falls back to text if images are not available
 */
export const NumberImageRenderer: React.FC<NumberImageRendererProps> = ({
  value,
  className = '',
  imageHeight = '1em',
  imageWidth = 'auto',
  fallbackClassName = ''
}) => {
  const { config } = useGameStore();
  const numberImages = config.generatedAssets?.numberImages;
  
  // State to store cropped dot image
  const [croppedDotUrl, setCroppedDotUrl] = useState<string | null>(null);
  const [isCroppingDot, setIsCroppingDot] = useState(false);
  const [lastDotUrl, setLastDotUrl] = useState<string | null>(null);

  // Check if number images are available
  const hasNumberImages = numberImages && Object.keys(numberImages).length > 0;

  // Auto-crop dot image when it's available
  useEffect(() => {
    const dotImageUrl = numberImages?.['dot'];
    
    // If dot image URL changed, reset cropped version
    if (dotImageUrl && dotImageUrl !== lastDotUrl) {
      setLastDotUrl(dotImageUrl);
      setCroppedDotUrl(null); // Reset to trigger re-cropping
    }
    
    // Only crop if we have a dot image URL, haven't cropped it yet, and not currently cropping
    if (dotImageUrl && !croppedDotUrl && !isCroppingDot) {
      setIsCroppingDot(true);
      autoCropImage(dotImageUrl, 2) // 2px padding around content
        .then((cropped) => {
          setCroppedDotUrl(cropped);
          setIsCroppingDot(false);
        })
        .catch((error) => {
          console.warn('Failed to auto-crop dot image, using original:', error);
          setCroppedDotUrl(dotImageUrl); // Fallback to original
          setIsCroppingDot(false);
        });
    }
  }, [numberImages?.['dot'], croppedDotUrl, isCroppingDot, lastDotUrl]);

  // Convert value to string and format it
  const formattedValue = typeof value === 'number' ? value.toFixed(2) : value.toString();
  const valueString = formattedValue.replace(/[^\d.]/g, ''); // Remove non-digit/non-dot characters

  // If no images available, fall back to text
  if (!hasNumberImages) {
    return (
      <span className={`${className} ${fallbackClassName}`}>
        {formattedValue}
      </span>
    );
  }

  // Render each character as an image
  return (
    <span className={`inline-flex items-center ${className}`}>
      {valueString.split('').map((char, index) => {
        const imageKey = char === '.' ? 'dot' : parseInt(char);
        const isDot = char === '.';
        
        // Use cropped dot image if available, otherwise use original
        const imageUrl = isDot 
          ? (croppedDotUrl || numberImages?.[imageKey])
          : numberImages?.[imageKey];

        if (imageUrl) {
          // For digits, use auto width to maintain aspect ratio
          // For dots, use auto width since we've already cropped the padding
          const finalWidth = imageWidth === 'auto' ? 'auto' : imageWidth;

          return (
            <img
              key={`${char}-${index}`}
              src={imageUrl}
              alt={char}
              style={{
                height: imageHeight,
                width: finalWidth,
                display: 'inline-block',
                verticalAlign: 'middle',
                objectFit: 'contain'
              }}
              className="inline-block"
            />
          );
        } else {
          // Fallback to text if specific character image is missing
          return (
            <span key={`${char}-${index}`} className={fallbackClassName}>
              {char}
            </span>
          );
        }
      })}
    </span>
  );
};

