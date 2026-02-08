import { useRef, useEffect, useState, useCallback } from 'react';

// --- TIER 1 ENGINE CONFIGURATION ---
interface EngineConfig {
    brushSize: number;
    enabled: boolean;
    pixelDensity: number; // For High-DPI
    throttleProgress: number; // ms between progress checks
    brushImage?: HTMLImageElement | null; // [NEW] Custom brush shape
}

// --- CORE ENGINE CLASS (Logic separated from React) ---
class ScratchEngineCore {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    // State
    private isDrawing = false;
    private lastPos: { x: number; y: number } | null = null;
    private config: EngineConfig;
    private dirty = false;
    private lastProgressCheck = 0; // for throttled progress checks
    private initialized = false; // tracks if initial resize done
    private observers: ResizeObserver[] = [];

    // State persistence for resize re-draws
    private currentImageSource: string | null = null;
    private currentFillStyle: string | CanvasPattern | CanvasGradient = '#C0C0C0';

    // Callback placeholders
    public onProgress?: (percent: number) => void;
    public onScratchStart?: () => void;
    public onScratchEnd?: () => void;
    public onScratchMove?: (x: number, y: number, dx: number, dy: number, speed: number, isMaskHit?: boolean) => void;
    public onResize?: () => void;

    constructor(
        canvas: HTMLCanvasElement,
        config: Partial<EngineConfig> = {}
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true })!;
        this.config = {
            brushSize: config.brushSize || 40,
            enabled: config.enabled ?? true,
            pixelDensity: window.devicePixelRatio || 1,
            throttleProgress: 200,
        };
        const ro = new ResizeObserver(() => this.resize());
        ro.observe(this.canvas);
        this.observers.push(ro);
        // Initial sizing and foil fill
        this.resize();
        this.reset('#C0C0C0');
    }

    public updateConfig(newConfig: Partial<EngineConfig>) {
        this.config = { ...this.config, ...newConfig };
    }

    public resize() {
        const dpr = window.devicePixelRatio || 1;
        // rect was unused in new logic

        // Use Layout Size (offsetWidth) as the source of truth for resolution.
        // This ensures the canvas quality matches the card's design size (e.g. 1000px),
        // even if shown small on screen (FitStage).
        const layoutW = this.canvas.offsetWidth;
        const layoutH = this.canvas.offsetHeight;

        // Fallback for hidden elements
        if (!layoutW || !layoutH) return;

        const MAX_DIMENSION = 4096; // Increased for larger cards
        let targetW = Math.round(layoutW * dpr);
        let targetH = Math.round(layoutH * dpr);

        if (targetW > MAX_DIMENSION || targetH > MAX_DIMENSION) {
            const scale = Math.min(MAX_DIMENSION / targetW, MAX_DIMENSION / targetH);
            targetW = Math.round(targetW * scale);
            targetH = Math.round(targetH * scale);
        }

        // Tolerance check: Avoid resizing (and resetting) for minor sub-pixel jitters
        // Especially important when scaled via transforms (FitStage)
        const currentW = this.canvas.width;
        const currentH = this.canvas.height;

        // Allow 2px difference before forcing a resize
        const significantChange = Math.abs(currentW - targetW) > 2 || Math.abs(currentH - targetH) > 2;

        // Only resize if dimensions changed significantly or not yet initialized
        if (!this.initialized || significantChange) {
            this.canvas.width = targetW;
            this.canvas.height = targetH;
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(dpr, dpr);
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.canvas.style.touchAction = 'none';

            // Sync config state
            this.config.pixelDensity = dpr;

            // Refill foil after resize
            if (this.currentImageSource) {
                this.setImage(this.currentImageSource);
            } else {
                this.reset(this.currentFillStyle || '#C0C0C0');
            }
            this.onResize?.();
            this.initialized = true;
        }
    }


    // ...




    public reset(colorOrPattern: string | CanvasPattern | CanvasGradient = '#C0C0C0') {
        this.currentFillStyle = colorOrPattern;
        this.currentImageSource = null;

        const { width, height } = this.canvas;
        // console.log('[ScratchEngine] reset called', { width, height, style: typeof colorOrPattern });

        // Reset transform to fill entire backing store
        this.ctx.resetTransform();
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = colorOrPattern;
        this.ctx.fillRect(0, 0, width, height);

        // Restore coordinate system (DPR scaling)
        const dpr = window.devicePixelRatio || 1;
        this.ctx.scale(dpr, dpr);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.onProgress?.(0);
    }

    public setImage(source: string) {
        if (!source) return this.reset('#C0C0C0');

        this.currentImageSource = source;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = source;
        img.onload = () => {
            const { width: canvasW, height: canvasH } = this.canvas;

            this.ctx.resetTransform(); // Work with physical pixels
            this.ctx.globalCompositeOperation = 'source-over';

            // "Cover" fit logic
            const scale = Math.max(canvasW / img.width, canvasH / img.height);
            const x = (canvasW / 2) - (img.width / 2) * scale;
            const y = (canvasH / 2) - (img.height / 2) * scale;

            this.ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // Restore context for scratching
            const dpr = window.devicePixelRatio || 1;
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            this.onProgress?.(0);
        };
        img.onerror = () => {
            console.warn('ScratchEngine: Failed to load image, falling back to color');
            this.reset('#CCCCCC');
        };
    }

    // --- INTERACTION API ---

    // Optimized Input Handler (Call from React Event Loop)
    // Expects LOCAL coordinates (0..logicalWidth, 0..logicalHeight)
    public startStroke(x: number, y: number) {
        if (!this.config.enabled) return;
        this.isDrawing = true;
        this.lastPos = { x, y };
        this.scratch(x, y);
        this.onScratchStart?.();
    }

    public moveStroke(x: number, y: number) {
        if (!this.isDrawing || !this.config.enabled) return;
        const pos = { x, y };

        // Hit Detection: Sample opacity BEFORE scratching
        // We must check if the foil exists at the target position before valid pixels are cleared.
        // [FIX] Multi-point sampling: We check center + 4 cardinal points (60% radius) to catch edge scratches.
        let isMaskHit = false;
        try {
            const dpr = window.devicePixelRatio || 1;
            const radius = (this.config.brushSize / 2) * dpr;

            // Map logical x,y to physical backing store x,y
            const physCenterX = Math.floor(pos.x * dpr);
            const physCenterY = Math.floor(pos.y * dpr);

            const maxW = this.canvas.width - 1;
            const maxH = this.canvas.height - 1;

            // Check 5 points: Center, Top, Bottom, Left, Right
            const r = radius * 0.6;
            const offsets = [
                { dx: 0, dy: 0 },
                { dx: r, dy: 0 },
                { dx: -r, dy: 0 },
                { dx: 0, dy: r },
                { dx: 0, dy: -r }
            ];

            if (maxW <= 0 || maxH <= 0) {
                isMaskHit = true;
            } else {
                for (const offset of offsets) {
                    const px = Math.floor(physCenterX + offset.dx);
                    const py = Math.floor(physCenterY + offset.dy);

                    // strict bounds check: if outside canvas, it's not a hit
                    if (px < 0 || px > maxW || py < 0 || py > maxH) continue;

                    const pixel = this.ctx.getImageData(px, py, 1, 1).data;
                    if (pixel && pixel[3] > 10) {
                        isMaskHit = true;
                        break;
                    }
                }
            }
        } catch (e) {
            isMaskHit = true;
        }

        let dx = 0;
        let dy = 0;
        let speed = 0;

        // Interpolation Loop
        if (this.lastPos) {
            dx = pos.x - this.lastPos.x;
            dy = pos.y - this.lastPos.y;
            speed = Math.sqrt(dx * dx + dy * dy);

            this.scratchLine(this.lastPos.x, this.lastPos.y, pos.x, pos.y);
        } else {
            this.scratch(pos.x, pos.y);
        }

        this.onScratchMove?.(pos.x, pos.y, dx, dy, speed, isMaskHit);

        this.lastPos = pos;
        this.dirty = true;

        // Periodic Progress Check (Real-time auto-reveal)
        const now = Date.now();
        if (now - this.lastProgressCheck > this.config.throttleProgress) {
            this.calculateProgress();
            this.lastProgressCheck = now;
        }
    }

    public endStroke() {
        if (this.isDrawing) {
            this.isDrawing = false;
            // Emit zero velocity on end to reset tilt
            this.onScratchMove?.(this.lastPos?.x || 0, this.lastPos?.y || 0, 0, 0, 0);

            this.lastPos = null;
            if (this.dirty) {
                this.calculateProgress();
                this.dirty = false;
            }
            this.onScratchEnd?.();
        }
    }

    // --- DRAWING LOGIC ---

    // --- DRAWING LOGIC ---

    public setBrushImage(image: HTMLImageElement | null) {
        this.config.brushImage = image;
    }

    private scratch(x: number, y: number) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';

        if (this.config.brushImage) {
            const size = this.config.brushSize;
            const img = this.config.brushImage;

            // Calculate aspect ratio to prevent distortion
            let w = size;
            let h = size;

            // Prefer natural dimensions for HTMLImageElement
            if (img.naturalWidth && img.naturalHeight) {
                const ratio = img.naturalWidth / img.naturalHeight;
                if (ratio > 1) {
                    // Wider than tall
                    w = size;
                    h = size / ratio;
                } else {
                    // Taller than wide
                    h = size;
                    w = size * ratio;
                }
            }

            this.ctx.drawImage(
                img,
                x - w / 2,
                y - h / 2,
                w,
                h
            );
        } else {
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.config.brushSize / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    private scratchLine(x1: number, y1: number, x2: number, y2: number) {
        // If using a custom image, we must interpolate manually (stamping)
        // because standard stroke() only works for basic shapes/patterns that repeat perfectly,
        // and ctx.lineWidth doesn't apply to images.
        if (this.config.brushImage) {
            const dist = Math.hypot(x2 - x1, y2 - y1);
            const step = Math.max(1, this.config.brushSize * 0.1); // 10% overlap
            const angle = Math.atan2(y2 - y1, x2 - x1);

            for (let i = 0; i < dist; i += step) {
                const x = x1 + Math.cos(angle) * i;
                const y = y1 + Math.sin(angle) * i;
                this.scratch(x, y);
            }
            this.scratch(x2, y2); // Ensure end point is hit
            return;
        }

        // Standard circular brush optimization
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = this.config.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        // Round joints (redundant with lineCap='round' usually, but good for safety)
        // this.ctx.beginPath();
        // this.ctx.arc(x2, y2, this.config.brushSize / 2, 0, Math.PI * 2);
        // this.ctx.fill();
        this.ctx.restore();
    }

    // --- ANALYTICS ---

    private calculateProgress() {
        // Optimized standard pixel scan
        // In Tier 1, we could use a web worker or GPU count, but simple sampling is fast enough for < 1000px
        const { width, height } = this.canvas;
        // Optimized standard pixel scan
        const sampleRate = 10;

        try {
            // Note: getImageData reads UNSCALED logical pixels if we aren't careful, 
            // but the backing store is W*DPR. We need to grab the full store.
            if (width === 0 || height === 0) return;

            // Safety: Prevent OOM on massive canvases (e.g. if resize logic fails and produces huge dims)
            // Limit to ~50MP (approx 7k x 7k), which is generous but safe for most GPUs
            if (width * height > 50_000_000) {
                console.warn(`ScratchEngine: Canvas too large for analytics (${width}x${height}). Skipping.`);
                return;
            }

            const imageData = this.ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            let total = 0;
            let clear = 0;

            for (let i = 0; i < data.length; i += 4 * sampleRate) {
                total++;
                // Check if pixel is mostly transparent (accounting for anti-aliasing)
                if (data[i + 3] < 128) clear++;
            }

            const pct = total > 0 ? clear / total : 0;
            // console.log('[ScratchEngine] Progress:', { pct, clear, total }); // Debugging
            this.onProgress?.(pct);
        } catch (e) {
            console.warn('ScratchEngine: progress check failed (CORS?)', e);
        }
    }

    public destroy() {
        this.observers.forEach(o => o.disconnect());
        this.observers = [];
    }
}

