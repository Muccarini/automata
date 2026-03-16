import type { InputParameterDescriptor } from "@/components/nodes/registry/types"
import type { NodeData } from "@/types/graph"

import { createEnumParameter, createStringParameter } from "./shared"

export function getTriggerInputParameters(): InputParameterDescriptor[] {
  return [
    createEnumParameter(
      "trigger-type",
      "data:triggerType",
      "Type",
      "trigger.triggerType",
      (data) => data.trigger.triggerType,
      (data, value) => ({
        ...data,
        trigger: {
          ...data.trigger,
          triggerType: value as NodeData["trigger"]["triggerType"],
        },
      }),
      () => ["manual", "cron", "webhook"]
    ),
    createStringParameter(
      "trigger-interval",
      "data:triggerInterval",
      "Interval",
      "trigger.interval",
      (data) => data.trigger.interval,
      (data, value) => ({
        ...data,
        trigger: {
          ...data.trigger,
          interval: value,
        },
      })
    ),
    createStringParameter(
      "trigger-webhook-path",
      "data:webhookPath",
      "Webhook Path",
      "trigger.webhookPath",
      (data) => data.trigger.webhookPath,
      (data, value) => ({
        ...data,
        trigger: {
          ...data.trigger,
          webhookPath: value,
        },
      })
    ),
  ]
}