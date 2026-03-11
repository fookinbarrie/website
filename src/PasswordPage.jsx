import { useEffect, useRef, useState, useCallback } from 'react';
import AsteroidShooter from './AsteroidShooter';
import { drawTaurus, makeTaurus, makeCustomSvgConstellation, drawCustomSvg } from './canvasConstellations';

// ─── Theme ────────────────────────────────────────────────────────────────────
const SKY = { top: '#2a0b4a', mid: '#140a3a', bot: '#07051a' };
const NEBULA_COLORS = ['rgba(190,140,255,0.08)', 'rgba(255,165,230,0.07)', 'rgba(150,230,255,0.05)'];
const CLOUD_COLORS = [
  { base: 'rgba(255,180,235,0.10)', hi: 'rgba(255,230,250,0.08)' },
  { base: 'rgba(215,185,255,0.10)', hi: 'rgba(245,230,255,0.08)' },
  { base: 'rgba(170,230,255,0.08)', hi: 'rgba(230,250,255,0.06)' },
];
const STAR_TINTS = [[255,245,255],[255,205,235],[220,205,255],[210,235,255],[255,235,210]];

// ─── Utils ────────────────────────────────────────────────────────────────────
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const lerp = (a, b, t) => a + (b - a) * t;

function hexRgb(hex) {
  const n = parseInt(hex.replace('#',''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function makeStars(w, h) {
  const count = Math.max(100, Math.floor((w * h) / 200));
  return Array.from({ length: count }, () => ({
    x: Math.floor(Math.random() * w),
    y: Math.floor(Math.random() * h),
    alpha: rand(0.3, 1.0),
    tint: pick(STAR_TINTS),
    cross: Math.random() > 0.85,
  }));
}

function makeClouds(w, h) {
  const base = Math.min(w, h);
  return Array.from({ length: 8 }, () => {
    const s = rand(base * 0.08, base * 0.15);
    return {
      x: rand(-s * 2, w + s * 2), y: rand(h * 0.06, h * 0.46), s,
      col: pick(CLOUD_COLORS),
      v: rand(0.5, 1.2) * (Math.random() < 0.5 ? -1 : 1),
      ph: rand(0, Math.PI * 2),
    };
  });
}

function solidCircle(ctx, cx, cy, r) {
  const ri = Math.floor(r);
  for (let dy = -ri; dy <= ri; dy++) {
    for (let dx = -ri; dx <= ri; dx++) {
      if (dx*dx + dy*dy <= ri*ri) ctx.fillRect(Math.floor(cx)+dx, Math.floor(cy)+dy, 1, 1);
    }
  }
}

function ditherCircle(ctx, cx, cy, r, step, mask) {
  const ri = Math.floor(r);
  const x0 = Math.floor(cx-ri), y0 = Math.floor(cy-ri);
  const x1 = Math.floor(cx+ri), y1 = Math.floor(cy+ri);
  for (let y = y0; y <= y1; y += step)
    for (let x = x0; x <= x1; x += step) {
      const dx = x-cx, dy = y-cy;
      if (dx*dx+dy*dy <= ri*ri && ((x+y)&3) === mask) ctx.fillRect(x, y, step, step);
    }
}

function drawCloud(ctx, x, y, s, { base, hi }) {
  ctx.fillStyle = hi;
  solidCircle(ctx, x-s*.15, y-s*.12, s*.43);
  solidCircle(ctx, x+s*.10, y-s*.22, s*.48);
  solidCircle(ctx, x+s*.46, y-s*.10, s*.35);
  ctx.fillStyle = base;
  solidCircle(ctx, x-s*.18, y, s*.50);
  solidCircle(ctx, x+s*.08, y-s*.10, s*.62);
  solidCircle(ctx, x+s*.45, y, s*.44);
  ctx.fillRect(Math.floor(x-s*.55), Math.floor(y), Math.floor(s*1.35), Math.floor(s*.42));
}

// ─── Background draw ──────────────────────────────────────────────────────────
function drawBg(ctx, w, h, t, stars, clouds, constellationData, gameState) {
  const top = hexRgb(SKY.top), mid = hexRgb(SKY.mid), bot = hexRgb(SKY.bot);

  // Gradient sky
  for (let y = 0; y < h; y++) {
    const p = y / (h - 1);
    const c1 = p < 0.55 ? top : mid, c2 = p < 0.55 ? mid : bot;
    const tt = p < 0.55 ? p / 0.55 : (p - 0.55) / 0.45;
    ctx.fillStyle = `rgb(${Math.round(lerp(c1.r,c2.r,tt))},${Math.round(lerp(c1.g,c2.g,tt))},${Math.round(lerp(c1.b,c2.b,tt))})`;
    ctx.fillRect(0, y, w, 1);
  }

  // Stars (static always — no twinkle)
  for (const s of stars) {
    const [r, g, b] = s.tint;
    ctx.fillStyle = `rgba(${r},${g},${b},${s.alpha})`;
    ctx.fillRect(s.x, s.y, 1, 1);
    if (s.cross) {
      ctx.fillRect(s.x-1, s.y, 1, 1);
      ctx.fillRect(s.x+1, s.y, 1, 1);
      ctx.fillRect(s.x, s.y-1, 1, 1);
      ctx.fillRect(s.x, s.y+1, 1, 1);
    }
  }

  // Skip expensive nebulae/clouds/constellations during game — stars are enough
  if (gameState === 'playing') return;

  // Nebulae
  const neb = [
    { x: w*.22, y: h*.30, r: Math.min(w,h)*.22, c: NEBULA_COLORS[0], m: 0 },
    { x: w*.76, y: h*.26, r: Math.min(w,h)*.20, c: NEBULA_COLORS[1], m: 1 },
    { x: w*.52, y: h*.72, r: Math.min(w,h)*.24, c: NEBULA_COLORS[2], m: 2 },
  ];
  for (const n of neb) { ctx.fillStyle = n.c; ditherCircle(ctx, n.x, n.y, n.r, 2, n.m); }

  // Clouds
  for (const c of clouds) {
    const wrap = w + c.s * 4;
    const xx = ((c.x + t * c.v) % wrap + wrap) % wrap - c.s * 2;
    const yy = c.y + Math.sin(t * 0.10 + c.ph) * 2;
    drawCloud(ctx, xx, yy, c.s, c.col);
  }

  // Constellations
  if (constellationData?.taurus) drawTaurus(ctx, t, constellationData.taurus);
  if (constellationData?.svg) drawCustomSvg(ctx, t, constellationData.svg);
}

// ─── Glyphs for rain transition ───────────────────────────────────────────────
const GLYPHS = ['★','♥','✦','✧','♡','⭐','💜','✨'];
function makeRainParticles() {
  return Array.from({ length: 70 }, () => ({
    x: Math.random() * 100,
    y: -Math.random() * 100,
    vy: 25 + Math.random() * 40,   // vh/s
    size: 14 + Math.random() * 22,
    glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    color: Math.random() < 0.6 ? '#f9a8d4' : '#c084fc',
    op: 0.5 + Math.random() * 0.5,
  }));
}

// ─── Pixel art styles (shared) ───────────────────────────────────────────────
const PX_FONT = '"Press Start 2P", monospace';

const INPUT_STYLE = {
  width: '100%', padding: '12px 14px', boxSizing: 'border-box',
  fontFamily: PX_FONT, fontSize: '10px', color: '#ffe4f0',
  background: '#0d0620',
  border: '3px solid #c084fc',
  borderRadius: 0,
  outline: 'none',
  // pixel shadow border trick
  boxShadow: '4px 4px 0 #6d28d9, inset 0 0 0 2px #1c0640',
  imageRendering: 'pixelated',
  letterSpacing: '0.05em',
};

const BTN_BASE = {
  width: '100%', padding: '14px',
  fontFamily: PX_FONT, fontSize: '11px', letterSpacing: '0.2em',
  fontWeight: 'bold', color: '#07051a',
  background: 'linear-gradient(to bottom, #f472b6, #c026d3)',
  border: '3px solid #a21caf',
  borderRadius: 0,
  boxShadow: '4px 4px 0 #6b21a8',
  cursor: 'pointer',
  imageRendering: 'pixelated',
  transition: 'box-shadow 0.08s, transform 0.08s',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PasswordPage({ onUnlock }) {
  const [phase, setPhase] = useState('playing'); // 'playing' | 'password' | 'rain'
  const phaseRef = useRef('playing');
  const setPhaseSync = (p) => { phaseRef.current = p; setPhase(p); };

  const canvasRef = useRef(null);
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const audioRef = useRef(null);

  // Rain state
  const rainRef = useRef([]);
  const rainRafRef = useRef(null);
  const [rainParticles, setRainParticles] = useState([]);
  const [fadeAlpha, setFadeAlpha] = useState(0);

  // ── Audio setup & sandi cheat ──
  useEffect(() => {
    const audio = new Audio('/audio/game-bgm.mp3');
    audio.loop = true; audio.volume = 0.5;
    audioRef.current = audio;

    const buf = { v: '' };
    const onKey = (e) => {
      if (e.key.length !== 1) return;
      buf.v = (buf.v + e.key.toLowerCase()).slice(-5);
      if (buf.v === 'sandi') {
        buf.v = '';
        setPhaseSync('password');
        audio.play().catch(() => {});
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      audio.pause(); audio.src = '';
    };
  }, []);

  const handleGameStart = () => {
    audioRef.current?.play().catch(() => {});
  };

  // ── Rain transition ──
  const startRain = useCallback(() => {
    audioRef.current?.pause();
    const particles = makeRainParticles();
    rainRef.current = particles.map(p => ({ ...p }));
    setRainParticles([...rainRef.current]);
    setFadeAlpha(0);
    setPhaseSync('rain');

    let lastT = null;
    let elapsed = 0;
    const DURATION = 2.0;

    const tick = (ts) => {
      if (!lastT) lastT = ts;
      const dt = (ts - lastT) / 1000;
      lastT = ts;
      elapsed += dt;

      const progress = Math.min(1, elapsed / DURATION);
      for (const p of rainRef.current) p.y += p.vy * dt;
      setRainParticles([...rainRef.current]);
      setFadeAlpha(progress);

      if (progress >= 1) { onUnlock(); return; }
      rainRafRef.current = requestAnimationFrame(tick);
    };
    rainRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rainRafRef.current);
  }, [onUnlock]);

  // ── Space canvas loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let raf, stars = [], clouds = [], constData = null;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = makeStars(canvas.width, canvas.height);
      clouds = makeClouds(canvas.width, canvas.height);
      constData = {
        taurus: makeTaurus(canvas.width, canvas.height),
        svg: makeCustomSvgConstellation(canvas.width, canvas.height),
      };
    };
    window.addEventListener('resize', init);
    init();

    const t0 = performance.now();
    const loop = (now) => {
      const t = (now - t0) / 1000;
      drawBg(ctx, canvas.width, canvas.height, t, stars, clouds, constData, phaseRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', init); };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pw.toLowerCase() === 'munyu') {
      startRain();
    } else {
      setError('salah! hint: panggilan sayang abang ke kamu');
      setTimeout(() => setError(''), 3500);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* Space background — always rendered */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Game overlay */}
      {phase === 'playing' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          <AsteroidShooter onComplete={() => setPhaseSync('password')} onStart={handleGameStart} />
        </div>
      )}

      {/* Password screen */}
      {phase === 'password' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '2.5rem', padding: '1.5rem',
        }}>
          {/* Star Wars-style heading */}
          <div style={{ textAlign: 'center', userSelect: 'none', maxWidth: '800px' }}>
            <h1 style={{
              fontFamily: '"Orbitron", monospace',
              fontSize: 'clamp(22px, 5vw, 64px)',
              fontWeight: 900,
              margin: 0, lineHeight: 1.2,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#ffe066',
              WebkitTextStroke: '2px #c084fc',
              textShadow: [
                '0 0 10px #ffe066',
                '0 0 28px #c084fc',
                '0 0 55px rgba(192,132,252,0.5)',
                '5px 5px 0 rgba(50,10,100,0.8)',
              ].join(', '),
            }}>
              ¡Feliz cumpleaños<br />número 20,<br />Syafara amor mío!
            </h1>
          </div>

          {/* Retro arcade password panel */}
          <div style={{
            width: 'min(360px, 90vw)',
            background: '#08031a',
            border: '4px solid #c084fc',
            padding: '24px 20px 20px',
            boxShadow: '6px 6px 0 #6d28d9, inset 0 0 0 2px #1c0640',
            display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            {/* Panel header */}
            <div style={{
              fontFamily: PX_FONT, fontSize: '9px', color: '#a855f7',
              letterSpacing: '0.15em', textAlign: 'center',
              borderBottom: '2px solid #3b0764', paddingBottom: '10px', marginBottom: '4px',
            }}>
              ENTER ACCESS CODE
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="password"
                placeholder="panggilan sayang abang..."
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                style={INPUT_STYLE}
                onFocus={(e) => { e.target.style.borderColor = '#e879f9'; e.target.style.boxShadow = '4px 4px 0 #7c3aed, inset 0 0 0 2px #1c0640'; }}
                onBlur={(e) => { e.target.style.borderColor = '#c084fc'; e.target.style.boxShadow = '4px 4px 0 #6d28d9, inset 0 0 0 2px #1c0640'; }}
                autoFocus
              />
              <button
                type="submit"
                style={BTN_BASE}
                onMouseOver={(e) => { e.currentTarget.style.boxShadow = '2px 2px 0 #6b21a8'; e.currentTarget.style.transform = 'translate(2px,2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.boxShadow = '4px 4px 0 #6b21a8'; e.currentTarget.style.transform = ''; }}
                onMouseDown={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translate(4px,4px)'; }}
                onMouseUp={(e) => { e.currentTarget.style.boxShadow = '2px 2px 0 #6b21a8'; e.currentTarget.style.transform = 'translate(2px,2px)'; }}
              >
                ▶ UNLOCK
              </button>
              {error && (
                <p style={{
                  fontFamily: PX_FONT, fontSize: '8px', color: '#f9a8d4',
                  margin: 0, textAlign: 'center', lineHeight: 1.7,
                  textShadow: '0 0 8px rgba(249,168,212,0.5)',
                }}>
                  {error}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Rain transition overlay */}
      {phase === 'rain' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: `rgba(7,5,26,${clamp01(fadeAlpha * 0.92)})`,
          pointerEvents: 'none',
        }}>
          {rainParticles.map((p, i) => (
            <span key={i} style={{
              position: 'absolute',
              left: `${p.x}%`, top: `${p.y}%`,
              fontSize: `${p.size}px`,
              color: p.color,
              opacity: p.op * clamp01(1 - fadeAlpha * 0.5),
              textShadow: `0 0 8px ${p.color}`,
              userSelect: 'none',
              lineHeight: 1,
            }}>
              {p.glyph}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}