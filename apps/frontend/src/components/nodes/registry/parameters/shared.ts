import type { InlineValue, NodeData } from "@/types/graph"
import { isRecord } from "@/lib/guards"

import type { InputParameterDescriptor } from "@/components/nodes/registry/types"

export function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) {
      return null
    }

    return parsed
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0)
  } catch {
    return null
  }
}

export function parseHeaders(value: string) {
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return null
    }

    return parsed.map((item) => {
      if (isRecord(item)) {
        return {
          key: String(item.key ?? ""),
          value: String(item.value ?? ""),
        }
      }

      return {
        key: "",
        value: "",
      }
    })
  } catch {
    return null
  }
}

function createParameter(
  descriptor: Omit<InputParameterDescriptor, "getInlineValue" | "setInlineValue">,
  getValue: (data: NodeData) => InlineValue,
  setValue: (data: NodeData, nextValue: InlineValue) => NodeData
): InputParameterDescriptor {
  return {
    ...descriptor,
    getInlineValue: getValue,
    setInlineValue: setValue,
  }
}

export function createStringParameter(
  id: string,
  pinId: string,
  label: string,
  dataPath: string,
  getValue: (data: NodeData) => string,
  setValue: (data: NodeData, value: string) => NodeData,
  supportsEdgeConnection = true
): InputParameterDescriptor {
  return createParameter(
    {
      id,
      pinId,
      label,
      valueType: "string",
      dataPath,
      supportsEdgeConnection,
    },
    (data) => ({
      valueType: "string",
      value: getValue(data),
    }),
    (data, nextValue) => {
      if (nextValue.valueType !== "string") {
        return data
      }

      return setValue(data, nextValue.value)
    }
  )
}

export function createObjectParameter(
  id: string,
  pinId: string,
  label: string,
  dataPath: string,
  getValue: (data: NodeData) => string,
  setValue: (data: NodeData, value: string) => NodeData,
  supportsEdgeConnection = true
): InputParameterDescriptor {
  return createParameter(
    {
      id,
      pinId,
      label,
      valueType: "object",
      dataPath,
      supportsEdgeConnection,
    },
    (data) => ({
      valueType: "object",
      value: getValue(data),
    }),
    (data, nextValue) => {
      if (nextValue.valueType !== "object") {
        return data
      }

      return setValue(data, nextValue.value)
    }
  )
}

export function createEnumParameter(
  id: string,
  pinId: string,
  label: string,
  dataPath: string,
  getValue: (data: NodeData) => string,
  setValue: (data: NodeData, value: string) => NodeData,
  getOptions: (data: NodeData) => string[],
  supportsEdgeConnection = true
): InputParameterDescriptor {
  return createParameter(
    {
      id,
      pinId,
      label,
      valueType: "enum",
      dataPath,
      supportsEdgeConnection,
    },
    (data) => ({
      valueType: "enum",
      value: getValue(data),
      options: getOptions(data),
    }),
    (data, nextValue) => {
      if (nextValue.valueType !== "enum") {
        return data
      }

      return setValue(data, nextValue.value)
    }
  )
}