import { useEffect, useRef, useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   UFO SHOOTER — full-screen horizontal pixel-art space shooter
   ─ Destroy 20 UFO aliens (symbolising 20 years!) to win
   ─ UFOs shoot back at you!
   ─ 3 lives — lose them all and restart
   ─ Full viewport = arena
   ═══════════════════════════════════════════════════════════════════════════ */

const TARGET_KILLS = 20;
const MAX_LIVES = 3;
const INVINCIBLE_TIME = 1.6;
const PS = 6; // pixel scale for sprites — BIG chunky pixel art

// ─── Game audio (placeholder — user will add their own file) ──────────────
// Drop your game music file into public/audio/ and update the path below:
const GAME_AUDIO_SRC = '/audio/game-bgm.mp3'; // ← GANTI DENGAN FILE AUDIO GAME KAMU

// ─── Sprites ──────────────────────────────────────────────────────────────
const ROCKET_SPRITE = [
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0], // Ujung moncong
  [0, 0, 0, 0, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0], // Moncong pesawat
  [0, 0, 0, 0, 0, 0, 1, 3, 3, 1, 0, 0, 0, 0, 0, 0], // Aksen pink di moncong
  [0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0], // Bodi depan
  [0, 0, 0, 0, 0, 1, 2, 4, 4, 2, 1, 0, 0, 0, 0, 0], // Kaca kokpit depan
  [0, 0, 0, 0, 1, 3, 2, 4, 4, 2, 3, 1, 0, 0, 0, 0], // Kokpit & pangkal sayap pink
  [0, 0, 0, 0, 1, 3, 2, 2, 2, 2, 3, 1, 0, 0, 0, 0], // Bodi tengah
  [0, 0, 0, 1, 3, 3, 1, 2, 2, 1, 3, 3, 1, 0, 0, 0], // Sayap mulai melebar
  [0, 0, 1, 3, 3, 3, 1, 2, 2, 1, 3, 3, 3, 1, 0, 0], // Sayap utama pink
  [0, 1, 3, 3, 2, 2, 2, 1, 1, 2, 2, 2, 3, 3, 1, 0], // Bodi belakang & ujung sayap
  [1, 3, 3, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 3, 3, 1], // Detail lekukan sayap
  [1, 3, 2, 2, 1, 0, 1, 3, 3, 1, 0, 1, 2, 2, 3, 1], // Meriam sayap & aksen mesin
  [1, 2, 2, 1, 0, 0, 1, 3, 3, 1, 0, 0, 1, 2, 2, 1], // Ujung laras meriam
  [1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1], // Garis tutup bodi belakang
  [0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0], // Api thruster utama
  [0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0]  // Ekor api thruster
];
const ROCKET_COLS = 16;
const ROCKET_ROWS = 16;

const ROCKET_COLORS = {
  1: '#ffffff', // Outline
  2: '#ff6b9d', // Main Pink
  3: '#be185d', // Pink Accent
  4: '#7dd3fc', // Cockpit
  5: '#fbbf24', // Thruster Fire (Amber/Yellow)
};

// Pixel-art heart for HUD lives (9×8, big chunky pixels)
const HEART_SPRITE = [
  '..hh.hh..',
  '.xxxxxxx.',
  'xxxxxxxxx',
  'xxxxxxxxx',
  '.xxxxxxx.',
  '..xxxxx..',
  '...xxx...',
  '....x....',
];
const HEART_COLORS_FULL = { x: '#ff6b9d', h: '#ffffff' };
const HEART_COLORS_EMPTY = { x: 'rgba(255,107,157,0.15)', h: 'rgba(255,255,255,0.06)' };

// UFO sprites
const UFO_SPRITES = [
  // Classic saucer (10×6)
  [
    '...GGGG...',
    '..GGGGGG..',
    'DDDDDDDDDD',
    '.LLDDDDLL.',
    '..LLLLLL..',
    '...LLLL...',
  ],
  // Small saucer (8×5)
  [
    '..GGGG..',
    '.GGGGGG.',
    'DDDDDDDD',
    '.LLDDLL.',
    '..LLLL..',
  ],
  // Alien fighter (8×6)
  [
    '..AAAA..',
    '.AAAAAA.',
    'AAGGGGAA',
    'AAAAAAAA',
    '.AALLAA.',
    '..AAAA..',
  ],
];

