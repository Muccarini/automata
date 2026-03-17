import { useMemo, useState } from "react"
import { ChevronDownIcon, ChevronRightIcon, Trash2Icon } from "lucide-react"
import { Handle, Position, type NodeProps } from "reactflow"

import { InputPinField } from "@/components/nodes/pins/InputPinField"
import {
  getNodeDefinition,
  getNodePresentation,
  updateNodeDataByPin,
} from "@/components/nodes/registry/nodeRegistry"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import { useMapperStore } from "@/store/mapperStore"
import type { DataPin, FlowPin, NodeData } from "@/types/graph"

const FLOW_PIN_CENTER = 40
const FLOW_PIN_GAP = 16

const getFlowPinTop = (index: number, total: number) => {
  const centerOffset = index - (total - 1) / 2
  return FLOW_PIN_CENTER + centerOffset * FLOW_PIN_GAP
}

export function NodeRenderer({ id, data }: NodeProps<NodeData>) {
  const [collapsed, setCollapsed] = useState(true)
  const edges = useMapperStore((state) => state.edges)
  const updateNodeData = useMapperStore((state) => state.updateNodeData)
  const removePinConnections = useMapperStore((state) => state.removePinConnections)
  const requestNodeRemoval = useMapperStore((state) => state.requestNodeRemoval)

  const presentation = useMemo(() => getNodePresentation(data), [data])
  const definition = useMemo(() => getNodeDefinition(data.nodeType), [data.nodeType])

  const connectedPinIds = useMemo(() => {
    const ids = new Set<string>()

    for (const edge of edges) {
      if (edge.target === id && edge.targetHandle) {
        ids.add(edge.targetHandle)
      }
      if (edge.source === id && edge.sourceHandle) {
        ids.add(edge.sourceHandle)
      }
    }

    return ids
  }, [edges, id])

  const flowPins = presentation.pins.filter((pin): pin is FlowPin => pin.kind === "flow")
  const flowInputs = flowPins.filter((pin) => pin.direction === "input")
  const flowOutputs = flowPins.filter((pin) => pin.direction === "output")
  const dataInputs = presentation.pins.filter((pin): pin is DataPin => pin.kind === "data" && pin.direction === "input")
  const dataOutputs = presentation.pins.filter((pin): pin is DataPin => pin.kind === "data" && pin.direction === "output")
  const NodeIcon = presentation.metadata.icon
  const headerSummary = `${presentation.metadata.title} ${presentation.metadata.description}`

  const disconnectFromHandle = (event: React.MouseEvent, pinId: string) => {
    event.preventDefault()
    event.stopPropagation()
    removePinConnections(id, pinId)
  }

  return (
    <div className="relative w-[420px] max-w-[420px] overflow-visible rounded-lg border border-white/[0.09] bg-card p-3 shadow-[0_2px_16px_rgba(0,0,0,0.22)]">
      {flowInputs.map((pin, index) => (
        <Handle
          key={pin.id}
          id={pin.id}
          type="target"
          position={Position.Left}
          className="!left-[-8px] !h-3.5 !w-3.5 !border !border-background !bg-primary"
          style={{ top: getFlowPinTop(index, flowInputs.length) }}
          onContextMenu={(event) => disconnectFromHandle(event, pin.id)}
        />
      ))}

      {flowOutputs.map((pin, index) => (
        <Handle
          key={pin.id}
          id={pin.id}
          type="source"
          position={Position.Right}
          className="!right-[-8px] !h-3.5 !w-3.5 !border !border-background !bg-primary"
          style={{ top: getFlowPinTop(index, flowOutputs.length) }}
          onContextMenu={(event) => disconnectFromHandle(event, pin.id)}
        />
      ))}

      <ContextMenu>
        <ContextMenuTrigger>
          <div className="grid gap-3">
            <header className="min-w-0 rounded border border-white/[0.06] bg-black/15 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <NodeIcon className={cn("size-3.5 shrink-0", presentation.metadata.accentClassName)} />
                  <p className="truncate text-[12px] text-muted-foreground" title={headerSummary}>
                    <span className={cn("font-medium", presentation.metadata.accentClassName)}>{presentation.metadata.title}</span>{" "}
                    {presentation.metadata.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={collapsed ? "Espandi nodo" : "Comprimi nodo"}
                  className="mr-7 text-muted-foreground"
                  onClick={(event) => {
                    event.stopPropagation()
                    setCollapsed((prev) => !prev)
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  {collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
                </Button>
              </div>
            </header>

            {!collapsed ? (
              <section className="min-w-0 overflow-visible rounded border border-white/[0.06] bg-black/15 p-3">
                <div className="mb-3 min-w-0 rounded border border-white/[0.06] bg-background/40 px-2 py-1.5">
                  {definition.renderBody({ data })}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0 space-y-1.5">
                    {dataInputs.map((pin) => (
                      <InputPinField
                        key={pin.id}
                        pin={pin}
                        connected={connectedPinIds.has(pin.id)}
                        onValueChange={(value) => updateNodeData(id, updateNodeDataByPin(data, pin.id, value))}
                        onDisconnect={() => removePinConnections(id, pin.id)}
                      />
                    ))}
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    {dataOutputs.map((pin) => (
                      <div key={pin.id} className="relative rounded border border-white/[0.07] bg-background/30 px-2 py-1.5">
                        <div className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{pin.label}</div>
                        <div className="truncate font-mono text-[10px] text-muted-foreground/60">{pin.valueType}</div>
                        <Handle
                          id={pin.id}
                          type="source"
                          position={Position.Right}
                          className="!right-[-7px] !h-3 !w-3 !border !border-background !bg-primary"
                          onContextMenu={(event) => disconnectFromHandle(event, pin.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent
          side="bottom"
          align="start"
          className="w-48 space-y-1 rounded-md border border-border bg-popover p-2 shadow-lg ring-0"
        >
          <ContextMenuGroup>
            <ContextMenuLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Controlli
            </ContextMenuLabel>
            <ContextMenuItem
              variant="destructive"
              className="w-full justify-start gap-2 rounded-md px-2 py-1.5"
              onClick={() => requestNodeRemoval(id)}
            >
              <Trash2Icon className="size-4" />
              Elimina nodo
              <ContextMenuShortcut>Canc</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem disabled className="rounded-md px-2 py-1.5 text-xs text-muted-foreground">
              Click destro sui pin per scollegare
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}