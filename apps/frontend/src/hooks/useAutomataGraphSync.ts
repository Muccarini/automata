import { useEffect } from "react"

import { useAutomataStore } from "@/store/automataStore"
import { createDefaultGraphSnapshot, useAutomaGraphStore } from "@/store/automaGraphStore"

export function useAutomataGraphSync() {
  const selectedAutomataId = useAutomataStore((state) => state.selectedAutomataId)
  const updateAutomataGraph = useAutomataStore((state) => state.updateAutomataGraph)
  const persistAutomataGraph = useAutomataStore((state) => state.persistAutomataGraph)

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

    const snapshot = {
      nodes,
      edges,
      selectedNodeId,
      globalVariables,
    }

    updateAutomataGraph(selectedAutomataId, snapshot)

    const timeout = window.setTimeout(() => {
      void persistAutomataGraph(selectedAutomataId, snapshot)
    }, 500)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [edges, globalVariables, nodes, persistAutomataGraph, selectedAutomataId, selectedNodeId, updateAutomataGraph])
}
