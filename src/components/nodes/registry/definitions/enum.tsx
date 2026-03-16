import { ListIcon } from "lucide-react"

import { getNodeInputParameters } from "@/components/nodes/registry/parameters"
import type { INodeDefinition } from "@/components/nodes/registry/types"

import { outputPin, toDataPin } from "./shared"

export const enumNodeDefinition: INodeDefinition = {
  kind: "enum",
  metadata: (data) => ({
    title: data.label,
    description: data.description,
    category: "Strutture",
    accentClassName: "text-rose-400",
    icon: ListIcon,
  }),
  pins: (data) => [
    ...getNodeInputParameters(data).map(toDataPin),
    outputPin("data:enumValue", "Value", "enum"),
  ],
  renderBody: ({ data }) => (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{data.enum.enumName || "Enum"}</span>
        <span className="font-mono text-[11px] text-muted-foreground">{data.enum.values.length} values</span>
      </div>
      <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground" title={data.enum.selectedValue || "No selected value"}>
        {data.enum.selectedValue || "No selected value"}
      </p>
    </>
  ),
}