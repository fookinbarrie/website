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
// Rocket facing RIGHT (7 rows × 12 cols)
const ROCKET_SPRITE = [
  '........NN..',
  '..FBBBBBNNN.',
  '.FFBBWBBBNN.',
  'XXEBBBBBBBN.',
  '.FFBBWBBBNN.',
  '..FBBBBBNNN.',
  '........NN..',
];
const ROCKET_COLS = 12;
const ROCKET_ROWS = 7;

const ROCKET_COLORS = {
  N: '#ff6b9d',
  B: '#e8e0f0',
  W: '#7dd3fc',
  F: '#f472b6',
  E: '#9ca3af',
  X: '#ff8c00',
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
  D: '#78716c',
  L: '#fb923c',
  A: '#dc2626',
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
      if (ch === '.') continue;
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
export default function AsteroidShooter({ onComplete }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const keysRef = useRef(new Set());
  const rafRef = useRef(null);
  const touchRef = useRef({ active: false, y: 0 });
  const [kills, setKills] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);

  // Pre-game: wait for any key/tap to start
  useEffect(() => {
    if (started) return;
    const handler = (e) => {
      e.preventDefault();
      setStarted(true);
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('click', handler);
    window.addEventListener('touchstart', handler, { passive: false });
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('click', handler);
      window.removeEventListener('touchstart', handler);
    };
  }, [started]);

  // Computed sizes based on PS
  const rocketW = ROCKET_COLS * PS;
  const rocketH = ROCKET_ROWS * PS;

  // ─── State init ─────────────────────────────────────────────────────────
  const initState = useCallback((W, H) => ({
    W, H,
    px: 50,
    py: H / 2 - (ROCKET_ROWS * PS) / 2,
    speed: 320,
    bullets: [],
    bulletCooldown: 0,
    bulletRate: 0.13,
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
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' '].includes(e.key)) {
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
        if (keys.has(' ') && st.bulletCooldown <= 0) {
          st.bullets.push({
            x: st.px + rW,
            y: st.py + rH / 2 - PS,
          });
          st.bulletCooldown = st.bulletRate;
          sfxShoot();
        }

        // ─── Update player bullets ────
        const bulletSpeed = 480;
        for (let i = st.bullets.length - 1; i >= 0; i--) {
          st.bullets[i].x += bulletSpeed * dt;
          if (st.bullets[i].x > W + 20) st.bullets.splice(i, 1);
        }

        // ─── Spawn UFOs ──────────────
        st.spawnTimer -= dt;
        if (st.spawnTimer <= 0) {
          const si = Math.floor(Math.random() * UFO_SPRITES.length);
          const sprite = UFO_SPRITES[si];
          const uw = sprite[0].length * PS;
          const uh = sprite.length * PS;
          const isElite = st.kills >= 10 && Math.random() < 0.35 + (st.kills - 10) * 0.03;
          const baseSpeed = 70 + Math.random() * 50 + st.kills * 4;

          st.ufos.push({
            x: W + 10,
            y: Math.random() * (H - uh - 40) + 20,
            speed: isElite ? baseSpeed * 1.4 : baseSpeed,
            sprite, w: uw, h: uh,
            elite: isElite,
            shootTimer: 0.6 + Math.random() * 1.0,
            shootInterval: Math.max(0.45, 2.0 - st.kills * 0.1) * (isElite ? 0.45 : 1),
            vDrift: (Math.random() - 0.5) * 65,
            seed: Math.floor(Math.random() * 1000),
          });
          st.spawnInterval = Math.max(0.25, 1.6 - st.kills * 0.075);
          st.spawnTimer = st.spawnInterval;
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
              st.won = true;
              setWon(true);
              sfxWin();
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

        // ─── Exhaust particles ────────
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
          const fwC = ['#ff6b9d','#fbbf24','#4ade80','#60a5fa','#c084fc','#f472b6','#facc15','#34d399','#fb923c','#e879f9'];
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
          drawSprite(ctx, ROCKET_SPRITE, st.px, st.py, PS, ROCKET_COLORS, time);
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
        ctx.fillText('\u{1F382} \🎂 HAPPY BIRTHDAY 🎂 \u{1F382}', W / 2, H / 2 - bdSz * 0.8);
        ctx.font = `bold ${Math.max(22, Math.floor(bdSz * 0.7))}px monospace`;
        ctx.fillStyle = '#f9a8d4';
        ctx.fillText('sayangkuuu', W / 2, H / 2 - bdSz * 0.05);
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
        ctx.fillText('GAME OVER', W / 2, H / 2 - 16);
        ctx.font = `${Math.max(12, Math.floor(goFontMain * 0.55))}px monospace`;
        ctx.fillStyle = 'rgba(255, 220, 250, 0.7)';
        ctx.fillText('tekan SPACE atau tap untuk ulangi', W / 2, H / 2 + 18);
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
          fontFamily: 'monospace', color: '#fce7f3',
          cursor: 'pointer', userSelect: 'none',
          background: '#0a0a1a',
          overflow: 'hidden',
        }}>
          {/* Animated pixel-art arcade background */}
          <canvas
            ref={(cvs) => {
              if (!cvs || cvs._arcadeInit) return;
              cvs._arcadeInit = true;
              const ctx = cvs.getContext('2d');
              const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
              resize();
              window.addEventListener('resize', resize);

              // Stars
              const stars = Array.from({ length: 80 }, () => ({
                x: Math.random() * 2000,
                y: Math.random() * 2000,
                s: Math.random() * 2.5 + 1,
                sp: Math.random() * 0.4 + 0.1,
                blink: Math.random() * Math.PI * 2,
              }));

              // Pixel grid lines
              const gridSize = 48;

              let frame = 0;
              const loop = () => {
                if (!cvs.isConnected) return;
                frame++;
                const W = cvs.width, H = cvs.height;
                ctx.clearRect(0, 0, W, H);

                // Dark gradient bg
                const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
                grad.addColorStop(0, '#12091f');
                grad.addColorStop(1, '#060410');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, W, H);

                // Pixel grid (subtle)
                ctx.strokeStyle = 'rgba(255, 107, 157, 0.04)';
                ctx.lineWidth = 1;
                const offsetY = (frame * 0.3) % gridSize;
                for (let y = -gridSize + offsetY; y < H + gridSize; y += gridSize) {
                  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
                }
                for (let x = 0; x < W; x += gridSize) {
                  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
                }

                // Scanlines
                ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
                for (let y = 0; y < H; y += 4) {
                  ctx.fillRect(0, y, W, 2);
                }

                // Stars moving down slowly
                for (const st of stars) {
                  st.y += st.sp;
                  st.blink += 0.03;
                  if (st.y > H + 10) { st.y = -10; st.x = Math.random() * W; }
                  if (st.x > W) st.x -= W;
                  const alpha = 0.4 + 0.6 * Math.abs(Math.sin(st.blink));
                  const size = Math.round(st.s);
                  // Pixel-style square stars
                  ctx.fillStyle = `rgba(255, 220, 250, ${alpha})`;
                  ctx.fillRect(Math.round(st.x), Math.round(st.y), size, size);
                  // Glow
                  ctx.fillStyle = `rgba(255, 107, 157, ${alpha * 0.25})`;
                  ctx.fillRect(Math.round(st.x) - 1, Math.round(st.y) - 1, size + 2, size + 2);
                }

                // Floating pixel UFOs in background (decorative)
                const t = frame * 0.008;
                for (let i = 0; i < 4; i++) {
                  const ux = (W * 0.15 + i * W * 0.22 + Math.sin(t + i * 1.8) * 50) % W;
                  const uy = (H * 0.2 + i * H * 0.18 + Math.cos(t * 0.7 + i * 2.3) * 30 + frame * 0.15) % H;
                  const ps = 3;
                  ctx.globalAlpha = 0.12;
                  // Simple 5-pixel wide UFO shape
                  ctx.fillStyle = '#4ade80';
                  ctx.fillRect(Math.round(ux) + ps, Math.round(uy), ps * 3, ps);
                  ctx.fillStyle = '#94a3b8';
                  ctx.fillRect(Math.round(ux), Math.round(uy) + ps, ps * 5, ps);
                  ctx.fillStyle = '#facc15';
                  ctx.fillRect(Math.round(ux) + ps, Math.round(uy) + ps * 2, ps * 3, ps);
                  ctx.globalAlpha = 1;
                }

                requestAnimationFrame(loop);
              };
              requestAnimationFrame(loop);
            }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
          />

          {/* Content (on top of bg) */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 56px)', margin: 0, color: '#ff6b9d', textShadow: '0 0 20px rgba(255,107,157,0.6), 0 0 60px rgba(255,107,157,0.2)' }}>
              🚀 SELAMATKAN DUNIA!!! 🛸
            </h1>
            <div style={{ marginTop: 32, fontSize: 'clamp(12px, 1.6vw, 18px)', lineHeight: 2.2, textAlign: 'left', color: 'rgba(255,220,250,0.85)' }}>
              <div>"↑ ↓ ← →"  atau  "W A S D".....untuk bergerak</div>
              <div>"SPACE"......................untuk menembak</div>
              <div>"Tap & geser"................untuk mobile 📱</div>
              <div style={{ marginTop: 16, textAlign: 'center' }}>Kalahkan alien jahattt! 👾</div>
              <div style={{ textAlign: 'center' }}>TIPS: Kamu punya 3 nyawa, hindari peluru musuh!</div>
            </div>
            <div style={{ marginTop: 48, fontSize: 'clamp(14px, 2vw, 22px)', color: '#fbbf24', animation: 'pulse 1.5s infinite', fontWeight: 'bold', textShadow: '0 0 12px rgba(251,191,36,0.4)' }}>
              Tekan tombol apa saja untuk mulai Penyelamatann!!!
            </div>
          </div>

          <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
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
