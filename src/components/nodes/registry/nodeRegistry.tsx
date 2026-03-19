import type { FlowNode, InlineValue, NodeData, NodePresentation } from "@/types/graph"

import { getNodeDefinition } from "./definitions"
import { getNodeInputParametersInternal } from "./parameters"

export { getNodeInputParameters } from "./parameters"
export type { NodeDefinition } from "./types"

export { getNodeDefinition }

export function getNodePresentation(data: NodeData): NodePresentation {
  const definition = getNodeDefinition(data.nodeType)

  return {
    definitionKey: data.nodeType,
    metadata: definition.metadata(data),
    pins: definition.pins(data),
  }
}

export function getPinDefinition(node: FlowNode, pinId: string) {
  return getNodePresentation(node.data).pins.find((pin) => pin.id === pinId)
}

export function updateNodeDataByPin(data: NodeData, pinId: string, nextValue: InlineValue): NodeData {
  const descriptor = getNodeInputParametersInternal(data).find((parameter) => parameter.pinId === pinId)
  if (!descriptor) {
    return data
  }

  return descriptor.setInlineValue(data, nextValue)
}
