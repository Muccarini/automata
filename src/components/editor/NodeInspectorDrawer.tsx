import { useMemo } from "react"

import { NodeInputParametersSection } from "@/components/editor/inspector/NodeInputParametersSection"
import { getNodeDefinition, getNodeInputParameters } from "@/components/nodes/registry/nodeRegistry"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useMapperStore } from "@/store/mapperStore"

export function NodeInspectorDrawer() {
  const selectedNodeId = useMapperStore((state) => state.selectedNodeId)
  const nodes = useMapperStore((state) => state.nodes)
  const selectNode = useMapperStore((state) => state.selectNode)
  const updateNodeData = useMapperStore((state) => state.updateNodeData)
  const setNodeOutputSchema = useMapperStore((state) => state.setNodeOutputSchema)
  const setMapperRules = useMapperStore((state) => state.setMapperRules)
  const detectHttpSchema = useMapperStore((state) => state.detectHttpSchema)
  const getUpstreamSchemaFor = useMapperStore((state) => state.getUpstreamSchemaFor)

  const node = useMemo(() => nodes.find((item) => item.id === selectedNodeId), [nodes, selectedNodeId])

  const upstreamSchema = useMemo(() => {
    if (!node) {
      return []
    }

    return getUpstreamSchemaFor(node.id)
  }, [getUpstreamSchemaFor, node])

  const inputParameters = useMemo(() => {
    if (!node) {
      return []
    }

    return getNodeInputParameters(node.data)
  }, [node])

  const definition = useMemo(() => {
    if (!node) {
      return null
    }

    return getNodeDefinition(node.data.nodeType)
  }, [node])

  return (
    <Sheet
      open={Boolean(node)}
      onOpenChange={(open) => {
        if (!open) {
          selectNode(null)
        }
      }}
    >
      <SheetContent
        side="right"
        className="data-[side=right]:w-[94vw] data-[side=right]:max-w-[94vw] md:data-[side=right]:w-[44vw] md:data-[side=right]:max-w-[760px]"
      >
        {node ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <SheetTitle>{node.data.label}</SheetTitle>
                <Badge variant="secondary">{node.data.nodeType}</Badge>
              </div>
              <SheetDescription>{node.data.description}</SheetDescription>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-90px)] px-4 pb-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={node.data.label}
                    onChange={(event) => updateNodeData(node.id, { label: event.target.value })}
                  />
                </div>

                {!definition?.disableDefaultInputParameters ? (
                  <NodeInputParametersSection
                    nodeId={node.id}
                    nodeData={node.data}
                    parameters={inputParameters}
                    updateNodeData={updateNodeData}
                  />
                ) : null}

                {definition?.renderInspectorOverride
                  ? definition.renderInspectorOverride({
                      nodeId: node.id,
                      data: node.data,
                      upstreamSchema,
                      updateNodeData,
                      setNodeOutputSchema,
                      setMapperRules,
                      detectHttpSchema,
                    })
                  : null}
              </div>
            </ScrollArea>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
