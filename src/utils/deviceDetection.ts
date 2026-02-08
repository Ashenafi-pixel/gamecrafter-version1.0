/**
 * Device Detection Utility
 * 
 * Detects device type and orientation for responsive logo positioning
 */

export type DeviceType = 'desktop' | 'mobilePortrait' | 'mobileLandscape';

/**
 * Detect current device type based on screen size and orientation
 */
export function detectDeviceType(): DeviceType {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return 'desktop';
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Mobile breakpoint (768px is common mobile/tablet breakpoint)
  const isMobile = width <= 768;
  
  if (!isMobile) {
    return 'desktop';
  }
  
  // For mobile devices, check orientation
  const isLandscape = width > height;
  return isLandscape ? 'mobileLandscape' : 'mobilePortrait';
}

/**
 * Listen for device orientation/resize changes
 */
export function onDeviceTypeChange(callback: (deviceType: DeviceType) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let currentDeviceType = detectDeviceType();
  
  const handleResize = () => {
    const newDeviceType = detectDeviceType();
    if (newDeviceType !== currentDeviceType) {
      currentDeviceType = newDeviceType;
      callback(newDeviceType);
    }
  };

  const handleOrientationChange = () => {
    // Small delay to allow for orientation change to complete
    setTimeout(() => {
      const newDeviceType = detectDeviceType();
      if (newDeviceType !== currentDeviceType) {
        currentDeviceType = newDeviceType;
        callback(newDeviceType);
      }
    }, 100);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleOrientationChange);
  
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleOrientationChange);
  };
}

/**
 * Get default logo position for device type
 * Uses percentage values: 50% = center, 0% = left, 100% = right
 */
export function getDefaultLogoPosition(deviceType: DeviceType): { x: number; y: number } {
  switch (deviceType) {
    case 'desktop':
      return { x: 50, y: 10 }; // 50% = center horizontally, 10% from top
    case 'mobilePortrait':
      return { x: 50, y: 10 }; // 50% = center horizontally, 10% from top
    case 'mobileLandscape':
      return { x: 50, y: 10 }; // 50% = center horizontally, 10% from top
    default:
      return { x: 50, y: 10 }; // 50% = center horizontally, 10% from top
  }
}

/**
 * Get default logo scale for device type
 */
export function getDefaultLogoScale(deviceType: DeviceType): number {
  switch (deviceType) {
    case 'desktop':
      return 120; // Increased from 100 for better visibility
    case 'mobilePortrait':
      return 100; // Increased from 80 for better visibility  
    case 'mobileLandscape':
      return 90; // Increased from 70 for better visibility
    default:
      return 120;
  }
}