<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const accessToken = useCookie<string | null>("access_token", {
  sameSite: "lax",
  secure: false,
  default: () => null
})

const errorMessage = ref("")
const isLoading = ref(true)

onMounted(async () => {
  const code = route.query.code

  if (typeof code !== "string" || !code) {
    errorMessage.value = "Authorization code tidak ditemukan."
    isLoading.value = false
    return
  }

  const tokenUrl = new URL(
    `/realms/${config.public.keycloakRealm}/protocol/openid-connect/token`,
    config.public.keycloakBaseUrl
  )

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.public.keycloakClientId,
    code,
    redirect_uri: config.public.keycloakRedirectUri
  })

  try {
    const response = await $fetch<{ access_token?: string }>(tokenUrl.toString(), {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })

    if (!response.access_token) {
      throw new Error("Access token tidak ditemukan pada response.")
    }

    accessToken.value = response.access_token
    await router.push("/profile")
  } catch {
    errorMessage.value = "Gagal menukar authorization code ke token."
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <main class="page">
    <div class="panel">
      <h1>Auth Callback</h1>
      <p v-if="isLoading">Sedang memproses login...</p>
      <p v-else-if="errorMessage">{{ errorMessage }}</p>
      <p v-else>Redirecting to profile...</p>
    </div>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f5f7fb;
  color: #1f2937;
  font-family: sans-serif;
}

.panel {
  width: min(100%, 420px);
  padding: 32px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
}

h1 {
  margin: 0 0 12px;
}

p {
  margin: 0;
  line-height: 1.5;
}
</style>
