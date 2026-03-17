import type { ReactNode } from "react"

import type {
  InlineValue,
  InlineValueType,
  NodeData,
  NodeDataByKind,
  NodeKind,
  NodeMetadata,
  NodePin,
} from "@/types/graph"

export type BodyContext<T extends NodeData = NodeData> = {
  data: T
}

export type RuntimeNodeContext<K extends NodeKind = NodeKind> = {
  nodeId: string
  data: NodeDataByKind<K>
  input: unknown
  next: (targetNodeId?: string) => void
  setResult: (patch: Partial<NodeDataByKind<K>["result"]>) => void
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

export type InspectorOverrideContext<K extends NodeKind = NodeKind> = {
  data: NodeDataByKind<K>
  upstreamSample: unknown
  update: (patch: Partial<NodeDataByKind<K>>) => void
}

export type InspectorContextByKind<K extends NodeKind> = InspectorOverrideContext<K>

export interface INodeDefinition<K extends NodeKind = NodeKind> {
  kind: K
  metadata: (data: NodeDataByKind<K>) => NodeMetadata
  pins: (data: NodeDataByKind<K>) => NodePin[]
  renderBody: (context: BodyContext<NodeDataByKind<K>>) => ReactNode
  disableDefaultInputParameters?: boolean
  renderInspectorOverride?: (context: InspectorOverrideContext<K>) => ReactNode
  onEnter?: (context: RuntimeNodeContext<K>) => void | Promise<void>
  onUpdate?: (context: RuntimeNodeContext<K>) => unknown | Promise<unknown>
  onExit?: (context: RuntimeNodeContext<K>) => void | Promise<void>
}