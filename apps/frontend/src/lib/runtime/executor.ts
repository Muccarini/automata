import { getNodeDefinition } from "@/components/nodes/registry/nodeRegistry"
import type { FlowEdge, FlowNode, GlobalVariable, VariableScope } from "@/types/graph"

export type ExecutionNodeStatus = "pending" | "running" | "completed" | "error"

export type ExecutionNodeState = {
  nodeId: string
  status: ExecutionNodeStatus
  startedAt: number
  finishedAt?: number
  error?: string
}

export type ExecuteFlowResult = {
  nodes: FlowNode[]
  states: ExecutionNodeState[]
}

type ExecuteFlowArgs = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  startNodeId: string
  variableSources?: {
    automa?: GlobalVariable[]
    tenant?: GlobalVariable[]
  }
}

function buildVariableMap(variables: GlobalVariable[] | undefined) {
  const map = new Map<string, GlobalVariable>()

  for (const variable of variables ?? []) {
    if (!variable.key.trim()) {
      continue
    }

    map.set(variable.key, variable)
  }

  return map
}

function cloneNode(node: FlowNode): FlowNode {
  return {
    ...node,
    data: structuredClone(node.data),
  }
}

function getNextNodeIds(node: FlowNode, edges: FlowEdge[]): string[] {
  const outgoingFlowEdges = edges.filter(
    (edge) => edge.source === node.id && (!edge.sourceHandle || edge.sourceHandle.startsWith("flow:"))
  )

  if (node.data.nodeType === "logic") {
    const preferredHandle = node.data.result.conditionMatched ? "flow:true" : "flow:false"
    const preferredEdge = outgoingFlowEdges.find((edge) => edge.sourceHandle === preferredHandle)
    if (preferredEdge) {
      return [preferredEdge.target]
    }
  }

  return outgoingFlowEdges.map((edge) => edge.target)
}

export async function executeFlowMachine({ nodes, edges, startNodeId, variableSources }: ExecuteFlowArgs): Promise<ExecuteFlowResult> {
  const nodeMap = new Map(nodes.map((node) => [node.id, cloneNode(node)]))
  const states = new Map<string, ExecutionNodeState>()
  const inProgress = new Set<string>()
  const automaVariableMap = buildVariableMap(variableSources?.automa)
  const tenantVariableMap = buildVariableMap(variableSources?.tenant)

  const executeNode = async (nodeId: string, input: unknown): Promise<void> => {
    const node = nodeMap.get(nodeId)
    if (!node) {
      return
    }

    const existing = states.get(nodeId)
    if (existing?.status === "completed") {
      return
    }

    if (inProgress.has(nodeId)) {
      throw new Error(`Cycle detected while executing node ${nodeId}`)
    }

    const state: ExecutionNodeState = {
      nodeId,
      status: "running",
      startedAt: Date.now(),
    }
    states.set(nodeId, state)
    inProgress.add(nodeId)

    let queuedNext: string[] | null = null

    const next = (targetNodeId?: string) => {
      if (targetNodeId) {
        queuedNext = [targetNodeId]
        return
      }

      queuedNext = getNextNodeIds(node, edges)
    }

    const setResult = (patch: Partial<typeof node.data.result>) => {
      node.data.result = {
        ...node.data.result,
        ...patch,
      } as typeof node.data.result
    }

    const resolveVariable = (scope: VariableScope, key: string) => {
      if (!key.trim()) {
        return undefined
      }

      return scope === "tenant" ? tenantVariableMap.get(key) : automaVariableMap.get(key)
    }

    const log = (message: string, payload?: unknown) => {
      console.log(`[runtime] node=${node.id} type=${node.data.nodeType} ${message}`, payload ?? "")
    }

    try {
      const definition = getNodeDefinition(node.data.nodeType)
      const context = {
        nodeId: node.id,
        data: node.data,
        input,
        next,
        setResult,
        resolveVariable,
        log,
      }

      log("onEnter")
      await definition.onEnter?.(context as never)

      log("onUpdate")
      await definition.onUpdate?.(context as never)

      log("onExit")
      await definition.onExit?.(context as never)

      if (queuedNext === null) {
        queuedNext = getNextNodeIds(node, edges)
      }

      state.status = "completed"
      state.finishedAt = Date.now()
      inProgress.delete(node.id)

      for (const nextNodeId of queuedNext) {
        await executeNode(nextNodeId, node.data.result)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Execution failed"
      setResult({ error: message })

      state.status = "error"
      state.error = message
      state.finishedAt = Date.now()
      inProgress.delete(node.id)
      console.log(`[runtime] node=${node.id} error`, message)
    }
  }

  await executeNode(startNodeId, undefined)

  return {
    nodes: Array.from(nodeMap.values()),
    states: Array.from(states.values()),
  }
}
