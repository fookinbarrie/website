import { useEffect, useRef, useState, useCallback } from 'react';
import AsteroidShooter from './AsteroidShooter';
import NyanCursor from './NyanCursor';
import { drawTaurus, makeTaurus, makeCustomSvgConstellation, drawCustomSvg } from './canvasConstellations';

// ─── Theme ─────────────────────────────────────────────────────────────────────
const SKY = { top: '#2a0b4a', mid: '#140a3a', bot: '#07051a' };
const NEBULA_COLORS = ['rgba(190,140,255,0.08)', 'rgba(255,165,230,0.07)', 'rgba(150,230,255,0.05)'];
const CLOUD_COLORS = [
  { base: 'rgba(255,180,235,0.10)', hi: 'rgba(255,230,250,0.08)' },
  { base: 'rgba(215,185,255,0.10)', hi: 'rgba(245,230,255,0.08)' },
];
const STAR_TINTS = [[255,245,255],[255,205,235],[220,205,255],[210,235,255],[255,235,210]];
const PX_FONT = '"Press Start 2P", monospace';

// ─── Utils ─────────────────────────────────────────────────────────────────────
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Factories ─────────────────────────────────────────────────────────────────
function makeStars(w, h) {
  return Array.from({ length: Math.max(100, Math.floor((w*h)/200)) }, () => ({
    x: Math.floor(Math.random()*w), y: Math.floor(Math.random()*h),
    alpha: rand(0.3,1.0), tint: pick(STAR_TINTS), cross: Math.random()>0.85,
  }));
}
const makeClouds = (w, h) => {
  const base=Math.min(w,h);
  return Array.from({length:6}, ()=>{ const s=rand(base*.08,base*.14);
    return {x:rand(-s*2,w+s*2),y:rand(h*.06,h*.44),s,col:pick(CLOUD_COLORS),v:rand(.5,1.1)*(Math.random()<.5?-1:1),ph:rand(0,Math.PI*2)};
  });
};
const makeUFOs = (w, h) => {
  return Array.from({ length: 4 }, () => ({
    x: rand(0, w),
    y: rand(h * 0.1, h * 0.5),
    v: rand(30, 80) * (Math.random() < 0.5 ? -1 : 1),
    ps: Math.round(rand(3, 5)),
    ph: rand(0, Math.PI * 2),
  }));
};

// ─── Cloud drawing helpers ──────────────────────────────────────────────────────
function solidCircle(ctx,cx,cy,r) {
  const ri=Math.floor(r);
  for(let dy=-ri;dy<=ri;dy++) for(let dx=-ri;dx<=ri;dx++)
    if(dx*dx+dy*dy<=ri*ri) ctx.fillRect(Math.floor(cx)+dx,Math.floor(cy)+dy,1,1);
}
function ditherCircle(ctx,cx,cy,r,step,mask) {
  const ri=Math.floor(r),x0=Math.floor(cx-ri),y0=Math.floor(cy-ri),x1=Math.floor(cx+ri),y1=Math.floor(cy+ri);
  for(let y=y0;y<=y1;y+=step) for(let x=x0;x<=x1;x+=step) {
    const dx=x-cx,dy=y-cy;
    if(dx*dx+dy*dy<=ri*ri&&((x+y)&3)===mask) ctx.fillRect(x,y,step,step);
  }
}
function drawCloud(ctx,x,y,s,{base,hi}) {
  ctx.fillStyle=hi; solidCircle(ctx,x-s*.15,y-s*.12,s*.43); solidCircle(ctx,x+s*.10,y-s*.22,s*.48);
  ctx.fillStyle=base; solidCircle(ctx,x-s*.18,y,s*.50); solidCircle(ctx,x+s*.08,y-s*.10,s*.62); solidCircle(ctx,x+s*.45,y,s*.44);
  ctx.fillRect(Math.floor(x-s*.55),Math.floor(y),Math.floor(s*1.35),Math.floor(s*.42));
}

