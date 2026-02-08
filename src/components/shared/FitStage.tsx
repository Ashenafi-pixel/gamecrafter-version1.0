import React, { useLayoutEffect, useRef, useState } from "react";

type FitStageProps = {
    /** Your “design size” (the size you built the ticket at) */
    designWidth: number;
    designHeight: number;
    className?: string;
    children: React.ReactNode;
    allowOverflow?: boolean;
};

export function FitStage({
    designWidth,
    designHeight,
    className,
    children,
    allowOverflow = false,
}: FitStageProps) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        const ro = new ResizeObserver(([entry]) => {
            const { width: hostW, height: hostH } = entry.contentRect;

            // Fit entire stage inside host while preserving aspect ratio
            // If host is 0 (hidden), minimize scale to avoid issues
            if (hostW === 0 || hostH === 0) {
                setScale(0);
                return;
            }

            const s = Math.min(hostW / designWidth, hostH / designHeight);

            // Optional: clamp so it never gets comically huge or microscopic
            // Lower bound 0.1 to prevent essentially disappearing
            const clamped = Math.max(s, 0.05);
            setScale(clamped);
        });

        ro.observe(host);
        return () => ro.disconnect();
    }, [designWidth, designHeight]);

    return (
        <div
            ref={hostRef}
            className={`relative w-full h-full ${allowOverflow ? '' : 'overflow-hidden'} flex items-center justify-center ${className ?? ""}`}
        >
            <div
                style={{
                    width: designWidth,
                    height: designHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                    flexShrink: 0, // Ensure it doesn't get squashed by flex parent
                }}
            >
                {children}
            </div>
        </div>
    );
}
