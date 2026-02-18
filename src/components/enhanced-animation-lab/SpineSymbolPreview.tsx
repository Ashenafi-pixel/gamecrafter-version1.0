import { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import type { SymbolSpineAsset } from '../../types';

export interface SpineSymbolPreviewProps {
  asset: SymbolSpineAsset;
  width: number;
  height: number;
  /** When provided, parent can call .current?.() to play win animation once. */
  playWinRef?: React.MutableRefObject<(() => void) | null>;
  /** Start with idle animation (default true). */
  idle?: boolean;
}

const uniqueId = () => `spine_preview_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

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
    const id = uniqueId();
    const skelId = `spine_preview_skel_${id}`;
    const atlasId = `spine_preview_atlas_${id}`;
    const texId = `spine_preview_tex_${id}`;

    (async () => {
      try {
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

        PIXI.Assets.add({ alias: texId, src: asset.textureUrl, loadParser: 'loadTextures' });
        const loadedTex = (await PIXI.Assets.load(texId)) as PIXI.Texture;
        const textureSource = loadedTex?.source ?? null;
        PIXI.Assets.add({
          alias: atlasId,
          src: asset.atlasUrl,
          loadParser: 'spineTextureAtlasLoader',
          data: {
            images: textureSource ? { [asset.textureName]: textureSource } : { [asset.textureName]: asset.textureUrl },
          },
        });
        PIXI.Assets.add({ alias: skelId, src: asset.skelUrl, loadParser: 'spineSkeletonLoader' });
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

        const ticker = (t: { deltaTime: number }) => {
          if (spineRef.current && !(spineRef.current as any).destroyed) {
            spineRef.current.update(t.deltaTime / 60);
          }
        };
        app.ticker.add(ticker);

        return () => {
          app.ticker.remove(ticker);
        };
      } catch (e) {
        console.error('[SpineSymbolPreview] Load failed:', e);
      }
    })();

    return () => {
      cancelled = true;
      const app = appRef.current;
      if (app?.canvas?.parentNode) app.canvas.parentNode.removeChild(app.canvas);
      if (spineRef.current) {
        spineRef.current.destroy({ children: true });
        spineRef.current = null;
      }
      appRef.current = null;
      const ids = idsRef.current;
      if (ids) {
        void PIXI.Assets.unload(ids.skel).catch(() => {});
        void PIXI.Assets.unload(ids.atlas).catch(() => {});
        void PIXI.Assets.unload(ids.texture).catch(() => {});
        idsRef.current = null;
      }
      if (app) app.destroy(true);
    };
  }, [asset?.atlasUrl, asset?.skelUrl, asset?.textureUrl, asset?.textureName, width, height, idle]);

  return <div ref={containerRef} className="spine-symbol-preview bg-gray-100 rounded overflow-hidden flex items-center justify-center" style={{ width, height, minWidth: width, minHeight: height }} />;
}

export default SpineSymbolPreview;
