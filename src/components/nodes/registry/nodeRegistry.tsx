import type { ReactNode } from "react"
import { BotIcon, BracesIcon, GitBranchIcon, GlobeIcon, ListIcon } from "lucide-react"

import type {
  DataPin,
  FlowNode,
  InlineValue,
  InlineValueType,
  NodeData,
  NodeKind,
  NodeMetadata,
  NodeParameter,
  NodePin,
  NodePresentation,
} from "@/types/graph"

type BodyContext = {
  data: NodeData
}

type InputParameterDescriptor = {
  id: string
  pinId: string
  label: string
  valueType: InlineValueType
  dataPath?: string
  supportsEdgeConnection: boolean
  getInlineValue: (data: NodeData) => InlineValue
  setInlineValue: (data: NodeData, nextValue: InlineValue) => NodeData
}

export interface INodeDefinition {
  kind: NodeKind
  metadata: (data: NodeData) => NodeMetadata
  pins: (data: NodeData) => NodePin[]
  renderBody: (context: BodyContext) => ReactNode
}

function toDataPin(parameter: NodeParameter): DataPin {
  return {
    id: parameter.pinId,
    kind: "data",
    direction: "input",
    side: "left",
    label: parameter.label,
    valueType: parameter.valueType,
    dataPath: parameter.dataPath,
    supportsEdgeConnection: parameter.supportsEdgeConnection,
    inlineValue: parameter.inlineValue,
  }
}

function outputPin(id: string, label: string, valueType: InlineValueType = "object"): DataPin {
  return {
    id,
    kind: "data",
    direction: "output",
    side: "right",
    label,
    valueType,
  }
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) {
      return null
    }

    return parsed
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0)
  } catch {
    return null
  }
}

function parseHeaders(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) {
      return null
    }

    return parsed.map((item) => {
      if (item && typeof item === "object") {
        const header = item as { key?: unknown; value?: unknown }
        return {
          key: String(header.key ?? ""),
          value: String(header.value ?? ""),
        }
      }

      return {
        key: "",
        value: "",
      }
    })
  } catch {
    return null
  }
}

function createStringParameter(
  id: string,
  pinId: string,
  label: string,
  dataPath: string,
  getValue: (data: NodeData) => string,
  setValue: (data: NodeData, value: string) => NodeData,
  supportsEdgeConnection = true
): InputParameterDescriptor {
  return {
    id,
    pinId,
    label,
    valueType: "string",
    dataPath,
    supportsEdgeConnection,
    getInlineValue: (data) => ({
      valueType: "string",
      value: getValue(data),
    }),
    setInlineValue: (data, nextValue) => {
      if (nextValue.valueType !== "string") {
        return data
      }

      return setValue(data, nextValue.value)
    },
  }
}

function createObjectParameter(
  id: string,
  pinId: string,
  label: string,
  dataPath: string,
  getValue: (data: NodeData) => string,
  setValue: (data: NodeData, value: string) => NodeData,
  supportsEdgeConnection = true
): InputParameterDescriptor {
  return {
    id,
    pinId,
    label,
    valueType: "object",
    dataPath,
    supportsEdgeConnection,
    getInlineValue: (data) => ({
      valueType: "object",
      value: getValue(data),
    }),
    setInlineValue: (data, nextValue) => {
      if (nextValue.valueType !== "object") {
        return data
      }

      return setValue(data, nextValue.value)
    },
  }
}

function createEnumParameter(
  id: string,
  pinId: string,
  label: string,
  dataPath: string,
  getValue: (data: NodeData) => string,
  setValue: (data: NodeData, value: string) => NodeData,
  getOptions: (data: NodeData) => string[],
  supportsEdgeConnection = true
): InputParameterDescriptor {
  return {
    id,
    pinId,
    label,
    valueType: "enum",
    dataPath,
    supportsEdgeConnection,
    getInlineValue: (data) => ({
      valueType: "enum",
      value: getValue(data),
      options: getOptions(data),
    }),
    setInlineValue: (data, nextValue) => {
      if (nextValue.valueType !== "enum") {
        return data
      }

      return setValue(data, nextValue.value)
    },
  }
}

