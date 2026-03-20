import { z } from "zod"

export const roleNameSchema = z.string().min(1)
export const permissionCodeSchema = z.string().min(1)

export const jwtClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  tenantId: z.string().min(1),
  roles: z.array(roleNameSchema),
  permissions: z.array(permissionCodeSchema),
  jti: z.string().min(1),
  exp: z.number().int().positive(),
})

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantId: z.string().min(1),
})

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  claims: jwtClaimsSchema,
})

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
})

export const refreshResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  claims: jwtClaimsSchema,
})

export const authMeResponseSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  tenantId: z.string().min(1),
  roles: z.array(roleNameSchema),
  permissions: z.array(permissionCodeSchema),
})

export const graphSnapshotSchema = z.object({
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
  selectedNodeId: z.string().nullable(),
  globalVariables: z.array(z.unknown()),
})

export const automataSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  graph: graphSnapshotSchema,
})

export const createAutomataRequestSchema = z.object({
  name: z.string().min(1).max(120),
})

export const updateAutomataRequestSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  graph: graphSnapshotSchema.optional(),
})

export const primitiveVariableTypeSchema = z.enum(["string", "integer", "boolean", "enum"])

export const tenantVariableSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  key: z.string().min(1),
  value: z.string(),
  valueType: primitiveVariableTypeSchema,
  enumOptions: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createTenantVariableRequestSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.string(),
  valueType: primitiveVariableTypeSchema,
  enumOptions: z.array(z.string()).default([]),
})

export const updateTenantVariableRequestSchema = z.object({
  key: z.string().min(1).max(120).optional(),
  value: z.string().optional(),
  valueType: primitiveVariableTypeSchema.optional(),
  enumOptions: z.array(z.string()).optional(),
})

export type JwtClaims = z.infer<typeof jwtClaimsSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type RefreshRequest = z.infer<typeof refreshRequestSchema>
export type RefreshResponse = z.infer<typeof refreshResponseSchema>
export type AuthMeResponse = z.infer<typeof authMeResponseSchema>
export type AutomataDto = z.infer<typeof automataSchema>
export type CreateAutomataRequest = z.infer<typeof createAutomataRequestSchema>
export type UpdateAutomataRequest = z.infer<typeof updateAutomataRequestSchema>
export type TenantVariableDto = z.infer<typeof tenantVariableSchema>
export type CreateTenantVariableRequest = z.infer<typeof createTenantVariableRequestSchema>
export type UpdateTenantVariableRequest = z.infer<typeof updateTenantVariableRequestSchema>
