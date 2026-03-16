import type { InspectorOverrideContext } from "@/components/nodes/registry/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function renderHttpInspectorOverride({ nodeId, data, updateNodeData, detectHttpSchema }: InspectorOverrideContext) {
  return (
    <>
      <div className="space-y-2">
        <Label>HTTP Method</Label>
        <Select
          value={data.http.method}
          onValueChange={(value) =>
            updateNodeData(nodeId, {
              http: {
                ...data.http,
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
          value={data.http.url}
          onChange={(event) =>
            updateNodeData(nodeId, {
              http: {
                ...data.http,
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
              updateNodeData(nodeId, {
                http: {
                  ...data.http,
                  headers: [...data.http.headers, { key: "", value: "" }],
                },
              })
            }
          >
            Add Header
          </Button>
        </div>
        <div className="space-y-2">
          {data.http.headers.length > 0 ? (
            data.http.headers.map((header, index) => (
              <div key={`header-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  className="font-mono text-xs"
                  placeholder="Header"
                  value={header.key}
                  onChange={(event) => {
                    const headers = [...data.http.headers]
                    headers[index] = { ...header, key: event.target.value }
                    updateNodeData(nodeId, {
                      http: {
                        ...data.http,
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
                    const headers = [...data.http.headers]
                    headers[index] = { ...header, value: event.target.value }
                    updateNodeData(nodeId, {
                      http: {
                        ...data.http,
                        headers,
                      },
                    })
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const headers = data.http.headers.filter((_, itemIndex) => itemIndex !== index)
                    updateNodeData(nodeId, {
                      http: {
                        ...data.http,
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
          value={data.http.authType}
          onValueChange={(value) =>
            updateNodeData(nodeId, {
              http: {
                ...data.http,
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

        {data.http.authType === "bearer" ? (
          <Input
            className="font-mono text-xs"
            placeholder="Bearer token"
            value={data.http.bearerToken}
            onChange={(event) =>
              updateNodeData(nodeId, {
                http: {
                  ...data.http,
                  bearerToken: event.target.value,
                },
              })
            }
          />
        ) : null}

        {data.http.authType === "basic" ? (
          <div className="grid grid-cols-2 gap-2">
            <Input
              className="font-mono text-xs"
              placeholder="Username"
              value={data.http.basicUsername}
              onChange={(event) =>
                updateNodeData(nodeId, {
                  http: {
                    ...data.http,
                    basicUsername: event.target.value,
                  },
                })
              }
            />
            <Input
              className="font-mono text-xs"
              placeholder="Password"
              value={data.http.basicPassword}
              onChange={(event) =>
                updateNodeData(nodeId, {
                  http: {
                    ...data.http,
                    basicPassword: event.target.value,
                  },
                })
              }
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Button className="w-full" variant="secondary" onClick={() => void detectHttpSchema(nodeId)}>
          Auto-Detect Schema
        </Button>
        <p className="font-mono text-[11px] text-muted-foreground">
          {data.http.autoDetectedAt
            ? `Last detect: ${new Date(data.http.autoDetectedAt).toLocaleTimeString()}`
            : "No schema detected yet"}
        </p>
        {data.http.autoDetectError ? (
          <p className="font-mono text-[11px] text-destructive">{data.http.autoDetectError}</p>
        ) : null}
      </div>
    </>
  )
}
