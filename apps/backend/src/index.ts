import { app } from "@/api/app"
import { env } from "@/config/env"

app.listen(env.port, () => {
  console.log(`[backend] listening on :${env.port}`)
})
