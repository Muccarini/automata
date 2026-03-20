import type { ReactNode } from "react"

import type {
  GlobalVariable,
  InlineValue,
  InlineValueType,
  NodeData,
  NodeDataByKind,
  NodeKind,
  NodeMetadata,
  NodePin,
  VariableScope,
} from "@/types/graph"

export type BodyContext<T extends NodeData = NodeData> = {
  data: T
}

export type RuntimeNodeContext<T extends NodeKind = NodeKind> = {
  nodeId: string
  data: NodeDataByKind<T>
  input: unknown
  next: (targetNodeId?: string) => void
  setResult: (patch: Partial<NodeDataByKind<T>["result"]>) => void
  resolveVariable: (scope: VariableScope, key: string) => GlobalVariable | undefined
  log: (message: string, payload?: unknown) => void
}

export type InputParameterDescriptor = {
  id: string
  pinId: string
  label: string
  valueType: InlineValueType
  dataPath?: string
  supportsEdgeConnection: boolean
  getInlineValue: (data: NodeData) => InlineValue
  setInlineValue: (data: NodeData, nextValue: InlineValue) => NodeData
}

export type InspectorOverrideContext<T extends NodeKind = NodeKind> = {
  data: NodeDataByKind<T>
  upstreamSample: unknown
  update: (patch: Partial<NodeDataByKind<T>>) => void
}

export type InspectorContextByKind<T extends NodeKind> = InspectorOverrideContext<T>

export type NodeDefinition<T extends NodeKind = NodeKind> = {
  kind: T
  metadata: (data: NodeDataByKind<T>) => NodeMetadata
  pins: (data: NodeDataByKind<T>) => NodePin[]
  renderBody: (context: BodyContext<NodeDataByKind<T>>) => ReactNode
  disableDefaultInputParameters?: boolean
  renderInspectorOverride?: (context: InspectorOverrideContext<T>) => ReactNode
  onEnter?: (context: RuntimeNodeContext<T>) => void | Promise<void>
  onUpdate?: (context: RuntimeNodeContext<T>) => unknown | Promise<unknown>
  onExit?: (context: RuntimeNodeContext<T>) => void | Promise<void>
}