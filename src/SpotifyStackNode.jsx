import { useEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useAudioControl } from './AudioControlContext';

export default function SpotifyStackNode({ data }) {
  const audio = useAudioControl();
  const rootRef = useRef(null);
  const [pausedForSpotify, setPausedForSpotify] = useState(false);

  const tracks = Array.isArray(data?.tracks) ? data.tracks : [];

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
      className={data?.cardless ? '' : 'bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-sm p-3 flex flex-col gap-2'}
      style={data?.cardless ? { background: 'transparent', border: 'none', boxShadow: 'none' } : {}}
      onPointerDownCapture={() => {
        audio?.pauseFor?.('spotify');
        setPausedForSpotify(true);
      }}
    >
      {!data?.cardless && <p className="text-[9px] tracking-widest text-[var(--card-muted)] uppercase">now playing 🎵</p>}

      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />

      <div className="flex flex-col gap-2">
        {tracks.map((url, i) => (
          <iframe
            key={i}
            src={url}
            width="300"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="rounded-lg pointer-events-auto"
            loading="lazy"
          ></iframe>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
