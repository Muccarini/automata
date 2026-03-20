import type { PoolClient } from "pg"

import type { JwtClaims } from "@automata/shared-contracts"

import { pool } from "@/db/client"

//TODO change this name, conetxt or something
export async function withTenantSession<T>(claims: JwtClaims, callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [claims.tenantId])
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)])
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}
