<script setup lang="ts">
const config = useRuntimeConfig()

function loginWithKeycloak() {
  const authorizationUrl = new URL(
    `/realms/${config.public.keycloakRealm}/protocol/openid-connect/auth`,
    config.public.keycloakBaseUrl
  )

  authorizationUrl.searchParams.set("client_id", config.public.keycloakClientId)
  authorizationUrl.searchParams.set("redirect_uri", config.public.keycloakRedirectUri)
  authorizationUrl.searchParams.set("response_type", "code")
  authorizationUrl.searchParams.set("scope", "openid")

  window.location.href = authorizationUrl.toString()
}
</script>

<template>
  <main class="page">
    <div class="panel">
      <h1>Login</h1>
      <p>Tekan tombol di bawah untuk login lewat Keycloak.</p>
      <button type="button" @click="loginWithKeycloak">
        Login with Keycloak
      </button>
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
  margin: 0 0 20px;
  line-height: 1.5;
}

button {
  border: 0;
  border-radius: 10px;
  padding: 12px 18px;
  background: #111827;
  color: #ffffff;
  font: inherit;
  cursor: pointer;
}
</style>
