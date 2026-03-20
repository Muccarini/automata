import {
  type AutomataDto,
  type AuthMeResponse,
  authMeResponseSchema,
  type CreateAutomataRequest,
  type CreateTenantVariableRequest,
  type JwtClaims,
  loginResponseSchema,
  refreshResponseSchema,
  type TenantVariableDto,
  tenantVariableSchema,
  updateAutomataRequestSchema,
  updateTenantVariableRequestSchema,
} from "@automata/shared-contracts"
import { automataSchema } from "@automata/shared-contracts"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api"
const STORAGE_KEY = "automata-backend-auth-v1"

type AuthSession = {
  accessToken: string
  refreshToken: string
  claims: JwtClaims
}

let authSession: AuthSession | null = null

function loadSessionFromStorage(): AuthSession | null {
  if (typeof window === "undefined") {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed.accessToken || !parsed.refreshToken) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function persistSession(session: AuthSession | null) {
  authSession = session
  if (typeof window === "undefined") {
    return
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function ensureSession() {
  if (!authSession) {
    authSession = loadSessionFromStorage()
  }
  return authSession
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = ensureSession()
  const headers = new Headers(init.headers)
  headers.set("content-type", "application/json")
  if (session?.accessToken) {
    headers.set("authorization", `Bearer ${session.accessToken}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function apiLogin(payload: { email: string; password: string; tenantId: string }) {
  const result = loginResponseSchema.parse(
    await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  )

  persistSession({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    claims: result.claims,
  })

  return result
}

export async function apiRefresh() {
  const session = ensureSession()
  if (!session) {
    throw new Error("No auth session")
  }

  const result = refreshResponseSchema.parse(
    await request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
  )

  persistSession({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    claims: result.claims,
  })

  return result
}

export async function apiMe(): Promise<AuthMeResponse> {
  const me = await request("/auth/me")
  return authMeResponseSchema.parse(me)
}

export async function apiListAutomata(): Promise<AutomataDto[]> {
  return automataSchema.array().parse(await request("/automata"))
}

export async function apiCreateAutomata(payload: CreateAutomataRequest): Promise<AutomataDto> {
  return automataSchema.parse(
    await request("/automata", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  )
}

export async function apiUpdateAutomata(id: string, payload: unknown): Promise<AutomataDto> {
  const parsed = updateAutomataRequestSchema.parse(payload)
  return automataSchema.parse(
    await request(`/automata/${id}`, {
      method: "PATCH",
      body: JSON.stringify(parsed),
    })
  )
}

export async function apiDeleteAutomata(id: string): Promise<void> {
  await request(`/automata/${id}`, { method: "DELETE" })
}

export async function apiListTenantVariables(): Promise<TenantVariableDto[]> {
  return tenantVariableSchema.array().parse(await request("/tenant-variables"))
}

export async function apiCreateTenantVariable(payload: CreateTenantVariableRequest): Promise<TenantVariableDto> {
  return tenantVariableSchema.parse(
    await request("/tenant-variables", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  )
}

export async function apiUpdateTenantVariable(id: string, payload: unknown): Promise<TenantVariableDto> {
  const parsed = updateTenantVariableRequestSchema.parse(payload)
  return tenantVariableSchema.parse(
    await request(`/tenant-variables/${id}`, {
      method: "PATCH",
      body: JSON.stringify(parsed),
    })
  )
}

export async function apiDeleteTenantVariable(id: string): Promise<void> {
  await request(`/tenant-variables/${id}`, { method: "DELETE" })
}

export function getAuthClaims(): JwtClaims | null {
  return ensureSession()?.claims ?? null
}

export function clearAuthSession() {
  persistSession(null)
}

export function hasAuthSession(): boolean {
  return Boolean(ensureSession())
}
