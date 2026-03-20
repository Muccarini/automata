import type { InputParameterDescriptor } from "@/components/nodes/registry/types"
import type { HttpArgs } from "@/types/graph"

import { createEnumParameter, createObjectParameter, createStringParameter, parseHeaders } from "./shared"

export function getHttpInputParameters(): InputParameterDescriptor[] {
  return [
    createEnumParameter(
      "http-method",
      "data:method",
      "Method",
      "args.method",
      (data) => (data.nodeType === "http" ? data.args.method : "GET"),
      (data, value) =>
        data.nodeType !== "http"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                method: value as HttpArgs["method"],
              },
            },
      () => ["GET", "POST", "PUT", "PATCH", "DELETE"]
    ),
    createStringParameter(
      "http-url",
      "data:url",
      "URL",
      "args.url",
      (data) => (data.nodeType === "http" ? data.args.url : ""),
      (data, value) =>
        data.nodeType !== "http"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                url: value,
              },
            }
    ),
    createObjectParameter(
      "http-headers",
      "data:headers",
      "Headers",
      "args.headers",
      (data) => JSON.stringify(data.nodeType === "http" ? data.args.headers : [], null, 2),
      (data, value) => {
        if (data.nodeType !== "http") {
          return data
        }

        const headers = parseHeaders(value)
        if (!headers) {
          return data
        }

        return {
          ...data,
          args: {
            ...data.args,
            headers,
          },
        }
      }
    ),
    createEnumParameter(
      "http-auth",
      "data:authType",
      "Auth",
      "args.authType",
      (data) => (data.nodeType === "http" ? data.args.authType : "none"),
      (data, value) =>
        data.nodeType !== "http"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                authType: value as HttpArgs["authType"],
              },
            },
      () => ["none", "bearer", "basic"]
    ),
    createStringParameter(
      "http-bearer-token",
      "data:bearerToken",
      "Bearer Token",
      "args.bearerToken",
      (data) => (data.nodeType === "http" ? data.args.bearerToken : ""),
      (data, value) =>
        data.nodeType !== "http"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                bearerToken: value,
              },
            }
    ),
    createStringParameter(
      "http-basic-username",
      "data:basicUsername",
      "Basic Username",
      "args.basicUsername",
      (data) => (data.nodeType === "http" ? data.args.basicUsername : ""),
      (data, value) =>
        data.nodeType !== "http"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                basicUsername: value,
              },
            }
    ),
    createStringParameter(
      "http-basic-password",
      "data:basicPassword",
      "Basic Password",
      "args.basicPassword",
      (data) => (data.nodeType === "http" ? data.args.basicPassword : ""),
      (data, value) =>
        data.nodeType !== "http"
          ? data
          : {
              ...data,
              args: {
                ...data.args,
                basicPassword: value,
              },
            }
    ),
  ]
}