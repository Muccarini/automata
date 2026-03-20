import { GripVerticalIcon, Plus, Trash2 } from "lucide-react"
import { type DragEvent, useState } from "react"

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
import { useAutomataStore } from "@/store/automataStore"
import { useViewportDnDStore } from "@/store/viewportDnDStore"
import type { PrimitiveVariableType } from "@/types/graph"

export function TenantGlobalVariablesSection() {
  const tenantVariables = useAutomataStore((state) => {
    const tenantId = state.selectedTenantId
    return state.tenantGlobalVariables[tenantId] ?? []
  })
  const addTenantGlobalVariable = useAutomataStore((state) => state.addTenantGlobalVariable)
  const updateTenantGlobalVariable = useAutomataStore((state) => state.updateTenantGlobalVariable)
  const removeTenantGlobalVariable = useAutomataStore((state) => state.removeTenantGlobalVariable)
  const beginVariableDrag = useViewportDnDStore((state) => state.beginVariableDrag)
  const endVariableDrag = useViewportDnDStore((state) => state.endVariableDrag)
  const [draggingVariableId, setDraggingVariableId] = useState<string | null>(null)

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

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Tenant global variables</p>
          <p className="text-xs text-muted-foreground">Shared across all automi in this tenant</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="icon" variant="outline" aria-label="Add tenant variable">
                <Plus className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Add variable type</DropdownMenuLabel>
              {typeActions.map((action) => (
                <DropdownMenuItem key={action.valueType} onClick={() => addTenantGlobalVariable(action.valueType)}>
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        {tenantVariables.map((item) => (
          <div
            key={item.id}
            className={[
              "rounded-md border border-border bg-background p-3 transition-all cursor-grab active:cursor-grabbing",
              draggingVariableId === item.id ? "scale-[0.98] border-primary/60 bg-accent/40 shadow-sm opacity-80" : "hover:border-primary/30 hover:bg-accent/20",
            ].join(" ")}
            draggable
            onDragStart={(event: DragEvent<HTMLDivElement>) => {
              beginVariableDrag()
              setDraggingVariableId(item.id)
              event.dataTransfer.effectAllowed = "copy"
              event.dataTransfer.setData(
                VARIABLE_REFERENCE_DRAG_TYPE,
                serializeVariableReferenceDragPayload({
                  scope: "tenant",
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
              <div className="flex min-w-0 items-center gap-2">
                <GripVerticalIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
                <span className="truncate font-mono text-xs text-muted-foreground">${"{"}{item.key || "TENANT_VAR"}{"}"}</span>
                <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  {typeLabelByValue[item.valueType]}
                </span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeTenantGlobalVariable(item.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
            <Input
              className="mb-2 font-mono text-xs"
              placeholder="KEY"
              value={item.key}
              onChange={(event) => updateTenantGlobalVariable(item.id, event.target.value, item.value)}
            />
            <Input
              className="font-mono text-xs"
              placeholder="value"
              value={item.value}
              onChange={(event) => updateTenantGlobalVariable(item.id, item.key, event.target.value)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
