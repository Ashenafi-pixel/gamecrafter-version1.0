import React, { ReactNode } from 'react';
import FoilCanvas from './FoilCanvas';

interface ScratchCardProps {
    children?: ReactNode;
    containerRef: React.RefObject<HTMLDivElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    className?: string;
    style?: React.CSSProperties;
    // Optional override for foil color/image if we want to pass it down directly
    // though the engine handles drawing usually.
    foilVisible?: boolean;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({
    children,
    containerRef,
    canvasRef,
    className = '',
    style = {},
    foilVisible = true
}) => {
    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden preserve-3d ${className}`}
            style={{
                // Ensure the card has a backing context for the canvas to size against
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                borderRadius: 'var(--card-radius, 16px)', // Default compliant radius
                ...style
            }}
        >
            {/* 1. Underlying Content (Symbols, Backgrounds) */}
            {children}

            {/* 2. Foil Layer (Top) */}
            <FoilCanvas
                ref={canvasRef}
                className={`absolute inset-0 z-30 w-full h-full touch-none ${className.includes('cursor-none') ? 'cursor-none' : 'cursor-crosshair'} ${foilVisible ? '' : 'invisible pointer-events-none'}`}
            />
        </div>
    );
};
