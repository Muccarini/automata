import type { ReactNode } from "react"

import type {
  InlineValue,
  InlineValueType,
  MappingRule,
  NodeData,
  NodeKind,
  NodeMetadata,
  NodePin,
  SchemaField,
} from "@/types/graph"

export type BodyContext = {
  data: NodeData
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

export type InspectorOverrideContext = {
  nodeId: string
  data: NodeData
  upstreamSchema: SchemaField[]
  updateNodeData: (nodeId: string, update: Partial<NodeData>) => void
  setNodeOutputSchema: (nodeId: string, schema: SchemaField[]) => void
  setMapperRules: (nodeId: string, mappings: MappingRule[]) => void
  detectHttpSchema: (nodeId: string) => Promise<void>
}

export interface INodeDefinition {
  kind: NodeKind
  metadata: (data: NodeData) => NodeMetadata
  pins: (data: NodeData) => NodePin[]
  renderBody: (context: BodyContext) => ReactNode
  disableDefaultInputParameters?: boolean
  renderInspectorOverride?: (context: InspectorOverrideContext) => ReactNode
}