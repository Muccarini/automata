import type { Edge, Node, XYPosition } from "reactflow"
import type { LucideIcon } from "lucide-react"

export type NodeKind = "trigger" | "http" | "mapper" | "logic" | "enum"

export type NodeDefinitionKey = NodeKind | "global-variable"

export type TriggerType = "cron" | "webhook" | "manual"
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
export type AuthType = "none" | "bearer" | "basic"
export type PredicateOperator = "eq" | "neq" | "gt" | "lt" | "contains"

export type PinKind = "flow" | "data"
export type PinSide = "top-left" | "top-right" | "left" | "right"
export type PinDirection = "input" | "output"
export type InlineValueType = "string" | "integer" | "object" | "enum"

export type SchemaType = "object" | "array" | "string" | "number" | "boolean" | "null" | "unknown"

export type SchemaField = {
  id: string
  name: string
  path: string
  type: SchemaType
  children?: SchemaField[]
}

export type MappingRule = {
  id: string
  inputPath: string
  outputPath: string
}

export type InlineValue =
  | {
      valueType: "string"
      value: string
    }
  | {
      valueType: "integer"
      value: number
    }
  | {
      valueType: "object"
      value: string
    }
  | {
      valueType: "enum"
      value: string
      options: string[]
    }

export type NodeParameter = {
  id: string
  pinId: string
  label: string
  valueType: InlineValueType
  dataPath?: string
  supportsEdgeConnection: boolean
  inlineValue: InlineValue
}

export type NodePinBase = {
  id: string
  kind: PinKind
  direction: PinDirection
  side: PinSide
  label: string
  description?: string
}

export type FlowPin = NodePinBase & {
  kind: "flow"
}

export type DataPin = NodePinBase & {
  kind: "data"
  valueType: InlineValueType
  dataPath?: string
  supportsEdgeConnection?: boolean
  inlineValue?: InlineValue
}

export type NodePin = FlowPin | DataPin

export type NodeMetadata = {
  title: string
  description: string
  category: string
  accentClassName: string
  icon: LucideIcon
}

export type NodePresentation = {
  definitionKey: NodeDefinitionKey
  metadata: NodeMetadata
  pins: NodePin[]
}

export type GraphConnection = {
  id: string
  sourceNodeId: string
  sourcePinId: string
  targetNodeId: string
  targetPinId: string
}

export type TriggerConfig = {
  triggerType: TriggerType
  interval: string
  webhookPath: string
}

export type HttpConfig = {
  method: HttpMethod
  url: string
  headers: Array<{ key: string; value: string }>
  authType: AuthType
  bearerToken: string
  basicUsername: string
  basicPassword: string
  autoDetectedAt?: string
  autoDetectError?: string
}

export type MapperConfig = {
  targetSchemaText: string
  mappings: MappingRule[]
}

export type LogicConfig = {
  leftPath: string
  operator: PredicateOperator
  rightValue: string
}

export type EnumConfig = {
  enumName: string
  values: string[]
  selectedValue: string
}

export type NodeData = {
  label: string
  nodeType: NodeKind
  description: string
  outputSchema: SchemaField[]
  trigger: TriggerConfig
  http: HttpConfig
  mapper: MapperConfig
  logic: LogicConfig
  enum: EnumConfig
}

export type FlowNode = Node<NodeData>
export type FlowEdge = Edge

export type GlobalVariable = {
  id: string
  key: string
  value: string
}

export type GraphSnapshot = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeId: string | null
  globalVariables: GlobalVariable[]
}

export type AddNodeInput = {
  nodeType: NodeKind
  position: XYPosition
}
