// game.js - Main game loop
const Game = {
    canvas: null, ctx: null, lastTime: 0,
    camera: { x: 0, y: 0 },
    keys: { up:false, down:false, left:false, right:false },

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        loadAssets();
        GameMap.init();
        this.waitForAssets();
    },

    resizeCanvas() {
        this.canvas.width = Math.min(window.innerWidth, 900);
        this.canvas.height = Math.min(window.innerHeight, 700);
        if (this.ctx) this.ctx.imageSmoothingEnabled = false;
    },

    waitForAssets() {
        if (Assets.isReady()) { this.startGame(); return; }
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#FFF'; this.ctx.font = '14px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('...טוען', this.canvas.width/2, this.canvas.height/2);
        this.ctx.fillText(Assets.loaded+'/'+Assets.total, this.canvas.width/2, this.canvas.height/2+24);
        this.ctx.textAlign = 'left';
        requestAnimationFrame(() => this.waitForAssets());
    },

    startGame() {
        Player.init();
        Companion.init();
        this.setupInput();
        // Start at character select
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    },

    setupInput() {
        document.addEventListener('keydown', (e) => {
            // Character select screen
            if (GameState.current === 'CHARACTER_SELECT' && !UI.dialogActive) {
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    GameState.charSelectIndex = 0; e.preventDefault(); return;
                }
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    GameState.charSelectIndex = 1; e.preventDefault(); return;
                }
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    if (GameState.charSelectIndex === 0) {
                        SFX.play('wrong', 0.5);
                        UI.showDialog('', 'המערכת זיהתה שאת לא מספיק מצחיקה כדי לשחק עם אדם. נא לבחור בשחקן השני');
                    } else {
                        SFX.play('select', 0.5);
                        SFX.playBGM('Pixelated_Odyssey.mp3', 0.15);
                        GameState.setState('OUTDOOR_START');
                    }
                    return;
                }
                return;
            }

            // Dialog dismiss in character select
            if (GameState.current === 'CHARACTER_SELECT' && UI.dialogActive) {
                if (e.key === ' ' || e.key === 'Enter') {
                    UI.advanceDialog(); e.preventDefault(); return;
                }
                return;
            }

            // Game over / end screen
            if (UI.gameOverActive && UI._gameOverBtn && (e.key === ' ' || e.key === 'Enter')) {
                location.reload(); return;
            }
            if (UI.endScreenActive && (e.key === ' ' || e.key === 'Enter')) {
                location.reload(); return;
            }

            // Pause menu
            if (UI.pauseActive) {
                if (e.key === 'Escape') { UI.togglePause(); e.preventDefault(); return; }
                if (e.key === 'ArrowUp' || e.key === 'w') { UI.pauseSelected = 0; e.preventDefault(); return; }
                if (e.key === 'ArrowDown' || e.key === 's') { UI.pauseSelected = 1; e.preventDefault(); return; }
                if (e.key === ' ' || e.key === 'Enter') {
                    if (UI.pauseSelected === 0) UI.togglePause(); // Resume
                    else location.reload(); // Restart
                    e.preventDefault(); return;
                }
                return;
            }

            // ESC to pause (when not in other menus)
            if (e.key === 'Escape' && !UI.keypadActive && !UI.whatsappActive && !UI.puzzleActive && !UI.dialogActive) {
                UI.togglePause(); e.preventDefault(); return;
            }

            // Keypad input
            if (UI.keypadActive) {
                if (e.key >= '0' && e.key <= '9') { UI.keypadInput(e.key); e.preventDefault(); return; }
                if (e.key === 'Backspace') { UI.keypadInput('del'); e.preventDefault(); return; }
                if (e.key === 'Enter') { UI.keypadSubmit(); e.preventDefault(); return; }
                if (e.key === 'Escape') { UI.keypadCancel(); e.preventDefault(); return; }
                return;
            }

            // WhatsApp input
            if (UI.whatsappActive) {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { UI.whatsappUp(); e.preventDefault(); }
                if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { UI.whatsappDown(); e.preventDefault(); }
                if (e.key === ' ' || e.key === 'Enter') { UI.whatsappSelect(); e.preventDefault(); }
                return;
            }

            // Puzzle input
            if (UI.puzzleActive) {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { UI.puzzleUp(); e.preventDefault(); }
                if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { UI.puzzleDown(); e.preventDefault(); }
                if (e.key === ' ' || e.key === 'Enter') { UI.puzzleSelect(); e.preventDefault(); }
                return;
            }

            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W': e.preventDefault(); this.keys.up = true; break;
                case 'ArrowDown': case 's': case 'S': e.preventDefault(); this.keys.down = true; break;
                case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); this.keys.left = true; break;
                case 'ArrowRight': case 'd': case 'D': e.preventDefault(); this.keys.right = true; break;
                case ' ': case 'Enter': e.preventDefault(); Player.interact(); break;
                case 'Escape': e.preventDefault(); if (UI.menuActive) UI.menuCancel(); break;
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

        // Mouse clicks for keypad
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            if (UI.gameOverActive) { UI.handleGameOverClick(mx, my); return; }
            if (UI.endScreenActive) { UI.handleEndScreenClick(mx, my); return; }
            if (UI.keypadActive) UI.handleKeypadClick(mx, my);
        });

        // Touch
        let tx = 0, ty = 0;
        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); tx = e.touches[0].clientX; ty = e.touches[0].clientY; });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
            if (Math.sqrt(dx*dx+dy*dy) < 20) {
                if (UI.keypadActive) {
                    const rect = this.canvas.getBoundingClientRect();
                    UI.handleKeypadClick(e.changedTouches[0].clientX - rect.left, e.changedTouches[0].clientY - rect.top);
                } else Player.interact();
                return;
            }
            if (Math.abs(dx) > Math.abs(dy)) this.simMove(dx>0?'right':'left');
            else this.simMove(dy>0?'down':'up');
        });
    },

    simMove(d) { this.keys[d] = true; setTimeout(() => this.keys[d] = false, 150); },

    gameLoop(ts) {
        const dt = Math.min(ts - this.lastTime, 50);
        this.lastTime = ts;

        Player.update(dt, this.keys);
        Companion.update(dt);
        UI.update(dt);

        // Camera
        const tcx = Player.sprite.x - this.canvas.width/2 + TILE_SIZE/2;
        const tcy = Player.sprite.y - this.canvas.height/2 + TILE_SIZE/2;
        this.camera.x += (tcx - this.camera.x) * 0.1;
        this.camera.y += (tcy - this.camera.y) * 0.1;
        const ms = GameMap.getMapSize();
        this.camera.x = Math.max(0, Math.min(this.camera.x, ms.cols*TILE_SIZE - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, ms.rows*TILE_SIZE - this.canvas.height));

        // Render
        const ctx = this.ctx;
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        GameMap.draw(ctx, this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);

        const chars = [
            {obj:Player, y:Player.sprite.y},
            {obj:Companion, y:Companion.sprite.y}
        ].sort((a,b) => a.y - b.y);
        for (const c of chars) c.obj.draw(ctx, this.camera.x, this.camera.y);

        UI.draw(ctx, this.canvas.width, this.canvas.height);
        requestAnimationFrame((t) => this.gameLoop(t));
    }
};

window.addEventListener('load', () => Game.init());
