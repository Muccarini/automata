import { useMemo } from "react"
import { Trash2Icon } from "lucide-react"

import { NodeInputParametersSection } from "@/components/editor/inspector/NodeInputParametersSection"
import { getNodeDefinition, getNodeInputParameters } from "@/components/nodes/registry/nodeRegistry"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useMapperStore } from "@/store/mapperStore"

export function NodeInspectorDrawer() {
  const selectedNodeId = useMapperStore((state) => state.selectedNodeId)
  const nodes = useMapperStore((state) => state.nodes)
  const selectNode = useMapperStore((state) => state.selectNode)
  const requestNodeRemoval = useMapperStore((state) => state.requestNodeRemoval)
  const updateNodeData = useMapperStore((state) => state.updateNodeData)
  const getUpstreamSampleFor = useMapperStore((state) => state.getUpstreamSampleFor)

  const node = useMemo(() => nodes.find((item) => item.id === selectedNodeId), [nodes, selectedNodeId])

  const upstreamSample = useMemo(() => {
    if (!node) {
      return null
    }

    return getUpstreamSampleFor(node.id)
  }, [getUpstreamSampleFor, node])

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
                      data: node.data,
                      upstreamSample,
                      update: (patch) => updateNodeData(node.id, patch),
                    })
                  : null}

                <div className="flex justify-end pt-2">
                  <Button variant="destructive" size="sm" onClick={() => requestNodeRemoval(node.id)}>
                    <Trash2Icon />
                    Elimina nodo
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
