import { Handle, Position } from 'reactflow';

export default function ListNode({ data }) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-sm w-[260px] p-4 flex flex-col gap-3">
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      {data.title && (
        <p className="text-[10px] font-semibold tracking-widest text-[var(--card-muted)] uppercase mb-1">
          {data.title}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {(data.items || []).map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-[13px] mt-[1px] shrink-0">{data.icon || '✦'}</span>
            <span
              style={{ fontFamily: "'Georgia', serif" }}
              className="text-[13px] leading-snug text-[var(--card-fg)]"
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
