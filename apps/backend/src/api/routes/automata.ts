import { Elysia } from "elysia"

import { requireAuth } from "@/api/authContext"
import { createAutomata, deleteAutomata, listAutomata, updateAutomata } from "@/bll/automata"
import { withTenantSession } from "@/db/tenantSession"

function headersFromUnknown(headers: unknown): Headers {
  const input = headers as Record<string, string | undefined>
  const normalized = Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  )
  return new Headers(normalized)
}

export const automataRoutes = new Elysia({ prefix: "/automata" })
  .get("", async ({ headers, set }) => {
    try {
      const auth = requireAuth(headersFromUnknown(headers))
      return await withTenantSession(auth.claims, async (client) => listAutomata(client))
    } catch (error) {
      set.status = 403
      return { error: error instanceof Error ? error.message : "Forbidden" }
    }
  })
  .post("", async ({ headers, body, set }) => {
    try {
      const auth = requireAuth(headersFromUnknown(headers))
      return await withTenantSession(auth.claims, async (client) => createAutomata(client, auth.claims, body))
    } catch (error) {
      set.status = 403
      return { error: error instanceof Error ? error.message : "Forbidden" }
    }
  })
  .patch("/:automataId", async ({ headers, body, params, set }) => {
    try {
      const auth = requireAuth(headersFromUnknown(headers))
      return await withTenantSession(auth.claims, async (client) => updateAutomata(client, params.automataId, body))
    } catch (error) {
      set.status = 403
      return { error: error instanceof Error ? error.message : "Forbidden" }
    }
  })
  .delete("/:automataId", async ({ headers, params, set }) => {
    try {
      const auth = requireAuth(headersFromUnknown(headers))
      await withTenantSession(auth.claims, async (client) => deleteAutomata(client, params.automataId))
      return { success: true }
    } catch (error) {
      set.status = 403
      return { error: error instanceof Error ? error.message : "Forbidden" }
    }
  })
