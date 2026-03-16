import { VisualMapper } from "@/components/mapper/VisualMapper"
import type { InspectorOverrideContext } from "@/components/nodes/registry/types"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { inferSchemaFromJson } from "@/lib/schema/inferSchema"

export function renderMapperInspectorOverride({
  nodeId,
  data,
  upstreamSchema,
  updateNodeData,
  setMapperRules,
  setNodeOutputSchema,
}: InspectorOverrideContext) {
  return (
    <>
      <VisualMapper
        inputSchema={upstreamSchema}
        targetSchemaText={data.mapper.targetSchemaText}
        mappings={data.mapper.mappings}
        onMappingsChange={(mappings) => setMapperRules(nodeId, mappings)}
      />
      <div className="space-y-2">
        <Label>Target Output Schema (JSON)</Label>
        <Textarea
          className="min-h-48 font-mono text-xs"
          value={data.mapper.targetSchemaText}
          onChange={(event) => {
            const value = event.target.value

            updateNodeData(nodeId, {
              mapper: {
                ...data.mapper,
                targetSchemaText: value,
              },
            })

            try {
              const parsed = JSON.parse(value) as unknown
              setNodeOutputSchema(nodeId, inferSchemaFromJson(parsed))
            } catch {
              // Skip schema update while JSON is incomplete during typing.
            }
          }}
        />
      </div>
    </>
  )
}
