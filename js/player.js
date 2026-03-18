// player.js - Tal is the player character
const Player = {
    sprite: null,
    gridCol: 10,
    gridRow: 14, // Start across the road
    targetX: 0,
    targetY: 0,
    moveSpeed: 4,
    isMoving: false,
    moveProgress: 0,
    startX: 0,
    startY: 0,
    // Position history for companion following
    posHistory: [],

    init() {
        this.sprite = new Sprite({
            x: this.gridCol * TILE_SIZE,
            y: this.gridRow * TILE_SIZE,
            name: 'טל',
            image: Assets.get('tal')
        });
        this.targetX = this.sprite.x;
        this.targetY = this.sprite.y;
        this.posHistory = [{ col: this.gridCol, row: this.gridRow, dir: Direction.DOWN }];
    },

    update(deltaTime, keys) {
        this.sprite.update(deltaTime);

        if (this.isMoving) {
            this.moveProgress += this.moveSpeed;
            const t = Math.min(1, this.moveProgress / TILE_SIZE);
            this.sprite.x = this.startX + (this.targetX - this.startX) * t;
            this.sprite.y = this.startY + (this.targetY - this.startY) * t;

            if (t >= 1) {
                this.sprite.x = this.targetX;
                this.sprite.y = this.targetY;
                this.gridCol = Math.round(this.sprite.x / TILE_SIZE);
                this.gridRow = Math.round(this.sprite.y / TILE_SIZE);
                this.isMoving = false;
                this.sprite.isMoving = false;

                // Save position history for companion
                this.posHistory.push({ col: this.gridCol, row: this.gridRow, dir: this.sprite.direction });
                if (this.posHistory.length > 100) this.posHistory.shift();

                this.checkTransition();

                // Update room indicator
                const room = GameMap.getRoomName(this.gridCol, this.gridRow);
                if (room && GameMap.currentZone === Zone.APARTMENT) {
                    UI.currentRoom = room;
                }
            }
            return;
        }

        if (UI.isBlocking()) return;

        let newCol = this.gridCol;
        let newRow = this.gridRow;
        let moved = false;

        if (keys.up) { newRow--; this.sprite.direction = Direction.UP; moved = true; }
        else if (keys.down) { newRow++; this.sprite.direction = Direction.DOWN; moved = true; }
        else if (keys.left) { newCol--; this.sprite.direction = Direction.LEFT; moved = true; }
        else if (keys.right) { newCol++; this.sprite.direction = Direction.RIGHT; moved = true; }

        if (moved && !GameMap.isSolid(newCol, newRow)) {
            if (Companion.isAt(newCol, newRow)) return;
            this.startX = this.sprite.x;
            this.startY = this.sprite.y;
            this.targetX = newCol * TILE_SIZE;
            this.targetY = newRow * TILE_SIZE;
            this.moveProgress = 0;
            this.isMoving = true;
            this.sprite.isMoving = true;
        }
    },

    checkTransition() {
        if (GameMap.currentZone === Zone.OUTSIDE) {
            // Stepped on door tile OR one tile below door
            if (this.gridCol === GameMap.doorCol &&
                (this.gridRow === GameMap.doorRow || this.gridRow === GameMap.doorRow + 1)) {
                this.showIntercom();
            }
        } else if (GameMap.currentZone === Zone.APARTMENT) {
            if (this.gridRow === 1 && this.gridCol === 8) {
                this.exitApartment();
            }
        }
    },

    showIntercom() {
        if (UI.isBlocking()) return;
        UI.showKeypad((correct, code) => {
            if (correct) {
                UI.showDialog('אינטרקום', ['!הקוד נכון', '...הדלת נפתחת'], () => {
                    this.enterApartment();
                });
            } else if (code !== '') {
                UI.showDialog('אינטרקום', '.קוד שגוי. נסי שוב');
            }
        });
    },

    enterApartment() {
        GameMap.currentZone = Zone.APARTMENT;
        this.gridCol = 8;
        this.gridRow = 2;
        this.sprite.x = this.gridCol * TILE_SIZE;
        this.sprite.y = this.gridRow * TILE_SIZE;
        this.targetX = this.sprite.x;
        this.targetY = this.sprite.y;
        this.posHistory = [{ col: this.gridCol, row: this.gridRow, dir: Direction.DOWN }];
        Companion.enterApartment();
        UI.showNotification('!נכנסתם לדירה', 2000);
    },

    exitApartment() {
        GameMap.currentZone = Zone.OUTSIDE;
        this.gridCol = GameMap.doorCol;
        this.gridRow = GameMap.doorRow + 1;
        this.sprite.x = this.gridCol * TILE_SIZE;
        this.sprite.y = this.gridRow * TILE_SIZE;
        this.targetX = this.sprite.x;
        this.targetY = this.sprite.y;
        this.posHistory = [{ col: this.gridCol, row: this.gridRow, dir: Direction.DOWN }];
        Companion.exitApartment();
        UI.showNotification('!יצאתם החוצה', 2000);
    },

    getFacingTile() {
        let col = this.gridCol, row = this.gridRow;
        switch (this.sprite.direction) {
            case Direction.UP: row--; break;
            case Direction.DOWN: row++; break;
            case Direction.LEFT: col--; break;
            case Direction.RIGHT: col++; break;
        }
        return { col, row };
    },

    interact() {
        if (UI.isBlocking()) {
            if (UI.dialogActive) UI.advanceDialog();
            else if (UI.menuActive) UI.menuSelect();
            return;
        }

        const facing = this.getFacingTile();

        // Talk to companion Adam
        if (Companion.isAt(facing.col, facing.row)) { Companion.interact(); return; }

        // Furniture
        const furniture = GameMap.getFurnitureAt(facing.col, facing.row);
        if (furniture && furniture.interaction) { this.interactWithFurniture(furniture); return; }

        // Door from outside - interact with door or step on it
        if (GameMap.currentZone === Zone.OUTSIDE) {
            if (facing.col === GameMap.doorCol && facing.row === GameMap.doorRow) {
                this.showIntercom();
                return;
            }
            // Also check adjacent tiles around door
            if (Math.abs(facing.col - GameMap.doorCol) <= 1 && Math.abs(facing.row - GameMap.doorRow) <= 1) {
                const tile = GameMap.getTile(facing.col, facing.row);
                if (tile === T.FENCE) {
                    // Facing the building near the door
                    this.showIntercom();
                    return;
                }
            }
        }
    },

    interactWithFurniture(furniture) {
        switch (furniture.interaction) {
            case 'bed':
                UI.showDialog('טל', '...המיטה שלנו. ממש נוחה'); break;
            case 'baby_bed':
                UI.showDialog('טל', '!המיטה של רות. כמה היא חמודה'); break;
            case 'computer':
                UI.showDialog('טל', '!המחשב של אדם. תמיד יושב פה ומתכנת'); break;
            case 'sofa':
                UI.showDialog('טל', '!הספה. בואו נשב ונירגע'); break;
            case 'fridge':
                UI.showMenu('?מה יש במקרר', ['חלב', 'גבינה', 'ביצים', 'לסגור'], (choice) => {
                    if (choice === 'לסגור') UI.showDialog('טל', '.סגרתי את המקרר');
                    else UI.showDialog('טל', `!נמצא ${choice} במקרר`);
                });
                break;
            case 'stove':
                UI.showDialog('טל', '?הכיריים. מה נבשל היום'); break;
            case 'bookshelf':
                UI.showDialog('טל', '.ספרייה מלאה בספרים מעניינים'); break;
            case 'table': case 'kitchen_table':
                UI.showDialog('טל', '.שולחן. מקום מושלם לארוחה'); break;
            case 'closet':
                UI.showDialog('טל', '.הארון. מלא בגדים'); break;
        }
    },

    draw(ctx, cameraX, cameraY) {
        this.sprite.draw(ctx, cameraX, cameraY);
        this.sprite.drawNameTag(ctx, cameraX, cameraY);
    }
};
