import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from "reactflow"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { getPinDefinition } from "@/components/nodes/registry/nodeRegistry"
import { getUpstreamSample } from "@/lib/graph/getUpstreamSchema"
import { isRecord } from "@/lib/guards"
import { executeFlowMachine } from "@/lib/runtime/executor"
import type {
  AddNodeInput,
  FlowEdge,
  FlowNode,
  GraphSnapshot,
  GlobalVariable,
  MappingRule,
  NodeData,
  NodeKind,
  TriggerNodeData,
  HttpNodeData,
  MapperNodeData,
  LogicNodeData,
  VariableNodeData,
  PrimitiveVariableType,
  VariableScope,
} from "@/types/graph"

type AutomaGraphState = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeId: string | null
  pendingNodeDeletionId: string | null
  globalVariables: GlobalVariable[]
  getGraphSnapshot: () => GraphSnapshot
  loadGraphSnapshot: (snapshot: GraphSnapshot) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (input: AddNodeInput) => void
  addVariableReferenceNode: (input: { position: XYPosition; scope: VariableScope; key: string; valueType: PrimitiveVariableType }) => void
  removeNode: (nodeId: string) => void
  requestNodeRemoval: (nodeId: string) => void
  confirmNodeRemoval: () => void
  cancelNodeRemoval: () => void
  selectNode: (nodeId: string | null) => void
  updateNodeData: (nodeId: string, update: Partial<NodeData>) => void
  setNodeMappings: (nodeId: string, mappings: MappingRule[]) => void
  getUpstreamSampleFor: (nodeId: string) => unknown
  runFlowSimulation: (input?: { tenantVariables?: GlobalVariable[] }) => Promise<void>
  addGlobalVariable: (valueType: PrimitiveVariableType) => void
  updateGlobalVariable: (id: string, key: string, value: string) => void
  removeGlobalVariable: (id: string) => void
  removePinConnections: (nodeId: string, pinId: string) => void
}

const storageKeyV7 = "maas-automa-graph-state-v7"

function isNodeKind(value: unknown): value is NodeKind {
  return value === "trigger" || value === "http" || value === "mapper" || value === "logic" || value === "variable"
}

function isFlowNode(value: unknown): value is FlowNode {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.id !== "string") {
    return false
  }

  if (!isRecord(value.position)) {
    return false
  }

  if (typeof value.position.x !== "number" || typeof value.position.y !== "number") {
    return false
  }

  return isRecord(value.data)
}

function isFlowEdge(value: unknown): value is FlowEdge {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.id === "string" && typeof value.source === "string" && typeof value.target === "string"
}

function isGlobalVariable(value: unknown): value is GlobalVariable {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.id !== "string" || typeof value.key !== "string" || typeof value.value !== "string") {
    return false
  }

  return value.valueType === "string" || value.valueType === "integer" || value.valueType === "boolean" || value.valueType === "enum"
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function toString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null
}

function toNullableBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null
}

function toStringPairs(value: unknown): Array<{ key: string; value: string }> {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      const key = typeof item.key === "string" ? item.key : ""
      const pairValue = typeof item.value === "string" ? item.value : ""

      return { key, value: pairValue }
    })
    .filter((item): item is { key: string; value: string } => item !== null)
}

function toMappingRules(value: unknown): MappingRule[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      if (typeof item.id !== "string" || typeof item.inputPath !== "string" || typeof item.outputPath !== "string") {
        return null
      }

      return {
        id: item.id,
        inputPath: item.inputPath,
        outputPath: item.outputPath,
      }
    })
    .filter((item): item is MappingRule => item !== null)
}

function toVariableScope(value: unknown, fallback: VariableScope): VariableScope {
  return value === "automa" || value === "tenant" ? value : fallback
}

function toPrimitiveVariableType(value: unknown, fallback: PrimitiveVariableType): PrimitiveVariableType {
  return value === "string" || value === "integer" || value === "boolean" || value === "enum" ? value : fallback
}

function toHttpMethod(value: unknown, fallback: "GET" | "POST" | "PUT" | "PATCH" | "DELETE") {
  return value === "GET" || value === "POST" || value === "PUT" || value === "PATCH" || value === "DELETE" ? value : fallback
}

function toAuthType(value: unknown, fallback: "none" | "bearer" | "basic") {
  return value === "none" || value === "bearer" || value === "basic" ? value : fallback
}

function toTriggerType(value: unknown, fallback: "manual" | "cron" | "webhook") {
  return value === "manual" || value === "cron" || value === "webhook" ? value : fallback
}

