<script setup lang="ts">
type Transaction = {
  id: number
  product_id: number
  qty: number
  total_price: number
  created_by: string
}

type Product = {
  id: number
  name: string
  price: number
  created_by: string
}

type TransactionsResponse = {
  items: Transaction[]
}

type ProductsResponse = {
  items: Product[]
}

type CreateTransactionResponse = {
  message: string
  data: Transaction
}

const config = useRuntimeConfig()
const accessToken = useCookie<string | null>("access_token", {
  sameSite: "lax",
  secure: false,
  default: () => null
})

const items = ref<Transaction[]>([])
const products = ref<Product[]>([])
const productId = ref<number | null>(null)
const qty = ref<number | null>(null)
const createdTransaction = ref<Transaction | null>(null)
const errorMessage = ref("")
const productMessage = ref("")
const isLoadingTransactions = ref(true)
const isLoadingProducts = ref(true)
const isSubmitting = ref(false)

const selectedProduct = computed(() => {
  if (!Number.isInteger(productId.value)) {
    return null
  }

  return products.value.find((product) => product.id === Number(productId.value)) ?? null
})

const totalPrice = computed(() => {
  if (!selectedProduct.value || !Number.isInteger(qty.value) || Number(qty.value) <= 0) {
    return 0
  }

  return selectedProduct.value.price * Number(qty.value)
})

const isLoading = computed(() => isLoadingTransactions.value || isLoadingProducts.value)
const canSubmit = computed(() => {
  return Boolean(accessToken.value) &&
    !isSubmitting.value &&
    Boolean(selectedProduct.value) &&
    Number.isInteger(qty.value) &&
    Number(qty.value) > 0 &&
    totalPrice.value > 0
})

async function loadProducts() {
  if (!accessToken.value) {
    products.value = []
    errorMessage.value = "unauthorized"
    isLoadingProducts.value = false
    return
  }

  isLoadingProducts.value = true
  productMessage.value = ""

  try {
    const response = await $fetch<ProductsResponse>(`${config.public.productApiBaseUrl}/products`, {
      headers: {
        Authorization: `Bearer ${accessToken.value}`
      }
    })

    products.value = response.items
    productMessage.value = response.items.length === 0
      ? "Belum ada product. Buat product dulu di halaman Products."
      : ""
  } catch (error) {
    products.value = []

    if (isUnauthorizedError(error)) {
      errorMessage.value = "unauthorized"
    } else {
      productMessage.value = "request product gagal"
    }
  } finally {
    isLoadingProducts.value = false
  }
}

async function loadTransactions() {
  if (!accessToken.value) {
    items.value = []
    errorMessage.value = "unauthorized"
    isLoadingTransactions.value = false
    return
  }

  isLoadingTransactions.value = true
  errorMessage.value = ""

  try {
    const response = await $fetch<TransactionsResponse>(`${config.public.transactionApiBaseUrl}/transactions`, {
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
    isLoadingTransactions.value = false
  }
}

async function submitTransaction() {
  if (!accessToken.value) {
    errorMessage.value = "unauthorized"
    return
  }

  if (
    !Number.isInteger(productId.value) ||
    Number(productId.value) <= 0 ||
    !Number.isInteger(qty.value) ||
    Number(qty.value) <= 0 ||
    Number(totalPrice.value) <= 0
  ) {
    errorMessage.value = "request gagal"
    return
  }

  isSubmitting.value = true
  errorMessage.value = ""

  try {
    const response = await $fetch<CreateTransactionResponse>(
      `${config.public.transactionApiBaseUrl}/transactions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken.value}`
        },
        body: {
          product_id: Number(productId.value),
          qty: Number(qty.value),
          total_price: Number(totalPrice.value)
        }
      }
    )

    createdTransaction.value = response.data
    productId.value = null
    qty.value = null

    await loadTransactions()
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
  void Promise.all([loadProducts(), loadTransactions()])
})
</script>

<template>
  <main class="page">
    <div class="panel">
      <h1>Transactions</h1>
      <p class="description">
        Halaman sederhana untuk melihat dan menambah transaction lewat Transaction API.
      </p>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-else-if="isLoading">Memuat transactions...</p>

      <form class="form" @submit.prevent="submitTransaction">
        <label>
          <span>Product</span>
          <select v-model="productId" :disabled="products.length === 0 || !accessToken">
            <option :value="null" disabled>Pilih product</option>
            <option v-for="product in products" :key="product.id" :value="product.id">
              {{ product.name }} - Rp {{ product.price }}
            </option>
          </select>
          <small v-if="productMessage">{{ productMessage }}</small>
        </label>

        <label>
          <span>Qty</span>
          <input v-model.number="qty" type="number" min="1" placeholder="2" />
        </label>

        <label>
          <span>Total Price</span>
          <input :value="totalPrice" type="number" min="0" readonly />
        </label>

        <button type="submit" :disabled="!canSubmit">
          {{ isSubmitting ? "Menyimpan..." : "Tambah Transaction" }}
        </button>
      </form>

      <div v-if="createdTransaction" class="result">
        <h2>Transaction Terakhir Dibuat</h2>
        <p>ID: {{ createdTransaction.id }}</p>
        <p>Product ID: {{ createdTransaction.product_id }}</p>
        <p>Qty: {{ createdTransaction.qty }}</p>
        <p>Total Price: {{ createdTransaction.total_price }}</p>
        <p>Created By: {{ createdTransaction.created_by }}</p>
      </div>

      <div class="list">
        <h2>List Transaction</h2>
        <p v-if="!errorMessage && !isLoadingTransactions && items.length === 0">Belum ada transaction.</p>

        <ul v-else-if="!errorMessage && !isLoadingTransactions">
          <li v-for="transaction in items" :key="transaction.id">
            <strong>Transaction #{{ transaction.id }}</strong>
            <span>Product ID: {{ transaction.product_id }}</span>
            <span>Qty: {{ transaction.qty }}</span>
            <span>Total Price: {{ transaction.total_price }}</span>
            <span>Created By: {{ transaction.created_by }}</span>
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

input,
select {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 12px 14px;
  font: inherit;
}

input[readonly] {
  background: #f3f4f6;
}

small {
  color: #6b7280;
  line-height: 1.4;
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

.result,
.list {
  margin-top: 32px;
}

.result {
  padding: 20px;
  border-radius: 14px;
  background: #eef2ff;
}

.result p {
  margin: 8px 0 0;
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
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #f9fafb;
}
</style>
