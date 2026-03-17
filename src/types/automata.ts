import type { GraphSnapshot } from "@/types/graph"

export type Tenant = {
  id: string
  name: string
}

export type Automata = {
  id: string
  tenantId: string
  name: string
  createdAt: string
  updatedAt: string
  graph: GraphSnapshot
}
