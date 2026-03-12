import { useEffect, useRef } from 'react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const rand = (a, b) => a + Math.random() * (b - a);

// Chrome gradient generator for Purple/Silver sleek look
function getChromeGradient(ctx, x, y, size, angle) {
  const g = ctx.createLinearGradient(
    x - Math.cos(angle) * size,
    y - Math.sin(angle) * size,
    x + Math.cos(angle) * size,
    y + Math.sin(angle) * size
  );
  g.addColorStop(0.0, '#3b0764'); // deep purple
  g.addColorStop(0.4, '#c084fc'); // bright lavender
  g.addColorStop(0.5, '#ffffff'); // chrome shine
  g.addColorStop(0.6, '#a855f7'); // neon purple
  g.addColorStop(1.0, '#1c0640'); // dark abyss
  return g;
}

// Draw a realistic 5-point star path
function traceStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

// Draw a smooth 5-petal flower path
function traceFlower(ctx, cx, cy, radius, petals) {
  ctx.beginPath();
  for (let i = 0; i < Math.PI * 2; i += 0.05) {
    // r = a * cos(k * theta) polar curve for petals
    const r = radius * Math.abs(Math.cos((petals / 2) * i));
    const x = cx + r * Math.cos(i);
    const y = cy + r * Math.sin(i);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export default function ScrapBackgroundSpawner({ active }) {
  const canvasRef = useRef(null);
  const elementsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const handleClick = (e) => {
      if (!active) return;
      // Spawn large bouncy flowers/stars on click!
      const count = Math.round(rand(1, 2));
      for (let i = 0; i < count; i++) {
        const isStar = Math.random() > 0.5;
        elementsRef.current.push({
          id: Math.random(),
          x: e.clientX + rand(-40, 40),
          y: e.clientY + rand(-40, 40),
          size: rand(12, 28), // realistic scale
          angle: rand(0, Math.PI * 2), // random starting rotation
          vAngle: rand(-0.02, 0.02), // spinning speed
          scale: 0.1, // starts small and pops up
          life: 1.0, // alpha
          type: isStar ? 'star' : 'flower',
          spikes: 5,
          vx: rand(-200, 200), // explode sideways
          vy: rand(-300, -550), // pop upwards (bounce up)
        });
      }
    };

    window.addEventListener('click', handleClick);

    let lastTime = performance.now();
    let frameId;

    const animate = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const elements = elementsRef.current;
      for (let i = elements.length - 1; i >= 0; i--) {
        const p = elements[i];
        
        // Pop-in animation (scale up rapidly at first)
        if (p.scale < 1.0) p.scale += dt * 4;
        
        // Spin slowly
        p.angle += p.vAngle;

        // Gravity and Velocity physics
        p.vy += 800 * dt; // gravity pulls down HARD
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.life <= 0 || p.y > canvas.height + 50) {
          elements.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.scale(p.scale, p.scale);

        // Apply realistic chrome shade gradient
        const gradient = getChromeGradient(ctx, 0, 0, p.size, p.angle);
        ctx.fillStyle = gradient;

        // Shiny inner border
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(255, 255, 255, ${p.life})`;

        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(168, 85, 247, ${p.life * 0.6})`; // glow 

        ctx.globalAlpha = Math.min(1, p.life * 1.5); // stays solid longer then fades

        if (p.type === 'star') {
          traceStar(ctx, 0, 0, p.spikes, p.size, p.size * 0.45);
        } else {
          traceFlower(ctx, 0, 0, p.size, 5); // 5 clear petals
        }

        ctx.fill();
        ctx.stroke();

        // Inner micro-highlight for realistic 3D bevel illusion
        ctx.beginPath();
        if (p.type === 'star') {
          traceStar(ctx, 0, 0, p.spikes, p.size * 0.7, p.size * 0.3);
        } else {
          traceFlower(ctx, 0, 0, p.size * 0.7, 5);
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.3})`;
        ctx.fill();

        ctx.restore();
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(frameId);
    };
  }, [active]);

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
        zIndex: 9998, // just below cursor
      }}
    />
  );
}
