import { Handle, Position } from 'reactflow';

export default function PolaroidNode({ data }) {
  const rotate = data.rotate || '0deg';
  const cardWidth = data.width ?? 220;
  const imgHeight = data.imgHeight ?? 160;

  return (
    <div
      style={{ transform: `rotate(${rotate})` }}
      className="bg-[var(--card-bg)] border border-[var(--card-border)] p-3 pb-8 shadow-md rounded-sm flex flex-col gap-2"
      aria-label={data.caption || 'polaroid'}
      role="group"
      data-node-type="polaroid"
    >
      <div style={{ width: cardWidth }} className="flex flex-col gap-2">
        <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
        <img
          src={data.url}
          alt={data.caption || 'memory'}
          className="w-full object-cover rounded-sm"
          style={{ height: imgHeight }}
        />
        {data.caption && (
          <p
            style={{ fontFamily: "'Georgia', serif" }}
            className="text-[12px] text-center text-[var(--card-muted)] mt-1 italic"
          >
            {data.caption}
          </p>
        )}
        {data.date && (
          <p className="text-[9px] text-center tracking-widest text-[var(--card-muted)] uppercase">
            {data.date}
          </p>
        )}
        <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
      </div>
    </div>
  );
}
