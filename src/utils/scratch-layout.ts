
export interface SafeArea {
    width: number;
    height: number;
    paddingX: number;
    paddingY: number;
    scale: number;
}

/**
 * Calculates the safe area for the play grid based on the card shape and padding.
 * Ensures the grid does not get clipped by rounded corners or circular frames.
 */
export const calculateSafeArea = (
    shape: 'rectangle' | 'rounded' | 'circle' | 'custom',
    basePadding: number,
    containerWidth: number,
    containerHeight: number
): SafeArea => {
    let paddingX = basePadding;
    let paddingY = basePadding;
    let scale = 1;

    // 1. Rectangle: Just respect the base padding
    if (shape === 'rectangle') {
        return {
            width: containerWidth - (basePadding * 2),
            height: containerHeight - (basePadding * 2),
            paddingX,
            paddingY,
            scale
        };
    }

    // 2. Rounded: Account for corner radius (approx 16-32px usually)
    // If grid is full width, corners might clip corner cells.
    if (shape === 'rounded') {
        // Standard safe inset for rounded corners is usually radius/2 roughly if strictly checking corners,
        // but simple padding usually suffices. We'll add a slight bonus.
        // but simple padding usually suffices. We'll add a slight bonus.
        const cornerSafety = 20; // Increased from 12 to ensure footer safety
        paddingX = Math.max(basePadding, cornerSafety);
        paddingY = Math.max(basePadding, cornerSafety + 8); // Extra bottom safety for rounded corners too
    }

    // 3. Circle: The grid must fit inside the incribed square (or rectangle) of the circle/ellipse.
    // For a circle of diameter D, the max square side is D / sqrt(2) ≈ 0.707 * D.
    if (shape === 'circle') {
        // Assume the container effectively masks to an ellipse/circle
        // We find the largest rectangle with the same aspect ratio as the container that fits in the ellipse.
        // Simplified: Scale down to 70% to be safe + padding.
        const safetyFactor = 0.70;

        // Effective dimensions available
        const availW = containerWidth * safetyFactor;
        const availH = containerHeight * safetyFactor;

        // Calculate padding needed to achieve this size
        paddingX = (containerWidth - availW) / 2 + basePadding;
        paddingY = (containerHeight - availH) / 2 + basePadding;

        // Extra Safety for Footer Text (MAX WIN) at the bottom
        // Circular shapes taper quickly at the bottom, so we need more clearance there.
        paddingY += 15;
    }

    // 4. Custom: Without analyzing the mask alpha channel, we have to assume a worst-case safe area 
    // or rely on the user manually setting high padding. 
    // We'll treat it similar to 'Rounded' but maybe slightly more aggressive default?
    // For now, return standard calculation but let the component handle manual overrides.
    if (shape === 'custom') {
        // Default to safe defaults
        paddingX = Math.max(basePadding, 20);
        paddingY = Math.max(basePadding, 20);
    }

    return {
        width: containerWidth - (paddingX * 2),
        height: containerHeight - (paddingY * 2),
        paddingX,
        paddingY,
        scale
    };
};
