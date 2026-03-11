import { Handle, Position } from 'reactflow';

function toYouTubeEmbedUrl(input) {
  try {
    const url = new URL(String(input).trim());

    // Shorts: https://youtube.com/shorts/{id}
    if (url.hostname.includes('youtube.com') && url.pathname.startsWith('/shorts/')) {
      const id = url.pathname.split('/shorts/')[1]?.split('/')[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    // Watch: https://www.youtube.com/watch?v={id}
    if (url.hostname.includes('youtube.com') && url.pathname === '/watch') {
      const id = url.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    // youtu.be/{id}
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    return String(input).trim();
  } catch {
    return String(input).trim();
  }
}

export default function YouTubeNode({ data }) {
  const src = toYouTubeEmbedUrl(data?.url);
  const size = Number.isFinite(Number(data?.size)) ? Number(data.size) : 320;
  const cardless = data?.cardless;

  return (
    <div className={cardless ? '' : 'bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-sm p-3 flex flex-col items-center gap-2'}
      style={cardless ? { background: 'transparent', border: 'none', boxShadow: 'none' } : {}}
    >
      {!cardless && <p className="text-[9px] tracking-widest text-[var(--card-muted)] uppercase self-start">meme 📼</p>}
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />

      <iframe
        src={src}
        width={size}
        height={size}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="rounded-lg pointer-events-auto"
        loading="lazy"
        title={data?.title || 'YouTube meme'}
      ></iframe>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
