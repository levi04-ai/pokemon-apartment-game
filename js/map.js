// map.js - Map and collision
const Zone = { OUTSIDE: 'outside', APARTMENT: 'apartment' };

const MAP_COLS = 21, MAP_ROWS = 21;
const INDOOR_COLS = 44, INDOOR_ROWS = 40;

const T = { GRASS: 0, PATH: 1, FENCE: 2, WALL: 3, FLOOR: 4, DOOR_INT: 5 };
const SOLID_TILES = [T.FENCE, T.WALL];

function generateOutdoorMap() {
    const tpl = [
        'SSSSSSSSSSSSSSSSSSSSS','SSSSSSSSSSSSSSSSSSSSS',
        'SSGGSSSSSSSSSSSSSGGSS','SSGGSSSSSSSSSSSSSGGSS','SSGGSSSSSSSSSSSSSGGSS',
        'SSGGSSSBBBBBBBSSSGGSS','SSGGSSSBBBBBBBSSSGGSS','SSGGSSSBBBBBBBSSSGGSS','SSGGSSSBBBBBBBSSSGGSS',
        'SSGGSSSBBBDBBBSSSGGSS',
        'SSGGGGGGGGGGGGGGGGGSS','SSGGGGGGGGGGGGGGGGGSS',
        'PPPPPPPPPPPPPPPPPPPPP','PPPPPPPPPPPPPPPPPPPPP',
        'SSGGGGGGGGGGGGGGGGGSS','SSGGGGGGGGGGGGGGGGGSS',
        'SSSSSSSSSGGGSSSSSSSSS','SSSSSSSSSGGGSSSSSSSSS','SSSSSSSSSGGGSSSSSSSSS',
        'SSSSSSSSSSSSSSSSSSSSS','SSSSSSSSSSSSSSSSSSSSS',
    ];
    const map = [];
    for (let r = 0; r < MAP_ROWS; r++) {
        map[r] = [];
        const line = tpl[r] || 'SSSSSSSSSSSSSSSSSSSSS';
        for (let c = 0; c < MAP_COLS; c++) {
            const ch = c < line.length ? line[c] : 'S';
            map[r][c] = (ch==='S'||ch==='B') ? T.FENCE : (ch==='P' ? T.PATH : (ch==='D' ? T.PATH : T.GRASS));
        }
    }
    return map;
}

