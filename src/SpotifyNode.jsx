import { useEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useAudioControl } from './AudioControlContext';

export default function SpotifyNode({ data }) {
  const audio = useAudioControl();
  const rootRef = useRef(null);
  const [pausedForSpotify, setPausedForSpotify] = useState(false);

  useEffect(() => {
    if (!pausedForSpotify) return;

    const onPointerDown = (e) => {
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(e.target)) return;

      audio?.resumeFor?.('spotify');
      setPausedForSpotify(false);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [audio, pausedForSpotify]);

  return (
    <div
      ref={rootRef}
      className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-sm p-2 flex flex-col items-center gap-1"
      onPointerDownCapture={() => {
        audio?.pauseFor?.('spotify');
        setPausedForSpotify(true);
      }}
    >
      <p className="text-[9px] tracking-widest text-[var(--card-muted)] uppercase self-start">now playing 🎵</p>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <iframe
        src={data.url}
        width="300"
        height="80"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="rounded-lg pointer-events-auto"
        loading="lazy"
      ></iframe>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}