const parameterRegistry: Record<NodeKind, (data: NodeData) => InputParameterDescriptor[]> = {
  trigger: () => [
    createEnumParameter(
      "trigger-type",
      "data:triggerType",
      "Type",
      "trigger.triggerType",
      (data) => data.trigger.triggerType,
      (data, value) => ({
        ...data,
        trigger: {
          ...data.trigger,
          triggerType: value as NodeData["trigger"]["triggerType"],
        },
      }),
      () => ["manual", "cron", "webhook"]
    ),
    createStringParameter(
      "trigger-interval",
      "data:triggerInterval",
      "Interval",
      "trigger.interval",
      (data) => data.trigger.interval,
      (data, value) => ({
        ...data,
        trigger: {
          ...data.trigger,
          interval: value,
        },
      })
    ),
    createStringParameter(
      "trigger-webhook-path",
      "data:webhookPath",
      "Webhook Path",
      "trigger.webhookPath",
      (data) => data.trigger.webhookPath,
      (data, value) => ({
        ...data,
        trigger: {
          ...data.trigger,
          webhookPath: value,
        },
      })
    ),
  ],
  http: () => [
    createEnumParameter(
      "http-method",
      "data:method",
      "Method",
      "http.method",
      (data) => data.http.method,
      (data, value) => ({
        ...data,
        http: {
          ...data.http,
          method: value as NodeData["http"]["method"],
        },
      }),
      () => ["GET", "POST", "PUT", "PATCH", "DELETE"]
    ),
    createStringParameter(
      "http-url",
      "data:url",
      "URL",
      "http.url",
      (data) => data.http.url,
      (data, value) => ({
        ...data,
        http: {
          ...data.http,
          url: value,
        },
      })
    ),
    createObjectParameter(
      "http-headers",
      "data:headers",
      "Headers",
      "http.headers",
      (data) => JSON.stringify(data.http.headers, null, 2),
      (data, value) => {
        const headers = parseHeaders(value)
        if (!headers) {
          return data
        }

        return {
          ...data,
          http: {
            ...data.http,
            headers,
          },
        }
      }
    ),
    createEnumParameter(
      "http-auth",
      "data:authType",
      "Auth",
      "http.authType",
      (data) => data.http.authType,
      (data, value) => ({
        ...data,
        http: {
          ...data.http,
          authType: value as NodeData["http"]["authType"],
        },
      }),
      () => ["none", "bearer", "basic"]
    ),
    createStringParameter(
      "http-bearer-token",
      "data:bearerToken",
      "Bearer Token",
      "http.bearerToken",
      (data) => data.http.bearerToken,
      (data, value) => ({
        ...data,
        http: {
          ...data.http,
          bearerToken: value,
        },
      })
    ),
    createStringParameter(
      "http-basic-username",
      "data:basicUsername",
      "Basic Username",
      "http.basicUsername",
      (data) => data.http.basicUsername,
      (data, value) => ({
        ...data,
        http: {
          ...data.http,
          basicUsername: value,
        },
      })
    ),
    createStringParameter(
      "http-basic-password",
      "data:basicPassword",
      "Basic Password",
      "http.basicPassword",
      (data) => data.http.basicPassword,
      (data, value) => ({
        ...data,
        http: {
          ...data.http,
          basicPassword: value,
        },
      })
    ),
  ],
  mapper: () => [
    createObjectParameter(
      "mapper-target-schema",
      "data:targetSchema",
      "Target JSON",
      "mapper.targetSchemaText",
      (data) => data.mapper.targetSchemaText,
      (data, value) => ({
        ...data,
        mapper: {
          ...data.mapper,
          targetSchemaText: value,
        },
      })
    ),
  ],
  logic: () => [
    createStringParameter(
      "logic-left-path",
      "data:leftPath",
      "Left Path",
      "logic.leftPath",
      (data) => data.logic.leftPath,
      (data, value) => ({
        ...data,
        logic: {
          ...data.logic,
          leftPath: value,
        },
      })
    ),
    createEnumParameter(
      "logic-operator",
      "data:operator",
      "Operator",
      "logic.operator",
      (data) => data.logic.operator,
      (data, value) => ({
        ...data,
        logic: {
          ...data.logic,
          operator: value as NodeData["logic"]["operator"],
        },
      }),
      () => ["eq", "neq", "gt", "lt", "contains"]
    ),
    createStringParameter(
      "logic-right-value",
      "data:rightValue",
      "Compare",
      "logic.rightValue",
      (data) => data.logic.rightValue,
      (data, value) => ({
        ...data,
        logic: {
          ...data.logic,
          rightValue: value,
        },
      })
    ),
  ],
  enum: (data) => [
    createStringParameter(
      "enum-name",
      "data:enumName",
      "Enum Name",
      "enum.enumName",
      (item) => item.enum.enumName,
      (item, value) => ({
        ...item,
        enum: {
          ...item.enum,
          enumName: value,
        },
      }),
      false
    ),
    createObjectParameter(
      "enum-values",
      "data:enumValues",
      "Values",
      "enum.values",
      (item) => JSON.stringify(item.enum.values, null, 2),
      (item, value) => {
        const values = parseStringArray(value)
        if (!values) {
          return item
        }

        const selectedValue = values.includes(item.enum.selectedValue)
          ? item.enum.selectedValue
          : (values[0] ?? "")

        return {
          ...item,
          enum: {
            ...item.enum,
            values,
            selectedValue,
          },
        }
      },
      false
    ),
    createEnumParameter(
      "enum-selected",
      "data:selectedValue",
      "Selected",
      "enum.selectedValue",
      (item) => item.enum.selectedValue,
      (item, value) => ({
        ...item,
        enum: {
          ...item.enum,
          selectedValue: value,
        },
      }),
      () => (data.enum.values.length > 0 ? data.enum.values : [""])
    ),
  ],
}

