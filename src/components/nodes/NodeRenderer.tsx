import { useMemo } from "react"
import type { NodeProps } from "reactflow"

import { NodeShell } from "@/components/nodes/NodeShell"
import {
  getNodeDefinition,
  getNodePresentation,
  updateNodeDataByPin,
} from "@/components/nodes/registry/nodeRegistry"
import { useMapperStore } from "@/store/mapperStore"
import type { DataPin, NodeData } from "@/types/graph"

export function NodeRenderer({ id, data }: NodeProps<NodeData>) {
  const edges = useMapperStore((state) => state.edges)
  const updateNodeData = useMapperStore((state) => state.updateNodeData)
  const removePinConnections = useMapperStore((state) => state.removePinConnections)

  const presentation = useMemo(() => getNodePresentation(data), [data])
  const definition = useMemo(() => getNodeDefinition(data.nodeType), [data.nodeType])

  const connectedPinIds = useMemo(() => {
    const ids = new Set<string>()

    for (const edge of edges) {
      if (edge.target === id && edge.targetHandle) {
        ids.add(edge.targetHandle)
      }
      if (edge.source === id && edge.sourceHandle) {
        ids.add(edge.sourceHandle)
      }
    }

    return ids
  }, [edges, id])

  const flowInputs = presentation.pins.filter(
    (pin): pin is Extract<(typeof presentation.pins)[number], { kind: "flow"; direction: "input" }> =>
      pin.kind === "flow" && pin.direction === "input"
  )
  const flowOutputs = presentation.pins.filter(
    (pin): pin is Extract<(typeof presentation.pins)[number], { kind: "flow"; direction: "output" }> =>
      pin.kind === "flow" && pin.direction === "output"
  )
  const dataInputs = presentation.pins.filter((pin): pin is DataPin => pin.kind === "data" && pin.direction === "input")
  const dataOutputs = presentation.pins.filter((pin): pin is DataPin => pin.kind === "data" && pin.direction === "output")

  return (
    <NodeShell
      metadata={presentation.metadata}
      flowInputs={flowInputs}
      flowOutputs={flowOutputs}
      dataInputs={dataInputs}
      dataOutputs={dataOutputs}
      connectedPinIds={connectedPinIds}
      onInlineValueChange={(pin, value) => updateNodeData(id, updateNodeDataByPin(data, pin.id, value))}
      onDisconnectPin={(pinId) => removePinConnections(id, pinId)}
    >
      {definition.renderBody({ data })}
    </NodeShell>
  )
}