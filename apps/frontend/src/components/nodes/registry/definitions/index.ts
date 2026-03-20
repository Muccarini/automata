import type { NodeKind } from "@/types/graph"

import type { INodeDefinition } from "@/components/nodes/registry/types"

import { httpNodeDefinition } from "./http"
import { logicNodeDefinition } from "./logic"
import { mapperNodeDefinition } from "./mapper"
import { triggerNodeDefinition } from "./trigger"
import { variableNodeDefinition } from "./variable"

type NodeDefinitionRegistry = {
  [K in NodeKind]: INodeDefinition<K>
}

const registry: NodeDefinitionRegistry = {
  trigger: triggerNodeDefinition,
  http: httpNodeDefinition,
  mapper: mapperNodeDefinition,
  logic: logicNodeDefinition,
  variable: variableNodeDefinition,
}

export function getNodeDefinition<K extends NodeKind>(kind: K): INodeDefinition<K> {
  return registry[kind]
}