const UFO_COLORS = {
  G: '#4ade80',
  D: '#94a3b8',
  L: '#facc15',
  A: '#64748b',
};

const UFO_COLORS_ELITE = {
  G: '#ef4444',
  D: '#b91c1c',
  L: '#fca5a5',
  A: '#7f1d1d',
};



const EXPLOSION_FRAMES = [
  ['...x...', '..xxx..', '.xxxxx.', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'],
  ['..x.x..', '.x...x.', 'x.xxx.x', '..xxx..', 'x.xxx.x', '.x...x.', '..x.x..'],
  ['.x...x.', '..x.x..', '.......', 'x..x..x', '.......', '..x.x..', '.x...x.'],
];

// ─── Classic arcade SFX via Web Audio API ──────────────────────────────────
let _actx = null;
function getAudioCtx() {
  if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
  if (_actx.state === 'suspended') _actx.resume();
  return _actx;
}

function sfxShoot() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch { /* ignore */ }
}

function sfxExplode() {
  try {
    const ctx = getAudioCtx();
    // Noise burst
    const bufSize = Math.floor(ctx.sampleRate * 0.2);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(1200, ctx.currentTime);
    filt.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
    src.connect(filt).connect(gain).connect(ctx.destination);
    src.start(ctx.currentTime);
    src.stop(ctx.currentTime + 0.25);
  } catch { /* ignore */ }
}

function sfxHit() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.22);
  } catch { /* ignore */ }
}

function sfxGameOver() {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    [440, 370, 311, 261].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + i * 0.2);
      gain.gain.setValueAtTime(0.13, t + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t + i * 0.2);
      osc.stop(t + i * 0.2 + 0.28);
    });
  } catch { /* ignore */ }
}

function sfxWin() {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    [523, 659, 784, 1047, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + i * 0.12);
      gain.gain.setValueAtTime(0.1, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.2);
    });
  } catch { /* ignore */ }
}

function sfxEnemyShoot() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.14);
  } catch { /* ignore */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function drawSprite(ctx, sprite, x, y, scale, colorMap, time) {
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === '.' || ch === 0) continue;
      let color = colorMap[ch] || '#fff';
      if (ch === 'X' && time) {
        color = Math.sin(time * 20 + c * 3) > 0 ? '#ffe066' : '#ff8c00';
      }
      if (ch === 'L' && time) {
        const p = Math.sin(time * 6 + r + c * 2);
        color = p > 0.3 ? '#facc15' : p > -0.3 ? '#22d3ee' : '#ef4444';
      }
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x + c * scale), Math.floor(y + r * scale), scale, scale);
    }
  }
}

