import type { HttpArgs } from "@/types/graph"

export type DetectHttpSchemaResult =
  | {
      ok: true
      statusCode: number
      responseJson: unknown | null
      responseText: string
      responseHeaders: Array<{ key: string; value: string }>
      outputSample: unknown
      topLevelCount: number
    }
  | { ok: false; error: string }

export async function detectHttpSchema(config: HttpArgs): Promise<DetectHttpSchemaResult> {
  const url = config.url.trim() || "https://jsonplaceholder.typicode.com/todos/1"

  try {
    const headers = new Headers()

    for (const header of config.headers) {
      const key = header.key.trim()
      if (!key) continue
      headers.set(key, header.value)
    }

    if (config.authType === "bearer" && config.bearerToken.trim()) {
      headers.set("Authorization", `Bearer ${config.bearerToken.trim()}`)
    }

    if (config.authType === "basic") {
      headers.set("Authorization", `Basic ${btoa(`${config.basicUsername}:${config.basicPassword}`)}`)
    }

    const response = await fetch(url, { method: config.method, headers })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`.trim())
    }
    const responseText = await response.text()
    const responseHeaders = Array.from(response.headers.entries()).map(([key, value]) => ({ key, value }))

    let responseJson: unknown | null = null
    let outputSample: unknown = responseText
    let topLevelCount = 0

    if (responseText.trim()) {
      try {
        const parsed = JSON.parse(responseText) as unknown
        responseJson = parsed
        outputSample = Array.isArray(parsed) ? (parsed[0] ?? parsed) : parsed

        if (outputSample && typeof outputSample === "object" && !Array.isArray(outputSample)) {
          topLevelCount = Object.keys(outputSample as Record<string, unknown>).length
        }
      } catch {
        responseJson = null
      }
    }

    return {
      ok: true,
      statusCode: response.status,
      responseJson,
      responseText,
      responseHeaders,
      outputSample,
      topLevelCount,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sample detect error"
    return { ok: false, error: message }
  }
}
