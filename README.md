# OAuth2-OIDC-Keycloak

Project ini adalah project belajar OAuth2/OIDC yang sengaja dibuat sederhana agar mudah dipahami junior. Stack utamanya:

- `apps/web`: Nuxt 3
- `apps/product-api`: Bun + Elysia
- `apps/transaction-api`: Go
- `apps/user-api`: Bun + Elysia untuk User Management API mulai Tahap 11
- `keycloak`: OIDC provider lokal
- `postgres`: database aplikasi

## Struktur Folder

```text
.
├── apps/
│   ├── web/
│   ├── product-api/
│   ├── transaction-api/
│   └── user-api/            # mulai Tahap 11
├── infra/
│   ├── docker/
│   └── keycloak/
├── migrations/
├── docs/
│   ├── SIMPLE_ARCHITECTURE_GUIDE.md
│   └── prompt/
├── .env.example
├── Makefile
├── docker-compose.yml
└── README.md
```

## Menjalankan Service Dasar

1. Salin `.env.example` menjadi `.env`.
2. Jalankan `docker compose up -d postgres keycloak`.
3. Buka Keycloak di `http://localhost:7070`.

## Service dan Port

| Service | Peran | Port |
| --- | --- | --- |
| `web` | Nuxt frontend placeholder | `7011` |
| `product-api` | API product placeholder | `7012` |
| `transaction-api` | API transaction placeholder | `7013` |
| `user-api` | API admin user management mulai Tahap 11 | `7014` |
| `keycloak` | OIDC provider lokal | `7070` |
| `postgres` | Database aplikasi | `5432` |

## Endpoint Target

| Service | Method | Path |
| --- | --- | --- |
| `web` | `GET` | `/login` |
| `web` | `GET` | `/auth/callback` |
| `web` | `GET` | `/profile` |
| `web` | `GET` | `/products` |
| `web` | `GET` | `/transactions` |
| `web` | `GET` | `/users` mulai Tahap 11 |
| `product-api` | `GET` | `/health` |
| `product-api` | `GET` | `/products` |
| `product-api` | `POST` | `/products` |
| `transaction-api` | `GET` | `/health` |
| `transaction-api` | `GET` | `/transactions` |
| `transaction-api` | `POST` | `/transactions` |
| `user-api` | `GET` | `/health` mulai Tahap 11 |
| `user-api` | `GET` | `/users` mulai Tahap 11 |
| `user-api` | `POST` | `/users` mulai Tahap 11 |
| `user-api` | `PUT` | `/users/:id` mulai Tahap 11 |

Mapping API dari Nuxt:

```text
/products      -> http://localhost:7012/products
/transactions  -> http://localhost:7013/transactions
/users         -> http://localhost:7014/users
```

## Daily Use

Prasyarat lokal:

- Docker + Docker Compose
- Bun
- Go
- Node.js + npm

Flow harian paling sederhana:

1. Buat file env:

```bash
cp .env.example .env
```

2. Nyalakan infra:

```bash
make infra-up
```

3. Apply migration:

```bash
make migrate
```

4. Jalankan service yang dibutuhkan, masing-masing di terminal terpisah:

```bash
make run-product
make run-transaction
make run-user
make run-web
```

Command yang paling sering dipakai:

- `make help`: lihat daftar command
- `make infra-up`: start `postgres` dan `keycloak`
- `make infra-down`: stop infra
- `make migrate`: apply SQL migration ke PostgreSQL
- `make db-shell`: buka `psql` ke database lokal
- `make run-product`: jalankan Product API
- `make run-transaction`: jalankan Transaction API
- `make run-user`: jalankan User Management API
- `make run-web`: jalankan Nuxt app
- `make install-product`: install dependency Product API
- `make install-user`: install dependency User Management API
- `make install-web`: install dependency Web app

Contoh urutan untuk development harian:

```bash
make infra-up
make migrate
make run-product
make run-transaction
make run-user
make run-web
```
