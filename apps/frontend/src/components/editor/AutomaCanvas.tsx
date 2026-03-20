import { useEffect, useMemo, useState, type DragEvent, type MouseEvent } from "react"
import { BracesIcon, GitBranchIcon, GlobeIcon, ZapIcon, type LucideIcon } from "lucide-react"
import ReactFlow, {
  Background,
  Controls,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type XYPosition,
} from "reactflow"
import "reactflow/dist/style.css"

import { AutomaVariablesPanel } from "@/components/editor/AutomaVariablesPanel"
import {
  hasVariableReferenceDragPayload,
  parseVariableReferenceDragPayload,
  VARIABLE_REFERENCE_DRAG_TYPE,
} from "@/components/editor/variableReferenceDnD"
import { Button } from "@/components/ui/button"
import { blockDragEvent } from "@/lib/reactEvents"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAutomataStore } from "@/store/automataStore"
import { useAutomaGraphStore } from "@/store/automaGraphStore"
import { useViewportDnDStore } from "@/store/viewportDnDStore"
import { NodeRenderer } from "@/components/nodes/NodeRenderer"
import type { NodeKind } from "@/types/graph"

const nodeTypes: NodeTypes = {
  trigger: NodeRenderer,
  http: NodeRenderer,
  mapper: NodeRenderer,
  logic: NodeRenderer,
  variable: NodeRenderer,
}

function InnerCanvas() {
  const { screenToFlowPosition } = useReactFlow()
  const nodes = useAutomaGraphStore((state) => state.nodes)
  const edges = useAutomaGraphStore((state) => state.edges)
  const onNodesChange = useAutomaGraphStore((state) => state.onNodesChange)
  const onEdgesChange = useAutomaGraphStore((state) => state.onEdgesChange)
  const onConnect = useAutomaGraphStore((state) => state.onConnect)
  const addNode = useAutomaGraphStore((state) => state.addNode)
  const addVariableReferenceNode = useAutomaGraphStore((state) => state.addVariableReferenceNode)
  const runFlowSimulation = useAutomaGraphStore((state) => state.runFlowSimulation)
  const selectedNodeId = useAutomaGraphStore((state) => state.selectedNodeId)
  const selectNode = useAutomaGraphStore((state) => state.selectNode)
  const requestNodeRemoval = useAutomaGraphStore((state) => state.requestNodeRemoval)
  const tenantVariables = useAutomataStore((state) => {
    const tenantId = state.selectedTenantId
    return state.tenantGlobalVariables[tenantId] ?? []
  })
  const isVariableDragActive = useViewportDnDStore((state) => state.isVariableDragActive)
  const endVariableDrag = useViewportDnDStore((state) => state.endVariableDrag)
  const isMobile = useIsMobile()

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

  const handleDragOver = (event: DragEvent<Element>) => {
    if (!hasVariableReferenceDragPayload(event.dataTransfer)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  const handleDrop = (event: DragEvent<Element>) => {
    event.preventDefault()
    endVariableDrag()

    const rawPayload = event.dataTransfer.getData(VARIABLE_REFERENCE_DRAG_TYPE)
    const payload = parseVariableReferenceDragPayload(rawPayload)
    if (!payload || !payload.key.trim()) {
      return
    }

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    addVariableReferenceNode({
      position,
      scope: payload.scope,
      key: payload.key.trim(),
      valueType: payload.valueType,
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

  useEffect(() => {
    const handleGlobalDragEnd = () => {
      endVariableDrag()
    }

    window.addEventListener("dragend", handleGlobalDragEnd)
    window.addEventListener("drop", handleGlobalDragEnd)

    return () => {
      window.removeEventListener("dragend", handleGlobalDragEnd)
      window.removeEventListener("drop", handleGlobalDragEnd)
    }
  }, [endVariableDrag])

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
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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
        <Controls />
        <Panel position="top-left">
          <div
            className="flex items-center gap-2 rounded-md border border-border bg-card/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm"
            onDragEnter={blockDragEvent}
            onDragOver={blockDragEvent}
            onDrop={blockDragEvent}
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void runFlowSimulation({ tenantVariables })
              }}
            >
              Run Flow
            </Button>
          </div>
        </Panel>
        <Panel position="top-right">
          <AutomaVariablesPanel embedded initiallyOpen={!isMobile} />
        </Panel>
      </ReactFlow>

      {isVariableDragActive ? (
        <div className="pointer-events-none absolute inset-3 z-20 rounded-2xl border border-dashed border-primary/50 bg-primary/6 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.12)]">
          <div className="absolute inset-x-0 top-4 flex justify-center">
            <div className="rounded-full border border-primary/30 bg-background/90 px-4 py-2 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
              Drop to create a variable node
            </div>
          </div>
        </div>
      ) : null}

      {menu ? (
        <div
          className="absolute z-40 w-48 space-y-1 rounded-md border border-border bg-popover p-2 shadow-lg"
          style={{ left: menu.panePosition.x, top: menu.panePosition.y }}
          onDragEnter={blockDragEvent}
          onDragOver={blockDragEvent}
          onDrop={blockDragEvent}
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

export function AutomaCanvas() {
  return (
    <ReactFlowProvider>
      <InnerCanvas />
    </ReactFlowProvider>
  )
}

