<script setup lang="ts">
import { decodeJwt } from "../utils/decode-jwt"

const accessToken = useCookie<string | null>("access_token", {
  sameSite: "lax",
  secure: false,
  default: () => null
})

const profile = computed(() => {
  if (!accessToken.value) {
    return null
  }

  return decodeJwt(accessToken.value)
})
</script>

<template>
  <main class="page">
    <div class="panel">
      <h1>Profile</h1>
      <p v-if="!accessToken">Belum login.</p>
      <p v-else-if="!profile">Token tidak valid.</p>
      <pre v-else>{{ JSON.stringify({
        user_id: profile.sub,
        preferred_username: profile.preferred_username
      }, null, 2) }}</pre>
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
  width: min(100%, 560px);
  padding: 32px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
}

h1 {
  margin: 0 0 12px;
}

p,
pre {
  margin: 0;
  line-height: 1.5;
}

pre {
  overflow-x: auto;
  padding: 16px;
  border-radius: 12px;
  background: #e5e7eb;
}
</style>
