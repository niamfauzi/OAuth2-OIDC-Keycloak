export type User = {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  enabled: boolean
}

export type CreateUserInput = {
  username: string
  email: string
  firstName: string
  lastName: string
  enabled: boolean
  temporaryPassword: string
}

export type UpdateUserInput = {
  email: string
  firstName: string
  lastName: string
  enabled: boolean
}

type KeycloakUser = {
  id?: string
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  enabled?: boolean
}

export class BadRequestError extends Error {}

async function buildKeycloakErrorMessage(response: Response, action: string) {
  const body = await response.text().catch(() => "")
  const trimmedBody = body.trim()
  const bodyMessage = trimmedBody ? ` body=${trimmedBody.slice(0, 1000)}` : ""

  return `${action}: status=${response.status} statusText=${response.statusText} url=${response.url}${bodyMessage}`
}

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

function getKeycloakConfig() {
  const baseUrl = trimTrailingSlash(getRequiredEnv("KEYCLOAK_BASE_URL"))
  const realm = getRequiredEnv("KEYCLOAK_REALM")

  return {
    baseUrl,
    realm,
    tokenUrl: `${baseUrl}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token`,
    adminUsersUrl: `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/users`
  }
}

function mapUser(user: KeycloakUser): User {
  return {
    id: String(user.id || ""),
    username: String(user.username || ""),
    email: String(user.email || ""),
    firstName: String(user.firstName || ""),
    lastName: String(user.lastName || ""),
    enabled: Boolean(user.enabled)
  }
}

function extractCreatedUserId(location: string | null) {
  if (!location) {
    return ""
  }

  const parts = location.split("/")

  return parts[parts.length - 1] || ""
}

async function getAdminAccessToken() {
  const { tokenUrl } = getKeycloakConfig()
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: getRequiredEnv("KEYCLOAK_ADMIN_CLIENT_ID"),
    client_secret: getRequiredEnv("KEYCLOAK_ADMIN_CLIENT_SECRET")
  })

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  })

  if (!response.ok) {
    throw new Error(await buildKeycloakErrorMessage(response, "failed to get keycloak admin token"))
  }

  const data = await response.json() as { access_token?: string }

  if (!data.access_token) {
    throw new Error("keycloak admin token response missing access_token")
  }

  return data.access_token
}

async function fetchAdmin(path: string, init: RequestInit = {}) {
  const token = await getAdminAccessToken()
  const headers = new Headers(init.headers)

  headers.set("Authorization", `Bearer ${token}`)

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(path, {
    ...init,
    headers
  })
}

export async function listUsers() {
  const { adminUsersUrl } = getKeycloakConfig()
  const response = await fetchAdmin(adminUsersUrl)

  if (!response.ok) {
    throw new Error(await buildKeycloakErrorMessage(response, "failed to list keycloak users"))
  }

  const users = await response.json() as KeycloakUser[]

  return users.map((user) => mapUser(user))
}

export async function getUser(id: string) {
  const { adminUsersUrl } = getKeycloakConfig()
  const response = await fetchAdmin(`${adminUsersUrl}/${encodeURIComponent(id)}`)

  if (response.status === 404) {
    throw new BadRequestError()
  }

  if (!response.ok) {
    throw new Error(await buildKeycloakErrorMessage(response, "failed to get keycloak user"))
  }

  const user = await response.json() as KeycloakUser

  return mapUser(user)
}

export async function createUser(input: CreateUserInput) {
  const { adminUsersUrl } = getKeycloakConfig()
  const response = await fetchAdmin(adminUsersUrl, {
    method: "POST",
    body: JSON.stringify({
      username: input.username,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      enabled: input.enabled,
      credentials: [
        {
          type: "password",
          value: input.temporaryPassword,
          temporary: true
        }
      ]
    })
  })

  if (response.status === 400 || response.status === 409) {
    throw new BadRequestError()
  }

  if (!response.ok) {
    throw new Error(await buildKeycloakErrorMessage(response, "failed to create keycloak user"))
  }

  const createdUserId = extractCreatedUserId(response.headers.get("Location"))

  if (!createdUserId) {
    throw new Error("created keycloak user id is missing")
  }

  return getUser(createdUserId)
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const { adminUsersUrl } = getKeycloakConfig()
  const currentUser = await getUser(id)
  const response = await fetchAdmin(`${adminUsersUrl}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({
      username: currentUser.username,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      enabled: input.enabled
    })
  })

  if (response.status === 400 || response.status === 404 || response.status === 409) {
    throw new BadRequestError()
  }

  if (!response.ok) {
    throw new Error(await buildKeycloakErrorMessage(response, "failed to update keycloak user"))
  }

  return getUser(id)
}
