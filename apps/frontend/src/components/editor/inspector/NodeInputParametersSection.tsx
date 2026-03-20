import type { NodeData, NodeParameter } from "@/types/graph"

import { updateNodeDataByPin } from "@/components/nodes/registry/nodeRegistry"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type NodeInputParametersSectionProps = {
  nodeId: string
  nodeData: NodeData
  parameters: NodeParameter[]
  updateNodeData: (nodeId: string, update: Partial<NodeData>) => void
}

export function NodeInputParametersSection({ nodeId, nodeData, parameters, updateNodeData }: NodeInputParametersSectionProps) {
  if (parameters.length === 0) {
    return null
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Input Parameters</p>
      <div className="space-y-2">
        {parameters.map((parameter) => {
          const value = parameter.inlineValue

          if (value.valueType === "enum") {
            return (
              <div key={parameter.id} className="space-y-1.5">
                <Label>{parameter.label}</Label>
                <Select
                  value={value.value}
                  onValueChange={(nextValue) =>
                    updateNodeData(
                      nodeId,
                      updateNodeDataByPin(nodeData, parameter.pinId, {
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
                      nodeId,
                      updateNodeDataByPin(nodeData, parameter.pinId, {
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
                      nodeId,
                      updateNodeDataByPin(nodeData, parameter.pinId, {
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
                    nodeId,
                    updateNodeDataByPin(nodeData, parameter.pinId, {
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
  )
}
