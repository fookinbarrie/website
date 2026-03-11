import { Handle, Position } from 'reactflow';

export default function ImageNode({ data }) {
  const cardWidth = Number.isFinite(Number(data?.width)) ? Number(data.width) : 300;
  const imgWidth = Number.isFinite(Number(data?.imgWidth)) ? Number(data.imgWidth) : 250;
  const imgHeight = Number.isFinite(Number(data?.imgHeight)) ? Number(data.imgHeight) : null;
  const cardless = data?.cardless;

  return (
    <div
      className={cardless ? '' : 'bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md p-4 flex flex-col items-center'}
      style={cardless ? { background: 'transparent', border: 'none', boxShadow: 'none', lineHeight: 0 } : { width: cardWidth }}
    >
      {!cardless && data.date && (
        <div className="text-[10px] font-medium tracking-widest text-[var(--card-muted)] uppercase mb-2">
          {data.date}
        </div>
      )}
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <img 
        src={data.url} 
        alt="Memori" 
        className="rounded object-cover pointer-events-none"
        style={{ width: imgWidth, height: imgHeight || 'auto' }}
      />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}