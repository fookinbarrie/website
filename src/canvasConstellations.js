export function drawDottedLine(ctx, x1, y1, x2, y2, color, alpha) {
  ctx.fillStyle = `rgba(${color},${alpha})`;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(1, Math.floor(Math.hypot(dx, dy)));
  for (let i = 0; i <= steps; i++) {
    if ((i & 1) === 0) continue;
    const t = i / steps;
    const x = Math.round(x1 + dx * t);
    const y = Math.round(y1 + dy * t);
    ctx.fillRect(x, y, 1, 1);
  }
}

export function drawTaurus(ctx, t, taurus) {
  if (!taurus) return;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const scale = taurus._scale || 1;
  const pulse = 0.45 + 0.35 * Math.sin(t * 0.9);
  let lineAlpha = 0.35 + 0.15 * pulse; // Boldened alpha
  let starAlpha = 0.95 + 0.15 * pulse;
  
  // Set thicker line logic like Kirby
  ctx.lineWidth = 1.2 * scale;

  for (const [u, v] of taurus.lines) {
    const p1 = taurus.pts[u];
    const p2 = taurus.pts[v];
    // Bold dotted line
    drawDottedLine(ctx, p1.x, p1.y, p2.x, p2.y, '255,240,255', lineAlpha);
  }

  const glyphRadius = Math.max(1, Math.round(1.5 * scale)); // Slightly larger stars
  for (const key of Object.keys(taurus.pts)) {
    const { x, y } = taurus.pts[key];
    const bright = key === 'alde' ? 1.5 : 1.1;
    const a = clamp01(starAlpha * bright);
    ctx.fillStyle = `rgba(255,255,255,${a})`;

    // Thicker stars like Kirby
    const r = glyphRadius;
    ctx.fillRect(x, y, 1, 1);
    ctx.fillRect(x - r, y, 1, 1);
    ctx.fillRect(x + r, y, 1, 1);
    ctx.fillRect(x, y - r, 1, 1);
    ctx.fillRect(x, y + r, 1, 1);

    if (key === 'alde' || ((x + y + Math.floor(t * 2)) % 6) === 0) {
      ctx.fillStyle = `rgba(255,255,255,${clamp01(a * 0.7)})`;
      const s = 2;
      ctx.fillRect(x - s, y, 1, 1);
      ctx.fillRect(x + s, y, 1, 1);
      ctx.fillRect(x, y - s, 1, 1);
      ctx.fillRect(x, y + s, 1, 1);
    }
  }
}

export function makeTaurus(w, h) {
  const toXY = (nx, ny) => ({ x: Math.floor(nx * w), y: Math.floor(ny * h) });
  // Original position, scaled 1.1x
  const pts = {
    a: toXY(0.85, 0.11),
    b: toXY(0.89, 0.13),
    c: toXY(0.94, 0.15),
    d: toXY(0.86, 0.19),
    e: toXY(0.92, 0.22),
    alde: toXY(0.82, 0.14),
    p1: toXY(0.95, 0.04),
    p2: toXY(0.98, 0.06),
    p3: toXY(0.97, 0.09),
    p4: toXY(0.99, 0.11),
    p5: toXY(0.96, 0.03),
  };
  const lines = [
    ['alde', 'a'], ['a', 'b'], ['b', 'c'], ['a', 'd'], ['d', 'e'], ['c', 'p3'],
  ];
  return { pts, lines };
}

