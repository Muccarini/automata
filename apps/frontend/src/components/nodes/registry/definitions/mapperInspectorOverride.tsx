import { VisualMapper } from "@/components/mapper/VisualMapper"
import type { InspectorOverrideContext } from "@/components/nodes/registry/types"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function renderMapperInspectorOverride({
  data,
  upstreamSample,
  update,
}: InspectorOverrideContext<"mapper">) {
  return (
    <>
      <VisualMapper
        inputSample={upstreamSample}
        returnJsonText={data.args.returnJsonText}
        mappings={data.args.mappings}
        onMappingsChange={(mappings) => update({ args: { ...data.args, mappings } })}
      />
      <div className="space-y-2">
        <Label>Target Output JSON</Label>
        <Textarea
          className="min-h-48 font-mono text-xs"
          value={data.args.returnJsonText}
          onChange={(event) => {
            const value = event.target.value

            update({
              args: {
                ...data.args,
                returnJsonText: value,
              },
            })

            try {
              const parsed = JSON.parse(value) as unknown
              update({
                result: {
                  ...data.result,
                  mappedJson:
                    parsed && typeof parsed === "object" && !Array.isArray(parsed)
                      ? (parsed as Record<string, unknown>)
                      : null,
                  outputSample: parsed,
                  error: undefined,
                },
              })
            } catch {
              // Skip output sample update while JSON is incomplete during typing.
            }
          }}
        />
      </div>
    </>
  )
}
