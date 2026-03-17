import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type EnumValueRendererProps = {
  value: string
  options: string[]
  onChange: (value: string) => void
}

export function EnumValueRenderer({ value, options, onChange }: EnumValueRendererProps) {
  const normalizedOptions = options.length > 0 ? options : [""]
  const selectedValue = normalizedOptions.includes(value) ? value : normalizedOptions[0]

  return (
    <Select value={selectedValue} onValueChange={(nextValue) => onChange(nextValue ?? "")}>
      <SelectTrigger className="h-8 font-mono text-[11px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {normalizedOptions.map((option) => (
          <SelectItem key={option || "empty-option"} value={option}>
            {option || "(empty)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
