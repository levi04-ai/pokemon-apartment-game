// sprites.js - Character rendering
const SPRITE_SCALE = 1.3;
const Direction = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 };

class Sprite {
    constructor(opts) {
        this.x = opts.x || 0;
        this.y = opts.y || 0;
        this.direction = opts.direction || Direction.DOWN;
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 140;
        this.isMoving = false;
        this.name = opts.name || '';
        this.image = opts.image || null;
    }

    update(dt) {
        if (this.isMoving) {
            this.frameTimer += dt;
            if (this.frameTimer >= this.frameInterval) { this.frameTimer = 0; this.frame = (this.frame + 1) % 4; }
        } else { this.frame = 0; this.frameTimer = 0; }
    }

    draw(ctx, camX, camY) {
        const sx = this.x - camX, sy = this.y - camY, s = TILE_SIZE;
        const sw = Math.round(s * SPRITE_SCALE);
        const sh = this.image ? Math.round(sw * (this.image.naturalHeight / this.image.naturalWidth)) : sw;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(sx + s/2, sy + s + 2, sw/3, 5, 0, 0, Math.PI*2);
        ctx.fill();

        if (this.image && this.image.complete && this.image.naturalWidth > 0) {
            let bobY = 0, lean = 0;
            if (this.isMoving) { bobY = Math.sin(this.frame * Math.PI/2) * 3; lean = Math.sin(this.frame * Math.PI/2) * 0.04; }
            const dx = sx + s/2 - sw/2, dy = sy + s - sh - bobY;

            ctx.save();
            if (this.direction === Direction.LEFT) {
                ctx.translate(sx + s, 0); ctx.scale(-1, 1);
                if (lean) { ctx.translate(s/2, sy+s); ctx.rotate(lean); ctx.translate(-s/2, -(sy+s)); }
                ctx.drawImage(this.image, s/2 - sw/2, dy, sw, sh);
            } else {
                if (this.direction === Direction.UP) ctx.globalAlpha = 0.85;
                if (lean) { ctx.translate(sx+s/2, sy+s); ctx.rotate(this.direction===Direction.RIGHT?-lean:lean); ctx.translate(-(sx+s/2), -(sy+s)); }
                ctx.drawImage(this.image, dx, dy, sw, sh);
                ctx.globalAlpha = 1;
            }
            ctx.restore();
        }
    }

    drawNameTag(ctx, camX, camY) {
        if (!this.name) return;
        const sx = this.x - camX, sy = this.y - camY, s = TILE_SIZE;
        const sw = Math.round(s * SPRITE_SCALE);
        const sh = this.image ? Math.round(sw * (this.image.naturalHeight / this.image.naturalWidth)) : sw;
        const tagY = sy + s - sh - 18;

        ctx.font = 'bold 11px "Press Start 2P", "Courier New", monospace';
        ctx.textAlign = 'center';
        const tw = ctx.measureText(this.name).width;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath(); ctx.roundRect(sx+s/2-tw/2-5, tagY, tw+10, 16, 4); ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.fillText(this.name, sx + s/2, tagY + 12);
        ctx.textAlign = 'left';
    }
}