// ─── Pixel art sprites ──────────────────────────────────────────────────────────
const PIX_HEART = [
  [0,1,1,0,0,1,1,0],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,0],[0,0,1,1,1,1,0,0],[0,0,0,1,1,0,0,0],
  [0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],
];
const PIX_STAR = [
  [0,0,0,1,1,0,0,0],[0,0,0,1,1,0,0,0],[1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,0],[0,0,1,1,1,1,0,0],[0,1,0,0,0,0,1,0],
  [1,0,0,0,0,0,0,1],[0,0,0,0,0,0,0,0],
];
const PIX_UFO = [
  [0,0,0,1,1,1,0,0,0],
  [0,0,1,1,2,1,1,0,0],
  [0,1,1,2,2,2,1,1,0],
  [1,1,3,1,3,1,3,1,1],
  [0,1,1,1,1,1,1,1,0],
  [0,0,1,0,0,0,1,0,0],
];
const COLOR_UFO = { 1: '#94a3b8', 2: '#7dd3fc', 3: '#facc15' };

function drawPixelSprite(ctx,pattern,x,y,ps,colorMap,glow) {
  for(let r=0;r<pattern.length;r++) {
    for(let c=0;c<pattern[r].length;c++) {
      const v = pattern[r][c];
      if(!v) continue;
      const color = (typeof colorMap === 'string') ? colorMap : (colorMap[v] || '#fff');
      if(glow) {
        ctx.fillStyle=glow;
        ctx.fillRect(Math.round(x+c*ps)-1,Math.round(y+r*ps)-1,ps+2,ps+2);
      }
      ctx.fillStyle=color;
      ctx.fillRect(Math.round(x+c*ps),Math.round(y+r*ps),ps,ps);
    }
  }
}

// ─── Shooting star ──────────────────────────────────────────────────────────────
let shootingStarState = null;
function triggerShootingStar(w,h) {
  const angle=rand(20,48)*Math.PI/180;
  shootingStarState={x:rand(w*.1,w*.55),y:rand(h*.05,h*.32),angle,len:0,maxLen:rand(180,340),speed:rand(900,1300),alpha:1,done:false};
}
function drawShootingStar(ctx,dt,active) {
  const ss=shootingStarState; if(!ss||ss.done||!active) return;
  ss.len=Math.min(ss.maxLen,ss.len+ss.speed*dt);
  if(ss.len>=ss.maxLen) ss.alpha=Math.max(0,ss.alpha-dt*2.5);
  if(ss.alpha<=0){ss.done=true;shootingStarState=null;return;}
  const dx=Math.cos(ss.angle)*ss.len,dy=Math.sin(ss.angle)*ss.len;
  const g=ctx.createLinearGradient(ss.x,ss.y,ss.x+dx,ss.y+dy);
  g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.6,`rgba(220,180,255,${ss.alpha*.7})`); g.addColorStop(1,`rgba(255,255,255,${ss.alpha})`);
  ctx.save(); ctx.strokeStyle=g; ctx.lineWidth=2; ctx.shadowColor='rgba(255,255,255,.9)'; ctx.shadowBlur=6;
  ctx.beginPath(); ctx.moveTo(ss.x,ss.y); ctx.lineTo(ss.x+dx,ss.y+dy); ctx.stroke(); ctx.restore();
}

// ─── Background draw ────────────────────────────────────────────────────────────
function drawBg(ctx,w,h,t,dt,stars,clouds,ufos,cData,gameState,starsAlpha,showFull,shootActive) {
  // Sky gradient — one fill instead of h individual rects
  const skyGrad = ctx.createLinearGradient(0,0,0,h);
  skyGrad.addColorStop(0, SKY.top);
  skyGrad.addColorStop(0.55, SKY.mid);
  skyGrad.addColorStop(1, SKY.bot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0,0,w,h);

  // Stars — drastically fewer during game for performance
  const sa=Math.max(0,Math.min(1,starsAlpha));
  const starLimit = gameState === 'playing' ? 60 : stars.length;
  for(let i=0; i<starLimit; i++) {
    const s=stars[i];
    const [r,g,b]=s.tint; ctx.fillStyle=`rgba(${r},${g},${b},${s.alpha*sa})`; ctx.fillRect(s.x,s.y,1,1);
    if(s.cross&&sa>.3){ctx.fillRect(s.x-1,s.y,1,1);ctx.fillRect(s.x+1,s.y,1,1);ctx.fillRect(s.x,s.y-1,1,1);ctx.fillRect(s.x,s.y+1,1,1);}
  }
  // Shooting star — only during password phase
  if(shootActive) drawShootingStar(ctx,dt,true);
  if(!showFull) return;
  // Nebulae
  const neb=[{x:w*.22,y:h*.30,r:Math.min(w,h)*.22,c:NEBULA_COLORS[0],m:0},{x:w*.76,y:h*.26,r:Math.min(w,h)*.20,c:NEBULA_COLORS[1],m:1},{x:w*.52,y:h*.72,r:Math.min(w,h)*.24,c:NEBULA_COLORS[2],m:2}];
  for(const n of neb){ctx.fillStyle=n.c;ditherCircle(ctx,n.x,n.y,n.r,2,n.m);}
  for(const c of clouds) {
    const wrap=w+c.s*4,xx=((c.x+t*c.v)%wrap+wrap)%wrap-c.s*2,yy=c.y+Math.sin(t*.10+c.ph)*2;
    drawCloud(ctx,xx,yy,c.s,c.col);
  }
  if(cData?.taurus) drawTaurus(ctx,t,cData.taurus);
  if(cData?.svg) drawCustomSvg(ctx,t,cData.svg);

  // UFOs - "mondar-mandir"
  for (const u of ufos) {
    const wrap = w + 100;
    const x = ((u.x + t * u.v) % wrap + wrap) % wrap - 50;
    const y = u.y + Math.sin(t * 1.5 + u.ph) * 15;
    drawPixelSprite(ctx, PIX_UFO, x, y, u.ps, COLOR_UFO, 'rgba(125, 211, 252, 0.05)');
  }
}

