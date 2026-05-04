<script setup lang="ts">
import { decodeJwt } from "../utils/decode-jwt"

type User = {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  enabled: boolean
}

type UsersResponse = {
  items: User[]
}

type UserResponse = {
  message: string
  data: User
}

const config = useRuntimeConfig()
const accessToken = useCookie<string | null>("access_token", {
  sameSite: "lax",
  secure: false,
  default: () => null
})

const items = ref<User[]>([])
const createUsername = ref("")
const createEmail = ref("")
const createFirstName = ref("")
const createLastName = ref("")
const createEnabled = ref(true)
const createTemporaryPassword = ref("")
const selectedUserId = ref("")
const updateEmail = ref("")
const updateFirstName = ref("")
const updateLastName = ref("")
const updateEnabled = ref(true)
const errorMessage = ref("")
const successMessage = ref("")
const isLoading = ref(true)
const isCreating = ref(false)
const isUpdating = ref(false)

const profile = computed(() => {
  if (!accessToken.value) {
    return null
  }

  return decodeJwt(accessToken.value)
})

const isAdmin = computed(() => {
  const roles = profile.value?.realm_access?.roles

  return Array.isArray(roles) && roles.includes("app_admin")
})

const selectedUser = computed(() => {
  return items.value.find((user) => user.id === selectedUserId.value) ?? null
})

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${accessToken.value}`
  }
}

async function loadUsers() {
  if (!accessToken.value) {
    items.value = []
    errorMessage.value = "unauthorized"
    isLoading.value = false
    return
  }

  if (!isAdmin.value) {
    items.value = []
    errorMessage.value = "forbidden"
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ""

  try {
    const response = await $fetch<UsersResponse>(`${config.public.userApiBaseUrl}/users`, {
      headers: getAuthHeaders()
    })

    items.value = response.items
  } catch (error) {
    items.value = []
    errorMessage.value = getRequestErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

async function submitCreateUser() {
  if (!accessToken.value) {
    errorMessage.value = "unauthorized"
    return
  }

  if (!isAdmin.value) {
    errorMessage.value = "forbidden"
    return
  }

  const username = createUsername.value.trim()
  const email = createEmail.value.trim()
  const firstName = createFirstName.value.trim()
  const lastName = createLastName.value.trim()
  const temporaryPassword = createTemporaryPassword.value.trim()

  if (!username || !email || !firstName || !lastName || !temporaryPassword) {
    errorMessage.value = "request gagal"
    return
  }

  isCreating.value = true
  errorMessage.value = ""
  successMessage.value = ""

  try {
    await $fetch<UserResponse>(`${config.public.userApiBaseUrl}/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: {
        username,
        email,
        firstName,
        lastName,
        enabled: createEnabled.value,
        temporaryPassword
      }
    })

    createUsername.value = ""
    createEmail.value = ""
    createFirstName.value = ""
    createLastName.value = ""
    createEnabled.value = true
    createTemporaryPassword.value = ""
    successMessage.value = "user berhasil dibuat"

    await loadUsers()
  } catch (error) {
    errorMessage.value = getRequestErrorMessage(error)
  } finally {
    isCreating.value = false
  }
}

