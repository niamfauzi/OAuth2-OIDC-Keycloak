import { createRemoteJWKSet, jwtVerify } from "jose"

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

type RolePayload = {
  sub?: unknown
  realm_access?: {
    roles?: unknown
  }
}

const adminRole = "app_admin"

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "")
}

function getRequiredEnv(key: string) {
  const value = process.env[key]?.trim()

  if (!value) {
    throw new Error(`${key} is required`)
  }

  return value
}

function getIssuer() {
  const baseUrl = trimTrailingSlash(getRequiredEnv("KEYCLOAK_BASE_URL"))
  const realm = getRequiredEnv("KEYCLOAK_REALM")

  return `${baseUrl}/realms/${encodeURIComponent(realm)}`
}

let cachedIssuer = ""
let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJwks() {
  const issuer = getIssuer()

  if (!cachedJwks || cachedIssuer !== issuer) {
    cachedIssuer = issuer
    cachedJwks = createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`))
  }

  return {
    issuer,
    jwks: cachedJwks
  }
}

function getBearerToken(authorization?: string) {
  if (!authorization?.startsWith("Bearer ")) {
    console.error("[user-api] unauthorized", {
      reason: "missing bearer authorization header"
    })
    throw new UnauthorizedError()
  }

  const token = authorization.slice("Bearer ".length).trim()

  if (!token) {
    console.error("[user-api] unauthorized", {
      reason: "empty bearer token"
    })
    throw new UnauthorizedError()
  }

  return token
}

function hasAdminRole(payload: RolePayload) {
  const roles = payload.realm_access?.roles

  return Array.isArray(roles) && roles.includes(adminRole)
}

export async function requireAdminToken(authorization?: string) {
  const token = getBearerToken(authorization)

  try {
    const { issuer, jwks } = getJwks()
    const { payload } = await jwtVerify(token, jwks, {
      issuer
    })
    const rolePayload = payload as RolePayload

    if (!rolePayload.sub || typeof rolePayload.sub !== "string") {
      console.error("[user-api] unauthorized", {
        reason: "token payload missing sub"
      })
      throw new UnauthorizedError()
    }

    if (!hasAdminRole(rolePayload)) {
      throw new ForbiddenError()
    }

    return rolePayload.sub
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      throw error
    }

    console.error("[user-api] unauthorized", {
      reason: "jwt verification failed",
      issuer: getIssuer(),
      message: error instanceof Error ? error.message : String(error)
    })

    throw new UnauthorizedError()
  }
}