// ─── Rain canvas factory ────────────────────────────────────────────────────────
const COLORS_HEART=['#f9a8d4','#fb7185','#e879f9'];
const COLORS_STAR=['#fde68a','#c084fc','#67e8f9'];
function makeRainParticles(W,H) {
  // 160 particles — dense like heavy rain
  return Array.from({length:160},(_,i)=>({
    x: rand(0,W),
    y: -rand(0,H),           // staggered above screen
    vy: rand(700,1200),      // ultra-fast (px/s)
    type: i%2===0?'heart':'star',
    ps: Math.round(rand(5,13)),
    color: i%2===0?pick(COLORS_HEART):pick(COLORS_STAR),
    glow: i%2===0?'rgba(249,168,212,0.15)':'rgba(253,230,138,0.15)',
  }));
}

// ─── Global keyframes ───────────────────────────────────────────────────────────
const STYLES = `
@keyframes titleZoom {
  0%   { opacity:0; transform:scale(0.04) translateY(60px) perspective(800px) rotateX(25deg); filter:blur(16px); }
  60%  { opacity:1; filter:blur(0); }
  100% { opacity:1; transform:scale(1) translateY(0) perspective(800px) rotateX(25deg); filter:blur(0); }
}
@keyframes neonFlame {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    text-shadow: 0 0 4px #fff, 0 0 10px #fff, 0 0 20px #e879f9, 0 0 40px #c084fc, 0 0 80px #9333ea, 0 0 90px #7e22ce, 0 0 100px #7e22ce, 0 0 150px #581c87;
  }
  20%, 24%, 55% {
    text-shadow: none;
  }
}
@keyframes boxFloat {
  0%,100% { transform:translateY(0); }
  50%      { transform:translateY(-14px); }
}
`;

