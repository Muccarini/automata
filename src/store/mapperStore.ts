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
import { getUpstreamSchema } from "@/lib/graph/getUpstreamSchema"
import { inferSchemaFromJson } from "@/lib/schema/inferSchema"
import type {
  AddNodeInput,
  FlowEdge,
  FlowNode,
  GlobalVariable,
  MappingRule,
  NodeData,
  NodeKind,
  SchemaField,
} from "@/types/graph"

type MapperState = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeId: string | null
  globalVariables: GlobalVariable[]
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (input: AddNodeInput) => void
  removeNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  updateNodeData: (nodeId: string, update: Partial<NodeData>) => void
  setNodeOutputSchema: (nodeId: string, schema: SchemaField[]) => void
  setMapperRules: (nodeId: string, mappings: MappingRule[]) => void
  getUpstreamSchemaFor: (nodeId: string) => SchemaField[]
  addGlobalVariable: () => void
  updateGlobalVariable: (id: string, key: string, value: string) => void
  removeGlobalVariable: (id: string) => void
  removePinConnections: (nodeId: string, pinId: string) => void
  detectHttpSchema: (nodeId: string) => Promise<void>
}

const storageKeyV2 = "maas-graph-state-v2"

function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

function defaultNodeData(nodeType: NodeKind): NodeData {
  return {
    label:
      nodeType === "trigger"
        ? "Trigger"
        : nodeType === "http"
          ? "HTTP Fetcher"
          : nodeType === "mapper"
            ? "Mapper"
            : nodeType === "logic"
              ? "If / Else"
              : "Enum",
    nodeType,
    description:
      nodeType === "trigger"
        ? "Starts flow execution"
        : nodeType === "http"
          ? "Calls HTTP endpoints and detects schema"
          : nodeType === "mapper"
            ? "Maps input fields into target schema"
            : nodeType === "logic"
              ? "Routes payload to true or false branch"
              : "Defines constrained values reusable by other nodes",
    outputSchema: [],
    trigger: {
      triggerType: "manual",
      interval: "5m",
      webhookPath: `hook/${Math.random().toString(36).slice(2, 8)}`,
    },
    http: {
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/todos/1",
      headers: [],
      authType: "none",
      bearerToken: "",
      basicUsername: "",
      basicPassword: "",
    },
    mapper: {
      targetSchemaText: '{\n  "id": 0,\n  "title": "",\n  "completed": false\n}',
      mappings: [],
    },
    logic: {
      leftPath: "status_code",
      operator: "eq",
      rightValue: "200",
    },
    enum: {
      enumName: "HttpMethod",
      values: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      selectedValue: "GET",
    },
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

export const useMapperStore = create<MapperState>()(
  persist(
    (set, get) => ({
      nodes: [factory("trigger", { x: 180, y: 120 })],
      edges: [],
      selectedNodeId: null,
      globalVariables: [{ id: uid("var"), key: "BASE_URL", value: "https://jsonplaceholder.typicode.com" }],

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

          const nextNodes = state.nodes.map((node) => {
            if (node.id !== connection.target || node.data.nodeType !== "mapper") {
              return node
            }

            const upstream = getUpstreamSchema({
              nodeId: node.id,
              nodes: state.nodes,
              edges: nextEdges,
            })

            return {
              ...node,
              data: {
                ...node.data,
                outputSchema: upstream,
              },
            }
          })

          return {
            edges: nextEdges,
            nodes: nextNodes,
          }
        })
      },

      addNode: ({ nodeType, position }) => {
        set((state) => ({
          nodes: [...state.nodes, factory(nodeType, position)],
        }))
      },

      removeNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        }))
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
                  },
                }
              : node
          ),
        }))
      },

      setNodeOutputSchema: (nodeId, schema) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    outputSchema: schema,
                  },
                }
              : node
          ),
        }))
      },

      setMapperRules: (nodeId, mappings) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    mapper: {
                      ...node.data.mapper,
                      mappings,
                    },
                  },
                }
              : node
          ),
        }))
      },

      getUpstreamSchemaFor: (nodeId) => {
        const state = get()
        return getUpstreamSchema({
          nodeId,
          nodes: state.nodes,
          edges: state.edges,
        })
      },

      addGlobalVariable: () => {
        set((state) => ({
          globalVariables: [...state.globalVariables, { id: uid("var"), key: "NEW_VAR", value: "" }],
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

      detectHttpSchema: async (nodeId) => {
        const state = get()
        const node = state.nodes.find((item) => item.id === nodeId)

        if (!node || node.data.nodeType !== "http") {
          return
        }

        const url = node.data.http.url || "https://jsonplaceholder.typicode.com/todos/1"

        try {
          const response = await fetch(url)
          const json = (await response.json()) as unknown
          const schema = inferSchemaFromJson(json)

          set((current) => ({
            nodes: current.nodes.map((item) =>
              item.id === nodeId
                ? {
                    ...item,
                    data: {
                      ...item.data,
                      outputSchema: schema,
                      http: {
                        ...item.data.http,
                        autoDetectedAt: new Date().toISOString(),
                        autoDetectError: "",
                      },
                    },
                  }
                : item
            ),
          }))
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown schema detect error"

          set((current) => ({
            nodes: current.nodes.map((item) =>
              item.id === nodeId
                ? {
                    ...item,
                    data: {
                      ...item.data,
                      http: {
                        ...item.data.http,
                        autoDetectError: message,
                      },
                    },
                  }
                : item
            ),
          }))
        }
      },
    }),
    {
      name: storageKeyV2,
    }
  )
)
