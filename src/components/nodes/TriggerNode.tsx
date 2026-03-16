import { Handle, Position, type NodeProps } from "reactflow"

import type { NodeData } from "@/types/graph"

export function TriggerNode({ data }: NodeProps<NodeData>) {
  return (
    <div className="w-64 rounded-lg border border-emerald-500/40 bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-emerald-400">Trigger</span>
        <span className="text-xs text-muted-foreground">{data.trigger.triggerType}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{data.label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{data.description}</p>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-emerald-400" />
    </div>
  )
}
