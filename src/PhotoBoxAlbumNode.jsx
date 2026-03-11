import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';

export default function PhotoBoxAlbumNode({ data }) {
  const photos = Array.isArray(data?.photos) ? data.photos : [];
  const width = Number.isFinite(Number(data?.width)) ? Number(data.width) : 320;
  // Matches your sample photobox aspect (~768x994)
  const height = Number.isFinite(Number(data?.height)) ? Number(data.height) : 414;

  const sliderRef = useRef(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const lastInteractionRef = useRef(0);
  const gap = 12;
  const slides = useMemo(() => (photos.length ? photos : [null]), [photos]);

  const scrollToIndex = useCallback(
    (nextIndex) => {
      const slider = sliderRef.current;
      if (!slider) return;

      const max = Math.max(0, slides.length - 1);
      const clamped = ((nextIndex % (max + 1)) + (max + 1)) % (max + 1);
      const left = clamped * (width + gap);

      slider.scrollTo({ left, behavior: 'smooth' });
      setIndex(clamped);
    },
    [gap, slides.length, width]
  );

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  useEffect(() => {
    // Keep current index roughly in sync if user swipes/scrolls.
    const slider = sliderRef.current;
    if (!slider) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const step = width + gap;
        const next = step > 0 ? Math.round(slider.scrollLeft / step) : 0;
        setIndex((prev) => (prev === next ? prev : next));
      });
    };

    slider.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      slider.removeEventListener('scroll', onScroll);
    };
  }, [gap, width]);

  useEffect(() => {
    // Auto-swipe (auto-advance) between photos.
    if (slides.length <= 1) return;

    const autoMs = Number.isFinite(Number(data?.autoMs)) ? Number(data.autoMs) : 2600;
    const cooldownMs = 1600;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      const since = Date.now() - (lastInteractionRef.current || 0);
      if (since < cooldownMs) return;
      scrollToIndex(indexRef.current + 1);
    }, Math.max(900, autoMs));

    return () => window.clearInterval(id);
  }, [data?.autoMs, scrollToIndex, slides.length]);

  return (
    <div className={data?.cardless ? '' : 'bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-sm p-3 flex flex-col gap-2'}
      style={data?.cardless ? { background: 'transparent', border: 'none', boxShadow: 'none' } : {}}
    >
      {!data?.cardless && <p className="text-[9px] tracking-widest text-[var(--card-muted)] uppercase">photo box 📸</p>}

      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />

      <div
        ref={sliderRef}
        className="photobox-slider"
        style={{ width, height }}
        aria-label={data?.title || 'photobox album'}
        role="group"
        onClick={(e) => {
          markInteraction();
          const slider = sliderRef.current;
          if (!slider) return;

          const rect = slider.getBoundingClientRect();
          const x = e.clientX - rect.left;

          if (x < rect.width / 2) {
            scrollToIndex(index - 1);
          } else {
            scrollToIndex(index + 1);
          }
        }}
        onPointerDown={markInteraction}
        onTouchStart={markInteraction}
        onWheel={markInteraction}
      >
        {slides.map((src, i) =>
          src ? (
            <img
              key={`${src}-${i}`}
              src={src}
              alt={data?.title ? `${data.title} ${i + 1}` : `photobox ${i + 1}`}
              loading="lazy"
              draggable={false}
              className="photobox-slide pointer-events-none select-none"
              style={{ width, height, objectFit: 'cover', background: '#000' }}
            />
          ) : (
            <div
              key="empty"
              className="photobox-slide rounded-lg border border-[var(--card-border)]"
              style={{ width, height, background: '#000' }}
            />
          )
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
