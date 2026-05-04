import { resolve } from "node:path"
import { config as loadEnv } from "dotenv"

loadEnv({ path: resolve(__dirname, "../../.env") })

export default defineNuxtConfig({
  devtools: { enabled: false },
  devServer: {
    port: Number(process.env.WEB_PORT || "7011")
  },
  runtimeConfig: {
    public: {
      productApiBaseUrl: process.env.PRODUCT_API_BASE_URL || "http://localhost:7012",
      transactionApiBaseUrl: process.env.TRANSACTION_API_BASE_URL || "http://localhost:7013",
      keycloakBaseUrl: process.env.KEYCLOAK_BASE_URL || "http://localhost:7070",
      keycloakRealm: process.env.KEYCLOAK_REALM || "demo-realm",
      keycloakClientId: process.env.KEYCLOAK_CLIENT_ID || "nuxt-app",
      keycloakRedirectUri:
        process.env.KEYCLOAK_REDIRECT_URI || "http://localhost:7011/auth/callback"
    }
  },
  compatibilityDate: "2024-07-11"
})
