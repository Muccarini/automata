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
        setError("Enter a JSON object (e.g. {\"key\":\"value\"}).")
        return
      }

      onChange(JSON.stringify(parsed, null, 2))
      setError(null)
      setOpen(false)
    } catch {
      setError("Invalid JSON format.")
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
          Edit
        </DialogTrigger>
        <DialogContent className="max-w-lg" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Edit JSON object</DialogTitle>
            <DialogDescription>
              Enter a valid JSON object. Arrays and primitive values are not allowed in this field.
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
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={saveDraft}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}