import { useEffect } from "react"

import { GlobalVariablesSidebar } from "@/components/editor/GlobalVariablesSidebar"
import { MapperCanvas } from "@/components/editor/MapperCanvas"
import { NodeInspectorDrawer } from "@/components/editor/NodeInspectorDrawer"

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark")
    document.body.classList.add("dark")

    return () => {
      document.documentElement.classList.remove("dark")
      document.body.classList.remove("dark")
    }
  }, [])

  return (
    <main className="h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="flex h-full w-full">
        <GlobalVariablesSidebar />
        <section className="relative flex-1">
          <header className="absolute left-4 top-4 z-10 rounded-md border border-border bg-card/80 px-3 py-2 backdrop-blur-sm">
            <p className="text-sm font-semibold">Mapper-as-a-Service MVP</p>
            <p className="font-mono text-xs text-muted-foreground">DAG editor - trigger {">"} fetch {">"} map {">"} logic</p>
          </header>
          <MapperCanvas />
        </section>
      </div>
      <NodeInspectorDrawer />
    </main>
  )
}

export default App
