import { useEffect, useMemo, useState, type MouseEvent } from "react"
import { BracesIcon, ChevronRight, GitBranchIcon, GlobeIcon, VariableIcon, ZapIcon, type LucideIcon } from "lucide-react"
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

import { GlobalVariablesSidebar } from "@/components/editor/GlobalVariablesSidebar"
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
}

function InnerCanvas() {
  const { screenToFlowPosition } = useReactFlow()
  const nodes = useMapperStore((state) => state.nodes)
  const edges = useMapperStore((state) => state.edges)
  const onNodesChange = useMapperStore((state) => state.onNodesChange)
  const onEdgesChange = useMapperStore((state) => state.onEdgesChange)
  const onConnect = useMapperStore((state) => state.onConnect)
  const addNode = useMapperStore((state) => state.addNode)
  const runFlowSimulation = useMapperStore((state) => state.runFlowSimulation)
  const selectedNodeId = useMapperStore((state) => state.selectedNodeId)
  const selectNode = useMapperStore((state) => state.selectNode)
  const requestNodeRemoval = useMapperStore((state) => state.requestNodeRemoval)
  const globalVariables = useMapperStore((state) => state.globalVariables)
  const [isVariablesPanelOpen, setIsVariablesPanelOpen] = useState(true)

  const [menu, setMenu] = useState<{
    panePosition: XYPosition
    flowPosition: XYPosition
  } | null>(null)

  const actions = useMemo<Array<{ label: string; nodeType: NodeKind; icon: LucideIcon; accentClassName: string; group: string }>>(
    () => [
      { label: "Trigger", nodeType: "trigger", icon: ZapIcon, accentClassName: "text-amber-500", group: "Nodi" },
      { label: "HTTP", nodeType: "http", icon: GlobeIcon, accentClassName: "text-sky-400", group: "Nodi" },
      { label: "Mapper", nodeType: "mapper", icon: BracesIcon, accentClassName: "text-violet-400", group: "Nodi" },
      { label: "If / Else", nodeType: "logic", icon: GitBranchIcon, accentClassName: "text-amber-400", group: "Controlli" },
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

  const handlePaneContextMenu = (event: MouseEvent<Element>) => {
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedNodeId) {
        return
      }

      if (event.key !== "Delete" && event.key !== "Backspace") {
        return
      }

      const target = event.target
      if (target instanceof HTMLElement) {
        const tagName = target.tagName
        if (target.isContentEditable || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
          return
        }
      }

      event.preventDefault()
      requestNodeRemoval(selectedNodeId)
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [requestNodeRemoval, selectedNodeId])

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        selectionOnDrag
        panOnDrag={[1]}
        onPaneContextMenu={handlePaneContextMenu}
        onPaneClick={() => {
          setMenu(null)
          selectNode(null)
        }}
        onNodeClick={(_, node) => {
          setMenu(null)
          selectNode(node.id)
        }}
        fitView
        nodeTypes={nodeTypes}
      >
        <Background gap={24} size={1} />
        <MiniMap pannable zoomable />
        <Controls />
        <Panel position="top-left">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void runFlowSimulation()
              }}
            >
              Run Flow
            </Button>
          </div>
        </Panel>
        <Panel position="top-right">
          <Button
            size="sm"
            variant="secondary"
            className="gap-2"
            onClick={() => {
              setIsVariablesPanelOpen((open) => !open)
            }}
          >
            <VariableIcon className="size-4" />
            Automa variables ({globalVariables.length})
          </Button>
        </Panel>
      </ReactFlow>

      <div className="pointer-events-none absolute inset-y-0 left-0 z-30 p-3">
        <div
          className={cn(
            "pointer-events-auto h-full w-80 transform transition-transform duration-200 ease-out",
            isVariablesPanelOpen ? "translate-x-0" : "-translate-x-[calc(100%+0.75rem)]"
          )}
        >
          <GlobalVariablesSidebar embedded onClose={() => setIsVariablesPanelOpen(false)} />
        </div>

        {!isVariablesPanelOpen ? (
          <Button
            size="icon"
            variant="secondary"
            className="pointer-events-auto absolute left-3 top-3"
            onClick={() => setIsVariablesPanelOpen(true)}
            aria-label="Open global variables panel"
          >
            <ChevronRight className="size-4" />
          </Button>
        ) : null}
      </div>

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

