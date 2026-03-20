import { eq } from "drizzle-orm"
import type { PoolClient } from "pg"

import {
  type AutomataDto,
  automataSchema,
  createAutomataRequestSchema,
  type JwtClaims,
  updateAutomataRequestSchema,
} from "@automata/shared-contracts"

import { dbFromClient } from "@/db/client"
import { automata } from "@/db/schema"

const emptyGraph = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  globalVariables: [],
}

export async function listAutomata(client: PoolClient): Promise<AutomataDto[]> {
  const txDb = dbFromClient(client)
  const rows = await txDb.query.automata.findMany({
    orderBy: (table, { desc }) => [desc(table.updatedAt)],
  })

  return automataSchema.array().parse(
    rows.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      graph: row.graph,
    }))
  )
}

export async function createAutomata(client: PoolClient, claims: JwtClaims, input: unknown) {
  const payload = createAutomataRequestSchema.parse(input)
  const txDb = dbFromClient(client)

  const [created] = await txDb
    .insert(automata)
    .values({
      tenantId: claims.tenantId,
      name: payload.name,
      graph: emptyGraph,
      createdByUserId: claims.sub,
    })
    .returning()

  return automataSchema.parse({
    id: created.id,
    tenantId: created.tenantId,
    name: created.name,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
    graph: created.graph,
  })
}

export async function updateAutomata(client: PoolClient, automataId: string, input: unknown) {
  const payload = updateAutomataRequestSchema.parse(input)
  const txDb = dbFromClient(client)
  const updateSet: {
    updatedAt: Date
    name?: string
    graph?: unknown
  } = {
    updatedAt: new Date(),
  }

  if (payload.name !== undefined) {
    updateSet.name = payload.name
  }

  if (payload.graph !== undefined) {
    updateSet.graph = payload.graph
  }

  const [updated] = await txDb
    .update(automata)
    .set(updateSet)
    .where(eq(automata.id, automataId))
    .returning()

  if (!updated) {
    throw new Error("Automata not found")
  }

  return automataSchema.parse({
    id: updated.id,
    tenantId: updated.tenantId,
    name: updated.name,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    graph: updated.graph,
  })
}

export async function deleteAutomata(client: PoolClient, automataId: string): Promise<void> {
  const txDb = dbFromClient(client)
  await txDb.delete(automata).where(eq(automata.id, automataId))
}
