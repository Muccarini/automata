import { sql } from "drizzle-orm"

import { db, pool } from "@/db/client"
import { rlsSql } from "@/db/rls.sql"

export async function applyRlsPolicies() {
  await db.execute(sql.raw(rlsSql))
}

if (import.meta.main) {
  applyRlsPolicies()
    .then(() => {
      console.log("[db] rls applied")
    })
    .catch((error) => {
      console.error("[db] rls failed", error)
      process.exitCode = 1
    })
    .finally(async () => {
      await pool.end()
    })
}
