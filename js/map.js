// map.js - Map layout based on real apartment floor plan
const Zone = {
    OUTSIDE: 'outside',
    APARTMENT: 'apartment'
};

// Outdoor map - based on background image 1024x1024
// Image maps to 21x21 tiles (1024/48 ≈ 21)
const MAP_COLS = 21;
const MAP_ROWS = 21;

// Indoor apartment - accurate floor plan
// Apartment is large: 22 cols x 20 rows
// 30% bigger apartment
const INDOOR_COLS = 29;
const INDOOR_ROWS = 26;

// Tile types
const T = {
    GRASS: 0, GRASS2: 1, GRASS3: 2,
    PATH: 3, FENCE: 4, WATER: 5,
    FLOOR: 6, WALL: 7, DOOR_INT: 8,
    CARPET: 9, KITCHEN_FLOOR: 10, BATH_FLOOR: 11,
    BEDROOM_FLOOR: 12, WORK_FLOOR: 13,
    EXIT_MAT: 14, BALCONY: 15, HALL_FLOOR: 16,
    WALL_TOP: 17, BABY_FLOOR: 18
};

const SOLID_TILES = [T.WALL, T.WALL_TOP, T.WATER, T.FENCE];

// Room definitions for the apartment (based on floor plan)
// Layout: (looking at map, right=east, down=south)
// Top row: Entry(NE), Salon/Living(center), Balcony(E), Kitchen(W)
// Middle: Bathroom5(W), Hallway(center), Work room(E)
// Bottom: Room4/Rut(SW), Room3/Hall(center), Bedroom2(SE), Bathroom(S-center)

// Furniture items (NO TV, NO RADIO as per user request)
const FurnitureItems = {
    [Zone.APARTMENT]: [
        // === SALON (Living Room) - center top ===
        { type: 'sofa', col: 7, row: 5, w: 3, h: 1, solid: true, interaction: 'sofa' },
        { type: 'table', col: 8, row: 6, w: 1, h: 1, solid: true, interaction: 'table' },
        { type: 'plant', col: 5, row: 2, w: 1, h: 1, solid: true },
        { type: 'plant', col: 12, row: 2, w: 1, h: 1, solid: true },

        // === KITCHEN (top-left) ===
        { type: 'fridge', col: 1, row: 2, w: 1, h: 2, solid: true, interaction: 'fridge' },
        { type: 'stove', col: 2, row: 2, w: 1, h: 1, solid: true, interaction: 'stove' },
        { type: 'sink', col: 3, row: 2, w: 1, h: 1, solid: true },
        { type: 'cabinet', col: 4, row: 2, w: 1, h: 1, solid: true },
        { type: 'kitchen_table', col: 2, row: 5, w: 2, h: 1, solid: true, interaction: 'kitchen_table' },
        { type: 'stool', col: 2, row: 6, w: 1, h: 1, solid: true },
        { type: 'stool', col: 3, row: 6, w: 1, h: 1, solid: true },

        // === BALCONY (top-right) ===
        { type: 'plant', col: 16, row: 3, w: 1, h: 1, solid: true },
        { type: 'plant', col: 19, row: 3, w: 1, h: 1, solid: true },
        { type: 'balcony_chair', col: 17, row: 4, w: 1, h: 1, solid: true },
        { type: 'balcony_table', col: 18, row: 4, w: 1, h: 1, solid: true },

        // === WORK ROOM (middle-right) ===
        { type: 'computer', col: 15, row: 10, w: 1, h: 1, solid: true, interaction: 'computer' },
        { type: 'bookshelf', col: 17, row: 9, w: 1, h: 2, solid: true, interaction: 'bookshelf' },
        { type: 'chair', col: 15, row: 11, w: 1, h: 1, solid: true },

        // === BEDROOM (bottom-right) ===
        { type: 'bed', col: 15, row: 15, w: 2, h: 2, solid: true, interaction: 'bed' },
        { type: 'closet', col: 18, row: 14, w: 1, h: 2, solid: true, interaction: 'closet' },
        { type: 'nightstand', col: 14, row: 15, w: 1, h: 1, solid: true },

        // === BABY ROOM / Room 4 (bottom-left) ===
        { type: 'baby_bed', col: 2, row: 15, w: 2, h: 1, solid: true, interaction: 'baby_bed' },
        { type: 'cabinet', col: 1, row: 14, w: 1, h: 1, solid: true },
        { type: 'plant', col: 4, row: 14, w: 1, h: 1, solid: true },

        // === BATHROOM 5 (middle-left) ===
        { type: 'bathtub', col: 1, row: 9, w: 2, h: 1, solid: true },
        { type: 'toilet', col: 3, row: 10, w: 1, h: 1, solid: true },
        { type: 'bath_sink', col: 1, row: 10, w: 1, h: 1, solid: true },

        // === BATHROOM bottom ===
        { type: 'bathtub', col: 10, row: 17, w: 2, h: 1, solid: true },
        { type: 'toilet', col: 9, row: 18, w: 1, h: 1, solid: true },
        { type: 'bath_sink', col: 12, row: 18, w: 1, h: 1, solid: true },
    ]
};

