import { useEffect } from "react"
import { Toaster } from "sonner"

import { CanvasWorkspace } from "@/components/layout/CanvasWorkspace"
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar"
import { NodeDeletionDialog } from "@/components/editor/NodeDeletionDialog"
import { NodeInspectorDrawer } from "@/components/editor/NodeInspectorDrawer"
import { useAutomataGraphSync } from "@/hooks/useAutomataGraphSync"
import { useAutomataStore } from "@/store/automataStore"

function App() {
  const bootstrapBackendState = useAutomataStore((state) => state.bootstrapBackendState)
  const isBootstrapped = useAutomataStore((state) => state.isBootstrapped)
  const bootstrapError = useAutomataStore((state) => state.bootstrapError)

  useAutomataGraphSync()

  useEffect(() => {
    document.documentElement.classList.add("dark")
    document.body.classList.add("dark")

    return () => {
      document.documentElement.classList.remove("dark")
      document.body.classList.remove("dark")
    }
  }, [])

  useEffect(() => {
    void bootstrapBackendState()
  }, [bootstrapBackendState])

  if (!isBootstrapped) {
    return (
      <main className="grid h-screen w-full place-items-center bg-background p-6 text-foreground">
        <div className="w-full max-w-md space-y-3 rounded-lg border border-border bg-card/40 p-4">
          <p className="text-sm font-semibold">Connecting to backend...</p>
          <p className="text-xs text-muted-foreground">
            {bootstrapError ?? "Loading auth session, tenant scope and persisted automata."}
          </p>
        </div>
        <Toaster position="top-right" richColors closeButton />
      </main>
    )
  }

  return (
    <main className="h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="flex h-full w-full">
        <WorkspaceSidebar />
        <CanvasWorkspace />
      </div>
      <NodeDeletionDialog />
      <NodeInspectorDrawer />
      <Toaster position="top-right" richColors closeButton />
    </main>
  )
}

export default App
