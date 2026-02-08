import React, { useEffect, useRef } from 'react';
import { CrashConfig } from '../../../types';

interface CrashSimulationCanvasProps {
    config: CrashConfig;
    isPlaying: boolean;
    onCrash?: () => void;
    width?: number;
    height?: number;
}

const CrashSimulationCanvas: React.FC<CrashSimulationCanvasProps> = ({
    config,
    isPlaying,
    onCrash,
    width = 800,
    height = 500
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const startTimeRef = useRef<number>(0);

    // Simulation State (Refs for performance to avoid React renders on every frame)
    const multiplierRef = useRef(1.00);
    const statusRef = useRef<'IDLE' | 'RUNNING' | 'CRASHED'>('IDLE');
    const crashPointRef = useRef(2.00);

    // Physics State
    const positionRef = useRef({ x: 0, y: 0 });
    const particlesRef = useRef<Array<{
        x: number, y: number, vx: number, vy: number,
        life: number, color: string, size: number, type: 'trail' | 'explosion'
    }>>([]);

    // Reset simulation
    const reset = () => {
        multiplierRef.current = 1.00;
        statusRef.current = 'IDLE';
        particlesRef.current = [];
        startTimeRef.current = 0;

        // Initial position
        const startX = config.direction === 'right' ? 50 : (config.direction === 'diagonal' ? 50 : width / 2);
        const startY = height - 50;

        positionRef.current = { x: startX, y: startY };
    };

    // Main Loop
    const animate = (time: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Clear Canvas
        ctx.clearRect(0, 0, width, height);

        // Draw Grid
        if (config.visuals.showGrid) {
            drawGrid(ctx, width, height, config.visuals.gridColor || '#333');
        }

        if (statusRef.current === 'RUNNING') {
            const now = Date.now();
            const elapsed = (now - startTimeRef.current) / 1000;

            // 1. Calculate Multiplier
            let currentMult = 1.0;
            const rate = config.growthRate || 2.0;

            switch (config.algorithm) {
                case 'linear':
                    currentMult = 1 + elapsed * (rate * 0.5);
                    break;
                case 'exponential':
                    currentMult = Math.pow(rate, elapsed);
                    break;
                case 'logistic':
                    currentMult = 1 + (rate * 3) / (1 + Math.exp(-2 * (elapsed - 2)));
                    break;
            }

            multiplierRef.current = currentMult;

            // Check Crash
            if (currentMult >= crashPointRef.current) {
                statusRef.current = 'CRASHED';
                createExplosion(positionRef.current.x, positionRef.current.y);
                if (onCrash) onCrash();
            } else {
                // 2. Update Physics
                updatePhysics(elapsed, currentMult);

                // 3. Spawn Trail
                if (config.visuals.particles?.trail?.enabled) {
                    spawnTrail(positionRef.current.x, positionRef.current.y);
                }
            }
        }

        // 4. Update & Draw Particles
        updateDrawParticles(ctx);

        // 5. Draw Rocket/Object
        if (statusRef.current !== 'CRASHED') {
            drawObject(ctx, positionRef.current.x, positionRef.current.y);
        } else {
            drawCrashText(ctx, width, height);
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    const updatePhysics = (elapsed: number, multiplier: number) => {
        const t = elapsed;
        let dx = 0;
        let dy = 0;

        const isUp = config.direction === 'up';
        const isRight = config.direction === 'right';

        switch (config.physics) {
            case 'gravity':
                const v0 = 150;
                if (isUp) {
                    dx = Math.sin(t * 2) * 20;
                    dy = -1 * (v0 * Math.pow(t, 0.7));
                } else if (isRight) {
                    dx = v0 * t * 1.5;
                    dy = Math.sin(t * 3) * 30;
                } else { // Diagonal
                    dx = v0 * t;
                    dy = -1 * (v0 * t);
                }
                break;

            case 'bounce':
                const amp = 100;
                const freq = 3;
                const decay = 0.5;
                const bounce = Math.abs(Math.sin(t * freq)) * Math.exp(-t * decay) * amp;

                if (isUp) {
                    dx = 0;
                    dy = -1 * (t * 80) - bounce;
                } else if (isRight) {
                    dx = t * 150;
                    dy = -bounce;
                } else {
                    dx = t * 100;
                    dy = -1 * (t * 100) - bounce;
                }
                break;

            case 'standard':
            default:
                // Log scale for screen fit
                const scale = Math.log(multiplier) * 120;
                if (isUp) {
                    dx = 0;
                    dy = -scale * 2.5;
                } else if (isRight) {
                    dx = scale * 2.5;
                    dy = 0;
                } else {
                    dx = scale;
                    dy = -scale;
                }
                break;
        }

        const startX = config.direction === 'right' ? 50 : (config.direction === 'diagonal' ? 50 : width / 2);
        const startY = height - 50;

        positionRef.current = {
            x: startX + dx,
            y: startY + dy
        };
    };

    const spawnTrail = (x: number, y: number) => {
        const color = config.visuals.particles?.trail?.color || '#fbbf24';
        const size = config.visuals.particles?.trail?.size || 4;

        particlesRef.current.push({
            x: x + (Math.random() - 0.5) * 5,
            y: y + (Math.random() - 0.5) * 5,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1 + 1, // Slight gravity
            life: 1.0,
            color,
            size,
            type: 'trail'
        });
    };

    const createExplosion = (x: number, y: number) => {
        const count = config.visuals.particles?.explosion?.count || 50;
        const color = config.visuals.particles?.explosion?.color || '#ef4444';

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            particlesRef.current.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 2.0,
                color,
                size: Math.random() * 6 + 2,
                type: 'explosion'
            });
        }
    };

    const updateDrawParticles = (ctx: CanvasRenderingContext2D) => {
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];

            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;

            if (p.type === 'explosion') p.vy += 0.2; // Gravity for explosion

            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); // Shrink with life
            ctx.fill();

            if (p.life <= 0) {
                particlesRef.current.splice(i, 1);
            }
        }
        ctx.globalAlpha = 1.0;
    };

    const drawObject = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.fillStyle = config.visuals.lineColor || '#6366f1';
        ctx.shadowColor = config.visuals.lineColor || '#6366f1';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Multiplier
        ctx.fillStyle = config.visuals.textColor || '#fff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${multiplierRef.current.toFixed(2)}x`, x, y - 25);
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.2;

        const step = 50;

        for (let x = 0; x <= w; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        for (let y = 0; y <= h; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    };

    const drawCrashText = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.save();
        ctx.translate(w / 2, h / 2);

        // Shake effect if crash
        if (config.camera?.shakeEnabled) {
            const shakeStrength = config.camera?.shakeStrength || 5;
            ctx.translate((Math.random() - 0.5) * shakeStrength, (Math.random() - 0.5) * shakeStrength);
        }

        ctx.fillStyle = '#ef4444';
        ctx.font = '900 64px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        ctx.fillText("CRASHED", 0, 0);

        ctx.fillStyle = '#fff';
        ctx.font = '700 32px monospace';
        ctx.fillText(`@ ${multiplierRef.current.toFixed(2)}x`, 0, 60);
        ctx.restore();
    };

    // Effect to handle Play/Stop
    useEffect(() => {
        if (isPlaying) {
            reset();
            statusRef.current = 'RUNNING';
            startTimeRef.current = Date.now();

            // Determine crash point
            const houseEdge = config.houseEdge || 4;
            const simulatedCrash = Math.max(1.00, (100 / (Math.floor(Math.random() * 100) + 1)) * (1 - houseEdge / 100));
            crashPointRef.current = simulatedCrash > 1.1 ? simulatedCrash : 1.2;
        } else {
            reset();
            // Just reset, let the loop draw the idle state
        }

        // Ensure loop is running
        if (!requestRef.current) {
            requestRef.current = requestAnimationFrame(animate);
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            requestRef.current = 0;
        };
    }, [isPlaying, config]); // Re-start if config changes to show new physics immediately? 
    // Ideally we want to just update refs if config changes, but resetting on config change is safer for preview.

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full object-contain"
        />
    );
};

export default CrashSimulationCanvas;
