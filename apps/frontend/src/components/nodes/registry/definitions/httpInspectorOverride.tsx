import { toast } from "sonner"

import { detectHttpSchema } from "@/lib/http/detectHttpSchema"
import type { InspectorOverrideContext } from "@/components/nodes/registry/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function renderHttpInspectorOverride({ data, update }: InspectorOverrideContext<"http">) {
  const samplePreview =
    data.result.outputSample === undefined
      ? "No sample detected yet"
      : JSON.stringify(data.result.outputSample, null, 2)

  const handleDetectClick = () => {
    void detectHttpSchema(data.args).then((result) => {
      if (result.ok) {
        update({
          result: {
            ...data.result,
            statusCode: result.statusCode,
            responseJson: result.responseJson,
            responseText: result.responseText,
            responseHeaders: result.responseHeaders,
            outputSample: result.outputSample,
            error: undefined,
          },
        })
        const label = result.topLevelCount === 1 ? "key" : "keys"
        toast.success(`Sample detected: ${result.topLevelCount} top-level ${label}`)
        return
      }

      update({
        result: {
          ...data.result,
          error: result.error,
        },
      })
      toast.error("Sample detect failed", {
        description: result.error || "Unknown sample detect error",
      })
    })
  }

  return (
    <>
      <div className="space-y-2">
        <Label>HTTP Method</Label>
        <Select
          value={data.args.method}
          onValueChange={(value) =>
            update({
              args: {
                ...data.args,
                method: value as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
              },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>URL</Label>
        <Input
          className="font-mono text-xs"
          value={data.args.url}
          onChange={(event) =>
            update({
              args: {
                ...data.args,
                url: event.target.value,
              },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Headers</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              update({
                args: {
                  ...data.args,
                  headers: [...data.args.headers, { key: "", value: "" }],
                },
              })
            }
          >
            Add Header
          </Button>
        </div>
        <div className="space-y-2">
          {data.args.headers.length > 0 ? (
            data.args.headers.map((header, index) => (
              <div key={`header-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  className="font-mono text-xs"
                  placeholder="Header"
                  value={header.key}
                  onChange={(event) => {
                    const headers = [...data.args.headers]
                    headers[index] = { ...header, key: event.target.value }
                    update({
                      args: {
                        ...data.args,
                        headers,
                      },
                    })
                  }}
                />
                <Input
                  className="font-mono text-xs"
                  placeholder="Value"
                  value={header.value}
                  onChange={(event) => {
                    const headers = [...data.args.headers]
                    headers[index] = { ...header, value: event.target.value }
                    update({
                      args: {
                        ...data.args,
                        headers,
                      },
                    })
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const headers = data.args.headers.filter((_, itemIndex) => itemIndex !== index)
                    update({
                      args: {
                        ...data.args,
                        headers,
                      },
                    })
                  }}
                >
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No headers configured.</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Auth</Label>
        <Select
          value={data.args.authType}
          onValueChange={(value) =>
            update({
              args: {
                ...data.args,
                authType: value as "none" | "bearer" | "basic",
              },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="bearer">Bearer</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
          </SelectContent>
        </Select>

        {data.args.authType === "bearer" ? (
          <Input
            className="font-mono text-xs"
            placeholder="Bearer token"
            value={data.args.bearerToken}
            onChange={(event) =>
              update({
                args: {
                  ...data.args,
                  bearerToken: event.target.value,
                },
              })
            }
          />
        ) : null}

        {data.args.authType === "basic" ? (
          <div className="grid grid-cols-2 gap-2">
            <Input
              className="font-mono text-xs"
              placeholder="Username"
              value={data.args.basicUsername}
              onChange={(event) =>
                update({
                  args: {
                    ...data.args,
                    basicUsername: event.target.value,
                  },
                })
              }
            />
            <Input
              className="font-mono text-xs"
              placeholder="Password"
              value={data.args.basicPassword}
              onChange={(event) =>
                update({
                  args: {
                    ...data.args,
                    basicPassword: event.target.value,
                  },
                })
              }
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Button className="w-full" variant="secondary" onClick={handleDetectClick}>
          Auto-Detect Sample
        </Button>
        <p className="font-mono text-[11px] text-muted-foreground">Status: {data.result.statusCode ?? "n/a"}</p>
        {data.result.error ? (
          <p className="font-mono text-[11px] text-destructive">{data.result.error}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Detected Sample</Label>
          <span className="font-mono text-[11px] text-muted-foreground">{data.result.responseHeaders.length} headers</span>
        </div>
        <pre className="max-h-48 overflow-auto rounded-md border border-border bg-muted/30 p-2 font-mono text-[11px] text-muted-foreground">
          {samplePreview}
        </pre>
      </div>
    </>
  )
}
