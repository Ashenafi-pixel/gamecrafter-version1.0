import React, { useEffect, useRef, useState } from 'react';
import { Application, Assets, Container, Graphics } from 'pixi.js';
import { TextureAtlas, AtlasAttachmentLoader, SkeletonBinary } from '@pixi/spine-pixi';
// Ensure global extension registration (critical for "spine" render pipe)
import '@pixi/spine-pixi';
import { Spine } from './vendors/FixedSpine';
import { SpineImportResult } from '../../utils/spine-import-utils';

interface SpinePlayerProps {
    spineData: SpineImportResult | string; // Object or JSON string
    width?: number;
    height?: number;
    animationName?: string;
    loop?: boolean;
    className?: string;
    isPlaying?: boolean;
}

// Custom loader to handle path mismatches in user-uploaded Spine assets
class RobustAtlasAttachmentLoader extends AtlasAttachmentLoader {
    // @ts-ignore
    newRegionAttachment(skin: any, name: string, path: string) {
        let attachment;

        try {
            // @ts-ignore - Signature mismatch workaround for pixi-spine v8 adapter
            attachment = super.newRegionAttachment(skin, name, path, null);
        } catch (e) {
            // If super throws (region not found), catch it and try fuzzy search
        }

        if (!attachment || !attachment.region) {
            // Try to find region with various path modifications
            const region = this.findRegionFuzzy(path);
            if (region) {
                // If fuzzy found something, we need to create the attachment manually or retry super with correct path
                try {
                    // Retry super with the found region name
                    // @ts-ignore
                    attachment = super.newRegionAttachment(skin, name, region.name, null);
                    attachment.region = region; // Ensure it's set
                } catch (retryErr) {
                    console.error("SpinePlayer: Failed to create attachment even with fuzzy found region", retryErr);
                }
            }
        }

        // CRITICAL: If still no attachment, return a placeholder to prevent "Cannot read properties of null (reading 'sequence')"
        if (!attachment && this.atlas.regions.length > 0) {
            console.warn(`SpinePlayer: CRITICAL FALLBACK. Creating placeholder for '${path}' using first available region.`);
            try {
                const firstRegion = this.atlas.regions[0];
                // @ts-ignore
                attachment = super.newRegionAttachment(skin, name, firstRegion.name, null);
                attachment.region = firstRegion; // Use whatever we have
                // Optional: Make it invisible if possible, or just accept the glitch to prevent crash
                if (attachment.color) attachment.color.a = 0; // Try to hide it
            } catch (fallbackErr) {
                console.error("SpinePlayer: Failed to create fallback attachment", fallbackErr);
            }
        }

        return attachment;
    }

    // @ts-ignore
    newMeshAttachment(skin: any, name: string, path: string) {
        let attachment;
        try {
            // @ts-ignore
            attachment = super.newMeshAttachment(skin, name, path, null);
        } catch (e) {
            // Catch failure
        }

        if (!attachment || !attachment.region) {
            const region = this.findRegionFuzzy(path);
            if (region) {
                try {
                    // @ts-ignore
                    attachment = super.newMeshAttachment(skin, name, region.name, null);
                    attachment.region = region;
                } catch (retryErr) {
                    console.error("SpinePlayer: Failed to create mesh attachment with fuzzy region", retryErr);
                }
            }
        }

        // Fallback for Mesh
        if (!attachment && this.atlas.regions.length > 0) {
            console.warn(`SpinePlayer: CRITICAL FALLBACK (Mesh). Creating placeholder for '${path}'.`);
            try {
                const firstRegion = this.atlas.regions[0];
                // @ts-ignore
                attachment = super.newMeshAttachment(skin, name, firstRegion.name, null);
                attachment.region = firstRegion;
            } catch (e) { /* ignore */ }
        }

        return attachment;
    }

