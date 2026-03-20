import type { Edge, Node, XYPosition } from "reactflow"
import type { LucideIcon } from "lucide-react"

/** Discriminant identifying which kind of node is placed in the graph. */
export type NodeKind = "trigger" | "http" | "mapper" | "logic" | "variable"

/** Key used to look up a node or variable definition, extending NodeKind with the global-variable panel entry. */
export type NodeDefinitionKey = NodeKind | "global-variable"

/** How an automation is initiated: on a schedule, via webhook, or manually. */
export type TriggerType = "cron" | "webhook" | "manual"
/** HTTP verb used when an HTTP node fires a request. */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
/** Authentication strategy applied to an HTTP node request. */
export type AuthType = "none" | "bearer" | "basic"
/** Comparison operator evaluated inside a logic node condition. */
export type PredicateOperator = "eq" | "neq" | "gt" | "lt" | "contains"

/** Whether a pin carries execution flow or a typed data value. */
export type PinKind = "flow" | "data"
/** Visual placement of a pin on the node card. */
export type PinSide = "top-left" | "top-right" | "left" | "right"
/** Whether a pin receives values from upstream or emits them downstream. */
export type PinDirection = "input" | "output"
/** The data type of a value that can be stored inline on a pin or parameter. */
export type InlineValueType = "string" | "integer" | "boolean" | "object" | "enum"

/** Discriminant for a JSON value when inspecting node output samples. */
export type JsonValueKind = "object" | "array" | "string" | "number" | "boolean" | "null" | "unknown"

/** A single field-mapping rule from an input JSON path to an output JSON path. */
export type MappingRule = {
  id: string
  inputPath: string
  outputPath: string
}

/** Tagged union of a statically-typed value stored inline on a pin or parameter. */
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

/** A configurable input parameter exposed in a node's settings panel. */
export type NodeParameter = {
  id: string
  pinId: string
  label: string
  valueType: InlineValueType
  dataPath?: string
  supportsEdgeConnection: boolean
  inlineValue: InlineValue
}

/** Common fields shared by every node pin regardless of kind. */
export type NodePinBase = {
  id: string
  kind: PinKind
  direction: PinDirection
  side: PinSide
  label: string
  description?: string
}

/** A pin that carries execution flow between nodes (no data payload). */
export type FlowPin = NodePinBase & {
  kind: "flow"
}

/** A pin that carries a typed data value between nodes. */
export type DataPin = NodePinBase & {
  kind: "data"
  valueType: InlineValueType
  dataPath?: string
  supportsEdgeConnection?: boolean
  inlineValue?: InlineValue
}

/** Union of all pin variants that can appear on a node. */
export type NodePin = FlowPin | DataPin

/** Display metadata used to render a node type in the UI palette and canvas. */
export type NodeMetadata = {
  title: string
  description: string
  category: string
  accentClassName: string
  icon: LucideIcon
}

/** Full visual descriptor for a node type: its palette metadata and pin layout. */
export type NodePresentation = {
  definitionKey: NodeDefinitionKey
  metadata: NodeMetadata
  pins: NodePin[]
}

/** A directed edge connecting a source pin to a target pin in the graph. */
export type GraphConnection = {
  id: string
  sourceNodeId: string
  sourcePinId: string
  targetNodeId: string
  targetPinId: string
}

/** Configuration arguments for a trigger node (how and when the automation starts). */
export type TriggerArgs = {
  triggerType: TriggerType
  interval: string
  webhookPath: string
}

/** Configuration arguments for an HTTP node (target, method, headers, auth). */
export type HttpArgs = {
  method: HttpMethod
  url: string
  headers: Array<{ key: string; value: string }>
  authType: AuthType
  bearerToken: string
  basicUsername: string
  basicPassword: string
}

/** Configuration arguments for a mapper node (field mappings and fallback JSON). */
export type MapperArgs = {
  returnJsonText: string
  mappings: MappingRule[]
}

/** Configuration arguments for a logic node (left operand, operator, right value). */
export type LogicArgs = {
  leftPath: string
  operator: PredicateOperator
  rightValue: string
}

