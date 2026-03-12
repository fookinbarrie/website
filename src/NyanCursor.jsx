import { useEffect, useRef, useState } from 'react';

const STAR_COLORS = ['#ffffff', '#fff9e6', '#fde68a', '#facc15', '#fbbf24'];

export default function StarCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const particlesRef = useRef([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      // Create a few particles on move
      for (let i = 0; i < 2; i++) {
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 10,
          y: e.clientY + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 4 + 1,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          life: 1.0 + Math.random() * 0.5,
          maxLife: 1.5,
          seed: Math.random() * 100,
          type: Math.random() > 0.7 ? 'star' : 'glitter'
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let lastTs = performance.now();
    let raf;

    const render = (ts) => {
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const parts = particlesRef.current;

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt;

        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }

        const alpha = Math.min(1, p.life * 2);
        const sparkle = Math.sin(ts * 0.01 + p.seed) * 0.5 + 0.5;
        
        ctx.globalAlpha = alpha * (p.type === 'star' ? sparkle : 1);
        ctx.fillStyle = p.color;

        if (p.type === 'star') {
          // Draw a small cross star
          const s = p.size;
          ctx.fillRect(p.x - s/2, p.y - 0.5, s, 1);
          ctx.fillRect(p.x - 0.5, p.y - s/2, 1, s);
        } else {
          // Draw a small dot/glitter
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    />
  );
}
