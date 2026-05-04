<script setup lang="ts">
const route = useRoute()
const accessToken = useCookie<string | null>("access_token", {
  sameSite: "lax",
  secure: false,
  default: () => null
})

const navItems = [
  { label: "Profile", to: "/profile" },
  { label: "Products", to: "/products" },
  { label: "Order / Transaksi", to: "/transactions" }
]

const isLoggedIn = computed(() => Boolean(accessToken.value))

function isActiveRoute(path: string) {
  return route.path === path
}

async function logout() {
  accessToken.value = null
  await navigateTo("/login", { replace: true })
}
</script>

<template>
  <div>
    <header v-if="isLoggedIn" class="app-header">
      <nav class="app-nav" aria-label="Main navigation">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ active: isActiveRoute(item.to) }"
          :aria-current="isActiveRoute(item.to) ? 'page' : undefined"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <button class="logout-button" type="button" @click="logout">
        Logout
      </button>
    </header>

    <NuxtPage />
  </div>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
  background: #ffffff;
  font-family: sans-serif;
}

.app-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 0;
}

.nav-link {
  border-radius: 10px;
  padding: 10px 14px;
  color: #374151;
  text-decoration: none;
}

.nav-link:hover,
.nav-link.active {
  background: #111827;
  color: #ffffff;
}

.logout-button {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 14px;
  background: #ffffff;
  color: #374151;
  font: inherit;
  cursor: pointer;
}

.logout-button:hover {
  border-color: #111827;
  color: #111827;
}
</style>
