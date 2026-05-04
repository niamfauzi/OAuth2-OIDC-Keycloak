import { resolve } from "node:path"
import { config as loadEnv } from "dotenv"
import { cors } from "@elysiajs/cors"
import { Elysia, t } from "elysia"
import { ForbiddenError, requireAdminToken, UnauthorizedError } from "./auth"
import { BadRequestError, createUser, listUsers, updateUser } from "./keycloak-admin"

loadEnv({ path: resolve(import.meta.dir, "../../../.env") })

function envOrDefault(key: string, fallback: string) {
  const value = process.env[key]?.trim()

  return value ? value : fallback
}

function isBlank(value: string) {
  return value.trim().length === 0
}

function logInternalError(request: Request, code: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  console.error("[user-api] internal error", {
    code,
    method: request.method,
    url: request.url,
    message,
    stack
  })
}

const userApiPort = Number(process.env.USER_API_PORT || "7014")
const webPort = Number(envOrDefault("WEB_PORT", "7011"))
const webOrigin = `http://localhost:${webPort}`

const app = new Elysia()
  .use(
    cors({
      origin: webOrigin,
      methods: ["GET", "POST", "PUT", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"]
    })
  )
  .onError(({ code, error, request, set }) => {
    if (error instanceof UnauthorizedError) {
      set.status = 401
      return {
        message: "unauthorized"
      }
    }

    if (error instanceof ForbiddenError) {
      set.status = 403
      return {
        message: "forbidden"
      }
    }

    if (error instanceof BadRequestError || code === "VALIDATION" || code === "PARSE") {
      set.status = 400
      return {
        message: "bad request"
      }
    }

    logInternalError(request, code, error)

    set.status = 500
    return {
      message: "internal server error"
    }
  })
  .get("/health", () => ({
    ok: true,
    service: "user-api"
  }))
  .group("", (protectedApp) =>
    protectedApp
      .onBeforeHandle(async ({ headers }) => {
        await requireAdminToken(headers.authorization)
      })
      .get("/users", async () => {
        const users = await listUsers()

        return {
          items: users
        }
      })
      .post(
        "/users",
        async ({ body, set }) => {
          const username = body.username.trim()
          const email = body.email.trim()
          const firstName = body.firstName.trim()
          const lastName = body.lastName.trim()
          const temporaryPassword = body.temporaryPassword.trim()

          if (
            isBlank(username) ||
            isBlank(email) ||
            isBlank(firstName) ||
            isBlank(lastName) ||
            isBlank(temporaryPassword)
          ) {
            set.status = 400
            return {
              message: "bad request"
            }
          }

          const user = await createUser({
            username,
            email,
            firstName,
            lastName,
            enabled: body.enabled,
            temporaryPassword
          })

          set.status = 201
          return {
            message: "ok",
            data: user
          }
        },
        {
          body: t.Object({
            username: t.String(),
            email: t.String(),
            firstName: t.String(),
            lastName: t.String(),
            enabled: t.Boolean(),
            temporaryPassword: t.String()
          })
        }
      )
      .put(
        "/users/:id",
        async ({ body, params }) => {
          const id = params.id.trim()
          const email = body.email.trim()
          const firstName = body.firstName.trim()
          const lastName = body.lastName.trim()

          if (isBlank(id) || isBlank(email) || isBlank(firstName) || isBlank(lastName)) {
            throw new BadRequestError()
          }

          const user = await updateUser(id, {
            email,
            firstName,
            lastName,
            enabled: body.enabled
          })

          return {
            message: "ok",
            data: user
          }
        },
        {
          body: t.Object({
            email: t.String(),
            firstName: t.String(),
            lastName: t.String(),
            enabled: t.Boolean()
          })
        }
      )
  )
  .listen(userApiPort)

console.log(`user-api running at http://localhost:${userApiPort}`)

export type UserApiApp = typeof app
