import type { InputParameterDescriptor } from "@/components/nodes/registry/types"
import type { NodeData } from "@/types/graph"

import { createEnumParameter, createStringParameter } from "./shared"

export function getLogicInputParameters(): InputParameterDescriptor[] {
  return [
    createStringParameter(
      "logic-left-path",
      "data:leftPath",
      "Left Path",
      "logic.leftPath",
      (data) => data.logic.leftPath,
      (data, value) => ({
        ...data,
        logic: {
          ...data.logic,
          leftPath: value,
        },
      })
    ),
    createEnumParameter(
      "logic-operator",
      "data:operator",
      "Operator",
      "logic.operator",
      (data) => data.logic.operator,
      (data, value) => ({
        ...data,
        logic: {
          ...data.logic,
          operator: value as NodeData["logic"]["operator"],
        },
      }),
      () => ["eq", "neq", "gt", "lt", "contains"]
    ),
    createStringParameter(
      "logic-right-value",
      "data:rightValue",
      "Compare",
      "logic.rightValue",
      (data) => data.logic.rightValue,
      (data, value) => ({
        ...data,
        logic: {
          ...data.logic,
          rightValue: value,
        },
      })
    ),
  ]
}