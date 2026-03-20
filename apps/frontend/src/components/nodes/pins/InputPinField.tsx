import { useMemo, useState } from "react"
import { Handle, Position } from "reactflow"

import { EnumValueRenderer } from "@/components/nodes/renderers/EnumValueRenderer"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { DataPin, InlineValue } from "@/types/graph"

type InputPinFieldProps = {
  pin: DataPin
  connected: boolean
  onValueChange: (value: InlineValue) => void
  onDisconnect: () => void
}

export function InputPinField({ pin, connected, onValueChange, onDisconnect }: InputPinFieldProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(pin.inlineValue?.valueType === "object" ? pin.inlineValue.value : "")
  const [error, setError] = useState<string | null>(null)

  const currentPreview = useMemo(() => {
    if (!pin.inlineValue) {
      return ""
    }

    if (pin.inlineValue.valueType === "object") {
      const compact = pin.inlineValue.value.replace(/\s+/g, " ").trim()
      if (!compact) {
        return "{}"
      }
      return compact.length > 24 ? `${compact.slice(0, 21)}...` : compact
    }

    return String(pin.inlineValue.value)
  }, [pin.inlineValue])

  const enumInlineValue = pin.inlineValue?.valueType === "enum" ? pin.inlineValue : null

  const openEditor = (event: React.PointerEvent | React.MouseEvent) => {
    event.stopPropagation()
    setDraft(pin.inlineValue?.valueType === "object" ? pin.inlineValue.value : "")
    setError(null)
    setOpen(true)
  }

  const saveDraft = () => {
    if (!pin.inlineValue) {
      setOpen(false)
      return
    }

    if (pin.inlineValue.valueType !== "object") {
      setOpen(false)
      return
    }

    try {
      const parsed = JSON.parse(draft)

      if (parsed === null || typeof parsed !== "object") {
        setError("Inserisci un JSON valido.")
        return
      }

      onValueChange({ valueType: "object", value: JSON.stringify(parsed, null, 2) })
      setOpen(false)
    } catch {
      setError("Formato JSON non valido.")
    }
  }

  return (
    <div className="relative min-w-0 overflow-visible grid grid-cols-[minmax(0,1fr)_minmax(0,170px)] items-center gap-2 rounded border border-white/[0.07] bg-background/30 px-2 py-1.5">
      <Handle
        id={pin.id}
        type="target"
        position={Position.Left}
        className="!left-[-7px] !h-3 !w-3 !border !border-background !bg-primary"
        onContextMenu={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onDisconnect()
        }}
      />
      <div className="min-w-0">
        <div className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{pin.label}</div>
        <div className="truncate font-mono text-[10px] text-muted-foreground/60">{pin.valueType}</div>
      </div>
      {connected || !pin.inlineValue ? (
        <div className="flex h-8 items-center rounded-md border border-input bg-background/70 px-2 font-mono text-[11px] text-muted-foreground">
          <span className="truncate">...</span>
        </div>
      ) : enumInlineValue ? (
        <div
          className="nodrag"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <EnumValueRenderer
            value={enumInlineValue.value}
            options={enumInlineValue.options}
            onChange={(value) =>
              onValueChange({
                valueType: "enum",
                value,
                options: enumInlineValue.options,
              })
            }
          />
        </div>
      ) : pin.inlineValue.valueType === "object" ? (
        <>
          <Input
            className="nodrag h-8 cursor-pointer font-mono text-[11px]"
            value={currentPreview}
            readOnly
            title={currentPreview}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={openEditor}
          />

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
              className="max-w-lg"
              showCloseButton={false}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <DialogHeader>
                <DialogTitle>Modifica parametro</DialogTitle>
                <DialogDescription>
                  {pin.valueType === "object"
                    ? "Inserisci un JSON valido (oggetto o array)."
                    : "Aggiorna il valore del parametro."}
                </DialogDescription>
              </DialogHeader>

              {pin.valueType === "object" ? (
                <Textarea
                  className="min-h-56 font-mono text-[11px]"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value)
                    if (error) {
                      setError(null)
                    }
                  }}
                />
              ) : (
                <Input
                  className="h-8 font-mono text-[11px]"
                  type={pin.valueType === "integer" ? "number" : "text"}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value)
                    if (error) {
                      setError(null)
                    }
                  }}
                />
              )}

              {error ? <p className="text-xs text-destructive">{error}</p> : null}

              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Annulla</DialogClose>
                <Button onClick={saveDraft}>Salva</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Input
          className="nodrag h-8 font-mono text-[11px]"
          type={pin.inlineValue.valueType === "integer" ? "number" : "text"}
          value={String(pin.inlineValue.value)}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            if (pin.inlineValue?.valueType === "integer") {
              const parsed = Number(event.target.value)
              if (!Number.isFinite(parsed)) {
                return
              }

              onValueChange({ valueType: "integer", value: parsed })
              return
            }

            onValueChange({ valueType: "string", value: event.target.value })
          }}
        />
      )}
    </div>
  )
}