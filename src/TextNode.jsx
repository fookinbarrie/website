import { Handle, Position } from 'reactflow';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

export default function TextNode({ data }) {
  // Memasukkan teks bawaan dari initialData
  const editor = useCreateBlockNote({
    initialContent: data.content || data.textBlocks,
  });

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-sm min-w-[300px] p-4">
      {data.date && (
        <div className="text-[10px] font-medium tracking-widest text-[var(--card-muted)] uppercase mb-2">
          {data.date}
        </div>
      )}
      <Handle type="target" position={Position.Top} className="w-2 h-2 opacity-0" style={{ opacity: 0, pointerEvents: 'none' }} />
      <div className="nodrag cursor-default">
        {/* editable={false} membuat teksnya jadi read-only */}
        <BlockNoteView editor={editor} editable={false} theme="light" />
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 opacity-0" style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}