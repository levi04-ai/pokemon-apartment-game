// ui.js - UI elements, dialog system, and menus
const UI = {
    dialogActive: false,
    dialogText: '',
    dialogSpeaker: '',
    dialogQueue: [],
    dialogCharIndex: 0,
    dialogTimer: 0,
    dialogSpeed: 30,
    dialogFullyShown: false,
    dialogOnComplete: null,

    menuActive: false,
    menuItems: [],
    menuSelectedIndex: 0,
    menuCallback: null,
    menuTitle: '',

    notification: null,
    notificationTimer: 0,
    currentRoom: '',

    // Intercom keypad
    keypadActive: false,
    keypadCode: '',
    keypadCorrectCode: '9898',
    keypadCallback: null,
    keypadSelectedBtn: 4, // Start on '5' (center)
    keypadButtons: ['1','2','3','4','5','6','7','8','9','🔑','0','⌫'],

    showDialog(speaker, text, onComplete) {
        if (Array.isArray(text)) {
            this.dialogQueue = text.map((t, i) => ({
                speaker, text: t,
                onComplete: i === text.length - 1 ? onComplete : null
            }));
            const first = this.dialogQueue.shift();
            this._startDialog(first.speaker, first.text, first.onComplete);
        } else {
            this.dialogQueue = [];
            this._startDialog(speaker, text, onComplete);
        }
    },

    _startDialog(speaker, text, onComplete) {
        this.dialogActive = true;
        this.dialogSpeaker = speaker;
        this.dialogText = text;
        this.dialogCharIndex = 0;
        this.dialogTimer = 0;
        this.dialogFullyShown = false;
        this.dialogOnComplete = onComplete || null;
    },

    advanceDialog() {
        if (!this.dialogActive) return;
        if (!this.dialogFullyShown) {
            this.dialogCharIndex = this.dialogText.length;
            this.dialogFullyShown = true;
            return;
        }
        if (this.dialogQueue.length > 0) {
            const next = this.dialogQueue.shift();
            this._startDialog(next.speaker, next.text, next.onComplete);
        } else {
            this.dialogActive = false;
            if (this.dialogOnComplete) this.dialogOnComplete();
        }
    },

    // Keypad methods
    showKeypad(callback) {
        this.keypadActive = true;
        this.keypadCode = '';
        this.keypadSelectedBtn = 4;
        this.keypadCallback = callback;
    },

    keypadMove(dir) {
        if (!this.keypadActive) return;
        const cols = 3;
        const rows = 4;
        let col = this.keypadSelectedBtn % cols;
        let row = Math.floor(this.keypadSelectedBtn / cols);
        if (dir === 'up') row = (row - 1 + rows) % rows;
        if (dir === 'down') row = (row + 1) % rows;
        if (dir === 'left') col = (col - 1 + cols) % cols;
        if (dir === 'right') col = (col + 1) % cols;
        this.keypadSelectedBtn = row * cols + col;
    },

    keypadPress() {
        if (!this.keypadActive) return;
        const btn = this.keypadButtons[this.keypadSelectedBtn];
        if (btn === '⌫') {
            this.keypadCode = this.keypadCode.slice(0, -1);
        } else if (btn === '🔑') {
            // Submit code
            const correct = this.keypadCode === this.keypadCorrectCode;
            this.keypadActive = false;
            if (this.keypadCallback) this.keypadCallback(correct, this.keypadCode);
        } else {
            if (this.keypadCode.length < 6) {
                this.keypadCode += btn;
            }
        }
    },

    keypadCancel() {
        this.keypadActive = false;
        if (this.keypadCallback) this.keypadCallback(false, '');
    },

    drawKeypad(ctx, canvasWidth, canvasHeight) {
        const padW = 220;
        const padH = 320;
        const padX = canvasWidth / 2 - padW / 2;
        const padY = canvasHeight / 2 - padH / 2;

        // Background
        ctx.fillStyle = 'rgba(5, 5, 20, 0.95)';
        ctx.beginPath();
        ctx.roundRect(padX, padY, padW, padH, 12);
        ctx.fill();
        ctx.strokeStyle = '#5588CC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(padX, padY, padW, padH, 12);
        ctx.stroke();

        // Title
        ctx.font = 'bold 14px "Courier New"';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('🏠 אינטרקום', padX + padW / 2, padY + 22);

        // Code display
        const codeY = padY + 38;
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.roundRect(padX + 20, codeY, padW - 40, 32, 6);
        ctx.fill();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(padX + 20, codeY, padW - 40, 32, 6);
        ctx.stroke();

        // Show entered code as dots + last digit
        ctx.font = 'bold 20px "Courier New"';
        ctx.fillStyle = '#0F0';
        let displayCode = '';
        for (let i = 0; i < this.keypadCode.length; i++) {
            displayCode += this.keypadCode[i] + ' ';
        }
        if (displayCode === '') displayCode = '_ _ _ _';
        ctx.fillText(displayCode.trim(), padX + padW / 2, codeY + 23);

        // Buttons grid (3x4)
        const btnW = 52;
        const btnH = 42;
        const gapX = 10;
        const gapY = 8;
        const gridX = padX + (padW - 3 * btnW - 2 * gapX) / 2;
        const gridY = codeY + 44;

        for (let i = 0; i < this.keypadButtons.length; i++) {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const bx = gridX + col * (btnW + gapX);
            const by = gridY + row * (btnH + gapY);
            const isSelected = i === this.keypadSelectedBtn;

            // Button background
            if (isSelected) {
                ctx.fillStyle = '#3366AA';
            } else {
                ctx.fillStyle = '#222240';
            }
            ctx.beginPath();
            ctx.roundRect(bx, by, btnW, btnH, 6);
            ctx.fill();

            // Button border
            ctx.strokeStyle = isSelected ? '#88BBFF' : '#444466';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.beginPath();
            ctx.roundRect(bx, by, btnW, btnH, 6);
            ctx.stroke();

            // Button text
            ctx.font = 'bold 18px "Courier New"';
            ctx.fillStyle = isSelected ? '#FFF' : '#AAA';
            const btn = this.keypadButtons[i];
            if (btn === '🔑') {
                ctx.font = '22px "Courier New"';
                ctx.fillStyle = isSelected ? '#FFD700' : '#AA8800';
            }
            ctx.fillText(btn, bx + btnW / 2, by + btnH / 2 + 6);
        }

        // Hint
        ctx.font = '10px "Courier New"';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('חצים: תנועה | Enter: בחירה | Esc: ביטול', padX + padW / 2, padY + padH - 8);

        ctx.textAlign = 'left';
    },

    showMenu(title, items, callback) {
        this.menuActive = true;
        this.menuTitle = title;
        this.menuItems = items;
        this.menuSelectedIndex = 0;
        this.menuCallback = callback;
    },

    menuUp() { if (this.menuActive) this.menuSelectedIndex = (this.menuSelectedIndex - 1 + this.menuItems.length) % this.menuItems.length; },
    menuDown() { if (this.menuActive) this.menuSelectedIndex = (this.menuSelectedIndex + 1) % this.menuItems.length; },
    menuSelect() {
        if (!this.menuActive) return;
        const selected = this.menuItems[this.menuSelectedIndex];
        this.menuActive = false;
        if (this.menuCallback) this.menuCallback(selected, this.menuSelectedIndex);
    },
    menuCancel() { this.menuActive = false; },

    showNotification(text, duration) {
        this.notification = text;
        this.notificationTimer = duration || 2000;
    },

    update(deltaTime) {
        if (this.dialogActive && !this.dialogFullyShown) {
            this.dialogTimer += deltaTime;
            if (this.dialogTimer >= this.dialogSpeed) {
                this.dialogTimer = 0;
                this.dialogCharIndex++;
                if (this.dialogCharIndex >= this.dialogText.length) this.dialogFullyShown = true;
            }
        }
        if (this.notification) {
            this.notificationTimer -= deltaTime;
            if (this.notificationTimer <= 0) this.notification = null;
        }
    },

    draw(ctx, canvasWidth, canvasHeight) {
        this.drawZoneIndicator(ctx, canvasWidth);
        if (this.dialogActive) this.drawDialog(ctx, canvasWidth, canvasHeight);
        if (this.keypadActive) this.drawKeypad(ctx, canvasWidth, canvasHeight);
        if (this.menuActive) this.drawMenu(ctx, canvasWidth, canvasHeight);
        if (this.notification) this.drawNotification(ctx, canvasWidth);
        this.drawControls(ctx, canvasWidth, canvasHeight);
    },

    drawZoneIndicator(ctx, canvasWidth) {
        let zoneName = GameMap.currentZone === Zone.OUTSIDE ? 'חוץ' : 'הדירה של טל ואדם';
        if (GameMap.currentZone === Zone.APARTMENT && this.currentRoom) {
            zoneName = this.currentRoom;
        }
        ctx.font = 'bold 13px "Courier New"';
        const textW = ctx.measureText(zoneName).width;
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.beginPath();
        ctx.roundRect(canvasWidth / 2 - textW / 2 - 10, 4, textW + 20, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.fillText(zoneName, canvasWidth / 2, 20);
        ctx.textAlign = 'left';
    },

    drawDialog(ctx, canvasWidth, canvasHeight) {
        const boxH = 110;
        const boxY = canvasHeight - boxH - 12;
        const boxX = 12;
        const boxW = canvasWidth - 24;

        // Box background with rounded corners
        ctx.fillStyle = 'rgba(10, 10, 30, 0.92)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#5588CC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        ctx.stroke();

        // Inner border
        ctx.strokeStyle = 'rgba(100,150,220,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX + 4, boxY + 4, boxW - 8, boxH - 8, 6);
        ctx.stroke();

        // Speaker name
        if (this.dialogSpeaker) {
            ctx.font = 'bold 12px "Courier New"';
            const nameW = ctx.measureText(this.dialogSpeaker).width;
            ctx.fillStyle = 'rgba(10,10,30,0.95)';
            ctx.beginPath();
            ctx.roundRect(boxX + 10, boxY - 14, nameW + 20, 22, 5);
            ctx.fill();
            ctx.strokeStyle = '#5588CC';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(boxX + 10, boxY - 14, nameW + 20, 22, 5);
            ctx.stroke();
            ctx.fillStyle = '#FFD700';
            ctx.fillText(this.dialogSpeaker, boxX + 20, boxY + 3);
        }

        // Dialog text
        ctx.font = '13px "Courier New"';
        ctx.fillStyle = '#FFF';
        const displayText = this.dialogText.substring(0, this.dialogCharIndex);
        this.drawWrappedText(ctx, displayText, boxX + 14, boxY + 28, boxW - 28, 18);

        // Continue indicator
        if (this.dialogFullyShown) {
            if (Math.sin(Date.now() / 200) > 0) {
                ctx.fillStyle = '#5588CC';
                ctx.fillText('▼', boxX + boxW - 24, boxY + boxH - 12);
            }
        }
    },

    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        for (let word of words) {
            const testLine = line + word + ' ';
            if (ctx.measureText(testLine).width > maxWidth && line !== '') {
                ctx.textAlign = 'right';
                ctx.fillText(line.trim(), x + maxWidth, currentY);
                ctx.textAlign = 'left';
                line = word + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        if (line.trim()) {
            ctx.textAlign = 'right';
            ctx.fillText(line.trim(), x + maxWidth, currentY);
            ctx.textAlign = 'left';
        }
    },

    drawMenu(ctx, canvasWidth, canvasHeight) {
        const itemH = 30;
        const menuH = this.menuItems.length * itemH + 44;
        const menuW = 220;
        const menuX = canvasWidth / 2 - menuW / 2;
        const menuY = canvasHeight / 2 - menuH / 2;

        ctx.fillStyle = 'rgba(10, 10, 30, 0.95)';
        ctx.beginPath();
        ctx.roundRect(menuX, menuY, menuW, menuH, 8);
        ctx.fill();
        ctx.strokeStyle = '#5588CC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(menuX, menuY, menuW, menuH, 8);
        ctx.stroke();

        ctx.font = 'bold 14px "Courier New"';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText(this.menuTitle, canvasWidth / 2, menuY + 22);

        ctx.font = '13px "Courier New"';
        for (let i = 0; i < this.menuItems.length; i++) {
            const itemY = menuY + 34 + i * itemH;
            if (i === this.menuSelectedIndex) {
                ctx.fillStyle = 'rgba(85,136,204,0.25)';
                ctx.beginPath();
                ctx.roundRect(menuX + 6, itemY, menuW - 12, itemH, 4);
                ctx.fill();
                ctx.fillStyle = '#FFD700';
                ctx.fillText('► ' + this.menuItems[i], canvasWidth / 2, itemY + 20);
            } else {
                ctx.fillStyle = '#CCC';
                ctx.fillText(this.menuItems[i], canvasWidth / 2, itemY + 20);
            }
        }
        ctx.textAlign = 'left';
    },

    drawNotification(ctx, canvasWidth) {
        const alpha = Math.min(1, this.notificationTimer / 500);
        ctx.font = 'bold 14px "Courier New"';
        const textW = ctx.measureText(this.notification).width;
        ctx.fillStyle = `rgba(10,10,30,${0.8 * alpha})`;
        ctx.beginPath();
        ctx.roundRect(canvasWidth / 2 - textW / 2 - 12, 32, textW + 24, 28, 6);
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.textAlign = 'center';
        ctx.fillText(this.notification, canvasWidth / 2, 51);
        ctx.textAlign = 'left';
    },

    drawControls(ctx, canvasWidth, canvasHeight) {
        ctx.font = '10px "Courier New"';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText('חצים: תנועה | רווח/Enter: אינטרקציה | Esc: ביטול', 10, canvasHeight - 4);
    },

    isBlocking() { return this.dialogActive || this.menuActive || this.keypadActive; }
};
