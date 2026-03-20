import { Handle, Position, type NodeProps } from "reactflow"

import type { LogicNodeData } from "@/types/graph"

export function LogicIfElseNode({ data }: NodeProps<LogicNodeData>) {
  const args = data.args

  return (
    <div className="w-72 rounded-lg border border-amber-500/40 bg-card p-3 shadow-sm">
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-amber-400" />
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-amber-400">If / Else</span>
        <span className="text-xs text-muted-foreground">{args.operator}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{args.leftPath}</p>
      <p className="mt-1 text-xs text-muted-foreground">Compare against: {args.rightValue || "<empty>"}</p>
      <Handle id="true" type="source" position={Position.Bottom} className="!left-[30%] !h-3 !w-3 !bg-emerald-400" />
      <Handle id="false" type="source" position={Position.Bottom} className="!left-[70%] !h-3 !w-3 !bg-rose-400" />
    </div>
  )
}
