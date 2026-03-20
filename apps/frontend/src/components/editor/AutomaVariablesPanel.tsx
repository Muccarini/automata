import { ChevronDownIcon, ChevronUpIcon, GripVerticalIcon, Plus, Trash2, VariableIcon } from "lucide-react"
import { type DragEvent, useEffect, useState } from "react"

import {
  serializeVariableReferenceDragPayload,
  VARIABLE_REFERENCE_DRAG_TYPE,
} from "@/components/editor/variableReferenceDnD"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { blockDragEvent } from "@/lib/reactEvents"
import { cn } from "@/lib/utils"
import { useAutomaGraphStore } from "@/store/automaGraphStore"
import { useViewportDnDStore } from "@/store/viewportDnDStore"
import type { PrimitiveVariableType } from "@/types/graph"

type AutomaVariablesPanelProps = {
  embedded?: boolean
  initiallyOpen?: boolean
  className?: string
}

export function AutomaVariablesPanel({ embedded = false, initiallyOpen = true, className }: AutomaVariablesPanelProps) {
  const globalVariables = useAutomaGraphStore((state) => state.globalVariables)
  const addGlobalVariable = useAutomaGraphStore((state) => state.addGlobalVariable)
  const updateGlobalVariable = useAutomaGraphStore((state) => state.updateGlobalVariable)
  const removeGlobalVariable = useAutomaGraphStore((state) => state.removeGlobalVariable)
  const beginVariableDrag = useViewportDnDStore((state) => state.beginVariableDrag)
  const endVariableDrag = useViewportDnDStore((state) => state.endVariableDrag)
  const [isOpen, setIsOpen] = useState(initiallyOpen)
  const [draggingVariableId, setDraggingVariableId] = useState<string | null>(null)

  useEffect(() => {
    setIsOpen(initiallyOpen)
  }, [initiallyOpen])

  const handleAddGlobalVariable = (valueType: PrimitiveVariableType) => {
    if (!isOpen) {
      setIsOpen(true)
    }

    addGlobalVariable(valueType)
  }

  const typeActions: Array<{ valueType: PrimitiveVariableType; label: string }> = [
    { valueType: "string", label: "String" },
    { valueType: "integer", label: "Integer" },
    { valueType: "boolean", label: "Boolean" },
    { valueType: "enum", label: "Enum" },
  ]

  const typeLabelByValue: Record<PrimitiveVariableType, string> = {
    string: "String",
    integer: "Integer",
    boolean: "Boolean",
    enum: "Enum",
  }

  const sharedContent = (
    <div className="space-y-3 p-3">
      {globalVariables.map((item) => (
        <div
          key={item.id}
          className={cn(
            "rounded-md border border-border bg-background p-3 transition-all cursor-grab active:cursor-grabbing",
            draggingVariableId === item.id && "scale-[0.98] border-primary/60 bg-accent/40 shadow-sm opacity-80",
            draggingVariableId !== item.id && "hover:border-primary/30 hover:bg-accent/20"
          )}
          draggable
          onDragStart={(event: DragEvent<HTMLDivElement>) => {
            beginVariableDrag()
            setDraggingVariableId(item.id)
            event.dataTransfer.effectAllowed = "copy"
            event.dataTransfer.setData(
              VARIABLE_REFERENCE_DRAG_TYPE,
              serializeVariableReferenceDragPayload({
                scope: "automa",
                key: item.key,
                valueType: item.valueType,
              })
            )
          }}
          onDragEnd={() => {
            setDraggingVariableId(null)
            endVariableDrag()
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <GripVerticalIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
              <span className="truncate font-mono text-xs text-muted-foreground">${"{"}{item.key || "VAR"}{"}"}</span>
              <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                {typeLabelByValue[item.valueType]}
              </span>
            </div>
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
  )

  if (embedded) {
    return (
      <aside
        className={cn(
          "w-[min(19rem,calc(100vw-1.5rem))] max-h-[calc(100vh-1.5rem)] overflow-hidden rounded-lg border border-border bg-card/95 shadow-xl backdrop-blur-sm",
          className
        )}
        onDragEnter={blockDragEvent}
        onDragOver={blockDragEvent}
        onDrop={blockDragEvent}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <VariableIcon className="size-4 text-muted-foreground" />
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center justify-between text-left text-sm font-semibold"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-label="Toggle automation variables"
          >
            <span className="truncate">Automation variables ({globalVariables.length})</span>
            {isOpen ? <ChevronUpIcon className="size-4 text-muted-foreground" /> : <ChevronDownIcon className="size-4 text-muted-foreground" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="icon" variant="outline" aria-label="Add automation variable">
                  <Plus className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Add variable type</DropdownMenuLabel>
                {typeActions.map((action) => (
                  <DropdownMenuItem key={action.valueType} onClick={() => handleAddGlobalVariable(action.valueType)}>
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isOpen ? (
          <>
            <p className="px-3 pt-2 text-xs text-muted-foreground">Variables scoped to the selected automation</p>
            <ScrollArea className="h-[calc(100vh-6.75rem)]">{sharedContent}</ScrollArea>
          </>
        ) : null}
      </aside>
    )
  }

  return (
    <aside className={cn("h-full w-80 border-r border-border bg-card/50", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Automation variables</h2>
          <p className="text-xs text-muted-foreground">Variables scoped to the selected automation</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="icon" variant="outline" aria-label="Add automation variable">
                  <Plus className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Add variable type</DropdownMenuLabel>
                {typeActions.map((action) => (
                  <DropdownMenuItem key={action.valueType} onClick={() => handleAddGlobalVariable(action.valueType)}>
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-57px)]">{sharedContent}</ScrollArea>
    </aside>
  )
}

