import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAutomataStore } from "@/store/automataStore"

export function TenantGlobalVariablesSection() {
  const tenantVariables = useAutomataStore((state) => {
    const tenantId = state.selectedTenantId
    return state.tenantGlobalVariables[tenantId] ?? []
  })
  const addTenantGlobalVariable = useAutomataStore((state) => state.addTenantGlobalVariable)
  const updateTenantGlobalVariable = useAutomataStore((state) => state.updateTenantGlobalVariable)
  const removeTenantGlobalVariable = useAutomataStore((state) => state.removeTenantGlobalVariable)

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Tenant global variables</p>
          <p className="text-xs text-muted-foreground">Shared across all automi in this tenant</p>
        </div>
        <Button size="icon" variant="outline" onClick={addTenantGlobalVariable}>
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {tenantVariables.map((item) => (
          <div key={item.id} className="rounded-md border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">${"{"}{item.key || "TENANT_VAR"}{"}"}</span>
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
