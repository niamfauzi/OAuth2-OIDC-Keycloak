<script setup lang="ts">
const accessToken = useCookie<string | null>("access_token", {
  sameSite: "lax",
  secure: false,
  default: () => null
})

await navigateTo(accessToken.value ? "/profile" : "/login", {
  replace: true
})
</script>

<template>
  <main />
</template>