const CUSTOM_SVG_PATH_D = 'M143.5 143.5C138.797 143.437 134.13 143.771 129.5 144.5C132.017 143.027 134.85 142.36 138 142.5C140.033 142.506 141.866 142.839 143.5 143.5Z'
  + 'M143.5 143.5C160.349 144.594 174.683 151.094 186.5 163C189.833 163.667 193.167 163.667 196.5 163C201.993 160.248 207.66 158.082 213.5 156.5C216.373 156.198 219.039 155.531 221.5 154.5C225.813 153.669 230.147 152.836 234.5 152C249.496 151.5 264.496 151.333 279.5 151.5C282.507 153.175 285.84 153.841 289.5 153.5C289.833 153.5 290.167 153.5 290.5 153.5C293.219 154.913 296.219 155.58 299.5 155.5C328.368 163.77 354.368 177.603 377.5 197C380.039 197.796 382.372 197.629 384.5 196.5C388.839 194.811 393.172 193.477 397.5 192.5C442.439 184.956 466.773 203.79 470.5 249C470.476 254.246 470.143 259.412 469.5 264.5C467.717 268.613 466.384 272.946 465.5 277.5C463.912 279.113 462.912 281.113 462.5 283.5C461.508 285.456 460.508 287.456 459.5 289.5C452.483 302.704 443.316 314.37 432 324.5C430.478 326.741 429.145 329.074 428 331.5C427.332 340.85 426.499 350.184 425.5 359.5C422.229 367.312 419.563 375.312 417.5 383.5C417.466 386.433 418.299 389.1 420 391.5C431.897 407.971 442.231 425.304 451 443.5C454.133 452.364 456.799 461.364 459 470.5C462.934 492.331 456.434 510.164 439.5 524C433.482 527.175 427.149 529.508 420.5 531C399.048 533.189 378.048 531.189 357.5 525C331.388 516.775 307.055 505.109 284.5 490C268.168 490.077 251.835 490.077 235.5 490C226.417 487.739 217.417 485.239 208.5 482.5C204.354 481.353 200.02 481.186 195.5 482C194.584 482.278 193.918 482.778 193.5 483.5C190.848 483.41 188.515 484.076 186.5 485.5C176.864 487.043 167.198 488.543 157.5 490C156.584 490.278 155.918 490.778 155.5 491.5C135.831 491.667 116.164 491.5 96.5 491C79.324 489.161 64.4907 482.327 52 470.5C43.6021 457.994 41.2688 444.327 45 429.5C48.3838 419.947 52.8838 410.947 58.5 402.5C69.7885 390.042 81.2885 377.709 93 365.5C90.4798 351.329 88.6465 336.996 87.5 322.5C87.9654 303.269 91.4654 284.602 98 266.5C98.6667 262.167 98.6667 257.833 98 253.5C85.527 227.4 84.1937 200.733 94 173.5C100.934 157.724 112.767 148.058 129.5 144.5C134.13 143.771 138.797 143.437 143.5 143.5Z';

