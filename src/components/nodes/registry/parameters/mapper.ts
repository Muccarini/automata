import type { InputParameterDescriptor } from "@/components/nodes/registry/types"

import { createObjectParameter } from "./shared"

export function getMapperInputParameters(): InputParameterDescriptor[] {
  return [
    createObjectParameter(
      "mapper-target-schema",
      "data:targetSchema",
      "Target JSON",
      "mapper.targetSchemaText",
      (data) => data.mapper.targetSchemaText,
      (data, value) => ({
        ...data,
        mapper: {
          ...data.mapper,
          targetSchemaText: value,
        },
      })
    ),
  ]
}