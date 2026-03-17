import { useEffect } from "react"

import { useAutomataStore } from "@/store/automataStore"
import { createDefaultGraphSnapshot, useAutomaGraphStore } from "@/store/automaGraphStore"

export function useAutomataGraphSync() {
  const selectedAutomataId = useAutomataStore((state) => state.selectedAutomataId)
  const updateAutomataGraph = useAutomataStore((state) => state.updateAutomataGraph)

  const nodes = useAutomaGraphStore((state) => state.nodes)
  const edges = useAutomaGraphStore((state) => state.edges)
  const selectedNodeId = useAutomaGraphStore((state) => state.selectedNodeId)
  const globalVariables = useAutomaGraphStore((state) => state.globalVariables)
  const loadGraphSnapshot = useAutomaGraphStore((state) => state.loadGraphSnapshot)

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
