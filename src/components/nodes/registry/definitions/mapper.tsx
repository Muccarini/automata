import { BracesIcon } from "lucide-react"

import { getNodeInputParameters } from "@/components/nodes/registry/parameters"
import type { INodeDefinition } from "@/components/nodes/registry/types"

import { renderMapperInspectorOverride } from "./mapperInspectorOverride"
import { outputPin, toDataPin } from "./shared"

export const mapperNodeDefinition: INodeDefinition = {
  kind: "mapper",
  disableDefaultInputParameters: true,
  renderInspectorOverride: renderMapperInspectorOverride,
  metadata: (data) => ({
    title: data.label,
    description: data.description,
    category: "Mapper",
    accentClassName: "text-violet-400",
    icon: BracesIcon,
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
      id: "flow:out",
      kind: "flow",
      direction: "output",
      side: "top-right",
      label: "Then",
    },
    ...getNodeInputParameters(data).map(toDataPin),
    outputPin("data:mapped", "Mapped"),
  ],
  renderBody: ({ data }) => (
    <>
      <p className="text-sm font-semibold text-foreground">Mapping rules</p>
      <p className="mt-1 text-xs text-muted-foreground">{data.mapper.mappings.length} active rules</p>
    </>
  ),
}