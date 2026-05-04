import { resolve } from "node:path"
import { config as loadEnv } from "dotenv"
import { cors } from "@elysiajs/cors"
import { Elysia, t } from "elysia"
import { decodeJwt } from "./utils/decode-jwt"

loadEnv({ path: resolve(import.meta.dir, "../../../.env") })

type Product = {
  id: number
  name: string
  price: number
  created_by: string
}

class UnauthorizedError extends Error {}

function envOrDefault(key: string, fallback: string) {
  const value = process.env[key]?.trim()

  return value ? value : fallback
}

function getUserIdFromAuthorization(authorization?: string) {
  if (!authorization?.startsWith("Bearer ")) {
    throw new UnauthorizedError()
  }

  const token = authorization.slice("Bearer ".length).trim()
  const payload = decodeJwt(token)

  if (!token || !payload?.sub || typeof payload.sub !== "string") {
    throw new UnauthorizedError()
  }

  return payload.sub
}

function getDatabaseUrl() {
  const host = envOrDefault("POSTGRES_HOST", "localhost")
  const port = envOrDefault("POSTGRES_PORT", "5432")
  const database = envOrDefault("POSTGRES_DB", "app_db")
  const username = envOrDefault("POSTGRES_USER", "app_user")
  const password = envOrDefault("POSTGRES_PASSWORD", "app_password")
  const sslmode = envOrDefault("POSTGRES_SSLMODE", "disable")
  const encodedUser = encodeURIComponent(username)
  const encodedPassword = encodeURIComponent(password)
  const encodedDatabase = encodeURIComponent(database)

  return `postgres://${encodedUser}:${encodedPassword}@${host}:${port}/${encodedDatabase}?sslmode=${sslmode}`
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: Number(row.id),
    name: String(row.name),
    price: Number(row.price),
    created_by: String(row.created_by)
  }
}

const productApiPort = Number(process.env.PRODUCT_API_PORT || "7012")
const webPort = Number(process.env.WEB_PORT || "7011")
const webOrigin = `http://localhost:${webPort}`
const sql = new Bun.SQL(getDatabaseUrl())

await sql.connect()

const app = new Elysia()
  .use(
    cors({
      origin: webOrigin,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"]
    })
  )
  .onError(({ code, error, set }) => {
    if (error instanceof UnauthorizedError) {
      set.status = 401
      return {
        message: "unauthorized"
      }
    }

    if (code === "VALIDATION" || code === "PARSE") {
      set.status = 400
      return {
        message: "bad request"
      }
    }

    set.status = 500
    return {
      message: "internal server error"
    }
  })
  .get("/health", () => ({
    ok: true,
    service: "product-api"
  }))
  .group("", (protectedApp) =>
    protectedApp
      .onBeforeHandle(({ headers }) => {
        getUserIdFromAuthorization(headers.authorization)
      })
      .get("/products", async () => {
        const rows = await sql`
          SELECT id, name, price, created_by
          FROM products
          ORDER BY id ASC
        `

        return {
          items: rows.map((row) => mapProduct(row as Record<string, unknown>))
        }
      })
      .post(
        "/products",
        async ({ body, headers, set }) => {
          const name = body.name.trim()
          const userId = getUserIdFromAuthorization(headers.authorization)

          if (!name || !Number.isInteger(body.price) || body.price <= 0) {
            set.status = 400
            return {
              message: "bad request"
            }
          }

          const rows = await sql`
            INSERT INTO products (name, price, created_by)
            VALUES (${name}, ${body.price}, ${userId})
            RETURNING id, name, price, created_by
          `
          const product = mapProduct(rows[0] as Record<string, unknown>)
          set.status = 201

          return {
            message: "ok",
            data: product
          }
        },
        {
          body: t.Object({
            name: t.String(),
            price: t.Number()
          })
        }
      )
  )
  .listen(productApiPort)

console.log(`product-api running at http://localhost:${productApiPort}`)

export type ProductApiApp = typeof app
