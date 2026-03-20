import type { InputParameterDescriptor } from "@/components/nodes/registry/types"

import { createObjectParameter } from "./shared"

export function getMapperInputParameters(): InputParameterDescriptor[] {
  return [
    createObjectParameter(
      "mapper-target-output-json",
      "data:targetOutputJson",
      "Target Output JSON",
      "args.returnJsonText",
      (data) => (data.nodeType === "mapper" ? data.args.returnJsonText : ""),
      (data, value) =>
        data.nodeType !== "mapper"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                returnJsonText: value,
              },
            }
    ),
  ]
}