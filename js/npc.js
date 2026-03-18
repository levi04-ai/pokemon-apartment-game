// npc.js - Adam (companion/hint NPC)
const Companion = {
    sprite: null,
    gridCol: 10, gridRow: 10, // On the door entrance (orange bar)
    followMode: false, hintMode: false,
    greetedTal: false,
    followDelay: 6,
    checkInTimer: 0,
    checkInInterval: 45000,
    homeCol: 19, homeRow: 22,
    walkingToTarget: false, walkTarget: null,
    walkTimer: 0, walkSpeed: 300, // Move one tile every 300ms

    init() {
        this.sprite = new Sprite({ x: this.gridCol*TILE_SIZE, y: this.gridRow*TILE_SIZE, name: 'אדם', image: Assets.get('adam') });
        this.sprite.direction = Direction.DOWN;
    },

    isAt(c, r) { return this.gridCol === c && this.gridRow === r; },

    update(dt) {
        this.sprite.update(dt);

        // Auto-greet when Tal approaches
        if (!this.greetedTal && GameMap.currentZone === Zone.OUTSIDE) {
            const dist = Math.abs(this.gridCol - Player.gridCol) + Math.abs(this.gridRow - Player.gridRow);
            if (dist <= 3) {
                this.greetedTal = true;
                this.facePlayer();
                GameState.triggerAdamGreeting();
            }
        }

        // Slow walk to target
        if (this.walkingToTarget) {
            this.walkTimer += dt;
            if (this.walkTimer >= this.walkSpeed) {
                this.walkTimer = 0;
                this.updateWalkToTarget();
            }
        }

        if (this.followMode) this.followPlayer();

        // Periodic check-in from Adam
        if (this.hintMode && GameMap.currentZone === Zone.APARTMENT && !UI.isBlocking()) {
            this.checkInTimer += dt;
            if (this.checkInTimer >= this.checkInInterval) {
                this.checkInTimer = 0;
                // Move Adam toward player temporarily
                const px = Player.gridCol, py = Player.gridRow;
                const dist = Math.abs(this.gridCol - px) + Math.abs(this.gridRow - py);
                if (dist > 5) {
                    // Teleport nearby and say something
                    this.gridCol = px + 2;
                    this.gridRow = py;
                    this.sprite.x = this.gridCol * TILE_SIZE;
                    this.sprite.y = this.gridRow * TILE_SIZE;
                    this.facePlayer();
                    const rand = Math.random();
                    let quote, goKitchen = false;
                    if (rand < 0.3) {
                        quote = ['מאמי את מסתדרת?', 'יופי, תמיד כאן לשירותך!'];
                    } else if (rand < 0.5) {
                        quote = ["I don't know Ricky, this is not my business"];
                    } else if (rand < 0.7) {
                        quote = ['רק באתי לשתות קפה, לא סיימתי'];
                        goKitchen = true;
                    } else {
                        quote = ['מאמי את מסתדרת?', 'אני מאמין בך!'];
                    }
                    // Sometimes walk to kitchen first
                    if (goKitchen) {
                        this.walkToTarget(8, 13); // Kitchen area
                        setTimeout(() => {
                            UI.showDialog('אדם', quote, () => {
                                this.walkToTarget(this.homeCol, this.homeRow);
                            }, 'adam');
                        }, 3000);
                    } else {
                        this.gridCol = Player.gridCol + 2;
                        this.gridRow = Player.gridRow;
                        this.sprite.x = this.gridCol * TILE_SIZE;
                        this.sprite.y = this.gridRow * TILE_SIZE;
                        this.facePlayer();
                        UI.showDialog('אדם', quote, () => {
                            this.walkToTarget(this.homeCol, this.homeRow);
                        }, 'adam');
                    }
                }
            }
        }
    },

    facePlayer() {
        const dx = Player.gridCol - this.gridCol, dy = Player.gridRow - this.gridRow;
        if (Math.abs(dx) > Math.abs(dy)) this.sprite.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
        else this.sprite.direction = dy > 0 ? Direction.DOWN : Direction.UP;
    },

    interact() {
        this.facePlayer();

        if (this.hintMode) {
            // Random chance to offer song
            const rand = Math.random();
            if (rand < 0.25 && !GameState._songPlayed) {
                UI.showPuzzle('🎵', 'רוצה לשמוע משהו שהקלטתי?', ['כן', 'לא'], (idx) => {
                    if (idx === 0) {
                        GameState._songPlayed = true;
                        GameState.playGalilSong();
                        UI.showDialog('אדם', '🎵 מתנגן...', null, 'adam');
                    } else {
                        UI.showDialog('אדם', 'טוב, אני במחשב', null, 'adam');
                    }
                });
            } else if (GameState.current === 'INDOOR_START' || GameState.current === 'BALCONY_ACTIVE') {
                UI.showDialog('אדם', 'אני במחשב שלי, אם את צריכה משהו אל תהססי. אפילו שאני עובד את בראש סדר העדיפויות שלי', null, 'adam');
            } else if (GameState.current === 'KITCHEN_COMPLETE' || GameState.current === 'LIBRARY_ACTIVE') {
                UI.showDialog('אדם', 'החידה הבאה היא בספרייה, ליד השטיח', null, 'adam');
            } else if (GameState.current === 'BALCONY_COMPLETE') {
                UI.showDialog('אדם', 'לכי למטבח, חפשי את האור האדום', null, 'adam');
            } else {
                UI.showDialog('אדם', 'את מדהימה, המשיכי ככה!', null, 'adam');
            }
            return;
        }

        // Default outdoor chat
        if (GameState.current === 'OUTDOOR_START') {
            GameState.triggerAdamGreeting();
        }
    },

    walkToTarget(targetCol, targetRow) {
        // Use A* pathfinding to find real path
        this.walkPath = this._findPath(this.gridCol, this.gridRow, targetCol, targetRow);
        this.walkPathIdx = 0;
        this.walkingToTarget = true;
        this.walkTarget = { col: targetCol, row: targetRow };
    },

    _findPath(sx, sy, tx, ty) {
        // A* pathfinding
        const key = (x, y) => x + ',' + y;
        const open = [{ x: sx, y: sy, g: 0, h: 0, f: 0, parent: null }];
        const closed = new Set();
        const cameFrom = {};

        while (open.length > 0) {
            // Find lowest f
            open.sort((a, b) => a.f - b.f);
            const current = open.shift();

            if (current.x === tx && current.y === ty) {
                // Reconstruct path
                const path = [];
                let node = current;
                while (node.parent) {
                    path.unshift({ col: node.x, row: node.y });
                    node = node.parent;
                }
                return path;
            }

            closed.add(key(current.x, current.y));

            // Neighbors (4 directions)
            const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
            for (const d of dirs) {
                const nx = current.x + d.dx, ny = current.y + d.dy;
                if (closed.has(key(nx, ny))) continue;
                if (GameMap.isSolid(nx, ny) && !(nx === tx && ny === ty)) continue;

                const g = current.g + 1;
                const h = Math.abs(nx - tx) + Math.abs(ny - ty);
                const existing = open.find(n => n.x === nx && n.y === ny);
                if (existing) {
                    if (g < existing.g) {
                        existing.g = g; existing.f = g + h; existing.parent = current;
                    }
                } else {
                    open.push({ x: nx, y: ny, g, h, f: g + h, parent: current });
                }
            }

            // Safety: don't search too long
            if (closed.size > 500) break;
        }

        // No path found - return direct line
        return [{ col: tx, row: ty }];
    },

    updateWalkToTarget() {
        if (!this.walkingToTarget || !this.walkPath || this.walkPathIdx >= this.walkPath.length) {
            this.walkingToTarget = false;
            this.sprite.isMoving = false;
            return;
        }

        const next = this.walkPath[this.walkPathIdx];
        if (this.gridCol === next.col && this.gridRow === next.row) {
            this.walkPathIdx++;
            if (this.walkPathIdx >= this.walkPath.length) {
                this.walkingToTarget = false;
                this.sprite.isMoving = false;
                return;
            }
            return;
        }

        // Move toward next waypoint
        const dx = next.col - this.gridCol, dy = next.row - this.gridRow;
        const nc = this.gridCol + Math.sign(dx || 0);
        const nr = this.gridRow + Math.sign(dy || 0);

        if (dx !== 0) this.sprite.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
        else if (dy !== 0) this.sprite.direction = dy > 0 ? Direction.DOWN : Direction.UP;

        if (!GameMap.isSolid(nc, nr)) {
            this.gridCol = nc; this.gridRow = nr;
            this.sprite.x = nc * TILE_SIZE; this.sprite.y = nr * TILE_SIZE;
            this.sprite.isMoving = true;
        } else {
            // Skip this waypoint
            this.walkPathIdx++;
        }
    },

    followPlayer() {
        const history = Player.posHistory;
        if (history.length < this.followDelay + 1) return;
        const dist = Math.abs(this.gridCol - Player.gridCol) + Math.abs(this.gridRow - Player.gridRow);
        if (dist <= 2) { this.sprite.isMoving = false; return; }

        const target = history[history.length - this.followDelay - 1];
        if (!target || (this.gridCol === target.col && this.gridRow === target.row)) { this.sprite.isMoving = false; return; }
        if (target.col === Player.gridCol && target.row === Player.gridRow) return;

        let dx = target.col - this.gridCol, dy = target.row - this.gridRow;
        let nc = this.gridCol, nr = this.gridRow;
        if (Math.abs(dx) >= Math.abs(dy)) nc += Math.sign(dx); else nr += Math.sign(dy);

        if (nc > this.gridCol) this.sprite.direction = Direction.RIGHT;
        else if (nc < this.gridCol) this.sprite.direction = Direction.LEFT;
        else if (nr > this.gridRow) this.sprite.direction = Direction.DOWN;
        else this.sprite.direction = Direction.UP;

        const newDist = Math.abs(nc - Player.gridCol) + Math.abs(nr - Player.gridRow);
        if (newDist <= 1 || GameMap.isSolid(nc, nr)) { this.sprite.isMoving = false; return; }

        this.gridCol = nc; this.gridRow = nr;
        this.sprite.x = nc * TILE_SIZE; this.sprite.y = nr * TILE_SIZE;
        this.sprite.isMoving = true;
    },

    enterApartment() {
        this.gridCol = 17; this.gridRow = 9;
        this.sprite.x = this.gridCol*TILE_SIZE; this.sprite.y = this.gridRow*TILE_SIZE;
    },

    exitApartment() {
        this.gridCol = GameMap.doorCol; this.gridRow = GameMap.doorRow + 2;
        this.sprite.x = this.gridCol*TILE_SIZE; this.sprite.y = this.gridRow*TILE_SIZE;
    },

    draw(ctx, cx, cy) { this.sprite.draw(ctx, cx, cy); this.sprite.drawNameTag(ctx, cx, cy); }
};

const NPC = Companion;
