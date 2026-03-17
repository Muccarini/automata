import type { PrimitiveVariableType, VariableScope } from "@/types/graph"

export const VARIABLE_REFERENCE_DRAG_TYPE = "application/x-automa-variable-reference"

export type VariableReferenceDragPayload = {
  scope: VariableScope
  key: string
  valueType: PrimitiveVariableType
}

export function hasVariableReferenceDragPayload(dataTransfer: DataTransfer | null) {
  if (!dataTransfer) {
    return false
  }

  return Array.from(dataTransfer.types).includes(VARIABLE_REFERENCE_DRAG_TYPE)
}

export function serializeVariableReferenceDragPayload(payload: VariableReferenceDragPayload) {
  return JSON.stringify(payload)
}

export function parseVariableReferenceDragPayload(raw: string): VariableReferenceDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<VariableReferenceDragPayload>
    if (!parsed || typeof parsed !== "object") {
      return null
    }

    if ((parsed.scope !== "automa" && parsed.scope !== "tenant") || typeof parsed.key !== "string") {
      return null
    }

    if (parsed.valueType !== "string" && parsed.valueType !== "integer" && parsed.valueType !== "boolean" && parsed.valueType !== "enum") {
      return null
    }

    return {
      scope: parsed.scope,
      key: parsed.key,
      valueType: parsed.valueType,
    }
  } catch {
    return null
  }
}
