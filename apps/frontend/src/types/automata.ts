import type { GraphSnapshot } from "@/types/graph"

/** An organization or workspace that owns one or more automations. */
export type Tenant = {
  id: string
  name: string
}

/** An automation workflow owned by a tenant, containing a full graph snapshot. */
export type Automata = {
  id: string
  tenantId: string
  name: string
  createdAt: string
  updatedAt: string
  graph: GraphSnapshot
}
