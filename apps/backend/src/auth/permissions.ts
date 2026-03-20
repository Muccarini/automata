import { and, eq, inArray, isNull } from "drizzle-orm"
import type { PoolClient } from "pg"

import { dbFromClient } from "@/db/client"
import { permissions, refreshTokens, rolePermissions, roles, userTenantRoles } from "@/db/schema"

export async function getUserTenantRolesAndPermissions(client: PoolClient, userId: string, tenantId: string) {
  const txDb = dbFromClient(client)

  const rows = await txDb
    .select({ roleCode: roles.code, permissionCode: permissions.code })
    .from(userTenantRoles)
    .innerJoin(roles, eq(roles.id, userTenantRoles.roleId))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(and(eq(userTenantRoles.userId, userId), eq(userTenantRoles.tenantId, tenantId)))

  const roleCodes = new Set<string>()
  const permissionCodes = new Set<string>()

  for (const row of rows) {
    roleCodes.add(row.roleCode)
    permissionCodes.add(row.permissionCode)
  }

  return {
    roles: Array.from(roleCodes),
    permissions: Array.from(permissionCodes),
  }
}

export async function revokeRefreshToken(client: PoolClient, tokenHash: string): Promise<void> {
  const txDb = dbFromClient(client)
  await txDb
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)))
}

export async function revokeRefreshTokenFamily(client: PoolClient, userId: string, tenantId: string): Promise<void> {
  const txDb = dbFromClient(client)
  const activeTokens = await txDb
    .select({ id: refreshTokens.id })
    .from(refreshTokens)
    .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.tenantId, tenantId), isNull(refreshTokens.revokedAt)))

  if (activeTokens.length === 0) {
    return
  }

  await txDb
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(inArray(refreshTokens.id, activeTokens.map((token) => token.id)))
}
