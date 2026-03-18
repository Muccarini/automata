import { create } from "zustand"
import { persist } from "zustand/middleware"

import { createDefaultGraphSnapshot } from "@/store/automaGraphStore"
import type { Automata, Tenant } from "@/types/automata"
import type { GlobalVariable, GraphSnapshot, PrimitiveVariableType } from "@/types/graph"

type AutomataState = {
  tenants: Tenant[]
  selectedTenantId: string
  automata: Automata[]
  tenantGlobalVariables: Record<string, GlobalVariable[]>
  selectedAutomataId: string | null
  selectTenant: (tenantId: string) => void
  selectAutomata: (automataId: string) => void
  addAutomata: (name?: string) => void
  removeAutomata: (automataId: string) => void
  updateAutomataGraph: (automataId: string, graph: GraphSnapshot) => void
  addTenantGlobalVariable: (valueType: PrimitiveVariableType) => void
  updateTenantGlobalVariable: (id: string, key: string, value: string) => void
  removeTenantGlobalVariable: (id: string) => void
}

const storageKey = "maas-automata-scaffold-v1"

const mockTenants: Tenant[] = [
  { id: "tenant-core", name: "Core Team" },
  { id: "tenant-growth", name: "Growth Team" },
  { id: "tenant-ops", name: "Ops Team" },
]

function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

function createDefaultTenantVariables(tenantId: string): GlobalVariable[] {
  return [{ id: uid("tenant_var"), key: `${tenantId.toUpperCase().replace(/-/g, "_")}_API_BASE_URL`, value: "", valueType: "string", enumOptions: [] }]
}

function normalizeGlobalVariable(variable: GlobalVariable): GlobalVariable {
  return {
    ...variable,
    valueType:
      variable.valueType === "string" || variable.valueType === "integer" || variable.valueType === "boolean" || variable.valueType === "enum"
        ? variable.valueType
        : "string",
    enumOptions: Array.isArray(variable.enumOptions) ? variable.enumOptions.filter((item) => typeof item === "string") : [],
  }
}

function normalizeGlobalVariables(variables: GlobalVariable[] | undefined): GlobalVariable[] {
  return (variables ?? []).map((variable) => normalizeGlobalVariable(variable))
}

function createTenantGlobalVariablesSeed(tenants: Tenant[]): Record<string, GlobalVariable[]> {
  return Object.fromEntries(tenants.map((tenant) => [tenant.id, createDefaultTenantVariables(tenant.id)]))
}

function createAutomataForTenant(tenantId: string, name?: string): Automata {
  const timestamp = new Date().toISOString()

  return {
    id: uid("automa"),
    tenantId,
    name: name?.trim() || "New automation",
    createdAt: timestamp,
    updatedAt: timestamp,
    graph: createDefaultGraphSnapshot(),
  }
}

function nextSelectionForTenant(automata: Automata[], tenantId: string): string | null {
  const candidate = automata.find((item) => item.tenantId === tenantId)
  return candidate?.id ?? null
}

const initialTenantId = mockTenants[0]?.id ?? "tenant-core"
const initialAutomata = [createAutomataForTenant(initialTenantId, "Initial automation")]
const initialTenantGlobalVariables = createTenantGlobalVariablesSeed(mockTenants)