function generateOutdoorMap() {
    // Collision map matching the background image
    // S=solid(trees/building), G=walkable grass, P=path/road, D=door position
    const template = [
        'SSSSSSSSSSSSSSSSSSSSS', // 0
        'SSSSSSSSSSSSSSSSSSSSS', // 1
        'SSGGSSSSSSSSSSSSSGGSS', // 2
        'SSGGSSSSSSSSSSSSSGGSS', // 3
        'SSGGSSSSSSSSSSSSSGGSS', // 4
        'SSGGSSSBBBBBBBSSSGGSS', // 5: building top
        'SSGGSSSBBBBBBBSSSGGSS', // 6
        'SSGGSSSBBBBBBBSSSGGSS', // 7
        'SSGGSSSBBBBBBBSSSGGSS', // 8
        'SSGGSSSBBBDBBBSSSGGSS', // 9: door at col 10
        'SSGGGGGGGGGGGGGGGGGSS', // 10: walkable in front
        'SSGGGGGGGGGGGGGGGGGSS', // 11: sidewalk
        'PPPPPPPPPPPPPPPPPPPPP', // 12: road
        'PPPPPPPPPPPPPPPPPPPPP', // 13: road
        'SSGGGGGGGGGGGGGGGGGSS', // 14: sidewalk
        'SSGGGGGGGGGGGGGGGGGSS', // 15
        'SSSSSSSSSGGGSSSSSSSSS', // 16
        'SSSSSSSSSGGGSSSSSSSSS', // 17
        'SSSSSSSSSGGGSSSSSSSSS', // 18
        'SSSSSSSSSSSSSSSSSSSSS', // 19
        'SSSSSSSSSSSSSSSSSSSSS', // 20
    ];

    const map = [];
    for (let row = 0; row < MAP_ROWS; row++) {
        map[row] = [];
        const line = template[row] || 'SSSSSSSSSSSSSSSSSSSSS';
        for (let col = 0; col < MAP_COLS; col++) {
            const ch = col < line.length ? line[col] : 'S';
            if (ch === 'S' || ch === 'B') map[row][col] = T.FENCE;
            else if (ch === 'P') map[row][col] = T.PATH;
            else if (ch === 'D') map[row][col] = T.PATH; // Door - walkable
            else map[row][col] = T.GRASS;
        }
    }
    return map;
}

function generateApartmentMap() {
    // Collision map matching the indoor background image exactly
    // W=wall/solid, F=floor(walkable), D=door(walkable)
    // Image layout (22 cols x 20 rows):
    // Top: entry(center-left), kitchen(left), salon(center), balcony(right)
    // Middle: bathroom(left), hallway(center), workroom(right)
    // Bottom: baby-room(left), hall(center), bedroom(right), bath2(center-bottom)
    // 29 cols x 26 rows (30% bigger than original 22x20)
    const indoorTemplate = [
        'WWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // 0
        'WWWWWWWWEFFFFFFFWWWFFFFFFFFWW', // 1: entry + salon + balcony
        'WWWWFFFFDFFFFFFFDWWFFFFFFFFWW', // 2: kitchen-door + salon + balcony-door
        'WWWWFFWWWFFFFFFFWWWFFFFFFFFWW', // 3: kitchen + salon + balcony
        'WWWWFFWWWFFFFFFFWWWWFFWWFFWWW', // 4: kitchen + salon + balcony
        'WWWWFFWWWFFFFFFFWWWWFFFFFFFFW', // 5: kitchen + salon + balcony
        'WWWWFFWWWFFFFFFFWWWWFFFFFFFFW', // 6: kitchen + salon + balcony
        'WWWWFFWWWFFFWFFFWWWWWWWWWWWWW', // 7: kitchen + salon
        'WWWWWWWWWDFFFFFWWWWWWWWWWWWWW', // 8: wall + door to hallway
        'WWWWWWWWWFFFFFFFWWWWWWWWWWWWW', // 9: hallway
        'WWWWWWWWWFFFFFFFWWWWWWWWWWWWW', // 10: hallway
        'WWWWFFWWDFFFFFFFDFFFFFFFWWWWW', // 11: bath-door + hallway + work-door
        'WWWWFFWWWFFFFFFFWWFFFFFFFWWWW', // 12: bathroom + hallway + workroom
        'WWWWFFWWWFFFFFFFWWFFFFFFFWWWW', // 13: bathroom + hallway + workroom
        'WWWWWWWWWFFFDFFFWWFFFFFFFWWWW', // 14: wall + hall-doors + workroom
        'WWWWWWWWWFFFFFFFWWWWWWWWWWWWW', // 15: hallway lower
        'WWWWWWWWWFFFFFFFWWWWWWWWWWWWW', // 16: hallway lower
        'WWWWFFWWDFFFFFFFWWWFFFFFFWWWW', // 17: baby-door + hall + bedroom
        'WWWWFFWWWFFFFFFFWWWFFFFFFWWWW', // 18: baby room + hall + bedroom
        'WWWWFFWWWFFFFFFFWWWFFFFFFWWWW', // 19: baby room + hall + bedroom
        'WWWWFFWWWFFFFFFFWWWFFFFFFWWWW', // 20: baby room + hall + bedroom
        'WWWWWWWWWWFFFFWWWWWFFFFFFWWWW', // 21: wall + bath2 + bedroom
        'WWWWWWWWWWFFFFWWWWWWWWWWWWWWW', // 22: bathroom2
        'WWWWWWWWWWFFFFWWWWWWWWWWWWWWW', // 23: bathroom2
        'WWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // 24
        'WWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // 25
    ];

    const map = [];
    for (let row = 0; row < INDOOR_ROWS; row++) {
        map[row] = [];
        const line = indoorTemplate[row] || 'WWWWWWWWWWWWWWWWWWWWWW';
        for (let col = 0; col < INDOOR_COLS; col++) {
            const ch = col < line.length ? line[col] : 'W';
            if (ch === 'W') map[row][col] = T.WALL;
            else if (ch === 'D') map[row][col] = T.DOOR_INT;
            else if (ch === 'E') map[row][col] = T.EXIT_MAT;
            else map[row][col] = T.FLOOR; // F = walkable
        }
    }
    return map;
}

