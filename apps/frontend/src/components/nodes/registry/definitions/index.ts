import type { NodeKind } from "@/types/graph"

import type { NodeDefinition } from "@/components/nodes/registry/types"

import { httpNodeDefinition } from "./http"
import { logicNodeDefinition } from "./logic"
import { mapperNodeDefinition } from "./mapper"
import { triggerNodeDefinition } from "./trigger"
import { variableNodeDefinition } from "./variable"

type NodeDefinitionRegistry = {
  [T in NodeKind]: NodeDefinition<T>
}

const registry: NodeDefinitionRegistry = {
  trigger: triggerNodeDefinition,
  http: httpNodeDefinition,
  mapper: mapperNodeDefinition,
  logic: logicNodeDefinition,
  variable: variableNodeDefinition,
}

export function getNodeDefinition<T extends NodeKind>(kind: T): NodeDefinition<T> {
  return registry[kind]
}