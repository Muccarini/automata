import jwt from "jsonwebtoken"

import type { JwtClaims } from "@automata/shared-contracts"

import { env } from "@/config/env"

export function signAccessToken(claims: JwtClaims): string {
  return jwt.sign(claims, env.jwtSecret)
}

export function verifyAccessToken(token: string): JwtClaims {
  const decoded = jwt.verify(token, env.jwtSecret)
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid JWT payload")
  }
  return decoded as JwtClaims
}
