import { Input } from "@/components/ui/input"

type StringValueRendererProps = {
  value: string
  onChange: (value: string) => void
}

export function StringValueRenderer({ value, onChange }: StringValueRendererProps) {
  return (
    <Input
      className="h-8 font-mono text-[11px]"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}