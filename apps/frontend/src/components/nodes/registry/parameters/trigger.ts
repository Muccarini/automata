import type { InputParameterDescriptor } from "@/components/nodes/registry/types"
import type { TriggerArgs } from "@/types/graph"

import { createEnumParameter, createStringParameter } from "./shared"

export function getTriggerInputParameters(): InputParameterDescriptor[] {
  return [
    createEnumParameter(
      "trigger-type",
      "data:triggerType",
      "Type",
      "args.triggerType",
      (data) => (data.nodeType === "trigger" ? data.args.triggerType : "manual"),
      (data, value) =>
        data.nodeType !== "trigger"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                triggerType: value as TriggerArgs["triggerType"],
              },
            },
      () => ["manual", "cron", "webhook"]
    ),
    createStringParameter(
      "trigger-interval",
      "data:triggerInterval",
      "Interval",
      "args.interval",
      (data) => (data.nodeType === "trigger" ? data.args.interval : ""),
      (data, value) =>
        data.nodeType !== "trigger"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                interval: value,
              },
            }
    ),
    createStringParameter(
      "trigger-webhook-path",
      "data:webhookPath",
      "Webhook Path",
      "args.webhookPath",
      (data) => (data.nodeType === "trigger" ? data.args.webhookPath : ""),
      (data, value) =>
        data.nodeType !== "trigger"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                webhookPath: value,
              },
            }
    ),
  ]
}