const FACE_SVG_PATHS_D = [
  'M19.8627 62.0003C21.0197 59.2273 21.6867 56.2273 21.8627 53.0003C23.1777 47.8943 25.0117 42.8943 27.3627 38.0003C30.5567 32.9463 33.2237 27.6122 35.3627 22.0002C37.3627 19.3332 39.3627 16.6672 41.3627 14.0002C42.0297 12.6672 42.0297 11.3332 41.3627 10.0002C37.7257 7.58925 36.5587 4.42225 37.8627 0.50025C38.8627 -0.16675 39.8627 -0.16675 40.8627 0.50025C44.3627 4.00025 47.8627 7.50025 51.3627 11.0002C56.4537 18.1802 61.7867 25.1803 67.3627 32.0003C68.5227 36.6523 66.6897 38.6523 61.8627 38.0003C56.5487 56.5993 49.7157 74.5993 41.3627 92.0003C33.4707 100.443 26.4707 99.7773 20.3627 90.0003C19.2777 84.9153 18.7777 79.7483 18.8627 74.5003C18.8637 70.1533 19.1967 65.9863 19.8627 62.0003Z',
  'M44.8627 18.0002C46.7527 17.7972 48.2527 18.4632 49.3627 20.0002C51.3627 22.6672 53.3627 25.3332 55.3627 28.0002C56.0767 32.9192 54.7437 37.2532 51.3627 41.0002C48.8957 43.3022 46.0627 44.9692 42.8627 46.0002C41.3337 45.9712 40.1667 45.3042 39.3627 44.0002C38.6957 39.3332 38.6957 34.6672 39.3627 30.0002C40.9507 25.8282 42.7837 21.8282 44.8627 18.0002Z',
  'M132.863 34.0002C131.46 37.4092 130.793 41.0752 130.863 45.0002C129.57 48.1792 128.903 51.5123 128.863 55.0003C127.323 57.3383 126.657 60.0053 126.863 63.0003C122.29 76.5123 116.79 89.8463 110.363 103C108.265 106.603 105.431 109.27 101.863 111C98.1287 111.177 94.4617 110.844 90.8627 110C87.8037 108.103 85.6367 105.436 84.3627 102C83.6957 92.6673 83.6957 83.3333 84.3627 74.0003C86.3537 68.8523 87.8537 63.5193 88.8627 58.0003C90.0987 55.8513 91.0987 53.5182 91.8627 51.0002C92.0447 48.8252 92.7117 46.8252 93.8627 45.0002C93.1957 43.3332 92.5297 41.6672 91.8627 40.0002C93.3607 37.6712 95.3607 35.8372 97.8627 34.5002C110.296 31.1142 122.629 27.4472 134.863 23.5002C139.518 23.0012 144.184 22.8342 148.863 23.0002C149.185 25.2222 148.518 27.0562 146.863 28.5002C142.799 30.3892 138.466 31.3892 133.863 31.5002C133.111 32.1712 132.777 33.0042 132.863 34.0002Z',
  'M104.863 60.0002C104.58 59.2112 104.08 58.5442 103.363 58.0002C102.864 53.0112 102.697 48.0112 102.863 43.0002C108.894 38.1092 115.894 35.4422 123.863 35.0002C123.035 45.3372 118.702 53.8372 110.863 60.5002C108.651 61.2892 106.651 61.1222 104.863 60.0002Z',
  'M132.863 34.0002C133.028 37.0182 132.861 40.0182 132.363 43.0002C132.085 43.9162 131.585 44.5822 130.863 45.0002C130.793 41.0752 131.46 37.4092 132.863 34.0002Z',
  'M102.863 43.0002C102.697 48.0112 102.864 53.0112 103.363 58.0002C104.08 58.5442 104.58 59.2112 104.863 60.0002C103.867 60.0862 103.034 59.7522 102.363 59.0002C101.546 53.4842 101.712 48.1502 102.863 43.0002Z',
  'M91.8627 51.0002C91.0987 53.5182 90.0987 55.8512 88.8627 58.0002C88.5287 55.0092 89.5287 52.6762 91.8627 51.0002Z',
  'M21.8628 53.0002C21.6868 56.2272 21.0198 59.2272 19.8628 62.0002C19.5778 58.6712 20.2448 55.6712 21.8628 53.0002Z',
  'M128.863 55.0002C128.798 57.9282 128.131 60.5952 126.863 63.0002C126.657 60.0052 127.323 57.3382 128.863 55.0002Z',
  'M29.8627 69.0002C31.1537 68.7632 32.1537 69.0962 32.8627 70.0002C35.8627 71.3332 38.8627 72.6672 41.8627 74.0002C40.1977 79.1632 37.8647 83.9962 34.8627 88.5002C31.4357 89.6662 28.7697 88.8322 26.8627 86.0002C26.8627 80.3332 26.8627 74.6672 26.8627 69.0002C27.8627 69.0002 28.8627 69.0002 29.8627 69.0002Z',
  'M32.8627 70.0002C35.8437 71.3262 38.8437 71.3262 41.8627 70.0002C44.0507 71.0742 44.0507 72.4082 41.8627 74.0002C38.8627 72.6672 35.8627 71.3332 32.8627 70.0002Z',
  'M29.8627 69.0003C28.8627 69.0003 27.8627 69.0003 26.8627 69.0003C26.8627 74.6673 26.8627 80.3333 26.8627 86.0003C25.8727 79.8553 25.5397 73.5223 25.8627 67.0003C27.7427 66.7293 29.0757 67.3963 29.8627 69.0003Z',
  'M104.863 85.0002C106.236 84.8432 107.57 85.0102 108.863 85.5002C108.026 86.5112 107.693 87.6782 107.863 89.0002C106.788 94.7402 104.121 99.5742 99.8627 103.5C96.1327 104.479 93.2987 103.313 91.3627 100C90.5317 93.3082 90.6987 86.6422 91.8627 80.0002C95.4957 83.4342 99.8287 85.1012 104.863 85.0002Z',
  'M107.863 89.0002C107.693 87.6782 108.026 86.5112 108.863 85.5002C107.57 85.0102 106.236 84.8432 104.863 85.0002C106.564 83.0772 108.564 82.7432 110.863 84.0002C110.088 85.8962 109.088 87.5632 107.863 89.0002Z',
  'M59.8627 105C53.8537 105.201 47.8537 105.534 41.8627 106C47.7967 104.005 53.7967 103.671 59.8627 105Z',
  'M59.8628 105C65.2638 104.466 70.2637 105.633 74.8627 108.5C84.5617 113.862 92.7287 121.029 99.3627 130C104.447 137.568 109.28 145.235 113.863 153C112.856 151.799 111.19 151.799 108.863 153C106.84 149.461 104.174 146.295 100.863 143.5C83.5967 141.286 67.9308 145.286 53.8628 155.5C28.6188 177.547 16.7858 205.38 18.3628 239C19.0798 239.544 19.5798 240.211 19.8628 241C18.1968 242.166 16.5298 242.166 14.8628 241C13.3628 238 11.8628 235 10.3628 232C9.97975 232.556 9.47975 232.889 8.86275 233C7.27975 228.756 5.94575 224.422 4.86275 220C2.87275 212.656 1.53975 205.323 0.862751 198C-0.760249 184.548 -0.0932496 171.214 2.86275 158C3.97475 155.901 4.64175 153.567 4.86275 151C9.54375 129.657 21.8768 114.657 41.8628 106C47.8538 105.534 53.8538 105.201 59.8628 105Z',
  'M90.8627 110C94.4617 110.844 98.1287 111.177 101.863 111C98.7227 112.141 95.3897 112.308 91.8627 111.5C91.3067 111.117 90.9737 110.617 90.8627 110Z',
  'M4.86277 151C4.64177 153.567 3.97477 155.901 2.86277 158C2.53377 155.272 3.19977 152.938 4.86277 151Z',
  'M113.863 153C118.828 160.673 122.495 169.006 124.863 178C125.873 182.114 126.873 186.114 127.863 190C127.579 191.915 127.912 193.581 128.863 195C129.1 205.698 128.767 216.365 127.863 227C125.101 250.339 113.101 267.172 91.8627 277.5C62.0557 285.012 37.8887 276.512 19.3627 252C15.3287 245.929 11.8287 239.596 8.86273 233C9.47973 232.889 9.97973 232.556 10.3627 232C11.8627 235 13.3627 238 14.8627 241C16.5297 242.166 18.1967 242.166 19.8627 241C28.3477 258.809 42.3477 269.475 61.8627 273C69.0177 274.155 76.3507 274.322 83.8627 273.5C86.0857 272.934 88.0857 272.1 89.8627 271C93.5607 270.318 96.8937 268.818 99.8627 266.5C108.793 258.928 115.293 249.761 119.363 239C121.817 222.424 122.484 205.758 121.363 189C120.517 185.112 119.35 181.445 117.863 178C117.953 175.348 117.287 173.015 115.863 171C114.091 164.788 111.758 158.788 108.863 153C111.19 151.799 112.856 151.799 113.863 153Z',
  'M115.863 171C117.287 173.015 117.953 175.348 117.863 178C116.439 175.985 115.773 173.652 115.863 171Z',
  'M124.863 178C126.012 178.291 126.679 179.124 126.863 180.5C127.619 183.625 127.952 186.791 127.863 190C126.873 186.114 125.873 182.114 124.863 178Z',
  'M128.863 195C130.021 204.491 130.188 214.158 129.363 224C129.131 225.237 128.631 226.237 127.863 227C128.767 216.365 129.1 205.698 128.863 195Z',
  'M0.862746 198C1.53975 205.323 2.87275 212.656 4.86275 220C4.24575 219.889 3.74575 219.556 3.36275 219C1.37475 212.139 0.540746 205.139 0.862746 198Z',
  'M89.8627 271C88.0857 272.1 86.0857 272.934 83.8627 273.5C76.3507 274.322 69.0177 274.155 61.8627 273C71.3117 273.44 80.6447 272.773 89.8627 271Z',
];

