import { useEffect } from "react"

import { useAutomataStore } from "@/store/automataStore"
import { createDefaultGraphSnapshot, useMapperStore } from "@/store/mapperStore"

export function useAutomataGraphSync() {
  const selectedAutomataId = useAutomataStore((state) => state.selectedAutomataId)
  const updateAutomataGraph = useAutomataStore((state) => state.updateAutomataGraph)

  const nodes = useMapperStore((state) => state.nodes)
  const edges = useMapperStore((state) => state.edges)
  const selectedNodeId = useMapperStore((state) => state.selectedNodeId)
  const globalVariables = useMapperStore((state) => state.globalVariables)
  const loadGraphSnapshot = useMapperStore((state) => state.loadGraphSnapshot)

  useEffect(() => {
    if (!selectedAutomataId) {
      loadGraphSnapshot(createDefaultGraphSnapshot())
      return
    }

    const currentAutomata = useAutomataStore.getState().automata.find((item) => item.id === selectedAutomataId)
    if (!currentAutomata) {
      loadGraphSnapshot(createDefaultGraphSnapshot())
      return
    }

    loadGraphSnapshot(currentAutomata.graph)
  }, [loadGraphSnapshot, selectedAutomataId])

  useEffect(() => {
    if (!selectedAutomataId) {
      return
    }

    updateAutomataGraph(selectedAutomataId, {
      nodes,
      edges,
      selectedNodeId,
      globalVariables,
    })
  }, [edges, globalVariables, nodes, selectedAutomataId, selectedNodeId, updateAutomataGraph])
}