    findRegionFuzzy(path: string) {
        // 1. Try exact match (already done by super, but safe to retry)
        let region = this.atlas.findRegion(path);
        if (region) return region;

        // 2. Try basename (remove directory structure)
        const basename = path.split('/').pop() || path;
        region = this.atlas.findRegion(basename);
        if (region) {
            console.warn(`SpinePlayer: Found region using basename '${basename}' instead of '${path}'`);
            return region;
        }

        // 3. Try to iterate and fuzzy match? (Expensive but safe for faulty exports)
        // Let's create a map of normalized names if needed, but for now just array search
        const regions = this.atlas.regions;

        for (const r of regions) {
            const rName = r.name;

            // Check if region name ends with the requested basename
            if (rName.endsWith(basename)) {
                console.warn(`SpinePlayer: Found region via suffix match '${rName}' for '${path}'`);
                return r;
            }

            // Check for potential Sequence root match (e.g. "blob" matches "blob1", "blob2")
            // If path is 'blob', and rName is 'blob1', 'blob_01' etc.
            if (rName.startsWith(path)) {
                // If the region name starts with the full path requested, check if the suffix is just numbers/underscores
                const remainder = rName.substring(path.length);
                if (/^[\d_]+$/.test(remainder)) {
                    console.warn(`SpinePlayer: Found potential sequence match '${rName}' for '${path}' (path prefix)`);
                    return r;
                }
            } else if (rName.startsWith(basename)) {
                // If checking just basename match
                const remainder = rName.substring(basename.length);
                if (/^[\d_]+$/.test(remainder)) {
                    // Check if it makes sense in directory context? Maybe looser check here is enough
                    console.warn(`SpinePlayer: Found potential sequence match '${rName}' for '${path}' (basename prefix)`);
                    return r;
                }
            }
        }

        console.error(`SpinePlayer: FAILED to find region for '${path}' even with fuzzy search.`);
        return null;
    }
}