function tokenizeSvgPath(d) {
  return (d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? []).map((t) => {
    if (/^[a-zA-Z]$/.test(t)) return t;
    return Number(t);
  });
}

function cubicAt(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return (
    u * u * u * p0 +
    3 * u * u * t * p1 +
    3 * u * t * t * p2 +
    t * t * t * p3
  );
}

function sampleSvgPathToPoints(d, maxPoints = 1800) {
  const tokens = tokenizeSvgPath(d);
  let i = 0;
  let cmd = null;
  let x = 0, y = 0, sx = 0, sy = 0;
  const pts = [];

  const push = (px, py) => { pts.push({ x: px, y: py }); };

  while (i < tokens.length && pts.length < maxPoints) {
    const t = tokens[i++];
    if (typeof t === 'string') { cmd = t; continue; }
    if (!cmd) continue;
    const isRel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();

    const read = (n) => {
      const out = [t];
      while (out.length < n && i < tokens.length) {
        const v = tokens[i++];
        if (typeof v === 'string') { cmd = v; break; }
        out.push(v);
      }
      return out;
    };

    if (C === 'M') {
      const [mx, my] = read(2);
      x = isRel ? x + mx : mx; y = isRel ? y + my : my;
      sx = x; sy = y; push(x, y);
      cmd = isRel ? 'l' : 'L'; continue;
    }
    if (C === 'L') {
      const [lx, ly] = read(2);
      x = isRel ? x + lx : lx; y = isRel ? y + ly : ly; push(x, y); continue;
    }
    if (C === 'H') {
      const [hx] = read(1);
      x = isRel ? x + hx : hx; push(x, y); continue;
    }
    if (C === 'V') {
      const [vy] = read(1);
      y = isRel ? y + vy : vy; push(x, y); continue;
    }
    if (C === 'C') {
      const [x1, y1, x2, y2, x3, y3] = read(6);
      const ax1 = isRel ? x + x1 : x1, ay1 = isRel ? y + y1 : y1;
      const ax2 = isRel ? x + x2 : x2, ay2 = isRel ? y + y2 : y2;
      const ax3 = isRel ? x + x3 : x3, ay3 = isRel ? y + y3 : y3;
      const steps = 10;
      for (let s = 1; s <= steps; s++) {
        const tt = s / steps;
        push(cubicAt(x, ax1, ax2, ax3, tt), cubicAt(y, ay1, ay2, ay3, tt));
        if (pts.length >= maxPoints) break;
      }
      x = ax3; y = ay3; continue;
    }
    if (C === 'Z') {
      x = sx; y = sy; push(x, y); continue;
    }
  }
  return pts;
}

