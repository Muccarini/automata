import { Elysia } from "elysia"

import { authRoutes } from "@/api/routes/auth"
import { automataRoutes } from "@/api/routes/automata"
import { healthRoutes } from "@/api/routes/health"
import { tenantVariableRoutes } from "@/api/routes/tenantVariables"

export const app = new Elysia({ prefix: "/api" })
  .use(healthRoutes)
  .use(authRoutes)
  .use(automataRoutes)
  .use(tenantVariableRoutes)
