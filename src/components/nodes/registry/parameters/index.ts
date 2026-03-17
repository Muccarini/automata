import type { NodeData, NodeKind, NodeParameter } from "@/types/graph"

import type { InputParameterDescriptor } from "@/components/nodes/registry/types"

import { getHttpInputParameters } from "./http"
import { getLogicInputParameters } from "./logic"
import { getMapperInputParameters } from "./mapper"
import { getTriggerInputParameters } from "./trigger"
import { getVariableInputParameters } from "./variable"

const parameterRegistry: Record<NodeKind, (data: NodeData) => InputParameterDescriptor[]> = {
  trigger: () => getTriggerInputParameters(),
  http: () => getHttpInputParameters(),
  mapper: () => getMapperInputParameters(),
  logic: () => getLogicInputParameters(),
  variable: () => getVariableInputParameters(),
}

export function getNodeInputParametersInternal(data: NodeData) {
  return parameterRegistry[data.nodeType](data)
}

export function getNodeInputParameters(data: NodeData): NodeParameter[] {
  return getNodeInputParametersInternal(data).map((parameter) => ({
    id: parameter.id,
    pinId: parameter.pinId,
    label: parameter.label,
    valueType: parameter.valueType,
    dataPath: parameter.dataPath,
    supportsEdgeConnection: parameter.supportsEdgeConnection,
    inlineValue: parameter.getInlineValue(data),
  }))
}