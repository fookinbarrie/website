import { Handle, Position } from 'reactflow';

export default function NoteNode({ data }) {
  const bg = data.bg || '#fff9c4';
  const rotate = data.rotate || '0deg';

  return (
    <div
      style={{ background: bg, transform: `rotate(${rotate})` }}
      className="w-[200px] min-h-[120px] rounded-md shadow-md p-4 flex flex-col gap-2"
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      {data.label && (
        <p className="text-[10px] font-semibold tracking-widest text-[#a1a1aa] uppercase">
          {data.label}
        </p>
      )}
      <p
        style={{ fontFamily: "'Georgia', serif" }}
        className="text-[13px] leading-relaxed text-[#3f3f46] whitespace-pre-wrap"
      >
        {data.text}
      </p>
      {data.author && (
        <p className="text-[10px] text-[#a1a1aa] self-end mt-auto">— {data.author}</p>
      )}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
