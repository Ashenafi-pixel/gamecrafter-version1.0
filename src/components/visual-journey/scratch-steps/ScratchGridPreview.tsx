import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useGameStore } from '../../../store';
import { Volume2, VolumeX } from 'lucide-react';
import { useScratchEngine } from '../../../hooks/useScratchEngine';
import { useScratchSession } from '../../../hooks/useScratchSession';
import FoilCanvas from './FoilCanvas';
import { ASSET_MAP } from '../../../utils/scratchAssets';
import { GameControls } from './GameControls';

interface ScratchGridPreviewProps {
    className?: string;
    mode?: 'layout' | 'mechanics' | 'assets' | 'full';
    isResponsive?: boolean;
}

const ScratchGridPreview: React.FC<ScratchGridPreviewProps> = ({
    className = '',
    mode = 'layout',
    isResponsive = false
}) => {
    const { config } = useGameStore();

    // --- Constants ---
    const CARD_WIDTH = 320;
    const CARD_HEIGHT = 460;
    // Half-dimensions for centering calculations
    const HALF_WIDTH = CARD_WIDTH / 2;

    // --- Refs ---
    const particlesRef = useRef<Array<{
        x: number, y: number, vx: number, vy: number,
        life: number, color: string, type: 'spark' | 'confetti',
        size: number, rotation: number, vRotation: number
    }>>([]);
    const particleCanvasRef = useRef<HTMLCanvasElement>(null!);
    // Local ref to break circular dependency with useScratchEngine
    const localContainerRef = useRef<HTMLDivElement | null>(null!);

    // --- Audio System ---
    const [isMuted, setIsMuted] = useState(false);
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

    // Helper to manage audio instances
    const getAudio = useCallback((id: string) => {
        const url = (config.scratch?.audio as any)?.[id];
        if (!url) return null;

        if (!audioRefs.current[id]) {
            audioRefs.current[id] = new Audio(url);
        } else if (audioRefs.current[id].src !== url) {
            audioRefs.current[id].src = url;
        }

        const vol = config.scratch?.audioVolumes?.[id] ?? 0.5;
        audioRefs.current[id].volume = isMuted ? 0 : vol;
        return audioRefs.current[id];
    }, [config.scratch?.audio, config.scratch?.audioVolumes, isMuted]);

    // BGM Management
    useEffect(() => {
        const bgm = getAudio('bgm');
        if (bgm) {
            bgm.loop = true;
            if (!isMuted && mode !== 'layout') { // Don't play in layout mode if annoying? User asked for "when we dont want to hear it"
                const playPromise = bgm.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        // Auto-play policy blocked
                    });
                }
            } else {
                bgm.pause();
            }
        }
        return () => {
            if (bgm) bgm.pause();
        }
    }, [getAudio, isMuted, mode]);

    // --- Configuration Extraction ---
    const rows = config.scratch?.layout?.rows || 3;
    const cols = config.scratch?.layout?.columns || 3;
    const brushSize = config.scratch?.brush?.size || 40;

    // Layers
    const overlayImage = config.scratch?.layers?.overlay?.image || config.scratch?.cardFrame?.frameUrl || config.scratch?.overlay?.image;
    const backgroundImage = config.scratch?.layers?.scene?.value || config.scratch?.background?.value;
    const foilTexture = config.scratch?.layers?.foil?.texture || 'silver';

    // Engine
    const engineEnabled = true;

    // --- Session Logic (Hook) ---
    const {
        balance,
        bet,
        setBet,
        win,
        gameState,
        setGameState,
        isAutoPlaying,
        setIsAutoPlaying,
        currentOutcome,
        buyTicket,
        generateRound,
        resolveRound
    } = useScratchSession();

    // Win Sound Effect
    useEffect(() => {
        if (gameState === 'won') {
            const winSound = getAudio('win');
            if (winSound) {
                winSound.loop = false;
                winSound.currentTime = 0;
                winSound.play().catch(() => { });
            }
        }
    }, [gameState, getAudio]);


    // Cursor State
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [showCursor, setShowCursor] = useState(false);

    // --- Ref for resolving circular dependency with onResize ---
    const foilLogicRef = React.useRef({ reapply: () => { } });

    // --- Responsive Scaling Logic ---
    const wrapperRef = React.useRef<HTMLDivElement>(null!);
    const [fitScale, setFitScale] = useState(1);

    // [FINAL] Content-Aware Scaling (Card-Centric)
    // We calculate the maximum distance from the card center to ensure
    // all elements (mascots, logos) are visible, while keeping the card
    // fixed in the center of the viewport.
    const visualBounds = useMemo(() => {
        const cardCenterX = CARD_WIDTH / 2;
        const cardCenterY = CARD_HEIGHT / 2;

        let maxDistX = CARD_WIDTH / 2;
        let maxDistY = CARD_HEIGHT / 2;

        // 1. Primary Mascot extent
        const mascotConfig = (config.scratch?.mascot || {}) as any;
        const mascotUrl = mascotConfig.image || (config.theme?.generated as any)?.mascot;

        if (mascotUrl) {
            const mX = cardCenterX + (mascotConfig.customPosition?.x || 0);
            const mY = cardCenterY + (mascotConfig.customPosition?.y || 0);
            const mScale = (mascotConfig.scale || 100) / 100;
            const mFullH = CARD_HEIGHT * mScale;
            const mFullW = mFullH * 0.8;

            maxDistX = Math.max(maxDistX, Math.abs(mX - cardCenterX) + mFullW / 2);
            maxDistY = Math.max(maxDistY, Math.abs(mY - cardCenterY) + mFullH / 2);
        }

        // 2. Legacy/Overlay Mascots (Stickers)
        const overlayMascots = config.scratch?.layers?.overlay?.mascots || [];
        overlayMascots.forEach(mascot => {
            const mScale = mascot.scale || 1;
            const mWidth = 120 * mScale;
            let mX = cardCenterX;
            let mY = cardCenterY;

            if (mascot.position.includes('left')) mX = -30;
            if (mascot.position.includes('right')) mX = CARD_WIDTH + 30;
            if (mascot.position.includes('top')) mY = -30;
            if (mascot.position.includes('bottom')) mY = CARD_HEIGHT + 30;

            maxDistX = Math.max(maxDistX, Math.abs(mX - cardCenterX) + mWidth / 2);
            maxDistY = Math.max(maxDistY, Math.abs(mY - cardCenterY) + mWidth / 2);
        });

        // 3. Logo extent
        const logoConfig = (config.scratch?.logo || {}) as any;
        const logoUrl = logoConfig.image || (config.theme?.generated as any)?.logo;

        if (logoUrl && logoConfig.layout !== 'integrated') {
            const lX = cardCenterX + (logoConfig.customPosition?.x || 0);
            const lY = logoConfig.customPosition?.y ?? -180;
            const lScale = (logoConfig.scale || 100) / 100;
            const lWidth = 280 * lScale;
            const lHeight = 150 * lScale;

            maxDistX = Math.max(maxDistX, Math.abs(lX - cardCenterX) + lWidth / 2);

            // For Y, we treat the card as the pivot, so distance from center:
            const logoBottom = lY + lHeight;
            const logoTop = lY;
            maxDistY = Math.max(maxDistY, Math.abs(logoTop - cardCenterY), Math.abs(logoBottom - cardCenterY));
        }

        return {
            width: maxDistX * 2,
            height: maxDistY * 2
        };
    }, [config.scratch, config.theme, CARD_WIDTH, CARD_HEIGHT]);

    useEffect(() => {
        if (!wrapperRef.current) return;
        const updateScale = () => {
            const { width, height } = wrapperRef.current!.getBoundingClientRect();
            if (width === 0 || height === 0) return;

            const isDesktop = width > 640;
            const marginX = isDesktop ? 60 : 40;
            const marginY = isDesktop ? 180 : 100;

            // [FIX] Differentiate between Editor (Fixed) and Preview (Responsive):
            // In responsive mode (Test Game), we scale for the whole visual area.
            // In design view, we scale for the CARD frame so it stays a fixed size.
            const targetW = isResponsive ? (visualBounds.width || CARD_WIDTH) : CARD_WIDTH;
            const targetH = isResponsive ? (visualBounds.height || CARD_HEIGHT) : CARD_HEIGHT;

            const s = Math.min(
                (width - marginX) / targetW,
                (height - marginY) / targetH
            );
            setFitScale(s > 0 ? s : 1);
        };
        const observer = new ResizeObserver(updateScale);
        observer.observe(wrapperRef.current);
        updateScale();
        return () => observer.disconnect();
    }, [visualBounds, CARD_WIDTH, CARD_HEIGHT]);

    // --- Transform & Layout Extraction (Moved up for Hook Dependency) ---
    // 1. Card Container (Frame Config) - Controls Frame position on screen
    const containerScaleX = (config.scratch?.layout?.transform?.scaleX || config.scratch?.layout?.transform?.scale || 100) / 100;
    const containerScaleY = (config.scratch?.layout?.transform?.scaleY || config.scratch?.layout?.transform?.scale || 100) / 100;
    const containerX = config.scratch?.layout?.transform?.x ?? 0;
    const containerY = config.scratch?.layout?.transform?.y ?? 0;

    // 2. Internal Grid (Grid Transform) - Controls Grid position inside Frame
    const gridScaleX = (config.scratch?.layout?.grid?.scaleX ?? config.scratch?.layout?.grid?.scale ?? 87) / 100;
    const gridScaleY = (config.scratch?.layout?.grid?.scaleY ?? config.scratch?.layout?.grid?.scale ?? 79) / 100;
    const gridX = config.scratch?.layout?.grid?.x ?? 0;
    const gridY = config.scratch?.layout?.grid?.y ?? 42;

    const gridBgColor = config.scratch?.layout?.gridBackgroundColor || '#f3f4f6';
    const cellStyle = config.scratch?.layout?.cellStyle || 'boxed';
    const overlayColor = config.scratch?.layers?.overlay?.color || '#F2F0EB';
    const overlayZIndex = config.scratch?.layers?.overlay?.zIndex ?? 120;
    const overlayBlendMode = (config.scratch?.layers?.overlay as any)?.blendMode || 'normal';

    // Generate dynamic brush image for default types
    const brushUrl = useMemo(() => {
        const type = config.scratch?.brush?.tipType || 'coin';


        if (type === 'custom') return config.scratch?.brush?.customTipImage;

        // Generate emoji-based brush for default types
        if (type === 'finger' || type === 'wand' || type === 'eraser' || type === 'coin') {
            const canvas = document.createElement('canvas');
            canvas.width = 128; // Higher res for better scaling
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, 128, 128);
                ctx.font = '115px serif'; // Increased font to fill canvas more
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // Map type to emoji
                const emoji = type === 'finger' ? '👆' : type === 'wand' ? '🪄' : type === 'eraser' ? '🧼' : '🪙';
                ctx.fillText(emoji, 64, 64 + 6); // Slightly less vertical offset for larger font
                return canvas.toDataURL();
            }
        }
        return undefined;
    }, [config.scratch?.brush?.tipType, config.scratch?.brush?.customTipImage]);

    const {
        canvasRef,
        containerRef,
        initCanvas,
        fillCanvas,
        clearCanvas,
        progress,
        isReady,
        isScratching
    } = useScratchEngine({
        brushSize: brushSize,
        enabled: engineEnabled,
        image: config.scratch?.layers?.foil?.image,
        brushImageUrl: brushUrl,
        onResize: () => {
            // Engine triggers this on resize. We need to re-generate the gradient!
            foilLogicRef.current.reapply();
        },
        // [FIX] Only compensate for the distortion (Layout/Grid scale), 
        // DO NOT include fitScale because the engine's resize already handles the base zoom.
        scaleX: containerScaleX * gridScaleX,
        scaleY: containerScaleY * gridScaleY,
        onScratchStart: useCallback(() => {
            const sfx = getAudio('scratch');
            if (sfx) {
                sfx.loop = true;
                // [FIX] Only reset and play if not already playing to avoid "audio gap"
                if (sfx.paused) {
                    sfx.play().catch(() => { });
                }
            }

            setGameState((prev: 'idle' | 'playing' | 'revealed' | 'won') => {
                if (prev === 'idle' || prev === 'won' || prev === 'revealed') {
                    return 'playing';
                }
                return prev;
            });
        }, [setGameState, getAudio]),
        onScratchEnd: useCallback(() => {
            const sfx = getAudio('scratch');
            if (sfx) {
                // [FIX] Fade out or pause immediately, but don't reset currentTime here
                // Resetting currentTime on every stop can cause laggy "re-start" feel
                sfx.pause();
            }
        }, [getAudio]),
        onScratchProgress: undefined, // Handled by useEffect below to avoid circular dependency
        // Update onScratchMove to handle coordinate mapping
        onScratchMove: useCallback(({ x, y }: { x: number, y: number }) => {
            // Helper to get color based on foil
            const getParticleColor = () => {
                switch (foilTexture) {
                    case 'gold': return `hsl(${Math.random() * 20 + 40}, 100%, 60%)`; // Golden Yellow
                    case 'silver': return `hsl(0, 0%, ${Math.random() * 40 + 60}%)`; // Silver/Gray
                    case 'platinum': return `hsl(200, 10%, ${Math.random() * 20 + 70}%)`; // Cool White
                    case 'rose-gold': return `hsl(${Math.random() * 10 + 340}, 60%, 70%)`; // Pinkish
                    case 'copper': return `hsl(20, 60%, 60%)`; // Brownish Orange
                    case 'holographic': return `hsl(${Math.random() * 360}, 100%, 70%)`; // Rainbow
                    case 'latex': return `hsl(0, 0%, 20%)`; // Dark Gray
                    case 'sand': return `hsl(40, 40%, 70%)`; // Beige
                    case 'carbon': return `hsl(0, 0%, 10%)`; // Black
                    default:
                        return config.scratch?.layers?.foil?.color || `hsl(${Math.random() * 60 + 20}, 100%, 70%)`;
                }
            };

            // Calculate Global Position for Particles
            let spawnX = x;
            let spawnY = y;

            if (localContainerRef.current && particleCanvasRef.current) {
                const rect = localContainerRef.current.getBoundingClientRect();
                const canvasRect = particleCanvasRef.current.getBoundingClientRect();

                // [FIX] Coordinate space parity: 
                // Since the engine logical unit is already 1:1 with visual pixels, 
                // we just add the offset of the container relative to the particle canvas.
                spawnX = rect.left + x - canvasRect.left;
                spawnY = rect.top + y - canvasRect.top;
            }

            // [FIX] Spawn particles more aggressively (parity with export)
            const count = 8; // Match export i < 8

            if (config.scratch?.effects?.particles) {
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * (brushSize / 2);
                    const offsetX = Math.cos(angle) * r;
                    const offsetY = Math.sin(angle) * r;

                    particlesRef.current.push({
                        x: spawnX + offsetX,
                        y: spawnY + offsetY,
                        vx: (Math.random() - 0.5) * 6, // Match export vx
                        vy: (Math.random() - 0.5) * 6, // Match export vy
                        life: 1.5, // Match export life
                        color: getParticleColor(),
                        type: 'spark',
                        size: Math.random() * 3 + 1, // Match export size
                        rotation: Math.random() * Math.PI,
                        vRotation: (Math.random() - 0.5) * 0.1
                    });
                }
            }
            if (config.scratch?.effects?.confetti) {
                for (let i = 0; i < 2; i++) {
                    particlesRef.current.push({
                        x: spawnX,
                        y: spawnY,
                        vx: (Math.random() - 0.5) * 6,
                        vy: -5 - Math.random() * 5, // Pop UP first
                        life: 3.0,
                        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
                        type: 'confetti',
                        size: Math.random() * 6 + 4,
                        rotation: Math.random() * Math.PI,
                        vRotation: (Math.random() - 0.5) * 0.2
                    });
                }
            }
        }, [config.scratch?.effects?.particles, config.scratch?.effects?.confetti, foilTexture, config.scratch?.layers?.foil?.color, particleCanvasRef])
    });

    // --- Particle System Loop ---
    useEffect(() => {
        let animationFrameId: number;

        const render = () => {
            const canvas = particleCanvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Resize handling (Full screen/container)
            // Use window.devicePixelRatio for crisp rendering on high DPI
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            // We want the canvas internal resolution to match screen pixels * DPR
            // But we don't want to constantly reset width/height as it clears canvas.
            // Check if resize is needed.
            const targetWidth = Math.floor(rect.width * dpr);
            const targetHeight = Math.floor(rect.height * dpr);

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                // Scale context to match DPR? 
                // No, we're drawing in raw pixels for particles usually, 
                // but let's just stick to 1:1 if we used client coordinates.
                // If we use dpr, we must scale drawing operations.
                // For simplicity/performance now, let's stick to 1:1 visual pixels if possible,
                // OR just accept standard canvas resizing.
                // Let's match offsetWidth for now to avoid coordinate headaches.
                canvas.width = rect.width;
                canvas.height = rect.height;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Optimization: Filter out dead particles in place if possible, or filter.
            // Here slice logic is fine for low count.
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.015; // Decay

                // Gravity
                p.vy += 0.4;

                // Air resistance
                p.vx *= 0.98;

                if (p.type === 'confetti') {
                    p.rotation += p.vRotation;
                    // Heavier gravity for confetti?
                    // p.vy is shared.
                }

                if (p.life <= 0 || p.y > canvas.height + 100) {
                    particlesRef.current.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                if (p.type === 'confetti') ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.min(1, p.life);

                if (p.type === 'confetti') {
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
            animationFrameId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // --- Dynamic Foil Style Generator (Canvas Gradient) ---
    const applyFoilStyle = useCallback(() => {
        // Wait for engine to be fully mounted
        if (!isReady) return;
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Safety check: if canvas is 0x0, gradient creation fails or is useless
        if (canvasRef.current.width === 0 || canvasRef.current.height === 0) return;

        // If custom image is set, the engine handles it via the `image` prop we passed above.
        // We only care about procedural gradients here.
        if (config.scratch?.layers?.foil?.image) return;

        let fillStyle: string | CanvasGradient = '#C0C0C0';



        if (foilTexture === 'gold') {
            const g = ctx.createLinearGradient(0, 0, canvasRef.current.width, canvasRef.current.height);
            g.addColorStop(0, '#FFD700');
            g.addColorStop(0.5, '#FDB931');
            g.addColorStop(1, '#FFFFFF');
            fillStyle = g;
        } else if (foilTexture === 'silver') {
            const g = ctx.createLinearGradient(0, 0, canvasRef.current.width, canvasRef.current.height);
            g.addColorStop(0, '#E0E0E0');
            g.addColorStop(0.5, '#A0A0A0');
            g.addColorStop(1, '#FFFFFF');
            fillStyle = g;
        } else if (foilTexture === 'platinum') {
            const g = ctx.createLinearGradient(0, 0, canvasRef.current.width, canvasRef.current.height);
            g.addColorStop(0, '#E5E4E2');
            g.addColorStop(0.5, '#BFC0C2');
            g.addColorStop(1, '#FFFFFF');
            fillStyle = g;
        } else if (foilTexture === 'rose-gold') {
            const g = ctx.createLinearGradient(0, 0, canvasRef.current.width, canvasRef.current.height);
            g.addColorStop(0, '#F4C4C2');
            g.addColorStop(0.5, '#B76E79');
            g.addColorStop(1, '#FFFFFF');
            fillStyle = g;
        } else if (foilTexture === 'copper') {
            const g = ctx.createLinearGradient(0, 0, canvasRef.current.width, canvasRef.current.height);
            g.addColorStop(0, '#B87333');
            g.addColorStop(0.5, '#8A5A44');
            g.addColorStop(1, '#FFFFFF');
            fillStyle = g;
        } else if (foilTexture === 'holographic') {
            const g = ctx.createLinearGradient(0, 0, canvasRef.current.width, canvasRef.current.height);

            // AAA "Prismatic" / Diffraction Grating Look (Sharp, Multi-band)
            // Repeating spectrum for maximum dispersion effect
            g.addColorStop(0, '#FF0000');
            g.addColorStop(0.14, '#FF7F00');
            g.addColorStop(0.28, '#FFFF00');
            g.addColorStop(0.42, '#00FF00');
            g.addColorStop(0.57, '#0000FF');
            g.addColorStop(0.71, '#4B0082');
            g.addColorStop(0.85, '#9400D3');
            g.addColorStop(1, '#FF0000');
            fillStyle = g;
        } else if (foilTexture === 'latex') {
            fillStyle = '#333333';
        } else if (foilTexture === 'sand') {
            fillStyle = '#E6D095';
        } else if (foilTexture === 'carbon') {
            fillStyle = '#1A1A1A';
        } else if (config.scratch?.layers?.foil?.color) {
            fillStyle = config.scratch.layers.foil.color;
        }

        fillCanvas(fillStyle);

    }, [canvasRef, foilTexture, config.scratch?.layers?.foil?.image, config.scratch?.layers?.foil?.color, fillCanvas, isReady]);

    // Bind logic to Ref (for resize callback)
    useEffect(() => {
        foilLogicRef.current.reapply = applyFoilStyle;
    }, [applyFoilStyle]);

    // Initial Apply & Sync
    // 1. Visual Sync Effect (Foil Changes)
    useEffect(() => {
        if (isReady) {
            applyFoilStyle();
        }
    }, [isReady, applyFoilStyle]);

    // 2. Logic/Init Effect (Mount & Round Gen)
    useEffect(() => {
        initCanvas();
        generateRound(true);
        // Note: we do NOT put applyFoilStyle here. 
        // It has its own dedicated effect that runs when visual config changes.
        // This prevents 'generateRound' instability from resetting the canvas.
    }, [initCanvas, generateRound]);

    // UI Handlers that bridge Hook + Canvas
    const handleBuyClick = async () => {
        const success = await buyTicket();
        if (success) {
            applyFoilStyle(); // Reset foil
        }
    };

    const handleAutoplay = () => {
        setIsAutoPlaying(true);
    };

    const handleStopAuto = () => {
        setIsAutoPlaying(false);
    };

    // Asset Resolution
    const getSymbolForCell = (index: number) => {
        // Use the resolved outcome map if available
        if (currentOutcome?.revealMap && currentOutcome.revealMap[index]) {
            const rawValue = currentOutcome.revealMap[index];

            // A. If it's already a URL/Path, return it
            if (rawValue.startsWith('http') || rawValue.startsWith('data:') || rawValue.startsWith('/')) {
                return rawValue;
            }

            // B. If it's an ID, look it up in the Prize Table
            const matchedPrize = config.scratch?.prizes?.find(p => p.id === rawValue);

            // Check for valid image source (Image property OR explicit SymbolId override)
            const resolvedPrizeImage = matchedPrize?.symbolId || matchedPrize?.image;

            // DEBUG: Log failures to help trace why it's not matching
            // Ignore valid 'LOSE' symbols or internal tier markers which aren't in the prize table
            const isExpectedMissing = rawValue.toUpperCase().startsWith('LOSE') || rawValue.startsWith('tier_');

            if (!matchedPrize && !isExpectedMissing) {
                // console.warn(`[Preview] Symbol ID '${rawValue}' not found in Prize Table.`);
            } else if (matchedPrize && !resolvedPrizeImage) {
                console.warn(`[Preview] Symbol ID '${rawValue}' found, but has no image or symbolId!`, matchedPrize);
            }

            if (resolvedPrizeImage) {
                return resolvedPrizeImage;
            }

            // C. Special Handling for "Lose" Symbols
            if (rawValue.toUpperCase().startsWith('LOSE') || !matchedPrize) {
                // [UPDATED] Check for Manual Decoy Variants first
                const decoys = config.scratch?.symbols?.loseVariants;
                if (decoys && decoys.length > 0) {
                    const hash = rawValue.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                    const index = hash % decoys.length;
                    return decoys[index];
                }

                // Fallback to Style Presets
                const style = config.scratch?.symbols?.style || 'gems';
                const assetSet = (ASSET_MAP as any)[style] || (ASSET_MAP as any)['gems'];

                if (assetSet && assetSet.lose && assetSet.lose.length > 0) {
                    const hash = rawValue.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                    const index = hash % assetSet.lose.length;
                    return assetSet.lose[index];
                }
            }

            // D. Fallback: Lookup in ASSET_MAP if it matches a style key (Unlikely for dynamic IDs)
            return rawValue;
        }

        // Fallback (e.g. initial load before any round generated)
        const style = config.scratch?.symbols?.style || 'gems';
        const assetSet = (ASSET_MAP as any)[style] || (ASSET_MAP as any)['gems'];
        // Safety check: ensure set exists before accessing win
        if (!assetSet || !assetSet.win || assetSet.win.length === 0) {
            // Ultimate fallback to prevent crash
            return 'https://cdn-icons-png.flaticon.com/512/616/616430.png';
        }
        return assetSet.win[0];
    };

    // Heuristic checking for winning symbol (Most frequent in a win)
    const winningSymbol = useMemo(() => {
        if (!currentOutcome?.isWin || !currentOutcome.revealMap) return null;
        const counts: Record<string, number> = {};
        currentOutcome.revealMap.forEach((s: string) => counts[s] = (counts[s] || 0) + 1);
        // Return most frequent symbol
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }, [currentOutcome]);

    // ...

    // [FIX] Auto-reveal completion logic (Moved here to avoid circular dependency with clearCanvas)
    useEffect(() => {
        let threshold = config.scratch?.brush?.revealThreshold || 0.95;
        if (threshold > 1) threshold /= 100; // [FIX] Parity: Handle 65 vs 0.65

        if (progress >= threshold && gameState === 'playing' && isReady) {
            clearCanvas();
            resolveRound(true);
        }
    }, [progress, clearCanvas, resolveRound, config.scratch?.brush?.revealThreshold, gameState, isReady]);

    const mainRef = useRef<HTMLDivElement>(null!);

    return (
        <div ref={mainRef} className={`flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl relative ${className}`}>

            
            {/* Audio Toggle */}
            <button
                onClick={() => setIsMuted(prev => !prev)}
                className="absolute top-4 right-4 z-[60] bg-gray-900/80 hover:bg-black text-white p-2 rounded-full border border-gray-700 shadow-xl backdrop-blur-sm transition-all text-xs flex items-center gap-2 group"
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
                {isMuted ? <VolumeX size={16} className="text-gray-400 group-hover:text-red-400" /> : <Volume2 size={16} className="text-green-400 group-hover:text-green-300" />}
            </button>

            {/* 1. Game Area (Top) */}
            <div ref={wrapperRef} className="flex-1 relative overflow-hidden flex items-center justify-center p-4 bg-gray-800/50">

                {/* Scene Background */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500"
                    style={{
                        backgroundColor: !backgroundImage?.startsWith('http') && !backgroundImage?.startsWith('data:') && !backgroundImage?.includes('gradient') ? (backgroundImage || '#1a1a1a') : undefined,
                        backgroundImage: (backgroundImage?.startsWith('http') || backgroundImage?.startsWith('data:')) ? `url(${backgroundImage})` : (backgroundImage?.includes('gradient') ? backgroundImage : undefined)
                    }}
                />

                <div
                    className="relative z-10 origin-center"
                    style={{
                        width: `${CARD_WIDTH}px`,
                        height: `${CARD_HEIGHT}px`,
                        transform: `scale(${fitScale})`
                    }}
                >
                    <div className="absolute inset-0">
                        {/* Pop-out Logo Stroke */}
                        {config.scratch?.logo?.image && config.scratch?.logo?.layout === 'pop-out' && (
                            <div
                                className="absolute z-[15] pointer-events-none flex items-center justify-center w-full"
                                style={{
                                    transform: `translate(${config.scratch.logo.customPosition?.x || 0}px, ${config.scratch.logo.customPosition?.y ?? -180}px) scale(${(config.scratch.logo.scale || 100) / 100})`,
                                    top: 0
                                }}
                            >
                                <img
                                    src={config.scratch.logo.image}
                                    className="max-w-[280px] object-contain"
                                    style={{
                                        filter: (() => {
                                            const strokeColor = config.scratch.logo.autoStroke ? (overlayColor || '#F2F0EB') : (config.scratch.logo.strokeColor || '#ffffff');
                                            return `drop-shadow(1px 0 0 ${strokeColor}) 
                                                drop-shadow(-1px 0 0 ${strokeColor}) 
                                                drop-shadow(0 1px 0 ${strokeColor}) 
                                                drop-shadow(0 -1px 0 ${strokeColor})
                                                drop-shadow(1px 1px 0 ${strokeColor})
                                                drop-shadow(-1px -1px 0 ${strokeColor})
                                                drop-shadow(1px -1px 0 ${strokeColor})
                                                drop-shadow(-1px 1px 0 ${strokeColor})
                                                drop-shadow(0 0 1px ${strokeColor})`;
                                        })()
                                    }}
                                />
                            </div>
                        )}

                        {/* Games Logo Top Layer */}
                        {config.scratch?.logo?.image && config.scratch?.logo?.layout !== 'integrated' && (
                            <div
                                className="absolute z-[60] pointer-events-none flex items-center justify-center w-full"
                                style={{
                                    transform: `translate(${config.scratch.logo.customPosition?.x || 0}px, ${config.scratch.logo.customPosition?.y ?? -180}px) scale(${(config.scratch.logo.scale || 100) / 100})`,
                                    top: 0
                                }}
                            >
                                <img src={config.scratch.logo.image} className="max-w-[280px] object-contain drop-shadow-xl" />
                            </div>
                        )}

                        {/* Mascots Layer */}
                        {config.scratch?.mascot?.type === 'image' && config.scratch.mascot.image && (() => {
                            const mascotScale = config.scratch.mascot.scale ?? 100;
                            const mascotX = config.scratch.mascot.customPosition?.x || 0;
                            const mascotY = config.scratch.mascot.customPosition?.y || 0;
                            const mascotH = mascotScale * 4.6;
                            const animClass =
                                config.scratch.mascot.animation === 'bounce' ? 'animate-bounce' :
                                    config.scratch.mascot.animation === 'pulse' ? 'animate-pulse' :
                                        config.scratch.mascot.animation === 'float' ? 'animate-pulse' :
                                            config.scratch.mascot.animation === 'wave' ? 'animate-spin' : '';
                            return (
                                <div
                                    className="absolute z-50 pointer-events-none flex items-center justify-center"
                                    style={{ top: 0, left: 0, width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
                                >
                                    <div className={animClass} style={{ transform: `translate(${mascotX}px, ${mascotY}px)` }}>
                                        <img src={config.scratch.mascot.image} className="object-contain drop-shadow-2xl" style={{ height: `${mascotH}px` }} />
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Legacy Mascots */}
                        {config.scratch?.layers?.overlay?.mascots?.map((mascot, i) => (
                            <img
                                key={i}
                                src={mascot.source}
                                className="absolute z-50 pointer-events-none"
                                style={{
                                    top: mascot.position.includes('top') ? -30 : undefined,
                                    bottom: mascot.position.includes('bottom') ? -30 : undefined,
                                    left: mascot.position.includes('left') ? -30 : undefined,
                                    right: mascot.position.includes('right') ? -30 : undefined,
                                    width: `${120 * mascot.scale}px`
                                }}
                            />
                        ))}

                        {/* Card Group */}
                        <div
                            className="absolute z-20 origin-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-xl overflow-hidden"
                            style={{
                                left: 0,
                                top: 0,
                                width: `${CARD_WIDTH}px`,
                                height: `${CARD_HEIGHT}px`,
                                transform: `translate(${containerX}px, ${containerY}px) scale(${containerScaleX}, ${containerScaleY})`
                            }}
                        >
                            <div className="absolute inset-0 z-0" style={{ backgroundColor: overlayColor === 'transparent' ? 'transparent' : overlayColor }} />

                            {/* Frame/Overlay */}
                            <div
                                className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
                                style={{ zIndex: overlayZIndex < 50 ? 5 : 120, mixBlendMode: overlayBlendMode as any }}
                            >
                                {overlayImage && <img src={overlayImage} className="absolute inset-0 w-full h-full object-fill" />}

                                {/* Integrated Logo */}
                                {config.scratch?.logo?.image && config.scratch?.logo?.layout === 'integrated' && (
                                    <div
                                        className="absolute z-10 pointer-events-none flex items-center justify-center w-full"
                                        style={{
                                            transform: `translate(${config.scratch.logo.customPosition?.x || 0}px, ${config.scratch.logo.customPosition?.y ?? -180}px) scale(${(config.scratch.logo.scale || 100) / 100})`,
                                            top: 0
                                        }}
                                    >
                                        <img src={config.scratch.logo.image} className="max-w-[280px] object-contain drop-shadow-xl" />
                                    </div>
                                )}

                                {/* Target Symbol Indicator */}
                                {config.scratch?.mechanic?.type === 'find_symbol' && config.scratch?.rulesGrid?.targetSymbolId && (
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg border border-blue-200 flex items-center gap-2">
                                        <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">TARGET</span>
                                        <div className="w-px h-3 bg-gray-300 mx-1" />
                                        <img
                                            src={config.scratch.rulesGrid.targetSymbolId.includes('http') || config.scratch.rulesGrid.targetSymbolId.startsWith('data:') ? config.scratch.rulesGrid.targetSymbolId : 'https://cdn-icons-png.flaticon.com/512/616/616430.png'}
                                            className="w-6 h-6 object-contain"
                                        />
                                        {config.scratch.rulesGrid.ruleMode === 'COLLECT_X' && (
                                            <span className="text-xs font-black text-gray-600 ml-1">x{config.scratch.rulesGrid.requiredHits}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* The Grid/Card Body */}
                            <div
                                className={`absolute z-10 transition-all duration-300 transform origin-center
                                ${config.scratch?.mechanic?.type === 'wheel' ? 'rounded-full overflow-hidden shadow-xl' : 'rounded-lg'}
                                ${cellStyle === 'boxed' ? '' : 'gap-1'}
                            `}
                                style={{
                                    width: `${CARD_WIDTH}px`,
                                    height: config.scratch?.mechanic?.type === 'wheel' ? '320px' : '400px',
                                    backgroundColor: config.scratch?.mechanic?.type === 'wheel' ? 'transparent' : gridBgColor,
                                    left: '50%',
                                    top: '50%',
                                    marginLeft: `-${HALF_WIDTH}px`,
                                    marginTop: config.scratch?.mechanic?.type === 'wheel' ? '-160px' : '-200px',
                                    transform: `translate(${gridX}px, ${gridY}px) scale(${gridScaleX}, ${gridScaleY})`,
                                    display: config.scratch?.mechanic?.type === 'wheel' ? 'flex' : 'grid',
                                    gridTemplateColumns: config.scratch?.mechanic?.type === 'wheel' ? undefined : `repeat(${cols}, 1fr)`,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {/* WHEEL RENDERER */}
                                {config.scratch?.mechanic?.type === 'wheel' && (
                                    <div className="relative w-full h-full bg-white rounded-full border-4 border-yellow-400 flex items-center justify-center overflow-hidden">
                                        <div className="absolute inset-0 opacity-20" style={{ background: 'conic-gradient(red, yellow, green, blue, red)' }} />
                                        <div className="z-10 text-center">
                                            <div className="text-xs font-bold uppercase mb-1">Prize</div>
                                            <img src={getSymbolForCell(0)} className="w-16 h-16 object-contain animate-pulse" />
                                            <div className="text-xs font-bold mt-1 text-black">{currentOutcome?.isWin ? 'WIN!' : 'SPIN'}</div>
                                        </div>
                                    </div>
                                )}

                                {/* GRID RENDERER */}
                                {config.scratch?.mechanic?.type !== 'wheel' && Array.from({ length: rows * cols }).map((_, i) => {
                                    const isMatchMechanic = config.scratch?.mechanic?.type?.startsWith('match_');
                                    const isPreviewMode = mode === 'layout' || mode === 'mechanics';
                                    const isNumberStyle = config.scratch?.symbols?.style === 'numbers';
                                    const showNumericPreview = (isMatchMechanic && isPreviewMode) || isNumberStyle;
                                    const mockValues = [5, 10, 20, 50, 100, 500, 1000, 5, 10, 50, 100, 2500];
                                    const mockValue = mockValues[i % mockValues.length];
                                    const fontSizeClass = cols >= 4 ? 'text-lg' : 'text-2xl';

                                    return (
                                        <div
                                            key={i}
                                            className={`flex items-center justify-center relative transition-all overflow-hidden ${cellStyle === 'boxed' ? 'bg-white rounded-md shadow-inner border border-gray-200 p-2' : 'p-1 rounded-sm'} ${gameState === 'won' && currentOutcome?.isWin && getSymbolForCell(i) === winningSymbol ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
                                        >
                                            {showNumericPreview ? (
                                                <div className="flex flex-col items-center justify-center w-full h-full">
                                                    <span className={`${fontSizeClass} font-black text-gray-800 tracking-tight`}>${mockValue}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <img src={getSymbolForCell(i)} className="w-full h-full object-contain" />
                                                    <span className={`absolute bottom-1 right-1 text-[10px] font-mono font-bold ${cellStyle === 'boxed' ? 'text-gray-400' : 'text-gray-600'}`}>$10</span>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}

                                {mode !== 'layout' && (
                                    <div
                                        className="absolute inset-0 z-[100] cursor-none"
                                        ref={(el) => {
                                            if (containerRef) (containerRef as any).current = el;
                                            localContainerRef.current = el;
                                        }}
                                        onMouseEnter={() => setShowCursor(true)}
                                        onMouseLeave={() => setShowCursor(false)}
                                        onMouseMove={(e) => setCursorPos({ x: e.clientX, y: e.clientY })}
                                    >
                                        <FoilCanvas
                                            ref={canvasRef}
                                            className={`w-full h-full transition-opacity duration-1000 ${gameState === 'won' || gameState === 'revealed' ? 'opacity-0' : 'opacity-100'}`}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Result Overlay */}
                    {(gameState === 'won' || gameState === 'revealed') && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                            <div className={`px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md border-2 transform transition-all duration-500 ${gameState === 'won' ? 'bg-green-500/80 border-green-300 text-white scale-110 animate-bounce' : 'bg-gray-800/80 border-gray-600 text-gray-200'}`}>
                                <h2 className="text-2xl font-black uppercase tracking-widest drop-shadow-md">
                                    {gameState === 'won' ? `BIG WIN! €${win.toFixed(2)}` : 'TRY AGAIN'}
                                </h2>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Particle Overlay */}
            <canvas ref={particleCanvasRef} className="absolute inset-0 z-[40] pointer-events-none w-full h-full" />

            {/* Custom Cursor */}
            {showCursor && (
                <div
                    className="fixed pointer-events-none z-[9999] flex items-center justify-center transition-transform duration-75"
                    style={{
                        left: cursorPos.x,
                        top: cursorPos.y,
                        width: `${brushSize * fitScale}px`,
                        height: `${brushSize * fitScale}px`,
                        transformOrigin: 'center center',
                        transform: `translate(-50%, -50%) ${isScratching ? 'scale(0.95)' : 'scale(1)'}`
                    }}
                >
                    {brushUrl ? (
                        <img src={brushUrl} className="w-full h-full object-contain drop-shadow-lg" />
                    ) : (
                        <div className="w-full h-full rounded-full border-2 border-white/50 bg-black/20 backdrop-blur-sm" />
                    )}
                </div>
            )}

            {/* Controls */}
            <div className="relative z-50 border-t border-gray-800">
                <GameControls
                    balance={balance}
                    bet={bet}
                    win={win}
                    gameState={gameState}
                    onBetChange={setBet}
                    onBuy={handleBuyClick}
                    onAutoplay={handleAutoplay}
                    isAutoPlaying={isAutoPlaying}
                    onStopAuto={handleStopAuto}
                    gameTitle={(config as any).general?.title || 'NEW GAME'}
                    rulesConfig={config.gameRules}
                />
            </div>
        </div>
    );
};

export default ScratchGridPreview;
