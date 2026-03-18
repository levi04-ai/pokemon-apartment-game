// tiles.js - Asset loading
const TILE_SIZE = 48;
const SRC_TILE = 16;

const Assets = {
    images: {},
    loaded: 0,
    total: 0,
    allLoaded: false,

    load(name, src) {
        this.total++;
        const img = new Image();
        img.onload = () => { this.loaded++; if (this.loaded >= this.total) this.allLoaded = true; };
        img.onerror = () => { console.warn('Failed: ' + src); this.loaded++; if (this.loaded >= this.total) this.allLoaded = true; };
        img.src = src;
        this.images[name] = img;
    },
    get(name) { return this.images[name]; },
    isReady() { return this.allLoaded || this.total === 0; }
};

// Sound effects manager
const SFX = {
    sounds: {},
    enabled: true,
    bgm: null,

    load(name, src) {
        const audio = new Audio();
        audio.src = src;
        audio.preload = 'auto';
        this.sounds[name] = audio;
    },

    play(name, volume) {
        if (!this.enabled) return;
        const snd = this.sounds[name];
        if (!snd) return;
        const clone = snd.cloneNode();
        clone.volume = volume || 0.5;
        clone.play().catch(() => {});
    },

    playBGM(src, volume) {
        if (this.bgm) { this.bgm.pause(); }
        this.bgm = new Audio(src);
        this.bgm.loop = true;
        this.bgm.volume = volume || 0.3;
        this.bgm.play().catch(() => {});
    },

    stopBGM() {
        if (this.bgm) { this.bgm.pause(); this.bgm = null; }
    }
};

function loadAssets() {
    Assets.load('outdoor_bg', 'outdoor.jpg');
    Assets.load('indoor_bg', 'indoor.jpg');
    Assets.load('adam', 'adam.png');
    Assets.load('tal', 'tal.png');
    Assets.load('heart', 'heart.png');
    Assets.load('whatsapp_chat', 'whatsapp_chat.jpg');

    // SFX
    SFX.load('click', 'sfx/click.wav');
    SFX.load('select', 'sfx/select.wav');
    SFX.load('correct', 'sfx/correct.wav');
    SFX.load('wrong', 'sfx/wrong.wav');
    SFX.load('door', 'sfx/door.wav');
    SFX.load('text', 'sfx/text.wav');
    SFX.load('heart_lost', 'sfx/heart_lost.wav');
    SFX.load('puzzle', 'sfx/puzzle.wav');
    SFX.load('step', 'sfx/step.wav');
    SFX.load('victory', 'sfx/victory.wav');
    SFX.load('cry', 'sfx/cry.wav');

    // BGM
    Assets.load('bgm', 'Pixelated_Odyssey.mp3');
}
