import { eq } from "drizzle-orm"
import type { PoolClient } from "pg"

import {
  createTenantVariableRequestSchema,
  type TenantVariableDto,
  tenantVariableSchema,
  type JwtClaims,
  updateTenantVariableRequestSchema,
} from "@automata/shared-contracts"

import { dbFromClient } from "@/db/client"
import { tenantGlobalVariables } from "@/db/schema"

export async function listTenantVariables(client: PoolClient): Promise<TenantVariableDto[]> {
  const txDb = dbFromClient(client)
  const rows = await txDb.query.tenantGlobalVariables.findMany({
    orderBy: (table, { asc }) => [asc(table.key)],
  })

  return tenantVariableSchema.array().parse(
    rows.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      key: row.key,
      value: row.value,
      valueType: row.valueType,
      enumOptions: row.enumOptions,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }))
  )
}

export async function createTenantVariable(client: PoolClient, claims: JwtClaims, input: unknown) {
  const payload = createTenantVariableRequestSchema.parse(input)
  const txDb = dbFromClient(client)

  const [created] = await txDb
    .insert(tenantGlobalVariables)
    .values({
      tenantId: claims.tenantId,
      key: payload.key,
      value: payload.value,
      valueType: payload.valueType,
      enumOptions: payload.enumOptions,
    })
    .returning()

  return tenantVariableSchema.parse({
    id: created.id,
    tenantId: created.tenantId,
    key: created.key,
    value: created.value,
    valueType: created.valueType,
    enumOptions: created.enumOptions,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  })
}

export async function updateTenantVariable(client: PoolClient, variableId: string, input: unknown) {
  const payload = updateTenantVariableRequestSchema.parse(input)
  const txDb = dbFromClient(client)
  const updateSet: {
    updatedAt: Date
    key?: string
    value?: string
    valueType?: "string" | "integer" | "boolean" | "enum"
    enumOptions?: string[]
  } = {
    updatedAt: new Date(),
  }

  if (payload.key !== undefined) {
    updateSet.key = payload.key
  }
  if (payload.value !== undefined) {
    updateSet.value = payload.value
  }
  if (payload.valueType !== undefined) {
    updateSet.valueType = payload.valueType
  }
  if (payload.enumOptions !== undefined) {
    updateSet.enumOptions = payload.enumOptions
  }

  const [updated] = await txDb
    .update(tenantGlobalVariables)
    .set(updateSet)
    .where(eq(tenantGlobalVariables.id, variableId))
    .returning()

  if (!updated) {
    throw new Error("Tenant variable not found")
  }

  return tenantVariableSchema.parse({
    id: updated.id,
    tenantId: updated.tenantId,
    key: updated.key,
    value: updated.value,
    valueType: updated.valueType,
    enumOptions: updated.enumOptions,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  })
}

export async function deleteTenantVariable(client: PoolClient, variableId: string): Promise<void> {
  const txDb = dbFromClient(client)
  await txDb.delete(tenantGlobalVariables).where(eq(tenantGlobalVariables.id, variableId))
}