const SpinePlayer: React.FC<SpinePlayerProps> = ({
    spineData,
    width = 300,
    height = 300,
    animationName = 'idle',
    loop = true,
    className = '',
    isPlaying = true
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const spineRef = useRef<Spine | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // 1. Data Parsing
        let parsedData: SpineImportResult;
        try {
            parsedData = typeof spineData === 'string' ? JSON.parse(spineData) : spineData;
            if (!parsedData.atlas || !parsedData.skel || !parsedData.texture) {
                throw new Error("Invalid Spine Data Structure");
            }
        } catch (e) {
            setError("Failed to parse Spine data");
            return;
        }

        const initPixi = async () => {
            // Cleanup previous instance
            if (appRef.current) {
                appRef.current.destroy({ removeView: true }, { children: true, texture: true, textureSource: true });
                appRef.current = null;
            }

            // 2. Initialize App (PixiJS v8 style)
            const app = new Application();
            await app.init({
                width,
                height,
                backgroundAlpha: 0, // Transparent
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                preference: 'webgl', // Force WebGL for Spine
            });

            if (!containerRef.current) {
                app.destroy();
                return;
            }
            containerRef.current.appendChild(app.canvas);
            appRef.current = app;

            try {
                // 3. Load Assets manually

                // A. Load Texture using Assets (v8)
                // We likely need to ensure the raw base64 is treated as a URL/Source
                const texture = await Assets.load(parsedData.texture);

                // B. Parse Atlas
                // In v8/Spine 5, the texture loader callback should return the texture directly.
                let atlasRaw = parsedData.atlas;

                // Decode if it's a base64 data URI or raw base64
                if (atlasRaw.startsWith('data:')) {
                    const base64Part = atlasRaw.split(',')[1];
                    if (base64Part) {
                        atlasRaw = atob(base64Part);
                    }
                } else if (!atlasRaw.includes('\n') && atlasRaw.length > 100) {
                    // Start heuristic check: if no newlines and long, probably raw base64
                    try {
                        const decoded = atob(atlasRaw);
                        // Double check if decoded looks like atlas (has newlines or specific keywords)
                        if (decoded.includes('\n') || decoded.includes('.png') || decoded.includes('.webp')) {
                            atlasRaw = decoded;
                        }
                    } catch (e) {
                        // Not base64, keep as is
                    }
                }

                const atlas = new TextureAtlas(atlasRaw);

                // Debug available regions
                console.log("Spine Atlas Regions Loaded:", atlas.regions.map(r => r.name));

                // 3. Assign Texture to Atlas Pages
                // Fix: Pass the loaded texture directly instead of re-wrapping with SpineTexture.from(texture.source)
                // The 'texture' from Assets.load is already a valid Pixi Texture.
                // Re-wrapping might be causing the autoGarbageCollect error if the source is shared/managed differently.
                atlas.pages.forEach(page => {
                    // Polyfill setFilters to satisfy pixi-spine interface on a raw Pixi v8 Texture
                    // @ts-ignore
                    if (!texture.setFilters) {
                        // @ts-ignore
                        texture.setFilters = (minLinear: boolean, magLinear: boolean, mipmapLinear: boolean) => {
                            if (!texture.source || !texture.source.style) return;
                            texture.source.style.minFilter = minLinear ? 'linear' : 'nearest';
                            texture.source.style.magFilter = magLinear ? 'linear' : 'nearest';
                            // Handle mipmap if needed, though often optional for basic slots
                        };
                    }

                    // @ts-ignore
                    if (!texture.setWraps) {
                        // @ts-ignore
                        texture.setWraps = (uWrap: any, vWrap: any) => {
                            if (!texture.source || !texture.source.style) return;

                            const mapWrap = (wrap: any) => {
                                if (wrap === 1 || wrap === 'repeat') return 'repeat';
                                if (wrap === 2 || wrap === 'mirrored-repeat') return 'mirror-repeat';
                                return 'clamp-to-edge';
                            };

                            texture.source.style.addressModeU = mapWrap(uWrap);
                            texture.source.style.addressModeV = mapWrap(vWrap);
                        };
                    }

                    // Polyfill baseTexture and autoGarbageCollect to satisfy legacy ViewContainer checks
                    // @ts-ignore
                    if (!texture.baseTexture) {
                        // @ts-ignore
                        // Pixi v8 removed baseTexture, but pixi-spine might still look for it. 
                        // Check if source exists, otherwise create dummy.
                        texture.baseTexture = texture.source || {};
                    }

                    // @ts-ignore
                    if (texture.baseTexture && typeof texture.baseTexture.autoGarbageCollect === 'undefined') {
                        // @ts-ignore
                        texture.baseTexture.autoGarbageCollect = true;
                    }

                    // @ts-ignore - Ensure compatibility if types drift
                    page.setTexture(texture);
                });

                // C. Parse Skeleton using Robust Loader
                const atlasAttachmentLoader = new RobustAtlasAttachmentLoader(atlas);

                // Decode base64 binary skel
                const binaryString = atob(parsedData.skel);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                // Use SkeletonBinary for .skel (Spine 4.2 supported now!)
                // @ts-ignore
                const skeletonBinary = new SkeletonBinary(atlasAttachmentLoader);
                skeletonBinary.scale = 1;

                const skeletonData = skeletonBinary.readSkeletonData(bytes);
                // No need for 'as any' anymore, versions should match
                const spine = new Spine(skeletonData);

                // FORCE SETUP POSE
                // FORCE SETUP POSE
                spine.autoUpdate = false; // Disable first to avoid warning
                // @ts-ignore
                if (spine.skeleton) {
                    // @ts-ignore
                    spine.skeleton.setToSetupPose();
                }
                spine.update(0);

                // --- SKIN SELECTION LOGIC ---
                // @ts-ignore
                if (spine.skeleton && spine.skeleton.data && spine.skeleton.data.skins) {
                    // @ts-ignore
                    const skins = spine.skeleton.data.skins;
                    console.log("SpinePlayer: Available Skins:", skins.map((s: any) => s.name));

                    if (skins.length > 0) {
                        // Default to first non-default skin if available, otherwise just use the first one
                        // @ts-ignore
                        let targetSkin = skins.find((s: any) => s.name !== 'default') || skins[0];

                        console.log(`SpinePlayer: Auto-selecting skin: '${targetSkin.name}'`);
                        // @ts-ignore
                        spine.skeleton.setSkin(targetSkin);
                        // @ts-ignore
                        spine.skeleton.setSlotsToSetupPose();
                    }
                }

                // Force Visibility Properties & Alpha Mode
                spine.tint = 0xffffff;
                spine.alpha = 1;
                // @ts-ignore
                if (texture && texture.source) {
                    // Ensure PMA is set to what default Spine expects (usually true)
                    console.log(`SpinePlayer: Texture AlphaMode BEFORE: ${(texture.source as any).alphaMode}`);

                    // PixiJS v8 uses 'premultiply-alpha-on-upload' (or 'premultiplied-alpha' in some versions, sticking to v8 docs)
                    // We actually just want it to match Spine's expectation. Spine usually exports with PMA.

                    // @ts-ignore 
                    texture.source.alphaMode = 'no-premultiply-alpha';
                    // @ts-ignore
                    texture.source.update();

                    console.log(`SpinePlayer: Texture AlphaMode AFTER: ${(texture.source as any).alphaMode}`);
                }

                // CONTAINER WRAPPER
                const container = new Container();
                app.stage.addChild(container);
                container.addChild(spine);

                // Calculate Visual Bounds
                const bounds = spine.getBounds();
                console.log(`SpinePlayer [${animationName}]: Raw Bounds`, bounds);

                // Calculate visual center relative to Spine origin
                const centerX = bounds.x + bounds.width / 2;
                const centerY = bounds.y + bounds.height / 2;

                // Center Spine in Container
                spine.x = -centerX;
                spine.y = -centerY;

                // Center Container in Canvas
                container.x = width / 2;
                container.y = height / 2;

                // Calculate Scale (Fit 90%)
                const targetWidth = width * 0.9;
                const targetHeight = height * 0.9;
                let scaleX = 1;
                let scaleY = 1;

                if (bounds.width > 0 && bounds.height > 0) {
                    scaleX = targetWidth / bounds.width;
                    scaleY = targetHeight / bounds.height;
                } else if (skeletonData.width > 0 && skeletonData.height > 0) {
                    scaleX = targetWidth / skeletonData.width;
                    scaleY = targetHeight / skeletonData.height;
                }

                const scale = Math.min(scaleX, scaleY);
                console.log(`SpinePlayer: Applied Scale: ${scale}`);

                if (scale > 0 && isFinite(scale)) {
                    container.scale.set(scale);
                } else {
                    container.scale.set(0.1);
                }

                // --- VISUAL DEBUGGING ---
                // Draw a box around the viewable area and the object bounds
                const debugG = new Graphics();

                // Blue Border (Canvas)
                debugG.rect(0, 0, width, height);
                debugG.stroke({ width: 2, color: 0x0000ff }); // Blue

                // Red Crosshair (Center)
                debugG.moveTo(width / 2 - 10, height / 2);
                debugG.lineTo(width / 2 + 10, height / 2);
                debugG.moveTo(width / 2, height / 2 - 10);
                debugG.lineTo(width / 2, height / 2 + 10);
                debugG.stroke({ width: 2, color: 0xff0000 }); // Red

                // Green Box (Object Bounds - Screen Space)
                const boxW = bounds.width * scale;
                const boxH = bounds.height * scale;
                const boxX = (width - boxW) / 2;
                const boxY = (height - boxH) / 2;
                debugG.rect(boxX, boxY, boxW, boxH);
                debugG.stroke({ width: 2, color: 0x00ff00 }); // Green

                app.stage.addChild(debugG);

                // --- TEXTURE DEBUGGER REMOVED (Confusing usage) --- 
                // Texture is proven to load. Focus on invisibility now.

                // --- SLOT DEBUGGER ---
                // @ts-ignore
                if (spine.skeleton && spine.skeleton.slots) {
                    // @ts-ignore
                    const visibleSlots = spine.skeleton.slots.filter((s: any) => s.attachment);
                    console.log(`SpinePlayer: Visible Slots (${visibleSlots.length}):`, visibleSlots.map((s: any) => s.data.name + '->' + (s.attachment ? s.attachment.name : 'null')));

                    // GEOMETRY CHECK
                    let totalVertices = 0;
                    // @ts-ignore
                    visibleSlots.forEach(slot => {
                        if (slot.attachment && slot.attachment.worldVerticesLength) {
                            totalVertices += slot.attachment.worldVerticesLength;
                        }
                    });
                    console.log(`SpinePlayer: Total Renderable Vertices: ${totalVertices}`);
                    if (totalVertices === 0 && visibleSlots.length > 0) {
                        console.error("SpinePlayer: Slots have attachments but NO VERTICES. This implies Atlas parsing failure or empty regions.");
                    }

                    // --- VERTEX DEBUGGER (Draw dots at vertices) ---
                    debugG.clear(); // Clear previous debugs (border/crosshair) to focus on mesh
                    // Re-draw border
                    debugG.rect(0, 0, width, height).stroke({ width: 2, color: 0x0000ff });

                    // @ts-ignore
                    visibleSlots.forEach(slot => {
                        if (slot.attachment && (slot.attachment.worldVerticesLength > 0 || (slot.attachment.vertices && slot.attachment.vertices.length > 0))) {
                            const attachment = slot.attachment;
                            // We need to compute world vertices manually to verify positions
                            // This mimics what FixedSpine does internally
                            let vertices: number[] = [];
                            try {
                                // Check if it's region or mesh
                                if (attachment.worldVerticesLength) {
                                    vertices = new Array(attachment.worldVerticesLength).fill(0);
                                    attachment.computeWorldVertices(slot, vertices, 0, 2);
                                } else if (attachment.vertices) {
                                    // Fallback for simple regions if API differs
                                    vertices = new Array(8).fill(0);
                                    attachment.computeWorldVertices(slot, vertices, 0, 2);
                                }

                                // DRAW DOTS
                                for (let i = 0; i < vertices.length; i += 2) {
                                    const vx = vertices[i];
                                    const vy = vertices[i + 1];
                                    // Transform by container scale/position to match screen space
                                    // Actually, debugG is in canvas space, and container is centered.
                                    // We need to simulate the container transform or just add debugG to container?
                                    // Simpler: Draw debugG INSIDE container.

                                    // For now, just log the first few to check NaN
                                    if (i < 4) console.log(`SpinePlayer: Vtx[${slot.data.name}]: ${vx.toFixed(2)}, ${vy.toFixed(2)}`);
                                }
                            } catch (e) {
                                // ignore
                            }
                        }
                    });
                }
                // ------------------------

                spineRef.current = spine; // CORRECTED REF

                // 5. Play Animation
                if (animationName) {
                    try {
                        // @ts-ignore
                        (spine as any).state.setAnimation(0, animationName, loop);
                    } catch (animError) {
                        console.warn(`Animation '${animationName}' not found, playing first available.`);
                        const firstAnim = skeletonData.animations[0];
                        if (firstAnim) {
                            // @ts-ignore
                            (spine as any).state.setAnimation(0, firstAnim.name, loop);
                        }
                    }
                }

                // Re-enable autoUpdate if playing
                spine.autoUpdate = isPlaying;

            } catch (err: any) {
                console.error("Spine Render Error:", err, err.stack);
                setError(err.message || "Render Error");
            }
        };

        initPixi();

        return () => {
            if (appRef.current) {
                appRef.current.destroy({ removeView: true }, { children: true, texture: true, textureSource: true });
                appRef.current = null;
            }
        };
    }, [spineData, width, height, animationName, loop]);

    // Handle Play/Stop logic
    useEffect(() => {
        if (!spineRef.current) return;

        try {
            // Access state via 'any' cast because FixedSpine definitions might be partial
            const state = (spineRef.current as any).state;
            if (state) {
                state.timeScale = isPlaying ? 1 : 0;
            }
        } catch (e) {
            console.error("SpinePlayer: Failed to toggle playback", e);
        }
    }, [isPlaying]);

    if (error) {
        return (
            <div
                className={`flex items-center justify-center bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center ${className}`}
                style={{ width, height }}
            >
                <span className="text-2xl mb-2">⚠️</span>
                <p className="text-red-400 text-sm font-medium">{error}</p>
                <p className="text-xs text-red-300 mt-2 opacity-75">Check console for fuzzy match details</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden rounded-lg bg-black/40 ${className}`}
            style={{ width, height }}
        />
    );
};

export default SpinePlayer;
