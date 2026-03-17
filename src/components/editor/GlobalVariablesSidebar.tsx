import { ChevronLeft, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useMapperStore } from "@/store/mapperStore"

type GlobalVariablesSidebarProps = {
  embedded?: boolean
  onClose?: () => void
  className?: string
}

export function GlobalVariablesSidebar({ embedded = false, onClose, className }: GlobalVariablesSidebarProps) {
  const globalVariables = useMapperStore((state) => state.globalVariables)
  const addGlobalVariable = useMapperStore((state) => state.addGlobalVariable)
  const updateGlobalVariable = useMapperStore((state) => state.updateGlobalVariable)
  const removeGlobalVariable = useMapperStore((state) => state.removeGlobalVariable)

  const containerClassName = embedded
    ? "h-full rounded-lg border border-border bg-card/95 shadow-xl backdrop-blur-sm"
    : "h-full w-80 border-r border-border bg-card/50"

  const scrollAreaClassName = embedded ? "h-[calc(100%-57px)]" : "h-[calc(100vh-57px)]"

  return (
    <aside className={cn(containerClassName, className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Automa variables</h2>
          <p className="text-xs text-muted-foreground">Variables scoped to the selected automa</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={addGlobalVariable}>
            <Plus className="size-4" />
          </Button>
          {embedded && onClose ? (
            <Button size="icon" variant="ghost" onClick={onClose} aria-label="Collapse global variables panel">
              <ChevronLeft className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <ScrollArea className={scrollAreaClassName}>
        <div className="space-y-3 p-4">
          {globalVariables.map((item) => (
            <div key={item.id} className="rounded-md border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">${"{"}{item.key || "VAR"}{"}"}</span>
                <Button size="icon" variant="ghost" onClick={() => removeGlobalVariable(item.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Input
                className="mb-2 font-mono text-xs"
                placeholder="KEY"
                value={item.key}
                onChange={(event) => updateGlobalVariable(item.id, event.target.value, item.value)}
              />
              <Input
                className="font-mono text-xs"
                placeholder="value"
                value={item.value}
                onChange={(event) => updateGlobalVariable(item.id, item.key, event.target.value)}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  )
}

