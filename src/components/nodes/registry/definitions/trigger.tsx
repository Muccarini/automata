import { ZapIcon } from "lucide-react"

import { getNodeInputParameters } from "@/components/nodes/registry/parameters"
import type { INodeDefinition } from "@/components/nodes/registry/types"

import { outputPin, toDataPin } from "./shared"

export const triggerNodeDefinition: INodeDefinition<"trigger"> = {
  kind: "trigger",
  metadata: (data) => ({
    title: data.label,
    description: data.description,
    category: "Trigger",
    accentClassName: "text-amber-500",
    icon: ZapIcon,
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
  renderBody: ({ data }) => {
    return (
      <>
        <p className="text-sm font-semibold text-foreground">{data.args.triggerType}</p>
        <p className="mt-1 text-xs text-muted-foreground">{data.description}</p>
      </>
    )
  },
  onEnter: ({ data, log, setResult }) => {
    log("onEnter", { triggerType: data.args.triggerType })
    setResult({
      payload: data.result.payload,
      outputSample: data.result.payload,
      error: undefined,
    })
  },
  onUpdate: ({ data, log, setResult }) => {
    const payload = {
      triggerType: data.args.triggerType,
      interval: data.args.interval,
      webhookPath: data.args.webhookPath,
    }
    setResult({ payload, outputSample: payload, error: undefined })
    log("onUpdate", payload)
    return payload
  },
  onExit: ({ next, log }) => {
    log("onExit")
    next()
  },
}