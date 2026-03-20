import { Elysia } from "elysia"

import { requireAuth } from "@/api/authContext"
import { createTenantVariable, deleteTenantVariable, listTenantVariables, updateTenantVariable } from "@/bll/tenantVariables"
import { withTenantSession } from "@/db/tenantSession"

function headersFromUnknown(headers: unknown): Headers {
  const input = headers as Record<string, string | undefined>
  const normalized = Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  )
  return new Headers(normalized)
}

export const tenantVariableRoutes = new Elysia({ prefix: "/tenant-variables" })
  .get("", async ({ headers, set }) => {
    try {
      const auth = requireAuth(headersFromUnknown(headers))
      return await withTenantSession(auth.claims, async (client) => listTenantVariables(client))
    } catch (error) {
      set.status = 403
      return { error: error instanceof Error ? error.message : "Forbidden" }
    }
  })
  .post("", async ({ headers, body, set }) => {
    try {
      const auth = requireAuth(headersFromUnknown(headers))
      return await withTenantSession(auth.claims, async (client) => createTenantVariable(client, auth.claims, body))
    } catch (error) {
      set.status = 403
      return { error: error instanceof Error ? error.message : "Forbidden" }
    }
  })
  .patch("/:variableId", async ({ headers, body, params, set }) => {
    try {
      const auth = requireAuth(headersFromUnknown(headers))
      return await withTenantSession(auth.claims, async (client) => updateTenantVariable(client, params.variableId, body))
    } catch (error) {
      set.status = 403
      return { error: error instanceof Error ? error.message : "Forbidden" }
    }
  })
  .delete("/:variableId", async ({ headers, params, set }) => {
    try {
      const auth = requireAuth(headersFromUnknown(headers))
      await withTenantSession(auth.claims, async (client) => deleteTenantVariable(client, params.variableId))
      return { success: true }
    } catch (error) {
      set.status = 403
      return { error: error instanceof Error ? error.message : "Forbidden" }
    }
  })