function fillRoom(map, startCol, startRow, width, height, tileType) {
    for (let r = startRow; r < startRow + height && r < INDOOR_ROWS; r++) {
        for (let c = startCol; c < startCol + width && c < INDOOR_COLS; c++) {
            map[r][c] = tileType;
        }
    }
}

// Outdoor decorations - lots of trees like Pokemon
const OutdoorDecorations = [
    // Tree line left side
    { type: 'bush', col: 2, row: 2, sx: 0, sy: 0 },
    { type: 'bush', col: 2, row: 3, sx: 1, sy: 0 },
    { type: 'bush', col: 2, row: 4, sx: 0, sy: 0 },
    { type: 'bush', col: 2, row: 5, sx: 1, sy: 0 },
    { type: 'bush', col: 2, row: 6, sx: 2, sy: 0 },
    { type: 'bush', col: 3, row: 2, sx: 2, sy: 0 },
    { type: 'bush', col: 3, row: 3, sx: 0, sy: 0 },
    { type: 'bush', col: 3, row: 5, sx: 1, sy: 0 },
    // Tree line right side
    { type: 'bush', col: 20, row: 2, sx: 0, sy: 0 },
    { type: 'bush', col: 20, row: 3, sx: 2, sy: 0 },
    { type: 'bush', col: 20, row: 4, sx: 1, sy: 0 },
    { type: 'bush', col: 20, row: 5, sx: 0, sy: 0 },
    { type: 'bush', col: 21, row: 2, sx: 1, sy: 0 },
    { type: 'bush', col: 21, row: 3, sx: 0, sy: 0 },
    { type: 'bush', col: 21, row: 4, sx: 2, sy: 0 },
    { type: 'bush', col: 22, row: 2, sx: 0, sy: 0 },
    { type: 'bush', col: 22, row: 3, sx: 1, sy: 0 },
    // Trees along top
    { type: 'bush', col: 4, row: 2, sx: 2, sy: 0 },
    { type: 'bush', col: 5, row: 2, sx: 0, sy: 0 },
    { type: 'bush', col: 6, row: 2, sx: 1, sy: 0 },
    { type: 'bush', col: 7, row: 2, sx: 0, sy: 0 },
    { type: 'bush', col: 15, row: 2, sx: 2, sy: 0 },
    { type: 'bush', col: 16, row: 2, sx: 0, sy: 0 },
    { type: 'bush', col: 17, row: 2, sx: 1, sy: 0 },
    { type: 'bush', col: 18, row: 2, sx: 2, sy: 0 },
    // Trees bottom area
    { type: 'bush', col: 3, row: 14, sx: 1, sy: 0 },
    { type: 'bush', col: 3, row: 15, sx: 0, sy: 0 },
    { type: 'bush', col: 21, row: 14, sx: 2, sy: 0 },
    { type: 'bush', col: 21, row: 15, sx: 0, sy: 0 },
    // Flowers scattered
    { type: 'flowers', col: 5, row: 4, sx: 0, sy: 0 },
    { type: 'flowers', col: 7, row: 14, sx: 1, sy: 0 },
    { type: 'flowers', col: 17, row: 14, sx: 2, sy: 0 },
    { type: 'flowers', col: 6, row: 8, sx: 0, sy: 1 },
    { type: 'flowers', col: 16, row: 8, sx: 1, sy: 1 },
    { type: 'flowers', col: 5, row: 12, sx: 3, sy: 0 },
    { type: 'flowers', col: 18, row: 12, sx: 2, sy: 0 },
];

