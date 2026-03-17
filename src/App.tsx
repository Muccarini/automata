import { useEffect } from "react"
import { Toaster } from "sonner"

import { CanvasWorkspace } from "@/components/layout/CanvasWorkspace"
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar"
import { NodeDeletionDialog } from "@/components/editor/NodeDeletionDialog"
import { NodeInspectorDrawer } from "@/components/editor/NodeInspectorDrawer"
import { useAutomataGraphSync } from "@/hooks/useAutomataGraphSync"

function App() {
  useAutomataGraphSync()

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
