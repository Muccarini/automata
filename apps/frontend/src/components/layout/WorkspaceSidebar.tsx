import { Plus, Trash2 } from "lucide-react"

import { TenantGlobalVariablesSection } from "@/components/layout/TenantGlobalVariablesSection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAutomataStore } from "@/store/automataStore"

export function WorkspaceSidebar() {
  const tenants = useAutomataStore((state) => state.tenants)
  const automata = useAutomataStore((state) => state.automata)
  const selectedTenantId = useAutomataStore((state) => state.selectedTenantId)
  const isBootstrapped = useAutomataStore((state) => state.isBootstrapped)
  const selectedAutomataId = useAutomataStore((state) => state.selectedAutomataId)
  const selectTenant = useAutomataStore((state) => state.selectTenant)
  const selectAutomata = useAutomataStore((state) => state.selectAutomata)
  const addAutomata = useAutomataStore((state) => state.addAutomata)
  const removeAutomata = useAutomataStore((state) => state.removeAutomata)

  const scopedAutomata = automata.filter((item) => item.tenantId === selectedTenantId)

  return (
    <aside className="h-full w-80 border-r border-border bg-card/40">
      <div className="border-b border-border p-4">
        <p className="text-sm font-semibold">Automata Workspace</p>
        <p className="text-xs text-muted-foreground">Scaffold multi-tenant con gestione automi</p>
      </div>

      <div className="space-y-3 border-b border-border p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Tenant</p>
          <Select
            value={selectedTenantId}
            onValueChange={(value) => {
              if (!value) {
                return
              }

              selectTenant(value)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleziona tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id} disabled={!isBootstrapped}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full justify-start gap-2" onClick={() => addAutomata()} disabled={!isBootstrapped}>
          <Plus className="size-4" />
          Aggiungi automa
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-157px)]">
        <div className="space-y-3 p-4">
          {scopedAutomata.map((item) => {
            const isSelected = item.id === selectedAutomataId

            return (
              <button
                key={item.id}
                type="button"
                className="w-full rounded-lg border border-border bg-background/80 p-3 text-left transition-colors hover:bg-accent/40"
                onClick={() => selectAutomata(item.id)}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium leading-tight">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleString()}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={(event) => {
                      event.stopPropagation()
                      removeAutomata(item.id)
                    }}
                    aria-label="Elimina automa"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant={isSelected ? "default" : "secondary"}>{isSelected ? "Attivo" : "Disponibile"}</Badge>
                  <span className="text-muted-foreground">{item.graph.nodes.length} nodi</span>
                </div>
              </button>
            )
          })}

          <TenantGlobalVariablesSection />
        </div>
      </ScrollArea>
    </aside>
  )
}
