import type { InputParameterDescriptor } from "@/components/nodes/registry/types"
import type { NodeData } from "@/types/graph"

import { createEnumParameter, createObjectParameter, createStringParameter, parseHeaders } from "./shared"

export function getHttpInputParameters(): InputParameterDescriptor[] {
  return [
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
  ]
}