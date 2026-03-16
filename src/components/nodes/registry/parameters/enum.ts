import type { InputParameterDescriptor } from "@/components/nodes/registry/types"
import type { NodeData } from "@/types/graph"

import { createEnumParameter, createObjectParameter, createStringParameter, parseStringArray } from "./shared"

export function getEnumInputParameters(data: NodeData): InputParameterDescriptor[] {
  return [
    createStringParameter(
      "enum-name",
      "data:enumName",
      "Enum Name",
      "enum.enumName",
      (item) => item.enum.enumName,
      (item, value) => ({
        ...item,
        enum: {
          ...item.enum,
          enumName: value,
        },
      }),
      false
    ),
    createObjectParameter(
      "enum-values",
      "data:enumValues",
      "Values",
      "enum.values",
      (item) => JSON.stringify(item.enum.values, null, 2),
      (item, value) => {
        const values = parseStringArray(value)
        if (!values) {
          return item
        }

        const selectedValue = values.includes(item.enum.selectedValue)
          ? item.enum.selectedValue
          : (values[0] ?? "")

        return {
          ...item,
          enum: {
            ...item.enum,
            values,
            selectedValue,
          },
        }
      },
      false
    ),
    createEnumParameter(
      "enum-selected",
      "data:selectedValue",
      "Selected",
      "enum.selectedValue",
      (item) => item.enum.selectedValue,
      (item, value) => ({
        ...item,
        enum: {
          ...item.enum,
          selectedValue: value,
        },
      }),
      () => (data.enum.values.length > 0 ? data.enum.values : [""])
    ),
  ]
}