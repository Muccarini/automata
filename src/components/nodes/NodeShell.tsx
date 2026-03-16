import { useState, type ReactNode } from "react"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { Handle, Position } from "reactflow"

import { InputPinField } from "@/components/nodes/pins/InputPinField"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DataPin, FlowPin, InlineValue, NodeMetadata } from "@/types/graph"

const FLOW_PIN_START = 32
const FLOW_PIN_GAP = 16

type NodeShellProps = {
  metadata: NodeMetadata
  flowInputs: FlowPin[]
  flowOutputs: FlowPin[]
  dataInputs: DataPin[]
  dataOutputs: DataPin[]
  connectedPinIds: Set<string>
  onInlineValueChange: (pin: DataPin, value: InlineValue) => void
  onDisconnectPin: (pinId: string) => void
  children: ReactNode
}

export function NodeShell({
  metadata,
  flowInputs,
  flowOutputs,
  dataInputs,
  dataOutputs,
  connectedPinIds,
  onInlineValueChange,
  onDisconnectPin,
  children,
}: NodeShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const NodeIcon = metadata.icon
  const headerSummary = `${metadata.title} ${metadata.description}`

  const disconnectFromHandle = (event: React.MouseEvent, pinId: string) => {
    event.preventDefault()
    event.stopPropagation()
    onDisconnectPin(pinId)
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
          style={{ top: FLOW_PIN_START + index * FLOW_PIN_GAP }}
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
          style={{ top: FLOW_PIN_START + index * FLOW_PIN_GAP }}
          onContextMenu={(event) => disconnectFromHandle(event, pin.id)}
        />
      ))}

      <div className="grid gap-3">
        <header className="min-w-0 rounded border border-white/[0.06] bg-black/15 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <NodeIcon className={cn("size-3.5 shrink-0", metadata.accentClassName)} />
              <p className="truncate text-[12px] text-muted-foreground" title={headerSummary}>
                <span className={cn("font-medium", metadata.accentClassName)}>{metadata.title}</span> {metadata.description}
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
            <div className="mb-3 min-w-0 rounded border border-white/[0.06] bg-background/40 px-2 py-1.5">{children}</div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 space-y-1.5">
                {dataInputs.map((pin) => (
                  <InputPinField
                    key={pin.id}
                    pin={pin}
                    connected={connectedPinIds.has(pin.id)}
                    onValueChange={(value) => onInlineValueChange(pin, value)}
                    onDisconnect={() => onDisconnectPin(pin.id)}
                  />
                ))}
              </div>

              <div className="min-w-0 space-y-1.5">
                {dataOutputs.map((pin) => (
                  <div
                    key={pin.id}
                    className="relative rounded border border-white/[0.07] bg-background/30 px-2 py-1.5"
                  >
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
    </div>
  )
}