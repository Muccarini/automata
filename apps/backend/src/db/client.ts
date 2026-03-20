import { drizzle } from "drizzle-orm/node-postgres"
import type { PoolClient } from "pg"
import { Pool } from "pg"

import { env } from "@/config/env"
import * as schema from "@/db/schema"

export const pool = new Pool({ connectionString: env.databaseUrl })
export const db = drizzle(pool, { schema })

export function dbFromClient(client: PoolClient) {
  return drizzle(client, { schema })
}
