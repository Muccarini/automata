import type { NodeKind } from "@/types/graph"

import type { INodeDefinition } from "@/components/nodes/registry/types"

import { enumNodeDefinition } from "./enum"
import { httpNodeDefinition } from "./http"
import { logicNodeDefinition } from "./logic"
import { mapperNodeDefinition } from "./mapper"
import { triggerNodeDefinition } from "./trigger"

const registry: Record<NodeKind, INodeDefinition> = {
  trigger: triggerNodeDefinition,
  http: httpNodeDefinition,
  mapper: mapperNodeDefinition,
  logic: logicNodeDefinition,
  enum: enumNodeDefinition,
}

export function getNodeDefinition(kind: NodeKind) {
  return registry[kind]
}