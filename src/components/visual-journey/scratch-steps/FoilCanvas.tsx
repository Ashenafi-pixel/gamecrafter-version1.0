import React, { forwardRef } from 'react';

/**
 * FoilCanvas – a thin wrapper around a <canvas> element that will be used as the foil layer.
 * It forwards a ref to the underlying canvas so the ScratchEngine can draw on it.
 * The component ensures the canvas always matches the size of its container (CSS width/height)
 * and applies the appropriate device‑pixel‑ratio scaling.
 */
const FoilCanvas = forwardRef<HTMLCanvasElement, { className?: string }>((props, ref) => {
    const { className } = props;

    // NOTE: Canvas resizing is now handled by the useScratchEngine hook via ResizeObserver.
    // This component remains as a dumb wrapper to position the canvas.

    return (
        <canvas
            ref={ref as React.Ref<HTMLCanvasElement>}
            className={className}
            style={{ width: '100%', height: '100%', touchAction: 'none', display: 'block' }}
        />
    );
});

FoilCanvas.displayName = 'FoilCanvas';
export default FoilCanvas;
