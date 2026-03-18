// ui.js - Dialogue, Keypad, Puzzles, Hearts, HUD
const PIXEL_FONT = '"PublicPixel", "VT323", monospace';

const UI = {
    // Dialog
    dialogActive: false, dialogText: '', dialogSpeaker: '', dialogAvatar: null,
    dialogQueue: [], dialogCharIndex: 0, dialogTimer: 0, dialogSpeed: 25,
    dialogFullyShown: false, dialogOnComplete: null,

    // Keypad
    keypadActive: false, keypadCode: '', keypadCallback: null,

    // Puzzle
    puzzleActive: false, puzzleTitle: '', puzzleOptions: [], puzzleSelected: 0,
    puzzleCallback: null, puzzleContext: '', puzzleImage: null,

    // WhatsApp puzzle
    whatsappActive: false, whatsappSelected: 0, whatsappCallback: null,

    // Pause menu
    pauseActive: false,
    pauseSelected: 0,

    // Game over / End screen
    endScreenActive: false,
    gameOverActive: false,
    gameOverTimer: 0,

    // HUD
    currentRoom: '', notification: null, notificationTimer: 0,

    // ---- DIALOG ----
    showDialog(speaker, text, onComplete, avatar) {
        if (Array.isArray(text)) {
            this.dialogQueue = text.map((t, i) => ({
                speaker, text: t, avatar: avatar || null,
                onComplete: i === text.length - 1 ? onComplete : null
            }));
            const f = this.dialogQueue.shift();
            this._startDialog(f.speaker, f.text, f.onComplete, f.avatar);
        } else {
            this.dialogQueue = [];
            this._startDialog(speaker, text, onComplete, avatar || null);
        }
    },

    _startDialog(speaker, text, onComplete, avatar) {
        SFX.play('text', 0.3);
        this.dialogActive = true; this.dialogSpeaker = speaker;
        this.dialogText = text; this.dialogCharIndex = 0;
        this.dialogTimer = 0; this.dialogFullyShown = false;
        this.dialogOnComplete = onComplete || null;
        this.dialogAvatar = avatar || null;
    },

    advanceDialog() {
        if (!this.dialogActive) return;
        if (!this.dialogFullyShown) { this.dialogCharIndex = this.dialogText.length; this.dialogFullyShown = true; return; }
        if (this.dialogQueue.length > 0) {
            const n = this.dialogQueue.shift();
            this._startDialog(n.speaker, n.text, n.onComplete, n.avatar);
        } else { this.dialogActive = false; if (this.dialogOnComplete) this.dialogOnComplete(); }
    },

    // ---- KEYPAD ----
    showKeypad(callback) {
        this.keypadActive = true; this.keypadCode = ''; this.keypadCallback = callback;
    },

    keypadInput(num) {
        if (!this.keypadActive) return;
        SFX.play('click', 0.4);
        if (num === 'del') { this.keypadCode = this.keypadCode.slice(0, -1); }
        else if (num === 'key') {
            this.keypadCode += '🔑';
        }
        else if (this.keypadCode.replace(/🔑/g, '').length < 4) { this.keypadCode += num; }

        // Auto-check: if code matches, instantly unlock
        if (this.keypadCode === '🔑9898🔑') {
            SFX.play('door', 0.6);
            this.keypadActive = false;
            if (this.keypadCallback) this.keypadCallback(true);
        }
    },

    keypadSubmit() {
        if (!this.keypadActive) return;
        // Manual submit - check if correct
        const correct = this.keypadCode === '🔑9898🔑';
        if (!correct) {
            // Wrong code
            this.keypadActive = false;
            if (this.keypadCallback) this.keypadCallback(false);
        }
    },

    keypadCancel() { this.keypadActive = false; },

    // ---- PUZZLE ----
    showPuzzle(title, context, options, callback, image) {
        SFX.play('puzzle', 0.5);
        this.puzzleActive = true; this.puzzleTitle = title;
        this.puzzleContext = context; this.puzzleOptions = options;
        this.puzzleSelected = 0; this.puzzleCallback = callback;
        this.puzzleImage = image || null;
    },

    puzzleUp() { if (this.puzzleActive) this.puzzleSelected = (this.puzzleSelected - 1 + this.puzzleOptions.length) % this.puzzleOptions.length; },
    puzzleDown() { if (this.puzzleActive) this.puzzleSelected = (this.puzzleSelected + 1) % this.puzzleOptions.length; },
    puzzleSelect() {
        if (!this.puzzleActive) return;
        SFX.play('select', 0.4);
        const idx = this.puzzleSelected;
        this.puzzleActive = false;
        if (this.puzzleCallback) this.puzzleCallback(idx);
    },

    // ---- NOTIFICATION ----
    showNotification(text, dur) { this.notification = text; this.notificationTimer = dur || 2500; },

    // ---- UPDATE ----
    update(dt) {
        if (this.dialogActive && !this.dialogFullyShown) {
            this.dialogTimer += dt;
            if (this.dialogTimer >= this.dialogSpeed) {
                this.dialogTimer = 0; this.dialogCharIndex++;
                if (this.dialogCharIndex >= this.dialogText.length) this.dialogFullyShown = true;
            }
        }
        if (this.notification) { this.notificationTimer -= dt; if (this.notificationTimer <= 0) this.notification = null; }
    },

    // ---- DRAW ----
    draw(ctx, cw, ch) {
        if (typeof GameState !== 'undefined' && GameState.current === 'CHARACTER_SELECT') {
            this.drawCharacterSelect(ctx, cw, ch);
            if (this.dialogActive) this.drawDialog(ctx, cw, ch);
            return;
        }
        this.drawHearts(ctx, cw);
        this.drawRoomIndicator(ctx, cw);
        if (this.notification) this.drawNotification(ctx, cw);

        // Blackout overlay (goes under UI elements)
        if (typeof GameState !== 'undefined' && GameState.blackoutAlpha > 0) {
            ctx.fillStyle = `rgba(0,0,0,${GameState.blackoutAlpha})`;
            ctx.fillRect(0, 0, cw, ch);
        }

        // All UI overlays draw ON TOP of blackout
        if (this.keypadActive) this.drawKeypad(ctx, cw, ch);
        if (this.whatsappActive) this.drawWhatsApp(ctx, cw, ch);
        if (this.puzzleActive) this.drawPuzzle(ctx, cw, ch);
        if (this.dialogActive) this.drawDialog(ctx, cw, ch);
        if (this.endScreenActive) this.drawEndScreen(ctx, cw, ch);
        if (this.gameOverActive) this.drawGameOver(ctx, cw, ch);
        if (this.pauseActive) this.drawPause(ctx, cw, ch);
    },

    drawCharacterSelect(ctx, cw, ch) {
        // Dark background
        ctx.fillStyle = '#0a0a2e';
        ctx.fillRect(0, 0, cw, ch);

        // Stars background
        for (let i = 0; i < 50; i++) {
            const sx = (i * 137 + Math.sin(i * 0.7) * 100) % cw;
            const sy = (i * 97 + Math.cos(i * 0.5) * 80) % ch;
            const blink = 0.3 + Math.sin(Date.now() / 500 + i) * 0.3;
            ctx.fillStyle = `rgba(255,255,255,${blink})`;
            ctx.fillRect(sx, sy, 2, 2);
        }

        // Title
        ctx.font = '20px ' + PIXEL_FONT;
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('בחירת דמות', cw / 2, 60);

        // Two character boxes
        const boxW = 160, boxH = 200, gap = 60;
        const totalW = boxW * 2 + gap;
        const startX = cw / 2 - totalW / 2;
        const boxY = ch / 2 - boxH / 2 - 10;

        const chars = [
            { name: 'אדם', imgKey: 'adam' },
            { name: 'טל', imgKey: 'tal' }
        ];

        for (let i = 0; i < 2; i++) {
            const bx = startX + i * (boxW + gap);
            const selected = i === GameState.charSelectIndex;
            const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;

            // Box background
            ctx.fillStyle = selected ? `rgba(50,80,150,${pulse * 0.5})` : 'rgba(30,30,60,0.7)';
            ctx.beginPath(); ctx.roundRect(bx, boxY, boxW, boxH, 12); ctx.fill();

            // Border
            if (selected) {
                ctx.strokeStyle = `rgba(100,180,255,${pulse})`;
                ctx.lineWidth = 3;
            } else {
                ctx.strokeStyle = '#444466';
                ctx.lineWidth = 1;
            }
            ctx.beginPath(); ctx.roundRect(bx, boxY, boxW, boxH, 12); ctx.stroke();

            // Character image
            const charImg = Assets.get(chars[i].imgKey);
            if (charImg && charImg.complete && charImg.naturalWidth > 0) {
                const imgSize = 100;
                const imgX = bx + boxW / 2 - imgSize / 2;
                const imgY = boxY + 20;
                // Draw character (crop to show head+torso)
                const srcH = charImg.naturalHeight * 0.75;
                ctx.drawImage(charImg, 0, 0, charImg.naturalWidth, srcH, imgX, imgY, imgSize, imgSize);
            }

            // Name
            ctx.font = '16px ' + PIXEL_FONT;
            ctx.fillStyle = selected ? '#FFD700' : '#888';
            ctx.fillText(chars[i].name, bx + boxW / 2, boxY + boxH - 20);

            // Selector arrow
            if (selected) {
                const arrowY = boxY - 15 + Math.sin(Date.now() / 200) * 5;
                ctx.font = '20px ' + PIXEL_FONT;
                ctx.fillStyle = '#FFD700';
                ctx.fillText('▼', bx + boxW / 2, arrowY);
            }
        }

        // Instructions
        ctx.font = '12px ' + PIXEL_FONT;
        ctx.fillStyle = '#666';
        ctx.fillText('בחרו דמות עם החצים ולחצו Enter', cw / 2, ch - 40);
        ctx.textAlign = 'left';
    },

    drawHearts(ctx, cw) {
        if (typeof GameState === 'undefined') return;
        if (GameState.heartBlinking) {
            GameState.heartBlinkTimer -= 16;
            if (GameState.heartBlinkTimer <= 0) GameState.heartBlinking = false;
        }

        const heartImg = Assets.get('heart');
        const size = 40;
        for (let i = 0; i < 3; i++) {
            const hx = cw - 140 + i * 46, hy = 6;
            const alive = i < GameState.hearts;
            const justLost = !alive && i === GameState.hearts && GameState.heartBlinking;

            if (justLost) {
                const blink = Math.sin(Date.now() / 80) > 0;
                ctx.globalAlpha = blink ? 0.8 : 0.1;
                if (heartImg && heartImg.complete && heartImg.naturalWidth > 0) {
                    ctx.filter = 'grayscale(100%) brightness(0.5)';
                    ctx.drawImage(heartImg, hx, hy, size, size);
                    ctx.filter = 'none';
                } else {
                    ctx.font = '36px sans-serif';
                    ctx.fillText('💔', hx, hy + 32);
                }
                ctx.globalAlpha = 1;
            } else if (alive) {
                if (heartImg && heartImg.complete && heartImg.naturalWidth > 0) {
                    ctx.drawImage(heartImg, hx, hy, size, size);
                } else {
                    ctx.font = '36px sans-serif';
                    ctx.fillStyle = '#FF2222';
                    ctx.fillText('❤️', hx, hy + 32);
                }
            } else {
                ctx.globalAlpha = 0.2;
                if (heartImg && heartImg.complete && heartImg.naturalWidth > 0) {
                    ctx.drawImage(heartImg, hx, hy, size, size);
                } else {
                    ctx.font = '36px sans-serif';
                    ctx.fillStyle = '#444';
                    ctx.fillText('🖤', hx, hy + 32);
                }
                ctx.globalAlpha = 1;
            }
        }
    },

    drawRoomIndicator(ctx, cw) {
        // Removed - no room indicator
    },

    drawGoal(ctx, cw, ch) {
        // Removed - no bottom text
    },

    drawDialog(ctx, cw, ch) {
        // Measure text to size the box dynamically
        ctx.font = '28px ' + PIXEL_FONT;
        const displayText = this.dialogText.substring(0, this.dialogCharIndex);
        const maxTextW = cw - 120; // Leave room for avatar
        const lines = this._getWrappedLines(ctx, displayText, maxTextW);
        const lineH = 32;
        const textH = Math.max(1, lines.length) * lineH;

        const avatarSize = 50;
        const pad = 16;
        const bh = Math.max(avatarSize + pad * 2, textH + pad * 2 + 8);
        const bw = cw - 40;
        const bx = 20, by = ch - bh - 16;

        // Box background
        ctx.fillStyle = 'rgba(5,5,20,0.93)';
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12); ctx.fill();
        ctx.strokeStyle = '#5588CC'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12); ctx.stroke();

        // Avatar - show head nicely cropped
        let textEndX = bx + bw - pad;
        if (this.dialogAvatar) {
            const av = Assets.get(this.dialogAvatar);
            if (av && av.complete) {
                const avSize = 56;
                const avX = bx + pad, avY = by + (bh - avSize) / 2;
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(avX, avY, avSize, avSize, 10);
                ctx.clip();
                // Draw upper 60% of character (head + shoulders)
                const srcW = av.naturalWidth;
                const srcH = av.naturalHeight;
                const cropH = srcH * 0.6;
                ctx.drawImage(av, 0, 0, srcW, cropH, avX - 4, avY - 2, avSize + 8, avSize + 4);
                ctx.restore();
                // Border
                ctx.strokeStyle = '#5588CC'; ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(avX, avY, avSize, avSize, 10);
                ctx.stroke();
            }
        }

        // Speaker name
        const textX = bx + (this.dialogAvatar ? avatarSize + pad * 2 : pad);
        if (this.dialogSpeaker) {
            ctx.font = 'bold 22px ' + PIXEL_FONT;
            const nw = ctx.measureText(this.dialogSpeaker).width;
            ctx.fillStyle = 'rgba(5,5,20,0.95)';
            ctx.beginPath(); ctx.roundRect(textX, by - 16, nw + 20, 26, 6); ctx.fill();
            ctx.strokeStyle = '#5588CC'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(textX, by - 16, nw + 20, 26, 6); ctx.stroke();
            ctx.fillStyle = '#FFD700';
            ctx.fillText(this.dialogSpeaker, textX + 10, by + 5);
        }

        // Text
        ctx.font = '28px ' + PIXEL_FONT;
        ctx.fillStyle = '#FFF';
        ctx.direction = 'rtl'; ctx.textAlign = 'right';
        const textAreaW = textEndX - textX - pad;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], textEndX - pad, by + pad + 24 + i * lineH);
        }
        ctx.direction = 'ltr'; ctx.textAlign = 'left';

        // Continue arrow
        if (this.dialogFullyShown && Math.sin(Date.now()/200) > 0) {
            ctx.fillStyle = '#5588CC';
            ctx.font = '20px ' + PIXEL_FONT;
            ctx.fillText('▼', bx + bw - 28, by + bh - 8);
        }
    },

    _getWrappedLines(ctx, text, maxW) {
        const words = text.split(' ');
        const lines = [];
        let line = '';
        for (const w of words) {
            const test = line + w + ' ';
            if (ctx.measureText(test).width > maxW && line) {
                lines.push(line.trim());
                line = w + ' ';
            } else line = test;
        }
        if (line.trim()) lines.push(line.trim());
        return lines;
    },

    _wrapText(ctx, text, x, y, maxW, lh) {
        // RTL Hebrew text - draw from right
        ctx.direction = 'rtl';
        ctx.textAlign = 'right';
        const words = text.split(' ');
        let line = '', cy = y;
        for (const w of words) {
            const test = line + w + ' ';
            if (ctx.measureText(test).width > maxW && line) {
                ctx.fillText(line.trim(), x + maxW, cy);
                line = w + ' '; cy += lh;
            } else line = test;
        }
        if (line.trim()) ctx.fillText(line.trim(), x + maxW, cy);
        ctx.direction = 'ltr';
        ctx.textAlign = 'left';
    },

    drawKeypad(ctx, cw, ch) {
        const pw = 340, ph = 500, px = cw/2 - pw/2, py = ch/2 - ph/2;
        ctx.fillStyle = 'rgba(5,5,20,0.96)';
        ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 16); ctx.fill();
        ctx.strokeStyle = '#5588CC'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 16); ctx.stroke();

        // Title
        ctx.font = '28px ' + PIXEL_FONT; ctx.fillStyle = '#FFD700'; ctx.textAlign = 'center';
        ctx.fillText('🏠 אינטרקום', px+pw/2, py+38);

        // Code display
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(px+24, py+52, pw-48, 50, 8); ctx.fill();
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(px+24, py+52, pw-48, 50, 8); ctx.stroke();
        ctx.font = '30px ' + PIXEL_FONT; ctx.fillStyle = '#0F0';
        ctx.fillText(this.keypadCode || '_ _ _ _ _ _', px+pw/2, py+85);

        // Buttons
        const btns = ['1','2','3','4','5','6','7','8','9','🔑','0','⌫'];
        const bw = 80, bh = 62, gx = 14, gy = 12;
        const gridX = px + (pw - 3*bw - 2*gx) / 2;
        const gridY = py + 115;

        this._keypadBtns = [];
        for (let i = 0; i < btns.length; i++) {
            const col = i%3, row = Math.floor(i/3);
            const bx = gridX + col*(bw+gx), by_ = gridY + row*(bh+gy);
            ctx.fillStyle = '#222240';
            ctx.beginPath(); ctx.roundRect(bx, by_, bw, bh, 8); ctx.fill();
            ctx.strokeStyle = '#444466'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(bx, by_, bw, bh, 8); ctx.stroke();
            ctx.font = btns[i]==='🔑' ? '32px sans-serif' : '28px ' + PIXEL_FONT;
            ctx.fillStyle = btns[i]==='🔑' ? '#FFD700' : '#CCC';
            ctx.fillText(btns[i], bx+bw/2, by_+bh/2+10);

            this._keypadBtns[i] = {x:bx, y:by_, w:bw, h:bh, val: btns[i]};
        }

        // Submit button
        const sby = gridY + 4*(bh+gy) + 4;
        ctx.fillStyle = '#225522';
        ctx.beginPath(); ctx.roundRect(px+24, sby, pw-48, 46, 8); ctx.fill();
        ctx.strokeStyle = '#44AA44'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(px+24, sby, pw-48, 46, 8); ctx.stroke();
        ctx.font = '22px ' + PIXEL_FONT; ctx.fillStyle = '#FFF';
        ctx.fillText('אישור', px+pw/2, sby+32);
        this._keypadSubmitBtn = {x:px+24, y:sby, w:pw-48, h:46};

        ctx.textAlign = 'left';
    },

    handleKeypadClick(mx, my) {
        if (!this.keypadActive || !this._keypadBtns) return;
        for (const b of this._keypadBtns) {
            if (mx >= b.x && mx <= b.x+b.w && my >= b.y && my <= b.y+b.h) {
                if (b.val === '⌫') this.keypadInput('del');
                else if (b.val === '🔑') this.keypadInput('key');
                else this.keypadInput(b.val);
                return;
            }
        }
        if (this._keypadSubmitBtn) {
            const s = this._keypadSubmitBtn;
            if (mx >= s.x && mx <= s.x+s.w && my >= s.y && my <= s.y+s.h) {
                this.keypadSubmit();
            }
        }
    },

    drawPuzzle(ctx, cw, ch) {
        const pw = 500, ph = 440, px = cw/2 - pw/2, py = ch/2 - ph/2;
        ctx.fillStyle = 'rgba(5,5,20,0.96)';
        ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 12); ctx.fill();
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 12); ctx.stroke();

        // Title
        ctx.font = '24px ' + PIXEL_FONT; ctx.fillStyle = '#FFD700'; ctx.textAlign = 'center';
        ctx.fillText(this.puzzleTitle, px+pw/2, py+32);

        // Context
        ctx.font = '18px ' + PIXEL_FONT; ctx.fillStyle = '#CCC';
        this._wrapText(ctx, this.puzzleContext, px+20, py+60, pw-40, 24);

        // Options
        const optY = py + 170;
        ctx.font = '18px ' + PIXEL_FONT;
        for (let i = 0; i < this.puzzleOptions.length; i++) {
            const oy = optY + i * 44;
            const selected = i === this.puzzleSelected;
            ctx.fillStyle = selected ? 'rgba(85,136,204,0.3)' : 'rgba(30,30,50,0.5)';
            ctx.beginPath(); ctx.roundRect(px+16, oy, pw-32, 36, 6); ctx.fill();
            if (selected) { ctx.strokeStyle = '#88BBFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(px+16, oy, pw-32, 36, 6); ctx.stroke(); }
            ctx.fillStyle = selected ? '#FFD700' : '#AAA';
            ctx.textAlign = 'center';
            ctx.fillText((selected?'► ':'') + this.puzzleOptions[i], px+pw/2, oy+23);
        }
        ctx.textAlign = 'left';

        // Hearts indicator in puzzle
        ctx.font = '14px ' + PIXEL_FONT;
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < GameState.hearts ? '#FF2222' : '#444';
            ctx.fillText('♥', px + pw - 60 + i * 18, py + ph - 12);
        }
    },

    drawNotification(ctx, cw) {
        const a = Math.min(1, this.notificationTimer / 500);
        ctx.font = '11px ' + PIXEL_FONT;
        const tw = ctx.measureText(this.notification).width;
        ctx.fillStyle = `rgba(0,0,0,${0.7*a})`;
        ctx.beginPath(); ctx.roundRect(cw/2-tw/2-12, 32, tw+24, 26, 6); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.textAlign = 'center'; ctx.fillText(this.notification, cw/2, 50); ctx.textAlign = 'left';
    },

    togglePause() {
        if (this.gameOverActive || this.endScreenActive) return;
        if (GameState.current === 'CHARACTER_SELECT') return;
        this.pauseActive = !this.pauseActive;
        this.pauseSelected = 0;
    },

    drawPause(ctx, cw, ch) {
        // Dim background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, cw, ch);

        const pw = 280, ph = 200;
        const px = cw/2 - pw/2, py = ch/2 - ph/2;

        ctx.fillStyle = 'rgba(10,10,30,0.95)';
        ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 14); ctx.fill();
        ctx.strokeStyle = '#5588CC'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 14); ctx.stroke();

        ctx.font = '20px ' + PIXEL_FONT;
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('⏸ עצירה', px + pw/2, py + 35);

        const items = ['המשך משחק', 'התחל מחדש'];
        for (let i = 0; i < items.length; i++) {
            const iy = py + 65 + i * 55;
            const sel = i === this.pauseSelected;
            ctx.fillStyle = sel ? 'rgba(85,136,204,0.3)' : 'rgba(30,30,50,0.5)';
            ctx.beginPath(); ctx.roundRect(px+20, iy, pw-40, 42, 8); ctx.fill();
            if (sel) {
                ctx.strokeStyle = '#88BBFF'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.roundRect(px+20, iy, pw-40, 42, 8); ctx.stroke();
            }
            ctx.font = '16px ' + PIXEL_FONT;
            ctx.fillStyle = sel ? '#FFD700' : '#AAA';
            ctx.fillText((sel ? '► ' : '') + items[i], px+pw/2, iy + 28);
        }
        ctx.textAlign = 'left';
    },

    _tears: null,

    drawGameOver(ctx, cw, ch) {
        this.gameOverTimer += 16;

        // Stop music, play cry
        if (this.gameOverTimer < 50) {
            SFX.stopBGM();
            SFX.play('cry', 0.5);
        }
        // Loop cry every 3 seconds
        if (Math.floor(this.gameOverTimer / 3000) > Math.floor((this.gameOverTimer - 16) / 3000)) {
            SFX.play('cry', 0.4);
        }

        // Init tears
        if (!this._tears) {
            this._tears = [];
            for (let i = 0; i < 35; i++) {
                this._tears.push({
                    x: Math.random() * cw,
                    y: Math.random() * -ch,
                    speed: 1.5 + Math.random() * 3,
                    size: 12 + Math.random() * 18,
                    alpha: 0.3 + Math.random() * 0.4
                });
            }
        }

        // Black screen
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, cw, ch);

        // Falling tears
        for (const tear of this._tears) {
            tear.y += tear.speed;
            if (tear.y > ch + 20) { tear.y = -30; tear.x = Math.random() * cw; }
            ctx.globalAlpha = tear.alpha;
            ctx.font = tear.size + 'px sans-serif';
            ctx.fillText('💧', tear.x, tear.y);
        }
        ctx.globalAlpha = 1;

        // Tal on the floor - shaking as if crying
        const talImg = Assets.get('tal');
        if (talImg && talImg.complete && talImg.naturalWidth > 0) {
            const tw = 140, th = Math.round(140 * (talImg.naturalHeight / talImg.naturalWidth));
            // Shake effect - trembling
            const shakeX = Math.sin(Date.now() / 50) * 3;
            const shakeY = Math.abs(Math.sin(Date.now() / 80)) * 2;
            // Draw rotated slightly (sitting/collapsed)
            ctx.save();
            ctx.translate(cw/2 + shakeX, ch/2 - 30 + shakeY);
            ctx.rotate(Math.sin(Date.now() / 200) * 0.05); // Subtle rocking
            ctx.drawImage(talImg, -tw/2, -th/2, tw, th);
            ctx.restore();

            // Tear drops from her eyes
            for (let t = 0; t < 3; t++) {
                const tearY = (Date.now() / 300 + t * 100) % 60;
                ctx.globalAlpha = 1 - tearY / 60;
                ctx.font = '14px sans-serif';
                ctx.fillText('💧', cw/2 - 15 + t * 15 + Math.sin(Date.now()/400+t)*3, ch/2 - 50 + tearY);
            }
            ctx.globalAlpha = 1;
        }

        // Text fades in
        const alpha = Math.min(1, this.gameOverTimer / 1500);
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';

        ctx.font = '32px ' + PIXEL_FONT;
        ctx.fillStyle = '#FFF';
        ctx.fillText('נגמרו הלבבות', cw/2, ch/2 + 40);

        ctx.font = '20px ' + PIXEL_FONT;
        ctx.fillStyle = '#CCC';
        ctx.fillText('אגב, לא אמרתי אבל כל הפסד כזה', cw/2, ch/2 + 90);
        ctx.fillText('זה עוד 5 דקות מסאג׳ שאת חייבת לי', cw/2, ch/2 + 120);
        ctx.globalAlpha = 1;

        // Retry button (after 3 seconds) - glowing style
        if (this.gameOverTimer > 3000) {
            const btnPulse = 0.7 + Math.sin(Date.now() / 300) * 0.3;
            const btnW = 240, btnH = 55;
            const btnX = cw/2-btnW/2, btnY = ch/2 + 170;

            // Glow behind button
            const btnGrd = ctx.createRadialGradient(cw/2, btnY+btnH/2, 0, cw/2, btnY+btnH/2, btnW*0.7);
            btnGrd.addColorStop(0, `rgba(100,150,255,${btnPulse*0.2})`);
            btnGrd.addColorStop(1, 'rgba(100,150,255,0)');
            ctx.fillStyle = btnGrd;
            ctx.fillRect(btnX-30, btnY-15, btnW+60, btnH+30);

            // Button
            ctx.fillStyle = `rgba(30,50,100,${btnPulse*0.8})`;
            ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 12); ctx.fill();
            ctx.strokeStyle = `rgba(100,180,255,${btnPulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 12); ctx.stroke();

            ctx.font = '22px ' + PIXEL_FONT;
            ctx.fillStyle = '#FFF';
            ctx.fillText('נסי שוב', cw/2, btnY + 36);
            this._gameOverBtn = {x:btnX,y:btnY,w:btnW,h:btnH};
        }
        ctx.textAlign = 'left';
    },

    handleGameOverClick(mx, my) {
        if (!this.gameOverActive || !this._gameOverBtn) return;
        const b = this._gameOverBtn;
        if (mx >= b.x && mx <= b.x+b.w && my >= b.y && my <= b.y+b.h) {
            location.reload();
        }
    },

    drawEndScreen(ctx, cw, ch) {
        // Romantic gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, ch);
        grad.addColorStop(0, '#1a0a2e');
        grad.addColorStop(0.5, '#2d1b4e');
        grad.addColorStop(1, '#0a0a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);

        // Stars
        for (let i = 0; i < 80; i++) {
            const sx = (i * 137 + Math.sin(i*0.7)*100) % cw;
            const sy = (i * 97 + Math.cos(i*0.5)*80) % ch;
            const blink = 0.2 + Math.sin(Date.now()/600 + i) * 0.3;
            ctx.fillStyle = `rgba(255,255,255,${blink})`;
            ctx.fillRect(sx, sy, 2, 2);
        }

        // Floating hearts
        for (let i = 0; i < 12; i++) {
            const hx = cw/2 + Math.sin(Date.now()/1000 + i*0.8) * (100 + i*15);
            const hy = ch/2 + Math.cos(Date.now()/1200 + i*0.6) * (60 + i*10);
            const size = 16 + Math.sin(Date.now()/500 + i) * 4;
            ctx.font = size + 'px sans-serif';
            ctx.fillStyle = `rgba(255,100,100,${0.4 + Math.sin(Date.now()/400+i)*0.2})`;
            ctx.textAlign = 'center';
            ctx.fillText('❤', hx, hy);
        }

        // Characters
        const adamImg = Assets.get('adam');
        const talImg = Assets.get('tal');
        if (adamImg && adamImg.complete) ctx.drawImage(adamImg, cw/2 - 90, ch/2 - 50, 70, 100);
        if (talImg && talImg.complete) ctx.drawImage(talImg, cw/2 + 20, ch/2 - 50, 70, 100);

        // Big heart between them
        ctx.font = '40px sans-serif';
        ctx.fillStyle = '#FF4466';
        ctx.fillText('❤', cw/2, ch/2 - 20 + Math.sin(Date.now()/500) * 5);

        // Text
        ctx.font = '20px ' + PIXEL_FONT;
        ctx.fillStyle = '#FFD700';
        ctx.fillText('ומאז הם חיו באושר ועושר', cw/2, ch/2 + 90);
        ctx.fillText('לנצח נצחים', cw/2, ch/2 + 120);

        ctx.font = '12px ' + PIXEL_FONT;
        ctx.fillStyle = '#AAA';
        ctx.fillText('טל ואדם ❤', cw/2, ch - 50);

        // Play again button
        const btnW = 200, btnH = 36;
        const btnX = cw/2 - btnW/2, btnY = ch - 42;
        ctx.fillStyle = 'rgba(50,30,80,0.8)';
        ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 8); ctx.fill();
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 8); ctx.stroke();
        ctx.font = '14px ' + PIXEL_FONT;
        ctx.fillStyle = '#FFD700';
        ctx.fillText('🔄 משחק חדש', cw/2, btnY + 24);

        // Store button for click
        this._endScreenBtn = {x:btnX, y:btnY, w:btnW, h:btnH};

        ctx.textAlign = 'left';
    },

    handleEndScreenClick(mx, my) {
        if (!this.endScreenActive || !this._endScreenBtn) return false;
        const b = this._endScreenBtn;
        if (mx >= b.x && mx <= b.x+b.w && my >= b.y && my <= b.y+b.h) {
            location.reload();
            return true;
        }
        return false;
    },

    whatsappUp() { if (this.whatsappActive) this.whatsappSelected = (this.whatsappSelected - 1 + 4) % 4; },
    whatsappDown() { if (this.whatsappActive) this.whatsappSelected = (this.whatsappSelected + 1) % 4; },
    whatsappSelect() {
        if (!this.whatsappActive) return;
        SFX.play('select', 0.4);
        this.whatsappActive = false;
        if (this.whatsappCallback) this.whatsappCallback(this.whatsappSelected);
    },

    drawWhatsApp(ctx, cw, ch) {
        // Full screen overlay
        const pw = Math.min(cw - 20, 700), ph = Math.min(ch - 10, 650);
        const px = cw/2 - pw/2, py = ch/2 - ph/2;

        ctx.fillStyle = '#0b141a';
        ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 14); ctx.fill();

        // Header
        ctx.fillStyle = '#1f2c33';
        ctx.beginPath(); ctx.roundRect(px, py, pw, 56, [14,14,0,0]); ctx.fill();
        ctx.font = '28px ' + PIXEL_FONT;
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('💬 השלימי את החסר בשיחה', px + pw/2, py + 30);
        ctx.font = '20px ' + PIXEL_FONT;
        ctx.fillStyle = '#8696a0';
        ctx.fillText('שיחת וואטסאפ בין אדם לטל - 29.06.2021', px + pw/2, py + 52);

        // Messages
        const msgs = [
            { side: 'L', text: 'מה צריך להכין /להביא?', time: '22:43' },
            { side: 'R', text: '???', time: '' },
            { side: 'L', text: 'חחחחח', time: '22:44' },
            { side: 'R', text: 'אפשר לתבל ביין', time: '22:44' },
            { side: 'L', text: 'יין זה טוב\nשימי לב למלא סהרורים בימי שישי ערב\nשמגיעים לכיכר עם שקיות גדולות\nשהתוכן בקבוק יין', time: '22:44' },
            { side: 'R', text: 'רק מעדכנת שסיכוי גבוהה לארוחה חלבית', time: '22:44' },
        ];

        let msgY = py + 64;
        const msgPad = 6;
        const fontSize = 18;
        const lineH = 24;

        for (let m = 0; m < msgs.length; m++) {
            const msg = msgs[m];
            const isHidden = m === 1;
            const isRight = msg.side === 'R';
            const lines = msg.text.split('\n');
            const bubbleH = lines.length * lineH + 18;
            const maxBubbleW = pw * 0.75;

            ctx.font = fontSize + 'px ' + PIXEL_FONT;
            let bubbleW = 0;
            for (const l of lines) bubbleW = Math.max(bubbleW, ctx.measureText(l).width + 60);
            bubbleW = Math.min(bubbleW, maxBubbleW);

            const bubbleX = isRight ? px + pw - bubbleW - 14 : px + 14;

            if (isHidden) {
                // Purple pulsing bubble - bigger, wraps text nicely
                const pulse = 0.7 + Math.sin(Date.now()/300) * 0.3;
                const text = '❓  מה טל ענתה  ❓';
                ctx.font = '22px ' + PIXEL_FONT;
                const textW = ctx.measureText(text).width;
                const bW = textW + 40;
                const bH = 50;
                const bX = bubbleX + (bubbleW - bW) / 2;

                // Bubble background
                ctx.fillStyle = '#3a1050';
                ctx.beginPath(); ctx.roundRect(bX, msgY, bW, bH, 14); ctx.fill();
                // Pulsing border
                ctx.strokeStyle = `rgba(255,100,255,${pulse})`;
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.roundRect(bX, msgY, bW, bH, 14); ctx.stroke();
                // Text
                ctx.fillStyle = '#FF88FF';
                ctx.textAlign = 'center';
                ctx.fillText(text, bX + bW/2, msgY + bH/2 + 8);
            } else {
                ctx.fillStyle = isRight ? '#005c4b' : '#1f2c33';
                ctx.beginPath(); ctx.roundRect(bubbleX, msgY, bubbleW, bubbleH, 10); ctx.fill();

                ctx.font = fontSize + 'px ' + PIXEL_FONT;
                ctx.fillStyle = '#e9edef';
                ctx.textAlign = 'right';
                ctx.direction = 'rtl';
                for (let li = 0; li < lines.length; li++) {
                    ctx.fillText(lines[li], bubbleX + bubbleW - 10, msgY + 18 + li * lineH);
                }
                ctx.direction = 'ltr';

                if (msg.time) {
                    ctx.font = '11px ' + PIXEL_FONT;
                    ctx.fillStyle = '#8696a0';
                    ctx.textAlign = 'right';
                    ctx.fillText(msg.time + ' ✓✓', bubbleX + bubbleW - 8, msgY + bubbleH - 4);
                }
            }
            ctx.textAlign = 'left';
            msgY += bubbleH + msgPad + (isHidden ? 6 : 0);
        }

        // Answer options
        const optStartY = ph - 220;
        const optY = py + optStartY;
        ctx.font = '18px ' + PIXEL_FONT;
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('בחרי את התשובה הנכונה', px + pw/2, optY - 4);

        const options = [
            'שמחת חיים וחוש טעם בינוני',
            'יין לבן',
            'את עצמך',
            'אתה לא צריך להביא כלום העיקר שתגיע'
        ];

        for (let i = 0; i < options.length; i++) {
            const oy = optY + 8 + i * 48;
            const selected = i === this.whatsappSelected;

            ctx.fillStyle = selected ? 'rgba(0,92,75,0.7)' : 'rgba(31,44,51,0.8)';
            ctx.beginPath(); ctx.roundRect(px + 20, oy, pw - 40, 40, 10); ctx.fill();

            if (selected) {
                ctx.strokeStyle = '#25d366';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.roundRect(px + 20, oy, pw - 40, 40, 10); ctx.stroke();
            }

            ctx.font = '16px ' + PIXEL_FONT;
            ctx.fillStyle = selected ? '#25d366' : '#e9edef';
            ctx.textAlign = 'center';
            ctx.direction = 'rtl';
            ctx.fillText((selected ? '► ' : '') + options[i], px + pw/2, oy + 26);
            ctx.direction = 'ltr';
        }

        // Hearts
        ctx.font = '20px ' + PIXEL_FONT;
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < GameState.hearts ? '#FF2222' : '#444';
            ctx.fillText('♥', px + pw - 70 + i * 22, py + ph - 10);
        }
        ctx.textAlign = 'left';
    },

    isBlocking() { return this.dialogActive || this.keypadActive || this.puzzleActive || this.whatsappActive || this.pauseActive || this.gameOverActive || this.endScreenActive; }
};
