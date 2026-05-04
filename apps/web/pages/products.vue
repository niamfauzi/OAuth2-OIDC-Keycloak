<script setup lang="ts">
type Product = {
  id: number
  name: string
  price: number
  created_by: string
}

type ProductsResponse = {
  items: Product[]
}

type CreateProductResponse = {
  message: string
  data: Product
}

const config = useRuntimeConfig()
const accessToken = useCookie<string | null>("access_token", {
  sameSite: "lax",
  secure: false,
  default: () => null
})

const items = ref<Product[]>([])
const name = ref("")
const price = ref<number | null>(null)
const errorMessage = ref("")
const isLoading = ref(true)
const isSubmitting = ref(false)

async function loadProducts() {
  if (!accessToken.value) {
    items.value = []
    errorMessage.value = "unauthorized"
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ""

  try {
    const response = await $fetch<ProductsResponse>(`${config.public.productApiBaseUrl}/products`, {
      headers: {
        Authorization: `Bearer ${accessToken.value}`
      }
    })

    items.value = response.items
  } catch (error) {
    items.value = []

    if (isUnauthorizedError(error)) {
      errorMessage.value = "unauthorized"
    } else {
      errorMessage.value = "request gagal"
    }
  } finally {
    isLoading.value = false
  }
}

async function submitProduct() {
  if (!accessToken.value) {
    errorMessage.value = "unauthorized"
    return
  }

  const trimmedName = name.value.trim()
  if (!trimmedName || !Number.isInteger(price.value) || Number(price.value) <= 0) {
    errorMessage.value = "request gagal"
    return
  }

  isSubmitting.value = true
  errorMessage.value = ""

  try {
    await $fetch<CreateProductResponse>(`${config.public.productApiBaseUrl}/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.value}`
      },
      body: {
        name: trimmedName,
        price: Number(price.value)
      }
    })

    name.value = ""
    price.value = null

    await loadProducts()
  } catch (error) {
    if (isUnauthorizedError(error)) {
      errorMessage.value = "unauthorized"
    } else {
      errorMessage.value = "request gagal"
    }
  } finally {
    isSubmitting.value = false
  }
}

function isUnauthorizedError(error: unknown) {
  return typeof error === "object" && error !== null && "statusCode" in error && error.statusCode === 401
}

onMounted(() => {
  void loadProducts()
})
</script>

<template>
  <main class="page">
    <div class="panel">
      <h1>Products</h1>
      <p class="description">
        Halaman sederhana untuk melihat dan menambah product lewat Product API.
      </p>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-else-if="isLoading">Memuat products...</p>

      <form class="form" @submit.prevent="submitProduct">
        <label>
          <span>Name</span>
          <input v-model="name" type="text" placeholder="Product A" />
        </label>

        <label>
          <span>Price</span>
          <input v-model.number="price" type="number" min="1" placeholder="10000" />
        </label>

        <button type="submit" :disabled="isSubmitting || !accessToken">
          {{ isSubmitting ? "Menyimpan..." : "Tambah Product" }}
        </button>
      </form>

      <div class="list">
        <h2>List Product</h2>
        <p v-if="!errorMessage && !isLoading && items.length === 0">Belum ada product.</p>

        <ul v-else>
          <li v-for="product in items" :key="product.id">
            <strong>{{ product.name }}</strong>
            <span>ID: {{ product.id }}</span>
            <span>Price: {{ product.price }}</span>
            <span>Created By: {{ product.created_by }}</span>
          </li>
        </ul>
      </div>
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
  width: min(100%, 720px);
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

.error {
  margin: 20px 0 0;
  color: #b91c1c;
}

.form {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

label {
  display: grid;
  gap: 8px;
}

input {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 12px 14px;
  font: inherit;
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

.list {
  margin-top: 32px;
}

ul {
  display: grid;
  gap: 12px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  gap: 4px;
  padding: 16px;
  border-radius: 12px;
  background: #e5e7eb;
}
</style>