/** Whether a variable is scoped to a single automation or shared across the tenant. */
export type VariableScope = "automa" | "tenant"

/** Allowed primitive types for a variable's stored value. */
export type PrimitiveVariableType = "string" | "integer" | "boolean" | "enum"

/** Runtime representation of a primitive variable value. */
export type PrimitiveVariableValue = string | number | boolean

/** Configuration arguments for a variable node (which variable to read/write). */
export type VariableArgs = {
  scope: VariableScope
  key: string
  valueType: PrimitiveVariableType
}

/** Common result fields present in every node's execution output. */
export type NodeResultBase = {
  error?: string
  outputSample?: unknown
}

/** Execution result of a trigger node, carrying the incoming event payload. */
export type TriggerResult = NodeResultBase & {
  payload: Record<string, unknown> | null
}

/** Execution result of an HTTP node, carrying status, body, and response headers. */
export type HttpResult = NodeResultBase & {
  statusCode: number | null
  responseJson: unknown | null
  responseText: string
  responseHeaders: Array<{ key: string; value: string }>
}

/** Execution result of a mapper node, carrying the transformed JSON output. */
export type MapperResult = NodeResultBase & {
  mappedJson: Record<string, unknown> | null
}

/** Execution result of a logic node, carrying whether the condition matched. */
export type LogicResult = NodeResultBase & {
  conditionMatched: boolean | null
}

/** Execution result of a variable node, carrying the resolved value and metadata. */
export type VariableResult = NodeResultBase & {
  value: PrimitiveVariableValue | ""
  scope: VariableScope
  key: string
  valueType: PrimitiveVariableType
}

/** Generic base data structure combining configuration args and execution result for any node. */
export type NodeBaseData<I, O extends NodeResultBase> = {
  label: string
  description: string
  args: I
  result: O
}

/** Full node data for a trigger node. */
export type TriggerNodeData = NodeBaseData<TriggerArgs, TriggerResult> & {
  nodeType: "trigger"
}

/** Full node data for an HTTP node. */
export type HttpNodeData = NodeBaseData<HttpArgs, HttpResult> & {
  nodeType: "http"
}

/** Full node data for a mapper node. */
export type MapperNodeData = NodeBaseData<MapperArgs, MapperResult> & {
  nodeType: "mapper"
}

/** Full node data for a logic (conditional) node. */
export type LogicNodeData = NodeBaseData<LogicArgs, LogicResult> & {
  nodeType: "logic"
}

/** Full node data for a variable read/write node. */
export type VariableNodeData = NodeBaseData<VariableArgs, VariableResult> & {
  nodeType: "variable"
}

/** Tagged union of all concrete node data variants present in the graph. */
export type NodeData = TriggerNodeData | HttpNodeData | MapperNodeData | LogicNodeData | VariableNodeData

/** Extracts the NodeData variant that corresponds to a specific NodeKind. */
export type NodeDataByKind<T extends NodeKind = NodeKind> = Extract<NodeData, { nodeType: T }>
/** Extracts the args type for a specific NodeKind. */
export type NodeArgsByKind<T extends NodeKind = NodeKind> = NodeDataByKind<T>["args"]
/** Extracts the result type for a specific NodeKind. */
export type NodeResultByKind<T extends NodeKind = NodeKind> = NodeDataByKind<T>["result"]

/** ReactFlow Node specialized with the application's NodeData payload. */
export type FlowNode = Node<NodeData>
/** ReactFlow Edge used to connect nodes in the automation graph. */
export type FlowEdge = Edge

/** A variable accessible across the entire automation graph, defined outside any node. */
export type GlobalVariable = {
  id: string
  key: string
  value: string
  valueType: PrimitiveVariableType
  enumOptions: string[]
}

/** Serializable snapshot of the full graph state: nodes, edges, selection, and global variables. */
export type GraphSnapshot = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeId: string | null
  globalVariables: GlobalVariable[]
}

/** Input for placing a new node of a given kind at a specific canvas position. */
export type AddNodeInput = {
  nodeType: NodeKind
  position: XYPosition
}
