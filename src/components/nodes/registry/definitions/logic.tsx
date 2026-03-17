import { GitBranchIcon } from "lucide-react"

import { getNodeInputParameters } from "@/components/nodes/registry/parameters"
import type { INodeDefinition } from "@/components/nodes/registry/types"

import { toDataPin } from "./shared"

function readPath(input: unknown, path: string) {
  if (!path.trim() || typeof input !== "object" || input === null) {
    return undefined
  }

  const parts = path.split(".").filter(Boolean)
  let current: unknown = input

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

function evaluate(operator: "eq" | "neq" | "gt" | "lt" | "contains", left: unknown, right: string) {
  const leftString = String(left ?? "")
  const rightString = String(right)

  switch (operator) {
    case "eq":
      return leftString === rightString
    case "neq":
      return leftString !== rightString
    case "gt":
      return Number(left) > Number(right)
    case "lt":
      return Number(left) < Number(right)
    case "contains":
      return leftString.includes(rightString)
  }
}

export const logicNodeDefinition: INodeDefinition<"logic"> = {
  kind: "logic",
  metadata: (data) => ({
    title: data.label,
    description: data.description,
    category: "If / Else",
    accentClassName: "text-amber-400",
    icon: GitBranchIcon,
  }),
  pins: (data) => [
    {
      id: "flow:in",
      kind: "flow",
      direction: "input",
      side: "top-left",
      label: "Exec",
    },
    {
      id: "flow:true",
      kind: "flow",
      direction: "output",
      side: "top-right",
      label: "True",
    },
    {
      id: "flow:false",
      kind: "flow",
      direction: "output",
      side: "top-right",
      label: "False",
    },
    ...getNodeInputParameters(data).map(toDataPin),
  ],
  renderBody: ({ data }) => {
    const args = data.args

    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">{args.leftPath || "left.path"}</span>
          <span className="text-xs text-muted-foreground">{args.operator}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Routes to true or false execution paths.</p>
      </>
    )
  },
  onEnter: ({ log }) => {
    log("onEnter")
  },
  onUpdate: ({ data, input, setResult, log }) => {
    const leftValue = readPath(input, data.args.leftPath)
    const conditionMatched = evaluate(data.args.operator, leftValue, data.args.rightValue)

    setResult({
      conditionMatched,
      outputSample: conditionMatched,
      error: undefined,
    })
    log("onUpdate", { conditionMatched, leftValue })
    return conditionMatched
  },
  onExit: ({ next, log }) => {
    log("onExit")
    next()
  },
}