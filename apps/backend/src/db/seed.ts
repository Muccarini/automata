import { and, eq } from "drizzle-orm"

import { hashValue } from "@/auth/hash"
import { dbFromClient, pool } from "@/db/client"
import { permissions, rolePermissions, roles, tenants, userTenantRoles, users } from "@/db/schema"

const roleSeeds = [
  { code: "admin", description: "Tenant administrator" },
  { code: "editor", description: "Can manage automata and tenant variables" },
  { code: "viewer", description: "Read only" },
]

const permissionSeeds = [
  ["automata:read", "Read automata"],
  ["automata:create", "Create automata"],
  ["automata:update", "Update automata"],
  ["automata:delete", "Delete automata"],
  ["tenant-variable:read", "Read tenant variables"],
  ["tenant-variable:create", "Create tenant variables"],
  ["tenant-variable:update", "Update tenant variables"],
  ["tenant-variable:delete", "Delete tenant variables"],
] as const

const CORE_TENANT_ID = "11111111-1111-1111-1111-111111111111"
const CORE_TENANT_NAME = "Core Team"

async function ensureRole(db: ReturnType<typeof dbFromClient>, code: string, description: string) {
  const existing = await db.query.roles.findFirst({ where: eq(roles.code, code) })
  if (existing) {
    return existing
  }
  const [created] = await db.insert(roles).values({ code, description }).returning()
  return created
}

async function ensurePermission(db: ReturnType<typeof dbFromClient>, code: string, description: string) {
  const existing = await db.query.permissions.findFirst({ where: eq(permissions.code, code) })
  if (existing) {
    return existing
  }
  const [created] = await db.insert(permissions).values({ code, description }).returning()
  return created
}

async function main() {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")
    const db = dbFromClient(client)

    const existingTenant = await db.query.tenants.findFirst({ where: eq(tenants.id, CORE_TENANT_ID) })
    const safeTenant =
      existingTenant ??
      (
        await db
          .insert(tenants)
          .values({
            id: CORE_TENANT_ID,
            name: CORE_TENANT_NAME,
          })
          .returning()
      )[0]

    if (!safeTenant) {
      throw new Error("Unable to create tenant seed")
    }

    const existingUser = await db.query.users.findFirst({ where: eq(users.email, "admin@automata.local") })
    const safeUser =
      existingUser ??
      (
        await db
          .insert(users)
          .values({
            email: "admin@automata.local",
            passwordHash: hashValue("admin12345"),
          })
          .returning()
      )[0]

    if (!safeUser) {
      throw new Error("Unable to create user seed")
    }

    const allRoles = []
    for (const roleSeed of roleSeeds) {
      allRoles.push(await ensureRole(db, roleSeed.code, roleSeed.description))
    }

    const allPermissions = []
    for (const [code, description] of permissionSeeds) {
      allPermissions.push(await ensurePermission(db, code, description))
    }

    const adminRole = allRoles.find((role) => role.code === "admin")
    if (!adminRole) {
      throw new Error("Missing admin role")
    }

    for (const permission of allPermissions) {
      const exists = await db.query.rolePermissions.findFirst({
        where: and(eq(rolePermissions.roleId, adminRole.id), eq(rolePermissions.permissionId, permission.id)),
      })
      if (!exists) {
        await db.insert(rolePermissions).values({
          roleId: adminRole.id,
          permissionId: permission.id,
        })
      }
    }

    const userTenantRoleExists = await db.query.userTenantRoles.findFirst({
      where: and(
        eq(userTenantRoles.userId, safeUser.id),
        eq(userTenantRoles.tenantId, safeTenant.id),
        eq(userTenantRoles.roleId, adminRole.id)
      ),
    })

    if (!userTenantRoleExists) {
      await db.insert(userTenantRoles).values({
        userId: safeUser.id,
        tenantId: safeTenant.id,
        roleId: adminRole.id,
      })
    }

    await client.query("COMMIT")
    console.log("[seed] done")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

main().catch((error) => {
  console.error("[seed] failed", error)
  process.exitCode = 1
})
