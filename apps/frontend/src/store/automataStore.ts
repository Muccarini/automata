import { create } from "zustand"

import type { AutomataDto, TenantVariableDto } from "@automata/shared-contracts"

import {
  apiCreateAutomata,
  apiCreateTenantVariable,
  apiDeleteAutomata,
  apiDeleteTenantVariable,
  apiListAutomata,
  apiListTenantVariables,
  apiLogin,
  apiMe,
  apiUpdateAutomata,
  apiUpdateTenantVariable,
  clearAuthSession,
  getAuthClaims,
  hasAuthSession,
} from "@/lib/api/client"
import { createDefaultGraphSnapshot } from "@/store/automaGraphStore"
import type { Automata, Tenant } from "@/types/automata"
import type { GlobalVariable, GraphSnapshot, PrimitiveVariableType } from "@/types/graph"

type AutomataState = {
  tenants: Tenant[]
  selectedTenantId: string
  automata: Automata[]
  tenantGlobalVariables: Record<string, GlobalVariable[]>
  selectedAutomataId: string | null
  isBootstrapped: boolean
  bootstrapError: string | null
  bootstrapBackendState: () => Promise<void>
  selectTenant: (tenantId: string) => void
  selectAutomata: (automataId: string) => void
  addAutomata: (name?: string) => void
  removeAutomata: (automataId: string) => void
  updateAutomataGraph: (automataId: string, graph: GraphSnapshot) => void
  persistAutomataGraph: (automataId: string, graph: GraphSnapshot) => Promise<void>
  addTenantGlobalVariable: (valueType: PrimitiveVariableType) => void
  updateTenantGlobalVariable: (id: string, key: string, value: string) => void
  removeTenantGlobalVariable: (id: string) => void
}

const DEMO_EMAIL = "admin@automata.local"
const DEMO_PASSWORD = "admin12345"
const DEMO_TENANT_ID = "11111111-1111-1111-1111-111111111111"

const tenantVariableSyncTimers = new Map<string, number>()

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

function toGraphSnapshot(raw: unknown): GraphSnapshot {
  const fallback = createDefaultGraphSnapshot()

  if (!raw || typeof raw !== "object") {
    return fallback
  }

  const candidate = raw as Partial<GraphSnapshot>

  return {
    nodes: Array.isArray(candidate.nodes) ? (candidate.nodes as GraphSnapshot["nodes"]) : fallback.nodes,
    edges: Array.isArray(candidate.edges) ? (candidate.edges as GraphSnapshot["edges"]) : fallback.edges,
    selectedNodeId: typeof candidate.selectedNodeId === "string" || candidate.selectedNodeId === null ? candidate.selectedNodeId : null,
    globalVariables: Array.isArray(candidate.globalVariables)
      ? normalizeGlobalVariables(candidate.globalVariables as GlobalVariable[])
      : fallback.globalVariables,
  }
}

function fromAutomataDto(dto: AutomataDto): Automata {
  return {
    id: dto.id,
    tenantId: dto.tenantId,
    name: dto.name,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    graph: toGraphSnapshot(dto.graph),
  }
}

function fromTenantVariableDto(dto: TenantVariableDto): GlobalVariable {
  return {
    id: dto.id,
    key: dto.key,
    value: dto.value,
    valueType: dto.valueType,
    enumOptions: dto.enumOptions,
  }
}

function resolveNextSelectedAutomataId(automata: Automata[], selectedTenantId: string, currentSelectedAutomataId: string | null): string | null {
  if (currentSelectedAutomataId && automata.some((item) => item.id === currentSelectedAutomataId && item.tenantId === selectedTenantId)) {
    return currentSelectedAutomataId
  }

  const first = automata.find((item) => item.tenantId === selectedTenantId)
  return first?.id ?? null
}