function toPredicateOperator(value: unknown, fallback: "eq" | "neq" | "gt" | "lt" | "contains") {
  return value === "eq" || value === "neq" || value === "gt" || value === "lt" || value === "contains" ? value : fallback
}

function normalizeNodeData(data: unknown, nodeType: NodeKind): NodeData {
  const fallback = defaultNodeData(nodeType)

  if (!isRecord(data)) {
    return fallback
  }

  const rawArgs = toRecord(data.args ?? data.inputParams)
  const rawResult = toRecord(data.result ?? data.outputParams)
  const label = toString(data.label, fallback.label)
  const description = toString(data.description, fallback.description)

  switch (nodeType) {
    case "trigger": {
      const next = defaultNodeData("trigger")
      return {
        ...next,
        label,
        description,
        args: {
          triggerType: toTriggerType(rawArgs.triggerType, next.args.triggerType),
          interval: toString(rawArgs.interval, next.args.interval),
          webhookPath: toString(rawArgs.webhookPath, next.args.webhookPath),
        },
        result: {
          payload: isRecord(rawResult.payload) ? rawResult.payload : null,
          outputSample: rawResult.outputSample,
          error: toOptionalString(rawResult.error),
        },
      }
    }
    case "http": {
      const next = defaultNodeData("http")
      return {
        ...next,
        label,
        description,
        args: {
          method: toHttpMethod(rawArgs.method, next.args.method),
          url: toString(rawArgs.url, next.args.url),
          headers: toStringPairs(rawArgs.headers),
          authType: toAuthType(rawArgs.authType, next.args.authType),
          bearerToken: toString(rawArgs.bearerToken, next.args.bearerToken),
          basicUsername: toString(rawArgs.basicUsername, next.args.basicUsername),
          basicPassword: toString(rawArgs.basicPassword, next.args.basicPassword),
        },
        result: {
          statusCode: toNullableNumber(rawResult.statusCode),
          responseJson: rawResult.responseJson ?? null,
          responseText: toString(rawResult.responseText, next.result.responseText),
          responseHeaders: toStringPairs(rawResult.responseHeaders),
          outputSample: rawResult.outputSample,
          error: toOptionalString(rawResult.error),
        },
      }
    }
    case "mapper": {
      const next = defaultNodeData("mapper")
      return {
        ...next,
        label,
        description,
        args: {
          returnJsonText: toString(rawArgs.returnJsonText, next.args.returnJsonText),
          mappings: toMappingRules(rawArgs.mappings),
        },
        result: {
          mappedJson: isRecord(rawResult.mappedJson) ? rawResult.mappedJson : null,
          outputSample: rawResult.outputSample,
          error: toOptionalString(rawResult.error),
        },
      }
    }
    case "logic": {
      const next = defaultNodeData("logic")
      return {
        ...next,
        label,
        description,
        args: {
          leftPath: toString(rawArgs.leftPath, next.args.leftPath),
          operator: toPredicateOperator(rawArgs.operator, next.args.operator),
          rightValue: toString(rawArgs.rightValue, next.args.rightValue),
        },
        result: {
          conditionMatched: toNullableBoolean(rawResult.conditionMatched),
          outputSample: rawResult.outputSample,
          error: toOptionalString(rawResult.error),
        },
      }
    }
    case "variable": {
      const next = defaultNodeData("variable")
      const valueType = toPrimitiveVariableType(rawArgs.valueType, next.args.valueType)
      return {
        ...next,
        label,
        description,
        args: {
          scope: toVariableScope(rawArgs.scope, next.args.scope),
          key: toString(rawArgs.key, next.args.key),
          valueType,
        },
        result: {
          value:
            typeof rawResult.value === "string" || typeof rawResult.value === "number" || typeof rawResult.value === "boolean"
              ? rawResult.value
              : "",
          scope: toVariableScope(rawResult.scope, toVariableScope(rawArgs.scope, next.args.scope)),
          key: toString(rawResult.key, toString(rawArgs.key, next.args.key)),
          valueType: toPrimitiveVariableType(rawResult.valueType, valueType),
          outputSample: rawResult.outputSample,
          error: toOptionalString(rawResult.error),
        },
      }
    }
    default: {
      return fallback
    }
  }
}

function normalizeFlowNode(node: FlowNode): FlowNode {
  const kindFromData = isRecord(node.data) ? node.data.nodeType : undefined
  const kindFromType = node.type
  const nodeType = isNodeKind(kindFromData) ? kindFromData : isNodeKind(kindFromType) ? kindFromType : "trigger"

  return {
    ...node,
    type: nodeType,
    data: normalizeNodeData(node.data, nodeType),
  }
}

