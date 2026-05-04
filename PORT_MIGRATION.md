# Port Migration Guide

Dokumen ini menjelaskan migrasi port lokal agar stack OAuth2/OIDC tidak berbenturan dengan aplikasi lain di mesin development.

## Target Port Baru

| Service | Port Lama | Port Baru |
| --- | ---: | ---: |
| Web Nuxt | `3000` | `7011` |
| Product API | `3001` | `7012` |
| Transaction API | `3002` | `7013` |
| Keycloak | `8080` | `7070` |

## File yang Perlu Disesuaikan

- `.env`: sumber konfigurasi lokal yang dipakai saat menjalankan service.
- `.env.example`: template konfigurasi agar setup contributor baru memakai port yang sama.
- `docker-compose.yml`: mapping port Keycloak harus mengikuti `KEYCLOAK_PORT`.
- `apps/product-api/src/index.ts`: fallback `PRODUCT_API_PORT` dan `WEB_PORT` perlu konsisten jika env tidak tersedia.
- `apps/transaction-api/main.go`: fallback `TRANSACTION_API_PORT` dan `WEB_PORT` perlu konsisten jika env tidak tersedia.
- `README.md`: tabel port dan instruksi local development harus mencerminkan port baru.
- `apps/*/README.md`, `infra/*/README.md`, dan `docs/`: cek referensi hardcoded seperti `localhost:3000`, `localhost:3001`, `localhost:3002`, dan `localhost:8080`.

## Nilai Environment Baru

Gunakan nilai berikut di `.env` dan `.env.example`:

```env
WEB_PORT=7011
PRODUCT_API_PORT=7012
TRANSACTION_API_PORT=7013
KEYCLOAK_PORT=7070
```

## Urutan Migrasi Aman

1. Hentikan container lama:

```bash
docker compose down
```

2. Ubah konfigurasi port di file yang relevan.

3. Jalankan ulang infrastruktur:

```bash
make infra-up
```

4. Jalankan service aplikasi di terminal terpisah:

```bash
make run-product
make run-transaction
make run-web
```

Jangan gunakan `docker compose down -v` kecuali memang ingin menghapus volume database dan data Keycloak/PostgreSQL lokal.

## Validasi Setelah Migrasi

- Web dapat diakses di `http://localhost:7011`.
- Product API health check dapat diakses di `http://localhost:7012/health`.
- Transaction API health check dapat diakses di `http://localhost:7013/health`.
- Keycloak dapat diakses di `http://localhost:7070`.
- Login OIDC tetap berhasil dari web app.
- Halaman `/products` dan `/transactions` tetap dapat mengambil data dari API.

## Catatan Keycloak

Jika Keycloak client memiliki redirect URI atau web origin hardcoded, sesuaikan dari port lama ke port baru:

```text
http://localhost:3000/*
```

menjadi:

```text
http://localhost:7011/*
```

Pastikan konfigurasi client Keycloak, environment frontend, dan CORS API memakai origin web yang sama.