export const useAutomataStore = create<AutomataState>()((set, get) => ({
  tenants: [],
  selectedTenantId: "",
  automata: [],
  tenantGlobalVariables: {},
  selectedAutomataId: null,
  isBootstrapped: false,
  bootstrapError: null,

  bootstrapBackendState: async () => {
    if (get().isBootstrapped) {
      return
    }

    set({ bootstrapError: null })

    try {
      if (!hasAuthSession()) {
        await apiLogin({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          tenantId: DEMO_TENANT_ID,
        })
      } else {
        try {
          await apiMe()
        } catch {
          clearAuthSession()
          await apiLogin({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            tenantId: DEMO_TENANT_ID,
          })
        }
      }

      const claims = getAuthClaims()
      if (!claims) {
        throw new Error("Missing auth claims")
      }

      const tenantId = claims.tenantId
      const [automataRows, tenantVariablesRows] = await Promise.all([apiListAutomata(), apiListTenantVariables()])

      let nextAutomata = automataRows.map(fromAutomataDto)
      if (nextAutomata.length === 0) {
        const created = await apiCreateAutomata({ name: "Automa iniziale" })
        nextAutomata = [fromAutomataDto(created)]
      }

      const nextTenantVariables = tenantVariablesRows.map(fromTenantVariableDto)
      const previousSelectedAutomataId = get().selectedAutomataId

      set({
        tenants: [{ id: tenantId, name: "Core Team" }],
        selectedTenantId: tenantId,
        automata: nextAutomata,
        tenantGlobalVariables: {
          [tenantId]: nextTenantVariables,
        },
        selectedAutomataId: resolveNextSelectedAutomataId(nextAutomata, tenantId, previousSelectedAutomataId),
        isBootstrapped: true,
        bootstrapError: null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Backend bootstrap failed"
      set({
        isBootstrapped: false,
        bootstrapError: message,
      })
      console.error("[automataStore] bootstrap failed", message)
    }
  },

  selectTenant: (tenantId) => {
    set((state) => {
      if (!state.tenants.some((tenant) => tenant.id === tenantId)) {
        return state
      }

      return {
        selectedTenantId: tenantId,
        selectedAutomataId: resolveNextSelectedAutomataId(state.automata, tenantId, state.selectedAutomataId),
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
    const safeName = name?.trim() || "Nuovo automa"

    void (async () => {
      try {
        const created = fromAutomataDto(await apiCreateAutomata({ name: safeName }))

        set((state) => ({
          automata: [...state.automata, created],
          selectedAutomataId: created.id,
        }))
      } catch (error) {
        console.error("[automataStore] addAutomata failed", error)
      }
    })()
  },

  removeAutomata: (automataId) => {
    void (async () => {
      try {
        await apiDeleteAutomata(automataId)

        set((state) => {
          const nextAutomata = state.automata.filter((item) => item.id !== automataId)
          const nextSelectedAutomataId =
            state.selectedAutomataId === automataId
              ? resolveNextSelectedAutomataId(nextAutomata, state.selectedTenantId, null)
              : state.selectedAutomataId

          return {
            automata: nextAutomata,
            selectedAutomataId: nextSelectedAutomataId,
          }
        })

        const stateAfterDelete = get()
        if (!stateAfterDelete.automata.some((item) => item.tenantId === stateAfterDelete.selectedTenantId)) {
          const created = fromAutomataDto(await apiCreateAutomata({ name: "Automa iniziale" }))
          set((state) => ({
            automata: [...state.automata, created],
            selectedAutomataId: created.id,
          }))
        }
      } catch (error) {
        console.error("[automataStore] removeAutomata failed", error)
      }
    })()
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

  persistAutomataGraph: async (automataId, graph) => {
    try {
      const updated = fromAutomataDto(await apiUpdateAutomata(automataId, { graph }))
      set((state) => ({
        automata: state.automata.map((item) => (item.id === updated.id ? updated : item)),
      }))
    } catch (error) {
      console.error("[automataStore] persistAutomataGraph failed", error)
    }
  },

  addTenantGlobalVariable: (valueType) => {
    void (async () => {
      try {
        const created = fromTenantVariableDto(
          await apiCreateTenantVariable({
            key: `NEW_${valueType.toUpperCase()}_${Math.floor(Date.now() / 1000)}`,
            value: "",
            valueType,
            enumOptions: [],
          })
        )

        set((state) => {
          const tenantId = state.selectedTenantId
          const current = state.tenantGlobalVariables[tenantId] ?? []

          return {
            tenantGlobalVariables: {
              ...state.tenantGlobalVariables,
              [tenantId]: [...current, created],
            },
          }
        })
      } catch (error) {
        console.error("[automataStore] addTenantGlobalVariable failed", error)
      }
    })()
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

    if (typeof window === "undefined") {
      return
    }

    const previousTimer = tenantVariableSyncTimers.get(id)
    if (previousTimer) {
      window.clearTimeout(previousTimer)
    }

    const timerId = window.setTimeout(() => {
      void (async () => {
        const state = get()
        const tenantId = state.selectedTenantId
        const variable = (state.tenantGlobalVariables[tenantId] ?? []).find((item) => item.id === id)

        if (!variable) {
          return
        }

        try {
          const updated = fromTenantVariableDto(
            await apiUpdateTenantVariable(id, {
              key: variable.key,
              value: variable.value,
              valueType: variable.valueType,
              enumOptions: variable.enumOptions,
            })
          )

          set((innerState) => {
            const innerTenantId = innerState.selectedTenantId
            const current = innerState.tenantGlobalVariables[innerTenantId] ?? []

            return {
              tenantGlobalVariables: {
                ...innerState.tenantGlobalVariables,
                [innerTenantId]: current.map((item) => (item.id === id ? updated : item)),
              },
            }
          })
        } catch (error) {
          console.error("[automataStore] updateTenantGlobalVariable failed", error)
        }
      })()
    }, 350)

    tenantVariableSyncTimers.set(id, timerId)
  },

  removeTenantGlobalVariable: (id) => {
    if (typeof window !== "undefined") {
      const timer = tenantVariableSyncTimers.get(id)
      if (timer) {
        window.clearTimeout(timer)
        tenantVariableSyncTimers.delete(id)
      }
    }

    void (async () => {
      try {
        await apiDeleteTenantVariable(id)

        set((state) => {
          const tenantId = state.selectedTenantId
          const current = state.tenantGlobalVariables[tenantId] ?? []

          return {
            tenantGlobalVariables: {
              ...state.tenantGlobalVariables,
              [tenantId]: current.filter((item) => item.id !== id),
            },
          }
        })
      } catch (error) {
        console.error("[automataStore] removeTenantGlobalVariable failed", error)
      }
    })()
  },
}))