const GameMap = {
    currentZone: Zone.OUTSIDE,
    outdoorMap: null,
    apartmentMap: null,
    // Building: cols 7-13, rows 5-9, door at col 10, row 9
    buildingCol: 7,
    buildingRow: 5,
    buildingW: 7,
    buildingH: 5,
    doorCol: 10,
    doorRow: 9,

    init() {
        this.outdoorMap = generateOutdoorMap();
        this.apartmentMap = generateApartmentMap();
    },

    getCurrentMap() {
        return this.currentZone === Zone.OUTSIDE ? this.outdoorMap : this.apartmentMap;
    },

    getMapSize() {
        return this.currentZone === Zone.OUTSIDE
            ? { cols: MAP_COLS, rows: MAP_ROWS }
            : { cols: INDOOR_COLS, rows: INDOOR_ROWS };
    },

    getTile(col, row) {
        const map = this.getCurrentMap();
        if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return T.WALL;
        return map[row][col];
    },

    isSolid(col, row) {
        const tile = this.getTile(col, row);
        if (SOLID_TILES.includes(tile)) return true;

        if (this.currentZone === Zone.OUTSIDE) {
            // Building collision handled by map template (B = FENCE)
            // Door position is walkable (D = PATH in template)
        }

        if (this.currentZone === Zone.APARTMENT) {
            const items = FurnitureItems[Zone.APARTMENT];
            for (let f of items) {
                if (f.solid && col >= f.col && col < f.col + (f.w || 1) && row >= f.row && row < f.row + (f.h || 1))
                    return true;
            }
        }
        return false;
    },

    getFurnitureAt(col, row) {
        if (this.currentZone !== Zone.APARTMENT) return null;
        const items = FurnitureItems[Zone.APARTMENT];
        for (let f of items) {
            if (col >= f.col && col < f.col + (f.w || 1) && row >= f.row && row < f.row + (f.h || 1))
                return f;
        }
        return null;
    },

    // Get room name at position
    getRoomName(col, row) {
        if (this.currentZone !== Zone.APARTMENT) return '';
        if (row >= 1 && row <= 7 && col >= 5 && col <= 13) return 'סלון';
        if (row >= 1 && row <= 7 && col >= 1 && col <= 4) return 'מטבח';
        if (row >= 1 && row <= 6 && col >= 15 && col <= 20) return 'מרפסת';
        if (row >= 8 && row <= 11 && col >= 1 && col <= 4) return 'אמבטיה';
        if (row >= 8 && row <= 12 && col >= 14 && col <= 18) return 'חדר עבודה';
        if (row >= 13 && row <= 18 && col >= 11 && col <= 19) return 'חדר שינה';
        if (row >= 13 && row <= 17 && col >= 1 && col <= 5) return 'חדר רות';
        if (row >= 16 && row <= 19 && col >= 8 && col <= 13) return 'אמבטיה';
        if (row >= 8 && row <= 13 && col >= 5 && col <= 13) return 'מסדרון';
        if (row >= 0 && row <= 1 && col >= 11 && col <= 13) return 'כניסה';
        return '';
    },

    draw(ctx, cameraX, cameraY, canvasWidth, canvasHeight) {
        if (this.currentZone === Zone.OUTSIDE) {
            // Draw background image for outdoor
            const bgImg = Assets.get('outdoor_bg');
            if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
                const mapW = MAP_COLS * TILE_SIZE;
                const mapH = MAP_ROWS * TILE_SIZE;
                ctx.drawImage(bgImg, -cameraX, -cameraY, mapW, mapH);
            } else {
                // Fallback: green background
                ctx.fillStyle = '#7CC87A';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
        } else {
            // Indoor: background image
            const indoorImg = Assets.get('indoor_bg');
            if (indoorImg && indoorImg.complete && indoorImg.naturalWidth > 0) {
                const mapW = INDOOR_COLS * TILE_SIZE;
                const mapH = INDOOR_ROWS * TILE_SIZE;
                ctx.drawImage(indoorImg, -cameraX, -cameraY, mapW, mapH);
            } else {
                // Fallback tile rendering
                const map = this.getCurrentMap();
                const size = this.getMapSize();
                const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE) - 1);
                const endCol = Math.min(size.cols, Math.ceil((cameraX + canvasWidth) / TILE_SIZE) + 1);
                const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE) - 1);
                const endRow = Math.min(size.rows, Math.ceil((cameraY + canvasHeight) / TILE_SIZE) + 1);
                for (let row = startRow; row < endRow; row++) {
                    for (let col = startCol; col < endCol; col++) {
                        const tile = map[row][col];
                        const dx = col * TILE_SIZE - cameraX;
                        const dy = row * TILE_SIZE - cameraY;
                        this.drawTile(ctx, tile, dx, dy, col, row);
                    }
                }
            }
        }
    },

    drawTile(ctx, tile, dx, dy, col, row) {
        // Always draw a base color to prevent black/transparent gaps
        if (this.currentZone === Zone.OUTSIDE) {
            ctx.fillStyle = '#7CC87A'; // Match grass green
        } else {
            ctx.fillStyle = '#C8B898'; // Warm indoor base
        }
        ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);

        switch (tile) {
            case T.GRASS:
                // Use full grass tile [2,1] - medium green
                if (!drawSheetTile(ctx, 'grass', 2, 1, dx, dy)) {
                    ctx.fillStyle = '#7CC87A'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.GRASS2:
                // Slight variation [3,1]
                if (!drawSheetTile(ctx, 'grass', 3, 1, dx, dy)) {
                    ctx.fillStyle = '#6CB86A'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.GRASS3:
                // Another variation [6,1]
                if (!drawSheetTile(ctx, 'grass', 6, 1, dx, dy)) {
                    ctx.fillStyle = '#8CD88A'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.PATH:
                if (!drawSheetTile(ctx, 'path1', 5, 1, dx, dy)) {
                    ctx.fillStyle = '#E0D0C0'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.FENCE:
                if (!drawSheetTile(ctx, 'fences', 2, 0, dx, dy)) {
                    ctx.fillStyle = '#8B6914'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.WATER:
                ctx.fillStyle = '#4488CC'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#5599DD';
                const wo = Math.sin((Date.now() / 600) + col * 0.8) * 3;
                ctx.fillRect(dx + 6, dy + TILE_SIZE / 2 + wo, TILE_SIZE - 12, 3);
                break;
            case T.FLOOR:
                // Living room - use path_05alt tiles (warm wood brown)
                if (!drawSheetTile(ctx, 'path5', 5, 1, dx, dy)) {
                    ctx.fillStyle = '#C8A882'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.KITCHEN_FLOOR:
                // Kitchen - lighter tile from path_05alt
                if (!drawSheetTile(ctx, 'path5', 9, 2, dx, dy)) {
                    ctx.fillStyle = '#D4D4D4'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.BATH_FLOOR:
                // Bathroom - use path_04 (light greenish-blue feel)
                if (!drawSheetTile(ctx, 'path4', 5, 2, dx, dy)) {
                    ctx.fillStyle = '#B8D4E8'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.BEDROOM_FLOOR:
                // Bedroom - warm wood from path_05alt
                if (!drawSheetTile(ctx, 'path5', 5, 2, dx, dy)) {
                    ctx.fillStyle = '#D4C4A8'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.WORK_FLOOR:
                // Work room - slightly different wood
                if (!drawSheetTile(ctx, 'path5', 6, 1, dx, dy)) {
                    ctx.fillStyle = '#C0B090'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.BABY_FLOOR:
                // Baby room - lighter
                if (!drawSheetTile(ctx, 'path5', 4, 0, dx, dy)) {
                    ctx.fillStyle = '#E0D8C8'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.HALL_FLOOR:
                // Hallway - path_02 tiles (neutral)
                if (!drawSheetTile(ctx, 'path2', 5, 1, dx, dy)) {
                    ctx.fillStyle = '#CCC0A8'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.BALCONY:
                // Balcony - use path_04 (green-tinted)
                if (!drawSheetTile(ctx, 'path4', 5, 1, dx, dy)) {
                    ctx.fillStyle = '#A8C8A8'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                } break;
            case T.WALL:
                // Use grass sheet [1,3] for a warm beige wall, or path_02 for neutral
                if (!drawSheetTile(ctx, 'grass', 1, 3, dx, dy)) {
                    ctx.fillStyle = '#D8CCBB'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                }
                break;
            case T.WALL_TOP:
                if (!drawSheetTile(ctx, 'grass', 1, 4, dx, dy)) {
                    ctx.fillStyle = '#C8BC9A'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                }
                break;
            case T.DOOR_INT:
                // Door - draw floor underneath then door frame
                if (!drawSheetTile(ctx, 'path2', 5, 1, dx, dy)) {
                    ctx.fillStyle = '#CCC0A8'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                }
                // Door frame overlay
                ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 2;
                ctx.strokeRect(dx + 4, dy + 2, TILE_SIZE - 8, TILE_SIZE - 4);
                break;
            case T.EXIT_MAT:
                ctx.fillStyle = '#CD853F'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#B8732A'; ctx.fillRect(dx + 4, dy + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                ctx.fillStyle = '#D4A055'; ctx.fillRect(dx + 12, dy + 12, TILE_SIZE - 24, TILE_SIZE - 24);
                break;
            case T.CARPET:
                ctx.fillStyle = '#8B3A3A'; ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#A04040'; ctx.fillRect(dx + 4, dy + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                break;
        }
    },

    drawOutdoor(ctx, cameraX, cameraY) {
        const bx = this.buildingCol * TILE_SIZE - cameraX;
        const by = this.buildingRow * TILE_SIZE - cameraY;
        const bw = this.buildingW * TILE_SIZE;
        const bh = this.buildingH * TILE_SIZE;

        // Draw tall 22-story apartment building
        this.drawTallBuilding(ctx, bx, by, bw, bh);

        for (let deco of OutdoorDecorations) {
            const decoX = deco.col * TILE_SIZE - cameraX;
            const decoY = deco.row * TILE_SIZE - cameraY;
            if (deco.type === 'bush') {
                drawSheetTile(ctx, 'bush', deco.sx, deco.sy, decoX, decoY);
            } else if (deco.type === 'flowers') {
                drawSheetTile(ctx, 'flowers', deco.sx, deco.sy, decoX, decoY);
            }
        }
    },

    drawTallBuilding(ctx, bx, by, bw, bh) {
        const floors = 22;
        const floorH = bh / this.buildingH; // height per tile-row
        const totalVisualH = bh; // use the full allocated space

        // Building body - concrete/white
        ctx.fillStyle = '#E8E4E0';
        ctx.fillRect(bx + 4, by, bw - 8, totalVisualH);

        // Darker side for 3D effect
        ctx.fillStyle = '#D0CCC8';
        ctx.fillRect(bx + bw - 12, by, 8, totalVisualH);

        // Roof top
        ctx.fillStyle = '#888';
        ctx.fillRect(bx, by - 4, bw, 8);
        ctx.fillStyle = '#666';
        ctx.fillRect(bx + 8, by - 8, bw - 16, 6);
        // Antenna
        ctx.fillStyle = '#555';
        ctx.fillRect(bx + bw / 2 - 1, by - 20, 3, 14);
        ctx.fillStyle = '#F00';
        ctx.fillRect(bx + bw / 2 - 2, by - 22, 5, 3);

        // Windows - grid pattern
        const winW = Math.floor((bw - 20) / 3);
        const winH = Math.floor(floorH * 0.5);
        const winGap = 4;

        for (let floor = 0; floor < Math.min(floors, this.buildingH); floor++) {
            const fy = by + floor * floorH;

            // Floor line
            ctx.fillStyle = '#C8C4C0';
            ctx.fillRect(bx + 4, fy + floorH - 2, bw - 8, 2);

            // Windows (3 per floor)
            for (let w = 0; w < 3; w++) {
                const wx = bx + 8 + w * (winW + winGap);
                const wy = fy + 4;

                // Skip window for door floor at door position
                if (floor === this.buildingH - 1 && w === 1) continue;

                // Window frame
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(wx, wy, winW, winH);
                // Window divider
                ctx.fillStyle = '#B0C8D8';
                ctx.fillRect(wx + winW / 2 - 1, wy, 2, winH);
                // Window frame border
                ctx.strokeStyle = '#9AA';
                ctx.lineWidth = 1;
                ctx.strokeRect(wx, wy, winW, winH);

                // Some windows lit (random but consistent)
                if ((floor * 3 + w) % 5 === 0) {
                    ctx.fillStyle = 'rgba(255,240,180,0.3)';
                    ctx.fillRect(wx + 1, wy + 1, winW - 2, winH - 2);
                }
            }
        }

        // Ground floor - entrance
        const doorX = bx + bw / 2 - TILE_SIZE / 2;
        const doorY = by + totalVisualH - floorH;
        const doorW = TILE_SIZE;
        const doorH = floorH;

        // Entrance overhang
        ctx.fillStyle = '#888';
        ctx.fillRect(doorX - 8, doorY - 4, doorW + 16, 6);

        // Door
        ctx.fillStyle = '#654321';
        ctx.fillRect(doorX + 4, doorY + 4, doorW - 8, doorH - 6);
        // Glass door panels
        ctx.fillStyle = '#98C8E8';
        ctx.fillRect(doorX + 8, doorY + 6, doorW / 2 - 8, doorH - 12);
        ctx.fillRect(doorX + doorW / 2 + 2, doorY + 6, doorW / 2 - 8, doorH - 12);
        // Door handle
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(doorX + doorW / 2 - 2, doorY + doorH / 2, 4, 3);

        // Building number
        ctx.fillStyle = '#333';
        ctx.font = 'bold 10px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('22', bx + bw / 2, doorY - 6);
        ctx.textAlign = 'left';
    },

    drawIndoor(ctx, cameraX, cameraY) {
        // Room labels
        this.drawRoomLabel(ctx, cameraX, cameraY, 8, 1, 'סלון');
        this.drawRoomLabel(ctx, cameraX, cameraY, 2, 1, 'מטבח');
        this.drawRoomLabel(ctx, cameraX, cameraY, 17, 1, 'מרפסת');
        this.drawRoomLabel(ctx, cameraX, cameraY, 2, 8, 'אמבטיה');
        this.drawRoomLabel(ctx, cameraX, cameraY, 15, 8, 'חדר עבודה');
        this.drawRoomLabel(ctx, cameraX, cameraY, 14, 13, 'חדר שינה');
        this.drawRoomLabel(ctx, cameraX, cameraY, 2, 13, 'חדר רות');
        this.drawRoomLabel(ctx, cameraX, cameraY, 10, 16, 'אמבטיה');
        this.drawRoomLabel(ctx, cameraX, cameraY, 8, 9, 'מסדרון');

        // Window in salon
        const wx = 9 * TILE_SIZE - cameraX;
        const wy = 1 * TILE_SIZE - cameraY;
        ctx.fillStyle = '#87CEEB'; ctx.fillRect(wx, wy + 8, TILE_SIZE * 2, TILE_SIZE - 16);
        ctx.fillStyle = '#FFF'; ctx.fillRect(wx + TILE_SIZE - 1, wy + 8, 2, TILE_SIZE - 16);
        ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 2; ctx.strokeRect(wx, wy + 7, TILE_SIZE * 2, TILE_SIZE - 14);

        // Window in bedroom
        const bwx = 16 * TILE_SIZE - cameraX;
        const bwy = 18 * TILE_SIZE - cameraY;
        ctx.fillStyle = '#87CEEB'; ctx.fillRect(bwx, bwy + 8, TILE_SIZE * 2, TILE_SIZE - 16);
        ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 2; ctx.strokeRect(bwx, bwy + 7, TILE_SIZE * 2, TILE_SIZE - 14);

        // Draw furniture
        const items = FurnitureItems[Zone.APARTMENT];
        for (let f of items) {
            const fx = f.col * TILE_SIZE - cameraX;
            const fy = f.row * TILE_SIZE - cameraY;
            const fw = (f.w || 1) * TILE_SIZE;
            const fh = (f.h || 1) * TILE_SIZE;
            this.drawFurniture(ctx, f.type, fx, fy, fw, fh);
        }
    },

    drawRoomLabel(ctx, cameraX, cameraY, col, row, name) {
        const x = col * TILE_SIZE - cameraX + TILE_SIZE / 2;
        const y = row * TILE_SIZE - cameraY + TILE_SIZE / 2;
        ctx.font = '10px "Courier New"';
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.textAlign = 'center';
        ctx.fillText(name, x, y);
        ctx.textAlign = 'left';
    },

    drawFurniture(ctx, type, x, y, w, h) {
        switch (type) {
            case 'bed':
                ctx.fillStyle = '#8B0000'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
                ctx.fillStyle = '#FFF8DC'; ctx.fillRect(x + 8, y + 8, w - 16, h / 3);
                ctx.fillStyle = '#DC143C'; ctx.fillRect(x + 8, y + h / 3 + 8, w - 16, h / 2);
                ctx.fillStyle = '#FFF'; ctx.fillRect(x + 12, y + 10, w / 3, h / 5);
                ctx.fillRect(x + w / 2 + 4, y + 10, w / 3, h / 5);
                break;
            case 'baby_bed':
                ctx.fillStyle = '#DEB887'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
                ctx.fillStyle = '#FFF8DC'; ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
                ctx.strokeStyle = '#C8A870'; ctx.lineWidth = 2; ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
                break;
            case 'tv':
                ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x + 4, y + 6, w - 8, h - 14);
                ctx.fillStyle = '#336699'; ctx.fillRect(x + 8, y + 8, w - 16, h - 20);
                ctx.fillStyle = '#333'; ctx.fillRect(x + w / 2 - 8, y + h - 8, 16, 6);
                ctx.fillRect(x + w / 2 - 14, y + h - 4, 28, 3);
                break;
            case 'sofa':
                ctx.fillStyle = '#666688'; ctx.fillRect(x + 2, y + 4, w - 4, h - 6);
                ctx.fillStyle = '#7777AA'; ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
                // Arm rests
                ctx.fillStyle = '#555577'; ctx.fillRect(x + 2, y + 4, 6, h - 6);
                ctx.fillRect(x + w - 8, y + 4, 6, h - 6);
                break;
            case 'computer':
                ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x + 8, y + 4, w - 16, h - 20);
                ctx.fillStyle = '#4488AA'; ctx.fillRect(x + 10, y + 6, w - 20, h - 24);
                ctx.fillStyle = '#555'; ctx.fillRect(x + w / 2 - 4, y + h - 16, 8, 6);
                ctx.fillRect(x + 4, y + h - 10, w - 8, 4);
                ctx.fillStyle = '#444'; ctx.fillRect(x + 6, y + h - 4, w - 12, 3);
                break;
            case 'fridge':
                ctx.fillStyle = '#E8E8E8'; ctx.fillRect(x + 6, y + 4, w - 12, h - 8);
                ctx.fillStyle = '#CCC'; ctx.fillRect(x + 6, y + h / 2, w - 12, 2);
                ctx.fillStyle = '#888'; ctx.fillRect(x + w - 14, y + h / 4, 3, 8);
                break;
            case 'stove':
                ctx.fillStyle = '#444'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
                ctx.fillStyle = '#222';
                ctx.fillRect(x + 10, y + 10, 10, 10);
                ctx.fillRect(x + w - 20, y + 10, 10, 10);
                break;
            case 'sink': case 'bath_sink':
                ctx.fillStyle = '#C0C0C0'; ctx.fillRect(x + 4, y + 6, w - 8, h - 10);
                ctx.fillStyle = '#87CEEB'; ctx.fillRect(x + 10, y + 12, w - 20, h - 22);
                ctx.fillStyle = '#888'; ctx.fillRect(x + w / 2 - 3, y + 4, 6, 8);
                break;
            case 'table': case 'kitchen_table':
                ctx.fillStyle = '#8B6914'; ctx.fillRect(x + 2, y + 8, w - 4, h - 12);
                ctx.fillStyle = '#A0792C'; ctx.fillRect(x + 2, y + 8, w - 4, 5);
                break;
            case 'stool': case 'chair':
                ctx.fillStyle = '#8B6914'; ctx.fillRect(x + 10, y + 8, w - 20, 5);
                ctx.fillRect(x + 14, y + 13, 5, h - 16);
                ctx.fillRect(x + w - 19, y + 13, 5, h - 16);
                break;
            case 'balcony_chair':
                ctx.fillStyle = '#888'; ctx.fillRect(x + 8, y + 6, w - 16, h - 10);
                ctx.fillStyle = '#999'; ctx.fillRect(x + 10, y + 8, w - 20, h - 14);
                break;
            case 'balcony_table':
                ctx.fillStyle = '#777'; ctx.fillRect(x + 6, y + 10, w - 12, h - 14);
                break;
            case 'bookshelf':
                ctx.fillStyle = '#654321'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
                ctx.fillStyle = '#8B4513';
                for (let i = 0; i < 4; i++) ctx.fillRect(x + 2, y + 4 + i * (h / 4), w - 4, 2);
                const bc = ['#CC3333', '#3366CC', '#33AA33', '#CC9933', '#9933CC'];
                for (let r = 0; r < 4; r++)
                    for (let b = 0; b < 3; b++) {
                        ctx.fillStyle = bc[(r * 3 + b) % bc.length];
                        ctx.fillRect(x + 6 + b * 10, y + 6 + r * (h / 4), 7, h / 4 - 4);
                    }
                break;
            case 'plant':
                ctx.fillStyle = '#8B4513'; ctx.fillRect(x + w / 2 - 8, y + h - 16, 16, 14);
                ctx.fillStyle = '#228B22'; ctx.fillRect(x + 6, y + 4, w - 12, h - 18);
                ctx.fillStyle = '#32CD32'; ctx.fillRect(x + 10, y + 2, w - 20, h - 22);
                break;
            case 'radio':
                ctx.fillStyle = '#333'; ctx.fillRect(x + 6, y + h / 3, w - 12, h / 2);
                ctx.fillStyle = '#555'; ctx.fillRect(x + 10, y + h / 3 + 4, 10, 10);
                ctx.fillStyle = '#FF4444'; ctx.fillRect(x + w / 2 + 4, y + h / 4, 2, h / 3);
                break;
            case 'cabinet': case 'closet':
                ctx.fillStyle = '#8B6914'; ctx.fillRect(x + 2, y + 4, w - 4, h - 6);
                ctx.fillStyle = '#A0792C';
                ctx.fillRect(x + 5, y + 6, w / 2 - 6, h - 12);
                ctx.fillRect(x + w / 2 + 1, y + 6, w / 2 - 6, h - 12);
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(x + w / 2 - 4, y + h / 2, 3, 3);
                ctx.fillRect(x + w / 2 + 1, y + h / 2, 3, 3);
                break;
            case 'nightstand':
                ctx.fillStyle = '#8B6914'; ctx.fillRect(x + 6, y + 6, w - 12, h - 8);
                ctx.fillStyle = '#A0792C'; ctx.fillRect(x + 8, y + 8, w - 16, h - 12);
                break;
            case 'bathtub':
                ctx.fillStyle = '#E8E8E8'; ctx.fillRect(x + 2, y + 4, w - 4, h - 6);
                ctx.fillStyle = '#B8D4E8'; ctx.fillRect(x + 6, y + 8, w - 12, h - 14);
                break;
            case 'toilet':
                ctx.fillStyle = '#F0F0F0'; ctx.fillRect(x + 8, y + 4, w - 16, h - 6);
                ctx.fillStyle = '#E0E0E0'; ctx.fillRect(x + 10, y + 6, w - 20, h / 2);
                ctx.fillStyle = '#DDD'; ctx.fillRect(x + 12, y + h / 2 + 2, w - 24, h / 3);
                break;
        }
    }
};