function generateApartmentMap() {
    // 44x40 - generated from red.png walkable overlay
    const tpl = [
        'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWFFFFFFFFFFWW',
        'WWWWWWWWWWWWWWFFFFFFWWWWWWWWWWWWFWWWFFWWWFWW',
        'WWWWWWWWWWWWWWFFFFFFFFWWWWWWWWWWFWWWFFWWWFWW',
        'WWWWWWWWWWWWWWFFFFFFFFWWWWWWWWWWFWWWWWWWFFWW',
        'WWWWWWWWWWWWWWWWFFFFFFFFFFFFFWWWFFFWWWWWFFWW',
        'WWWWWWWWWWWWWWWWFFFFFFFFFFFFFWWWFFFWWWWWFFWW',
        'WWWWWWWWWWWWWWWWFFFFFFFFFFFFFFFWFFWWWWWWFFWW',
        'WWWWFFFFFFFFFWWFFFFFFFFWWWWWFFFWFFWWWWWWFFWW',
        'WWWWFFFFFFFFFWFFFFFFFFFWWWWWFFFWFFWWWWWWFFWW',
        'WWWWWWWWWFFFFFFFFFFFFFFWWWWWFFFFFFFFFFFFFFWW',
        'WWWWWWWWWWFFFWFFFFFFFFFWWWWWWFFFFFFFFFFFFFWW',
        'WWWWWWWWWWWWWWWWWWFFFWWWWWWWWWWWWWFFFFFFFFWW',
        'WWWWWWWWWWWWWWWWWWFFFWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWFFFFWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWFFFFFFFFFFFFFWWWWWWWWFFWWWWWWWWWWWWW',
        'WWWWWWWWFFWWWWWWWWFFFWWFFWWWFFWWWWWWWWWWWWWW',
        'WWWWWWWWFFWWWWWWWWFFFWWFFFFFFFWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWFFFFFFFFFFFFFWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWFFFFFFFFFFFWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWFFFWFFFWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWFFFWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWFFFWWWWWWWFFFWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWFFFFFWWWWFFFFWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWFFFFFFFFFFFFFWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWFFFFFFWWWFFFFFFFFWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWFFFFFFWWWWFFFFFFFFFFFFFFWWWWWWWWWWWW',
        'WWWWWWWWWWFFFFWWWWFFWWWWWFFFWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWFFFFWWWWFFFWWWWFFFWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWFFFFWWWFFFWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWFFFFWWWFFFWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWFFFWWWWFFFFFFFWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWWWWWWWWWFFFFFFFWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
        'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ];
    const map = [];
    for (let r = 0; r < INDOOR_ROWS; r++) {
        map[r] = [];
        const line = tpl[r] || 'W'.repeat(INDOOR_COLS);
        for (let c = 0; c < INDOOR_COLS; c++) {
            const ch = c < line.length ? line[c] : 'W';
            map[r][c] = (ch==='W') ? T.WALL : (ch==='D' ? T.DOOR_INT : T.FLOOR);
        }
    }
    return map;
}

const GameMap = {
    currentZone: Zone.OUTSIDE,
    outdoorMap: null, apartmentMap: null,
    doorCol: 10, doorRow: 9,

    init() { this.outdoorMap = generateOutdoorMap(); this.apartmentMap = generateApartmentMap(); },
    getCurrentMap() { return this.currentZone === Zone.OUTSIDE ? this.outdoorMap : this.apartmentMap; },
    getMapSize() { return this.currentZone === Zone.OUTSIDE ? {cols:MAP_COLS,rows:MAP_ROWS} : {cols:INDOOR_COLS,rows:INDOOR_ROWS}; },

    getTile(c, r) {
        const map = this.getCurrentMap();
        if (r < 0 || r >= map.length || c < 0 || c >= map[0].length) return T.WALL;
        return map[r][c];
    },

    isSolid(c, r) {
        return SOLID_TILES.includes(this.getTile(c, r));
    },

    getRoomName(col, row) {
        if (this.currentZone !== Zone.APARTMENT) return '';
        if (row>=5&&row<=15&&col>=32&&col<=42) return 'מרפסת';
        if (row>=6&&row<=15&&col>=14&&col<=28) return 'סלון';
        if (row>=12&&row<=15&&col>=4&&col<=12) return 'מטבח';
        if (row>=19&&row<=23&&col>=8&&col<=10) return 'אמבטיה';
        if (row>=19&&row<=24&&col>=28&&col<=38) return 'חדר עבודה';
        if (row>=30&&row<=36&&col>=25&&col<=32) return 'חדר שינה';
        if (row>=26&&row<=32&&col>=8&&col<=11) return 'חדר רות';
        if (row>=33&&row<=37&&col>=18&&col<=22) return 'אמבטיה';
        if (row>=16&&row<=29&&col>=12&&col<=25) return 'מסדרון';
        return '';
    },

    draw(ctx, camX, camY, cw, ch) {
        const bgKey = this.currentZone === Zone.OUTSIDE ? 'outdoor_bg' : 'indoor_bg';
        const bgImg = Assets.get(bgKey);
        const size = this.getMapSize();
        const mapW = size.cols * TILE_SIZE, mapH = size.rows * TILE_SIZE;

        if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
            ctx.drawImage(bgImg, -camX, -camY, mapW, mapH);
        } else {
            ctx.fillStyle = this.currentZone === Zone.OUTSIDE ? '#7CC87A' : '#C8B898';
            ctx.fillRect(0, 0, cw, ch);
        }

        // Draw glowing effects for active puzzles
        if (this.currentZone === Zone.APARTMENT && typeof GameState !== 'undefined') {
            // Balcony glow: blue chairs (col 36, row 7)
            if (GameState.current === 'INDOOR_START') {
                this.drawGlow(ctx, camX, camY, 36, 7, 2, 2);
            }
            // Kitchen glow: coffee area (col 6, row 13)
            if (GameState.current === 'BALCONY_COMPLETE' || GameState.current === 'KITCHEN_ACTIVE') {
                this.drawGlow(ctx, camX, camY, 6, 13, 2, 2);
            }
            // Library glow: green bookshelf (col 23, row 12)
            if (GameState.current === 'KITCHEN_COMPLETE' || GameState.current === 'LIBRARY_ACTIVE') {
                this.drawGlow(ctx, camX, camY, 23, 12, 2, 2);
            }
            // Ruth's room glow (col 9, row 29)
            if (GameState.current === 'LIBRARY_COMPLETE' || GameState.current === 'RUTH_ROOM_ACTIVE') {
                this.drawGlow(ctx, camX, camY, 9, 29, 2, 2);
            }
            // Bedroom glow: next to bed (walkable area)
            if (GameState.current === 'RUTH_ROOM_COMPLETE' || GameState.current === 'BEDROOM_ACTIVE') {
                this.drawGlow(ctx, camX, camY, 27, 31, 2, 2);
            }
        }
    },

    drawGlow(ctx, camX, camY, col, row, w, h) {
        const cx = (col + w/2) * TILE_SIZE - camX;
        const cy = (row + h/2) * TILE_SIZE - camY;
        const baseR = Math.max(w, h) * TILE_SIZE * 0.8;
        const pulse = 0.5 + Math.sin(Date.now() / 400) * 0.4;
        const pulseR = baseR + Math.sin(Date.now() / 300) * 10;

        // Red glow
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR * 1.3);
        grad.addColorStop(0, `rgba(255, 50, 50, ${pulse * 0.5})`);
        grad.addColorStop(0.3, `rgba(255, 30, 30, ${pulse * 0.35})`);
        grad.addColorStop(0.6, `rgba(200, 20, 20, ${pulse * 0.15})`);
        grad.addColorStop(1, 'rgba(200, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Bright red center
        ctx.fillStyle = `rgba(255, 100, 100, ${pulse * 0.7})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 8 + Math.sin(Date.now()/200) * 4, 0, Math.PI * 2);
        ctx.fill();
    }
};
