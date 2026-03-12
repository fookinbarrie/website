import { useEffect, useRef } from 'react';

// ─── Pixel art sprites ──────────────────────────────────────────────────────────
const PIX_HEART = [
  [0, 1, 1, 0, 0, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0],
];
const PIX_STAR = [
  [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 1, 0, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 0, 1], [0, 0, 0, 0, 0, 0, 0, 0],
];

function drawPixelSprite(ctx, pattern, x, y, ps, color, alpha) {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c]) {
        ctx.fillRect(Math.round(x + c * ps), Math.round(y + r * ps), ps, ps);
      }
    }
  }
  ctx.globalAlpha = 1.0;
}

const COLORS_STAR = ['#fde68a', '#facc15', '#eab308'];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function CursorTrail({ hide }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -100, y: -100, isMoving: false });

  useEffect(() => {
    if (hide) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    let moveTimeout;
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.isMoving = true;

      // Spawn new particle on move
      if (Math.random() > 0.4) {
        // pixel scale: small (2-3) or medium (4-5)
        const ps = Math.round(rand(2, 5));
        particlesRef.current.push({
          x: e.clientX + rand(-10, 10),
          y: e.clientY + rand(-10, 10),
          life: 1.0,
          vy: rand(-30, -80), // floating upwards speed
          type: PIX_STAR,
          color: pick(COLORS_STAR),
          ps: ps,
        });
      }

      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        mouseRef.current.isMoving = false;
      }, 50);
    };

    window.addEventListener('mousemove', handleMouseMove);

    let lastTime = performance.now();
    let frameId;

    const animate = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt * 1.5; // lifespan decay
        p.y += p.vy * dt; // float up

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        drawPixelSprite(ctx, p.type, p.x, p.y, p.ps, p.color, p.life);
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frameId);
      clearTimeout(moveTimeout);
    };
  }, [hide]);

  if (hide) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999, // ensures it sits on top of everything
      }}
    />
  );
}
