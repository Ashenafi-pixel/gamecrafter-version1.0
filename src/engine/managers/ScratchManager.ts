import * as PIXI from 'pixi.js';

export class ScratchManager {
    private container: PIXI.Container;
    private brush: PIXI.Graphics;
    private maskTexture: PIXI.RenderTexture | null = null;
    private maskSprite: PIXI.Sprite | null = null;
    private overlaySprite: PIXI.Sprite | null = null;
    private isScratching: boolean = false;
    private isDragging: boolean = false;
    private brushSize: number = 40;
    private totalPixels: number = 0;
    private scratchedPixels: number = 0;
    private revealThreshold: number = 0.5; // 50% revealed = auto-win
    private app: PIXI.Application | null = null;

    constructor() {
        this.container = new PIXI.Container();
        this.brush = new PIXI.Graphics();
        this.brush.beginFill(0xFFFFFF, 1);
        this.brush.drawCircle(0, 0, this.brushSize);
        this.brush.endFill();
        console.log('🧹 ScratchManager initialized');
    }

    initialize(stage: PIXI.Container, app?: PIXI.Application | null): void {
        stage.addChild(this.container);
        if (app) {
            this.app = app;
        } else {
            console.warn('⚠️ ScratchManager: No PIXI Application provided. Scratching may not work.');
        }
    }

    /**
     * Sets up a scratch card layer
     * @param overlayUrl The image to scratch OFF
     * @param width Width of the scratch area
     * @param height Height of the scratch area
     */
    async createScratchLayer(overlayUrl: string, width: number, height: number): Promise<void> {
        this.reset();
        this.totalPixels = width * height;

        // 1. Create the overlay sprite (the top layer image)
        const texture = await PIXI.Texture.fromURL(overlayUrl);

        // 2. Create the mask render texture
        this.maskTexture = PIXI.RenderTexture.create({ width, height });

        // 3. Create a sprite for the mask
        this.maskSprite = new PIXI.Sprite(this.maskTexture);

        // 4. Create the overlay sprite and apply the mask
        this.overlaySprite = new PIXI.Sprite(texture);
        this.overlaySprite.width = width;
        this.overlaySprite.height = height;
        this.overlaySprite.mask = this.maskSprite;

        // 5. Add to container
        // Note: For the mask to work, it often needs to be in the display list or rendered properly.
        this.container.addChild(this.overlaySprite);
        this.container.addChild(this.maskSprite);

        // 6. Initialize the mask to be visible (White)
        // Since we want the overlay to be visible initially, the mask must be opaque.
        // We draw a full white rectangle onto the mask texture.
        if (this.app) {
            const bg = new PIXI.Graphics();
            bg.beginFill(0xFFFFFF);
            bg.drawRect(0, 0, width, height);
            bg.endFill();
            this.app.renderer.render(bg, { renderTexture: this.maskTexture });
        }

        this.enableInteractions(true);
    }

    enableInteractions(enable: boolean): void {
        if (!this.overlaySprite) return;

        this.overlaySprite.eventMode = enable ? 'static' : 'none';
        this.overlaySprite.cursor = enable ? 'url("assets/coin_cursor.png"), auto' : 'default';

        if (enable) {
            this.overlaySprite.on('pointerdown', this.onPointerDown, this);
            this.overlaySprite.on('pointermove', this.onPointerMove, this);
            this.overlaySprite.on('pointerup', this.onPointerUp, this);
            this.overlaySprite.on('pointerupoutside', this.onPointerUp, this);
        } else {
            this.overlaySprite.off('pointerdown', this.onPointerDown, this);
            this.overlaySprite.off('pointermove', this.onPointerMove, this);
            this.overlaySprite.off('pointerup', this.onPointerUp, this);
            this.overlaySprite.off('pointerupoutside', this.onPointerUp, this);
        }

        this.isScratching = enable;
    }

    private onPointerDown(event: PIXI.FederatedPointerEvent): void {
        this.isDragging = true;
        this.scratch(event.global);
    }

    private onPointerMove(event: PIXI.FederatedPointerEvent): void {
        if (this.isDragging && this.isScratching) {
            this.scratch(event.global);
        }
    }

    private onPointerUp(): void {
        this.isDragging = false;
        this.checkRevealProgress();
    }

    private scratch(position: PIXI.Point): void {
        if (!this.maskSprite || !this.brush || !this.app || !this.maskTexture) return;

        // Convert global position to local container space
        const localPos = this.container.toLocal(position);

        // Update brush position
        this.brush.position.set(localPos.x, localPos.y);

        // To ERASE, we want to draw TRANSPARENT/BLACK or use DST_OUT blend mode.
        // If the mask being White = Visible, then drawing Transparent/Black should hide it?
        // No, standard drawing simply overwrites color. 
        // We need to use BlendMode to remove alpha.

        // In PIXI, BlendMode.ERASE or DST_OUT is what we want.
        this.brush.blendMode = PIXI.BLEND_MODES.ERASE;

        this.app.renderer.render(this.brush, {
            renderTexture: this.maskTexture,
            clear: false,
            transform: null,
            skipUpdateTransform: false
        });

        // Reset blendMode if needed (good practice if reused in other contexts, 
        // but here brush is dedicated)

        // Fake pixel counting since reading pixels is expensive
        this.scratchedPixels += (this.brushSize * this.brushSize);
    }

    private checkRevealProgress(): void {
        if (this.totalPixels === 0) return;
        const percentage = this.scratchedPixels / this.totalPixels;
        // Adjust threshold estimate since circles overlap
        if (percentage > this.revealThreshold) {
            this.revealAll();
        }
    }

    revealAll(): void {
        if (!this.overlaySprite) return;
        this.overlaySprite.visible = false;
        this.overlaySprite.mask = null; // Detach mask
        console.log('✨ Scratch card fully revealed!');
    }

    reset(): void {
        this.container.removeChildren();
        this.overlaySprite = null;
        this.maskSprite = null;
        this.scratchedPixels = 0;
        this.maskTexture = null;
    }
}
