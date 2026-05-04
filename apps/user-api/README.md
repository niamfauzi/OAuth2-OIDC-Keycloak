# User Management API

User Management API sederhana dengan Bun + Elysia untuk admin user management melalui Keycloak Admin API.

Endpoint yang tersedia:

- `GET /health`
- `GET /users`
- `POST /users`
- `PUT /users/:id`

## Install dan Run

1. Pastikan root `.env` sudah ada.
2. Masuk ke folder `apps/user-api`.
3. Jalankan `bun install`.
4. Jalankan `bun run dev`.
5. API berjalan di `http://localhost:7014`.

Port default diambil dari `USER_API_PORT`. CORS dibuka minimal untuk frontend lokal di `http://localhost:7011` berdasarkan `WEB_PORT`.

## Auth

Endpoint `/users` butuh header:

```text
Authorization: Bearer <access_token>
```

Token divalidasi menggunakan JWKS Keycloak dan harus punya realm role `app_admin` pada claim `realm_access.roles`.

## Admin Token Keycloak

Service ini mengambil token admin lewat client credentials:

```text
grant_type=client_credentials
client_id=KEYCLOAK_ADMIN_CLIENT_ID
client_secret=KEYCLOAK_ADMIN_CLIENT_SECRET
```

Credential admin hanya dibaca dari env backend dan tidak diekspos ke Nuxt.

## Contoh Curl

`GET /health`

```bash
curl http://localhost:7014/health
```

`GET /users`

```bash
curl http://localhost:7014/users \
  -H "Authorization: Bearer ACCESS_TOKEN_ADMIN"
```

`POST /users`

```bash
curl -X POST http://localhost:7014/users \
  -H "Authorization: Bearer ACCESS_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "enabled": true,
    "temporaryPassword": "password-local-dev"
  }'
```

`PUT /users/:id`

```bash
curl -X PUT http://localhost:7014/users/KEYCLOAK_USER_ID \
  -H "Authorization: Bearer ACCESS_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updated@example.com",
    "firstName": "Updated",
    "lastName": "User",
    "enabled": true
  }'
```
