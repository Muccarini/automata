import { Handle, Position, type NodeProps } from "reactflow"

import type { NodeData } from "@/types/graph"

export function HTTPNode({ data }: NodeProps<NodeData>) {
  return (
    <div className="w-72 rounded-lg border border-sky-500/40 bg-card p-3 shadow-sm">
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-sky-400" />
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-sky-400">HTTP</span>
        <span className="text-xs text-muted-foreground">{data.http.method}</span>
      </div>
      <p className="truncate text-sm font-semibold text-foreground">{data.http.url || "No URL"}</p>
      <p className="mt-1 text-xs text-muted-foreground">Schema fields: {data.outputSchema.length}</p>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-sky-400" />
    </div>
  )
}