// --- REACT HOOK WRAPPER ---
export const useScratchEngine = (props: {
    brushSize?: number;
    enabled?: boolean;
    image?: string; // New prop for custom texture (Foil)
    brushImageUrl?: string; // [NEW] Custom brush tip image
    onScratchProgress?: (p: number) => void;
    onScratchStart?: () => void;
    onScratchEnd?: () => void;
    onScratchMove?: (data: { x: number, y: number, dx: number, dy: number, speed: number, isMaskHit?: boolean }) => void;
    onResize?: () => void;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<ScratchEngineCore | null>(null);
    const [progress, setProgress] = useState(0);
    const [isScratching, setIsScratching] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Sync Props to Engine (Non-destructive updates)
    useEffect(() => {
        if (engineRef.current) {
            engineRef.current.updateConfig({
                brushSize: props.brushSize,
                enabled: props.enabled
            });
        }
    }, [props.brushSize, props.enabled]);

    // Handle Image Updates
    useEffect(() => {
        if (engineRef.current && props.image) {
            engineRef.current.setImage(props.image);
        }
    }, [props.image]);

    // Handle Brush Image Updates [NEW]
    useEffect(() => {
        if (!engineRef.current) return;

        if (props.brushImageUrl) {
            const img = new Image();
            img.src = props.brushImageUrl;
            img.onload = () => {
                engineRef.current?.setBrushImage(img);
            };
        } else {
            engineRef.current?.setBrushImage(null);
        }
    }, [props.brushImageUrl, isReady]);

    // Sync Callbacks to Engine (Separate effect to avoid re-init)
    useEffect(() => {
        if (!engineRef.current) return;

        const engine = engineRef.current;

        // Update all callbacks directly on the instance
        engine.onProgress = (p) => {
            setProgress(p);
            props.onScratchProgress?.(p);
        };

        engine.onScratchStart = () => {
            setIsScratching(true);
            props.onScratchStart?.();
        };

        engine.onScratchEnd = () => {
            setIsScratching(false);
            props.onScratchEnd?.();
        };

        engine.onResize = () => {
            props.onResize?.();
        };

        engine.onScratchMove = (x, y, dx, dy, speed, isMaskHit) => {
            props.onScratchMove?.({ x, y, dx, dy, speed, isMaskHit });
        };

    }, [
        props.onScratchProgress,
        props.onScratchStart,
        props.onScratchEnd,
        props.onResize,
        props.onScratchMove
    ]);

    // Mount Engine
    const initCanvas = useCallback(() => {
        if (canvasRef.current && containerRef.current && !engineRef.current) {
            const engine = new ScratchEngineCore(canvasRef.current, {
                brushSize: props.brushSize,
                enabled: props.enabled
            });

            // Initial Callback Wiring (Will be kept fresh by the effect above)
            engine.onProgress = (p) => {
                setProgress(p);
                props.onScratchProgress?.(p);
            };

            engine.onScratchStart = () => {
                setIsScratching(true);
                props.onScratchStart?.();
            };

            engine.onScratchEnd = () => {
                setIsScratching(false);
                props.onScratchEnd?.();
            };

            engine.onResize = () => {
                props.onResize?.();
            };

            engine.onScratchMove = (x, y, dx, dy, speed, isMaskHit) => {
                props.onScratchMove?.({ x, y, dx, dy, speed, isMaskHit });
            };

            engineRef.current = engine;
            setIsReady(true); // Trigger effect to bind inputs
        } else if (engineRef.current) {
            // Re-resize if already exists
            engineRef.current.resize();
        }
    }, [props.brushSize, props.enabled]); // Only re-init if core config changes significantly

    // Cleanup
    useEffect(() => {
        return () => {
            engineRef.current?.destroy();
            engineRef.current = null;
        };
    }, []);

    // Exposed API
    const fillCanvas = useCallback((style: string | CanvasPattern | CanvasGradient = '#C0C0C0') => {
        engineRef.current?.reset(style);
    }, []);

    // Input Bridge (Pointer Events + Capture)
    const eventToCanvasXY = (e: React.PointerEvent | PointerEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();

        // 1. Calculate Normalized Position (0.0 to 1.0) based on VISUAL rect
        // This abstracts away all CSS transforms, zoom levels, and layout sizes.
        if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };

        const u = (e.clientX - rect.left) / rect.width;
        const v = (e.clientY - rect.top) / rect.height;

        // 2. Map to Logical Canvas Coordinates
        // The context is scaled by DPR, so the logical range is [0, width/dpr].
        const dpr = window.devicePixelRatio || 1;
        const logicalW = canvas.width / dpr;
        const logicalH = canvas.height / dpr;

        return {
            x: u * logicalW,
            y: v * logicalH
        };
    };

    const bindInput = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let scratching = false;

        const onDown = (e: PointerEvent) => {
            if (!engineRef.current) return;

            // JIT Resize Check: Handles cases where ResizeObserver missed a transform change (e.g. FitStage scale)
            engineRef.current.resize();

            scratching = true;
            canvas.setPointerCapture(e.pointerId);
            const { x, y } = eventToCanvasXY(e, canvas);
            // console.log('[ScratchEngine] Down', { x, y });
            engineRef.current.startStroke(x, y);
        };

        const onMove = (e: PointerEvent) => {
            if (!scratching || !engineRef.current) return;
            // Native event doesn't need preventDefault usually with touch-action: none, 
            // but strict pointer capture handles it.
            const { x, y } = eventToCanvasXY(e, canvas);
            // console.log('[ScratchEngine] Move', { x, y });
            engineRef.current.moveStroke(x, y);
        };

        const onUp = (e: PointerEvent) => {
            scratching = false;
            if (engineRef.current) engineRef.current.endStroke();
            try { canvas.releasePointerCapture(e.pointerId); } catch (e) { }
        };

        canvas.addEventListener("pointerdown", onDown, { passive: true });
        canvas.addEventListener("pointermove", onMove, { passive: true });
        canvas.addEventListener("pointerup", onUp, { passive: true });
        canvas.addEventListener("pointercancel", onUp, { passive: true });

        // Window Resize Fallback (Observer misses some transform-only layout shifts)
        const onWindowResize = () => {
            if (engineRef.current) engineRef.current.resize();
        };
        window.addEventListener('resize', onWindowResize);

        // Mobile scroll prevention
        canvas.style.touchAction = "none";

        return () => {
            canvas.removeEventListener("pointerdown", onDown);
            canvas.removeEventListener("pointermove", onMove);
            canvas.removeEventListener("pointerup", onUp);
            canvas.removeEventListener("pointercancel", onUp);
            window.removeEventListener('resize', onWindowResize);
        };
    }, []);

    // Auto-Init when refs are ready
    useEffect(() => {
        if (canvasRef.current && containerRef.current && !engineRef.current) {
            initCanvas();
        }
    }, [initCanvas]);

    // Init Interactions - wait for engine to be ready
    useEffect(() => {
        if (!isReady || !engineRef.current || !canvasRef.current || !containerRef.current) return;

        const cleanupInput = bindInput();

        return () => {
            if (cleanupInput) cleanupInput();
        };
    }, [bindInput, isReady]);

    return {
        canvasRef,
        containerRef,
        initCanvas,
        percent: progress, // Legacy name for compatibility
        progress,
        isScratching,
        fillCanvas,
        isReady, // Exported so consumers know when engine is live
        setImage: useCallback((src: string) => engineRef.current?.setImage(src), [])
    };
};
