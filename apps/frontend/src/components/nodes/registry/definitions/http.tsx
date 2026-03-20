import { GlobeIcon } from "lucide-react"

import { getNodeInputParameters } from "@/components/nodes/registry/parameters"
import type { NodeDefinition } from "@/components/nodes/registry/types"

import { renderHttpInspectorOverride } from "./httpInspectorOverride"
import { outputPin, toDataPin } from "./shared"

export const httpNodeDefinition: NodeDefinition<"http"> = {
  kind: "http",
  disableDefaultInputParameters: true,
  renderInspectorOverride: renderHttpInspectorOverride,
  metadata: (data) => ({
    title: data.label,
    description: data.description,
    category: "HTTP",
    accentClassName: "text-sky-400",
    icon: GlobeIcon,
  }),
  pins: (data) => [
    {
      id: "flow:in",
      kind: "flow",
      direction: "input",
      side: "top-left",
      label: "Exec",
    },
    {
      id: "flow:out",
      kind: "flow",
      direction: "output",
      side: "top-right",
      label: "Then",
    },
    ...getNodeInputParameters(data).map(toDataPin),
    outputPin("data:response", "Response"),
  ],
  renderBody: ({ data }) => {
    const args = data.args

    return (
      <div className="min-w-0">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">{args.method}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{data.result.statusCode ?? "n/a"}</span>
        </div>
        <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground" title={args.url || "No URL configured"}>
          {args.url || "No URL configured"}
        </p>
      </div>
    )
  },
  onEnter: ({ data, setResult, log }) => {
    log("onEnter", { method: data.args.method, url: data.args.url })
    setResult({
      statusCode: null,
      responseJson: null,
      responseText: "",
      responseHeaders: [],
      outputSample: undefined,
      error: undefined,
    })
  },
  onUpdate: async ({ data, setResult, log }) => {
    const headers = new Headers()

    for (const header of data.args.headers) {
      const key = header.key.trim()
      if (!key) {
        continue
      }

      headers.set(key, header.value)
    }

    if (data.args.authType === "bearer" && data.args.bearerToken.trim()) {
      headers.set("Authorization", `Bearer ${data.args.bearerToken.trim()}`)
    }

    if (data.args.authType === "basic") {
      headers.set(
        "Authorization",
        `Basic ${btoa(`${data.args.basicUsername}:${data.args.basicPassword}`)}`
      )
    }

    try {
      const response = await fetch(data.args.url, {
        method: data.args.method,
        headers,
      })

      const responseText = await response.text()
      let responseJson: unknown | null = null
      let outputSample: unknown = responseText
      const responseHeaders = Array.from(response.headers.entries()).map(([key, value]) => ({ key, value }))

      if (responseText.trim()) {
        try {
          const parsed = JSON.parse(responseText) as unknown
          responseJson = parsed
          outputSample = Array.isArray(parsed) ? (parsed[0] ?? parsed) : parsed
        } catch {
          responseJson = null
        }
      }

      const error = response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`.trim()

      setResult({
        statusCode: response.status,
        responseJson,
        responseText,
        responseHeaders,
        outputSample,
        error,
      })

      log("onUpdate", { statusCode: response.status, hasError: Boolean(error) })
      return outputSample
    } catch (error) {
      const message = error instanceof Error ? error.message : "HTTP request failed"
      setResult({
        statusCode: null,
        responseJson: null,
        responseText: "",
        responseHeaders: [],
        outputSample: undefined,
        error: message,
      })
      log("onUpdate", { statusCode: null, hasError: true, error: message })
      return null
    }
  },
  onExit: ({ next, log }) => {
    log("onExit")
    next()
  },
}
