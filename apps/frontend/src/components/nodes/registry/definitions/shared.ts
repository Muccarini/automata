import type { DataPin, InlineValueType, NodeParameter } from "@/types/graph"

export function toDataPin(parameter: NodeParameter): DataPin {
  return {
    id: parameter.pinId,
    kind: "data",
    direction: "input",
    side: "left",
    label: parameter.label,
    valueType: parameter.valueType,
    dataPath: parameter.dataPath,
    supportsEdgeConnection: parameter.supportsEdgeConnection,
    inlineValue: parameter.inlineValue,
  }
}

export function outputPin(id: string, label: string, valueType: InlineValueType = "object"): DataPin {
  return {
    id,
    kind: "data",
    direction: "output",
    side: "right",
    label,
    valueType,
  }
}