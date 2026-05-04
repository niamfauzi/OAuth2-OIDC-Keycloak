# Transaction API

Transaction API sederhana dengan Go untuk tahap auth dan endpoint transaksi dasar.

Endpoint yang tersedia:

- `GET /health`
- `GET /transactions`
- `POST /transactions`

## Cara Run

1. Pastikan root `.env` sudah ada.
2. Masuk ke folder `apps/transaction-api`.
3. Jalankan `go run .`.
4. API berjalan di `http://localhost:7013`.

Port default diambil dari `TRANSACTION_API_PORT`. CORS dibuka minimal untuk frontend lokal di `http://localhost:7011` berdasarkan `WEB_PORT`.

## Auth

Endpoint `/transactions` butuh header:

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
curl http://localhost:7013/health
```

`GET /transactions` tanpa token

```bash
curl http://localhost:7013/transactions
```

`GET /transactions` dengan token

```bash
curl http://localhost:7013/transactions \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

`POST /transactions` dengan token

```bash
curl -X POST http://localhost:7013/transactions \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "qty": 2,
    "total_price": 20000
  }'
```

`POST /transactions` bad request

```bash
curl -X POST http://localhost:7013/transactions \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 0,
    "qty": 0,
    "total_price": 0
  }'
```
