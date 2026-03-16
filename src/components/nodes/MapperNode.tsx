import { Handle, Position, type NodeProps } from "reactflow"

import type { NodeData } from "@/types/graph"

export function MapperNode({ data }: NodeProps<NodeData>) {
  return (
    <div className="w-72 rounded-lg border border-violet-500/40 bg-card p-3 shadow-sm">
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-violet-400" />
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-violet-400">Mapper</span>
        <span className="text-xs text-muted-foreground">Rules: {data.mapper.mappings.length}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{data.label}</p>
      <p className="mt-1 text-xs text-muted-foreground">Maps upstream payload to target schema</p>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-violet-400" />
    </div>
  )
}
