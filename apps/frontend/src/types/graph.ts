import type { Edge, Node, XYPosition } from "reactflow"
import type { LucideIcon } from "lucide-react"

export type NodeKind = "trigger" | "http" | "mapper" | "logic" | "variable"

export type NodeDefinitionKey = NodeKind | "global-variable"

export type TriggerType = "cron" | "webhook" | "manual"
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
export type AuthType = "none" | "bearer" | "basic"
export type PredicateOperator = "eq" | "neq" | "gt" | "lt" | "contains"

export type PinKind = "flow" | "data"
export type PinSide = "top-left" | "top-right" | "left" | "right"
export type PinDirection = "input" | "output"
export type InlineValueType = "string" | "integer" | "boolean" | "object" | "enum"

export type JsonValueKind = "object" | "array" | "string" | "number" | "boolean" | "null" | "unknown"

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
      valueType: "boolean"
      value: boolean
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

export type TriggerArgs = {
  triggerType: TriggerType
  interval: string
  webhookPath: string
}

export type HttpArgs = {
  method: HttpMethod
  url: string
  headers: Array<{ key: string; value: string }>
  authType: AuthType
  bearerToken: string
  basicUsername: string
  basicPassword: string
}

export type MapperArgs = {
  returnJsonText: string
  mappings: MappingRule[]
}

export type LogicArgs = {
  leftPath: string
  operator: PredicateOperator
  rightValue: string
}

export type VariableScope = "automa" | "tenant"

export type PrimitiveVariableType = "string" | "integer" | "boolean" | "enum"

export type PrimitiveVariableValue = string | number | boolean

export type VariableArgs = {
  scope: VariableScope
  key: string
  valueType: PrimitiveVariableType
}

export type NodeResultBase = {
  error?: string
  outputSample?: unknown
}

export type TriggerResult = NodeResultBase & {
  payload: Record<string, unknown> | null
}

export type HttpResult = NodeResultBase & {
  statusCode: number | null
  responseJson: unknown | null
  responseText: string
  responseHeaders: Array<{ key: string; value: string }>
}

export type MapperResult = NodeResultBase & {
  mappedJson: Record<string, unknown> | null
}

export type LogicResult = NodeResultBase & {
  conditionMatched: boolean | null
}

export type VariableResult = NodeResultBase & {
  value: PrimitiveVariableValue | ""
  scope: VariableScope
  key: string
  valueType: PrimitiveVariableType
}

export type NodeBaseData<I, O extends NodeResultBase> = {
  label: string
  description: string
  args: I
  result: O
}

export type TriggerNodeData = NodeBaseData<TriggerArgs, TriggerResult> & {
  nodeType: "trigger"
}

export type HttpNodeData = NodeBaseData<HttpArgs, HttpResult> & {
  nodeType: "http"
}

export type MapperNodeData = NodeBaseData<MapperArgs, MapperResult> & {
  nodeType: "mapper"
}

export type LogicNodeData = NodeBaseData<LogicArgs, LogicResult> & {
  nodeType: "logic"
}

export type VariableNodeData = NodeBaseData<VariableArgs, VariableResult> & {
  nodeType: "variable"
}

export type NodeData = TriggerNodeData | HttpNodeData | MapperNodeData | LogicNodeData | VariableNodeData

export type NodeDataByKind<K extends NodeKind = NodeKind> = Extract<NodeData, { nodeType: K }>
export type NodeArgsByKind<K extends NodeKind = NodeKind> = NodeDataByKind<K>["args"]
export type NodeResultByKind<K extends NodeKind = NodeKind> = NodeDataByKind<K>["result"]

export type FlowNode = Node<NodeData>
export type FlowEdge = Edge

export type GlobalVariable = {
  id: string
  key: string
  value: string
  valueType: PrimitiveVariableType
  enumOptions: string[]
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
