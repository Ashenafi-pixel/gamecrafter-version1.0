import { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import type { SymbolSpineAsset } from '../../types';

export interface SpineSymbolPreviewProps {
  asset: SymbolSpineAsset;
  width: number;
  height: number;
  playWinRef?: React.MutableRefObject<(() => void) | null>;
  idle?: boolean;
}

const uniqueId = () => `spine_preview_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/** Clone blob URLs so we get separate PixiJS Assets cache entries. */
async function cloneAssetUrls(asset: SymbolSpineAsset): Promise<{ atlasUrl: string; skelUrl: string; textureUrl: string }> {
  const [atlasBlob, skelBlob, texBlob] = await Promise.all([
    fetch(asset.atlasUrl).then((r) => r.blob()),
    fetch(asset.skelUrl).then((r) => r.blob()),
    fetch(asset.textureUrl).then((r) => r.blob()),
  ]);
  return {
    atlasUrl: URL.createObjectURL(atlasBlob),
    skelUrl: URL.createObjectURL(skelBlob),
    textureUrl: URL.createObjectURL(texBlob),
  };
}

function scaleSpineToFit(spine: Spine, pixelSize: number) {
  spine.update(0);
  const b = spine.bounds as { width?: number; height?: number; maxX?: number; minX?: number; maxY?: number; minY?: number };
  const minX = b?.minX ?? 0;
  const minY = b?.minY ?? 0;
  const maxX = b?.maxX ?? minX;
  const maxY = b?.maxY ?? minY;
  const w = (b?.width ?? (maxX - minX)) || 0;
  const h = (b?.height ?? (maxY - minY)) || 0;
  const maxDim = Math.max(w, h, 1);
  const scale = maxDim > 0 ? pixelSize / maxDim : pixelSize / 100;
  spine.scale.set(scale);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  spine.x = pixelSize / 2 - scale * centerX;
  spine.y = pixelSize / 2 - scale * centerY;
}

export function SpineSymbolPreview({ asset, width, height, playWinRef, idle = true }: SpineSymbolPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spineRef = useRef<Spine | null>(null);
  const idsRef = useRef<{ skel: string; atlas: string; texture: string } | null>(null);
  const clonedUrlsRef = useRef<{ atlasUrl: string; skelUrl: string; textureUrl: string } | null>(null);
  // Guard flag: set to false the instant cleanup begins so the ticker callback exits immediately.
  const isAliveRef = useRef(false);

  const playWin = useCallback(() => {
    const spine = spineRef.current;
    if (!spine?.skeleton?.data?.animations?.length) return;
    const anims = spine.skeleton.data.animations;
    const winNames = ['win', 'celebrate', 'action', 'victory', 'happy', 'cheer'];
    const winAnim = winNames.find((n) => anims.some((a: { name: string }) => a.name === n));
    const winName = winAnim || anims[0].name;
    const idleName = anims.find((a: { name: string }) => a.name === 'idle')?.name ?? anims[0].name;
    spine.state?.setAnimation(0, winName, false);
    const entry = spine.state?.getCurrent(0);
    if (entry) {
      entry.listener = {
        complete: () => {
          spine.state?.setAnimation(0, idleName, true);
        },
      };
    }
  }, []);

  useEffect(() => {
    if (playWinRef) playWinRef.current = playWin;
    return () => {
      if (playWinRef) playWinRef.current = null;
    };
  }, [playWinRef, playWin]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !asset?.atlasUrl || !asset.skelUrl || !asset.textureUrl || !asset.textureName) return;

    let cancelled = false;
    isAliveRef.current = true;

    const id = uniqueId();
    const skelId = `spine_preview_skel_${id}`;
    const atlasId = `spine_preview_atlas_${id}`;
    const texId = `spine_preview_tex_${id}`;

    (async () => {
      try {
        const cloned = await cloneAssetUrls(asset);
        if (cancelled) {
          URL.revokeObjectURL(cloned.atlasUrl);
          URL.revokeObjectURL(cloned.skelUrl);
          URL.revokeObjectURL(cloned.textureUrl);
          return;
        }
        clonedUrlsRef.current = cloned;

        const app = new PIXI.Application();
        await app.init({
          width,
          height,
          backgroundAlpha: 0,
          antialias: true,
          resolution: Math.min(2, window.devicePixelRatio || 1),
        });
        if (cancelled) {
          app.destroy(true);
          return;
        }
        appRef.current = app;
        container.appendChild(app.canvas as HTMLCanvasElement);
        (app.canvas as HTMLCanvasElement).style.display = 'block';
        (app.canvas as HTMLCanvasElement).style.width = '100%';
        (app.canvas as HTMLCanvasElement).style.height = '100%';

        PIXI.Assets.add({ alias: texId, src: cloned.textureUrl, parser: 'loadTextures' });
        const loadedTex = (await PIXI.Assets.load(texId)) as PIXI.Texture;
        const textureSource = loadedTex?.source ?? null;
        PIXI.Assets.add({
          alias: atlasId,
          src: cloned.atlasUrl,
          parser: 'spineTextureAtlasLoader',
          data: {
            images: textureSource ? { [asset.textureName]: textureSource } : { [asset.textureName]: cloned.textureUrl },
          },
        });
        PIXI.Assets.add({ alias: skelId, src: cloned.skelUrl, parser: 'spineSkeletonLoader' });
        await PIXI.Assets.load([skelId, atlasId]);
        if (cancelled) return;

        const spine = Spine.from({ skeleton: skelId, atlas: atlasId });
        spineRef.current = spine;
        idsRef.current = { skel: skelId, atlas: atlasId, texture: texId };
        const size = Math.min(width, height);
        scaleSpineToFit(spine, size);
        app.stage.addChild(spine);

        const anims = spine.skeleton?.data?.animations;
        if (anims?.length && idle) {
          const name = anims.find((a: { name: string }) => a.name === 'idle')?.name ?? anims[0].name;
          spine.state?.setAnimation(0, name, true);
        }

        // Ticker: guard with isAliveRef so it exits immediately on teardown,
        // before the batcher ever tries to process the Spine's geometry.
        const ticker = (t: { deltaTime: number }) => {
          if (!isAliveRef.current) return;
          const s = spineRef.current;
          if (s && !(s as any).destroyed) {
            s.update(t.deltaTime / 60);
          }
        };
        app.ticker.add(ticker);

        // Return inner cleanup so React ef can remove the ticker if effect re-runs.
        return () => {
          app.ticker.remove(ticker);
        };
      } catch (e) {
        console.error('[SpineSymbolPreview] Load failed:', e);
      }
    })();

    return () => {
      cancelled = true;

      // ── Step 1: Kill the isAlive flag FIRST.
      // The ticker callback checks this at its very first line, so it will
      // exit before calling spine.update() or anything that touches geometry.
      isAliveRef.current = false;

      const app = appRef.current;
      const spine = spineRef.current;
      const ids = idsRef.current;
      const clonedUrls = clonedUrlsRef.current;

      // Clear refs immediately so nothing else can accidentally use them.
      appRef.current = null;
      spineRef.current = null;
      idsRef.current = null;
      clonedUrlsRef.current = null;

      // ── Step 2: Hide the spine immediately.
      // PixiJS BatcherPipe skips invisible objects entirely — even if a render
      // pass has already started, it will skip this node before touching geometry.
      if (spine && !(spine as any).destroyed) {
        spine.visible = false;
      }

      // ── Step 3: Detach from stage synchronously.
      // Removes the node from the scene graph so the current (or next) render
      // pass won't enumerate it at all.
      if (spine?.parent) {
        spine.parent.removeChild(spine);
      }

      // ── Step 4: Stop the ticker so no new frames start.
      if (app) {
        app.ticker.stop();
        // Detach canvas from DOM immediately.
        if (app.canvas?.parentNode) {
          app.canvas.parentNode.removeChild(app.canvas);
        }
      }

      // ── Step 5: Double-rAF — wait for any in-flight GPU commands to flush,
      // then safely destroy everything.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            if (spine && !(spine as any).destroyed) spine.destroy({ children: true });
            if (ids) {
              void PIXI.Assets.unload(ids.skel).catch(() => { });
              void PIXI.Assets.unload(ids.atlas).catch(() => { });
              void PIXI.Assets.unload(ids.texture).catch(() => { });
            }
            if (clonedUrls) {
              URL.revokeObjectURL(clonedUrls.atlasUrl);
              URL.revokeObjectURL(clonedUrls.skelUrl);
              URL.revokeObjectURL(clonedUrls.textureUrl);
            }
            if (app) {
              try { app.destroy(true); } catch (_) { /* already destroyed */ }
            }
          } catch (e) {
            console.warn('[SpineSymbolPreview] Teardown error (non-fatal):', e);
          }
        });
      });
    };
  }, [asset?.atlasUrl, asset?.skelUrl, asset?.textureUrl, asset?.textureName, width, height, idle]);

  return (
    <div
      ref={containerRef}
      className="spine-symbol-preview bg-gray-100 rounded overflow-hidden flex items-center justify-center"
      style={{ width, height, minWidth: width, minHeight: height, isolation: 'isolate' }}
    />
  );
}

export default SpineSymbolPreview;
