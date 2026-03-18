// tiles.js - Tile definitions and asset loading for 16x16 asset pack
const SRC_TILE = 16;  // Source tile size in sprite sheets
const TILE_SIZE = 48; // Display tile size (16x3 scale)

// Asset manager
const Assets = {
    images: {},
    loaded: 0,
    total: 0,
    allLoaded: false,

    load(name, src) {
        this.total++;
        const img = new Image();
        img.onload = () => {
            this.loaded++;
            if (this.loaded >= this.total) this.allLoaded = true;
        };
        img.onerror = () => {
            console.warn('Could not load: ' + src);
            this.loaded++;
            if (this.loaded >= this.total) this.allLoaded = true;
        };
        img.src = src;
        this.images[name] = img;
    },

    get(name) { return this.images[name]; },
    isReady() { return this.allLoaded || this.total === 0; }
};

// Base path for pocket assets
const PKT = 'pocket_assets/Pocket Creature Tamer DEMO/';

function loadAssets() {
    // Tilesets
    Assets.load('grass', PKT + 'Tilesets/Grass.png');
    Assets.load('path1', PKT + 'Tilesets/path_01alt.png');
    Assets.load('path2', PKT + 'Tilesets/path_02.png');
    Assets.load('path4', PKT + 'Tilesets/path_04.png');
    Assets.load('path5', PKT + 'Tilesets/path_05alt.png');
    Assets.load('fences', PKT + 'Tilesets/Fences.png');

    // Environment
    Assets.load('buildings', PKT + 'Enviroment/Buildings/premade_builds.png');
    Assets.load('bush', PKT + 'Enviroment/Vegetation/Bushes/bush.png');
    Assets.load('flowers', PKT + 'Enviroment/Vegetation/Flowers/flowers.png');

    // Characters
    Assets.load('character', PKT + 'Characters/character01-Sheet.png');

    // Creatures
    Assets.load('creature01', PKT + 'Creatures/2EVO/01_2/01.png');
    Assets.load('creature01_alt', PKT + 'Creatures/2EVO/01_2/01_alt.png');
    Assets.load('creature02', PKT + 'Creatures/3EVO/02/02.png');
    Assets.load('creature02_alt', PKT + 'Creatures/3EVO/02/02_alt.png');
    Assets.load('creature06', PKT + 'Creatures/Uniques/06/06.png');
    Assets.load('creature06_alt', PKT + 'Creatures/Uniques/06/06_alt.png');

    // Background images
    Assets.load('outdoor_bg', 'outdoor.jpg');
    Assets.load('indoor_bg', 'indoor.jpg');

    // Player character images (original sprites)
    Assets.load('adam', 'adam.png');
    Assets.load('tal', 'tal.png');
}

// Draw a tile from a sprite sheet
// sheet: asset name, sx, sy: source position in 16px units
function drawSheetTile(ctx, sheetName, sx, sy, destX, destY, destSize) {
    destSize = destSize || TILE_SIZE;
    const img = Assets.get(sheetName);
    if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img,
            sx * SRC_TILE, sy * SRC_TILE, SRC_TILE, SRC_TILE,
            destX, destY, destSize, destSize
        );
        return true;
    }
    return false;
}

// Draw a multi-tile sprite from a sheet
function drawSheetSprite(ctx, sheetName, sx, sy, sw, sh, destX, destY, destW, destH) {
    const img = Assets.get(sheetName);
    if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img,
            sx * SRC_TILE, sy * SRC_TILE, sw * SRC_TILE, sh * SRC_TILE,
            destX, destY, destW, destH
        );
        return true;
    }
    return false;
}