// ─── Component ──────────────────────────────────────────────────────────────────
export default function PasswordPage({ onUnlock, onGameComplete }) {
  const [phase, setPhase] = useState('playing'); // 'playing'|'password'|'transitioning'
  const phaseRef = useRef('playing');
  const setPhaseSync = (p) => { phaseRef.current = p; setPhase(p); };

  const canvasRef = useRef(null);
  const rainCanvasRef = useRef(null);
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const audioRef = useRef(null);

  // Transition state
  const [overlayOpacity, setOverlayOpacity] = useState(1); // 1=visible, fades to 0
  const [showUI, setShowUI] = useState(true);              // false = hide title+box

  // Canvas refs for live control
  const starsAlphaRef = useRef(1);
  const showFullBgRef = useRef(false);
  const shootActiveRef = useRef(false); // off while playing, on during password
  const shootTimerRef = useRef(10);

  // ── Audio + sandi ──
  useEffect(() => {
    const audio = new Audio('/audio/game-bgm.mp3');
    audio.loop=true; audio.volume=0.5; audioRef.current=audio;
    const buf={v:''};
    const onKey=(e)=>{
      if(e.key.length!==1) return;
      buf.v=(buf.v+e.key.toLowerCase()).slice(-5);
      if(buf.v==='sandi'){buf.v=''; setPhaseSync('password'); shootActiveRef.current=true; showFullBgRef.current=true; audio.play().catch(()=>{});}
    };
    window.addEventListener('keydown',onKey);
    return ()=>{ window.removeEventListener('keydown',onKey); audio.pause(); audio.src=''; };
  }, []);

  const handleGameStart=()=>audioRef.current?.play().catch(()=>{});

  // When game ends → show password screen + signal App to mount scrapbook
  const handleGameComplete = useCallback(()=>{
    setPhaseSync('password');
    shootActiveRef.current = true;
    showFullBgRef.current = true;
    onGameComplete?.();  // tell App: mount ReactFlow now
  },[onGameComplete]);

  // ── Space background canvas ──
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext('2d');
    let raf, stars=[], clouds=[], ufos=[], cData=null, lastT=0;
    const init=()=>{
      canvas.width=window.innerWidth; canvas.height=window.innerHeight;
      stars=makeStars(canvas.width,canvas.height);
      clouds=makeClouds(canvas.width,canvas.height);
      ufos=makeUFOs(canvas.width,canvas.height);
      cData={taurus:makeTaurus(canvas.width,canvas.height),svg:makeCustomSvgConstellation(canvas.width,canvas.height)};
    };
    window.addEventListener('resize',init); init();
    const t0=performance.now();
    const loop=(now)=>{
      const t=(now-t0)/1000, dt=Math.min(.05,t-lastT); lastT=t;
      shootTimerRef.current-=dt;
      if(shootTimerRef.current<=0 && shootActiveRef.current) {
        triggerShootingStar(canvas.width,canvas.height);
        shootTimerRef.current=10+rand(-1,2);
      }
      drawBg(ctx,canvas.width,canvas.height,t,dt,stars,clouds,ufos,cData,
        phaseRef.current, starsAlphaRef.current, showFullBgRef.current, shootActiveRef.current);
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize',init); };
  },[]);

  // ── 3-second transition ──
  const startTransition = useCallback(()=>{
    audioRef.current?.pause();
    const W=window.innerWidth, H=window.innerHeight;
    setPhaseSync('transitioning');

    // t=0: Immediately hide UI, stop shooting star, stop full bg
    setShowUI(false);
    shootActiveRef.current = false;
    showFullBgRef.current = false;

    // Fade stars 0→1s
    let fadeStart=performance.now();
    const fadeStar=(now)=>{
      const el=(now-fadeStart)/1000;
      starsAlphaRef.current=Math.max(0,1-el);
      if(starsAlphaRef.current>0) requestAnimationFrame(fadeStar);
    };
    requestAnimationFrame(fadeStar);

    // t=0: Start rain immediately on rain canvas
    const canvas=rainCanvasRef.current; if(!canvas) return;
    canvas.width=W; canvas.height=H;
    const rctx=canvas.getContext('2d');
    const particles=makeRainParticles(W,H);
    let lastRain=null, rainRaf;

    // Overlay fade: from opacity=1 at t=1s to opacity=0 at t=3s
    // We animate opacity via JS to have full control; the entire PasswordPage div uses it
    const FADE_START=1.0, FADE_END=3.0;
    let transStart=performance.now();

    const rainLoop=(ts)=>{
      if(!lastRain) lastRain=ts;
      const dt=Math.min(.05,(ts-lastRain)/1000); lastRain=ts;
      const elapsed=(ts-transStart)/1000;

      // Rain particles
      rctx.clearRect(0,0,W,H);
      for(const p of particles) {
        p.y+=p.vy*dt;
        if(p.y>H+p.ps*8) p.y=-p.ps*8-rand(0,80);
        drawPixelSprite(rctx,p.type==='heart'?PIX_HEART:PIX_STAR,p.x,p.y,p.ps,p.color,p.glow);
      }

      // Overlay fade: entire PasswordPage fades out t=1→3
      if(elapsed>=FADE_START) {
        const fadeT=Math.min(1,(elapsed-FADE_START)/(FADE_END-FADE_START));
        setOverlayOpacity(1-fadeT);
      }

      if(elapsed>=FADE_END) {
        cancelAnimationFrame(rainRaf);
        onUnlock();
        return;
      }
      rainRaf=requestAnimationFrame(rainLoop);
    };
    rainRaf=requestAnimationFrame(rainLoop);
  },[onUnlock]);

  const handleSubmit=(e)=>{
    e.preventDefault();
    if(pw.toLowerCase()==='munyu') startTransition();
    else { 
      setError('Salah!'); 
      setPw(''); 
      setTimeout(()=>setError(''), 3000); 
    }
  };

  const isPassword = phase==='password';

  return (
    <div style={{
      position:'fixed', inset:0, overflow:'hidden', zIndex:100,
      opacity: overlayOpacity,
      // Transition only applies during fade (t=1-3s via JS)
    }}>
      <style>{STYLES}</style>

      {/* Space background */}
      <canvas ref={canvasRef} style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:0}}/>

      {/* Pixel rain canvas */}
      <canvas ref={rainCanvasRef} style={{
        position:'absolute',inset:0,width:'100%',height:'100%',zIndex:15,
        display:phase==='transitioning'?'block':'none',pointerEvents:'none',
      }}/>

      {/* Nyan Cat Cursor limited to Password phase */}
      {isPassword && <NyanCursor />}

      {/* Game overlay */}
      {phase==='playing'&&(
        <div style={{position:'absolute',inset:0,zIndex:10}}>
          <AsteroidShooter onComplete={handleGameComplete} onStart={handleGameStart}/>
        </div>
      )}

      {/* Password UI - Centered Container */}
      {isPassword && showUI && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px', // Space between title and pager
          width: '100%',
          maxWidth: '820px',
          zIndex: 20,
        }}>
          {/* Title Area */}
          <div style={{
            textAlign: 'center',
            userSelect: 'none',
            animation: 'titleZoom 1.4s cubic-bezier(.22,1,.36,1) forwards',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'none',
          }}>
            <p style={{
              fontFamily: '"Press Start 2P", monospace', fontSize: 'clamp(12px, 2.8vw, 38px)',
              fontWeight: 400, margin: 0, lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '.04em',
              color: '#000000', WebkitTextStroke: '1px #a855f7',
              animation: 'neonFlame 3s infinite alternate',
            }}>
              ¡Feliz cumpleaños
            </p>
            <p style={{
              fontFamily: '"Press Start 2P", monospace', fontSize: 'clamp(12px, 2.8vw, 38px)',
              fontWeight: 400, margin: 0, lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '.04em',
              color: '#000000', WebkitTextStroke: '1px #a855f7',
              animation: 'neonFlame 3s infinite alternate',
            }}>
              número 20,
            </p>
            <p style={{
              fontFamily: '"Press Start 2P", monospace', fontSize: 'clamp(12px, 2.8vw, 38px)',
              fontWeight: 400, margin: 0, lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '.04em',
              color: '#000000', WebkitTextStroke: '1px #a855f7',
              animation: 'neonFlame 3s infinite alternate',
            }}>
              Syafara amor mío!
            </p>
          </div>

          {/* Retro Pager Hub */}
          <div style={{
            pointerEvents: 'auto',
            animation: 'boxFloat 3.2s ease-in-out infinite',
            position: 'relative',
          }}>
            {/* Pager Body - Black Neon Outline & Redesigned Layout */}
            <div style={{
              width: '300px', height: '135px', 
              background: '#fffbeb', // Cream
              borderRadius: '8px', 
              border: '6px solid #000',
              boxShadow: `
                0 0 15px rgba(168, 85, 247, 0.6), 
                0 0 30px rgba(168, 85, 247, 0.4),
                0 10px 0 #000, 
                inset 0 2px 0 rgba(255,255,255,0.8)
              `,
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              padding: '6px',
              imageRendering: 'pixelated',
              overflow: 'visible',
              gap: '4px'
            }}>
              {/* Pink Side Decoration - Thick Vertical Line (Grip) */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: '10px',
                width: '12px', background: '#fb7185', zIndex: 1,
                borderLeft: '2px solid #000', borderRight: '2px solid #000'
              }} />
              
              {/* Antenna Nub */}
              <div style={{
                position: 'absolute', top: '-14px', right: '30px',
                width: '12px', height: '14px', background: '#000',
                borderRadius: '2px 2px 0 0'
              }} />

              {/* Decorative Horizontal Pink Lines */}
              <div style={{
                position: 'absolute', top: '12px', right: '15px', left: '35px',
                height: '4px', background: '#fb7185', zIndex: 1,
                borderTop: '2px solid #000', borderBottom: '2px solid #000'
              }} />

              {/* Decorative side details */}
              <div style={{
                position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                {[1,2,3,4].map(i => <div key={i} style={{ width: '4px', height: '12px', background: '#0f172a', borderRadius: '2px' }} />)}
              </div>

              {/* ELONGATED SCREEN */}
              <div style={{
                width: '260px', height: '54px',
                background: '#86efac', // Bright Green (Emerald 300)
                border: '2px solid #000',
                position: 'relative',
                display: 'flex', flexDirection: 'column',
                boxShadow: 'inset 0 0 6px rgba(0,0,0,0.2)',
                zIndex: 2,
                overflow: 'hidden',
                marginTop: '18px',
                marginLeft: '18px' 
              }}>
                {/* LCD Grid & Scanlines */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `
                    repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px),
                    repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)
                  `,
                  pointerEvents: 'none'
                }}/>

                {/* Status Bar */}
                <div style={{
                  background: '#4ade80', padding: '4px 8px', // Slightly darker green for status bar
                  display: 'flex', justifyContent: 'space-between',
                  fontFamily: PX_FONT, fontSize: '6px', color: '#000',
                  borderBottom: '2px solid #000'
                }}>
                  <span>SYAFARA v2</span>
                  <span>PW:REQ</span>
                </div>

                {/* Internal Screen Content - Multi-layer Layout */}
                <div style={{
                  flex: 1, padding: '2px 8px', display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center', position: 'relative'
                }}>
                  {/* Decorative side gauge */}
                  <div style={{
                    position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)',
                    display: 'flex', flexDirection: 'column', gap: '2px'
                  }}>
                    {[1,2,3,4,5].map(i => <div key={i} style={{ width: '4px', height: '2px', background: '#000', opacity: i > 3 ? 0.3 : 1 }} />)}
                  </div>

                  <form onSubmit={handleSubmit} style={{ width: '100%', paddingLeft: '8px' }}>
                    <input
                      type="password"
                      placeholder={error ? "tetot! bukan itu madaa" : "panggilan kesayangan abang ke kamu"}
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      style={{
                        width: '100%', background: 'transparent', border: 'none',
                        borderBottom: '2px solid #000', outline: 'none',
                        fontFamily: PX_FONT, fontSize: '6px', color: '#000',
                        textAlign: 'center', paddingBottom: '1px',
                        fontWeight: 'bold'
                      }}
                      autoFocus
                      autoComplete="new-password"
                    />
                  </form>

                  {/* Right side indicator */}
                  <div style={{
                    position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                    width: '3px', height: '12px', border: '1px solid #000', padding: '1px'
                  }}>
                    <div style={{ width: '100%', height: '100%', background: '#000' }} />
                  </div>
                </div>

                {/* Bottom ticker */}
                <div style={{
                  background: '#020617', padding: '4px',
                  color: '#fbbf24', fontFamily: PX_FONT, fontSize: '7px',
                  textAlign: 'center'
                }}>
                  AWAITING INPUT...
                </div>
              </div>

              {/* ELONGATED ACTION AREA */}
              <div style={{
                width: '100%',
                display: 'flex', 
                justifyContent: 'flex-end',
                alignItems: 'center',
                padding: '0 20px',
                zIndex: 2,
                marginTop: 'auto',
                marginBottom: '12px',
                gap: '15px'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      width: '12px', height: '12px', background: '#fb7185',
                      border: '2px solid #000',
                      boxShadow: '0 2px 0 #000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div style={{ width: '4px', height: '4px', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)' }}>
                        {PIX_HEART.flat().map((v, idx) => (
                          <div key={idx} style={{ background: v ? '#fff' : 'transparent' }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Smaller Action Button */}
                <button
                  onClick={handleSubmit}
                  style={{
                    width: '32px', height: '32px',
                    borderRadius: '4px',
                    background: '#fb7185',
                    border: '3px solid #000',
                    boxShadow: '0 3px 0 #000',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(2px)';
                    e.currentTarget.style.boxShadow = '0 1px 0 #000';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 3px 0 #000';
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px',
                    display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)'
                  }}>
                    {PIX_HEART.flat().map((v, i) => (
                      <div key={i} style={{ background: v ? '#fff' : 'transparent', width: '100%', height: '100%' }} />
                    ))}
                  </div>
                </button>
              </div>

              {/* Speaker Grill Detail */}
              <div style={{
                position: 'absolute', bottom: '15px', left: '30px',
                display: 'flex', gap: '3px'
              }}>
                {[1,2,3,4].map(i => <div key={i} style={{ width: '2px', height: '8px', background: '#000', opacity: 0.3 }} />)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}