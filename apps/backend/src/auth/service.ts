import { and, eq, gt, isNull } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import {
  authMeResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
  refreshRequestSchema,
  refreshResponseSchema,
  type JwtClaims,
} from "@automata/shared-contracts"

import { env } from "@/config/env"
import { dbFromClient } from "@/db/client"
import { pool } from "@/db/client"
import { refreshTokens, users } from "@/db/schema"
import { hashValue, randomToken } from "@/auth/hash"
import { signAccessToken, verifyAccessToken } from "@/auth/jwt"
import { getUserTenantRolesAndPermissions, revokeRefreshToken, revokeRefreshTokenFamily } from "@/auth/permissions"

function buildClaims(input: {
  userId: string
  email: string
  tenantId: string
  roles: string[]
  permissions: string[]
}): JwtClaims {
  return {
    sub: input.userId,
    email: input.email,
    tenantId: input.tenantId,
    roles: input.roles,
    permissions: input.permissions,
    jti: randomUUID(),
    exp: Math.floor(Date.now() / 1000) + env.accessTokenTtlSeconds,
  }
}

async function issueRefreshToken(args: { userId: string; tenantId: string; client: ReturnType<typeof dbFromClient> }) {
  const refreshToken = randomToken(48)
  const tokenHash = hashValue(refreshToken)
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlSeconds * 1000)

  await args.client.insert(refreshTokens).values({
    userId: args.userId,
    tenantId: args.tenantId,
    tokenHash,
    expiresAt,
  })

  return refreshToken
}

export async function login(input: unknown) {
  const payload = loginRequestSchema.parse(input)
  const client = await pool.connect()

  try {
    await client.query("BEGIN")
    const txDb = dbFromClient(client)

    const user = await txDb.query.users.findFirst({ where: eq(users.email, payload.email) })
    if (!user || !user.isActive || user.passwordHash !== hashValue(payload.password)) {
      throw new Error("Invalid credentials")
    }

    const access = await getUserTenantRolesAndPermissions(client, user.id, payload.tenantId)
    if (access.roles.length === 0 || access.permissions.length === 0) {
      throw new Error("No tenant access")
    }

    const claims = buildClaims({
      userId: user.id,
      email: user.email,
      tenantId: payload.tenantId,
      roles: access.roles,
      permissions: access.permissions,
    })

    const accessToken = signAccessToken(claims)
    const refreshToken = await issueRefreshToken({ userId: user.id, tenantId: payload.tenantId, client: txDb })

    await client.query("COMMIT")

    return loginResponseSchema.parse({ accessToken, refreshToken, claims })
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export async function refresh(input: unknown) {
  const payload = refreshRequestSchema.parse(input)
  const tokenHash = hashValue(payload.refreshToken)
  const client = await pool.connect()

  try {
    await client.query("BEGIN")
    const txDb = dbFromClient(client)

    const tokenRow = await txDb.query.refreshTokens.findFirst({
      where: and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, new Date())),
    })

    if (!tokenRow) {
      throw new Error("Invalid refresh token")
    }

    const user = await txDb.query.users.findFirst({ where: eq(users.id, tokenRow.userId) })
    if (!user || !user.isActive) {
      throw new Error("User is not active")
    }

    const access = await getUserTenantRolesAndPermissions(client, tokenRow.userId, tokenRow.tenantId)
    if (access.roles.length === 0 || access.permissions.length === 0) {
      throw new Error("No tenant access")
    }

    await revokeRefreshToken(client, tokenHash)

    const claims = buildClaims({
      userId: tokenRow.userId,
      email: user.email,
      tenantId: tokenRow.tenantId,
      roles: access.roles,
      permissions: access.permissions,
    })

    const accessToken = signAccessToken(claims)
    const refreshToken = await issueRefreshToken({
      userId: tokenRow.userId,
      tenantId: tokenRow.tenantId,
      client: txDb,
    })

    await client.query("COMMIT")
    return refreshResponseSchema.parse({ accessToken, refreshToken, claims })
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashValue(refreshToken)
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await revokeRefreshToken(client, tokenHash)
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export async function logoutAllForCurrentTenant(accessToken: string): Promise<void> {
  const claims = verifyAccessToken(accessToken)
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await revokeRefreshTokenFamily(client, claims.sub, claims.tenantId)
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export function me(accessToken: string) {
  const claims = verifyAccessToken(accessToken)
  return authMeResponseSchema.parse({
    id: claims.sub,
    email: claims.email,
    tenantId: claims.tenantId,
    roles: claims.roles,
    permissions: claims.permissions,
  })
}
