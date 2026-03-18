// sprites.js - Character rendering using original PNG sprites with walk animation
const SPRITE_SCALE = 1.3;

const Direction = {
    DOWN: 0,
    LEFT: 1,
    RIGHT: 2,
    UP: 3
};

class Sprite {
    constructor(options) {
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.direction = options.direction || Direction.DOWN;
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 140;
        this.isMoving = false;
        this.name = options.name || '';
        this.image = options.image || null;
    }

    update(deltaTime) {
        if (this.isMoving) {
            this.frameTimer += deltaTime;
            if (this.frameTimer >= this.frameInterval) {
                this.frameTimer = 0;
                this.frame = (this.frame + 1) % 4;
            }
        } else {
            this.frame = 0;
            this.frameTimer = 0;
        }
    }

    draw(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const s = TILE_SIZE;

        if (this.image && this.image.complete && this.image.naturalWidth > 0) {
            const scaledW = Math.round(s * SPRITE_SCALE);
            const scaledH = Math.round(scaledW * (this.image.naturalHeight / this.image.naturalWidth));

            // Walking animation: bob up/down + lean
            let bobY = 0;
            let lean = 0;
            if (this.isMoving) {
                bobY = Math.sin(this.frame * Math.PI / 2) * 3;
                lean = Math.sin(this.frame * Math.PI / 2) * 0.04;
            }

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.ellipse(screenX + s / 2, screenY + s + 2, scaledW / 3, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            const drawX = screenX + s / 2 - scaledW / 2;
            const drawY = screenY + s - scaledH - bobY;

            ctx.save();

            // Flip for direction
            if (this.direction === Direction.LEFT) {
                ctx.translate(screenX + s, 0);
                ctx.scale(-1, 1);
                // Lean animation
                if (lean !== 0) {
                    ctx.translate(s / 2, screenY + s);
                    ctx.rotate(lean);
                    ctx.translate(-s / 2, -(screenY + s));
                }
                ctx.drawImage(this.image, s / 2 - scaledW / 2, drawY, scaledW, scaledH);
            } else if (this.direction === Direction.RIGHT) {
                // Normal orientation with lean
                if (lean !== 0) {
                    ctx.translate(screenX + s / 2, screenY + s);
                    ctx.rotate(-lean);
                    ctx.translate(-(screenX + s / 2), -(screenY + s));
                }
                ctx.drawImage(this.image, drawX, drawY, scaledW, scaledH);
            } else if (this.direction === Direction.UP) {
                // Back view: darken slightly
                ctx.globalAlpha = 0.85;
                if (lean !== 0) {
                    ctx.translate(screenX + s / 2, screenY + s);
                    ctx.rotate(lean);
                    ctx.translate(-(screenX + s / 2), -(screenY + s));
                }
                ctx.drawImage(this.image, drawX, drawY, scaledW, scaledH);
                ctx.globalAlpha = 1;
            } else {
                // Down (front facing) - default
                if (lean !== 0) {
                    ctx.translate(screenX + s / 2, screenY + s);
                    ctx.rotate(lean);
                    ctx.translate(-(screenX + s / 2), -(screenY + s));
                }
                ctx.drawImage(this.image, drawX, drawY, scaledW, scaledH);
            }

            ctx.restore();
            return;
        }

        // Fallback colored square
        ctx.fillStyle = '#FF6B9D';
        ctx.fillRect(screenX + 8, screenY + 8, s - 16, s - 16);
    }

    drawNameTag(ctx, cameraX, cameraY) {
        if (!this.name) return;
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const s = TILE_SIZE;
        const scaledW = Math.round(s * SPRITE_SCALE);
        const scaledH = Math.round(scaledW * (this.image ? (this.image.naturalHeight / this.image.naturalWidth) : 1));
        const tagY = screenY + s - scaledH - 18;

        ctx.font = 'bold 11px "Courier New"';
        ctx.textAlign = 'center';
        const textWidth = ctx.measureText(this.name).width;

        const tagX = screenX + s / 2 - textWidth / 2 - 5;
        const tagW = textWidth + 10;
        const tagH = 16;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, tagW, tagH, 4);
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.fillText(this.name, screenX + s / 2, tagY + 12);
        ctx.textAlign = 'left';
    }
}
