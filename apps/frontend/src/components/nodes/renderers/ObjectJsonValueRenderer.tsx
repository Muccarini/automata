import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type ObjectJsonValueRendererProps = {
  value: string
  onChange: (value: string) => void
}

export function ObjectJsonValueRenderer({ value, onChange }: ObjectJsonValueRendererProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)

  const preview = useMemo(() => {
    const compact = value.replace(/\s+/g, " ").trim()

    if (!compact) {
      return "{}"
    }

    return compact.length > 42 ? `${compact.slice(0, 39)}...` : compact
  }, [value])

  const saveDraft = () => {
    try {
      const parsed = JSON.parse(draft)

      if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
        setError("Inserisci un oggetto JSON (es. {\"chiave\":\"valore\"}).")
        return
      }

      onChange(JSON.stringify(parsed, null, 2))
      setError(null)
      setOpen(false)
    } catch {
      setError("Formato JSON non valido.")
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input className="h-8 font-mono text-[11px]" value={preview} readOnly />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={<Button variant="outline" size="sm" className="h-8 px-2 text-[11px] font-medium" />}
          onClick={() => {
            setDraft(value)
            setError(null)
          }}
        >
          Modifica
        </DialogTrigger>
        <DialogContent className="max-w-lg" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Modifica oggetto JSON</DialogTitle>
            <DialogDescription>
              Inserisci un oggetto JSON valido. Array e valori primitivi non sono consentiti in questo campo.
            </DialogDescription>
          </DialogHeader>

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
          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Annulla</DialogClose>
            <Button onClick={saveDraft}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}