function sampleSvgPathsToPoints(paths, perPathMax = 700) {
  const out = [];
  for (const d of paths) out.push(...sampleSvgPathToPoints(d, perPathMax));
  return out;
}

function bboxOfPoints(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

function selectConstellationStars(points, maxStars = 70, minDist = 18) {
  const out = [];
  for (let i = 0; i < points.length && out.length < maxStars; i++) {
    const p = points[i];
    let ok = true;
    for (const q of out) {
      if ((p.x - q.x)**2 + (p.y - q.y)**2 < minDist**2) { ok = false; break; }
    }
    if (ok) out.push(p);
  }
  if (out.length < Math.min(24, maxStars)) {
    const step = Math.max(1, Math.floor(points.length / Math.min(40, maxStars)));
    for (let i = 0; i < points.length && out.length < maxStars; i += step) out.push(points[i]);
  }
  return out.slice(0, maxStars);
}

const CUSTOM_SVG_SAMPLES = sampleSvgPathToPoints(CUSTOM_SVG_PATH_D);
const CUSTOM_SVG_STARS = selectConstellationStars(CUSTOM_SVG_SAMPLES);
const CUSTOM_SVG_BBOX = bboxOfPoints(CUSTOM_SVG_STARS);

const FACE_SVG_SAMPLES = sampleSvgPathsToPoints(FACE_SVG_PATHS_D);
const FACE_SVG_STARS = selectConstellationStars(FACE_SVG_SAMPLES, 72, 7);
const FACE_SVG_BBOX = bboxOfPoints(FACE_SVG_STARS);

export function makeCustomSvgConstellation(w, h) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const base = Math.max(26, Math.floor(Math.min(w, h) * 0.32));
  const boxW = Math.floor(base * 0.92);
  const boxH = Math.floor(base * 0.92);
  const x0 = clamp(Math.floor(w * 0.06), 2, Math.max(2, w - boxW - 2));
  const y0 = clamp(Math.floor(h * 0.70), 2, Math.max(2, h - boxH - 2));

  const { minX, minY, maxX, maxY } = CUSTOM_SVG_BBOX;
  const sw = Math.max(1e-6, maxX - minX);
  const sh = Math.max(1e-6, maxY - minY);
  const s = Math.min(boxW / sw, boxH / sh);
  const ox = x0 + Math.floor((boxW - sw * s) * 0.5);
  const oy = y0 + Math.floor((boxH - sh * s) * 0.5);

  const pts = {};
  for (let i = 0; i < CUSTOM_SVG_STARS.length; i++) {
    const p = CUSTOM_SVG_STARS[i];
    pts[`s${i}`] = {
      x: Math.floor(ox + (p.x - minX) * s),
      y: Math.floor(oy + (p.y - minY) * s),
    };
  }

  const lines = [];
  for (let i = 0; i < CUSTOM_SVG_STARS.length - 1; i++) lines.push([`s${i}`, `s${i + 1}`]);

  const bodyMinX = ox, bodyMinY = oy;
  const bodyW = Math.floor(sw * s), bodyH = Math.floor(sh * s);
  const innerX = bodyMinX + Math.floor(bodyW * 0.34);
  const innerY = bodyMinY + Math.floor(bodyH * 0.34);
  const innerW = Math.max(10, Math.floor(bodyW * 0.34));
  const innerH = Math.max(10, Math.floor(bodyH * 0.34));

  const fbb = FACE_SVG_BBOX;
  const fsw = Math.max(1e-6, fbb.maxX - fbb.minX);
  const fsh = Math.max(1e-6, fbb.maxY - fbb.minY);
  const fs = Math.min(innerW / fsw, innerH / fsh);
  const fox = innerX + Math.floor((innerW - fsw * fs) * 0.5);
  const foy = innerY + Math.floor((innerH - fsh * fs) * 0.5);

  for (let i = 0; i < FACE_SVG_STARS.length; i++) {
    const p = FACE_SVG_STARS[i];
    pts[`f${i}`] = {
      x: Math.floor(fox + (p.x - fbb.minX) * fs),
      y: Math.floor(foy + (p.y - fbb.minY) * fs),
    };
  }

  return { pts, lines };
}

