import { Handle, Position } from 'reactflow';

export default function StickerNode({ data }) {
  const width = Number.isFinite(Number(data?.width)) ? Number(data.width) : 200;

  return (
    <div style={{ background: 'transparent', border: 'none', boxShadow: 'none', lineHeight: 0 }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <img
        src={data.url}
        alt="sticker"
        className="pointer-events-none"
        style={{
          width,
          height: 'auto',
          display: 'block',
          filter: data.shadow ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' : 'none',
        }}
      />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
