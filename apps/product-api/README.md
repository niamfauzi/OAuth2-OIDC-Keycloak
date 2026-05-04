# Product API

Product API sederhana dengan Bun + Elysia untuk tahap auth dan endpoint product dasar.

Endpoint yang tersedia:

- `GET /health`
- `GET /products`
- `POST /products`

## Install dan Run

1. Pastikan root `.env` sudah ada.
2. Masuk ke folder `apps/product-api`.
3. Jalankan `bun install`.
4. Jalankan `bun run dev`.
5. API berjalan di `http://localhost:7012`.

Port default diambil dari `PRODUCT_API_PORT`. CORS dibuka minimal untuk frontend lokal di `http://localhost:7011` berdasarkan `WEB_PORT`.

## Auth

Endpoint `/products` butuh header:

```text
Authorization: Bearer <access_token>
```

Untuk tahap ini backend membaca payload JWT secara sederhana dan mengambil claim `sub` sebagai `user_id`.

## Ambil Access Token untuk Testing

Contoh ambil token dari Keycloak local:

```bash
curl -X POST http://localhost:7070/realms/demo-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=nuxt-app" \
  -d "username=demo" \
  -d "password=demo123" \
  -d "scope=openid"
```

Ambil nilai `access_token` dari response, lalu pakai di contoh curl berikut.

## Contoh Curl

`GET /health`

```bash
curl http://localhost:7012/health
```

`GET /products` tanpa token

```bash
curl http://localhost:7012/products
```

`GET /products` dengan token

```bash
curl http://localhost:7012/products \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

`POST /products` dengan token

```bash
curl -X POST http://localhost:7012/products \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product A",
    "price": 10000
  }'
```

`POST /products` bad request

```bash
curl -X POST http://localhost:7012/products \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "price": 0
  }'
```