export function drawCustomSvg(ctx, t, customSvg) {
  if (!customSvg) return;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const pulse = 0.35 + 0.25 * Math.sin(t * 0.8);
  const lineAlpha = 0.18 + 0.08 * pulse;
  const starAlpha = 0.82 + 0.20 * pulse;
  const rgb = '255,140,210';
  const dim = 0.75;

  for (const [u, v] of customSvg.lines) {
    const p1 = customSvg.pts[u];
    const p2 = customSvg.pts[v];
    drawDottedLine(ctx, p1.x, p1.y, p2.x, p2.y, rgb, lineAlpha * dim);
  }

  for (const key of Object.keys(customSvg.pts)) {
    const { x, y } = customSvg.pts[key];
    const isFace = key[0] === 'f';
    const isBody = key[0] === 's';
    const idx = Number(key.slice(1)) || 0;

    let bright = 0.95;
    if (isBody && idx === 0) bright = 1.22;
    else if (isBody && (idx % 11) === 0) bright = 1.12;
    else if (isFace && (idx % 17) === 0) bright = 1.03;

    const a = clamp01(starAlpha * bright * dim);
    ctx.fillStyle = `rgba(${rgb},${a})`;
    ctx.fillRect(x, y, 1, 1);

    if (isBody || isFace) {
      const armAlpha = clamp01(a * (isFace ? 0.78 : 1));
      ctx.fillStyle = `rgba(${rgb},${armAlpha})`;
      ctx.fillRect(x - 1, y, 1, 1);
      ctx.fillRect(x + 1, y, 1, 1);
      ctx.fillRect(x, y - 1, 1, 1);
      ctx.fillRect(x, y + 1, 1, 1);

      if (((x + y + Math.floor(t * 2)) % 9) === 0) {
        const sparkAlpha = clamp01(armAlpha * 0.85);
        ctx.fillStyle = `rgba(${rgb},${sparkAlpha})`;
        ctx.fillRect(x - 2, y, 1, 1);
        ctx.fillRect(x + 2, y, 1, 1);
        ctx.fillRect(x, y - 2, 1, 1);
        ctx.fillRect(x, y + 2, 1, 1);
      }
    }
  }
}

