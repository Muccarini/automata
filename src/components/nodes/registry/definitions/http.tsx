import { GlobeIcon } from "lucide-react"

import { getNodeInputParameters } from "@/components/nodes/registry/parameters"
import type { INodeDefinition } from "@/components/nodes/registry/types"

import { renderHttpInspectorOverride } from "./httpInspectorOverride"
import { outputPin, toDataPin } from "./shared"

export const httpNodeDefinition: INodeDefinition = {
  kind: "http",
  disableDefaultInputParameters: true,
  renderInspectorOverride: renderHttpInspectorOverride,
  metadata: (data) => ({
    title: data.label,
    description: data.description,
    category: "HTTP",
    accentClassName: "text-sky-400",
    icon: GlobeIcon,
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
    outputPin("data:response", "Response"),
  ],
  renderBody: ({ data }) => (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{data.http.method}</span>
        <span className="font-mono text-[11px] text-muted-foreground">{data.outputSchema.length} fields</span>
      </div>
      <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground" title={data.http.url || "No URL configured"}>
        {data.http.url || "No URL configured"}
      </p>
    </div>
  ),
}