async function submitUpdateUser() {
  if (!accessToken.value) {
    errorMessage.value = "unauthorized"
    return
  }

  if (!isAdmin.value) {
    errorMessage.value = "forbidden"
    return
  }

  const id = selectedUserId.value.trim()
  const email = updateEmail.value.trim()
  const firstName = updateFirstName.value.trim()
  const lastName = updateLastName.value.trim()

  if (!id || !email || !firstName || !lastName) {
    errorMessage.value = "request gagal"
    return
  }

  isUpdating.value = true
  errorMessage.value = ""
  successMessage.value = ""

  try {
    await $fetch<UserResponse>(`${config.public.userApiBaseUrl}/users/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: {
        email,
        firstName,
        lastName,
        enabled: updateEnabled.value
      }
    })

    successMessage.value = "user berhasil diupdate"
    await loadUsers()
  } catch (error) {
    errorMessage.value = getRequestErrorMessage(error)
  } finally {
    isUpdating.value = false
  }
}

function selectUser(user: User) {
  selectedUserId.value = user.id
  updateEmail.value = user.email
  updateFirstName.value = user.firstName
  updateLastName.value = user.lastName
  updateEnabled.value = user.enabled
  successMessage.value = ""
  errorMessage.value = ""
}

function getRequestErrorMessage(error: unknown) {
  if (isStatusError(error, 401)) {
    return "unauthorized"
  }

  if (isStatusError(error, 403)) {
    return "forbidden"
  }

  return "request gagal"
}

function isStatusError(error: unknown, statusCode: number) {
  return typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === statusCode
}

onMounted(() => {
  void loadUsers()
})
</script>

<template>
  <main class="page">
    <div class="panel">
      <h1>Users</h1>
      <p class="description">
        Halaman admin sederhana untuk mengelola user Keycloak lewat User Management API.
      </p>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-else-if="successMessage" class="success">{{ successMessage }}</p>
      <p v-else-if="isLoading">Memuat users...</p>

      <section v-if="isAdmin" class="section">
        <h2>Create User</h2>
        <form class="form" @submit.prevent="submitCreateUser">
          <label>
            <span>Username</span>
            <input v-model="createUsername" type="text" placeholder="newuser" />
          </label>

          <label>
            <span>Email</span>
            <input v-model="createEmail" type="email" placeholder="newuser@example.com" />
          </label>

          <label>
            <span>First Name</span>
            <input v-model="createFirstName" type="text" placeholder="New" />
          </label>

          <label>
            <span>Last Name</span>
            <input v-model="createLastName" type="text" placeholder="User" />
          </label>

          <label class="checkbox-label">
            <input v-model="createEnabled" type="checkbox" />
            <span>Enabled</span>
          </label>

          <label>
            <span>Temporary Password</span>
            <input v-model="createTemporaryPassword" type="password" placeholder="password-local-dev" />
          </label>

          <button type="submit" :disabled="isCreating || !accessToken">
            {{ isCreating ? "Menyimpan..." : "Tambah User" }}
          </button>
        </form>
      </section>

      <section v-if="isAdmin" class="section">
        <h2>Update User</h2>
        <p v-if="!selectedUser" class="muted">Pilih user dari list untuk update data.</p>

        <form class="form" @submit.prevent="submitUpdateUser">
          <label>
            <span>User</span>
            <input :value="selectedUser ? selectedUser.username : ''" type="text" readonly placeholder="Belum dipilih" />
          </label>

          <label>
            <span>Email</span>
            <input v-model="updateEmail" type="email" placeholder="updated@example.com" />
          </label>

          <label>
            <span>First Name</span>
            <input v-model="updateFirstName" type="text" placeholder="Updated" />
          </label>

          <label>
            <span>Last Name</span>
            <input v-model="updateLastName" type="text" placeholder="User" />
          </label>

          <label class="checkbox-label">
            <input v-model="updateEnabled" type="checkbox" />
            <span>Enabled</span>
          </label>

          <button type="submit" :disabled="isUpdating || !selectedUserId">
            {{ isUpdating ? "Mengupdate..." : "Update User" }}
          </button>
        </form>
      </section>

      <section v-if="isAdmin" class="section">
        <h2>List User</h2>
        <p v-if="!errorMessage && !isLoading && items.length === 0">Belum ada user.</p>

        <ul v-else-if="!errorMessage && !isLoading">
          <li v-for="user in items" :key="user.id">
            <div>
              <strong>{{ user.username }}</strong>
              <span>{{ user.email || "-" }}</span>
              <span>{{ user.firstName }} {{ user.lastName }}</span>
              <span>Status: {{ user.enabled ? "enabled" : "disabled" }}</span>
              <span>ID: {{ user.id }}</span>
            </div>

            <button type="button" @click="selectUser(user)">
              Edit
            </button>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  background: #f5f7fb;
  color: #1f2937;
  font-family: sans-serif;
}

.panel {
  width: min(100%, 840px);
  margin: 0 auto;
  padding: 32px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
}

h1,
h2 {
  margin: 0;
}

.description {
  margin: 12px 0 0;
  line-height: 1.5;
}

.section {
  margin-top: 32px;
}

.error {
  margin: 20px 0 0;
  color: #b91c1c;
}

.success {
  margin: 20px 0 0;
  color: #047857;
}

.muted {
  margin: 12px 0 0;
  color: #6b7280;
}

.form {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}

label {
  display: grid;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

input {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 12px 14px;
  font: inherit;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  padding: 0;
}

button {
  width: fit-content;
  border: 0;
  border-radius: 10px;
  padding: 12px 18px;
  background: #111827;
  color: #ffffff;
  font: inherit;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

ul {
  display: grid;
  gap: 12px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: #e5e7eb;
}

li div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

li span {
  overflow-wrap: anywhere;
}
</style>
