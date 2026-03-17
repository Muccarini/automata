import type { InputParameterDescriptor } from "@/components/nodes/registry/types"
import type { LogicArgs } from "@/types/graph"

import { createEnumParameter, createStringParameter } from "./shared"

export function getLogicInputParameters(): InputParameterDescriptor[] {
  return [
    createStringParameter(
      "logic-left-path",
      "data:leftPath",
      "Left Path",
      "args.leftPath",
      (data) => (data.nodeType === "logic" ? data.args.leftPath : ""),
      (data, value) =>
        data.nodeType !== "logic"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                leftPath: value,
              },
            }
    ),
    createEnumParameter(
      "logic-operator",
      "data:operator",
      "Operator",
      "args.operator",
      (data) => (data.nodeType === "logic" ? data.args.operator : "eq"),
      (data, value) =>
        data.nodeType !== "logic"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                operator: value as LogicArgs["operator"],
              },
            },
      () => ["eq", "neq", "gt", "lt", "contains"]
    ),
    createStringParameter(
      "logic-right-value",
      "data:rightValue",
      "Compare",
      "args.rightValue",
      (data) => (data.nodeType === "logic" ? data.args.rightValue : ""),
      (data, value) =>
        data.nodeType !== "logic"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                rightValue: value,
              },
            }
    ),
  ]
}