function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

function defaultNodeData(nodeType: "trigger"): TriggerNodeData
function defaultNodeData(nodeType: "http"): HttpNodeData
function defaultNodeData(nodeType: "mapper"): MapperNodeData
function defaultNodeData(nodeType: "logic"): LogicNodeData
function defaultNodeData(nodeType: "variable"): VariableNodeData
function defaultNodeData(nodeType: NodeKind): NodeData
function defaultNodeData(nodeType: NodeKind): NodeData {
  const common = {
    label:
      nodeType === "trigger"
        ? "Trigger"
        : nodeType === "http"
          ? "HTTP Fetcher"
          : nodeType === "mapper"
            ? "Mapper"
            : nodeType === "variable"
              ? "Variable"
            : "If / Else",
    nodeType,
    description:
      nodeType === "trigger"
        ? "Starts flow execution"
        : nodeType === "http"
          ? "Calls HTTP endpoints and captures output"
          : nodeType === "mapper"
            ? "Maps input fields into target output JSON"
            : nodeType === "variable"
              ? "Resolves automa or tenant variables at runtime"
            : "Routes payload to true or false branch",
  }

  switch (nodeType) {
    case "trigger":
      return {
        ...common,
        nodeType,
        args: {
          triggerType: "manual",
          interval: "5m",
          webhookPath: `hook/${Math.random().toString(36).slice(2, 8)}`,
        },
        result: {
          payload: null,
          error: undefined,
        },
      }
    case "http":
      return {
        ...common,
        nodeType,
        args: {
          method: "GET",
          url: "https://jsonplaceholder.typicode.com/todos/1",
          headers: [],
          authType: "none",
          bearerToken: "",
          basicUsername: "",
          basicPassword: "",
        },
        result: {
          statusCode: null,
          responseJson: null,
          responseText: "",
          responseHeaders: [],
          error: undefined,
        },
      }
    case "mapper":
      return {
        ...common,
        nodeType,
        args: {
          returnJsonText: '{\n  "id": 0,\n  "title": "",\n  "completed": false\n}',
          mappings: [],
        },
        result: {
          mappedJson: null,
          error: undefined,
        },
      }
    case "logic":
      return {
        ...common,
        nodeType,
        args: {
          leftPath: "status_code",
          operator: "eq",
          rightValue: "200",
        },
        result: {
          conditionMatched: null,
          error: undefined,
        },
      }
    case "variable":
      return {
        ...common,
        nodeType,
        args: {
          scope: "automa",
          key: "BASE_URL",
          valueType: "string",
        },
        result: {
          value: "",
          scope: "automa",
          key: "BASE_URL",
          valueType: "string",
          outputSample: undefined,
          error: undefined,
        },
      }
  }
}

function createsCycle(nodes: FlowNode[], edges: FlowEdge[], connection: Connection) {
  if (!connection.source || !connection.target) {
    return true
  }

  const adjacency = new Map<string, string[]>()
  for (const node of nodes) {
    adjacency.set(node.id, [])
  }

  for (const edge of edges) {
    if (edge.source && edge.target) {
      adjacency.get(edge.source)?.push(edge.target)
    }
  }

  adjacency.get(connection.source)?.push(connection.target)

  const visited = new Set<string>()
  const inStack = new Set<string>()

  const dfs = (nodeId: string): boolean => {
    if (inStack.has(nodeId)) {
      return true
    }

    if (visited.has(nodeId)) {
      return false
    }

    visited.add(nodeId)
    inStack.add(nodeId)

    for (const next of adjacency.get(nodeId) ?? []) {
      if (dfs(next)) {
        return true
      }
    }

    inStack.delete(nodeId)
    return false
  }

  for (const node of nodes) {
    if (dfs(node.id)) {
      return true
    }
  }

  return false
}

