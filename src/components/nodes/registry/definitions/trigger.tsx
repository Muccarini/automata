import { BotIcon } from "lucide-react"

import { getNodeInputParameters } from "@/components/nodes/registry/parameters"
import type { INodeDefinition } from "@/components/nodes/registry/types"

import { outputPin, toDataPin } from "./shared"

export const triggerNodeDefinition: INodeDefinition = {
  kind: "trigger",
  metadata: (data) => ({
    title: data.label,
    description: data.description,
    category: "Trigger",
    accentClassName: "text-emerald-400",
    icon: BotIcon,
  }),
  pins: (data) => [
    {
      id: "flow:out",
      kind: "flow",
      direction: "output",
      side: "top-right",
      label: "Exec",
    },
    ...getNodeInputParameters(data).map(toDataPin),
    outputPin("data:payload", "Payload"),
  ],
  renderBody: ({ data }) => (
    <>
      <p className="text-sm font-semibold text-foreground">{data.trigger.triggerType}</p>
      <p className="mt-1 text-xs text-muted-foreground">{data.description}</p>
    </>
  ),
}