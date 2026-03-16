import type { FlowEdge, FlowNode, SchemaField } from "@/types/graph"

type TraversalParams = {
  nodeId: string
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export function getUpstreamSchema({ nodeId, nodes, edges }: TraversalParams): SchemaField[] {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const incomingByTarget = new Map<string, FlowEdge[]>()

  for (const edge of edges) {
    const list = incomingByTarget.get(edge.target) ?? []
    list.push(edge)
    incomingByTarget.set(edge.target, list)
  }

  const visited = new Set<string>()
  const queue = [nodeId]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current)) {
      continue
    }

    visited.add(current)
    const incoming = incomingByTarget.get(current) ?? []

    for (const edge of incoming) {
      const sourceNode = byId.get(edge.source)
      if (!sourceNode) {
        continue
      }

      if (sourceNode.data.outputSchema.length > 0) {
        return sourceNode.data.outputSchema
      }

      queue.push(sourceNode.id)
    }
  }

  return []
}
