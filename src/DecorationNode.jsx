import React from "react";
import { Handle, Position } from "reactflow";

const DecorationNode = ({ data }) => (
  <div className="bg-transparent border-none shadow-none flex items-center justify-center w-[60px] h-[60px]">
    <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
    {data.url ? (
      <img src={data.url} alt="Decoration" className="w-[60px] h-[60px] object-contain" />
    ) : data.emoji ? (
      <span className="text-[48px] w-[60px] h-[60px] flex items-center justify-center select-none">
        {data.emoji}
      </span>
    ) : null}
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
  </div>
);

export default DecorationNode;
