import type { JsonValueKind } from "@/types/graph"

export function inferJsonValueKind(value: unknown): JsonValueKind {
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
    case "bigint":
      return "unknown"
    case "boolean":
      return "boolean"
    case "symbol":
      return "unknown"
    case "undefined":
      return "unknown"
    case "object":
      return "object"
    case "function":
      return "unknown"
  }

  return "unknown"
}