function drawExplosion(ctx, ex, scale, time) {
  const fi = Math.min(2, Math.floor(ex.age * 8));
  const frame = EXPLOSION_FRAMES[fi];
  if (!frame) return;
  ctx.globalAlpha = Math.max(0, 1 - ex.age * 2.5);
  for (let r = 0; r < frame.length; r++) {
    for (let c = 0; c < frame[r].length; c++) {
      if (frame[r][c] === '.') continue;
      ctx.fillStyle = Math.sin(time * 30 + r + c) > 0 ? '#ff8c00' : '#ffe066';
      ctx.fillRect(Math.floor(ex.x + c * scale), Math.floor(ex.y + r * scale), scale, scale);
    }
  }
  ctx.globalAlpha = 1;
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ─── Component ────────────────────────────────────────────────────────────
export default function AsteroidShooter({ onComplete, onStart }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const keysRef = useRef(new Set());
  const rafRef = useRef(null);
  const touchRef = useRef({ active: false, y: 0 });
  const [, setKills] = useState(0);
  const [, setLives] = useState(MAX_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [, setWon] = useState(false);
  const [started, setStarted] = useState(false);

  // Pre-game: wait for any key/tap to start
  // Delay 400ms so React/ReactFlow mount events don't accidentally trigger start
  useEffect(() => {
    if (started) return;
    let timer;
    const handler = (e) => {
      e.preventDefault();
      setStarted(true);
      if (onStart) onStart();
    };
    timer = setTimeout(() => {
      window.addEventListener('keydown', handler);
      window.addEventListener('click', handler);
      window.addEventListener('touchstart', handler, { passive: false });
    }, 400);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handler);
      window.removeEventListener('click', handler);
      window.removeEventListener('touchstart', handler);
    };
  }, [started, onStart]);



  // ─── State init ─────────────────────────────────────────────────────────
  const initState = useCallback((W, H) => ({
    W, H,
    px: 50,
    py: H / 2 - (ROCKET_ROWS * PS) / 2,
    speed: 320,
    bullets: [],
    bulletCooldown: 0,
    bulletRate: 0.13,
    burstRemaining: 5,
    burstCooldown: 0,
    ufos: [],
    enemyBullets: [],
    spawnTimer: 0.5,
    spawnInterval: 1.6,
    explosions: [],
    particles: [],
    kills: 0,
    lives: MAX_LIVES,
    invincibleTimer: 0,
    gameOver: false,
    won: false,
    fireworkTimer: 0,
  }), []);

  const resetGame = useCallback(() => {
    if (!canvasRef.current) return;
    stateRef.current = initState(canvasRef.current.width, canvasRef.current.height);
    setKills(0);
    setLives(MAX_LIVES);
    setGameOver(false);
    setWon(false);
  }, [initState]);

  // ─── Keyboard ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
        e.preventDefault();
        keysRef.current.add(e.key);
      }
    };
    const onUp = (e) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  // ─── Touch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;
    const c = canvasRef.current;
    if (!c) return;
    const onTS = (e) => { e.preventDefault(); touchRef.current = { active: true, y: e.touches[0].clientY }; keysRef.current.add(' '); };
    const onTM = (e) => { e.preventDefault(); touchRef.current.y = e.touches[0].clientY; };
    const onTE = () => { touchRef.current.active = false; keysRef.current.delete(' '); keysRef.current.delete('ArrowUp'); keysRef.current.delete('ArrowDown'); };
    c.addEventListener('touchstart', onTS, { passive: false });
    c.addEventListener('touchmove', onTM, { passive: false });
    c.addEventListener('touchend', onTE, { passive: true });
    return () => { c.removeEventListener('touchstart', onTS); c.removeEventListener('touchmove', onTM); c.removeEventListener('touchend', onTE); };
  }, [started]);

  // ─── Game loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let lastTs = null;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (!stateRef.current || stateRef.current.gameOver) {
        stateRef.current = initState(canvas.width, canvas.height);
      } else {
        stateRef.current.W = canvas.width;
        stateRef.current.H = canvas.height;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const frame = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      const time = ts / 1000;
      const st = stateRef.current;
      if (!st) { rafRef.current = requestAnimationFrame(frame); return; }

      const { W, H } = st;
      const keys = keysRef.current;
      const rW = ROCKET_COLS * PS;
      const rH = ROCKET_ROWS * PS;

      // ─── Touch → movement ────────────
      if (touchRef.current.active) {
        const rect = canvas.getBoundingClientRect();
        const relY = (touchRef.current.y - rect.top) / rect.height;
        const targetY = relY * H - rH / 2;
        keys.delete('ArrowUp'); keys.delete('ArrowDown');
        if (targetY < st.py - 6) keys.add('ArrowUp');
        else if (targetY > st.py + 6) keys.add('ArrowDown');
      }

      if (!st.gameOver && !st.won) {
        // ═══ UPDATE ════════════════════
        // ─── Player movement ───────────
        let dx = 0, dy = 0;
        if (keys.has('ArrowUp') || keys.has('w')) dy = -1;
        if (keys.has('ArrowDown') || keys.has('s')) dy = 1;
        if (keys.has('ArrowLeft') || keys.has('a')) dx = -1;
        if (keys.has('ArrowRight') || keys.has('d')) dx = 1;
        st.px += dx * st.speed * dt;
        st.py += dy * st.speed * dt;
        st.px = Math.max(PS, Math.min(W * 0.42, st.px));
        st.py = Math.max(PS, Math.min(H - rH - PS, st.py));

        // ─── Shooting ─────────────────
        st.bulletCooldown -= dt;
        st.burstCooldown -= dt;

        if (keys.has(' ') && st.bulletCooldown <= 0 && st.burstCooldown <= 0) {
          st.bullets.push({
            x: st.px + rW,
            y: st.py + rH / 2 - PS,
          });
          st.bulletCooldown = st.bulletRate;
          st.burstRemaining--;

          if (st.burstRemaining <= 0) {
            st.burstRemaining = 5;
            st.burstCooldown = 0.5; // ~2 beats delay
          }
          sfxShoot();
        }

        // ─── Update player bullets ────
        const bulletSpeed = 480;
        for (let i = st.bullets.length - 1; i >= 0; i--) {
          st.bullets[i].x += bulletSpeed * dt;
          if (st.bullets[i].x > W + 20) st.bullets.splice(i, 1);
        }

        // ─── Spawn UFOs ────────────────────────────────────────────────────────────
        if (st.kills < TARGET_KILLS) {
          st.spawnTimer -= dt;
          if (st.spawnTimer <= 0) {
            const si = Math.floor(Math.random() * UFO_SPRITES.length);
            const sprite = UFO_SPRITES[si];
            const uw = sprite[0].length * PS;
            const uh = sprite.length * PS;
            const isElite = st.kills >= 10 && Math.random() < 0.35 + (st.kills - 10) * 0.03;
            const baseSpeed = 70 + Math.random() * 50 + st.kills * 4;
            const alienHp = st.kills > 10 ? (isElite ? 4 : 3) : (isElite ? 3 : 2);
            st.ufos.push({
              x: W + 10,
              y: Math.random() * (H - uh - 40) + 20,
              speed: isElite ? baseSpeed * 1.4 : baseSpeed,
              sprite, w: uw, h: uh,
              elite: isElite,
              hp: alienHp,
              hpMax: alienHp,
              shootTimer: 0.6 + Math.random() * 1.0,
              shootInterval: Math.max(0.45, 2.0 - st.kills * 0.1) * (isElite ? 0.45 : 1),
              vDrift: (Math.random() - 0.5) * 65,
              seed: Math.floor(Math.random() * 1000),
            });
            st.spawnInterval = Math.max(0.25, 1.6 - st.kills * 0.075);
            st.spawnTimer = st.spawnInterval;
          }
        }




        // ─── Update invincibility ─────
        st.invincibleTimer = Math.max(0, st.invincibleTimer - dt);

        // ─── Update UFOs ──────────────
        const playerCy = st.py + rH / 2;

        for (let i = st.ufos.length - 1; i >= 0; i--) {
          const u = st.ufos[i];
          u.x -= u.speed * dt;
          const uCy = u.y + u.h / 2;
          const homing = u.elite ? 1.3 : 0.45;
          u.y += (playerCy - uCy) * homing * dt + u.vDrift * dt;
          u.y = Math.max(4, Math.min(H - u.h - 4, u.y));

          if (u.x < -u.w - 30) { st.ufos.splice(i, 1); continue; }

          // UFO shooting
          u.shootTimer -= dt;
          if (u.shootTimer <= 0 && u.x < W * 0.9 && st.enemyBullets.length < 22) {
            const tdx = st.px - u.x;
            const tdy = playerCy - uCy;
            const dist = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
            const bSpeed = 110 + st.kills * 4;
            st.enemyBullets.push({
              x: u.x, y: uCy - PS,
              vx: (tdx / dist) * bSpeed,
              vy: (tdy / dist) * bSpeed,
              elite: u.elite,
            });
            u.shootTimer = u.shootInterval;
            sfxEnemyShoot();
          }

          // Bullet → UFO collision
          let hit = false;
          for (let j = st.bullets.length - 1; j >= 0; j--) {
            const b = st.bullets[j];
            if (rectsOverlap(b.x, b.y - PS, PS * 3, PS * 2, u.x, u.y, u.w, u.h)) {
              hit = true;
              st.bullets.splice(j, 1);
              break;
            }
          }

          if (hit) {
            u.hp--;
            if (u.hp > 0) {
              // Shield flash for elite on 1st hit
              st.explosions.push({ x: u.x + u.w * 0.3, y: u.y + u.h * 0.3, age: 0, shield: true });
              sfxHit();
              continue;
            }
            st.explosions.push({ x: u.x, y: u.y, age: 0 });
            sfxExplode();
            for (let p = 0; p < 10; p++) {
              st.particles.push({
                x: u.x + u.w / 2, y: u.y + u.h / 2,
                vx: (Math.random() - 0.5) * 140,
                vy: (Math.random() - 0.5) * 140,
                life: 0.45 + Math.random() * 0.35,
                color: u.elite ? '#ef4444' : '#4ade80',
                size: PS,
              });
            }
            st.ufos.splice(i, 1);
            st.kills++;
            setKills(st.kills);
            if (st.kills >= TARGET_KILLS) {
              st.won = true; setWon(true); sfxWin();
              setTimeout(() => onComplete(), 4500);
            }
            continue;
          }

          // UFO → Player collision
          if (st.invincibleTimer <= 0 &&
            rectsOverlap(st.px, st.py, rW, rH, u.x, u.y, u.w, u.h)) {
            st.lives--;
            setLives(st.lives);
            st.invincibleTimer = INVINCIBLE_TIME;
            st.explosions.push({ x: u.x, y: u.y, age: 0 });
            st.ufos.splice(i, 1);
            sfxHit();
            if (st.lives <= 0) { st.gameOver = true; setGameOver(true); sfxGameOver(); }
          }
        }

        // ─── Update enemy bullets ─────
        for (let i = st.enemyBullets.length - 1; i >= 0; i--) {
          const eb = st.enemyBullets[i];
          eb.x += eb.vx * dt;
          eb.y += eb.vy * dt;
          if (eb.x < -20 || eb.x > W + 20 || eb.y < -20 || eb.y > H + 20) {
            st.enemyBullets.splice(i, 1);
            continue;
          }
          if (st.invincibleTimer <= 0 &&
            rectsOverlap(eb.x, eb.y, PS * 2, PS, st.px + PS, st.py + PS, rW - PS * 2, rH - PS * 2)) {
            st.lives--;
            setLives(st.lives);
            st.invincibleTimer = INVINCIBLE_TIME;
            st.enemyBullets.splice(i, 1);
            st.explosions.push({ x: st.px, y: st.py, age: 0 });
            sfxHit();
            if (st.lives <= 0) { st.gameOver = true; setGameOver(true); sfxGameOver(); }
          }
        }
      } // <--- END OF (!st.gameOver && !st.won) UPDATE BLOCK

      // ─── ALWAYS UPDATE VISUALS (even when game over/won, let explosions finish) ───
      // ─── Update explosions ────────
      for (let i = st.explosions.length - 1; i >= 0; i--) {
        st.explosions[i].age += dt;
        if (st.explosions[i].age > 0.5) st.explosions.splice(i, 1);
      }

      // ─── Update particles ─────────
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) st.particles.splice(i, 1);
      }

      // ─── Exhaust particles ────────────────────────────────────────
      if (!st.gameOver && !st.won) {
        if (Math.random() < 0.7) {
          st.particles.push({
            x: st.px - 2,
            y: st.py + rH / 2 + (Math.random() - 0.5) * rH * 0.5,
            vx: -50 - Math.random() * 40,
            vy: (Math.random() - 0.5) * 18,
            life: 0.2 + Math.random() * 0.2,
            color: Math.random() > 0.5 ? '#ff8c00' : '#ffe066',
            size: PS,
          });
        }
        if (Math.random() < 0.3) {
          st.particles.push({
            x: st.px - 5,
            y: st.py + rH / 2 + (Math.random() - 0.5) * rH * 0.7,
            vx: -20 - Math.random() * 15,
            vy: (Math.random() - 0.5) * 10,
            life: 0.3 + Math.random() * 0.3,
            color: 'rgba(100,80,90,0.4)',
            size: PS,
          });
        }
      }

      // ─── Fireworks (won state) ─────────
      if (st.won) {
        st.fireworkTimer -= dt;
        if (st.fireworkTimer <= 0) {
          const fx = W * 0.1 + Math.random() * W * 0.8;
          const fy = H * 0.1 + Math.random() * H * 0.45;
          const fwC = ['#ff6b9d', '#fbbf24', '#4ade80', '#60a5fa', '#c084fc', '#f472b6', '#facc15', '#34d399', '#fb923c', '#e879f9'];
          for (let p = 0; p < 35; p++) {
            const angle = (p / 35) * Math.PI * 2 + Math.random() * 0.4;
            const spd = 80 + Math.random() * 140;
            st.particles.push({
              x: fx, y: fy,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              life: 0.7 + Math.random() * 0.7,
              color: fwC[Math.floor(Math.random() * fwC.length)],
              size: PS * (1 + Math.random()),
            });
          }
          st.fireworkTimer = 0.25 + Math.random() * 0.35;
        }
        for (let i = st.particles.length - 1; i >= 0; i--) {
          const p = st.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 50 * dt;
          p.life -= dt;
          if (p.life <= 0) st.particles.splice(i, 1);
        }
      }

      // ═══ DRAW ══════════════════════════
      ctx.clearRect(0, 0, W, H);

      // ─── Big centered score ─────────
      const nearWin = st.kills >= 15;
      const scoreAlpha = nearWin
        ? 0.3 + Math.sin(time * 4) * 0.08
        : 0.12 + Math.sin(time * 2) * 0.03;
      const scoreSize = Math.floor(Math.min(W * 0.4, H * 0.6));
      ctx.font = `bold ${scoreSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = nearWin
        ? `rgba(255, 130, 200, ${scoreAlpha})`
        : `rgba(255, 200, 240, ${scoreAlpha})`;
      ctx.fillText(`${st.kills}`, W / 2, H / 2);

      // ─── Draw particles ─────────────
      for (const p of st.particles) {
        ctx.globalAlpha = Math.max(0, p.life * 3);
        ctx.fillStyle = p.color;
        const sz = p.size || PS;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), sz, sz);
      }
      ctx.globalAlpha = 1;

      // ─── Draw player bullets ────────
      const bw = PS * 3;
      const bh = PS;
      for (const b of st.bullets) {
        ctx.fillStyle = '#f9a8d4';
        ctx.fillRect(Math.floor(b.x), Math.floor(b.y), bw, bh);
        ctx.fillStyle = '#fff';
        ctx.fillRect(Math.floor(b.x + bw - PS), Math.floor(b.y), PS, bh);
      }

      // ─── Draw enemy bullets ─────────
      const ebw = PS * 2;
      const ebh = PS;
      for (const eb of st.enemyBullets) {
        ctx.fillStyle = eb.elite ? '#ef4444' : '#4ade80';
        ctx.fillRect(Math.floor(eb.x), Math.floor(eb.y), ebw, ebh);
        ctx.fillStyle = eb.elite ? '#fca5a5' : '#86efac';
        ctx.fillRect(Math.floor(eb.x), Math.floor(eb.y), Math.floor(ebw * 0.4), ebh);
      }

      // ─── Draw UFOs ─────────────────
      for (const u of st.ufos) {
        const colors = u.elite ? UFO_COLORS_ELITE : UFO_COLORS;
        drawSprite(ctx, u.sprite, u.x, u.y, PS, colors, time);
        if (u.elite) {
          // Elite shield bar (mini HP)
          if (u.hp > 0 && u.hpMax > 1) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(Math.floor(u.x), Math.floor(u.y - 8), u.w, 5);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(Math.floor(u.x), Math.floor(u.y - 8), Math.floor(u.w * u.hp / u.hpMax), 5);
          }
          ctx.globalAlpha = 0.15 + Math.sin(time * 8) * 0.1;
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(Math.floor(u.x - 2), Math.floor(u.y - 2), u.w + 4, u.h + 4);
          ctx.globalAlpha = 1;
        }
      }




      // ─── Draw player ───────────────
      if (!st.gameOver) {
        const visible = st.invincibleTimer <= 0 || Math.sin(time * 20) > 0;
        if (visible) {
          ctx.save();
          const rW = ROCKET_COLS * PS;
          const rH = ROCKET_ROWS * PS;
          // Move to center of ship for rotation
          ctx.translate(st.px + rW / 2, st.py + rH / 2);
          // Rotate 90 degrees clockwise (facing right)
          ctx.rotate(Math.PI / 2);
          // Draw sprite offset back
          drawSprite(ctx, ROCKET_SPRITE, -rW / 2, -rH / 2, PS, ROCKET_COLORS, time);
          ctx.restore();
        }
      }

      // ─── Draw explosions ────────────
      for (const ex of st.explosions) {
        drawExplosion(ctx, ex, PS * 2, time);
      }

      // ─── HUD — lives (top left, pixel hearts) ────
      {
        const hPS = Math.max(3, Math.floor(W * 0.004));
        const hW = HEART_SPRITE[0].length * hPS;
        const gap = 6;
        for (let i = 0; i < MAX_LIVES; i++) {
          const hCols = i < st.lives ? HEART_COLORS_FULL : HEART_COLORS_EMPTY;
          drawSprite(ctx, HEART_SPRITE, 16 + i * (hW + gap), 14, hPS, hCols, null);
        }
      }



      // ─── HUD — hint (top center) ───
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const hintSize = Math.max(11, Math.floor(W * 0.013));
      ctx.font = `${hintSize}px monospace`;
      ctx.fillStyle = 'rgba(255, 200, 240, 0.35)';
      ctx.fillText('kalahkan UFO alien! 🚀', W / 2, 16);

      // ─── HUD — controls hint (bottom center) ───
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(255, 220, 250, 0.2)';
      ctx.font = `${Math.max(10, Math.floor(W * 0.011))}px monospace`;
      ctx.fillText('↑ ↓ ← → gerak  ·  SPACE tembak  ·  📱 tap & geser', W / 2, H - 12);

      // ─── Win overlay + birthday text + fireworks ───────────────
      if (st.won) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const bdSz = Math.max(32, Math.floor(Math.min(W * 0.06, H * 0.1)));
        ctx.font = `bold ${bdSz}px monospace`;
        ctx.fillStyle = '#fce7f3';
        ctx.shadowColor = 'rgba(255, 107, 157, 0.9)';
        ctx.shadowBlur = 30;
        ctx.fillText('\u{1f382} YOU WIN! HAPPY BIRTHDAY \u{1f382}', W / 2, H / 2 - bdSz * 1.0);
        ctx.font = `bold ${Math.max(20, Math.floor(bdSz * 0.6))}px monospace`;
        ctx.fillStyle = '#f9a8d4';
        ctx.fillText('ke-20 sayangkuuu', W / 2, H / 2 - bdSz * 0.1);
        ctx.fillText('🎂🎂🎂🎂🎂🎂🎂🎂🎂🎂🎂🎂🎂🎂🎂🎂🎂🎂🎂🎂', W / 2, H / 2 + bdSz * 0.65);
        ctx.font = `${Math.max(14, Math.floor(bdSz * 0.4))}px monospace`;
        ctx.fillStyle = 'rgba(255, 220, 250, 0.75)';
      }

      // ─── Game over overlay ──────────
      if (st.gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const goFontMain = Math.max(22, Math.floor(Math.min(W * 0.038, H * 0.065)));
        ctx.font = `bold ${goFontMain}px monospace`;
        ctx.fillStyle = '#fca5a5';
        ctx.shadowColor = 'rgba(255, 100, 100, 0.6)';
        ctx.shadowBlur = 14;
        ctx.fillText('KAMU KAYAH :(', W / 2, H / 2 - 16);
        ctx.font = `${Math.max(12, Math.floor(goFontMain * 0.55))}px monospace`;
        ctx.fillStyle = 'rgba(255, 220, 250, 0.7)';
        ctx.fillText('tekan SPACE atau tap untuk main lagi', W / 2, H / 2 + 18);
        ctx.shadowBlur = 0;
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [started, initState, onComplete]);

  // ─── Restart on game over ──────────────────────────────────────────────
  useEffect(() => {
    if (!gameOver) return;
    const handler = (e) => {
      if (e.key === ' ' || e.type === 'click') { e.preventDefault(); resetGame(); }
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('click', handler);
    return () => { window.removeEventListener('keydown', handler); window.removeEventListener('click', handler); };
  }, [gameOver, resetGame]);

  return (
    <>
      {/* Pre-game instruction overlay */}
      {!started && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Press Start 2P", monospace',
          color: '#fce7f3', cursor: 'pointer', userSelect: 'none',
          overflow: 'hidden',
        }}>
          <style>{`
            @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
          `}</style>

          {/* Warning grid animated canvas */}
          <canvas
            ref={(cvs) => {
              if (!cvs || cvs._warnInit) return;
              cvs._warnInit = true;
              const ctx = cvs.getContext('2d');
              const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
              resize();
              window.addEventListener('resize', resize);
              const GRID = 48;
              let frame = 0;
              const loop = () => {
                if (!cvs.isConnected) return;
                frame++;
                const W = cvs.width, H = cvs.height;
                // Black base
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, W, H);
                // Scrolling red pixel grid
                const scroll = (frame * 0.6) % GRID;
                ctx.strokeStyle = 'rgba(180, 0, 0, 0.35)';
                ctx.lineWidth = 1;
                for (let y = -GRID + scroll; y < H + GRID; y += GRID) {
                  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
                }
                for (let x = 0; x < W; x += GRID) {
                  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
                }
                // Pulsing red warning vignette
                const pulse = 0.5 + 0.5 * Math.sin(frame * 0.09);
                const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, Math.max(W, H) * 0.8);
                grad.addColorStop(0, 'rgba(180,0,0,0)');
                grad.addColorStop(0.5, 'rgba(180,0,0,0)');
                grad.addColorStop(1, `rgba(200,0,0,${0.25 + pulse * 0.35})`);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, W, H);
                // Scanlines
                ctx.fillStyle = 'rgba(0,0,0,0.12)';
                for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
                requestAnimationFrame(loop);
              };
              requestAnimationFrame(loop);
            }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
          />

          {/* Pixel-art frosted panel, above canvas */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'rgba(8, 0, 0, 0.80)',
            border: '3px solid rgba(220, 30, 30, 0.7)',
            boxShadow: '4px 4px 0 #7f1d1d, inset 0 0 0 1px #450a0a, 0 0 30px rgba(220,0,0,0.25)',
            padding: 'clamp(18px,3vw,36px) clamp(22px,4vw,52px)',
            maxWidth: 'min(680px, 92vw)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.4rem',
          }}>
            <h1 style={{
              fontSize: 'clamp(13px, 2.4vw, 28px)', margin: 0,
              color: '#ff6b6b',
              textShadow: '0 0 16px rgba(255,107,107,0.9), 3px 3px 0 #7f1d1d',
              letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.6,
            }}>
              ⚠ DARURAT! ⚠<br />SELAMATKAN DUNIA!
            </h1>
            <div style={{
              fontSize: 'clamp(7px, 1.1vw, 11px)', lineHeight: 2.8,
              textAlign: 'left', color: 'rgba(255,210,210,0.9)',
              letterSpacing: '0.04em',
            }}>
              <div>[ ↑ ↓ ← → ] atau [ W A S D ] — gerak</div>
              <div>[ SPACE ] ————————————————— tembak</div>
              <div>[ tap &amp; geser ] ———————————— mobile</div>
              <div style={{ textAlign: 'center', marginTop: '8px', color: '#f87171' }}>kalahkan alien jahat! 👾</div>
              <div style={{ textAlign: 'center', color: 'rgba(255,170,170,0.55)', fontSize: 'clamp(6px,0.9vw,9px)' }}>kamu punya 3 nyawa — hindari peluru musuh</div>
            </div>
            <div style={{
              fontSize: 'clamp(8px, 1.2vw, 13px)',
              color: '#fbbf24',
              textShadow: '0 0 10px rgba(251,191,36,0.6), 2px 2px 0 #78350f',
              animation: 'pulse 1.0s ease-in-out infinite',
              textAlign: 'center', letterSpacing: '0.06em',
            }}>
              &gt; TEKAN APA SAJA UNTUK MULAI &lt;
            </div>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="game-canvas-fullscreen"
        tabIndex={0}
        style={{ display: started ? undefined : 'none' }}
      />
    </>
  );
}
