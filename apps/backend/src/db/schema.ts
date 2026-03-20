import { relations, sql } from "drizzle-orm"
import { boolean, index, jsonb, pgTable, primaryKey, text, timestamp, uuid, varchar, uniqueIndex } from "drizzle-orm/pg-core"

const now = () => sql`now()`

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
})

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
})

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 80 }).notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
})

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 120 }).notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
})

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })]
)

export const userTenantRoles = pgTable(
  "user_tenant_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  },
  (table) => [primaryKey({ columns: [table.userId, table.tenantId, table.roleId] })]
)

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
})

export const automata = pgTable("automata", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  graph: jsonb("graph").notNull(),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
}, (table) => [index("automata_tenant_id_idx").on(table.tenantId)])

export const tenantGlobalVariables = pgTable("tenant_global_variables", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 120 }).notNull(),
  value: text("value").notNull().default(""),
  valueType: varchar("value_type", { length: 20 }).notNull(),
  enumOptions: jsonb("enum_options").notNull().$type<string[]>().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(now()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(now()),
}, (table) => [
  index("tenant_global_variables_tenant_id_idx").on(table.tenantId),
  uniqueIndex("tenant_global_variables_tenant_key_idx").on(table.tenantId, table.key),
])

export const userRelations = relations(users, ({ many }) => ({
  tenantRoles: many(userTenantRoles),
  refreshTokens: many(refreshTokens),
}))
