import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VisualMapper } from "@/components/mapper/VisualMapper"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getNodeInputParameters, updateNodeDataByPin } from "@/components/nodes/registry/nodeRegistry"
import { inferSchemaFromJson } from "@/lib/schema/inferSchema"
import { useMapperStore } from "@/store/mapperStore"

const predicateOps = [
  { value: "eq", label: "==" },
  { value: "neq", label: "!=" },
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "contains", label: "contains" },
] as const

export function NodeInspectorDrawer() {
  const selectedNodeId = useMapperStore((state) => state.selectedNodeId)
  const nodes = useMapperStore((state) => state.nodes)
  const selectNode = useMapperStore((state) => state.selectNode)
  const updateNodeData = useMapperStore((state) => state.updateNodeData)
  const setNodeOutputSchema = useMapperStore((state) => state.setNodeOutputSchema)
  const setMapperRules = useMapperStore((state) => state.setMapperRules)
  const detectHttpSchema = useMapperStore((state) => state.detectHttpSchema)
  const getUpstreamSchemaFor = useMapperStore((state) => state.getUpstreamSchemaFor)

  const node = useMemo(() => nodes.find((item) => item.id === selectedNodeId), [nodes, selectedNodeId])
  const upstreamSchema = useMemo(() => {
    if (!node) {
      return []
    }

    return getUpstreamSchemaFor(node.id)
  }, [getUpstreamSchemaFor, node])

  const inputParameters = useMemo(() => {
    if (!node) {
      return []
    }

    return getNodeInputParameters(node.data)
  }, [node])

  return (
    <Drawer
      open={Boolean(node)}
      direction="right"
      modal
      onOpenChange={(open) => {
        if (!open) {
          selectNode(null)
        }
      }}
    >
      <DrawerContent className="w-[420px] max-w-[420px]">
        {node ? (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-2">
                <DrawerTitle>{node.data.label}</DrawerTitle>
                <Badge variant="secondary">{node.data.nodeType}</Badge>
              </div>
              <DrawerDescription>{node.data.description}</DrawerDescription>
            </DrawerHeader>

            <ScrollArea className="h-[calc(100vh-90px)] px-4 pb-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={node.data.label}
                    onChange={(event) => updateNodeData(node.id, { label: event.target.value })}
                  />
                </div>

                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Input Parameters</p>
                  <div className="space-y-2">
                    {inputParameters.map((parameter) => {
                      const value = parameter.inlineValue

                      if (value.valueType === "enum") {
                        return (
                          <div key={parameter.id} className="space-y-1.5">
                            <Label>{parameter.label}</Label>
                            <Select
                              value={value.value}
                              onValueChange={(nextValue) =>
                                updateNodeData(
                                  node.id,
                                  updateNodeDataByPin(node.data, parameter.pinId, {
                                    valueType: "enum",
                                    value: nextValue ?? "",
                                    options: value.options,
                                  })
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {value.options.map((option) => (
                                  <SelectItem key={option || "empty-option"} value={option}>
                                    {option || "(empty)"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      }

                      if (value.valueType === "object") {
                        return (
                          <div key={parameter.id} className="space-y-1.5">
                            <Label>{parameter.label}</Label>
                            <Textarea
                              className="min-h-24 font-mono text-xs"
                              value={value.value}
                              onChange={(event) =>
                                updateNodeData(
                                  node.id,
                                  updateNodeDataByPin(node.data, parameter.pinId, {
                                    valueType: "object",
                                    value: event.target.value,
                                  })
                                )
                              }
                            />
                          </div>
                        )
                      }

                      if (value.valueType === "integer") {
                        return (
                          <div key={parameter.id} className="space-y-1.5">
                            <Label>{parameter.label}</Label>
                            <Input
                              type="number"
                              className="font-mono text-xs"
                              value={String(value.value)}
                              onChange={(event) => {
                                const parsed = Number(event.target.value)
                                if (!Number.isFinite(parsed)) {
                                  return
                                }

                                updateNodeData(
                                  node.id,
                                  updateNodeDataByPin(node.data, parameter.pinId, {
                                    valueType: "integer",
                                    value: parsed,
                                  })
                                )
                              }}
                            />
                          </div>
                        )
                      }

                      return (
                        <div key={parameter.id} className="space-y-1.5">
                          <Label>{parameter.label}</Label>
                          <Input
                            className="font-mono text-xs"
                            value={String(value.value)}
                            onChange={(event) =>
                              updateNodeData(
                                node.id,
                                updateNodeDataByPin(node.data, parameter.pinId, {
                                  valueType: "string",
                                  value: event.target.value,
                                })
                              )
                            }
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {node.data.nodeType === "trigger" ? (
                  <div className="space-y-2">
                    <Label>Trigger Type</Label>
                    <Select
                      value={node.data.trigger.triggerType}
                      onValueChange={(value) =>
                        updateNodeData(node.id, {
                          trigger: {
                            ...node.data.trigger,
                            triggerType: value as "cron" | "webhook" | "manual",
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="cron">Cron</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                      </SelectContent>
                    </Select>

                    {node.data.trigger.triggerType === "cron" ? (
                      <>
                        <Label>Cron Interval</Label>
                        <Input
                          className="font-mono text-xs"
                          value={node.data.trigger.interval}
                          onChange={(event) =>
                            updateNodeData(node.id, {
                              trigger: {
                                ...node.data.trigger,
                                interval: event.target.value,
                              },
                            })
                          }
                        />
                      </>
                    ) : null}

                    {node.data.trigger.triggerType === "webhook" ? (
                      <>
                        <Label>Webhook Path</Label>
                        <Input
                          className="font-mono text-xs"
                          value={node.data.trigger.webhookPath}
                          onChange={(event) =>
                            updateNodeData(node.id, {
                              trigger: {
                                ...node.data.trigger,
                                webhookPath: event.target.value,
                              },
                            })
                          }
                        />
                        <p className="font-mono text-[11px] text-muted-foreground">
                          Mock URL: https://maas.local/{node.data.trigger.webhookPath}
                        </p>
                      </>
                    ) : null}
                  </div>
                ) : null}

                {node.data.nodeType === "http" ? (
                  <>
                    <div className="space-y-2">
                      <Label>HTTP Method</Label>
                      <Select
                        value={node.data.http.method}
                        onValueChange={(value) =>
                          updateNodeData(node.id, {
                            http: {
                              ...node.data.http,
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
                        value={node.data.http.url}
                        onChange={(event) =>
                          updateNodeData(node.id, {
                            http: {
                              ...node.data.http,
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
                            updateNodeData(node.id, {
                              http: {
                                ...node.data.http,
                                headers: [...node.data.http.headers, { key: "", value: "" }],
                              },
                            })
                          }
                        >
                          Add Header
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {node.data.http.headers.length > 0 ? (
                          node.data.http.headers.map((header, index) => (
                            <div key={`${index}-${header.key}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                              <Input
                                className="font-mono text-xs"
                                placeholder="Header"
                                value={header.key}
                                onChange={(event) => {
                                  const headers = [...node.data.http.headers]
                                  headers[index] = { ...header, key: event.target.value }
                                  updateNodeData(node.id, {
                                    http: {
                                      ...node.data.http,
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
                                  const headers = [...node.data.http.headers]
                                  headers[index] = { ...header, value: event.target.value }
                                  updateNodeData(node.id, {
                                    http: {
                                      ...node.data.http,
                                      headers,
                                    },
                                  })
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const headers = node.data.http.headers.filter((_, itemIndex) => itemIndex !== index)
                                  updateNodeData(node.id, {
                                    http: {
                                      ...node.data.http,
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
                        value={node.data.http.authType}
                        onValueChange={(value) =>
                          updateNodeData(node.id, {
                            http: {
                              ...node.data.http,
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

                      {node.data.http.authType === "bearer" ? (
                        <Input
                          className="font-mono text-xs"
                          placeholder="Bearer token"
                          value={node.data.http.bearerToken}
                          onChange={(event) =>
                            updateNodeData(node.id, {
                              http: {
                                ...node.data.http,
                                bearerToken: event.target.value,
                              },
                            })
                          }
                        />
                      ) : null}

                      {node.data.http.authType === "basic" ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            className="font-mono text-xs"
                            placeholder="Username"
                            value={node.data.http.basicUsername}
                            onChange={(event) =>
                              updateNodeData(node.id, {
                                http: {
                                  ...node.data.http,
                                  basicUsername: event.target.value,
                                },
                              })
                            }
                          />
                          <Input
                            className="font-mono text-xs"
                            placeholder="Password"
                            value={node.data.http.basicPassword}
                            onChange={(event) =>
                              updateNodeData(node.id, {
                                http: {
                                  ...node.data.http,
                                  basicPassword: event.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        variant="secondary"
                        onClick={() => void detectHttpSchema(node.id)}
                      >
                        Auto-Detect Schema
                      </Button>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {node.data.http.autoDetectedAt
                          ? `Last detect: ${new Date(node.data.http.autoDetectedAt).toLocaleTimeString()}`
                          : "No schema detected yet"}
                      </p>
                      {node.data.http.autoDetectError ? (
                        <p className="font-mono text-[11px] text-destructive">{node.data.http.autoDetectError}</p>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {node.data.nodeType === "mapper" ? (
                  <>
                    <VisualMapper
                      inputSchema={upstreamSchema}
                      targetSchemaText={node.data.mapper.targetSchemaText}
                      mappings={node.data.mapper.mappings}
                      onMappingsChange={(mappings) => setMapperRules(node.id, mappings)}
                    />
                    <div className="space-y-2">
                      <Label>Target Output Schema (JSON)</Label>
                      <Textarea
                        className="min-h-48 font-mono text-xs"
                        value={node.data.mapper.targetSchemaText}
                        onChange={(event) => {
                          const value = event.target.value

                          updateNodeData(node.id, {
                            mapper: {
                              ...node.data.mapper,
                              targetSchemaText: value,
                            },
                          })

                          try {
                            const parsed = JSON.parse(value) as unknown
                            setNodeOutputSchema(node.id, inferSchemaFromJson(parsed))
                          } catch {
                            // Skip schema update while JSON is incomplete during typing.
                          }
                        }}
                      />
                    </div>
                  </>
                ) : null}

                {node.data.nodeType === "logic" ? (
                  <>
                    <div className="space-y-2">
                      <Label>Left Path</Label>
                      <Input
                        className="font-mono text-xs"
                        value={node.data.logic.leftPath}
                        onChange={(event) =>
                          updateNodeData(node.id, {
                            logic: {
                              ...node.data.logic,
                              leftPath: event.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Operator</Label>
                      <Select
                        value={node.data.logic.operator}
                        onValueChange={(value) =>
                          updateNodeData(node.id, {
                            logic: {
                              ...node.data.logic,
                              operator: value as "eq" | "neq" | "gt" | "lt" | "contains",
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {predicateOps.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Right Value</Label>
                      <Input
                        className="font-mono text-xs"
                        value={node.data.logic.rightValue}
                        onChange={(event) =>
                          updateNodeData(node.id, {
                            logic: {
                              ...node.data.logic,
                              rightValue: event.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </>
                ) : null}

                {node.data.nodeType === "enum" ? (
                  <>
                    <div className="space-y-2">
                      <Label>Enum Name</Label>
                      <Input
                        className="font-mono text-xs"
                        value={node.data.enum.enumName}
                        onChange={(event) =>
                          updateNodeData(node.id, {
                            enum: {
                              ...node.data.enum,
                              enumName: event.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Values (JSON Array)</Label>
                      <Textarea
                        className="min-h-40 font-mono text-xs"
                        value={JSON.stringify(node.data.enum.values, null, 2)}
                        onChange={(event) => {
                          try {
                            const parsed = JSON.parse(event.target.value) as unknown
                            if (!Array.isArray(parsed)) {
                              return
                            }

                            const values = parsed
                              .map((item) => String(item).trim())
                              .filter((item) => item.length > 0)

                            updateNodeData(node.id, {
                              enum: {
                                ...node.data.enum,
                                values,
                                selectedValue: values.includes(node.data.enum.selectedValue)
                                  ? node.data.enum.selectedValue
                                  : (values[0] ?? ""),
                              },
                            })
                          } catch {
                            // Keep typing fluid while JSON is incomplete.
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Selected Value</Label>
                      <Select
                        value={node.data.enum.selectedValue}
                        onValueChange={(value) =>
                          updateNodeData(node.id, {
                            enum: {
                              ...node.data.enum,
                              selectedValue: value ?? "",
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {node.data.enum.values.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : null}
              </div>
            </ScrollArea>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
