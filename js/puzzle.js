// puzzle.js - Complete game state machine + all puzzles
const GameState = {
    current: 'CHARACTER_SELECT',
    hearts: 3,
    goalText: '',
    charSelectIndex: 1,
    doorUnlocked: false,
    _bedroomTriggered: false,
    _finaleTriggered: false,
    _ruthTriggered: false,
    blackoutAlpha: 0, // For blackout effect

    setState(state) { this.current = state; console.log('State:', state); },

    // Adam walks to Tal, says something, then walks back to computer
    _adamComes(line1, line2) {
        Companion.gridCol = Player.gridCol + 1;
        Companion.gridRow = Player.gridRow;
        Companion.sprite.x = Companion.gridCol * TILE_SIZE;
        Companion.sprite.y = Companion.gridRow * TILE_SIZE;
        Companion.facePlayer();
        UI.showDialog('אדם', [line1, line2, 'אני צריך לחזור לעבוד, בהצלחה!'], () => {
            Companion.gridCol = Companion.homeCol;
            Companion.gridRow = Companion.homeRow;
            Companion.sprite.x = Companion.homeCol * TILE_SIZE;
            Companion.sprite.y = Companion.homeRow * TILE_SIZE;
            Companion.sprite.direction = Direction.UP;
        }, 'adam');
    },

    heartBlinkTimer: 0,
    heartBlinking: false,

    loseHeart() {
        this.hearts--;
        this.heartBlinking = true;
        this.heartBlinkTimer = 1500;
        SFX.play('heart_lost', 0.6);
        SFX.play('wrong', 0.4);
        if (this.hearts <= 0) {
            this.setState('GAME_OVER');
            UI.gameOverActive = true;
            UI.gameOverTimer = 0;
            return true;
        }
        return false;
    },

    // Phase 1: Adam greets Tal
    triggerAdamGreeting() {
        if (this.current !== 'OUTDOOR_START') return;
        this.setState('OUTDOOR_TALKED_ADAM');
        UI.showDialog('אדם', [
            'יום נישואים שמח מאמי',
            'אומנם קצת באיחור אבל אני עומד פה בחוץ כבר הרבה זמן וקר לי',
            'את זוכרת במקרה את הקוד לבניין?'
        ], () => {
            Companion.gridCol = GameMap.doorCol + 2;
            Companion.gridRow = GameMap.doorRow + 1;
            Companion.sprite.x = Companion.gridCol * TILE_SIZE;
            Companion.sprite.y = Companion.gridRow * TILE_SIZE;
            Companion.sprite.direction = Direction.DOWN;
        }, 'adam');
    },

    // Phase 2: Keypad
    triggerKeypad() {
        if (this.current !== 'OUTDOOR_TALKED_ADAM') return;
        this.setState('CODE_PAD_ACTIVE');
        SFX.play('puzzle', 0.5);
        UI.showKeypad((correct) => {
            if (correct) {
                this.setState('INDOOR_START');
                this.doorUnlocked = true;
                UI.showDialog('אינטרקום', ['הקוד נכון!', '...הדלת נפתחת'], () => {
                    Player.enterApartment();
                    this.triggerIndoorIntro();
                });
            } else {
                if (!this.loseHeart()) {
                    UI.showDialog('אינטרקום', '.קוד שגוי', () => { this.setState('OUTDOOR_TALKED_ADAM'); });
                }
            }
        });
    },

    // Phase 3: Indoor intro
    triggerIndoorIntro() {
        UI.showDialog('אדם', [
            'אני יודע שהבית קצת מבולגן אבל עוד מעט נפעיל את הרובוט אל תדאגי',
            'אבל זה לא הסיבה שאנחנו כאן',
            'הסיבה שאנחנו כאן היא שהכנתי לך הפתעה ונמצאת בחדר שינה',
            'אבל כדי שתגיעי לחדר שינה צריכה לעשות כמה משימות ולענות על כמה שאלות',
            'אז תצאי למרפסת, שם תחכה לך החידה הראשונה!'
        ], () => {
            // Walk to computer using A* pathfinding
            Companion.followMode = false;
            Companion.hintMode = true;
            Companion.gridCol = 20; Companion.gridRow = 20; Companion.sprite.x = 20*TILE_SIZE; Companion.sprite.y = 20*TILE_SIZE; Companion.sprite.direction = Direction.UP;
        }, 'adam');
    },

    // Phase 3.5: Adam encounter - play recording
    _encounterTriggered: false,
    _stepsSinceIndoor: 0,

    checkAdamEncounter() {
        if (this._encounterTriggered || this.current !== 'INDOOR_START') return;
        this._stepsSinceIndoor++;
        if (this._stepsSinceIndoor >= 5) {
            this._encounterTriggered = true;
            this.setState('ADAM_ENCOUNTER_ACTIVE');
            // Adam walks toward Tal
            Companion.walkToTarget(Player.gridCol + 1, Player.gridRow);
            // Wait for Adam to arrive then trigger dialogue
            const waitForAdam = setInterval(() => {
                const dist = Math.abs(Companion.gridCol - Player.gridCol) + Math.abs(Companion.gridRow - Player.gridRow);
                if (dist <= 2 || !Companion.walkingToTarget) {
                    clearInterval(waitForAdam);
                    Companion.facePlayer();
                    UI.showPuzzle('🎵', 'רוצה לשמוע משהו שהקלטתי?', ['כן', 'לא'], (idx) => {
                        if (idx === 0) {
                            // Play the recording
                            this.setState('PLAYING_RECORDING');
                            this.playGalilSong();
                            UI.showDialog('אדם', '🎵 מתנגן...', () => {
                                this.setState('INDOOR_START');
                                this._stepsSinceIndoor = 0;
                                Companion.walkToTarget(Companion.homeCol, Companion.homeRow);
                            }, 'adam');
                        } else {
                            UI.showDialog('אדם', 'טוב, אני במחשב', () => {
                                this.setState('INDOOR_START');
                                this._stepsSinceIndoor = 0;
                                Companion.walkToTarget(Companion.homeCol, Companion.homeRow);
                            }, 'adam');
                        }
                    });
                }
            }, 300);
        }
    },

    playGalilSong() {
        // Lower BGM while galil plays
        if (SFX.bgm) SFX.bgm.volume = 0.05;
        const audio = new Audio('galil_song.mp3');
        audio.volume = 0.7;
        audio.play().catch(() => {});
        audio.onended = () => {
            // Restore BGM volume
            if (SFX.bgm) SFX.bgm.volume = 0.15;
        };
    },

    // Phase 4: Balcony puzzle - WhatsApp
    triggerBalconyPuzzle() {
        if (this.current !== 'INDOOR_START') return;
        this.setState('BALCONY_ACTIVE');
        SFX.play('puzzle', 0.5);
        UI.whatsappActive = true;
        UI.whatsappSelected = 0;
        UI.whatsappCallback = (idx) => {
            if (idx === 2) { // Third option is correct
                SFX.play('correct', 0.5);
                this.setState('BALCONY_COMPLETE');
                this._adamComes('ענית נכון, מצוין!', 'עכשיו לכי למטבח, שם השאלה הבאה');
            } else {
                if (!this.loseHeart()) {
                    UI.showDialog('', '.לא נכון, נסי שוב', () => { this.setState('INDOOR_START'); });
                }
            }
        };
    },

    // Phase 5: Kitchen puzzle
    triggerKitchenPuzzle() {
        if (this.current !== 'BALCONY_COMPLETE' && this.current !== 'KITCHEN_ACTIVE') return;
        this.setState('KITCHEN_ACTIVE');
        SFX.play('puzzle', 0.5);
        UI.showPuzzle('☕ חידת המטבח', "מה הפירוש בערבית למילה ח'אל?",
            ['דוד של אבא', 'סבא מצד אמא', 'אח של סבתא', 'דוד של אמא'],
            (idx) => {
                if (idx === 3) {
                    SFX.play('correct', 0.5);
                    this.setState('KITCHEN_COMPLETE');
                    this._adamComes('מצוין!', 'עכשיו לכי לספרייה, ליד השטיח הירוק');
                } else {
                    if (!this.loseHeart()) {
                        UI.showDialog('', '.לא נכון, נסי שוב', () => { this.setState('BALCONY_COMPLETE'); });
                    }
                }
            }
        );
    },

    // Phase 6: Library puzzle - Parasha
    triggerLibraryPuzzle() {
        if (this.current !== 'KITCHEN_COMPLETE' && this.current !== 'LIBRARY_ACTIVE') return;
        this.setState('LIBRARY_ACTIVE');
        SFX.play('puzzle', 0.5);
        UI.showPuzzle('📚 חידת הספרייה', 'מה היא פרשת השבוע?',
            ['ויקרא', 'ויקהל', 'פקודי', 'כי תשא'],
            (idx) => {
                if (idx === 0) {
                    SFX.play('correct', 0.5);
                    this.setState('LIBRARY_COMPLETE');
                    this._adamComes('מצוין, ויקרא!', 'עכשיו לכי לחדר של רות');
                } else {
                    if (!this.loseHeart()) {
                        UI.showDialog('', '.לא נכון, נסי שוב', () => { this.setState('KITCHEN_COMPLETE'); });
                    }
                }
            }
        );
    },

    // Phase 7: Ruth's room - Ethnicity question
    triggerRuthPuzzle() {
        if (this._ruthTriggered) return;
        this._ruthTriggered = true;
        this.setState('RUTH_ROOM_ACTIVE');
        SFX.play('puzzle', 0.5);
        UI.showPuzzle('👶 חידת חדר רות', 'איזה עדה אדם?',
            ['עיראקי, ספרדי וטורקי', 'אשכנזי, תימני ומרוקאי', 'רוסי, ספרדי ואשכנזי', 'עיראקי, פרסי ופולני'],
            (idx) => {
                if (idx === 0) {
                    SFX.play('correct', 0.5);
                    this.setState('RUTH_ROOM_COMPLETE');
                    this._adamComes('ענית נכון, מצוין!', 'עכשיו את יכולה להיכנס לחדר השינה');
                } else {
                    this._ruthTriggered = false;
                    if (!this.loseHeart()) {
                        UI.showDialog('', '.לא נכון, נסי שוב', () => { this.setState('LIBRARY_COMPLETE'); });
                    }
                }
            }
        );
    },

    // Phase 8: Bedroom puzzle - Windows
    triggerBedroomPuzzle() {
        if (this._bedroomTriggered) return;
        this._bedroomTriggered = true;
        this.setState('BEDROOM_ACTIVE');
        SFX.play('puzzle', 0.5);
        UI.showPuzzle('🪟 חידת חדר השינה', 'כמה חלונות יש במרפסת שלנו?',
            ['9', '8', '7', '10'],
            (idx) => {
                if (idx === 0) {
                    SFX.play('correct', 0.5);
                    this.setState('BEDROOM_COMPLETE');
                    UI.showDialog('', 'כל הכבוד!', () => { this.triggerFinale(); });
                } else {
                    this._bedroomTriggered = false;
                    if (!this.loseHeart()) {
                        UI.showDialog('', '.לא נכון, לכי לספור!', () => { this.setState('RUTH_ROOM_COMPLETE'); });
                    }
                }
            }
        );
    },

    // Grand Finale
    triggerFinale() {
        // Adam appears near Tal
        Companion.gridCol = Player.gridCol + 1;
        Companion.gridRow = Player.gridRow;
        Companion.sprite.x = Companion.gridCol * TILE_SIZE;
        Companion.sprite.y = Companion.gridRow * TILE_SIZE;
        Companion.facePlayer();

        UI.showDialog('אדם', [
            'כל הכבוד מאמי!',
            'הצלחת לענות נכון על החידה האחרונה',
            'עכשיו אנחנו נחשיך את הבית ותגלי את ההפתעה'
        ], () => {
            this.startBlackout();
        }, 'adam');
    },

    startBlackout() {
        this.setState('FINALE_BLACKOUT_INIT');
        this.blackoutAlpha = 0;
        // Fade to black over 2 seconds
        const fadeIn = setInterval(() => {
            this.blackoutAlpha = Math.min(1, this.blackoutAlpha + 0.02);
            if (this.blackoutAlpha >= 0.95) {
                clearInterval(fadeIn);
                this.blackoutAlpha = 0.95;
                // Wait 5 seconds in darkness
                setTimeout(() => {
                    this.setState('FINALE_WAIT_LIGHTS');
                    UI.showDialog('', 'עכשיו את יכולה כבר להדליק את האור', () => {
                        UI.showPuzzle('💡', 'האם את רוצה להדליק את האור?', ['כן, להדליק!'], (idx) => {
                            this.lightsOn();
                        });
                    });
                }, 5000);
            }
        }, 50);
    },

    lightsOn() {
        this.setState('FINALE_LIGHTS_ON');
        SFX.play('victory', 0.7);
        // Fade blackout away
        const fadeOut = setInterval(() => {
            this.blackoutAlpha = Math.max(0, this.blackoutAlpha - 0.05);
            if (this.blackoutAlpha <= 0) {
                clearInterval(fadeOut);
                this.blackoutAlpha = 0;
                // Final dialogue
                UI.showDialog('אדם', [
                    'אני בעצם המתנה',
                    'כי בעצם מה יותר טוב ממני?',
                    'ואל דאגה, אביגיל ורות... אמא שלי משגיחה עליהם',
                    '❤️ אני אוהב אותך ❤️'
                ], () => {
                    this.setState('GAME_COMPLETE');
                    this.showEndScreen();
                }, 'adam');
            }
        }, 50);
    },

    showEndScreen() {
        UI.endScreenActive = true;
    },

    // Room triggers
    checkRoomTrigger(col, row) {
        if (GameMap.currentZone !== Zone.APARTMENT) return;
        const room = GameMap.getRoomName(col, row);

        // Balcony: chairs area
        if (room === 'מרפסת' && col >= 34 && row >= 5 && row <= 9 && this.current === 'INDOOR_START') {
            this.triggerBalconyPuzzle();
        }
        // Kitchen: tile floor area
        if (room === 'מטבח' && col >= 4 && col <= 10 && row >= 12 && row <= 15 &&
            (this.current === 'BALCONY_COMPLETE' || this.current === 'KITCHEN_ACTIVE')) {
            this.triggerKitchenPuzzle();
        }
        // Library: green bookshelf
        if (room === 'סלון' && row >= 11 && row <= 14 && col >= 20 && col <= 26 &&
            (this.current === 'KITCHEN_COMPLETE' || this.current === 'LIBRARY_ACTIVE')) {
            this.triggerLibraryPuzzle();
        }
        // Ruth's room
        if (room === 'חדר רות' && (this.current === 'LIBRARY_COMPLETE' || this.current === 'RUTH_ROOM_ACTIVE')) {
            this.triggerRuthPuzzle();
        }
        // Bedroom: after Ruth's room complete
        if (room === 'חדר שינה' && (this.current === 'RUTH_ROOM_COMPLETE' || this.current === 'BEDROOM_ACTIVE')) {
            this.triggerBedroomPuzzle();
        }
    }
};
