import { BracesIcon } from "lucide-react"

import { getNodeInputParameters } from "@/components/nodes/registry/parameters"
import type { NodeDefinition } from "@/components/nodes/registry/types"

import { renderMapperInspectorOverride } from "./mapperInspectorOverride"
import { outputPin, toDataPin } from "./shared"

export const mapperNodeDefinition: NodeDefinition<"mapper"> = {
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
  renderBody: ({ data }) => {
    return (
      <>
        <p className="text-sm font-semibold text-foreground">Mapping rules</p>
        <p className="mt-1 text-xs text-muted-foreground">{data.args.mappings.length} active rules</p>
      </>
    )
  },
  onEnter: ({ log }) => {
    log("onEnter")
  },
  onUpdate: ({ data, log, setResult }) => {
    try {
      const parsed = JSON.parse(data.args.returnJsonText) as unknown
      const mappedJson =
        parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
      setResult({
        mappedJson,
        outputSample: mappedJson,
        error: undefined,
      })
      log("onUpdate", { mappings: data.args.mappings.length })
      return mappedJson
    } catch {
      setResult({
        mappedJson: null,
        outputSample: undefined,
        error: "Mapper target output JSON is invalid",
      })
      log("onUpdate", { hasError: true })
      return null
    }
  },
  onExit: ({ next, log }) => {
    log("onExit")
    next()
  },
}