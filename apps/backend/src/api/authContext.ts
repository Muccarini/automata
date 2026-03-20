import { jwtClaimsSchema, type JwtClaims } from "@automata/shared-contracts"

import { verifyAccessToken } from "@/auth/jwt"

export type RequestAuthContext = {
  claims: JwtClaims
  rawToken: string
}

export function getBearerToken(headers: Headers): string | null {
  const authorization = headers.get("authorization")
  if (!authorization) {
    return null
  }

  const [scheme, token] = authorization.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null
  }

  return token
}

export function requireAuth(headers: Headers): RequestAuthContext {
  const token = getBearerToken(headers)
  if (!token) {
    throw new Error("Missing bearer token")
  }

  const decoded = verifyAccessToken(token)
  const claims = jwtClaimsSchema.parse(decoded)
  return { claims, rawToken: token }
}