function getNodeInputParametersInternal(data: NodeData) {
  return parameterRegistry[data.nodeType](data)
}

export function getNodeInputParameters(data: NodeData): NodeParameter[] {
  return getNodeInputParametersInternal(data).map((parameter) => ({
    id: parameter.id,
    pinId: parameter.pinId,
    label: parameter.label,
    valueType: parameter.valueType,
    dataPath: parameter.dataPath,
    supportsEdgeConnection: parameter.supportsEdgeConnection,
    inlineValue: parameter.getInlineValue(data),
  }))
}

const registry: Record<NodeKind, INodeDefinition> = {
  trigger: {
    kind: "trigger",
    metadata: (data) => ({
      title: data.label,
      description: data.description,
      category: "Trigger",
      accentClassName: "text-emerald-400",
      icon: BotIcon,
    }),
    pins: (data) => [
      {
        id: "flow:out",
        kind: "flow",
        direction: "output",
        side: "top-right",
        label: "Exec",
      },
      ...getNodeInputParameters(data).map(toDataPin),
      outputPin("data:payload", "Payload"),
    ],
    renderBody: ({ data }) => (
      <>
        <p className="text-sm font-semibold text-foreground">{data.trigger.triggerType}</p>
        <p className="mt-1 text-xs text-muted-foreground">{data.description}</p>
      </>
    ),
  },
  http: {
    kind: "http",
    metadata: (data) => ({
      title: data.label,
      description: data.description,
      category: "HTTP",
      accentClassName: "text-sky-400",
      icon: GlobeIcon,
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
        id: "flow:out",
        kind: "flow",
        direction: "output",
        side: "top-right",
        label: "Then",
      },
      ...getNodeInputParameters(data).map(toDataPin),
      outputPin("data:response", "Response"),
    ],
    renderBody: ({ data }) => (
      <div className="min-w-0">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">{data.http.method}</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {data.outputSchema.length} fields
          </span>
        </div>
        <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground" title={data.http.url || "No URL configured"}>
          {data.http.url || "No URL configured"}
        </p>
      </div>
    ),
  },
  mapper: {
    kind: "mapper",
    metadata: (data) => ({
      title: data.label,
      description: data.description,
      category: "Mapper",
      accentClassName: "text-violet-400",
      icon: BracesIcon,
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
        id: "flow:out",
        kind: "flow",
        direction: "output",
        side: "top-right",
        label: "Then",
      },
      ...getNodeInputParameters(data).map(toDataPin),
      outputPin("data:mapped", "Mapped"),
    ],
    renderBody: ({ data }) => (
      <>
        <p className="text-sm font-semibold text-foreground">Mapping rules</p>
        <p className="mt-1 text-xs text-muted-foreground">{data.mapper.mappings.length} active rules</p>
      </>
    ),
  },
  logic: {
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
    renderBody: ({ data }) => (
      <>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">{data.logic.leftPath || "left.path"}</span>
          <span className="text-xs text-muted-foreground">{data.logic.operator}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Routes to true or false execution paths.</p>
      </>
    ),
  },
  enum: {
    kind: "enum",
    metadata: (data) => ({
      title: data.label,
      description: data.description,
      category: "Strutture",
      accentClassName: "text-rose-400",
      icon: ListIcon,
    }),
    pins: (data) => [
      ...getNodeInputParameters(data).map(toDataPin),
      outputPin("data:enumValue", "Value", "enum"),
    ],
    renderBody: ({ data }) => (
      <>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">{data.enum.enumName || "Enum"}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{data.enum.values.length} values</span>
        </div>
        <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground" title={data.enum.selectedValue || "No selected value"}>
          {data.enum.selectedValue || "No selected value"}
        </p>
      </>
    ),
  },
}

export function getNodeDefinition(kind: NodeKind) {
  return registry[kind]
}

export function getNodePresentation(data: NodeData): NodePresentation {
  const definition = getNodeDefinition(data.nodeType)

  return {
    definitionKey: data.nodeType,
    metadata: definition.metadata(data),
    pins: definition.pins(data),
  }
}

export function getPinDefinition(node: FlowNode, pinId: string) {
  return getNodePresentation(node.data).pins.find((pin) => pin.id === pinId)
}

export function updateNodeDataByPin(data: NodeData, pinId: string, nextValue: InlineValue): NodeData {
  const descriptor = getNodeInputParametersInternal(data).find((parameter) => parameter.pinId === pinId)
  if (!descriptor) {
    return data
  }

  return descriptor.setInlineValue(data, nextValue)
}