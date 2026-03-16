import type { SchemaField, SchemaType } from "@/types/graph"

function scalarType(value: unknown): SchemaType {
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

function buildField(name: string, path: string, value: unknown): SchemaField {
  const type = scalarType(value)
  const id = path || name || "root"

  if (type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>)
    return {
      id,
      name,
      path,
      type,
      children: entries.map(([key, child]) => buildField(key, path ? `${path}.${key}` : key, child)),
    }
  }

  if (type === "array") {
    const first = (value as unknown[])[0]
    const child = buildField("item", `${path}[]`, first)
    return {
      id,
      name,
      path,
      type,
      children: first === undefined ? [] : [child],
    }
  }

  return {
    id,
    name,
    path,
    type,
  }
}

export function inferSchemaFromJson(payload: unknown): SchemaField[] {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return Object.entries(payload as Record<string, unknown>).map(([key, value]) => buildField(key, key, value))
  }

  if (Array.isArray(payload)) {
    return [buildField("root", "root", payload)]
  }

  return [buildField("value", "value", payload)]
}
