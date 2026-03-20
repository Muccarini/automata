import { Elysia } from "elysia"

import { login, logout, logoutAllForCurrentTenant, me, refresh } from "@/auth/service"
import { requireAuth } from "@/api/authContext"

function headersFromUnknown(headers: unknown): Headers {
  const input = headers as Record<string, string | undefined>
  const normalized = Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  )
  return new Headers(normalized)
}

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post("/login", async ({ body, set }) => {
    try {
      return await login(body)
    } catch (error) {
      set.status = 401
      return { error: error instanceof Error ? error.message : "Unauthorized" }
    }
  })
  .post("/refresh", async ({ body, set }) => {
    try {
      return await refresh(body)
    } catch (error) {
      set.status = 401
      return { error: error instanceof Error ? error.message : "Unauthorized" }
    }
  })
  .post("/logout", async ({ body, set }) => {
    const maybeToken = typeof body === "object" && body !== null ? (body as Record<string, unknown>).refreshToken : null
    if (typeof maybeToken !== "string" || !maybeToken.trim()) {
      set.status = 400
      return { error: "refreshToken is required" }
    }

    await logout(maybeToken)
    return { success: true }
  })
  .post("/logout-all", async ({ headers, set }) => {
    try {
      const auth = requireAuth(headersFromUnknown(headers))
      await logoutAllForCurrentTenant(auth.rawToken)
      return { success: true }
    } catch (error) {
      set.status = 401
      return { error: error instanceof Error ? error.message : "Unauthorized" }
    }
  })
  .get("/me", async ({ headers, set }) => {
    try {
      const auth = requireAuth(headersFromUnknown(headers))
      return me(auth.rawToken)
    } catch (error) {
      set.status = 401
      return { error: error instanceof Error ? error.message : "Unauthorized" }
    }
  })
