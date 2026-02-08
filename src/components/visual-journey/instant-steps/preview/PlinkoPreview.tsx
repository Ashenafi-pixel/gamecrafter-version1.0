import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

// Define the Props Interface
interface PlinkoVisuals {
    ballColor?: string;
    ballTexture?: string;
    pegColor?: string;
    pegGlow?: boolean;
    bucketColor?: string;
    bucketTheme?: string;
    bucketShape?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundTexture?: string;
    threeDBall?: boolean; // Legacy/Toggle
    showHole?: boolean;
    particleTrail?: boolean;
}

interface PlinkoPreviewProps {
    rows: number;
    risk: string;
    gravity: number;
    ballSize: number;
    holeSize: number;
    visuals: PlinkoVisuals;
    autoPlay?: boolean; // If true, drops balls automatically
    interactive?: boolean; // If true, clicking board might drop ball?
    onWin?: (multiplier: number) => void;
    balance?: number;
    onBet?: (amount: number) => void;
}

const PlinkoPreview: React.FC<PlinkoPreviewProps> = ({
    rows,
    risk,
    gravity,
    ballSize,
    holeSize,
    visuals,
    autoPlay = false,
    interactive = false,
    onWin,
    balance,
    onBet
}) => {
    // State
    const [renderBalls, setRenderBalls] = useState<{ id: number, x: number, y: number, vx: number, vy: number, history: { x: number, y: number }[] }[]>([]);
    const [activeBucket, setActiveBucket] = useState<number | null>(null);

    // Refs
    const engineRef = useRef<Matter.Engine | null>(null);
    const runnerRef = useRef<number | null>(null);
    const sceneRef = useRef<HTMLDivElement>(null);
    // Interval ref for autoplay
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    // --- PHYSICS INIT ---
    useEffect(() => {
        // Initialize Engine
        const engine = Matter.Engine.create();
        engine.gravity.y = gravity;

        engine.positionIterations = 10;
        engine.velocityIterations = 10;

        engineRef.current = engine;

        // World Setup
        const world = engine.world;
        const width = Math.max(600, ((rows + 2) * 40) + 40); // Dynamic Width
        const startY = 100;
        const pegSpacing = 40;
        const pegSize = 4;

        // Create Pegs
        const pegs: Matter.Body[] = [];
        for (let row = 0; row < rows; row++) {
            const numPegs = row + 3;
            // Center the row
            const rowWidth = (numPegs - 1) * pegSpacing;
            const rowStartX = (width / 2) - (rowWidth / 2);

            for (let cols = 0; cols < numPegs; cols++) {
                const x = rowStartX + (cols * pegSpacing);
                const y = startY + (row * pegSpacing);

                const peg = Matter.Bodies.circle(x, y, pegSize, {
                    isStatic: true,
                    label: 'peg',
                    restitution: 0.5,
                    render: { fillStyle: '#fff' }
                });
                pegs.push(peg);
            }
        }
        Matter.Composite.add(world, pegs);

        // Create Buckets (Sensors)
        const lastRowNumPegs = rows + 2;
        const lastRowWidth = (lastRowNumPegs - 1) * pegSpacing;
        const lastRowStartX = (width / 2) - (lastRowWidth / 2);
        const bucketY = startY + ((rows - 1) * pegSpacing) + (pegSpacing / 1.5);

        for (let i = 0; i < lastRowNumPegs - 1; i++) {
            const gapCenterX = lastRowStartX + (i * pegSpacing) + (pegSpacing / 2);
            const sensor = Matter.Bodies.rectangle(gapCenterX, bucketY, 30, 20, {
                isStatic: true,
                isSensor: true,
                label: `bucket-${i}`,
                render: { fillStyle: 'transparent' }
            });
            Matter.Composite.add(world, sensor);
        }

        // Collision Events
        Matter.Events.on(engine, 'collisionStart', (event: any) => {
            event.pairs.forEach((pair: any) => {
                const { bodyA, bodyB } = pair;
                const bucket = bodyA.label.startsWith('bucket') ? bodyA : bodyB.label.startsWith('bucket') ? bodyB : null;
                const ball = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;

                if (bucket && ball) {
                    const bucketIndex = parseInt(bucket.label.split('-')[1]);

                    // Trigger Win Callback
                    const numBuckets = rows + 1;
                    const center = (numBuckets - 1) / 2;
                    const dist = Math.abs(bucketIndex - center);
                    const riskFactor = risk === 'high' ? 0.4 : risk === 'low' ? 0.1 : 0.2;
                    const mult = parseFloat((0.5 + (dist * dist * riskFactor)).toFixed(1));

                    if (onWin) onWin(mult);

                    setActiveBucket(bucketIndex);
                    setTimeout(() => setActiveBucket(null), 300);
                    Matter.Composite.remove(world, ball);
                }
            });
        });

        // Loop
        const tick = () => {
            Matter.Engine.update(engine, 1000 / 60);
            const balls = Matter.Composite.allBodies(world).filter(b => b.label === 'ball');

            setRenderBalls(prev => {
                const newBalls = balls.map(b => {
                    const existing = prev.find(p => p.id === b.id);
                    const history = existing ? [...existing.history, { x: b.position.x, y: b.position.y }] : [{ x: b.position.x, y: b.position.y }];
                    if (history.length > 45) history.shift(); // Keep last 45 frames

                    return {
                        id: b.id,
                        x: b.position.x,
                        y: b.position.y,
                        vx: b.velocity.x,
                        vy: b.velocity.y,
                        history
                    };
                });
                return newBalls;
            });
            runnerRef.current = requestAnimationFrame(tick);
        };
        tick();

        // Cleanup
        return () => {
            if (runnerRef.current) cancelAnimationFrame(runnerRef.current);
            Matter.Engine.clear(engine);
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [rows, gravity, risk]); // Re-init mechanics change

    // --- BALL DROP ---
    const dropBall = () => {
        if (!engineRef.current) return;

        const width = Math.max(600, ((rows + 2) * 40) + 40);
        const startX = width / 2 + (Math.random() * 2 - 1);

        const ball = Matter.Bodies.circle(startX, 50, ballSize, {
            restitution: 0.6,
            friction: 0.001,
            frictionAir: 0.02,
            density: 0.04,
            label: 'ball'
        });
        Matter.Composite.add(engineRef.current.world, ball);
    };

    // AutoPlay Effect
    useEffect(() => {
        if (autoPlay) {
            autoPlayRef.current = setInterval(dropBall, 1500); // Drop every 1.5s
        } else {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        }
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [autoPlay, rows, ballSize]); // Dependencies for dropBall context

    // --- HELPER RENDERS ---
    const getMultipliers = () => {
        const numBuckets = rows + 1;
        const center = (numBuckets - 1) / 2;
        const riskFactor = risk === 'high' ? 0.4 : risk === 'low' ? 0.1 : 0.2;
        return Array.from({ length: numBuckets }).map((_, i) => {
            const dist = Math.abs(i - center);
            const mult = 0.5 + (dist * dist * riskFactor);
            return mult.toFixed(1);
        });
    };

    // --- SCALING ---
    const pegSpacing = 40;
    const contentHeight = 100 + (rows * pegSpacing) + 60;
    const maxPegs = rows + 2;
    const contentWidth = Math.max(600, (maxPegs * pegSpacing) + 40);

    // Increased available space since we expand container height/width
    // Adjusted available height to clear bottom UI
    const availableHeight = 520;
    const availableWidth = 800;

    // Allow scaling up to 1.5x for small boards (low row count) to fill screen
    const scale = Math.min(1.5, availableWidth / contentWidth, availableHeight / contentHeight);

    // Styling
    const bgStyle: React.CSSProperties = {};
    if (visuals.backgroundTexture) {
        bgStyle.backgroundImage = `url(${visuals.backgroundTexture})`;
        bgStyle.backgroundSize = 'cover';
        bgStyle.backgroundPosition = 'center';
    } else if (visuals.backgroundColor) {
        bgStyle.background = visuals.backgroundColor;
    } else if (visuals.backgroundImage) {
        // Fallback or specific bg image
    }

    const ballStyle = (ball: { x: number, y: number }) => {
        const style: React.CSSProperties = {
            width: ballSize * 2,
            height: ballSize * 2,
            left: ball.x - ballSize,
            top: ball.y - ballSize,
            transform: 'translate3d(0,0,0)',
        };

        if (visuals.ballTexture) {
            style.backgroundImage = `url(${visuals.ballTexture})`;
            style.backgroundSize = 'cover';
        } else if (visuals.threeDBall !== false) { // Default true
            const color = visuals.ballColor || '#ff0055';
            style.background = `radial-gradient(circle at 35% 35%, #ffffff, ${color})`;
            if (visuals.ballColor) {
                style.backgroundColor = visuals.ballColor;
            }
        } else {
            style.backgroundColor = visuals.ballColor || '#ff0055';
        }
        return style;
    };

    // --- HUD STATE ---
    const [betAmount, setBetAmount] = useState(1.00);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // --- HANDLERS ---
    const handlePlay = () => {
        if (onBet) {
            // If parent handles betting logic
            onBet(betAmount);
            dropBall();
        } else if (interactive) {
            // Standalone mode
            dropBall();
        }
    };

    return (
        <div
            className="w-full h-full bg-slate-900 rounded-2xl overflow-hidden relative flex flex-col items-center pt-8 shadow-2xl"
            ref={sceneRef}
            style={bgStyle}
        >
            {/* --- GAME HUD OVERLAY --- */}
            <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4">
                {/* Top Bar */}
                <div className="flex justify-between items-start pointer-events-auto">
                    <button className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors border border-white/10">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>

                    {balance !== undefined && (
                        <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white font-mono font-bold shadow-lg">
                            ${balance.toFixed(2)}
                        </div>
                    )}

                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors border border-white/10"
                    >
                        {soundEnabled ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                        )}
                    </button>
                </div>

                {/* Bottom Bar (Controls) */}
                <div className="pointer-events-auto mt-auto">
                    <div className="flex gap-3 items-end justify-center w-full max-w-md mx-auto">
                        {/* Bet Input */}
                        <div className="flex-1 bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-xl">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">Bet Amount</label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setBetAmount(Math.max(0.1, betAmount / 2))}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                                >
                                    ½
                                </button>
                                <div className="flex-1 relative">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white/50 text-sm font-medium">$</span>
                                    <input
                                        type="number"
                                        value={betAmount}
                                        onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value)))}
                                        className="w-full bg-transparent text-white font-bold text-center focus:outline-none font-mono"
                                    />
                                </div>
                                <button
                                    onClick={() => setBetAmount(betAmount * 2)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                                >
                                    2x
                                </button>
                            </div>
                        </div>

                        {/* Play Button */}
                        <button
                            onClick={handlePlay}
                            className="bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white shadow-lg shadow-pink-500/30 rounded-2xl p-4 min-w-[100px] flex flex-col items-center justify-center border-t border-white/20 active:scale-95 transition-all"
                        >
                            <span className="text-sm font-black uppercase tracking-widest">Drop</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Background Grid (Semi-transparent override) */}
            {!visuals.backgroundTexture && (
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            )}

            {/* Scene Container */}
            <div
                className="relative h-full mx-auto transition-transform duration-500 origin-top mt-12" // Added mt-12 to push game down slightly for top bar
                style={{
                    transform: `scale(${scale * 0.95})`, // Scale adjusted
                    width: contentWidth
                }}
                onClick={interactive ? dropBall : undefined}
            >
                {/* Hole */}
                {(visuals.showHole ?? true) && (
                    <div
                        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-slate-950 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9),0_0_0_2px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.5)] z-0 flex items-center justify-center transition-all duration-300"
                        style={{
                            width: holeSize * 2,
                            height: holeSize * 2,
                            top: 50 - holeSize
                        }}
                    >
                        <div className="absolute inset-0 rounded-full shadow-[inset_0_-2px_4px_rgba(255,255,255,0.1)]"></div>
                    </div>
                )}

                {/* Pegs */}
                {Array.from({ length: rows }).map((_, row) => {
                    const numPegs = row + 3;
                    const rowWidth = (numPegs - 1) * 40;
                    const startX = (contentWidth / 2) - (rowWidth / 2);
                    const y = 100 + (row * 40);

                    return Array.from({ length: numPegs }).map((__, col) => (
                        <div
                            key={`peg-${row}-${col}`}
                            className="absolute w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                            style={{
                                left: startX + (col * 40) - 4,
                                top: y - 4,
                                backgroundColor: visuals.pegColor || '#ffffff',
                                boxShadow: visuals.pegGlow ? `0 0 10px ${visuals.pegColor || '#ffffff'}` : 'none'
                            }}
                        />
                    ));
                })}

                {/* SVG Trails Layer - Comet Effect */}
                {visuals?.particleTrail && (
                    <svg className="absolute inset-0 pointer-events-none" style={{ width: contentWidth, height: '100%', overflow: 'visible', zIndex: 10 }}>
                        <defs>
                            <filter id="trail-glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        {renderBalls.map(ball => {
                            if (!ball.history || ball.history.length < 2) return null;

                            // Render segments for tapering effect
                            // History is ordered [oldest, ..., newest]
                            return (
                                <g key={`trail-${ball.id}`} filter="url(#trail-glow)">
                                    {ball.history.map((point, i) => {
                                        if (i === 0) return null;
                                        const prev = ball.history[i - 1];

                                        // Calculate progress (0 = tail end, 1 = ball head)
                                        const progress = i / (ball.history.length - 1);

                                        // Tapering width: starts thin, ends at full ball diameter
                                        const width = (ballSize * 2.5) * Math.pow(progress, 1.5); // Slight curve to taper

                                        // Fading opacity: starts transparent, ends opaque
                                        const opacity = 0.8 * Math.pow(progress, 2);

                                        return (
                                            <line
                                                key={i}
                                                x1={prev.x}
                                                y1={prev.y}
                                                x2={point.x}
                                                y2={point.y}
                                                stroke={visuals.ballColor || '#ff0055'}
                                                strokeWidth={width}
                                                strokeLinecap="round"
                                                opacity={opacity}
                                            />
                                        );
                                    })}
                                </g>
                            );
                        })}
                    </svg>
                )}

                {/* Balls */}
                {renderBalls.map(ball => (
                    <div
                        key={ball.id}
                        className="absolute rounded-full z-20 pointer-events-none animate-ball-spawn"
                        style={{
                            ...ballStyle(ball),
                            boxShadow: `0 0 15px ${visuals.ballColor || '#ff0055'}`, // Add glow to main ball
                        }}
                    />
                ))}

                {/* Buckets */}
                <div className="absolute w-full flex justify-center gap-[4px]" style={{ top: 100 + ((rows - 1) * 40) + 40 / 1.5 - 20 }}>
                    {getMultipliers().map((mult, i) => {
                        const mVal = parseFloat(mult);

                        // Theme Colors
                        let bg = visuals.bucketColor || (mVal >= 10 ? '#eab308' : mVal >= 2 ? '#f97316' : '#db2777'); // Classic Default

                        if (visuals.bucketTheme) {
                            switch (visuals.bucketTheme) {
                                case 'neon':
                                    bg = mVal >= 10 ? '#ff0080' : mVal >= 2 ? '#00ffff' : '#bd00ff';
                                    break;
                                case 'ocean':
                                    bg = mVal >= 10 ? '#4deeea' : mVal >= 2 ? '#74ee15' : '#f000ff'; // Wait, ocean? Let's fix ocean.
                                    bg = mVal >= 10 ? '#00d2ff' : mVal >= 2 ? '#3a7bd5' : '#000046';
                                    break;
                                case 'gold':
                                    bg = mVal >= 10 ? '#FFD700' : mVal >= 2 ? '#C0C0C0' : '#CD7F32';
                                    break;
                                case 'pastel':
                                    bg = mVal >= 10 ? '#ff9a9e' : mVal >= 2 ? '#fad0c4' : '#a18cd1';
                                    break;
                                case 'dark':
                                    bg = mVal >= 10 ? '#dc2626' : mVal >= 2 ? '#475569' : '#0f172a';
                                    break;
                            }
                        }

                        // Text Contrast Logic
                        const useDarkText = ['gold', 'pastel'].includes(visuals.bucketTheme || '') ||
                            (visuals.bucketTheme === 'neon' && mVal < 10);
                        const textColor = useDarkText ? '#000000' : '#ffffff';

                        // Shape Styles
                        let borderRadius = '0px 0px 8px 8px'; // Standard U-shape
                        let transform = activeBucket === i ? 'scale(1.25)' : 'scale(1)';

                        if (visuals.bucketShape === 'square') {
                            borderRadius = '4px';
                        } else if (visuals.bucketShape === 'circle') {
                            borderRadius = '20px';
                            transform = activeBucket === i ? 'scale(1.1) translateY(2px)' : 'scale(0.9) translateY(2px)';
                        }

                        return (
                            <div key={i} className={`
                            flex items-center justify-center text-[10px] font-bold shadow-lg transition-all duration-200
                            ${activeBucket === i ? 'brightness-150 z-10' : ''}
                        `}
                                style={{
                                    width: '38px',
                                    height: '40px',
                                    borderRadius: borderRadius,
                                    background: bg,
                                    color: textColor,
                                    transform: transform,
                                    boxShadow: activeBucket === i ? '0 0 20px rgba(255,255,255,0.8)' : 'inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 6px rgba(0,0,0,0.3)'
                                }}>
                                {mult}x
                            </div>
                        )
                    })}
                </div>

            </div>
            {/* Animations */}
            <style>{`
                @keyframes ball-spawn {
                    0% { transform: scale(0.1); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-ball-spawn {
                    animation: ball-spawn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    );
};

export default PlinkoPreview;
