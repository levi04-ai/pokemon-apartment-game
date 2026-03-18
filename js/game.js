// game.js - Main game loop and initialization
const Game = {
    canvas: null,
    ctx: null,
    lastTime: 0,
    camera: { x: 0, y: 0 },
    keys: { up: false, down: false, left: false, right: false },

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false; // Keep pixel art crisp

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        loadAssets();
        GameMap.init();
        this.waitForAssets();
    },

    resizeCanvas() {
        const maxW = Math.min(window.innerWidth - 20, 900);
        const maxH = Math.min(window.innerHeight - 20, 650);
        this.canvas.width = maxW;
        this.canvas.height = maxH;
        if (this.ctx) this.ctx.imageSmoothingEnabled = false;
    },

    waitForAssets() {
        if (Assets.isReady()) {
            this.startGame();
        } else {
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '16px "Courier New"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('...טוען', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillText(`${Assets.loaded}/${Assets.total}`, this.canvas.width / 2, this.canvas.height / 2 + 24);
            this.ctx.textAlign = 'left';
            requestAnimationFrame(() => this.waitForAssets());
        }
    },

    startGame() {
        console.log('Assets loaded:', Assets.loaded, '/', Assets.total);
        console.log('outdoor_bg:', Assets.get('outdoor_bg')?.complete, Assets.get('outdoor_bg')?.naturalWidth);
        console.log('indoor_bg:', Assets.get('indoor_bg')?.complete, Assets.get('indoor_bg')?.naturalWidth);
        Player.init();
        Companion.init();
        this.setupInput();

        UI.showDialog('', [
            '.היי טל! לכי אל אדם, הוא מחכה ליד הבניין',
        ]);

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    },

    setupInput() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W':
                    e.preventDefault(); this.keys.up = true; break;
                case 'ArrowDown': case 's': case 'S':
                    e.preventDefault(); this.keys.down = true; break;
                case 'ArrowLeft': case 'a': case 'A':
                    e.preventDefault(); this.keys.left = true; break;
                case 'ArrowRight': case 'd': case 'D':
                    e.preventDefault(); this.keys.right = true; break;
                case ' ': case 'Enter':
                    e.preventDefault();
                    if (UI.keypadActive) { UI.keypadPress(); }
                    else { Player.interact(); }
                    break;
                case 'Escape':
                    e.preventDefault();
                    if (UI.keypadActive) UI.keypadCancel();
                    else if (UI.menuActive) UI.menuCancel();
                    break;
            }
            // Keypad navigation
            if (UI.keypadActive) {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') UI.keypadMove('up');
                if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') UI.keypadMove('down');
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') UI.keypadMove('left');
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') UI.keypadMove('right');
                // Direct number input
                if (e.key >= '0' && e.key <= '9') {
                    if (UI.keypadCode.length < 6) UI.keypadCode += e.key;
                }
                if (e.key === 'Backspace') {
                    UI.keypadCode = UI.keypadCode.slice(0, -1);
                }
            }
            if (UI.menuActive) {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') UI.menuUp();
                if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') UI.menuDown();
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W': this.keys.up = false; break;
                case 'ArrowDown': case 's': case 'S': this.keys.down = false; break;
                case 'ArrowLeft': case 'a': case 'A': this.keys.left = false; break;
                case 'ArrowRight': case 'd': case 'D': this.keys.right = false; break;
            }
        });

        // Touch support
        let touchStartX = 0, touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.sqrt(dx * dx + dy * dy) < 20) { Player.interact(); return; }
            if (Math.abs(dx) > Math.abs(dy)) {
                this.simulateMove(dx > 0 ? 'right' : 'left');
            } else {
                this.simulateMove(dy > 0 ? 'down' : 'up');
            }
        });
    },

    simulateMove(dir) {
        this.keys[dir] = true;
        setTimeout(() => { this.keys[dir] = false; }, 150);
    },

    gameLoop(timestamp) {
        const deltaTime = Math.min(timestamp - this.lastTime, 50);
        this.lastTime = timestamp;

        Player.update(deltaTime, this.keys);
        Companion.update(deltaTime);
        UI.update(deltaTime);

        // Camera
        const targetCamX = Player.sprite.x - this.canvas.width / 2 + TILE_SIZE / 2;
        const targetCamY = Player.sprite.y - this.canvas.height / 2 + TILE_SIZE / 2;
        this.camera.x += (targetCamX - this.camera.x) * 0.1;
        this.camera.y += (targetCamY - this.camera.y) * 0.1;

        const mapSize = GameMap.getMapSize();
        this.camera.x = Math.max(0, Math.min(this.camera.x, mapSize.cols * TILE_SIZE - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, mapSize.rows * TILE_SIZE - this.canvas.height));

        // Render
        const ctx = this.ctx;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        GameMap.draw(ctx, this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);

        // Characters sorted by Y
        const chars = [
            { obj: Player, y: Player.sprite.y },
            { obj: Companion, y: Companion.sprite.y }
        ].sort((a, b) => a.y - b.y);
        for (let c of chars) c.obj.draw(ctx, this.camera.x, this.camera.y);

        UI.draw(ctx, this.canvas.width, this.canvas.height);

        requestAnimationFrame((t) => this.gameLoop(t));
    }
};

window.addEventListener('load', () => Game.init());
