// npc.js - Adam as companion that follows Tal (the player)
const Companion = {
    sprite: null,
    gridCol: 10,
    gridRow: 10, // Waiting near the building door
    dialogIndex: 0,
    followDelay: 6,
    greetedTal: false, // Has Adam greeted Tal yet?
    followMode: false, // Only follow after entering apartment

    dialogs: {
        outdoor: [
            ['!בואי טל, ניכנס הביתה'],
            ['?יום יפה, לא'],
            ['.אני אוהב לטייל איתך'],
            ['!בואי נלך הביתה, יש לי הפתעה'],
        ],
        indoor: [
            ['?מה את רוצה לעשות', '!אני פה בשבילך'],
            ['?רוצה לבדוק את החדרים'],
            ['.דירה יפה יש לנו', '!אני שמח שאנחנו פה ביחד'],
            ['?רוצה לשחק חידון', '!אני בטוח שאת תנצחי'],
            ['!בואי נבשל משהו ביחד'],
        ]
    },

    init() {
        this.sprite = new Sprite({
            x: this.gridCol * TILE_SIZE,
            y: this.gridRow * TILE_SIZE,
            name: 'אדם',
            image: Assets.get('adam')
        });
    },

    enterApartment() {
        this.followMode = true; // Start following inside apartment
        this.gridCol = 8;
        this.gridRow = 3;
        this.sprite.x = this.gridCol * TILE_SIZE;
        this.sprite.y = this.gridRow * TILE_SIZE;
        this.dialogIndex = 0;
    },

    exitApartment() {
        this.gridCol = GameMap.doorCol;
        this.gridRow = GameMap.doorRow + 2;
        this.sprite.x = this.gridCol * TILE_SIZE;
        this.sprite.y = this.gridRow * TILE_SIZE;
        this.dialogIndex = 0;
    },

    isAt(col, row) { return this.gridCol === col && this.gridRow === row; },

    update(deltaTime) {
        this.sprite.update(deltaTime);

        // Check if Tal is close - trigger greeting
        if (!this.greetedTal && GameMap.currentZone === Zone.OUTSIDE) {
            const dist = Math.abs(this.gridCol - Player.gridCol) + Math.abs(this.gridRow - Player.gridRow);
            if (dist <= 3) {
                this.greetedTal = true;
                // Face Tal
                const dx = Player.gridCol - this.gridCol;
                const dy = Player.gridRow - this.gridRow;
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.sprite.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
                } else {
                    this.sprite.direction = dy > 0 ? Direction.DOWN : Direction.UP;
                }
                UI.showDialog('אדם', [
                    '!טל! יום נישואים שמח',
                    '...אני לא זוכר את הקוד',
                    '?תכניסי אותנו בבקשה'
                ], () => {
                    // Auto-open keypad
                    Player.showIntercom();
                });
            }
        }

        if (this.followMode) {
            this.followPlayer();
        }
    },

    followPlayer() {
        const history = Player.posHistory;
        if (history.length < this.followDelay + 1) return;

        // Keep distance - don't get closer than 2 tiles to player
        const distToPlayer = Math.abs(this.gridCol - Player.gridCol) + Math.abs(this.gridRow - Player.gridRow);
        if (distToPlayer <= 2) {
            this.sprite.isMoving = false;
            return;
        }

        const targetPos = history[history.length - this.followDelay - 1];
        if (!targetPos) return;

        const targetCol = targetPos.col;
        const targetRow = targetPos.row;

        if (this.gridCol === targetCol && this.gridRow === targetRow) {
            this.sprite.isMoving = false;
            return;
        }

        // Don't move onto player
        if (targetCol === Player.gridCol && targetRow === Player.gridRow) return;

        let dx = targetCol - this.gridCol;
        let dy = targetRow - this.gridRow;

        let newCol = this.gridCol;
        let newRow = this.gridRow;

        if (Math.abs(dx) >= Math.abs(dy)) {
            newCol += Math.sign(dx);
        } else {
            newRow += Math.sign(dy);
        }

        // Don't get adjacent to player
        const newDistToPlayer = Math.abs(newCol - Player.gridCol) + Math.abs(newRow - Player.gridRow);
        if (newDistToPlayer <= 1) {
            this.sprite.isMoving = false;
            return;
        }

        // Update direction
        if (newCol > this.gridCol) this.sprite.direction = Direction.RIGHT;
        else if (newCol < this.gridCol) this.sprite.direction = Direction.LEFT;
        else if (newRow > this.gridRow) this.sprite.direction = Direction.DOWN;
        else if (newRow < this.gridRow) this.sprite.direction = Direction.UP;

        // Check if new position is valid
        if (!GameMap.isSolid(newCol, newRow) &&
            !(newCol === Player.gridCol && newRow === Player.gridRow)) {
            this.gridCol = newCol;
            this.gridRow = newRow;
            this.sprite.x = this.gridCol * TILE_SIZE;
            this.sprite.y = this.gridRow * TILE_SIZE;
            this.sprite.isMoving = true;
        } else {
            this.sprite.isMoving = false;
        }
    },

    interact() {
        // Face the player
        const dx = Player.gridCol - this.gridCol;
        const dy = Player.gridRow - this.gridRow;
        if (Math.abs(dx) > Math.abs(dy)) {
            this.sprite.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
        } else {
            this.sprite.direction = dy > 0 ? Direction.DOWN : Direction.UP;
        }

        const context = GameMap.currentZone === Zone.APARTMENT ? 'indoor' : 'outdoor';
        const dialogList = this.dialogs[context];

        // Every 4th interaction, offer quiz
        if (this.dialogIndex > 0 && this.dialogIndex % 4 === 0) {
            UI.showDialog('אדם', ['!בואי נשחק חידון', '?את מוכנה'], () => {
                UI.showMenu('?לשחק חידון', ['!כן', 'אולי אחר כך'], (choice) => {
                    if (choice === '!כן') Puzzle.startQuiz();
                    else UI.showDialog('אדם', '.טוב, אולי אחר כך');
                });
            });
        } else {
            UI.showDialog('אדם', dialogList[this.dialogIndex % dialogList.length]);
        }
        this.dialogIndex++;
    },

    draw(ctx, cameraX, cameraY) {
        this.sprite.draw(ctx, cameraX, cameraY);
        this.sprite.drawNameTag(ctx, cameraX, cameraY);
    }
};

// Keep NPC reference for backward compatibility
const NPC = Companion;
