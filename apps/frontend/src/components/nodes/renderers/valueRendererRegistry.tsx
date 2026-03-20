import type { ReactNode } from "react"

import { EnumValueRenderer } from "@/components/nodes/renderers/EnumValueRenderer"
import { IntegerValueRenderer } from "@/components/nodes/renderers/IntegerValueRenderer"
import { ObjectJsonValueRenderer } from "@/components/nodes/renderers/ObjectJsonValueRenderer"
import { StringValueRenderer } from "@/components/nodes/renderers/StringValueRenderer"
import type { InlineValue, InlineValueType } from "@/types/graph"

type ValueRendererProps = {
  value: InlineValue
  onChange: (value: InlineValue) => void
}

export type ValueRenderer = {
  valueType: InlineValueType
  render: (props: ValueRendererProps) => ReactNode
}

function isStringValue(value: InlineValue): value is Extract<InlineValue, { valueType: "string" }> {
  return value.valueType === "string"
}

function isIntegerValue(value: InlineValue): value is Extract<InlineValue, { valueType: "integer" }> {
  return value.valueType === "integer"
}

function isBooleanValue(value: InlineValue): value is Extract<InlineValue, { valueType: "boolean" }> {
  return value.valueType === "boolean"
}

function isObjectValue(value: InlineValue): value is Extract<InlineValue, { valueType: "object" }> {
  return value.valueType === "object"
}

function isEnumValue(value: InlineValue): value is Extract<InlineValue, { valueType: "enum" }> {
  return value.valueType === "enum"
}

const registry: Record<InlineValueType, ValueRenderer> = {
  string: {
    valueType: "string",
    render: ({ value, onChange }) => {
      if (!isStringValue(value)) {
        return null
      }

      return (
        <StringValueRenderer
          value={value.value}
          onChange={(next) => onChange({ valueType: "string", value: next })}
        />
      )
    },
  },
  integer: {
    valueType: "integer",
    render: ({ value, onChange }) => {
      if (!isIntegerValue(value)) {
        return null
      }

      return (
        <IntegerValueRenderer
          value={value.value}
          onChange={(next) => onChange({ valueType: "integer", value: next })}
        />
      )
    },
  },
  boolean: {
    valueType: "boolean",
    render: ({ value, onChange }) => {
      if (!isBooleanValue(value)) {
        return null
      }

      return (
        <StringValueRenderer
          value={value.value ? "true" : "false"}
          onChange={(next) => onChange({ valueType: "boolean", value: next.trim().toLowerCase() === "true" })}
        />
      )
    },
  },
  object: {
    valueType: "object",
    render: ({ value, onChange }) => {
      if (!isObjectValue(value)) {
        return null
      }

      return (
        <ObjectJsonValueRenderer
          value={value.value}
          onChange={(next) => onChange({ valueType: "object", value: next })}
        />
      )
    },
  },
  enum: {
    valueType: "enum",
    render: ({ value, onChange }) => {
      if (!isEnumValue(value)) {
        return null
      }

      return (
        <EnumValueRenderer
          value={value.value}
          options={value.options}
          onChange={(next) => onChange({ valueType: "enum", value: next, options: value.options })}
        />
      )
    },
  },
}

export function getValueRenderer(valueType: InlineValueType) {
  return registry[valueType]
}