function canConnect(nodes: FlowNode[], edges: FlowEdge[], connection: Connection) {
  if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
    return false
  }

  const sourceNode = nodes.find((node) => node.id === connection.source)
  const targetNode = nodes.find((node) => node.id === connection.target)

  if (!sourceNode || !targetNode) {
    return false
  }

  const sourcePin = getPinDefinition(sourceNode, connection.sourceHandle)
  const targetPin = getPinDefinition(targetNode, connection.targetHandle)

  if (!sourcePin || !targetPin) {
    return false
  }

  if (sourcePin.direction !== "output" || targetPin.direction !== "input") {
    return false
  }

  if (sourcePin.kind !== targetPin.kind) {
    return false
  }

  if (sourcePin.kind === "data" && targetPin.kind === "data") {
    if (targetPin.supportsEdgeConnection === false) {
      return false
    }

    if (sourcePin.valueType !== targetPin.valueType) {
      return false
    }

    if (sourcePin.valueType === "enum" && targetPin.inlineValue?.valueType === "enum" && sourcePin.inlineValue?.valueType === "enum") {
      const sourceOptions = sourcePin.inlineValue.options
      const targetOptions = targetPin.inlineValue.options
      if (sourceOptions.length > 0 && targetOptions.length > 0) {
        const sourceSet = new Set(sourceOptions)
        const compatible = targetOptions.every((option) => sourceSet.has(option))
        if (!compatible) {
          return false
        }
      }
    }
  }

  if (
    targetPin.kind === "data" &&
    edges.some(
      (edge) =>
        edge.target === connection.target &&
        edge.targetHandle === connection.targetHandle
    )
  ) {
    return false
  }

  return true
}

function factory(nodeType: NodeKind, position: XYPosition): FlowNode {
  return {
    id: uid(nodeType),
    type: nodeType,
    position,
    data: defaultNodeData(nodeType),
  }
}

function defaultGlobalVariables(): GlobalVariable[] {
  return [{ id: uid("var"), key: "BASE_URL", value: "https://jsonplaceholder.typicode.com", valueType: "string", enumOptions: [] }]
}

function normalizeGlobalVariable(variable: GlobalVariable): GlobalVariable {
  return {
    ...variable,
    valueType:
      variable.valueType === "string" || variable.valueType === "integer" || variable.valueType === "boolean" || variable.valueType === "enum"
        ? variable.valueType
        : "string",
    enumOptions: Array.isArray(variable.enumOptions) ? variable.enumOptions.filter((item) => typeof item === "string") : [],
  }
}

function normalizeGlobalVariables(variables: GlobalVariable[] | undefined): GlobalVariable[] {
  return (variables ?? []).map((variable) => normalizeGlobalVariable(variable))
}

export function createDefaultGraphSnapshot(): GraphSnapshot {
  return {
    nodes: [factory("trigger", { x: 180, y: 120 })],
    edges: [],
    selectedNodeId: null,
    globalVariables: defaultGlobalVariables(),
  }
}

