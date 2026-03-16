import { GitBranchIcon } from "lucide-react"

import { getNodeInputParameters } from "@/components/nodes/registry/parameters"
import type { INodeDefinition } from "@/components/nodes/registry/types"

import { toDataPin } from "./shared"

export const logicNodeDefinition: INodeDefinition = {
  kind: "logic",
  metadata: (data) => ({
    title: data.label,
    description: data.description,
    category: "If / Else",
    accentClassName: "text-amber-400",
    icon: GitBranchIcon,
  }),
  pins: (data) => [
    {
      id: "flow:in",
      kind: "flow",
      direction: "input",
      side: "top-left",
      label: "Exec",
    },
    {
      id: "flow:true",
      kind: "flow",
      direction: "output",
      side: "top-right",
      label: "True",
    },
    {
      id: "flow:false",
      kind: "flow",
      direction: "output",
      side: "top-right",
      label: "False",
    },
    ...getNodeInputParameters(data).map(toDataPin),
  ],
  renderBody: ({ data }) => (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{data.logic.leftPath || "left.path"}</span>
        <span className="text-xs text-muted-foreground">{data.logic.operator}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Routes to true or false execution paths.</p>
    </>
  ),
}