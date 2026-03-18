// player.js - Tal (the player)
const Player = {
    sprite: null,
    gridCol: 10, gridRow: 14,
    targetX: 0, targetY: 0,
    moveSpeed: 4, isMoving: false, moveProgress: 0,
    startX: 0, startY: 0,
    posHistory: [],

    init() {
        this.sprite = new Sprite({ x: this.gridCol*TILE_SIZE, y: this.gridRow*TILE_SIZE, name: 'טל', image: Assets.get('tal') });
        this.targetX = this.sprite.x; this.targetY = this.sprite.y;
        this.posHistory = [{col:this.gridCol, row:this.gridRow, dir:Direction.DOWN}];
    },

    update(dt, keys) {
        this.sprite.update(dt);

        if (this.isMoving) {
            this.moveProgress += this.moveSpeed;
            const t = Math.min(1, this.moveProgress / TILE_SIZE);
            this.sprite.x = this.startX + (this.targetX - this.startX) * t;
            this.sprite.y = this.startY + (this.targetY - this.startY) * t;
            if (t >= 1) {
                this.sprite.x = this.targetX; this.sprite.y = this.targetY;
                this.gridCol = Math.round(this.sprite.x / TILE_SIZE);
                this.gridRow = Math.round(this.sprite.y / TILE_SIZE);
                this.isMoving = false; this.sprite.isMoving = false;
                this.posHistory.push({col:this.gridCol, row:this.gridRow, dir:this.sprite.direction});
                if (this.posHistory.length > 100) this.posHistory.shift();
                this.checkTransition();
                GameState.checkRoomTrigger(this.gridCol, this.gridRow);
                GameState.checkAdamEncounter();
                UI.currentRoom = GameMap.getRoomName(this.gridCol, this.gridRow);
            }
            return;
        }

        if (UI.isBlocking()) return;

        let nc = this.gridCol, nr = this.gridRow, moved = false;
        if (keys.up) { nr--; this.sprite.direction = Direction.UP; moved = true; }
        else if (keys.down) { nr++; this.sprite.direction = Direction.DOWN; moved = true; }
        else if (keys.left) { nc--; this.sprite.direction = Direction.LEFT; moved = true; }
        else if (keys.right) { nc++; this.sprite.direction = Direction.RIGHT; moved = true; }

        if (moved && !GameMap.isSolid(nc, nr) && !Companion.isAt(nc, nr)) {
            this.startX = this.sprite.x; this.startY = this.sprite.y;
            this.targetX = nc*TILE_SIZE; this.targetY = nr*TILE_SIZE;
            this.moveProgress = 0; this.isMoving = true; this.sprite.isMoving = true;
            SFX.play('step', 0.15);
        }
    },

    checkTransition() {
        if (GameMap.currentZone === Zone.OUTSIDE) {
            // Standing at or near door - auto trigger keypad
            const nearDoor = Math.abs(this.gridCol - GameMap.doorCol) <= 1 && Math.abs(this.gridRow - GameMap.doorRow) <= 1;
            if (nearDoor && !UI.isBlocking()) {
                if (GameState.doorUnlocked) {
                    Player.enterApartment();
                    GameState.triggerIndoorIntro();
                } else if (GameState.current === 'OUTDOOR_TALKED_ADAM') {
                    GameState.triggerKeypad();
                }
            }
        } else if (GameMap.currentZone === Zone.APARTMENT) {
            // Exit at entry area (row 6, cols 14-19)
            if (this.gridRow <= 6 && this.gridCol >= 14 && this.gridCol <= 19) {
                this.exitApartment();
            }
        }
    },

    interact() {
        if (UI.isBlocking()) { if (UI.dialogActive) UI.advanceDialog(); else if (UI.puzzleActive) UI.puzzleSelect(); return; }

        const facing = this.getFacingTile();

        // Talk to Adam
        if (Companion.isAt(facing.col, facing.row)) { Companion.interact(); return; }

        // Door from outside
        if (GameMap.currentZone === Zone.OUTSIDE) {
            if ((facing.col === GameMap.doorCol || this.gridCol === GameMap.doorCol) &&
                (facing.row === GameMap.doorRow || facing.row <= GameMap.doorRow + 1)) {
                if (GameState.current === 'OUTDOOR_TALKED_ADAM') {
                    GameState.triggerKeypad();
                    return;
                }
            }
        }
    },

    getFacingTile() {
        let c = this.gridCol, r = this.gridRow;
        if (this.sprite.direction === Direction.UP) r--;
        if (this.sprite.direction === Direction.DOWN) r++;
        if (this.sprite.direction === Direction.LEFT) c--;
        if (this.sprite.direction === Direction.RIGHT) c++;
        return {col:c, row:r};
    },

    enterApartment() {
        GameMap.currentZone = Zone.APARTMENT;
        this.gridCol = 16; this.gridRow = 9;
        this.sprite.x = this.gridCol*TILE_SIZE; this.sprite.y = this.gridRow*TILE_SIZE;
        this.targetX = this.sprite.x; this.targetY = this.sprite.y;
        this.posHistory = [{col:this.gridCol, row:this.gridRow, dir:Direction.DOWN}];
        Companion.enterApartment();
    },

    exitApartment() {
        GameMap.currentZone = Zone.OUTSIDE;
        this.gridCol = GameMap.doorCol; this.gridRow = GameMap.doorRow + 1;
        this.sprite.x = this.gridCol*TILE_SIZE; this.sprite.y = this.gridRow*TILE_SIZE;
        this.targetX = this.sprite.x; this.targetY = this.sprite.y;
        this.posHistory = [{col:this.gridCol, row:this.gridRow, dir:Direction.DOWN}];
        Companion.exitApartment();
    },

    draw(ctx, cx, cy) { this.sprite.draw(ctx, cx, cy); this.sprite.drawNameTag(ctx, cx, cy); }
};