export const useAutomaGraphStore = create<AutomaGraphState>()(
  persist(
    (set, get) => ({
      ...createDefaultGraphSnapshot(),
      pendingNodeDeletionId: null,

      getGraphSnapshot: () => {
        const state = get()
        return {
          nodes: state.nodes,
          edges: state.edges,
          selectedNodeId: state.selectedNodeId,
          globalVariables: state.globalVariables,
        }
      },

      loadGraphSnapshot: (snapshot) => {
        set({
          nodes: Array.isArray(snapshot.nodes) ? snapshot.nodes.map(normalizeFlowNode) : createDefaultGraphSnapshot().nodes,
          edges: Array.isArray(snapshot.edges) ? snapshot.edges : [],
          selectedNodeId: snapshot.selectedNodeId ?? null,
          globalVariables: Array.isArray(snapshot.globalVariables)
            ? normalizeGlobalVariables(snapshot.globalVariables)
            : createDefaultGraphSnapshot().globalVariables,
          pendingNodeDeletionId: null,
        })
      },

      onNodesChange: (changes) => {
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes),
        }))
      },

      onEdgesChange: (changes) => {
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
        }))
      },

      onConnect: (connection) => {
        set((state) => {
          if (!connection.source || !connection.target) {
            return state
          }

          if (!canConnect(state.nodes, state.edges, connection)) {
            return state
          }

          if (createsCycle(state.nodes, state.edges, connection)) {
            return state
          }

          const nextEdges = addEdge(
              {
                ...connection,
                animated: true,
              },
              state.edges
            )

          return {
            edges: nextEdges,
            nodes: state.nodes,
          }
        })
      },

      addNode: ({ nodeType, position }) => {
        set((state) => ({
          nodes: [...state.nodes, factory(nodeType, position)],
        }))
      },

      addVariableReferenceNode: ({ position, scope, key, valueType }) => {
        set((state) => {
          const typeLabel =
            valueType === "integer" ? "Integer" : valueType === "boolean" ? "Boolean" : valueType === "enum" ? "Enum" : "String"
          const node = factory("variable", position)
          const variableNode: FlowNode = {
            ...node,
            data: {
              ...node.data,
              nodeType: "variable",
              label: `${scope === "automa" ? "Automation" : "Tenant"} ${typeLabel} Variable`,
              description: "Outputs a typed variable value",
              args: {
                scope,
                key,
                valueType,
              },
              result: {
                value: "",
                scope,
                key,
                valueType,
                outputSample: undefined,
                error: undefined,
              },
            },
          }

          return {
            nodes: [...state.nodes, variableNode],
          }
        })
      },

      removeNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
          pendingNodeDeletionId: state.pendingNodeDeletionId === nodeId ? null : state.pendingNodeDeletionId,
        }))
      },

      requestNodeRemoval: (nodeId) => {
        const state = get()
        const nodeExists = state.nodes.some((node) => node.id === nodeId)

        if (!nodeExists) {
          return
        }

        set({ pendingNodeDeletionId: nodeId })
      },

      confirmNodeRemoval: () => {
        const { pendingNodeDeletionId, removeNode } = get()

        if (!pendingNodeDeletionId) {
          return
        }

        removeNode(pendingNodeDeletionId)
      },

      cancelNodeRemoval: () => {
        set({ pendingNodeDeletionId: null })
      },

      selectNode: (nodeId) => {
        set({ selectedNodeId: nodeId })
      },

      updateNodeData: (nodeId, update) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: normalizeNodeData(
                    {
                      ...node.data,
                      ...update,
                    },
                    node.data.nodeType
                  ),
                }
              : node
          ),
        }))
      },

      setNodeMappings: (nodeId, mappings) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId && node.data.nodeType === "mapper"
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    args: {
                      ...node.data.args,
                      mappings,
                    },
                  },
                }
              : node
          ),
        }))
      },

      getUpstreamSampleFor: (nodeId) => {
        const state = get()
        return getUpstreamSample({
          nodeId,
          nodes: state.nodes,
          edges: state.edges,
        })
      },

      runFlowSimulation: async (input) => {
        const state = get()
        const startNode = state.nodes.find((node) => node.data.nodeType === "trigger")

        if (!startNode) {
          console.log("[runtime] No trigger node found, aborting simulation")
          return
        }

        const result = await executeFlowMachine({
          nodes: state.nodes,
          edges: state.edges,
          startNodeId: startNode.id,
          variableSources: {
            automa: state.globalVariables,
            tenant: input?.tenantVariables ?? [],
          },
        })

        set({ nodes: result.nodes })
        console.log("[runtime] Flow simulation completed", result.states)
      },

      addGlobalVariable: (valueType) => {
        set((state) => ({
          globalVariables: [...state.globalVariables, { id: uid("var"), key: "NEW_VAR", value: "", valueType, enumOptions: [] }],
        }))
      },

      updateGlobalVariable: (id, key, value) => {
        set((state) => ({
          globalVariables: state.globalVariables.map((item) =>
            item.id === id
              ? {
                  ...item,
                  key,
                  value,
                }
              : item
          ),
        }))
      },

      removeGlobalVariable: (id) => {
        set((state) => ({
          globalVariables: state.globalVariables.filter((item) => item.id !== id),
        }))
      },

      removePinConnections: (nodeId, pinId) => {
        set((state) => ({
          edges: state.edges.filter(
            (edge) =>
              !(
                (edge.target === nodeId && edge.targetHandle === pinId) ||
                (edge.source === nodeId && edge.sourceHandle === pinId)
              )
          ),
        }))
      },
    }),
    {
      name: storageKeyV7,
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        selectedNodeId: state.selectedNodeId,
        globalVariables: state.globalVariables,
      }),
      merge: (persistedState, currentState) => {
        const persisted = toRecord(persistedState)
        const persistedNodes = Array.isArray(persisted.nodes) ? persisted.nodes : undefined
        const persistedEdges = Array.isArray(persisted.edges) ? persisted.edges : undefined
        const persistedSelectedNodeId = typeof persisted.selectedNodeId === "string" ? persisted.selectedNodeId : null
        const persistedGlobalVariables = Array.isArray(persisted.globalVariables) ? persisted.globalVariables : undefined

        return {
          ...currentState,
          nodes: persistedNodes ? persistedNodes.filter(isFlowNode).map(normalizeFlowNode) : currentState.nodes,
          edges: persistedEdges ? persistedEdges.filter(isFlowEdge) : currentState.edges,
          selectedNodeId: persistedSelectedNodeId ?? currentState.selectedNodeId,
          globalVariables: persistedGlobalVariables
            ? normalizeGlobalVariables(persistedGlobalVariables.filter(isGlobalVariable))
            : currentState.globalVariables,
        }
      },
    }
  )
)

