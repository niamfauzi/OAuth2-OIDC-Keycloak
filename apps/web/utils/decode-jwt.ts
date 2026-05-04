type JwtPayload = {
  sub?: string
  preferred_username?: string
  realm_access?: {
    roles?: string[]
  }
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")

  if (typeof atob === "function") {
    return atob(padded)
  }

  return Buffer.from(padded, "base64").toString("utf-8")
}

export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split(".")

  if (parts.length < 2) {
    return null
  }

  try {
    const decodedPayload = decodeBase64Url(parts[1])
    const payload = JSON.parse(decodedPayload) as JwtPayload

    return {
      sub: payload.sub,
      preferred_username: payload.preferred_username,
      realm_access: payload.realm_access
    }
  } catch {
    return null
  }
}