export const useAutomataStore = create<AutomataState>()(
  persist(
    (set) => ({
      tenants: mockTenants,
      selectedTenantId: initialTenantId,
      automata: initialAutomata,
      tenantGlobalVariables: initialTenantGlobalVariables,
      selectedAutomataId: initialAutomata[0]?.id ?? null,

      selectTenant: (tenantId) => {
        set((state) => {
          if (!state.tenants.some((tenant) => tenant.id === tenantId)) {
            return state
          }

          const tenantAutomata = state.automata.filter((item) => item.tenantId === tenantId)
          if (tenantAutomata.length > 0) {
            return {
              selectedTenantId: tenantId,
              selectedAutomataId: tenantAutomata[0].id,
              tenantGlobalVariables: state.tenantGlobalVariables[tenantId]
                ? state.tenantGlobalVariables
                : {
                    ...state.tenantGlobalVariables,
                    [tenantId]: createDefaultTenantVariables(tenantId),
                  },
            }
          }

          const seeded = createAutomataForTenant(tenantId, "Initial automation")
          return {
            selectedTenantId: tenantId,
            automata: [...state.automata, seeded],
            selectedAutomataId: seeded.id,
            tenantGlobalVariables: state.tenantGlobalVariables[tenantId]
              ? state.tenantGlobalVariables
              : {
                  ...state.tenantGlobalVariables,
                  [tenantId]: createDefaultTenantVariables(tenantId),
                },
          }
        })
      },

      selectAutomata: (automataId) => {
        set((state) => {
          const selected = state.automata.find((item) => item.id === automataId)
          if (!selected || selected.tenantId !== state.selectedTenantId) {
            return state
          }

          return { selectedAutomataId: automataId }
        })
      },

      addAutomata: (name) => {
        set((state) => {
          const created = createAutomataForTenant(state.selectedTenantId, name)

          return {
            automata: [...state.automata, created],
            selectedAutomataId: created.id,
          }
        })
      },

      removeAutomata: (automataId) => {
        set((state) => {
          const toDelete = state.automata.find((item) => item.id === automataId)
          if (!toDelete || toDelete.tenantId !== state.selectedTenantId) {
            return state
          }

          let nextAutomata = state.automata.filter((item) => item.id !== automataId)

          if (!nextAutomata.some((item) => item.tenantId === state.selectedTenantId)) {
            nextAutomata = [...nextAutomata, createAutomataForTenant(state.selectedTenantId, "Initial automation")]
          }

          const nextSelectedAutomataId =
            state.selectedAutomataId === automataId
              ? nextSelectionForTenant(nextAutomata, state.selectedTenantId)
              : state.selectedAutomataId

          return {
            automata: nextAutomata,
            selectedAutomataId: nextSelectedAutomataId,
          }
        })
      },

      updateAutomataGraph: (automataId, graph) => {
        set((state) => ({
          automata: state.automata.map((item) =>
            item.id === automataId
              ? {
                  ...item,
                  graph,
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
        }))
      },

      addTenantGlobalVariable: (valueType) => {
        set((state) => {
          const tenantId = state.selectedTenantId
          const current = state.tenantGlobalVariables[tenantId] ?? []

          return {
            tenantGlobalVariables: {
              ...state.tenantGlobalVariables,
              [tenantId]: [...current, { id: uid("tenant_var"), key: "NEW_TENANT_VAR", value: "", valueType, enumOptions: [] }],
            },
          }
        })
      },

      updateTenantGlobalVariable: (id, key, value) => {
        set((state) => {
          const tenantId = state.selectedTenantId
          const current = state.tenantGlobalVariables[tenantId] ?? []

          return {
            tenantGlobalVariables: {
              ...state.tenantGlobalVariables,
              [tenantId]: current.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      key,
                      value,
                    }
                  : item
              ),
            },
          }
        })
      },

      removeTenantGlobalVariable: (id) => {
        set((state) => {
          const tenantId = state.selectedTenantId
          const current = state.tenantGlobalVariables[tenantId] ?? []
          const next = current.filter((item) => item.id !== id)

          return {
            tenantGlobalVariables: {
              ...state.tenantGlobalVariables,
              [tenantId]: next.length > 0 ? next : createDefaultTenantVariables(tenantId),
            },
          }
        })
      },
    }),
    {
      name: storageKey,
      partialize: (state) => ({
        tenants: state.tenants,
        selectedTenantId: state.selectedTenantId,
        automata: state.automata,
        tenantGlobalVariables: state.tenantGlobalVariables,
        selectedAutomataId: state.selectedAutomataId,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AutomataState>
        const persistedTenants = Array.isArray(persisted.tenants) && persisted.tenants.length > 0 ? persisted.tenants : currentState.tenants
        const persistedTenantId =
          typeof persisted.selectedTenantId === "string" && persistedTenants.some((tenant) => tenant.id === persisted.selectedTenantId)
            ? persisted.selectedTenantId
            : persistedTenants[0]?.id ?? currentState.selectedTenantId
        let mergedAutomata = Array.isArray(persisted.automata)
          ? persisted.automata.map((item) => ({
              ...item,
              graph: item.graph ?? createDefaultGraphSnapshot(),
            }))
          : currentState.automata

        if (!mergedAutomata.some((item) => item.tenantId === persistedTenantId)) {
          mergedAutomata = [...mergedAutomata, createAutomataForTenant(persistedTenantId, "Initial automation")]
        }

        const rawTenantVariables =
          persisted.tenantGlobalVariables && typeof persisted.tenantGlobalVariables === "object"
            ? persisted.tenantGlobalVariables
            : currentState.tenantGlobalVariables
        const mergedTenantVariables: Record<string, GlobalVariable[]> = {}
        for (const tenant of persistedTenants) {
          const candidate = rawTenantVariables[tenant.id]
          mergedTenantVariables[tenant.id] =
            Array.isArray(candidate) && candidate.length > 0
              ? normalizeGlobalVariables(candidate)
              : createDefaultTenantVariables(tenant.id)
        }

        const persistedSelectedAutomataId =
          typeof persisted.selectedAutomataId === "string" ? persisted.selectedAutomataId : null
        const isSelectedAutomataValid =
          persistedSelectedAutomataId !== null &&
          mergedAutomata.some((item) => item.id === persistedSelectedAutomataId && item.tenantId === persistedTenantId)

        return {
          ...currentState,
          ...persisted,
          tenants: persistedTenants,
          selectedTenantId: persistedTenantId,
          automata: mergedAutomata,
          tenantGlobalVariables: mergedTenantVariables,
          selectedAutomataId: isSelectedAutomataValid
            ? persistedSelectedAutomataId
            : nextSelectionForTenant(mergedAutomata, persistedTenantId),
        }
      },
    }
  )
)
