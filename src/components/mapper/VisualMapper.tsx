import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MappingRule, SchemaField, SchemaType } from "@/types/graph"

type FlatField = {
  path: string
  type: SchemaType
}

type VisualMapperProps = {
  inputSchema: SchemaField[]
  targetSchemaText: string
  mappings: MappingRule[]
  onMappingsChange: (mappings: MappingRule[]) => void
}

function isLeaf(field: SchemaField) {
  return !field.children || field.children.length === 0 || (field.type !== "object" && field.type !== "array")
}

function flattenInputSchema(fields: SchemaField[]): FlatField[] {
  const result: FlatField[] = []

  const walk = (items: SchemaField[]) => {
    for (const item of items) {
      if (isLeaf(item)) {
        result.push({ path: item.path, type: item.type })
        continue
      }

      if (item.children) {
        walk(item.children)
      }
    }
  }

  walk(fields)
  return result
}

function toSchemaType(value: unknown): SchemaType {
  if (value === null) {
    return "null"
  }

  if (Array.isArray(value)) {
    return "array"
  }

  switch (typeof value) {
    case "string":
      return "string"
    case "number":
      return "number"
    case "boolean":
      return "boolean"
    case "object":
      return "object"
    default:
      return "unknown"
  }
}

function flattenTargetJson(value: unknown, prefix = ""): FlatField[] {
  const type = toSchemaType(value)

  if (type === "object" && value && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>)
    return entries.flatMap(([key, child]) => {
      const nextPath = prefix ? `${prefix}.${key}` : key
      return flattenTargetJson(child, nextPath)
    })
  }

  if (type === "array") {
    const arr = value as unknown[]
    const sample = arr[0]
    const path = `${prefix}[]`
    if (sample === undefined) {
      return [{ path, type }]
    }
    return flattenTargetJson(sample, path)
  }

  return [{ path: prefix || "value", type }]
}

function parseTargetFields(targetSchemaText: string): { fields: FlatField[]; error: string } {
  try {
    const parsed = JSON.parse(targetSchemaText) as unknown
    const fields = flattenTargetJson(parsed)
    return { fields, error: "" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid target schema JSON"
    return { fields: [], error: message }
  }
}

function uid() {
  return `map_${crypto.randomUUID()}`
}

const ROW_HEIGHT = 34

export function VisualMapper({ inputSchema, targetSchemaText, mappings, onMappingsChange }: VisualMapperProps) {
  const [selectedInput, setSelectedInput] = useState<string | null>(null)

  const inputFields = useMemo(() => flattenInputSchema(inputSchema), [inputSchema])
  const targetResult = useMemo(() => parseTargetFields(targetSchemaText), [targetSchemaText])

  const inputIndex = useMemo(() => {
    return new Map(inputFields.map((field, index) => [field.path, index]))
  }, [inputFields])

  const targetIndex = useMemo(() => {
    return new Map(targetResult.fields.map((field, index) => [field.path, index]))
  }, [targetResult.fields])

  const totalRows = Math.max(inputFields.length, targetResult.fields.length, 1)
  const canvasHeight = totalRows * ROW_HEIGHT

  const lines = useMemo(() => {
    return mappings
      .map((rule) => {
        const from = inputIndex.get(rule.inputPath)
        const to = targetIndex.get(rule.outputPath)

        if (from === undefined || to === undefined) {
          return null
        }

        return {
          id: rule.id,
          x1: 28,
          y1: from * ROW_HEIGHT + ROW_HEIGHT / 2,
          x2: 72,
          y2: to * ROW_HEIGHT + ROW_HEIGHT / 2,
        }
      })
      .filter((line): line is NonNullable<typeof line> => Boolean(line))
  }, [inputIndex, mappings, targetIndex])

  const connectToTarget = (targetPath: string) => {
    if (!selectedInput) {
      return
    }

    const next = [
      ...mappings.filter((item) => item.outputPath !== targetPath),
      {
        id: uid(),
        inputPath: selectedInput,
        outputPath: targetPath,
      },
    ]

    onMappingsChange(next)
    setSelectedInput(null)
  }

  const removeMapping = (mappingId: string) => {
    onMappingsChange(mappings.filter((item) => item.id !== mappingId))
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-background/60 p-2">
        <p className="mb-2 text-xs text-muted-foreground">
          Click an input field, then click a target field to draw a mapping line.
        </p>

        <div className="relative overflow-x-auto" style={{ height: canvasHeight }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {lines.map((line) => (
              <g key={line.id}>
                <path
                  d={`M ${line.x1}% ${line.y1} C 44% ${line.y1}, 56% ${line.y2}, ${line.x2}% ${line.y2}`}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeOpacity="0.85"
                />
              </g>
            ))}
          </svg>

          <div className="absolute inset-0 grid grid-cols-2 gap-4 px-1">
            <div>
              {inputFields.map((field) => (
                <button
                  key={field.path}
                  type="button"
                  className={cn(
                    "mb-1 flex h-8 w-full items-center justify-between rounded border px-2 text-left font-mono text-[11px]",
                    selectedInput === field.path
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-card/50 hover:bg-muted/60"
                  )}
                  onClick={() => setSelectedInput(field.path)}
                >
                  <span className="truncate">{field.path}</span>
                  <span className="ml-2 text-muted-foreground">{field.type}</span>
                </button>
              ))}
            </div>

            <div>
              {targetResult.fields.map((field) => (
                <button
                  key={field.path}
                  type="button"
                  className="mb-1 flex h-8 w-full items-center justify-between rounded border border-border bg-card/50 px-2 text-left font-mono text-[11px] hover:bg-muted/60"
                  onClick={() => connectToTarget(field.path)}
                >
                  <span className="truncate">{field.path}</span>
                  <span className="ml-2 text-muted-foreground">{field.type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {targetResult.error ? (
        <p className="font-mono text-[11px] text-destructive">Invalid target schema JSON: {targetResult.error}</p>
      ) : null}

      <div className="space-y-2 rounded-md border border-border p-2">
        <p className="text-xs text-muted-foreground">Active mappings</p>
        {mappings.length > 0 ? (
          mappings.map((mapping) => (
            <div key={mapping.id} className="flex items-center gap-2">
              <p className="flex-1 truncate font-mono text-[11px] text-muted-foreground">
                {mapping.inputPath} {">"} {mapping.outputPath}
              </p>
              <Button size="sm" variant="ghost" onClick={() => removeMapping(mapping.id)}>
                Remove
              </Button>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No mappings yet.</p>
        )}
      </div>
    </div>
  )
}
