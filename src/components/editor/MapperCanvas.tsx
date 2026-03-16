import { useMemo, useState, type MouseEvent } from "react"
import { BotIcon, BracesIcon, GitBranchIcon, GlobeIcon, ListIcon, type LucideIcon } from "lucide-react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type XYPosition,
} from "reactflow"
import "reactflow/dist/style.css"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMapperStore } from "@/store/mapperStore"
import { NodeRenderer } from "@/components/nodes/NodeRenderer"
import type { NodeKind } from "@/types/graph"

const nodeTypes: NodeTypes = {
  trigger: NodeRenderer,
  http: NodeRenderer,
  mapper: NodeRenderer,
  logic: NodeRenderer,
  enum: NodeRenderer,
}

function InnerCanvas() {
  const { screenToFlowPosition } = useReactFlow()
  const nodes = useMapperStore((state) => state.nodes)
  const edges = useMapperStore((state) => state.edges)
  const onNodesChange = useMapperStore((state) => state.onNodesChange)
  const onEdgesChange = useMapperStore((state) => state.onEdgesChange)
  const onConnect = useMapperStore((state) => state.onConnect)
  const addNode = useMapperStore((state) => state.addNode)
  const selectNode = useMapperStore((state) => state.selectNode)

  const [menu, setMenu] = useState<{
    panePosition: XYPosition
    flowPosition: XYPosition
  } | null>(null)

  const actions = useMemo<Array<{ label: string; nodeType: NodeKind; icon: LucideIcon; accentClassName: string; group: string }>>(
    () => [
      { label: "Aggiungi Trigger", nodeType: "trigger", icon: BotIcon, accentClassName: "text-emerald-400", group: "Codice" },
      { label: "Aggiungi HTTP", nodeType: "http", icon: GlobeIcon, accentClassName: "text-sky-400", group: "Codice" },
      { label: "Aggiungi Mapper", nodeType: "mapper", icon: BracesIcon, accentClassName: "text-violet-400", group: "Codice" },
      { label: "Aggiungi If / Else", nodeType: "logic", icon: GitBranchIcon, accentClassName: "text-amber-400", group: "Codice" },
      { label: "Aggiungi Enum", nodeType: "enum", icon: ListIcon, accentClassName: "text-rose-400", group: "Strutture" },
    ],
    []
  )

  const groupedActions = useMemo(() => {
    const groups = new Map<string, typeof actions>()
    for (const action of actions) {
      const group = groups.get(action.group)
      if (group) {
        group.push(action)
      } else {
        groups.set(action.group, [action])
      }
    }

    return Array.from(groups.entries())
  }, [actions])

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()

    const bounds = event.currentTarget.getBoundingClientRect()

    setMenu({
      panePosition: {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      },
      flowPosition: screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }),
    })
  }

  const createNode = (nodeType: NodeKind) => {
    if (!menu) {
      return
    }

    addNode({
      nodeType,
      position: menu.flowPosition,
    })

    setMenu(null)
  }

  return (
    <div className="relative h-full w-full" onContextMenu={handleContextMenu}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={() => {
          setMenu(null)
          selectNode(null)
        }}
        onNodeClick={(_, node) => selectNode(node.id)}
        fitView
        nodeTypes={nodeTypes}
      >
        <Background gap={24} size={1} />
        <MiniMap pannable zoomable />
        <Controls />
        <Panel position="top-left">
          <div className="rounded-md border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            Right-click to add nodes
          </div>
        </Panel>
      </ReactFlow>

      {menu ? (
        <div
          className="absolute z-20 w-48 space-y-1 rounded-md border border-border bg-popover p-2 shadow-lg"
          style={{ left: menu.panePosition.x, top: menu.panePosition.y }}
        >
          {groupedActions.map(([groupName, groupActions]) => (
            <div key={groupName} className="space-y-1">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {groupName}
              </p>
              {groupActions.map((action) => (
                <Button
                  key={action.nodeType}
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => createNode(action.nodeType)}
                >
                  <action.icon className={cn("size-4", action.accentClassName)} />
                  {action.label}
                </Button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function MapperCanvas() {
  return (
    <ReactFlowProvider>
      <InnerCanvas />
    </ReactFlowProvider>
  )
}
