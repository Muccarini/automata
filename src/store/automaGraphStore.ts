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
  PrimitiveVariableType,
  VariableNodeData,
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

function normalizeNodeData(data: unknown, nodeType: NodeKind): NodeData {
  const fallback = defaultNodeData(nodeType)

  if (!data || typeof data !== "object") {
    return fallback
  }

  const raw = data as Record<string, unknown>
  const rawArgs = raw.args ?? raw.inputParams
  const rawResult = raw.result ?? raw.outputParams

  const safeArgs = rawArgs && typeof rawArgs === "object" ? rawArgs : {}
  const safeResult = rawResult && typeof rawResult === "object" ? rawResult : {}

  const normalized = {
    ...fallback,
    ...(raw as Partial<NodeData>),
    nodeType,
    args: {
      ...fallback.args,
      ...(safeArgs as Record<string, unknown>),
    } as NodeData["args"],
    result: {
      ...fallback.result,
      ...(safeResult as Record<string, unknown>),
    } as NodeData["result"],
  } as NodeData

  if (nodeType === "variable") {
    const variableData = normalized as VariableNodeData
    const args = variableData.args
    const result = variableData.result
    if (args.valueType !== "string" && args.valueType !== "integer" && args.valueType !== "boolean" && args.valueType !== "enum") {
      args.valueType = "string"
    }
    if (result.valueType !== "string" && result.valueType !== "integer" && result.valueType !== "boolean" && result.valueType !== "enum") {
      result.valueType = args.valueType
    }
  }

  return normalized
}

function normalizeFlowNode(node: FlowNode): FlowNode {
  const kindFromData = (node.data as { nodeType?: unknown })?.nodeType
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
                  data: {
                    ...node.data,
                    ...update,
                  } as NodeData,
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
        const persisted = (persistedState ?? {}) as Partial<AutomaGraphState>

        return {
          ...currentState,
          ...persisted,
          nodes: Array.isArray(persisted.nodes) ? persisted.nodes.map(normalizeFlowNode) : currentState.nodes,
          edges: Array.isArray(persisted.edges) ? persisted.edges : currentState.edges,
          selectedNodeId: persisted.selectedNodeId ?? currentState.selectedNodeId,
          globalVariables: Array.isArray(persisted.globalVariables)
            ? normalizeGlobalVariables(persisted.globalVariables)
            : currentState.globalVariables,
        }
      },
    }
  )
)

