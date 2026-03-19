import { VariableIcon } from "lucide-react"

import type { NodeDefinition } from "@/components/nodes/registry/types"

import { outputPin } from "./shared"

export const variableNodeDefinition: NodeDefinition<"variable"> = {
  kind: "variable",
  disableDefaultInputParameters: true,
  metadata: (data) => ({
    title: data.label,
    description: data.description,
    category: "Variables",
    accentClassName:
      data.args.valueType === "integer"
        ? "text-amber-400"
        : data.args.valueType === "boolean"
          ? "text-cyan-400"
        : data.args.valueType === "enum"
          ? "text-violet-400"
          : data.args.scope === "tenant"
            ? "text-blue-400"
            : "text-emerald-400",
    icon: VariableIcon,
  }),
  pins: (data) => [outputPin("data:value", "Value", data.args.valueType)],
  renderBody: ({ data }) => {
    const variableToken = data.args.key ? `${"${"}${data.args.key}}` : "${VAR}"
    const scopeLabel = data.args.scope === "tenant" ? "Tenant" : "Automation"
    const typeLabel =
      data.args.valueType === "integer"
        ? "Integer"
        : data.args.valueType === "boolean"
          ? "Boolean"
          : data.args.valueType === "enum"
            ? "Enum"
            : "String"

    return (
      <div className="space-y-1">
        <p className="font-mono text-xs text-foreground">{variableToken}</p>
        <p className="text-xs text-muted-foreground">Scope: {scopeLabel}</p>
        <p className="text-xs text-muted-foreground">Type: {typeLabel}</p>
      </div>
    )
  },
  onEnter: ({ data, setResult, log }) => {
    log("onEnter", { scope: data.args.scope, key: data.args.key, valueType: data.args.valueType })
    setResult({
      value: "",
      key: data.args.key,
      scope: data.args.scope,
      valueType: data.args.valueType,
      outputSample: undefined,
      error: undefined,
    })
  },
  onUpdate: ({ data, resolveVariable, setResult, log }) => {
    const resolved = resolveVariable(data.args.scope, data.args.key)

    if (resolved === undefined) {
      setResult({
        value: "",
        key: data.args.key,
        scope: data.args.scope,
        valueType: data.args.valueType,
        outputSample: { value: "" },
        error: `Variable not found: ${data.args.scope}.${data.args.key}`,
      })
      log("onUpdate", { found: false })
      return { value: "" }
    }

    const runtimeValueType = resolved.valueType
    if (runtimeValueType === "integer") {
      const parsedValue = Number.parseInt(resolved.value, 10)
      if (Number.isNaN(parsedValue)) {
        setResult({
          value: "",
          key: data.args.key,
          scope: data.args.scope,
          valueType: runtimeValueType,
          outputSample: { value: "" },
          error: `Invalid integer value for variable: ${data.args.scope}.${data.args.key}`,
        })
        log("onUpdate", { found: true, valueType: runtimeValueType, valid: false })
        return { value: "" }
      }

      setResult({
        value: parsedValue,
        key: data.args.key,
        scope: data.args.scope,
        valueType: runtimeValueType,
        outputSample: { value: parsedValue },
        error: undefined,
      })
      log("onUpdate", { found: true, valueType: runtimeValueType, valid: true })
      return { value: parsedValue }
    }

    if (runtimeValueType === "boolean") {
      const normalizedValue = resolved.value.trim().toLowerCase()
      if (normalizedValue !== "true" && normalizedValue !== "false") {
        setResult({
          value: "",
          key: data.args.key,
          scope: data.args.scope,
          valueType: runtimeValueType,
          outputSample: { value: "" },
          error: `Invalid boolean value for variable: ${data.args.scope}.${data.args.key}`,
        })
        log("onUpdate", { found: true, valueType: runtimeValueType, valid: false })
        return { value: "" }
      }

      const parsedValue = normalizedValue === "true"
      setResult({
        value: parsedValue,
        key: data.args.key,
        scope: data.args.scope,
        valueType: runtimeValueType,
        outputSample: { value: parsedValue },
        error: undefined,
      })
      log("onUpdate", { found: true, valueType: runtimeValueType, valid: true })
      return { value: parsedValue }
    }

    setResult({
      value: resolved.value,
      key: data.args.key,
      scope: data.args.scope,
      valueType: runtimeValueType,
      outputSample: { value: resolved.value },
      error: undefined,
    })
    log("onUpdate", { found: true, valueType: runtimeValueType })
    return { value: resolved.value }
  },
  onExit: ({ log }) => {
    log("onExit")
  },
}
