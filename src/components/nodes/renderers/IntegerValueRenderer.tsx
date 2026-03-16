import { Input } from "@/components/ui/input"

type IntegerValueRendererProps = {
  value: number
  onChange: (value: number) => void
}

export function IntegerValueRenderer({ value, onChange }: IntegerValueRendererProps) {
  return (
    <Input
      type="number"
      className="h-8 font-mono text-[11px]"
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value || 0))}
    />
  )
}